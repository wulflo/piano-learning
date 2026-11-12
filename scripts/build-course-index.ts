import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { validateContentBundle } from '../src/content/validate'
import { loadContentFromDisk } from './lib/load-content'
import { buildCourseIndex } from './lib/course-index'
import { buildExerciseIndex } from './lib/exercise-index'

/**
 * Genera `src/content/course-index.json` y `src/content/exercise-index.json`
 * desde `content/`.
 *
 * Los archivos se commitean para que la app los importe sin cargar todas las
 * lecciones ni todos los ejercicios. Los tests de índices fallan si quedan
 * desactualizados.
 */
async function main() {
  const raw = await loadContentFromDisk()
  const result = validateContentBundle(raw)

  if (!result.ok || result.bundle === undefined) {
    for (const issue of result.issues) {
      console.error(`  error · ${issue.path}: ${issue.message}`)
    }
    throw new Error('El contenido no es válido; no se generó el índice')
  }

  const index = buildCourseIndex(result.bundle)
  const target = join(process.cwd(), 'src', 'content', 'course-index.json')
  await writeFile(target, `${JSON.stringify(index, null, 2)}\n`, 'utf8')

  const exerciseIndex = buildExerciseIndex(result.bundle)
  const exerciseTarget = join(
    process.cwd(),
    'src',
    'content',
    'exercise-index.json',
  )
  await writeFile(
    exerciseTarget,
    `${JSON.stringify(exerciseIndex, null, 2)}\n`,
    'utf8',
  )

  console.log(
    `Índices escritos · ${index.modules.length} módulos · ${index.lessons.length} lecciones · ${exerciseIndex.exercises.length} ejercicios`,
  )
}

main().catch((error: unknown) => {
  console.error('Error generando el índice del curso:', error)
  process.exitCode = 1
})
