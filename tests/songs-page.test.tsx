import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MidiStatusBar } from '../src/components/MidiStatusBar'
import { MidiProvider } from '../src/midi/context'
import { SongsPage } from '../src/pages/SongsPage'
import { UserSongSchema, type UserSong } from '../src/schemas'
import { createSongRepository } from '../src/state/song-repository'
import { createSongsDatabase } from '../src/state/songs-db'
import { SettingsProvider } from '../src/state/settings'
import { recordMidiSong } from '../src/songs/recorder'
import {
  installFakeMidi,
  NOTE_OFF,
  NOTE_ON,
  type FakeMidi,
} from './helpers/fake-midi'

let fake: FakeMidi
let databaseCounter = 0

function uniqueDatabaseName(): string {
  databaseCounter += 1
  return `pdc.test.songs-page.${databaseCounter}`
}

function renderPage(databaseName: string) {
  return render(
    <SettingsProvider>
      <MidiProvider>
        <MidiStatusBar />
        <SongsPage databaseName={databaseName} />
      </MidiProvider>
    </SettingsProvider>,
  )
}

function song(): UserSong {
  const recorded = recordMidiSong(
    [
      { note: 60, velocity: 80, timestamp: 0 },
      { note: 60, velocity: 0, timestamp: 500 },
    ],
    { tempoBpm: 80, timeSignature: { numerator: 4, denominator: 4 } },
  )
  return UserSongSchema.parse({
    id: 'song.test.seed',
    title: 'Canción guardada',
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
    left: recorded.left,
  })
}

beforeEach(() => {
  fake = installFakeMidi()
})

afterEach(() => {
  fake.restore()
})

describe('página de canciones', () => {
  it('graba con MIDI, muestra la toma y la guarda en la biblioteca', async () => {
    renderPage(uniqueDatabaseName())
    await screen.findByText(/Todavía no hay canciones guardadas/)

    fireEvent.click(
      screen.getByRole('button', { name: 'Conectar teclado MIDI' }),
    )
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Grabar' })).toBeEnabled(),
    )

    fireEvent.change(screen.getByLabelText('Título'), {
      target: { value: 'Mi grabación' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Grabar' }))

    const input = fake.inputs.get('in-1')
    expect(input).toBeDefined()
    act(() => {
      input?.emit([NOTE_ON, 60, 90], 1000)
      input?.emit([NOTE_OFF, 60, 0], 1400)
      input?.emit([NOTE_ON, 64, 90], 1600)
      input?.emit([NOTE_OFF, 64, 0], 2000)
    })

    fireEvent.click(screen.getByRole('button', { name: 'Detener' }))
    await screen.findByText(/Toma grabada/)
    await waitFor(() =>
      expect(
        document.querySelectorAll('.song-recorder-preview svg'),
      ).toHaveLength(1),
    )
    expect(
      document.querySelectorAll('.song-recorder-preview [data-grand-note]'),
    ).toHaveLength(2)

    fireEvent.click(screen.getByRole('button', { name: 'Guardar canción' }))
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { level: 3, name: 'Mi grabación' }),
      ).toBeInTheDocument(),
    )
    expect(screen.getAllByText(/1 compás/).length).toBeGreaterThan(0)
    expect(screen.getByText('Canción guardada.')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 2, name: 'Mi grabación' }),
    ).toBeInTheDocument()
  })

  it('lee la biblioteca guardada y abre una canción', async () => {
    const name = uniqueDatabaseName()
    const repository = createSongRepository(
      createSongsDatabase({ name }),
    )
    await repository.save(song())
    repository.close()

    renderPage(name)
    await screen.findByRole('heading', { level: 3, name: 'Canción guardada' })

    fireEvent.click(screen.getByRole('button', { name: 'Abrir' }))
    expect(
      await screen.findByRole('heading', { level: 2, name: 'Canción guardada' }),
    ).toBeInTheDocument()
    await waitFor(() =>
      expect(
        document.querySelectorAll('.song-player-staff [data-grand-note]'),
      ).toHaveLength(1),
    )
  })

  it('importa un archivo pdc.songs y lo agrega a la biblioteca', async () => {
    renderPage(uniqueDatabaseName())
    await screen.findByText(/Todavía no hay canciones guardadas/)

    const file = new File(
      [
        JSON.stringify({
          format: 'pdc.songs',
          version: 1,
          songs: [song()],
        }),
      ],
      'canciones.json',
      { type: 'application/json' },
    )
    fireEvent.change(document.querySelector('input[type="file"]')!, {
      target: { files: [file] },
    })

    expect(
      await screen.findByRole('heading', { level: 3, name: 'Canción guardada' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Se importaron 1 canción.')).toBeInTheDocument()
  })

  it('avisa cuando el archivo importado no es válido', async () => {
    renderPage(uniqueDatabaseName())
    await screen.findByText(/Todavía no hay canciones guardadas/)

    const file = new File([JSON.stringify({ title: 'sin id' })], 'roto.json', {
      type: 'application/json',
    })
    fireEvent.change(document.querySelector('input[type="file"]')!, {
      target: { files: [file] },
    })

    expect(
      await screen.findByText(/El archivo no es una canción válida/),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { level: 3, name: 'Canción guardada' }),
    ).not.toBeInTheDocument()
  })
})
