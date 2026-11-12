import { describe, expect, it } from 'vitest'
import { createReviewHistoryStore } from '../src/state/review-history'
import { createFsrsItemCard, gradeFsrsItem } from '../src/state/fsrs'
import { autoReviewRating } from '../src/state/rating'
import type { ReviewLog } from '../src/schemas'

let databaseCounter = 0

function uniqueDatabaseName(): string {
  databaseCounter += 1
  return `pdc.test.review-history.${databaseCounter}`
}

function makeLog(overrides: Partial<ReviewLog> = {}): ReviewLog {
  return {
    id: 'skill.test.log.1',
    itemId: 'skill.test',
    reviewedAt: '2026-01-01T00:00:00.000Z',
    rating: 'good',
    elapsedDays: 0,
    scheduledDays: 0,
    stability: 1,
    difficulty: 5,
    state: 'learning',
    usedHint: false,
    ...overrides,
  }
}

describe('F2-042 — Persistir todo el historial de repasos', () => {
  it('guarda una respuesta con calificación, tiempos y estado', async () => {
    const store = await createReviewHistoryStore({ dbName: uniqueDatabaseName() })
    const log = makeLog({ durationMs: 4_200, usedHint: true, format: 'play' })
    await store.save(log)

    const all = await store.all()
    expect(all).toHaveLength(1)
    expect(all[0]).toMatchObject({
      id: log.id,
      itemId: 'skill.test',
      rating: 'good',
      durationMs: 4_200,
      usedHint: true,
      format: 'play',
      state: 'learning',
    })
    store.close()
  })

  it('conserva el historial al cerrar y reabrir la base', async () => {
    const dbName = uniqueDatabaseName()
    const first = await createReviewHistoryStore({ dbName })
    await first.save(makeLog({ id: 'skill.test.log.1' }))
    await first.save(
      makeLog({
        id: 'skill.test.log.2',
        reviewedAt: '2026-01-02T00:00:00.000Z',
        rating: 'again',
        state: 'relearning',
      }),
    )
    first.close()

    const reopened = await createReviewHistoryStore({ dbName })
    expect(await reopened.count()).toBe(2)
    const all = await reopened.all()
    expect(all.map((log) => log.id)).toEqual(['skill.test.log.1', 'skill.test.log.2'])
    expect(all[1].rating).toBe('again')

    reopened.close()
  })

  it('filtra el historial por ítem', async () => {
    const store = await createReviewHistoryStore({ dbName: uniqueDatabaseName() })
    await store.save(makeLog({ id: 'skill.a.log.1', itemId: 'skill.a' }))
    await store.save(makeLog({ id: 'skill.b.log.1', itemId: 'skill.b' }))
    await store.save(makeLog({ id: 'skill.a.log.2', itemId: 'skill.a', reviewedAt: '2026-01-02T00:00:00.000Z' }))

    const itemA = await store.all('skill.a')
    const itemB = await store.all('skill.b')

    expect(itemA.map((log) => log.id)).toEqual(['skill.a.log.1', 'skill.a.log.2'])
    expect(itemB.map((log) => log.id)).toEqual(['skill.b.log.1'])
    store.close()
  })

  it('ordena el historial por fecha de repaso', async () => {
    const store = await createReviewHistoryStore({ dbName: uniqueDatabaseName() })
    await store.save(makeLog({ id: 'skill.test.log.2', reviewedAt: '2026-01-03T00:00:00.000Z' }))
    await store.save(makeLog({ id: 'skill.test.log.1', reviewedAt: '2026-01-01T00:00:00.000Z' }))
    await store.save(makeLog({ id: 'skill.test.log.3', reviewedAt: '2026-01-02T00:00:00.000Z' }))

    const all = await store.all()
    expect(all.map((log) => log.reviewedAt)).toEqual([
      '2026-01-01T00:00:00.000Z',
      '2026-01-02T00:00:00.000Z',
      '2026-01-03T00:00:00.000Z',
    ])
    store.close()
  })

  it('rechaza registros inválidos y no los guarda', async () => {
    const store = await createReviewHistoryStore({ dbName: uniqueDatabaseName() })
    const invalid = { ...makeLog(), rating: 'bien' } as unknown as ReviewLog

    await expect(store.save(invalid)).rejects.toThrow()
    expect(await store.count()).toBe(0)
    store.close()
  })

  it('guarda una respuesta producida por el motor FSRS', async () => {
    const store = await createReviewHistoryStore({ dbName: uniqueDatabaseName() })
    const now = new Date('2026-01-01T00:00:00.000Z')
    const created = await createFsrsItemCard('skill.fsrs.history', undefined, now)
    const rating = autoReviewRating({ correct: true, durationMs: 1_200 })
    const { log } = await gradeFsrsItem({
      itemId: 'skill.fsrs.history',
      card: created,
      rating,
      now,
      context: { format: 'spell', durationMs: 1_200 },
    })

    await store.save(log)
    const [saved] = await store.all('skill.fsrs.history')
    expect(saved.rating).toBe('easy')
    // En FSRS-6 una tarjeta nueva calificada como Easy pasa directo a repaso.
    expect(saved.state).toBe('review')
    expect(saved.durationMs).toBe(1_200)
    expect(saved.format).toBe('spell')
    store.close()
  })

  it('vacía el historial con clear', async () => {
    const store = await createReviewHistoryStore({ dbName: uniqueDatabaseName() })
    await store.save(makeLog())
    expect(await store.count()).toBe(1)

    await store.clear()
    expect(await store.count()).toBe(0)
    expect(await store.all()).toEqual([])
    store.close()
  })
})
