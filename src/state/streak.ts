import { StreakSchema, type Streak } from '../schemas'

/**
 * Racha de práctica con un día de gracia por semana.
 *
 * Las fechas son días ISO (`YYYY-MM-DD`) y las cuentas se hacen en UTC para que
 * el resultado no dependa de la zona horaria ni del horario de verano.
 *
 * Reglas:
 * - Practicar el mismo día dos veces no altera la racha.
 * - Un día sin practicar no rompe la racha si todavía no se usó la gracia de esa
 *   semana ISO (lunes a domingo).
 * - Dos días seguidos sin practicar siempre reinician la racha.
 * - Un segundo día fallado en la misma semana también reinicia la racha.
 * - Al reiniciar, la racha vuelve a 1 con la práctica del día y se conserva la
 *   racha más larga.
 * - Una fecha anterior a la última práctica se ignora: la racha no retrocede.
 */

const MS_PER_DAY = 86_400_000
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function dayToMs(date: string): number {
  if (!DATE_PATTERN.test(date)) {
    throw new RangeError(`Fecha inválida: ${date}; se espera YYYY-MM-DD`)
  }
  const year = Number(date.slice(0, 4))
  const month = Number(date.slice(5, 7))
  const day = Number(date.slice(8, 10))
  const ms = Date.UTC(year, month - 1, day)
  if (new Date(ms).toISOString().slice(0, 10) !== date) {
    throw new RangeError(`Fecha inválida: ${date}; se espera un día real`)
  }
  return ms
}

function msToDay(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10)
}

function addDays(date: string, days: number): string {
  return msToDay(dayToMs(date) + days * MS_PER_DAY)
}

/** Lunes de la semana ISO que contiene la fecha. */
export function isoWeekStart(date: string): string {
  const ms = dayToMs(date)
  const weekday = new Date(ms).getUTCDay()
  const offset = (weekday + 6) % 7
  return msToDay(ms - offset * MS_PER_DAY)
}

function normalizedStreak(streak: Streak): Streak {
  return StreakSchema.parse(streak)
}

/**
 * Registra una práctica y devuelve la racha actualizada.
 *
 * Es idempotente para el mismo día y no retrocede con fechas anteriores.
 */
export function recordPracticeDay(streak: Streak, date: string): Streak {
  const current = normalizedStreak(streak)
  const todayMs = dayToMs(date)
  const baseStreak = Math.max(1, current.current)

  if (current.lastPracticeDate === undefined) {
    return normalizedStreak({
      ...current,
      current: baseStreak,
      longest: Math.max(current.longest, baseStreak),
      lastPracticeDate: date,
      graceDaysUsedThisWeek: 0,
    })
  }

  const lastMs = dayToMs(current.lastPracticeDate)
  if (todayMs === lastMs) {
    return current
  }
  if (todayMs < lastMs) {
    return current
  }

  const missedDays = Math.round((todayMs - lastMs) / MS_PER_DAY) - 1
  const lastWeek = isoWeekStart(current.lastPracticeDate)
  const todayWeek = isoWeekStart(date)

  if (missedDays >= 2) {
    return normalizedStreak({
      ...current,
      current: 1,
      longest: Math.max(current.longest, 1),
      lastPracticeDate: date,
      graceDaysUsedThisWeek: 0,
    })
  }

  if (missedDays === 1) {
    const missedWeek = isoWeekStart(addDays(current.lastPracticeDate, 1))
    const graceUsed =
      missedWeek === lastWeek ? current.graceDaysUsedThisWeek : 0

    if (graceUsed < 1) {
      const nextStreak = baseStreak + 1
      return normalizedStreak({
        ...current,
        current: nextStreak,
        longest: Math.max(current.longest, nextStreak),
        lastPracticeDate: date,
        graceDaysUsedThisWeek:
          missedWeek === todayWeek ? graceUsed + 1 : 0,
      })
    }

    return normalizedStreak({
      ...current,
      current: 1,
      longest: Math.max(current.longest, 1),
      lastPracticeDate: date,
      graceDaysUsedThisWeek: 0,
    })
  }

  const nextStreak = baseStreak + 1
  return normalizedStreak({
    ...current,
    current: nextStreak,
    longest: Math.max(current.longest, nextStreak),
    lastPracticeDate: date,
    graceDaysUsedThisWeek:
      lastWeek === todayWeek ? current.graceDaysUsedThisWeek : 0,
  })
}

/** Reconstruye la racha a partir de una lista de días con práctica. */
export function streakFromPracticeDates(dates: Iterable<string>): Streak {
  const ordered = [...new Set(dates)].sort()
  return ordered.reduce(
    (streak, date) => recordPracticeDay(streak, date),
    StreakSchema.parse({}),
  )
}

/** Indica si la fecha ya está registrada como último día de práctica. */
export function isLastPracticeDay(streak: Streak, date: string): boolean {
  return normalizedStreak(streak).lastPracticeDate === date
}
