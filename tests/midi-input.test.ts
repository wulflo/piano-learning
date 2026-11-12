import { describe, expect, it } from 'vitest'
import { isWebMidiSupported } from '../src/midi/detect'

describe('F6-007 — Entrada MIDI', () => {
  it('no hay Web MIDI en jsdom', () => {
    expect(isWebMidiSupported()).toBe(false)
  })
})