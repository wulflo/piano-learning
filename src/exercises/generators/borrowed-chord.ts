import { ExerciseSchema, type Exercise } from '../../schemas/content'
import type { Key } from '../../schemas/notation'
import {
  CHORD_DEFINITIONS,
  diatonicChord,
  rootName,
  type DiatonicMode,
} from '../../theory'
import { formatPitchEs, parsePitch } from '../../theory/pitch'

/**
 * Generador de ejercicios de acordes prestados (intercambio modal).
 *
 * En una tonalidad mayor se toman prestados acordes del modo menor paralelo
 * (bIII, iv, v, bVI y bVII); en una tonalidad menor se toman del modo mayor
 * (I, IV y vi). El ejercicio muestra el acorde por su nombre y sus notas y
 * pide el número romano que le corresponde en el modo de la tonalidad.
 *
 * Los distractores mezclan los demás préstamos del mismo modo con los
 * numerales diatónicos de la tonalidad, que son los primeros candidatos
 * equivocados (IV/iv, VI/bVI, v/V).
 */

export const BORROWED_CHORD_DIFFICULTIES = [1, 2, 3] as const
export type BorrowedChordDifficulty =
  (typeof BORROWED_CHORD_DIFFICULTIES)[number]

/** Las doce tonalidades que usa el resto de los generadores armónicos. */
export const BORROWED_CHORD_TONICS = [
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

const CHOICE_COUNTS: Record<BorrowedChordDifficulty, number> = {
  1: 3,
  2: 4,
  3: 5,
}

/** Grados del modo paralelo que se prestan en cada tonalidad. */
export const MAJOR_BORROWED_TARGETS = [3, 4, 5, 6, 7] as const
export const MINOR_BORROWED_TARGETS = [1, 4, 6] as const

export const MAJOR_BORROWED_NUMERALS: Record<number, string> = {
  3: 'bIII',
  4: 'iv',
  5: 'v',
  6: 'bVI',
  7: 'bVII',
}

export const MINOR_BORROWED_NUMERALS: Record<number, string> = {
  1: 'I',
  4: 'IV',
  6: 'vi',
}

const BORROWED_ROLES: Record<
  'major' | 'minor',
  Record<string, { es: string; en: string }>
> = {
  major: {
    bIII: {
      es: 'la mediana mayor del modo menor',
      en: 'the major mediant of the minor mode',
    },
    iv: {
      es: 'la subdominante menor',
      en: 'the minor subdominant',
    },
    v: {
      es: 'la dominante menor sin sensible',
      en: 'the minor dominant without a leading tone',
    },
    bVI: {
      es: 'la submediante del modo paralelo',
      en: 'the submediant of the parallel mode',
    },
    bVII: {
      es: 'la subtónica del modo menor',
      en: 'the subtonic of the minor mode',
    },
  },
  minor: {
    I: {
      es: 'la tónica mayor (tercera de picardía)',
      en: 'the major tonic (picardy third)',
    },
    IV: {
      es: 'la subdominante mayor',
      en: 'the major subdominant',
    },
    vi: {
      es: 'la submediante menor',
      en: 'the minor submediant',
    },
  },
}

export function borrowedChordTargetsFor(
  mode: 'major' | 'minor',
): readonly number[] {
  return mode === 'minor' ? MINOR_BORROWED_TARGETS : MAJOR_BORROWED_TARGETS
}

function shuffle<T>(items: T[]): T[] {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1))
    ;[items[index], items[swap]] = [items[swap], items[index]]
  }
  return items
}

function assertKnownTonic(tonic: Key): void {
  if (!(BORROWED_CHORD_TONICS as readonly Key[]).includes(tonic)) {
    throw new Error(
      `La tonalidad "${tonic}" no pertenece a las 12 tonalidades del generador`,
    )
  }
}

function assertTarget(mode: 'major' | 'minor', degree: number): void {
  const targets = borrowedChordTargetsFor(mode)
  if (
    !Number.isInteger(degree) ||
    !(targets as readonly number[]).includes(degree)
  ) {
    throw new Error(
      `El grado ${degree} no se presta en ${mode === 'minor' ? 'menor' : 'mayor'}`,
    )
  }
}

function diatonicModeFor(mode: 'major' | 'minor'): DiatonicMode {
  // El modo paralelo: en mayor se presta del menor natural y en menor del mayor.
  return mode === 'minor' ? 'major' : 'natural-minor'
}

function keyLabelEs(tonic: Key, mode: 'major' | 'minor'): string {
  return `${formatPitchEs(parsePitch(`${tonic}4`))} ${mode === 'minor' ? 'menor' : 'mayor'}`
}

function keyLabelEn(tonic: Key, mode: 'major' | 'minor'): string {
  return `${tonic} ${mode}`
}

function accidentalGlyph(pitch: { step: string; accidental: number }): string {
  if (pitch.accidental === 1) return '♯'
  if (pitch.accidental === -1) return '♭'
  if (pitch.accidental === 2) return '𝄪'
  if (pitch.accidental === -2) return '𝄫'
  return ''
}

function pitchNameEn(pitch: { step: string; accidental: number }): string {
  return `${pitch.step}${accidentalGlyph(pitch)}`
}

/** Los demás préstamos del mismo modo y los numerales diatónicos de la tonalidad. */
function distractors(
  tonic: Key,
  mode: 'major' | 'minor',
  answer: string,
  wanted: number,
): string[] {
  const numeralsMap =
    mode === 'minor' ? MINOR_BORROWED_NUMERALS : MAJOR_BORROWED_NUMERALS
  const pool = borrowedChordTargetsFor(mode).map((degree) => numeralsMap[degree])
  const diatonicMode: DiatonicMode =
    mode === 'minor' ? 'natural-minor' : 'major'
  pool.push(
    ...[1, 2, 3, 4, 5, 6, 7].map(
      (degree) => diatonicChord(tonic, diatonicMode, degree).roman,
    ),
  )
  const unique = [...new Set(pool)].filter((numeral) => numeral !== answer)
  if (unique.length < wanted) {
    throw new Error('No hay suficientes numerales para distraer')
  }
  return shuffle(unique).slice(0, wanted)
}

export interface BorrowedChordExerciseParams {
  id: string
  skillId: string
  tonic: Key
  mode?: 'major' | 'minor'
  /** Grado del modo paralelo que se presta. */
  degree: number
  difficulty?: BorrowedChordDifficulty
}

/**
 * Genera un ejercicio de acorde prestado. La respuesta se deduce del grado
 * con el motor de teoría y el esquema valida el resultado antes de
 * devolverlo.
 */
export function generateBorrowedChordExercise(
  params: BorrowedChordExerciseParams,
): Exercise {
  assertKnownTonic(params.tonic)
  const mode = params.mode ?? 'major'
  assertTarget(mode, params.degree)
  const difficulty = params.difficulty ?? 3
  const wanted = CHOICE_COUNTS[difficulty] - 1

  const parallelMode = diatonicModeFor(mode)
  const chord = diatonicChord(params.tonic, parallelMode, params.degree)
  const numeralsMap =
    mode === 'minor' ? MINOR_BORROWED_NUMERALS : MAJOR_BORROWED_NUMERALS
  const numeral = numeralsMap[params.degree]
  const role = BORROWED_ROLES[mode][numeral]
  const parallelName =
    mode === 'minor'
      ? `${keyLabelEs(params.tonic, 'major')}`
      : `${formatPitchEs(parsePitch(`${params.tonic}4`))} menor natural`
  const nameEs = `${rootName(chord.root, 'do')} ${CHORD_DEFINITIONS[chord.quality].nameEs}`
  const nameEn = `${rootName(chord.root)} ${CHORD_DEFINITIONS[chord.quality].nameEn}`
  const notesEs = chord.pitches.map((pitch) => formatPitchEs(pitch)).join(', ')
  const notesEn = chord.pitches.map(pitchNameEn).join(', ')

  const choices = shuffle([
    numeral,
    ...distractors(params.tonic, mode, numeral, wanted),
  ])
  const exercise = {
    id: params.id,
    skillId: params.skillId,
    type: 'borrowed-chord' as const,
    promptEs: `En ${keyLabelEs(params.tonic, mode)}, el acorde ${nameEs} (${notesEs}) se toma prestado del modo paralelo. ¿Qué número romano le corresponde?`,
    promptEn: `In ${keyLabelEn(params.tonic, mode)}, the chord ${nameEn} (${notesEn}) is borrowed from the parallel mode. Which Roman numeral does it get?`,
    explanationEs: `En ${keyLabelEs(params.tonic, mode)}, ${nameEs} es el ${numeral} del modo paralelo (${parallelName}), ${role.es}, y se cifra ${numeral}. El intercambio modal conserva la fundamental del grado pero cambia su cualidad y, a veces, añade una alteración.`,
    explanationEn: `In ${keyLabelEn(params.tonic, mode)}, ${nameEn} is the ${numeral} of the parallel mode, ${role.en}, and it is labelled ${numeral}. Modal mixture keeps the root of the degree but changes its quality and sometimes adds an accidental.`,
    difficulty,
    key: params.tonic,
    mode,
    numeral,
    choices,
    choicesEn: [...choices],
  }
  return parseExercise(exercise)
}

function parseExercise(exercise: unknown): Exercise {
  const result = ExerciseSchema.safeParse(exercise)
  if (!result.success) {
    throw new Error(
      `El ejercicio generado no es válido: ${result.error.message}`,
    )
  }
  return result.data
}

export interface BorrowedChordExerciseBatch {
  idPrefix: string
  skillId: string
  tonics?: readonly Key[]
  modes?: readonly ('major' | 'minor')[]
  degrees?: readonly number[]
  difficulty?: BorrowedChordDifficulty
  /** Si se omite, genera todas las combinaciones. */
  count?: number
}

/**
 * Genera la matriz de ejercicios. Por defecto recorre las doce tonalidades
 * mayores y los cinco préstamos del modo menor paralelo.
 */
export function generateBorrowedChordExercises(
  batch: BorrowedChordExerciseBatch,
): Exercise[] {
  const tonics = batch.tonics ?? BORROWED_CHORD_TONICS
  const modes = batch.modes ?? (['major'] as const)
  const combinations: Array<{
    tonic: Key
    mode: 'major' | 'minor'
    degree: number
  }> = []

  for (const tonic of tonics) {
    for (const mode of modes) {
      const degrees = batch.degrees ?? borrowedChordTargetsFor(mode)
      for (const degree of degrees) {
        combinations.push({ tonic, mode, degree })
      }
    }
  }
  if (combinations.length === 0) return []

  const count = batch.count ?? combinations.length
  const exercises: Exercise[] = []
  for (let index = 0; index < count; index += 1) {
    const combination = combinations[index % combinations.length]
    exercises.push(
      generateBorrowedChordExercise({
        id: `${batch.idPrefix}-${String(index + 1).padStart(3, '0')}`,
        skillId: batch.skillId,
        tonic: combination.tonic,
        mode: combination.mode,
        degree: combination.degree,
        difficulty: batch.difficulty,
      }),
    )
  }
  return exercises
}
