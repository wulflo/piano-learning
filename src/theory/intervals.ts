import { LETTERS, LETTER_SEMITONES, accidentalToText, formatPitch, midiOf, type Pitch } from './pitch'

export type IntervalQuality =
  | 'perfect'
  | 'major'
  | 'minor'
  | 'augmented'
  | 'diminished'
  | 'doubly-augmented'
  | 'doubly-diminished'

export interface Interval {
  /** Número completo: 1, 2, ..., 8, 9, 11, 13. */
  number: number
  /** Número reducido a la octava: 1-8. */
  simpleNumber: number
  quality: IntervalQuality
  semitones: number
  octaves: number
  nameEs: string
  nameEn: string
  symbol: string
  descending: boolean
}

const SIMPLE_BASE_SEMITONES: Record<number, number> = {
  1: 0,
  2: 2,
  3: 4,
  4: 5,
  5: 7,
  6: 9,
  7: 11,
  8: 12,
}

const PERFECT_NUMBERS = new Set([1, 4, 5, 8])

const NUMBER_NAMES_ES = [
  'unísono',
  'segunda',
  'tercera',
  'cuarta',
  'quinta',
  'sexta',
  'séptima',
  'octava',
  'novena',
  'décima',
  'undécima',
  'duodécima',
  'decimotercera',
]

const NUMBER_NAMES_EN = [
  'unison',
  'second',
  'third',
  'fourth',
  'fifth',
  'sixth',
  'seventh',
  'octave',
  'ninth',
  'tenth',
  'eleventh',
  'twelfth',
  'thirteenth',
]

const QUALITY_NAMES_ES: Record<IntervalQuality, string> = {
  perfect: 'justa',
  major: 'mayor',
  minor: 'menor',
  augmented: 'aumentada',
  diminished: 'disminuida',
  'doubly-augmented': 'doble aumentada',
  'doubly-diminished': 'doble disminuida',
}

/** El unísono es masculino: «unísono justo», no «unísono justa». */
const UNISON_QUALITY_NAMES_ES: Record<IntervalQuality, string> = {
  perfect: 'justo',
  major: 'mayor',
  minor: 'menor',
  augmented: 'aumentado',
  diminished: 'disminuido',
  'doubly-augmented': 'doble aumentado',
  'doubly-diminished': 'doble disminuido',
}

const QUALITY_NAMES_EN: Record<IntervalQuality, string> = {
  perfect: 'perfect',
  major: 'major',
  minor: 'minor',
  augmented: 'augmented',
  diminished: 'diminished',
  'doubly-augmented': 'doubly augmented',
  'doubly-diminished': 'doubly diminished',
}

const QUALITY_SYMBOLS: Record<IntervalQuality, string> = {
  perfect: 'P',
  major: 'M',
  minor: 'm',
  augmented: 'A',
  diminished: 'd',
  'doubly-augmented': 'AA',
  'doubly-diminished': 'dd',
}

function qualityFromSemitones(
  simpleNumber: number,
  simpleSemitones: number,
): IntervalQuality {
  const base = SIMPLE_BASE_SEMITONES[simpleNumber]
  if (base === undefined) {
    throw new Error(`Número de intervalo inválido: ${simpleNumber}`)
  }
  const diff = simpleSemitones - base
  if (PERFECT_NUMBERS.has(simpleNumber)) {
    if (diff === 0) return 'perfect'
    if (diff === 1) return 'augmented'
    if (diff === 2) return 'doubly-augmented'
    if (diff === -1) return 'diminished'
    if (diff === -2) return 'doubly-diminished'
  } else {
    if (diff === 0) return 'major'
    if (diff === -1) return 'minor'
    if (diff === 1) return 'augmented'
    if (diff === -2) return 'diminished'
    if (diff === 2) return 'doubly-augmented'
    if (diff === -3) return 'doubly-diminished'
  }
  throw new Error(
    `Combinación de intervalo no soportada: número ${simpleNumber}, ${simpleSemitones} semitonos`,
  )
}

function describe(number: number, quality: IntervalQuality, _descending: boolean): Pick<Interval, 'nameEs' | 'nameEn' | 'symbol'> {
  const baseNameEs = NUMBER_NAMES_ES[number - 1] ?? `${number}ª`
  const baseNameEn = NUMBER_NAMES_EN[number - 1] ?? `${number}th`
  const qualityNameEs =
    number === 1 ? UNISON_QUALITY_NAMES_ES[quality] : QUALITY_NAMES_ES[quality]
  return {
    nameEs: `${baseNameEs} ${qualityNameEs}`.trim(),
    nameEn: `${QUALITY_NAMES_EN[quality]} ${baseNameEn}`.trim(),
    symbol: `${QUALITY_SYMBOLS[quality]}${number}`,
  }
}

function letterPosition(pitch: Pitch): number {
  return pitch.octave * 7 + LETTERS.indexOf(pitch.step)
}

/**
 * Intervalo ascendente entre dos notas. Si `upper` suena más grave que
 * `lower`, se calcula igual y se marca `descending: true`.
 */
export function intervalBetween(lower: Pitch, upper: Pitch): Interval {
  const descending = midiOf(upper) < midiOf(lower)
  const low = descending ? upper : lower
  const high = descending ? lower : upper
  const letterSteps = letterPosition(high) - letterPosition(low)
  const semitones = midiOf(high) - midiOf(low)
  const number = letterSteps + 1
  const octaves = Math.floor((number - 1) / 7)
  const simpleNumber = number <= 8 ? number : ((number - 1) % 7) + 1
  const qualitySemitones = number <= 8 ? semitones : semitones - octaves * 12
  const quality = qualityFromSemitones(simpleNumber, qualitySemitones)
  const description = describe(number, quality, descending)

  return {
    number,
    simpleNumber,
    quality,
    semitones,
    octaves,
    descending,
    ...description,
  }
}

const INVERSIONS: Record<IntervalQuality, IntervalQuality> = {
  perfect: 'perfect',
  major: 'minor',
  minor: 'major',
  augmented: 'diminished',
  diminished: 'augmented',
  'doubly-augmented': 'doubly-diminished',
  'doubly-diminished': 'doubly-augmented',
}

export function invertInterval(interval: Interval): Interval {
  const simpleNumber = 9 - interval.simpleNumber
  const quality = INVERSIONS[interval.quality]
  const simpleSemitones =
    simpleNumber === 1 ? 0 : 12 - (interval.semitones - interval.octaves * 12)
  const description = describe(simpleNumber, quality, interval.descending)
  return {
    number: simpleNumber,
    simpleNumber,
    quality,
    semitones: simpleSemitones,
    octaves: 0,
    descending: interval.descending,
    ...description,
  }
}

export function intervalSemitones(number: number, quality: IntervalQuality): number {
  const octaves = Math.floor((number - 1) / 7)
  const simpleNumber = ((number - 1) % 7) + 1
  const base = SIMPLE_BASE_SEMITONES[simpleNumber]
  const perfect = PERFECT_NUMBERS.has(simpleNumber)
  const diff = (() => {
    switch (quality) {
      case 'perfect':
      case 'major':
        return 0
      case 'minor':
        if (perfect) throw new Error(`Una ${simpleNumber}ª no puede ser menor`)
        return -1
      case 'augmented':
        return 1
      case 'diminished':
        return perfect ? -1 : -2
      case 'doubly-augmented':
        return 2
      case 'doubly-diminished':
        return perfect ? -2 : -3
    }
  })()
  return base + diff + octaves * 12
}

const SIMPLE_INTERVAL_TABLE: Array<{
  semitones: number
  number: number
  quality: IntervalQuality
}> = [
  { semitones: 0, number: 1, quality: 'perfect' },
  { semitones: 1, number: 2, quality: 'minor' },
  { semitones: 2, number: 2, quality: 'major' },
  { semitones: 3, number: 3, quality: 'minor' },
  { semitones: 4, number: 3, quality: 'major' },
  { semitones: 5, number: 4, quality: 'perfect' },
  { semitones: 6, number: 4, quality: 'augmented' },
  { semitones: 7, number: 5, quality: 'perfect' },
  { semitones: 8, number: 6, quality: 'minor' },
  { semitones: 9, number: 6, quality: 'major' },
  { semitones: 10, number: 7, quality: 'minor' },
  { semitones: 11, number: 7, quality: 'major' },
]

export function intervalFromSemitones(semitones: number): Interval {
  const absolute = Math.abs(semitones)
  const octaves = Math.floor(absolute / 12)
  const simple = absolute % 12
  const entry = SIMPLE_INTERVAL_TABLE.find((item) => item.semitones === simple)
  if (!entry) {
    throw new Error(`Semitonos inválidos: ${semitones}`)
  }
  const number =
    entry.number === 1 && octaves > 0 ? 1 + octaves * 7 : entry.number + octaves * 7
  const description = describe(number, entry.quality, semitones < 0)
  return {
    number,
    simpleNumber: entry.number,
    quality: entry.quality,
    semitones: absolute,
    octaves,
    descending: semitones < 0,
    ...description,
  }
}

/** Construye la nota superior de un intervalo a partir de la inferior. */
export function transposeInterval(lower: Pitch, number: number, quality: IntervalQuality): Pitch {
  const semitones = intervalSemitones(number, quality)
  const letterOffset = number - 1
  const absoluteLetter = LETTERS.indexOf(lower.step) + letterOffset
  const letter = LETTERS[((absoluteLetter % 7) + 7) % 7]
  const octave = lower.octave + Math.floor(absoluteLetter / 7)
  const targetMidi = midiOf(lower) + semitones
  const naturalPc = LETTER_SEMITONES[letter]
  const targetPc = ((targetMidi % 12) + 12) % 12
  let accidental = targetPc - naturalPc
  while (accidental > 2) accidental -= 12
  while (accidental < -2) accidental += 12
  return { step: letter, accidental, octave }
}

export function intervalLabel(
  lower: Pitch,
  upper: Pitch,
  locale: 'es' | 'en' = 'es',
): string {
  const interval = intervalBetween(lower, upper)
  return `${locale === 'es' ? interval.nameEs : interval.nameEn} (${formatPitch(lower)} → ${formatPitch(upper)})`
}

export function intervalName(
  interval: Interval,
  locale: 'es' | 'en' = 'es',
): string {
  return locale === 'es' ? interval.nameEs : interval.nameEn
}

export function accidentalText(accidental: number): string {
  return accidentalToText(accidental)
}
