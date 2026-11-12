import { describe, expect, it } from 'vitest'
import {
  BLACK_KEY_OFFSET,
  DEFAULT_COMPUTER_KEY_MAP,
  buildKeyboardLayout,
  isBlackMidi,
  whiteKeyCount,
  whiteKeys,
} from '../src/keyboard/layout'

describe('layout del teclado', () => {
  it('construye tres octavas con 21 blancas y 15 negras', () => {
    const layout = buildKeyboardLayout(48, 3)
    expect(layout).toHaveLength(36)
    expect(layout[0]).toMatchObject({ midi: 48, isBlack: false, whiteIndex: 0 })
    expect(layout[layout.length - 1]).toMatchObject({ midi: 83, isBlack: false })
    expect(whiteKeyCount(layout)).toBe(21)
    expect(layout.filter((key) => key.isBlack)).toHaveLength(15)
  })

  it('asigna a cada negra la blanca que tiene a la izquierda', () => {
    const layout = buildKeyboardLayout(48, 1)
    const cSharp = layout.find((key) => key.midi === 49)
    const dSharp = layout.find((key) => key.midi === 51)
    expect(cSharp).toMatchObject({ isBlack: true, whiteIndex: 0, blackOffset: BLACK_KEY_OFFSET })
    expect(dSharp).toMatchObject({ isBlack: true, whiteIndex: 1 })
    expect(layout.every((key) => key.midi >= 0 && key.midi <= 127)).toBe(true)
  })

  it('devuelve las blancas en orden y detecta negras', () => {
    const layout = buildKeyboardLayout(60, 1)
    expect(whiteKeys(layout).map((key) => key.midi)).toEqual([60, 62, 64, 65, 67, 69, 71])
    expect(isBlackMidi(61)).toBe(true)
    expect(isBlackMidi(60)).toBe(false)
  })

  it('rechaza rangos inválidos', () => {
    expect(() => buildKeyboardLayout(120, 3)).toThrow(/excede/i)
    expect(() => buildKeyboardLayout(-1, 3)).toThrow(/inicial/i)
    expect(() => buildKeyboardLayout(48, 0)).toThrow(/octavas/i)
  })

  it('mapea las filas A-L y W-P por defecto', () => {
    for (const key of ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l']) {
      expect(DEFAULT_COMPUTER_KEY_MAP[key]).toBeTypeOf('number')
    }
    for (const key of ['w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p']) {
      expect(DEFAULT_COMPUTER_KEY_MAP[key]).toBeTypeOf('number')
    }
    expect(DEFAULT_COMPUTER_KEY_MAP.a).toBe(60)
    expect(DEFAULT_COMPUTER_KEY_MAP.w).toBe(61)
  })
})
