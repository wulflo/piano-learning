import { describe, expect, it, vi } from 'vitest'
import {
  FsrsCardSchema,
  ProfileSchema,
  ProgressDataSchema,
  SettingsSchema,
  type ReviewLog,
} from '../src/schemas'
import { createProgressDatabase } from '../src/state/db'
import { collectProgressData } from '../src/state/progress-export'
import {
  RESET_CONFIRMATION_WORD,
  ProgressResetError,
  resetProgress,
} from '../src/state/progress-reset'
import { createProgressRepositories } from '../src/state/repositories'

let databaseCounter = 0

function uniqueDatabaseName(): string {
  databaseCounter += 1
  return `pdc.test.reset.${databaseCounter}`
}

const NOW = new Date('2026-11-12T01:20:00.000Z')

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

async function seed() {
  const repositories = createProgressRepositories(
    createProgressDatabase({ name: uniqueDatabaseName() }),
  )

  await repositories.lessons.put('lesson.m0-01', {
    status: 'completed',
    completedAt: '2026-03-10T10:00:00.000Z',
    secondsSpent: 300,
  })
  await repositories.lessons.put('lesson.m0-02', {
    status: 'in-progress',
    secondsSpent: 40,
  })
  await repositories.skills.put('skill.note-id', {
    card: FsrsCardSchema.parse({
      due: '2026-03-12T10:00:00.000Z',
      stability: 4,
      difficulty: 5,
      elapsedDays: 1,
      scheduledDays: 2,
      reps: 2,
      lapses: 0,
      state: 'review',
      lastReview: '2026-03-10T10:00:00.000Z',
    }),
    mastery: 0.9,
    correct: 5,
    incorrect: 1,
  })
  await repositories.reviews.save(makeReview())
  await repositories.settings.save(SettingsSchema.parse({ locale: 'en', tempoBpm: 96 }))
  await repositories.profile.save(
    ProfileSchema.parse({
      xp: 450,
      achievements: [
        { id: 'primer-paso', unlockedAt: '2026-03-10T10:00:00.000Z' },
        { id: 'aprendiz', unlockedAt: '2026-03-11T10:00:00.000Z' },
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
    startedAt: '2026-03-10T10:00:00.000Z',
    endedAt: '2026-03-10T10:30:00.000Z',
    plannedMinutes: 30,
    blocks: [{ kind: 'warmup', seconds: 300 }],
  })

  return repositories
}

function initialState() {
  return ProgressDataSchema.parse({ schemaVersion: 1 })
}

describe('F2-057 — Restablecer progreso con confirmación explícita', () => {
  it('exige dos confirmaciones y no toca la base', async () => {
    const repositories = await seed()
    const clearSpy = vi.spyOn(repositories, 'clearAll')
    const before = await collectProgressData(repositories)

    await expect(resetProgress(repositories)).rejects.toBeInstanceOf(
      ProgressResetError,
    )
    await expect(resetProgress(repositories)).rejects.toMatchObject({
      code: 'confirmation-required',
    })
    await expect(
      resetProgress(repositories, {
        confirmations: 1,
        confirmationWord: RESET_CONFIRMATION_WORD,
      }),
    ).rejects.toMatchObject({ code: 'confirmation-required' })

    expect(clearSpy).not.toHaveBeenCalled()
    expect(await collectProgressData(repositories)).toEqual(before)
    repositories.close()
  })

  it('rechaza un número de confirmaciones no entero o negativo', async () => {
    const repositories = await seed()

    for (const confirmations of [-1, 1.5, Number.NaN]) {
      await expect(
        resetProgress(repositories, {
          confirmations,
          confirmationWord: RESET_CONFIRMATION_WORD,
        }),
      ).rejects.toMatchObject({ code: 'confirmation-required' })
    }

    expect(await repositories.lessons.all()).toHaveLength(2)
    repositories.close()
  })

  it('exige la palabra de confirmación y no borra nada si no coincide', async () => {
    const repositories = await seed()
    const before = await collectProgressData(repositories)

    await expect(
      resetProgress(repositories, { confirmations: 2 }),
    ).rejects.toMatchObject({ code: 'confirmation-mismatch' })
    await expect(
      resetProgress(repositories, {
        confirmations: 2,
        confirmationWord: 'RESET',
      }),
    ).rejects.toMatchObject({ code: 'confirmation-mismatch' })

    expect(await collectProgressData(repositories)).toEqual(before)
    repositories.close()
  })

  it('acepta la palabra sin distinguir mayúsculas ni espacios exteriores', async () => {
    const repositories = await seed()

    const result = await resetProgress(repositories, {
      confirmations: 2,
      confirmationWord: '  borrar  ',
    })

    expect(result.resetAt).toBeDefined()
    expect(await repositories.lessons.all()).toEqual([])
    repositories.close()
  })

  it('permite personalizar la palabra esperada', async () => {
    const repositories = await seed()

    await expect(
      resetProgress(repositories, {
        confirmations: 2,
        confirmationWord: 'borrar',
        expectedWord: 'ELIMINAR',
      }),
    ).rejects.toMatchObject({ code: 'confirmation-mismatch' })

    await resetProgress(repositories, {
      confirmations: 2,
      confirmationWord: 'eliminar',
      expectedWord: 'ELIMINAR',
    })
    expect(await repositories.reviews.all()).toEqual([])
    repositories.close()
  })

  it('borra todo el progreso, vuelve al estado inicial y devuelve los conteos', async () => {
    const repositories = await seed()

    const result = await resetProgress(repositories, {
      confirmations: 2,
      confirmationWord: RESET_CONFIRMATION_WORD,
      now: NOW,
    })

    expect(result).toEqual({
      resetAt: NOW.toISOString(),
      cleared: {
        lessons: 2,
        skills: 1,
        reviews: 1,
        sessions: 1,
        achievements: 2,
        xp: 450,
      },
    })

    expect(await collectProgressData(repositories)).toEqual(initialState())
    expect(await repositories.lessons.all()).toEqual([])
    expect(await repositories.skills.all()).toEqual([])
    expect(await repositories.reviews.all()).toEqual([])
    expect(await repositories.sessions.all()).toEqual([])
    expect(await repositories.profile.get()).toEqual(ProfileSchema.parse({}))
    expect(await repositories.settings.get()).toEqual(SettingsSchema.parse({}))
    repositories.close()
  })

  it('persiste el borrado al reabrir la base', async () => {
    const name = uniqueDatabaseName()
    const repositories = createProgressRepositories(
      createProgressDatabase({ name }),
    )
    const seeded = await seed()

    // Copia los datos sembrados a la base con nombre conocido.
    await repositories.replaceAll(await collectProgressData(seeded))
    seeded.close()
    await resetProgress(repositories, {
      confirmations: 2,
      confirmationWord: 'BORRAR',
    })
    repositories.close()

    const reopened = createProgressRepositories(
      createProgressDatabase({ name }),
    )
    expect(await collectProgressData(reopened)).toEqual(initialState())
    reopened.close()
  })

  it('se puede repetir sobre un progreso ya vacío', async () => {
    const repositories = await seed()
    await resetProgress(repositories, {
      confirmations: 2,
      confirmationWord: 'BORRAR',
    })

    const second = await resetProgress(repositories, {
      confirmations: 2,
      confirmationWord: 'BORRAR',
      now: NOW,
    })

    expect(second.cleared).toEqual({
      lessons: 0,
      skills: 0,
      reviews: 0,
      sessions: 0,
      achievements: 0,
      xp: 0,
    })
    expect(await collectProgressData(repositories)).toEqual(initialState())
    repositories.close()
  })

  it('envuelve un fallo del borrado y deja los datos intactos', async () => {
    const repositories = await seed()
    const before = await collectProgressData(repositories)
    const originalClearAll = repositories.clearAll
    repositories.clearAll = async () => {
      throw new Error('IndexedDB bloqueada')
    }

    await expect(
      resetProgress(repositories, {
        confirmations: 2,
        confirmationWord: 'BORRAR',
      }),
    ).rejects.toMatchObject({ code: 'reset-failed' })

    repositories.clearAll = originalClearAll
    expect(await collectProgressData(repositories)).toEqual(before)
    repositories.close()
  })
})
