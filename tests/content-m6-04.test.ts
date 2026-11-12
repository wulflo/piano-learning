import { beforeAll, describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { exerciseChoices } from '../src/content/localize'
import { rhythmicValueBeats } from '../src/content/score'
import { validateContentBundle } from '../src/content/validate'
import { resolveExerciseAnswer } from '../src/exercises/answer'
import { fromSpelledPitch, midiOf } from '../src/theory'
import type { ContentBundle, Exercise, Lesson, Score } from '../src/schemas'

const MONOPHONY = {
  es: 'Monofonía (una sola línea melódica)',
  en: 'Monophony (a single melodic line)',
}
const HOMOPHONY = {
  es: 'Homofonía (melodía con acordes)',
  en: 'Homophony (melody with chords)',
}
const POLYPHONY = {
  es: 'Polifonía (dos o más líneas independientes)',
  en: 'Polyphony (two or more independent lines)',
}

const EXPECTED: Record<
  string,
  { texture: 'monophony' | 'homophony' | 'polyphony'; es: string; en: string; voices: number }
> = {
  'ex.m6-04.a': { texture: 'monophony', voices: 1, ...MONOPHONY },
  'ex.m6-04.b': { texture: 'monophony', voices: 1, ...MONOPHONY },
  'ex.m6-04.c': { texture: 'monophony', voices: 1, ...MONOPHONY },
  'ex.m6-04.d': { texture: 'monophony', voices: 1, ...MONOPHONY },
  'ex.m6-04.e': { texture: 'homophony', voices: 1, ...HOMOPHONY },
  'ex.m6-04.f': { texture: 'homophony', voices: 1, ...HOMOPHONY },
  'ex.m6-04.g': { texture: 'homophony', voices: 1, ...HOMOPHONY },
  'ex.m6-04.h': { texture: 'homophony', voices: 1, ...HOMOPHONY },
  'ex.m6-04.i': { texture: 'polyphony', voices: 2, ...POLYPHONY },
  'ex.m6-04.j': { texture: 'polyphony', voices: 2, ...POLYPHONY },
  'ex.m6-04.k': { texture: 'polyphony', voices: 2, ...POLYPHONY },
  'ex.m6-04.l': { texture: 'polyphony', voices: 2, ...POLYPHONY },
}

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
  const measures = new Map<number, number[]>()
  for (const event of score.events) {
    const midis = measures.get(event.measure) ?? []
    midis.push(...event.pitches.map((pitch) => midiOf(fromSpelledPitch(pitch))))
    measures.set(event.measure, midis)
  }
  return [...measures.entries()]
    .sort(([first], [second]) => first - second)
    .map(([, midis]) => midis)
}

function measureBeats(score: Score, measure: number, voice = 1): number {
  return score.events
    .filter((event) => event.measure === measure && event.voice === voice)
    .reduce((total, event) => total + rhythmicValueBeats(event.value), 0)
}

function simultaneousGroups(score: Score): number[] {
  const groups = new Map<string, number>()
  for (const event of score.events) {
    const key = `${event.measure}:${event.beat}`
    groups.set(key, (groups.get(key) ?? 0) + 1)
  }
  return [...groups.values()].filter((count) => count > 1)
}

let bundle: ContentBundle
let lesson: Lesson

beforeAll(async () => {
  const result = validateContentBundle(await loadContentFromDisk())
  expect(result.ok).toBe(true)
  if (!result.bundle) throw new Error('El contenido del repositorio no es válido')
  bundle = result.bundle
  const found = bundle.lessons.find((item) => item.id === 'lesson.m6-04')
  if (!found) throw new Error('Falta la lección M6-04')
  lesson = found
})

describe('M6-04 — Texturas: monofonía, homofonía, polifonía', () => {
  it('está publicada, validada y depende de M6-03', () => {
    expect(lesson.moduleId).toBe('M6')
    expect(lesson.slug).toBe('texturas-monofonia-homofonia-polifonia')
    expect(lesson.status).toBe('published')
    expect(lesson.prerequisites).toContain('lesson.m6-03')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
    expect(lesson.objectivesEn).toHaveLength(lesson.objectivesEs.length)
    expect(lesson.skillIds).toEqual(['skill.texture'])
    expect(lesson.exerciseIds).toHaveLength(12)
  })

  it('explica las tres texturas con ejemplos de dominio público', () => {
    const text = lesson.sections
      .map((section) => `${section.titleEs} ${section.bodyEs ?? ''}`)
      .join(' ')
      .toLowerCase()

    for (const term of [
      'monofonía',
      'homofonía',
      'polifonía',
      'melodía',
      'acompañamiento',
      'acordes',
      'voces independientes',
      'canon',
      'fuga',
      'canto gregoriano',
      'bach',
    ]) {
      expect(text, `Falta el concepto: ${term}`).toContain(term)
    }

    const english = lesson.sections
      .map((section) => `${section.titleEn} ${section.bodyEn ?? ''}`)
      .join(' ')
      .toLowerCase()
    for (const term of [
      'monophony',
      'homophony',
      'polyphony',
      'melody',
      'accompaniment',
      'chords',
      'independent',
      'canon',
      'fugue',
      'gregorian chant',
      'bach',
    ]) {
      expect(english, `Missing concept: ${term}`).toContain(term)
    }
  })

  it('incluye demos de las tres texturas con compases completos', () => {
    const demos = scoreSections(lesson)
    expect(demos).toHaveLength(3)

    const expected: Record<string, number[][]> = {
      'sec.m6-04.demo-monofonia': [
        [60, 64, 67, 64],
        [62, 65, 69, 65],
        [64, 67, 71, 67],
        [72],
        [69, 67, 65, 64],
        [62, 64, 65, 62],
        [64, 65, 67, 69],
        [72],
      ],
      'sec.m6-04.demo-homofonia': [
        [60, 64, 67, 60, 64, 67],
        [62, 65, 69, 62, 65, 69],
        [64, 67, 71, 64, 67, 71],
        [60, 64, 67],
        [69, 72, 76, 69, 72, 76],
        [65, 69, 72, 65, 69, 72],
        [67, 71, 74, 67, 71, 74],
        [60, 64, 67],
      ],
      'sec.m6-04.demo-polifonia': [
        [60, 64, 67, 64],
        [62, 65, 69, 65],
        [64, 67, 71, 67, 67, 64],
        [72, 69, 65],
        [71, 67],
        [72],
      ],
    }

    for (const demo of demos) {
      expect(demo.score.key, demo.sectionId).toBe('C')
      expect(demo.score.mode, demo.sectionId).toBe('major')
      expect(eventMidis(demo.score), demo.sectionId).toEqual(
        expected[demo.sectionId],
      )
      const voices = new Set(demo.score.events.map((event) => event.voice))
      for (const voice of voices) {
        const measures = new Set(
          demo.score.events
            .filter((event) => event.voice === voice)
            .map((event) => event.measure),
        )
        for (const measure of measures) {
          expect(
            measureBeats(demo.score, measure, voice),
            `${demo.sectionId} v.${voice} c.${measure}`,
          ).toBe(demo.score.timeSignature.numerator)
        }
      }
    }

    const monophony = demos.find(
      (demo) => demo.sectionId === 'sec.m6-04.demo-monofonia',
    )
    expect(monophony?.score.events.every((event) => event.pitches.length === 1)).toBe(
      true,
    )
    const homophony = demos.find(
      (demo) => demo.sectionId === 'sec.m6-04.demo-homofonia',
    )
    expect(homophony?.score.events.every((event) => event.pitches.length >= 2)).toBe(
      true,
    )
    const polyphony = demos.find(
      (demo) => demo.sectionId === 'sec.m6-04.demo-polifonia',
    )
    expect(simultaneousGroups(polyphony?.score as Score).length).toBeGreaterThanOrEqual(
      2,
    )
  })

  it('planta doce ejercicios de análisis de textura', () => {
    const exercises = lessonExercises(lesson, bundle)
    expect(exercises).toHaveLength(12)
    expect(
      exercises.every((exercise) => exercise.type === 'texture-analysis'),
    ).toBe(true)

    const byId = new Map(exercises.map((exercise) => [exercise.id, exercise]))
    for (const [id, expected] of Object.entries(EXPECTED)) {
      const exercise = byId.get(id)
      expect(exercise, id).toBeDefined()
      if (!exercise || exercise.type !== 'texture-analysis') continue

      expect(exercise.texture, id).toBe(expected.texture)
      expect(exercise.voices, id).toBe(expected.voices)
      expect(exercise.skillId, id).toBe('skill.texture')

      const spanish = resolveExerciseAnswer(exercise, 'es')
      const english = resolveExerciseAnswer(exercise, 'en')
      expect(spanish.mode, `${id} modo ES`).toBe('choice')
      expect(english.mode, `${id} modo EN`).toBe('choice')
      if (spanish.mode !== 'choice' || english.mode !== 'choice') continue

      expect(spanish.answer, `${id} respuesta ES`).toBe(expected.es)
      expect(english.answer, `${id} respuesta EN`).toBe(expected.en)

      const choicesEs = exerciseChoices(exercise, 'es')
      const choicesEn = exerciseChoices(exercise, 'en')
      expect(choicesEs ?? [], `${id} opciones ES`).toContain(spanish.answer)
      expect(choicesEn ?? [], `${id} opciones EN`).toContain(english.answer)
      expect(choicesEs ?? [], `${id} cantidad de opciones`).toHaveLength(3)
      expect(
        (choicesEs ?? []).indexOf(spanish.answer),
        `${id} índice de la respuesta`,
      ).toBe((choicesEn ?? []).indexOf(english.answer))
    }
  })

  it('respeta la estructura de cada textura y completa sus compases', () => {
    const exercises = lessonExercises(lesson, bundle).filter(
      (exercise) => exercise.type === 'texture-analysis',
    )

    for (const exercise of exercises) {
      if (exercise.type !== 'texture-analysis') continue
      const voices = new Set(exercise.score.events.map((event) => event.voice))
      expect(voices.size, `${exercise.id} voces notadas`).toBe(exercise.voices)

      for (const voice of voices) {
        const measures = new Set(
          exercise.score.events
            .filter((event) => event.voice === voice)
            .map((event) => event.measure),
        )
        for (const measure of measures) {
          expect(
            measureBeats(exercise.score, measure, voice),
            `${exercise.id} v.${voice} c.${measure}`,
          ).toBe(exercise.score.timeSignature.numerator)
        }
      }

      const chordal = exercise.score.events.some(
        (event) => event.pitches.length > 1,
      )
      if (exercise.texture === 'monophony') {
        expect(chordal, `${exercise.id} sin acordes`).toBe(false)
        expect(
          exercise.score.events.every((event) => event.pitches.length === 1),
          `${exercise.id} una sola nota por evento`,
        ).toBe(true)
        expect(simultaneousGroups(exercise.score), exercise.id).toHaveLength(0)
      }
      if (exercise.texture === 'homophony') {
        expect(chordal, `${exercise.id} con acordes`).toBe(true)
        expect(simultaneousGroups(exercise.score), exercise.id).toHaveLength(0)
      }
      if (exercise.texture === 'polyphony') {
        expect(voices.size, exercise.id).toBeGreaterThanOrEqual(2)
        expect(
          simultaneousGroups(exercise.score).length,
          `${exercise.id} voces simultáneas`,
        ).toBeGreaterThanOrEqual(2)
      }
    }
  })

  it('reparte las preguntas entre las tres texturas', () => {
    const exercises = lessonExercises(lesson, bundle).filter(
      (exercise) => exercise.type === 'texture-analysis',
    )
    const textures = exercises.map((exercise) =>
      exercise.type === 'texture-analysis' ? exercise.texture : null,
    )
    expect(textures.filter((texture) => texture === 'monophony')).toHaveLength(4)
    expect(textures.filter((texture) => texture === 'homophony')).toHaveLength(4)
    expect(textures.filter((texture) => texture === 'polyphony')).toHaveLength(4)
  })

  it('incluye una tarea de teclado que compara monofonía y homofonía', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.tempoBpm).toBe(84)
    expect(task?.keys.length).toBeGreaterThanOrEqual(7)
    expect(task?.checklistEs.length).toBeGreaterThanOrEqual(3)
    expect(task?.checklistEn).toHaveLength(task?.checklistEs.length ?? 0)
    expect(task?.instructionsEs).toMatch(/«monofonía» y «homofonía»/)

    const demo = task?.demoScore
    expect(demo).toBeDefined()
    if (!demo) throw new Error('Falta la demo de la tarea')
    expect(demo.key).toBe('C')
    expect(demo.mode).toBe('major')
    expect(demo.events.every((event) => event.pitches.length >= 2)).toBe(true)
    expect(eventMidis(demo)).toEqual([
      [60, 64, 67, 60, 64, 67],
      [62, 65, 69, 62, 65, 69],
      [64, 67, 71, 64, 67, 71],
      [60, 64, 67],
      [69, 72, 76, 69, 72, 76],
      [65, 69, 72, 65, 69, 72],
      [67, 71, 74, 67, 71, 74],
      [60, 64, 67],
    ])
  })

  it('registra la habilidad de textura musical', () => {
    const skill = bundle.skills.find((item) => item.id === 'skill.texture')
    expect(skill).toBeDefined()
    expect(skill?.kind).toBe('texture')
    expect(skill?.lessonIds).toContain('lesson.m6-04')
    expect(skill?.labelEs.length).toBeGreaterThan(0)
    expect(skill?.labelEn.length).toBeGreaterThan(0)
    expect(skill?.params.topics).toEqual([
      'monophony',
      'homophony',
      'polyphony',
    ])
  })
})
