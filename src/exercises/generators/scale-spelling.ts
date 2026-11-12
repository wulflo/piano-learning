import { ExerciseSchema } from '../../schemas/content'
import type { Key } from '../../schemas/notation'
import {
  LETTERS,
  scaleNames,
  type ScaleMode,
} from '../../theory'

export const SCALE_SPELLING_DIFFICULTIES = [1, 2, 3] as const
export type ScaleSpellingDifficulty = (typeof SCALE_SPELLING_DIFFICULTIES)[number]

/** Las doce tónicas que usa el contenido de M2 (hasta siete alteraciones). */
export const SCALE_SPELLING_TONICS = [
  'C',
  'G',
  'D',
  'A',
  'E',
  'B',
  'F#',
  'F',
  'Bb',
  'Eb',
  'Ab',
  'Db',
] as const satisfies readonly Key[]

/**
 * Modos y escalas que enseña M2: mayor y menores, los siete modos diatónicos,
 * pentatónicas, blues, cromática y tonos enteros.
 */
export const SCALE_SPELLING_MODES = [
  'major',
  'natural-minor',
  'harmonic-minor',
  'melodic-minor',
  'ionian',
  'dorian',
  'phrygian',
  'lydian',
  'mixolydian',
  'aeolian',
  'locrian',
  'major-pentatonic',
  'minor-pentatonic',
  'blues',
  'chromatic',
  'whole-tone',
] as const satisfies readonly ScaleMode[]

const DISTRACTOR_COUNTS: Record<ScaleSpellingDifficulty, number> = {
  1: 1,
  2: 2,
  3: 3,
}

const SOLFEGE: Record<string, string> = {
  C: 'Do',
  D: 'Re',
  E: 'Mi',
  F: 'Fa',
  G: 'Sol',
  A: 'La',
  B: 'Si',
}

const ACCIDENTAL_NAMES_ES: Record<string, string> = {
  '': '',
  '#': ' sostenido',
  b: ' bemol',
  '##': ' doble sostenido',
  bb: ' doble bemol',
}

const MODE_LABELS_ES: Record<ScaleMode, string> = {
  major: 'mayor',
  'natural-minor': 'menor natural',
  'harmonic-minor': 'menor armónica',
  'melodic-minor': 'menor melódica',
  ionian: 'jónica',
  dorian: 'dórica',
  phrygian: 'frigia',
  lydian: 'lidia',
  mixolydian: 'mixolidia',
  aeolian: 'eólica',
  locrian: 'locria',
  'major-pentatonic': 'pentatónica mayor',
  'minor-pentatonic': 'pentatónica menor',
  blues: 'de blues',
  chromatic: 'cromática',
  'whole-tone': 'de tonos enteros',
}

const NOTE_TOKEN = /^([A-G])(##|bb|#|b)?$/

const ACCIDENTAL_VARIANTS: Record<string, string[]> = {
  '': ['#', 'b'],
  '#': ['##', ''],
  b: ['', 'bb'],
  '##': ['#'],
  bb: ['b'],
}

function tonicNameEs(tonic: Key): string {
  const match = /^([A-G])(##|bb|#|b)?$/.exec(tonic)
  if (!match) {
    throw new Error(`Tónica inválida: "${tonic}"`)
  }
  return `${SOLFEGE[match[1]]}${ACCIDENTAL_NAMES_ES[match[2] ?? ''] ?? ''}`
}

/**
 * Respuesta canónica sin octavas, con la tónica repetida al final. Por ejemplo,
 * Do mayor se escribe «C D E F G A B C». La ortografía sale del motor de teoría.
 */
export function canonicalScaleSpelling(tonic: Key, mode: ScaleMode): string {
  const names = scaleNames(tonic, mode)
  if (names.length === 0) {
    throw new Error(`La escala ${mode} de ${tonic} no tiene notas`)
  }
  return [...names, names[0]].join(' ')
}

/**
 * Normaliza una respuesta escrita por teclado: acepta minúsculas, comas,
 * espacios de más y los símbolos ♯/♭.
 */
export function normalizeScaleSpelling(value: string): string {
  return value
    .replace(/♯/g, '#')
    .replace(/♭/g, 'b')
    .split(/[\s,;|]+/)
    .filter(Boolean)
    .map((token) => `${token.charAt(0).toUpperCase()}${token.slice(1)}`)
    .join(' ')
}

/** Compara la respuesta del alumno con la ortografía canónica del ejercicio. */
export function isCorrectScaleSpelling(
  exercise: Pick<ScaleSpellingExercise, 'answer'>,
  value: string,
): boolean {
  return normalizeScaleSpelling(value) === normalizeScaleSpelling(exercise.answer)
}

function shuffle<T>(items: T[]): T[] {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1))
    const current = items[index]
    items[index] = items[swap]
    items[swap] = current
  }
  return items
}

/**
 * Distractores plausibles: cambian la alteración de un grado interno sin mover
 * la letra. Así el alumno debe decidir la ortografía, no solo la altura.
 */
function buildDistractors(answer: string, count: number): string[] {
  const tokens = answer.split(' ')
  const candidates: string[] = []
  const push = (candidate: string) => {
    if (candidate !== answer && !candidates.includes(candidate)) {
      candidates.push(candidate)
    }
  }

  for (let index = 1; index < tokens.length - 1; index += 1) {
    const match = NOTE_TOKEN.exec(tokens[index])
    if (!match) continue
    for (const accidental of ACCIDENTAL_VARIANTS[match[2] ?? ''] ?? []) {
      const copy = [...tokens]
      copy[index] = `${match[1]}${accidental}`
      push(copy.join(' '))
    }
  }

  // Respaldo por si alguna escala tuviera muy pocos grados internos: cambia la
  // letra de un grado manteniendo la posición en la escala.
  if (candidates.length < count) {
    for (let index = 1; index < tokens.length - 1; index += 1) {
      const match = NOTE_TOKEN.exec(tokens[index])
      if (!match) continue
      const letterIndex = LETTERS.indexOf(match[1] as (typeof LETTERS)[number])
      const nextLetter = LETTERS[(letterIndex + 1) % LETTERS.length]
      const copy = [...tokens]
      copy[index] = `${nextLetter}${match[2] ?? ''}`
      push(copy.join(' '))
    }
  }

  return shuffle(candidates).slice(0, count)
}

export interface ScaleSpellingExerciseParams {
  id: string
  skillId: string
  tonic: Key
  mode: ScaleMode
  difficulty: ScaleSpellingDifficulty
}

export interface ScaleSpellingExercise {
  id: string
  skillId: string
  type: 'scale-spelling'
  promptEs: string
  explanationEs: string
  difficulty: number
  tonic: Key
  mode: ScaleMode
  answer: string
  choices: string[]
}

export interface ScaleSpellingExerciseBatch {
  skillId: string
  idPrefix: string
  difficulty: ScaleSpellingDifficulty
  tonics?: readonly Key[]
  modes?: readonly ScaleMode[]
  /** Si se omite, genera la matriz completa de tónicas × modos. */
  count?: number
}

/**
 * Genera un ejercicio de deletreo con la respuesta canónica para corregir
 * entradas escritas por teclado y opciones de respaldo para la UI.
 */
export function generateScaleSpellingExercise(
  params: ScaleSpellingExerciseParams,
): ScaleSpellingExercise {
  const answer = canonicalScaleSpelling(params.tonic, params.mode)
  const label = MODE_LABELS_ES[params.mode]
  const tonic = tonicNameEs(params.tonic)
  const distractors = buildDistractors(answer, DISTRACTOR_COUNTS[params.difficulty] ?? 1)
  if (distractors.length < (DISTRACTOR_COUNTS[params.difficulty] ?? 1)) {
    throw new Error(`No se pudieron generar distractores para ${params.tonic} ${params.mode}`)
  }

  const exercise: ScaleSpellingExercise = {
    id: params.id,
    skillId: params.skillId,
    type: 'scale-spelling',
    promptEs: `¿Cómo se deletrea la escala ${label} de ${tonic}?`,
    explanationEs: `La escala ${label} de ${tonic} se deletrea ${answer}.`,
    difficulty: params.difficulty,
    tonic: params.tonic,
    mode: params.mode,
    answer,
    choices: shuffle([answer, ...distractors]),
  }

  const result = ExerciseSchema.safeParse(exercise)
  if (!result.success) {
    throw new Error(`El ejercicio generado no es válido: ${result.error.message}`)
  }
  return exercise
}

/**
 * Genera la matriz de ejercicios de deletreo. Por defecto cubre las 12 tónicas
 * de M2 y todos los modos que enseña el módulo, en orden estable.
 */
export function generateScaleSpellingExercises(
  batch: ScaleSpellingExerciseBatch,
): ScaleSpellingExercise[] {
  const tonics = batch.tonics ?? SCALE_SPELLING_TONICS
  const modes = batch.modes ?? SCALE_SPELLING_MODES
  const combinations: Array<{ tonic: Key; mode: ScaleMode }> = []
  for (const tonic of tonics) {
    for (const mode of modes) {
      combinations.push({ tonic, mode })
    }
  }
  if (combinations.length === 0) return []

  const count = batch.count ?? combinations.length
  const exercises: ScaleSpellingExercise[] = []
  for (let index = 0; index < count; index += 1) {
    const combination = combinations[index % combinations.length]
    exercises.push(
      generateScaleSpellingExercise({
        id: `${batch.idPrefix}-${String(index + 1).padStart(3, '0')}`,
        skillId: batch.skillId,
        tonic: combination.tonic,
        mode: combination.mode,
        difficulty: batch.difficulty,
      }),
    )
  }
  return exercises
}
