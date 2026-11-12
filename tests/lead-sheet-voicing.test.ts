import { describe, expect, it } from 'vitest'
import {
  leadSheetMelodyNoteName,
  leadSheetMelodyPitch,
  shellVoicing,
  shellVoicingLabel,
} from '../src/exercises/accompaniment'
import type { Score } from '../src/schemas'

function noteScore(): Score {
  return {
    clef: 'treble',
    key: 'C',
    mode: 'major',
    timeSignature: { numerator: 4, denominator: 4 },
    tempoBpm: 60,
    pedals: [],
    events: [
      {
        id: 'n.1',
        measure: 1,
        beat: 0,
        value: { duration: 'quarter', dots: 0, tuplet: 'none' },
        pitches: [{ step: 'C', accidental: '', octave: 5 }],
        hand: 'right',
        voice: 1,
        velocity: 72,
        tieToNext: false,
        chordSymbol: 'C',
      },
      {
        id: 'n.2',
        measure: 1,
        beat: 1,
        value: { duration: 'quarter', dots: 0, tuplet: 'none' },
        pitches: [{ step: 'E', accidental: '', octave: 5 }],
        hand: 'right',
        voice: 1,
        velocity: 72,
        tieToNext: false,
      },
      {
        id: 'n.3',
        measure: 1,
        beat: 1,
        value: { duration: 'quarter', dots: 0, tuplet: 'none' },
        pitches: [{ step: 'C', accidental: '', octave: 3 }],
        hand: 'left',
        voice: 1,
        velocity: 72,
        tieToNext: false,
      },
    ],
  }
}

describe('Lead sheet y voicings de shell', () => {
  it('lee la nota de melodía de la mano derecha en compás y pulso', () => {
    const score = noteScore()
    const pitch = leadSheetMelodyPitch(score, 1, 1)
    expect(pitch).toMatchObject({ step: 'E', accidental: 0, octave: 5 })
    expect(leadSheetMelodyNoteName(score, 1, 1, 'es')).toBe('Mi5')
    expect(leadSheetMelodyNoteName(score, 1, 1, 'en')).toBe('E5')
    expect(leadSheetMelodyNoteName(score, 2, 0, 'es')).toBeNull()
  })

  it('construye el shell de una tríada con fundamental, tercera y quinta', () => {
    const voicing = shellVoicing('C')
    expect(voicing.root).toMatchObject({ step: 'C', octave: 3 })
    expect(voicing.guides.map((pitch) => `${pitch.step}${pitch.octave}`)).toEqual([
      'E4',
      'G4',
    ])
    expect(shellVoicingLabel('C', 'es')).toBe('Do3 + Mi4 + Sol4')
    expect(shellVoicingLabel('C', 'en')).toBe('C3 + E4 + G4')
  })

  it('usa tercera y séptima como guías en los acordes con séptima', () => {
    expect(shellVoicingLabel('Cmaj7', 'es')).toBe('Do3 + Mi4 + Si4')
    expect(shellVoicingLabel('Am7', 'es')).toBe('La3 + Do4 + Sol4')
    expect(shellVoicingLabel('Dm7', 'es')).toBe('Re3 + Do4 + Fa4')
    expect(shellVoicingLabel('G7', 'es')).toBe('Sol3 + Fa4 + Si4')
    expect(shellVoicingLabel('D7', 'en')).toBe('D3 + C4 + F#4')
    expect(shellVoicingLabel('Bb7', 'en')).toBe('Bb3 + D4 + Ab4')
  })

  it('ordena las notas de grave a agudo y respeta la ortografía', () => {
    for (const symbol of ['C', 'F', 'G', 'D', 'A', 'Eb', 'Ab', 'Db']) {
      const voicing = shellVoicing(symbol)
      const midis = voicing.pitches.map(
        (pitch) =>
          pitch.octave * 12 +
          { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[pitch.step] +
          pitch.accidental,
      )
      expect(midis, symbol).toEqual([...midis].sort((a, b) => a - b))
    }
    expect(shellVoicingLabel('A7', 'es')).toBe('La3 + Do♯4 + Sol4')
    expect(shellVoicingLabel('Eb', 'en')).toBe('Eb3 + G4 + Bb4')
  })
})
