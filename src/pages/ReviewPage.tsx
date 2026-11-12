import { useEffect, useRef, useState } from 'react'
import { ExerciseSuggestions } from '../components/ExerciseSuggestions'
import { LoadForecastPanel } from '../components/LoadForecastPanel'
import { findCourseLesson } from '../content/course'
import { findContentSkill } from '../content/skills'
import { COURSE_HASH, PROGRESS_HASH, lessonHash } from '../router/hash-route'
import type { DailyQueueEntry } from '../state/daily-queue'
import type { ReviewRating } from '../schemas'
import { useProgress } from '../state/progress-context'
import { useReviewDay } from '../state/use-review-day'
import { useSettings } from '../state/settings'

/**
 * Pantalla «Repaso de hoy».
 *
 * Muestra la cola intercalada de habilidades, el progreso registrado hoy y la
 * previsión de carga de los próximos días. El botón de inicio recorre la cola
 * con enlaces a las lecciones donde se practica cada habilidad.
 *
 * Al calificar un ítem se mide el tiempo desde que apareció, se avanza su
 * tarjeta FSRS y se guardan juntos el resultado y la duración. La cola se
 * refresca al terminar o al salir para reflejar el progreso del día.
 */
export function ReviewPage() {
  const { settings, t } = useSettings()
  const { repositories } = useProgress()
  const { status, day, error, reload } = useReviewDay()
  const [mode, setMode] = useState<'overview' | 'session' | 'done'>('overview')
  const [index, setIndex] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [rated, setRated] = useState(0)
  const [sessionTotal, setSessionTotal] = useState(0)
  const savingRef = useRef(false)
  const english = settings.language === 'en'

  const entries = day?.queue.entries ?? []
  const total = entries.length
  const currentIndex = Math.min(index, Math.max(0, total - 1))
  const current = entries[currentIndex]

  const start = () => {
    setIndex(0)
    setRated(0)
    setSessionTotal(total)
    setSaveError(null)
    setMode('session')
  }

  const finish = () => {
    setMode('done')
    reload()
  }

  const exit = () => {
    setMode('overview')
    reload()
  }

  const rate = async (rating: ReviewRating, durationMs: number) => {
    if (current === undefined || repositories === null || savingRef.current) return

    savingRef.current = true
    setSaving(true)
    setSaveError(null)
    try {
      // FSRS y su scheduler se cargan recién al calificar para no engordar el
      // bundle inicial de la app.
      const [{ recordReview }, { fsrsParamsFromSettings }] = await Promise.all([
        import('../state/practice-log'),
        import('../state/fsrs'),
      ])
      await recordReview(repositories, {
        itemId: current.itemId,
        kind: current.kind,
        rating,
        durationMs,
        fsrsParams: fsrsParamsFromSettings(settings),
      })
      setRated((value) => value + 1)
      if (currentIndex + 1 >= sessionTotal) {
        finish()
      } else {
        setIndex(currentIndex + 1)
      }
    } catch (reason) {
      setSaveError(
        t('review.session.saveError', {
          message: reason instanceof Error ? reason.message : String(reason),
        }),
      )
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  return (
    <main className="page review-page" aria-labelledby="review-title">
      <section className="hero">
        <p className="eyebrow">{t('review.eyebrow')}</p>
        <h1 id="review-title">{t('review.title')}</h1>
        <p className="lede">{t('review.lead')}</p>
      </section>

      {status === 'loading' && (
        <p className="muted" role="status">
          {t('review.loading')}
        </p>
      )}

      {status === 'error' && (
        <div className="error-panel" role="alert">
          <p>{t('review.error', { message: error?.message ?? '' })}</p>
          <button type="button" className="button-primary" onClick={reload}>
            {t('review.retry')}
          </button>
        </div>
      )}

      {status === 'ready' && day !== null && (
        <>
          {mode === 'session' && current !== undefined ? (
            <SessionCard
              entry={current}
              index={currentIndex}
              total={sessionTotal}
              english={english}
              saving={saving}
              error={saveError}
              onRate={rate}
              onExit={exit}
            />
          ) : mode === 'done' ? (
            <section className="panel review-done" aria-labelledby="review-done-title">
              <h2 id="review-done-title">{t('review.session.done.title')}</h2>
              <p>{t('review.session.done.body', { total: sessionTotal })}</p>
              <p className="muted">
                {t('review.session.done.saved', {
                  count: rated,
                  total: sessionTotal,
                })}
              </p>
              <p className="page-actions">
                <button
                  type="button"
                  className="button-primary"
                  onClick={exit}
                >
                  {t('review.session.back')}
                </button>
              </p>
            </section>
          ) : (
            <OverviewCard
              day={day}
              total={total}
              english={english}
              onStart={start}
            />
          )}
        </>
      )}
    </main>
  )
}

interface OverviewCardProps {
  day: NonNullable<ReturnType<typeof useReviewDay>['day']>
  total: number
  english: boolean
  onStart: () => void
}

function OverviewCard({ day, total, english, onStart }: OverviewCardProps) {
  const { t } = useSettings()
  const counts = day.queue.counts

  return (
    <>
      <section className="panel review-overview" aria-labelledby="review-overview-title">
        <div className="panel-heading">
          <h2 id="review-overview-title">{t('review.overview.title')}</h2>
          <p className="muted">
            {t('review.overview.counts', {
              due: counts.due,
              new: counts.new,
              total: counts.total,
            })}
          </p>
        </div>
        <p className="muted">
          {t('review.reviewedToday', { count: day.reviewedToday })}
        </p>
        {total > 0 && (
          <p className="page-actions">
            <button type="button" className="button-primary" onClick={onStart}>
              {t('review.start')}
            </button>
          </p>
        )}
      </section>

      <section className="review-queue-section" aria-labelledby="review-queue-title">
        <h2 id="review-queue-title">{t('review.queue.title')}</h2>
        {total === 0 ? (
          <div className="panel review-empty">
            <h3>{t('review.queue.empty.title')}</h3>
            <p className="muted">{t('review.queue.empty.body')}</p>
            <p className="page-actions">
              <a href={COURSE_HASH}>{t('review.course')}</a>
              <a href={PROGRESS_HASH}>{t('review.progress')}</a>
            </p>
          </div>
        ) : (
          <>
            <p className="muted">{t('review.queue.lead')}</p>
            <ol className="review-queue">
              {day.queue.entries.map((entry) => (
                <QueueRow key={entry.itemId} entry={entry} english={english} />
              ))}
            </ol>
          </>
        )}
      </section>

      <ExerciseSuggestions
        skillIds={day.queue.entries.map((entry) => entry.itemId)}
        perSkill={1}
        maxTotal={5}
        recordAttempts={false}
      />

      <LoadForecastPanel cards={day.cards} candidates={day.candidates} />
    </>
  )
}

interface QueueRowProps {
  entry: DailyQueueEntry
  english: boolean
}

function QueueRow({ entry, english }: QueueRowProps) {
  const { t } = useSettings()
  const skill = findContentSkill(entry.itemId)
  const label = skill === undefined ? entry.itemId : english ? skill.labelEn : skill.labelEs

  return (
    <li className="review-item">
      <span className="review-item-label">{label}</span>
      <span className={`review-item-status review-item-${entry.status}`}>
        {t(`review.queue.status.${entry.status}`)}
      </span>
    </li>
  )
}

interface SessionCardProps {
  entry: DailyQueueEntry
  index: number
  total: number
  english: boolean
  saving: boolean
  error: string | null
  onRate: (rating: ReviewRating, durationMs: number) => void
  onExit: () => void
}

const RATINGS: readonly ReviewRating[] = ['again', 'hard', 'good', 'easy']

/** Reloj monotónico para medir la respuesta; cae a `Date.now` si no existe. */
function nowMs(): number {
  if (
    typeof performance !== 'undefined' &&
    typeof performance.now === 'function'
  ) {
    return performance.now()
  }
  return Date.now()
}

function SessionCard({
  entry,
  index,
  total,
  english,
  saving,
  error,
  onRate,
  onExit,
}: SessionCardProps) {
  const { t } = useSettings()
  const skill = findContentSkill(entry.itemId)
  const label = skill === undefined ? entry.itemId : english ? skill.labelEn : skill.labelEs
  const lessons = (skill?.lessonIds ?? [])
    .map((lessonId) => findCourseLesson(lessonId))
    .filter((lesson) => lesson !== undefined)

  const startedAtRef = useRef(nowMs())
  useEffect(() => {
    startedAtRef.current = nowMs()
  }, [entry.itemId, index])

  const rate = (rating: ReviewRating) => {
    onRate(rating, Math.max(0, Math.round(nowMs() - startedAtRef.current)))
  }

  return (
    <section className="panel review-session" aria-labelledby="review-session-title">
      <div className="panel-heading">
        <h2 id="review-session-title">{t('review.session.title')}</h2>
        <p className="muted">
          {t('review.session.progress', { current: index + 1, total })}
        </p>
      </div>
      <progress
        className="review-session-progress"
        value={index + 1}
        max={total}
        aria-label={t('review.session.progress', {
          current: index + 1,
          total,
        })}
      />

      <h3>{label}</h3>
      <p className="muted">{t('review.session.note')}</p>

      <ExerciseSuggestions
        skillIds={[entry.itemId]}
        perSkill={3}
        maxTotal={3}
        recordAttempts={false}
      />

      <h4>{t('review.session.lessons')}</h4>
      {lessons.length === 0 ? (
        <p className="muted">{t('review.session.noLesson')}</p>
      ) : (
        <ul className="review-session-lessons">
          {lessons.map((lesson) => (
            <li key={lesson.id}>
              <a href={lessonHash(lesson.id)}>
                {english ? lesson.titleEn : lesson.titleEs}
              </a>
            </li>
          ))}
        </ul>
      )}

      <fieldset className="review-assessment">
        <legend>{t('review.session.selfAssessment')}</legend>
        <p className="muted">{t('review.session.selfAssessmentHint')}</p>
        <div className="review-ratings">
          {RATINGS.map((rating) => (
            <button
              key={rating}
              type="button"
              className={`button-secondary review-rating review-rating-${rating}`}
              onClick={() => rate(rating)}
              disabled={saving}
            >
              {t(`review.rating.${rating}`)}
            </button>
          ))}
        </div>
      </fieldset>

      {saving && (
        <p className="muted" role="status" aria-live="polite">
          {t('review.session.saving')}
        </p>
      )}
      {error !== null && (
        <p className="error-panel" role="alert">
          {error}
        </p>
      )}

      <p className="page-actions">
        <button
          type="button"
          className="button-secondary"
          onClick={onExit}
          disabled={saving}
        >
          {t('review.session.exit')}
        </button>
      </p>
    </section>
  )
}
