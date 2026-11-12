import { beforeAll, describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { validateContentBundle } from '../src/content/validate'
import {
  DYNAMIC_MARK_RANGES,
  type Articulation,
  type ContentBundle,
  type DurationName,
  type DynamicMark,
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

const ARTICULATION_LABEL: Record<Articulation, string> = {
  legato: 'Legato',
  staccato: 'Staccato',
  accent: 'Acento',
}

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

let bundle: ContentBundle
let lesson: Lesson

beforeAll(async () => {
  const result = validateContentBundle(await loadContentFromDisk())
  expect(result.ok).toBe(true)
  if (!result.bundle) throw new Error('El contenido del repositorio no es válido')
  bundle = result.bundle
  const found = bundle.lessons.find((item) => item.id === 'lesson.m1-10')
  if (!found) throw new Error('Falta la lección M1-10')
  lesson = found
})

describe('M1-10 — Dinámica y articulación', () => {
  it('está publicada, validada y depende de M1-09', () => {
    expect(lesson.moduleId).toBe('M1')
    expect(lesson.status).toBe('published')
    expect(lesson.prerequisites).toContain('lesson.m1-09')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
    expect(lesson.skillIds).toContain('skill.dynamics-articulation')
  })

  it('explica dinámicas de pp a ff y las tres articulaciones', () => {
    const text = lesson.sections
      .map((section) => `${section.titleEs} ${section.bodyEs ?? ''}`)
      .join(' ')
      .toLowerCase()

    for (const term of [
      'pp',
      'pianissimo',
      'piano',
      'mp',
      'mezzo-piano',
      'mf',
      'mezzo-forte',
      'ff',
      'fortissimo',
      'crescendo',
      'diminuendo',
      'legato',
      'staccato',
      'acento',
      'tenuto',
      'dinámica',
      'articulación',
      'velocity',
    ]) {
      expect(text, `Falta el concepto: ${term}`).toContain(term)
    }
  })

  it('la demo mantiene la altura y cambia la intensidad', () => {
    const scores = scoreSections(lesson)
    expect(scores).toHaveLength(1)

    const [score] = scores
    expect(score.timeSignature).toEqual({ numerator: 4, denominator: 4 })
    expect(score.tempoBpm).toBe(80)
    expect(score.events).toHaveLength(4)
    expect(score.events.map((event) => event.velocity)).toEqual([30, 78, 112, 78])
    expect(
      new Set(score.events.map((event) => `${event.pitches[0].step}${event.pitches[0].octave}`)),
    ).toEqual(new Set(['C4']))
    expect([...measureTotals(score).values()]).toEqual([4])

    const [soft, medium, strong] = score.events
    expect(DYNAMIC_MARK_RANGES.pp.max).toBeGreaterThanOrEqual(soft.velocity)
    expect(DYNAMIC_MARK_RANGES.mf.min).toBeLessThanOrEqual(medium.velocity)
    expect(DYNAMIC_MARK_RANGES.mf.max).toBeGreaterThanOrEqual(medium.velocity)
    expect(DYNAMIC_MARK_RANGES.ff.min).toBeLessThanOrEqual(strong.velocity)
  })

  it('los ejercicios dinámicos usan velocity dentro del rango de su marca', () => {
    const dynamics = lesson.exerciseIds
      .map((id) => bundle.exercises.find((item) => item.id === id))
      .filter((exercise) => exercise?.type === 'dynamic-mark')

    expect(dynamics).toHaveLength(2)

    for (const exercise of dynamics) {
      if (!exercise || exercise.type !== 'dynamic-mark') continue

      const range = DYNAMIC_MARK_RANGES[exercise.marking as DynamicMark]
      expect(exercise.velocity).toBeGreaterThanOrEqual(range.min)
      expect(exercise.velocity).toBeLessThanOrEqual(range.max)
      expect(exercise.choices).toContain(exercise.marking)
      expect(exercise.explanationEs.toLowerCase()).toContain(exercise.marking)
    }

    expect(
      dynamics.map((exercise) =>
        exercise?.type === 'dynamic-mark' ? exercise.marking : null,
      ),
    ).toEqual(['pp', 'ff'])
  })

  it('incluye un ejercicio de escucha de intensidad', () => {
    const listening = lesson.exerciseIds
      .map((id) => bundle.exercises.find((item) => item.id === id))
      .filter((exercise) => exercise?.type === 'sound-parameter')

    expect(listening).toHaveLength(1)

    for (const exercise of listening) {
      if (!exercise || exercise.type !== 'sound-parameter') continue

      expect(exercise.parameter).toBe('intensity')
      expect(exercise.exampleB.velocity).toBeGreaterThan(exercise.exampleA.velocity)
      expect(exercise.choices?.join(' ')).toContain('Intensidad')
      expect(exercise.explanationEs.toLowerCase()).toContain('intensidad')
    }
  })

  it('los ejercicios de articulación cubren legato, staccato y acento', () => {
    const articulations = lesson.exerciseIds
      .map((id) => bundle.exercises.find((item) => item.id === id))
      .filter((exercise) => exercise?.type === 'articulation')

    expect(articulations).toHaveLength(3)

    const values = new Set<string>()
    for (const exercise of articulations) {
      if (!exercise || exercise.type !== 'articulation') continue

      values.add(exercise.articulation)
      const label = ARTICULATION_LABEL[exercise.articulation]
      expect(exercise.choices, `Falta ${label} en ${exercise.id}`).toContain(label)
      expect(exercise.explanationEs.toLowerCase()).toContain(label.toLowerCase())
      expect(exercise.midi).toBe(60)
    }

    expect(values).toEqual(new Set(['legato', 'staccato', 'accent']))
  })

  it('incluye una tarea real con matices y articulación', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.tempoBpm).toBe(80)
    expect(task?.keys.map((key) => `${key.step}${key.accidental}${key.octave}`)).toEqual([
      'C4',
    ])

    for (const term of ['pp', 'mf', 'ff', 'legato', 'staccato', 'acento']) {
      expect(
        task?.instructionsEs.toLowerCase(),
        `Falta el término en la tarea: ${term}`,
      ).toContain(term)
    }
    expect(task?.checklistEs.length).toBeGreaterThanOrEqual(3)

    const demo = task?.demoScore
    if (!demo) throw new Error('La tarea no tiene demoScore')
    expect(demo.timeSignature).toEqual({ numerator: 4, denominator: 4 })
    expect(demo.tempoBpm).toBe(80)
    expect(demo.events).toHaveLength(16)
    expect([...measureTotals(demo).values()]).toEqual([4, 4, 4, 4])

    const byMeasure = new Map<number, number[]>()
    for (const event of demo.events) {
      const list = byMeasure.get(event.measure) ?? []
      list.push(event.velocity)
      byMeasure.set(event.measure, list)
    }
    for (const velocity of byMeasure.get(1) ?? []) {
      expect(velocity).toBeLessThanOrEqual(DYNAMIC_MARK_RANGES.pp.max)
    }
    for (const velocity of byMeasure.get(2) ?? []) {
      expect(velocity).toBeLessThanOrEqual(DYNAMIC_MARK_RANGES.pp.max)
    }
    for (const velocity of byMeasure.get(3) ?? []) {
      expect(velocity).toBeGreaterThanOrEqual(DYNAMIC_MARK_RANGES.mf.min)
      expect(velocity).toBeLessThanOrEqual(DYNAMIC_MARK_RANGES.mf.max)
    }
    for (const velocity of byMeasure.get(4) ?? []) {
      expect(velocity).toBeGreaterThanOrEqual(DYNAMIC_MARK_RANGES.ff.min)
    }
  })

  it('rechaza una velocity que no corresponde a la marca dinámica', async () => {
    const raw = await loadContentFromDisk()
    const base = validateContentBundle(raw).bundle
    if (!base) throw new Error('El contenido base debería ser válido')

    const fixture = structuredClone(base)
    const exercise = fixture.exercises.find((item) => item.id === 'ex.m1-10.a')
    if (!exercise || exercise.type !== 'dynamic-mark') {
      throw new Error('Falta el ejercicio dinámico')
    }
    exercise.velocity = 120

    const result = validateContentBundle(fixture)

    expect(result.ok).toBe(false)
    expect(
      result.issues.some((issue) =>
        issue.message.includes('no corresponde a pp'),
      ),
    ).toBe(true)
  })

  it('rechaza un staccato que dura más de un pulso', async () => {
    const raw = await loadContentFromDisk()
    const base = validateContentBundle(raw).bundle
    if (!base) throw new Error('El contenido base debería ser válido')

    const fixture = structuredClone(base)
    const exercise = fixture.exercises.find((item) => item.id === 'ex.m1-10.e')
    if (!exercise || exercise.type !== 'articulation') {
      throw new Error('Falta el ejercicio de staccato')
    }
    exercise.beats = 2

    const result = validateContentBundle(fixture)

    expect(result.ok).toBe(false)
    expect(
      result.issues.some((issue) =>
        issue.message.includes('staccato debería durar'),
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
