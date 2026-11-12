import { PracticeSessionSchema, type PracticeSession } from '../schemas'
import {
  buildPracticePlan,
  type PracticeBlockKind,
  type PracticeMinutes,
} from './practice-plan'

/**
 * Temporizador del plan de práctica.
 *
 * El estado es puro y avanza de a un segundo: cada bloque acumula los segundos
 * realmente practicados y, al agotar su tiempo, el temporizador pasa al
 * siguiente. Saltar un bloque no regala tiempo: lo practicado hasta ese momento
 * es lo que queda registrado. La sesión termina al agotar el último bloque o
 * cuando el alumno la corta.
 */

export type PracticeTimerStatus = 'idle' | 'running' | 'paused' | 'done'

export interface PracticeTimerBlock {
  kind: PracticeBlockKind
  plannedSeconds: number
  elapsedSeconds: number
}

export interface PracticeTimerState {
  status: PracticeTimerStatus
  plannedMinutes: PracticeMinutes
  current: number
  blocks: PracticeTimerBlock[]
}

/** Crea el temporizador detenido con el reparto de la duración pedida. */
export function createPracticeTimer(minutes: PracticeMinutes): PracticeTimerState {
  const blocks = buildPracticePlan(minutes).map((block) => ({
    kind: block.kind,
    plannedSeconds: block.minutes * 60,
    elapsedSeconds: 0,
  }))
  return {
    status: 'idle',
    plannedMinutes: minutes,
    current: 0,
    blocks,
  }
}

/** Arranca un temporizador detenido o recién creado. */
export function startPracticeTimer(
  state: PracticeTimerState,
): PracticeTimerState {
  if (state.status !== 'idle') return state
  return { ...state, status: 'running' }
}

/** Pausa la sesión sin perder lo practicado. */
export function pausePracticeTimer(
  state: PracticeTimerState,
): PracticeTimerState {
  if (state.status !== 'running') return state
  return { ...state, status: 'paused' }
}

/** Reanuda una sesión pausada. */
export function resumePracticeTimer(
  state: PracticeTimerState,
): PracticeTimerState {
  if (state.status !== 'paused') return state
  return { ...state, status: 'running' }
}

/** Corta la sesión; lo practicado queda en el estado para el registro. */
export function finishPracticeTimer(
  state: PracticeTimerState,
): PracticeTimerState {
  if (state.status === 'done') return state
  return { ...state, status: 'done' }
}

function nextPendingBlock(
  blocks: readonly PracticeTimerBlock[],
  after: number,
): number {
  for (let index = after + 1; index < blocks.length; index += 1) {
    if (blocks[index].elapsedSeconds < blocks[index].plannedSeconds) return index
  }
  return -1
}

/**
 * Salta el bloque actual sin sumarle tiempo.
 *
 * Si ya no quedan bloques pendientes, la sesión termina.
 */
export function skipPracticeBlock(
  state: PracticeTimerState,
): PracticeTimerState {
  if (state.status === 'done') return state
  const current = nextPendingBlock(state.blocks, state.current)
  if (current === -1) {
    return { ...state, status: 'done', current: state.blocks.length - 1 }
  }
  return { ...state, current }
}

function tickOnce(state: PracticeTimerState): PracticeTimerState {
  const block = state.blocks[state.current]
  if (block === undefined) return { ...state, status: 'done' }

  const elapsedSeconds = block.elapsedSeconds + 1
  const blocks = state.blocks.map((candidate, index) =>
    index === state.current ? { ...candidate, elapsedSeconds } : candidate,
  )

  if (elapsedSeconds < block.plannedSeconds) {
    return { ...state, blocks }
  }

  const current = nextPendingBlock(blocks, state.current)
  if (current === -1) {
    return {
      ...state,
      blocks,
      current: blocks.length - 1,
      status: 'done',
    }
  }
  return { ...state, blocks, current }
}

/**
 * Avanza el temporizador los segundos indicados.
 *
 * Con `status` distinto de `running` no cambia nada. Se puede avanzar más de un
 * segundo para probar bloques completos sin esperar en tiempo real.
 */
export function tickPracticeTimer(
  state: PracticeTimerState,
  seconds = 1,
): PracticeTimerState {
  if (state.status !== 'running' || !Number.isFinite(seconds) || seconds <= 0) {
    return state
  }

  let next = state
  const ticks = Math.floor(seconds)
  for (let index = 0; index < ticks && next.status === 'running'; index += 1) {
    next = tickOnce(next)
  }
  return next
}

/** Segundos practicados en todos los bloques. */
export function practicedSeconds(state: PracticeTimerState): number {
  return state.blocks.reduce((sum, block) => sum + block.elapsedSeconds, 0)
}

/** Segundos restantes del bloque actual; 0 al terminar. */
export function remainingSeconds(state: PracticeTimerState): number {
  if (state.status === 'done') return 0
  const block = state.blocks[state.current]
  if (block === undefined) return 0
  return Math.max(0, block.plannedSeconds - block.elapsedSeconds)
}

export interface BuildPracticeSessionInput {
  id: string
  startedAt: Date
  endedAt: Date
  timer: PracticeTimerState
}

/**
 * Convierte el temporizador en la sesión que se guarda en el progreso.
 *
 * `plannedMinutes` sale del plan y los segundos de cada bloque son los
 * realmente practicados, así que cortar la sesión antes de tiempo queda
 * registrado con honestidad.
 */
export function buildPracticeSession(
  input: BuildPracticeSessionInput,
): PracticeSession {
  return PracticeSessionSchema.parse({
    id: input.id,
    startedAt: input.startedAt.toISOString(),
    endedAt: input.endedAt.toISOString(),
    plannedMinutes: input.timer.plannedMinutes,
    blocks: input.timer.blocks.map((block) => ({
      kind: block.kind,
      seconds: block.elapsedSeconds,
    })),
  })
}
