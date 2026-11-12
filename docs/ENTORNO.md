# ENTORNO — Piano Today

Última actualización: 2026-11-10T10:25:00-03:00

## Máquina de desarrollo

| Elemento | Versión / estado |
|---|---|
| Sistema | Linux |
| Node.js | 26.13.0 |
| npm | 12.2.2 |
| git | 2.56.0 |
| `gh` (GitHub CLI) | no instalado (se resolverá en la fase de GitHub) |
| Red | disponible (registry.npmjs.org respondió HTTP 200 al bootstrap) |
| Directorio | `/home/alonso/Documentos/Repositorios/piano-learning` |

## Estado actual del entorno (F2 en curso)

- Scaffold compilable: `npm run dev`, `npm run typecheck`, `npm test`, `npm run build`, `npm run budget` y `npm run test:e2e` verificados.
- Bundle de producción: JS inicial 191.20 kB gzip (< 300 kB) con Tone.js, VexFlow y FSRS diferidos. `npm run budget` valida el presupuesto y los chunks separados.
- Suite: 110 archivos de test, 788 tests en verde; un recorrido E2E de Playwright en verde.
- Contenido validado: 9 módulos, 30 lecciones publicadas, 150 ejercicios, 24 habilidades y 1 pieza original.
- `package-lock.json` versionado y reproducible con `npm ci`.
- Assets de audio Salamander descargados: 30 muestras MP3, 1.92 MB total, verificadas por tamaño y SHA-256; `--dry-run` reporta 30 presentes y 0 faltantes.
- Tags locales `fase-0` y `fase-1`; remoto `origin` con push a `main` autorizado y Pages activo. No se crean tags ni releases remotos sin autorización.
- F1 completa. F2 en curso: M0-M2 publicados, persistencia, FSRS, progreso, plan diario y reproductor de ejercicios.

## Repositorio y política de git

- Git inicializado **solo en local**, rama `main`, sin remoto, sin push.
- Identidad local del repo: `Piano Today Dev <dev@pianodesdecero.local>`.
- `package-lock.json` se commitea siempre. Instalación reproducible con `npm ci`.
- Un commit atómico por tarea; el mensaje incluye el ID (`feat(F1-005): ...`).
- Tags locales `fase-N` al cerrar cada fase. No se crean releases ni remotos hasta autorización explícita.

## Dependencias directas y licencias

| Paquete | Versión | Licencia | Tipo |
|---|---|---|---|
| react | 19.3.1 | MIT | runtime |
| react-dom | 19.3.1 | MIT | runtime |
| zod | 4.6.7 | MIT | runtime |
| tonal | 6.5.1 | MIT | runtime |
| tone | 15.1.22 | MIT | runtime |
| vexflow | 5.0.0 | MIT | runtime |
| @testing-library/dom | 10.4.2 | MIT | dev |
| @testing-library/jest-dom | 7.0.1 | MIT | dev |
| @testing-library/react | 16.3.3 | MIT | dev |
| @testing-library/user-event | 14.6.8 | MIT | dev |
| @playwright/test | 1.65.0 | Apache-2.0 | dev |
| axe-core | 4.14.0 | MPL-2.0 | dev |
| @types/node | 26.6.6 | MIT | dev |
| @types/react | 19.3.0 | MIT | dev |
| @types/react-dom | 19.3.0 | MIT | dev |
| @vitejs/plugin-react | 6.2.1 | MIT | dev |
| fake-indexeddb | 6.2.8 | Apache-2.0 | dev |
| jsdom | 31.0.0 | MIT | dev |
| license-checker | 25.0.1 | BSD-3-Clause | dev |
| tsx | 4.23.15 | MIT | dev |
| typescript | 7.0.2 | Apache-2.0 | dev |
| vite | 8.3.6 | MIT | dev |
| vitest | 5.1.0 | MIT | dev |

### Resumen transitivo (171 paquetes en el lockfile)

| Licencia | Cantidad |
|---|---|
| MIT | 126 |
| Apache-2.0 | 26 |
| MPL-2.0 | 12 |
| BSD-2-Clause | 2 |
| BSD-3-Clause | 2 |
| ISC | 2 |
| BlueOak-1.0.0 | 1 |

Todas son compatibles con distribución estática y con el código MIT del proyecto. El detalle completo se generará en `THIRD_PARTY_LICENSES.md` durante F0-010.

## Notas de instalación

- npm 12 bloquea scripts de instalación por defecto. Esbuild requiere su `postinstall`:
  ```bash
  npm install-scripts approve esbuild
  npm rebuild esbuild
  ```
  Sin ese paso Vite igual arranca, pero se aprobó para evitar fallos intermitentes.
- `overrides.glob` fuerza `glob@^14` (advisory de seguridad) salvo en `read-package-json`, que usa `glob@^7` porque `license-checker` lo requiere con export CommonJS. La anulación por paquete evita romper la auditoría de licencias.
- Node 26 es la versión local; el proyecto declara `engines.node >= 22.12.0` para CI y GitHub Pages.
- TypeScript 7.0.2 es la estable actual. Si aparece una incompatibilidad con el toolchain, se documentará como ADR y se bajará a la última 5.9.x.

## Tareas que requieren red (`[NET]`)

- F0-001: instalación inicial desde el registro npm (completada).
- F1-039: descarga de muestras Salamander.
- F1-040: cierre de manifiesto y atribución con assets descargados.
- F2-047: investigación del optimizador de FSRS en navegador.
- F5-025: verificación de dominio público de repertorio (completada el
  2026-11-13; fuentes, fechas y descartes en `docs/LICENCIAS.md`).
- F6-022 a F6-026: workflows, Pages, demo publicada y tags remotos (solo con autorización).
- Cualquier `npm install` nuevo.

Ninguna tarea `[NET]` bloquea el avance offline: las dependencias ya están
instaladas y el resto del trabajo usa datos locales.

Todo lo demás debe funcionar sin red, y la app no debe pedir red en runtime.

## Assets de audio

| Asset | Estado | Formato previsto | Presupuesto |
|---|---|---|---|
| Salamander Grand Piano (Alexander Holm, CC BY 3.0) | descargado (30 MP3, 1.92 MB) | MP3, una muestra cada tercera menor, 1 capa de velocidad | < 150 MB |
| Metrónomo | sintetizado en runtime | — | 0 MB |
| Fallback de piano | `PolySynth` de Tone.js | — | 0 MB |

- Destino local servido por Vite: `public/audio/samples/` (ignorado por git; solo se versiona `.gitkeep`). El script también acepta `--out` para pruebas.
- Manifiesto versionado: `assets/audio/manifest.json` (URL, archivo, bytes, SHA-256).
- Script: `scripts/fetch-samples.mjs`, idempotente y con reanudación por HTTP Range.
- La app funciona con muestras descargadas o sin ellas usando el fallback sintetizado.
- El sampler se carga bajo demanda y, si falla la red o el tiempo de espera, cae automáticamente a `PolySynth`.

### Archivos descargados y verificación

| Archivo | Nota | Bytes | SHA-256 |
|---|---:|---:|---|
| `A0.mp3` | A0 | 113969 | `f62d50bd977679e1316063866ece754604b8c214d73b7e3033372c75d9064c03` |
| `A1.mp3` | A1 | 115061 | `17fa1e363f9fad67c3357be54a6defc4fca5a5c2aada21de84b30254f9cb2f5b` |
| `A2.mp3` | A2 | 81678 | `20601d890f44a3c22499c7b61f52e571795df1fe5a01fac553dded7b6379e1d4` |
| `A3.mp3` | A3 | 74526 | `8e108fe228e34e32f6b4e61efff732eec53058a9e6f05a8d8e719598b132c4f9` |
| `A4.mp3` | A4 | 61148 | `a62df24a2c84cea8d18c1fa8aca7c18c877ba2b76a00a591256fa74d3ce54ac3` |
| `A5.mp3` | A5 | 45747 | `9e5cee1fe9cf68b7193623d46a27c8956e572c1ff234ca0e11599b556050dec6` |
| `A6.mp3` | A6 | 30013 | `b6064a657592c63c03561d2ce1092607c14e1d8091445d50065d0ec819ff6fbc` |
| `A7.mp3` | A7 | 18730 | `751c0a0acd00bad6e52749063dac56a0def9870242b053c68ab45cbe8d083fc1` |
| `C1.mp3` | C1 | 110199 | `caba05f0be4d9f6030adcc033208b49ac54e47d58edc57b743085b095b4ea395` |
| `C2.mp3` | C2 | 110357 | `7029a9e84f748433bc33d067ee13d37d0b866768f09ae6c7dac8e2e98e1e53ca` |
| `C3.mp3` | C3 | 78036 | `bb70dd921d81b3dda561c19b5c029292ae5a6fba1947e364bf274218ce19a9d1` |
| `C4.mp3` | C4 | 78718 | `689eaa4c2fd7f29a2cc0e386eec462156d523a87d701269e5e2458e66056f4f6` |
| `C5.mp3` | C5 | 68920 | `2f5b0f7422063010fb379e684bfdf2daa3911dcd2251413d79fa2a53029fdc30` |
| `C6.mp3` | C6 | 28065 | `0d3232edd13ba69fd5caf4a295060ae0fd533b8a1433ae0a038644d70715c907` |
| `C7.mp3` | C7 | 18963 | `694b512fac99ba7f7290c045d9c18e94724a7ebcc319b937baabc62125814283` |
| `C8.mp3` | C8 | 18914 | `b4b5f321751b544ee7f0d6d3e3f1ef52873dd4a6aee91ba41e6c8e61e17a084c` |
| `Ds1.mp3` | D#1 | 120625 | `1c02b816b85d2fa938815fdf04d7d327ff20068f1aadc3c97052144c735afa0c` |
| `Ds2.mp3` | D#2 | 110796 | `a106cdec93aa4e767e36809fc9cdaa6b92453fb9f18d5fc28ac4eb0f9f239ecd` |
| `Ds3.mp3` | D#3 | 78717 | `4fe73ea3f2c59a1dbfb35cff1d9d8a9e38cb12ef39a91a13083729544cdafed5` |
| `Ds4.mp3` | D#4 | 73519 | `663e8bb3e2d0fa23a30526dcd7ab0e42609c193c07025647ef46badcf81ec211` |
| `Ds5.mp3` | D#5 | 58179 | `bf71096e653ab7ceca3914b9fd44d8c27fe83c162564c5db34bd06b94eb14b8c` |
| `Ds6.mp3` | D#6 | 31395 | `eb643014d9f926f1a5f9f51fc4a1ed8c07c6da36ce164d5b221d7b878a53f142` |
| `Ds7.mp3` | D#7 | 22136 | `d51f4c51bed719f51e75ad22d5b9ac4b4d1a4749d02ef31ea03696de46fa5e77` |
| `Fs1.mp3` | F#1 | 115010 | `5cbb51d2a0a55a9ef3656671ca72e336856813949055bb6c189cf990655335cf` |
| `Fs2.mp3` | F#2 | 102320 | `dd34c708274eeba35da1fd99fc31ef904e390ff02f6864aefe8a13261f8a8327` |
| `Fs3.mp3` | F#3 | 77933 | `960fefd90f56608b7edf958dadfeca893cff5744ab9034d61e419401fe45ce9c` |
| `Fs4.mp3` | F#4 | 68219 | `613652f5c96e35736ce6a46bc4ddb6ba1076d1fb16a35a4c22c14e67efdde57c` |
| `Fs5.mp3` | F#5 | 51597 | `ed2fdf543274ea72ddd4eb634a16356531a5f4040b2a60d34fb12a5c72cbf22f` |
| `Fs6.mp3` | F#6 | 26478 | `c584d2b4e96a37b12c920ed3212d149abedf25342389bfdc557b2fac847ab11c` |
| `Fs7.mp3` | F#7 | 22709 | `e9ce71e0f7dc39c1d0033d656cf57e3aa8b303127147f194cc92b04e2b648a9f` |

- Verificación: `node scripts/fetch-samples.mjs --dry-run` → presentes 30, faltantes 0, inválidas 0.
- Los archivos viven en `public/audio/samples/` (ignorados por git) y el manifiesto con hashes se versiona en `assets/audio/manifest.json`.

## Pruebas E2E con Playwright

- `@playwright/test` 1.65.0 (Apache-2.0). El navegador Chromium 158 se instala aparte con `npx playwright install chromium` y queda en `~/.cache/ms-playwright` (no se versiona).
- `playwright.config.ts` compila la app con `npm run build`, sirve `dist/` con `vite preview` en `127.0.0.1:4173` y ejecuta un solo worker para que las bases IndexedDB no se crucen.
- `npm run test:e2e` corre el recorrido `e2e/lesson-exercise-review.spec.ts`: abre M0-01, falla un ejercicio, comprueba el «Recordá», repasa una habilidad nueva y verifica tras recargar que las dos respuestas siguen en el progreso.
- Los artefactos (`test-results/`, `playwright-report/`) están ignorados por git. El workflow de Pages todavía no ejecuta E2E: instalar el navegador en CI suma tiempo y se decidirá al cerrar F6.

## Comandos de referencia

```bash
npm ci
npm run dev
npm run typecheck
npm test
npm run test:e2e
npm run build
npm run validate:content
npm run budget
npm run estado
npm run audit:audio
npm run audit:licenses
node scripts/fetch-samples.mjs --dry-run
```
