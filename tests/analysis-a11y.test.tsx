import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axe from 'axe-core'
import { afterEach, describe, expect, it } from 'vitest'
import { App } from '../src/App'
import { lessonHash } from '../src/router/hash-route'
import type { LessonProgress } from '../src/schemas'
import { createProgressDatabase } from '../src/state/db'
import { createProgressRepositories } from '../src/state/repositories'

/**
 * F4-032 — Accesibilidad del análisis musical y de las partituras.
 *
 * Recorre los seis tipos de análisis que publica M5-M6 (motivos, forma,
 * textura, contrapunto, adornos y sextas aumentadas). Cada caso comprueba que
 * la partitura tenga una descripción textual de sus notas, que el grupo de
 * opciones y el botón de escucha tengan nombre accesible, que axe no reporte
 * violaciones críticas o serias antes y después de corregir, y que la
 * corrección explique el resultado con texto y con el «Recordá» pedagógico.
 *
 * El último test responde un análisis de motivos solo con el teclado: foco,
 * espacio para marcar el radio, foco en «Corregir» y Enter para enviar.
 */

let databaseCounter = 0

function uniqueDatabaseName(): string {
  databaseCounter += 1
  return `pdc.test.analysis-a11y.${databaseCounter}`
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

interface AnalysisCase {
  lessonId: string
  prerequisite: string
  prompt: RegExp
  staffLabel: string
  listenLabel: string
  wrong: string
  correct: string
  explanation: RegExp
  remember: string
}

const ANALYSIS_CASES: readonly AnalysisCase[] = [
  {
    lessonId: 'lesson.m6-01',
    prerequisite: 'lesson.m5-09',
    prompt: /Cuántos motivos distintos tiene esta melodía/,
    staffLabel: 'Melodía para analizar',
    listenLabel: 'Escuchar melodía completa',
    wrong: '3 motivos',
    correct: '4 motivos',
    explanation: /La segmentación marca 4 motivos/,
    remember: 'Recordá qué es un motivo y qué es una frase',
  },
  {
    lessonId: 'lesson.m6-02',
    prerequisite: 'lesson.m6-01',
    prompt: /Qué forma tiene esta melodía/,
    staffLabel: 'Melodía para analizar',
    listenLabel: 'Escuchar melodía completa',
    wrong: 'Forma ternaria (ABA)',
    correct: 'Forma binaria (AB)',
    explanation: /dos secciones contrastantes/,
    remember: 'Recordá el período y las formas binaria y ternaria',
  },
  {
    lessonId: 'lesson.m6-03',
    prerequisite: 'lesson.m6-02',
    prompt: /Qué forma tiene esta melodía/,
    staffLabel: 'Melodía para analizar',
    listenLabel: 'Escuchar melodía completa',
    wrong: 'Forma ternaria (ABA)',
    correct: 'Rondó (ABACA)',
    explanation: /El estribillo A vuelve después de cada episodio/,
    remember: 'Recordá el rondó y la forma sonata',
  },
  {
    lessonId: 'lesson.m6-04',
    prerequisite: 'lesson.m6-03',
    prompt: /Qué textura tiene esta música/,
    staffLabel: 'Melodía para analizar',
    listenLabel: 'Escuchar melodía completa',
    wrong: 'Homofonía (melodía con acordes)',
    correct: 'Monofonía (una sola línea melódica)',
    explanation: /Suena una sola línea melódica/,
    remember: 'Recordá las texturas musicales',
  },
  {
    lessonId: 'lesson.m6-05',
    prerequisite: 'lesson.m6-04',
    prompt: /Qué movimiento hay entre las dos voces/,
    staffLabel: 'Melodía para analizar',
    listenLabel: 'Escuchar melodía completa',
    wrong: 'Movimiento contrario',
    correct: 'Movimiento paralelo',
    explanation: /Las dos voces se mueven en la misma dirección/,
    remember: 'Recordá el movimiento de las voces y las reglas básicas',
  },
  {
    lessonId: 'lesson.m6-06',
    prerequisite: 'lesson.m6-05',
    prompt: /Qué adorno se ejecuta en esta realización/,
    staffLabel: 'Melodía para analizar',
    listenLabel: 'Escuchar melodía completa',
    wrong: 'Mordente: bajar a la inferior y volver a la principal',
    correct: 'Trino: alternar la nota principal con la superior',
    explanation: /Las notas alternan la principal con la superior/,
    remember: 'Recordá cómo se ejecutan los adornos',
  },
  {
    lessonId: 'lesson.m5-11',
    prerequisite: 'lesson.m5-08',
    prompt: /Qué variante de sexta aumentada es/,
    staffLabel: 'Acorde para analizar',
    listenLabel: 'Escuchar acorde',
    wrong: 'Sexta aumentada francesa',
    correct: 'Sexta aumentada italiana',
    explanation: /Solo hay tres notas y la tercera es la tónica La/,
    remember: 'Recordá las sextas aumentadas',
  },
]

const completedAt = '2026-11-01T10:00:00.000Z'

afterEach(() => {
  window.location.hash = ''
})

describe('F4-032 — Accesibilidad del análisis musical', () => {
  for (const analysisCase of ANALYSIS_CASES) {
    it(`describe la partitura y pasa axe en ${analysisCase.lessonId}`, async () => {
      const name = uniqueDatabaseName()
      await seedLessons(name, {
        [analysisCase.prerequisite]: {
          status: 'completed',
          completedAt,
          secondsSpent: 60,
        },
      })

      showLesson(analysisCase.lessonId)
      const { container } = render(<App databaseName={name} />)

      const heading = await screen.findByRole('heading', {
        level: 3,
        name: analysisCase.prompt,
      })
      const article = heading.closest('article')
      expect(article).not.toBeNull()
      const scope = within(article as HTMLElement)

      // La partitura declara su propósito en la leyenda y describe sus notas en
      // el grupo accesible y en el texto visible bajo el pentagrama.
      expect(
        scope.getByText(analysisCase.staffLabel, { exact: false }),
      ).toBeInTheDocument()
      const staff = scope.getByRole('group', {
        name: new RegExp(`^${analysisCase.staffLabel}: .+`),
      })
      expect(staff).toHaveAccessibleName(
        new RegExp(`^${analysisCase.staffLabel}: .+`),
      )
      expect(scope.getByText('Notas:')).toBeInTheDocument()

      // Las opciones viven en un grupo con leyenda y el botón de escucha tiene
      // un nombre explícito, sin depender del icono ni del color.
      expect(
        scope.getByRole('group', { name: 'Elegí una opción' }),
      ).toBeInTheDocument()
      expect(
        scope.getByRole('button', { name: analysisCase.listenLabel }),
      ).toBeEnabled()

      await expectNoSeriousViolations(container)

      fireEvent.click(scope.getByRole('radio', { name: analysisCase.wrong }))
      fireEvent.click(scope.getByRole('button', { name: 'Corregir' }))

      await waitFor(() =>
        expect(scope.getByText('Todavía no.')).toBeInTheDocument(),
      )
      expect(
        scope.getByText(
          `La respuesta correcta es: ${analysisCase.correct}.`,
        ),
      ).toBeInTheDocument()
      expect(
        scope.getByRole('heading', {
          level: 4,
          name: analysisCase.remember,
        }),
      ).toBeInTheDocument()
      expect(scope.getByText(analysisCase.explanation)).toBeInTheDocument()

      // La corrección se anuncia como región viva y el resultado no depende
      // únicamente del color.
      const feedback = scope.getByText('Todavía no.').closest('[role="status"]')
      expect(feedback).not.toBeNull()
      expect(feedback).toHaveAttribute('aria-live', 'polite')

      await expectNoSeriousViolations(container)
    }, 30000)
  }

  it('responde un análisis de motivos solo con el teclado', async () => {
    const user = userEvent.setup()
    const name = uniqueDatabaseName()
    await seedLessons(name, {
      'lesson.m5-09': {
        status: 'completed',
        completedAt,
        secondsSpent: 60,
      },
    })

    showLesson('lesson.m6-01')
    render(<App databaseName={name} />)

    await screen.findByRole('heading', {
      level: 3,
      name: /Cuántos motivos distintos tiene esta melodía/,
    })

    // El botón de escucha se enfoca y responde a Enter.
    const listen = screen.getByRole('button', {
      name: 'Escuchar melodía completa',
    })
    listen.focus()
    expect(listen).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(listen).toHaveFocus()

    // El radio correcto se marca con la barra espaciadora.
    const correct = screen.getByRole('radio', {
      name: '4 motivos',
    }) as HTMLInputElement
    correct.focus()
    expect(correct).toHaveFocus()
    await user.keyboard(' ')
    expect(correct).toBeChecked()

    // El botón de corregir se activa y se pulsa con Enter.
    const submit = screen.getByRole('button', { name: 'Corregir' })
    expect(submit).toBeEnabled()
    submit.focus()
    expect(submit).toHaveFocus()
    await user.keyboard('{Enter}')

    expect(await screen.findByText('¡Correcto!')).toBeInTheDocument()
    expect(
      screen.getByText(/La segmentación marca 4 motivos/),
    ).toBeInTheDocument()
  }, 30000)
})
