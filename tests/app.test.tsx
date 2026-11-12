import { render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { App } from '../src/App'
import { DEMO_HASH } from '../src/router/hash-route'

describe('App', () => {
  beforeEach(() => {
    window.location.hash = DEMO_HASH
  })

  afterEach(() => {
    window.location.hash = ''
  })

  it('muestra la demo de Fase 1 con teclado, audio y pentagrama', async () => {
    render(<App />)

    expect(within(screen.getByRole('banner')).getByText(/Piano/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      /Tocá el teclado/i,
    )
    expect(
      within(screen.getByRole('status')).getByText(/El audio está apagado/i),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /tecla (blanca|negra)/i })).toHaveLength(36)
    expect(
      (await screen.findAllByText(/C4 · D4 · E4 · F4 · G4 · A4 · B4/)).length,
    ).toBeGreaterThan(0)
    expect(screen.getByLabelText('Notación')).toBeInTheDocument()
    expect(screen.getByLabelText('Idioma')).toBeInTheDocument()
  })
})
