import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MidiSupportNotice } from '../src/components/MidiSupportNotice'
import { DEFAULT_SETTINGS, SettingsProvider } from '../src/state/settings'

describe('F6-010 — Aviso de soporte MIDI', () => {
  it('avisa cuando el navegador no admite Web MIDI', async () => {
    render(
      <SettingsProvider initialSettings={DEFAULT_SETTINGS}>
        <MidiSupportNotice />
      </SettingsProvider>,
    )

    const notice = await screen.findByRole('status')
    expect(notice).toHaveTextContent(/no admite Web MIDI/)
    expect(notice).toHaveTextContent(/autoevaluación manual/)
  })

  it('no bloquea la página de ajustes', async () => {
    render(
      <SettingsProvider initialSettings={DEFAULT_SETTINGS}>
        <MidiSupportNotice />
      </SettingsProvider>,
    )
    expect(await screen.findByRole('status')).toBeInTheDocument()
  })
})
