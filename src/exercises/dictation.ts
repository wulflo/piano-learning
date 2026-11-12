import {
  beatDuration,
  clampTempo,
  DEFAULT_TEMPO,
  type TimelineEvent,
} from '../audio/notes'

/**
 * Piezas compartidas por los dictados.
 *
 * Los dictados de intervalos, acordes y escalas comparten la misma política de
 * escucha: una primera pasada y un número acotado de repeticiones con un
 * silencio entre ellas. Este módulo concentra esas reglas para que cada
 * dictado se limite a describir su material y no a repetir la lógica.
 */

export interface RepeatDictationOptions {
  /**
   * Cantidad total de pasadas, incluida la primera.
   * Se acota entre 1 y `MAX_DICTATION_PLAYS`.
   */
  times?: number
  /** Silencio entre pasadas, en pulsos de negra. */
  gapBeats?: number
  tempo?: number
}

/** Cantidad máxima de pasadas: la primera escucha y dos repeticiones. */
export const MAX_DICTATION_PLAYS = 3

/** Silencio por defecto entre repeticiones, en pulsos de negra. */
export const DEFAULT_DICTATION_GAP_BEATS = 0.5

export const DEFAULT_DICTATION_TEMPO = DEFAULT_TEMPO

/** Cantidad de repeticiones disponibles además de la primera escucha. */
export const MAX_DICTATION_REPEATS = MAX_DICTATION_PLAYS - 1

function clampPlays(times: number | undefined): number {
  if (times === undefined || !Number.isFinite(times)) return 1
  return Math.min(MAX_DICTATION_PLAYS, Math.max(1, Math.floor(times)))
}

function clampGap(gapBeats: number | undefined): number {
  if (gapBeats === undefined || !Number.isFinite(gapBeats)) {
    return DEFAULT_DICTATION_GAP_BEATS
  }
  return Math.max(0, gapBeats)
}

function dictationTempo(tempo: number | undefined): number {
  return clampTempo(tempo ?? DEFAULT_DICTATION_TEMPO)
}

function timelineEnd(events: readonly TimelineEvent[]): number {
  return events.reduce(
    (end, event) => Math.max(end, event.time + event.duration),
    0,
  )
}

/**
 * Repite un timeline con un silencio entre pasadas.
 *
 * `times` cuenta la primera escucha: `1` devuelve el material original y `2`
 * la escucha seguida de una repetición. El tope `MAX_DICTATION_PLAYS` evita que
 * un dictado se convierta en una escucha ilimitada.
 */
export function repeatDictationTimeline(
  timeline: readonly TimelineEvent[],
  options: RepeatDictationOptions = {},
): TimelineEvent[] {
  if (timeline.length === 0) return []
  const times = clampPlays(options.times)
  const gap =
    clampGap(options.gapBeats) * beatDuration(dictationTempo(options.tempo))
  const passDuration = timelineEnd(timeline)

  const events: TimelineEvent[] = []
  for (let pass = 0; pass < times; pass += 1) {
    const offset = pass * (passDuration + gap)
    for (const event of timeline) {
      events.push({ ...event, time: event.time + offset })
    }
  }
  return events
}
