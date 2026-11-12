import {
  SongBundleSchema,
  SongImportSchema,
  UserSongSchema,
  type SongBundle,
  type SongRecord,
  type UserSong,
} from '../schemas'
import {
  createSongsDatabase,
  type SongsDatabase,
} from './songs-db'

/**
 * Repositorio de canciones del usuario.
 *
 * Valida con Zod antes de escribir y al leer. La base se abre de forma
 * perezosa en la primera operación; la UI puede compartir una sola instancia y
 * cerrarla al desmontar.
 */

export interface SongRepository {
  list(): Promise<SongRecord[]>
  get(id: string): Promise<SongRecord | undefined>
  save(song: UserSong): Promise<SongRecord>
  remove(id: string): Promise<void>
  clear(): Promise<void>
  /** Acepta una canción suelta o un archivo `pdc.songs` con varias. */
  import(data: unknown): Promise<SongRecord[]>
  /** Exporta todas las canciones, o solo las indicadas por id. */
  export(ids?: readonly string[]): Promise<SongBundle>
  close(): void
}

function sortSongs(a: SongRecord, b: SongRecord): number {
  return b.updatedAt.localeCompare(a.updatedAt) || a.title.localeCompare(b.title)
}

/** ID estable y legible para una canción nueva. */
export function createSongId(
  now: number = Date.now(),
  random: () => number = Math.random,
): string {
  const suffix = Math.floor(random() * 36 ** 6)
    .toString(36)
    .padStart(6, '0')
  return `song.${now.toString(36)}.${suffix}`
}

export function createSongRepository(
  db: SongsDatabase = createSongsDatabase(),
): SongRepository {
  return {
    async list() {
      const rows = await db.songs.toArray()
      return rows.map((row) => UserSongSchema.parse(row)).sort(sortSongs)
    },
    async get(id) {
      const row = await db.songs.get(id)
      return row === undefined ? undefined : UserSongSchema.parse(row)
    },
    async save(song) {
      const parsed = UserSongSchema.parse(song)
      await db.songs.put(parsed)
      return parsed
    },
    async remove(id) {
      await db.songs.delete(id)
    },
    async clear() {
      await db.songs.clear()
    },
    async import(data) {
      const parsed = SongImportSchema.parse(data)
      const songs = 'songs' in parsed ? parsed.songs : [parsed]
      const rows = songs.map((song) => UserSongSchema.parse(song))
      await db.songs.bulkPut(rows)
      return rows
    },
    async export(ids) {
      const rows =
        ids === undefined
          ? await db.songs.toArray()
          : (await db.songs.bulkGet([...ids])).filter(
              (row): row is SongRecord => row !== undefined,
            )
      const songs = rows
        .map((row) => UserSongSchema.parse(row))
        .sort(sortSongs)
      return SongBundleSchema.parse({
        format: 'pdc.songs',
        version: 1,
        songs,
      })
    },
    close() {
      db.close()
    },
  }
}
