import { loadSampleConfig, type SampleConfig } from './sampler'

export type AudioMode = 'sampler' | 'synth' | 'none'

/**
 * Contrato mínimo que necesita el motor. Permite inyectar un adaptador falso
 * en los tests y mantiene Tone.js aislado y cargado bajo demanda.
 */
export interface AudioAdapter {
  readonly mode: AudioMode
  readonly contextState: string
  /** Tiempo actual del contexto de audio, en segundos. */
  now(): number
  setVolume(db: number): void
  noteOn(midi: number, velocity?: number): void
  noteOff(midi: number): void
  playNote(midi: number, duration: number, when: number, velocity?: number): void
  click(accent: boolean, when: number): void
  releaseAll(): void
  dispose(): void
}

export interface ToneAdapterOptions {
  /** Muestras ya resueltas a URLs; si es null se usa el sintetizador. */
  samples?: SampleConfig | null
  volumeDb?: number
  /** Tiempo máximo de espera para el sampler antes de caer al sintetizador. */
  samplerTimeoutMs?: number
}

interface ToneInstrument {
  volume: { value: number }
  triggerAttack(notes: string | string[], time?: number, velocity?: number): unknown
  triggerRelease(notes: string | string[], time?: number): unknown
  triggerAttackRelease(
    notes: string | string[],
    duration: number,
    time?: number,
    velocity?: number,
  ): unknown
  releaseAll(time?: number): unknown
  dispose(): unknown
  toDestination(): unknown
}

interface ToneClickInstrument extends ToneInstrument {
  triggerAttackRelease(
    notes: string | string[],
    duration: number,
    time?: number,
    velocity?: number,
  ): unknown
}

const DEFAULT_VOLUME_DB = -8
const DEFAULT_SAMPLER_TIMEOUT_MS = 6000

function clampVolume(db: number): number {
  if (!Number.isFinite(db)) return DEFAULT_VOLUME_DB
  return Math.min(6, Math.max(-40, db))
}

function createSynth(Tone: typeof import('tone')): ToneInstrument {
  // `PolySynth(Tone.Synth)` existe en Tone 15 y da un piano sintético aceptable
  // como fallback cuando no hay muestras locales.
  return new Tone.PolySynth(Tone.Synth).toDestination() as unknown as ToneInstrument
}

function createClick(Tone: typeof import('tone')): ToneClickInstrument {
  return new Tone.Synth({
    oscillator: { type: 'square' },
    envelope: { attack: 0.001, decay: 0.04, sustain: 0, release: 0.02 },
  }).toDestination() as unknown as ToneClickInstrument
}

function loadSampler(
  Tone: typeof import('tone'),
  samples: SampleConfig,
  timeoutMs: number,
): Promise<ToneInstrument> {
  return new Promise((resolve, reject) => {
    let settled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    let sampler: ToneInstrument | undefined

    const finish = (error?: unknown) => {
      if (settled) return
      settled = true
      if (timer !== undefined) clearTimeout(timer)
      if (error) {
        try {
          sampler?.dispose()
        } catch {
          // El sampler pudo fallar antes de construirse por completo.
        }
        reject(error instanceof Error ? error : new Error(String(error)))
      } else if (sampler) {
        resolve(sampler)
      } else {
        reject(new Error('El sampler no se construyó'))
      }
    }

    try {
      sampler = new (Tone.Sampler as unknown as new (options: {
        urls: Record<string, string>
        onload: () => void
        onerror: (error: Error) => void
        release: number
      }) => ToneInstrument)({
        urls: samples.urls,
        release: 1,
        onload: () => finish(),
        onerror: (error) => finish(error),
      })
      sampler.toDestination()
      timer = setTimeout(
        () => finish(new Error('Tiempo de carga del sampler agotado')),
        timeoutMs,
      )
      // Si ya estaba cargado (caché del navegador) no hace falta esperar.
      if ((sampler as unknown as { loaded?: boolean }).loaded) finish()
    } catch (error) {
      finish(error)
    }
  })
}

/** Crea el adaptador real de Tone. Solo se llama después de un gesto del usuario. */
export async function createToneAdapter(
  options: ToneAdapterOptions = {},
): Promise<AudioAdapter> {
  const Tone = await import('tone')
  await Tone.start()

  const samples =
    options.samples === undefined ? loadSampleConfig() : options.samples
  const volumeDb = clampVolume(options.volumeDb ?? DEFAULT_VOLUME_DB)

  let instrument: ToneInstrument
  let mode: AudioMode
  if (samples) {
    try {
      instrument = await loadSampler(
        Tone,
        samples,
        options.samplerTimeoutMs ?? DEFAULT_SAMPLER_TIMEOUT_MS,
      )
      mode = 'sampler'
    } catch {
      instrument = createSynth(Tone)
      mode = 'synth'
    }
  } else {
    instrument = createSynth(Tone)
    mode = 'synth'
  }

  const clickInstrument = createClick(Tone)
  instrument.volume.value = volumeDb
  clickInstrument.volume.value = volumeDb

  return {
    mode,
    get contextState() {
      return Tone.getContext().state
    },
    now: () => Tone.now(),
    setVolume(db: number) {
      const value = clampVolume(db)
      instrument.volume.value = value
      clickInstrument.volume.value = value
    },
    noteOn(midi: number, velocity = 0.85) {
      const note = midiToToneName(midi)
      instrument.triggerAttack(note, Tone.now(), velocity)
    },
    noteOff(midi: number) {
      instrument.triggerRelease(midiToToneName(midi), Tone.now())
    },
    playNote(midi: number, duration: number, when: number, velocity = 0.85) {
      instrument.triggerAttackRelease(
        midiToToneName(midi),
        Math.max(0.02, duration),
        when,
        velocity,
      )
    },
    click(accent: boolean, when: number) {
      clickInstrument.triggerAttackRelease(
        accent ? 'C6' : 'A5',
        0.03,
        when,
        accent ? 0.9 : 0.45,
      )
    },
    releaseAll() {
      instrument.releaseAll()
    },
    dispose() {
      try {
        instrument.releaseAll()
      } catch {
        // El contexto pudo cerrarse antes.
      }
      instrument.dispose()
      clickInstrument.dispose()
    },
  }
}

function midiToToneName(midi: number): string {
  const names = [
    'C',
    'C#',
    'D',
    'D#',
    'E',
    'F',
    'F#',
    'G',
    'G#',
    'A',
    'A#',
    'B',
  ]
  const octave = Math.floor(midi / 12) - 1
  return `${names[((midi % 12) + 12) % 12]}${octave}`
}
