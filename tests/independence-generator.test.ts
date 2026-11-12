import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { rhythmicValueBeats, attackingHandAt, spelledPitchToMidi } from '../src/content/score'
import { isExerciseAnswerCorrect, resolveExerciseAnswer } from '../src/exercises/answer'
import {
  COORDINATION_DIFFICULTIES,
  COORDINATION_MAX_LEAP,
  COORDINATION_METERS,
  COORDINATION_PATTERN_KINDS,
  COORDINATION_PATTERNS,
  COORDINATION_PATTERNS_BY_DIFFICULTY,
  COORDINATION_RANGES,
  coordinationPatternIsPlayable,
  generateIndependenceExercise,
  generateIndependenceExercises,
  type CoordinationPattern,
} from '../src/exercises/generators/independence'
import { HAND_LABELS } from '../src/exercises/hand-coordination'
import { ExerciseSchema } from '../src/schemas'

const SKILL_ID = 'skill.hand-independence'

function seededRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x1_0000_0000
  }
}

beforeEach(() => {
  vi.spyOn(Math, 'random').mockImplementation(seededRandom(0x1dd5))
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('F5-019 — Generador de ejercicios de independencia', () => {
  it('valida todos los patrones de referencia como tocables', () => {
    expect(COORDINATION_PATTERNS.length).toBeGreaterThanOrEqual(10)
    for (const pattern of COORDINATION_PATTERNS) {
      expect(coordinationPatternIsPlayable(pattern), pattern.id).toBe(true)
      expect(COORDINATION_METERS).toContain(pattern.meter)
      expect(COORDINATION_PATTERN_KINDS).toContain(pattern.kind)
    }
    expect(new Set(COORDINATION_PATTERNS.map((pattern) => pattern.id)).size).toBe(
      COORDINATION_PATTERNS.length,
    )
  })

  it('genera ejercicios válidos para cada patrón en su nivel', () => {
    for (const difficulty of COORDINATION_DIFFICULTIES) {
      const allowed = COORDINATION_PATTERNS_BY_DIFFICULTY[difficulty]
      for (const pattern of COORDINATION_PATTERNS) {
        if (!allowed.includes(pattern.kind)) continue
        const exercise = generateIndependenceExercise({
          id: `independence.${difficulty}.${pattern.id}`,
          skillId: SKILL_ID,
          difficulty,
          pattern,
        })

        expect(
          ExerciseSchema.safeParse(exercise).success,
          exercise.id,
        ).toBe(true)
        expect(exercise.measure).toBeGreaterThanOrEqual(1)
        expect(exercise.measure).toBeLessThanOrEqual(
          pattern.measures.length,
        )
        const beats = pattern.meter === '4/4' ? 4 : 3
        expect(exercise.beat).toBeGreaterThanOrEqual(1)
        expect(exercise.beat).toBeLessThanOrEqual(beats)
        expect(
          attackingHandAt(exercise.score, exercise.measure, exercise.beat),
          exercise.id,
        ).not.toBeNull()
        expect(exercise.choices).toHaveLength(3)
        expect(exercise.choicesEn).toHaveLength(3)
        expect(new Set(exercise.choices).size).toBe(3)
        expect(new Set(exercise.choicesEn).size).toBe(3)

        const hand = attackingHandAt(
          exercise.score,
          exercise.measure,
          exercise.beat,
        )
        expect(hand).not.toBeNull()
        if (hand === null) continue
        const label = HAND_LABELS[hand].es
        expect(exercise.choices).toContain(label)
        expect(isExerciseAnswerCorrect(exercise, label)).toBe(true)
        const spanish = resolveExerciseAnswer(exercise, 'es')
        expect(spanish.mode).toBe('choice')
        if (spanish.mode === 'choice') {
          expect(spanish.answer).toBe(label)
        }
      }
    }
  })

  it('completa cada compás por mano y no produce posiciones imposibles', () => {
    for (const pattern of COORDINATION_PATTERNS) {
      const exercise = generateIndependenceExercise({
        id: `independence.position.${pattern.id}`,
        skillId: SKILL_ID,
        difficulty: 3,
        pattern,
      })
      const beats = pattern.meter === '4/4' ? 4 : 3
      expect(exercise.score.timeSignature).toEqual(
        pattern.meter === '4/4'
          ? { numerator: 4, denominator: 4 }
          : { numerator: 3, denominator: 4 },
      )

      const totals = new Map<string, number>()
      for (const event of exercise.score.events) {
        const key = `${event.measure}:${event.hand}`
        totals.set(
          key,
          (totals.get(key) ?? 0) + rhythmicValueBeats(event.value),
        )
      }
      for (let measure = 1; measure <= pattern.measures.length; measure += 1) {
        expect(
          exercise.score.events.some((event) => event.measure === measure),
          `${pattern.id} compás ${measure}`,
        ).toBe(true)
        for (const hand of ['right', 'left'] as const) {
          const total = totals.get(`${measure}:${hand}`) ?? 0
          expect(total, `${pattern.id} compás ${measure} ${hand}`).toBeGreaterThan(0)
          expect(total, `${pattern.id} compás ${measure} ${hand}`).toBeLessThanOrEqual(
            beats + 1e-9,
          )
        }
      }

      const byHand = new Map<'right' | 'left', number[]>()
      for (const event of exercise.score.events) {
        expect(event.pitches).toHaveLength(1)
        const midi = spelledPitchToMidi(event.pitches[0])
        const range = COORDINATION_RANGES[event.hand]
        expect(midi, `${pattern.id} ${event.hand}`).toBeGreaterThanOrEqual(
          range.minMidi,
        )
        expect(midi, `${pattern.id} ${event.hand}`).toBeLessThanOrEqual(
          range.maxMidi,
        )
        const list = byHand.get(event.hand) ?? []
        list.push(midi)
        byHand.set(event.hand, list)
        expect(midi).toBeGreaterThanOrEqual(21)
        expect(midi).toBeLessThanOrEqual(108)
      }

      const right = byHand.get('right') ?? []
      const left = byHand.get('left') ?? []
      if (right.length > 0 && left.length > 0) {
        expect(Math.min(...right), pattern.id).toBeGreaterThan(
          Math.max(...left),
        )
      }

      for (const midis of byHand.values()) {
        for (let index = 1; index < midis.length; index += 1) {
          expect(
            Math.abs(midis[index] - midis[index - 1]),
            `${pattern.id} salto`,
          ).toBeLessThanOrEqual(COORDINATION_MAX_LEAP)
        }
      }
    }
  })

  it('genera tandas que alternan patrones y compases', () => {
    const exercises = generateIndependenceExercises({
      skillId: SKILL_ID,
      idPrefix: 'independence.batch',
      count: 24,
      difficulty: 3,
    })

    expect(exercises).toHaveLength(24)
    expect(new Set(exercises.map((exercise) => exercise.id)).size).toBe(24)
    expect(
      new Set(
        exercises.map((exercise) =>
          exercise.score.timeSignature.numerator === 4 ? '4/4' : '3/4',
        ),
      ),
    ).toEqual(new Set(['4/4', '3/4']))

    const kinds = new Set<string>()
    for (const exercise of exercises) {
      const simultaneous = [1, 2, 3, 4].some((beat) => {
        const hands = new Set(
          exercise.score.events
            .filter(
              (event) =>
                event.measure === 1 &&
                Math.abs(event.beat - (beat - 1)) < 1e-6,
            )
            .map((event) => event.hand),
        )
        return hands.size === 2
      })
      const held = exercise.score.events.some(
        (event) => event.value.duration !== 'quarter',
      )
      kinds.add(
        held ? 'hold-and-move' : simultaneous ? 'simultaneous' : 'alternating',
      )
    }
    expect(kinds).toEqual(
      new Set(['alternating', 'hold-and-move', 'simultaneous']),
    )
    expect(
      exercises.every((exercise) =>
        ExerciseSchema.safeParse(exercise).success,
      ),
    ).toBe(true)
  })

  it('rechaza patrones incompletos, solapados y de un nivel superior', () => {
    const overlapping: CoordinationPattern = {
      id: 'roto.solape',
      kind: 'alternating',
      meter: '4/4',
      measures: [
        [
          { beat: 0, hand: 'right', duration: 'half' },
          { beat: 1, hand: 'right', duration: 'quarter' },
        ],
      ],
    }
    expect(coordinationPatternIsPlayable(overlapping)).toBe(false)

    const overlong: CoordinationPattern = {
      id: 'roto.largo',
      kind: 'alternating',
      meter: '3/4',
      measures: [[{ beat: 2, hand: 'right', duration: 'half' }]],
    }
    expect(coordinationPatternIsPlayable(overlong)).toBe(false)

    const outOfMeter: CoordinationPattern = {
      id: 'roto.pulso',
      kind: 'alternating',
      meter: '3/4',
      measures: [[{ beat: 3, hand: 'right', duration: 'quarter' }]],
    }
    expect(coordinationPatternIsPlayable(outOfMeter)).toBe(false)

    expect(() =>
      generateIndependenceExercise({
        id: 'independence.mala',
        skillId: SKILL_ID,
        difficulty: 1,
        pattern: COORDINATION_PATTERNS.find(
          (pattern) => pattern.kind === 'simultaneous',
        ) as CoordinationPattern,
      }),
    ).toThrow(/no corresponde/)

    expect(() =>
      generateIndependenceExercise({
        id: 'independence.mala',
        skillId: SKILL_ID,
        difficulty: 2,
        pattern: overlapping,
      }),
    ).toThrow(/no es tocable/)

    expect(() =>
      generateIndependenceExercises({
        skillId: SKILL_ID,
        idPrefix: 'independence.mala',
        count: 4,
        difficulty: 1,
        patterns: ['simultaneous'],
      }),
    ).toThrow(/no está permitido/)

  })
})
