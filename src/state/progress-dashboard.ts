import type {
  LessonProgressRecord,
  PracticeSession,
  Profile,
  ReviewLog,
  SkillKind,
  Streak,
} from '../schemas'
import {
  computeReviewStats,
  type ReviewStats,
  type StatsPeriod,
} from './stats'
import { levelProgress, type LevelProgress } from './xp'

/**
 * Datos de la pantalla de progreso.
 *
 * Reúne las métricas que ya calculan los motores de F2-046 y F2-052 y las
 * expone listas para la UI. Es puro: recibe el historial, el perfil, las
 * sesiones y las lecciones; no lee la base ni depende del reloj.
 */

export interface ProgressDashboardInput {
  reviews: readonly ReviewLog[]
  profile: Profile
  sessions: readonly PracticeSession[]
  lessons: readonly LessonProgressRecord[]
  /** Agrupación de la retención; por defecto, por día. */
  period?: StatsPeriod
  /** Resuelve el tipo de habilidad de un ítem. */
  kindForItem?: (itemId: string) => SkillKind | undefined
}

export interface ProgressDashboard {
  stats: ReviewStats
  level: LevelProgress
  streak: Streak
  scheduledReviewed: number
  scheduledRecalled: number
  /** Retención sobre repasos programados, entre 0 y 1. */
  retention: number
  totalReviews: number
  sessionCount: number
  practiceSeconds: number
  lessonSeconds: number
  totalSeconds: number
}

/**
 * Segundos reales de una sesión de práctica.
 *
 * Los bloques son la fuente principal. Si una sesión no tiene bloques, se usa
 * el intervalo entre inicio y fin cuando es válido; si tampoco lo es, cuenta 0.
 */
export function practiceSessionSeconds(session: PracticeSession): number {
  const fromBlocks = session.blocks.reduce(
    (sum, block) => sum + block.seconds,
    0,
  )
  if (fromBlocks > 0) return fromBlocks

  const start = Date.parse(session.startedAt)
  const end = Date.parse(session.endedAt)
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0
  return Math.round((end - start) / 1000)
}

/** Construye el panel de progreso a partir de datos persistidos. */
export function buildProgressDashboard(
  input: ProgressDashboardInput,
): ProgressDashboard {
  const stats = computeReviewStats(input.reviews, {
    period: input.period ?? 'day',
    kindForItem: input.kindForItem,
  })

  const scheduledReviewed = stats.retention.reduce(
    (sum, bucket) => sum + bucket.reviewed,
    0,
  )
  const scheduledRecalled = stats.retention.reduce(
    (sum, bucket) => sum + bucket.recalled,
    0,
  )

  const practiceSeconds = input.sessions.reduce(
    (sum, session) => sum + practiceSessionSeconds(session),
    0,
  )
  const lessonSeconds = input.lessons.reduce(
    (sum, lesson) => sum + lesson.secondsSpent,
    0,
  )

  return {
    stats,
    level: levelProgress(input.profile.xp),
    streak: input.profile.streak,
    scheduledReviewed,
    scheduledRecalled,
    retention:
      scheduledReviewed === 0 ? 0 : scheduledRecalled / scheduledReviewed,
    totalReviews: input.reviews.length,
    sessionCount: input.sessions.length,
    practiceSeconds,
    lessonSeconds,
    totalSeconds: practiceSeconds + lessonSeconds,
  }
}
