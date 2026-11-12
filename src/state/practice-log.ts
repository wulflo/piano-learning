import type {
  FsrsCard,
  ReviewLog,
  ReviewRating,
  SkillKind,
  SkillProgress,
  SkillProgressRecord,
} from '../schemas'
import {
  createFsrsItemCard,
  gradeFsrsItem,
  type FsrsSchedulerParams,
} from './fsrs'
import type { ProgressRepositories } from './repositories'

/**
 * Registro de una respuesta de repaso con autoevaluación.
 *
 * El alumno escucha o toca el ítem y elige una de las cuatro calificaciones
 * FSRS. La app mide cuánto tardó en responder y guarda juntos la tarjeta
 * actualizada y el registro de revisión. La maestría de la habilidad sube o
 * baja con pasos pequeños: un fallo no borra el progreso, pero sí lo enfría.
 *
 * Este módulo no toca React: recibe los repositorios y el reloj, de modo que el
 * flujo completo se puede probar sin navegador.
 */

/** Formatos admitidos por el historial de repasos. */
export type ReviewFormat = NonNullable<ReviewLog['format']>

/** Cambio de maestría por calificación; se aplica con tope 0–1. */
export const MASTERY_DELTA: Readonly<Record<ReviewRating, number>> = Object.freeze({
  again: -0.1,
  hard: 0.05,
  good: 0.1,
  easy: 0.15,
})

/** Formato de práctica que corresponde al tipo de habilidad. */
export function reviewFormatForKind(kind: SkillKind): ReviewFormat {
  switch (kind) {
    case 'keyboard-task':
      return 'play'
    case 'ear-interval':
    case 'ear-chord':
    case 'ear-scale':
    case 'ear-progression':
    case 'ear-melody':
    case 'sound-parameter':
    case 'texture':
    case 'counterpoint':
    case 'ornament':
      return 'hear'
    case 'note-id':
    case 'key-signature':
    case 'roman-numeral':
      return 'see'
    default:
      return 'spell'
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function roundMastery(value: number): number {
  return Math.round(clamp(value, 0, 1) * 1000) / 1000
}

function normalizeDuration(durationMs: number): number {
  if (!Number.isFinite(durationMs)) return 0
  return Math.max(0, Math.round(durationMs))
}

/**
 * Aplica una calificación al progreso de la habilidad.
 *
 * `again` cuenta como respuesta incorrecta y baja la maestría; el resto suma
 * una respuesta correcta y sube la maestría con un paso distinto según la
 * facilidad declarada por el alumno.
 */
export function applyReviewToSkill(
  current: SkillProgress | undefined,
  card: FsrsCard,
  rating: ReviewRating,
): SkillProgress {
  const correct = (current?.correct ?? 0) + (rating === 'again' ? 0 : 1)
  const incorrect = (current?.incorrect ?? 0) + (rating === 'again' ? 1 : 0)
  const mastery = roundMastery(
    (current?.mastery ?? 0) + MASTERY_DELTA[rating],
  )

  return {
    ...current,
    card,
    mastery,
    correct,
    incorrect,
  }
}

export interface RecordReviewInput {
  itemId: string
  /** Tipo de habilidad, para elegir el formato del registro. */
  kind: SkillKind
  /** Formato explícito; si falta, se deriva del tipo de habilidad. */
  format?: ReviewFormat
  rating: ReviewRating
  /** Milisegundos entre mostrar el ítem y calificarlo. */
  durationMs: number
  /** Parámetros FSRS derivados de los ajustes. */
  fsrsParams?: FsrsSchedulerParams
  /** Reloj inyectable; por defecto, la hora real. */
  now?: Date
}

export interface RecordReviewResult {
  card: FsrsCard
  log: ReviewLog
  progress: SkillProgressRecord
}

/**
 * Califica un ítem, avanza su tarjeta FSRS y guarda tarjeta e historial.
 *
 * Si el ítem todavía no tenía tarjeta se crea una nueva antes de calificarla,
 * así que el primer repaso de una habilidad también entra al plan FSRS. La
 * escritura de la tarjeta y del registro es atómica.
 */
export async function recordReview(
  repositories: ProgressRepositories,
  input: RecordReviewInput,
): Promise<RecordReviewResult> {
  const now = input.now ?? new Date()
  const durationMs = normalizeDuration(input.durationMs)
  const current = await repositories.skills.get(input.itemId)
  const card =
    current?.card ??
    (await createFsrsItemCard(input.itemId, input.fsrsParams, now))

  const graded = await gradeFsrsItem({
    itemId: input.itemId,
    card,
    rating: input.rating,
    now,
    context: {
      format: input.format ?? reviewFormatForKind(input.kind),
      durationMs,
    },
    fsrsParams: input.fsrsParams,
  })

  const progress = applyReviewToSkill(current, graded.card, input.rating)
  const saved = await repositories.saveReviewResult(
    input.itemId,
    progress,
    graded.log,
  )

  return { card: graded.card, log: saved.log, progress: saved.progress }
}
