import { beforeAll, describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { exerciseChoices } from '../src/content/localize'
import { validateContentBundle } from '../src/content/validate'
import { resolveExerciseAnswer } from '../src/exercises/answer'
import {
  fromSpelledPitch,
  midiOf,
  qualitiesForMode,
  romanNumeralFor,
  secondaryDominantNumeral,
} from '../src/theory'
import type { ContentBundle, Exercise, Lesson, Score } from '../src/schemas'

const KEY_ES: Record<string, string> = {
  C: 'Do',
  Db: 'Re♭',
  D: 'Re',
  Eb: 'Mi♭',
  E: 'Mi',
  F: 'Fa',
  'F#': 'Fa♯',
  G: 'Sol',
  Ab: 'La♭',
  A: 'La',
  Bb: 'Si♭',
  B: 'Si',
}

const ASK = 'numeral' as const
const RES = 'resolution' as const

const EXERCISES = [
  { id: 'ex.m5-07.a', key: 'C', target: 5, ask: ASK, answer: 'V/V' },
  { id: 'ex.m5-07.b', key: 'G', target: 2, ask: RES, answer: 'ii' },
  { id: 'ex.m5-07.c', key: 'D', target: 5, ask: RES, answer: 'V' },
  { id: 'ex.m5-07.d', key: 'A', target: 2, ask: ASK, answer: 'V/ii' },
  { id: 'ex.m5-07.e', key: 'E', target: 5, ask: ASK, answer: 'V/V' },
  { id: 'ex.m5-07.f', key: 'B', target: 2, ask: RES, answer: 'ii' },
  { id: 'ex.m5-07.g', key: 'F#', target: 5, ask: RES, answer: 'V' },
  { id: 'ex.m5-07.h', key: 'Db', target: 2, ask: ASK, answer: 'V/ii' },
  { id: 'ex.m5-07.i', key: 'Ab', target: 5, ask: ASK, answer: 'V/V' },
  { id: 'ex.m5-07.j', key: 'Eb', target: 2, ask: RES, answer: 'ii' },
  { id: 'ex.m5-07.k', key: 'Bb', target: 5, ask: RES, answer: 'V' },
  { id: 'ex.m5-07.l', key: 'F', target: 2, ask: ASK, answer: 'V/ii' },
] as const

function scoreSections(lesson: Lesson): Array<{ sectionId: string; score: Score }> {
  return lesson.sections.flatMap((section) =>
    section.kind === 'score' && section.score
      ? [{ sectionId: section.id, score: section.score }]
      : [],
  )
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
  const found = bundle.lessons.find((item) => item.id === 'lesson.m5-07')
  if (!found) throw new Error('Falta la lección M5-07')
  lesson = found
})

describe('M5-07 — Dominantes secundarias', () => {
  it('está publicada, validada y depende de M5-06', () => {
    expect(lesson.moduleId).toBe('M5')
    expect(lesson.slug).toBe('dominantes-secundarias')
    expect(lesson.status).toBe('published')
    expect(lesson.prerequisites).toContain('lesson.m5-06')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
    expect(lesson.objectivesEn).toHaveLength(lesson.objectivesEs.length)
    expect(lesson.skillIds).toEqual(['skill.secondary-dominants'])
    expect(lesson.exerciseIds).toHaveLength(12)
  })

  it('explica V/V, V/ii, la sensible y la resolución', () => {
    const text = lesson.sections
      .map((section) => `${section.titleEs} ${section.bodyEs ?? ''}`)
      .join(' ')
      .toLowerCase()

    for (const term of [
      'dominante secundario',
      'v/v',
      'v/ii',
      'sensible',
      'resuelve',
      'semitono',
      'séptima',
      'toniciza',
    ]) {
      expect(text, `Falta el concepto: ${term}`).toContain(term)
    }

    const english = lesson.sections
      .map((section) => `${section.titleEn} ${section.bodyEn ?? ''}`)
      .join(' ')
      .toLowerCase()
    for (const term of [
      'secondary dominant',
      'v/v',
      'v/ii',
      'leading tone',
      'resolves',
      'semitone',
      'seventh',
      'tonicis',
    ]) {
      expect(english, `Missing concept: ${term}`).toContain(term)
    }
  })

  it('incluye una demo de cada dominante secundario', () => {
    const demos = scoreSections(lesson)
    expect(demos).toHaveLength(2)

    const expected: Record<string, number[][]> = {
      'sec.m5-07.demo-vv': [
        [50, 54, 57, 60],
        [55, 59, 62],
      ],
      'sec.m5-07.demo-vii': [
        [57, 61, 64, 67],
        [50, 53, 57],
      ],
    }

    for (const demo of demos) {
      expect(demo.score.key, demo.sectionId).toBe('C')
      expect(demo.score.mode, demo.sectionId).toBe('major')
      expect(eventMidis(demo.score), demo.sectionId).toEqual(
        expected[demo.sectionId],
      )
    }
  })

  it('planta doce ejercicios de cifrado y resolución en todas las tonalidades', () => {
    const exercises = lessonExercises(lesson, bundle).filter(
      (exercise) => exercise.type === 'secondary-dominant',
    )
    expect(exercises).toHaveLength(12)

    const byId = new Map(exercises.map((exercise) => [exercise.id, exercise]))
    for (const expected of EXERCISES) {
      const exercise = byId.get(expected.id)
      expect(exercise, expected.id).toBeDefined()
      if (!exercise || exercise.type !== 'secondary-dominant') continue

      expect(exercise.key, expected.id).toBe(expected.key)
      expect(exercise.mode, expected.id).toBe('major')
      expect(exercise.target, expected.id).toBe(expected.target)
      expect(exercise.ask, expected.id).toBe(expected.ask)
      expect(exercise.skillId, expected.id).toBe('skill.secondary-dominants')
      expect(exercise.promptEs, `${expected.id} tonalidad ES`).toContain(
        KEY_ES[expected.key],
      )
      expect(exercise.promptEs, `${expected.id} pregunta`).toMatch(
        expected.ask === 'numeral' ? /cómo se cifra/ : /en qué grado resuelve/,
      )

      const spanish = resolveExerciseAnswer(exercise, 'es')
      const english = resolveExerciseAnswer(exercise, 'en')
      expect(spanish.mode, `${exercise.id} modo ES`).toBe('choice')
      expect(english.mode, `${exercise.id} modo EN`).toBe('choice')
      if (spanish.mode !== 'choice' || english.mode !== 'choice') continue

      expect(spanish.answer, `${exercise.id} respuesta ES`).toBe(expected.answer)
      expect(english.answer, `${exercise.id} respuesta EN`).toBe(expected.answer)

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
      expect(choicesEs, `${exercise.id} cuatro opciones`).toHaveLength(4)
    }
  })

  it('deriva el cifrado del motor y reparte los dos tipos de pregunta', () => {
    expect(secondaryDominantNumeral(5)).toBe('V/V')
    expect(secondaryDominantNumeral(2)).toBe('V/ii')

    for (const expected of EXERCISES) {
      const targetRoman = romanNumeralFor(
        expected.target,
        qualitiesForMode('major')[expected.target - 1],
      )
      if (expected.ask === 'numeral') {
        expect(
          secondaryDominantNumeral(expected.target),
          `${expected.id} cifrado`,
        ).toBe(expected.answer)
      } else {
        expect(targetRoman, `${expected.id} resolución`).toBe(expected.answer)
      }
    }

    const numeral = EXERCISES.filter((item) => item.ask === 'numeral')
    const resolution = EXERCISES.filter((item) => item.ask === 'resolution')
    expect(numeral).toHaveLength(6)
    expect(resolution).toHaveLength(6)
    expect(new Set(EXERCISES.map((item) => item.target))).toEqual(
      new Set([2, 5]),
    )
    expect(new Set(EXERCISES.map((item) => item.key)).size).toBe(12)
  })

  it('incluye una tarea de teclado con V/V-V y V/ii-ii en Do mayor', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.tempoBpm).toBe(60)
    expect(task?.keys.length).toBeGreaterThanOrEqual(8)
    expect(task?.checklistEs.length).toBeGreaterThanOrEqual(3)
    expect(task?.checklistEn).toHaveLength(task?.checklistEs.length ?? 0)
    expect(task?.instructionsEs).toMatch(/Re7/)
    expect(task?.instructionsEs).toMatch(/La7/)

    const demo = task?.demoScore
    expect(demo).toBeDefined()
    if (!demo) throw new Error('Falta la demo de la tarea')
    expect(demo.key).toBe('C')
    expect(demo.mode).toBe('major')
    expect(eventMidis(demo)).toEqual([
      [50, 54, 57, 60],
      [55, 59, 62],
      [57, 61, 64, 67],
      [50, 53, 57],
    ])
  })

  it('registra la habilidad de dominantes secundarias', () => {
    const skill = bundle.skills.find(
      (item) => item.id === 'skill.secondary-dominants',
    )
    expect(skill).toBeDefined()
    expect(skill?.kind).toBe('roman-numeral')
    expect(skill?.lessonIds).toContain('lesson.m5-07')
    expect(skill?.labelEs.length).toBeGreaterThan(0)
    expect(skill?.labelEn.length).toBeGreaterThan(0)
    expect(skill?.params.labels).toEqual(['V/V', 'V/ii'])
  })
})
