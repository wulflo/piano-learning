import { beforeAll, describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { exerciseChoices } from '../src/content/localize'
import { validateContentBundle } from '../src/content/validate'
import { resolveExerciseAnswer } from '../src/exercises/answer'
import { fromSpelledPitch, midiOf } from '../src/theory'
import type { ContentBundle, Exercise, Lesson, Score } from '../src/schemas'

const ROMAN_EXERCISES = [
  { id: 'ex.m5-10.a', key: 'C', mode: 'major', numeral: 'bII' },
  { id: 'ex.m5-10.b', key: 'A', mode: 'minor', numeral: 'bII' },
  { id: 'ex.m5-10.c', key: 'G', mode: 'major', numeral: 'bII' },
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
  const found = bundle.lessons.find((item) => item.id === 'lesson.m5-10')
  if (!found) throw new Error('Falta la lección M5-10')
  lesson = found
})

describe('M5-10 — La napolitana', () => {
  it('está publicada, es opcional y depende de M5-08', () => {
    expect(lesson.moduleId).toBe('M5')
    expect(lesson.slug).toBe('napolitana')
    expect(lesson.status).toBe('published')
    expect(lesson.optional).toBe(true)
    expect(lesson.prerequisites).toContain('lesson.m5-08')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
    expect(lesson.objectivesEn).toHaveLength(lesson.objectivesEs.length)
    expect(lesson.skillIds).toEqual(['skill.neapolitan'])
    expect(lesson.exerciseIds).toHaveLength(4)
  })

  it('explica la subdominante rebajada, la primera inversión y la resolución', () => {
    const text = lesson.sections
      .map((section) => `${section.titleEs} ${section.bodyEs ?? ''}`)
      .join(' ')
      .toLowerCase()

    for (const term of [
      'napolitana',
      '♭ii',
      're♭',
      'primera inversión',
      'dominante',
      'subdominante',
    ]) {
      expect(text, `Falta el concepto: ${term}`).toContain(term)
    }

    const english = lesson.sections
      .map((section) => `${section.titleEn} ${section.bodyEn ?? ''}`)
      .join(' ')
      .toLowerCase()
    for (const term of [
      'neapolitan',
      '♭ii',
      'd♭',
      'first inversion',
      'dominant',
      'subdominant',
    ]) {
      expect(english, `Missing concept: ${term}`).toContain(term)
    }
  })

  it('incluye una demo de ♭II6–V–I en Do mayor', () => {
    const demos = scoreSections(lesson)
    expect(demos).toHaveLength(1)

    const demo = demos[0]
    expect(demo.sectionId).toBe('sec.m5-10.demo')
    expect(demo.score.key).toBe('C')
    expect(demo.score.mode).toBe('major')
    expect(eventMidis(demo.score)).toEqual([
      [65, 68, 73],
      [67, 71, 74],
      [60, 64, 67],
    ])
  })

  it('planta tres napolitanas para cifrar y una para escribir sus notas', () => {
    const exercises = lessonExercises(lesson, bundle)
    expect(exercises).toHaveLength(4)
    expect(exercises.every((exercise) => exercise.optional === true)).toBe(true)

    const byId = new Map(exercises.map((exercise) => [exercise.id, exercise]))
    for (const expected of ROMAN_EXERCISES) {
      const exercise = byId.get(expected.id)
      expect(exercise, expected.id).toBeDefined()
      if (!exercise || exercise.type !== 'roman-numeral') continue

      expect(exercise.key, expected.id).toBe(expected.key)
      expect(exercise.mode, expected.id).toBe(expected.mode)
      expect(exercise.numeral, expected.id).toBe(expected.numeral)
      expect(exercise.skillId, expected.id).toBe('skill.neapolitan')
      expect(exercise.promptEs, `${expected.id} pregunta`).toMatch(
        /qué número romano/i,
      )

      const spanish = resolveExerciseAnswer(exercise, 'es')
      const english = resolveExerciseAnswer(exercise, 'en')
      expect(spanish.mode, `${exercise.id} modo ES`).toBe('choice')
      expect(english.mode, `${exercise.id} modo EN`).toBe('choice')
      if (spanish.mode !== 'choice' || english.mode !== 'choice') continue

      expect(spanish.answer, `${exercise.id} respuesta ES`).toBe('bII')
      expect(english.answer, `${exercise.id} respuesta EN`).toBe('bII')
      expect(exerciseChoices(exercise, 'es') ?? []).toContain('bII')
      expect(exerciseChoices(exercise, 'en') ?? []).toContain('bII')
    }
  })

  it('pide la napolitana de Do mayor en primera inversión', () => {
    const exercise = lessonExercises(lesson, bundle).find(
      (item) => item.id === 'ex.m5-10.d',
    )
    expect(exercise).toBeDefined()
    if (!exercise || exercise.type !== 'chord') {
      throw new Error('Falta el ejercicio de acorde')
    }

    expect(exercise.ask).toBe('notes')
    expect(exercise.root).toEqual({ step: 'D', accidental: 'b', octave: 4 })
    expect(exercise.quality).toBe('major')
    expect(exercise.inversion).toBe(1)
    expect(exercise.skillId).toBe('skill.neapolitan')

    const spanish = resolveExerciseAnswer(exercise, 'es')
    const english = resolveExerciseAnswer(exercise, 'en')
    expect(spanish.mode).toBe('choice')
    expect(english.mode).toBe('choice')
    if (spanish.mode === 'choice') expect(spanish.answer).toBe('Fa La♭ Re♭')
    if (english.mode === 'choice') expect(english.answer).toBe('F Ab Db')

    expect(exerciseChoices(exercise, 'es') ?? []).toContain('Fa La♭ Re♭')
    expect(exerciseChoices(exercise, 'en') ?? []).toContain('F Ab Db')
  })

  it('incluye una tarea de teclado con ♭II6–V–I en Do mayor', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.tempoBpm).toBe(60)
    expect(task?.keys.length).toBeGreaterThanOrEqual(8)
    expect(task?.checklistEs.length).toBeGreaterThanOrEqual(3)
    expect(task?.checklistEn).toHaveLength(task?.checklistEs.length ?? 0)
    expect(task?.instructionsEs).toMatch(/Fa-La♭-Re♭/)
    expect(task?.instructionsEs).toMatch(/Sol-Si-Re/)
    expect(task?.instructionsEs).toMatch(/Do-Mi-Sol/)

    const demo = task?.demoScore
    expect(demo).toBeDefined()
    if (!demo) throw new Error('Falta la demo de la tarea')
    expect(demo.key).toBe('C')
    expect(demo.mode).toBe('major')
    expect(eventMidis(demo)).toEqual([
      [65, 68, 73],
      [67, 71, 74],
      [60, 64, 67],
    ])
  })

  it('registra la habilidad de la napolitana', () => {
    const skill = bundle.skills.find((item) => item.id === 'skill.neapolitan')
    expect(skill).toBeDefined()
    expect(skill?.kind).toBe('roman-numeral')
    expect(skill?.lessonIds).toContain('lesson.m5-10')
    expect(skill?.labelEs.length).toBeGreaterThan(0)
    expect(skill?.labelEn.length).toBeGreaterThan(0)
    expect(skill?.params.numerals).toEqual(['bII', 'bII6'])
  })
})
