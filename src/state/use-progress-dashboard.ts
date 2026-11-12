import { useCallback, useEffect, useState } from 'react'
import { findContentSkill } from '../content/skills'
import {
  buildProgressDashboard,
  type ProgressDashboard,
} from './progress-dashboard'
import { useProgress } from './progress-context'

/**
 * Panel de progreso con datos reales.
 *
 * Espera a que `ProgressProvider` abra la base y lee en paralelo el historial,
 * el perfil, las sesiones y las lecciones. Conserva el panel anterior mientras
 * recarga para no hacer parpadear las métricas; el primer cálculo sí muestra
 * `loading`.
 */

export type ProgressDashboardStatus = 'loading' | 'ready' | 'error'

export interface ProgressDashboardState {
  status: ProgressDashboardStatus
  dashboard: ProgressDashboard | null
  error: Error | null
  reload: () => void
}

function toError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value))
}

export function useProgressDashboard(): ProgressDashboardState {
  const {
    status: databaseStatus,
    repositories,
    error: databaseError,
    reload: reloadDatabase,
  } = useProgress()
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<Omit<ProgressDashboardState, 'reload'>>({
    status: 'loading',
    dashboard: null,
    error: null,
  })

  useEffect(() => {
    if (databaseStatus === 'loading') {
      setState({ status: 'loading', dashboard: null, error: null })
      return
    }
    if (databaseStatus === 'error') {
      setState({ status: 'error', dashboard: null, error: databaseError })
      return
    }
    if (repositories === null) return

    let cancelled = false
    setState((current) =>
      current.dashboard === null
        ? { status: 'loading', dashboard: null, error: null }
        : { ...current, status: 'ready', error: null },
    )

    Promise.all([
      repositories.reviews.all(),
      repositories.profile.get(),
      repositories.sessions.all(),
      repositories.lessons.all(),
    ]).then(
      ([reviews, profile, sessions, lessons]) => {
        if (cancelled) return
        setState({
          status: 'ready',
          dashboard: buildProgressDashboard({
            reviews,
            profile,
            sessions,
            lessons,
            kindForItem: (itemId) => findContentSkill(itemId)?.kind,
          }),
          error: null,
        })
      },
      (error: unknown) => {
        if (cancelled) return
        setState({ status: 'error', dashboard: null, error: toError(error) })
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
