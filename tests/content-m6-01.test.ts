import { beforeAll, describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { exerciseChoices } from '../src/content/localize'
import { rhythmicValueBeats } from '../src/content/score'
import { validateContentBundle } from '../src/content/validate'
import { resolveExerciseAnswer } from '../src/exercises/answer'
import { fromSpelledPitch, midiOf } from '../src/theory'
import type { ContentBundle, Exercise, Lesson, Score } from '../src/schemas'

const EXPECTED: Record<
  string,
  { ask: 'motive-count' | 'phrase-count' | 'phrase-end'; es: string; en: string }
> = {
  'ex.m6-01.a': { ask: 'motive-count', es: '4 motivos', en: '4 motives' },
  'ex.m6-01.b': { ask: 'motive-count', es: '2 motivos', en: '2 motives' },
  'ex.m6-01.c': { ask: 'motive-count', es: '3 motivos', en: '3 motives' },
  'ex.m6-01.d': { ask: 'motive-count', es: '3 motivos', en: '3 motives' },
  'ex.m6-01.e': { ask: 'phrase-count', es: '2 frases', en: '2 phrases' },
  'ex.m6-01.f': { ask: 'phrase-count', es: '3 frases', en: '3 phrases' },
  'ex.m6-01.g': { ask: 'phrase-count', es: '4 frases', en: '4 phrases' },
  'ex.m6-01.h': { ask: 'phrase-count', es: '3 frases', en: '3 phrases' },
  'ex.m6-01.i': { ask: 'phrase-end', es: 'Compás 4', en: 'Measure 4' },
  'ex.m6-01.j': { ask: 'phrase-end', es: 'Compás 8', en: 'Measure 8' },
  'ex.m6-01.k': { ask: 'phrase-end', es: 'Compás 3', en: 'Measure 3' },
  'ex.m6-01.l': { ask: 'phrase-end', es: 'Compás 12', en: 'Measure 12' },
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

function measureBeats(score: Score, measure: number): number {
  return score.events
    .filter((event) => event.measure === measure)
    .reduce((total, event) => total + rhythmicValueBeats(event.value), 0)
}

let bundle: ContentBundle
let lesson: Lesson

beforeAll(async () => {
  const result = validateContentBundle(await loadContentFromDisk())
  expect(result.ok).toBe(true)
  if (!result.bundle) throw new Error('El contenido del repositorio no es válido')
  bundle = result.bundle
  const found = bundle.lessons.find((item) => item.id === 'lesson.m6-01')
  if (!found) throw new Error('Falta la lección M6-01')
  lesson = found
})

describe('M6-01 — Motivo y frase', () => {
  it('está publicada, validada y depende de M5-09', () => {
    expect(lesson.moduleId).toBe('M6')
    expect(lesson.slug).toBe('motivo-y-frase')
    expect(lesson.status).toBe('published')
    expect(lesson.prerequisites).toContain('lesson.m5-09')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
    expect(lesson.objectivesEn).toHaveLength(lesson.objectivesEs.length)
    expect(lesson.skillIds).toEqual(['skill.motive-phrase'])
    expect(lesson.exerciseIds).toHaveLength(12)
  })

  it('explica el motivo, la frase y el desarrollo motívico', () => {
    const text = lesson.sections
      .map((section) => `${section.titleEs} ${section.bodyEs ?? ''}`)
      .join(' ')
      .toLowerCase()

    for (const term of [
      'motivo',
      'frase',
      'semifrase',
      'cadencia',
      'repetición',
      'secuencia',
      'inversión',
      'aumentación',
      'disminución',
    ]) {
      expect(text, `Falta el concepto: ${term}`).toContain(term)
    }

    const english = lesson.sections
      .map((section) => `${section.titleEn} ${section.bodyEn ?? ''}`)
      .join(' ')
      .toLowerCase()
    for (const term of [
      'motive',
      'phrase',
      'semifrase',
      'cadence',
      'repetition',
      'sequence',
      'inversion',
      'augmentation',
      'diminution',
    ]) {
      expect(english, `Missing concept: ${term}`).toContain(term)
    }
  })

  it('incluye dos demos originales con compases completos', () => {
    const demos = scoreSections(lesson)
    expect(demos).toHaveLength(2)

    const expected: Record<string, number[][]> = {
      'sec.m6-01.demo-motivo': [
        [64, 62, 60, 62],
        [64, 67, 67],
        [65, 64, 62, 64],
        [62, 55],
        [69, 67, 65, 67],
        [69, 72, 72],
        [67, 65, 64, 62],
        [60],
      ],
      'sec.m6-01.demo-frase': [
        [60, 62, 64, 67],
        [64, 60],
        [62, 64, 65, 62],
        [67],
      ],
    }

    for (const demo of demos) {
      expect(demo.score.key, demo.sectionId).toBe('C')
      expect(demo.score.mode, demo.sectionId).toBe('major')
      expect(eventMidis(demo.score), demo.sectionId).toEqual(
        expected[demo.sectionId],
      )
      const measures = new Set(demo.score.events.map((event) => event.measure))
      for (const measure of measures) {
        expect(measureBeats(demo.score, measure), `${demo.sectionId} c.${measure}`).toBe(4)
      }
    }
  })

  it('planta doce ejercicios de análisis melódico', () => {
    const exercises = lessonExercises(lesson, bundle)
    expect(exercises).toHaveLength(12)
    expect(exercises.every((exercise) => exercise.type === 'phrase-analysis')).toBe(
      true,
    )

    const byId = new Map(exercises.map((exercise) => [exercise.id, exercise]))
    for (const [id, expected] of Object.entries(EXPECTED)) {
      const exercise = byId.get(id)
      expect(exercise, id).toBeDefined()
      if (!exercise || exercise.type !== 'phrase-analysis') continue

      expect(exercise.ask, id).toBe(expected.ask)
      expect(exercise.skillId, id).toBe('skill.motive-phrase')
      expect(exercise.score.mode, id).toBe('major')
      expect(exercise.score.events.length, `${id} eventos`).toBeGreaterThan(0)

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
      expect(choicesEs, `${id} cuatro opciones`).toHaveLength(4)
      expect(choicesEn, `${id} cuatro opciones EN`).toHaveLength(4)
      expect(
        (choicesEs ?? []).indexOf(spanish.answer),
        `${id} índice de la respuesta`,
      ).toBe((choicesEn ?? []).indexOf(english.answer))
    }
  })

  it('segmenta motivos dentro de frases y deriva la respuesta de los segmentos', () => {
    const exercises = lessonExercises(lesson, bundle).filter(
      (exercise) => exercise.type === 'phrase-analysis',
    )

    for (const exercise of exercises) {
      if (exercise.type !== 'phrase-analysis') continue
      const phrases = exercise.segments.filter(
        (segment) => segment.kind === 'phrase',
      )
      const motives = exercise.segments.filter(
        (segment) => segment.kind === 'motive',
      )
      expect(phrases.length, `${exercise.id} frases`).toBeGreaterThanOrEqual(2)
      expect(motives.length, `${exercise.id} motivos`).toBeGreaterThanOrEqual(2)

      const maxMeasure = Math.max(
        ...exercise.score.events.map((event) => event.measure),
      )
      for (const segment of exercise.segments) {
        expect(segment.startMeasure, `${exercise.id} ${segment.id} inicio`).toBeGreaterThanOrEqual(1)
        expect(segment.endMeasure, `${exercise.id} ${segment.id} fin`).toBeLessThanOrEqual(
          maxMeasure,
        )
        expect(segment.startMeasure, `${exercise.id} ${segment.id}`).toBeLessThanOrEqual(
          segment.endMeasure,
        )
      }
      for (const motive of motives) {
        expect(
          phrases.some(
            (phrase) =>
              motive.startMeasure >= phrase.startMeasure &&
              motive.endMeasure <= phrase.endMeasure,
          ),
          `${exercise.id} ${motive.id} dentro de una frase`,
        ).toBe(true)
      }

      if (exercise.ask === 'motive-count') {
        const resolved = resolveExerciseAnswer(exercise, 'es')
        if (resolved.mode !== 'choice') throw new Error(`${exercise.id} sin respuesta`)
        expect(resolved.answer).toBe(`${motives.length} motivos`)
      } else if (exercise.ask === 'phrase-count') {
        const resolved = resolveExerciseAnswer(exercise, 'es')
        if (resolved.mode !== 'choice') throw new Error(`${exercise.id} sin respuesta`)
        expect(resolved.answer).toBe(`${phrases.length} frases`)
      } else {
        const target = phrases[(exercise.phrase ?? 1) - 1]
        expect(target, `${exercise.id} frase ${exercise.phrase}`).toBeDefined()
        const resolved = resolveExerciseAnswer(exercise, 'es')
        if (resolved.mode !== 'choice') throw new Error(`${exercise.id} sin respuesta`)
        expect(resolved.answer).toBe(`Compás ${target?.endMeasure}`)
      }
    }
  })

  it('reparte las preguntas entre motivos, frases y finales de frase', () => {
    const asks = lessonExercises(lesson, bundle).map((exercise) =>
      exercise.type === 'phrase-analysis' ? exercise.ask : null,
    )
    expect(asks.filter((ask) => ask === 'motive-count')).toHaveLength(4)
    expect(asks.filter((ask) => ask === 'phrase-count')).toHaveLength(4)
    expect(asks.filter((ask) => ask === 'phrase-end')).toHaveLength(4)
    expect(new Set(asks).size).toBe(3)
  })

  it('incluye una tarea de teclado con la melodía segmentada', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.tempoBpm).toBe(88)
    expect(task?.keys.length).toBeGreaterThanOrEqual(8)
    expect(task?.checklistEs.length).toBeGreaterThanOrEqual(3)
    expect(task?.checklistEn).toHaveLength(task?.checklistEs.length ?? 0)
    expect(task?.instructionsEs).toMatch(/compás 4/i)
    expect(task?.instructionsEs).toMatch(/compás 8/i)

    const demo = task?.demoScore
    expect(demo).toBeDefined()
    if (!demo) throw new Error('Falta la demo de la tarea')
    expect(demo.key).toBe('C')
    expect(demo.mode).toBe('major')
    expect(eventMidis(demo)).toEqual([
      [64, 62, 60, 62],
      [64, 67, 67],
      [65, 64, 62, 64],
      [62, 55],
      [69, 67, 65, 67],
      [69, 72, 72],
      [67, 65, 64, 62],
      [60],
    ])
  })

  it('registra la habilidad de forma musical', () => {
    const skill = bundle.skills.find((item) => item.id === 'skill.motive-phrase')
    expect(skill).toBeDefined()
    expect(skill?.kind).toBe('form')
    expect(skill?.lessonIds).toContain('lesson.m6-01')
    expect(skill?.labelEs.length).toBeGreaterThan(0)
    expect(skill?.labelEn.length).toBeGreaterThan(0)
    expect(skill?.params.topics).toEqual(['motive', 'phrase', 'segmentation'])
  })
})
