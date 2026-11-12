import { describe, expect, it } from 'vitest'
import {
  detectDeviceProfile,
  midiNoteName,
  parseMidiMessage,
} from '../src/midi/device'

describe('F6-031 — Dispositivos MIDI adicionales', () => {
  it('detecta el perfil Yamaha PSR-373', () => {
    expect(detectDeviceProfile('Yamaha PSR-373')).toBe('yamaha-psr-373')
    expect(detectDeviceProfile('PSR 373 Digital Keyboard')).toBe(
      'yamaha-psr-373',
    )
  })

  it('usa el perfil genérico para otros dispositivos', () => {
    expect(detectDeviceProfile('Roland FP-10')).toBe('generic')
    expect(detectDeviceProfile('')).toBe('generic')
    expect(detectDeviceProfile(null)).toBe('generic')
  })

  it('interpreta note on en distintos canales', () => {
    expect(parseMidiMessage([0x90, 60, 100])).toEqual({
      note: 60,
      velocity: 100,
      channel: 0,
    })
    expect(parseMidiMessage([0x95, 67, 88])).toEqual({
      note: 67,
      velocity: 88,
      channel: 5,
    })
  })

  it('normaliza note off de 0x80 y de velocity 0', () => {
    expect(parseMidiMessage([0x80, 60, 0])).toEqual({
      note: 60,
      velocity: 0,
      channel: 0,
    })
    expect(parseMidiMessage([0x90, 60, 0])).toEqual({
      note: 60,
      velocity: 0,
      channel: 0,
    })
  })

  it('tolera mensajes de sistema y tiempo real', () => {
    // Clock, start, continue, stop y active sensing.
    expect(parseMidiMessage([0xf8])).toBeNull()
    expect(parseMidiMessage([0xfa])).toBeNull()
    expect(parseMidiMessage([0xfb])).toBeNull()
    expect(parseMidiMessage([0xfc])).toBeNull()
    expect(parseMidiMessage([0xfe])).toBeNull()
    // Sysex con payload.
    expect(parseMidiMessage([0xf0, 0x7e, 0x00, 0xf7])).toBeNull()
  })

  it('ignora mensajes cortos, nulos o fuera de rango', () => {
    expect(parseMidiMessage(null)).toBeNull()
    expect(parseMidiMessage([])).toBeNull()
    expect(parseMidiMessage([0x90])).toBeNull()
    expect(parseMidiMessage([0x90, 200, 100])).toBeNull()
    expect(parseMidiMessage([0xb0, 7, 100])).toBeNull()
  })

  it('nombra las notas MIDI', () => {
    expect(midiNoteName(60)).toBe('C4')
    expect(midiNoteName(69)).toBe('A4')
    expect(midiNoteName(127)).toBe('G9')
    expect(midiNoteName(200)).toBe('')
  })
})
