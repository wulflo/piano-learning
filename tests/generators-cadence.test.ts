import { describe, expect, it } from 'vitest'
import { timelineDuration } from '../src/audio/notes'
import { resolveExerciseAnswer } from '../src/exercises/answer'
import { buildProgressionCompletionAudio } from '../src/exercises/progression-completion'
import {
  CADENCE_DIRECTIONS,
  CADENCE_TONICS,
  CADENCE_TYPES,
  generateCadenceExercise,
  generateCadenceExercises,
} from '../src/exercises/generators/cadence'
import {
  cadenceName,
  diatonicChords,
  type CadenceType,
} from '../src/theory'
import type { Exercise } from '../src/schemas'

type CadenceExercise = Extract<Exercise, { type: 'cadence' }>

const MAJOR_DEGREES: Record<
  CadenceType,
  { from: number; to: number; missing: 'from' | 'to'; answer: string }
> = {
  authentic: { from: 5, to: 1, missing: 'from', answer: 'V' },
  plagal: { from: 4, to: 1, missing: 'from', answer: 'IV' },
  half: { from: 2, to: 5, missing: 'to', answer: 'V' },
  deceptive: { from: 5, to: 6, missing: 'to', answer: 'vi' },
}

const MINOR_DEGREES: Record<
  CadenceType,
  { from: number; to: number; missing: 'from' | 'to'; answer: string }
> = {
  authentic: { from: 5, to: 1, missing: 'from', answer: 'V' },
  plagal: { from: 4, to: 1, missing: 'from', answer: 'iv' },
  half: { from: 1, to: 5, missing: 'to', answer: 'V' },
  deceptive: { from: 5, to: 6, missing: 'to', answer: 'VI' },
}

function generate(
  overrides: Partial<Parameters<typeof generateCadenceExercise>[0]> = {},
): Exercise {
  return generateCadenceExercise({
    id: 'test.cadence',
    skillId: 'skill.cadence',
    tonic: 'C',
    type: 'authentic',
    direction: 'identify',
    ...overrides,
  })
}

function numeralsInKey(tonic: string, mode: 'major' | 'minor'): Set<string> {
  return new Set(
    diatonicChords(tonic, mode === 'minor' ? 'harmonic-minor' : 'major').map(
      (chord) => chord.roman,
    ),
  )
}

describe('F4-019 — generador de cadencias', () => {
  it('identifica las cuatro cadencias en las 12 tonalidades mayores', () => {
    for (const tonic of CADENCE_TONICS) {
      for (const type of CADENCE_TYPES) {
        const expected = MAJOR_DEGREES[type]
        const exercise = generate({ tonic, type, direction: 'identify' })
        if (exercise.type !== 'cadence') throw new Error('Se esperaba una cadencia')

        expect(exercise.key).toBe(tonic)
        expect(exercise.mode).toBe('major')
        expect(exercise.fromDegree).toBe(expected.from)
        expect(exercise.toDegree).toBe(expected.to)
        expect(exercise.choices).toHaveLength(4)
        expect(exercise.choicesEn).toHaveLength(4)
        expect(exercise.explanationEs).toContain(cadenceName(type, 'es'))
        expect(exercise.explanationEn).toContain(cadenceName(type, 'en'))

        const spanish = resolveExerciseAnswer(exercise, 'es')
        const english = resolveExerciseAnswer(exercise, 'en')
        expect(spanish.mode).toBe('choice')
        expect(english.mode).toBe('choice')
        if (spanish.mode !== 'choice' || english.mode !== 'choice') continue
        expect(spanish.answer).toBe(cadenceName(type, 'es'))
        expect(english.answer).toBe(cadenceName(type, 'en'))
        expect(exercise.choices ?? []).toContain(spanish.answer)
        expect(exercise.choicesEn ?? []).toContain(english.answer)
        expect(
          (exercise.choices ?? []).indexOf(spanish.answer),
          `${tonic} ${type}`,
        ).toBe((exercise.choicesEn ?? []).indexOf(english.answer))
      }
    }
  })

  it('identifica las cadencias menores con la escala armónica', () => {
    for (const tonic of CADENCE_TONICS) {
      for (const type of CADENCE_TYPES) {
        const expected = MINOR_DEGREES[type]
        const exercise = generate({
          tonic,
          mode: 'minor',
          type,
          direction: 'identify',
        })
        if (exercise.type !== 'cadence') throw new Error('Se esperaba una cadencia')
        expect(exercise.mode).toBe('minor')
        expect(exercise.fromDegree).toBe(expected.from)
        expect(exercise.toDegree).toBe(expected.to)
      }
    }

    const aMinor = generate({
      tonic: 'A',
      mode: 'minor',
      type: 'authentic',
      direction: 'identify',
    }) as CadenceExercise
    // La dominante de La menor armónica lleva Sol♯, no Sol natural.
    expect(aMinor.promptEs).toContain('Sol♯')
    expect(aMinor.promptEn).toContain('G♯')
  })

  it('completa las cuatro cadencias en las 12 tonalidades mayores', () => {
    for (const tonic of CADENCE_TONICS) {
      for (const type of CADENCE_TYPES) {
        const expected = MAJOR_DEGREES[type]
        const exercise = generate({ tonic, type, direction: 'complete' })
        if (exercise.type !== 'progression-completion') {
          throw new Error('Se esperaba completar una progresión')
        }

        expect(exercise.key).toBe(tonic)
        expect(exercise.mode).toBe('major')
        expect(exercise.degrees).toHaveLength(2)
        expect(exercise.degrees[expected.missing === 'from' ? 0 : 1]).toBe(
          expected.answer,
        )
        expect(exercise.missingIndex).toBe(expected.missing === 'from' ? 0 : 1)
        expect(exercise.promptEs).toContain(cadenceName(type, 'es'))
        expect(exercise.promptEn).toContain(cadenceName(type, 'en'))
        expect(exercise.promptEs).toContain('?')

        const choices = exercise.choices ?? []
        const allowed = numeralsInKey(tonic, 'major')
        expect(new Set(choices).size).toBe(choices.length)
        expect(choices.filter((choice) => choice === expected.answer)).toHaveLength(
          1,
        )
        for (const choice of choices) {
          expect(allowed.has(choice), `${tonic} ${type}: ${choice}`).toBe(true)
        }

        const resolved = resolveExerciseAnswer(exercise, 'es')
        expect(resolved.mode).toBe('choice')
        if (resolved.mode === 'choice') {
          expect(resolved.answer).toBe(expected.answer)
        }
      }
    }
  })

  it('completa las cadencias menores con las cualidades armónicas', () => {
    for (const tonic of CADENCE_TONICS) {
      for (const type of CADENCE_TYPES) {
        const expected = MINOR_DEGREES[type]
        const exercise = generate({
          tonic,
          mode: 'minor',
          type,
          direction: 'complete',
        })
        if (exercise.type !== 'progression-completion') {
          throw new Error('Se esperaba completar una progresión')
        }
        expect(exercise.degrees[expected.missing === 'from' ? 0 : 1]).toBe(
          expected.answer,
        )
        const allowed = numeralsInKey(tonic, 'minor')
        for (const choice of exercise.choices ?? []) {
          expect(allowed.has(choice), `${tonic} ${type}: ${choice}`).toBe(true)
        }
      }
    }
  })

  it('ajusta las opciones de completar a la dificultad', () => {
    for (const difficulty of [1, 2, 3] as const) {
      const exercise = generate({
        direction: 'complete',
        difficulty,
      })
      if (exercise.type !== 'progression-completion') {
        throw new Error('Se esperaba completar una progresión')
      }
      expect(exercise.choices, `dificultad ${difficulty}`).toHaveLength(
        difficulty + 2,
      )
      expect(new Set(exercise.choices).size).toBe(
        (exercise.choices ?? []).length,
      )
    }
  })

  it('permite escuchar la cadencia completada', () => {
    const exercise = generate({
      tonic: 'G',
      type: 'authentic',
      direction: 'complete',
    })
    if (exercise.type !== 'progression-completion') {
      throw new Error('Se esperaba completar una progresión')
    }
    const audio = buildProgressionCompletionAudio(exercise, { tempo: 60 })
    expect(audio.chords.map((chord) => chord.numeral)).toEqual(['V', 'I'])
    expect(audio.chords.map((chord) => chord.midis)).toEqual([
      [74, 78, 81],
      [67, 71, 74],
    ])
    expect(audio.timeline).toHaveLength(2)
    expect(audio.contextTimeline).toHaveLength(1)
    expect(timelineDuration(audio.timeline)).toBe(3)
  })

  it('genera la matriz completa de tonalidades, tipos y direcciones', () => {
    const major = generateCadenceExercises({
      idPrefix: 'cadence-major',
      skillId: 'skill.cadence',
    })
    expect(major).toHaveLength(CADENCE_TONICS.length * CADENCE_TYPES.length * 2)
    expect(major[0].id).toBe('cadence-major-001')
    expect(major.at(-1)?.id).toBe(
      `cadence-major-${String(major.length).padStart(3, '0')}`,
    )
    expect(new Set(CADENCE_DIRECTIONS)).toEqual(
      new Set(['identify', 'complete']),
    )

    const both = generateCadenceExercises({
      idPrefix: 'cadence-all',
      skillId: 'skill.cadence',
      modes: ['major', 'minor'],
      count: 7,
    })
    expect(both).toHaveLength(7)

    const onlyIdentify = generateCadenceExercises({
      idPrefix: 'cadence-identify',
      skillId: 'skill.cadence',
      directions: ['identify'],
    })
    expect(
      onlyIdentify.every((exercise) => exercise.type === 'cadence'),
    ).toBe(true)
    expect(onlyIdentify).toHaveLength(CADENCE_TONICS.length * CADENCE_TYPES.length)

    const empty = generateCadenceExercises({
      idPrefix: 'cadence-empty',
      skillId: 'skill.cadence',
      types: [],
    })
    expect(empty).toHaveLength(0)
  })

  it('rechaza tonalidades y tipos inválidos', () => {
    expect(() => generate({ tonic: 'H' })).toThrow()
    expect(() =>
      generate({ type: 'no-existe' as CadenceType }),
    ).toThrow()
  })
})
