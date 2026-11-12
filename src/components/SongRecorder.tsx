import { useEffect, useRef, useState } from 'react'
import { midiNameWithOctave } from '../notation'
import { UserSongSchema, type TimeSignature, type UserSong } from '../schemas'
import { useMidi } from '../midi/context'
import { createSongId } from '../state/song-repository'
import { useSettings } from '../state/settings'
import { measureCountLabel, noteCountLabel } from '../songs/labels'
import {
  recordMidiSong,
  type RecorderGrid,
  type RecordedSongData,
  type RecorderNoteInput,
} from '../songs/recorder'
import { GrandStaff } from './GrandStaff'
import { Keyboard } from './Keyboard'

/**
 * Grabador de canciones con MIDI.
 *
 * La toma se cuantiza en el navegador: no se envía audio ni partituras a
 * ningún servidor. Al detener se muestra el resultado en el gran pentagrama y
 * se puede guardar en la biblioteca local.
 */

export interface SongRecorderProps {
  onSave: (song: UserSong) => Promise<void>
}

const METERS = ['4/4', '3/4', '2/4', '6/8'] as const
const KEYS = [
  'C',
  'G',
  'D',
  'A',
  'E',
  'B',
  'F#',
  'C#',
  'F',
  'Bb',
  'Eb',
  'Ab',
  'Db',
  'Gb',
  'Cb',
] as const
const SPLITS = [48, 55, 60, 64, 67, 72] as const

type RecorderStatus = 'idle' | 'recording' | 'review'

function parseMeter(meter: string): TimeSignature {
  switch (meter) {
    case '3/4':
      return { numerator: 3, denominator: 4 }
    case '2/4':
      return { numerator: 2, denominator: 4 }
    case '6/8':
      return { numerator: 6, denominator: 8 }
    default:
      return { numerator: 4, denominator: 4 }
  }
}

export function SongRecorder({ onSave }: SongRecorderProps) {
  const { settings, t } = useSettings()
  const {
    status: midiStatus,
    events,
    clearEvents,
    subscribe,
  } = useMidi()

  const [title, setTitle] = useState('')
  const [composer, setComposer] = useState('')
  const [tempoBpm, setTempoBpm] = useState(80)
  const [meter, setMeter] = useState<(typeof METERS)[number]>('4/4')
  const [key, setKey] = useState<(typeof KEYS)[number]>('C')
  const [mode, setMode] = useState<'major' | 'minor'>('major')
  const [grid, setGrid] = useState<RecorderGrid>('eighth')
  const [splitMidi, setSplitMidi] = useState<number>(60)
  const [status, setStatus] = useState<RecorderStatus>('idle')
  const [recorded, setRecorded] = useState<RecordedSongData | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const startedAtRef = useRef(0)
  // Buffer propio: `events` del contexto se recorta a 1024 pulsaciones, lo que
  // perdería el comienzo de una toma larga.
  const takeRef = useRef<RecorderNoteInput[]>([])

  useEffect(() => {
    if (status !== 'recording') return
    const id = window.setInterval(() => {
      setElapsed((performance.now() - startedAtRef.current) / 1000)
    }, 200)
    return () => window.clearInterval(id)
  }, [status])

  useEffect(() => {
    if (status !== 'recording') return
    const take = takeRef.current
    return subscribe((event) => {
      take.push(event)
    })
  }, [status, subscribe])

  const start = () => {
    takeRef.current = []
    clearEvents()
    setRecorded(null)
    setError(null)
    setElapsed(0)
    startedAtRef.current = performance.now()
    setStatus('recording')
  }

  const stop = () => {
    const result = recordMidiSong(takeRef.current, {
      tempoBpm,
      timeSignature: parseMeter(meter),
      splitMidi,
      grid,
      key,
      mode,
    })
    setRecorded(result)
    setElapsed((performance.now() - startedAtRef.current) / 1000)
    setStatus('review')
  }

  const discard = () => {
    setRecorded(null)
    setError(null)
    setStatus('idle')
  }

  const save = async () => {
    if (recorded === null) return
    const cleanTitle = title.trim()
    if (cleanTitle.length === 0) {
      setError(t('songs.recorder.titleRequired'))
      return
    }
    const now = new Date().toISOString()
    setSaving(true)
    setError(null)
    try {
      const song = UserSongSchema.parse({
        id: createSongId(),
        title: cleanTitle,
        composer: composer.trim(),
        createdAt: now,
        updatedAt: now,
        tempoBpm,
        timeSignature: parseMeter(meter),
        key,
        mode,
        splitMidi,
        measures: recorded.measures,
        source: 'midi',
        right: recorded.right,
        left: recorded.left,
      })
      await onSave(song)
      setRecorded(null)
      setStatus('idle')
      setTitle('')
      setComposer('')
      setElapsed(0)
    } catch (reason: unknown) {
      setError(
        t('songs.recorder.saveError', {
          message: reason instanceof Error ? reason.message : String(reason),
        }),
      )
    } finally {
      setSaving(false)
    }
  }

  const connected = midiStatus === 'listening'
  const noteCount = events.filter((event) => event.velocity > 0).length

  return (
    <section className="panel song-recorder" aria-labelledby="song-recorder-title">
      <h2 id="song-recorder-title">{t('songs.recorder.title')}</h2>
      <p className="muted">{t('songs.recorder.lead')}</p>

      <div className="settings-grid song-recorder-fields">
        <label className="field">
          <span>{t('songs.recorder.name')}</span>
          <input
            type="text"
            value={title}
            maxLength={120}
            placeholder={t('songs.recorder.namePlaceholder')}
            onChange={(event) => setTitle(event.target.value)}
            disabled={status === 'recording'}
          />
        </label>
        <label className="field">
          <span>{t('songs.recorder.composer')}</span>
          <input
            type="text"
            value={composer}
            maxLength={120}
            onChange={(event) => setComposer(event.target.value)}
            disabled={status === 'recording'}
          />
        </label>
        <label className="field">
          <span>{t('songs.recorder.tempo')}</span>
          <input
            type="number"
            min={20}
            max={300}
            value={tempoBpm}
            onChange={(event) => {
              const value = Number(event.target.value)
              if (Number.isFinite(value)) {
                setTempoBpm(Math.min(300, Math.max(20, Math.round(value))))
              }
            }}
            disabled={status === 'recording'}
          />
        </label>
        <label className="field">
          <span>{t('songs.recorder.meter')}</span>
          <select
            value={meter}
            onChange={(event) =>
              setMeter(event.target.value as (typeof METERS)[number])
            }
            disabled={status === 'recording'}
          >
            {METERS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>{t('songs.recorder.key')}</span>
          <select
            value={key}
            onChange={(event) => setKey(event.target.value as (typeof KEYS)[number])}
            disabled={status === 'recording'}
          >
            {KEYS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>{t('songs.recorder.mode')}</span>
          <select
            value={mode}
            onChange={(event) => setMode(event.target.value === 'minor' ? 'minor' : 'major')}
            disabled={status === 'recording'}
          >
            <option value="major">{t('songs.recorder.mode.major')}</option>
            <option value="minor">{t('songs.recorder.mode.minor')}</option>
          </select>
        </label>
        <label className="field">
          <span>{t('songs.recorder.grid')}</span>
          <select
            value={grid}
            onChange={(event) => setGrid(event.target.value as RecorderGrid)}
            disabled={status === 'recording'}
          >
            <option value="quarter">{t('songs.recorder.grid.quarter')}</option>
            <option value="eighth">{t('songs.recorder.grid.eighth')}</option>
            <option value="sixteenth">{t('songs.recorder.grid.sixteenth')}</option>
          </select>
        </label>
        <label className="field">
          <span>{t('songs.recorder.split')}</span>
          <select
            value={splitMidi}
            onChange={(event) => setSplitMidi(Number(event.target.value))}
            disabled={status === 'recording'}
          >
            {SPLITS.map((midi) => (
              <option key={midi} value={midi}>
                {midiNameWithOctave(midi, settings.notation)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="song-recorder-controls">
        {status === 'idle' ? (
          <button
            type="button"
            className="button-primary"
            onClick={start}
            disabled={!connected}
          >
            {t('songs.recorder.start')}
          </button>
        ) : null}
        {status === 'recording' ? (
          <button type="button" className="button-primary" onClick={stop}>
            {t('songs.recorder.stop')}
          </button>
        ) : null}
        <p className="muted song-recorder-state" aria-live="polite">
          {status === 'recording'
            ? t('songs.recorder.recording', {
                seconds: Math.floor(elapsed),
                notes: noteCount,
              })
            : null}
          {status === 'review' && recorded !== null
            ? t('songs.recorder.review', {
                notes: noteCountLabel(t, recorded.noteCount),
                measures: measureCountLabel(t, recorded.measures),
              })
            : null}
          {status === 'idle' && !connected
            ? t('songs.recorder.connectHint')
            : null}
        </p>
      </div>

      {error !== null ? (
        <p className="staff-error" role="alert">
          {error}
        </p>
      ) : null}

      {status === 'recording' ? (
        <Keyboard
          startMidi={36}
          octaves={4}
          className="song-recorder-keyboard"
        />
      ) : null}

      {status === 'review' && recorded !== null ? (
        <>
          {recorded.noteCount === 0 ? (
            <p className="muted" role="status">
              {t('songs.recorder.empty')}
            </p>
          ) : (
            <GrandStaff
              right={recorded.right}
              left={recorded.left}
              label={title.trim() || t('songs.recorder.preview')}
              className="song-recorder-preview"
            />
          )}
          <div className="song-recorder-actions">
            <button
              type="button"
              className="button-primary"
              onClick={() => void save()}
              disabled={saving || recorded.noteCount === 0}
            >
              {saving ? t('songs.recorder.saving') : t('songs.recorder.save')}
            </button>
            <button type="button" className="button-secondary" onClick={start}>
              {t('songs.recorder.again')}
            </button>
            <button type="button" className="button-secondary" onClick={discard}>
              {t('songs.recorder.discard')}
            </button>
          </div>
        </>
      ) : null}

      <p className="muted song-recorder-hint">
        {t('songs.recorder.local')}
      </p>
    </section>
  )
}
