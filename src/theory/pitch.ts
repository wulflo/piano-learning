/**
 * Altura musical interna.
 *
 * Se usa una representación numérica de la alteración (-2..2) para poder
 * calcular sin ambigüedad. La notación científica se conserva para la UI y
 * para el pentagrama: Do central = C4 = MIDI 60.
 */

export const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const
export type Letter = (typeof LETTERS)[number]

export const LETTER_SEMITONES: Record<Letter, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
}

export interface Pitch {
  step: Letter
  /** -2 doble bemol, -1 bemol, 0 natural, 1 sostenido, 2 doble sostenido. */
  accidental: number
  octave: number
}

export interface PitchLike {
  step: string
  accidental: number | string
  octave: number
}

const ACCIDENTAL_BY_TEXT: Record<string, number> = {
  bb: -2,
  b: -1,
  '': 0,
  '#': 1,
  '##': 2,
  x: 2,
}

const TEXT_BY_ACCIDENTAL: Record<number, string> = {
  [-2]: 'bb',
  [-1]: 'b',
  0: '',
  1: '#',
  2: '##',
}

export const MIDI_MIN = 0
export const MIDI_MAX = 127

export function isLetter(value: string): value is Letter {
  return (LETTERS as readonly string[]).includes(value)
}

export function letterIndex(letter: Letter): number {
  return LETTERS.indexOf(letter)
}

export function accidentalToText(accidental: number): string {
  const text = TEXT_BY_ACCIDENTAL[accidental]
  if (text === undefined) {
    throw new Error(`Alteración fuera de rango: ${accidental}`)
  }
  return text
}

export function accidentalToNumber(accidental: number | string): number {
  if (typeof accidental === 'number') {
    if (!Number.isInteger(accidental) || accidental < -2 || accidental > 2) {
      throw new Error(`Alteración fuera de rango: ${accidental}`)
    }
    return accidental
  }
  const value = ACCIDENTAL_BY_TEXT[accidental]
  if (value === undefined) {
    throw new Error(`Alteración inválida: "${accidental}"`)
  }
  return value
}

/**
 * Acepta "C4", "C#4", "Db3", "Bbbb2", "Cx4" (x = doble sostenido) y octavas
 * negativas ("C-1"). La alteración debe ir entre la letra y la octava.
 */
export function parsePitch(text: string): Pitch {
  const match = /^([A-Ga-g])(bb|b|##|#|x)?(-?\d+)$/.exec(text.trim())
  if (!match) {
    throw new Error(`Nota inválida: "${text}" (se esperaba, por ejemplo, C#4)`)
  }
  const step = match[1].toUpperCase()
  if (!isLetter(step)) {
    throw new Error(`Nota inválida: "${text}"`)
  }
  return {
    step,
    accidental: ACCIDENTAL_BY_TEXT[match[2] ?? ''] ?? 0,
    octave: Number(match[3]),
  }
}

export function formatPitch(pitch: Pitch): string {
  return `${pitch.step}${accidentalToText(pitch.accidental)}${pitch.octave}`
}

export function formatPitchEs(pitch: Pitch): string {
  const names: Record<Letter, string> = {
    C: 'Do',
    D: 'Re',
    E: 'Mi',
    F: 'Fa',
    G: 'Sol',
    A: 'La',
    B: 'Si',
  }
  const glyphs: Record<number, string> = {
    [-2]: '𝄫',
    [-1]: '♭',
    0: '',
    1: '♯',
    2: '𝄪',
  }
  return `${names[pitch.step]}${glyphs[pitch.accidental] ?? ''}`
}

export function pitchClass(pitch: Pitch): number {
  return mod12(LETTER_SEMITONES[pitch.step] + pitch.accidental)
}

export function midiOf(pitch: Pitch): number {
  const midi = (pitch.octave + 1) * 12 + LETTER_SEMITONES[pitch.step] + pitch.accidental
  if (midi < MIDI_MIN || midi > MIDI_MAX) {
    throw new Error(
      `MIDI fuera de rango: ${midi} (${formatPitch(pitch)}); rango válido 0-127`,
    )
  }
  return midi
}

export function isMidiInRange(midi: number): boolean {
  return Number.isInteger(midi) && midi >= MIDI_MIN && midi <= MIDI_MAX
}

/**
 * Devuelve una grafía para un MIDI. Sin `preferred` usa sostenidos, que es la
 * convención ascendente por defecto. Con `preferred` respeta letra y alteración
 * y ajusta la octava para que el MIDI coincida (por ejemplo, Reb4 para 61).
 */
export function pitchFromMidi(
  midi: number,
  preferred?: Pick<Pitch, 'step' | 'accidental'>,
): Pitch {
  if (!isMidiInRange(midi)) {
    throw new Error(`MIDI fuera de rango: ${midi}`)
  }

  if (preferred) {
    const naturalPc = LETTER_SEMITONES[preferred.step]
    const targetPc = mod12(midi)
    let accidental: number
    try {
      accidental = normalizeAccidental(targetPc - naturalPc)
    } catch {
      return defaultSpellingFromMidi(midi)
    }
    const octave = (midi - naturalPc - accidental) / 12 - 1
    if (Number.isInteger(octave)) {
      return { step: preferred.step, accidental, octave }
    }
  }

  return defaultSpellingFromMidi(midi)
}

const SHARP_SPELLING: Array<Pick<Pitch, 'step' | 'accidental'>> = [
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
]

function defaultSpellingFromMidi(midi: number): Pitch {
  const spelling = SHARP_SPELLING[mod12(midi)]
  const naturalPc = LETTER_SEMITONES[spelling.step]
  const octave = (midi - naturalPc - spelling.accidental) / 12 - 1
  return { ...spelling, octave }
}

export function fromSpelledPitch(pitch: PitchLike): Pitch {
  if (!isLetter(pitch.step)) {
    throw new Error(`Nota inválida: "${pitch.step}"`)
  }
  return {
    step: pitch.step,
    accidental: accidentalToNumber(pitch.accidental),
    octave: pitch.octave,
  }
}

export function toSpelledPitch(pitch: Pitch): {
  step: Letter
  accidental: '' | 'b' | '#' | 'bb' | '##'
  octave: number
} {
  return {
    step: pitch.step,
    accidental: accidentalToText(pitch.accidental) as '' | 'b' | '#' | 'bb' | '##',
    octave: pitch.octave,
  }
}

export function transposePitch(pitch: Pitch, semitones: number): Pitch {
  return pitchFromMidi(midiOf(pitch) + semitones)
}

export function samePitch(a: Pitch, b: Pitch): boolean {
  return midiOf(a) === midiOf(b)
}

export function comparePitch(a: Pitch, b: Pitch): number {
  return midiOf(a) - midiOf(b)
}

/** Enarmonías razonables (sin dobles alteraciones) para una altura. */
export function enharmonicSpellings(pitch: Pitch): Pitch[] {
  const midi = midiOf(pitch)
  const seen = new Set<string>()
  const results: Pitch[] = []
  for (const letter of LETTERS) {
    const candidate = pitchFromMidi(midi, { step: letter, accidental: 0 })
    if (Math.abs(candidate.accidental) <= 1) {
      const key = formatPitch(candidate)
      if (!seen.has(key)) {
        seen.add(key)
        results.push(candidate)
      }
    }
  }
  return results
}

export function mod12(value: number): number {
  return ((value % 12) + 12) % 12
}

/**
 * Normaliza la diferencia entre una clase de altura objetivo y la natural de
 * una letra al rango -2..2. Lanza si la grafía requeriría más de doble
 * alteración; eso evita bucles y errores silenciosos.
 */
export function normalizeAccidental(difference: number): number {
  const normalized = ((((difference + 6) % 12) + 12) % 12) - 6
  if (normalized < -2 || normalized > 2) {
    throw new Error(
      `La grafía requeriría más de doble alteración (diferencia ${difference})`,
    )
  }
  return normalized
}
