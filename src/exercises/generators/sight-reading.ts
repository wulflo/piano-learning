import { ExerciseSchema } from '../../schemas/content'
import type { Key, TimeSignature } from '../../schemas/notation'
import { scalePitches, type Pitch } from '../../theory'
import {
  SIGHT_READING_MAX_STEP,
  SIGHT_READING_MOTION_LABELS,
  buildSightReadingFragment,
  sightReadingInterval,
  sightReadingIntervalChoices,
  sightReadingIntervalName,
  sightReadingMotion,
  sightReadingMotionChoices,
  sightReadingMotionLabel,
  sightReadingNoteChoices,
  sightReadingNoteName,
  sightReadingNotes,
  type SightReadingAsk,
  type SightReadingClef,
  type SightReadingDifficulty,
} from '../sight-reading'

export const SIGHT_READING_STEP_PATTERNS: Record<
  SightReadingDifficulty,
  readonly (readonly number[])[]
> = {
  1: [
    [1, 1, -1],
    [1, -1, 1],
    [-1, -1, 1],
    [1, 0, 1],
  ],
  2: [
    [2, -1, 1],
    [-2, 1, 2],
    [1, 2, -1],
    [2, -2, 1],
  ],
  3: [
    [1, 2, 1, -1, -2, 1, 2],
    [2, 1, 2, -1, -2, 1, 3],
    [1, 3, -1, 2, -2, 1, 2],
    [-1, -2, 1, 2, -1, 1, 2],
  ],
  4: [
    [1, 3, -2, 5, -1, 7, -3],
    [2, 5, -2, 1, -7, 3, -1],
    [-1, 3, -5, 2, 7, -3, 1],
  ],
}

const CHOICE_COUNTS: Record<SightReadingDifficulty, number> = {
  1: 3,
  2: 4,
  3: 4,
  4: 5,
}

const ORDINALS_ES = [
  'primera',
  'segunda',
  'tercera',
  'cuarta',
  'quinta',
  'sexta',
  'séptima',
  'octava',
  'novena',
  'décima',
] as const

const ORDINALS_EN = [
  'first',
  'second',
  'third',
  'fourth',
  'fifth',
  'sixth',
  'seventh',
  'eighth',
  'ninth',
  'tenth',
] as const

function ordinalEs(index: number): string {
  return ORDINALS_ES[index - 1] ?? `${index}.ª`
}

function ordinalEn(index: number): string {
  return ORDINALS_EN[index - 1] ?? `${index}th`
}

export interface SightReadingExerciseParams {
  id: string
  skillId: string
  ask: SightReadingAsk
  difficulty: SightReadingDifficulty
  key: Key
  clef: SightReadingClef
  start: Pitch
  steps: readonly number[]
  /**
   * Índice de la nota de partida. Para `interval` se compara con `to`; para
   * `note` es la nota ancla que se nombra en el enunciado.
   */
  from: number
  /** Índice de la nota de llegada. Por defecto, la siguiente a `from`. */
  to?: number
  timeSignature?: TimeSignature
  tempoBpm?: number
}

export interface SightReadingExercise {
  id: string
  skillId: string
  type: 'sight-reading'
  promptEs: string
  promptEn: string
  explanationEs: string
  explanationEn: string
  difficulty: number
  score: ReturnType<typeof buildSightReadingFragment>
  ask: SightReadingAsk
  from: number
  to: number
  choices: string[]
  choicesEn: string[]
}

function assertIndices(
  total: number,
  from: number,
  to: number,
): void {
  if (!Number.isInteger(from) || from < 0 || from >= total) {
    throw new Error(`Índice de nota inicial inválido: ${from}`)
  }
  if (!Number.isInteger(to) || to < 0 || to >= total || to === from) {
    throw new Error(`Índice de nota final inválido: ${to}`)
  }
}

/**
 * Genera un ejercicio de lectura a primera vista a partir de un fragmento
 * construido por intervalos. Las opciones se adaptan al nivel y quedan
 * paralelas en español e inglés.
 */
export function generateSightReadingExercise(
  params: SightReadingExerciseParams,
): SightReadingExercise {
  if ((SIGHT_READING_MAX_STEP[params.difficulty] ?? 0) === 0) {
    throw new Error(`Dificultad de lectura inválida: ${params.difficulty}`)
  }
  const score = buildSightReadingFragment({
    key: params.key,
    clef: params.clef,
    start: params.start,
    steps: params.steps,
    difficulty: params.difficulty,
    idPrefix: params.id,
    timeSignature: params.timeSignature,
    tempoBpm: params.tempoBpm,
  })
  const total = sightReadingNotes(score).length
  const to = params.to ?? params.from + 1
  assertIndices(total, params.from, to)
  const count = CHOICE_COUNTS[params.difficulty]

  const firstEs = sightReadingNoteName(score, params.from, 'es')
  const firstEn = sightReadingNoteName(score, params.from, 'en')
  const secondEs = sightReadingNoteName(score, to, 'es')
  const secondEn = sightReadingNoteName(score, to, 'en')
  if (
    firstEs === null ||
    firstEn === null ||
    secondEs === null ||
    secondEn === null
  ) {
    throw new Error('El fragmento no tiene las notas necesarias')
  }

  if (params.ask === 'interval') {
    const interval = sightReadingInterval(score, params.from, to)
    if (interval === null) {
      throw new Error('No se pudo calcular el intervalo del fragmento')
    }
    const nameEs = sightReadingIntervalName(score, params.from, to, 'es')
    const nameEn = sightReadingIntervalName(score, params.from, to, 'en')
    if (nameEs === null || nameEn === null) {
      throw new Error('No se pudo nombrar el intervalo del fragmento')
    }
    const exercise: SightReadingExercise = {
      id: params.id,
      skillId: params.skillId,
      type: 'sight-reading',
      promptEs: `¿Qué intervalo hay entre la ${ordinalEs(params.from + 1)} y la ${ordinalEs(to + 1)} nota del fragmento?`,
      promptEn: `What interval is between the ${ordinalEn(params.from + 1)} and ${ordinalEn(to + 1)} note of the fragment?`,
      explanationEs: `La ${ordinalEs(params.from + 1)} nota es ${firstEs} y la ${ordinalEs(to + 1)} es ${secondEs}. El intervalo es ${nameEs} (${interval.semitones} semitono${interval.semitones === 1 ? '' : 's'}): contá las líneas y los espacios que separan las dos notas y después ajustá la distancia real.`,
      explanationEn: `The ${ordinalEn(params.from + 1)} note is ${firstEn} and the ${ordinalEn(to + 1)} is ${secondEn}. The interval is ${nameEn} (${interval.semitones} semitone${interval.semitones === 1 ? '' : 's'}): count the lines and spaces between the two notes and then check the actual distance.`,
      difficulty: params.difficulty,
      score,
      ask: params.ask,
      from: params.from,
      to,
      choices: sightReadingIntervalChoices(interval, 'es', count),
      choicesEn: sightReadingIntervalChoices(interval, 'en', count),
    }
    const result = ExerciseSchema.safeParse(exercise)
    if (!result.success) {
      throw new Error(
        `El ejercicio de lectura generado no es válido: ${result.error.message}`,
      )
    }
    return exercise
  }

  if (params.ask === 'note') {
    const interval = sightReadingInterval(score, params.from, to)
    if (interval === null) {
      throw new Error('No se pudo calcular el intervalo del fragmento')
    }
    const nameEs = sightReadingIntervalName(score, params.from, to, 'es')
    const nameEn = sightReadingIntervalName(score, params.from, to, 'en')
    if (nameEs === null || nameEn === null) {
      throw new Error('No se pudo nombrar el intervalo del fragmento')
    }
    const exercise: SightReadingExercise = {
      id: params.id,
      skillId: params.skillId,
      type: 'sight-reading',
      promptEs: `La ${ordinalEs(params.from + 1)} nota del fragmento es ${firstEs}. ¿Qué nota es la ${ordinalEs(to + 1)}?`,
      promptEn: `The ${ordinalEn(params.from + 1)} note of the fragment is ${firstEn}. What note is the ${ordinalEn(to + 1)}?`,
      explanationEs: `Partí de ${firstEs} y leí por intervalos: ${secondEs} queda a un intervalo de ${nameEs}. En el pentagrama podés contar los grados desde la nota ancla sin volver a nombrar cada línea.`,
      explanationEn: `Start from ${firstEn} and read by intervals: ${secondEn} is an interval of ${nameEn} away. On the staff you can count the steps from the anchor note without naming every line again.`,
      difficulty: params.difficulty,
      score,
      ask: params.ask,
      from: params.from,
      to,
      choices: sightReadingNoteChoices(score, to, 'es', count),
      choicesEn: sightReadingNoteChoices(score, to, 'en', count),
    }
    const result = ExerciseSchema.safeParse(exercise)
    if (!result.success) {
      throw new Error(
        `El ejercicio de lectura generado no es válido: ${result.error.message}`,
      )
    }
    return exercise
  }

  const motion = sightReadingMotion(score, params.from, to)
  const motionEs = sightReadingMotionLabel(score, params.from, to, 'es')
  const motionEn = sightReadingMotionLabel(score, params.from, to, 'en')
  if (motion === null || motionEs === null || motionEn === null) {
    throw new Error('No se pudo calcular el movimiento del fragmento')
  }
  const ruleEs = SIGHT_READING_MOTION_LABELS[motion].ruleEs
  const ruleEn = SIGHT_READING_MOTION_LABELS[motion].ruleEn
  const exercise: SightReadingExercise = {
    id: params.id,
    skillId: params.skillId,
    type: 'sight-reading',
    promptEs: `¿Cómo se mueve la melodía de la ${ordinalEs(params.from + 1)} a la ${ordinalEs(to + 1)} nota?`,
    promptEn: `How does the melody move from the ${ordinalEn(params.from + 1)} to the ${ordinalEn(to + 1)} note?`,
    explanationEs: `La ${ordinalEs(params.from + 1)} nota es ${firstEs} y la ${ordinalEs(to + 1)} es ${secondEs}: la melodía ${ruleEs}. Las notas que quedan en la misma línea o en el mismo espacio se leen como grados conjuntos; cuando se salta una línea o un espacio, hay un salto.`,
    explanationEn: `The ${ordinalEn(params.from + 1)} note is ${firstEn} and the ${ordinalEn(to + 1)} is ${secondEn}: the melody ${ruleEn}. Notes that stay on the next line or the next space are read as steps; when a line or space is skipped, there is a leap.`,
    difficulty: params.difficulty,
    score,
    ask: params.ask,
    from: params.from,
    to,
    choices: sightReadingMotionChoices('es'),
    choicesEn: sightReadingMotionChoices('en'),
  }
  const result = ExerciseSchema.safeParse(exercise)
  if (!result.success) {
    throw new Error(
      `El ejercicio de lectura generado no es válido: ${result.error.message}`,
    )
  }
  return exercise
}

export interface SightReadingExerciseBatch {
  skillId: string
  idPrefix: string
  difficulty: SightReadingDifficulty
  count: number
  /** Tonalidades a recorrer; por defecto, las doce mayores de M2. */
  keys?: readonly Key[]
  clefs?: readonly SightReadingClef[]
  asks?: readonly SightReadingAsk[]
}

const DEFAULT_KEYS: readonly Key[] = [
  'C',
  'G',
  'D',
  'A',
  'E',
  'B',
  'F',
  'Bb',
  'Eb',
  'Ab',
  'Db',
  'Gb',
]

function tonicAt(key: Key, clef: SightReadingClef): Pitch {
  const tonic = scalePitches(key, 'major')[0]
  if (tonic === undefined) {
    throw new Error(`No se pudo construir la tonalidad ${key}`)
  }
  return clef === 'bass' ? { ...tonic, octave: tonic.octave - 2 } : tonic
}

/**
 * Genera una tanda de fragmentos graduados alternando tonalidades, claves y
 * tipos de pregunta. Es la pieza que permite crear sesiones de lectura sin
 * escribir cada compás a mano.
 */
export function generateSightReadingExercises(
  batch: SightReadingExerciseBatch,
): SightReadingExercise[] {
  const keys = batch.keys ?? DEFAULT_KEYS
  const clefs = batch.clefs ?? ['treble', 'bass']
  const asks = batch.asks ?? ['interval', 'note', 'motion']
  const patterns = SIGHT_READING_STEP_PATTERNS[batch.difficulty]
  if (patterns === undefined) {
    throw new Error(`Dificultad de lectura inválida: ${batch.difficulty}`)
  }
  if (keys.length === 0 || clefs.length === 0 || asks.length === 0) {
    throw new Error('La tanda de lectura necesita tonalidades, claves y preguntas')
  }
  if (!Number.isInteger(batch.count) || batch.count < 0) {
    throw new Error(`Cantidad inválida: ${batch.count}`)
  }

  const exercises: SightReadingExercise[] = []
  for (let index = 0; index < batch.count; index += 1) {
    const key = keys[index % keys.length]
    const clef = clefs[index % clefs.length]
    const ask = asks[index % asks.length]
    const steps = patterns[index % patterns.length]
    if (key === undefined || steps === undefined) continue
    const last = steps.length
    const from = 0
    const to = ask === 'interval' ? 1 : last
    exercises.push(
      generateSightReadingExercise({
        id: `${batch.idPrefix}-${String(index + 1).padStart(3, '0')}`,
        skillId: batch.skillId,
        ask,
        difficulty: batch.difficulty,
        key,
        clef,
        start: tonicAt(key, clef),
        steps,
        from,
        to,
      }),
    )
  }
  return exercises
}
