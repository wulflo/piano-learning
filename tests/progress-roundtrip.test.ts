import { describe, expect, it } from 'vitest'
import {
  FsrsCardSchema,
  ProfileSchema,
  SettingsSchema,
  type ReviewLog,
} from '../src/schemas'
import { createProgressDatabase } from '../src/state/db'
import { importProgress } from '../src/state/progress-import'
import {
  collectProgressData,
  createProgressExport,
  type ProgressExport,
} from '../src/state/progress-export'
import { createProgressRepositories } from '../src/state/repositories'

let databaseCounter = 0

function uniqueDatabaseName(): string {
  databaseCounter += 1
  return `pdc.test.roundtrip.${databaseCounter}`
}

const NOW = new Date('2026-11-12T01:15:00.000Z')

function makeReview(overrides: Partial<ReviewLog> = {}): ReviewLog {
  return {
    id: 'skill.note-id.log.1',
    itemId: 'skill.note-id',
    reviewedAt: '2026-03-10T10:05:00.000Z',
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

/** Base poblada con las seis tablas y varios registros por dominio. */
async function populateSource() {
  const repositories = createProgressRepositories(
    createProgressDatabase({ name: uniqueDatabaseName() }),
  )

  await repositories.lessons.put('lesson.m0-01', {
    status: 'completed',
    completedAt: '2026-03-09T10:00:00.000Z',
    secondsSpent: 300,
  })
  await repositories.lessons.put('lesson.m0-02', {
    status: 'in-progress',
    secondsSpent: 45,
  })
  await repositories.lessons.put('lesson.m0-03', {
    status: 'not-started',
    secondsSpent: 0,
  })

  await repositories.skills.put('skill.note-id', {
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
    mastery: 0.9,
    correct: 8,
    incorrect: 1,
  })
  await repositories.skills.put('skill.interval', {
    mastery: 0.4,
    correct: 2,
    incorrect: 0,
  })

  await repositories.reviews.save(makeReview())
  await repositories.reviews.save(
    makeReview({
      id: 'skill.interval.log.1',
      itemId: 'skill.interval',
      reviewedAt: '2026-03-11T09:00:00.000Z',
      rating: 'again',
      state: 'relearning',
      usedHint: true,
    }),
  )

  await repositories.settings.save(
    SettingsSchema.parse({
      notation: 'c',
      locale: 'en',
      theme: 'dark',
      desiredRetention: 0.85,
      maximumInterval: 180,
      fuzz: true,
      newPerDay: 12,
      audioVolume: 0.6,
      tempoBpm: 96,
      midiEnabled: true,
    }),
  )

  await repositories.profile.save(
    ProfileSchema.parse({
      xp: 450,
      level: 1,
      achievements: [
        { id: 'primer-paso', unlockedAt: '2026-03-09T10:00:00.000Z' },
        { id: 'aprendiz', unlockedAt: '2026-03-10T10:00:00.000Z' },
      ],
      streak: {
        current: 3,
        longest: 5,
        lastPracticeDate: '2026-03-11',
        graceDaysUsedThisWeek: 1,
      },
    }),
  )

  await repositories.sessions.save({
    id: 'session.one',
    startedAt: '2026-03-09T10:00:00.000Z',
    endedAt: '2026-03-09T10:30:00.000Z',
    plannedMinutes: 30,
    blocks: [
      { kind: 'warmup', seconds: 300 },
      { kind: 'theory', seconds: 600 },
    ],
  })
  await repositories.sessions.save({
    id: 'session.two',
    startedAt: '2026-03-10T10:00:00.000Z',
    endedAt: '2026-03-10T10:45:00.000Z',
    plannedMinutes: 45,
    blocks: [{ kind: 'repertoire', seconds: 1200 }],
  })

  return repositories
}

/** Base de destino con datos distintos para comprobar que el reemplazo limpia. */
async function populateDestination() {
  const repositories = createProgressRepositories(
    createProgressDatabase({ name: uniqueDatabaseName() }),
  )
  await repositories.lessons.put('lesson.old', {
    status: 'completed',
    completedAt: '2025-12-01T00:00:00.000Z',
    secondsSpent: 999,
  })
  await repositories.skills.put('skill.old', {
    mastery: 0.2,
    correct: 1,
    incorrect: 4,
  })
  await repositories.profile.save(ProfileSchema.parse({ xp: 9000 }))
  await repositories.sessions.save({
    id: 'session.old',
    startedAt: '2025-12-01T00:00:00.000Z',
    endedAt: '2025-12-01T00:15:00.000Z',
    plannedMinutes: 15,
    blocks: [{ kind: 'warmup', seconds: 300 }],
  })
  return repositories
}

function expectSameExport(first: ProgressExport, second: ProgressExport): void {
  expect(second.sha256).toBe(first.sha256)
  expect(second.json).toBe(first.json)
  expect(second.text).toBe(first.text)
  expect(second.envelope).toEqual(first.envelope)
}

describe('F2-056 — Ida y vuelta exportar→importar→exportar', () => {
  it('produce un archivo idéntico tras importar en una base con datos', async () => {
    const sourceRepositories = await populateSource()
    const source = await collectProgressData(sourceRepositories)
    const first = await createProgressExport(source, { now: NOW })
    sourceRepositories.close()

    const destinationRepositories = await populateDestination()
    const imported = await importProgress(destinationRepositories, first.text, {
      confirm: true,
      now: NOW,
    })
    expect(imported.sha256).toBe(first.sha256)

    const roundTripped = await collectProgressData(destinationRepositories)
    expect(roundTripped).toEqual(source)

    const second = await createProgressExport(roundTripped, { now: NOW })
    expectSameExport(first, second)
    destinationRepositories.close()
  })

  it('se mantiene idéntico en varios ciclos y no duplica registros', async () => {
    const sourceRepositories = await populateSource()
    const source = await collectProgressData(sourceRepositories)
    const first = await createProgressExport(source, { now: NOW })
    sourceRepositories.close()

    const repositories = await populateDestination()
    let current = first
    for (let cycle = 0; cycle < 3; cycle += 1) {
      await importProgress(repositories, current.text, {
        confirm: true,
        now: NOW,
      })
      const data = await collectProgressData(repositories)
      expect(data).toEqual(source)
      current = await createProgressExport(data, { now: NOW })
      expectSameExport(first, current)
    }

    expect(await repositories.reviews.count()).toBe(2)
    expect(await repositories.sessions.all()).toHaveLength(2)
    expect(await repositories.lessons.all()).toHaveLength(3)
    expect(await repositories.skills.all()).toHaveLength(2)
    repositories.close()
  })

  it('conserva el hash aunque cambie la fecha de exportación', async () => {
    const sourceRepositories = await populateSource()
    const source = await collectProgressData(sourceRepositories)
    sourceRepositories.close()

    const first = await createProgressExport(source, {
      now: new Date('2026-11-12T01:15:00.000Z'),
    })
    const second = await createProgressExport(source, {
      now: new Date('2027-01-01T00:00:00.000Z'),
    })

    expect(second.sha256).toBe(first.sha256)
    expect(second.json).toBe(first.json)
    expect(second.envelope.data).toEqual(first.envelope.data)
    expect(second.fileName).not.toBe(first.fileName)
    expect(second.text).not.toBe(first.text)
  })
})
