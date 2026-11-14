import {
  chordTimeline,
  clampTempo,
  DEFAULT_TEMPO,
  intervalTimeline,
  noteTimeline,
  scaleTimeline,
  timelineDuration,
  type ChordOptions,
  type IntervalOptions,
  type NoteOptions,
  type ScaleOptions,
  type TempoOptions,
  type TimelineEvent,
} from './notes'
import {
  createToneAdapter,
  type AudioAdapter,
  type AudioMode,
} from './adapter'
import { loadSampleConfig } from './sampler'

export type EngineStatus = 'idle' | 'starting' | 'ready' | 'error'

export interface AudioEngineState {
  status: EngineStatus
  mode: AudioMode
  contextState: string
  isPlaying: boolean
  isMetronome: boolean
  activeNotes: number[]
  /** Id del evento del timeline que suena, si lo tiene. */
  activeLabel?: string
  /** Ids de todos los eventos que suenan a la vez. */
  activeLabels?: string[]
  error: string | null
  tempo: number
  volumeDb: number
}

export interface Scheduler {
  setTimeout(handler: () => void, ms: number): number
  clearTimeout(handle: number): void
  setInterval(handler: () => void, ms: number): number
  clearInterval(handle: number): void
  now(): number
}

/** Notas y eventos que suenan en un instante, incluidas las notas mantenidas. */
export interface TimelineActive {
  midis: number[]
  labels: string[]
}

export interface PlayTimelineOptions {
  repeat?: boolean
  /** Se llama cuando el timeline empieza un evento (misma fuente que el audio). */
  onEvent?: (event: TimelineEvent, index: number) => void
  /**
   * Se llama cada vez que cambia el conjunto de notas que suenan. Incluye las
   * notas largas que siguen activas y los eventos simultáneos de varias voces.
   */
  onActive?: (active: TimelineActive) => void
  /**
   * Duración total de la pasada en segundos. Por defecto se usa el final del
   * último evento; una progresión con pausa de bucle lo pasa para que la
   * repetición respete la pausa en lugar de cortar las últimas notas.
   */
  duration?: number
}

export interface MetronomeOptions extends TempoOptions {
  beatsPerMeasure?: number
  onBeat?: (beat: number, accent: boolean) => void
}

export interface AudioEngineOptions {
  createAdapter?: () => Promise<AudioAdapter>
  scheduler?: Scheduler
  volumeDb?: number
  tempo?: number
  /** Anticipación con la que se programan los eventos de audio. */
  lookaheadSeconds?: number
  /** Frecuencia del planificador. */
  tickMs?: number
}

const DEFAULT_VOLUME_DB = -8
const DEFAULT_LOOKAHEAD = 0.15
const DEFAULT_TICK_MS = 25

const defaultScheduler: Scheduler = {
  setTimeout: (handler, ms) => globalThis.setTimeout(handler, ms) as unknown as number,
  clearTimeout: (handle) => globalThis.clearTimeout(handle),
  setInterval: (handler, ms) => globalThis.setInterval(handler, ms) as unknown as number,
  clearInterval: (handle) => globalThis.clearInterval(handle),
  now: () => Date.now(),
}

interface SequenceState {
  events: TimelineEvent[]
  repeat: boolean
  onEvent?: (event: TimelineEvent, index: number) => void
  onActive?: (active: TimelineActive) => void
  index: number
  startedAt: number
  duration: number
  interval: number | null
  timers: number[]
  /** Eventos que están sonando, indexados por su posición en el timeline. */
  active: Map<number, TimelineEvent>
  /** Cambia en cada pasada del bucle para ignorar temporizadores antiguos. */
  generation: number
  finished: boolean
}

interface MetronomeState {
  bpm: number
  beatsPerMeasure: number
  onBeat?: (beat: number, accent: boolean) => void
  nextBeat: number
  startedAt: number
  interval: number | null
  timers: number[]
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/** Une las notas y etiquetas de todos los eventos que suenan a la vez. */
function activeFrom(events: Iterable<TimelineEvent>): TimelineActive {
  const midis = new Set<number>()
  const labels: string[] = []
  const seen = new Set<string>()
  for (const event of events) {
    for (const midi of event.midis) midis.add(midi)
    if (event.label !== undefined && !seen.has(event.label)) {
      seen.add(event.label)
      labels.push(event.label)
    }
  }
  return { midis: [...midis], labels }
}

function clampVolume(db: number): number {
  if (!Number.isFinite(db)) return DEFAULT_VOLUME_DB
  return Math.min(6, Math.max(-40, db))
}

/**
 * Motor de audio de Piano Today.
 *
 * - No crea ningún `AudioContext` hasta que la UI llama a `ensureStarted()`
 *   dentro de un gesto del usuario.
 * - Un único timeline programa audio y avisos de UI, de modo que el resaltado
 *   del teclado/pentagrama sigue exactamente la misma fuente.
 */
export class AudioEngine {
  private readonly createAdapter: () => Promise<AudioAdapter>
  private readonly scheduler: Scheduler
  private readonly lookahead: number
  private readonly tickMs: number

  private adapter: AudioAdapter | null = null
  private startPromise: Promise<void> | null = null
  private state: AudioEngineState
  private listeners = new Set<(state: AudioEngineState) => void>()

  private sequence: SequenceState | null = null
  private metronome: MetronomeState | null = null
  private held = new Map<number, number>()

  constructor(options: AudioEngineOptions = {}) {
    this.createAdapter =
      options.createAdapter ??
      (() =>
        createToneAdapter({
          samples: loadSampleConfig(),
          volumeDb: options.volumeDb ?? DEFAULT_VOLUME_DB,
        }))
    this.scheduler = options.scheduler ?? defaultScheduler
    this.lookahead = Math.max(0.02, options.lookaheadSeconds ?? DEFAULT_LOOKAHEAD)
    this.tickMs = Math.max(5, options.tickMs ?? DEFAULT_TICK_MS)
    this.state = {
      status: 'idle',
      mode: 'none',
      contextState: 'suspended',
      isPlaying: false,
      isMetronome: false,
      activeNotes: [],
      error: null,
      tempo: clampTempo(options.tempo ?? DEFAULT_TEMPO),
      volumeDb: clampVolume(options.volumeDb ?? DEFAULT_VOLUME_DB),
    }
  }

  getState(): AudioEngineState {
    return {
      ...this.state,
      activeNotes: [...this.state.activeNotes],
      activeLabels: [...(this.state.activeLabels ?? [])],
    }
  }

  subscribe(listener: (state: AudioEngineState) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private emit(patch: Partial<AudioEngineState>): void {
    // Quien cambia las notas activas sin detallar etiquetas las está limpiando:
    // las notas mantenidas por MIDI o una parada no conservan ids del timeline.
    const next =
      patch.activeNotes !== undefined && patch.activeLabels === undefined
        ? { ...patch, activeLabels: [] }
        : patch
    this.state = { ...this.state, ...next }
    const snapshot = this.getState()
    for (const listener of this.listeners) listener(snapshot)
  }

  private publishActive(sequence: SequenceState): void {
    const active = activeFrom(sequence.active.values())
    this.emit({
      activeNotes: active.midis,
      activeLabel: active.labels[active.labels.length - 1],
      activeLabels: active.labels,
    })
    sequence.onActive?.(active)
  }

  /** Crea el contexto de audio. Debe invocarse desde un gesto del usuario. */
  async ensureStarted(): Promise<void> {
    if (this.adapter) return
    if (this.startPromise) return this.startPromise

    this.emit({ status: 'starting', error: null })
    this.startPromise = this.createAdapter()
      .then((adapter) => {
        this.adapter = adapter
        adapter.setVolume(this.state.volumeDb)
        this.emit({
          status: 'ready',
          mode: adapter.mode,
          contextState: adapter.contextState,
          error: null,
        })
      })
      .catch((error: unknown) => {
        this.startPromise = null
        this.emit({
          status: 'error',
          mode: 'none',
          contextState: 'suspended',
          error: errorMessage(error),
        })
        throw error
      })
    return this.startPromise
  }

  setVolume(db: number): void {
    const volumeDb = clampVolume(db)
    this.adapter?.setVolume(volumeDb)
    this.emit({ volumeDb })
  }

  setTempo(tempo: number): void {
    const value = clampTempo(tempo)
    const metronome = this.metronome
    if (metronome) {
      // Reiniciar el pulso con el nuevo tempo evita saltos al recalcular
      // beats absolutos con una duración distinta.
      metronome.bpm = value
      metronome.startedAt = this.scheduler.now()
      metronome.nextBeat = 0
      for (const timer of metronome.timers) this.scheduler.clearTimeout(timer)
      metronome.timers = []
    }
    this.emit({ tempo: value })
  }

  async noteOn(midi: number): Promise<void> {
    // La tecla se marca como mantenida antes de esperar al contexto de audio.
    // Así, si se suelta mientras el audio todavía está arrancando, `noteOff`
    // encuentra la nota y no queda trabada al terminar `ensureStarted`.
    this.held.set(midi, (this.held.get(midi) ?? 0) + 1)
    this.emit({ activeNotes: [...this.held.keys()], activeLabel: undefined })

    try {
      await this.ensureStarted()
    } catch (error) {
      const count = this.held.get(midi) ?? 0
      if (count <= 1) this.held.delete(midi)
      else this.held.set(midi, count - 1)
      this.emit({ activeNotes: [...this.held.keys()], activeLabel: undefined })
      throw error
    }

    if (!this.adapter) return
    // Se soltó mientras se creaba el contexto: no hay nada que reproducir.
    if (!this.held.has(midi)) return
    this.adapter.noteOn(midi)
  }

  noteOff(midi: number): void {
    const count = this.held.get(midi) ?? 0
    if (count > 1) {
      this.held.set(midi, count - 1)
      return
    }
    this.held.delete(midi)
    this.adapter?.noteOff(midi)
    this.emit({ activeNotes: [...this.held.keys()], activeLabel: undefined })
  }

  async playNote(midi: number, options: NoteOptions = {}): Promise<void> {
    await this.playTimeline(noteTimeline(midi, options))
  }

  async playInterval(
    root: number,
    second: number,
    options: IntervalOptions = {},
  ): Promise<void> {
    await this.playTimeline(intervalTimeline(root, second, options))
  }

  async playScale(midis: number[], options: ScaleOptions = {}): Promise<void> {
    await this.playTimeline(scaleTimeline(midis, options))
  }

  async playChord(midis: number[], options: ChordOptions = {}): Promise<void> {
    await this.playTimeline(chordTimeline(midis, options))
  }

  /** Reproduce un timeline ya construido; audio y UI comparten los eventos. */
  async playTimeline(
    events: TimelineEvent[],
    options: PlayTimelineOptions = {},
  ): Promise<void> {
    await this.ensureStarted()
    if (!this.adapter || events.length === 0) return

    this.stopSequence()
    const sequence: SequenceState = {
      events: [...events].sort((a, b) => a.time - b.time),
      repeat: Boolean(options.repeat),
      onEvent: options.onEvent,
      onActive: options.onActive,
      index: 0,
      startedAt: this.scheduler.now(),
      duration: options.duration ?? timelineDuration(events),
      interval: null,
      timers: [],
      active: new Map(),
      generation: 0,
      finished: false,
    }
    this.sequence = sequence
    this.emit({ isPlaying: true })
    this.pumpSequence()
    sequence.interval = this.scheduler.setInterval(
      () => this.pumpSequence(),
      this.tickMs,
    )
  }

  private pumpSequence(): void {
    const sequence = this.sequence
    const adapter = this.adapter
    if (!sequence || !adapter || sequence.finished) return

    const elapsed = (this.scheduler.now() - sequence.startedAt) / 1000
    while (
      sequence.index < sequence.events.length &&
      sequence.events[sequence.index].time <= elapsed + this.lookahead
    ) {
      const event = sequence.events[sequence.index]
      const index = sequence.index
      const delay = Math.max(0, event.time - elapsed)
      const when = adapter.now() + delay
      for (const midi of event.midis) {
        adapter.playNote(midi, event.duration, when)
      }

      const generation = sequence.generation
      const timer = this.scheduler.setTimeout(() => {
        if (this.sequence !== sequence || sequence.finished) return
        if (sequence.generation !== generation) return
        sequence.active.set(index, event)
        this.publishActive(sequence)
        sequence.onEvent?.(event, index)
      }, delay * 1000)
      sequence.timers.push(timer)

      // Al terminar el evento se retira del conjunto activo. Si otra nota del
      // mismo pulso o una nota larga sigue sonando, permanece resaltada.
      const clearTimer = this.scheduler.setTimeout(
        () => {
          if (this.sequence !== sequence || sequence.finished) return
          if (sequence.generation !== generation) return
          sequence.active.delete(index)
          this.publishActive(sequence)
        },
        Math.max(0, (event.time + event.duration - elapsed) * 1000),
      )
      sequence.timers.push(clearTimer)

      sequence.index += 1
    }

    if (sequence.index < sequence.events.length) return

    if (sequence.repeat) {
      if (elapsed >= sequence.duration) {
        sequence.index = 0
        sequence.startedAt = this.scheduler.now()
        sequence.generation += 1
        sequence.active.clear()
        this.publishActive(sequence)
      }
      return
    }

    // Sin repetición: cerrar exactamente al terminar la última nota.
    const remaining = Math.max(0, (sequence.duration - elapsed) * 1000)
    const endTimer = this.scheduler.setTimeout(() => {
      if (this.sequence !== sequence) return
      this.finishSequence()
    }, remaining)
    sequence.timers.push(endTimer)
    if (sequence.interval !== null) {
      this.scheduler.clearInterval(sequence.interval)
      sequence.interval = null
    }
  }

  private finishSequence(): void {
    const sequence = this.sequence
    if (!sequence) return
    sequence.finished = true
    if (sequence.interval !== null) {
      this.scheduler.clearInterval(sequence.interval)
      sequence.interval = null
    }
    for (const timer of sequence.timers) this.scheduler.clearTimeout(timer)
    sequence.timers = []
    this.adapter?.releaseAll()
    this.sequence = null
    this.emit({
      isPlaying: false,
      activeNotes: [...this.held.keys()],
      activeLabel: undefined,
    })
  }

  /** Detiene la secuencia actual sin tocar el metrónomo. */
  stopSequence(): void {
    const sequence = this.sequence
    if (!sequence) {
      if (this.state.isPlaying) {
        this.adapter?.releaseAll()
        this.emit({
          isPlaying: false,
          activeNotes: [...this.held.keys()],
          activeLabel: undefined,
        })
      }
      return
    }
    sequence.finished = true
    if (sequence.interval !== null) {
      this.scheduler.clearInterval(sequence.interval)
      sequence.interval = null
    }
    for (const timer of sequence.timers) this.scheduler.clearTimeout(timer)
    sequence.timers = []
    this.adapter?.releaseAll()
    this.sequence = null
    this.emit({
      isPlaying: false,
      activeNotes: [...this.held.keys()],
      activeLabel: undefined,
    })
  }

  async startMetronome(options: MetronomeOptions = {}): Promise<void> {
    await this.ensureStarted()
    if (!this.adapter) return
    this.stopMetronome()

    const metronome: MetronomeState = {
      bpm: clampTempo(options.tempo ?? this.state.tempo),
      beatsPerMeasure: Math.max(1, Math.round(options.beatsPerMeasure ?? 4)),
      onBeat: options.onBeat,
      nextBeat: 0,
      startedAt: this.scheduler.now(),
      interval: null,
      timers: [],
    }
    this.metronome = metronome
    this.emit({ isMetronome: true })
    this.pumpMetronome()
    metronome.interval = this.scheduler.setInterval(
      () => this.pumpMetronome(),
      this.tickMs,
    )
  }

  setMetronomeTempo(tempo: number): void {
    this.setTempo(tempo)
  }

  private pumpMetronome(): void {
    const metronome = this.metronome
    const adapter = this.adapter
    if (!metronome || !adapter) return

    const beatSeconds = 60 / metronome.bpm
    const elapsed = (this.scheduler.now() - metronome.startedAt) / 1000
    while (metronome.nextBeat * beatSeconds <= elapsed + this.lookahead) {
      const beat = metronome.nextBeat
      const accent = beat % metronome.beatsPerMeasure === 0
      const delay = Math.max(0, beat * beatSeconds - elapsed)
      adapter.click(accent, adapter.now() + delay)
      const timer = this.scheduler.setTimeout(() => {
        if (this.metronome !== metronome) return
        metronome.onBeat?.(beat, accent)
      }, delay * 1000)
      metronome.timers.push(timer)
      metronome.nextBeat += 1
    }
  }

  stopMetronome(): void {
    const metronome = this.metronome
    if (!metronome) return
    if (metronome.interval !== null) {
      this.scheduler.clearInterval(metronome.interval)
      metronome.interval = null
    }
    for (const timer of metronome.timers) this.scheduler.clearTimeout(timer)
    metronome.timers = []
    this.metronome = null
    this.emit({ isMetronome: false })
  }

  /** Detiene todo: secuencia, metrónomo y notas mantenidas. */
  stop(): void {
    this.stopSequence()
    this.stopMetronome()
    for (const midi of this.held.keys()) this.adapter?.noteOff(midi)
    this.held.clear()
    this.adapter?.releaseAll()
    this.emit({ activeNotes: [], isPlaying: false, activeLabel: undefined })
  }

  dispose(): void {
    this.stop()
    this.adapter?.dispose()
    this.adapter = null
    this.startPromise = null
    this.listeners.clear()
    this.emit({
      status: 'idle',
      mode: 'none',
      contextState: 'suspended',
      isPlaying: false,
      isMetronome: false,
      activeNotes: [],
      activeLabel: undefined,
    })
  }
}

export function tempoForSequence(tempo: number): number {
  return clampTempo(tempo)
}

/** Reexporta el tipo de pulso para que la UI no dependa del módulo interno. */
export type { TimelineEvent }
