import { beforeAll, describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { validateContentBundle } from '../src/content/validate'
import { type ContentBundle, type Exercise, type Lesson, type Score } from '../src/schemas'

const DURATION_BEATS: Record<string, number> = {
  whole: 4,
  half: 2,
  quarter: 1,
  eighth: 0.5,
  sixteenth: 0.25,
  'thirty-second': 0.125,
}

function measureTotals(score: Score): Map<number, number> {
  const totals = new Map<number, number>()
  for (const event of score.events) {
    const beats = DURATION_BEATS[event.value.duration]
    totals.set(event.measure, (totals.get(event.measure) ?? 0) + beats)
  }
  return totals
}

function scoreSections(lesson: Lesson): Score[] {
  return lesson.sections
    .filter((section) => section.kind === 'score' && section.score)
    .map((section) => section.score as Score)
}

function lessonExercises(lesson: Lesson, bundle: ContentBundle): Exercise[] {
  return lesson.exerciseIds
    .map((id) => bundle.exercises.find((item) => item.id === id))
    .filter((exercise): exercise is Exercise => Boolean(exercise))
}

let bundle: ContentBundle
let lesson: Lesson

beforeAll(async () => {
  const result = validateContentBundle(await loadContentFromDisk())
  expect(result.ok).toBe(true)
  if (!result.bundle) throw new Error('El contenido del repositorio no es válido')
  bundle = result.bundle
  const found = bundle.lessons.find((item) => item.id === 'lesson.m2-04')
  if (!found) throw new Error('Falta la lección M2-04')
  lesson = found
})

describe('M2-04 — Menor natural', () => {
  it('está publicada, validada y depende de M2-03', () => {
    expect(lesson.moduleId).toBe('M2')
    expect(lesson.status).toBe('published')
    expect(lesson.prerequisites).toContain('lesson.m2-03')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
    expect(lesson.skillIds).toContain('skill.major-scale')
  })

  it('explica el patrón menor, las doce tonalidades y la comparación con el mayor', () => {
    const text = lesson.sections
      .map((section) => `${section.titleEs} ${section.bodyEs ?? ''}`)
      .join(' ')
      .toLowerCase()

    expect(text).toContain('menor')
    expect(text).toContain('patrón')
    expect(text).toContain('mayor')
    expect(text).toContain('sem')
  })

  it('incluye la escala menor de Do con demo en pentagrama en 4/4', () => {
    const scores = scoreSections(lesson)
    expect(scores).toHaveLength(1)

    const score = scores[0]
    expect(score.key).toBe('C')
    expect(score.mode).toBe('minor')
    expect(score.timeSignature).toEqual({ numerator: 4, denominator: 4 })
    expect(score.tempoBpm).toBe(80)
    expect([...measureTotals(score).values()]).toEqual([4, 4])

    const pitches = [...score.events]
      .sort((a, b) => a.measure - b.measure || a.beat - b.beat)
      .map((event) => event.pitches[0])
    expect(pitches).toHaveLength(8)
  })

  it('incluye una tarea real de teclado con patrón y checklist', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.tempoBpm).toBe(60)
    expect(task?.keys.length).toBeGreaterThanOrEqual(5)
    expect(task?.checklistEs.length).toBeGreaterThanOrEqual(3)

    const instructions = task?.instructionsEs.toLowerCase() ?? ''
    expect(instructions).toContain('menor')
    expect(task?.demoScore).toBeUndefined()
  })

  it('tiene un ejercicio de audio comparando el menor con el mayor', () => {
    const soundExercises = lessonExercises(lesson, bundle).filter(
      (exercise) => exercise.type === 'sound-parameter',
    )

    expect(soundExercises).toHaveLength(1)
    const exercise = soundExercises[0]
    if (exercise.type !== 'sound-parameter') return
    expect(exercise.parameter).toBe('pitch')
    expect(exercise.exampleA.midi).toBe(63)
    expect(exercise.exampleB.midi).toBe(64)
    expect(exercise.choices).toContain('La altura (un semitono)')
  })

  it('tiene un ejercicio de deletreo del menor natural', () => {
    const spellingExercises = lessonExercises(lesson, bundle).filter(
      (exercise) => exercise.type === 'scale-spelling',
    )

    expect(spellingExercises).toHaveLength(1)
    const exercise = spellingExercises[0]
    if (exercise.type !== 'scale-spelling') return
    expect(exercise.tonic).toBe('C')
    expect(exercise.mode).toBe('natural-minor')
    expect(exercise.choices).toContain('C D Eb F G Ab Bb C')
  })
})
