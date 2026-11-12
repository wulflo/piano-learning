import { findCourseLesson } from '../content/course'
import { StyleMap } from '../components/StyleMap'
import { DEMO_HASH, lessonHash } from '../router/hash-route'
import type { CourseModuleSummary } from '../state/course-progress'
import { useCourseProgress } from '../state/use-course-progress'
import { useSettings } from '../state/settings'

/**
 * Mapa del curso con el progreso guardado.
 *
 * Muestra los nueve módulos en orden, el avance global y cada lección con su
 * estado. Los estados se anuncian con texto, no solo con color, y las lecciones
 * bloqueadas no son enlaces: no se puede prometer una pantalla que todavía no
 * corresponde abrir.
 */
export function CoursePage() {
  const { settings, t } = useSettings()
  const { status, summary, error, reload } = useCourseProgress()
  const english = settings.language === 'en'

  const nextLesson = summary?.nextLessonId
    ? findCourseLesson(summary.nextLessonId)
    : undefined

  return (
    <main className="page" aria-labelledby="course-title">
      <section className="hero">
        <p className="eyebrow">{t('course.eyebrow')}</p>
        <h1 id="course-title">{t('course.title')}</h1>
        <p className="lede">{t('course.lead')}</p>
        <p className="page-actions">
          {nextLesson !== undefined && (
            <a href={lessonHash(nextLesson.id)}>
              {t('course.continue', {
                title: english ? nextLesson.titleEn : nextLesson.titleEs,
              })}
            </a>
          )}
          <a href={DEMO_HASH}>{t('course.demoLink')}</a>
        </p>
      </section>

      <section className="panel course-overview" aria-labelledby="course-overview-title">
        <div className="panel-heading">
          <h2 id="course-overview-title">{t('course.overview.title')}</h2>
          {status === 'ready' && summary !== null && (
            <p className="muted">
              {t('course.overview.count', {
                completed: summary.completedLessons,
                total: summary.totalLessons,
                modules: summary.completedModules,
                totalModules: summary.totalModules,
              })}
            </p>
          )}
        </div>

        {status === 'loading' && (
          <p className="muted" role="status">
            {t('course.loading')}
          </p>
        )}

        {status === 'error' && (
          <div className="error-panel" role="alert">
            <p>{t('course.error', { message: error?.message ?? '' })}</p>
            <button type="button" className="button-primary" onClick={reload}>
              {t('course.retry')}
            </button>
          </div>
        )}

        {status === 'ready' && summary !== null && (
          <>
            {summary.totalLessons > 0 ? (
              <progress
                className="course-progress"
                value={summary.completedLessons}
                max={summary.totalLessons}
                aria-label={t('course.overview.progressLabel')}
              />
            ) : (
              <p className="muted">{t('course.empty')}</p>
            )}
          </>
        )}
      </section>

      <section className="course-map" aria-labelledby="course-map-title">
        <h2 id="course-map-title">{t('course.map.title')}</h2>
        {status === 'ready' && summary !== null ? (
          <ol className="module-list">
            {summary.modules.map((module) => (
              <ModuleCard key={module.id} module={module} english={english} />
            ))}
          </ol>
        ) : status === 'error' ? (
          <p className="muted">{t('course.map.unavailable')}</p>
        ) : (
          <p className="muted">{t('course.map.pending')}</p>
        )}
      </section>
    </main>
  )
}

interface ModuleCardProps {
  module: CourseModuleSummary
  english: boolean
}

function ModuleCard({ module, english }: ModuleCardProps) {
  const { t } = useSettings()
  const title = english ? module.titleEn : module.titleEs
  const summary = english ? module.summaryEn : module.summaryEs
  const headingId = `module-${module.id}-title`

  return (
    <li className={`module-card module-${module.status}`}>
      <section aria-labelledby={headingId}>
        <div className="module-heading">
          <h3 id={headingId}>
            <span className="module-code">{module.id}</span> {title}
          </h3>
          <span className={`status-pill status-${module.status}`}>
            {t(`course.module.status.${module.status}`)}
          </span>
        </div>
        {summary !== '' && <p className="muted">{summary}</p>}

        {module.totalLessons > 0 && (
          <div className="module-progress">
            <progress
              value={module.completedLessons}
              max={module.totalLessons}
              aria-label={t('course.module.progressLabel', { module: title })}
            />
            <span className="muted">
              {t('course.module.count', {
                completed: module.completedLessons,
                total: module.totalLessons,
              })}
            </span>
          </div>
        )}

        {module.lessons.length === 0 ? (
          <p className="muted">{t('course.module.empty')}</p>
        ) : (
          <ul className="lesson-list">
            {module.lessons.map((lesson) => (
              <LessonRow
                key={lesson.id}
                lessonId={lesson.id}
                status={lesson.status}
                missing={lesson.missingPrerequisites.length}
                english={english}
              />
            ))}
          </ul>
        )}

        <StyleMap module={module} english={english} />
      </section>
    </li>
  )
}

interface LessonRowProps {
  lessonId: string
  status: CourseModuleSummary['lessons'][number]['status']
  missing: number
  english: boolean
}

function LessonRow({ lessonId, status, missing, english }: LessonRowProps) {
  const { t } = useSettings()
  const lesson = findCourseLesson(lessonId)
  const title = lesson
    ? english
      ? lesson.titleEn
      : lesson.titleEs
    : lessonId
  const statusLabel = t(`course.lesson.status.${status}`)
  const clickable = status !== 'locked'

  return (
    <li className={`lesson-row lesson-${status}`}>
      {clickable ? (
        <a href={lessonHash(lessonId)}>{title}</a>
      ) : (
        <span className="lesson-title">{title}</span>
      )}
      <span className="lesson-meta">
        {lesson !== undefined && (
          <span className="lesson-minutes">
            {t('course.lesson.minutes', { minutes: lesson.minutes })}
          </span>
        )}
        <span className="lesson-status">
          {statusLabel}
          {lesson?.optional === true
            ? ` · ${t('course.lesson.optional')}`
            : ''}
        </span>
        {missing > 0 && (
          <span className="lesson-missing">
            {t('course.lesson.missing', { count: missing })}
          </span>
        )}
      </span>
    </li>
  )
}
