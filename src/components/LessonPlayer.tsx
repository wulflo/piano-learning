import { useEffect, useMemo } from 'react'
import { noteTimeline, scaleTimeline, type TimelineEvent } from '../audio/notes'
import type { AudioEngine, AudioEngineState } from '../audio/engine'
import { useAudioEngine } from '../audio/useAudioEngine'
import {
  scoreToMeasures,
  scoreToTimeline,
  scoreKeySignature,
  spelledPitchToMidi,
} from '../content/score'
import {
  sectionBody,
  sectionTitle,
  type Locale,
} from '../content/localize'
import type { Lesson, LessonSection } from '../schemas'
import { useSettings } from '../state/settings'
import { keyboardRange } from '../keyboard/range'
import { fingeringFromText } from '../keyboard/fingering'
import { Keyboard } from './Keyboard'
import { ExercisePlayer } from './ExercisePlayer'
import { KeyboardTask } from './KeyboardTask'
import { Staff } from './Staff'

/**
 * Reproductor de una lección.
 *
 * Renderiza las secciones con texto, llamados de atención, ejemplos de teclado y
 * pentagrama, y la tarea de teclado del contenido. Los ejemplos comparten un
 * único motor de audio para que reproducir uno detenga al anterior.
 *
 * La tarea de teclado se delega a `KeyboardTask`, que agrega diagrama,
 * digitación escrita, metrónomo, demo y lista de control marcable.
 */

export interface LessonPlayerProps {
  lesson: Lesson
}

export function LessonPlayer({ lesson }: LessonPlayerProps) {
  const { settings, t } = useSettings()
  const { engine, state: audio } = useAudioEngine()

  useEffect(() => {
    engine.setVolume(settings.volumeDb)
  }, [engine, settings.volumeDb])

  useEffect(() => {
    engine.setTempo(settings.tempo)
  }, [engine, settings.tempo])

  useEffect(() => () => engine.stop(), [engine])

  const audioMessage =
    audio.status === 'error'
      ? t('lesson.audio.error', { message: audio.error ?? '' })
      : audio.status === 'ready'
        ? t(audio.mode === 'sampler' ? 'lesson.audio.sampler' : 'lesson.audio.synth')
        : t('lesson.audio.hint')

  const playTimeline = (timeline: TimelineEvent[]) => {
    void engine.playTimeline(timeline).catch(() => undefined)
  }

  const playMidis = (midis: readonly number[]) => {
    if (midis.length === 0) return
    playTimeline(
      scaleTimeline([...midis], {
        tempo: settings.tempo,
        noteBeats: 0.5,
      }),
    )
  }

  const task = lesson.keyboardTask
  const exerciseSectionId = lesson.sections.find(
    (section) => section.kind === 'exercise',
  )?.id

  return (
    <div className="lesson-player">
      <div className="lesson-audio" role="status">
        <p className="muted">{audioMessage}</p>
        {audio.isPlaying && (
          <button
            type="button"
            className="button-secondary"
            onClick={() => engine.stop()}
          >
            {t('lesson.stop')}
          </button>
        )}
      </div>

      <ol className="lesson-sections">
        {lesson.sections.map((section) => (
          <LessonSectionView
            key={section.id}
            section={section}
            exerciseIds={
              section.id === exerciseSectionId ? lesson.exerciseIds : []
            }
            engine={engine}
            audio={audio}
            activeNotes={audio.activeNotes}
            onPlay={playTimeline}
            onPlayMidis={playMidis}
          />
        ))}

        {exerciseSectionId === undefined && lesson.exerciseIds.length > 0 && (
          <li className="lesson-section lesson-exercise">
            <h2>{t('lesson.exercise.title')}</h2>
            <ExercisePlayer
              exerciseIds={lesson.exerciseIds}
              engine={engine}
              audio={audio}
            />
          </li>
        )}
      </ol>

      {task !== undefined && (
        <KeyboardTask task={task} engine={engine} audio={audio} />
      )}
    </div>
  )
}

interface LessonSectionViewProps {
  section: LessonSection
  exerciseIds: readonly string[]
  engine: AudioEngine
  audio: AudioEngineState
  activeNotes: ReadonlyArray<number>
  onPlay: (timeline: TimelineEvent[]) => void
  onPlayMidis: (midis: readonly number[]) => void
}

function LessonSectionView({
  section,
  exerciseIds,
  engine,
  audio,
  activeNotes,
  onPlay,
  onPlayMidis,
}: LessonSectionViewProps) {
  const { settings, t } = useSettings()
  const locale: Locale = settings.language
  const midis = useMemo(
    () => section.keys.map(spelledPitchToMidi),
    [section.keys],
  )
  const measures = useMemo(
    () => (section.score === undefined ? [] : scoreToMeasures(section.score)),
    [section.score],
  )
  const range = useMemo(() => keyboardRange(midis), [midis])
  const fingering = useMemo(() => fingeringFromText(midis, undefined), [midis])

  if (section.kind === 'callout') {
    return (
      <li className="lesson-section lesson-callout">
        <aside aria-labelledby={`${section.id}-title`}>
          <h2 id={`${section.id}-title`}>{sectionTitle(section, locale)}</h2>
          {sectionBody(section, locale) !== undefined && (
            <p>{sectionBody(section, locale)}</p>
          )}
        </aside>
      </li>
    )
  }

  if (section.kind === 'exercise') {
    return (
      <li className="lesson-section lesson-exercise">
        <p className="eyebrow">{t('lesson.exercise')}</p>
        <h2 id={`${section.id}-title`}>{sectionTitle(section, locale)}</h2>
        {sectionBody(section, locale) !== undefined && (
          <p>{sectionBody(section, locale)}</p>
        )}
        <ExercisePlayer
          exerciseIds={exerciseIds}
          engine={engine}
          audio={audio}
        />
      </li>
    )
  }

  return (
    <li className={`lesson-section lesson-${section.kind}`}>
      <h2 id={`${section.id}-title`}>{sectionTitle(section, locale)}</h2>
      {sectionBody(section, locale) !== undefined && (
        <p>{sectionBody(section, locale)}</p>
      )}

      {(section.kind === 'keyboard' || section.kind === 'audio') &&
        midis.length > 0 && (
          <>
            <button
              type="button"
              className="button-primary"
              onClick={() => onPlayMidis(midis)}
            >
              {t('lesson.play')}
            </button>
            <Keyboard
              startMidi={range.startMidi}
              octaves={range.octaves}
              highlighted={midis}
              activeNotes={activeNotes}
              fingering={fingering}
              onNoteOn={(midi) =>
                onPlay(
                  noteTimeline(midi, { tempo: settings.tempo, beats: 1 }),
                )
              }
            />
          </>
        )}

      {section.kind === 'score' && section.score !== undefined && (
        <>
          <button
            type="button"
            className="button-primary"
            onClick={() => onPlay(scoreToTimeline(section.score!, settings.tempo))}
          >
            {t('lesson.play')}
          </button>
          <Staff
            measures={measures}
            clef={section.score.clef === 'bass' ? 'bass' : 'treble'}
            keySignature={scoreKeySignature(section.score)}
            timeSignature={`${section.score.timeSignature.numerator}/${section.score.timeSignature.denominator}`}
            label={sectionTitle(section, locale)}
            activeNotes={activeNotes}
            activeIds={
              audio.activeLabels ??
              (audio.activeLabel === undefined ? [] : [audio.activeLabel])
            }
            onNoteClick={({ midis: clicked }) =>
              onPlay(
                noteTimeline(clicked[0] ?? 60, {
                  tempo: settings.tempo,
                  beats: 1,
                }),
              )
            }
          />
        </>
      )}
    </li>
  )
}
