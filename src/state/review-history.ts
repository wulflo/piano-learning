import { createProgressDatabase } from './db'
import { createProgressRepositories } from './repositories'
import type { ReviewLog } from '../schemas'

/**
 * Persistencia del historial de repasos sobre la base Dexie compartida.
 *
 * Se mantiene la API de F2-042 (`save`, `all`, `count`, `clear`, `close`) para
 * no romper a sus consumidores; por dentro delega en el repositorio de repasos.
 */

export const REVIEW_HISTORY_DB = 'pianodesdecero.progress'
export const REVIEW_HISTORY_STORE = 'reviews'

export interface ReviewHistoryStore {
  /** Guarda (o reemplaza por id) una respuesta validada. */
  save(log: ReviewLog): Promise<ReviewLog>
  /** Devuelve el historial ordenado por fecha, opcionalmente de un ítem. */
  all(itemId?: string): Promise<ReviewLog[]>
  /** Cuenta las respuestas guardadas. */
  count(): Promise<number>
  /** Borra todo el historial (los tests y el reset de progreso lo usan). */
  clear(): Promise<void>
  /** Cierra la conexión con la base. */
  close(): void
}

export interface ReviewHistoryOptions {
  /** Nombre de la base; por defecto `pianodesdecero.progress`. */
  dbName?: string
  /** Fábrica de IndexedDB; por defecto la global. */
  factory?: IDBFactory
}

/** Crea el repositorio tipado del historial de repasos. */
export async function createReviewHistoryStore(
  options: ReviewHistoryOptions = {},
): Promise<ReviewHistoryStore> {
  const db = createProgressDatabase({
    name: options.dbName ?? REVIEW_HISTORY_DB,
    indexedDB: options.factory,
  })

  try {
    await db.open()
  } catch (error) {
    db.close()
    throw error
  }

  const { reviews, close } = createProgressRepositories(db)

  return {
    save: (log) => reviews.save(log),
    all: (itemId) => reviews.all(itemId),
    count: () => reviews.count(),
    clear: () => reviews.clear(),
    close,
  }
}
