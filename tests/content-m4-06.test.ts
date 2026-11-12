import { beforeAll, describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { exerciseChoices } from '../src/content/localize'
import { validateContentBundle } from '../src/content/validate'
import {
  isExerciseAnswerCorrect,
  resolveExerciseAnswer,
} from '../src/exercises/answer'
import {
  chordSymbol,
  chordWithSlash,
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

function pitchSymbol(
  pitch: { step: string; accidental: string } | undefined,
): string {
  if (!pitch) return ''
  return `${pitch.step}${pitch.accidental}`
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
  const found = bundle.lessons.find((item) => item.id === 'lesson.m4-06')
  if (!found) throw new Error('Falta la lección M4-06')
  lesson = found
})

describe('M4-06 — Slash chords', () => {
  it('está publicada, validada y depende de M4-05', () => {
    expect(lesson.moduleId).toBe('M4')
    expect(lesson.status).toBe('published')
    expect(lesson.prerequisites).toContain('lesson.m4-05')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
    expect(lesson.skillIds).toContain('skill.chord-slash')
  })

  it('explica la barra, el bajo, las inversiones, los híbridos y el cifrado', () => {
    const text = lesson.sections
      .map((section) => `${section.titleEs} ${section.bodyEs ?? ''}`)
      .join(' ')
      .toLowerCase()

    for (const term of [
      'slash',
      'barra',
      'bajo',
      'inversión',
      'híbrido',
      'do/mi',
      'do/sol',
      'do/re',
      'do/si',
      'c/e',
      'c/g',
      'c/d',
      'c/b',
      'primera inversión',
      'segunda inversión',
      'cifrado',
    ]) {
      expect(text, `Falta el concepto: ${term}`).toContain(term)
    }
  })

  it('incluye una demo con cuatro slash chords sobre Do', () => {
    const scores = scoreSections(lesson)
    expect(scores).toHaveLength(1)

    const demo = scores[0]
    if (!demo) throw new Error('Falta la demo de M4-06')

    expect(demo.events).toHaveLength(4)
    expect(demo.events.map((event) => event.measure)).toEqual([1, 2, 3, 4])
    expect(eventMidis(demo)).toEqual([
      [64, 67, 72],
      [55, 60, 64],
      [50, 60, 64, 67],
      [59, 60, 64, 67],
    ])
  })

  it('plantea doce ejercicios de leer el cifrado y escribir las notas', () => {
    const exercises = chordExercises(lesson, bundle)
    expect(exercises).toHaveLength(12)
    expect(new Set(exercises.map((exercise) => exercise.id)).size).toBe(12)

    const expected = [
      ['ex.m4-06.a', 'C', 'major', 'E', 'symbol'],
      ['ex.m4-06.b', 'C', 'major', 'G', 'symbol'],
      ['ex.m4-06.c', 'C', 'major', 'D', 'symbol'],
      ['ex.m4-06.d', 'C', 'major', 'B', 'symbol'],
      ['ex.m4-06.e', 'F', 'major', 'A', 'symbol'],
      ['ex.m4-06.f', 'G', 'major', 'B', 'symbol'],
      ['ex.m4-06.g', 'D', 'major', 'F#', 'notes'],
      ['ex.m4-06.h', 'A', 'minor', 'G', 'notes'],
      ['ex.m4-06.i', 'Bb', 'major', 'D', 'notes'],
      ['ex.m4-06.j', 'F', 'major', 'C', 'notes'],
      ['ex.m4-06.k', 'G', 'major', 'D', 'notes'],
      ['ex.m4-06.l', 'A', 'minor', 'E', 'notes'],
    ] as const

    const qualityCounts = new Map<string, number>()
    const askCounts = new Map<string, number>()
    for (const [index, exercise] of exercises.entries()) {
      const target = expected[index]
      expect(target, `Falta el ejercicio ${index}`).toBeDefined()
      if (!target) throw new Error(`Falta el ejercicio ${index}`)
      expect(exercise.id, target[0]).toBe(target[0])
      expect(pitchSymbol(exercise.root), exercise.id).toBe(target[1])
      expect(exercise.quality, exercise.id).toBe(target[2])
      expect(pitchSymbol(exercise.slash), exercise.id).toBe(target[3])
      expect(exercise.ask, exercise.id).toBe(target[4])
      qualityCounts.set(
        exercise.quality,
        (qualityCounts.get(exercise.quality) ?? 0) + 1,
      )
      askCounts.set(exercise.ask, (askCounts.get(exercise.ask) ?? 0) + 1)
    }
    expect(Object.fromEntries(qualityCounts)).toEqual({
      major: 10,
      minor: 2,
    })
    expect(Object.fromEntries(askCounts)).toEqual({
      symbol: 6,
      notes: 6,
    })

    const difficulties = exercises
      .map((exercise) => exercise.difficulty)
      .sort((first, second) => first - second)
    expect(difficulties).toEqual([1, 1, 2, 2, 3, 3, 3, 3, 3, 3, 3, 4])

    for (const exercise of exercises) {
      const root = fromSpelledPitch(exercise.root)
      const slash = exercise.slash
        ? fromSpelledPitch(exercise.slash)
        : undefined
      const pitches = chordWithSlash(root, exercise.quality, slash!)
      const namesEs = pitches.map((pitch) => formatPitchEs(pitch))
      const namesEn = pitches.map((pitch) =>
        formatPitch(pitch).replace(/\d+$/, ''),
      )

      if (exercise.ask === 'symbol') {
        expect(exerciseChoices(exercise, 'es'), exercise.id).toBeDefined()
        for (const name of namesEs) {
          expect(exercise.promptEs, `${exercise.id} prompt ES`).toContain(name)
        }
        for (const name of namesEn) {
          expect(exercise.promptEn, `${exercise.id} prompt EN`).toContain(name)
        }

        const doSymbol = chordSymbol(root, exercise.quality, {
          notation: 'do',
          slash,
        })
        const cSymbol = chordSymbol(root, exercise.quality, {
          notation: 'c',
          slash,
        })
        expect(exercise.promptEs, `${exercise.id} prompt ES`).not.toContain(
          doSymbol,
        )
        expect(exercise.promptEn, `${exercise.id} prompt EN`).not.toContain(
          cSymbol,
        )

        const spanish = resolveExerciseAnswer(exercise, 'es')
        const english = resolveExerciseAnswer(exercise, 'en')
        expect(spanish.mode, `${exercise.id} modo ES`).toBe('choice')
        expect(english.mode, `${exercise.id} modo EN`).toBe('choice')
        if (spanish.mode !== 'choice' || english.mode !== 'choice') {
          throw new Error(`${exercise.id} debería responder con opciones`)
        }
        expect(spanish.answer, `${exercise.id} respuesta ES`).toBe(doSymbol)
        expect(english.answer, `${exercise.id} respuesta EN`).toBe(cSymbol)

        const choicesEs = exerciseChoices(exercise, 'es') ?? []
        const choicesEn = exerciseChoices(exercise, 'en') ?? []
        expect(choicesEs, `${exercise.id} sin opciones`).toContain(doSymbol)
        expect(choicesEn, `${exercise.id} sin opciones EN`).toContain(cSymbol)
        expect(choicesEn).toHaveLength(choicesEs.length)
      } else {
        const doSymbol = chordSymbol(root, exercise.quality, {
          notation: 'do',
          slash,
        })
        expect(exercise.promptEs, `${exercise.id} prompt ES`).toContain(
          doSymbol,
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

  it('incluye una tarea de teclado con los cuatro slash chords', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.tempoBpm).toBe(60)
    expect(task?.checklistEs.length).toBeGreaterThanOrEqual(3)
    expect(task?.checklistEn).toHaveLength(task?.checklistEs.length ?? 0)
    expect(task?.instructionsEs).toMatch(/slash chords/i)
    expect(task?.instructionsEs).toMatch(/mano izquierda/i)

    const keyMidis = (task?.keys ?? []).map((pitch) =>
      midiOf(fromSpelledPitch(pitch)),
    )
    expect([...new Set(keyMidis)].sort((first, second) => first - second)).toEqual(
      [50, 55, 59, 60, 64, 67, 72],
    )

    const demo = task?.demoScore
    if (!demo) throw new Error('Falta la demo de la tarea de M4-06')
    expect(eventMidis(demo)).toEqual([
      [64, 67, 72],
      [55, 60, 64],
      [50, 60, 64, 67],
      [59, 60, 64, 67],
    ])
  })
})
