import type { ChordQuality } from '../theory'
import {
  formatPitch,
  formatPitchEs,
  fromSpelledPitch,
  midiOf,
  mod12,
  parseChordSymbol,
  parsePitch,
  romanNumeralFor,
  scaleNotes,
} from '../theory'
import type { Pitch } from '../theory'
import type { Score } from '../schemas'
import { chordSymbolInMeasure } from './accompaniment'

/**
 * Patrones y progresiones de los estilos populares.
 *
 * Un ejercicio `style-pattern` lee una partitura de acompañamiento con
 * cifrados por compás y pregunta por el patrón rítmico, por el cifrado de un
 * compás, por los grados de la progresión, por la escala o por las notas del
 * voicing. El style se guarda en el contenido para etiquetar la lección, pero
 * el análisis es el mismo en todos los casos: ritmo de los acordes,
 * fundamental de cada cifrado y voces escritas.
 */

export const STYLE_PATTERN_VALUES = [
  'eighths',
  'shuffle',
  'comping',
  'quarters',
  'half-time',
  'syncopated',
  'bossa',
  'montuno',
] as const
export type StylePattern = (typeof STYLE_PATTERN_VALUES)[number]

export const STYLE_PATTERN_LABELS: Record<
  StylePattern,
  { es: string; en: string }
> = {
  eighths: { es: 'Corcheas', en: 'Eighths' },
  shuffle: { es: 'Shuffle', en: 'Shuffle' },
  comping: { es: 'Comping', en: 'Comping' },
  quarters: { es: 'Negras', en: 'Quarters' },
  'half-time': { es: 'Medio tiempo', en: 'Half-time' },
  syncopated: { es: 'Síncopa', en: 'Syncopation' },
  bossa: { es: 'Bossa nova', en: 'Bossa nova' },
  montuno: { es: 'Montuno', en: 'Montuno' },
}

export const STYLE_SCALE_VALUES = [
  'blues-scale',
  'major-pentatonic',
  'minor-pentatonic',
  'mixolydian',
] as const
export type StyleScale = (typeof STYLE_SCALE_VALUES)[number]

export const STYLE_SCALE_LABELS: Record<
  StyleScale,
  { es: string; en: string }
> = {
  'blues-scale': { es: 'Escala de blues', en: 'Blues scale' },
  'major-pentatonic': { es: 'Pentatónica mayor', en: 'Major pentatonic' },
  'minor-pentatonic': { es: 'Pentatónica menor', en: 'Minor pentatonic' },
  mixolydian: { es: 'Mixolidia', en: 'Mixolydian' },
}

const SCALE_INTERVALS: Record<StyleScale, number[]> = {
  'blues-scale': [0, 3, 5, 6, 7, 10],
  'major-pentatonic': [0, 2, 4, 7, 9],
  'minor-pentatonic': [0, 3, 5, 7, 10],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
}

function isPlainValue(
  event: Score['events'][number],
  duration: 'quarter' | 'half' | 'eighth',
): boolean {
  return (
    event.value.duration === duration &&
    event.value.dots === 0 &&
    event.value.tuplet === 'none'
  )
}

/**
 * Patrón rítmico del acompañamiento en un compás.
 *
 * Solo se miran los acordes (eventos con dos o más notas); la fundamental del
 * bajo queda fuera. Se reconocen corcheas rectas, shuffle (corcheas con
 * velocidades alternadas), comping (ataques en los contratiempos), negras,
 * medio tiempo y síncopa. Devuelve `null` cuando el compás no encaja en
 * ninguna de ellas.
 */
export function stylePatternInMeasure(
  score: Score,
  measure: number,
): StylePattern | null {
  const chords = score.events.filter(
    (event) => event.measure === measure && event.pitches.length >= 2,
  )
  if (chords.length === 0) return null

  const attacks = chords
    .map((event) => event.beat)
    .sort((first, second) => first - second)
  const eighths =
    chords.length === 8 &&
    attacks.every((beat, index) => Math.abs(beat - index * 0.5) < 1e-6) &&
    chords.every((event) => isPlainValue(event, 'eighth'))

  if (eighths) {
    const velocities = chords.map((event) => event.velocity)
    const alternating =
      velocities.length >= 2 &&
      velocities.every(
        (velocity, index) =>
          Math.abs(velocity - (velocities[index % 2] ?? velocity)) < 1e-6,
      ) &&
      Math.abs((velocities[0] ?? 0) - (velocities[1] ?? 0)) > 1e-6
    return alternating ? 'shuffle' : 'eighths'
  }

  if (
    chords.length === 4 &&
    attacks.every((beat, index) => Math.abs(beat - (index + 0.5)) < 1e-6) &&
    chords.every((event) => isPlainValue(event, 'eighth'))
  ) {
    return 'comping'
  }

  if (
    chords.length === 4 &&
    attacks.every((beat, index) => Math.abs(beat - index) < 1e-6) &&
    chords.every((event) => isPlainValue(event, 'quarter'))
  ) {
    return 'quarters'
  }

  if (
    chords.length === 2 &&
    Math.abs(attacks[0] ?? -1) < 1e-6 &&
    Math.abs((attacks[1] ?? -1) - 2) < 1e-6 &&
    chords.every((event) => isPlainValue(event, 'half'))
  ) {
    return 'half-time'
  }

  if (
    chords.length === 2 &&
    Math.abs((attacks[0] ?? -1) - 1) < 1e-6 &&
    Math.abs((attacks[1] ?? -1) - 3) < 1e-6 &&
    chords.every((event) => isPlainValue(event, 'half'))
  ) {
    return 'bossa'
  }

  const montunoBeats = [0, 0.5, 1.5, 2, 3, 3.5]
  if (
    chords.length === montunoBeats.length &&
    attacks.every(
      (beat, index) =>
        Math.abs(beat - (montunoBeats[index] ?? -1)) < 1e-6,
    ) &&
    chords.every((event) => isPlainValue(event, 'eighth'))
  ) {
    return 'montuno'
  }

  const hasOffbeat = attacks.some(
    (beat) => Math.abs(beat - Math.round(beat)) > 1e-6,
  )
  return hasOffbeat ? 'syncopated' : null
}

export function stylePatternCandidates(
  pattern: StylePattern,
  language: 'es' | 'en',
): string[] {
  return [STYLE_PATTERN_LABELS[pattern][language]]
}

/** Calidad reducida al numeral romano: las séptimas conservan su género. */
function numeralQuality(quality: ChordQuality): ChordQuality {
  if (quality.startsWith('minor')) return 'minor'
  if (quality.startsWith('diminished') || quality === 'half-diminished7') {
    return 'diminished'
  }
  if (quality.startsWith('augmented')) return 'augmented'
  return 'major'
}

/**
 * Grados de la progresión, un numeral por compás con cifrado.
 *
 * La fundamental del cifrado se compara con las notas de la escala de la
 * tonalidad de la partitura. Se usa el modo natural en menor para que los
 * acordes diatónicos conserven sus grados. Devuelve `null` si algún compás no
 * tiene un cifrado único o si el acorde no pertenece a la escala.
 */
export function styleProgressionDegrees(score: Score): string[] | null {
  const tonic = parsePitch(`${score.key}4`)
  const scale = scaleNotes(
    tonic,
    score.mode === 'minor' ? 'natural-minor' : 'major',
  )
  const degreeByPitchClass = new Map(
    scale.map((note) => [mod12(midiOf(note.pitch)), note.degree] as const),
  )
  const measures = [...new Set(score.events.map((event) => event.measure))].sort(
    (first, second) => first - second,
  )

  const degrees: string[] = []
  for (const measure of measures) {
    const symbol = chordSymbolInMeasure(score, measure)
    if (symbol === null) return null
    const parsed = parseChordSymbol(symbol)
    const degree = degreeByPitchClass.get(mod12(midiOf(parsed.root)))
    if (degree === undefined) return null
    degrees.push(romanNumeralFor(degree, numeralQuality(parsed.quality)))
  }

  return degrees.length >= 2 ? degrees : null
}

/** Respuesta canónica de la progresión, con una raya entre grados. */
export function styleProgressionCandidates(degrees: readonly string[]): string[] {
  return [
    degrees.join('–'),
    degrees.join(' - '),
    degrees.join(' '),
  ]
}

/**
 * Escala que suena en la partitura, comparada por clases de altura.
 *
 * Se miran todas las notas de la partitura y se comparan con los intervalos
 * relativos a la tonalidad declarada. Devuelve `null` cuando el fragmento no
 * coincide con ninguna de las escalas del módulo.
 */
export function styleScaleName(score: Score): StyleScale | null {
  const tonic = parsePitch(`${score.key}4`)
  const tonicPitchClass = mod12(midiOf(tonic))
  const pitchClasses = new Set(
    score.events.flatMap((event) =>
      event.pitches.map((pitch) => mod12(midiOf(fromSpelledPitch(pitch)))),
    ),
  )
  if (pitchClasses.size < 5) return null

  for (const scale of STYLE_SCALE_VALUES) {
    const expected = new Set(
      SCALE_INTERVALS[scale].map((interval) =>
        mod12(tonicPitchClass + interval),
      ),
    )
    if (expected.size !== pitchClasses.size) continue
    if ([...expected].every((pitchClass) => pitchClasses.has(pitchClass))) {
      return scale
    }
  }
  return null
}

export function styleScaleCandidates(
  scale: StyleScale,
  language: 'es' | 'en',
): string[] {
  return [STYLE_SCALE_LABELS[scale][language]]
}

/**
 * Notas del voicing escrito en un compás.
 *
 * Se toma el primer acorde de la mano derecha (dos o más notas) y se ordena de
 * grave a agudo. El bajo de una sola nota queda fuera. Devuelve `null` cuando
 * el compás no tiene un acorde reconocible.
 */
export function styleVoicingPitches(
  score: Score,
  measure: number,
): Pitch[] | null {
  const chords = score.events.filter(
    (event) =>
      event.measure === measure &&
      event.pitches.length >= 2 &&
      event.hand === 'right',
  )
  const event = chords[0]
  if (event === undefined) return null
  return event.pitches
    .map(fromSpelledPitch)
    .sort((first, second) => midiOf(first) - midiOf(second))
}

/**
 * Etiqueta del voicing con sus notas ordenadas y la octava. El español usa los
 * nombres latinos y el inglés la notación americana.
 */
export function styleVoicingCandidates(
  score: Score,
  measure: number,
  language: 'es' | 'en',
): string[] | null {
  const pitches = styleVoicingPitches(score, measure)
  if (pitches === null) return null
  return [
    pitches
      .map((pitch) =>
        language === 'es'
          ? `${formatPitchEs(pitch)}${pitch.octave}`
          : formatPitch(pitch),
      )
      .join(' + '),
  ]
}
