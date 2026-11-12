import { SKILL_KIND_VALUES, type ReviewLog, type SkillKind } from '../schemas'

/**
 * Estadísticas de repaso calculadas a partir del historial persistido.
 *
 * - La retención se mide por periodo sobre repasos programados (estados
 *   `review` y `relearning`), contando como fallo la calificación `again`.
 * - La precisión se agrupa por tipo de habilidad y usa todos los registros.
 *
 * Las fechas se agrupan en UTC para que los resultados no dependan de la zona
 * horaria de la máquina.
 */

export type StatsPeriod = 'day' | 'week' | 'month'

export type AccuracyKind = SkillKind | 'unknown'

export interface ReviewStatsOptions {
  /** Agrupación de la retención; por defecto, por día. */
  period?: StatsPeriod
  /** Resuelve el tipo de habilidad de un ítem; si falta, se agrupa como `unknown`. */
  kindForItem?: (itemId: string) => SkillKind | undefined
}

export interface RetentionBucket {
  /** Clave del periodo: `YYYY-MM-DD` (día), lunes ISO (semana) o `YYYY-MM` (mes). */
  period: string
  reviewed: number
  recalled: number
  /** Proporción de repasos recordados, entre 0 y 1. */
  retention: number
}

export interface AccuracyBucket {
  kind: AccuracyKind
  reviewed: number
  correct: number
  /** Proporción de respuestas correctas, entre 0 y 1. */
  accuracy: number
}

export interface ReviewStatsTotals {
  reviewed: number
  correct: number
  /** Proporción de respuestas correctas sobre todo el historial. */
  retention: number
}

export interface ReviewStats {
  period: StatsPeriod
  retention: RetentionBucket[]
  accuracy: AccuracyBucket[]
  totals: ReviewStatsTotals
}

const RETENTION_STATES = new Set(['review', 'relearning'])

function ratio(part: number, whole: number): number {
  return whole === 0 ? 0 : part / whole
}

function isCorrect(log: ReviewLog): boolean {
  return log.rating !== 'again'
}

function startOfUtcWeek(iso: string): string {
  const date = new Date(iso)
  const weekdayFromMonday = (date.getUTCDay() + 6) % 7
  const start = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate() - weekdayFromMonday,
  )
  return new Date(start).toISOString().slice(0, 10)
}

function periodKey(iso: string, period: StatsPeriod): string {
  if (period === 'month') return iso.slice(0, 7)
  if (period === 'week') return startOfUtcWeek(iso)
  return iso.slice(0, 10)
}

interface MutableCount {
  reviewed: number
  hits: number
}

function toAccuracyBucket(kind: AccuracyKind, count: MutableCount): AccuracyBucket {
  return {
    kind,
    reviewed: count.reviewed,
    correct: count.hits,
    accuracy: ratio(count.hits, count.reviewed),
  }
}

const KIND_ORDER = new Map<SkillKind, number>(
  SKILL_KIND_VALUES.map((kind, index) => [kind, index]),
)

function compareKinds(a: AccuracyKind, b: AccuracyKind): number {
  const orderA = a === 'unknown' ? Number.POSITIVE_INFINITY : (KIND_ORDER.get(a) ?? Number.POSITIVE_INFINITY)
  const orderB = b === 'unknown' ? Number.POSITIVE_INFINITY : (KIND_ORDER.get(b) ?? Number.POSITIVE_INFINITY)
  return orderA - orderB
}

/** Calcula retención por periodo y precisión por tipo desde el historial. */
export function computeReviewStats(
  logs: readonly ReviewLog[],
  options: ReviewStatsOptions = {},
): ReviewStats {
  const period = options.period ?? 'day'
  const retentionCounts = new Map<string, MutableCount>()
  const accuracyCounts = new Map<AccuracyKind, MutableCount>()
  let reviewed = 0
  let correct = 0

  for (const log of logs) {
    if (!Number.isFinite(Date.parse(log.reviewedAt))) continue

    const hit = isCorrect(log)
    reviewed += 1
    if (hit) correct += 1

    const kind = options.kindForItem?.(log.itemId) ?? 'unknown'
    const accuracy = accuracyCounts.get(kind) ?? { reviewed: 0, hits: 0 }
    accuracy.reviewed += 1
    if (hit) accuracy.hits += 1
    accuracyCounts.set(kind, accuracy)

    if (!RETENTION_STATES.has(log.state)) continue
    const key = periodKey(log.reviewedAt, period)
    const bucket = retentionCounts.get(key) ?? { reviewed: 0, hits: 0 }
    bucket.reviewed += 1
    if (hit) bucket.hits += 1
    retentionCounts.set(key, bucket)
  }

  const retention = [...retentionCounts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, count]) => ({
      period: key,
      reviewed: count.reviewed,
      recalled: count.hits,
      retention: ratio(count.hits, count.reviewed),
    }))

  const accuracy = [...accuracyCounts.entries()]
    .map(([kind, count]) => toAccuracyBucket(kind, count))
    .sort((a, b) => compareKinds(a.kind, b.kind))

  return {
    period,
    retention,
    accuracy,
    totals: {
      reviewed,
      correct,
      retention: ratio(correct, reviewed),
    },
  }
}
