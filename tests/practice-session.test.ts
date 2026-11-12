import { describe, expect, it } from 'vitest'
import type { PracticeSession } from '../src/schemas'
import { createProgressDatabase } from '../src/state/db'
import { createProgressRepositories } from '../src/state/repositories'

let databaseCounter = 0

function uniqueDatabaseName(): string {
  databaseCounter += 1
  return `pdc.test.practice-session.${databaseCounter}`
}

function session(overrides: Partial<PracticeSession> = {}): PracticeSession {
  return {
    id: 'session.test.1',
    startedAt: '2026-03-10T10:00:00.000Z',
    endedAt: '2026-03-10T10:30:00.000Z',
    plannedMinutes: 30,
    blocks: [
      { kind: 'warmup', seconds: 300 },
      { kind: 'technique', seconds: 480 },
      { kind: 'theory', seconds: 360 },
      { kind: 'repertoire', seconds: 420 },
      { kind: 'review', seconds: 240 },
    ],
    ...overrides,
  }
}

describe('F2-068 — Registro de sesiones de práctica', () => {
  it('guarda la sesión y suma XP y racha en una transacción', async () => {
    const repositories = createProgressRepositories(
      createProgressDatabase({ name: uniqueDatabaseName() }),
    )

    try {
      const result = await repositories.recordPracticeSession(session())

      expect(result.session).toEqual(session())
      expect(await repositories.sessions.all()).toEqual([session()])
      expect(result.profile).toMatchObject({
        xp: 60,
        level: 1,
      })
      expect(result.profile.streak).toMatchObject({
        current: 1,
        longest: 1,
        lastPracticeDate: '2026-03-10',
      })
      expect(await repositories.profile.get()).toEqual(result.profile)
    } finally {
      repositories.close()
    }
  })

  it('no duplica la recompensa si se reintenta el mismo guardado', async () => {
    const repositories = createProgressRepositories(
      createProgressDatabase({ name: uniqueDatabaseName() }),
    )

    try {
      const first = await repositories.recordPracticeSession(session())
      const second = await repositories.recordPracticeSession(session())

      expect(second.profile).toEqual(first.profile)
      expect(second.session).toEqual(first.session)
      expect(second.profile.xp).toBe(60)
      expect(await repositories.sessions.all()).toHaveLength(1)
    } finally {
      repositories.close()
    }
  })

  it('guarda una sesión corta sin sumar XP ni racha', async () => {
    const repositories = createProgressRepositories(
      createProgressDatabase({ name: uniqueDatabaseName() }),
    )

    try {
      const result = await repositories.recordPracticeSession(
        session({
          id: 'session.test.short',
          plannedMinutes: 15,
          blocks: [
            { kind: 'warmup', seconds: 45 },
            { kind: 'technique', seconds: 0 },
            { kind: 'theory', seconds: 0 },
            { kind: 'repertoire', seconds: 0 },
            { kind: 'review', seconds: 0 },
          ],
        }),
      )

      expect(await repositories.sessions.all()).toHaveLength(1)
      expect(result.profile.xp).toBe(0)
      expect(result.profile.streak.current).toBe(0)
      expect(result.profile.streak.lastPracticeDate).toBeUndefined()
    } finally {
      repositories.close()
    }
  })

  it('rechaza una sesión inválida sin escribir nada', async () => {
    const repositories = createProgressRepositories(
      createProgressDatabase({ name: uniqueDatabaseName() }),
    )

    try {
      await expect(
        repositories.recordPracticeSession({
          ...session(),
          plannedMinutes: 20,
        } as unknown as PracticeSession),
      ).rejects.toThrow()
      expect(await repositories.sessions.all()).toEqual([])
      expect((await repositories.profile.get()).xp).toBe(0)
    } finally {
      repositories.close()
    }
  })
})
