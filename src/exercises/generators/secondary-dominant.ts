import { ExerciseSchema, type Exercise } from '../../schemas/content'
import type { Key } from '../../schemas/notation'
import {
  chordPitches,
  chordSymbol,
  diatonicChord,
  rootName,
  scaleDegree,
  secondaryDominantNumeral,
  type DiatonicMode,
} from '../../theory'
import { formatPitchEs, parsePitch } from '../../theory/pitch'
import type { Pitch } from '../../theory/pitch'

/**
 * Generador de ejercicios de dominantes secundarias.
 *
 * El dominante secundario de un grado es el V de ese grado: toniciza el
 * acorde que le sigue y su tercera (la sensible del grado) sube un semitono
 * hasta su fundamental.
 * - `numeral`: nombra el grado que resuelve y pide el cifrado V/x.
 * - `resolution`: muestra el acorde con su séptima y pide el grado al que
 *   resuelve.
 *
 * En menor se usa la menor natural como referencia diatónica, igual que el
 * motor de respuestas de la app, y se descarta el grado ii° porque no se
 * toniciza. El grado I tampoco se toniciza (su dominante es la propia V).
 */

export const SECONDARY_DOMINANT_ASKS = ['numeral', 'resolution'] as const
export type SecondaryDominantAsk = (typeof SECONDARY_DOMINANT_ASKS)[number]

export const SECONDARY_DOMINANT_DIFFICULTIES = [1, 2, 3] as const
export type SecondaryDominantDifficulty =
  (typeof SECONDARY_DOMINANT_DIFFICULTIES)[number]

/** Las doce tonalidades que usa el resto de los generadores armónicos. */
export const SECONDARY_DOMINANT_TONICS = [
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

const CHOICE_COUNTS: Record<SecondaryDominantDifficulty, number> = {
  1: 3,
  2: 4,
  3: 5,
}

/** Grados que se pueden tonicizar en cada modo. */
export const MAJOR_SECONDARY_TARGETS = [2, 3, 4, 5, 6] as const
export const MINOR_SECONDARY_TARGETS = [3, 4, 5, 6] as const

export function secondaryDominantTargetsFor(
  mode: 'major' | 'minor',
): readonly number[] {
  return mode === 'minor' ? MINOR_SECONDARY_TARGETS : MAJOR_SECONDARY_TARGETS
}

function shuffle<T>(items: T[]): T[] {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1))
    ;[items[index], items[swap]] = [items[swap], items[index]]
  }
  return items
}

function assertKnownTonic(tonic: Key): void {
  if (!(SECONDARY_DOMINANT_TONICS as readonly Key[]).includes(tonic)) {
    throw new Error(
      `La tonalidad "${tonic}" no pertenece a las 12 tonalidades del generador`,
    )
  }
}

function assertTarget(mode: 'major' | 'minor', target: number): void {
  const targets = secondaryDominantTargetsFor(mode)
  if (
    !Number.isInteger(target) ||
    !(targets as readonly number[]).includes(target)
  ) {
    throw new Error(
      `Grado ${target} no se puede tonicizar en ${mode === 'minor' ? 'menor' : 'mayor'}`,
    )
  }
}

function diatonicModeFor(mode: 'major' | 'minor'): DiatonicMode {
  return mode === 'minor' ? 'natural-minor' : 'major'
}

function keyLabelEs(tonic: Key, mode: 'major' | 'minor'): string {
  return `${formatPitchEs(parsePitch(`${tonic}4`))} ${mode === 'minor' ? 'menor' : 'mayor'}`
}

function keyLabelEn(tonic: Key, mode: 'major' | 'minor'): string {
  return `${tonic} ${mode}`
}

function accidentalGlyph(pitch: Pitch): string {
  if (pitch.accidental === 1) return '♯'
  if (pitch.accidental === -1) return '♭'
  if (pitch.accidental === 2) return '𝄪'
  if (pitch.accidental === -2) return '𝄫'
  return ''
}

function pitchNameEn(pitch: Pitch): string {
  return `${pitch.step}${accidentalGlyph(pitch)}`
}

/** El grado del que el dominante secundario toma la fundamental: un cuarto arriba. */
function dominantDegreeFor(target: number): number {
  return ((target - 1 + 4) % 7) + 1
}

interface SecondaryDominantChord {
  pitches: Pitch[]
  symbolEs: string
  symbolEn: string
  /** Tercera del acorde: la sensible del grado que resuelve. */
  leadingTone: Pitch
}

function dominantChord(
  tonic: Key,
  mode: 'major' | 'minor',
  target: number,
): SecondaryDominantChord {
  const diatonicMode = diatonicModeFor(mode)
  const root = scaleDegree(tonic, diatonicMode, dominantDegreeFor(target))
  const pitches = chordPitches(root, 'dominant7')
  const leadingTone = pitches[1]
  if (!leadingTone) {
    throw new Error(`El dominante de ${target} no tiene tercera`)
  }
  return {
    pitches,
    symbolEs: chordSymbol(root, 'dominant7', { notation: 'do' }),
    symbolEn: chordSymbol(root, 'dominant7'),
    leadingTone,
  }
}

function notesEs(pitches: readonly Pitch[]): string {
  return pitches.map((pitch) => formatPitchEs(pitch)).join(', ')
}

function notesEn(pitches: readonly Pitch[]): string {
  return pitches.map(pitchNameEn).join(', ')
}

/** Los demás dominantes secundarios de la tonalidad, más la V simple. */
function numeralDistractors(
  mode: 'major' | 'minor',
  answer: string,
  wanted: number,
): string[] {
  const diatonicMode = diatonicModeFor(mode)
  const pool = secondaryDominantTargetsFor(mode)
    .map((target) => secondaryDominantNumeral(target, diatonicMode))
    .filter((numeral) => numeral !== answer)
  pool.push('V')
  const unique = [...new Set(pool)]
  if (unique.length < wanted) {
    throw new Error('No hay suficientes dominantes secundarias para distraer')
  }
  return shuffle(unique).slice(0, wanted)
}

/** Los grados de la tonalidad que no son la resolución. */
function resolutionDistractors(
  tonic: Key,
  mode: 'major' | 'minor',
  answer: string,
  wanted: number,
): string[] {
  const diatonicMode = diatonicModeFor(mode)
  const unique = [
    ...new Set(
      [1, 2, 3, 4, 5, 6, 7].map(
        (degree) => diatonicChord(tonic, diatonicMode, degree).roman,
      ),
    ),
  ].filter((numeral) => numeral !== answer)
  if (unique.length < wanted) {
    throw new Error('No hay suficientes grados para distraer')
  }
  return shuffle(unique).slice(0, wanted)
}

export interface SecondaryDominantExerciseParams {
  id: string
  skillId: string
  tonic: Key
  mode?: 'major' | 'minor'
  /** Grado que toniciza el dominante secundario. */
  target: number
  /** Dirección del ejercicio: el cifrado o el grado de resolución. */
  ask?: SecondaryDominantAsk
  difficulty?: SecondaryDominantDifficulty
}

/**
 * Genera un ejercicio de dominante secundario en la dirección pedida. La
 * respuesta se deduce del grado con el motor de teoría y el esquema valida
 * el resultado antes de devolverlo.
 */
export function generateSecondaryDominantExercise(
  params: SecondaryDominantExerciseParams,
): Exercise {
  assertKnownTonic(params.tonic)
  const mode = params.mode ?? 'major'
  assertTarget(mode, params.target)
  const ask = params.ask ?? 'numeral'
  const difficulty = params.difficulty ?? 3
  const wanted = CHOICE_COUNTS[difficulty] - 1

  const diatonicMode = diatonicModeFor(mode)
  const targetChord = diatonicChord(params.tonic, diatonicMode, params.target)
  const targetRoman = targetChord.roman
  const numeral = secondaryDominantNumeral(params.target, diatonicMode)
  const chord = dominantChord(params.tonic, mode, params.target)
  const targetRootEs = rootName(targetChord.root, 'do')
  const targetRootEn = rootName(targetChord.root)

  if (ask === 'numeral') {
    const answer = numeral
    const choices = shuffle([
      answer,
      ...numeralDistractors(mode, answer, wanted),
    ])
    const exercise = {
      id: params.id,
      skillId: params.skillId,
      type: 'secondary-dominant' as const,
      promptEs: `En ${keyLabelEs(params.tonic, mode)}, ¿cómo se cifra el dominante secundario que resuelve en ${targetRoman}?`,
      promptEn: `In ${keyLabelEn(params.tonic, mode)}, how is the secondary dominant that resolves to ${targetRoman} labelled?`,
      explanationEs: `En ${keyLabelEs(params.tonic, mode)}, el dominante de ${targetRoman} es ${chord.symbolEs} y se cifra ${answer}. Resuelve en ${targetRootEs} (${targetRoman}): su tercera (${formatPitchEs(chord.leadingTone)}) es la sensible de ${targetRootEs} y sube un semitono.`,
      explanationEn: `In ${keyLabelEn(params.tonic, mode)}, the dominant of ${targetRoman} is ${chord.symbolEn} and it is labelled ${answer}. It resolves to ${targetRootEn} (${targetRoman}): its third (${pitchNameEn(chord.leadingTone)}) is the leading tone of ${targetRootEn} and rises a semitone.`,
      difficulty,
      key: params.tonic,
      mode,
      target: params.target,
      ask,
      choices,
      choicesEn: [...choices],
    }
    return parseExercise(exercise)
  }

  const answer = targetRoman
  const choices = shuffle([
    answer,
    ...resolutionDistractors(params.tonic, mode, answer, wanted),
  ])
  const exercise = {
    id: params.id,
    skillId: params.skillId,
    type: 'secondary-dominant' as const,
    promptEs: `En ${keyLabelEs(params.tonic, mode)}, el acorde ${chord.symbolEs} (${notesEs(chord.pitches)}) es un dominante secundario. ¿En qué grado resuelve?`,
    promptEn: `In ${keyLabelEn(params.tonic, mode)}, the chord ${chord.symbolEn} (${notesEn(chord.pitches)}) is a secondary dominant. To which degree does it resolve?`,
    explanationEs: `En ${keyLabelEs(params.tonic, mode)}, ${chord.symbolEs} es la dominante de ${targetRoman}: se cifra ${numeral} y resuelve en ${targetRootEs} (${targetRoman}). Su tercera (${formatPitchEs(chord.leadingTone)}) es la sensible de ${targetRootEs} y sube un semitono.`,
    explanationEn: `In ${keyLabelEn(params.tonic, mode)}, ${chord.symbolEn} is the dominant of ${targetRoman}: it is labelled ${numeral} and resolves to ${targetRootEn} (${targetRoman}). Its third (${pitchNameEn(chord.leadingTone)}) is the leading tone of ${targetRootEn} and rises a semitone.`,
    difficulty,
    key: params.tonic,
    mode,
    target: params.target,
    ask,
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

export interface SecondaryDominantExerciseBatch {
  idPrefix: string
  skillId: string
  tonics?: readonly Key[]
  modes?: readonly ('major' | 'minor')[]
  targets?: readonly number[]
  asks?: readonly SecondaryDominantAsk[]
  difficulty?: SecondaryDominantDifficulty
  /** Si se omite, genera todas las combinaciones. */
  count?: number
}

/**
 * Genera la matriz de ejercicios. Por defecto recorre las doce tonalidades
 * mayores, los cinco grados tonicizables y las dos direcciones.
 */
export function generateSecondaryDominantExercises(
  batch: SecondaryDominantExerciseBatch,
): Exercise[] {
  const tonics = batch.tonics ?? SECONDARY_DOMINANT_TONICS
  const modes = batch.modes ?? (['major'] as const)
  const asks = batch.asks ?? SECONDARY_DOMINANT_ASKS
  const combinations: Array<{
    tonic: Key
    mode: 'major' | 'minor'
    target: number
    ask: SecondaryDominantAsk
  }> = []

  for (const tonic of tonics) {
    for (const mode of modes) {
      const targets = batch.targets ?? secondaryDominantTargetsFor(mode)
      for (const target of targets) {
        for (const ask of asks) {
          combinations.push({ tonic, mode, target, ask })
        }
      }
    }
  }
  if (combinations.length === 0) return []

  const count = batch.count ?? combinations.length
  const exercises: Exercise[] = []
  for (let index = 0; index < count; index += 1) {
    const combination = combinations[index % combinations.length]
    exercises.push(
      generateSecondaryDominantExercise({
        id: `${batch.idPrefix}-${String(index + 1).padStart(3, '0')}`,
        skillId: batch.skillId,
        tonic: combination.tonic,
        mode: combination.mode,
        target: combination.target,
        ask: combination.ask,
        difficulty: batch.difficulty,
      }),
    )
  }
  return exercises
}
