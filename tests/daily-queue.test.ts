import { describe, expect, it } from 'vitest'
import { buildDailyQueue, type QueueCandidate } from '../src/state/daily-queue'
import { FsrsCardSchema, type FsrsCard, type SkillKind } from '../src/schemas'

const NOW = new Date('2026-03-10T12:00:00.000Z')

function makeCard(overrides: Partial<FsrsCard> = {}): FsrsCard {
  return FsrsCardSchema.parse({
    due: '2026-03-09T12:00:00.000Z',
    stability: 4,
    difficulty: 5,
    elapsedDays: 1,
    scheduledDays: 1,
    reps: 2,
    lapses: 0,
    state: 'review',
    ...overrides,
  })
}

function candidate(
  itemId: string,
  kind: SkillKind,
  overrides: Partial<FsrsCard> = {},
): QueueCandidate {
  return { itemId, kind, card: makeCard(overrides) }
}

function fresh(itemId: string, kind: SkillKind = 'note-id'): QueueCandidate {
  return { itemId, kind }
}

describe('F2-043 — Construir la cola diaria con intercalado y límite de nuevos', () => {
  it('prioriza los vencidos y los ordena por fecha de vencimiento', () => {
    const queue = buildDailyQueue(
      [
        candidate('skill.due.later', 'scale', { due: '2026-03-10T11:00:00.000Z' }),
        candidate('skill.future', 'chord', { due: '2026-03-11T12:00:00.000Z' }),
        candidate('skill.due.earlier', 'interval', {
          due: '2026-03-08T12:00:00.000Z',
        }),
        fresh('skill.new.one', 'note-id'),
      ],
      { now: NOW, newPerDay: 10, seed: 7 },
    )

    expect(queue.entries.map((entry) => entry.itemId)).toEqual([
      'skill.due.earlier',
      'skill.due.later',
      'skill.new.one',
    ])
    expect(queue.entries.map((entry) => entry.status)).toEqual(['due', 'due', 'new'])
    expect(queue.entries.some((entry) => entry.itemId === 'skill.future')).toBe(false)
    expect(queue.counts).toEqual({ due: 2, new: 1, total: 3 })
  })

  it('respeta newPerDay para los ítems nuevos', () => {
    const candidates = [
      fresh('skill.new.a'),
      fresh('skill.new.b'),
      fresh('skill.new.c'),
      fresh('skill.new.d'),
      fresh('skill.new.e'),
    ]

    const queue = buildDailyQueue(candidates, { now: NOW, newPerDay: 2, seed: 3 })

    expect(queue.entries).toHaveLength(2)
    expect(queue.counts).toEqual({ due: 0, new: 2, total: 2 })
    expect(queue.entries.every((entry) => entry.status === 'new')).toBe(true)
  })

  it('incluye todos los vencidos aunque newPerDay sea 0', () => {
    const queue = buildDailyQueue(
      [
        candidate('skill.due.a', 'note-id'),
        candidate('skill.due.b', 'scale'),
        fresh('skill.new.a'),
        fresh('skill.new.b'),
      ],
      { now: NOW, newPerDay: 0, seed: 5 },
    )

    expect(queue.entries.map((entry) => entry.itemId).sort()).toEqual([
      'skill.due.a',
      'skill.due.b',
    ])
    expect(queue.counts).toEqual({ due: 2, new: 0, total: 2 })
  })

  it('intercala temas para no repetir el mismo tipo consecutivamente', () => {
    const queue = buildDailyQueue(
      [
        candidate('skill.note.a', 'note-id', { due: '2026-03-08T12:00:00.000Z' }),
        candidate('skill.note.b', 'note-id', { due: '2026-03-09T12:00:00.000Z' }),
        candidate('skill.scale.a', 'scale', { due: '2026-03-10T10:00:00.000Z' }),
        candidate('skill.scale.b', 'scale', { due: '2026-03-10T11:00:00.000Z' }),
      ],
      { now: NOW, newPerDay: 0, seed: 11 },
    )

    const kinds = queue.entries.map((entry) => entry.kind)
    for (let index = 1; index < kinds.length; index += 1) {
      expect(kinds[index]).not.toBe(kinds[index - 1])
    }
  })

  it('excluye las tarjetas de repaso que todavía no vencieron', () => {
    const queue = buildDailyQueue(
      [
        candidate('skill.due', 'note-id', { due: '2026-03-10T11:59:59.000Z' }),
        candidate('skill.not-due', 'scale', { due: '2026-03-10T12:00:01.000Z' }),
      ],
      { now: NOW, newPerDay: 10, seed: 2 },
    )

    expect(queue.entries.map((entry) => entry.itemId)).toEqual(['skill.due'])
  })

  it('incluye una tarjeta que vence exactamente en now', () => {
    const queue = buildDailyQueue(
      [candidate('skill.exact', 'interval', { due: NOW.toISOString() })],
      { now: NOW, newPerDay: 0, seed: 1 },
    )

    expect(queue.entries).toEqual([
      { itemId: 'skill.exact', kind: 'interval', status: 'due' },
    ])
  })

  it('trata las tarjetas sin estado de repaso como nuevas', () => {
    const queue = buildDailyQueue(
      [
        { itemId: 'skill.no-card', kind: 'note-id' },
        candidate('skill.new-state', 'scale', { state: 'new', due: '2026-03-09T12:00:00.000Z' }),
      ],
      { now: NOW, newPerDay: 5, seed: 1 },
    )

    expect(queue.entries).toHaveLength(2)
    expect(queue.counts).toEqual({ due: 0, new: 2, total: 2 })
    expect(queue.entries.every((entry) => entry.status === 'new')).toBe(true)
  })

  it('aplica el límite global a la cola resultante', () => {
    const queue = buildDailyQueue(
      [
        candidate('skill.due.a', 'note-id', { due: '2026-03-08T12:00:00.000Z' }),
        candidate('skill.due.b', 'scale', { due: '2026-03-09T12:00:00.000Z' }),
        candidate('skill.due.c', 'interval', { due: '2026-03-10T11:00:00.000Z' }),
        fresh('skill.new.a', 'chord'),
        fresh('skill.new.b', 'rhythm'),
      ],
      { now: NOW, newPerDay: 5, limit: 4, seed: 9 },
    )

    expect(queue.entries).toHaveLength(4)
    expect(queue.counts).toEqual({ due: 3, new: 1, total: 4 })
  })

  it('es determinista con el mismo now y la misma semilla', () => {
    const candidates = [
      fresh('skill.new.a'),
      fresh('skill.new.b'),
      fresh('skill.new.c'),
      fresh('skill.new.d'),
      fresh('skill.new.e'),
      fresh('skill.new.f'),
    ]

    const first = buildDailyQueue(candidates, { now: NOW, newPerDay: 6, seed: 42 })
    const second = buildDailyQueue(candidates, { now: NOW, newPerDay: 6, seed: 42 })

    expect(first).toEqual(second)
  })

  it('varía el orden de los nuevos con la semilla', () => {
    const candidates = [
      fresh('skill.new.a'),
      fresh('skill.new.b'),
      fresh('skill.new.c'),
      fresh('skill.new.d'),
      fresh('skill.new.e'),
      fresh('skill.new.f'),
    ]

    const orders = new Set(
      [1, 2, 3, 4, 5].map((seed) =>
        buildDailyQueue(candidates, { now: NOW, newPerDay: 6, seed })
          .entries.map((entry) => entry.itemId)
          .join(','),
      ),
    )

    expect(orders.size).toBeGreaterThan(1)
  })

  it('devuelve una cola vacía sin candidatos', () => {
    expect(buildDailyQueue([], { now: NOW, newPerDay: 20 })).toEqual({
      entries: [],
      counts: { due: 0, new: 0, total: 0 },
    })
  })
})
