import { MAX_DICTATION_PLAYS, MAX_DICTATION_REPEATS } from './dictation'

/**
 * Estado compartido de reproducción de un ejercicio.
 *
 * La pregunta (lo que se escucha antes de responder) y la respuesta (lo que se
 * escucha después de corregir) llevan cuentas separadas. La cuenta se guarda
 * con el id del ejercicio: al cambiar de ítem arranca en cero sin arrastrar las
 * pasadas del anterior.
 *
 * Es puro: no toca React ni el motor de audio. La UI decide cuándo llamar a
 * `registerPlay` y qué timeline reproducir.
 */

/** Las dos caras de la escucha de un ejercicio. */
export type PlaybackKind = 'question' | 'answer'

/** Cantidad máxima de pasadas, incluida la primera. */
export const MAX_EXERCISE_PLAYS = MAX_DICTATION_PLAYS

/** Cantidad máxima de repeticiones, sin contar la primera pasada. */
export const MAX_EXERCISE_REPEATS = MAX_DICTATION_REPEATS

export interface PlaybackCounter {
  /** Id del ejercicio al que pertenecen las cuentas. */
  id: string | null
  question: number
  answer: number
}

/** Crea un contador vacío para el ejercicio indicado. */
export function createPlaybackCounter(id: string | null = null): PlaybackCounter {
  return { id, question: 0, answer: 0 }
}

/** Devuelve la cuenta del ejercicio y la cara pedida; 0 si cambió el id. */
export function playbackCount(
  counter: PlaybackCounter,
  id: string,
  kind: PlaybackKind,
): number {
  return counter.id === id ? counter[kind] : 0
}

/** Repeticiones consumidas: todas las pasadas menos la primera escucha. */
export function playbackRepeats(count: number): number {
  return Math.max(0, count - 1)
}

/** Indica si todavía queda alguna pasada disponible. */
export function canPlay(
  counter: PlaybackCounter,
  id: string,
  kind: PlaybackKind,
): boolean {
  return playbackCount(counter, id, kind) < MAX_EXERCISE_PLAYS
}

/**
 * Registra una pasada y devuelve un contador nuevo.
 *
 * Si el id cambió, la cuenta arranca otra vez. Al llegar al tope no se
 * incrementa: la UI deshabilita el botón y no se reproduce nada más.
 */
export function registerPlay(
  counter: PlaybackCounter,
  id: string,
  kind: PlaybackKind,
): PlaybackCounter {
  const current =
    counter.id === id ? counter : createPlaybackCounter(id)
  if (current[kind] >= MAX_EXERCISE_PLAYS) return current
  return { ...current, [kind]: current[kind] + 1 }
}
