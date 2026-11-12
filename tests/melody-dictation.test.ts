import { describe, expect, it } from 'vitest'
import { timelineDuration } from '../src/audio/notes'
import { buildMelodyDictation } from '../src/exercises/melody-dictation'
import { generateEarMelodyExercise } from '../src/exercises/generators/ear-melody'

function hiddenMelody() {
  return generateEarMelodyExercise({
    id: 'test.ear-melody',
    skillId: 'skill.play-by-ear',
    key: 'C',
    clef: 'treble',
    start: { step: 'C', accidental: 0, octave: 4 },
    steps: [1, 1, 2],
    from: 0,
    to: 3,
    ask: 'note',
    difficulty: 2,
  })
}

describe('F5-010 — Dictado de melodía oculta', () => {
  it('arma el timeline de la melodía sin revelar la partitura', () => {
    const exercise = hiddenMelody()
    const dictation = buildMelodyDictation(exercise, { tempo: 60 })

    expect(dictation.exerciseId).toBe('test.ear-melody')
    expect(dictation.timeline).toEqual([
      { time: 0, duration: 1, midis: [60], label: 'test.ear-melody.1' },
      { time: 1, duration: 1, midis: [62], label: 'test.ear-melody.2' },
      { time: 2, duration: 1, midis: [64], label: 'test.ear-melody.3' },
      { time: 3, duration: 1, midis: [67], label: 'test.ear-melody.4' },
    ])
    expect(timelineDuration(dictation.timeline)).toBe(4)
    expect(dictation.answerTimeline).toEqual(dictation.timeline)
  })

  it('resuelve la respuesta canónica en los dos idiomas', () => {
    const exercise = hiddenMelody()

    const spanish = buildMelodyDictation(exercise, { locale: 'es' })
    expect(spanish.answer).toBe('Sol4')
    expect(spanish.accepted).toContain('Sol4')

    const english = buildMelodyDictation(exercise, { locale: 'en' })
    expect(english.answer).toBe('G4')
    expect(english.accepted).toContain('G4')
  })

  it('respeta el tempo elegido por el alumno', () => {
    const exercise = hiddenMelody()
    const at120 = buildMelodyDictation(exercise, { tempo: 120 })
    const at60 = buildMelodyDictation(exercise, { tempo: 60 })

    expect(at120.timeline[1]?.time).toBe(0.5)
    expect(at120.timeline[0]?.duration).toBe(0.5)
    expect(at120.timeline[3]?.time).toBe(1.5)
    expect(at60.timeline[3]?.time).toBe(3)
  })

  it('adjunta la regla de «tocar de oído» para el feedback', () => {
    const dictation = buildMelodyDictation(hiddenMelody())

    expect(dictation.feedback.titleEs).toContain('oído')
    expect(dictation.feedback.ruleEs).toContain('cinco pasos')
    expect(dictation.feedback.exampleEs.length).toBeGreaterThan(40)
    expect(dictation.feedback.titleEn).toContain('ear')
    expect(dictation.feedback.ruleEn).toContain('five steps')
    expect(dictation.feedback.exampleEn.length).toBeGreaterThan(40)
  })
})
