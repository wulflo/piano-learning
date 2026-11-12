import { describe, expect, it } from 'vitest'
import {
  answerEarSession,
  createEarSession,
  earSessionSummary,
  type EarSessionItem,
} from '../src/exercises/ear-session'

function item(id: string, difficulty: number, kind = 'interval'): EarSessionItem {
  return { id, difficulty, kind }
}

function poolByDifficulty(): EarSessionItem[] {
  return [1, 2, 3, 4, 5].flatMap((difficulty) =>
    ['a', 'b', 'c'].map((suffix) => item(`item.${difficulty}.${suffix}`, difficulty)),
  )
}

function runSession(seed: number, answers: readonly boolean[]): string[] {
  let state = createEarSession(poolByDifficulty(), { seed, length: answers.length })
  const ids: string[] = []
  for (const correct of answers) {
    if (state.current !== null) ids.push(state.current.id)
    state = answerEarSession(state, correct)
  }
  return ids
}

describe('F3-019 — Motor de sesiones auditivas adaptativas', () => {
  it('crea una sesión de diez ítems en el nivel pedido', () => {
    const session = createEarSession(poolByDifficulty(), {
      startDifficulty: 3,
      seed: 7,
    })

    expect(session.length).toBe(10)
    expect(session.index).toBe(0)
    expect(session.difficulty).toBe(3)
    expect(session.finished).toBe(false)
    expect(session.current).not.toBeNull()
    expect(session.current?.difficulty).toBe(3)
    expect(session.usedIds).toEqual([session.current?.id])
  })

  it('recorre diez ítems, registra los aciertos y termina', () => {
    let session = createEarSession(poolByDifficulty(), { seed: 11 })

    for (let index = 0; index < 10; index += 1) {
      expect(session.current).not.toBeNull()
      session = answerEarSession(session, true)
    }

    expect(session.finished).toBe(true)
    expect(session.current).toBeNull()
    expect(session.answers).toHaveLength(10)
    expect(session.answers.every((answer) => answer.correct)).toBe(true)
    expect(earSessionSummary(session)).toEqual({
      answered: 10,
      correct: 10,
      incorrect: 0,
      accuracy: 1,
      finalDifficulty: 5,
      finished: true,
    })

    const finished = session
    expect(answerEarSession(finished, false)).toBe(finished)
  })

  it('sube y baja la dificultad con rachas consecutivas', () => {
    let session = createEarSession(poolByDifficulty(), {
      seed: 3,
      length: 20,
      startDifficulty: 2,
      promoteAfter: 2,
      demoteAfter: 2,
    })

    session = answerEarSession(session, true)
    expect(session.difficulty).toBe(2)
    session = answerEarSession(session, true)
    expect(session.difficulty).toBe(3)

    session = answerEarSession(session, false)
    expect(session.difficulty).toBe(3)
    session = answerEarSession(session, false)
    expect(session.difficulty).toBe(2)

    session = answerEarSession(session, false)
    expect(session.difficulty).toBe(2)
    session = answerEarSession(session, false)
    expect(session.difficulty).toBe(1)

    session = answerEarSession(session, false)
    session = answerEarSession(session, false)
    expect(session.difficulty).toBe(1)

    session = answerEarSession(session, true)
    session = answerEarSession(session, true)
    expect(session.difficulty).toBe(2)
  })

  it('no repite ítems mientras queden candidatos sin usar', () => {
    const items = Array.from({ length: 10 }, (_, index) =>
      item(`item.${index}`, 1),
    )
    let session = createEarSession(items, { seed: 5, startDifficulty: 1 })
    const ids: string[] = []

    for (let index = 0; index < 10; index += 1) {
      if (session.current !== null) ids.push(session.current.id)
      session = answerEarSession(session, index % 2 === 0)
    }

    expect(ids).toHaveLength(10)
    expect(new Set(ids).size).toBe(10)
  })

  it('elige el ítem más cercano cuando falta el nivel actual', () => {
    const items = [item('easy', 1), item('hard', 5)]

    const high = createEarSession(items, { startDifficulty: 5 })
    expect(high.current?.id).toBe('hard')

    const low = createEarSession(items, { startDifficulty: 1 })
    expect(low.current?.id).toBe('easy')
  })

  it('es determinista con la misma semilla y las mismas respuestas', () => {
    const answers = [true, false, true, true, false, true, false, true, true, false]
    const first = runSession(23, answers)
    const second = runSession(23, answers)

    expect(first).toEqual(second)
    expect(first).toHaveLength(10)
  })

  it('acota el largo, el nivel y las rachas a valores válidos', () => {
    const session = createEarSession(poolByDifficulty(), {
      length: 0,
      startDifficulty: 99,
      promoteAfter: 0,
      demoteAfter: 0,
    })

    expect(session.length).toBe(1)
    expect(session.difficulty).toBe(5)
    expect(session.promoteAfter).toBe(1)
    expect(session.demoteAfter).toBe(1)
  })

  it('rechaza una lista vacía y resume una sesión sin respuestas', () => {
    expect(() => createEarSession([])).toThrow(RangeError)

    const session = createEarSession([item('only', 1)])
    expect(earSessionSummary(session)).toEqual({
      answered: 0,
      correct: 0,
      incorrect: 0,
      accuracy: 0,
      finalDifficulty: 2,
      finished: false,
    })
  })
})
