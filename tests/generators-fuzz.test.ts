import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  describeKeySignature,
  generateKeySignatureExercises,
} from '../src/exercises/generators/key-signature'
import {
  NOTE_KEYBOARD_MAX_CHOICES,
  NOTE_KEYBOARD_MIN_CHOICES,
  generateNoteKeyboardExercises,
  noteNameOf,
  notesInRange,
} from '../src/exercises/generators/note-keyboard'
import {
  NOTE_STAFF_MAX_LEDGER_LINES,
  generateNoteStaffExercises,
  ledgerLineCount,
  noteStaffCandidates,
} from '../src/exercises/generators/note-staff'
import {
  generateScaleSpellingExercises,
  normalizeScaleSpelling,
} from '../src/exercises/generators/scale-spelling'
import {
  generateTranspositionExercises,
  transpositionSemitones,
} from '../src/exercises/generators/transposition'
import { ExerciseSchema, type Exercise } from '../src/schemas'
import { fromSpelledPitch, midiOf } from '../src/theory'

/**
 * F3-031 — Fuzz tests de los generadores de ejercicios.
 *
 * Los tests de F2-071 recorren las matrices completas una vez. Este archivo
 * repite la generación con 500 casos por lote y un `Math.random` sembrado para
 * comprobar las invariantes que la UI necesita: ninguna nota se repite de forma
 * consecutiva, cada respuesta es válida y las opciones no son ambiguas.
 */

const CASES = 500
const SKILL_ID = 'skill.fuzz'
const RANGE = 'C2-C6'

/** Generador congruencial lineal para que el fuzz sea reproducible. */
function seededRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x1_0000_0000
  }
}

beforeEach(() => {
  vi.spyOn(Math, 'random').mockImplementation(seededRandom(0x5eed))
})

afterEach(() => {
  vi.restoreAllMocks()
})

function expectValid(exercise: Exercise): void {
  const parsed = ExerciseSchema.safeParse(exercise)
  expect(parsed.success, JSON.stringify(parsed.error?.issues)).toBe(true)
}

function expectUniqueChoices(
  choices: readonly string[],
  answer: string,
  label: string,
): void {
  expect(choices, label).toContain(answer)
  expect(new Set(choices).size, label).toBe(choices.length)
}

/** Comprueba que cada opción apunta a una nota distinta y solo la respuesta coincide. */
function expectUnambiguousChoices(
  choices: readonly string[],
  byName: ReadonlyMap<string, number>,
  targetMidi: number,
  label: string,
): void {
  const midis = choices.map((choice) => byName.get(choice))
  expect(midis.every((midi) => midi !== undefined), label).toBe(true)
  expect(new Set(midis).size, label).toBe(midis.length)
  expect(midis.filter((midi) => midi === targetMidi), label).toHaveLength(1)
}

describe('F3-031 — Fuzz de generadores', () => {
  it('genera 500 ejercicios de teclado sin notas consecutivas repetidas', () => {
    const configurations = [
      { notation: 'do', variant: 'see' },
      { notation: 'c', variant: 'hear' },
    ] as const

    for (const { notation, variant } of configurations) {
      const exercises = generateNoteKeyboardExercises({
        idPrefix: `fuzz.keyboard.${notation}.${variant}`,
        skillId: SKILL_ID,
        range: RANGE,
        notation,
        variant,
        difficulty: 2,
        count: CASES,
      })

      expect(exercises).toHaveLength(CASES)
      expect(new Set(exercises.map((exercise) => exercise.id)).size).toBe(CASES)

      const byName = new Map(
        notesInRange(RANGE).map((pitch) => [
          noteNameOf(pitch, notation),
          midiOf(pitch),
        ]),
      )
      let previous: number | undefined

      for (const exercise of exercises) {
        expectValid(exercise)
        const target = fromSpelledPitch(exercise.target)
        const targetMidi = midiOf(target)

        if (previous !== undefined) {
          expect(targetMidi, exercise.id).not.toBe(previous)
        }
        previous = targetMidi

        expect(exercise.choices.length).toBeGreaterThanOrEqual(
          NOTE_KEYBOARD_MIN_CHOICES,
        )
        expect(exercise.choices.length).toBeLessThanOrEqual(
          NOTE_KEYBOARD_MAX_CHOICES,
        )

        const targetName = noteNameOf(target, notation)
        expectUniqueChoices(exercise.choices, targetName, exercise.id)
        expectUnambiguousChoices(
          exercise.choices,
          byName,
          targetMidi,
          exercise.id,
        )
      }
    }
  })

  it('genera 500 ejercicios de pentagrama por clave sin notas consecutivas repetidas', () => {
    for (const clef of ['treble', 'bass'] as const) {
      const exercises = generateNoteStaffExercises({
        idPrefix: `fuzz.staff.${clef}`,
        skillId: SKILL_ID,
        range: RANGE,
        clef,
        notation: 'c',
        difficulty: 3,
        count: CASES,
      })

      expect(exercises).toHaveLength(CASES)
      expect(new Set(exercises.map((exercise) => exercise.id)).size).toBe(CASES)

      const byName = new Map(
        noteStaffCandidates(clef, 3, RANGE).map((pitch) => [
          noteNameOf(pitch, 'c'),
          midiOf(pitch),
        ]),
      )
      let previous: number | undefined

      for (const exercise of exercises) {
        expectValid(exercise)
        const target = fromSpelledPitch(exercise.target)
        const targetMidi = midiOf(target)

        if (previous !== undefined) {
          expect(targetMidi, exercise.id).not.toBe(previous)
        }
        previous = targetMidi

        expect(ledgerLineCount(clef, target), exercise.id).toBeLessThanOrEqual(
          NOTE_STAFF_MAX_LEDGER_LINES[3],
        )
        expect(byName.has(noteNameOf(target, 'c')), exercise.id).toBe(true)

        const targetName = noteNameOf(target, 'c')
        expectUniqueChoices(exercise.choices, targetName, exercise.id)
        expectUnambiguousChoices(
          exercise.choices,
          byName,
          targetMidi,
          exercise.id,
        )
      }
    }
  })

  it('genera 500 deletreos con respuestas válidas y distractores no ambiguos', () => {
    const exercises = generateScaleSpellingExercises({
      idPrefix: 'fuzz.scale-spelling',
      skillId: SKILL_ID,
      difficulty: 3,
      count: CASES,
    })

    expect(exercises).toHaveLength(CASES)
    expect(new Set(exercises.map((exercise) => exercise.id)).size).toBe(CASES)

    let previous: string | undefined
    for (const exercise of exercises) {
      expectValid(exercise)

      const combination = `${exercise.tonic}|${exercise.mode}`
      if (previous !== undefined) {
        expect(combination, exercise.id).not.toBe(previous)
      }
      previous = combination

      expectUniqueChoices(exercise.choices, exercise.answer, exercise.id)

      const answerTokens = exercise.answer.split(' ').filter(Boolean)
      for (const choice of exercise.choices) {
        expect(choice.split(' ').filter(Boolean), exercise.id).toHaveLength(
          answerTokens.length,
        )
        if (choice !== exercise.answer) {
          expect(
            normalizeScaleSpelling(choice),
            exercise.id,
          ).not.toBe(normalizeScaleSpelling(exercise.answer))
        }
      }
    }
  })

  it('genera 500 armaduras mayores y menores con una sola respuesta válida', () => {
    const batches = [
      { mode: 'major', idPrefix: 'fuzz.key-signature.major' },
      { mode: 'minor', idPrefix: 'fuzz.key-signature.minor' },
    ] as const

    for (const { mode, idPrefix } of batches) {
      const exercises = generateKeySignatureExercises({
        idPrefix,
        skillId: SKILL_ID,
        difficulty: 3,
        mode,
        count: CASES,
      })

      expect(exercises).toHaveLength(CASES)
      expect(new Set(exercises.map((exercise) => exercise.id)).size).toBe(CASES)

      let previous: string | undefined
      for (const exercise of exercises) {
        expectValid(exercise)
        expect(exercise.mode).toBe(mode)

        const combination = `${exercise.key}|${exercise.direction}`
        if (previous !== undefined) {
          expect(combination, exercise.id).not.toBe(previous)
        }
        previous = combination

        expectUniqueChoices(exercise.choices, exercise.answer, exercise.id)

        if (exercise.direction === 'key-to-signature') {
          expect(exercise.answer, exercise.id).toBe(
            describeKeySignature(exercise.key, mode),
          )
        }
        if (exercise.direction === 'signature-to-key') {
          expect(exercise.answer, exercise.id).toMatch(
            new RegExp(` ${mode === 'major' ? 'mayor' : 'menor'}$`),
          )
        }
      }
    }
  })

  it('genera 500 transposiciones con la misma cantidad de notas y el mismo salto', () => {
    const exercises = generateTranspositionExercises({
      idPrefix: 'fuzz.transposition',
      skillId: SKILL_ID,
      difficulty: 3,
      count: CASES,
    })

    expect(exercises).toHaveLength(CASES)
    expect(new Set(exercises.map((exercise) => exercise.id)).size).toBe(CASES)

    let previous: string | undefined
    for (const exercise of exercises) {
      expectValid(exercise)
      expect(exercise.fromKey, exercise.id).not.toBe(exercise.toKey)
      expect(exercise.answer, exercise.id).toHaveLength(exercise.melody.length)

      const combination = `${exercise.fromKey}|${exercise.toKey}`
      if (previous !== undefined) {
        expect(combination, exercise.id).not.toBe(previous)
      }
      previous = combination

      const shift = transpositionSemitones(exercise.fromKey, exercise.toKey)
      for (let index = 0; index < exercise.melody.length; index += 1) {
        const from = midiOf(fromSpelledPitch(exercise.melody[index]))
        const to = midiOf(fromSpelledPitch(exercise.answer[index]))
        expect(to - from, `${exercise.id} nota ${index}`).toBe(shift)
      }
    }
  })
})
