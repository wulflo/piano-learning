import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type {
  AudioEngine,
  AudioEngineState,
  MetronomeOptions,
  PlayTimelineOptions,
} from '../src/audio/engine'
import type { TimelineEvent } from '../src/audio/notes'
import { KeyboardTask } from '../src/components/KeyboardTask'
import { loadLesson } from '../src/content/lessons'
import { DEFAULT_SETTINGS, SettingsProvider } from '../src/state/settings'

function audioState(overrides: Partial<AudioEngineState> = {}): AudioEngineState {
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
    startMetronome: vi.fn(
      async (_options: MetronomeOptions = {}) => undefined,
    ),
    stopMetronome: vi.fn(),
    noteOn: vi.fn(async (_midi: number) => undefined),
    noteOff: vi.fn(),
  }
  return { engine: engine as unknown as AudioEngine, mocks: engine }
}

async function task() {
  const lesson = await loadLesson('lesson.m0-01')
  if (lesson.keyboardTask === undefined) throw new Error('La lección no tiene tarea')
  return lesson.keyboardTask
}

describe('F2-066 — Tarea de teclado real', () => {
  it('muestra diagrama, digitación, demo, metrónomo y lista de control', async () => {
    const data = await task()
    const { engine } = stubEngine()
    render(
      <SettingsProvider initialSettings={DEFAULT_SETTINGS}>
        <KeyboardTask task={data} engine={engine} audio={audioState()} />
      </SettingsProvider>,
    )

    expect(
      screen.getByRole('heading', { level: 2, name: 'Tarea de teclado' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 3, name: 'Encontrá tres Do' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/1 - 1 - 1 \(pulgar\) en cada Do/),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Escuchar demo' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Iniciar metrónomo' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('group', { name: 'Lista de control' }),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('checkbox')).toHaveLength(3)
    expect(screen.getByText('0 de 3 puntos marcados')).toBeInTheDocument()
    expect(screen.getByText(/Tempo de la tarea: 60 BPM/)).toBeInTheDocument()
  })

  it('marca y desmarca la lista de control sin guardar nada', async () => {
    const data = await task()
    const { engine } = stubEngine()
    render(
      <SettingsProvider initialSettings={DEFAULT_SETTINGS}>
        <KeyboardTask task={data} engine={engine} audio={audioState()} />
      </SettingsProvider>,
    )

    const boxes = screen.getAllByRole('checkbox')
    fireEvent.click(boxes[0])
    expect(screen.getByText('1 de 3 puntos marcados')).toBeInTheDocument()
    expect(boxes[0]).toBeChecked()

    fireEvent.click(boxes[1])
    expect(screen.getByText('2 de 3 puntos marcados')).toBeInTheDocument()

    fireEvent.click(boxes[0])
    expect(screen.getByText('1 de 3 puntos marcados')).toBeInTheDocument()
  })

  it('inicia y detiene el metrónomo con el tempo y compás de la tarea', async () => {
    const data = await task()
    const { engine, mocks } = stubEngine()
    const view = render(
      <SettingsProvider initialSettings={DEFAULT_SETTINGS}>
        <KeyboardTask task={data} engine={engine} audio={audioState()} />
      </SettingsProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Iniciar metrónomo' }))
    expect(mocks.startMetronome).toHaveBeenCalledTimes(1)
    const options = mocks.startMetronome.mock.calls[0][0] as {
      tempo: number
      beatsPerMeasure: number
      onBeat: (beat: number) => void
    }
    expect(options.tempo).toBe(60)
    expect(options.beatsPerMeasure).toBe(3)

    view.rerender(
      <SettingsProvider initialSettings={DEFAULT_SETTINGS}>
        <KeyboardTask
          task={data}
          engine={engine}
          audio={audioState({ isMetronome: true })}
        />
      </SettingsProvider>,
    )
    expect(screen.getByRole('status')).toHaveTextContent('Pulso 1 de 3')

    fireEvent.click(screen.getByRole('button', { name: 'Detener metrónomo' }))
    expect(mocks.stopMetronome).toHaveBeenCalledTimes(1)
  })

  it('reproduce la demo y permite detenerla', async () => {
    const data = await task()
    const { engine, mocks } = stubEngine()
    const view = render(
      <SettingsProvider initialSettings={DEFAULT_SETTINGS}>
        <KeyboardTask task={data} engine={engine} audio={audioState()} />
      </SettingsProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Escuchar demo' }))
    expect(mocks.playTimeline).toHaveBeenCalledTimes(1)
    const timeline = mocks.playTimeline.mock.calls[0][0] as Array<{
      midis: number[]
    }>
    expect(timeline).toHaveLength(3)
    expect(timeline.map((event) => event.midis)).toEqual([[60], [72], [84]])

    view.rerender(
      <SettingsProvider initialSettings={DEFAULT_SETTINGS}>
        <KeyboardTask
          task={data}
          engine={engine}
          audio={audioState({ isPlaying: true })}
        />
      </SettingsProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Detener demo' }))
    expect(mocks.stop).toHaveBeenCalledTimes(1)
  })

  it('avisa cuando la tarea no tiene partitura de demo', async () => {
    const data = { ...(await task()), demoScore: undefined }
    const { engine } = stubEngine()
    render(
      <SettingsProvider initialSettings={DEFAULT_SETTINGS}>
        <KeyboardTask task={data} engine={engine} audio={audioState()} />
      </SettingsProvider>,
    )

    expect(
      screen.getByRole('button', { name: 'Escuchar demo' }),
    ).toBeDisabled()
    expect(
      screen.getByText('Esta tarea no incluye una partitura de demostración.'),
    ).toBeInTheDocument()
  })

  it('muestra un error honesto si el metrónomo no puede iniciar', async () => {
    const data = await task()
    const { engine, mocks } = stubEngine()
    mocks.startMetronome.mockRejectedValueOnce(new Error('sin audio'))
    render(
      <SettingsProvider initialSettings={DEFAULT_SETTINGS}>
        <KeyboardTask task={data} engine={engine} audio={audioState()} />
      </SettingsProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Iniciar metrónomo' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudo reproducir la tarea: sin audio',
    )
  })
})
