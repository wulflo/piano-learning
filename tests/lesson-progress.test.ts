import { describe, expect, it } from 'vitest'
import { createProgressDatabase } from '../src/state/db'
import {
  DEFAULT_MASTERY_THRESHOLD,
  LessonLockedError,
  UnknownLessonError,
  completeLesson,
  computeLessonUnlocks,
  loadLessonUnlocks,
  startLesson,
  type LessonGraphNode,
} from '../src/state/lesson-progress'
import { createProgressRepositories } from '../src/state/repositories'
import type { LessonProgress, SkillProgress } from '../src/schemas'

let databaseCounter = 0

function uniqueDatabaseName(): string {
  databaseCounter += 1
  return `pdc.test.lesson-progress.${databaseCounter}`
}

const NOW = new Date('2026-03-10T12:00:00.000Z')

function lesson(overrides: Partial<LessonProgress> = {}): LessonProgress {
  return { status: 'completed', secondsSpent: 60, ...overrides }
}

function skill(mastery: number): SkillProgress {
  return { mastery, correct: 0, incorrect: 0 }
}

const GRAPH: LessonGraphNode[] = [
  { id: 'lesson.m0-01', prerequisites: [], skillIds: ['skill.a'] },
  { id: 'lesson.m0-02', prerequisites: ['lesson.m0-01'], skillIds: ['skill.b'] },
  {
    id: 'lesson.m0-03',
    prerequisites: ['lesson.m0-01', 'lesson.m0-02'],
    skillIds: [],
  },
  { id: 'lesson.m0-04', prerequisites: ['lesson.unknown'], skillIds: [] },
]

describe('F2-051 — Progreso por lección y desbloqueo por prerrequisitos', () => {
  it('mantiene bloqueadas las lecciones con prerrequisitos pendientes', () => {
    const unlocks = computeLessonUnlocks(GRAPH)

    expect(unlocks).toEqual([
      { id: 'lesson.m0-01', status: 'available', missingPrerequisites: [] },
      {
        id: 'lesson.m0-02',
        status: 'locked',
        missingPrerequisites: ['lesson.m0-01'],
      },
      {
        id: 'lesson.m0-03',
        status: 'locked',
        missingPrerequisites: ['lesson.m0-01', 'lesson.m0-02'],
      },
      {
        id: 'lesson.m0-04',
        status: 'locked',
        missingPrerequisites: ['lesson.unknown'],
      },
    ])
  })

  it('desbloquea la siguiente lección al completar un prerrequisito', () => {
    const unlocks = computeLessonUnlocks(GRAPH, {
      lessons: { 'lesson.m0-01': lesson() },
    })

    expect(unlocks.map((unlock) => [unlock.id, unlock.status])).toEqual([
      ['lesson.m0-01', 'completed'],
      ['lesson.m0-02', 'available'],
      ['lesson.m0-03', 'locked'],
      ['lesson.m0-04', 'locked'],
    ])
    expect(unlocks[2].missingPrerequisites).toEqual(['lesson.m0-02'])
  })

  it('considera dominado un prerrequisito por maestría de sus habilidades', () => {
    const base = computeLessonUnlocks(GRAPH, {
      skills: { 'skill.a': skill(DEFAULT_MASTERY_THRESHOLD) },
    })
    expect(base[1].status).toBe('available')

    const below = computeLessonUnlocks(GRAPH, {
      skills: { 'skill.a': skill(DEFAULT_MASTERY_THRESHOLD - 0.01) },
    })
    expect(below[1].status).toBe('locked')

    const custom = computeLessonUnlocks(
      GRAPH,
      { skills: { 'skill.a': skill(0.75) } },
      { masteryThreshold: 0.7 },
    )
    expect(custom[1].status).toBe('available')
  })

  it('exige todos los prerrequisitos, no solo uno', () => {
    const unlocks = computeLessonUnlocks(GRAPH, {
      lessons: {
        'lesson.m0-01': lesson(),
        'lesson.m0-02': { status: 'in-progress', secondsSpent: 10 },
      },
    })

    expect(unlocks[2].status).toBe('locked')
    expect(unlocks[2].missingPrerequisites).toEqual(['lesson.m0-02'])
  })

  it('conserva el estado en curso o completado aunque falten prerrequisitos', () => {
    const unlocks = computeLessonUnlocks(GRAPH, {
      lessons: {
        'lesson.m0-02': { status: 'in-progress', secondsSpent: 30 },
        'lesson.m0-03': lesson({ completedAt: '2026-03-09T10:00:00.000Z' }),
      },
    })

    expect(unlocks[1]).toEqual({
      id: 'lesson.m0-02',
      status: 'in-progress',
      missingPrerequisites: [],
    })
    expect(unlocks[2]).toEqual({
      id: 'lesson.m0-03',
      status: 'completed',
      missingPrerequisites: [],
    })
  })

  it('no se cuelga con un ciclo de prerrequisitos', () => {
    const unlocks = computeLessonUnlocks([
      { id: 'lesson.a', prerequisites: ['lesson.b'] },
      { id: 'lesson.b', prerequisites: ['lesson.a'] },
    ])

    expect(unlocks).toEqual([
      { id: 'lesson.a', status: 'locked', missingPrerequisites: ['lesson.b'] },
      { id: 'lesson.b', status: 'locked', missingPrerequisites: ['lesson.a'] },
    ])
  })

  it('persiste el inicio y la finalización de una lección', async () => {
    const name = uniqueDatabaseName()
    const db = createProgressDatabase({ name })
    const repositories = createProgressRepositories(db)

    const started = await startLesson(repositories, GRAPH, 'lesson.m0-01', { now: NOW })
    expect(started).toEqual({
      id: 'lesson.m0-01',
      status: 'in-progress',
      secondsSpent: 0,
    })
    repositories.close()

    const reopened = createProgressDatabase({ name })
    const nextRepositories = createProgressRepositories(reopened)
    expect((await loadLessonUnlocks(nextRepositories, GRAPH)).slice(0, 2)).toMatchObject([
      { id: 'lesson.m0-01', status: 'in-progress' },
      { id: 'lesson.m0-02', status: 'locked' },
    ])

    const completed = await completeLesson(nextRepositories, GRAPH, 'lesson.m0-01', {
      now: NOW,
    })
    expect(completed).toMatchObject({
      id: 'lesson.m0-01',
      status: 'completed',
      completedAt: NOW.toISOString(),
      secondsSpent: 0,
    })
    expect((await loadLessonUnlocks(nextRepositories, GRAPH)).slice(0, 2)).toMatchObject([
      { id: 'lesson.m0-01', status: 'completed' },
      { id: 'lesson.m0-02', status: 'available' },
    ])
    nextRepositories.close()
  })

  it('conserva los segundos y no degrada una lección completada', async () => {
    const db = createProgressDatabase({ name: uniqueDatabaseName() })
    const repositories = createProgressRepositories(db)
    await repositories.lessons.put('lesson.m0-01', {
      status: 'in-progress',
      secondsSpent: 45,
    })

    const started = await startLesson(repositories, GRAPH, 'lesson.m0-01')
    expect(started.secondsSpent).toBe(45)

    const completed = await completeLesson(repositories, GRAPH, 'lesson.m0-01', {
      now: NOW,
    })
    const startedAgain = await startLesson(repositories, GRAPH, 'lesson.m0-01')
    const completedAgain = await completeLesson(repositories, GRAPH, 'lesson.m0-01', {
      now: new Date('2026-04-01T00:00:00.000Z'),
    })

    expect(startedAgain).toEqual(completed)
    expect(completedAgain).toEqual(completed)
    expect(completedAgain.completedAt).toBe(NOW.toISOString())
    repositories.close()
  })

  it('rechaza iniciar o completar una lección bloqueada sin escribir progreso', async () => {
    const db = createProgressDatabase({ name: uniqueDatabaseName() })
    const repositories = createProgressRepositories(db)

    await expect(startLesson(repositories, GRAPH, 'lesson.m0-02')).rejects.toBeInstanceOf(
      LessonLockedError,
    )
    await expect(
      completeLesson(repositories, GRAPH, 'lesson.m0-02'),
    ).rejects.toBeInstanceOf(LessonLockedError)
    expect(await repositories.lessons.all()).toEqual([])

    await expect(
      startLesson(repositories, GRAPH, 'lesson.m0-02'),
    ).rejects.toMatchObject({
      lessonId: 'lesson.m0-02',
      missingPrerequisites: ['lesson.m0-01'],
    })
    repositories.close()
  })

  it('rechaza lecciones que no están en el grafo', async () => {
    const db = createProgressDatabase({ name: uniqueDatabaseName() })
    const repositories = createProgressRepositories(db)

    await expect(startLesson(repositories, GRAPH, 'lesson.nope')).rejects.toBeInstanceOf(
      UnknownLessonError,
    )
    await expect(
      completeLesson(repositories, GRAPH, 'lesson.nope'),
    ).rejects.toBeInstanceOf(UnknownLessonError)
    repositories.close()
  })

  it('lee la maestría persistida de las habilidades', async () => {
    const db = createProgressDatabase({ name: uniqueDatabaseName() })
    const repositories = createProgressRepositories(db)
    await repositories.skills.put('skill.a', skill(0.9))

    const unlocks = await loadLessonUnlocks(repositories, GRAPH)

    expect(unlocks[1].status).toBe('available')
    repositories.close()
  })
})
