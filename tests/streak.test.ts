import { describe, expect, it } from 'vitest'
import { createProgressDatabase } from '../src/state/db'
import { createProgressRepositories } from '../src/state/repositories'
import {
  isLastPracticeDay,
  isoWeekStart,
  recordPracticeDay,
  streakFromPracticeDates,
} from '../src/state/streak'
import { StreakSchema, type Streak } from '../src/schemas'

let databaseCounter = 0

function uniqueDatabaseName(): string {
  databaseCounter += 1
  return `pdc.test.streak.${databaseCounter}`
}

function freshStreak(): Streak {
  return StreakSchema.parse({})
}

describe('F2-053 — Racha con gracia semanal', () => {
  it('empieza la racha con la primera práctica', () => {
    expect(recordPracticeDay(freshStreak(), '2026-03-09')).toEqual({
      current: 1,
      longest: 1,
      lastPracticeDate: '2026-03-09',
      graceDaysUsedThisWeek: 0,
    })
  })

  it('no cambia la racha al registrar dos veces el mismo día', () => {
    const first = recordPracticeDay(freshStreak(), '2026-03-09')
    expect(recordPracticeDay(first, '2026-03-09')).toEqual(first)
    expect(isLastPracticeDay(first, '2026-03-09')).toBe(true)
    expect(isLastPracticeDay(first, '2026-03-10')).toBe(false)
  })

  it('suma los días consecutivos sin usar gracia', () => {
    let streak = freshStreak()
    for (const date of ['2026-03-09', '2026-03-10', '2026-03-11']) {
      streak = recordPracticeDay(streak, date)
      expect(streak.graceDaysUsedThisWeek).toBe(0)
    }

    expect(streak).toMatchObject({
      current: 3,
      longest: 3,
      lastPracticeDate: '2026-03-11',
    })
  })

  it('mantiene la racha al fallar un día de la misma semana', () => {
    const monday = recordPracticeDay(freshStreak(), '2026-03-09')
    const wednesday = recordPracticeDay(monday, '2026-03-11')

    expect(wednesday).toMatchObject({
      current: 2,
      longest: 2,
      lastPracticeDate: '2026-03-11',
      graceDaysUsedThisWeek: 1,
    })
  })

  it('reinicia al fallar un segundo día de la misma semana', () => {
    let streak = recordPracticeDay(freshStreak(), '2026-03-09')
    streak = recordPracticeDay(streak, '2026-03-11')
    expect(streak.graceDaysUsedThisWeek).toBe(1)

    const friday = recordPracticeDay(streak, '2026-03-13')

    expect(friday).toEqual({
      current: 1,
      longest: 2,
      lastPracticeDate: '2026-03-13',
      graceDaysUsedThisWeek: 0,
    })
  })

  it('reinicia tras dos días seguidos sin practicar', () => {
    const monday = recordPracticeDay(freshStreak(), '2026-03-09')
    const thursday = recordPracticeDay(monday, '2026-03-12')

    expect(thursday).toEqual({
      current: 1,
      longest: 1,
      lastPracticeDate: '2026-03-12',
      graceDaysUsedThisWeek: 0,
    })
  })

  it('recupera la gracia al cambiar de semana', () => {
    let streak = freshStreak()
    for (const date of [
      '2026-03-09',
      '2026-03-11',
      '2026-03-12',
      '2026-03-13',
      '2026-03-14',
      '2026-03-15',
      '2026-03-16',
    ]) {
      streak = recordPracticeDay(streak, date)
    }

    expect(streak).toMatchObject({
      current: 7,
      lastPracticeDate: '2026-03-16',
      graceDaysUsedThisWeek: 0,
    })

    const wednesday = recordPracticeDay(streak, '2026-03-18')
    expect(wednesday).toMatchObject({
      current: 8,
      lastPracticeDate: '2026-03-18',
      graceDaysUsedThisWeek: 1,
    })
  })

  it('no consume la gracia de la semana nueva al fallar el domingo anterior', () => {
    const saturday = recordPracticeDay(freshStreak(), '2026-03-14')
    const monday = recordPracticeDay(saturday, '2026-03-16')

    expect(monday).toMatchObject({
      current: 2,
      longest: 2,
      graceDaysUsedThisWeek: 0,
    })

    const wednesday = recordPracticeDay(monday, '2026-03-18')
    expect(wednesday).toMatchObject({
      current: 3,
      graceDaysUsedThisWeek: 1,
    })
  })

  it('ignora las fechas anteriores a la última práctica', () => {
    const monday = recordPracticeDay(freshStreak(), '2026-03-09')
    expect(recordPracticeDay(monday, '2026-03-08')).toEqual(monday)
  })

  it('conserva la racha más larga al reiniciar', () => {
    let streak = recordPracticeDay(freshStreak(), '2026-03-09')
    streak = recordPracticeDay(streak, '2026-03-11')
    streak = recordPracticeDay(streak, '2026-03-13')
    expect(streak).toMatchObject({ current: 1, longest: 2 })

    streak = recordPracticeDay(streak, '2026-03-14')
    streak = recordPracticeDay(streak, '2026-03-15')
    expect(streak).toMatchObject({ current: 3, longest: 3 })
  })

  it('reconstruye la racha desde fechas desordenadas o repetidas', () => {
    const dates = [
      '2026-03-11',
      '2026-03-09',
      '2026-03-10',
      '2026-03-09',
      '2026-03-13',
    ]

    const rebuilt = streakFromPracticeDates(dates)
    expect(rebuilt).toMatchObject({
      current: 4,
      longest: 4,
      lastPracticeDate: '2026-03-13',
      graceDaysUsedThisWeek: 1,
    })
    expect(rebuilt).toEqual(
      dates
        .slice()
        .sort()
        .reduce((streak, date) => recordPracticeDay(streak, date), freshStreak()),
    )
  })

  it('calcula el lunes de la semana ISO', () => {
    expect(isoWeekStart('2026-03-09')).toBe('2026-03-09')
    expect(isoWeekStart('2026-03-15')).toBe('2026-03-09')
    expect(isoWeekStart('2026-03-16')).toBe('2026-03-16')
  })

  it('rechaza fechas inválidas', () => {
    expect(() => recordPracticeDay(freshStreak(), '2026-02-30')).toThrow(RangeError)
    expect(() => recordPracticeDay(freshStreak(), '09/03/2026')).toThrow(RangeError)
  })

  it('persiste la racha en el perfil y la conserva al reabrir', async () => {
    const name = uniqueDatabaseName()
    const db = createProgressDatabase({ name })
    const repositories = createProgressRepositories(db)

    await repositories.profile.recordPractice('2026-03-09')
    await repositories.profile.recordPractice('2026-03-11')
    const profile = await repositories.profile.get()
    expect(profile.streak).toMatchObject({
      current: 2,
      longest: 2,
      lastPracticeDate: '2026-03-11',
      graceDaysUsedThisWeek: 1,
    })
    repositories.close()

    const reopened = createProgressDatabase({ name })
    const reopenedRepositories = createProgressRepositories(reopened)
    expect((await reopenedRepositories.profile.get()).streak).toEqual(profile.streak)
    reopenedRepositories.close()
  })
})
