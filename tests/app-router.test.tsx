import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { App } from '../src/App'
import {
  ATTRIBUTIONS_HASH,
  COURSE_HASH,
  PROGRESS_HASH,
  REPERTOIRE_HASH,
  REVIEW_HASH,
  SETTINGS_HASH,
  lessonHash,
  pieceHash,
} from '../src/router/hash-route'

function showHash(hash: string): void {
  window.location.hash = hash
  fireEvent(window, new HashChangeEvent('hashchange'))
}

afterEach(() => {
  window.location.hash = ''
})

describe('F2-058 — Shell de app y navegación', () => {
  it('muestra el curso en la raíz y navega con enlaces accesibles', async () => {
    window.location.hash = ''
    render(<App />)

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Tu recorrido, paso a paso',
    )
    expect(document.title).toBe('Curso · PianoDesdeCero')

    const nav = screen.getByRole('navigation', {
      name: 'Navegación principal',
    })
    const links = within(nav).getAllByRole('link')
    expect(links.map((link) => link.textContent)).toEqual([
      'Curso',
      'Repertorio',
      'Canciones',
      'Práctica',
      'Repaso',
      'Progreso',
      'Ajustes',
    ])
    expect(within(nav).getByRole('link', { name: 'Curso' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(within(nav).getByRole('link', { name: 'Progreso' })).not.toHaveAttribute(
      'aria-current',
    )

    await waitFor(() =>
      expect(screen.getByText(/0 de 79 lecciones/)).toBeInTheDocument(),
    )
    expect(
      screen.getByRole('link', { name: /Continuar por «El teclado/ }),
    ).toHaveAttribute('href', lessonHash('lesson.m0-01'))
    expect(
      screen.getByRole('link', { name: 'Ver la demo de la Fase 1' }),
    ).toHaveAttribute('href', '#/demo')
  })

  it('resuelve un enlace profundo a una lección y mantiene Curso activo', async () => {
    window.location.hash = lessonHash('lesson.m0-01')
    render(<App databaseName="pdc.test.app-router.lesson" />)

    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        'El teclado: grupos de dos y tres negras',
      ),
    )
    expect(document.title).toBe('Lección · PianoDesdeCero')

    const nav = screen.getByRole('navigation', {
      name: 'Navegación principal',
    })
    expect(within(nav).getByRole('link', { name: 'Curso' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    const reviewLink = await screen.findByRole('link', { name: 'Ir a repaso' })
    expect(
      screen.getAllByRole('link', { name: 'Volver al curso' })[0],
    ).toHaveAttribute('href', COURSE_HASH)
    expect(reviewLink).toHaveAttribute('href', REVIEW_HASH)
  })

  it('navega al hacer clic y responde a los cambios de hash', async () => {
    window.location.hash = COURSE_HASH
    render(<App />)

    fireEvent.click(
      within(
        screen.getByRole('navigation', { name: 'Navegación principal' }),
      ).getByRole('link', { name: 'Progreso' }),
    )

    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        'Tu progreso',
      ),
    )
    expect(window.location.hash).toBe(PROGRESS_HASH)
    expect(
      screen.getByRole('link', { name: 'Progreso' }),
    ).toHaveAttribute('aria-current', 'page')
    expect(document.title).toBe('Progreso · PianoDesdeCero')
  })

  it('reacciona a atrás y adelante del navegador', async () => {
    window.location.hash = COURSE_HASH
    render(<App />)

    showHash(REVIEW_HASH)
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        'Repaso de hoy',
      ),
    )

    showHash(COURSE_HASH)
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        'Tu recorrido, paso a paso',
      ),
    )

    showHash(REVIEW_HASH)
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        'Repaso de hoy',
      ),
    )
  })

  it('muestra la página de ajustes con el panel de ajustes', () => {
    window.location.hash = SETTINGS_HASH
    render(<App />)

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Ajustes')
    expect(screen.getByLabelText('Notación')).toBeInTheDocument()
    expect(screen.getByLabelText('Idioma')).toBeInTheDocument()
    expect(document.title).toBe('Ajustes · PianoDesdeCero')
  })

  it('mantiene la demo accesible por su ruta', () => {
    window.location.hash = '#/demo'
    render(<App />)

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Tocá el teclado',
    )
  })

  it('muestra el índice de repertorio con enlaces a cada pieza', async () => {
    window.location.hash = REPERTOIRE_HASH
    render(<App databaseName="pdc.test.app-router.repertoire" />)

    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        'Piezas para tocar',
      ),
    )
    const pieceLink = await screen.findByRole('link', {
      name: 'Estudio 1: Cinco dedos',
    })
    expect(pieceLink).toHaveAttribute(
      'href',
      pieceHash('piece.studies.01'),
    )
    expect(
      screen.getByRole('link', { name: 'Atribuciones y licencias' }),
    ).toHaveAttribute('href', ATTRIBUTIONS_HASH)
    expect(document.title).toBe('Repertorio · PianoDesdeCero')
    expect(
      within(
        screen.getByRole('navigation', { name: 'Navegación principal' }),
      ).getByRole('link', { name: 'Repertorio' }),
    ).toHaveAttribute('aria-current', 'page')
  })

  it('abre una pieza con ficha de licencia y atribuciones completas', async () => {
    window.location.hash = pieceHash('piece.original.do-mayor')
    render(<App databaseName="pdc.test.app-router.piece" />)

    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        'Primera melodía en Do',
      ),
    )
    expect(document.title).toBe('Repertorio · PianoDesdeCero')
    expect(
      screen.getByRole('heading', { name: 'Ficha de licencia' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'CC0 1.0' })).toHaveAttribute(
      'href',
      'https://creativecommons.org/publicdomain/zero/1.0/',
    )
    for (const label of [
      'Compositor',
      'Nacimiento',
      'Fallecimiento',
      'Fuente',
      'Transcripción',
      'Atribución',
      'Verificación',
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
    expect(
      screen.getByText('Primera melodía en Do — PianoDesdeCero (CC0 1.0)'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Ver todas las atribuciones' }),
    ).toHaveAttribute('href', ATTRIBUTIONS_HASH)
  })

  it('reúne las atribuciones de todas las piezas', async () => {
    window.location.hash = ATTRIBUTIONS_HASH
    render(<App databaseName="pdc.test.app-router.attributions" />)

    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        'Atribuciones y licencias',
      ),
    )
    expect(
      await screen.findByRole('heading', {
        name: 'Estudio 1: Cinco dedos — Ficha de licencia',
      }),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Abrir pieza' })).toHaveLength(
      28,
    )
  })

  it('muestra una página 404 con enlace al curso', () => {
    window.location.hash = '#/no-existe'
    render(<App />)

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Esta página no existe',
    )
    expect(screen.getByText('/no-existe')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Volver al curso' })).toHaveAttribute(
      'href',
      COURSE_HASH,
    )
    expect(document.title).toBe('Esta página no existe · PianoDesdeCero')
  })
})
