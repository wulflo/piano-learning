import Dexie, { type Table } from 'dexie'
import {
  PROGRESS_DB_VERSION,
  PROGRESS_V1_STORES,
  registerProgressMigrations,
  type ProgressMigration,
} from './migrations'
import type {
  LessonProgressRecord,
  PracticeSession,
  ProfileRecord,
  ReviewLog,
  SettingsRecord,
  SkillProgressRecord,
} from '../schemas'

/**
 * Base de datos de progreso (Dexie v2).
 *
 * Conserva el nombre histórico `pianodesdecero.progress` para no perder el
 * historial de repasos de F2-042. La versión 1 incluye las tablas de progreso y
 * la versión 2 agrega el perfil (XP, nivel, logros y racha) mediante una
 * migración versionada.
 *
 * Las filas se validan con Zod en los repositorios antes de escribirse y al
 * leerse; esta capa solo declara las tablas y sus índices.
 */

export const PROGRESS_DB_NAME = 'pianodesdecero.progress'
export { PROGRESS_DB_VERSION } from './migrations'
export const SETTINGS_RECORD_ID = 'settings'
export const PROFILE_RECORD_ID = 'profile'

export interface ProgressDatabaseOptions {
  /** Nombre de la base; por defecto `pianodesdecero.progress`. */
  name?: string
  /** Fábrica de IndexedDB; por defecto la global. */
  indexedDB?: IDBFactory
  /** Rango de claves de IndexedDB; por defecto el global. */
  IDBKeyRange?: typeof IDBKeyRange
  /** Migraciones a registrar; por defecto las de producción. */
  migrations?: readonly ProgressMigration[]
}

/** Base tipada con una tabla por dominio persistido. */
export class ProgressDatabase extends Dexie {
  lessons!: Table<LessonProgressRecord, string>
  skills!: Table<SkillProgressRecord, string>
  reviews!: Table<ReviewLog, string>
  settings!: Table<SettingsRecord, string>
  sessions!: Table<PracticeSession, string>
  profile!: Table<ProfileRecord, string>

  constructor(options: ProgressDatabaseOptions = {}) {
    const dexieOptions =
      options.indexedDB === undefined
        ? undefined
        : {
            indexedDB: options.indexedDB,
            IDBKeyRange: options.IDBKeyRange ?? globalThis.IDBKeyRange,
          }
    super(options.name ?? PROGRESS_DB_NAME, dexieOptions)

    this.version(PROGRESS_DB_VERSION).stores(PROGRESS_V1_STORES)
    registerProgressMigrations(this, options.migrations)
  }
}

/** Crea una instancia de la base; no la abre hasta la primera operación. */
export function createProgressDatabase(
  options: ProgressDatabaseOptions = {},
): ProgressDatabase {
  return new ProgressDatabase(options)
}
