import {
  beatDuration,
  clampTempo,
  timelineDuration,
  type TimelineEvent,
} from '../audio/notes'
import { scoreToTimeline } from '../content/score'
import type { RepertoirePiece, Score } from '../schemas'

/**
 * F5-023 — Reproducción de piezas con manos, tempo y bucle.
 *
 * Las piezas guardan las manos como partituras independientes. Este módulo
 * decide qué partituras suenan, aplica el porcentaje de tempo, recorta el rango
 * de compases y devuelve un único timeline listo para `AudioEngine.playTimeline`.
 *
 * Es lógica pura: no toca React ni el motor. El componente `RepertoirePlayer`
 * se encarga de los controles y de detener el audio sin notas trabadas.
 */

export const PIECE_HAND_SELECTIONS = ['both', 'right', 'left'] as const
export type PieceHandSelection = (typeof PIECE_HAND_SELECTIONS)[number]

/** Rango de porcentaje de tempo que admite el reproductor. */
export const MIN_TEMPO_PERCENT = 50
export const MAX_TEMPO_PERCENT = 120
export const TEMPO_PERCENT_STEP = 5
export const DEFAULT_TEMPO_PERCENT = 100

export interface PiecePlaybackOptions {
  hands?: PieceHandSelection
  /** 100 = tempo escrito en la partitura. Se recorta a 50-120. */
  tempoPercent?: number
  /** Primer compás del fragmento (1-based, inclusive). */
  fromMeasure?: number
  /** Último compás del fragmento (1-based, inclusive). */
  toMeasure?: number
  /** Repite el fragmento sin fin hasta detenerlo. */
  loop?: boolean
}

export interface PiecePlaybackScores {
  right?: Score
  left?: Score
}

export interface PiecePlayback {
  hands: PieceHandSelection
  /** Partituras que suenan, ya recortadas al rango de compases. */
  scores: PiecePlaybackScores
  /** Eventos de audio combinados, ordenados y con tiempos desde el inicio. */
  timeline: TimelineEvent[]
  /** Tempo escrito de la pieza. */
  baseTempoBpm: number
  /** Tempo efectivo después del porcentaje y del límite del motor. */
  tempoBpm: number
  tempoPercent: number
  fromMeasure: number
  toMeasure: number
  /** Cantidad de compases incluidos. */
  measureCount: number
  /** Duración de una pasada en segundos, incluyendo el silencio final. */
  duration: number
  loop: boolean
}

export interface PieceMeasureRange {
  from: number
  to: number
  count: number
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

/** Compás más alto de una partitura (0 si no tiene eventos). */
export function scoreMeasureCount(score: Score | undefined): number {
  if (score === undefined) return 0
  return score.events.reduce(
    (max, event) => Math.max(max, event.measure),
    0,
  )
}

/** Compases que necesita una pieza, mirando todas sus partituras. */
export function pieceMeasureCount(piece: RepertoirePiece): number {
  return Math.max(
    scoreMeasureCount(piece.hands.right),
    scoreMeasureCount(piece.hands.left),
    scoreMeasureCount(piece.hands.both),
  )
}

/** Indica si una pieza puede sonar con la selección pedida. */
export function hasPieceHand(
  piece: RepertoirePiece,
  hands: PieceHandSelection,
): boolean {
  if (hands === 'right') {
    return piece.hands.right !== undefined || piece.hands.both !== undefined
  }
  if (hands === 'left') {
    return piece.hands.left !== undefined || piece.hands.both !== undefined
  }
  return (
    piece.hands.right !== undefined ||
    piece.hands.left !== undefined ||
    piece.hands.both !== undefined
  )
}

/**
 * Elige las partituras de la selección.
 *
 * `both` usa las dos manos separadas cuando existen; si la pieza solo trae una,
 * reproduce la que haya. Una pieza combinada (`hands.both`) se usa como respaldo
 * para cualquier selección.
 */
export function scoresForHands(
  piece: RepertoirePiece,
  hands: PieceHandSelection,
): PiecePlaybackScores {
  const right = piece.hands.right
  const left = piece.hands.left
  const both = piece.hands.both

  if (hands === 'right') {
    const score = right ?? both
    if (score === undefined) {
      throw new Error('La pieza no tiene partitura para la mano derecha')
    }
    return { right: score }
  }

  if (hands === 'left') {
    const score = left ?? both
    if (score === undefined) {
      throw new Error('La pieza no tiene partitura para la mano izquierda')
    }
    return { left: score }
  }

  if (right === undefined && left === undefined) {
    if (both === undefined) {
      throw new Error('La pieza no tiene partituras para reproducir')
    }
    return { right: both }
  }

  return { right, left }
}

/** Normaliza el porcentaje de tempo al rango 50-120 en pasos enteros. */
export function normalizeTempoPercent(value: unknown): number {
  if (!isFiniteNumber(value)) return DEFAULT_TEMPO_PERCENT
  return Math.min(
    MAX_TEMPO_PERCENT,
    Math.max(MIN_TEMPO_PERCENT, Math.round(value)),
  )
}

/** Tempo efectivo de una partitura según el porcentaje elegido. */
export function playbackTempo(
  baseTempoBpm: number,
  tempoPercent: number,
): number {
  return clampTempo((baseTempoBpm * normalizeTempoPercent(tempoPercent)) / 100)
}

/**
 * Normaliza el rango de compases.
 *
 * Los valores fuera de la pieza se recortan en vez de lanzar: mover un control
 * nunca debe romper la pantalla. Si el inicio queda después del final, el rango
 * se invierte.
 */
export function normalizeMeasureRange(
  piece: RepertoirePiece,
  fromMeasure: unknown,
  toMeasure: unknown,
): PieceMeasureRange {
  const count = Math.max(1, pieceMeasureCount(piece))
  const clamp = (value: unknown, fallback: number) => {
    if (!isFiniteNumber(value)) return fallback
    return Math.min(count, Math.max(1, Math.round(value)))
  }
  const first = clamp(fromMeasure, 1)
  const last = clamp(toMeasure, count)
  return {
    from: Math.min(first, last),
    to: Math.max(first, last),
    count,
  }
}

/** Recorta una partitura a un rango y reindexa los compases desde 1. */
export function sliceScoreToMeasures(
  score: Score,
  fromMeasure: number,
  toMeasure: number,
): Score {
  const events = score.events
    .filter(
      (event) =>
        event.measure >= fromMeasure && event.measure <= toMeasure,
    )
    .map((event) => ({
      ...event,
      measure: event.measure - fromMeasure + 1,
    }))
  const pedals = score.pedals
    .filter(
      (mark) => mark.measure >= fromMeasure && mark.measure <= toMeasure,
    )
    .map((mark) => ({
      ...mark,
      measure: mark.measure - fromMeasure + 1,
    }))
  return { ...score, events, pedals }
}

function baseTempoOf(scores: PiecePlaybackScores): number {
  return scores.right?.tempoBpm ?? scores.left?.tempoBpm ?? 80
}

function timeSignatureOf(scores: PiecePlaybackScores) {
  return (
    scores.right?.timeSignature ??
    scores.left?.timeSignature ?? { numerator: 4, denominator: 4 }
  )
}

/**
 * Construye el timeline de una pieza.
 *
 * - Selecciona las manos y lanza un error claro si la mano pedida no existe.
 * - Aplica el porcentaje de tempo sobre el tempo escrito de la pieza para que
 *   ambas manos permanezcan sincronizadas aunque sus partituras difieran.
 * - Recorta el rango de compases, desplaza los tiempos a cero y conserva las
 *   marcas de pedal del fragmento.
 * - Calcula una duración de pasada que incluye el silencio final del rango:
 *   así el bucle respeta los compases elegidos y no reinicia antes de tiempo.
 */
export function piecePlayback(
  piece: RepertoirePiece,
  options: PiecePlaybackOptions = {},
): PiecePlayback {
  const hands = options.hands ?? 'both'
  if (!PIECE_HAND_SELECTIONS.includes(hands)) {
    throw new Error(`Selección de manos inválida: ${String(hands)}`)
  }

  const selected = scoresForHands(piece, hands)
  const range = normalizeMeasureRange(
    piece,
    options.fromMeasure,
    options.toMeasure,
  )
  const baseTempoBpm = baseTempoOf(selected)
  const tempoPercent = normalizeTempoPercent(options.tempoPercent)
  const tempoBpm = playbackTempo(baseTempoBpm, tempoPercent)

  const scores: PiecePlaybackScores = {}
  if (selected.right !== undefined) {
    scores.right = sliceScoreToMeasures(
      selected.right,
      range.from,
      range.to,
    )
  }
  if (selected.left !== undefined) {
    scores.left = sliceScoreToMeasures(selected.left, range.from, range.to)
  }

  const timeline: TimelineEvent[] = []
  if (scores.right !== undefined) {
    timeline.push(...scoreToTimeline(scores.right, tempoBpm))
  }
  if (scores.left !== undefined) {
    timeline.push(...scoreToTimeline(scores.left, tempoBpm))
  }
  timeline.sort(
    (a, b) =>
      a.time - b.time || (a.label ?? '').localeCompare(b.label ?? ''),
  )

  const beatsPerMeasure =
    timeSignatureOf(scores).numerator *
    (4 / timeSignatureOf(scores).denominator)
  const rangeSeconds =
    (range.to - range.from + 1) * beatsPerMeasure * beatDuration(tempoBpm)
  const naturalSeconds = timelineDuration(timeline)

  return {
    hands,
    scores,
    timeline,
    baseTempoBpm,
    tempoBpm,
    tempoPercent,
    fromMeasure: range.from,
    toMeasure: range.to,
    measureCount: range.to - range.from + 1,
    duration: Math.max(naturalSeconds, rangeSeconds),
    loop: Boolean(options.loop),
  }
}
