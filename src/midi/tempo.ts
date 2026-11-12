/**
 * Estimación de tempo y evaluación rítmica a partir de eventos MIDI.
 *
 * Los timestamps de Web MIDI llegan en milisegundos. Para estimar el tempo
 * usamos los intervalos entre ataques (inter-onset intervals, IOI): el pulso
 * humano no es perfecto, así que tomamos la mediana y medimos la dispersión
 * para dar una confianza. La evaluación rítmica compara cada ataque con la
 * rejilla esperada y clasifica la desviación con una tolerancia configurable.
 */
import type { MidiNoteEvent } from './input'

export interface TempoEstimate {
  /** Pulsos por minuto estimados. */
  bpm: number
  /** 0-1: cuánto se parecen los intervalos entre sí. */
  confidence: number
  /** Intervalo mediano entre ataques, en milisegundos. */
  medianIntervalMs: number
}

export interface TempoOptions {
  /** BPM mínimo aceptado; por debajo se descarta la estimación. */
  minBpm?: number
  /** BPM máximo aceptado; por encima se descarta la estimación. */
  maxBpm?: number
}

const DEFAULT_MIN_BPM = 30
const DEFAULT_MAX_BPM = 300

/**
 * Extrae los ataques (note on con velocity > 0) ordenados por tiempo.
 */
export function noteOnsets(events: MidiNoteEvent[]): number[] {
  return events
    .filter((event) => event.velocity > 0)
    .map((event) => event.timestamp)
    .sort((a, b) => a - b)
}

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle]
}

/**
 * Estima el tempo a partir de los intervalos entre ataques.
 *
 * Devuelve `null` con menos de dos ataques o cuando el resultado cae fuera
 * del rango configurado. La confianza baja cuando los intervalos son muy
 * irregulares (rubato, notas extra, silencios).
 */
export function estimateTempo(
  onsets: number[],
  options: TempoOptions = {},
): TempoEstimate | null {
  const minBpm = options.minBpm ?? DEFAULT_MIN_BPM
  const maxBpm = options.maxBpm ?? DEFAULT_MAX_BPM
  if (onsets.length < 2) return null

  const sorted = [...onsets].sort((a, b) => a - b)
  const intervals: number[] = []
  for (let index = 1; index < sorted.length; index += 1) {
    const interval = sorted[index] - sorted[index - 1]
    if (interval > 0) intervals.push(interval)
  }
  if (intervals.length === 0) return null

  const medianIntervalMs = median(intervals)
  if (medianIntervalMs <= 0) return null

  const bpm = 60_000 / medianIntervalMs
  if (bpm < minBpm || bpm > maxBpm) return null

  const mean =
    intervals.reduce((sum, value) => sum + value, 0) / intervals.length
  const variance =
    intervals.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
    intervals.length
  const variation = Math.sqrt(variance) / mean
  const confidence = Math.max(0, Math.min(1, 1 - variation))

  return { bpm, confidence, medianIntervalMs }
}

export const RHYTHM_TOLERANCE_MS = 80

export interface RhythmDeviation {
  index: number
  /** Milisegundos de adelanto (negativo) o atraso (positivo). */
  deviationMs: number
  status: 'early' | 'late' | 'ok'
}

export interface RhythmReport {
  deviations: RhythmDeviation[]
  /** Desviación media en valor absoluto. */
  meanAbsDeviationMs: number
  /** Fracción de ataques dentro de la tolerancia (0-1). */
  accuracy: number
  /** Si la mayoría de los ataques cae dentro de la tolerancia. */
  steady: boolean
}

/**
 * Compara los ataques con una rejilla de tiempos esperados.
 *
 * `expectedTimes` está en milisegundos y debe tener el mismo largo que
 * `onsets`; si faltan o sobran ataques se comparan los que coincidan por
 * índice y el resto se ignora. La uniformidad se mide sobre los ataques
 * evaluados.
 */
export function evaluateRhythm(
  onsets: number[],
  expectedTimes: number[],
  toleranceMs: number = RHYTHM_TOLERANCE_MS,
): RhythmReport {
  const count = Math.min(onsets.length, expectedTimes.length)
  const deviations: RhythmDeviation[] = []

  for (let index = 0; index < count; index += 1) {
    const deviationMs = onsets[index] - expectedTimes[index]
    const status: RhythmDeviation['status'] =
      deviationMs < -toleranceMs
        ? 'early'
        : deviationMs > toleranceMs
          ? 'late'
          : 'ok'
    deviations.push({ index, deviationMs, status })
  }

  if (deviations.length === 0) {
    return {
      deviations,
      meanAbsDeviationMs: 0,
      accuracy: 0,
      steady: false,
    }
  }

  const meanAbsDeviationMs =
    deviations.reduce((sum, item) => sum + Math.abs(item.deviationMs), 0) /
    deviations.length
  const within = deviations.filter((item) => item.status === 'ok').length
  const accuracy = within / deviations.length

  return {
    deviations,
    meanAbsDeviationMs,
    accuracy,
    steady: accuracy >= 0.8,
  }
}

/**
 * Construye la rejilla esperada a partir de un tempo y una lista de pulsos.
 *
 * Cada entrada de `beats` es la posición en pulsos (0 = primer ataque) donde
 * debería sonar la nota. Sirve tanto para escalas (un pulso por nota) como
 * para piezas con duraciones distintas.
 */
export function beatGrid(
  beats: number[],
  bpm: number,
  startMs = 0,
): number[] {
  const msPerBeat = 60_000 / bpm
  return beats.map((beat) => startMs + beat * msPerBeat)
}
