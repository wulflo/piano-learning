import { beforeAll, describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { validateContentBundle } from '../src/content/validate'
import { type ContentBundle, type DurationName, type Exercise, type Lesson, type Score } from '../src/schemas'

const DURATION_BEATS: Record<DurationName, number> = {
  whole: 4,
  half: 2,
  quarter: 1,
  eighth: 0.5,
  sixteenth: 0.25,
  'thirty-second': 0.125,
}

interface ExpectedKeyExercise {
  key: string
  answer: string
  phrase: string
}

const EXPECTED_KEY_EXERCISES: ExpectedKeyExercise[] = [
  { key: 'C', answer: 'Sin alteraciones', phrase: 'La escala de Do mayor no altera ninguna nota' },
  { key: 'G', answer: '1 sola nota con sostenido (F#)', phrase: 'La escala de Sol mayor altera una sola nota' },
  { key: 'D', answer: '2 sostenidos', phrase: 'La escala de Re mayor altera dos notas' },
  { key: 'A', answer: '3 sostenidos', phrase: 'La escala de La mayor altera tres notas' },
  { key: 'E', answer: '4 sostenidos', phrase: 'La escala de Mi mayor altera cuatro notas' },
  { key: 'B', answer: '5 sostenidos', phrase: 'La escala de Si mayor altera cinco notas' },
  { key: 'F#', answer: '6 sostenidos', phrase: 'La escala de Fa sostenido mayor altera seis notas' },
  { key: 'F', answer: '1 bemol (Bb)', phrase: 'La escala de Fa mayor baja una nota con bemol' },
  { key: 'Bb', answer: '2 bemoles', phrase: 'La escala de Si bemol mayor baja dos notas' },
  { key: 'Eb', answer: '3 bemoles', phrase: 'La escala de Mi bemol mayor baja tres notas' },
  { key: 'Ab', answer: '4 bemoles', phrase: 'La escala de La bemol mayor baja cuatro notas' },
  { key: 'Db', answer: '5 bemoles', phrase: 'La escala de Re bemol mayor baja cinco notas' },
]

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
  const found = bundle.lessons.find((item) => item.id === 'lesson.m2-02')
  if (!found) throw new Error('Falta la lección M2-02')
  lesson = found
})

describe('M2-02 — Círculo de quintas', () => {
  it('está publicada, validada y depende de M2-01', () => {
    expect(lesson.moduleId).toBe('M2')
    expect(lesson.status).toBe('published')
    expect(lesson.prerequisites).toContain('lesson.m2-01')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
    expect(lesson.skillIds).toContain('skill.key-signature')
  })

  it('explica el círculo de quintas, las doce posiciones y las alteraciones', () => {
    const text = lesson.sections
      .map((section) => `${section.titleEs} ${section.bodyEs ?? ''}`)
      .join(' ')
      .toLowerCase()

    expect(text).toContain('círculo')
    expect(text).toContain('quinta')
    expect(text).toContain('alteración')
    expect(text).toContain('sostenido')
    expect(text).toContain('bemol')
  })

  it('incluye la escala de Do mayor con demo en pentagrama en 4/4', () => {
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
      .map((event) => event.pitches[0])
    expect(pitches).toHaveLength(8)
    expect(pitches[0].step).toBe('C')
  })

  it('incluye una tarea real de teclado con patrón y demo', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.tempoBpm).toBe(60)
    expect(task?.keys.length).toBeGreaterThanOrEqual(5)
    expect(task?.checklistEs.length).toBeGreaterThanOrEqual(3)

    const instructions = task?.instructionsEs.toLowerCase() ?? ''
    expect(instructions).toContain('t-t-s-t-t-t-s')
    expect(task?.demoScore).toBeDefined()
  })

  it('tiene 12 ejercicios de armadura con las respuestas correctas', () => {
    const keyExercises = lessonExercises(lesson, bundle).filter(
      (exercise) => exercise.type === 'key-signature',
    )

    expect(keyExercises).toHaveLength(12)

    for (const exercise of keyExercises) {
      if (exercise.type !== 'key-signature') continue
      const expected = EXPECTED_KEY_EXERCISES.find((item) => item.key === exercise.key)
      expect(expected, `Falta la armadura esperada: ${exercise.key}`).toBeDefined()
      expect(exercise.mode).toBe('major')
      expect(exercise.choices).toContain(expected!.answer)
      expect(exercise.promptEs.length).toBeGreaterThan(5)
      expect(exercise.explanationEs).toContain(expected!.phrase)
    }
  })
})
