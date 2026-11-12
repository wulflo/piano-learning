import { expect, test } from '@playwright/test'

test('PWA: funciona sin conexion tras la primera carga', async ({ page, context }) => {
  // Primera carga: instala el service worker y precachea el shell.
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

  // Esperar a que el service worker se active.
  await page.waitForFunction(
    async () => {
      if (!('serviceWorker' in navigator)) return false
      const reg = await navigator.serviceWorker.getRegistration()
      return !!reg && !!reg.active
    },
    { timeout: 20000 },
  )

  // Cortar la red.
  await context.setOffline(true)

  // Navegar a otra ruta (el SW debe servir el shell desde cache).
  await page.goto('/#/curso')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

  await context.setOffline(false)
})