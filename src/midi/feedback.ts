/**
 * Feedback objetivo a partir de eventos MIDI.
 *
 * Compara las notas esperadas con las tocadas usando un alineamiento tipo
 * Needleman-Wunsch: así una nota de más no desplaza toda la comparación.
 * Además del acierto por nota se reportan tempo, desviaciones rítmicas y
 * uniformidad de ataque (velocity). Sin MIDI la app sigue usando la
 * autoevaluación manual: este módulo no se invoca.
 */
import type { MidiNoteEvent } from './input'
import {
  estimateTempo,
  evaluateRhythm,
  RHYTHM_TOLERANCE_MS,
  type RhythmReport,
  type TempoEstimate,
} from './tempo'

export type NoteStatus = 'ok' | 'wrong' | 'missing' | 'extra'

export interface NoteComparison {
  /** Nota MIDI esperada; `null` en una nota extra. */
  expected: number | null
  /** Nota MIDI tocada; `null` en una nota faltante. */
  played: number | null
  status: NoteStatus
}

export interface MidiFeedbackOptions {
  /** Tiempo esperado de cada nota, en ms, para evaluar el ritmo. */
  expectedTimes?: number[]
  /** Tolerancia rítmica en ms. */
  timingToleranceMs?: number
  /** Tolerancia de velocity para considerar el ataque uniforme (0-127). */
  velocityTolerance?: number
}

export interface MidiFeedback {
  notes: NoteComparison[]
  /** Notas esperadas acertadas. */
  matched: number
  wrong: number
  missing: number
  extra: number
  /** Aciertos sobre el máximo entre notas esperadas y tocadas (0-1). */
  accuracy: number
  tempo: TempoEstimate | null
  rhythm: RhythmReport | null
  /** Desviación estándar de las velocities (0 si no hay notas). */
  velocitySpread: number
  /** Si todas las notas se atacaron con una intensidad parecida. */
  even: boolean
}

function noteOns(events: MidiNoteEvent[]): MidiNoteEvent[] {
  return events.filter((event) => event.velocity > 0)
}

/**
 * Alinea las notas esperadas con las tocadas.
 *
 * Coste: coincidencia 0, sustitución 1, hueco 1. Con ese coste una nota
 * equivocada se marca como `wrong`, una nota de más como `extra` y una que
 * falta como `missing`.
 */
export function alignNotes(
  expected: number[],
  played: number[],
): NoteComparison[] {
  const rows = expected.length
  const cols = played.length
  const cost: number[][] = Array.from({ length: rows + 1 }, () =>
    Array<number>(cols + 1).fill(0),
  )

  for (let row = 0; row <= rows; row += 1) cost[row][0] = row
  for (let col = 0; col <= cols; col += 1) cost[0][col] = col

  for (let row = 1; row <= rows; row += 1) {
    for (let col = 1; col <= cols; col += 1) {
      const same = expected[row - 1] === played[col - 1]
      const diagonal = cost[row - 1][col - 1] + (same ? 0 : 1)
      const up = cost[row - 1][col] + 1
      const left = cost[row][col - 1] + 1
      cost[row][col] = Math.min(diagonal, up, left)
    }
  }

  const result: NoteComparison[] = []
  let row = rows
  let col = cols
  while (row > 0 || col > 0) {
    if (
      row > 0 &&
      col > 0 &&
      cost[row][col] ===
        cost[row - 1][col - 1] +
          (expected[row - 1] === played[col - 1] ? 0 : 1)
    ) {
      const expectedNote = expected[row - 1]
      const playedNote = played[col - 1]
      result.push({
        expected: expectedNote,
        played: playedNote,
        status: expectedNote === playedNote ? 'ok' : 'wrong',
      })
      row -= 1
      col -= 1
    } else if (row > 0 && cost[row][col] === cost[row - 1][col] + 1) {
      result.push({ expected: expected[row - 1], played: null, status: 'missing' })
      row -= 1
    } else {
      result.push({ expected: null, played: played[col - 1], status: 'extra' })
      col -= 1
    }
  }

  return result.reverse()
}

export function evaluateMidiPerformance(
  expected: number[],
  events: MidiNoteEvent[],
  options: MidiFeedbackOptions = {},
): MidiFeedback {
  const ons = noteOns(events)
  const played = ons.map((event) => event.note)
  const notes = alignNotes(expected, played)

  const matched = notes.filter((note) => note.status === 'ok').length
  const wrong = notes.filter((note) => note.status === 'wrong').length
  const missing = notes.filter((note) => note.status === 'missing').length
  const extra = notes.filter((note) => note.status === 'extra').length
  // El denominador incluye las notas de más: pulsar toda la secuencia correcta
  // con errores intercalados no puede dar 100 %. Si solo se divide por las
  // esperadas, una nota equivocada de más queda invisible en el porcentaje.
  const compared = Math.max(expected.length, played.length)
  const accuracy = compared === 0 ? 0 : matched / compared

  const onsets = ons.map((event) => event.timestamp)
  const tempo = estimateTempo(onsets)

  const rhythm =
    options.expectedTimes && options.expectedTimes.length > 0
      ? evaluateRhythm(
          onsets,
          options.expectedTimes,
          options.timingToleranceMs ?? RHYTHM_TOLERANCE_MS,
        )
      : null

  const velocities = ons.map((event) => event.velocity)
  const meanVelocity =
    velocities.length === 0
      ? 0
      : velocities.reduce((sum, value) => sum + value, 0) / velocities.length
  const variance =
    velocities.length === 0
      ? 0
      : velocities.reduce(
          (sum, value) => sum + (value - meanVelocity) ** 2,
          0,
        ) / velocities.length
  const velocitySpread = Math.sqrt(variance)
  const even =
    velocities.length > 0 &&
    velocitySpread <= (options.velocityTolerance ?? 16)

  return {
    notes,
    matched,
    wrong,
    missing,
    extra,
    accuracy,
    tempo,
    rhythm,
    velocitySpread,
    even,
  }
}
