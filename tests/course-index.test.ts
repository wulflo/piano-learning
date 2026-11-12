import { describe, expect, it } from 'vitest'
import rawIndex from '../src/content/course-index.json'
import { COURSE_INDEX, COURSE_LESSONS, COURSE_MODULES } from '../src/content/course'
import { CourseIndexSchema } from '../src/schemas'
import { validateContentBundle } from '../src/content/validate'
import { buildCourseIndex } from '../scripts/lib/course-index'
import { loadContentFromDisk } from '../scripts/lib/load-content'

describe('F2-059 — Índice del curso', () => {
  it('el JSON commiteado coincide con el contenido actual', async () => {
    const raw = await loadContentFromDisk()
    const result = validateContentBundle(raw)
    expect(result.ok).toBe(true)
    expect(result.bundle).toBeDefined()

    const expected = buildCourseIndex(result.bundle!)
    expect(rawIndex).toEqual(expected)
    expect(COURSE_INDEX).toEqual(CourseIndexSchema.parse(expected))
  })

  it('incluye los nueve módulos y las setenta y siete lecciones en orden', () => {
    expect(COURSE_MODULES).toHaveLength(9)
    expect(COURSE_LESSONS).toHaveLength(79)

    expect(COURSE_MODULES.map((module) => module.id)).toEqual([
      'M0',
      'M1',
      'M2',
      'M3',
      'M4',
      'M5',
      'M6',
      'M7',
      'M8',
    ])
    expect(COURSE_MODULES.map((module) => module.order)).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8,
    ])

    for (const module of COURSE_MODULES) {
      for (const lessonId of module.lessonIds) {
        const lesson = COURSE_LESSONS.find((candidate) => candidate.id === lessonId)
        expect(lesson?.moduleId).toBe(module.id)
      }
    }

    // El contenido actual publica lecciones en los nueve módulos.
    const withLessons = COURSE_MODULES.filter(
      (module) => module.lessonIds.length > 0,
    )
    expect(withLessons.map((module) => module.id)).toEqual([
      'M0',
      'M1',
      'M2',
      'M3',
      'M4',
      'M5',
      'M6',
      'M7',
      'M8',
    ])
    expect(
      COURSE_MODULES.filter((module) => module.lessonIds.length === 0).map(
        (module) => module.id,
      ),
    ).toEqual([])
  })

  it('todos los prerrequisitos apuntan a lecciones del índice', () => {
    const ids = new Set(COURSE_LESSONS.map((lesson) => lesson.id))

    for (const lesson of COURSE_LESSONS) {
      for (const prerequisite of lesson.prerequisites) {
        expect(ids.has(prerequisite)).toBe(true)
      }
    }
  })

  it('las lecciones del índice son únicas y están publicadas', () => {
    const ids = COURSE_LESSONS.map((lesson) => lesson.id)
    expect(new Set(ids).size).toBe(ids.length)

    for (const lesson of COURSE_LESSONS) {
      expect(lesson.status).toBe('published')
      expect(lesson.titleEs.length).toBeGreaterThan(0)
      expect(lesson.titleEn.length).toBeGreaterThan(0)
      expect(lesson.minutes).toBeGreaterThan(0)
    }
  })
})
