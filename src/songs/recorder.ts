import {
  AccidentalSchema,
  type Hand,
  type NoteEvent,
  type Score,
  type SpelledPitch,
  type TimeSignature,
} from '../schemas'
import { accidentalToText, pitchFromMidi } from '../theory/pitch'

/**
 * Grabador MIDI: convierte una toma libre en dos partituras cuantizadas.
 *
 * El usuario toca sin metrónomo; el grabador toma la primera pulsación como
 * origen, convierte el tiempo real a pulsos según el tempo elegido y ajusta
 * cada ataque a la rejilla. Las notas se separan por mano según `splitMidi` y
 * las que caen en la misma celda forman un acorde.
 *
 * La duración de cada nota se recorta para no pisar el ataque siguiente ni
 * cruzar el compás, y se redondea a una figura disponible. Es una primera fase
 * deliberadamente simple: no interpreta pedal, tresillos ni ligaduras.
 */

export type RecorderGrid = 'quarter' | 'eighth' | 'sixteenth'

export interface RecorderNoteInput {
  note: number
  velocity: number
  timestamp: number
}

export interface RecorderOptions {
  tempoBpm: number
  timeSignature: TimeSignature
  /** MIDI a partir del cual la nota es mano derecha. */
  splitMidi?: number
  grid?: RecorderGrid
  key?: string
  mode?: 'major' | 'minor'
  /** Prefijo de los IDs de evento; por defecto `song.rec`. */
  idPrefix?: string
}

export interface RecordedSongData {
  right?: Score
  left?: Score
  measures: number
  /** Notas de la toma que quedaron dentro de la partitura. */
  noteCount: number
}

interface PerformanceNote {
  midi: number
  velocity: number
  start: number
  end: number
}

interface QuantizedChord {
  hand: Hand
  midis: number[]
  velocity: number
  startBeat: number
  durationBeats: number
}

const GRID_BEATS: Record<RecorderGrid, number> = {
  quarter: 1,
  eighth: 0.5,
  sixteenth: 0.25,
}

/** Figuras disponibles para el grabador, de menor a mayor. */
const FIGURES: ReadonlyArray<{
  beats: number
  duration: NoteEvent['value']['duration']
}> = [
  { beats: 0.125, duration: 'thirty-second' },
  { beats: 0.25, duration: 'sixteenth' },
  { beats: 0.5, duration: 'eighth' },
  { beats: 1, duration: 'quarter' },
  { beats: 2, duration: 'half' },
  { beats: 4, duration: 'whole' },
]

/** Pulso de negra en el que cae cada figura de la rejilla. */
export function gridBeats(grid: RecorderGrid = 'eighth'): number {
  return GRID_BEATS[grid]
}

/** Redondea un tiempo en pulsos a la rejilla elegida. */
export function quantizeBeats(
  beats: number,
  grid: RecorderGrid = 'eighth',
): number {
  const step = gridBeats(grid)
  const snapped = Math.round(beats / step) * step
  return Math.max(0, Number(snapped.toFixed(6)))
}

/**
 * Figura más larga que no supere `beats`, con un mínimo de rejilla.
 *
 * Si el hueco hasta el siguiente ataque es menor que la rejilla (por ejemplo,
 * al final de un compás), se elige la figura que sí cabe para no cruzar la
 * barra.
 */
export function figureForBeats(
  beats: number,
  minimum: number,
): NoteEvent['value']['duration'] {
  const available = Math.max(0.125, Math.min(beats, 4))
  let chosen = FIGURES[0]!
  for (const figure of FIGURES) {
    if (figure.beats <= available + 1e-9) chosen = figure
  }
  const minimumBeats = Math.max(0.125, minimum)
  if (chosen.beats + 1e-9 < minimumBeats) {
    const minimumFigure = FIGURES.find(
      (figure) => figure.beats >= minimumBeats - 1e-9,
    )
    if (minimumFigure !== undefined && minimumFigure.beats <= available + 1e-9) {
      chosen = minimumFigure
    }
  }
  return chosen.duration
}

function toSpelledPitch(midi: number): SpelledPitch {
  const pitch = pitchFromMidi(midi)
  return {
    step: pitch.step,
    accidental: AccidentalSchema.parse(accidentalToText(pitch.accidental)),
    octave: pitch.octave,
  }
}

/**
 * Empareja note-on con note-off y cierra las notas que quedaron abiertas al
 * terminar la toma. Si una tecla se vuelve a pulsar antes de soltarla, la nota
 * anterior se cierra en el nuevo ataque.
 */
function performanceNotes(
  events: readonly RecorderNoteInput[],
): PerformanceNote[] {
  const sorted = [...events]
    .filter(
      (event) =>
        Number.isFinite(event.timestamp) &&
        event.note >= 0 &&
        event.note <= 127,
    )
    .sort((a, b) => a.timestamp - b.timestamp)
  if (sorted.length === 0) return []

  const open = new Map<number, { start: number; velocity: number }>()
  const notes: PerformanceNote[] = []
  let lastTimestamp = sorted[0]?.timestamp ?? 0

  for (const event of sorted) {
    lastTimestamp = Math.max(lastTimestamp, event.timestamp)
    if (event.velocity > 0) {
      const previous = open.get(event.note)
      if (previous !== undefined) {
        notes.push({
          midi: event.note,
          velocity: previous.velocity,
          start: previous.start,
          end: Math.max(previous.start, event.timestamp),
        })
      }
      open.set(event.note, { start: event.timestamp, velocity: event.velocity })
    } else {
      const previous = open.get(event.note)
      if (previous === undefined) continue
      notes.push({
        midi: event.note,
        velocity: previous.velocity,
        start: previous.start,
        end: Math.max(previous.start, event.timestamp),
      })
      open.delete(event.note)
    }
  }

  for (const [midi, previous] of open) {
    notes.push({
      midi,
      velocity: previous.velocity,
      start: previous.start,
      end: Math.max(previous.start, lastTimestamp),
    })
  }

  return notes
}

/** Convierte una toma MIDI en dos partituras cuantizadas. */
export function recordMidiSong(
  events: readonly RecorderNoteInput[],
  options: RecorderOptions,
): RecordedSongData {
  const grid = options.grid ?? 'eighth'
  const step = gridBeats(grid)
  const splitMidi = options.splitMidi ?? 60
  const beatsPerMeasure =
    options.timeSignature.numerator * (4 / options.timeSignature.denominator)
  const notes = performanceNotes(events)
  if (notes.length === 0) {
    return { measures: 1, noteCount: 0 }
  }

  const origin = notes.reduce(
    (minimum, note) => Math.min(minimum, note.start),
    notes[0]?.start ?? 0,
  )
  const msPerBeat = 60000 / options.tempoBpm

  // Cada ataque cuantizado se agrupa en un acorde por mano.
  const groups = new Map<string, QuantizedChord>()
  for (const note of notes) {
    const rawBeats = (note.start - origin) / msPerBeat
    const startBeat = quantizeBeats(rawBeats, grid)
    const hand: Hand = note.midi >= splitMidi ? 'right' : 'left'
    const key = `${hand}:${startBeat}`
    const duration = Math.max(step, (note.end - note.start) / msPerBeat)
    const group = groups.get(key)
    if (group === undefined) {
      groups.set(key, {
        hand,
        midis: [note.midi],
        velocity: note.velocity,
        startBeat,
        durationBeats: duration,
      })
    } else {
      if (group.midis.length < 8 && !group.midis.includes(note.midi)) {
        group.midis.push(note.midi)
      }
      group.velocity = Math.max(group.velocity, note.velocity)
      group.durationBeats = Math.max(group.durationBeats, duration)
    }
  }

  const chords = [...groups.values()].sort(
    (a, b) => a.startBeat - b.startBeat || a.hand.localeCompare(b.hand),
  )

  const eventsByHand: Record<Hand, NoteEvent[]> = { right: [], left: [] }
  const nextStart: Record<Hand, number | null> = { right: null, left: null }

  // Se recorre al revés para conocer el ataque siguiente de cada mano.
  for (let index = chords.length - 1; index >= 0; index -= 1) {
    const chord = chords[index]
    if (chord === undefined) continue
    const measure = Math.floor(chord.startBeat / beatsPerMeasure) + 1
    const beat = Number(
      (chord.startBeat - (measure - 1) * beatsPerMeasure).toFixed(6),
    )
    const remainingInMeasure = beatsPerMeasure - beat
    const next = nextStart[chord.hand]
    const gap =
      next === null
        ? chord.durationBeats
        : Math.min(chord.durationBeats, next - chord.startBeat)
    const available = Math.max(0.125, Math.min(gap, remainingInMeasure))
    nextStart[chord.hand] = chord.startBeat

    eventsByHand[chord.hand].unshift({
      id: '',
      measure,
      beat,
      value: {
        duration: figureForBeats(available, step),
        dots: 0,
        tuplet: 'none',
      },
      pitches: chord.midis.sort((a, b) => a - b).map(toSpelledPitch),
      hand: chord.hand,
      voice: 1,
      velocity: chord.velocity,
      tieToNext: false,
    })
  }

  const scoreFor = (hand: Hand): Score | undefined => {
    const handEvents = eventsByHand[hand].map((event, index) => ({
      ...event,
      id: `${options.idPrefix ?? 'song.rec'}.${hand}.${index}`,
    }))
    if (handEvents.length === 0) return undefined
    return {
      clef: hand === 'right' ? 'treble' : 'bass',
      key: options.key ?? 'C',
      mode: options.mode ?? 'major',
      timeSignature: options.timeSignature,
      tempoBpm: options.tempoBpm,
      events: handEvents,
      pedals: [],
    }
  }

  const right = scoreFor('right')
  const left = scoreFor('left')
  const measures = Math.max(
    1,
    ...chords.map((chord) => Math.floor(chord.startBeat / beatsPerMeasure) + 1),
  )

  return { right, left, measures, noteCount: notes.length }
}
