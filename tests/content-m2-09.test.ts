import { beforeAll, describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { validateContentBundle } from '../src/content/validate'
import { type ContentBundle, type Exercise, type Lesson, type Score } from '../src/schemas'

function measureTotals(score: Score): Map<number, number> {
  const totals = new Map<number, number>()
  for (const event of score.events) {
    const beats = event.value.duration === 'whole' ? 4 : event.value.duration === 'half' ? 2 : 1
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
  const found = bundle.lessons.find((item) => item.id === 'lesson.m2-09')
  if (!found) throw new Error('Falta la lección M2-09')
  lesson = found
})

describe('M2-09 — Pentatónicas', () => {
  it('está publicada, validada y depende de M2-08', () => {
    expect(lesson.moduleId).toBe('M2')
    expect(lesson.status).toBe('published')
    expect(lesson.prerequisites).toContain('lesson.m2-08')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
    expect(lesson.skillIds).toContain('skill.major-scale')
  })

  it('explica las pentatónicas mayor y menor', () => {
    const text = lesson.sections
      .map((section) => `${section.titleEs} ${section.bodyEs ?? ''}`)
      .join(' ')
      .toLowerCase()

    expect(text).toContain('pentat')
    expect(text).toContain('mayor')
    expect(text).toContain('menor')
    expect(text).toContain('tonalidad')
  })

  it('incluye la demo de la escala pentatónica mayor de Do', () => {
    const scores = scoreSections(lesson)
    expect(scores).toHaveLength(1)

    const score = scores[0]
    expect(score.key).toBe('C')
    expect(score.mode).toBe('major')
    expect(score.timeSignature).toEqual({ numerator: 4, denominator: 4 })
    expect(score.tempoBpm).toBe(80
    )
    expect([...measureTotals(score).values()]).toEqual([4, 2])

    const pitches = [...score.events]
      .sort((a, b) => a.measure - b.measure || a.beat - b.beat)
      .map((event) => event.pitches[0])
    expect(pitches).toHaveLength(5)
    expect(pitches[0].step).toBe('C')
    expect(pitches[1].step).toBe('D')
    expect(pitches[2].step).toBe('E')
    expect(pitches[3].step).toBe('G')
    expect(pitches[4].step).toBe('A')
  })

  it('incluye una tarea real de teclado con la pentatónica mayor', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.tempoBpm).toBe(60)
    expect(task?.keys.length).toBe(5)
    expect(task?.checklistEs.length).toBeGreaterThanOrEqual(3)

    const instructions = task?.instructionsEs.toLowerCase() ?? ''
    expect(instructions).toContain('pentat')
  })

  it('tiene ejercicios de creación de la pentatónica mayor y menor', () => {
    const spellingExercises = lessonExercises(lesson, bundle).filter(
      (exercise) => exercise.type === 'scale-spelling',
    )

    expect(spellingExercises).toHaveLength(2)

    const byId = new Map(spellingExercises.map((exercise) => [exercise.id, exercise]))
    const major = byId.get('ex.m2-09.a')
    const minor = byId.get('ex.m2-09.b')
    expect(major).toBeDefined()
    expect(minor).toBeDefined()
    if (major?.type !== 'scale-spelling' || minor?.type !== 'scale-spelling') return
    expect(major.tonic).toBe('C')
    expect(major.mode).toBe('major-pentatonic')
    expect(major.choices).toContain('C D E G A C')
    expect(minor.tonic).toBe('C')
    expect(minor.mode).toBe('minor-pentatonic')
    expect(minor.choices).toContain('C D G A C')
  })
})
