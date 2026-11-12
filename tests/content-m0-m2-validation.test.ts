import { describe, expect, it } from 'vitest'
import { validateContentBundle } from '../src/content/validate'
import { loadContentFromDisk } from '../scripts/lib/load-content'

/**
 * F2-070 — Validación de todo el contenido publicado en el build.
 *
 * `npm run build` ejecuta `validate:content` antes de compilar, así que estas
 * comprobaciones son el gate real: las lecciones publicadas, sin errores, con
 * tarea de teclado y sin ejercicios que ninguna lección referencie.
 */

async function realBundle() {
  const raw = await loadContentFromDisk()
  const result = validateContentBundle(raw)
  if (!result.bundle) throw new Error('El contenido real debería validar')
  return result
}

describe('F2-070 — Validación del contenido publicado', () => {
  it('valida el contenido real sin errores ni advertencias', async () => {
    const result = await realBundle()

    expect(result.issues).toEqual([])
    expect(result.warnings).toEqual([])
    expect(result.ok).toBe(true)
  })

  it('publica las 79 lecciones de M0 a M8', async () => {
    const { bundle, stats } = await realBundle()
    if (!bundle) throw new Error('Falta el bundle')

    expect(stats.lessons).toBe(79)
    expect(bundle.lessons.every((lesson) => lesson.status === 'published')).toBe(
      true,
    )

    const byModule = new Map<string, number>()
    for (const lesson of bundle.lessons) {
      byModule.set(lesson.moduleId, (byModule.get(lesson.moduleId) ?? 0) + 1)
    }
    expect(Object.fromEntries(byModule)).toEqual({
      M0: 6,
      M1: 12,
      M2: 12,
      M3: 5,
      M4: 12,
      M5: 11,
      M6: 6,
      M7: 11,
      M8: 4,
    })
  })

  it('cada lección tiene tarea de teclado', async () => {
    const { bundle } = await realBundle()
    if (!bundle) throw new Error('Falta el bundle')

    for (const lesson of bundle.lessons) {
      expect(lesson.keyboardTask, lesson.id).toBeDefined()
    }
  })

  it('no deja ejercicios huérfanos', async () => {
    const { bundle } = await realBundle()
    if (!bundle) throw new Error('Falta el bundle')

    const referenced = new Set(
      bundle.lessons.flatMap((lesson) => lesson.exerciseIds),
    )
    const orphans = bundle.exercises
      .map((exercise) => exercise.id)
      .filter((id) => !referenced.has(id))

    expect(orphans).toEqual([])
  })

  it('falla si una lección publicada no tiene tarea de teclado', async () => {
    const { bundle } = await realBundle()
    if (!bundle) throw new Error('Falta el bundle')

    const fixture = structuredClone(bundle)
    const lesson = fixture.lessons[0]
    if (!lesson) throw new Error('Falta la primera lección')
    delete lesson.keyboardTask

    const result = validateContentBundle(fixture)

    expect(result.ok).toBe(false)
    expect(
      result.issues.some((issue) =>
        issue.message.includes('sin tarea de teclado real'),
      ),
    ).toBe(true)
  })

  it('falla si un ejercicio no está referenciado por ninguna lección', async () => {
    const { bundle } = await realBundle()
    if (!bundle) throw new Error('Falta el bundle')

    const fixture = structuredClone(bundle)
    const lesson = fixture.lessons[0]
    if (!lesson) throw new Error('Falta la primera lección')
    lesson.exerciseIds = lesson.exerciseIds.slice(1)

    const result = validateContentBundle(fixture)

    expect(result.ok).toBe(false)
    expect(
      result.issues.some((issue) =>
        issue.message.includes('no referenciado por ninguna lección'),
      ),
    ).toBe(true)
  })
})
