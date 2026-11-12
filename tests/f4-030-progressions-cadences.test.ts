import { describe, expect, it } from 'vitest'
import { beatDuration, timelineDuration } from '../src/audio/notes'
import { resolveExerciseAnswer } from '../src/exercises/answer'
import {
  CADENCE_TONICS,
  CADENCE_TYPES,
  generateCadenceExercise,
} from '../src/exercises/generators/cadence'
import {
  PROGRESSION_COMPLETION_TONICS,
  generateProgressionCompletionExercise,
  patternsForMode,
} from '../src/exercises/generators/progression-completion'
import {
  buildProgressionCompletionAudio,
} from '../src/exercises/progression-completion'
import { PROGRESSION_CHORD_BEATS } from '../src/exercises/progression-dictation'
import {
  cadenceName,
  cadenceTypeFor,
  chordSymbol,
  diatonicChords,
  formatPitchEs,
  functionsForMode,
  midiOf,
  parsePitch,
  parseRomanNumeral,
  romanToChord,
  type CadenceType,
  type DiatonicMode,
  type HarmonicFunction,
  type Pitch,
} from '../src/theory'
import type { Exercise } from '../src/schemas'

/**
 * F4-030 — Progresiones y cadencias.
 *
 * Recorre toda la matriz que generan los dos ejercicios armónicos del curso:
 * las doce tonalidades, los modos mayor y menor, todos los patrones del
 * catálogo, todas las posiciones del hueco y las tres dificultades. Comprueba
 * que la respuesta canónica sea única entre las opciones, que ningún distractor
 * complete otro patrón del catálogo con el mismo contexto, que las opciones
 * sean numerales diatónicos de la tonalidad, que la resolución de respuestas
 * (ES/EN) coincida con el hueco y que el audio use los acordes que declara el
 * ejercicio.
 *
 * La cadencia rota conserva la etiqueta común «Rota (V-vi)» en los dos modos,
 * aunque en menor los grados reales sean V-VI. El ejercicio muestra siempre los
 * grados correctos y la respuesta se resuelve por el tipo de cadencia, no por
 * la etiqueta; la limitación se documenta al final del archivo.
 */

type ProgressionExercise = Extract<
  Exercise,
  { type: 'progression-completion' }
>

const MODES = ['major', 'minor'] as const
type Mode = (typeof MODES)[number]

const DIFFICULTIES = [1, 2, 3] as const

/** Grados con los que el generador arma cada cadencia. */
const CADENCE_DEGREES: Record<
  Mode,
  Record<
    CadenceType,
    { from: number; to: number; missing: 'from' | 'to' }
  >
> = {
  major: {
    authentic: { from: 5, to: 1, missing: 'from' },
    plagal: { from: 4, to: 1, missing: 'from' },
    half: { from: 2, to: 5, missing: 'to' },
    deceptive: { from: 5, to: 6, missing: 'to' },
  },
  minor: {
    authentic: { from: 5, to: 1, missing: 'from' },
    plagal: { from: 4, to: 1, missing: 'from' },
    half: { from: 1, to: 5, missing: 'to' },
    deceptive: { from: 5, to: 6, missing: 'to' },
  },
}

const FUNCTION_ES: Record<HarmonicFunction, string> = {
  tonic: 'tónica',
  subdominant: 'subdominante',
  dominant: 'dominante',
}

const FUNCTION_EN: Record<HarmonicFunction, string> = {
  tonic: 'tonic',
  subdominant: 'subdominant',
  dominant: 'dominant',
}

function progressionDiatonicMode(mode: Mode): DiatonicMode {
  return mode === 'minor' ? 'natural-minor' : 'major'
}

function cadenceDiatonicMode(mode: Mode): DiatonicMode {
  return mode === 'minor' ? 'harmonic-minor' : 'major'
}

function keyLabelEs(tonic: string, mode: Mode): string {
  return `${formatPitchEs(parsePitch(`${tonic}4`))} ${
    mode === 'minor' ? 'menor' : 'mayor'
  }`
}

function pitchNameEn(pitch: Pitch): string {
  const accidental =
    pitch.accidental === 1
      ? '♯'
      : pitch.accidental === -1
        ? '♭'
        : pitch.accidental === 2
          ? '𝄪'
          : pitch.accidental === -2
            ? '𝄫'
            : ''
  return `${pitch.step}${accidental}`
}

function display(degrees: readonly string[], missingIndex: number): string {
  return degrees
    .map((degree, index) => (index === missingIndex ? '?' : degree))
    .join('-')
}

/**
 * Grados del catálogo que completarían el mismo contexto. Sirve para demostrar
 * que un distractor no convierte la progresión en otro patrón conocido.
 */
function catalogCompletions(
  degrees: readonly string[],
  missingIndex: number,
  mode: Mode,
): string[] {
  return patternsForMode(mode)
    .filter((pattern) => pattern.degrees.length === degrees.length)
    .filter((pattern) =>
      pattern.degrees.every(
        (degree, index) =>
          index === missingIndex || degree === degrees[index],
      ),
    )
    .map((pattern) => pattern.degrees[missingIndex]!)
}

function progressionSymbols(
  tonic: string,
  mode: Mode,
  degrees: readonly string[],
  notation: 'do' | 'c',
): string {
  return degrees
    .map((degree) => {
      const chord = romanToChord(tonic, progressionDiatonicMode(mode), degree)
      return chordSymbol(chord.root, chord.quality, { notation })
    })
    .join('-')
}

function cadenceChordText(
  tonic: string,
  mode: Mode,
  fromDegree: number,
  toDegree: number,
  locale: 'es' | 'en',
): string {
  const chords = diatonicChords(tonic, cadenceDiatonicMode(mode))
  const describe = (degree: number) => {
    const chord = chords[degree - 1]!
    return {
      symbolEs: chordSymbol(chord.root, chord.quality, { notation: 'do' }),
      symbolEn: chordSymbol(chord.root, chord.quality, { notation: 'c' }),
      notesEs: chord.pitches.map((pitch) => formatPitchEs(pitch)).join(', '),
      notesEn: chord.pitches.map(pitchNameEn).join(', '),
    }
  }
  const from = describe(fromDegree)
  const to = describe(toDegree)
  return locale === 'es'
    ? `${from.symbolEs} (${from.notesEs}) y ${to.symbolEs} (${to.notesEs})`
    : `${from.symbolEn} (${from.notesEn}) and ${to.symbolEn} (${to.notesEn})`
}

function generateProgression(
  overrides: Partial<
    Parameters<typeof generateProgressionCompletionExercise>[0]
  > = {},
): ProgressionExercise {
  const exercise = generateProgressionCompletionExercise({
    id: 'f4-030.progression',
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

function generateCadence(
  overrides: Partial<Parameters<typeof generateCadenceExercise>[0]> = {},
): Exercise {
  return generateCadenceExercise({
    id: 'f4-030.cadence',
    skillId: 'skill.cadence',
    tonic: 'C',
    type: 'authentic',
    direction: 'identify',
    ...overrides,
  })
}

describe('F4-030 — Progresiones y cadencias', () => {
  it('cubre las doce clases de altura en los dos modos', () => {
    expect(new Set(PROGRESSION_COMPLETION_TONICS).size).toBe(12)
    expect(new Set(CADENCE_TONICS).size).toBe(12)
    expect([...PROGRESSION_COMPLETION_TONICS]).toEqual([...CADENCE_TONICS])
    expect(
      new Set(
        CADENCE_TONICS.map(
          (tonic) => midiOf(parsePitch(`${tonic}4`)) % 12,
        ),
      ).size,
    ).toBe(12)
  })

  it('resuelve las progresiones con respuesta única y sin distractores ambiguos', () => {
    let count = 0
    for (const mode of MODES) {
      for (const tonic of PROGRESSION_COMPLETION_TONICS) {
        const numerals = diatonicChords(tonic, progressionDiatonicMode(mode))
        const allowed = new Set(numerals.map((chord) => chord.roman))

        for (const pattern of patternsForMode(mode)) {
          for (
            let missingIndex = 0;
            missingIndex < pattern.degrees.length;
            missingIndex += 1
          ) {
            for (const difficulty of DIFFICULTIES) {
              count += 1
              const label = `${tonic} ${mode} ${pattern.id} #${missingIndex} d${difficulty}`
              const exercise = generateProgression({
                tonic,
                mode,
                patternId: pattern.id,
                missingIndex,
                difficulty,
              })
              const answer = pattern.degrees[missingIndex]!
              const shown = display(exercise.degrees, missingIndex)

              expect(exercise.key, label).toBe(tonic)
              expect(exercise.mode, label).toBe(mode)
              expect(exercise.degrees, label).toEqual([...pattern.degrees])
              expect(exercise.missingIndex, label).toBe(missingIndex)
              expect(shown.split('?'), label).toHaveLength(2)

              expect(exercise.promptEs, label).toContain(
                pattern.descriptionEs,
              )
              expect(exercise.promptEs, label).toContain(shown)
              expect(exercise.promptEn, label).toContain(
                pattern.descriptionEn,
              )
              expect(exercise.promptEn, label).toContain(shown)

              // La explicación nombra la progresión completa, el grado que
              // falta, su función y los acordes reales de la tonalidad.
              expect(exercise.explanationEs, label).toContain(
                pattern.degrees.join('-'),
              )
              expect(exercise.explanationEs, label).toContain(answer)
              expect(exercise.explanationEn, label).toContain(
                pattern.degrees.join('-'),
              )
              expect(exercise.explanationEn, label).toContain(answer)

              const harmonicFunction =
                functionsForMode(progressionDiatonicMode(mode))[
                  parseRomanNumeral(answer).degree - 1
                ]!
              expect(exercise.explanationEs, label).toContain(
                FUNCTION_ES[harmonicFunction],
              )
              expect(exercise.explanationEn, label).toContain(
                FUNCTION_EN[harmonicFunction],
              )
              expect(exercise.explanationEs, label).toContain(
                progressionSymbols(tonic, mode, pattern.degrees, 'do'),
              )
              expect(exercise.explanationEn, label).toContain(
                progressionSymbols(tonic, mode, pattern.degrees, 'c'),
              )

              const choices = exercise.choices ?? []
              expect(choices, label).toHaveLength(difficulty + 2)
              expect(new Set(choices).size, label).toBe(choices.length)
              expect(
                choices.filter((choice) => choice === answer),
                label,
              ).toHaveLength(1)
              expect(exercise.choicesEn, label).toEqual([...choices])
              expect(
                (exercise.choicesEn ?? []).indexOf(answer),
                label,
              ).toBe(choices.indexOf(answer))

              const completions = catalogCompletions(
                exercise.degrees,
                missingIndex,
                mode,
              )
              for (const choice of choices) {
                expect(
                  () => parseRomanNumeral(choice),
                  `${label}: ${choice}`,
                ).not.toThrow()
                expect(
                  allowed.has(choice),
                  `${label}: ${choice} no es diatónico`,
                ).toBe(true)
                if (choice !== answer) {
                  expect(
                    completions,
                    `${label}: ${choice} también completa otro patrón`,
                  ).not.toContain(choice)
                }
              }

              const resolvedEs = resolveExerciseAnswer(exercise, 'es')
              const resolvedEn = resolveExerciseAnswer(exercise, 'en')
              expect(resolvedEs.mode, label).toBe('choice')
              expect(resolvedEn.mode, label).toBe('choice')
              if (
                resolvedEs.mode !== 'choice' ||
                resolvedEn.mode !== 'choice'
              ) {
                continue
              }
              expect(resolvedEs.answer, label).toBe(answer)
              expect(resolvedEn.answer, label).toBe(answer)
              expect(choices, label).toContain(resolvedEs.answer)
              expect(choices, label).toContain(resolvedEn.answer)
            }
          }
        }
      }
    }

    const patternLengths = MODES.reduce(
      (total, mode) =>
        total +
        patternsForMode(mode).reduce(
          (sum, pattern) => sum + pattern.degrees.length,
          0,
        ),
      0,
    )
    expect(count).toBe(
      PROGRESSION_COMPLETION_TONICS.length *
        patternLengths *
        DIFFICULTIES.length,
    )
  })

  it('identifica las cadencias con cuatro opciones únicas y bilingües', () => {
    let count = 0
    for (const mode of MODES) {
      for (const tonic of CADENCE_TONICS) {
        for (const type of CADENCE_TYPES) {
          for (const difficulty of DIFFICULTIES) {
            count += 1
            const label = `${tonic} ${mode} ${type} d${difficulty}`
            const expected = CADENCE_DEGREES[mode][type]
            const exercise = generateCadence({
              tonic,
              mode,
              type,
              direction: 'identify',
              difficulty,
            })
            if (exercise.type !== 'cadence') {
              throw new Error(`${label}: se esperaba una cadencia`)
            }

            expect(exercise.key, label).toBe(tonic)
            expect(exercise.mode, label).toBe(mode)
            expect(exercise.fromDegree, label).toBe(expected.from)
            expect(exercise.toDegree, label).toBe(expected.to)
            expect(
              cadenceTypeFor(exercise.fromDegree, exercise.toDegree),
              label,
            ).toBe(type)

            const choices = exercise.choices ?? []
            const choicesEn = exercise.choicesEn ?? []
            expect(choices, label).toHaveLength(CADENCE_TYPES.length)
            expect(choicesEn, label).toHaveLength(CADENCE_TYPES.length)
            expect(new Set(choices).size, label).toBe(CADENCE_TYPES.length)
            expect(new Set(choicesEn).size, label).toBe(
              CADENCE_TYPES.length,
            )
            expect(new Set(choices), label).toEqual(
              new Set(CADENCE_TYPES.map((item) => cadenceName(item, 'es'))),
            )
            expect(new Set(choicesEn), label).toEqual(
              new Set(CADENCE_TYPES.map((item) => cadenceName(item, 'en'))),
            )

            const answerEs = cadenceName(type, 'es')
            const answerEn = cadenceName(type, 'en')
            const resolvedEs = resolveExerciseAnswer(exercise, 'es')
            const resolvedEn = resolveExerciseAnswer(exercise, 'en')
            expect(resolvedEs.mode, label).toBe('choice')
            expect(resolvedEn.mode, label).toBe('choice')
            if (
              resolvedEs.mode !== 'choice' ||
              resolvedEn.mode !== 'choice'
            ) {
              continue
            }
            expect(resolvedEs.answer, label).toBe(answerEs)
            expect(resolvedEn.answer, label).toBe(answerEn)
            expect(choices, label).toContain(resolvedEs.answer)
            expect(choicesEn, label).toContain(resolvedEn.answer)
            expect(
              choices.indexOf(resolvedEs.answer),
              label,
            ).toBe(choicesEn.indexOf(resolvedEn.answer))

            // La pregunta muestra la tonalidad y los dos acordes con sus
            // notas; la explicación repite el nombre de la cadencia.
            expect(exercise.promptEs, label).toContain(
              keyLabelEs(tonic, mode),
            )
            expect(exercise.promptEn, label).toContain(`${tonic} ${mode}`)
            expect(exercise.promptEs, label).toContain(
              cadenceChordText(tonic, mode, expected.from, expected.to, 'es'),
            )
            expect(exercise.promptEn, label).toContain(
              cadenceChordText(tonic, mode, expected.from, expected.to, 'en'),
            )
            expect(exercise.explanationEs, label).toContain(answerEs)
            expect(exercise.explanationEn, label).toContain(answerEn)
          }
        }
      }
    }

    expect(count).toBe(
      CADENCE_TONICS.length *
        MODES.length *
        CADENCE_TYPES.length *
        DIFFICULTIES.length,
    )
  })

  it('completa las cadencias con respuesta única y sin opciones ambiguas', () => {
    let count = 0
    for (const mode of MODES) {
      for (const tonic of CADENCE_TONICS) {
        const chords = diatonicChords(tonic, cadenceDiatonicMode(mode))
        const allowed = new Set(chords.map((chord) => chord.roman))

        for (const type of CADENCE_TYPES) {
          for (const difficulty of DIFFICULTIES) {
            count += 1
            const label = `${tonic} ${mode} ${type} d${difficulty}`
            const expected = CADENCE_DEGREES[mode][type]
            const exercise = generateCadence({
              tonic,
              mode,
              type,
              direction: 'complete',
              difficulty,
            })
            if (exercise.type !== 'progression-completion') {
              throw new Error(
                `${label}: se esperaba completar una progresión`,
              )
            }

            const fromNumeral = chords[expected.from - 1]!.roman
            const toNumeral = chords[expected.to - 1]!.roman
            const missingIndex = expected.missing === 'from' ? 0 : 1
            const answer =
              missingIndex === 0 ? fromNumeral : toNumeral
            const shown = display(exercise.degrees, exercise.missingIndex)

            expect(exercise.key, label).toBe(tonic)
            expect(exercise.mode, label).toBe(mode)
            expect(exercise.degrees, label).toEqual([
              fromNumeral,
              toNumeral,
            ])
            expect(exercise.missingIndex, label).toBe(missingIndex)
            expect(exercise.degrees[missingIndex], label).toBe(answer)
            expect(shown.split('?'), label).toHaveLength(2)

            expect(exercise.promptEs, label).toContain(
              cadenceName(type, 'es'),
            )
            expect(exercise.promptEs, label).toContain(shown)
            expect(exercise.promptEn, label).toContain(
              cadenceName(type, 'en'),
            )
            expect(exercise.promptEn, label).toContain(shown)
            expect(exercise.explanationEs, label).toContain(
              `${fromNumeral}-${toNumeral}`,
            )
            expect(exercise.explanationEs, label).toContain(answer)
            expect(exercise.explanationEn, label).toContain(
              `${fromNumeral}-${toNumeral}`,
            )
            expect(exercise.explanationEn, label).toContain(answer)

            const choices = exercise.choices ?? []
            expect(choices, label).toHaveLength(difficulty + 2)
            expect(new Set(choices).size, label).toBe(choices.length)
            expect(
              choices.filter((choice) => choice === answer),
              label,
            ).toHaveLength(1)

            // Ningún otro numeral completa la misma cadencia con el grado
            // que queda a la vista.
            const fixedIndex = 1 - missingIndex
            const fixedDegree = parseRomanNumeral(
              exercise.degrees[fixedIndex]!,
            ).degree
            for (const choice of choices) {
              expect(
                () => parseRomanNumeral(choice),
                `${label}: ${choice}`,
              ).not.toThrow()
              expect(
                allowed.has(choice),
                `${label}: ${choice} no es diatónico`,
              ).toBe(true)
              if (choice === answer) continue
              const candidate = parseRomanNumeral(choice).degree
              const pair: [number, number] =
                missingIndex === 0
                  ? [candidate, fixedDegree]
                  : [fixedDegree, candidate]
              let formed: CadenceType | null = null
              try {
                formed = cadenceTypeFor(pair[0], pair[1])
              } catch {
                formed = null
              }
              expect(
                formed,
                `${label}: ${choice} también forma la cadencia ${type}`,
              ).not.toBe(type)
            }

            const resolvedEs = resolveExerciseAnswer(exercise, 'es')
            const resolvedEn = resolveExerciseAnswer(exercise, 'en')
            expect(resolvedEs.mode, label).toBe('choice')
            expect(resolvedEn.mode, label).toBe('choice')
            if (
              resolvedEs.mode !== 'choice' ||
              resolvedEn.mode !== 'choice'
            ) {
              continue
            }
            expect(resolvedEs.answer, label).toBe(answer)
            expect(resolvedEn.answer, label).toBe(answer)
            expect(choices, label).toContain(resolvedEs.answer)
            expect(choices, label).toContain(resolvedEn.answer)

            // El audio reproduce los dos acordes reales y silencia el hueco.
            const audio = buildProgressionCompletionAudio(exercise, {
              tempo: 60,
            })
            const chordSeconds =
              PROGRESSION_CHORD_BEATS * beatDuration(60)
            const expectedMidis = exercise.degrees.map((degree) =>
              romanToChord(
                tonic,
                progressionDiatonicMode(mode),
                degree,
              ).pitches.map((pitch) => midiOf(pitch)),
            )
            const harmonicMidis = exercise.degrees.map((degree) =>
              romanToChord(
                tonic,
                cadenceDiatonicMode(mode),
                degree,
              ).pitches.map((pitch) => midiOf(pitch)),
            )
            expect(audio.chords.map((chord) => chord.numeral), label).toEqual(
              exercise.degrees,
            )
            expect(audio.chords.map((chord) => chord.midis), label).toEqual(
              expectedMidis,
            )
            expect(harmonicMidis, label).toEqual(expectedMidis)
            expect(audio.missingIndex, label).toBe(missingIndex)
            expect(audio.timeline, label).toHaveLength(2)
            expect(audio.contextTimeline, label).toHaveLength(1)
            expect(audio.missingTimeline, label).toHaveLength(1)
            expect(
              audio.contextTimeline.map((event) => event.time),
              label,
            ).toEqual(
              [0, chordSeconds].filter(
                (_, index) => index !== missingIndex,
              ),
            )
            expect(
              audio.missingTimeline[0]!.midis,
              label,
            ).toEqual(expectedMidis[missingIndex])
            expect(timelineDuration(audio.timeline), label).toBe(
              chordSeconds * 2,
            )
          }
        }
      }
    }

    expect(count).toBe(
      CADENCE_TONICS.length *
        MODES.length *
        CADENCE_TYPES.length *
        DIFFICULTIES.length,
    )
  })

  it('genera el audio de todos los patrones con el hueco en silencio', () => {
    let count = 0
    for (const mode of MODES) {
      for (const tonic of PROGRESSION_COMPLETION_TONICS) {
        for (const pattern of patternsForMode(mode)) {
          count += 1
          const missingIndex = Math.floor(pattern.degrees.length / 2)
          const label = `${tonic} ${mode} ${pattern.id}`
          const exercise = generateProgression({
            tonic,
            mode,
            patternId: pattern.id,
            missingIndex,
          })
          const audio = buildProgressionCompletionAudio(exercise, {
            tempo: 60,
          })
          const chordSeconds =
            PROGRESSION_CHORD_BEATS * beatDuration(60)
          const expectedMidis = pattern.degrees.map((degree) =>
            romanToChord(
              tonic,
              progressionDiatonicMode(mode),
              degree,
            ).pitches.map((pitch) => midiOf(pitch)),
          )

          expect(audio.key, label).toBe(tonic)
          expect(audio.mode, label).toBe(mode)
          expect(audio.diatonicMode, label).toBe(
            progressionDiatonicMode(mode),
          )
          expect(audio.degrees, label).toEqual([...pattern.degrees])
          expect(audio.missingIndex, label).toBe(missingIndex)
          expect(audio.chords.map((chord) => chord.numeral), label).toEqual(
            pattern.degrees,
          )
          expect(audio.chords.map((chord) => chord.midis), label).toEqual(
            expectedMidis,
          )
          expect(audio.timeline, label).toHaveLength(
            pattern.degrees.length,
          )
          expect(audio.contextTimeline, label).toHaveLength(
            pattern.degrees.length - 1,
          )
          expect(
            audio.contextTimeline.map((event) => event.time),
            label,
          ).toEqual(
            pattern.degrees
              .map((_, index) => index * chordSeconds)
              .filter((_, index) => index !== missingIndex),
          )
          expect(audio.missingTimeline, label).toHaveLength(1)
          expect(audio.missingTimeline[0]!.time, label).toBe(0)
          expect(audio.missingTimeline[0]!.midis, label).toEqual(
            expectedMidis[missingIndex],
          )
          expect(timelineDuration(audio.timeline), label).toBe(
            chordSeconds * pattern.degrees.length,
          )
        }
      }
    }

    expect(count).toBe(
      PROGRESSION_COMPLETION_TONICS.length *
        MODES.reduce(
          (total, mode) => total + patternsForMode(mode).length,
          0,
        ),
    )
  })

  it('documenta la etiqueta genérica de la cadencia rota en menor', () => {
    // La etiqueta es común a los dos modos y conserva la grafía mayor V-vi.
    // En menor los grados reales son V-VI: el ejercicio muestra esos grados y
    // la respuesta se resuelve por el tipo de cadencia, no por el paréntesis.
    expect(cadenceName('deceptive', 'es')).toBe('Rota (V-vi)')
    expect(cadenceName('deceptive', 'en')).toBe('Deceptive (V-vi)')

    const identify = generateCadence({
      tonic: 'C',
      mode: 'minor',
      type: 'deceptive',
      direction: 'identify',
    })
    if (identify.type !== 'cadence') {
      throw new Error('Se esperaba una cadencia')
    }
    expect(identify.fromDegree).toBe(5)
    expect(identify.toDegree).toBe(6)

    const complete = generateCadence({
      tonic: 'C',
      mode: 'minor',
      type: 'deceptive',
      direction: 'complete',
    })
    if (complete.type !== 'progression-completion') {
      throw new Error('Se esperaba completar una progresión')
    }
    expect(complete.degrees).toEqual(['V', 'VI'])
    expect(complete.degrees[complete.missingIndex]).toBe('VI')
    expect(complete.choices).toContain('VI')
    expect(complete.choices).not.toContain('vi')
  })
})
