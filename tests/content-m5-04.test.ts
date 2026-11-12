import { beforeAll, describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { exerciseChoices } from '../src/content/localize'
import { validateContentBundle } from '../src/content/validate'
import { resolveExerciseAnswer } from '../src/exercises/answer'
import {
  cadenceName,
  cadenceTypeFor,
  fromSpelledPitch,
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

const CADENCES = [
  { id: 'ex.m5-04.a', key: 'C', mode: 'major', from: 5, to: 1, type: 'authentic' },
  { id: 'ex.m5-04.b', key: 'G', mode: 'major', from: 4, to: 1, type: 'plagal' },
  { id: 'ex.m5-04.c', key: 'D', mode: 'major', from: 1, to: 5, type: 'half' },
  { id: 'ex.m5-04.d', key: 'F', mode: 'major', from: 5, to: 6, type: 'deceptive' },
  { id: 'ex.m5-04.e', key: 'Bb', mode: 'major', from: 2, to: 5, type: 'half' },
  { id: 'ex.m5-04.f', key: 'E', mode: 'major', from: 4, to: 1, type: 'plagal' },
  { id: 'ex.m5-04.g', key: 'A', mode: 'minor', from: 5, to: 1, type: 'authentic' },
  { id: 'ex.m5-04.h', key: 'E', mode: 'minor', from: 4, to: 1, type: 'plagal' },
  { id: 'ex.m5-04.i', key: 'D', mode: 'minor', from: 1, to: 5, type: 'half' },
  { id: 'ex.m5-04.j', key: 'C', mode: 'minor', from: 5, to: 6, type: 'deceptive' },
  { id: 'ex.m5-04.k', key: 'G', mode: 'minor', from: 5, to: 1, type: 'authentic' },
  { id: 'ex.m5-04.l', key: 'B', mode: 'minor', from: 5, to: 6, type: 'deceptive' },
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
  const found = bundle.lessons.find((item) => item.id === 'lesson.m5-04')
  if (!found) throw new Error('Falta la lección M5-04')
  lesson = found
})

describe('M5-04 — Cadencias', () => {
  it('está publicada, validada y depende de M5-03', () => {
    expect(lesson.moduleId).toBe('M5')
    expect(lesson.slug).toBe('cadencias')
    expect(lesson.status).toBe('published')
    expect(lesson.prerequisites).toContain('lesson.m5-03')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
    expect(lesson.objectivesEn).toHaveLength(lesson.objectivesEs.length)
    expect(lesson.skillIds).toEqual(['skill.cadence'])
    expect(lesson.exerciseIds).toHaveLength(12)
  })

  it('explica las cuatro cadencias y cómo distinguirlas', () => {
    const text = lesson.sections
      .map((section) => `${section.titleEs} ${section.bodyEs ?? ''}`)
      .join(' ')
      .toLowerCase()

    for (const term of [
      'cadencia auténtica',
      'plagal',
      'semicadencia',
      'rota',
      'v-i',
      'iv-i',
      'v-vi',
      'sensible',
      'menor',
    ]) {
      expect(text, `Falta el concepto: ${term}`).toContain(term)
    }

    const english = lesson.sections
      .map((section) => `${section.titleEn} ${section.bodyEn ?? ''}`)
      .join(' ')
      .toLowerCase()
    for (const term of [
      'authentic',
      'plagal',
      'half cadence',
      'deceptive',
      'v-i',
      'iv-i',
      'v-vi',
      'leading tone',
      'minor',
    ]) {
      expect(english, `Missing concept: ${term}`).toContain(term)
    }
  })

  it('incluye una demo de audio para cada cadencia', () => {
    const demos = scoreSections(lesson)
    expect(demos).toHaveLength(4)

    const expected: Record<string, number[][]> = {
      'sec.m5-04.demo-autentica': [
        [55, 59, 62],
        [60, 64, 67],
      ],
      'sec.m5-04.demo-plagal': [
        [53, 57, 60],
        [60, 64, 67],
      ],
      'sec.m5-04.demo-semicadencia': [
        [60, 64, 67],
        [55, 59, 62],
      ],
      'sec.m5-04.demo-rota': [
        [55, 59, 62],
        [57, 60, 64],
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

  it('planta doce ejercicios de clasificación con sus cadencias', () => {
    const exercises = lessonExercises(lesson, bundle).filter(
      (exercise) => exercise.type === 'cadence',
    )
    expect(exercises).toHaveLength(12)

    const byId = new Map(exercises.map((exercise) => [exercise.id, exercise]))
    for (const expected of CADENCES) {
      const exercise = byId.get(expected.id)
      expect(exercise, expected.id).toBeDefined()
      if (!exercise || exercise.type !== 'cadence') continue

      expect(cadenceTypeFor(expected.from, expected.to), expected.id).toBe(
        expected.type,
      )
      expect(exercise.key, expected.id).toBe(expected.key)
      expect(exercise.mode, expected.id).toBe(expected.mode)
      expect(exercise.fromDegree, expected.id).toBe(expected.from)
      expect(exercise.toDegree, expected.id).toBe(expected.to)
      expect(exercise.skillId, expected.id).toBe('skill.cadence')
      expect(exercise.promptEs, `${expected.id} tonalidad ES`).toContain(
        KEY_ES[expected.key],
      )
      expect(exercise.promptEs, `${expected.id} pregunta`).toMatch(
        /qué cadencia forman/,
      )

      const spanish = resolveExerciseAnswer(exercise, 'es')
      const english = resolveExerciseAnswer(exercise, 'en')
      expect(spanish.mode, `${exercise.id} modo ES`).toBe('choice')
      expect(english.mode, `${exercise.id} modo EN`).toBe('choice')
      if (spanish.mode !== 'choice' || english.mode !== 'choice') continue

      expect(spanish.answer, `${exercise.id} respuesta ES`).toBe(
        cadenceName(expected.type, 'es'),
      )
      expect(english.answer, `${exercise.id} respuesta EN`).toBe(
        cadenceName(expected.type, 'en'),
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

  it('reparte las cuatro cadencias y los dos modos de forma equilibrada', () => {
    const byType = new Map<string, number>()
    for (const item of CADENCES) {
      byType.set(item.type, (byType.get(item.type) ?? 0) + 1)
    }
    expect(byType).toEqual(
      new Map([
        ['authentic', 3],
        ['plagal', 3],
        ['half', 3],
        ['deceptive', 3],
      ]),
    )

    expect(CADENCES.filter((item) => item.mode === 'major')).toHaveLength(6)
    expect(CADENCES.filter((item) => item.mode === 'minor')).toHaveLength(6)
    expect(new Set(CADENCES.map((item) => item.key))).toEqual(
      new Set(['C', 'G', 'D', 'F', 'Bb', 'E', 'A', 'B']),
    )
  })

  it('incluye una tarea de teclado con las cuatro cadencias en Do mayor', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.tempoBpm).toBe(60)
    expect(task?.keys.length).toBeGreaterThanOrEqual(8)
    expect(task?.checklistEs.length).toBeGreaterThanOrEqual(3)
    expect(task?.checklistEn).toHaveLength(task?.checklistEs.length ?? 0)
    expect(task?.instructionsEs).toMatch(/Sol-Do/)
    expect(task?.instructionsEs).toMatch(/Fa-Do/)
    expect(task?.instructionsEs).toMatch(/Do-Sol/)
    expect(task?.instructionsEs).toMatch(/Sol-Lam/)

    const demo = task?.demoScore
    expect(demo).toBeDefined()
    if (!demo) throw new Error('Falta la demo de la tarea')
    expect(demo.key).toBe('C')
    expect(demo.mode).toBe('major')
    expect(eventMidis(demo)).toEqual([
      [55, 59, 62],
      [60, 64, 67],
      [53, 57, 60],
      [60, 64, 67],
      [60, 64, 67],
      [55, 59, 62],
      [55, 59, 62],
      [57, 60, 64],
    ])
  })

  it('registra la habilidad de cadencias', () => {
    const skill = bundle.skills.find((item) => item.id === 'skill.cadence')
    expect(skill).toBeDefined()
    expect(skill?.kind).toBe('progression')
    expect(skill?.lessonIds).toContain('lesson.m5-04')
    expect(skill?.labelEs.length).toBeGreaterThan(0)
    expect(skill?.labelEn.length).toBeGreaterThan(0)
    expect(skill?.params.cadences).toEqual([
      'authentic',
      'plagal',
      'half',
      'deceptive',
    ])
  })
})
