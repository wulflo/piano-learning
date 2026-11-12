import { describe, expect, it } from 'vitest'
import { UserSongSchema, type UserSong } from '../src/schemas'
import {
  createSongId,
  createSongRepository,
} from '../src/state/song-repository'
import { createSongsDatabase } from '../src/state/songs-db'
import { recordMidiSong } from '../src/songs/recorder'

let databaseCounter = 0

function uniqueDatabaseName(): string {
  databaseCounter += 1
  return `pdc.test.songs.${databaseCounter}`
}

function makeSong(overrides: Partial<UserSong> = {}): UserSong {
  const recorded = recordMidiSong(
    [
      { note: 60, velocity: 80, timestamp: 0 },
      { note: 60, velocity: 0, timestamp: 500 },
    ],
    { tempoBpm: 80, timeSignature: { numerator: 4, denominator: 4 } },
  )
  return UserSongSchema.parse({
    id: 'song.test.one',
    title: 'Canción de prueba',
    composer: '',
    createdAt: '2026-11-14T10:00:00.000Z',
    updatedAt: '2026-11-14T10:00:00.000Z',
    tempoBpm: 80,
    timeSignature: { numerator: 4, denominator: 4 },
    key: 'C',
    mode: 'major',
    splitMidi: 60,
    measures: recorded.measures,
    source: 'midi',
    right: recorded.right,
    ...overrides,
  })
}

describe('repositorio de canciones', () => {
  it('crea IDs válidos y ordena por fecha de edición', async () => {
    expect(createSongId(0, () => 0)).toMatch(/^song\.[a-z0-9]+\.[a-z0-9]{6}$/)

    const repository = createSongRepository(
      createSongsDatabase({ name: uniqueDatabaseName() }),
    )
    await repository.save(makeSong())
    await repository.save(
      makeSong({
        id: 'song.test.two',
        title: 'Otra',
        updatedAt: '2026-11-15T10:00:00.000Z',
      }),
    )

    const songs = await repository.list()
    expect(songs.map((song) => song.id)).toEqual([
      'song.test.two',
      'song.test.one',
    ])
    repository.close()
  })

  it('guarda, lee, exporta e importa canciones', async () => {
    const repository = createSongRepository(
      createSongsDatabase({ name: uniqueDatabaseName() }),
    )
    const song = makeSong()
    await repository.save(song)

    expect(await repository.get(song.id)).toMatchObject({
      title: song.title,
      right: song.right,
    })

    const bundle = await repository.export()
    expect(bundle).toMatchObject({ format: 'pdc.songs', version: 1 })
    expect(bundle.songs).toHaveLength(1)

    await repository.remove(song.id)
    expect(await repository.list()).toEqual([])

    const imported = await repository.import(bundle)
    expect(imported).toHaveLength(1)
    expect(await repository.list()).toHaveLength(1)

    await repository.clear()
    expect(await repository.list()).toEqual([])
    repository.close()
  })

  it('acepta una canción suelta y rechaza archivos inválidos', async () => {
    const repository = createSongRepository(
      createSongsDatabase({ name: uniqueDatabaseName() }),
    )
    const song = makeSong({ id: 'song.test.single' })
    await repository.import(song)
    expect(await repository.get('song.test.single')).toBeDefined()

    await expect(repository.import({ title: 'sin id' })).rejects.toThrow()
    repository.close()
  })
})
