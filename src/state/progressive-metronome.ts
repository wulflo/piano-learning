import {
  clampTempo,
  DEFAULT_TEMPO,
  MAX_TEMPO,
  MIN_TEMPO,
} from '../audio/notes'

/**
 * F5-020 — Metrónomo progresivo.
 *
 * El metrónomo de la app ya mantiene el pulso, pero subir el tempo a mano
 * obliga a mirar el reloj y a decidir cuándo acelerar. Este módulo agrega una
 * capa pura sobre ese metrónomo: cuenta repeticiones completas, sube el BPM en
 * pasos fijos cuando se alcanza la meta de repeticiones y conserva el tempo más
 * alto alcanzado como registro personal.
 *
 * La lógica no toca React ni el motor de audio. La interfaz (o la tarea de
 * teclado) decide cuándo llamar a `completeMetronomeRepetition`, y un helper de
 * persistencia guarda el récord en el progreso de la habilidad.
 */

export const METRONOME_MODES = ['automatic', 'manual'] as const
export type MetronomeMode = (typeof METRONOME_MODES)[number]

/** Rango de tempo que acepta el motor de audio (`clampTempo`). */
export const MIN_PROGRESSIVE_BPM = MIN_TEMPO
export const MAX_PROGRESSIVE_BPM = MAX_TEMPO

/** Cantidad máxima de repeticiones por paso que tiene sentido configurar. */
export const MAX_REPETITIONS_PER_STEP = 20

export interface ProgressiveMetronomeConfig {
  /** Tempo inicial en negras por minuto. */
  startBpm: number
  /** Tempo al que se deja de subir. */
  targetBpm: number
  /** Cuántos BPM sube cada paso. */
  stepBpm: number
  /** Repeticiones completas necesarias antes de cada subida. */
  repetitionsPerStep: number
}

export interface ProgressiveMetronomeState {
  config: ProgressiveMetronomeConfig
  mode: MetronomeMode
  /** Tempo actual del metrónomo. */
  bpm: number
  /** Repeticiones completas acumuladas en el tempo actual. */
  repetitions: number
  /** Tempo más alto alcanzado; es el récord que se persiste. */
  maxBpm: number
  /** `true` cuando el tempo actual llegó al objetivo. */
  targetReached: boolean
}

export const DEFAULT_PROGRESSIVE_METRONOME: ProgressiveMetronomeConfig =
  Object.freeze({
    startBpm: 60,
    targetBpm: 120,
    stepBpm: 4,
    repetitionsPerStep: 2,
  })

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function normalizeBpm(value: unknown, fallback: number): number {
  return isFiniteNumber(value) ? clampTempo(value) : clampTempo(fallback)
}

function normalizeInteger(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
): number {
  if (!isFiniteNumber(value)) return fallback
  return Math.min(max, Math.max(min, Math.round(value)))
}

/**
 * Normaliza una configuración parcial: redondea los enteros, limita el tempo al
 * rango del motor y garantiza que el objetivo nunca quede por debajo del
 * inicio. Nunca lanza; una entrada inválida cae en los valores por defecto.
 */
export function normalizeProgressiveMetronomeConfig(
  input: Partial<ProgressiveMetronomeConfig> = {},
): ProgressiveMetronomeConfig {
  const startBpm = normalizeBpm(
    input.startBpm,
    DEFAULT_PROGRESSIVE_METRONOME.startBpm,
  )
  const rawTarget = normalizeBpm(
    input.targetBpm,
    Math.max(DEFAULT_PROGRESSIVE_METRONOME.targetBpm, startBpm),
  )
  const stepBpm = normalizeInteger(
    input.stepBpm,
    DEFAULT_PROGRESSIVE_METRONOME.stepBpm,
    1,
    MAX_PROGRESSIVE_BPM - MIN_PROGRESSIVE_BPM,
  )
  const repetitionsPerStep = normalizeInteger(
    input.repetitionsPerStep,
    DEFAULT_PROGRESSIVE_METRONOME.repetitionsPerStep,
    1,
    MAX_REPETITIONS_PER_STEP,
  )
  return {
    startBpm,
    targetBpm: Math.max(startBpm, rawTarget),
    stepBpm,
    repetitionsPerStep,
  }
}

export interface CreateProgressiveMetronomeOptions {
  mode?: MetronomeMode
  /** Récord ya guardado; solo se usa si supera al tempo inicial. */
  maxBpm?: number
}

/** Crea el metrónomo detenido en su tempo inicial. */
export function createProgressiveMetronome(
  config: Partial<ProgressiveMetronomeConfig> = {},
  options: CreateProgressiveMetronomeOptions = {},
): ProgressiveMetronomeState {
  const normalized = normalizeProgressiveMetronomeConfig(config)
  const storedMax = isFiniteNumber(options.maxBpm)
    ? clampTempo(options.maxBpm)
    : normalized.startBpm
  return {
    config: normalized,
    mode: options.mode ?? 'automatic',
    bpm: normalized.startBpm,
    repetitions: 0,
    maxBpm: Math.max(normalized.startBpm, storedMax),
    targetReached: normalized.startBpm >= normalized.targetBpm,
  }
}

function withTempo(
  state: ProgressiveMetronomeState,
  bpm: number,
  repetitions: number,
): ProgressiveMetronomeState {
  const clamped = clampTempo(bpm)
  return {
    ...state,
    bpm: clamped,
    repetitions,
    maxBpm: Math.max(state.maxBpm, clamped),
    targetReached: clamped >= state.config.targetBpm,
  }
}

/**
 * Marca una repetición completa.
 *
 * En modo automático, al llegar a `repetitionsPerStep` sube el tempo un paso
 * sin pasar del objetivo. En modo manual solo cuenta la repetición: el usuario
 * decide cuándo cambiar el tempo. Si ya se alcanzó el objetivo, el BPM no sube
 * más y el contador vuelve a cero para no crecer sin límite.
 */
export function completeMetronomeRepetition(
  state: ProgressiveMetronomeState,
): ProgressiveMetronomeState {
  if (state.bpm >= state.config.targetBpm) {
    return { ...state, repetitions: 0, targetReached: true }
  }
  const repetitions = state.repetitions + 1
  if (state.mode === 'manual') {
    return { ...state, repetitions, targetReached: false }
  }
  if (repetitions < state.config.repetitionsPerStep) {
    return { ...state, repetitions, targetReached: false }
  }
  const nextBpm = Math.min(
    state.config.targetBpm,
    state.bpm + state.config.stepBpm,
  )
  return withTempo(state, nextBpm, 0)
}

/**
 * Fallback manual: fija el tempo directamente. Sirve cuando el alumno quiere
 * saltar un paso, bajar para corregir o practicar por fuera de la progresión.
 * El récord solo sube, nunca baja.
 */
export function setMetronomeTempo(
  state: ProgressiveMetronomeState,
  bpm: number,
): ProgressiveMetronomeState {
  const value = isFiniteNumber(bpm) ? clampTempo(bpm) : state.bpm
  return withTempo(state, value, 0)
}

/** Cambia entre subida automática y control manual sin tocar el tempo. */
export function setMetronomeMode(
  state: ProgressiveMetronomeState,
  mode: MetronomeMode,
): ProgressiveMetronomeState {
  if (!METRONOME_MODES.includes(mode)) return state
  return { ...state, mode }
}

export interface ResetMetronomeOptions {
  /** Conserva el récord alcanzado (por defecto) o lo reinicia con el tempo. */
  keepMaxBpm?: boolean
}

/** Vuelve al tempo inicial y borra las repeticiones del paso actual. */
export function resetMetronome(
  state: ProgressiveMetronomeState,
  options: ResetMetronomeOptions = {},
): ProgressiveMetronomeState {
  const keepMaxBpm = options.keepMaxBpm ?? true
  const startBpm = state.config.startBpm
  return {
    ...state,
    bpm: startBpm,
    repetitions: 0,
    maxBpm: keepMaxBpm
      ? Math.max(state.maxBpm, startBpm)
      : startBpm,
    targetReached: startBpm >= state.config.targetBpm,
  }
}

/**
 * Progreso hacia el objetivo, de 0 a 1. Si el inicio y el objetivo coinciden se
 * considera completo. Se usa para la barra o el texto de avance de la UI.
 */
export function metronomeProgress(state: ProgressiveMetronomeState): number {
  const { startBpm, targetBpm } = state.config
  if (targetBpm <= startBpm) return 1
  const progress = (state.bpm - startBpm) / (targetBpm - startBpm)
  return Math.min(1, Math.max(0, progress))
}

/** Repeticiones que faltan para la próxima subida; 0 si ya está en el objetivo. */
export function repetitionsUntilIncrease(
  state: ProgressiveMetronomeState,
): number {
  if (state.bpm >= state.config.targetBpm) return 0
  if (state.mode === 'manual') return state.config.repetitionsPerStep
  return Math.max(0, state.config.repetitionsPerStep - state.repetitions)
}

/** Etiqueta del modo para mensajes o pruebas de interfaz. */
export function metronomeModeLabel(
  mode: MetronomeMode,
  language: 'es' | 'en' = 'es',
): string {
  if (language === 'en') {
    return mode === 'automatic' ? 'Automatic' : 'Manual'
  }
  return mode === 'automatic' ? 'Automático' : 'Manual'
}

/** Tempo por defecto usado cuando no hay configuración explícita. */
export const DEFAULT_PROGRESSIVE_TEMPO = clampTempo(DEFAULT_TEMPO)
