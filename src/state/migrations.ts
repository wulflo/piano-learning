import type Dexie from 'dexie'
import type { Transaction } from 'dexie'

/**
 * Migraciones versionadas de la base de progreso.
 *
 * Dexie ejecuta cada `upgrade` una sola vez al pasar de una versión a otra. Las
 * migraciones se declaran en orden ascendente y solo indican las tablas que
 * cambian; Dexie hereda las demás. La función de datos debe ser idempotente para
 * que repetirla sobre una base ya migrada no duplique ni altere registros.
 */

export const PROGRESS_DB_VERSION = 1

/** Esquema de la primera versión; base sobre la que se aplican las migraciones. */
export const PROGRESS_V1_STORES: Readonly<Record<string, string>> = Object.freeze({
  lessons: 'id',
  skills: 'id, card.due',
  reviews: 'id, itemId, reviewedAt',
  settings: 'id',
  sessions: 'id, startedAt',
})

export interface ProgressMigration {
  /** Versión de destino; debe ser mayor que la versión anterior. */
  version: number
  /** Tablas nuevas o índices modificados; las tablas omitidas se heredan. */
  stores: Record<string, string | null>
  /** Cambios de datos; se ejecuta dentro de la transacción de actualización. */
  upgrade?: (transaction: Transaction) => Promise<void> | void
}

/** Migraciones de producción, en orden ascendente. */
export const PROGRESS_MIGRATIONS: readonly ProgressMigration[] = Object.freeze([
  {
    version: 2,
    stores: { profile: 'id' },
  },
])

/** Registra las migraciones sobre una instancia de Dexie ya declarada. */
export function registerProgressMigrations(
  db: Dexie,
  migrations: readonly ProgressMigration[] = PROGRESS_MIGRATIONS,
  baseVersion: number = PROGRESS_DB_VERSION,
): void {
  const ordered = [...migrations].sort((a, b) => a.version - b.version)
  const seen = new Set<number>()
  let previous = baseVersion

  for (const migration of ordered) {
    if (seen.has(migration.version)) {
      throw new Error(`Migración duplicada para la versión ${migration.version}`)
    }
    if (migration.version <= previous) {
      throw new Error(
        `La migración ${migration.version} debe ser mayor que la versión ${previous}`,
      )
    }
    seen.add(migration.version)

    const version = db.version(migration.version).stores(migration.stores)
    if (migration.upgrade) {
      const upgrade = migration.upgrade
      version.upgrade((transaction) => upgrade(transaction))
    }
    previous = migration.version
  }
}

/** Última versión declarada, incluyendo la base y las migraciones registradas. */
export function latestProgressVersion(
  migrations: readonly ProgressMigration[] = PROGRESS_MIGRATIONS,
): number {
  return migrations.reduce(
    (latest, migration) => Math.max(latest, migration.version),
    PROGRESS_DB_VERSION,
  )
}
