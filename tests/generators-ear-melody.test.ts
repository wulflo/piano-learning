import { describe, expect, it } from 'vitest'
import { ExerciseSchema } from '../src/schemas/content'
import { resolveExerciseAnswer } from '../src/exercises/answer'
import { generateEarMelodyExercise } from '../src/exercises/generators/ear-melody'
import { melodyToScore } from '../src/exercises/transposition'
import { sightReadingNotes } from '../src/exercises/sight-reading'
import type { SpelledPitch } from '../src/schemas'

const START = { step: 'C', accidental: 0, octave: 4 } as const

function melody(params: {
  ask?: 'interval' | 'note' | 'motion'
  steps?: number[]
  from?: number
  to?: number
  difficulty?: 1 | 2 | 3 | 4
}) {
  return generateEarMelodyExercise({
    id: 'test.ear-melody',
    skillId: 'skill.play-by-ear',
    key: 'C',
    clef: 'treble',
    start: START,
    steps: params.steps ?? [1, 1, 2],
    from: params.from ?? 0,
    to: params.to ?? 3,
    ask: params.ask ?? 'note',
    difficulty: params.difficulty ?? 2,
  })
}

describe('F5-010 — Generador de melodías ocultas', () => {
  it('genera un ejercicio válido con la partitura guardada para revelar', () => {
    const exercise = melody({})
    const parsed = ExerciseSchema.safeParse(exercise)

    expect(parsed.success).toBe(true)
    expect(exercise.type).toBe('ear-melody')
    expect(exercise.skillId).toBe('skill.play-by-ear')
    expect(exercise.score.key).toBe('C')
    expect(exercise.score.clef).toBe('treble')
    expect(sightReadingNotes(exercise.score)).toHaveLength(4)
    expect(exercise.ask).toBe('note')
    expect(exercise.from).toBe(0)
    expect(exercise.to).toBe(3)
  })

  it('pide escuchar sin mostrar la partitura en el enunciado', () => {
    const exercise = melody({})

    expect(exercise.promptEs).toContain('Escuchá la melodía oculta')
    expect(exercise.promptEn).toContain('Listen to the hidden melody')
    expect(exercise.promptEs).not.toContain('pentagrama')
    expect(exercise.promptEn).not.toContain('staff')
    expect(exercise.explanationEs).toContain('partitura revelada')
    expect(exercise.explanationEn).toContain('revealed score')
  })

  it('mantiene la respuesta dentro de las opciones paralelas', () => {
    for (const ask of ['interval', 'note', 'motion'] as const) {
      const exercise = melody({ ask })
      const spanish = resolveExerciseAnswer(exercise, 'es')
      const english = resolveExerciseAnswer(exercise, 'en')

      expect(spanish.mode, ask).toBe('choice')
      expect(english.mode, ask).toBe('choice')
      if (spanish.mode !== 'choice' || english.mode !== 'choice') continue

      expect(exercise.choices, ask).toContain(spanish.answer)
      expect(exercise.choicesEn, ask).toContain(english.answer)
      expect(exercise.choices.length, ask).toBe(exercise.choicesEn.length)
      expect(
        exercise.choices.indexOf(spanish.answer),
        `${ask} índice paralelo`,
      ).toBe(exercise.choicesEn.indexOf(english.answer))
    }
  })

  it('genera melodías en clave de fa y en otras tonalidades', () => {
    const exercise = generateEarMelodyExercise({
      id: 'test.ear-melody.bass',
      skillId: 'skill.play-by-ear',
      key: 'F',
      clef: 'bass',
      start: { step: 'F', accidental: 0, octave: 2 },
      steps: [1, 2, -1, 2, -2],
      from: 0,
      to: 4,
      ask: 'motion',
      difficulty: 3,
    })

    expect(exercise.score.key).toBe('F')
    expect(exercise.score.clef).toBe('bass')
    expect(exercise.score.events.every((event) => event.hand === 'left')).toBe(
      true,
    )
    expect(sightReadingNotes(exercise.score)).toHaveLength(6)
    expect(ExerciseSchema.safeParse(exercise).success).toBe(true)
  })

  it('rechaza índices fuera de la melodía', () => {
    expect(() => melody({ from: 0, to: 9 })).toThrow(/índice/i)
  })
})

describe('F5-010 — Partitura para transponer', () => {
  const melody: SpelledPitch[] = [
    { step: 'C', accidental: '', octave: 4 },
    { step: 'E', accidental: '', octave: 4 },
    { step: 'G', accidental: '', octave: 4 },
    { step: 'C', accidental: '', octave: 5 },
    { step: 'G', accidental: '', octave: 4 },
  ]

  it('convierte una melodía en negras de 4/4', () => {
    const score = melodyToScore(melody, 'C', { idPrefix: 'test.transposicion' })

    expect(score.key).toBe('C')
    expect(score.timeSignature).toEqual({ numerator: 4, denominator: 4 })
    expect(score.clef).toBe('treble')
    expect(score.events).toHaveLength(5)
    expect(score.events.map((event) => event.value.duration)).toEqual([
      'quarter',
      'quarter',
      'quarter',
      'quarter',
      'quarter',
    ])
    expect(score.events.map((event) => event.measure)).toEqual([1, 1, 1, 1, 2])
    expect(score.events.map((event) => event.beat)).toEqual([0, 1, 2, 3, 0])
    expect(score.events[0]?.id).toBe('test.transposicion.1')
    expect(score.events.every((event) => event.hand === 'right')).toBe(true)
  })

  it('elige clave de fa para melodías graves', () => {
    const score = melodyToScore(
      [
        { step: 'C', accidental: '', octave: 3 },
        { step: 'G', accidental: '', octave: 2 },
      ],
      'C',
    )

    expect(score.clef).toBe('bass')
    expect(score.events.every((event) => event.hand === 'left')).toBe(true)
  })

  it('rechaza melodías vacías', () => {
    expect(() => melodyToScore([], 'C')).toThrow(/al menos una nota/)
  })
})
