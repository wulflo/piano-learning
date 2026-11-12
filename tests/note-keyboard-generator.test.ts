import { describe, expect, it } from 'vitest'
import { ExerciseSchema } from '../src/schemas/content'
import { midiOf, parsePitch } from '../src/theory'
import { midiNameWithOctave, type Notation } from '../src/notation'
import {
  generateNoteKeyboardExercise,
  generateNoteKeyboardExercises,
  notesInRange,
  parseNoteRange,
} from '../src/exercises/generators/note-keyboard'
import type { NoteKeyboardExercise } from '../src/exercises/generators/note-keyboard'

const RANGE = 'C2-C6'

type NoteKeyboardParams = Parameters<typeof generateNoteKeyboardExercise>[0]

function baseParams(overrides?: Partial<NoteKeyboardParams>): NoteKeyboardParams {
  return {
    id: 'ex.note-keyboard.base',
    skillId: 'skill.note-names',
    range: RANGE,
    notation: 'do' as Notation,
    variant: 'hear' as const,
    difficulty: 2 as const,
    ...overrides,
  }
}

function targetMidi(exercise: NoteKeyboardExercise): number {
  const spelled = exercise.target as { step: string; accidental: string; octave: number }
  return midiOf(parsePitch(`${spelled.step}${spelled.accidental}${spelled.octave}`))
}

describe('F2-032 — Generador de ejercicios de identificar notas en teclado', () => {
  it('parsea rangos configurables como «C2-C6»', () => {
    const range = parseNoteRange(RANGE)
    expect(range.from).toEqual({ step: 'C', accidental: 0, octave: 2 })
    expect(range.to).toEqual({ step: 'C', accidental: 0, octave: 6 })

    expect(() => parseNoteRange('C6-C2')).toThrow('no ascendente')
    expect(() => parseNoteRange('arroz-con-queso')).toThrow('Rango de notas inválido')
  })

  it('lista todas las notas dentro del rango configurable', () => {
    const notes = notesInRange(RANGE)
    expect(notes).toHaveLength(49)
    expect(midiOf(notes[0])).toBe(36)
    expect(midiOf(notes[notes.length - 1])).toBe(84)
  })

  it('genera un ejercicio que pasa la validación del esquema note-keyboard', () => {
    const exercise = generateNoteKeyboardExercise(baseParams({ id: 'ex.note-keyboard.gen' }))

    const result = ExerciseSchema.safeParse(exercise)
    expect(result.success).toBe(true)
    if (!result.success) return
    const parsed = result.data
    if (parsed.type !== 'note-keyboard') throw new Error('El ejercicio generado no es de tipo note-keyboard')
    expect(parsed.id).toBe('ex.note-keyboard.gen')
    expect(parsed.skillId).toBe('skill.note-names')
    expect(exercise.choices.length).toBeGreaterThanOrEqual(2)
    expect(exercise.choices.length).toBeLessThanOrEqual(8)
    expect(new Set(exercise.choices).size).toBe(exercise.choices.length)
    expect(exercise.choices).toContain(midiNameWithOctave(targetMidi(exercise), 'do'))
    expect(exercise.choices).not.toContain('')
  })

  it('genera la nota objetivo dentro del rango y la incluye entre las opciones', () => {
    const exercise = generateNoteKeyboardExercise(baseParams({ id: 'ex.note-keyboard.gen' }))

    expect(targetMidi(exercise)).toBeGreaterThanOrEqual(midiOf(parsePitch('C2')))
    expect(targetMidi(exercise)).toBeLessThanOrEqual(midiOf(parsePitch('C6')))
    expect(exercise.choices).toContain(midiNameWithOctave(targetMidi(exercise), 'do'))
    expect(exercise.choices).not.toContain('')
  })

  it('usa la variante oír con el prompt del sonido y la variante ver con el de la tecla', () => {
    const heard = generateNoteKeyboardExercise(
      baseParams({ id: 'ex.note-keyboard.hear', variant: 'hear', difficulty: 1 }),
    )
    const seen = generateNoteKeyboardExercise(
      baseParams({ id: 'ex.note-keyboard.see', variant: 'see', difficulty: 1 }),
    )

    expect(heard.promptEs).toBe('¿Qué nota está sonando?')
    expect(seen.promptEs).toBe('¿Qué nota es esta tecla?')
    expect(heard.explanationEs).toContain('La nota que sonó fue')
    expect(seen.explanationEs).toContain('Esa tecla del teclado corresponde a la nota')
  })

  it('ajusta la cantidad de opciones al nivel de dificultad', () => {
    const easy = generateNoteKeyboardExercise(baseParams({ id: 'ex.note-keyboard.easy', difficulty: 1 }))
    const medium = generateNoteKeyboardExercise(baseParams({ id: 'ex.note-keyboard.med', difficulty: 2 }))
    const hard = generateNoteKeyboardExercise(baseParams({ id: 'ex.note-keyboard.hard', difficulty: 3 }))

    expect(easy.choices).toHaveLength(3)
    expect(medium.choices).toHaveLength(4)
    expect(hard.choices).toHaveLength(5)
  })

  it('genera una secuencia sin repetir la misma nota consecutiva', () => {
    const exercises = generateNoteKeyboardExercises({
      skillId: 'skill.note-names',
      range: RANGE,
      notation: 'do',
      variant: 'hear',
      difficulty: 2,
      idPrefix: 'ex.note-keyboard.seq',
      count: 25,
    })

    expect(exercises).toHaveLength(25)
    for (let index = 1; index < exercises.length; index += 1) {
      expect(targetMidi(exercises[index])).not.toBe(targetMidi(exercises[index - 1]))
    }
  })

  it('genera notas dentro del rango configurable solicitado', () => {
    const exercise = generateNoteKeyboardExercise({
      ...baseParams({
        id: 'ex.note-keyboard.narrow',
        range: 'C4-C5',
        notation: 'c',
        variant: 'see',
        difficulty: 3,
      }),
    })

    expect(targetMidi(exercise)).toBeGreaterThanOrEqual(midiOf(parsePitch('C4')))
    expect(targetMidi(exercise)).toBeLessThanOrEqual(midiOf(parsePitch('C5')))
  })

  it('respeta una nota objetivo explícita', () => {
    const exercise = generateNoteKeyboardExercise(
      baseParams({ id: 'ex.note-keyboard.fixed', target: { step: 'E', accidental: 0, octave: 4 } }),
    )

    expect(targetMidi(exercise)).toBe(64)
    expect(exercise.choices).toContain(midiNameWithOctave(64, 'do'))
  })
})
