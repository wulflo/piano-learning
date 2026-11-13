import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { AudioEngine, AudioEngineState, PlayTimelineOptions } from '../src/audio/engine'
import type { TimelineEvent } from '../src/audio/notes'
import { RepertoirePlayer } from '../src/components/RepertoirePlayer'
import { loadRepertoirePiece } from '../src/content/repertoire'
import { renderGrandStaff } from '../src/staff/grand-staff'
import { DEFAULT_SETTINGS, SettingsProvider } from '../src/state/settings'

const PIECE_ID = 'piece.original.melodia-nivel-2'

function audioState(overrides: Partial<AudioEngineState> = {}): AudioEngineState {
  return { status: 'idle', mode: 'none', contextState: 'suspended', isPlaying: false, isMetronome: false, activeNotes: [], error: null, tempo: 60, volumeDb: -8, ...overrides }
}
function stubEngine() {
  const engine = { playTimeline: vi.fn(async (_e: TimelineEvent[], _o?: PlayTimelineOptions) => undefined), stop: vi.fn() }
  return { engine: engine as unknown as AudioEngine, mocks: engine }
}
async function piece() { return loadRepertoirePiece(PIECE_ID) }

describe('F5-038 — Melod\u00eda en Do mayor (nivel 2, original)', () => {
  it('publica la pieza original con licencia CC0', async () => {
    const p = await piece()
    expect(p.id).toBe(PIECE_ID)
    expect(p.title).toBe('Melod\u00eda en Do mayor (nivel 2)')
    expect(p.composerDisplay).toBe('Piano Today')
    expect(p.level).toBe(2)
    expect(p.durationSeconds).toBeCloseTo(16 * 4 * 60 / 90, 9)
    expect(p.license.license).toBe('cc0-1.0')
    expect(p.license.composer.name).toBe('Piano Today')
    expect(p.license.transcriptionDate).toBe('2026-11-13')
    expect(p.notesEs).toMatch(/4\/4/)
    expect(p.fingeringEs).toMatch(/Derecha:/)
  })
  it('tiene dos manos y dieciséis compases de 4/4', async () => {
    const p = await piece()
    const right = p.hands.right; const left = p.hands.left
    if (right === undefined || left === undefined) throw new Error('Faltan las manos')
    for (const [hand, score] of [['right', right], ['left', left]] as const) {
      expect(score.clef).toBe(hand === 'right' ? 'treble' : 'bass')
      expect(score.key).toBe('C')
      expect(score.mode).toBe('major')
      expect(score.timeSignature).toEqual({ numerator: 4, denominator: 4 })
      expect(score.tempoBpm).toBe(90)
      const measures = new Set(score.events.map((e) => e.measure))
      expect([...measures].sort((a, b) => a - b)).toEqual(Array.from({ length: 16 }, (_, i) => i + 1))
      expect(score.events.every((e) => e.hand === hand)).toBe(true)
      const ids = score.events.map((e) => e.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
    expect(right.events).toHaveLength(61)
    expect(left.events).toHaveLength(16)
  })
  it('renderiza las dos manos en el gran pentagrama', async () => {
    const p = await piece()
    const container = document.createElement('div')
    const result = await renderGrandStaff(container, { right: p.hands.right, left: p.hands.left, width: 640 })
    expect(result.notes).toHaveLength(77)
    expect(container.querySelector('svg')).not.toBeNull()
    expect(container.querySelectorAll('[data-hand="right"]')).toHaveLength(61)
    expect(container.querySelectorAll('[data-hand="left"]')).toHaveLength(16)
  })
  it('el reproductor permite elegir manos, tempo y compases', async () => {
    const p = await piece()
    const { engine, mocks } = stubEngine()
    const user = userEvent.setup()
    render(<SettingsProvider initialSettings={DEFAULT_SETTINGS}><RepertoirePlayer piece={p} engine={engine} audio={audioState()} /></SettingsProvider>)
    expect(screen.getByRole('radio', { name: 'Ambas' })).toBeChecked()
    expect(screen.getByText(/Ambas · compases 1–16 · 90 BPM \(100 %\)/)).toBeInTheDocument()
    await waitFor(() => expect(document.querySelectorAll('[data-grand-note]').length).toBe(77))
    await user.click(screen.getByRole('button', { name: 'Reproducir' }))
    expect(mocks.playTimeline).toHaveBeenCalledTimes(1)
    const [events, options] = mocks.playTimeline.mock.calls[0] ?? []
    expect(events).toHaveLength(77)
    expect(options?.repeat).toBe(false)
    expect(options?.duration).toBeCloseTo(p.durationSeconds ?? 0, 9)
    await user.click(screen.getByRole('button', { name: 'Detener' }))
    expect(mocks.stop).toHaveBeenCalledTimes(1)
    mocks.playTimeline.mockClear()
    await user.click(screen.getByRole('radio', { name: 'Izquierda' }))
    await user.click(screen.getByRole('button', { name: 'Reproducir' }))
    const [leftEvents] = mocks.playTimeline.mock.calls[0] ?? []
    expect(leftEvents).toHaveLength(16)
    await user.click(screen.getByRole('button', { name: 'Detener' }))
    expect(mocks.stop).toHaveBeenCalledTimes(2)
  })
})