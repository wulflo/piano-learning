import { useEffect, useState } from 'react'
import { audioCredits, readSampleManifest } from '../audio/sampler'
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
 *
 * F6-041 — Los créditos de audio se derivan de `assets/audio/manifest.json`
 * (autor, origen, licencia y modificaciones), no se escriben a mano.
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
  const audioManifest = readSampleManifest()
  const credits = audioCredits(audioManifest)

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

        {credits.length === 0 ? (
          <p className="muted">{t('attributions.audio.empty')}</p>
        ) : (
          <ul className="credit-list">
            {credits.map((credit, index) => (
              <li key={`${index}-${credit.author}`} className="credit-entry">
                <p className="credit-author">
                  <strong>{credit.author}</strong>
                  {credit.source ? ` — ${credit.source}` : ''}
                </p>
                <p>
                  {t('attributions.audio.license')}:{' '}
                  <a
                    href={credit.licenseUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    {credit.license}
                  </a>
                </p>
                <p>
                  {t('attributions.audio.modifications')}: {credit.modifications}
                </p>
              </li>
            ))}
          </ul>
        )}

        {audioManifest?.originUrl ? (
          <p className="page-actions">
            <a
              href={audioManifest.originUrl}
              target="_blank"
              rel="noreferrer noopener"
            >
              {t('attributions.audio.origin')}
            </a>
          </p>
        ) : null}
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
