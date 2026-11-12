import { describe, expect, it } from 'vitest'
import { keyboardRange } from '../src/keyboard/range'

describe('F2-066 — Rango visible del teclado', () => {
  it('usa un rango amplio cuando no hay notas', () => {
    expect(keyboardRange([])).toEqual({ startMidi: 48, octaves: 3 })
  })

  it('empieza en la octava de la nota más grave y cubre la más aguda', () => {
    expect(keyboardRange([60, 84])).toEqual({ startMidi: 60, octaves: 3 })
    expect(keyboardRange([61, 62])).toEqual({ startMidi: 60, octaves: 1 })
  })

  it('limita el rango a siete octavas y al registro de la app', () => {
    expect(keyboardRange([0, 127])).toEqual({ startMidi: 12, octaves: 7 })
  })
})
