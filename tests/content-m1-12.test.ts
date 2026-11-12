import { beforeAll, describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { validateContentBundle } from '../src/content/validate'
import {
  ITALIAN_TERM_CATEGORIES,
  ITALIAN_TERM_VALUES,
  type ContentBundle,
  type DurationName,
  type ItalianTerm,
  type Lesson,
  type Score,
} from '../src/schemas'

const DURATION_BEATS: Record<DurationName, number> = {
  whole: 4,
  half: 2,
  quarter: 1,
  eighth: 0.5,
  sixteenth: 0.25,
  'thirty-second': 0.125,
}

const EXPECTED_QUIZ: ItalianTerm[] = [
  'adagio',
  'allegro',
  'crescendo',
  'diminuendo',
  'legato',
  'staccato',
]

function measureTotals(score: Score): Map<number, number> {
  const totals = new Map<number, number>()
  for (const event of score.events) {
    const beats = DURATION_BEATS[event.value.duration]
    totals.set(event.measure, (totals.get(event.measure) ?? 0) + beats)
  }
  return totals
}

function scoreSections(lesson: Lesson): Score[] {
  return lesson.sections
    .filter((section) => section.kind === 'score' && section.score)
    .map((section) => section.score as Score)
}

function pitchSequence(score: Score): string[] {
  return [...score.events]
    .sort((a, b) => a.measure - b.measure || a.beat - b.beat)
    .map((event) => `${event.pitches[0].step}${event.pitches[0].octave}`)
}

let bundle: ContentBundle
let lesson: Lesson

beforeAll(async () => {
  const result = validateContentBundle(await loadContentFromDisk())
  expect(result.ok).toBe(true)
  if (!result.bundle) throw new Error('El contenido del repositorio no es válido')
  bundle = result.bundle
  const found = bundle.lessons.find((item) => item.id === 'lesson.m1-12')
  if (!found) throw new Error('Falta la lección M1-12')
  lesson = found
})

describe('M1-12 — Términos italianos', () => {
  it('está publicada, validada y depende de M1-11', () => {
    expect(lesson.moduleId).toBe('M1')
    expect(lesson.status).toBe('published')
    expect(lesson.prerequisites).toContain('lesson.m1-11')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
    expect(lesson.skillIds).toContain('skill.italian-terms')
  })

  it('el glosario tiene los 20 términos con categoría, significado y ejemplo', () => {
    expect(lesson.glossary).toHaveLength(20)

    const terms = lesson.glossary.map((entry) => entry.term)
    expect(new Set(terms).size).toBe(20)
    expect(new Set(terms)).toEqual(new Set(ITALIAN_TERM_VALUES))

    for (const entry of lesson.glossary) {
      expect(entry.category, `Categoría incorrecta en ${entry.term}`).toBe(
        ITALIAN_TERM_CATEGORIES[entry.term],
      )
      expect(entry.meaningEs.length).toBeGreaterThan(5)
      expect(entry.exampleEs.length).toBeGreaterThan(10)
    }
  })

  it('explica las cuatro categorías y aclara el origen de las definiciones', () => {
    const text = lesson.sections
      .map((section) => `${section.titleEs} ${section.bodyEs ?? ''}`)
      .join(' ')
      .toLowerCase()

    for (const term of [
      'adagio',
      'allegro',
      'andante',
      'moderato',
      'presto',
      'ritardando',
      'accelerando',
      'rubato',
      'crescendo',
      'diminuendo',
      'pianissimo',
      'fortissimo',
      'legato',
      'staccato',
      'accentato',
      'tenuto',
      'dolce',
      'cantabile',
      'espressivo',
      'maestoso',
      'tempo',
      'dinámica',
      'articulación',
      'carácter',
    ]) {
      expect(text, `Falta el concepto: ${term}`).toContain(term)
    }

    expect(text).toContain('redacción propia')
    expect(text).toContain('no se copiaron')
  })

  it('incluye dos demos de la misma frase en andante y allegro', () => {
    const scores = scoreSections(lesson)
    expect(scores).toHaveLength(2)

    const tempos = scores.map((score) => score.tempoBpm).sort((a, b) => a - b)
    expect(tempos).toEqual([72, 132])

    for (const score of scores) {
      expect(score.timeSignature).toEqual({ numerator: 4, denominator: 4 })
      expect([...measureTotals(score).values()]).toEqual([4, 4])
    }

    expect(pitchSequence(scores[0])).toEqual(pitchSequence(scores[1]))
  })

  it('el quiz cubre seis términos con significado y ejemplo propios', () => {
    const quiz = lesson.exerciseIds
      .map((id) => bundle.exercises.find((item) => item.id === id))
      .filter((exercise) => exercise?.type === 'italian-term')

    expect(quiz).toHaveLength(6)
    expect(
      quiz.map((exercise) =>
        exercise?.type === 'italian-term' ? exercise.term : null,
      ),
    ).toEqual(EXPECTED_QUIZ)

    for (const exercise of quiz) {
      if (!exercise || exercise.type !== 'italian-term') continue

      expect(exercise.category).toBe(ITALIAN_TERM_CATEGORIES[exercise.term])
      expect(exercise.choices).toContain(exercise.meaningEs)
      expect(exercise.explanationEs.toLowerCase()).toContain(exercise.term)
      expect(exercise.exampleEs.length).toBeGreaterThan(10)
    }
  })

  it('incluye una tarea real con cantabile, legato, allegro y tenuto', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.tempoBpm).toBe(90)
    expect(task?.keys.length).toBeGreaterThanOrEqual(5)

    for (const term of ['cantabile', 'legato', 'allegro', 'tenuto', 'espressivo']) {
      expect(
        task?.instructionsEs.toLowerCase(),
        `Falta el término en la tarea: ${term}`,
      ).toContain(term)
    }
    expect(task?.checklistEs.length).toBeGreaterThanOrEqual(3)

    const demo = task?.demoScore
    if (!demo) throw new Error('La tarea no tiene demoScore')
    expect(demo.timeSignature).toEqual({ numerator: 4, denominator: 4 })
    expect(demo.tempoBpm).toBe(90)
    expect(demo.events).toHaveLength(8)
    expect([...measureTotals(demo).values()]).toEqual([4, 4])
  })

  it('rechaza un término duplicado en el glosario', async () => {
    const raw = await loadContentFromDisk()
    const base = validateContentBundle(raw).bundle
    if (!base) throw new Error('El contenido base debería ser válido')

    const fixture = structuredClone(base)
    const target = fixture.lessons.find((item) => item.id === 'lesson.m1-12')
    if (!target) throw new Error('Falta la lección M1-12')
    target.glossary.push(target.glossary[0])

    const result = validateContentBundle(fixture)

    expect(result.ok).toBe(false)
    expect(
      result.issues.some((issue) =>
        issue.message.includes('Término duplicado en el glosario'),
      ),
    ).toBe(true)
  })

  it('rechaza una categoría que no corresponde al término', async () => {
    const raw = await loadContentFromDisk()
    const base = validateContentBundle(raw).bundle
    if (!base) throw new Error('El contenido base debería ser válido')

    const fixture = structuredClone(base)
    const exercise = fixture.exercises.find((item) => item.id === 'ex.m1-12.a')
    if (!exercise || exercise.type !== 'italian-term') {
      throw new Error('Falta el ejercicio de términos')
    }
    exercise.category = 'dynamics'

    const result = validateContentBundle(fixture)

    expect(result.ok).toBe(false)
    expect(
      result.issues.some((issue) =>
        issue.message.includes('no corresponde a adagio'),
      ),
    ).toBe(true)
  })

  it('rechaza un quiz sin la respuesta correcta entre las opciones', async () => {
    const raw = await loadContentFromDisk()
    const base = validateContentBundle(raw).bundle
    if (!base) throw new Error('El contenido base debería ser válido')

    const fixture = structuredClone(base)
    const exercise = fixture.exercises.find((item) => item.id === 'ex.m1-12.a')
    if (!exercise || exercise.type !== 'italian-term') {
      throw new Error('Falta el ejercicio de términos')
    }
    exercise.choices = ['Rápido y animado', 'Muy fuerte']

    const result = validateContentBundle(fixture)

    expect(result.ok).toBe(false)
    expect(
      result.issues.some((issue) =>
        issue.message.includes('Falta la respuesta correcta'),
      ),
    ).toBe(true)
  })

  it('referencia solo habilidades y ejercicios existentes', () => {
    const skillIds = new Set(bundle.skills.map((skill) => skill.id))
    const exerciseIds = new Set(bundle.exercises.map((exercise) => exercise.id))

    for (const skillId of lesson.skillIds) {
      expect(skillIds.has(skillId), `Habilidad inexistente: ${skillId}`).toBe(true)
    }
    for (const exerciseId of lesson.exerciseIds) {
      expect(exerciseIds.has(exerciseId), `Ejercicio inexistente: ${exerciseId}`).toBe(
        true,
      )
    }
  })
})
