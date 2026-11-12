import { afterEach, describe, expect, it, vi } from 'vitest'

const tone = vi.hoisted(() => {
  const start = vi.fn(async () => undefined)
  const now = vi.fn(() => 100)
  const context = { state: 'running' }
  const getContext = vi.fn(() => context)
  const created: {
    synths: MockInstrument[]
    samplers: Array<MockInstrument & { urls: Record<string, string> }>
    clicks: MockInstrument[]
  } = {
    synths: [],
    samplers: [],
    clicks: [],
  }
  let samplerFails = false

  class MockInstrument {
    volume = { value: 0 }
    triggerAttack = vi.fn(() => this)
    triggerRelease = vi.fn(() => this)
    triggerAttackRelease = vi.fn(() => this)
    releaseAll = vi.fn(() => this)
    dispose = vi.fn(() => this)
    toDestination = vi.fn(() => this)
  }

  class Synth extends MockInstrument {
    constructor() {
      super()
      created.clicks.push(this)
    }
  }

  class PolySynth extends MockInstrument {
    constructor() {
      super()
      created.synths.push(this)
    }
  }

  class Sampler extends MockInstrument {
    loaded = true
    constructor(options: { urls: Record<string, string>; onload?: () => void }) {
      super()
      if (samplerFails) throw new Error('sin red')
      created.samplers.push(this)
      this.urls = options.urls
    }

    urls: Record<string, string>
  }

  return {
    start,
    now,
    getContext,
    context,
    created,
    Synth,
    PolySynth,
    Sampler,
    setSamplerFails(value: boolean) {
      samplerFails = value
    },
  }
})

vi.mock('tone', () => tone)

const { createToneAdapter } = await import('../src/audio/adapter')

const samples = {
  urls: { C4: '/audio/samples/C4.mp3', D4: '/audio/samples/D4.mp3' },
  attribution: 'Salamander',
  sourceUrl: 'https://example.com',
  license: 'CC-BY-3.0',
}

afterEach(() => {
  vi.clearAllMocks()
  tone.created.synths.length = 0
  tone.created.samplers.length = 0
  tone.created.clicks.length = 0
  tone.context.state = 'running'
  tone.setSamplerFails(false)
})

describe('adaptador de Tone', () => {
  it('arranca el contexto solo al crear el adaptador', async () => {
    const adapter = await createToneAdapter({ samples: null })
    expect(tone.start).toHaveBeenCalledTimes(1)
    expect(adapter.mode).toBe('synth')
    expect(adapter.contextState).toBe('running')
    expect(tone.created.synths).toHaveLength(1)
  })

  it('usa sampler cuando hay muestras y cae al sintetizador si falla', async () => {
    const adapter = await createToneAdapter({ samples })
    expect(adapter.mode).toBe('sampler')
    expect(tone.created.samplers[0].urls).toEqual(samples.urls)

    tone.setSamplerFails(true)
    const fallback = await createToneAdapter({ samples })
    expect(fallback.mode).toBe('synth')
  })

  it('reproduce notas, acordes y clicks con tiempo absoluto', async () => {
    const adapter = await createToneAdapter({ samples, volumeDb: -12 })
    const sampler = tone.created.samplers[0]

    adapter.playNote(61, 0.5, 100)
    expect(sampler.triggerAttackRelease).toHaveBeenCalledWith('C#4', 0.5, 100, 0.85)

    adapter.noteOn(60)
    adapter.noteOff(60)
    expect(sampler.triggerAttack).toHaveBeenCalledWith('C4', 100, 0.85)
    expect(sampler.triggerRelease).toHaveBeenCalledWith('C4', 100)

    adapter.click(true, 101)
    expect(tone.created.clicks[0].triggerAttackRelease).toHaveBeenCalledWith(
      'C6',
      0.03,
      101,
      0.9,
    )

    expect(sampler.volume.value).toBe(-12)
    adapter.setVolume(-100)
    expect(sampler.volume.value).toBe(-40)
  })

  it('libera todas las notas y libera recursos al disponer', async () => {
    const adapter = await createToneAdapter({ samples })
    const sampler = tone.created.samplers[0]
    adapter.releaseAll()
    expect(sampler.releaseAll).toHaveBeenCalled()
    adapter.dispose()
    expect(sampler.dispose).toHaveBeenCalled()
    expect(tone.created.clicks[0].dispose).toHaveBeenCalled()
  })
})
