import { beforeAll, describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { exerciseChoices } from '../src/content/localize'
import { validateContentBundle } from '../src/content/validate'
import { resolveExerciseAnswer } from '../src/exercises/answer'
import { fromSpelledPitch, midiOf } from '../src/theory'
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

const EXERCISES = [
  { id: 'ex.m5-08.a', key: 'C', numeral: 'iv' },
  { id: 'ex.m5-08.b', key: 'G', numeral: 'bIII' },
  { id: 'ex.m5-08.c', key: 'D', numeral: 'iv' },
  { id: 'ex.m5-08.d', key: 'A', numeral: 'bVI' },
  { id: 'ex.m5-08.e', key: 'E', numeral: 'bIII' },
  { id: 'ex.m5-08.f', key: 'B', numeral: 'bVI' },
  { id: 'ex.m5-08.g', key: 'F#', numeral: 'iv' },
  { id: 'ex.m5-08.h', key: 'Db', numeral: 'v' },
  { id: 'ex.m5-08.i', key: 'Ab', numeral: 'bVII' },
  { id: 'ex.m5-08.j', key: 'Eb', numeral: 'bVII' },
  { id: 'ex.m5-08.k', key: 'Bb', numeral: 'bVI' },
  { id: 'ex.m5-08.l', key: 'F', numeral: 'ii°' },
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
  const found = bundle.lessons.find((item) => item.id === 'lesson.m5-08')
  if (!found) throw new Error('Falta la lección M5-08')
  lesson = found
})

describe('M5-08 — Intercambio modal', () => {
  it('está publicada, validada y depende de M5-07', () => {
    expect(lesson.moduleId).toBe('M5')
    expect(lesson.slug).toBe('intercambio-modal')
    expect(lesson.status).toBe('published')
    expect(lesson.prerequisites).toContain('lesson.m5-07')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
    expect(lesson.objectivesEn).toHaveLength(lesson.objectivesEs.length)
    expect(lesson.skillIds).toEqual(['skill.modal-mixture'])
    expect(lesson.exerciseIds).toHaveLength(12)
  })

  it('explica el modo paralelo, los acordes prestados y la tercera de Picardía', () => {
    const text = lesson.sections
      .map((section) => `${section.titleEs} ${section.bodyEs ?? ''}`)
      .join(' ')
      .toLowerCase()

    for (const term of [
      'intercambio modal',
      'modo paralelo',
      'iv',
      '♭vi',
      '♭vii',
      '♭iii',
      'picardía',
      'préstamo',
    ]) {
      expect(text, `Falta el concepto: ${term}`).toContain(term)
    }

    const english = lesson.sections
      .map((section) => `${section.titleEn} ${section.bodyEn ?? ''}`)
      .join(' ')
      .toLowerCase()
    for (const term of [
      'modal mixture',
      'parallel mode',
      'iv',
      '♭vi',
      '♭vii',
      '♭iii',
      'picardy',
      'borrowing',
    ]) {
      expect(english, `Missing concept: ${term}`).toContain(term)
    }
  })

  it('incluye una demo del iv y otra de ♭VI-♭VII-I', () => {
    const demos = scoreSections(lesson)
    expect(demos).toHaveLength(2)

    const expected: Record<string, number[][]> = {
      'sec.m5-08.demo-iv': [
        [53, 56, 60],
        [60, 64, 67],
      ],
      'sec.m5-08.demo-bvi': [
        [56, 60, 63],
        [58, 62, 65],
        [60, 64, 67],
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

  it('planta doce acordes prestados para cifrar en todas las tonalidades', () => {
    const exercises = lessonExercises(lesson, bundle).filter(
      (exercise) => exercise.type === 'borrowed-chord',
    )
    expect(exercises).toHaveLength(12)

    const byId = new Map(exercises.map((exercise) => [exercise.id, exercise]))
    for (const expected of EXERCISES) {
      const exercise = byId.get(expected.id)
      expect(exercise, expected.id).toBeDefined()
      if (!exercise || exercise.type !== 'borrowed-chord') continue

      expect(exercise.key, expected.id).toBe(expected.key)
      expect(exercise.mode, expected.id).toBe('major')
      expect(exercise.numeral, expected.id).toBe(expected.numeral)
      expect(exercise.skillId, expected.id).toBe('skill.modal-mixture')
      expect(exercise.promptEs, `${expected.id} tonalidad ES`).toContain(
        KEY_ES[expected.key],
      )
      expect(exercise.promptEs, `${expected.id} pregunta`).toMatch(
        /qué número romano/i,
      )

      const spanish = resolveExerciseAnswer(exercise, 'es')
      const english = resolveExerciseAnswer(exercise, 'en')
      expect(spanish.mode, `${exercise.id} modo ES`).toBe('choice')
      expect(english.mode, `${exercise.id} modo EN`).toBe('choice')
      if (spanish.mode !== 'choice' || english.mode !== 'choice') continue

      expect(spanish.answer, `${exercise.id} respuesta ES`).toBe(
        expected.numeral,
      )
      expect(english.answer, `${exercise.id} respuesta EN`).toBe(
        expected.numeral,
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
      expect(choicesEs, `${exercise.id} cuatro opciones`).toHaveLength(4)
    }
  })

  it('reparte los acordes prestados y cubre las doce tonalidades', () => {
    const byNumeral = new Map<string, number>()
    for (const item of EXERCISES) {
      byNumeral.set(item.numeral, (byNumeral.get(item.numeral) ?? 0) + 1)
    }
    expect(byNumeral).toEqual(
      new Map([
        ['iv', 3],
        ['bIII', 2],
        ['bVI', 3],
        ['v', 1],
        ['bVII', 2],
        ['ii°', 1],
      ]),
    )

    expect(new Set(EXERCISES.map((item) => item.key)).size).toBe(12)
  })

  it('incluye una tarea de teclado con iv-I y ♭VI-♭VII-I en Do mayor', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.tempoBpm).toBe(60)
    expect(task?.keys.length).toBeGreaterThanOrEqual(8)
    expect(task?.checklistEs.length).toBeGreaterThanOrEqual(3)
    expect(task?.checklistEn).toHaveLength(task?.checklistEs.length ?? 0)
    expect(task?.instructionsEs).toMatch(/Fa menor/)
    expect(task?.instructionsEs).toMatch(/La♭/)
    expect(task?.instructionsEs).toMatch(/Si♭/)

    const demo = task?.demoScore
    expect(demo).toBeDefined()
    if (!demo) throw new Error('Falta la demo de la tarea')
    expect(demo.key).toBe('C')
    expect(demo.mode).toBe('major')
    expect(eventMidis(demo)).toEqual([
      [53, 56, 60],
      [60, 64, 67],
      [56, 60, 63],
      [58, 62, 65],
      [60, 64, 67],
    ])
  })

  it('registra la habilidad de intercambio modal', () => {
    const skill = bundle.skills.find((item) => item.id === 'skill.modal-mixture')
    expect(skill).toBeDefined()
    expect(skill?.kind).toBe('roman-numeral')
    expect(skill?.lessonIds).toContain('lesson.m5-08')
    expect(skill?.labelEs.length).toBeGreaterThan(0)
    expect(skill?.labelEn.length).toBeGreaterThan(0)
    expect(skill?.params.borrowed).toEqual([
      'iv',
      'bVI',
      'bVII',
      'bIII',
      'ii°',
      'v',
    ])
  })
})
