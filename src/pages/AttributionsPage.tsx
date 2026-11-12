import { useEffect, useState } from 'react'
import { LicenseFichePanel } from '../components/LicenseFichePanel'
import { loadAllRepertoirePieces } from '../content/repertoire'
import { REPERTOIRE_HASH, pieceHash } from '../router/hash-route'
import type { RepertoirePiece } from '../schemas'
import { useSettings } from '../state/settings'

/**
 * F5-024 — Página de atribuciones.
 *
 * Reúne la ficha de licencia de todas las piezas publicadas para que la
 * atribución exigida por cada licencia quede visible en un único lugar. Cada
 * ficha enlaza con la pieza correspondiente.
 */

type AttributionsState =
  | { status: 'loading' }
  | { status: 'ready'; pieces: RepertoirePiece[] }
  | { status: 'error'; error: Error }

function toError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value))
}

export function AttributionsPage() {
  const { t } = useSettings()
  const [state, setState] = useState<AttributionsState>({ status: 'loading' })
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
    <main className="page attributions-page" aria-labelledby="attributions-title">
      <section className="hero">
        <p className="eyebrow">{t('repertoire.attributions.eyebrow')}</p>
        <h1 id="attributions-title">{t('repertoire.attributions.title')}</h1>
        <p className="lede">{t('repertoire.attributions.lead')}</p>
        <p className="page-actions">
          <a href={REPERTOIRE_HASH}>{t('repertoire.attributions.back')}</a>
        </p>
      </section>

      <section className="panel" aria-labelledby="attributions-audio-title">
        <div className="panel-heading">
          <h2 id="attributions-audio-title">
            {t('attributions.audio.title')}
          </h2>
        </div>
        <p>{t('attributions.audio.lead')}</p>
        <p className="page-actions">
          <a
            href="https://tonejs.github.io/audio/salamander/"
            target="_blank"
            rel="noreferrer noopener"
          >
            {t('attributions.audio.link')}
          </a>
        </p>
        <p>{t('attributions.code')}</p>
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

      {state.status === 'ready'
        ? state.pieces.map((piece) => (
            <LicenseFichePanel
              key={piece.id}
              piece={piece}
              heading={`${piece.title} — ${t('repertoire.license.title')}`}
              pieceHref={pieceHash(piece.id)}
            />
          ))
        : null}
    </main>
  )
}
