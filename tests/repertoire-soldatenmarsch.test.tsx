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

const PIECE_ID = 'piece.schumann.soldatenmarsch'

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

describe('F5-033 — Soldatenmarsch, Op. 68 N.º 2 (Schumann)', () => {
  it('publica la pieza con la ficha de Schumann', async () => {
    const p = await piece()

    expect(p.id).toBe(PIECE_ID)
    expect(p.title).toBe('Soldatenmarsch (Marcha de los soldados), Op. 68 N.º 2')
    expect(p.composerDisplay).toBe('Robert Schumann')
    expect(p.level).toBe(2)
    expect(p.durationSeconds).toBe(48)
    expect(p.tags).toContain('romántico')
    expect(p.tags).toContain('schumann')
    expect(p.tags).toContain('dos manos')

    expect(p.license.license).toBe('public-domain')
    expect(p.license.composer).toEqual({
      name: 'Robert Schumann',
      birthYear: 1810,
      deathYear: 1856,
      anonymousTraditional: false,
    })
    expect(p.license.source).toMatch(/Album für die Jugend/)
    expect(p.license.transcriptionAuthor).toBe('Piano Today')
    expect(p.license.transcriptionDate).toBe('2026-11-13')
    expect(p.license.attribution).toMatch(/1810-1856/)
    expect(p.license.attribution).toMatch(/Piano Today/)
    expect(p.license.verifiedBy).toBe('Piano Today')
    expect(p.license.verifiedOn).toBe('2026-11-13')
    expect(p.notesEs).toMatch(/2\/4/)
    expect(p.notesEn).toMatch(/2\/4/)
    expect(p.fingeringEs).toMatch(/Derecha:/)
    expect(p.fingeringEs).toMatch(/Izquierda:/)
    expect(p.fingeringEn).toMatch(/Right hand:/)
    expect(p.fingeringEn).toMatch(/Left hand:/)
  })

  it('tiene dos manos y cuarenta y ocho compases de 2/4', async () => {
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
      expect(score.key).toBe('G')
      expect(score.mode).toBe('major')
      expect(score.timeSignature).toEqual({ numerator: 2, denominator: 4 })
      expect(score.tempoBpm).toBe(120)
      expect(score.pedals).toEqual([])

      const measures = new Set(score.events.map((event) => event.measure))
      expect([...measures].sort((a, b) => a - b)).toEqual(
        Array.from({ length: 48 }, (_, index) => index + 1),
      )
      expect(score.events.every((event) => event.hand === hand)).toBe(true)

      const ids = score.events.map((event) => event.id)
      expect(new Set(ids).size).toBe(ids.length)
    }

    expect(right.events).toHaveLength(106)
    expect(left.events).toHaveLength(106)
  })

  it('transcribe la melodía con sus Fa y Do sostenidos', async () => {
    const p = await piece()
    const right = p.hands.right
    if (right === undefined) throw new Error('Falta la mano derecha')

    const sharps = right.events
      .flatMap((event) =>
        event.pitches
          .filter((pitch) => pitch.accidental === '#')
          .map((pitch) => ({ measure: event.measure, pitch })),
      )
    expect(sharps.length).toBeGreaterThan(0)
    expect(sharps.some(({ pitch }) => pitch.step === 'C')).toBe(true)
    expect(sharps.some(({ pitch }) => pitch.step === 'F')).toBe(true)

    const melody = scoreToTimeline(right)
    expect(melody).toHaveLength(106)
    const last = melody[melody.length - 1]
    expect(last).toBeDefined()
    expect((last?.time ?? 0) + (last?.duration ?? 0)).toBeLessThanOrEqual(
      48 + 1e-9,
    )
  })

  it('renderiza las dos manos con 312 notas en el gran pentagrama', async () => {
    const p = await piece()
    const container = document.createElement('div')

    const result = await renderGrandStaff(container, {
      right: p.hands.right,
      left: p.hands.left,
      width: 640,
    })

    expect(result.notes).toHaveLength(212)
    expect(container.querySelector('svg')).not.toBeNull()
    expect(container.querySelectorAll('[data-hand="right"]')).toHaveLength(106)
    expect(container.querySelectorAll('[data-hand="left"]')).toHaveLength(106)
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
      screen.getByText(/Ambas · compases 1–48 · 120 BPM \(100 %\)/),
    ).toBeInTheDocument()

    await waitFor(() =>
      expect(document.querySelectorAll('[data-grand-note]').length).toBe(212),
    )

    await user.click(screen.getByRole('button', { name: 'Reproducir' }))
    expect(mocks.playTimeline).toHaveBeenCalledTimes(1)
    const [events, options] = mocks.playTimeline.mock.calls[0] ?? []
    expect(events).toHaveLength(212)
    expect(options?.repeat).toBe(false)
    expect(options?.duration).toBeCloseTo(48, 9)

    await user.click(screen.getByRole('button', { name: 'Detener' }))
    expect(mocks.stop).toHaveBeenCalledTimes(1)

    mocks.playTimeline.mockClear()
    await user.click(screen.getByRole('radio', { name: 'Izquierda' }))
    expect(
      screen.getByText(/Izquierda · compases 1–48 · 120 BPM \(100 %\)/),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Reproducir' }))
    const [leftEvents] = mocks.playTimeline.mock.calls[0] ?? []
    expect(leftEvents).toHaveLength(106)

    await user.click(screen.getByRole('button', { name: 'Detener' }))
    expect(mocks.stop).toHaveBeenCalledTimes(2)
  })
})