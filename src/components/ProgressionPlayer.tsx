import { useEffect, useMemo, useRef, useState } from 'react'
import type { AudioEngine, AudioEngineState } from '../audio/engine'
import {
  CHORD_STYLES,
  MAX_TEMPO,
  MIN_TEMPO,
  type ChordStyle,
} from '../audio/notes'
import { buildProgressionPlayback } from '../exercises/progression-playback'
import type { Key } from '../schemas'
import { useSettings } from '../state/settings'
import { VoiceLeadingPanel } from './VoiceLeadingPanel'

/**
 * Reproductor de progresiones para practicar después de responder.
 *
 * El alumno elige el voicing (bloque, arpegios o bajo + acorde), el tempo y
 * si quiere bucle; el módulo `progression-playback` arma un timeline donde
 * cada acorde ocupa su hueco y la pausa final evita notas trabadas al repetir.
 * No consume las repeticiones del dictado: es una práctica libre.
 */

export interface ProgressionPlayerProps {
  degrees: readonly string[]
  keyTonic: Key
  mode: 'major' | 'minor'
  engine: AudioEngine
  audio: AudioEngineState
}

export function ProgressionPlayer({
  degrees,
  keyTonic,
  mode,
  engine,
  audio,
}: ProgressionPlayerProps) {
  const { settings, t } = useSettings()
  const [style, setStyle] = useState<ChordStyle>('block')
  const [tempo, setTempo] = useState(() => settings.tempo)
  const [loop, setLoop] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [chordLabel, setChordLabel] = useState<string | null>(null)
  const playingRef = useRef(false)
  playingRef.current = playing

  const playback = useMemo(
    () => buildProgressionPlayback(degrees, keyTonic, mode, { style, tempo }),
    [degrees, keyTonic, mode, style, tempo],
  )
  const voiceLeadingChords = useMemo(
    () =>
      playback.chords.map((chord) => ({
        label: chord.numeral,
        midis: chord.midis,
      })),
    [playback],
  )

  // Si la secuencia termina sola (sin bucle) o la detiene otro control, el
  // botón vuelve a «Reproducir» y se limpia el acorde resaltado.
  useEffect(() => {
    if (!audio.isPlaying) {
      setPlaying(false)
      setChordLabel(null)
    }
  }, [audio.isPlaying])

  // Cambiar el voicing o el tempo mientras suena reinicia la pasada con los
  // nuevos ajustes; el motor detiene la secuencia anterior por nosotros.
  useEffect(() => {
    if (!playing) return
    setChordLabel(null)
    void engine
      .playTimeline(playback.timeline, {
        repeat: loop,
        duration: playback.duration,
        onEvent: (event) => setChordLabel(event.label ?? null),
      })
      .catch(() => {
        setPlaying(false)
        setChordLabel(null)
      })
  }, [engine, playback, playing, loop])

  // Al salir del ejercicio, la secuencia se detiene para no dejar notas
  // sonando (notas trabadas) mientras se navega a otra pantalla.
  useEffect(() => {
    return () => {
      if (playingRef.current) engine.stopSequence()
    }
  }, [engine])

  const toggle = () => {
    if (playing) {
      engine.stopSequence()
      setPlaying(false)
      setChordLabel(null)
      return
    }
    setPlaying(true)
  }

  return (
    <section
      className="progression-player"
      aria-label={t('lesson.exercise.progressionPlayer')}
    >
      <p className="muted">{t('lesson.exercise.progressionPlayerHint')}</p>
      <div className="exercise-audio-actions">
        <button type="button" className="button-secondary" onClick={toggle}>
          {playing
            ? t('lesson.exercise.progressionStop')
            : t('lesson.exercise.progressionPlay')}
        </button>
        <label className="exercise-chord-style">
          <span>{t('lesson.exercise.chordStyle')}</span>
          <select
            value={style}
            onChange={(event) => setStyle(event.target.value as ChordStyle)}
          >
            {CHORD_STYLES.map((option) => (
              <option key={option} value={option}>
                {t(`lesson.exercise.chordStyle.${option}`)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="progression-tempo">
        <span>{t('lesson.exercise.progressionTempo', { tempo })}</span>
        <input
          type="range"
          min={MIN_TEMPO}
          max={MAX_TEMPO}
          step={1}
          value={tempo}
          onChange={(event) => setTempo(Number(event.target.value))}
          aria-label={t('lesson.exercise.progressionTempo', { tempo })}
        />
      </label>
      <label className="checkbox">
        <input
          type="checkbox"
          checked={loop}
          onChange={(event) => setLoop(event.target.checked)}
        />
        <span>{t('lesson.exercise.progressionLoop')}</span>
      </label>
      <p className="progression-chord" aria-live="polite">
        {t('lesson.exercise.progressionCurrent', {
          numeral: chordLabel ?? '—',
        })}
      </p>
      <VoiceLeadingPanel chords={voiceLeadingChords} />
    </section>
  )
}
