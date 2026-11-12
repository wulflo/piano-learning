import {
  beatDuration,
  chordTimeline,
  clampTempo,
  shiftTimeline,
  type TimelineEvent,
} from '../audio/notes'
import type { Exercise, Key } from '../schemas'
import { midiOf, romanToChord, type DiatonicMode } from '../theory'
import {
  DEFAULT_DICTATION_TEMPO,
} from './dictation'
import {
  PROGRESSION_CHORD_BEATS,
  progressionDiatonicMode,
} from './progression-dictation'

/**
 * Audio de los ejercicios de completar progresiones.
 *
 * La reproducción deriva los acordes de los grados y la tonalidad del propio
 * ejercicio, igual que el dictado de progresiones. Se ofrecen tres timelines:
 * la progresión completa (para escuchar la respuesta), el contexto con el
 * hueco en silencio (para trabajar sin oír la respuesta) y el acorde faltante
 * aislado. El módulo es puro y no depende de React ni del motor de audio.
 */

type ProgressionCompletionExercise = Extract<
  Exercise,
  { type: 'progression-completion' }
>

export interface ProgressionCompletionChord {
  /** Grado tal como lo declara el ejercicio, por ejemplo `IV` o `vi`. */
  numeral: string
  /** Notas del acorde en posición fundamental, como MIDI. */
  midis: number[]
}

export interface ProgressionCompletionAudio {
  exerciseId: string
  key: Key
  mode: 'major' | 'minor'
  diatonicMode: DiatonicMode
  degrees: string[]
  missingIndex: number
  chords: ProgressionCompletionChord[]
  /** Progresión completa, con el acorde que falta incluido. */
  timeline: TimelineEvent[]
  /** Progresión con un silencio en el lugar del hueco. */
  contextTimeline: TimelineEvent[]
  /** Solo el acorde que falta. */
  missingTimeline: TimelineEvent[]
}

export interface ProgressionCompletionAudioOptions {
  tempo?: number
}

function progressionTimeline(
  chords: readonly ProgressionCompletionChord[],
  tempo: number,
  skipIndex?: number,
): TimelineEvent[] {
  const chordSeconds = PROGRESSION_CHORD_BEATS * beatDuration(tempo)
  const events: TimelineEvent[] = []

  chords.forEach((chord, index) => {
    if (index === skipIndex) return
    const block = chordTimeline(chord.midis, {
      tempo,
      style: 'block',
      noteBeats: PROGRESSION_CHORD_BEATS,
    })
    events.push(...shiftTimeline(block, index * chordSeconds))
  })

  return events
}

/**
 * Construye el audio de un ejercicio de completar progresiones. Respeta la
 * tonalidad, el modo y el orden de los grados; las opciones de tempo permiten
 * que el reproductor use el tempo elegido por el alumno.
 */
export function buildProgressionCompletionAudio(
  exercise: ProgressionCompletionExercise,
  options: ProgressionCompletionAudioOptions = {},
): ProgressionCompletionAudio {
  const tempo = clampTempo(options.tempo ?? DEFAULT_DICTATION_TEMPO)
  const diatonicMode = progressionDiatonicMode(exercise.mode)
  const chords = exercise.degrees.map((numeral) => {
    const chord = romanToChord(exercise.key, diatonicMode, numeral)
    return {
      numeral,
      midis: chord.pitches.map((pitch) => midiOf(pitch)),
    }
  })
  const missingChord = chords[exercise.missingIndex]
  if (missingChord === undefined) {
    throw new Error(
      `El índice faltante ${exercise.missingIndex} está fuera de la progresión`,
    )
  }

  return {
    exerciseId: exercise.id,
    key: exercise.key,
    mode: exercise.mode,
    diatonicMode,
    degrees: [...exercise.degrees],
    missingIndex: exercise.missingIndex,
    chords,
    timeline: progressionTimeline(chords, tempo),
    contextTimeline: progressionTimeline(chords, tempo, exercise.missingIndex),
    missingTimeline: progressionTimeline([missingChord], tempo),
  }
}
