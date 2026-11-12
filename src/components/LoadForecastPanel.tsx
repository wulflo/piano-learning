import { useMemo } from 'react'
import type { FsrsCard } from '../schemas'
import { buildDailyQueue, type QueueCandidate } from '../state/daily-queue'
import {
  DAILY_CAP_MAX,
  DAILY_CAP_MIN,
  FORECAST_DAYS,
  forecastLoad,
  normalizeDailyCap,
} from '../state/load-forecast'
import { useSettings } from '../state/settings'

export interface LoadForecastPanelProps {
  /** Tarjetas de repaso que alimentan la previsión de 7 días. */
  cards?: readonly FsrsCard[]
  /** Ítems disponibles para previsualizar la cola de hoy. */
  candidates?: readonly QueueCandidate[]
  /** Reloj inyectable; en la app se usa la fecha actual. */
  now?: Date
}

/** Panel con la previsión de carga y el tope diario de ítems nuevos. */
export function LoadForecastPanel({
  cards = [],
  candidates = [],
  now,
}: LoadForecastPanelProps) {
  const { settings, updateSettings, t } = useSettings()
  const current = useMemo(() => now ?? new Date(), [now])

  const forecast = useMemo(
    () => forecastLoad(cards, { now: current, days: FORECAST_DAYS }),
    [cards, current],
  )

  const queue = useMemo(
    () =>
      buildDailyQueue(candidates, {
        now: current,
        newPerDay: settings.newPerDay,
        seed: 1,
      }),
    [candidates, current, settings.newPerDay],
  )

  const maxDue = Math.max(1, ...forecast.days.map((day) => day.due))

  const updateCap = (raw: string) => {
    updateSettings({ newPerDay: normalizeDailyCap(Number(raw)) })
  }

  return (
    <section className="panel load-panel" aria-labelledby="load-title">
      <h2 id="load-title">{t('load.title')}</h2>
      <p className="muted">{t('load.lead', { days: FORECAST_DAYS })}</p>

      <ul className="load-forecast" aria-label={t('load.title')}>
        {forecast.days.map((day) => (
          <li key={day.date} className="load-day">
            <span className="load-day-label">
              {day.offset === 0
                ? t('load.today')
                : day.offset === 1
                  ? t('load.tomorrow')
                  : t('load.inDays', { count: day.offset })}
            </span>
            <span
              className="load-bar"
              role="img"
              aria-label={t('load.dayCount', { date: day.date, count: day.due })}
            >
              <span style={{ width: `${(day.due / maxDue) * 100}%` }} />
            </span>
            <span className="load-day-count">{day.due}</span>
          </li>
        ))}
      </ul>

      <p className="load-summary">
        {t('load.overdue', { count: forecast.overdue })} ·{' '}
        {t('load.scheduled', { count: forecast.scheduled })} ·{' '}
        {t('load.total', { count: forecast.total })}
      </p>
      {forecast.total === 0 && <p className="muted">{t('load.empty')}</p>}

      <label className="field load-cap">
        <span>
          {t('load.cap')} ({DAILY_CAP_MIN}–{DAILY_CAP_MAX})
        </span>
        <input
          type="number"
          min={DAILY_CAP_MIN}
          max={DAILY_CAP_MAX}
          step={1}
          value={settings.newPerDay}
          onChange={(event) => updateCap(event.target.value)}
        />
      </label>
      <p className="muted">
        {t('load.cap.help', { min: DAILY_CAP_MIN, max: DAILY_CAP_MAX })}
      </p>

      <p className="load-queue" aria-live="polite" aria-atomic="true">
        {t('load.queue', {
          due: queue.counts.due,
          new: queue.counts.new,
          total: queue.counts.total,
        })}
      </p>
    </section>
  )
}
