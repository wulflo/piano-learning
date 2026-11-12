import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Staff } from '../src/components/Staff'
import { MidiProvider, useMidi } from '../src/midi/context'
import { DEFAULT_SETTINGS, SettingsProvider } from '../src/state/settings'
import { parsePitch } from '../src/theory/pitch'
import {
  installFakeMidi,
  NOTE_OFF,
  NOTE_ON,
  type FakeMidi,
} from './helpers/fake-midi'

const renderMocks = vi.hoisted(() => ({
  renderStaff: vi.fn(async () => []),
}))

vi.mock('../src/staff/render', () => ({
  renderStaff: renderMocks.renderStaff,
  describeStaffNotes: () => 'C4',
}))

let fake: FakeMidi

beforeEach(() => {
  fake = installFakeMidi()
  renderMocks.renderStaff.mockClear()
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

const measures = [
  { id: 'm1', pitches: [parsePitch('C4')], duration: 'q' as const },
]

describe('F6-033 — pentagrama y MIDI', () => {
  it('pasa las notas del dispositivo al render del pentagrama', async () => {
    render(
      <SettingsProvider initialSettings={DEFAULT_SETTINGS}>
        <MidiProvider>
          <ConnectButton />
          <Staff measures={measures} />
        </MidiProvider>
      </SettingsProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'conectar' }))
    await waitFor(() =>
      expect(fake.inputs.get('in-1')?.onmidimessage).not.toBeNull(),
    )

    act(() => fake.inputs.get('in-1')?.emit([NOTE_ON, 60, 100], 1000))
    await waitFor(() =>
      expect(renderMocks.renderStaff).toHaveBeenLastCalledWith(
        expect.anything(),
        expect.objectContaining({ activeNotes: expect.arrayContaining([60]) }),
      ),
    )

    act(() => fake.inputs.get('in-1')?.emit([NOTE_OFF, 60, 0], 1100))
    await waitFor(() =>
      expect(renderMocks.renderStaff).toHaveBeenLastCalledWith(
        expect.anything(),
        expect.objectContaining({ activeNotes: [] }),
      ),
    )
  })
})
