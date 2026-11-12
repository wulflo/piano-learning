import { expect, test, type Page } from '@playwright/test'

/**
 * Recorrido E2E de F3-033 para el bloque M3-M4.
 *
 * M3-01 pide M2-12 como prerrequisito. Para no completar una lección entera por
 * la interfaz, el test espera a que la app abra IndexedDB, marca M2-12 como
 * completada directamente en la base y recarga. A partir de ahí el recorrido es
 * el del alumno: abrir la lección, fallar un intervalo, leer el «Recordá»,
 * repasar la habilidad nueva del prerrequisito y comprobar que las respuestas
 * sobreviven a una recarga.
 *
 * El ítem que entra en la cola es «Construir escalas mayores» (la habilidad de
 * M2-12), porque la tarjeta del intervalo fallado queda programada para más
 * adelante y todavía no vence.
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

test('M3: lección, error con «Recordá», repaso y persistencia', async ({
  page,
}) => {
  // La primera visita abre IndexedDB y muestra el bloqueo por prerrequisitos.
  await page.goto('/#/leccion/lesson.m3-01')
  await expect(
    page.getByRole('heading', { level: 1, name: 'Lección bloqueada' }),
  ).toBeVisible()

  await markLessonCompleted(page, 'lesson.m2-12')
  await page.reload()

  await expect(
    page.getByRole('heading', {
      level: 3,
      name: '¿Qué intervalo hay entre Do4 y Re4?',
    }),
  ).toBeVisible()

  await page.getByRole('radio', { name: 'Segunda menor' }).check()
  await page.getByRole('button', { name: 'Corregir' }).click()

  await expect(page.getByText('Todavía no.')).toBeVisible()
  await expect(
    page.getByText('La respuesta correcta es: Segunda mayor.'),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', {
      level: 4,
      name: 'Recordá los intervalos mayores',
    }),
  ).toBeVisible()
  await expect(page.getByText('Guardando el intento…')).toBeHidden()

  await page.goto('/#/repaso')
  await expect(
    page.getByRole('heading', { level: 1, name: 'Repaso de hoy' }),
  ).toBeVisible()
  await expect(
    page.getByText('Vencidos: 0 · Nuevos: 1 · Total: 1'),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Empezar repaso' }).click()
  await expect(
    page.getByRole('heading', {
      level: 3,
      name: 'Construir escalas mayores',
    }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Bien' }).click()
  await expect(
    page.getByRole('heading', { name: 'Recorrido completo' }),
  ).toBeVisible()

  await page.reload()
  await page.goto('/#/progreso')
  await expect(
    page.getByRole('heading', { level: 1, name: 'Tu progreso' }),
  ).toBeVisible()
  await expect(page.getByText('2 respuestas registradas')).toBeVisible()
})
