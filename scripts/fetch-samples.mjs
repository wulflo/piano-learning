#!/usr/bin/env node
/**
 * Descarga idempotente de muestras de audio.
 *
 * - `--dry-run`: valida el manifiesto y comprueba archivos locales sin usar red
 *   ni escribir nada.
 * - Modo real: descarga cada muestra, reanuda con HTTP Range, verifica tamaño y
 *   SHA-256 y recién entonces renombra el archivo final.
 *
 * Uso:
 *   node scripts/fetch-samples.mjs --dry-run
 *   node scripts/fetch-samples.mjs
 *   node scripts/fetch-samples.mjs --manifest assets/audio/manifest.json --out public/audio/samples
 */
import { createHash } from 'node:crypto'
import {
  createReadStream,
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
} from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const SampleSchema = z.object({
  note: z.string().regex(/^[A-G](?:#|b)?[0-9]$/),
  velocity: z.number().int().min(1).max(127),
  file: z.string().min(1),
  bytes: z.number().int().positive(),
  sha256: z.string().regex(/^[0-9a-f]{64}$/),
  author: z.string().min(1),
  source: z.string().min(1),
  license: z.string().min(1),
  licenseUrl: z.url(),
  modifications: z.string().min(1),
  sourceUrl: z.url(),
})

const ManifestSchema = z.object({
  version: z.literal(1),
  instrument: z.literal('salamander-grand-piano'),
  attribution: z.string().min(1),
  license: z.literal('CC-BY-3.0'),
  sourceUrl: z.url(),
  originUrl: z.url(),
  originRepository: z.url().optional(),
  expectedSamples: z.number().int().nonnegative(),
  samples: z.array(SampleSchema).default([]),
})

const args = process.argv.slice(2)

function flagValue(name) {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : undefined
}

if (args.includes('--help') || args.includes('-h')) {
  console.log(`Uso: node scripts/fetch-samples.mjs [opciones]

  --dry-run           Valida el manifiesto y los archivos locales sin red.
  --manifest <ruta>   Manifiesto alternativo (por defecto assets/audio/manifest.json).
  --out <ruta>        Carpeta de muestras (por defecto public/audio/samples).
  --help              Muestra esta ayuda.`)
  process.exit(0)
}

const dryRun = args.includes('--dry-run')
const manifestPath = resolve(
  ROOT,
  flagValue('--manifest') ?? 'assets/audio/manifest.json',
)
const outDir = resolve(ROOT, flagValue('--out') ?? 'public/audio/samples')

function hashFile(path) {
  return new Promise((resolveHash, reject) => {
    const hash = createHash('sha256')
    const stream = createReadStream(path)
    stream.on('data', (chunk) => hash.update(chunk))
    stream.on('end', () => resolveHash(hash.digest('hex')))
    stream.on('error', reject)
  })
}

async function verifyFile(path, sample) {
  if (!existsSync(path)) {
    return { ok: false, reason: 'no existe' }
  }
  const size = statSync(path).size
  if (size !== sample.bytes) {
    return { ok: false, reason: `tamaño ${size} != ${sample.bytes}` }
  }
  const digest = await hashFile(path)
  if (digest !== sample.sha256) {
    return { ok: false, reason: 'SHA-256 no coincide' }
  }
  return { ok: true, reason: 'ok' }
}

function safeFile(file) {
  if (basename(file) !== file || !/^[A-Za-z0-9._-]+$/.test(file)) {
    throw new Error(`Nombre de archivo inválido en el manifiesto: ${file}`)
  }
  return file
}

async function downloadSample(sample) {
  const dest = join(outDir, safeFile(sample.file))
  const part = `${dest}.part`

  if (existsSync(dest)) {
    const check = await verifyFile(dest, sample)
    if (check.ok) {
      return 'ya estaba'
    }
    console.warn(`  ${sample.file}: archivo final inválido (${check.reason}); se redescarga`)
    rmSync(dest)
  }

  let start = existsSync(part) ? statSync(part).size : 0
  if (start > sample.bytes) {
    rmSync(part)
    start = 0
  }

  const headers = start > 0 ? { Range: `bytes=${start}-` } : {}
  const response = await fetch(sample.sourceUrl, { headers })

  if (response.status === 416 && start > 0) {
    rmSync(part)
    return downloadSample(sample)
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} al descargar ${sample.file}`)
  }

  const resuming = response.status === 206 && start > 0
  const flags = resuming ? 'a' : 'w'

  if (!resuming && start > 0) {
    start = 0
  }

  await pipeline(Readable.fromWeb(response.body), createWriteStream(part, { flags }))

  const finalSize = statSync(part).size
  if (finalSize !== sample.bytes) {
    throw new Error(
      `Tamaño final ${finalSize} != ${sample.bytes} en ${sample.file}; se conserva ${basename(part)} para reanudar`,
    )
  }

  const digest = await hashFile(part)
  if (digest !== sample.sha256) {
    rmSync(part)
    throw new Error(`SHA-256 no coincide para ${sample.file}`)
  }

  renameSync(part, dest)
  return resuming ? 'reanudada' : 'descargada'
}

async function main() {
  let raw
  try {
    raw = JSON.parse(readFileSync(manifestPath, 'utf8'))
  } catch (error) {
    throw new Error(`No se pudo leer el manifiesto ${manifestPath}: ${error.message}`)
  }

  const parsed = ManifestSchema.safeParse(raw)
  if (!parsed.success) {
    console.error('Manifiesto inválido:')
    for (const issue of parsed.error.issues) {
      console.error(`  ${issue.path.join('.') || '(raíz)'}: ${issue.message}`)
    }
    process.exitCode = 1
    return
  }

  const manifest = parsed.data
  console.log(`Manifiesto: ${manifestPath}`)
  console.log(`Muestras declaradas: ${manifest.samples.length}/${manifest.expectedSamples}`)

  if (dryRun) {
    let present = 0
    let missing = Math.max(
      0,
      manifest.expectedSamples - manifest.samples.length,
    )
    let invalid = 0

    for (const sample of manifest.samples) {
      const path = join(outDir, safeFile(sample.file))
      const check = await verifyFile(path, sample)
      if (check.ok) {
        present += 1
      } else if (check.reason === 'no existe') {
        missing += 1
      } else {
        invalid += 1
        console.error(`  inválida · ${sample.file}: ${check.reason}`)
      }
    }

    if (manifest.samples.length < manifest.expectedSamples) {
      console.log(
        `Faltan ${manifest.expectedSamples - manifest.samples.length} entradas por declarar en el manifiesto.`,
      )
    }

    console.log(
      `Dry-run · presentes: ${present} · faltantes: ${missing} · inválidas: ${invalid}`,
    )
    console.log('Dry-run: no se usó red ni se escribió ningún archivo.')
    if (invalid > 0) process.exitCode = 1
    return
  }

  if (manifest.samples.length === 0) {
    console.error(
      'El manifiesto no declara muestras. Completá las entradas antes de descargar.',
    )
    process.exitCode = 1
    return
  }

  mkdirSync(outDir, { recursive: true })
  let downloaded = 0
  let skipped = 0

  for (const [index, sample] of manifest.samples.entries()) {
    const label = `[${index + 1}/${manifest.samples.length}] ${sample.note} v${sample.velocity} · ${sample.file}`
    process.stdout.write(`${label} ... `)
    try {
      const result = await downloadSample(sample)
      if (result === 'ya estaba') {
        skipped += 1
      } else {
        downloaded += 1
      }
      console.log(result)
    } catch (error) {
      console.error(`\n  error · ${error.message}`)
      process.exitCode = 1
      return
    }
  }

  console.log(
    `\nListo · descargadas/reanudadas: ${downloaded} · ya presentes: ${skipped} · total: ${manifest.samples.length}`,
  )
}

main().catch((error) => {
  console.error('Error inesperado:', error)
  process.exitCode = 1
})
