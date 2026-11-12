import { describe, expect, it } from 'vitest'
import { PracticeSessionSchema } from '../src/schemas'
import {
  buildPracticeSession,
  createPracticeTimer,
  finishPracticeTimer,
  pausePracticeTimer,
  practicedSeconds,
  remainingSeconds,
  resumePracticeTimer,
  skipPracticeBlock,
  startPracticeTimer,
  tickPracticeTimer,
} from '../src/state/practice-timer'

function started(minutes: 15 | 30 | 45 = 15) {
  return startPracticeTimer(createPracticeTimer(minutes))
}

describe('F2-068 — Temporizador de práctica', () => {
  it('crea el temporizador detenido con los segundos de cada bloque', () => {
    const timer = createPracticeTimer(15)

    expect(timer.status).toBe('idle')
    expect(timer.plannedMinutes).toBe(15)
    expect(timer.current).toBe(0)
    expect(timer.blocks.map((block) => block.plannedSeconds)).toEqual([
      180, 240, 180, 180, 120,
    ])
    expect(practicedSeconds(timer)).toBe(0)
    expect(remainingSeconds(timer)).toBe(180)
  })

  it('solo avanza mientras está en marcha', () => {
    const idle = createPracticeTimer(15)
    expect(tickPracticeTimer(idle, 5)).toBe(idle)

    const paused = pausePracticeTimer(started())
    expect(tickPracticeTimer(paused, 5)).toBe(paused)

    const done = finishPracticeTimer(started())
    expect(tickPracticeTimer(done, 5)).toBe(done)
  })

  it('descuenta segundos y acumula lo practicado', () => {
    const timer = tickPracticeTimer(started(), 12)

    expect(timer.status).toBe('running')
    expect(timer.current).toBe(0)
    expect(practicedSeconds(timer)).toBe(12)
    expect(remainingSeconds(timer)).toBe(168)
  })

  it('pasa al siguiente bloque al agotar el tiempo', () => {
    const timer = tickPracticeTimer(started(), 180)

    expect(timer.current).toBe(1)
    expect(timer.blocks[0].elapsedSeconds).toBe(180)
    expect(timer.blocks[1].elapsedSeconds).toBe(0)
    expect(remainingSeconds(timer)).toBe(240)
    expect(practicedSeconds(timer)).toBe(180)
  })

  it('termina al completar el último bloque', () => {
    const timer = tickPracticeTimer(started(), 900)

    expect(timer.status).toBe('done')
    expect(practicedSeconds(timer)).toBe(900)
    expect(remainingSeconds(timer)).toBe(0)
    expect(timer.blocks.map((block) => block.elapsedSeconds)).toEqual([
      180, 240, 180, 180, 120,
    ])
  })

  it('pausa y reanuda sin perder lo practicado', () => {
    const running = tickPracticeTimer(started(), 10)
    const paused = pausePracticeTimer(running)

    expect(paused.status).toBe('paused')
    expect(tickPracticeTimer(paused, 10)).toBe(paused)
    expect(practicedSeconds(paused)).toBe(10)

    const resumed = tickPracticeTimer(resumePracticeTimer(paused), 5)
    expect(resumed.status).toBe('running')
    expect(practicedSeconds(resumed)).toBe(15)
  })

  it('saltar un bloque no regala tiempo', () => {
    const timer = skipPracticeBlock(tickPracticeTimer(started(), 7))

    expect(timer.current).toBe(1)
    expect(timer.blocks[0].elapsedSeconds).toBe(7)
    expect(practicedSeconds(timer)).toBe(7)
  })

  it('saltar el último bloque pendiente termina la sesión', () => {
    let timer = started()
    for (let index = 0; index < 5; index += 1) {
      timer = skipPracticeBlock(timer)
    }

    expect(timer.status).toBe('done')
    expect(practicedSeconds(timer)).toBe(0)
  })

  it('cortar la sesión conserva los segundos practicados', () => {
    const timer = finishPracticeTimer(tickPracticeTimer(started(30), 65))

    expect(timer.status).toBe('done')
    expect(practicedSeconds(timer)).toBe(65)
  })

  it('ignora cantidades de segundos inválidas', () => {
    const timer = started()
    expect(tickPracticeTimer(timer, 0)).toBe(timer)
    expect(tickPracticeTimer(timer, -5)).toBe(timer)
    expect(tickPracticeTimer(timer, Number.NaN)).toBe(timer)
  })

  it('construye una sesión válida con los segundos reales', () => {
    const timer = tickPracticeTimer(started(15), 65)
    const session = buildPracticeSession({
      id: 'session.test.1',
      startedAt: new Date('2026-03-10T10:00:00.000Z'),
      endedAt: new Date('2026-03-10T10:02:00.000Z'),
      timer,
    })

    expect(PracticeSessionSchema.parse(session)).toEqual(session)
    expect(session).toMatchObject({
      id: 'session.test.1',
      plannedMinutes: 15,
      startedAt: '2026-03-10T10:00:00.000Z',
      endedAt: '2026-03-10T10:02:00.000Z',
    })
    expect(session.blocks).toEqual([
      { kind: 'warmup', seconds: 65 },
      { kind: 'technique', seconds: 0 },
      { kind: 'theory', seconds: 0 },
      { kind: 'repertoire', seconds: 0 },
      { kind: 'review', seconds: 0 },
    ])
  })
})
