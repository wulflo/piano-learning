import { clampTempo, type TimelineEvent } from '../audio/notes'
import { scoreToTimeline } from '../content/score'
import type { Locale } from '../content/localize'
import type { Exercise } from '../schemas'
import {
  resolvePedagogicalFeedback,
  type PedagogicalFeedback,
} from '../theory'
import { resolveExerciseAnswer } from './answer'
import { DEFAULT_DICTATION_TEMPO } from './dictation'

/**
 * Dictado de una melodía oculta.
 *
 * El alumno escucha una melodía breve sin ver la partitura y responde por el
 * intervalo, por una nota o por el movimiento. La partitura se revela recién
 * después de corregir, cuando la UI decide mostrarla. El módulo arma el
 * timeline desde la partitura, resuelve la respuesta canónica y adjunta la
 * regla «Recordá» para que el feedback sea el mismo en los dos idiomas.
 *
 * Es puro: no toca React, audio ni la base de datos.
 */

type EarMelodyExercise = Extract<Exercise, { type: 'ear-melody' }>

export interface MelodyDictation {
  exerciseId: string
  /** Timeline de una sola pasada de la melodía. */
  timeline: TimelineEvent[]
  /** La respuesta correcta es la misma melodía, para comparar después. */
  answerTimeline: TimelineEvent[]
  /** Respuesta canónica del ejercicio. */
  answer: string
  /** Respuestas aceptadas, incluida la canónica. */
  accepted: string[]
  /** Regla «Recordá» que se muestra al fallar. */
  feedback: PedagogicalFeedback
}

export interface MelodyDictationOptions {
  tempo?: number
  locale?: Locale
}

function resolveAnswer(
  exercise: EarMelodyExercise,
  locale: Locale,
): { answer: string; accepted: string[] } {
  const resolved = resolveExerciseAnswer(exercise, locale)
  if (resolved.mode === 'practice') {
    throw new Error(
      `El ejercicio ${exercise.id} no tiene una respuesta corregible para la melodía`,
    )
  }
  return { answer: resolved.answer, accepted: [...resolved.accepted] }
}

/**
 * Construye el dictado de una melodía.
 *
 * El tempo elegido por el alumno reemplaza al de la partitura; el resto de la
 * información (compases, figuras y alturas) se conserva tal como está escrita.
 */
export function buildMelodyDictation(
  exercise: EarMelodyExercise,
  options: MelodyDictationOptions = {},
): MelodyDictation {
  const tempo = clampTempo(options.tempo ?? DEFAULT_DICTATION_TEMPO)
  const locale = options.locale ?? 'es'
  const timeline = scoreToTimeline(exercise.score, tempo)
  const { answer, accepted } = resolveAnswer(exercise, locale)

  return {
    exerciseId: exercise.id,
    timeline,
    answerTimeline: timeline,
    answer,
    accepted,
    feedback: resolvePedagogicalFeedback({ exerciseType: exercise.type }),
  }
}
