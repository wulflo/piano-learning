import { formatPitch, pitchFromMidi } from '../theory/pitch'

/** Un evento del timeline: varios MIDI que suenan juntos. */
export interface TimelineEvent {
  /** Segundos desde el inicio de la secuencia. */
  time: number
  /** Duración audible en segundos. */
  duration: number
  midis: number[]
  label?: string
}

export interface TempoOptions {
  tempo?: number
}

export interface NoteOptions extends TempoOptions {
  /** Duración en pulsos (1 = negra). */
  beats?: number
  velocity?: number
}

export interface IntervalOptions extends NoteOptions {
  /** `melodic` toca las notas una tras otra; `harmonic` las superpone. */
  mode?: 'melodic' | 'harmonic'
}

export interface ScaleOptions extends TempoOptions {
  direction?: 'ascending' | 'descending'
  /** Duración de cada nota en pulsos. */
  noteBeats?: number
}

export interface ChordOptions extends TempoOptions {
  style?: ChordStyle
  noteBeats?: number
}

/** Formas de reproducción de un acorde. */
export const CHORD_STYLES = [
  'block',
  'arpeggio-up',
  'arpeggio-down',
  'bass-chord',
] as const

export type ChordStyle = (typeof CHORD_STYLES)[number]

export const MIN_TEMPO = 40
export const MAX_TEMPO = 240
export const DEFAULT_TEMPO = 80

export function clampTempo(tempo: number): number {
  if (!Number.isFinite(tempo)) return DEFAULT_TEMPO
  return Math.min(MAX_TEMPO, Math.max(MIN_TEMPO, Math.round(tempo)))
}

/** Segundos que dura un pulso (negra) al tempo indicado. */
export function beatDuration(tempo: number = DEFAULT_TEMPO): number {
  return 60 / clampTempo(tempo)
}

/** Nombre científico que entiende Tone.js, por ejemplo `C#4` o `Bb3`. */
export function midiToNoteName(midi: number): string {
  return formatPitch(pitchFromMidi(midi))
}

function positive(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : fallback
}

export function noteTimeline(midi: number, options: NoteOptions = {}): TimelineEvent[] {
  const beat = beatDuration(options.tempo)
  const beats = positive(options.beats, 1)
  return [{ time: 0, duration: beats * beat, midis: [midi] }]
}

export function intervalTimeline(
  root: number,
  second: number,
  options: IntervalOptions = {},
): TimelineEvent[] {
  const beat = beatDuration(options.tempo)
  const beats = positive(options.beats, 1)
  if (options.mode === 'harmonic') {
    return [{ time: 0, duration: beats * beat * 2, midis: [root, second] }]
  }
  return [
    { time: 0, duration: beats * beat, midis: [root] },
    { time: beats * beat, duration: beats * beat, midis: [second] },
  ]
}

export function scaleTimeline(midis: number[], options: ScaleOptions = {}): TimelineEvent[] {
  const beat = beatDuration(options.tempo)
  const noteBeats = positive(options.noteBeats, 0.5)
  const notes = options.direction === 'descending' ? [...midis].reverse() : [...midis]
  return notes.map((midi, index) => ({
    time: index * noteBeats * beat,
    duration: noteBeats * beat,
    midis: [midi],
  }))
}

export function chordTimeline(midis: number[], options: ChordOptions = {}): TimelineEvent[] {
  const beat = beatDuration(options.tempo)
  const noteBeats = positive(options.noteBeats, 1)
  if (midis.length === 0) return []
  const style = options.style ?? 'block'

  if (style === 'block') {
    return [{ time: 0, duration: noteBeats * beat, midis: [...midis] }]
  }

  if (style === 'bass-chord') {
    const [bass, ...rest] = midis
    if (rest.length === 0) {
      return [{ time: 0, duration: noteBeats * beat, midis: [bass] }]
    }
    // El bajo se sostiene bajo el acorde y el acorde no repite ese MIDI.
    // Así se evita disparar dos veces la misma nota y que una liberación
    // corte a la otra (notas trabadas).
    return [
      { time: 0, duration: noteBeats * beat * 3, midis: [bass] },
      { time: noteBeats * beat, duration: noteBeats * beat * 2, midis: rest },
    ]
  }

  const ordered = style === 'arpeggio-down' ? [...midis].reverse() : [...midis]
  return ordered.map((midi, index) => ({
    time: index * noteBeats * beat,
    duration: noteBeats * beat,
    midis: [midi],
  }))
}

/** Duración total de un timeline en segundos (0 para timelines vacíos). */
export function timelineDuration(events: TimelineEvent[]): number {
  return events.reduce(
    (total, event) => Math.max(total, event.time + event.duration),
    0,
  )
}

/** Añade un silencio inicial a todos los eventos sin mutar el original. */
export function shiftTimeline(events: TimelineEvent[], seconds: number): TimelineEvent[] {
  return events.map((event) => ({ ...event, time: event.time + seconds }))
}
