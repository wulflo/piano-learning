/// <reference types="vite-plugin-pwa/react" />
import { useRegisterSW } from 'virtual:pwa-register/react'
import { useSettings } from '../state/settings'

/**
 * Banner de estado PWA: avisa cuando hay una nueva versión disponible y
 * cuando la app está sin conexión. No fuerza recargas.
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