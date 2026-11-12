import type { ReviewLog } from '../schemas'

/**
 * Exportación del historial para el optimizador de FSRS.
 *
 * El formato CSV coincide con el revlog de Anki que consumen
 * `fsrs-browser` y `convertCsvToFsrsItems` de
 * `@open-spaced-repetition/binding`: tiempo en milisegundos desde la época,
 * id numérico de tarjeta, calificación 1–4, duración y estado 0–3.
 *
 * Los ids de tarjeta se asignan de forma determinista ordenando los `itemId`,
 * de modo que dos exportaciones del mismo historial producen el mismo archivo.
 */

export const OPTIMIZER_CSV_HEADER =
  'review_time,card_id,review_rating,review_duration,review_state'

const RATING_CODE: Readonly<Record<ReviewLog['rating'], number>> = Object.freeze({
  again: 1,
  hard: 2,
  good: 3,
  easy: 4,
})

const STATE_CODE: Readonly<Record<ReviewLog['state'], number>> = Object.freeze({
  new: 0,
  learning: 1,
  review: 2,
  relearning: 3,
})

export interface OptimizerExportOptions {
  /** Fin de línea; por defecto `\n`. */
  newline?: '\n' | '\r\n'
}

export interface OptimizerExport {
  csv: string
  cardCount: number
  reviewCount: number
}

function compareLogs(a: ReviewLog, b: ReviewLog): number {
  return a.reviewedAt.localeCompare(b.reviewedAt) || a.id.localeCompare(b.id)
}

/** Serializa el historial en CSV compatible con los optimizadores de FSRS. */
export function serializeReviewHistoryForOptimizer(
  logs: readonly ReviewLog[],
  options: OptimizerExportOptions = {},
): OptimizerExport {
  const newline = options.newline ?? '\n'
  const sorted = [...logs].sort(compareLogs)
  const itemIds = [...new Set(sorted.map((log) => log.itemId))].sort()
  const cardIdByItem = new Map(itemIds.map((itemId, index) => [itemId, index + 1]))

  const lines = sorted.map((log) =>
    [
      Date.parse(log.reviewedAt),
      cardIdByItem.get(log.itemId),
      RATING_CODE[log.rating],
      log.durationMs ?? 0,
      STATE_CODE[log.state],
    ].join(','),
  )

  return {
    csv: [OPTIMIZER_CSV_HEADER, ...lines].join(newline) + newline,
    cardCount: itemIds.length,
    reviewCount: sorted.length,
  }
}

/** Nombre de archivo sugerido para la exportación. */
export function optimizerExportFilename(now: Date): string {
  return `pianodesdecero-revlog-${now.toISOString().slice(0, 10)}.csv`
}
