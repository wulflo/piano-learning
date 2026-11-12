import { beforeAll, describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { exerciseChoices } from '../src/content/localize'
import { validateContentBundle } from '../src/content/validate'
import {
  isExerciseAnswerCorrect,
  resolveExerciseAnswer,
} from '../src/exercises/answer'
import {
  CHORD_DEFINITIONS,
  chordWithInversion,
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
  const found = bundle.lessons.find((item) => item.id === 'lesson.m4-04')
  if (!found) throw new Error('Falta la lección M4-04')
  lesson = found
})

describe('M4-04 — Séptimas: maj7, 7, m7, m7♭5 y dim7', () => {
  it('está publicada, validada y depende de M4-03', () => {
    expect(lesson.moduleId).toBe('M4')
    expect(lesson.status).toBe('published')
    expect(lesson.prerequisites).toContain('lesson.m4-03')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
    expect(lesson.skillIds).toContain('skill.chord-seventh')
  })

  it('explica las cinco fórmulas, el cifrado y el uso de cada calidad', () => {
    const text = lesson.sections
      .map((section) => `${section.titleEs} ${section.bodyEs ?? ''}`)
      .join(' ')
      .toLowerCase()

    for (const term of [
      'séptima mayor',
      'séptima de dominante',
      'séptima menor',
      'séptima semidisminuida',
      'séptima disminuida',
      '1-3-5-7',
      '1-3-5-♭7',
      '1-♭3-5-♭7',
      '1-♭3-♭5-♭7',
      '1-♭3-♭5-♭♭7',
      'cifrado',
      'resolver',
    ]) {
      expect(text, `Falta el concepto: ${term}`).toContain(term)
    }
  })

  it('incluye una demo con las cinco séptimas sobre Do', () => {
    const scores = scoreSections(lesson)
    expect(scores).toHaveLength(1)

    const demo = scores[0]
    if (!demo) throw new Error('Falta la demo de M4-04')

    expect(demo.events).toHaveLength(5)
    expect(demo.events.map((event) => event.measure)).toEqual([1, 2, 3, 4, 5])
    expect(eventMidis(demo)).toEqual([
      [60, 64, 67, 71],
      [60, 64, 67, 70],
      [60, 63, 67, 70],
      [60, 63, 66, 70],
      [60, 63, 66, 69],
    ])
  })

  it('plantea doce ejercicios con las doce tónicas y las cinco calidades', () => {
    const exercises = chordExercises(lesson, bundle)
    expect(exercises).toHaveLength(12)
    expect(new Set(exercises.map((exercise) => exercise.id)).size).toBe(12)

    const expected = new Map<
      string,
      { quality: string; ask: 'quality' | 'notes' }
    >([
      ['C', { quality: 'major7', ask: 'quality' }],
      ['D', { quality: 'dominant7', ask: 'quality' }],
      ['E', { quality: 'minor7', ask: 'quality' }],
      ['F#', { quality: 'half-diminished7', ask: 'quality' }],
      ['C#', { quality: 'diminished7', ask: 'quality' }],
      ['Ab', { quality: 'major7', ask: 'quality' }],
      ['Eb', { quality: 'dominant7', ask: 'notes' }],
      ['F', { quality: 'major7', ask: 'notes' }],
      ['G', { quality: 'minor7', ask: 'notes' }],
      ['A', { quality: 'half-diminished7', ask: 'notes' }],
      ['Bb', { quality: 'dominant7', ask: 'notes' }],
      ['B', { quality: 'diminished7', ask: 'notes' }],
    ])
    expect(exercises.map(rootSymbol).sort()).toEqual([...expected.keys()].sort())

    const qualityCounts = new Map<string, number>()
    for (const exercise of exercises) {
      const target = expected.get(rootSymbol(exercise))
      expect(exercise.quality, exercise.id).toBe(target?.quality)
      expect(exercise.ask, exercise.id).toBe(target?.ask)
      expect(exercise.inversion, exercise.id).toBe(0)
      qualityCounts.set(
        exercise.quality,
        (qualityCounts.get(exercise.quality) ?? 0) + 1,
      )
    }
    expect(Object.fromEntries(qualityCounts)).toEqual({
      major7: 3,
      dominant7: 3,
      minor7: 2,
      'half-diminished7': 2,
      diminished7: 2,
    })

    const difficulties = exercises
      .map((exercise) => exercise.difficulty)
      .sort((first, second) => first - second)
    expect(difficulties).toEqual([1, 2, 2, 3, 3, 3, 3, 3, 3, 3, 4, 4])

    for (const exercise of exercises) {
      const pitches = chordWithInversion(
        fromSpelledPitch(exercise.root),
        exercise.quality,
        exercise.inversion,
      )
      const namesEs = pitches.map((pitch) => formatPitchEs(pitch))
      const namesEn = pitches.map((pitch) => formatPitch(pitch).replace(/\d+$/, ''))

      if (exercise.ask === 'quality') {
        // El enunciado da las notas, pero no la calidad que se pregunta.
        for (const name of namesEs) {
          expect(exercise.promptEs, `${exercise.id} prompt ES`).toContain(name)
        }
        for (const name of namesEn) {
          expect(exercise.promptEn, `${exercise.id} prompt EN`).toContain(name)
        }
        expect(exercise.promptEs, `${exercise.id} prompt ES`).not.toMatch(
          /séptima (mayor|de dominante|menor|semidisminuida|disminuida)/i,
        )
        expect(exercise.promptEn, `${exercise.id} prompt EN`).not.toMatch(
          /major seventh|dominant seventh|minor seventh|half-diminished seventh|diminished seventh/i,
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
      } else {
        // El enunciado da el cifrado y pide escribir las notas.
        expect(exercise.promptEs, `${exercise.id} prompt ES`).toContain(
          CHORD_DEFINITIONS[exercise.quality].nameEs,
        )
        expect(exercise.promptEn, `${exercise.id} prompt EN`).toContain(
          CHORD_DEFINITIONS[exercise.quality].nameEn,
        )
        expect(exerciseChoices(exercise, 'es'), exercise.id).toBeUndefined()

        const answerEs = namesEs.join(' ')
        const answerEn = namesEn.join(' ')
        const resolved = resolveExerciseAnswer(exercise, 'es')
        expect(resolved.mode, `${exercise.id} modo`).toBe('text')
        if (resolved.mode === 'practice') {
          throw new Error(`${exercise.id} no debería ser práctica`)
        }
        expect(resolved.answer, `${exercise.id} respuesta`).toBe(answerEs)
        expect(isExerciseAnswerCorrect(exercise, answerEs), exercise.id).toBe(true)
        expect(isExerciseAnswerCorrect(exercise, answerEn), exercise.id).toBe(true)
      }
    }
  })

  it('incluye una tarea de teclado con las cinco calidades', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.tempoBpm).toBe(60)
    expect(task?.checklistEs.length).toBeGreaterThanOrEqual(3)
    expect(task?.checklistEn).toHaveLength(task?.checklistEs.length ?? 0)
    expect(task?.instructionsEs).toMatch(/cinco calidades/i)
    expect(task?.instructionsEs).toMatch(/séptima/i)

    const keyMidis = (task?.keys ?? []).map((pitch) =>
      midiOf(fromSpelledPitch(pitch)),
    )
    expect([...new Set(keyMidis)].sort((first, second) => first - second)).toEqual(
      [60, 63, 64, 66, 67, 69, 70, 71],
    )

    const demo = task?.demoScore
    if (!demo) throw new Error('Falta la demo de la tarea de M4-04')
    expect(eventMidis(demo)).toEqual([
      [60, 64, 67, 71],
      [60, 64, 67, 70],
      [60, 63, 67, 70],
      [60, 63, 66, 70],
      [60, 63, 66, 69],
    ])
  })
})
