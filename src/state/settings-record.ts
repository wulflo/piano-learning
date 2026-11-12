import { SettingsSchema, type Settings as ProgressSettings } from '../schemas'
import { normalizeSettings, type Settings } from './settings'

/**
 * Puente entre los ajustes de la interfaz y los ajustes persistidos.
 *
 * La UI usa decibelios y `language`, mientras que el progreso exportable usa
 * ganancia lineal (0–1) y `locale`. Este módulo traduce en ambos sentidos sin
 * tocar la base ni el contexto de React, para que la conversión se pueda
 * probar por separado.
 *
 * La tabla `settings` no guarda el mapa de teclas de la computadora: es una
 * preferencia local que se conserva en `localStorage`. El resto de los campos
 * sí viaja en la exportación y sobrevive a una importación.
 */

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** Convierte decibelios a una ganancia lineal entre 0 y 1. */
export function dbToGain(db: number): number {
  if (!Number.isFinite(db)) return 0
  return clamp(10 ** (db / 20), 0, 1)
}

/** Convierte una ganancia lineal a decibelios, redondeados a un decimal. */
export function gainToDb(gain: number): number {
  if (!Number.isFinite(gain) || gain <= 0) return -40
  return Math.round(clamp(20 * Math.log10(gain), -40, 0) * 10) / 10
}

/** Ajustes de la UI a partir de la fila persistida. */
export function settingsFromRecord(
  record: ProgressSettings,
  computerKeys?: Record<string, number>,
): Settings {
  return normalizeSettings({
    notation: record.notation,
    language: record.locale,
    theme: record.theme,
    volumeDb: gainToDb(record.audioVolume),
    tempo: record.tempoBpm,
    desiredRetention: record.desiredRetention,
    maximumInterval: record.maximumInterval,
    fuzz: record.fuzz,
    newPerDay: record.newPerDay,
    midiEnabled: record.midiEnabled,
    showFingering: record.showFingering,
    ...(computerKeys === undefined ? {} : { computerKeys }),
  })
}

/** Fila persistida a partir de los ajustes de la UI. */
export function settingsToRecord(settings: Settings): ProgressSettings {
  return SettingsSchema.parse({
    notation: settings.notation,
    locale: settings.language,
    theme: settings.theme,
    desiredRetention: settings.desiredRetention,
    maximumInterval: settings.maximumInterval,
    fuzz: settings.fuzz,
    newPerDay: settings.newPerDay,
    audioVolume: dbToGain(settings.volumeDb),
    tempoBpm: settings.tempo,
    midiEnabled: settings.midiEnabled,
    showFingering: settings.showFingering,
  })
}
