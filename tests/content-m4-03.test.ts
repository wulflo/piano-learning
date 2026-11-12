import { beforeAll, describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { exerciseChoices } from '../src/content/localize'
import { validateContentBundle } from '../src/content/validate'
import { resolveExerciseAnswer } from '../src/exercises/answer'
import {
  CHORD_INVERSION_LABELS,
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
  const found = bundle.lessons.find((item) => item.id === 'lesson.m4-03')
  if (!found) throw new Error('Falta la lección M4-03')
  lesson = found
})

describe('M4-03 — Inversiones y voicings básicos', () => {
  it('está publicada, validada y depende de M4-02', () => {
    expect(lesson.moduleId).toBe('M4')
    expect(lesson.status).toBe('published')
    expect(lesson.prerequisites).toContain('lesson.m4-02')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
    expect(lesson.skillIds).toContain('skill.chord-inversion')
  })

  it('explica el bajo real, las inversiones, el cifrado y los voicings', () => {
    const text = lesson.sections
      .map((section) => `${section.titleEs} ${section.bodyEs ?? ''}`)
      .join(' ')
      .toLowerCase()

    for (const term of [
      'bajo real',
      'estado fundamental',
      'primera inversión',
      'segunda inversión',
      'cifrado slash',
      'voicing cercano',
      'abierto',
      'octava',
    ]) {
      expect(text, `Falta el concepto: ${term}`).toContain(term)
    }
  })

  it('incluye una demo con las tres inversiones y un voicing abierto', () => {
    const scores = scoreSections(lesson)
    expect(scores).toHaveLength(1)

    const demo = scores[0]
    if (!demo) throw new Error('Falta la demo de M4-03')

    expect(demo.events).toHaveLength(4)
    expect(demo.events.map((event) => event.measure)).toEqual([1, 2, 3, 4])
    expect(eventMidis(demo)).toEqual([
      [60, 64, 67],
      [64, 67, 72],
      [67, 72, 76],
      [60, 67, 76],
    ])
  })

  it('plantea doce ejercicios con las doce tónicas y las tres posiciones', () => {
    const exercises = chordExercises(lesson, bundle)
    expect(exercises).toHaveLength(12)
    expect(new Set(exercises.map((exercise) => exercise.id)).size).toBe(12)

    const expected = new Map<
      string,
      { quality: 'major' | 'minor'; inversion: number }
    >([
      ['C', { quality: 'major', inversion: 0 }],
      ['E', { quality: 'minor', inversion: 0 }],
      ['F#', { quality: 'major', inversion: 0 }],
      ['A', { quality: 'minor', inversion: 0 }],
      ['C#', { quality: 'minor', inversion: 1 }],
      ['Eb', { quality: 'major', inversion: 1 }],
      ['G', { quality: 'major', inversion: 1 }],
      ['Bb', { quality: 'major', inversion: 1 }],
      ['D', { quality: 'minor', inversion: 2 }],
      ['F', { quality: 'major', inversion: 2 }],
      ['Ab', { quality: 'major', inversion: 2 }],
      ['B', { quality: 'minor', inversion: 2 }],
    ])
    expect(exercises.map(rootSymbol).sort()).toEqual([...expected.keys()].sort())

    const counts = [0, 0, 0]
    for (const exercise of exercises) {
      const target = expected.get(rootSymbol(exercise))
      expect(exercise.quality, exercise.id).toBe(target?.quality)
      expect(exercise.inversion, exercise.id).toBe(target?.inversion)
      expect(exercise.ask, exercise.id).toBe('inversion')
      counts[exercise.inversion] = (counts[exercise.inversion] ?? 0) + 1
    }
    expect(counts).toEqual([4, 4, 4])

    const difficulties = exercises
      .map((exercise) => exercise.difficulty)
      .sort((first, second) => first - second)
    expect(difficulties).toEqual([1, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3])

    for (const exercise of exercises) {
      // El enunciado da las notas desde el bajo, pero no nombra la inversión.
      const pitches = chordWithInversion(
        fromSpelledPitch(exercise.root),
        exercise.quality,
        exercise.inversion,
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
        /estado fundamental|primera inversión|segunda inversión/i,
      )
      expect(exercise.promptEn, `${exercise.id} prompt EN`).not.toMatch(
        /root position|first inversion|second inversion/i,
      )

      const spanish = resolveExerciseAnswer(exercise, 'es')
      const english = resolveExerciseAnswer(exercise, 'en')
      expect(spanish.mode, `${exercise.id} modo ES`).toBe('choice')
      expect(english.mode, `${exercise.id} modo EN`).toBe('choice')
      if (spanish.mode !== 'choice' || english.mode !== 'choice') {
        throw new Error(`${exercise.id} debería responder con opciones`)
      }
      expect(spanish.answer, `${exercise.id} respuesta ES`).toBe(
        CHORD_INVERSION_LABELS.es[exercise.inversion],
      )
      expect(english.answer, `${exercise.id} respuesta EN`).toBe(
        CHORD_INVERSION_LABELS.en[exercise.inversion],
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

  it('incluye una tarea de teclado con las inversiones y el voicing abierto', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.tempoBpm).toBe(60)
    expect(task?.checklistEs.length).toBeGreaterThanOrEqual(3)
    expect(task?.checklistEn).toHaveLength(task?.checklistEs.length ?? 0)
    expect(task?.instructionsEs).toMatch(/inversión/i)
    expect(task?.instructionsEs).toMatch(/abierto/i)

    const keyMidis = (task?.keys ?? []).map((pitch) =>
      midiOf(fromSpelledPitch(pitch)),
    )
    expect([...new Set(keyMidis)].sort((first, second) => first - second)).toEqual(
      [60, 64, 67, 72, 76],
    )

    const demo = task?.demoScore
    if (!demo) throw new Error('Falta la demo de la tarea de M4-03')
    expect(eventMidis(demo)).toEqual([
      [60, 64, 67],
      [64, 67, 72],
      [67, 72, 76],
      [60, 67, 76],
    ])
  })
})
