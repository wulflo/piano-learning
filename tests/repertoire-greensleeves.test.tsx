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

const PIECE_ID = 'piece.traditional.greensleeves'

const MELODY_MIDIS = [
  // Frase A
  60, 62, 64, 65, 64, // Alas, my love
  62, 59, 55, 57, 59, // you do me wrong
  60, 57, 57, 56, 57, // to cast me off
  59, 56, 52, // discourteously
  60, 62, 64, 65, 64,
  62, 59, 55, 57, 59,
  60, 59, 57, 56, 54, 56, // cadencia con G# y F#
  57,
  // Frase B
  67, 67, 66, 64, // For I have loved
  62, 59, 55, 57, 59,
  60, 57, 57, 56, 57,
  59, 56, 52,
  67, 67, 66, 64,
  62, 59, 55, 57, 59,
  60, 59, 57, 56, 54, 56,
  57,
]

const BASS_MIDIS = [
  45, 52, 43, 50, 45, 52, 40, 47,
  45, 52, 43, 50, 40, 47, 45, 52,
  48, 55, 43, 50, 45, 52, 40, 47,
  48, 55, 43, 50, 40, 47, 45, 52,
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

async function greensleeves() {
  return loadRepertoirePiece(PIECE_ID)
}

describe('F5-028 — Greensleeves', () => {
  it('publica una versión propia con la ficha de dominio público completa', async () => {
    const piece = await greensleeves()

    expect(piece.id).toBe(PIECE_ID)
    expect(piece.title).toBe('Greensleeves')
    expect(piece.composerDisplay).toBe('Anónimo tradicional')
    expect(piece.level).toBe(3)
    expect(piece.durationSeconds).toBe(48)
    expect(piece.tags).toContain('tradicional')
    expect(piece.tags).toContain('dos manos')

    expect(piece.license.license).toBe('public-domain')
    expect(piece.license.composer).toEqual({
      name: 'Anónimo tradicional',
      birthYear: null,
      deathYear: null,
      anonymousTraditional: true,
    })
    expect(piece.license.source).toMatch(/1580|Stationers/)
    expect(piece.license.sourceUrl).toBe(
      'https://en.wikipedia.org/wiki/Greensleeves',
    )
    expect(piece.license.transcriptionAuthor).toBe('Piano Today')
    expect(piece.license.transcriptionDate).toBe('2026-11-13')
    expect(piece.license.attribution).toMatch(/versión simplificada/)
    expect(piece.license.attribution).toMatch(/Piano Today/)
    expect(piece.license.verifiedBy).toBe('Piano Today')
    expect(piece.license.verifiedOn).toBe('2026-11-13')
    expect(piece.license.notes).toMatch(/Vaughan Williams/)
    expect(piece.notesEs).toMatch(/6\/8/)
    expect(piece.notesEn).toMatch(/6\/8/)
    expect(piece.fingeringEs).toMatch(/Derecha:/)
    expect(piece.fingeringEs).toMatch(/Izquierda:/)
    expect(piece.fingeringEn).toMatch(/Right hand:/)
    expect(piece.fingeringEn).toMatch(/Left hand:/)
  })

  it('tiene dieciséis compases de 6/8 completos en La menor', async () => {
    const piece = await greensleeves()
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
      expect(score.key).toBe('A')
      expect(score.mode).toBe('minor')
      expect(score.timeSignature).toEqual({ numerator: 6, denominator: 8 })
      expect(score.tempoBpm).toBe(60)
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
        expect(total, `${hand} compás ${measure}`).toBeCloseTo(3, 9)
      }

      const ids = score.events.map((event) => event.id)
      expect(new Set(ids).size).toBe(ids.length)
    }

    expect(right.events).toHaveLength(68)
    expect(left.events).toHaveLength(32)
    expect(left.events.every((event) => event.value.dots === 1)).toBe(true)
  })

  it('transcribe la melodía con sus accidentales y el bajo propio', async () => {
    const piece = await greensleeves()
    const right = piece.hands.right
    const left = piece.hands.left
    if (right === undefined || left === undefined) {
      throw new Error('Faltan las manos')
    }

    const melody = scoreToTimeline(right)
    const bass = scoreToTimeline(left)
    expect(melody).toHaveLength(68)
    expect(melody.map((event) => event.midis[0])).toEqual(MELODY_MIDIS)
    expect(bass).toHaveLength(32)
    expect(bass.map((event) => event.midis[0])).toEqual(BASS_MIDIS)

    const accidentals = right.events
      .flatMap((event) => event.pitches)
      .filter((pitch) => pitch.accidental === '#')
      .map((pitch) => `${pitch.step}#${pitch.octave}`)
    expect(accidentals).toContain('G#3')
    expect(accidentals).toContain('F#3')

    const beat = 60 / right.tempoBpm
    const last = melody[melody.length - 1]
    expect(last).toBeDefined()
    expect((last?.time ?? 0) + (last?.duration ?? 0)).toBeCloseTo(48 * beat, 9)
    expect((last?.time ?? 0) + (last?.duration ?? 0)).toBeCloseTo(48, 9)

    // El bajo cambia de fundamental en la frase B (compás 9) y vuelve a La.
    expect(bass[0]?.time).toBe(0)
    expect(bass[16]?.time).toBeCloseTo(24 * beat, 9)
    expect(bass[30]?.time).toBeCloseTo(45 * beat, 9)
  })

  it('renderiza las dos manos en el gran pentagrama', async () => {
    const piece = await greensleeves()
    const container = document.createElement('div')

    const result = await renderGrandStaff(container, {
      right: piece.hands.right,
      left: piece.hands.left,
      width: 640,
    })

    expect(result.notes).toHaveLength(100)
    expect(container.querySelector('svg')).not.toBeNull()
    expect(container.querySelectorAll('[data-hand="right"]')).toHaveLength(68)
    expect(container.querySelectorAll('[data-hand="left"]')).toHaveLength(32)
    expect(
      container.querySelector('[data-grand-note]')?.getAttribute('data-measure'),
    ).toBe('1')
  })

  it('el reproductor permite elegir manos, tempo y compases', async () => {
    const piece = await greensleeves()
    const { engine, mocks } = stubEngine()
    const user = userEvent.setup()

    render(
      <SettingsProvider initialSettings={DEFAULT_SETTINGS}>
        <RepertoirePlayer piece={piece} engine={engine} audio={audioState()} />
      </SettingsProvider>,
    )

    expect(screen.getByRole('radio', { name: 'Ambas' })).toBeChecked()
    expect(
      screen.getByText(/Ambas · compases 1–16 · 60 BPM \(100 %\)/),
    ).toBeInTheDocument()

    await waitFor(() =>
      expect(document.querySelectorAll('[data-grand-note]').length).toBe(100),
    )

    await user.click(screen.getByRole('button', { name: 'Reproducir' }))
    expect(mocks.playTimeline).toHaveBeenCalledTimes(1)
    const [events, options] = mocks.playTimeline.mock.calls[0] ?? []
    expect(events).toHaveLength(100)
    expect(options?.repeat).toBe(false)
    expect(options?.duration).toBeCloseTo(48, 9)

    await user.click(screen.getByRole('button', { name: 'Detener' }))
    expect(mocks.stop).toHaveBeenCalledTimes(1)

    mocks.playTimeline.mockClear()
    await user.click(screen.getByRole('radio', { name: 'Izquierda' }))
    expect(
      screen.getByText(/Izquierda · compases 1–16 · 60 BPM \(100 %\)/),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Reproducir' }))
    const [leftEvents] = mocks.playTimeline.mock.calls[0] ?? []
    expect(leftEvents).toHaveLength(32)

    await user.click(screen.getByRole('button', { name: 'Detener' }))
    expect(mocks.stop).toHaveBeenCalledTimes(2)
  })
})
