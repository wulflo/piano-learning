import { describe, expect, it } from 'vitest'
import { plausibleDistractors } from '../src/exercises/distractors'
import {
  KEY_SIGNATURE_MAJOR_TONICS,
  KEY_SIGNATURE_MINOR_TONICS,
  describeKeySignature,
  generateKeySignatureExercises,
} from '../src/exercises/generators/key-signature'
import {
  SCALE_SPELLING_MODES,
  SCALE_SPELLING_TONICS,
  generateScaleSpellingExercises,
  normalizeScaleSpelling,
} from '../src/exercises/generators/scale-spelling'
import {
  TRANSPOSITION_TONICS,
  formatMelody,
  generateTranspositionExercises,
  transpositionSemitones,
  transposeSpelledMelody,
} from '../src/exercises/generators/transposition'
import { ExerciseSchema } from '../src/schemas/content'
import type { Key, SpelledPitch } from '../src/schemas/notation'
import {
  LETTERS,
  formatPitch,
  fromSpelledPitch,
  midiOf,
  scaleNames,
  type ScaleMode,
} from '../src/theory'

/**
 * F2-071 — Property tests de los ejercicios M0-M2.
 *
 * Recorre las matrices completas de los generadores en las doce tónicas y
 * comprueba ortografía, respuesta canónica, transportación y distractores sin
 * depender del orden aleatorio de las opciones.
 */

const SCALE_ID = 'skill.m0-m2.property'
const DIATONIC_MODES: readonly ScaleMode[] = [
  'major',
  'natural-minor',
  'harmonic-minor',
  'melodic-minor',
  'ionian',
  'dorian',
  'phrygian',
  'lydian',
  'mixolydian',
  'aeolian',
  'locrian',
]

const NOTE_TOKEN = /^[A-G](##|bb|#|b)?$/

function tokenize(value: string): string[] {
  return value.split(' ').filter(Boolean)
}

function letterIndex(token: string): number {
  const letter = token.charAt(0) as (typeof LETTERS)[number]
  return LETTERS.indexOf(letter)
}

/** Cantidad de posiciones que cambian entre dos respuestas con los mismos tokens. */
function changedTokens(left: string, right: string): number {
  const a = tokenize(left)
  const b = tokenize(right)
  if (a.length !== b.length) return Number.POSITIVE_INFINITY
  return a.reduce((count, token, index) => (token === b[index] ? count : count + 1), 0)
}

function midis(pitches: readonly SpelledPitch[]): number[] {
  return pitches.map((pitch) => midiOf(fromSpelledPitch(pitch)))
}

describe('F2-071 — Property tests de ejercicios M0-M2', () => {
  it('deletrea las 192 combinaciones de tónicas y modos con ortografía correcta', () => {
    const exercises = generateScaleSpellingExercises({
      skillId: SCALE_ID,
      idPrefix: 'prop.scale-spelling',
      difficulty: 3,
    })

    expect(exercises).toHaveLength(
      SCALE_SPELLING_TONICS.length * SCALE_SPELLING_MODES.length,
    )
    expect(new Set(exercises.map((exercise) => exercise.id)).size).toBe(
      exercises.length,
    )
    expect(
      new Set(
        exercises.map(
          (exercise) => `${exercise.tonic}|${exercise.mode}`,
        ),
      ).size,
    ).toBe(exercises.length)

    for (const exercise of exercises) {
      const names = scaleNames(exercise.tonic, exercise.mode)
      expect(names.length, `${exercise.tonic} ${exercise.mode}`).toBeGreaterThan(2)
      const expected = [...names, names[0]].join(' ')
      expect(exercise.answer, `${exercise.tonic} ${exercise.mode}`).toBe(
        expected,
      )

      const tokens = tokenize(exercise.answer)
      expect(tokens).toHaveLength(names.length + 1)
      expect(tokens.every((token) => NOTE_TOKEN.test(token))).toBe(true)
      expect(tokens[0]).toBe(tokens[tokens.length - 1])

      if (DIATONIC_MODES.includes(exercise.mode)) {
        for (let index = 1; index < tokens.length; index += 1) {
          const step = (letterIndex(tokens[index - 1]) + 1) % LETTERS.length
          expect(letterIndex(tokens[index]), exercise.answer).toBe(step)
        }
      }

      expect(exercise.choices).toContain(exercise.answer)
      expect(new Set(exercise.choices).size).toBe(exercise.choices.length)
      for (const choice of exercise.choices) {
        expect(tokenize(choice)).toHaveLength(tokens.length)
        if (choice !== exercise.answer) {
          expect(normalizeScaleSpelling(choice)).not.toBe(
            normalizeScaleSpelling(exercise.answer),
          )
        }
      }

      expect(ExerciseSchema.safeParse(exercise).success).toBe(true)
    }
  })

  it('transporta los 132 pares de tonalidades moviendo cada nota lo mismo', () => {
    for (const difficulty of [1, 2, 3] as const) {
      const exercises = generateTranspositionExercises({
        skillId: SCALE_ID,
        idPrefix: `prop.transposition.${difficulty}`,
        difficulty,
      })

      expect(exercises).toHaveLength(
        TRANSPOSITION_TONICS.length * (TRANSPOSITION_TONICS.length - 1),
      )
      expect(new Set(exercises.map((exercise) => exercise.id)).size).toBe(
        exercises.length,
      )
      expect(
        new Set(
          exercises.map((exercise) => `${exercise.fromKey}|${exercise.toKey}`),
        ).size,
      ).toBe(exercises.length)

      for (const exercise of exercises) {
        const shift = transpositionSemitones(
          exercise.fromKey,
          exercise.toKey,
        )
        expect(exercise.answer).toHaveLength(exercise.melody.length)

        const fromMidis = midis(exercise.melody)
        const toMidis = midis(exercise.answer)
        for (let index = 0; index < fromMidis.length; index += 1) {
          expect(
            toMidis[index] - fromMidis[index],
            `${exercise.fromKey} → ${exercise.toKey}`,
          ).toBe(shift)
        }

        const roundTrip = midis(
          transposeSpelledMelody(exercise.answer, exercise.toKey, exercise.fromKey),
        )
        expect(roundTrip).toEqual(fromMidis)
        expect(ExerciseSchema.safeParse(exercise).success).toBe(true)
      }
    }
  })

  it('genera armaduras mayores y menores sin respuestas ni opciones duplicadas', () => {
    const batches = [
      generateKeySignatureExercises({
        skillId: SCALE_ID,
        idPrefix: 'prop.key-signature.major',
        difficulty: 3,
      }),
      generateKeySignatureExercises({
        skillId: SCALE_ID,
        idPrefix: 'prop.key-signature.minor',
        difficulty: 3,
        mode: 'minor',
        tonics: KEY_SIGNATURE_MINOR_TONICS,
      }),
    ]

    for (const [batchIndex, exercises] of batches.entries()) {
      const mode = batchIndex === 0 ? 'major' : 'minor'
      const tonics =
        mode === 'major'
          ? KEY_SIGNATURE_MAJOR_TONICS
          : KEY_SIGNATURE_MINOR_TONICS

      expect(exercises).toHaveLength(58)
      expect(new Set(exercises.map((exercise) => exercise.id)).size).toBe(58)
      expect(
        new Set(
          exercises.map((exercise) => `${exercise.key}|${exercise.direction}`),
        ).size,
      ).toBe(58)

      for (const exercise of exercises) {
        expect(tonics).toContain(exercise.key)
        expect(exercise.mode).toBe(mode)
        expect(exercise.choices).toContain(exercise.answer)
        expect(new Set(exercise.choices).size).toBe(exercise.choices.length)
        expect(exercise.choices.every((choice) => choice.trim() !== '')).toBe(
          true,
        )

        if (exercise.direction === 'key-to-signature') {
          expect(exercise.answer).toBe(
            describeKeySignature(exercise.key, mode),
          )
        }
        if (exercise.direction === 'signature-to-key') {
          expect(exercise.answer).toMatch(
            new RegExp(` ${mode === 'major' ? 'mayor' : 'menor'}$`),
          )
        }

        expect(ExerciseSchema.safeParse(exercise).success).toBe(true)
      }
    }
  })

  it('genera distractores únicos y no triviales para escalas y transposiciones', () => {
    const scales = generateScaleSpellingExercises({
      skillId: SCALE_ID,
      idPrefix: 'prop.distractors.scale',
      difficulty: 3,
    })

    for (const exercise of scales) {
      const distractors = plausibleDistractors({
        answer: exercise.answer,
        type: 'scale-spelling',
        difficulty: 3,
      })

      expect(distractors).toHaveLength(3)
      expect(new Set(distractors).size).toBe(distractors.length)
      for (const distractor of distractors) {
        expect(distractor).not.toBe(exercise.answer)
        expect(tokenize(distractor)).toHaveLength(
          tokenize(exercise.answer).length,
        )
        expect(changedTokens(exercise.answer, distractor)).toBe(1)
        expect(normalizeScaleSpelling(distractor)).not.toBe(
          normalizeScaleSpelling(exercise.answer),
        )
      }
    }

    const transpositions = generateTranspositionExercises({
      skillId: SCALE_ID,
      idPrefix: 'prop.distractors.transposition',
      difficulty: 2,
    })

    for (const exercise of transpositions) {
      const answer = exercise.answer.map((pitch) => formatPitch(fromSpelledPitch(pitch))).join(' ')
      expect(answer).toBe(formatMelody(exercise.answer))

      const distractors = plausibleDistractors({
        answer,
        type: 'transposition',
        difficulty: 2,
      })

      expect(distractors).toHaveLength(2)
      expect(new Set(distractors).size).toBe(distractors.length)
      for (const distractor of distractors) {
        expect(distractor).not.toBe(answer)
        expect(tokenize(distractor)).toHaveLength(tokenize(answer).length)
        expect(changedTokens(answer, distractor)).toBe(1)
      }
    }
  })

  it('cubre las doce tónicas de M2 y no deja modos sin ejercicio', () => {
    const keys = new Set<Key>(SCALE_SPELLING_TONICS)
    expect(keys.size).toBe(12)

    const scales = generateScaleSpellingExercises({
      skillId: SCALE_ID,
      idPrefix: 'prop.coverage.scale',
      difficulty: 1,
    })
    for (const tonic of keys) {
      for (const mode of SCALE_SPELLING_MODES) {
        expect(
          scales.some(
            (exercise) => exercise.tonic === tonic && exercise.mode === mode,
          ),
          `${tonic} ${mode}`,
        ).toBe(true)
      }
    }

    const transpositions = generateTranspositionExercises({
      skillId: SCALE_ID,
      idPrefix: 'prop.coverage.transposition',
      difficulty: 1,
    })
    for (const fromKey of TRANSPOSITION_TONICS) {
      for (const toKey of TRANSPOSITION_TONICS) {
        const expected = fromKey !== toKey
        expect(
          transpositions.some(
            (exercise) =>
              exercise.fromKey === fromKey && exercise.toKey === toKey,
          ),
          `${fromKey} → ${toKey}`,
        ).toBe(expected)
      }
    }
  })
})
