import { expect, test, type Page } from '@playwright/test'

/**
 * Recorrido E2E de F4-031 para el bloque M5-M6.
 *
 * Los dos tests siguen el camino del alumno con una excepción deliberada: la
 * lección se marca completada y se repasa antes de responder el ejercicio.
 * Así las dos habilidades de la lección —la propia y la del prerrequisito—
 * entran nuevas en la cola del día; después, el intento del ejercicio
 * comprueba que práctica y repaso suman en el mismo historial. Si se respondiera
 * primero, el intento crearía la tarjeta FSRS de la habilidad y esa habilidad ya
 * no sería «nueva» en el repaso.
 *
 * Para no completar una lección entera por la interfaz, el test espera a que la
 * app abra IndexedDB, marca el prerrequisito directo como completado en la base
 * y recarga. El resto del recorrido usa solo la interfaz.
 */

const DB_NAME = 'pianodesdecero.progress'
const COMPLETED_AT = '2026-11-01T10:00:00.000Z'

async function markLessonCompleted(page: Page, lessonId: string): Promise<void> {
  await page.evaluate(
    async ({ databaseName, id, completedAt }) => {
      const database = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(databaseName)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
      await new Promise<void>((resolve, reject) => {
        const transaction = database.transaction('lessons', 'readwrite')
        transaction.objectStore('lessons').put({
          id,
          status: 'completed',
          completedAt,
          secondsSpent: 60,
        })
        transaction.oncomplete = () => resolve()
        transaction.onerror = () => reject(transaction.error)
      })
      database.close()
    },
    { databaseName: DB_NAME, id: lessonId, completedAt: COMPLETED_AT },
  )
}

/** Califica «Bien» todos los ítems de la cola y espera el cierre del recorrido. */
async function rateWholeQueue(page: Page, total: number): Promise<void> {
  await page.getByRole('button', { name: 'Empezar repaso' }).click()
  for (let index = 0; index < total; index += 1) {
    await page.getByRole('button', { name: 'Bien' }).click()
  }
  await expect(
    page.getByRole('heading', { name: 'Recorrido completo' }),
  ).toBeVisible()
}

test('M5: progresión, repaso y persistencia', async ({ page }) => {
  // La primera visita abre IndexedDB y muestra el bloqueo por prerrequisitos.
  await page.goto('/#/leccion/lesson.m5-05')
  await expect(
    page.getByRole('heading', { level: 1, name: 'Lección bloqueada' }),
  ).toBeVisible()

  await markLessonCompleted(page, 'lesson.m5-04')
  await page.reload()

  await expect(
    page.getByRole('heading', {
      level: 3,
      name: 'En Do mayor, ¿qué grado completa la progresión I-V-?-IV?',
    }),
  ).toBeVisible()

  // Completar la lección incorpora sus dos habilidades al repaso: la propia y
  // la del prerrequisito que acaba de quedar completado.
  await page.getByRole('button', { name: 'Marcar como completada' }).click()
  await expect(page.getByText('Lección completada.')).toBeVisible()

  await page.goto('/#/repaso')
  await expect(
    page.getByRole('heading', { level: 1, name: 'Repaso de hoy' }),
  ).toBeVisible()
  await expect(
    page.getByText('Vencidos: 0 · Nuevos: 2 · Total: 2'),
  ).toBeVisible()
  await expect(page.getByText('Reconocer cadencias')).toBeVisible()
  await expect(page.getByText('Completar progresiones comunes')).toBeVisible()

  await rateWholeQueue(page, 2)
  await expect(page.getByText('2 de 2 respuestas guardadas.')).toBeVisible()

  // La recarga conserva la lección completada y el repaso registrado.
  await page.reload()
  await page.goto('/#/leccion/lesson.m5-05')
  await expect(page.getByText('Lección completada.')).toBeVisible()
  await expect(
    page.getByRole('heading', {
      level: 3,
      name: 'En Do mayor, ¿qué grado completa la progresión I-V-?-IV?',
    }),
  ).toBeVisible()

  await page.getByRole('radio', { name: 'vi', exact: true }).check()
  await page.getByRole('button', { name: 'Corregir' }).click()

  await expect(page.getByText('¡Correcto!')).toBeVisible()
  await expect(
    page.getByText(/La progresión pop I-V-vi-IV en Do mayor es Do-Sol-Lam-Fa/),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Escuchar progresión' }),
  ).toBeVisible()
  await expect(
    page.getByRole('region', { name: 'Reproductor de progresiones' }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Reproducir progresión' }),
  ).toBeVisible()
  await expect(page.getByText('Acorde actual: —')).toBeVisible()
  await expect(page.getByText('Guardando el intento…')).toBeHidden()

  // Dos repasos más el intento del ejercicio dejan tres respuestas.
  await page.goto('/#/progreso')
  await expect(
    page.getByRole('heading', { level: 1, name: 'Tu progreso' }),
  ).toBeVisible()
  await expect(page.getByText('3 respuestas registradas')).toBeVisible()

  await page.reload()
  await expect(page.getByText('3 respuestas registradas')).toBeVisible()
})

test('M6: análisis, repaso y persistencia', async ({ page }) => {
  await page.goto('/#/leccion/lesson.m6-01')
  await expect(
    page.getByRole('heading', { level: 1, name: 'Lección bloqueada' }),
  ).toBeVisible()

  await markLessonCompleted(page, 'lesson.m5-09')
  await page.reload()

  await expect(
    page.getByRole('heading', {
      level: 3,
      name: '¿Cuántos motivos distintos tiene esta melodía?',
    }),
  ).toBeVisible()
  await expect(
    page.getByRole('group', { name: /Melodía para analizar/ }),
  ).toBeVisible()

  // M6-01 añade el análisis de motivos y M5-09 la modulación con pivote.
  await page.getByRole('button', { name: 'Marcar como completada' }).click()
  await expect(page.getByText('Lección completada.')).toBeVisible()

  await page.goto('/#/repaso')
  await expect(
    page.getByRole('heading', { level: 1, name: 'Repaso de hoy' }),
  ).toBeVisible()
  await expect(
    page.getByText('Vencidos: 0 · Nuevos: 2 · Total: 2'),
  ).toBeVisible()
  await expect(page.getByText('Analizar modulaciones con pivote')).toBeVisible()
  await expect(page.getByText('Reconocer motivos y frases')).toBeVisible()

  await rateWholeQueue(page, 2)
  await expect(page.getByText('2 de 2 respuestas guardadas.')).toBeVisible()

  await page.reload()
  await page.goto('/#/leccion/lesson.m6-01')
  await expect(page.getByText('Lección completada.')).toBeVisible()
  await expect(
    page.getByRole('heading', {
      level: 3,
      name: '¿Cuántos motivos distintos tiene esta melodía?',
    }),
  ).toBeVisible()

  await page.getByRole('radio', { name: '3 motivos', exact: true }).check()
  await page.getByRole('button', { name: 'Corregir' }).click()

  await expect(page.getByText('Todavía no.')).toBeVisible()
  await expect(
    page.getByText('La respuesta correcta es: 4 motivos.'),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', {
      level: 4,
      name: 'Recordá qué es un motivo y qué es una frase',
    }),
  ).toBeVisible()
  await expect(page.getByText(/La segmentación marca 4 motivos/)).toBeVisible()
  await expect(page.getByText('Guardando el intento…')).toBeHidden()

  // Dos repasos más el intento fallido dejan tres respuestas registradas.
  await page.goto('/#/progreso')
  await expect(
    page.getByRole('heading', { level: 1, name: 'Tu progreso' }),
  ).toBeVisible()
  await expect(page.getByText('3 respuestas registradas')).toBeVisible()

  await page.reload()
  await expect(page.getByText('3 respuestas registradas')).toBeVisible()
})
