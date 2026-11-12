import type { ContentBundle, ExerciseIndex } from '../../src/schemas'
import { ExerciseIndexSchema } from '../../src/schemas'

/**
 * Construye el índice mínimo de ejercicios desde el contenido validado.
 *
 * El orden es determinista por id. La app usa este índice para elegir unos
 * pocos ejercicios por habilidad sin cargar los 720 JSON completos.
 */
export function buildExerciseIndex(bundle: ContentBundle): ExerciseIndex {
  return ExerciseIndexSchema.parse({
    schemaVersion: 1,
    exercises: [...bundle.exercises]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((exercise) => ({
        id: exercise.id,
        skillId: exercise.skillId,
        difficulty: exercise.difficulty,
      })),
  })
}
