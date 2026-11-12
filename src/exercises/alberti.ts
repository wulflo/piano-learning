import type { Score, SpelledPitch } from '../schemas'
import { arpeggiatedNoteNames } from './arpeggiated'

/**
 * Bajo de Alberti.
 *
 * El patrón clásico es `1-5-3-5` en corcheas: bajo, quinta, tercera y quinta,
 * repetido dos veces por compás de 4/4. La célula de cuatro notas es la que se
 * reconoce y se pregunta; las variantes cambian el orden o el número de notas,
 * pero conservan el vaivén del acompañamiento.
 */
export const ALBERTI_LABEL = { es: 'Alberti', en: 'Alberti' } as const

function samePitch(a: SpelledPitch, b: SpelledPitch): boolean {
  return (
    a.step === b.step &&
    a.accidental === b.accidental &&
    a.octave === b.octave
  )
}

/**
 * Comprueba que el compás sea un Alberti de corcheas en 4/4.
 *
 * Debe tener ocho notas sueltas, una cada medio pulso, y repetir exactamente
 * la misma célula de cuatro notas en la segunda mitad del compás. Así no se
 * confunde con un arpegio libre ni con un compás de acordes.
 */
export function albertiPatternInMeasure(score: Score, measure: number): boolean {
  const events = score.events.filter((event) => event.measure === measure)
  if (events.length !== 8) return false
  if (
    score.timeSignature.numerator !== 4 ||
    score.timeSignature.denominator !== 4
  ) {
    return false
  }

  const eighths = events.every(
    (event) =>
      event.pitches.length === 1 &&
      event.value.duration === 'eighth' &&
      event.value.dots === 0 &&
      event.value.tuplet === 'none',
  )
  if (!eighths) return false

  const ordered = [...events].sort((a, b) => a.beat - b.beat)
  if (
    !ordered.every(
      (event, index) => Math.abs(event.beat - index * 0.5) < 1e-6,
    )
  ) {
    return false
  }

  const cell = ordered.slice(0, 4).map((event) => event.pitches[0])
  if (cell.some((pitch) => pitch === undefined)) return false
  return ordered.every((event, index) => {
    const reference = cell[index % 4]
    const pitch = event.pitches[0]
    if (reference === undefined || pitch === undefined) return false
    return samePitch(pitch, reference)
  })
}

/** Nombre de la célula del Alberti, con octava, en el idioma pedido. */
export function albertiNoteNames(
  score: Score,
  measure: number,
  language: 'es' | 'en' = 'es',
): string {
  return arpeggiatedNoteNames(score, measure, language, 4)
}

export function albertiPatternCandidates(language: 'es' | 'en'): string[] {
  return [ALBERTI_LABEL[language]]
}
