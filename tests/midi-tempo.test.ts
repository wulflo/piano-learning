import { describe, expect, it } from 'vitest'
import {
  beatGrid,
  estimateTempo,
  evaluateRhythm,
  noteOnsets,
  RHYTHM_TOLERANCE_MS,
} from '../src/midi/tempo'
import type { MidiNoteEvent } from '../src/midi/input'

function note(noteNumber: number, timestamp: number, velocity = 90): MidiNoteEvent {
  return { note: noteNumber, velocity, channel: 0, timestamp }
}

describe('F6-008 — Tempo y ritmo desde MIDI', () => {
  it('ignora las notas apagadas al extraer ataques', () => {
    const onsets = noteOnsets([
      note(60, 300),
      note(60, 100, 0),
      note(62, 100),
    ])
    expect(onsets).toEqual([100, 300])
  })

  it('estima el tempo de una serie regular a 120 BPM', () => {
    const onsets = [0, 500, 1000, 1500, 2000]
    const estimate = estimateTempo(onsets)
    expect(estimate).not.toBeNull()
    expect(estimate?.bpm).toBeCloseTo(120, 5)
    expect(estimate?.confidence).toBeCloseTo(1, 5)
  })

  it('tolera pequeñas irregularidades humanas', () => {
    const onsets = [0, 505, 995, 1510, 2000]
    const estimate = estimateTempo(onsets)
    expect(estimate).not.toBeNull()
    expect(estimate?.bpm).toBeGreaterThan(115)
    expect(estimate?.bpm).toBeLessThan(125)
    expect(estimate?.confidence).toBeGreaterThan(0.8)
  })

  it('devuelve null con menos de dos ataques', () => {
    expect(estimateTempo([])).toBeNull()
    expect(estimateTempo([100])).toBeNull()
  })

  it('respeta el rango de BPM configurado', () => {
    const onsets = [0, 100, 200]
    expect(estimateTempo(onsets)).toBeNull()
    expect(estimateTempo(onsets, { minBpm: 500, maxBpm: 700 })?.bpm).toBeCloseTo(
      600,
      5,
    )
  })

  it('clasifica adelantos, atrasos y aciertos', () => {
    const expected = [0, 500, 1000, 1500]
    const onsets = [0, 400, 1010, 1500]
    const report = evaluateRhythm(onsets, expected)
    expect(report.deviations.map((item) => item.status)).toEqual([
      'ok',
      'early',
      'ok',
      'ok',
    ])
    expect(report.accuracy).toBeCloseTo(0.75, 5)
    expect(report.steady).toBe(false)
  })

  it('marca estable un ritmo dentro de la tolerancia', () => {
    const expected = [0, 500, 1000, 1500]
    const onsets = [20, 520, 980, 1530]
    const report = evaluateRhythm(onsets, expected)
    expect(report.accuracy).toBe(1)
    expect(report.steady).toBe(true)
    expect(report.meanAbsDeviationMs).toBeCloseTo(22.5, 5)
  })

  it('acepta una tolerancia configurable', () => {
    const expected = [0, 500]
    const onsets = [0, 620]
    expect(evaluateRhythm(onsets, expected).deviations[1].status).toBe('late')
    expect(
      evaluateRhythm(onsets, expected, 200).deviations[1].status,
    ).toBe('ok')
    expect(RHYTHM_TOLERANCE_MS).toBe(80)
  })

  it('genera la rejilla a partir del tempo', () => {
    expect(beatGrid([0, 1, 2], 120)).toEqual([0, 500, 1000])
    expect(beatGrid([0, 0.5], 60, 100)).toEqual([100, 600])
  })
})
