import { CHORD_DEFINITIONS, chordPitches, rootName, type ChordQuality, type Notation, type Tonic } from './chords'
import { intervalBetween } from './intervals'
import { midiOf, mod12, parsePitch, type Pitch } from './pitch'
import { scaleNotes, type ScaleMode } from './scales'

export type DiatonicMode = 'major' | 'natural-minor' | 'harmonic-minor'

export type HarmonicFunction = 'tonic' | 'subdominant' | 'dominant'

export interface DiatonicChord {
  degree: number
  roman: string
  quality: ChordQuality
  root: Pitch
  pitches: Pitch[]
  func: HarmonicFunction
  symbol: string
}

const MAJOR_QUALITIES: ChordQuality[] = [
  'major',
  'minor',
  'minor',
  'major',
  'major',
  'minor',
  'diminished',
]

const NATURAL_MINOR_QUALITIES: ChordQuality[] = [
  'minor',
  'diminished',
  'major',
  'minor',
  'minor',
  'major',
  'major',
]

const HARMONIC_MINOR_QUALITIES: ChordQuality[] = [
  'minor',
  'diminished',
  'augmented',
  'minor',
  'major',
  'major',
  'diminished',
]

export function qualitiesForMode(mode: DiatonicMode): ChordQuality[] {
  if (mode === 'natural-minor') return NATURAL_MINOR_QUALITIES
  if (mode === 'harmonic-minor') return HARMONIC_MINOR_QUALITIES
  return MAJOR_QUALITIES
}

const ROMAN_UPPER = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']

export function romanNumeralFor(degree: number, quality: ChordQuality): string {
  if (degree < 1 || degree > 7) {
    throw new Error(`Grado fuera de rango: ${degree}`)
  }
  const base = ROMAN_UPPER[degree - 1]
  const lower = quality === 'minor' || quality === 'diminished'
  const numeral = lower ? base.toLowerCase() : base
  if (quality === 'diminished' || quality === 'half-diminished7' || quality === 'diminished7') {
    return `${numeral}°`
  }
  if (quality === 'augmented') return `${numeral}+`
  return numeral
}

export function functionsForMode(mode: DiatonicMode): HarmonicFunction[] {
  if (mode === 'major') {
    return ['tonic', 'subdominant', 'tonic', 'subdominant', 'dominant', 'tonic', 'dominant']
  }
  // En menor, III y VI son relativas de la tónica/subdominante; VII y V dominan.
  return ['tonic', 'subdominant', 'tonic', 'subdominant', 'dominant', 'subdominant', 'dominant']
}

export function diatonicChord(
  tonic: Tonic,
  mode: DiatonicMode,
  degree: number,
): DiatonicChord {
  if (degree < 1 || degree > 7) {
    throw new Error(`Grado fuera de rango: ${degree}`)
  }
  const scaleMode: ScaleMode =
    mode === 'major' ? 'major' : mode === 'natural-minor' ? 'natural-minor' : 'harmonic-minor'
  const scale = scaleNotes(tonic, scaleMode)
  const root = scale[degree - 1].pitch
  const quality = qualitiesForMode(mode)[degree - 1]
  return {
    degree,
    roman: romanNumeralFor(degree, quality),
    quality,
    root,
    pitches: chordPitches(root, quality),
    func: functionsForMode(mode)[degree - 1],
    symbol: `${rootName(root)}${CHORD_DEFINITIONS[quality].symbol}`,
  }
}

export function diatonicChords(tonic: Tonic, mode: DiatonicMode): DiatonicChord[] {
  return [1, 2, 3, 4, 5, 6, 7].map((degree) => diatonicChord(tonic, mode, degree))
}

const ROMAN_VALUES: Record<string, number> = { I: 1, V: 5, X: 10 }

export interface ParsedRoman {
  degree: number
  accidental: number
  quality: ChordQuality
  seventh: boolean
}

export function parseRomanNumeral(text: string): ParsedRoman {
  const match = /^([b#]?)([ivIV]+)(°|o|\+)?(7)?$/.exec(text.trim())
  if (!match) {
    throw new Error(`Número romano inválido: "${text}"`)
  }
  const accidental = match[1] === 'b' ? -1 : match[1] === '#' ? 1 : 0
  const roman = match[2]
  let value = 0
  for (let i = 0; i < roman.length; i += 1) {
    const current = ROMAN_VALUES[roman[i].toUpperCase()]
    const next = ROMAN_VALUES[roman[i + 1]?.toUpperCase()] ?? 0
    value += current < next ? -current : current
  }
  if (value < 1 || value > 7) {
    throw new Error(`Grado romano fuera de rango: "${text}"`)
  }

  const isLower = roman === roman.toLowerCase()
  const suffix = match[3]
  const seventh = Boolean(match[4])
  let quality: ChordQuality
  if (suffix === '°' || suffix === 'o') {
    quality = seventh ? 'diminished7' : 'diminished'
  } else if (suffix === '+') {
    quality = 'augmented'
  } else {
    quality = isLower ? 'minor' : 'major'
    if (seventh) quality = isLower ? 'minor7' : 'dominant7'
  }

  return { degree: value, accidental, quality, seventh }
}

/** Convierte un número romano en un acorde sobre la tonalidad dada. */
export function romanToChord(
  tonic: Tonic,
  mode: DiatonicMode,
  numeral: string,
): { pitches: Pitch[]; root: Pitch; quality: ChordQuality; roman: string } {
  const parsed = parseRomanNumeral(numeral)
  const scaleMode: ScaleMode =
    mode === 'major' ? 'major' : mode === 'natural-minor' ? 'natural-minor' : 'harmonic-minor'
  const scale = scaleNotes(tonic, scaleMode)
  const base = scale[parsed.degree - 1].pitch
  const root: Pitch = {
    ...base,
    accidental: base.accidental + parsed.accidental,
  }
  return {
    root,
    quality: parsed.quality,
    pitches: chordPitches(root, parsed.quality),
    roman: numeral,
  }
}

/**
 * Cifra el dominante secundario de un grado: el V del acorde que ocupa ese
 * grado. En mayor, V/V es el dominante de V y V/ii el dominante de ii.
 */
export function secondaryDominantNumeral(
  targetDegree: number,
  mode: DiatonicMode = 'major',
): string {
  if (targetDegree < 1 || targetDegree > 7) {
    throw new Error(`Grado fuera de rango: ${targetDegree}`)
  }
  return `V/${romanNumeralFor(targetDegree, qualitiesForMode(mode)[targetDegree - 1])}`
}

/** Tipos de cadencia que se estudian en M5-04. */
export type CadenceType = 'authentic' | 'plagal' | 'half' | 'deceptive'

/**
 * Deducir la cadencia a partir de los dos grados que la forman evita repetir
 * la respuesta en cada ejercicio: V-I es auténtica, IV-I plagal, V-vi rota y
 * cualquier llegada al V es una semicadencia.
 */
export function cadenceTypeFor(fromDegree: number, toDegree: number): CadenceType {
  if (fromDegree === 5 && toDegree === 1) return 'authentic'
  if (fromDegree === 4 && toDegree === 1) return 'plagal'
  if (fromDegree === 5 && toDegree === 6) return 'deceptive'
  if (toDegree === 5) return 'half'
  throw new Error(`Cadencia no reconocida: ${fromDegree}-${toDegree}`)
}

export function cadenceName(
  type: CadenceType,
  locale: 'es' | 'en' = 'es',
): string {
  const names = {
    es: {
      authentic: 'Auténtica (V-I)',
      plagal: 'Plagal (IV-I)',
      half: 'Semicadencia (…-V)',
      deceptive: 'Rota (V-vi)',
    },
    en: {
      authentic: 'Authentic (V-I)',
      plagal: 'Plagal (IV-I)',
      half: 'Half cadence (…-V)',
      deceptive: 'Deceptive (V-vi)',
    },
  }
  return names[locale][type]
}

export function harmonicFunctionName(
  func: HarmonicFunction,
  locale: 'es' | 'en' = 'es',
): string {
  const names = {
    es: { tonic: 'Tónica (T)', subdominant: 'Subdominante (S)', dominant: 'Dominante (D)' },
    en: { tonic: 'Tonic (T)', subdominant: 'Subdominant (S)', dominant: 'Dominant (D)' },
  }
  return names[locale][func]
}

export function romanChordSymbol(
  numeral: string,
  tonic: Tonic,
  mode: DiatonicMode,
  notation: Notation = 'c',
): string {
  const chord = romanToChord(tonic, mode, numeral)
  return `${rootName(chord.root, notation)}${CHORD_DEFINITIONS[chord.quality].symbol}`
}

/** Comprueba que un acorde pertenece a la escala diatónica (por clases de altura). */
export function isDiatonicChord(
  tonic: Tonic,
  mode: DiatonicMode,
  chordRoot: Tonic,
  quality: ChordQuality,
): boolean {
  const scaleMode: ScaleMode =
    mode === 'major' ? 'major' : mode === 'natural-minor' ? 'natural-minor' : 'harmonic-minor'
  const scalePcs = new Set(scaleNotes(tonic, scaleMode).map((note) => mod12(midiOf(note.pitch))))
  return chordPitches(chordRoot, quality).every((pitch) => scalePcs.has(mod12(midiOf(pitch))))
}

export function chordDegreeInKey(
  tonic: Tonic,
  mode: DiatonicMode,
  chordRoot: Tonic,
): number | null {
  const root =
    typeof chordRoot === 'string'
      ? /-?\d+$/.test(chordRoot)
        ? parsePitch(chordRoot)
        : parsePitch(`${chordRoot}4`)
      : chordRoot
  const scaleMode: ScaleMode =
    mode === 'major' ? 'major' : mode === 'natural-minor' ? 'natural-minor' : 'harmonic-minor'
  const scale = scaleNotes(tonic, scaleMode)
  const index = scale.findIndex((note) => mod12(midiOf(note.pitch)) === mod12(midiOf(root)))
  return index >= 0 ? index + 1 : null
}

export function intervalQualityOfChord(tonic: Tonic, quality: ChordQuality): string {
  const [root, third, fifth] = chordPitches(tonic, quality)
  if (!third || !fifth) return ''
  const thirdInterval = intervalBetween(root, third)
  const fifthInterval = intervalBetween(root, fifth)
  return `${thirdInterval.symbol}/${fifthInterval.symbol}`
}
