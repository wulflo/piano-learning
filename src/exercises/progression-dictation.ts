import {
  beatDuration,
  chordTimeline,
  clampTempo,
  shiftTimeline,
  type TimelineEvent,
} from '../audio/notes'
import type { Locale } from '../content/localize'
import type { Exercise, Key } from '../schemas'
import {
  midiOf,
  resolvePedagogicalFeedback,
  romanToChord,
  type DiatonicMode,
  type PedagogicalFeedback,
} from '../theory'
import { resolveExerciseAnswer } from './answer'
import { DEFAULT_DICTATION_TEMPO } from './dictation'

/**
 * Dictado de progresiones de acordes.
 *
 * El alumno escucha una progresión corta y elige sus grados. El módulo lee los
 * números romanos del ejercicio, construye cada acorde en la tonalidad
 * declarada y los encadena en un timeline reproducible. También resuelve la
 * respuesta canónica y adjunta la regla «Recordá» para que la corrección sea la
 * misma en cualquier idioma.
 *
 * Es puro: no toca React, audio ni la base de datos. La UI decide cuándo
 * reproducirlo y cuántas repeticiones consumir.
 */

type EarProgressionExercise = Extract<Exercise, { type: 'ear-progression' }>

/** Modos de tonalidad que admite el esquema de progresiones. */
export const PROGRESSION_DICTATION_MODES = ['major', 'minor'] as const

export type ProgressionDictationMode =
  (typeof PROGRESSION_DICTATION_MODES)[number]

/** Duración de cada acorde de la progresión, en pulsos de negra. */
export const PROGRESSION_CHORD_BEATS = 1.5

export interface ProgressionDictationChord {
  /** Grado tal como lo declara el ejercicio, por ejemplo `IV` o `V7`. */
  numeral: string
  /** Notas del acorde en posición fundamental, como MIDI. */
  midis: number[]
}

export interface ProgressionDictation {
  exerciseId: string
  key: Key
  mode: ProgressionDictationMode
  /** Modo diatónico usado para leer los números romanos. */
  diatonicMode: DiatonicMode
  degrees: string[]
  chords: ProgressionDictationChord[]
  /** Timeline de una sola pasada de la progresión. */
  timeline: TimelineEvent[]
  /** Timeline de la respuesta correcta: la misma progresión en bloque. */
  answerTimeline: TimelineEvent[]
  /** Respuesta canónica del ejercicio. */
  answer: string
  /** Respuestas aceptadas, incluida la canónica. */
  accepted: string[]
  /** Regla «Recordá» que se muestra al fallar. */
  feedback: PedagogicalFeedback
}

export interface ProgressionDictationOptions {
  tempo?: number
  locale?: Locale
}

/**
 * Traduce el modo del contenido al modo diatónico del motor.
 *
 * El esquema solo distingue mayor y menor; la menor se lee como natural porque
 * la calidad de cada número romano ya viene escrita en el ejercicio.
 */
export function progressionDiatonicMode(
  mode: ProgressionDictationMode,
): DiatonicMode {
  return mode === 'minor' ? 'natural-minor' : 'major'
}

function resolveAnswer(
  exercise: EarProgressionExercise,
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

function progressionTimeline(
  chords: readonly ProgressionDictationChord[],
  tempo: number,
): TimelineEvent[] {
  const chordDuration = PROGRESSION_CHORD_BEATS * beatDuration(tempo)
  const events: TimelineEvent[] = []

  chords.forEach((chord, index) => {
    const block = chordTimeline(chord.midis, {
      tempo,
      style: 'block',
      noteBeats: PROGRESSION_CHORD_BEATS,
    })
    events.push(...shiftTimeline(block, index * chordDuration))
  })

  return events
}

/**
 * Construye el dictado de una progresión.
 *
 * Respeta la tonalidad, el modo y el orden de los grados del ejercicio. La
 * opción `tempo` permite que el reproductor use el tempo elegido por el alumno.
 */
export function buildProgressionDictation(
  exercise: EarProgressionExercise,
  options: ProgressionDictationOptions = {},
): ProgressionDictation {
  const tempo = clampTempo(options.tempo ?? DEFAULT_DICTATION_TEMPO)
  const locale = options.locale ?? 'es'
  const diatonicMode = progressionDiatonicMode(exercise.mode)
  const chords = exercise.degrees.map((numeral) => {
    const chord = romanToChord(exercise.key, diatonicMode, numeral)
    return {
      numeral,
      midis: chord.pitches.map((pitch) => midiOf(pitch)),
    }
  })
  const { answer, accepted } = resolveAnswer(exercise, locale)

  return {
    exerciseId: exercise.id,
    key: exercise.key,
    mode: exercise.mode,
    diatonicMode,
    degrees: [...exercise.degrees],
    chords,
    timeline: progressionTimeline(chords, tempo),
    answerTimeline: progressionTimeline(chords, tempo),
    answer,
    accepted,
    feedback: resolvePedagogicalFeedback({ exerciseType: exercise.type }),
  }
}
