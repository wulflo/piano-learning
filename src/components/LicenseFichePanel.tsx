import { ATTRIBUTIONS_HASH } from '../router/hash-route'
import type { RepertoirePiece } from '../schemas'
import { useSettings } from '../state/settings'
import { licensePresentation, licenseYear } from '../repertoire/license'

/**
 * F5-024 — Ficha de licencia de una pieza.
 *
 * Muestra compositor y fechas, fuente, licencia con enlace a sus términos,
 * autor y fecha de la transcripción, atribución visible y verificación. Al pie
 * enlaza con la página completa de atribuciones.
 */

export interface LicenseFichePanelProps {
  piece: RepertoirePiece
  /** Título visible de la ficha; por defecto, «Ficha de licencia». */
  heading?: string
  /** Enlace de vuelta a la pieza, útil en la página de atribuciones. */
  pieceHref?: string
}

export function LicenseFichePanel({
  piece,
  heading,
  pieceHref,
}: LicenseFichePanelProps) {
  const { t } = useSettings()
  const fiche = piece.license
  const license = licensePresentation(fiche.license)
  const unknown = t('repertoire.license.unknown')
  const composer = fiche.composer

  return (
    <section
      className="panel license-fiche"
      aria-labelledby={`license-title-${piece.id}`}
    >
      <h2 id={`license-title-${piece.id}`}>
        {heading ?? t('repertoire.license.title')}
      </h2>

      <dl>
        <div>
          <dt>{t('repertoire.license.composer')}</dt>
          <dd>
            {composer.name}
            {composer.anonymousTraditional ? (
              <span className="muted">
                {' · '}
                {t('repertoire.license.anonymous')}
              </span>
            ) : null}
          </dd>
        </div>
        <div>
          <dt>{t('repertoire.license.born')}</dt>
          <dd>{licenseYear(composer.birthYear, unknown)}</dd>
        </div>
        <div>
          <dt>{t('repertoire.license.died')}</dt>
          <dd>{licenseYear(composer.deathYear, unknown)}</dd>
        </div>
        <div>
          <dt>{t('repertoire.license.license')}</dt>
          <dd>
            {license.url === undefined ? (
              t(license.labelKey)
            ) : (
              <a href={license.url} target="_blank" rel="noreferrer">
                {t(license.labelKey)}
              </a>
            )}
          </dd>
        </div>
        <div>
          <dt>{t('repertoire.license.source')}</dt>
          <dd>
            {fiche.sourceUrl === undefined ? (
              fiche.source
            ) : (
              <a href={fiche.sourceUrl} target="_blank" rel="noreferrer">
                {fiche.source}
              </a>
            )}
          </dd>
        </div>
        <div>
          <dt>{t('repertoire.license.transcription')}</dt>
          <dd>
            {fiche.transcriptionAuthor} · {fiche.transcriptionDate}
          </dd>
        </div>
        <div>
          <dt>{t('repertoire.license.attribution')}</dt>
          <dd>{fiche.attribution}</dd>
        </div>
        <div>
          <dt>{t('repertoire.license.verified')}</dt>
          <dd>
            {fiche.verifiedBy} · {fiche.verifiedOn}
          </dd>
        </div>
        {fiche.notes === undefined ? null : (
          <div>
            <dt>{t('repertoire.license.notes')}</dt>
            <dd>{fiche.notes}</dd>
          </div>
        )}
      </dl>

      <p className="page-actions">
        {pieceHref === undefined ? (
          <a href={ATTRIBUTIONS_HASH}>{t('repertoire.license.attributions')}</a>
        ) : (
          <a href={pieceHref}>{t('repertoire.open')}</a>
        )}
      </p>
    </section>
  )
}
