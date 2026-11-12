import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Keyboard } from '../src/components/Keyboard'
import { MidiProvider, useMidi } from '../src/midi/context'
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

function ConnectButton() {
  const { connect } = useMidi()
  return (
    <button type="button" onClick={() => void connect()}>
      conectar
    </button>
  )
}

async function renderKeyboard() {
  render(
    <SettingsProvider initialSettings={DEFAULT_SETTINGS}>
      <MidiProvider>
        <ConnectButton />
        <Keyboard />
      </MidiProvider>
    </SettingsProvider>,
  )
  fireEvent.click(screen.getByRole('button', { name: 'conectar' }))
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'conectar' })).toBeInTheDocument(),
  )
  await waitFor(() =>
    expect(fake.inputs.get('in-1')?.onmidimessage).not.toBeNull(),
  )
}

describe('F6-033 — teclado virtual y MIDI', () => {
  it('ilumina la tecla al recibir un note on del dispositivo', async () => {
    await renderKeyboard()
    const key = document.querySelector('[data-midi="60"]')
    expect(key).toHaveAttribute('aria-pressed', 'false')

    act(() => fake.inputs.get('in-1')?.emit([NOTE_ON, 60, 100], 1000))
    await waitFor(() => expect(key).toHaveAttribute('aria-pressed', 'true'))
    expect(key).toHaveClass('is-pressed')

    // Note on con velocity 0 es un note off en muchos teclados.
    act(() => fake.inputs.get('in-1')?.emit([NOTE_ON, 60, 0], 1100))
    await waitFor(() => expect(key).toHaveAttribute('aria-pressed', 'false'))
  })

  it('mantiene pulsadas varias teclas y respeta las notas negras', async () => {
    await renderKeyboard()
    const c4 = document.querySelector('[data-midi="60"]')
    const cis4 = document.querySelector('[data-midi="61"]')

    act(() => fake.inputs.get('in-1')?.emit([NOTE_ON, 60, 90], 1000))
    act(() => fake.inputs.get('in-1')?.emit([NOTE_ON, 61, 90], 1010))

    await waitFor(() => expect(c4).toHaveAttribute('aria-pressed', 'true'))
    expect(cis4).toHaveAttribute('aria-pressed', 'true')
  })
})
