import { describe, expect, it } from 'vitest'
import type { Exercise, SpelledPitch } from '../src/schemas'
import {
  buildIntervalDictation,
  intervalDictationDirection,
  MAX_DICTATION_PLAYS,
  MAX_DICTATION_REPEATS,
  repeatDictationTimeline,
} from '../src/exercises/interval-dictation'

function pitch(step: SpelledPitch['step'], octave: number): SpelledPitch {
  return { step, accidental: '', octave }
}

function spelled(
  step: SpelledPitch['step'],
  accidental: SpelledPitch['accidental'],
  octave: number,
): SpelledPitch {
  return { step, accidental, octave }
}

function earInterval(
  direction: 'ascending' | 'descending' | 'harmonic',
  lower: SpelledPitch = pitch('C', 4),
  upper: SpelledPitch = pitch('E', 4),
): Extract<Exercise, { type: 'ear-interval' }> {
  return {
    id: 'test.ear-interval',
    skillId: 'skill.ear-interval',
    type: 'ear-interval',
    promptEs: '¿Qué intervalo escuchás?',
    promptEn: 'Which interval do you hear?',
    explanationEs: 'Do4 y Mi4 forman una tercera mayor.',
    explanationEn: 'C4 and E4 form a major third.',
    difficulty: 2,
    lower,
    upper,
    direction,
    choices: ['Tercera mayor', 'Tercera menor', 'Segunda mayor'],
    choicesEn: ['Major third', 'Minor third', 'Major second'],
  }
}

function interval(
  direction: 'melodic' | 'harmonic',
  lower: SpelledPitch = pitch('C', 4),
  upper: SpelledPitch = pitch('E', 4),
): Extract<Exercise, { type: 'interval' }> {
  return {
    id: 'test.interval',
    skillId: 'skill.interval-quality',
    type: 'interval',
    promptEs: '¿Qué intervalo hay?',
    explanationEs: 'Do4 y Mi4 forman una tercera mayor.',
    difficulty: 2,
    lower,
    upper,
    direction,
    choices: ['Tercera mayor', 'Tercera menor'],
    choicesEn: ['Major third', 'Minor third'],
  }
}

describe('F3-020 — Dictado de intervalos en contexto', () => {
  it('envuelve un intervalo ascendente en una melodía con aproximación y resolución', () => {
    const dictation = buildIntervalDictation(earInterval('ascending'), {
      tempo: 60,
    })

    expect(dictation.direction).toBe('ascending')
    expect(dictation.lowerMidi).toBe(60)
    expect(dictation.upperMidi).toBe(64)
    expect(dictation.notes).toEqual([
      { midi: 59, beats: 0.5, role: 'approach' },
      { midi: 60, beats: 0.75, role: 'lower' },
      { midi: 64, beats: 1, role: 'upper' },
      { midi: 65, beats: 0.5, role: 'resolution' },
    ])
    expect(dictation.timeline).toEqual([
      { time: 0, duration: 0.5, midis: [59], label: 'approach' },
      { time: 0.5, duration: 0.75, midis: [60], label: 'lower' },
      { time: 1.25, duration: 1, midis: [64], label: 'upper' },
      { time: 2.25, duration: 0.5, midis: [65], label: 'resolution' },
    ])
  })

  it('invierte la melodía cuando el intervalo es descendente', () => {
    const dictation = buildIntervalDictation(earInterval('descending'), {
      tempo: 60,
    })

    expect(dictation.direction).toBe('descending')
    expect(dictation.notes).toEqual([
      { midi: 65, beats: 0.5, role: 'approach' },
      { midi: 64, beats: 0.75, role: 'upper' },
      { midi: 60, beats: 1, role: 'lower' },
      { midi: 59, beats: 0.5, role: 'resolution' },
    ])
    expect(dictation.timeline.map((event) => event.midis)).toEqual([
      [65],
      [64],
      [60],
      [59],
    ])
  })

  it('hace sonar juntas las dos notas de un intervalo armónico', () => {
    const dictation = buildIntervalDictation(earInterval('harmonic'), {
      tempo: 60,
    })

    expect(dictation.direction).toBe('harmonic')
    expect(dictation.timeline).toEqual([
      { time: 0, duration: 0.5, midis: [59], label: 'approach' },
      { time: 0.5, duration: 1.5, midis: [60, 64], label: 'harmonic' },
      { time: 2, duration: 0.5, midis: [65], label: 'resolution' },
    ])
  })

  it('respeta el tipo de intervalo visual y detecta el orden por altura', () => {
    const ascending = buildIntervalDictation(interval('melodic'), { tempo: 60 })
    expect(ascending.direction).toBe('ascending')

    const harmonic = buildIntervalDictation(interval('harmonic'), {
      tempo: 60,
    })
    expect(harmonic.direction).toBe('harmonic')

    const inverted = interval('melodic', pitch('E', 4), pitch('C', 4))
    expect(intervalDictationDirection(inverted)).toBe('descending')
    expect(
      buildIntervalDictation(inverted, { tempo: 60 }).timeline.map(
        (event) => event.midis[0],
      ),
    ).toEqual([65, 64, 60, 59])
  })

  it('resuelve la respuesta canónica y el feedback «Recordá» en ambos idiomas', () => {
    const spanish = buildIntervalDictation(earInterval('ascending'), {
      tempo: 60,
    })
    expect(spanish.answer).toBe('Tercera mayor')
    expect(spanish.accepted).toContain('Tercera mayor')
    expect(spanish.feedback.titleEs).toBe('Recordá los intervalos mayores')
    expect(spanish.feedback.ruleEs).not.toBe('')
    expect(spanish.feedback.exampleEs).not.toBe('')

    const english = buildIntervalDictation(earInterval('ascending'), {
      tempo: 60,
      locale: 'en',
    })
    expect(english.answer).toBe('Major third')
    expect(english.accepted).toContain('Major third')
    expect(english.feedback.ruleEn).not.toBe('')
  })

  it('elige la regla «Recordá» según la calidad real del intervalo', () => {
    const cases: Array<{
      lower: SpelledPitch
      upper: SpelledPitch
      titleEs: string
      titleEn: string
    }> = [
      {
        lower: pitch('C', 4),
        upper: pitch('F', 4),
        titleEs: 'Recordá los intervalos justos',
        titleEn: 'Remember perfect intervals',
      },
      {
        lower: pitch('C', 4),
        upper: pitch('E', 4),
        titleEs: 'Recordá los intervalos mayores',
        titleEn: 'Remember major intervals',
      },
      {
        lower: pitch('C', 4),
        upper: spelled('E', 'b', 4),
        titleEs: 'Recordá los intervalos menores',
        titleEn: 'Remember minor intervals',
      },
      {
        lower: pitch('C', 4),
        upper: spelled('F', '#', 4),
        titleEs: 'Recordá los intervalos aumentados',
        titleEn: 'Remember augmented intervals',
      },
      {
        lower: pitch('C', 4),
        upper: spelled('G', 'b', 4),
        titleEs: 'Recordá los intervalos disminuidos',
        titleEn: 'Remember diminished intervals',
      },
    ]

    for (const item of cases) {
      const spanish = buildIntervalDictation(
        earInterval('ascending', item.lower, item.upper),
        { tempo: 60 },
      )
      expect(spanish.feedback.titleEs).toBe(item.titleEs)
      expect(spanish.feedback.ruleEs).not.toBe('')
      expect(spanish.feedback.exampleEs).not.toBe('')

      const english = buildIntervalDictation(
        earInterval('ascending', item.lower, item.upper),
        { tempo: 60, locale: 'en' },
      )
      expect(english.feedback.titleEn).toBe(item.titleEn)
      expect(english.feedback.ruleEn).not.toBe('')
      expect(english.feedback.exampleEn).not.toBe('')
    }
  })

  it('repite la melodía con un silencio entre pasadas y acota la cantidad', () => {
    const { timeline } = buildIntervalDictation(earInterval('ascending'), {
      tempo: 60,
    })

    const twice = repeatDictationTimeline(timeline, {
      times: 2,
      gapBeats: 1,
      tempo: 60,
    })

    expect(twice).toHaveLength(8)
    expect(twice[4]?.time).toBeCloseTo(3.75)
    expect(twice[7]?.time).toBeCloseTo(6)
    expect(twice[4]?.midis).toEqual([59])
    expect(twice[7]?.midis).toEqual([65])

    expect(
      repeatDictationTimeline(timeline, { times: 0, tempo: 60 }),
    ).toHaveLength(4)
    expect(
      repeatDictationTimeline(timeline, { times: 99, tempo: 60 }),
    ).toHaveLength(4 * MAX_DICTATION_PLAYS)
    expect(MAX_DICTATION_REPEATS).toBe(MAX_DICTATION_PLAYS - 1)
    expect(repeatDictationTimeline([], { times: 3 })).toEqual([])
  })

  it('omite la aproximación y la resolución fuera del rango audible', () => {
    const low = buildIntervalDictation(
      earInterval('ascending', pitch('A', 0), pitch('C', 1)),
      { tempo: 60 },
    )
    expect(low.notes.map((note) => note.role)).toEqual(['lower', 'upper', 'resolution'])

    const high = buildIntervalDictation(
      earInterval('ascending', pitch('A', 7), pitch('C', 8)),
      { tempo: 60 },
    )
    expect(high.notes.map((note) => note.role)).toEqual([
      'approach',
      'lower',
      'upper',
    ])
  })

  it('separa la respuesta del contexto: el intervalo solo, sin aproximación', () => {
    const ascending = buildIntervalDictation(earInterval('ascending'), {
      tempo: 60,
    })
    expect(ascending.answerTimeline).toEqual([
      { time: 0, duration: 0.75, midis: [60] },
      { time: 0.75, duration: 0.75, midis: [64] },
    ])

    const descending = buildIntervalDictation(earInterval('descending'), {
      tempo: 60,
    })
    expect(descending.answerTimeline.map((event) => event.midis)).toEqual([
      [64],
      [60],
    ])

    const harmonic = buildIntervalDictation(earInterval('harmonic'), {
      tempo: 60,
    })
    expect(harmonic.answerTimeline).toEqual([
      { time: 0, duration: 2, midis: [60, 64] },
    ])
  })

  it('es determinista para el mismo ejercicio, tempo e idioma', () => {
    const first = buildIntervalDictation(earInterval('ascending'), {
      tempo: 72,
      locale: 'es',
    })
    const second = buildIntervalDictation(earInterval('ascending'), {
      tempo: 72,
      locale: 'es',
    })

    expect(first).toEqual(second)
  })
})
