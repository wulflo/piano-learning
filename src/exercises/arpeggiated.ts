import type { Score } from '../schemas'
import { formatPitch, formatPitchEs, fromSpelledPitch } from '../theory'

/**
 * Acompañamiento arpegiado de 3 y 4 notas.
 *
 * La mano izquierda repite una célula sobre el acorde: `1-5-3` en compás de
 * tres tiempos y `1-5-3-5` en compás de cuatro. La respuesta se deduce de la
 * partitura (número de notas y orden de los eventos) para que el contenido no
 * duplique datos que la propia música ya tiene.
 */
export const ARPEGGIATED_PATTERN_VALUES = [
  'three-note',
  'four-note',
] as const
export type ArpeggiatedPattern =
  (typeof ARPEGGIATED_PATTERN_VALUES)[number]

export const ARPEGGIATED_PATTERN_LABELS: Record<
  ArpeggiatedPattern,
  { es: string; en: string }
> = {
  'three-note': { es: 'Patrón de 3 notas', en: '3-note pattern' },
  'four-note': { es: 'Patrón de 4 notas', en: '4-note pattern' },
}

const NOTE_COUNT_BY_PATTERN: Record<ArpeggiatedPattern, number> = {
  'three-note': 3,
  'four-note': 4,
}

/**
 * Patrón del compás según sus notas de acompañamiento.
 *
 * Exige notas sueltas en negras, una por pulso desde el primero, y que la
 * cantidad coincida con el numerador del compás: 3 en 3/4 y 4 en 4/4. Así un
 * compás con acordes en bloque o con una melodía no se confunde con el patrón.
 */
export function arpeggiatedPatternInMeasure(
  score: Score,
  measure: number,
): ArpeggiatedPattern | null {
  const events = score.events.filter((event) => event.measure === measure)
  if (events.length === 0) return null

  const quarters = events.every(
    (event) =>
      event.pitches.length === 1 &&
      event.value.duration === 'quarter' &&
      event.value.dots === 0 &&
      event.value.tuplet === 'none',
  )
  if (!quarters) return null

  const beats = events.map((event) => event.beat).sort((a, b) => a - b)
  if (!beats.every((beat, index) => beat === index)) return null

  const numerator = score.timeSignature.numerator
  if (numerator !== events.length) return null

  if (events.length === NOTE_COUNT_BY_PATTERN['three-note']) return 'three-note'
  if (events.length === NOTE_COUNT_BY_PATTERN['four-note']) return 'four-note'
  return null
}

/**
 * Notas de la célula del patrón, en orden de ataque y con octava.
 *
 * Se limita a las primeras cuatro notas para que el patrón de Alberti, que
 * repite la célula dos veces por compás, devuelva solo el orden que se repite.
 */
export function arpeggiatedNoteNames(
  score: Score,
  measure: number,
  language: 'es' | 'en' = 'es',
  limit = 4,
): string {
  return score.events
    .filter((event) => event.measure === measure)
    .sort((a, b) => a.beat - b.beat)
    .slice(0, limit)
    .map((event) => {
      const pitch = event.pitches[0]
      if (pitch === undefined) return ''
      const parsed = fromSpelledPitch(pitch)
      return language === 'en'
        ? formatPitch(parsed)
        : `${formatPitchEs(parsed)}${parsed.octave}`
    })
    .join(' ')
}

export function arpeggiatedPatternCandidates(
  pattern: ArpeggiatedPattern,
  language: 'es' | 'en',
): string[] {
  return [ARPEGGIATED_PATTERN_LABELS[pattern][language]]
}
