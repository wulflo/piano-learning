import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { createProgressDatabase } from './db'
import {
  createProgressRepositories,
  type ProgressRepositories,
} from './repositories'

/**
 * Acceso compartido a los repositorios de progreso.
 *
 * Abre la base una sola vez por árbol de React y la cierra al desmontar. Las
 * pantallas consumen `repositories` cuando el estado es `ready`; mientras tanto
 * muestran una carga o un error con reintento.
 */

export type ProgressContextStatus = 'loading' | 'ready' | 'error'

export interface ProgressContextValue {
  status: ProgressContextStatus
  repositories: ProgressRepositories | null
  error: Error | null
  /** Vuelve a abrir la base tras un error. */
  reload: () => void
}

const ProgressContext = createContext<ProgressContextValue | null>(null)

export interface ProgressProviderProps {
  children: ReactNode
  /** Nombre de la base; por defecto, el de producción. Para tests aislados. */
  databaseName?: string
}

function toError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value))
}

export function ProgressProvider({
  children,
  databaseName,
}: ProgressProviderProps) {
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<Omit<ProgressContextValue, 'reload'>>({
    status: 'loading',
    repositories: null,
    error: null,
  })

  useEffect(() => {
    let cancelled = false
    let repositories: ProgressRepositories | null = null

    setState({ status: 'loading', repositories: null, error: null })

    try {
      const database = createProgressDatabase(
        databaseName === undefined ? {} : { name: databaseName },
      )
      repositories = createProgressRepositories(database)

      database.open().then(
        () => {
          if (!cancelled) {
            setState({ status: 'ready', repositories, error: null })
          }
        },
        (error: unknown) => {
          if (!cancelled) {
            setState({
              status: 'error',
              repositories: null,
              error: toError(error),
            })
          }
        },
      )
    } catch (error) {
      setState({ status: 'error', repositories: null, error: toError(error) })
    }

    return () => {
      cancelled = true
      repositories?.close()
    }
  }, [attempt, databaseName])

  const reload = useCallback(() => {
    setAttempt((current) => current + 1)
  }, [])

  const value = useMemo<ProgressContextValue>(
    () => ({ ...state, reload }),
    [state, reload],
  )

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  )
}

/** Repositorios de progreso del árbol actual. */
export function useProgress(): ProgressContextValue {
  const value = useContext(ProgressContext)
  if (value === null) {
    throw new Error('useProgress debe usarse dentro de ProgressProvider')
  }
  return value
}
