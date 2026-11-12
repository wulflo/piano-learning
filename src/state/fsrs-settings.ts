/**
 * Límites y normalización de los ajustes de planificación FSRS.
 *
 * Vive aparte del wrapper de `ts-fsrs` para que la UI pueda validar los ajustes
 * sin cargar el scheduler en el bundle.
 */

export const RETENTION_MIN = 0.8
export const RETENTION_MAX = 0.95
export const DEFAULT_RETENTION = 0.9

export const MAXIMUM_INTERVAL_MIN = 1
export const MAXIMUM_INTERVAL_MAX = 3650
export const DEFAULT_MAXIMUM_INTERVAL = 365

export const DEFAULT_FUZZ = false

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** Normaliza la retención deseada al rango 0,80–0,95 con dos decimales. */
export function normalizeRetention(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_RETENTION
  }
  return Math.round(clamp(value, RETENTION_MIN, RETENTION_MAX) * 100) / 100
}

/** Normaliza el intervalo máximo a un entero entre 1 y 3650 días. */
export function normalizeMaximumInterval(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_MAXIMUM_INTERVAL
  }
  return clamp(Math.round(value), MAXIMUM_INTERVAL_MIN, MAXIMUM_INTERVAL_MAX)
}

/** Solo un booleano `true` activa el fuzz; el resto cae en el valor por defecto. */
export function normalizeFuzz(value: unknown): boolean {
  return typeof value === 'boolean' ? value : DEFAULT_FUZZ
}
