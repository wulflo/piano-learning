import { accidentalToText, type Pitch } from '../theory/pitch'

/** Convierte una altura interna a la clave que entiende VexFlow (`c#/4`). */
export function pitchToVexKey(pitch: Pitch): string {
  return `${pitch.step.toLowerCase()}${accidentalToText(pitch.accidental)}/${pitch.octave}`
}

/** VexFlow usa `#`, `b`, `n`, `##` y `bb` como códigos de alteración. */
export function vexAccidental(accidental: number): string {
  if (accidental === 0) return 'n'
  return accidentalToText(accidental)
}

export const STAFF_DURATIONS = ['w', 'h', 'q', '8', '16', '32'] as const
export type StaffDuration = (typeof STAFF_DURATIONS)[number]
