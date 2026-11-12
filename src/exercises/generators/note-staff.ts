import { ExerciseSchema } from '../../schemas/content'
import type { SpelledPitch } from '../../schemas/notation'
import {
  LETTERS,
  isLetter,
  letterIndex,
  midiOf,
  toSpelledPitch,
  type Pitch,
  type PitchLike,
} from '../../theory'
import { type Notation } from '../../notation'
import {
  NOTE_KEYBOARD_DIFFICULTIES,
  noteNameOf,
  parseNoteRange,
} from './note-keyboard'

export const NOTE_STAFF_CLEFS = ['treble', 'bass'] as const
export type NoteStaffClef = (typeof NOTE_STAFF_CLEFS)[number]

export type NoteStaffDifficulty = (typeof NOTE_KEYBOARD_DIFFICULTIES)[number]

/**
 * Cantidad máxima de líneas adicionales que puede requerir una nota según la
 * dificultad. En el nivel 1 las notas quedan dentro del pentagrama.
 */
export const NOTE_STAFF_MAX_LEDGER_LINES: Record<NoteStaffDifficulty, number> = {
  1: 0,
  2: 1,
  3: 2,
}

const CHOICE_COUNTS: Record<NoteStaffDifficulty, number> = {
  1: 3,
  2: 4,
  3: 5,
}

/** Límites verticales del pentagrama: primera y quinta línea. */
const STAFF_LINES: Record<NoteStaffClef, { low: Pitch; high: Pitch }> = {
  treble: {
    low: { step: 'E', accidental: 0, octave: 4 },
    high: { step: 'F', accidental: 0, octave: 5 },
  },
  bass: {
    low: { step: 'G', accidental: 0, octave: 2 },
    high: { step: 'A', accidental: 0, octave: 3 },
  },
}

const STAFF_CLEF_NAMES: Record<NoteStaffClef, string> = {
  treble: 'sol',
  bass: 'fa',
}

const ORDINALS_FEMININE = [
  'primera',
  'segunda',
  'tercera',
  'cuarta',
  'quinta',
  'sexta',
  'séptima',
  'octava',
  'novena',
] as const

const ORDINALS_MASCULINE = [
  'primer',
  'segundo',
  'tercero',
  'cuarto',
  'quinto',
  'sexto',
  'séptimo',
  'octavo',
  'noveno',
] as const

function ordinal(value: number, gender: 'feminine' | 'masculine' = 'feminine'): string {
  const table = gender === 'masculine' ? ORDINALS_MASCULINE : ORDINALS_FEMININE
  return table[value - 1] ?? `${value}.ª`
}

/**
 * Índice diatónico (línea o espacio) de una nota: cada letra avanza una
 * posición y cada octava avanza siete. La alteración no cambia la posición.
 */
function diatonicIndex(pitch: PitchLike): number {
  if (!isLetter(pitch.step)) {
    throw new Error(`Nota inválida: "${pitch.step}"`)
  }
  return pitch.octave * LETTERS.length + letterIndex(pitch.step)
}

/** Cantidad de líneas adicionales que hay que dibujar para la nota. */
export function ledgerLineCount(clef: NoteStaffClef, target: PitchLike): number {
  const lines = STAFF_LINES[clef]
  const index = diatonicIndex(target)
  const low = diatonicIndex(lines.low)
  const high = diatonicIndex(lines.high)
  if (index < low) return Math.floor((low - index) / 2)
  if (index > high) return Math.floor((index - high) / 2)
  return 0
}

/**
 * Indica si la nota necesita al menos una línea adicional. Un espacio pegado
 * al pentagrama queda fuera de las cinco líneas, pero no dibuja línea extra.
 */
export function usesLedgerLines(clef: NoteStaffClef, target: PitchLike): boolean {
  return ledgerLineCount(clef, target) > 0
}

/** Descripción en español de la posición de la nota en el pentagrama. */
export function describeStaffPosition(clef: NoteStaffClef, target: PitchLike): string {
  const lines = STAFF_LINES[clef]
  const index = diatonicIndex(target)
  const low = diatonicIndex(lines.low)
  const high = diatonicIndex(lines.high)

  if (index < low) {
    const offset = low - index
    if (offset % 2 === 0) {
      return `la ${ordinal(offset / 2)} línea adicional debajo del pentagrama`
    }
    if (offset === 1) return 'el espacio debajo del pentagrama'
    return `el espacio debajo de la ${ordinal((offset - 1) / 2)} línea adicional del pentagrama`
  }

  if (index > high) {
    const offset = index - high
    if (offset % 2 === 0) {
      return `la ${ordinal(offset / 2)} línea adicional arriba del pentagrama`
    }
    if (offset === 1) return 'el espacio encima del pentagrama'
    return `el espacio sobre la ${ordinal((offset - 1) / 2)} línea adicional del pentagrama`
  }

  const offset = index - low
  if (offset % 2 === 0) {
    return `la ${ordinal(offset / 2 + 1)} línea del pentagrama`
  }
  return `el ${ordinal((offset + 1) / 2, 'masculine')} espacio del pentagrama`
}

/**
 * Notas diatónicas (sin alteraciones) que puede presentar un ejercicio según la
 * clave, la dificultad y el rango configurable. La dificultad agrega líneas
 * adicionales de a una por nivel.
 */
export function noteStaffCandidates(
  clef: NoteStaffClef,
  difficulty: NoteStaffDifficulty,
  range: string,
): Pitch[] {
  const lines = STAFF_LINES[clef]
  const maxLedgerLines =
    NOTE_STAFF_MAX_LEDGER_LINES[difficulty] ?? NOTE_STAFF_MAX_LEDGER_LINES[1]
  const low = diatonicIndex(lines.low) - maxLedgerLines * 2
  const high = diatonicIndex(lines.high) + maxLedgerLines * 2
  const { from, to } = parseNoteRange(range)
  const fromMidi = midiOf(from)
  const toMidi = midiOf(to)

  const candidates: Pitch[] = []
  for (let index = low; index <= high; index += 1) {
    const octave = Math.floor(index / LETTERS.length)
    const step = LETTERS[((index % LETTERS.length) + LETTERS.length) % LETTERS.length]
    const pitch: Pitch = { step, accidental: 0, octave }
    const midi = midiOf(pitch)
    if (midi >= fromMidi && midi <= toMidi) {
      candidates.push(pitch)
    }
  }
  return candidates
}

export interface NoteStaffExerciseParams {
  skillId: string
  range: string
  clef: NoteStaffClef
  notation: Notation
  difficulty: NoteStaffDifficulty
  target?: Pitch
}

export interface NoteStaffExercise {
  id: string
  skillId: string
  type: 'note-staff'
  promptEs: string
  explanationEs: string
  difficulty: number
  target: SpelledPitch
  clef: NoteStaffClef
  choices: string[]
}

export interface NoteStaffExerciseBatch extends NoteStaffExerciseParams {
  idPrefix: string
  count: number
}

function buildChoices(
  candidates: Pitch[],
  target: Pitch,
  difficulty: NoteStaffDifficulty,
  notation: Notation,
): string[] {
  const targetName = noteNameOf(target, notation)
  const targetIndex = diatonicIndex(target)
  const wanted = CHOICE_COUNTS[difficulty] ?? CHOICE_COUNTS[1]
  const pool = candidates
    .filter((candidate) => midiOf(candidate) !== midiOf(target))
    .map((candidate) => ({
      name: noteNameOf(candidate, notation),
      distance: Math.abs(diatonicIndex(candidate) - targetIndex),
    }))
    .sort((a, b) => a.distance - b.distance)

  // Los distractores salen de las notas más cercanas para que la respuesta
  // exija leer la posición y no descartar notas lejanas por descarte.
  const nearby = pool.slice(0, Math.max(wanted * 2, 6))
  const distractors: string[] = []
  const available = nearby.map((entry) => entry.name)
  while (distractors.length < wanted - 1 && available.length > 0) {
    const index = Math.floor(Math.random() * available.length)
    const [name] = available.splice(index, 1)
    if (!distractors.includes(name) && name !== targetName) {
      distractors.push(name)
    }
  }

  const choices = [targetName, ...distractors]
  for (let index = choices.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1))
    const current = choices[index]
    choices[index] = choices[swap]
    choices[swap] = current
  }
  return choices
}

/**
 * Genera un ejercicio de identificación de notas en el pentagrama. La clave
 * («sol» o «fa»), las líneas adicionales y la cantidad de opciones se adaptan
 * a la dificultad. Con `target` explícita se puede forzar la nota.
 */
export function generateNoteStaffExercise(
  params: NoteStaffExerciseParams & { id: string },
): NoteStaffExercise {
  const candidates = noteStaffCandidates(params.clef, params.difficulty, params.range)
  if (candidates.length < 2) {
    throw new Error(
      `El rango "${params.range}" no ofrece suficientes notas para la clave de ${STAFF_CLEF_NAMES[params.clef]}`,
    )
  }
  const target = params.target ?? candidates[Math.floor(Math.random() * candidates.length)]
  const position = describeStaffPosition(params.clef, target)
  const clefName = STAFF_CLEF_NAMES[params.clef]
  const targetName = noteNameOf(target, params.notation)
  const ledgerLines = ledgerLineCount(params.clef, target)
  const explanationEs =
    ledgerLines > 0
      ? `La nota ${targetName} está en ${position} en clave de ${clefName} y necesita ${ledgerLines} ${ledgerLines === 1 ? 'línea adicional' : 'líneas adicionales'}.`
      : `La nota ${targetName} está en ${position} en clave de ${clefName}.`

  const exercise: NoteStaffExercise = {
    id: params.id,
    skillId: params.skillId,
    type: 'note-staff',
    promptEs: `¿Qué nota está en ${position} en clave de ${clefName}?`,
    explanationEs,
    difficulty: params.difficulty,
    target: toSpelledPitch(target),
    clef: params.clef,
    choices: buildChoices(candidates, target, params.difficulty, params.notation),
  }
  const result = ExerciseSchema.safeParse(exercise)
  if (!result.success) {
    throw new Error(`El ejercicio generado no es válido: ${result.error.message}`)
  }
  return exercise
}

function chooseStaffTarget(candidates: Pitch[], previous: Pitch | undefined): Pitch {
  const pool =
    previous === undefined
      ? candidates
      : candidates.filter((candidate) => midiOf(candidate) !== midiOf(previous))
  const list = pool.length > 0 ? pool : candidates
  return list[Math.floor(Math.random() * list.length)]
}

/**
 * Genera una secuencia de ejercicios de pentagrama sin repetir la misma nota
 * consecutiva.
 */
export function generateNoteStaffExercises(batch: NoteStaffExerciseBatch): NoteStaffExercise[] {
  const candidates = noteStaffCandidates(batch.clef, batch.difficulty, batch.range)
  if (candidates.length < 2) {
    throw new Error(
      `El rango "${batch.range}" no ofrece suficientes notas para la clave de ${STAFF_CLEF_NAMES[batch.clef]}`,
    )
  }
  const exercises: NoteStaffExercise[] = []
  let previous: Pitch | undefined
  for (let index = 0; index < batch.count; index += 1) {
    const target = chooseStaffTarget(candidates, previous)
    const exercise = generateNoteStaffExercise({
      id: `${batch.idPrefix}-${String(index + 1).padStart(3, '0')}`,
      skillId: batch.skillId,
      range: batch.range,
      clef: batch.clef,
      notation: batch.notation,
      difficulty: batch.difficulty,
      target,
    })
    exercises.push(exercise)
    previous = target
  }
  return exercises
}
