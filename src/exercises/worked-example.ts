import type { Exercise } from '../schemas'
import { spelledPitchToPitch } from '../content/score'
import type { StaffMeasure } from '../staff/render'
import {
  chordPitches,
  chordWithInversion,
  chordWithSlash,
  midiOf,
  parseChordSymbol,
  type Pitch,
} from '../theory'

/**
 * Ejemplo resuelto del mismo ítem que falló.
 *
 * Las reglas «Recordá» explican el concepto, pero un ejemplo genérico no
 * muestra las notas que el alumno acaba de ver u oír. Este módulo convierte el
 * ejercicio fallado en un pentagrama breve: el par de notas de un intervalo o
 * el voicing de un acorde, con la misma ortografía y la misma inversión. Es
 * puro y no toca React, audio ni la base de datos.
 */

export type WorkedExampleKind = 'interval' | 'chord'

export interface WorkedExample {
  kind: WorkedExampleKind
  /** Notas que se dibujan, en orden de lectura. */
  measures: StaffMeasure[]
  clef: 'treble' | 'bass'
  keySignature: string
}

/** Clave adecuada para el registro de las notas. */
function clefFor(pitches: readonly Pitch[]): 'treble' | 'bass' {
  if (pitches.length === 0) return 'treble'
  const lowest = Math.min(...pitches.map(midiOf))
  return lowest < 60 ? 'bass' : 'treble'
}

/** Una medida por nota, en el orden en que suena el intervalo. */
function melodicMeasures(
  pitches: readonly Pitch[],
  id: string,
): StaffMeasure[] {
  return pitches.map((pitch, index) => ({
    id: `${id}.example.${index + 1}`,
    pitches: [pitch],
    duration: 'q',
  }))
}

/** Una sola medida con todas las notas del acorde. */
function chordMeasures(
  pitches: readonly Pitch[],
  id: string,
): StaffMeasure[] {
  return [
    {
      id: `${id}.example`,
      pitches: [...pitches],
      duration: 'q',
    },
  ]
}

function intervalExample(
  exercise: Extract<Exercise, { type: 'interval' | 'ear-interval' }>,
): WorkedExample {
  const first = spelledPitchToPitch(exercise.lower)
  const second = spelledPitchToPitch(exercise.upper)
  const pitches = [first, second]
  const measures =
    exercise.direction === 'harmonic'
      ? chordMeasures(pitches, exercise.id)
      : melodicMeasures(pitches, exercise.id)
  return {
    kind: 'interval',
    measures,
    clef: clefFor(pitches),
    keySignature: 'C',
  }
}

function chordExample(
  exercise: Extract<Exercise, { type: 'chord' | 'ear-chord' }>,
): WorkedExample {
  const root = spelledPitchToPitch(exercise.root)
  const pitches =
    'slash' in exercise && exercise.slash !== undefined
      ? chordWithSlash(
          root,
          exercise.quality,
          spelledPitchToPitch(exercise.slash),
        )
      : chordWithInversion(root, exercise.quality, exercise.inversion)
  return {
    kind: 'chord',
    measures: chordMeasures(pitches, exercise.id),
    clef: clefFor(pitches),
    keySignature: 'C',
  }
}

function notationExample(
  exercise: Extract<Exercise, { type: 'chord-notation' }>,
): WorkedExample | null {
  try {
    // El bajo del cifrado puede traer sufijo (`Solm`, `Gm`); alcanza con su
    // fundamental. Se parsea cada parte por separado para aceptar ambos
    // sistemas y no depender de que el cifrado completo tenga una sola forma.
    const [chordPart, slashPart] = exercise.symbol.split('/')
    const parsed = parseChordSymbol(chordPart)
    const bass = slashPart ? parseChordSymbol(slashPart).root : undefined
    const pitches = bass
      ? chordWithSlash(parsed.root, parsed.quality, bass)
      : chordPitches(parsed.root, parsed.quality)
    return {
      kind: 'chord',
      measures: chordMeasures(pitches, exercise.id),
      clef: clefFor(pitches),
      keySignature: 'C',
    }
  } catch {
    return null
  }
}

/**
 * Construye el ejemplo del ejercicio fallado.
 *
 * Devuelve `null` para los tipos que todavía no tienen una representación
 * resuelta (notas sueltas, escalas, ritmo, etc.); en ese caso el reproductor
 * conserva el ejemplo textual de la regla.
 */
export function buildWorkedExample(
  exercise: Exercise,
): WorkedExample | null {
  switch (exercise.type) {
    case 'interval':
    case 'ear-interval':
      return intervalExample(exercise)
    case 'chord':
    case 'ear-chord':
      return chordExample(exercise)
    case 'chord-notation':
      return notationExample(exercise)
    default:
      return null
  }
}
