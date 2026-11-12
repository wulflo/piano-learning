import { useSettings } from '../state/settings'

/**
 * Aviso honesto sobre aprender sin profesor.
 *
 * Se muestra en las lecciones de M0 y en ajustes. No abre modales ni bloquea
 * ninguna acción: solo recuerda los límites de la app y propone espejo,
 * grabación y una consulta presencial cuando hace falta.
 */

export interface TeacherNoticeProps {
  /** Id del título para que la sección tenga un nombre accesible único. */
  titleId: string
}

export function TeacherNotice({ titleId }: TeacherNoticeProps) {
  const { t } = useSettings()

  return (
    <section className="panel teacher-notice" aria-labelledby={titleId}>
      <h2 id={titleId}>{t('teacher.title')}</h2>
      <p>{t('teacher.body')}</p>
      <ul>
        <li>{t('teacher.tip.mirror')}</li>
        <li>{t('teacher.tip.recording')}</li>
        <li>{t('teacher.tip.teacher')}</li>
      </ul>
      <p className="muted">{t('teacher.note')}</p>
    </section>
  )
}
