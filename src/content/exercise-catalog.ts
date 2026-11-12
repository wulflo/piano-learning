import {
  ExerciseIndexSchema,
  type ExerciseIndex,
  type ExerciseIndexEntry,
} from '../schemas/exercise-index'

/**
 * Selección de ejercicios por habilidad.
 *
 * El índice se carga de forma diferida: las pantallas de repaso y práctica
 * solo pagan su tamaño cuando realmente muestran ejercicios. La selección es
 * determinista y reparte las dificultades para no proponer siempre los mismos
 * tres ejercicios de una habilidad con muchos ítems.
 */

let cached: Promise<ExerciseIndex> | null = null

/** Carga y valida el índice de ejercicios una sola vez. */
export function loadExerciseIndex(): Promise<ExerciseIndex> {
  cached ??= import('./exercise-index.json').then((module) =>
    ExerciseIndexSchema.parse(module.default),
  )
  return cached
}

export interface ExercisePickOptions {
  /** Cantidad máxima de ejercicios por habilidad. */
  perSkill?: number
  /** Tope total de ejercicios devueltos. */
  maxTotal?: number
}

const DEFAULT_PER_SKILL = 3

function spread<T>(items: readonly T[], count: number): T[] {
  if (count <= 0 || items.length === 0) return []
  if (count >= items.length) return [...items]
  if (count === 1) return [items[Math.floor(items.length / 2)]]

  const picked: T[] = []
  const used = new Set<number>()
  for (let index = 0; index < count; index += 1) {
    const position = Math.round((index * (items.length - 1)) / (count - 1))
    if (!used.has(position)) {
      used.add(position)
      picked.push(items[position])
    }
  }
  return picked
}

/**
 * Elige ejercicios para las habilidades indicadas, en el orden recibido.
 *
 * Cada habilidad aporta hasta `perSkill` ejercicios ordenados por dificultad y
 * repartidos en el rango disponible. Las habilidades sin ejercicios se omiten
 * sin romper la selección.
 */
export function pickExercisesForSkills(
  index: ExerciseIndex,
  skillIds: readonly string[],
  options: ExercisePickOptions = {},
): ExerciseIndexEntry[] {
  const perSkill = Math.max(1, Math.floor(options.perSkill ?? DEFAULT_PER_SKILL))
  const maxTotal = Math.max(
    0,
    Math.floor(options.maxTotal ?? Number.POSITIVE_INFINITY),
  )
  if (maxTotal === 0) return []

  const bySkill = new Map<string, ExerciseIndexEntry[]>()
  for (const exercise of index.exercises) {
    const list = bySkill.get(exercise.skillId) ?? []
    list.push(exercise)
    bySkill.set(exercise.skillId, list)
  }

  const picked: ExerciseIndexEntry[] = []
  const seen = new Set<string>()

  for (const skillId of skillIds) {
    const remaining = maxTotal - picked.length
    if (remaining <= 0) break

    const candidates = (bySkill.get(skillId) ?? [])
      .slice()
      .sort(
        (a, b) =>
          a.difficulty - b.difficulty || a.id.localeCompare(b.id),
      )
    if (candidates.length === 0) continue

    const count = Math.min(perSkill, remaining, candidates.length)
    for (const exercise of spread(candidates, count)) {
      if (seen.has(exercise.id)) continue
      seen.add(exercise.id)
      picked.push(exercise)
    }
  }

  return picked
}

/** Atajo que devuelve solo los ids para pasarlos a `ExercisePlayer`. */
export function pickExerciseIdsForSkills(
  index: ExerciseIndex,
  skillIds: readonly string[],
  options: ExercisePickOptions = {},
): string[] {
  return pickExercisesForSkills(index, skillIds, options).map(
    (exercise) => exercise.id,
  )
}
