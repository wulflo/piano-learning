import { describe, expect, it } from 'vitest'
import { ExerciseSchema } from '../src/schemas'
import type { Exercise } from '../src/schemas'
import { chordExerciseTimeline, earChordTimeline } from '../src/exercises/audio'

type ChordExercise = Extract<Exercise, { type: 'chord' }>
type EarChordExercise = Extract<Exercise, { type: 'ear-chord' }>

function chordExercise(overrides: Record<string, unknown> = {}): ChordExercise {
  return ExerciseSchema.parse({
    id: 'ex.test.chord',
    skillId: 'skill.test',
    promptEs: 'Escribí las notas del acorde.',
    explanationEs: 'Explicación de prueba.',
    difficulty: 1,
    type: 'chord',
    root: { step: 'C', accidental: '', octave: 4 },
    quality: 'major',
    ...overrides,
  }) as ChordExercise
}

function earChordExercise(
  overrides: Record<string, unknown> = {},
): EarChordExercise {
  return ExerciseSchema.parse({
    id: 'ex.test.ear-chord',
    skillId: 'skill.test',
    promptEs: '¿Qué acorde suena?',
    explanationEs: 'Explicación de prueba.',
    difficulty: 1,
    type: 'ear-chord',
    quality: 'major',
    ...overrides,
  }) as EarChordExercise
}

describe('F3-018 — Reproducir acordes con voicings', () => {
  it('reproduce un acorde en bloque respetando el tempo', () => {
    const exercise = chordExercise()

    expect(chordExerciseTimeline(exercise, 120)).toEqual([
      { time: 0, duration: 0.5, midis: [60, 64, 67] },
    ])
    expect(chordExerciseTimeline(exercise, 60)).toEqual([
      { time: 0, duration: 1, midis: [60, 64, 67] },
    ])
  })

  it('respeta la inversión y el bajo con barra del ejercicio', () => {
    const firstInversion = chordExercise({ inversion: 1 })
    expect(chordExerciseTimeline(firstInversion, 120)[0]?.midis).toEqual([
      64, 67, 72,
    ])

    const slash = chordExercise({
      slash: { step: 'E', accidental: '', octave: 4 },
    })
    expect(chordExerciseTimeline(slash, 120)[0]?.midis).toEqual([64, 67, 72])

    const slashOutside = chordExercise({
      root: { step: 'C', accidental: '', octave: 4 },
      slash: { step: 'D', accidental: '', octave: 4 },
    })
    expect(chordExerciseTimeline(slashOutside, 120)[0]?.midis).toEqual([
      62, 72, 76, 79,
    ])
  })

  it('arpegia hacia arriba y hacia abajo', () => {
    const exercise = chordExercise()

    const up = chordExerciseTimeline(exercise, 120, 'arpeggio-up')
    expect(up.map((event) => event.midis)).toEqual([[60], [64], [67]])
    expect(up.map((event) => event.time)).toEqual([0, 0.5, 1])

    const down = chordExerciseTimeline(exercise, 120, 'arpeggio-down')
    expect(down.map((event) => event.midis)).toEqual([[67], [64], [60]])
    expect(down.map((event) => event.time)).toEqual([0, 0.5, 1])
  })

  it('sostiene el bajo y suma el acorde sin repetir su MIDI', () => {
    const exercise = chordExercise({ inversion: 1 })

    const timeline = chordExerciseTimeline(exercise, 120, 'bass-chord')
    expect(timeline).toEqual([
      { time: 0, duration: 1.5, midis: [64] },
      { time: 0.5, duration: 1, midis: [67, 72] },
    ])
  })

  it('usa el estilo del ejercicio auditivo y permite sobrescribirlo', () => {
    const exercise = earChordExercise({
      inversion: 1,
      style: 'arpeggio-up',
    })

    const byDefault = earChordTimeline(exercise, 80)
    expect(byDefault.map((event) => event.midis)).toEqual([[64], [67], [72]])
    expect(byDefault.map((event) => event.time)).toEqual([0, 0.75, 1.5])

    const block = earChordTimeline(exercise, 80, 'block')
    expect(block).toEqual([{ time: 0, duration: 0.75, midis: [64, 67, 72] }])
  })

  it('reproduce en bloque el estilo por defecto de un ejercicio auditivo', () => {
    const exercise = earChordExercise()

    expect(earChordTimeline(exercise, 120)).toEqual([
      { time: 0, duration: 0.5, midis: [60, 64, 67] },
    ])
  })

  it('acepta bajo+acorde como estilo de un ejercicio auditivo', () => {
    const exercise = earChordExercise({ style: 'bass-chord' })

    expect(earChordTimeline(exercise, 120)).toEqual([
      { time: 0, duration: 1.5, midis: [60] },
      { time: 0.5, duration: 1, midis: [64, 67] },
    ])
  })
})
