import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const css = readFileSync(join(process.cwd(), 'src', 'styles.css'), 'utf8')

/**
 * F6-014 — Movimiento reducido.
 *
 * La app no depende de animaciones para comunicar estado, pero respeta
 * `prefers-reduced-motion` con una regla global que acorta animaciones y
 * transiciones. La preferencia de contraste y los temas se cubren en
 * `theme.test.ts`.
 */
describe('F6-014 — Movimiento reducido', () => {
  it('incluye una regla global para prefers-reduced-motion', () => {
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)/)
    expect(css).toMatch(/animation-duration: 0\.01ms !important/)
    expect(css).toMatch(/animation-iteration-count: 1 !important/)
    expect(css).toMatch(/transition-duration: 0\.01ms !important/)
    expect(css).toMatch(/scroll-behavior: auto !important/)
  })

  it('no usa animaciones infinitas en la interfaz', () => {
    expect(css).not.toMatch(/animation:\s*[^;]*infinite/)
  })

  it('mantiene el foco visible en todos los controles', () => {
    expect(css).toMatch(/:focus-visible \{[^}]*outline: 3px solid var\(--focus\)/)
  })
})
