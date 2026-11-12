import { describe, expect, it } from 'vitest'
import { chordPitches, type ChordQuality } from '../src/theory/chords'
import { intervalBetween, invertInterval } from '../src/theory/intervals'
import {
  allMajorKeySignatures,
  keySignature,
  relativeMinorOf,
} from '../src/theory/keys'
import { formatPitch, midiOf, mod12, parsePitch, pitchClass } from '../src/theory/pitch'
import { parseRomanNumeral } from '../src/theory/roman'
import {
  DIATONIC_MODES,
  relativeModePitches,
  scaleNames,
  scaleNotes,
  scalePitches,
} from '../src/theory/scales'

const TWELVE_TONICS = [
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
]

describe('propiedades de teoría en 12 tonalidades', () => {
  it('cada escala mayor usa las siete letras una sola vez', () => {
    for (const tonic of TWELVE_TONICS) {
      const notes = scaleNotes(`${tonic}4`, 'major')
      expect(notes).toHaveLength(7)
      expect(notes[0].pitch).toMatchObject(parsePitch(`${tonic}4`))
      expect(new Set(notes.map((note) => note.pitch.step)).size).toBe(7)
      for (const note of notes) {
        expect(Math.abs(note.pitch.accidental)).toBeLessThanOrEqual(2)
      }
    }
  })

  it('las 15 armaduras tienen conteo, orden y relativa coherentes', () => {
    for (const signature of allMajorKeySignatures()) {
      expect(signature.count).toBe(keySignature(signature.tonic).count)
      expect(signature.relativeTonic).toBe(relativeMinorOf(signature.tonic))
      const steps = signature.accidentals.map((item) => item.step)
      if (signature.count >= 0) {
        expect(steps).toEqual(['F', 'C', 'G', 'D', 'A', 'E', 'B'].slice(0, signature.count))
      } else {
        expect(steps).toEqual(
          ['B', 'E', 'A', 'D', 'G', 'C', 'F'].slice(0, -signature.count),
        )
      }
    }
  })

  it('las escalas suben exactamente por semitonos consecutivos', () => {
    for (const tonic of TWELVE_TONICS) {
      const pitches = scalePitches(`${tonic}4`, 'major')
      const intervals = pitches.map((pitch, index) => {
        if (index === 0) return 0
        return mod12(midiOf(pitch) - midiOf(pitches[index - 1]))
      })
      expect(intervals).toEqual([0, 2, 2, 1, 2, 2, 2])
    }
  })

  it('cada modo relativo comparte las clases de altura de su mayor', () => {
    for (const tonic of TWELVE_TONICS) {
      const major = new Set(scalePitches(`${tonic}4`, 'major').map(pitchClass))
      for (const { mode } of DIATONIC_MODES) {
        const pitches = relativeModePitches(`${tonic}4`, mode)
        for (const pitch of pitches) {
          expect(major.has(pitchClass(pitch))).toBe(true)
        }
      }
    }
  })

  it('las inversiones de intervalos suman 9 y 12 semitonos', () => {
    for (const tonic of TWELVE_TONICS) {
      const root = parsePitch(`${tonic}4`)
      const notes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'].map(parsePitch)
      for (const note of notes) {
        const interval = intervalBetween(root, note)
        const inverted = invertInterval(interval)
        if (interval.number < 8) {
          expect(inverted.number).toBe(9 - interval.number)
          expect(inverted.semitones).toBe(12 - interval.semitones)
        }
      }
    }
  })

  it('los grados diatónicos producen acordes dentro de la escala', () => {
    for (const tonic of TWELVE_TONICS) {
      const scale = new Set(scalePitches(`${tonic}4`, 'major').map(pitchClass))
      const qualities: ChordQuality[] = [
        'major',
        'minor',
        'minor',
        'major',
        'major',
        'minor',
        'diminished',
      ]
      const degrees = scalePitches(`${tonic}4`, 'major')
      for (let degree = 0; degree < 7; degree += 1) {
        const chord = chordPitches(degrees[degree], qualities[degree])
        for (const pitch of chord) {
          expect(scale.has(pitchClass(pitch))).toBe(true)
        }
      }
    }
  })

  it('los números romanos ida y vuelta conservan grado y calidad', () => {
    for (const numeral of [
      'I',
      'ii',
      'iii',
      'IV',
      'V',
      'vi',
      'vii°',
      'V7',
      'bVII',
      'III+',
    ]) {
      const parsed = parseRomanNumeral(numeral)
      expect(parsed.degree).toBeGreaterThanOrEqual(1)
      expect(parsed.degree).toBeLessThanOrEqual(7)
    }
  })

  it('ninguna ortografía común supera la doble alteración', () => {
    for (const tonic of TWELVE_TONICS) {
      for (const name of scaleNames(tonic, 'major')) {
        expect(name).not.toContain('##')
        expect(name).not.toContain('bb')
      }
      for (const pitch of scalePitches(`${tonic}4`, 'major')) {
        expect(Math.abs(pitch.accidental)).toBeLessThanOrEqual(2)
        expect(formatPitch(pitch)).toBe(
          `${pitch.step}${'#'.repeat(Math.max(0, pitch.accidental))}${'b'.repeat(
            Math.max(0, -pitch.accidental),
          )}${pitch.octave}`,
        )
      }
    }
  })
})
