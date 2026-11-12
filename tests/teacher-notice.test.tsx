import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { App } from '../src/App'
import { SETTINGS_HASH, lessonHash } from '../src/router/hash-route'
import { SettingsSchema, type LessonProgress } from '../src/schemas'
import { createProgressDatabase } from '../src/state/db'
import { createProgressRepositories } from '../src/state/repositories'

/**
 * F2-069 — Aviso honesto sobre aprender sin profesor.
 *
 * El aviso debe verse en las lecciones de M0 y en ajustes, recordar los límites
 * de la app y proponer espejo y grabación sin abrir modales ni bloquear el
 * flujo. También debe estar traducido al inglés.
 */

let databaseCounter = 0

function uniqueDatabaseName(): string {
  databaseCounter += 1
  return `pdc.test.teacher-notice.${databaseCounter}`
}

async function seedLessons(
  name: string,
  lessons: Record<string, LessonProgress>,
): Promise<void> {
  const repositories = createProgressRepositories(
    createProgressDatabase({ name }),
  )
  for (const [lessonId, progress] of Object.entries(lessons)) {
    await repositories.lessons.put(lessonId, progress)
  }
  repositories.close()
}

async function seedLanguage(name: string, locale: 'es' | 'en'): Promise<void> {
  const repositories = createProgressRepositories(
    createProgressDatabase({ name }),
  )
  await repositories.settings.save(SettingsSchema.parse({ locale }))
  repositories.close()
}

function showLesson(lessonId: string): void {
  window.location.hash = lessonHash(lessonId)
  fireEvent(window, new HashChangeEvent('hashchange'))
}

function showSettings(): void {
  window.location.hash = SETTINGS_HASH
  fireEvent(window, new HashChangeEvent('hashchange'))
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  window.location.hash = ''
  localStorage.clear()
})

describe('F2-069 — Aviso de aprender sin profesor', () => {
  it('se muestra en una lección de M0 con consejos de espejo y grabación', async () => {
    showLesson('lesson.m0-01')
    render(<App databaseName={uniqueDatabaseName()} />)

    const heading = await screen.findByRole('heading', {
      level: 2,
      name: 'Aprender sin profesor tiene límites',
    })
    const notice = heading.closest('section')!

    expect(notice).toHaveTextContent(
      'no reemplaza una clase presencial',
    )
    expect(notice).toHaveTextContent('Usá un espejo')
    expect(notice).toHaveTextContent('Grabate con el teléfono')
    expect(notice).toHaveTextContent('no bloquea las lecciones')
  })

  it('no bloquea el flujo de la lección', async () => {
    showLesson('lesson.m0-01')
    render(<App databaseName={uniqueDatabaseName()} />)

    await screen.findByRole('heading', {
      level: 2,
      name: 'Aprender sin profesor tiene límites',
    })

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Marcar como completada' }),
    ).toBeEnabled()
  })

  it('no se repite en una lección de otro módulo', async () => {
    const name = uniqueDatabaseName()
    await seedLessons(name, {
      'lesson.m0-06': {
        status: 'completed',
        completedAt: '2026-11-01T10:00:00.000Z',
        secondsSpent: 240,
      },
    })

    showLesson('lesson.m1-01')
    render(<App databaseName={name} />)

    await screen.findByRole('heading', {
      level: 1,
      name: 'Altura, duración, intensidad y timbre',
    })
    expect(
      screen.queryByRole('heading', {
        name: 'Aprender sin profesor tiene límites',
      }),
    ).not.toBeInTheDocument()
  })

  it('se muestra en ajustes', async () => {
    showSettings()
    render(<App databaseName={uniqueDatabaseName()} />)

    expect(
      await screen.findByRole('heading', {
        level: 2,
        name: 'Aprender sin profesor tiene límites',
      }),
    ).toBeInTheDocument()
  })

  it('traduce el aviso al inglés', async () => {
    const name = uniqueDatabaseName()
    await seedLanguage(name, 'en')

    showSettings()
    render(<App databaseName={name} />)

    const heading = await screen.findByRole('heading', {
      level: 2,
      name: 'Learning without a teacher has limits',
    })
    const notice = heading.closest('section')!

    expect(notice).toHaveTextContent('Use a mirror')
    expect(notice).toHaveTextContent('Record yourself with your phone')
    expect(notice).toHaveTextContent('does not block lessons')

    await waitFor(() =>
      expect(document.documentElement.lang).toBe('en'),
    )
  })
})
