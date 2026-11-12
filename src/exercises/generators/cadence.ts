import { ExerciseSchema, type Exercise } from '../../schemas/content'
import type { Key } from '../../schemas/notation'
import {
  cadenceName,
  cadenceTypeFor,
  chordSymbol,
  diatonicChords,
  type CadenceType,
  type DiatonicMode,
} from '../../theory'
import {
  formatPitchEs,
  parsePitch,
  type Pitch,
} from '../../theory/pitch'

/**
 * Generador de ejercicios de cadencias.
 *
 * Cubre las dos tareas que pide el curso:
 * - `identify`: muestra los dos acordes de una cadencia y pide su tipo.
 * - `complete`: muestra la cadencia con un grado oculto y pide el numeral que
 *   falta.
 *
 * Las cadencias se construyen a partir de los grados que ya conoce el motor
 * (`cadenceTypeFor`), de modo que la respuesta no se duplica en el generador.
 * En menor se usa la escala armónica para que la auténtica tenga su dominante
 * con sensible (V-I) y la rota su VI mayor.
 */

export const CADENCE_TYPES = [
  'authentic',
  'plagal',
  'half',
  'deceptive',
] as const satisfies readonly CadenceType[]

export const CADENCE_DIRECTIONS = ['identify', 'complete'] as const
export type CadenceDirection = (typeof CADENCE_DIRECTIONS)[number]

export const CADENCE_DIFFICULTIES = [1, 2, 3] as const
export type CadenceDifficulty = (typeof CADENCE_DIFFICULTIES)[number]

/** Las doce tonalidades que usa el resto de los generadores armónicos. */
export const CADENCE_TONICS = [
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

const CHOICE_COUNTS: Record<CadenceDifficulty, number> = {
  1: 3,
  2: 4,
  3: 5,
}

interface CadenceDegrees {
  fromDegree: number
  toDegree: number
  /** Grado que se oculta en la dirección `complete`. */
  missing: 'from' | 'to'
}

const CADENCE_DESCRIPTIONS: Record<
  CadenceType,
  { es: string; en: string }
> = {
  authentic: {
    es: 'va de V a I y cierra la frase con fuerza',
    en: 'goes from V to I and closes the phrase strongly',
  },
  plagal: {
    es: 'va de IV a I y cierra con un sonido más suave',
    en: 'goes from IV to I and closes with a softer sound',
  },
  half: {
    es: 'termina en V y deja la frase abierta',
    en: 'ends on V and leaves the phrase open',
  },
  deceptive: {
    es: 'va de V a vi y evita el cierre definitivo',
    en: 'goes from V to vi and avoids the definitive close',
  },
}

function shuffle<T>(items: T[]): T[] {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1))
    ;[items[index], items[swap]] = [items[swap], items[index]]
  }
  return items
}

function assertKnownTonic(tonic: Key): void {
  if (!(CADENCE_TONICS as readonly Key[]).includes(tonic)) {
    throw new Error(
      `La tonalidad "${tonic}" no pertenece a las 12 tonalidades del generador`,
    )
  }
}

function diatonicModeFor(mode: 'major' | 'minor'): DiatonicMode {
  return mode === 'minor' ? 'harmonic-minor' : 'major'
}

function keyNameEs(tonic: Key): string {
  return formatPitchEs(parsePitch(`${tonic}4`))
}

function keyLabelEs(tonic: Key, mode: 'major' | 'minor'): string {
  return `${keyNameEs(tonic)} ${mode === 'minor' ? 'menor' : 'mayor'}`
}

function keyLabelEn(tonic: Key, mode: 'major' | 'minor'): string {
  return `${tonic} ${mode}`
}

/**
 * Grados de cada cadencia. La semicadencia sale del ii en mayor y de la tónica
 * en menor; en la dirección `complete` se oculta el acorde que deja el hueco
 * inequívoco: la dominante en las semicadencias y el primer acorde en las
 * cadencias conclusivas.
 */
function cadenceDegrees(
  type: CadenceType,
  mode: 'major' | 'minor',
): CadenceDegrees {
  switch (type) {
    case 'authentic':
      return { fromDegree: 5, toDegree: 1, missing: 'from' }
    case 'plagal':
      return { fromDegree: 4, toDegree: 1, missing: 'from' }
    case 'deceptive':
      return { fromDegree: 5, toDegree: 6, missing: 'to' }
    case 'half':
      return {
        fromDegree: mode === 'minor' ? 1 : 2,
        toDegree: 5,
        missing: 'to',
      }
  }
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

interface ChordDescription {
  symbolEs: string
  symbolEn: string
  notesEs: string
  notesEn: string
}

function describeChord(
  tonic: Key,
  mode: 'major' | 'minor',
  degree: number,
): ChordDescription {
  const chord = diatonicChords(tonic, diatonicModeFor(mode))[degree - 1]
  if (!chord) throw new Error(`Grado inválido: ${degree}`)
  return {
    symbolEs: chordSymbol(chord.root, chord.quality, { notation: 'do' }),
    symbolEn: chordSymbol(chord.root, chord.quality, { notation: 'c' }),
    notesEs: chord.pitches.map((pitch) => formatPitchEs(pitch)).join(', '),
    notesEn: chord.pitches.map(pitchNameEn).join(', '),
  }
}

function cadenceChordText(
  tonic: Key,
  mode: 'major' | 'minor',
  degrees: CadenceDegrees,
  locale: 'es' | 'en',
): string {
  const from = describeChord(tonic, mode, degrees.fromDegree)
  const to = describeChord(tonic, mode, degrees.toDegree)
  if (locale === 'es') {
    return `${from.symbolEs} (${from.notesEs}) y ${to.symbolEs} (${to.notesEs})`
  }
  return `${from.symbolEn} (${from.notesEn}) and ${to.symbolEn} (${to.notesEn})`
}

function cadenceChoices(): { es: string[]; en: string[] } {
  const order = shuffle([...CADENCE_TYPES])
  return {
    es: order.map((type) => cadenceName(type, 'es')),
    en: order.map((type) => cadenceName(type, 'en')),
  }
}

function identifyExercise(
  params: CadenceExerciseParams,
  degrees: CadenceDegrees,
  difficulty: CadenceDifficulty,
): Exercise {
  const mode = params.mode ?? 'major'
  const names = cadenceChoices()
  const type = cadenceTypeFor(degrees.fromDegree, degrees.toDegree)
  if (type !== params.type) {
    throw new Error(
      `Los grados ${degrees.fromDegree}-${degrees.toDegree} no forman la cadencia ${params.type}`,
    )
  }
  const description = CADENCE_DESCRIPTIONS[params.type]
  const exercise = {
    id: params.id,
    skillId: params.skillId,
    type: 'cadence' as const,
    promptEs: `En ${keyLabelEs(params.tonic, mode)}, ¿qué cadencia forman los acordes ${cadenceChordText(params.tonic, mode, degrees, 'es')}?`,
    promptEn: `In ${keyLabelEn(params.tonic, mode)}, what cadence do the chords ${cadenceChordText(params.tonic, mode, degrees, 'en')} form?`,
    explanationEs: `La cadencia ${cadenceName(params.type, 'es')} ${description.es}. En ${keyLabelEs(params.tonic, mode)}, ${cadenceChordText(params.tonic, mode, degrees, 'es')}.`,
    explanationEn: `The ${cadenceName(params.type, 'en')} ${description.en}. In ${keyLabelEn(params.tonic, mode)}, ${cadenceChordText(params.tonic, mode, degrees, 'en')}.`,
    difficulty,
    key: params.tonic,
    mode,
    fromDegree: degrees.fromDegree,
    toDegree: degrees.toDegree,
    choices: names.es,
    choicesEn: names.en,
  }
  return parseExercise(exercise)
}

function completeExercise(
  params: CadenceExerciseParams,
  degrees: CadenceDegrees,
  difficulty: CadenceDifficulty,
): Exercise {
  const mode = params.mode ?? 'major'
  const chords = diatonicChords(params.tonic, diatonicModeFor(mode))
  const fromNumeral = chords[degrees.fromDegree - 1]?.roman
  const toNumeral = chords[degrees.toDegree - 1]?.roman
  if (fromNumeral === undefined || toNumeral === undefined) {
    throw new Error('La cadencia tiene grados fuera de la escala')
  }
  const complete = [fromNumeral, toNumeral]
  const missingIndex = degrees.missing === 'from' ? 0 : 1
  const answer = complete[missingIndex]
  const distractors = shuffle(
    chords
      .map((chord) => chord.roman)
      .filter((numeral) => numeral !== answer),
  ).slice(0, CHOICE_COUNTS[difficulty] - 1)
  if (distractors.length < CHOICE_COUNTS[difficulty] - 1) {
    throw new Error(
      `No hay suficientes distractores para ${params.tonic} ${mode}`,
    )
  }
  const choices = shuffle([answer, ...distractors])
  const display = complete
    .map((numeral, index) => (index === missingIndex ? '?' : numeral))
    .join('-')
  const description = CADENCE_DESCRIPTIONS[params.type]
  const exercise = {
    id: params.id,
    skillId: params.skillId,
    type: 'progression-completion' as const,
    promptEs: `En ${keyLabelEs(params.tonic, mode)}, ¿qué grado completa la cadencia ${cadenceName(params.type, 'es')} (${display})?`,
    promptEn: `In ${keyLabelEn(params.tonic, mode)}, which degree completes the ${cadenceName(params.type, 'en')} cadence (${display})?`,
    explanationEs: `La cadencia ${cadenceName(params.type, 'es')} ${description.es}: ${complete.join('-')}. En ${keyLabelEs(params.tonic, mode)} suena ${cadenceChordText(params.tonic, mode, degrees, 'es')}. El grado que falta es ${answer}.`,
    explanationEn: `The ${cadenceName(params.type, 'en')} ${description.en}: ${complete.join('-')}. In ${keyLabelEn(params.tonic, mode)} it sounds ${cadenceChordText(params.tonic, mode, degrees, 'en')}. The missing degree is ${answer}.`,
    difficulty,
    key: params.tonic,
    mode,
    degrees: complete,
    missingIndex,
    choices,
    choicesEn: [...choices],
  }
  return parseExercise(exercise)
}

export interface CadenceExerciseParams {
  id: string
  skillId: string
  tonic: Key
  mode?: 'major' | 'minor'
  type: CadenceType
  direction: CadenceDirection
  difficulty?: CadenceDifficulty
}

/**
 * Genera un ejercicio de cadencia en la dirección pedida. La respuesta se
 * deriva de los grados y del motor de teoría, y el esquema valida el resultado
 * antes de devolverlo.
 */
export function generateCadenceExercise(
  params: CadenceExerciseParams,
): Exercise {
  assertKnownTonic(params.tonic)
  const degrees = cadenceDegrees(params.type, params.mode ?? 'major')
  const difficulty = params.difficulty ?? 2
  return params.direction === 'identify'
    ? identifyExercise(params, degrees, difficulty)
    : completeExercise(params, degrees, difficulty)
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

export interface CadenceExerciseBatch {
  idPrefix: string
  skillId: string
  tonics?: readonly Key[]
  modes?: readonly ('major' | 'minor')[]
  types?: readonly CadenceType[]
  directions?: readonly CadenceDirection[]
  difficulty?: CadenceDifficulty
  /** Si se omite, genera todas las combinaciones. */
  count?: number
}

/**
 * Genera la matriz de ejercicios. Por defecto recorre las doce tonalidades
 * mayores, los cuatro tipos de cadencia y las dos direcciones.
 */
export function generateCadenceExercises(
  batch: CadenceExerciseBatch,
): Exercise[] {
  const tonics = batch.tonics ?? CADENCE_TONICS
  const modes = batch.modes ?? (['major'] as const)
  const types = batch.types ?? CADENCE_TYPES
  const directions = batch.directions ?? CADENCE_DIRECTIONS
  const combinations: Array<{
    tonic: Key
    mode: 'major' | 'minor'
    type: CadenceType
    direction: CadenceDirection
  }> = []

  for (const tonic of tonics) {
    for (const mode of modes) {
      for (const type of types) {
        for (const direction of directions) {
          combinations.push({ tonic, mode, type, direction })
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
      generateCadenceExercise({
        id: `${batch.idPrefix}-${String(index + 1).padStart(3, '0')}`,
        skillId: batch.skillId,
        tonic: combination.tonic,
        mode: combination.mode,
        type: combination.type,
        direction: combination.direction,
        difficulty: batch.difficulty,
      }),
    )
  }
  return exercises
}
