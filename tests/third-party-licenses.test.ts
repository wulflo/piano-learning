import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()
const doc = readFileSync(join(root, 'THIRD_PARTY_LICENSES.md'), 'utf8')
const pkg = JSON.parse(
  readFileSync(join(root, 'package.json'), 'utf8'),
) as { dependencies: Record<string, string>; devDependencies: Record<string, string> }

/**
 * F6-018 — Inventario de licencias completo.
 *
 * La tabla se genera con `scripts/third-party-licenses.mjs`; este test evita
 * que el documento quede desactualizado al añadir una dependencia.
 */
describe('F6-018 — Licencias de terceros', () => {
  it('lista todas las dependencias de runtime', () => {
    for (const name of Object.keys(pkg.dependencies)) {
      expect(doc).toContain(`| ${name} |`)
    }
  })

  it('lista todas las dependencias de desarrollo', () => {
    for (const name of Object.keys(pkg.devDependencies)) {
      expect(doc).toContain(`| ${name} |`)
    }
  })

  it('incluye muestras, fuentes de notación y contenido', () => {
    expect(doc).toContain('Salamander Grand Piano')
    expect(doc).toContain('CC BY 3.0')
    expect(doc).toContain('VexFlow')
    expect(doc).toContain('Tone.js')
    expect(doc).toContain('Dominio público')
    expect(doc).toContain('CC0 1.0')
  })

  it('documenta el comando para regenerar el inventario', () => {
    expect(doc).toContain('node scripts/third-party-licenses.mjs')
    expect(doc).toMatch(/Total: \d+ paquetes/)
  })
})
