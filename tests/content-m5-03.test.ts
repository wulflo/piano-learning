import { beforeAll, describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { exerciseChoices } from '../src/content/localize'
import { validateContentBundle } from '../src/content/validate'
import { resolveExerciseAnswer } from '../src/exercises/answer'
import {
  fromSpelledPitch,
  functionsForMode,
  harmonicFunctionName,
  midiOf,
} from '../src/theory'
import type { ContentBundle, Exercise, Lesson, Score } from '../src/schemas'

const KEY_ES: Record<string, string> = {
  C: 'Do',
  D: 'Re',
  E: 'Mi',
  F: 'Fa',
  G: 'Sol',
  A: 'La',
  B: 'Si',
  Bb: 'Si♭',
}

const FUNCTIONS = [
  { id: 'ex.m5-03.a', key: 'C', mode: 'major', degree: 1, func: 'tonic' },
  { id: 'ex.m5-03.b', key: 'G', mode: 'major', degree: 4, func: 'subdominant' },
  { id: 'ex.m5-03.c', key: 'D', mode: 'major', degree: 5, func: 'dominant' },
  { id: 'ex.m5-03.d', key: 'F', mode: 'major', degree: 6, func: 'tonic' },
  { id: 'ex.m5-03.e', key: 'Bb', mode: 'major', degree: 2, func: 'subdominant' },
  { id: 'ex.m5-03.f', key: 'E', mode: 'major', degree: 7, func: 'dominant' },
  { id: 'ex.m5-03.g', key: 'A', mode: 'minor', degree: 1, func: 'tonic' },
  { id: 'ex.m5-03.h', key: 'E', mode: 'minor', degree: 4, func: 'subdominant' },
  { id: 'ex.m5-03.i', key: 'D', mode: 'minor', degree: 5, func: 'dominant' },
  { id: 'ex.m5-03.j', key: 'C', mode: 'minor', degree: 3, func: 'tonic' },
  { id: 'ex.m5-03.k', key: 'G', mode: 'minor', degree: 2, func: 'subdominant' },
  { id: 'ex.m5-03.l', key: 'B', mode: 'minor', degree: 7, func: 'dominant' },
] as const

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
  const found = bundle.lessons.find((item) => item.id === 'lesson.m5-03')
  if (!found) throw new Error('Falta la lección M5-03')
  lesson = found
})

describe('M5-03 — Funciones T-S-D', () => {
  it('está publicada, validada y depende de M5-02', () => {
    expect(lesson.moduleId).toBe('M5')
    expect(lesson.slug).toBe('funciones-t-s-d')
    expect(lesson.status).toBe('published')
    expect(lesson.prerequisites).toContain('lesson.m5-02')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
    expect(lesson.objectivesEn).toHaveLength(lesson.objectivesEs.length)
    expect(lesson.skillIds).toEqual(['skill.harmonic-function'])
    expect(lesson.exerciseIds).toHaveLength(12)
  })

  it('explica las tres funciones, el reposo, la tensión y el ciclo T-S-D-T', () => {
    const text = lesson.sections
      .map((section) => `${section.titleEs} ${section.bodyEs ?? ''}`)
      .join(' ')
      .toLowerCase()

    for (const term of [
      'tónica',
      'subdominante',
      'dominante',
      'reposo',
      'tensión',
      't-s-d-t',
      'mayor',
      'menor',
      'sensible',
    ]) {
      expect(text, `Falta el concepto: ${term}`).toContain(term)
    }

    const english = lesson.sections
      .map((section) => `${section.titleEn} ${section.bodyEn ?? ''}`)
      .join(' ')
      .toLowerCase()
    for (const term of [
      'tonic',
      'subdominant',
      'dominant',
      'rest',
      'tension',
      't-s-d-t',
      'major',
      'minor',
      'leading tone',
    ]) {
      expect(english, `Missing concept: ${term}`).toContain(term)
    }
  })

  it('incluye una demo con el ciclo I-IV-V-I', () => {
    const scores = scoreSections(lesson)
    expect(scores).toHaveLength(1)

    const demo = scores[0]
    if (!demo) throw new Error('Falta la demo de M5-03')

    expect(demo.key).toBe('C')
    expect(demo.mode).toBe('major')
    expect(demo.events).toHaveLength(4)
    expect(eventMidis(demo)).toEqual([
      [60, 64, 67],
      [53, 57, 60],
      [55, 59, 62],
      [60, 64, 67],
    ])
  })

  it('planta doce ejercicios de clasificación con sus funciones', () => {
    const exercises = lessonExercises(lesson, bundle).filter(
      (exercise) => exercise.type === 'harmonic-function',
    )
    expect(exercises).toHaveLength(12)

    const byId = new Map(exercises.map((exercise) => [exercise.id, exercise]))
    for (const expected of FUNCTIONS) {
      const exercise = byId.get(expected.id)
      expect(exercise, expected.id).toBeDefined()
      if (!exercise || exercise.type !== 'harmonic-function') continue

      const mode = expected.mode === 'major' ? 'major' : 'natural-minor'
      const func = functionsForMode(mode)[expected.degree - 1]
      expect(func, expected.id).toBe(expected.func)

      expect(exercise.key, expected.id).toBe(expected.key)
      expect(exercise.mode, expected.id).toBe(expected.mode)
      expect(exercise.degree, expected.id).toBe(expected.degree)
      expect(exercise.skillId, expected.id).toBe('skill.harmonic-function')
      expect(exercise.promptEs, `${expected.id} tonalidad ES`).toContain(
        KEY_ES[expected.key],
      )
      expect(exercise.promptEs, `${expected.id} pregunta`).toMatch(
        /qué función cumple/,
      )

      const spanish = resolveExerciseAnswer(exercise, 'es')
      const english = resolveExerciseAnswer(exercise, 'en')
      expect(spanish.mode, `${exercise.id} modo ES`).toBe('choice')
      expect(english.mode, `${exercise.id} modo EN`).toBe('choice')
      if (spanish.mode !== 'choice' || english.mode !== 'choice') continue

      expect(spanish.answer, `${exercise.id} respuesta ES`).toBe(
        harmonicFunctionName(expected.func, 'es'),
      )
      expect(english.answer, `${exercise.id} respuesta EN`).toBe(
        harmonicFunctionName(expected.func, 'en'),
      )

      const choicesEs = exerciseChoices(exercise, 'es')
      const choicesEn = exerciseChoices(exercise, 'en')
      expect(choicesEs ?? [], `${exercise.id} opciones ES`).toContain(
        spanish.answer,
      )
      expect(choicesEn ?? [], `${exercise.id} opciones EN`).toContain(
        english.answer,
      )
      expect(
        (choicesEs ?? []).indexOf(spanish.answer),
        `${exercise.id} índice de la respuesta`,
      ).toBe((choicesEn ?? []).indexOf(english.answer))
    }
  })

  it('reparte las funciones y los modos de forma equilibrada', () => {
    const byFunction = new Map<string, number>()
    for (const item of FUNCTIONS) {
      byFunction.set(item.func, (byFunction.get(item.func) ?? 0) + 1)
    }
    expect(byFunction).toEqual(
      new Map([
        ['tonic', 4],
        ['subdominant', 4],
        ['dominant', 4],
      ]),
    )

    expect(FUNCTIONS.filter((item) => item.mode === 'major')).toHaveLength(6)
    expect(FUNCTIONS.filter((item) => item.mode === 'minor')).toHaveLength(6)
    expect(new Set(FUNCTIONS.map((item) => item.key))).toEqual(
      new Set(['C', 'G', 'D', 'F', 'Bb', 'E', 'A', 'B']),
    )
  })

  it('incluye una tarea de teclado con i-iv-V-i y demo en La menor', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.tempoBpm).toBe(60)
    expect(task?.keys.length).toBeGreaterThanOrEqual(9)
    expect(task?.checklistEs.length).toBeGreaterThanOrEqual(3)
    expect(task?.checklistEn).toHaveLength(task?.checklistEs.length ?? 0)
    expect(task?.instructionsEs).toMatch(/bloque|Lam/)
    expect(task?.instructionsEs).toMatch(/Sol♯/)

    const demo = task?.demoScore
    expect(demo).toBeDefined()
    if (!demo) throw new Error('Falta la demo de la tarea')
    expect(demo.key).toBe('A')
    expect(demo.mode).toBe('minor')
    expect(eventMidis(demo)).toEqual([
      [57, 60, 64],
      [50, 53, 57],
      [52, 56, 59],
      [57, 60, 64],
    ])
  })

  it('registra la habilidad de funciones armónicas', () => {
    const skill = bundle.skills.find(
      (item) => item.id === 'skill.harmonic-function',
    )
    expect(skill).toBeDefined()
    expect(skill?.kind).toBe('roman-numeral')
    expect(skill?.lessonIds).toContain('lesson.m5-03')
    expect(skill?.labelEs.length).toBeGreaterThan(0)
    expect(skill?.labelEn.length).toBeGreaterThan(0)
    expect(skill?.params.functions).toEqual([
      'tonic',
      'subdominant',
      'dominant',
    ])
  })
})
