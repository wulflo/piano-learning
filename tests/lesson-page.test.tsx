import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { App } from '../src/App'
import { findCourseLesson } from '../src/content/course'
import { COURSE_HASH, lessonHash } from '../src/router/hash-route'
import { createProgressDatabase } from '../src/state/db'
import { createProgressRepositories } from '../src/state/repositories'
import type { LessonProgress } from '../src/schemas'

let databaseCounter = 0

function uniqueDatabaseName(): string {
  databaseCounter += 1
  return `pdc.test.lesson-page.${databaseCounter}`
}

async function seedLessons(
  name: string,
  lessons: Record<string, LessonProgress>,
): Promise<void> {
  const repositories = createProgressRepositories(
    createProgressDatabase({ name }),
  )
  await repositories.lessons.clear()
  for (const [lessonId, progress] of Object.entries(lessons)) {
    await repositories.lessons.put(lessonId, progress)
  }
  repositories.close()
}

async function readLesson(
  name: string,
  lessonId: string,
): Promise<LessonProgress | undefined> {
  const repositories = createProgressRepositories(
    createProgressDatabase({ name }),
  )
  const progress = await repositories.lessons.get(lessonId)
  repositories.close()
  return progress
}

function showLesson(lessonId: string): void {
  window.location.hash = lessonHash(lessonId)
  fireEvent(window, new HashChangeEvent('hashchange'))
}

afterEach(() => {
  window.location.hash = ''
})

describe('F2-060 — Reproductor de lección', () => {
  it('avisa cuando la lección no existe en el curso', async () => {
    showLesson('lesson.m9-99')
    render(<App databaseName={uniqueDatabaseName()} />)

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { level: 1, name: 'Lección no encontrada' }),
      ).toBeInTheDocument(),
    )
    expect(screen.getByText('lesson.m9-99')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Volver al curso' }),
    ).toHaveAttribute('href', COURSE_HASH)
  })

  it('bloquea una lección cuyos prerrequisitos no están dominados', async () => {
    showLesson('lesson.m0-02')
    render(<App databaseName={uniqueDatabaseName()} />)

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { level: 1, name: 'Lección bloqueada' }),
      ).toBeInTheDocument(),
    )

    const prerequisite = findCourseLesson('lesson.m0-01')!
    expect(screen.getByText(prerequisite.titleEs)).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Marcar como completada' }),
    ).not.toBeInTheDocument()
  })

  it('muestra secciones, partitura y tarea de una lección disponible', async () => {
    const name = uniqueDatabaseName()
    showLesson('lesson.m0-01')
    render(<App databaseName={name} />)

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { level: 1, name: 'El teclado: grupos de dos y tres negras' }),
      ).toBeInTheDocument(),
    )

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { level: 2, name: 'Objetivos' }),
      ).toBeInTheDocument(),
    )
    expect(
      screen.getByRole('heading', { level: 2, name: 'Un mapa que se repite' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 2, name: 'El mismo patrón en el pentagrama' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 2, name: 'Tarea de teclado' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Escuchar demo' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Iniciar metrónomo' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('group', { name: 'Lista de control' }),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('checkbox')).toHaveLength(3)

    expect(screen.getAllByRole('button', { name: 'Escuchar ejemplo' }).length).toBeGreaterThan(0)

    // La lección disponible se marca en curso al abrirla.
    await waitFor(async () => {
      const progress = await readLesson(name, 'lesson.m0-01')
      expect(progress?.status).toBe('in-progress')
    })
  })

  it('marca la lección como completada y guarda el estado', async () => {
    const name = uniqueDatabaseName()
    showLesson('lesson.m0-01')
    render(<App databaseName={name} />)

    const button = await screen.findByRole('button', {
      name: 'Marcar como completada',
    })
    fireEvent.click(button)

    await waitFor(() =>
      expect(screen.getByText('Lección completada.')).toBeInTheDocument(),
    )
    expect(
      screen.queryByRole('button', { name: 'Marcar como completada' }),
    ).not.toBeInTheDocument()

    const progress = await readLesson(name, 'lesson.m0-01')
    expect(progress?.status).toBe('completed')
    expect(progress?.completedAt).toBeDefined()
  })

  it('respeta una lección ya completada en la base', async () => {
    const name = uniqueDatabaseName()
    await seedLessons(name, {
      'lesson.m0-01': {
        status: 'completed',
        completedAt: '2026-11-01T10:00:00.000Z',
        secondsSpent: 240,
      },
    })

    showLesson('lesson.m0-01')
    render(<App databaseName={name} />)

    await waitFor(() =>
      expect(screen.getByText('Lección completada.')).toBeInTheDocument(),
    )
    expect(
      screen.queryByRole('button', { name: 'Marcar como completada' }),
    ).not.toBeInTheDocument()
    expect(screen.getByText(/Completada/)).toBeInTheDocument()
  })

  it('enlaza con la lección anterior y la siguiente disponible', async () => {
    const name = uniqueDatabaseName()
    await seedLessons(name, {
      'lesson.m0-01': {
        status: 'completed',
        completedAt: '2026-11-01T10:00:00.000Z',
        secondsSpent: 240,
      },
      'lesson.m0-02': {
        status: 'completed',
        completedAt: '2026-11-02T10:00:00.000Z',
        secondsSpent: 240,
      },
    })

    showLesson('lesson.m0-02')
    render(<App databaseName={name} />)

    const nav = await screen.findByRole('navigation', {
      name: 'Seguir el curso',
    })

    const previous = findCourseLesson('lesson.m0-01')!
    const next = findCourseLesson('lesson.m0-03')!

    expect(
      within(nav).getByRole('link', {
        name: new RegExp(previous.titleEs),
      }),
    ).toHaveAttribute('href', lessonHash('lesson.m0-01'))
    expect(
      within(nav).getByRole('link', { name: new RegExp(next.titleEs) }),
    ).toHaveAttribute('href', lessonHash('lesson.m0-03'))
  })

  it('anuncia la siguiente lección bloqueada sin enlazarla', async () => {
    showLesson('lesson.m0-01')
    render(<App databaseName={uniqueDatabaseName()} />)

    const nav = await screen.findByRole('navigation', {
      name: 'Seguir el curso',
    })
    const next = findCourseLesson('lesson.m0-02')!

    expect(
      within(nav).getByText(new RegExp(`Siguiente bloqueada: ${next.titleEs}`)),
    ).toBeInTheDocument()
    expect(
      within(nav).queryByRole('link', { name: new RegExp(next.titleEs) }),
    ).not.toBeInTheDocument()
  })
})
