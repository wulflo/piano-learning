import { useEffect, useMemo, useRef, useState } from 'react'
import { scoreToMeasures } from '../content/score'
import type { Score } from '../schemas'
import {
  grandStaffLayout,
  grandStaffMeasureCount,
  renderGrandStaff,
  type GrandStaffNoteClick,
} from '../staff/grand-staff'
import { describeStaffNotes } from '../staff/render'
import { useSettings } from '../state/settings'

/**
 * F5-022 — Gran pentagrama de una pieza de repertorio.
 *
 * Recibe las partituras separadas de cada mano y las dibuja en dos
 * pentagramas alineados. El ancho se mide con `ResizeObserver`; al cambiar el
 * tamaño se recalculan los compases por sistema y se vuelve a renderizar. En
 * pantallas angostas el contenedor permite desplazamiento horizontal y el
 * zoom conserva la legibilidad.
 */

export interface GrandStaffProps {
  right?: Score
  left?: Score
  label?: string
  zoom?: number
  activeNotes?: ReadonlyArray<number>
  activeIds?: ReadonlyArray<string>
  onNoteClick?: (payload: GrandStaffNoteClick) => void
  className?: string
}

export function GrandStaff({
  right,
  left,
  label,
  zoom = 1,
  activeNotes = [],
  activeIds = [],
  onNoteClick,
  className,
}: GrandStaffProps) {
  const { settings, t } = useSettings()
  const scrollRef = useRef<HTMLDivElement>(null)
  const renderRef = useRef<HTMLDivElement>(null)
  const onNoteClickRef = useRef(onNoteClick)
  onNoteClickRef.current = onNoteClick

  const [width, setWidth] = useState(640)
  const [renderHeight, setRenderHeight] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const element = scrollRef.current
    if (!element) return
    const update = () => {
      const measured = element.clientWidth
      if (measured > 0) setWidth(Math.max(280, measured - 8))
    }
    update()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const measureCount = grandStaffMeasureCount(right, left)
  const layout = useMemo(
    () => grandStaffLayout(Math.max(1, measureCount), width),
    [measureCount, width],
  )
  const height = renderHeight ?? layout.height
  const activeKey = activeNotes.join(',')
  const activeIdKey = activeIds.join(',')

  // Al cambiar el ancho o el número de compases el alto real deja de ser
  // válido; se vuelve al cálculo teórico hasta que termine el nuevo dibujo.
  useEffect(() => {
    setRenderHeight(null)
  }, [width, measureCount])

  useEffect(() => {
    let cancelled = false
    const container = renderRef.current
    if (!container) return

    setReady(false)
    renderGrandStaff(container, {
      right,
      left,
      width,
      notation: settings.notation,
      activeNotes,
      activeIds,
      onNoteClick: (payload) => onNoteClickRef.current?.(payload),
    })
      .then((result) => {
        if (cancelled) return
        setRenderHeight(result.height)
        setError(null)
        setReady(true)
      })
      .catch((reason: unknown) => {
        if (cancelled) return
        setReady(true)
        setError(reason instanceof Error ? reason.message : '')
      })

    return () => {
      cancelled = true
    }
    // activeKey resume el contenido sin depender de la identidad del array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [right, left, width, settings.notation, activeKey, activeIdKey])

  const notesText = useMemo(() => {
    const describe = (score: Score | undefined) =>
      score === undefined
        ? t('staff.noNotes')
        : describeStaffNotes(scoreToMeasures(score), settings.notation)
    return `${t('staff.grand.hand.right')}: ${describe(right)} · ${t(
      'staff.grand.hand.left',
    )}: ${describe(left)}`
  }, [right, left, settings.notation, t])

  const handsText = useMemo(() => {
    const hands = [
      right === undefined ? null : t('staff.grand.hand.right'),
      left === undefined ? null : t('staff.grand.hand.left'),
    ].filter((hand): hand is string => hand !== null)
    if (hands.length === 0) {
      return `${t('staff.grand.hand.right')} + ${t('staff.grand.hand.left')}`
    }
    return hands.join(' + ')
  }, [right, left, t])

  return (
    <figure
      className={['staff', 'grand-staff', className].filter(Boolean).join(' ')}
    >
      <figcaption className="staff-caption">
        {label ?? t('staff.grand.title')}
        <span className="muted">
          {' · '}
          {handsText}
        </span>
      </figcaption>

      <div className="staff-scroll" ref={scrollRef}>
        <div
          className="staff-zoom"
          style={{ width: width * zoom, height: height * zoom }}
        >
          <div
            ref={renderRef}
            className="staff-canvas"
            style={{
              width,
              height,
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
            }}
            role="group"
            aria-label={`${label ?? t('staff.grand.title')}: ${notesText}`}
            aria-busy={!ready}
          />
        </div>
      </div>

      {error ? (
        <p role="alert" className="staff-error">
          {t('staff.error', { message: error || t('staff.error.unknown') })}
        </p>
      ) : (
        <p className="staff-text" aria-live="polite">
          <span className="staff-text-label">{t('staff.notes')}:</span>{' '}
          {notesText}
        </p>
      )}
    </figure>
  )
}
