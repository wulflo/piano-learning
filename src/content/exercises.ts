import { ExerciseSchema, type Exercise } from '../schemas'

/**
 * Carga diferida de ejercicios.
 *
 * Los ejercicios viven en archivos JSON independientes para que cada uno tenga
 * su propio chunk. Los nombres de archivo no siguen una única convención: casi
 * todos son `id + .json`, pero algunos ids comparten archivo (`ex.m0-01.a` está
 * en `m0-01.json`). Por eso se prueban rutas candidatas y se valida que el id
 * cargado coincida con el pedido.
 */

const exerciseModules = import.meta.glob('../../content/exercises/*.json')

const EXERCISE_PREFIX = 'ex.'
const SPLIT_PATTERN = /[.-]/

/**
 * Rutas posibles de un ejercicio, en orden de preferencia.
 *
 * - `ex.m2-07.a` → `ex.m2-07.a.json`
 * - `ex.m1-01.a` → `m1-01.a.json`
 * - `ex.m0-01.a` → `m0-01.json` (archivo compartido)
 */
export function exerciseContentPaths(exerciseId: string): string[] {
  if (!/^[a-z0-9][a-z0-9._-]*$/.test(exerciseId)) return []

  const paths: string[] = []
  const add = (path: string) => {
    if (!paths.includes(path)) paths.push(path)
  }

  add(`../../content/exercises/${exerciseId}.json`)

  const withoutPrefix = exerciseId.startsWith(EXERCISE_PREFIX)
    ? exerciseId.slice(EXERCISE_PREFIX.length)
    : exerciseId
  if (withoutPrefix !== exerciseId) {
    add(`../../content/exercises/${withoutPrefix}.json`)
  }

  const parts = withoutPrefix.split(SPLIT_PATTERN).filter(Boolean)
  if (parts.length > 2) {
    add(`../../content/exercises/${parts.slice(0, 2).join('-')}.json`)
  }

  return paths
}

/** Indica si un ejercicio tiene un archivo en `content/exercises`. */
export function hasExerciseContent(exerciseId: string): boolean {
  return exerciseContentPaths(exerciseId).some(
    (path) => exerciseModules[path] !== undefined,
  )
}

/** Carga y valida el JSON de un ejercicio. */
export async function loadExercise(exerciseId: string): Promise<Exercise> {
  const paths = exerciseContentPaths(exerciseId)
  if (paths.length === 0) {
    throw new Error(`ID de ejercicio inválido: ${exerciseId}`)
  }

  for (const path of paths) {
    const loader = exerciseModules[path]
    if (loader === undefined) continue

    const loaded: unknown = await loader()
    const data =
      typeof loaded === 'object' && loaded !== null && 'default' in loaded
        ? (loaded as { default: unknown }).default
        : loaded
    const exercise = ExerciseSchema.parse(data)
    if (exercise.id !== exerciseId) {
      throw new Error(
        `El archivo ${path} contiene ${exercise.id}, no ${exerciseId}`,
      )
    }
    return exercise
  }

  throw new Error(`El ejercicio ${exerciseId} no está en content/exercises`)
}

/** Carga varios ejercicios en orden, sin duplicar lecturas. */
export async function loadExercises(
  exerciseIds: readonly string[],
): Promise<Exercise[]> {
  const unique = [...new Set(exerciseIds)]
  return Promise.all(unique.map((id) => loadExercise(id)))
}
