import { describe, expect, it } from 'vitest'
import {
  DEFAULT_FSRS_PARAMS,
  createFsrsItemCard,
  createFsrsScheduler,
  fsrsParamsFromSettings,
  gradeFsrsItem,
} from '../src/state/fsrs'
import {
  FsrsCardSchema,
  ReviewLogSchema,
  SettingsSchema,
  type FsrsCard,
  type FsrsState,
  type ReviewRating,
} from '../src/schemas'

const FIXED_NOW = new Date('2026-01-01T00:00:00.000Z')

describe('F2-040 — Integrar ts-fsrs con wrapper tipado y parámetros por defecto', () => {
  it('expone los parámetros por defecto de FSRS', () => {
    expect(DEFAULT_FSRS_PARAMS).toEqual({
      desiredRetention: 0.9,
      maximumInterval: 365,
      fuzz: false,
    })
  })

  it('deriva los parámetros de los ajustes persistidos', () => {
    const persisted = SettingsSchema.parse({})
    expect(persisted.desiredRetention).toBe(0.9)
    expect(persisted.maximumInterval).toBe(365)
    expect(persisted.fuzz).toBe(false)
    expect(fsrsParamsFromSettings(persisted)).toEqual(DEFAULT_FSRS_PARAMS)
    expect(
      fsrsParamsFromSettings({ desiredRetention: 0.85, maximumInterval: 120, fuzz: true }),
    ).toEqual({ desiredRetention: 0.85, maximumInterval: 120, fuzz: true })
  })

  it('crea el scheduler con los parámetros persistidos', async () => {
    const scheduler = await createFsrsScheduler({
      desiredRetention: 0.85,
      maximumInterval: 120,
      fuzz: false,
    })
    expect(scheduler).toBeTruthy()
  })

  it('crea una tarjeta nueva para un ítem', async () => {
    const card: FsrsCard = await createFsrsItemCard('skill.fsrs.new-card', DEFAULT_FSRS_PARAMS, FIXED_NOW)
    const parsed = FsrsCardSchema.parse(card)

    expect(parsed.state).toBe('new' as FsrsState)
    expect(parsed.stability).toBe(0)
    expect(parsed.difficulty).toBe(0)
    expect(parsed.reps).toBe(0)
    expect(parsed.lapses).toBe(0)
    expect(parsed.elapsedDays).toBe(0)
    expect(parsed.due).toBe(FIXED_NOW.toISOString())
  })

  it('califica una tarjeta nueva y persiste tarjeta y registro', async () => {
    const created = await createFsrsItemCard('skill.fsrs.good-card', DEFAULT_FSRS_PARAMS, FIXED_NOW)
    const { card, log } = await gradeFsrsItem({
      itemId: 'skill.fsrs.good-card',
      card: created,
      rating: 'good' as ReviewRating,
      now: FIXED_NOW,
      context: { format: 'spell', durationMs: 4200, usedHint: true },
    })

    expect(card.state).toBe('learning')
    expect(card.reps).toBe(1)
    expect(log.rating).toBe('good')
    expect(log.itemId).toBe('skill.fsrs.good-card')
    expect(log.format).toBe('spell')
    expect(log.usedHint).toBe(true)
    expect(log.durationMs).toBe(4200)
    expect(log.reviewedAt).toBe(FIXED_NOW.toISOString())
    expect(ReviewLogSchema.safeParse(log).success).toBe(true)
  })

  it('califica una tarjeta nueva con «again» y avanza el registro', async () => {
    const created = await createFsrsItemCard('skill.fsrs.again-card', DEFAULT_FSRS_PARAMS, FIXED_NOW)
    const { card, log } = await gradeFsrsItem({
      itemId: 'skill.fsrs.again-card',
      card: created,
      rating: 'again' as ReviewRating,
      now: FIXED_NOW,
    })

    expect(card.state).toBe('learning')
    expect(log.rating).toBe('again')
  })

  it('el intervalo máximo limita la planificación', async () => {
    const card: FsrsCard = FsrsCardSchema.parse({
      due: FIXED_NOW.toISOString(),
      stability: 120,
      difficulty: 5,
      elapsedDays: 30,
      scheduledDays: 30,
      reps: 4,
      lapses: 0,
      state: 'review',
      lastReview: '2025-12-01T00:00:00.000Z',
    })

    const capped = await gradeFsrsItem({
      itemId: 'skill.fsrs.max-interval',
      card,
      rating: 'good',
      now: FIXED_NOW,
      fsrsParams: { desiredRetention: 0.9, maximumInterval: 10, fuzz: false },
    })
    const uncapped = await gradeFsrsItem({
      itemId: 'skill.fsrs.max-interval',
      card,
      rating: 'good',
      now: FIXED_NOW,
      fsrsParams: { desiredRetention: 0.9, maximumInterval: 3650, fuzz: false },
    })

    expect(capped.card.scheduledDays).toBeLessThanOrEqual(10)
    expect(new Date(capped.card.due).getTime()).toBeLessThan(
      new Date(uncapped.card.due).getTime(),
    )
  })

  it('una retención mayor acorta los intervalos', async () => {
    const card: FsrsCard = FsrsCardSchema.parse({
      due: FIXED_NOW.toISOString(),
      stability: 30,
      difficulty: 5,
      elapsedDays: 10,
      scheduledDays: 10,
      reps: 5,
      lapses: 0,
      state: 'review',
      lastReview: '2025-12-22T00:00:00.000Z',
    })

    const relaxed = await gradeFsrsItem({
      itemId: 'skill.fsrs.retention',
      card,
      rating: 'good',
      now: FIXED_NOW,
      fsrsParams: { desiredRetention: 0.8, maximumInterval: 3650, fuzz: false },
    })
    const strict = await gradeFsrsItem({
      itemId: 'skill.fsrs.retention',
      card,
      rating: 'good',
      now: FIXED_NOW,
      fsrsParams: { desiredRetention: 0.95, maximumInterval: 3650, fuzz: false },
    })

    expect(new Date(strict.card.due).getTime()).toBeLessThan(
      new Date(relaxed.card.due).getTime(),
    )
  })

  it('el fuzz es determinista y respeta el intervalo máximo', async () => {
    const card: FsrsCard = FsrsCardSchema.parse({
      due: FIXED_NOW.toISOString(),
      stability: 120,
      difficulty: 5,
      elapsedDays: 30,
      scheduledDays: 30,
      reps: 4,
      lapses: 0,
      state: 'review',
      lastReview: '2025-12-01T00:00:00.000Z',
    })
    const params = { desiredRetention: 0.9, maximumInterval: 60, fuzz: true }

    const first = await gradeFsrsItem({
      itemId: 'skill.fsrs.fuzz',
      card,
      rating: 'good',
      now: FIXED_NOW,
      fsrsParams: params,
    })
    const second = await gradeFsrsItem({
      itemId: 'skill.fsrs.fuzz',
      card,
      rating: 'good',
      now: FIXED_NOW,
      fsrsParams: params,
    })

    expect(second.card.due).toBe(first.card.due)
    expect(first.card.scheduledDays).toBeLessThanOrEqual(60)
  })
})
