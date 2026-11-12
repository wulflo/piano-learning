import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  ALLOWED_LICENSES,
  auditAgainstDoc,
  auditLicenses,
  collectProductionLicenses,
  normalizeLicenses,
  packageName,
  parseInventory,
} from '../scripts/lib/license-audit'

/**
 * F6-042 — Auditoría de licencias de producción.
 *
 * `npm run audit:licenses` corre license-checker sobre las dependencias de
 * producción, exige que todas estén en la allowlist permisiva y que coincidan
 * con el inventario versionado `THIRD_PARTY_LICENSES.md`.
 */
describe('F6-042 — licencias de producción', () => {
  it('normaliza el campo de licencias de license-checker', () => {
    expect(normalizeLicenses('MIT')).toEqual(['MIT'])
    expect(normalizeLicenses('(MIT OR CC0-1.0)')).toEqual(['MIT', 'CC0-1.0'])
    expect(normalizeLicenses(['MIT', 'Apache-2.0'])).toEqual([
      'MIT',
      'Apache-2.0',
    ])
    expect(normalizeLicenses('MIT*')).toEqual(['MIT'])
    expect(normalizeLicenses(undefined)).toEqual([])
  })

  it('quita la versión del identificador del paquete', () => {
    expect(packageName('react@19.3.1')).toBe('react')
    expect(packageName('@tonaljs/core@5.0.4')).toBe('@tonaljs/core')
  })

  it('acepta licencias permisivas y rechaza las demás', () => {
    const allowed = auditLicenses({
      'a@1.0.0': { licenses: 'MIT' },
      'b@1.0.0': { licenses: 'Apache-2.0' },
    })
    expect(allowed.errors).toEqual([])

    const disallowed = auditLicenses({ 'c@1.0.0': { licenses: 'GPL-3.0' } })
    expect(disallowed.errors).toHaveLength(1)
    expect(disallowed.errors[0]).toContain('GPL-3.0')

    const missing = auditLicenses({ 'd@1.0.0': { licenses: undefined } })
    expect(missing.errors[0]).toContain('sin licencia')
  })

  it('parsea el inventario del documento', () => {
    const doc = [
      '| Paquete | Versión | Licencia |',
      '|---|---|---|',
      '| react | 19.3.1 | MIT |',
      '| dexie | 4.4.7 | Apache-2.0 | Uso |',
    ].join('\n')
    const inventory = parseInventory(doc)
    expect(inventory.get('react')).toBe('MIT')
    expect(inventory.get('dexie')).toBe('Apache-2.0')
    expect(inventory.has('Paquete')).toBe(false)
  })

  it('detecta paquetes ausentes o con licencia distinta en el documento', () => {
    const doc = '| Paquete | Versión | Licencia |\n|---|---|---|\n| react | 19.3.1 | MIT |'
    const result = auditAgainstDoc(
      {
        'react@19.3.1': { licenses: 'MIT' },
        'ghost@1.0.0': { licenses: 'MIT' },
      },
      doc,
    )
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toContain('ghost@1.0.0')
  })

  it('la lista permitida cubre las licencias permisivas esperadas', () => {
    for (const license of ['MIT', 'Apache-2.0', 'BSD-3-Clause', '0BSD']) {
      expect(ALLOWED_LICENSES).toContain(license)
    }
    expect(ALLOWED_LICENSES).not.toContain('GPL-3.0')
  })

  it('las dependencias de producción reales pasan la auditoría', async () => {
    const packages = await collectProductionLicenses()
    const doc = readFileSync(join(process.cwd(), 'THIRD_PARTY_LICENSES.md'), 'utf8')

    expect(Object.keys(packages).length).toBeGreaterThan(0)
    expect(auditLicenses(packages).errors).toEqual([])
    expect(auditAgainstDoc(packages, doc).errors).toEqual([])
  })
})
