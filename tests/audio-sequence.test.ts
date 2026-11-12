import { describe, expect, it } from 'vitest'
import {
  beatDuration,
  chordTimeline,
  clampTempo,
  intervalTimeline,
  midiToNoteName,
  noteTimeline,
  scaleTimeline,
  shiftTimeline,
  timelineDuration,
} from '../src/audio/notes'

describe('timeline de audio', () => {
  it('convierte MIDI a nombres de Tone y limita el tempo', () => {
    expect(midiToNoteName(60)).toBe('C4')
    expect(midiToNoteName(61)).toBe('C#4')
    expect(midiToNoteName(70)).toBe('A#4')
    expect(beatDuration(80)).toBe(0.75)
    expect(clampTempo(10)).toBe(40)
    expect(clampTempo(999)).toBe(240)
    expect(clampTempo(Number.NaN)).toBe(80)
  })

  it('construye una nota con duración configurable', () => {
    const timeline = noteTimeline(60, { tempo: 120, beats: 2 })
    expect(timeline).toEqual([{ time: 0, duration: 1, midis: [60] }])
  })

  it('distingue intervalos melódicos y armónicos', () => {
    const melodic = intervalTimeline(60, 64, { tempo: 80 })
    expect(melodic.map((event) => event.time)).toEqual([0, 0.75])
    expect(melodic.map((event) => event.midis)).toEqual([[60], [64]])

    const harmonic = intervalTimeline(60, 64, { tempo: 80, mode: 'harmonic' })
    expect(harmonic).toHaveLength(1)
    expect(harmonic[0]).toMatchObject({ time: 0, duration: 1.5, midis: [60, 64] })
  })

  it('construye escalas ascendentes y descendentes', () => {
    const up = scaleTimeline([60, 62, 64], { tempo: 120, noteBeats: 1 })
    expect(up.map((event) => event.midis[0])).toEqual([60, 62, 64])
    expect(up.map((event) => event.time)).toEqual([0, 0.5, 1])

    const down = scaleTimeline([60, 62, 64], {
      tempo: 120,
      noteBeats: 1,
      direction: 'descending',
    })
    expect(down.map((event) => event.midis[0])).toEqual([64, 62, 60])
  })

  it('construye bloques, arpegios y bajo+acorde', () => {
    const block = chordTimeline([60, 64, 67], { tempo: 120 })
    expect(block).toEqual([{ time: 0, duration: 0.5, midis: [60, 64, 67] }])

    const up = chordTimeline([60, 64, 67], {
      tempo: 120,
      style: 'arpeggio-up',
      noteBeats: 1,
    })
    expect(up.map((event) => event.midis[0])).toEqual([60, 64, 67])
    expect(up.map((event) => event.time)).toEqual([0, 0.5, 1])

    const down = chordTimeline([60, 64, 67], {
      tempo: 120,
      style: 'arpeggio-down',
      noteBeats: 1,
    })
    expect(down.map((event) => event.midis[0])).toEqual([67, 64, 60])

    const bass = chordTimeline([48, 60, 64, 67], {
      tempo: 120,
      style: 'bass-chord',
    })
    expect(bass).toHaveLength(2)
    expect(bass[0]).toEqual({ time: 0, duration: 1.5, midis: [48] })
    // El acorde no repite el MIDI del bajo: así no se dispara dos veces la
    // misma nota y una liberación no corta a la otra.
    expect(bass[1]).toEqual({ time: 0.5, duration: 1, midis: [60, 64, 67] })
    expect(timelineDuration(bass)).toBe(1.5)

    const single = chordTimeline([48], { tempo: 120, style: 'bass-chord' })
    expect(single).toEqual([{ time: 0, duration: 0.5, midis: [48] }])
  })

  it('escala la programación con el tempo sin mover los eventos ya creados', () => {
    const fast = chordTimeline([60, 64, 67], {
      tempo: 120,
      style: 'bass-chord',
    })
    const slow = chordTimeline([60, 64, 67], {
      tempo: 60,
      style: 'bass-chord',
    })

    expect(fast.map((event) => event.time)).toEqual([0, 0.5])
    expect(slow.map((event) => event.time)).toEqual([0, 1])
    expect(timelineDuration(fast)).toBe(1.5)
    expect(timelineDuration(slow)).toBe(3)
    // Cambiar el tempo del motor no reescribe los timelines ya construidos.
    expect(fast.map((event) => event.time)).toEqual([0, 0.5])
  })

  it('calcula duración total y desplaza timelines', () => {
    const timeline = scaleTimeline([60, 62], { tempo: 120, noteBeats: 1 })
    expect(timelineDuration(timeline)).toBe(1)
    expect(timelineDuration([])).toBe(0)
    const shifted = shiftTimeline(timeline, 0.25)
    expect(shifted.map((event) => event.time)).toEqual([0.25, 0.75])
    expect(timeline[0].time).toBe(0)
  })
})
