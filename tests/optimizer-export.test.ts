import { describe, expect, it } from 'vitest'
import {
  OPTIMIZER_CSV_HEADER,
  optimizerExportFilename,
  serializeReviewHistoryForOptimizer,
} from '../src/state/optimizer-export'
import type { ReviewLog } from '../src/schemas'

function log(overrides: Partial<ReviewLog> = {}): ReviewLog {
  return {
    id: 'skill.a.log.1',
    itemId: 'skill.a',
    reviewedAt: '2026-03-10T08:00:00.000Z',
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

const LOGS: ReviewLog[] = [
  log({
    id: 'skill.b.log.1',
    itemId: 'skill.b',
    reviewedAt: '2026-03-11T08:00:00.000Z',
    rating: 'easy',
    durationMs: 900,
  }),
  log({
    id: 'skill.a.log.1',
    itemId: 'skill.a',
    reviewedAt: '2026-03-10T08:00:00.000Z',
    rating: 'again',
    state: 'relearning',
  }),
  log({
    id: 'skill.c.log.1',
    itemId: 'skill.c',
    reviewedAt: '2026-03-10T09:00:00.000Z',
    rating: 'good',
    state: 'learning',
  }),
  log({
    id: 'skill.a.log.2',
    itemId: 'skill.a',
    reviewedAt: '2026-03-12T08:00:00.000Z',
    rating: 'hard',
    durationMs: 1200,
  }),
  log({
    id: 'skill.d.log.1',
    itemId: 'skill.d',
    reviewedAt: '2026-03-13T08:00:00.000Z',
    rating: 'good',
    state: 'new',
  }),
]

function ms(iso: string): number {
  return Date.parse(iso)
}

describe('F2-047 — Exportación del historial para el optimizador', () => {
  it('serializa el revlog en CSV con el formato de los optimizadores', () => {
    const result = serializeReviewHistoryForOptimizer(LOGS)

    expect(result.cardCount).toBe(4)
    expect(result.reviewCount).toBe(5)
    expect(result.csv.split('\n')).toEqual([
      OPTIMIZER_CSV_HEADER,
      `${ms('2026-03-10T08:00:00.000Z')},1,1,0,3`,
      `${ms('2026-03-10T09:00:00.000Z')},3,3,0,1`,
      `${ms('2026-03-11T08:00:00.000Z')},2,4,900,2`,
      `${ms('2026-03-12T08:00:00.000Z')},1,2,1200,2`,
      `${ms('2026-03-13T08:00:00.000Z')},4,3,0,0`,
      '',
    ])
  })

  it('ordena los repasos y asigna ids estables por ítem', () => {
    const first = serializeReviewHistoryForOptimizer(LOGS)
    const second = serializeReviewHistoryForOptimizer([...LOGS].reverse())

    expect(second.csv).toBe(first.csv)
    expect(second.cardCount).toBe(first.cardCount)
    expect(second.reviewCount).toBe(first.reviewCount)
  })

  it('usa el fin de línea configurado', () => {
    const result = serializeReviewHistoryForOptimizer(LOGS.slice(0, 1), { newline: '\r\n' })

    expect(result.csv).toBe(
      `${OPTIMIZER_CSV_HEADER}\r\n${ms('2026-03-11T08:00:00.000Z')},1,4,900,2\r\n`,
    )
  })

  it('exporta solo la cabecera sin historial', () => {
    expect(serializeReviewHistoryForOptimizer([])).toEqual({
      csv: `${OPTIMIZER_CSV_HEADER}\n`,
      cardCount: 0,
      reviewCount: 0,
    })
  })

  it('sugiere un nombre de archivo con la fecha', () => {
    expect(optimizerExportFilename(new Date('2026-11-11T15:30:00.000Z'))).toBe(
      'pianodesdecero-revlog-2026-11-11.csv',
    )
  })
})
