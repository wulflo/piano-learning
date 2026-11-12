import { expect, test } from '@playwright/test'

/**
 * Recorrido completo de F2-072: abrir una lección, fallar un ejercicio y ver el
 * «Recordá», repasar una habilidad nueva y comprobar que el progreso sobrevive
 * a una recarga.
 *
 * La lección M0-01 tiene dos habilidades: los ejercicios usan
 * `skill.keyboard-groups`, así que al fallar queda una tarjeta FSRS para esa
 * habilidad y `skill.note-names` sigue nueva. Por eso la cola del repaso tiene
 * exactamente un ítem nuevo.
 */

test('lección → ejercicio → repaso y persistencia tras recargar', async ({
  page,
}) => {
  await page.goto('/#/leccion/lesson.m0-01')

  await expect(
    page.getByRole('heading', {
      level: 3,
      name: /grupo de dos teclas negras/,
    }),
  ).toBeVisible()

  await page.getByRole('radio', { name: 'Re', exact: true }).check()
  await page.getByRole('button', { name: 'Corregir' }).click()

  await expect(page.getByText('Todavía no.')).toBeVisible()
  await expect(page.getByText('La respuesta correcta es: Do.')).toBeVisible()
  await expect(
    page.getByRole('heading', {
      level: 4,
      name: 'Recordá cómo se nombran las notas',
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
    page.getByRole('heading', { level: 3, name: 'Nombrar notas en el teclado' }),
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
