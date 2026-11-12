import { beforeAll, describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { exerciseChoices } from '../src/content/localize'
import { validateContentBundle } from '../src/content/validate'
import { resolveExerciseAnswer } from '../src/exercises/answer'
import {
  fromSpelledPitch,
  intervalBetween,
  midiOf,
  type Interval,
} from '../src/theory'
import type {
  ContentBundle,
  Exercise,
  Lesson,
  Score,
} from '../src/schemas'

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

function earExercises(
  lesson: Lesson,
  bundle: ContentBundle,
): Extract<Exercise, { type: 'ear-interval' }>[] {
  return lessonExercises(lesson, bundle).filter(
    (exercise): exercise is Extract<Exercise, { type: 'ear-interval' }> =>
      exercise.type === 'ear-interval',
  )
}

function intervalExpectedName(interval: Interval): { es: string; en: string } {
  return {
    es: `${interval.nameEs.charAt(0).toUpperCase()}${interval.nameEs.slice(1)}`,
    en: `${interval.nameEn.charAt(0).toUpperCase()}${interval.nameEn.slice(1)}`,
  }
}

let bundle: ContentBundle
let lesson: Lesson

beforeAll(async () => {
  const result = validateContentBundle(await loadContentFromDisk())
  expect(result.ok).toBe(true)
  if (!result.bundle) throw new Error('El contenido del repositorio no es válido')
  bundle = result.bundle
  const found = bundle.lessons.find((item) => item.id === 'lesson.m3-05')
  if (!found) throw new Error('Falta la lección M3-05')
  lesson = found
})

describe('M3-05 — Intervalos de oído', () => {
  it('está publicada, validada y depende de M3-04', () => {
    expect(lesson.moduleId).toBe('M3')
    expect(lesson.status).toBe('published')
    expect(lesson.prerequisites).toContain('lesson.m3-04')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
    expect(lesson.skillIds).toContain('skill.ear-interval')
  })

  it('explica los modos de escucha y la referencia auditiva', () => {
    const text = lesson.sections
      .map((section) => `${section.titleEs} ${section.bodyEs ?? ''}`)
      .join(' ')
      .toLowerCase()

    for (const term of [
      'ascendente',
      'descendente',
      'armónico',
      'escuchar',
      'intervalo',
      'tercera mayor',
    ]) {
      expect(text, `Falta el concepto: ${term}`).toContain(term)
    }
  })

  it('incluye la demo de la referencia con la tercera mayor', () => {
    const scores = scoreSections(lesson)
    expect(scores).toHaveLength(1)

    const demo = scores[0]
    if (!demo) throw new Error('Falta la demo de M3-05')

    expect(demo.events).toHaveLength(2)
    expect(demo.events.every((event) => event.pitches.length === 1)).toBe(true)

    const midis = demo.events
      .map((event) => midiOf(fromSpelledPitch(event.pitches[0])))
      .sort((first, second) => first - second)
    expect(midis).toEqual([60, 64])
  })

  it('plantea doce ejercicios de oído con dificultad progresiva', () => {
    const exercises = earExercises(lesson, bundle)
    expect(exercises).toHaveLength(12)
    expect(new Set(exercises.map((exercise) => exercise.id)).size).toBe(12)

    const difficulties = exercises.map((exercise) => exercise.difficulty).sort(
      (first, second) => first - second,
    )
    expect(difficulties).toEqual([1, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3])
  })

  it('entrena ascendente, descendente y armónico con respuestas correctas', () => {
    const exercises = earExercises(lesson, bundle)
    let ascending = 0
    let descending = 0
    let harmonic = 0

    for (const exercise of exercises) {
      const interval = intervalBetween(
        fromSpelledPitch(exercise.lower),
        fromSpelledPitch(exercise.upper),
      )
      const expected = intervalExpectedName(interval)

      const spanish = resolveExerciseAnswer(exercise, 'es')
      const english = resolveExerciseAnswer(exercise, 'en')
      expect(spanish.mode, `${exercise.id} modo ES`).toBe('choice')
      expect(english.mode, `${exercise.id} modo EN`).toBe('choice')
      if (spanish.mode !== 'choice' || english.mode !== 'choice') {
        throw new Error(`${exercise.id} debería responder con opciones`)
      }
      expect(spanish.answer, `${exercise.id} respuesta ES`).toBe(expected.es)
      expect(english.answer, `${exercise.id} respuesta EN`).toBe(expected.en)

      const choicesEs = exerciseChoices(exercise, 'es')
      const choicesEn = exerciseChoices(exercise, 'en')
      expect(choicesEs, `${exercise.id} sin opciones`).toContain(expected.es)
      expect(choicesEn, `${exercise.id} sin opciones EN`).toContain(expected.en)

      const directionEs =
        exercise.direction === 'ascending'
          ? 'ascendente'
          : exercise.direction === 'descending'
            ? 'descendente'
            : 'armónico'
      const directionEn =
        exercise.direction === 'ascending'
          ? 'ascending'
          : exercise.direction === 'descending'
            ? 'descending'
            : 'harmonic'
      expect(exercise.promptEs.toLowerCase(), `${exercise.id} prompt ES`).toContain(
        directionEs,
      )
      expect(exercise.promptEn?.toLowerCase() ?? '', `${exercise.id} prompt EN`).toContain(
        directionEn,
      )
      expect(exercise.explanationEn?.trim(), `${exercise.id} explanation EN`).toBeTruthy()
      expect(exercise.promptEn?.trim(), `${exercise.id} prompt EN`).toBeTruthy()
      expect(exercise.explanationEs?.trim(), `${exercise.id} explanation ES`).toBeTruthy()

      if (exercise.direction === 'ascending') ascending += 1
      if (exercise.direction === 'descending') descending += 1
      if (exercise.direction === 'harmonic') harmonic += 1
    }

    expect(ascending).toBeGreaterThan(0)
    expect(descending).toBeGreaterThan(0)
    expect(harmonic).toBeGreaterThan(0)
  });

  it('incluye una tarea real de teclado que toca las referencias auditivas', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.tempoBpm).toBe(60)
    expect(task?.keys.length).toBeGreaterThanOrEqual(2)
    expect(task?.checklistEs.length).toBeGreaterThanOrEqual(3)
    expect(task?.checklistEn).toHaveLength(task?.checklistEs.length ?? 0)
    expect(task?.demoScore?.events.length).toBeGreaterThanOrEqual(2)
  });
});
