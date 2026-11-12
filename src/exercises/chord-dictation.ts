import {
  chordTimeline,
  clampTempo,
  type ChordStyle,
  type TimelineEvent,
} from '../audio/notes'
import type { Locale } from '../content/localize'
import type { Exercise, SpelledPitch } from '../schemas'
import {
  chordWithInversion,
  fromSpelledPitch,
  midiOf,
  type ChordQuality,
} from '../theory'
import {
  resolvePedagogicalFeedback,
  type PedagogicalFeedback,
} from '../theory/errors'
import { resolveExerciseAnswer } from './answer'
import { DEFAULT_DICTATION_TEMPO } from './dictation'

/**
 * Dictado de calidad de acordes.
 *
 * El alumno escucha un acorde sin ver sus notas y elige su calidad. El módulo
 * arma el voicing a partir de la fundamental, la calidad y la inversión del
 * ejercicio y lo entrega como timeline reproducible, en bloque o arpegiado.
 * También resuelve la respuesta canónica y adjunta la regla «Recordá» para que
 * la corrección sea la misma en cualquier idioma.
 *
 * Es puro: no toca React, audio ni la base de datos. La UI decide cuándo
 * reproducirlo y cuántas repeticiones consumir.
 */

type EarChordExercise = Extract<Exercise, { type: 'ear-chord' }>

/** Las cuatro tríadas que puede reconocer el dictado. */
export const CHORD_DICTATION_TRIAD_QUALITIES: readonly ChordQuality[] = [
  'major',
  'minor',
  'diminished',
  'augmented',
]

/** Las cinco séptimas que puede reconocer el dictado. */
export const CHORD_DICTATION_SEVENTH_QUALITIES: readonly ChordQuality[] = [
  'major7',
  'dominant7',
  'minor7',
  'half-diminished7',
  'diminished7',
]

/** Repertorio completo del dictado: las cuatro tríadas y las cinco séptimas. */
export const CHORD_DICTATION_QUALITIES: readonly ChordQuality[] = [
  ...CHORD_DICTATION_TRIAD_QUALITIES,
  ...CHORD_DICTATION_SEVENTH_QUALITIES,
]

/** Familia de escucha del dictado: acorde simultáneo o notas sucesivas. */
export type ChordDictationMode = 'block' | 'arpeggio'

/**
 * Traduce un estilo de reproducción a la familia que evalúa el dictado.
 * El bajo con acorde mantiene el material del acorde en bloque, aunque el bajo
 * se sostenga aparte; los arpegios suenan nota por nota.
 */
export function chordDictationMode(style: ChordStyle): ChordDictationMode {
  return style === 'block' || style === 'bass-chord' ? 'block' : 'arpeggio'
}

export interface ChordDictation {
  exerciseId: string
  root: SpelledPitch
  quality: ChordQuality
  inversion: number
  /** Notas del voicing en orden ascendente, como MIDI. */
  midis: number[]
  /** Estilo con el que se reproduce el acorde. */
  style: ChordStyle
  mode: ChordDictationMode
  /** Timeline de una sola pasada del acorde. */
  timeline: TimelineEvent[]
  /**
   * El acorde en bloque, sin importar el estilo de la pregunta: es la respuesta
   * que se escucha después de corregir para comparar con el arpegio.
   */
  answerTimeline: TimelineEvent[]
  /** Respuesta canónica del ejercicio. */
  answer: string
  /** Respuestas aceptadas, incluida la canónica. */
  accepted: string[]
  /** Regla «Recordá» que se muestra al fallar. */
  feedback: PedagogicalFeedback
}

export interface ChordDictationOptions {
  tempo?: number
  locale?: Locale
  /** Estilo de escucha; por defecto, el que declara el ejercicio. */
  style?: ChordStyle
}

function resolveAnswer(
  exercise: EarChordExercise,
  locale: Locale,
): { answer: string; accepted: string[] } {
  const resolved = resolveExerciseAnswer(exercise, locale)
  if (resolved.mode === 'practice') {
    throw new Error(
      `El ejercicio ${exercise.id} no tiene una respuesta corregible para el dictado`,
    )
  }
  return { answer: resolved.answer, accepted: [...resolved.accepted] }
}

/**
 * Construye el dictado de calidad de un acorde.
 *
 * Respeta la fundamental, la inversión y el estilo del ejercicio. La opción
 * `style` permite que el reproductor alterne entre bloque y arpegio sin cambiar
 * el contenido; el timeline se recalcula con el tempo indicado.
 */
export function buildChordDictation(
  exercise: EarChordExercise,
  options: ChordDictationOptions = {},
): ChordDictation {
  const tempo = clampTempo(options.tempo ?? DEFAULT_DICTATION_TEMPO)
  const locale = options.locale ?? 'es'
  const style = options.style ?? exercise.style
  const pitches = chordWithInversion(
    fromSpelledPitch(exercise.root),
    exercise.quality,
    exercise.inversion,
  )
  const midis = pitches.map((pitch) => midiOf(pitch))
  const { answer, accepted } = resolveAnswer(exercise, locale)

  return {
    exerciseId: exercise.id,
    root: exercise.root,
    quality: exercise.quality,
    inversion: exercise.inversion,
    midis,
    style,
    mode: chordDictationMode(style),
    timeline: chordTimeline(midis, {
      tempo,
      style,
      noteBeats: 1,
    }),
    answerTimeline: chordTimeline(midis, {
      tempo,
      style: 'block',
      noteBeats: 1,
    }),
    answer,
    accepted,
    feedback: resolvePedagogicalFeedback({ exerciseType: exercise.type }),
  }
}
