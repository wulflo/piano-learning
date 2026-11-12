import { describe, expect, it, vi } from 'vitest'
import {
  ProgressEnvelopeSchema,
  FsrsCardSchema,
  ProfileSchema,
  SettingsSchema,
  type ProgressData,
  type ReviewLog,
} from '../src/schemas'
import { createProgressDatabase } from '../src/state/db'
import {
  canonicalJson,
  collectProgressData,
  createProgressExport,
  downloadProgressFile,
  sha256Hex,
} from '../src/state/progress-export'
import { createProgressRepositories } from '../src/state/repositories'
import { APP_VERSION } from '../src/version'

let databaseCounter = 0

function uniqueDatabaseName(): string {
  databaseCounter += 1
  return `pdc.test.progress-export.${databaseCounter}`
}

const NOW = new Date('2026-11-12T01:05:00.000Z')

function makeReview(): ReviewLog {
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
  }
}

async function seed() {
  const db = createProgressDatabase({ name: uniqueDatabaseName() })
  const repositories = createProgressRepositories(db)

  await repositories.lessons.put('lesson.m0-01', {
    status: 'completed',
    completedAt: '2026-03-10T10:00:00.000Z',
    secondsSpent: 300,
  })
  await repositories.skills.put('skill.note-id', {
    card: FsrsCardSchema.parse({
      due: '2026-03-12T10:00:00.000Z',
      stability: 3,
      difficulty: 5,
      elapsedDays: 1,
      scheduledDays: 2,
      reps: 1,
      lapses: 0,
      state: 'review',
      lastReview: '2026-03-10T10:00:00.000Z',
    }),
    mastery: 0.9,
    correct: 5,
    incorrect: 1,
  })
  await repositories.reviews.save(makeReview())
  await repositories.settings.save(SettingsSchema.parse({ locale: 'en', tempoBpm: 100 }))
  await repositories.profile.save(
    ProfileSchema.parse({
      xp: 125,
      achievements: [
        { id: 'primer-paso', unlockedAt: '2026-03-10T10:00:00.000Z' },
      ],
      streak: {
        current: 2,
        longest: 2,
        lastPracticeDate: '2026-03-10',
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

describe('F2-054 — Exportar progreso a .txt', () => {
  it('serializa a JSON canónico con claves ordenadas y sin espacios', () => {
    const value = {
      b: 1,
      a: { d: 2, c: [{ z: 1, a: 2 }] },
      skip: undefined,
    }

    expect(canonicalJson(value)).toBe(
      '{"a":{"c":[{"a":2,"z":1}],"d":2},"b":1}',
    )
    expect(canonicalJson({ b: 1, a: 2 })).toBe(canonicalJson({ a: 2, b: 1 }))
    expect(canonicalJson({ when: new Date('2026-11-12T01:05:00.000Z') })).toBe(
      '{"when":"2026-11-12T01:05:00.000Z"}',
    )
  })

  it('calcula SHA-256 en hexadecimal minúsculas', async () => {
    expect(await sha256Hex('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    )
  })

  it('reúne todo el progreso persistido y quita los ids de los registros', async () => {
    const repositories = await seed()
    const data = await collectProgressData(repositories)

    expect(data.lessons['lesson.m0-01']).toEqual({
      status: 'completed',
      completedAt: '2026-03-10T10:00:00.000Z',
      secondsSpent: 300,
    })
    expect(data.lessons['lesson.m0-01']).not.toHaveProperty('id')
    expect(data.skills['skill.note-id']).toMatchObject({
      mastery: 0.9,
      correct: 5,
      incorrect: 1,
    })
    expect(data.skills['skill.note-id']).not.toHaveProperty('id')
    expect(data.reviews).toHaveLength(1)
    expect(data.settings).toMatchObject({ locale: 'en', tempoBpm: 100 })
    expect(data).toMatchObject({ xp: 125, level: 2 })
    expect(data.streak).toMatchObject({ current: 2, longest: 2 })
    expect(data.practiceSessions).toHaveLength(1)
    repositories.close()
  })

  it('genera un archivo legible con cabecera, hash y nombre con fecha', async () => {
    const repositories = await seed()
    const data = await collectProgressData(repositories)
    const result = await createProgressExport(data, {
      now: NOW,
      appVersion: '0.1.0',
    })

    expect(result.fileName).toBe('pianodesdecero-progreso-2026-11-12.txt')
    expect(result.sha256).toBe(await sha256Hex(result.json))
    expect(result.envelope).toMatchObject({
      format: 'pianodesdecero.progress',
      version: 1,
      exportedAt: NOW.toISOString(),
      appVersion: '0.1.0',
      sha256: result.sha256,
    })
    expect(ProgressEnvelopeSchema.parse(result.envelope)).toEqual(result.envelope)

    const lines = result.text.split('\n')
    expect(lines).toEqual([
      'PianoDesdeCero — Progreso',
      'Formato: pianodesdecero.progress v1',
      `Exportado: ${NOW.toISOString()}`,
      'Aplicación: 0.1.0',
      `SHA-256: ${result.sha256}`,
      '',
      result.json,
      '',
    ])
    expect(result.text.endsWith('\n')).toBe(true)
    repositories.close()
  })

  it('produce un hash estable entre exportaciones de los mismos datos', async () => {
    const repositories = await seed()
    const data = await collectProgressData(repositories)

    const first = await createProgressExport(data, {
      now: new Date('2026-11-12T01:05:00.000Z'),
    })
    const second = await createProgressExport(data, {
      now: new Date('2026-12-31T23:59:59.000Z'),
    })

    expect(first.sha256).toBe(second.sha256)
    expect(first.json).toBe(second.json)
    expect(first.envelope.exportedAt).not.toBe(second.envelope.exportedAt)
    expect(first.text).not.toBe(second.text)
    expect(first.envelope.appVersion).toBe(APP_VERSION)
    repositories.close()
  })

  it('rechaza datos de progreso inválidos', async () => {
    const repositories = await seed()
    const data = await collectProgressData(repositories)
    repositories.close()

    await expect(
      createProgressExport(
        { ...data, xp: -1 } as unknown as ProgressData,
        { now: NOW },
      ),
    ).rejects.toThrow()
  })

  it('descarga el archivo con un enlace temporal', async () => {
    const originalCreate = URL.createObjectURL
    const originalRevoke = URL.revokeObjectURL
    const createObjectURL = vi.fn((blob: Blob) => {
      expect(blob).toBeInstanceOf(Blob)
      return 'blob:progress'
    })
    const revokeObjectURL = vi.fn()

    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: createObjectURL,
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: revokeObjectURL,
    })
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined)

    try {
      downloadProgressFile({
        text: 'progreso',
        fileName: 'pianodesdecero-progreso-2026-11-12.txt',
      })

      expect(createObjectURL).toHaveBeenCalledOnce()
      const blob = createObjectURL.mock.calls[0][0] as Blob
      expect(blob.type).toBe('text/plain;charset=utf-8')
      expect(await blob.text()).toBe('progreso')
      expect(click).toHaveBeenCalledOnce()
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:progress')
    } finally {
      click.mockRestore()
      Object.defineProperty(URL, 'createObjectURL', {
        configurable: true,
        writable: true,
        value: originalCreate,
      })
      Object.defineProperty(URL, 'revokeObjectURL', {
        configurable: true,
        writable: true,
        value: originalRevoke,
      })
    }
  })
})
