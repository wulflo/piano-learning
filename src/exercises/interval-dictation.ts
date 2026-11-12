import {
  beatDuration,
  clampTempo,
  intervalTimeline,
  type TimelineEvent,
} from '../audio/notes'
import type { Locale } from '../content/localize'
import type { Exercise, SpelledPitch } from '../schemas'
import { fromSpelledPitch, intervalBetween, midiOf } from '../theory'
import {
  intervalQualityFeedback,
  type PedagogicalFeedback,
} from '../theory/errors'
import { resolveExerciseAnswer } from './answer'
import { DEFAULT_DICTATION_TEMPO } from './dictation'

export {
  DEFAULT_DICTATION_GAP_BEATS,
  DEFAULT_DICTATION_TEMPO,
  MAX_DICTATION_PLAYS,
  MAX_DICTATION_REPEATS,
  repeatDictationTimeline,
  type RepeatDictationOptions,
} from './dictation'

/**
 * Dictado de intervalos en contexto.
 *
 * Un intervalo aislado se reconoce por su distancia, pero en música aparece
 * dentro de una frase. Este módulo envuelve el par de notas del ejercicio en
 * una melodía breve: una nota de aproximación, las dos notas del intervalo y
 * una resolución. El alumno escucha la frase, puede repetirla un número
 * acotado de veces y recién después responde.
 *
 * El módulo es puro: no toca React, audio ni la base de datos. Recibe el
 * ejercicio, el tempo y el idioma, y devuelve la melodía como MIDI y como
 * timeline reproducible, además de la respuesta canónica y la regla
 * pedagógica. Así el mismo dictado se puede probar sin reproducir sonido.
 */

type IntervalExercise = Extract<Exercise, { type: 'ear-interval' | 'interval' }>

export type IntervalDictationDirection = 'ascending' | 'descending' | 'harmonic'

/** Papel de cada nota dentro de la melodía del dictado. */
export type IntervalDictationRole =
  | 'approach'
  | 'lower'
  | 'upper'
  | 'harmonic'
  | 'resolution'

export interface IntervalDictationNote {
  midi: number
  /** Duración en pulsos de negra. */
  beats: number
  role: IntervalDictationRole
}

export interface IntervalDictation {
  exerciseId: string
  lower: SpelledPitch
  upper: SpelledPitch
  lowerMidi: number
  upperMidi: number
  direction: IntervalDictationDirection
  /** Melodía breve en orden de escucha. */
  notes: IntervalDictationNote[]
  /** Timeline de una sola pasada de la melodía. */
  timeline: TimelineEvent[]
  /**
   * El intervalo solo, sin aproximación ni resolución: es la respuesta que se
   * escucha después de corregir para comparar con la melodía.
   */
  answerTimeline: TimelineEvent[]
  /** Respuesta canónica del ejercicio. */
  answer: string
  /** Respuestas aceptadas, incluida la canónica. */
  accepted: string[]
  /** Regla «Recordá» que se muestra al fallar. */
  feedback: PedagogicalFeedback
}

export interface IntervalDictationOptions {
  tempo?: number
  locale?: Locale
}

const MIN_PLAYABLE_MIDI = 21
const MAX_PLAYABLE_MIDI = 108

const APPROACH_BEATS = 0.5
const LOWER_BEATS = 0.75
const UPPER_BEATS = 1
const HARMONIC_BEATS = 1.5
const RESOLUTION_BEATS = 0.5

function isPlayable(midi: number): boolean {
  return midi >= MIN_PLAYABLE_MIDI && midi <= MAX_PLAYABLE_MIDI
}

function dictationTempo(tempo: number | undefined): number {
  return clampTempo(tempo ?? DEFAULT_DICTATION_TEMPO)
}

/** Traduce la dirección del ejercicio a la del dictado. */
export function intervalDictationDirection(
  exercise: IntervalExercise,
): IntervalDictationDirection {
  if (exercise.direction === 'harmonic') return 'harmonic'
  if (exercise.direction === 'descending') return 'descending'

  const lowerMidi = midiOf(fromSpelledPitch(exercise.lower))
  const upperMidi = midiOf(fromSpelledPitch(exercise.upper))
  return upperMidi < lowerMidi ? 'descending' : 'ascending'
}

function melodyNotes(
  direction: IntervalDictationDirection,
  lowerMidi: number,
  upperMidi: number,
): IntervalDictationNote[] {
  if (direction === 'harmonic') {
    const notes: IntervalDictationNote[] = []
    if (isPlayable(lowerMidi - 1)) {
      notes.push({
        midi: lowerMidi - 1,
        beats: APPROACH_BEATS,
        role: 'approach',
      })
    }
    notes.push({
      midi: lowerMidi,
      beats: HARMONIC_BEATS,
      role: 'harmonic',
    })
    // La segunda nota del intervalo armónico comparte el mismo evento.
    notes.push({
      midi: upperMidi,
      beats: HARMONIC_BEATS,
      role: 'harmonic',
    })
    if (isPlayable(upperMidi + 1)) {
      notes.push({
        midi: upperMidi + 1,
        beats: RESOLUTION_BEATS,
        role: 'resolution',
      })
    }
    return notes
  }

  const first = direction === 'descending' ? upperMidi : lowerMidi
  const second = direction === 'descending' ? lowerMidi : upperMidi
  const approach = direction === 'descending' ? first + 1 : first - 1
  const resolution = direction === 'descending' ? second - 1 : second + 1

  const notes: IntervalDictationNote[] = []
  if (isPlayable(approach)) {
    notes.push({ midi: approach, beats: APPROACH_BEATS, role: 'approach' })
  }
  notes.push({
    midi: first,
    beats: LOWER_BEATS,
    role: direction === 'descending' ? 'upper' : 'lower',
  })
  notes.push({
    midi: second,
    beats: UPPER_BEATS,
    role: direction === 'descending' ? 'lower' : 'upper',
  })
  if (isPlayable(resolution)) {
    notes.push({
      midi: resolution,
      beats: RESOLUTION_BEATS,
      role: 'resolution',
    })
  }
  return notes
}

function melodyTimeline(
  notes: readonly IntervalDictationNote[],
  tempo: number,
): TimelineEvent[] {
  const beat = beatDuration(tempo)
  const events: TimelineEvent[] = []
  let time = 0
  let index = 0

  while (index < notes.length) {
    const note = notes[index]
    if (note === undefined) break

    if (note.role === 'harmonic') {
      // Las dos notas del intervalo armónico suenan juntas en un solo evento.
      const pair = [note.midi]
      const next = notes[index + 1]
      if (next !== undefined && next.role === 'harmonic') {
        pair.push(next.midi)
        index += 1
      }
      events.push({
        time,
        duration: note.beats * beat,
        midis: pair,
        label: 'harmonic',
      })
      time += note.beats * beat
      index += 1
      continue
    }

    events.push({
      time,
      duration: note.beats * beat,
      midis: [note.midi],
      label: note.role,
    })
    time += note.beats * beat
    index += 1
  }

  return events
}

function answerTimeline(
  direction: IntervalDictationDirection,
  lowerMidi: number,
  upperMidi: number,
  tempo: number,
): TimelineEvent[] {
  if (direction === 'harmonic') {
    return intervalTimeline(lowerMidi, upperMidi, {
      tempo,
      mode: 'harmonic',
      beats: 1,
    })
  }
  const first = direction === 'descending' ? upperMidi : lowerMidi
  const second = direction === 'descending' ? lowerMidi : upperMidi
  return intervalTimeline(first, second, {
    tempo,
    mode: 'melodic',
    beats: LOWER_BEATS,
  })
}

function resolveAnswer(
  exercise: IntervalExercise,
  locale: Locale,
): { answer: string; accepted: string[] } {  const resolved = resolveExerciseAnswer(exercise, locale)
  if (resolved.mode === 'practice') {
    throw new Error(
      `El ejercicio ${exercise.id} no tiene una respuesta corregible para el dictado`,
    )
  }
  return { answer: resolved.answer, accepted: [...resolved.accepted] }
}

/**
 * Construye el dictado de un ejercicio de intervalos.
 *
 * La melodía sigue la dirección pedida: en ascendente y descendente agrega una
 * aproximación de semitono antes del primer sonido y una resolución de semitono
 * después del último; en armónico aproxima el bajo y resuelve sobre la nota más
 * aguda, con las dos notas del intervalo sonando a la vez. Si la aproximación o
 * la resolución caen fuera del rango audible, se omiten.
 */
export function buildIntervalDictation(
  exercise: IntervalExercise,
  options: IntervalDictationOptions = {},
): IntervalDictation {
  const tempo = dictationTempo(options.tempo)
  const locale = options.locale ?? 'es'
  const lowerMidi = midiOf(fromSpelledPitch(exercise.lower))
  const upperMidi = midiOf(fromSpelledPitch(exercise.upper))
  const direction = intervalDictationDirection(exercise)
  // La melodía se ordena por altura real: así un contenido escrito con los
  // campos invertidos sigue sonando de grave a agudo (o al revés).
  const lowMidi = Math.min(lowerMidi, upperMidi)
  const highMidi = Math.max(lowerMidi, upperMidi)
  const notes = melodyNotes(direction, lowMidi, highMidi)
  const { answer, accepted } = resolveAnswer(exercise, locale)
  // La regla se elige por la calidad real del par escrito, no por el tipo de
  // ejercicio: una tercera mayor y una quinta disminuida necesitan consejos
  // distintos aunque ambas se corrijan como «intervalo».
  const interval = intervalBetween(
    fromSpelledPitch(exercise.lower),
    fromSpelledPitch(exercise.upper),
  )

  return {
    exerciseId: exercise.id,
    lower: exercise.lower,
    upper: exercise.upper,
    lowerMidi,
    upperMidi,
    direction,
    notes,
    timeline: melodyTimeline(notes, tempo),
    answerTimeline: answerTimeline(direction, lowMidi, highMidi, tempo),
    answer,
    accepted,
    feedback: intervalQualityFeedback(interval.quality),
  }
}
