import { afterEach, describe, expect, it, vi } from 'vitest'
import type { AudioAdapter } from '../src/audio/adapter'
import { AudioEngine, type Scheduler } from '../src/audio/engine'

function fakeAdapter() {
  let clock = 100
  const adapter = {
    mode: 'sampler' as const,
    contextState: 'running',
    now: () => clock,
    setVolume: vi.fn(),
    noteOn: vi.fn(),
    noteOff: vi.fn(),
    playNote: vi.fn(),
    click: vi.fn(),
    releaseAll: vi.fn(),
    dispose: vi.fn(),
  }
  return {
    adapter,
    advanceClock(seconds: number) {
      clock += seconds
    },
  }
}

afterEach(() => {
  vi.useRealTimers()
})

describe('AudioEngine', () => {
  it('no crea el contexto hasta un gesto y refleja el estado', async () => {
    const { adapter } = fakeAdapter()
    const createAdapter = vi.fn(async () => adapter)
    const engine = new AudioEngine({ createAdapter })

    expect(engine.getState()).toMatchObject({
      status: 'idle',
      mode: 'none',
      contextState: 'suspended',
    })
    expect(createAdapter).not.toHaveBeenCalled()

    await engine.ensureStarted()
    await engine.ensureStarted()

    expect(createAdapter).toHaveBeenCalledTimes(1)
    expect(engine.getState()).toMatchObject({
      status: 'ready',
      mode: 'sampler',
      contextState: 'running',
      error: null,
    })
  })

  it('informa un error de inicialización y permite reintentar', async () => {
    const createAdapter = vi
      .fn<() => Promise<AudioAdapter>>()
      .mockRejectedValueOnce(new Error('sin audio'))
      .mockResolvedValueOnce(fakeAdapter().adapter)
    const engine = new AudioEngine({ createAdapter })

    await expect(engine.ensureStarted()).rejects.toThrow('sin audio')
    expect(engine.getState()).toMatchObject({
      status: 'error',
      mode: 'none',
      error: 'sin audio',
    })

    await engine.ensureStarted()
    expect(engine.getState().status).toBe('ready')
  })

  it('programa notas con duración y tempo configurables', async () => {
    vi.useFakeTimers()
    const { adapter } = fakeAdapter()
    const engine = new AudioEngine({ createAdapter: async () => adapter })
    await engine.ensureStarted()

    await engine.playNote(60, { tempo: 120, beats: 2 })
    expect(adapter.playNote).toHaveBeenCalledTimes(1)
    expect(adapter.playNote).toHaveBeenCalledWith(60, 1, 100)
    expect(engine.getState().isPlaying).toBe(true)

    vi.advanceTimersByTime(1000)
    expect(engine.getState().isPlaying).toBe(false)
    expect(adapter.releaseAll).toHaveBeenCalled()
  })

  it('un único timeline alimenta audio y resaltado de UI', async () => {
    vi.useFakeTimers()
    const { adapter } = fakeAdapter()
    const engine = new AudioEngine({ createAdapter: async () => adapter })
    const events: number[] = []
    engine.subscribe((state) => events.push(...state.activeNotes))
    await engine.ensureStarted()

    await engine.playScale([60, 62, 64], { tempo: 120, noteBeats: 1 })
    expect(adapter.playNote).toHaveBeenCalledWith(60, 0.5, 100)
    vi.advanceTimersByTime(0)
    expect(engine.getState().activeNotes).toEqual([60])

    vi.advanceTimersByTime(500)
    expect(engine.getState().activeNotes).toEqual([62])

    vi.advanceTimersByTime(500)
    expect(engine.getState().activeNotes).toEqual([64])

    vi.advanceTimersByTime(500)
    expect(engine.getState().activeNotes).toEqual([])
    expect(engine.getState().isPlaying).toBe(false)
    expect(events).toContain(60)
    expect(events).toContain(62)
  })

  it('expone el id del evento que suena para el resaltado', async () => {
    vi.useFakeTimers()
    const { adapter } = fakeAdapter()
    const engine = new AudioEngine({ createAdapter: async () => adapter })
    await engine.ensureStarted()

    await engine.playTimeline(
      [{ time: 0, duration: 0.5, midis: [60], label: 'ev.1' }],
      { duration: 1 },
    )
    vi.advanceTimersByTime(0)
    expect(engine.getState().activeLabel).toBe('ev.1')

    vi.advanceTimersByTime(500)
    expect(engine.getState().activeLabel).toBeUndefined()
  })

  it('detener limpia temporizadores, resaltados y notas', async () => {
    vi.useFakeTimers()
    const { adapter } = fakeAdapter()
    const engine = new AudioEngine({ createAdapter: async () => adapter })
    await engine.ensureStarted()

    await engine.playScale([60, 62, 64], { tempo: 120, noteBeats: 1 })
    const callsBeforeStop = adapter.playNote.mock.calls.length
    engine.stop()

    expect(engine.getState()).toMatchObject({ isPlaying: false, activeNotes: [] })
    expect(adapter.releaseAll).toHaveBeenCalled()

    vi.advanceTimersByTime(3000)
    expect(adapter.playNote).toHaveBeenCalledTimes(callsBeforeStop)
    expect(engine.getState().activeNotes).toEqual([])
  })

  it('repite una secuencia hasta que se detiene', async () => {
    vi.useFakeTimers()
    const { adapter } = fakeAdapter()
    const engine = new AudioEngine({ createAdapter: async () => adapter })
    await engine.ensureStarted()

    await engine.playTimeline(
      [{ time: 0, duration: 0.25, midis: [60] }],
      { repeat: true },
    )
    vi.advanceTimersByTime(1200)
    expect(adapter.playNote.mock.calls.length).toBeGreaterThan(2)
    expect(engine.getState().isPlaying).toBe(true)
    engine.stop()
  })

  it('respeta la duración de pasada antes de repetir el bucle', async () => {
    vi.useFakeTimers()
    const { adapter } = fakeAdapter()
    const engine = new AudioEngine({ createAdapter: async () => adapter })
    await engine.ensureStarted()

    await engine.playTimeline(
      [{ time: 0, duration: 0.1, midis: [60] }],
      { repeat: true, duration: 1 },
    )

    // Sin la duración explícita, el bucle volvería a los pocos milisegundos.
    vi.advanceTimersByTime(900)
    expect(adapter.playNote).toHaveBeenCalledTimes(1)
    expect(engine.getState().isPlaying).toBe(true)

    vi.advanceTimersByTime(300)
    expect(adapter.playNote.mock.calls.length).toBeGreaterThanOrEqual(2)
    engine.stop()
  })

  it('acepta notas mantenidas y las libera al detener', async () => {
    const { adapter } = fakeAdapter()
    const engine = new AudioEngine({ createAdapter: async () => adapter })
    await engine.noteOn(60)
    expect(adapter.noteOn).toHaveBeenCalledWith(60)
    expect(engine.getState().activeNotes).toEqual([60])

    engine.noteOff(60)
    expect(adapter.noteOff).toHaveBeenCalledWith(60)
    expect(engine.getState().activeNotes).toEqual([])

    await engine.noteOn(62)
    engine.stop()
    expect(adapter.noteOff).toHaveBeenCalledWith(62)
    expect(engine.getState().activeNotes).toEqual([])
  })

  it('no deja trabada una tecla soltada mientras arranca el audio', async () => {
    const { adapter } = fakeAdapter()
    let start!: (adapter: AudioAdapter) => void
    const engine = new AudioEngine({
      createAdapter: () =>
        new Promise<AudioAdapter>((resolve) => {
          start = resolve
        }),
    })

    const pressed = engine.noteOn(60)
    // La persona suelta la tecla antes de que el contexto esté listo.
    engine.noteOff(60)
    start(adapter)
    await pressed

    expect(adapter.noteOn).not.toHaveBeenCalled()
    expect(engine.getState().activeNotes).toEqual([])
  })

  it('metrónomo con acentos, tempo y parada limpia', async () => {
    vi.useFakeTimers()
    const { adapter } = fakeAdapter()
    const engine = new AudioEngine({ createAdapter: async () => adapter })
    const beats: Array<[number, boolean]> = []
    await engine.startMetronome({
      tempo: 120,
      beatsPerMeasure: 2,
      onBeat: (beat, accent) => beats.push([beat, accent]),
    })

    expect(adapter.click).toHaveBeenCalledWith(true, 100)
    vi.advanceTimersByTime(500)
    expect(adapter.click).toHaveBeenCalledWith(false, expect.any(Number))
    expect(beats.slice(0, 2)).toEqual([
      [0, true],
      [1, false],
    ])

    engine.setMetronomeTempo(60)
    expect(engine.getState().tempo).toBe(60)
    engine.stopMetronome()
    expect(engine.getState().isMetronome).toBe(false)
    const calls = adapter.click.mock.calls.length
    vi.advanceTimersByTime(3000)
    expect(adapter.click).toHaveBeenCalledTimes(calls)
  })

  it('persiste volumen y tempo en el estado y el adaptador', async () => {
    const { adapter } = fakeAdapter()
    const engine = new AudioEngine({ createAdapter: async () => adapter })
    engine.setVolume(-20)
    engine.setTempo(140)
    expect(engine.getState()).toMatchObject({ volumeDb: -20, tempo: 140 })

    await engine.ensureStarted()
    expect(adapter.setVolume).toHaveBeenCalledWith(-20)
    engine.setVolume(-100)
    expect(engine.getState().volumeDb).toBe(-40)
  })

  it('dispose libera el adaptador y vuelve a idle', async () => {
    const { adapter } = fakeAdapter()
    const engine = new AudioEngine({ createAdapter: async () => adapter })
    await engine.ensureStarted()
    engine.dispose()
    expect(adapter.dispose).toHaveBeenCalled()
    expect(engine.getState()).toMatchObject({ status: 'idle', mode: 'none' })
  })

  it('funciona con un scheduler inyectado', async () => {
    let now = 0
    let nextHandle = 1
    const timers = new Map<number, () => void>()
    const scheduler: Scheduler = {
      now: () => now,
      setTimeout: (handler) => {
        const handle = nextHandle++
        timers.set(handle, handler)
        return handle
      },
      clearTimeout: (handle) => void timers.delete(handle),
      setInterval: () => nextHandle++,
      clearInterval: () => undefined,
    }
    const { adapter } = fakeAdapter()
    const engine = new AudioEngine({ createAdapter: async () => adapter, scheduler })
    await engine.ensureStarted()
    await engine.playNote(60, { tempo: 120, beats: 1 })

    expect(adapter.playNote).toHaveBeenCalledWith(60, 0.5, 100)
    now = 500
    for (const handler of [...timers.values()]) handler()
    expect(engine.getState().isPlaying).toBe(false)
  })
})
