import { describe, expect, it } from 'vitest'
import {
  chordDegreeInKey,
  diatonicChord,
  diatonicChords,
  harmonicFunctionName,
  isDiatonicChord,
  parseRomanNumeral,
  romanChordSymbol,
  romanNumeralFor,
  romanToChord,
} from '../src/theory/roman'
import { formatPitch, midiOf } from '../src/theory/pitch'

const spelled = (pitches: ReturnType<typeof romanToChord>['pitches']) =>
  pitches.map(formatPitch)

describe('números romanos y funciones', () => {
  it('cifra los grados diatónicos de Do mayor', () => {
    const chords = diatonicChords('C4', 'major')
    expect(chords.map((chord) => chord.roman)).toEqual([
      'I',
      'ii',
      'iii',
      'IV',
      'V',
      'vi',
      'vii°',
    ])
    expect(chords.map((chord) => chord.symbol)).toEqual([
      'C',
      'Dm',
      'Em',
      'F',
      'G',
      'Am',
      'Bdim',
    ])
  })

  it('cifra los grados de La menor natural y armónica', () => {
    expect(diatonicChords('A4', 'natural-minor').map((chord) => chord.roman)).toEqual([
      'i',
      'ii°',
      'III',
      'iv',
      'v',
      'VI',
      'VII',
    ])
    expect(diatonicChords('A4', 'harmonic-minor').map((chord) => chord.roman)).toEqual([
      'i',
      'ii°',
      'III+',
      'iv',
      'V',
      'VI',
      'vii°',
    ])
  })

  it('asigna funciones T/S/D', () => {
    expect(harmonicFunctionName('tonic')).toContain('Tónica')
    expect(diatonicChord('C4', 'major', 1).func).toBe('tonic')
    expect(diatonicChord('C4', 'major', 4).func).toBe('subdominant')
    expect(diatonicChord('C4', 'major', 5).func).toBe('dominant')
  })

  it('parsea números romanos con alteraciones, séptimas y cualidades', () => {
    expect(parseRomanNumeral('V')).toMatchObject({ degree: 5, quality: 'major' })
    expect(parseRomanNumeral('ii')).toMatchObject({ degree: 2, quality: 'minor' })
    expect(parseRomanNumeral('viio')).toMatchObject({ degree: 7, quality: 'diminished' })
    expect(parseRomanNumeral('vii°7')).toMatchObject({
      degree: 7,
      quality: 'diminished7',
      seventh: true,
    })
    expect(parseRomanNumeral('bVII7')).toMatchObject({
      degree: 7,
      accidental: -1,
      quality: 'dominant7',
    })
    expect(parseRomanNumeral('III+')).toMatchObject({ degree: 3, quality: 'augmented' })
    expect(() => parseRomanNumeral('VIII')).toThrow()
    expect(() => parseRomanNumeral('foo')).toThrow()
  })

  it('convierte un número romano en acorde real', () => {
    expect(spelled(romanToChord('C4', 'major', 'V7').pitches)).toEqual([
      'G4',
      'B4',
      'D5',
      'F5',
    ])
    expect(spelled(romanToChord('C4', 'major', 'bVII').pitches)).toEqual([
      'Bb4',
      'D5',
      'F5',
    ])
    expect(romanChordSymbol('V', 'C4', 'major')).toBe('G')
  })

  it('reconoce acordes diatónicos y su grado', () => {
    expect(isDiatonicChord('C4', 'major', 'G4', 'major')).toBe(true)
    expect(isDiatonicChord('C4', 'major', 'G4', 'minor')).toBe(false)
    expect(chordDegreeInKey('C4', 'major', 'G4')).toBe(5)
    expect(chordDegreeInKey('C4', 'major', 'F#4')).toBeNull()
  })

  it('cifra correctamente en las 12 tonalidades', () => {
    const tonics = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'F', 'Bb', 'Eb', 'Ab']
    for (const tonic of tonics) {
      const chords = diatonicChords(`${tonic}4`, 'major')
      expect(chords).toHaveLength(7)
      expect(chords.map((chord) => chord.roman)).toEqual([
        'I',
        'ii',
        'iii',
        'IV',
        'V',
        'vi',
        'vii°',
      ])
      const scaleMidis = new Set(chords.flatMap((chord) => chord.pitches.map(midiOf)))
      expect(scaleMidis.size).toBeGreaterThanOrEqual(7)
    }
  })

  it('mantiene el cifrado coherente con la calidad', () => {
    expect(romanNumeralFor(1, 'minor')).toBe('i')
    expect(romanNumeralFor(7, 'diminished')).toBe('vii°')
    expect(romanNumeralFor(3, 'augmented')).toBe('III+')
  })
})
