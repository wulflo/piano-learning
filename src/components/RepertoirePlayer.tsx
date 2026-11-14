import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { AudioEngine, AudioEngineState } from '../audio/engine'
import type { RepertoirePiece } from '../schemas'
import {
  hasPieceHand,
  MAX_TEMPO_PERCENT,
  MIN_TEMPO_PERCENT,
  pieceMeasureCount,
  piecePlayback,
  TEMPO_PERCENT_STEP,
  type PieceHandSelection,
} from '../repertoire/playback'
import { useSettings } from '../state/settings'
import { GrandStaff } from './GrandStaff'

/**
 * F5-023 — Reproductor de una pieza de repertorio.
 *
 * Muestra el gran pentagrama y agrega los controles que faltaban: elegir mano
 * derecha, izquierda o ambas; bajar o subir el tempo entre 50 % y 120 %; acotar
 * un rango de compases y repetirlo en bucle. Al detener se llama a
 * `AudioEngine.stop`, que libera todas las voces y evita notas trabadas.
 *
 * El motor de audio se recibe por props, igual que en `KeyboardTask`, para que
 * la pantalla que lo aloje comparta una sola instancia con el resto de la app.
 */

export interface RepertoirePlayerProps {
  piece: RepertoirePiece
  engine: AudioEngine
  audio: AudioEngineState
  initialHands?: PieceHandSelection
  initialTempoPercent?: number
  initialLoop?: boolean
}

const HAND_LABEL_KEYS: Record<PieceHandSelection, string> = {
  both: 'repertoire.player.hands.both',
  right: 'repertoire.player.hands.right',
  left: 'repertoire.player.hands.left',
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export function RepertoirePlayer({
  piece,
  engine,
  audio,
  initialHands = 'both',
  initialTempoPercent = 100,
  initialLoop = false,
}: RepertoirePlayerProps) {
  const { t } = useSettings()
  const measureCount = Math.max(1, pieceMeasureCount(piece))

  const [hands, setHands] = useState<PieceHandSelection>(initialHands)
  const [tempoPercent, setTempoPercent] = useState(initialTempoPercent)
  const [fromMeasure, setFromMeasure] = useState(1)
  const [toMeasure, setToMeasure] = useState(measureCount)
  const [loop, setLoop] = useState(initialLoop)
  const [playing, setPlaying] = useState(false)
  const [activeNotes, setActiveNotes] = useState<ReadonlyArray<number>>([])
  const [activeIds, setActiveIds] = useState<ReadonlyArray<string>>([])
  const [error, setError] = useState<string | null>(null)

  const playingRef = useRef(playing)
  playingRef.current = playing

  // Al cambiar de pieza se vuelve al rango completo y a la configuración
  // inicial. La identidad de la pieza es su id: el objeto puede cambiar sin
  // que la pieza sea otra.
  useEffect(() => {
    setHands(initialHands)
    setTempoPercent(initialTempoPercent)
    setFromMeasure(1)
    setToMeasure(measureCount)
    setLoop(initialLoop)
    setPlaying(false)
    setActiveNotes([])
    setActiveIds([])
    setError(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [piece.id])

  // Si la selección pedida no existe en esta pieza, cae en la primera mano que
  // sí pueda sonar. Así un enlace guardado con la mano izquierda no rompe una
  // pieza que solo tiene la derecha.
  useEffect(() => {
    if (hasPieceHand(piece, hands)) return
    setHands(hasPieceHand(piece, 'right') ? 'right' : 'left')
  }, [piece, hands])

  // El motor avisa cuando termina o cuando otra pantalla lo detiene. Entonces
  // se apagan el botón y el resaltado, sin dejar notas colgadas.
  useEffect(() => {
    if (!audio.isPlaying) {
      setPlaying(false)
      setActiveNotes([])
      setActiveIds([])
    }
  }, [audio.isPlaying])

  useEffect(() => {
    return () => {
      if (playingRef.current) engine.stop()
    }
  }, [engine])

  const stop = useCallback(() => {
    engine.stop()
    setPlaying(false)
    setActiveNotes([])
    setActiveIds([])
  }, [engine])

  const change = useCallback(
    (apply: () => void) => {
      if (playingRef.current) stop()
      apply()
    },
    [stop],
  )

  const result = useMemo(() => {
    try {
      return {
        playback: piecePlayback(piece, {
          hands,
          tempoPercent,
          fromMeasure,
          toMeasure,
          loop,
        }),
        error: null as string | null,
      }
    } catch (reason: unknown) {
      return { playback: null, error: errorMessage(reason) }
    }
  }, [piece, hands, tempoPercent, fromMeasure, toMeasure, loop])
  const playback = result.playback
  const playbackError = result.error

  const play = () => {
    if (playing) {
      stop()
      return
    }
    if (playback === null) {
      setError(t('repertoire.player.missingHand'))
      return
    }
    setError(null)
    setActiveNotes([])
    setActiveIds([])
    setPlaying(true)
    void engine
      .playTimeline(playback.timeline, {
        repeat: playback.loop,
        duration: playback.duration,
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
          t('repertoire.player.audioError', {
            message: playbackError ?? errorMessage(reason),
          }),
        )
      })
  }

  const handLabel = t(HAND_LABEL_KEYS[hands])
  const summary =
    playback === null
      ? ''
      : t('repertoire.player.summary', {
          hands: handLabel,
          from: playback.fromMeasure,
          to: playback.toMeasure,
          bpm: playback.tempoBpm,
          percent: playback.tempoPercent,
        })

  const chooseFrom = (value: number) => {
    change(() => {
      setFromMeasure(value)
      if (value > toMeasure) setToMeasure(value)
    })
  }

  const chooseTo = (value: number) => {
    change(() => {
      setToMeasure(value)
      if (value < fromMeasure) setFromMeasure(value)
    })
  }

  return (
    <section
      className="panel repertoire-player"
      aria-labelledby="repertoire-player-title"
    >
      <h2 id="repertoire-player-title" className="panel-heading">
        {t('repertoire.player.title')}
      </h2>
      <p className="muted">{piece.title}</p>

      <GrandStaff
        right={piece.hands.right}
        left={piece.hands.left}
        label={piece.title}
        activeNotes={activeNotes}
        activeIds={activeIds}
      />

      <div className="repertoire-player-controls">
        <fieldset>
          <legend>{t('repertoire.player.hands')}</legend>
          {(['both', 'right', 'left'] as const).map((value) => (
            <label key={value} className="checkbox">
              <input
                type="radio"
                name={`repertoire-hands-${piece.id}`}
                value={value}
                checked={hands === value}
                disabled={!hasPieceHand(piece, value)}
                onChange={() => change(() => setHands(value))}
              />
              <span>{t(HAND_LABEL_KEYS[value])}</span>
            </label>
          ))}
        </fieldset>

        <fieldset>
          <legend>{t('repertoire.player.tempo')}</legend>
          <label className="repertoire-tempo">
            <input
              type="range"
              min={MIN_TEMPO_PERCENT}
              max={MAX_TEMPO_PERCENT}
              step={TEMPO_PERCENT_STEP}
              value={tempoPercent}
              aria-label={t('repertoire.player.tempo')}
              aria-valuetext={t('repertoire.player.tempoValue', {
                percent: tempoPercent,
                bpm: playback?.tempoBpm ?? 0,
              })}
              onChange={(event) =>
                change(() => setTempoPercent(Number(event.target.value)))
              }
            />
            <output>
              {t('repertoire.player.tempoValue', {
                percent: tempoPercent,
                bpm: playback?.tempoBpm ?? 0,
              })}
            </output>
          </label>
        </fieldset>

        <fieldset>
          <legend>{t('repertoire.player.measures')}</legend>
          <label>
            {t('repertoire.player.from')}
            <select
              value={fromMeasure}
              onChange={(event) => chooseFrom(Number(event.target.value))}
            >
              {Array.from({ length: measureCount }, (_, index) => index + 1).map(
                (measure) => (
                  <option key={measure} value={measure}>
                    {measure}
                  </option>
                ),
              )}
            </select>
          </label>
          <label>
            {t('repertoire.player.to')}
            <select
              value={toMeasure}
              onChange={(event) => chooseTo(Number(event.target.value))}
            >
              {Array.from({ length: measureCount }, (_, index) => index + 1).map(
                (measure) => (
                  <option key={measure} value={measure}>
                    {measure}
                  </option>
                ),
              )}
            </select>
          </label>
        </fieldset>

        <label className="checkbox">
          <input
            type="checkbox"
            checked={loop}
            onChange={(event) =>
              change(() => setLoop(event.target.checked))
            }
          />
          <span>{t('repertoire.player.loop')}</span>
        </label>

        <button
          type="button"
          className="button"
          onClick={play}
          disabled={playback === null}
        >
          {playing
            ? t('repertoire.player.stop')
            : t('repertoire.player.play')}
        </button>
      </div>

      <p className="muted" role="status" aria-live="polite">
        {summary}
      </p>

      {error !== null ? (
        <p role="alert" className="staff-error">
          {error}
        </p>
      ) : null}
    </section>
  )
}
