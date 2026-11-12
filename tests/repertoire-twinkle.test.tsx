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

const PIECE_ID = 'piece.traditional.twinkle'

const MELODY_MIDIS = [
  60, 60, 67, 67, // Do Do Sol Sol
  69, 69, 67, // La La Sol
  65, 65, 64, 64, // Fa Fa Mi Mi
  62, 62, 60, // Re Re Do
  67, 67, 65, 65, // Sol Sol Fa Fa
  64, 64, 62, // Mi Mi Re
  67, 67, 65, 65, // Sol Sol Fa Fa
  64, 64, 62, // Mi Mi Re
  60, 60, 67, 67, // Do Do Sol Sol
  69, 69, 67, // La La Sol
  65, 65, 64, 64, // Fa Fa Mi Mi
  62, 62, 60, // Re Re Do
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

async function twinkle() {
  return loadRepertoirePiece(PIECE_ID)
}

describe('F5-026 — Twinkle, Twinkle, Little Star', () => {
  it('publica la pieza con una ficha de dominio público completa', async () => {
    const piece = await twinkle()

    expect(piece.id).toBe(PIECE_ID)
    expect(piece.title).toBe('Twinkle, Twinkle, Little Star')
    expect(piece.composerDisplay).toBe('Anónimo tradicional')
    expect(piece.level).toBe(1)
    expect(piece.durationSeconds).toBe(40)
    expect(piece.tags).toContain('tradicional')
    expect(piece.tags).toContain('mano derecha')

    expect(piece.license.license).toBe('public-domain')
    expect(piece.license.composer).toEqual({
      name: 'Anónimo tradicional',
      birthYear: null,
      deathYear: null,
      anonymousTraditional: true,
    })
    expect(piece.license.source).toMatch(/Ah! vous dirai-je, maman/)
    expect(piece.license.sourceUrl).toBe(
      'https://en.wikipedia.org/wiki/Ah!_vous_dirai-je,_maman',
    )
    expect(piece.license.transcriptionAuthor).toBe('PianoDesdeCero')
    expect(piece.license.transcriptionDate).toBe('2026-11-13')
    expect(piece.license.attribution).toMatch(/melodía tradicional anónima/)
    expect(piece.license.attribution).toMatch(/PianoDesdeCero/)
    expect(piece.license.verifiedBy).toBe('PianoDesdeCero')
    expect(piece.license.verifiedOn).toBe('2026-11-13')
    expect(piece.license.notes).toMatch(/variaciones de Mozart/)
    expect(piece.notesEs).toMatch(/mano derecha/)
    expect(piece.notesEn).toMatch(/right hand/)
    expect(piece.fingeringEs).toMatch(/Derecha:/)
    expect(piece.fingeringEn).toMatch(/Right hand:/)
  })

  it('tiene una sola mano y doce compases completos en Do mayor', async () => {
    const piece = await twinkle()
    const right = piece.hands.right
    expect(right).toBeDefined()
    expect(piece.hands.left).toBeUndefined()
    expect(piece.hands.both).toBeUndefined()
    if (right === undefined) throw new Error('Falta la mano derecha')

    expect(right.clef).toBe('treble')
    expect(right.key).toBe('C')
    expect(right.mode).toBe('major')
    expect(right.timeSignature).toEqual({ numerator: 4, denominator: 4 })
    expect(right.tempoBpm).toBe(72)
    expect(right.events).toHaveLength(42)
    expect(right.pedals).toEqual([])

    const measures = new Set(right.events.map((event) => event.measure))
    expect([...measures].sort((a, b) => a - b)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
    ])
    expect(right.events.every((event) => event.hand === 'right')).toBe(true)

    const totals = new Map<number, number>()
    for (const event of right.events) {
      totals.set(
        event.measure,
        (totals.get(event.measure) ?? 0) + rhythmicValueBeats(event.value),
      )
    }
    for (const [measure, total] of totals) {
      expect(total, `compás ${measure}`).toBeCloseTo(4, 9)
    }

    const ids = right.events.map((event) => event.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('transcribe la melodía tradicional nota por nota', async () => {
    const piece = await twinkle()
    const right = piece.hands.right
    if (right === undefined) throw new Error('Falta la mano derecha')

    const timeline = scoreToTimeline(right)
    expect(timeline).toHaveLength(42)
    expect(timeline.map((event) => event.midis[0])).toEqual(MELODY_MIDIS)
    expect(timeline[0]?.time).toBe(0)

    const beat = 60 / right.tempoBpm
    for (const [index, event] of timeline.entries()) {
      expect(event.duration, `evento ${index}`).toBeGreaterThan(0)
      expect(event.midis).toHaveLength(1)
      for (const midi of event.midis) {
        expect(midi, `evento ${index}`).toBeGreaterThanOrEqual(21)
        expect(midi, `evento ${index}`).toBeLessThanOrEqual(108)
      }
    }

    // Cada frase termina en blanca; el resto son negras.
    const byMeasure = new Map<number, TimelineEvent[]>()
    for (const [index, event] of timeline.entries()) {
      const measure = right.events[index]?.measure
      if (measure === undefined) throw new Error(`Evento ${index} sin compás`)
      const group = byMeasure.get(measure) ?? []
      group.push(event)
      byMeasure.set(measure, group)
    }

    for (const measure of [2, 4, 6, 8, 10, 12]) {
      const last = byMeasure.get(measure)?.at(-1)
      expect(last, `compás ${measure}`).toBeDefined()
      expect(last?.duration, `compás ${measure}`).toBeCloseTo(2 * beat, 9)
    }
    expect(byMeasure.size).toBe(12)

    const last = timeline[timeline.length - 1]
    expect(last).toBeDefined()
    expect((last?.time ?? 0) + (last?.duration ?? 0)).toBeCloseTo(48 * beat, 9)
  })

  it('renderiza las 42 notas de la mano derecha sin errores', async () => {
    const piece = await twinkle()
    const container = document.createElement('div')

    const result = await renderGrandStaff(container, {
      right: piece.hands.right,
      left: piece.hands.left,
      width: 640,
    })

    expect(result.notes).toHaveLength(42)
    expect(container.querySelector('svg')).not.toBeNull()
    expect(container.querySelectorAll('[data-hand="right"]')).toHaveLength(42)
    expect(container.querySelectorAll('[data-hand="left"]')).toHaveLength(0)
    expect(
      container.querySelector('[data-grand-note]')?.getAttribute('data-measure'),
    ).toBe('1')
  })

  it('el reproductor la reproduce y deshabilita la mano que no existe', async () => {
    const piece = await twinkle()
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
      screen.getByText(/Ambas · compases 1–12 · 72 BPM \(100 %\)/),
    ).toBeInTheDocument()

    await waitFor(() =>
      expect(document.querySelectorAll('[data-grand-note]').length).toBe(42),
    )

    await user.click(screen.getByRole('button', { name: 'Reproducir' }))
    expect(mocks.playTimeline).toHaveBeenCalledTimes(1)
    const [events, options] = mocks.playTimeline.mock.calls[0] ?? []
    expect(events).toHaveLength(42)
    expect(options?.repeat).toBe(false)
    expect(options?.duration).toBeCloseTo(40, 9)

    await user.click(screen.getByRole('button', { name: 'Detener' }))
    expect(mocks.stop).toHaveBeenCalledTimes(1)
  })
})
