import { useCallback, useEffect, useRef, useState } from 'react'
import { ExerciseSuggestions } from '../components/ExerciseSuggestions'
import type { PracticeSession, Profile } from '../schemas'
import { PROGRESS_HASH } from '../router/hash-route'
import {
  PRACTICE_DURATIONS,
  buildPracticePlan,
  createPracticeSessionId,
  totalPlanMinutes,
  type PracticeBlockKind,
  type PracticeMinutes,
} from '../state/practice-plan'
import {
  buildPracticeSession,
  createPracticeTimer,
  finishPracticeTimer,
  pausePracticeTimer,
  practicedSeconds,
  remainingSeconds,
  resumePracticeTimer,
  skipPracticeBlock,
  startPracticeTimer,
  tickPracticeTimer,
  type PracticeTimerState,
} from '../state/practice-timer'
import { useProgress } from '../state/progress-context'
import { useReviewDay } from '../state/use-review-day'
import { useSettings } from '../state/settings'
import { xpForActivity } from '../state/xp'

/**
 * Pantalla «Práctica de hoy».
 *
 * Ofrece un plan de 15, 30 o 45 minutos repartido en calentamiento, técnica,
 * teoría, repertorio y repaso. El temporizador avanza bloque a bloque, se puede
 * pausar o saltar, y al terminar guarda la sesión con los segundos realmente
 * practicados. Guardar la sesión también suma XP y registra la racha del día.
 */

function formatClock(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds))
  const minutes = Math.floor(safe / 60)
  const rest = safe % 60
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`
}

function blockLabelKey(kind: PracticeBlockKind): string {
  return `practice.block.${kind}`
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface SessionIdentity {
  id: string
  startedAt: Date
}

export function PracticePage() {
  const { t } = useSettings()
  const { repositories, status: databaseStatus } = useProgress()
  const reviewDay = useReviewDay()
  const [minutes, setMinutes] = useState<PracticeMinutes>(15)
  const [timer, setTimer] = useState<PracticeTimerState | null>(null)
  const [identity, setIdentity] = useState<SessionIdentity | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState<{
    session: PracticeSession
    profile: Profile
  } | null>(null)
  const savingRef = useRef(false)

  useEffect(() => {
    if (timer?.status !== 'running') return
    const interval = window.setInterval(() => {
      setTimer((current) =>
        current === null ? current : tickPracticeTimer(current),
      )
    }, 1000)
    return () => window.clearInterval(interval)
  }, [timer?.status])

  const saveSession = useCallback(
    async (state: PracticeTimerState, session: SessionIdentity) => {
      if (repositories === null || savingRef.current) return

      savingRef.current = true
      setSaveStatus('saving')
      setSaveError(null)
      try {
        const record = buildPracticeSession({
          id: session.id,
          startedAt: session.startedAt,
          endedAt: new Date(),
          timer: state,
        })
        const result = await repositories.recordPracticeSession(record)
        setSaved(result)
        setSaveStatus('saved')
      } catch (reason) {
        setSaveError(
          t('practice.saveError', {
            message: reason instanceof Error ? reason.message : String(reason),
          }),
        )
        setSaveStatus('error')
      } finally {
        savingRef.current = false
      }
    },
    [repositories, t],
  )

  useEffect(() => {
    if (timer?.status !== 'done' || identity === null) return
    if (practicedSeconds(timer) === 0) return
    void saveSession(timer, identity)
  }, [timer, identity, saveSession])

  const start = () => {
    const startedAt = new Date()
    setIdentity({ id: createPracticeSessionId(startedAt), startedAt })
    setTimer(startPracticeTimer(createPracticeTimer(minutes)))
    setSaved(null)
    setSaveStatus('idle')
    setSaveError(null)
  }

  const reset = () => {
    setTimer(null)
    setIdentity(null)
    setSaved(null)
    setSaveStatus('idle')
    setSaveError(null)
  }

  const retry = () => {
    if (timer !== null && identity !== null) {
      void saveSession(timer, identity)
    }
  }

  return (
    <main className="page practice-page" aria-labelledby="practice-title">
      <section className="hero">
        <p className="eyebrow">{t('practice.eyebrow')}</p>
        <h1 id="practice-title">{t('practice.title')}</h1>
        <p className="lede">{t('practice.lead')}</p>
      </section>

      {timer === null ? (
        <PlanPicker
          minutes={minutes}
          databaseStatus={databaseStatus}
          onMinutes={setMinutes}
          onStart={start}
        />
      ) : timer.status === 'done' ? (
        <DonePanel
          timer={timer}
          saveStatus={saveStatus}
          saveError={saveError}
          saved={saved}
          onRetry={retry}
          onReset={reset}
        />
      ) : (
        <TimerPanel
          timer={timer}
          onPause={() => setTimer((current) => current && pausePracticeTimer(current))}
          onResume={() =>
            setTimer((current) => current && resumePracticeTimer(current))
          }
          onSkip={() => setTimer((current) => current && skipPracticeBlock(current))}
          onFinish={() =>
            setTimer((current) => current && finishPracticeTimer(current))
          }
        />
      )}

      {reviewDay.status === 'ready' &&
        reviewDay.day !== null &&
        reviewDay.day.queue.entries.length > 0 && (
          <ExerciseSuggestions
            skillIds={reviewDay.day.queue.entries.map((entry) => entry.itemId)}
            perSkill={1}
            maxTotal={3}
          />
        )}
    </main>
  )
}

interface PlanPickerProps {
  minutes: PracticeMinutes
  databaseStatus: 'loading' | 'ready' | 'error'
  onMinutes: (minutes: PracticeMinutes) => void
  onStart: () => void
}

function PlanPicker({
  minutes,
  databaseStatus,
  onMinutes,
  onStart,
}: PlanPickerProps) {
  const { t } = useSettings()
  const plan = buildPracticePlan(minutes)

  return (
    <section className="panel practice-plan" aria-labelledby="practice-plan-title">
      <h2 id="practice-plan-title">{t('practice.plan.title')}</h2>

      <fieldset className="practice-durations">
        <legend>{t('practice.duration.legend')}</legend>
        {PRACTICE_DURATIONS.map((value) => (
          <label key={value} className="practice-duration">
            <input
              type="radio"
              name="practice-duration"
              value={value}
              checked={minutes === value}
              onChange={() => onMinutes(value)}
            />
            <span>{t('practice.duration.option', { minutes: value })}</span>
          </label>
        ))}
      </fieldset>

      <ul className="practice-blocks">
        {plan.map((block) => (
          <li key={block.kind} className="practice-block">
            <span className="practice-block-name">
              {t(blockLabelKey(block.kind))}
            </span>
            <span className="practice-block-time">
              {t('practice.plan.blockMinutes', { minutes: block.minutes })}
            </span>
          </li>
        ))}
      </ul>

      <p className="muted">
        {t('practice.plan.total', { minutes: totalPlanMinutes(plan) })}
      </p>
      <p className="muted">{t('practice.plan.note')}</p>

      {databaseStatus !== 'ready' && (
        <p className="muted" role="status">
          {databaseStatus === 'error'
            ? t('practice.databaseError')
            : t('practice.loading')}
        </p>
      )}

      <p className="page-actions">
        <button
          type="button"
          className="button-primary"
          onClick={onStart}
          disabled={databaseStatus !== 'ready'}
        >
          {t('practice.start')}
        </button>
      </p>
    </section>
  )
}

interface TimerPanelProps {
  timer: PracticeTimerState
  onPause: () => void
  onResume: () => void
  onSkip: () => void
  onFinish: () => void
}

function blockStatus(
  timer: PracticeTimerState,
  index: number,
): 'done' | 'active' | 'pending' {
  const block = timer.blocks[index]
  if (block === undefined) return 'pending'
  if (block.elapsedSeconds >= block.plannedSeconds) return 'done'
  if (index === timer.current) return 'active'
  return 'pending'
}

function TimerPanel({
  timer,
  onPause,
  onResume,
  onSkip,
  onFinish,
}: TimerPanelProps) {
  const { t } = useSettings()
  const current = timer.blocks[timer.current]
  const practiced = practicedSeconds(timer)
  const planned = timer.blocks.reduce((sum, block) => sum + block.plannedSeconds, 0)

  return (
    <section className="panel practice-timer" aria-labelledby="practice-timer-title">
      <div className="panel-heading">
        <h2 id="practice-timer-title">{t('practice.timer.title')}</h2>
        <p className="muted">
          {t('practice.timer.blockProgress', {
            current: timer.current + 1,
            total: timer.blocks.length,
          })}
        </p>
      </div>

      <h3>{current === undefined ? '' : t(blockLabelKey(current.kind))}</h3>
      <p className="practice-clock" role="timer">
        {formatClock(remainingSeconds(timer))}
      </p>
      <p className="muted">
        {t('practice.timer.elapsed', { time: formatClock(practiced) })}
      </p>
      <progress
        className="practice-progress"
        value={practiced}
        max={planned}
        aria-label={t('practice.timer.progressLabel')}
      />

      <h4>{t('practice.blocks.title')}</h4>
      <ol className="practice-blocks">
        {timer.blocks.map((block, index) => {
          const status = blockStatus(timer, index)
          return (
            <li key={block.kind} className="practice-block">
              <span className="practice-block-name">
                {t(blockLabelKey(block.kind))}
              </span>
              <span className="practice-block-time">
                {formatClock(block.elapsedSeconds)} /{' '}
                {formatClock(block.plannedSeconds)}
              </span>
              <span className="practice-block-status">
                {t(`practice.block.status.${status}`)}
              </span>
            </li>
          )
        })}
      </ol>

      <p className="page-actions">
        {timer.status === 'paused' ? (
          <button type="button" className="button-primary" onClick={onResume}>
            {t('practice.timer.resume')}
          </button>
        ) : (
          <button type="button" className="button-primary" onClick={onPause}>
            {t('practice.timer.pause')}
          </button>
        )}
        <button type="button" className="button-secondary" onClick={onSkip}>
          {t('practice.timer.skip')}
        </button>
        <button type="button" className="button-secondary" onClick={onFinish}>
          {t('practice.timer.finish')}
        </button>
      </p>
    </section>
  )
}

interface DonePanelProps {
  timer: PracticeTimerState
  saveStatus: SaveStatus
  saveError: string | null
  saved: { session: PracticeSession; profile: Profile } | null
  onRetry: () => void
  onReset: () => void
}

function DonePanel({
  timer,
  saveStatus,
  saveError,
  saved,
  onRetry,
  onReset,
}: DonePanelProps) {
  const { t } = useSettings()
  const practiced = practicedSeconds(timer)
  const minutes = Math.floor(practiced / 60)
  const xp = xpForActivity({ kind: 'practice', minutes })

  return (
    <section className="panel practice-done" aria-labelledby="practice-done-title">
      <h2 id="practice-done-title">{t('practice.done.title')}</h2>

      {practiced === 0 ? (
        <p>{t('practice.done.empty')}</p>
      ) : (
        <>
          <p>
            {t('practice.done.summary', {
              minutes,
              planned: timer.plannedMinutes,
            })}
          </p>

          {saveStatus === 'saving' && (
            <p className="muted" role="status">
              {t('practice.saving')}
            </p>
          )}

          {saveStatus === 'error' && (
            <div className="error-panel" role="alert">
              <p>{saveError}</p>
              <button type="button" className="button-secondary" onClick={onRetry}>
                {t('practice.retry')}
              </button>
            </div>
          )}

          {saveStatus === 'saved' && saved !== null && (
            <>
              <p>{minutes > 0 ? t('practice.done.xp', { xp }) : t('practice.done.belowMinute')}</p>
              <p className="muted">{t('practice.done.saved')}</p>
            </>
          )}
        </>
      )}

      <h3>{t('practice.blocks.title')}</h3>
      <ul className="practice-blocks">
        {timer.blocks.map((block) => (
          <li key={block.kind} className="practice-block">
            <span className="practice-block-name">
              {t(blockLabelKey(block.kind))}
            </span>
            <span className="practice-block-time">
              {formatClock(block.elapsedSeconds)}
            </span>
          </li>
        ))}
      </ul>

      <p className="page-actions">
        <button type="button" className="button-primary" onClick={onReset}>
          {t('practice.done.again')}
        </button>
        <a href={PROGRESS_HASH}>{t('practice.done.progress')}</a>
      </p>
    </section>
  )
}
