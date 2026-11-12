import { describe, expect, it } from 'vitest'
import { ExerciseSchema } from '../src/schemas/content'
import type { Key } from '../src/schemas/notation'
import {
  KEY_SIGNATURE_DIRECTIONS,
  KEY_SIGNATURE_MAJOR_TONICS,
  KEY_SIGNATURE_MINOR_TONICS,
  describeKeySignature,
  generateKeySignatureExercise,
  generateKeySignatureExercises,
} from '../src/exercises/generators/key-signature'

const EXPECTED_MAJOR_SIGNATURES: Record<string, string> = {
  Cb: '7 bemoles (Bb Eb Ab Db Gb Cb Fb)',
  Gb: '6 bemoles (Bb Eb Ab Db Gb Cb)',
  Db: '5 bemoles (Bb Eb Ab Db Gb)',
  Ab: '4 bemoles (Bb Eb Ab Db)',
  Eb: '3 bemoles (Bb Eb Ab)',
  Bb: '2 bemoles (Bb Eb)',
  F: '1 bemol (Bb)',
  C: 'Sin alteraciones',
  G: '1 sostenido (F#)',
  D: '2 sostenidos (F# C#)',
  A: '3 sostenidos (F# C# G#)',
  E: '4 sostenidos (F# C# G# D#)',
  B: '5 sostenidos (F# C# G# D# A#)',
  'F#': '6 sostenidos (F# C# G# D# A# E#)',
  'C#': '7 sostenidos (F# C# G# D# A# E# B#)',
}

const EXPECTED_MINOR_TONICS = [
  'Ab',
  'Eb',
  'Bb',
  'F',
  'C',
  'G',
  'D',
  'A',
  'E',
  'B',
  'F#',
  'C#',
  'G#',
  'D#',
  'A#',
]

const TONIC_NAMES_ES: Record<string, string> = {
  Cb: 'Do bemol',
  Gb: 'Sol bemol',
  Db: 'Re bemol',
  Ab: 'La bemol',
  Eb: 'Mi bemol',
  Bb: 'Si bemol',
  F: 'Fa',
  C: 'Do',
  G: 'Sol',
  D: 'Re',
  A: 'La',
  E: 'Mi',
  B: 'Si',
  'F#': 'Fa sostenido',
  'C#': 'Do sostenido',
}

function keyLabel(tonic: Key): string {
  return `${TONIC_NAMES_ES[tonic]} mayor`
}

describe('F2-035 — Generador de armaduras y círculo de quintas', () => {
  it('lista las 15 armaduras mayores y menores', () => {
    expect(KEY_SIGNATURE_MAJOR_TONICS).toEqual([
      'Cb',
      'Gb',
      'Db',
      'Ab',
      'Eb',
      'Bb',
      'F',
      'C',
      'G',
      'D',
      'A',
      'E',
      'B',
      'F#',
      'C#',
    ])
    expect(KEY_SIGNATURE_MINOR_TONICS).toEqual(EXPECTED_MINOR_TONICS)
    expect(KEY_SIGNATURE_DIRECTIONS).toEqual([
      'key-to-signature',
      'signature-to-key',
      'fifth-up',
      'fifth-down',
    ])
  })

  it('describe correctamente las 15 armaduras mayores', () => {
    expect(KEY_SIGNATURE_MAJOR_TONICS).toHaveLength(15)
    for (const tonic of KEY_SIGNATURE_MAJOR_TONICS) {
      expect(describeKeySignature(tonic, 'major')).toBe(EXPECTED_MAJOR_SIGNATURES[tonic])
    }
  })

  it('pregunta tonalidad → armadura y armadura → tonalidad', () => {
    const toSignature = generateKeySignatureExercise({
      id: 'ex.key-signature.to-signature',
      skillId: 'skill.key-signature',
      tonic: 'D',
      direction: 'key-to-signature',
      difficulty: 2,
    })
    expect(toSignature.answer).toBe('2 sostenidos (F# C#)')
    expect(toSignature.promptEs).toContain('Re mayor')
    expect(toSignature.explanationEs).toContain('F# y C#')
    expect(toSignature.choices).toContain(toSignature.answer)

    const toKey = generateKeySignatureExercise({
      id: 'ex.key-signature.to-key',
      skillId: 'skill.key-signature',
      tonic: 'D',
      direction: 'signature-to-key',
      difficulty: 2,
    })
    expect(toKey.answer).toBe('Re mayor')
    expect(toKey.promptEs).toContain('2 sostenidos (F# C#)')
    expect(toKey.choices).toContain('Re mayor')

    const empty = generateKeySignatureExercise({
      id: 'ex.key-signature.empty',
      skillId: 'skill.key-signature',
      tonic: 'C',
      direction: 'signature-to-key',
      difficulty: 1,
    })
    expect(empty.answer).toBe('Do mayor')
    expect(empty.promptEs).toContain('no tiene alteraciones')
  })

  it('genera la matriz por defecto con ambos sentidos y vecinos del círculo', () => {
    const exercises = generateKeySignatureExercises({
      skillId: 'skill.key-signature',
      idPrefix: 'ex.key-signature.matrix',
      difficulty: 2,
    })

    expect(exercises).toHaveLength(58)
    expect(new Set(exercises.map((exercise) => exercise.id)).size).toBe(58)
    expect(
      new Set(exercises.map((exercise) => `${exercise.key}|${exercise.direction}`)).size,
    ).toBe(58)

    const byDirection = new Map<string, number>()
    for (const exercise of exercises) {
      byDirection.set(exercise.direction, (byDirection.get(exercise.direction) ?? 0) + 1)
      const result = ExerciseSchema.safeParse(exercise)
      expect(result.success).toBe(true)
      if (!result.success) continue
      const parsed = result.data
      if (parsed.type !== 'key-signature') throw new Error('Tipo inesperado en la matriz')
      expect(parsed.direction).toBe(exercise.direction)
      expect(parsed.answer).toBe(exercise.answer)
      expect(parsed.key).toBe(exercise.key)
      expect(exercise.choices).toContain(exercise.answer)
      expect(exercise.choices).toHaveLength(3)
      expect(new Set(exercise.choices).size).toBe(exercise.choices.length)
    }

    expect(byDirection.get('key-to-signature')).toBe(15)
    expect(byDirection.get('signature-to-key')).toBe(15)
    expect(byDirection.get('fifth-up')).toBe(14)
    expect(byDirection.get('fifth-down')).toBe(14)

    const toSignature = new Map(
      exercises
        .filter((exercise) => exercise.direction === 'key-to-signature')
        .map((exercise) => [exercise.key, exercise]),
    )
    const toKey = new Map(
      exercises
        .filter((exercise) => exercise.direction === 'signature-to-key')
        .map((exercise) => [exercise.key, exercise]),
    )
    for (const tonic of KEY_SIGNATURE_MAJOR_TONICS) {
      const forward = toSignature.get(tonic)
      const backward = toKey.get(tonic)
      expect(forward?.answer).toBe(EXPECTED_MAJOR_SIGNATURES[tonic])
      expect(backward?.answer).toBe(keyLabel(tonic))
      if (!forward || !backward) continue
      if (forward.answer === 'Sin alteraciones') {
        expect(backward.promptEs).toContain('no tiene alteraciones')
      } else {
        expect(backward.promptEs.toLowerCase()).toContain(forward.answer.toLowerCase())
      }
    }
  })

  it('calcula los vecinos del círculo de quintas y omite los extremos inválidos', () => {
    const up = generateKeySignatureExercise({
      id: 'ex.key-signature.fifth-up',
      skillId: 'skill.key-signature',
      tonic: 'G',
      direction: 'fifth-up',
      difficulty: 2,
    })
    expect(up.answer).toBe('Re mayor')
    expect(up.promptEs).toContain('quinta justa arriba')

    const down = generateKeySignatureExercise({
      id: 'ex.key-signature.fifth-down',
      skillId: 'skill.key-signature',
      tonic: 'G',
      direction: 'fifth-down',
      difficulty: 2,
    })
    expect(down.answer).toBe('Do mayor')
    expect(down.promptEs).toContain('quinta justa abajo')

    const exercises = generateKeySignatureExercises({
      skillId: 'skill.key-signature',
      idPrefix: 'ex.key-signature.fifths',
      difficulty: 2,
      directions: ['fifth-up', 'fifth-down'],
    })
    for (const exercise of exercises) {
      const index = KEY_SIGNATURE_MAJOR_TONICS.indexOf(exercise.key)
      if (exercise.direction === 'fifth-up') {
        expect(exercise.answer).toBe(keyLabel(KEY_SIGNATURE_MAJOR_TONICS[index + 1]))
      } else {
        expect(exercise.answer).toBe(keyLabel(KEY_SIGNATURE_MAJOR_TONICS[index - 1]))
      }
    }
    expect(exercises.some((exercise) => exercise.key === 'C#' && exercise.direction === 'fifth-up')).toBe(false)
    expect(exercises.some((exercise) => exercise.key === 'Cb' && exercise.direction === 'fifth-down')).toBe(false)

    expect(() =>
      generateKeySignatureExercise({
        id: 'ex.key-signature.out-of-range',
        skillId: 'skill.key-signature',
        tonic: 'C#',
        direction: 'fifth-up',
        difficulty: 2,
      }),
    ).toThrow('dentro de las 15 armaduras')
  })

  it('soporta las 15 armaduras menores', () => {
    const exercises = generateKeySignatureExercises({
      skillId: 'skill.key-signature',
      idPrefix: 'ex.key-signature.minor',
      difficulty: 2,
      mode: 'minor',
      directions: ['key-to-signature', 'signature-to-key'],
    })

    expect(exercises).toHaveLength(30)
    const aMinor = exercises.find(
      (exercise) => exercise.key === 'A' && exercise.direction === 'key-to-signature',
    )
    const fSharpMinor = exercises.find(
      (exercise) => exercise.key === 'F#' && exercise.direction === 'key-to-signature',
    )
    const cSharpMinor = exercises.find(
      (exercise) => exercise.key === 'C#' && exercise.direction === 'key-to-signature',
    )
    expect(aMinor?.answer).toBe('Sin alteraciones')
    expect(fSharpMinor?.answer).toBe('3 sostenidos (F# C# G#)')
    expect(cSharpMinor?.answer).toBe('4 sostenidos (F# C# G# D#)')

    const toKey = exercises.find(
      (exercise) => exercise.key === 'A' && exercise.direction === 'signature-to-key',
    )
    expect(toKey?.answer).toBe('La menor')
  })

  it('ajusta la cantidad de opciones a la dificultad', () => {
    const base = {
      skillId: 'skill.key-signature',
      tonic: 'C' as const,
      direction: 'key-to-signature' as const,
    }
    const easy = generateKeySignatureExercise({ ...base, id: 'ex.key-signature.easy', difficulty: 1 })
    const medium = generateKeySignatureExercise({
      ...base,
      id: 'ex.key-signature.medium',
      difficulty: 2,
    })
    const hard = generateKeySignatureExercise({ ...base, id: 'ex.key-signature.hard', difficulty: 3 })

    expect(easy.choices).toHaveLength(2)
    expect(medium.choices).toHaveLength(3)
    expect(hard.choices).toHaveLength(4)
  })

  it('permite limitar tónicas, sentidos y cantidad', () => {
    const exercises = generateKeySignatureExercises({
      skillId: 'skill.key-signature',
      idPrefix: 'ex.key-signature.custom',
      difficulty: 2,
      tonics: ['C', 'G'],
      directions: ['key-to-signature', 'signature-to-key'],
      count: 5,
    })

    expect(exercises).toHaveLength(5)
    expect(new Set(exercises.map((exercise) => exercise.id)).size).toBe(5)
    const pairs = exercises.map((exercise) => `${exercise.key}|${exercise.direction}`)
    expect(new Set(pairs)).toEqual(
      new Set(['C|key-to-signature', 'C|signature-to-key', 'G|key-to-signature', 'G|signature-to-key']),
    )
    for (const exercise of exercises) {
      expect(ExerciseSchema.safeParse(exercise).success).toBe(true)
    }
  })
})
