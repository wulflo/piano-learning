import { useRef, useState } from 'react'
import { useAudioEngine } from '../audio/useAudioEngine'
import { SongPlayer } from '../components/SongPlayer'
import { SongRecorder } from '../components/SongRecorder'
import type { SongRecord, UserSong } from '../schemas'
import { useSettings } from '../state/settings'
import { useSongs } from '../state/use-songs'
import { measureCountLabel, songCountLabel } from '../songs/labels'

/**
 * Biblioteca de canciones propias y grabador MIDI.
 *
 * La lista y el reproductor viven en la misma página: al guardar una toma se
 * selecciona automáticamente para escucharla y comprobar que quedó bien. Los
 * archivos se pueden exportar e importar como JSON sin pasar por un servidor.
 */

function downloadJson(filename: string, value: unknown): void {
  const blob = new Blob([JSON.stringify(value, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  // Revocar enseguida puede cancelar la descarga en algunos navegadores.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'cancion'
  )
}

export interface SongsPageProps {
  /** Nombre de la base de canciones; los tests usan uno aislado. */
  databaseName?: string
}

export function SongsPage({ databaseName }: SongsPageProps = {}) {
  const { settings, t } = useSettings()
  const { engine, state: audio } = useAudioEngine()
  const { status, songs, error, save, remove, importData, exportSongs, reload } =
    useSongs(databaseName)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const selected = songs.find((song) => song.id === selectedId) ?? null

  const handleSave = async (song: UserSong) => {
    await save(song)
    setSelectedId(song.id)
    setActionError(null)
    setNotice(t('songs.recorder.saved'))
  }

  const handleDelete = async (song: SongRecord) => {
    if (!window.confirm(t('songs.delete.confirm', { title: song.title }))) return
    try {
      await remove(song.id)
      if (selectedId === song.id) setSelectedId(null)
      setActionError(null)
      setNotice(t('songs.delete.done'))
    } catch (reason: unknown) {
      setActionError(
        t('songs.actionError', {
          message: reason instanceof Error ? reason.message : String(reason),
        }),
      )
    }
  }

  const handleExport = async (song?: SongRecord) => {
    try {
      const bundle = await exportSongs(song === undefined ? undefined : [song.id])
      downloadJson(
        song === undefined
          ? 'canciones-piano-today.json'
          : `${slugify(song.title)}.pdc-song.json`,
        bundle,
      )
      setActionError(null)
    } catch (reason: unknown) {
      setActionError(
        t('songs.actionError', {
          message: reason instanceof Error ? reason.message : String(reason),
        }),
      )
    }
  }

  const handleImport = async (file: File) => {
    try {
      const data: unknown = JSON.parse(await file.text())
      const imported = await importData(data)
      setActionError(null)
      setNotice(t('songs.import.done', { songs: songCountLabel(t, imported.length) }))
    } catch (reason: unknown) {
      setNotice(null)
      setActionError(
        t('songs.import.error', {
          message: reason instanceof Error ? reason.message : String(reason),
        }),
      )
    } finally {
      if (fileRef.current !== null) fileRef.current.value = ''
    }
  }

  const formatDate = (iso: string): string => {
    const date = new Date(iso)
    return Number.isNaN(date.getTime())
      ? iso
      : date.toLocaleDateString(settings.language, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
  }

  return (
    <main className="page songs-page" aria-labelledby="songs-title">
      <header className="hero">
        <p className="eyebrow">{t('songs.eyebrow')}</p>
        <h1 id="songs-title">{t('songs.title')}</h1>
        <p className="lede">{t('songs.lead')}</p>
      </header>

      <SongRecorder onSave={handleSave} />

      <section
        className="panel songs-library"
        aria-labelledby="songs-library-title"
      >
        <div className="panel-heading">
          <h2 id="songs-library-title">{t('songs.library.title')}</h2>
          <div className="songs-toolbar">
            <button
              type="button"
              className="button-secondary"
              onClick={() => fileRef.current?.click()}
            >
              {t('songs.import')}
            </button>
            <button
              type="button"
              className="button-secondary"
              onClick={() => void handleExport()}
              disabled={songs.length === 0}
            >
              {t('songs.export.all')}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file !== undefined) void handleImport(file)
              }}
            />
          </div>
        </div>

        {status === 'loading' ? (
          <p className="muted">{t('songs.library.loading')}</p>
        ) : null}

        {status === 'error' ? (
          <div>
            <p className="staff-error" role="alert">
              {t('songs.library.error', {
                message: error?.message ?? '',
              })}
            </p>
            <button type="button" className="button-secondary" onClick={reload}>
              {t('songs.retry')}
            </button>
          </div>
        ) : null}

        {status === 'ready' && songs.length === 0 ? (
          <p className="muted">{t('songs.library.empty')}</p>
        ) : null}

        {songs.length > 0 ? (
          <ul className="songs-list">
            {songs.map((song) => (
              <li key={song.id} className="song-card">
                <div>
                  <h3>{song.title}</h3>
                  <p className="muted">
                    {t('songs.song.meta', {
                      measures: measureCountLabel(t, song.measures),
                      bpm: song.tempoBpm,
                      meter: `${song.timeSignature.numerator}/${song.timeSignature.denominator}`,
                    })}
                    {song.composer.length > 0 ? ` · ${song.composer}` : ''}
                  </p>
                  <p className="muted">
                    {t('songs.song.updated', {
                      date: formatDate(song.updatedAt),
                    })}
                  </p>
                </div>
                <div className="songs-actions">
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={() =>
                      setSelectedId((current) =>
                        current === song.id ? null : song.id,
                      )
                    }
                  >
                    {selectedId === song.id
                      ? t('songs.song.close')
                      : t('songs.song.open')}
                  </button>
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={() => void handleExport(song)}
                  >
                    {t('songs.song.export')}
                  </button>
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={() => void handleDelete(song)}
                  >
                    {t('songs.song.delete')}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : null}

        {notice !== null ? (
          <p className="muted" role="status">
            {notice}
          </p>
        ) : null}
        {actionError !== null ? (
          <p className="staff-error" role="alert">
            {actionError}
          </p>
        ) : null}
      </section>

      {selected !== null ? (
        <SongPlayer song={selected} engine={engine} audio={audio} />
      ) : null}
    </main>
  )
}
