import { describe, expect, it } from 'vitest'
import {
  createProgressDatabase,
  PROGRESS_DB_NAME,
  PROGRESS_DB_VERSION,
  SETTINGS_RECORD_ID,
} from '../src/state/db'
import { createProgressRepositories } from '../src/state/repositories'
import {
  FsrsCardSchema,
  SettingsSchema,
  type LessonProgress,
  type PracticeSession,
  type ReviewLog,
  type SkillProgress,
} from '../src/schemas'

let databaseCounter = 0

function uniqueDatabaseName(): string {
  databaseCounter += 1
  return `pdc.test.db.${databaseCounter}`
}

function createDatabase(name = uniqueDatabaseName()) {
  return createProgressDatabase({ name })
}

function makeReview(overrides: Partial<ReviewLog> = {}): ReviewLog {
  return {
    id: 'skill.test.log.1',
    itemId: 'skill.test',
    reviewedAt: '2026-03-10T10:00:00.000Z',
    rating: 'good',
    elapsedDays: 1,
    scheduledDays: 2,
    stability: 3,
    difficulty: 5,
    state: 'review',
    usedHint: false,
    ...overrides,
  }
}

function makeSession(overrides: Partial<PracticeSession> = {}): PracticeSession {
  return {
    id: 'session.one',
    startedAt: '2026-03-10T10:00:00.000Z',
    endedAt: '2026-03-10T10:30:00.000Z',
    plannedMinutes: 30,
    blocks: [{ kind: 'warmup', seconds: 300 }],
    ...overrides,
  }
}

describe('F2-049 — Esquema Dexie v1 y repositorios', () => {
  it('declara las cinco tablas con la versión 1', async () => {
    const db = createDatabase()
    await db.open()

    expect(PROGRESS_DB_VERSION).toBe(1)
    expect(PROGRESS_DB_NAME).toBe('pianodesdecero.progress')
    expect(db.tables.map((table) => table.name).sort()).toEqual([
      'lessons',
      'profile',
      'reviews',
      'sessions',
      'settings',
      'skills',
    ])
    expect(db.verno).toBe(2)
    db.close()
  })

  it('hace CRUD de progreso de lecciones', async () => {
    const db = createDatabase()
    const { lessons, close } = createProgressRepositories(db)

    const created = await lessons.put('lesson.m0-01', {
      status: 'in-progress',
      secondsSpent: 120,
    })
    expect(created).toEqual({
      id: 'lesson.m0-01',
      status: 'in-progress',
      secondsSpent: 120,
    })
    expect(await lessons.get('lesson.m0-01')).toEqual({
      status: 'in-progress',
      secondsSpent: 120,
    })

    await lessons.put('lesson.m0-01', {
      status: 'completed',
      completedAt: '2026-03-10T11:00:00.000Z',
      secondsSpent: 300,
    })
    expect(await lessons.all()).toEqual([
      {
        id: 'lesson.m0-01',
        status: 'completed',
        completedAt: '2026-03-10T11:00:00.000Z',
        secondsSpent: 300,
      },
    ])

    await lessons.remove('lesson.m0-01')
    expect(await lessons.get('lesson.m0-01')).toBeUndefined()
    await lessons.put('lesson.m0-02', { status: 'in-progress', secondsSpent: 10 })
    await lessons.clear()
    expect(await lessons.all()).toEqual([])
    close()
  })

  it('rechaza lecciones inválidas sin guardarlas', async () => {
    const db = createDatabase()
    const { lessons, close } = createProgressRepositories(db)

    await expect(
      lessons.put('lesson.m0-01', {
        status: 'done',
      } as unknown as LessonProgress),
    ).rejects.toThrow()
    await expect(
      lessons.put('Lesson M0', { status: 'in-progress', secondsSpent: 0 }),
    ).rejects.toThrow()
    expect(await lessons.all()).toEqual([])
    close()
  })

  it('hace CRUD de habilidades con su tarjeta FSRS', async () => {
    const db = createDatabase()
    const { skills, close } = createProgressRepositories(db)
    const card = FsrsCardSchema.parse({
      due: '2026-03-12T10:00:00.000Z',
      stability: 4,
      difficulty: 5,
      elapsedDays: 1,
      scheduledDays: 2,
      reps: 3,
      lapses: 0,
      state: 'review',
      lastReview: '2026-03-10T10:00:00.000Z',
    })

    await skills.put('skill.note-id', {
      card,
      mastery: 0.4,
      correct: 2,
      incorrect: 1,
    })
    expect(await skills.get('skill.note-id')).toEqual({
      card,
      mastery: 0.4,
      correct: 2,
      incorrect: 1,
    })
    expect((await skills.all())[0].id).toBe('skill.note-id')

    await skills.put('skill.note-id', {
      card: { ...card, due: '2026-03-20T10:00:00.000Z' },
      mastery: 0.7,
      correct: 3,
      incorrect: 1,
    })
    expect((await skills.get('skill.note-id'))?.card?.due).toBe(
      '2026-03-20T10:00:00.000Z',
    )

    await skills.remove('skill.note-id')
    expect(await skills.all()).toEqual([])

    await expect(
      skills.put('skill.bad', {
        mastery: 1.5,
      } as unknown as SkillProgress),
    ).rejects.toThrow()
    close()
  })

  it('hace CRUD de repasos y filtra por ítem', async () => {
    const db = createDatabase()
    const { reviews, close } = createProgressRepositories(db)

    await reviews.save(
      makeReview({
        id: 'skill.a.log.2',
        itemId: 'skill.a',
        reviewedAt: '2026-03-11T10:00:00.000Z',
      }),
    )
    await reviews.save(makeReview({ id: 'skill.a.log.1', itemId: 'skill.a' }))
    await reviews.save(makeReview({ id: 'skill.b.log.1', itemId: 'skill.b', rating: 'again' }))

    expect((await reviews.all()).map((log) => log.id)).toEqual([
      'skill.a.log.1',
      'skill.b.log.1',
      'skill.a.log.2',
    ])
    expect((await reviews.all('skill.a')).map((log) => log.id)).toEqual([
      'skill.a.log.1',
      'skill.a.log.2',
    ])
    expect(await reviews.count()).toBe(3)
    expect((await reviews.get('skill.b.log.1'))?.rating).toBe('again')

    await reviews.remove('skill.b.log.1')
    expect(await reviews.count()).toBe(2)
    await reviews.clear()
    expect(await reviews.all()).toEqual([])

    await expect(
      reviews.save(makeReview({ rating: 'bien' } as unknown as ReviewLog)),
    ).rejects.toThrow()
    expect(await reviews.count()).toBe(0)
    close()
  })

  it('guarda ajustes, devuelve valores por defecto y los reinicia', async () => {
    const db = createDatabase()
    const { settings, close } = createProgressRepositories(db)

    expect(await settings.get()).toEqual(SettingsSchema.parse({}))

    const saved = await settings.save(
      SettingsSchema.parse({ notation: 'do', locale: 'en', fuzz: true, desiredRetention: 0.85 }),
    )
    expect(await settings.get()).toEqual(saved)
    expect(await db.settings.get(SETTINGS_RECORD_ID)).toMatchObject({
      id: SETTINGS_RECORD_ID,
      notation: 'do',
      fuzz: true,
    })

    expect(await settings.reset()).toEqual(SettingsSchema.parse({}))
    expect(await settings.get()).toEqual(SettingsSchema.parse({}))

    await expect(
      settings.save({
        ...SettingsSchema.parse({}),
        desiredRetention: 0.5,
      }),
    ).rejects.toThrow()
    close()
  })

  it('hace CRUD de sesiones de práctica ordenadas por inicio', async () => {
    const db = createDatabase()
    const { sessions, close } = createProgressRepositories(db)

    await sessions.save(
      makeSession({
        id: 'session.two',
        startedAt: '2026-03-11T10:00:00.000Z',
        endedAt: '2026-03-11T10:15:00.000Z',
        plannedMinutes: 15,
      }),
    )
    await sessions.save(makeSession())
    expect((await sessions.all()).map((session) => session.id)).toEqual([
      'session.one',
      'session.two',
    ])
    expect((await sessions.get('session.one'))?.plannedMinutes).toBe(30)

    await sessions.remove('session.one')
    expect(await sessions.all()).toHaveLength(1)
    await sessions.clear()
    expect(await sessions.all()).toEqual([])

    await expect(
      sessions.save(
        makeSession({ plannedMinutes: 20 } as unknown as PracticeSession),
      ),
    ).rejects.toThrow()
    close()
  })

  it('conserva los datos al cerrar y reabrir la base', async () => {
    const name = uniqueDatabaseName()
    const first = createDatabase(name)
    const firstRepos = createProgressRepositories(first)
    await firstRepos.lessons.put('lesson.m0-01', {
      status: 'in-progress',
      secondsSpent: 60,
    })
    await firstRepos.reviews.save(makeReview())
    await firstRepos.settings.save(SettingsSchema.parse({ tempoBpm: 120 }))
    firstRepos.close()

    const second = createDatabase(name)
    const secondRepos = createProgressRepositories(second)
    expect(await secondRepos.lessons.get('lesson.m0-01')).toEqual({
      status: 'in-progress',
      secondsSpent: 60,
    })
    expect(await secondRepos.reviews.count()).toBe(1)
    expect((await secondRepos.settings.get()).tempoBpm).toBe(120)
    secondRepos.close()
  })
})
