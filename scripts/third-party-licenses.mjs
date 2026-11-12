#!/usr/bin/env node
/**
 * F6-018 — Genera el inventario de licencias de terceros.
 *
 * Lee `package-lock.json` y produce una tabla por paquete con versión y
 * licencia declarada. Se ejecuta a mano cuando cambian las dependencias:
 *
 *   node scripts/third-party-licenses.mjs > /tmp/opencode/third-party.md
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const lock = JSON.parse(
  readFileSync(resolve(import.meta.dirname, '..', 'package-lock.json'), 'utf8'),
)

const packages = new Map()
for (const [path, info] of Object.entries(lock.packages ?? {})) {
  if (!path.includes('node_modules/')) continue
  if (!info.version) continue
  const name = info.name ?? path.slice(path.lastIndexOf('node_modules/') + 13)
  const key = `${name}@${info.version}`
  if (!packages.has(key)) {
    packages.set(key, {
      name,
      version: info.version,
      license: info.license ?? 'UNKNOWN',
    })
  }
}

const rows = [...packages.values()].sort((a, b) =>
  a.name.localeCompare(b.name, 'en'),
)

const counts = new Map()
for (const row of rows) {
  counts.set(row.license, (counts.get(row.license) ?? 0) + 1)
}

console.log('| Paquete | Versión | Licencia |')
console.log('|---|---|---|')
for (const row of rows) {
  console.log(`| ${row.name} | ${row.version} | ${row.license} |`)
}
console.log('')
console.log('### Resumen por licencia')
console.log('')
console.log('| Licencia | Paquetes |')
console.log('|---|---:|')
for (const [license, count] of [...counts.entries()].sort((a, b) =>
  a[0].localeCompare(b[0], 'en'),
)) {
  console.log(`| ${license} | ${count} |`)
}
console.log('')
console.log(
  `Total: ${rows.length} paquetes (runtime y desarrollo, incluidas dependencias transitivas).`,
)
