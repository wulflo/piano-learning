import { useEffect, useMemo, useRef, useState } from 'react'
import { useMidi } from '../midi/context'
import { useSettings } from '../state/settings'
import {
  describeStaffNotes,
  renderStaff,
  type StaffMeasure,
} from '../staff/render'
import type { StaffDuration } from '../staff/vex'

export interface StaffProps {
  measures: StaffMeasure[]
  clef?: 'treble' | 'bass'
  keySignature?: string
  timeSignature?: string
  /** 1 = tamaño normal; 2 = 200 %. El contenedor permite desplazamiento. */
  zoom?: number
  label?: string
  activeNotes?: ReadonlyArray<number>
  onNoteClick?: (payload: { index: number; midis: number[]; id?: string }) => void
  className?: string
}

const STAFF_HEIGHT = 190

export function Staff({
  measures,
  clef = 'treble',
  keySignature = 'C',
  timeSignature = '4/4',
  zoom = 1,
  label,
  activeNotes = [],
  onNoteClick,
  className,
}: StaffProps) {
  const { settings, t } = useSettings()
  const { heldNotes } = useMidi()
  const scrollRef = useRef<HTMLDivElement>(null)
  const renderRef = useRef<HTMLDivElement>(null)
  const onNoteClickRef = useRef(onNoteClick)
  onNoteClickRef.current = onNoteClick

  /**
   * Las notas que llegan del dispositivo MIDI se suman a las que mantiene el
   * motor de audio: así el pentagrama ilumina lo que el alumno toca aunque no
   * haya sonido de la app de por medio.
   */
  const mergedActiveNotes = useMemo(
    () => [...new Set([...activeNotes, ...heldNotes])].sort((a, b) => a - b),
    [activeNotes, heldNotes],
  )

  const [width, setWidth] = useState(640)
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

  const activeKey = mergedActiveNotes.join(',')

  useEffect(() => {
    let cancelled = false
    const container = renderRef.current
    if (!container) return

    setReady(false)
    renderStaff(container, {
      measures,
      clef,
      keySignature,
      timeSignature,
      width,
      height: STAFF_HEIGHT,
      notation: settings.notation,
      activeNotes: mergedActiveNotes,
      onNoteClick: (payload) => onNoteClickRef.current?.(payload),
    })
      .then(() => {
        if (cancelled) return
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
    // activeKey resume el contenido de activeNotes sin depender de su identidad.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measures, clef, keySignature, timeSignature, width, settings.notation, activeKey])

  const notesText = useMemo(
    () => describeStaffNotes(measures, settings.notation) || t('staff.noNotes'),
    [measures, settings.notation, t],
  )

  const clefName = t(
    clef === 'treble' ? 'staff.clef.treble' : 'staff.clef.bass',
  )

  return (
    <figure className={['staff', className].filter(Boolean).join(' ')}>
      <figcaption className="staff-caption">
        {label ?? t('staff.title')}
        <span className="muted"> · {clefName}</span>
      </figcaption>

      <div className="staff-scroll" ref={scrollRef}>
        <div
          className="staff-zoom"
          style={{ width: width * zoom, height: STAFF_HEIGHT * zoom }}
        >
          <div
            ref={renderRef}
            className="staff-canvas"
            style={{
              width,
              height: STAFF_HEIGHT,
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
            }}
            role="group"
            aria-label={`${label ?? t('staff.title')}: ${notesText}`}
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

export type { StaffMeasure, StaffDuration }
