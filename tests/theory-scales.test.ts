import { describe, expect, it } from 'vitest'
import {
  allMajorKeySignatures,
  allMinorKeySignatures,
  detectKeysFromNotes,
  keyForSignature,
  keySignature,
  relativeMajorOf,
  relativeMinorOf,
  signatureCount,
  spellPitchClassInKey,
} from '../src/theory/keys'
import {
  DIATONIC_MODES,
  relativeModePitches,
  scaleDegree,
  scaleNames,
  scaleNotes,
  scalePitchClasses,
} from '../src/theory/scales'
import { parsePitch, formatPitch, pitchClass } from '../src/theory/pitch'

const MAJOR_SCALES: Record<string, string[]> = {
  C: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
  G: ['G', 'A', 'B', 'C', 'D', 'E', 'F#'],
  D: ['D', 'E', 'F#', 'G', 'A', 'B', 'C#'],
  A: ['A', 'B', 'C#', 'D', 'E', 'F#', 'G#'],
  E: ['E', 'F#', 'G#', 'A', 'B', 'C#', 'D#'],
  B: ['B', 'C#', 'D#', 'E', 'F#', 'G#', 'A#'],
  'F#': ['F#', 'G#', 'A#', 'B', 'C#', 'D#', 'E#'],
  'C#': ['C#', 'D#', 'E#', 'F#', 'G#', 'A#', 'B#'],
  F: ['F', 'G', 'A', 'Bb', 'C', 'D', 'E'],
  Bb: ['Bb', 'C', 'D', 'Eb', 'F', 'G', 'A'],
  Eb: ['Eb', 'F', 'G', 'Ab', 'Bb', 'C', 'D'],
  Ab: ['Ab', 'Bb', 'C', 'Db', 'Eb', 'F', 'G'],
  Db: ['Db', 'Eb', 'F', 'Gb', 'Ab', 'Bb', 'C'],
  Gb: ['Gb', 'Ab', 'Bb', 'Cb', 'Db', 'Eb', 'F'],
  Cb: ['Cb', 'Db', 'Eb', 'Fb', 'Gb', 'Ab', 'Bb'],
}

const MINOR_SCALES: Record<string, string[]> = {
  A: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
  E: ['E', 'F#', 'G', 'A', 'B', 'C', 'D'],
  D: ['D', 'E', 'F', 'G', 'A', 'Bb', 'C'],
  G: ['G', 'A', 'Bb', 'C', 'D', 'Eb', 'F'],
  C: ['C', 'D', 'Eb', 'F', 'G', 'Ab', 'Bb'],
  F: ['F', 'G', 'Ab', 'Bb', 'C', 'Db', 'Eb'],
  Bb: ['Bb', 'C', 'Db', 'Eb', 'F', 'Gb', 'Ab'],
  Eb: ['Eb', 'F', 'Gb', 'Ab', 'Bb', 'Cb', 'Db'],
  'C#': ['C#', 'D#', 'E', 'F#', 'G#', 'A', 'B'],
  'F#': ['F#', 'G#', 'A', 'B', 'C#', 'D', 'E'],
  'G#': ['G#', 'A#', 'B', 'C#', 'D#', 'E', 'F#'],
  'D#': ['D#', 'E#', 'F#', 'G#', 'A#', 'B', 'C#'],
  'A#': ['A#', 'B#', 'C#', 'D#', 'E#', 'F#', 'G#'],
}

describe('armaduras y detección de tonalidad', () => {
  it('las 15 armaduras mayores tienen el conteo correcto', () => {
    const signatures = allMajorKeySignatures()
    expect(signatures).toHaveLength(15)
    expect(signatures.find((item) => item.tonic === 'C')?.count).toBe(0)
    expect(signatures.find((item) => item.tonic === 'C#')?.count).toBe(7)
    expect(signatures.find((item) => item.tonic === 'Cb')?.count).toBe(-7)
  })

  it('ordena sostenidos y bemoles correctamente', () => {
    expect(keySignature('D').accidentals.map((item) => item.step)).toEqual(['F', 'C'])
    expect(keySignature('Eb').accidentals.map((item) => item.step)).toEqual(['B', 'E', 'A'])
    expect(keySignature('C#').accidentals.map((item) => item.step)).toEqual([
      'F',
      'C',
      'G',
      'D',
      'A',
      'E',
      'B',
    ])
  })

  it('relaciona cada armadura con su relativa menor', () => {
    expect(relativeMinorOf('C')).toBe('A')
    expect(relativeMinorOf('G')).toBe('E')
    expect(relativeMinorOf('A')).toBe('F#')
    expect(relativeMinorOf('E')).toBe('C#')
    expect(relativeMinorOf('B')).toBe('G#')
    expect(relativeMinorOf('F#')).toBe('D#')
    expect(relativeMinorOf('Db')).toBe('Bb')
    expect(relativeMinorOf('Cb')).toBe('Ab')
    expect(relativeMajorOf('A')).toBe('C')
    expect(relativeMajorOf('C#')).toBe('E')
    expect(relativeMajorOf('D#')).toBe('F#')
    expect(relativeMajorOf('A#')).toBe('C#')
  })

  it('las 15 armaduras menores coinciden con sus relativas', () => {
    const minors = allMinorKeySignatures()
    expect(minors).toHaveLength(15)
    for (const signature of minors) {
      expect(signature.count).toBe(signatureCount(signature.tonic, 'minor'))
      expect(signature.relativeTonic).toBe(relativeMajorOf(signature.tonic))
      expect(keyForSignature(signature.count, 'minor')).toBe(signature.tonic)
    }
  })

  it('detecta tonalidades compatibles', () => {
    const notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'].map((name) => parsePitch(`${name}4`))
    const results = detectKeysFromNotes(notes)
    expect(results[0]?.tonic).toBe('C')
    expect(results[0]?.mode).toBe('major')
  })

  it('deletrea cromatismos según la armadura', () => {
    expect(spellPitchClassInKey(1, 'C', 'major')).toEqual({ step: 'C', accidental: 1 })
    expect(spellPitchClassInKey(1, 'Bb', 'major')).toEqual({ step: 'D', accidental: -1 })
  })
})

describe('escalas', () => {
  it('construye las 15 mayores con ortografía correcta', () => {
    for (const [tonic, expected] of Object.entries(MAJOR_SCALES)) {
      expect(scaleNames(tonic, 'major')).toEqual(expected)
    }
  })

  it('construye las 13 menores naturales con ortografía correcta', () => {
    for (const [tonic, expected] of Object.entries(MINOR_SCALES)) {
      expect(scaleNames(tonic, 'natural-minor')).toEqual(expected)
    }
  })

  it('construye menores armónicas seleccionadas', () => {
    expect(scaleNames('A', 'harmonic-minor')).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G#'])
    expect(scaleNames('C', 'harmonic-minor')).toEqual(['C', 'D', 'Eb', 'F', 'G', 'Ab', 'B'])
    expect(scaleNames('E', 'harmonic-minor')).toEqual(['E', 'F#', 'G', 'A', 'B', 'C', 'D#'])
  })

  it('la menor melódica sube distinto de como baja', () => {
    expect(scaleNames('A', 'melodic-minor')).toEqual(['A', 'B', 'C', 'D', 'E', 'F#', 'G#'])
    expect(scaleNames('A', 'melodic-minor', { direction: 'descending' })).toEqual([
      'A',
      'B',
      'C',
      'D',
      'E',
      'F',
      'G',
    ])
  })

  it('los siete modos comparten las notas de su mayor relativa', () => {
    const cMajor = new Set(scalePitchClasses('C', 'major'))
    for (const { mode } of DIATONIC_MODES) {
      const relative = relativeModePitches('C', mode)
      expect(relative).toHaveLength(7)
      for (const pitch of relative) {
        expect(cMajor.has(pitchClass(pitch))).toBe(true)
      }
    }
  })

  it('construye pentatónicas, blues, cromática y tonos enteros', () => {
    expect(scaleNames('C', 'major-pentatonic')).toEqual(['C', 'D', 'E', 'G', 'A'])
    expect(scaleNames('C', 'minor-pentatonic')).toEqual(['C', 'Eb', 'F', 'G', 'Bb'])
    expect(scaleNames('C', 'blues')).toEqual(['C', 'Eb', 'F', 'Gb', 'G', 'Bb'])
    expect(scaleNames('C', 'chromatic')).toHaveLength(12)
    expect(new Set(scaleNames('C', 'chromatic')).size).toBe(12)
    expect(scaleNames('C', 'whole-tone')).toEqual(['C', 'D', 'E', 'F#', 'G#', 'A#'])
  })

  it('mantiene grados estables y tónicas', () => {
    for (const tonic of Object.keys(MAJOR_SCALES)) {
      expect(formatPitch(scaleDegree(tonic, 'major', 1))).toBe(`${tonic}4`)
      const fifth = scaleDegree(tonic, 'major', 5)
      expect(`${fifth.step}${formatPitch(fifth).slice(1).replace(/\d+$/, '')}`).toBe(
        scaleNames(tonic, 'major')[4],
      )
    }
  })

  it('no genera dobles alteraciones espurias en mayores comunes', () => {
    for (const tonic of ['C', 'G', 'D', 'A', 'E', 'B', 'F', 'Bb', 'Eb', 'Ab', 'Db']) {
      for (const note of scaleNotes(tonic, 'major')) {
        expect(Math.abs(note.pitch.accidental)).toBeLessThanOrEqual(2)
        expect(note.name).not.toContain('##')
        expect(note.name).not.toContain('bb')
      }
    }
  })
})
