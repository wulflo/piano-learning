import {
  beatDuration,
  clampTempo,
  type ChordStyle,
  type TimelineEvent,
} from '../audio/notes'
import type { Key } from '../schemas'
import { midiOf, romanToChord, type DiatonicMode } from '../theory'
import { DEFAULT_DICTATION_TEMPO } from './dictation'

/**
 * Reproducción de progresiones de acordes con voicings y tempo.
 *
 * A diferencia de `chordTimeline`, que sirve un solo acorde, este módulo
 * encadena los acordes de una progresión haciendo que cada voicing ocupe
 * exactamente su hueco: así ningún acorde pisa al siguiente y ninguna nota
 * queda sonando cuando la progresión vuelve a empezar en modo bucle.
 *
 * - `block`: el acorde entero suena de una vez durante el hueco.
 * - `arpeggio-up` / `arpeggio-down`: las notas se reparten el hueco en orden.
 * - `bass-chord`: el bajo se sostiene durante el hueco y el resto del acorde
 *   entra después sin repetir el MIDI del bajo, de modo que ninguna
 *   liberación corta a otra nota (notas trabadas).
 *
 * Es puro: no toca React ni el motor de audio; la UI decide cuándo sonar.
 */

export interface ProgressionPlaybackChord {
  /** Grado tal como lo declara la progresión, por ejemplo `IV` o `V7`. */
  numeral: string
  /** Notas del acorde en posición fundamental, como MIDI. */
  midis: number[]
}

export interface ProgressionPlayback {
  key: Key
  mode: 'major' | 'minor'
  degrees: string[]
  chords: ProgressionPlaybackChord[]
  style: ChordStyle
  tempo: number
  /** Pulsos por acorde (negras). */
  chordBeats: number
  /** Pausa final en pulsos para que ninguna nota suene al repetir. */
  loopGapBeats: number
  /** Timeline de una pasada; cada evento lleva su numeral en `label`. */
  timeline: TimelineEvent[]
  /** Duración de una pasada en segundos, incluida la pausa final. */
  duration: number
}

export interface ProgressionPlaybackOptions {
  tempo?: number
  style?: ChordStyle
  /** Pulsos por acorde; por defecto 1.5, o 3 en `bass-chord`. */
  chordBeats?: number
  /** Pausa final en pulsos; por defecto 0.5. */
  loopGapBeats?: number
}

/** Duración por defecto de cada acorde de la progresión. */
export const PROGRESSION_CHORD_BEATS = 1.5

/** El bajo + acorde necesita tres pulsos: bajo, acorde y caída. */
export const BASS_CHORD_BEATS = 3

/** Pausa entre pasadas para liberar las notas antes de repetir. */
export const PROGRESSION_LOOP_GAP_BEATS = 0.5

/**
 * Reparte un acorde en un hueco de `slotBeats` pulsos con el voicing pedido.
 * Todos los estilos terminan antes o justo al final del hueco.
 */
export function progressionVoicing(
  midis: readonly number[],
  style: ChordStyle,
  tempo: number,
  slotBeats: number,
): TimelineEvent[] {
  const slot = slotBeats * beatDuration(tempo)
  if (midis.length === 0) return []

  if (style === 'block') {
    return [{ time: 0, duration: slot, midis: [...midis] }]
  }

  if (style === 'bass-chord') {
    const [bass, ...rest] = midis
    if (rest.length === 0) {
      return [{ time: 0, duration: slot, midis: [bass] }]
    }
    return [
      { time: 0, duration: slot, midis: [bass] },
      { time: slot / 3, duration: (slot * 2) / 3, midis: [...rest] },
    ]
  }

  const ordered =
    style === 'arpeggio-down' ? [...midis].reverse() : [...midis]
  const noteSlot = slot / ordered.length
  return ordered.map((midi, index) => ({
    time: index * noteSlot,
    duration: noteSlot,
    midis: [midi],
  }))
}

/**
 * Construye la reproducción de una progresión. La duración anunciada incluye
 * una pausa final para que el motor pueda repetir sin cortar notas; el
 * reproductor la pasa como `duration` de la secuencia.
 */
export function buildProgressionPlayback(
  degrees: readonly string[],
  key: Key,
  mode: 'major' | 'minor',
  options: ProgressionPlaybackOptions = {},
): ProgressionPlayback {
  const tempo = clampTempo(options.tempo ?? DEFAULT_DICTATION_TEMPO)
  const style = options.style ?? 'block'
  const chordBeats =
    options.chordBeats ??
    (style === 'bass-chord' ? BASS_CHORD_BEATS : PROGRESSION_CHORD_BEATS)
  const loopGapBeats = options.loopGapBeats ?? PROGRESSION_LOOP_GAP_BEATS
  const diatonicMode: DiatonicMode = mode === 'minor' ? 'natural-minor' : 'major'

  const chords = degrees.map((numeral) => {
    const chord = romanToChord(key, diatonicMode, numeral)
    return { numeral, midis: chord.pitches.map((pitch) => midiOf(pitch)) }
  })

  const slot = chordBeats * beatDuration(tempo)
  const timeline: TimelineEvent[] = []
  chords.forEach((chord, index) => {
    const offset = index * slot
    for (const event of progressionVoicing(chord.midis, style, tempo, chordBeats)) {
      timeline.push({ ...event, time: event.time + offset, label: chord.numeral })
    }
  })

  return {
    key,
    mode,
    degrees: [...degrees],
    chords,
    style,
    tempo,
    chordBeats,
    loopGapBeats,
    timeline,
    duration:
      chords.length * slot + loopGapBeats * beatDuration(tempo),
  }
}
