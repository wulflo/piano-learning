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

const PIECE_ID = 'piece.traditional.frere-jacques'

const MELODY_MIDIS = [
  60, 62, 64, 60, // Frè-re Jac-ques
  60, 62, 64, 60, // Frè-re Jac-ques
  64, 65, 67, // Dor-mez-vous
  64, 65, 67, // Dor-mez-vous
  67, 69, 67, 65, // Son-nez les ma-ti
  64, 60, // -nes
  60, 55, 60, // Ding dang dong
  60, 55, 60, // Ding dang dong
]

const BASS_MIDIS = [48, 48, 48, 48, 53, 48, 43, 48]

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

async function frereJacques() {
  return loadRepertoirePiece(PIECE_ID)
}

describe('F5-027 — Frère Jacques', () => {
  it('publica la pieza con una ficha de dominio público completa', async () => {
    const piece = await frereJacques()

    expect(piece.id).toBe(PIECE_ID)
    expect(piece.title).toBe('Frère Jacques')
    expect(piece.composerDisplay).toBe('Anónimo tradicional')
    expect(piece.level).toBe(2)
    expect(piece.durationSeconds).toBe(24)
    expect(piece.tags).toContain('tradicional')
    expect(piece.tags).toContain('dos manos')

    expect(piece.license.license).toBe('public-domain')
    expect(piece.license.composer).toEqual({
      name: 'Anónimo tradicional',
      birthYear: null,
      deathYear: null,
      anonymousTraditional: true,
    })
    expect(piece.license.source).toMatch(/Frère Jacques|Recueil de Timbres/)
    expect(piece.license.sourceUrl).toBe(
      'https://en.wikipedia.org/wiki/Fr%C3%A8re_Jacques',
    )
    expect(piece.license.transcriptionAuthor).toBe('PianoDesdeCero')
    expect(piece.license.transcriptionDate).toBe('2026-11-13')
    expect(piece.license.attribution).toMatch(/ronda tradicional anónima/)
    expect(piece.license.attribution).toMatch(/PianoDesdeCero/)
    expect(piece.license.verifiedBy).toBe('PianoDesdeCero')
    expect(piece.license.verifiedOn).toBe('2026-11-13')
    expect(piece.license.notes).toMatch(/Rameau/)
    expect(piece.notesEs).toMatch(/dos manos/)
    expect(piece.notesEn).toMatch(/both hands/)
    expect(piece.fingeringEs).toMatch(/Derecha:/)
    expect(piece.fingeringEs).toMatch(/Izquierda:/)
    expect(piece.fingeringEn).toMatch(/Right hand:/)
    expect(piece.fingeringEn).toMatch(/Left hand:/)
  })

  it('tiene melodía y bajo simple en ocho compases completos', async () => {
    const piece = await frereJacques()
    const right = piece.hands.right
    const left = piece.hands.left
    expect(right).toBeDefined()
    expect(left).toBeDefined()
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
      expect(score.timeSignature).toEqual({ numerator: 4, denominator: 4 })
      expect(score.tempoBpm).toBe(80)
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

    expect(right.events).toHaveLength(26)
    expect(left.events).toHaveLength(8)
    expect(left.events.every((event) => event.value.duration === 'whole')).toBe(
      true,
    )
  })

  it('transcribe la melodía y el bajo nota por nota', async () => {
    const piece = await frereJacques()
    const right = piece.hands.right
    const left = piece.hands.left
    if (right === undefined || left === undefined) {
      throw new Error('Faltan las manos')
    }

    const melody = scoreToTimeline(right)
    const bass = scoreToTimeline(left)
    expect(melody).toHaveLength(26)
    expect(melody.map((event) => event.midis[0])).toEqual(MELODY_MIDIS)
    expect(bass).toHaveLength(8)
    expect(bass.map((event) => event.midis[0])).toEqual(BASS_MIDIS)

    const beat = 60 / right.tempoBpm
    const last = melody[melody.length - 1]
    expect(last).toBeDefined()
    expect((last?.time ?? 0) + (last?.duration ?? 0)).toBeCloseTo(32 * beat, 9)

    const bassEnd = bass[bass.length - 1]
    expect(bassEnd).toBeDefined()
    expect((bassEnd?.time ?? 0) + (bassEnd?.duration ?? 0)).toBeCloseTo(
      32 * beat,
      9,
    )
    expect((bassEnd?.time ?? 0) + (bassEnd?.duration ?? 0)).toBeCloseTo(24, 9)

    // Las dos manos empiezan juntas y el bajo cambia en los compases 5 y 7.
    expect(melody[0]?.time).toBe(0)
    expect(bass[0]?.time).toBe(0)
    expect(bass[4]?.time).toBeCloseTo(16 * beat, 9)
    expect(bass[6]?.time).toBeCloseTo(24 * beat, 9)
  })

  it('renderiza las dos manos en el gran pentagrama', async () => {
    const piece = await frereJacques()
    const container = document.createElement('div')

    const result = await renderGrandStaff(container, {
      right: piece.hands.right,
      left: piece.hands.left,
      width: 640,
    })

    expect(result.notes).toHaveLength(34)
    expect(container.querySelector('svg')).not.toBeNull()
    expect(container.querySelectorAll('[data-hand="right"]')).toHaveLength(26)
    expect(container.querySelectorAll('[data-hand="left"]')).toHaveLength(8)
    expect(
      container.querySelector('[data-grand-note]')?.getAttribute('data-measure'),
    ).toBe('1')
  })

  it('el reproductor permite elegir manos, tempo y compases', async () => {
    const piece = await frereJacques()
    const { engine, mocks } = stubEngine()
    const user = userEvent.setup()

    render(
      <SettingsProvider initialSettings={DEFAULT_SETTINGS}>
        <RepertoirePlayer piece={piece} engine={engine} audio={audioState()} />
      </SettingsProvider>,
    )

    expect(screen.getByRole('radio', { name: 'Ambas' })).toBeChecked()
    expect(
      screen.getByRole('radio', { name: 'Izquierda' }),
    ).not.toBeDisabled()
    expect(
      screen.getByText(/Ambas · compases 1–8 · 80 BPM \(100 %\)/),
    ).toBeInTheDocument()

    await waitFor(() =>
      expect(document.querySelectorAll('[data-grand-note]').length).toBe(34),
    )

    await user.click(screen.getByRole('button', { name: 'Reproducir' }))
    expect(mocks.playTimeline).toHaveBeenCalledTimes(1)
    const [events, options] = mocks.playTimeline.mock.calls[0] ?? []
    expect(events).toHaveLength(34)
    expect(options?.repeat).toBe(false)
    expect(options?.duration).toBeCloseTo(24, 9)

    mocks.playTimeline.mockClear()
    await user.click(screen.getByRole('button', { name: 'Detener' }))
    expect(mocks.stop).toHaveBeenCalledTimes(1)
    await user.click(screen.getByRole('radio', { name: 'Derecha' }))
    expect(
      screen.getByText(/Derecha · compases 1–8 · 80 BPM \(100 %\)/),
    ).toBeInTheDocument()
    // El gran pentagrama sigue mostrando las dos manos; la selección afecta
    // al audio y al resumen, no a lo que se dibuja.
    expect(document.querySelectorAll('[data-grand-note]').length).toBe(34)
    await user.click(screen.getByRole('button', { name: 'Reproducir' }))
    const [rightEvents] = mocks.playTimeline.mock.calls[0] ?? []
    expect(rightEvents).toHaveLength(26)

    await user.click(screen.getByRole('button', { name: 'Detener' }))
    expect(mocks.stop).toHaveBeenCalledTimes(2)
  })
})
