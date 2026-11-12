import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { App } from '../src/App'
import { PRACTICE_HASH } from '../src/router/hash-route'
import { createProgressDatabase } from '../src/state/db'
import { createProgressRepositories } from '../src/state/repositories'

let databaseCounter = 0

function uniqueDatabaseName(): string {
  databaseCounter += 1
  return `pdc.test.practice-page.${databaseCounter}`
}

function repositoriesFor(name: string) {
  return createProgressRepositories(createProgressDatabase({ name }))
}

afterEach(() => {
  vi.useRealTimers()
  window.location.hash = ''
})

describe('F2-068 — Pantalla «Práctica de hoy»', () => {
  it('muestra el plan de 15/30/45 con sus cinco bloques', async () => {
    window.location.hash = PRACTICE_HASH
    render(<App databaseName={uniqueDatabaseName()} />)

    await screen.findByRole('heading', {
      level: 1,
      name: 'Plan de práctica diario',
    })

    const start = screen.getByRole('button', { name: 'Empezar práctica' })
    await waitFor(() => expect(start).toBeEnabled())

    expect(screen.getByRole('radio', { name: '15 minutos' })).toBeChecked()
    expect(screen.getByRole('radio', { name: '30 minutos' })).not.toBeChecked()
    const plan = screen.getByRole('region', { name: 'Armá tu sesión' })
    expect(
      within(plan)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual([
      'Calentamiento3 min',
      'Técnica4 min',
      'Teoría3 min',
      'Repertorio3 min',
      'Repaso2 min',
    ])
    expect(screen.getByText('Total: 15 min')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('radio', { name: '30 minutos' }))

    expect(screen.getByText('Total: 30 min')).toBeInTheDocument()
    expect(
      within(plan)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual([
      'Calentamiento5 min',
      'Técnica8 min',
      'Teoría6 min',
      'Repertorio7 min',
      'Repaso4 min',
    ])
  })

  it('cuenta, pausa, reanuda y salta bloques, y guarda lo practicado', async () => {
    const name = uniqueDatabaseName()
    window.location.hash = PRACTICE_HASH
    render(<App databaseName={name} />)

    const start = await screen.findByRole('button', {
      name: 'Empezar práctica',
    })
    await waitFor(() => expect(start).toBeEnabled())

    vi.useFakeTimers()
    fireEvent.click(start)

    expect(
      screen.getByRole('heading', { level: 2, name: 'Sesión en curso' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 3, name: 'Calentamiento' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('timer')).toHaveTextContent('03:00')

    act(() => {
      vi.advanceTimersByTime(5_000)
    })
    expect(screen.getByRole('timer')).toHaveTextContent('02:55')
    expect(screen.getByText('00:05 practicados')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Pausar' }))
    act(() => {
      vi.advanceTimersByTime(3_000)
    })
    expect(screen.getByRole('timer')).toHaveTextContent('02:55')

    fireEvent.click(screen.getByRole('button', { name: 'Reanudar' }))
    act(() => {
      vi.advanceTimersByTime(2_000)
    })
    expect(screen.getByRole('timer')).toHaveTextContent('02:53')
    expect(screen.getByText('00:07 practicados')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Saltar bloque' }))
    expect(screen.getByText('Bloque 2 de 5')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 3, name: 'Técnica' }),
    ).toBeInTheDocument()

    vi.useRealTimers()
    fireEvent.click(screen.getByRole('button', { name: 'Terminar sesión' }))

    expect(
      await screen.findByRole('heading', { level: 2, name: 'Sesión terminada' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Practicaste 0 min de 15 min planificados.'),
    ).toBeInTheDocument()
    expect(
      await screen.findByText(
        'No llegaste al minuto: la sesión se guardó, pero no suma XP ni racha.',
      ),
    ).toBeInTheDocument()

    const repositories = repositoriesFor(name)
    try {
      await waitFor(async () => {
        const sessions = await repositories.sessions.all()
        expect(sessions).toHaveLength(1)
        expect(sessions[0].blocks[0]).toEqual({ kind: 'warmup', seconds: 7 })
        expect(sessions[0].blocks.slice(1)).toEqual([
          { kind: 'technique', seconds: 0 },
          { kind: 'theory', seconds: 0 },
          { kind: 'repertoire', seconds: 0 },
          { kind: 'review', seconds: 0 },
        ])
      })
      expect((await repositories.profile.get()).xp).toBe(0)
    } finally {
      repositories.close()
    }
  })

  it('suma XP y racha cuando la sesión llega al minuto', async () => {
    const name = uniqueDatabaseName()
    window.location.hash = PRACTICE_HASH
    render(<App databaseName={name} />)

    const start = await screen.findByRole('button', {
      name: 'Empezar práctica',
    })
    await waitFor(() => expect(start).toBeEnabled())

    vi.useFakeTimers()
    fireEvent.click(start)
    act(() => {
      vi.advanceTimersByTime(60_000)
    })
    expect(screen.getByText('01:00 practicados')).toBeInTheDocument()

    vi.useRealTimers()
    fireEvent.click(screen.getByRole('button', { name: 'Terminar sesión' }))

    expect(
      await screen.findByText('Ganaste 2 XP y tu racha quedó registrada.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Practicaste 1 min de 15 min planificados.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('La sesión quedó guardada en tu progreso.'),
    ).toBeInTheDocument()

    const repositories = repositoriesFor(name)
    try {
      await waitFor(async () => {
        const sessions = await repositories.sessions.all()
        expect(sessions).toHaveLength(1)
        expect(sessions[0].blocks[0]).toEqual({ kind: 'warmup', seconds: 60 })
      })
      const profile = await repositories.profile.get()
      expect(profile.xp).toBe(2)
      expect(profile.streak.current).toBe(1)
      expect(profile.streak.lastPracticeDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    } finally {
      repositories.close()
    }
  })

  it('no guarda una sesión sin ningún segundo practicado', async () => {
    const name = uniqueDatabaseName()
    window.location.hash = PRACTICE_HASH
    render(<App databaseName={name} />)

    const start = await screen.findByRole('button', {
      name: 'Empezar práctica',
    })
    await waitFor(() => expect(start).toBeEnabled())

    fireEvent.click(start)
    fireEvent.click(screen.getByRole('button', { name: 'Terminar sesión' }))

    expect(
      await screen.findByRole('heading', { level: 2, name: 'Sesión terminada' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('No practicaste ningún segundo; la sesión no se guardó.'),
    ).toBeInTheDocument()

    const repositories = repositoriesFor(name)
    try {
      expect(await repositories.sessions.all()).toEqual([])
      expect((await repositories.profile.get()).xp).toBe(0)
    } finally {
      repositories.close()
    }
  })
})
