import { beforeAll, describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { exerciseChoices } from '../src/content/localize'
import { validateContentBundle } from '../src/content/validate'
import {
  isExerciseAnswerCorrect,
  resolveExerciseAnswer,
} from '../src/exercises/answer'
import {
  convertChordNotation,
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

function chordNotationExercises(
  lesson: Lesson,
  bundle: ContentBundle,
): Extract<Exercise, { type: 'chord-notation' }>[] {
  return lessonExercises(lesson, bundle).filter(
    (exercise): exercise is Extract<Exercise, { type: 'chord-notation' }> =>
      exercise.type === 'chord-notation',
  )
}

function eventMidis(score: Score): number[][] {
  return score.events.map((event) =>
    event.pitches.map((pitch) => midiOf(fromSpelledPitch(pitch))),
  )
}

let bundle: ContentBundle
let lesson: Lesson

beforeAll(async () => {
  const result = validateContentBundle(await loadContentFromDisk())
  expect(result.ok).toBe(true)
  if (!result.bundle) throw new Error('El contenido del repositorio no es válido')
  bundle = result.bundle
  const found = bundle.lessons.find((item) => item.id === 'lesson.m4-07')
  if (!found) throw new Error('Falta la lección M4-07')
  lesson = found
})

describe('M4-07 — Cifrado latino y americano', () => {
  it('está publicada, validada y depende de M4-06', () => {
    expect(lesson.moduleId).toBe('M4')
    expect(lesson.status).toBe('published')
    expect(lesson.prerequisites).toContain('lesson.m4-06')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
    expect(lesson.skillIds).toContain('skill.chord-notation')
  })

  it('explica la tabla completa y la conversión bidireccional', () => {
    const text = lesson.sections
      .map((section) => `${section.titleEs} ${section.bodyEs ?? ''}`)
      .join(' ')
      .toLowerCase()

    for (const term of [
      'do = c',
      'si = b',
      'alteraciones',
      '♭',
      '♯',
      '♭♭',
      '♯♯',
      'm7♭5',
      'maj7',
      'sus4',
      'do7/solm',
      'c7/gm',
      'convertir',
    ]) {
      expect(text, `Falta el concepto: ${term}`).toContain(term)
    }
  })

  it('incluye una demo con ocho acordes y sus dos cifrados', () => {
    const scores = scoreSections(lesson)
    expect(scores).toHaveLength(1)

    const demo = scores[0]
    if (!demo) throw new Error('Falta la demo de M4-07')

    expect(demo.events).toHaveLength(8)
    expect(demo.events.map((event) => event.measure)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    expect(eventMidis(demo)).toEqual([
      [55, 60, 64, 70],
      [62, 65, 69, 72],
      [63, 67, 70, 74],
      [66, 69, 72, 75],
      [67, 70, 73, 77],
      [68, 72, 75, 78],
      [70, 75, 77],
      [50, 60, 64, 67],
    ])
  })

  it('plantea doce ejercicios de conversión y vuelta', () => {
    const exercises = chordNotationExercises(lesson, bundle)
    expect(exercises).toHaveLength(12)
    expect(new Set(exercises.map((exercise) => exercise.id)).size).toBe(12)

    expect(exercises.map((exercise) => exercise.id)).toEqual([
      'ex.m4-07.a',
      'ex.m4-07.b',
      'ex.m4-07.c',
      'ex.m4-07.d',
      'ex.m4-07.e',
      'ex.m4-07.f',
      'ex.m4-07.g',
      'ex.m4-07.h',
      'ex.m4-07.i',
      'ex.m4-07.j',
      'ex.m4-07.k',
      'ex.m4-07.l',
    ])

    const expectedMeta = [
      ['ex.m4-07.a', 'Do7/Solm', 'c', 'choice', 1],
      ['ex.m4-07.b', 'Rem7', 'c', 'choice', 1],
      ['ex.m4-07.c', 'Si♭maj7/Re', 'c', 'choice', 2],
      ['ex.m4-07.d', 'Fa♯dim7', 'c', 'choice', 2],
      ['ex.m4-07.e', 'Solm7♭5', 'c', 'choice', 3],
      ['ex.m4-07.f', 'La♭7', 'c', 'choice', 3],
      ['ex.m4-07.g', 'C7/Gm', 'do', 'text', 1],
      ['ex.m4-07.h', 'Dm7', 'do', 'text', 2],
      ['ex.m4-07.i', 'B♭maj7/D', 'do', 'text', 3],
      ['ex.m4-07.j', 'F♯dim7', 'do', 'text', 3],
      ['ex.m4-07.k', 'Gm7♭5', 'do', 'text', 3],
      ['ex.m4-07.l', 'A♭7', 'do', 'text', 3],
    ] as const

    const difficulties = exercises.map((exercise) => exercise.difficulty).sort((a, b) => a - b)
    expect(difficulties).toEqual([1, 1, 1, 2, 2, 2, 3, 3, 3, 3, 3, 3])

    for (const exercise of exercises) {
      const meta = expectedMeta.find(([id]) => id === exercise.id)
      if (meta === undefined) throw new Error(`Falta el meta del ejercicio ${exercise.id}`)
      expect(exercise.symbol, exercise.id).toBe(meta[1])
      expect(exercise.to, exercise.id).toBe(meta[2])

      const expectedAnswer = convertChordNotation(exercise.symbol, exercise.to)
      const wrongAnswer = expectedAnswer.replace(/[0-9a-z]/g, 'x')
      const resolved = resolveExerciseAnswer(exercise, 'es')
      expect(resolved.mode, exercise.id).toBe(meta[3])
      if (resolved.mode !== meta[3]) throw new Error(`${exercise.id}: modo inesperado`)
      expect(resolved.answer, exercise.id).toBe(expectedAnswer)
      expect(isExerciseAnswerCorrect(exercise, expectedAnswer), exercise.id).toBe(true)
      expect(isExerciseAnswerCorrect(exercise, wrongAnswer), exercise.id).toBe(false)

      const choices = exerciseChoices(exercise, 'es')
      if (meta[3] === 'choice') {
        expect(choices, exercise.id).toBeDefined()
        expect(choices ?? [], exercise.id).toContain(expectedAnswer)
        const answerEn = resolveExerciseAnswer(exercise, 'en')
        expect(answerEn.mode, `${exercise.id} modo EN`).toBe('choice')
        if (answerEn.mode !== 'choice') throw new Error(`${exercise.id}: modo EN inesperado`)
        expect(answerEn.answer, `${exercise.id} respuesta EN`).toBe(expectedAnswer)
      } else {
        expect(choices, exercise.id).toBeUndefined()
      }
    }
  })

  it('convierte los ejercicios en ambos sentidos con ida y vuelta', () => {
    const exercises = chordNotationExercises(lesson, bundle)
    for (const exercise of exercises) {
      const reverse = exercise.to === 'do' ? 'c' : 'do'
      const roundTrip = convertChordNotation(
        convertChordNotation(exercise.symbol, exercise.to),
        reverse,
      )
      expect(roundTrip, exercise.id).toBe(exercise.symbol)
    }

    const byId = new Map(exercises.map((exercise) => [exercise.id, exercise]))
    expect(convertChordNotation(byId.get('ex.m4-07.a')!.symbol, byId.get('ex.m4-07.a')!.to)).toBe('C7/Gm')
    expect(convertChordNotation('C7/Gm', 'do')).toBe('Do7/Solm')
  })

  it('incluye una tarea de teclado con los ocho acordes', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.tempoBpm).toBe(60)
    expect(task?.checklistEs.length).toBeGreaterThanOrEqual(3)
    expect(task?.checklistEn).toHaveLength(task?.checklistEs.length ?? 0)
    expect(task?.instructionsEs).toMatch(/cifrado/i)
    expect(task?.instructionsEs).toMatch(/bajo/i)

    const keyMidis = (task?.keys ?? []).map((pitch) => midiOf(fromSpelledPitch(pitch)))
    expect([...new Set(keyMidis)].sort((first, second) => first - second)).toEqual([
      50, 55, 60, 62, 63, 64, 65, 66, 67, 68, 69, 70, 72, 73, 74, 75, 77, 78,
    ])

    const demo = task?.demoScore
    if (!demo) throw new Error('Falta la demo de la tarea de M4-07')
    expect(demo.events).toHaveLength(8)
    expect(eventMidis(demo)).toHaveLength(8)
  })
})
