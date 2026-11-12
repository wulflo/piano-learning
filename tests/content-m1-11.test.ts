import { beforeAll, describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { validateContentBundle } from '../src/content/validate'
import type {
  ContentBundle,
  DurationName,
  Lesson,
  Score,
} from '../src/schemas'

const DURATION_BEATS: Record<DurationName, number> = {
  whole: 4,
  half: 2,
  quarter: 1,
  eighth: 0.5,
  sixteenth: 0.25,
  'thirty-second': 0.125,
}

const EXPECTED_ORDERS: Record<string, string[]> = {
  'ex.m1-11.a': ['sec-a', 'sec-a', 'sec-b'],
  'ex.m1-11.b': ['sec-a', 'sec-a', 'sec-b', 'sec-b'],
  'ex.m1-11.c': ['sec-a', 'sec-b', 'sec-c', 'sec-a', 'sec-b'],
  'ex.m1-11.d': ['sec-a', 'sec-b', 'sec-c', 'sec-b', 'sec-d'],
  'ex.m1-11.e': ['sec-a', 'sec-b', 'sec-a', 'sec-c'],
  'ex.m1-11.f': ['sec-a', 'sec-b', 'sec-a', 'sec-b', 'sec-c'],
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

function pitchSequence(score: Score, measure: number): string[] {
  return score.events
    .filter((event) => event.measure === measure)
    .sort((a, b) => a.beat - b.beat)
    .map((event) => `${event.pitches[0].step}${event.pitches[0].octave}`)
}

let bundle: ContentBundle
let lesson: Lesson

beforeAll(async () => {
  const result = validateContentBundle(await loadContentFromDisk())
  expect(result.ok).toBe(true)
  if (!result.bundle) throw new Error('El contenido del repositorio no es válido')
  bundle = result.bundle
  const found = bundle.lessons.find((item) => item.id === 'lesson.m1-11')
  if (!found) throw new Error('Falta la lección M1-11')
  lesson = found
})

describe('M1-11 — Repeticiones, da capo, segno y coda', () => {
  it('está publicada, validada y depende de M1-10', () => {
    expect(lesson.moduleId).toBe('M1')
    expect(lesson.status).toBe('published')
    expect(lesson.prerequisites).toContain('lesson.m1-10')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
    expect(lesson.skillIds).toContain('skill.repeat-signs')
  })

  it('explica repeticiones, casillas, da capo, segno y coda', () => {
    const text = lesson.sections
      .map((section) => `${section.titleEs} ${section.bodyEs ?? ''}`)
      .join(' ')
      .toLowerCase()

    for (const term of [
      '||:',
      ':||',
      'casilla',
      'volta',
      'da capo',
      'd.c.',
      'fine',
      'dal segno',
      'd.s.',
      'segno',
      'to coda',
      'coda',
      'd.c. al fine',
      'd.s. al coda',
      'repetir',
      'orden',
    ]) {
      expect(text, `Falta el concepto: ${term}`).toContain(term)
    }
  })

  it('muestra el ejemplo A B A con los compases completos', () => {
    const scores = scoreSections(lesson)
    expect(scores).toHaveLength(1)

    const [score] = scores
    expect(score.timeSignature).toEqual({ numerator: 4, denominator: 4 })
    expect(score.tempoBpm).toBe(80)
    expect([...measureTotals(score).values()]).toEqual([4, 4, 4])
    expect(pitchSequence(score, 1)).toEqual(pitchSequence(score, 3))
    expect(pitchSequence(score, 1)).not.toEqual(pitchSequence(score, 2))
  })

  it('los ejercicios de orden tienen la secuencia esperada y opciones válidas', () => {
    const orders = lesson.exerciseIds
      .map((id) => bundle.exercises.find((item) => item.id === id))
      .filter((exercise) => exercise?.type === 'playback-order')

    expect(orders).toHaveLength(6)

    for (const exercise of orders) {
      if (!exercise || exercise.type !== 'playback-order') continue

      expect(exercise.answer).toEqual(EXPECTED_ORDERS[exercise.id])

      const labels = new Map(
        exercise.sections.map((section) => [section.id, section.label]),
      )
      const sequence = exercise.answer
        .map((id) => labels.get(id) ?? id)
        .join(' ')
      expect(exercise.choices, `Falta la secuencia en ${exercise.id}`).toContain(
        sequence,
      )

      for (const section of exercise.sections) {
        const count = exercise.answer.filter((id) => id === section.id).length
        expect(count, `Falta ${section.id} en ${exercise.id}`).toBeGreaterThan(0)
        if (section.repeat) {
          expect(count, `${section.id} no se repite en ${exercise.id}`).toBeGreaterThanOrEqual(2)
        }
      }
    }
  })

  it('rechaza un orden que omite una sección', async () => {
    const raw = await loadContentFromDisk()
    const base = validateContentBundle(raw).bundle
    if (!base) throw new Error('El contenido base debería ser válido')

    const fixture = structuredClone(base)
    const exercise = fixture.exercises.find((item) => item.id === 'ex.m1-11.a')
    if (!exercise || exercise.type !== 'playback-order') {
      throw new Error('Falta el ejercicio de orden')
    }
    exercise.answer = ['sec-a', 'sec-a']

    const result = validateContentBundle(fixture)

    expect(result.ok).toBe(false)
    expect(
      result.issues.some((issue) =>
        issue.message.includes('no aparece en el orden'),
      ),
    ).toBe(true)
  })

  it('rechaza una sección repetida que aparece una sola vez', async () => {
    const raw = await loadContentFromDisk()
    const base = validateContentBundle(raw).bundle
    if (!base) throw new Error('El contenido base debería ser válido')

    const fixture = structuredClone(base)
    const exercise = fixture.exercises.find((item) => item.id === 'ex.m1-11.a')
    if (!exercise || exercise.type !== 'playback-order') {
      throw new Error('Falta el ejercicio de orden')
    }
    exercise.answer = ['sec-a', 'sec-b']

    const result = validateContentBundle(fixture)

    expect(result.ok).toBe(false)
    expect(
      result.issues.some((issue) =>
        issue.message.includes('debe aparecer al menos dos veces'),
      ),
    ).toBe(true)
  })

  it('incluye una tarea real con A B A, repetición y da capo', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.tempoBpm).toBe(80)
    expect(task?.keys.map((key) => `${key.step}${key.octave}`)).toEqual([
      'C4',
      'E4',
      'G4',
    ])

    for (const term of ['repetición', 'da capo', 'fine', 'a b a', 'orden']) {
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
    expect(demo.events).toHaveLength(12)
    expect([...measureTotals(demo).values()]).toEqual([4, 4, 4])
    expect(pitchSequence(demo, 1)).toEqual(pitchSequence(demo, 3))
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
