import { useEffect, useMemo, useRef, useState } from 'react'
import type { AudioEngine, AudioEngineState } from '../audio/engine'
import { timelineDuration } from '../audio/notes'
import { scoreToTimeline } from '../content/score'
import type { UserSong } from '../schemas'
import { useSettings } from '../state/settings'
import { measureCountLabel } from '../songs/labels'
import { GrandStaff } from './GrandStaff'

/**
 * Reproductor de una canción propia.
 *
 * Reutiliza el gran pentagrama y el motor de audio de la app. El resaltado de
 * las notas sigue a `playTimeline`, igual que en el repertorio y las lecciones.
 */

export interface SongPlayerProps {
  song: UserSong
  engine: AudioEngine
  audio: AudioEngineState
}

export function SongPlayer({ song, engine, audio }: SongPlayerProps) {
  const { t } = useSettings()
  const [playing, setPlaying] = useState(false)
  const [activeNotes, setActiveNotes] = useState<ReadonlyArray<number>>([])
  const [activeIds, setActiveIds] = useState<ReadonlyArray<string>>([])
  const [error, setError] = useState<string | null>(null)
  const playingRef = useRef(false)
  playingRef.current = playing

  const timeline = useMemo(() => {
    const events = [
      ...(song.right === undefined
        ? []
        : scoreToTimeline(song.right, song.tempoBpm)),
      ...(song.left === undefined
        ? []
        : scoreToTimeline(song.left, song.tempoBpm)),
    ]
    return events.sort((a, b) => a.time - b.time)
  }, [song])

  useEffect(() => {
    if (!audio.isPlaying) {
      setPlaying(false)
      setActiveNotes([])
      setActiveIds([])
    }
  }, [audio.isPlaying])

  useEffect(() => {
    engine.stop()
    setPlaying(false)
    setActiveNotes([])
    setActiveIds([])
    setError(null)
  }, [song.id, engine])

  useEffect(() => {
    return () => {
      if (playingRef.current) engine.stop()
    }
  }, [engine])

  const stop = () => {
    engine.stop()
    setPlaying(false)
    setActiveNotes([])
    setActiveIds([])
  }

  const play = () => {
    if (playing) {
      stop()
      return
    }
    if (timeline.length === 0) {
      setError(t('songs.player.empty'))
      return
    }
    setError(null)
    setActiveNotes([])
    setActiveIds([])
    setPlaying(true)
    void engine
      .playTimeline(timeline, {
        duration: timelineDuration(timeline),
        onActive: (active) => {
          setActiveNotes(active.midis)
          setActiveIds(active.labels)
        },
      })
      .catch((reason: unknown) => {
        setPlaying(false)
        setActiveNotes([])
        setActiveIds([])
        setError(
          t('songs.player.audioError', {
            message: reason instanceof Error ? reason.message : String(reason),
          }),
        )
      })
  }

  return (
    <section className="song-player" aria-labelledby="song-player-title">
      <div className="panel-heading">
        <h2 id="song-player-title">{song.title}</h2>
        <button
          type="button"
          className="button-primary"
          onClick={play}
          disabled={timeline.length === 0}
        >
          {playing ? t('songs.player.stop') : t('songs.player.play')}
        </button>
      </div>
      {song.composer.length > 0 ? (
        <p className="muted">{song.composer}</p>
      ) : null}
      <p className="muted">
        {t('songs.song.meta', {
          measures: measureCountLabel(t, song.measures),
          bpm: song.tempoBpm,
          meter: `${song.timeSignature.numerator}/${song.timeSignature.denominator}`,
        })}
      </p>
      <GrandStaff
        right={song.right}
        left={song.left}
        label={song.title}
        activeNotes={activeNotes}
        activeIds={activeIds}
        className="song-player-staff"
      />
      {error !== null ? (
        <p className="staff-error" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  )
}
