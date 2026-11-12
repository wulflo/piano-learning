import { ExerciseSchema, type Exercise } from '../../schemas/content'
import type { Key } from '../../schemas/notation'
import {
  CHORD_DEFINITIONS,
  chordSymbol,
  diatonicChord,
  rootName,
  type ChordQuality,
  type DiatonicMode,
} from '../../theory'
import { formatPitchEs, toSpelledPitch, type Pitch } from '../../theory/pitch'

/**
 * Generador de ejercicios de números romanos en los dos sentidos.
 *
 * - `chord-to-numeral`: muestra un acorde de la tonalidad y pide su numeral.
 * - `numeral-to-chord`: muestra el numeral y pide el acorde que le corresponde.
 *
 * Las dos direcciones recorren las doce tonalidades. Los distractores salen de
 * los demás grados de la misma escala, de modo que la respuesta no se pueda
 * adivinar por el tamaño o la forma de las opciones.
 */

export const ROMAN_NUMERAL_DIRECTIONS = [
  'chord-to-numeral',
  'numeral-to-chord',
] as const
export type RomanNumeralDirection = (typeof ROMAN_NUMERAL_DIRECTIONS)[number]

export const ROMAN_NUMERAL_DIFFICULTIES = [1, 2, 3] as const
export type RomanNumeralDifficulty =
  (typeof ROMAN_NUMERAL_DIFFICULTIES)[number]

/** Las doce tonalidades mayores que usa M2, con armaduras de hasta cinco alteraciones. */
export const ROMAN_NUMERAL_TONICS = [
  'C',
  'G',
  'D',
  'A',
  'E',
  'B',
  'F#',
  'F',
  'Bb',
  'Eb',
  'Ab',
  'Db',
] as const satisfies readonly Key[]

const DISTRACTOR_COUNTS: Record<RomanNumeralDifficulty, number> = {
  1: 1,
  2: 2,
  3: 3,
}

function assertKnownTonic(tonic: Key): void {
  if (!(ROMAN_NUMERAL_TONICS as readonly Key[]).includes(tonic)) {
    throw new Error(
      `La tonalidad "${tonic}" no pertenece a las 12 tonalidades del generador`,
    )
  }
}

function assertDegree(degree: number): void {
  if (!Number.isInteger(degree) || degree < 1 || degree > 7) {
    throw new Error(`Grado inválido: ${degree}`)
  }
}

function shuffle<T>(items: T[]): T[] {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1))
    ;[items[index], items[swap]] = [items[swap], items[index]]
  }
  return items
}

function diatonicModeFor(
  mode: 'major' | 'minor',
  scale?: 'natural-minor' | 'harmonic-minor',
): DiatonicMode {
  if (mode === 'major') return 'major'
  return scale === 'natural-minor' ? 'natural-minor' : 'harmonic-minor'
}

function modeName(mode: DiatonicMode): string {
  if (mode === 'natural-minor') return 'menor natural'
  if (mode === 'harmonic-minor') return 'menor armónica'
  return 'mayor'
}

function keyLabel(tonic: Key, mode: DiatonicMode): string {
  return `${tonic} ${modeName(mode)}`
}

function keyLabelEn(tonic: Key, mode: 'major' | 'minor'): string {
  return `${tonic} ${mode}`
}

/** Notas del acorde en notación latina, separadas por guiones. */
function notesEs(pitches: readonly Pitch[]): string {
  return pitches.map((pitch) => formatPitchEs(pitch)).join('-')
}

function numeralChoices(
  tonic: Key,
  mode: DiatonicMode,
  answer: string,
  wanted: number,
): string[] {
  const numerals = [1, 2, 3, 4, 5, 6, 7].map(
    (degree) => diatonicChord(tonic, mode, degree).roman,
  )
  const unique = [...new Set(numerals)].filter((numeral) => numeral !== answer)
  if (unique.length < wanted) {
    throw new Error(`No hay suficientes numerales para distraer en ${tonic}`)
  }
  return shuffle(unique).slice(0, wanted)
}

function chordChoice(
  tonic: Key,
  mode: DiatonicMode,
  degree: number,
): { doSymbol: string; cSymbol: string } {
  const chord = diatonicChord(tonic, mode, degree)
  return {
    doSymbol: chordSymbol(chord.root, chord.quality, { notation: 'do' }),
    cSymbol: chordSymbol(chord.root, chord.quality, { notation: 'c' }),
  }
}

function chordChoices(
  tonic: Key,
  mode: DiatonicMode,
  answer: { doSymbol: string; cSymbol: string },
  wanted: number,
): Array<{ doSymbol: string; cSymbol: string }> {
  const others = [1, 2, 3, 4, 5, 6, 7]
    .map((degree) => chordChoice(tonic, mode, degree))
    .filter((choice) => choice.cSymbol !== answer.cSymbol)

  const unique: Array<{ doSymbol: string; cSymbol: string }> = []
  for (const choice of others) {
    if (!unique.some((item) => item.cSymbol === choice.cSymbol)) {
      unique.push(choice)
    }
  }
  if (unique.length < wanted) {
    throw new Error(`No hay suficientes acordes para distraer en ${tonic}`)
  }
  return shuffle(unique).slice(0, wanted)
}

export interface RomanNumeralExerciseParams {
  id: string
  skillId: string
  tonic: Key
  mode?: 'major' | 'minor'
  /** Escala menor concreta; por defecto, menor armónica. */
  scale?: 'natural-minor' | 'harmonic-minor'
  direction: RomanNumeralDirection
  degree: number
  difficulty?: RomanNumeralDifficulty
}

/**
 * Genera un ejercicio en el sentido pedido. La respuesta canónica se deduce
 * del grado y se valida con el esquema antes de devolverla.
 */
export function generateRomanNumeralExercise(
  params: RomanNumeralExerciseParams,
): Exercise {
  assertKnownTonic(params.tonic)
  assertDegree(params.degree)

  const mode = params.mode ?? 'major'
  const diatonicMode = diatonicModeFor(mode, params.scale)
  const difficulty = params.difficulty ?? 2
  const wanted = DISTRACTOR_COUNTS[difficulty]
  const chord = diatonicChord(params.tonic, diatonicMode, params.degree)

  if (params.direction === 'chord-to-numeral') {
    const answer = chord.roman
    const distractors = numeralChoices(
      params.tonic,
      diatonicMode,
      answer,
      wanted,
    )
    const exercise = {
      id: params.id,
      skillId: params.skillId,
      type: 'roman-numeral' as const,
      promptEs: `En ${keyLabel(params.tonic, diatonicMode)}, ¿qué numeral romano nombra el acorde ${rootName(chord.root, 'do')} ${CHORD_DEFINITIONS[chord.quality].nameEs} (${notesEs(chord.pitches)})?`,
      promptEn: `In ${keyLabelEn(params.tonic, mode)}, which Roman numeral names the ${rootName(chord.root)} ${CHORD_DEFINITIONS[chord.quality].nameEn} chord (${chord.pitches.map((pitch) => `${pitch.step}${pitch.accidental}`).join('-')})?`,
      explanationEs: `El acorde ${rootName(chord.root, 'do')} es el grado ${params.degree} de ${keyLabel(params.tonic, diatonicMode)}. Su tríada ${notesEs(chord.pitches)} es ${CHORD_DEFINITIONS[chord.quality].nameEs}, así que el numeral es ${answer}.`,
      explanationEn: `The ${rootName(chord.root)} chord is degree ${params.degree} of ${keyLabelEn(params.tonic, mode)}. Its triad is ${CHORD_DEFINITIONS[chord.quality].nameEn}, so the numeral is ${answer}.`,
      difficulty,
      key: params.tonic,
      mode,
      numeral: answer,
      choices: shuffle([answer, ...distractors]),
    }
    return parseExercise(exercise)
  }

  const answer = chordChoice(params.tonic, diatonicMode, params.degree)
  const distractors = chordChoices(
    params.tonic,
    diatonicMode,
    answer,
    wanted,
  )
  const options = shuffle([answer, ...distractors])
  const exercise = {
    id: params.id,
    skillId: params.skillId,
    type: 'chord' as const,
    promptEs: `En ${keyLabel(params.tonic, diatonicMode)}, ¿qué acorde forma el numeral ${chord.roman}?`,
    promptEn: `In ${keyLabelEn(params.tonic, mode)}, which chord does the numeral ${chord.roman} build?`,
    explanationEs: `El numeral ${chord.roman} corresponde al grado ${params.degree} de ${keyLabel(params.tonic, diatonicMode)}. Su fundamental es ${rootName(chord.root, 'do')} y la tríada ${notesEs(chord.pitches)} es ${CHORD_DEFINITIONS[chord.quality].nameEs}, así que el acorde es ${answer.doSymbol}.`,
    explanationEn: `The numeral ${chord.roman} is degree ${params.degree} of ${keyLabelEn(params.tonic, mode)}. Its root is ${rootName(chord.root)} and the triad is ${CHORD_DEFINITIONS[chord.quality].nameEn}, so the chord is ${answer.cSymbol}.`,
    difficulty,
    root: toSpelledPitch(chord.root),
    quality: chord.quality as ChordQuality,
    inversion: 0,
    ask: 'symbol' as const,
    choices: options.map((option) => option.doSymbol),
    choicesEn: options.map((option) => option.cSymbol),
  }
  return parseExercise(exercise)
}

function parseExercise(exercise: unknown): Exercise {
  const result = ExerciseSchema.safeParse(exercise)
  if (!result.success) {
    throw new Error(`El ejercicio generado no es válido: ${result.error.message}`)
  }
  return result.data
}

export interface RomanNumeralExerciseBatch {
  idPrefix: string
  skillId: string
  mode?: 'major' | 'minor'
  scale?: 'natural-minor' | 'harmonic-minor'
  tonics?: readonly Key[]
  directions?: readonly RomanNumeralDirection[]
  degrees?: readonly number[]
  difficulty?: RomanNumeralDifficulty
  /** Si se omite, genera todas las combinaciones. */
  count?: number
}

/**
 * Genera la matriz de ejercicios. Por defecto recorre las doce tonalidades en
 * los dos sentidos y en los siete grados.
 */
export function generateRomanNumeralExercises(
  batch: RomanNumeralExerciseBatch,
): Exercise[] {
  const mode = batch.mode ?? 'major'
  const tonics = batch.tonics ?? ROMAN_NUMERAL_TONICS
  const directions = batch.directions ?? ROMAN_NUMERAL_DIRECTIONS
  const degrees = batch.degrees ?? [1, 2, 3, 4, 5, 6, 7]
  const combinations: Array<{
    tonic: Key
    direction: RomanNumeralDirection
    degree: number
  }> = []

  for (const tonic of tonics) {
    for (const direction of directions) {
      for (const degree of degrees) {
        combinations.push({ tonic, direction, degree })
      }
    }
  }
  if (combinations.length === 0) return []

  const count = batch.count ?? combinations.length
  const exercises: Exercise[] = []
  for (let index = 0; index < count; index += 1) {
    const combination = combinations[index % combinations.length]
    exercises.push(
      generateRomanNumeralExercise({
        id: `${batch.idPrefix}-${String(index + 1).padStart(3, '0')}`,
        skillId: batch.skillId,
        tonic: combination.tonic,
        mode,
        scale: batch.scale,
        direction: combination.direction,
        degree: combination.degree,
        difficulty: batch.difficulty,
      }),
    )
  }
  return exercises
}
