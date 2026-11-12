import { describe, expect, it } from 'vitest'
import { isWebMidiSupported } from '../src/midi/detect'

describe('F6-006 — Detección de Web MIDI', () => {
  it('detecta la ausencia de Web MIDI en jsdom', () => {
    // jsdom no implementa Web MIDI.
    expect(isWebMidiSupported()).toBe(false)
  })
})