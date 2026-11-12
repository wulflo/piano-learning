import { useEffect, useState } from 'react'
import { useAudioEngine } from '../audio/useAudioEngine'
import { LicenseFichePanel } from '../components/LicenseFichePanel'
import { RepertoirePlayer } from '../components/RepertoirePlayer'
import { loadRepertoirePiece } from '../content/repertoire'
import { pickLocalized, type Locale } from '../content/localize'
import {
  ATTRIBUTIONS_HASH,
  REPERTOIRE_HASH,
} from '../router/hash-route'
import type { RepertoirePiece } from '../schemas'
import { useSettings } from '../state/settings'

/**
 * F5-024 — Página de una pieza.
 *
 * Carga el JSON validado por id, reúne el gran pentagrama con el reproductor y
 * muestra la ficha de licencia completa. El motor de audio es local a la página
 * y se libera al desmontar para no dejar notas sonando al navegar.
 */

export interface PiecePageProps {
  pieceId: string
}

type PieceState =
  | { status: 'loading' }
  | { status: 'ready'; piece: RepertoirePiece }
  | { status: 'error'; error: Error }

function toError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value))
}

export function PiecePage({ pieceId }: PiecePageProps) {
  const { settings, t } = useSettings()
  const locale: Locale = settings.language
  const { engine, state: audio } = useAudioEngine()
  const [state, setState] = useState<PieceState>({ status: 'loading' })
  const [request, setRequest] = useState(0)

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading' })
    loadRepertoirePiece(pieceId).then(
      (piece) => {
        if (!cancelled) setState({ status: 'ready', piece })
      },
      (error: unknown) => {
        if (!cancelled) setState({ status: 'error', error: toError(error) })
      },
    )
    return () => {
      cancelled = true
    }
  }, [pieceId, request])

  if (state.status === 'loading') {
    return (
      <main className="page" aria-labelledby="piece-title">
        <section className="hero">
          <p className="eyebrow">{t('repertoire.piece.eyebrow')}</p>
          <h1 id="piece-title">{t('repertoire.piece.loading')}</h1>
        </section>
      </main>
    )
  }

  if (state.status === 'error') {
    return (
      <main className="page" aria-labelledby="piece-title">
        <section className="hero">
          <p className="eyebrow">{t('repertoire.piece.eyebrow')}</p>
          <h1 id="piece-title">{t('repertoire.piece.notFound.title')}</h1>
          <p className="lede">
            {t('repertoire.piece.error', { message: state.error.message })}
          </p>
          <p className="muted">
            {t('repertoire.piece.requested')} <code>{pieceId}</code>
          </p>
          <p className="page-actions">
            <a href={REPERTOIRE_HASH}>{t('repertoire.piece.back')}</a>
            <button
              type="button"
              className="button-primary"
              onClick={() => setRequest((current) => current + 1)}
            >
              {t('repertoire.retry')}
            </button>
          </p>
        </section>
      </main>
    )
  }

  const piece = state.piece
  const notes = pickLocalized(
    locale,
    piece.notesEs ?? '',
    piece.notesEn,
  )
  const fingering = pickLocalized(
    locale,
    piece.fingeringEs ?? '',
    piece.fingeringEn,
  )

  return (
    <main className="page piece-page" aria-labelledby="piece-title">
      <nav className="lesson-breadcrumb" aria-label={t('repertoire.piece.breadcrumb')}>
        <a href={REPERTOIRE_HASH}>{t('nav.repertoire')}</a>
        <span aria-hidden="true"> · </span>
        <span>{t('repertoire.level', { level: piece.level })}</span>
      </nav>

      <header className="hero">
        <p className="eyebrow">{t('repertoire.piece.eyebrow')}</p>
        <h1 id="piece-title">{piece.title}</h1>
        <p className="lede">{piece.composerDisplay}</p>
        <p className="muted">
          {t('repertoire.level', { level: piece.level })}
          {piece.durationSeconds === undefined
            ? null
            : ` · ${t('repertoire.seconds', {
                seconds: Math.round(piece.durationSeconds),
              })}`}
        </p>
      </header>

      {notes.length > 0 ? (
        <section className="panel" aria-labelledby="piece-notes-title">
          <h2 id="piece-notes-title">{t('repertoire.piece.notes')}</h2>
          <p>{notes}</p>
          {fingering.length > 0 ? <p>{fingering}</p> : null}
        </section>
      ) : null}

      <RepertoirePlayer piece={piece} engine={engine} audio={audio} />

      <LicenseFichePanel piece={piece} />

      <p className="page-actions">
        <a href={REPERTOIRE_HASH}>{t('repertoire.piece.back')}</a>
        <a href={ATTRIBUTIONS_HASH}>{t('repertoire.attributions')}</a>
      </p>
    </main>
  )
}
