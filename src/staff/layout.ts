import type { StaffDuration } from './vex'

/**
 * Cálculo del espacio vertical que necesita un pentagrama.
 *
 * VexFlow dibuja las notas fuera del pentagrama con líneas adicionales y las
 * deja fuera del `viewBox` si la altura no alcanza. Este módulo mide las notas
 * antes de dibujarlas para reservar el espacio necesario y evitar que se
 * recorten por arriba o por abajo.
 */

export interface VerticalNoteInput {
  keys: string[]
  duration: StaffDuration
  /** El cifrado se dibuja encima de la nota y necesita espacio extra. */
  chordSymbol?: boolean
  /** La marca de pedal se dibuja debajo de la nota. */
  pedal?: boolean
}

export interface VerticalExtent {
  /** Distancia desde el borde superior del `Stave` hasta el contenido más alto. */
  top: number
  /** Distancia desde el borde superior del `Stave` hasta el contenido más bajo. */
  bottom: number
}

type VexFlow = typeof import('vexflow')

const LINE_SPACING = 10
/** Y de la línea de referencia (Do central en clave de sol) dentro del `Stave`. */
const NOTE_BASE = 90
const STEM_PADDING = 42
const NOTE_PADDING = 18
const CHORD_SYMBOL_PADDING = 34
const PEDAL_PADDING = 24
const STAFF_TOP_LINE = 40
const STAFF_BOTTOM_LINE = 80

/**
 * Mide la extensión vertical de un conjunto de notas.
 *
 * `top` y `bottom` son relativos a la `y` del `Stave`: la línea superior del
 * pentagrama queda en 40 y la inferior en 80. Un valor negativo en `top`
 * significa que la nota sobresale por encima del margen habitual.
 */
export function verticalExtent(
  VF: VexFlow,
  notes: readonly VerticalNoteInput[],
  clef: 'treble' | 'bass',
): VerticalExtent {
  let top = STAFF_TOP_LINE
  let bottom = STAFF_BOTTOM_LINE

  for (const input of notes) {
    if (input.keys.length === 0) continue
    const note = new VF.StaveNote({
      keys: input.keys,
      duration: input.duration,
      clef,
    })
    const lowestLine = note.getLineNumber(false)
    const highestLine = note.getLineNumber(true)
    const highestY = NOTE_BASE - highestLine * LINE_SPACING
    const lowestY = NOTE_BASE - lowestLine * LINE_SPACING

    top = Math.min(
      top,
      highestY - STEM_PADDING - (input.chordSymbol ? CHORD_SYMBOL_PADDING : 0),
    )
    bottom = Math.max(
      bottom,
      lowestY + NOTE_PADDING + (input.pedal ? PEDAL_PADDING : 0),
    )
  }

  return { top, bottom }
}
