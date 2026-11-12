/**
 * F6-032 — Intento de tarea a partir de pulsaciones MIDI.
 *
 * Convierte las pulsaciones registradas del dispositivo (Yamaha PSR-373 y el
 * resto de MIDI compatible) en un intento evaluable: la secuencia esperada de
 * la tarea se compara con las pulsaciones en serie (orden) y se reporta acierto,
 * error, timing y uniformidad de velocity.
 */
import { evaluateMidiPerformance, type MidiFeedback } from './feedback'
import { RHYTHM_TOLERANCE_MS } from './tempo'
import { spelledPitchToMidi, scoreToTimeline } from '../content/score'
import type { KeyboardTask } from '../schemas'
import type { MidiNoteEvent } from './input'

/** Una pulsación esperada dentro del intento: nota MIDI y tiempo en milisegundos. */
export interface ExpectedStrike {
  /** Nota MIDI esperada (0-127). */
  note: number
  /** Tiempo esperado desde el inicio del intento, en milisegundos. */
  timeMs: number
}

/**
 * Construye la secuencia esperada de una tarea de teclado.
 *
 * Cuando la tarea incluye partitura de demostración se usa el timeline real
 * (compases y notas sostenidas con pedal); si no, una pulsación por tecla con un
 * pulso de separación.
 */
export function taskExpectedStrikes(
  task: KeyboardTask,
  tempoBpm?: number,
): ExpectedStrike[] {
  const tempo = tempoBpm ?? task.tempoBpm ?? 60
  const beatMs = 60_000 / tempo
  const strikes: ExpectedStrike[] = []

  if (task.demoScore !== undefined) {
    const timeline = scoreToTimeline(task.demoScore, task.tempoBpm)
    for (const event of timeline) {
      for (const midi of event.midis) {
        strikes.push({ note: midi, timeMs: event.time * 1000 })
      }
    }
    return strikes
  }

  const midis = task.keys.map((pitch) => spelledPitchToMidi(pitch))
  midis.forEach((note, index) => {
    strikes.push({ note, timeMs: index * beatMs })
  })
  return strikes
}

/**
 * Evalúa un intento contra la tarea activa.
 *
 * El alineador de notas esperadas/tocadas recorre la secuencia en serie: la
 * primera nota esperada se compara con la primera pulsación, la segunda con la
 * segunda, y así sucesivamente; una nota extra o faltante se reporta en orden.
 * La uniformidad se mide sobre el tempo estimado de las pulsaciones y sobre la
 * desviación contra la rejilla esperada con la tolerancia configurable.
 */
export function evaluateTaskAttempt(
  task: KeyboardTask,
  strikes: readonly MidiNoteEvent[],
  tempoBpm?: number,
): MidiFeedback {
  const expected = taskExpectedStrikes(task, tempoBpm)
  const expectedNotes = expected.map((strike) => strike.note)
  const expectedTimes = expected.map((strike) => strike.timeMs)
  // Web MIDI entrega timestamps absolutos (desde la carga de la página); la
  // rejilla esperada empieza en 0. Normalizamos respecto de la primera
  // pulsación del intento para que el ritmo se mida de verdad.
  const firstOnset = strikes.reduce<number | null>((earliest, event) => {
    if (event.velocity <= 0) return earliest
    return earliest === null ? event.timestamp : Math.min(earliest, event.timestamp)
  }, null)
  const normalized = strikes.map((event) =>
    firstOnset === null
      ? event
      : { ...event, timestamp: event.timestamp - firstOnset },
  )
  const feedback = evaluateMidiPerformance(expectedNotes, normalized, {
    expectedTimes,
    timingToleranceMs: RHYTHM_TOLERANCE_MS,
  })
  if (expectedNotes.length === 0) {
    return { ...feedback, accuracy: 0, tempo: null, rhythm: null }
  }
  return feedback
}
