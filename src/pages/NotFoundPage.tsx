import { COURSE_HASH } from '../router/hash-route'
import { useSettings } from '../state/settings'

export interface NotFoundPageProps {
  path: string
}

/** Página para hashes que no corresponden a ninguna ruta conocida. */
export function NotFoundPage({ path }: NotFoundPageProps) {
  const { t } = useSettings()

  return (
    <main className="page" aria-labelledby="not-found-title">
      <section className="hero">
        <p className="eyebrow">{t('notFound.eyebrow')}</p>
        <h1 id="not-found-title">{t('notFound.title')}</h1>
        <p className="lede">{t('notFound.lead')}</p>
        <p className="muted">
          {t('notFound.path')} <code>{path}</code>
        </p>
      </section>

      <p className="page-actions">
        <a href={COURSE_HASH}>{t('notFound.back')}</a>
      </p>
    </main>
  )
}
