import type { Achievement, Profile, ReviewRating } from '../schemas'

/**
 * XP, niveles y logros.
 *
 * El módulo es puro y determinista: recibe el perfil actual, calcula la
 * recompensa y devuelve un perfil nuevo. La persistencia (y la garantía de no
 * perder XP) vive en el repositorio de perfil.
 *
 * Curva de niveles: cada nivel cuesta 100 XP más que el anterior; para llegar
 * al nivel `n` hacen falta `100 · (n−1) · n / 2` XP acumulados. Así el nivel 2
 * llega a los 100 XP, el 3 a los 300, el 4 a los 600 y el 5 a los 1000.
 */

export type XpActivity =
  | { kind: 'lesson-completed'; lessonId: string }
  | { kind: 'exercise-correct'; exerciseId: string }
  | { kind: 'practice'; minutes: number }
  | { kind: 'review'; itemId: string; rating: ReviewRating }

/** Recompensas por actividad, en XP. */
export const XP_VALUES = Object.freeze({
  lessonCompleted: 50,
  exerciseCorrect: 10,
  practiceMinute: 2,
  review: Object.freeze({
    again: 2,
    hard: 6,
    good: 10,
    easy: 12,
  }) as Readonly<Record<ReviewRating, number>>,
})

/** XP adicional que cuesta cada nivel respecto al anterior. */
export const XP_LEVEL_STEP = 100

function normalizeXp(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0
}

function normalizeLevel(value: number): number {
  return Number.isFinite(value) ? Math.max(1, Math.floor(value)) : 1
}

/** XP por actividad. Los minutos se redondean hacia abajo y nunca son negativos. */
export function xpForActivity(activity: XpActivity): number {
  switch (activity.kind) {
    case 'lesson-completed':
      return XP_VALUES.lessonCompleted
    case 'exercise-correct':
      return XP_VALUES.exerciseCorrect
    case 'practice':
      return normalizeXp(activity.minutes) * XP_VALUES.practiceMinute
    case 'review':
      return XP_VALUES.review[activity.rating]
  }
}

/** XP acumulados necesarios para alcanzar un nivel (el nivel 1 empieza en 0). */
export function xpForLevel(level: number): number {
  const safe = normalizeLevel(level)
  return (XP_LEVEL_STEP * (safe - 1) * safe) / 2
}

/** Nivel que corresponde a una cantidad de XP acumulados. */
export function levelForXp(xp: number): number {
  const safe = normalizeXp(xp)
  const estimate = Math.floor(
    (1 + Math.sqrt(1 + (8 * safe) / XP_LEVEL_STEP)) / 2,
  )
  let level = Math.max(1, estimate)
  while (xpForLevel(level + 1) <= safe) level += 1
  while (level > 1 && xpForLevel(level) > safe) level -= 1
  return level
}

export interface LevelProgress {
  level: number
  xp: number
  /** XP acumulados al empezar el nivel actual. */
  currentLevelXp: number
  /** XP acumulados necesarios para el siguiente nivel. */
  nextLevelXp: number
  /** XP ganados dentro del nivel actual. */
  xpIntoLevel: number
  /** XP que faltan para subir de nivel. */
  xpToNextLevel: number
  /** Avance dentro del nivel, entre 0 y 1. */
  progress: number
}

/** Desglose del nivel actual y lo que falta para el siguiente. */
export function levelProgress(xp: number): LevelProgress {
  const safe = normalizeXp(xp)
  const level = levelForXp(safe)
  const currentLevelXp = xpForLevel(level)
  const nextLevelXp = xpForLevel(level + 1)
  const span = nextLevelXp - currentLevelXp
  const xpIntoLevel = safe - currentLevelXp
  return {
    level,
    xp: safe,
    currentLevelXp,
    nextLevelXp,
    xpIntoLevel,
    xpToNextLevel: nextLevelXp - safe,
    progress: span === 0 ? 1 : xpIntoLevel / span,
  }
}

/**
 * Suma XP y recalcula el nivel. Las cantidades negativas o no finitas no
 * restan: el XP total nunca disminuye.
 */
export function awardXp(profile: Profile, amount: number): Profile {
  const xp = normalizeXp(profile.xp) + normalizeXp(amount)
  return { ...profile, xp, level: levelForXp(xp) }
}

/** Aplica la recompensa de una actividad sobre el perfil. */
export function applyActivity(profile: Profile, activity: XpActivity): Profile {
  return awardXp(profile, xpForActivity(activity))
}

/** Datos del progreso que evalúan los logros. */
export interface AchievementContext {
  level: number
  lessonsCompleted: number
  reviews: number
  practiceMinutes: number
  streakDays: number
  masteredSkills: number
  longestSessionMinutes: number
}

export const INITIAL_ACHIEVEMENT_CONTEXT: AchievementContext = Object.freeze({
  level: 1,
  lessonsCompleted: 0,
  reviews: 0,
  practiceMinutes: 0,
  streakDays: 0,
  masteredSkills: 0,
  longestSessionMinutes: 0,
})

export interface AchievementDefinition {
  id: string
  titleEs: string
  titleEn: string
  descriptionEs: string
  descriptionEn: string
  isUnlocked: (context: AchievementContext) => boolean
}

/**
 * Los 10 logros de la fase 2. Se evalúan en orden y solo se desbloquean una vez;
 * un logro ya conseguido nunca se pierde aunque el contexto baje.
 */
export const ACHIEVEMENTS: readonly AchievementDefinition[] = Object.freeze([
  {
    id: 'primer-paso',
    titleEs: 'Primer paso',
    titleEn: 'First step',
    descriptionEs: 'Completa tu primera lección.',
    descriptionEn: 'Complete your first lesson.',
    isUnlocked: (context) => context.lessonsCompleted >= 1,
  },
  {
    id: 'aprendiz',
    titleEs: 'Aprendiz',
    titleEn: 'Apprentice',
    descriptionEs: 'Alcanza el nivel 2.',
    descriptionEn: 'Reach level 2.',
    isUnlocked: (context) => context.level >= 2,
  },
  {
    id: 'racha-tres',
    titleEs: 'Tres días seguidos',
    titleEn: 'Three days in a row',
    descriptionEs: 'Practica tres días consecutivos.',
    descriptionEn: 'Practice three days in a row.',
    isUnlocked: (context) => context.streakDays >= 3,
  },
  {
    id: 'racha-semana',
    titleEs: 'Semana completa',
    titleEn: 'Full week',
    descriptionEs: 'Practica siete días consecutivos.',
    descriptionEn: 'Practice seven days in a row.',
    isUnlocked: (context) => context.streakDays >= 7,
  },
  {
    id: 'diez-lecciones',
    titleEs: 'Diez lecciones',
    titleEn: 'Ten lessons',
    descriptionEs: 'Completa diez lecciones.',
    descriptionEn: 'Complete ten lessons.',
    isUnlocked: (context) => context.lessonsCompleted >= 10,
  },
  {
    id: 'cien-repasos',
    titleEs: 'Cien repasos',
    titleEn: 'One hundred reviews',
    descriptionEs: 'Acumula cien repasos.',
    descriptionEn: 'Accumulate one hundred reviews.',
    isUnlocked: (context) => context.reviews >= 100,
  },
  {
    id: 'primera-hora',
    titleEs: 'Primera hora',
    titleEn: 'First hour',
    descriptionEs: 'Acumula sesenta minutos de práctica.',
    descriptionEn: 'Accumulate sixty minutes of practice.',
    isUnlocked: (context) => context.practiceMinutes >= 60,
  },
  {
    id: 'habilidad-dominada',
    titleEs: 'Habilidad dominada',
    titleEn: 'Skill mastered',
    descriptionEs: 'Domina una habilidad.',
    descriptionEn: 'Master one skill.',
    isUnlocked: (context) => context.masteredSkills >= 1,
  },
  {
    id: 'cinco-habilidades',
    titleEs: 'Cinco habilidades',
    titleEn: 'Five skills',
    descriptionEs: 'Domina cinco habilidades.',
    descriptionEn: 'Master five skills.',
    isUnlocked: (context) => context.masteredSkills >= 5,
  },
  {
    id: 'sesion-larga',
    titleEs: 'Sesión completa',
    titleEn: 'Full session',
    descriptionEs: 'Completa una sesión de práctica de 45 minutos.',
    descriptionEn: 'Complete a 45-minute practice session.',
    isUnlocked: (context) => context.longestSessionMinutes >= 45,
  },
])

/** Busca la definición de un logro por id. */
export function findAchievement(
  id: string,
): AchievementDefinition | undefined {
  return ACHIEVEMENTS.find((achievement) => achievement.id === id)
}

/**
 * Devuelve los logros ya conseguidos más los que cumple el contexto. Conserva
 * las fechas originales y nunca elimina logros.
 */
export function evaluateAchievements(
  existing: readonly Achievement[],
  context: AchievementContext,
  now: Date = new Date(),
): Achievement[] {
  const unlockedAt = now.toISOString()
  const achievements = existing.map((achievement) => ({ ...achievement }))
  const known = new Set(achievements.map((achievement) => achievement.id))

  for (const definition of ACHIEVEMENTS) {
    if (known.has(definition.id) || !definition.isUnlocked(context)) continue
    achievements.push({ id: definition.id, unlockedAt })
    known.add(definition.id)
  }

  return achievements
}

/** Une dos listas de logros conservando el desbloqueo más antiguo de cada id. */
export function mergeAchievements(
  current: readonly Achievement[],
  incoming: readonly Achievement[],
): Achievement[] {
  const merged = current.map((achievement) => ({ ...achievement }))
  const known = new Set(merged.map((achievement) => achievement.id))

  for (const achievement of incoming) {
    if (known.has(achievement.id)) continue
    merged.push({ ...achievement })
    known.add(achievement.id)
  }

  return merged
}
