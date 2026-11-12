import { validateContentBundle } from '../src/content/validate'
import { loadContentFromDisk } from './lib/load-content'

async function main() {
  const raw = await loadContentFromDisk()
  const result = validateContentBundle(raw)

  console.log('Validación de contenido')

  for (const warning of result.warnings) {
    console.warn(`  advertencia · ${warning.path}: ${warning.message}`)
  }

  if (!result.ok) {
    for (const issue of result.issues) {
      console.error(`  error · ${issue.path}: ${issue.message}`)
    }
    console.error(`\nFalló con ${result.issues.length} error(es).`)
    process.exitCode = 1
    return
  }

  const { stats } = result
  console.log(
    `  OK · ${stats.modules} módulos, ${stats.lessons} lecciones, ${stats.exercises} ejercicios, ${stats.skills} habilidades, ${stats.repertoire} piezas.`,
  )
}

main().catch((error: unknown) => {
  console.error('Error inesperado validando contenido:', error)
  process.exitCode = 1
})
