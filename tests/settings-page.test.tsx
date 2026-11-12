import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../src/App'
import { SETTINGS_HASH } from '../src/router/hash-route'
import {
  ProgressDataSchema,
  SettingsSchema,
  type Settings as ProgressSettings,
} from '../src/schemas'
import { createProgressDatabase } from '../src/state/db'
import { createProgressExport } from '../src/state/progress-export'
import { parseProgressFile } from '../src/state/progress-import'
import { createProgressRepositories } from '../src/state/repositories'
import { SETTINGS_STORAGE_KEY } from '../src/state/settings'

let databaseCounter = 0

function uniqueDatabaseName(): string {
  databaseCounter += 1
  return `pdc.test.settings-page.${databaseCounter}`
}

async function readSettings(
  name: string,
): Promise<ProgressSettings | undefined> {
  const repositories = createProgressRepositories(
    createProgressDatabase({ name }),
  )
  const settings = await repositories.settings.read()
  repositories.close()
  return settings
}

async function readLessonCount(name: string): Promise<number> {
  const repositories = createProgressRepositories(
    createProgressDatabase({ name }),
  )
  const lessons = await repositories.lessons.all()
  repositories.close()
  return lessons.length
}

async function seed(
  name: string,
  record: ProgressSettings,
  lessonCount = 0,
): Promise<void> {
  const repositories = createProgressRepositories(
    createProgressDatabase({ name }),
  )
  await repositories.settings.save(record)
  for (let index = 0; index < lessonCount; index += 1) {
    await repositories.lessons.put(`lesson.m0-0${index + 1}`, {
      status: 'completed',
      completedAt: '2026-11-01T10:00:00.000Z',
      secondsSpent: 120,
    })
  }
  repositories.close()
}

function showSettings(): void {
  window.location.hash = SETTINGS_HASH
  fireEvent(window, new HashChangeEvent('hashchange'))
}

beforeEach(() => {
  localStorage.clear()
  delete document.documentElement.dataset.theme
})

afterEach(() => {
  window.location.hash = ''
  localStorage.clear()
  delete document.documentElement.dataset.theme
})

describe('F2-063 — Ajustes completos', () => {
  it('guarda tema, notación y tope diario en Dexie y localStorage', async () => {
    const name = uniqueDatabaseName()
    showSettings()
    render(<App databaseName={name} />)

    const theme = await screen.findByLabelText('Tema')
    fireEvent.change(theme, { target: { value: 'dark' } })
    fireEvent.change(screen.getByLabelText('Notación'), {
      target: { value: 'do' },
    })
    fireEvent.change(screen.getByLabelText(/Ítems nuevos por día/), {
      target: { value: '5' },
    })

    expect(document.documentElement.dataset.theme).toBe('dark')

    await waitFor(async () => {
      const record = await readSettings(name)
      expect(record).toMatchObject({
        notation: 'do',
        theme: 'dark',
        newPerDay: 5,
      })
    })

    const local = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) ?? '{}')
    expect(local).toMatchObject({ notation: 'do', theme: 'dark', newPerDay: 5 })
  })

  it('hidrata los ajustes persistidos al abrir la app', async () => {
    const name = uniqueDatabaseName()
    await seed(
      name,
      SettingsSchema.parse({
        notation: 'do',
        locale: 'en',
        theme: 'dark',
        desiredRetention: 0.85,
        maximumInterval: 120,
        fuzz: true,
        newPerDay: 3,
        audioVolume: 0.25,
        tempoBpm: 120,
        midiEnabled: true,
      }),
    )

    showSettings()
    render(<App databaseName={name} />)

    await screen.findByRole('heading', { level: 1, name: 'Settings' })
    // El idioma y el tema se aplican en efectos posteriores al primer render;
    // esperarlos evita que la suite falle por una carrera entre archivos.
    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe('dark')
      expect(document.documentElement.lang).toBe('en')
    })
    expect(screen.getByLabelText('Theme')).toHaveValue('dark')
    expect(screen.getByLabelText('Notation')).toHaveValue('do')

    const volume = screen.getByLabelText(/Volume/) as HTMLInputElement
    expect(volume.value).toBe('-12')
    const tempo = screen.getByLabelText(/Tempo/) as HTMLInputElement
    expect(tempo.value).toBe('120')
    expect(screen.getByLabelText(/New items per day/)).toHaveValue(3)

    await waitFor(() => {
      const local = JSON.parse(
        localStorage.getItem(SETTINGS_STORAGE_KEY) ?? '{}',
      )
      expect(local).toMatchObject({ language: 'en', theme: 'dark' })
    })
  })

  it('aplica el tema claro y el oscuro sin opción de sistema', async () => {
    const name = uniqueDatabaseName()
    showSettings()
    render(<App databaseName={name} />)

    const theme = await screen.findByLabelText('Tema')
    fireEvent.change(theme, { target: { value: 'light' } })
    expect(document.documentElement.dataset.theme).toBe('light')

    fireEvent.change(theme, { target: { value: 'dark' } })
    expect(document.documentElement.dataset.theme).toBe('dark')

    expect(screen.queryByRole('option', { name: 'Sistema' })).toBeNull()
  })

  it('exporta el progreso con los ajustes actuales', async () => {
    const originalCreate = URL.createObjectURL
    const originalRevoke = URL.revokeObjectURL
    const createObjectURL = vi.fn((_blob: Blob) => 'blob:progress')
    const revokeObjectURL = vi.fn()
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: createObjectURL,
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: revokeObjectURL,
    })
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined)

    try {
      const name = uniqueDatabaseName()
      showSettings()
      render(<App databaseName={name} />)

      fireEvent.change(await screen.findByLabelText('Notación'), {
        target: { value: 'do' },
      })
      fireEvent.change(screen.getByLabelText('Tema'), {
        target: { value: 'dark' },
      })

      await waitFor(async () => {
        expect((await readSettings(name))?.theme).toBe('dark')
      })

      fireEvent.click(screen.getByRole('button', { name: 'Descargar archivo' }))

      await waitFor(() => expect(createObjectURL).toHaveBeenCalledOnce())
      const blob = createObjectURL.mock.calls[0][0] as Blob
      const parsed = await parseProgressFile(await blob.text())

      expect(parsed.data.settings).toMatchObject({
        notation: 'do',
        theme: 'dark',
      })
      expect(click).toHaveBeenCalledOnce()
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:progress')
      expect(
        await screen.findByText(/Archivo listo: pianodesdecero-progreso-/),
      ).toBeInTheDocument()
    } finally {
      click.mockRestore()
      Object.defineProperty(URL, 'createObjectURL', {
        configurable: true,
        writable: true,
        value: originalCreate,
      })
      Object.defineProperty(URL, 'revokeObjectURL', {
        configurable: true,
        writable: true,
        value: originalRevoke,
      })
    }
  })

  it('importa un archivo válido solo después de confirmar', async () => {
    const name = uniqueDatabaseName()
    await seed(name, SettingsSchema.parse({ notation: 'c' }), 1)

    const exported = await createProgressExport(
      ProgressDataSchema.parse({
        schemaVersion: 1,
        lessons: {
          'lesson.m0-02': {
            status: 'completed',
            completedAt: '2026-11-02T10:00:00.000Z',
            secondsSpent: 240,
          },
        },
        settings: SettingsSchema.parse({
          notation: 'do',
          locale: 'en',
          theme: 'dark',
          newPerDay: 4,
        }),
      }),
    )

    showSettings()
    render(<App databaseName={name} />)

    const input = (await screen.findByLabelText(
      'Elegir archivo .txt',
    )) as HTMLInputElement
    await waitFor(() => expect(input).toBeEnabled())
    const file = new File([exported.text], exported.fileName, {
      type: 'text/plain',
    })
    await userEvent.setup().upload(input, file)

    expect(
      await screen.findByText(/Archivo válido: 1 lecciones/),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Reemplazar todo el progreso' }),
    ).toBeInTheDocument()

    fireEvent.click(
      screen.getByRole('button', { name: 'Reemplazar todo el progreso' }),
    )

    expect(
      await screen.findByText(/Progreso reemplazado el 2026-/),
    ).toBeInTheDocument()

    await waitFor(async () => {
      const record = await readSettings(name)
      expect(record).toMatchObject({
        notation: 'do',
        locale: 'en',
        theme: 'dark',
        newPerDay: 4,
      })
    })
  })

  it('rechaza un archivo inválido sin tocar el progreso', async () => {
    const name = uniqueDatabaseName()
    await seed(name, SettingsSchema.parse({ notation: 'do' }), 1)

    showSettings()
    render(<App databaseName={name} />)

    const input = (await screen.findByLabelText(
      'Elegir archivo .txt',
    )) as HTMLInputElement
    await waitFor(() => expect(input).toBeEnabled())
    await userEvent
      .setup()
      .upload(input, new File(['esto no es un archivo'], 'roto.txt', { type: 'text/plain' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /No se pudo completar la operación/,
    )
    expect(
      screen.queryByRole('button', { name: 'Reemplazar todo el progreso' }),
    ).not.toBeInTheDocument()

    await waitFor(async () => {
      expect(await readLessonCount(name)).toBe(1)
      expect((await readSettings(name))?.notation).toBe('do')
    })
  })

  it('restablece todo el progreso con palabra y casilla', async () => {
    const name = uniqueDatabaseName()
    await seed(name, SettingsSchema.parse({ notation: 'do', theme: 'dark' }), 1)

    showSettings()
    render(<App databaseName={name} />)

    const action = await screen.findByRole('button', {
      name: 'Restablecer todo el progreso',
    })
    expect(action).toBeDisabled()

    const wordInput = screen.getByLabelText(/Escribe BORRAR/)
    const understand = screen.getByLabelText(
      'Entiendo que esta acción no se puede deshacer',
    )
    await waitFor(() => {
      expect(wordInput).toBeEnabled()
      expect(understand).toBeEnabled()
    })

    fireEvent.change(wordInput, { target: { value: 'borrar' } })
    expect(action).toBeDisabled()

    fireEvent.click(understand)
    expect(action).toBeEnabled()

    fireEvent.click(action)

    expect(
      await screen.findByText(
        /Progreso restablecido\. Se borraron 1 lecciones/,
      ),
    ).toBeInTheDocument()

    await waitFor(async () => {
      expect(await readLessonCount(name)).toBe(0)
      const record = await readSettings(name)
      expect(record?.theme ?? 'light').toBe('light')
      expect(record?.notation ?? 'c').toBe('c')
    })
  })
})
