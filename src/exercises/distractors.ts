import type { ExerciseType } from '../schemas/content'
import { fromSpelledPitch, transposePitch, type Pitch } from '../theory'

export interface DistractorParams {
  answer: string
  type: ExerciseType
  difficulty: number
  count?: number
}

const DIFFICULTY_COUNTS: Record<number, number> = {
  1: 1,
  2: 2,
  3: 3,
}

const NOTE_TOKEN = /^([A-G])(#|b|##|bb)?(-?\d+)$/
const SCALE_NOTE_TOKEN = /^([A-G])(#|b|##|bb)?$/

function pitchFromToken(token: string): Pitch {
  const match = NOTE_TOKEN.exec(token)
  if (!match) {
    throw new Error(`Token de melodía inválido: "${token}"`)
  }
  return fromSpelledPitch({
    step: match[1],
    accidental: match[2] ?? '',
    octave: Number(match[3]),
  })
}

function tokenFromPitch(pitch: Pitch): string {
  const accidental =
    pitch.accidental < 0 ? 'b' : pitch.accidental > 0 ? '#' : ''
  const value = accidental === '#' ? '#' : accidental === 'b' ? 'b' : ''
  const accidentalText = value === '#' ? '#' : value === 'b' ? 'b' : ''
  return `${pitch.step}${accidentalText}${pitch.octave}`
}

/** Distractores por alteración de un grado interno de una escala deletreada. */
function scaleSpellingDistractors(answer: string, count: number): string[] {
  const tokens = answer.split(' ').filter(Boolean)
  const candidates = new Set<string>()
  for (let index = 1; index < tokens.length - 1; index += 1) {
    const token = tokens[index]
    const match = SCALE_NOTE_TOKEN.exec(token)
    if (!match) continue
    const base = match[1]
    const current = match[2] ?? ''
    const alternatives = ['#', 'b', '##', 'bb'].filter((item) => item !== current)
    for (const alternative of alternatives) {
      const copy = [...tokens]
      copy[index] = `${base}${alternative}`
      const candidate = copy.join(' ')
      if (candidate !== answer && !candidates.has(candidate)) candidates.add(candidate)
    }
  }
  return [...candidates].slice(0, count)
}

/** Distractores plausibles de transposición: una melodía con una nota más aguda. */
function transpositionDistractors(answer: string, count: number): string[] {
  const tokens = answer.split(' ').filter(Boolean)
  const candidates = new Set<string>()
  for (const token of tokens) {
    const pitch = pitchFromToken(token)
    const shifted = transposePitch(pitch, 1)
    const candidate = [...tokens.slice(0, tokens.indexOf(token)), tokenFromPitch(shifted), ...tokens.slice(tokens.indexOf(token) + 1)].join(
      ' ',
    )
    if (candidate !== answer && !candidates.has(candidate)) candidates.add(candidate)
  }
  return [...candidates].slice(0, count)
}

/**
 * Genera distractores plausibles para un ejercicio según su tipo. Los
 * distractores se copian del material de respuesta y se modifican sin repetir el
 * propio material ni el anterior.
 */
export function plausibleDistractors(params: DistractorParams): string[] {
  const count = params.count ?? DIFFICULTY_COUNTS[params.difficulty] ?? DIFFICULTY_COUNTS[2]
  const answer = params.answer.trim()
  if (!answer) return []

  if (params.type === 'scale-spelling') {
    return scaleSpellingDistractors(answer, count)
  }
  if (params.type === 'transposition') {
    return transpositionDistractors(answer, count)
  }
  if (params.type === 'key-signature') {
    // La respuesta textual de armaduras ya tiene su lógica en el generador;
    // aquí se exponen distractores cercanos al material correcto.
    const candidates = new Set<string>()
    const signatures = ['1 sostenido', '2 sostenidos', 'Sin alteraciones', '3 bemoles']
    for (const signature of signatures) {
      if (signature !== answer) candidates.add(signature)
    }
    return [...candidates].slice(0, count)
  }
  return []
}
