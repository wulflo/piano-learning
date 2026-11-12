import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const changelog = readFileSync(join(process.cwd(), 'CHANGELOG.md'), 'utf8')

/**
 * F6-020 — CHANGELOG por fase.
 *
 * Cada fase cerrada tiene su sección y su tag local. La fase 6 se marca como
 * «en curso» hasta que F6-030 cree el tag `fase-6`.
 */
describe('F6-020 — CHANGELOG por fase', () => {
  it('incluye las fases 0 a 6', () => {
    for (let phase = 0; phase <= 6; phase += 1) {
      expect(changelog).toMatch(new RegExp(`## \\[Fase ${phase}\\]`))
    }
  })

  it('menciona los tags y releases de cada fase cerrada', () => {
    for (let phase = 0; phase <= 6; phase += 1) {
      expect(changelog).toContain(`\`fase-${phase}\``)
    }
    expect(changelog).toContain('Tags y releases')
    expect(changelog).toContain('wulflo.github.io/piano-learning')
  })

  it('mantiene el formato de Keep a Changelog', () => {
    expect(changelog).toContain('## [Fase 6]')
    expect(changelog).toContain('### Agregado')
    expect(changelog).toContain('### Estado')
  })
})
