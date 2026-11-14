import { useEffect, useMemo, useState } from 'react'
import {
  CHORD_STYLES,
  chordTimeline,
  intervalTimeline,
  noteTimeline,
  scaleTimeline,
  type ChordStyle,
} from '../audio/notes'
import { useAudioEngine } from '../audio/useAudioEngine'
import { Keyboard } from './Keyboard'
import { LoadForecastPanel } from './LoadForecastPanel'
import { SettingsPanel } from './SettingsPanel'
import { Staff } from './Staff'
import { midiNameWithOctave, pitchName } from '../notation'
import { useSettings } from '../state/settings'
import {
  CHORD_DEFINITIONS,
  CHORD_QUALITIES,
  chordPitches,
  type ChordQuality,
} from '../theory/chords'
import {
  intervalBetween,
  intervalName,
  transposeInterval,
  type IntervalQuality,
} from '../theory/intervals'
import { midiOf, parsePitch, type Pitch } from '../theory/pitch'
import {
  SCALE_MODES,
  scaleName,
  scalePitches,
  type ScaleMode,
} from '../theory/scales'
import type { StaffMeasure } from './Staff'
import { fingeringFor, type FingerAssignment, type Hand } from '../keyboard/fingering'

type DemoMode = 'note' | 'scale' | 'interval' | 'chord'

const ROOT_OPTIONS = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'] as const

const INTERVAL_OPTIONS: ReadonlyArray<{
  id: string
  number: number
  quality: IntervalQuality
}> = [
  { id: 'm2', number: 2, quality: 'minor' },
  { id: 'M2', number: 2, quality: 'major' },
  { id: 'm3', number: 3, quality: 'minor' },
  { id: 'M3', number: 3, quality: 'major' },
  { id: 'P4', number: 4, quality: 'perfect' },
  { id: 'A4', number: 4, quality: 'augmented' },
  { id: 'P5', number: 5, quality: 'perfect' },
  { id: 'm6', number: 6, quality: 'minor' },
  { id: 'M6', number: 6, quality: 'major' },
  { id: 'm7', number: 7, quality: 'minor' },
  { id: 'M7', number: 7, quality: 'major' },
  { id: 'P8', number: 8, quality: 'perfect' },
]

const CHORD_PRESETS: ChordQuality[] = [
  'major',
  'minor',
  'diminished',
  'augmented',
  'major7',
  'dominant7',
  'minor7',
  'half-diminished7',
  'diminished7',
  'major9',
  'dominant9',
  'minor9',
]

function scaleNotesForPlayback(
  root: Pitch,
  mode: ScaleMode,
  direction: 'ascending' | 'descending',
): Pitch[] {
  const ascending = scalePitches(root, mode, {
    direction: mode === 'melodic-minor' ? direction : 'ascending',
  })
  if (direction === 'descending' && mode !== 'melodic-minor') {
    return [...ascending].reverse()
  }
  return ascending
}

export function Demo() {
  const { settings, t } = useSettings()
  const { engine, state: audio } = useAudioEngine()

  const [mode, setMode] = useState<DemoMode>('scale')
  const [root, setRoot] = useState<(typeof ROOT_OPTIONS)[number]>('C')
  const [scaleMode, setScaleMode] = useState<ScaleMode>('major')
  const [direction, setDirection] = useState<'ascending' | 'descending'>('ascending')
  const [intervalId, setIntervalId] = useState('M3')
  const [intervalMode, setIntervalMode] = useState<'melodic' | 'harmonic'>('melodic')
  const [chordQuality, setChordQuality] = useState<ChordQuality>('major')
  const [chordStyle, setChordStyle] = useState<ChordStyle>('block')
  const [repeat, setRepeat] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [beat, setBeat] = useState<number | null>(null)
  const [hand, setHand] = useState<Hand>('right')

  useEffect(() => {
    engine.setVolume(settings.volumeDb)
  }, [engine, settings.volumeDb])

  useEffect(() => {
    engine.setTempo(settings.tempo)
  }, [engine, settings.tempo])

  const rootPitch = useMemo(() => parsePitch(`${root}4`), [root])
  const intervalOption =
    INTERVAL_OPTIONS.find((option) => option.id === intervalId) ?? INTERVAL_OPTIONS[3]

  const pitches = useMemo(() => {
    if (mode === 'note') return [rootPitch]
    if (mode === 'scale') return scaleNotesForPlayback(rootPitch, scaleMode, direction)
    if (mode === 'interval') {
      return [
        rootPitch,
        transposeInterval(rootPitch, intervalOption.number, intervalOption.quality),
      ]
    }
    return chordPitches(rootPitch, chordQuality)
  }, [mode, rootPitch, scaleMode, direction, intervalOption, chordQuality])

  const selectionName = useMemo(() => {
    if (mode === 'note') return pitchName(rootPitch, settings.notation)
    if (mode === 'scale') return scaleName(scaleMode, settings.language)
    if (mode === 'interval') {
      return intervalName(
        intervalBetween(rootPitch, pitches[1] ?? rootPitch),
        settings.language,
      )
    }
    const definition = CHORD_DEFINITIONS[chordQuality]
    return settings.language === 'es' ? definition.nameEs : definition.nameEn
  }, [mode, rootPitch, settings.notation, settings.language, scaleMode, pitches, chordQuality])

  const notesText = useMemo(
    () => pitches.map((pitch) => midiNameWithOctave(midiOf(pitch), settings.notation)).join(' · '),
    [pitches, settings.notation],
  )

  const fingering = useMemo<FingerAssignment[]>(() => {
    if (mode === 'note') {
      return fingeringFor([midiOf(rootPitch)], { mode: 'note', hand })
    }
    if (mode === 'scale') {
      const ascending = scalePitches(rootPitch, scaleMode)
      return fingeringFor(ascending.map((pitch) => midiOf(pitch)), { mode: 'scale', hand })
    }
    if (mode === 'interval') {
      const lowerMidi = midiOf(rootPitch)
      const upperMidi = midiOf(pitches[1] ?? rootPitch)
      return fingeringFor([lowerMidi, upperMidi], {
        mode: 'interval',
        hand,
        intervalNumber: intervalOption.number,
      })
    }
    return fingeringFor(pitches.map((pitch) => midiOf(pitch)), { mode: 'chord', hand })
  }, [mode, rootPitch, scaleMode, hand, pitches, intervalOption.number])

  const staffMeasures = useMemo<StaffMeasure[]>(() => {
    if (mode === 'chord') {
      return [{ id: 'chord', pitches, duration: 'h' }]
    }
    return pitches.map((pitch, index) => ({
      id: `note-${index}`,
      pitches: [pitch],
      duration: 'q',
    }))
  }, [mode, pitches])

  const playMidis = (midis: number[]) => {
    if (midis.length === 0) return
    const timeline =
      midis.length > 1
        ? chordTimeline(midis, { tempo: settings.tempo, style: 'block', noteBeats: 1 })
        : noteTimeline(midis[0], { tempo: settings.tempo, beats: 1 })
    void engine.playTimeline(timeline).catch(() => undefined)
  }

  const playSelection = () => {
    let timeline
    if (mode === 'note') {
      timeline = noteTimeline(midiOf(rootPitch), { tempo: settings.tempo, beats: 1 })
    } else if (mode === 'scale') {
      timeline = scaleTimeline(pitches.map(midiOf), {
        tempo: settings.tempo,
        noteBeats: 0.5,
      })
    } else if (mode === 'interval') {
      timeline = intervalTimeline(midiOf(rootPitch), midiOf(pitches[1]), {
        tempo: settings.tempo,
        mode: intervalMode,
        beats: 1,
      })
    } else {
      timeline = chordTimeline(pitches.map(midiOf), {
        tempo: settings.tempo,
        style: chordStyle,
        noteBeats: 1,
      })
    }
    void engine.playTimeline(timeline, { repeat }).catch(() => undefined)
  }

  const toggleMetronome = () => {
    if (audio.isMetronome) {
      engine.stopMetronome()
      setBeat(null)
      return
    }
    setBeat(1)
    void engine
      .startMetronome({
        tempo: settings.tempo,
        beatsPerMeasure: 4,
        onBeat: (value) => setBeat((value % 4) + 1),
      })
      .catch(() => undefined)
  }

  const activateAudio = () => {
    void engine.ensureStarted().catch(() => undefined)
  }

  const audioMessage =
    audio.status === 'idle'
      ? t('demo.audio.idle')
      : audio.status === 'starting'
        ? t('demo.audio.starting')
        : audio.status === 'error'
          ? t('demo.audio.error', { message: audio.error ?? '' })
          : t(audio.mode === 'sampler' ? 'demo.audio.ready.sampler' : 'demo.audio.ready.synth')

  return (
    <main>
      <section className="hero" aria-labelledby="hero-title">
        <p className="eyebrow">{t('demo.title')}</p>
        <h1 id="hero-title">{t('demo.lead')}</h1>
        <p className="muted">{t('demo.hint')}</p>
      </section>

      <section className="panel demo-panel" aria-labelledby="demo-title">
        <div className="panel-heading">
          <h2 id="demo-title">{t('demo.mode')}</h2>
          <p className="muted">{t('demo.audio.title')}: {audioMessage}</p>
        </div>

        <div className="audio-status" role="status" aria-live="polite">
          {audio.status === 'error' ? (
            <span className="audio-error">{audioMessage}</span>
          ) : (
            <span>{audioMessage}</span>
          )}
          {audio.status === 'idle' && (
            <button type="button" className="button-secondary" onClick={activateAudio}>
              {t('demo.audio.activate')}
            </button>
          )}
          {audio.status === 'error' && (
            <button type="button" className="button-secondary" onClick={activateAudio}>
              {t('demo.audio.retry')}
            </button>
          )}
        </div>

        <div className="demo-controls">
          <label className="field">
            <span>{t('demo.mode')}</span>
            <select value={mode} onChange={(event) => setMode(event.target.value as DemoMode)}>
              <option value="note">{t('demo.mode.note')}</option>
              <option value="scale">{t('demo.mode.scale')}</option>
              <option value="interval">{t('demo.mode.interval')}</option>
              <option value="chord">{t('demo.mode.chord')}</option>
            </select>
          </label>

          <label className="field">
            <span>{t('demo.root')}</span>
            <select
              value={root}
              onChange={(event) =>
                setRoot(event.target.value as (typeof ROOT_OPTIONS)[number])
              }
            >
              {ROOT_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {pitchName(parsePitch(`${value}4`), settings.notation)}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>{t('demo.hand')}</span>
            <select value={hand} onChange={(event) => setHand(event.target.value as Hand)}>
              <option value="right">{t('demo.hand.right')}</option>
              <option value="left">{t('demo.hand.left')}</option>
            </select>
          </label>

          {mode === 'scale' && (
            <>
              <label className="field">
                <span>{t('demo.scale')}</span>
                <select
                  value={scaleMode}
                  onChange={(event) => setScaleMode(event.target.value as ScaleMode)}
                >
                  {SCALE_MODES.map((value) => (
                    <option key={value} value={value}>
                      {scaleName(value, settings.language)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>{t('demo.direction')}</span>
                <select
                  value={direction}
                  onChange={(event) =>
                    setDirection(event.target.value as 'ascending' | 'descending')
                  }
                >
                  <option value="ascending">{t('demo.direction.ascending')}</option>
                  <option value="descending">{t('demo.direction.descending')}</option>
                </select>
              </label>
            </>
          )}

          {mode === 'interval' && (
            <>
              <label className="field">
                <span>{t('demo.interval')}</span>
                <select value={intervalId} onChange={(event) => setIntervalId(event.target.value)}>
                  {INTERVAL_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {intervalName(
                        intervalBetween(
                          rootPitch,
                          transposeInterval(rootPitch, option.number, option.quality),
                        ),
                        settings.language,
                      )}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>{t('demo.interval.mode')}</span>
                <select
                  value={intervalMode}
                  onChange={(event) =>
                    setIntervalMode(event.target.value as 'melodic' | 'harmonic')
                  }
                >
                  <option value="melodic">{t('demo.interval.melodic')}</option>
                  <option value="harmonic">{t('demo.interval.harmonic')}</option>
                </select>
              </label>
            </>
          )}

          {mode === 'chord' && (
            <>
              <label className="field">
                <span>{t('demo.chord')}</span>
                <select
                  value={chordQuality}
                  onChange={(event) => setChordQuality(event.target.value as ChordQuality)}
                >
                  {CHORD_QUALITIES.filter((quality) => CHORD_PRESETS.includes(quality)).map(
                    (quality) => (
                      <option key={quality} value={quality}>
                        {settings.language === 'es'
                          ? CHORD_DEFINITIONS[quality].nameEs
                          : CHORD_DEFINITIONS[quality].nameEn}
                      </option>
                    ),
                  )}
                </select>
              </label>
              <label className="field">
                <span>{t('demo.chord.style')}</span>
                <select
                  value={chordStyle}
                  onChange={(event) => setChordStyle(event.target.value as ChordStyle)}
                >
                  {CHORD_STYLES.map((style) => (
                    <option key={style} value={style}>
                      {t(`demo.chord.${style}`)}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}

          <label className="field">
            <span>{t('demo.zoom')}</span>
            <select value={zoom} onChange={(event) => setZoom(Number(event.target.value))}>
              <option value={1}>{t('demo.zoom.normal')}</option>
              <option value={2}>{t('demo.zoom.large')}</option>
            </select>
          </label>
        </div>

        <div className="demo-actions">
          <button type="button" className="button-primary" onClick={playSelection}>
            {t('demo.play')}
          </button>
          <button
            type="button"
            className="button-secondary"
            onClick={() => {
              engine.stop()
              setBeat(null)
            }}
          >
            {t('demo.stop')}
          </button>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={repeat}
              onChange={(event) => setRepeat(event.target.checked)}
            />
            <span>{t('demo.repeat')}</span>
          </label>
          <button type="button" className="button-secondary" onClick={toggleMetronome}>
            {audio.isMetronome ? t('demo.metronome.stop') : t('demo.metronome')}
          </button>
          {beat !== null && audio.isMetronome && (
            <span className="beat" aria-live="polite">
              {t('demo.beat', { beat, beats: 4 })}
            </span>
          )}
        </div>

        <p className="selection" aria-live="polite">
          <strong>{t('demo.selection')}:</strong> {selectionName}
          {' · '}
          {notesText}
        </p>
      </section>

      <Keyboard
        highlighted={pitches.map(midiOf)}
        activeNotes={audio.activeNotes}
        fingering={fingering}
        onNoteOn={(midi) => {
          void engine.noteOn(midi).catch(() => undefined)
        }}
        onNoteOff={(midi) => engine.noteOff(midi)}
      />

      <Staff
        measures={staffMeasures}
        keySignature="C"
        timeSignature="4/4"
        zoom={zoom}
        label={t('demo.selection')}
        activeNotes={audio.activeNotes}
        activeIds={
          audio.activeLabels ??
          (audio.activeLabel === undefined ? [] : [audio.activeLabel])
        }
        onNoteClick={({ midis }) => playMidis(midis)}
      />

      <LoadForecastPanel />
      <SettingsPanel />
    </main>
  )
}
