/**
 * Rango visible del teclado para un conjunto de notas.
 *
 * Empieza en la octava de la nota más grave y cubre hasta la más aguda, con un
 * mínimo de una octava y un máximo de siete. Se usa en las secciones de lección
 * y en la tarea de teclado para que ambas muestren el mismo encuadre.
 */

export interface KeyboardRange {
  startMidi: number
  octaves: number
}

export function keyboardRange(midis: readonly number[]): KeyboardRange {
  if (midis.length === 0) return { startMidi: 48, octaves: 3 }

  const min = Math.min(...midis)
  const max = Math.max(...midis)
  const startMidi = Math.max(12, Math.min(96, Math.floor(min / 12) * 12))
  const octaves = Math.min(7, Math.max(1, Math.ceil((max - startMidi + 1) / 12)))
  return { startMidi, octaves }
}
