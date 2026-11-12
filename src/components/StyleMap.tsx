import { findCourseLesson } from '../content/course'
import { STYLE_MAP } from '../content/style-map'
import { lessonHash } from '../router/hash-route'
import type { CourseModuleSummary } from '../state/course-progress'
import { useSettings } from '../state/settings'

interface StyleMapProps {
  module: CourseModuleSummary
  english: boolean
}

/**
 * Mapa de estilos de M8.
 *
 * Cierra el módulo opcional con una vista de los cuatro estilos: qué se
 * practica, qué pieza original los acompaña y el enlace a la lección. Las
 * lecciones bloqueadas se anuncian con texto y no se enlazan, igual que en la
 * lista de lecciones: el mapa no promete una pantalla que todavía no toca.
 */
export function StyleMap({ module, english }: StyleMapProps) {
  const { t } = useSettings()

  if (module.id !== 'M8' || module.lessons.length === 0) return null

  const lessonsById = new Map(
    module.lessons.map((lesson) => [lesson.id, lesson] as const),
  )

  return (
    <section className="style-map" aria-labelledby="style-map-title">
      <div className="style-map-heading">
        <h4 id="style-map-title">{t('course.styleMap.title')}</h4>
        <span className="status-pill">{t('course.lesson.optional')}</span>
      </div>
      <p className="style-map-lead">{t('course.styleMap.lead')}</p>

      <ol className="style-map-list">
        {STYLE_MAP.map((entry, index) => {
          const summary = lessonsById.get(entry.lessonId)
          const lesson = findCourseLesson(entry.lessonId)
          const status = summary?.status ?? 'locked'
          const locked = status === 'locked'
          const style = english ? entry.styleEn : entry.styleEs
          const focus = english ? entry.focusEn : entry.focusEs
          const piece = english ? entry.pieceEn : entry.pieceEs
          const pattern = english ? entry.patternEn : entry.patternEs

          return (
            <li
              key={entry.lessonId}
              className={`style-map-entry style-map-${status}`}
            >
              <div className="style-map-entry-heading">
                <h5>
                  <span className="style-map-order">{index + 1}</span> {style}
                </h5>
                <span className={`status-pill status-${status}`}>
                  {t(`course.lesson.status.${status}`)}
                </span>
              </div>
              <p className="style-map-focus">{focus}</p>
              <p className="style-map-piece">
                {t('course.styleMap.piece', { piece: `«${piece}»` })}
              </p>
              <p className="muted style-map-pattern">{pattern}</p>
              {locked ? (
                <p className="style-map-locked">
                  {t('course.styleMap.locked')}
                </p>
              ) : (
                <a href={lessonHash(entry.lessonId)}>
                  {t('course.styleMap.open', { piece: `«${piece}»` })}
                </a>
              )}
              {lesson !== undefined && (
                <p className="muted style-map-minutes">
                  {t('course.lesson.minutes', { minutes: lesson.minutes })}
                </p>
              )}
            </li>
          )
        })}
      </ol>

      <p className="style-map-route">{t('course.styleMap.route')}</p>
    </section>
  )
}
