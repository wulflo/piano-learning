import { beforeAll, describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { exerciseChoices } from '../src/content/localize'
import { rhythmicValueBeats } from '../src/content/score'
import { validateContentBundle } from '../src/content/validate'
import { resolveExerciseAnswer } from '../src/exercises/answer'
import { fromSpelledPitch, midiOf } from '../src/theory'
import type { ContentBundle, Exercise, Lesson, Score } from '../src/schemas'

const BINARY = { es: 'Forma binaria (AB)', en: 'Binary form (AB)' }
const TERNARY = { es: 'Forma ternaria (ABA)', en: 'Ternary form (ABA)' }
const PERIOD = {
  es: 'Período (antecedente y consecuente)',
  en: 'Period (antecedent and consequent)',
}

const EXPECTED: Record<
  string,
  {
    form: 'binary' | 'ternary' | 'period'
    ask: 'form' | 'part'
    labels: string[]
    es: string
    en: string
  }
> = {
  'ex.m6-02.a': { form: 'binary', ask: 'form', labels: ['A', 'B'], ...BINARY },
  'ex.m6-02.b': { form: 'binary', ask: 'form', labels: ['A', 'B'], ...BINARY },
  'ex.m6-02.c': { form: 'binary', ask: 'form', labels: ['A', 'B'], ...BINARY },
  'ex.m6-02.d': { form: 'binary', ask: 'form', labels: ['A', 'B'], ...BINARY },
  'ex.m6-02.e': { form: 'ternary', ask: 'form', labels: ['A', 'B', 'A'], ...TERNARY },
  'ex.m6-02.f': { form: 'ternary', ask: 'form', labels: ['A', 'B', 'A'], ...TERNARY },
  'ex.m6-02.g': { form: 'ternary', ask: 'form', labels: ['A', 'B', 'A'], ...TERNARY },
  'ex.m6-02.h': { form: 'ternary', ask: 'form', labels: ['A', 'B', 'A'], ...TERNARY },
  'ex.m6-02.i': { form: 'period', ask: 'form', labels: ['A', 'B'], ...PERIOD },
  'ex.m6-02.j': { form: 'period', ask: 'form', labels: ['A', 'B'], ...PERIOD },
  'ex.m6-02.k': {
    form: 'period',
    ask: 'part',
    labels: ['A', 'B'],
    es: 'Antecedente',
    en: 'Antecedent',
  },
  'ex.m6-02.l': {
    form: 'period',
    ask: 'part',
    labels: ['A', 'B'],
    es: 'Consecuente',
    en: 'Consequent',
  },
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
  const found = bundle.lessons.find((item) => item.id === 'lesson.m6-02')
  if (!found) throw new Error('Falta la lección M6-02')
  lesson = found
})

describe('M6-02 — Período y forma binaria/ternaria', () => {
  it('está publicada, validada y depende de M6-01', () => {
    expect(lesson.moduleId).toBe('M6')
    expect(lesson.slug).toBe('periodo-y-formas-binaria-ternaria')
    expect(lesson.status).toBe('published')
    expect(lesson.prerequisites).toContain('lesson.m6-01')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
    expect(lesson.objectivesEn).toHaveLength(lesson.objectivesEs.length)
    expect(lesson.skillIds).toEqual(['skill.musical-form'])
    expect(lesson.exerciseIds).toHaveLength(12)
  })

  it('explica el período y las formas AB y ABA', () => {
    const text = lesson.sections
      .map((section) => `${section.titleEs} ${section.bodyEs ?? ''}`)
      .join(' ')
      .toLowerCase()

    for (const term of [
      'período',
      'antecedente',
      'consecuente',
      'semicadencia',
      'cadencia auténtica',
      'forma binaria',
      'forma ternaria',
      'aabb',
      'da capo',
    ]) {
      expect(text, `Falta el concepto: ${term}`).toContain(term)
    }

    const english = lesson.sections
      .map((section) => `${section.titleEn} ${section.bodyEn ?? ''}`)
      .join(' ')
      .toLowerCase()
    for (const term of [
      'period',
      'antecedent',
      'consequent',
      'half cadence',
      'authentic cadence',
      'binary form',
      'ternary form',
      'aabb',
      'da capo',
    ]) {
      expect(english, `Missing concept: ${term}`).toContain(term)
    }
  })

  it('incluye demos de período, binaria y ternaria con compases completos', () => {
    const demos = scoreSections(lesson)
    expect(demos).toHaveLength(3)

    const expected: Record<string, number[][]> = {
      'sec.m6-02.demo-periodo': [
        [60, 62, 64, 67],
        [64, 60],
        [62, 64, 65, 62],
        [67],
        [60, 62, 64, 67],
        [64, 60],
        [62, 64, 65, 62],
        [60],
      ],
      'sec.m6-02.demo-binaria': [
        [60, 64, 67, 64],
        [62, 65, 69, 65],
        [64, 67, 71, 67],
        [72],
        [69, 67, 65, 64],
        [62, 64, 65, 62],
        [64, 65, 67, 69],
        [72],
      ],
      'sec.m6-02.demo-ternaria': [
        [60, 62, 64, 60],
        [62, 64, 65, 62],
        [64, 65, 67, 64],
        [60],
        [69, 67, 65, 64],
        [65, 64, 62, 60],
        [62, 64, 65, 67],
        [64],
        [60, 62, 64, 60],
        [62, 64, 65, 62],
        [64, 65, 67, 64],
        [60],
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
      expect(exercise.ask, id).toBe(expected.ask)
      expect(exercise.skillId, id).toBe('skill.musical-form')
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
        expect(section.startMeasure, `${exercise.id} ${section.id}`).toBeGreaterThanOrEqual(1)
        expect(section.endMeasure, `${exercise.id} ${section.id}`).toBeLessThanOrEqual(
          maxMeasure,
        )
        expect(section.startMeasure, `${exercise.id} ${section.id}`).toBeLessThanOrEqual(
          section.endMeasure,
        )
        expect(section.startMeasure, `${exercise.id} ${section.id} orden`).toBeGreaterThan(
          previousEnd,
        )
        previousEnd = section.endMeasure
      }

      if (exercise.ask === 'part') {
        expect(exercise.form, `${exercise.id} parte`).toBe('period')
        expect(exercise.part, `${exercise.id} frase`).toBeGreaterThanOrEqual(1)
        expect(exercise.part, `${exercise.id} frase`).toBeLessThanOrEqual(2)
        const resolved = resolveExerciseAnswer(exercise, 'es')
        if (resolved.mode !== 'choice') throw new Error(`${exercise.id} sin respuesta`)
        expect(resolved.answer).toBe(
          exercise.part === 1 ? 'Antecedente' : 'Consecuente',
        )
      }
    }
  })

  it('reparte las preguntas entre binaria, ternaria y período', () => {
    const exercises = lessonExercises(lesson, bundle).filter(
      (exercise) => exercise.type === 'form-analysis',
    )
    const forms = exercises.map((exercise) =>
      exercise.type === 'form-analysis' ? exercise.form : null,
    )
    expect(forms.filter((form) => form === 'binary')).toHaveLength(4)
    expect(forms.filter((form) => form === 'ternary')).toHaveLength(4)
    expect(forms.filter((form) => form === 'period')).toHaveLength(4)

    const parts = exercises.filter(
      (exercise) => exercise.type === 'form-analysis' && exercise.ask === 'part',
    )
    expect(parts).toHaveLength(2)
    expect(
      parts.map((exercise) =>
        exercise.type === 'form-analysis' ? exercise.part : undefined,
      ),
    ).toEqual([1, 2])
  })

  it('incluye una tarea de teclado con la forma ternaria', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.tempoBpm).toBe(84)
    expect(task?.keys.length).toBeGreaterThanOrEqual(7)
    expect(task?.checklistEs.length).toBeGreaterThanOrEqual(3)
    expect(task?.checklistEn).toHaveLength(task?.checklistEs.length ?? 0)
    expect(task?.instructionsEs).toMatch(/«A», «B» y «A»/)

    const demo = task?.demoScore
    expect(demo).toBeDefined()
    if (!demo) throw new Error('Falta la demo de la tarea')
    expect(demo.key).toBe('C')
    expect(demo.mode).toBe('major')
    expect(eventMidis(demo)).toEqual([
      [60, 62, 64, 60],
      [62, 64, 65, 62],
      [64, 65, 67, 64],
      [60],
      [69, 67, 65, 64],
      [65, 64, 62, 60],
      [62, 64, 65, 67],
      [64],
      [60, 62, 64, 60],
      [62, 64, 65, 62],
      [64, 65, 67, 64],
      [60],
    ])
  })

  it('registra la habilidad de forma musical', () => {
    const skill = bundle.skills.find((item) => item.id === 'skill.musical-form')
    expect(skill).toBeDefined()
    expect(skill?.kind).toBe('form')
    expect(skill?.lessonIds).toContain('lesson.m6-02')
    expect(skill?.labelEs.length).toBeGreaterThan(0)
    expect(skill?.labelEn.length).toBeGreaterThan(0)
    expect(skill?.params.topics).toEqual([
      'period',
      'binary-form',
      'ternary-form',
    ])
  })
})
