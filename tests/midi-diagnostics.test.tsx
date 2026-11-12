import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MidiDiagnostics } from '../src/components/MidiDiagnostics'
import { MidiProvider } from '../src/midi/context'
import { SettingsProvider } from '../src/state/settings'
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

function renderDiagnostics() {
  return render(
    <SettingsProvider>
      <MidiProvider>
        <MidiDiagnostics />
      </MidiProvider>
    </SettingsProvider>,
  )
}

describe('F6-033 — diagnóstico MIDI en Ajustes', () => {
  it('muestra la entrada detectada y el último mensaje recibido', async () => {
    renderDiagnostics()

    fireEvent.click(screen.getByRole('button', { name: 'Conectar entrada MIDI' }))

    await waitFor(() =>
      expect(screen.getByRole('listitem')).toHaveTextContent('Yamaha PSR-373'),
    )
    expect(screen.getByText('conectado')).toBeInTheDocument()

    const input = fake.inputs.get('in-1')
    act(() => input?.emit([NOTE_ON, 60, 96], 1000))

    await waitFor(() => {
      expect(screen.getByText('90 3C 60')).toBeInTheDocument()
    })
    expect(screen.getByText(/nota C4/)).toBeInTheDocument()
  })

  it('mantiene las entradas vacías cuando el navegador no expone puertos', async () => {
    fake.restore()
    fake = installFakeMidi([])
    renderDiagnostics()

    fireEvent.click(screen.getByRole('button', { name: 'Conectar entrada MIDI' }))

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Reintentar conexión' })).toBeInTheDocument(),
    )
    expect(screen.getByText(/No hay entradas/)).toBeInTheDocument()
  })
})
