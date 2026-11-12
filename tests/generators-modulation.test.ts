import { describe, expect, it } from 'vitest'
import { resolveExerciseAnswer } from '../src/exercises/answer'
import {
  MODULATION_RELATIONS,
  MODULATION_TONICS,
  PIVOT_ASKS,
  generateModulationExercise,
  generateModulationExercises,
  modulationDestinationFor,
  pivotChordsBetween,
} from '../src/exercises/generators/modulation'
import { formatPitchEs, midiOf, mod12, parsePitch } from '../src/theory/pitch'
import type { Exercise } from '../src/schemas'

type ModulationExercise = Extract<Exercise, { type: 'pivot-chord' }>

const RELATION_DESTINATIONS: Record<string, { dominant: string; subdominant: string }> = {
  C: { dominant: 'G', subdominant: 'F' },
  G: { dominant: 'D', subdominant: 'C' },
  D: { dominant: 'A', subdominant: 'G' },
  A: { dominant: 'E', subdominant: 'D' },
  E: { dominant: 'B', subdominant: 'A' },
  B: { dominant: 'F#', subdominant: 'E' },
  'F#': { dominant: 'C#', subdominant: 'B' },
  F: { dominant: 'C', subdominant: 'Bb' },
  Bb: { dominant: 'F', subdominant: 'Eb' },
  Eb: { dominant: 'Bb', subdominant: 'Ab' },
  Ab: { dominant: 'Eb', subdominant: 'Db' },
  Db: { dominant: 'Ab', subdominant: 'Gb' },
}

const IN_TWELVE = new Set<string>(MODULATION_TONICS)

function generate(
  overrides: Partial<Parameters<typeof generateModulationExercise>[0]> = {},
): Exercise {
  return generateModulationExercise({
    id: 'test.modulation',
    skillId: 'skill.modulation',
    fromKey: 'C',
    toKey: 'G',
    ask: 'source',
    ...overrides,
  })
}

function pivotOf(exercise: ModulationExercise) {
  const pivots = pivotChordsBetween(exercise.fromKey, exercise.toKey)
  return pivots.find((pivot) => pivot.degreeFrom === exercise.degreeFrom)
}

describe('F4-021 — generador de modulación con acorde pivote', () => {
  it('modula a la dominante y a la subdominante en las 12 tonalidades', () => {
    for (const fromKey of MODULATION_TONICS) {
      for (const relation of MODULATION_RELATIONS) {
        const toKey = RELATION_DESTINATIONS[fromKey][relation]
        expect(modulationDestinationFor(fromKey, relation)).toBe(toKey)
        if (!IN_TWELVE.has(toKey)) continue

        for (const ask of PIVOT_ASKS) {
          const exercise = generate({ fromKey, toKey, ask })
          if (exercise.type !== 'pivot-chord') {
            throw new Error('Se esperaba un acorde pivote')
          }
          const pivot = pivotOf(exercise)
          expect(pivot, `${fromKey} a ${toKey}`).toBeDefined()
          if (!pivot) continue

          expect(exercise.fromKey).toBe(fromKey)
          expect(exercise.toKey).toBe(toKey)
          expect(exercise.ask).toBe(ask)
          expect(exercise.degreeTo).toBe(pivot.degreeTo)

          // El pivote conserva las mismas notas en las dos tonalidades.
          const fromPcs = pivot.chordFrom.pitches.map((pitch) => mod12(midiOf(pitch)))
          const toPcs = pivot.chordTo.pitches.map((pitch) => mod12(midiOf(pitch)))
          expect(new Set(fromPcs), `${fromKey} a ${toKey}`).toEqual(
            new Set(toPcs),
          )

          // La tonalidad destino aparece en el enunciado.
          expect(exercise.promptEs).toContain(
            formatPitchEs(parsePitch(`${toKey}4`)),
          )

          const answer = ask === 'source' ? pivot.chordFrom.roman : pivot.chordTo.roman
          const resolved = resolveExerciseAnswer(exercise, 'es')
          expect(resolved.mode).toBe('choice')
          if (resolved.mode === 'choice') {
            expect(resolved.answer).toBe(answer)
          }
          expect(exercise.choices).toContain(answer)
          expect(exercise.choices).toHaveLength(4)
          expect(new Set(exercise.choices).size).toBe(4)
          expect(exercise.choicesEn).toEqual(exercise.choices)
        }
      }
    }
  })

  it('identifica el pivote de Do mayor a Sol mayor (vi en Do, ii en Sol)', () => {
    const exercise = generate({ fromKey: 'C', toKey: 'G', pivotDegree: 6 })
    if (exercise.type !== 'pivot-chord') {
      throw new Error('Se esperaba un acorde pivote')
    }
    expect(exercise.promptEs).toContain('Lam')
    expect(exercise.promptEs).toContain('La, Do, Mi')
    expect(exercise.promptEs).toContain('Do mayor')
    expect(exercise.promptEs).toContain('Sol mayor')
    expect(exercise.explanationEs).toContain('vi en Do')
    expect(exercise.explanationEs).toContain('ii en Sol')
    expect(exercise.degreeFrom).toBe(6)
    expect(exercise.degreeTo).toBe(2)

    const resolved = resolveExerciseAnswer(exercise, 'es')
    expect(resolved.mode).toBe('choice')
    if (resolved.mode === 'choice') {
      expect(resolved.answer).toBe('vi')
    }

    const target = generate({
      fromKey: 'C',
      toKey: 'G',
      pivotDegree: 6,
      ask: 'target',
    })
    if (target.type !== 'pivot-chord') {
      throw new Error('Se esperaba un acorde pivote')
    }
    const resolvedTarget = resolveExerciseAnswer(target, 'es')
    expect(resolvedTarget.mode).toBe('choice')
    if (resolvedTarget.mode === 'choice') {
      expect(resolvedTarget.answer).toBe('ii')
    }
  })

  it('el pivote de Do mayor a Fa mayor es I→V, ii→vi o vi→iii', () => {
    const pivots = pivotChordsBetween('C', 'F')
    expect(
      pivots.map((pivot) => `${pivot.degreeFrom}→${pivot.degreeTo}`).sort(),
    ).toEqual(['1→5', '2→6', '4→1', '6→3'])

    for (const pivot of pivots) {
      const exercise = generate({
        fromKey: 'C',
        toKey: 'F',
        pivotDegree: pivot.degreeFrom,
        ask: 'target',
      })
      if (exercise.type !== 'pivot-chord') {
        throw new Error('Se esperaba un acorde pivote')
      }
      expect(exercise.degreeTo).toBe(pivot.degreeTo)
      expect(exercise.explanationEs).toContain('Fa mayor')
    }
  })

  it('ajusta las opciones a la dificultad', () => {
    for (const difficulty of [1, 2, 3] as const) {
      const exercise = generate({ difficulty })
      if (exercise.type !== 'pivot-chord') {
        throw new Error('Se esperaba un acorde pivote')
      }
      expect(exercise.choices, `dificultad ${difficulty}`).toHaveLength(
        difficulty + 2,
      )
      expect(new Set(exercise.choices).size).toBe(
        (exercise.choices ?? []).length,
      )
    }
  })

  it('genera la matriz completa y salta los destinos fuera de las doce', () => {
    const all = generateModulationExercises({
      idPrefix: 'modulation-all',
      skillId: 'skill.modulation',
    })
    const pairs = MODULATION_TONICS.flatMap((fromKey) =>
      MODULATION_RELATIONS.map((relation) => ({
        fromKey,
        toKey: modulationDestinationFor(fromKey, relation),
      })),
    ).filter(({ toKey }) => IN_TWELVE.has(toKey))
    expect(all).toHaveLength(pairs.length * PIVOT_ASKS.length)
    expect(all[0].id).toBe('modulation-all-001')
    expect(all.at(-1)?.id).toBe(
      `modulation-all-${String(all.length).padStart(3, '0')}`,
    )
    expect(new Set(MODULATION_RELATIONS)).toEqual(
      new Set(['dominant', 'subdominant']),
    )
    expect(new Set(PIVOT_ASKS)).toEqual(new Set(['source', 'target']))

    // Fa♯ no modula a Do♯ y Re♭ no modula a Sol♭ porque no están en las doce.
    expect(
      all.some(
        (exercise) =>
          exercise.type === 'pivot-chord' &&
          (exercise.toKey === 'C#' || exercise.toKey === 'Gb'),
      ),
    ).toBe(false)

    const onlyDominant = generateModulationExercises({
      idPrefix: 'modulation-dominant',
      skillId: 'skill.modulation',
      relations: ['dominant'],
    })
    expect(onlyDominant).toHaveLength(11 * PIVOT_ASKS.length)

    const onlySubdominant = generateModulationExercises({
      idPrefix: 'modulation-subdominant',
      skillId: 'skill.modulation',
      relations: ['subdominant'],
    })
    expect(onlySubdominant).toHaveLength(11 * PIVOT_ASKS.length)

    const partial = generateModulationExercises({
      idPrefix: 'modulation-partial',
      skillId: 'skill.modulation',
      fromTonics: ['C'],
      relations: ['dominant'],
      count: 1,
    })
    expect(partial).toHaveLength(1)
    expect(partial[0].id).toBe('modulation-partial-001')

    const empty = generateModulationExercises({
      idPrefix: 'modulation-empty',
      skillId: 'skill.modulation',
      asks: [],
    })
    expect(empty).toHaveLength(0)
  })

  it('rechaza tonalidades y relaciones inválidas', () => {
    expect(() => generate({ fromKey: 'H' })).toThrow()
    expect(() => generate({ toKey: 'H' })).toThrow()
    expect(() => generate({ fromKey: 'C', toKey: 'C' })).toThrow()
    expect(() => generate({ fromKey: 'C', toKey: 'D' })).toThrow()
    expect(() => generate({ fromKey: 'C', toKey: 'A' })).toThrow()
    // Re mayor no es pivote entre Do y Sol (no pertenece a Sol mayor).
    expect(() =>
      generate({ fromKey: 'C', toKey: 'G', pivotDegree: 2 }),
    ).toThrow()
    expect(() =>
      generate({ fromKey: 'C', toKey: 'G', pivotDegree: 7 }),
    ).toThrow()
  })
})
