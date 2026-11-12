import { z } from 'zod'
import { ModuleIdSchema } from './content'
import { IdSchema } from './primitives'

/**
 * Índice compacto del curso para la interfaz.
 *
 * Se genera desde `content/` con `npm run index:content` y se valida al
 * importarlo. Incluye solo los metadatos que necesita el mapa del curso: así el
 * bundle inicial no arrastra todas las lecciones completas.
 */

export const CourseIndexLessonSchema = z.object({
  id: IdSchema,
  moduleId: ModuleIdSchema,
  slug: z.string().min(1),
  titleEs: z.string().min(1),
  titleEn: z.string().min(1),
  summaryEs: z.string().min(1),
  summaryEn: z.string().min(1),
  minutes: z.number().int().positive(),
  /** Lección de ampliación: no bloquea la ruta obligatoria. */
  optional: z.boolean().optional(),
  prerequisites: z.array(IdSchema),
  skillIds: z.array(IdSchema),
  status: z.enum(['draft', 'published']),
})
export type CourseIndexLesson = z.infer<typeof CourseIndexLessonSchema>

export const CourseIndexModuleSchema = z.object({
  id: ModuleIdSchema,
  order: z.number().int().min(0),
  titleEs: z.string().min(1),
  titleEn: z.string().min(1),
  summaryEs: z.string().min(1),
  summaryEn: z.string().min(1),
  optional: z.boolean(),
  lessonIds: z.array(IdSchema),
})
export type CourseIndexModule = z.infer<typeof CourseIndexModuleSchema>

export const CourseIndexSchema = z
  .object({
    schemaVersion: z.literal(1),
    modules: z.array(CourseIndexModuleSchema),
    lessons: z.array(CourseIndexLessonSchema),
  })
  .superRefine((index, context) => {
    const lessonIds = new Set(index.lessons.map((lesson) => lesson.id))
    for (const module of index.modules) {
      for (const lessonId of module.lessonIds) {
        if (!lessonIds.has(lessonId)) {
          context.addIssue({
            code: 'custom',
            path: ['modules', module.id, 'lessonIds'],
            message: `La lección ${lessonId} no existe en el índice`,
          })
        }
      }
    }
  })
export type CourseIndex = z.infer<typeof CourseIndexSchema>
