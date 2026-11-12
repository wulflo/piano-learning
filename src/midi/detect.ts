/**
 * Detección de Web MIDI y solicitud de permiso.
 */
export type MidiPermissionState = 'granted' | 'denied' | 'prompt' | 'unsupported'

export function isWebMidiSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof (navigator as Navigator & { requestMIDIAccess?: unknown })
      .requestMIDIAccess === 'function'
  )
}

export async function requestMidiAccess(): Promise<MIDIAccess | null> {
  if (!isWebMidiSupported()) return null
  try {
    return await (
      navigator as Navigator & {
        requestMIDIAccess: (options?: { sysex?: boolean }) => Promise<MIDIAccess>
      }
    ).requestMIDIAccess({ sysex: false })
  } catch {
    return null
  }
}

export async function getMidiPermissionState(): Promise<MidiPermissionState> {
  if (!isWebMidiSupported()) return 'unsupported'
  try {
    const permission = await navigator.permissions.query({
      name: 'midi' as PermissionName,
    })
    return permission.state as MidiPermissionState
  } catch {
    return 'prompt'
  }
}
