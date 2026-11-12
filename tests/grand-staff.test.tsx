import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GrandStaff } from '../src/components/GrandStaff'
import { loadRepertoirePiece } from '../src/content/repertoire'
import type { Score } from '../src/schemas'
import {
  distributeMeasureWidths,
  eventsByMeasure,
  grandStaffLayout,
  grandStaffMeasureCount,
  renderGrandStaff,
} from '../src/staff/grand-staff'
import { DEFAULT_SETTINGS, SettingsProvider } from '../src/state/settings'

async function piece() {
  return loadRepertoirePiece('piece.studies.01')
}

function countEvents(score: Score | undefined): number {
  return score?.events.length ?? 0
}

function repeatedNoteScore(): Score {
  const pitch: Score['events'][number]['pitches'][number] = {
    step: 'C',
    accidental: '',
    octave: 4,
  }
  return {
    clef: 'treble',
    key: 'C',
    mode: 'major',
    timeSignature: { numerator: 4, denominator: 4 },
    tempoBpm: 80,
    pedals: [],
    events: [1, 2, 3].map((number) => ({
      id: `ev.${number}`,
      measure: 1,
      beat: number - 1,
      value: { duration: 'quarter', dots: 0, tuplet: 'none' },
      pitches: [pitch],
      hand: 'right',
      voice: 1,
      velocity: 80,
      tieToNext: false,
    })),
  }
}

describe('F5-022 — Gran pentagrama', () => {
  it('calcula compases, sistemas y anchos alineados', async () => {
    const study = await piece()
    expect(grandStaffMeasureCount(study.hands.right, study.hands.left)).toBe(8)

    const wide = grandStaffLayout(8, 640)
    expect(wide.perSystem).toBe(5)
    expect(wide.systems).toBe(2)
    expect(wide.height).toBe(
      2 * 190 + 12,
    )

    const narrow = grandStaffLayout(8, 320)
    expect(narrow.perSystem).toBe(2)
    expect(narrow.systems).toBe(4)

    const widths = distributeMeasureWidths(500, 5)
    expect(widths).toHaveLength(5)
    expect(widths.reduce((total, value) => total + value, 0)).toBe(500)
    expect(widths.every((value) => value > 0)).toBe(true)
    expect(distributeMeasureWidths(500, 0)).toEqual([])
  })

  it('agrupa los eventos por compás y los ordena por pulso', async () => {
    const study = await piece()
    const grouped = eventsByMeasure(study.hands.right)
    expect(grouped.size).toBe(8)
    for (const [measure, events] of grouped) {
      expect(measure).toBeGreaterThanOrEqual(1)
      for (let index = 1; index < events.length; index += 1) {
        expect(events[index].beat).toBeGreaterThanOrEqual(
          events[index - 1].beat,
        )
      }
    }
  })

  it('dibuja las dos manos con claves separadas y notas accesibles', async () => {
    const study = await piece()
    const container = document.createElement('div')
    const onNoteClick = vi.fn()

    const result = await renderGrandStaff(container, {
      right: study.hands.right,
      left: study.hands.left,
      width: 640,
      activeNotes: [],
      onNoteClick,
    })

    const expected =
      countEvents(study.hands.right) + countEvents(study.hands.left)
    expect(result.notes).toHaveLength(expected)
    expect(result.systems).toBe(2)
    expect(container.querySelector('svg')).not.toBeNull()

    const rightNotes = container.querySelectorAll('[data-hand="right"]')
    const leftNotes = container.querySelectorAll('[data-hand="left"]')
    expect(rightNotes).toHaveLength(countEvents(study.hands.right))
    expect(leftNotes).toHaveLength(countEvents(study.hands.left))

    const firstRight = rightNotes[0] as SVGElement
    expect(firstRight.getAttribute('tabindex')).toBe('0')
    expect(firstRight.getAttribute('role')).toBe('button')
    expect(firstRight.getAttribute('aria-label')).not.toBeNull()
    expect(firstRight.getAttribute('data-measure')).toBe('1')

    firstRight.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(onNoteClick).toHaveBeenCalledTimes(1)
    const payload = onNoteClick.mock.calls[0]?.[0]
    expect(payload.hand).toBe('right')
    expect(payload.measure).toBe(1)
    expect(Array.isArray(payload.midis)).toBe(true)
  })

  it('resalta las notas activas en ambas manos', async () => {
    const study = await piece()
    const container = document.createElement('div')
    const rightMidi = study.hands.right?.events[0]?.pitches[0]
    const leftMidi = study.hands.left?.events[0]?.pitches[0]
    expect(rightMidi).toBeDefined()
    expect(leftMidi).toBeDefined()

    const result = await renderGrandStaff(container, {
      right: study.hands.right,
      left: study.hands.left,
      activeNotes: [60, 64],
    })

    expect(result.notes.some((note) => note.highlighted)).toBe(true)
    expect(
      container.querySelectorAll('[data-highlighted="true"]').length,
    ).toBeGreaterThan(0)
  })

  it('resalta una sola repetición cuando el MIDI se repite', async () => {
    const container = document.createElement('div')
    const result = await renderGrandStaff(container, {
      right: repeatedNoteScore(),
      activeNotes: [60],
    })

    expect(
      result.notes
        .filter((note) => note.hand === 'right')
        .map((note) => note.highlighted),
    ).toEqual([true, false, false])
  })

  it('usa el id activo para elegir la repetición correcta', async () => {
    const container = document.createElement('div')
    const result = await renderGrandStaff(container, {
      right: repeatedNoteScore(),
      activeNotes: [60],
      activeIds: ['ev.2'],
    })

    expect(
      result.notes
        .filter((note) => note.hand === 'right')
        .map((note) => note.highlighted),
    ).toEqual([false, true, false])
  })

  it('recalcula la altura y los sistemas al angostar el ancho', async () => {
    const study = await piece()
    const narrow = document.createElement('div')
    const narrowResult = await renderGrandStaff(narrow, {
      right: study.hands.right,
      left: study.hands.left,
      width: 320,
    })

    expect(narrowResult.systems).toBe(4)
    // Cada sistema reserva el alto de sus notas, así que la altura real debe
    // ser al menos la del cálculo teórico y coincidir con el SVG dibujado.
    expect(narrowResult.height).toBeGreaterThanOrEqual(4 * 190)
    expect(narrowResult.height).toBeLessThanOrEqual(4 * 260)
    const svg = narrow.querySelector('svg')
    expect(Number(svg?.getAttribute('height'))).toBe(narrowResult.height)
  })

  it('reserva altura para notas extremas sin recortarlas', async () => {
    const study = await piece()
    const baselineContainer = document.createElement('div')
    const baseline = await renderGrandStaff(baselineContainer, {
      right: study.hands.right,
      left: study.hands.left,
    })

    const extremeLeft = structuredClone(study.hands.left)
    const firstEvent = extremeLeft?.events[0]
    if (!firstEvent) throw new Error('La pieza no tiene notas en la mano izquierda')
    firstEvent.pitches = [{ step: 'C', accidental: '', octave: 1 }]

    const container = document.createElement('div')
    const result = await renderGrandStaff(container, {
      right: study.hands.right,
      left: extremeLeft,
    })

    expect(result.height).toBeGreaterThan(baseline.height)
    const svg = container.querySelector('svg')
    expect(Number(svg?.getAttribute('height'))).toBe(result.height)
    expect(svg?.getAttribute('viewBox')).toBe(
      `0 0 ${svg?.getAttribute('width')} ${result.height}`,
    )
  })

  it('renderiza una pieza de una sola mano sin romper el gran pentagrama', async () => {
    const single = await loadRepertoirePiece('piece.original.do-mayor')
    const container = document.createElement('div')

    const result = await renderGrandStaff(container, {
      right: single.hands.right,
      left: single.hands.left,
      width: 640,
    })

    expect(countEvents(single.hands.right)).toBeGreaterThan(0)
    expect(countEvents(single.hands.left)).toBe(0)
    expect(result.notes).toHaveLength(countEvents(single.hands.right))
    expect(container.querySelector('svg')).not.toBeNull()
  })

  it('el componente muestra las dos manos y responde al click', async () => {
    const study = await piece()
    const onNoteClick = vi.fn()
    const user = userEvent.setup()

    render(
      <SettingsProvider initialSettings={DEFAULT_SETTINGS}>
        <GrandStaff
          right={study.hands.right}
          left={study.hands.left}
          label="Estudio 1"
          onNoteClick={onNoteClick}
        />
      </SettingsProvider>,
    )

    await waitFor(() =>
      expect(screen.getByText(/Mano derecha:/)).toBeInTheDocument(),
    )
    expect(screen.getByText('Estudio 1')).toBeInTheDocument()

    const notes = await waitFor(() => {
      const found = document.querySelectorAll('[data-grand-note]')
      expect(found.length).toBeGreaterThan(0)
      return found
    })
    await user.click(notes[0] as Element)
    expect(onNoteClick).toHaveBeenCalledTimes(1)
  })
})
