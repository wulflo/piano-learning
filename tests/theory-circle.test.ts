import { describe, expect, it } from 'vitest'
import {
  CIRCLE_OF_FIFTHS,
  circleIndex,
  circleNeighbors,
  circlePositions,
  parallelKey,
  relativeKey,
  signatureAccidentals,
  transposeChordToKey,
  transposeMelody,
  transposeNoteToKey,
} from '../src/theory/circle'
import { formatPitch, midiOf, parsePitch } from '../src/theory/pitch'

const spelled = (pitches: ReturnType<typeof transposeMelody>) => pitches.map(formatPitch)

describe('círculo de quintas y transposición', () => {
  it('recorre las 15 armaduras de 7 bemoles a 7 sostenidos', () => {
    expect(CIRCLE_OF_FIFTHS).toHaveLength(15)
    expect(CIRCLE_OF_FIFTHS[0]).toBe('Cb')
    expect(CIRCLE_OF_FIFTHS[7]).toBe('C')
    expect(CIRCLE_OF_FIFTHS[14]).toBe('C#')
    expect(circlePositions().map((position) => position.count)).toEqual([
      -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7,
    ])
    expect(circlePositions()[7]).toMatchObject({ major: 'C', minor: 'A', count: 0 })
  })

  it('calcula vecinos y protege el rango', () => {
    expect(circleNeighbors('C')).toEqual({ previous: 'F', next: 'G' })
    expect(circleNeighbors('Cb')).toEqual({ previous: 'C#', next: 'Gb' })
    expect(circleIndex('Eb')).toBe(4)
    expect(() => circleIndex('H')).toThrow()
  })

  it('relaciona relativas y homónimas', () => {
    expect(relativeKey('C', 'major')).toEqual({ tonic: 'A', mode: 'minor' })
    expect(relativeKey('A', 'minor')).toEqual({ tonic: 'C', mode: 'major' })
    expect(parallelKey('C', 'major')).toEqual({ tonic: 'C', mode: 'minor' })
    expect(parallelKey('A', 'minor')).toEqual({ tonic: 'A', mode: 'major' })
  })

  it('lista alteraciones con signo', () => {
    expect(signatureAccidentals('D')).toEqual(['F♯', 'C♯'])
    expect(signatureAccidentals('Eb')).toEqual(['B♭', 'E♭', 'A♭'])
    expect(signatureAccidentals('C')).toEqual([])
  })

  it('transpone notas deletreando en la tonalidad destino', () => {
    expect(formatPitch(transposeNoteToKey(parsePitch('C4'), 2, 'D'))).toBe('D4')
    expect(formatPitch(transposeNoteToKey(parsePitch('E4'), 1, 'F'))).toBe('F4')
    expect(formatPitch(transposeNoteToKey(parsePitch('B4'), 2, 'C#'))).toBe('C#5')
    expect(formatPitch(transposeNoteToKey(parsePitch('Eb4'), 2, 'F'))).toBe('F4')
  })

  it('transporta melodías conservando grados y octavas', () => {
    const melody = ['C4', 'D4', 'E4', 'G4'].map(parsePitch)
    expect(spelled(transposeMelody(melody, 'C', 'D'))).toEqual(['D4', 'E4', 'F#4', 'A4'])
    expect(spelled(transposeMelody(melody, 'C', 'F'))).toEqual(['F4', 'G4', 'A4', 'C5'])
    const back = transposeMelody(transposeMelody(melody, 'C', 'G'), 'G', 'C')
    expect(back.map(midiOf)).toEqual(melody.map(midiOf))
  })

  it('transporta acordes completos', () => {
    expect(
      transposeChordToKey('C4', 'major', 2, 'D', 'major').map(formatPitch),
    ).toEqual(['D4', 'F#4', 'A4'])
    expect(
      transposeChordToKey('A4', 'minor', 3, 'C', 'major').map(formatPitch),
    ).toEqual(['C5', 'Eb5', 'G5'])
  })
})
