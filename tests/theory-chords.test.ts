import { describe, expect, it } from 'vitest'
import {
  CHORD_QUALITIES,
  chordBass,
  chordNoteNames,
  chordPitches,
  chordSymbol,
  chordWithInversion,
  convertChordNotation,
  invertChord,
  parseChordSymbol,
  rootName,
} from '../src/theory/chords'
import { formatPitch, midiOf, parsePitch } from '../src/theory/pitch'

const spelled = (pitches: ReturnType<typeof chordPitches>) => pitches.map(formatPitch)

describe('acordes', () => {
  it('construye las tríadas básicas con ortografía correcta', () => {
    expect(spelled(chordPitches('C4', 'major'))).toEqual(['C4', 'E4', 'G4'])
    expect(spelled(chordPitches('C4', 'minor'))).toEqual(['C4', 'Eb4', 'G4'])
    expect(spelled(chordPitches('C4', 'diminished'))).toEqual(['C4', 'Eb4', 'Gb4'])
    expect(spelled(chordPitches('C4', 'augmented'))).toEqual(['C4', 'E4', 'G#4'])
    expect(spelled(chordPitches('C4', 'sus2'))).toEqual(['C4', 'D4', 'G4'])
    expect(spelled(chordPitches('C4', 'sus4'))).toEqual(['C4', 'F4', 'G4'])
  })

  it('construye las tríadas en 12 tónicas sin perder la letra del grado', () => {
    const tonics = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'F', 'Bb', 'Eb', 'Ab']
    for (const tonic of tonics) {
      for (const quality of ['major', 'minor', 'diminished', 'augmented'] as const) {
        const [root, third, fifth] = chordPitches(`${tonic}4`, quality)
        expect(root.step).toBe(parsePitch(`${tonic}4`).step)
        expect([third.step, fifth.step]).toHaveLength(2)
        expect(Math.abs(root.accidental)).toBeLessThanOrEqual(2)
        expect(Math.abs(third.accidental)).toBeLessThanOrEqual(2)
        expect(Math.abs(fifth.accidental)).toBeLessThanOrEqual(2)
      }
    }
  })

  it('construye séptimas y extensiones con las tensiones correctas', () => {
    expect(spelled(chordPitches('C4', 'major7'))).toEqual(['C4', 'E4', 'G4', 'B4'])
    expect(spelled(chordPitches('C4', 'dominant7'))).toEqual(['C4', 'E4', 'G4', 'Bb4'])
    expect(spelled(chordPitches('C4', 'minor7'))).toEqual(['C4', 'Eb4', 'G4', 'Bb4'])
    expect(spelled(chordPitches('C4', 'half-diminished7'))).toEqual(['C4', 'Eb4', 'Gb4', 'Bb4'])
    expect(spelled(chordPitches('C4', 'diminished7'))).toEqual(['C4', 'Eb4', 'Gb4', 'Bbb4'])
    expect(spelled(chordPitches('C4', 'major9'))).toEqual(['C4', 'E4', 'G4', 'B4', 'D5'])
    expect(spelled(chordPitches('C4', 'dominant13'))).toEqual([
      'C4',
      'E4',
      'G4',
      'Bb4',
      'D5',
      'F5',
      'A5',
    ])
  })

  it('invierte acordes rotando el bajo una octava', () => {
    const root = chordPitches('C4', 'major')
    expect(spelled(invertChord(root, 1))).toEqual(['E4', 'G4', 'C5'])
    expect(spelled(invertChord(root, 2))).toEqual(['G4', 'C5', 'E5'])
    expect(formatPitch(chordBass(chordWithInversion('C4', 'major', 0)))).toBe('C4')
    expect(formatPitch(chordBass(chordWithInversion('C4', 'major', 1)))).toBe('E4')
    expect(formatPitch(chordBass(chordWithInversion('C4', 'major', 2)))).toBe('G4')
    expect(() => invertChord(root, 3)).toThrow(/inversión/i)
  })

  it('mantiene ascendente el voicing de las extensiones invertidas', () => {
    expect(spelled(chordWithInversion('C4', 'major9', 1))).toEqual([
      'E4',
      'G4',
      'B4',
      'C5',
      'D5',
    ])
    expect(spelled(chordWithInversion('D4', 'minor9', 3))).toEqual([
      'C5',
      'D5',
      'E5',
      'F5',
      'A5',
    ])
    const voicing = chordWithInversion('G4', 'dominant11', 3)
    for (let index = 1; index < voicing.length; index += 1) {
      expect(midiOf(voicing[index]!)).toBeGreaterThan(midiOf(voicing[index - 1]!))
    }
  })

  it('genera cifrado bilingüe y acepta slash chords', () => {
    expect(chordSymbol('C4', 'major')).toBe('C')
    expect(chordSymbol('C4', 'minor7')).toBe('Cm7')
    expect(chordSymbol('Eb4', 'major7')).toBe('E♭maj7')
    expect(chordSymbol('C4', 'major', { notation: 'do' })).toBe('Do')
    expect(chordSymbol('C4', 'major7', { notation: 'do' })).toBe('Domaj7')
    expect(chordSymbol('C4', 'major', { slash: 'E4' })).toBe('C/E')
    expect(rootName(parsePitch('Bb4'))).toBe('B♭')
  })

  it('parsea cifrado americano y latino con calidad y bajo', () => {
    const c7 = parseChordSymbol('Do7/Mi')
    expect(c7.root.step).toBe('C')
    expect(c7.quality).toBe('dominant7')
    expect(c7.slash?.step).toBe('E')

    const f = parseChordSymbol('F#m7b5')
    expect(f.root).toEqual({ step: 'F', accidental: 1, octave: 4 })
    expect(f.quality).toBe('half-diminished7')

    expect(parseChordSymbol('Si♭maj7').root.step).toBe('B')
    expect(parseChordSymbol('Cmaj9').quality).toBe('major9')
    // «Faug» no debe leerse como la nota latina «Fa» + sufijo «ug».
    expect(parseChordSymbol('Faug').quality).toBe('augmented')
    expect(convertChordNotation('Faug', 'do')).toBe('Faaug')
    expect(convertChordNotation('Faaug', 'c')).toBe('Faug')
    // Las notas latinas de tres letras también son raíces y bajos válidos.
    expect(parseChordSymbol('Solm7').root).toEqual({
      step: 'G',
      accidental: 0,
      octave: 4,
    })
    expect(parseChordSymbol('Solm7').quality).toBe('minor7')
    expect(parseChordSymbol('Domaj7/Sol').slash).toEqual({
      step: 'G',
      accidental: 0,
      octave: 4,
    })
    expect(() => parseChordSymbol('H7')).toThrow(/inválido/i)
    expect(() => parseChordSymbol('Cxyz')).toThrow(/calidad/i)
  })

  it('ofrece nombres de notas del acorde en ambas notaciones', () => {
    expect(chordNoteNames('C4', 'major')).toEqual(['C', 'E', 'G'])
    expect(chordNoteNames('C4', 'minor7', 'do')).toEqual(['Do', 'Mi♭', 'Sol', 'Si♭'])
  })

  it('cubre todas las calidades declaradas', () => {
    for (const quality of CHORD_QUALITIES) {
      const pitches = chordPitches('C4', quality)
      expect(pitches.length).toBeGreaterThanOrEqual(3)
      for (const pitch of pitches) {
        expect(midiOf(pitch)).toBeGreaterThanOrEqual(0)
        expect(midiOf(pitch)).toBeLessThanOrEqual(127)
      }
    }
  })
})
