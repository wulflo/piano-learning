import { describe, expect, it } from 'vitest'
import {
  FsrsCardSchema,
  ReviewLogSchema,
  SkillItemSchema,
  type FsrsCard,
  type SkillItem,
} from '../src/schemas'
import {
  buildReviewDay,
  dailyReviewSeed,
  reviewableSkills,
  reviewsOnDay,
  utcDayKey,
} from '../src/state/review-day'

const NOW = new Date('2026-11-12T15:00:00.000Z')

function skill(
  id: string,
  kind: SkillItem['kind'],
  lessonIds: string[] = [],
): SkillItem {
  return SkillItemSchema.parse({
    id,
    kind,
    labelEs: `Etiqueta ${id}`,
    labelEn: `Label ${id}`,
    lessonIds,
  })
}

function card(due: string, state: FsrsCard['state'] = 'review'): FsrsCard {
  return FsrsCardSchema.parse({
    due,
    stability: 2.5,
    difficulty: 5,
    elapsedDays: 1,
    scheduledDays: 2,
    reps: 3,
    lapses: 0,
    state,
    learningStep: 0,
  })
}

function log(id: string, reviewedAt: string) {
  return ReviewLogSchema.parse({
    id,
    itemId: 'skill.a',
    reviewedAt,
    rating: 'good',
    elapsedDays: 1,
    scheduledDays: 2,
    stability: 2.5,
    difficulty: 5,
    state: 'review',
  })
}

const SKILLS = [
  skill('skill.a', 'note-id', ['lesson.m0-01']),
  skill('skill.b', 'scale', ['lesson.m1-01']),
  skill('skill.c', 'ear-interval'),
  skill('skill.d', 'chord'),
]

describe('F2-061 — Datos del repaso de hoy', () => {
  it('calcula el día UTC y una semilla diaria estable', () => {
    expect(utcDayKey(NOW)).toBe('2026-11-12')
    expect(dailyReviewSeed(NOW)).toBe(dailyReviewSeed(new Date('2026-11-12T23:59:59.000Z')))
    expect(dailyReviewSeed(NOW)).not.toBe(
      dailyReviewSeed(new Date('2026-11-13T00:00:00.000Z')),
    )
  })

  it('cuenta solo los repasos del mismo día UTC', () => {
    const logs = [
      log('log.today.1', '2026-11-12T09:00:00.000Z'),
      log('log.today.2', '2026-11-12T23:00:00.000Z'),
      log('log.yesterday', '2026-11-11T23:59:59.000Z'),
    ]

    expect(reviewsOnDay(logs, NOW).map((entry) => entry.id)).toEqual([
      'log.today.1',
      'log.today.2',
    ])
  })

  it('incluye habilidades empezadas o con tarjeta y descarta el resto', () => {
    const progress = [
      {
        id: 'skill.d',
        card: card('2026-11-20T00:00:00.000Z'),
        mastery: 0.4,
        correct: 1,
        incorrect: 1,
      },
    ]

    expect(
      reviewableSkills(SKILLS, new Set(['skill.a', 'skill.b']), progress).map(
        (item) => item.id,
      ),
    ).toEqual(['skill.a', 'skill.b', 'skill.d'])
    expect(reviewableSkills(SKILLS, new Set(), []).map((item) => item.id)).toEqual([])
  })

  it('arma cola, previsión y progreso diario', () => {
    const progress = [
      {
        id: 'skill.c',
        card: card('2026-11-11T10:00:00.000Z'),
        mastery: 0.5,
        correct: 2,
        incorrect: 1,
      },
      {
        id: 'skill.d',
        card: card('2026-11-13T10:00:00.000Z'),
        mastery: 0.7,
        correct: 4,
        incorrect: 0,
      },
    ]
    const logs = [
      log('log.today.1', '2026-11-12T09:00:00.000Z'),
      log('log.today.2', '2026-11-12T11:00:00.000Z'),
    ]

    const day = buildReviewDay(SKILLS, progress, logs, {
      now: NOW,
      newPerDay: 1,
      seed: 7,
      days: 7,
    })

    expect(day.queue.counts).toEqual({ due: 1, new: 1, total: 2 })
    expect(day.queue.entries[0]?.itemId).toBe('skill.c')
    expect(day.queue.entries[0]?.status).toBe('due')
    expect(day.cards).toHaveLength(2)
    expect(day.forecast.overdue).toBe(1)
    expect(day.forecast.days[1]?.due).toBe(1)
    expect(day.forecast.total).toBe(2)
    expect(day.reviewedToday).toBe(2)
  })

  it('respeta el tope de nuevos y deja pasar los vencidos', () => {
    const progress = [
      {
        id: 'skill.c',
        card: card('2026-11-11T10:00:00.000Z'),
        mastery: 0.5,
        correct: 2,
        incorrect: 1,
      },
    ]

    const day = buildReviewDay(SKILLS, progress, [], {
      now: NOW,
      newPerDay: 0,
      seed: 1,
    })

    expect(day.queue.entries.map((entry) => entry.itemId)).toEqual(['skill.c'])
    expect(day.queue.counts).toEqual({ due: 1, new: 0, total: 1 })
  })

  it('es determinista con la misma semilla y no muta las entradas', () => {
    const progressBefore = JSON.stringify(SKILLS)
    const first = buildReviewDay(SKILLS, [], [], { now: NOW, newPerDay: 4, seed: 3 })
    const second = buildReviewDay(SKILLS, [], [], { now: NOW, newPerDay: 4, seed: 3 })

    expect(first.queue.entries).toEqual(second.queue.entries)
    expect(JSON.stringify(SKILLS)).toBe(progressBefore)
  })

  it('funciona sin habilidades ni repasos', () => {
    const day = buildReviewDay([], [], [], { now: NOW, newPerDay: 20 })

    expect(day.queue.entries).toEqual([])
    expect(day.queue.counts).toEqual({ due: 0, new: 0, total: 0 })
    expect(day.forecast.total).toBe(0)
    expect(day.reviewedToday).toBe(0)
  })
})
