import { useMemo } from 'react'
import { midiNameWithOctave } from '../notation'
import {
  MAXIMUM_INTERVAL_MAX,
  MAXIMUM_INTERVAL_MIN,
  RETENTION_MAX,
  RETENTION_MIN,
} from '../state/fsrs-settings'
import { DAILY_CAP_MAX, DAILY_CAP_MIN } from '../state/load-forecast'
import { DEFAULT_SETTINGS, useSettings } from '../state/settings'

export interface SettingsPanelProps {
  /**
   * Id de un encabezado externo. Cuando se indica, el panel no repite el título
   * y se etiqueta con ese encabezado (por ejemplo, el `h1` de la página).
   */
  labelledBy?: string
}

export function SettingsPanel({ labelledBy }: SettingsPanelProps = {}) {
  const { settings, updateSettings, resetSettings, t } = useSettings()

  const mappings = useMemo(
    () =>
      Object.entries(settings.computerKeys)
        .map(([key, midi]) => ({ key, midi }))
        .sort((a, b) => a.midi - b.midi),
    [settings.computerKeys],
  )

  const assignKey = (midi: number, rawValue: string) => {
    const nextKey = rawValue.trim().toLowerCase().slice(0, 1)
    if (!nextKey) return
    const next: Record<string, number> = {}
    for (const [key, value] of Object.entries(settings.computerKeys)) {
      if (value === midi) continue
      if (key === nextKey) continue
      next[key] = value
    }
    next[nextKey] = midi
    updateSettings({ computerKeys: next })
  }

  return (
    <section
      className="panel settings-panel"
      aria-labelledby={labelledBy ?? 'settings-title'}
    >
      {labelledBy === undefined && (
        <h2 id="settings-title">{t('settings.title')}</h2>
      )}

      <div className="settings-grid">
        <label className="field">
          <span>{t('settings.notation')}</span>
          <select
            value={settings.notation}
            onChange={(event) =>
              updateSettings({ notation: event.target.value === 'do' ? 'do' : 'c' })
            }
          >
            <option value="c">{t('settings.notation.c')}</option>
            <option value="do">{t('settings.notation.do')}</option>
          </select>
        </label>

        <label className="field">
          <span>{t('settings.language')}</span>
          <select
            value={settings.language}
            onChange={(event) =>
              updateSettings({ language: event.target.value === 'en' ? 'en' : 'es' })
            }
          >
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
        </label>

        <label className="field">
          <span>{t('settings.theme')}</span>
          <select
            value={settings.theme === 'dark' ? 'dark' : 'light'}
            onChange={(event) =>
              updateSettings({
                theme: event.target.value === 'dark' ? 'dark' : 'light',
              })
            }
          >
            <option value="light">{t('settings.theme.light')}</option>
            <option value="dark">{t('settings.theme.dark')}</option>
          </select>
        </label>

        <label className="field">
          <span>
            {t('settings.volume')} ({settings.volumeDb} dB)
          </span>
          <input
            type="range"
            min={-40}
            max={0}
            step={1}
            value={settings.volumeDb}
            onChange={(event) => updateSettings({ volumeDb: Number(event.target.value) })}
          />
        </label>

        <label className="field">
          <span>
            {t('settings.tempo')}: {settings.tempo}
          </span>
          <input
            type="range"
            min={40}
            max={240}
            step={1}
            value={settings.tempo}
            onChange={(event) => updateSettings({ tempo: Number(event.target.value) })}
          />
        </label>

        <label className="field">
          <span>
            {t('settings.retention')}:{' '}
            {t('settings.retention.value', {
              percent: Math.round(settings.desiredRetention * 100),
            })}
          </span>
          <input
            type="range"
            min={RETENTION_MIN}
            max={RETENTION_MAX}
            step={0.01}
            value={settings.desiredRetention}
            onChange={(event) =>
              updateSettings({ desiredRetention: Number(event.target.value) })
            }
          />
        </label>

        <label className="field">
          <span>{t('settings.maxInterval')}</span>
          <input
            type="number"
            min={MAXIMUM_INTERVAL_MIN}
            max={MAXIMUM_INTERVAL_MAX}
            step={1}
            value={settings.maximumInterval}
            onChange={(event) =>
              updateSettings({ maximumInterval: Number(event.target.value) })
            }
          />
        </label>

        <label className="field">
          <span>{t('settings.newPerDay')}</span>
          <input
            type="number"
            min={DAILY_CAP_MIN}
            max={DAILY_CAP_MAX}
            step={1}
            value={settings.newPerDay}
            onChange={(event) =>
              updateSettings({ newPerDay: Number(event.target.value) })
            }
          />
          <span className="muted">
            {t('settings.newPerDay.help', {
              min: DAILY_CAP_MIN,
              max: DAILY_CAP_MAX,
            })}
          </span>
        </label>

        <div className="field">
          <label className="checkbox">
            <input
              type="checkbox"
              checked={settings.fuzz}
              onChange={(event) => updateSettings({ fuzz: event.target.checked })}
            />
            <span>{t('settings.fuzz')}</span>
          </label>
          <span className="muted">{t('settings.fuzz.help')}</span>
        </div>

        <div className="field">
          <label className="checkbox">
            <input
              type="checkbox"
              checked={settings.showFingering}
              onChange={(event) =>
                updateSettings({ showFingering: event.target.checked })
              }
            />
            <span>{t('settings.fingering')}</span>
          </label>
          <span className="muted">{t('settings.fingering.help')}</span>
        </div>
      </div>

      <details className="keymap">
        <summary>{t('settings.keys')}</summary>
        <p className="muted">{t('settings.keys.help')}</p>
        <div className="keymap-grid">
          {mappings.map(({ key, midi }) => (
            <label key={midi} className="keymap-row">
              <span>{midiNameWithOctave(midi, settings.notation)}</span>
              <input
                type="text"
                inputMode="text"
                maxLength={1}
                value={key.toUpperCase()}
                aria-label={t('settings.keyFor', {
                  note: midiNameWithOctave(midi, settings.notation),
                })}
                onFocus={(event) => event.currentTarget.select()}
                onChange={(event) => assignKey(midi, event.target.value)}
              />
            </label>
          ))}
        </div>
      </details>

      <button type="button" className="button-secondary" onClick={resetSettings}>
        {t('settings.reset')}
      </button>
      <p className="muted">
        {t('settings.defaults', {
          tempo: DEFAULT_SETTINGS.tempo,
          volume: DEFAULT_SETTINGS.volumeDb,
        })}
      </p>
    </section>
  )
}
