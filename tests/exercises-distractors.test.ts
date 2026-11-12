import { describe, expect, it } from 'vitest'
import { plausibleDistractors } from '../src/exercises/distractors'

describe('F2-039 — Generar distractores plausibles', () => {
  it('genera distractores por alteración de grados internos de una escala', () => {
    const distractors = plausibleDistractors({
      answer: 'C D E F G A B C',
      type: 'scale-spelling',
      difficulty: 2,
      count: 2,
    })

    expect(distractors).toHaveLength(2)
    expect(distractors[0]).not.toBe('C D E F G A B C')
    expect(distractors.every((distractor) => distractor !== 'C D E F G A B C')).toBe(true)
    expect(distractors.every((distractor) => distractor.split(' ').length === 8)).toBe(true)
  })

  it('genera un distractor de transposición con una nota más aguda', () => {
    const distractors = plausibleDistractors({
      answer: 'C4 D4 E4 G4',
      type: 'transposition',
      difficulty: 1,
      count: 1,
    })

    expect(distractors).toHaveLength(1)
    expect(distractors[0]).not.toBe('C4 D4 E4 G4')
    expect(distractors[0].startsWith('C#4')).toBe(true)
  })

  it('usa una sola opción para dificultad baja y no repite el material', () => {
    const easy = plausibleDistractors({
      answer: 'C D E F G A B C',
      type: 'scale-spelling',
      difficulty: 1,
      count: 1,
    })
    const medium = plausibleDistractors({
      answer: 'C D E F G A B C',
      type: 'scale-spelling',
      difficulty: 2,
      count: 2,
    })
    const hard = plausibleDistractors({
      answer: 'C D E F G A B C',
      type: 'scale-spelling',
      difficulty: 3,
      count: 3,
    })

    expect(easy).toHaveLength(1)
    expect(medium).toHaveLength(2)
    expect(hard).toHaveLength(3)
    expect(new Set([easy[0], medium[0], hard[0]]).size).toBeGreaterThan(0)
  })

  it('devuelve lista vacía para respuestas sin distractores aplicables', () => {
    expect(plausibleDistractors({ answer: '', type: 'note-keyboard', difficulty: 2 })).toEqual([])
  })
})
