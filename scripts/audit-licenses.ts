import { readFileSync } from 'node:fs'
import {
  ALLOWED_LICENSES,
  auditAgainstDoc,
  auditLicenses,
  collectProductionLicenses,
  DOC_PATH,
} from './lib/license-audit'

/**
 * F6-042 — Audita las licencias de las dependencias de producción con
 * license-checker contra una allowlist permisiva y verifica que el resultado
 * coincida con `THIRD_PARTY_LICENSES.md`.
 *
 *   npm run audit:licenses
 */
async function main() {
  const packages = await collectProductionLicenses()
  const doc = readFileSync(DOC_PATH, 'utf8')

  const licenseResult = auditLicenses(packages)
  const docResult = auditAgainstDoc(packages, doc)
  const errors = [...licenseResult.errors, ...docResult.errors]

  console.log('Auditoría de licencias de producción')
  console.log(`  Paquetes: ${licenseResult.entries.length}`)
  console.log(`  Allowlist: ${ALLOWED_LICENSES.join(', ')}`)

  if (errors.length > 0) {
    for (const error of errors) console.error(`  error · ${error}`)
    console.error(`\nFalló con ${errors.length} error(es).`)
    process.exitCode = 1
    return
  }

  console.log(
    '  OK · todas las licencias de producción son permisivas y coinciden con THIRD_PARTY_LICENSES.md.',
  )
}

main().catch((error: unknown) => {
  console.error('Error inesperado auditando licencias:', error)
  process.exitCode = 1
})
