/**
 * F6-033 — Estado visible de la conexión MIDI.
 *
 * Sin este panel el usuario no sabía si el navegador había pedido permiso, si
 * el dispositivo estaba conectado o qué puerto se estaba escuchando. También
 * permite reintentar la conexión después de enchufar el cable o de cambiar los
 * permisos del navegador.
 */
import { midiNameWithOctave } from '../notation'
import { useMidi } from '../midi/context'
import { useSettings } from '../state/settings'

export function MidiStatusBar() {
  const { settings, t } = useSettings()
  const {
    status,
    devices,
    profile,
    lastEvent,
    error,
    supported,
    connect,
    retry,
    disconnect,
  } = useMidi()

  if (!supported || status === 'unsupported') return null

  const names = devices
    .filter((device) => device.state === 'connected')
    .map((device) => device.name)

  const note =
    lastEvent !== null && lastEvent.velocity > 0
      ? midiNameWithOctave(lastEvent.note, settings.notation)
      : null

  if (status === 'listening') {
    return (
      <aside className="midi-status is-connected" aria-live="polite">
        <p>
          <strong>{t('midi.status.label')}</strong>{' '}
          {names.length > 0
            ? t('midi.status.listening', { devices: names.join(' · ') })
            : t('midi.status.noDevices')}
          {profile === 'yamaha-psr-373' && (
            <> · {t('midi.status.psr')}</>
          )}
          {note !== null && (
            <span className="midi-status-note">
              {' '}
              {t('midi.status.lastNote', { note })}
            </span>
          )}
        </p>
        <button type="button" className="button-secondary" onClick={disconnect}>
          {t('midi.status.disconnect')}
        </button>
      </aside>
    )
  }

  if (status === 'requesting') {
    return (
      <aside className="midi-status" role="status">
        <p>{t('midi.status.requesting')}</p>
      </aside>
    )
  }

  return (
    <aside className="midi-status" role="status">
      <p>
        {status === 'denied'
          ? t('midi.status.denied')
          : status === 'error'
            ? t('midi.status.error', { message: error ?? '' })
            : t('midi.status.idle')}
      </p>
      <button
        type="button"
        className="button-secondary"
        onClick={() => void (status === 'idle' ? connect() : retry())}
      >
        {status === 'idle'
          ? t('midi.status.connect')
          : t('midi.status.retry')}
      </button>
    </aside>
  )
}
