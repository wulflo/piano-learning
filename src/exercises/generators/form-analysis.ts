import { ExerciseSchema, type Exercise } from '../../schemas/content'
import type {
  Key,
  NoteEvent,
  Score,
  SpelledPitch,
} from '../../schemas/notation'
import { formatPitchEs, parsePitch, toSpelledPitch } from '../../theory/pitch'
import { scalePitches } from '../../theory/scales'

/**
 * Generador de ejercicios de análisis formal con fragmentos originales.
 *
 * Cada ejercicio arma una melodía propia de 2 a 15 compases con secciones
 * contrastantes y pregunta la forma global (binaria, ternaria, período, rondó
 * o sonata) o, en un período, la función de una de sus dos frases. Las
 * melodías se escriben con grados de la escala mayor de la tonalidad elegida,
 * de modo que la armadura y la ortografía salen del motor de teoría.
 *
 * El pentagrama del reproductor ya ofrece la alternativa textual de las notas
 * (nombre y octava) para lectores de pantalla, así que el generador no
 * duplica esa información en el enunciado.
 *
 * Es puro y determinista: no usa azar ni depende de React, audio o contenido.
 */

export const FORM_ANALYSIS_FORMS = [
  'binary',
  'ternary',
  'period',
  'rondo',
  'sonata',
] as const
export type FormAnalysisForm = (typeof FORM_ANALYSIS_FORMS)[number]

export const FORM_ANALYSIS_ASKS = ['form', 'part'] as const
export type FormAnalysisAsk = (typeof FORM_ANALYSIS_ASKS)[number]

export const FORM_ANALYSIS_DIFFICULTIES = [1, 2, 3] as const
export type FormAnalysisDifficulty = (typeof FORM_ANALYSIS_DIFFICULTIES)[number]

/** Las doce tonalidades mayores que usan los generadores armónicos. */
export const FORM_ANALYSIS_TONICS = [
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

/** Etiqueta canónica de cada forma, alineada con el motor de respuestas. */
export const FORM_LABELS: Record<FormAnalysisForm, { es: string; en: string }> = {
  binary: { es: 'Forma binaria (AB)', en: 'Binary form (AB)' },
  ternary: { es: 'Forma ternaria (ABA)', en: 'Ternary form (ABA)' },
  period: {
    es: 'Período (antecedente y consecuente)',
    en: 'Period (antecedent and consequent)',
  },
  rondo: { es: 'Rondó (ABACA)', en: 'Rondo (ABACA)' },
  sonata: {
    es: 'Forma sonata (exposición-desarrollo-recapitulación)',
    en: 'Sonata form (exposition-development-recapitulation)',
  },
}

const CHOICE_COUNTS: Record<FormAnalysisDifficulty, number> = {
  1: 3,
  2: 4,
  3: 5,
}

/**
 * Plan de secciones de cada forma. `phrase` indica el material melódico que
 * ocupa la sección; las secciones con el mismo material repiten sus notas.
 */
type PhraseKind =
  | 'antecedent'
  | 'consequent'
  | 'recapitulation'
  | 'closed'
  | 'contrast'
  | 'episode'

interface SectionPlan {
  label: string
  phrase: PhraseKind
  measures: number
}

const FORM_PLANS: Record<FormAnalysisForm, SectionPlan[]> = {
  binary: [
    { label: 'A', phrase: 'antecedent', measures: 4 },
    { label: 'B', phrase: 'contrast', measures: 4 },
  ],
  ternary: [
    { label: 'A', phrase: 'antecedent', measures: 4 },
    { label: 'B', phrase: 'contrast', measures: 4 },
    { label: 'A', phrase: 'antecedent', measures: 4 },
  ],
  period: [
    { label: 'A', phrase: 'antecedent', measures: 4 },
    { label: 'B', phrase: 'consequent', measures: 4 },
  ],
  rondo: [
    { label: 'A', phrase: 'closed', measures: 2 },
    { label: 'B', phrase: 'episode', measures: 2 },
    { label: 'A', phrase: 'closed', measures: 2 },
    { label: 'C', phrase: 'contrast', measures: 2 },
    { label: 'A', phrase: 'closed', measures: 2 },
  ],
  sonata: [
    { label: 'A', phrase: 'antecedent', measures: 4 },
    { label: 'B', phrase: 'contrast', measures: 4 },
    { label: 'A', phrase: 'recapitulation', measures: 4 },
  ],
}

/**
 * Motivos originales, escritos como grados de la escala. Los de cuatro
 * compases usan tres compases de negras y un compás final de redonda; los de
 * dos compases usan un compás de negras y una redonda final.
 */
const PHRASES: Record<
  PhraseKind,
  { quarters: number[]; final: number }
> = {
  antecedent: {
    quarters: [1, 3, 5, 3, 2, 4, 6, 4, 3, 5, 8, 5],
    final: 2,
  },
  consequent: {
    quarters: [5, 4, 3, 2, 1, 3, 5, 3, 4, 6, 5, 3],
    final: 1,
  },
  recapitulation: {
    quarters: [1, 3, 5, 3, 2, 4, 6, 4, 3, 5, 8, 5],
    final: 1,
  },
  closed: { quarters: [1, 3, 5, 3], final: 1 },
  contrast: { quarters: [8, 6, 5, 3, 4, 2, 1, 2, 3, 5, 7, 5], final: 5 },
  episode: { quarters: [3, 2, 1, 2], final: 5 },
}

function assertKnownTonic(tonic: Key): void {
  if (!(FORM_ANALYSIS_TONICS as readonly Key[]).includes(tonic)) {
    throw new Error(
      `La tonalidad "${tonic}" no pertenece a las 12 tonalidades del generador`,
    )
  }
}

function assertForm(form: string): asserts form is FormAnalysisForm {
  if (!(FORM_ANALYSIS_FORMS as readonly string[]).includes(form)) {
    throw new Error(`Forma desconocida: ${form}`)
  }
}

function assertPart(form: FormAnalysisForm, part: number): void {
  if (form !== 'period') {
    throw new Error('Solo el período tiene antecedente y consecuente')
  }
  if (!Number.isInteger(part) || part < 1 || part > 2) {
    throw new Error(`Frase inválida: ${part}`)
  }
}

function keyLabelEs(tonic: Key): string {
  return `${formatPitchEs(parsePitch(`${tonic}4`))} mayor`
}

/** Altura escrita de un grado 1-8 en la escala mayor de la tonalidad. */
function pitchForDegree(tonic: Key, degree: number): SpelledPitch {
  const scale = scalePitches(tonic, 'major')
  const base = scale[(degree - 1) % scale.length]
  const octave = base.octave + Math.floor((degree - 1) / scale.length)
  return toSpelledPitch({ ...base, octave })
}

function measureCount(plan: readonly SectionPlan[]): number {
  return plan.reduce((total, section) => total + section.measures, 0)
}

interface ScoreBuild {
  score: Score
  sections: Array<{ id: string; label: string; start: number; end: number }>
}

/**
 * Arma la partitura. Las secciones se escriben una tras otra; las que comparten
 * motivo repiten las mismas alturas y ritmos.
 */
function buildScore(
  idPrefix: string,
  tonic: Key,
  plan: readonly SectionPlan[],
): ScoreBuild {
  const events: NoteEvent[] = []
  const sections: ScoreBuild['sections'] = []
  let measure = 1
  let eventIndex = 0

  const push = (
    currentMeasure: number,
    beat: number,
    duration: 'quarter' | 'whole',
    degree: number,
  ): void => {
    eventIndex += 1
    events.push({
      id: `${idPrefix}.${eventIndex}`,
      measure: currentMeasure,
      beat,
      value: {
        duration,
        dots: 0,
        tuplet: 'none',
      },
      pitches: [pitchForDegree(tonic, degree)],
      hand: 'right',
      voice: 1,
      velocity: 78,
      tieToNext: false,
    })
  }

  for (const [index, section] of plan.entries()) {
    const start = measure
    const phrase = PHRASES[section.phrase]
    const quarterMeasures = section.measures - 1
    const expected = quarterMeasures * 4
    const quarters =
      phrase.quarters.length === expected
        ? phrase.quarters
        : phrase.quarters.slice(0, expected)
    if (quarters.length !== expected) {
      throw new Error(
        `El motivo ${section.phrase} no cubre ${section.measures} compases`,
      )
    }

    for (let offset = 0; offset < quarters.length; offset += 1) {
      push(
        measure + Math.floor(offset / 4),
        offset % 4,
        'quarter',
        quarters[offset],
      )
    }
    measure += quarterMeasures
    push(measure, 0, 'whole', phrase.final)
    measure += 1

    sections.push({
      id: `section-${index + 1}`,
      label: section.label,
      start,
      end: measure - 1,
    })
  }

  const score: Score = {
    clef: 'treble',
    key: tonic,
    mode: 'major',
    timeSignature: { numerator: 4, denominator: 4 },
    tempoBpm: 88,
    events,
    pedals: [],
  }

  return { score, sections }
}

function sectionsTextEs(
  sections: readonly ScoreBuild['sections'][number][],
): string {
  return sections
    .map((section) => `${section.label} (compases ${section.start} a ${section.end})`)
    .join(', ')
}

function sectionsTextEn(
  sections: readonly ScoreBuild['sections'][number][],
): string {
  return sections
    .map(
      (section) =>
        `${section.label} (bars ${section.start} to ${section.end})`,
    )
    .join(', ')
}

const FORM_REASON_ES: Record<FormAnalysisForm, string> = {
  binary:
    'La segunda sección contrasta y el material inicial no vuelve al final, así que la forma es binaria (AB).',
  ternary:
    'El material A vuelve después de B, así que la forma es ternaria (ABA).',
  period:
    'La primera frase queda abierta (antecedente) y la segunda retoma la idea y cierra en la tónica (consecuente).',
  rondo:
    'El estribillo A regresa entre los episodios B y C, de modo que el esquema es ABACA.',
  sonata:
    'La exposición presenta el tema A, el desarrollo B lo contrasta y la recapitulación vuelve a A para cerrar.',
}

const FORM_REASON_EN: Record<FormAnalysisForm, string> = {
  binary:
    'The second section contrasts and the opening material does not return at the end, so the form is binary (AB).',
  ternary:
    'The A material returns after B, so the form is ternary (ABA).',
  period:
    'The first phrase stays open (antecedent) and the second brings the idea back and closes on the tonic (consequent).',
  rondo:
    'The refrain A returns between episodes B and C, giving the ABACA scheme.',
  sonata:
    'The exposition presents theme A, the development B contrasts it and the recapitulation returns to A to close.',
}

/** Hash FNV-1a para sembrar la mezcla de opciones sin perder determinismo. */
function seedFrom(text: string): number {
  let hash = 2166136261
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

/** PRNG determinista (mulberry32) para variar la posición de la respuesta. */
function seededRandom(seed: number): () => number {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let value = Math.imul(state ^ (state >>> 15), 1 | state)
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

function seededShuffle<T>(items: T[], seed: string): T[] {
  const random = seededRandom(seedFrom(seed))
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1))
    ;[copy[index], copy[swap]] = [copy[swap], copy[index]]
  }
  return copy
}

function formChoices(
  form: FormAnalysisForm,
  difficulty: FormAnalysisDifficulty,
  seed: string,
): { choices: string[]; choicesEn: string[] } {
  const count = CHOICE_COUNTS[difficulty]
  const distractors = seededShuffle(
    FORM_ANALYSIS_FORMS.filter((option) => option !== form),
    `${seed}-distractors`,
  ).slice(0, count - 1)
  const order = seededShuffle([form, ...distractors], `${seed}-order`)
  return {
    choices: order.map((option) => FORM_LABELS[option].es),
    choicesEn: order.map((option) => FORM_LABELS[option].en),
  }
}

export interface FormAnalysisExerciseParams {
  id: string
  skillId: string
  form: FormAnalysisForm
  key: Key
  ask?: FormAnalysisAsk
  /** Frase del período cuya función se pregunta (1 o 2). */
  part?: number
  difficulty?: FormAnalysisDifficulty
}

/**
 * Genera un ejercicio de análisis formal. La melodía es original y se deriva
 * de los motivos del plan, transpuestos a la tonalidad pedida.
 */
export function generateFormAnalysisExercise(
  params: FormAnalysisExerciseParams,
): Exercise {
  assertKnownTonic(params.key)
  assertForm(params.form)

  const ask = params.ask ?? 'form'
  const part = params.part ?? 1
  if (ask === 'part') assertPart(params.form, part)

  const plan = FORM_PLANS[params.form]
  const { score, sections } = buildScore(params.id, params.key, plan)
  const difficulty = params.difficulty ?? 2
  const keyEs = keyLabelEs(params.key)
  const totalMeasures = measureCount(plan)
  const partsTextEs = sectionsTextEs(sections)
  const partsTextEn = sectionsTextEn(sections)

  const common = {
    id: params.id,
    skillId: params.skillId,
    type: 'form-analysis' as const,
    difficulty,
    score,
    sections: sections.map((section) => ({
      id: section.id,
      label: section.label,
      startMeasure: section.start,
      endMeasure: section.end,
    })),
    form: params.form,
    ask,
  }

  if (ask === 'part') {
    const explanationEs =
      part === 1
        ? 'La primera frase es el antecedente: presenta la idea y queda abierta, con una semicadencia sobre el segundo grado. El consecuente es la segunda frase, que retoma el material y cierra en la tónica.'
        : 'La segunda frase es el consecuente: retoma la idea del antecedente y la completa cerrando en la tónica. El antecedente, en cambio, queda abierto con una semicadencia.'
    const explanationEn =
      part === 1
        ? 'The first phrase is the antecedent: it presents the idea and stays open with a half cadence on the second degree. The consequent is the second phrase, which brings the material back and closes on the tonic.'
        : 'The second phrase is the consequent: it brings back the antecedent idea and completes it by closing on the tonic. The antecedent, by contrast, stays open with a half cadence.'
    return parseExercise({
      ...common,
      promptEs: `¿Qué función cumple la frase ${part} del período en ${keyEs}?`,
      promptEn: `What role does phrase ${part} of the period in ${params.key} play?`,
      explanationEs,
      explanationEn,
      part,
      choices: ['Antecedente', 'Consecuente'],
      choicesEn: ['Antecedent', 'Consequent'],
    })
  }

  const { choices, choicesEn } = formChoices(
    params.form,
    difficulty,
    `${params.id}-${params.key}-${difficulty}`,
  )
  return parseExercise({
    ...common,
    promptEs: `¿Qué forma tiene esta melodía en ${keyEs}?`,
    promptEn: `What form does this melody in ${params.key} have?`,
    explanationEs: `La melodía tiene ${plan.length} secciones: ${partsTextEs}. ${FORM_REASON_ES[params.form]} En total ocupa ${totalMeasures} compases.`,
    explanationEn: `The melody has ${plan.length} sections: ${partsTextEn}. ${FORM_REASON_EN[params.form]} It spans ${totalMeasures} bars in all.`,
    choices,
    choicesEn,
  })
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

export interface FormAnalysisBatch {
  idPrefix: string
  skillId: string
  tonics?: readonly Key[]
  forms?: readonly FormAnalysisForm[]
  /** Si es true (por defecto), añade las preguntas de frase del período. */
  includeParts?: boolean
  difficulty?: FormAnalysisDifficulty
  /** Si se omite, genera todas las combinaciones. */
  count?: number
}

interface Combination {
  form: FormAnalysisForm
  key: Key
  ask: FormAnalysisAsk
  part?: number
}

/**
 * Genera la matriz de ejercicios: por defecto las doce tonalidades × las cinco
 * formas (60) más las dos frases del período en cada tonalidad (24).
 */
export function generateFormAnalysisExercises(
  batch: FormAnalysisBatch,
): Exercise[] {
  const tonics = batch.tonics ?? FORM_ANALYSIS_TONICS
  const forms = batch.forms ?? FORM_ANALYSIS_FORMS
  const includeParts = batch.includeParts ?? true
  const combinations: Combination[] = []

  for (const key of tonics) {
    for (const form of forms) {
      combinations.push({ form, key, ask: 'form' })
    }
    if (includeParts && forms.includes('period')) {
      for (const part of [1, 2] as const) {
        combinations.push({ form: 'period', key, ask: 'part', part })
      }
    }
  }
  if (combinations.length === 0) return []

  const count = batch.count ?? combinations.length
  const exercises: Exercise[] = []
  for (let index = 0; index < count; index += 1) {
    const combination = combinations[index % combinations.length]
    exercises.push(
      generateFormAnalysisExercise({
        id: `${batch.idPrefix}-${String(index + 1).padStart(3, '0')}`,
        skillId: batch.skillId,
        form: combination.form,
        key: combination.key,
        ask: combination.ask,
        part: combination.part,
        difficulty: batch.difficulty,
      }),
    )
  }
  return exercises
}
