import { describe, expect, it } from 'vitest'
import { ExerciseSchema } from '../src/schemas/content'
import { fromSpelledPitch, midiOf, parsePitch, type Pitch } from '../src/theory'
import { midiNameWithOctave, type Notation } from '../src/notation'
import {
  NOTE_STAFF_CLEFS,
  NOTE_STAFF_MAX_LEDGER_LINES,
  describeStaffPosition,
  generateNoteStaffExercise,
  generateNoteStaffExercises,
  ledgerLineCount,
  noteStaffCandidates,
  usesLedgerLines,
} from '../src/exercises/generators/note-staff'
import type { NoteStaffExercise } from '../src/exercises/generators/note-staff'

const RANGE = 'C2-C6'

type NoteStaffParams = Parameters<typeof generateNoteStaffExercise>[0]

function baseParams(overrides?: Partial<NoteStaffParams>): NoteStaffParams {
  return {
    id: 'ex.note-staff.base',
    skillId: 'skill.note-staff',
    range: RANGE,
    clef: 'treble',
    notation: 'do' as Notation,
    difficulty: 2,
    ...overrides,
  }
}

function targetMidi(exercise: NoteStaffExercise): number {
  return midiOf(fromSpelledPitch(exercise.target))
}

function midis(pitches: ReadonlyArray<Pitch>): number[] {
  return pitches.map((pitch) => midiOf(pitch))
}

describe('F2-033 — Generador de ejercicios de identificar notas en pentagrama', () => {
  it('define las claves sol y fa con dificultad progresiva de líneas adicionales', () => {
    expect([...NOTE_STAFF_CLEFS]).toEqual(['treble', 'bass'])
    expect(NOTE_STAFF_MAX_LEDGER_LINES).toEqual({ 1: 0, 2: 1, 3: 2 })
  })

  it('calcula las líneas adicionales según la clave', () => {
    // Clave de sol: el pentagrama va de Mi4 a Fa5.
    expect(usesLedgerLines('treble', parsePitch('C4'))).toBe(true)
    expect(usesLedgerLines('treble', parsePitch('E4'))).toBe(false)
    expect(usesLedgerLines('treble', parsePitch('G5'))).toBe(false) // espacio encima, sin línea
    expect(usesLedgerLines('treble', parsePitch('A5'))).toBe(true) // primera línea adicional
    expect(usesLedgerLines('treble', parsePitch('A3'))).toBe(true) // segunda línea adicional

    // Clave de fa: el pentagrama va de Sol2 a La3.
    expect(usesLedgerLines('bass', parsePitch('C4'))).toBe(true) // primera línea arriba
    expect(usesLedgerLines('bass', parsePitch('F2'))).toBe(false) // espacio debajo, sin línea
    expect(usesLedgerLines('bass', parsePitch('A3'))).toBe(false)
    expect(usesLedgerLines('bass', parsePitch('E2'))).toBe(true)
  })

  it('cuenta y describe la posición de las notas en el pentagrama', () => {
    expect(ledgerLineCount('treble', parsePitch('C4'))).toBe(1)
    expect(ledgerLineCount('treble', parsePitch('A3'))).toBe(2)
    expect(ledgerLineCount('treble', parsePitch('G4'))).toBe(0)
    expect(ledgerLineCount('bass', parsePitch('C4'))).toBe(1)

    expect(describeStaffPosition('treble', parsePitch('G4'))).toBe('la segunda línea del pentagrama')
    expect(describeStaffPosition('treble', parsePitch('F4'))).toBe('el primer espacio del pentagrama')
    expect(describeStaffPosition('treble', parsePitch('C4'))).toBe(
      'la primera línea adicional debajo del pentagrama',
    )
    expect(describeStaffPosition('bass', parsePitch('C4'))).toBe(
      'la primera línea adicional arriba del pentagrama',
    )
    expect(describeStaffPosition('treble', parsePitch('D4'))).toBe(
      'el espacio debajo del pentagrama',
    )
  })

  it('limita las notas candidatas según la dificultad', () => {
    const easy = noteStaffCandidates('treble', 1, RANGE)
    expect(easy).toHaveLength(9)
    expect(easy.every((pitch) => !usesLedgerLines('treble', pitch))).toBe(true)
    expect(midis(easy)).toEqual(midis(['E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5'].map(parsePitch)))

    const medium = noteStaffCandidates('treble', 2, RANGE)
    expect(medium).toHaveLength(13)
    expect(midis(medium)).toContain(midiOf(parsePitch('C4')))
    expect(midis(medium)).toContain(midiOf(parsePitch('A5')))
    expect(midis(medium)).not.toContain(midiOf(parsePitch('A3')))
    expect(midis(medium)).not.toContain(midiOf(parsePitch('C6')))

    const hard = noteStaffCandidates('treble', 3, RANGE)
    expect(hard).toHaveLength(17)
    expect(midis(hard)).toContain(midiOf(parsePitch('A3')))
    expect(midis(hard)).toContain(midiOf(parsePitch('C6')))

    const bass = noteStaffCandidates('bass', 3, RANGE)
    expect(bass).toHaveLength(17)
    expect(midis(bass)).toContain(midiOf(parsePitch('C2')))
    expect(midis(bass)).toContain(midiOf(parsePitch('E4')))
  })

  it('genera un ejercicio de pentagrama válido con la clave indicada', () => {
    const exercise = generateNoteStaffExercise(
      baseParams({
        id: 'ex.note-staff.gen',
        clef: 'bass',
        difficulty: 1,
        target: parsePitch('F3'),
      }),
    )

    const result = ExerciseSchema.safeParse(exercise)
    expect(result.success).toBe(true)
    if (!result.success) return
    const parsed = result.data
    if (parsed.type !== 'note-staff') throw new Error('El ejercicio generado no es de tipo note-staff')
    expect(parsed.clef).toBe('bass')
    expect(parsed.type).toBe('note-staff')
    expect(exercise.choices.length).toBeGreaterThanOrEqual(2)
    expect(exercise.choices).toContain(midiNameWithOctave(targetMidi(exercise), 'do'))
    expect(exercise.promptEs).toContain('clave de fa')
    expect(exercise.promptEs).toContain('cuarta línea')
    expect(exercise.explanationEs).toContain('Fa3')
  })

  it('usa dificultad progresiva con cantidad de opciones creciente', () => {
    const easy = generateNoteStaffExercise(
      baseParams({ id: 'ex.note-staff.easy', difficulty: 1, target: parsePitch('G4') }),
    )
    const medium = generateNoteStaffExercise(
      baseParams({ id: 'ex.note-staff.medium', difficulty: 2, target: parsePitch('G4') }),
    )
    const hard = generateNoteStaffExercise(
      baseParams({ id: 'ex.note-staff.hard', difficulty: 3, target: parsePitch('G4') }),
    )

    expect(easy.choices).toHaveLength(3)
    expect(medium.choices).toHaveLength(4)
    expect(hard.choices).toHaveLength(5)
    for (const exercise of [easy, medium, hard]) {
      expect(new Set(exercise.choices).size).toBe(exercise.choices.length)
    }
  })

  it('explica las líneas adicionales de la nota objetivo', () => {
    const exercise = generateNoteStaffExercise(
      baseParams({ id: 'ex.note-staff.ledger', difficulty: 2, target: parsePitch('C4') }),
    )

    expect(targetMidi(exercise)).toBe(60)
    expect(exercise.explanationEs).toContain('primera línea adicional debajo del pentagrama')
    expect(exercise.explanationEs).toContain('1 línea adicional')
  })

  it('genera una secuencia sin repetir la misma nota consecutiva', () => {
    const exercises = generateNoteStaffExercises({
      skillId: 'skill.note-staff',
      range: RANGE,
      clef: 'treble',
      notation: 'do',
      difficulty: 2,
      idPrefix: 'ex.note-staff.seq',
      count: 20,
    })

    expect(exercises).toHaveLength(20)
    for (let index = 1; index < exercises.length; index += 1) {
      expect(targetMidi(exercises[index])).not.toBe(targetMidi(exercises[index - 1]))
    }
  })

  it('genera 200 casos de ejercicio de pentagrama válidos con ids únicos', () => {
    const exercises = generateNoteStaffExercises({
      skillId: 'skill.note-staff',
      range: RANGE,
      clef: 'treble',
      notation: 'do',
      difficulty: 3,
      idPrefix: 'ex.note-staff.batch',
      count: 200,
    })

    expect(exercises).toHaveLength(200)
    expect(new Set(exercises.map((exercise) => exercise.id)).size).toBe(200)
    expect(exercises.some((exercise) => usesLedgerLines('treble', fromSpelledPitch(exercise.target)))).toBe(true)
    for (const exercise of exercises) {
      expect(exercise.id).toMatch(/^[a-z0-9][a-z0-9._-]*$/)
      const result = ExerciseSchema.safeParse(exercise)
      expect(result.success).toBe(true)
      if (!result.success) continue
      const parsed = result.data
      if (parsed.type !== 'note-staff') throw new Error('Tipo inesperado en el lote')
      expect(parsed.clef).toBe('treble')
      if (!parsed.choices) throw new Error('El ejercicio del lote no tiene opciones')
      expect(parsed.choices.length).toBeGreaterThanOrEqual(3)
      expect(parsed.choices.length).toBeLessThanOrEqual(5)
      expect(new Set(parsed.choices).size).toBe(parsed.choices.length)
    }
  })
})
