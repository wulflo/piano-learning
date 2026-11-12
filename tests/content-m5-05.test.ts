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

const PROGRESSIONS = [
  { id: 'ex.m5-05.a', key: 'C', degrees: ['I', 'V', 'vi', 'IV'], missing: 2, answer: 'vi' },
  { id: 'ex.m5-05.b', key: 'Db', degrees: ['ii', 'V', 'I'], missing: 1, answer: 'V' },
  { id: 'ex.m5-05.c', key: 'D', degrees: ['I', 'V', 'vi', 'IV'], missing: 3, answer: 'IV' },
  { id: 'ex.m5-05.d', key: 'Eb', degrees: ['ii', 'V', 'I'], missing: 0, answer: 'ii' },
  { id: 'ex.m5-05.e', key: 'E', degrees: ['I', 'V', 'vi', 'IV'], missing: 0, answer: 'I' },
  { id: 'ex.m5-05.f', key: 'F', degrees: ['ii', 'V', 'I'], missing: 2, answer: 'I' },
  { id: 'ex.m5-05.g', key: 'F#', degrees: ['I', 'V', 'vi', 'IV'], missing: 1, answer: 'V' },
  { id: 'ex.m5-05.h', key: 'G', degrees: ['ii', 'V', 'I'], missing: 0, answer: 'ii' },
  { id: 'ex.m5-05.i', key: 'Ab', degrees: ['I', 'V', 'vi', 'IV'], missing: 3, answer: 'IV' },
  { id: 'ex.m5-05.j', key: 'A', degrees: ['ii', 'V', 'I'], missing: 1, answer: 'V' },
  { id: 'ex.m5-05.k', key: 'Bb', degrees: ['I', 'V', 'vi', 'IV'], missing: 2, answer: 'vi' },
  { id: 'ex.m5-05.l', key: 'B', degrees: ['ii', 'V', 'I'], missing: 2, answer: 'I' },
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
  const found = bundle.lessons.find((item) => item.id === 'lesson.m5-05')
  if (!found) throw new Error('Falta la lección M5-05')
  lesson = found
})

describe('M5-05 — Progresiones comunes', () => {
  it('está publicada, validada y depende de M5-04', () => {
    expect(lesson.moduleId).toBe('M5')
    expect(lesson.slug).toBe('progresiones-comunes')
    expect(lesson.status).toBe('published')
    expect(lesson.prerequisites).toContain('lesson.m5-04')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
    expect(lesson.objectivesEn).toHaveLength(lesson.objectivesEs.length)
    expect(lesson.skillIds).toEqual(['skill.common-progressions'])
    expect(lesson.exerciseIds).toHaveLength(12)
  })

  it('explica las dos progresiones, sus funciones y las doce tonalidades', () => {
    const text = lesson.sections
      .map((section) => `${section.titleEs} ${section.bodyEs ?? ''}`)
      .join(' ')
      .toLowerCase()

    for (const term of [
      'i-v-vi-iv',
      'ii-v-i',
      'tónica',
      'dominante',
      'subdominante',
      'relativa menor',
      'doce tonalidades',
      'séptimas',
      'tritono',
    ]) {
      expect(text, `Falta el concepto: ${term}`).toContain(term)
    }

    const english = lesson.sections
      .map((section) => `${section.titleEn} ${section.bodyEn ?? ''}`)
      .join(' ')
      .toLowerCase()
    for (const term of [
      'i-v-vi-iv',
      'ii-v-i',
      'tonic',
      'dominant',
      'subdominant',
      'relative minor',
      'twelve keys',
      'sevenths',
      'tritone',
    ]) {
      expect(english, `Missing concept: ${term}`).toContain(term)
    }
  })

  it('incluye una demo de playback para cada progresión', () => {
    const demos = scoreSections(lesson)
    expect(demos).toHaveLength(2)

    const expected: Record<string, number[][]> = {
      'sec.m5-05.demo-pop': [
        [60, 64, 67],
        [55, 59, 62],
        [57, 60, 64],
        [53, 57, 60],
      ],
      'sec.m5-05.demo-jazz': [
        [50, 53, 57, 60],
        [55, 59, 62, 65],
        [48, 52, 55, 59],
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

  it('planta doce ejercicios de completar, uno por tonalidad', () => {
    const exercises = lessonExercises(lesson, bundle).filter(
      (exercise) => exercise.type === 'progression-completion',
    )
    expect(exercises).toHaveLength(12)

    const byId = new Map(exercises.map((exercise) => [exercise.id, exercise]))
    for (const expected of PROGRESSIONS) {
      const exercise = byId.get(expected.id)
      expect(exercise, expected.id).toBeDefined()
      if (!exercise || exercise.type !== 'progression-completion') continue

      expect(exercise.key, expected.id).toBe(expected.key)
      expect(exercise.mode, expected.id).toBe('major')
      expect(exercise.degrees, expected.id).toEqual(expected.degrees)
      expect(exercise.missingIndex, expected.id).toBe(expected.missing)
      expect(exercise.degrees[exercise.missingIndex], expected.id).toBe(
        expected.answer,
      )
      expect(exercise.skillId, expected.id).toBe('skill.common-progressions')
      expect(exercise.promptEs, `${expected.id} tonalidad ES`).toContain(
        KEY_ES[expected.key],
      )
      expect(exercise.promptEs, `${expected.id} pregunta`).toMatch(
        /qué grado completa/,
      )

      const spanish = resolveExerciseAnswer(exercise, 'es')
      const english = resolveExerciseAnswer(exercise, 'en')
      expect(spanish.mode, `${exercise.id} modo ES`).toBe('choice')
      expect(english.mode, `${exercise.id} modo EN`).toBe('choice')
      if (spanish.mode !== 'choice' || english.mode !== 'choice') continue

      expect(spanish.answer, `${exercise.id} respuesta ES`).toBe(
        expected.answer,
      )
      expect(english.answer, `${exercise.id} respuesta EN`).toBe(
        expected.answer,
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

  it('reparte las dos progresiones y cubre las doce tonalidades', () => {
    const pop = PROGRESSIONS.filter((item) => item.degrees.length === 4)
    const jazz = PROGRESSIONS.filter((item) => item.degrees.length === 3)
    expect(pop).toHaveLength(6)
    expect(jazz).toHaveLength(6)

    expect(new Set(PROGRESSIONS.map((item) => item.key)).size).toBe(12)
    expect(new Set(PROGRESSIONS.map((item) => item.answer))).toEqual(
      new Set(['I', 'ii', 'IV', 'V', 'vi']),
    )
  })

  it('incluye una tarea de teclado con las dos progresiones en Do mayor', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.tempoBpm).toBe(60)
    expect(task?.keys.length).toBeGreaterThanOrEqual(9)
    expect(task?.checklistEs.length).toBeGreaterThanOrEqual(3)
    expect(task?.checklistEn).toHaveLength(task?.checklistEs.length ?? 0)
    expect(task?.instructionsEs).toMatch(/Do-Sol-Lam-Fa/)
    expect(task?.instructionsEs).toMatch(/Rem-Sol-Do/)

    const demo = task?.demoScore
    expect(demo).toBeDefined()
    if (!demo) throw new Error('Falta la demo de la tarea')
    expect(demo.key).toBe('C')
    expect(demo.mode).toBe('major')
    expect(eventMidis(demo)).toEqual([
      [60, 64, 67],
      [55, 59, 62],
      [57, 60, 64],
      [53, 57, 60],
      [50, 53, 57],
      [55, 59, 62],
      [60, 64, 67],
    ])
  })

  it('registra la habilidad de progresiones comunes', () => {
    const skill = bundle.skills.find(
      (item) => item.id === 'skill.common-progressions',
    )
    expect(skill).toBeDefined()
    expect(skill?.kind).toBe('progression')
    expect(skill?.lessonIds).toContain('lesson.m5-05')
    expect(skill?.labelEs.length).toBeGreaterThan(0)
    expect(skill?.labelEn.length).toBeGreaterThan(0)
    expect(skill?.params.progressions).toEqual(['I-V-vi-IV', 'ii-V-I'])
  })
})
