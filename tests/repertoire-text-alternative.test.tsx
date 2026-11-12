import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { App } from '../src/App'
import { pieceHash } from '../src/router/hash-route'

describe('F6-013 — Alternativas textuales de notación y audio', () => {
  afterEach(() => {
    window.location.hash = ''
  })

  it('describe las notas de cada mano en una pieza', async () => {
    window.location.hash = pieceHash('piece.petzold.minuet-g')
    render(<App databaseName="pdc.text.piece" />)

    await waitFor(() =>
      expect(
        screen.getByRole('heading', {
          level: 1,
          name: 'Minueto en Sol mayor, BWV Anh. 114',
        }),
      ).toBeInTheDocument(),
    )

    const staff = await screen.findByRole('group', {
      name: /Minueto en Sol mayor.*Mano derecha:.*Mano izquierda:/s,
    })
    expect(staff).toBeInTheDocument()

    const text = screen.getByText(/^Notas:/, { selector: '.staff-text-label' })
      .parentElement
    expect(text?.textContent).toMatch(/Mano derecha:/)
    expect(text?.textContent).toMatch(/Mano izquierda:/)
    expect(text?.textContent).toMatch(/[A-G]/)
  })

  it('el reproductor anuncia manos, compases y tempo en texto', async () => {
    window.location.hash = pieceHash('piece.petzold.minuet-g')
    render(<App databaseName="pdc.text.player" />)

    const player = await screen.findByRole('region', {
      name: 'Reproductor de la pieza',
    })
    expect(player).toBeInTheDocument()

    await waitFor(() =>
      expect(
        screen.getByText(/Ambas · compases \d+–\d+ · \d+ BPM \(\d+ %\)/),
      ).toBeInTheDocument(),
    )
  })
})
