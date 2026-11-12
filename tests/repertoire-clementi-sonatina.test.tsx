import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type {
  AudioEngine,
  AudioEngineState,
  PlayTimelineOptions,
} from '../src/audio/engine'
import type { TimelineEvent } from '../src/audio/notes'
import { RepertoirePlayer } from '../src/components/RepertoirePlayer'
import { loadRepertoirePiece } from '../src/content/repertoire'
import { scoreToTimeline } from '../src/content/score'
import { renderGrandStaff } from '../src/staff/grand-staff'
import { DEFAULT_SETTINGS, SettingsProvider } from '../src/state/settings'

const PIECE_ID = 'piece.clementi.sonatina-op36-1-i'

function audioState(
  overrides: Partial<AudioEngineState> = {},
): AudioEngineState {
  return {
    status: 'idle',
    mode: 'none',
    contextState: 'suspended',
    isPlaying: false,
    isMetronome: false,
    activeNotes: [],
    error: null,
    tempo: 60,
    volumeDb: -8,
    ...overrides,
  }
}

function stubEngine() {
  const engine = {
    playTimeline: vi.fn(
      async (_events: TimelineEvent[], _options?: PlayTimelineOptions) =>
        undefined,
    ),
    stop: vi.fn(),
  }
  return { engine: engine as unknown as AudioEngine, mocks: engine }
}

async function piece() {
  return loadRepertoirePiece(PIECE_ID)
}

describe('F5-034 — Sonatina Op. 36 N.º 1, I (Clementi)', () => {
  it('publica la pieza con la ficha de Clementi', async () => {
    const p = await piece()

    expect(p.id).toBe(PIECE_ID)
    expect(p.title).toBe('Sonatina en Do mayor, Op. 36 N.º 1, I (Allegro)')
    expect(p.composerDisplay).toBe('Muzio Clementi')
    expect(p.level).toBe(2)
    expect(p.durationSeconds).toBeCloseTo(16 * 60 / 156, 9)
    expect(p.tags).toContain('clásico')
    expect(p.tags).toContain('clementi')

    expect(p.license.license).toBe('public-domain')
    expect(p.license.composer).toEqual({
      name: 'Muzio Clementi',
      birthYear: 1752,
      deathYear: 1832,
      anonymousTraditional: false,
    })
    expect(p.license.source).toMatch(/Sonatina/)
    expect(p.license.transcriptionAuthor).toBe('PianoDesdeCero')
    expect(p.license.transcriptionDate).toBe('2026-11-13')
    expect(p.license.attribution).toMatch(/1752-1832/)
    expect(p.license.attribution).toMatch(/PianoDesdeCero/)
    expect(p.license.verifiedBy).toBe('PianoDesdeCero')
    expect(p.license.verifiedOn).toBe('2026-11-13')
    expect(p.notesEs).toMatch(/2\/2/)
    expect(p.notesEn).toMatch(/2\/2/)
    expect(p.fingeringEs).toMatch(/Derecha:/)
    expect(p.fingeringEs).toMatch(/Izquierda:/)
    expect(p.fingeringEn).toMatch(/Right hand:/)
    expect(p.fingeringEn).toMatch(/Left hand:/)
  })

  it('tiene dos manos y cuatro compases de 2/2', async () => {
    const p = await piece()
    const right = p.hands.right
    const left = p.hands.left
    if (right === undefined || left === undefined) {
      throw new Error('Faltan las manos')
    }

    for (const [hand, score] of [
      ['right', right],
      ['left', left],
    ] as const) {
      expect(score.clef).toBe(hand === 'right' ? 'treble' : 'bass')
      expect(score.key).toBe('C')
      expect(score.mode).toBe('major')
      expect(score.timeSignature).toEqual({ numerator: 2, denominator: 2 })
      expect(score.tempoBpm).toBe(156)
      expect(score.pedals).toEqual([])

      const measures = new Set(score.events.map((event) => event.measure))
      expect([...measures].sort((a, b) => a - b)).toEqual([1, 2, 3, 4])
      expect(score.events.every((event) => event.hand === hand)).toBe(true)

      const ids = score.events.map((event) => event.id)
      expect(new Set(ids).size).toBe(ids.length)
    }

    expect(right.events).toHaveLength(23)
    expect(left.events).toHaveLength(9)
  })

  it('transcribe el tema y el bajo', async () => {
    const p = await piece()
    const right = p.hands.right
    const left = p.hands.left
    if (right === undefined || left === undefined) {
      throw new Error('Faltan las manos')
    }

    const melody = scoreToTimeline(right)
    expect(melody).toHaveLength(23)
    const last = melody[melody.length - 1]
    expect(last).toBeDefined()
    expect((last?.time ?? 0) + (last?.duration ?? 0)).toBeLessThanOrEqual(
      (p.durationSeconds ?? 0) + 1e-9,
    )

    const bass = scoreToTimeline(left)
    expect(bass).toHaveLength(9)
  })

  it('renderiza las dos manos en el gran pentagrama', async () => {
    const p = await piece()
    const container = document.createElement('div')

    const result = await renderGrandStaff(container, {
      right: p.hands.right,
      left: p.hands.left,
      width: 640,
    })

    expect(result.notes).toHaveLength(32)
    expect(container.querySelector('svg')).not.toBeNull()
    expect(container.querySelectorAll('[data-hand="right"]')).toHaveLength(23)
    expect(container.querySelectorAll('[data-hand="left"]')).toHaveLength(9)
    expect(
      container.querySelector('[data-grand-note]')?.getAttribute('data-measure'),
    ).toBe('1')
  })

  it('el reproductor permite elegir manos, tempo y compases', async () => {
    const p = await piece()
    const { engine, mocks } = stubEngine()
    const user = userEvent.setup()

    render(
      <SettingsProvider initialSettings={DEFAULT_SETTINGS}>
        <RepertoirePlayer piece={p} engine={engine} audio={audioState()} />
      </SettingsProvider>,
    )

    expect(screen.getByRole('radio', { name: 'Ambas' })).toBeChecked()
    expect(
      screen.getByText(/Ambas · compases 1–4 · 156 BPM \(100 %\)/),
    ).toBeInTheDocument()

    await waitFor(() =>
      expect(document.querySelectorAll('[data-grand-note]').length).toBe(32),
    )

    await user.click(screen.getByRole('button', { name: 'Reproducir' }))
    expect(mocks.playTimeline).toHaveBeenCalledTimes(1)
    const [events, options] = mocks.playTimeline.mock.calls[0] ?? []
    expect(events).toHaveLength(32)
    expect(options?.repeat).toBe(false)
    expect(options?.duration).toBeCloseTo(p.durationSeconds ?? 0, 9)

    await user.click(screen.getByRole('button', { name: 'Detener' }))
    expect(mocks.stop).toHaveBeenCalledTimes(1)

    mocks.playTimeline.mockClear()
    await user.click(screen.getByRole('radio', { name: 'Izquierda' }))
    expect(
      screen.getByText(/Izquierda · compases 1–4 · 156 BPM \(100 %\)/),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Reproducir' }))
    const [leftEvents] = mocks.playTimeline.mock.calls[0] ?? []
    expect(leftEvents).toHaveLength(9)

    await user.click(screen.getByRole('button', { name: 'Detener' }))
    expect(mocks.stop).toHaveBeenCalledTimes(2)
  })
})