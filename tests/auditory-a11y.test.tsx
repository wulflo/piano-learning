import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axe from 'axe-core'
import { afterEach, describe, expect, it } from 'vitest'
import { App } from '../src/App'
import { lessonHash } from '../src/router/hash-route'
import { createProgressDatabase } from '../src/state/db'
import { createProgressRepositories } from '../src/state/repositories'
import type { LessonProgress } from '../src/schemas'

/**
 * F3-032 — Accesibilidad de los ejercicios auditivos.
 *
 * Los dictados no pueden depender solo del audio ni del color: cada control
 * tiene texto visible, la descripción de lo que suena acompaña al botón, la
 * corrección se anuncia con texto y todas las opciones se manejan con teclado.
 */

let databaseCounter = 0

function uniqueDatabaseName(): string {
  databaseCounter += 1
  return `pdc.test.auditory-a11y.${databaseCounter}`
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

function showLesson(lessonId: string): void {
  window.location.hash = lessonHash(lessonId)
  fireEvent(window, new HashChangeEvent('hashchange'))
}

async function expectNoSeriousViolations(container: HTMLElement): Promise<void> {
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
}

async function submitAnswer(answer: string): Promise<void> {
  await waitFor(() => {
    const radio = screen.getByRole('radio', {
      name: answer,
    }) as HTMLInputElement
    if (!radio.checked) fireEvent.click(radio)
    expect(screen.getByRole('button', { name: 'Corregir' })).toBeEnabled()
  })
  fireEvent.click(screen.getByRole('button', { name: 'Corregir' }))
}

const completedAt = '2026-11-01T10:00:00.000Z'

afterEach(() => {
  window.location.hash = ''
})

describe('F3-032 — Accesibilidad de los ejercicios auditivos', () => {
  it('axe no reporta violaciones críticas en un dictado de intervalos', async () => {
    const name = uniqueDatabaseName()
    await seedLessons(name, {
      'lesson.m3-01': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m3-02': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m3-03': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m3-04': { status: 'completed', completedAt, secondsSpent: 60 },
    })

    showLesson('lesson.m3-05')
    const { container } = render(<App databaseName={name} />)

    expect(
      await screen.findByRole('heading', {
        level: 3,
        name: /intervalo hay entre Do4 y Re4/,
      }),
    ).toBeInTheDocument()

    const listen = screen.getByRole('button', { name: 'Escuchar melodía' })
    expect(listen).toHaveAccessibleDescription(/la nota de aproximación/)

    await expectNoSeriousViolations(container)
  }, 30000)

  it('axe no reporta violaciones críticas en un dictado de acordes', async () => {
    const name = uniqueDatabaseName()
    await seedLessons(name, {
      'lesson.m4-09': { status: 'completed', completedAt, secondsSpent: 60 },
    })

    showLesson('lesson.m4-10')
    const { container } = render(<App databaseName={name} />)

    await screen.findByRole('heading', {
      level: 3,
      name: /Do, Mi, Sol y Si/,
    })

    // Los seis primeros ejercicios son visuales; el séptimo es el dictado.
    const correctAnswers = [
      'séptima mayor',
      'séptima de dominante',
      'séptima menor',
      'aumentado',
      'séptima disminuida',
      'séptima semidisminuida',
    ]
    for (const answer of correctAnswers) {
      await submitAnswer(answer)
      await screen.findByText('¡Correcto!')
      fireEvent.click(
        screen.getByRole('button', { name: 'Siguiente ejercicio' }),
      )
    }

    expect(
      await screen.findByText(/Escuchá el acorde en bloque o arpegio/),
    ).toBeInTheDocument()

    const listen = screen.getByRole('button', { name: 'Escuchar acorde' })
    expect(listen).toHaveAccessibleDescription(/Escuchá el acorde en bloque/)

    await expectNoSeriousViolations(container)
  }, 60000)

  it('axe no reporta violaciones críticas en un dictado de escalas', async () => {
    const name = uniqueDatabaseName()
    await seedLessons(name, {
      'lesson.m2-07': { status: 'completed', completedAt, secondsSpent: 60 },
    })

    showLesson('lesson.m2-08')
    const { container } = render(<App databaseName={name} />)

    expect(
      await screen.findByRole('heading', {
        level: 3,
        name: /Qué modo tiene la escala Do Re Mi Fa sostenido Sol La Si/,
      }),
    ).toBeInTheDocument()

    const listen = screen.getByRole('button', { name: 'Escuchar escala' })
    expect(listen).toHaveAccessibleDescription(/Escuchá la escala y elegí/)
    expect(
      screen.getByRole('button', { name: 'Comparar con Mayor' }),
    ).toHaveAccessibleDescription(/Escuchá la escala y elegí/)

    await expectNoSeriousViolations(container)
  }, 30000)

  it('axe no reporta violaciones críticas en un dictado de progresiones', async () => {
    const name = uniqueDatabaseName()
    await seedLessons(name, {
      'lesson.m2-06': { status: 'completed', completedAt, secondsSpent: 60 },
    })

    showLesson('lesson.m2-07')
    const { container } = render(<App databaseName={name} />)

    await screen.findByRole('heading', {
      level: 3,
      name: /Escuchá la progresión en Do mayor y elegí sus grados/,
    })

    const listen = screen.getByRole('button', {
      name: 'Escuchar progresión',
    })
    expect(listen).toHaveAccessibleDescription(/Escuchá los acordes de la/)

    await expectNoSeriousViolations(container)
  }, 30000)

  it('permite responder un dictado solo con el teclado y anuncia el resultado', async () => {
    const user = userEvent.setup()
    const name = uniqueDatabaseName()
    await seedLessons(name, {
      'lesson.m3-01': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m3-02': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m3-03': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m3-04': { status: 'completed', completedAt, secondsSpent: 60 },
    })

    showLesson('lesson.m3-05')
    render(<App databaseName={name} />)

    await screen.findByRole('heading', {
      level: 3,
      name: /intervalo hay entre Do4 y Re4/,
    })

    // Escuchar con Enter.
    const listen = screen.getByRole('button', { name: 'Escuchar melodía' })
    listen.focus()
    await user.keyboard('{Enter}')
    expect(
      await screen.findByRole('button', { name: 'Repetir melodía' }),
    ).toBeInTheDocument()

    // Elegir con Espacio.
    const radio = screen.getByRole('radio', {
      name: 'Tercera mayor',
    }) as HTMLInputElement
    radio.focus()
    await user.keyboard(' ')
    expect(radio).toBeChecked()

    // Corregir con Enter.
    const submit = screen.getByRole('button', { name: 'Corregir' })
    submit.focus()
    await user.keyboard('{Enter}')

    expect(await screen.findByText('Todavía no.')).toBeInTheDocument()
    expect(
      screen.getByText('La respuesta correcta es: Segunda mayor.'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Escuchar respuesta' }),
    ).toHaveAccessibleDescription(/Compará lo que escuchaste/)
  }, 30000)
})
