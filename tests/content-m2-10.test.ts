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
  const found = bundle.lessons.find((item) => item.id === 'lesson.m2-10')
  if (!found) throw new Error('Falta la lección M2-10')
  lesson = found
})

describe('M2-10 — Escala de blues', () => {
  it('está publicada, validada y depende de M2-09', () => {
    expect(lesson.moduleId).toBe('M2')
    expect(lesson.status).toBe('published')
    expect(lesson.prerequisites).toContain('lesson.m2-09')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
    expect(lesson.skillIds).toContain('skill.major-scale')
  })

  it('explica la fórmula del blues, las doce tonalidades y el bemol de la quinta', () => {
    const text = lesson.sections
      .map((section) => `${section.titleEs} ${section.bodyEs ?? ''}`)
      .join(' ')
      .toLowerCase()

    expect(text).toContain('blues')
    expect(text).toContain('menor')
    expect(text).toContain('quinta')
    expect(text).toContain('doce')
  })

  it('incluye la demo de la escala de blues de Do', () => {
    const scores = scoreSections(lesson)
    expect(scores).toHaveLength(1)

    const score = scores[0]
    expect(score.key).toBe('C')
    expect(score.mode).toBe('major')
    expect(score.timeSignature).toEqual({ numerator: 4, denominator: 4 })
    expect(score.tempoBpm).toBe(80)
    expect([...measureTotals(score).values()]).toEqual([4, 2])

    const pitches = [...score.events]
      .sort((a, b) => a.measure - b.measure || a.beat - b.beat)
      .map((event) => event.pitches[0])
    expect(pitches).toHaveLength(5)
    expect(pitches[0].step).toBe('C')
    expect(pitches[1].step).toBe('D')
    expect(pitches[1].accidental).toBe('#')
    expect(pitches[2].step).toBe('F')
    expect(pitches[2].accidental).toBe('#')
    expect(pitches[3].step).toBe('G')
    expect(pitches[4].step).toBe('A')
  })

  it('incluye una tarea real de teclado con la escala de blues', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.tempoBpm).toBe(60)
    expect(task?.keys.length).toBe(5)
    expect(task?.checklistEs.length).toBeGreaterThanOrEqual(3)

    const instructions = task?.instructionsEs.toLowerCase() ?? ''
    expect(instructions).toContain('blues')
  })

  it('tiene ejercicio de patron (fórmula) y de audio (identificación) del blues', () => {
    const spellingExercises = lessonExercises(lesson, bundle).filter(
      (exercise) => exercise.type === 'scale-spelling',
    )
    const earExercises = lessonExercises(lesson, bundle).filter(
      (exercise) => exercise.type === 'ear-scale',
    )

    expect(spellingExercises).toHaveLength(1)
    const spelling = spellingExercises[0]
    if (spelling?.type !== 'scale-spelling') return
    expect(spelling.tonic).toBe('C')
    expect(spelling.mode).toBe('blues')
    expect(spelling.choices).toContain('C D# F# G A C')

    expect(earExercises).toHaveLength(1)
    const ear = earExercises[0]
    if (ear?.type !== 'ear-scale') return
    expect(ear.mode).toBe('blues')
    expect(ear.choices).toContain('Blues')
  })
})
