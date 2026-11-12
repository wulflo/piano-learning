/**
 * F6-033 — Canal MIDI compartido.
 *
 * Un único listener alimenta toda la app: el teclado virtual, el pentagrama y
 * la evaluación de tareas reciben las pulsaciones del dispositivo (Yamaha
 * PSR-373 y cualquier MIDI compatible). La conexión se pide una sola vez y se
 * reutiliza; sin Web MIDI el contexto queda inerte y la autoevaluación manual
 * sigue funcionando.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  getMidiPermissionState,
  isWebMidiSupported,
  type MidiPermissionState,
} from './detect'
import { detectDeviceProfile, type MidiDeviceProfile } from './device'
import {
  connectMidiInput,
  type MidiConnection,
  type MidiInputInfo,
  type MidiNoteEvent,
  type MidiNoteListener,
  type MidiOutputInfo,
  type MidiRawMessage,
} from './input'

export type MidiStatus =
  | 'unsupported'
  | 'idle'
  | 'requesting'
  | 'listening'
  | 'denied'
  | 'error'

/** Máximo de pulsaciones conservadas para evaluar un intento. */
export const MAX_MIDI_EVENTS = 1024

export interface MidiContextValue {
  status: MidiStatus
  /** Nombres de los puertos de entrada detectados. */
  devices: MidiInputInfo[]
  /** Puertos de salida detectados (solo diagnóstico). */
  outputs: MidiOutputInfo[]
  /** Estado del permiso MIDI del navegador, si se puede consultar. */
  permission: MidiPermissionState | null
  /** Perfil reconocido por nombre (por ejemplo, Yamaha PSR-373). */
  profile: MidiDeviceProfile
  /** Notas que el dispositivo mantiene pulsadas ahora mismo. */
  heldNotes: number[]
  /** Pulsaciones acumuladas desde el último `clearEvents`. */
  events: MidiNoteEvent[]
  lastEvent: MidiNoteEvent | null
  /** Último mensaje de canal, para el diagnóstico. */
  lastRaw: MidiRawMessage | null
  error: string | null
  supported: boolean
  connect: () => Promise<void>
  retry: () => Promise<void>
  disconnect: () => void
  clearEvents: () => void
  /**
   * Recibe cada pulsación además de `events`. El grabador lo usa para no
   * perder tomas largas cuando `events` alcanza `MAX_MIDI_EVENTS`.
   */
  subscribe: (listener: MidiNoteListener) => () => void
}

const noop = () => undefined

const defaultContext: MidiContextValue = {
  status: 'idle',
  devices: [],
  outputs: [],
  permission: null,
  profile: 'generic',
  heldNotes: [],
  events: [],
  lastEvent: null,
  lastRaw: null,
  error: null,
  supported: false,
  connect: async () => undefined,
  retry: async () => undefined,
  disconnect: noop,
  clearEvents: noop,
  subscribe: () => noop,
}

const MidiContext = createContext<MidiContextValue>(defaultContext)

export function useMidi(): MidiContextValue {
  return useContext(MidiContext)
}

export interface MidiProviderProps {
  children: ReactNode
}

export function MidiProvider({ children }: MidiProviderProps) {
  const supported = isWebMidiSupported()
  const [status, setStatus] = useState<MidiStatus>(
    supported ? 'idle' : 'unsupported',
  )
  const [devices, setDevices] = useState<MidiInputInfo[]>([])
  const [outputs, setOutputs] = useState<MidiOutputInfo[]>([])
  const [permission, setPermission] = useState<MidiPermissionState | null>(null)
  const [heldNotes, setHeldNotes] = useState<number[]>([])
  const [events, setEvents] = useState<MidiNoteEvent[]>([])
  const [lastEvent, setLastEvent] = useState<MidiNoteEvent | null>(null)
  const [lastRaw, setLastRaw] = useState<MidiRawMessage | null>(null)
  const [error, setError] = useState<string | null>(null)

  const connectionRef = useRef<MidiConnection | null>(null)
  const listenersRef = useRef(new Set<MidiNoteListener>())
  const connectingRef = useRef(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      connectionRef.current?.disconnect()
      connectionRef.current = null
    }
  }, [])

  const handleEvent = useCallback((event: MidiNoteEvent) => {
    for (const listener of listenersRef.current) listener(event)
    setLastEvent(event)
    setEvents((current) => {
      const next = [...current, event]
      return next.length > MAX_MIDI_EVENTS
        ? next.slice(next.length - MAX_MIDI_EVENTS)
        : next
    })
    setHeldNotes((current) => {
      const next = new Set(current)
      if (event.velocity > 0) next.add(event.note)
      else next.delete(event.note)
      return [...next].sort((a, b) => a - b)
    })
  }, [])

  const handleRaw = useCallback((message: MidiRawMessage) => {
    // Los mensajes de sistema (clock, active sensing) llegan a ráfagas y no
    // aportan al diagnóstico de notas: solo conservamos mensajes de canal.
    const statusByte = message.data[0]
    if (statusByte === undefined || statusByte >= 0xf0) return
    setLastRaw(message)
  }, [])

  const disconnect = useCallback(() => {
    connectionRef.current?.disconnect()
    connectionRef.current = null
    connectingRef.current = false
    setHeldNotes([])
    setStatus(isWebMidiSupported() ? 'idle' : 'unsupported')
  }, [])

  const connect = useCallback(async () => {
    if (!isWebMidiSupported()) {
      setStatus('unsupported')
      return
    }
    if (connectionRef.current !== null || connectingRef.current) return

    connectingRef.current = true
    setStatus('requesting')
    setError(null)

    try {
      const connection = await connectMidiInput(handleEvent, {
        onDevices: (snapshot) => {
          if (!mountedRef.current) return
          setDevices(snapshot.inputs)
          setOutputs(snapshot.outputs)
        },
        onRawMessage: handleRaw,
      })
      if (!mountedRef.current) {
        connection?.disconnect()
        return
      }
      if (connection === null) {
        connectingRef.current = false
        setStatus('denied')
        return
      }
      connectionRef.current = connection
      connectingRef.current = false
      setStatus('listening')
    } catch (reason) {
      connectingRef.current = false
      if (!mountedRef.current) return
      setError(reason instanceof Error ? reason.message : String(reason))
      setStatus('error')
    }
  }, [handleEvent, handleRaw])

  const retry = useCallback(async () => {
    connectionRef.current?.disconnect()
    connectionRef.current = null
    connectingRef.current = false
    setHeldNotes([])
    await connect()
  }, [connect])

  const syncPermission = useCallback(async () => {
    const next = await getMidiPermissionState()
    if (!mountedRef.current) return next
    setPermission(next)
    return next
  }, [])

  // Si el usuario ya concedió el permiso, conectar en segundo plano sin
  // volver a preguntar. Si está en «prompt» esperamos la acción explícita.
  useEffect(() => {
    if (!supported) return
    let cancelled = false
    let permissionStatus: PermissionStatus | null = null

    const sync = async () => {
      const next = await getMidiPermissionState()
      if (cancelled || !mountedRef.current) return
      setPermission(next)
      if (
        next === 'granted' &&
        connectionRef.current === null &&
        !connectingRef.current
      ) {
        void connect()
      } else if (next === 'denied' && connectionRef.current === null) {
        setStatus('denied')
      }
    }

    void sync()

    if (typeof navigator !== 'undefined' && navigator.permissions) {
      navigator.permissions
        .query({ name: 'midi' as PermissionName })
        .then((result) => {
          if (cancelled) return
          permissionStatus = result
          result.onchange = () => {
            void sync()
          }
        })
        .catch(() => undefined)
    }

    return () => {
      cancelled = true
      if (permissionStatus !== null) permissionStatus.onchange = null
    }
  }, [connect, supported])

  // Al volver a la pestaña después de cambiar el permiso en el navegador,
  // reintentamos la conexión sin obligar a recargar la app.
  useEffect(() => {
    if (!supported) return
    const syncOnReturn = () => {
      if (document.visibilityState === 'hidden') return
      if (connectionRef.current !== null || connectingRef.current) return
      void syncPermission().then((next) => {
        if (next === 'granted' && mountedRef.current) void connect()
      })
    }
    window.addEventListener('focus', syncOnReturn)
    document.addEventListener('visibilitychange', syncOnReturn)
    return () => {
      window.removeEventListener('focus', syncOnReturn)
      document.removeEventListener('visibilitychange', syncOnReturn)
    }
  }, [connect, supported, syncPermission])

  const clearEvents = useCallback(() => {
    setEvents([])
    setLastEvent(null)
  }, [])

  const subscribe = useCallback((listener: MidiNoteListener) => {
    listenersRef.current.add(listener)
    return () => {
      listenersRef.current.delete(listener)
    }
  }, [])

  const profile = useMemo(
    () =>
      detectDeviceProfile(
        devices
          .map((device) => `${device.manufacturer} ${device.name}`)
          .join(' '),
      ),
    [devices],
  )

  const value = useMemo<MidiContextValue>(
    () => ({
      status,
      devices,
      outputs,
      permission,
      profile,
      heldNotes,
      events,
      lastEvent,
      lastRaw,
      error,
      supported,
      connect,
      retry,
      disconnect,
      clearEvents,
      subscribe,
    }),
    [
      clearEvents,
      connect,
      devices,
      disconnect,
      error,
      events,
      heldNotes,
      lastEvent,
      lastRaw,
      outputs,
      permission,
      profile,
      retry,
      status,
      subscribe,
      supported,
    ],
  )

  return <MidiContext.Provider value={value}>{children}</MidiContext.Provider>
}
