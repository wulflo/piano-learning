import { ExerciseSchema } from '../../schemas/content'
import type { Hand, Key } from '../../schemas'
import { formatPitchEs, midiOf, parsePitch } from '../../theory'
import {
  ARPEGGIO_TONICS,
  arpeggioFingering,
  arpeggioFingeringLabel,
  arpeggioHasBlackTonic,
  arpeggioPitches,
} from '../arpeggio'

/**
 * F5-019 — Generador de ejercicios de digitación.
 *
 * Los ejercicios de digitación usan el tipo `arpeggio` ya soportado por el
 * contenido y el renderizador. El generador elige tónicas, manos y octavas de
 * una matriz controlada (las doce tonalidades mayores del curso) y construye
 * distractores a partir de digitaciones vecinas, de modo que la respuesta
 * correcta nunca sea la única opción verosímil. Antes de devolver el ejercicio
 * comprueba la digitación y el rango MIDI de las notas.
 */

export const FINGERING_DIFFICULTIES = [1, 2, 3] as const
export type FingeringDifficulty = (typeof FINGERING_DIFFICULTIES)[number]

export const FINGERING_OCTAVES = [1, 2] as const
export type FingeringOctaves = (typeof FINGERING_OCTAVES)[number]

const CHOICE_COUNTS: Record<FingeringDifficulty, number> = {
  1: 3,
  2: 4,
  3: 4,
}

/** Rango MIDI que el motor de audio y el teclado pueden reproducir. */
export const FINGERING_MIDI_MIN = 21
export const FINGERING_MIDI_MAX = 108

const HAND_LABELS: Record<Hand, { es: string; en: string }> = {
  right: { es: 'derecha', en: 'right' },
  left: { es: 'izquierda', en: 'left' },
}

function keyNameEs(tonic: Key): string {
  return formatPitchEs(parsePitch(`${tonic}4`))
}

function keyNameEn(tonic: Key): string {
  return tonic.replace('b', '♭').replace('#', '♯')
}

function assertKnownTonic(tonic: Key): void {
  if (!(ARPEGGIO_TONICS as readonly Key[]).includes(tonic)) {
    throw new Error(
      `La tonalidad "${tonic}" no pertenece a las doce tónicas del generador`,
    )
  }
}

function assertDifficulty(difficulty: number): asserts difficulty is FingeringDifficulty {
  if (
    !(FINGERING_DIFFICULTIES as readonly number[]).includes(difficulty)
  ) {
    throw new Error(`Dificultad de digitación inválida: ${difficulty}`)
  }
}

function assertOctaves(octaves: number): asserts octaves is FingeringOctaves {
  if (!(FINGERING_OCTAVES as readonly number[]).includes(octaves)) {
    throw new Error(`Cantidad de octavas inválida: ${octaves}`)
  }
}

/** Comprueba que un dedo está entre 1 (pulgar) y 5 (meñique). */
export function isValidFinger(finger: number): boolean {
  return Number.isInteger(finger) && finger >= 1 && finger <= 5
}

/**
 * Comprueba que el arpegio se puede tocar: la digitación tiene el largo
 * esperado para la cantidad de octavas, todos los dedos existen y las notas
 * suben de grave a agudo sin salir del rango MIDI.
 */
export function isPlayableArpeggio(
  tonic: Key,
  hand: Hand,
  octaves: FingeringOctaves,
): boolean {
  const fingers = arpeggioFingering(tonic, hand, octaves)
  const expected = octaves * 3 + 1
  if (fingers.length !== expected) return false
  if (!fingers.every(isValidFinger)) return false

  const midis = arpeggioPitches(tonic, hand, octaves).map((pitch) =>
    midiOf(pitch),
  )
  if (midis.length !== expected) return false
  if (!midis.every((midi) => midi >= FINGERING_MIDI_MIN && midi <= FINGERING_MIDI_MAX)) {
    return false
  }
  for (let index = 1; index < midis.length; index += 1) {
    if (midis[index] <= midis[index - 1]) return false
  }
  return true
}

function shuffle<T>(items: T[]): T[] {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1))
    ;[items[index], items[swap]] = [items[swap], items[index]]
  }
  return items
}

/**
 * Digitaciones verosímiles para un arpegio: se obtienen intercambiando dedos
 * vecinos, cambiando el dedo final o usando el patrón de tecla negra. No se
 * usan como respuesta, solo como distractores.
 */
function fingeringVariants(correct: readonly number[]): number[][] {
  const variants: number[][] = []
  for (let index = 0; index < correct.length - 1; index += 1) {
    const copy = [...correct]
    ;[copy[index], copy[index + 1]] = [copy[index + 1], copy[index]]
    variants.push(copy)
  }
  const last = correct[correct.length - 1]
  for (const finger of [1, 2, 3, 4, 5]) {
    if (finger === last) continue
    variants.push([...correct.slice(0, -1), finger])
  }
  for (const finger of [1, 2, 3, 4, 5]) {
    if (finger === correct[0]) continue
    variants.push([finger, ...correct.slice(1)])
  }
  return variants
}

function buildFingeringChoices(
  tonic: Key,
  hand: Hand,
  octaves: FingeringOctaves,
  difficulty: FingeringDifficulty,
): string[] {
  const correct = arpeggioFingering(tonic, hand, octaves)
  const correctLabel = arpeggioFingeringLabel(tonic, hand, octaves)
  const wanted = CHOICE_COUNTS[difficulty] ?? CHOICE_COUNTS[1]
  const labels: string[] = []
  for (const variant of fingeringVariants(correct)) {
    const label = variant.join('-')
    if (label !== correctLabel && !labels.includes(label)) {
      labels.push(label)
    }
  }
  const choices = [correctLabel, ...shuffle(labels).slice(0, wanted - 1)]
  return shuffle(choices)
}

export interface FingeringExerciseParams {
  id: string
  skillId: string
  tonic: Key
  hand: Hand
  octaves: FingeringOctaves
  difficulty: FingeringDifficulty
}

export interface FingeringExercise {
  id: string
  skillId: string
  type: 'arpeggio'
  promptEs: string
  promptEn: string
  explanationEs: string
  explanationEn: string
  difficulty: number
  tonic: Key
  hand: Hand
  octaves: FingeringOctaves
  ask: 'fingering'
  choices: string[]
  choicesEn: string[]
}

/**
 * Genera un ejercicio de digitación de arpegios mayores. La tónica, la mano y
 * las octavas se validan antes de construir el enunciado; la digitación se
 * verifica contra el patrón del curso y contra el rango del teclado.
 */
export function generateFingeringExercise(
  params: FingeringExerciseParams,
): FingeringExercise {
  assertKnownTonic(params.tonic)
  assertDifficulty(params.difficulty)
  assertOctaves(params.octaves)
  if (!isPlayableArpeggio(params.tonic, params.hand, params.octaves)) {
    throw new Error(
      `El arpegio ${params.tonic} con la mano ${params.hand} y ${params.octaves} octava(s) no es tocable`,
    )
  }

  const label = arpeggioFingeringLabel(
    params.tonic,
    params.hand,
    params.octaves,
  )
  const handEs = HAND_LABELS[params.hand].es
  const handEn = HAND_LABELS[params.hand].en
  const keyEs = keyNameEs(params.tonic)
  const keyEn = keyNameEn(params.tonic)
  const octavesEs =
    params.octaves === 1 ? 'de una octava' : 'de dos octavas'
  const octavesEn =
    params.octaves === 1 ? 'one-octave' : 'two-octave'
  const black = arpeggioHasBlackTonic(params.tonic)
  const colorEs = black ? 'tecla negra' : 'tecla blanca'
  const colorEn = black ? 'black key' : 'white key'

  const choices = buildFingeringChoices(
    params.tonic,
    params.hand,
    params.octaves,
    params.difficulty,
  )

  const exercise: FingeringExercise = {
    id: params.id,
    skillId: params.skillId,
    type: 'arpeggio',
    promptEs: `¿Qué digitación usás para el arpegio de ${keyEs} ${octavesEs} con la mano ${handEs}?`,
    promptEn: `Which fingering do you use for the ${octavesEn} ${keyEn} arpeggio with the ${handEn} hand?`,
    explanationEs: `La digitación del arpegio de ${keyEs} ${octavesEs} con la mano ${handEs} es ${label}. La tónica cae en una ${colorEs}, así que la mano arranca con el dedo ${label.split('-')[0]} y repite el patrón sin girar la muñeca. Practicá primero las notas sueltas y después uní el arpegio completo a tempo lento.`,
    explanationEn: `The fingering for the ${octavesEn} ${keyEn} arpeggio with the ${handEn} hand is ${label}. The tonic falls on a ${colorEn}, so the hand starts with finger ${label.split('-')[0]} and repeats the pattern without twisting the wrist. Practise the notes separately first, then join the whole arpeggio at a slow tempo.`,
    difficulty: params.difficulty,
    tonic: params.tonic,
    hand: params.hand,
    octaves: params.octaves,
    ask: 'fingering',
    choices,
    choicesEn: [...choices],
  }

  const result = ExerciseSchema.safeParse(exercise)
  if (!result.success) {
    throw new Error(
      `El ejercicio de digitación generado no es válido: ${result.error.message}`,
    )
  }
  return exercise
}

export interface FingeringExerciseBatch {
  skillId: string
  idPrefix: string
  count: number
  difficulty?: FingeringDifficulty
  tonics?: readonly Key[]
  hands?: readonly Hand[]
  octaves?: readonly FingeringOctaves[]
}

const DEFAULT_TONICS: readonly Key[] = ARPEGGIO_TONICS

/**
 * Genera una tanda de ejercicios de digitación recorriendo las tónicas, las
 * manos y las octavas en un orden controlado. La aleatoriedad queda en las
 * opciones y en el orden, no en la matriz de posiciones.
 */
export function generateFingeringExercises(
  batch: FingeringExerciseBatch,
): FingeringExercise[] {
  if (!Number.isInteger(batch.count) || batch.count < 0) {
    throw new Error(`Cantidad inválida: ${batch.count}`)
  }
  const tonics = batch.tonics ?? DEFAULT_TONICS
  const hands = batch.hands ?? (['right', 'left'] as const)
  const octaves = batch.octaves ?? FINGERING_OCTAVES
  if (tonics.length === 0 || hands.length === 0 || octaves.length === 0) {
    throw new Error('La tanda de digitación necesita tónicas, manos y octavas')
  }

  const difficulty = batch.difficulty ?? 2
  assertDifficulty(difficulty)

  const exercises: FingeringExercise[] = []
  for (let index = 0; index < batch.count; index += 1) {
    const tonic = tonics[index % tonics.length]
    const hand = hands[Math.floor(index / tonics.length) % hands.length]
    const octaveSet =
      octaves[
        Math.floor(index / (tonics.length * hands.length)) % octaves.length
      ]
    if (tonic === undefined || hand === undefined || octaveSet === undefined) {
      continue
    }
    exercises.push(
      generateFingeringExercise({
        id: `${batch.idPrefix}-${String(index + 1).padStart(3, '0')}`,
        skillId: batch.skillId,
        tonic,
        hand,
        octaves: octaveSet,
        difficulty,
      }),
    )
  }
  return exercises
}
