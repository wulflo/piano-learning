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

const PIECE_ID = 'piece.beethoven.ode-to-joy'

const MELODY_MIDIS = [
  66, 66, 67, 69, // Freu-de, schö-ner
  69, 67, 66, 64, // Göt-ter-fun-ken
  62, 62, 64, 66, // Toch-ter aus
  66, 64, // E-ly-si-um
  66, 66, 67, 69,
  69, 67, 66, 64,
  62, 62, 64, 66,
  64, 62,
]

const BASS_MIDIS = [50, 45, 50, 45, 50, 45, 50, 50]

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

async function odeToJoy() {
  return loadRepertoirePiece(PIECE_ID)
}

describe('F5-031 — Oda a la alegría', () => {
  it('publica una transcripción propia con ficha de Beethoven', async () => {
    const piece = await odeToJoy()

    expect(piece.id).toBe(PIECE_ID)
    expect(piece.title).toBe('Oda a la alegría')
    expect(piece.composerDisplay).toBe('Ludwig van Beethoven')
    expect(piece.level).toBe(2)
    expect(piece.durationSeconds).toBe(20)
    expect(piece.tags).toContain('clásica')
    expect(piece.tags).toContain('beethoven')

    expect(piece.license.license).toBe('public-domain')
    expect(piece.license.composer).toEqual({
      name: 'Ludwig van Beethoven',
      birthYear: 1770,
      deathYear: 1827,
      anonymousTraditional: false,
    })
    expect(piece.license.source).toMatch(/Sinfonía n.º 9|Op. 125/)
    expect(piece.license.sourceUrl).toBe(
      'https://imslp.org/wiki/Symphony_No.9%2C_Op.125_(Beethoven%2C_Ludwig_van)',
    )
    expect(piece.license.transcriptionAuthor).toBe('PianoDesdeCero')
    expect(piece.license.transcriptionDate).toBe('2026-11-13')
    expect(piece.license.attribution).toMatch(/1770-1827/)
    expect(piece.license.attribution).toMatch(/PianoDesdeCero/)
    expect(piece.license.verifiedBy).toBe('PianoDesdeCero')
    expect(piece.license.verifiedOn).toBe('2026-11-13')
    expect(piece.license.notes).toMatch(/Schiller/)
    expect(piece.notesEs).toMatch(/Re mayor/)
    expect(piece.notesEn).toMatch(/D major/)
    expect(piece.fingeringEs).toMatch(/Derecha:/)
    expect(piece.fingeringEs).toMatch(/Izquierda:/)
    expect(piece.fingeringEn).toMatch(/Right hand:/)
    expect(piece.fingeringEn).toMatch(/Left hand:/)
  })

  it('valida Re mayor y los ocho compases de 4/4', async () => {
    const piece = await odeToJoy()
    const right = piece.hands.right
    const left = piece.hands.left
    if (right === undefined || left === undefined) {
      throw new Error('Faltan las manos')
    }

    for (const [hand, score] of [
      ['right', right],
      ['left', left],
    ] as const) {
      expect(score.clef).toBe(hand === 'right' ? 'treble' : 'bass')
      expect(score.key).toBe('D')
      expect(score.mode).toBe('major')
      expect(score.timeSignature).toEqual({ numerator: 4, denominator: 4 })
      expect(score.tempoBpm).toBe(96)
      expect(score.pedals).toEqual([])

      const measures = new Set(score.events.map((event) => event.measure))
      expect([...measures].sort((a, b) => a - b)).toEqual([
        1, 2, 3, 4, 5, 6, 7, 8,
      ])
      expect(score.events.every((event) => event.hand === hand)).toBe(true)

      const totals = new Map<number, number>()
      for (const event of score.events) {
        totals.set(
          event.measure,
          (totals.get(event.measure) ?? 0) + rhythmicValueBeats(event.value),
        )
      }
      for (const [measure, total] of totals) {
        expect(total, `${hand} compás ${measure}`).toBeCloseTo(4, 9)
      }

      const ids = score.events.map((event) => event.id)
      expect(new Set(ids).size).toBe(ids.length)
    }

    expect(right.events).toHaveLength(28)
    expect(left.events).toHaveLength(8)
    expect(left.events.every((event) => event.value.duration === 'whole')).toBe(
      true,
    )
  })

  it('transcribe el tema con sus Fa sostenidos nota por nota', async () => {
    const piece = await odeToJoy()
    const right = piece.hands.right
    const left = piece.hands.left
    if (right === undefined || left === undefined) {
      throw new Error('Faltan las manos')
    }

    const melody = scoreToTimeline(right)
    const bass = scoreToTimeline(left)
    expect(melody).toHaveLength(28)
    expect(melody.map((event) => event.midis[0])).toEqual(MELODY_MIDIS)
    expect(bass).toHaveLength(8)
    expect(bass.map((event) => event.midis[0])).toEqual(BASS_MIDIS)

    const sharps = right.events
      .flatMap((event) => event.pitches)
      .filter((pitch) => pitch.accidental === '#')
      .map((pitch) => `${pitch.step}#${pitch.octave}`)
    expect(sharps).toContain('F#4')

    const beat = 60 / right.tempoBpm
    const last = melody[melody.length - 1]
    expect(last).toBeDefined()
    expect((last?.time ?? 0) + (last?.duration ?? 0)).toBeCloseTo(32 * beat, 9)
    expect((last?.time ?? 0) + (last?.duration ?? 0)).toBeCloseTo(20, 9)
  })

  it('renderiza las dos manos en el gran pentagrama', async () => {
    const piece = await odeToJoy()
    const container = document.createElement('div')

    const result = await renderGrandStaff(container, {
      right: piece.hands.right,
      left: piece.hands.left,
      width: 640,
    })

    expect(result.notes).toHaveLength(36)
    expect(container.querySelector('svg')).not.toBeNull()
    expect(container.querySelectorAll('[data-hand="right"]')).toHaveLength(28)
    expect(container.querySelectorAll('[data-hand="left"]')).toHaveLength(8)
    expect(
      container.querySelector('[data-grand-note]')?.getAttribute('data-measure'),
    ).toBe('1')
  })

  it('el reproductor permite elegir manos, tempo y compases', async () => {
    const piece = await odeToJoy()
    const { engine, mocks } = stubEngine()
    const user = userEvent.setup()

    render(
      <SettingsProvider initialSettings={DEFAULT_SETTINGS}>
        <RepertoirePlayer piece={piece} engine={engine} audio={audioState()} />
      </SettingsProvider>,
    )

    expect(screen.getByRole('radio', { name: 'Ambas' })).toBeChecked()
    expect(
      screen.getByText(/Ambas · compases 1–8 · 96 BPM \(100 %\)/),
    ).toBeInTheDocument()

    await waitFor(() =>
      expect(document.querySelectorAll('[data-grand-note]').length).toBe(36),
    )

    await user.click(screen.getByRole('button', { name: 'Reproducir' }))
    expect(mocks.playTimeline).toHaveBeenCalledTimes(1)
    const [events, options] = mocks.playTimeline.mock.calls[0] ?? []
    expect(events).toHaveLength(36)
    expect(options?.repeat).toBe(false)
    expect(options?.duration).toBeCloseTo(20, 9)

    await user.click(screen.getByRole('button', { name: 'Detener' }))
    expect(mocks.stop).toHaveBeenCalledTimes(1)

    mocks.playTimeline.mockClear()
    await user.click(screen.getByRole('radio', { name: 'Izquierda' }))
    expect(
      screen.getByText(/Izquierda · compases 1–8 · 96 BPM \(100 %\)/),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Reproducir' }))
    const [leftEvents] = mocks.playTimeline.mock.calls[0] ?? []
    expect(leftEvents).toHaveLength(8)

    await user.click(screen.getByRole('button', { name: 'Detener' }))
    expect(mocks.stop).toHaveBeenCalledTimes(2)
  })
})
