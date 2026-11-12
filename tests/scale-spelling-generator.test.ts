import { describe, expect, it } from 'vitest'
import { ExerciseSchema } from '../src/schemas/content'
import { scaleNames, type ScaleMode } from '../src/theory'
import {
  SCALE_SPELLING_MODES,
  SCALE_SPELLING_TONICS,
  canonicalScaleSpelling,
  generateScaleSpellingExercise,
  generateScaleSpellingExercises,
  isCorrectScaleSpelling,
  normalizeScaleSpelling,
} from '../src/exercises/generators/scale-spelling'
import type { Key } from '../src/schemas/notation'
import type { ScaleSpellingExercise } from '../src/exercises/generators/scale-spelling'

function expectedSpelling(tonic: Key, mode: ScaleMode): string {
  const names = scaleNames(tonic, mode)
  return [...names, names[0]].join(' ')
}

describe('F2-034 — Generador de ejercicios de deletrear escalas', () => {
  it('define las doce tónicas y los modos de M2 sin duplicados', () => {
    expect(SCALE_SPELLING_TONICS).toHaveLength(12)
    expect(new Set(SCALE_SPELLING_TONICS).size).toBe(12)
    expect(SCALE_SPELLING_MODES).toHaveLength(16)
    expect(new Set(SCALE_SPELLING_MODES).size).toBe(16)
    for (const mode of [
      'major',
      'natural-minor',
      'harmonic-minor',
      'melodic-minor',
      'dorian',
      'lydian',
      'major-pentatonic',
      'minor-pentatonic',
      'blues',
      'chromatic',
      'whole-tone',
    ]) {
      expect(SCALE_SPELLING_MODES).toContain(mode)
    }
  })

  it('deletrea una escala con su respuesta canónica y opciones de respaldo', () => {
    const exercise = generateScaleSpellingExercise({
      id: 'ex.scale-spelling.fsharp-major',
      skillId: 'skill.major-scale',
      tonic: 'F#',
      mode: 'major',
      difficulty: 2,
    })

    expect(exercise.answer).toBe('F# G# A# B C# D# E# F#')
    expect(exercise.choices).toContain(exercise.answer)
    expect(exercise.choices).toHaveLength(3)
    expect(new Set(exercise.choices).size).toBe(exercise.choices.length)
    expect(exercise.promptEs).toContain('Fa sostenido')
    expect(exercise.promptEs).toContain('mayor')
    expect(exercise.explanationEs).toContain(exercise.answer)
  })

  it('genera la matriz completa de 12 tónicas × 16 modos', () => {
    const exercises = generateScaleSpellingExercises({
      skillId: 'skill.major-scale',
      idPrefix: 'ex.scale-spelling.matrix',
      difficulty: 3,
    })

    expect(exercises).toHaveLength(12 * 16)
    expect(new Set(exercises.map((exercise) => exercise.id)).size).toBe(12 * 16)
    expect(
      new Set(exercises.map((exercise) => `${exercise.tonic}|${exercise.mode}`)).size,
    ).toBe(12 * 16)

    for (const exercise of exercises) {
      const result = ExerciseSchema.safeParse(exercise)
      expect(result.success).toBe(true)
      if (!result.success) continue
      const parsed = result.data
      if (parsed.type !== 'scale-spelling') throw new Error('Tipo inesperado en la matriz')
      expect(parsed.answer).toBe(exercise.answer)
      expect(parsed.tonic).toBe(exercise.tonic)
      expect(parsed.mode).toBe(exercise.mode)
      expect(exercise.answer).toBe(expectedSpelling(exercise.tonic, exercise.mode))
      expect(exercise.choices).toContain(exercise.answer)
      expect(exercise.choices).toHaveLength(4)
      expect(new Set(exercise.choices).size).toBe(exercise.choices.length)
      expect(isCorrectScaleSpelling(exercise, exercise.answer)).toBe(true)

      const wrong = exercise.choices.find((choice) => choice !== exercise.answer)
      expect(wrong).toBeDefined()
      expect(isCorrectScaleSpelling(exercise, wrong ?? '')).toBe(false)
    }
  })

  it('valida la ortografía de los casos de referencia', () => {
    const cases: Array<[Key, ScaleMode, string]> = [
      ['C', 'major', 'C D E F G A B C'],
      ['F#', 'major', 'F# G# A# B C# D# E# F#'],
      ['Eb', 'natural-minor', 'Eb F Gb Ab Bb Cb Db Eb'],
      ['A', 'harmonic-minor', 'A B C D E F G# A'],
      ['D', 'melodic-minor', 'D E F G A B C# D'],
      ['C', 'dorian', 'C D Eb F G A Bb C'],
      ['Ab', 'phrygian', 'Ab Bbb Cb Db Eb Fb Gb Ab'],
      ['C', 'locrian', 'C Db Eb F Gb Ab Bb C'],
      ['C', 'major-pentatonic', 'C D E G A C'],
      ['C', 'minor-pentatonic', 'C Eb F G Bb C'],
      ['C', 'blues', 'C Eb F Gb G Bb C'],
      ['C', 'chromatic', 'C C# D D# E F F# G G# A A# B C'],
      ['C', 'whole-tone', 'C D E F# G# A# C'],
    ]

    for (const [tonic, mode, expected] of cases) {
      expect(canonicalScaleSpelling(tonic, mode)).toBe(expected)
      const exercise = generateScaleSpellingExercise({
        id: `ex.scale-spelling.${tonic.toLowerCase().replace('#', '-sostenido')}-${mode}`,
        skillId: 'skill.major-scale',
        tonic,
        mode,
        difficulty: 1,
      })
      expect(exercise.answer).toBe(expected)
      expect(ExerciseSchema.safeParse(exercise).success).toBe(true)
    }
  })

  it('normaliza la respuesta escrita por teclado', () => {
    const exercise = generateScaleSpellingExercise({
      id: 'ex.scale-spelling.normalize',
      skillId: 'skill.major-scale',
      tonic: 'Bb',
      mode: 'major',
      difficulty: 1,
    })

    expect(exercise.answer).toBe('Bb C D Eb F G A Bb')
    expect(isCorrectScaleSpelling(exercise, 'Bb C D Eb F G A Bb')).toBe(true)
    expect(isCorrectScaleSpelling(exercise, '  bb, c, d, eb, f, g, a, bb  ')).toBe(true)
    expect(isCorrectScaleSpelling(exercise, 'B♭ C D E♭ F G A B♭')).toBe(true)
    expect(isCorrectScaleSpelling(exercise, 'Bb C D E F G A Bb')).toBe(false)
    expect(normalizeScaleSpelling(' f#,  g# ,a# ')).toBe('F# G# A#')
  })

  it('ajusta la cantidad de opciones a la dificultad', () => {
    const base = {
      skillId: 'skill.major-scale',
      tonic: 'C' as const,
      mode: 'major' as const,
    }
    const easy = generateScaleSpellingExercise({ ...base, id: 'ex.scale-spelling.easy', difficulty: 1 })
    const medium = generateScaleSpellingExercise({
      ...base,
      id: 'ex.scale-spelling.medium',
      difficulty: 2,
    })
    const hard = generateScaleSpellingExercise({ ...base, id: 'ex.scale-spelling.hard', difficulty: 3 })

    expect(easy.choices).toHaveLength(2)
    expect(medium.choices).toHaveLength(3)
    expect(hard.choices).toHaveLength(4)
  })

  it('permite limitar tónicas, modos y cantidad sin perder ids únicos', () => {
    const exercises = generateScaleSpellingExercises({
      skillId: 'skill.major-scale',
      idPrefix: 'ex.scale-spelling.custom',
      difficulty: 2,
      tonics: ['C', 'F#'],
      modes: ['major', 'harmonic-minor'],
      count: 7,
    })

    expect(exercises).toHaveLength(7)
    expect(new Set(exercises.map((exercise) => exercise.id)).size).toBe(7)
    const pairs = exercises.map((exercise) => `${exercise.tonic}|${exercise.mode}`)
    expect(new Set(pairs)).toEqual(new Set(['C|major', 'C|harmonic-minor', 'F#|major', 'F#|harmonic-minor']))
    for (const exercise of exercises) {
      expect(isCorrectScaleSpelling(exercise, exercise.answer)).toBe(true)
      expect(ExerciseSchema.safeParse(exercise).success).toBe(true)
    }
  })

  it('rechaza la respuesta si no coincide con la ortografía canónica', () => {
    const exercise: ScaleSpellingExercise = generateScaleSpellingExercise({
      id: 'ex.scale-spelling.reject',
      skillId: 'skill.major-scale',
      tonic: 'D',
      mode: 'major',
      difficulty: 2,
    })

    expect(isCorrectScaleSpelling(exercise, 'D E F G A B C D')).toBe(false)
    expect(isCorrectScaleSpelling(exercise, 'D E F# G A B C# D')).toBe(true)
    expect(isCorrectScaleSpelling(exercise, '')).toBe(false)
  })
})
