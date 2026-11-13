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

const PIECE_ID = 'piece.traditional.auld-lang-syne'

const MELODY_MIDIS = [
  // Primera parte
  67, 67, 67, 71,
  69, 67, 69, 71,
  67, 67, 71, 74,
  76, 76, 76, 79,
  74, 71, 71, 67,
  69, 67, 69, 71,
  67, 64, 64, 62,
  67,
  // Segunda parte
  74, 71, 71, 67,
  69, 67, 69, 76,
  74, 71, 71, 74,
  76, 76, 76, 79,
  74, 71, 71, 67,
  69, 67, 69, 71,
  67, 64, 64, 62,
  67,
]

const BASS_MIDIS = [
  43, 50, 43, 48, 43, 50, 40, 43,
  43, 50, 43, 48, 43, 50, 40, 43,
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

async function auldLangSyne() {
  return loadRepertoirePiece(PIECE_ID)
}

describe('F5-029 — Auld Lang Syne', () => {
  it('publica la melodía tradicional con ficha de dominio público', async () => {
    const piece = await auldLangSyne()

    expect(piece.id).toBe(PIECE_ID)
    expect(piece.title).toBe('Auld Lang Syne')
    expect(piece.composerDisplay).toBe('Anónimo tradicional')
    expect(piece.level).toBe(2)
    expect(piece.durationSeconds).toBe(48)
    expect(piece.tags).toContain('tradicional')
    expect(piece.tags).toContain('escocia')

    expect(piece.license.license).toBe('public-domain')
    expect(piece.license.composer).toEqual({
      name: 'Anónimo tradicional',
      birthYear: null,
      deathYear: null,
      anonymousTraditional: true,
    })
    expect(piece.license.source).toMatch(/1799|Select Collection/)
    expect(piece.license.sourceUrl).toBe(
      'https://en.wikipedia.org/wiki/Auld_Lang_Syne',
    )
    expect(piece.license.transcriptionAuthor).toBe('Piano Today')
    expect(piece.license.transcriptionDate).toBe('2026-11-13')
    expect(piece.license.attribution).toMatch(/melodía tradicional escocesa/)
    expect(piece.license.attribution).toMatch(/Piano Today/)
    expect(piece.license.verifiedBy).toBe('Piano Today')
    expect(piece.license.verifiedOn).toBe('2026-11-13')
    expect(piece.license.notes).toMatch(/Robert Burns/)
    expect(piece.license.notes).toMatch(/armonizaciones corales modernas/)
    expect(piece.notesEs).toMatch(/Sol mayor/)
    expect(piece.notesEn).toMatch(/G major/)
    expect(piece.fingeringEs).toMatch(/Derecha:/)
    expect(piece.fingeringEs).toMatch(/Izquierda:/)
    expect(piece.fingeringEn).toMatch(/Right hand:/)
    expect(piece.fingeringEn).toMatch(/Left hand:/)
  })

  it('valida la tonalidad de Sol mayor y los dieciséis compases', async () => {
    const piece = await auldLangSyne()
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
      expect(score.key).toBe('G')
      expect(score.mode).toBe('major')
      expect(score.timeSignature).toEqual({ numerator: 4, denominator: 4 })
      expect(score.tempoBpm).toBe(80)
      expect(score.pedals).toEqual([])

      const measures = new Set(score.events.map((event) => event.measure))
      expect([...measures].sort((a, b) => a - b)).toEqual(
        Array.from({ length: 16 }, (_, index) => index + 1),
      )
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

    expect(right.events).toHaveLength(58)
    expect(left.events).toHaveLength(16)
    expect(left.events.every((event) => event.value.duration === 'whole')).toBe(
      true,
    )
  })

  it('transcribe la melodía y el bajo nota por nota', async () => {
    const piece = await auldLangSyne()
    const right = piece.hands.right
    const left = piece.hands.left
    if (right === undefined || left === undefined) {
      throw new Error('Faltan las manos')
    }

    const melody = scoreToTimeline(right)
    const bass = scoreToTimeline(left)
    expect(melody).toHaveLength(58)
    expect(melody.map((event) => event.midis[0])).toEqual(MELODY_MIDIS)
    expect(bass).toHaveLength(16)
    expect(bass.map((event) => event.midis[0])).toEqual(BASS_MIDIS)

    const beat = 60 / right.tempoBpm
    const last = melody[melody.length - 1]
    expect(last).toBeDefined()
    expect((last?.time ?? 0) + (last?.duration ?? 0)).toBeCloseTo(64 * beat, 9)
    expect((last?.time ?? 0) + (last?.duration ?? 0)).toBeCloseTo(48, 9)

    // Cada frase termina en Sol: compases 8 y 16.
    expect(melody[28]?.midis[0]).toBe(67)
    expect(bass[7]?.midis[0]).toBe(43)
    expect(bass[15]?.midis[0]).toBe(43)
  })

  it('renderiza las dos manos en el gran pentagrama', async () => {
    const piece = await auldLangSyne()
    const container = document.createElement('div')

    const result = await renderGrandStaff(container, {
      right: piece.hands.right,
      left: piece.hands.left,
      width: 640,
    })

    expect(result.notes).toHaveLength(74)
    expect(container.querySelector('svg')).not.toBeNull()
    expect(container.querySelectorAll('[data-hand="right"]')).toHaveLength(58)
    expect(container.querySelectorAll('[data-hand="left"]')).toHaveLength(16)
    expect(
      container.querySelector('[data-grand-note]')?.getAttribute('data-measure'),
    ).toBe('1')
  })

  it('el reproductor permite elegir manos, tempo y compases', async () => {
    const piece = await auldLangSyne()
    const { engine, mocks } = stubEngine()
    const user = userEvent.setup()

    render(
      <SettingsProvider initialSettings={DEFAULT_SETTINGS}>
        <RepertoirePlayer piece={piece} engine={engine} audio={audioState()} />
      </SettingsProvider>,
    )

    expect(screen.getByRole('radio', { name: 'Ambas' })).toBeChecked()
    expect(
      screen.getByText(/Ambas · compases 1–16 · 80 BPM \(100 %\)/),
    ).toBeInTheDocument()

    await waitFor(() =>
      expect(document.querySelectorAll('[data-grand-note]').length).toBe(74),
    )

    await user.click(screen.getByRole('button', { name: 'Reproducir' }))
    expect(mocks.playTimeline).toHaveBeenCalledTimes(1)
    const [events, options] = mocks.playTimeline.mock.calls[0] ?? []
    expect(events).toHaveLength(74)
    expect(options?.repeat).toBe(false)
    expect(options?.duration).toBeCloseTo(48, 9)

    await user.click(screen.getByRole('button', { name: 'Detener' }))
    expect(mocks.stop).toHaveBeenCalledTimes(1)

    mocks.playTimeline.mockClear()
    await user.click(screen.getByRole('radio', { name: 'Derecha' }))
    expect(
      screen.getByText(/Derecha · compases 1–16 · 80 BPM \(100 %\)/),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Reproducir' }))
    const [rightEvents] = mocks.playTimeline.mock.calls[0] ?? []
    expect(rightEvents).toHaveLength(58)

    await user.click(screen.getByRole('button', { name: 'Detener' }))
    expect(mocks.stop).toHaveBeenCalledTimes(2)
  })
})
