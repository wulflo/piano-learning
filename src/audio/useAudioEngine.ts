import { useEffect, useMemo, useRef, useState } from 'react'
import { AudioEngine, type AudioEngineOptions, type AudioEngineState } from './engine'

export interface UseAudioEngineResult {
  engine: AudioEngine
  state: AudioEngineState
}

/** Crea un `AudioEngine` estable y sincroniza su estado con React. */
export function useAudioEngine(options: AudioEngineOptions = {}): UseAudioEngineResult {
  const optionsRef = useRef(options)
  const engineRef = useRef<AudioEngine | null>(null)
  if (!engineRef.current) {
    engineRef.current = new AudioEngine(optionsRef.current)
  }
  const engine = engineRef.current
  const [state, setState] = useState<AudioEngineState>(() => engine.getState())

  useEffect(() => engine.subscribe(setState), [engine])
  useEffect(() => () => engine.dispose(), [engine])

  return useMemo(() => ({ engine, state }), [engine, state])
}
