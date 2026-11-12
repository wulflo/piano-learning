import { beforeAll, describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { exerciseChoices } from '../src/content/localize'
import { scoreKeySignature } from '../src/content/score'
import { validateContentBundle } from '../src/content/validate'
import { resolveExerciseAnswer } from '../src/exercises/answer'
import { AUGMENTED_SIXTH_LABELS } from '../src/exercises/augmented-sixth'
import { fromSpelledPitch, intervalBetween, midiOf } from '../src/theory'
import type {
  ContentBundle,
  Exercise,
  Lesson,
  Score,
  SpelledPitch,
} from '../src/schemas'

const IDENTIFY_EXERCISES = [
  { id: 'ex.m5-11.a', key: 'A', mode: 'minor', variant: 'italian' },
  { id: 'ex.m5-11.b', key: 'A', mode: 'minor', variant: 'french' },
  { id: 'ex.m5-11.c', key: 'C', mode: 'minor', variant: 'german' },
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

function pitchesOf(score: Score): SpelledPitch[] {
  return score.events[0].pitches
}

let bundle: ContentBundle
let lesson: Lesson

beforeAll(async () => {
  const result = validateContentBundle(await loadContentFromDisk())
  expect(result.ok).toBe(true)
  if (!result.bundle) throw new Error('El contenido del repositorio no es válido')
  bundle = result.bundle
  const found = bundle.lessons.find((item) => item.id === 'lesson.m5-11')
  if (!found) throw new Error('Falta la lección M5-11')
  lesson = found
})

describe('M5-11 — Sextas aumentadas', () => {
  it('está publicada, es opcional y depende de M5-08', () => {
    expect(lesson.moduleId).toBe('M5')
    expect(lesson.slug).toBe('sextas-aumentadas')
    expect(lesson.status).toBe('published')
    expect(lesson.optional).toBe(true)
    expect(lesson.prerequisites).toContain('lesson.m5-08')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
    expect(lesson.objectivesEn).toHaveLength(lesson.objectivesEs.length)
    expect(lesson.skillIds).toEqual(['skill.augmented-sixth'])
    expect(lesson.exerciseIds).toHaveLength(4)
  })

  it('explica el intervalo y las tres variantes', () => {
    const text = lesson.sections
      .map((section) => `${section.titleEs} ${section.bodyEs ?? ''}`)
      .join(' ')
      .toLowerCase()

    for (const term of [
      'sexta aumentada',
      'italiana',
      'francesa',
      'alemana',
      '♭vi',
      '♯iv',
      'dominante',
    ]) {
      expect(text, `Falta el concepto: ${term}`).toContain(term)
    }

    const english = lesson.sections
      .map((section) => `${section.titleEn} ${section.bodyEn ?? ''}`)
      .join(' ')
      .toLowerCase()
    for (const term of [
      'augmented sixth',
      'italian',
      'french',
      'german',
      '♭vi',
      '♯iv',
      'dominant',
    ]) {
      expect(english, `Missing concept: ${term}`).toContain(term)
    }
  })

  it('demuestra las tres variantes y su resolución en La menor', () => {
    const demos = scoreSections(lesson)
    expect(demos).toHaveLength(1)

    const demo = demos[0]
    expect(demo.sectionId).toBe('sec.m5-11.demo')
    expect(demo.score.key).toBe('A')
    expect(demo.score.mode).toBe('minor')
    expect(scoreKeySignature(demo.score)).toBe('Am')
    expect(eventMidis(demo.score)).toEqual([
      [65, 69, 75],
      [64, 68, 71],
      [65, 69, 71, 75],
      [64, 68, 71],
      [65, 69, 72, 75],
      [64, 69, 72],
      [64, 68, 71],
    ])
  })

  it('muestra una sexta aumentada real en cada variante', () => {
    const scores: Record<string, string[]> = {
      'ex.m5-11.a': ['F', 'A', 'D#'],
      'ex.m5-11.b': ['F', 'A', 'B', 'D#'],
      'ex.m5-11.c': ['Ab', 'C', 'Eb', 'F#'],
      'ex.m5-11.d': ['F', 'A', 'C', 'D#'],
    }

    for (const exercise of lessonExercises(lesson, bundle)) {
      if (exercise.type !== 'augmented-sixth') continue
      const pitches = pitchesOf(exercise.score)
      const names = pitches.map(
        (pitch) => `${pitch.step}${pitch.accidental}`,
      )
      expect(names, exercise.id).toEqual(scores[exercise.id])

      const flatSixth = pitches[0]
      const raisedFourth = pitches[pitches.length - 1]
      const interval = intervalBetween(
        fromSpelledPitch(flatSixth),
        fromSpelledPitch(raisedFourth),
      )
      expect(interval.simpleNumber, exercise.id).toBe(6)
      expect(interval.quality, exercise.id).toBe('augmented')
    }
  })

  it('pide reconocer las tres variantes y resolver la alemana', () => {
    const byId = new Map(
      lessonExercises(lesson, bundle).map((exercise) => [exercise.id, exercise]),
    )

    for (const expected of IDENTIFY_EXERCISES) {
      const exercise = byId.get(expected.id)
      expect(exercise, expected.id).toBeDefined()
      if (!exercise || exercise.type !== 'augmented-sixth') continue

      expect(exercise.key, expected.id).toBe(expected.key)
      expect(exercise.mode, expected.id).toBe(expected.mode)
      expect(scoreKeySignature(exercise.score), expected.id).toBe(
        `${expected.key}m`,
      )
      expect(exercise.variant, expected.id).toBe(expected.variant)
      expect(exercise.ask, expected.id).toBe('identify')
      expect(exercise.optional, expected.id).toBe(true)
      expect(exercise.skillId, expected.id).toBe('skill.augmented-sixth')

      const spanish = resolveExerciseAnswer(exercise, 'es')
      const english = resolveExerciseAnswer(exercise, 'en')
      expect(spanish.mode, `${exercise.id} modo ES`).toBe('choice')
      expect(english.mode, `${exercise.id} modo EN`).toBe('choice')
      if (spanish.mode !== 'choice' || english.mode !== 'choice') continue

      expect(spanish.answer, `${exercise.id} respuesta ES`).toBe(
        AUGMENTED_SIXTH_LABELS[expected.variant][0],
      )
      expect(english.answer, `${exercise.id} respuesta EN`).toBe(
        AUGMENTED_SIXTH_LABELS[expected.variant][1],
      )
      expect(exerciseChoices(exercise, 'es') ?? []).toContain(spanish.answer)
      expect(exerciseChoices(exercise, 'en') ?? []).toContain(english.answer)
    }

    const resolve = byId.get('ex.m5-11.d')
    expect(resolve).toBeDefined()
    if (!resolve || resolve.type !== 'augmented-sixth') {
      throw new Error('Falta el ejercicio de resolución')
    }
    expect(resolve.variant).toBe('german')
    expect(resolve.ask).toBe('resolve')
    expect(resolve.optional).toBe(true)

    const spanish = resolveExerciseAnswer(resolve, 'es')
    const english = resolveExerciseAnswer(resolve, 'en')
    expect(spanish.mode).toBe('choice')
    expect(english.mode).toBe('choice')
    if (spanish.mode === 'choice') expect(spanish.answer).toBe('V')
    if (english.mode === 'choice') expect(english.answer).toBe('V')
  })

  it('incluye una tarea de teclado con las tres variantes en La menor', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.tempoBpm).toBe(60)
    expect(task?.keys.length).toBeGreaterThanOrEqual(7)
    expect(task?.checklistEs.length).toBeGreaterThanOrEqual(3)
    expect(task?.checklistEn).toHaveLength(task?.checklistEs.length ?? 0)
    expect(task?.instructionsEs).toMatch(/Fa-La-Re♯/)
    expect(task?.instructionsEs).toMatch(/Fa-La-Si-Re♯/)
    expect(task?.instructionsEs).toMatch(/Fa-La-Do-Re♯/)

    const demo = task?.demoScore
    expect(demo).toBeDefined()
    if (!demo) throw new Error('Falta la demo de la tarea')
    expect(demo.key).toBe('A')
    expect(demo.mode).toBe('minor')
    expect(eventMidis(demo)).toHaveLength(7)
    expect(eventMidis(demo)[0]).toEqual([65, 69, 75])
    expect(eventMidis(demo)[4]).toEqual([65, 69, 72, 75])
  })

  it('registra la habilidad de las sextas aumentadas', () => {
    const skill = bundle.skills.find(
      (item) => item.id === 'skill.augmented-sixth',
    )
    expect(skill).toBeDefined()
    expect(skill?.kind).toBe('roman-numeral')
    expect(skill?.lessonIds).toContain('lesson.m5-11')
    expect(skill?.labelEs.length).toBeGreaterThan(0)
    expect(skill?.labelEn.length).toBeGreaterThan(0)
    expect(skill?.params.variants).toEqual(['italian', 'french', 'german'])
  })
})
