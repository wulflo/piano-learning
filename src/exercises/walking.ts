import type { Score } from '../schemas'
import {
  chordPitches,
  formatPitch,
  formatPitchEs,
  fromSpelledPitch,
  parseChordSymbol,
  pitchClass,
} from '../theory'
import { chordSymbolInMeasure } from './accompaniment'

/**
 * Walking bass.
 *
 * La mano izquierda camina en negras, una nota por pulso, uniendo las notas
 * del acorde con notas de paso. La respuesta se deduce de la partitura y del
 * cifrado del compás: el ejercicio puede preguntar qué nota suena en un pulso
 * o si esa nota pertenece al acorde o es una nota de paso.
 */
export const WALKING_ROLE_VALUES = ['chord-tone', 'passing-tone'] as const
export type WalkingRole = (typeof WALKING_ROLE_VALUES)[number]

export const WALKING_ROLE_LABELS: Record<
  WalkingRole,
  { es: string; en: string }
> = {
  'chord-tone': { es: 'Nota del acorde', en: 'Chord tone' },
  'passing-tone': { es: 'Nota de paso', en: 'Passing tone' },
}

const BEAT_EPSILON = 1e-6

function eventAt(score: Score, measure: number, beat: number) {
  return score.events.find(
    (event) =>
      event.measure === measure && Math.abs(event.beat - beat) < BEAT_EPSILON,
  )
}

/**
 * Nota del bajo en un pulso concreto, con octava y en el idioma pedido.
 *
 * Devuelve `null` si no hay una única nota en ese pulso; así la validación de
 * contenido detecta compases incompletos o acordes en bloque.
 */
export function walkingNoteAt(
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

/**
 * Papel de la nota del pulso: nota del acorde o nota de paso.
 *
 * Usa el cifrado del compás para conocer las notas del acorde. Una nota que no
 * pertenece a ese acorde se considera nota de paso, aunque sea cromática o
 * diatónica. Sin cifrado no se puede decidir y devuelve `null`.
 */
export function walkingRoleAt(
  score: Score,
  measure: number,
  beat: number,
): WalkingRole | null {
  const event = eventAt(score, measure, beat)
  if (!event || event.pitches.length !== 1) return null
  const symbol = chordSymbolInMeasure(score, measure)
  if (symbol === null) return null

  const chord = parseChordSymbol(symbol)
  const pitch = fromSpelledPitch(event.pitches[0])
  const chordTones = new Set(
    chordPitches(chord.root, chord.quality).map((tone) => pitchClass(tone)),
  )
  if (chord.slash) chordTones.add(pitchClass(chord.slash))
  return chordTones.has(pitchClass(pitch)) ? 'chord-tone' : 'passing-tone'
}

export function walkingNoteCandidates(note: string): string[] {
  return [note]
}

export function walkingRoleCandidates(
  role: WalkingRole,
  language: 'es' | 'en',
): string[] {
  return [WALKING_ROLE_LABELS[role][language]]
}
