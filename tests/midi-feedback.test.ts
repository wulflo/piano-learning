import { describe, expect, it } from 'vitest'
import { alignNotes, evaluateMidiPerformance } from '../src/midi/feedback'
import type { MidiNoteEvent } from '../src/midi/input'

function note(noteNumber: number, timestamp: number, velocity = 90): MidiNoteEvent {
  return { note: noteNumber, velocity, channel: 0, timestamp }
}

describe('F6-009 — Feedback objetivo con MIDI', () => {
  it('alinea una ejecución perfecta', () => {
    expect(alignNotes([60, 62, 64], [60, 62, 64])).toEqual([
      { expected: 60, played: 60, status: 'ok' },
      { expected: 62, played: 62, status: 'ok' },
      { expected: 64, played: 64, status: 'ok' },
    ])
  })

  it('marca una nota equivocada sin desplazar el resto', () => {
    const comparison = alignNotes([60, 62, 64], [60, 63, 64])
    expect(comparison.map((item) => item.status)).toEqual(['ok', 'wrong', 'ok'])
  })

  it('detecta notas faltantes y sobrantes', () => {
    const extra = alignNotes([60, 62, 64], [60, 62, 63, 64])
    expect(extra.map((item) => item.status)).toEqual([
      'ok',
      'ok',
      'extra',
      'ok',
    ])

    const missing = alignNotes([60, 62, 64], [60, 64])
    expect(missing.map((item) => item.status)).toEqual(['ok', 'missing', 'ok'])
  })

  it('calcula aciertos, tempo y ritmo', () => {
    const expected = [60, 62, 64, 65]
    const events = [
      note(60, 0),
      note(62, 500),
      note(64, 1000),
      note(65, 1500),
    ]
    const feedback = evaluateMidiPerformance(expected, events, {
      expectedTimes: [0, 500, 1000, 1500],
    })
    expect(feedback.matched).toBe(4)
    expect(feedback.accuracy).toBe(1)
    expect(feedback.tempo?.bpm).toBeCloseTo(120, 5)
    expect(feedback.rhythm?.accuracy).toBe(1)
    expect(feedback.even).toBe(true)
  })

  it('penaliza notas incorrectas y faltantes', () => {
    const feedback = evaluateMidiPerformance(
      [60, 62, 64],
      [note(60, 0), note(63, 500)],
      { expectedTimes: [0, 500, 1000] },
    )
    expect(feedback.matched).toBe(1)
    expect(feedback.wrong).toBe(1)
    expect(feedback.missing).toBe(1)
    expect(feedback.accuracy).toBeCloseTo(1 / 3, 5)
  })

  it('baja el acierto cuando se intercalan notas de más', () => {
    const feedback = evaluateMidiPerformance(
      [60, 62, 64],
      [note(60, 0), note(61, 250), note(62, 500), note(64, 1000)],
      { expectedTimes: [0, 500, 1000] },
    )
    expect(feedback.matched).toBe(3)
    expect(feedback.extra).toBe(1)
    expect(feedback.accuracy).toBeCloseTo(3 / 4, 5)
  })

  it('mide la uniformidad del ataque', () => {
    const uneven = evaluateMidiPerformance(
      [60, 62],
      [note(60, 0, 40), note(62, 500, 120)],
    )
    expect(uneven.even).toBe(false)
    expect(uneven.velocitySpread).toBeGreaterThan(16)

    const even = evaluateMidiPerformance(
      [60, 62],
      [note(60, 0, 88), note(62, 500, 92)],
    )
    expect(even.even).toBe(true)
  })

  it('ignora los note off', () => {
    const feedback = evaluateMidiPerformance(
      [60],
      [note(60, 0, 0), note(60, 10)],
    )
    expect(feedback.matched).toBe(1)
  })

  it('devuelve métricas vacías sin notas', () => {
    const feedback = evaluateMidiPerformance([], [])
    expect(feedback.accuracy).toBe(0)
    expect(feedback.tempo).toBeNull()
    expect(feedback.rhythm).toBeNull()
    expect(feedback.even).toBe(false)
  })
})
