import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  SongBundle,
  SongRecord,
  UserSong,
} from '../schemas'
import {
  createSongRepository,
  type SongRepository,
} from './song-repository'
import { createSongsDatabase } from './songs-db'

/**
 * Acceso a la biblioteca de canciones del usuario.
 *
 * Abre una base propia (`pianodesdecero.songs`) al montar y la cierra al
 * desmontar. Las operaciones actualizan la lista en memoria después de escribir,
 * sin que la pantalla tenga que volver a consultar la base por su cuenta.
 */

export type SongsStatus = 'loading' | 'ready' | 'error'

export interface SongsState {
  status: SongsStatus
  songs: SongRecord[]
  error: Error | null
  save(song: UserSong): Promise<SongRecord>
  remove(id: string): Promise<void>
  importData(data: unknown): Promise<SongRecord[]>
  exportSongs(ids?: readonly string[]): Promise<SongBundle>
  reload: () => void
}

function toError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value))
}

export function useSongs(databaseName?: string): SongsState {
  const [attempt, setAttempt] = useState(0)
  const [status, setStatus] = useState<SongsStatus>('loading')
  const [songs, setSongs] = useState<SongRecord[]>([])
  const [error, setError] = useState<Error | null>(null)

  const repositoryRef = useRef<SongRepository | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    setStatus('loading')
    setError(null)

    const repository = createSongRepository(
      createSongsDatabase(
        databaseName === undefined ? {} : { name: databaseName },
      ),
    )
    repositoryRef.current = repository

    repository.list().then(
      (rows) => {
        if (!mountedRef.current) return
        setSongs(rows)
        setStatus('ready')
      },
      (reason: unknown) => {
        if (!mountedRef.current) return
        setError(toError(reason))
        setStatus('error')
      },
    )

    return () => {
      mountedRef.current = false
      repositoryRef.current = null
      repository.close()
    }
  }, [attempt, databaseName])

  const refresh = useCallback(async () => {
    const repository = repositoryRef.current
    if (repository === null) return
    setSongs(await repository.list())
  }, [])

  const save = useCallback(
    async (song: UserSong) => {
      const repository = repositoryRef.current
      if (repository === null) throw new Error('La biblioteca todavía no está lista')
      const saved = await repository.save(song)
      await refresh()
      return saved
    },
    [refresh],
  )

  const remove = useCallback(
    async (id: string) => {
      const repository = repositoryRef.current
      if (repository === null) throw new Error('La biblioteca todavía no está lista')
      await repository.remove(id)
      await refresh()
    },
    [refresh],
  )

  const importData = useCallback(
    async (data: unknown) => {
      const repository = repositoryRef.current
      if (repository === null) throw new Error('La biblioteca todavía no está lista')
      const imported = await repository.import(data)
      await refresh()
      return imported
    },
    [refresh],
  )

  const exportSongs = useCallback(async (ids?: readonly string[]) => {
    const repository = repositoryRef.current
    if (repository === null) throw new Error('La biblioteca todavía no está lista')
    return repository.export(ids)
  }, [])

  const reload = useCallback(() => {
    setAttempt((current) => current + 1)
  }, [])

  return {
    status,
    songs,
    error,
    save,
    remove,
    importData,
    exportSongs,
    reload,
  }
}
