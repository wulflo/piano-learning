import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const readme = readFileSync(join(process.cwd(), 'README.md'), 'utf8')

/**
 * F6-021 — README y guía de uso.
 *
 * El README debe explicar qué es la app, cómo correrla y aprender con ella,
 * sus límites sin profesor y las licencias, sin prometer funciones que no
 * existen.
 */
describe('F6-021 — README', () => {
  it('explica qué es y qué incluye', () => {
    expect(readme).toContain('9 módulos y 79 lecciones')
    expect(readme).toContain('720 ejercicios')
    expect(readme).toContain('28 piezas de repertorio')
    expect(readme).toContain('PWA instalable')
  })

  it('explica cómo correr y cómo aprender', () => {
    expect(readme).toContain('npm ci')
    expect(readme).toContain('npm run estado')
    expect(readme).toContain('## Cómo aprender')
  })

  it('documenta límites, accesibilidad y licencias', () => {
    expect(readme).toContain('## Límites sin profesor')
    expect(readme).toContain('## Accesibilidad')
    expect(readme).toContain('THIRD_PARTY_LICENSES.md')
    expect(readme).toContain('MIT')
    expect(readme).toContain('CC0')
  })

  it('no promete fases ya cerradas como pendientes', () => {
    expect(readme).toContain('Fases 0 a 6 cerradas')
    expect(readme).toContain('`fase-0` a `fase-6`')
    expect(readme).toContain('https://wulflo.github.io/piano-learning/')
  })
})
