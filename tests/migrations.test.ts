import { describe, expect, it } from 'vitest'
import { createProgressDatabase, SETTINGS_RECORD_ID } from '../src/state/db'
import {
  PROGRESS_MIGRATIONS,
  PROGRESS_V1_STORES,
  latestProgressVersion,
  registerProgressMigrations,
  type ProgressMigration,
} from '../src/state/migrations'
import { createProgressRepositories } from '../src/state/repositories'
import {
  FsrsCardSchema,
  SettingsSchema,
  type ReviewLog,
} from '../src/schemas'

let databaseCounter = 0

function uniqueDatabaseName(): string {
  databaseCounter += 1
  return `pdc.test.migrations.${databaseCounter}`
}

/**
 * Migración simulada v1→v2: agrega un índice por estado a las lecciones y
 * completa `completedAt` en las lecciones terminadas antiguas. Es idempotente:
 * solo escribe cuando falta el campo.
 */
const simulatedV2: ProgressMigration = {
  version: 2,
  stores: { lessons: 'id, status' },
  async upgrade(transaction) {
    await transaction
      .table('lessons')
      .toCollection()
      .modify((lesson: Record<string, unknown>) => {
        if (lesson.status === 'completed' && lesson.completedAt === undefined) {
          lesson.completedAt = '2026-01-01T00:00:00.000Z'
        }
      })
  },
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

/** Crea una base en la versión 1 con datos en las cinco tablas. */
async function populateV1(name: string): Promise<void> {
  // Sin migraciones para crear una base realmente en la versión 1.
  const db = createProgressDatabase({ name, migrations: [] })
  const repos = createProgressRepositories(db)

  await repos.lessons.put('lesson.done', {
    status: 'completed',
    secondsSpent: 300,
  })
  await repos.lessons.put('lesson.current', {
    status: 'in-progress',
    secondsSpent: 45,
  })
  await repos.skills.put('skill.note-id', {
    card: FsrsCardSchema.parse({
      due: '2026-03-12T10:00:00.000Z',
      stability: 4,
      difficulty: 5,
      elapsedDays: 1,
      scheduledDays: 2,
      reps: 3,
      lapses: 0,
      state: 'review',
      lastReview: '2026-03-10T10:00:00.000Z',
    }),
    mastery: 0.4,
    correct: 2,
    incorrect: 1,
  })
  await repos.reviews.save(makeReview())
  await repos.reviews.save(
    makeReview({
      id: 'skill.test.log.2',
      itemId: 'skill.other',
      reviewedAt: '2026-03-11T10:00:00.000Z',
      rating: 'again',
    }),
  )
  await repos.settings.save(SettingsSchema.parse({ tempoBpm: 120, fuzz: true }))
  await repos.sessions.save({
    id: 'session.one',
    startedAt: '2026-03-10T10:00:00.000Z',
    endedAt: '2026-03-10T10:30:00.000Z',
    plannedMinutes: 30,
    blocks: [{ kind: 'warmup', seconds: 300 }],
  })
  repos.close()
}

describe('F2-050 — Migraciones versionadas', () => {
  it('expone la versión 1 como base y la migración de perfil v2', () => {
    expect(PROGRESS_V1_STORES).toEqual({
      lessons: 'id',
      skills: 'id, card.due',
      reviews: 'id, itemId, reviewedAt',
      settings: 'id',
      sessions: 'id, startedAt',
    })
    expect(PROGRESS_MIGRATIONS).toEqual([
      { version: 2, stores: { profile: 'id' } },
    ])
    expect(latestProgressVersion()).toBe(2)
    expect(latestProgressVersion([simulatedV2])).toBe(2)
    expect(latestProgressVersion([{ version: 3, stores: {} }])).toBe(3)
  })

  it('aplica la migración de perfil v2 sobre una base v1 poblada', async () => {
    const name = uniqueDatabaseName()
    await populateV1(name)

    const db = createProgressDatabase({ name })
    await db.open()

    expect(db.verno).toBe(2)
    expect(db.tables.map((table) => table.name)).toContain('profile')
    expect(await db.reviews.count()).toBe(2)
    expect(await db.lessons.count()).toBe(2)
    expect(await db.profile.count()).toBe(0)

    const repos = createProgressRepositories(db)
    expect(await repos.profile.get()).toMatchObject({ xp: 0, level: 1 })
    repos.close()
  })

  it('migra una base v1 poblada a v2 conservando todos los datos', async () => {
    const name = uniqueDatabaseName()
    await populateV1(name)

    const db = createProgressDatabase({ name, migrations: [simulatedV2] })
    await db.open()

    expect(db.verno).toBe(2)
    expect(db.lessons.schema.indexes.map((index) => index.name)).toContain('status')
    expect(await db.lessons.count()).toBe(2)
    expect(await db.skills.count()).toBe(1)
    expect(await db.reviews.count()).toBe(2)
    expect(await db.sessions.count()).toBe(1)
    expect(await db.settings.count()).toBe(1)

    expect(await db.lessons.get('lesson.done')).toMatchObject({
      status: 'completed',
      completedAt: '2026-01-01T00:00:00.000Z',
      secondsSpent: 300,
    })
    expect(await db.lessons.get('lesson.current')).toEqual({
      id: 'lesson.current',
      status: 'in-progress',
      secondsSpent: 45,
    })
    expect((await db.settings.get(SETTINGS_RECORD_ID))?.tempoBpm).toBe(120)

    const repos = createProgressRepositories(db)
    expect(await repos.lessons.get('lesson.done')).toMatchObject({
      status: 'completed',
      completedAt: '2026-01-01T00:00:00.000Z',
    })
    expect(await repos.reviews.all()).toHaveLength(2)
    repos.close()
  })

  it('aplica la migración de datos de forma idempotente', async () => {
    const name = uniqueDatabaseName()
    await populateV1(name)

    const db = createProgressDatabase({ name, migrations: [simulatedV2] })
    await db.open()

    await db.transaction('rw', db.lessons, async (transaction) => {
      await simulatedV2.upgrade?.(transaction)
      await simulatedV2.upgrade?.(transaction)
    })

    const lessons = await db.lessons.toArray()
    expect(lessons).toHaveLength(2)
    expect(lessons.filter((lesson) => lesson.status === 'completed')).toEqual([
      {
        id: 'lesson.done',
        status: 'completed',
        completedAt: '2026-01-01T00:00:00.000Z',
        secondsSpent: 300,
      },
    ])
    db.close()
  })

  it('rechaza migraciones duplicadas o que no avanzan de versión', () => {
    const name = uniqueDatabaseName()

    expect(() =>
      createProgressDatabase({
        name,
        migrations: [simulatedV2, { ...simulatedV2 }],
      }),
    ).toThrow(/duplicada/)

    expect(() =>
      createProgressDatabase({
        name,
        migrations: [
          {
            version: 1,
            stores: { lessons: 'id' },
          },
        ],
      }),
    ).toThrow(/mayor que la versión 1/)
  })

  it('registra migraciones en orden aunque se declaren desordenadas', () => {
    const db = createProgressDatabase({
      name: uniqueDatabaseName(),
      migrations: [],
    })
    registerProgressMigrations(
      db,
      [
        { version: 3, stores: { lessons: 'id, status' } },
        { version: 2, stores: { lessons: 'id' } },
      ],
      1,
    )

    expect(db.verno).toBe(3)
    expect(latestProgressVersion([
      { version: 3, stores: {} },
      { version: 2, stores: {} },
    ])).toBe(3)
    db.close()
  })
})
