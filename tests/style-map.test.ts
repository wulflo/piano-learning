import { beforeAll, describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { validateContentBundle } from '../src/content/validate'
import { STYLE_MAP } from '../src/content/style-map'
import type { ContentBundle, Lesson } from '../src/schemas'

let bundle: ContentBundle

beforeAll(async () => {
  const result = validateContentBundle(await loadContentFromDisk())
  expect(result.ok).toBe(true)
  if (!result.bundle) throw new Error('El contenido del repositorio no es válido')
  bundle = result.bundle
})

function lessonById(lessonId: string): Lesson {
  const lesson = bundle.lessons.find((item) => item.id === lessonId)
  if (!lesson) throw new Error(`Falta la lección ${lessonId}`)
  return lesson
}

function lessonText(lesson: Lesson, language: 'es' | 'en'): string {
  const sections = lesson.sections.map((section) =>
    language === 'es'
      ? `${section.titleEs} ${section.bodyEs ?? ''}`
      : `${section.titleEn ?? ''} ${section.bodyEn ?? ''}`,
  )
  const task = lesson.keyboardTask
  const taskText =
    task === undefined
      ? ''
      : language === 'es'
        ? `${task.titleEs} ${task.instructionsEs}`
        : `${task.titleEn ?? ''} ${task.instructionsEn ?? ''}`

  return [
    language === 'es' ? lesson.summaryEs : lesson.summaryEn,
    ...sections,
    taskText,
  ].join(' ')
}

describe('F5-016 — Mapa de estilos de M8', () => {
  it('cubre los cuatro estilos en orden y sin duplicados', () => {
    expect(STYLE_MAP.map((entry) => entry.lessonId)).toEqual([
      'lesson.m8-01',
      'lesson.m8-02',
      'lesson.m8-03',
      'lesson.m8-04',
    ])
    expect(new Set(STYLE_MAP.map((entry) => entry.lessonId)).size).toBe(
      STYLE_MAP.length,
    )
  })

  it('enlaza lecciones publicadas y opcionales de M8 con su pieza original', () => {
    for (const entry of STYLE_MAP) {
      const lesson = lessonById(entry.lessonId)
      expect(lesson.moduleId, entry.lessonId).toBe('M8')
      expect(lesson.status, entry.lessonId).toBe('published')
      expect(lesson.optional, entry.lessonId).toBe(true)
      expect(lessonText(lesson, 'es'), `${entry.lessonId} ES`).toContain(
        entry.pieceEs,
      )
      expect(lessonText(lesson, 'en'), `${entry.lessonId} EN`).toContain(
        entry.pieceEn,
      )
    }
  })

  it('mantiene M8 como ampliación que no bloquea M7', () => {
    const module = bundle.modules.find((item) => item.id === 'M8')
    expect(module?.optional).toBe(true)

    const m8LessonIds = new Set(
      bundle.lessons
        .filter((lesson) => lesson.moduleId === 'M8')
        .map((lesson) => lesson.id),
    )
    for (const lesson of bundle.lessons) {
      if (lesson.moduleId !== 'M7') continue
      expect(
        lesson.prerequisites.filter((id) => m8LessonIds.has(id)),
        lesson.id,
      ).toEqual([])
    }

    // La ruta de estilos encadena una lección con la siguiente y arranca
    // después de la última lección obligatoria de M7.
    const [first, ...rest] = STYLE_MAP
    expect(first).toBeDefined()
    if (first === undefined) return
    expect(lessonById(first.lessonId).prerequisites).toEqual(['lesson.m7-11'])
    for (const [index, entry] of rest.entries()) {
      expect(lessonById(entry.lessonId).prerequisites).toEqual([
        STYLE_MAP[index]?.lessonId,
      ])
    }
  })
})
