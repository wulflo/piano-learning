import { describe, expect, it } from 'vitest'
import { FsrsCardSchema, type FsrsCard } from '../src/schemas'
import { createProgressDatabase } from '../src/state/db'
import {
  applyReviewToSkill,
  recordReview,
  reviewFormatForKind,
} from '../src/state/practice-log'
import { createProgressRepositories } from '../src/state/repositories'

let databaseCounter = 0

function uniqueDatabaseName(): string {
  databaseCounter += 1
  return `pdc.test.practice-log.${databaseCounter}`
}

function card(overrides: Partial<FsrsCard> = {}): FsrsCard {
  return FsrsCardSchema.parse({
    due: '2026-03-10T10:00:00.000Z',
    stability: 2.5,
    difficulty: 5,
    elapsedDays: 1,
    scheduledDays: 2,
    reps: 3,
    lapses: 0,
    state: 'review',
    learningStep: 0,
    ...overrides,
  })
}

describe('F2-067 — Autoevaluación y registro de práctica', () => {
  it('elige el formato de práctica según el tipo de habilidad', () => {
    expect(reviewFormatForKind('keyboard-task')).toBe('play')
    expect(reviewFormatForKind('ear-interval')).toBe('hear')
    expect(reviewFormatForKind('ear-chord')).toBe('hear')
    expect(reviewFormatForKind('ear-scale')).toBe('hear')
    expect(reviewFormatForKind('ear-progression')).toBe('hear')
    expect(reviewFormatForKind('sound-parameter')).toBe('hear')
    expect(reviewFormatForKind('note-id')).toBe('see')
    expect(reviewFormatForKind('key-signature')).toBe('see')
    expect(reviewFormatForKind('scale')).toBe('spell')
    expect(reviewFormatForKind('rhythm')).toBe('spell')
  })

  it('actualiza maestría y respuestas con cada calificación', () => {
    const fsrsCard = card()

    expect(applyReviewToSkill(undefined, fsrsCard, 'good')).toMatchObject({
      mastery: 0.1,
      correct: 1,
      incorrect: 0,
      card: fsrsCard,
    })
    expect(applyReviewToSkill(undefined, fsrsCard, 'easy')).toMatchObject({
      mastery: 0.15,
      correct: 1,
      incorrect: 0,
    })
    expect(
      applyReviewToSkill(
        { card: fsrsCard, mastery: 0.2, correct: 4, incorrect: 1 },
        fsrsCard,
        'again',
      ),
    ).toMatchObject({
      mastery: 0.1,
      correct: 4,
      incorrect: 2,
    })
  })

  it('limita la maestría al rango 0–1', () => {
    expect(
      applyReviewToSkill(
        { mastery: 0.95, correct: 0, incorrect: 0 },
        card(),
        'easy',
      ).mastery,
    ).toBe(1)
    expect(
      applyReviewToSkill(
        { mastery: 0.05, correct: 0, incorrect: 0 },
        card(),
        'again',
      ).mastery,
    ).toBe(0)
  })

  it('crea la tarjeta FSRS y guarda resultado, duración y formato', async () => {
    const name = uniqueDatabaseName()
    const repositories = createProgressRepositories(
      createProgressDatabase({ name }),
    )
    const now = new Date('2026-03-10T10:00:00.000Z')

    try {
      const result = await recordReview(repositories, {
        itemId: 'skill.keyboard-groups',
        kind: 'keyboard-task',
        rating: 'good',
        durationMs: 4_200,
        now,
      })

      expect(result.log).toMatchObject({
        itemId: 'skill.keyboard-groups',
        rating: 'good',
        durationMs: 4_200,
        format: 'play',
        usedHint: false,
      })
      expect(result.progress).toMatchObject({
        id: 'skill.keyboard-groups',
        mastery: 0.1,
        correct: 1,
        incorrect: 0,
        card: result.card,
      })
      expect(await repositories.skills.get('skill.keyboard-groups')).toMatchObject({
        mastery: 0.1,
        correct: 1,
        incorrect: 0,
        card: result.card,
      })
      const logs = await repositories.reviews.all('skill.keyboard-groups')
      expect(logs).toHaveLength(1)
      expect(logs[0]).toEqual(result.log)
    } finally {
      repositories.close()
    }
  })

  it('avanza una tarjeta existente y conserva el historial anterior', async () => {
    const name = uniqueDatabaseName()
    const repositories = createProgressRepositories(
      createProgressDatabase({ name }),
    )
    const firstNow = new Date('2026-03-10T10:00:00.000Z')
    const secondNow = new Date('2026-03-12T10:00:00.000Z')

    try {
      const first = await recordReview(repositories, {
        itemId: 'skill.note-names',
        kind: 'note-id',
        rating: 'hard',
        durationMs: 1_000,
        now: firstNow,
      })
      const second = await recordReview(repositories, {
        itemId: 'skill.note-names',
        kind: 'note-id',
        rating: 'easy',
        durationMs: 800,
        now: secondNow,
      })

      expect(second.card.reps).toBeGreaterThan(first.card.reps)
      const logs = await repositories.reviews.all('skill.note-names')
      expect(logs).toHaveLength(2)
      expect(logs.map((log) => log.rating)).toEqual(['hard', 'easy'])
      expect(logs.map((log) => log.format)).toEqual(['see', 'see'])
      expect(await repositories.skills.get('skill.note-names')).toMatchObject({
        mastery: 0.2,
        correct: 2,
        incorrect: 0,
        card: second.card,
      })
    } finally {
      repositories.close()
    }
  })

  it('registra un fallo sin borrar la tarjeta ni el progreso previo', async () => {
    const name = uniqueDatabaseName()
    const repositories = createProgressRepositories(
      createProgressDatabase({ name }),
    )
    const now = new Date('2026-03-10T10:00:00.000Z')

    try {
      await repositories.skills.put('skill.ear-interval', {
        card: card(),
        mastery: 0.5,
        correct: 3,
        incorrect: 0,
      })
      const result = await recordReview(repositories, {
        itemId: 'skill.ear-interval',
        kind: 'ear-interval',
        rating: 'again',
        durationMs: 9_000,
        now,
      })

      expect(result.log.format).toBe('hear')
      expect(result.log.rating).toBe('again')
      expect(result.progress).toMatchObject({
        mastery: 0.4,
        correct: 3,
        incorrect: 1,
      })
      expect(result.card.reps).toBeGreaterThanOrEqual(3)
    } finally {
      repositories.close()
    }
  })

  it('rechaza ids inválidos sin escribir nada', async () => {
    const name = uniqueDatabaseName()
    const repositories = createProgressRepositories(
      createProgressDatabase({ name }),
    )

    try {
      await expect(
        recordReview(repositories, {
          itemId: 'id con espacios',
          kind: 'note-id',
          rating: 'good',
          durationMs: 100,
          now: new Date('2026-03-10T10:00:00.000Z'),
        }),
      ).rejects.toThrow()
      expect(await repositories.reviews.count()).toBe(0)
      expect(await repositories.skills.all()).toEqual([])
    } finally {
      repositories.close()
    }
  })
})
