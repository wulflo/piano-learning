import { describe, expect, it } from 'vitest'
import { SettingsSchema } from '../src/schemas'
import {
  DEFAULT_SETTINGS,
  normalizeSettings,
} from '../src/state/settings'
import {
  dbToGain,
  gainToDb,
  settingsFromRecord,
  settingsToRecord,
} from '../src/state/settings-record'

describe('F2-063 — Puente de ajustes UI ↔ progreso', () => {
  it('convierte decibelios y ganancia dentro de los límites', () => {
    expect(dbToGain(0)).toBe(1)
    expect(dbToGain(-40)).toBeCloseTo(0.01, 10)
    expect(dbToGain(-1000)).toBeLessThan(0.0001)
    expect(dbToGain(Number.NaN)).toBe(0)

    expect(gainToDb(1)).toBe(0)
    expect(gainToDb(0)).toBe(-40)
    expect(gainToDb(0.4)).toBe(-8)
    expect(gainToDb(0.25)).toBe(-12)
  })

  it('traduce una fila persistida a los ajustes de la interfaz', () => {
    const record = SettingsSchema.parse({
      notation: 'do',
      locale: 'en',
      theme: 'dark',
      desiredRetention: 0.85,
      maximumInterval: 120,
      fuzz: true,
      newPerDay: 7,
      audioVolume: 0.25,
      tempoBpm: 120,
      midiEnabled: true,
    })

    const settings = settingsFromRecord(record, { a: 60 })

    expect(settings).toMatchObject({
      notation: 'do',
      language: 'en',
      theme: 'dark',
      volumeDb: -12,
      tempo: 120,
      desiredRetention: 0.85,
      maximumInterval: 120,
      fuzz: true,
      newPerDay: 7,
      midiEnabled: true,
      computerKeys: { a: 60 },
    })
  })

  it('conserva las teclas actuales si la fila no las incluye', () => {
    const record = SettingsSchema.parse({})

    expect(settingsFromRecord(record)).toEqual(
      normalizeSettings({
        ...DEFAULT_SETTINGS,
        notation: 'do',
        volumeDb: -8,
      }),
    )
  })

  it('traduce los ajustes de la interfaz a la fila persistida', () => {
    const record = settingsToRecord({
      ...DEFAULT_SETTINGS,
      language: 'en',
      theme: 'light',
      volumeDb: -20,
      tempo: 132,
      desiredRetention: 0.92,
      maximumInterval: 90,
      fuzz: true,
      newPerDay: 3,
      midiEnabled: true,
    })

    expect(record).toEqual({
      notation: 'c',
      locale: 'en',
      theme: 'light',
      desiredRetention: 0.92,
      maximumInterval: 90,
      fuzz: true,
      newPerDay: 3,
      audioVolume: dbToGain(-20),
      tempoBpm: 132,
      midiEnabled: true,
      showFingering: true,
    })
  })

  it('hace ida y vuelta sin perder los campos compartidos', () => {
    const settings = normalizeSettings({
      ...DEFAULT_SETTINGS,
      notation: 'do',
      language: 'en',
      theme: 'dark',
      volumeDb: -8,
      tempo: 96,
      desiredRetention: 0.88,
      maximumInterval: 180,
      fuzz: true,
      newPerDay: 12,
      midiEnabled: true,
      computerKeys: { q: 60, w: 61 },
    })

    expect(settingsFromRecord(settingsToRecord(settings), settings.computerKeys)).toEqual(
      settings,
    )
  })
})
