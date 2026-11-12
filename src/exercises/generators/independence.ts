import { attackingHandAt } from '../../content/score'
import type { Hand, NoteEvent, Score } from '../../schemas'
import { ExerciseSchema } from '../../schemas/content'
import {
  formatPitch,
  formatPitchEs,
  fromSpelledPitch,
  midiOf,
  parsePitch,
  toSpelledPitch,
  type Pitch,
} from '../../theory'
import { HAND_LABELS, type AttackingHand } from '../hand-coordination'

/**
 * F5-019 — Generador de ejercicios de independencia.
 *
 * Los ejercicios usan el tipo `hand-coordination`, que pregunta qué mano
 * ataca en un pulso concreto. En lugar de sortear notas y ritmos sin control,
 * el generador parte de patrones de coordinación ya validados (alternancia,
 * una mano sostiene mientras la otra se mueve y ataques simultáneos), elige
 * alturas dentro de registros seguros para cada mano y solo pregunta por
 * pulsos que realmente tienen un ataque. Así nunca aparecen posiciones
 * cruzadas, notas fuera de rango ni compases incompletos.
 */

export const COORDINATION_PATTERN_KINDS = [
  'alternating',
  'hold-and-move',
  'simultaneous',
] as const
export type CoordinationPatternKind = (typeof COORDINATION_PATTERN_KINDS)[number]

export const COORDINATION_DIFFICULTIES = [1, 2, 3] as const
export type CoordinationDifficulty = (typeof COORDINATION_DIFFICULTIES)[number]

export const COORDINATION_METERS = ['4/4', '3/4'] as const
export type CoordinationMeter = (typeof COORDINATION_METERS)[number]

const METER_BEATS: Record<CoordinationMeter, number> = {
  '4/4': 4,
  '3/4': 3,
}

type CoordinationDuration = 'quarter' | 'half' | 'whole'

export interface CoordinationSlot {
  /** Pulso 0-based dentro del compás. */
  beat: number
  hand: Hand
  duration: CoordinationDuration
  /** Puntillo: convierte la blanca en blanca con puntillo (3 pulsos). */
  dots?: 0 | 1
}

export interface CoordinationPattern {
  id: string
  kind: CoordinationPatternKind
  meter: CoordinationMeter
  measures: readonly (readonly CoordinationSlot[])[]
}

const q = (beat: number, hand: Hand): CoordinationSlot => ({
  beat,
  hand,
  duration: 'quarter',
})
const h = (beat: number, hand: Hand): CoordinationSlot => ({
  beat,
  hand,
  duration: 'half',
})

function alternatingMeasure(
  first: Hand,
  beats: number,
): CoordinationSlot[] {
  return Array.from({ length: beats }, (_, beat) =>
    q(beat, beat % 2 === 0 ? first : otherHand(first)),
  )
}

function otherHand(hand: Hand): Hand {
  return hand === 'right' ? 'left' : 'right'
}

function holdMeasure(moving: Hand, heldDuration: CoordinationDuration): CoordinationSlot[] {
  const held = otherHand(moving)
  return [
    { beat: 0, hand: held, duration: heldDuration, dots: heldDuration === 'half' ? 1 : 0 },
    q(0, moving),
    q(1, moving),
    q(2, moving),
    ...(heldDuration === 'whole' ? [q(3, moving)] : []),
  ]
}

/**
 * Patrones de referencia. Todos los compases están completos y ninguna mano
 * ataca dos veces el mismo pulso. Las variantes de una mano u otra permiten
 * que la pregunta cambie sin salir de la matriz segura.
 */
export const COORDINATION_PATTERNS: readonly CoordinationPattern[] = [
  {
    id: 'alt-44-right',
    kind: 'alternating',
    meter: '4/4',
    measures: [
      alternatingMeasure('right', 4),
      alternatingMeasure('right', 4),
    ],
  },
  {
    id: 'alt-44-left',
    kind: 'alternating',
    meter: '4/4',
    measures: [alternatingMeasure('left', 4), alternatingMeasure('left', 4)],
  },
  {
    id: 'hold-44-right',
    kind: 'hold-and-move',
    meter: '4/4',
    measures: [holdMeasure('right', 'whole'), holdMeasure('right', 'whole')],
  },
  {
    id: 'hold-44-left',
    kind: 'hold-and-move',
    meter: '4/4',
    measures: [holdMeasure('left', 'whole'), holdMeasure('left', 'whole')],
  },
  {
    id: 'both-44-halves',
    kind: 'simultaneous',
    meter: '4/4',
    measures: [
      [h(0, 'right'), h(0, 'left'), h(2, 'right'), h(2, 'left')],
      [h(0, 'right'), h(0, 'left'), h(2, 'right'), h(2, 'left')],
    ],
  },
  {
    id: 'both-44-mixed',
    kind: 'simultaneous',
    meter: '4/4',
    measures: [
      [q(0, 'right'), q(0, 'left'), q(1, 'right'), q(2, 'right'), q(2, 'left'), q(3, 'left')],
      [q(0, 'right'), q(0, 'left'), q(1, 'right'), q(2, 'right'), q(2, 'left'), q(3, 'left')],
    ],
  },
  {
    id: 'alt-34-right',
    kind: 'alternating',
    meter: '3/4',
    measures: [alternatingMeasure('right', 3), alternatingMeasure('right', 3)],
  },
  {
    id: 'alt-34-left',
    kind: 'alternating',
    meter: '3/4',
    measures: [alternatingMeasure('left', 3), alternatingMeasure('left', 3)],
  },
  {
    id: 'hold-34-right',
    kind: 'hold-and-move',
    meter: '3/4',
    measures: [holdMeasure('right', 'half'), holdMeasure('right', 'half')],
  },
  {
    id: 'hold-34-left',
    kind: 'hold-and-move',
    meter: '3/4',
    measures: [holdMeasure('left', 'half'), holdMeasure('left', 'half')],
  },
  {
    id: 'both-34-mixed',
    kind: 'simultaneous',
    meter: '3/4',
    measures: [
      [h(0, 'right'), h(0, 'left'), q(2, 'right'), q(2, 'left')],
      [h(0, 'right'), h(0, 'left'), q(2, 'right'), q(2, 'left')],
    ],
  },
]

/** Patrones permitidos en cada nivel; la dificultad agrega independencia. */
export const COORDINATION_PATTERNS_BY_DIFFICULTY: Record<
  CoordinationDifficulty,
  readonly CoordinationPatternKind[]
> = {
  1: ['alternating'],
  2: ['alternating', 'hold-and-move'],
  3: ['alternating', 'hold-and-move', 'simultaneous'],
}

const SLOT_BEATS: Record<CoordinationDuration, number> = {
  quarter: 1,
  half: 2,
  whole: 4,
}

function slotBeats(slot: CoordinationSlot): number {
  return SLOT_BEATS[slot.duration] + (slot.dots === 1 ? 1 : 0)
}

/**
 * Verifica que un patrón sea tocable: compases completos, pulsos dentro del
 * compás y una sola nota por mano y pulso. Una mano puede sostener una nota
 * mientras la otra ataca, pero no puede empezar dos notas en el mismo pulso.
 */
export function coordinationPatternIsPlayable(
  pattern: CoordinationPattern,
): boolean {
  const beats = METER_BEATS[pattern.meter]
  if (pattern.measures.length === 0) return false

  for (const measure of pattern.measures) {
    if (measure.length === 0) return false
    const ends = new Map<Hand, number>()
    const attacks = new Set<string>()
    for (const slot of measure) {
      if (!Number.isInteger(slot.beat) || slot.beat < 0 || slot.beat >= beats) {
        return false
      }
      const key = `${slot.hand}:${slot.beat}`
      if (attacks.has(key)) return false
      attacks.add(key)

      const previousEnd = ends.get(slot.hand) ?? 0
      if (slot.beat < previousEnd) return false
      const end = slot.beat + slotBeats(slot)
      if (end > beats) return false
      ends.set(slot.hand, end)
    }
  }
  return true
}

/** Registros MIDI seguros: la izquierda queda siempre por debajo de la derecha. */
export const COORDINATION_RANGES = {
  left: { minMidi: 36, maxMidi: 48 },
  right: { minMidi: 60, maxMidi: 76 },
} as const

/** Salto máximo entre ataques consecutivos de la misma mano. */
export const COORDINATION_MAX_LEAP = 7

const RIGHT_PITCHES: readonly Pitch[] = [
  'C4',
  'D4',
  'E4',
  'F4',
  'G4',
  'A4',
  'B4',
  'C5',
  'D5',
  'E5',
].map((name) => parsePitch(name))

const LEFT_PITCHES: readonly Pitch[] = [
  'C2',
  'D2',
  'E2',
  'F2',
  'G2',
  'A2',
  'B2',
  'C3',
].map((name) => parsePitch(name))

function pitchPool(hand: Hand): readonly Pitch[] {
  return hand === 'right' ? RIGHT_PITCHES : LEFT_PITCHES
}

function pitchIsInRange(hand: Hand, pitch: Pitch): boolean {
  const range = COORDINATION_RANGES[hand]
  const midi = midiOf(pitch)
  return midi >= range.minMidi && midi <= range.maxMidi
}

function choosePitch(
  hand: Hand,
  previousMidi: number | undefined,
): Pitch {
  const pool = pitchPool(hand)
  const reachable =
    previousMidi === undefined
      ? pool
      : pool.filter(
          (pitch) => Math.abs(midiOf(pitch) - previousMidi) <= COORDINATION_MAX_LEAP,
        )
  const candidates = reachable.length > 0 ? reachable : pool
  const stepwise =
    previousMidi === undefined
      ? candidates
      : candidates.filter((pitch) => Math.abs(midiOf(pitch) - previousMidi) <= 2)
  const list =
    previousMidi !== undefined && stepwise.length > 0 && Math.random() < 0.7
      ? stepwise
      : candidates
  const chosen = list[Math.floor(Math.random() * list.length)]
  if (chosen === undefined) {
    throw new Error(`No hay alturas disponibles para la mano ${hand}`)
  }
  return chosen
}

function shuffle<T>(items: T[]): T[] {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1))
    ;[items[index], items[swap]] = [items[swap], items[index]]
  }
  return items
}

function noteLabel(pitch: Pitch, language: 'es' | 'en'): string {
  const label = language === 'es' ? formatPitchEs(pitch) : formatPitch(pitch)
  return `${label}${pitch.octave}`
}

export interface IndependenceExerciseParams {
  id: string
  skillId: string
  difficulty: CoordinationDifficulty
  pattern: CoordinationPattern
  tempoBpm?: number
}

export interface IndependenceExercise {
  id: string
  skillId: string
  type: 'hand-coordination'
  promptEs: string
  promptEn: string
  explanationEs: string
  explanationEn: string
  difficulty: number
  score: Score
  measure: number
  beat: number
  choices: string[]
  choicesEn: string[]
}

function buildScore(
  params: IndependenceExerciseParams,
  pattern: CoordinationPattern,
): Score {
  const events: NoteEvent[] = []
  const previous = new Map<Hand, number>()
  let index = 0

  for (const [measureIndex, measure] of pattern.measures.entries()) {
    const ordered = [...measure].sort((a, b) => a.beat - b.beat)
    for (const slot of ordered) {
      const previousMidi = previous.get(slot.hand)
      const pitch = choosePitch(slot.hand, previousMidi)
      previous.set(slot.hand, midiOf(pitch))
      if (!pitchIsInRange(slot.hand, pitch)) {
        throw new Error(
          `La nota ${noteLabel(pitch, 'es')} queda fuera del registro de la mano ${slot.hand}`,
        )
      }
      index += 1
      events.push({
        id: `${params.id}.${index}`,
        measure: measureIndex + 1,
        beat: slot.beat,
        value: {
          duration: slot.duration,
          dots: slot.dots ?? 0,
          tuplet: 'none',
        },
        pitches: [toSpelledPitch(pitch)],
        hand: slot.hand,
        voice: 1,
        velocity: 78,
        tieToNext: false,
      })
    }
  }

  return {
    clef: 'treble',
    key: 'C',
    mode: 'major',
    timeSignature:
      pattern.meter === '4/4'
        ? { numerator: 4, denominator: 4 }
        : { numerator: 3, denominator: 4 },
    tempoBpm: params.tempoBpm ?? 60,
    events,
    pedals: [],
  }
}

/**
 * Genera un ejercicio de independencia a partir de un patrón validado. La
 * pregunta se elige entre los pulsos que tienen ataque real y las opciones son
 * las tres respuestas posibles (derecha, izquierda o ambas).
 */
export function generateIndependenceExercise(
  params: IndependenceExerciseParams,
): IndependenceExercise {
  if (
    !(COORDINATION_DIFFICULTIES as readonly number[]).includes(params.difficulty)
  ) {
    throw new Error(`Dificultad de independencia inválida: ${params.difficulty}`)
  }
  const allowed = COORDINATION_PATTERNS_BY_DIFFICULTY[params.difficulty]
  if (!allowed.includes(params.pattern.kind)) {
    throw new Error(
      `El patrón "${params.pattern.kind}" no corresponde al nivel ${params.difficulty}`,
    )
  }
  if (!coordinationPatternIsPlayable(params.pattern)) {
    throw new Error(`El patrón "${params.pattern.id}" no es tocable`)
  }
  if (params.tempoBpm !== undefined) {
    if (
      !Number.isInteger(params.tempoBpm) ||
      params.tempoBpm < 20 ||
      params.tempoBpm > 300
    ) {
      throw new Error(`Tempo inválido: ${params.tempoBpm}`)
    }
  }

  const score = buildScore(params, params.pattern)
  const beats = METER_BEATS[params.pattern.meter]
  const attackPoints: Array<{ measure: number; beat: number }> = []
  for (let measure = 1; measure <= params.pattern.measures.length; measure += 1) {
    for (let beat = 1; beat <= beats; beat += 1) {
      if (attackingHandAt(score, measure, beat) !== null) {
        attackPoints.push({ measure, beat })
      }
    }
  }
  const point = attackPoints[Math.floor(Math.random() * attackPoints.length)]
  if (point === undefined) {
    throw new Error('El patrón generado no tiene ningún ataque')
  }

  const answer = attackingHandAt(score, point.measure, point.beat)
  if (answer === null) {
    throw new Error('No se pudo resolver la mano que ataca')
  }

  const eventsAtPoint = score.events.filter(
    (event) =>
      event.measure === point.measure &&
      Math.abs(event.beat - (point.beat - 1)) < 1e-6,
  )
  const rightPitchEs = eventPitch(eventsAtPoint, 'right', 'es')
  const leftPitchEs = eventPitch(eventsAtPoint, 'left', 'es')
  const rightPitchEn = eventPitch(eventsAtPoint, 'right', 'en')
  const leftPitchEn = eventPitch(eventsAtPoint, 'left', 'en')

  const allAnswers: AttackingHand[] = ['right', 'left', 'both']
  const order = shuffle([0, 1, 2])
  const ordered = order.map((position) => allAnswers[position] ?? 'both')
  const choices = ordered.map((answer) => HAND_LABELS[answer].es)
  const choicesEn = ordered.map((answer) => HAND_LABELS[answer].en)

  const explanationEs =
    answer === 'both'
      ? `En el pulso ${point.beat} del compás ${point.measure} atacan las dos manos a la vez: la derecha toca ${rightPitchEs} y la izquierda ${leftPitchEs}. Un ataque simultáneo también es coordinación: las dos manos empiezan juntas y después cada una sigue su propia línea.`
      : answer === 'right'
        ? `En el pulso ${point.beat} del compás ${point.measure} ataca la mano derecha con ${rightPitchEs}. La izquierda no empieza ninguna nota en ese punto: o está sosteniendo una nota anterior o espera su próximo ataque.`
        : `En el pulso ${point.beat} del compás ${point.measure} ataca la mano izquierda con ${leftPitchEs}. La derecha no empieza ninguna nota en ese punto: mantené el pulso con la izquierda y dejá que la derecha espere su turno.`
  const explanationEn =
    answer === 'both'
      ? `On beat ${point.beat} of measure ${point.measure} both hands attack together: the right hand plays ${rightPitchEn} and the left hand plays ${leftPitchEn}. A simultaneous attack is also coordination: both hands start together and then each follows its own line.`
      : answer === 'right'
        ? `On beat ${point.beat} of measure ${point.measure} the right hand attacks with ${rightPitchEn}. The left hand does not start a note at that point: it is either holding an earlier note or waiting for its next attack.`
        : `On beat ${point.beat} of measure ${point.measure} the left hand attacks with ${leftPitchEn}. The right hand does not start a note at that point: keep the pulse with the left hand and let the right hand wait for its turn.`

  const exercise: IndependenceExercise = {
    id: params.id,
    skillId: params.skillId,
    type: 'hand-coordination',
    promptEs: `¿Qué mano ataca en el compás ${point.measure}, pulso ${point.beat}?`,
    promptEn: `Which hand attacks in measure ${point.measure}, beat ${point.beat}?`,
    explanationEs,
    explanationEn,
    difficulty: params.difficulty,
    score,
    measure: point.measure,
    beat: point.beat,
    choices,
    choicesEn,
  }

  const result = ExerciseSchema.safeParse(exercise)
  if (!result.success) {
    throw new Error(
      `El ejercicio de independencia generado no es válido: ${result.error.message}`,
    )
  }
  return exercise
}

function eventPitch(
  events: readonly NoteEvent[],
  hand: Hand,
  language: 'es' | 'en',
): string {
  const event = events.find((candidate) => candidate.hand === hand)
  const pitch = event?.pitches[0]
  if (pitch === undefined) {
    return hand === 'right' ? 'una nota aguda' : 'una nota grave'
  }
  return noteLabel(fromSpelledPitch(pitch), language)
}

export interface IndependenceExerciseBatch {
  skillId: string
  idPrefix: string
  count: number
  difficulty?: CoordinationDifficulty
  meters?: readonly CoordinationMeter[]
  patterns?: readonly CoordinationPatternKind[]
}

/**
 * Genera una tanda de ejercicios de independencia alternando patrones y
 * compases. La matriz de patrones es fija y validada; la aleatoriedad solo
 * elige variantes y alturas dentro de los registros seguros.
 */
export function generateIndependenceExercises(
  batch: IndependenceExerciseBatch,
): IndependenceExercise[] {
  if (!Number.isInteger(batch.count) || batch.count < 0) {
    throw new Error(`Cantidad inválida: ${batch.count}`)
  }
  const difficulty = batch.difficulty ?? 2
  if (!(COORDINATION_DIFFICULTIES as readonly number[]).includes(difficulty)) {
    throw new Error(`Dificultad de independencia inválida: ${difficulty}`)
  }
  const meters = batch.meters ?? COORDINATION_METERS
  const kinds = batch.patterns ?? COORDINATION_PATTERNS_BY_DIFFICULTY[difficulty]
  if (meters.length === 0 || kinds.length === 0) {
    throw new Error('La tanda de independencia necesita compases y patrones')
  }
  for (const kind of kinds) {
    if (!COORDINATION_PATTERNS_BY_DIFFICULTY[difficulty].includes(kind)) {
      throw new Error(
        `El patrón "${kind}" no está permitido en el nivel ${difficulty}`,
      )
    }
  }

  const exercises: IndependenceExercise[] = []
  for (let index = 0; index < batch.count; index += 1) {
    const kind = kinds[index % kinds.length]
    const meter = meters[Math.floor(index / kinds.length) % meters.length]
    if (kind === undefined || meter === undefined) continue
    const candidates = COORDINATION_PATTERNS.filter(
      (pattern) => pattern.kind === kind && pattern.meter === meter,
    )
    const pattern = candidates[Math.floor(Math.random() * candidates.length)]
    if (pattern === undefined) {
      throw new Error(`No hay patrón "${kind}" en compás ${meter}`)
    }
    exercises.push(
      generateIndependenceExercise({
        id: `${batch.idPrefix}-${String(index + 1).padStart(3, '0')}`,
        skillId: batch.skillId,
        difficulty,
        pattern,
      }),
    )
  }
  return exercises
}
