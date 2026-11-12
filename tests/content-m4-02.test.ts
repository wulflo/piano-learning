import { beforeAll, describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { exerciseChoices } from '../src/content/localize'
import { validateContentBundle } from '../src/content/validate'
import { resolveExerciseAnswer } from '../src/exercises/answer'
import {
  CHORD_DEFINITIONS,
  chordPitches,
  formatPitch,
  formatPitchEs,
  fromSpelledPitch,
  midiOf,
} from '../src/theory'
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

function eventMidis(score: Score): number[][] {
  return score.events.map((event) =>
    event.pitches
      .map((pitch) => midiOf(fromSpelledPitch(pitch)))
      .sort((first, second) => first - second),
  )
}

let bundle: ContentBundle
let lesson: Lesson

beforeAll(async () => {
  const result = validateContentBundle(await loadContentFromDisk())
  expect(result.ok).toBe(true)
  if (!result.bundle) throw new Error('El contenido del repositorio no es válido')
  bundle = result.bundle
  const found = bundle.lessons.find((item) => item.id === 'lesson.m4-02')
  if (!found) throw new Error('Falta la lección M4-02')
  lesson = found
})

describe('M4-02 — Tríadas disminuidas, aumentadas y sus', () => {
  it('está publicada, validada y depende de M4-01', () => {
    expect(lesson.moduleId).toBe('M4')
    expect(lesson.status).toBe('published')
    expect(lesson.prerequisites).toContain('lesson.m4-01')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
    expect(lesson.skillIds).toContain('skill.chord-quality')
  })

  it('explica las cuatro fórmulas y el contexto de cada calidad', () => {
    const text = lesson.sections
      .map((section) => `${section.titleEs} ${section.bodyEs ?? ''}`)
      .join(' ')
      .toLowerCase()

    for (const term of [
      '1-♭3-♭5',
      '1-3-♯5',
      '1-2-5',
      '1-4-5',
      'disminuida',
      'aumentada',
      'suspendida',
      'tercera',
      'tritono',
      'resuelve',
    ]) {
      expect(text, `Falta el concepto: ${term}`).toContain(term)
    }
  })

  it('incluye una demo con las cuatro calidades sobre Do', () => {
    const scores = scoreSections(lesson)
    expect(scores).toHaveLength(1)

    const demo = scores[0]
    if (!demo) throw new Error('Falta la demo de M4-02')

    expect(demo.events).toHaveLength(4)
    expect(demo.events.map((event) => event.measure)).toEqual([1, 2, 3, 4])
    expect(eventMidis(demo)).toEqual([
      [60, 63, 66],
      [60, 64, 68],
      [60, 62, 67],
      [60, 65, 67],
    ])
  })

  it('plantea doce ejercicios con las doce tónicas y las cuatro calidades', () => {
    const exercises = chordExercises(lesson, bundle)
    expect(exercises).toHaveLength(12)
    expect(new Set(exercises.map((exercise) => exercise.id)).size).toBe(12)

    const expected = new Map([
      ['C', 'diminished'],
      ['C#', 'sus2'],
      ['D', 'diminished'],
      ['Eb', 'augmented'],
      ['E', 'sus4'],
      ['F', 'sus2'],
      ['F#', 'diminished'],
      ['G', 'augmented'],
      ['Ab', 'sus4'],
      ['A', 'sus2'],
      ['Bb', 'augmented'],
      ['B', 'sus4'],
    ])
    expect(exercises.map(rootSymbol).sort()).toEqual([...expected.keys()].sort())

    const counts = new Map<string, number>()
    for (const exercise of exercises) {
      counts.set(exercise.quality, (counts.get(exercise.quality) ?? 0) + 1)
    }
    expect(Object.fromEntries(counts)).toEqual({
      diminished: 3,
      augmented: 3,
      sus2: 3,
      sus4: 3,
    })

    const difficulties = exercises
      .map((exercise) => exercise.difficulty)
      .sort((first, second) => first - second)
    expect(difficulties).toEqual([1, 1, 1, 2, 2, 2, 3, 3, 3, 3, 3, 3])

    for (const exercise of exercises) {
      expect(exercise.quality, exercise.id).toBe(expected.get(rootSymbol(exercise)))
      expect(exercise.inversion, exercise.id).toBe(0)

      // El enunciado nombra las notas del acorde, no la calidad que se pregunta.
      const pitches = chordPitches(
        fromSpelledPitch(exercise.root),
        exercise.quality,
      )
      const namesEs = pitches.map((pitch) => formatPitchEs(pitch))
      const namesEn = pitches.map((pitch) => formatPitch(pitch).replace(/\d+$/, ''))
      for (const name of namesEs) {
        expect(exercise.promptEs, `${exercise.id} prompt ES`).toContain(name)
      }
      for (const name of namesEn) {
        expect(exercise.promptEn, `${exercise.id} prompt EN`).toContain(name)
      }
      expect(exercise.promptEs, `${exercise.id} prompt ES`).not.toMatch(
        /disminuid|aumentad|suspendid/i,
      )
      expect(exercise.promptEn, `${exercise.id} prompt EN`).not.toMatch(
        /diminished|augmented|suspended/i,
      )

      const spanish = resolveExerciseAnswer(exercise, 'es')
      const english = resolveExerciseAnswer(exercise, 'en')
      expect(spanish.mode, `${exercise.id} modo ES`).toBe('choice')
      expect(english.mode, `${exercise.id} modo EN`).toBe('choice')
      if (spanish.mode !== 'choice' || english.mode !== 'choice') {
        throw new Error(`${exercise.id} debería responder con opciones`)
      }
      expect(spanish.answer, `${exercise.id} respuesta ES`).toBe(
        CHORD_DEFINITIONS[exercise.quality].nameEs,
      )
      expect(english.answer, `${exercise.id} respuesta EN`).toBe(
        CHORD_DEFINITIONS[exercise.quality].nameEn,
      )

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

  it('incluye una tarea de teclado que resuelve el suspendido 4 en mayor', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.tempoBpm).toBe(60)
    expect(task?.checklistEs.length).toBeGreaterThanOrEqual(3)
    expect(task?.checklistEn).toHaveLength(task?.checklistEs.length ?? 0)
    expect(task?.instructionsEs).toMatch(/suspendido 4/i)
    expect(task?.instructionsEs).toMatch(/mayor/i)

    const keyMidis = (task?.keys ?? []).map((pitch) =>
      midiOf(fromSpelledPitch(pitch)),
    )
    expect([...new Set(keyMidis)].sort((first, second) => first - second)).toEqual(
      [60, 64, 65, 67],
    )

    const demo = task?.demoScore
    if (!demo) throw new Error('Falta la demo de la tarea de M4-02')
    expect(eventMidis(demo)).toEqual([
      [60, 65, 67],
      [60, 64, 67],
    ])
  })
})
