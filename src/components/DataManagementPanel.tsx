import { useRef, useState } from 'react'
import {
  collectProgressData,
  createProgressExport,
  downloadProgressFile,
} from '../state/progress-export'
import {
  saveProgressCopy,
  supportsProgressFolder,
} from '../state/progress-folder'
import {
  importProgress,
  parseProgressFile,
  type ParsedProgressFile,
} from '../state/progress-import'
import { useProgress } from '../state/progress-context'
import {
  RESET_CONFIRMATION_WORD,
  resetProgress,
} from '../state/progress-reset'
import { DEFAULT_SETTINGS, useSettings } from '../state/settings'
import { settingsToRecord } from '../state/settings-record'

/**
 * Gestión de datos de la pantalla de ajustes.
 *
 * Conecta los módulos ya probados de exportación, importación y reseteo con
 * botones reales. La importación valida el archivo antes de mostrar el resumen
 * y solo reemplaza cuando la persona confirma. El reseteo exige la palabra
 * `BORRAR` y una casilla de comprensión; la API vuelve a comprobar ambas cosas.
 */

type BusyAction = 'export' | 'folder' | 'import' | 'reset' | null

interface Feedback {
  kind: 'success' | 'error'
  text: string
}

interface PendingImport {
  text: string
  parsed: ParsedProgressFile
}

function toError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value))
}

export function DataManagementPanel() {
  const { status, repositories, reload } = useProgress()
  const { resetSettings, t } = useSettings()
  const fileInput = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState<BusyAction>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [pending, setPending] = useState<PendingImport | null>(null)
  const [word, setWord] = useState('')
  const [understood, setUnderstood] = useState(false)

  const ready = status === 'ready' && repositories !== null
  const folderSupported = supportsProgressFolder()
  const canReset =
    ready && understood && word.trim().toLocaleUpperCase('es') === RESET_CONFIRMATION_WORD

  const fail = (error: unknown) => {
    setFeedback({
      kind: 'error',
      text: t('data.error', { message: toError(error).message }),
    })
  }

  const exportFile = async (target: 'download' | 'folder') => {
    if (repositories === null) return
    setBusy(target === 'folder' ? 'folder' : 'export')
    setFeedback(null)

    try {
      const data = await collectProgressData(repositories)
      const file = await createProgressExport(data)

      if (target === 'folder') {
        const saved = await saveProgressCopy(file)
        setFeedback({
          kind: 'success',
          text:
            saved.target === 'folder'
              ? t('data.export.folderDone', {
                  directory: saved.directoryName,
                  file: saved.fileName,
                })
              : t('data.export.done', { file: saved.fileName }),
        })
      } else {
        downloadProgressFile(file)
        setFeedback({
          kind: 'success',
          text: t('data.export.done', { file: file.fileName }),
        })
      }
    } catch (error) {
      fail(error)
    } finally {
      setBusy(null)
    }
  }

  const chooseFile = async (file: File | undefined) => {
    if (file === undefined || repositories === null) return
    setBusy('import')
    setFeedback(null)
    setPending(null)

    try {
      const text = await file.text()
      const parsed = await parseProgressFile(text)
      setPending({ text, parsed })
    } catch (error) {
      fail(error)
    } finally {
      setBusy(null)
      if (fileInput.current !== null) fileInput.current.value = ''
    }
  }

  const confirmImport = async () => {
    if (repositories === null || pending === null) return
    setBusy('import')
    setFeedback(null)

    try {
      const result = await importProgress(repositories, pending.text, {
        confirm: true,
      })
      setPending(null)
      setFeedback({
        kind: 'success',
        text: t('data.import.done', { date: result.replacedAt.slice(0, 10) }),
      })
      reload()
    } catch (error) {
      fail(error)
    } finally {
      setBusy(null)
    }
  }

  const confirmReset = async () => {
    if (repositories === null || !canReset) return
    setBusy('reset')
    setFeedback(null)

    try {
      const result = await resetProgress(repositories, {
        confirmations: 2,
        confirmationWord: word,
      })
      await repositories.settings
        .save(settingsToRecord(DEFAULT_SETTINGS))
        .catch(() => undefined)
      setWord('')
      setUnderstood(false)
      setFeedback({
        kind: 'success',
        text: t('data.reset.done', {
          lessons: result.cleared.lessons,
          reviews: result.cleared.reviews,
          sessions: result.cleared.sessions,
        }),
      })
      resetSettings()
      reload()
    } catch (error) {
      fail(error)
    } finally {
      setBusy(null)
    }
  }

  return (
    <section className="panel data-panel" aria-labelledby="data-title">
      <div className="panel-heading">
        <h2 id="data-title">{t('data.title')}</h2>
        <p className="muted">{t('data.lead')}</p>
      </div>

      {!ready && <p className="muted">{t('data.notReady')}</p>}

      {feedback !== null && (
        <p
          className={
            feedback.kind === 'error' ? 'data-feedback error-panel' : 'data-feedback'
          }
          role={feedback.kind === 'error' ? 'alert' : 'status'}
        >
          {feedback.text}
        </p>
      )}

      <div className="data-grid">
        <article className="data-card" aria-labelledby="data-export-title">
          <h3 id="data-export-title">{t('data.export.title')}</h3>
          <p className="muted">{t('data.export.body')}</p>
          <p className="page-actions">
            <button
              type="button"
              className="button-primary"
              disabled={!ready || busy !== null}
              onClick={() => void exportFile('download')}
            >
              {busy === 'export' ? t('data.working') : t('data.export.download')}
            </button>
            {folderSupported && (
              <button
                type="button"
                className="button-secondary"
                disabled={!ready || busy !== null}
                onClick={() => void exportFile('folder')}
              >
                {busy === 'folder'
                  ? t('data.working')
                  : t('data.export.folder')}
              </button>
            )}
          </p>
        </article>

        <article className="data-card" aria-labelledby="data-import-title">
          <h3 id="data-import-title">{t('data.import.title')}</h3>
          <p className="muted">{t('data.import.body')}</p>
          <label className="field">
            <span>{t('data.import.choose')}</span>
            <input
              ref={fileInput}
              type="file"
              accept=".txt,text/plain"
              disabled={!ready || busy !== null}
              onChange={(event) => void chooseFile(event.target.files?.[0])}
            />
          </label>

          {pending !== null && (
            <div className="data-confirm">
              <p>
                {t('data.import.summary', {
                  lessons: Object.keys(pending.parsed.data.lessons).length,
                  skills: Object.keys(pending.parsed.data.skills).length,
                  reviews: pending.parsed.data.reviews.length,
                  sessions: pending.parsed.data.practiceSessions.length,
                  date: pending.parsed.header.exportedAt.slice(0, 10),
                })}
              </p>
              <p className="page-actions">
                <button
                  type="button"
                  className="button-primary"
                  disabled={busy !== null}
                  onClick={() => void confirmImport()}
                >
                  {t('data.import.confirm')}
                </button>
                <button
                  type="button"
                  className="button-secondary"
                  disabled={busy !== null}
                  onClick={() => setPending(null)}
                >
                  {t('data.import.cancel')}
                </button>
              </p>
            </div>
          )}
        </article>
      </div>

      <article className="data-card data-danger" aria-labelledby="data-reset-title">
        <h3 id="data-reset-title">{t('data.reset.title')}</h3>
        <p className="muted">{t('data.reset.body')}</p>

        <label className="field">
          <span>{t('data.reset.word', { word: RESET_CONFIRMATION_WORD })}</span>
          <input
            type="text"
            value={word}
            autoComplete="off"
            disabled={!ready || busy !== null}
            onChange={(event) => setWord(event.target.value)}
          />
        </label>

        <label className="checkbox">
          <input
            type="checkbox"
            checked={understood}
            disabled={!ready || busy !== null}
            onChange={(event) => setUnderstood(event.target.checked)}
          />
          <span>{t('data.reset.understand')}</span>
        </label>

        <p className="page-actions">
          <button
            type="button"
            className="button-primary"
            disabled={!canReset || busy !== null}
            onClick={() => void confirmReset()}
          >
            {busy === 'reset' ? t('data.working') : t('data.reset.action')}
          </button>
        </p>
      </article>
    </section>
  )
}
