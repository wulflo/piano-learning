/// <reference types="vite-plugin-pwa/react" />
import { useRegisterSW } from 'virtual:pwa-register/react'
import { useSettings } from '../state/settings'

/**
 * Banner de estado PWA: avisa cuando la app quedó lista sin conexión. El
 * service worker usa `autoUpdate`, así que una versión nueva se activa sola y
 * la próxima recarga ya la muestra; no hay aviso de actualización que pulsar.
 */
export function PwaStatus() {
  const { t } = useSettings()
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
    offlineReady: [offlineReady],
  } = useRegisterSW({
    onRegistered() {
      // noop
    },
    onRegisterError() {
      // noop
    },
  })

  if (!offlineReady && !needRefresh) return null

  return (
    <div className="pwa-status" role="status" aria-live="polite">
      {offlineReady && <p className="muted">{t('pwa.offlineReady')}</p>}
      {needRefresh && (
        <p className="muted">
          {t('pwa.updateAvailable')}{' '}
          <button type="button" onClick={() => updateServiceWorker(true)}>
            {t('pwa.reload')}
          </button>
        </p>
      )}
    </div>
  )
}