import { expect, test } from '@playwright/test'

test('repertorio: abrir pieza, cambiar manos y reproducir', async ({ page }) => {
  await page.goto('/#/pieza/piece.petzold.minuet-g')
  await expect(page.getByRole('radio', { name: 'Ambas' })).toBeChecked()

  await page.getByRole('radio', { name: 'Izquierda' }).click()
  await expect(page.getByText(/Izquierda · compases/)).toBeVisible()

  await page.getByRole('button', { name: 'Reproducir' }).click()
  await page.getByRole('button', { name: 'Detener' }).click()
})