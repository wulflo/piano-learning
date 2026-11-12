import { useEffect, useRef, useState, type ReactNode } from 'react'
import { LessonPlayer } from '../components/LessonPlayer'
import { TeacherNotice } from '../components/TeacherNotice'
import { COURSE_LESSONS, COURSE_LESSON_GRAPH, findCourseLesson } from '../content/course'
import { lessonObjectives, type Locale } from '../content/localize'
import { loadLesson } from '../content/lessons'
import { COURSE_HASH, REVIEW_HASH, lessonHash } from '../router/hash-route'
import type { Lesson } from '../schemas'
import type { CourseLessonSummary, CourseSummary } from '../state/course-progress'
import {
  completeLesson,
  startLesson,
  type LessonUnlockStatus,
} from '../state/lesson-progress'
import { useProgress } from '../state/progress-context'
import { useSettings } from '../state/settings'
import { useCourseProgress } from '../state/use-course-progress'

/**
 * Reproductor de una lección.
 *
 * Resuelve el acceso (bloqueo por prerrequisitos), carga el JSON completo bajo
 * demanda, muestra el contenido con audio y pentagrama, permite marcar la
 * lección como completada y enlaza con la anterior y la siguiente.
 */

export interface LessonPageProps {
  lessonId: string
}

type ContentState =
  | { status: 'loading' }
  | { status: 'ready'; lesson: Lesson }
  | { status: 'error'; error: Error }

function toError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value))
}

function findLessonSummary(
  summary: CourseSummary | null,
  lessonId: string,
): CourseLessonSummary | undefined {
  if (summary === null) return undefined
  for (const module of summary.modules) {
    const lesson = module.lessons.find((candidate) => candidate.id === lessonId)
    if (lesson !== undefined) return lesson
  }
  return undefined
}

export function LessonPage({ lessonId }: LessonPageProps) {
  const { settings, t } = useSettings()
  const locale: Locale = settings.language
  const english = locale === 'en'
  const { repositories } = useProgress()
  const course = useCourseProgress()
  const courseReload = course.reload
  const [request, setRequest] = useState(0)
  const [content, setContent] = useState<ContentState>({ status: 'loading' })
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [completedHere, setCompletedHere] = useState(false)
  const startedRef = useRef<string | null>(null)
  const startingRef = useRef<Promise<unknown> | null>(null)

  const indexLesson = findCourseLesson(lessonId)
  const summary = findLessonSummary(course.summary, lessonId)
  const unlockStatus: LessonUnlockStatus = summary?.status ?? 'locked'
  const completed = completedHere || unlockStatus === 'completed'

  const position = COURSE_LESSONS.findIndex((lesson) => lesson.id === lessonId)
  const previous = position > 0 ? COURSE_LESSONS[position - 1] : undefined
  const next =
    position >= 0 && position < COURSE_LESSONS.length - 1
      ? COURSE_LESSONS[position + 1]
      : undefined
  const nextSummary = findLessonSummary(course.summary, next?.id ?? '')

  useEffect(() => {
    if (indexLesson === undefined) return
    let cancelled = false
    setContent({ status: 'loading' })

    loadLesson(lessonId).then(
      (lesson) => {
        if (!cancelled) setContent({ status: 'ready', lesson })
      },
      (error: unknown) => {
        if (!cancelled) setContent({ status: 'error', error: toError(error) })
      },
    )

    return () => {
      cancelled = true
    }
  }, [indexLesson, lessonId, request])

  // Registrar el inicio una sola vez cuando la lección está disponible.
  useEffect(() => {
    if (repositories === null) return
    if (unlockStatus !== 'available') return
    if (startedRef.current === lessonId) return

    startedRef.current = lessonId
    const starting = startLesson(repositories, COURSE_LESSON_GRAPH, lessonId)
    startingRef.current = starting
    starting.then(
      () => courseReload(),
      () => {
        startedRef.current = null
        startingRef.current = null
      },
    )
  }, [courseReload, lessonId, repositories, unlockStatus])

  if (indexLesson === undefined) {
    return (
      <main className="page" aria-labelledby="lesson-title">
        <section className="hero">
          <p className="eyebrow">{t('lesson.eyebrow')}</p>
          <h1 id="lesson-title">{t('lesson.notFound.title')}</h1>
          <p className="lede">{t('lesson.notFound.body')}</p>
          <p className="muted">
            {t('lesson.notFound.path')} <code>{lessonId}</code>
          </p>
          <p className="page-actions">
            <a href={COURSE_HASH}>{t('lesson.back')}</a>
          </p>
        </section>
      </main>
    )
  }

  const module = indexLesson.moduleId
  const title = english ? indexLesson.titleEn : indexLesson.titleEs

  if (course.status === 'error') {
    return (
      <LessonStatusPage
        title={title}
        body={t('lesson.error', {
          message: course.error?.message ?? '',
        })}
        action={
          <button type="button" className="button-primary" onClick={courseReload}>
            {t('course.retry')}
          </button>
        }
      />
    )
  }

  if (course.status === 'loading') {
    return <LessonStatusPage title={title} body={t('lesson.loading')} pending />
  }

  if (unlockStatus === 'locked') {
    const missing = (summary?.missingPrerequisites ?? []).map(
      (id) => {
        const lesson = findCourseLesson(id)
        return lesson === undefined
          ? id
          : english
            ? lesson.titleEn
            : lesson.titleEs
      },
    )

    return (
      <main className="page" aria-labelledby="lesson-title">
        <section className="hero">
          <p className="eyebrow">{t('lesson.eyebrow')}</p>
          <h1 id="lesson-title">{t('lesson.locked.title')}</h1>
          <p className="lede">{title}</p>
          <p>{t('lesson.locked.body')}</p>
          {missing.length > 0 && (
            <ul>
              {missing.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          )}
          <p className="page-actions">
            <a href={COURSE_HASH}>{t('lesson.locked.course')}</a>
          </p>
        </section>
      </main>
    )
  }

  if (content.status === 'error') {
    return (
      <LessonStatusPage
        title={title}
        body={t('lesson.contentError', { message: content.error.message })}
        action={
          <button
            type="button"
            className="button-primary"
            onClick={() => setRequest((current) => current + 1)}
          >
            {t('lesson.retry')}
          </button>
        }
      />
    )
  }

  if (content.status === 'loading') {
    return <LessonStatusPage title={title} body={t('lesson.loading')} pending />
  }

  const markCompleted = () => {
    if (repositories === null || saving) return

    setSaving(true)
    setActionError(null)

    // Espera el registro de inicio para que su escritura no pise la de
    // completado si el usuario termina la lección apenas se abre.
    const starting = startingRef.current
    const ready =
      starting === null ? Promise.resolve() : starting.then(
        () => undefined,
        () => undefined,
      )

    ready
      .then(() =>
        completeLesson(repositories, COURSE_LESSON_GRAPH, lessonId),
      )
      .then(
        () => {
          setSaving(false)
          setCompletedHere(true)
          courseReload()
        },
        (error: unknown) => {
          setSaving(false)
          setActionError(
            t('lesson.completion.error', { message: toError(error).message }),
          )
        },
      )
  }

  return (
    <main className="page lesson-page" aria-labelledby="lesson-title">
      <nav className="lesson-breadcrumb" aria-label={t('lesson.breadcrumb')}>
        <a href={COURSE_HASH}>{t('nav.course')}</a>
        <span aria-hidden="true"> · </span>
        <span>{t('lesson.module', { module })}</span>
      </nav>

      <header className="lesson-header">
        <p className="eyebrow">{t('lesson.eyebrow')}</p>
        <h1 id="lesson-title">{title}</h1>
        <p className="lede">{english ? indexLesson.summaryEn : indexLesson.summaryEs}</p>
        <p className="lesson-meta">
          {t('lesson.minutes', { minutes: indexLesson.minutes })} ·{' '}
          {t(`course.lesson.status.${completed ? 'completed' : unlockStatus}`)}
        </p>
      </header>

      <section className="panel" aria-labelledby="lesson-objectives-title">
        <h2 id="lesson-objectives-title">{t('lesson.objectives')}</h2>
        <ul>
          {lessonObjectives(content.lesson, locale).map((objective) => (
            <li key={objective}>{objective}</li>
          ))}
        </ul>
      </section>

      <LessonPlayer lesson={content.lesson} />

      {module === 'M0' && <TeacherNotice titleId="lesson-teacher-title" />}

      <section className="panel lesson-completion" aria-labelledby="lesson-completion-title">
        <h2 id="lesson-completion-title">{t('lesson.completion.title')}</h2>
        {completed ? (
          <p role="status">{t('lesson.completion.done')}</p>
        ) : (
          <>
            <p className="muted">{t('lesson.completion.hint')}</p>
            <button
              type="button"
              className="button-primary"
              onClick={markCompleted}
              disabled={saving}
            >
              {saving ? t('lesson.completion.saving') : t('lesson.complete')}
            </button>
          </>
        )}
        {actionError !== null && <p role="alert">{actionError}</p>}
      </section>

      <nav className="panel lesson-nav" aria-labelledby="lesson-nav-title">
        <h2 id="lesson-nav-title">{t('lesson.nav.title')}</h2>
        <ul>
          <li>
            {previous !== undefined ? (
              <a href={lessonHash(previous.id)}>
                ← {t('lesson.nav.previous')}: {english ? previous.titleEn : previous.titleEs}
              </a>
            ) : (
              <span className="muted">{t('lesson.nav.none')}</span>
            )}
          </li>
          <li>
            {next === undefined ? (
              <span className="muted">{t('lesson.nav.none')}</span>
            ) : nextSummary?.status === 'locked' ? (
              <span className="muted">
                {t('lesson.nav.nextLocked')}: {english ? next.titleEn : next.titleEs}
              </span>
            ) : (
              <a href={lessonHash(next.id)}>
                {t('lesson.nav.next')}: {english ? next.titleEn : next.titleEs} →
              </a>
            )}
          </li>
        </ul>
        <p className="page-actions">
          <a href={COURSE_HASH}>{t('lesson.nav.course')}</a>
          <a href={REVIEW_HASH}>{t('lesson.review')}</a>
        </p>
      </nav>
    </main>
  )
}

interface LessonStatusPageProps {
  title: string
  body: string
  action?: ReactNode
  pending?: boolean
}

function LessonStatusPage({ title, body, action, pending }: LessonStatusPageProps) {
  return (
    <main className="page" aria-labelledby="lesson-title">
      <section className="hero">
        <p className="eyebrow">{title}</p>
        <h1 id="lesson-title">{title}</h1>
        <p className="lede" role={pending === true ? 'status' : undefined}>
          {body}
        </p>
        {action !== undefined && <p className="page-actions">{action}</p>}
      </section>
    </main>
  )
}
