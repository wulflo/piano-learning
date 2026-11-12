import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AudioEngine, AudioEngineState } from '../src/audio/engine'
import { KeyboardTask } from '../src/components/KeyboardTask'
import { MidiProvider, useMidi } from '../src/midi/context'
import type { KeyboardTask as KeyboardTaskData } from '../src/schemas'
import { DEFAULT_SETTINGS, SettingsProvider } from '../src/state/settings'
import {
  installFakeMidi,
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

function audioState(): AudioEngineState {
  return {
    status: 'idle',
    mode: 'none',
    contextState: 'suspended',
    isPlaying: false,
    isMetronome: false,
    activeNotes: [],
    error: null,
    tempo: 60,
    volumeDb: -8,
  }
}

function stubEngine(): AudioEngine {
  return {
    playTimeline: vi.fn(async () => undefined),
    stop: vi.fn(),
    startMetronome: vi.fn(async () => undefined),
    stopMetronome: vi.fn(),
    noteOn: vi.fn(async () => undefined),
    noteOff: vi.fn(),
  } as unknown as AudioEngine
}

function ConnectButton() {
  const { connect } = useMidi()
  return (
    <button type="button" onClick={() => void connect()}>
      conectar
    </button>
  )
}

const task = {
  titleEs: 'Tres notas',
  instructionsEs: 'Tocá Do, Mi y Sol en orden.',
  keys: [
    { step: 'C', accidental: '', octave: 4 },
    { step: 'E', accidental: '', octave: 4 },
    { step: 'G', accidental: '', octave: 4 },
  ],
  tempoBpm: 60,
  fingeringEs: '1 - 2 - 3 (mano derecha)',
  checklistEs: ['Do', 'Mi', 'Sol'],
} as KeyboardTaskData

async function renderTask() {
  render(
    <SettingsProvider initialSettings={DEFAULT_SETTINGS}>
      <MidiProvider>
        <ConnectButton />
        <KeyboardTask task={task} engine={stubEngine()} audio={audioState()} />
      </MidiProvider>
    </SettingsProvider>,
  )
  fireEvent.click(screen.getByRole('button', { name: 'conectar' }))
  await waitFor(() =>
    expect(fake.inputs.get('in-1')?.onmidimessage).not.toBeNull(),
  )
  await waitFor(() =>
    expect(screen.getByText(/MIDI conectado: Yamaha PSR-373/)).toBeInTheDocument(),
  )
}

describe('F6-033 — tarea de teclado con MIDI', () => {
  it('evalúa en serie un intento perfecto tocado en el dispositivo', async () => {
    await renderTask()
    const input = fake.inputs.get('in-1')
    expect(screen.getByText(/tocá la primera nota para empezar/)).toBeInTheDocument()

    act(() => input?.emit([NOTE_ON, 60, 96], 5000))
    act(() => input?.emit([NOTE_ON, 64, 96], 6000))
    act(() => input?.emit([NOTE_ON, 67, 96], 7000))

    await waitFor(() =>
      expect(
        screen.getByText(/3 de 3 pulsaciones acertadas en la secuencia/),
      ).toBeInTheDocument(),
    )
    expect(screen.getByText(/ritmo 100%/)).toBeInTheDocument()
  })

  it('marca como error las teclas de más entre las notas correctas', async () => {
    await renderTask()
    const input = fake.inputs.get('in-1')

    act(() => input?.emit([NOTE_ON, 60, 96], 1000))
    act(() => input?.emit([NOTE_ON, 61, 96], 1500))
    act(() => input?.emit([NOTE_ON, 64, 96], 2000))
    act(() => input?.emit([NOTE_ON, 67, 96], 3000))

    await waitFor(() =>
      expect(screen.getByText(/1 de más/)).toBeInTheDocument(),
    )
    expect(screen.getByText(/Secuencia con errores/)).toBeInTheDocument()
    expect(screen.getByText(/0 equivocadas/)).toBeInTheDocument()
    expect(
      document.querySelector('.task-midi-feedback.is-error'),
    ).not.toBeNull()
  })

  it('muestra el número de dedo y la mano sobre cada tecla de la tarea', async () => {
    await renderTask()
    const c4 = screen.getByRole('button', {
      name: /C4, tecla blanca.*dedo 1/i,
    })
    const e4 = screen.getByRole('button', {
      name: /E4, tecla blanca.*dedo 2/i,
    })
    expect(c4.querySelector('.key-fingering-hand')).toHaveTextContent('D')
    expect(e4.querySelector('.key-fingering-finger')).toHaveTextContent('2')
  })

  it('permite reiniciar el intento sin desconectar el teclado', async () => {
    await renderTask()
    const input = fake.inputs.get('in-1')

    act(() => input?.emit([NOTE_ON, 60, 96], 1000))
    await waitFor(() =>
      expect(
        screen.getByText(/1 de 3 pulsaciones acertadas en la secuencia/),
      ).toBeInTheDocument(),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Reiniciar intento' }))
    await waitFor(() =>
      expect(
        screen.queryByText(/pulsaciones acertadas en la secuencia/),
      ).not.toBeInTheDocument(),
    )
    expect(screen.getByText(/tocá la primera nota para empezar/)).toBeInTheDocument()
  })
})
