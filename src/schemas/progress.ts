import { z } from 'zod'
import { NotationPreferenceSchema } from './notation'
import { IdSchema, LocaleSchema, ThemePreferenceSchema } from './primitives'

export const ReviewRatingSchema = z.enum(['again', 'hard', 'good', 'easy'])
export type ReviewRating = z.infer<typeof ReviewRatingSchema>

export const FsrsStateSchema = z.enum(['new', 'learning', 'review', 'relearning'])
export type FsrsState = z.infer<typeof FsrsStateSchema>

export const FsrsCardSchema = z.object({
  due: z.iso.datetime(),
  stability: z.number().nonnegative(),
  difficulty: z.number().min(0).max(10),
  elapsedDays: z.number().nonnegative(),
  scheduledDays: z.number().nonnegative(),
  reps: z.number().int().nonnegative(),
  lapses: z.number().int().nonnegative(),
  state: FsrsStateSchema,
  learningStep: z.number().int().nonnegative().default(0),
  lastReview: z.iso.datetime().optional(),
})
export type FsrsCard = z.infer<typeof FsrsCardSchema>

export const ReviewLogSchema = z.object({
  id: IdSchema,
  itemId: IdSchema,
  reviewedAt: z.iso.datetime(),
  rating: ReviewRatingSchema,
  elapsedDays: z.number().nonnegative(),
  scheduledDays: z.number().nonnegative(),
  stability: z.number().nonnegative(),
  difficulty: z.number().min(0).max(10),
  state: FsrsStateSchema,
  durationMs: z.number().int().nonnegative().optional(),
  usedHint: z.boolean().default(false),
  format: z.enum(['see', 'hear', 'spell', 'play']).optional(),
})
export type ReviewLog = z.infer<typeof ReviewLogSchema>

export const LessonProgressSchema = z.object({
  status: z.enum(['not-started', 'in-progress', 'completed']),
  completedAt: z.iso.datetime().optional(),
  secondsSpent: z.number().int().nonnegative().default(0),
})
export type LessonProgress = z.infer<typeof LessonProgressSchema>

export const SkillProgressSchema = z.object({
  card: FsrsCardSchema.optional(),
  mastery: z.number().min(0).max(1).default(0),
  correct: z.number().int().nonnegative().default(0),
  incorrect: z.number().int().nonnegative().default(0),
  /**
   * Tempo máximo alcanzado con el metrónomo progresivo. Es opcional para no
   * invalidar progreso anterior y se limita al rango del motor de audio.
   */
  maxTempoBpm: z.number().int().min(40).max(240).optional(),
})
export type SkillProgress = z.infer<typeof SkillProgressSchema>

export const SettingsSchema = z.object({
  notation: NotationPreferenceSchema.default('do'),
  locale: LocaleSchema.default('es'),
  theme: ThemePreferenceSchema.default('light'),
  desiredRetention: z.number().min(0.8).max(0.95).default(0.9),
  maximumInterval: z.number().int().min(1).max(3650).default(365),
  fuzz: z.boolean().default(false),
  newPerDay: z.number().int().min(0).max(200).default(20),
  audioVolume: z.number().min(0).max(1).default(0.4),
  tempoBpm: z.number().int().min(20).max(300).default(80),
  midiEnabled: z.boolean().default(false),
  showFingering: z.boolean().default(true),
})
export type Settings = z.infer<typeof SettingsSchema>

export const SettingsRecordSchema = SettingsSchema.extend({
  id: IdSchema,
})
export type SettingsRecord = z.infer<typeof SettingsRecordSchema>

export const StreakSchema = z.object({
  current: z.number().int().nonnegative().default(0),
  longest: z.number().int().nonnegative().default(0),
  lastPracticeDate: z.iso.date().optional(),
  graceDaysUsedThisWeek: z.number().int().min(0).max(1).default(0),
})
export type Streak = z.infer<typeof StreakSchema>

export const LessonProgressRecordSchema = LessonProgressSchema.extend({
  id: IdSchema,
})
export type LessonProgressRecord = z.infer<typeof LessonProgressRecordSchema>

export const SkillProgressRecordSchema = SkillProgressSchema.extend({
  id: IdSchema,
})
export type SkillProgressRecord = z.infer<typeof SkillProgressRecordSchema>

export const PracticeSessionSchema = z.object({
  id: IdSchema,
  startedAt: z.iso.datetime(),
  endedAt: z.iso.datetime(),
  plannedMinutes: z.union([z.literal(15), z.literal(30), z.literal(45)]),
  blocks: z.array(
    z.object({
      kind: z.enum(['warmup', 'technique', 'theory', 'repertoire', 'review']),
      seconds: z.number().int().nonnegative(),
    }),
  ),
})
export type PracticeSession = z.infer<typeof PracticeSessionSchema>

export const AchievementSchema = z.object({
  id: IdSchema,
  unlockedAt: z.iso.datetime(),
})
export type Achievement = z.infer<typeof AchievementSchema>

const DEFAULT_SETTINGS = SettingsSchema.parse({})
const DEFAULT_STREAK = StreakSchema.parse({})

export const ProfileSchema = z.object({
  xp: z.number().int().nonnegative().default(0),
  level: z.number().int().positive().default(1),
  achievements: z.array(AchievementSchema).default([]),
  streak: StreakSchema.default(DEFAULT_STREAK),
})
export type Profile = z.infer<typeof ProfileSchema>

export const ProfileRecordSchema = ProfileSchema.extend({
  id: IdSchema,
})
export type ProfileRecord = z.infer<typeof ProfileRecordSchema>

export const ProgressDataSchema = z.object({
  schemaVersion: z.literal(1),
  lessons: z.record(IdSchema, LessonProgressSchema).default({}),
  skills: z.record(IdSchema, SkillProgressSchema).default({}),
  reviews: z.array(ReviewLogSchema).default([]),
  settings: SettingsSchema.default(DEFAULT_SETTINGS),
  ...ProfileSchema.shape,
  practiceSessions: z.array(PracticeSessionSchema).default([]),
})
export type ProgressData = z.infer<typeof ProgressDataSchema>

export const ProgressEnvelopeSchema = z.object({
  format: z.literal('pianodesdecero.progress'),
  version: z.literal(1),
  exportedAt: z.iso.datetime(),
  appVersion: z.string().min(1),
  sha256: z.string().regex(/^[0-9a-f]{64}$/, {
    message: 'El hash SHA-256 debe tener 64 caracteres hexadecimales en minúsculas',
  }),
  data: ProgressDataSchema,
})
export type ProgressEnvelope = z.infer<typeof ProgressEnvelopeSchema>
