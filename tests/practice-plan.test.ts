import { describe, expect, it } from 'vitest'
import {
  PRACTICE_BLOCK_KINDS,
  PRACTICE_DURATIONS,
  buildPracticePlan,
  createPracticeSessionId,
  isPracticeMinutes,
  totalPlanMinutes,
  type PracticeMinutes,
} from '../src/state/practice-plan'

describe('F2-068 — Plan de práctica diario', () => {
  it('reparte 15, 30 y 45 minutos entre los cinco bloques', () => {
    for (const minutes of PRACTICE_DURATIONS) {
      const plan = buildPracticePlan(minutes)
      expect(plan.map((block) => block.kind)).toEqual([
        ...PRACTICE_BLOCK_KINDS,
      ])
      expect(totalPlanMinutes(plan)).toBe(minutes)
      expect(plan.every((block) => block.minutes > 0)).toBe(true)
    }
  })

  it('usa repartos distintos según la duración', () => {
    const short = buildPracticePlan(15)
    const long = buildPracticePlan(45)

    expect(short.find((block) => block.kind === 'technique')?.minutes).toBe(4)
    expect(long.find((block) => block.kind === 'technique')?.minutes).toBe(12)
    expect(long.find((block) => block.kind === 'repertoire')?.minutes).toBe(11)
  })

  it('devuelve copias que no alteran el plan guardado', () => {
    const plan = buildPracticePlan(15)
    plan[0].minutes = 99

    expect(buildPracticePlan(15)[0].minutes).toBe(3)
  })

  it('rechaza duraciones no admitidas', () => {
    expect(isPracticeMinutes(15)).toBe(true)
    expect(isPracticeMinutes(30)).toBe(true)
    expect(isPracticeMinutes(45)).toBe(true)
    expect(isPracticeMinutes(20)).toBe(false)
    expect(isPracticeMinutes(Number.NaN)).toBe(false)

    expect(() => buildPracticePlan(20 as PracticeMinutes)).toThrow(RangeError)
  })

  it('genera ids de sesión válidos y distintos', () => {
    const now = new Date('2026-03-10T10:00:00.000Z')
    const first = createPracticeSessionId(now)
    const second = createPracticeSessionId(now)

    expect(first).toMatch(/^session\.[a-z0-9]+\.[a-z0-9]+$/)
    expect(second).toMatch(/^session\.[a-z0-9]+\.[a-z0-9]+$/)
    expect(first).not.toBe(second)
  })
})
