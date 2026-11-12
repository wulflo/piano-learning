import type { Score } from '../schemas'
import {
  chordPitches,
  formatPitch,
  formatPitchEs,
  fromSpelledPitch,
  midiOf,
  parseChordSymbol,
  type Pitch,
} from '../theory'

/**
 * Ayudas para el acompañamiento en bloque y los lead sheets.
 *
 * Los ejercicios leen una partitura de acompañamiento y preguntan por el
 * patrón rítmico del compás, por el cifrado del lead sheet, por una nota de la
 * melodía o por el voicing de shell que realiza el cifrado. La respuesta se
 * deduce de los eventos y del cifrado para que el contenido no repita datos
 * que la propia partitura ya tiene.
 */

export const ACCOMPANIMENT_PATTERN_VALUES = [
  'whole',
  'half',
  'quarter',
  'bass-chord',
] as const
export type AccompanimentPattern =
  (typeof ACCOMPANIMENT_PATTERN_VALUES)[number]

export const ACCOMPANIMENT_PATTERN_LABELS: Record<
  AccompanimentPattern,
  { es: string; en: string }
> = {
  whole: { es: 'Acordes redondos', en: 'Whole-note chords' },
  half: { es: 'Acordes blancos', en: 'Half-note chords' },
  quarter: { es: 'Acordes en negras', en: 'Quarter-note chords' },
  'bass-chord': { es: 'Bajo y acorde', en: 'Bass and chord' },
}

const DURATION_BY_PATTERN: Record<
  'whole' | 'half' | 'quarter',
  'whole' | 'half' | 'quarter'
> = {
  whole: 'whole',
  half: 'half',
  quarter: 'quarter',
}

export function accompanimentPatternInMeasure(
  score: Score,
  measure: number,
): AccompanimentPattern | null {
  const events = score.events.filter((event) => event.measure === measure)
  if (events.length === 0) return null

  const single = events.filter((event) => event.pitches.length === 1)
  const chords = events.filter((event) => event.pitches.length >= 3)
  if (
    single.length > 0 &&
    chords.length > 0 &&
    single.length + chords.length === events.length
  ) {
    return 'bass-chord'
  }

  if (chords.length !== events.length) return null
  const first = events[0]
  if (first === undefined) return null
  for (const [pattern, duration] of Object.entries(DURATION_BY_PATTERN)) {
    if (
      events.every(
        (event) =>
          event.value.duration === duration &&
          event.value.dots === 0 &&
          event.value.tuplet === 'none',
      )
    ) {
      return pattern as AccompanimentPattern
    }
  }
  return null
}

/** Cifrado único del compás, si todas las marcas coinciden. */
export function chordSymbolInMeasure(
  score: Score,
  measure: number,
): string | null {
  const symbols = new Set(
    score.events
      .filter((event) => event.measure === measure)
      .map((event) => event.chordSymbol)
      .filter((symbol): symbol is string => symbol !== undefined),
  )
  if (symbols.size !== 1) return null
  return symbols.values().next().value ?? null
}

export function accompanimentPatternCandidates(
  pattern: AccompanimentPattern,
  language: 'es' | 'en',
): string[] {
  return [ACCOMPANIMENT_PATTERN_LABELS[pattern][language]]
}

export function chordSymbolCandidates(symbol: string): string[] {
  return [symbol]
}

/**
 * Nota de la melodía en un compás y pulso concretos.
 *
 * En un lead sheet la melodía es la voz superior de la mano derecha. Si hay
 * varios eventos con una sola nota en el mismo punto se prefiere el de la mano
 * derecha; el resto se descarta.
 */
export function leadSheetMelodyPitch(
  score: Score,
  measure: number,
  beat: number,
): Pitch | null {
  const events = score.events.filter(
    (event) =>
      event.measure === measure &&
      Math.abs(event.beat - beat) < 1e-6 &&
      event.pitches.length === 1,
  )
  const event =
    events.find((candidate) => candidate.hand === 'right') ?? events[0]
  if (event === undefined) return null
  return fromSpelledPitch(event.pitches[0])
}

/** Nombre de la nota de la melodía, con octava y en el idioma pedido. */
export function leadSheetMelodyNoteName(
  score: Score,
  measure: number,
  beat: number,
  language: 'es' | 'en',
): string | null {
  const pitch = leadSheetMelodyPitch(score, measure, beat)
  if (pitch === null) return null
  return language === 'es'
    ? `${formatPitchEs(pitch)}${pitch.octave}`
    : formatPitch(pitch)
}

export interface ShellVoicing {
  symbol: string
  /** Fundamental grave que toca la mano izquierda. */
  root: Pitch
  /** Tercera y séptima, o tercera y quinta en una tríada. */
  guides: Pitch[]
  /** Fundamental y guías ordenadas de grave a agudo. */
  pitches: Pitch[]
}

/**
 * Voicing de shell de un cifrado.
 *
 * La mano izquierda toma la fundamental en la octava 3. La derecha toca las
 * guías en la octava 4: tercera y séptima en los acordes con séptima, tercera y
 * quinta en las tríadas. En las tríadas la quinta se sube una octava si queda
 * por debajo de la tercera, para conservar el orden fundamental–tercera–quinta.
 */
export function shellVoicing(symbol: string): ShellVoicing {
  const parsed = parseChordSymbol(symbol)
  const chord = chordPitches(parsed.root, parsed.quality)
  if (chord.length < 3) {
    throw new Error(`El cifrado ${symbol} no tiene suficientes notas para un voicing`)
  }

  const root: Pitch = { ...(parsed.slash ?? parsed.root), octave: 3 }
  const guideIndexes = chord.length >= 4 ? [1, 3] : [1, 2]
  const guides = guideIndexes.map((index) => {
    const pitch = chord[index]
    if (pitch === undefined) {
      throw new Error(`No se pudo construir el voicing de ${symbol}`)
    }
    return { ...pitch, octave: 4 }
  })

  if (chord.length === 3) {
    const third = guides[0]
    const fifth = guides[1]
    if (third !== undefined && fifth !== undefined) {
      while (midiOf(fifth) <= midiOf(third)) {
        fifth.octave += 1
      }
    }
  }

  const pitches = [root, ...guides].sort(
    (first, second) => midiOf(first) - midiOf(second),
  )
  return { symbol, root, guides, pitches }
}

/**
 * Etiqueta de un shell voicing con las notas ordenadas y su octava. El español
 * usa los nombres latinos y el inglés la notación americana.
 */
export function shellVoicingLabel(
  symbol: string,
  language: 'es' | 'en',
): string {
  return shellVoicing(symbol)
    .pitches.map((pitch) =>
      language === 'es'
        ? `${formatPitchEs(pitch)}${pitch.octave}`
        : formatPitch(pitch),
    )
    .join(' + ')
}
