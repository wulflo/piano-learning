import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ExerciseSchema, type Exercise } from '../src/schemas'
import { CONTENT_SKILLS, findContentSkill } from '../src/content/skills'
import { createProgressDatabase } from '../src/state/db'
import {
  exerciseReviewItem,
  recordExerciseAttempt,
} from '../src/state/exercise-attempt'
import { buildReviewDay, reviewableSkills } from '../src/state/review-day'
import { createProgressRepositories } from '../src/state/repositories'

let databaseCounter = 0

function uniqueDatabaseName(): string {
  databaseCounter += 1
  return `pdc.test.auditory-fsrs.${databaseCounter}`
}

function loadExercise(file: string): Exercise {
  return ExerciseSchema.parse(
    JSON.parse(
      readFileSync(
        join(process.cwd(), 'content', 'exercises', file),
        'utf8',
      ),
    ),
  )
}

const AUDITORY_CASES = [
  {
    file: 'ex.m3-05.a.json',
    itemId: 'skill.ear-interval',
    kind: 'ear-interval',
  },
  {
    file: 'ex.m4-10.g.json',
    itemId: 'skill.chord-quality-ear',
    kind: 'ear-chord',
  },
  {
    file: 'ex.m2-08.a.json',
    itemId: 'skill.ear-scale',
    kind: 'ear-scale',
  },
  {
    file: 'ex.m2-07.m.json',
    itemId: 'skill.ear-progression',
    kind: 'ear-progression',
  },
] as const

describe('F3-025 — Ítems auditivos en FSRS', () => {
  it('cada tipo auditivo resuelve un ítem propio con parámetros y formato hear', () => {
    for (const expected of AUDITORY_CASES) {
      const exercise = loadExercise(expected.file)
      expect(exercise.type).toBe(expected.kind)

      const item = exerciseReviewItem(exercise)
      expect(item).toEqual({
        itemId: expected.itemId,
        kind: expected.kind,
        format: 'hear',
      })

      const skill = findContentSkill(expected.itemId)
      expect(skill).toBeDefined()
      expect(skill?.kind).toBe(expected.kind)
      expect(skill?.labelEs).not.toBe('')
      expect(skill?.labelEn).not.toBe('')
      expect(Object.keys(skill?.params ?? {}).length).toBeGreaterThan(0)
      expect(skill?.lessonIds.length).toBeGreaterThan(0)
    }
  })

  it('separa las variantes ver y oír en ítems distintos', () => {
    const earInterval = exerciseReviewItem(loadExercise('ex.m3-05.a.json'))
    const seeInterval = exerciseReviewItem(loadExercise('ex.m3-04.a.json'))
    expect(earInterval.itemId).not.toBe(seeInterval.itemId)
    expect(earInterval.format).toBe('hear')
    expect(seeInterval.format).not.toBe('hear')

    const earChord = exerciseReviewItem(loadExercise('ex.m4-10.g.json'))
    const seeChord = exerciseReviewItem(loadExercise('ex.m4-10.a.json'))
    expect(earChord.itemId).not.toBe(seeChord.itemId)
    expect(earChord.format).toBe('hear')
    expect(seeChord.format).not.toBe('hear')

    const earScale = exerciseReviewItem(loadExercise('ex.m2-08.a.json'))
    const seeScale = exerciseReviewItem(loadExercise('ex.m2-08.b.json'))
    expect(earScale.itemId).not.toBe(seeScale.itemId)
    expect(earScale.format).toBe('hear')
    expect(seeScale.format).not.toBe('hear')

    const earProgression = exerciseReviewItem(
      loadExercise('ex.m2-07.m.json'),
    )
    expect(earProgression.itemId).toBe('skill.ear-progression')
    expect(earProgression.format).toBe('hear')
  })

  it('registra el intento auditivo y lo excluye de la habilidad visual', async () => {
    const repositories = createProgressRepositories(
      createProgressDatabase({ name: uniqueDatabaseName() }),
    )
    try {
      const exercise = loadExercise('ex.m2-08.a.json')
      const now = new Date('2026-11-10T12:00:00.000Z')

      const result = await recordExerciseAttempt(repositories, {
        exercise,
        correct: true,
        durationMs: 8_000,
        now,
      })

      expect(result.progress.id).toBe('skill.ear-scale')
      expect(result.progress.correct).toBe(1)
      expect(result.progress.incorrect).toBe(0)
      expect(result.progress.card).toBeDefined()

      const visual = await repositories.skills.get('skill.major-scale')
      expect(visual).toBeUndefined()

      const logs = await repositories.reviews.all('skill.ear-scale')
      expect(logs).toHaveLength(1)
      expect(logs[0]?.format).toBe('hear')
      expect(logs[0]?.rating).toBe('good')
    } finally {
      repositories.close()
    }
  })

  it('incluye las habilidades auditivas en la cola diaria', () => {
    const encountered = new Set(
      AUDITORY_CASES.map((expected) => expected.itemId),
    )
    const skills = reviewableSkills(CONTENT_SKILLS, encountered, [])
    const ids = skills.map((skill) => skill.id)
    for (const expected of AUDITORY_CASES) {
      expect(ids).toContain(expected.itemId)
    }

    const now = new Date('2026-11-10T12:00:00.000Z')
    const day = buildReviewDay(skills, [], [], {
      now,
      newPerDay: 100,
      seed: 1,
    })
    const queueIds = day.queue.entries.map((entry) => entry.itemId)
    for (const expected of AUDITORY_CASES) {
      expect(queueIds).toContain(expected.itemId)
    }
    expect(day.queue.entries.every((entry) => entry.status === 'new')).toBe(true)
    expect(day.queue.counts.total).toBe(AUDITORY_CASES.length)
  })
})
