import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { App } from '../src/App'
import { REVIEW_HASH, lessonHash } from '../src/router/hash-route'
import {
  FsrsCardSchema,
  type FsrsCard,
  type LessonProgress,
  type SkillProgress,
} from '../src/schemas'
import { ProgressDatabase, createProgressDatabase } from '../src/state/db'
import { createProgressRepositories } from '../src/state/repositories'

let databaseCounter = 0

function uniqueDatabaseName(): string {
  databaseCounter += 1
  return `pdc.test.review-page.${databaseCounter}`
}

async function seed(
  name: string,
  options: {
    lessons?: Record<string, LessonProgress>
    skills?: Record<string, SkillProgress>
  },
): Promise<void> {
  const repositories = createProgressRepositories(
    createProgressDatabase({ name }),
  )
  for (const [lessonId, progress] of Object.entries(options.lessons ?? {})) {
    await repositories.lessons.put(lessonId, progress)
  }
  for (const [skillId, progress] of Object.entries(options.skills ?? {})) {
    await repositories.skills.put(skillId, progress)
  }
  repositories.close()
}

function dueCard(daysAgo: number): FsrsCard {
  return FsrsCardSchema.parse({
    due: new Date(Date.now() - daysAgo * 86_400_000).toISOString(),
    stability: 2.5,
    difficulty: 5,
    elapsedDays: 1,
    scheduledDays: 2,
    reps: 3,
    lapses: 0,
    state: 'review',
    learningStep: 0,
  })
}

afterEach(() => {
  window.location.hash = ''
})

describe('F2-061 — Pantalla «Repaso de hoy»', () => {
  it('funciona sin ítems y explica cómo empezar', async () => {
    window.location.hash = REVIEW_HASH
    render(<App databaseName={uniqueDatabaseName()} />)

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { level: 3, name: 'No hay nada para repasar hoy' }),
      ).toBeInTheDocument(),
    )

    expect(screen.getByText('Vencidos: 0 · Nuevos: 0 · Total: 0')).toBeInTheDocument()
    expect(screen.getByText('Respuestas registradas hoy: 0')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Empezar repaso' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByText('Todavía no hay repasos programados.'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Ir al curso' }),
    ).toHaveAttribute('href', '#/curso')
  })

  it('arma la cola con las habilidades de una lección empezada', async () => {
    const name = uniqueDatabaseName()
    await seed(name, {
      lessons: {
        'lesson.m0-01': { status: 'in-progress', secondsSpent: 60 },
      },
    })

    window.location.hash = REVIEW_HASH
    render(<App databaseName={name} />)

    const start = await screen.findByRole('button', { name: 'Empezar repaso' })
    expect(screen.getByText('Vencidos: 0 · Nuevos: 2 · Total: 2')).toBeInTheDocument()
    expect(
      screen.getByText('Reconocer grupos de dos y tres teclas negras'),
    ).toBeInTheDocument()
    expect(screen.getByText('Nombrar notas en el teclado')).toBeInTheDocument()
    expect(screen.getAllByText('Nuevo')).toHaveLength(2)

    fireEvent.click(start)

    expect(
      screen.getByRole('heading', { level: 2, name: 'Recorrido de la cola' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Ítem 1 de 2')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute('value', '1')
    expect(screen.getByRole('progressbar')).toHaveAttribute('max', '2')
    expect(
      screen.getByText(
        'Resolvé los ejercicios y después calificá cómo te salió. Guardamos el tiempo y el resultado para programar el próximo repaso.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', {
        name: 'El teclado: grupos de dos y tres negras',
      }),
    ).toHaveAttribute('href', lessonHash('lesson.m0-01'))
    expect(
      await screen.findByText(/¿Qué nota es la tecla blanca/),
    ).toBeInTheDocument()

    const assessment = screen.getByRole('group', { name: '¿Cómo te salió?' })
    expect(
      within(assessment)
        .getAllByRole('button')
        .map((button) => button.textContent),
    ).toEqual(['Otra vez', 'Difícil', 'Bien', 'Fácil'])

    fireEvent.click(within(assessment).getByRole('button', { name: 'Bien' }))
    expect(await screen.findByText('Ítem 2 de 2')).toBeInTheDocument()

    fireEvent.click(
      within(screen.getByRole('group', { name: '¿Cómo te salió?' })).getByRole(
        'button',
        { name: 'Bien' },
      ),
    )
    expect(
      await screen.findByRole('heading', { level: 2, name: 'Recorrido completo' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Calificaste los 2 ítems de la cola de hoy/),
    ).toBeInTheDocument()
    expect(screen.getByText('2 de 2 respuestas guardadas.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Volver a la cola' }))
    expect(
      await screen.findByRole('heading', {
        level: 3,
        name: 'No hay nada para repasar hoy',
      }),
    ).toBeInTheDocument()
    expect(
      await screen.findByText('Respuestas registradas hoy: 2'),
    ).toBeInTheDocument()

    const repositories = createProgressRepositories(
      createProgressDatabase({ name }),
    )
    const logs = await repositories.reviews.all()
    expect(logs).toHaveLength(2)
    expect(logs.map((log) => log.rating)).toEqual(['good', 'good'])
    for (const log of logs) {
      expect(log.durationMs).toBeGreaterThanOrEqual(0)
      expect(Number.isInteger(log.durationMs)).toBe(true)
      expect(log.format === 'play' || log.format === 'see').toBe(true)
    }
    const skills = await repositories.skills.all()
    expect(skills).toHaveLength(2)
    expect(
      skills.every(
        (skill) =>
          skill.card !== undefined &&
          skill.correct === 1 &&
          skill.incorrect === 0 &&
          skill.mastery > 0,
      ),
    ).toBe(true)
    repositories.close()
  })

  it('prioriza los vencidos y muestra la previsión real', async () => {
    const name = uniqueDatabaseName()
    await seed(name, {
      lessons: {
        'lesson.m0-01': { status: 'in-progress', secondsSpent: 60 },
      },
      skills: {
        'skill.note-names': {
          card: dueCard(1),
          mastery: 0.5,
          correct: 2,
          incorrect: 1,
        },
      },
    })

    window.location.hash = REVIEW_HASH
    render(<App databaseName={name} />)

    await screen.findByRole('button', { name: 'Empezar repaso' })
    expect(screen.getByText('Vencidos: 1 · Nuevos: 1 · Total: 2')).toBeInTheDocument()
    expect(screen.getByText('Vencido')).toBeInTheDocument()
    expect(screen.getByText('Nuevo')).toBeInTheDocument()
    expect(screen.getByText(/Atrasados: 1/)).toBeInTheDocument()
    expect(screen.getByText(/Total a repasar: 1/)).toBeInTheDocument()
  })

  it('muestra un error honesto si la base no se puede abrir', async () => {
    const open = vi
      .spyOn(ProgressDatabase.prototype, 'open')
      .mockRejectedValue(new Error('sin acceso a IndexedDB'))

    try {
      window.location.hash = REVIEW_HASH
      render(<App databaseName={uniqueDatabaseName()} />)

      await waitFor(() =>
        expect(screen.getByRole('alert')).toHaveTextContent(
          /No se pudo leer tu repaso/,
        ),
      )
      expect(
        screen.getByRole('button', { name: 'Reintentar' }),
      ).toBeInTheDocument()
    } finally {
      open.mockRestore()
    }
  })
})
