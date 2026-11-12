import { describe, expect, it } from 'vitest'
import type {
  LessonProgressRecord,
  PracticeSession,
  Profile,
  ReviewLog,
  SkillKind,
} from '../src/schemas'
import {
  ProfileSchema,
  ReviewLogSchema,
} from '../src/schemas'
import {
  buildProgressDashboard,
  practiceSessionSeconds,
} from '../src/state/progress-dashboard'

function log(overrides: Partial<ReviewLog> = {}): ReviewLog {
  return ReviewLogSchema.parse({
    id: 'skill.note.log.1',
    itemId: 'skill.note',
    reviewedAt: '2026-03-10T10:00:00.000Z',
    rating: 'good',
    elapsedDays: 1,
    scheduledDays: 1,
    stability: 2,
    difficulty: 5,
    state: 'review',
    ...overrides,
  })
}

function session(overrides: Partial<PracticeSession> = {}): PracticeSession {
  return {
    id: 'session.1',
    startedAt: '2026-03-10T10:00:00.000Z',
    endedAt: '2026-03-10T10:10:00.000Z',
    plannedMinutes: 15,
    blocks: [],
    ...overrides,
  }
}

function lesson(
  id: string,
  secondsSpent: number,
): LessonProgressRecord {
  return { id, status: 'in-progress', secondsSpent }
}

function profile(overrides: Partial<Profile> = {}): Profile {
  return ProfileSchema.parse(overrides)
}

const EMPTY_INPUT = {
  reviews: [],
  profile: profile(),
  sessions: [],
  lessons: [],
}

describe('F2-062 — Panel de progreso', () => {
  it('devuelve métricas vacías y honestas sin datos', () => {
    const dashboard = buildProgressDashboard(EMPTY_INPUT)

    expect(dashboard.stats).toEqual({
      period: 'day',
      retention: [],
      accuracy: [],
      totals: { reviewed: 0, correct: 0, retention: 0 },
    })
    expect(dashboard.level.level).toBe(1)
    expect(dashboard.level.xp).toBe(0)
    expect(dashboard.streak).toEqual({
      current: 0,
      longest: 0,
      graceDaysUsedThisWeek: 0,
    })
    expect(dashboard.scheduledReviewed).toBe(0)
    expect(dashboard.scheduledRecalled).toBe(0)
    expect(dashboard.retention).toBe(0)
    expect(dashboard.totalReviews).toBe(0)
    expect(dashboard.sessionCount).toBe(0)
    expect(dashboard.practiceSeconds).toBe(0)
    expect(dashboard.lessonSeconds).toBe(0)
    expect(dashboard.totalSeconds).toBe(0)
  })

  it('suma la retención solo de repasos programados', () => {
    const dashboard = buildProgressDashboard({
      ...EMPTY_INPUT,
      reviews: [
        log({ id: 'skill.a.log.1', reviewedAt: '2026-03-10T10:00:00.000Z' }),
        log({
          id: 'skill.a.log.2',
          reviewedAt: '2026-03-10T11:00:00.000Z',
          rating: 'again',
        }),
        log({
          id: 'skill.a.log.3',
          reviewedAt: '2026-03-11T10:00:00.000Z',
          state: 'relearning',
          rating: 'hard',
        }),
        // Los pasos de aprendizaje no cuentan para la retención.
        log({
          id: 'skill.a.log.4',
          reviewedAt: '2026-03-11T11:00:00.000Z',
          state: 'learning',
        }),
      ],
    })

    expect(dashboard.scheduledReviewed).toBe(3)
    expect(dashboard.scheduledRecalled).toBe(2)
    expect(dashboard.retention).toBeCloseTo(2 / 3, 10)
    expect(dashboard.totalReviews).toBe(4)
  })

  it('usa la resolución de tipos para la precisión', () => {
    const kinds: Record<string, SkillKind> = {
      'skill.note': 'note-id',
      'skill.scale': 'scale',
    }
    const dashboard = buildProgressDashboard({
      ...EMPTY_INPUT,
      reviews: [
        log({ id: 'skill.note.log.1', itemId: 'skill.note', rating: 'good' }),
        log({
          id: 'skill.note.log.2',
          itemId: 'skill.note',
          rating: 'again',
        }),
        log({ id: 'skill.scale.log.1', itemId: 'skill.scale', rating: 'easy' }),
      ],
      kindForItem: (itemId) => kinds[itemId],
    })

    expect(dashboard.stats.accuracy).toEqual([
      { kind: 'note-id', reviewed: 2, correct: 1, accuracy: 0.5 },
      { kind: 'scale', reviewed: 1, correct: 1, accuracy: 1 },
    ])
  })

  it('deriva nivel, XP y racha del perfil', () => {
    const dashboard = buildProgressDashboard({
      ...EMPTY_INPUT,
      profile: profile({
        xp: 250,
        level: 2,
        streak: {
          current: 4,
          longest: 9,
          lastPracticeDate: '2026-03-10',
          graceDaysUsedThisWeek: 1,
        },
      }),
    })

    expect(dashboard.level.level).toBe(2)
    expect(dashboard.level.xp).toBe(250)
    expect(dashboard.streak).toEqual({
      current: 4,
      longest: 9,
      lastPracticeDate: '2026-03-10',
      graceDaysUsedThisWeek: 1,
    })
  })

  it('suma tiempo de lecciones y sesiones de práctica', () => {
    const dashboard = buildProgressDashboard({
      ...EMPTY_INPUT,
      lessons: [lesson('lesson.a', 120), lesson('lesson.b', 180)],
      sessions: [
        session({
          id: 'session.1',
          blocks: [
            { kind: 'theory', seconds: 60 },
            { kind: 'review', seconds: 90 },
          ],
        }),
        session({
          id: 'session.2',
          blocks: [],
          startedAt: '2026-03-11T10:00:00.000Z',
          endedAt: '2026-03-11T10:00:30.000Z',
        }),
      ],
    })

    expect(dashboard.lessonSeconds).toBe(300)
    expect(dashboard.practiceSeconds).toBe(180)
    expect(dashboard.totalSeconds).toBe(480)
    expect(dashboard.sessionCount).toBe(2)
  })

  describe('practiceSessionSeconds', () => {
    it('prioriza la suma de bloques', () => {
      expect(
        practiceSessionSeconds(
          session({
            blocks: [
              { kind: 'warmup', seconds: 30 },
              { kind: 'technique', seconds: 45 },
            ],
            startedAt: '2026-03-10T10:00:00.000Z',
            endedAt: '2026-03-10T11:00:00.000Z',
          }),
        ),
      ).toBe(75)
    })

    it('cae al intervalo cuando no hay bloques', () => {
      expect(
        practiceSessionSeconds(
          session({
            startedAt: '2026-03-10T10:00:00.000Z',
            endedAt: '2026-03-10T10:12:30.000Z',
          }),
        ),
      ).toBe(750)
    })

    it('cuenta 0 con un intervalo inválido', () => {
      expect(
        practiceSessionSeconds(
          session({
            startedAt: '2026-03-10T10:00:00.000Z',
            endedAt: '2026-03-10T09:00:00.000Z',
          }),
        ),
      ).toBe(0)
      expect(
        practiceSessionSeconds(
          session({
            startedAt: 'no-es-fecha',
            endedAt: 'tampoco',
          }),
        ),
      ).toBe(0)
    })
  })
})
