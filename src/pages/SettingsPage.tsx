import { DataManagementPanel } from '../components/DataManagementPanel'
import { MidiDiagnostics } from '../components/MidiDiagnostics'
import { MidiSupportNotice } from '../components/MidiSupportNotice'
import { SettingsPanel } from '../components/SettingsPanel'
import { TeacherNotice } from '../components/TeacherNotice'
import { useSettings } from '../state/settings'

/**
 * Pantalla de ajustes completa.
 *
 * Reúne las preferencias de estudio (notación, idioma, tema, volumen, tempo,
 * repaso y teclas) y la gestión de datos (exportar, importar y restablecer).
 * Los ajustes se guardan en `localStorage` y en la tabla `settings` de Dexie;
 * la exportación los incluye y el reseteo vuelve a los valores por defecto.
 */
export function SettingsPage() {
  const { t } = useSettings()

  return (
    <main className="page" aria-labelledby="settings-page-title">
      <section className="hero">
        <p className="eyebrow">{t('settings.eyebrow')}</p>
        <h1 id="settings-page-title">{t('settings.title')}</h1>
        <p className="lede">{t('settings.lead')}</p>
      </section>

      <SettingsPanel labelledBy="settings-page-title" />
      <MidiSupportNotice />
      <MidiDiagnostics />
      <TeacherNotice titleId="settings-teacher-title" />
      <DataManagementPanel />
    </main>
  )
}
