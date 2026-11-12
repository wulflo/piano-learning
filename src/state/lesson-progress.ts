import type {
  LessonProgress,
  LessonProgressRecord,
  SkillProgress,
} from '../schemas'
import type { ProgressRepositories } from './repositories'

/**
 * Progreso por lección y desbloqueo por prerrequisitos.
 *
 * Una lección se desbloquea cuando todos sus prerrequisitos están dominados.
 * Un prerrequisito se considera dominado si la lección está completada o si
 * todas sus habilidades alcanzan el umbral de maestría configurado. El estado
 * `in-progress` o `completed` de una lección siempre prevalece: el progreso ya
 * registrado no se vuelve a bloquear.
 *
 * El cálculo es puro y determinista; la persistencia se hace a través de los
 * repositorios de Dexie.
 */

export const DEFAULT_MASTERY_THRESHOLD = 0.8

export type LessonUnlockStatus = 'locked' | 'available' | 'in-progress' | 'completed'

/** Datos mínimos del grafo de lecciones que necesita el cálculo. */
export interface LessonGraphNode {
  id: string
  prerequisites: readonly string[]
  skillIds?: readonly string[]
}

export interface LessonUnlock {
  id: string
  status: LessonUnlockStatus
  /** Prerrequisitos que todavía no están dominados; vacío si está desbloqueada. */
  missingPrerequisites: string[]
}

export interface LessonUnlockInput {
  lessons?: Readonly<Record<string, LessonProgress>>
  skills?: Readonly<Record<string, SkillProgress>>
}

export interface LessonUnlockOptions {
  /** Maestría mínima (0–1) para dar por dominada una habilidad; por defecto 0,8. */
  masteryThreshold?: number
}

export interface LessonActionOptions extends LessonUnlockOptions {
  /** Reloj inyectable para que los tests no dependan del reloj real. */
  now?: Date
}

export class LessonLockedError extends Error {
  readonly lessonId: string
  readonly missingPrerequisites: string[]

  constructor(lessonId: string, missingPrerequisites: string[]) {
    super(
      `La lección ${lessonId} está bloqueada; faltan: ${missingPrerequisites.join(', ')}`,
    )
    this.name = 'LessonLockedError'
    this.lessonId = lessonId
    this.missingPrerequisites = missingPrerequisites
  }
}

export class UnknownLessonError extends Error {
  readonly lessonId: string

  constructor(lessonId: string) {
    super(`La lección ${lessonId} no existe en el grafo`)
    this.name = 'UnknownLessonError'
    this.lessonId = lessonId
  }
}

function normalizeThreshold(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) {
    return DEFAULT_MASTERY_THRESHOLD
  }
  return Math.min(1, Math.max(0, value))
}

function indexById<T extends { id: string }>(rows: readonly T[]): Record<string, T> {
  const indexed: Record<string, T> = {}
  for (const row of rows) {
    indexed[row.id] = row
  }
  return indexed
}

/** Calcula el estado de cada lección del grafo. */
export function computeLessonUnlocks(
  graph: readonly LessonGraphNode[],
  input: LessonUnlockInput = {},
  options: LessonUnlockOptions = {},
): LessonUnlock[] {
  const progress = input.lessons ?? {}
  const skills = input.skills ?? {}
  const threshold = normalizeThreshold(options.masteryThreshold)
  const nodes = new Map(graph.map((node) => [node.id, node]))
  const masteredCache = new Map<string, boolean>()

  const isMastered = (lessonId: string): boolean => {
    const cached = masteredCache.get(lessonId)
    if (cached !== undefined) return cached

    const node = nodes.get(lessonId)
    let mastered = false
    if (node) {
      const persisted = progress[lessonId]
      if (persisted?.status === 'completed') {
        mastered = true
      } else if (node.skillIds !== undefined && node.skillIds.length > 0) {
        mastered = node.skillIds.every(
          (skillId) => (skills[skillId]?.mastery ?? 0) >= threshold,
        )
      }
    }

    masteredCache.set(lessonId, mastered)
    return mastered
  }

  return graph.map((node) => {
    const persisted = progress[node.id]
    if (persisted?.status === 'completed') {
      return { id: node.id, status: 'completed', missingPrerequisites: [] }
    }
    if (persisted?.status === 'in-progress') {
      return { id: node.id, status: 'in-progress', missingPrerequisites: [] }
    }

    const missingPrerequisites = node.prerequisites.filter(
      (prerequisite) => !isMastered(prerequisite),
    )
    return {
      id: node.id,
      status: missingPrerequisites.length === 0 ? 'available' : 'locked',
      missingPrerequisites,
    }
  })
}

/** Lee el progreso persistido y calcula el estado de las lecciones. */
export async function loadLessonUnlocks(
  repositories: ProgressRepositories,
  graph: readonly LessonGraphNode[],
  options: LessonUnlockOptions = {},
): Promise<LessonUnlock[]> {
  const [lessons, skills] = await Promise.all([
    repositories.lessons.all(),
    repositories.skills.all(),
  ])

  return computeLessonUnlocks(
    graph,
    { lessons: indexById(lessons), skills: indexById(skills) },
    options,
  )
}

async function requireUnlocked(
  repositories: ProgressRepositories,
  graph: readonly LessonGraphNode[],
  lessonId: string,
  options: LessonUnlockOptions,
): Promise<LessonUnlock> {
  const unlocks = await loadLessonUnlocks(repositories, graph, options)
  const state = unlocks.find((unlock) => unlock.id === lessonId)
  if (!state) throw new UnknownLessonError(lessonId)
  if (state.status === 'locked') {
    throw new LessonLockedError(lessonId, state.missingPrerequisites)
  }
  return state
}

/** Marca una lección como en curso; falla si está bloqueada. */
export async function startLesson(
  repositories: ProgressRepositories,
  graph: readonly LessonGraphNode[],
  lessonId: string,
  options: LessonActionOptions = {},
): Promise<LessonProgressRecord> {
  await requireUnlocked(repositories, graph, lessonId, options)

  const existing = await repositories.lessons.get(lessonId)
  if (existing?.status === 'completed') {
    return repositories.lessons.put(lessonId, existing)
  }

  return repositories.lessons.put(lessonId, {
    status: 'in-progress',
    secondsSpent: existing?.secondsSpent ?? 0,
  })
}

/** Marca una lección como completada; falla si está bloqueada. */
export async function completeLesson(
  repositories: ProgressRepositories,
  graph: readonly LessonGraphNode[],
  lessonId: string,
  options: LessonActionOptions = {},
): Promise<LessonProgressRecord> {
  await requireUnlocked(repositories, graph, lessonId, options)

  const existing = await repositories.lessons.get(lessonId)
  if (existing?.status === 'completed') {
    return repositories.lessons.put(lessonId, existing)
  }

  return repositories.lessons.put(lessonId, {
    status: 'completed',
    completedAt: (options.now ?? new Date()).toISOString(),
    secondsSpent: existing?.secondsSpent ?? 0,
  })
}
