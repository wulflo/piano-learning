import { useEffect, useMemo, useState } from 'react'
import { useMidi } from '../midi/context'
import { evaluateTaskAttempt, taskExpectedStrikes } from '../midi/exercise-attempt'
import type { AudioEngine, AudioEngineState } from '../audio/engine'
import { noteTimeline } from '../audio/notes'
import { scoreToMeasures, scoreToTimeline, scoreKeySignature, spelledPitchToMidi } from '../content/score'
import {
  taskChecklist,
  taskFingering,
  taskInstructions,
  taskTitle,
  type Locale,
} from '../content/localize'
import { keyboardRange } from '../keyboard/range'
import { fingeringFromText } from '../keyboard/fingering'
import type { KeyboardTask as KeyboardTaskData } from '../schemas'
import { useSettings } from '../state/settings'
import { Keyboard } from './Keyboard'
import { Staff } from './Staff'

/**
 * Tarea de teclado real de una lección.
 *
 * Reúne el diagrama con las teclas resaltadas, la digitación escrita, el
 * metrónomo, la demo sonora con su partitura y una lista de control marcable.
 * La tarea y su lista son locales a la visita: no se guardan como progreso ni
 * se presentan como una evaluación FSRS. La autoevaluación llega en F2-067.
 */

export interface KeyboardTaskProps {
  task: KeyboardTaskData
  engine: AudioEngine
  audio: AudioEngineState
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export function KeyboardTask({ task, engine, audio }: KeyboardTaskProps) {
  const { settings, t } = useSettings()
  const { status, events, devices, clearEvents } = useMidi()
  const locale: Locale = settings.language
  const checklist = taskChecklist(task, locale)
  const midis = useMemo(
    () => task.keys.map(spelledPitchToMidi),
    [task.keys],
  )
  const range = useMemo(() => keyboardRange(midis), [midis])
  const fingering = useMemo(
    () => fingeringFromText(midis, taskFingering(task, locale)),
    [midis, task, locale],
  )
  const measures = useMemo(
    () => (task.demoScore === undefined ? [] : scoreToMeasures(task.demoScore)),
    [task.demoScore],
  )
  const beatsPerMeasure = task.demoScore?.timeSignature.numerator ?? 4

  const [checked, setChecked] = useState<boolean[]>(() =>
    checklist.map(() => false),
  )
  const [beat, setBeat] = useState<number | null>(null)
  const [demoStarted, setDemoStarted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setChecked(checklist.map(() => false))
  }, [task, locale])

  // Cada tarea empieza con el intento MIDI en blanco para no arrastrar notas
  // de la tarea anterior.
  useEffect(() => {
    clearEvents()
  }, [task, clearEvents])

  useEffect(() => {
    if (!audio.isMetronome) setBeat(null)
  }, [audio.isMetronome])

  useEffect(() => {
    if (!audio.isPlaying) setDemoStarted(false)
  }, [audio.isPlaying])

  const checkedCount = checked.filter(Boolean).length
  const demoActive = demoStarted && audio.isPlaying

  const connectedDevices = devices
    .filter((device) => device.state === 'connected')
    .map((device) => device.name)
  const noteOnCount = events.filter((event) => event.velocity > 0).length

  const midiFeedback = useMemo(() => {
    if (status !== 'listening' || noteOnCount === 0) return null
    const expectedStrikes = taskExpectedStrikes(task, task.tempoBpm)
    if (expectedStrikes.length === 0) return null
    const feedback = evaluateTaskAttempt(task, events, task.tempoBpm)
    const accuracy = feedback.rhythm?.accuracy ?? 0
    const wrong = feedback.wrong
    const extra = feedback.extra
    const missing = feedback.missing
    return {
      matched: feedback.matched,
      total: expectedStrikes.length,
      accuracy: Math.round(accuracy * 100),
      steady: feedback.rhythm?.steady ?? false,
      wrong,
      extra,
      missing,
      perfect:
        feedback.matched === expectedStrikes.length &&
        wrong === 0 &&
        extra === 0 &&
        missing === 0,
    }
  }, [status, noteOnCount, events, task, task.tempoBpm])

  const fail = (reason: unknown) => {
    setError(t('lesson.task.audioError', { message: errorMessage(reason) }))
  }

  const toggleMetronome = () => {
    setError(null)
    if (audio.isMetronome) {
      engine.stopMetronome()
      setBeat(null)
      return
    }

    setBeat(0)
    void engine
      .startMetronome({
        tempo: task.tempoBpm,
        beatsPerMeasure,
        onBeat: (value) => setBeat(value),
      })
      .catch((reason: unknown) => {
        setBeat(null)
        fail(reason)
      })
  }

  const playDemo = () => {
    if (task.demoScore === undefined) return
    setError(null)

    if (demoActive) {
      engine.stop()
      setDemoStarted(false)
      return
    }

    setDemoStarted(true)
    void engine
      .playTimeline(
        scoreToTimeline(task.demoScore, task.demoScore.tempoBpm),
      )
      .catch((reason: unknown) => {
        setDemoStarted(false)
        fail(reason)
      })
  }

  return (
    <section className="panel lesson-task" aria-labelledby="lesson-task-title">
      <div className="panel-heading">
        <h2 id="lesson-task-title">{t('lesson.task.title')}</h2>
        <p className="muted">
          {t('lesson.task.tempo', { tempo: task.tempoBpm })}
        </p>
      </div>

      <h3>{taskTitle(task, locale)}</h3>
      <p>{taskInstructions(task, locale)}</p>

      {taskFingering(task, locale) !== undefined && (
        <p className="task-fingering">
          <strong>{t('lesson.task.fingering')}:</strong>{' '}
          {taskFingering(task, locale)}
        </p>
      )}

      <div className="task-actions">
        <button
          type="button"
          className="button-primary"
          onClick={playDemo}
          disabled={task.demoScore === undefined}
        >
          {demoActive ? t('lesson.task.demoStop') : t('lesson.task.demo')}
        </button>
        <button
          type="button"
          className="button-secondary"
          onClick={toggleMetronome}
        >
          {audio.isMetronome
            ? t('lesson.task.metronomeStop')
            : t('lesson.task.metronome')}
        </button>
        {beat !== null && audio.isMetronome && (
          <span className="task-beat" role="status" aria-live="polite">
            {t('lesson.task.beat', {
              beat: beat + 1,
              beats: beatsPerMeasure,
            })}
          </span>
        )}
      </div>

      {status === 'listening' && (
        <p className="task-midi-status">
          {connectedDevices.length > 0
            ? t('lesson.task.midiListening', {
                devices: connectedDevices.join(' · '),
              })
            : t('lesson.task.midiNoDevices')}
          {noteOnCount === 0 && ` · ${t('lesson.task.midiWaiting')}`}
        </p>
      )}

      {midiFeedback !== null && (
        <div
          className={[
            'task-midi-feedback',
            midiFeedback.perfect ? 'is-perfect' : 'is-error',
          ].join(' ')}
          role="status"
        >
          <p>
            {midiFeedback.perfect
              ? t('lesson.task.midiFeedback', {
                  matched: midiFeedback.matched,
                  total: midiFeedback.total,
                  accuracy: midiFeedback.accuracy,
                })
              : t('lesson.task.midiFeedbackErrors', {
                  matched: midiFeedback.matched,
                  total: midiFeedback.total,
                  accuracy: midiFeedback.accuracy,
                  wrong: midiFeedback.wrong,
                  extra: midiFeedback.extra,
                  missing: midiFeedback.missing,
                })}
          </p>
          <button
            type="button"
            className="button-secondary"
            onClick={clearEvents}
          >
            {t('lesson.task.midiReset')}
          </button>
        </div>
      )}

      {error !== null && (
        <p className="error-panel" role="alert">
          {error}
        </p>
      )}

      <Keyboard
        startMidi={range.startMidi}
        octaves={range.octaves}
        highlighted={midis}
        activeNotes={audio.activeNotes}
        fingering={fingering}
        onNoteOn={(midi) => {
          void engine.noteOn(midi).catch(fail)
        }}
        onNoteOff={(midi) => engine.noteOff(midi)}
      />

      {task.demoScore === undefined ? (
        <p className="muted">{t('lesson.task.demoMissing')}</p>
      ) : (
        <Staff
          measures={measures}
          clef={task.demoScore.clef === 'bass' ? 'bass' : 'treble'}
          keySignature={scoreKeySignature(task.demoScore)}
          timeSignature={`${task.demoScore.timeSignature.numerator}/${task.demoScore.timeSignature.denominator}`}
          label={taskTitle(task, locale)}
          activeNotes={audio.activeNotes}
          activeIds={
            audio.activeLabel === undefined ? [] : [audio.activeLabel]
          }
          onNoteClick={({ midis: clicked }) => {
            const first = clicked[0]
            if (first === undefined) return
            void engine
              .playTimeline(
                noteTimeline(first, { tempo: task.tempoBpm, beats: 1 }),
              )
              .catch(fail)
          }}
        />
      )}

      <fieldset className="task-checklist">
        <legend>{t('lesson.task.checklist')}</legend>
        <p className="muted" aria-live="polite">
          {t('lesson.task.checked', {
            checked: checkedCount,
            total: checked.length,
          })}
        </p>
        <ul>
          {checklist.map((item, index) => (
            <li key={item}>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={checked[index] === true}
                  onChange={() =>
                    setChecked((current) =>
                      current.map((value, position) =>
                        position === index ? !value : value,
                      ),
                    )
                  }
                />
                <span>{item}</span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>
    </section>
  )
}
