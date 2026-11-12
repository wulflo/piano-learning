/**
 * Normalización de mensajes MIDI de dispositivos comunes.
 *
 * Web MIDI entrega los bytes crudos de cada mensaje. Algunos teclados
 * (Yamaha PSR-373 y similares) envían además mensajes de sistema y de tiempo
 * real (clock, start/stop, active sensing) que no son notas. Este módulo
 * filtra esos mensajes, tolera canales distintos y detecta el perfil del
 * dispositivo por su nombre para documentar el soporte.
 */

export type MidiDeviceProfile = 'yamaha-psr-373' | 'generic'

export interface MidiNoteMessage {
  note: number
  velocity: number
  channel: number
}

const DEVICE_PATTERNS: Array<{ profile: MidiDeviceProfile; pattern: RegExp }> = [
  { profile: 'yamaha-psr-373', pattern: /psr[\s-]?373/i },
]

/**
 * Detecta el perfil a partir del nombre que expone Web MIDI. Si no coincide
 * con ningún perfil conocido se usa `generic`.
 */
export function detectDeviceProfile(name: string | null | undefined): MidiDeviceProfile {
  if (!name) return 'generic'
  for (const { profile, pattern } of DEVICE_PATTERNS) {
    if (pattern.test(name)) return profile
  }
  return 'generic'
}

/**
 * Interpreta un mensaje MIDI de 1 a 3 bytes.
 *
 * Devuelve la nota con velocity 0 cuando es un note off (tanto 0x80 como el
 * note on con velocity 0 que usan muchos teclados). Ignora mensajes de
 * sistema (0xF0-0xFF), que incluyen sysex, clock, start/stop y active
 * sensing.
 */
export function parseMidiMessage(
  data: ArrayLike<number> | null | undefined,
): MidiNoteMessage | null {
  if (!data || data.length < 2) return null

  const status = data[0]
  if (status >= 0xf0) return null

  const command = status & 0xf0
  const channel = status & 0x0f
  const note = data[1]
  const velocity = data.length > 2 ? data[2] : 0

  if (note < 0 || note > 127 || velocity < 0 || velocity > 127) return null

  if (command === 0x90) {
    return { note, velocity, channel }
  }
  if (command === 0x80) {
    return { note, velocity: 0, channel }
  }
  return null
}

/** Nombres legibles de las notas MIDI 0-127 (Do central = C4 = 60). */
const NOTE_NAMES = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
] as const

export function midiNoteName(note: number): string {
  if (note < 0 || note > 127) return ''
  const octave = Math.floor(note / 12) - 1
  return `${NOTE_NAMES[note % 12]}${octave}`
}
