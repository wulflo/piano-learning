import {
  ExerciseSchema,
  ORNAMENT_VALUES,
  type Exercise,
  type Ornament,
} from '../../schemas/content'
import type {
  Key,
  NoteEvent,
  RhythmicValue,
  Score,
} from '../../schemas/notation'
import {
  formatPitch,
  formatPitchEs,
  parsePitch,
  toSpelledPitch,
  type Pitch,
} from '../../theory/pitch'
import { scalePitches } from '../../theory/scales'
import { ORNAMENT_LABELS } from '../ornament-labels'

/**
 * Generador de ejercicios de ornamentos.
 *
 * Cada ejercicio muestra la realización escrita de un adorno con notas
 * normales y pide identificarlo. La partitura es la versión ejecutable: el
 * reproductor la dibuja y la toca con el piano, así que el alumno puede
 * escuchar cómo suena el trino, el mordente, el grupeto o la apoyatura antes de
 * responder.
 *
 * Las alturas se derivan de la escala mayor de la tonalidad, de modo que la
 * armadura y las alteraciones quedan escritas como corresponde: en Fa♯ mayor
 * la vecina superior de Re♯ es Mi♯, no Fa natural.
 *
 * Es puro y determinista: el grado de la nota principal, la dirección de la
 * apoyatura y el orden de las opciones se siembran con el ID, la tonalidad, el
 * adorno y la dificultad.
 */

export const ORNAMENT_DIFFICULTIES = [1, 2, 3] as const
export type OrnamentDifficulty = (typeof ORNAMENT_DIFFICULTIES)[number]

/** Las doce tonalidades que usan los generadores armónicos. */
export const ORNAMENT_TONICS = [
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

const CHOICE_COUNTS: Record<OrnamentDifficulty, number> = {
  1: 3,
  2: 4,
  3: 4,
}

/** Grados que dejan una vecina superior e inferior dentro de la octava. */
const MAIN_DEGREES = [2, 3, 4, 5, 6] as const

type AppoggiaturaNeighbour = 'upper' | 'lower'

function assertKnownTonic(tonic: Key): void {
  if (!(ORNAMENT_TONICS as readonly Key[]).includes(tonic)) {
    throw new Error(
      `La tonalidad "${tonic}" no pertenece a las 12 tonalidades del generador`,
    )
  }
}

function assertOrnament(ornament: string): asserts ornament is Ornament {
  if (!(ORNAMENT_VALUES as readonly string[]).includes(ornament)) {
    throw new Error(`Adorno desconocido: ${ornament}`)
  }
}

function assertDifficulty(
  difficulty: number,
): asserts difficulty is OrnamentDifficulty {
  if (!(ORNAMENT_DIFFICULTIES as readonly number[]).includes(difficulty)) {
    throw new Error(`Dificultad inválida: ${difficulty}`)
  }
}

function keyLabelEs(tonic: Key): string {
  return `${formatPitchEs(parsePitch(`${tonic}4`))} mayor`
}

function keyLabelEn(tonic: Key): string {
  return `${tonic} major`
}

/** Hash FNV-1a para sembrar las decisiones sin perder determinismo. */
function seedFrom(text: string): number {
  let hash = 2166136261
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

/** PRNG determinista (mulberry32) para variar grado, vecina y opciones. */
function seededRandom(seed: number): () => number {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let value = Math.imul(state ^ (state >>> 15), 1 | state)
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  const random = seededRandom(seedFrom(seed))
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1))
    ;[copy[index], copy[swap]] = [copy[swap], copy[index]]
  }
  return copy
}

function pickMainDegree(seed: string): number {
  const random = seededRandom(seedFrom(`${seed}-degree`))
  return MAIN_DEGREES[Math.floor(random() * MAIN_DEGREES.length)]
}

function pickAppoggiaturaNeighbour(seed: string): AppoggiaturaNeighbour {
  const random = seededRandom(seedFrom(`${seed}-neighbour`))
  return random() < 0.5 ? 'upper' : 'lower'
}

function ornamentChoices(
  ornament: Ornament,
  difficulty: OrnamentDifficulty,
  seed: string,
): { choices: string[]; choicesEn: string[] } {
  const count = CHOICE_COUNTS[difficulty]
  const distractors = seededShuffle(
    ORNAMENT_VALUES.filter((option) => option !== ornament),
    `${seed}-distractors`,
  ).slice(0, count - 1)
  const order = seededShuffle([ornament, ...distractors], `${seed}-order`)
  return {
    choices: order.map((option) => ORNAMENT_LABELS[option][0]),
    choicesEn: order.map((option) => ORNAMENT_LABELS[option][1]),
  }
}

interface RealizationPitches {
  main: Pitch
  upper: Pitch
  lower: Pitch
}

function buildScore(
  idPrefix: string,
  tonic: Key,
  ornament: Ornament,
  pitches: RealizationPitches,
  neighbour: AppoggiaturaNeighbour,
): Score {
  const events: NoteEvent[] = []
  let eventIndex = 0

  const push = (
    measure: number,
    beat: number,
    duration: RhythmicValue['duration'],
    pitch: Pitch,
  ): void => {
    eventIndex += 1
    events.push({
      id: `${idPrefix}.${eventIndex}`,
      measure,
      beat,
      value: {
        duration,
        dots: 0,
        tuplet: 'none',
      },
      pitches: [toSpelledPitch(pitch)],
      hand: 'right',
      voice: 1,
      velocity: 78,
      tieToNext: false,
    })
  }

  const { main, upper, lower } = pitches

  switch (ornament) {
    case 'trill': {
      // Ocho corcheas alternan principal y superior; la redonda cierra.
      for (let index = 0; index < 8; index += 1) {
        push(1, index * 0.5, 'eighth', index % 2 === 0 ? main : upper)
      }
      push(2, 0, 'whole', main)
      break
    }
    case 'mordent': {
      push(1, 0, 'quarter', main)
      push(1, 1, 'quarter', lower)
      push(1, 2, 'half', main)
      push(2, 0, 'whole', main)
      break
    }
    case 'turn': {
      push(1, 0, 'quarter', upper)
      push(1, 1, 'quarter', main)
      push(1, 2, 'quarter', lower)
      push(1, 3, 'quarter', main)
      push(2, 0, 'whole', main)
      break
    }
    case 'appoggiatura': {
      push(1, 0, 'half', neighbour === 'upper' ? upper : lower)
      push(1, 2, 'half', main)
      push(2, 0, 'whole', main)
      break
    }
  }

  return {
    clef: 'treble',
    key: tonic,
    mode: 'major',
    timeSignature: { numerator: 4, denominator: 4 },
    tempoBpm: 76,
    events,
    pedals: [],
  }
}

function explanationEs(
  ornament: Ornament,
  pitches: RealizationPitches,
  neighbour: AppoggiaturaNeighbour,
  key: string,
): string {
  const main = formatPitchEs(pitches.main)
  const upper = formatPitchEs(pitches.upper)
  const lower = formatPitchEs(pitches.lower)

  switch (ornament) {
    case 'trill':
      return `En ${key}, la realización alterna ${main} con ${upper}, su vecina superior, y vuelve a ${main} para cerrar. Esa alternancia rápida es el trino; no es un solo descenso ni un giro único alrededor de la nota.`
    case 'mordent':
      return `En ${key}, la realización baja una vez de ${main} a ${lower}, su vecina inferior, y vuelve enseguida a ${main}. Ese descenso único es el mordente; el trino alternaría muchas veces y el grupeto añadiría también la superior.`
    case 'turn':
      return `En ${key}, la realización gira alrededor de ${main}: sube a ${upper}, vuelve a ${main}, baja a ${lower} y resuelve en ${main}. Ese giro de cuatro notas es el grupeto.`
    case 'appoggiatura': {
      const name = formatPitchEs(
        neighbour === 'upper' ? pitches.upper : pitches.lower,
      )
      const side = neighbour === 'upper' ? 'superior' : 'inferior'
      return `En ${key}, la realización se apoya en ${name}, la vecina ${side} de ${main}, y después resuelve en ${main}. Esa nota de apoyo que toma parte del valor es la apoyatura; el mordente volvería enseguida a la principal.`
    }
  }
}

function explanationEn(
  ornament: Ornament,
  pitches: RealizationPitches,
  neighbour: AppoggiaturaNeighbour,
  key: string,
): string {
  const main = formatPitch(pitches.main)
  const upper = formatPitch(pitches.upper)
  const lower = formatPitch(pitches.lower)

  switch (ornament) {
    case 'trill':
      return `In ${key}, the realisation alternates ${main} with its upper neighbour ${upper} and returns to ${main} to close. That quick alternation is the trill; it is not a single drop or a single turn around the note.`
    case 'mordent':
      return `In ${key}, the realisation drops once from ${main} to its lower neighbour ${lower} and returns to ${main} at once. That single drop is the mordent; a trill would alternate many times and a turn would also add the upper note.`
    case 'turn':
      return `In ${key}, the realisation turns around ${main}: it rises to ${upper}, returns to ${main}, falls to ${lower} and resolves on ${main}. That four-note turn is the gruppetto.`
    case 'appoggiatura': {
      const name = formatPitch(
        neighbour === 'upper' ? pitches.upper : pitches.lower,
      )
      const side = neighbour === 'upper' ? 'upper' : 'lower'
      return `In ${key}, the realisation leans on ${name}, the ${side} neighbour of ${main}, and then resolves to ${main}. That leaning note, which takes part of the value, is the appoggiatura; a mordent would return to the main note at once.`
    }
  }
}

export interface OrnamentExerciseParams {
  id: string
  skillId: string
  tonic: Key
  ornament: Ornament
  difficulty?: OrnamentDifficulty
}

/**
 * Genera un ejercicio de ornamentos a partir de la realización escrita. La
 * partitura usa la escala mayor de la tonalidad, así que las vecinas y sus
 * alteraciones son siempre las de la armadura.
 */
export function generateOrnamentExercise(
  params: OrnamentExerciseParams,
): Exercise {
  assertKnownTonic(params.tonic)
  assertOrnament(params.ornament)

  const difficulty = params.difficulty ?? 2
  assertDifficulty(difficulty)

  const seed = `${params.id}-${params.tonic}-${params.ornament}-${difficulty}`
  const scale = scalePitches(params.tonic, 'major', { octave: 4 })
  const degree = pickMainDegree(seed)
  const pitches: RealizationPitches = {
    main: scale[degree - 1],
    upper: scale[degree],
    lower: scale[degree - 2],
  }
  const neighbour = pickAppoggiaturaNeighbour(seed)
  const { choices, choicesEn } = ornamentChoices(
    params.ornament,
    difficulty,
    seed,
  )
  const keyEs = keyLabelEs(params.tonic)
  const keyEn = keyLabelEn(params.tonic)

  const exercise = {
    id: params.id,
    skillId: params.skillId,
    type: 'ornament-execution' as const,
    promptEs: `¿Qué adorno se ejecuta en esta realización en ${keyEs}?`,
    promptEn: `Which ornament is played in this realisation in ${keyEn}?`,
    explanationEs: explanationEs(params.ornament, pitches, neighbour, keyEs),
    explanationEn: explanationEn(params.ornament, pitches, neighbour, keyEn),
    difficulty,
    score: buildScore(
      params.id,
      params.tonic,
      params.ornament,
      pitches,
      neighbour,
    ),
    ornament: params.ornament,
    choices,
    choicesEn,
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

export interface OrnamentExerciseBatch {
  idPrefix: string
  skillId: string
  tonics?: readonly Key[]
  ornaments?: readonly Ornament[]
  difficulty?: OrnamentDifficulty
  /** Si se omite, genera todas las combinaciones. */
  count?: number
}

/**
 * Genera la matriz de ejercicios: por defecto las doce tonalidades mayores ×
 * los cuatro adornos.
 */
export function generateOrnamentExercises(
  batch: OrnamentExerciseBatch,
): Exercise[] {
  const tonics = batch.tonics ?? ORNAMENT_TONICS
  const ornaments = batch.ornaments ?? ORNAMENT_VALUES
  const combinations: Array<{ tonic: Key; ornament: Ornament }> = []

  for (const tonic of tonics) {
    for (const ornament of ornaments) {
      combinations.push({ tonic, ornament })
    }
  }
  if (combinations.length === 0) return []

  const count = batch.count ?? combinations.length
  const exercises: Exercise[] = []
  for (let index = 0; index < count; index += 1) {
    const combination = combinations[index % combinations.length]
    exercises.push(
      generateOrnamentExercise({
        id: `${batch.idPrefix}-${String(index + 1).padStart(3, '0')}`,
        skillId: batch.skillId,
        tonic: combination.tonic,
        ornament: combination.ornament,
        difficulty: batch.difficulty,
      }),
    )
  }
  return exercises
}
