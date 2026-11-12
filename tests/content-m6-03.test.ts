import { beforeAll, describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { exerciseChoices } from '../src/content/localize'
import { rhythmicValueBeats } from '../src/content/score'
import { validateContentBundle } from '../src/content/validate'
import { resolveExerciseAnswer } from '../src/exercises/answer'
import { fromSpelledPitch, midiOf } from '../src/theory'
import type { ContentBundle, Exercise, Lesson, Score } from '../src/schemas'

const RONDO = {
  es: 'Rondó (ABACA)',
  en: 'Rondo (ABACA)',
  labels: ['A', 'B', 'A', 'C', 'A'],
}
const SONATA = {
  es: 'Forma sonata (exposición-desarrollo-recapitulación)',
  en: 'Sonata form (exposition-development-recapitulation)',
  labels: ['A', 'B', 'A'],
}

const EXPECTED: Record<
  string,
  { form: 'rondo' | 'sonata'; es: string; en: string; labels: string[] }
> = {
  'ex.m6-03.a': { form: 'rondo', ...RONDO },
  'ex.m6-03.b': { form: 'rondo', ...RONDO },
  'ex.m6-03.c': { form: 'rondo', ...RONDO },
  'ex.m6-03.d': { form: 'rondo', ...RONDO },
  'ex.m6-03.e': { form: 'rondo', ...RONDO },
  'ex.m6-03.f': { form: 'rondo', ...RONDO },
  'ex.m6-03.g': { form: 'sonata', ...SONATA },
  'ex.m6-03.h': { form: 'sonata', ...SONATA },
  'ex.m6-03.i': { form: 'sonata', ...SONATA },
  'ex.m6-03.j': { form: 'sonata', ...SONATA },
  'ex.m6-03.k': { form: 'sonata', ...SONATA },
  'ex.m6-03.l': { form: 'sonata', ...SONATA },
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
  const found = bundle.lessons.find((item) => item.id === 'lesson.m6-03')
  if (!found) throw new Error('Falta la lección M6-03')
  lesson = found
})

describe('M6-03 — Rondó y sonata', () => {
  it('está publicada, validada y depende de M6-02', () => {
    expect(lesson.moduleId).toBe('M6')
    expect(lesson.slug).toBe('rondo-y-sonata')
    expect(lesson.status).toBe('published')
    expect(lesson.prerequisites).toContain('lesson.m6-02')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
    expect(lesson.objectivesEn).toHaveLength(lesson.objectivesEs.length)
    expect(lesson.skillIds).toEqual(['skill.rondo-sonata'])
    expect(lesson.exerciseIds).toHaveLength(12)
  })

  it('explica el rondó y la forma sonata', () => {
    const text = lesson.sections
      .map((section) => `${section.titleEs} ${section.bodyEs ?? ''}`)
      .join(' ')
      .toLowerCase()

    for (const term of [
      'rondó',
      'estribillo',
      'episodio',
      'abaca',
      'sonata',
      'exposición',
      'desarrollo',
      'recapitulación',
      'dominante',
      'tónica',
      'para elisa',
      'k. 545',
    ]) {
      expect(text, `Falta el concepto: ${term}`).toContain(term)
    }

    const english = lesson.sections
      .map((section) => `${section.titleEn} ${section.bodyEn ?? ''}`)
      .join(' ')
      .toLowerCase()
    for (const term of [
      'rondo',
      'refrain',
      'episode',
      'abaca',
      'sonata form',
      'exposition',
      'development',
      'recapitulation',
      'dominant',
      'tonic',
      'für elise',
      'k. 545',
    ]) {
      expect(english, `Missing concept: ${term}`).toContain(term)
    }
  })

  it('incluye demos de rondó y sonata con compases completos', () => {
    const demos = scoreSections(lesson)
    expect(demos).toHaveLength(2)

    const expected: Record<string, number[][]> = {
      'sec.m6-03.demo-rondo': [
        [60, 64, 67],
        [64, 62, 60],
        [67],
        [69, 67, 65],
        [64, 62, 60],
        [62],
        [60, 64, 67],
        [64, 62, 60],
        [67],
        [65, 69, 72],
        [71, 69, 67],
        [65],
        [60, 64, 67],
        [64, 62, 60],
        [67],
      ],
      'sec.m6-03.demo-sonata': [
        [60, 62, 64, 67],
        [64, 60],
        [62, 64, 65, 67],
        [67],
        [69, 67, 65, 64],
        [65, 64, 62, 60],
        [62, 64, 65, 67],
        [69],
        [60, 62, 64, 67],
        [64, 60],
        [62, 64, 65, 67],
        [72],
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
        expect(
          measureBeats(demo.score, measure),
          `${demo.sectionId} c.${measure}`,
        ).toBe(demo.score.timeSignature.numerator)
      }
    }

    expect(demos[0].score.timeSignature.numerator).toBe(3)
    expect(demos[1].score.timeSignature.numerator).toBe(4)
  })

  it('planta doce ejercicios de análisis formal', () => {
    const exercises = lessonExercises(lesson, bundle)
    expect(exercises).toHaveLength(12)
    expect(exercises.every((exercise) => exercise.type === 'form-analysis')).toBe(
      true,
    )

    const byId = new Map(exercises.map((exercise) => [exercise.id, exercise]))
    for (const [id, expected] of Object.entries(EXPECTED)) {
      const exercise = byId.get(id)
      expect(exercise, id).toBeDefined()
      if (!exercise || exercise.type !== 'form-analysis') continue

      expect(exercise.form, id).toBe(expected.form)
      expect(exercise.ask, id).toBe('form')
      expect(exercise.skillId, id).toBe('skill.rondo-sonata')
      expect(exercise.sections.map((section) => section.label), id).toEqual(
        expected.labels,
      )

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
      expect(choicesEs ?? [], `${id} cantidad de opciones`).toHaveLength(4)
      expect(
        (choicesEs ?? []).indexOf(spanish.answer),
        `${id} índice de la respuesta`,
      ).toBe((choicesEn ?? []).indexOf(english.answer))
    }
  })

  it('ordena las secciones dentro de la partitura y respeta la forma declarada', () => {
    const exercises = lessonExercises(lesson, bundle).filter(
      (exercise) => exercise.type === 'form-analysis',
    )

    for (const exercise of exercises) {
      if (exercise.type !== 'form-analysis') continue
      const maxMeasure = Math.max(
        ...exercise.score.events.map((event) => event.measure),
      )
      let previousEnd = 0
      for (const section of exercise.sections) {
        expect(
          section.startMeasure,
          `${exercise.id} ${section.id}`,
        ).toBeGreaterThanOrEqual(1)
        expect(
          section.endMeasure,
          `${exercise.id} ${section.id}`,
        ).toBeLessThanOrEqual(maxMeasure)
        expect(
          section.startMeasure,
          `${exercise.id} ${section.id}`,
        ).toBeLessThanOrEqual(section.endMeasure)
        expect(
          section.startMeasure,
          `${exercise.id} ${section.id} orden`,
        ).toBeGreaterThan(previousEnd)
        previousEnd = section.endMeasure
      }

      const labels = exercise.sections.map((section) => section.label)
      if (exercise.form === 'rondo') {
        expect(labels, exercise.id).toEqual(['A', 'B', 'A', 'C', 'A'])
        expect(exercise.sections, exercise.id).toHaveLength(5)
      } else {
        expect(exercise.form, exercise.id).toBe('sonata')
        expect(labels, exercise.id).toEqual(['A', 'B', 'A'])
        expect(exercise.sections, exercise.id).toHaveLength(3)
      }
    }
  })

  it('reparte las preguntas entre rondó y sonata', () => {
    const exercises = lessonExercises(lesson, bundle).filter(
      (exercise) => exercise.type === 'form-analysis',
    )
    const forms = exercises.map((exercise) =>
      exercise.type === 'form-analysis' ? exercise.form : null,
    )
    expect(forms.filter((form) => form === 'rondo')).toHaveLength(6)
    expect(forms.filter((form) => form === 'sonata')).toHaveLength(6)

    for (const exercise of exercises) {
      if (exercise.type !== 'form-analysis') continue
      const measures = new Set(
        exercise.score.events.map((event) => event.measure),
      )
      for (const measure of measures) {
        expect(
          measureBeats(exercise.score, measure),
          `${exercise.id} c.${measure}`,
        ).toBe(exercise.score.timeSignature.numerator)
      }
    }
  })

  it('incluye una tarea de teclado sobre el rondó', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.tempoBpm).toBe(84)
    expect(task?.keys.length).toBeGreaterThanOrEqual(7)
    expect(task?.checklistEs.length).toBeGreaterThanOrEqual(3)
    expect(task?.checklistEn).toHaveLength(task?.checklistEs.length ?? 0)
    expect(task?.instructionsEs).toMatch(/«A», «B», «A», «C» y «A»/)

    const demo = task?.demoScore
    expect(demo).toBeDefined()
    if (!demo) throw new Error('Falta la demo de la tarea')
    expect(demo.key).toBe('C')
    expect(demo.mode).toBe('major')
    expect(eventMidis(demo)).toEqual([
      [60, 64, 67],
      [64, 62, 60],
      [67],
      [69, 67, 65],
      [64, 62, 60],
      [62],
      [60, 64, 67],
      [64, 62, 60],
      [67],
      [65, 69, 72],
      [71, 69, 67],
      [65],
      [60, 64, 67],
      [64, 62, 60],
      [67],
    ])
  })

  it('registra la habilidad de rondó y sonata', () => {
    const skill = bundle.skills.find((item) => item.id === 'skill.rondo-sonata')
    expect(skill).toBeDefined()
    expect(skill?.kind).toBe('form')
    expect(skill?.lessonIds).toContain('lesson.m6-03')
    expect(skill?.labelEs.length).toBeGreaterThan(0)
    expect(skill?.labelEn.length).toBeGreaterThan(0)
    expect(skill?.params.topics).toEqual(['rondo', 'sonata-form', 'sections'])
  })
})
