import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { App } from '../src/App'

describe('F6-012 — Navegación por teclado', () => {
  it('el primer Tab enfoca el enlace de salto', async () => {
    const user = userEvent.setup()
    render(<App databaseName="pdc.test.keyboard-nav" />)

    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument(),
    )

    await user.tab()
    const skip = screen.getByRole('link', { name: 'Saltar al contenido' })
    expect(skip).toHaveFocus()
    expect(skip).toHaveAttribute('href', '#main-content')
    expect(document.getElementById('main-content')).not.toBeNull()
  })

  it('sigue el orden del DOM: salto, marca y navegación', async () => {
    const user = userEvent.setup()
    render(<App databaseName="pdc.test.keyboard-order" />)

    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument(),
    )

    await user.tab()
    expect(
      screen.getByRole('link', { name: 'Saltar al contenido' }),
    ).toHaveFocus()

    await user.tab()
    expect(
      screen.getByRole('link', { name: 'Piano Today' }),
    ).toHaveFocus()

    await user.tab()
    expect(screen.getByRole('link', { name: 'Curso' })).toHaveFocus()
  })
})
