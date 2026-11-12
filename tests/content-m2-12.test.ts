import { beforeAll, describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { validateContentBundle } from '../src/content/validate'
import { type ContentBundle, type Lesson } from '../src/schemas'

let bundle: ContentBundle
let lesson: Lesson

beforeAll(async () => {
  const result = validateContentBundle(await loadContentFromDisk())
  expect(result.ok).toBe(true)
  if (!result.bundle) throw new Error('El contenido del repositorio no es válido')
  bundle = result.bundle
  const found = bundle.lessons.find((item) => item.id === 'lesson.m2-12')
  if (!found) throw new Error('Falta la lección M2-12')
  lesson = found
})

describe('M2-12 — Digitación de escalas', () => {
  it('está publicada, validada y depende de M2-11', () => {
    expect(lesson.moduleId).toBe('M2')
    expect(lesson.status).toBe('published')
    expect(lesson.prerequisites).toContain('lesson.m2-11')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(1)
    expect(lesson.skillIds).toContain('skill.major-scale')
  })

  it('explica las reglas de pulgar y la digitación de las doce escalas', () => {
    const text = lesson.sections
      .map((section) => `${section.titleEs} ${section.bodyEs ?? ''}`)
      .join(' ')
      .toLowerCase()

    expect(text).toContain('pulgar')
    expect(text).toContain('dedos')
  })

  it('incluye una tarea real de teclado con digitación y tempo', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.tempoBpm).toBe(60)
    expect(task?.keys.length).toBe(8)
    expect(task?.checklistEs.length).toBeGreaterThanOrEqual(3)

    const instructions = task?.instructionsEs.toLowerCase() ?? ''
    expect(instructions).toContain('escala')
  })
})
