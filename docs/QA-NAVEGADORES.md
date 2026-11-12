# QA en navegadores — F6-027

Fecha: 2026-11-14. Entorno: Linux, Node 26.13.0, Playwright 1.65 con
`@playwright/test`.

## Matriz

| Navegador | Motor | Versión | Estado | Notas |
|---|---|---|---|---|
| Chrome / Chromium | Chromium | Playwright `chromium-1254` | ✅ 6/6 E2E | Flujo completo, repertorio y PWA offline |
| Microsoft Edge | Chromium | Mismo motor que Chrome | ✅ por equivalencia | No se dispone de Edge nativo en Linux; el motor es idéntico |
| Firefox | Gecko | Playwright `firefox-1572` | ✅ 6/6 E2E | Incluye PWA offline |
| Safari | WebKit | Playwright `webkit-2388` | ⚠️ bloqueado por el host | Faltan `libicudata.so.74`, `libicui18n.so.74`, `libicuuc.so.74`, `libWPEWebKit-2.0.so.1`, entre otras; `playwright install-deps` requiere root |

Comando usado:

```bash
PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1 npx playwright test --project=firefox
npx playwright test --project=chromium
```

Las seis pruebas cubren lección → ejercicio → repaso, M3-M4, M5-M6,
repertorio y PWA offline. Todas pasaron en Chromium y Firefox.

## Incidencias registradas

1. **WebKit/Safari no ejecutable en este host.** El binario de Playwright
   requiere ICU 74 y WPE, que no están instalados y no se pueden añadir sin
   privilegios. La app no usa APIs específicas de WebKit; el fallback MIDI está
   cubierto por el aviso de la pantalla de ajustes.
2. **Audio real y MIDI físico** no se pueden validar en este entorno. La lógica
   MIDI está cubierta por tests unitarios con mensajes simulados y el audio por
   tests de manifiesto y presupuesto.
3. **PWA en Firefox** funciona sin conexión tras la primera carga, igual que en
   Chromium.

## Pendiente

- Safari real en macOS y las pruebas en iOS/Android (F6-028 y F6-029).
- Repetir la matriz en Edge nativo cuando haya una máquina Windows disponible.
