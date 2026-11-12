import { describe, expect, it } from 'vitest'
import { timelineDuration } from '../src/audio/notes'
import { resolveExerciseAnswer } from '../src/exercises/answer'
import {
  PROGRESSION_CHORD_BEATS,
} from '../src/exercises/progression-dictation'
import { buildProgressionCompletionAudio } from '../src/exercises/progression-completion'
import {
  MAJOR_PROGRESSION_PATTERNS,
  MINOR_PROGRESSION_PATTERNS,
  PROGRESSION_COMPLETION_TONICS,
  generateProgressionCompletionExercise,
  generateProgressionCompletionExercises,
  patternsForMode,
} from '../src/exercises/generators/progression-completion'
import {
  diatonicChords,
  midiOf,
  parseRomanNumeral,
  romanToChord,
} from '../src/theory'
import type { Exercise } from '../src/schemas'

type ProgressionCompletionExercise = Extract<
  Exercise,
  { type: 'progression-completion' }
>

function generate(
  overrides: Partial<Parameters<typeof generateProgressionCompletionExercise>[0]> = {},
): ProgressionCompletionExercise {
  const exercise = generateProgressionCompletionExercise({
    id: 'test.progression-completion',
    skillId: 'skill.common-progressions',
    tonic: 'C',
    patternId: 'pop',
    missingIndex: 2,
    difficulty: 2,
    ...overrides,
  })
  if (exercise.type !== 'progression-completion') {
    throw new Error('Se esperaba un ejercicio de completar progresiones')
  }
  return exercise
}

function numeralsInKey(tonic: string, mode: 'major' | 'minor'): Set<string> {
  return new Set(
    diatonicChords(tonic, mode === 'minor' ? 'natural-minor' : 'major').map(
      (chord) => chord.roman,
    ),
  )
}

/**
 * Grados del catálogo que completarían el mismo contexto. Sirve para comprobar
 * que un distractor no convierte la progresión en otro patrón conocido.
 */
function catalogCompletions(
  degrees: readonly string[],
  missingIndex: number,
  mode: 'major' | 'minor',
): string[] {
  return patternsForMode(mode)
    .filter((pattern) => pattern.degrees.length === degrees.length)
    .filter((pattern) =>
      pattern.degrees.every(
        (degree, index) =>
          index === missingIndex || degree === degrees[index],
      ),
    )
    .map((pattern) => pattern.degrees[missingIndex])
}

describe('F4-018 — generador de progresiones para completar', () => {
  it('genera un hueco lógico en las 12 tonalidades mayores', () => {
    let count = 0
    for (const tonic of PROGRESSION_COMPLETION_TONICS) {
      for (const pattern of MAJOR_PROGRESSION_PATTERNS) {
        for (let missingIndex = 0; missingIndex < pattern.degrees.length; missingIndex += 1) {
          const exercise = generate({ tonic, patternId: pattern.id, missingIndex })
          count += 1

          expect(exercise.type).toBe('progression-completion')
          expect(exercise.key).toBe(tonic)
          expect(exercise.mode).toBe('major')
          expect(exercise.degrees).toEqual([...pattern.degrees])
          expect(exercise.missingIndex).toBe(missingIndex)

          const answer = pattern.degrees[missingIndex]
          const display = pattern.degrees
            .map((degree, index) => (index === missingIndex ? '?' : degree))
            .join('-')
          expect(display.split('?').length - 1, `${tonic} ${pattern.id}`).toBe(1)
          expect(exercise.promptEs).toContain(pattern.descriptionEs)
          expect(exercise.promptEs).toContain(display)
          expect(exercise.promptEn).toContain(pattern.descriptionEn)
          expect(exercise.explanationEs).toContain(answer)
          expect(exercise.explanationEn).toContain(answer)

          const resolved = resolveExerciseAnswer(exercise, 'es')
          expect(resolved.mode).toBe('choice')
          if (resolved.mode !== 'choice') continue
          expect(resolved.answer).toBe(answer)
          expect(exercise.choices ?? []).toContain(answer)
        }
      }
    }
    expect(count).toBe(
      PROGRESSION_COMPLETION_TONICS.length *
        MAJOR_PROGRESSION_PATTERNS.reduce(
          (total, pattern) => total + pattern.degrees.length,
          0,
        ),
    )
  })

  it('usa solo opciones diatónicas válidas y una respuesta única', () => {
    for (const tonic of PROGRESSION_COMPLETION_TONICS) {
      for (const pattern of MAJOR_PROGRESSION_PATTERNS) {
        for (let missingIndex = 0; missingIndex < pattern.degrees.length; missingIndex += 1) {
          const exercise = generate({ tonic, patternId: pattern.id, missingIndex })
          const choices = exercise.choices ?? []
          const answer = pattern.degrees[missingIndex]
          const allowed = numeralsInKey(tonic, 'major')

          expect(new Set(choices).size, `${tonic} ${pattern.id}`).toBe(
            choices.length,
          )
          expect(
            choices.filter((choice) => choice === answer),
            `${tonic} ${pattern.id}`,
          ).toHaveLength(1)
          expect(choices.length).toBeGreaterThanOrEqual(2)

          const completions = catalogCompletions(
            exercise.degrees,
            missingIndex,
            'major',
          )
          for (const choice of choices) {
            expect(() => parseRomanNumeral(choice), choice).not.toThrow()
            expect(allowed.has(choice), `${tonic} ${pattern.id}: ${choice}`).toBe(
              true,
            )
            if (choice !== answer) {
              expect(
                completions.includes(choice),
                `${tonic} ${pattern.id}: ${choice} también completa el hueco`,
              ).toBe(false)
            }
          }
        }
      }
    }
  })

  it('genera los patrones menores con las cualidades de la menor natural', () => {
    for (const tonic of PROGRESSION_COMPLETION_TONICS) {
      for (const pattern of MINOR_PROGRESSION_PATTERNS) {
        for (let missingIndex = 0; missingIndex < pattern.degrees.length; missingIndex += 1) {
          const exercise = generate({
            tonic,
            mode: 'minor',
            patternId: pattern.id,
            missingIndex,
          })
          const answer = pattern.degrees[missingIndex]
          const allowed = numeralsInKey(tonic, 'minor')
          expect(exercise.mode).toBe('minor')
          expect(exercise.degrees).toEqual([...pattern.degrees])
          expect(allowed.has(answer)).toBe(true)

          for (const choice of exercise.choices ?? []) {
            expect(allowed.has(choice), `${tonic} ${pattern.id}: ${choice}`).toBe(
              true,
            )
          }
          expect(
            (exercise.choices ?? []).filter((choice) => choice === answer),
          ).toHaveLength(1)
        }
      }
    }
  })

  it('ajusta la cantidad de opciones a la dificultad sin perder validez', () => {
    for (const difficulty of [1, 2, 3] as const) {
      const exercise = generate({ difficulty })
      const choices = exercise.choices ?? []
      expect(choices, `dificultad ${difficulty}`).toHaveLength(difficulty + 2)
      expect(new Set(choices).size).toBe(choices.length)
      expect(choices).toContain(exercise.degrees[exercise.missingIndex])
    }
  })

  it('produce audio con la progresión completa, el hueco y el acorde faltante', () => {
    const exercise = generate({ tonic: 'C', patternId: 'pop', missingIndex: 2 })
    const audio = buildProgressionCompletionAudio(exercise, { tempo: 60 })

    expect(audio.key).toBe('C')
    expect(audio.mode).toBe('major')
    expect(audio.diatonicMode).toBe('major')
    expect(audio.degrees).toEqual(['I', 'V', 'vi', 'IV'])
    expect(audio.missingIndex).toBe(2)
    expect(audio.chords.map((chord) => chord.numeral)).toEqual([
      'I',
      'V',
      'vi',
      'IV',
    ])
    expect(audio.chords.map((chord) => chord.midis)).toEqual([
      [60, 64, 67],
      [67, 71, 74],
      [69, 72, 76],
      [65, 69, 72],
    ])
    expect(audio.timeline.map((event) => event.time)).toEqual([0, 1.5, 3, 4.5])
    expect(audio.timeline.map((event) => event.duration)).toEqual([
      1.5, 1.5, 1.5, 1.5,
    ])
    expect(timelineDuration(audio.timeline)).toBe(
      PROGRESSION_CHORD_BEATS * 4,
    )

    // El contexto conserva el tiempo del hueco, pero no lo hace sonar.
    expect(audio.contextTimeline.map((event) => event.time)).toEqual([
      0, 1.5, 4.5,
    ])
    expect(audio.contextTimeline.map((event) => event.midis)).toEqual([
      [60, 64, 67],
      [67, 71, 74],
      [65, 69, 72],
    ])

    expect(audio.missingTimeline).toHaveLength(1)
    expect(audio.missingTimeline[0].midis).toEqual([69, 72, 76])
    expect(audio.missingTimeline[0].time).toBe(0)
  })

  it('transporta el audio a otra tonalidad y a la menor', () => {
    const gMajor = generate({ tonic: 'G', patternId: 'pop', missingIndex: 2 })
    const gAudio = buildProgressionCompletionAudio(gMajor, { tempo: 60 })
    expect(gAudio.chords.map((chord) => chord.midis)).toEqual([
      [67, 71, 74],
      [74, 78, 81],
      [76, 79, 83],
      [72, 76, 79],
    ])

    const aMinor = generate({
      tonic: 'A',
      mode: 'minor',
      patternId: 'minor-andalusian',
      missingIndex: 2,
    })
    const minorAudio = buildProgressionCompletionAudio(aMinor, { tempo: 60 })
    expect(minorAudio.diatonicMode).toBe('natural-minor')
    expect(minorAudio.chords.map((chord) => chord.midis)).toEqual([
      [69, 72, 76],
      [77, 81, 84],
      [72, 76, 79],
      [79, 83, 86],
    ])
  })

  it('coincide con la ortografía del motor armónico', () => {
    for (const tonic of PROGRESSION_COMPLETION_TONICS) {
      const exercise = generate({ tonic, patternId: 'pachelbel', missingIndex: 4 })
      const audio = buildProgressionCompletionAudio(exercise, { tempo: 60 })
      expect(audio.chords.map((chord) => chord.numeral)).toEqual([
        ...exercise.degrees,
      ])
      for (const [index, degree] of exercise.degrees.entries()) {
        const chord = romanToChord(tonic, 'major', degree)
        expect(audio.chords[index].midis, `${tonic} ${degree}`).toEqual(
          chord.pitches.map((pitch) => midiOf(pitch)),
        )
      }
    }
  })

  it('genera la matriz completa y respeta el límite de cantidad', () => {
    const major = generateProgressionCompletionExercises({
      idPrefix: 'progression-major',
      skillId: 'skill.common-progressions',
    })
    const majorCount =
      PROGRESSION_COMPLETION_TONICS.length *
      MAJOR_PROGRESSION_PATTERNS.reduce(
        (total, pattern) => total + pattern.degrees.length,
        0,
      )
    expect(major).toHaveLength(majorCount)
    expect(major[0].id).toBe('progression-major-001')
    expect(major.at(-1)?.id).toBe(
      `progression-major-${String(majorCount).padStart(3, '0')}`,
    )
    expect(major.every((exercise) => exercise.type === 'progression-completion')).toBe(
      true,
    )

    const both = generateProgressionCompletionExercises({
      idPrefix: 'progression-all',
      skillId: 'skill.common-progressions',
      modes: ['major', 'minor'],
      count: 5,
    })
    expect(both).toHaveLength(5)

    const none = generateProgressionCompletionExercises({
      idPrefix: 'progression-none',
      skillId: 'skill.common-progressions',
      patternIds: ['no-existe'],
    })
    expect(none).toHaveLength(0)
  })

  it('rechaza tonalidades, patrones y huecos inválidos', () => {
    expect(() => generate({ tonic: 'H' })).toThrow()
    expect(() => generate({ patternId: 'no-existe' })).toThrow()
    expect(() => generate({ patternId: 'minor-andalusian' })).toThrow()
    expect(() => generate({ missingIndex: -1 })).toThrow()
    expect(() => generate({ missingIndex: 4 })).toThrow()
    expect(() => generate({ missingIndex: 1.5 })).toThrow()
  })
})
