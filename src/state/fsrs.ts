import { DefaultScheduler, Rating, type Grade, type State } from 'ts-fsrs'
import {
  FsrsCardSchema,
  ReviewLogSchema,
  type FsrsCard,
  type FsrsState,
  type ReviewLog,
  type ReviewRating,
  type Settings as ProgressSettings,
} from '../schemas'
import {
  DEFAULT_FUZZ,
  DEFAULT_MAXIMUM_INTERVAL,
  DEFAULT_RETENTION,
} from './fsrs-settings'

/**
 * Wrapper tipado sobre `ts-fsrs` para el scheduler de repaso FSRS.
 *
 * El scheduler se construye con parámetros por defecto editables (retención y
 * intervalo máximo) y se traduce el estado interno del scheduler a las tarjetas
 * y registros de revisión persistidos por la app.
 */

/** Parámetros de FSRS elegidos por el usuario y persistidos en ajustes. */
export interface FsrsSchedulerParams {
  /** Retención deseada entre 0,80 y 0,95. */
  desiredRetention: number
  /** Intervalo máximo de repaso en días. */
  maximumInterval: number
  /** Añade variación determinista a los intervalos largos. */
  fuzz: boolean
}

/** Valores por defecto de FSRS para una instalación nueva. */
export const DEFAULT_FSRS_PARAMS: Readonly<FsrsSchedulerParams> = Object.freeze({
  desiredRetention: DEFAULT_RETENTION,
  maximumInterval: DEFAULT_MAXIMUM_INTERVAL,
  fuzz: DEFAULT_FUZZ,
})

/** Deriva los parámetros del scheduler desde los ajustes de progreso persistidos. */
export function fsrsParamsFromSettings(
  settings: Pick<ProgressSettings, 'desiredRetention' | 'maximumInterval' | 'fuzz'>,
): FsrsSchedulerParams {
  return {
    desiredRetention: settings.desiredRetention,
    maximumInterval: settings.maximumInterval,
    fuzz: settings.fuzz,
  }
}

/** Contexto opcional de la respuesta que se guarda en el registro de revisión. */
export interface FsrsReviewContext {
  /** Formato en que se practicó el ítem. */
  format?: 'see' | 'hear' | 'spell' | 'play'
  /** Duración de la respuesta en milisegundos. */
  durationMs?: number
  /** Indica si la respuesta se dio con pista. */
  usedHint?: boolean
}

/** Resultado de calificar un ítem: tarjeta persistida y registro de revisión. */
export interface FsrsReviewResult {
  card: FsrsCard
  log: ReviewLog
}

/** Instancia del scheduler devuelta por `ts-fsrs` para FSRS-6. */
export type FsrsScheduler = Awaited<ReturnType<typeof DefaultScheduler<'FSRS-6'>>>

/** Tarjeta interna del scheduler antes de persistirse. */
interface FsrsRawCard {
  state: State
  scheduleStatus: 'new' | 'learning' | 'review'
  dueAt: Date
  lastReviewAt: Date | null
  stability: number
  difficulty: number
  cardId: string | number
  reps: number
  lapses: number
  scheduledDays: number
  learningStep: number
}

/** Registro interno de revisión devuelto por `ts-fsrs` al calificar. */
interface FsrsRawRevlog {
  state: State
  rating: number
  stability: number
  difficulty: number
  dueAt: Date
  lastReviewAt: Date | null
  reviewTime: Date
  scheduleStatus: 'new' | 'learning' | 'review'
  cardId: string | number
  scheduledDays: number
  learningStep: number
}

const STATE_NUMBER_BY_NAME: Readonly<Record<FsrsState, State>> = Object.freeze({
  new: 0,
  learning: 1,
  review: 2,
  relearning: 3,
})

const STATE_BY_NUMBER: Readonly<Record<State, FsrsState>> = Object.freeze({
  0: 'new',
  1: 'learning',
  2: 'review',
  3: 'relearning',
})

const RATING_BY_NUMBER: Readonly<Record<number, ReviewRating>> = Object.freeze({
  1: 'again',
  2: 'hard',
  3: 'good',
  4: 'easy',
})

const NUMBER_BY_RATING: Readonly<Record<ReviewRating, Grade>> = Object.freeze({
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
})

function toState(value: State): FsrsState {
  const state = STATE_BY_NUMBER[value]
  if (!state) {
    throw new Error(`Estado de FSRS desconocido: ${value}`)
  }
  return state
}

function toReviewRating(value: number): ReviewRating {
  const rating = RATING_BY_NUMBER[value]
  if (!rating) {
    throw new Error(`Calificación de FSRS desconocida: ${value}`)
  }
  return rating
}

function elapsedDaysBetween(lastReviewAt: Date | null, now: Date): number {
  if (lastReviewAt === null) {
    return 0
  }
  return Math.max(0, Math.floor((now.getTime() - lastReviewAt.getTime()) / 86_400_000))
}

function toPersistedCard(card: FsrsRawCard, now: Date): FsrsCard {
  const parsed = FsrsCardSchema.parse({
    due: card.dueAt.toISOString(),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsedDays: elapsedDaysBetween(card.lastReviewAt, now),
    scheduledDays: card.scheduledDays,
    reps: card.reps,
    lapses: card.lapses,
    state: toState(card.state),
    learningStep: card.learningStep,
    lastReview: card.lastReviewAt === null ? undefined : card.lastReviewAt.toISOString(),
  })
  return parsed
}

function toPersistedLog(
  itemId: string,
  revlog: FsrsRawRevlog,
  card: FsrsRawCard,
  rating: ReviewRating,
  now: Date,
  context: FsrsReviewContext | undefined,
): ReviewLog {
  const parsed = ReviewLogSchema.parse({
    id: `${itemId}.log.${now.getTime()}`,
    itemId,
    reviewedAt: revlog.reviewTime.toISOString(),
    rating,
    elapsedDays: elapsedDaysBetween(card.lastReviewAt, now),
    scheduledDays: card.scheduledDays,
    stability: card.stability,
    difficulty: card.difficulty,
    state: toState(card.state),
    durationMs: context?.durationMs,
    usedHint: context?.usedHint ?? false,
    format: context?.format,
  })
  return parsed
}

export async function createFsrsScheduler(
  params: FsrsSchedulerParams = DEFAULT_FSRS_PARAMS,
): Promise<FsrsScheduler> {
  return DefaultScheduler({
    version: 'FSRS-6',
    desiredRetention: params.desiredRetention,
    maximumInterval: params.maximumInterval,
    enableFuzz: params.fuzz,
  })
}

export async function createFsrsItemCard(
  itemId: string,
  params: FsrsSchedulerParams = DEFAULT_FSRS_PARAMS,
  now: Date = new Date(),
): Promise<FsrsCard> {
  const scheduler = await createFsrsScheduler(params)
  const card = scheduler.newCard({ now, cardId: itemId })
  return toPersistedCard(card, now)
}

export async function gradeFsrsItem(params: {
  itemId: string
  card: FsrsCard
  rating: ReviewRating
  now: Date
  context?: FsrsReviewContext
  fsrsParams?: FsrsSchedulerParams
}): Promise<FsrsReviewResult> {
  const fsrsParams = params.fsrsParams ?? DEFAULT_FSRS_PARAMS
  const scheduler = await createFsrsScheduler(fsrsParams)
  const rawCard: FsrsRawCard = {
    state: STATE_NUMBER_BY_NAME[params.card.state],
    scheduleStatus: scheduleStatusFor(params.card.state),
    dueAt: new Date(params.card.due),
    lastReviewAt: params.card.lastReview ? new Date(params.card.lastReview) : null,
    stability: params.card.stability,
    difficulty: params.card.difficulty,
    cardId: params.itemId,
    reps: params.card.reps,
    lapses: params.card.lapses,
    scheduledDays: params.card.scheduledDays,
    learningStep: params.card.learningStep,
  }
  const result = await scheduler.review({
    card: rawCard,
    grade: NUMBER_BY_RATING[params.rating],
    now: params.now,
  })
  const log = toPersistedLog(
    params.itemId,
    result.revlog,
    result.card,
    toReviewRating(result.revlog.rating),
    params.now,
    params.context,
  )
  const card = toPersistedCard(result.card, params.now)
  return { card, log }
}

function scheduleStatusFor(state: FsrsState): FsrsRawCard['scheduleStatus'] {
  if (state === 'new') return 'new'
  return state === 'review' ? 'review' : 'learning'
}
