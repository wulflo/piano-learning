import { useEffect, useId } from 'react'
import { useAudioEngine } from '../audio/useAudioEngine'
import { useExercisePicks } from '../state/use-exercise-picks'
import { useSettings } from '../state/settings'
import { ExercisePlayer } from './ExercisePlayer'

export interface ExerciseSuggestionsProps {
  /** Habilidades cuyos ejercicios se quieren repasar. */
  skillIds: readonly string[]
  /** Cantidad máxima de ejercicios por habilidad. */
  perSkill?: number
  /** Tope total de ejercicios mostrados. */
  maxTotal?: number
  /** Registra los intentos como repaso FSRS. */
  recordAttempts?: boolean
}

/**
 * Bloque de ejercicios sugeridos para repaso o práctica.
 *
 * Reutiliza `ExercisePlayer` con un motor de audio propio, así la pantalla que
 * lo contiene no necesita montar otro reproductor. Si el índice no encuentra
 * ejercicios para las habilidades pedidas, muestra un estado honesto en vez de
 * dejar solo un contador.
 */
export function ExerciseSuggestions({
  skillIds,
  perSkill,
  maxTotal,
  recordAttempts = true,
}: ExerciseSuggestionsProps) {
  const { settings, t } = useSettings()
  const { engine, state: audio } = useAudioEngine()
  const picks = useExercisePicks(skillIds, { perSkill, maxTotal })
  const titleId = useId()

  useEffect(() => {
    engine.setVolume(settings.volumeDb)
  }, [engine, settings.volumeDb])

  useEffect(() => {
    engine.setTempo(settings.tempo)
  }, [engine, settings.tempo])

  useEffect(() => () => engine.stop(), [engine])

  return (
    <section
      className="panel exercise-suggestions"
      aria-labelledby={titleId}
    >
      <h2 id={titleId}>{t('exercises.suggested.title')}</h2>
      <p className="muted">{t('exercises.suggested.lead')}</p>

      {picks.status === 'loading' && (
        <p className="muted" role="status">
          {t('exercises.suggested.loading')}
        </p>
      )}

      {picks.status === 'error' && (
        <p className="error-panel" role="alert">
          {t('exercises.suggested.error', {
            message: picks.error?.message ?? '',
          })}
        </p>
      )}

      {picks.status === 'ready' && picks.exerciseIds.length === 0 && (
        <p className="muted">{t('exercises.suggested.empty')}</p>
      )}

      {picks.status === 'ready' && picks.exerciseIds.length > 0 && (
        <ExercisePlayer
          key={picks.exerciseIds.join('|')}
          exerciseIds={picks.exerciseIds}
          engine={engine}
          audio={audio}
          recordAttempts={recordAttempts}
          showLessonLink={false}
        />
      )}
    </section>
  )
}
