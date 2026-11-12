import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { App } from '../src/App'
import { lessonHash } from '../src/router/hash-route'
import { createProgressDatabase } from '../src/state/db'
import { createProgressRepositories } from '../src/state/repositories'
import type { LessonProgress } from '../src/schemas'

let databaseCounter = 0

function uniqueDatabaseName(): string {
  databaseCounter += 1
  return `pdc.test.exercise-player.${databaseCounter}`
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

/**
 * Selecciona la respuesta y pulsa «Corregir» cuando el botón está habilitado.
 *
 * Bajo carga, el clic del radio y el del botón pueden caer en el mismo tick;
 * si la selección todavía no se aplicó (o un re-render la limpió), el botón
 * sigue deshabilitado y el clic se pierde. El helper reintenta la selección
 * dentro de `waitFor` hasta que la respuesta queda marcada y el botón habilitado.
 */
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

async function readProgress(name: string) {
  const repositories = createProgressRepositories(
    createProgressDatabase({ name }),
  )
  const reviews = await repositories.reviews.all()
  const skill = await repositories.skills.get('skill.keyboard-groups')
  repositories.close()
  return { reviews, skill }
}

afterEach(() => {
  window.location.hash = ''
})

describe('F2-072a — Reproductor de ejercicios', () => {
  it('corrige una respuesta incorrecta y muestra la regla Recordá', async () => {
    const name = uniqueDatabaseName()
    showLesson('lesson.m0-01')
    render(<App databaseName={name} />)

    const firstPrompt = await screen.findByRole('heading', {
      level: 3,
      name: '¿Qué nota es la tecla blanca inmediatamente a la izquierda de un grupo de dos teclas negras?',
    })
    expect(firstPrompt).toBeInTheDocument()
    expect(screen.getByText('Ejercicio 1 de 3')).toBeInTheDocument()

    await submitAnswer('Re')

    expect(await screen.findByText('Todavía no.')).toBeInTheDocument()
    expect(
      screen.getByText('La respuesta correcta es: Do.'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        level: 4,
        name: 'Recordá cómo se nombran las notas',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Las teclas blancas, de izquierda a derecha/),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'El grupo de dos teclas negras marca el límite: la blanca a su izquierda es Do. Ese patrón se repite en todas las octavas.',
      ),
    ).toBeInTheDocument()

    await waitFor(async () => {
      const { reviews, skill } = await readProgress(name)
      expect(reviews).toHaveLength(1)
      expect(reviews[0]?.rating).toBe('again')
      expect(skill?.incorrect).toBe(1)
      expect(skill?.correct).toBe(0)
    })
  })

  it('permite reintentar, avanzar y volver a la lección', async () => {
    const name = uniqueDatabaseName()
    showLesson('lesson.m0-01')
    render(<App databaseName={name} />)

    await screen.findByRole('heading', { level: 3, name: /grupo de dos teclas negras/ })

    await submitAnswer('Re')
    await screen.findByText('Todavía no.')

    fireEvent.click(screen.getByRole('button', { name: 'Intentar de nuevo' }))
    expect(
      screen.queryByText('Todavía no.'),
    ).not.toBeInTheDocument()

    await submitAnswer('Do')
    expect(await screen.findByText('¡Correcto!')).toBeInTheDocument()

    await waitFor(async () => {
      const { reviews, skill } = await readProgress(name)
      expect(reviews).toHaveLength(2)
      expect(skill?.correct).toBe(1)
      expect(skill?.incorrect).toBe(1)
    })

    fireEvent.click(
      screen.getByRole('button', { name: 'Siguiente ejercicio' }),
    )
    expect(
      await screen.findByText('Ejercicio 2 de 3'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        level: 3,
        name: /grupo de tres teclas negras/,
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('button', { name: 'Volver a la lección' }),
    ).toBeInTheDocument()
  })

  it('muestra y reproduce un fragmento de M3-04 antes de corregir', async () => {
    const name = uniqueDatabaseName()
    const completedAt = '2026-11-01T10:00:00.000Z'
    await seedLessons(name, {
      'lesson.m3-01': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m3-02': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m3-03': { status: 'completed', completedAt, secondsSpent: 60 },
    })

    showLesson('lesson.m3-04')
    render(<App databaseName={name} />)

    expect(
      await screen.findByRole('heading', {
        level: 3,
        name: /primera nota \(Do4\) y la tercera \(Mi4\)/,
      }),
    ).toBeInTheDocument()

    expect(
      await screen.findByRole('group', { name: /^Fragmento:/ }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Escuchar fragmento' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('radio', { name: 'Tercera mayor' }),
    ).toBeInTheDocument()
  })

  it('muestra el arpegio de M7-02, lo reproduce y corrige la digitación', async () => {
    const name = uniqueDatabaseName()
    const completedAt = '2026-11-01T10:00:00.000Z'
    await seedLessons(name, {
      'lesson.m7-01': { status: 'completed', completedAt, secondsSpent: 60 },
    })

    showLesson('lesson.m7-02')
    render(<App databaseName={name} />)

    expect(
      await screen.findByRole('heading', {
        level: 3,
        name: '¿Qué digitación usa la mano derecha en este arpegio de Do mayor?',
      }),
    ).toBeInTheDocument()
    expect(
      await screen.findByRole('group', { name: /^Arpegio:/ }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Escuchar arpegio' }),
    ).toBeInTheDocument()

    await submitAnswer('1-2-3-5')

    expect(await screen.findByText('¡Correcto!')).toBeInTheDocument()
    expect(
      screen.getByText(/El pulgar abre, los dedos 2 y 3 cubren/),
    ).toBeInTheDocument()
  })

  it('muestra la partitura con pedal de M7-03, la reproduce y corrige la acción', async () => {
    const name = uniqueDatabaseName()
    const completedAt = '2026-11-01T10:00:00.000Z'
    await seedLessons(name, {
      'lesson.m7-01': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m7-02': { status: 'completed', completedAt, secondsSpent: 60 },
    })

    showLesson('lesson.m7-03')
    render(<App databaseName={name} />)

    expect(
      await screen.findByRole('heading', {
        level: 3,
        name: '¿Qué hace el pedal en el compás 1, pulso 1?',
      }),
    ).toBeInTheDocument()
    expect(
      await screen.findByRole('group', { name: /^Partitura con pedal:/ }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Escuchar con pedal' }),
    ).toBeInTheDocument()

    await submitAnswer('Pisar el pedal')

    expect(await screen.findByText('¡Correcto!')).toBeInTheDocument()
    expect(
      screen.getByText(/El pedal se pisa al mismo tiempo que el acorde de Do/),
    ).toBeInTheDocument()
  })

  it('muestra el acompañamiento de M7-04, lo reproduce y corrige el patrón', async () => {
    const name = uniqueDatabaseName()
    const completedAt = '2026-11-01T10:00:00.000Z'
    await seedLessons(name, {
      'lesson.m7-01': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m7-02': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m7-03': { status: 'completed', completedAt, secondsSpent: 60 },
    })

    showLesson('lesson.m7-04')
    render(<App databaseName={name} />)

    expect(
      await screen.findByRole('heading', {
        level: 3,
        name: '¿Qué patrón de acompañamiento hay en el compás 1?',
      }),
    ).toBeInTheDocument()
    expect(
      await screen.findByRole('group', { name: /^Acompañamiento:/ }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Escuchar acompañamiento' }),
    ).toBeInTheDocument()

    await submitAnswer('Acordes redondos')

    expect(await screen.findByText('¡Correcto!')).toBeInTheDocument()
    expect(
      screen.getByText(/Hay un solo acorde de Do que ocupa el compás completo/),
    ).toBeInTheDocument()
  })

  it('muestra el acompañamiento arpegiado de M7-05 y corrige el patrón', async () => {
    const name = uniqueDatabaseName()
    const completedAt = '2026-11-01T10:00:00.000Z'
    await seedLessons(name, {
      'lesson.m7-01': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m7-02': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m7-03': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m7-04': { status: 'completed', completedAt, secondsSpent: 60 },
    })

    showLesson('lesson.m7-05')
    render(<App databaseName={name} />)

    expect(
      await screen.findByRole('heading', {
        level: 3,
        name: '¿Qué patrón de acompañamiento hay en el compás 1 de Do mayor?',
      }),
    ).toBeInTheDocument()
    expect(
      await screen.findByRole('group', { name: /^Acompañamiento arpegiado:/ }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: 'Escuchar acompañamiento arpegiado',
      }),
    ).toBeInTheDocument()

    await submitAnswer('Patrón de 3 notas')

    expect(await screen.findByText('¡Correcto!')).toBeInTheDocument()
    expect(
      screen.getByText(/tiene 3 negras sueltas/),
    ).toBeInTheDocument()
  })

  it('muestra el bajo de Alberti de M7-06 y corrige el patrón', async () => {
    const name = uniqueDatabaseName()
    const completedAt = '2026-11-01T10:00:00.000Z'
    await seedLessons(name, {
      'lesson.m7-01': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m7-02': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m7-03': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m7-04': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m7-05': { status: 'completed', completedAt, secondsSpent: 60 },
    })

    showLesson('lesson.m7-06')
    render(<App databaseName={name} />)

    expect(
      await screen.findByRole('heading', {
        level: 3,
        name: '¿Qué patrón de acompañamiento hay en el compás 1 de Do mayor?',
      }),
    ).toBeInTheDocument()
    expect(
      await screen.findByRole('group', { name: /^Bajo de Alberti:/ }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Escuchar bajo de Alberti' }),
    ).toBeInTheDocument()

    await submitAnswer('Alberti')

    expect(await screen.findByText('¡Correcto!')).toBeInTheDocument()
    expect(
      screen.getByText(/tiene ocho corcheas/),
    ).toBeInTheDocument()
  })

  it('muestra el walking bass de M7-07 y corrige la nota del pulso', async () => {
    const name = uniqueDatabaseName()
    const completedAt = '2026-11-01T10:00:00.000Z'
    await seedLessons(name, {
      'lesson.m7-01': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m7-02': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m7-03': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m7-04': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m7-05': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m7-06': { status: 'completed', completedAt, secondsSpent: 60 },
    })

    showLesson('lesson.m7-07')
    render(<App databaseName={name} />)

    expect(
      await screen.findByRole('heading', {
        level: 3,
        name: '¿Qué nota toca el walking bass en el pulso 4 del compás 1 de Do mayor?',
      }),
    ).toBeInTheDocument()
    expect(
      await screen.findByRole('group', { name: /^Walking bass:/ }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Escuchar walking bass' }),
    ).toBeInTheDocument()

    await submitAnswer('Sol♯3')

    expect(await screen.findByText('¡Correcto!')).toBeInTheDocument()
    expect(
      screen.getByText(/La nota Sol♯3 es una nota de paso/),
    ).toBeInTheDocument()
  })

  it('muestra el stride de M7-08 y corrige el patrón', async () => {
    const name = uniqueDatabaseName()
    const completedAt = '2026-11-01T10:00:00.000Z'
    await seedLessons(name, {
      'lesson.m7-01': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m7-02': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m7-03': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m7-04': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m7-05': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m7-06': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m7-07': { status: 'completed', completedAt, secondsSpent: 60 },
    })

    showLesson('lesson.m7-08')
    render(<App databaseName={name} />)

    expect(
      await screen.findByRole('heading', {
        level: 3,
        name: '¿Qué patrón de acompañamiento hay en el compás 1 de Do mayor?',
      }),
    ).toBeInTheDocument()
    expect(
      await screen.findByRole('group', { name: /^Stride \(bajo y acorde\):/ }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Escuchar stride' }),
    ).toBeInTheDocument()

    await submitAnswer('Stride')

    expect(await screen.findByText('¡Correcto!')).toBeInTheDocument()
    expect(
      screen.getByText(/La mano izquierda alterna un bajo suelto/),
    ).toBeInTheDocument()
  })

  it('muestra la lectura de M7-09 y corrige un intervalo', async () => {
    const name = uniqueDatabaseName()
    const completedAt = '2026-11-01T10:00:00.000Z'
    await seedLessons(name, {
      'lesson.m7-01': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m7-02': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m7-03': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m7-04': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m7-05': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m7-06': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m7-07': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m7-08': { status: 'completed', completedAt, secondsSpent: 60 },
    })

    showLesson('lesson.m7-09')
    render(<App databaseName={name} />)

    expect(
      await screen.findByRole('heading', {
        level: 3,
        name: '¿Qué intervalo hay entre la primera y la segunda nota del fragmento?',
      }),
    ).toBeInTheDocument()
    expect(
      await screen.findByRole('group', {
        name: /^Lectura a primera vista:/,
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Escuchar el fragmento' }),
    ).toBeInTheDocument()

    await submitAnswer('segunda mayor')

    expect(await screen.findByText('¡Correcto!')).toBeInTheDocument()
    expect(
      screen.getByText(/El intervalo es segunda mayor/),
    ).toBeInTheDocument()
  })

  it('dicta un intervalo en contexto, permite repetir y muestra la regla', async () => {
    const name = uniqueDatabaseName()
    const completedAt = '2026-11-01T10:00:00.000Z'
    await seedLessons(name, {
      'lesson.m3-01': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m3-02': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m3-03': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m3-04': { status: 'completed', completedAt, secondsSpent: 60 },
    })

    showLesson('lesson.m3-05')
    render(<App databaseName={name} />)

    expect(
      await screen.findByRole('heading', {
        level: 3,
        name: /intervalo hay entre Do4 y Re4/,
      }),
    ).toBeInTheDocument()

    expect(screen.getByText(/la nota de aproximación/)).toBeInTheDocument()
    expect(screen.getByText('Repeticiones: 0 de 2')).toBeInTheDocument()

    fireEvent.click(
      screen.getByRole('button', { name: 'Escuchar melodía' }),
    )

    expect(
      screen.getByRole('button', { name: 'Repetir melodía' }),
    ).toBeInTheDocument()
    // La primera escucha todavía no cuenta como repetición.
    expect(screen.getByText('Repeticiones: 0 de 2')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Repetir melodía' }))
    expect(screen.getByText('Repeticiones: 1 de 2')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Repetir melodía' }))
    expect(screen.getByText('Repeticiones: 2 de 2')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Repetir melodía' }),
    ).toBeDisabled()

    await submitAnswer('Tercera mayor')

    expect(await screen.findByText('Todavía no.')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        level: 4,
        name: 'Recordá los intervalos mayores',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Las segundas, terceras, sextas y séptimas son mayores o menores/),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('group', {
        name: /El mismo intervalo: C4 · D4/,
      }),
    ).toBeInTheDocument()
  })

  it('permite escuchar la respuesta después de corregir, con repeticiones acotadas', async () => {
    const name = uniqueDatabaseName()
    const completedAt = '2026-11-01T10:00:00.000Z'
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

    // Antes de corregir solo se ofrece la pregunta, nunca la respuesta.
    expect(
      screen.queryByRole('button', { name: 'Escuchar respuesta' }),
    ).not.toBeInTheDocument()

    await submitAnswer('Tercera mayor')

    expect(await screen.findByText('Todavía no.')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Compará lo que escuchaste con la respuesta correcta.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Repeticiones de la respuesta: 0 de 2'),
    ).toBeInTheDocument()

    fireEvent.click(
      screen.getByRole('button', { name: 'Escuchar respuesta' }),
    )
    expect(
      screen.getByRole('button', { name: 'Repetir respuesta' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Repeticiones de la respuesta: 0 de 2'),
    ).toBeInTheDocument()

    fireEvent.click(
      screen.getByRole('button', { name: 'Repetir respuesta' }),
    )
    expect(
      screen.getByText('Repeticiones de la respuesta: 1 de 2'),
    ).toBeInTheDocument()

    fireEvent.click(
      screen.getByRole('button', { name: 'Repetir respuesta' }),
    )
    expect(
      screen.getByText('Repeticiones de la respuesta: 2 de 2'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Repetir respuesta' }),
    ).toBeDisabled()
  })

  it('permite escuchar y elegir la forma de un ejercicio de acordes', async () => {
    const name = uniqueDatabaseName()
    const completedAt = '2026-11-01T10:00:00.000Z'
    await seedLessons(name, {
      'lesson.m4-01': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m4-02': { status: 'completed', completedAt, secondsSpent: 60 },
    })

    showLesson('lesson.m4-03')
    render(<App databaseName={name} />)

    expect(
      await screen.findByRole('heading', {
        level: 3,
        name: /Do mayor suena Do-Mi-Sol/,
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('button', { name: 'Escuchar acorde' }),
    ).toBeInTheDocument()

    const shape = screen.getByRole('combobox', { name: 'Forma' })
    expect(shape).toHaveValue('block')
    expect(
      screen.getByRole('option', { name: 'Bajo + acorde' }),
    ).toBeInTheDocument()

    fireEvent.change(shape, { target: { value: 'bass-chord' } })
    expect(shape).toHaveValue('bass-chord')

    await submitAnswer('primera inversión')
    expect(await screen.findByText('Todavía no.')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        level: 4,
        name: 'Recordá qué nota queda en el bajo',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/La inversión la decide la nota más grave/),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('group', {
        name: /El mismo acorde: C4 \+ E4 \+ G4/,
      }),
    ).toBeInTheDocument()
  })

  it('dicta la calidad de un acorde, permite repetir y muestra la regla', async () => {
    const name = uniqueDatabaseName()
    const completedAt = '2026-11-01T10:00:00.000Z'
    await seedLessons(name, {
      'lesson.m4-09': { status: 'completed', completedAt, secondsSpent: 60 },
    })

    showLesson('lesson.m4-10')
    render(<App databaseName={name} />)

    await screen.findByRole('heading', {
      level: 3,
      name: /Do, Mi, Sol y Si/,
    })

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
    expect(screen.getByText('Repeticiones: 0 de 2')).toBeInTheDocument()

    const shape = screen.getByRole('combobox', { name: 'Forma' })
    fireEvent.change(shape, { target: { value: 'arpeggio-up' } })
    expect(shape).toHaveValue('arpeggio-up')

    fireEvent.click(screen.getByRole('button', { name: 'Escuchar acorde' }))
    expect(
      screen.getByRole('button', { name: 'Repetir acorde' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Repeticiones: 0 de 2')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Repetir acorde' }))
    expect(screen.getByText('Repeticiones: 1 de 2')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Repetir acorde' }))
    expect(screen.getByText('Repeticiones: 2 de 2')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Repetir acorde' }),
    ).toBeDisabled()

    await submitAnswer('menor')

    expect(await screen.findByText('Todavía no.')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        level: 4,
        name: 'Recordá distinguir la calidad',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Escuchá la tercera y la quinta/),
    ).toBeInTheDocument()
  })

  it('dicta una escala, permite comparar y repetir, y muestra la regla', async () => {
    const name = uniqueDatabaseName()
    const completedAt = '2026-11-01T10:00:00.000Z'
    await seedLessons(name, {
      'lesson.m2-07': { status: 'completed', completedAt, secondsSpent: 60 },
    })

    showLesson('lesson.m2-08')
    render(<App databaseName={name} />)

    await screen.findByRole('heading', {
      level: 3,
      name: /Qué modo tiene la escala Do Re Mi Fa sostenido Sol La Si/,
    })

    expect(
      screen.getByText(/Escuchá la escala y elegí su tipo o modo/),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Escuchar escala' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Comparar con Mayor' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Repeticiones: 0 de 2')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Escuchar escala' }))
    expect(
      screen.getByRole('button', { name: 'Repetir escala' }),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Repetir escala' }))
    expect(screen.getByText('Repeticiones: 1 de 2')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Repetir escala' }))
    expect(screen.getByText('Repeticiones: 2 de 2')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Repetir escala' }),
    ).toBeDisabled()

    fireEvent.click(
      screen.getByRole('button', { name: 'Comparar con Mayor' }),
    )

    await submitAnswer('Dórico')

    expect(await screen.findByText('Todavía no.')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        level: 4,
        name: 'Recordá deletrear la escala',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Cada escala usa las siete letras una sola vez/),
    ).toBeInTheDocument()
  })

  it('dicta una progresión, permite repetirla y muestra la regla', async () => {
    const name = uniqueDatabaseName()
    const completedAt = '2026-11-01T10:00:00.000Z'
    await seedLessons(name, {
      'lesson.m2-06': { status: 'completed', completedAt, secondsSpent: 60 },
    })

    showLesson('lesson.m2-07')
    render(<App databaseName={name} />)

    await screen.findByRole('heading', {
      level: 3,
      name: /Escuchá la progresión en Do mayor y elegí sus grados/,
    })

    expect(
      screen.getByText(/Escuchá los acordes de la progresión/),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Escuchar progresión' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Repeticiones: 0 de 2')).toBeInTheDocument()

    fireEvent.click(
      screen.getByRole('button', { name: 'Escuchar progresión' }),
    )
    expect(
      screen.getByRole('button', { name: 'Repetir progresión' }),
    ).toBeInTheDocument()

    fireEvent.click(
      screen.getByRole('button', { name: 'Repetir progresión' }),
    )
    expect(screen.getByText('Repeticiones: 1 de 2')).toBeInTheDocument()

    fireEvent.click(
      screen.getByRole('button', { name: 'Repetir progresión' }),
    )
    expect(screen.getByText('Repeticiones: 2 de 2')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Repetir progresión' }),
    ).toBeDisabled()

    // El feedback de conducción de voces no aparece antes de responder.
    expect(
      screen.queryByRole('region', { name: 'Conducción de voces' }),
    ).not.toBeInTheDocument()

    await submitAnswer('I V vi IV')

    expect(await screen.findByText('Todavía no.')).toBeInTheDocument()
    expect(
      screen.getByText('La respuesta correcta es: I IV V I.'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        level: 4,
        name: 'Recordá los números romanos',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Las mayúsculas son acordes mayores/),
    ).toBeInTheDocument()

    // F4-022: tras corregir aparece el reproductor de práctica, sin revelar
    // la respuesta antes de tiempo.
    const player = screen.getByRole('region', {
      name: 'Reproductor de progresiones',
    })
    expect(player).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Reproducir progresión' }),
    ).toBeInTheDocument()

    const shape = screen.getByRole('combobox', { name: 'Forma' })
    expect(shape).toHaveValue('block')
    fireEvent.change(shape, { target: { value: 'bass-chord' } })
    expect(shape).toHaveValue('bass-chord')

    const tempo = screen.getByRole('slider', { name: /Tempo: 80 BPM/ })
    fireEvent.change(tempo, { target: { value: '120' } })
    expect(
      screen.getByRole('slider', { name: /Tempo: 120 BPM/ }),
    ).toHaveValue('120')

    const loop = screen.getByRole('checkbox', { name: 'Repetir en bucle' })
    expect(loop).not.toBeChecked()
    fireEvent.click(loop)
    expect(loop).toBeChecked()

    expect(screen.getByText('Acorde actual: —')).toBeInTheDocument()

    // F4-023: el motor revisa la conducción y propone una corrección.
    expect(
      screen.getByRole('region', { name: 'Conducción de voces' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/I → IV: quinta paralela entre las voces/),
    ).toBeInTheDocument()
    expect(screen.getByText('Propuesta de corrección:')).toBeInTheDocument()
  })

  it('oculta la melodía de M7-10 hasta corregir y revela la partitura', async () => {
    const name = uniqueDatabaseName()
    const completedAt = '2026-11-01T10:00:00.000Z'
    await seedLessons(name, {
      'lesson.m7-01': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m7-02': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m7-03': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m7-04': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m7-05': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m7-06': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m7-07': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m7-08': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m7-09': { status: 'completed', completedAt, secondsSpent: 60 },
    })

    showLesson('lesson.m7-10')
    render(<App databaseName={name} />)

    expect(
      await screen.findByRole('heading', {
        level: 3,
        name: /Escuchá la melodía oculta.*¿Qué nota es la cuarta\?/,
      }),
    ).toBeInTheDocument()

    // La partitura no está antes de corregir: la melodía es solo auditiva.
    expect(
      screen.queryByRole('group', { name: /^Melodía revelada:/ }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByText(/Escuchá la melodía oculta y respondé sin ver la partitura/),
    ).toBeInTheDocument()

    fireEvent.click(
      screen.getByRole('button', { name: 'Escuchar melodía oculta' }),
    )
    expect(
      screen.getByRole('button', { name: 'Repetir melodía oculta' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Repeticiones: 0 de 2')).toBeInTheDocument()

    fireEvent.click(
      screen.getByRole('button', { name: 'Repetir melodía oculta' }),
    )
    expect(screen.getByText('Repeticiones: 1 de 2')).toBeInTheDocument()
    fireEvent.click(
      screen.getByRole('button', { name: 'Repetir melodía oculta' }),
    )
    expect(screen.getByText('Repeticiones: 2 de 2')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Repetir melodía oculta' }),
    ).toBeDisabled()

    await submitAnswer('Re4')

    expect(await screen.findByText('¡Correcto!')).toBeInTheDocument()
    expect(
      screen.getByRole('group', { name: /^Melodía revelada:/ }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/La respuesta correcta es «Re4»/),
    ).toBeInTheDocument()

    // Recorre las otras tres melodías ocultas hasta la primera transposición.
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente ejercicio' }))
    await screen.findByRole('heading', {
      level: 3,
      name: /¿Qué intervalo hay entre la primera y la cuarta nota/,
    })
    await submitAnswer('quinta justa')
    await screen.findByText('¡Correcto!')

    fireEvent.click(screen.getByRole('button', { name: 'Siguiente ejercicio' }))
    await screen.findByRole('heading', {
      level: 3,
      name: /¿Cómo se mueve la melodía de la primera a la quinta nota\?/,
    })
    await submitAnswer('Sube por salto')
    await screen.findByText('¡Correcto!')

    fireEvent.click(screen.getByRole('button', { name: 'Siguiente ejercicio' }))
    await screen.findByRole('heading', {
      level: 3,
      name: /¿Qué nota es la sexta\?/,
    })
    await submitAnswer('Re5')
    await screen.findByText('¡Correcto!')

    fireEvent.click(screen.getByRole('button', { name: 'Siguiente ejercicio' }))
    expect(
      await screen.findByRole('heading', {
        level: 3,
        name: /¿Cómo queda esta melodía si la transponés de Do mayor a Sol mayor\?/,
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('group', { name: /^Melodía original:/ }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Escuchar melodía original' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('group', { name: /^Melodía transportada:/ }),
    ).not.toBeInTheDocument()

    await submitAnswer('G4 A4 B4 D5')

    expect(await screen.findByText('¡Correcto!')).toBeInTheDocument()
    expect(
      screen.getByRole('group', { name: /^Melodía transportada:/ }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/se transporta a Sol mayor subiendo 7 semitonos/),
    ).toBeInTheDocument()
  })

  it('muestra el lead sheet de M7-11 y corrige una nota de la melodía', async () => {
    const name = uniqueDatabaseName()
    const completedAt = '2026-11-01T10:00:00.000Z'
    await seedLessons(name, {
      'lesson.m7-01': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m7-02': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m7-03': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m7-04': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m7-05': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m7-06': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m7-07': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m7-08': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m7-09': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m7-10': { status: 'completed', completedAt, secondsSpent: 60 },
    })

    showLesson('lesson.m7-11')
    render(<App databaseName={name} />)

    expect(
      await screen.findByRole('heading', {
        level: 3,
        name: 'Lead sheet en Do mayor. ¿Qué nota de la melodía suena en el compás 3, pulso 3?',
      }),
    ).toBeInTheDocument()
    expect(
      await screen.findByRole('group', { name: /^Lead sheet:/ }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Escuchar lead sheet' }),
    ).toBeInTheDocument()

    await submitAnswer('La5')

    expect(await screen.findByText('¡Correcto!')).toBeInTheDocument()
    expect(
      screen.getByText(/La respuesta correcta es «La5»/),
    ).toBeInTheDocument()
  })

  it('muestra el patrón de pop/rock de M8-01 y corrige el ritmo', async () => {
    const name = uniqueDatabaseName()
    const completedAt = '2026-11-01T10:00:00.000Z'
    await seedLessons(name, {
      'lesson.m7-01': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m7-02': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m7-03': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m7-04': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m7-05': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m7-06': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m7-07': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m7-08': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m7-09': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m7-10': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m7-11': { status: 'completed', completedAt, secondsSpent: 60 },
    })

    showLesson('lesson.m8-01')
    render(<App databaseName={name} />)

    expect(
      await screen.findByRole('heading', {
        level: 3,
        name: 'Pop/rock en Do mayor. ¿Qué patrón rítmico tiene el acompañamiento del compás 1?',
      }),
    ).toBeInTheDocument()
    expect(
      await screen.findByRole('group', { name: /^Patrón de pop\/rock:/ }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Escuchar pop/rock' }),
    ).toBeInTheDocument()

    await submitAnswer('Corcheas')

    expect(await screen.findByText('¡Correcto!')).toBeInTheDocument()
    expect(
      screen.getByText(/La respuesta correcta es «Corcheas»/),
    ).toBeInTheDocument()
  })

  it('muestra el shuffle de blues de M8-02 y corrige el patrón', async () => {
    const name = uniqueDatabaseName()
    const completedAt = '2026-11-01T10:00:00.000Z'
    await seedLessons(name, {
      'lesson.m8-01': { status: 'completed', completedAt, secondsSpent: 60 },
    })

    showLesson('lesson.m8-02')
    render(<App databaseName={name} />)

    expect(
      await screen.findByRole('heading', {
        level: 3,
        name: 'Blues en Do. ¿Qué patrón rítmico tiene el acompañamiento del compás 1?',
      }),
    ).toBeInTheDocument()
    expect(
      await screen.findByRole('group', { name: /^Patrón de blues:/ }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Escuchar blues' }),
    ).toBeInTheDocument()

    await submitAnswer('Shuffle')

    expect(await screen.findByText('¡Correcto!')).toBeInTheDocument()
    expect(
      screen.getByText(/La respuesta correcta es «Shuffle»/),
    ).toBeInTheDocument()
  })

  it('muestra el swing de jazz de M8-03 y corrige el patrón', async () => {
    const name = uniqueDatabaseName()
    const completedAt = '2026-11-01T10:00:00.000Z'
    await seedLessons(name, {
      'lesson.m8-01': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m8-02': { status: 'completed', completedAt, secondsSpent: 60 },
    })

    showLesson('lesson.m8-03')
    render(<App databaseName={name} />)

    expect(
      await screen.findByRole('heading', {
        level: 3,
        name: 'Jazz en Do. ¿Qué patrón rítmico tiene el acompañamiento del compás 1?',
      }),
    ).toBeInTheDocument()
    expect(
      await screen.findByRole('group', { name: /^Patrón de jazz:/ }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Escuchar jazz' }),
    ).toBeInTheDocument()

    await submitAnswer('Shuffle')

    expect(await screen.findByText('¡Correcto!')).toBeInTheDocument()
    expect(
      screen.getByText(/La respuesta correcta es «Shuffle»/),
    ).toBeInTheDocument()
  })

  it('muestra la bossa nova de M8-04 y corrige el patrón', async () => {
    const name = uniqueDatabaseName()
    const completedAt = '2026-11-01T10:00:00.000Z'
    await seedLessons(name, {
      'lesson.m8-01': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m8-02': { status: 'completed', completedAt, secondsSpent: 60 },
      'lesson.m8-03': { status: 'completed', completedAt, secondsSpent: 60 },
    })

    showLesson('lesson.m8-04')
    render(<App databaseName={name} />)

    expect(
      await screen.findByRole('heading', {
        level: 3,
        name: 'Ritmo latino en Do. ¿Qué patrón tiene el acompañamiento del compás 1?',
      }),
    ).toBeInTheDocument()
    expect(
      await screen.findByRole('group', { name: /^Patrón latino:/ }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Escuchar ritmo latino' }),
    ).toBeInTheDocument()

    await submitAnswer('Bossa nova')

    expect(await screen.findByText('¡Correcto!')).toBeInTheDocument()
    expect(
      screen.getByText(/La respuesta correcta es «Bossa nova»/),
    ).toBeInTheDocument()
  })
})
