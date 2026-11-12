import { z } from 'zod'
import { IdSchema } from './primitives'

/**
 * Índice liviano de ejercicios para elegir repasos sin cargar cada JSON.
 *
 * El archivo `src/content/exercise-index.json` se genera con
 * `npm run index:content` a partir del contenido validado. Solo guarda los
 * datos necesarios para seleccionar ejercicios por habilidad; el enunciado y
 * las opciones siguen cargándose bajo demanda al abrir el reproductor.
 */
export const ExerciseIndexEntrySchema = z.object({
  id: IdSchema,
  skillId: IdSchema,
  difficulty: z.number().int().min(1).max(5),
})
export type ExerciseIndexEntry = z.infer<typeof ExerciseIndexEntrySchema>

export const ExerciseIndexSchema = z.object({
  schemaVersion: z.literal(1),
  exercises: z.array(ExerciseIndexEntrySchema),
})
export type ExerciseIndex = z.infer<typeof ExerciseIndexSchema>
