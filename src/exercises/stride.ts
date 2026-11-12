import type { Score } from '../schemas'
import {
  formatPitch,
  formatPitchEs,
  fromSpelledPitch,
  midiOf,
} from '../theory'

/**
 * Stride.
 *
 * La mano izquierda alterna un bajo profundo en los pulsos fuertes con un
 * acorde en los pulsos débiles: bajo–acorde–bajo–acorde. La respuesta se
 * deduce de la partitura: el patrón del compás o la nota concreta del bajo.
 */
export const STRIDE_LABEL = { es: 'Stride', en: 'Stride' } as const

export const STRIDE_PATTERN_LABELS = {
  stride: {
    es: 'Bajo alternado y acorde',
    en: 'Alternating bass and chord',
  },
} as const

const BEAT_EPSILON = 1e-6

function eventAt(score: Score, measure: number, beat: number) {
  return score.events.find(
    (event) =>
      event.measure === measure && Math.abs(event.beat - beat) < BEAT_EPSILON,
  )
}

/**
 * Comprueba que el compás sea un stride de negras en 4/4.
 *
 * Debe tener cuatro negras: un bajo suelto en los pulsos 1 y 3, y un acorde de
 * al menos tres notas en los pulsos 2 y 4. El bajo tiene que quedar por debajo
 * del acorde para que el patrón no se confunda con un bloque de acordes.
 */
export function stridePatternInMeasure(score: Score, measure: number): boolean {
  if (
    score.timeSignature.numerator !== 4 ||
    score.timeSignature.denominator !== 4
  ) {
    return false
  }

  const events = score.events
    .filter((event) => event.measure === measure)
    .sort((a, b) => a.beat - b.beat)
  if (events.length !== 4) return false

  if (
    !events.every(
      (event, index) =>
        Math.abs(event.beat - index) < BEAT_EPSILON &&
        event.value.duration === 'quarter' &&
        event.value.dots === 0 &&
        event.value.tuplet === 'none' &&
        (index % 2 === 0
          ? event.pitches.length === 1
          : event.pitches.length >= 3),
    )
  ) {
    return false
  }

  const bassPitches = [events[0], events[2]].flatMap((event) =>
    event === undefined ? [] : event.pitches,
  )
  const chordPitches = [events[1], events[3]].flatMap((event) =>
    event === undefined ? [] : event.pitches,
  )
  if (bassPitches.length === 0 || chordPitches.length === 0) return false

  const highestBass = Math.max(
    ...bassPitches.map((pitch) => midiOf(fromSpelledPitch(pitch))),
  )
  const lowestChord = Math.min(
    ...chordPitches.map((pitch) => midiOf(fromSpelledPitch(pitch))),
  )
  return highestBass < lowestChord
}

/**
 * Nota del bajo en un pulso concreto, con octava y en el idioma pedido.
 *
 * Devuelve `null` si no hay una única nota en ese pulso.
 */
export function strideBassNoteAt(
  score: Score,
  measure: number,
  beat: number,
  language: 'es' | 'en' = 'es',
): string | null {
  const event = eventAt(score, measure, beat)
  if (!event || event.pitches.length !== 1) return null
  const pitch = fromSpelledPitch(event.pitches[0])
  return language === 'en'
    ? formatPitch(pitch)
    : `${formatPitchEs(pitch)}${pitch.octave}`
}

export function stridePatternCandidates(language: 'es' | 'en'): string[] {
  return [STRIDE_LABEL[language]]
}

export function strideBassNoteCandidates(note: string): string[] {
  return [note]
}
