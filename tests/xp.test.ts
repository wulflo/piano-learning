import { describe, expect, it } from 'vitest'
import { createProgressDatabase } from '../src/state/db'
import { createProgressRepositories } from '../src/state/repositories'
import {
  ACHIEVEMENTS,
  INITIAL_ACHIEVEMENT_CONTEXT,
  applyActivity,
  awardXp,
  evaluateAchievements,
  findAchievement,
  levelForXp,
  levelProgress,
  mergeAchievements,
  xpForActivity,
  xpForLevel,
  type AchievementContext,
} from '../src/state/xp'
import { ProfileSchema } from '../src/schemas'

let databaseCounter = 0

function uniqueDatabaseName(): string {
  databaseCounter += 1
  return `pdc.test.xp.${databaseCounter}`
}

const NOW = new Date('2026-03-10T12:00:00.000Z')

const FULL_CONTEXT: AchievementContext = {
  level: 2,
  lessonsCompleted: 10,
  reviews: 100,
  practiceMinutes: 60,
  streakDays: 7,
  masteredSkills: 5,
  longestSessionMinutes: 45,
}

function freshProfile() {
  return ProfileSchema.parse({})
}

describe('F2-052 — XP, niveles y logros', () => {
  it('asigna XP por actividad', () => {
    expect(
      xpForActivity({ kind: 'lesson-completed', lessonId: 'lesson.m0-01' }),
    ).toBe(50)
    expect(
      xpForActivity({ kind: 'exercise-correct', exerciseId: 'exercise.m0-01' }),
    ).toBe(10)
    expect(xpForActivity({ kind: 'practice', minutes: 12.9 })).toBe(24)
    expect(xpForActivity({ kind: 'practice', minutes: -5 })).toBe(0)
    expect(xpForActivity({ kind: 'review', itemId: 'skill.a', rating: 'again' })).toBe(2)
    expect(xpForActivity({ kind: 'review', itemId: 'skill.a', rating: 'hard' })).toBe(6)
    expect(xpForActivity({ kind: 'review', itemId: 'skill.a', rating: 'good' })).toBe(10)
    expect(xpForActivity({ kind: 'review', itemId: 'skill.a', rating: 'easy' })).toBe(12)
  })

  it('sigue una curva de niveles con incrementos de 100 XP', () => {
    expect(xpForLevel(1)).toBe(0)
    expect(xpForLevel(2)).toBe(100)
    expect(xpForLevel(3)).toBe(300)
    expect(xpForLevel(4)).toBe(600)
    expect(xpForLevel(5)).toBe(1000)

    expect(levelForXp(0)).toBe(1)
    expect(levelForXp(99)).toBe(1)
    expect(levelForXp(100)).toBe(2)
    expect(levelForXp(299)).toBe(2)
    expect(levelForXp(300)).toBe(3)
    expect(levelForXp(600)).toBe(4)
    expect(levelForXp(1000)).toBe(5)
    expect(levelForXp(-50)).toBe(1)
    expect(levelForXp(Number.NaN)).toBe(1)
  })

  it('calcula el avance dentro del nivel', () => {
    expect(levelProgress(150)).toEqual({
      level: 2,
      xp: 150,
      currentLevelXp: 100,
      nextLevelXp: 300,
      xpIntoLevel: 50,
      xpToNextLevel: 150,
      progress: 0.25,
    })
    expect(levelProgress(0)).toMatchObject({
      level: 1,
      currentLevelXp: 0,
      nextLevelXp: 100,
      progress: 0,
    })
  })

  it('nunca resta XP con cantidades negativas o inválidas', () => {
    const profile = freshProfile()
    expect(awardXp(profile, -50).xp).toBe(0)
    expect(awardXp(profile, Number.NaN).xp).toBe(0)
    expect(awardXp(profile, 99)).toMatchObject({ xp: 99, level: 1 })
    expect(awardXp(awardXp(profile, 99), 1)).toMatchObject({ xp: 100, level: 2 })

    const afterLesson = applyActivity(profile, {
      kind: 'lesson-completed',
      lessonId: 'lesson.m0-01',
    })
    expect(afterLesson).toMatchObject({ xp: 50, level: 1 })
    expect(applyActivity(afterLesson, { kind: 'review', itemId: 'skill.a', rating: 'easy' }))
      .toMatchObject({ xp: 62, level: 1 })
  })

  it('define exactamente 10 logros con ids únicos y textos', () => {
    expect(ACHIEVEMENTS).toHaveLength(10)
    const ids = ACHIEVEMENTS.map((achievement) => achievement.id)
    expect(new Set(ids).size).toBe(10)
    for (const achievement of ACHIEVEMENTS) {
      expect(achievement.id).toMatch(/^[a-z0-9][a-z0-9._-]*$/)
      expect(findAchievement(achievement.id)).toBe(achievement)
      expect(achievement.titleEs.length).toBeGreaterThan(0)
      expect(achievement.titleEn.length).toBeGreaterThan(0)
      expect(achievement.descriptionEs.length).toBeGreaterThan(0)
      expect(achievement.descriptionEn.length).toBeGreaterThan(0)
    }
  })

  it('desbloquea cada logro al cumplir su condición', () => {
    expect(evaluateAchievements([], INITIAL_ACHIEVEMENT_CONTEXT, NOW)).toEqual([])

    const cases: Array<[string, Partial<AchievementContext>]> = [
      ['primer-paso', { lessonsCompleted: 1 }],
      ['aprendiz', { level: 2 }],
      ['racha-tres', { streakDays: 3 }],
      ['racha-semana', { streakDays: 7 }],
      ['diez-lecciones', { lessonsCompleted: 10 }],
      ['cien-repasos', { reviews: 100 }],
      ['primera-hora', { practiceMinutes: 60 }],
      ['habilidad-dominada', { masteredSkills: 1 }],
      ['cinco-habilidades', { masteredSkills: 5 }],
      ['sesion-larga', { longestSessionMinutes: 45 }],
    ]

    for (const [id, patch] of cases) {
      const unlocked = evaluateAchievements(
        [],
        { ...INITIAL_ACHIEVEMENT_CONTEXT, ...patch },
        NOW,
      )
      expect(unlocked.map((achievement) => achievement.id)).toContain(id)
      expect(unlocked.every((achievement) => achievement.unlockedAt === NOW.toISOString()))
        .toBe(true)
    }
  })

  it('desbloquea los 10 logros con un contexto completo', () => {
    const unlocked = evaluateAchievements([], FULL_CONTEXT, NOW)

    expect(unlocked.map((achievement) => achievement.id)).toEqual(
      ACHIEVEMENTS.map((achievement) => achievement.id),
    )
    expect(new Set(unlocked.map((achievement) => achievement.unlockedAt))).toEqual(
      new Set([NOW.toISOString()]),
    )
  })

  it('conserva los logros ya conseguidos aunque el contexto baje', () => {
    const first = evaluateAchievements([], FULL_CONTEXT, NOW)
    const later = new Date('2027-01-01T00:00:00.000Z')
    const second = evaluateAchievements(first, INITIAL_ACHIEVEMENT_CONTEXT, later)

    expect(second).toEqual(first)
    expect(second[0].unlockedAt).toBe(NOW.toISOString())
  })

  it('une logros sin duplicar y conserva la fecha más antigua', () => {
    const later = new Date('2026-04-01T00:00:00.000Z')
    const merged = mergeAchievements(
      [{ id: 'primer-paso', unlockedAt: NOW.toISOString() }],
      [
        { id: 'primer-paso', unlockedAt: later.toISOString() },
        { id: 'aprendiz', unlockedAt: later.toISOString() },
      ],
    )

    expect(merged).toEqual([
      { id: 'primer-paso', unlockedAt: NOW.toISOString() },
      { id: 'aprendiz', unlockedAt: later.toISOString() },
    ])
  })

  it('persiste XP y nivel sin perder incrementos concurrentes', async () => {
    const name = uniqueDatabaseName()
    const db = createProgressDatabase({ name })
    const repositories = createProgressRepositories(db)

    expect(await repositories.profile.get()).toEqual(freshProfile())

    await repositories.profile.update((profile) =>
      applyActivity(profile, { kind: 'lesson-completed', lessonId: 'lesson.m0-01' }),
    )
    expect(await repositories.profile.get()).toMatchObject({ xp: 50, level: 1 })

    await Promise.all(
      Array.from({ length: 10 }, (_, index) =>
        repositories.profile.update((profile) =>
          applyActivity(profile, {
            kind: 'exercise-correct',
            exerciseId: `exercise.${index}`,
          }),
        ),
      ),
    )

    const profile = await repositories.profile.get()
    expect(profile.xp).toBe(150)
    expect(profile.level).toBe(2)
    repositories.close()

    const reopened = createProgressDatabase({ name })
    const reopenedRepositories = createProgressRepositories(reopened)
    expect((await reopenedRepositories.profile.get()).xp).toBe(150)
    expect((await reopenedRepositories.profile.get()).level).toBe(2)
    reopenedRepositories.close()
  })

  it('no permite que una actualización reduzca el XP ni borre logros', async () => {
    const db = createProgressDatabase({ name: uniqueDatabaseName() })
    const repositories = createProgressRepositories(db)

    const withAchievements = await repositories.profile.update((profile) => {
      const achievements = evaluateAchievements(
        profile.achievements,
        { ...INITIAL_ACHIEVEMENT_CONTEXT, level: 2, lessonsCompleted: 1 },
        NOW,
      )
      return { ...profile, xp: 500, level: 1, achievements }
    })
    expect(withAchievements.xp).toBe(500)
    expect(withAchievements.level).toBe(3)
    expect(withAchievements.achievements.map((achievement) => achievement.id)).toEqual([
      'primer-paso',
      'aprendiz',
    ])

    const afterResetAttempt = await repositories.profile.update((profile) => ({
      ...profile,
      xp: 0,
      level: 1,
      achievements: [],
    }))

    expect(afterResetAttempt.xp).toBe(500)
    expect(afterResetAttempt.level).toBe(3)
    expect(afterResetAttempt.achievements).toEqual(withAchievements.achievements)

    await expect(
      repositories.profile.update((profile) => ({ ...profile, xp: -1 })),
    ).rejects.toThrow()
    expect((await repositories.profile.get()).xp).toBe(500)
    repositories.close()
  })

  it('normaliza el nivel al guardar y permite reiniciar el perfil', async () => {
    const db = createProgressDatabase({ name: uniqueDatabaseName() })
    const repositories = createProgressRepositories(db)

    const saved = await repositories.profile.save({
      ...freshProfile(),
      xp: 300,
      level: 1,
    })
    expect(saved.level).toBe(3)
    expect(await repositories.profile.get()).toMatchObject({ xp: 300, level: 3 })

    await repositories.profile.clear()
    expect(await repositories.profile.get()).toEqual(freshProfile())
    repositories.close()
  })
})
