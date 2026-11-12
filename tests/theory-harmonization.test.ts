import { describe, expect, it } from 'vitest'
import type { ChordQuality } from '../src/theory/chords'
import {
  diatonicChord,
  diatonicChords,
  functionsForMode,
  qualitiesForMode,
  romanNumeralFor,
  type DiatonicMode,
} from '../src/theory/roman'
import { scaleNotes } from '../src/theory/scales'
import { midiOf, type Pitch } from '../src/theory/pitch'

/**
 * Armonización diatónica exhaustiva.
 *
 * Recorre las doce tónicas en los tres modos que usa la app (mayor, menor
 * natural y menor armónica) y comprueba que cada grado tenga la cualidad, la
 * grafía, el número romano y la función que le corresponden. Así la promesa de
 * «grados con cualidades correctas en mayor y menor» queda cubierta más allá
 * de Do y La.
 */

const TONICS = [
  'C',
  'G',
  'D',
  'A',
  'E',
  'B',
  'F#',
  'C#',
  'F',
  'Bb',
  'Eb',
  'Ab',
] as const

const MODES: DiatonicMode[] = ['major', 'natural-minor', 'harmonic-minor']

const EXPECTED_QUALITIES: Record<DiatonicMode, ChordQuality[]> = {
  major: ['major', 'minor', 'minor', 'major', 'major', 'minor', 'diminished'],
  'natural-minor': [
    'minor',
    'diminished',
    'major',
    'minor',
    'minor',
    'major',
    'major',
  ],
  'harmonic-minor': [
    'minor',
    'diminished',
    'augmented',
    'minor',
    'major',
    'major',
    'diminished',
  ],
}

const EXPECTED_ROMANS: Record<DiatonicMode, string[]> = {
  major: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'],
  'natural-minor': ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'],
  'harmonic-minor': ['i', 'ii°', 'III+', 'iv', 'V', 'VI', 'vii°'],
}

/** Nombre y alteración sin octava: la enarmonía sí importa. */
function spelling(pitch: Pitch): string {
  return `${pitch.step}${pitch.accidental}`
}

describe('F4-016 — armonización diatónica en 12 tonalidades', () => {
  it('declara siete cualidades por modo y las usa en todos los grados', () => {
    for (const mode of MODES) {
      expect(qualitiesForMode(mode), mode).toHaveLength(7)
      expect(qualitiesForMode(mode), mode).toEqual(EXPECTED_QUALITIES[mode])
      expect(functionsForMode(mode), mode).toHaveLength(7)
    }
    expect(functionsForMode('major')).toEqual([
      'tonic',
      'subdominant',
      'tonic',
      'subdominant',
      'dominant',
      'tonic',
      'dominant',
    ])
    expect(functionsForMode('natural-minor')).toEqual([
      'tonic',
      'subdominant',
      'tonic',
      'subdominant',
      'dominant',
      'subdominant',
      'dominant',
    ])
  })

  it('arma los siete grados con la cualidad correcta en 12 tónicas y 3 modos', () => {
    for (const mode of MODES) {
      for (const tonic of TONICS) {
        const chords = diatonicChords(`${tonic}4`, mode)
        expect(chords, `${tonic} ${mode}`).toHaveLength(7)

        for (const [index, chord] of chords.entries()) {
          const degree = index + 1
          const label = `${tonic} ${mode} grado ${degree}`
          expect(chord.degree, label).toBe(degree)
          expect(chord.quality, label).toBe(EXPECTED_QUALITIES[mode][index])
          expect(chord.roman, label).toBe(EXPECTED_ROMANS[mode][index])
          expect(chord.roman, label).toBe(
            romanNumeralFor(degree, EXPECTED_QUALITIES[mode][index]),
          )
          expect(chord.func, label).toBe(functionsForMode(mode)[index])
          expect(chord.symbol, label).toMatch(/^[A-G](?:#|b)?/)
        }
      }
    }
  })

  it('toma la raíz y las notas del grado directamente de la escala', () => {
    for (const mode of MODES) {
      for (const tonic of TONICS) {
        const scale = scaleNotes(`${tonic}4`, mode)
        const chords = diatonicChords(`${tonic}4`, mode)

        for (const [index, chord] of chords.entries()) {
          const label = `${tonic} ${mode} grado ${index + 1}`
          const root = scale[index].pitch
          expect(spelling(chord.root), label).toBe(spelling(root))
          expect(midiOf(chord.root) % 12, label).toBe(midiOf(root) % 12)

          const expected = [0, 2, 4].map(
            (offset) => scale[(index + offset) % 7].pitch,
          )
          expect(chord.pitches.map(spelling), label).toEqual(
            expected.map(spelling),
          )
          expect(
            chord.pitches.map((pitch) => midiOf(pitch) % 12),
            label,
          ).toEqual(expected.map((pitch) => midiOf(pitch) % 12))
        }
      }
    }
  })

  it('distingue las cualidades propias de cada modo', () => {
    for (const tonic of TONICS) {
      const major = diatonicChords(`${tonic}4`, 'major')
      expect(major[0].quality, `${tonic} mayor I`).toBe('major')
      expect(major[1].quality, `${tonic} mayor ii`).toBe('minor')
      expect(major[4].quality, `${tonic} mayor V`).toBe('major')
      expect(major[6].quality, `${tonic} mayor vii`).toBe('diminished')

      const natural = diatonicChords(`${tonic}4`, 'natural-minor')
      expect(natural[0].quality, `${tonic} menor natural i`).toBe('minor')
      expect(natural[4].quality, `${tonic} menor natural v`).toBe('minor')
      expect(natural[6].quality, `${tonic} menor natural VII`).toBe('major')

      const harmonic = diatonicChords(`${tonic}4`, 'harmonic-minor')
      expect(harmonic[0].quality, `${tonic} menor armónica i`).toBe('minor')
      expect(harmonic[2].quality, `${tonic} menor armónica III`).toBe('augmented')
      expect(harmonic[4].quality, `${tonic} menor armónica V`).toBe('major')
      expect(harmonic[6].quality, `${tonic} menor armónica vii`).toBe(
        'diminished',
      )
    }
  })

  it('devuelve el mismo acorde al pedir un grado concreto', () => {
    for (const mode of MODES) {
      for (const tonic of TONICS) {
        const chords = diatonicChords(`${tonic}4`, mode)
        for (let degree = 1; degree <= 7; degree += 1) {
          expect(
            diatonicChord(`${tonic}4`, mode, degree),
            `${tonic} ${mode} grado ${degree}`,
          ).toEqual(chords[degree - 1])
        }
      }
    }
  })

  it('rechaza grados fuera de la escala', () => {
    for (const mode of MODES) {
      expect(() => diatonicChord('C4', mode, 0)).toThrow()
      expect(() => diatonicChord('C4', mode, 8)).toThrow()
    }
  })
})
