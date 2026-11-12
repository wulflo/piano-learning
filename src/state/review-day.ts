import type {
  FsrsCard,
  ReviewLog,
  SkillItem,
  SkillProgressRecord,
} from '../schemas'
import { buildDailyQueue, type DailyQueueResult, type QueueCandidate } from './daily-queue'
import { FORECAST_DAYS, forecastLoad, type LoadForecast } from './load-forecast'

/**
 * Datos del repaso de hoy.
 *
 * La pantalla de repaso combina tres fuentes que ya existen por separado:
 * - las habilidades del contenido y su tipo, para armar candidatos;
 * - las tarjetas FSRS guardadas en `skills`, para saber qué está vencido;
 * - el historial de repasos, para mostrar cuántas respuestas se registraron hoy.
 *
 * `buildReviewDay` es puro: recibe las habilidades ya filtradas, el progreso y
 * el reloj. La página decide qué habilidades corresponden (por ejemplo, solo
 * las de lecciones empezadas) y este módulo no toca la base ni la UI.
 */

const MS_PER_DAY = 86_400_000

export interface ReviewDayOptions {
  now: Date
  newPerDay: number
  seed?: number
  days?: number
}

export interface ReviewDay {
  candidates: QueueCandidate[]
  queue: DailyQueueResult
  forecast: LoadForecast
  cards: FsrsCard[]
  reviewedToday: number
}

/** Día UTC en formato `YYYY-MM-DD`, igual que la previsión y las estadísticas. */
export function utcDayKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/** Semilla estable por día para que la cola nueva cambie sin ser aleatoria. */
export function dailyReviewSeed(date: Date): number {
  const start = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
  )
  return Math.floor(start / MS_PER_DAY)
}

/** Repasos registrados en el mismo día UTC que `now`. */
export function reviewsOnDay(
  logs: readonly ReviewLog[],
  now: Date,
): ReviewLog[] {
  const key = utcDayKey(now)
  return logs.filter(
    (log) =>
      Number.isFinite(Date.parse(log.reviewedAt)) &&
      log.reviewedAt.slice(0, 10) === key,
  )
}

/**
 * Habilidades que tiene sentido repasar: las de lecciones ya empezadas o
 * completadas, más cualquier habilidad con tarjeta propia aunque la lección no
 * figure en el progreso (por ejemplo, tras importar un respaldo).
 */
export function reviewableSkills(
  skills: readonly SkillItem[],
  encounteredSkillIds: ReadonlySet<string>,
  progress: readonly SkillProgressRecord[],
): SkillItem[] {
  const withCard = new Set(
    progress
      .filter((record) => record.card !== undefined)
      .map((record) => record.id),
  )
  return skills.filter(
    (skill) => encounteredSkillIds.has(skill.id) || withCard.has(skill.id),
  )
}

/** Construye la cola, la previsión y el progreso diario a partir de datos puros. */
export function buildReviewDay(
  skills: readonly SkillItem[],
  progress: readonly SkillProgressRecord[],
  logs: readonly ReviewLog[],
  options: ReviewDayOptions,
): ReviewDay {
  const progressById = new Map(progress.map((record) => [record.id, record] as const))
  const candidates: QueueCandidate[] = skills.map((skill) => ({
    itemId: skill.id,
    kind: skill.kind,
    card: progressById.get(skill.id)?.card,
  }))
  const cards = candidates.flatMap((candidate) =>
    candidate.card === undefined ? [] : [candidate.card],
  )

  return {
    candidates,
    queue: buildDailyQueue(candidates, {
      now: options.now,
      newPerDay: options.newPerDay,
      seed: options.seed ?? dailyReviewSeed(options.now),
    }),
    forecast: forecastLoad(cards, {
      now: options.now,
      days: options.days ?? FORECAST_DAYS,
    }),
    cards,
    reviewedToday: reviewsOnDay(logs, options.now).length,
  }
}
