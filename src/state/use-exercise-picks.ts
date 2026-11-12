import { useEffect, useState } from 'react'
import {
  loadExerciseIndex,
  pickExerciseIdsForSkills,
  type ExercisePickOptions,
} from '../content/exercise-catalog'

export type ExercisePicksStatus = 'loading' | 'ready' | 'error'

export interface ExercisePicksState {
  status: ExercisePicksStatus
  exerciseIds: string[]
  error: Error | null
}

function toError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value))
}

const EMPTY: ExercisePicksState = {
  status: 'ready',
  exerciseIds: [],
  error: null,
}

/**
 * Resuelve ejercicios para un conjunto de habilidades.
 *
 * El índice se importa en un chunk aparte. Si las habilidades cambian (por
 * ejemplo, al avanzar la cola de repaso), la selección se vuelve a calcular.
 */
export function useExercisePicks(
  skillIds: readonly string[],
  options: ExercisePickOptions = {},
): ExercisePicksState {
  const [state, setState] = useState<ExercisePicksState>(() =>
    skillIds.length === 0 ? EMPTY : { status: 'loading', exerciseIds: [], error: null },
  )
  const skillKey = skillIds.join('|')
  const { perSkill, maxTotal } = options

  useEffect(() => {
    if (skillIds.length === 0) {
      setState(EMPTY)
      return
    }

    let cancelled = false
    setState({ status: 'loading', exerciseIds: [], error: null })

    loadExerciseIndex().then(
      (index) => {
        if (cancelled) return
        setState({
          status: 'ready',
          exerciseIds: pickExerciseIdsForSkills(index, skillIds, {
            perSkill,
            maxTotal,
          }),
          error: null,
        })
      },
      (error: unknown) => {
        if (cancelled) return
        setState({
          status: 'error',
          exerciseIds: [],
          error: toError(error),
        })
      },
    )

    return () => {
      cancelled = true
    }
    // `skillKey` resume el contenido del arreglo sin obligar a memorizarlo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skillKey, perSkill, maxTotal])

  return state
}
