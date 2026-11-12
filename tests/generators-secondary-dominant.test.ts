import { describe, expect, it } from 'vitest'
import { resolveExerciseAnswer } from '../src/exercises/answer'
import {
  SECONDARY_DOMINANT_ASKS,
  SECONDARY_DOMINANT_TONICS,
  generateSecondaryDominantExercise,
  generateSecondaryDominantExercises,
  secondaryDominantTargetsFor,
} from '../src/exercises/generators/secondary-dominant'
import { qualitiesForMode, romanNumeralFor } from '../src/theory'
import type { Exercise } from '../src/schemas'

const MAJOR_TARGETS = [2, 3, 4, 5, 6] as const
const MINOR_TARGETS = [3, 4, 5, 6] as const

function expectedRoman(target: number, mode: 'major' | 'minor'): string {
  const quality = qualitiesForMode(mode === 'minor' ? 'natural-minor' : 'major')
  return romanNumeralFor(target, quality[target - 1])
}

function generate(
  overrides: Partial<
    Parameters<typeof generateSecondaryDominantExercise>[0]
  > = {},
): Exercise {
  return generateSecondaryDominantExercise({
    id: 'test.secondary-dominant',
    skillId: 'skill.secondary-dominants',
    tonic: 'C',
    target: 5,
    ask: 'numeral',
    ...overrides,
  })
}

describe('F4-020 — generador de dominantes secundarias', () => {
  it('pide el cifrado V/x de cada grado en las 12 tonalidades mayores', () => {
    for (const tonic of SECONDARY_DOMINANT_TONICS) {
      for (const target of MAJOR_TARGETS) {
        const exercise = generate({ tonic, target })
        if (exercise.type !== 'secondary-dominant') {
          throw new Error('Se esperaba un dominante secundario')
        }
        const expected = `V/${expectedRoman(target, 'major')}`
        expect(exercise.key).toBe(tonic)
        expect(exercise.mode).toBe('major')
        expect(exercise.target).toBe(target)
        expect(exercise.ask).toBe('numeral')
        expect(exercise.promptEs).toContain(expectedRoman(target, 'major'))

        const resolved = resolveExerciseAnswer(exercise, 'es')
        expect(resolved.mode).toBe('choice')
        if (resolved.mode === 'choice') {
          expect(resolved.answer).toBe(expected)
        }
        expect(exercise.choices).toContain(expected)
        expect(exercise.choices).toHaveLength(5)
        expect(new Set(exercise.choices).size).toBe(5)
        expect(exercise.explanationEs).toContain(expected)
      }
    }
  })

  it('pide el grado de resolución mostrando el acorde con su séptima', () => {
    const exercise = generate({ tonic: 'C', target: 5, ask: 'resolution' })
    if (exercise.type !== 'secondary-dominant') {
      throw new Error('Se esperaba un dominante secundario')
    }
    // El dominante de V en Do mayor es Re7 (Re, Fa♯, La, Do).
    expect(exercise.promptEs).toContain('Re7')
    expect(exercise.promptEs).toContain('Re, Fa♯, La, Do')
    expect(exercise.ask).toBe('resolution')

    const resolved = resolveExerciseAnswer(exercise, 'es')
    expect(resolved.mode).toBe('choice')
    if (resolved.mode === 'choice') {
      expect(resolved.answer).toBe('V')
    }
    expect(exercise.choices).toContain('V')
    expect(exercise.choices).toHaveLength(5)
    expect(exercise.explanationEs).toContain('V/V')

    const aMinorResolution = generate({
      tonic: 'C',
      target: 2,
      ask: 'resolution',
    })
    if (aMinorResolution.type !== 'secondary-dominant') {
      throw new Error('Se esperaba un dominante secundario')
    }
    // El dominante de ii en Do mayor es La7 (La, Do♯, Mi, Sol).
    expect(aMinorResolution.promptEs).toContain('La7')
    expect(aMinorResolution.promptEs).toContain('Do♯')
  })

  it('usa la menor natural en los grados menores', () => {
    for (const tonic of SECONDARY_DOMINANT_TONICS) {
      for (const target of MINOR_TARGETS) {
        const exercise = generate({
          tonic,
          target,
          mode: 'minor',
          ask: 'numeral',
        })
        if (exercise.type !== 'secondary-dominant') {
          throw new Error('Se esperaba un dominante secundario')
        }
        const expected = `V/${expectedRoman(target, 'minor')}`
        expect(exercise.mode).toBe('minor')
        expect(exercise.explanationEs).toContain(expected)

        const resolved = resolveExerciseAnswer(exercise, 'es')
        expect(resolved.mode).toBe('choice')
        if (resolved.mode === 'choice') {
          expect(resolved.answer).toBe(expected)
        }
      }
    }

    // En Do menor, V/III es Sib7 y resuelve en III (Mi♭).
    const minorResolution = generate({
      tonic: 'C',
      target: 3,
      mode: 'minor',
      ask: 'resolution',
    })
    if (minorResolution.type !== 'secondary-dominant') {
      throw new Error('Se esperaba un dominante secundario')
    }
    expect(minorResolution.promptEs).toContain('Si♭7')
    expect(minorResolution.explanationEs).toContain('Mi♭')
    const resolved = resolveExerciseAnswer(minorResolution, 'es')
    expect(resolved.mode).toBe('choice')
    if (resolved.mode === 'choice') {
      expect(resolved.answer).toBe('III')
    }
  })

  it('ajusta las opciones a la dificultad', () => {
    for (const difficulty of [1, 2, 3] as const) {
      const exercise = generate({ difficulty })
      if (exercise.type !== 'secondary-dominant') {
        throw new Error('Se esperaba un dominante secundario')
      }
      expect(exercise.choices, `dificultad ${difficulty}`).toHaveLength(
        difficulty + 2,
      )
      expect(new Set(exercise.choices).size).toBe(
        (exercise.choices ?? []).length,
      )
    }
  })

  it('genera la matriz completa de tonalidades, grados y direcciones', () => {
    const major = generateSecondaryDominantExercises({
      idPrefix: 'secondary-major',
      skillId: 'skill.secondary-dominants',
    })
    expect(major).toHaveLength(
      SECONDARY_DOMINANT_TONICS.length * MAJOR_TARGETS.length * 2,
    )
    expect(major[0].id).toBe('secondary-major-001')
    expect(major.at(-1)?.id).toBe(
      `secondary-major-${String(major.length).padStart(3, '0')}`,
    )
    expect(new Set(SECONDARY_DOMINANT_ASKS)).toEqual(
      new Set(['numeral', 'resolution']),
    )

    const both = generateSecondaryDominantExercises({
      idPrefix: 'secondary-all',
      skillId: 'skill.secondary-dominants',
      modes: ['major', 'minor'],
    })
    expect(both).toHaveLength(
      SECONDARY_DOMINANT_TONICS.length *
        (MAJOR_TARGETS.length + MINOR_TARGETS.length) *
        2,
    )

    const onlyResolution = generateSecondaryDominantExercises({
      idPrefix: 'secondary-resolution',
      skillId: 'skill.secondary-dominants',
      asks: ['resolution'],
    })
    expect(
      onlyResolution.every(
        (exercise) =>
          exercise.type === 'secondary-dominant' &&
          exercise.ask === 'resolution',
      ),
    ).toBe(true)
    expect(onlyResolution).toHaveLength(
      SECONDARY_DOMINANT_TONICS.length * MAJOR_TARGETS.length,
    )

    const empty = generateSecondaryDominantExercises({
      idPrefix: 'secondary-empty',
      skillId: 'skill.secondary-dominants',
      asks: [],
    })
    expect(empty).toHaveLength(0)
  })

  it('rechaza tonalidades y grados que no se pueden tonicizar', () => {
    expect(() => generate({ tonic: 'H' })).toThrow()
    expect(() => generate({ target: 1 })).toThrow()
    expect(() => generate({ target: 7 })).toThrow()
    expect(() => generate({ target: 2.5 })).toThrow()
    expect(() => generate({ mode: 'minor', target: 2 })).toThrow()
    expect(() => generate({ mode: 'minor', target: 7 })).toThrow()
    expect(() => generate({ target: 2, mode: 'minor' })).toThrow()
    expect(secondaryDominantTargetsFor('major')).toEqual(MAJOR_TARGETS)
    expect(secondaryDominantTargetsFor('minor')).toEqual(MINOR_TARGETS)
  })
})
