import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createFsrsItemCard,
  gradeFsrsItem,
  type FsrsSchedulerParams,
} from '../src/state/fsrs'
import {
  FsrsCardSchema,
  type FsrsCard,
  type FsrsState,
  type ReviewRating,
} from '../src/schemas'

/**
 * Fixtures deterministas de planificación FSRS.
 *
 * Cada caso parte de una tarjeta fija (nueva o con un estado persistido), aplica
 * una secuencia de calificaciones y compara la tarjeta resultante con las
 * fechas, estados y contadores esperados. El reloj avanza a la fecha de
 * vencimiento de cada paso, así que la secuencia imita repasos reales sin
 * depender del reloj del sistema.
 */

interface FixtureStep {
  rating: ReviewRating
  at: string
  state: FsrsState
  due: string
  scheduledDays: number
  reps: number
  lapses: number
  learningStep: number
  logState: FsrsState
  logId: string
}

interface FixtureCase {
  name: string
  initial: 'new' | FsrsCard
  ratings: ReviewRating[]
  params?: FsrsSchedulerParams
  expected: FixtureStep[]
}

interface Fixture {
  clock: string
  params: FsrsSchedulerParams
  cases: FixtureCase[]
}

const fixture = JSON.parse(
  readFileSync(join(process.cwd(), 'tests', 'fixtures', 'fsrs-planning.json'), 'utf8'),
) as Fixture

const ITEM_ID = 'skill.fixture'

interface RunResult {
  steps: Array<{
    card: FsrsCard
    log: Awaited<ReturnType<typeof gradeFsrsItem>>['log']
  }>
}

async function runCase(testCase: FixtureCase, itemId = ITEM_ID): Promise<RunResult> {
  const params = testCase.params ?? fixture.params
  const clock = new Date(fixture.clock)
  let card =
    testCase.initial === 'new'
      ? await createFsrsItemCard(itemId, params, clock)
      : FsrsCardSchema.parse(testCase.initial)
  let now = clock
  const steps: RunResult['steps'] = []

  for (const rating of testCase.ratings) {
    const result = await gradeFsrsItem({
      itemId,
      card,
      rating,
      now,
      fsrsParams: params,
    })
    steps.push(result)
    card = result.card
    now = new Date(result.card.due)
  }

  return { steps }
}

afterEach(() => {
  vi.useRealTimers()
})

describe('F2-048 — Planificación FSRS con fixtures deterministas', () => {
  for (const testCase of fixture.cases) {
    it(`reproduce la secuencia ${testCase.name}`, async () => {
      const { steps } = await runCase(testCase)

      expect(steps).toHaveLength(testCase.expected.length)
      steps.forEach(({ card, log }, index) => {
        const expected = testCase.expected[index]
        expect(card).toMatchObject({
          state: expected.state,
          due: expected.due,
          scheduledDays: expected.scheduledDays,
          reps: expected.reps,
          lapses: expected.lapses,
          learningStep: expected.learningStep,
        })
        expect(log).toMatchObject({
          id: expected.logId,
          itemId: ITEM_ID,
          reviewedAt: expected.at,
          rating: expected.rating,
          state: expected.logState,
        })
      })
    })
  }

  it('produce los mismos resultados con el mismo historial', async () => {
    for (const testCase of fixture.cases) {
      const first = await runCase(testCase)
      const second = await runCase(testCase)
      expect(second).toEqual(first)
    }
  })

  it('no depende del reloj del sistema', async () => {
    vi.useFakeTimers({ now: new Date('2035-07-04T12:00:00.000Z') })

    const withFutureClock = await Promise.all(fixture.cases.map((testCase) => runCase(testCase)))

    vi.setSystemTime(new Date('1999-12-31T23:59:59.000Z'))
    const withPastClock = await Promise.all(fixture.cases.map((testCase) => runCase(testCase)))

    expect(withFutureClock).toEqual(withPastClock)
  })

  it('cubre los estados new, learning, review y relearning', () => {
    const states = new Set<string>()
    for (const testCase of fixture.cases) {
      states.add(typeof testCase.initial === 'string' ? testCase.initial : testCase.initial.state)
      for (const step of testCase.expected) states.add(step.state)
    }

    expect([...states].sort()).toEqual(['learning', 'new', 'relearning', 'review'])
  })

  it('gradúa una tarjeta nueva tras dos respuestas buenas', async () => {
    const testCase = fixture.cases.find(({ name }) => name === 'nuevo-good-good-good')
    expect(testCase).toBeDefined()

    const { steps } = await runCase(testCase!)

    expect(steps[0].card.state).toBe('learning')
    expect(steps[0].card.learningStep).toBe(1)
    expect(steps[1].card.state).toBe('review')
    expect(steps[1].card.learningStep).toBe(0)
    expect(steps[1].card.scheduledDays).toBeGreaterThan(0)
  })

  it('marca un fallo en repaso como relearning y cuenta el lapso', async () => {
    const testCase = fixture.cases.find(({ name }) => name === 'repaso-again')
    expect(testCase).toBeDefined()

    const { steps } = await runCase(testCase!)

    expect(steps[0].card.state).toBe('relearning')
    expect(steps[0].card.lapses).toBe(testCase!.initial !== 'new' ? testCase!.initial.lapses + 1 : 1)
    expect(steps[0].log.rating).toBe('again')
  })

  it('respeta el intervalo máximo configurado', async () => {
    const testCase = fixture.cases.find(({ name }) => name === 'repaso-intervalo-maximo')
    expect(testCase).toBeDefined()

    const { steps } = await runCase(testCase!)

    expect(steps[0].card.scheduledDays).toBe(30)
    expect(steps[0].card.due).toBe('2026-01-31T09:00:00.000Z')
  })
})
