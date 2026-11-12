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

const BASIC = [
  'I7', 'I7', 'I7', 'I7', 'IV7', 'IV7', 'I7', 'I7', 'V7', 'IV7', 'I7', 'V7',
]
const QUICK = [
  'I7', 'IV7', 'I7', 'I7', 'IV7', 'IV7', 'I7', 'I7', 'V7', 'IV7', 'I7', 'V7',
]
const MINOR = [
  'i7', 'i7', 'i7', 'i7', 'iv7', 'iv7', 'i7', 'i7', 'V7', 'iv7', 'i7', 'V7',
]

const EXERCISES = [
  { id: 'ex.m5-06.a', key: 'C', mode: 'major', variant: 'basic', degrees: BASIC, missing: 4, answer: 'IV7' },
  { id: 'ex.m5-06.b', key: 'G', mode: 'major', variant: 'quick-change', degrees: QUICK, missing: 1, answer: 'IV7' },
  { id: 'ex.m5-06.c', key: 'D', mode: 'major', variant: 'basic', degrees: BASIC, missing: 8, answer: 'V7' },
  { id: 'ex.m5-06.d', key: 'A', mode: 'minor', variant: 'minor', degrees: MINOR, missing: 4, answer: 'iv7' },
  { id: 'ex.m5-06.e', key: 'E', mode: 'major', variant: 'quick-change', degrees: QUICK, missing: 5, answer: 'IV7' },
  { id: 'ex.m5-06.f', key: 'B', mode: 'major', variant: 'basic', degrees: BASIC, missing: 0, answer: 'I7' },
  { id: 'ex.m5-06.g', key: 'F#', mode: 'major', variant: 'basic', degrees: BASIC, missing: 10, answer: 'I7' },
  { id: 'ex.m5-06.h', key: 'Db', mode: 'major', variant: 'quick-change', degrees: QUICK, missing: 8, answer: 'V7' },
  { id: 'ex.m5-06.i', key: 'Ab', mode: 'minor', variant: 'minor', degrees: MINOR, missing: 8, answer: 'V7' },
  { id: 'ex.m5-06.j', key: 'Eb', mode: 'minor', variant: 'minor', degrees: MINOR, missing: 10, answer: 'i7' },
  { id: 'ex.m5-06.k', key: 'Bb', mode: 'major', variant: 'basic', degrees: BASIC, missing: 6, answer: 'I7' },
  { id: 'ex.m5-06.l', key: 'F', mode: 'major', variant: 'basic', degrees: BASIC, missing: 11, answer: 'V7' },
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

const C7 = [48, 52, 55, 58]
const F7 = [53, 57, 60, 63]
const G7 = [55, 59, 62, 65]
const D7 = [50, 54, 57, 60]

const BASIC_MIDI = [C7, C7, C7, C7, F7, F7, C7, C7, G7, F7, C7, G7]
const QUICK_MIDI = [G7, C7, G7, G7, C7, C7, G7, G7, D7, C7, G7, D7]

let bundle: ContentBundle
let lesson: Lesson

beforeAll(async () => {
  const result = validateContentBundle(await loadContentFromDisk())
  expect(result.ok).toBe(true)
  if (!result.bundle) throw new Error('El contenido del repositorio no es válido')
  bundle = result.bundle
  const found = bundle.lessons.find((item) => item.id === 'lesson.m5-06')
  if (!found) throw new Error('Falta la lección M5-06')
  lesson = found
})

describe('M5-06 — Blues de 12 compases', () => {
  it('está publicada, validada y depende de M5-05', () => {
    expect(lesson.moduleId).toBe('M5')
    expect(lesson.slug).toBe('blues-de-12-compases')
    expect(lesson.status).toBe('published')
    expect(lesson.prerequisites).toContain('lesson.m5-05')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
    expect(lesson.objectivesEn).toHaveLength(lesson.objectivesEs.length)
    expect(lesson.skillIds).toEqual(['skill.twelve-bar-blues'])
    expect(lesson.exerciseIds).toHaveLength(12)
  })

  it('explica la estructura de tres frases, las variantes y el turnaround', () => {
    const text = lesson.sections
      .map((section) => `${section.titleEs} ${section.bodyEs ?? ''}`)
      .join(' ')
      .toLowerCase()

    for (const term of [
      'doce compases',
      'tres frases',
      'cuatro compases',
      'i7',
      'iv7',
      'v7',
      'quick change',
      'blues menor',
      'turnaround',
      '4/4',
    ]) {
      expect(text, `Falta el concepto: ${term}`).toContain(term)
    }

    const english = lesson.sections
      .map((section) => `${section.titleEn} ${section.bodyEn ?? ''}`)
      .join(' ')
      .toLowerCase()
    for (const term of [
      'twelve-bar',
      'three four-bar phrases',
      'i7',
      'iv7',
      'v7',
      'quick-change',
      'minor blues',
      'turnaround',
      '4/4',
    ]) {
      expect(english, `Missing concept: ${term}`).toContain(term)
    }
  })

  it('incluye demos de playback del blues básico y del quick change', () => {
    const demos = scoreSections(lesson)
    expect(demos).toHaveLength(2)

    const expected: Record<string, { key: string; midi: number[][] }> = {
      'sec.m5-06.demo-basic': { key: 'C', midi: BASIC_MIDI },
      'sec.m5-06.demo-quick': { key: 'G', midi: QUICK_MIDI },
    }

    for (const demo of demos) {
      const target = expected[demo.sectionId]
      expect(target, demo.sectionId).toBeDefined()
      expect(demo.score.events, demo.sectionId).toHaveLength(12)
      expect(demo.score.key, demo.sectionId).toBe(target.key)
      expect(demo.score.mode, demo.sectionId).toBe('major')
      expect(demo.score.timeSignature, demo.sectionId).toEqual({
        numerator: 4,
        denominator: 4,
      })
      expect(eventMidis(demo.score), demo.sectionId).toEqual(target.midi)
    }
  })

  it('planta doce ejercicios de grados con las tres variantes', () => {
    const exercises = lessonExercises(lesson, bundle).filter(
      (exercise) => exercise.type === 'progression-completion',
    )
    expect(exercises).toHaveLength(12)

    const byId = new Map(exercises.map((exercise) => [exercise.id, exercise]))
    for (const expected of EXERCISES) {
      const exercise = byId.get(expected.id)
      expect(exercise, expected.id).toBeDefined()
      if (!exercise || exercise.type !== 'progression-completion') continue

      expect(exercise.key, expected.id).toBe(expected.key)
      expect(exercise.mode, expected.id).toBe(expected.mode)
      expect(exercise.degrees, expected.id).toHaveLength(12)
      expect(exercise.degrees, expected.id).toEqual(expected.degrees)
      expect(exercise.missingIndex, expected.id).toBe(expected.missing)
      expect(exercise.degrees[exercise.missingIndex], expected.id).toBe(
        expected.answer,
      )
      expect(exercise.skillId, expected.id).toBe('skill.twelve-bar-blues')
      expect(exercise.promptEs, `${expected.id} tonalidad ES`).toContain(
        KEY_ES[expected.key],
      )
      expect(exercise.promptEs, `${expected.id} pregunta`).toMatch(
        /blues de doce compases/,
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

  it('reparte las variantes y cubre las doce tonalidades', () => {
    const byVariant = new Map<string, number>()
    for (const item of EXERCISES) {
      byVariant.set(item.variant, (byVariant.get(item.variant) ?? 0) + 1)
    }
    expect(byVariant).toEqual(
      new Map([
        ['basic', 6],
        ['quick-change', 3],
        ['minor', 3],
      ]),
    )

    expect(new Set(EXERCISES.map((item) => item.key)).size).toBe(12)
    expect(new Set(EXERCISES.map((item) => item.mode))).toEqual(
      new Set(['major', 'minor']),
    )
  })

  it('incluye una tarea de teclado con los doce compases en Do mayor', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.tempoBpm).toBe(60)
    expect(task?.keys.length).toBeGreaterThanOrEqual(11)
    expect(task?.checklistEs.length).toBeGreaterThanOrEqual(3)
    expect(task?.checklistEn).toHaveLength(task?.checklistEs.length ?? 0)
    expect(task?.instructionsEs).toMatch(/Do7/)
    expect(task?.instructionsEs).toMatch(/Fa7/)
    expect(task?.instructionsEs).toMatch(/Sol7/)

    const demo = task?.demoScore
    expect(demo).toBeDefined()
    if (!demo) throw new Error('Falta la demo de la tarea')
    expect(demo.key).toBe('C')
    expect(demo.mode).toBe('major')
    expect(demo.events).toHaveLength(12)
    expect(eventMidis(demo)).toEqual(BASIC_MIDI)
  })

  it('registra la habilidad del blues de doce compases', () => {
    const skill = bundle.skills.find(
      (item) => item.id === 'skill.twelve-bar-blues',
    )
    expect(skill).toBeDefined()
    expect(skill?.kind).toBe('progression')
    expect(skill?.lessonIds).toContain('lesson.m5-06')
    expect(skill?.labelEs.length).toBeGreaterThan(0)
    expect(skill?.labelEn.length).toBeGreaterThan(0)
    expect(skill?.params.variants).toEqual([
      'basic',
      'quick-change',
      'minor',
    ])
  })
})
