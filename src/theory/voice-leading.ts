import { mod12 } from './pitch'

/**
 * Motor de conducción de voces.
 *
 * Compara acordes consecutivos con las voces alineadas por índice (de grave a
 * agudo) y detecta dos faltas clásicas: quintas paralelas y octavas paralelas.
 * Hay paralela cuando dos voces se mueven en la misma dirección (ambas suben o
 * ambas bajan) y el intervalo entre ellas es una quinta o una octava justa en
 * los dos acordes. Las unísonos cuentan como octavas.
 *
 * Además de señalar el problema, el motor propone una conducción corregida:
 * busca voicings de los mismos acordes (mismas clases de altura) dentro de un
 * registro cercano, prefiere el movimiento mínimo entre voces y devuelve la
 * primera combinación sin paralelas. Si el bajo está fijado, lo respeta.
 *
 * Es puro: no depende de React, del audio ni del contenido.
 */

export type VoiceLeadingIssueKind = 'parallel-fifths' | 'parallel-octaves'

export interface VoiceLeadingChord {
  /** Etiqueta del acorde, por ejemplo el número romano `IV`. */
  label: string
  /** Voces del acorde, de grave a agudo, como MIDI. */
  midis: readonly number[]
}

export interface VoiceLeadingIssue {
  kind: VoiceLeadingIssueKind
  /** Índice del acorde anterior y del siguiente en la progresión. */
  fromIndex: number
  toIndex: number
  fromLabel: string
  toLabel: string
  /** Índices de las dos voces implicadas (0 = la más grave). */
  voices: [number, number]
  fromMidis: [number, number]
  toMidis: [number, number]
}

export interface VoiceLeadingAnalysis {
  chords: VoiceLeadingChord[]
  issues: VoiceLeadingIssue[]
  /** Conducción propuesta; misma longitud y mismas clases de altura. */
  suggestions: VoiceLeadingChord[]
  /** Índices de los acordes cuya propuesta cambia respecto del original. */
  changed: number[]
}

export interface VoiceLeadingOptions {
  /** Rango en el que se buscan los voicings sugeridos. */
  minMidi?: number
  maxMidi?: number
  /** Si es true, la voz más grave de cada acorde se conserva. */
  keepBass?: boolean
  /** Máximo de combinaciones que se prueban por acorde. */
  maxCandidates?: number
}

const FIFTH = 7
const OCTAVE = 0

/** Distancia en semitonos entre dos voces, reducida a una octava. */
export function voiceIntervalClass(lower: number, upper: number): number {
  return mod12(Math.abs(upper - lower))
}

function direction(from: number, to: number): number {
  return Math.sign(to - from)
}

/**
 * Problemas de conducción entre dos acordes. Las voces se emparejan por
 * posición; si los acordes tienen distinto número de voces se comparan las
 * voces comunes.
 */
export function voiceLeadingIssues(
  previous: VoiceLeadingChord,
  next: VoiceLeadingChord,
  fromIndex = 0,
): VoiceLeadingIssue[] {
  const issues: VoiceLeadingIssue[] = []
  const voices = Math.min(previous.midis.length, next.midis.length)

  for (let first = 0; first < voices; first += 1) {
    for (let second = first + 1; second < voices; second += 1) {
      const fromFirst = previous.midis[first]
      const fromSecond = previous.midis[second]
      const toFirst = next.midis[first]
      const toSecond = next.midis[second]

      const fromDirection = direction(fromFirst, toFirst)
      const toDirection = direction(fromSecond, toSecond)
      if (fromDirection === 0 || fromDirection !== toDirection) continue

      const fromInterval = voiceIntervalClass(fromFirst, fromSecond)
      const toInterval = voiceIntervalClass(toFirst, toSecond)
      if (fromInterval !== toInterval) continue

      const kind: VoiceLeadingIssueKind | null =
        fromInterval === FIFTH
          ? 'parallel-fifths'
          : fromInterval === OCTAVE
            ? 'parallel-octaves'
            : null
      if (kind === null) continue

      issues.push({
        kind,
        fromIndex,
        toIndex: fromIndex + 1,
        fromLabel: previous.label,
        toLabel: next.label,
        voices: [first, second],
        fromMidis: [fromFirst, fromSecond],
        toMidis: [toFirst, toSecond],
      })
    }
  }

  return issues
}

function pitchClasses(midis: readonly number[]): number[] {
  return midis.map((midi) => mod12(midi))
}

function samePitchClasses(
  candidate: readonly number[],
  original: readonly number[],
): boolean {
  if (candidate.length !== original.length) return false
  const left = [...pitchClasses(candidate)].sort((a, b) => a - b)
  const right = [...pitchClasses(original)].sort((a, b) => a - b)
  return left.every((pitchClass, index) => pitchClass === right[index])
}

/**
 * Todos los voicings posibles de un acorde dentro de un rango, con la misma
 * multiplicidad de clases de altura que el original (para conservar
 * duplicaciones). Se devuelven ordenados de grave a agudo.
 */
function candidateVoicings(
  original: readonly number[],
  minMidi: number,
  maxMidi: number,
  limit: number,
): number[][] {
  const classes = pitchClasses(original)
  if (classes.length === 0) return []

  const options = classes.map((pitchClass) => {
    const midis: number[] = []
    for (let midi = minMidi; midi <= maxMidi; midi += 1) {
      if (mod12(midi) === pitchClass) midis.push(midi)
    }
    return midis
  })
  if (options.some((list) => list.length === 0)) return []

  const seen = new Set<string>()
  const candidates: number[][] = []
  const stack: number[] = []

  const walk = (index: number): void => {
    if (candidates.length >= limit) return
    if (index === options.length) {
      const sorted = [...stack].sort((a, b) => a - b)
      // Voces al unísono o cruzadas no sirven como propuesta.
      for (let voice = 1; voice < sorted.length; voice += 1) {
        if (sorted[voice] <= sorted[voice - 1]) return
      }
      if (sorted[sorted.length - 1] - sorted[0] > 24) return
      const key = sorted.join(',')
      if (seen.has(key)) return
      seen.add(key)
      candidates.push(sorted)
      return
    }
    for (const midi of options[index]) {
      stack.push(midi)
      walk(index + 1)
      stack.pop()
      if (candidates.length >= limit) return
    }
  }

  walk(0)
  return candidates
}

function movement(from: readonly number[], to: readonly number[]): number {
  const voices = Math.min(from.length, to.length)
  let total = 0
  for (let index = 0; index < voices; index += 1) total += Math.abs(to[index] - from[index])
  return total
}

function registerChange(
  original: readonly number[],
  candidate: readonly number[],
): number {
  const voices = Math.min(original.length, candidate.length)
  let total = 0
  for (let index = 0; index < voices; index += 1) {
    total += Math.abs(candidate[index] - original[index])
  }
  return total
}

/** Ordena las voces y devuelve el acorde normalizado. */
export function normalizeVoicing(chord: VoiceLeadingChord): VoiceLeadingChord {
  return { label: chord.label, midis: [...chord.midis].sort((a, b) => a - b) }
}

/**
 * Propone un voicing para `next` que no forme paralelas con `previous`.
 * Devuelve el original si no hay alternativa mejor.
 */
export function suggestVoicing(
  previous: VoiceLeadingChord,
  next: VoiceLeadingChord,
  options: VoiceLeadingOptions = {},
): VoiceLeadingChord {
  const minMidi = options.minMidi ?? 48
  const maxMidi = options.maxMidi ?? 96
  const keepBass = options.keepBass ?? false
  const limit = options.maxCandidates ?? 512

  const original = [...next.midis].sort((a, b) => a - b)
  const candidates = candidateVoicings(
    original,
    Math.max(minMidi, Math.min(...original) - 12),
    Math.min(maxMidi, Math.max(...original) + 12),
    limit,
  )

  let best: number[] | null = null
  let bestScore: [number, number, number] | null = null

  for (const candidate of candidates) {
    if (keepBass && candidate[0] !== original[0]) continue
    const voiced: VoiceLeadingChord = { label: next.label, midis: candidate }
    const issues = voiceLeadingIssues(previous, voiced)
    const candidateScore: [number, number, number] = [
      issues.length,
      movement(previous.midis, candidate),
      registerChange(original, candidate),
    ]
    if (
      bestScore === null ||
      candidateScore[0] < bestScore[0] ||
      (candidateScore[0] === bestScore[0] &&
        (candidateScore[1] < bestScore[1] ||
          (candidateScore[1] === bestScore[1] &&
            candidateScore[2] < bestScore[2])))
    ) {
      best = candidate
      bestScore = candidateScore
    }
  }

  if (best === null) return { label: next.label, midis: original }
  return { label: next.label, midis: best }
}

/**
 * Analiza una progresión completa y propone una conducción corregida. El
 * primer acorde se mantiene como ancla y cada acorde siguiente se elige
 * respecto del anterior ya corregido, para que las correcciones encadenen.
 */
export function analyzeVoiceLeading(
  chords: readonly VoiceLeadingChord[],
  options: VoiceLeadingOptions = {},
): VoiceLeadingAnalysis {
  const normalized = chords.map(normalizeVoicing)
  const issues: VoiceLeadingIssue[] = []
  for (let index = 1; index < normalized.length; index += 1) {
    issues.push(...voiceLeadingIssues(normalized[index - 1], normalized[index], index - 1))
  }

  const suggestions: VoiceLeadingChord[] = []
  const changed: number[] = []
  normalized.forEach((chord, index) => {
    if (index === 0) {
      suggestions.push(chord)
      return
    }
    const previous = suggestions[index - 1]
    const suggested = suggestVoicing(previous, chord, options)
    suggestions.push(suggested)
    if (suggested.midis.some((midi, voice) => midi !== chord.midis[voice])) {
      changed.push(index)
    }
  })

  return { chords: normalized, issues, suggestions, changed }
}

/** Comprueba que un voicing conserve las clases de altura del original. */
export function preservesPitchClasses(
  candidate: readonly number[],
  original: readonly number[],
): boolean {
  return samePitchClasses(candidate, original)
}
