import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * F6-042 — Auditoría de licencias de dependencias de producción.
 *
 * La lógica vive aquí para poder probarla sin ejecutar el script. El script
 * `scripts/audit-licenses.ts` la usa y decide el código de salida.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

/** Ruta del inventario que debe coincidir con el resultado de la auditoría. */
export const DOC_PATH = resolve(ROOT, 'THIRD_PARTY_LICENSES.md')

/**
 * Licencias permisivas aceptadas para las dependencias de producción. Todas
 * permiten redistribución y no imponen copyleft sobre el código MIT del
 * proyecto.
 */
export const ALLOWED_LICENSES = Object.freeze([
  '0BSD',
  'Apache-2.0',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'BlueOak-1.0.0',
  'CC0-1.0',
  'ISC',
  'MIT',
  'Unlicense',
])

export interface PackageLicense {
  licenses?: unknown
  [key: string]: unknown
}

/**
 * Normaliza el campo `licenses` de license-checker a una lista de ids SPDX.
 * Puede llegar como cadena, lista, o expresión tipo `(MIT OR CC0-1.0)`.
 */
export function normalizeLicenses(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((entry) => normalizeLicenses(entry))
  }
  if (typeof value !== 'string') return []
  return value
    .replace(/[()]/g, '')
    .split(/\s+(?:OR|AND)\s+/i)
    .map((part) => part.replace(/[+*]+$/, '').trim())
    .filter((part) => part.length > 0 && part !== 'UNKNOWN')
}

/** Nombre del paquete sin la versión (`react@19.3.1` → `react`). */
export function packageName(key: string): string {
  const at = key.lastIndexOf('@')
  return at > 0 ? key.slice(0, at) : key
}

export interface AuditResult {
  errors: string[]
  entries: Array<{ key: string; name: string; licenses: string[] }>
}

/**
 * Comprueba que cada paquete declare al menos una licencia y que todas estén
 * en la allowlist permisiva.
 */
export function auditLicenses(
  packages: Record<string, PackageLicense>,
  allowed: readonly string[] = ALLOWED_LICENSES,
): AuditResult {
  const errors: string[] = []
  const entries: AuditResult['entries'] = []

  for (const [key, info] of Object.entries(packages).sort(([a], [b]) =>
    a.localeCompare(b, 'en'),
  )) {
    const licenses = normalizeLicenses(info.licenses)
    entries.push({ key, name: packageName(key), licenses })
    if (licenses.length === 0) {
      errors.push(`${key}: sin licencia declarada`)
      continue
    }
    const disallowed = licenses.filter((id) => !allowed.includes(id))
    if (disallowed.length > 0) {
      errors.push(`${key}: licencia no permitida (${disallowed.join(', ')})`)
    }
  }

  return { errors, entries }
}

/**
 * Extrae `nombre → licencia` de las tablas de `THIRD_PARTY_LICENSES.md`
 * (dependencias de runtime, de desarrollo e inventario completo).
 */
export function parseInventory(doc: string): Map<string, string> {
  const inventory = new Map<string, string>()
  const row = /^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/
  for (const line of doc.split(/\r?\n/)) {
    const match = line.match(row)
    if (!match) continue
    const [, name, version, license] = match
    if (name.startsWith('-') || name === 'Paquete') continue
    if (version === 'Versión' || license === 'Licencia') continue
    inventory.set(name, license)
  }
  return inventory
}

/**
 * Comprueba que cada paquete de producción aparezca en el inventario con la
 * misma licencia que reporta license-checker.
 */
export function auditAgainstDoc(
  packages: Record<string, PackageLicense>,
  doc: string,
): { errors: string[] } {
  const inventory = parseInventory(doc)
  const errors: string[] = []

  for (const [key, info] of Object.entries(packages)) {
    const name = packageName(key)
    const licenses = normalizeLicenses(info.licenses)
    const documented = inventory.get(name)
    if (documented === undefined) {
      errors.push(`${key}: no aparece en THIRD_PARTY_LICENSES.md`)
      continue
    }
    if (licenses.length > 0 && !licenses.includes(documented)) {
      errors.push(
        `${key}: el documento declara "${documented}" pero license-checker reporta "${licenses.join(', ')}"`,
      )
    }
  }

  return { errors }
}

/** Ejecuta license-checker sobre las dependencias de producción. */
export function collectProductionLicenses(): Promise<
  Record<string, PackageLicense>
> {
  const require = createRequire(import.meta.url)
  const checker = require('license-checker') as {
    init: (
      options: Record<string, unknown>,
      callback: (error: Error | null, packages: Record<string, PackageLicense>) => void,
    ) => void
  }

  return new Promise((resolvePromise, reject) => {
    checker.init(
      {
        start: ROOT,
        production: true,
        json: true,
        excludePrivatePackages: true,
      },
      (error, packages) =>
        error ? reject(error) : resolvePromise(packages ?? {}),
    )
  })
}
