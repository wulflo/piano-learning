import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { App } from '../src/App'
import { COURSE_MODULES, findCourseLesson } from '../src/content/course'
import { DEMO_HASH, lessonHash } from '../src/router/hash-route'
import { ProgressDatabase, createProgressDatabase } from '../src/state/db'
import { createProgressRepositories } from '../src/state/repositories'
import type { LessonProgress } from '../src/schemas'

let databaseCounter = 0

function uniqueDatabaseName(): string {
  databaseCounter += 1
  return `pdc.test.course-page.${databaseCounter}`
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

afterEach(() => {
  window.location.hash = ''
})

describe('F2-059 — Mapa visual del curso', () => {
  it('muestra los nueve módulos y el estado inicial sin progreso', async () => {
    window.location.hash = ''
    const { unmount } = render(<App databaseName={uniqueDatabaseName()} />)

    await waitFor(() =>
      expect(screen.getByText(/0 de 79 lecciones/)).toBeInTheDocument(),
    )

    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(
      COURSE_MODULES.length,
    )
    for (const module of COURSE_MODULES) {
      expect(
        screen.getByRole('heading', { level: 3, name: new RegExp(module.id) }),
      ).toBeInTheDocument()
    }

    const firstLesson = findCourseLesson('lesson.m0-01')!
    expect(
      screen.getByRole('link', { name: firstLesson.titleEs }),
    ).toHaveAttribute('href', lessonHash('lesson.m0-01'))
    expect(
      screen.getByRole('link', { name: /Continuar por «El teclado/ }),
    ).toHaveAttribute('href', lessonHash('lesson.m0-01'))

    // Una lección bloqueada se anuncia con texto y no es un enlace.
    const locked = findCourseLesson('lesson.m0-02')!
    expect(screen.getByText(locked.titleEs)).toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: locked.titleEs }),
    ).not.toBeInTheDocument()

    // M0 está disponible; M1–M8 bloqueados.
    expect(screen.getAllByText('Disponible')).toHaveLength(2)
    expect(screen.getAllByText('Bloqueado')).toHaveLength(8)
    expect(screen.queryAllByText('Sin lecciones')).toHaveLength(0)
    expect(screen.getAllByText('Bloqueada', { selector: '.lesson-status' }).length).toBe(72)
    // La lección de ampliación se marca como opcional en el mapa.
    expect(screen.getAllByText('Bloqueada · Opcional')).toHaveLength(6)

    expect(
      screen.getByRole('link', { name: 'Ver la demo de la Fase 1' }),
    ).toHaveAttribute('href', DEMO_HASH)

    unmount()
  })

  it('refleja el progreso guardado y permite continuar una lección en curso', async () => {
    window.location.hash = ''
    const name = uniqueDatabaseName()
    await seedLessons(name, {
      'lesson.m0-01': {
        status: 'completed',
        completedAt: '2026-11-01T10:00:00.000Z',
        secondsSpent: 300,
      },
      'lesson.m0-02': { status: 'in-progress', secondsSpent: 40 },
    })

    const { unmount } = render(<App databaseName={name} />)

    await waitFor(() =>
      expect(screen.getByText(/1 de 79 lecciones/)).toBeInTheDocument(),
    )

    expect(screen.getByText(/0 de 9 módulos completados/)).toBeInTheDocument()
    expect(screen.getByText('1 de 6 lecciones')).toBeInTheDocument()

    const completed = findCourseLesson('lesson.m0-01')!
    expect(
      screen.getByRole('link', { name: completed.titleEs }),
    ).toHaveAttribute('href', lessonHash('lesson.m0-01'))
    expect(screen.getByText('Completada')).toBeInTheDocument()

    const current = findCourseLesson('lesson.m0-02')!
    expect(
      screen.getByRole('link', { name: current.titleEs }),
    ).toHaveAttribute('href', lessonHash('lesson.m0-02'))
    expect(
      screen.getByRole('link', { name: /Continuar por «Nombres de notas/ }),
    ).toHaveAttribute('href', lessonHash('lesson.m0-02'))

    // El módulo M0 muestra su barra y su estado en curso.
    expect(screen.getByText('En curso', { selector: '.status-pill' })).toBeInTheDocument()

    unmount()
  })

  it('cierra M8 con el mapa de estilos y la ruta opcional', async () => {
    window.location.hash = ''
    const { unmount } = render(<App databaseName={uniqueDatabaseName()} />)

    await waitFor(() =>
      expect(screen.getByText(/0 de 79 lecciones/)).toBeInTheDocument(),
    )

    expect(
      screen.getByRole('heading', { level: 4, name: 'Mapa de estilos' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Los cuatro estilos de M8 se pueden recorrer en orden/),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/M8 es una ampliación opcional: no bloquea M7/),
    ).toBeInTheDocument()

    // Sin progreso, los cuatro estilos se anuncian bloqueados y no enlazan.
    expect(
      screen.getAllByText('Se abre al completar la lección anterior de la ruta.'),
    ).toHaveLength(4)
    expect(
      screen.queryByRole('link', { name: /Ver la lección y la pieza/ }),
    ).not.toBeInTheDocument()

    unmount()
  })

  it('enlaza cada estilo disponible con su lección y su pieza', async () => {
    const name = uniqueDatabaseName()
    const completedAt = '2026-11-01T10:00:00.000Z'
    await seedLessons(name, {
      'lesson.m7-11': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m8-01': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m8-02': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m8-03': { status: 'completed', completedAt, secondsSpent: 60 },
    })

    window.location.hash = ''
    const { unmount } = render(<App databaseName={name} />)

    await waitFor(() =>
      expect(screen.getByText(/4 de 79 lecciones/)).toBeInTheDocument(),
    )

    const entries = [
      { lessonId: 'lesson.m8-01', piece: 'Ciudad de neón' },
      { lessonId: 'lesson.m8-02', piece: 'Ruta azul' },
      { lessonId: 'lesson.m8-03', piece: 'Tren de medianoche' },
      { lessonId: 'lesson.m8-04', piece: 'Calle de coral' },
    ]
    for (const entry of entries) {
      expect(
        screen.getByRole('link', {
          name: `Ver la lección y la pieza «${entry.piece}»`,
        }),
      ).toHaveAttribute('href', lessonHash(entry.lessonId))
    }

    expect(screen.getByText('Pieza: «Ciudad de neón»')).toBeInTheDocument()
    expect(screen.queryAllByText('Se abre al completar la lección anterior de la ruta.')).toHaveLength(0)

    unmount()
  })

  it('muestra un error honesto si la base no se puede abrir', async () => {
    const open = vi
      .spyOn(ProgressDatabase.prototype, 'open')
      .mockRejectedValue(new Error('sin acceso a IndexedDB'))

    try {
      window.location.hash = ''
      const { unmount } = render(<App databaseName={uniqueDatabaseName()} />)

      await waitFor(() =>
        expect(screen.getByRole('alert')).toHaveTextContent(
          /No se pudo leer el progreso/,
        ),
      )
      expect(
        screen.getByRole('button', { name: 'Reintentar' }),
      ).toBeInTheDocument()

      unmount()
    } finally {
      open.mockRestore()
    }
  })
})
