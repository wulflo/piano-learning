import { describe, expect, it } from 'vitest'
import { computeReviewStats } from '../src/state/stats'
import type { ReviewLog, SkillKind } from '../src/schemas'

function log(overrides: Partial<ReviewLog> = {}): ReviewLog {
  return {
    id: 'skill.test.log.1',
    itemId: 'skill.test',
    reviewedAt: '2026-03-10T10:00:00.000Z',
    rating: 'good',
    elapsedDays: 1,
    scheduledDays: 1,
    stability: 2,
    difficulty: 5,
    state: 'review',
    usedHint: false,
    ...overrides,
  }
}

describe('F2-046 — Estadísticas de retención y precisión', () => {
  it('calcula la retención por día sobre repasos programados', () => {
    const stats = computeReviewStats([
      log({ id: 'skill.a.log.1', reviewedAt: '2026-03-10T10:00:00.000Z', rating: 'good' }),
      log({ id: 'skill.a.log.2', reviewedAt: '2026-03-10T11:00:00.000Z', rating: 'again' }),
      log({ id: 'skill.a.log.3', reviewedAt: '2026-03-10T12:00:00.000Z', state: 'learning' }),
      log({
        id: 'skill.b.log.1',
        reviewedAt: '2026-03-11T10:00:00.000Z',
        state: 'relearning',
        rating: 'hard',
      }),
      log({ id: 'skill.b.log.2', reviewedAt: '2026-03-11T11:00:00.000Z', rating: 'easy' }),
    ])

    expect(stats.period).toBe('day')
    expect(stats.retention).toEqual([
      { period: '2026-03-10', reviewed: 2, recalled: 1, retention: 0.5 },
      { period: '2026-03-11', reviewed: 2, recalled: 2, retention: 1 },
    ])
    expect(stats.totals).toEqual({ reviewed: 5, correct: 4, retention: 0.8 })
  })

  it('agrupa la retención por semana ISO y por mes', () => {
    const weekly = computeReviewStats(
      [
        log({ id: 'skill.a.log.1', reviewedAt: '2026-03-09T10:00:00.000Z', rating: 'good' }),
        log({ id: 'skill.a.log.2', reviewedAt: '2026-03-15T10:00:00.000Z', rating: 'again' }),
        log({ id: 'skill.a.log.3', reviewedAt: '2026-03-16T10:00:00.000Z', rating: 'good' }),
      ],
      { period: 'week' },
    )

    expect(weekly.retention).toEqual([
      { period: '2026-03-09', reviewed: 2, recalled: 1, retention: 0.5 },
      { period: '2026-03-16', reviewed: 1, recalled: 1, retention: 1 },
    ])

    const monthly = computeReviewStats(
      [
        log({ id: 'skill.a.log.1', reviewedAt: '2026-03-31T10:00:00.000Z' }),
        log({ id: 'skill.a.log.2', reviewedAt: '2026-04-01T10:00:00.000Z', rating: 'again' }),
      ],
      { period: 'month' },
    )

    expect(monthly.retention).toEqual([
      { period: '2026-03', reviewed: 1, recalled: 1, retention: 1 },
      { period: '2026-04', reviewed: 1, recalled: 0, retention: 0 },
    ])
  })

  it('calcula la precisión por tipo de habilidad desde el historial', () => {
    const kinds: Record<string, SkillKind> = {
      'skill.note.a': 'note-id',
      'skill.note.b': 'note-id',
      'skill.scale.a': 'scale',
    }
    const stats = computeReviewStats(
      [
        log({ id: 'skill.note.a.log.1', itemId: 'skill.note.a', rating: 'good' }),
        log({ id: 'skill.note.b.log.1', itemId: 'skill.note.b', rating: 'again' }),
        log({ id: 'skill.scale.a.log.1', itemId: 'skill.scale.a', rating: 'hard' }),
        log({ id: 'skill.unknown.log.1', itemId: 'skill.unknown', rating: 'easy' }),
      ],
      { kindForItem: (itemId) => kinds[itemId] },
    )

    expect(stats.accuracy).toEqual([
      { kind: 'note-id', reviewed: 2, correct: 1, accuracy: 0.5 },
      { kind: 'scale', reviewed: 1, correct: 1, accuracy: 1 },
      { kind: 'unknown', reviewed: 1, correct: 1, accuracy: 1 },
    ])
  })

  it('agrupa todo como unknown si no hay resolvedor de tipos', () => {
    const stats = computeReviewStats([
      log({ id: 'skill.a.log.1', itemId: 'skill.a' }),
      log({ id: 'skill.b.log.1', itemId: 'skill.b', rating: 'again' }),
    ])

    expect(stats.accuracy).toEqual([
      { kind: 'unknown', reviewed: 2, correct: 1, accuracy: 0.5 },
    ])
  })

  it('devuelve estadísticas vacías sin historial', () => {
    expect(computeReviewStats([])).toEqual({
      period: 'day',
      retention: [],
      accuracy: [],
      totals: { reviewed: 0, correct: 0, retention: 0 },
    })
  })

  it('calcula la retención como proporción de respuestas no falladas', () => {
    const stats = computeReviewStats([
      log({ id: 'skill.a.log.1', rating: 'again' }),
      log({ id: 'skill.a.log.2', rating: 'hard' }),
      log({ id: 'skill.a.log.3', rating: 'good' }),
      log({ id: 'skill.a.log.4', rating: 'easy' }),
    ])

    expect(stats.totals.retention).toBe(0.75)
    expect(stats.retention[0].retention).toBe(0.75)
  })
})
