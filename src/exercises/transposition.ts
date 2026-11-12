import type { Key, Score, SpelledPitch } from '../schemas'
import { midiOf, fromSpelledPitch, toSpelledPitch } from '../theory'

/**
 * Utilidades de presentación para los ejercicios de transposición.
 *
 * El generador describe la melodía como una lista de notas; para mostrarla en
 * el pentagrama hace falta convertirla en una partitura de negras. La
 * conversión es pura y no decide la corrección: la respuesta sigue viviendo en
 * el campo `answer` del ejercicio.
 */

export interface MelodyScoreOptions {
  /** Clave con la que se dibuja la melodía; si falta se elige por registro. */
  clef?: 'treble' | 'bass'
  /** Tempo de la partitura, en BPM. */
  tempoBpm?: number
  /** Identificador único de los eventos. */
  idPrefix?: string
}

function clefByRegister(melody: readonly SpelledPitch[]): 'treble' | 'bass' {
  if (melody.length === 0) return 'treble'
  const average =
    melody.reduce((sum, pitch) => sum + midiOf(fromSpelledPitch(pitch)), 0) /
    melody.length
  return average < 58 ? 'bass' : 'treble'
}

/**
 * Convierte una melodía de notas escritas en una partitura de negras en 4/4.
 * Los compases se completan de a cuatro pulsos y la mano se elige según la
 * clave para que el ejemplo se reproduzca con el registro correcto.
 */
export function melodyToScore(
  melody: readonly SpelledPitch[],
  key: Key,
  options: MelodyScoreOptions = {},
): Score {
  if (melody.length === 0) {
    throw new Error('La melodía necesita al menos una nota')
  }
  const clef = options.clef ?? clefByRegister(melody)
  const idPrefix = options.idPrefix ?? 'transposition'
  return {
    clef,
    key,
    mode: 'major',
    timeSignature: { numerator: 4, denominator: 4 },
    tempoBpm: options.tempoBpm ?? 60,
    events: melody.map((pitch, index) => ({
      id: `${idPrefix}.${index + 1}`,
      measure: Math.floor(index / 4) + 1,
      beat: index % 4,
      value: { duration: 'quarter', dots: 0, tuplet: 'none' },
      pitches: [toSpelledPitch(fromSpelledPitch(pitch))],
      hand: clef === 'bass' ? 'left' : 'right',
      voice: 1,
      velocity: 72,
      tieToNext: false,
    })),
    pedals: [],
  }
}
