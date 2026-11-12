import type { FsrsCard } from '../schemas'

/**
 * Previsión de carga de repaso.
 *
 * Cuenta cuántas tarjetas vencen en cada uno de los próximos días para que la
 * persona pueda ver el trabajo acumulado antes de empezar. Los cálculos usan
 * días UTC, igual que las fechas ISO de las tarjetas, y el reloj se recibe como
 * `Date` para que sean deterministas en tests.
 */

const MS_PER_DAY = 86_400_000

/** Días que muestra la previsión por defecto. */
export const FORECAST_DAYS = 7

/** Tope diario de ítems nuevos: mínimo, máximo y valor por defecto. */
export const DAILY_CAP_MIN = 0
export const DAILY_CAP_MAX = 200
export const DEFAULT_DAILY_CAP = 20

export interface LoadForecastOptions {
  /** Fecha y hora actual; no se usa el reloj del sistema. */
  now: Date
  /** Cantidad de días a proyectar (por defecto 7). */
  days?: number
}

export interface LoadForecastDay {
  /** Día en formato ISO `YYYY-MM-DD` (UTC). */
  date: string
  /** Desplazamiento desde hoy: 0 es hoy. */
  offset: number
  /** Tarjetas que vencen ese día. */
  due: number
}

export interface LoadForecast {
  /** Un elemento por día proyectado, empezando por hoy. */
  days: LoadForecastDay[]
  /** Tarjetas que ya estaban vencidas antes de hoy. */
  overdue: number
  /** Suma de vencimientos dentro de la ventana proyectada. */
  scheduled: number
  /** Total a repasar: `scheduled` más las atrasadas. */
  total: number
}

/** Normaliza el tope diario a un entero dentro del rango permitido. */
export function normalizeDailyCap(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_DAILY_CAP
  }
  return Math.min(DAILY_CAP_MAX, Math.max(DAILY_CAP_MIN, Math.round(value)))
}

function startOfUtcDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
}

/** Calcula los vencimientos de los próximos días a partir de las tarjetas. */
export function forecastLoad(
  cards: readonly FsrsCard[],
  options: LoadForecastOptions,
): LoadForecast {
  const dayCount = Math.max(0, Math.floor(options.days ?? FORECAST_DAYS))
  const start = startOfUtcDay(options.now)

  const days: LoadForecastDay[] = Array.from({ length: dayCount }, (_, offset) => ({
    date: new Date(start + offset * MS_PER_DAY).toISOString().slice(0, 10),
    offset,
    due: 0,
  }))

  let overdue = 0
  for (const card of cards) {
    if (card.state === 'new') continue
    const due = Date.parse(card.due)
    if (!Number.isFinite(due)) continue
    if (due < start) {
      overdue += 1
      continue
    }
    const offset = Math.floor((due - start) / MS_PER_DAY)
    if (offset >= 0 && offset < dayCount) {
      days[offset].due += 1
    }
  }

  const scheduled = days.reduce((sum, day) => sum + day.due, 0)

  return {
    days,
    overdue,
    scheduled,
    total: scheduled + overdue,
  }
}
