import { beforeAll, describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { exerciseChoices } from '../src/content/localize'
import { validateContentBundle } from '../src/content/validate'
import { resolveExerciseAnswer } from '../src/exercises/answer'
import {
  diatonicChord,
  fromSpelledPitch,
  midiOf,
  mod12,
  romanNumeralFor,
  qualitiesForMode,
  type Tonic,
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
  Gb: 'Sol♭',
}

const MODULATIONS = [
  { id: 'ex.m5-09.a', from: 'C', to: 'G', degreeFrom: 6, degreeTo: 2, ask: 'source', answer: 'vi' },
  { id: 'ex.m5-09.b', from: 'G', to: 'D', degreeFrom: 6, degreeTo: 2, ask: 'target', answer: 'ii' },
  { id: 'ex.m5-09.c', from: 'D', to: 'A', degreeFrom: 6, degreeTo: 2, ask: 'source', answer: 'vi' },
  { id: 'ex.m5-09.d', from: 'A', to: 'E', degreeFrom: 6, degreeTo: 2, ask: 'target', answer: 'ii' },
  { id: 'ex.m5-09.e', from: 'E', to: 'B', degreeFrom: 6, degreeTo: 2, ask: 'source', answer: 'vi' },
  { id: 'ex.m5-09.f', from: 'B', to: 'F#', degreeFrom: 6, degreeTo: 2, ask: 'target', answer: 'ii' },
  { id: 'ex.m5-09.g', from: 'C', to: 'F', degreeFrom: 2, degreeTo: 6, ask: 'target', answer: 'vi' },
  { id: 'ex.m5-09.h', from: 'F', to: 'Bb', degreeFrom: 2, degreeTo: 6, ask: 'source', answer: 'ii' },
  { id: 'ex.m5-09.i', from: 'Bb', to: 'Eb', degreeFrom: 2, degreeTo: 6, ask: 'target', answer: 'vi' },
  { id: 'ex.m5-09.j', from: 'Eb', to: 'Ab', degreeFrom: 2, degreeTo: 6, ask: 'source', answer: 'ii' },
  { id: 'ex.m5-09.k', from: 'Ab', to: 'Db', degreeFrom: 2, degreeTo: 6, ask: 'target', answer: 'vi' },
  { id: 'ex.m5-09.l', from: 'Db', to: 'Gb', degreeFrom: 2, degreeTo: 6, ask: 'source', answer: 'ii' },
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

function pitchClasses(key: Tonic, degree: number): number[] {
  return diatonicChord(key, 'major', degree)
    .pitches.map((pitch) => mod12(midiOf(pitch)))
    .sort((first, second) => first - second)
}

let bundle: ContentBundle
let lesson: Lesson

beforeAll(async () => {
  const result = validateContentBundle(await loadContentFromDisk())
  expect(result.ok).toBe(true)
  if (!result.bundle) throw new Error('El contenido del repositorio no es válido')
  bundle = result.bundle
  const found = bundle.lessons.find((item) => item.id === 'lesson.m5-09')
  if (!found) throw new Error('Falta la lección M5-09')
  lesson = found
})

describe('M5-09 — Modulación y conducción de voces', () => {
  it('está publicada, validada y depende de M5-08', () => {
    expect(lesson.moduleId).toBe('M5')
    expect(lesson.slug).toBe('modulacion-y-conduccion-de-voces')
    expect(lesson.status).toBe('published')
    expect(lesson.prerequisites).toContain('lesson.m5-08')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
    expect(lesson.objectivesEn).toHaveLength(lesson.objectivesEs.length)
    expect(lesson.skillIds).toEqual(['skill.modulation'])
    expect(lesson.exerciseIds).toHaveLength(12)
  })

  it('explica la modulación, el pivote y las reglas de voces', () => {
    const text = lesson.sections
      .map((section) => `${section.titleEs} ${section.bodyEs ?? ''}`)
      .join(' ')
      .toLowerCase()

    for (const term of [
      'modular',
      'acorde pivote',
      'notas comunes',
      'grados conjuntos',
      'sensible',
      'séptima',
      'quintas',
      'octavas paralelas',
      'tonicización',
    ]) {
      expect(text, `Falta el concepto: ${term}`).toContain(term)
    }

    const english = lesson.sections
      .map((section) => `${section.titleEn} ${section.bodyEn ?? ''}`)
      .join(' ')
      .toLowerCase()
    for (const term of [
      'modulating',
      'pivot chord',
      'common tones',
      'step',
      'leading tone',
      'seventh',
      'parallel fifths',
      'parallel octaves',
      'tonicisation',
    ]) {
      expect(english, `Missing concept: ${term}`).toContain(term)
    }
  })

  it('incluye una demo de modulación y otra de conducción de voces', () => {
    const demos = scoreSections(lesson)
    expect(demos).toHaveLength(2)

    const expected: Record<string, number[][]> = {
      'sec.m5-09.demo-modulacion': [
        [60, 64, 67],
        [57, 60, 64],
        [50, 54, 57, 60],
        [55, 59, 62],
      ],
      'sec.m5-09.demo-voces': [
        [55, 59, 62, 65],
        [55, 60, 64],
      ],
    }

    for (const demo of demos) {
      expect(demo.score.mode, demo.sectionId).toBe('major')
      expect(eventMidis(demo.score), demo.sectionId).toEqual(
        expected[demo.sectionId],
      )
    }
  })

  it('planta doce modulaciones con pivotes compartidos', () => {
    const exercises = lessonExercises(lesson, bundle).filter(
      (exercise) => exercise.type === 'pivot-chord',
    )
    expect(exercises).toHaveLength(12)

    const byId = new Map(exercises.map((exercise) => [exercise.id, exercise]))
    for (const expected of MODULATIONS) {
      const exercise = byId.get(expected.id)
      expect(exercise, expected.id).toBeDefined()
      if (!exercise || exercise.type !== 'pivot-chord') continue

      expect(exercise.fromKey, expected.id).toBe(expected.from)
      expect(exercise.toKey, expected.id).toBe(expected.to)
      expect(exercise.degreeFrom, expected.id).toBe(expected.degreeFrom)
      expect(exercise.degreeTo, expected.id).toBe(expected.degreeTo)
      expect(exercise.ask, expected.id).toBe(expected.ask)
      expect(exercise.skillId, expected.id).toBe('skill.modulation')
      expect(exercise.promptEs, `${expected.id} origen ES`).toContain(
        KEY_ES[expected.from],
      )
      expect(exercise.promptEs, `${expected.id} destino ES`).toContain(
        KEY_ES[expected.to],
      )
      expect(exercise.promptEs, `${expected.id} pregunta`).toMatch(
        /qué número romano/i,
      )

      const spanish = resolveExerciseAnswer(exercise, 'es')
      const english = resolveExerciseAnswer(exercise, 'en')
      expect(spanish.mode, `${exercise.id} modo ES`).toBe('choice')
      expect(english.mode, `${exercise.id} modo EN`).toBe('choice')
      if (spanish.mode !== 'choice' || english.mode !== 'choice') continue

      expect(spanish.answer, `${exercise.id} respuesta ES`).toBe(expected.answer)
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

      const degree = expected.ask === 'source' ? expected.degreeFrom : expected.degreeTo
      const quality = qualitiesForMode('major')[degree - 1]
      expect(romanNumeralFor(degree, quality), `${expected.id} numeral`).toBe(
        expected.answer,
      )

      expect(
        pitchClasses(expected.from as Tonic, expected.degreeFrom),
        `${expected.id} pivote compartido`,
      ).toEqual(pitchClasses(expected.to as Tonic, expected.degreeTo))
    }
  })

  it('reparte las preguntas entre origen y destino', () => {
    expect(MODULATIONS.filter((item) => item.ask === 'source')).toHaveLength(6)
    expect(MODULATIONS.filter((item) => item.ask === 'target')).toHaveLength(6)
    expect(new Set(MODULATIONS.map((item) => item.from)).size).toBeGreaterThan(9)
    expect(new Set(MODULATIONS.map((item) => item.answer))).toEqual(
      new Set(['vi', 'ii']),
    )
  })

  it('incluye una tarea de teclado con la modulación y la resolución', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.tempoBpm).toBe(60)
    expect(task?.keys.length).toBeGreaterThanOrEqual(8)
    expect(task?.checklistEs.length).toBeGreaterThanOrEqual(3)
    expect(task?.checklistEn).toHaveLength(task?.checklistEs.length ?? 0)
    expect(task?.instructionsEs).toMatch(/Lam/)
    expect(task?.instructionsEs).toMatch(/Re7/)
    expect(task?.instructionsEs).toMatch(/Sol7/)

    const demo = task?.demoScore
    expect(demo).toBeDefined()
    if (!demo) throw new Error('Falta la demo de la tarea')
    expect(demo.key).toBe('C')
    expect(demo.mode).toBe('major')
    expect(eventMidis(demo)).toEqual([
      [60, 64, 67],
      [57, 60, 64],
      [50, 54, 57, 60],
      [55, 59, 62],
      [55, 59, 62, 65],
      [60, 64, 67],
    ])
  })

  it('registra la habilidad de modulación', () => {
    const skill = bundle.skills.find((item) => item.id === 'skill.modulation')
    expect(skill).toBeDefined()
    expect(skill?.kind).toBe('roman-numeral')
    expect(skill?.lessonIds).toContain('lesson.m5-09')
    expect(skill?.labelEs.length).toBeGreaterThan(0)
    expect(skill?.labelEn.length).toBeGreaterThan(0)
    expect(skill?.params.topics).toEqual(['pivot-chord', 'voice-leading'])
  })
})
