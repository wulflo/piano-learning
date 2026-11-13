import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()
const read = (path: string) => readFileSync(join(root, path), 'utf8')

describe('licencias del repositorio', () => {
  it('el código usa MIT', () => {
    const license = read('LICENSE')
    expect(license).toContain('MIT License')
    expect(license).toContain('Piano Today contributors')
  })

  it('el contenido usa CC BY-SA 4.0 y los ejercicios CC0', () => {
    const license = read('LICENSE-CONTENT')
    expect(license).toContain('CC BY-SA 4.0')
    expect(license).toContain('CC0 1.0')
  })

  it('las licencias de terceros atribuyen Salamander', () => {
    const thirdParty = read('THIRD_PARTY_LICENSES.md')
    expect(thirdParty).toContain('Salamander Grand Piano')
    expect(thirdParty).toContain('CC BY 3.0')
    expect(thirdParty).toContain('Alexander Holm')
  })

  it('la app muestra la atribución de audio y contenido', () => {
    const strings = read('src/state/settings.tsx')
    expect(strings).toContain('Salamander')
    expect(strings).toContain('CC BY 3.0')
    expect(strings).toContain('CC BY-SA 4.0')
  })
})
