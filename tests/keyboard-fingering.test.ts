import { describe, expect, it } from 'vitest'
import { fingeringFor, type Hand } from '../src/keyboard/fingering'

describe('F2-074 — Digitación en el teclado (numero y D/I)', () => {
  it('asigna dedos a una escala mayor en la mano derecha', () => {
    const assignments = fingeringFor([60, 62, 64, 65, 67, 69, 71, 72], {
      mode: 'scale',
      hand: 'right',
    })

    expect(assignments).toHaveLength(8)
    expect(
      assignments.map((assignment) => [assignment.midi, assignment.finger, assignment.hand]),
    ).toEqual([
      [60, 1, 'right'],
      [62, 2, 'right'],
      [64, 3, 'right'],
      [65, 4, 'right'],
      [67, 5, 'right'],
      [69, 4, 'right'],
      [71, 3, 'right'],
      [72, 2, 'right'],
    ])
  })

  it('asigna dedos a una escala en la mano izquierda', () => {
    const assignments = fingeringFor([60, 62, 64, 65, 67, 69, 71, 72], {
      mode: 'scale',
      hand: 'left',
    })

    expect(
      assignments.map((assignment) => [assignment.midi, assignment.finger, assignment.hand]),
    ).toEqual([
      [60, 5, 'left'],
      [62, 4, 'left'],
      [64, 3, 'left'],
      [65, 2, 'left'],
      [67, 1, 'left'],
      [69, 3, 'left'],
      [71, 2, 'left'],
      [72, 1, 'left'],
    ])
  })

  it('asigna dedos a acordes, intervalos y notas', () => {
    const triadRight = fingeringFor([60, 64, 67], { mode: 'chord', hand: 'right' })
    expect(triadRight.map((a) => a.finger)).toEqual([1, 3, 5])

    const triadLeft = fingeringFor([60, 64, 67], { mode: 'chord', hand: 'left' })
    expect(triadLeft.map((a) => a.finger)).toEqual([5, 3, 1])

    const seventhRight = fingeringFor([60, 64, 67, 71], { mode: 'chord', hand: 'right' })
    expect(seventhRight.map((a) => a.finger)).toEqual([1, 2, 3, 5])

    const thirdRight = fingeringFor([60, 64], { mode: 'interval', hand: 'right', intervalNumber: 3 })
    expect(thirdRight.map((a) => a.finger)).toEqual([1, 3])

    const fifthLeft = fingeringFor([60, 67], { mode: 'interval', hand: 'left', intervalNumber: 5 })
    expect(fifthLeft.map((a) => a.finger)).toEqual([5, 1])

    const singleRight = fingeringFor([60], { mode: 'note', hand: 'right' })
    const singleLeft = fingeringFor([60], { mode: 'note', hand: 'left' })
    expect(singleRight.map((a) => a.finger)).toEqual([1])
    expect(singleLeft.map((a) => a.finger)).toEqual([5])
  })

  it('limita los dedos a los cinco digitos', () => {
    for (const hand of ['right', 'left'] as Hand[]) {
      const assignments = fingeringFor([60, 62, 64, 65, 67, 69, 71, 72], { mode: 'scale', hand })
      expect(assignments.every((assignment) => assignment.finger >= 1 && assignment.finger <= 5)).toBe(true)
    }
  })
})
