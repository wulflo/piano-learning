import { accidentalToText, type Pitch } from './theory/pitch'

export type Notation = 'do' | 'c'

const SOLFEGE: Record<Pitch['step'], string> = {
  C: 'Do',
  D: 'Re',
  E: 'Mi',
  F: 'Fa',
  G: 'Sol',
  A: 'La',
  B: 'Si',
}

const GLYPHS: Record<number, string> = {
  [-2]: '𝄫',
  [-1]: '♭',
  0: '',
  1: '♯',
  2: '𝄪',
}

/** Nombre de una altura con la notación elegida (sin octava por defecto). */
export function pitchName(
  pitch: Pick<Pitch, 'step' | 'accidental'>,
  notation: Notation = 'c',
): string {
  const base = notation === 'do' ? SOLFEGE[pitch.step] : pitch.step
  return `${base}${GLYPHS[pitch.accidental] ?? accidentalToText(pitch.accidental)}`
}

export function midiName(midi: number, notation: Notation = 'c'): string {
  const names = [
    { step: 'C', accidental: 0 },
    { step: 'C', accidental: 1 },
    { step: 'D', accidental: 0 },
    { step: 'D', accidental: 1 },
    { step: 'E', accidental: 0 },
    { step: 'F', accidental: 0 },
    { step: 'F', accidental: 1 },
    { step: 'G', accidental: 0 },
    { step: 'G', accidental: 1 },
    { step: 'A', accidental: 0 },
    { step: 'A', accidental: 1 },
    { step: 'B', accidental: 0 },
  ] as const
  return pitchName(names[((midi % 12) + 12) % 12], notation)
}

export function midiNameWithOctave(midi: number, notation: Notation = 'c'): string {
  const octave = Math.floor(midi / 12) - 1
  return `${midiName(midi, notation)}${octave}`
}
