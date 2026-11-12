import { ExerciseSchema } from '../../schemas/content'
import type { SpelledPitch } from '../../schemas/notation'
import { midiOf, parsePitch, pitchFromMidi, toSpelledPitch, type Pitch } from '../../theory'
import { midiNameWithOctave, type Notation } from '../../notation'

export const NOTE_KEYBOARD_VARIANTS = ['hear', 'see'] as const
export type NoteKeyboardVariant = (typeof NOTE_KEYBOARD_VARIANTS)[number]

export const NOTE_KEYBOARD_DIFFICULTIES = [1, 2, 3] as const
export type NoteKeyboardDifficulty = (typeof NOTE_KEYBOARD_DIFFICULTIES)[number]

export const NOTE_KEYBOARD_MIN_CHOICES = 2
export const NOTE_KEYBOARD_MAX_CHOICES = 8

const DISTRACTOR_COUNTS: Record<number, number> = { 1: 2, 2: 3, 3: 4 }

const HEAR_PROMPTS: Record<NoteKeyboardDifficulty, string> = {
  1: '¿Qué nota está sonando?',
  2: '¿Qué nota estás tocando?',
  3: '¿Qué nota acabas de escuchar?',
}

const SEE_PROMPTS: Record<NoteKeyboardDifficulty, string> = {
  1: '¿Qué nota es esta tecla?',
  2: '¿Qué nota representa esta tecla del teclado?',
  3: '¿Qué nota escribimos para esta tecla del teclado?',
}

export interface NoteRange {
  from: Pitch
  to: Pitch
}

const NOTE_RANGE_PATTERN = /^([A-Ga-g])([#b]?)(x|-?\d+)-([A-Ga-g])([#b]?)(x|-?\d+)$/

/**
 * Rango configurable de notas, p.ej. «C2-C6»: tónica y octavas de los extremos.
 */
export function parseNoteRange(range: string): NoteRange {
  const match = NOTE_RANGE_PATTERN.exec(range.trim())
  if (!match) {
    throw new Error(`Rango de notas inválido: "${range}" (se esperaba, por ejemplo, "C2-C6")`)
  }
  const from = parsePitch(`${match[1].toUpperCase()}${match[2] ?? ''}${match[3]}`)
  const to = parsePitch(`${match[4].toUpperCase()}${match[5] ?? ''}${match[6]}`)
  const fromMidi = midiOf(from)
  const toMidi = midiOf(to)
  if (fromMidi > toMidi) {
    throw new Error(`Rango de notas no ascendente: "${range}"`)
  }
  return { from, to }
}

/** Todas las notas (semitonos) dentro del rango, de grave a agudo. */
export function notesInRange(range: string): Pitch[] {
  const { from, to } = parseNoteRange(range)
  const notes: Pitch[] = []
  for (let midi = midiOf(from); midi <= midiOf(to); midi += 1) {
    notes.push(pitchFromMidi(midi))
  }
  return notes
}

export interface NoteKeyboardExerciseParams {
  skillId: string
  range: string
  notation: Notation
  variant: NoteKeyboardVariant
  difficulty: NoteKeyboardDifficulty
  target?: Pitch
}

export interface NoteKeyboardExercise {
  id: string
  skillId: string
  type: 'note-keyboard'
  promptEs: string
  explanationEs: string
  difficulty: number
  target: SpelledPitch
  choices: string[]
}

export interface NoteKeyboardExerciseBatch extends NoteKeyboardExerciseParams {
  idPrefix: string
  count: number
}

export function noteNameOf(pitch: Pitch, notation: Notation = 'do'): string {
  return midiNameWithOctave(midiOf(pitch), notation)
}

function buildChoices(
  candidates: Pitch[],
  target: Pitch,
  difficulty: NoteKeyboardDifficulty,
  notation: Notation,
): string[] {
  const targetName = noteNameOf(target, notation)
  const distractorCount = DISTRACTOR_COUNTS[difficulty] ?? 2
  const pool = candidates
    .filter((candidate) => midiOf(candidate) !== midiOf(target))
    .map((candidate) => noteNameOf(candidate, notation))
    .filter((name) => name !== targetName)
  const distractors: string[] = []
  const available = [...pool]
  while (distractors.length < distractorCount && available.length > 0) {
    const index = Math.floor(Math.random() * available.length)
    distractors.push(available.splice(index, 1)[0])
  }
  const choices = [targetName, ...distractors]
  const unique = choices.filter((name, index, arr) => arr.indexOf(name) === index)
  while (unique.length < NOTE_KEYBOARD_MIN_CHOICES) {
    const fallback = candidates.find((candidate) => midiOf(candidate) !== midiOf(target))
    if (!fallback) break
    const name = noteNameOf(fallback, notation)
    if (!unique.includes(name)) unique.push(name)
  }
  return unique.slice(0, NOTE_KEYBOARD_MAX_CHOICES)
}

/**
 * Genera un ejercicio de identificación de notas en el teclado. La nota
 * objetivo se elige dentro del rango configurable; con `target` explícita se
 * puede forzar la nota (tests, secuencias dirigidas).
 */
export function generateNoteKeyboardExercise(
  params: NoteKeyboardExerciseParams & { id: string },
): NoteKeyboardExercise {
  const candidates = notesInRange(params.range)
  const target = params.target ?? candidates[Math.floor(Math.random() * candidates.length)]
  const exercise: NoteKeyboardExercise = {
    id: params.id,
    skillId: params.skillId,
    type: 'note-keyboard',
    promptEs:
      params.variant === 'hear'
        ? HEAR_PROMPTS[params.difficulty]
        : SEE_PROMPTS[params.difficulty],
    explanationEs:
      params.variant === 'hear'
        ? `La nota que sonó fue ${noteNameOf(target, params.notation)}.`
        : `Esa tecla del teclado corresponde a la nota ${noteNameOf(target, params.notation)}.`,
    difficulty: params.difficulty,
    target: toSpelledPitch(target),
    choices: buildChoices(candidates, target, params.difficulty, params.notation),
  }
  const result = ExerciseSchema.safeParse(exercise)
  if (!result.success) {
    throw new Error(`El ejercicio generado no es válido: ${result.error.message}`)
  }
  return exercise
}

function chooseNote(range: string, previous: Pitch | undefined): Pitch {
  const candidates = notesInRange(range)
  const pool =
    previous === undefined
      ? candidates
      : candidates.filter((candidate) => midiOf(candidate) !== midiOf(previous))
  const list = pool.length > 0 ? pool : candidates
  return list[Math.floor(Math.random() * list.length)]
}

/**
 * Genera una secuencia de ejercicios sin repetir la misma nota consecutiva.
 */
export function generateNoteKeyboardExercises(batch: NoteKeyboardExerciseBatch): NoteKeyboardExercise[] {
  const exercises: NoteKeyboardExercise[] = []
  let previous: Pitch | undefined
  for (let index = 0; index < batch.count; index += 1) {
    const target = chooseNote(batch.range, previous)
    const exercise = generateNoteKeyboardExercise({
      id: `${batch.idPrefix}-${String(index + 1).padStart(3, '0')}`,
      skillId: batch.skillId,
      range: batch.range,
      notation: batch.notation,
      variant: batch.variant,
      difficulty: batch.difficulty,
      target,
    })
    exercises.push(exercise)
    previous = target
  }
  return exercises
}
