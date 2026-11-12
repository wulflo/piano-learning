import { ExerciseSchema, type Exercise } from '../../schemas/content'
import type { Key } from '../../schemas/notation'
import {
  chordSymbol,
  circleNeighbors,
  diatonicChord,
  diatonicChords,
  type DiatonicChord,
} from '../../theory'
import { formatPitchEs, midiOf, mod12, parsePitch } from '../../theory/pitch'

/**
 * Generador de ejercicios de modulación con acorde pivote.
 *
 * Recorre las doce tonalidades mayores y modula a las dos vecinas del círculo
 * de quintas: la dominante (un quinto arriba) y la subdominante (un quinto
 * abajo). El acorde pivote es un acorde diatónico común a las dos tonalidades
 * y el ejercicio pide su número romano en la tonalidad de origen o en la de
 * destino, siguiendo el estilo de la lección M5-09.
 *
 * Las dos tonalidades son siempre mayores porque el motor de respuestas del
 * tipo `pivot-chord` deriva el numeral con las cualidades de la mayor; el
 * modo menor queda para los ejercicios de números romanos de F4-017.
 */

export const MODULATION_RELATIONS = ['dominant', 'subdominant'] as const
export type ModulationRelation = (typeof MODULATION_RELATIONS)[number]

export const PIVOT_ASKS = ['source', 'target'] as const
export type PivotAsk = (typeof PIVOT_ASKS)[number]

export const MODULATION_DIFFICULTIES = [1, 2, 3] as const
export type ModulationDifficulty = (typeof MODULATION_DIFFICULTIES)[number]

/** Las doce tonalidades que usa el resto de los generadores armónicos. */
export const MODULATION_TONICS = [
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

const CHOICE_COUNTS: Record<ModulationDifficulty, number> = {
  1: 3,
  2: 4,
  3: 5,
}

/** Tonalidad vecina según la relación: la dominante o la subdominante. */
export function modulationDestinationFor(
  tonic: Key,
  relation: ModulationRelation,
): Key {
  const neighbors = circleNeighbors(tonic)
  return relation === 'dominant' ? neighbors.next : neighbors.previous
}

function shuffle<T>(items: T[]): T[] {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1))
    ;[items[index], items[swap]] = [items[swap], items[index]]
  }
  return items
}

function assertKnownTonic(tonic: Key): void {
  if (!(MODULATION_TONICS as readonly Key[]).includes(tonic)) {
    throw new Error(
      `La tonalidad "${tonic}" no pertenece a las 12 tonalidades del generador`,
    )
  }
}

function assertRelation(fromKey: Key, toKey: Key): void {
  if (fromKey === toKey) {
    throw new Error('Las tonalidades de origen y destino no pueden ser iguales')
  }
  const dominant = modulationDestinationFor(fromKey, 'dominant')
  const subdominant = modulationDestinationFor(fromKey, 'subdominant')
  if (toKey !== dominant && toKey !== subdominant) {
    throw new Error(
      `La tonalidad "${toKey}" no es vecina de "${fromKey}" por dominante ni por subdominante`,
    )
  }
}

export interface PivotChord {
  degreeFrom: number
  degreeTo: number
  chordFrom: DiatonicChord
  chordTo: DiatonicChord
}

/** Acordes diatónicos comunes a las dos tonalidades, con su grado en cada una. */
export function pivotChordsBetween(fromKey: Key, toKey: Key): PivotChord[] {
  assertKnownTonic(fromKey)
  assertKnownTonic(toKey)
  const toChords = diatonicChords(toKey, 'major')
  const pivots: PivotChord[] = []
  for (const from of diatonicChords(fromKey, 'major')) {
    const fromPcs = new Set(from.pitches.map((pitch) => mod12(midiOf(pitch))))
    for (const to of toChords) {
      const toPcs = new Set(to.pitches.map((pitch) => mod12(midiOf(pitch))))
      const same =
        fromPcs.size === toPcs.size &&
        [...fromPcs].every((pitchClass) => toPcs.has(pitchClass))
      if (same) {
        pivots.push({
          degreeFrom: from.degree,
          degreeTo: to.degree,
          chordFrom: from,
          chordTo: to,
        })
      }
    }
  }
  return pivots
}

function keyLabelEs(tonic: Key): string {
  return `${formatPitchEs(parsePitch(`${tonic}4`))} mayor`
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

/** Los numerales diatónicos de la tonalidad preguntada, con el gemelo primero. */
function numeralDistractors(
  askedKey: Key,
  answer: string,
  otherRoman: string,
  wanted: number,
): string[] {
  const unique = [
    ...new Set(
      [1, 2, 3, 4, 5, 6, 7].map(
        (degree) => diatonicChord(askedKey, 'major', degree).roman,
      ),
    ),
  ].filter((numeral) => numeral !== answer)
  if (unique.length < wanted) {
    throw new Error('No hay suficientes numerales para distraer')
  }
  // El numeral del mismo acorde en la otra tonalidad es la primera trampa.
  if (wanted >= 2 && otherRoman !== answer && unique.includes(otherRoman)) {
    return [
      otherRoman,
      ...shuffle(unique.filter((numeral) => numeral !== otherRoman)).slice(
        0,
        wanted - 1,
      ),
    ]
  }
  return shuffle(unique).slice(0, wanted)
}

export interface ModulationExerciseParams {
  id: string
  skillId: string
  fromKey: Key
  toKey: Key
  /** Dirección del ejercicio: el numeral en el origen o en el destino. */
  ask?: PivotAsk
  difficulty?: ModulationDifficulty
  /** Grado del pivote en la tonalidad de origen; si se omite, se elige al azar. */
  pivotDegree?: number
}

/**
 * Genera un ejercicio de modulación con acorde pivote. La respuesta se deduce
 * de los grados con el motor de teoría y el esquema valida el resultado antes
 * de devolverlo.
 */
export function generateModulationExercise(
  params: ModulationExerciseParams,
): Exercise {
  assertKnownTonic(params.fromKey)
  assertKnownTonic(params.toKey)
  assertRelation(params.fromKey, params.toKey)

  const ask = params.ask ?? 'source'
  const difficulty = params.difficulty ?? 2
  const wanted = CHOICE_COUNTS[difficulty] - 1

  const pivots = pivotChordsBetween(params.fromKey, params.toKey)
  if (pivots.length === 0) {
    throw new Error(
      `No hay acordes pivote entre ${params.fromKey} y ${params.toKey}`,
    )
  }
  const pivot =
    params.pivotDegree === undefined
      ? shuffle(pivots)[0]
      : pivots.find((item) => item.degreeFrom === params.pivotDegree)
  if (!pivot) {
    throw new Error(
      `El grado ${params.pivotDegree} no es un pivote entre ${params.fromKey} y ${params.toKey}`,
    )
  }

  const fromRoman = pivot.chordFrom.roman
  const toRoman = pivot.chordTo.roman
  const answer = ask === 'source' ? fromRoman : toRoman
  const otherRoman = ask === 'source' ? toRoman : fromRoman
  const askedKey = ask === 'source' ? params.fromKey : params.toKey
  const askedLabelEs = keyLabelEs(askedKey)

  const chord = pivot.chordFrom
  const nameEs = chordSymbol(chord.root, chord.quality, { notation: 'do' })
  const nameEn = chordSymbol(chord.root, chord.quality)
  const notesEs = chord.pitches.map((pitch) => formatPitchEs(pitch)).join(', ')
  const notesEn = chord.pitches.map(pitchNameEn).join(', ')
  const dominantOfTarget = diatonicChord(params.toKey, 'major', 5)
  const dominantSymbolEs = chordSymbol(dominantOfTarget.root, 'dominant7', {
    notation: 'do',
  })
  const dominantSymbolEn = chordSymbol(dominantOfTarget.root, 'dominant7')

  const choices = shuffle([
    answer,
    ...numeralDistractors(askedKey, answer, otherRoman, wanted),
  ])
  const exercise = {
    id: params.id,
    skillId: params.skillId,
    type: 'pivot-chord' as const,
    promptEs: `En una modulación de ${keyLabelEs(params.fromKey)} a ${keyLabelEs(params.toKey)}, ${nameEs} (${notesEs}) es el acorde pivote. ¿Qué número romano tiene en ${askedLabelEs}?`,
    promptEn: `In a modulation from ${params.fromKey} to ${params.toKey}, ${nameEn} (${notesEn}) is the pivot chord. Which Roman numeral does it have in ${askedKey}?`,
    explanationEs: `${nameEs} conserva las mismas notas en las dos tonalidades: es ${fromRoman} en ${keyLabelEs(params.fromKey)} y ${toRoman} en ${keyLabelEs(params.toKey)}. Por eso sirve de puente; después, un acorde que ya solo pertenece a ${keyLabelEs(params.toKey)} (como su V7: ${dominantSymbolEs}) confirma la modulación.`,
    explanationEn: `${nameEn} keeps the same notes in both keys: it is ${fromRoman} in ${params.fromKey} and ${toRoman} in ${params.toKey}. That is why it works as a bridge; afterwards, a chord that belongs only to ${params.toKey} (such as its V7: ${dominantSymbolEn}) confirms the modulation.`,
    difficulty,
    fromKey: params.fromKey,
    toKey: params.toKey,
    degreeFrom: pivot.degreeFrom,
    degreeTo: pivot.degreeTo,
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

export interface ModulationExerciseBatch {
  idPrefix: string
  skillId: string
  fromTonics?: readonly Key[]
  relations?: readonly ModulationRelation[]
  asks?: readonly PivotAsk[]
  difficulty?: ModulationDifficulty
  /** Si se omite, genera todas las combinaciones. */
  count?: number
}

/**
 * Genera la matriz de ejercicios. Por defecto recorre las doce tonalidades
 * mayores, las dos relaciones del círculo de quintas y las dos direcciones;
 * se descartan los destinos fuera de las doce tonalidades (Fa♯→Do♯ y
 * Re♭→Sol♭).
 */
export function generateModulationExercises(
  batch: ModulationExerciseBatch,
): Exercise[] {
  const fromTonics = batch.fromTonics ?? MODULATION_TONICS
  const relations = batch.relations ?? MODULATION_RELATIONS
  const asks = batch.asks ?? PIVOT_ASKS
  const combinations: Array<{
    fromKey: Key
    toKey: Key
    ask: PivotAsk
  }> = []

  for (const fromKey of fromTonics) {
    for (const relation of relations) {
      const toKey = modulationDestinationFor(fromKey, relation)
      if (!(MODULATION_TONICS as readonly Key[]).includes(toKey)) continue
      for (const ask of asks) {
        combinations.push({ fromKey, toKey, ask })
      }
    }
  }
  if (combinations.length === 0) return []

  const count = batch.count ?? combinations.length
  const exercises: Exercise[] = []
  for (let index = 0; index < count; index += 1) {
    const combination = combinations[index % combinations.length]
    exercises.push(
      generateModulationExercise({
        id: `${batch.idPrefix}-${String(index + 1).padStart(3, '0')}`,
        skillId: batch.skillId,
        fromKey: combination.fromKey,
        toKey: combination.toKey,
        ask: combination.ask,
        difficulty: batch.difficulty,
      }),
    )
  }
  return exercises
}
