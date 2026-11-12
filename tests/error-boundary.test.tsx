import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ErrorBoundary } from '../src/components/ErrorBoundary'

function Bomb({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('explotó')
  return <p>contenido recuperado</p>
}

describe('ErrorBoundary', () => {
  it('muestra un mensaje accionable y permite reintentar', async () => {
    const user = userEvent.setup()
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const { rerender } = render(
      <ErrorBoundary title="Algo se rompió" message="Mensaje" retryLabel="Reintentar">
        <Bomb shouldThrow />
      </ErrorBoundary>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Algo se rompió')
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()

    rerender(
      <ErrorBoundary title="Algo se rompió" message="Mensaje" retryLabel="Reintentar">
        <Bomb shouldThrow={false} />
      </ErrorBoundary>,
    )
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(screen.getByText('contenido recuperado')).toBeInTheDocument()
    errorSpy.mockRestore()
  })
})
