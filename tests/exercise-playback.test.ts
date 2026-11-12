import { describe, expect, it } from 'vitest'
import {
  canPlay,
  createPlaybackCounter,
  MAX_EXERCISE_PLAYS,
  MAX_EXERCISE_REPEATS,
  playbackCount,
  playbackRepeats,
  registerPlay,
} from '../src/exercises/playback'

describe('F3-024 — Contador de reproducción de ejercicios', () => {
  it('arranca vacío y no registra pasadas hasta que se piden', () => {
    const counter = createPlaybackCounter()
    expect(counter.id).toBeNull()
    expect(playbackCount(counter, 'ex.m3-05.1', 'question')).toBe(0)
    expect(playbackCount(counter, 'ex.m3-05.1', 'answer')).toBe(0)
    expect(canPlay(counter, 'ex.m3-05.1', 'question')).toBe(true)
    expect(canPlay(counter, 'ex.m3-05.1', 'answer')).toBe(true)
  })

  it('cuenta la primera escucha y cada repetición por separado', () => {
    let counter = createPlaybackCounter()
    counter = registerPlay(counter, 'ex.m3-05.1', 'question')
    expect(playbackCount(counter, 'ex.m3-05.1', 'question')).toBe(1)
    expect(playbackRepeats(1)).toBe(0)
    // La primera escucha no consume repeticiones de la respuesta.
    expect(playbackCount(counter, 'ex.m3-05.1', 'answer')).toBe(0)

    counter = registerPlay(counter, 'ex.m3-05.1', 'question')
    expect(playbackRepeats(playbackCount(counter, 'ex.m3-05.1', 'question'))).toBe(1)
  })

  it('mantiene independientes la pregunta y la respuesta', () => {
    let counter = createPlaybackCounter()
    counter = registerPlay(counter, 'ex.m4-10.1', 'question')
    counter = registerPlay(counter, 'ex.m4-10.1', 'answer')
    counter = registerPlay(counter, 'ex.m4-10.1', 'answer')

    expect(playbackCount(counter, 'ex.m4-10.1', 'question')).toBe(1)
    expect(playbackCount(counter, 'ex.m4-10.1', 'answer')).toBe(2)
  })

  it('corta en el tope de pasadas y no incrementa de más', () => {
    let counter = createPlaybackCounter()
    for (let pass = 0; pass < MAX_EXERCISE_PLAYS + 2; pass += 1) {
      counter = registerPlay(counter, 'ex.m3-05.1', 'question')
    }

    expect(MAX_EXERCISE_PLAYS).toBe(MAX_EXERCISE_REPEATS + 1)
    expect(playbackCount(counter, 'ex.m3-05.1', 'question')).toBe(
      MAX_EXERCISE_PLAYS,
    )
    expect(canPlay(counter, 'ex.m3-05.1', 'question')).toBe(false)
    // La respuesta conserva su propio tope.
    expect(canPlay(counter, 'ex.m3-05.1', 'answer')).toBe(true)
  })

  it('reinicia la cuenta al cambiar de ejercicio', () => {
    let counter = createPlaybackCounter()
    counter = registerPlay(counter, 'ex.m3-05.1', 'question')
    // La cuenta del ítem anterior no se arrastra al siguiente.
    expect(playbackCount(counter, 'ex.m3-05.2', 'question')).toBe(0)

    counter = registerPlay(counter, 'ex.m3-05.2', 'question')
    expect(counter.id).toBe('ex.m3-05.2')
    expect(playbackCount(counter, 'ex.m3-05.1', 'question')).toBe(0)
    expect(playbackCount(counter, 'ex.m3-05.2', 'question')).toBe(1)
  })
})
