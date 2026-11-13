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
import { rhythmicValueBeats, scoreToTimeline } from '../src/content/score'
import { renderGrandStaff } from '../src/staff/grand-staff'
import { DEFAULT_SETTINGS, SettingsProvider } from '../src/state/settings'

const PIECE_ID = 'piece.traditional.amazing-grace'

const MELODY_MIDIS = [
  67, 71, // A-ma-zing
  71, 69, // grace, how
  67, 64, // sweet the
  62, // sound
  67, 71, // that saved
  71, 69, // a wretch
  74, // like
  74, 71, // me
  74, 71, // I once
  67, 62, // was lost
  64, 67, // but now
  62, // found
  67, 71, // was blind
  71, 69, // but now
  67, // I
  67, // see
]

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

async function amazingGrace() {
  return loadRepertoirePiece(PIECE_ID)
}

describe('F5-030 — Amazing Grace', () => {
  it('publica solo la melodía tradicional con ficha de dominio público', async () => {
    const piece = await amazingGrace()

    expect(piece.id).toBe(PIECE_ID)
    expect(piece.title).toBe('Amazing Grace')
    expect(piece.composerDisplay).toBe('Anónimo tradicional (New Britain)')
    expect(piece.level).toBe(1)
    expect(piece.durationSeconds).toBe(40)
    expect(piece.tags).toContain('tradicional')
    expect(piece.tags).toContain('melodía')

    expect(piece.license.license).toBe('public-domain')
    expect(piece.license.composer).toEqual({
      name: 'Anónimo tradicional',
      birthYear: null,
      deathYear: null,
      anonymousTraditional: true,
    })
    expect(piece.license.source).toMatch(/New Britain|1829/)
    expect(piece.license.sourceUrl).toBe('https://hymnary.org/tune/new_britain')
    expect(piece.license.transcriptionAuthor).toBe('Piano Today')
    expect(piece.license.transcriptionDate).toBe('2026-11-13')
    expect(piece.license.attribution).toMatch(/New Britain/)
    expect(piece.license.attribution).toMatch(/Piano Today/)
    expect(piece.license.verifiedBy).toBe('Piano Today')
    expect(piece.license.verifiedOn).toBe('2026-11-13')
    expect(piece.license.notes).toMatch(/John Newton/)
    expect(piece.license.notes).toMatch(/sin letra/)
    expect(piece.notesEs).toMatch(/3\/4/)
    expect(piece.notesEn).toMatch(/3\/4/)
    expect(piece.fingeringEs).toMatch(/Derecha:/)
    expect(piece.fingeringEn).toMatch(/Right hand:/)
  })

  it('tiene una sola mano y dieciséis compases de 3/4 en Sol mayor', async () => {
    const piece = await amazingGrace()
    const right = piece.hands.right
    expect(right).toBeDefined()
    expect(piece.hands.left).toBeUndefined()
    expect(piece.hands.both).toBeUndefined()
    if (right === undefined) throw new Error('Falta la mano derecha')

    expect(right.clef).toBe('treble')
    expect(right.key).toBe('G')
    expect(right.mode).toBe('major')
    expect(right.timeSignature).toEqual({ numerator: 3, denominator: 4 })
    expect(right.tempoBpm).toBe(72)
    expect(right.events).toHaveLength(27)
    expect(right.pedals).toEqual([])

    const measures = new Set(right.events.map((event) => event.measure))
    expect([...measures].sort((a, b) => a - b)).toEqual(
      Array.from({ length: 16 }, (_, index) => index + 1),
    )
    expect(right.events.every((event) => event.hand === 'right')).toBe(true)

    const totals = new Map<number, number>()
    for (const event of right.events) {
      totals.set(
        event.measure,
        (totals.get(event.measure) ?? 0) + rhythmicValueBeats(event.value),
      )
    }
    for (const [measure, total] of totals) {
      expect(total, `compás ${measure}`).toBeCloseTo(3, 9)
    }

    const ids = right.events.map((event) => event.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('transcribe la melodía de New Britain nota por nota', async () => {
    const piece = await amazingGrace()
    const right = piece.hands.right
    if (right === undefined) throw new Error('Falta la mano derecha')

    const timeline = scoreToTimeline(right)
    expect(timeline).toHaveLength(27)
    expect(timeline.map((event) => event.midis[0])).toEqual(MELODY_MIDIS)
    expect(timeline[0]?.time).toBe(0)

    const beat = 60 / right.tempoBpm
    const last = timeline[timeline.length - 1]
    expect(last).toBeDefined()
    expect((last?.time ?? 0) + (last?.duration ?? 0)).toBeCloseTo(48 * beat, 9)
    expect((last?.time ?? 0) + (last?.duration ?? 0)).toBeCloseTo(40, 9)

    // La nota más aguda de la melodía llega a Re5 en el compás 7.
    expect(Math.max(...timeline.flatMap((event) => event.midis))).toBe(74)
  })

  it('renderiza las notas de la mano derecha sin errores', async () => {
    const piece = await amazingGrace()
    const container = document.createElement('div')

    const result = await renderGrandStaff(container, {
      right: piece.hands.right,
      left: piece.hands.left,
      width: 640,
    })

    expect(result.notes).toHaveLength(27)
    expect(container.querySelector('svg')).not.toBeNull()
    expect(container.querySelectorAll('[data-hand="right"]')).toHaveLength(27)
    expect(container.querySelectorAll('[data-hand="left"]')).toHaveLength(0)
    expect(
      container.querySelector('[data-grand-note]')?.getAttribute('data-measure'),
    ).toBe('1')
  })

  it('el reproductor la reproduce y deshabilita la mano que no existe', async () => {
    const piece = await amazingGrace()
    const { engine, mocks } = stubEngine()
    const user = userEvent.setup()

    render(
      <SettingsProvider initialSettings={DEFAULT_SETTINGS}>
        <RepertoirePlayer piece={piece} engine={engine} audio={audioState()} />
      </SettingsProvider>,
    )

    expect(screen.getByRole('radio', { name: 'Ambas' })).toBeChecked()
    const left = screen.getByRole('radio', {
      name: 'Izquierda',
    }) as HTMLInputElement
    expect(left.disabled).toBe(true)
    expect(
      screen.getByText(/Ambas · compases 1–16 · 72 BPM \(100 %\)/),
    ).toBeInTheDocument()

    await waitFor(() =>
      expect(document.querySelectorAll('[data-grand-note]').length).toBe(27),
    )

    await user.click(screen.getByRole('button', { name: 'Reproducir' }))
    expect(mocks.playTimeline).toHaveBeenCalledTimes(1)
    const [events, options] = mocks.playTimeline.mock.calls[0] ?? []
    expect(events).toHaveLength(27)
    expect(options?.repeat).toBe(false)
    expect(options?.duration).toBeCloseTo(40, 9)

    await user.click(screen.getByRole('button', { name: 'Detener' }))
    expect(mocks.stop).toHaveBeenCalledTimes(1)
  })
})
