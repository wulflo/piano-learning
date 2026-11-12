import {
  LETTER_SEMITONES,
  LETTERS,
  accidentalToText,
  formatPitch,
  midiOf,
  mod12,
  normalizeAccidental,
  parsePitch,
  pitchFromMidi,
  type Pitch,
} from './pitch'

export const CHORD_QUALITIES = [
  'major',
  'minor',
  'diminished',
  'augmented',
  'sus2',
  'sus4',
  'major7',
  'dominant7',
  'minor7',
  'half-diminished7',
  'diminished7',
  'major9',
  'dominant9',
  'minor9',
  'major11',
  'dominant11',
  'minor11',
  'major13',
  'dominant13',
  'minor13',
] as const

export type ChordQuality = (typeof CHORD_QUALITIES)[number]

export interface ChordDefinition {
  quality: ChordQuality
  nameEs: string
  nameEn: string
  symbol: string
  /** Semitonos desde la fundamental. */
  intervals: number[]
  /** Distancia de letras desde la fundamental para cada nota. */
  degrees: number[]
}

export const CHORD_DEFINITIONS: Record<ChordQuality, ChordDefinition> = {
  major: {
    quality: 'major',
    nameEs: 'mayor',
    nameEn: 'major',
    symbol: '',
    intervals: [0, 4, 7],
    degrees: [0, 2, 4],
  },
  minor: {
    quality: 'minor',
    nameEs: 'menor',
    nameEn: 'minor',
    symbol: 'm',
    intervals: [0, 3, 7],
    degrees: [0, 2, 4],
  },
  diminished: {
    quality: 'diminished',
    nameEs: 'disminuido',
    nameEn: 'diminished',
    symbol: 'dim',
    intervals: [0, 3, 6],
    degrees: [0, 2, 4],
  },
  augmented: {
    quality: 'augmented',
    nameEs: 'aumentado',
    nameEn: 'augmented',
    symbol: 'aug',
    intervals: [0, 4, 8],
    degrees: [0, 2, 4],
  },
  sus2: {
    quality: 'sus2',
    nameEs: 'suspendido 2',
    nameEn: 'suspended 2',
    symbol: 'sus2',
    intervals: [0, 2, 7],
    degrees: [0, 1, 4],
  },
  sus4: {
    quality: 'sus4',
    nameEs: 'suspendido 4',
    nameEn: 'suspended 4',
    symbol: 'sus4',
    intervals: [0, 5, 7],
    degrees: [0, 3, 4],
  },
  major7: {
    quality: 'major7',
    nameEs: 'séptima mayor',
    nameEn: 'major seventh',
    symbol: 'maj7',
    intervals: [0, 4, 7, 11],
    degrees: [0, 2, 4, 6],
  },
  dominant7: {
    quality: 'dominant7',
    nameEs: 'séptima de dominante',
    nameEn: 'dominant seventh',
    symbol: '7',
    intervals: [0, 4, 7, 10],
    degrees: [0, 2, 4, 6],
  },
  minor7: {
    quality: 'minor7',
    nameEs: 'séptima menor',
    nameEn: 'minor seventh',
    symbol: 'm7',
    intervals: [0, 3, 7, 10],
    degrees: [0, 2, 4, 6],
  },
  'half-diminished7': {
    quality: 'half-diminished7',
    nameEs: 'séptima semidisminuida',
    nameEn: 'half-diminished seventh',
    symbol: 'm7b5',
    intervals: [0, 3, 6, 10],
    degrees: [0, 2, 4, 6],
  },
  diminished7: {
    quality: 'diminished7',
    nameEs: 'séptima disminuida',
    nameEn: 'diminished seventh',
    symbol: 'dim7',
    intervals: [0, 3, 6, 9],
    degrees: [0, 2, 4, 6],
  },
  major9: {
    quality: 'major9',
    nameEs: 'novena mayor',
    nameEn: 'major ninth',
    symbol: 'maj9',
    intervals: [0, 4, 7, 11, 14],
    degrees: [0, 2, 4, 6, 1],
  },
  dominant9: {
    quality: 'dominant9',
    nameEs: 'novena de dominante',
    nameEn: 'dominant ninth',
    symbol: '9',
    intervals: [0, 4, 7, 10, 14],
    degrees: [0, 2, 4, 6, 1],
  },
  minor9: {
    quality: 'minor9',
    nameEs: 'novena menor',
    nameEn: 'minor ninth',
    symbol: 'm9',
    intervals: [0, 3, 7, 10, 14],
    degrees: [0, 2, 4, 6, 1],
  },
  major11: {
    quality: 'major11',
    nameEs: 'oncena mayor',
    nameEn: 'major eleventh',
    symbol: 'maj11',
    intervals: [0, 4, 7, 11, 14, 17],
    degrees: [0, 2, 4, 6, 1, 3],
  },
  dominant11: {
    quality: 'dominant11',
    nameEs: 'oncena de dominante',
    nameEn: 'dominant eleventh',
    symbol: '11',
    intervals: [0, 4, 7, 10, 14, 17],
    degrees: [0, 2, 4, 6, 1, 3],
  },
  minor11: {
    quality: 'minor11',
    nameEs: 'oncena menor',
    nameEn: 'minor eleventh',
    symbol: 'm11',
    intervals: [0, 3, 7, 10, 14, 17],
    degrees: [0, 2, 4, 6, 1, 3],
  },
  major13: {
    quality: 'major13',
    nameEs: 'trecena mayor',
    nameEn: 'major thirteenth',
    symbol: 'maj13',
    intervals: [0, 4, 7, 11, 14, 17, 21],
    degrees: [0, 2, 4, 6, 1, 3, 5],
  },
  dominant13: {
    quality: 'dominant13',
    nameEs: 'trecena de dominante',
    nameEn: 'dominant thirteenth',
    symbol: '13',
    intervals: [0, 4, 7, 10, 14, 17, 21],
    degrees: [0, 2, 4, 6, 1, 3, 5],
  },
  minor13: {
    quality: 'minor13',
    nameEs: 'trecena menor',
    nameEn: 'minor thirteenth',
    symbol: 'm13',
    intervals: [0, 3, 7, 10, 14, 17, 21],
    degrees: [0, 2, 4, 6, 1, 3, 5],
  },
}

export type Notation = 'do' | 'c'

const SOLFEGE: Record<string, string> = {
  C: 'Do',
  D: 'Re',
  E: 'Mi',
  F: 'Fa',
  G: 'Sol',
  A: 'La',
  B: 'Si',
}

const QUALITY_ALIASES: Record<string, ChordQuality> = {
  '': 'major',
  M: 'major',
  maj: 'major',
  m: 'minor',
  min: 'minor',
  '-': 'minor',
  dim: 'diminished',
  '°': 'diminished',
  o: 'diminished',
  aug: 'augmented',
  '+': 'augmented',
  sus2: 'sus2',
  sus4: 'sus4',
  maj7: 'major7',
  M7: 'major7',
  '7': 'dominant7',
  m7: 'minor7',
  min7: 'minor7',
  m7b5: 'half-diminished7',
  'm7♭5': 'half-diminished7',
  ø: 'half-diminished7',
  dim7: 'diminished7',
  '°7': 'diminished7',
  maj9: 'major9',
  M9: 'major9',
  '9': 'dominant9',
  m9: 'minor9',
  maj11: 'major11',
  '11': 'dominant11',
  m11: 'minor11',
  maj13: 'major13',
  '13': 'dominant13',
  m13: 'minor13',
}

export type Tonic = string | Pitch

export function parseRoot(tonic: Tonic, octave = 4): Pitch {
  if (typeof tonic !== 'string') return tonic
  if (/-?\d+$/.test(tonic)) return parsePitch(tonic)
  return parsePitch(`${tonic}${octave}`)
}

export function rootName(pitch: Pitch, notation: Notation = 'c'): string {
  const glyphs: Record<number, string> = {
    [-2]: '𝄫',
    [-1]: '♭',
    0: '',
    1: '♯',
    2: '𝄪',
  }
  const base = notation === 'do' ? SOLFEGE[pitch.step] : pitch.step
  return `${base}${glyphs[pitch.accidental] ?? ''}`
}

export function chordPitches(tonic: Tonic, quality: ChordQuality): Pitch[] {
  const root = parseRoot(tonic)
  const definition = CHORD_DEFINITIONS[quality]
  if (!definition) {
    throw new Error(`Calidad de acorde desconocida: ${quality}`)
  }
  const rootMidi = midiOf(root)
  const rootLetter = LETTERS.indexOf(root.step)

  return definition.intervals.map((semitones, index) => {
    const letterOffset = definition.degrees[index]
    const absoluteLetter = rootLetter + letterOffset
    const letter = LETTERS[((absoluteLetter % 7) + 7) % 7]
    const octaveShift = Math.floor(absoluteLetter / 7)
    const targetMidi = rootMidi + semitones
    const naturalPc = LETTER_SEMITONES[letter]
    const accidental = normalizeAccidental(mod12(targetMidi) - naturalPc)
    return {
      step: letter,
      accidental,
      octave: root.octave + octaveShift + Math.floor(semitones / 12),
    }
  })
}

/**
 * Invierte un acorde rotando las primeras `inversion` notas una octava arriba.
 * El bajo resultante es la nota que queda primero.
 *
 * En los acordes extendidos, subir la fundamental una octava puede dejarla por
 * debajo de la novena, la oncena o la trecena que ya estaban en el acorde. Por
 * eso el resultado se ordena por altura: el voicing siempre sube desde el bajo.
 */
export function invertChord(pitches: Pitch[], inversion: number): Pitch[] {
  if (inversion < 0 || inversion >= pitches.length) {
    throw new Error(`Inversión fuera de rango: ${inversion}`)
  }
  const result = [...pitches]
  for (let i = 0; i < inversion; i += 1) {
    const first = result.shift()
    if (!first) break
    result.push(pitchFromMidi(midiOf(first) + 12, { step: first.step, accidental: first.accidental }))
  }
  return result.sort((first, second) => midiOf(first) - midiOf(second))
}

export function chordWithInversion(
  tonic: Tonic,
  quality: ChordQuality,
  inversion = 0,
): Pitch[] {
  return invertChord(chordPitches(tonic, quality), inversion)
}

/**
 * Construye un acorde con un bajo indicado con barra.
 * Si el bajo es una nota del acorde, devuelve la inversión correspondiente.
 * Si no lo es, coloca el bajo primero y el acorde completo por encima.
 */
export function chordWithSlash(
  tonic: Tonic,
  quality: ChordQuality,
  bass: Tonic,
): Pitch[] {
  const root = parseRoot(tonic)
  const bassPitch = parseRoot(bass)
  const pitches = chordPitches(root, quality)
  const bassClass = mod12(midiOf(bassPitch))
  const index = pitches.findIndex(
    (pitch) => mod12(midiOf(pitch)) === bassClass,
  )
  if (index >= 0) return invertChord(pitches, index)

  const lowest = Math.min(...pitches.map((pitch) => midiOf(pitch)))
  const bassMidi = midiOf(bassPitch)
  const octaves =
    lowest <= bassMidi ? Math.floor((bassMidi - lowest) / 12) + 1 : 0
  const shifted =
    octaves === 0
      ? pitches
      : pitches.map((pitch) =>
          pitchFromMidi(midiOf(pitch) + octaves * 12, {
            step: pitch.step,
            accidental: pitch.accidental,
          }),
        )
  return [bassPitch, ...shifted]
}

export function chordBass(pitches: Pitch[]): Pitch {
  if (pitches.length === 0) throw new Error('El acorde no tiene notas')
  return [...pitches].sort((a, b) => midiOf(a) - midiOf(b))[0]
}

/** Nombres de las inversiones por índice: 0 = fundamental, 1 = primera, etc. */
export const CHORD_INVERSION_LABELS = {
  es: [
    'estado fundamental',
    'primera inversión',
    'segunda inversión',
    'tercera inversión',
  ],
  en: ['root position', 'first inversion', 'second inversion', 'third inversion'],
} as const

export function chordSymbol(
  tonic: Tonic,
  quality: ChordQuality,
  options: { notation?: Notation; slash?: Tonic } = {},
): string {
  const root = parseRoot(tonic)
  const notation = options.notation ?? 'c'
  const suffix = CHORD_DEFINITIONS[quality].symbol
  const base = `${rootName(root, notation)}${suffix}`
  if (options.slash) {
    return `${base}/${rootName(parseRoot(options.slash), notation)}`
  }
  return base
}

export interface ParsedChord {
  root: Pitch
  quality: ChordQuality
  slash?: Pitch
  symbol: string
}

const NOTE_TO_LATIN: Record<string, string> = {
  C: 'Do',
  D: 'Re',
  E: 'Mi',
  F: 'Fa',
  G: 'Sol',
  A: 'La',
  B: 'Si',
}

const LATIN_TO_NOTE: Record<string, string> = {
  Do: 'C',
  Re: 'D',
  Mi: 'E',
  Fa: 'F',
  Sol: 'G',
  La: 'A',
  Si: 'B',
}

function accidentalToGlyph(accidental: string | undefined): string {
  if (!accidental) return ''
  if (accidental === 'bb' || accidental === '♭♭') return '♭♭'
  if (accidental === 'b' || accidental === '♭') return '♭'
  if (accidental === '##' || accidental === '♯♯' || accidental === 'x') return '♯♯'
  if (accidental === '#' || accidental === '♯') return '♯'
  return ''
}

const CHORD_PART_PATTERN =
  /^(Do|Re|Mi|Fa|Sol|La|Si|[A-G])(bb|♭♭|b|♭|##|♯♯|#|♯|x|)(.*)$/

const AMERICAN_CHORD_PART_PATTERN =
  /^([A-G])(bb|♭♭|b|♭|##|♯♯|#|♯|x|)(.*)$/

/**
 * Separa nota y sufijo de un cifrado. Las notas latinas de dos letras pueden
 * chocar con los sufijos americanos que empiezan igual: «Faug» se leería como
 * «Fa» + «ug». Si el sufijo latino no es una calidad válida y el americano sí,
 * se prefiere la lectura americana. Así «Faug» se lee como F aumentado y «Fam»
 * como Fa menor.
 */
function matchChordPart(part: string): RegExpExecArray | null {
  const trimmed = part.trim()
  const match = CHORD_PART_PATTERN.exec(trimmed)
  if (!match) return null

  const token = match[1]
  const suffix = match[3].trim()
  if (LATIN_TO_NOTE[token] && !QUALITY_ALIASES[suffix]) {
    const american = AMERICAN_CHORD_PART_PATTERN.exec(trimmed)
    if (american && QUALITY_ALIASES[american[3].trim()]) return american
  }
  return match
}

function translateChordPart(part: string, target: Notation): string {
  const match = matchChordPart(part)
  if (!match) return part

  const token = match[1]
  const letter = LATIN_TO_NOTE[token] ?? token
  const base = target === 'do' ? NOTE_TO_LATIN[letter] : letter
  return `${base}${accidentalToGlyph(match[2])}${match[3]}`
}

/**
 * Convierte un cifrado completo entre notación latina y americana.
 * Traduce las notas de ambos lados de la barra y conserva las calidades
 * (`m7♭5`, `maj13`, etc.) tal como están escritas.
 */
export function convertChordNotation(
  symbol: string,
  target: Notation,
): string {
  return symbol
    .split('/')
    .map((part) => translateChordPart(part, target))
    .join('/')
}

/**
 * Acepta cifrado americano y latino: C, Cm, Cmaj7, C7, Cm7b5, Cdim7, C9,
 * Csus4, C/E, Do7, Solm, Lam, Si♭maj7, etc.
 */
export function parseChordSymbol(input: string): ParsedChord {
  const text = input.trim()
  if (!text) throw new Error('Cifrado vacío')

  const [chordPart, slashPart] = text.split('/')
  const match = matchChordPart(chordPart)
  if (!match) {
    throw new Error(`Cifrado inválido: "${input}"`)
  }

  const token = match[1]
  const letter = LATIN_TO_NOTE[token] ?? token
  const accidental =
    match[2] === 'b' || match[2] === '♭'
      ? -1
      : match[2] === 'bb' || match[2] === '♭♭'
        ? -2
        : match[2] === '#' || match[2] === '♯'
          ? 1
          : match[2] === '##' || match[2] === '♯♯' || match[2] === 'x'
            ? 2
            : 0
  const root: Pitch = { step: letter as Pitch['step'], accidental, octave: 4 }
  const qualityToken = match[3].trim()
  const quality = QUALITY_ALIASES[qualityToken]
  if (!quality) {
    throw new Error(`Calidad de acorde desconocida en "${input}": "${qualityToken}"`)
  }

  const slash = slashPart
    ? (() => {
        const bassMatch =
          /^(Do|Re|Mi|Fa|Sol|La|Si|[A-G])(♭♭|♭|♯♯|♯|bb|b|##|#|x|)$/.exec(
            slashPart.trim(),
          )
        if (!bassMatch) throw new Error(`Bajo inválido en "${input}"`)
        const bassToken = bassMatch[1]
        const bassLetter = LATIN_TO_NOTE[bassToken] ?? bassToken
        const bassAccidental =
          bassMatch[2] === 'b' || bassMatch[2] === '♭'
            ? -1
            : bassMatch[2] === 'bb' || bassMatch[2] === '♭♭'
              ? -2
              : bassMatch[2] === '#' || bassMatch[2] === '♯'
                ? 1
                : bassMatch[2] === '##' || bassMatch[2] === '♯♯' || bassMatch[2] === 'x'
                  ? 2
                  : 0
        return {
          step: bassLetter as Pitch['step'],
          accidental: bassAccidental,
          octave: 4,
        }
      })()
    : undefined

  return { root, quality, slash, symbol: text }
}

export function chordName(
  quality: ChordQuality,
  locale: 'es' | 'en' = 'es',
): string {
  return CHORD_DEFINITIONS[quality][locale === 'es' ? 'nameEs' : 'nameEn']
}

export function chordNoteNames(
  tonic: Tonic,
  quality: ChordQuality,
  notation: Notation = 'c',
): string[] {
  return chordPitches(tonic, quality).map((pitch) => rootName(pitch, notation))
}

export function pitchDisplay(pitch: Pitch, notation: Notation): string {
  return `${rootName(pitch, notation)}${pitch.octave}`
}

export { accidentalToText, formatPitch }
