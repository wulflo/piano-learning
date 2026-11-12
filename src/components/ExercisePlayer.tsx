import { useEffect, useMemo, useRef, useState } from 'react'
import type { AudioEngine, AudioEngineState } from '../audio/engine'
import {
  beatDuration,
  CHORD_STYLES,
  intervalTimeline,
  noteTimeline,
  type ChordStyle,
  type TimelineEvent,
} from '../audio/notes'
import { loadExercises } from '../content/exercises'
import {
  exerciseChoices,
  exerciseExplanation,
  exercisePrompt,
  type Locale,
} from '../content/localize'
import {
  rhythmicValueBeats,
  scoreForHand,
  scoreToMeasures,
  scoreToTimeline,
  scoreKeySignature,
  spelledPitchToMidi,
} from '../content/score'
import {
  isExerciseAnswerCorrect,
  resolveExerciseAnswer,
} from '../exercises/answer'
import { chordExerciseTimeline } from '../exercises/audio'
import { arpeggioScore } from '../exercises/arpeggio'
import { buildChordDictation } from '../exercises/chord-dictation'
import { buildIntervalDictation } from '../exercises/interval-dictation'
import { buildMelodyDictation } from '../exercises/melody-dictation'
import {
  canPlay,
  createPlaybackCounter,
  MAX_EXERCISE_REPEATS,
  playbackCount,
  playbackRepeats,
  registerPlay,
  type PlaybackCounter,
} from '../exercises/playback'
import { buildProgressionCompletionAudio } from '../exercises/progression-completion'
import { buildProgressionDictation } from '../exercises/progression-dictation'
import {
  buildScaleDictation,
  type ScaleDictation,
} from '../exercises/scale-dictation'
import { melodyToScore } from '../exercises/transposition'
import { buildWorkedExample } from '../exercises/worked-example'
import { fromSpelledPitch, intervalBetween } from '../theory'
import { resolvePedagogicalFeedback } from '../theory/errors'
import type { Exercise, RhythmCell } from '../schemas'
import { useProgress } from '../state/progress-context'
import { useSettings } from '../state/settings'
import { ProgressionPlayer } from './ProgressionPlayer'
import { Staff } from './Staff'

/**
 * Reproductor de ejercicios de una lección.
 *
 * Carga los ejercicios referenciados por la lección, muestra uno por vez y
 * corrige la opción elegida. Al fallar, además de la explicación del contenido,
 * muestra la regla pedagógica «Recordá» con un ejemplo resuelto. Cada intento
 * se guarda como repaso de la habilidad con la calificación automática de FSRS.
 */

export interface ExercisePlayerProps {
  exerciseIds: readonly string[]
  engine: AudioEngine
  audio: AudioEngineState
  /** Registra cada intento como repaso FSRS. Se desactiva cuando la pantalla
   *  ya califica la sesión por otro medio. */
  recordAttempts?: boolean
  /** Muestra el botón para volver a la lección; no aplica a repaso/práctica. */
  showLessonLink?: boolean
}

type ExerciseLoadState =
  | { status: 'loading' }
  | { status: 'ready'; exercises: Exercise[] }
  | { status: 'error'; error: Error }

interface Correction {
  correct: boolean
  practice: boolean
  answer: string | null
}

function toError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value))
}

function choicesOf(
  exercise: Exercise,
  locale: Locale,
): readonly string[] | undefined {
  return exerciseChoices(exercise, locale)
}

function isScaleDictation(dictation: unknown): dictation is ScaleDictation {
  return (
    dictation !== null &&
    typeof dictation === 'object' &&
    'reference' in dictation
  )
}

function patternTimeline(
  pattern: readonly RhythmCell[],
  tempo: number,
): TimelineEvent[] {
  const events: TimelineEvent[] = []
  let time = 0
  for (const cell of pattern) {
    const duration = rhythmicValueBeats(cell) * beatDuration(tempo)
    if (!cell.rest) {
      events.push({ time, duration, midis: [60] })
    }
    time += duration
  }
  return events
}

function scrollToLesson(): void {
  const title = document.getElementById('lesson-title')
  if (title !== null && typeof title.scrollIntoView === 'function') {
    title.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

/**
 * Calidad real del par de notas en un ejercicio de intervalo.
 *
 * Los dictados ya traen su propio feedback, pero los ejercicios `interval`
 * escritos en el contenido se corrigen sin dictado. Calcular la calidad acá
 * permite mostrar la regla de justos, mayores, menores, aumentados o
 * disminuidos en vez del consejo genérico de cantidad.
 */
function intervalQualityOf(exercise: Exercise) {
  if (exercise.type !== 'interval') return undefined
  return intervalBetween(
    fromSpelledPitch(exercise.lower),
    fromSpelledPitch(exercise.upper),
  ).quality
}

/**
 * Aspecto del acorde que pregunta el ejercicio.
 *
 * Los ejercicios `chord` comparten tipo pero no contenido: construir las notas,
 * identificar la inversión, reconocer la calidad o escribir el cifrado. El
 * feedback sigue a `ask` para no mostrar siempre la regla de calidad.
 */
function chordAskOf(exercise: Exercise) {
  return exercise.type === 'chord' ? exercise.ask : undefined
}

function formOf(exercise: Exercise) {
  return exercise.type === 'form-analysis' ? exercise.form : undefined
}

export function ExercisePlayer({
  exerciseIds,
  engine,
  audio,
  recordAttempts = true,
  showLessonLink = true,
}: ExercisePlayerProps) {
  const { settings, t } = useSettings()
  const locale: Locale = settings.language
  const { repositories } = useProgress()
  const [loadState, setLoadState] = useState<ExerciseLoadState>({
    status: 'loading',
  })
  const [request, setRequest] = useState(0)
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState('')
  const [written, setWritten] = useState('')
  const [correction, setCorrection] = useState<Correction | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [audioError, setAudioError] = useState<string | null>(null)
  const [chordStyle, setChordStyle] = useState<ChordStyle>('block')
  const [playback, setPlayback] = useState<PlaybackCounter>(() =>
    createPlaybackCounter(),
  )
  const startedAtRef = useRef(Date.now())
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoadState({ status: 'loading' })
    loadExercises(exerciseIds).then(
      (exercises) => {
        if (!cancelled) setLoadState({ status: 'ready', exercises })
      },
      (error: unknown) => {
        if (!cancelled) {
          setLoadState({ status: 'error', error: toError(error) })
        }
      },
    )
    return () => {
      cancelled = true
    }
  }, [exerciseIds, request])

  const exercises =
    loadState.status === 'ready' ? loadState.exercises : ([] as Exercise[])
  const total = exercises.length
  const currentIndex = Math.min(index, Math.max(0, total - 1))
  const current = exercises[currentIndex]
  const resolved = useMemo(
    () =>
      current === undefined
        ? null
        : resolveExerciseAnswer(current, locale),
    [current, locale],
  )
  const choices = current === undefined ? undefined : choicesOf(current, locale)
  const arpeggio =
    current?.type === 'arpeggio'
      ? arpeggioScore(current.tonic, current.hand, current.octaves)
      : null
  const dictation = useMemo(() => {
    if (current?.type === 'ear-interval') {
      return buildIntervalDictation(current, {
        tempo: settings.tempo,
        locale,
      })
    }
    if (current?.type === 'ear-chord') {
      return buildChordDictation(current, {
        tempo: settings.tempo,
        locale,
        style: chordStyle,
      })
    }
    if (current?.type === 'ear-scale') {
      return buildScaleDictation(current, {
        tempo: settings.tempo,
        locale,
      })
    }
    if (current?.type === 'ear-progression') {
      return buildProgressionDictation(current, {
        tempo: settings.tempo,
        locale,
      })
    }
    if (current?.type === 'ear-melody') {
      return buildMelodyDictation(current, {
        tempo: settings.tempo,
        locale,
      })
    }
    return null
  }, [current, locale, settings.tempo, chordStyle])

  const transpositionScores = useMemo(() => {
    if (current?.type !== 'transposition') return null
    return {
      source: melodyToScore(current.melody, current.fromKey, {
        idPrefix: `${current.id}.origen`,
      }),
      answer:
        current.answer === undefined
          ? null
          : melodyToScore(current.answer, current.toKey, {
              idPrefix: `${current.id}.destino`,
            }),
    }
  }, [current])

  const workedExample = useMemo(
    () => (current === undefined ? null : buildWorkedExample(current)),
    [current],
  )

  useEffect(() => {
    setSelected('')
    setWritten('')
    setCorrection(null)
    setSaveError(null)
    setAudioError(null)
    setSaving(false)
    startedAtRef.current = Date.now()
  }, [current?.id])

  // El contador se guarda con el id del ejercicio: si una recarga vuelve a
  // montar el mismo ítem, la cuenta anterior no se pierde ni se mezcla con otro.
  // La pregunta y la respuesta llevan cuentas separadas.
  const questionPlays =
    current === undefined ? 0 : playbackCount(playback, current.id, 'question')
  const answerPlays =
    current === undefined ? 0 : playbackCount(playback, current.id, 'answer')
  const canPlayQuestion =
    current !== undefined && canPlay(playback, current.id, 'question')
  const canPlayAnswer =
    current !== undefined && canPlay(playback, current.id, 'answer')

  const failAudio = (reason: unknown) => {
    setAudioError(
      t('lesson.task.audioError', { message: toError(reason).message }),
    )
  }

  const play = (timeline: TimelineEvent[]) => {
    setAudioError(null)
    void engine.playTimeline(timeline).catch(failAudio)
  }

  const playSoundParameter = (which: 'a' | 'b') => {
    if (current?.type !== 'sound-parameter') return
    const example = which === 'a' ? current.exampleA : current.exampleB
    play(
      noteTimeline(example.midi, {
        tempo: settings.tempo,
        beats: example.beats,
        velocity: example.velocity,
      }),
    )
  }

  const playSingleNote = () => {
    if (current?.type === 'articulation') {
      play(
        noteTimeline(current.midi, {
          tempo: settings.tempo,
          beats: current.beats,
          velocity: current.velocity,
        }),
      )
    }
    if (current?.type === 'dynamic-mark') {
      play(
        noteTimeline(60, {
          tempo: settings.tempo,
          beats: 1,
          velocity: current.velocity,
        }),
      )
    }
  }

  const playInterval = () => {
    if (current?.type !== 'interval') return
    if (current.fragment !== undefined) {
      play(scoreToTimeline(current.fragment))
      return
    }
    play(
      intervalTimeline(
        spelledPitchToMidi(current.lower),
        spelledPitchToMidi(current.upper),
        {
          tempo: settings.tempo,
          beats: 0.8,
          mode: current.direction === 'harmonic' ? 'harmonic' : 'melodic',
        },
      ),
    )
  }

  const playDictation = () => {
    if (dictation === null || current === undefined) return
    if (!canPlay(playback, current.id, 'question')) return
    const id = current.id
    setPlayback((counter) => registerPlay(counter, id, 'question'))
    play(dictation.timeline)
  }

  const playDictationAnswer = () => {
    if (dictation === null || current === undefined) return
    if (!canPlay(playback, current.id, 'answer')) return
    const id = current.id
    setPlayback((counter) => registerPlay(counter, id, 'answer'))
    play(dictation.answerTimeline)
  }

  const playDictationComparison = () => {
    if (!isScaleDictation(dictation)) return
    play(dictation.reference.timeline)
  }

  const playRhythm = () => {
    if (current?.type !== 'rhythm-dictation') return
    play(patternTimeline(current.pattern, settings.tempo))
  }

  const playScore = () => {
    if (
      current?.type !== 'phrase-analysis' &&
      current?.type !== 'form-analysis' &&
      current?.type !== 'texture-analysis' &&
      current?.type !== 'counterpoint-analysis' &&
      current?.type !== 'ornament-execution' &&
      current?.type !== 'augmented-sixth' &&
      current?.type !== 'hand-coordination' &&
      current?.type !== 'arpeggio' &&
      current?.type !== 'pedal' &&
      current?.type !== 'accompaniment' &&
      current?.type !== 'arpeggiated' &&
      current?.type !== 'alberti' &&
      current?.type !== 'walking-bass' &&
      current?.type !== 'stride' &&
      current?.type !== 'sight-reading' &&
      current?.type !== 'style-pattern' &&
      current?.type !== 'transposition'
    ) {
      return
    }
    if (current.type === 'arpeggio') {
      if (arpeggio === null) return
      play(scoreToTimeline(arpeggio))
      return
    }
    if (current.type === 'transposition') {
      if (transpositionScores === null) return
      play(scoreToTimeline(transpositionScores.source))
      return
    }
    play(scoreToTimeline(current.score))
  }

  const playChord = () => {
    if (current?.type !== 'chord') return
    play(chordExerciseTimeline(current, settings.tempo, chordStyle))
  }

  const playProgressionCompletion = () => {
    if (current?.type !== 'progression-completion') return
    const audio = buildProgressionCompletionAudio(current, {
      tempo: settings.tempo,
    })
    play(audio.contextTimeline)
  }

  const submit = () => {
    if (current === undefined || resolved === null) return
    if (resolved.mode === 'practice') {
      setCorrection({ correct: true, practice: true, answer: null })
      return
    }

    const response = resolved.mode === 'text' ? written : selected
    if (response.trim() === '') return

    const correct = isExerciseAnswerCorrect(current, response, locale)
    const durationMs = Math.max(0, Date.now() - startedAtRef.current)
    setCorrection({
      correct,
      practice: false,
      answer: resolved.answer,
    })
    setSaveError(null)

    if (!recordAttempts || repositories === null) return

    setSaving(true)
    // FSRS y el registro de repasos se cargan recién al corregir para no
    // engordar el bundle inicial de la lección.
    void (async () => {
      try {
        const [{ recordExerciseAttempt }, { fsrsParamsFromSettings }] =
          await Promise.all([
            import('../state/exercise-attempt'),
            import('../state/fsrs'),
          ])
        await recordExerciseAttempt(repositories, {
          exercise: current,
          correct,
          durationMs,
          fsrsParams: fsrsParamsFromSettings(settings),
        })
        if (mountedRef.current) setSaving(false)
      } catch (reason: unknown) {
        // Si el componente ya se desmontó (por ejemplo, al cambiar de
        // lección o al cerrar el test), no se actualiza estado: React
        // intentaría programar un render sobre un DOM que ya no existe.
        if (!mountedRef.current) return
        setSaving(false)
        setSaveError(
          t('lesson.exercise.saveError', {
            message: toError(reason).message,
          }),
        )
      }
    })()
  }

  const retry = () => {
    setSelected('')
    setWritten('')
    setCorrection(null)
    setSaveError(null)
    startedAtRef.current = Date.now()
  }

  const next = () => {
    setIndex((value) => Math.min(value + 1, Math.max(0, total - 1)))
  }

  if (exerciseIds.length === 0) {
    return <p className="muted">{t('lesson.exercise.empty')}</p>
  }

  if (loadState.status === 'loading') {
    return (
      <p className="muted" role="status">
        {t('lesson.exercise.loading')}
      </p>
    )
  }

  if (loadState.status === 'error') {
    return (
      <div className="error-panel" role="alert">
        <p>
          {t('lesson.exercise.error', { message: loadState.error.message })}
        </p>
        <button
          type="button"
          className="button-secondary"
          onClick={() => setRequest((value) => value + 1)}
        >
          {t('lesson.exercise.retry')}
        </button>
      </div>
    )
  }

  if (current === undefined || resolved === null) {
    return <p className="muted">{t('lesson.exercise.empty')}</p>
  }

  const feedback =
    correction !== null && !correction.correct && !correction.practice
      ? (dictation?.feedback ??
        resolvePedagogicalFeedback({
          exerciseType: current.type,
          intervalQuality: intervalQualityOf(current),
          chordAsk: chordAskOf(current),
          form: formOf(current),
        }))
      : null
  const rememberId = `exercise-remember-${current.id}`
  const titleId = `exercise-title-${current.id}`
  const dictationHintId = `exercise-dictation-hint-${current.id}`
  const answerHintId = `exercise-answer-hint-${current.id}`

  return (
    <div className="exercise-player">
      <p className="exercise-progress">
        {t('lesson.exercise.progress', {
          current: currentIndex + 1,
          total,
        })}
      </p>

      <article className="exercise-card" aria-labelledby={titleId}>
        <p className="eyebrow">
          {t('lesson.exercise')}
          {current.optional === true
            ? ` · ${t('lesson.exercise.optional')}`
            : ''}
        </p>
        <h3 id={titleId}>{exercisePrompt(current, locale)}</h3>

        {current.type === 'interval' && current.fragment !== undefined && (
          <Staff
            measures={scoreToMeasures(current.fragment)}
            clef={current.fragment.clef === 'bass' ? 'bass' : 'treble'}
            keySignature={scoreKeySignature(current.fragment)}
            timeSignature={`${current.fragment.timeSignature.numerator}/${current.fragment.timeSignature.denominator}`}
            label={t('lesson.exercise.fragment')}
          />
        )}

        {(current.type === 'phrase-analysis' ||
          current.type === 'form-analysis' ||
          current.type === 'texture-analysis' ||
          current.type === 'counterpoint-analysis' ||
          current.type === 'ornament-execution' ||
          current.type === 'augmented-sixth') && (
          <>
            <Staff
              measures={scoreToMeasures(current.score)}
              clef={current.score.clef === 'bass' ? 'bass' : 'treble'}
              keySignature={scoreKeySignature(current.score)}
              timeSignature={`${current.score.timeSignature.numerator}/${current.score.timeSignature.denominator}`}
              label={
                current.type === 'augmented-sixth'
                  ? t('lesson.exercise.chordScore')
                  : t('lesson.exercise.motiveScore')
              }
            />
            <p className="exercise-audio-actions">
              <button
                type="button"
                className="button-secondary"
                onClick={playScore}
              >
                {current.type === 'augmented-sixth'
                  ? t('lesson.exercise.listenChord')
                  : t('lesson.exercise.listenMelody')}
              </button>
            </p>
          </>
        )}

        {current.type === 'arpeggio' && arpeggio !== null && (
          <>
            <Staff
              measures={scoreToMeasures(arpeggio)}
              clef="treble"
              keySignature={scoreKeySignature(arpeggio)}
              timeSignature={`${arpeggio.timeSignature.numerator}/${arpeggio.timeSignature.denominator}`}
              label={t('lesson.exercise.arpeggioScore')}
            />
            <p className="exercise-audio-actions">
              <button
                type="button"
                className="button-secondary"
                onClick={playScore}
              >
                {t('lesson.exercise.listenArpeggio')}
              </button>
            </p>
          </>
        )}

        {current.type === 'walking-bass' && (
          <>
            <Staff
              measures={scoreToMeasures(current.score)}
              clef={current.score.clef === 'bass' ? 'bass' : 'treble'}
              keySignature={scoreKeySignature(current.score)}
              timeSignature={`${current.score.timeSignature.numerator}/${current.score.timeSignature.denominator}`}
              label={t('lesson.exercise.walkingScore')}
            />
            <p className="exercise-audio-actions">
              <button
                type="button"
                className="button-secondary"
                onClick={playScore}
              >
                {t('lesson.exercise.listenWalking')}
              </button>
            </p>
          </>
        )}

        {current.type === 'stride' && (
          <>
            <Staff
              measures={scoreToMeasures(current.score)}
              clef={current.score.clef === 'bass' ? 'bass' : 'treble'}
              keySignature={scoreKeySignature(current.score)}
              timeSignature={`${current.score.timeSignature.numerator}/${current.score.timeSignature.denominator}`}
              label={t('lesson.exercise.strideScore')}
            />
            <p className="exercise-audio-actions">
              <button
                type="button"
                className="button-secondary"
                onClick={playScore}
              >
                {t('lesson.exercise.listenStride')}
              </button>
            </p>
          </>
        )}

        {current.type === 'sight-reading' && (
          <>
            <Staff
              measures={scoreToMeasures(current.score)}
              clef={current.score.clef === 'bass' ? 'bass' : 'treble'}
              keySignature={scoreKeySignature(current.score)}
              timeSignature={`${current.score.timeSignature.numerator}/${current.score.timeSignature.denominator}`}
              label={t('lesson.exercise.sightReadingScore')}
            />
            <p className="exercise-audio-actions">
              <button
                type="button"
                className="button-secondary"
                onClick={playScore}
              >
                {t('lesson.exercise.listenSightReading')}
              </button>
            </p>
          </>
        )}

        {current.type === 'transposition' && transpositionScores !== null && (
          <>
            <Staff
              measures={scoreToMeasures(transpositionScores.source)}
              clef={
                transpositionScores.source.clef === 'bass' ? 'bass' : 'treble'
              }
              keySignature={scoreKeySignature(transpositionScores.source)}
              timeSignature={`${transpositionScores.source.timeSignature.numerator}/${transpositionScores.source.timeSignature.denominator}`}
              label={t('lesson.exercise.transpositionScore')}
            />
            <p className="exercise-audio-actions">
              <button
                type="button"
                className="button-secondary"
                onClick={playScore}
              >
                {t('lesson.exercise.listenTransposition')}
              </button>
            </p>
            {correction !== null &&
              !correction.practice &&
              transpositionScores.answer !== null && (
                <Staff
                  measures={scoreToMeasures(transpositionScores.answer)}
                  clef={
                    transpositionScores.answer.clef === 'bass'
                      ? 'bass'
                      : 'treble'
                  }
                  keySignature={scoreKeySignature(transpositionScores.answer)}
                  timeSignature={`${transpositionScores.answer.timeSignature.numerator}/${transpositionScores.answer.timeSignature.denominator}`}
                  label={t('lesson.exercise.transpositionAnswerScore')}
                />
              )}
          </>
        )}

        {current.type === 'alberti' && (
          <>
            <Staff
              measures={scoreToMeasures(current.score)}
              clef={current.score.clef === 'bass' ? 'bass' : 'treble'}
              keySignature={scoreKeySignature(current.score)}
              timeSignature={`${current.score.timeSignature.numerator}/${current.score.timeSignature.denominator}`}
              label={t('lesson.exercise.albertiScore')}
            />
            <p className="exercise-audio-actions">
              <button
                type="button"
                className="button-secondary"
                onClick={playScore}
              >
                {t('lesson.exercise.listenAlberti')}
              </button>
            </p>
          </>
        )}

        {current.type === 'arpeggiated' && (
          <>
            <Staff
              measures={scoreToMeasures(current.score)}
              clef={current.score.clef === 'bass' ? 'bass' : 'treble'}
              keySignature={scoreKeySignature(current.score)}
              timeSignature={`${current.score.timeSignature.numerator}/${current.score.timeSignature.denominator}`}
              label={t('lesson.exercise.arpeggiatedScore')}
            />
            <p className="exercise-audio-actions">
              <button
                type="button"
                className="button-secondary"
                onClick={playScore}
              >
                {t('lesson.exercise.listenArpeggiated')}
              </button>
            </p>
          </>
        )}

        {current.type === 'accompaniment' && (
          <>
            <Staff
              measures={scoreToMeasures(current.score)}
              clef={
                current.score.clef === 'bass' ? 'bass' : 'treble'
              }
              keySignature={scoreKeySignature(current.score)}
              timeSignature={`${current.score.timeSignature.numerator}/${current.score.timeSignature.denominator}`}
              label={
                current.ask === 'melody' || current.ask === 'voicing'
                  ? t('lesson.exercise.leadSheetScore')
                  : t('lesson.exercise.accompanimentScore')
              }
            />
            <p className="exercise-audio-actions">
              <button
                type="button"
                className="button-secondary"
                onClick={playScore}
              >
                {t(
                  current.ask === 'melody' || current.ask === 'voicing'
                    ? 'lesson.exercise.listenLeadSheet'
                    : 'lesson.exercise.listenAccompaniment',
                )}
              </button>
            </p>
          </>
        )}

        {current.type === 'style-pattern' && (
          <>
            <Staff
              measures={scoreToMeasures(current.score)}
              clef={current.score.clef === 'bass' ? 'bass' : 'treble'}
              keySignature={scoreKeySignature(current.score)}
              timeSignature={`${current.score.timeSignature.numerator}/${current.score.timeSignature.denominator}`}
              label={
                current.style === 'blues'
                  ? t('lesson.exercise.bluesScore')
                  : current.style === 'jazz'
                    ? t('lesson.exercise.jazzScore')
                    : current.style === 'latin'
                      ? t('lesson.exercise.latinScore')
                      : t('lesson.exercise.popRockScore')
              }
            />
            <p className="exercise-audio-actions">
              <button
                type="button"
                className="button-secondary"
                onClick={playScore}
              >
                {t(
                  current.style === 'blues'
                    ? 'lesson.exercise.listenBlues'
                    : current.style === 'jazz'
                      ? 'lesson.exercise.listenJazz'
                      : current.style === 'latin'
                        ? 'lesson.exercise.listenLatin'
                        : 'lesson.exercise.listenPopRock',
                )}
              </button>
            </p>
          </>
        )}

        {current.type === 'pedal' && (
          <>
            <Staff
              measures={scoreToMeasures(current.score)}
              clef={
                current.score.clef === 'bass' ? 'bass' : 'treble'
              }
              keySignature={scoreKeySignature(current.score)}
              timeSignature={`${current.score.timeSignature.numerator}/${current.score.timeSignature.denominator}`}
              label={t('lesson.exercise.pedalScore')}
            />
            <p className="exercise-audio-actions">
              <button
                type="button"
                className="button-secondary"
                onClick={playScore}
              >
                {t('lesson.exercise.listenPedal')}
              </button>
            </p>
          </>
        )}

        {current.type === 'hand-coordination' && (
          <>
            <Staff
              measures={scoreToMeasures(scoreForHand(current.score, 'right'))}
              clef="treble"
              keySignature={scoreKeySignature(current.score)}
              timeSignature={`${current.score.timeSignature.numerator}/${current.score.timeSignature.denominator}`}
              label={t('lesson.exercise.rightHandScore')}
            />
            <Staff
              measures={scoreToMeasures(scoreForHand(current.score, 'left'))}
              clef="treble"
              keySignature={scoreKeySignature(current.score)}
              timeSignature={`${current.score.timeSignature.numerator}/${current.score.timeSignature.denominator}`}
              label={t('lesson.exercise.leftHandScore')}
            />
            <p className="exercise-audio-actions">
              <button
                type="button"
                className="button-secondary"
                onClick={playScore}
              >
                {t('lesson.exercise.listenHands')}
              </button>
            </p>
          </>
        )}

        {current.type === 'sound-parameter' && (
          <p className="exercise-audio-actions">
            <button
              type="button"
              className="button-secondary"
              onClick={() => playSoundParameter('a')}
            >
              {t('lesson.exercise.listenA')}
            </button>
            <button
              type="button"
              className="button-secondary"
              onClick={() => playSoundParameter('b')}
            >
              {t('lesson.exercise.listenB')}
            </button>
          </p>
        )}

        {(current.type === 'articulation' ||
          current.type === 'dynamic-mark') && (
          <p className="exercise-audio-actions">
            <button
              type="button"
              className="button-secondary"
              onClick={playSingleNote}
            >
              {t('lesson.exercise.listenNote')}
            </button>
          </p>
        )}

        {current.type === 'ear-interval' && dictation !== null && (
          <div className="exercise-dictation">
            <p id={dictationHintId} className="muted">
              {t('lesson.exercise.dictationHint')}
            </p>
            <p className="exercise-audio-actions">
              <button
                type="button"
                className="button-secondary"
                onClick={playDictation}
                disabled={!canPlayQuestion}
                aria-describedby={dictationHintId}
              >
                {questionPlays === 0
                  ? t('lesson.exercise.listenDictation')
                  : t('lesson.exercise.repeatDictation')}
              </button>
            </p>
            <p className="muted" role="status" aria-live="polite">
              {t('lesson.exercise.dictationRepeats', {
                used: playbackRepeats(questionPlays),
                max: MAX_EXERCISE_REPEATS,
              })}
            </p>
          </div>
        )}

        {current.type === 'ear-chord' && dictation !== null && (
          <div className="exercise-dictation">
            <p id={dictationHintId} className="muted">
              {t('lesson.exercise.chordDictationHint')}
            </p>
            <div className="exercise-audio-actions">
              <button
                type="button"
                className="button-secondary"
                onClick={playDictation}
                disabled={!canPlayQuestion}
                aria-describedby={dictationHintId}
              >
                {questionPlays === 0
                  ? t('lesson.exercise.listenChordDictation')
                  : t('lesson.exercise.repeatChordDictation')}
              </button>
              <label className="exercise-chord-style">
                <span>{t('lesson.exercise.chordStyle')}</span>
                <select
                  value={chordStyle}
                  onChange={(event) =>
                    setChordStyle(event.target.value as ChordStyle)
                  }
                >
                  {CHORD_STYLES.map((style) => (
                    <option key={style} value={style}>
                      {t(`lesson.exercise.chordStyle.${style}`)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p className="muted" role="status" aria-live="polite">
              {t('lesson.exercise.dictationRepeats', {
                used: playbackRepeats(questionPlays),
                max: MAX_EXERCISE_REPEATS,
              })}
            </p>
          </div>
        )}

        {current.type === 'ear-progression' && dictation !== null && (
          <div className="exercise-dictation">
            <p id={dictationHintId} className="muted">
              {t('lesson.exercise.progressionDictationHint')}
            </p>
            <p className="exercise-audio-actions">
              <button
                type="button"
                className="button-secondary"
                onClick={playDictation}
                disabled={!canPlayQuestion}
                aria-describedby={dictationHintId}
              >
                {questionPlays === 0
                  ? t('lesson.exercise.listenProgressionDictation')
                  : t('lesson.exercise.repeatProgressionDictation')}
              </button>
            </p>
            <p className="muted" role="status" aria-live="polite">
              {t('lesson.exercise.dictationRepeats', {
                used: playbackRepeats(questionPlays),
                max: MAX_EXERCISE_REPEATS,
              })}
            </p>
          </div>
        )}

        {current.type === 'ear-melody' && dictation !== null && (
          <div className="exercise-dictation">
            <p id={dictationHintId} className="muted">
              {t('lesson.exercise.melodyDictationHint')}
            </p>
            <p className="exercise-audio-actions">
              <button
                type="button"
                className="button-secondary"
                onClick={playDictation}
                disabled={!canPlayQuestion}
                aria-describedby={dictationHintId}
              >
                {questionPlays === 0
                  ? t('lesson.exercise.listenMelodyDictation')
                  : t('lesson.exercise.repeatMelodyDictation')}
              </button>
            </p>
            <p className="muted" role="status" aria-live="polite">
              {t('lesson.exercise.dictationRepeats', {
                used: playbackRepeats(questionPlays),
                max: MAX_EXERCISE_REPEATS,
              })}
            </p>
          </div>
        )}

        {current.type === 'ear-scale' && isScaleDictation(dictation) && (
            <div className="exercise-dictation">
              <p id={dictationHintId} className="muted">
                {t('lesson.exercise.scaleDictationHint')}
              </p>
              <div className="exercise-audio-actions">
                <button
                  type="button"
                  className="button-secondary"
                  onClick={playDictation}
                  disabled={!canPlayQuestion}
                  aria-describedby={dictationHintId}
                >
                  {questionPlays === 0
                    ? t('lesson.exercise.listenScaleDictation')
                    : t('lesson.exercise.repeatScaleDictation')}
                </button>
                <button
                  type="button"
                  className="button-secondary"
                  onClick={playDictationComparison}
                  aria-describedby={dictationHintId}
                >
                  {t('lesson.exercise.compareScaleDictation', {
                    scale:
                      locale === 'es'
                        ? dictation.reference.labelEs
                        : dictation.reference.labelEn,
                  })}
                </button>
              </div>
              <p className="muted" role="status" aria-live="polite">
                {t('lesson.exercise.dictationRepeats', {
                  used: playbackRepeats(questionPlays),
                  max: MAX_EXERCISE_REPEATS,
                })}
              </p>
            </div>
          )}

        {current.type === 'interval' && (
          <p className="exercise-audio-actions">
            <button
              type="button"
              className="button-secondary"
              onClick={playInterval}
            >
              {current.fragment === undefined
                ? t('lesson.exercise.listenInterval')
                : t('lesson.exercise.listenFragment')}
            </button>
          </p>
        )}

        {current.type === 'progression-completion' && (
          <p className="exercise-audio-actions">
            <button
              type="button"
              className="button-secondary"
              onClick={playProgressionCompletion}
            >
              {t('lesson.exercise.listenProgression')}
            </button>
          </p>
        )}

        {current.type === 'rhythm-dictation' && (
          <p className="exercise-audio-actions">
            <button
              type="button"
              className="button-secondary"
              onClick={playRhythm}
            >
              {t('lesson.exercise.listenPattern')}
            </button>
          </p>
        )}

        {current.type === 'chord' && (
          <div className="exercise-audio-actions">
            <button
              type="button"
              className="button-secondary"
              onClick={playChord}
            >
              {t('lesson.exercise.listenChord')}
            </button>
            <label className="exercise-chord-style">
              <span>{t('lesson.exercise.chordStyle')}</span>
              <select
                value={chordStyle}
                onChange={(event) =>
                  setChordStyle(event.target.value as ChordStyle)
                }
              >
                {CHORD_STYLES.map((style) => (
                  <option key={style} value={style}>
                    {t(`lesson.exercise.chordStyle.${style}`)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        {audioError !== null && <p role="alert">{audioError}</p>}

        {resolved.mode === 'practice' ? (
          <div className="exercise-practice">
            <p>{t('lesson.exercise.practice')}</p>
            <button
              type="button"
              className="button-primary"
              onClick={submit}
              disabled={correction !== null}
            >
              {t('lesson.exercise.practiceDone')}
            </button>
          </div>
        ) : resolved.mode === 'text' ? (
          <label className="exercise-written">
            <span>{t('lesson.exercise.written')}</span>
            <input
              type="text"
              value={written}
              onChange={(event) => setWritten(event.target.value)}
              disabled={correction !== null}
              autoComplete="off"
            />
          </label>
        ) : (
          <fieldset className="exercise-choices">
            <legend>{t('lesson.exercise.choose')}</legend>
            {(choices ?? []).map((choice) => (
              <label key={choice} className="exercise-choice">
                <input
                  type="radio"
                  name={`exercise-${current.id}`}
                  value={choice}
                  checked={selected === choice}
                  onChange={() => setSelected(choice)}
                  disabled={correction !== null}
                />
                <span>{choice}</span>
              </label>
            ))}
          </fieldset>
        )}

        {resolved.mode !== 'practice' && correction === null && (
          <button
            type="button"
            className="button-primary"
            onClick={submit}
            disabled={
              resolved.mode === 'text' ? written.trim() === '' : selected === ''
            }
          >
            {t('lesson.exercise.submit')}
          </button>
        )}

        {correction !== null && (
          <div
            className={`exercise-feedback ${
              correction.correct ? 'is-correct' : 'is-incorrect'
            }`}
            role="status"
            aria-live="polite"
          >
            <p className="exercise-result">
              {correction.practice
                ? t('lesson.exercise.practised')
                : correction.correct
                  ? t('lesson.exercise.correct')
                  : t('lesson.exercise.incorrect')}
            </p>

            {!correction.correct &&
              !correction.practice &&
              correction.answer !== null && (
                <p>
                  {t('lesson.exercise.correctAnswer', {
                    answer: correction.answer,
                  })}
                </p>
              )}

            <p>{exerciseExplanation(current, locale)}</p>

            {current.type === 'ear-melody' && !correction.practice && (
              <Staff
                measures={scoreToMeasures(current.score)}
                clef={current.score.clef === 'bass' ? 'bass' : 'treble'}
                keySignature={scoreKeySignature(current.score)}
                timeSignature={`${current.score.timeSignature.numerator}/${current.score.timeSignature.denominator}`}
                label={t('lesson.exercise.revealMelody')}
              />
            )}

            {dictation !== null && !correction.practice && (
              <div className="exercise-answer">
                <p id={answerHintId} className="muted">
                  {t('lesson.exercise.answerHint')}
                </p>
                <p className="exercise-audio-actions">
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={playDictationAnswer}
                    disabled={!canPlayAnswer}
                    aria-describedby={answerHintId}
                  >
                    {answerPlays === 0
                      ? t('lesson.exercise.listenAnswer')
                      : t('lesson.exercise.repeatAnswer')}
                  </button>
                </p>
                <p className="muted" role="status" aria-live="polite">
                  {t('lesson.exercise.answerRepeats', {
                    used: playbackRepeats(answerPlays),
                    max: MAX_EXERCISE_REPEATS,
                  })}
                </p>
              </div>
            )}

            {!correction.practice &&
              (current.type === 'progression-completion' ||
                current.type === 'ear-progression') && (
                <ProgressionPlayer
                  degrees={current.degrees}
                  keyTonic={current.key}
                  mode={current.mode}
                  engine={engine}
                  audio={audio}
                />
              )}

            {feedback !== null && (
              <aside
                className="exercise-remember"
                aria-labelledby={rememberId}
              >
                <h4 id={rememberId}>
                  {locale === 'en' ? feedback.titleEn : feedback.titleEs}
                </h4>
                <p>{locale === 'en' ? feedback.ruleEn : feedback.ruleEs}</p>
                {workedExample !== null ? (
                  <Staff
                    measures={workedExample.measures}
                    clef={workedExample.clef}
                    keySignature={workedExample.keySignature}
                    label={t(
                      workedExample.kind === 'interval'
                        ? 'lesson.exercise.workedExampleInterval'
                        : 'lesson.exercise.workedExampleChord',
                    )}
                  />
                ) : (
                  <p>
                    <strong>{t('lesson.exercise.example')}:</strong>{' '}
                    {locale === 'en' ? feedback.exampleEn : feedback.exampleEs}
                  </p>
                )}
              </aside>
            )}

            {saving && <p className="muted">{t('lesson.exercise.saving')}</p>}
            {saveError !== null && <p role="alert">{saveError}</p>}
          </div>
        )}

        <p className="exercise-actions">
          {correction?.correct === true && currentIndex + 1 < total && (
            <button type="button" className="button-primary" onClick={next}>
              {t('lesson.exercise.next')}
            </button>
          )}
          {correction !== null && !correction.correct && (
            <button type="button" className="button-secondary" onClick={retry}>
              {t('lesson.exercise.tryAgain')}
            </button>
          )}
          {showLessonLink && (
            <button
              type="button"
              className="button-secondary"
              onClick={scrollToLesson}
            >
              {t('lesson.exercise.back')}
            </button>
          )}
        </p>
      </article>

      <p className="muted" role="status">
        {audio.status === 'error'
          ? t('lesson.audio.error', { message: audio.error ?? '' })
          : t('lesson.exercise.audioHint')}
      </p>
    </div>
  )
}
