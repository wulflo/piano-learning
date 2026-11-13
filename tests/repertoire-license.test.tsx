import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LicenseFichePanel } from '../src/components/LicenseFichePanel'
import { loadRepertoirePiece } from '../src/content/repertoire'
import { licensePresentation, licenseYear } from '../src/repertoire/license'
import { ATTRIBUTIONS_HASH } from '../src/router/hash-route'
import { DEFAULT_SETTINGS, SettingsProvider } from '../src/state/settings'

describe('F5-024 — Ficha de licencia', () => {
  it('traduce cada licencia y enlaza sus términos', () => {
    expect(licensePresentation('public-domain')).toEqual({
      labelKey: 'repertoire.license.kind.public-domain',
      url: 'https://creativecommons.org/publicdomain/mark/1.0/',
    })
    expect(licensePresentation('cc0-1.0').url).toBe(
      'https://creativecommons.org/publicdomain/zero/1.0/',
    )
    expect(licensePresentation('cc-by-4.0').labelKey).toBe(
      'repertoire.license.kind.cc-by-4.0',
    )
    expect(licensePresentation('cc-by-sa-4.0').url).toBe(
      'https://creativecommons.org/licenses/by-sa/4.0/',
    )
    expect(licensePresentation('original')).toEqual({
      labelKey: 'repertoire.license.kind.original',
    })
    expect(licenseYear(1770, 'sin dato')).toBe('1770')
    expect(licenseYear(null, 'sin dato')).toBe('sin dato')
  })

  it('muestra compositor, fechas, fuente, licencia, transcripción y verificación', async () => {
    const base = await loadRepertoirePiece('piece.original.do-mayor')
    const piece = {
      ...base,
      title: 'Sonatina de prueba',
      license: {
        ...base.license,
        license: 'public-domain' as const,
        composer: {
          name: 'Ludwig van Beethoven',
          birthYear: 1770,
          deathYear: 1827,
          anonymousTraditional: false,
        },
        source: 'Edición de prueba',
        sourceUrl: 'https://example.org/partitura',
        transcriptionAuthor: 'Transcripción propia',
        transcriptionDate: '2026-11-13',
        attribution: 'Sonatina de prueba — Beethoven (dominio público)',
        verifiedBy: 'Piano Today',
        verifiedOn: '2026-11-13',
      },
    }

    render(
      <SettingsProvider initialSettings={DEFAULT_SETTINGS}>
        <LicenseFichePanel piece={piece} />
      </SettingsProvider>,
    )

    expect(
      screen.getByRole('heading', { name: 'Ficha de licencia' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Ludwig van Beethoven')).toBeInTheDocument()
    expect(screen.getByText('1770')).toBeInTheDocument()
    expect(screen.getByText('1827')).toBeInTheDocument()

    const license = screen.getByRole('link', { name: 'Dominio público' })
    expect(license).toHaveAttribute(
      'href',
      'https://creativecommons.org/publicdomain/mark/1.0/',
    )

    const source = screen.getByRole('link', { name: 'Edición de prueba' })
    expect(source).toHaveAttribute('href', 'https://example.org/partitura')
    expect(
      screen.getByText('Transcripción propia · 2026-11-13'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Sonatina de prueba — Beethoven (dominio público)'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Piano Today · 2026-11-13'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Ver todas las atribuciones' }),
    ).toHaveAttribute('href', ATTRIBUTIONS_HASH)
  })

  it('marca la melodía tradicional anónima y los datos desconocidos', async () => {
    const base = await loadRepertoirePiece('piece.original.do-mayor')
    const piece = {
      ...base,
      license: {
        ...base.license,
        composer: {
          name: 'Anónimo',
          birthYear: null,
          deathYear: null,
          anonymousTraditional: true,
        },
      },
    }

    render(
      <SettingsProvider initialSettings={DEFAULT_SETTINGS}>
        <LicenseFichePanel piece={piece} />
      </SettingsProvider>,
    )

    expect(
      screen.getByText(/melodía tradicional anónima/),
    ).toBeInTheDocument()
    expect(screen.getAllByText('sin dato')).toHaveLength(2)
  })
})
