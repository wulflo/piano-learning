import { describe, expect, it } from 'vitest'
import { resolveExerciseAnswer } from '../src/exercises/answer'
import {
  BORROWED_CHORD_TONICS,
  generateBorrowedChordExercise,
  generateBorrowedChordExercises,
  borrowedChordTargetsFor,
} from '../src/exercises/generators/borrowed-chord'
import type { Exercise } from '../src/schemas'

const MAJOR_TARGETS = [3, 4, 5, 6, 7] as const
const MINOR_TARGETS = [1, 4, 6] as const

const MAJOR_NUMERALS: Record<number, string> = {
  3: 'bIII',
  4: 'iv',
  5: 'v',
  6: 'bVI',
  7: 'bVII',
}

const MINOR_NUMERALS: Record<number, string> = {
  1: 'I',
  4: 'IV',
  6: 'vi',
}

function generate(
  overrides: Partial<Parameters<typeof generateBorrowedChordExercise>[0]> = {},
): Exercise {
  return generateBorrowedChordExercise({
    id: 'test.borrowed',
    skillId: 'skill.modal-mixture',
    tonic: 'C',
    degree: 4,
    ...overrides,
  })
}

describe('F4-020 — generador de acordes prestados', () => {
  it('pide el numeral de cada préstamo en las 12 tonalidades mayores', () => {
    for (const tonic of BORROWED_CHORD_TONICS) {
      for (const degree of MAJOR_TARGETS) {
        const exercise = generate({ tonic, degree })
        if (exercise.type !== 'borrowed-chord') {
          throw new Error('Se esperaba un acorde prestado')
        }
        const expected = MAJOR_NUMERALS[degree]
        expect(exercise.key).toBe(tonic)
        expect(exercise.mode).toBe('major')
        expect(exercise.numeral).toBe(expected)
        expect(exercise.explanationEs).toContain(expected)

        const resolved = resolveExerciseAnswer(exercise, 'es')
        expect(resolved.mode).toBe('choice')
        if (resolved.mode === 'choice') {
          expect(resolved.answer).toBe(expected)
        }
        expect(exercise.choices).toContain(expected)
        expect(exercise.choices).toHaveLength(5)
        expect(new Set(exercise.choices).size).toBe(5)
        expect(exercise.choicesEn).toEqual(exercise.choices)
      }
    }
  })

  it('describe el acorde prestado con su nombre y sus notas', () => {
    const exercise = generate({ tonic: 'C', degree: 4 })
    if (exercise.type !== 'borrowed-chord') {
      throw new Error('Se esperaba un acorde prestado')
    }
    expect(exercise.promptEs).toContain('Fa menor')
    expect(exercise.promptEs).toContain('Fa, La♭, Do')
    expect(exercise.promptEn).toContain('F minor')
    expect(exercise.promptEn).toContain('F, A♭, C')
    expect(exercise.explanationEs).toContain('modo paralelo')

    const dominant = generate({ tonic: 'C', degree: 5 })
    if (dominant.type !== 'borrowed-chord') {
      throw new Error('Se esperaba un acorde prestado')
    }
    expect(dominant.promptEs).toContain('Sol menor')
    expect(dominant.numeral).toBe('v')

    const subtonic = generate({ tonic: 'C', degree: 7 })
    if (subtonic.type !== 'borrowed-chord') {
      throw new Error('Se esperaba un acorde prestado')
    }
    expect(subtonic.promptEs).toContain('Si♭ mayor')
    expect(subtonic.numeral).toBe('bVII')
  })

  it('presta del modo mayor en las tonalidades menores', () => {
    for (const tonic of BORROWED_CHORD_TONICS) {
      for (const degree of MINOR_TARGETS) {
        const exercise = generate({
          tonic,
          degree,
          mode: 'minor',
        })
        if (exercise.type !== 'borrowed-chord') {
          throw new Error('Se esperaba un acorde prestado')
        }
        const expected = MINOR_NUMERALS[degree]
        expect(exercise.mode).toBe('minor')
        expect(exercise.numeral).toBe(expected)
        expect(exercise.explanationEs).toContain(expected)

        const resolved = resolveExerciseAnswer(exercise, 'es')
        expect(resolved.mode).toBe('choice')
        if (resolved.mode === 'choice') {
          expect(resolved.answer).toBe(expected)
        }
        expect(exercise.choices).toContain(expected)
      }
    }

    const picardy = generate({ tonic: 'C', degree: 1, mode: 'minor' })
    if (picardy.type !== 'borrowed-chord') {
      throw new Error('Se esperaba un acorde prestado')
    }
    expect(picardy.promptEs).toContain('Do mayor')
    expect(picardy.promptEs).toContain('Do, Mi, Sol')
    expect(picardy.numeral).toBe('I')
  })

  it('ajusta las opciones a la dificultad', () => {
    for (const difficulty of [1, 2, 3] as const) {
      const exercise = generate({ difficulty })
      if (exercise.type !== 'borrowed-chord') {
        throw new Error('Se esperaba un acorde prestado')
      }
      expect(exercise.choices, `dificultad ${difficulty}`).toHaveLength(
        difficulty + 2,
      )
      expect(new Set(exercise.choices).size).toBe(
        (exercise.choices ?? []).length,
      )
    }
  })

  it('genera la matriz completa de tonalidades y préstamos', () => {
    const major = generateBorrowedChordExercises({
      idPrefix: 'borrowed-major',
      skillId: 'skill.modal-mixture',
    })
    expect(major).toHaveLength(BORROWED_CHORD_TONICS.length * MAJOR_TARGETS.length)
    expect(major[0].id).toBe('borrowed-major-001')
    expect(major.at(-1)?.id).toBe(
      `borrowed-major-${String(major.length).padStart(3, '0')}`,
    )

    const both = generateBorrowedChordExercises({
      idPrefix: 'borrowed-all',
      skillId: 'skill.modal-mixture',
      modes: ['major', 'minor'],
    })
    expect(both).toHaveLength(
      BORROWED_CHORD_TONICS.length *
        (MAJOR_TARGETS.length + MINOR_TARGETS.length),
    )

    const partial = generateBorrowedChordExercises({
      idPrefix: 'borrowed-partial',
      skillId: 'skill.modal-mixture',
      tonics: ['C', 'G'],
      degrees: [4],
      count: 1,
    })
    expect(partial).toHaveLength(1)
    expect((partial[0] as { key: string }).key).toBe('C')

    const empty = generateBorrowedChordExercises({
      idPrefix: 'borrowed-empty',
      skillId: 'skill.modal-mixture',
      degrees: [],
    })
    expect(empty).toHaveLength(0)
  })

  it('rechaza tonalidades y grados que no se prestan', () => {
    expect(() => generate({ tonic: 'H' })).toThrow()
    expect(() => generate({ degree: 2 })).toThrow()
    expect(() => generate({ degree: 1 })).toThrow()
    expect(() => generate({ degree: 8 })).toThrow()
    expect(() => generate({ degree: 3, mode: 'minor' })).toThrow()
    expect(() => generate({ degree: 5, mode: 'minor' })).toThrow()
    expect(borrowedChordTargetsFor('major')).toEqual(MAJOR_TARGETS)
    expect(borrowedChordTargetsFor('minor')).toEqual(MINOR_TARGETS)
  })
})
