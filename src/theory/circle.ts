import { chordPitches, parseRoot, rootName, type ChordQuality, type Notation, type Tonic } from './chords'
import {
  MAJOR_KEY_BY_COUNT,
  keySignature,
  relativeMajorOf,
  relativeMinorOf,
  spellPitchClassInKey,
  type KeyMode,
} from './keys'
import {
  LETTER_SEMITONES,
  midiOf,
  mod12,
  type Pitch,
} from './pitch'
import { formatTonicName, scalePitches, type ScaleMode } from './scales'

export interface CirclePosition {
  major: string
  minor: string
  count: number
  position: number
}

/** Círculo de quintas de 7 bemoles a 7 sostenidos. */
export const CIRCLE_OF_FIFTHS: string[] = Object.keys(MAJOR_KEY_BY_COUNT)
  .map(Number)
  .sort((a, b) => a - b)
  .map((count) => MAJOR_KEY_BY_COUNT[count])

export function circlePositions(): CirclePosition[] {
  return CIRCLE_OF_FIFTHS.map((major, position) => ({
    major,
    minor: relativeMinorOf(major),
    count: keySignature(major, 'major').count,
    position,
  }))
}

export function circleIndex(tonic: string): number {
  const index = CIRCLE_OF_FIFTHS.indexOf(tonic)
  if (index < 0) throw new Error(`Tonalidad fuera del círculo: ${tonic}`)
  return index
}

export function circleNeighbors(tonic: string): { previous: string; next: string } {
  const index = circleIndex(tonic)
  return {
    previous: CIRCLE_OF_FIFTHS[(index - 1 + CIRCLE_OF_FIFTHS.length) % CIRCLE_OF_FIFTHS.length],
    next: CIRCLE_OF_FIFTHS[(index + 1) % CIRCLE_OF_FIFTHS.length],
  }
}

/** Bemoles o sostenidos de la armadura, con signo. */
export function signatureAccidentals(tonic: string, mode: KeyMode = 'major'): string[] {
  const signature = keySignature(tonic, mode)
  return signature.accidentals.map(
    (item) => `${item.step}${item.accidental > 0 ? '♯' : '♭'}`,
  )
}

export function relativeKey(tonic: string, mode: KeyMode): { tonic: string; mode: KeyMode } {
  return mode === 'major'
    ? { tonic: relativeMinorOf(tonic), mode: 'minor' }
    : { tonic: relativeMajorOf(tonic), mode: 'major' }
}

/** Homónima: misma tónica, distinto modo. */
export function parallelKey(tonic: string, mode: KeyMode): { tonic: string; mode: KeyMode } {
  return { tonic, mode: mode === 'major' ? 'minor' : 'major' }
}

function respellMidi(midi: number, step: Pitch['step'], accidental: number): Pitch {
  const naturalPc = LETTER_SEMITONES[step]
  const octave = (midi - naturalPc - accidental) / 12 - 1
  return { step, accidental, octave }
}

/** Transpone una nota y la deletrea según la tonalidad destino. */
export function transposeNoteToKey(
  pitch: Pitch,
  semitones: number,
  targetTonic: string,
  targetMode: KeyMode = 'major',
): Pitch {
  const midi = midiOf(pitch) + semitones
  const spelling = spellPitchClassInKey(mod12(midi), targetTonic, targetMode)
  return respellMidi(midi, spelling.step, spelling.accidental)
}

export function transposeMelody(
  melody: Pitch[],
  fromTonic: string,
  toTonic: string,
  mode: ScaleMode = 'major',
): Pitch[] {
  const from = parseRoot(formatTonicName(scalePitches(fromTonic, mode)[0]))
  const to = parseRoot(formatTonicName(scalePitches(toTonic, mode)[0]))
  const delta = midiOf(to) - midiOf(from)
  const sourceScale = scalePitches(fromTonic, mode)
  const sourcePcs = sourceScale.map((pitch) => mod12(midiOf(pitch)))
  const targetScale = scalePitches(toTonic, mode)

  return melody.map((pitch) => {
    const sourceMidi = midiOf(pitch)
    const targetMidi = sourceMidi + delta
    const sourcePc = mod12(sourceMidi)
    const degree = sourcePcs.indexOf(sourcePc)
    if (degree >= 0) {
      const target = targetScale[degree]
      return respellMidi(targetMidi, target.step, target.accidental)
    }
    const spelling = spellPitchClassInKey(
      mod12(targetMidi),
      toTonic,
      mode === 'major' ? 'major' : 'minor',
    )
    return respellMidi(targetMidi, spelling.step, spelling.accidental)
  })
}

export function transposeChordToKey(
  tonic: Tonic,
  quality: ChordQuality,
  semitones: number,
  targetTonic: string,
  targetMode: KeyMode = 'major',
): Pitch[] {
  const root = parseRoot(tonic)
  const midi = midiOf(root) + semitones
  const spelling = spellPitchClassInKey(mod12(midi), targetTonic, targetMode)
  const transposedRoot = respellMidi(midi, spelling.step, spelling.accidental)
  return chordPitches(transposedRoot, quality)
}

export function chordSymbolInKey(
  tonic: Tonic,
  quality: ChordQuality,
  targetTonic: string,
  targetMode: KeyMode,
  semitones: number,
  notation: Notation,
): string {
  const [root] = transposeChordToKey(tonic, quality, semitones, targetTonic, targetMode)
  return rootName(root, notation)
}
