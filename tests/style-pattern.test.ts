import { describe, expect, it } from 'vitest'
import {
  stylePatternCandidates,
  stylePatternInMeasure,
  styleProgressionCandidates,
  styleProgressionDegrees,
  styleScaleCandidates,
  styleScaleName,
  styleVoicingCandidates,
  styleVoicingPitches,
} from '../src/exercises/style-pattern'
import type { Score } from '../src/schemas'

type Duration = 'whole' | 'half' | 'quarter' | 'eighth'

function chordEvent(
  id: string,
  measure: number,
  beat: number,
  duration: Duration,
  symbol?: string,
  velocity = 84,
): Score['events'][number] {
  return {
    id,
    measure,
    beat,
    value: { duration, dots: 0, tuplet: 'none' },
    pitches: [
      { step: 'C', accidental: '', octave: 4 },
      { step: 'E', accidental: '', octave: 4 },
      { step: 'G', accidental: '', octave: 4 },
    ],
    hand: 'right',
    voice: 1,
    velocity,
    tieToNext: false,
    ...(symbol ? { chordSymbol: symbol } : {}),
  }
}

function noteEvent(
  id: string,
  beat: number,
  step: Score['events'][number]['pitches'][number]['step'],
  accidental: Score['events'][number]['pitches'][number]['accidental'] = '',
  octave = 4,
): Score['events'][number] {
  return {
    id,
    measure: 1,
    beat,
    value: { duration: 'quarter', dots: 0, tuplet: 'none' },
    pitches: [{ step, accidental, octave }],
    hand: 'right',
    voice: 1,
    velocity: 84,
    tieToNext: false,
  }
}

function scoreWith(events: Score['events'], key = 'C'): Score {
  return {
    clef: 'treble',
    key,
    mode: 'major',
    timeSignature: { numerator: 4, denominator: 4 },
    tempoBpm: 96,
    events,
    pedals: [],
  }
}

function patternScore(
  pattern: 'eighths' | 'quarters' | 'half-time' | 'syncopated',
): Score {
  if (pattern === 'eighths') {
    return scoreWith(
      Array.from({ length: 8 }, (_, index) =>
        chordEvent(`e.${index}`, 1, index * 0.5, 'eighth', 'C'),
      ),
    )
  }
  if (pattern === 'quarters') {
    return scoreWith(
      Array.from({ length: 4 }, (_, index) =>
        chordEvent(`q.${index}`, 1, index, 'quarter', 'C'),
      ),
    )
  }
  if (pattern === 'half-time') {
    return scoreWith([
      chordEvent('h.1', 1, 0, 'half', 'C'),
      chordEvent('h.2', 1, 2, 'half', 'C'),
    ])
  }
  return scoreWith([
    chordEvent('s.1', 1, 0, 'eighth', 'C'),
    chordEvent('s.2', 1, 1.5, 'eighth', 'C'),
    chordEvent('s.3', 1, 2, 'eighth', 'C'),
    chordEvent('s.4', 1, 3.5, 'eighth', 'C'),
  ])
}

describe('Patrones y progresiones de estilo', () => {
  it('reconoce corcheas, negras, medio tiempo y síncopa', () => {
    for (const pattern of [
      'eighths',
      'quarters',
      'half-time',
      'syncopated',
    ] as const) {
      expect(stylePatternInMeasure(patternScore(pattern), 1), pattern).toBe(
        pattern,
      )
    }
  })

  it('devuelve null cuando el compás no tiene acordes o no encaja', () => {
    expect(stylePatternInMeasure(scoreWith([]), 1)).toBeNull()
    const stray = scoreWith([
      chordEvent('x.1', 1, 0, 'quarter'),
      chordEvent('x.2', 1, 2, 'quarter'),
    ])
    expect(stylePatternInMeasure(stray, 1)).toBeNull()
  })

  it('etiqueta los patrones en los dos idiomas', () => {
    expect(stylePatternCandidates('eighths', 'es')).toEqual(['Corcheas'])
    expect(stylePatternCandidates('half-time', 'en')).toEqual(['Half-time'])
    expect(stylePatternCandidates('syncopated', 'es')).toEqual(['Síncopa'])
  })

  it('lee los grados de una progresión mayor', () => {
    const score = scoreWith(
      [
        chordEvent('p.1', 1, 0, 'whole', 'C'),
        chordEvent('p.2', 2, 0, 'whole', 'G'),
        chordEvent('p.3', 3, 0, 'whole', 'Am'),
        chordEvent('p.4', 4, 0, 'whole', 'F'),
      ],
      'C',
    )
    expect(styleProgressionDegrees(score)).toEqual(['I', 'V', 'vi', 'IV'])
    expect(styleProgressionCandidates(['I', 'V', 'vi', 'IV'])[0]).toBe(
      'I–V–vi–IV',
    )
  })

  it('usa los grados de la escala de la tonalidad', () => {
    const score = scoreWith(
      [
        chordEvent('q.1', 1, 0, 'whole', 'Em'),
        chordEvent('q.2', 2, 0, 'whole', 'C'),
        chordEvent('q.3', 3, 0, 'whole', 'G'),
        chordEvent('q.4', 4, 0, 'whole', 'D'),
      ],
      'G',
    )
    expect(styleProgressionDegrees(score)).toEqual(['vi', 'IV', 'I', 'V'])
  })

  it('devuelve null si falta un cifrado o el acorde no es diatónico', () => {
    const missing = scoreWith([
      chordEvent('m.1', 1, 0, 'whole', 'C'),
      chordEvent('m.2', 2, 0, 'whole'),
    ])
    expect(styleProgressionDegrees(missing)).toBeNull()

    const chromatic = scoreWith([
      chordEvent('c.1', 1, 0, 'whole', 'C'),
      chordEvent('c.2', 2, 0, 'whole', 'D#'),
    ])
    expect(styleProgressionDegrees(chromatic)).toBeNull()
  })
})

describe('Shuffle, comping y escalas de estilo', () => {
  it('distingue el shuffle de las corcheas rectas por la intensidad', () => {
    const shuffle = scoreWith(
      Array.from({ length: 8 }, (_, index) =>
        chordEvent(
          `sh.${index}`,
          1,
          index * 0.5,
          'eighth',
          'C',
          index % 2 === 0 ? 96 : 72,
        ),
      ),
    )
    expect(stylePatternInMeasure(shuffle, 1)).toBe('shuffle')

    const straight = scoreWith(
      Array.from({ length: 8 }, (_, index) =>
        chordEvent(`st.${index}`, 1, index * 0.5, 'eighth', 'C'),
      ),
    )
    expect(stylePatternInMeasure(straight, 1)).toBe('eighths')

    const comping = scoreWith(
      Array.from({ length: 4 }, (_, index) =>
        chordEvent(`cp.${index}`, 1, index + 0.5, 'eighth', 'C'),
      ),
    )
    expect(stylePatternInMeasure(comping, 1)).toBe('comping')
  })

  it('etiqueta el shuffle y el comping en los dos idiomas', () => {
    expect(stylePatternCandidates('shuffle', 'es')).toEqual(['Shuffle'])
    expect(stylePatternCandidates('shuffle', 'en')).toEqual(['Shuffle'])
    expect(stylePatternCandidates('comping', 'es')).toEqual(['Comping'])
    expect(stylePatternCandidates('comping', 'en')).toEqual(['Comping'])
  })

  it('reconoce la bossa nova y el montuno de salsa', () => {
    const bossa = scoreWith([
      chordEvent('bo.1', 1, 1, 'half', 'Cmaj7'),
      chordEvent('bo.3', 1, 3, 'half', 'Cmaj7'),
    ])
    expect(stylePatternInMeasure(bossa, 1)).toBe('bossa')
    expect(stylePatternCandidates('bossa', 'es')).toEqual(['Bossa nova'])
    expect(stylePatternCandidates('bossa', 'en')).toEqual(['Bossa nova'])

    const montuno = scoreWith(
      [0, 0.5, 1.5, 2, 3, 3.5].map((beat, index) =>
        chordEvent(`mo.${index}`, 1, beat, 'eighth', 'Cmaj7'),
      ),
    )
    expect(stylePatternInMeasure(montuno, 1)).toBe('montuno')
    expect(stylePatternCandidates('montuno', 'es')).toEqual(['Montuno'])
    expect(stylePatternCandidates('montuno', 'en')).toEqual(['Montuno'])
  })

  it('reconoce la escala de blues, las pentatónicas y la mixolidia', () => {
    const blues = scoreWith([
      noteEvent('b.0', 0, 'C'),
      noteEvent('b.1', 0.5, 'E', 'b'),
      noteEvent('b.2', 1, 'F'),
      noteEvent('b.3', 1.5, 'G', 'b'),
      noteEvent('b.4', 2, 'G'),
      noteEvent('b.5', 2.5, 'B', 'b'),
      noteEvent('b.6', 3, 'C', '', 5),
    ])
    expect(styleScaleName(blues)).toBe('blues-scale')
    expect(styleScaleCandidates('blues-scale', 'es')).toEqual([
      'Escala de blues',
    ])
    expect(styleScaleCandidates('blues-scale', 'en')).toEqual(['Blues scale'])

    const majorPentatonic = scoreWith([
      noteEvent('mp.0', 0, 'C'),
      noteEvent('mp.1', 0.5, 'D'),
      noteEvent('mp.2', 1, 'E'),
      noteEvent('mp.3', 1.5, 'G'),
      noteEvent('mp.4', 2, 'A'),
    ])
    expect(styleScaleName(majorPentatonic)).toBe('major-pentatonic')

    const minorPentatonic = scoreWith([
      noteEvent('np.0', 0, 'C'),
      noteEvent('np.1', 0.5, 'E', 'b'),
      noteEvent('np.2', 1, 'F'),
      noteEvent('np.3', 1.5, 'G'),
      noteEvent('np.4', 2, 'B', 'b'),
    ])
    expect(styleScaleName(minorPentatonic)).toBe('minor-pentatonic')

    const mixolydian = scoreWith([
      noteEvent('mx.0', 0, 'C'),
      noteEvent('mx.1', 0.5, 'D'),
      noteEvent('mx.2', 1, 'E'),
      noteEvent('mx.3', 1.5, 'F'),
      noteEvent('mx.4', 2, 'G'),
      noteEvent('mx.5', 2.5, 'A'),
      noteEvent('mx.6', 3, 'B', 'b'),
    ])
    expect(styleScaleName(mixolydian)).toBe('mixolydian')
    expect(styleScaleCandidates('mixolydian', 'es')).toEqual(['Mixolidia'])
    expect(styleScaleCandidates('mixolydian', 'en')).toEqual(['Mixolydian'])
  })

  it('devuelve null si el fragmento no forma ninguna escala del módulo', () => {
    const chromatic = scoreWith([
      noteEvent('ch.0', 0, 'C'),
      noteEvent('ch.1', 0.5, 'C', '#'),
      noteEvent('ch.2', 1, 'D'),
      noteEvent('ch.3', 1.5, 'D', '#'),
      noteEvent('ch.4', 2, 'E'),
      noteEvent('ch.5', 2.5, 'F'),
    ])
    expect(styleScaleName(chromatic)).toBeNull()

    const short = scoreWith([
      noteEvent('s.0', 0, 'C'),
      noteEvent('s.1', 0.5, 'E'),
      noteEvent('s.2', 1, 'G'),
    ])
    expect(styleScaleName(short)).toBeNull()
    expect(styleScaleName(scoreWith([]))).toBeNull()
  })

  it('lee las notas de un voicing ordenadas de grave a agudo', () => {
    const root = chordEvent('v.root', 2, 0, 'whole', 'Dm7')
    root.pitches = [{ step: 'D', accidental: '', octave: 3 }]
    root.hand = 'left'
    const chord = chordEvent('v.chord', 2, 0, 'whole', 'Dm7')
    chord.pitches = [
      { step: 'E', accidental: '', octave: 5 },
      { step: 'F', accidental: '', octave: 4 },
      { step: 'C', accidental: '', octave: 5 },
      { step: 'A', accidental: '', octave: 4 },
    ]
    const score = scoreWith([root, chord])

    expect(styleVoicingPitches(score, 2)?.map((pitch) => pitch.step)).toEqual([
      'F',
      'A',
      'C',
      'E',
    ])
    expect(styleVoicingCandidates(score, 2, 'es')).toEqual([
      'Fa4 + La4 + Do5 + Mi5',
    ])
    expect(styleVoicingCandidates(score, 2, 'en')).toEqual([
      'F4 + A4 + C5 + E5',
    ])
  })

  it('devuelve null si el compás no tiene un acorde en la mano derecha', () => {
    const onlyBass = scoreWith([
      noteEvent('v.bass', 0, 'D', '', 3),
      noteEvent('v.note', 1, 'F'),
    ])
    expect(styleVoicingPitches(onlyBass, 1)).toBeNull()
    expect(styleVoicingCandidates(onlyBass, 1, 'es')).toBeNull()
    expect(styleVoicingCandidates(scoreWith([]), 1, 'es')).toBeNull()
  })
})
