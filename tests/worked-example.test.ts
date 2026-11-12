import { describe, expect, it } from 'vitest'
import type { Exercise, SpelledPitch } from '../src/schemas'
import { buildWorkedExample } from '../src/exercises/worked-example'
import { describeStaffNotes } from '../src/staff/render'
import { midiOf } from '../src/theory'

function pitch(
  step: SpelledPitch['step'],
  octave: number,
  accidental: SpelledPitch['accidental'] = '',
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
    choices: ['Tercera mayor', 'Tercera menor'],
    choicesEn: ['Major third', 'Minor third'],
  }
}

function chord(
  overrides: Partial<Extract<Exercise, { type: 'chord' }>> = {},
): Extract<Exercise, { type: 'chord' }> {
  return {
    id: 'test.chord',
    skillId: 'skill.chord-quality',
    type: 'chord',
    promptEs: '¿Qué acorde es?',
    promptEn: 'Which chord is it?',
    explanationEs: 'Do mayor = Do, Mi, Sol.',
    explanationEn: 'C major = C, E, G.',
    difficulty: 2,
    root: pitch('C', 4),
    quality: 'major',
    inversion: 0,
    ask: 'quality',
    choices: ['mayor', 'menor'],
    choicesEn: ['major', 'minor'],
    ...overrides,
  }
}

function notation(
  symbol: string,
): Extract<Exercise, { type: 'chord-notation' }> {
  return {
    id: 'test.chord-notation',
    skillId: 'skill.chord-notation',
    type: 'chord-notation',
    promptEs: 'Convertí el cifrado.',
    promptEn: 'Convert the chord symbol.',
    explanationEs: 'El cifrado conserva la calidad.',
    explanationEn: 'The symbol keeps the quality.',
    difficulty: 2,
    symbol,
    to: 'c',
    choices: ['C7/Gm', 'Cm7/G'],
    choicesEn: ['C7/Gm', 'Cm7/G'],
  }
}

function midis(example: NonNullable<ReturnType<typeof buildWorkedExample>>) {
  return example.measures.map((measure) =>
    measure.pitches.map((item) => midiOf(item)),
  )
}

describe('F3-028 — Ejemplos resueltos automáticos', () => {
  it('dibuja el mismo intervalo ascendente en dos medidas', () => {
    const example = buildWorkedExample(
      earInterval('ascending', pitch('C', 4), pitch('E', 4)),
    )

    expect(example).not.toBeNull()
    expect(example?.kind).toBe('interval')
    expect(midis(example!)).toEqual([[60], [64]])
    expect(example?.clef).toBe('treble')
    expect(describeStaffNotes(example!.measures, 'c')).toBe('C4 · E4')
  })

  it('dibuja el intervalo armónico en una sola medida', () => {
    const example = buildWorkedExample(
      earInterval('harmonic', pitch('C', 4), pitch('E', 4)),
    )

    expect(example?.measures).toHaveLength(1)
    expect(midis(example!)).toEqual([[60, 64]])
  })

  it('respeta el orden descendente del ítem', () => {
    const example = buildWorkedExample(
      earInterval('descending', pitch('E', 4), pitch('C', 4)),
    )

    expect(midis(example!)).toEqual([[64], [60]])
    expect(describeStaffNotes(example!.measures, 'c')).toBe('E4 · C4')
  })

  it('construye el acorde con la inversión del ejercicio', () => {
    const example = buildWorkedExample(
      chord({ inversion: 1, ask: 'inversion' }),
    )

    expect(example?.kind).toBe('chord')
    expect(midis(example!)).toEqual([[64, 67, 72]])
    expect(describeStaffNotes(example!.measures, 'c')).toBe('E4 + G4 + C5')
  })

  it('usa el bajo indicado con barra', () => {
    const example = buildWorkedExample(
      chord({
        inversion: 1,
        slash: pitch('E', 4),
        ask: 'notes',
      }),
    )

    expect(midis(example!)).toEqual([[64, 67, 72]])
  })

  it('resuelve un cifrado latino con bajo menor', () => {
    const example = buildWorkedExample(notation('Do7/Solm'))

    expect(example?.kind).toBe('chord')
    expect(midis(example!)).toEqual([[67, 70, 72, 76]])
    expect(describeStaffNotes(example!.measures, 'do')).toBe(
      'Sol4 + La♯4 + Do5 + Mi5',
    )
  })

  it('elige clave de fa para registros graves', () => {
    const example = buildWorkedExample(
      chord({ root: pitch('A', 3), quality: 'minor' }),
    )

    expect(example?.clef).toBe('bass')
    expect(midis(example!)).toEqual([[57, 60, 64]])
  })

  it('devuelve null cuando el cifrado no se puede interpretar', () => {
    expect(buildWorkedExample(notation('no-es-un-cifrado'))).toBeNull()
  })

  it('devuelve null para tipos sin ejemplo resuelto', () => {
    const noteKeyboard: Exercise = {
      id: 'test.note-keyboard',
      skillId: 'skill.note-names',
      type: 'note-keyboard',
      promptEs: '¿Qué nota es?',
      promptEn: 'Which note is it?',
      explanationEs: 'La tecla blanca a la izquierda de dos negras es Do.',
      explanationEn: 'The white key left of two black keys is C.',
      difficulty: 1,
      target: pitch('C', 4),
      choices: ['Do', 'Re'],
      choicesEn: ['C', 'D'],
    }

    expect(buildWorkedExample(noteKeyboard)).toBeNull()
  })
})
