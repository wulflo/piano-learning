import { beforeAll, describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { validateContentBundle } from '../src/content/validate'
import { type ContentBundle, type Exercise, type Lesson, type Score } from '../src/schemas'

const EXPECTED_TONICS = [
  'C',
  'G',
  'D',
  'A',
  'E',
  'B',
  'F#',
  'F',
  'Bb',
  'Eb',
  'Ab',
  'Db',
]

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
  const found = bundle.lessons.find((item) => item.id === 'lesson.m2-07')
  if (!found) throw new Error('Falta la lección M2-07')
  lesson = found
})

describe('M2-07 — Grados y funciones', () => {
  it('está publicada, validada y depende de M2-06', () => {
    expect(lesson.moduleId).toBe('M2')
    expect(lesson.status).toBe('published')
    expect(lesson.prerequisites).toContain('lesson.m2-06')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
    expect(lesson.skillIds).toContain('skill.chord-quality')
    expect(lesson.skillIds).toContain('skill.major-scale')
  })

  it('explica los grados, los números romanos y las funciones', () => {
    const text = lesson.sections
      .map((section) => `${section.titleEs} ${section.bodyEs ?? ''}`)
      .join(' ')
      .toLowerCase()

    expect(text).toContain('grado')
    expect(text).toContain('romano')
    expect(text).toContain('tonalidad')
    expect(text).toContain('dominante')
    expect(text).toContain('subdominante')
    expect(text).toContain('funciones')
  })

  it('incluye la demo de los acordes I y V en Do mayor', () => {
    const scores = scoreSections(lesson)
    expect(scores).toHaveLength(1)

    const score = scores[0]
    expect(score.key).toBe('C')
    expect(score.mode).toBe('major')
    expect(score.timeSignature).toEqual({ numerator: 4, denominator: 4 })
    expect(score.tempoBpm).toBe(80)
    expect([...measureTotals(score).values()]).toEqual([4, 4])

    const pitches = [...score.events]
      .sort((a, b) => a.measure - b.measure || a.beat - b.beat)
      .flatMap((event) => event.pitches.map((pitch) => pitch.step))
    expect(pitches).toEqual(['C', 'E', 'G', 'G', 'B', 'D'])
  })

  it('incluye una tarea real de teclado con el primer grado', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.tempoBpm).toBe(60)
    expect(task?.keys.length).toBe(3)
    expect(task?.checklistEs.length).toBeGreaterThanOrEqual(3)

    const instructions = task?.instructionsEs.toLowerCase() ?? ''
    expect(instructions).toContain('acorde')
  })

  it('tiene 12 ejercicios romanos, uno por tonalidad', () => {
    const romanExercises = lessonExercises(lesson, bundle).filter(
      (exercise) => exercise.type === 'roman-numeral',
    )

    expect(romanExercises).toHaveLength(12)

    const tonics = romanExercises.map((exercise) => exercise.key).sort()
    const expected = [...EXPECTED_TONICS].sort()
    expect(tonics).toEqual(expected)

    for (const exercise of romanExercises) {
      if (exercise.type !== 'roman-numeral') continue
      expect(exercise.mode).toBe('major')
      expect(exercise.numeral).toBe('V')
      expect(exercise.choices).toContain('V')
      expect(exercise.promptEs.length).toBeGreaterThan(5)
      expect(exercise.explanationEs).toContain('dominante')
    }
  })

  it('incluye un dictado de progresión con grados y opciones paralelas', () => {
    const progression = lessonExercises(lesson, bundle).find(
      (exercise) => exercise.type === 'ear-progression',
    )
    expect(progression).toBeDefined()
    if (progression?.type !== 'ear-progression') return

    expect(progression.key).toBe('C')
    expect(progression.mode).toBe('major')
    expect(progression.degrees).toEqual(['I', 'IV', 'V', 'I'])
    expect(progression.choices).toContain(progression.degrees.join(' '))
    expect(progression.choicesEn ?? []).toHaveLength(
      progression.choices?.length ?? 0,
    )
    expect((progression.promptEn ?? '').trim().length).toBeGreaterThan(5)
    expect(progression.explanationEn).toContain('tonic')
  })
})
