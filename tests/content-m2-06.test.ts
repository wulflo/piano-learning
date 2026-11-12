import { beforeAll, describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { validateContentBundle } from '../src/content/validate'
import { type ContentBundle, type Exercise, type Lesson } from '../src/schemas'

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
  const found = bundle.lessons.find((item) => item.id === 'lesson.m2-06')
  if (!found) throw new Error('Falta la lección M2-06')
  lesson = found
})

describe('M2-06 — Menor melódica', () => {
  it('está publicada, validada y depende de M2-05', () => {
    expect(lesson.moduleId).toBe('M2')
    expect(lesson.status).toBe('published')
    expect(lesson.prerequisites).toContain('lesson.m2-05')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
    expect(lesson.skillIds).toContain('skill.major-scale')
  })

  it('explica el menor melódico, las doce tonalidades y el patrón', () => {
    const text = lesson.sections
      .map((section) => `${section.titleEs} ${section.bodyEs ?? ''}`)
      .join(' ')
      .toLowerCase()

    expect(text).toContain('menor')
    expect(text).toContain('melod')
    expect(text).toContain('ascendente')
    expect(text).toContain('descendente')
    expect(text).toContain('séptimo')
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

  it('tiene un ejercicio de deletreo de la menor melódica', () => {
    const spellingExercises = lessonExercises(lesson, bundle).filter(
      (exercise) => exercise.type === 'scale-spelling',
    )

    expect(spellingExercises).toHaveLength(1)
    const exercise = spellingExercises[0]
    if (exercise.type !== 'scale-spelling') return
    expect(exercise.tonic).toBe('C')
    expect(exercise.mode).toBe('melodic-minor')
    expect(exercise.choices).toContain('C D Eb F G Ab B C')
  })

  it('tiene un ejercicio de audio sobre el séptimo grado melódico', () => {
    const soundExercises = lessonExercises(lesson, bundle).filter(
      (exercise) => exercise.type === 'sound-parameter',
    )

    expect(soundExercises).toHaveLength(1)
    const exercise = soundExercises[0]
    if (exercise.type !== 'sound-parameter') return
    expect(exercise.parameter).toBe('pitch')
    expect(exercise.exampleA.midi).toBe(70)
    expect(exercise.exampleB.midi).toBe(71)
    expect(exercise.choices).toContain('La altura (un semitono)')
  })
})
