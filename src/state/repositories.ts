import {
  IdSchema,
  LessonProgressRecordSchema,
  LessonProgressSchema,
  PracticeSessionSchema,
  ProfileRecordSchema,
  ProgressDataSchema,
  ProfileSchema,
  ReviewLogSchema,
  SettingsRecordSchema,
  SettingsSchema,
  SkillProgressRecordSchema,
  SkillProgressSchema,
  type LessonProgress,
  type LessonProgressRecord,
  type PracticeSession,
  type Profile,
  type ProfileRecord,
  type ProgressData,
  type ReviewLog,
  type Settings,
  type SettingsRecord,
  type SkillProgress,
  type SkillProgressRecord,
} from '../schemas'
import {
  createProgressDatabase,
  PROFILE_RECORD_ID,
  SETTINGS_RECORD_ID,
  type ProgressDatabase,
} from './db'
import { practiceSessionSeconds } from './progress-dashboard'
import { recordPracticeDay } from './streak'
import { applyActivity, levelForXp, mergeAchievements } from './xp'

/**
 * Repositorios tipados sobre la base Dexie.
 *
 * Cada operación valida con Zod antes de escribir y al leer, de modo que un
 * registro corrupto o una llamada con datos inválidos falle cerca del origen en
 * vez de propagarse al resto de la app.
 */

export interface LessonRepository {
  get(id: string): Promise<LessonProgress | undefined>
  put(id: string, progress: LessonProgress): Promise<LessonProgressRecord>
  all(): Promise<LessonProgressRecord[]>
  remove(id: string): Promise<void>
  clear(): Promise<void>
}

export interface SkillRepository {
  get(id: string): Promise<SkillProgress | undefined>
  put(id: string, progress: SkillProgress): Promise<SkillProgressRecord>
  all(): Promise<SkillProgressRecord[]>
  remove(id: string): Promise<void>
  clear(): Promise<void>
}

export interface ReviewRepository {
  save(log: ReviewLog): Promise<ReviewLog>
  get(id: string): Promise<ReviewLog | undefined>
  all(itemId?: string): Promise<ReviewLog[]>
  count(): Promise<number>
  remove(id: string): Promise<void>
  clear(): Promise<void>
}

export interface SettingsRepository {
  /**
   * Devuelve la fila guardada o `undefined` si todavía no existe.
   *
   * Sirve para distinguir una instalación nueva de unos ajustes ya
   * personalizados: `get()` devuelve los valores por defecto en ambos casos y
   * no permite migrar los ajustes locales la primera vez.
   */
  read(): Promise<Settings | undefined>
  /** Devuelve los ajustes guardados o los valores por defecto si no hay fila. */
  get(): Promise<Settings>
  save(settings: Settings): Promise<Settings>
  /** Borra la fila y devuelve los valores por defecto. */
  reset(): Promise<Settings>
}

export interface ProfileRepository {
  /** Devuelve el perfil guardado o uno inicial si todavía no existe. */
  get(): Promise<Profile>
  /** Reemplaza el perfil completo (importación o reseteo). */
  save(profile: Profile): Promise<Profile>
  /**
   * Aplica una transformación dentro de una transacción. El XP nunca puede
   * bajar y los logros ya conseguidos nunca se eliminan.
   */
  update(update: (profile: Profile) => Profile): Promise<Profile>
  /** Registra una práctica (día ISO) y actualiza la racha con gracia semanal. */
  recordPractice(date: string): Promise<Profile>
  clear(): Promise<void>
}

export interface SessionRepository {
  get(id: string): Promise<PracticeSession | undefined>
  save(session: PracticeSession): Promise<PracticeSession>
  all(): Promise<PracticeSession[]>
  remove(id: string): Promise<void>
  clear(): Promise<void>
}

export interface ProgressRepositories {
  lessons: LessonRepository
  skills: SkillRepository
  reviews: ReviewRepository
  settings: SettingsRepository
  sessions: SessionRepository
  profile: ProfileRepository
  /**
   * Guarda en una sola transacción la tarjeta actualizada de una habilidad y el
   * registro del repaso. La UI nunca puede quedar con una tarjeta avanzada sin
   * historial ni con historial sin tarjeta si falla una de las dos escrituras.
   */
  saveReviewResult(
    itemId: string,
    progress: SkillProgress,
    log: ReviewLog,
  ): Promise<{ progress: SkillProgressRecord; log: ReviewLog }>
  /**
   * Guarda una sesión de práctica y actualiza XP y racha en una sola
   * transacción. Repetir el guardado de la misma sesión no duplica la
   * recompensa. Una sesión de menos de un minuto se guarda pero no suma XP ni
   * racha.
   */
  recordPracticeSession(session: PracticeSession): Promise<{
    session: PracticeSession
    profile: Profile
  }>
  /**
   * Reemplaza todo el progreso en una sola transacción. Valida y prepara las
   * filas antes de borrar nada, así que un archivo inválido no toca la base.
   */
  replaceAll(data: ProgressData): Promise<void>
  /**
   * Borra todo el progreso en una sola transacción. Los repositorios vuelven a
   * devolver valores iniciales, como en una instalación nueva.
   */
  clearAll(): Promise<void>
  close(): void
}

function parseId(id: string): string {
  return IdSchema.parse(id)
}

function sortByReviewedAt(a: ReviewLog, b: ReviewLog): number {
  return a.reviewedAt.localeCompare(b.reviewedAt) || a.id.localeCompare(b.id)
}

function sortByStartedAt(a: PracticeSession, b: PracticeSession): number {
  return a.startedAt.localeCompare(b.startedAt) || a.id.localeCompare(b.id)
}

/** Construye los repositorios sobre una base existente. */
export function createProgressRepositories(
  db: ProgressDatabase = createProgressDatabase(),
): ProgressRepositories {
  const lessons: LessonRepository = {
    async get(id) {
      const row = await db.lessons.get(parseId(id))
      return row === undefined ? undefined : LessonProgressSchema.parse(row)
    },
    async put(id, progress) {
      const row = LessonProgressRecordSchema.parse({ ...progress, id: parseId(id) })
      await db.lessons.put(row)
      return row
    },
    async all() {
      const rows = await db.lessons.toArray()
      return rows.map((row) => LessonProgressRecordSchema.parse(row))
    },
    async remove(id) {
      await db.lessons.delete(parseId(id))
    },
    async clear() {
      await db.lessons.clear()
    },
  }

  const skills: SkillRepository = {
    async get(id) {
      const row = await db.skills.get(parseId(id))
      return row === undefined ? undefined : SkillProgressSchema.parse(row)
    },
    async put(id, progress) {
      const row = SkillProgressRecordSchema.parse({ ...progress, id: parseId(id) })
      await db.skills.put(row)
      return row
    },
    async all() {
      const rows = await db.skills.toArray()
      return rows.map((row) => SkillProgressRecordSchema.parse(row))
    },
    async remove(id) {
      await db.skills.delete(parseId(id))
    },
    async clear() {
      await db.skills.clear()
    },
  }

  const reviews: ReviewRepository = {
    async save(log) {
      const parsed = ReviewLogSchema.parse(log)
      await db.reviews.put(parsed)
      return parsed
    },
    async get(id) {
      const row = await db.reviews.get(parseId(id))
      return row === undefined ? undefined : ReviewLogSchema.parse(row)
    },
    async all(itemId) {
      const rows =
        itemId === undefined
          ? await db.reviews.toArray()
          : await db.reviews.where('itemId').equals(parseId(itemId)).toArray()
      return rows.map((row) => ReviewLogSchema.parse(row)).sort(sortByReviewedAt)
    },
    async count() {
      return db.reviews.count()
    },
    async remove(id) {
      await db.reviews.delete(parseId(id))
    },
    async clear() {
      await db.reviews.clear()
    },
  }

  const settings: SettingsRepository = {
    async read() {
      const row = await db.settings.get(SETTINGS_RECORD_ID)
      return row === undefined ? undefined : SettingsSchema.parse(row)
    },
    async get() {
      const row = await db.settings.get(SETTINGS_RECORD_ID)
      return row === undefined ? SettingsSchema.parse({}) : SettingsSchema.parse(row)
    },
    async save(value) {
      const parsed = SettingsSchema.parse(value)
      const row: SettingsRecord = SettingsRecordSchema.parse({
        ...parsed,
        id: SETTINGS_RECORD_ID,
      })
      await db.settings.put(row)
      return parsed
    },
    async reset() {
      await db.settings.clear()
      return SettingsSchema.parse({})
    },
  }

  const profile: ProfileRepository = {
    async get() {
      const row = await db.profile.get(PROFILE_RECORD_ID)
      return row === undefined ? ProfileSchema.parse({}) : ProfileSchema.parse(row)
    },
    async save(value) {
      const parsed = ProfileSchema.parse(value)
      const normalized = ProfileSchema.parse({
        ...parsed,
        level: levelForXp(parsed.xp),
      })
      const row: ProfileRecord = ProfileRecordSchema.parse({
        ...normalized,
        id: PROFILE_RECORD_ID,
      })
      await db.profile.put(row)
      return ProfileSchema.parse(row)
    },
    async update(updater) {
      return db.transaction('rw', db.profile, async () => {
        const row = await db.profile.get(PROFILE_RECORD_ID)
        const current =
          row === undefined ? ProfileSchema.parse({}) : ProfileSchema.parse(row)
        const proposed = ProfileSchema.parse(updater(current))
        const xp = Math.max(current.xp, proposed.xp)
        const achievements = mergeAchievements(
          current.achievements,
          proposed.achievements,
        )
        const merged = ProfileSchema.parse({
          ...proposed,
          xp,
          level: levelForXp(xp),
          achievements,
        })
        const record: ProfileRecord = ProfileRecordSchema.parse({
          ...merged,
          id: PROFILE_RECORD_ID,
        })
        await db.profile.put(record)
        return ProfileSchema.parse(record)
      })
    },
    async recordPractice(date) {
      return profile.update((current) => ({
        ...current,
        streak: recordPracticeDay(current.streak, date),
      }))
    },
    async clear() {
      await db.profile.clear()
    },
  }

  const sessions: SessionRepository = {
    async get(id) {
      const row = await db.sessions.get(parseId(id))
      return row === undefined ? undefined : PracticeSessionSchema.parse(row)
    },
    async save(session) {
      const parsed = PracticeSessionSchema.parse(session)
      await db.sessions.put(parsed)
      return parsed
    },
    async all() {
      const rows = await db.sessions.toArray()
      return rows.map((row) => PracticeSessionSchema.parse(row)).sort(sortByStartedAt)
    },
    async remove(id) {
      await db.sessions.delete(parseId(id))
    },
    async clear() {
      await db.sessions.clear()
    },
  }

  async function recordPracticeSession(
    session: PracticeSession,
  ): Promise<{ session: PracticeSession; profile: Profile }> {
    const parsed = PracticeSessionSchema.parse(session)

    return db.transaction('rw', db.sessions, db.profile, async () => {
      const existing = await db.sessions.get(parsed.id)
      const row = await db.profile.get(PROFILE_RECORD_ID)
      const current =
        row === undefined ? ProfileSchema.parse({}) : ProfileSchema.parse(row)

      if (existing !== undefined) {
        return { session: PracticeSessionSchema.parse(existing), profile: current }
      }

      await db.sessions.put(parsed)

      const minutes = Math.floor(practiceSessionSeconds(parsed) / 60)
      if (minutes <= 0) {
        return { session: parsed, profile: current }
      }

      const next = applyActivity(
        {
          ...current,
          streak: recordPracticeDay(
            current.streak,
            parsed.endedAt.slice(0, 10),
          ),
        },
        { kind: 'practice', minutes },
      )
      const record = ProfileRecordSchema.parse({
        ...next,
        id: PROFILE_RECORD_ID,
        level: levelForXp(next.xp),
      })
      await db.profile.put(record)
      return { session: parsed, profile: ProfileSchema.parse(record) }
    })
  }

  async function saveReviewResult(
    itemId: string,
    progress: SkillProgress,
    log: ReviewLog,
  ): Promise<{ progress: SkillProgressRecord; log: ReviewLog }> {
    const skillRow = SkillProgressRecordSchema.parse({
      ...progress,
      id: parseId(itemId),
    })
    const reviewRow = ReviewLogSchema.parse(log)

    return db.transaction('rw', db.skills, db.reviews, async () => {
      await db.skills.put(skillRow)
      await db.reviews.put(reviewRow)
      return {
        progress: SkillProgressRecordSchema.parse(skillRow),
        log: reviewRow,
      }
    })
  }

  async function replaceAll(data: ProgressData): Promise<void> {
    const parsed = ProgressDataSchema.parse(data)

    const lessonRows = Object.entries(parsed.lessons).map(([id, progress]) =>
      LessonProgressRecordSchema.parse({ ...progress, id }),
    )
    const skillRows = Object.entries(parsed.skills).map(([id, progress]) =>
      SkillProgressRecordSchema.parse({ ...progress, id }),
    )
    const reviewRows = parsed.reviews.map((review) => ReviewLogSchema.parse(review))
    const sessionRows = parsed.practiceSessions.map((session) =>
      PracticeSessionSchema.parse(session),
    )
    const settingsRow: SettingsRecord = SettingsRecordSchema.parse({
      ...parsed.settings,
      id: SETTINGS_RECORD_ID,
    })
    const profileRow: ProfileRecord = ProfileRecordSchema.parse({
      id: PROFILE_RECORD_ID,
      xp: parsed.xp,
      level: levelForXp(parsed.xp),
      achievements: parsed.achievements,
      streak: parsed.streak,
    })

    await db.transaction(
      'rw',
      [db.lessons, db.skills, db.reviews, db.settings, db.sessions, db.profile],
      async () => {
        await db.lessons.clear()
        await db.skills.clear()
        await db.reviews.clear()
        await db.settings.clear()
        await db.sessions.clear()
        await db.profile.clear()

        if (lessonRows.length > 0) await db.lessons.bulkPut(lessonRows)
        if (skillRows.length > 0) await db.skills.bulkPut(skillRows)
        if (reviewRows.length > 0) await db.reviews.bulkPut(reviewRows)
        if (sessionRows.length > 0) await db.sessions.bulkPut(sessionRows)
        await db.settings.put(settingsRow)
        await db.profile.put(profileRow)
      },
    )
  }

  async function clearAll(): Promise<void> {
    await db.transaction(
      'rw',
      [db.lessons, db.skills, db.reviews, db.settings, db.sessions, db.profile],
      async () => {
        await db.lessons.clear()
        await db.skills.clear()
        await db.reviews.clear()
        await db.settings.clear()
        await db.sessions.clear()
        await db.profile.clear()
      },
    )
  }

  return {
    lessons,
    skills,
    reviews,
    settings,
    sessions,
    profile,
    saveReviewResult,
    recordPracticeSession,
    replaceAll,
    clearAll,
    close() {
      db.close()
    },
  }
}
