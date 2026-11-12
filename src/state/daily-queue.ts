import type { FsrsCard, SkillKind } from '../schemas'

/**
 * Cola diaria de repaso.
 *
 * Arma el recorrido del día con estas reglas:
 * - los ítems vencidos van primero y no se recortan por `newPerDay`;
 * - los ítems nuevos se limitan a `newPerDay` y se mezclan con una semilla;
 * - el resultado intercala temas para no repetir el mismo tipo de habilidad
 *   consecutivamente cuando hay alternativa.
 *
 * El reloj se recibe como `Date` (`now`) y la mezcla usa una semilla, de modo
 * que la cola sea determinista y testeable con un reloj falso.
 */

/** Ítem candidato para la cola, con su habilidad y tarjeta FSRS si existe. */
export interface QueueCandidate {
  itemId: string
  kind: SkillKind
  card?: FsrsCard
}

export interface DailyQueueOptions {
  /** Fecha y hora actual; no se usa el reloj del sistema. */
  now: Date
  /** Máximo de ítems nuevos que entran en la cola del día. */
  newPerDay: number
  /** Tope total opcional de la cola. */
  limit?: number
  /** Semilla de mezcla; mismo valor produce la misma cola. */
  seed?: number
}

export type DailyQueueStatus = 'due' | 'new'

export interface DailyQueueEntry {
  itemId: string
  kind: SkillKind
  status: DailyQueueStatus
}

export interface DailyQueueResult {
  entries: DailyQueueEntry[]
  counts: {
    due: number
    new: number
    total: number
  }
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

function shuffled<T>(items: readonly T[], seed: number): T[] {
  const result = [...items]
  const random = createRandom(seed)
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    const current = result[index]
    result[index] = result[swapIndex]
    result[swapIndex] = current
  }
  return result
}

interface SelectedItem {
  candidate: QueueCandidate
  status: DailyQueueStatus
}

function dueTime(candidate: QueueCandidate): number {
  return candidate.card ? new Date(candidate.card.due).getTime() : Number.POSITIVE_INFINITY
}

function mixKinds(items: readonly SelectedItem[]): SelectedItem[] {
  const result = [...items]
  for (let index = 1; index < result.length; index += 1) {
    if (result[index].candidate.kind === result[index - 1].candidate.kind) {
      const swapIndex = result.findIndex(
        (item, candidateIndex) =>
          candidateIndex > index && item.candidate.kind !== result[index - 1].candidate.kind,
      )
      if (swapIndex !== -1) {
        const current = result[index]
        result[index] = result[swapIndex]
        result[swapIndex] = current
      }
    }
  }
  return result
}

/** Construye la cola diaria a partir de los ítems disponibles. */
export function buildDailyQueue(
  candidates: readonly QueueCandidate[],
  options: DailyQueueOptions,
): DailyQueueResult {
  const newPerDay = Math.max(0, Math.floor(options.newPerDay))
  const limit = options.limit === undefined ? Number.POSITIVE_INFINITY : Math.max(0, Math.floor(options.limit))
  const seed = options.seed ?? 1
  const nowTime = options.now.getTime()

  const due: QueueCandidate[] = []
  const fresh: QueueCandidate[] = []

  for (const candidate of candidates) {
    const card = candidate.card
    if (!card || card.state === 'new') {
      fresh.push(candidate)
      continue
    }
    if (new Date(card.due).getTime() <= nowTime) {
      due.push(candidate)
    }
  }

  due.sort((a, b) => dueTime(a) - dueTime(b) || a.itemId.localeCompare(b.itemId))
  fresh.sort((a, b) => a.itemId.localeCompare(b.itemId))

  const selectedDue: SelectedItem[] = due.map((candidate) => ({ candidate, status: 'due' }))
  const selectedNew: SelectedItem[] = shuffled(fresh, seed)
    .slice(0, newPerDay)
    .map((candidate) => ({ candidate, status: 'new' }))

  const mixed = mixKinds([...selectedDue, ...selectedNew]).slice(0, limit)
  const entries: DailyQueueEntry[] = mixed.map(({ candidate, status }) => ({
    itemId: candidate.itemId,
    kind: candidate.kind,
    status,
  }))

  return {
    entries,
    counts: {
      due: entries.filter((entry) => entry.status === 'due').length,
      new: entries.filter((entry) => entry.status === 'new').length,
      total: entries.length,
    },
  }
}
