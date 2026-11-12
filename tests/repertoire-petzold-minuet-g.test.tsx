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

const PIECE_ID = 'piece.petzold.minuet-g'

const MELODY_MIDIS = [
  // Primera sección
  74, 67, 69, 71, 72,
  74, 67, 67,
  76, 72, 74, 76, 77,
  79, 67, 67,
  72, 74, 72, 71, 69,
  71, 72, 71, 69, 67,
  65, 67, 69, 71, 67,
  69,
  74, 67, 69, 71, 72,
  74, 67, 67,
  76, 72, 74, 76, 77,
  79, 67, 67,
  72, 74, 72, 71, 69,
  71, 72, 71, 69, 67,
  69, 71, 69, 67, 65,
  67,
  // Segunda sección
  83, 79, 81, 83, 79,
  81, 74, 76, 77, 74,
  79, 76, 77, 79, 74,
  73, 71, 72, 69,
  69, 71, 73, 74, 76, 77,
  79, 77, 76,
  77, 69, 73,
  74,
  74, 67, 65, 67,
  76, 67, 65, 67,
  74, 72, 71,
  69, 67, 65, 67, 69,
  62, 64, 65, 67, 69, 71,
  72, 71, 69,
  71, 74, 67, 65,
  67,
]

const BASS_MIDIS = [
  43, 43, 48, 43, 45, 43, 50, 50,
  43, 43, 48, 43, 45, 43, 50, 43,
  43, 50, 40, 45, 45, 43, 50, 50,
  43, 48, 43, 50, 50, 48, 43, 43,
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

async function minuet() {
  return loadRepertoirePiece(PIECE_ID)
}

describe('F5-032 — Minueto en Sol, BWV Anh. 114 (Petzold)', () => {
  it('publica la pieza con la ficha de Petzold y aviso de atribución', async () => {
    const piece = await minuet()

    expect(piece.id).toBe(PIECE_ID)
    expect(piece.title).toBe('Minueto en Sol mayor, BWV Anh. 114')
    expect(piece.composerDisplay).toBe(
      'Christian Petzold (atribuido a J. S. Bach)',
    )
    expect(piece.level).toBe(3)
    expect(piece.durationSeconds).toBe(48)
    expect(piece.tags).toContain('barroco')
    expect(piece.tags).toContain('petzold')
    expect(piece.tags).toContain('dos manos')

    expect(piece.license.license).toBe('public-domain')
    expect(piece.license.composer).toEqual({
      name: 'Christian Petzold',
      birthYear: 1677,
      deathYear: 1733,
      anonymousTraditional: false,
    })
    expect(piece.license.source).toMatch(/Notebook for Anna Magdalena/)
    expect(piece.license.sourceUrl).toBe(
      'https://imslp.org/wiki/Minuet_in_G_major%2C_BWV_Anh.114_(Petzold%2C_Christian)',
    )
    expect(piece.license.transcriptionAuthor).toBe('PianoDesdeCero')
    expect(piece.license.transcriptionDate).toBe('2026-11-13')
    expect(piece.license.attribution).toMatch(/1677-1733/)
    expect(piece.license.attribution).toMatch(/PianoDesdeCero/)
    expect(piece.license.verifiedBy).toBe('PianoDesdeCero')
    expect(piece.license.verifiedOn).toBe('2026-11-13')
    expect(piece.license.notes).toMatch(/Petzold/)
    expect(piece.license.notes).toMatch(/Bärenreiter/)
    expect(piece.notesEs).toMatch(/3\/4/)
    expect(piece.notesEn).toMatch(/3\/4/)
    expect(piece.fingeringEs).toMatch(/Derecha:/)
    expect(piece.fingeringEs).toMatch(/Izquierda:/)
    expect(piece.fingeringEn).toMatch(/Right hand:/)
    expect(piece.fingeringEn).toMatch(/Left hand:/)
  })

  it('tiene dos manos y treinta y dos compases de 3/4 completos', async () => {
    const piece = await minuet()
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
      expect(score.timeSignature).toEqual({ numerator: 3, denominator: 4 })
      expect(score.tempoBpm).toBe(120)
      expect(score.pedals).toEqual([])

      const measures = new Set(score.events.map((event) => event.measure))
      expect([...measures].sort((a, b) => a - b)).toEqual(
        Array.from({ length: 32 }, (_, index) => index + 1),
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
        expect(total, `${hand} compás ${measure}`).toBeCloseTo(3, 9)
      }

      const ids = score.events.map((event) => event.id)
      expect(new Set(ids).size).toBe(ids.length)
    }

    expect(right.events).toHaveLength(126)
    expect(left.events).toHaveLength(32)
    expect(left.events.every((event) => event.value.duration === 'half')).toBe(
      true,
    )
    expect(left.events.every((event) => event.value.dots === 1)).toBe(true)
  })

  it('transcribe la melodía con sus Do sostenidos y el bajo', async () => {
    const piece = await minuet()
    const right = piece.hands.right
    const left = piece.hands.left
    if (right === undefined || left === undefined) {
      throw new Error('Faltan las manos')
    }

    const melody = scoreToTimeline(right)
    const bass = scoreToTimeline(left)
    expect(melody).toHaveLength(126)
    expect(melody.map((event) => event.midis[0])).toEqual(MELODY_MIDIS)
    expect(bass).toHaveLength(32)
    expect(bass.map((event) => event.midis[0])).toEqual(BASS_MIDIS)

    const sharps = right.events
      .flatMap((event) => ({ event, pitches: event.pitches }))
      .flatMap(({ event, pitches }) =>
        pitches
          .filter((pitch) => pitch.accidental === '#')
          .map((pitch) => ({ measure: event.measure, pitch })),
      )
    expect(sharps.map(({ measure }) => measure)).toEqual([20, 21, 23])
    expect(
      sharps.every(
        ({ pitch }) => pitch.step === 'C' && pitch.octave === 5,
      ),
    ).toBe(true)

    const beat = 60 / right.tempoBpm
    const last = melody[melody.length - 1]
    expect(last).toBeDefined()
    expect((last?.time ?? 0) + (last?.duration ?? 0)).toBeCloseTo(96 * beat, 9)
    expect((last?.time ?? 0) + (last?.duration ?? 0)).toBeCloseTo(48, 9)

    // La segunda sección empieza en el compás 17 con Sol y pasa a Re en el 18.
    expect(bass[16]?.time).toBeCloseTo(48 * beat, 9)
    expect(bass[16]?.midis[0]).toBe(43)
    expect(bass[17]?.midis[0]).toBe(50)
  })

  it('renderiza las dos manos con 158 notas en el gran pentagrama', async () => {
    const piece = await minuet()
    const container = document.createElement('div')

    const result = await renderGrandStaff(container, {
      right: piece.hands.right,
      left: piece.hands.left,
      width: 640,
    })

    expect(result.notes).toHaveLength(158)
    expect(container.querySelector('svg')).not.toBeNull()
    expect(container.querySelectorAll('[data-hand="right"]')).toHaveLength(126)
    expect(container.querySelectorAll('[data-hand="left"]')).toHaveLength(32)
    expect(
      container.querySelector('[data-grand-note]')?.getAttribute('data-measure'),
    ).toBe('1')
  })

  it('el reproductor permite elegir manos, tempo y compases', async () => {
    const piece = await minuet()
    const { engine, mocks } = stubEngine()
    const user = userEvent.setup()

    render(
      <SettingsProvider initialSettings={DEFAULT_SETTINGS}>
        <RepertoirePlayer piece={piece} engine={engine} audio={audioState()} />
      </SettingsProvider>,
    )

    expect(screen.getByRole('radio', { name: 'Ambas' })).toBeChecked()
    expect(
      screen.getByText(/Ambas · compases 1–32 · 120 BPM \(100 %\)/),
    ).toBeInTheDocument()

    await waitFor(() =>
      expect(document.querySelectorAll('[data-grand-note]').length).toBe(158),
    )

    await user.click(screen.getByRole('button', { name: 'Reproducir' }))
    expect(mocks.playTimeline).toHaveBeenCalledTimes(1)
    const [events, options] = mocks.playTimeline.mock.calls[0] ?? []
    expect(events).toHaveLength(158)
    expect(options?.repeat).toBe(false)
    expect(options?.duration).toBeCloseTo(48, 9)

    await user.click(screen.getByRole('button', { name: 'Detener' }))
    expect(mocks.stop).toHaveBeenCalledTimes(1)

    mocks.playTimeline.mockClear()
    await user.click(screen.getByRole('radio', { name: 'Izquierda' }))
    expect(
      screen.getByText(/Izquierda · compases 1–32 · 120 BPM \(100 %\)/),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Reproducir' }))
    const [leftEvents] = mocks.playTimeline.mock.calls[0] ?? []
    expect(leftEvents).toHaveLength(32)

    await user.click(screen.getByRole('button', { name: 'Detener' }))
    expect(mocks.stop).toHaveBeenCalledTimes(2)
  })
})
