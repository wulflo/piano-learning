import { beforeAll, describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { validateContentBundle } from '../src/content/validate'
import { type ContentBundle, type Exercise, type Lesson } from '../src/schemas'

interface ExpectedExercise {
  key: string
  mode: string
  answer: string
  phrase: string
}

const EXPECTED_EXERCISES: ExpectedExercise[] = [
  {
    key: 'C',
    mode: 'minor',
    answer: 'Menor',
    phrase: 'Do menor es la paralela menor de Do mayor',
  },
  {
    key: 'E',
    mode: 'minor',
    answer: 'Menor',
    phrase: 'Mi menor es la paralela menor de Mi mayor',
  },
  {
    key: 'G',
    mode: 'major',
    answer: 'Mayor',
    phrase: 'Sol mayor es mayor',
  },
]

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
  const found = bundle.lessons.find((item) => item.id === 'lesson.m2-03')
  if (!found) throw new Error('Falta la lección M2-03')
  lesson = found
})

describe('M2-03 — Relativas y homónimas', () => {
  it('está publicada, validada y depende de M2-02', () => {
    expect(lesson.moduleId).toBe('M2')
    expect(lesson.status).toBe('published')
    expect(lesson.prerequisites).toContain('lesson.m2-02')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
    expect(lesson.skillIds).toContain('skill.key-signature')
    expect(lesson.skillIds).toContain('skill.major-scale')
  })

  it('explica las relativas, los doce pares y las homónimas', () => {
    const text = lesson.sections
      .map((section) => `${section.titleEs} ${section.bodyEs ?? ''}`)
      .join(' ')
      .toLowerCase()

    expect(text).toContain('relativa')
    expect(text).toContain('homónima')
    expect(text).toContain('mayor')
    expect(text).toContain('menor')
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

  it('tiene tres ejercicios de clasificación con respuestas correctas', () => {
    const exercises = lessonExercises(lesson, bundle).filter(
      (exercise) => exercise.type === 'key-signature',
    )

    expect(exercises).toHaveLength(3)

    for (const exercise of exercises) {
      if (exercise.type !== 'key-signature') continue
      const expected = EXPECTED_EXERCISES.find((item) => item.key === exercise.key)
      expect(expected, `Falta la pregunta esperada: ${exercise.key}`).toBeDefined()
      expect(exercise.mode).toBe(expected!.mode)
      expect(exercise.choices).toContain(expected!.answer)
      expect(exercise.promptEs.length).toBeGreaterThan(5)
      expect(exercise.explanationEs).toContain(expected!.phrase)
    }
  })
})
