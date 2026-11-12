#!/usr/bin/env node
/**
 * F6-039 — Auditoría del manifiesto de audio.
 *
 * Verifica, sin red, que `assets/audio/manifest.json` esté completo:
 *   - cada muestra declara `author`, `source`, `license` (id SPDX),
 *     `licenseUrl` y `modifications`;
 *   - la licencia pertenece a la lista permitida;
 *   - el número de muestras coincide con `expectedSamples`;
 *   - no hay archivos repetidos.
 *
 * Si la carpeta de muestras existe, además comprueba que:
 *   - todo archivo presente está registrado en el manifiesto;
 *   - el tamaño y el SHA-256 de cada muestra registrada coinciden.
 *
 * Si la carpeta no existe (por ejemplo en un clon sin audio, porque las
 * muestras no se versionan), no falla: informa NO VERIFICABLE y sale con 0.
 *
 * Uso:
 *   node scripts/verify-audio.mjs
 *   node scripts/verify-audio.mjs --manifest assets/audio/manifest.json --samples public/audio/samples
 */
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/** Licencias aceptadas para las muestras de audio (identificadores SPDX). */
export const ALLOWED_LICENSES = Object.freeze([
  'CC0-1.0',
  'CC-BY-3.0',
  'CC-BY-4.0',
  'CC-BY-SA-3.0',
  'CC-BY-SA-4.0',
  'MIT',
  'Apache-2.0',
  'LicenseRef-PublicDomain',
])

export const SampleSchema = z.object({
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

export const ManifestSchema = z.object({
  version: z.literal(1),
  instrument: z.literal('salamander-grand-piano'),
  attribution: z.string().min(1),
  license: z.string().min(1),
  sourceUrl: z.url(),
  expectedSamples: z.number().int().nonnegative(),
  samples: z.array(SampleSchema).default([]),
})

/**
 * Valida la estructura y las licencias del manifiesto.
 *
 * @returns `{ ok, errors, manifest }`; `manifest` es `null` si la forma no es
 * válida.
 */
export function validateManifest(raw) {
  const errors = []
  const parsed = ManifestSchema.safeParse(raw)
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      errors.push(`${issue.path.join('.') || '(raíz)'}: ${issue.message}`)
    }
    return { ok: false, errors, manifest: null }
  }

  const manifest = parsed.data
  if (manifest.samples.length !== manifest.expectedSamples) {
    errors.push(
      `El manifiesto declara ${manifest.expectedSamples} muestras pero tiene ${manifest.samples.length}`,
    )
  }

  const seen = new Set()
  for (const sample of manifest.samples) {
    if (seen.has(sample.file)) {
      errors.push(`Archivo repetido en el manifiesto: ${sample.file}`)
    }
    seen.add(sample.file)
    if (!ALLOWED_LICENSES.includes(sample.license)) {
      errors.push(`${sample.file}: licencia no permitida "${sample.license}"`)
    }
  }

  return { ok: errors.length === 0, errors, manifest }
}

/** SHA-256 de un archivo, en hexadecimal. */
export function hashFile(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}

/**
 * Comprueba los archivos reales contra el manifiesto.
 *
 * @returns `{ errors, checked }`: `checked` cuenta las muestras que coinciden
 * en tamaño y hash.
 */
export function auditDirectory(manifest, dir) {
  const errors = []
  const registered = new Set(manifest.samples.map((sample) => sample.file))

  let entries = []
  try {
    entries = readdirSync(dir)
  } catch (error) {
    return { errors: [`No se pudo leer ${dir}: ${error.message}`], checked: 0 }
  }

  for (const entry of entries) {
    if (entry.startsWith('.') || entry.endsWith('.part')) continue
    const full = join(dir, entry)
    if (!statSync(full).isFile()) continue
    if (!registered.has(entry)) {
      errors.push(`Archivo no registrado en el manifiesto: ${entry}`)
    }
  }

  let checked = 0
  for (const sample of manifest.samples) {
    const full = join(dir, sample.file)
    if (!existsSync(full)) {
      errors.push(`Falta el archivo registrado: ${sample.file}`)
      continue
    }
    const size = statSync(full).size
    if (size !== sample.bytes) {
      errors.push(`${sample.file}: tamaño ${size} != ${sample.bytes}`)
      continue
    }
    if (hashFile(full) !== sample.sha256) {
      errors.push(`${sample.file}: SHA-256 no coincide`)
      continue
    }
    checked += 1
  }

  return { errors, checked }
}

const args = process.argv.slice(2)

function flagValue(name) {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : undefined
}

function main() {
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`Uso: node scripts/verify-audio.mjs [opciones]

  --manifest <ruta>   Manifiesto a auditar (por defecto assets/audio/manifest.json).
  --samples <ruta>    Carpeta de muestras (por defecto public/audio/samples).
  --help              Muestra esta ayuda.`)
    return
  }

  const manifestPath = resolve(
    ROOT,
    flagValue('--manifest') ?? 'assets/audio/manifest.json',
  )
  const samplesDir = resolve(
    ROOT,
    flagValue('--samples') ?? 'public/audio/samples',
  )

  let raw
  try {
    raw = JSON.parse(readFileSync(manifestPath, 'utf8'))
  } catch (error) {
    console.error(`No se pudo leer el manifiesto ${manifestPath}: ${error.message}`)
    process.exitCode = 1
    return
  }

  const result = validateManifest(raw)
  if (!result.ok) {
    console.error('Manifiesto de audio inválido:')
    for (const error of result.errors) console.error(`  ${error}`)
    process.exitCode = 1
    return
  }

  const manifest = result.manifest
  console.log(`Manifiesto: ${manifestPath}`)
  console.log(
    `Muestras declaradas: ${manifest.samples.length}/${manifest.expectedSamples}`,
  )

  if (!existsSync(samplesDir)) {
    console.log(`NO VERIFICABLE · no existe la carpeta de muestras ${samplesDir}`)
    console.log(
      'Las muestras no se versionan; ejecutá `npm run fetch:samples` para verificarlas.',
    )
    return
  }

  const dir = auditDirectory(manifest, samplesDir)
  if (dir.errors.length > 0) {
    console.error('Muestras de audio inválidas:')
    for (const error of dir.errors) console.error(`  ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    `OK · ${dir.checked} muestras registradas y verificadas en ${samplesDir}`,
  )
}

const invokedDirectly =
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (invokedDirectly) {
  try {
    main()
  } catch (error) {
    console.error('Error inesperado:', error)
    process.exitCode = 1
  }
}
