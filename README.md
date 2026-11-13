# Piano Today

App web estática para aprender teoría musical y piano/teclado desde cero, con
lecciones cortas, ejercicios interactivos, repaso espaciado y práctica en un
teclado real o en el teclado en pantalla. Funciona sin backend y sin cuentas: el
progreso vive en el navegador (IndexedDB) y se puede exportar e importar.

**Demo publicada:** <https://wulflo.github.io/piano-learning/>

## Qué incluye

- **9 módulos y 79 lecciones**: desde orientación y las primeras notas hasta
  técnica, estilos, lectura a primera vista, lead sheets e improvisación.
- **720 ejercicios** con corrección, pistas graduadas y audio.
- **67 habilidades** entrenadas con repetición espaciada (FSRS).
- **28 piezas de repertorio**: transcripciones de dominio público, estudios
  originales y melodías CC0, con ficha de licencia y reproductor por manos.
- **Teclado interactivo**, pentagrama con VexFlow y motor de audio con muestras
  de piano (Salamander) y síntesis como respaldo.
- **PWA instalable** con precache del shell y funcionamiento sin conexión.
- **MIDI opcional** (Web MIDI): detección de teclado, tempo, ritmo y feedback
  objetivo. Sin MIDI, la autoevaluación manual sigue disponible.
- **Accesibilidad**: navegación por teclado, enlace de salto, alternativas
  textuales de notación/audio, contraste AA y movimiento reducido.

## Cómo aprender

1. Abrí la app y recorré el **Curso** en orden. Cada lección trae objetivos,
   explicación breve, ejemplos y una tarea de teclado.
2. Practicá con el **teclado en pantalla** o conectá un teclado MIDI.
3. Usá **Práctica** para una sesión diaria y **Repaso** para lo que el sistema
   espaciado te propone.
4. Tocá piezas en **Repertorio**; ajustá manos, compases, tempo y bucle.
5. Revisá **Progreso** y exportá tu avance desde **Ajustes**.

No hace falta leer música antes de empezar: el curso introduce el pentagrama de
forma gradual. Las lecciones son cortas a propósito; es mejor practicar 15
minutos varios días que una sesión larga una vez por semana.

## Requisitos y comandos

Requiere **Node.js ≥ 22.12**.

```bash
npm ci            # instalar dependencias exactas del lockfile
npm run dev       # servidor de desarrollo
npm run typecheck
npm test
npm run validate:content
npm run build
npm run budget    # build + presupuesto de JS inicial y code splitting
npm run estado    # verificaciones completas + docs/ESTADO.md
```

El desarrollo local queda en `/`. Para publicar bajo `/<nombre-del-repo>/` se
usa `VITE_BASE`; el workflow de GitHub Pages lo configura automáticamente.

## PWA y uso sin conexión

La app registra un service worker que precachea el shell (HTML, JS, CSS e
iconos) y cachea las muestras de audio en tiempo de ejecución. La primera visita
necesita conexión; después se puede abrir sin red y actualizar cuando el banner
lo indique (nunca recarga a la fuerza). En iOS, instalala desde **Compartir →
Añadir a pantalla de inicio** y tocá la pantalla una vez para habilitar el audio.

## MIDI y navegadores

Web MIDI está disponible en Chrome, Edge y navegadores basados en Chromium.
Firefox y Safari pueden no ofrecerlo: en ese caso la app muestra un aviso y todo
sigue funcionando con autoevaluación manual. El permiso se pide solo al conectar
un dispositivo. Se normalizan mensajes de note on/off, canales y mensajes de
sistema/tiempo real; hay perfiles para dispositivos comunes como Yamaha PSR-373.

## Límites sin profesor

La app corrige notas, tempo y uniformidad, y propone repaso, pero **no sustituye
a un docente**: no evalúa postura, relajación, sonido ni musicalidad con la
fineza de un oído humano, y las correcciones MIDI dependen de la latencia y del
dispositivo. Ante dolor, tensión persistente o dudas de técnica, consultá a un
profesor. El contenido es pedagógico y original; las fuentes están documentadas
en `docs/LICENCIAS.md` y `THIRD_PARTY_LICENSES.md`.

## Accesibilidad

La suite incluye axe en las rutas principales, pruebas de teclado y cálculo de
contraste. Las partituras exponen un resumen textual por mano y el reproductor
anuncia manos, compases y tempo. Si encontrás una barrera, abrí un issue con la
ruta y el navegador usado.

## Contribuir

Antes de cambiar código, leé `docs/GUIA-CAMBIOS.md` y seguí el protocolo de
`docs/CHECKLIST.md`: una tarea, criterios de aceptación y verificación en verde.
Los cambios deben dejar `npm run estado` verde y actualizar `docs/LOG.md` y el
punto de reanudación. Para contenido nuevo, respetá el esquema de licencias y
añadí la fuente.

## Publicar en GitHub Pages

El workflow `.github/workflows/deploy-pages.yml` verifica tipos y tests, construye
`dist/` con el `base` correcto y publica el artefacto. Se ejecuta al hacer push a
`main` o manualmente desde **Actions**.

Para activarlo la primera vez:

1. Crear el repositorio en GitHub y subir la rama `main`.
2. En el repositorio: **Settings → Pages → Build and deployment → Source:
   GitHub Actions**.
3. Si el workflow no se lanzó solo, abrir **Actions → Deploy a GitHub Pages →
   Run workflow**.
4. La URL publicada aparece en el entorno `github-pages` del deployment.

También se puede habilitar por API:

```bash
gh api -X POST repos/OWNER/REPO/pages -f build_type=workflow
```

GitHub Pages en repositorios privados requiere un plan que lo permita; en un
repositorio público no hace falta nada más.

## Documentación de continuidad

- `docs/GUIA-CAMBIOS.md`: cómo hacer cualquier cambio con checklist primero.
- `docs/CHECKLIST.md`: fuente única de verdad del avance.
- `docs/RESUME.md`: cómo retomar el trabajo desde cero.
- `docs/LOG.md`: bitácora cronológica.
- `docs/DECISIONES.md`: decisiones de arquitectura.
- `docs/ENTORNO.md`: versiones, licencias y assets.
- `docs/QA-NAVEGADORES.md`: matriz de QA en navegadores (F6-027).
- `docs/LICENCIAS.md`: verificación de dominio público y fuentes del repertorio.
- `docs/ESTADO.md`: generado por `npm run estado`.
- `CHANGELOG.md`: cambios por fase.

## Estado del proyecto

Fases 0 a 6 cerradas (tags `fase-0` a `fase-6`, con releases en GitHub). La demo
está publicada en <https://wulflo.github.io/piano-learning/> y el smoke live
cubre rutas, repertorio, audio con muestras reales, export/import y offline. El
detalle verificado está en `docs/CHECKLIST.md`. Limitación conocida: la prueba
manual en iOS y Android (F6-028/F6-029) queda pendiente por falta de dispositivos
físicos.

## Licencias

- Código: MIT (`LICENSE`).
- Contenido propio: CC BY-SA 4.0 (`LICENSE-CONTENT`); ejercicios y piezas
  originales CC0.
- Terceros y muestras: `THIRD_PARTY_LICENSES.md`.
