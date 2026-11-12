import { useEffect } from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MidiProvider, useMidi } from '../src/midi/context'
import {
  installFakeMidi,
  NOTE_OFF,
  NOTE_ON,
  type FakeMidi,
} from './helpers/fake-midi'

let fake: FakeMidi

beforeEach(() => {
  fake = installFakeMidi()
})

afterEach(() => {
  fake.restore()
})

function Probe() {
  const midi = useMidi()
  return (
    <div>
      <span data-testid="status">{midi.status}</span>
      <span data-testid="held">{midi.heldNotes.join(',')}</span>
      <span data-testid="devices">
        {midi.devices.map((device) => device.name).join(',')}
      </span>
      <span data-testid="last">
        {midi.lastEvent === null
          ? '-'
          : `${midi.lastEvent.note}:${midi.lastEvent.velocity}`}
      </span>
      <span data-testid="profile">{midi.profile}</span>
      <span data-testid="permission">{midi.permission ?? '-'}</span>
      <span data-testid="outputs">
        {midi.outputs.map((output) => output.name).join(',')}
      </span>
      <span data-testid="raw">
        {midi.lastRaw === null ? '-' : midi.lastRaw.data.join(',')}
      </span>
      <span data-testid="events">{midi.events.length}</span>
      <button type="button" onClick={() => void midi.connect()}>
        conectar
      </button>
      <button type="button" onClick={midi.clearEvents}>
        limpiar
      </button>
    </div>
  )
}

function Subscriber({ received }: { received: number[] }) {
  const { subscribe } = useMidi()
  useEffect(
    () => subscribe((event) => void received.push(event.note)),
    [received, subscribe],
  )
  return null
}

async function connect(): Promise<void> {
  fireEvent.click(screen.getByRole('button', { name: 'conectar' }))
  await waitFor(() =>
    expect(screen.getByTestId('status')).toHaveTextContent('listening'),
  )
}

describe('F6-033 — contexto MIDI compartido', () => {
  it('conecta, enumera el PSR-373 y sigue las notas pulsadas', async () => {
    render(
      <MidiProvider>
        <Probe />
      </MidiProvider>,
    )

    await connect()
    expect(fake.inputs.get('in-1')?.onmidimessage).not.toBeNull()
    // La conexión abre el puerto explícitamente: en algunos navegadores el
    // listener no recibe nada hasta llamar a `open()`.
    expect(fake.inputs.get('in-1')?.openCalls).toBeGreaterThan(0)
    expect(screen.getByTestId('devices')).toHaveTextContent('Yamaha PSR-373')
    expect(screen.getByTestId('profile')).toHaveTextContent('yamaha-psr-373')
    expect(screen.getByTestId('permission')).not.toHaveTextContent('-')

    const input = fake.inputs.get('in-1')
    act(() => input?.emit([NOTE_ON, 60, 96], 1000))
    expect(screen.getByTestId('held')).toHaveTextContent('60')
    expect(screen.getByTestId('last')).toHaveTextContent('60:96')
    expect(screen.getByTestId('raw')).toHaveTextContent('144,60,96')

    act(() => input?.emit([NOTE_ON, 64, 90], 1100))
    expect(screen.getByTestId('held')).toHaveTextContent('60,64')

    act(() => input?.emit([NOTE_OFF, 60, 0], 1200))
    expect(screen.getByTestId('held')).toHaveTextContent('64')

    // Note on con velocity 0 equivale a note off.
    act(() => input?.emit([NOTE_ON, 64, 0], 1300))
    expect(screen.getByTestId('held')).toBeEmptyDOMElement()

    fireEvent.click(screen.getByRole('button', { name: 'limpiar' }))
    expect(screen.getByTestId('last')).toHaveTextContent('-')
  })

  it('entrega todas las pulsaciones al suscriptor aunque events se recorte', async () => {
    const received: number[] = []
    render(
      <MidiProvider>
        <Probe />
        <Subscriber received={received} />
      </MidiProvider>,
    )

    await connect()
    const input = fake.inputs.get('in-1')
    act(() => {
      for (let index = 0; index < 1100; index += 1) {
        input?.emit([NOTE_ON, 60, 80], 1000 + index)
      }
    })

    // `events` conserva las últimas 1024 pulsaciones; el suscriptor, todas.
    expect(screen.getByTestId('events')).toHaveTextContent('1024')
    expect(received).toHaveLength(1100)
    expect(received.at(-1)).toBe(60)
  })

  it('detecta entradas que se conectan después', async () => {
    fake.restore()
    fake = installFakeMidi([])
    render(
      <MidiProvider>
        <Probe />
      </MidiProvider>,
    )

    await connect()
    expect(screen.getByTestId('devices')).toBeEmptyDOMElement()

    fake.addInput('in-2', 'Digital Piano', 'Yamaha')
    act(() => fake.notifyStateChange())
    await waitFor(() =>
      expect(screen.getByTestId('devices')).toHaveTextContent('Digital Piano'),
    )
    expect(fake.inputs.get('in-2')?.onmidimessage).not.toBeNull()
  })

  it('queda en denied si el permiso no se concede', async () => {
    fake.restore()
    Object.defineProperty(navigator, 'requestMIDIAccess', {
      configurable: true,
      writable: true,
      value: async () => {
        throw new Error('denied')
      },
    })
    render(
      <MidiProvider>
        <Probe />
      </MidiProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'conectar' }))
    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('denied'),
    )
  })
})
