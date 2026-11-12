import rawIndex from './course-index.json'
import {
  CourseIndexSchema,
  type CourseIndex,
  type CourseIndexLesson,
  type CourseIndexModule,
} from '../schemas'
import type { LessonGraphNode } from '../state/lesson-progress'

/**
 * Índice del curso listo para la interfaz.
 *
 * El JSON se genera con `npm run index:content` y se valida al importarlo: un
 * archivo corrupto o desactualizado falla al cargar la app en vez de mostrar un
 * mapa incompleto.
 */
export const COURSE_INDEX: CourseIndex = CourseIndexSchema.parse(rawIndex)

export const COURSE_MODULES: readonly CourseIndexModule[] = COURSE_INDEX.modules
export const COURSE_LESSONS: readonly CourseIndexLesson[] = COURSE_INDEX.lessons

const lessonsById = new Map<string, CourseIndexLesson>(
  COURSE_LESSONS.map((lesson) => [lesson.id, lesson] as const),
)
const modulesById = new Map<string, CourseIndexModule>(
  COURSE_MODULES.map((module) => [module.id, module] as const),
)

/** Grafo mínimo para `computeLessonUnlocks`. */
export const COURSE_LESSON_GRAPH: readonly LessonGraphNode[] =
  COURSE_LESSONS.map((lesson) => ({
    id: lesson.id,
    prerequisites: lesson.prerequisites,
    skillIds: lesson.skillIds,
  }))

/** Busca una lección del índice. */
export function findCourseLesson(
  lessonId: string,
): CourseIndexLesson | undefined {
  return lessonsById.get(lessonId)
}

/** Busca un módulo del índice. */
export function findCourseModule(
  moduleId: string,
): CourseIndexModule | undefined {
  return modulesById.get(moduleId)
}

/** Lecciones de un módulo en el orden del índice. */
export function lessonsForModule(moduleId: string): CourseIndexLesson[] {
  const module = modulesById.get(moduleId)
  if (module === undefined) return []
  return module.lessonIds
    .map((lessonId) => lessonsById.get(lessonId))
    .filter((lesson): lesson is CourseIndexLesson => lesson !== undefined)
}
