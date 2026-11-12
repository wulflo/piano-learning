#!/usr/bin/env node
/**
 * Verifica el presupuesto de rendimiento de F1-036.
 *
 * - El JS inicial (el que referencia dist/index.html) debe pesar < 300 KB gzip.
 * - Tone.js y VexFlow deben quedar en chunks separados (carga bajo demanda).
 *
 * Uso: node scripts/check-bundle.mjs  (después de `npm run build`)
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { gzipSync } from 'node:zlib'

const ROOT = resolve(import.meta.dirname, '..')
const DIST = join(ROOT, 'dist')
const BUDGET_BYTES = 300 * 1024

if (!existsSync(DIST)) {
  console.error('No existe dist/. Ejecutá `npm run build` primero.')
  process.exit(1)
}

const html = readFileSync(join(DIST, 'index.html'), 'utf8')
const initialScripts = [...html.matchAll(/<script[^>]+src="([^"]+\.js)"/g)].map(
  (match) => match[1].replace(/^\//, ''),
)
if (initialScripts.length === 0) {
  console.error('No se encontró el script inicial en dist/index.html.')
  process.exit(1)
}

const assets = readdirSync(join(DIST, 'assets'))
  .filter((file) => file.endsWith('.js'))
  .map((file) => {
    const path = join(DIST, 'assets', file)
    const raw = readFileSync(path)
    return {
      file,
      raw: statSync(path).size,
      gzip: gzipSync(raw, { level: 9 }).length,
      initial: initialScripts.some((script) => script.endsWith(`assets/${file}`)),
    }
  })
  .sort((a, b) => b.gzip - a.gzip)

let initialGzip = 0
for (const asset of assets) {
  if (asset.initial) initialGzip += asset.gzip
  console.log(
    `${asset.initial ? 'inicial ' : 'diferido'} · ${asset.file} · ${(asset.gzip / 1024).toFixed(2)} kB gzip`,
  )
}

const deferred = assets.filter((asset) => !asset.initial)
const errors = []
if (initialGzip > BUDGET_BYTES) {
  errors.push(
    `JS inicial ${(initialGzip / 1024).toFixed(2)} kB gzip supera el presupuesto de 300 kB.`,
  )
}
if (deferred.length < 2) {
  errors.push('Se esperaban al menos dos chunks diferidos (Tone.js y VexFlow).')
}
if (!deferred.some((asset) => asset.file.includes('vexflow'))) {
  errors.push('No se encontró el chunk separado de VexFlow.')
}
if (!deferred.some((asset) => !asset.file.includes('vexflow'))) {
  errors.push('No se encontró el chunk separado de Tone.js.')
}

if (errors.length > 0) {
  for (const error of errors) console.error(`Error: ${error}`)
  process.exit(1)
}

console.log(
  `OK · JS inicial ${(initialGzip / 1024).toFixed(2)} kB gzip (< 300 kB) · ${deferred.length} chunks diferidos.`,
)
