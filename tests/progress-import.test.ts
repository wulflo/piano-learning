import { describe, expect, it } from 'vitest'
import {
  ProgressDataSchema,
  SettingsSchema,
  ProfileSchema,
  type ProgressData,
  type ReviewLog,
} from '../src/schemas'
import { createProgressDatabase } from '../src/state/db'
import {
  importProgress,
  parseProgressFile,
} from '../src/state/progress-import'
import {
  PROGRESS_FILE_FORMAT,
  PROGRESS_FILE_TITLE,
  PROGRESS_FILE_VERSION,
  canonicalJson,
  collectProgressData,
  createProgressExport,
  sha256Hex,
} from '../src/state/progress-export'
import { createProgressRepositories } from '../src/state/repositories'

let databaseCounter = 0

function uniqueDatabaseName(): string {
  databaseCounter += 1
  return `pdc.test.progress-import.${databaseCounter}`
}

const NOW = new Date('2026-11-12T01:10:00.000Z')
const EXPORTED_AT = '2026-11-12T01:05:00.000Z'

function makeReview(overrides: Partial<ReviewLog> = {}): ReviewLog {
  return {
    id: 'skill.source.log.1',
    itemId: 'skill.source',
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

function sourceData(): ProgressData {
  return ProgressDataSchema.parse({
    schemaVersion: 1,
    lessons: {
      'lesson.source': {
        status: 'completed',
        completedAt: '2026-03-10T10:00:00.000Z',
        secondsSpent: 240,
      },
    },
    skills: {
      'skill.source': { mastery: 0.9, correct: 4, incorrect: 1 },
    },
    reviews: [makeReview()],
    settings: { locale: 'en', tempoBpm: 96 },
    xp: 300,
    level: 3,
    achievements: [
      { id: 'primer-paso', unlockedAt: '2026-03-10T10:00:00.000Z' },
    ],
    streak: {
      current: 4,
      longest: 5,
      lastPracticeDate: '2026-03-12',
      graceDaysUsedThisWeek: 1,
    },
    practiceSessions: [
      {
        id: 'session.source',
        startedAt: '2026-03-10T10:00:00.000Z',
        endedAt: '2026-03-10T10:30:00.000Z',
        plannedMinutes: 30,
        blocks: [{ kind: 'theory', seconds: 600 }],
      },
    ],
  })
}

interface FileOptions {
  format?: string
  version?: number
  exportedAt?: string
  appVersion?: string
  sha256?: string
  payload?: string
}

async function buildFile(data: unknown, options: FileOptions = {}): Promise<string> {
  const sha256 = options.sha256 ?? (await sha256Hex(canonicalJson(data)))
  return [
    PROGRESS_FILE_TITLE,
    `Formato: ${options.format ?? PROGRESS_FILE_FORMAT} v${options.version ?? PROGRESS_FILE_VERSION}`,
    `Exportado: ${options.exportedAt ?? EXPORTED_AT}`,
    `Aplicación: ${options.appVersion ?? '0.1.0'}`,
    `SHA-256: ${sha256}`,
    '',
    options.payload ?? canonicalJson(data),
    '',
  ].join('\n')
}

async function expectCode(
  promise: Promise<unknown>,
  code: string,
): Promise<void> {
  await expect(promise).rejects.toMatchObject({ code })
}

async function seedDestination() {
  const db = createProgressDatabase({ name: uniqueDatabaseName() })
  const repositories = createProgressRepositories(db)
  await repositories.lessons.put('lesson.dest', {
    status: 'in-progress',
    secondsSpent: 10,
  })
  await repositories.skills.put('skill.dest', {
    mastery: 0.1,
    correct: 0,
    incorrect: 0,
  })
  await repositories.reviews.save(
    makeReview({ id: 'skill.dest.log.1', itemId: 'skill.dest' }),
  )
  await repositories.settings.save(SettingsSchema.parse({ tempoBpm: 60 }))
  await repositories.profile.save(ProfileSchema.parse({ xp: 50 }))
  await repositories.sessions.save({
    id: 'session.dest',
    startedAt: '2026-03-09T10:00:00.000Z',
    endedAt: '2026-03-09T10:15:00.000Z',
    plannedMinutes: 15,
    blocks: [{ kind: 'warmup', seconds: 300 }],
  })
  return repositories
}

describe('F2-055 — Importar progreso con validación y reemplazo', () => {
  it('lee una exportación válida y valida el hash', async () => {
    const data = sourceData()
    const text = await buildFile(data)
    const parsed = await parseProgressFile(text)

    expect(parsed.data).toEqual(data)
    expect(parsed.json).toBe(canonicalJson(data))
    expect(parsed.sha256).toBe(await sha256Hex(canonicalJson(data)))
    expect(parsed.header).toEqual({
      format: PROGRESS_FILE_FORMAT,
      version: PROGRESS_FILE_VERSION,
      exportedAt: EXPORTED_AT,
      appVersion: '0.1.0',
      sha256: parsed.sha256,
    })
    expect(parsed.envelope).toMatchObject({
      format: PROGRESS_FILE_FORMAT,
      version: PROGRESS_FILE_VERSION,
      exportedAt: EXPORTED_AT,
      appVersion: '0.1.0',
      sha256: parsed.sha256,
      data,
    })
  })

  it('acepta copias antiguas exportadas con el nombre anterior', async () => {
    const data = sourceData()
    const legacy = (await buildFile(data)).replace(
      PROGRESS_FILE_TITLE,
      'PianoDesdeCero — Progreso',
    )

    expect((await parseProgressFile(legacy)).data).toEqual(data)
  })

  it('acepta JSON con espacios si el hash canónico coincide', async () => {
    const data = sourceData()
    const text = await buildFile(data, {
      payload: JSON.stringify(data, null, 2),
    })

    expect((await parseProgressFile(text)).data).toEqual(data)
  })

  it('rechaza archivos sin cabecera, sin separador o sin JSON', async () => {
    const text = await buildFile(sourceData())

    await expectCode(parseProgressFile(''), 'invalid-format')
    await expectCode(parseProgressFile(PROGRESS_FILE_TITLE), 'invalid-format')
    await expectCode(
      parseProgressFile(`${text.split('\n\n')[0]}\n\nno es json`),
      'invalid-format',
    )
    await expectCode(
      parseProgressFile(`${text.split('\n\n')[0]}\n\n`),
      'invalid-format',
    )
  })

  it('rechaza un formato desconocido o una versión futura', async () => {
    const data = sourceData()

    await expectCode(
      parseProgressFile(await buildFile(data, { format: 'otro.formato' })),
      'invalid-format',
    )
    await expectCode(
      parseProgressFile(await buildFile(data, { version: 2 })),
      'unsupported-version',
    )
  })

  it('rechaza un hash inválido o que no coincide', async () => {
    const data = sourceData()

    await expectCode(
      parseProgressFile(await buildFile(data, { sha256: '0'.repeat(64) })),
      'invalid-hash',
    )
    await expectCode(
      parseProgressFile(
        await buildFile(data, { payload: canonicalJson({ ...data, xp: 999 }) }),
      ),
      'invalid-hash',
    )

    const sha = await sha256Hex(canonicalJson(data))
    await expectCode(
      parseProgressFile(await buildFile(data, { sha256: sha.toUpperCase() })),
      'invalid-hash',
    )
  })

  it('rechaza datos inválidos aunque el hash coincida', async () => {
    const invalid = { schemaVersion: 1, xp: -1 }
    const text = await buildFile(invalid)

    await expectCode(parseProgressFile(text), 'invalid-data')
  })

  it('exige confirmación explícita y no toca la base', async () => {
    const repositories = await seedDestination()
    const before = await collectProgressData(repositories)
    const text = await buildFile(sourceData())

    await expectCode(
      importProgress(repositories, text),
      'confirmation-required',
    )
    expect(await collectProgressData(repositories)).toEqual(before)
    repositories.close()
  })

  it('reemplaza todo el progreso con una exportación real', async () => {
    const sourceRepositories = createProgressRepositories(
      createProgressDatabase({ name: uniqueDatabaseName() }),
    )
    await sourceRepositories.replaceAll(sourceData())
    const source = await collectProgressData(sourceRepositories)
    const exported = await createProgressExport(source, { now: NOW })
    sourceRepositories.close()

    const repositories = await seedDestination()
    const result = await importProgress(repositories, exported.text, {
      confirm: true,
      now: NOW,
    })

    expect(result.replacedAt).toBe(NOW.toISOString())
    expect(result.sha256).toBe(exported.sha256)
    expect(result.counts).toEqual({
      lessons: 1,
      skills: 1,
      reviews: 1,
      sessions: 1,
      achievements: 1,
    })
    expect(await collectProgressData(repositories)).toEqual(source)

    const imported = await collectProgressData(repositories)
    expect(imported.lessons['lesson.dest']).toBeUndefined()
    expect(imported.skills['skill.dest']).toBeUndefined()
    expect(imported.reviews.map((review) => review.id)).toEqual([
      'skill.source.log.1',
    ])
    expect(imported.settings.tempoBpm).toBe(96)
    expect(imported.level).toBe(3)

    await importProgress(repositories, exported.text, { confirm: true })
    const afterSecondImport = await collectProgressData(repositories)
    expect(afterSecondImport.reviews).toHaveLength(1)
    expect(afterSecondImport.lessons).toEqual(source.lessons)
    repositories.close()
  })

  it('conserva los datos de destino si el archivo es inválido', async () => {
    const repositories = await seedDestination()
    const before = await collectProgressData(repositories)
    const text = await buildFile(sourceData(), { sha256: 'f'.repeat(64) })

    await expectCode(
      importProgress(repositories, text, { confirm: true }),
      'invalid-hash',
    )
    expect(await collectProgressData(repositories)).toEqual(before)
    repositories.close()
  })
})
