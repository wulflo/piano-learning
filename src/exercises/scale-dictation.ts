import {
  clampTempo,
  scaleTimeline,
  type TimelineEvent,
} from '../audio/notes'
import type { Locale } from '../content/localize'
import type { Exercise, Key } from '../schemas'
import {
  midiOf,
  parseTonic,
  resolvePedagogicalFeedback,
  scaleName,
  scalePitches,
  SCALE_MODES,
  type PedagogicalFeedback,
  type ScaleMode,
} from '../theory'
import { resolveExerciseAnswer } from './answer'
import { DEFAULT_DICTATION_TEMPO } from './dictation'

/**
 * Dictado de escalas y modos.
 *
 * El alumno escucha una escala sin ver sus notas y elige su tipo o modo. El
 * módulo construye la escala desde la tónica del ejercicio, la entrega como
 * timeline reproducible y agrega una escala de referencia para comparar: la
 * mayor paralela en los modos diatónicos, la natural en las menores alteradas
 * y la pentatónica en el blues. También resuelve la respuesta canónica y
 * adjunta la regla «Recordá» para que la corrección sea la misma en cualquier
 * idioma.
 *
 * Es puro: no toca React, audio ni la base de datos. La UI decide cuándo
 * reproducirlo y cuántas repeticiones consumir.
 */

type EarScaleExercise = Extract<Exercise, { type: 'ear-scale' }>

/** Todos los tipos de escala que puede reconocer el dictado. */
export const SCALE_DICTATION_MODES: readonly ScaleMode[] = [...SCALE_MODES]

/**
 * Escala de referencia que se ofrece para comparar.
 *
 * La comparación usa la misma tónica para que el alumno escuche qué grados
 * cambian: la mayor paralela en los modos diatónicos, la natural en las
 * menores armónica y melódica, y la pentatónica menor en el blues.
 */
export const SCALE_DICTATION_COMPARISON: Record<ScaleMode, ScaleMode> = {
  major: 'natural-minor',
  ionian: 'aeolian',
  'natural-minor': 'major',
  aeolian: 'major',
  'harmonic-minor': 'natural-minor',
  'melodic-minor': 'natural-minor',
  dorian: 'major',
  phrygian: 'major',
  lydian: 'major',
  mixolydian: 'major',
  locrian: 'major',
  'major-pentatonic': 'major',
  'minor-pentatonic': 'natural-minor',
  blues: 'minor-pentatonic',
  chromatic: 'major',
  'whole-tone': 'major',
}

/** Duración de cada nota de la escala, en pulsos de negra. */
const SCALE_NOTE_BEATS = 0.5

export interface ScaleDictationReference {
  mode: ScaleMode
  labelEs: string
  labelEn: string
  /** Notas de la escala de referencia, incluida la octava de la tónica. */
  midis: number[]
  /** Timeline de una sola pasada de la referencia. */
  timeline: TimelineEvent[]
}

/** El dictado de escala y su respuesta comparten la misma pasada. */
export interface ScaleDictation {
  exerciseId: string
  tonic: Key
  mode: ScaleMode
  /** Notas de la escala en orden ascendente, incluida la octava de la tónica. */
  midis: number[]
  /** Timeline de una sola pasada de la escala. */
  timeline: TimelineEvent[]
  /** Timeline de la respuesta correcta: la escala del ejercicio. */
  answerTimeline: TimelineEvent[]
  /** Escala de referencia para comparar antes de responder. */
  reference: ScaleDictationReference
  /** Respuesta canónica del ejercicio. */
  answer: string
  /** Respuestas aceptadas, incluida la canónica. */
  accepted: string[]
  /** Regla «Recordá» que se muestra al fallar. */
  feedback: PedagogicalFeedback
}

export interface ScaleDictationOptions {
  tempo?: number
  locale?: Locale
}

/** Devuelve el modo que conviene escuchar como referencia de comparación. */
export function scaleComparisonMode(mode: ScaleMode): ScaleMode {
  return SCALE_DICTATION_COMPARISON[mode]
}

function scaleMidis(tonic: Key, mode: ScaleMode): number[] {
  const midis = scalePitches(tonic, mode).map((pitch) => midiOf(pitch))
  const closing = midiOf(parseTonic(tonic)) + 12
  // La tónica superior cierra la escala; si el patrón ya terminó en esa
  // octava, no se repite.
  if (midis[midis.length - 1] !== closing) midis.push(closing)
  return midis
}

function resolveAnswer(
  exercise: EarScaleExercise,
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
 * Construye el dictado de una escala.
 *
 * Respeta la tónica y el modo del ejercicio. La opción `tempo` permite que el
 * reproductor use el tempo elegido por el alumno; la comparación se calcula con
 * el mismo tempo para que ambas escalas se escuchen a la misma velocidad.
 */
export function buildScaleDictation(
  exercise: EarScaleExercise,
  options: ScaleDictationOptions = {},
): ScaleDictation {
  const tempo = clampTempo(options.tempo ?? DEFAULT_DICTATION_TEMPO)
  const locale = options.locale ?? 'es'
  const midis = scaleMidis(exercise.tonic, exercise.mode)
  const referenceMode = scaleComparisonMode(exercise.mode)
  const referenceMidis = scaleMidis(exercise.tonic, referenceMode)
  const { answer, accepted } = resolveAnswer(exercise, locale)

  return {
    exerciseId: exercise.id,
    tonic: exercise.tonic,
    mode: exercise.mode,
    midis,
    timeline: scaleTimeline(midis, {
      tempo,
      noteBeats: SCALE_NOTE_BEATS,
    }),
    answerTimeline: scaleTimeline(midis, {
      tempo,
      noteBeats: SCALE_NOTE_BEATS,
    }),
    reference: {
      mode: referenceMode,
      labelEs: scaleName(referenceMode, 'es'),
      labelEn: scaleName(referenceMode, 'en'),
      midis: referenceMidis,
      timeline: scaleTimeline(referenceMidis, {
        tempo,
        noteBeats: SCALE_NOTE_BEATS,
      }),
    },
    answer,
    accepted,
    feedback: resolvePedagogicalFeedback({ exerciseType: exercise.type }),
  }
}
