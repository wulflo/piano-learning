import { ExerciseSchema } from '../../schemas/content'
import type { Key } from '../../schemas/notation'
import {
  allMajorKeySignatures,
  allMinorKeySignatures,
  keyForSignature,
  keySignature,
  type KeyMode,
  type KeySignature,
} from '../../theory'

export const KEY_SIGNATURE_DIRECTIONS = [
  'key-to-signature',
  'signature-to-key',
  'fifth-up',
  'fifth-down',
] as const
export type KeySignatureDirection = (typeof KEY_SIGNATURE_DIRECTIONS)[number]

export const KEY_SIGNATURE_DIFFICULTIES = [1, 2, 3] as const
export type KeySignatureDifficulty = (typeof KEY_SIGNATURE_DIFFICULTIES)[number]

/** Las 15 armaduras mayores, de 7 bemoles (Cb) a 7 sostenidos (C#). */
export const KEY_SIGNATURE_MAJOR_TONICS: readonly Key[] = allMajorKeySignatures().map(
  (signature) => signature.tonic,
)

/** Las 15 armaduras menores relativas, en el mismo orden del círculo. */
export const KEY_SIGNATURE_MINOR_TONICS: readonly Key[] = allMinorKeySignatures().map(
  (signature) => signature.tonic,
)

const DISTRACTOR_COUNTS: Record<KeySignatureDifficulty, number> = {
  1: 1,
  2: 2,
  3: 3,
}

const MODE_LABELS_ES: Record<KeyMode, string> = {
  major: 'mayor',
  minor: 'menor',
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

function keyLabel(tonic: Key, mode: KeyMode): string {
  return `${tonicNameEs(tonic)} ${MODE_LABELS_ES[mode]}`
}

function accidentalList(signature: KeySignature): string[] {
  return signature.accidentals.map((item) => `${item.step}${item.accidental > 0 ? '#' : 'b'}`)
}

function joinWithY(items: string[]): string {
  if (items.length <= 1) return items[0] ?? ''
  return `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`
}

/**
 * Resumen de una armadura, por ejemplo «3 sostenidos (F# C# G#)» o
 * «Sin alteraciones».
 */
export function describeKeySignature(tonic: Key, mode: KeyMode = 'major'): string {
  return formatSignature(keySignature(tonic, mode))
}

function formatSignature(signature: KeySignature): string {
  const count = signature.count
  if (count === 0) return 'Sin alteraciones'
  const total = Math.abs(count)
  const noun =
    count > 0
      ? total === 1
        ? 'sostenido'
        : 'sostenidos'
      : total === 1
        ? 'bemol'
        : 'bemoles'
  return `${total} ${noun} (${accidentalList(signature).join(' ')})`
}

function formatSignatureByCount(count: number): string {
  return formatSignature(keySignature(keyForSignature(count, 'major'), 'major'))
}

function describeSignatureExplanation(label: string, signature: KeySignature): string {
  if (signature.count === 0) {
    return `La armadura de ${label} no tiene alteraciones.`
  }
  const total = Math.abs(signature.count)
  const noun =
    signature.count > 0
      ? total === 1
        ? 'sostenido'
        : 'sostenidos'
      : total === 1
        ? 'bemol'
        : 'bemoles'
  return `La armadura de ${label} tiene ${total} ${noun}: ${joinWithY(accidentalList(signature))}.`
}

function tonicsForMode(mode: KeyMode): readonly Key[] {
  return mode === 'major' ? KEY_SIGNATURE_MAJOR_TONICS : KEY_SIGNATURE_MINOR_TONICS
}

function neighborKey(tonic: Key, mode: KeyMode, offset: 1 | -1): Key | null {
  const tonics = tonicsForMode(mode)
  const index = tonics.indexOf(tonic)
  if (index < 0) {
    throw new Error(`La tonalidad ${tonic} no pertenece a las 15 armaduras ${mode}`)
  }
  return tonics[index + offset] ?? null
}

function shuffle<T>(items: T[]): T[] {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1))
    const current = items[index]
    items[index] = items[swap]
    items[swap] = current
  }
  return items
}

function pickDistractors(correct: string, candidates: string[], count: number): string[] {
  const unique = candidates.filter(
    (candidate, index, list) => candidate !== correct && list.indexOf(candidate) === index,
  )
  const window = unique.slice(0, Math.max(count * 2, 6))
  return shuffle([...window]).slice(0, count)
}

function signatureDistractors(count: number, wanted: number): string[] {
  const counts: number[] = []
  for (let value = -7; value <= 7; value += 1) {
    if (value !== count) counts.push(value)
  }
  counts.sort((a, b) => Math.abs(a - count) - Math.abs(b - count))
  return pickDistractors(formatSignatureByCount(count), counts.map(formatSignatureByCount), wanted)
}

function keyDistractors(tonic: Key, mode: KeyMode, wanted: number): string[] {
  const tonics = tonicsForMode(mode)
  const index = tonics.indexOf(tonic)
  if (index < 0) {
    throw new Error(`La tonalidad ${tonic} no pertenece a las 15 armaduras ${mode}`)
  }
  const candidates = tonics
    .filter((candidate) => candidate !== tonic)
    .map((candidate) => ({ candidate, distance: Math.abs(tonics.indexOf(candidate) - index) }))
    .sort((a, b) => a.distance - b.distance)
    .map(({ candidate }) => keyLabel(candidate, mode))
  return pickDistractors(keyLabel(tonic, mode), candidates, wanted)
}

export interface KeySignatureExerciseParams {
  id: string
  skillId: string
  tonic: Key
  mode?: KeyMode
  direction: KeySignatureDirection
  difficulty: KeySignatureDifficulty
}

export interface KeySignatureExercise {
  id: string
  skillId: string
  type: 'key-signature'
  promptEs: string
  explanationEs: string
  difficulty: number
  key: Key
  mode: KeyMode
  direction: KeySignatureDirection
  answer: string
  choices: string[]
}

export interface KeySignatureExerciseBatch {
  skillId: string
  idPrefix: string
  difficulty: KeySignatureDifficulty
  mode?: KeyMode
  tonics?: readonly Key[]
  directions?: readonly KeySignatureDirection[]
  /** Si se omite, genera todas las combinaciones válidas. */
  count?: number
}

/**
 * Genera un ejercicio de armaduras en cualquiera de los dos sentidos o con un
 * vecino del círculo de quintas. La respuesta canónica queda disponible para
 * la corrección y las opciones sirven de respaldo para la UI.
 */
export function generateKeySignatureExercise(
  params: KeySignatureExerciseParams,
): KeySignatureExercise {
  const mode = params.mode ?? 'major'
  const signature = keySignature(params.tonic, mode)
  const summary = formatSignature(signature)
  const label = keyLabel(params.tonic, mode)
  const wanted = DISTRACTOR_COUNTS[params.difficulty] ?? 1

  let promptEs: string
  let explanationEs: string
  let answer: string
  let distractors: string[]

  switch (params.direction) {
    case 'key-to-signature': {
      answer = summary
      promptEs = `¿Qué alteraciones tiene la armadura de ${label}?`
      explanationEs = describeSignatureExplanation(label, signature)
      distractors = signatureDistractors(signature.count, wanted)
      break
    }
    case 'signature-to-key': {
      answer = label
      promptEs =
        signature.count === 0
          ? `¿Qué tonalidad ${MODE_LABELS_ES[mode]} no tiene alteraciones en la armadura?`
          : `¿Qué tonalidad ${MODE_LABELS_ES[mode]} tiene la armadura de ${summary}?`
      explanationEs =
        signature.count === 0
          ? `La armadura sin alteraciones corresponde a ${label}.`
          : `La armadura de ${summary} corresponde a ${label}.`
      distractors = keyDistractors(params.tonic, mode, wanted)
      break
    }
    case 'fifth-up':
    case 'fifth-down': {
      const offset: 1 | -1 = params.direction === 'fifth-up' ? 1 : -1
      const target = neighborKey(params.tonic, mode, offset)
      if (!target) {
        throw new Error(
          `No hay una quinta ${offset > 0 ? 'arriba' : 'abajo'} de ${label} dentro de las 15 armaduras`,
        )
      }
      const targetSignature = keySignature(target, mode)
      const targetLabel = keyLabel(target, mode)
      const preposition = offset > 0 ? 'arriba' : 'abajo'
      answer = targetLabel
      promptEs = `¿Qué tonalidad está una quinta justa ${preposition} de ${label} en el círculo de quintas?`
      explanationEs = `En el círculo de quintas, una quinta justa ${preposition} de ${label} es ${targetLabel}. La armadura de ${label} es ${summary} y la de ${targetLabel} es ${formatSignature(targetSignature)}.`
      distractors = keyDistractors(target, mode, wanted)
      break
    }
  }

  if (distractors.length < wanted) {
    throw new Error(`No se pudieron generar distractores para ${label} (${params.direction})`)
  }

  const exercise: KeySignatureExercise = {
    id: params.id,
    skillId: params.skillId,
    type: 'key-signature',
    promptEs,
    explanationEs,
    difficulty: params.difficulty,
    key: params.tonic,
    mode,
    direction: params.direction,
    answer,
    choices: shuffle([answer, ...distractors]),
  }

  const result = ExerciseSchema.safeParse(exercise)
  if (!result.success) {
    throw new Error(`El ejercicio generado no es válido: ${result.error.message}`)
  }
  return exercise
}

/**
 * Genera la matriz de armaduras. Por defecto recorre las 15 armaduras mayores
 * en los cuatro sentidos, omitiendo los extremos donde una quinta saldría del
 * rango de 15 armaduras.
 */
export function generateKeySignatureExercises(
  batch: KeySignatureExerciseBatch,
): KeySignatureExercise[] {
  const mode = batch.mode ?? 'major'
  const tonics = batch.tonics ?? tonicsForMode(mode)
  const directions = batch.directions ?? KEY_SIGNATURE_DIRECTIONS
  const combinations: Array<{ tonic: Key; direction: KeySignatureDirection }> = []

  for (const tonic of tonics) {
    for (const direction of directions) {
      if (direction === 'fifth-up' && !neighborKey(tonic, mode, 1)) continue
      if (direction === 'fifth-down' && !neighborKey(tonic, mode, -1)) continue
      combinations.push({ tonic, direction })
    }
  }
  if (combinations.length === 0) return []

  const count = batch.count ?? combinations.length
  const exercises: KeySignatureExercise[] = []
  for (let index = 0; index < count; index += 1) {
    const combination = combinations[index % combinations.length]
    exercises.push(
      generateKeySignatureExercise({
        id: `${batch.idPrefix}-${String(index + 1).padStart(3, '0')}`,
        skillId: batch.skillId,
        tonic: combination.tonic,
        mode,
        direction: combination.direction,
        difficulty: batch.difficulty,
      }),
    )
  }
  return exercises
}
