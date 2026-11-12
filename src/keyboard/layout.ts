import { pitchFromMidi, type Pitch } from '../theory/pitch'

export const BLACK_PITCH_CLASSES = new Set([1, 3, 6, 8, 10])
export const DEFAULT_START_MIDI = 48 // C3
export const DEFAULT_OCTAVES = 3

/** Posición relativa del centro de una tecla negra dentro del teclado blanco. */
export const BLACK_KEY_OFFSET = 0.63
export const BLACK_KEY_WIDTH = 0.6

/**
 * Mapa por defecto de la fila A-L (blancas desde Do4) y W-P (negras desde
 * Do♯4). Los valores son MIDI absolutos para que el teclado pueda cambiar de
 * rango sin romper el mapa.
 */
export const DEFAULT_COMPUTER_KEY_MAP: Record<string, number> = {
  a: 60,
  s: 62,
  d: 64,
  f: 65,
  g: 67,
  h: 69,
  j: 71,
  k: 72,
  l: 74,
  w: 61,
  e: 63,
  r: 66,
  t: 68,
  y: 70,
  u: 73,
  i: 75,
  o: 78,
  p: 80,
}

export interface KeyboardKey {
  midi: number
  pitch: Pitch
  isBlack: boolean
  /** Índice de la tecla blanca (para negras: la blanca inmediatamente a la izquierda). */
  whiteIndex: number
  /** Solo en negras: desplazamiento fraccional desde la blanca izquierda. */
  blackOffset?: number
}

export function isBlackMidi(midi: number): boolean {
  return BLACK_PITCH_CLASSES.has(((midi % 12) + 12) % 12)
}

/**
 * Construye el layout de un teclado de `octaves` octavas comenzando en
 * `startMidi`. Incluye las teclas negras que caen dentro del rango.
 */
export function buildKeyboardLayout(
  startMidi = DEFAULT_START_MIDI,
  octaves = DEFAULT_OCTAVES,
): KeyboardKey[] {
  if (!Number.isInteger(startMidi) || startMidi < 0 || startMidi > 127) {
    throw new Error(`MIDI inicial inválido: ${startMidi}`)
  }
  if (!Number.isInteger(octaves) || octaves < 1 || octaves > 7) {
    throw new Error(`Cantidad de octavas inválida: ${octaves}`)
  }
  const endMidi = startMidi + octaves * 12 - 1
  if (endMidi > 127) {
    throw new Error(`El teclado excede MIDI 127: ${endMidi}`)
  }

  const keys: KeyboardKey[] = []
  let whiteIndex = -1
  for (let midi = startMidi; midi <= endMidi; midi += 1) {
    const isBlack = isBlackMidi(midi)
    if (!isBlack) whiteIndex += 1
    keys.push({
      midi,
      pitch: pitchFromMidi(midi),
      isBlack,
      whiteIndex: isBlack ? Math.max(0, whiteIndex) : whiteIndex,
      blackOffset: isBlack ? BLACK_KEY_OFFSET : undefined,
    })
  }
  return keys
}

export function whiteKeyCount(keys: KeyboardKey[]): number {
  return keys.filter((key) => !key.isBlack).length
}

/** Teclas blancas ordenadas de izquierda a derecha. */
export function whiteKeys(keys: KeyboardKey[]): KeyboardKey[] {
  return keys.filter((key) => !key.isBlack)
}
