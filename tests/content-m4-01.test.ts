import { beforeAll, describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { exerciseChoices } from '../src/content/localize'
import { validateContentBundle } from '../src/content/validate'
import { resolveExerciseAnswer } from '../src/exercises/answer'
import { fromSpelledPitch, midiOf } from '../src/theory'
import type { ContentBundle, Exercise, Lesson, Score } from '../src/schemas'

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

function chordExercises(
  lesson: Lesson,
  bundle: ContentBundle,
): Extract<Exercise, { type: 'chord' }>[] {
  return lessonExercises(lesson, bundle).filter(
    (exercise): exercise is Extract<Exercise, { type: 'chord' }> =>
      exercise.type === 'chord',
  )
}

function rootSymbol(exercise: Extract<Exercise, { type: 'chord' }>): string {
  return `${exercise.root.step}${exercise.root.accidental}`
}

let bundle: ContentBundle
let lesson: Lesson

beforeAll(async () => {
  const result = validateContentBundle(await loadContentFromDisk())
  expect(result.ok).toBe(true)
  if (!result.bundle) throw new Error('El contenido del repositorio no es válido')
  bundle = result.bundle
  const found = bundle.lessons.find((item) => item.id === 'lesson.m4-01')
  if (!found) throw new Error('Falta la lección M4-01')
  lesson = found
})

describe('M4-01 — Tríadas mayores y menores', () => {
  it('está publicada, validada y depende de M3-05', () => {
    expect(lesson.moduleId).toBe('M4')
    expect(lesson.status).toBe('published')
    expect(lesson.prerequisites).toContain('lesson.m3-05')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
    expect(lesson.skillIds).toContain('skill.chord-quality')
  })

  it('explica la construcción 1-3-5 y la calidad por la tercera', () => {
    const text = lesson.sections
      .map((section) => `${section.titleEs} ${section.bodyEs ?? ''}`)
      .join(' ')
      .toLowerCase()

    for (const term of [
      'tríada',
      'regla 1-3-5',
      'tercera',
      'mayor',
      'menor',
      'construcción',
    ]) {
      expect(text, `Falta el concepto: ${term}`).toContain(term)
    }
  })

  it('incluye la demo en bloque y en arpegio de la tríada mayor y menor', () => {
    const scores = scoreSections(lesson)
    expect(scores).toHaveLength(1)

    const demo = scores[0]
    if (!demo) throw new Error('Falta la demo de M4-01')

    expect(demo.events).toHaveLength(8)
    const midis = demo.events.map((event) =>
      event.pitches
        .map((pitch) => midiOf(fromSpelledPitch(pitch)))
        .sort((first, second) => first - second),
    )

    expect(midis.slice(0, 2)).toEqual([
      [60, 64, 67],
      [60, 63, 67],
    ])
    expect(midis.slice(2, 5)).toEqual([[60], [64], [67]])
    expect(midis.slice(5)).toEqual([[60], [63], [67]])

    expect(demo.events.slice(2).every((event) => event.measure >= 3)).toBe(true)
    expect(demo.events.slice(2).map((event) => event.beat)).toEqual([
      0, 1, 2, 0, 1, 2,
    ])
  })

  it('plantea doce ejercicios con las doce tónicas y ambas calidades', () => {
    const exercises = chordExercises(lesson, bundle)
    expect(exercises).toHaveLength(12)
    expect(new Set(exercises.map((exercise) => exercise.id)).size).toBe(12)

    const expected = new Map([
      ['C', 'major'],
      ['C#', 'minor'],
      ['D', 'major'],
      ['Eb', 'minor'],
      ['E', 'major'],
      ['F', 'minor'],
      ['F#', 'major'],
      ['G', 'minor'],
      ['Ab', 'major'],
      ['A', 'minor'],
      ['Bb', 'major'],
      ['B', 'minor'],
    ])
    expect(exercises.map(rootSymbol).sort()).toEqual([...expected.keys()].sort())
    expect(new Set(exercises.map((exercise) => exercise.quality))).toEqual(
      new Set(['major', 'minor']),
    )

    const difficulties = exercises
      .map((exercise) => exercise.difficulty)
      .sort((first, second) => first - second)
    expect(difficulties).toEqual([1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3])

    for (const exercise of exercises) {
      expect(exercise.quality, exercise.id).toBe(expected.get(rootSymbol(exercise)))
      expect(exercise.inversion, exercise.id).toBe(0)

      // El enunciado no debe regalar la calidad que se pregunta.
      expect(exercise.promptEs, `${exercise.id} prompt ES`).not.toMatch(
        /mayor|menor/i,
      )
      expect(exercise.promptEn, `${exercise.id} prompt EN`).not.toMatch(
        /major|minor/i,
      )

      const spanish = resolveExerciseAnswer(exercise, 'es')
      const english = resolveExerciseAnswer(exercise, 'en')
      expect(spanish.mode, `${exercise.id} modo ES`).toBe('choice')
      expect(english.mode, `${exercise.id} modo EN`).toBe('choice')
      if (spanish.mode !== 'choice' || english.mode !== 'choice') {
        throw new Error(`${exercise.id} debería responder con opciones`)
      }
      expect(spanish.answer, `${exercise.id} respuesta ES`).toBe(
        exercise.quality === 'major' ? 'mayor' : 'menor',
      )
      expect(english.answer, `${exercise.id} respuesta EN`).toBe(exercise.quality)

      const choicesEs = exerciseChoices(exercise, 'es')
      const choicesEn = exerciseChoices(exercise, 'en')
      expect(choicesEs, `${exercise.id} sin opciones`).toBeDefined()
      expect(choicesEn, `${exercise.id} sin opciones EN`).toBeDefined()
      expect(choicesEs ?? [], `${exercise.id} sin opciones`).toContain(
        spanish.answer,
      )
      expect(choicesEn ?? [], `${exercise.id} sin opciones EN`).toContain(
        english.answer,
      )
      expect(choicesEn ?? []).toHaveLength((choicesEs ?? []).length)
    }
  })

  it('incluye una tarea real de teclado que toca la tríada', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.tempoBpm).toBe(60)
    expect(task?.keys.length).toBeGreaterThanOrEqual(3)
    expect(task?.checklistEs.length).toBeGreaterThanOrEqual(3)
    expect(task?.checklistEn).toHaveLength(task?.checklistEs.length ?? 0)
    expect(task?.demoScore?.events.length).toBeGreaterThanOrEqual(1)
    expect(task?.instructionsEs).toMatch(/arpegio/i)
    expect(task?.instructionsEs).toMatch(/bloque/i)
  })
})
