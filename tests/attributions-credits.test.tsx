import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { App } from '../src/App'
import { ATTRIBUTIONS_HASH, REPERTOIRE_HASH } from '../src/router/hash-route'

describe('F6-019 — Atribuciones visibles', () => {
  afterEach(() => {
    window.location.hash = ''
  })

  it('muestra la atribución de Salamander y el software usado', async () => {
    window.location.hash = ATTRIBUTIONS_HASH
    render(<App databaseName="pdc.test.attributions" />)

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Atribuciones y licencias',
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Muestras de audio y software',
      }),
    ).toBeInTheDocument()
    const lead = screen.getByText(/Las muestras de piano provienen/)
    expect(lead).toHaveTextContent(/Salamander Grand Piano/)
    expect(lead).toHaveTextContent(/CC BY 3\.0/)
    expect(lead).toHaveTextContent(/Tone\.js \(MIT\)/)
    expect(lead).toHaveTextContent(/VexFlow \(MIT\)/)

    const link = screen.getByRole('link', {
      name: 'Sitio de Salamander Grand Piano',
    })
    expect(link).toHaveAttribute(
      'href',
      'https://tonejs.github.io/audio/salamander/',
    )
  })

  it('lista las fichas de licencia de las piezas', async () => {
    window.location.hash = ATTRIBUTIONS_HASH
    render(<App databaseName="pdc.test.attributions.pieces" />)

    expect(
      await screen.findByRole(
        'heading',
        { name: /Minueto en Sol mayor, BWV Anh\. 114/ },
        { timeout: 10000 },
      ),
    ).toBeInTheDocument()
    expect(
      screen.getAllByRole('link', { name: 'Abrir pieza' }).length,
    ).toBeGreaterThan(0)
  })

  it('enlaza a las atribuciones desde el pie', async () => {
    window.location.hash = ''
    render(<App databaseName="pdc.test.attributions.footer" />)

    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument(),
    )

    const link = screen.getByRole('link', { name: 'Créditos y licencias' })
    expect(link).toHaveAttribute('href', ATTRIBUTIONS_HASH)
    expect(link.closest('footer')).not.toBeNull()
  })

  it('vuelve al repertorio desde las atribuciones', async () => {
    window.location.hash = ATTRIBUTIONS_HASH
    render(<App databaseName="pdc.test.attributions.back" />)

    const back = await screen.findByRole('link', {
      name: /Volver al repertorio/,
    })
    expect(back).toHaveAttribute('href', REPERTOIRE_HASH)
  })
})
