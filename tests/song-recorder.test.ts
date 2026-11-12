import { describe, expect, it } from 'vitest'
import {
  figureForBeats,
  gridBeats,
  quantizeBeats,
  recordMidiSong,
} from '../src/songs/recorder'

const TS = { numerator: 4, denominator: 4 as const }

function note(midi: number, on: number, off: number, velocity = 80) {
  return [
    { note: midi, velocity, timestamp: on },
    { note: midi, velocity: 0, timestamp: off },
  ]
}

describe('grabador MIDI', () => {
  it('convierte una toma en notas cuantizadas por pulso', () => {
    const result = recordMidiSong(
      [...note(60, 1000, 1500), ...note(64, 2000, 2500, 90)],
      { tempoBpm: 60, timeSignature: TS, grid: 'quarter' },
    )

    expect(result.measures).toBe(1)
    expect(result.noteCount).toBe(2)
    expect(result.left).toBeUndefined()
    expect(
      result.right?.events.map((event) => [
        event.measure,
        event.beat,
        event.value.duration,
        event.velocity,
      ]),
    ).toEqual([
      [1, 0, 'quarter', 80],
      [1, 1, 'quarter', 90],
    ])
  })

  it('separa las manos por el punto de división', () => {
    const result = recordMidiSong(
      [...note(48, 0, 500), ...note(72, 0, 500)],
      { tempoBpm: 60, timeSignature: TS, splitMidi: 60 },
    )

    expect(result.left?.events).toHaveLength(1)
    expect(result.right?.events).toHaveLength(1)
    expect(result.left?.clef).toBe('bass')
    expect(result.right?.clef).toBe('treble')
    expect(result.left?.events[0]?.pitches[0]).toMatchObject({
      step: 'C',
      octave: 3,
    })
  })

  it('agrupa como acorde las notas de la misma celda', () => {
    const result = recordMidiSong(
      [
        ...note(60, 0, 500),
        ...note(64, 0, 500),
        ...note(67, 0, 500),
      ],
      { tempoBpm: 60, timeSignature: TS, grid: 'eighth' },
    )

    expect(result.right?.events).toHaveLength(1)
    expect(result.right?.events[0]?.pitches).toHaveLength(3)
    expect(result.right?.events[0]?.value.duration).toBe('eighth')
  })

  it('recorta la duración para no pisar el ataque siguiente', () => {
    const result = recordMidiSong(
      [
        { note: 60, velocity: 80, timestamp: 0 },
        { note: 62, velocity: 80, timestamp: 500 },
        { note: 62, velocity: 0, timestamp: 1000 },
        { note: 60, velocity: 0, timestamp: 2000 },
      ],
      { tempoBpm: 60, timeSignature: TS, grid: 'eighth' },
    )

    expect(
      result.right?.events.map((event) => [
        event.beat,
        event.value.duration,
      ]),
    ).toEqual([
      [0, 'eighth'],
      [0.5, 'eighth'],
    ])
  })

  it('asigna compases según el tempo y el compás', () => {
    const result = recordMidiSong(
      [
        ...note(60, 0, 500),
        ...note(64, 4000, 4500),
      ],
      {
        tempoBpm: 60,
        timeSignature: { numerator: 3, denominator: 4 },
        grid: 'eighth',
      },
    )

    expect(result.right?.events[0]?.measure).toBe(1)
    expect(result.right?.events[0]?.beat).toBe(0)
    expect(result.right?.events[1]?.measure).toBe(2)
    expect(result.right?.events[1]?.beat).toBe(1)
    expect(result.measures).toBe(2)
  })

  it('cierra la nota que queda abierta al terminar la toma', () => {
    const result = recordMidiSong(
      [
        { note: 60, velocity: 80, timestamp: 0 },
        { note: 64, velocity: 80, timestamp: 500 },
      ],
      { tempoBpm: 60, timeSignature: TS, grid: 'quarter' },
    )

    expect(result.right?.events).toHaveLength(2)
    expect(result.right?.events[1]?.value.duration).toBe('quarter')
  })

  it('devuelve una partitura vacía si no hay pulsaciones', () => {
    const result = recordMidiSong([], {
      tempoBpm: 80,
      timeSignature: TS,
    })
    expect(result).toEqual({ measures: 1, noteCount: 0 })
  })

  it('convierte tiempos a la rejilla y elige figuras válidas', () => {
    expect(gridBeats('quarter')).toBe(1)
    expect(quantizeBeats(0.24, 'eighth')).toBe(0)
    expect(quantizeBeats(0.26, 'eighth')).toBe(0.5)
    expect(quantizeBeats(-1, 'eighth')).toBe(0)
    expect(figureForBeats(1.4, 0.5)).toBe('quarter')
    expect(figureForBeats(0.5, 0.5)).toBe('eighth')
    expect(figureForBeats(0.1, 0.25)).toBe('thirty-second')
  })
})
