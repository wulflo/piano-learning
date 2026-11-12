import { useEffect, useRef } from 'react'
import { useProgress } from './progress-context'
import { settingsFromRecord, settingsToRecord } from './settings-record'
import { useSettings } from './settings'

/**
 * Mantiene sincronizados los ajustes de la UI con la fila `settings` de Dexie.
 *
 * `SettingsProvider` arranca desde `localStorage` para que el tema y el idioma
 * estén disponibles antes de abrir IndexedDB. Cuando la base está lista, este
 * componente:
 *
 * 1. lee la fila persistida; si existe, reemplaza los ajustes en memoria;
 * 2. si no existe (instalación nueva o base recién restablecida), guarda los
 *    ajustes actuales para no perder la configuración local;
 * 3. a partir de ahí, cada cambio se escribe tanto en `localStorage` (lo hace
 *    el proveedor) como en Dexie.
 *
 * Al importar un progreso o restablecer la base, `ProgressProvider` entrega
 * repositorios nuevos y este componente vuelve a hidratar desde la fila
 * resultante. Los fallos de escritura no bloquean la interfaz: los ajustes
 * siguen funcionando en memoria y en `localStorage`.
 */
export function SettingsPersistence() {
  const { status, repositories } = useProgress()
  const { settings, updateSettings } = useSettings()
  const hydratedFor = useRef<unknown>(null)
  const currentSettings = useRef(settings)
  currentSettings.current = settings

  useEffect(() => {
    if (status !== 'ready' || repositories === null) return
    if (hydratedFor.current === repositories) return

    let cancelled = false

    repositories.settings.read().then(
      (record) => {
        if (cancelled) return
        if (record === undefined) {
          void repositories.settings
            .save(settingsToRecord(currentSettings.current))
            .catch(() => undefined)
        } else {
          updateSettings(
            settingsFromRecord(record, currentSettings.current.computerKeys),
          )
        }
        hydratedFor.current = repositories
      },
      () => {
        // Sin lectura no se escribe: sería más peligroso pisar una fila que no
        // se pudo comprobar. La UI sigue con los ajustes locales.
        hydratedFor.current = repositories
      },
    )

    return () => {
      cancelled = true
    }
  }, [repositories, status, updateSettings])

  useEffect(() => {
    if (status !== 'ready' || repositories === null) return
    if (hydratedFor.current !== repositories) return

    void repositories.settings
      .save(settingsToRecord(settings))
      .catch(() => undefined)
  }, [repositories, settings, status])

  return null
}
