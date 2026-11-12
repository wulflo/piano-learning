import { useEffect, useState } from 'react'
import { loadAllRepertoirePieces } from '../content/repertoire'
import { licensePresentation } from '../repertoire/license'
import {
  ATTRIBUTIONS_HASH,
  pieceHash,
} from '../router/hash-route'
import type { RepertoirePiece } from '../schemas'
import { useSettings } from '../state/settings'

/**
 * F5-024 — Índice de repertorio.
 *
 * Reúne las piezas publicadas y da acceso a su página de práctica y a la ficha
 * de licencia. El catálogo se carga de forma diferida: cada pieza conserva su
 * chunk y esta pantalla solo pide los JSON cuando se abre.
 */

type CatalogState =
  | { status: 'loading' }
  | { status: 'ready'; pieces: RepertoirePiece[] }
  | { status: 'error'; error: Error }

function toError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value))
}

export function RepertoirePage() {
  const { t } = useSettings()
  const [state, setState] = useState<CatalogState>({ status: 'loading' })
  const [request, setRequest] = useState(0)

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading' })
    loadAllRepertoirePieces().then(
      (pieces) => {
        if (!cancelled) setState({ status: 'ready', pieces })
      },
      (error: unknown) => {
        if (!cancelled) setState({ status: 'error', error: toError(error) })
      },
    )
    return () => {
      cancelled = true
    }
  }, [request])

  return (
    <main className="page repertoire-page" aria-labelledby="repertoire-title">
      <section className="hero">
        <p className="eyebrow">{t('repertoire.eyebrow')}</p>
        <h1 id="repertoire-title">{t('repertoire.title')}</h1>
        <p className="lede">{t('repertoire.lead')}</p>
        <p className="page-actions">
          <a href={ATTRIBUTIONS_HASH}>{t('repertoire.attributions')}</a>
        </p>
      </section>

      {state.status === 'loading' ? (
        <p className="muted" role="status">
          {t('repertoire.loading')}
        </p>
      ) : null}

      {state.status === 'error' ? (
        <>
          <p role="alert">
            {t('repertoire.error', { message: state.error.message })}
          </p>
          <p className="page-actions">
            <button
              type="button"
              className="button-primary"
              onClick={() => setRequest((current) => current + 1)}
            >
              {t('repertoire.retry')}
            </button>
          </p>
        </>
      ) : null}

      {state.status === 'ready' && state.pieces.length === 0 ? (
        <p className="muted">{t('repertoire.empty')}</p>
      ) : null}

      {state.status === 'ready' && state.pieces.length > 0 ? (
        <ul className="repertoire-list">
          {state.pieces.map((piece) => (
            <li key={piece.id} className="panel repertoire-card">
              <p className="eyebrow">
                {t('repertoire.level', { level: piece.level })}
                {' · '}
                {t(licensePresentation(piece.license.license).labelKey)}
              </p>
              <h2>
                <a href={pieceHash(piece.id)}>{piece.title}</a>
              </h2>
              <p className="muted">{piece.composerDisplay}</p>
              <p className="page-actions">
                <a href={pieceHash(piece.id)}>{t('repertoire.open')}</a>
              </p>
            </li>
          ))}
        </ul>
      ) : null}
    </main>
  )
}
