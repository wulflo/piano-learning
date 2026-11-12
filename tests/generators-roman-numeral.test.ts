import { describe, expect, it } from 'vitest'
import { exerciseChoices } from '../src/content/localize'
import {
  ROMAN_NUMERAL_TONICS,
  generateRomanNumeralExercise,
  generateRomanNumeralExercises,
} from '../src/exercises/generators/roman-numeral'
import { resolveExerciseAnswer } from '../src/exercises/answer'
import {
  chordSymbol,
  diatonicChord,
  diatonicChords,
  toSpelledPitch,
  type DiatonicMode,
} from '../src/theory'

const ALL_DEGREES = [1, 2, 3, 4, 5, 6, 7] as const

function slug(tonic: string): string {
  return tonic.replace('#', 's').toLowerCase()
}

function numeralSet(tonic: string, mode: DiatonicMode): Set<string> {
  return new Set(diatonicChords(`${tonic}4`, mode).map((chord) => chord.roman))
}

function chordSet(
  tonic: string,
  mode: DiatonicMode,
  notation: 'do' | 'c',
): Set<string> {
  return new Set(
    diatonicChords(`${tonic}4`, mode).map((chord) =>
      chordSymbol(chord.root, chord.quality, { notation }),
    ),
  )
}

describe('F4-017 — generador de números romanos ↔ acordes', () => {
  it('genera el sentido acorde → numeral en las 12 tonalidades', () => {
    for (const tonic of ROMAN_NUMERAL_TONICS) {
      const exercise = generateRomanNumeralExercise({
        id: `roman.${slug(tonic)}.4`,
        skillId: 'skill.roman-numeral',
        tonic,
        direction: 'chord-to-numeral',
        degree: 4,
        difficulty: 2,
      })
      expect(exercise.type, tonic).toBe('roman-numeral')
      if (exercise.type !== 'roman-numeral') continue

      expect(exercise.numeral, tonic).toBe('IV')
      expect(exercise.key, tonic).toBe(tonic)
      expect(exercise.mode, tonic).toBe('major')
      expect(exercise.choices, tonic).toHaveLength(3)
      const allowed = numeralSet(tonic, 'major')
      for (const choice of exercise.choices ?? []) {
        expect(allowed.has(choice), `${tonic}: ${choice}`).toBe(true)
      }
      expect(new Set(exercise.choices).size, tonic).toBe(3)

      const answer = resolveExerciseAnswer(exercise, 'es')
      expect(answer.mode, tonic).toBe('choice')
      if (answer.mode === 'choice') {
        expect(answer.answer, tonic).toBe('IV')
        expect(exercise.choices ?? [], tonic).toContain(answer.answer)
      }
    }
  })

  it('genera el sentido numeral → acorde en las 12 tonalidades', () => {
    for (const tonic of ROMAN_NUMERAL_TONICS) {
      const expected = diatonicChord(`${tonic}4`, 'major', 4)
      const exercise = generateRomanNumeralExercise({
        id: `roman.${slug(tonic)}.iv`,
        skillId: 'skill.roman-numeral',
        tonic,
        direction: 'numeral-to-chord',
        degree: 4,
        difficulty: 2,
      })
      expect(exercise.type, tonic).toBe('chord')
      if (exercise.type !== 'chord') continue

      expect(exercise.ask, tonic).toBe('symbol')
      expect(exercise.root.step, tonic).toBe(expected.root.step)
      expect(exercise.root.accidental, tonic).toBe(
        toSpelledPitch(expected.root).accidental,
      )
      expect(exercise.quality, tonic).toBe(expected.quality)
      expect(exercise.choices, tonic).toHaveLength(3)
      expect(exercise.choicesEn, tonic).toHaveLength(3)

      const doChoices = chordSet(tonic, 'major', 'do')
      const cChoices = chordSet(tonic, 'major', 'c')
      for (const choice of exercise.choices ?? []) {
        expect(doChoices.has(choice), `${tonic} ES: ${choice}`).toBe(true)
      }
      for (const choice of exercise.choicesEn ?? []) {
        expect(cChoices.has(choice), `${tonic} EN: ${choice}`).toBe(true)
      }

      const spanish = resolveExerciseAnswer(exercise, 'es')
      const english = resolveExerciseAnswer(exercise, 'en')
      expect(spanish.mode, tonic).toBe('choice')
      expect(english.mode, tonic).toBe('choice')
      if (spanish.mode !== 'choice' || english.mode !== 'choice') continue
      expect(exercise.choices ?? [], tonic).toContain(spanish.answer)
      expect(exercise.choicesEn ?? [], tonic).toContain(english.answer)
      expect(
        (exercise.choices ?? []).indexOf(spanish.answer),
        `${tonic} índices`,
      ).toBe((exercise.choicesEn ?? []).indexOf(english.answer))
    }
  })

  it('recorre las 12 tonalidades, los 2 sentidos y los 7 grados', () => {
    const exercises = generateRomanNumeralExercises({
      idPrefix: 'roman-matrix',
      skillId: 'skill.roman-numeral',
    })
    expect(exercises).toHaveLength(ROMAN_NUMERAL_TONICS.length * 2 * 7)

    const tonics = new Set<string>()
    const directions = new Set<string>()
    for (const exercise of exercises) {
      if (exercise.type === 'roman-numeral') {
        directions.add('chord-to-numeral')
        tonics.add(exercise.key)
      }
      if (exercise.type === 'chord') {
        directions.add('numeral-to-chord')
      }
    }
    expect([...tonics].sort()).toEqual([...ROMAN_NUMERAL_TONICS].sort())
    expect(directions).toEqual(
      new Set(['chord-to-numeral', 'numeral-to-chord']),
    )
  })

  it('cubre los siete grados en ambos sentidos', () => {
    for (const direction of ['chord-to-numeral', 'numeral-to-chord'] as const) {
      const exercises = generateRomanNumeralExercises({
        idPrefix: `roman-${direction}`,
        skillId: 'skill.roman-numeral',
        tonics: ['C'],
        directions: [direction],
        degrees: ALL_DEGREES,
      })
      expect(exercises, direction).toHaveLength(7)
      if (direction === 'chord-to-numeral') {
        expect(
          exercises.map((exercise) =>
            exercise.type === 'roman-numeral' ? exercise.numeral : null,
          ),
          direction,
        ).toEqual(['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'])
      } else {
        expect(
          exercises.map((exercise) =>
            exercise.type === 'chord'
              ? `${exercise.root.step}${exercise.root.accidental}`
              : null,
          ),
          direction,
        ).toEqual(['C', 'D', 'E', 'F', 'G', 'A', 'B'])
      }
    }
  })

  it('aplica las cualidades de la menor armónica', () => {
    const exercises = generateRomanNumeralExercises({
      idPrefix: 'roman-minor',
      skillId: 'skill.roman-numeral',
      mode: 'minor',
      scale: 'harmonic-minor',
      tonics: ['A'],
      directions: ['numeral-to-chord'],
      degrees: ALL_DEGREES,
    })
    const qualities = exercises.map((exercise) =>
      exercise.type === 'chord' ? exercise.quality : null,
    )
    expect(qualities).toEqual([
      'minor',
      'diminished',
      'augmented',
      'minor',
      'major',
      'major',
      'diminished',
    ])
    for (const tonic of ROMAN_NUMERAL_TONICS) {
      const dominant = generateRomanNumeralExercise({
        id: `roman.${slug(tonic)}.v`,
        skillId: 'skill.roman-numeral',
        tonic,
        mode: 'minor',
        scale: 'harmonic-minor',
        direction: 'chord-to-numeral',
        degree: 5,
      })
      expect(dominant.type, tonic).toBe('roman-numeral')
      if (dominant.type !== 'roman-numeral') continue
      expect(dominant.numeral, tonic).toBe('V')
      expect(dominant.mode, tonic).toBe('minor')
    }
  })

  it('ajusta la cantidad de distractores a la dificultad', () => {
    for (const direction of ['chord-to-numeral', 'numeral-to-chord'] as const) {
      for (const difficulty of [1, 2, 3] as const) {
        const exercise = generateRomanNumeralExercise({
          id: `roman-${direction}-${difficulty}`,
          skillId: 'skill.roman-numeral',
          tonic: 'C',
          direction,
          degree: 4,
          difficulty,
        })
        if (exercise.type !== 'roman-numeral' && exercise.type !== 'chord') {
          throw new Error('Se esperaba un ejercicio de números romanos')
        }
        expect(exercise.choices, `${direction} ${difficulty}`).toHaveLength(
          difficulty + 1,
        )
      }
    }
  })

  it('rechaza tonalidades y grados fuera de rango', () => {
    expect(() =>
      generateRomanNumeralExercise({
        id: 'roman.invalid-key',
        skillId: 'skill.roman-numeral',
        tonic: 'H',
        direction: 'chord-to-numeral',
        degree: 4,
      }),
    ).toThrow()
    for (const degree of [0, 8, 1.5]) {
      expect(() =>
        generateRomanNumeralExercise({
          id: `roman.invalid-degree.${degree}`,
          skillId: 'skill.roman-numeral',
          tonic: 'C',
          direction: 'numeral-to-chord',
          degree,
        }),
      ).toThrow()
    }
  })

  it('produce opciones bilingües alineadas en el sentido numeral → acorde', () => {
    for (const tonic of ROMAN_NUMERAL_TONICS) {
      const exercise = generateRomanNumeralExercise({
        id: `roman-bilingual-${slug(tonic)}`,
        skillId: 'skill.roman-numeral',
        tonic,
        direction: 'numeral-to-chord',
        degree: 4,
        difficulty: 2,
      })
      if (exercise.type !== 'chord') throw new Error('Se esperaba un acorde')
      const spanish = exerciseChoices(exercise, 'es') ?? []
      const english = exerciseChoices(exercise, 'en') ?? []
      expect(spanish, tonic).toHaveLength(3)
      expect(english, tonic).toHaveLength(3)
      for (const choice of spanish) {
        expect(
          chordSet(tonic, 'major', 'do').has(choice),
          `${tonic} ES: ${choice}`,
        ).toBe(true)
      }
      for (const choice of english) {
        expect(
          chordSet(tonic, 'major', 'c').has(choice),
          `${tonic} EN: ${choice}`,
        ).toBe(true)
      }
    }
  })
})
