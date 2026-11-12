import type { ExerciseType } from '../schemas/content'

export const EXERCISE_FORMATS = ['see', 'hear', 'spell', 'play'] as const
export type ExerciseFormat = (typeof EXERCISE_FORMATS)[number]

/**
 * Formatos que un ítem puede practicar según su tipo. «Ver» es la
 * representación visual, «oír» la auditiva, «deletrear»/«escribir» la respuesta
 * escrita y «tocar» la interpretación en el teclado.
 */
const SUPPORTED_FORMATS: Record<ExerciseType, readonly ExerciseFormat[]> = {
  'note-keyboard': ['see', 'hear', 'play'],
  'note-staff': ['see', 'hear', 'spell', 'play'],
  'scale-spelling': ['spell', 'hear', 'play'],
  'key-signature': ['see', 'spell', 'play'],
  'interval': ['spell', 'hear', 'play'],
  'chord': ['see', 'hear', 'spell', 'play'],
  'chord-notation': ['see', 'spell'],
  'roman-numeral': ['spell', 'hear', 'play'],
  'harmonic-function': ['see', 'spell'],
  cadence: ['see', 'spell'],
  'secondary-dominant': ['see', 'spell'],
  'borrowed-chord': ['see', 'spell'],
  'augmented-sixth': ['see', 'hear', 'spell'],
  'pivot-chord': ['see', 'spell'],
  'phrase-analysis': ['see', 'hear', 'spell'],
  'form-analysis': ['see', 'hear', 'spell'],
  'texture-analysis': ['see', 'hear', 'spell'],
  'counterpoint-analysis': ['see', 'hear', 'spell'],
  'ornament-execution': ['see', 'hear', 'spell'],
  'transposition': ['spell', 'hear', 'play'],
  'progression-completion': ['play'],
  'rhythm-dictation': ['hear', 'play', 'spell'],
  'rhythm-completion': ['play'],
  'anacrusis-completion': ['play'],
  'meter-accent': ['hear', 'play', 'spell'],
  'tempo-term': ['hear', 'play', 'spell'],
  'tempo-stability': ['hear', 'play', 'spell'],
  'sound-parameter': ['see', 'hear', 'play'],
  'dynamic-mark': ['hear', 'play', 'spell'],
  'articulation': ['hear', 'play', 'spell'],
  'playback-order': ['play'],
  'italian-term': ['hear', 'spell', 'play'],
  'ear-interval': ['hear', 'spell'],
  'ear-chord': ['hear', 'spell'],
  'ear-scale': ['hear', 'spell'],
  'ear-progression': ['hear', 'spell'],
  'ear-melody': ['hear', 'spell'],
  'hand-coordination': ['see', 'hear', 'spell', 'play'],
  pedal: ['see', 'hear', 'play'],
  alberti: ['see', 'hear', 'play'],
  'walking-bass': ['see', 'hear', 'play'],
  stride: ['see', 'hear', 'play'],
  'sight-reading': ['see', 'hear', 'play'],
  arpeggiated: ['see', 'hear', 'play'],
  accompaniment: ['see', 'hear', 'play'],
  'style-pattern': ['see', 'hear', 'play'],
  arpeggio: ['see', 'hear', 'spell', 'play'],
}

export function supportedFormats(type: ExerciseType): readonly ExerciseFormat[] {
  return SUPPORTED_FORMATS[type] ?? [...EXERCISE_FORMATS]
}

export interface SelectExerciseFormatParams {
  type: ExerciseType
  /** Formato con el que se respondió (o practicó) la última vez. */
  previous?: ExerciseFormat | null
}

/**
 * Elige un formato válido para el ítem y evita repetir el formato inmediato.
 * Si el ítem solo admite un formato, se repite porque no hay alternativa válida.
 */
export function selectExerciseFormat(params: SelectExerciseFormatParams): ExerciseFormat {
  const candidates = supportedFormats(params.type).filter(
    (format) => format !== params.previous,
  )
  return candidates[0] ?? supportedFormats(params.type)[0]
}
