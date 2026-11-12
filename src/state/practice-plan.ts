import type { PracticeSession } from '../schemas'

/**
 * Plan de práctica diario de 15, 30 o 45 minutos.
 *
 * Cada duración reparte el tiempo entre los cinco bloques del método:
 * calentamiento, técnica, teoría, repertorio y repaso. El reparto es fijo y
 * suma exactamente la duración pedida, de modo que el temporizador y el
 * registro de la sesión usan los mismos números.
 *
 * El módulo es puro: no toca React ni la base de datos.
 */

export type PracticeBlockKind = PracticeSession['blocks'][number]['kind']

export const PRACTICE_BLOCK_KINDS: readonly PracticeBlockKind[] = Object.freeze([
  'warmup',
  'technique',
  'theory',
  'repertoire',
  'review',
])

export const PRACTICE_DURATIONS = [15, 30, 45] as const
export type PracticeMinutes = (typeof PRACTICE_DURATIONS)[number]

/** Bloque del plan con su duración en minutos. */
export interface PracticeBlockPlan {
  kind: PracticeBlockKind
  minutes: number
}

const PLANS: Readonly<
  Record<PracticeMinutes, readonly PracticeBlockPlan[]>
> = {
  15: [
    { kind: 'warmup', minutes: 3 },
    { kind: 'technique', minutes: 4 },
    { kind: 'theory', minutes: 3 },
    { kind: 'repertoire', minutes: 3 },
    { kind: 'review', minutes: 2 },
  ],
  30: [
    { kind: 'warmup', minutes: 5 },
    { kind: 'technique', minutes: 8 },
    { kind: 'theory', minutes: 6 },
    { kind: 'repertoire', minutes: 7 },
    { kind: 'review', minutes: 4 },
  ],
  45: [
    { kind: 'warmup', minutes: 7 },
    { kind: 'technique', minutes: 12 },
    { kind: 'theory', minutes: 9 },
    { kind: 'repertoire', minutes: 11 },
    { kind: 'review', minutes: 6 },
  ],
}

/** Indica si un número es una duración de práctica admitida. */
export function isPracticeMinutes(value: number): value is PracticeMinutes {
  return (PRACTICE_DURATIONS as readonly number[]).includes(value)
}

/** Reparto de bloques para una duración admitida. */
export function buildPracticePlan(
  minutes: PracticeMinutes,
): PracticeBlockPlan[] {
  const plan = PLANS[minutes]
  if (plan === undefined) {
    throw new RangeError(
      `Duración de práctica no admitida: ${String(minutes)}; usá 15, 30 o 45`,
    )
  }
  return plan.map((block) => ({ ...block }))
}

/** Suma de minutos de un plan; sirve para comprobar el reparto. */
export function totalPlanMinutes(
  plan: readonly PracticeBlockPlan[],
): number {
  return plan.reduce((sum, block) => sum + block.minutes, 0)
}

let sessionCounter = 0

/**
 * Identificador estable para una sesión de práctica.
 *
 * Se genera una sola vez al empezar y se reutiliza al reintentar el guardado,
 * para que un reintento no cree una sesión duplicada.
 */
export function createPracticeSessionId(now: Date = new Date()): string {
  sessionCounter += 1
  return `session.${now.getTime().toString(36)}.${sessionCounter.toString(36)}`
}
