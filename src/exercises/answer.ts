import {
  cadenceName,
  cadenceTypeFor,
  CHORD_DEFINITIONS,
  CHORD_INVERSION_LABELS,
  chordSymbol,
  chordWithInversion,
  chordWithSlash,
  convertChordNotation,
  formatPitch,
  formatPitchEs,
  fromSpelledPitch,
  functionsForMode,
  harmonicFunctionName,
  intervalBetween,
  keyForSignature,
  keySignature,
  midiOf,
  qualitiesForMode,
  romanNumeralFor,
  scaleName,
  secondaryDominantNumeral,
  type KeyMode,
  type Pitch,
} from '../theory'
import type {
  Exercise,
  RhythmCell,
  ScaleMode,
  TimeSignature,
} from '../schemas'
import {
  canonicalScaleSpelling,
  normalizeScaleSpelling,
} from './generators/scale-spelling'
import { exerciseChoices, type Locale } from '../content/localize'
import { attackingHandAt } from '../content/score'
import { attackingHandCandidates } from './hand-coordination'
import {
  accompanimentPatternCandidates,
  accompanimentPatternInMeasure,
  chordSymbolCandidates,
  chordSymbolInMeasure,
  leadSheetMelodyNoteName,
  shellVoicingLabel,
} from './accompaniment'
import {
  stylePatternCandidates,
  stylePatternInMeasure,
  styleProgressionCandidates,
  styleProgressionDegrees,
  styleScaleCandidates,
  styleScaleName,
  styleVoicingCandidates,
} from './style-pattern'
import {
  arpeggiatedNoteNames,
  arpeggiatedPatternCandidates,
  arpeggiatedPatternInMeasure,
} from './arpeggiated'
import {
  albertiNoteNames,
  albertiPatternCandidates,
  albertiPatternInMeasure,
} from './alberti'
import {
  walkingNoteAt,
  walkingNoteCandidates,
  walkingRoleAt,
  walkingRoleCandidates,
} from './walking'
import {
  strideBassNoteAt,
  strideBassNoteCandidates,
  stridePatternCandidates,
  stridePatternInMeasure,
} from './stride'
import {
  sightReadingIntervalName,
  sightReadingMotionLabel,
  sightReadingNoteName,
} from './sight-reading'
import {
  pedalActionAt,
  pedalActionCandidates,
  pedalPatternCandidates,
  pedalPatternInMeasure,
} from './pedal'
import {
  arpeggioFingering,
  arpeggioFingeringLabel,
  arpeggioNoteNames,
} from './arpeggio'
import { ORNAMENT_LABELS } from './ornament-labels'
import {
  AUGMENTED_SIXTH_LABELS,
  AUGMENTED_SIXTH_RESOLUTION,
} from './augmented-sixth'

/**
 * Resolución de la respuesta correcta de un ejercicio.
 *
 * El contenido escrito a mano no siempre guarda un campo `answer`: en muchos
 * casos la respuesta se deduce de los campos estructurados (la nota objetivo,
 * la armadura, el patrón rítmico). Este módulo centraliza esa deducción para
 * que la UI no tenga una regla distinta por tipo y para que los tests puedan
 * comprobar que todas las opciones del contenido tienen una respuesta válida.
 */

export type ResolvedExerciseAnswer =
  | { mode: 'choice'; answer: string; accepted: string[] }
  | { mode: 'text'; answer: string; accepted: string[] }
  | { mode: 'practice' }

const DURATION_LABELS: Record<RhythmCell['duration'], string> = {
  whole: 'Redonda',
  half: 'Blanca',
  quarter: 'Negra',
  eighth: 'Corchea',
  sixteenth: 'Semicorchea',
  'thirty-second': 'Treintaidosavo (fusa)',
}

const DURATION_LABELS_EN: Record<RhythmCell['duration'], string> = {
  whole: 'Whole note',
  half: 'Half note',
  quarter: 'Quarter note',
  eighth: 'Eighth note',
  sixteenth: 'Sixteenth note',
  'thirty-second': 'Thirty-second note',
}

const SOUND_PARAMETER_LABELS: Record<
  Extract<Exercise, { type: 'sound-parameter' }>['parameter'],
  string
> = {
  pitch: 'Altura',
  duration: 'Duración',
  intensity: 'Intensidad',
  timbre: 'Timbre',
}

const SOUND_PARAMETER_LABELS_EN: Record<
  Extract<Exercise, { type: 'sound-parameter' }>['parameter'],
  string
> = {
  pitch: 'Pitch',
  duration: 'Duration',
  intensity: 'Intensity',
  timbre: 'Timbre',
}

const ARTICULATION_LABELS: Record<
  Extract<Exercise, { type: 'articulation' }>['articulation'],
  string
> = {
  legato: 'Legato',
  staccato: 'Staccato',
  accent: 'Acento',
}

const ARTICULATION_LABELS_EN: Record<
  Extract<Exercise, { type: 'articulation' }>['articulation'],
  string
> = {
  legato: 'Legato',
  staccato: 'Staccato',
  accent: 'Accent',
}

const SOLFEGE_TO_LETTER: Record<string, string> = {
  do: 'C',
  re: 'D',
  mi: 'E',
  fa: 'F',
  sol: 'G',
  la: 'A',
  si: 'B',
}

const MODE_LABELS_ES: Record<ScaleMode, string> = {
  major: 'Mayor',
  'natural-minor': 'Menor natural',
  'harmonic-minor': 'Menor armónica',
  'melodic-minor': 'Menor melódica',
  ionian: 'Jónico',
  dorian: 'Dórico',
  phrygian: 'Frigio',
  lydian: 'Lidio',
  mixolydian: 'Mixolidio',
  aeolian: 'Eólico',
  locrian: 'Locrio',
  'major-pentatonic': 'Pentatónica mayor',
  'minor-pentatonic': 'Pentatónica menor',
  blues: 'Blues',
  chromatic: 'Cromática',
  'whole-tone': 'Tonos enteros',
}

const MODE_LABELS_EN: Record<ScaleMode, string> = {
  major: 'Major',
  'natural-minor': 'Natural minor',
  'harmonic-minor': 'Harmonic minor',
  'melodic-minor': 'Melodic minor',
  ionian: 'Ionian',
  dorian: 'Dorian',
  phrygian: 'Phrygian',
  lydian: 'Lydian',
  mixolydian: 'Mixolydian',
  aeolian: 'Aeolian',
  locrian: 'Locrian',
  'major-pentatonic': 'Major pentatonic',
  'minor-pentatonic': 'Minor pentatonic',
  blues: 'Blues',
  chromatic: 'Chromatic',
  'whole-tone': 'Whole tone',
}

/** Normaliza texto para comparar respuestas sin castigar tildes ni símbolos. */
export function normalizeExerciseText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/♯/g, '#')
    .replace(/♭/g, 'b')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function capitalize(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`
}

function joinWithY(items: readonly string[]): string {
  if (items.length <= 1) return items[0] ?? ''
  return `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`
}

function findChoice(
  choices: readonly string[],
  candidates: readonly string[],
  caseSensitive = false,
): string | null {
  if (caseSensitive) {
    for (const candidate of candidates) {
      const trimmed = candidate.trim()
      const exact = choices.find((choice) => choice.trim() === trimmed)
      if (exact !== undefined) return exact
    }
    return null
  }

  const normalizedChoices = choices.map((choice) => ({
    choice,
    normalized: normalizeExerciseText(choice),
  }))

  for (const candidate of candidates) {
    const normalized = normalizeExerciseText(candidate)
    const exact = normalizedChoices.find((item) => item.normalized === normalized)
    if (exact !== undefined) return exact.choice
  }

  for (const candidate of candidates) {
    const normalized = normalizeExerciseText(candidate)
    if (normalized.length < 3) continue
    const prefixed = normalizedChoices.find((item) =>
      item.normalized.startsWith(normalized),
    )
    if (prefixed !== undefined) return prefixed.choice
  }

  return null
}

function choiceAnswer(
  choices: readonly string[],
  candidates: readonly string[],
  caseSensitive = false,
): ResolvedExerciseAnswer | null {
  const selected = findChoice(choices, candidates, caseSensitive)
  if (selected === null) return null
  return { mode: 'choice', answer: selected, accepted: [selected] }
}

function textAnswer(candidates: readonly string[]): ResolvedExerciseAnswer {
  const answer = candidates[0]
  if (answer === undefined) {
    throw new Error('El ejercicio no tiene una respuesta resoluble')
  }
  return { mode: 'text', answer, accepted: [...new Set(candidates)] }
}

function withChoicesOrText(
  choices: readonly string[] | undefined,
  candidates: readonly string[],
  caseSensitive = false,
): ResolvedExerciseAnswer {
  if (choices !== undefined) {
    const resolved = choiceAnswer(choices, candidates, caseSensitive)
    if (resolved !== null) return resolved
  }
  return textAnswer(candidates)
}

function rhythmCellLabel(cell: RhythmCell, language: Locale): string {
  const base =
    language === 'en' ? DURATION_LABELS_EN[cell.duration] : DURATION_LABELS[cell.duration]
  if (language === 'en') {
    const dotted =
      cell.dots === 1 ? 'Dotted ' : cell.dots === 2 ? 'Double-dotted ' : ''
    const tuplet = cell.tuplet === 'triplet' ? 'Triplet ' : ''
    const name = cell.rest ? base.replace(/ note$/, '') : base
    const label = `${dotted}${tuplet}${name}`
    return cell.rest ? `${label} rest` : label
  }
  const dotted =
    cell.dots === 1
      ? ' con puntillo'
      : cell.dots === 2
        ? ' con doble puntillo'
        : ''
  const tuplet = cell.tuplet === 'triplet' ? ' de tresillo' : ''
  if (cell.rest) {
    return `Silencio de ${base.toLowerCase()}${dotted}${tuplet}`
  }
  return `${base}${dotted}${tuplet}`
}

function rhythmPatternLabel(
  cells: readonly RhythmCell[],
  language: Locale,
): string {
  return cells.map((cell) => rhythmCellLabel(cell, language)).join(', ')
}

function scaleFromExplanation(text: string): string | null {
  const ascii = /se deletrea\s+([A-G](?:##|bb|#|b)?(?:\s+[A-G](?:##|bb|#|b)?)+)/.exec(
    text,
  )
  if (ascii?.[1] !== undefined) return ascii[1]

  const english =
    /is spelled\s+([A-G](?:##|bb|#|b)?(?:\s+[A-G](?:##|bb|#|b)?)+)/i.exec(text)
  if (english?.[1] !== undefined) return english[1]

  const solfege =
    /((?:Do|Re|Mi|Fa|Sol|La|Si)(?:\s+(?:sostenido|bemol))?(?:(?:\s*,\s*|\s+y\s+)(?:Do|Re|Mi|Fa|Sol|La|Si)(?:\s+(?:sostenido|bemol))?)+)/.exec(
      text,
    )
  if (solfege?.[1] === undefined) return null

  const tokens = solfege[1].split(/\s*,\s*|\s+y\s+/).filter(Boolean)
  const notes: string[] = []
  for (const token of tokens) {
    const match = /^(Do|Re|Mi|Fa|Sol|La|Si)(?:\s+(sostenido|bemol))?$/i.exec(
      token.trim(),
    )
    if (!match) return null
    const letter = SOLFEGE_TO_LETTER[match[1].toLowerCase()]
    const accidental =
      match[2] === 'sostenido' ? '#' : match[2] === 'bemol' ? 'b' : ''
    notes.push(`${letter}${accidental}`)
  }
  return notes.join(' ')
}

function scaleCandidates(exercise: Extract<Exercise, { type: 'scale-spelling' }>): string[] {
  const candidates: string[] = []
  if (exercise.answer !== undefined) candidates.push(exercise.answer)
  if (exercise.answerEn !== undefined) candidates.push(exercise.answerEn)

  try {
    candidates.push(canonicalScaleSpelling(exercise.tonic, exercise.mode))
  } catch {
    // El contenido escrito a mano puede usar una ortografía alternativa.
  }

  const fromExplanation = scaleFromExplanation(exercise.explanationEs)
  if (fromExplanation !== null) candidates.push(fromExplanation)
  if (exercise.explanationEn !== undefined) {
    const fromEnglish = scaleFromExplanation(exercise.explanationEn)
    if (fromEnglish !== null) candidates.push(fromEnglish)
  }

  return [...new Set(candidates)]
}

function soundParameterCandidates(
  parameter: Extract<Exercise, { type: 'sound-parameter' }>['parameter'],
): string[] {
  const label = SOUND_PARAMETER_LABELS[parameter]
  const lower = label.toLowerCase()
  const english = SOUND_PARAMETER_LABELS_EN[parameter]
  return [
    label,
    `La ${lower}`,
    `El ${lower}`,
    english,
    `The ${english.toLowerCase()}`,
    `The ${english.toLowerCase()} (${lower === 'altura' ? 'high/low' : lower === 'duración' ? 'short/long' : lower === 'intensidad' ? 'soft/loud' : 'tone color'})`,
  ]
}

function noteCandidates(
  target: Extract<Exercise, { type: 'note-keyboard' | 'note-staff' }>['target'],
): string[] {
  const pitch = fromSpelledPitch(target)
  const es = formatPitchEs(pitch)
  const scientific = formatPitch(pitch)
  return [
    `${es}${pitch.octave}`,
    es,
    scientific,
    `${scientific} (${es}${pitch.octave})`,
    scientific.replace(/\d+$/, ''),
  ]
}

function keyModeLabel(mode: KeyMode): string {
  return mode === 'major' ? 'Mayor' : 'Menor'
}

function keyModeLabelEn(mode: KeyMode): string {
  return mode === 'major' ? 'Major' : 'Minor'
}

function keyNameEs(tonic: string): string {
  const match = /^([A-G])(##|bb|#|b)?$/.exec(tonic)
  if (!match) throw new Error(`Tonalidad inválida: ${tonic}`)
  const names: Record<string, string> = {
    C: 'Do',
    D: 'Re',
    E: 'Mi',
    F: 'Fa',
    G: 'Sol',
    A: 'La',
    B: 'Si',
  }
  const accidentals: Record<string, string> = {
    '': '',
    '#': '♯',
    b: '♭',
    '##': '𝄪',
    bb: '𝄫',
  }
  return `${names[match[1]]}${accidentals[match[2] ?? ''] ?? ''}`
}

function keyLabel(tonic: string, mode: KeyMode): string {
  return `${keyNameEs(tonic)} ${mode === 'major' ? 'mayor' : 'menor'}`
}

function keyNameEn(tonic: string): string {
  const match = /^([A-G])(##|bb|#|b)?$/.exec(tonic)
  if (!match) throw new Error(`Invalid key: ${tonic}`)
  const accidentals: Record<string, string> = {
    '': '',
    '#': '♯',
    b: '♭',
    '##': '𝄪',
    bb: '𝄫',
  }
  return `${match[1]}${accidentals[match[2] ?? ''] ?? ''}`
}

function keyLabelEn(tonic: string, mode: KeyMode): string {
  return `${keyNameEn(tonic)} ${mode === 'major' ? 'major' : 'minor'}`
}

function signatureCandidates(count: number): string[] {
  if (count === 0) {
    return [
      'Sin alteraciones',
      'Sin sostenidos',
      'Sin bemoles',
      'No accidentals',
      'No sharps or flats',
      'No sharps',
      'No flats',
    ]
  }
  const total = Math.abs(count)
  const noun =
    count > 0
      ? total === 1
        ? 'sostenido'
        : 'sostenidos'
      : total === 1
        ? 'bemol'
        : 'bemoles'
  const englishNoun = count > 0
    ? total === 1
      ? 'sharp'
      : 'sharps'
    : total === 1
      ? 'flat'
      : 'flats'
  return [
    `${total} ${noun}`,
    `${total} ${total === 1 ? 'nota alterada' : 'notas alteradas'}`,
    `${total} ${englishNoun}`,
    `${total} altered ${total === 1 ? 'note' : 'notes'}`,
  ]
}

function resolveSignatureChoice(
  choices: readonly string[],
  count: number,
): string | null {
  const normalized = choices.map((choice) => ({
    choice,
    text: normalizeExerciseText(choice),
  }))

  if (count === 0) {
    return (
      normalized.find(
        (item) =>
          item.text.includes('sin alteraciones') ||
          item.text.includes('sin sostenidos') ||
          item.text.includes('sin bemoles') ||
          item.text.includes('no accidentals') ||
          item.text.includes('no sharps') ||
          item.text.includes('no flats'),
      )?.choice ?? null
    )
  }

  const total = Math.abs(count)
  const accidental = count > 0 ? 'sostenido' : 'bemol'
  const englishAccidental = count > 0 ? 'sharp' : 'flat'
  return (
    normalized.find(
      (item) =>
        new RegExp(`(^|\\s)${total}(\\s|$)`).test(item.text) &&
        (item.text.includes(accidental) ||
          item.text.includes(englishAccidental)) &&
        !item.text.includes(count > 0 ? 'bemol' : 'sostenido') &&
        !item.text.includes(count > 0 ? 'flat' : 'sharp'),
    )?.choice ?? null
  )
}

function resolveKeySignature(
  exercise: Extract<Exercise, { type: 'key-signature' }>,
  choices: readonly string[] | undefined,
): ResolvedExerciseAnswer {
  if (exercise.answer !== undefined) {
    const answers = [exercise.answer]
    if (exercise.answerEn !== undefined) answers.push(exercise.answerEn)
    return withChoicesOrText(choices, answers)
  }

  const prompt = normalizeExerciseText(
    `${exercise.promptEs} ${exercise.promptEn ?? ''}`,
  )
  if (prompt.includes('en que modo') || prompt.includes('what mode')) {
    const label = keyModeLabel(exercise.mode)
    return withChoicesOrText(choices, [label, keyModeLabelEn(exercise.mode)])
  }

  const signature = keySignature(exercise.key, exercise.mode)
  if (exercise.direction === 'fifth-up' || exercise.direction === 'fifth-down') {
    const offset = exercise.direction === 'fifth-up' ? 1 : -1
    const target = keyForSignature(signature.count + offset, exercise.mode)
    return withChoicesOrText(choices, [
      keyLabel(target, exercise.mode),
      keyLabelEn(target, exercise.mode),
    ])
  }

  if (prompt.includes('que tonalidad') || prompt.includes('what key')) {
    return withChoicesOrText(choices, [
      keyLabel(exercise.key, exercise.mode),
      keyLabelEn(exercise.key, exercise.mode),
    ])
  }

  if (exercise.direction === 'signature-to-key') {
    return withChoicesOrText(choices, [
      keyLabel(exercise.key, exercise.mode),
      keyLabelEn(exercise.key, exercise.mode),
    ])
  }

  if (choices !== undefined) {
    const selected = resolveSignatureChoice(choices, signature.count)
    if (selected !== null) {
      return { mode: 'choice', answer: selected, accepted: [selected] }
    }
  }

  return textAnswer(signatureCandidates(signature.count))
}

function semitoneLabel(semitones: number): string[] {
  switch (semitones) {
    case 1:
      return ['Semitono', 'Semitone']
    case 2:
      return ['Tono', 'Whole tone', 'Tone']
    case 3:
      return ['Tono y medio', 'Minor third', 'Three semitones', 'Tone and a half']
    case 4:
      return ['Dos tonos', 'Major third', 'Four semitones', 'Two tones']
    default:
      return [`${semitones} semitonos`, `${semitones} semitones`]
  }
}

function intervalCandidates(
  lower: Extract<Exercise, { type: 'interval' }>['lower'],
  upper: Extract<Exercise, { type: 'interval' }>['upper'],
): string[] {
  const low: Pitch = fromSpelledPitch(lower)
  const high: Pitch = fromSpelledPitch(upper)
  const semitones = Math.abs(midiOf(high) - midiOf(low))
  const short = semitoneLabel(semitones)
  const interval = intervalBetween(low, high)
  const name = interval.nameEs
  return [...short, name, capitalize(name), interval.nameEn, capitalize(interval.nameEn)]
}

function meterCandidates(
  timeSignature: TimeSignature,
  accentedBeats: readonly number[],
  language: Locale,
): string[] {
  const numerator = timeSignature.numerator
  const beats = accentedBeats.join(', ')
  const compound = numerator === 6 || numerator === 9 || numerator === 12
  const english = language === 'en'
  if (compound && timeSignature.denominator === 8) {
    return [
      english
        ? `${joinWithAnd(accentedBeats.map(String))}: start of each group of three eighth notes`
        : `${joinWithY(accentedBeats.map(String))}: inicio de cada grupo de tres corcheas`,
      joinWithAnd(accentedBeats.map(String)),
      joinWithY(accentedBeats.map(String)),
    ]
  }

  if (numerator === 2 && accentedBeats.length === 1 && accentedBeats[0] === 1) {
    return english ? ['1 strong; 2 weak', '1 fuerte; 2 débil'] : ['1 fuerte; 2 débil', '1 strong; 2 weak']
  }
  if (numerator === 3 && accentedBeats.length === 1 && accentedBeats[0] === 1) {
    return english
      ? ['1 strong; 2 and 3 weak', '1 fuerte; 2 y 3 débiles']
      : ['1 fuerte; 2 y 3 débiles', '1 strong; 2 and 3 weak']
  }
  if (
    numerator === 4 &&
    accentedBeats.length === 2 &&
    accentedBeats[0] === 1 &&
    accentedBeats[1] === 3
  ) {
    return [
      '1 fuerte; 2 débil; 3 semifuerte; 4 débil',
      '1 y 3',
      '1 strong; 2 weak; 3 medium-strong; 4 weak',
      '1 and 3',
    ]
  }
  return [
    `${joinWithY(accentedBeats.map(String))} (${beats})`,
    joinWithY(accentedBeats.map(String)),
    joinWithAnd(accentedBeats.map(String)),
  ]
}

function joinWithAnd(items: readonly string[]): string {
  if (items.length <= 1) return items[0] ?? ''
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}

function playbackOrderAnswer(
  exercise: Extract<Exercise, { type: 'playback-order' }>,
): string {
  const labels = new Map(
    exercise.sections.map((section) => [section.id, section.label] as const),
  )
  return exercise.answer
    .map((id) => labels.get(id) ?? id)
    .join(' ')
}

/**
 * Devuelve la respuesta canónica del ejercicio.
 *
 * Los ejercicios de práctica sin respuesta única (`tempo-stability`) se marcan
 * como `practice`: la UI muestra la explicación y no finge corregir algo que
 * depende de tocar con el metrónomo.
 */
export function resolveExerciseAnswer(
  exercise: Exercise,
  language: Locale = 'es',
): ResolvedExerciseAnswer {
  const choices = exerciseChoices(exercise, language)

  switch (exercise.type) {
    case 'note-keyboard':
    case 'note-staff':
      return withChoicesOrText(choices, noteCandidates(exercise.target))

    case 'scale-spelling':
      return withChoicesOrText(choices, scaleCandidates(exercise))

    case 'key-signature':
      return resolveKeySignature(exercise, choices)

    case 'roman-numeral':
      // La mayúscula y la minúscula cambian la cualidad (V mayor, v menor),
      // así que aquí no se puede normalizar el caso al buscar la opción.
      return withChoicesOrText(choices, [exercise.numeral], true)

    case 'harmonic-function': {
      const mode = exercise.mode === 'major' ? 'major' : 'natural-minor'
      const func = functionsForMode(mode)[exercise.degree - 1]
      return withChoicesOrText(choices, [
        harmonicFunctionName(func, 'es'),
        harmonicFunctionName(func, 'en'),
        func,
      ])
    }

    case 'pivot-chord': {
      const degree =
        exercise.ask === 'source' ? exercise.degreeFrom : exercise.degreeTo
      const quality = qualitiesForMode('major')[degree - 1]
      return withChoicesOrText(choices, [romanNumeralFor(degree, quality)], true)
    }

    case 'phrase-analysis': {
      const phrases = exercise.segments
        .filter((segment) => segment.kind === 'phrase')
        .sort((first, second) => first.startMeasure - second.startMeasure)

      if (exercise.ask === 'phrase-end') {
        const target = phrases[(exercise.phrase ?? 1) - 1]
        if (target === undefined) {
          throw new Error(
            `Falta la frase ${exercise.phrase ?? 1} del análisis melódico`,
          )
        }
        return withChoicesOrText(choices, [
          `Compás ${target.endMeasure}`,
          `El compás ${target.endMeasure}`,
          `Measure ${target.endMeasure}`,
          `The measure ${target.endMeasure}`,
          String(target.endMeasure),
        ])
      }

      const count =
        exercise.ask === 'motive-count'
          ? exercise.segments.filter((segment) => segment.kind === 'motive')
              .length
          : phrases.length
      const singular = count === 1
      const labelEs =
        exercise.ask === 'motive-count'
          ? `${count} ${singular ? 'motivo' : 'motivos'}`
          : `${count} ${singular ? 'frase' : 'frases'}`
      const labelEn =
        exercise.ask === 'motive-count'
          ? `${count} ${singular ? 'motive' : 'motives'}`
          : `${count} ${singular ? 'phrase' : 'phrases'}`
      return withChoicesOrText(choices, [labelEs, labelEn, String(count)])
    }

    case 'form-analysis': {
      if (exercise.ask === 'part') {
        const part = exercise.part ?? 1
        return withChoicesOrText(choices, [
          part === 1 ? 'Antecedente' : 'Consecuente',
          part === 1 ? 'Antecedent' : 'Consequent',
          String(part),
        ])
      }

      const labels: Record<typeof exercise.form, [string, string]> = {
        binary: ['Forma binaria (AB)', 'Binary form (AB)'],
        ternary: ['Forma ternaria (ABA)', 'Ternary form (ABA)'],
        period: [
          'Período (antecedente y consecuente)',
          'Period (antecedent and consequent)',
        ],
        rondo: ['Rondó (ABACA)', 'Rondo (ABACA)'],
        sonata: [
          'Forma sonata (exposición-desarrollo-recapitulación)',
          'Sonata form (exposition-development-recapitulation)',
        ],
      }
      const [labelEs, labelEn] = labels[exercise.form]
      return withChoicesOrText(choices, [labelEs, labelEn, exercise.form])
    }

    case 'texture-analysis': {
      const labels: Record<typeof exercise.texture, [string, string]> = {
        monophony: [
          'Monofonía (una sola línea melódica)',
          'Monophony (a single melodic line)',
        ],
        homophony: [
          'Homofonía (melodía con acordes)',
          'Homophony (melody with chords)',
        ],
        polyphony: [
          'Polifonía (dos o más líneas independientes)',
          'Polyphony (two or more independent lines)',
        ],
      }
      const [labelEs, labelEn] = labels[exercise.texture]
      return withChoicesOrText(choices, [labelEs, labelEn, exercise.texture])
    }

    case 'counterpoint-analysis': {
      if (exercise.ask === 'parallels') {
        const labels: Record<
          NonNullable<typeof exercise.parallels>,
          [string, string]
        > = {
          none: [
            'No hay quintas ni octavas paralelas',
            'No parallel fifths or octaves',
          ],
          fifths: ['Hay quintas paralelas', 'There are parallel fifths'],
          octaves: ['Hay octavas paralelas', 'There are parallel octaves'],
        }
        const result = exercise.parallels ?? 'none'
        const [labelEs, labelEn] = labels[result]
        return withChoicesOrText(choices, [labelEs, labelEn, result])
      }

      const labels: Record<typeof exercise.motion, [string, string]> = {
        parallel: ['Movimiento paralelo', 'Parallel motion'],
        similar: ['Movimiento similar', 'Similar motion'],
        contrary: ['Movimiento contrario', 'Contrary motion'],
        oblique: ['Movimiento oblicuo', 'Oblique motion'],
      }
      const [labelEs, labelEn] = labels[exercise.motion]
      return withChoicesOrText(choices, [labelEs, labelEn, exercise.motion])
    }

    case 'ornament-execution': {
      const [labelEs, labelEn] = ORNAMENT_LABELS[exercise.ornament]
      return withChoicesOrText(choices, [labelEs, labelEn, exercise.ornament])
    }

    case 'borrowed-chord':
      return withChoicesOrText(choices, [exercise.numeral], true)

    case 'augmented-sixth': {
      if (exercise.ask === 'resolve') {
        return withChoicesOrText(choices, [...AUGMENTED_SIXTH_RESOLUTION])
      }
      const [labelEs, labelEn] = AUGMENTED_SIXTH_LABELS[exercise.variant]
      return withChoicesOrText(choices, [
        labelEs,
        labelEn,
        exercise.variant,
      ])
    }

    case 'secondary-dominant': {
      const mode = exercise.mode === 'major' ? 'major' : 'natural-minor'
      const targetRoman = romanNumeralFor(
        exercise.target,
        qualitiesForMode(mode)[exercise.target - 1],
      )
      const answer =
        exercise.ask === 'numeral'
          ? secondaryDominantNumeral(exercise.target, mode)
          : targetRoman
      return withChoicesOrText(choices, [answer])
    }

    case 'cadence': {
      const type = cadenceTypeFor(exercise.fromDegree, exercise.toDegree)
      return withChoicesOrText(choices, [
        cadenceName(type, 'es'),
        cadenceName(type, 'en'),
        type,
      ])
    }

    case 'ear-scale':
      return withChoicesOrText(choices, [
        MODE_LABELS_ES[exercise.mode],
        MODE_LABELS_EN[exercise.mode],
        scaleName(exercise.mode, 'es'),
        scaleName(exercise.mode, 'en'),
      ])

    case 'sound-parameter':
      return withChoicesOrText(
        choices,
        soundParameterCandidates(exercise.parameter),
      )

    case 'interval':
      if (exercise.answer !== undefined) {
        const answers = [exercise.answer]
        if (exercise.answerEn !== undefined) answers.push(exercise.answerEn)
        return withChoicesOrText(choices, answers)
      }
      return withChoicesOrText(
        choices,
        intervalCandidates(exercise.lower, exercise.upper),
      )

    case 'rhythm-completion':
    case 'anacrusis-completion': {
      const cell = exercise.pattern[exercise.missingIndex]
      if (cell === undefined) {
        throw new Error(`Falta la celda ${exercise.missingIndex} del patrón`)
      }
      return withChoicesOrText(choices, [
        rhythmCellLabel(cell, 'es'),
        rhythmCellLabel(cell, 'en'),
      ])
    }

    case 'rhythm-dictation':
      return withChoicesOrText(choices, [
        rhythmPatternLabel(exercise.pattern, 'es'),
        rhythmPatternLabel(exercise.pattern, 'en'),
      ])

    case 'meter-accent':
      return withChoicesOrText(
        choices,
        meterCandidates(exercise.timeSignature, exercise.accentedBeats, language),
      )

    case 'tempo-term':
      return withChoicesOrText(choices, [capitalize(exercise.term)])

    case 'tempo-stability':
      return { mode: 'practice' }

    case 'dynamic-mark':
      return withChoicesOrText(choices, [exercise.marking])

    case 'articulation':
      return withChoicesOrText(choices, [
        ARTICULATION_LABELS[exercise.articulation],
        ARTICULATION_LABELS_EN[exercise.articulation],
      ])

    case 'playback-order':
      return withChoicesOrText(choices, [
        playbackOrderAnswer(exercise),
      ])

    case 'italian-term':
      return withChoicesOrText(choices, [
        exercise.meaningEs,
        exercise.meaningEn ?? exercise.meaningEs,
      ])

    case 'chord':
      if (exercise.ask === 'symbol') {
        const root = fromSpelledPitch(exercise.root)
        const slash = exercise.slash
          ? fromSpelledPitch(exercise.slash)
          : undefined
        const doSymbol = chordSymbol(root, exercise.quality, {
          notation: 'do',
          slash,
        })
        const cSymbol = chordSymbol(root, exercise.quality, {
          notation: 'c',
          slash,
        })
        return withChoicesOrText(
          choices,
          language === 'en' ? [cSymbol, doSymbol] : [doSymbol, cSymbol],
        )
      }
      if (exercise.ask === 'notes') {
        const pitches = exercise.slash
          ? chordWithSlash(
              fromSpelledPitch(exercise.root),
              exercise.quality,
              fromSpelledPitch(exercise.slash),
            )
          : chordWithInversion(
              fromSpelledPitch(exercise.root),
              exercise.quality,
              exercise.inversion,
            )
        return withChoicesOrText(choices, [
          pitches.map((pitch) => formatPitchEs(pitch)).join(' '),
          pitches
            .map((pitch) => formatPitch(pitch).replace(/\d+$/, ''))
            .join(' '),
        ])
      }
      if (exercise.ask === 'inversion') {
        return withChoicesOrText(choices, [
          CHORD_INVERSION_LABELS.es[exercise.inversion],
          CHORD_INVERSION_LABELS.en[exercise.inversion],
          String(exercise.inversion),
        ])
      }
      return withChoicesOrText(choices, [
        CHORD_DEFINITIONS[exercise.quality].nameEs,
        CHORD_DEFINITIONS[exercise.quality].nameEn,
        exercise.quality,
      ])

    case 'chord-notation':
      return withChoicesOrText(choices, [
        convertChordNotation(exercise.symbol, exercise.to),
      ])

    case 'transposition':
      if (exercise.answer !== undefined) {
        return withChoicesOrText(choices, [
          exercise.answer.map((pitch) => formatPitch(fromSpelledPitch(pitch))).join(' '),
        ])
      }
      return { mode: 'practice' }

    case 'progression-completion': {
      const degree = exercise.degrees[exercise.missingIndex]
      if (degree === undefined) {
        throw new Error(`Falta el grado ${exercise.missingIndex} de la progresión`)
      }
      return withChoicesOrText(choices, [degree])
    }

    case 'ear-interval':
      return withChoicesOrText(
        choices,
        intervalCandidates(exercise.lower, exercise.upper),
      )

    case 'ear-chord':
      return withChoicesOrText(choices, [
        CHORD_DEFINITIONS[exercise.quality].nameEs,
        CHORD_DEFINITIONS[exercise.quality].nameEn,
        exercise.quality,
      ])

    case 'ear-progression':
      return withChoicesOrText(choices, [
        exercise.degrees.join(' '),
        exercise.degrees.join(' - '),
      ])

    case 'hand-coordination': {
      const hand = attackingHandAt(
        exercise.score,
        exercise.measure,
        exercise.beat,
      )
      if (hand === null) {
        throw new Error(
          `No hay ataque en el compás ${exercise.measure}, pulso ${exercise.beat}`,
        )
      }
      return withChoicesOrText(choices, attackingHandCandidates(hand))
    }

    case 'walking-bass': {
      if (exercise.ask === 'role') {
        const role = walkingRoleAt(
          exercise.score,
          exercise.measure,
          exercise.beat,
        )
        if (role === null) {
          throw new Error(
            `No se puede clasificar la nota del compás ${exercise.measure}, pulso ${exercise.beat + 1}`,
          )
        }
        return withChoicesOrText(
          choices,
          walkingRoleCandidates(role, language),
        )
      }
      const note = walkingNoteAt(
        exercise.score,
        exercise.measure,
        exercise.beat,
        language,
      )
      if (note === null) {
        throw new Error(
          `No hay una nota en el compás ${exercise.measure}, pulso ${exercise.beat + 1}`,
        )
      }
      return withChoicesOrText(choices, walkingNoteCandidates(note))
    }

    case 'stride': {
      if (exercise.ask === 'bass') {
        const note = strideBassNoteAt(
          exercise.score,
          exercise.measure,
          exercise.beat,
          language,
        )
        if (note === null) {
          throw new Error(
            `No hay una nota de bajo en el compás ${exercise.measure}, pulso ${exercise.beat + 1}`,
          )
        }
        return withChoicesOrText(choices, strideBassNoteCandidates(note))
      }
      if (!stridePatternInMeasure(exercise.score, exercise.measure)) {
        throw new Error(
          `No se reconoce un patrón de stride en el compás ${exercise.measure}`,
        )
      }
      return withChoicesOrText(
        choices,
        stridePatternCandidates(language),
      )
    }

    case 'sight-reading': {
      const to = exercise.to ?? exercise.from + 1
      if (exercise.ask === 'interval') {
        const name = sightReadingIntervalName(
          exercise.score,
          exercise.from,
          to,
          language,
        )
        if (name === null) {
          throw new Error(
            `No se pudo leer el intervalo entre las notas ${exercise.from + 1} y ${to + 1}`,
          )
        }
        return withChoicesOrText(choices, [name])
      }
      if (exercise.ask === 'note') {
        const name = sightReadingNoteName(exercise.score, to, language)
        if (name === null) {
          throw new Error(`No hay una nota en la posición ${to + 1} del fragmento`)
        }
        return withChoicesOrText(choices, [name])
      }
      const label = sightReadingMotionLabel(
        exercise.score,
        exercise.from,
        to,
        language,
      )
      if (label === null) {
        throw new Error(
          `No se pudo leer el movimiento entre las notas ${exercise.from + 1} y ${to + 1}`,
        )
      }
      return withChoicesOrText(choices, [label])
    }

    case 'ear-melody': {
      const to = exercise.to ?? exercise.from + 1
      if (exercise.ask === 'interval') {
        const name = sightReadingIntervalName(
          exercise.score,
          exercise.from,
          to,
          language,
        )
        if (name === null) {
          throw new Error(
            `No se pudo escuchar el intervalo entre las notas ${exercise.from + 1} y ${to + 1}`,
          )
        }
        return withChoicesOrText(choices, [name])
      }
      if (exercise.ask === 'note') {
        const name = sightReadingNoteName(exercise.score, to, language)
        if (name === null) {
          throw new Error(`No hay una nota en la posición ${to + 1} de la melodía`)
        }
        return withChoicesOrText(choices, [name])
      }
      const label = sightReadingMotionLabel(
        exercise.score,
        exercise.from,
        to,
        language,
      )
      if (label === null) {
        throw new Error(
          `No se pudo escuchar el movimiento entre las notas ${exercise.from + 1} y ${to + 1}`,
        )
      }
      return withChoicesOrText(choices, [label])
    }

    case 'alberti': {
      if (exercise.ask === 'notes') {
        return withChoicesOrText(choices, [
          albertiNoteNames(exercise.score, exercise.measure, 'es'),
          albertiNoteNames(exercise.score, exercise.measure, 'en'),
        ])
      }
      if (!albertiPatternInMeasure(exercise.score, exercise.measure)) {
        throw new Error(
          `No se reconoce un bajo de Alberti en el compás ${exercise.measure}`,
        )
      }
      return withChoicesOrText(
        choices,
        albertiPatternCandidates(language),
      )
    }

    case 'arpeggiated': {
      if (exercise.ask === 'notes') {
        return withChoicesOrText(choices, [
          arpeggiatedNoteNames(exercise.score, exercise.measure, 'es'),
          arpeggiatedNoteNames(exercise.score, exercise.measure, 'en'),
        ])
      }
      const pattern = arpeggiatedPatternInMeasure(
        exercise.score,
        exercise.measure,
      )
      if (pattern === null) {
        throw new Error(
          `No se reconoce un patrón arpegiado en el compás ${exercise.measure}`,
        )
      }
      return withChoicesOrText(
        choices,
        arpeggiatedPatternCandidates(pattern, language),
      )
    }

    case 'accompaniment': {
      if (exercise.ask === 'melody') {
        const name = leadSheetMelodyNoteName(
          exercise.score,
          exercise.measure,
          exercise.beat,
          language,
        )
        if (name === null) {
          throw new Error(
            `No hay una nota de melodía en el compás ${exercise.measure}, pulso ${exercise.beat + 1}`,
          )
        }
        return withChoicesOrText(choices, [name])
      }
      if (exercise.ask === 'voicing') {
        const symbol = chordSymbolInMeasure(exercise.score, exercise.measure)
        if (symbol === null) {
          throw new Error(
            `No hay un cifrado único en el compás ${exercise.measure}`,
          )
        }
        let label: string
        try {
          label = shellVoicingLabel(symbol, language)
        } catch {
          throw new Error(
            `No se pudo construir el shell voicing de ${symbol}`,
          )
        }
        return withChoicesOrText(choices, [label])
      }
      if (exercise.ask === 'symbol') {
        const symbol = chordSymbolInMeasure(exercise.score, exercise.measure)
        if (symbol === null) {
          throw new Error(
            `No hay un cifrado único en el compás ${exercise.measure}`,
          )
        }
        return withChoicesOrText(choices, chordSymbolCandidates(symbol))
      }
      const pattern = accompanimentPatternInMeasure(
        exercise.score,
        exercise.measure,
      )
      if (pattern === null) {
        throw new Error(
          `No se reconoce un patrón de acompañamiento en el compás ${exercise.measure}`,
        )
      }
      return withChoicesOrText(
        choices,
        accompanimentPatternCandidates(pattern, language),
      )
    }

    case 'style-pattern': {
      if (exercise.ask === 'chord') {
        const symbol = chordSymbolInMeasure(exercise.score, exercise.measure)
        if (symbol === null) {
          throw new Error(
            `No hay un cifrado único en el compás ${exercise.measure}`,
          )
        }
        return withChoicesOrText(choices, chordSymbolCandidates(symbol))
      }
      if (exercise.ask === 'scale') {
        const scale = styleScaleName(exercise.score)
        if (scale === null) {
          throw new Error('No se reconoce la escala del fragmento')
        }
        return withChoicesOrText(choices, styleScaleCandidates(scale, language))
      }
      if (exercise.ask === 'progression') {
        const degrees = styleProgressionDegrees(exercise.score)
        if (degrees === null) {
          throw new Error('No se pueden leer los grados de la progresión')
        }
        return withChoicesOrText(
          choices,
          styleProgressionCandidates(degrees),
        )
      }
      if (exercise.ask === 'voicing') {
        const candidates = styleVoicingCandidates(
          exercise.score,
          exercise.measure,
          language,
        )
        if (candidates === null) {
          throw new Error(
            `No hay un voicing reconocible en el compás ${exercise.measure}`,
          )
        }
        return withChoicesOrText(choices, candidates)
      }
      const pattern = stylePatternInMeasure(exercise.score, exercise.measure)
      if (pattern === null) {
        throw new Error(
          `No se reconoce un patrón de estilo en el compás ${exercise.measure}`,
        )
      }
      return withChoicesOrText(
        choices,
        stylePatternCandidates(pattern, language),
      )
    }

    case 'pedal': {
      if (exercise.ask === 'pattern') {
        const pattern = pedalPatternInMeasure(exercise.score, exercise.measure)
        if (pattern === null) {
          throw new Error(
            `No hay pedal en el compás ${exercise.measure}`,
          )
        }
        return withChoicesOrText(
          choices,
          pedalPatternCandidates(pattern, language),
        )
      }
      const action = pedalActionAt(
        exercise.score,
        exercise.measure,
        exercise.beat,
      )
      if (action === null) {
        throw new Error(
          `No hay marca de pedal en el compás ${exercise.measure}, pulso ${exercise.beat}`,
        )
      }
      return withChoicesOrText(
        choices,
        pedalActionCandidates(action, language),
      )
    }

    case 'arpeggio': {
      if (exercise.ask === 'fingering') {
        return withChoicesOrText(choices, [
          arpeggioFingeringLabel(exercise.tonic, exercise.hand, exercise.octaves),
          arpeggioFingering(exercise.tonic, exercise.hand, exercise.octaves).join(' '),
        ])
      }
      return withChoicesOrText(choices, [
        arpeggioNoteNames(exercise.tonic, exercise.hand, exercise.octaves, 'es'),
        arpeggioNoteNames(exercise.tonic, exercise.hand, exercise.octaves, 'en'),
      ])
    }
  }
}

/** Compara una respuesta escrita o elegida con la respuesta canónica. */
export function isExerciseAnswerCorrect(
  exercise: Exercise,
  response: string,
  language: Locale = 'es',
): boolean {
  const resolved = resolveExerciseAnswer(exercise, language)
  if (resolved.mode === 'practice') return false

  if (exercise.type === 'scale-spelling') {
    const normalized = normalizeScaleSpelling(response)
    return resolved.accepted.some(
      (candidate) => normalizeScaleSpelling(candidate) === normalized,
    )
  }

  if (
    exercise.type === 'roman-numeral' ||
    exercise.type === 'borrowed-chord' ||
    exercise.type === 'pivot-chord' ||
    exercise.type === 'secondary-dominant'
  ) {
    // V y v son respuestas distintas: mayúscula es mayor y minúscula es menor.
    const trimmed = response.trim()
    return resolved.accepted.some((candidate) => candidate.trim() === trimmed)
  }

  const normalized = normalizeExerciseText(response)
  return resolved.accepted.some(
    (candidate) => normalizeExerciseText(candidate) === normalized,
  )
}
