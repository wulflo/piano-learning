/**
 * Motor de sesiones auditivas con dificultad adaptativa.
 *
 * Una sesión recorre una cantidad fija de ítems (10 por defecto). Cada ítem
 * declara su dificultad de 1 a 5 y la sesión elige el más cercano a su nivel
 * actual, sin repetir ítems mientras queden candidatos sin usar. Los aciertos
 * consecutivos suben un nivel y los errores consecutivos lo bajan, con topes
 * configurables.
 *
 * El módulo es puro: no toca React, audio ni la base de datos. La selección usa
 * una semilla, de modo que la misma lista de ítems, la misma semilla y las
 * mismas respuestas producen exactamente la misma secuencia. Eso permite
 * testear el motor y, más adelante, reproducir una sesión.
 */

/** Cantidad de ítems de una sesión completa. */
export const EAR_SESSION_LENGTH = 10

export const EAR_MIN_DIFFICULTY = 1
export const EAR_MAX_DIFFICULTY = 5

/** Nivel con el que empieza una sesión si no se indica otro. */
export const DEFAULT_EAR_START_DIFFICULTY = 2

/** Aciertos consecutivos necesarios para subir un nivel. */
export const DEFAULT_EAR_PROMOTE_AFTER = 2

/** Errores consecutivos necesarios para bajar un nivel. */
export const DEFAULT_EAR_DEMOTE_AFTER = 2

/** Semilla por defecto; cambiarla cambia el orden de los ítems. */
export const DEFAULT_EAR_SEED = 1

/** Ítem mínimo que necesita el motor: identidad y dificultad. */
export interface EarSessionItem {
  id: string
  /** Dificultad del ítem, de 1 (fácil) a 5 (difícil). */
  difficulty: number
  /** Categoría opcional para agrupar o intercalar tipos de dictado. */
  kind?: string
}

export interface EarSessionOptions {
  /** Cantidad de ítems de la sesión; por defecto 10. */
  length?: number
  /** Semilla de selección; el mismo valor produce la misma secuencia. */
  seed?: number
  /** Nivel inicial, acotado entre `minDifficulty` y `maxDifficulty`. */
  startDifficulty?: number
  minDifficulty?: number
  maxDifficulty?: number
  /** Aciertos consecutivos para subir un nivel. */
  promoteAfter?: number
  /** Errores consecutivos para bajar un nivel. */
  demoteAfter?: number
}

/** Respuesta registrada al corregir un ítem de la sesión. */
export interface EarSessionAnswer<T extends EarSessionItem> {
  /** Ítem que se respondió. */
  item: T
  /** Nivel de la sesión en el momento de responder. */
  difficulty: number
  correct: boolean
  /** Posición del ítem dentro de la sesión, desde 0. */
  index: number
}

export interface EarSessionState<T extends EarSessionItem> {
  readonly items: readonly T[]
  readonly length: number
  readonly difficulty: number
  readonly minDifficulty: number
  readonly maxDifficulty: number
  readonly promoteAfter: number
  readonly demoteAfter: number
  readonly seed: number
  /** Posición del próximo ítem, desde 0. */
  readonly index: number
  /** Ítem actual, o `null` cuando la sesión terminó. */
  readonly current: T | null
  readonly answers: readonly EarSessionAnswer<T>[]
  readonly correctStreak: number
  readonly wrongStreak: number
  readonly usedIds: readonly string[]
  readonly finished: boolean
}

export interface EarSessionSummary {
  /** Ítems respondidos. */
  answered: number
  correct: number
  incorrect: number
  /** Proporción de aciertos entre 0 y 1; 0 si todavía no hay respuestas. */
  accuracy: number
  /** Nivel de la sesión al terminar o al momento de consultar. */
  finalDifficulty: number
  /** Indica si se respondieron todos los ítems. */
  finished: boolean
}

function createRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296
  }
}

function integerOption(
  value: number | undefined,
  fallback: number,
  min: number,
): number {
  if (value === undefined || !Number.isFinite(value)) return fallback
  return Math.max(min, Math.floor(value))
}

function clampDifficulty(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, Math.round(value)))
}

function normalizeSeed(seed: number | undefined): number {
  if (seed === undefined || !Number.isFinite(seed)) return DEFAULT_EAR_SEED
  return seed >>> 0
}

/** Candidatos sin usar más cercanos al nivel pedido. */
function nearestCandidates<T extends EarSessionItem>(
  items: readonly T[],
  usedIds: readonly string[],
  target: number,
): T[] {
  const used = new Set(usedIds)
  const unused = items.filter((item) => !used.has(item.id))
  const pool = unused.length > 0 ? unused : items
  const distances = pool.map((item) =>
    Math.abs(clampDifficulty(item.difficulty, EAR_MIN_DIFFICULTY, EAR_MAX_DIFFICULTY) - target),
  )
  const closest = Math.min(...distances)
  return pool.filter((_, index) => distances[index] === closest)
}

/**
 * Elige un ítem de forma determinista. La semilla se combina con la posición
 * para que dos sesiones iguales recorran la misma secuencia sin compartir
 * estado mutable.
 */
function pickItem<T extends EarSessionItem>(
  items: readonly T[],
  usedIds: readonly string[],
  target: number,
  seed: number,
  index: number,
): T {
  const candidates = nearestCandidates(items, usedIds, target)
  const random = createRandom(seed + Math.imul(index + 1, 0x9e3779b9))
  const choice = candidates[Math.floor(random() * candidates.length)]
  return choice ?? items[0]
}

/**
 * Crea una sesión auditiva lista para el primer ítem.
 *
 * @throws RangeError si la lista de ítems está vacía.
 */
export function createEarSession<T extends EarSessionItem>(
  items: readonly T[],
  options: EarSessionOptions = {},
): EarSessionState<T> {
  if (items.length === 0) {
    throw new RangeError('La sesión auditiva necesita al menos un ítem')
  }

  const minDifficulty = clampDifficulty(
    options.minDifficulty ?? EAR_MIN_DIFFICULTY,
    EAR_MIN_DIFFICULTY,
    EAR_MAX_DIFFICULTY,
  )
  const maxDifficulty = Math.max(
    minDifficulty,
    clampDifficulty(
      options.maxDifficulty ?? EAR_MAX_DIFFICULTY,
      EAR_MIN_DIFFICULTY,
      EAR_MAX_DIFFICULTY,
    ),
  )
  const difficulty = clampDifficulty(
    options.startDifficulty ?? DEFAULT_EAR_START_DIFFICULTY,
    minDifficulty,
    maxDifficulty,
  )
  const length = integerOption(options.length, EAR_SESSION_LENGTH, 1)
  const seed = normalizeSeed(options.seed)
  const current = pickItem(items, [], difficulty, seed, 0)

  return {
    items,
    length,
    difficulty,
    minDifficulty,
    maxDifficulty,
    promoteAfter: integerOption(
      options.promoteAfter,
      DEFAULT_EAR_PROMOTE_AFTER,
      1,
    ),
    demoteAfter: integerOption(
      options.demoteAfter,
      DEFAULT_EAR_DEMOTE_AFTER,
      1,
    ),
    seed,
    index: 0,
    current,
    answers: [],
    correctStreak: 0,
    wrongStreak: 0,
    usedIds: [current.id],
    finished: false,
  }
}

/**
 * Registra la respuesta del ítem actual y prepara el siguiente.
 *
 * La respuesta guarda el nivel con el que se respondió, no el nivel nuevo: así
 * el resumen refleja la dificultad real de cada ítem. Un acierto sube el nivel
 * al llegar a `promoteAfter` aciertos consecutivos y un error lo baja al llegar
 * a `demoteAfter` errores consecutivos. Al responder el último ítem la sesión
 * queda terminada y `current` pasa a `null`.
 */
export function answerEarSession<T extends EarSessionItem>(
  state: EarSessionState<T>,
  correct: boolean,
): EarSessionState<T> {
  if (state.finished || state.current === null) return state

  const answers = [
    ...state.answers,
    {
      item: state.current,
      difficulty: state.difficulty,
      correct,
      index: state.index,
    },
  ]

  let difficulty = state.difficulty
  let correctStreak = correct ? state.correctStreak + 1 : 0
  let wrongStreak = correct ? 0 : state.wrongStreak + 1

  if (correct && correctStreak >= state.promoteAfter) {
    difficulty = Math.min(state.maxDifficulty, difficulty + 1)
    correctStreak = 0
  } else if (!correct && wrongStreak >= state.demoteAfter) {
    difficulty = Math.max(state.minDifficulty, difficulty - 1)
    wrongStreak = 0
  }

  const index = state.index + 1
  if (index >= state.length) {
    return {
      ...state,
      answers,
      difficulty,
      correctStreak,
      wrongStreak,
      index,
      current: null,
      finished: true,
    }
  }

  const current = pickItem(
    state.items,
    state.usedIds,
    difficulty,
    state.seed,
    index,
  )

  return {
    ...state,
    answers,
    difficulty,
    correctStreak,
    wrongStreak,
    index,
    current,
    usedIds: [...state.usedIds, current.id],
  }
}

/** Resumen de aciertos y nivel para mostrar al cerrar la sesión. */
export function earSessionSummary<T extends EarSessionItem>(
  state: EarSessionState<T>,
): EarSessionSummary {
  const answered = state.answers.length
  const correct = state.answers.filter((answer) => answer.correct).length
  return {
    answered,
    correct,
    incorrect: answered - correct,
    accuracy: answered === 0 ? 0 : correct / answered,
    finalDifficulty: state.difficulty,
    finished: state.finished,
  }
}
