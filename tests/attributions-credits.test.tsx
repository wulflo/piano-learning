import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import manifest from '../assets/audio/manifest.json'
import { App } from '../src/App'
import { ATTRIBUTIONS_HASH, REPERTOIRE_HASH } from '../src/router/hash-route'

describe('F6-019 — Atribuciones visibles', () => {
  afterEach(() => {
    window.location.hash = ''
  })

  it('genera los créditos de audio desde el manifiesto', async () => {
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

    const sample = manifest.samples[0]
    expect(screen.getByText(sample.author)).toBeInTheDocument()
    expect(
      screen.getByText(sample.source, { exact: false }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(sample.modifications, { exact: false }),
    ).toBeInTheDocument()

    const license = screen.getByRole('link', { name: sample.license })
    expect(license).toHaveAttribute('href', sample.licenseUrl)

    const origin = screen.getByRole('link', {
      name: 'Fuente original de las muestras',
    })
    expect(origin).toHaveAttribute('href', manifest.originUrl)
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
