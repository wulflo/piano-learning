import type { ReviewRating } from '../schemas'

/**
 * Calificación automática de una respuesta de ejercicio según lo pedido por
 * FSRS:
 * - incorrecta → `again`
 * - correcta con pista o lenta → `hard`
 * - correcta rápida → `easy`
 * - correcta en tiempo normal → `good`
 */

/** Umbrales de tiempo para la calificación automática. */
export interface RatingThresholds {
  /** Duración máxima (ms) de una respuesta rápida: `easy` si es correcta y sin pista. */
  easyMaxMs: number
  /** Duración mínima (ms) de una respuesta lenta: `hard` si es correcta. */
  hardMinMs: number
}

/** Umbrales por defecto pensados para ejercicios cortos de teoría y teclado. */
export const DEFAULT_RATING_THRESHOLDS: Readonly<RatingThresholds> = Object.freeze({
  easyMaxMs: 5_000,
  hardMinMs: 15_000,
})

/** Datos de una respuesta que se califica automáticamente. */
export interface AutoRatingInput {
  /** Si la respuesta fue correcta. */
  correct: boolean
  /** Duración de la respuesta en milisegundos; si falta se asume un tiempo normal. */
  durationMs?: number
  /** Si la respuesta se dio con alguna pista. */
  usedHint?: boolean
}

function validateThresholds(thresholds: RatingThresholds): void {
  if (
    !Number.isFinite(thresholds.easyMaxMs) ||
    !Number.isFinite(thresholds.hardMinMs) ||
    thresholds.easyMaxMs < 0 ||
    thresholds.easyMaxMs >= thresholds.hardMinMs
  ) {
    throw new Error(
      'Los umbrales de calificación deben ser finitos, no negativos y cumplir easyMaxMs < hardMinMs',
    )
  }
}

/** Devuelve la calificación FSRS que corresponde a una respuesta. */
export function autoReviewRating(
  input: AutoRatingInput,
  thresholds: RatingThresholds = DEFAULT_RATING_THRESHOLDS,
): ReviewRating {
  validateThresholds(thresholds)

  if (!input.correct) {
    return 'again'
  }
  if (input.usedHint) {
    return 'hard'
  }

  const durationMs = input.durationMs
  if (durationMs === undefined) {
    return 'good'
  }

  const elapsed = Math.max(0, durationMs)
  if (elapsed <= thresholds.easyMaxMs) {
    return 'easy'
  }
  if (elapsed >= thresholds.hardMinMs) {
    return 'hard'
  }
  return 'good'
}
