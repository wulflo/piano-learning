import { LessonSchema, type Lesson } from '../schemas'

/**
 * Carga diferida de una lección completa.
 *
 * El índice del curso solo guarda metadatos; las lecciones con secciones,
 * pentagramas y tareas se cargan al abrirlas. `import.meta.glob` deja que Vite
 * genere un chunk por archivo y el resto de la app no paga ese peso.
 *
 * Los archivos de `content/lessons` siguen la convención `mX-YY.json` para el
 * id `lesson.mX-YY`. `tests/lesson-content.test.ts` comprueba que cada lección
 * del índice tiene su archivo y que el JSON valida con `LessonSchema`.
 */

const lessonModules = import.meta.glob('../../content/lessons/*.json')

const LESSON_ID_PATTERN = /^lesson\.([a-z0-9]+-[a-z0-9]+)$/

/** Ruta relativa del JSON de una lección, o `null` si el id no es válido. */
export function lessonContentPath(lessonId: string): string | null {
  const match = LESSON_ID_PATTERN.exec(lessonId)
  if (match === null) return null
  return `../../content/lessons/${match[1]}.json`
}

/** Indica si una lección tiene un archivo en `content/lessons`. */
export function hasLessonContent(lessonId: string): boolean {
  const path = lessonContentPath(lessonId)
  return path !== null && lessonModules[path] !== undefined
}

/** Carga y valida el JSON de una lección. */
export async function loadLesson(lessonId: string): Promise<Lesson> {
  const path = lessonContentPath(lessonId)
  if (path === null) {
    throw new Error(`ID de lección inválido: ${lessonId}`)
  }

  const loader = lessonModules[path]
  if (loader === undefined) {
    throw new Error(`La lección ${lessonId} no está en content/lessons`)
  }

  const loaded: unknown = await loader()
  const data =
    typeof loaded === 'object' && loaded !== null && 'default' in loaded
      ? (loaded as { default: unknown }).default
      : loaded

  return LessonSchema.parse(data)
}
