import { ExerciseSchema } from '../../schemas/content'
import type { Key, SpelledPitch } from '../../schemas/notation'
import {
  formatPitch,
  fromSpelledPitch,
  midiOf,
  scalePitches,
  toSpelledPitch,
  transposeMelody,
  type Pitch,
} from '../../theory'

export const TRANSPOSITION_DIFFICULTIES = [1, 2, 3] as const
export type TranspositionDifficulty = (typeof TRANSPOSITION_DIFFICULTIES)[number]

/**
 * Las doce tonalidades mayores de M2. Son las mismas que usa el generador de
 * deletreo de escalas: todas tienen una armadura de hasta siete alteraciones.
 */
export const TRANSPOSITION_TONICS = [
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

/**
 * Melodías cortas por grado de la escala mayor. El grado 8 es la tónica de la
 * octava siguiente. La dificultad alarga la melodía y agrega movimiento.
 */
export const TRANSPOSITION_PATTERNS: Record<TranspositionDifficulty, readonly (readonly number[])[]> = {
  1: [
    [1, 2, 3, 5],
    [1, 3, 5, 8],
    [5, 3, 2, 1],
    [1, 2, 3, 1],
  ],
  2: [
    [1, 2, 3, 4, 5],
    [1, 3, 5, 8, 5],
    [5, 6, 5, 3, 1],
    [1, 2, 3, 5, 3],
  ],
  3: [
    [1, 2, 3, 4, 5, 8],
    [8, 7, 6, 5, 3, 1],
    [1, 3, 5, 8, 5, 3],
    [3, 4, 5, 6, 7, 8],
  ],
}

const SOLFEGE: Record<string, string> = {
  C: 'Do',
  D: 'Re',
  E: 'Mi',
  F: 'Fa',
  G: 'Sol',
  A: 'La',
  B: 'Si',
}

const ACCIDENTAL_NAMES_ES: Record<string, string> = {
  '': '',
  '#': ' sostenido',
  b: ' bemol',
  '##': ' doble sostenido',
  bb: ' doble bemol',
}

function tonicNameEs(tonic: Key): string {
  const match = /^([A-G])(##|bb|#|b)?$/.exec(tonic)
  if (!match) {
    throw new Error(`Tónica inválida: "${tonic}"`)
  }
  return `${SOLFEGE[match[1]]}${ACCIDENTAL_NAMES_ES[match[2] ?? ''] ?? ''}`
}

function keyLabel(tonic: Key): string {
  return `${tonicNameEs(tonic)} mayor`
}

function assertKnownTonic(tonic: Key): void {
  if (!(TRANSPOSITION_TONICS as readonly Key[]).includes(tonic)) {
    throw new Error(`La tonalidad "${tonic}" no pertenece a las 12 tonalidades de M2`)
  }
}

/**
 * Construye una melodía corta en la tonalidad indicada a partir de grados de
 * la escala mayor. Los grados se numeran 1..8, donde 8 es la tónica aguda.
 */
export function melodyFromDegrees(tonic: Key, degrees: readonly number[]): Pitch[] {
  assertKnownTonic(tonic)
  const scale = scalePitches(tonic, 'major')
  return degrees.map((degree) => {
    if (!Number.isInteger(degree) || degree < 1 || degree > 8) {
      throw new Error(`Grado de melodía inválido: ${degree}`)
    }
    if (degree === 8) {
      return { ...scale[0], octave: scale[0].octave + 1 }
    }
    return scale[degree - 1]
  })
}

/** Texto canónico de una melodía, por ejemplo «C4 D4 E4 G4». */
export function formatMelody(melody: readonly SpelledPitch[]): string {
  return melody.map((pitch) => formatPitch(fromSpelledPitch(pitch))).join(' ')
}

/** Transporta una melodía deletreada y la devuelve lista para el esquema. */
export function transposeSpelledMelody(
  melody: readonly SpelledPitch[],
  fromKey: Key,
  toKey: Key,
): SpelledPitch[] {
  assertKnownTonic(fromKey)
  assertKnownTonic(toKey)
  if (fromKey === toKey) {
    throw new Error('La tonalidad de origen y destino deben ser distintas')
  }
  return transposeMelody(melody.map(fromSpelledPitch), fromKey, toKey, 'major').map(
    toSpelledPitch,
  )
}

/**
 * Diferencia de altura, en semitonos, entre la tónica de destino y la de
 * origen. Todas las notas de una transposición correcta se mueven esa misma
 * cantidad.
 */
export function transpositionSemitones(fromKey: Key, toKey: Key): number {
  assertKnownTonic(fromKey)
  assertKnownTonic(toKey)
  return midiOf(scalePitches(toKey, 'major')[0]) - midiOf(scalePitches(fromKey, 'major')[0])
}

export interface TranspositionExerciseParams {
  id: string
  skillId: string
  fromKey: Key
  toKey: Key
  difficulty: TranspositionDifficulty
  /** Índice del patrón melódico; si se omite se usa el primero. */
  patternIndex?: number
}

export interface TranspositionExercise {
  id: string
  skillId: string
  type: 'transposition'
  promptEs: string
  explanationEs: string
  difficulty: number
  fromKey: Key
  toKey: Key
  melody: SpelledPitch[]
  answer: SpelledPitch[]
}

export interface TranspositionExerciseBatch {
  skillId: string
  idPrefix: string
  difficulty: TranspositionDifficulty
  fromKeys?: readonly Key[]
  toKeys?: readonly Key[]
  /** Si se omite, genera todos los pares ordenados de tonalidades distintas. */
  count?: number
}

/**
 * Genera un ejercicio de transposición con una melodía corta en la tonalidad
 * de origen y su respuesta transportada a la tonalidad de destino.
 */
export function generateTranspositionExercise(
  params: TranspositionExerciseParams,
): TranspositionExercise {
  assertKnownTonic(params.fromKey)
  assertKnownTonic(params.toKey)
  if (params.fromKey === params.toKey) {
    throw new Error('La tonalidad de origen y destino deben ser distintas')
  }

  const patterns = TRANSPOSITION_PATTERNS[params.difficulty]
  if (!patterns) {
    throw new Error(`Dificultad de transposición inválida: ${params.difficulty}`)
  }
  const patternIndex = params.patternIndex ?? 0
  if (!Number.isInteger(patternIndex) || patternIndex < 0) {
    throw new Error(`Índice de patrón inválido: ${patternIndex}`)
  }
  const pattern = patterns[patternIndex % patterns.length]
  const melody = melodyFromDegrees(params.fromKey, pattern).map(toSpelledPitch)
  const answer = transposeSpelledMelody(melody, params.fromKey, params.toKey)

  const fromLabel = keyLabel(params.fromKey)
  const toLabel = keyLabel(params.toKey)
  const semitones = transpositionSemitones(params.fromKey, params.toKey)
  const distance =
    semitones === 0
      ? 'sin cambiar de altura'
      : semitones > 0
        ? `subiendo ${semitones} semitono${semitones === 1 ? '' : 's'}`
        : `bajando ${Math.abs(semitones)} semitono${Math.abs(semitones) === 1 ? '' : 's'}`

  const exercise: TranspositionExercise = {
    id: params.id,
    skillId: params.skillId,
    type: 'transposition',
    promptEs: `¿Cómo queda esta melodía si la transponés de ${fromLabel} a ${toLabel}?`,
    explanationEs: `La melodía ${formatMelody(melody)} en ${fromLabel} se transporta a ${toLabel} ${distance}: ${formatMelody(answer)}.`,
    difficulty: params.difficulty,
    fromKey: params.fromKey,
    toKey: params.toKey,
    melody,
    answer,
  }

  const result = ExerciseSchema.safeParse(exercise)
  if (!result.success) {
    throw new Error(`El ejercicio generado no es válido: ${result.error.message}`)
  }
  return exercise
}

/**
 * Genera la matriz de transposiciones. Por defecto recorre los 12 × 11 pares
 * ordenados de tonalidades distintas, con un patrón melódico rotativo.
 */
export function generateTranspositionExercises(
  batch: TranspositionExerciseBatch,
): TranspositionExercise[] {
  const fromKeys = batch.fromKeys ?? TRANSPOSITION_TONICS
  const toKeys = batch.toKeys ?? TRANSPOSITION_TONICS
  for (const tonic of [...fromKeys, ...toKeys]) {
    assertKnownTonic(tonic)
  }

  const combinations: Array<{ fromKey: Key; toKey: Key }> = []
  for (const fromKey of fromKeys) {
    for (const toKey of toKeys) {
      if (fromKey !== toKey) combinations.push({ fromKey, toKey })
    }
  }
  if (combinations.length === 0) return []

  const count = batch.count ?? combinations.length
  const exercises: TranspositionExercise[] = []
  for (let index = 0; index < count; index += 1) {
    const combination = combinations[index % combinations.length]
    exercises.push(
      generateTranspositionExercise({
        id: `${batch.idPrefix}-${String(index + 1).padStart(3, '0')}`,
        skillId: batch.skillId,
        fromKey: combination.fromKey,
        toKey: combination.toKey,
        difficulty: batch.difficulty,
        patternIndex: index,
      }),
    )
  }
  return exercises
}
