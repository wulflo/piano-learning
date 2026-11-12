import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const css = readFileSync(join(process.cwd(), 'src', 'styles.css'), 'utf8')

function block(selector: string): string {
  const start = css.indexOf(selector)
  if (start === -1) throw new Error(`No se encontró el selector ${selector}`)
  const open = css.indexOf('{', start)
  const close = css.indexOf('}', open)
  return css.slice(open + 1, close)
}

/**
 * F6-017 — Estabilidad del layout.
 *
 * El curso carga el progreso desde IndexedDB después del primer pintado. Si no
 * se reserva el espacio del enlace de continuación y del panel de avance, el
 * contenido salta y empeora el CLS. Estas reglas mantienen el layout estable.
 */
describe('F6-017 — Estabilidad del layout (CLS)', () => {
  it('reserva el ancho de la barra de scroll', () => {
    expect(block('body {')).toContain('scrollbar-gutter: stable')
  })

  it('reserva el espacio de las acciones del hero', () => {
    expect(block('.hero .page-actions {')).toContain('min-height')
  })

  it('reserva el espacio del panel de avance', () => {
    expect(block('.course-overview {')).toContain('min-height')
  })
})
