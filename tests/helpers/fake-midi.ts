import { vi } from 'vitest'

/**
 * Web MIDI simulado para tests: jsdom no implementa `requestMIDIAccess` ni
 * `MIDIMessageEvent`. El helper instala un acceso falso con entradas que se
 * pueden hacer sonar a mano.
 */
export interface FakeMidiInput {
  id: string
  name: string
  manufacturer: string
  state: 'connected' | 'disconnected'
  onmidimessage: ((event: MIDIMessageEvent) => void) | null
  /** Los navegadores reales exponen `open()`; la conexión lo llama. */
  open: () => Promise<MIDIPort>
  /** Veces que la app pidió abrir explícitamente el puerto. */
  openCalls: number
  emit: (data: number[], timeStamp?: number) => void
}

export interface FakeMidi {
  access: MIDIAccess
  inputs: Map<string, FakeMidiInput>
  addInput: (id: string, name: string, manufacturer?: string) => FakeMidiInput
  notifyStateChange: () => void
  restore: () => void
}

export function installFakeMidi(
  initial: Array<{ id: string; name: string; manufacturer?: string }> = [
    { id: 'in-1', name: 'Yamaha PSR-373', manufacturer: 'Yamaha' },
  ],
): FakeMidi {
  const inputs = new Map<string, FakeMidiInput>()

  const createInput = (
    id: string,
    name: string,
    manufacturer = 'Yamaha',
  ): FakeMidiInput => {
    const input: FakeMidiInput = {
      id,
      name,
      manufacturer,
      state: 'connected',
      onmidimessage: null,
      openCalls: 0,
      open() {
        input.openCalls += 1
        return Promise.resolve(input as unknown as MIDIPort)
      },
      emit(data: number[], timeStamp = performance.now()) {
        input.onmidimessage?.({
          data: Uint8Array.from(data),
          timeStamp,
        } as MIDIMessageEvent)
      },
    }
    inputs.set(id, input)
    return input
  }

  for (const item of initial) {
    createInput(item.id, item.name, item.manufacturer)
  }

  const access = {
    inputs,
    outputs: new Map(),
    onstatechange: null as ((event: MIDIConnectionEvent) => void) | null,
  } as unknown as MIDIAccess

  const hadOwn = Object.prototype.hasOwnProperty.call(
    navigator,
    'requestMIDIAccess',
  )
  const previous = (navigator as Navigator & { requestMIDIAccess?: unknown })
    .requestMIDIAccess

  Object.defineProperty(navigator, 'requestMIDIAccess', {
    configurable: true,
    writable: true,
    value: vi.fn(async () => access),
  })

  return {
    access,
    inputs,
    addInput: createInput,
    notifyStateChange: () => access.onstatechange?.({} as MIDIConnectionEvent),
    restore: () => {
      if (hadOwn) {
        Object.defineProperty(navigator, 'requestMIDIAccess', {
          configurable: true,
          writable: true,
          value: previous,
        })
      } else {
        Object.defineProperty(navigator, 'requestMIDIAccess', {
          configurable: true,
          writable: true,
          value: undefined,
        })
      }
    },
  }
}

/** Botón mínimo para abrir la conexión desde un test. */
export const NOTE_ON = 0x90
export const NOTE_OFF = 0x80
