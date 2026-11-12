import { describe, expect, it } from 'vitest'
import {
  accidentalToNumber,
  enharmonicSpellings,
  formatPitch,
  fromSpelledPitch,
  isMidiInRange,
  midiOf,
  parsePitch,
  pitchClass,
  pitchFromMidi,
  samePitch,
  toSpelledPitch,
  transposePitch,
} from '../src/theory/pitch'

describe('Pitch y notación interna', () => {
  it('convierte Do central a MIDI 60 y vuelve', () => {
    const c4 = parsePitch('C4')
    expect(midiOf(c4)).toBe(60)
    expect(formatPitch(pitchFromMidi(60))).toBe('C4')
    expect(pitchClass(c4)).toBe(0)
  })

  it('hace ida y vuelta MIDI↔nombre en todo el rango', () => {
    for (let midi = 0; midi <= 127; midi += 1) {
      expect(midiOf(pitchFromMidi(midi))).toBe(midi)
    }
  })

  it('acepta octavas negativas y límites 0-127', () => {
    expect(midiOf(parsePitch('C-1'))).toBe(0)
    expect(midiOf(parsePitch('G9'))).toBe(127)
    expect(() => parsePitch('C-2')).not.toThrow()
    expect(() => midiOf(parsePitch('C-2'))).toThrow(/rango/i)
    expect(() => midiOf(parsePitch('A9'))).toThrow(/rango/i)
    expect(isMidiInRange(0)).toBe(true)
    expect(isMidiInRange(127)).toBe(true)
    expect(isMidiInRange(128)).toBe(false)
  })

  it('parsea alteraciones dobles y formato latino de entrada', () => {
    expect(accidentalToNumber('bb')).toBe(-2)
    expect(accidentalToNumber('##')).toBe(2)
    expect(midiOf(parsePitch('Bbb4'))).toBe(69)
    expect(formatPitch(parsePitch('Cx4'))).toBe('C##4')
  })

  it('respeta la enarmonía preferida al convertir MIDI', () => {
    expect(formatPitch(pitchFromMidi(61, { step: 'D', accidental: -1 }))).toBe('Db4')
    expect(formatPitch(pitchFromMidi(61, { step: 'C', accidental: 1 }))).toBe('C#4')
    expect(formatPitch(pitchFromMidi(59, { step: 'C', accidental: -1 }))).toBe('Cb4')
  })

  it('transpone y compara notas', () => {
    expect(formatPitch(transposePitch(parsePitch('C4'), 7))).toBe('G4')
    expect(formatPitch(transposePitch(parsePitch('B4'), 1))).toBe('C5')
    expect(samePitch(parsePitch('C#4'), parsePitch('Db4'))).toBe(true)
    expect(samePitch(parsePitch('C4'), parsePitch('D4'))).toBe(false)
  })

  it('convierte a y desde el esquema compartido', () => {
    const spelled = toSpelledPitch(parsePitch('Eb4'))
    expect(spelled).toEqual({ step: 'E', accidental: 'b', octave: 4 })
    expect(formatPitch(fromSpelledPitch(spelled))).toBe('Eb4')
  })

  it('ofrece enarmonías sin dobles alteraciones', () => {
    const spellings = enharmonicSpellings(parsePitch('C#4')).map(formatPitch)
    expect(spellings).toContain('C#4')
    expect(spellings).toContain('Db4')
  })
})
