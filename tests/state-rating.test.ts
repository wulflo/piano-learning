import { describe, expect, it } from 'vitest'
import {
  DEFAULT_RATING_THRESHOLDS,
  autoReviewRating,
  type RatingThresholds,
} from '../src/state/rating'
import { ReviewRatingSchema } from '../src/schemas'

describe('F2-041 — Calificación automática Easy/Good/Hard/Again', () => {
  it('califica como again cualquier respuesta incorrecta', () => {
    expect(autoReviewRating({ correct: false })).toBe('again')
    expect(autoReviewRating({ correct: false, durationMs: 500 })).toBe('again')
    expect(autoReviewRating({ correct: false, durationMs: 500, usedHint: true })).toBe('again')
  })

  it('califica como easy una respuesta rápida, correcta y sin pista', () => {
    expect(autoReviewRating({ correct: true, durationMs: 1_000 })).toBe('easy')
  })

  it('califica como good una respuesta correcta en tiempo normal', () => {
    expect(autoReviewRating({ correct: true, durationMs: 9_000 })).toBe('good')
  })

  it('califica como hard una respuesta correcta y lenta', () => {
    expect(autoReviewRating({ correct: true, durationMs: 20_000 })).toBe('hard')
  })

  it('califica como hard una respuesta correcta con pista aunque sea rápida', () => {
    expect(autoReviewRating({ correct: true, durationMs: 500, usedHint: true })).toBe('hard')
    expect(autoReviewRating({ correct: true, usedHint: true })).toBe('hard')
  })

  it('respeta los límites exactos de los umbrales', () => {
    const { easyMaxMs, hardMinMs } = DEFAULT_RATING_THRESHOLDS
    expect(autoReviewRating({ correct: true, durationMs: easyMaxMs })).toBe('easy')
    expect(autoReviewRating({ correct: true, durationMs: easyMaxMs + 1 })).toBe('good')
    expect(autoReviewRating({ correct: true, durationMs: hardMinMs - 1 })).toBe('good')
    expect(autoReviewRating({ correct: true, durationMs: hardMinMs })).toBe('hard')
  })

  it('asume tiempo normal cuando no hay duración', () => {
    expect(autoReviewRating({ correct: true })).toBe('good')
  })

  it('acepta umbrales personalizados', () => {
    const thresholds: RatingThresholds = { easyMaxMs: 2_000, hardMinMs: 8_000 }
    expect(autoReviewRating({ correct: true, durationMs: 1_500 }, thresholds)).toBe('easy')
    expect(autoReviewRating({ correct: true, durationMs: 5_000 }, thresholds)).toBe('good')
    expect(autoReviewRating({ correct: true, durationMs: 9_000 }, thresholds)).toBe('hard')
  })

  it('rechaza umbrales inválidos', () => {
    expect(() =>
      autoReviewRating({ correct: true }, { easyMaxMs: 10_000, hardMinMs: 10_000 }),
    ).toThrow(/easyMaxMs < hardMinMs/)
    expect(() =>
      autoReviewRating({ correct: true }, { easyMaxMs: -1, hardMinMs: 10_000 }),
    ).toThrow(/easyMaxMs < hardMinMs/)
  })

  it('siempre devuelve una calificación válida del esquema', () => {
    for (const input of [
      { correct: false },
      { correct: true, durationMs: 0 },
      { correct: true, durationMs: 5_000 },
      { correct: true, durationMs: 15_000 },
      { correct: true, durationMs: 5_000, usedHint: true },
    ]) {
      expect(ReviewRatingSchema.safeParse(autoReviewRating(input)).success).toBe(true)
    }
  })
})
