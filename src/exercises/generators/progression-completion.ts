import { ExerciseSchema, type Exercise } from '../../schemas/content'
import type { Key } from '../../schemas/notation'
import {
  chordSymbol,
  diatonicChords,
  functionsForMode,
  parseRomanNumeral,
  romanToChord,
  type DiatonicMode,
  type HarmonicFunction,
} from '../../theory'
import { formatPitchEs, parsePitch } from '../../theory/pitch'

/**
 * Generador de ejercicios de completar progresiones.
 *
 * Cada ejercicio muestra una progresión conocida con un hueco (`?`) y pide el
 * grado que falta. El hueco siempre es lógico: la respuesta se deduce del
 * patrón completo, y las opciones son numerales diatónicos válidos de la misma
 * tonalidad, no cadenas al azar. El generador evita distractores que también
 * completarían otro patrón conocido con el mismo contexto, de modo que la
 * respuesta sea única incluso entre las progresiones del catálogo.
 */

export const PROGRESSION_COMPLETION_DIFFICULTIES = [1, 2, 3] as const
export type ProgressionCompletionDifficulty =
  (typeof PROGRESSION_COMPLETION_DIFFICULTIES)[number]

/** Las doce tonalidades mayores que usa el resto del curso. */
export const PROGRESSION_COMPLETION_TONICS = [
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

export interface ProgressionPattern {
  id: string
  degrees: readonly string[]
  descriptionEs: string
  descriptionEn: string
}

export const MAJOR_PROGRESSION_PATTERNS: readonly ProgressionPattern[] = [
  {
    id: 'pop',
    degrees: ['I', 'V', 'vi', 'IV'],
    descriptionEs: 'la rueda pop I-V-vi-IV',
    descriptionEn: 'the I-V-vi-IV pop wheel',
  },
  {
    id: 'pop-rotated',
    degrees: ['vi', 'IV', 'I', 'V'],
    descriptionEs: 'la rueda pop girada, vi-IV-I-V',
    descriptionEn: 'the rotated pop wheel, vi-IV-I-V',
  },
  {
    id: 'fifties',
    degrees: ['I', 'vi', 'IV', 'V'],
    descriptionEs: 'la progresión de los años cincuenta, I-vi-IV-V',
    descriptionEn: 'the fifties progression, I-vi-IV-V',
  },
  {
    id: 'jazz',
    degrees: ['ii', 'V', 'I'],
    descriptionEs: 'la cadencia del jazz ii-V-I',
    descriptionEn: 'the ii-V-I jazz cadence',
  },
  {
    id: 'classical',
    degrees: ['I', 'IV', 'V', 'I'],
    descriptionEs: 'la cadencia clásica I-IV-V-I',
    descriptionEn: 'the classical I-IV-V-I cadence',
  },
  {
    id: 'turnaround',
    degrees: ['I', 'vi', 'ii', 'V'],
    descriptionEs: 'el giro I-vi-ii-V',
    descriptionEn: 'the I-vi-ii-V turnaround',
  },
  {
    id: 'pachelbel',
    degrees: ['I', 'V', 'vi', 'iii', 'IV', 'I', 'IV', 'V'],
    descriptionEs: 'el canon de Pachelbel',
    descriptionEn: 'Pachelbel’s canon',
  },
]

/**
 * Progresiones en menor natural. Los numerales respetan las cualidades de la
 * escala (i, iv y v menores; III, VI y VII mayores).
 */
export const MINOR_PROGRESSION_PATTERNS: readonly ProgressionPattern[] = [
  {
    id: 'minor-andalusian',
    degrees: ['i', 'VI', 'III', 'VII'],
    descriptionEs: 'la cadencia andaluza i-VI-III-VII',
    descriptionEn: 'the Andalusian cadence i-VI-III-VII',
  },
  {
    id: 'minor-classical',
    degrees: ['i', 'iv', 'v', 'i'],
    descriptionEs: 'la cadencia menor i-iv-v-i',
    descriptionEn: 'the minor i-iv-v-i cadence',
  },
  {
    id: 'minor-pop',
    degrees: ['i', 'VI', 'iv', 'v'],
    descriptionEs: 'la rueda menor i-VI-iv-v',
    descriptionEn: 'the minor i-VI-iv-v wheel',
  },
  {
    id: 'minor-turnaround',
    degrees: ['i', 'III', 'VI', 'VII'],
    descriptionEs: 'el giro menor i-III-VI-VII',
    descriptionEn: 'the minor i-III-VI-VII turnaround',
  },
]

const CHOICE_COUNTS: Record<ProgressionCompletionDifficulty, number> = {
  1: 3,
  2: 4,
  3: 5,
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

export function patternsForMode(
  mode: 'major' | 'minor',
): readonly ProgressionPattern[] {
  return mode === 'minor' ? MINOR_PROGRESSION_PATTERNS : MAJOR_PROGRESSION_PATTERNS
}

export function progressionPatternById(
  id: string,
  mode: 'major' | 'minor',
): ProgressionPattern | undefined {
  return patternsForMode(mode).find((pattern) => pattern.id === id)
}

function diatonicModeFor(mode: 'major' | 'minor'): DiatonicMode {
  return mode === 'minor' ? 'natural-minor' : 'major'
}

function assertKnownTonic(tonic: Key): void {
  if (!(PROGRESSION_COMPLETION_TONICS as readonly Key[]).includes(tonic)) {
    throw new Error(
      `La tonalidad "${tonic}" no pertenece a las 12 tonalidades del generador`,
    )
  }
}

function keyNameEs(tonic: Key): string {
  return formatPitchEs(parsePitch(`${tonic}4`))
}

function keyLabelEs(tonic: Key, mode: 'major' | 'minor'): string {
  return `${keyNameEs(tonic)} ${mode === 'minor' ? 'menor' : 'mayor'}`
}

function keyLabelEn(tonic: Key, mode: 'major' | 'minor'): string {
  return `${tonic} ${mode}`
}

function shuffle<T>(items: T[]): T[] {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1))
    ;[items[index], items[swap]] = [items[swap], items[index]]
  }
  return items
}

function diatonicNumerals(tonic: Key, mode: 'major' | 'minor'): string[] {
  return diatonicChords(tonic, diatonicModeFor(mode)).map((chord) => chord.roman)
}

function progressionSymbols(
  tonic: Key,
  mode: 'major' | 'minor',
  degrees: readonly string[],
  notation: 'do' | 'c',
): string {
  const diatonicMode = diatonicModeFor(mode)
  return degrees
    .map((degree) => {
      const chord = romanToChord(tonic, diatonicMode, degree)
      return chordSymbol(chord.root, chord.quality, { notation })
    })
    .join('-')
}

/**
 * Indica si un grado alternativo también completaría otro patrón del catálogo
 * con el mismo contexto. Se usa para descartar distractores ambiguos.
 */
function completesAnotherPattern(
  degrees: readonly string[],
  missingIndex: number,
  candidate: string,
  mode: 'major' | 'minor',
  ownPatternId: string,
): boolean {
  return patternsForMode(mode).some(
    (pattern) =>
      pattern.id !== ownPatternId &&
      pattern.degrees.length === degrees.length &&
      pattern.degrees.every((degree, index) =>
        index === missingIndex
          ? degree === candidate
          : degree === degrees[index],
      ),
  )
}

function chooseDistractors(
  tonic: Key,
  mode: 'major' | 'minor',
  degrees: readonly string[],
  missingIndex: number,
  patternId: string,
  answer: string,
  wanted: number,
): string[] {
  const candidates = [...new Set(diatonicNumerals(tonic, mode))].filter(
    (numeral) =>
      numeral !== answer &&
      !completesAnotherPattern(
        degrees,
        missingIndex,
        numeral,
        mode,
        patternId,
      ),
  )
  if (candidates.length < wanted) {
    throw new Error(
      `No hay suficientes distractores únicos para ${tonic} ${mode} (${patternId})`,
    )
  }
  return shuffle(candidates).slice(0, wanted)
}

function degreeFunction(
  answer: string,
  mode: 'major' | 'minor',
): HarmonicFunction {
  const degree = parseRomanNumeral(answer).degree
  return functionsForMode(diatonicModeFor(mode))[degree - 1]
}

export interface ProgressionCompletionExerciseParams {
  id: string
  skillId: string
  tonic: Key
  mode?: 'major' | 'minor'
  /** Patrón del catálogo; por defecto, el primero del modo. */
  patternId?: string
  /** Posición del hueco; por defecto, el centro del patrón. */
  missingIndex?: number
  difficulty?: ProgressionCompletionDifficulty
}

/**
 * Genera un ejercicio de completar progresiones a partir de un patrón
 * diatónico. La respuesta canónica es el grado que ocupa el hueco y se valida
 * con el esquema antes de devolver el ejercicio.
 */
export function generateProgressionCompletionExercise(
  params: ProgressionCompletionExerciseParams,
): Exercise {
  assertKnownTonic(params.tonic)
  const mode = params.mode ?? 'major'
  const pattern = params.patternId
    ? progressionPatternById(params.patternId, mode)
    : patternsForMode(mode)[0]
  if (!pattern) {
    throw new Error(
      `El patrón "${params.patternId}" no existe en el modo ${mode}`,
    )
  }

  const missingIndex = params.missingIndex ?? Math.floor(pattern.degrees.length / 2)
  if (
    !Number.isInteger(missingIndex) ||
    missingIndex < 0 ||
    missingIndex >= pattern.degrees.length
  ) {
    throw new Error(
      `Índice faltante inválido: ${missingIndex} para un patrón de ${pattern.degrees.length} grados`,
    )
  }

  const allowed = new Set(diatonicNumerals(params.tonic, mode))
  for (const degree of pattern.degrees) {
    if (!allowed.has(degree)) {
      throw new Error(
        `El grado "${degree}" no es diatónico en ${keyLabelEs(params.tonic, mode)}`,
      )
    }
  }

  const difficulty = params.difficulty ?? 2
  const wanted = CHOICE_COUNTS[difficulty] - 1
  const answer = pattern.degrees[missingIndex]
  const display = pattern.degrees
    .map((degree, index) => (index === missingIndex ? '?' : degree))
    .join('-')
  const symbolsEs = progressionSymbols(
    params.tonic,
    mode,
    pattern.degrees,
    'do',
  )
  const symbolsEn = progressionSymbols(
    params.tonic,
    mode,
    pattern.degrees,
    'c',
  )
  const missingFunction = degreeFunction(answer, mode)
  const distractors = chooseDistractors(
    params.tonic,
    mode,
    pattern.degrees,
    missingIndex,
    pattern.id,
    answer,
    wanted,
  )
  const choices = shuffle([answer, ...distractors])

  if (choices.filter((choice) => choice === answer).length !== 1) {
    throw new Error('La respuesta del hueco no es única entre las opciones')
  }

  const exercise = {
    id: params.id,
    skillId: params.skillId,
    type: 'progression-completion' as const,
    promptEs: `En ${keyLabelEs(params.tonic, mode)}, ¿qué grado completa ${pattern.descriptionEs} (${display})?`,
    promptEn: `In ${keyLabelEn(params.tonic, mode)}, which degree completes ${pattern.descriptionEn} (${display})?`,
    explanationEs: `La progresión completa es ${pattern.degrees.join('-')} y en ${keyLabelEs(params.tonic, mode)} suena ${symbolsEs}. El grado que falta es ${answer}, ${FUNCTION_ES[missingFunction]} de la tonalidad.`,
    explanationEn: `The complete progression is ${pattern.degrees.join('-')} and in ${keyLabelEn(params.tonic, mode)} it sounds ${symbolsEn}. The missing degree is ${answer}, the ${FUNCTION_EN[missingFunction]} of the key.`,
    difficulty,
    key: params.tonic,
    mode,
    degrees: [...pattern.degrees],
    missingIndex,
    choices,
    choicesEn: [...choices],
  }
  return parseExercise(exercise)
}

function parseExercise(exercise: unknown): Exercise {
  const result = ExerciseSchema.safeParse(exercise)
  if (!result.success) {
    throw new Error(
      `El ejercicio generado no es válido: ${result.error.message}`,
    )
  }
  return result.data
}

export interface ProgressionCompletionBatch {
  idPrefix: string
  skillId: string
  tonics?: readonly Key[]
  modes?: readonly ('major' | 'minor')[]
  patternIds?: readonly string[]
  missingIndexes?: readonly number[]
  difficulty?: ProgressionCompletionDifficulty
  /** Si se omite, genera todas las combinaciones. */
  count?: number
}

/**
 * Genera la matriz de ejercicios. Por defecto recorre las doce tonalidades
 * mayores, todos los patrones mayores y todas las posiciones del hueco.
 */
export function generateProgressionCompletionExercises(
  batch: ProgressionCompletionBatch,
): Exercise[] {
  const tonics = batch.tonics ?? PROGRESSION_COMPLETION_TONICS
  const modes = batch.modes ?? (['major'] as const)
  const combinations: Array<{
    tonic: Key
    mode: 'major' | 'minor'
    patternId: string
    missingIndex: number
  }> = []

  for (const tonic of tonics) {
    for (const mode of modes) {
      for (const pattern of patternsForMode(mode)) {
        if (batch.patternIds && !batch.patternIds.includes(pattern.id)) continue
        const indexes =
          batch.missingIndexes ?? pattern.degrees.map((_, index) => index)
        for (const missingIndex of indexes) {
          combinations.push({ tonic, mode, patternId: pattern.id, missingIndex })
        }
      }
    }
  }
  if (combinations.length === 0) return []

  const count = batch.count ?? combinations.length
  const exercises: Exercise[] = []
  for (let index = 0; index < count; index += 1) {
    const combination = combinations[index % combinations.length]
    exercises.push(
      generateProgressionCompletionExercise({
        id: `${batch.idPrefix}-${String(index + 1).padStart(3, '0')}`,
        skillId: batch.skillId,
        tonic: combination.tonic,
        mode: combination.mode,
        patternId: combination.patternId,
        missingIndex: combination.missingIndex,
        difficulty: batch.difficulty,
      }),
    )
  }
  return exercises
}
