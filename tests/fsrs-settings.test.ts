import { describe, expect, it } from 'vitest'
import {
  DEFAULT_FUZZ,
  DEFAULT_MAXIMUM_INTERVAL,
  DEFAULT_RETENTION,
  MAXIMUM_INTERVAL_MAX,
  MAXIMUM_INTERVAL_MIN,
  RETENTION_MAX,
  RETENTION_MIN,
  normalizeFuzz,
  normalizeMaximumInterval,
  normalizeRetention,
} from '../src/state/fsrs-settings'
import { DEFAULT_SETTINGS, normalizeSettings } from '../src/state/settings'

describe('F2-045 — Ajustes de retención, fuzz e intervalo máximo', () => {
  it('expone los límites y valores por defecto', () => {
    expect(RETENTION_MIN).toBe(0.8)
    expect(RETENTION_MAX).toBe(0.95)
    expect(DEFAULT_RETENTION).toBe(0.9)
    expect(MAXIMUM_INTERVAL_MIN).toBe(1)
    expect(MAXIMUM_INTERVAL_MAX).toBe(3650)
    expect(DEFAULT_MAXIMUM_INTERVAL).toBe(365)
    expect(DEFAULT_FUZZ).toBe(false)
  })

  it('normaliza la retención al rango 0,80–0,95', () => {
    expect(normalizeRetention(undefined)).toBe(DEFAULT_RETENTION)
    expect(normalizeRetention('0.9')).toBe(DEFAULT_RETENTION)
    expect(normalizeRetention(Number.NaN)).toBe(DEFAULT_RETENTION)
    expect(normalizeRetention(0.7)).toBe(RETENTION_MIN)
    expect(normalizeRetention(0.99)).toBe(RETENTION_MAX)
    expect(normalizeRetention(0.876)).toBe(0.88)
  })

  it('normaliza el intervalo máximo a días enteros', () => {
    expect(normalizeMaximumInterval(undefined)).toBe(DEFAULT_MAXIMUM_INTERVAL)
    expect(normalizeMaximumInterval(Number.POSITIVE_INFINITY)).toBe(DEFAULT_MAXIMUM_INTERVAL)
    expect(normalizeMaximumInterval(0)).toBe(MAXIMUM_INTERVAL_MIN)
    expect(normalizeMaximumInterval(5000)).toBe(MAXIMUM_INTERVAL_MAX)
    expect(normalizeMaximumInterval(12.6)).toBe(13)
  })

  it('solo acepta booleanos para el fuzz', () => {
    expect(normalizeFuzz(true)).toBe(true)
    expect(normalizeFuzz(false)).toBe(false)
    expect(normalizeFuzz('true')).toBe(DEFAULT_FUZZ)
    expect(normalizeFuzz(1)).toBe(DEFAULT_FUZZ)
    expect(normalizeFuzz(undefined)).toBe(DEFAULT_FUZZ)
  })

  it('incluye los ajustes FSRS en los ajustes de la UI', () => {
    expect(DEFAULT_SETTINGS).toMatchObject({
      desiredRetention: DEFAULT_RETENTION,
      maximumInterval: DEFAULT_MAXIMUM_INTERVAL,
      fuzz: DEFAULT_FUZZ,
    })

    expect(
      normalizeSettings({
        desiredRetention: 0.99,
        maximumInterval: 9999,
        fuzz: true,
      }),
    ).toMatchObject({
      desiredRetention: RETENTION_MAX,
      maximumInterval: MAXIMUM_INTERVAL_MAX,
      fuzz: true,
    })
  })
})
