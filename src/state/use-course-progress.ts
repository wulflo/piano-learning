import { useCallback, useEffect, useState } from 'react'
import { COURSE_INDEX, COURSE_LESSON_GRAPH } from '../content/course'
import { summarizeCourse, type CourseSummary } from './course-progress'
import { loadLessonUnlocks } from './lesson-progress'
import { useProgress } from './progress-context'

/**
 * Resumen del curso con el progreso guardado.
 *
 * Espera a que `ProgressProvider` abra la base, calcula los desbloqueos y los
 * agrupa por módulo. La pantalla que lo consume debe tratar `loading` y `error`
 * antes de mostrar el mapa: nunca se inventan estados.
 */

export type CourseProgressStatus = 'loading' | 'ready' | 'error'

export interface CourseProgressState {
  status: CourseProgressStatus
  summary: CourseSummary | null
  error: Error | null
  /** Reintenta la lectura o reabre la base si estaba en error. */
  reload: () => void
}

function toError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value))
}

export function useCourseProgress(): CourseProgressState {
  const {
    status: databaseStatus,
    repositories,
    error: databaseError,
    reload: reloadDatabase,
  } = useProgress()
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<Omit<CourseProgressState, 'reload'>>({
    status: 'loading',
    summary: null,
    error: null,
  })

  useEffect(() => {
    if (databaseStatus === 'loading') {
      setState({ status: 'loading', summary: null, error: null })
      return
    }
    if (databaseStatus === 'error') {
      setState({ status: 'error', summary: null, error: databaseError })
      return
    }
    if (repositories === null) return

    let cancelled = false
    // Al recargar se conserva el resumen anterior para no hacer parpadear la
    // pantalla; el primer cálculo sí muestra `loading`.
    setState((current) =>
      current.summary === null
        ? { status: 'loading', summary: null, error: null }
        : { ...current, status: 'ready', error: null },
    )

    loadLessonUnlocks(repositories, COURSE_LESSON_GRAPH).then(
      (unlocks) => {
        if (cancelled) return
        setState({
          status: 'ready',
          summary: summarizeCourse(COURSE_INDEX, unlocks),
          error: null,
        })
      },
      (error: unknown) => {
        if (cancelled) return
        setState({ status: 'error', summary: null, error: toError(error) })
      },
    )

    return () => {
      cancelled = true
    }
  }, [attempt, databaseError, databaseStatus, repositories])

  const reload = useCallback(() => {
    if (databaseStatus === 'error') reloadDatabase()
    setAttempt((current) => current + 1)
  }, [databaseStatus, reloadDatabase])

  return { ...state, reload }
}
