import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { App } from '../src/App'
import { PROGRESS_HASH } from '../src/router/hash-route'
import {
  ProfileSchema,
  ReviewLogSchema,
  type LessonProgress,
  type PracticeSession,
  type Profile,
  type ReviewLog,
} from '../src/schemas'
import { ProgressDatabase, createProgressDatabase } from '../src/state/db'
import { createProgressRepositories } from '../src/state/repositories'

let databaseCounter = 0

function uniqueDatabaseName(): string {
  databaseCounter += 1
  return `pdc.test.progress-page.${databaseCounter}`
}

interface SeedOptions {
  lessons?: Record<string, LessonProgress>
  reviews?: ReviewLog[]
  sessions?: PracticeSession[]
  profile?: Profile
}

async function seed(name: string, options: SeedOptions): Promise<void> {
  const repositories = createProgressRepositories(
    createProgressDatabase({ name }),
  )
  for (const [lessonId, progress] of Object.entries(options.lessons ?? {})) {
    await repositories.lessons.put(lessonId, progress)
  }
  for (const log of options.reviews ?? []) {
    await repositories.reviews.save(log)
  }
  for (const session of options.sessions ?? []) {
    await repositories.sessions.save(session)
  }
  if (options.profile !== undefined) {
    await repositories.profile.save(options.profile)
  }
  repositories.close()
}

function log(overrides: Partial<ReviewLog> = {}): ReviewLog {
  return ReviewLogSchema.parse({
    id: 'skill.note-names.log.1',
    itemId: 'skill.note-names',
    reviewedAt: '2026-03-10T10:00:00.000Z',
    rating: 'good',
    elapsedDays: 1,
    scheduledDays: 1,
    stability: 2,
    difficulty: 5,
    state: 'review',
    ...overrides,
  })
}

afterEach(() => {
  window.location.hash = ''
})

describe('F2-062 — Pantalla de estadísticas', () => {
  it('muestra estados vacíos honestos sin datos', async () => {
    window.location.hash = PROGRESS_HASH
    render(<App databaseName={uniqueDatabaseName()} />)

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { level: 3, name: 'XP y nivel' }),
      ).toBeInTheDocument(),
    )

    expect(screen.getByText('Nivel 1 · 0 XP')).toBeInTheDocument()
    expect(
      screen.getByText('Te faltan 100 XP para el nivel 2'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Todavía no registraste días de práctica.'),
    ).toBeInTheDocument()
    expect(screen.getByText('0 min')).toBeInTheDocument()
    expect(
      screen.getByText('Todavía no hay tiempo registrado.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('0 respuestas registradas'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Todavía no hay respuestas registradas.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'La retención aparece cuando repasás tarjetas programadas.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'La precisión aparece cuando respondés ejercicios o repasos.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Volver al curso' }),
    ).toHaveAttribute('href', '#/curso')
  })

  it('muestra XP, racha, tiempo, retención y precisión reales', async () => {
    const name = uniqueDatabaseName()
    await seed(name, {
      lessons: {
        'lesson.m0-01': { status: 'in-progress', secondsSpent: 120 },
        'lesson.m0-02': { status: 'completed', secondsSpent: 180 },
      },
      sessions: [
        {
          id: 'session.a',
          startedAt: '2026-03-10T10:00:00.000Z',
          endedAt: '2026-03-10T10:15:00.000Z',
          plannedMinutes: 15,
          blocks: [
            { kind: 'theory', seconds: 60 },
            { kind: 'review', seconds: 90 },
          ],
        },
        {
          id: 'session.b',
          startedAt: '2026-03-11T10:00:00.000Z',
          endedAt: '2026-03-11T10:00:30.000Z',
          plannedMinutes: 15,
          blocks: [],
        },
      ],
      reviews: [
        log({ id: 'skill.note-names.log.1' }),
        log({
          id: 'skill.note-names.log.2',
          reviewedAt: '2026-03-10T11:00:00.000Z',
          rating: 'again',
        }),
        log({
          id: 'skill.major-scale.log.1',
          itemId: 'skill.major-scale',
          reviewedAt: '2026-03-11T10:00:00.000Z',
          rating: 'hard',
          state: 'relearning',
        }),
        // Un paso de aprendizaje no entra en la retención programada.
        log({
          id: 'skill.major-scale.log.2',
          itemId: 'skill.major-scale',
          reviewedAt: '2026-03-11T11:00:00.000Z',
          state: 'learning',
        }),
      ],
      profile: ProfileSchema.parse({
        xp: 250,
        streak: {
          current: 4,
          longest: 9,
          lastPracticeDate: '2026-03-11',
          graceDaysUsedThisWeek: 1,
        },
      }),
    })

    window.location.hash = PROGRESS_HASH
    render(<App databaseName={name} />)

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { level: 3, name: 'XP y nivel' }),
      ).toBeInTheDocument(),
    )

    expect(screen.getByText('Nivel 2 · 250 XP')).toBeInTheDocument()
    expect(
      screen.getByText('Te faltan 50 XP para el nivel 3'),
    ).toBeInTheDocument()
    expect(screen.getByText('4 días seguidos')).toBeInTheDocument()
    expect(screen.getByText('Récord: 9 días')).toBeInTheDocument()

    expect(screen.getByText('8 min')).toBeInTheDocument()
    expect(
      screen.getByText('Lecciones: 5 min · Práctica: 3 min'),
    ).toBeInTheDocument()

    expect(screen.getByText('4 respuestas registradas')).toBeInTheDocument()
    expect(
      screen.getByText('En 2 sesiones de práctica.'),
    ).toBeInTheDocument()

    expect(screen.getByText('67% de repasos recordados')).toBeInTheDocument()
    expect(
      screen.getByText('2 de 3 repasos programados'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('2026-03-10: 50% (1/2)'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('2026-03-11: 100% (1/1)'),
    ).toBeInTheDocument()

    expect(screen.getByText('Identificar notas')).toBeInTheDocument()
    expect(screen.getByText('Escalas')).toBeInTheDocument()
    expect(screen.getByText('50% (1/2)')).toBeInTheDocument()
    expect(screen.getByText('100% (2/2)')).toBeInTheDocument()
  })

  it('muestra un error honesto y permite reintentar', async () => {
    const open = vi
      .spyOn(ProgressDatabase.prototype, 'open')
      .mockRejectedValue(new Error('sin acceso a IndexedDB'))

    try {
      window.location.hash = PROGRESS_HASH
      render(<App databaseName={uniqueDatabaseName()} />)

      await waitFor(() =>
        expect(screen.getByRole('alert')).toHaveTextContent(
          /No se pudieron leer tus estadísticas/,
        ),
      )
      const retry = screen.getByRole('button', { name: 'Reintentar' })
      expect(retry).toBeInTheDocument()

      open.mockRestore()
      fireEvent.click(retry)

      await waitFor(() =>
        expect(
          screen.getByRole('heading', { level: 3, name: 'XP y nivel' }),
        ).toBeInTheDocument(),
      )
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    } finally {
      open.mockRestore()
    }
  })
})
