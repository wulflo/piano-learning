import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LessonPlayer } from '../src/components/LessonPlayer'
import { loadLesson } from '../src/content/lessons'
import { ProgressProvider } from '../src/state/progress-context'
import {
  DEFAULT_SETTINGS,
  SettingsProvider,
  useSettings,
} from '../src/state/settings'
import type { Lesson } from '../src/schemas'

/**
 * F2-075 — Cambio de idioma en los componentes.
 *
 * El español y el inglés conviven en el mismo contenido. Este test cambia el
 * idioma en caliente y comprueba que la lección, la tarea de teclado y el
 * ejercicio cargado se vuelven a pintar sin recargar ni perder estado.
 */

let databaseCounter = 0

function uniqueDatabaseName(): string {
  databaseCounter += 1
  return `pdc.test.i18n-switch.${databaseCounter}`
}

function memoryStorage(): Storage {
  const values = new Map<string, string>()
  return {
    get length() {
      return values.size
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => Array.from(values.keys())[index] ?? null,
    removeItem: (key) => {
      values.delete(key)
    },
    setItem: (key, value) => {
      values.set(key, value)
    },
  }
}

function LanguageSwitch({ lesson }: { lesson: Lesson }) {
  const { updateSettings } = useSettings()
  return (
    <>
      <button type="button" onClick={() => updateSettings({ language: 'en' })}>
        Switch to English
      </button>
      <button type="button" onClick={() => updateSettings({ language: 'es' })}>
        Cambiar a español
      </button>
      <LessonPlayer lesson={lesson} />
    </>
  )
}

describe('F2-075 — Cambio de idioma en los componentes', () => {
  it('vuelve a pintar lección, tarea y ejercicio al cambiar ES/EN', async () => {
    const lesson = await loadLesson('lesson.m0-01')

    render(
      <SettingsProvider
        initialSettings={{ ...DEFAULT_SETTINGS, language: 'es' }}
        storage={memoryStorage()}
      >
        <ProgressProvider databaseName={uniqueDatabaseName()}>
          <LanguageSwitch lesson={lesson} />
        </ProgressProvider>
      </SettingsProvider>,
    )

    expect(
      await screen.findByRole('heading', { level: 2, name: 'Un mapa que se repite' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 3, name: 'Encontrá tres Do' }),
    ).toBeInTheDocument()
    expect(
      await screen.findByRole('heading', {
        level: 3,
        name: '¿Qué nota es la tecla blanca inmediatamente a la izquierda de un grupo de dos teclas negras?',
      }),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Switch to English' }))

    expect(
      await screen.findByRole('heading', { level: 2, name: 'A map that repeats' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 3, name: 'Find three Cs' }),
    ).toBeInTheDocument()
    expect(
      await screen.findByRole('heading', {
        level: 3,
        name: 'Which note is the white key immediately to the left of a group of two black keys?',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('radio', { name: 'D' }),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Cambiar a español' }))

    expect(
      await screen.findByRole('heading', { level: 2, name: 'Un mapa que se repite' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        level: 3,
        name: '¿Qué nota es la tecla blanca inmediatamente a la izquierda de un grupo de dos teclas negras?',
      }),
    ).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Re' })).toBeInTheDocument()
  })
})
