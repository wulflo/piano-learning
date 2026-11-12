import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ARPEGGIO_TONICS,
  arpeggioFingering,
  arpeggioFingeringLabel,
  arpeggioPitches,
} from '../src/exercises/arpeggio'
import { resolveExerciseAnswer } from '../src/exercises/answer'
import {
  FINGERING_DIFFICULTIES,
  FINGERING_MIDI_MAX,
  FINGERING_MIDI_MIN,
  FINGERING_OCTAVES,
  generateFingeringExercise,
  generateFingeringExercises,
  isPlayableArpeggio,
  isValidFinger,
} from '../src/exercises/generators/fingering'
import { ExerciseSchema } from '../src/schemas'
import { midiOf } from '../src/theory'

const SKILL_ID = 'skill.arpeggio'

function seededRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x1_0000_0000
  }
}

beforeEach(() => {
  vi.spyOn(Math, 'random').mockImplementation(seededRandom(0xf19e))
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('F5-019 — Generador de ejercicios de digitación', () => {
  it('genera arpegios válidos en toda la matriz de tónicas, manos y octavas', () => {
    for (const tonic of ARPEGGIO_TONICS) {
      for (const hand of ['right', 'left'] as const) {
        for (const octaves of FINGERING_OCTAVES) {
          const exercise = generateFingeringExercise({
            id: `fingering.${tonic.toLowerCase()}.${hand}.${octaves}`,
            skillId: SKILL_ID,
            tonic,
            hand,
            octaves,
            difficulty: 2,
          })

          expect(
            ExerciseSchema.safeParse(exercise).success,
            exercise.id,
          ).toBe(true)
          expect(exercise.ask).toBe('fingering')
          expect(exercise.tonic).toBe(tonic)
          expect(exercise.hand).toBe(hand)
          expect(exercise.octaves).toBe(octaves)

          const label = arpeggioFingeringLabel(tonic, hand, octaves)
          expect(exercise.choices, exercise.id).toContain(label)
          expect(exercise.choicesEn, exercise.id).toEqual(exercise.choices)
          expect(new Set(exercise.choices).size, exercise.id).toBe(
            exercise.choices.length,
          )
          expect(exercise.choices.length, exercise.id).toBeGreaterThanOrEqual(3)
          expect(exercise.choices.length, exercise.id).toBeLessThanOrEqual(4)

          const spanish = resolveExerciseAnswer(exercise, 'es')
          const english = resolveExerciseAnswer(exercise, 'en')
          expect(spanish.mode).toBe('choice')
          expect(english.mode).toBe('choice')
          if (spanish.mode === 'choice') {
            expect(spanish.answer).toBe(label)
            expect(exercise.choices).toContain(spanish.answer)
          }
          if (english.mode === 'choice') {
            expect(exercise.choicesEn).toContain(english.answer)
          }
        }
      }
    }
  })

  it('mantiene las notas dentro del rango MIDI y de la mano', () => {
    for (const tonic of ARPEGGIO_TONICS) {
      for (const hand of ['right', 'left'] as const) {
        for (const octaves of FINGERING_OCTAVES) {
          expect(isPlayableArpeggio(tonic, hand, octaves), `${tonic} ${hand}`).toBe(
            true,
          )
          const pitches = arpeggioPitches(tonic, hand, octaves)
          const midis = pitches.map((pitch) => midiOf(pitch))
          expect(midis).toHaveLength(octaves * 3 + 1)
          for (const midi of midis) {
            expect(midi, `${tonic} ${hand} ${octaves}`).toBeGreaterThanOrEqual(
              FINGERING_MIDI_MIN,
            )
            expect(midi, `${tonic} ${hand} ${octaves}`).toBeLessThanOrEqual(
              FINGERING_MIDI_MAX,
            )
          }
          for (let index = 1; index < midis.length; index += 1) {
            expect(midis[index], `${tonic} ${hand}`).toBeGreaterThan(
              midis[index - 1],
            )
          }
          expect(
            arpeggioFingering(tonic, hand, octaves).every(isValidFinger),
            `${tonic} ${hand} ${octaves}`,
          ).toBe(true)
        }
      }
    }
  })

  it('genera tandas que recorren tónicas, manos y octavas', () => {
    const exercises = generateFingeringExercises({
      skillId: SKILL_ID,
      idPrefix: 'fingering.batch',
      count: 48,
      difficulty: 3,
    })

    expect(exercises).toHaveLength(48)
    expect(new Set(exercises.map((exercise) => exercise.id)).size).toBe(48)
    expect(new Set(exercises.map((exercise) => exercise.tonic)).size).toBe(
      ARPEGGIO_TONICS.length,
    )
    expect(new Set(exercises.map((exercise) => exercise.hand))).toEqual(
      new Set(['right', 'left']),
    )
    expect(new Set(exercises.map((exercise) => exercise.octaves))).toEqual(
      new Set([1, 2]),
    )
    expect(
      exercises.every((exercise) =>
        ExerciseSchema.safeParse(exercise).success,
      ),
    ).toBe(true)
  })

  it('rechaza tónicas, dificultades y octavas fuera de la matriz', () => {
    expect(isValidFinger(0)).toBe(false)
    expect(isValidFinger(6)).toBe(false)
    expect(isValidFinger(2.5)).toBe(false)
    expect(isValidFinger(1)).toBe(true)
    expect(isValidFinger(5)).toBe(true)

    expect(() =>
      generateFingeringExercise({
        id: 'fingering.mala',
        skillId: SKILL_ID,
        tonic: 'C#' as never,
        hand: 'right',
        octaves: 1,
        difficulty: 2,
      }),
    ).toThrow(/no pertenece/)

    expect(() =>
      generateFingeringExercise({
        id: 'fingering.mala',
        skillId: SKILL_ID,
        tonic: 'C',
        hand: 'right',
        octaves: 1,
        difficulty: 9 as never,
      }),
    ).toThrow(/Dificultad/)

    expect(() =>
      generateFingeringExercise({
        id: 'fingering.mala',
        skillId: SKILL_ID,
        tonic: 'C',
        hand: 'right',
        octaves: 3 as never,
        difficulty: 2,
      }),
    ).toThrow(/octavas/)

    expect(() =>
      generateFingeringExercises({
        skillId: SKILL_ID,
        idPrefix: 'fingering.mala',
        count: -1,
      }),
    ).toThrow(/Cantidad/)
  })

  it('cubre los tres niveles con la misma digitación canónica', () => {
    for (const difficulty of FINGERING_DIFFICULTIES) {
      const exercises = generateFingeringExercises({
        skillId: SKILL_ID,
        idPrefix: `fingering.nivel.${difficulty}`,
        count: 12,
        difficulty,
        tonics: ['C', 'F', 'G', 'Bb'],
        hands: ['right', 'left'],
        octaves: [1],
      })
      expect(exercises).toHaveLength(12)
      for (const exercise of exercises) {
        expect(exercise.difficulty).toBe(difficulty)
        expect(exercise.choices).toContain(
          arpeggioFingeringLabel(
            exercise.tonic,
            exercise.hand,
            exercise.octaves,
          ),
        )
      }
    }
  })
})
