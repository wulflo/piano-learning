import { fireEvent, render, screen, waitFor } from '@testing-library/react'
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
import {
  hasPieceHand,
  MAX_TEMPO_PERCENT,
  MIN_TEMPO_PERCENT,
  normalizeMeasureRange,
  normalizeTempoPercent,
  pieceMeasureCount,
  piecePlayback,
  playbackTempo,
  scoresForHands,
  sliceScoreToMeasures,
} from '../src/repertoire/playback'
import { DEFAULT_SETTINGS, SettingsProvider } from '../src/state/settings'

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

async function study() {
  return loadRepertoirePiece('piece.studies.01')
}

describe('F5-023 — Reproducción de piezas', () => {
  it('calcula los compases mirando todas las partituras de la pieza', async () => {
    const piece = await study()
    expect(pieceMeasureCount(piece)).toBe(8)

    const single = await loadRepertoirePiece('piece.original.do-mayor')
    expect(pieceMeasureCount(single)).toBe(1)
  })

  it('reproduce las dos manos por defecto con el tempo escrito', async () => {
    const piece = await study()
    const playback = piecePlayback(piece)

    expect(playback.hands).toBe('both')
    expect(playback.timeline).toHaveLength(40)
    expect(playback.baseTempoBpm).toBe(72)
    expect(playback.tempoBpm).toBe(72)
    expect(playback.tempoPercent).toBe(100)
    expect(playback.fromMeasure).toBe(1)
    expect(playback.toMeasure).toBe(8)
    expect(playback.measureCount).toBe(8)
    expect(playback.loop).toBe(false)
    expect(playback.duration).toBeCloseTo(8 * 4 * (60 / 72), 9)
    expect(playback.timeline[0]?.time).toBe(0)
  })

  it('separa derecha e izquierda y marca la mano ausente', async () => {
    const piece = await study()

    const right = piecePlayback(piece, { hands: 'right' })
    expect(right.timeline).toHaveLength(32)
    expect(right.scores.right).toBeDefined()
    expect(right.scores.left).toBeUndefined()

    const left = piecePlayback(piece, { hands: 'left' })
    expect(left.timeline).toHaveLength(8)
    expect(left.scores.left).toBeDefined()
    expect(left.scores.right).toBeUndefined()

    const single = await loadRepertoirePiece('piece.original.do-mayor')
    expect(hasPieceHand(single, 'right')).toBe(true)
    expect(hasPieceHand(single, 'left')).toBe(false)
    expect(() => piecePlayback(single, { hands: 'left' })).toThrow(
      /mano izquierda/,
    )
    expect(piecePlayback(single, { hands: 'both' }).timeline).toHaveLength(4)
  })

  it('aplica el porcentaje de tempo y lo recorta al rango del motor', async () => {
    const piece = await study()

    const half = piecePlayback(piece, { tempoPercent: 50 })
    expect(half.tempoPercent).toBe(MIN_TEMPO_PERCENT)
    // 72 * 0.5 = 36 queda por debajo del mínimo de 40 BPM del motor.
    expect(half.tempoBpm).toBe(40)
    expect(half.duration).toBeCloseTo(8 * 4 * (60 / 40), 9)

    const fast = piecePlayback(piece, { tempoPercent: 120 })
    expect(fast.tempoPercent).toBe(MAX_TEMPO_PERCENT)
    expect(fast.tempoBpm).toBe(86)
    expect(fast.duration).toBeCloseTo(8 * 4 * (60 / 86), 9)

    expect(normalizeTempoPercent(30)).toBe(MIN_TEMPO_PERCENT)
    expect(normalizeTempoPercent(200)).toBe(MAX_TEMPO_PERCENT)
    expect(normalizeTempoPercent(Number.NaN)).toBe(100)
    expect(playbackTempo(72, 100)).toBe(72)
  })

  it('recorta el rango de compases y desplaza el fragmento a cero', async () => {
    const piece = await study()
    const playback = piecePlayback(piece, {
      fromMeasure: 3,
      toMeasure: 4,
    })

    expect(playback.fromMeasure).toBe(3)
    expect(playback.toMeasure).toBe(4)
    expect(playback.measureCount).toBe(2)
    expect(playback.timeline).toHaveLength(10)
    expect(playback.timeline[0]?.time).toBe(0)
    expect(playback.duration).toBeCloseTo(2 * 4 * (60 / 72), 9)

    const measures = new Set(
      playback.scores.right?.events.map((event) => event.measure),
    )
    expect([...measures].sort()).toEqual([1, 2])
  })

  it('normaliza rangos invertidos y fuera de la pieza sin lanzar', async () => {
    const piece = await study()

    expect(normalizeMeasureRange(piece, 0, 99)).toEqual({
      from: 1,
      to: 8,
      count: 8,
    })
    expect(normalizeMeasureRange(piece, 6, 2)).toEqual({
      from: 2,
      to: 6,
      count: 8,
    })
    expect(normalizeMeasureRange(piece, Number.NaN, Number.NaN)).toEqual({
      from: 1,
      to: 8,
      count: 8,
    })
  })

  it('recorta notas y marcas de pedal dentro del fragmento', async () => {
    const piece = await study()
    const right = piece.hands.right
    if (right === undefined) throw new Error('Falta la mano derecha')

    const sliced = sliceScoreToMeasures(right, 2, 3)
    expect(sliced.events).toHaveLength(8)
    expect(sliced.events.every((event) => event.measure <= 2)).toBe(true)
    expect(sliced.pedals).toEqual([])
  })

  it('mantiene sincronizadas las manos aunque declaren tempos distintos', async () => {
    const piece = await study()
    const left = piece.hands.left
    if (left === undefined) throw new Error('Falta la mano izquierda')
    const modified = {
      ...piece,
      hands: {
        right: piece.hands.right,
        left: { ...left, tempoBpm: 96 },
      },
    }

    const playback = piecePlayback(modified, { tempoPercent: 100 })
    expect(playback.baseTempoBpm).toBe(72)
    expect(playback.tempoBpm).toBe(72)

    const scores = scoresForHands(modified, 'both')
    expect(scores.right).toBeDefined()
    expect(scores.left).toBeDefined()
  })

  it('el reproductor muestra controles y reproduce el fragmento elegido', async () => {
    const piece = await study()
    const { engine, mocks } = stubEngine()
    const user = userEvent.setup()

    render(
      <SettingsProvider initialSettings={DEFAULT_SETTINGS}>
        <RepertoirePlayer
          piece={piece}
          engine={engine}
          audio={audioState()}
        />
      </SettingsProvider>,
    )

    expect(
      screen.getByRole('heading', { name: 'Reproductor de la pieza' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Ambas' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Derecha' })).toBeEnabled()
    expect(screen.getByRole('radio', { name: 'Izquierda' })).toBeEnabled()
    expect(screen.getByRole('checkbox', { name: 'Repetir en bucle' })).not.toBeChecked()
    expect(screen.getByText(/compases 1–8 · 72 BPM \(100 %\)/)).toBeInTheDocument()

    await waitFor(() =>
      expect(document.querySelectorAll('[data-grand-note]').length).toBe(40),
    )

    await user.click(screen.getByRole('button', { name: 'Reproducir' }))
    expect(mocks.playTimeline).toHaveBeenCalledTimes(1)
    const [events, options] = mocks.playTimeline.mock.calls[0] ?? []
    expect(events).toHaveLength(40)
    expect(options?.repeat).toBe(false)
    expect(options?.duration).toBeCloseTo(8 * 4 * (60 / 72), 9)
    expect(screen.getByRole('button', { name: 'Detener' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Detener' }))
    expect(mocks.stop).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Reproducir' })).toBeInTheDocument()
  })

  it('cambia de mano, tempo y bucle antes de reproducir', async () => {
    const piece = await study()
    const { engine, mocks } = stubEngine()
    const user = userEvent.setup()

    render(
      <SettingsProvider initialSettings={DEFAULT_SETTINGS}>
        <RepertoirePlayer piece={piece} engine={engine} audio={audioState()} />
      </SettingsProvider>,
    )

    await user.click(screen.getByRole('radio', { name: 'Izquierda' }))
    await user.click(screen.getByRole('checkbox', { name: 'Repetir en bucle' }))
    fireEvent.change(screen.getByRole('slider'), { target: { value: '120' } })

    expect(screen.getByText(/120 % · 86 BPM/)).toBeInTheDocument()
    expect(screen.getByText(/Izquierda · compases 1–8 · 86 BPM/)).toBeInTheDocument()

    await user.selectOptions(
      screen.getAllByRole('combobox')[0] as HTMLSelectElement,
      '3',
    )
    await user.selectOptions(
      screen.getAllByRole('combobox')[1] as HTMLSelectElement,
      '4',
    )

    await user.click(screen.getByRole('button', { name: 'Reproducir' }))
    const [events, options] = mocks.playTimeline.mock.calls[0] ?? []
    expect(events).toHaveLength(2)
    expect(options?.repeat).toBe(true)
    expect(options?.duration).toBeCloseTo(2 * 4 * (60 / 86), 9)
  })

  it('deshabilita la mano que la pieza no tiene y cae en la disponible', async () => {
    const piece = await loadRepertoirePiece('piece.original.do-mayor')
    const { engine } = stubEngine()

    render(
      <SettingsProvider initialSettings={DEFAULT_SETTINGS}>
        <RepertoirePlayer
          piece={piece}
          engine={engine}
          audio={audioState()}
          initialHands="left"
        />
      </SettingsProvider>,
    )

    await waitFor(() =>
      expect(screen.getByRole('radio', { name: 'Derecha' })).toBeChecked(),
    )
    const left = screen.getByRole('radio', {
      name: 'Izquierda',
    }) as HTMLInputElement
    expect(left.disabled).toBe(true)
  })

  it('informa un error de audio sin dejar el botón en reproducción', async () => {
    const piece = await study()
    const engine = {
      playTimeline: vi.fn(async () => {
        throw new Error('audio roto')
      }),
      stop: vi.fn(),
    } as unknown as AudioEngine
    const user = userEvent.setup()

    render(
      <SettingsProvider initialSettings={DEFAULT_SETTINGS}>
        <RepertoirePlayer piece={piece} engine={engine} audio={audioState()} />
      </SettingsProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Reproducir' }))

    expect(
      await screen.findByRole('alert'),
    ).toHaveTextContent('No se pudo reproducir la pieza: audio roto')
    expect(
      screen.getByRole('button', { name: 'Reproducir' }),
    ).toBeInTheDocument()
  })
})
