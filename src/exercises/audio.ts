import {
  chordTimeline,
  type ChordStyle,
  type TimelineEvent,
} from '../audio/notes'
import type { Exercise } from '../schemas'
import {
  chordWithInversion,
  chordWithSlash,
  fromSpelledPitch,
  midiOf,
} from '../theory'

type EarChordExercise = Extract<Exercise, { type: 'ear-chord' }>
type ChordExercise = Extract<Exercise, { type: 'chord' }>

/**
 * Convierte un ejercicio auditivo de acordes en un timeline reproducible.
 * La fundamental, la inversión y el estilo viven en el ejercicio para que el
 * mismo ítem pueda sonar en bloque o arpegiado sin depender del contenido.
 * El estilo se puede sobrescribir desde el reproductor.
 */
export function earChordTimeline(
  exercise: EarChordExercise,
  tempo: number,
  style: ChordStyle = exercise.style,
): TimelineEvent[] {
  const pitches = chordWithInversion(
    fromSpelledPitch(exercise.root),
    exercise.quality,
    exercise.inversion,
  )
  return chordTimeline(
    pitches.map((pitch) => midiOf(pitch)),
    {
      tempo,
      style,
      noteBeats: 1,
    },
  )
}

/**
 * Convierte un ejercicio de acordes (calidad, inversión, notas o cifrado) en
 * un timeline reproducible. Respeta el bajo con barra y la inversión del
 * ejercicio, de modo que el alumno escucha exactamente el voicing que se le
 * pide construir o reconocer.
 */
export function chordExerciseTimeline(
  exercise: ChordExercise,
  tempo: number,
  style: ChordStyle = 'block',
): TimelineEvent[] {
  const root = fromSpelledPitch(exercise.root)
  const pitches = exercise.slash
    ? chordWithSlash(root, exercise.quality, fromSpelledPitch(exercise.slash))
    : chordWithInversion(root, exercise.quality, exercise.inversion)
  return chordTimeline(
    pitches.map((pitch) => midiOf(pitch)),
    {
      tempo,
      style,
      noteBeats: 1,
    },
  )
}
