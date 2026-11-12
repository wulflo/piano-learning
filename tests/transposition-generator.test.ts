import { describe, expect, it } from 'vitest'
import { ExerciseSchema } from '../src/schemas/content'
import { formatPitch, fromSpelledPitch, midiOf } from '../src/theory'
import {
  TRANSPOSITION_DIFFICULTIES,
  TRANSPOSITION_PATTERNS,
  TRANSPOSITION_TONICS,
  formatMelody,
  generateTranspositionExercise,
  generateTranspositionExercises,
  melodyFromDegrees,
  transposeSpelledMelody,
  transpositionSemitones,
} from '../src/exercises/generators/transposition'

const melodyMidis = (melody: ReturnType<typeof transposeSpelledMelody>) =>
  melody.map((pitch) => midiOf(fromSpelledPitch(pitch)))

describe('F2-036 — Generador de ejercicios de transposición', () => {
  it('define las 12 tonalidades de M2 y tres niveles de dificultad', () => {
    expect(TRANSPOSITION_TONICS).toHaveLength(12)
    expect(new Set(TRANSPOSITION_TONICS).size).toBe(12)
    expect(TRANSPOSITION_TONICS).toEqual([
      'C',
      'G',
      'D',
      'A',
      'E',
      'B',
      'F#',
      'F',
      'Bb',
      'Eb',
      'Ab',
      'Db',
    ])
    expect(TRANSPOSITION_DIFFICULTIES).toEqual([1, 2, 3])
    expect(TRANSPOSITION_PATTERNS[1]).toHaveLength(4)
    expect(TRANSPOSITION_PATTERNS[2]).toHaveLength(4)
    expect(TRANSPOSITION_PATTERNS[3]).toHaveLength(4)
    for (const length of [1, 2, 3] as const) {
      for (const pattern of TRANSPOSITION_PATTERNS[length]) {
        expect(pattern).toHaveLength(length === 1 ? 4 : length === 2 ? 5 : 6)
        expect(pattern.every((degree) => degree >= 1 && degree <= 8)).toBe(true)
      }
    }
  })

  it('genera una melodía corta y su respuesta transportada', () => {
    const exercise = generateTranspositionExercise({
      id: 'ex.transposition.c-to-g',
      skillId: 'skill.transposition',
      fromKey: 'C',
      toKey: 'G',
      difficulty: 1,
      patternIndex: 0,
    })

    expect(formatMelody(exercise.melody)).toBe('C4 D4 E4 G4')
    expect(formatMelody(exercise.answer)).toBe('G4 A4 B4 D5')
    expect(exercise.promptEs).toContain('Do mayor')
    expect(exercise.promptEs).toContain('Sol mayor')
    expect(exercise.explanationEs).toContain('subiendo 7 semitonos')
    expect(exercise.explanationEs).toContain('G4 A4 B4 D5')
    expect(ExerciseSchema.safeParse(exercise).success).toBe(true)
  })

  it('construye melodías desde grados y respeta la octava de la tónica aguda', () => {
    expect(melodyFromDegrees('D', [1, 3, 5, 8]).map(formatPitch)).toEqual([
      'D4',
      'F#4',
      'A4',
      'D5',
    ])
    expect(() => melodyFromDegrees('C', [0])).toThrow('Grado de melodía inválido')
    expect(() => melodyFromDegrees('C', [9])).toThrow('Grado de melodía inválido')
    expect(() => melodyFromDegrees('Cb', [1])).toThrow('no pertenece a las 12 tonalidades')
  })

  it('mantiene la misma diferencia de altura en toda la melodía', () => {
    const exercises = generateTranspositionExercises({
      skillId: 'skill.transposition',
      idPrefix: 'ex.transposition.matrix',
      difficulty: 2,
    })

    expect(exercises).toHaveLength(12 * 11)
    for (const exercise of exercises) {
      const delta = transpositionSemitones(exercise.fromKey, exercise.toKey)
      const source = melodyMidis(exercise.melody)
      const target = melodyMidis(exercise.answer)
      expect(target).toHaveLength(source.length)
      for (let index = 0; index < source.length; index += 1) {
        expect(target[index] - source[index]).toBe(delta)
      }
    }
  })

  it('cumple ida y vuelta en los 132 pares ordenados', () => {
    const exercises = generateTranspositionExercises({
      skillId: 'skill.transposition',
      idPrefix: 'ex.transposition.roundtrip',
      difficulty: 3,
    })

    for (const exercise of exercises) {
      const back = transposeSpelledMelody(exercise.answer, exercise.toKey, exercise.fromKey)
      expect(melodyMidis(back)).toEqual(melodyMidis(exercise.melody))
    }
  })

  it('genera la matriz completa con ids únicos y ejercicios válidos', () => {
    const exercises = generateTranspositionExercises({
      skillId: 'skill.transposition',
      idPrefix: 'ex.transposition.full',
      difficulty: 2,
    })

    expect(exercises).toHaveLength(132)
    expect(new Set(exercises.map((exercise) => exercise.id)).size).toBe(132)
    expect(
      new Set(exercises.map((exercise) => `${exercise.fromKey}|${exercise.toKey}`)).size,
    ).toBe(132)

    for (const exercise of exercises) {
      expect(TRANSPOSITION_TONICS).toContain(exercise.fromKey)
      expect(TRANSPOSITION_TONICS).toContain(exercise.toKey)
      expect(exercise.fromKey).not.toBe(exercise.toKey)
      expect(exercise.melody).toHaveLength(5)
      expect(exercise.answer).toHaveLength(5)
      const result = ExerciseSchema.safeParse(exercise)
      expect(result.success).toBe(true)
      if (!result.success) continue
      const parsed = result.data
      if (parsed.type !== 'transposition') throw new Error('Tipo inesperado en la matriz')
      expect(parsed.answer).toEqual(exercise.answer)
      expect(parsed.fromKey).toBe(exercise.fromKey)
      expect(parsed.toKey).toBe(exercise.toKey)
    }
  })

  it('alarga la melodía según la dificultad', () => {
    const base = {
      skillId: 'skill.transposition',
      fromKey: 'C' as const,
      toKey: 'D' as const,
      patternIndex: 0,
    }
    const easy = generateTranspositionExercise({
      ...base,
      id: 'ex.transposition.easy',
      difficulty: 1,
    })
    const medium = generateTranspositionExercise({
      ...base,
      id: 'ex.transposition.medium',
      difficulty: 2,
    })
    const hard = generateTranspositionExercise({
      ...base,
      id: 'ex.transposition.hard',
      difficulty: 3,
    })

    expect(easy.melody).toHaveLength(4)
    expect(medium.melody).toHaveLength(5)
    expect(hard.melody).toHaveLength(6)
    expect(formatMelody(medium.melody)).toBe('C4 D4 E4 F4 G4')
    expect(formatMelody(hard.melody)).toBe('C4 D4 E4 F4 G4 C5')
  })

  it('permite limitar tonalidades y cantidad sin perder ids únicos', () => {
    const exercises = generateTranspositionExercises({
      skillId: 'skill.transposition',
      idPrefix: 'ex.transposition.custom',
      difficulty: 1,
      fromKeys: ['C', 'D'],
      toKeys: ['G', 'A'],
      count: 5,
    })

    expect(exercises).toHaveLength(5)
    expect(new Set(exercises.map((exercise) => exercise.id)).size).toBe(5)
    expect(
      exercises.map((exercise) => `${exercise.fromKey}|${exercise.toKey}`),
    ).toEqual([
      'C|G',
      'C|A',
      'D|G',
      'D|A',
      'C|G',
    ])
    for (const exercise of exercises) {
      expect(ExerciseSchema.safeParse(exercise).success).toBe(true)
    }
  })

  it('rechaza tonalidades iguales o desconocidas', () => {
    expect(() =>
      generateTranspositionExercise({
        id: 'ex.transposition.same-key',
        skillId: 'skill.transposition',
        fromKey: 'C',
        toKey: 'C',
        difficulty: 1,
      }),
    ).toThrow('deben ser distintas')

    expect(() =>
      generateTranspositionExercise({
        id: 'ex.transposition.unknown-key',
        skillId: 'skill.transposition',
        fromKey: 'Cb',
        toKey: 'C',
        difficulty: 1,
      }),
    ).toThrow('no pertenece a las 12 tonalidades')

    expect(() =>
      generateTranspositionExercise({
        id: 'ex.transposition.bad-difficulty',
        skillId: 'skill.transposition',
        fromKey: 'C',
        toKey: 'G',
        difficulty: 4 as 1,
      }),
    ).toThrow('Dificultad de transposición inválida')

    expect(() =>
      transposeSpelledMelody(
        generateTranspositionExercise({
          id: 'ex.transposition.self',
          skillId: 'skill.transposition',
          fromKey: 'C',
          toKey: 'G',
          difficulty: 1,
        }).melody,
        'C',
        'C',
      ),
    ).toThrow('deben ser distintas')
  })
})
