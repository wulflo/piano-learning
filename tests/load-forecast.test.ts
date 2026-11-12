import { describe, expect, it } from 'vitest'
import {
  DAILY_CAP_MAX,
  DAILY_CAP_MIN,
  DEFAULT_DAILY_CAP,
  FORECAST_DAYS,
  forecastLoad,
  normalizeDailyCap,
} from '../src/state/load-forecast'
import { FsrsCardSchema, type FsrsCard, type FsrsState } from '../src/schemas'

const NOW = new Date('2026-03-10T12:00:00.000Z')

function card(due: string, state: FsrsState = 'review'): FsrsCard {
  return FsrsCardSchema.parse({
    due,
    stability: 2,
    difficulty: 5,
    elapsedDays: 1,
    scheduledDays: 1,
    reps: 1,
    lapses: 0,
    state,
  })
}

describe('F2-044 — Previsión de carga y tope diario configurable', () => {
  it('agrupa los vencimientos en siete días UTC desde hoy', () => {
    const forecast = forecastLoad(
      [
        card('2026-03-10T00:00:00.000Z'),
        card('2026-03-10T23:59:59.000Z'),
        card('2026-03-11T00:00:00.000Z'),
        card('2026-03-16T23:00:00.000Z'),
        card('2026-03-17T00:00:00.000Z'),
        card('2026-03-09T23:59:59.000Z'),
        card('2026-03-10T12:00:00.000Z', 'new'),
        card('2026-03-12T12:00:00.000Z', 'learning'),
      ],
      { now: NOW },
    )

    expect(forecast.days).toHaveLength(FORECAST_DAYS)
    expect(forecast.days.map((day) => day.date)).toEqual([
      '2026-03-10',
      '2026-03-11',
      '2026-03-12',
      '2026-03-13',
      '2026-03-14',
      '2026-03-15',
      '2026-03-16',
    ])
    expect(forecast.days.map((day) => day.offset)).toEqual([0, 1, 2, 3, 4, 5, 6])
    expect(forecast.days.map((day) => day.due)).toEqual([2, 1, 1, 0, 0, 0, 1])
    expect(forecast.overdue).toBe(1)
    expect(forecast.scheduled).toBe(5)
    expect(forecast.total).toBe(6)
  })

  it('respeta una ventana de días personalizada', () => {
    const forecast = forecastLoad(
      [
        card('2026-03-10T08:00:00.000Z'),
        card('2026-03-11T08:00:00.000Z'),
        card('2026-03-12T08:00:00.000Z'),
        card('2026-03-13T08:00:00.000Z'),
        card('2026-03-09T08:00:00.000Z'),
      ],
      { now: NOW, days: 3 },
    )

    expect(forecast.days.map((day) => day.due)).toEqual([1, 1, 1])
    expect(forecast.overdue).toBe(1)
    expect(forecast.scheduled).toBe(3)
    expect(forecast.total).toBe(4)
  })

  it('considera vencida solo lo anterior al inicio del día actual', () => {
    const forecast = forecastLoad(
      [
        card('2026-03-09T23:59:59.999Z'),
        card('2026-03-10T00:00:00.000Z'),
      ],
      { now: NOW },
    )

    expect(forecast.overdue).toBe(1)
    expect(forecast.days[0].due).toBe(1)
  })

  it('ignora las tarjetas nuevas y las que caen fuera de la ventana', () => {
    const forecast = forecastLoad(
      [
        card('2026-03-10T08:00:00.000Z', 'new'),
        card('2026-03-20T08:00:00.000Z'),
      ],
      { now: NOW },
    )

    expect(forecast.scheduled).toBe(0)
    expect(forecast.overdue).toBe(0)
    expect(forecast.total).toBe(0)
  })

  it('devuelve una previsión vacía sin tarjetas', () => {
    const forecast = forecastLoad([], { now: NOW })

    expect(forecast.days).toHaveLength(FORECAST_DAYS)
    expect(forecast.days.every((day) => day.due === 0)).toBe(true)
    expect(forecast).toMatchObject({ overdue: 0, scheduled: 0, total: 0 })
  })

  it('normaliza el tope diario al rango permitido', () => {
    expect(normalizeDailyCap(undefined)).toBe(DEFAULT_DAILY_CAP)
    expect(normalizeDailyCap('10')).toBe(DEFAULT_DAILY_CAP)
    expect(normalizeDailyCap(Number.NaN)).toBe(DEFAULT_DAILY_CAP)
    expect(normalizeDailyCap(Number.POSITIVE_INFINITY)).toBe(DEFAULT_DAILY_CAP)
    expect(normalizeDailyCap(5.6)).toBe(6)
    expect(normalizeDailyCap(-3)).toBe(DAILY_CAP_MIN)
    expect(normalizeDailyCap(DAILY_CAP_MAX + 50)).toBe(DAILY_CAP_MAX)
    expect(normalizeDailyCap(0)).toBe(0)
  })
})
