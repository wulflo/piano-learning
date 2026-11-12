import type { Hand, Key, Score, SpelledPitch } from '../schemas'
import {
  accidentalToText,
  chordPitches,
  formatPitch,
  formatPitchEs,
  type Pitch,
} from '../theory'

/**
 * Arpegios mayores de una o dos octavas.
 *
 * La digitación de un arpegio depende de si la tónica cae en tecla blanca o
 * negra. En la mano derecha, las tónicas naturales usan 1-2-3-5 por octava y
 * las alteradas 2-1-2-4; la mano izquierda es el espejo (5-4-2-1 y 5-3-2-1).
 * Al agregar una octava se repite el grupo interior y se cierra con el meñique
 * de la derecha o el pulgar de la izquierda.
 */
export const ARPEGGIO_ASK_VALUES = ['fingering', 'notes'] as const
export type ArpeggioAsk = (typeof ARPEGGIO_ASK_VALUES)[number]

/** Tónicas de las doce tonalidades mayores básicas del curso. */
export const ARPEGGIO_TONICS = [
  'C',
  'G',
  'D',
  'A',
  'E',
  'B',
  'F',
  'Bb',
  'Eb',
  'Ab',
  'Db',
  'Gb',
] as const satisfies readonly Key[]

const FINGERINGS: Record<
  Hand,
  Record<'natural' | 'accidental', { start: readonly number[]; cycle: readonly number[]; end: readonly number[] }>
> = {
  right: {
    natural: { start: [], cycle: [1, 2, 3], end: [5] },
    accidental: { start: [2], cycle: [1, 2, 4], end: [] },
  },
  left: {
    natural: { start: [5], cycle: [4, 2, 1], end: [] },
    accidental: { start: [5], cycle: [3, 2, 1], end: [] },
  },
}

/** Una tónica con bemol o sostenido obliga a la digitación de teclas negras. */
export function arpeggioHasBlackTonic(tonic: Key): boolean {
  return tonic.includes('b') || tonic.includes('#')
}

/**
 * Dedos que tocan cada nota del arpegio, de grave a agudo.
 *
 * El largo del resultado es `3 * octaves + 1`: fundamental, tercera y quinta de
 * cada octava más la tónica final.
 */
export function arpeggioFingering(
  tonic: Key,
  hand: Hand = 'right',
  octaves = 1,
): number[] {
  const pattern = arpeggioHasBlackTonic(tonic)
    ? FINGERINGS[hand].accidental
    : FINGERINGS[hand].natural
  const result = [...pattern.start]
  for (let octave = 0; octave < octaves; octave += 1) {
    result.push(...pattern.cycle)
  }
  result.push(...pattern.end)
  return result
}

/** Digitación legible, por ejemplo `1-2-3-5`. */
export function arpeggioFingeringLabel(
  tonic: Key,
  hand: Hand = 'right',
  octaves = 1,
): string {
  return arpeggioFingering(tonic, hand, octaves).join('-')
}

/**
 * Alturas del arpegio mayor, de grave a agudo.
 *
 * La mano derecha empieza en la octava 4 y la izquierda en la 3, de modo que
 * el arpegio quede dentro del pentagrama de clave de sol sin cruzar las manos.
 */
export function arpeggioPitches(
  tonic: Key,
  hand: Hand = 'right',
  octaves = 1,
): Pitch[] {
  const baseOctave = hand === 'left' ? 3 : 4
  const triad = chordPitches(`${tonic}${baseOctave}`, 'major')
  const pitches: Pitch[] = []
  for (let octave = 0; octave < octaves; octave += 1) {
    for (const pitch of triad) {
      pitches.push({ ...pitch, octave: pitch.octave + octave })
    }
  }
  const root = triad[0]
  if (root !== undefined) {
    pitches.push({ ...root, octave: root.octave + octaves })
  }
  return pitches
}

/** Nombres de las notas del arpegio, con octava, en el idioma pedido. */
export function arpeggioNoteNames(
  tonic: Key,
  hand: Hand = 'right',
  octaves = 1,
  language: 'es' | 'en' = 'es',
): string {
  const pitches = arpeggioPitches(tonic, hand, octaves)
  if (language === 'en') return pitches.map(formatPitch).join(' ')
  return pitches
    .map((pitch) => `${formatPitchEs(pitch)}${pitch.octave}`)
    .join(' ')
}

/** Partitura del arpegio para el pentagrama y el audio del ejercicio. */
export function arpeggioScore(
  tonic: Key,
  hand: Hand = 'right',
  octaves = 1,
  tempoBpm = 72,
): Score {
  const pitches = arpeggioPitches(tonic, hand, octaves)
  return {
    clef: 'treble',
    key: tonic,
    mode: 'major',
    timeSignature: { numerator: 4, denominator: 4 },
    tempoBpm,
    events: pitches.map((pitch, index) => ({
      id: `arpeggio.${tonic}.${hand}.${octaves}.${index + 1}`,
      measure: Math.floor(index / 4) + 1,
      beat: index % 4,
      value: { duration: 'quarter', dots: 0, tuplet: 'none' },
      pitches: [
        {
          step: pitch.step,
          accidental: accidentalToText(pitch.accidental) as SpelledPitch['accidental'],
          octave: pitch.octave,
        },
      ],
      hand,
      voice: 1,
      velocity: 78,
      tieToNext: false,
    })),
    pedals: [],
  }
}
