import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import {
  BLACK_KEY_OFFSET,
  BLACK_KEY_WIDTH,
  DEFAULT_OCTAVES,
  DEFAULT_START_MIDI,
  buildKeyboardLayout,
  whiteKeyCount,
} from '../keyboard/layout'
import { midiName, midiNameWithOctave } from '../notation'
import { useMidi } from '../midi/context'
import { useSettings } from '../state/settings'
import type { FingerAssignment } from '../keyboard/fingering'

export interface KeyboardProps {
  startMidi?: number
  octaves?: number
  /** Notas resaltadas por la teoría, el audio o un ejercicio. */
  highlighted?: ReadonlyArray<number>
  /** Notas que otro componente mantiene activas (por ejemplo, una escala). */
  activeNotes?: ReadonlyArray<number>
  /** Digitacion por nota: numero de dedo y mano. */
  fingering?: ReadonlyArray<FingerAssignment>
  onNoteOn?: (midi: number) => void
  onNoteOff?: (midi: number) => void
  enableComputerKeyboard?: boolean
  className?: string
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable
  )
}

export function Keyboard({
  startMidi = DEFAULT_START_MIDI,
  octaves = DEFAULT_OCTAVES,
  highlighted = [],
  activeNotes = [],
  fingering = [],
  onNoteOn,
  onNoteOff,
  enableComputerKeyboard = true,
  className,
}: KeyboardProps) {
  const { settings, t } = useSettings()
  const { heldNotes: midiNotes } = useMidi()
  const showFingering = settings.showFingering && fingering.length > 0
  const layout = useMemo(
    () => buildKeyboardLayout(startMidi, octaves),
    [startMidi, octaves],
  )
  const whites = useMemo(() => whiteKeyCount(layout), [layout])
  const fingeringByMidi = useMemo(() => {
    const map = new Map<number, FingerAssignment>()
    for (const assignment of fingering) map.set(assignment.midi, assignment)
    return map
  }, [fingering])
  const highlightedSet = useMemo(() => new Set(highlighted), [highlighted])
  const externalActiveSet = useMemo(
    () => new Set([...activeNotes, ...midiNotes]),
    [activeNotes, midiNotes],
  )

  const [pressed, setPressed] = useState<ReadonlySet<number>>(() => new Set())
  const pressedRef = useRef<ReadonlySet<number>>(pressed)
  pressedRef.current = pressed

  const sourcesRef = useRef(new Map<number, Set<string>>())
  const pointerToMidiRef = useRef(new Map<number, number>())
  const buttonsRef = useRef(new Map<number, HTMLButtonElement>())
  const onNoteOnRef = useRef(onNoteOn)
  const onNoteOffRef = useRef(onNoteOff)
  onNoteOnRef.current = onNoteOn
  onNoteOffRef.current = onNoteOff

  const startNote = useCallback((midi: number, source: string) => {
    const sources = sourcesRef.current
    const holders = sources.get(midi) ?? new Set<string>()
    const wasSilent = holders.size === 0
    holders.add(source)
    sources.set(midi, holders)
    if (wasSilent) {
      setPressed((current) => new Set(current).add(midi))
      onNoteOnRef.current?.(midi)
    }
  }, [])

  const stopNote = useCallback((midi: number, source: string) => {
    const sources = sourcesRef.current
    const holders = sources.get(midi)
    if (!holders || !holders.delete(source)) return
    if (holders.size === 0) {
      sources.delete(midi)
      setPressed((current) => {
        const next = new Set(current)
        next.delete(midi)
        return next
      })
      onNoteOffRef.current?.(midi)
    }
  }, [])

  const releaseAll = useCallback(() => {
    const active = [...sourcesRef.current.keys()]
    sourcesRef.current.clear()
    pointerToMidiRef.current.clear()
    if (active.length > 0) {
      setPressed(new Set())
      for (const midi of active) onNoteOffRef.current?.(midi)
    }
  }, [])

  useEffect(() => releaseAll, [releaseAll])

  useEffect(() => {
    if (!enableComputerKeyboard) return
    const keyMap = settings.computerKeys

    const handleDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat) return
      if (event.ctrlKey || event.metaKey || event.altKey) return
      if (isTypingTarget(event.target)) return
      const key = event.key.toLowerCase()
      const midi = keyMap[key]
      if (midi === undefined) return
      event.preventDefault()
      startNote(midi, `key:${key}`)
    }

    const handleUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      const midi = keyMap[key]
      if (midi === undefined) return
      stopNote(midi, `key:${key}`)
    }

    const handleBlur = () => releaseAll()

    window.addEventListener('keydown', handleDown)
    window.addEventListener('keyup', handleUp)
    window.addEventListener('blur', handleBlur)
    return () => {
      window.removeEventListener('keydown', handleDown)
      window.removeEventListener('keyup', handleUp)
      window.removeEventListener('blur', handleBlur)
      releaseAll()
    }
  }, [enableComputerKeyboard, settings.computerKeys, startNote, stopNote, releaseAll])

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>, midi: number) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return
      event.preventDefault()
      const previous = pointerToMidiRef.current.get(event.pointerId)
      if (previous !== undefined && previous !== midi) {
        stopNote(previous, `pointer:${event.pointerId}`)
      }
      pointerToMidiRef.current.set(event.pointerId, midi)
      if (event.currentTarget.setPointerCapture) {
        try {
          event.currentTarget.setPointerCapture(event.pointerId)
        } catch {
          // Algunos navegadores no permiten capturar punteros sintéticos.
        }
      }
      startNote(midi, `pointer:${event.pointerId}`)
    },
    [startNote, stopNote],
  )

  const handlePointerEnd = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      const midi = pointerToMidiRef.current.get(event.pointerId)
      if (midi === undefined) return
      pointerToMidiRef.current.delete(event.pointerId)
      stopNote(midi, `pointer:${event.pointerId}`)
      if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
        try {
          event.currentTarget.releasePointerCapture(event.pointerId)
        } catch {
          // La captura ya pudo haberse liberado.
        }
      }
    },
    [stopNote],
  )

  const [focusMidi, setFocusMidi] = useState<number | null>(layout[0]?.midi ?? null)

  const moveFocus = (index: number) => {
    const target = layout[(index + layout.length) % layout.length]
    if (!target) return
    setFocusMidi(target.midi)
    buttonsRef.current.get(target.midi)?.focus()
  }

  const handleButtonKeyDown = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
    index: number,
    midi: number,
  ) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault()
      moveFocus(index + 1)
      return
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault()
      moveFocus(index - 1)
      return
    }
    if (event.key === 'Home') {
      event.preventDefault()
      moveFocus(0)
      return
    }
    if (event.key === 'End') {
      event.preventDefault()
      moveFocus(layout.length - 1)
      return
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (!event.repeat) startNote(midi, `button:${midi}`)
    }
  }

  const handleButtonKeyUp = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
    midi: number,
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      stopNote(midi, `button:${midi}`)
    }
  }

  return (
    <section className={['keyboard', className].filter(Boolean).join(' ')} aria-labelledby="keyboard-title">
      <div className="keyboard-header">
        <h2 id="keyboard-title">{t('keyboard.title')}</h2>
        <p className="muted">{t('keyboard.hint')}</p>
        {showFingering && (
          <p className="muted keyboard-fingering-legend">{t('keyboard.fingering.legend')}</p>
        )}
      </div>

      <div
        className="keyboard-keys"
        role="group"
        aria-label={`${t('keyboard.title')} de ${octaves} octavas`}
        style={{ ['--white-count' as string]: whites }}
      >
        {layout.map((key, index) => {
          const isPressed =
            pressed.has(key.midi) || externalActiveSet.has(key.midi)
          const isHighlighted = highlightedSet.has(key.midi)
          const label = midiNameWithOctave(key.midi, settings.notation)
          const descriptor = key.isBlack
            ? t('keyboard.black')
            : t('keyboard.white')
          const fingeringInfo = showFingering ? fingeringByMidi.get(key.midi) : undefined
          const fingeringHandKey = fingeringInfo
            ? `keyboard.hand.${fingeringInfo.hand}`
            : null
          const ariaParts = [label, descriptor]
          if (fingeringInfo) {
            ariaParts.push(
              t('keyboard.fingering', {
                finger: fingeringInfo.finger,
                hand: t(fingeringHandKey ?? ''),
              }),
            )
          }
          if (isHighlighted) ariaParts.push(t('keyboard.highlighted'))
          if (isPressed) ariaParts.push(t('keyboard.pressed'))
          const shortName = midiName(key.midi, settings.notation)
          const left = ((key.whiteIndex + (key.blackOffset ?? BLACK_KEY_OFFSET)) / whites) * 100
          const width = (BLACK_KEY_WIDTH / whites) * 100

          return (
            <button
              key={key.midi}
              ref={(node) => {
                if (node) buttonsRef.current.set(key.midi, node)
                else buttonsRef.current.delete(key.midi)
              }}
              type="button"
              className={[
                'piano-key',
                key.isBlack ? 'piano-key-black' : 'piano-key-white',
                isPressed ? 'is-pressed' : '',
                isHighlighted ? 'is-highlighted' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={
                key.isBlack
                  ? { left: `${left}%`, width: `${width}%` }
                  : undefined
              }
              tabIndex={focusMidi === key.midi ? 0 : -1}
              aria-label={ariaParts.join(', ')}
              aria-pressed={isPressed}
              data-midi={key.midi}
              data-black={key.isBlack ? 'true' : 'false'}
              data-highlighted={isHighlighted ? 'true' : undefined}
              data-fingering={fingeringInfo ? 'true' : undefined}
              onFocus={() => setFocusMidi(key.midi)}
              onPointerDown={(event) => handlePointerDown(event, key.midi)}
              onPointerUp={handlePointerEnd}
              onPointerCancel={handlePointerEnd}
              onLostPointerCapture={handlePointerEnd}
              onKeyDown={(event) => handleButtonKeyDown(event, index, key.midi)}
              onKeyUp={(event) => handleButtonKeyUp(event, key.midi)}
            >
              {fingeringInfo && (
                <span
                  className="key-fingering"
                  data-fingering="true"
                  data-hand={fingeringInfo.hand}
                  aria-hidden="true"
                >
                  <span className="key-fingering-finger">{fingeringInfo.finger}</span>
                  <span className="key-fingering-hand">{fingeringHandKey ? t(fingeringHandKey + '.short') : ''}</span>
                </span>
              )}
              <span className="key-name">{shortName}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
