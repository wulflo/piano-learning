import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import axe from 'axe-core'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { App } from '../src/App'
import {
  DEMO_HASH,
  PRACTICE_HASH,
  PROGRESS_HASH,
  REPERTOIRE_HASH,
  REVIEW_HASH,
  SETTINGS_HASH,
  lessonHash,
  pieceHash,
} from '../src/router/hash-route'
import { ProfileSchema, ReviewLogSchema } from '../src/schemas'
import { createProgressDatabase } from '../src/state/db'
import { createProgressRepositories } from '../src/state/repositories'

describe('accesibilidad de la app', () => {
  beforeEach(() => {
    window.location.hash = DEMO_HASH
  })

  afterEach(() => {
    window.location.hash = ''
  })

  it('axe no reporta violaciones críticas en teclado, pentagrama y controles', async () => {
    const { container } = render(<App />)
    await waitFor(() =>
      expect(container.querySelector('.staff-canvas svg')).not.toBeNull(),
    )

    const results = await axe.run(container, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
    })

    const serious = results.violations.filter(
      (violation) => violation.impact === 'critical' || violation.impact === 'serious',
    )
    expect(
      serious.map((violation) => `${violation.id}: ${violation.help}`),
    ).toEqual([])
    expect(screen.getByLabelText('Notación')).toBeInTheDocument()
  }, 20000)

  it('axe no reporta violaciones críticas en el mapa del curso', async () => {
    window.location.hash = ''
    const { container } = render(
      <App databaseName="pdc.test.a11y.course" />,
    )
    await waitFor(() =>
      expect(screen.getByText(/0 de 79 lecciones/)).toBeInTheDocument(),
    )

    const results = await axe.run(container, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
    })

    const serious = results.violations.filter(
      (violation) =>
        violation.impact === 'critical' || violation.impact === 'serious',
    )
    expect(
      serious.map((violation) => `${violation.id}: ${violation.help}`),
    ).toEqual([])
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Tu recorrido, paso a paso',
    )
  }, 20000)

  it('axe no reporta violaciones críticas en el reproductor de lección', async () => {
    window.location.hash = lessonHash('lesson.m0-01')
    const { container } = render(
      <App databaseName="pdc.a11y.lesson.player" />,
    )
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { level: 2, name: 'Objetivos' }),
      ).toBeInTheDocument(),
    )

    const results = await axe.run(container, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
    })

    const serious = results.violations.filter(
      (violation) =>
        violation.impact === 'critical' || violation.impact === 'serious',
    )
    expect(
      serious.map((violation) => `${violation.id}: ${violation.help}`),
    ).toEqual([])
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'El teclado: grupos de dos y tres negras',
      }),
    ).toBeInTheDocument()
  }, 20000)

  it('axe no reporta violaciones críticas en el repaso de hoy', async () => {
    const name = 'pdc.a11y.review.today'
    const repositories = createProgressRepositories(
      createProgressDatabase({ name }),
    )
    await repositories.lessons.put('lesson.m0-01', {
      status: 'in-progress',
      secondsSpent: 60,
    })
    repositories.close()

    window.location.hash = REVIEW_HASH
    const { container } = render(<App databaseName={name} />)
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Empezar repaso' }),
      ).toBeInTheDocument(),
    )

    const results = await axe.run(container, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
    })

    const serious = results.violations.filter(
      (violation) =>
        violation.impact === 'critical' || violation.impact === 'serious',
    )
    expect(
      serious.map((violation) => `${violation.id}: ${violation.help}`),
    ).toEqual([])
    expect(
      screen.getByRole('heading', { level: 1, name: 'Repaso de hoy' }),
    ).toBeInTheDocument()
  }, 20000)

  it('axe no reporta violaciones críticas en la autoevaluación del repaso', async () => {
    const name = 'pdc.a11y.review.assessment'
    const repositories = createProgressRepositories(
      createProgressDatabase({ name }),
    )
    await repositories.lessons.put('lesson.m0-01', {
      status: 'in-progress',
      secondsSpent: 60,
    })
    repositories.close()

    window.location.hash = REVIEW_HASH
    const { container } = render(<App databaseName={name} />)
    fireEvent.click(
      await screen.findByRole('button', { name: 'Empezar repaso' }),
    )

    await waitFor(() =>
      expect(
        screen.getByRole('group', { name: '¿Cómo te salió?' }),
      ).toBeInTheDocument(),
    )

    const results = await axe.run(container, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
    })

    const serious = results.violations.filter(
      (violation) =>
        violation.impact === 'critical' || violation.impact === 'serious',
    )
    expect(
      serious.map((violation) => `${violation.id}: ${violation.help}`),
    ).toEqual([])
    expect(screen.getByRole('button', { name: 'Fácil' })).toBeInTheDocument()
  }, 20000)

  it('axe no reporta violaciones críticas en la práctica diaria', async () => {
    window.location.hash = PRACTICE_HASH
    const { container } = render(
      <App databaseName="pdc.a11y.practice.daily" />,
    )

    const start = await screen.findByRole('button', {
      name: 'Empezar práctica',
    })
    await waitFor(() => expect(start).toBeEnabled())

    const options = {
      runOnly: { type: 'tag' as const, values: ['wcag2a', 'wcag2aa'] },
    }
    const plan = await axe.run(container, options)
    const planSerious = plan.violations.filter(
      (violation) =>
        violation.impact === 'critical' || violation.impact === 'serious',
    )
    expect(
      planSerious.map((violation) => `${violation.id}: ${violation.help}`),
    ).toEqual([])

    fireEvent.click(start)
    await screen.findByRole('heading', {
      level: 2,
      name: 'Sesión en curso',
    })

    const running = await axe.run(container, options)
    const runningSerious = running.violations.filter(
      (violation) =>
        violation.impact === 'critical' || violation.impact === 'serious',
    )
    expect(
      runningSerious.map((violation) => `${violation.id}: ${violation.help}`),
    ).toEqual([])
    expect(screen.getByRole('button', { name: 'Pausar' })).toBeInTheDocument()
  }, 20000)

  it('axe no reporta violaciones críticas en las estadísticas', async () => {
    const name = 'pdc.a11y.progress.stats'
    const repositories = createProgressRepositories(
      createProgressDatabase({ name }),
    )
    await repositories.profile.save(
      ProfileSchema.parse({
        xp: 250,
        streak: { current: 4, longest: 9 },
      }),
    )
    await repositories.reviews.save(
      ReviewLogSchema.parse({
        id: 'skill.note-names.log.1',
        itemId: 'skill.note-names',
        reviewedAt: '2026-03-10T10:00:00.000Z',
        rating: 'good',
        elapsedDays: 1,
        scheduledDays: 1,
        stability: 2,
        difficulty: 5,
        state: 'review',
      }),
    )
    await repositories.lessons.put('lesson.m0-01', {
      status: 'in-progress',
      secondsSpent: 120,
    })
    repositories.close()

    window.location.hash = PROGRESS_HASH
    const { container } = render(<App databaseName={name} />)
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { level: 3, name: 'XP y nivel' }),
      ).toBeInTheDocument(),
    )

    const results = await axe.run(container, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
    })

    const serious = results.violations.filter(
      (violation) =>
        violation.impact === 'critical' || violation.impact === 'serious',
    )
    expect(
      serious.map((violation) => `${violation.id}: ${violation.help}`),
    ).toEqual([])
    expect(
      screen.getByRole('heading', { level: 1, name: 'Tu progreso' }),
    ).toBeInTheDocument()
  }, 20000)

  it('axe no reporta violaciones críticas en el repertorio', async () => {
    window.location.hash = REPERTOIRE_HASH
    const { container } = render(<App databaseName="pdc.a11y.repertoire" />)
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { level: 1, name: 'Piezas para tocar' }),
      ).toBeInTheDocument(),
    )
    await waitFor(() =>
      expect(
        screen.getAllByRole('link', { name: 'Abrir pieza' }).length,
      ).toBeGreaterThan(0),
    )

    const results = await axe.run(container, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
    })

    const serious = results.violations.filter(
      (violation) =>
        violation.impact === 'critical' || violation.impact === 'serious',
    )
    expect(
      serious.map((violation) => `${violation.id}: ${violation.help}`),
    ).toEqual([])
  }, 20000)

  it('axe no reporta violaciones críticas en una pieza', async () => {
    window.location.hash = pieceHash('piece.petzold.minuet-g')
    const { container } = render(<App databaseName="pdc.a11y.piece" />)
    await waitFor(() =>
      expect(
        screen.getByRole('heading', {
          level: 1,
          name: 'Minueto en Sol mayor, BWV Anh. 114',
        }),
      ).toBeInTheDocument(),
    )
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { level: 2, name: 'Reproductor de la pieza' }),
      ).toBeInTheDocument(),
    )

    const results = await axe.run(container, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
    })

    const serious = results.violations.filter(
      (violation) =>
        violation.impact === 'critical' || violation.impact === 'serious',
    )
    expect(
      serious.map(
        (violation) =>
          `${violation.id}: ${violation.help} [${violation.nodes
            .map((node) => node.target.join(' '))
            .join(' | ')}]`,
      ),
    ).toEqual([])
  }, 20000)

  it('axe no reporta violaciones críticas en los ajustes', async () => {
    window.location.hash = SETTINGS_HASH
    const { container } = render(<App databaseName="pdc.a11y.settings" />)
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { level: 1, name: 'Ajustes' }),
      ).toBeInTheDocument(),
    )
    await waitFor(() =>
      expect(screen.getByLabelText('Elegir archivo .txt')).toBeEnabled(),
    )

    const results = await axe.run(container, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
    })

    const serious = results.violations.filter(
      (violation) =>
        violation.impact === 'critical' || violation.impact === 'serious',
    )
    expect(
      serious.map((violation) => `${violation.id}: ${violation.help}`),
    ).toEqual([])
    expect(screen.getByLabelText('Tema')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 2, name: 'Gestión de datos' }),
    ).toBeInTheDocument()
  }, 20000)
})
