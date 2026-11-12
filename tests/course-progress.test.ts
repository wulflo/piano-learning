import { describe, expect, it } from 'vitest'
import { CourseIndexSchema, type CourseIndex } from '../src/schemas'
import { summarizeCourse } from '../src/state/course-progress'
import type { LessonUnlock } from '../src/state/lesson-progress'

function lesson(
  id: string,
  moduleId: CourseIndex['modules'][number]['id'],
  prerequisites: string[] = [],
  optional = false,
) {
  return {
    id,
    moduleId,
    slug: id.replace('lesson.', ''),
    titleEs: `Lección ${id}`,
    titleEn: `Lesson ${id}`,
    summaryEs: `Resumen de ${id}`,
    summaryEn: `Summary of ${id}`,
    minutes: 5,
    optional,
    prerequisites,
    skillIds: [`skill.${id}`],
    status: 'published' as const,
  }
}

const OPTIONAL_INDEX: CourseIndex = CourseIndexSchema.parse({
  schemaVersion: 1,
  modules: [
    {
      id: 'M0',
      order: 0,
      titleEs: 'Módulo cero',
      titleEn: 'Module zero',
      summaryEs: 'Resumen cero',
      summaryEn: 'Summary zero',
      optional: false,
      lessonIds: ['lesson.a', 'lesson.b'],
    },
  ],
  lessons: [
    lesson('lesson.a', 'M0'),
    lesson('lesson.b', 'M0', ['lesson.a'], true),
  ],
})

const INDEX: CourseIndex = CourseIndexSchema.parse({
  schemaVersion: 1,
  modules: [
    {
      id: 'M0',
      order: 0,
      titleEs: 'Módulo cero',
      titleEn: 'Module zero',
      summaryEs: 'Resumen cero',
      summaryEn: 'Summary zero',
      optional: false,
      lessonIds: ['lesson.a', 'lesson.b'],
    },
    {
      id: 'M1',
      order: 1,
      titleEs: 'Módulo uno',
      titleEn: 'Module one',
      summaryEs: 'Resumen uno',
      summaryEn: 'Summary one',
      optional: false,
      lessonIds: ['lesson.c'],
    },
    {
      id: 'M2',
      order: 2,
      titleEs: 'Módulo dos',
      titleEn: 'Module two',
      summaryEs: 'Resumen dos',
      summaryEn: 'Summary two',
      optional: true,
      lessonIds: [],
    },
  ],
  lessons: [
    lesson('lesson.a', 'M0'),
    lesson('lesson.b', 'M0', ['lesson.a']),
    lesson('lesson.c', 'M1', ['lesson.b']),
  ],
})

function unlock(
  id: string,
  status: LessonUnlock['status'],
  missingPrerequisites: string[] = [],
): LessonUnlock {
  return { id, status, missingPrerequisites }
}

describe('F2-059 — Resumen del curso por módulo', () => {
  it('agrupa las lecciones y calcula el avance global', () => {
    const summary = summarizeCourse(INDEX, [
      unlock('lesson.a', 'completed'),
      unlock('lesson.b', 'available'),
      unlock('lesson.c', 'locked', ['lesson.b']),
    ])

    expect(summary.completedLessons).toBe(1)
    expect(summary.totalLessons).toBe(3)
    expect(summary.completedModules).toBe(0)
    expect(summary.totalModules).toBe(3)
    expect(summary.nextLessonId).toBe('lesson.b')

    expect(summary.modules.map((module) => module.id)).toEqual(['M0', 'M1', 'M2'])
    expect(summary.modules.map((module) => module.status)).toEqual([
      'in-progress',
      'locked',
      'empty',
    ])
    expect(summary.modules[0]).toMatchObject({
      completedLessons: 1,
      totalLessons: 2,
      lessonIds: ['lesson.a', 'lesson.b'],
    })
  })

  it('prefiere una lección en curso para continuar', () => {
    const summary = summarizeCourse(INDEX, [
      unlock('lesson.a', 'completed'),
      unlock('lesson.b', 'in-progress'),
      unlock('lesson.c', 'available'),
    ])

    expect(summary.nextLessonId).toBe('lesson.b')
    expect(summary.modules[0]?.status).toBe('in-progress')
    expect(summary.modules[1]?.status).toBe('available')
  })

  it('marca todo el curso como completado', () => {
    const summary = summarizeCourse(INDEX, [
      unlock('lesson.a', 'completed'),
      unlock('lesson.b', 'completed'),
      unlock('lesson.c', 'completed'),
    ])

    expect(summary.completedLessons).toBe(3)
    expect(summary.completedModules).toBe(2)
    expect(summary.nextLessonId).toBeNull()
    expect(summary.modules.map((module) => module.status)).toEqual([
      'completed',
      'completed',
      'empty',
    ])
  })

  it('elige la primera lección disponible aunque haya módulos bloqueados', () => {
    const summary = summarizeCourse(INDEX, [
      unlock('lesson.a', 'completed'),
      unlock('lesson.b', 'locked', ['lesson.a']),
      unlock('lesson.c', 'available'),
    ])

    expect(summary.nextLessonId).toBe('lesson.c')
    expect(summary.modules[0]?.status).toBe('in-progress')
    expect(summary.modules[1]?.status).toBe('available')
  })

  it('trata una lección sin desbloqueo como bloqueada sin inventar estado', () => {
    const summary = summarizeCourse(INDEX, [unlock('lesson.a', 'completed')])
    const module = summary.modules[0]
    const missing = module?.lessons.find((candidate) => candidate.id === 'lesson.b')

    expect(module?.status).toBe('in-progress')
    expect(missing).toEqual({
      id: 'lesson.b',
      status: 'locked',
      missingPrerequisites: ['lesson.a'],
    })
  })

  it('no modifica el índice recibido', () => {
    const before = JSON.stringify(INDEX)
    summarizeCourse(INDEX, [unlock('lesson.a', 'completed')])
    expect(JSON.stringify(INDEX)).toBe(before)
  })

  it('no propone una lección opcional si queda una obligatoria disponible', () => {
    const summary = summarizeCourse(OPTIONAL_INDEX, [
      unlock('lesson.a', 'available'),
      unlock('lesson.b', 'available'),
    ])

    expect(summary.nextLessonId).toBe('lesson.a')
  })

  it('propone la opcional cuando no queda ninguna obligatoria disponible', () => {
    const summary = summarizeCourse(OPTIONAL_INDEX, [
      unlock('lesson.a', 'completed'),
      unlock('lesson.b', 'available'),
    ])

    expect(summary.nextLessonId).toBe('lesson.b')
  })

  it('mantiene la opcional en curso como siguiente paso', () => {
    const summary = summarizeCourse(OPTIONAL_INDEX, [
      unlock('lesson.a', 'completed'),
      unlock('lesson.b', 'in-progress'),
    ])

    expect(summary.nextLessonId).toBe('lesson.b')
  })

  it('funciona con el índice real del curso', async () => {    const { COURSE_INDEX, COURSE_LESSON_GRAPH } = await import(
      '../src/content/course'
    )
    const unlocks = COURSE_LESSON_GRAPH.map((node) => ({
      id: node.id,
      status: node.prerequisites.length === 0 ? ('available' as const) : ('locked' as const),
      missingPrerequisites: [...node.prerequisites],
    }))

    const summary = summarizeCourse(COURSE_INDEX, unlocks)

    expect(summary.totalModules).toBe(9)
    expect(summary.totalLessons).toBe(79)
    expect(summary.completedLessons).toBe(0)
    expect(summary.modules[0]?.status).toBe('available')
    expect(summary.nextLessonId).toBe('lesson.m0-01')
  })
})
