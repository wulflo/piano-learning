import { describe, expect, it } from 'vitest'
import {
  intervalBetween,
  intervalFromSemitones,
  intervalSemitones,
  invertInterval,
  transposeInterval,
  type IntervalQuality,
} from '../src/theory/intervals'
import { formatPitch, parsePitch } from '../src/theory/pitch'

describe('intervalos', () => {
  it('mide cantidad y calidad', () => {
    const cases: Array<[string, string, number, string, IntervalQuality, number]> = [
      ['C4', 'C4', 1, 'P1', 'perfect', 0],
      ['C4', 'D4', 2, 'M2', 'major', 2],
      ['C4', 'Eb4', 3, 'm3', 'minor', 3],
      ['C4', 'E4', 3, 'M3', 'major', 4],
      ['C4', 'F4', 4, 'P4', 'perfect', 5],
      ['C4', 'F#4', 4, 'A4', 'augmented', 6],
      ['C4', 'Gb4', 5, 'd5', 'diminished', 6],
      ['C4', 'G4', 5, 'P5', 'perfect', 7],
      ['C4', 'A4', 6, 'M6', 'major', 9],
      ['C4', 'Bb4', 7, 'm7', 'minor', 10],
      ['C4', 'B4', 7, 'M7', 'major', 11],
      ['C4', 'C5', 8, 'P8', 'perfect', 12],
      ['C4', 'D5', 9, 'M9', 'major', 14],
      ['C4', 'E5', 10, 'M10', 'major', 16],
    ]

    for (const [lower, upper, number, symbol, quality, semitones] of cases) {
      const interval = intervalBetween(parsePitch(lower), parsePitch(upper))
      expect(interval.number).toBe(number)
      expect(interval.symbol).toBe(symbol)
      expect(interval.quality).toBe(quality)
      expect(interval.semitones).toBe(semitones)
    }
  })

  it('nombra el unísono con concordancia masculina', () => {
    const unison = intervalBetween(parsePitch('C4'), parsePitch('C4'))
    expect(unison.nameEs).toBe('unísono justo')
    expect(unison.nameEn).toBe('perfect unison')
  })

  it('la inversión suma 9 y cambia la calidad', () => {
    const inversions: Array<[string, string, number, string]> = [
      ['C4', 'C4', 8, 'P8'],
      ['C4', 'D4', 7, 'm7'],
      ['C4', 'E4', 6, 'm6'],
      ['C4', 'F4', 5, 'P5'],
      ['C4', 'F#4', 5, 'd5'],
      ['C4', 'G4', 4, 'P4'],
      ['C4', 'A4', 3, 'm3'],
      ['C4', 'B4', 2, 'm2'],
    ]
    for (const [lower, upper, number, symbol] of inversions) {
      const inverted = invertInterval(intervalBetween(parsePitch(lower), parsePitch(upper)))
      expect(inverted.number).toBe(number)
      expect(inverted.symbol).toBe(symbol)
    }
  })

  it('calcula semitonos al construir intervalos', () => {
    expect(intervalSemitones(5, 'perfect')).toBe(7)
    expect(intervalSemitones(3, 'minor')).toBe(3)
    expect(intervalSemitones(4, 'augmented')).toBe(6)
    expect(intervalSemitones(5, 'diminished')).toBe(6)
    expect(intervalSemitones(7, 'minor')).toBe(10)
    expect(intervalSemitones(9, 'major')).toBe(14)
    expect(() => intervalSemitones(5, 'minor')).toThrow()
  })

  it('construye la nota superior con la ortografía correcta', () => {
    expect(formatPitch(transposeInterval(parsePitch('C4'), 3, 'major'))).toBe('E4')
    expect(formatPitch(transposeInterval(parsePitch('C4'), 5, 'perfect'))).toBe('G4')
    expect(formatPitch(transposeInterval(parsePitch('B4'), 2, 'minor'))).toBe('C5')
    expect(formatPitch(transposeInterval(parsePitch('F4'), 4, 'augmented'))).toBe('B4')
    expect(formatPitch(transposeInterval(parsePitch('C4'), 9, 'major'))).toBe('D5')
  })

  it('reconoce intervalos desde semitonos', () => {
    expect(intervalFromSemitones(7).symbol).toBe('P5')
    expect(intervalFromSemitones(6).symbol).toBe('A4')
    expect(intervalFromSemitones(14).symbol).toBe('M9')
    expect(intervalFromSemitones(12).symbol).toBe('P8')
    expect(intervalFromSemitones(0).symbol).toBe('P1')
  })

  it('detecta intervalos descendentes sin perder la identidad', () => {
    const descending = intervalBetween(parsePitch('G4'), parsePitch('C4'))
    expect(descending.descending).toBe(true)
    expect(descending.semitones).toBe(7)
    expect(descending.number).toBe(5)
    expect(descending.symbol).toBe('P5')
  })
})
