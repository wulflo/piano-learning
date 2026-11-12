import { LETTERS, LETTER_SEMITONES, mod12, normalizeAccidental, parsePitch, type Letter } from './pitch'

export type KeyMode = 'major' | 'minor'

export interface KeySignature {
  /** Tónica con su alteración, por ejemplo "Eb". */
  tonic: string
  mode: KeyMode
  /** Positivo = sostenidos; negativo = bemoles; 0 = Do mayor / La menor. */
  count: number
  accidentals: Array<{ step: Letter; accidental: 1 | -1 }>
  /** Relativa mayor (si la tonalidad es menor) o relativa menor (si es mayor). */
  relativeTonic: string
}

const SHARP_ORDER: Letter[] = ['F', 'C', 'G', 'D', 'A', 'E', 'B']
const FLAT_ORDER: Letter[] = ['B', 'E', 'A', 'D', 'G', 'C', 'F']

/** Orden del círculo de quintas, de 7 bemoles a 7 sostenidos. */
export const MAJOR_KEY_BY_COUNT: Record<number, string> = {
  [-7]: 'Cb',
  [-6]: 'Gb',
  [-5]: 'Db',
  [-4]: 'Ab',
  [-3]: 'Eb',
  [-2]: 'Bb',
  [-1]: 'F',
  0: 'C',
  1: 'G',
  2: 'D',
  3: 'A',
  4: 'E',
  5: 'B',
  6: 'F#',
  7: 'C#',
}

const COUNT_BY_MAJOR_KEY = Object.fromEntries(
  Object.entries(MAJOR_KEY_BY_COUNT).map(([count, tonic]) => [tonic, Number(count)]),
) as Record<string, number>

function letterAfter(letter: Letter, steps: number): { letter: Letter; wrapped: boolean } {
  const index = LETTERS.indexOf(letter)
  const next = index + steps
  const wrapped = Math.floor(next / 7) > 0
  return { letter: LETTERS[((next % 7) + 7) % 7], wrapped }
}

/** Relativa menor: sexto grado de la escala mayor (tres semitonos abajo). */
export function relativeMinorOf(tonic: string): string {
  const pitch = parsePitch(`${tonic}4`)
  const { letter } = letterAfter(pitch.step, 5)
  const tonicPc = mod12(LETTER_SEMITONES[pitch.step] + pitch.accidental)
  const targetPc = mod12(tonicPc + 9)
  const accidental = normalizeAccidental(targetPc - LETTER_SEMITONES[letter])
  return `${letter}${accidentalSuffix(accidental)}`
}

/** Relativa mayor: tercer grado de la escala menor (tres semitonos arriba). */
export function relativeMajorOf(tonic: string): string {
  const pitch = parsePitch(`${tonic}4`)
  const { letter } = letterAfter(pitch.step, 2)
  const tonicPc = mod12(LETTER_SEMITONES[pitch.step] + pitch.accidental)
  const targetPc = mod12(tonicPc + 3)
  const accidental = normalizeAccidental(targetPc - LETTER_SEMITONES[letter])
  return `${letter}${accidentalSuffix(accidental)}`
}

function accidentalSuffix(accidental: number): string {
  if (accidental === -2) return 'bb'
  if (accidental === -1) return 'b'
  if (accidental === 1) return '#'
  if (accidental === 2) return '##'
  return ''
}

export function signatureCount(tonic: string, mode: KeyMode): number {
  const majorTonic = mode === 'major' ? tonic : relativeMajorOf(tonic)
  const count = COUNT_BY_MAJOR_KEY[majorTonic]
  if (count === undefined) {
    throw new Error(`Tonalidad no soportada: ${tonic} ${mode}`)
  }
  return count
}

export function keySignature(tonic: string, mode: KeyMode = 'major'): KeySignature {
  const count = signatureCount(tonic, mode)
  const accidentals =
    count >= 0
      ? SHARP_ORDER.slice(0, count).map((step) => ({ step, accidental: 1 as const }))
      : FLAT_ORDER.slice(0, -count).map((step) => ({ step, accidental: -1 as const }))

  return {
    tonic,
    mode,
    count,
    accidentals,
    relativeTonic:
      mode === 'major' ? relativeMinorOf(tonic) : relativeMajorOf(tonic),
  }
}

export function keyForSignature(count: number, mode: KeyMode = 'major'): string {
  const major = MAJOR_KEY_BY_COUNT[count]
  if (!major) {
    throw new Error(`Armadura fuera de rango: ${count}`)
  }
  return mode === 'major' ? major : relativeMinorOf(major)
}

/** Las 15 armaduras mayores, de 7 bemoles a 7 sostenidos. */
export function allMajorKeySignatures(): KeySignature[] {
  return Object.keys(MAJOR_KEY_BY_COUNT)
    .map(Number)
    .sort((a, b) => a - b)
    .map((count) => keySignature(MAJOR_KEY_BY_COUNT[count], 'major'))
}

export function allMinorKeySignatures(): KeySignature[] {
  return allMajorKeySignatures().map((signature) =>
    keySignature(signature.relativeTonic, 'minor'),
  )
}

/** ¿La alteración ya está en la armadura para esa letra? */
export function accidentalInSignature(
  signature: KeySignature,
  step: Letter,
): number {
  return signature.accidentals.find((item) => item.step === step)?.accidental ?? 0
}

/**
 * Ortografía preferida de una clase de altura dentro de una tonalidad.
 * Si la nota pertenece a la escala, usa el grado correspondiente. Si no,
 * elige la letra que requiera la menor alteración en la dirección de la
 * armadura (sostenidos o bemoles).
 */
export function spellPitchClassInKey(
  pitchClassValue: number,
  tonic: string,
  mode: KeyMode = 'major',
): { step: Letter; accidental: number } {
  const signature = keySignature(tonic, mode)
  const scalePcs = scalePitchClasses(tonic, mode)
  const degree = scalePcs.indexOf(mod12(pitchClassValue))
  if (degree >= 0) {
    const tonicPitch = parsePitch(`${tonic}4`)
    const { letter } = letterAfter(tonicPitch.step, degree)
    const natural = LETTER_SEMITONES[letter]
    return { step: letter, accidental: normalizeAccidental(pitchClassValue - natural) }
  }

  const flatPreference = signature.count < 0
  const candidates: Array<{ step: Letter; accidental: number; cost: number }> = []
  for (const letter of LETTERS) {
    let accidental: number
    try {
      accidental = normalizeAccidental(pitchClassValue - LETTER_SEMITONES[letter])
    } catch {
      continue
    }
    const inDirection = flatPreference ? accidental <= 0 : accidental >= 0
    candidates.push({
      step: letter,
      accidental,
      cost: Math.abs(accidental) + (inDirection ? 0 : 0.5),
    })
  }
  candidates.sort((a, b) => a.cost - b.cost)
  const best = candidates[0]
  if (!best) {
    throw new Error(`No se pudo deletrear la clase ${pitchClassValue}`)
  }
  return { step: best.step, accidental: best.accidental }
}

function scalePitchClasses(tonic: string, mode: KeyMode): number[] {
  const tonicPc = pitchClassOfTonic(tonic)
  const pattern =
    mode === 'major' ? [0, 2, 4, 5, 7, 9, 11] : [0, 2, 3, 5, 7, 8, 10]
  return pattern.map((offset) => mod12(tonicPc + offset))
}

function pitchClassOfTonic(tonic: string): number {
  return mod12(LETTER_SEMITONES[parsePitch(`${tonic}4`).step] + parsePitch(`${tonic}4`).accidental)
}

export interface DetectedKey {
  tonic: string
  mode: KeyMode
  count: number
  /** Cuántas notas de la consulta pertenecen a la escala. */
  matches: number
  confidence: number
}

/**
 * Detección simple por conjuntos de clases de altura. Devuelve las tonalidades
 * compatibles ordenadas por confianza. No sustituye a un análisis armónico:
 * es una ayuda pedagógica, no un detector profesional.
 */
export function detectKeysFromNotes(
  notes: Array<{ step: Letter; accidental: number }>,
): DetectedKey[] {
  if (notes.length === 0) return []
  const pcs = [...new Set(notes.map((note) => mod12(LETTER_SEMITONES[note.step] + note.accidental)))]
  const results: DetectedKey[] = []

  for (const mode of ['major', 'minor'] as const) {
    for (const signature of mode === 'major' ? allMajorKeySignatures() : allMinorKeySignatures()) {
      const scale = scalePitchClasses(signature.tonic, mode)
      const matches = pcs.filter((pc) => scale.includes(pc)).length
      if (matches === pcs.length) {
        const tonicPc = pitchClassOfTonic(signature.tonic)
        const tonicBonus = pcs.includes(tonicPc) ? 1 : 0
        results.push({
          tonic: signature.tonic,
          mode,
          count: signature.count,
          matches,
          confidence:
            (matches / pcs.length) * 0.75 +
            tonicBonus * 0.15 +
            (1 - Math.abs(signature.count) / 7) * 0.1,
        })
      }
    }
  }

  return results.sort((a, b) => b.confidence - a.confidence)
}
