import type { Key, Score, TimeSignature } from '../schemas'
import {
  LETTERS,
  formatPitch,
  formatPitchEs,
  fromSpelledPitch,
  intervalBetween,
  intervalFromSemitones,
  letterIndex,
  midiOf,
  scalePitches,
  toSpelledPitch,
  type Interval,
  type Pitch,
} from '../theory'

/**
 * Lectura a primera vista.
 *
 * El método que se enseña en M7-09 no consiste en nombrar cada nota desde
 * cero, sino en reconocer una nota ancla y leer las demás por la distancia que
 * las separa. Un fragmento corto se genera moviendo grados de la escala de la
 * tonalidad; cada movimiento produce un intervalo diatónico (segunda, tercera,
 * cuarta…) que el alumno puede contar en el pentagrama.
 */
export const SIGHT_READING_ASKS = ['interval', 'note', 'motion'] as const
export type SightReadingAsk = (typeof SIGHT_READING_ASKS)[number]

export const SIGHT_READING_DIFFICULTIES = [1, 2, 3, 4] as const
export type SightReadingDifficulty =
  (typeof SIGHT_READING_DIFFICULTIES)[number]

export const SIGHT_READING_CLEFS = ['treble', 'bass'] as const
export type SightReadingClef = (typeof SIGHT_READING_CLEFS)[number]

/**
 * Salto máximo, en grados de la escala, que admite cada nivel. El nivel 1 se
 * queda en segundos y unísonos; el 4 llega a la octava.
 */
export const SIGHT_READING_MAX_STEP: Record<SightReadingDifficulty, number> = {
  1: 1,
  2: 2,
  3: 4,
  4: 7,
}

export type SightReadingMotion =
  | 'step-up'
  | 'step-down'
  | 'leap-up'
  | 'leap-down'
  | 'repeat'

export const SIGHT_READING_MOTION_LABELS: Record<
  SightReadingMotion,
  { es: string; en: string; ruleEs: string; ruleEn: string }
> = {
  'step-up': {
    es: 'Sube por grado conjunto',
    en: 'Moves up by step',
    ruleEs: 'sube por grado conjunto',
    ruleEn: 'moves up by step',
  },
  'step-down': {
    es: 'Baja por grado conjunto',
    en: 'Moves down by step',
    ruleEs: 'baja por grado conjunto',
    ruleEn: 'moves down by step',
  },
  'leap-up': {
    es: 'Sube por salto',
    en: 'Moves up by leap',
    ruleEs: 'sube por salto',
    ruleEn: 'moves up by leap',
  },
  'leap-down': {
    es: 'Baja por salto',
    en: 'Moves down by leap',
    ruleEs: 'baja por salto',
    ruleEn: 'moves down by leap',
  },
  repeat: {
    es: 'Repite la nota',
    en: 'Repeats the note',
    ruleEs: 'repite la misma nota',
    ruleEn: 'repeats the same note',
  },
}

export interface SightReadingFragmentParams {
  key: Key
  clef: SightReadingClef
  /** Primera nota del fragmento; debe pertenecer a la escala de la tonalidad. */
  start: Pitch
  /** Movimientos en grados de la escala entre notas consecutivas. */
  steps: readonly number[]
  /** Dificultad que acota el salto máximo permitido. */
  difficulty: SightReadingDifficulty
  idPrefix: string
  timeSignature?: TimeSignature
  tempoBpm?: number
}

/** Escala mayor de la tonalidad en la octava de la tónica y la siguiente. */
function majorScale(key: Key): Pitch[] {
  return scalePitches(key, 'major')
}

/**
 * Altura que ocupa un índice de grado de la escala. Los índices negativos y
 * los que pasan de la octava se resuelven desplazando la octava, de modo que
 * +7 siempre es la tónica una octava arriba y -1 el grado anterior.
 */
function pitchAtScaleIndex(key: Key, index: number): Pitch {
  const scale = majorScale(key)
  const octaveShift = Math.floor(index / 7)
  const degree = ((index % 7) + 7) % 7
  const base = scale[degree]
  if (base === undefined) {
    throw new Error(`Grado ${index} fuera de la escala de ${key} mayor`)
  }
  const pitch: Pitch = { ...base, octave: base.octave + octaveShift }
  if (pitch.octave < 0 || pitch.octave > 9) {
    throw new Error(`El fragmento se sale del rango de octavas en ${key} mayor`)
  }
  return pitch
}

/** Índice de grado de una nota escrita dentro de la escala de la tonalidad. */
export function sightReadingScaleIndex(key: Key, pitch: Pitch): number {
  const tonic = majorScale(key)[0]
  if (tonic === undefined) {
    throw new Error(`No se pudo construir la escala de ${key} mayor`)
  }
  const raw =
    pitch.octave * LETTERS.length +
    letterIndex(pitch.step) -
    (tonic.octave * LETTERS.length + letterIndex(tonic.step))
  const candidate = pitchAtScaleIndex(key, raw)
  if (
    candidate.step !== pitch.step ||
    candidate.accidental !== pitch.accidental ||
    candidate.octave !== pitch.octave
  ) {
    throw new Error(
      `La nota ${formatPitch(pitch)} no pertenece a ${key} mayor`,
    )
  }
  return raw
}

/**
 * Construye un fragmento monódico de negras. Cada paso se mide en grados de la
 * escala mayor, así que +1 es una segunda, +2 una tercera y +7 una octava.
 */
export function buildSightReadingFragment(
  params: SightReadingFragmentParams,
): Score {
  const timeSignature = params.timeSignature ?? {
    numerator: 4,
    denominator: 4,
  }
  const beatsPerMeasure =
    timeSignature.numerator * (4 / timeSignature.denominator)
  if (!Number.isInteger(beatsPerMeasure) || beatsPerMeasure < 1) {
    throw new Error('El compás del fragmento debe tener pulsos enteros')
  }

  const maxStep = SIGHT_READING_MAX_STEP[params.difficulty]
  if (maxStep === undefined) {
    throw new Error(`Dificultad de lectura inválida: ${params.difficulty}`)
  }
  let scaleIndex = sightReadingScaleIndex(params.key, params.start)
  const pitches: Pitch[] = [params.start]
  for (const step of params.steps) {
    if (!Number.isInteger(step)) {
      throw new Error(`Paso de lectura inválido: ${step}`)
    }
    if (Math.abs(step) > maxStep) {
      throw new Error(
        `El paso ${step} supera el salto máximo (${maxStep} grados) del nivel ${params.difficulty}`,
      )
    }
    scaleIndex += step
    pitches.push(pitchAtScaleIndex(params.key, scaleIndex))
  }

  return {
    clef: params.clef,
    key: params.key,
    mode: 'major',
    timeSignature,
    tempoBpm: params.tempoBpm ?? 60,
    events: pitches.map((pitch, index) => ({
      id: `${params.idPrefix}.${index + 1}`,
      measure: Math.floor(index / beatsPerMeasure) + 1,
      beat: index % beatsPerMeasure,
      value: { duration: 'quarter', dots: 0, tuplet: 'none' },
      pitches: [toSpelledPitch(pitch)],
      hand: params.clef === 'bass' ? 'left' : 'right',
      voice: 1,
      velocity: 72,
      tieToNext: false,
    })),
    pedals: [],
  }
}

/** Notas del fragmento en orden de lectura (compás y pulso). */
export function sightReadingNotes(score: Score): Pitch[] {
  return [...score.events]
    .filter((event) => event.pitches.length === 1)
    .sort(
      (a, b) =>
        a.measure - b.measure ||
        a.beat - b.beat ||
        a.id.localeCompare(b.id),
    )
    .map((event) => fromSpelledPitch(event.pitches[0]))
}

/** Intervalo entre dos notas del fragmento, o `null` si falta alguna. */
export function sightReadingInterval(
  score: Score,
  from: number,
  to: number,
): Interval | null {
  const notes = sightReadingNotes(score)
  const lower = notes[from]
  const upper = notes[to]
  if (lower === undefined || upper === undefined) return null
  return intervalBetween(lower, upper)
}

/** Movimiento general entre dos notas del fragmento. */
export function sightReadingMotion(
  score: Score,
  from: number,
  to: number,
): SightReadingMotion | null {
  const notes = sightReadingNotes(score)
  const start = notes[from]
  const end = notes[to]
  if (start === undefined || end === undefined) return null
  const distance =
    end.octave * LETTERS.length +
    letterIndex(end.step) -
    (start.octave * LETTERS.length + letterIndex(start.step))
  if (distance === 0) return 'repeat'
  if (Math.abs(distance) === 1) return distance > 0 ? 'step-up' : 'step-down'
  return distance > 0 ? 'leap-up' : 'leap-down'
}

/** Nombre de una nota del fragmento, con octava y en el idioma pedido. */
export function sightReadingNoteName(
  score: Score,
  index: number,
  language: 'es' | 'en',
): string | null {
  const pitch = sightReadingNotes(score)[index]
  if (pitch === undefined) return null
  return language === 'es'
    ? `${formatPitchEs(pitch)}${pitch.octave}`
    : formatPitch(pitch)
}

/** Nombre del intervalo entre dos notas del fragmento. */
export function sightReadingIntervalName(
  score: Score,
  from: number,
  to: number,
  language: 'es' | 'en',
): string | null {
  const interval = sightReadingInterval(score, from, to)
  if (interval === null) return null
  return language === 'es' ? interval.nameEs : interval.nameEn
}

/** Etiqueta del movimiento entre dos notas del fragmento. */
export function sightReadingMotionLabel(
  score: Score,
  from: number,
  to: number,
  language: 'es' | 'en',
): string | null {
  const motion = sightReadingMotion(score, from, to)
  if (motion === null) return null
  return SIGHT_READING_MOTION_LABELS[motion][language]
}

/**
 * Opciones de intervalo: la respuesta y los nombres más cercanos en semitonos.
 * El mismo orden se usa para español e inglés, así que los índices quedan
 * paralelos.
 */
export function sightReadingIntervalChoices(
  interval: Interval,
  language: 'es' | 'en',
  count = 4,
): string[] {
  const names = new Map<string, number>()
  for (let semitones = 0; semitones <= 12; semitones += 1) {
    const candidate = intervalFromSemitones(semitones)
    const name = language === 'es' ? candidate.nameEs : candidate.nameEn
    names.set(name, Math.abs(semitones - interval.semitones))
  }
  const target = language === 'es' ? interval.nameEs : interval.nameEn
  const ordered = [...names.entries()]
    .filter(([name]) => name !== target)
    .sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]))
    .map(([name]) => name)

  const choices = [target]
  for (const name of ordered) {
    if (choices.length >= count) break
    choices.push(name)
  }
  return choices
}

/**
 * Opciones de nota: la respuesta y las notas del fragmento más cercanas. Si el
 * fragmento es muy corto se completan con la misma nota en octavas vecinas.
 */
export function sightReadingNoteChoices(
  score: Score,
  target: number,
  language: 'es' | 'en',
  count = 4,
): string[] {
  const notes = sightReadingNotes(score)
  const pitch = notes[target]
  if (pitch === undefined) return []
  const nameOf = (value: Pitch) =>
    language === 'es'
      ? `${formatPitchEs(value)}${value.octave}`
      : formatPitch(value)

  const targetMidi = midiOf(pitch)
  const nearby = notes
    .map((note, index) => ({ note, index, midi: midiOf(note) }))
    .filter((entry) => entry.index !== target)
    .sort(
      (a, b) =>
        Math.abs(a.midi - targetMidi) - Math.abs(b.midi - targetMidi) ||
        a.midi - b.midi,
    )

  const choices = [nameOf(pitch)]
  const push = (note: Pitch) => {
    if (choices.length >= count) return
    const name = nameOf(note)
    if (!choices.includes(name)) choices.push(name)
  }
  for (const entry of nearby) push(entry.note)
  push({ ...pitch, octave: pitch.octave + 1 })
  push({ ...pitch, octave: pitch.octave - 1 })
  return choices
}

/** Opciones de movimiento: las cinco etiquetas canónicas. */
export function sightReadingMotionChoices(
  language: 'es' | 'en',
): string[] {
  return (Object.keys(SIGHT_READING_MOTION_LABELS) as SightReadingMotion[]).map(
    (motion) => SIGHT_READING_MOTION_LABELS[motion][language],
  )
}
