import type {
  ContentBundle,
  CourseIndex,
  CourseIndexLesson,
} from '../../src/schemas'
import { CourseIndexSchema } from '../../src/schemas'

/**
 * Construye el índice del curso desde el contenido validado.
 *
 * Es determinista: módulos por `order` y lecciones por id, sin fechas ni rutas
 * absolutas. El script `npm run index:content` escribe el resultado en
 * `src/content/course-index.json` y un test comprueba que el archivo commiteado
 * coincide con el contenido actual.
 */
export function buildCourseIndex(bundle: ContentBundle): CourseIndex {
  const lessons: CourseIndexLesson[] = [...bundle.lessons]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((lesson) => ({
      id: lesson.id,
      moduleId: lesson.moduleId,
      slug: lesson.slug,
      titleEs: lesson.titleEs,
      // Hasta F2-075 el inglés puede faltar: se usa el español como respaldo
      // para que la interfaz nunca muestre un hueco.
      titleEn: lesson.titleEn ?? lesson.titleEs,
      summaryEs: lesson.summaryEs,
      summaryEn: lesson.summaryEn ?? lesson.summaryEs,
      minutes: lesson.minutes,
      optional: lesson.optional,
      prerequisites: [...lesson.prerequisites],
      skillIds: [...lesson.skillIds],
      status: lesson.status,
    }))

  const modules = [...bundle.modules]
    .sort((a, b) => a.order - b.order)
    .map((module) => ({
      id: module.id,
      order: module.order,
      titleEs: module.titleEs,
      titleEn: module.titleEn,
      summaryEs: module.summaryEs,
      summaryEn: module.summaryEn,
      optional: module.optional,
      lessonIds: lessons
        .filter((lesson) => lesson.moduleId === module.id)
        .map((lesson) => lesson.id),
    }))

  return CourseIndexSchema.parse({ schemaVersion: 1, modules, lessons })
}
