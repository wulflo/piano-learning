import { describe, expect, it } from 'vitest'
import { evaluateTaskAttempt, taskExpectedStrikes } from '../src/midi/exercise-attempt'
import type { KeyboardTask } from '../src/schemas'
import type { MidiNoteEvent } from '../src/midi/input'

function note(noteNumber: number, timestamp: number, velocity = 90): MidiNoteEvent {
  return { note: noteNumber, velocity, channel: 0, timestamp }
}

function task(): KeyboardTask {
  return {
    titleEs: 'Tres notas',
    instructionsEs: 'Toca las tres notas en orden.',
    keys: [
      { step: 'C', accidental: '', octave: 4 },
      { step: 'E', accidental: '', octave: 4 },
      { step: 'G', accidental: '', octave: 4 },
    ],
    tempoBpm: 60,
    checklistEs: ['Marca la primera', 'Marca la segunda', 'Marca la tercera'],
  } as unknown as KeyboardTask
}

describe('F6-032 — Intento de tarea con MIDI', () => {
  it('construye la secuencia esperada por teclas cuando la tarea no tiene demo', () => {
    const expected = taskExpectedStrikes(task(), 60)
    expect(expected.map((strike) => strike.note)).toEqual([60, 64, 67])
    expect(expected.map((strike) => strike.timeMs)).toEqual([0, 1000, 2000])
  })

  it('evalúa un intento perfecto: aciertos, ritmo y uniformidad', () => {
    const feedback = evaluateTaskAttempt(task(), [
      note(60, 0),
      note(64, 1000),
      note(67, 2000),
    ])
    expect(feedback.matched).toBe(3)
    expect(feedback.wrong).toBe(0)
    expect(feedback.missing).toBe(0)
    expect(feedback.extra).toBe(0)
    expect(feedback.accuracy).toBe(1)
    expect(feedback.rhythm?.accuracy).toBe(1)
    expect(feedback.rhythm?.steady).toBe(true)
    expect(feedback.even).toBe(true)
  })

  it('detecta una pulsación fuera de secuencia', () => {
    const feedback = evaluateTaskAttempt(task(), [
      note(60, 0),
      note(65, 1000),
      note(67, 2000),
    ])
    expect(feedback.matched).toBe(2)
    expect(feedback.wrong).toBe(1)
    expect(feedback.missing).toBe(0)
    expect(feedback.extra).toBe(0)
  })

  it('marca el ritmo cuando una pulsación llega tarde o temprano', () => {
    const feedback = evaluateTaskAttempt(task(), [
      note(60, 0),
      note(64, 1500),
      note(67, 2000),
    ])
    expect(feedback.rhythm?.accuracy).toBeCloseTo(2 / 3, 5)
    expect(feedback.rhythm?.deviations[1].status).toBe('late')
  })

  it('normaliza timestamps absolutos de Web MIDI antes de medir el ritmo', () => {
    const feedback = evaluateTaskAttempt(task(), [
      note(60, 5000),
      note(64, 6000),
      note(67, 7000),
    ])
    expect(feedback.matched).toBe(3)
    expect(feedback.rhythm?.accuracy).toBe(1)
    expect(feedback.rhythm?.steady).toBe(true)
  })

  it('reporta faltantes y sobrantes en la secuencia', () => {
    const feedback = evaluateTaskAttempt(task(), [note(60, 0)])
    expect(feedback.missing).toBe(2)
    expect(feedback.extra).toBe(0)
    expect(feedback.accuracy).toBeCloseTo(1 / 3, 5)
  })

  it('no da por bueno un intento con teclas equivocadas intercaladas', () => {
    const feedback = evaluateTaskAttempt(task(), [
      note(60, 0),
      note(61, 400),
      note(64, 1000),
      note(66, 1500),
      note(67, 2000),
    ])
    expect(feedback.matched).toBe(3)
    expect(feedback.wrong).toBe(0)
    expect(feedback.extra).toBe(2)
    expect(feedback.missing).toBe(0)
    expect(feedback.accuracy).toBeCloseTo(3 / 5, 5)
  })
})
