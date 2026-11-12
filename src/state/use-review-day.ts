import { useCallback, useEffect, useState } from 'react'
import { findCourseLesson } from '../content/course'
import { CONTENT_SKILLS } from '../content/skills'
import {
  buildReviewDay,
  dailyReviewSeed,
  reviewableSkills,
  type ReviewDay,
} from './review-day'
import type { CourseSummary } from './course-progress'
import { useProgress } from './progress-context'
import { useSettings } from './settings'
import { useCourseProgress } from './use-course-progress'

/**
 * Datos de la pantalla «Repaso de hoy» con el progreso guardado.
 *
 * Primero espera a que el curso calcule qué lecciones están disponibles o
 * empezadas; después lee las tarjetas y el historial de la base. Las
 * habilidades solo entran al repaso si pertenecen a una lección empezada o si
 * ya tienen tarjeta. El estado se conserva mientras se recarga para que marcar
 * una lección no haga parpadear la cola.
 */

export type ReviewDayStatus = 'loading' | 'ready' | 'error'

export interface ReviewDayState {
  status: ReviewDayStatus
  day: ReviewDay | null
  error: Error | null
  reload: () => void
}

function toError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value))
}

function encounteredSkillIds(summary: CourseSummary): Set<string> {
  const ids = new Set<string>()

  for (const module of summary.modules) {
    for (const lesson of module.lessons) {
      if (lesson.status !== 'in-progress' && lesson.status !== 'completed') {
        continue
      }
      const indexLesson = findCourseLesson(lesson.id)
      if (indexLesson === undefined) continue
      for (const skillId of indexLesson.skillIds) {
        ids.add(skillId)
      }
    }
  }

  return ids
}

export function useReviewDay(): ReviewDayState {
  const { repositories } = useProgress()
  const course = useCourseProgress()
  const { settings } = useSettings()
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<Omit<ReviewDayState, 'reload'>>({
    status: 'loading',
    day: null,
    error: null,
  })

  const courseStatus = course.status
  const summary = course.summary
  const courseReload = course.reload
  const newPerDay = settings.newPerDay

  useEffect(() => {
    if (courseStatus === 'loading') {
      setState({ status: 'loading', day: null, error: null })
      return
    }
    if (courseStatus === 'error') {
      setState({ status: 'error', day: null, error: course.error })
      return
    }
    if (repositories === null || summary === null) return

    let cancelled = false
    setState((current) =>
      current.day === null
        ? { status: 'loading', day: null, error: null }
        : { ...current, status: 'ready', error: null },
    )

    Promise.all([repositories.skills.all(), repositories.reviews.all()]).then(
      ([progress, logs]) => {
        if (cancelled) return

        const skills = reviewableSkills(
          CONTENT_SKILLS,
          encounteredSkillIds(summary),
          progress,
        )
        const now = new Date()

        setState({
          status: 'ready',
          day: buildReviewDay(skills, progress, logs, {
            now,
            newPerDay,
            seed: dailyReviewSeed(now),
          }),
          error: null,
        })
      },
      (error: unknown) => {
        if (cancelled) return
        setState({ status: 'error', day: null, error: toError(error) })
      },
    )

    return () => {
      cancelled = true
    }
  }, [attempt, courseStatus, course.error, newPerDay, repositories, summary])

  const reload = useCallback(() => {
    if (courseStatus === 'error') courseReload()
    setAttempt((current) => current + 1)
  }, [courseReload, courseStatus])

  return { ...state, reload }
}
