import { COURSE_HASH } from '../router/hash-route'
import type { ProgressDashboard } from '../state/progress-dashboard'
import { useProgressDashboard } from '../state/use-progress-dashboard'
import { useSettings } from '../state/settings'

/**
 * Pantalla de estadísticas.
 *
 * Muestra retención, precisión, racha, XP y tiempo a partir del historial y del
 * perfil guardados. Cada bloque tiene su propio estado vacío: no se inventan
 * porcentajes cuando todavía no hay repasos.
 */

function minutes(seconds: number): number {
  return Math.round(seconds / 60)
}

function percent(ratio: number): number {
  return Math.round(ratio * 100)
}

export function ProgressPage() {
  const { t } = useSettings()
  const { status, dashboard, error, reload } = useProgressDashboard()

  return (
    <main className="page progress-page" aria-labelledby="progress-title">
      <section className="hero">
        <p className="eyebrow">{t('progress.eyebrow')}</p>
        <h1 id="progress-title">{t('progress.title')}</h1>
        <p className="lede">{t('progress.lead')}</p>
      </section>

      {status === 'loading' && (
        <p className="muted" role="status">
          {t('progress.loading')}
        </p>
      )}

      {status === 'error' && (
        <div className="error-panel" role="alert">
          <p>{t('progress.error', { message: error?.message ?? '' })}</p>
          <button type="button" className="button-primary" onClick={reload}>
            {t('progress.retry')}
          </button>
        </div>
      )}

      {status === 'ready' && dashboard !== null && (
        <>
          <Summary dashboard={dashboard} />
          <Retention dashboard={dashboard} />
          <Accuracy dashboard={dashboard} />
          <p className="page-actions">
            <a href={COURSE_HASH}>{t('progress.course')}</a>
          </p>
        </>
      )}
    </main>
  )
}

function Summary({ dashboard }: { dashboard: ProgressDashboard }) {
  const { t } = useSettings()

  return (
    <section className="stats-grid" aria-labelledby="stats-summary-title">
      <h2 id="stats-summary-title" className="visually-hidden">
        {t('progress.summary.title')}
      </h2>

      <article className="panel stat-card" aria-labelledby="stats-xp-title">
        <h3 id="stats-xp-title">{t('progress.xp.title')}</h3>
        <p className="stat-value">
          {t('progress.xp.value', {
            level: dashboard.level.level,
            xp: dashboard.level.xp,
          })}
        </p>
        <progress
          className="stat-progress"
          value={dashboard.level.xpIntoLevel}
          max={dashboard.level.nextLevelXp - dashboard.level.currentLevelXp}
          aria-label={t('progress.xp.progressLabel')}
        />
        <p className="muted">
          {t('progress.xp.next', {
            xp: dashboard.level.xpToNextLevel,
            level: dashboard.level.level + 1,
          })}
        </p>
      </article>

      <article className="panel stat-card" aria-labelledby="stats-streak-title">
        <h3 id="stats-streak-title">{t('progress.streak.title')}</h3>
        {dashboard.streak.current === 0 && dashboard.streak.longest === 0 ? (
          <p className="muted">{t('progress.streak.empty')}</p>
        ) : (
          <>
            <p className="stat-value">
              {t('progress.streak.value', { current: dashboard.streak.current })}
            </p>
            <p className="muted">
              {t('progress.streak.longest', { longest: dashboard.streak.longest })}
            </p>
          </>
        )}
      </article>

      <article className="panel stat-card" aria-labelledby="stats-time-title">
        <h3 id="stats-time-title">{t('progress.time.title')}</h3>
        <p className="stat-value">
          {t('progress.time.value', {
            minutes: minutes(dashboard.totalSeconds),
          })}
        </p>
        {dashboard.totalSeconds === 0 ? (
          <p className="muted">{t('progress.time.empty')}</p>
        ) : (
          <p className="muted">
            {t('progress.time.detail', {
              lessons: minutes(dashboard.lessonSeconds),
              practice: minutes(dashboard.practiceSeconds),
            })}
          </p>
        )}
      </article>

      <article className="panel stat-card" aria-labelledby="stats-reviews-title">
        <h3 id="stats-reviews-title">{t('progress.reviews.title')}</h3>
        <p className="stat-value">
          {t('progress.reviews.value', { count: dashboard.totalReviews })}
        </p>
        {dashboard.totalReviews === 0 ? (
          <p className="muted">{t('progress.reviews.empty')}</p>
        ) : (
          <p className="muted">
            {t('progress.reviews.detail', { sessions: dashboard.sessionCount })}
          </p>
        )}
      </article>
    </section>
  )
}

function Retention({ dashboard }: { dashboard: ProgressDashboard }) {
  const { t } = useSettings()
  const recent = dashboard.stats.retention.slice(-7)

  return (
    <section className="panel stats-section" aria-labelledby="stats-retention-title">
      <h2 id="stats-retention-title">{t('progress.retention.title')}</h2>
      {dashboard.scheduledReviewed === 0 ? (
        <p className="muted">{t('progress.retention.empty')}</p>
      ) : (
        <>
          <p className="stat-value">
            {t('progress.retention.value', {
              percent: percent(dashboard.retention),
            })}
          </p>
          <p className="muted">
            {t('progress.retention.detail', {
              recalled: dashboard.scheduledRecalled,
              reviewed: dashboard.scheduledReviewed,
            })}
          </p>

          <h3>{t('progress.retention.recent')}</h3>
          <ul className="stats-list">
            {recent.map((bucket) => (
              <li key={bucket.period}>
                {t('progress.retention.row', {
                  period: bucket.period,
                  percent: percent(bucket.retention),
                  recalled: bucket.recalled,
                  reviewed: bucket.reviewed,
                })}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

function Accuracy({ dashboard }: { dashboard: ProgressDashboard }) {
  const { t } = useSettings()

  return (
    <section className="panel stats-section" aria-labelledby="stats-accuracy-title">
      <h2 id="stats-accuracy-title">{t('progress.accuracy.title')}</h2>
      {dashboard.stats.accuracy.length === 0 ? (
        <p className="muted">{t('progress.accuracy.empty')}</p>
      ) : (
        <ul className="stats-list stats-accuracy">
          {dashboard.stats.accuracy.map((bucket) => (
            <li key={bucket.kind}>
              <span className="stats-label">
                {t(`progress.kind.${bucket.kind}`)}
              </span>{' '}
              <span className="muted">
                {t('progress.accuracy.value', {
                  percent: percent(bucket.accuracy),
                  correct: bucket.correct,
                  reviewed: bucket.reviewed,
                })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
