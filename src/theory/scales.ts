import {
  LETTER_SEMITONES,
  LETTERS,
  accidentalToText,
  formatPitch,
  midiOf,
  mod12,
  normalizeAccidental,
  parsePitch,
  type Pitch,
} from './pitch'
import { spellPitchClassInKey } from './keys'

export const SCALE_MODES = [
  'major',
  'natural-minor',
  'harmonic-minor',
  'melodic-minor',
  'ionian',
  'dorian',
  'phrygian',
  'lydian',
  'mixolydian',
  'aeolian',
  'locrian',
  'major-pentatonic',
  'minor-pentatonic',
  'blues',
  'chromatic',
  'whole-tone',
] as const

export type ScaleMode = (typeof SCALE_MODES)[number]

export interface ScaleStepDefinition {
  /** Grado musical (1-based, puede repetirse en blues: 5 y ♭5). */
  degree: number
  /** Semitonos desde la tónica. */
  semitones: number
  /** Distancia de letras desde la tónica (0 = misma letra). */
  letterOffset: number
}

export interface ScaleDefinition {
  mode: ScaleMode
  nameEs: string
  nameEn: string
  steps: ScaleStepDefinition[]
  descendingSteps?: ScaleStepDefinition[]
}

function steps(semitones: number[], degrees?: number[]): ScaleStepDefinition[] {
  return semitones.map((value, index) => ({
    degree: degrees?.[index] ?? index + 1,
    semitones: value,
    letterOffset: degrees?.[index] ? degrees[index] - 1 : index,
  }))
}

export const SCALE_DEFINITIONS: Record<ScaleMode, ScaleDefinition> = {
  major: {
    mode: 'major',
    nameEs: 'Mayor',
    nameEn: 'Major',
    steps: steps([0, 2, 4, 5, 7, 9, 11]),
  },
  ionian: {
    mode: 'ionian',
    nameEs: 'Jónico',
    nameEn: 'Ionian',
    steps: steps([0, 2, 4, 5, 7, 9, 11]),
  },
  'natural-minor': {
    mode: 'natural-minor',
    nameEs: 'Menor natural',
    nameEn: 'Natural minor',
    steps: steps([0, 2, 3, 5, 7, 8, 10]),
  },
  aeolian: {
    mode: 'aeolian',
    nameEs: 'Eólico',
    nameEn: 'Aeolian',
    steps: steps([0, 2, 3, 5, 7, 8, 10]),
  },
  'harmonic-minor': {
    mode: 'harmonic-minor',
    nameEs: 'Menor armónica',
    nameEn: 'Harmonic minor',
    steps: steps([0, 2, 3, 5, 7, 8, 11]),
  },
  'melodic-minor': {
    mode: 'melodic-minor',
    nameEs: 'Menor melódica',
    nameEn: 'Melodic minor',
    steps: steps([0, 2, 3, 5, 7, 9, 11]),
    descendingSteps: steps([0, 2, 3, 5, 7, 8, 10]),
  },
  dorian: {
    mode: 'dorian',
    nameEs: 'Dórico',
    nameEn: 'Dorian',
    steps: steps([0, 2, 3, 5, 7, 9, 10]),
  },
  phrygian: {
    mode: 'phrygian',
    nameEs: 'Frigio',
    nameEn: 'Phrygian',
    steps: steps([0, 1, 3, 5, 7, 8, 10]),
  },
  lydian: {
    mode: 'lydian',
    nameEs: 'Lidio',
    nameEn: 'Lydian',
    steps: steps([0, 2, 4, 6, 7, 9, 11]),
  },
  mixolydian: {
    mode: 'mixolydian',
    nameEs: 'Mixolidio',
    nameEn: 'Mixolydian',
    steps: steps([0, 2, 4, 5, 7, 9, 10]),
  },
  locrian: {
    mode: 'locrian',
    nameEs: 'Locrio',
    nameEn: 'Locrian',
    steps: steps([0, 1, 3, 5, 6, 8, 10]),
  },
  'major-pentatonic': {
    mode: 'major-pentatonic',
    nameEs: 'Pentatónica mayor',
    nameEn: 'Major pentatonic',
    steps: steps([0, 2, 4, 7, 9], [1, 2, 3, 5, 6]),
  },
  'minor-pentatonic': {
    mode: 'minor-pentatonic',
    nameEs: 'Pentatónica menor',
    nameEn: 'Minor pentatonic',
    steps: steps([0, 3, 5, 7, 10], [1, 3, 4, 5, 7]),
  },
  blues: {
    mode: 'blues',
    nameEs: 'Blues',
    nameEn: 'Blues',
    steps: steps([0, 3, 5, 6, 7, 10], [1, 3, 4, 5, 5, 7]),
  },
  chromatic: {
    mode: 'chromatic',
    nameEs: 'Cromática',
    nameEn: 'Chromatic',
    steps: steps([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]),
  },
  'whole-tone': {
    mode: 'whole-tone',
    nameEs: 'Tonos enteros',
    nameEn: 'Whole tone',
    steps: steps([0, 2, 4, 6, 8, 10]),
  },
}

export interface ScaleDirectionOptions {
  /** Solo aplica a menor melódica. */
  direction?: 'ascending' | 'descending'
  /** Octava de la tónica cuando se pasa un nombre sin octava. */
  octave?: number
}

export interface ScaleNote {
  pitch: Pitch
  degree: number
  semitones: number
  name: string
}

export type TonicInput = string | Pitch

export function parseTonic(tonic: TonicInput, octave = 4): Pitch {
  if (typeof tonic !== 'string') return tonic
  if (/-?\d+$/.test(tonic)) return parsePitch(tonic)
  return parsePitch(`${tonic}${octave}`)
}

export function scaleNotes(
  tonic: TonicInput,
  mode: ScaleMode,
  options: ScaleDirectionOptions = {},
): ScaleNote[] {
  const definition = SCALE_DEFINITIONS[mode]
  if (!definition) {
    throw new Error(`Modo desconocido: ${mode}`)
  }
  const root = parseTonic(tonic, options.octave ?? 4)
  const useDescending = options.direction === 'descending' && definition.descendingSteps
  const pattern = useDescending ? definition.descendingSteps! : definition.steps

  if (mode === 'chromatic') {
    return pattern.map((step, index) => {
      const midi = midiOf(root) + step.semitones
      const pc = mod12(midi)
      const spelling = spellPitchClassInKey(pc, formatTonicName(root), 'major')
      const naturalPc = LETTER_SEMITONES[spelling.step]
      const pitch: Pitch = {
        step: spelling.step,
        accidental: spelling.accidental,
        octave: (midi - naturalPc - spelling.accidental) / 12 - 1,
      }
      return {
        pitch,
        degree: index + 1,
        semitones: step.semitones,
        name: formatPitch(pitch),
      }
    })
  }

  const rootLetterIndex = LETTERS.indexOf(root.step)
  return pattern.map((step) => {
    const absoluteLetter = rootLetterIndex + step.letterOffset
    const letter = LETTERS[((absoluteLetter % 7) + 7) % 7]
    const targetPc = mod12(midiOf(root) + step.semitones)
    const naturalPc = LETTER_SEMITONES[letter]
    const accidental = normalizeAccidental(targetPc - naturalPc)

    const octaveShift = Math.floor(absoluteLetter / 7)
    const octave = root.octave + octaveShift
    const pitch: Pitch = { step: letter, accidental, octave }
    return {
      pitch,
      degree: step.degree,
      semitones: step.semitones,
      name: formatPitch(pitch),
    }
  })
}

export function scalePitches(
  tonic: TonicInput,
  mode: ScaleMode,
  options: ScaleDirectionOptions = {},
): Pitch[] {
  return scaleNotes(tonic, mode, options).map((note) => note.pitch)
}

export function scalePitchClasses(tonic: TonicInput, mode: ScaleMode): number[] {
  return scalePitches(tonic, mode).map((pitch) => mod12(midiOf(pitch)))
}

export function scaleDegree(tonic: TonicInput, mode: ScaleMode, degree: number): Pitch {
  const notes = scaleNotes(tonic, mode)
  const found = notes.find((note) => note.degree === degree)
  if (!found) {
    throw new Error(`Grado ${degree} inexistente en ${mode}`)
  }
  return found.pitch
}

/** Nombres sin octava (por ejemplo `['C', 'D', 'E']`), útiles para la UI. */
export function scaleNames(
  tonic: TonicInput,
  mode: ScaleMode,
  options: ScaleDirectionOptions = {},
): string[] {
  return scaleNotes(tonic, mode, options).map(
    (note) => `${note.pitch.step}${accidentalToText(note.pitch.accidental)}`,
  )
}

/** Nombres con octava científica (por ejemplo `['C4', 'D4', 'E4']`). */
export function scaleSpellings(
  tonic: TonicInput,
  mode: ScaleMode,
  options: ScaleDirectionOptions = {},
): string[] {
  return scaleNotes(tonic, mode, options).map((note) => note.name)
}

export function scaleName(mode: ScaleMode, locale: 'es' | 'en' = 'es'): string {
  return SCALE_DEFINITIONS[mode][locale === 'es' ? 'nameEs' : 'nameEn']
}

export function formatTonicName(root: Pitch): string {
  return `${root.step}${accidentalToText(root.accidental)}`
}

/** Los 7 modos diatónicos y su grado respecto de la mayor relativa. */
export const DIATONIC_MODES: Array<{ mode: ScaleMode; degreeOffset: number }> = [
  { mode: 'ionian', degreeOffset: 0 },
  { mode: 'dorian', degreeOffset: 1 },
  { mode: 'phrygian', degreeOffset: 2 },
  { mode: 'lydian', degreeOffset: 3 },
  { mode: 'mixolydian', degreeOffset: 4 },
  { mode: 'aeolian', degreeOffset: 5 },
  { mode: 'locrian', degreeOffset: 6 },
]

/**
 * Tónica relativa de un modo dentro de una mayor. Por ejemplo, C mayor con
 * offset 1 produce D dórico, que comparte exactamente las mismas notas.
 */
export function relativeModeTonic(majorTonic: TonicInput, degreeOffset: number): Pitch {
  return scalePitches(majorTonic, 'major')[degreeOffset]
}

export function relativeModePitches(
  majorTonic: TonicInput,
  mode: ScaleMode,
): Pitch[] {
  const entry = DIATONIC_MODES.find((item) => item.mode === mode)
  if (!entry) {
    throw new Error(`${mode} no es un modo diatónico de la mayor`)
  }
  return scalePitches(relativeModeTonic(majorTonic, entry.degreeOffset), mode)
}

export function samePitchClasses(a: Pitch[], b: Pitch[]): boolean {
  const setA = new Set(a.map((pitch) => mod12(midiOf(pitch))))
  const setB = new Set(b.map((pitch) => mod12(midiOf(pitch))))
  if (setA.size !== setB.size) return false
  for (const pc of setA) {
    if (!setB.has(pc)) return false
  }
  return true
}
