import { describe, expect, it } from 'vitest'
import type { Exercise } from '../src/schemas'
import type { ChordQuality } from '../src/theory'
import {
  buildChordDictation,
  CHORD_DICTATION_SEVENTH_QUALITIES,
  chordDictationMode,
} from '../src/exercises/chord-dictation'
import { repeatDictationTimeline } from '../src/exercises/dictation'

type EarChordExercise = Extract<Exercise, { type: 'ear-chord' }>

const SEVENTH_CHOICES = [
  'séptima mayor',
  'séptima de dominante',
  'séptima menor',
  'séptima semidisminuida',
  'séptima disminuida',
]
const SEVENTH_CHOICES_EN = [
  'major seventh',
  'dominant seventh',
  'minor seventh',
  'half-diminished seventh',
  'diminished seventh',
]

function earChord(
  quality: ChordQuality = 'major7',
  overrides: Partial<EarChordExercise> = {},
): EarChordExercise {
  return {
    id: `test.ear-chord.${quality}`,
    skillId: 'skill.chord-quality-ear',
    type: 'ear-chord',
    promptEs: '¿Qué acorde suena?',
    promptEn: 'Which chord do you hear?',
    explanationEs: 'Explicación de prueba.',
    explanationEn: 'Test explanation.',
    difficulty: 2,
    root: { step: 'C', accidental: '', octave: 4 },
    quality,
    inversion: 0,
    style: 'block',
    choices: SEVENTH_CHOICES,
    choicesEn: SEVENTH_CHOICES_EN,
    ...overrides,
  }
}

describe('F3-021 — Dictado de calidad de acordes', () => {
  it('arma un acorde en bloque con el voicing del ejercicio', () => {
    const dictation = buildChordDictation(earChord('major7'), { tempo: 60 })

    expect(dictation.quality).toBe('major7')
    expect(dictation.mode).toBe('block')
    expect(dictation.midis).toEqual([60, 64, 67, 71])
    expect(dictation.timeline).toEqual([
      { time: 0, duration: 1, midis: [60, 64, 67, 71] },
    ])
  })

  it('arpegia hacia arriba o hacia abajo según el estilo', () => {
    const up = buildChordDictation(earChord('major7'), {
      tempo: 60,
      style: 'arpeggio-up',
    })
    expect(up.mode).toBe('arpeggio')
    expect(up.timeline.map((event) => event.midis)).toEqual([
      [60],
      [64],
      [67],
      [71],
    ])
    expect(up.timeline.map((event) => event.time)).toEqual([0, 1, 2, 3])

    const down = buildChordDictation(earChord('major7'), {
      tempo: 60,
      style: 'arpeggio-down',
    })
    expect(down.timeline.map((event) => event.midis)).toEqual([
      [71],
      [67],
      [64],
      [60],
    ])

    expect(chordDictationMode('block')).toBe('block')
    expect(chordDictationMode('bass-chord')).toBe('block')
    expect(chordDictationMode('arpeggio-up')).toBe('arpeggio')
    expect(chordDictationMode('arpeggio-down')).toBe('arpeggio')
  })

  it('entrega la respuesta en bloque aunque la pregunta sea un arpegio', () => {
    const up = buildChordDictation(earChord('major7'), {
      tempo: 60,
      style: 'arpeggio-up',
    })
    expect(up.answerTimeline).toEqual([
      { time: 0, duration: 1, midis: [60, 64, 67, 71] },
    ])

    const block = buildChordDictation(earChord('minor'), { tempo: 60 })
    expect(block.answerTimeline).toEqual(block.timeline)
  })

  it('cubre las cinco calidades de séptima y las distingue por sus intervalos', () => {
    expect(CHORD_DICTATION_SEVENTH_QUALITIES).toEqual([
      'major7',
      'dominant7',
      'minor7',
      'half-diminished7',
      'diminished7',
    ])

    const shapes = CHORD_DICTATION_SEVENTH_QUALITIES.map((quality) => {
      const dictation = buildChordDictation(earChord(quality), { tempo: 60 })
      expect(dictation.quality).toBe(quality)
      expect(dictation.midis).toHaveLength(4)
      expect(dictation.answer).toBe(
        SEVENTH_CHOICES[
          CHORD_DICTATION_SEVENTH_QUALITIES.indexOf(quality)
        ],
      )
      return dictation.midis.join(',')
    })

    // Las cinco séptimas parten de Do4 pero no comparten el mismo voicing.
    expect(new Set(shapes).size).toBe(5)
  })

  it('respeta la inversión del ejercicio', () => {
    const firstInversion = buildChordDictation(
      earChord('major7', { inversion: 1 }),
      { tempo: 60 },
    )
    expect(firstInversion.midis).toEqual([64, 67, 71, 72])
    expect(firstInversion.inversion).toBe(1)
  })

  it('resuelve la respuesta canónica y el feedback «Recordá» en ambos idiomas', () => {
    const spanish = buildChordDictation(earChord('major7'), { tempo: 60 })
    expect(spanish.answer).toBe('séptima mayor')
    expect(spanish.accepted).toContain('séptima mayor')
    expect(spanish.feedback.titleEs).toBe('Recordá distinguir la calidad')
    expect(spanish.feedback.ruleEs).not.toBe('')
    expect(spanish.feedback.exampleEs).not.toBe('')

    const english = buildChordDictation(earChord('major7'), {
      tempo: 60,
      locale: 'en',
    })
    expect(english.answer).toBe('major seventh')
    expect(english.accepted).toContain('major seventh')
    expect(english.feedback.titleEn).not.toBe('')
    expect(english.feedback.ruleEn).not.toBe('')
  })

  it('reutiliza la política de repeticiones de los dictados', () => {
    const { timeline } = buildChordDictation(earChord('major7'), {
      tempo: 60,
    })

    const twice = repeatDictationTimeline(timeline, {
      times: 2,
      gapBeats: 1,
      tempo: 60,
    })
    expect(twice).toHaveLength(2)
    expect(twice[1]?.time).toBeCloseTo(2)

    const capped = repeatDictationTimeline(timeline, {
      times: 99,
      tempo: 60,
    })
    expect(capped).toHaveLength(3)
  })

  it('es determinista y permite cambiar el estilo sin tocar el contenido', () => {
    const first = buildChordDictation(earChord('dominant7'), {
      tempo: 72,
      locale: 'es',
    })
    const second = buildChordDictation(earChord('dominant7'), {
      tempo: 72,
      locale: 'es',
    })
    expect(first).toEqual(second)

    const overridden = buildChordDictation(earChord('dominant7'), {
      tempo: 72,
      style: 'arpeggio-up',
    })
    expect(overridden.style).toBe('arpeggio-up')
    expect(overridden.mode).toBe('arpeggio')
    expect(overridden.midis).toEqual([60, 64, 67, 70])
  })
})
