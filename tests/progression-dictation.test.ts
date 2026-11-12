import { describe, expect, it } from 'vitest'
import { timelineDuration } from '../src/audio/notes'
import type { Exercise } from '../src/schemas'
import {
  buildProgressionDictation,
  PROGRESSION_CHORD_BEATS,
  PROGRESSION_DICTATION_MODES,
  progressionDiatonicMode,
} from '../src/exercises/progression-dictation'
import { repeatDictationTimeline } from '../src/exercises/dictation'

type EarProgressionExercise = Extract<Exercise, { type: 'ear-progression' }>

const CHOICES = ['I IV V I', 'I V vi IV', 'ii V I IV']

function earProgression(
  degrees: string[] = ['I', 'IV', 'V', 'I'],
  overrides: Partial<EarProgressionExercise> = {},
): EarProgressionExercise {
  return {
    id: 'test.ear-progression',
    skillId: 'skill.chord-quality',
    type: 'ear-progression',
    promptEs: '¿Qué grados suenan?',
    promptEn: 'Which degrees do you hear?',
    explanationEs: 'Explicación de prueba.',
    explanationEn: 'Test explanation.',
    difficulty: 2,
    key: 'C',
    mode: 'major',
    degrees,
    choices: CHOICES,
    choicesEn: CHOICES,
    ...overrides,
  }
}

describe('F3-023 — Dictado de progresiones', () => {
  it('arma los acordes diatónicos y los encadena en un timeline', () => {
    expect(PROGRESSION_DICTATION_MODES).toEqual(['major', 'minor'])
    expect(PROGRESSION_CHORD_BEATS).toBe(1.5)

    const dictation = buildProgressionDictation(earProgression(), {
      tempo: 60,
    })

    expect(dictation.key).toBe('C')
    expect(dictation.mode).toBe('major')
    expect(dictation.diatonicMode).toBe('major')
    expect(dictation.degrees).toEqual(['I', 'IV', 'V', 'I'])
    expect(dictation.chords).toEqual([
      { numeral: 'I', midis: [60, 64, 67] },
      { numeral: 'IV', midis: [65, 69, 72] },
      { numeral: 'V', midis: [67, 71, 74] },
      { numeral: 'I', midis: [60, 64, 67] },
    ])
    expect(dictation.timeline).toEqual([
      { time: 0, duration: 1.5, midis: [60, 64, 67] },
      { time: 1.5, duration: 1.5, midis: [65, 69, 72] },
      { time: 3, duration: 1.5, midis: [67, 71, 74] },
      { time: 4.5, duration: 1.5, midis: [60, 64, 67] },
    ])
    expect(timelineDuration(dictation.timeline)).toBe(6)
    // La respuesta repite la progresión en bloque, sin cambios de contenido.
    expect(dictation.answerTimeline).toEqual(dictation.timeline)
  })

  it('respeta la tonalidad, la ortografía y el modo menor', () => {
    const gMajor = buildProgressionDictation(
      earProgression(['I', 'V', 'vi', 'IV'], { key: 'G' }),
      { tempo: 60 },
    )
    expect(gMajor.chords.map((chord) => chord.midis)).toEqual([
      [67, 71, 74],
      [74, 78, 81],
      [76, 79, 83],
      [72, 76, 79],
    ])

    const bbMajor = buildProgressionDictation(
      earProgression(['I', 'IV', 'V'], { key: 'Bb' }),
      { tempo: 60 },
    )
    expect(bbMajor.chords.map((chord) => chord.midis)).toEqual([
      [70, 74, 77],
      [75, 79, 82],
      [77, 81, 84],
    ])

    const aMinor = buildProgressionDictation(
      earProgression(['i', 'iv', 'V', 'i'], { key: 'A', mode: 'minor' }),
      { tempo: 60 },
    )
    expect(aMinor.diatonicMode).toBe('natural-minor')
    expect(progressionDiatonicMode('minor')).toBe('natural-minor')
    expect(aMinor.chords.map((chord) => chord.midis)).toEqual([
      [69, 72, 76],
      [74, 77, 81],
      [76, 80, 83],
      [69, 72, 76],
    ])
  })

  it('resuelve la respuesta canónica y las alternativas aceptadas', () => {
    const dictation = buildProgressionDictation(earProgression())

    expect(dictation.answer).toBe('I IV V I')
    expect(dictation.accepted).toContain('I IV V I')

    const withoutChoices = buildProgressionDictation(
      earProgression(['I', 'IV', 'V', 'I'], { choices: undefined }),
    )
    expect(withoutChoices.accepted).toEqual(
      expect.arrayContaining(['I IV V I', 'I - IV - V - I']),
    )
  })

  it('adjunta la regla «Recordá» en español e inglés', () => {
    const es = buildProgressionDictation(earProgression(), { locale: 'es' })
    const en = buildProgressionDictation(earProgression(), { locale: 'en' })

    expect(es.feedback.titleEs).toBe('Recordá los números romanos')
    expect(es.feedback.ruleEs).toContain('En mayor')
    expect(en.feedback.titleEn).toBe('Remember Roman numerals')
    expect(en.feedback.ruleEn).toContain('Uppercase means major chords')
  })

  it('reutiliza la política compartida de repeticiones', () => {
    const dictation = buildProgressionDictation(earProgression(), {
      tempo: 60,
    })
    const repeated = repeatDictationTimeline(dictation.timeline, {
      times: 3,
      tempo: 60,
    })

    expect(repeated).toHaveLength(12)
    expect(timelineDuration(repeated)).toBe(19)
    expect(repeated[4]?.time).toBe(6.5)
    expect(repeated[11]?.time).toBe(17.5)
  })

  it('es determinista y usa el tempo indicado', () => {
    const first = buildProgressionDictation(earProgression())
    const second = buildProgressionDictation(earProgression())
    expect(second).toEqual(first)

    const fast = buildProgressionDictation(earProgression(), { tempo: 120 })
    expect(fast.timeline[1]?.duration).toBe(0.75)
    expect(timelineDuration(fast.timeline)).toBe(3)
  })
})
