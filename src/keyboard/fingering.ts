export type Hand = 'left' | 'right'

export interface FingerAssignment {
  /** Nota a la que aplica la digitación. */
  midi: number
  /** Número de dedo de la mano: 1 pulgar, 2 índice, 3 medio, 4 anular, 5 meñique. */
  finger: number
  hand: Hand
}

export type FingeringMode = 'note' | 'scale' | 'interval' | 'chord'

export interface FingeringOptions {
  mode: FingeringMode
  hand?: Hand
  /** Intervalo a transcribir para `mode === 'interval'`. */
  intervalNumber?: number
}

const SCALE_PATTERNS: Record<Hand, readonly number[]> = {
  right: [1, 2, 3, 4, 5, 4, 3, 2],
  left: [5, 4, 3, 2, 1, 3, 2, 1],
}

const CHORD_PATTERNS: Record<Hand, Record<number, readonly number[]>> = {
  right: {
    2: [1, 3],
    3: [1, 3, 5],
    4: [1, 2, 3, 5],
    5: [1, 2, 3, 4, 5],
  },
  left: {
    2: [5, 3],
    3: [5, 3, 1],
    4: [5, 3, 2, 1],
    5: [5, 4, 3, 2, 1],
  },
}

const INTERVAL_FINGERS: Record<number, [number, number]> = {
  1: [1, 1],
  2: [1, 2],
  3: [1, 3],
  4: [1, 4],
  5: [1, 5],
  6: [1, 3],
  7: [1, 4],
  8: [1, 5],
}

function mirrorPair(pair: readonly [number, number]): readonly [number, number] {
  const [lower, upper] = pair
  const mirroredLower = 6 - lower
  const mirroredUpper = 6 - upper
  return [mirroredLower, mirroredUpper]
}

const HAND_PATTERNS: ReadonlyArray<readonly [RegExp, Hand]> = [
  [/\bmano\s+(?:derecha|dcha)\b|\bright\s+hand\b|\bMD\b/i, 'right'],
  [/\bmano\s+(?:izquierda|izq)\b|\bleft\s+hand\b|\bMI\b/i, 'left'],
]

function handFromText(text: string): Hand {
  for (const [pattern, hand] of HAND_PATTERNS) {
    if (pattern.test(text)) return hand
  }
  return 'right'
}

/**
 * Extrae una secuencia de dedos de un texto libre como «1 - 2 - 3 (mano
 * derecha)». Solo considera dígitos aislados del 1 al 5 para no confundirlos
 * con octavas u otros números del texto.
 */
export function fingerSequenceFromText(text: string): number[] {
  const fingers: number[] = []
  for (const match of text.matchAll(/(?<![\d.])([1-5])(?![\d.])/g)) {
    fingers.push(Number(match[1]))
  }
  return fingers
}

/**
 * Construye la digitación por tecla a partir del texto de la tarea y de las
 * notas en orden. Si el texto no trae dedos suficientes, se completa con el
 * patrón de escala de la mano indicada.
 */
export function fingeringFromText(
  midis: readonly number[],
  text: string | undefined,
  fallbackHand: Hand = 'right',
): FingerAssignment[] {
  if (midis.length === 0) return []
  const hand = text === undefined ? fallbackHand : handFromText(text)
  const fingers = text === undefined ? [] : fingerSequenceFromText(text)
  // Solo se usa la secuencia escrita cuando cubre exactamente las teclas de la
  // tarea. Los textos de acordes y piezas mezclan varias posiciones y manos, y
  // asignarlos por posición mostraría dedos equivocados.
  if (fingers.length === midis.length) {
    return midis.map((midi, index) => ({ midi, finger: fingers[index], hand }))
  }
  return fingeringFor(midis, { mode: 'scale', hand })
}

/**
 * Asigna dedos a las notas de una melodía corta según el modo:
 * - escala: patrón de dedos por grado de la escala en una mano.
 * - acorde: patrón por cantidad de notas (triada, tetragrecana, pentagrecana).
 * - intervalo: dedos que representan el intervalo desde la primera nota.
 * - nota: un solo dedo.
 */
export function fingeringFor(midis: readonly number[], options: FingeringOptions): FingerAssignment[] {
  const hand: Hand = options.hand ?? 'right'
  const assignments: FingerAssignment[] = []

  if (options.mode === 'note') {
    assignments.push({ midi: midis[0] ?? 0, finger: hand === 'right' ? 1 : 5, hand })
    return assignments
  }

  if (options.mode === 'scale') {
    const pattern = SCALE_PATTERNS[hand]
    for (let index = 0; index < midis.length; index += 1) {
      assignments.push({ midi: midis[index], finger: pattern[index % pattern.length], hand })
    }
    return assignments
  }

  if (options.mode === 'interval') {
    const intervalNumber = options.intervalNumber ?? 5
    const [lower, upper] = INTERVAL_FINGERS[intervalNumber] ?? INTERVAL_FINGERS[5]
    assignments.push({
      midi: midis[0] ?? 0,
      finger: hand === 'right' ? lower : mirrorPair([lower, upper])[0],
      hand,
    })
    assignments.push({
      midi: midis[1] ?? midis[0] ?? 0,
      finger: hand === 'right' ? upper : mirrorPair([lower, upper])[1],
      hand,
    })
    return assignments
  }

  if (options.mode === 'chord') {
    const fingers = CHORD_PATTERNS[hand][Math.max(2, Math.min(5, midis.length))]
    for (let index = 0; index < midis.length; index += 1) {
      assignments.push({ midi: midis[index], finger: fingers[index] ?? fingers[fingers.length - 1], hand })
    }
    return assignments
  }

  throw new Error(`Modo de digitacion invalido: ${options.mode}`)
}
