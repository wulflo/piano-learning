/**
 * Entrada MIDI: escucha note on/off y reenvía a un callback.
 *
 * Sin dispositivo MIDI o sin permiso, la función devuelve null y la app
 * sigue funcionando con autoevaluación manual.
 */
import { requestMidiAccess } from './detect'
import { parseMidiMessage } from './device'

export interface MidiNoteEvent {
  note: number // MIDI 0-127
  velocity: number // 0-127 (0 = note off)
  channel: number
  timestamp: number
}

export type MidiNoteListener = (event: MidiNoteEvent) => void

/** Datos mínimos de un puerto de entrada, para diagnóstico en la UI. */
export interface MidiInputInfo {
  id: string
  name: string
  manufacturer: string
  state: 'connected' | 'disconnected'
}

/** Datos mínimos de un puerto de salida, para diagnóstico en la UI. */
export interface MidiOutputInfo {
  id: string
  name: string
  manufacturer: string
  state: 'connected' | 'disconnected'
}

export interface MidiDeviceSnapshot {
  inputs: MidiInputInfo[]
  outputs: MidiOutputInfo[]
}

/** Mensaje crudo recibido, útil para el diagnóstico de la conexión. */
export interface MidiRawMessage {
  data: number[]
  portId: string
  portName: string
  timestamp: number
}

export interface MidiConnection {
  /** Puertos detectados en el momento de abrir la conexión. */
  inputs: MidiInputInfo[]
  outputs: MidiOutputInfo[]
  /** Cierra la escucha y libera los handlers. */
  disconnect: () => void
}

export interface ConnectMidiOptions {
  /** Se invoca al abrir y en cada cambio de dispositivos conectados. */
  onDevices?: (devices: MidiDeviceSnapshot) => void
  /** Se invoca con cada mensaje de canal, antes de filtrar notas. */
  onRawMessage?: (message: MidiRawMessage) => void
}

function listInputs(access: MIDIAccess): MidiInputInfo[] {
  const inputs: MidiInputInfo[] = []
  for (const input of access.inputs.values()) {
    inputs.push({
      id: input.id,
      name: input.name?.trim() || input.id,
      manufacturer: input.manufacturer?.trim() || '',
      state: input.state === 'connected' ? 'connected' : 'disconnected',
    })
  }
  return inputs
}

function listOutputs(access: MIDIAccess): MidiOutputInfo[] {
  const outputs: MidiOutputInfo[] = []
  for (const output of access.outputs.values()) {
    outputs.push({
      id: output.id,
      name: output.name?.trim() || output.id,
      manufacturer: output.manufacturer?.trim() || '',
      state: output.state === 'connected' ? 'connected' : 'disconnected',
    })
  }
  return outputs
}

function eventTimestamp(event: MIDIMessageEvent): number {
  if (typeof event.timeStamp === 'number' && event.timeStamp > 0) {
    return event.timeStamp
  }
  return typeof performance !== 'undefined' ? performance.now() : 0
}

/**
 * Conecta a todos los inputs MIDI disponibles y reenvía note on/off al
 * listener. Devuelve la conexión (con los nombres de los puertos) o `null` si
 * el navegador no soporta Web MIDI o el usuario niega el permiso.
 */
export async function connectMidiInput(
  listener: MidiNoteListener,
  options: ConnectMidiOptions = {},
): Promise<MidiConnection | null> {
  const access = await requestMidiAccess()
  if (access === null) return null

  const attach = () => {
    for (const input of access.inputs.values()) {
      input.onmidimessage = (event: MIDIMessageEvent) => {
        const data = event.data ? Array.from(event.data) : []
        const timestamp = eventTimestamp(event)
        options.onRawMessage?.({
          data,
          portId: input.id,
          portName: input.name?.trim() || input.id,
          timestamp,
        })
        const message = parseMidiMessage(event.data)
        if (message === null) return
        listener({
          note: message.note,
          velocity: message.velocity,
          channel: message.channel,
          timestamp,
        })
      }
      // Algunos navegadores dejan el puerto cerrado hasta llamar a `open()`,
      // aunque se asigne `onmidimessage`. Abrirlo explícitamente es inocuo y
      // evita que las pulsaciones nunca lleguen.
      if (typeof input.open === 'function') {
        void input.open().catch(() => undefined)
      }
    }
    options.onDevices?.({
      inputs: listInputs(access),
      outputs: listOutputs(access),
    })
  }

  attach()
  access.onstatechange = attach

  return {
    inputs: listInputs(access),
    outputs: listOutputs(access),
    disconnect: () => {
      access.onstatechange = null
      for (const input of access.inputs.values()) {
        input.onmidimessage = null
      }
    },
  }
}
