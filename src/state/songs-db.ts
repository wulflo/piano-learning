import Dexie, { type Table } from 'dexie'
import type { SongRecord } from '../schemas'

/**
 * Base de datos de canciones del usuario.
 *
 * Es independiente de `pianodesdecero.progress`: borrar el progreso del curso
 * no elimina las canciones, y una copia de seguridad de progreso no arrastra
 * archivos de audio ni partituras personales. La versión 1 solo declara la
 * tabla `songs`, ordenada por `updatedAt` para listar lo último editado.
 */

export const SONGS_DB_NAME = 'pianodesdecero.songs'
export const SONGS_DB_VERSION = 1
export const SONGS_STORES: Readonly<Record<string, string>> = Object.freeze({
  songs: 'id, updatedAt',
})

export interface SongsDatabaseOptions {
  /** Nombre de la base; por defecto `pianodesdecero.songs`. */
  name?: string
  /** Fábrica de IndexedDB; por defecto la global. */
  indexedDB?: IDBFactory
  /** Rango de claves de IndexedDB; por defecto el global. */
  IDBKeyRange?: typeof IDBKeyRange
}

export class SongsDatabase extends Dexie {
  songs!: Table<SongRecord, string>

  constructor(options: SongsDatabaseOptions = {}) {
    const dexieOptions =
      options.indexedDB === undefined
        ? undefined
        : {
            indexedDB: options.indexedDB,
            IDBKeyRange: options.IDBKeyRange ?? globalThis.IDBKeyRange,
          }
    super(options.name ?? SONGS_DB_NAME, dexieOptions)
    this.version(SONGS_DB_VERSION).stores(SONGS_STORES)
  }
}

/** Crea una instancia; no la abre hasta la primera operación. */
export function createSongsDatabase(
  options: SongsDatabaseOptions = {},
): SongsDatabase {
  return new SongsDatabase(options)
}
