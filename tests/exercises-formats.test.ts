import { describe, expect, it } from 'vitest'
import {
  EXERCISE_FORMATS,
  selectExerciseFormat,
  supportedFormats,
} from '../src/exercises/formats'

describe('F2-037 — Variantes de formato (ver, oír, deletrear, tocar)', () => {
  it('define los cuatro formatos del ejercicio', () => {
    expect(EXERCISE_FORMATS).toEqual(['see', 'hear', 'spell', 'play'])
  })

  it('lista los formatos válidos por tipo de ejercicio', () => {
    expect(supportedFormats('note-keyboard')).toEqual(['see', 'hear', 'play'])
    expect(supportedFormats('scale-spelling')).toEqual(['spell', 'hear', 'play'])
    expect(supportedFormats('key-signature')).toEqual(['see', 'spell', 'play'])
    expect(supportedFormats('transposition')).toEqual(['spell', 'hear', 'play'])
  })

  it('elige un formato distinto al inmediato anterior', () => {
    expect(
      selectExerciseFormat({ type: 'note-keyboard', previous: 'see' }),
    ).toBe('hear')
    expect(
      selectExerciseFormat({ type: 'scale-spelling', previous: 'spell' }),
    ).toBe('hear')
    expect(
      selectExerciseFormat({ type: 'transposition', previous: 'hear' }),
    ).toBe('spell')
  })

  it('elige el primer formato válido cuando no hay anterior', () => {
    expect(selectExerciseFormat({ type: 'transposition' })).toBe('spell')
    expect(selectExerciseFormat({ type: 'transposition', previous: null })).toBe('spell')
  })

  it('repite el único formato válido cuando no hay alternativa', () => {
    expect(selectExerciseFormat({ type: 'progression-completion', previous: 'play' })).toBe('play')
    expect(selectExerciseFormat({ type: 'progression-completion' })).toBe('play')
  })

  it('cubre los formatos definidos para cada tipo con al menos uno', () => {
    for (const format of supportedFormats('note-keyboard')) {
      expect(EXERCISE_FORMATS).toContain(format)
    }
    for (const format of supportedFormats('scale-spelling')) {
      expect(EXERCISE_FORMATS).toContain(format)
    }
  })
})
