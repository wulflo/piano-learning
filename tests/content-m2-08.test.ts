import { beforeAll, describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { validateContentBundle } from '../src/content/validate'
import { type ContentBundle, type Exercise, type Lesson, type Score } from '../src/schemas'

function measureTotals(score: Score): Map<number, number> {
  const totals = new Map<number, number>()
  for (const event of score.events) {
    const beats = event.value.duration === 'whole' ? 4 : 1
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
  const found = bundle.lessons.find((item) => item.id === 'lesson.m2-08')
  if (!found) throw new Error('Falta la lección M2-08')
  lesson = found
})

describe('M2-08 — Modos', () => {
  it('está publicada, validada y depende de M2-07', () => {
    expect(lesson.moduleId).toBe('M2')
    expect(lesson.status).toBe('published')
    expect(lesson.prerequisites).toContain('lesson.m2-07')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
    expect(lesson.skillIds).toContain('skill.major-scale')
  })

  it('explica los siete modos, su color y las relativas', () => {
    const text = lesson.sections
      .map((section) => `${section.titleEs} ${section.bodyEs ?? ''}`)
      .join(' ')
      .toLowerCase()

    expect(text).toContain('modo')
    expect(text).toContain('siete')
    expect(text).toContain('color')
    expect(text).toContain('semitono')
    expect(text).toContain('relativa')
  })

  it('incluye la demo de la escala de Lídio en Do', () => {
    const scores = scoreSections(lesson)
    expect(scores).toHaveLength(1)

    const score = scores[0]
    expect(score.key).toBe('C')
    expect(score.mode).toBe('major')
    expect(score.timeSignature).toEqual({ numerator: 4, denominator: 4 })
    expect(score.tempoBpm).toBe(80)
    expect([...measureTotals(score).values()]).toEqual([4, 3])

    const pitches = [...score.events]
      .sort((a, b) => a.measure - b.measure || a.beat - b.beat)
      .map((event) => event.pitches[0])
    expect(pitches).toHaveLength(7)
    expect(pitches[0].step).toBe('C')
    expect(pitches[3].step).toBe('F')
    expect(pitches[3].accidental).toBe('#')
  })

  it('incluye una tarea real de teclado con la escala de Lídio', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.tempoBpm).toBe(60)
    expect(task?.keys.length).toBe(7)
    expect(task?.checklistEs.length).toBeGreaterThanOrEqual(3)

    const instructions = task?.instructionsEs.toLowerCase() ?? ''
    expect(instructions).toContain('lídio')
  })

  it('tiene ejercicio de identificación auditiva del modo Lídio', () => {
    const earExercises = lessonExercises(lesson, bundle).filter(
      (exercise) => exercise.type === 'ear-scale',
    )

    expect(earExercises).toHaveLength(1)
    const exercise = earExercises[0]
    if (exercise.type !== 'ear-scale') return
    expect(exercise.mode).toBe('lydian')
    expect(exercise.choices).toContain('Lídio')
  })

  it('tiene ejercicio de deletreo del modo dórico', () => {
    const spellingExercises = lessonExercises(lesson, bundle).filter(
      (exercise) => exercise.type === 'scale-spelling',
    )

    expect(spellingExercises).toHaveLength(1)
    const exercise = spellingExercises[0]
    if (exercise.type !== 'scale-spelling') return
    expect(exercise.tonic).toBe('C')
    expect(exercise.mode).toBe('dorian')
    expect(exercise.choices).toContain('C D Eb F G A Bb C')
  })
})
