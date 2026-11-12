import type { Score } from '../schemas'

/**
 * Ayudas para los ejercicios de pedal.
 *
 * El pedal de resonancia no cambia las notas: cambia cuánto duran y cómo se
 * mezclan. Estas funciones leen las marcas de la partitura para saber qué
 * acción pide un punto concreto y si el patrón es directo o sincopado.
 */

export const PEDAL_ACTION_VALUES = ['press', 'release', 'change'] as const
export type PedalActionAnswer = (typeof PEDAL_ACTION_VALUES)[number]

export const PEDAL_ACTION_LABELS: Record<
  PedalActionAnswer,
  { es: string; en: string }
> = {
  press: { es: 'Pisar el pedal', en: 'Press the pedal' },
  release: { es: 'Levantar el pedal', en: 'Release the pedal' },
  change: { es: 'Cambiar el pedal', en: 'Change the pedal' },
}

export const PEDAL_PATTERN_VALUES = ['direct', 'syncopated'] as const
export type PedalPattern = (typeof PEDAL_PATTERN_VALUES)[number]

export const PEDAL_PATTERN_LABELS: Record<
  PedalPattern,
  { es: string; en: string }
> = {
  direct: { es: 'Pedal directo', en: 'Direct pedal' },
  syncopated: { es: 'Pedal sincopado', en: 'Syncopated pedal' },
}

const EPSILON = 1e-6

function beatsPerMeasure(score: Score): number {
  return score.timeSignature.numerator * (4 / score.timeSignature.denominator)
}

function markBeat(score: Score, mark: Score['pedals'][number]): number {
  return (mark.measure - 1) * beatsPerMeasure(score) + mark.beat
}

/**
 * Acción del pedal en un compás y pulso (1-based el compás y el pulso como se
 * leen en la partitura, es decir, el pulso 1 es el inicio del compás).
 */
export function pedalActionAt(
  score: Score,
  measure: number,
  beat: number,
): PedalActionAnswer | null {
  const target = (measure - 1) * beatsPerMeasure(score) + (beat - 1)
  const marks = score.pedals.filter(
    (mark) => Math.abs(markBeat(score, mark) - target) < EPSILON,
  )
  if (marks.length === 0) return null
  const hasPress = marks.some((mark) => mark.action === 'press')
  const hasRelease = marks.some((mark) => mark.action === 'release')
  if (hasPress && hasRelease) return 'change'
  return hasPress ? 'press' : 'release'
}

/**
 * Patrón de pedal dentro de un compás.
 *
 * Es directo cuando la pisada coincide con un ataque y sincopado cuando llega
 * justo después, sobre el contratiempo. Devuelve `null` si el compás no tiene
 * ninguna pisada.
 */
export function pedalPatternInMeasure(
  score: Score,
  measure: number,
): PedalPattern | null {
  const start = (measure - 1) * beatsPerMeasure(score)
  const end = start + beatsPerMeasure(score)
  const presses = score.pedals
    .filter((mark) => mark.action === 'press')
    .map((mark) => markBeat(score, mark))
    .filter((beat) => beat >= start - EPSILON && beat < end - EPSILON)
  if (presses.length === 0) return null

  const attacks = score.events
    .filter((event) => event.measure === measure)
    .map((event) => start + event.beat)
  const first = presses[0]!
  const onAttack = attacks.some((attack) => Math.abs(attack - first) < EPSILON)
  return onAttack ? 'direct' : 'syncopated'
}

export function pedalActionCandidates(
  action: PedalActionAnswer,
  language: 'es' | 'en',
): string[] {
  return [PEDAL_ACTION_LABELS[action][language]]
}

export function pedalPatternCandidates(
  pattern: PedalPattern,
  language: 'es' | 'en',
): string[] {
  return [PEDAL_PATTERN_LABELS[pattern][language]]
}
