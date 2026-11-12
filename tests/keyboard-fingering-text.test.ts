import { describe, expect, it } from 'vitest'
import {
  fingerSequenceFromText,
  fingeringFromText,
} from '../src/keyboard/fingering'

describe('digitación a partir del texto de la tarea', () => {
  it('lee la secuencia de dedos y la mano derecha', () => {
    expect(fingerSequenceFromText('1 - 2 - 3 - 4 - 5 (mano derecha)')).toEqual([
      1, 2, 3, 4, 5,
    ])
    const assignment = fingeringFromText(
      [60, 62, 64, 65, 67],
      '1 - 2 - 3 - 4 - 5 (mano derecha); pulgar sobre Do4',
    )
    expect(assignment).toEqual([
      { midi: 60, finger: 1, hand: 'right' },
      { midi: 62, finger: 2, hand: 'right' },
      { midi: 64, finger: 3, hand: 'right' },
      { midi: 65, finger: 4, hand: 'right' },
      { midi: 67, finger: 5, hand: 'right' },
    ])
  })

  it('reconoce la mano izquierda', () => {
    const assignment = fingeringFromText(
      [48, 50, 52],
      'Mano izquierda: 5 - 4 - 3',
    )
    expect(assignment.map((item) => item.hand)).toEqual(['left', 'left', 'left'])
    expect(assignment.map((item) => item.finger)).toEqual([5, 4, 3])
  })

  it('usa el patrón de escala cuando el texto no cubre exactamente las teclas', () => {
    const assignment = fingeringFromText(
      [60, 62, 64, 65, 67],
      'Mano derecha: 1-3-5 para la tríada y otras posiciones',
    )
    expect(assignment.map((item) => item.finger)).toEqual([1, 2, 3, 4, 5])
    expect(assignment[0].hand).toBe('right')
  })

  it('sin texto usa la escala de la mano derecha por defecto', () => {
    const assignment = fingeringFromText([60, 61, 62], undefined)
    expect(assignment.map((item) => item.finger)).toEqual([1, 2, 3])
    expect(assignment.map((item) => item.hand)).toEqual([
      'right',
      'right',
      'right',
    ])
  })
})
