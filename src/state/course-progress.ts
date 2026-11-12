import type {
  CourseIndex,
  CourseIndexLesson,
  CourseIndexModule,
} from '../schemas'
import type { LessonUnlock, LessonUnlockStatus } from './lesson-progress'

/**
 * Resumen del curso para el mapa visual.
 *
 * `computeLessonUnlocks` ya sabe qué lección está bloqueada, disponible, en
 * curso o completada. Este módulo agrupa ese estado por módulo y calcula los
 * contadores que muestra la portada. Es puro y determinista: recibe el índice y
 * los desbloqueos, y no toca la base ni el reloj.
 */

/** Estado visible de un módulo. `empty` evita inventar progreso. */
export type CourseModuleStatus =
  | 'locked'
  | 'available'
  | 'in-progress'
  | 'completed'
  | 'empty'

export interface CourseLessonSummary {
  id: string
  status: LessonUnlockStatus
  missingPrerequisites: string[]
}

export interface CourseModuleSummary {
  id: string
  order: number
  titleEs: string
  titleEn: string
  summaryEs: string
  summaryEn: string
  optional: boolean
  status: CourseModuleStatus
  lessonIds: string[]
  lessons: CourseLessonSummary[]
  completedLessons: number
  totalLessons: number
}

export interface CourseSummary {
  modules: CourseModuleSummary[]
  completedLessons: number
  totalLessons: number
  completedModules: number
  totalModules: number
  /** Lección en curso o, si no hay ninguna, la primera disponible. */
  nextLessonId: string | null
}

function lessonSummary(
  lesson: CourseIndexLesson,
  unlocks: ReadonlyMap<string, LessonUnlock>,
): CourseLessonSummary {
  const unlock = unlocks.get(lesson.id)
  return {
    id: lesson.id,
    status: unlock?.status ?? 'locked',
    missingPrerequisites: unlock?.missingPrerequisites ?? [...lesson.prerequisites],
  }
}

function moduleStatus(lessons: readonly CourseLessonSummary[]): CourseModuleStatus {
  if (lessons.length === 0) return 'empty'

  const completed = lessons.filter((lesson) => lesson.status === 'completed')
  if (completed.length === lessons.length) return 'completed'
  if (
    completed.length > 0 ||
    lessons.some((lesson) => lesson.status === 'in-progress')
  ) {
    return 'in-progress'
  }
  if (lessons.some((lesson) => lesson.status === 'available')) return 'available'
  return 'locked'
}

function summarizeModule(
  module: CourseIndexModule,
  lessonsById: ReadonlyMap<string, CourseIndexLesson>,
  unlocks: ReadonlyMap<string, LessonUnlock>,
): CourseModuleSummary {
  const lessons = module.lessonIds
    .map((lessonId) => lessonsById.get(lessonId))
    .filter((lesson): lesson is CourseIndexLesson => lesson !== undefined)
    .map((lesson) => lessonSummary(lesson, unlocks))

  return {
    id: module.id,
    order: module.order,
    titleEs: module.titleEs,
    titleEn: module.titleEn,
    summaryEs: module.summaryEs,
    summaryEn: module.summaryEn,
    optional: module.optional,
    status: moduleStatus(lessons),
    lessonIds: lessons.map((lesson) => lesson.id),
    lessons,
    completedLessons: lessons.filter((lesson) => lesson.status === 'completed')
      .length,
    totalLessons: lessons.length,
  }
}

/**
 * Agrupa los desbloqueos por módulo y calcula el avance global.
 *
 * Los módulos se ordenan por `order` y las lecciones respetan el orden del
 * índice. `nextLessonId` prefiere una lección ya empezada; si no hay, elige la
 * primera obligatoria disponible y solo recurre a una opcional cuando no queda
 * ninguna obligatoria.
 */
export function summarizeCourse(
  index: CourseIndex,
  unlocks: readonly LessonUnlock[],
): CourseSummary {
  const unlockMap = new Map(unlocks.map((unlock) => [unlock.id, unlock] as const))
  const lessonsById = new Map(
    index.lessons.map((lesson) => [lesson.id, lesson] as const),
  )

  const modules = [...index.modules]
    .sort((a, b) => a.order - b.order)
    .map((module) => summarizeModule(module, lessonsById, unlockMap))

  const allLessons = modules.flatMap((module) => module.lessons)
  const isOptional = (lessonId: string): boolean =>
    lessonsById.get(lessonId)?.optional === true
  const inProgress = allLessons.find((lesson) => lesson.status === 'in-progress')
  // Las lecciones opcionales no se proponen como siguiente paso salvo que el
  // alumno ya las haya empezado o no quede ninguna obligatoria disponible.
  const availableRequired = allLessons.find(
    (lesson) => lesson.status === 'available' && !isOptional(lesson.id),
  )
  const availableOptional = allLessons.find(
    (lesson) => lesson.status === 'available' && isOptional(lesson.id),
  )

  return {
    modules,
    completedLessons: allLessons.filter((lesson) => lesson.status === 'completed')
      .length,
    totalLessons: allLessons.length,
    completedModules: modules.filter((module) => module.status === 'completed')
      .length,
    totalModules: modules.length,
    nextLessonId:
      inProgress?.id ?? availableRequired?.id ?? availableOptional?.id ?? null,
  }
}
