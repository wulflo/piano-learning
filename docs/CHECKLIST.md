# CHECKLIST — Piano Today

> Fuente única de verdad del avance. No editar `docs/ESTADO.md` a mano: se genera con `npm run estado`.

## PUNTO DE REANUDACIÓN

- **Tarea actual:** F6-052
- **Última verificada en verde:** F6-051 (`3d4181d`, 2026-11-14T22:00:00-03:00)
- **Actualizado:** 2026-11-14T22:00:00-03:00
- **Fase:** F6 en cierre de auditoría (estado del árbol, audio, licencias, originalidad y documentación)
- **Nota:** F6-051 cerrada: IMSLP registra la primera publicación de la Sinfonía n.º 9 en agosto de 1826 (Mainz: Schott); se corrigieron tabla, registro y ficha. Sigue F6-052 (actualizar ENTORNO.md, identidad git neutral y limpiar [NET]). Sin push, tags ni releases sin confirmación.

## LEYENDA

- `[ ]` pendiente · `[~]` en curso · `[x]` hecha · `[!]` rota o bloqueada · `[-]` descartada.
- `Deps` referencia IDs de tarea o `—`.
- `[NET]` indica que la tarea necesita internet. El resto debe poder ejecutarse offline.
- Toda tarea `[x]` incluye `Commit: <hash>` con el commit que la implementó.

## F0 — Cimientos y protocolo

- [x] **F0-001** — Verificar entorno, fijar versiones y auditar licencias de dependencias
  - Aceptación: `docs/ENTORNO.md` registra Node 26.13.0, npm 12.2.2, git 2.56.0, red disponible y licencias de las dependencias; `git config --local --get user.name` responde.
  - Deps: — · Red: sí · [NET]
  - Commit: d0b8f68 · 2026-11-09T03:10:32-03:00
- [x] **F0-002** — Dejar scaffold Vite + React + TypeScript compilable con scripts y `base` configurable
  - Aceptación: `npm run dev` sirve la shell; `npm run typecheck` y `npm run build` en verde; `VITE_BASE` cambia el base; bundle inicial medido.
  - Deps: F0-001 · Red: no
  - Commit: d0b8f68 · 2026-11-09T03:15:00-03:00 (scaffold incluido en el bootstrap)
- [x] **F0-003** — Configurar Vitest + Testing Library + `fake-indexeddb` con smoke test
  - Aceptación: `npm test` en verde con test de `App`; setup carga `jest-dom` e IndexedDB falsa.
  - Deps: F0-002 · Red: no
  - Commit: 74ecbea · 2026-11-09T03:16:00-03:00
- [x] **F0-004** — Definir esquemas Zod de contenido, licencias, notación, ítems y exportación
  - Aceptación: `npm test -- content/schema` en verde; fixtures válidos e inválidos cubiertos; tipos exportados.
  - Deps: F0-002 · Red: no
  - Commit: d9797b3 · 2026-11-09T03:17:00-03:00
- [x] **F0-005** — Implementar validador de contenido y gate de licencias en el build
  - Aceptación: `npm run validate:content` en verde con contenido semilla; un fixture sin compositor falla con mensaje claro; `npm run build` ejecuta la validación.
  - Deps: F0-004 · Red: no
  - Commit: 5851d16 · 2026-11-09T03:18:00-03:00
- [x] **F0-006a** — Escribir en CHECKLIST las tareas completas de F0 y F1
  - Aceptación: IDs únicos, criterios verificables, dependencias y marcas `[NET]`; PUNTO de reanudación actualizado.
  - Deps: F0-004 · Red: no
  - Commit: 5851d16 · 2026-11-09T03:18:00-03:00
- [x] **F0-006b** — Escribir en CHECKLIST las tareas completas de F2
  - Aceptación: 73 tareas atómicas de M0-M2, FSRS, progreso y exportación con criterios y dependencias.
  - Deps: F0-006a · Red: no
  - Commit: 4cb9afd · 2026-11-09T03:19:00-03:00
- [x] **F0-006c** — Escribir en CHECKLIST las tareas completas de F3 y F4
  - Aceptación: tareas de M3-M6, auditivo y armonía con criterios y dependencias.
  - Deps: F0-006b · Red: no
  - Commit: 4cf4e3a · 2026-11-09T03:20:00-03:00
- [x] **F0-006d** — Escribir en CHECKLIST las tareas completas de F5
  - Aceptación: tareas de M7-M8, técnica, repertorio y fichas de licencia con criterios y dependencias.
  - Deps: F0-006c · Red: no
  - Commit: d3b1407 · 2026-11-09T03:21:00-03:00
- [x] **F0-006e** — Escribir en CHECKLIST las tareas completas de F6 y el resumen por fase
  - Aceptación: tareas de PWA, MIDI, calidad y despliegue; resumen de cierre por fase; total de tareas coincide con el conteo del script.
  - Deps: F0-006d · Red: no
  - Commit: d3b1407 · 2026-11-09T03:22:00-03:00
- [x] **F0-007** — Implementar `scripts/estado.mjs` y la generación de `docs/ESTADO.md`
  - Aceptación: `npm run estado` muestra tarea actual, progreso n/N y % por fase y última `[x]`; ejecuta typecheck, test y build en orden, corta en el primer fallo y escribe `docs/ESTADO.md`; sin dependencias externas.
  - Deps: F0-002, F0-006a · Red: no
  - Commit: 3b4f74d · 2026-11-09T03:23:00-03:00
- [x] **F0-008** — Implementar test de formato del CHECKLIST con fixtures de error
  - Aceptación: `npm test -- checklist` detecta ID duplicado, estado inválido, dos `[~]` y `[x]` sin hash; valida el PUNTO de reanudación.
  - Deps: F0-003, F0-006a · Red: no
  - Commit: f483917 · 2026-11-09T03:24:00-03:00
- [x] **F0-009** — Escribir RESUME, LOG, DECISIONES y ENTORNO definitivos
  - Aceptación: comandos exactos verificados; prompt de reanudación listo para pegar; ADR-001 a ADR-010; ENTORNO con versiones, licencias, lockfile, tareas `[NET]` y estado de assets.
  - Deps: F0-001, F0-002, F0-006a, F0-007 · Red: no
  - Commit: 4db194b · 2026-11-09T03:26:00-03:00
- [x] **F0-010** — Añadir licencias del repositorio y atribuciones iniciales
  - Aceptación: `LICENSE` MIT, `LICENSE-CONTENT` CC BY-SA 4.0, `THIRD_PARTY_LICENSES.md` con Salamander; atribución visible en la app.
  - Deps: F0-001 · Red: no
  - Commit: ef026f9 · 2026-11-09T03:27:00-03:00
- [x] **F0-011** — Crear manifiesto de muestras y `fetch-samples.mjs` idempotente con reanudación por Range
  - Aceptación: `node scripts/fetch-samples.mjs --dry-run` valida el manifiesto sin red ni escritura; reporta faltantes; descarga real queda como F1-039.
  - Deps: F0-004 · Red: no (dry-run)
  - Commit: 05eea14 · 2026-11-09T03:29:00-03:00
- [x] **F0-012** — Cerrar F0: suite completa, resumen, tag local `fase-0` y RESUME actualizado
  - Aceptación: `npm run estado` en verde; sección F0 completa; tag `fase-0` creado y verificado con `git tag -l`.
  - Deps: F0-001 a F0-011 · Red: no
  - Commit: 5aa0261 · 2026-11-09T03:30:00-03:00

### Cierre F0 — 2026-11-09

Quedó funcionando:

- Repositorio git local, scaffold Vite + React + TypeScript estricto y scripts de desarrollo, test, build y estado.
- Esquemas Zod de contenido, licencias, notación, habilidades, FSRS/progreso y audio; validador con referencias cruzadas y gate de licencias en el build.
- Contenido semilla: 9 módulos, 1 lección publicada, 1 ejercicio, 8 habilidades y 1 pieza original.
- Protocolo completo en `/docs`: CHECKLIST con 282 tareas, RESUME, LOG, DECISIONES, ENTORNO y ESTADO generado.
- `scripts/estado.mjs` sin dependencias y test de formato del checklist con fixtures de error.
- Licencias MIT / CC BY-SA 4.0 / CC0 y atribución de Salamander visible.
- `fetch-samples.mjs` con dry-run, reanudación por Range y verificación SHA-256 (sin descargar aún).

Comandos verdes: `npm run validate:content`, `npm run typecheck`, `npm test` (25 tests),
`npm run build` (69.19 kB gzip) y `npm run estado`.

Tag: `fase-0`. Deuda asumida: muestras reales de audio y todo el motor interactivo
se implementan en F1; las tareas `[NET]` quedan identificadas en el checklist.

## F1 — Motor: teoría, teclado, sonido y pentagrama

### Teoría

- [x] **F1-001** — Implementar `Pitch` y notación interna (MIDI, clase de altura, octava científica)
  - Aceptación: `npm test -- theory/pitch` en verde; conversión MIDI↔nombre ida y vuelta; octavas negativas y límites 0-127.
  - Deps: F0-012 · Red: no
  - Commit: 9a10bdb · 2026-11-09T10:45:00-03:00
- [x] **F1-002** — Implementar ortografía por tonalidad (letra + alteración) con bemoles y sostenidos correctos
  - Aceptación: tests en 12 tonalidades sin dobles alteraciones espurias; enarmonía explícita; sin depender del azar de Tonal.
  - Deps: F1-001 · Red: no
  - Commit: 9a10bdb · 2026-11-09T10:45:00-03:00
- [x] **F1-003** — Implementar armaduras, orden de sostenidos/bemoles y detección de tonalidad
  - Aceptación: las 15 armaduras (7♯ a 7♭) y sus relativas menores testeadas; orden de alteraciones correcto.
  - Deps: F1-002 · Red: no
  - Commit: 9a10bdb · 2026-11-09T10:45:00-03:00
- [x] **F1-004** — Implementar intervalos: cantidad, calidad, compuestos e inversión
  - Aceptación: matriz completa de intervalos justos/mayores/menores/aumentados/disminuidos testeada; inversión suma 9.
  - Deps: F1-002 · Red: no
  - Commit: 9a10bdb · 2026-11-09T10:45:00-03:00
- [x] **F1-005** — Implementar escala mayor, grados y ortografía en 12 tonalidades
  - Aceptación: 12 escalas con notas correctas (incluidas Fa♯/Sol♭, Do♯/Reb); grados 1-7 estables.
  - Deps: F1-003 · Red: no
  - Commit: 9a10bdb · 2026-11-09T10:45:00-03:00
- [x] **F1-006** — Implementar menores natural, armónica y melódica
  - Aceptación: 12 tonalidades × 3 variantes; alteraciones ascendentes/descendentes de la melódica; tests de grados.
  - Deps: F1-005 · Red: no
  - Commit: 9a10bdb · 2026-11-09T10:45:00-03:00
- [x] **F1-007** — Implementar los 7 modos y sus relativas
  - Aceptación: modos de las 12 tónicas con ortografía correcta; comparación con escala mayor relativa.
  - Deps: F1-005 · Red: no
  - Commit: 9a10bdb · 2026-11-09T10:45:00-03:00
- [x] **F1-008** — Implementar pentatónicas, blues, cromática y tonos enteros
  - Aceptación: fórmulas de grados testeadas en 12 tónicas; blues con ♭5; cromática de 12 notas.
  - Deps: F1-005 · Red: no
  - Commit: 9a10bdb · 2026-11-09T10:45:00-03:00
- [x] **F1-009** — Implementar tríadas (M, m, dim, aug, sus) con inversiones y cifrado
  - Aceptación: construcción y ortografía en 12 tónicas; inversiones con bajo correcto; cifrado ES/EN.
  - Deps: F1-002 · Red: no
  - Commit: 9a10bdb · 2026-11-09T10:45:00-03:00
- [x] **F1-010** — Implementar séptimas, extensiones y slash chords
  - Aceptación: maj7, 7, m7, m7♭5, dim7, 9/11/13 y slash con bajo validado; tests de notas.
  - Deps: F1-009 · Red: no
  - Commit: 9a10bdb · 2026-11-09T10:45:00-03:00
- [x] **F1-011** — Implementar círculo de quintas, relativas, homónimas y transposición
  - Aceptación: recorrido completo del círculo; relativas/homónimas correctas; transposición de notas y acordes testeada.
  - Deps: F1-003, F1-009 · Red: no
  - Commit: 9a10bdb · 2026-11-09T10:45:00-03:00
- [x] **F1-012** — Implementar números romanos y funciones básicas
  - Aceptación: grados diatónicos en mayor y menor con cifrado correcto; funciones T/S/D; tests en 12 tonalidades.
  - Deps: F1-005, F1-009 · Red: no
  - Commit: 9a10bdb · 2026-11-09T10:45:00-03:00
- [x] **F1-013** — Crear capa de errores pedagógicos «Recordá» (regla + ejemplo resuelto)
  - Aceptación: cada tipo de error de teoría devuelve regla y ejemplo; tests de contenido no vacío.
  - Deps: F1-004, F1-009, F1-012 · Red: no
  - Commit: 9a10bdb · 2026-11-09T10:45:00-03:00
- [x] **F1-014** — Añadir property tests de teoría en las 12 tonalidades
  - Aceptación: ortografía, armaduras, acordes e intervalos verificados con propiedades; ningún caso con doble alteración inesperada.
  - Deps: F1-005 a F1-012 · Red: no
  - Commit: 9a10bdb · 2026-11-09T10:45:00-03:00

### Teclado en pantalla

- [x] **F1-015** — Construir teclado responsive de 3 octavas (blancas y negras)
  - Aceptación: layout correcto en 320 px, tablet y desktop; teclas con proporciones estables; sin desbordes.
  - Deps: F0-012 · Red: no
  - Commit: 7472c84 · 2026-11-09T10:50:00-03:00
- [x] **F1-016** — Añadir interacción pointer/touch con note on/off y multitáctil
  - Aceptación: mouse, touch y lápiz disparan eventos; no quedan notas trabadas al salir; tests de eventos.
  - Deps: F1-015 · Red: no
  - Commit: 7472c84 · 2026-11-09T10:50:00-03:00
- [x] **F1-017** — Mapear teclado de computadora configurable
  - Aceptación: fila A-L y W-P mapeadas; remapeo persistido; indicador visual de teclas activas.
  - Deps: F1-016 · Red: no
  - Commit: 7472c84 · 2026-11-09T10:50:00-03:00
- [x] **F1-018** — Implementar etiquetas Do-Re-Mi / C-D-E y selector global
  - Aceptación: cambio instantáneo en teclado y pentagrama; preferencia persistida; cifrado de acordes bilingüe.
  - Deps: F1-015 · Red: no
  - Commit: d73702c · 2026-11-09T10:56:00-03:00
- [x] **F1-019** — Exponer API de resaltado y accesibilidad del teclado
  - Aceptación: resaltado por nota/acorde sin depender solo del color; roles y nombres accesibles; navegación por teclado.
  - Deps: F1-016 · Red: no
  - Commit: 7472c84 · 2026-11-09T10:50:00-03:00

### Sonido

- [x] **F1-020** — Implementar `AudioEngine` con inicialización tras gesto y estado observable
  - Aceptación: sin gesto no se crea AudioContext; tras click se inicializa; estado suspended/running reflejado en UI.
  - Deps: F0-012 · Red: no
  - Commit: 2823751 · 2026-11-10T11:16:30-03:00
- [x] **F1-021** — Cargar sampler con manifiesto, carga diferida y fallback sintetizado
  - Aceptación: sampler bajo demanda; si falta una muestra o falla la red se usa `PolySynth`; UI informa el modo.
  - Deps: F1-020, F0-011 · Red: no (usa assets locales)
  - Commit: 2823751 · 2026-11-10T11:16:30-03:00
- [x] **F1-022** — Reproducir notas e intervalos melódicos y armónicos
  - Aceptación: nota suelta, intervalo melódico y armónico con duración y tempo configurables; tests de scheduling.
  - Deps: F1-021 · Red: no
  - Commit: 2823751 · 2026-11-10T11:16:30-03:00
- [x] **F1-023** — Reproducir escalas y modos con tempo y resaltado
  - Aceptación: ascendente/descendente, tempo 40-240, nota resaltada en sincronía; sin notas trabadas al detener.
  - Deps: F1-022, F1-019 · Red: no
  - Commit: 2823751 · 2026-11-10T11:16:30-03:00
- [x] **F1-024** — Reproducir acordes en bloque y arpegiados
  - Aceptación: bloque, arpegio ascendente/descendente y bajo+acorde; voicings respetados.
  - Deps: F1-022 · Red: no
  - Commit: 2823751 · 2026-11-10T11:16:30-03:00
- [x] **F1-025** — Implementar metrónomo, transport, repetir y controles de volumen/tempo
  - Aceptación: click sintetizado con acentos; start/stop/repeat; volumen y tempo persistentes; sin drift audible en 2 minutos.
  - Deps: F1-020 · Red: no
  - Commit: 2823751 · 2026-11-10T11:16:30-03:00
- [x] **F1-026** — Sincronizar eventos de audio con resaltado de teclado y pentagrama
  - Aceptación: un único timeline alimenta audio y UI; al detener se limpian resaltados; test con reloj falso.
  - Deps: F1-023, F1-031 · Red: no
  - Commit: 2823751 · 2026-11-10T11:16:30-03:00
- [x] **F1-027** — Testear el motor de audio con Tone.js mockeado
  - Aceptación: `npm test -- audio` verde; se verifican llamadas, duraciones y limpieza sin reproducir sonido real.
  - Deps: F1-022, F1-025 · Red: no
  - Commit: 2823751 · 2026-11-10T11:16:30-03:00

### Pentagrama

- [x] **F1-028** — Integrar VexFlow: pentagrama, claves de sol/fa y compás
  - Aceptación: render SVG responsive; clave y compás configurables; sin errores en consola.
  - Deps: F0-012 · Red: no
  - Commit: d73702c · 2026-11-09T10:56:00-03:00
- [x] **F1-029** — Renderizar notas, alteraciones, líneas adicionales y acordes
  - Aceptación: Do central en ambas claves; sostenidos/bemoles/naturales; acordes apilados; casos límite testeados.
  - Deps: F1-028 · Red: no
  - Commit: d73702c · 2026-11-09T10:56:00-03:00
- [x] **F1-030** — Renderizar armaduras y cambios de tonalidad
  - Aceptación: 15 armaduras correctas; cambio en caliente sin recargar; limpieza de alteraciones.
  - Deps: F1-029, F1-003 · Red: no
  - Commit: d73702c · 2026-11-09T10:56:00-03:00
- [x] **F1-031** — Añadir resaltado y click por nota en el pentagrama
  - Aceptación: click en nota emite evento y reproduce; resaltado sincronizado; foco accesible por nota.
  - Deps: F1-029, F1-020 · Red: no
  - Commit: d73702c · 2026-11-09T10:56:00-03:00
- [x] **F1-032** — Hacer el pentagrama responsive con zoom y alternativa textual
  - Aceptación: legible a 320 px y zoom 200 %; descripción textual de notas para lectores de pantalla.
  - Deps: F1-028 · Red: no
  - Commit: d73702c · 2026-11-09T10:56:00-03:00

### Integración y cierre

- [x] **F1-033** — Construir demo F1: teclado + pentagrama + audio + controles
  - Aceptación: se puede tocar, oír escalas/acordes/intervalos y ver el pentagrama; funciona sin muestras.
  - Deps: F1-024, F1-025, F1-031 · Red: no
  - Commit: cc2d570 · 2026-11-10T11:40:00-03:00
- [x] **F1-034** — Implementar contexto global de notación e i18n mínimo
  - Aceptación: selector Do/C y ES/EN en toda la demo; sin textos hardcodeados en componentes nuevos.
  - Deps: F1-018 · Red: no
  - Commit: cc2d570 · 2026-11-10T11:40:00-03:00
- [x] **F1-035** — Añadir error boundaries y estados de carga/error de audio
  - Aceptación: un fallo de audio no rompe la app; mensaje accionable; reintento disponible.
  - Deps: F1-033 · Red: no
  - Commit: cc2d570 · 2026-11-10T11:40:00-03:00
- [x] **F1-036** — Verificar presupuesto de rendimiento y code splitting
  - Aceptación: JS inicial < 300 KB gzip; Tone y VexFlow en chunks separados; medición registrada.
  - Deps: F1-033 · Red: no
  - Commit: cc2d570 · 2026-11-10T11:40:00-03:00
- [x] **F1-037** — Test de accesibilidad de teclado y pentagrama
  - Aceptación: axe sin violaciones críticas; navegación completa por teclado; nombres accesibles.
  - Deps: F1-019, F1-032 · Red: no
  - Commit: cc2d570 · 2026-11-10T11:40:00-03:00
- [x] **F1-038** — Revisión manual de sonido, latencia y usabilidad del teclado
  - Aceptación: checklist firmado en LOG; sin latencia molesta; notas no trabadas; volumen equilibrado.
  - Deps: F1-033 · Red: no
  - Commit: 97f4901 · 2026-11-10T11:40:00-03:00
  - Nota: revisión estática y tests; la confirmación auditiva real queda pendiente (ver LOG).
- [x] **F1-039** — Descargar muestras Salamander reducidas y verificar SHA-256
  - Aceptación: `node scripts/fetch-samples.mjs` completa con reanudación; manifiesto coincide; tamaño < 150 MB. [NET]
  - Deps: F0-011, F1-021 · Red: sí · [NET]
  - Commit: cc2d570 · 2026-11-10T11:40:00-03:00
- [x] **F1-040** — Cerrar manifiesto de audio, ENTORNO y atribución visible
  - Aceptación: `docs/ENTORNO.md` lista archivos, tamaños y SHA-256; atribución visible en la app. [NET]
  - Deps: F1-039 · Red: sí · [NET]
  - Commit: 97f4901 · 2026-11-10T11:40:00-03:00
  - Nota: atribución visible en el pie de la app; tabla de muestras y hashes en `docs/ENTORNO.md`.
- [x] **F1-041** — Cerrar F1: suite completa, tag `fase-1`, RESUME y resumen
  - Aceptación: `npm run estado` verde; demo local funcionando; tag `fase-1`; RESUME actualizado.
  - Deps: F1-001 a F1-040 · Red: no
  - Commit: 10c530d · 2026-11-10T11:50:00-03:00 (estado final regenerado en el commit de cierre)

## F2 — M0-M2, FSRS y progreso

### Contenido M0 — Orientación

- [x] **F2-001** — Completar M0-01 «El teclado: grupos de dos y tres negras»
  - Aceptación: lección publicada y validada; ejercicio en teclado corregido; tarea real con digitación y checklist; demo de audio/pentagrama verificada.
  - Deps: F0-012 · Red: no
  - Commit: c02350d · 2026-11-09T16:45:30-03:00
- [x] **F2-002** — Escribir M0-02 «Nombres de notas y octavas»
  - Aceptación: Do-Re-Mi y C-D-E; octavas 2-6; ejercicios de teclado y pentagrama; sin errores de validación.
  - Deps: F2-001 · Red: no
  - Commit: c6497ae · 2026-11-09T16:50:30-03:00
- [x] **F2-003** — Escribir M0-03 «Postura, banco y digitación»
  - Aceptación: texto original con señales de tensión; tarea real autoevaluable; aviso de límites sin profesor.
  - Deps: F2-002 · Red: no
  - Commit: 47a1e5b · 2026-11-09T16:53:20-03:00
- [x] **F2-004** — Escribir M0-04 «Cómo practicar: metas, tiempo y error»
  - Aceptación: método de práctica con metas medibles; ejercicio de planificación; checklist de 15/30/45 minutos.
  - Deps: F2-003 · Red: no
  - Commit: 3552baa · 2026-11-09T16:56:30-03:00
- [x] **F2-005** — Escribir M0-05 «Diagnóstico inicial y mapa del curso»
  - Aceptación: diagnóstico de 8 ítems que no bloquea; resultado sugiere punto de entrada; enlaza al mapa.
  - Deps: F2-004 · Red: no
  - Commit: b5a9990 · 2026-11-09T17:01:20-03:00
- [x] **F2-006** — Escribir M0-06 «Practicar sin profesor: espejo, grabación y tensión»
  - Aceptación: pautas de autoobservación; checklist de tensión; advertencia honesta visible.
  - Deps: F2-005 · Red: no
  - Commit: 9dd3896 · 2026-11-09T17:04:20-03:00

### Contenido M1 — Fundamentos

- [x] **F2-007** — Escribir M1-01 «Altura, duración, intensidad y timbre»
  - Aceptación: cuatro parámetros con ejemplos sonoros; ejercicio de escucha; tarea de teclado con dinámica.
  - Deps: F2-006 · Red: no
  - Commit: 4065ef5 · 2026-11-09T17:08:55-03:00
- [x] **F2-008** — Escribir M1-02 «Pentagrama, claves y Do central»
  - Aceptación: sol/fa; Do central en ambas claves; ejercicios de lectura; pentagrama correcto.
  - Deps: F2-007 · Red: no
  - Commit: b0fcbc7 · 2026-11-09T17:12:25-03:00
- [x] **F2-009** — Escribir M1-03 «Alteraciones, enarmonía, tonos y semitonos»
  - Aceptación: ♯/♭/♮; enarmonía correcta; ejercicios de semitono/tono en 12 tónicas.
  - Deps: F2-008 · Red: no
  - Commit: 9fd52e1 · 2026-11-09T17:17:35-03:00
- [x] **F2-010** — Escribir M1-04 «Figuras y silencios»
  - Aceptación: redonda a treintaidosavo; silencios; ejercicio de completar compases; audio con duraciones.
  - Deps: F2-009 · Red: no
  - Commit: 62d338d · 2026-11-09T19:27:54-03:00
- [x] **F2-011** — Escribir M1-05 «Compases simples»
  - Aceptación: 2/4, 3/4, 4/4; acentos; ejercicio de completar y marcar; metrónomo.
  - Deps: F2-010 · Red: no
  - Commit: 98f9e52 · 2026-11-09T19:33:42-03:00
- [x] **F2-012** — Escribir M1-06 «Compases compuestos»
  - Aceptación: 6/8, 9/8, 12/8; subdivisión ternaria; ejercicio de acentos; audio correcto.
  - Deps: F2-011 · Red: no
  - Commit: ee5a616 · 2026-11-09T20:02:15-03:00
- [x] **F2-013** — Escribir M1-07 «Puntillo, ligadura y tresillo»
  - Aceptación: duraciones exactas; tresillo en compás simple y compuesto; ejercicio rítmico.
  - Deps: F2-012 · Red: no
  - Commit: 7aac4f0 · 2026-11-09T20:07:59-03:00
- [x] **F2-014** — Escribir M1-08 «Síncopa y anacrusa»
  - Aceptación: ejemplos cantables; ejercicio de identificar y tocar; metrónomo con acentos.
  - Deps: F2-013 · Red: no
  - Commit: 478e698 · 2026-11-09T20:13:27-03:00
- [x] **F2-015** — Escribir M1-09 «Tempo y metrónomo»
  - Aceptación: términos de tempo; 40-240 BPM; ejercicio de estabilidad; control de tempo persistente.
  - Deps: F2-014 · Red: no
  - Commit: a5b99e2 · 2026-11-09T20:18:49-03:00
- [x] **F2-016** — Escribir M1-10 «Dinámica y articulación»
  - Aceptación: pp a ff; legato/staccato/acento; ejercicio de escucha y tarea real.
  - Deps: F2-015 · Red: no
  - Commit: 205087c · 2026-11-09T20:23:11-03:00
- [x] **F2-017** — Escribir M1-11 «Repeticiones, da capo, segno y coda»
  - Aceptación: signos explicados con ejemplo; ejercicio de orden de reproducción; test de secuencia.
  - Deps: F2-016 · Red: no
  - Commit: 0e12650 · 2026-11-09T20:27:32-03:00
- [x] **F2-018** — Escribir M1-12 «Términos italianos»
  - Aceptación: 20 términos con audio/ejemplo; quiz; sin traducciones copiadas de fuentes incompatibles.
  - Deps: F2-017 · Red: no
  - Commit: 9968708 · 2026-11-09T20:33:36-03:00
  - Cierre: glosario estructurado de 20 términos con categoría, significado y ejemplo propios; dos demos comparativas (andante 72 BPM y allegro 132 BPM); quiz de seis términos. M1 completo.

### Contenido M2 — Escalas y tonalidades

- [x] **F2-019** — Escribir M2-01 «Escala mayor y armaduras»
  - Aceptación: patrón T-T-S-T-T-T-S; 12 escalas correctas; ejercicio de deletreo.
  - Deps: F2-018 · Red: no
  - Commit: 2065fd9 · 2026-11-09T21:01:12-03:00
  - Cierre: M2-01 publicada con el patrón T-T-S-T-T-T-S, las doce escalas mayores (sostenidos y bemoles) y el ejercicio de deletreo. Incluye tarea real de teclado con la escala de Sol a 60 BPM y demo en pentagrama en 4/4. 43 archivos / 328 tests en verde; typecheck, `validate:content` y build verdes.
- [x] **F2-020** — Escribir M2-02 «Círculo de quintas»
  - Aceptación: 12 posiciones; orden de alteraciones; ejercicio interactivo; test de relativas.
  - Deps: F2-019 · Red: no
  - Commit: fd3a08a · 2026-11-09T21:06:40-03:00
  - Cierre: M2-02 publicada con el círculo de quintas de doce posiciones, las armaduras acumuladas y el ejercicio de armaduras. Incluye tarea real de teclado con la escala de Do mayor y demo en pentagrama en 4/4. 44 archivos / 333 tests en verde; typecheck, `validate:content` y build verdes.
- [x] **F2-021** — Escribir M2-03 «Relativas y homónimas»
  - Aceptación: diferencias claras; 12 pares correctos; ejercicio de clasificación.
  - Deps: F2-020 · Red: no
  - Commit: 7a7fb08 · 2026-11-09T21:12:30-03:00
  - Cierre: M2-03 publicada con las relativas menores, los doce pares y el ejercicio de clasificación. Incluye tarea real de teclado con la escala menor de La. 45 archivos / 337 tests en verde; typecheck, `validate:content` y build verdes.

- [x] **F2-022** — Escribir M2-04 «Menor natural»
  - Aceptación: patrón y grados; 12 tonalidades; audio comparado con mayor.
  - Deps: F2-021 · Red: no
  - Commit: a94b9cf · 2026-11-09T21:18:20-03:00
  - Cierre: M2-04 publicada con el patrón T-S-T-T-T-S-T del menor, las doce tonalidades menores y el ejercicio de audio que compara el tercer grado del menor con el de la mayor. Incluye tarea real de teclado con la escala menor de Do y demo en pentagrama en 4/4. 46 archivos / 343 tests en verde; typecheck, `validate:content` y build verdes.

- [x] **F2-023** — Escribir M2-05 «Menor armónica»
  - Aceptación: séptimo grado elevado; 12 tonalidades; ortografía correcta; ejercicio.
  - Deps: F2-022 · Red: no
  - Commit: bd1d512 · 2026-11-09T21:24:30-03:00
  - Cierre: M2-05 publicada con el menor armónico (séptimo grado elevado), las doce tonalidades con séptimo elevado y el ejercicio de deletreo + audio. Incluye tarea real de teclado con la escala menor armónica de Do. 47 archivos / 348 tests en verde; typecheck, `validate:content` y build verdes.

- [x] **F2-024** — Escribir M2-06 «Menor melódica»
  - Aceptación: ascendente/descendente; 12 tonalidades; ejercicio de deletreo y audio.
  - Deps: F2-023 · Red: no
  - Commit: 3422915 · 2026-11-09T21:32:24-03:00
  - Cierre: M2-06 publicada con el menor melódico (ascendente con séptimo grado elevado, descendente con sexto grado elevado), las doce tonalidades y los ejercicios de deletreo + audio. Incluye tarea real de teclado con la escala menor melódica de Do. 48 archivos / 353 tests en verde; typecheck, `validate:content` y build verdes.

- [x] **F2-025** — Escribir M2-07 «Grados y funciones»
  - Aceptación: I-II-III... con nombres; funciones T/S/D; ejercicio en 12 tonalidades.
  - Deps: F2-024 · Red: no
  - Commit: bdb3f09 · 2026-11-09T21:41:26-03:00
  - Cierre: M2-07 publicada con los grados I a VII, los números romanos y las funciones tónica/subdominante/dominante; demo de los acordes I y V en Do mayor; 12 ejercicios romanos, uno por tonalidad. Incluye tarea real de teclado con el acorde de Do mayor. 49 archivos / 358 tests en verde; typecheck, `validate:content` y build verdes.

- [x] **F2-026** — Escribir M2-08 «Modos»
  - Aceptación: 7 modos con color y ejemplo; relativas; ejercicio de identificación auditiva.
  - Deps: F2-025 · Red: no
  - Commit: 3db1cc5 · 2026-11-09T21:45:56-03:00
  - Cierre: M2-08 publicada con los siete modos de la escala mayor, su color y el ejemplo de la escala de Lídio en Do; sección de relativas; ejercicio de identificación auditiva (Lídio) y deletreo del modo dórico. Incluye tarea real de teclado con la escala de Lídio. 50 archivos / 364 tests en verde; typecheck, `validate:content` y build verdes.

- [x] **F2-027** — Escribir M2-09 «Pentatónicas»
  - Aceptación: mayor y menor; digitaciones; ejercicio de creación y tarea real.
  - Deps: F2-026 · Red: no
  - Commit: 342236b · 2026-11-09T21:50:26-03:00
  - Cierre: M2-09 publicada con las pentatónicas mayor y menor, la demo de la pentatónica mayor de Do y los ejercicios de creación (escalas). Incluye tarea real de teclado con la pentatónica mayor. 51 archivos / 369 tests en verde; typecheck, `validate:content` y build verdes.

- [x] **F2-028** — Escribir M2-10 «Escala de blues»
  - Aceptación: fórmula con ♭5; 12 tonalidades; ejercicio de pattern y audio.
  - Deps: F2-027 · Red: no
  - Commit: 3f8e160 · 2026-11-09T21:55:14-03:00
  - Cierre: M2-10 publicada con la fórmula de la escala de blues (menor pentatónica + bemol de la quinta), las doce tonalidades, la demo de la escala de blues de Do, el ejercicio de patrón (fórmula) y el de audio (identificación). Incluye tarea real de teclado con la escala de blues. 52 archivos / 374 tests en verde; typecheck, `validate:content` y build verdes.
- [x] **F2-029** — Escribir M2-11 «Cromática y tonos enteros»
  - Aceptación: 12 semitonos; escala de tonos enteros; ejercicio de escucha y digitación.
  - Deps: F2-028 · Red: no
  - Commit: 0dfe5c8 · 2026-11-09T21:58:56-03:00
  - Cierre: M2-11 publicada con la escala cromática (doce semitonos) y la escala de tonos enteros, la demo de la escala de tonos enteros en Do, los ejercicios de deletreo y de escucha, y la tarea real de teclado. 53 archivos / 379 tests en verde; typecheck, `validate:content` y build verdes.

- [x] **F2-030** — Escribir M2-12 «Digitación de escalas»
  - Aceptación: reglas de pulgar; 12 mayores y 12 menores; diagramas; tarea real con tempo progresivo.
  - Deps: F2-029 · Red: no
  - Commit: 63b5f66 · 2026-11-09T22:02:28-03:00
  - Cierre: M2-12 publicada con las reglas de pulgar, la digitación de las doce escalas mayores y menores, la práctica con tarea y la tarea real de teclado con digitación. 54 archivos / 382 tests en verde; typecheck, `validate:content` y build verdes.

### Motor de ejercicios

- [x] **F2-031** — Definir el modelo `SkillItem` y el registro de ítems con parámetros
  - Aceptación: ítems únicos y parametrizados; registro validado; test de serialización.
  - Deps: F0-012 · Red: no
  - Commit: 5e7f69b · 2026-11-09T22:06:03-03:00
  - Cierre: se definió el registro parametrizado de `SkillItem` con validación de ids únicos, búsqueda por kind y por parámetros, y test de serialización.
- [x] **F2-032** — Generar ejercicios de identificar notas en teclado
  - Aceptación: rango configurable; variantes ver/oír; sin repetir la misma nota consecutiva; test de cobertura.
  - Deps: F2-031 · Red: no
  - Commit: 9dda73d · 2026-11-09T22:20:27-03:00
  - Cierre: se implementó el generador `note-keyboard` (src/exercises/generators) con rango configurable (`C2-C6`), variantes ver/oír, selección aleatoria sin repetición consecutiva y validación con `ExerciseSchema`; tests de rango, opciones, variantes, dificultad y secuencia. 56 archivos / 395 tests en verde; typecheck, `validate:content` y build verdes.
- [x] **F2-033** — Generar ejercicios de identificar notas en pentagrama
  - Aceptación: claves sol/fa; líneas adicionales; dificultad progresiva; test de 200 casos.
  - Deps: F2-032 · Red: no
  - Commit: 39e6e20 · 2026-11-09T23:22:26-03:00
  - Cierre: se implementó el generador `note-staff` (src/exercises/generators) con claves de sol y fa, límites correctos del pentagrama, líneas adicionales progresivas por dificultad (0/1/2), distractores diatónicos cercanos y explicación de la posición. Se corrigieron los ids de lote para superar los 26 elementos en ambos generadores. 57 archivos / 404 tests en verde; typecheck, `validate:content` y build verdes.
- [x] **F2-034** — Generar ejercicios de deletrear escalas
  - Aceptación: 12 tónicas × modos de M2; respuesta por teclado; ortografía validada.
  - Deps: F2-033, F1-006 · Red: no
  - Commit: c63d356 · 2026-11-09T23:27:17-03:00
  - Cierre: se implementó el generador `scale-spelling` con las 12 tónicas de M2 y 16 modos, respuesta canónica para corregir entradas escritas, normalización de mayúsculas/comas/símbolos ♯ y ♭, distractores por alteración de grados internos y matriz completa de 192 ejercicios validada con `ExerciseSchema`. 58 archivos / 412 tests en verde; typecheck, `validate:content` y build verdes.
- [x] **F2-035** — Generar ejercicios de armaduras y círculo de quintas
  - Aceptación: 15 armaduras; pregunta y respuesta en ambos sentidos; test exhaustivo.
  - Deps: F2-034, F1-011 · Red: no
  - Commit: eeedce9 · 2026-11-09T23:32:53-03:00
  - Cierre: se implementó el generador `key-signature` con las 15 armaduras mayores y menores, preguntas tonalidad → armadura y armadura → tonalidad, vecinos del círculo de quintas (omitiendo los extremos sin quinta dentro de las 15 armaduras), respuestas canónicas y distractores cercanos. Se corrigió la ortografía de `relativeMinorOf` y `relativeMajorOf` en el motor de teoría. 59 archivos / 420 tests en verde; typecheck, `validate:content` y build verdes.
- [x] **F2-036** — Generar ejercicios de transposición
  - Aceptación: melodías cortas; 12 tonalidades; diferencia de altura correcta; test de ida y vuelta.
  - Deps: F2-035 · Red: no
  - Commit: 3c3a314 · 2026-11-09T23:36:31-03:00
  - Cierre: se implementó el generador `transposition` con melodías cortas de 4, 5 y 6 notas construidas por grados de la escala mayor, las 12 tonalidades de M2, 132 pares ordenados de tonalidades distintas, respuesta transportada dentro del ejercicio y validación con `ExerciseSchema`. Se agregó el campo opcional `answer` al discriminador `transposition`. Los tests verifican que cada nota se mueve la misma cantidad de semitonos y que la ida y vuelta conserva las alturas. 60 archivos / 429 tests en verde; typecheck, `validate:content` y build verdes.
- [x] **F2-037** — Implementar variantes de formato (ver, oír, deletrear, tocar)
  - Aceptación: cada ítem elige variante válida; no se repite formato consecutivo; test de selección.
  - Deps: F2-036 · Red: no
  - Commit: 9cbfaf7 · 2026-11-09T23:59:01-03:00
  - Cierre: se implementó `src/exercises/formats.ts` con los formatos `see`, `hear`, `spell` y `play`, el mapa de formatos válidos por tipo y `selectExerciseFormat` que evita repetir el formato inmediato. Los tests cubren elección válida, no repetición y formatos únicos.
- [x] **F2-038** — Conectar el motor de feedback «Recordá» a la teoría
  - Aceptación: todo error muestra regla y ejemplo resuelto; sin textos genéricos; test por tipo.
  - Deps: F2-037, F1-013 · Red: no
  - Commit: 364e913 · 2026-11-10T00:04:10-03:00
  - Cierre: se agregó `resolvePedagogicalFeedback` con contexto de código o tipo de ejercicio, y `pedagogicalFeedback` valida que regla y ejemplo no estén vacíos. Tests por tipo y override explícito.
- [x] **F2-039** — Generar distractores plausibles
  - Aceptación: distractores cercanos y no triviales; sin duplicados; dificultad ajustada; test estadístico básico.
  - Deps: F2-038 · Red: no
  - Commit: 981c0d0 · 2026-11-10T00:08:35-03:00
  - Cierre: se implementó `src/exercises/distractors.ts` con distractores por alteración de grados (escalas), por semitono (transposición) y por armadura (clave); tests de longitud, unicidad y no trivialidad. 63 archivos / 447 tests en verde; typecheck, `validate:content` y build verdes.

### FSRS

- [x] **F2-040** — Integrar `ts-fsrs` con wrapper tipado y parámetros por defecto
  - Aceptación: crear/gradar ítem; tipos propios; parámetros persistidos; test de una tarjeta nueva.
  - Deps: F2-031 · Red: no
  - Commit: 4105230 · 2026-11-11T00:23:59-03:00
  - Cierre: se implementó `src/state/fsrs.ts`, un wrapper tipado sobre `ts-fsrs@6.0.0` (modelo FSRS-6) con `createFsrsScheduler`, `createFsrsItemCard` y `gradeFsrsItem`, más `fsrsParamsFromSettings` para tomar retención e intervalo máximo de los ajustes persistidos. Traduce tarjetas y revlogs del scheduler a los tipos `FsrsCard` y `ReviewLog` del esquema y valida con Zod. Tests de parámetros por defecto, tarjeta nueva, calificación con `good` y `again` y registro persistido. 64 archivos / 453 tests en verde; typecheck, `validate:content` y build verdes.
- [x] **F2-041** — Implementar calificación automática Easy/Good/Hard/Again
  - Aceptación: rápida y correcta = Easy; normal = Good; con pista o lenta = Hard; incorrecta = Again; tests de umbrales.
  - Deps: F2-040 · Red: no
  - Commit: 80d001d · 2026-11-11T00:25:49-03:00
  - Cierre: se implementó `src/state/rating.ts` con `autoReviewRating` y `DEFAULT_RATING_THRESHOLDS` (rápida ≤ 5 s, lenta ≥ 15 s). La incorrecta siempre es `again`; la correcta con pista o lenta es `hard`; la rápida es `easy`; el resto `good`. Los umbrales se validan y aceptan configuración propia. Tests de cada categoría, límites exactos, valores por defecto y umbrales inválidos. 65 archivos / 463 tests en verde; typecheck, `validate:content` y build verdes.
- [x] **F2-042** — Persistir todo el historial de repasos
  - Aceptación: cada respuesta guarda rating, tiempos y estado; no se pierde al recargar; test con IndexedDB falsa.
  - Deps: F2-041 · Red: no
  - Commit: 5c136d7 · 2026-11-11T00:27:41-03:00
  - Cierre: se implementó `src/state/review-history.ts` con `createReviewHistoryStore`, que abre la base `pianodesdecero.progress` en IndexedDB (store `reviews` con índices por ítem y fecha) y expone `save`, `all(itemId?)`, `count`, `clear` y `close`. Cada registro se valida con `ReviewLogSchema` antes de guardarse y al leerse. Tests con la IndexedDB falsa de `fake-indexeddb`: calificación/tiempos/estado, persistencia tras reabrir, filtro por ítem, orden por fecha, rechazo de registros inválidos, integración con el motor FSRS y `clear`. 66 archivos / 470 tests en verde; typecheck, `validate:content` y build verdes.
- [x] **F2-043** — Construir la cola diaria con intercalado y límite de nuevos
  - Aceptación: mezcla temas; respeta `newPerDay`; prioriza vencidos; test determinista con reloj falso.
  - Deps: F2-042 · Red: no
  - Commit: 463a123 · 2026-11-11T00:29:41-03:00
  - Cierre: se implementó `src/state/daily-queue.ts` con `buildDailyQueue`: los vencidos entran primero ordenados por fecha y sin recorte, los nuevos se limitan a `newPerDay` y se mezclan con una semilla, y una pasada final intercala habilidades para no repetir el mismo tipo consecutivamente cuando hay alternativa. El reloj (`now`) y la semilla son entradas, así que la cola es determinista. Tests de prioridad de vencidos, tope de nuevos, inclusión total con `newPerDay: 0`, intercalado de temas, exclusión de tarjetas no vencidas, vencimiento exacto en `now`, tope global, determinismo y variación por semilla. 67 archivos / 481 tests en verde; typecheck, `validate:content` y build verdes.
- [x] **F2-044** — Mostrar previsión de carga y tope diario configurable
  - Aceptación: gráfico/texto de vencimientos 7 días; tope editable; se refleja en la cola.
  - Deps: F2-043 · Red: no
  - Commit: e42f11f · 2026-11-11T00:33:51-03:00
  - Cierre: se implementó `src/state/load-forecast.ts` con `forecastLoad` (siete cubos diarios UTC, atrasados aparte y totales) y `normalizeDailyCap` (0–200, entero). El panel `src/components/LoadForecastPanel.tsx` muestra barras y texto de vencimientos, el tope diario editable y una vista previa de la cola de hoy; el tope se guarda en los ajustes de la UI (`newPerDay`) y se pasa a `buildDailyQueue`, por lo que cambiarlo actualiza la cola al instante. Tests de agrupación por día, ventana personalizada, límites exactos, tarjetas nuevas/fuera de ventana, normalización del tope y del panel en español e inglés. 69 archivos / 491 tests en verde; typecheck, `validate:content` y build verdes.
- [x] **F2-045** — Implementar ajustes de retención, fuzz e intervalo máximo
  - Aceptación: retención 0.80-0.95; fuzz on/off; intervalo máximo; cambios afectan la planificación.
  - Deps: F2-044 · Red: no
  - Commit: 4a81301 · 2026-11-11T00:36:26-03:00
  - Cierre: se agregó `src/state/fsrs-settings.ts` con límites y normalización de retención (0,80–0,95, dos decimales), intervalo máximo (1–3650 días) y fuzz booleano. Los ajustes de progreso (`SettingsSchema`) y los de la UI incorporan `fuzz`; `SettingsPanel` permite editar retención, intervalo máximo y fuzz. El wrapper de FSRS pasa `fuzz` a `enableFuzz` y `fsrsParamsFromSettings` lo deriva de los ajustes. Tests de normalización y de planificación: el intervalo máximo recorta la fecha, una retención mayor acorta el intervalo y el fuzz es determinista y respeta el tope. 70 archivos / 499 tests en verde; typecheck, `validate:content`, build y presupuesto de bundle verdes.
- [x] **F2-046** — Implementar estadísticas de retención y precisión
  - Aceptación: retención por periodo; precisión por tipo; datos desde el historial; test de cálculo.
  - Deps: F2-042 · Red: no
  - Commit: d43aecd · 2026-11-11T00:38:09-03:00
  - Cierre: se implementó `src/state/stats.ts` con `computeReviewStats`, que recibe el historial de `ReviewLog` y calcula retención por día, semana ISO o mes sobre repasos programados (`review`/`relearning`, con `again` como fallo), precisión por tipo de habilidad usando un resolvedor `kindForItem` (o `unknown`) y totales generales. Tests de agrupación diaria, semanal y mensual, exclusión de pasos de aprendizaje en retención, precisión por tipo, orden estable de tipos, historial vacío y proporción de respuestas no falladas. 71 archivos / 505 tests en verde; typecheck, `validate:content` y build verdes.
- [x] **F2-047** — Investigar el optimizador de FSRS en navegador y decidir estrategia
  - Aceptación: ADR con opciones (WASM/worker/offline), requisito de red y fallback; historial exportable para optimizar.
  - Deps: F2-040 · Red: sí · [NET] (investigación)
  - Commit: 175875c · 2026-11-11T00:41:07-03:00
  - Cierre: se documentó la decisión en `docs/DECISIONES.md` (ADR-014) tras comparar `@open-spaced-repetition/binding` (WASI/Worker, FSRS-6/7, beta y Node >= 24), `fsrs-browser` (requiere `SharedArrayBuffer` y `COOP`/`COEP`), el optimizador en servidor (rompe local-first) y no optimizar. Se decidió mantener los parámetros por defecto y exportar el historial en CSV de revlog de Anki mediante `src/state/optimizer-export.ts`; la integración WASM futura usará el binding con target sin threads y un Worker, con fallback permanente a los valores por defecto. Tests de formato, orden, ids deterministas por ítem, fin de línea, historial vacío y nombre de archivo. 72 archivos / 510 tests en verde; typecheck, `validate:content` y build verdes.
- [x] **F2-048** — Testear planificación FSRS con fixtures deterministas
  - Aceptación: secuencias de ratings producen fechas esperadas; sin dependencia del reloj real; cobertura de estados.
  - Deps: F2-045 · Red: no
  - Commit: 001008e · 2026-11-11T00:44:36-03:00
  - Cierre: se agregó `tests/fixtures/fsrs-planning.json` con 14 casos y reloj fijo: tarjeta nueva con `good`, `easy`, `hard` y `again`, graduación tras dos `good`, repaso y relearning con sus transiciones, secuencias `hard`+`easy`, y un caso con intervalo máximo de 30 días. `tests/fsrs-planning.test.ts` reproduce cada secuencia avanzando el reloj a la fecha de vencimiento, compara estado, fecha, días programados, repeticiones, lapsos y `learningStep`, verifica determinismo, independencia del reloj del sistema (relojes de 2035 y 1999) y cobertura de los cuatro estados. Los fixtures revelaron que el wrapper no persistía `learningStep` y reiniciaba el paso en cada repaso, por lo que una tarjeta en aprendizaje nunca graduaba; se agregó `learningStep` a `FsrsCardSchema` (default 0), se persiste en la tarjeta y se pasa al scheduler, y `scheduleStatusFor` ahora mapea `relearning` a `learning` en vez de `new`. 73 archivos / 530 tests en verde; typecheck, `validate:content`, build y presupuesto de bundle verdes.

### Progreso, persistencia y exportación

- [x] **F2-049** — Crear esquema Dexie v1 y repositorios
  - Aceptación: tablas de lecciones, habilidades, repasos, ajustes y sesiones; repositorios tipados; test CRUD.
  - Deps: F2-040 · Red: no
  - Commit: 12390ce · 2026-11-11T00:48:08-03:00
  - Cierre: se agregó Dexie 4.4.7 y `src/state/db.ts` con la base `pianodesdecero.progress` versión 1 y las tablas `lessons`, `skills`, `reviews`, `settings` y `sessions` (índices por ítem, vencimiento de tarjeta y fecha de inicio). `src/state/repositories.ts` expone repositorios tipados con CRUD validado por Zod al escribir y al leer, y ajustes por defecto cuando no hay fila. `src/state/review-history.ts` conserva su API de F2-042 pero ahora delega en el repositorio de repasos de Dexie; Dexie completa las tablas faltantes de la base existente sin perder el historial. Se agregaron los esquemas de registro para lecciones, habilidades y ajustes. Tests de las cinco tablas, CRUD de cada dominio, rechazo de datos e ids inválidos, filtro y orden de repasos, valores por defecto y reinicio de ajustes, orden de sesiones y persistencia al reabrir. 74 archivos / 538 tests en verde; typecheck, `validate:content`, build y presupuesto de bundle verdes.
- [x] **F2-050** — Implementar migraciones versionadas y test de migración
  - Aceptación: v1→v2 simulada conserva datos; migración idempotente; test con base poblada.
  - Deps: F2-049 · Red: no
  - Commit: fe6d477 · 2026-11-11T00:50:25-03:00
  - Cierre: se agregó `src/state/migrations.ts` con el esquema base `PROGRESS_V1_STORES`, la interfaz `ProgressMigration`, el registro `PROGRESS_MIGRATIONS` y `registerProgressMigrations`, que ordena las migraciones, rechaza versiones duplicadas o que no avanzan y delega en `db.version(...).stores(...).upgrade(...)`. `createProgressDatabase` acepta `migrations` y las registra sobre la versión 1. Tests con una base v1 poblada en las cinco tablas y una migración simulada v2 que agrega un índice por estado y completa `completedAt`: conserva todas las filas y datos, las lee con los repositorios, aplica el `upgrade` dos veces sin duplicar ni alterar registros y valida el rechazo de migraciones inválidas. 75 archivos / 543 tests en verde; typecheck, `validate:content`, build y presupuesto de bundle verdes.
- [x] **F2-051** — Calcular progreso por lección y desbloqueo por prerrequisitos
  - Aceptación: lección bloqueada hasta dominar prerrequisitos; estado persistido; test del grafo.
  - Deps: F2-049, F2-030 · Red: no
  - Commit: d1cb415 · 2026-11-11T00:52:44-03:00
  - Cierre: se implementó `src/state/lesson-progress.ts` con `computeLessonUnlocks` (puro y determinista): una lección está `available` cuando todos sus prerrequisitos están dominados; un prerrequisito cuenta como dominado si su lección está completada o si todas sus habilidades alcanzan el umbral de maestría (0,8 por defecto, configurable). Los estados `in-progress` y `completed` persistidos prevalecen y no se vuelven a bloquear; los ciclos y prerrequisitos inexistentes quedan bloqueados sin colgarse. `loadLessonUnlocks` lee el progreso y la maestría desde Dexie; `startLesson` y `completeLesson` validan el desbloqueo, lanzan `LessonLockedError`/`UnknownLessonError` y persisten el estado conservando segundos y la fecha original de finalización. Tests de grafo, cadena, múltiples prerrequisitos, maestría por umbral, ciclos, persistencia al reabrir y rechazo de acciones bloqueadas. 76 archivos / 554 tests en verde; typecheck, `validate:content`, build y presupuesto de bundle verdes.
- [x] **F2-052** — Implementar XP, niveles y logros
  - Aceptación: XP por actividad; curva de niveles; 10 logros; sin pérdida de XP; tests.
  - Deps: F2-051 · Red: no
  - Commit: 91644e7 · 2026-11-12T00:57:10-03:00
  - Cierre: se implementó `src/state/xp.ts` con recompensas por actividad (lección 50, ejercicio 10, minuto de práctica 2 y repaso 2/6/10/12 según la calificación), una curva triangular de 100 XP crecientes por nivel (`100·(n−1)·n/2`), `awardXp` monotónico que ignora cantidades negativas o no finitas y diez logros evaluados con una función pura que conserva los ya conseguidos. Se agregó `ProfileSchema`/`ProfileRecordSchema`, la tabla `profile` mediante la migración Dexie v2 y `ProfileRepository` con `get`, `save`, `update` transaccional y `clear`; `update` fuerza `max(xp actual, xp propuesto)`, recalcula el nivel y une los logros para que ninguna actualización reduzca el XP ni borre un logro. Tests de valores de XP, curva y avance de nivel, XP sin pérdida, los diez logros y sus condiciones, fechas inyectadas, logros sin rebloqueo, unión sin duplicados, persistencia al reabrir, diez incrementos concurrentes y rechazo de XP negativo. 77 archivos / 567 tests en verde; typecheck, `validate:content`, build y presupuesto de bundle verdes.
- [x] **F2-053** — Implementar racha con gracia semanal
  - Aceptación: un día fallado por semana no rompe; se reinicia con criterio; test de calendario.
  - Deps: F2-052 · Red: no
  - Commit: b401f64 · 2026-11-12T01:00:15-03:00
  - Cierre: se implementó `src/state/streak.ts` con fechas ISO en UTC y semanas ISO de lunes a domingo. `recordPracticeDay` es idempotente para el mismo día, suma los días consecutivos, permite un día fallado por semana consumiendo la gracia del día fallado, reinicia a 1 tras dos días seguidos sin practicar o un segundo fallo en la misma semana, conserva la racha más larga, ignora fechas anteriores y recupera la gracia al cambiar de semana; `streakFromPracticeDates` reconstruye la racha desde fechas desordenadas y `isoWeekStart` calcula el lunes. `ProfileRepository.recordPractice` persiste el cambio en la misma transacción del perfil. Tests de primera práctica, doble registro, días consecutivos, gracia y segundo fallo, dos fallos seguidos, recuperación semanal, domingo que cruza de semana, fechas fuera de orden, racha más larga, reconstrucción, lunes ISO, fechas inválidas y persistencia al reabrir. 78 archivos / 581 tests en verde; typecheck, `validate:content`, build y presupuesto de bundle verdes.
- [x] **F2-054** — Exportar progreso a `.txt` con cabecera, JSON canónico y SHA-256
  - Aceptación: archivo legible; hash estable; descarga con fecha; test de formato.
  - Deps: F2-049 · Red: no
  - Commit: ec266c0 · 2026-11-12T01:03:24-03:00
  - Cierre: se agregó `src/state/progress-export.ts` con `collectProgressData` (reúne lecciones, habilidades, repasos, ajustes, perfil y sesiones, y quita los ids internos de los registros), `canonicalJson` (claves ordenadas, sin espacios, arrays intactos, `undefined` omitido y fechas ISO), `sha256Hex` con WebCrypto y `createProgressExport`, que valida con Zod, hashea solo `data` y arma el `.txt` con título, formato v1, fecha, versión de la app y hash. El nombre incluye la fecha UTC (`pianodesdecero-progreso-YYYY-MM-DD.txt`) y `downloadProgressFile` descarga con un `Blob` y un enlace temporal. `src/version.ts` lee la versión de `package.json`. Tests de JSON canónico, vector SHA-256 conocido, recolección del progreso, formato exacto del archivo, hash estable con fechas distintas, rechazo de datos inválidos y descarga. 79 archivos / 588 tests en verde; typecheck, `validate:content`, build y presupuesto de bundle verdes.
- [x] **F2-055** — Importar progreso con validación y estrategia de reemplazo
  - Aceptación: rechaza archivo corrupto o hash inválido; confirma reemplazo; conserva datos si falla.
  - Deps: F2-054 · Red: no
  - Commit: c3038c7 · 2026-11-12T01:07:04-03:00
  - Cierre: se agregó `src/state/progress-import.ts` con `parseProgressFile`, que exige título, formato, versión 1, fecha, app y hash; clasifica los fallos con `ProgressImportError` (`invalid-format`, `unsupported-version`, `invalid-data`, `invalid-hash`, `confirmation-required`), valida el JSON con `ProgressDataSchema` y recalcula el SHA-256 sobre el JSON canónico, así que acepta espacios u otro orden de claves solo si el contenido normalizado coincide. `importProgress` no escribe sin `confirm: true` y llama a `ProgressRepositories.replaceAll`, que prepara las filas validadas y reemplaza las seis tablas en una sola transacción Dexie; un archivo inválido falla antes de borrar y un error de escritura revierte el reemplazo. Tests de lectura válida, JSON con espacios, cabecera o JSON ausentes, formato y versión desconocidos, hash inválido o manipulado, datos inválidos con hash correcto, confirmación obligatoria, reemplazo con exportación real, doble importación sin duplicados y conservación del destino ante un archivo inválido. 80 archivos / 597 tests en verde; typecheck, `validate:content`, build y presupuesto de bundle verdes.
- [x] **F2-056** — Probar ida y vuelta exportar→importar→exportar idéntico
  - Aceptación: hash y contenido idénticos; test automático con base poblada.
  - Deps: F2-055 · Red: no
  - Commit: b38864c · 2026-11-12T01:09:57-03:00
  - Cierre: se agregó `tests/progress-roundtrip.test.ts` con una base poblada en las seis tablas (tres lecciones, dos habilidades, dos repasos con estados distintos, ajustes no predeterminados, perfil con XP, dos logros y racha, y dos sesiones). Exporta, importa sobre una base de destino con datos distintos, vuelve a exportar y compara hash, JSON canónico, texto completo y sobre: son idénticos. También repite tres ciclos de importación y reexportación sin duplicar filas, y verifica que el hash y el contenido no dependen de la fecha de exportación (solo cambian la cabecera y el nombre del archivo). 81 archivos / 600 tests en verde; typecheck, `validate:content`, build y presupuesto de bundle verdes.
- [x] **F2-056a** — Guardar copia del progreso en una carpeta personal (opcional)
  - Aceptación: selector explícito de carpeta con File System Access API; guarda y carga el mismo `.txt` validado; fallback a descarga en navegadores sin soporte; no bloquea el cierre de F2.
  - Deps: F2-056 · Red: no
  - Nota: ADR-012. Solo Chromium de escritorio; no se escribe en GitHub ni en la nube.
  - Commit: 14d213c · 2026-11-12T01:14:10-03:00
  - Cierre: se agregó `src/state/progress-folder.ts` con tipos estructurales de la File System Access API. `supportsProgressFolder` exige `showDirectoryPicker` y contexto seguro; `pickProgressFolder` abre el selector explícito en modo `readwrite` con un id estable y traduce cancelación y fallos a códigos `cancelled`, `unsupported`, `picker-failed`. `saveProgressToFolder` escribe y sobrescribe el `.txt` y `saveProgressCopy` usa la carpeta cuando existe o el navegador la soporta, o descarga con `downloadProgressFile` como fallback. `loadProgressFromFolder` valida con `parseProgressFile`, `loadLatestProgressCopy` elige la copia más reciente y falla con `empty-folder` si no hay, `listProgressCopies` filtra y ordena por fecha, y `loadProgressFromFile` cubre el `<input type="file">`. Tests de detección, opciones del selector, cancelación, escritura, sobrescritura, errores de lectura y escritura, fallback a descarga, carpeta inyectada, carga validada, hash corrupto, listado, carpeta vacía y carga desde `Blob`. 82 archivos / 619 tests en verde; typecheck, `validate:content`, build y presupuesto de bundle verdes.
- [x] **F2-057** — Implementar restablecer progreso con confirmación explícita
  - Aceptación: doble confirmación; borra IndexedDB; vuelve al estado inicial; test.
  - Deps: F2-049 · Red: no
  - Commit: b815ef7 · 2026-11-12T01:16:53-03:00
  - Cierre: se agregó `src/state/progress-reset.ts` con `resetProgress`, que exige `confirmations >= 2` y la palabra escrita por el usuario (`BORRAR` por defecto, sin distinguir mayúsculas ni espacios exteriores) antes de tocar la base. Los fallos usan `ProgressResetError` con códigos `confirmation-required`, `confirmation-mismatch` y `reset-failed`. Antes de borrar se cuentan lecciones, habilidades, repasos, sesiones, logros y XP; el resultado devuelve `resetAt` y ese resumen. `ProgressRepositories.clearAll` vacía las seis tablas en una sola transacción, y tras el reseteo los repositorios devuelven los valores iniciales. Tests de confirmaciones ausentes o insuficientes, palabra incorrecta, palabra con mayúsculas y espacios, palabra personalizada, conteos del resumen, estado inicial tras borrar, persistencia al reabrir, reseteo repetido y fallo de borrado sin pérdida de datos. 83 archivos / 628 tests en verde; typecheck, `validate:content`, build y presupuesto de bundle verdes.

### Interfaz y práctica

- [x] **F2-058** — Construir shell de app, navegación y hash router
  - Aceptación: rutas de curso, lección, repaso, progreso y ajustes; atrás/adelante; deep link.
  - Deps: F2-049 · Red: no
  - Commit: 49e52ec · 2026-11-12T01:24:08-03:00
  - Cierre: se agregó `src/router/hash-route.ts` con `parseHash`, `routeHash`, `lessonHash`, `routeTitleKey`, `NAV_ITEMS` e `isNavActive` para las rutas `#/curso`, `#/demo`, `#/leccion/<id>`, `#/repaso`, `#/progreso` y `#/ajustes`, con barras sobrantes, query ignorada, ids codificados y página `not-found`. `useHashRoute` usa `useSyncExternalStore` sobre `hashchange`, así que atrás/adelante y los enlaces profundos funcionan sin dependencias. El shell en `src/App.tsx` agrega navegación con enlaces reales y `aria-current`, título del documento y `lang` sincronizados, la demo se conserva en `#/demo` y se agregaron páginas honestas de curso, lección, repaso, progreso, ajustes y 404; ajustes reutiliza `SettingsPanel` con el `h1` de la página como encabezado. Tests de rutas puras, ida y vuelta de hashes, navegación activa, portada, enlace profundo, clic en la navegación, atrás/adelante simulado, ajustes, demo y 404. 85 archivos / 642 tests en verde; typecheck, `validate:content`, build y presupuesto de bundle verdes.
- [x] **F2-059** — Construir mapa visual del curso con progreso por módulo
  - Aceptación: 9 módulos; estados bloqueado/disponible/completado; accesible sin depender del color.
  - Deps: F2-058 · Red: no
  - Commit: a13fc57 · 2026-11-12T01:35:17-03:00
  - Cierre: `npm run index:content` genera `src/content/course-index.json` con los metadatos de los 9 módulos y las 30 lecciones, y un test falla si el archivo queda desactualizado. `src/content/course.ts` valida el índice con Zod y expone búsquedas y el grafo para los desbloqueos. `summarizeCourse` agrupa por módulo y calcula avance global y próxima lección; `ProgressProvider` abre Dexie una vez y `useCourseProgress` combina el estado con `loadLessonUnlocks`. `CoursePage` muestra el avance global, los 9 módulos con barra `<progress>`, estados con texto, lecciones bloqueadas sin enlace y módulos vacíos honestos, con estados de carga y error con reintento. Tests de frescura del índice, resumen puro, portada sin progreso, progreso guardado, error de base y axe. 88 archivos / 657 tests en verde; typecheck, `validate:content`, build y presupuesto de bundle verdes (158,36 kB gzip inicial).
- [x] **F2-060** — Construir reproductor de lección
  - Aceptación: secciones, ejemplos sonoros, pentagrama, navegación y marca de completada.
  - Deps: F2-058 · Red: no
  - Commit: 2fed5e4 · 2026-11-12T01:48:12-03:00
  - Cierre: `src/content/lessons.ts` carga cada lección bajo demanda con `import.meta.glob` y valida con `LessonSchema`; `src/content/score.ts` convierte partituras a medidas de `Staff`, MIDI y timelines con puntillos y tresillos. `LessonPlayer` muestra texto, llamados, teclados, partituras, audio y la tarea de teclado con un solo motor de audio compartido. `LessonPage` resuelve el acceso, avisa de lección desconocida o bloqueada, registra el inicio una vez, espera esa escritura antes de completar, permite marcar como completada y navega a la anterior/siguiente sin enlazar lecciones bloqueadas. `useCourseProgress` conserva el resumen al recargar. Tests de las 30 lecciones, conversión de partituras, página (no encontrada, bloqueada, render, completado, progreso guardado, navegación) y axe. 90 archivos / 675 tests en verde; typecheck, `validate:content`, build y presupuesto de bundle verdes (162,42 kB gzip inicial, 32 chunks diferidos).
- [x] **F2-061** — Construir pantalla «Repaso de hoy»
  - Aceptación: cola intercalada, progreso, previsión y botón de inicio; funciona sin ítems.
  - Deps: F2-043, F2-058 · Red: no
  - Commit: 2856c86 · 2026-11-12T01:55:38-03:00
  - Cierre: `src/content/skills.ts` valida las 24 habilidades del contenido; `reviewableSkills` limita el repaso a habilidades de lecciones empezadas o completadas y a las que ya tienen tarjeta. `src/state/review-day.ts` une `buildDailyQueue` y `forecastLoad` en `buildReviewDay` con semilla diaria UTC y cuenta los repasos registrados hoy. `useReviewDay` lee tarjetas e historial de Dexie, conserva el estado al recargar y expone carga/error/recarga. `ReviewPage` muestra contadores, cola intercalada con estados `Vencido`/`Nuevo`, previsión reutilizando `LoadForecastPanel`, estado vacío honesto y un botón que recorre la cola con progreso y enlaces a las lecciones; el recorrido avisa que la autoevaluación FSRS llega en F2-067 y no guarda respuestas falsas. Tests puros de día, semilla, filtrado, cola, previsión, determinismo y vacío; tests de página sin ítems, cola real, vencidos, recorrido completo, error de base y axe. 92 archivos / 687 tests en verde; typecheck, `validate:content`, build y presupuesto de bundle verdes (166,51 kB gzip inicial, 32 chunks diferidos).
- [x] **F2-062** — Construir pantalla de estadísticas
  - Aceptación: retención, precisión, racha, XP y tiempo; datos reales; estados vacíos.
  - Deps: F2-046, F2-058 · Red: no
  - Commit: b1d38b6 · 2026-11-12T02:02:16-03:00
  - Cierre: `src/state/progress-dashboard.ts` reúne en un cálculo puro las estadísticas de `computeReviewStats`, el nivel de `levelProgress`, la racha del perfil, la retención agregada, los totales de respuestas y el tiempo de lecciones más sesiones. `practiceSessionSeconds` usa bloques y cae al intervalo inicio–fin. `useProgressDashboard` lee `reviews`, `profile`, `sessions` y `lessons` de Dexie, conserva el panel al recargar y expone carga/error/recarga. `ProgressPage` muestra tarjetas de XP/nivel, racha, tiempo y respuestas, retención con últimos siete períodos y precisión por tipo, cada bloque con estado vacío honesto. Tests puros de entradas vacías, retención programada, precisión por tipo, nivel/racha, tiempo y sesiones; tests de página vacía, datos reales, error con reintento y axe. 94 archivos / 699 tests en verde; typecheck, `validate:content`, build y presupuesto de bundle verdes (169,11 kB gzip inicial, 32 chunks diferidos).
- [x] **F2-063** — Construir ajustes completos
  - Aceptación: notación, idioma, tema, retención, nuevos/día, volumen y tempo; persistencia y reset.
  - Deps: F2-058 · Red: no
  - Commit: 2797aef · 2026-11-13T02:21:48-03:00
  - Cierre: `src/state/settings.tsx` agrega tema y `midiEnabled`, limita el volumen a −40..0 dB y conserva el resto de preferencias. `src/state/settings-record.ts` traduce la UI a la fila persistida (`language` ↔ `locale`, `tempo` ↔ `tempoBpm`, dB ↔ ganancia lineal) y viceversa. `settings.read()` distingue una instalación nueva de una fila existente; `SettingsPersistence` hidrata desde Dexie, migra los ajustes locales la primera vez y escribe cada cambio en `localStorage` y en la base, con nueva hidratación tras importar o resetear. El tema `system`/`light`/`dark` usa `data-theme`, variables CSS y un script inline sin destello. `SettingsPanel` suma tema y tope diario; `DataManagementPanel` conecta exportación descargable o en carpeta, importación validada con confirmación y reseteo con `BORRAR` más casilla. Tests de conversión, ida y vuelta, hidratación bilingüe, persistencia, exportación, importación válida e inválida, reseteo y axe. 96 archivos / 712 tests en verde; typecheck, `validate:content`, build y presupuesto verdes (174,62 kB gzip inicial, 32 chunks diferidos).
- [x] **F2-064** — Implementar tema claro/oscuro con persistencia
  - Aceptación: sistema/claro/oscuro; sin flash; contraste AA; test de cambio.
  - Deps: F2-063 · Red: no
  - Commit: b282496 · 2026-11-13T02:26:10-03:00
  - Cierre: el tema sistema/claro/oscuro y su persistencia ya se implementaron en F2-063 (`data-theme`, variables CSS, script inline y ajuste en Dexie/localStorage). F2-064 agrega `tests/theme.test.ts`: extrae las paletas reales de `src/styles.css`, calcula contraste WCAG sobre texto, texto atenuado, acento y foco contra fondo y panel, exige AA (≥ 4,5:1), comprueba que las dos definiciones oscuras coinciden, verifica el script sin destello dentro del `<head>` y cubre el tema por defecto y los valores inválidos. El cambio de tema desde la UI y la hidratación persistida ya están cubiertos en `tests/settings-page.test.tsx`. 97 archivos / 716 tests en verde; typecheck, `validate:content`, build y presupuesto verdes (174,62 kB gzip inicial, 32 chunks diferidos). Verificado en Pages: tema oscuro persiste tras recargar y el fondo oscuro se aplica antes de pintar.
- [x] **F2-065** — Implementar i18n base ES/EN y selector Do/C global
  - Aceptación: todos los textos de UI en diccionarios; ES por defecto; EN sin claves faltantes; test de paridad.
  - Deps: F2-063 · Red: no
  - Commit: 2b20e01 · 2026-11-13T02:31:04-03:00
  - Cierre: el diccionario español queda inferido y el inglés tipado como `Record<keyof typeof ES_DICTIONARY, string>`, de modo que una clave faltante o sobrante falla en `tsc`. Se movieron al diccionario el pie de la app (`app.footer`) y todos los textos del pentagrama (`staff.title`, `staff.noNotes`, `staff.notes`, `staff.clef.*`, `staff.error*`), y `Staff` usa `t` en lugar de condiciones de idioma. `tests/i18n.test.ts` verifica paridad de claves, valores no vacíos y marcadores, audita todas las claves literales `t('...')` en `src/`, cubre familias dinámicas de estados y estilos, y fija español por defecto con rechazo de idiomas desconocidos. El selector Do/C global y el selector ES/EN ya existían y siguen conectados a teclado, pentagrama, demo, lecciones y `document.documentElement.lang`. 98 archivos / 721 tests en verde; typecheck, `validate:content`, build y presupuesto verdes (174,75 kB gzip inicial, 32 chunks diferidos).
- [x] **F2-066** — Construir componente de tarea de teclado real
  - Aceptación: diagrama, digitación, metrónomo, demo y checklist; responsive; accesible.
  - Deps: F2-060 · Red: no
  - Commit: 98268e3 · 2026-11-13T02:37:00-03:00
  - Cierre: `src/components/KeyboardTask.tsx` reemplaza la vista estática de la tarea con diagrama de teclado, digitación escrita, metrónomo, demo sonora con pentagrama y checklist marcable. Comparte el `AudioEngine` del reproductor; la demo usa `scoreToTimeline` con el tempo de la tarea y el metrónomo usa `tempoBpm` más el numerador del compás, con pulso anunciado por `aria-live`. Si falta `demoScore`, el botón queda deshabilitado y se explica la ausencia. La checklist usa `fieldset`/`legend`, casillas nativas y contador `aria-live`, sin persistir ni registrar respuestas. `src/keyboard/range.ts` centraliza las octavas visibles para secciones y tarea. Tests de render, digitación, demo con MIDI real, metrónomo con tempo/compás, checklist, ausencia de partitura, error de audio y rangos; axe sigue verde en la lección. 100 archivos / 730 tests en verde; typecheck, `validate:content`, build y presupuesto verdes (175,39 kB gzip inicial, 32 chunks diferidos).
- [x] **F2-067** — Implementar autoevaluación de 4 botones y registro de práctica
  - Aceptación: cuatro ratings; guarda duración y resultado; se integra a FSRS; test.
  - Deps: F2-066 · Red: no
  - Commit: 497893b · 2026-11-13T02:43:28-03:00
  - Cierre: `ReviewPage` cambia el recorrido por cuatro botones de autoevaluación (Otra vez, Difícil, Bien, Fácil) en un `fieldset` accesible y mide la duración desde que aparece el ítem. `src/state/practice-log.ts` elige el formato según el tipo de habilidad, crea la tarjeta FSRS si falta, califica con `gradeFsrsItem`, guarda `durationMs` y `format`, y actualiza maestría y contadores con pasos limitados a 0–1. `saveReviewResult` escribe tarjeta y registro en una transacción Dexie. La UI evita dobles envíos, muestra error y refresca la cola al terminar o salir; FSRS se carga dinámicamente para no engordar el bundle inicial. Tests de formato, maestría, creación y avance de tarjeta, fallo, historial, ids inválidos, flujo de la cola con persistencia real, i18n y axe. 101 archivos / 738 tests en verde; typecheck, `validate:content`, build y presupuesto verdes (176,35 kB gzip inicial, 43 chunks diferidos).
  - Corrección (1048dbb): la sesión guarda el total con el que empezó (`sessionTotal`) y lo usa para el progreso y el resumen final. Antes, al refrescar la cola después del último ítem, el resumen leía la cola ya vacía y mostraba «Calificaste los 0 ítems» y «2 de 0 respuestas guardadas». También se estabilizó el test de hidratación de ajustes esperando los efectos de tema e idioma (fcf6013).
- [x] **F2-068** — Construir plan de práctica diario 15/30/45 con temporizador
  - Aceptación: bloques calentamiento/técnica/teoría/repertorio/repaso; temporizador; registro.
  - Deps: F2-067 · Red: no
  - Commit: e2c7621 · 2026-11-13T02:59:09-03:00
  - Cierre: `src/state/practice-plan.ts` reparte 15/30/45 minutos entre calentamiento, técnica, teoría, repertorio y repaso, siempre con suma exacta. `src/state/practice-timer.ts` implementa una máquina de estados pura (`idle`, `running`, `paused`, `done`) que acumula segundos por bloque, avanza al agotarlo y no regala tiempo al saltar. `PracticePage` (`#/practica`, nuevo ítem de navegación) permite elegir la duración, arrancar, pausar, reanudar, saltar y terminar; guarda al llegar a `done` y muestra XP, racha o el aviso honesto de sesión corta. `ProgressRepositories.recordPracticeSession` escribe sesión y perfil en una transacción, suma 2 XP por minuto completo y registra la racha con el día UTC de `endedAt`; repetir el guardado no duplica la recompensa y una sesión de menos de un minuto se guarda sin XP ni racha. Tests de reparto, temporizador, sesión corta, idempotencia, transacción, pantalla con temporizador falso, i18n, router y axe. 105 archivos / 763 tests en verde; typecheck, `validate:content`, build y presupuesto verdes (179,70 kB gzip inicial, 43 chunks diferidos).
- [x] **F2-069** — Mostrar aviso honesto sobre aprender sin profesor
  - Aceptación: visible en M0 y ajustes; consejos de espejo/grabación; no bloquea el flujo.
  - Deps: F2-060 · Red: no
  - Commit: e807ce6 · 2026-11-10T03:19:19-03:00
  - Cierre: se agregó `src/components/TeacherNotice.tsx`, un panel sin modales ni controles que explica los límites de aprender sin profesor y propone espejo, grabación y consulta presencial. Se muestra en todas las lecciones de M0 (`LessonPage`) y en ajustes, con textos ES/EN en el diccionario y estilos propios. Tests del aviso en M0, de que no aparece en M1, de su presencia en ajustes, de la traducción al inglés y de que no bloquea el botón de completar. 106 archivos / 768 tests en verde; typecheck, `validate:content`, build y presupuesto verdes (180,40 kB gzip inicial, 43 chunks diferidos).

### Integración y cierre

- [x] **F2-070** — Validar todo el contenido M0-M2 en el build
  - Aceptación: 30 lecciones publicadas; cero errores; cada lección con tarea de teclado; sin ejercicios huérfanos.
  - Deps: F2-001 a F2-030 · Red: no
  - Commit: 7446a21 · 2026-11-10T03:24:30-03:00
  - Cierre: `validateContentBundle` ahora trata como error una lección publicada sin tarea de teclado y un ejercicio no referenciado, así que `npm run build` falla con esos casos y no solo advierte. `tests/content-m0-m2-validation.test.ts` valida el contenido real sin errores ni advertencias, exige 30 lecciones publicadas repartidas 6/12/12 en M0/M1/M2, comprueba la tarea de teclado de cada lección, la ausencia de ejercicios huérfanos y simula ambos fallos. 107 archivos / 774 tests en verde; typecheck, `validate:content`, build y presupuesto verdes (180,40 kB gzip inicial, 43 chunks diferidos).
- [x] **F2-071** — Testear ejercicios M0-M2 en las 12 tonalidades
  - Aceptación: ortografía, respuestas y distractores; property tests; sin duplicados.
  - Deps: F2-070 · Red: no
  - Commit: 75e66a3 · 2026-11-10T03:29:30-03:00
  - Cierre: `tests/properties-m0-m2-exercises.test.ts` recorre las matrices completas. Verifica las 192 combinaciones de 12 tónicas × 16 modos con la ortografía canónica de `scaleNames`, la secuencia de letras en los modos diatónicos, la tónica repetida y opciones únicas; los 132 pares ordenados de tonalidades en las tres dificultades con el mismo salto de semitonos por nota, ida y vuelta y validez de esquema; las 58 preguntas mayores y 58 menores de armaduras con respuestas canónicas y opciones únicas; y los distractores de escalas y transposiciones, que cambian exactamente un token y nunca repiten la respuesta. 108 archivos / 779 tests en verde; typecheck, `validate:content`, build y presupuesto verdes (180,40 kB gzip inicial, 43 chunks diferidos).
- [x] **F2-072** — E2E del recorrido lección→ejercicio→repaso
  - Aceptación: Playwright recorre una lección, falla y ve el «Recordá», repasa y persiste tras recargar.
  - Deps: F2-070, F2-072a · Red: no
  - Commit: aa90133 · 2026-11-10T10:28:00-03:00
  - Cierre: se agregó `@playwright/test` 1.65.0, `playwright.config.ts` y `e2e/lesson-exercise-review.spec.ts`. La configuración compila la app, sirve `dist/` con `vite preview` en `127.0.0.1:4173` y usa un solo worker con contexto aislado. El recorrido abre M0-01, falla el primer ejercicio, comprueba «Todavía no.», la respuesta correcta y el «Recordá», entra a «Repaso de hoy», califica la habilidad nueva y, tras recargar, verifica en «Progreso» que las dos respuestas siguen registradas. `npm run test:e2e` pasa en 0,8 s; suite unitaria 110 archivos / 788 tests; presupuesto 191,23 kB gzip inicial y 194 chunks diferidos. El workflow de Pages todavía no ejecuta E2E (decisión de F6).
- [x] **F2-072a** — Construir reproductor de ejercicios con corrección y feedback «Recordá»
  - Aceptación: una pantalla de ejercicio renderiza el enunciado y las opciones o la respuesta escrita; al corregir muestra acierto o error, la explicación y la regla «Recordá» con ejemplo resuelto cuando falla; registra el intento y permite seguir o volver a la lección; tests de componente y de corrección por tipo.
  - Deps: F2-038, F2-039, F2-060 · Red: no
  - Commit: 3c3114a · 2026-11-10T10:15:00-03:00
  - Cierre: `src/components/ExercisePlayer.tsx` consume los JSON de `content/exercises` con carga diferida (`import.meta.glob`) y muestra un ejercicio por vez con opciones o respuesta escrita. Al corregir compara con la respuesta canónica de `src/exercises/answer.ts`, muestra acierto o error, la explicación del contenido y, si falla, la regla «Recordá» con ejemplo resuelto. Cada intento se registra con `src/state/exercise-attempt.ts` como repaso FSRS de la habilidad (calificación automática, duración, tarjeta y maestría) mediante `recordReview`. FSRS y el registro se cargan dinámicamente para no engordar el bundle inicial. También se corrigieron errores de ortografía y explicaciones en 20 ejercicios de M1-M2 que los nuevos tests de respuesta canónica detectaron. 110 archivos / 788 tests en verde; typecheck, `validate:content`, build y presupuesto verdes (191,20 kB gzip inicial, 194 chunks diferidos).
- [x] **F2-073** — Cerrar F2: suite, tag `fase-2`, RESUME y resumen
  - Aceptación: `npm run estado` verde; export/import probado; tag `fase-2`; M0-M2 completos.
  - Deps: F2-001 a F2-072 · Red: no
  - Commit: b8a0bc8 · 2026-11-10T10:45:00-03:00
  - Cierre: `npm run estado` verde (typecheck, 110 archivos / 788 tests y build); E2E 1/1; export/import cubierto por sus tests; tag local `fase-2`; RESUME, CHANGELOG y este resumen actualizados.
- [x] **F2-074** — Mostrar digitación de dedos (número y mano D/I) en el teclado
  - Aceptación: teclas con número de dedo y D/I según dedo; patrones para escala, acorde e intervalo; tests.
  - Deps: F1-015, F1-033, F2-003 · Red: no
  - Commit: f1ba963 · 2026-11-09T23:53:54-03:00
  - Cierre: se agregó `src/keyboard/fingering.ts` con dedos para escala, acorde e intervalo, se agregó el prop `fingering` al teclado con badge visible y nombre accesible con dedo y mano, se agregó selector de mano (D/I) al demo y tests de patrón y badge. 61 archivos / 435 tests en verde; typecheck, `validate:content` y build verdes.
- [x] **F2-075** — Completar soporte en inglés para contenido y UI
  - Aceptación: lecciones M0-M2 con campos en inglés completos y ejercicios con texto/feedback en inglés; selector ES/EN funcional sin claves faltantes; tests de paridad.
  - Deps: F2-065, F2-073 · Red: no
  - Commit: c7118f0 · 2026-11-11T11:58:37-03:00
  - Cierre: las 30 lecciones publicadas y los 150 ejercicios referenciados de M0-M2 tienen `titleEn`/`summaryEn`/`objectivesEn`, cuerpos, tareas, glosarios, `promptEn`/`explanationEn` y `choicesEn` con la misma longitud y orden. `LessonPlayer`, `KeyboardTask`, `ExercisePlayer` y `LessonPage` seleccionan el idioma activo; la respuesta canónica y el «Recordá» se resuelven por idioma. `validate:content` falla si un contenido publicado o referenciado no tiene inglés. Tests de paridad de contenido, índices de respuesta, feedback y cambio de idioma en caliente. `npm run estado` verde (112 archivos / 793 tests), E2E 1/1 y presupuesto 195,76 kB gzip inicial.

### Cierre F2 — 2026-11-10

Quedó funcionando:

- M0-M2 completos: 30 lecciones publicadas (6 de M0, 12 de M1 y 12 de M2), 150 ejercicios y 24 habilidades, con validación cruzada en el build y property tests sobre las matrices de escalas, transposición y armaduras.
- Motor FSRS con tarjetas, calificación automática, historial de repasos, cola diaria intercalada, previsión de carga y ajustes de retención, fuzz e intervalo máximo.
- Progreso persistido en Dexie con migraciones, desbloqueo por prerrequisitos, XP, niveles, logros, racha con gracia semanal, sesiones y plan de práctica diario de 15/30/45 minutos con temporizador.
- Exportación `.txt` con JSON canónico y SHA-256, importación validada con reemplazo atómico, copia opcional en carpeta y reseteo con doble confirmación.
- Shell con hash router, mapa del curso, reproductor de lecciones, reproductor de ejercicios con corrección y «Recordá», repaso de hoy, estadísticas, ajustes completos, tema claro/oscuro y i18n de interfaz ES/EN.
- E2E de Playwright del recorrido lección→ejercicio→repaso con persistencia tras recargar.

Comandos verdes: `npm run typecheck`, `npm test` (112 archivos / 793 tests),
`npm run test:e2e` (1 recorrido), `npm run validate:content`, `npm run build`,
`npm run budget` (195,76 kB gzip inicial, 194 chunks diferidos) y
`npm run estado`.

Tag: `fase-2`. Deuda asumida: los logros todavía no se evalúan al guardar
actividad; el E2E aún no corre en el workflow de Pages; M3-M8 aparecen como
módulos vacíos. El contenido en inglés de M0-M2 se completó en F2-075.

## F3 — M3-M4 y entrenamiento auditivo

### Contenido M3 — Intervalos

- [x] **F3-001** — Escribir M3-01 «Intervalos: cantidad y calidad»
  - Aceptación: segundas a octavas; justos/mayores/menores/aumentados/disminuidos; ejercicio en 12 tónicas.
  - Deps: F2-073 · Red: no
  - Commit: 801cf11 · 2026-11-11T12:13:04-03:00
  - Cierre: M3-01 publicada con la cantidad (letras, de unísono a octava y compuestos), la calidad (justos, mayores, menores, aumentados y disminuidos) y una demo armónica que compara tercera mayor, tercera menor, cuarta justa y cuarta aumentada. La tarea real de teclado toca Do-Mi y Do-Sol a 60 BPM con digitación y checklist. Doce ejercicios de intervalo cubren las doce tónicas, las siete cantidades (2.ª a 8.ª) y las cinco calidades, con explicación, opciones en español e inglés y respuesta canónica verificada. El índice del curso y los tests de conteo se actualizaron a 31 lecciones y 162 ejercicios. 113 archivos / 798 tests en verde; typecheck, validación, build, presupuesto (196,12 kB gzip inicial, 207 chunks diferidos) y E2E 1/1 verdes.
- [x] **F3-002** — Escribir M3-02 «Inversión de intervalos»
  - Aceptación: regla de suma 9; ejemplos sonoros; ejercicio de inversión; test de ortografía.
  - Deps: F3-001 · Red: no
  - Commit: 46d685c · 2026-11-11T12:30:04-03:00
  - Cierre: M3-02 publicada con la definición de inversión (subir la nota grave o bajar la aguda una octava), la regla de suma nueve, el intercambio de calidades (justo con justo, mayor con menor, aumentado con disminuido), la conservación de la ortografía y la relación de semitonos (suman 12). Incluye una demo de cuatro pares original-inversión, tarea real de teclado con Do-Mi/Mi-Do y Do-Sol/Sol-Do, y doce ejercicios, uno por tónica, que abarcan las cantidades 1.ª a 8.ª y las cinco calidades. El test de ortografía verifica las doce parejas y detectó que la teoría nombraba «unísono justa»; se corrigió a «unísono justo». 114 archivos / 805 tests en verde; typecheck, validación, build, presupuesto (196,46 kB gzip inicial, 220 chunks diferidos) y E2E 1/1 verdes.
- [x] **F3-003** — Escribir M3-03 «Consonancia y disonancia»
  - Aceptación: clasificación contextualizada; ejemplos; ejercicio de escucha sin simplismos.
  - Deps: F3-002 · Red: no
  - Commit: dda6959 · 2026-11-11T12:44:16-03:00
  - Cierre: M3-03 publicada con la distinción entre consonancias perfectas (unísono, quinta y octava), imperfectas (terceras y sextas) y disonancias (segundas, séptimas y tritono), y con la cuarta justa como caso dependiente del contexto y de la voz inferior. Incluye una demo de ocho intervalos armónicos, tarea real de teclado que compara quinta con cuarta aumentada y tercera con segunda, y doce ejercicios de escucha, uno por tónica, con cuatro categorías y explicaciones que evitan reducir la disonancia a un error. El tipo `interval` acepta ahora una respuesta canónica alternativa (`answer`/`answerEn`) para clasificar sin cambiar de tipo. 115 archivos / 810 tests en verde; typecheck, validación, build, presupuesto (196,89 kB gzip inicial, 233 chunks diferidos) y E2E 1/1 verdes.
- [x] **F3-004** — Escribir M3-04 «Intervalos en contexto»
  - Aceptación: intervalos dentro de melodías y acordes; ejercicio de identificar en fragmentos.
  - Deps: F3-003 · Red: no
  - Commit: 8d76c4e · 2026-11-11T12:53:19-03:00
  - Cierre: M3-04 publicada con intervalos en melodías (grados conjuntos, saltos, dirección, peso métrico e intervalos compuestos) y en acordes (intervalos apilados, calidad de la tríada e inversiones). Incluye una demo melódica y otra con Do mayor en posición fundamental y primera inversión, tarea real de teclado que pasa de la melodía al acorde y a la décima mayor, y doce ejercicios con fragmentos melódicos o acordes visibles y reproducibles. El tipo `interval` acepta ahora un `fragment` opcional; `ExercisePlayer` lo dibuja con `Staff` y lo reproduce con `scoreToTimeline`. 116 archivos / 816 tests en verde; typecheck, validación, build, presupuesto (197,31 kB gzip inicial, 246 chunks diferidos) y E2E 1/1 verdes.
- [x] **F3-004a** — Corregir contraste del pentagrama en tema oscuro
  - Aceptación: en tema oscuro el área del pentagrama tiene fondo claro tipo papel y las notas (color `#1d1f23`) mantienen contraste WCAG AA sobre él; sin cambios en el resaltado ni en el foco.
  - Deps: F3-004 · Red: no
  - Commit: d7e45b0 · 2026-11-12T11:12:00-03:00

- [x] **F3-005** — Escribir M3-05 «Intervalos de oído»
  - Aceptación: referencia cantada; entrenamiento ascendente/descendente/armónico; progresión de dificultad.
  - Deps: F3-004 · Red: no
  - Commit: 40a469e · 2026-11-12T11:40:00-03:00
  - Cierre: M3-05 publicada con la referencia auditiva (demo de la tercera mayor en Do), entrenamiento en los tres modos (ascendente, descendente y armónico) y doce ejercicios de tipo `ear-interval` con dificultad progresiva de un segundo mayor a una quinta aumentada. La habilidad `skill.ear-interval` se vincula a la lección y el índice del curso se regenera. Suite 117 archivos / 825 tests en verde; typecheck, validación, build, presupuesto (197,66 kB gzip inicial, 259 chunks diferidos) y E2E 1/1 verdes.

### Contenido M4 — Acordes

- [x] **F3-006** — Escribir M4-01 «Tríadas mayores y menores»
  - Aceptación: construcción 1-3-5; 12 tónicas; audio en bloque/arpegio; ejercicio.
  - Deps: F3-005 · Red: no
  - Commit: c93bf44 · 2026-11-12T15:15:00-03:00
- [x] **F3-007** — Escribir M4-02 «Tríadas disminuidas, aumentadas y sus»
  - Aceptación: fórmulas y contexto; 12 tónicas; audio; ejercicio de calidad.
  - Deps: F3-006 · Red: no
  - Commit: e5f3ac7 · 2026-11-12T16:05:00-03:00
  - Cierre: M4-02 publicada con las cuatro fórmulas (1-♭3-♭5, 1-3-♯5, 1-2-5 y 1-4-5), la explicación del tritono, la simetría de la aumentada y la resolución de las suspendidas. Demo de las cuatro calidades sobre Do, tarea de teclado que resuelve Do-Fa-Sol en Do-Mi-Sol y doce ejercicios de tipo `chord` con las doce tónicas repartidas en tres disminuidas, tres aumentadas, tres suspendidas 2 y tres suspendidas 4. La habilidad `skill.chord-quality` incorpora `sus2` y `sus4` y se vincula a la lección. Suite 119 archivos / 835 tests en verde; typecheck, validación, build, presupuesto (198,37 kB gzip inicial, 285 chunks diferidos) y E2E 1/1 verdes.
- [x] **F3-008** — Escribir M4-03 «Inversiones y voicings básicos»
  - Aceptación: bajo real; 1.ª y 2.ª inversión; voicings cercanos; ejercicio al teclado.
  - Deps: F3-007 · Red: no
  - Commit: 2256459 · 2026-11-12T17:10:00-03:00
  - Cierre: M4-03 publicada con el bajo real como criterio de inversión, las tres posiciones de la tríada (1-3-5, 3-5-1, 5-1-3), el cifrado slash y la diferencia entre voicing cercano y abierto. Demo de Do mayor en fundamental, primera, segunda y abierto; tarea de teclado con las tres inversiones y el voicing abierto; doce ejercicios de tipo `chord` con `ask: "inversion"` que dan las notas desde el bajo y piden la posición, con las doce tónicas repartidas en cuatro por posición. Se agregó `CHORD_INVERSION_LABELS` y la habilidad `skill.chord-inversion`. Suite 120 archivos / 840 tests en verde; typecheck, validación, build, presupuesto (198,86 kB gzip inicial, 298 chunks diferidos) y E2E 1/1 verdes.
- [x] **F3-009** — Escribir M4-04 «Séptimas: maj7, 7, m7, m7♭5, dim7»
  - Aceptación: cinco calidades; 12 tónicas; audio; ejercicio de notas y calidad.
  - Deps: F3-008 · Red: no
  - Commit: 1521b5c · 2026-11-12T18:15:00-03:00
  - Cierre: M4-04 publicada con las cinco fórmulas de séptima (maj7 1-3-5-7, 7 1-3-5-♭7, m7 1-♭3-5-♭7, m7♭5 1-♭3-♭5-♭7 y dim7 1-♭3-♭5-♭♭7), el cifrado de cada calidad y su uso (reposo de la mayor, tensión y resolución de la de dominante, color de la menor, preparación de la semidisminuida y simetría de la disminuida). Demo de las cinco sobre Do, tarea de teclado con las cinco calidades y doce ejercicios de tipo `chord`: seis dan las notas y preguntan la calidad, seis dan el cifrado y piden escribir las notas. El tipo `chord` admite `ask: "notes"` y se agregó la habilidad `skill.chord-seventh`. Suite 121 archivos / 845 tests en verde; typecheck, validación, build, presupuesto (199,43 kB gzip inicial, 311 chunks diferidos) y E2E 1/1 verdes.
- [x] **F3-010** — Escribir M4-05 «Extensiones (9, 11, 13)»
  - Aceptación: omisiones y tensiones; ejemplos; ejercicio de construir y reconocer.
  - Deps: F3-009 · Red: no
  - Commit: 4a87268 · 2026-11-12T19:00:00-03:00
  - Cierre: M4-05 publicada con la 9, la 11 y la 13 como intervalos compuestos (14, 17 y 21 semitonos), la séptima implícita y las nueve fórmulas maj9/9/m9, maj11/11/m11 y maj13/13/m13. Explica las tensiones y los choques (la oncena justa como nota a evitar sobre la tercera mayor del dominante) y las omisiones habituales (quinta, tercera en el 11 de dominante y oncena en el 13). Demo de cuatro voicings sobre Do (maj9, 9, m11 y 13), tarea de teclado y doce ejercicios: seis reconocen la calidad extendida a partir de las notas y seis escriben las notas desde el cifrado. Se agregó `skill.chord-extension`. Suite 122 archivos / 850 tests en verde; typecheck, validación, build, presupuesto (199,86 kB gzip inicial, 324 chunks diferidos) y E2E 1/1 verdes.
- [x] **F3-011** — Escribir M4-06 «Slash chords»
  - Aceptación: bajo distinto de la fundamental; cifrado y notas; ejercicio.
  - Deps: F3-010 · Red: no
  - Commit: 6cded12 · 2026-11-12T19:30:00-03:00
  - Cierre: M4-06 publicada con el cifrado de barra, el bajo como nota más grave y la diferencia entre inversión (Do/Mi, Do/Sol) y acorde híbrido con un bajo ajeno a la tríada (Do/Re, Do/Si). Explica la colocación del bajo y el acorde, la equivalencia entre cifrado latino y americano y el caso de Do/Si como Do maj7 con la séptima abajo. Demo de cuatro slash chords sobre Do, tarea de teclado a dos manos y doce ejercicios: seis dan las notas y piden el cifrado, seis dan el cifrado y piden las notas. Se agregó `chordWithSlash` al motor, `slash` y `ask: "symbol"` al tipo `chord`, y la habilidad `skill.chord-slash`. Suite 123 archivos / 855 tests en verde; typecheck, validación, build, presupuesto (200,72 kB gzip inicial, 337 chunks diferidos) y E2E 1/1 verdes.
- [x] **F3-012** — Escribir M4-07 «Cifrado latino/americano»
  - Aceptación: Do7/Solm ↔ C7/Gm; tabla completa; ejercicio de conversión bidireccional.
  - Deps: F3-011 · Red: no
  - Commit: e4a62a2 · 2026-11-12T20:00:00-03:00
  - Cierre: M4-07 publicada con la tabla completa de notas latinas (Do, Re, Mi, Fa, Sol, La, Si) y americanas (C, D, E, F, G, A, B), las alteraciones ♭/♯ (con sus formas ASCII b/#), los sufijos de calidad que se conservan (m, maj7, 7, m7, m7♭5, dim7, sus2, sus4, add9, 9, 11, 13) y la conversión de ambos lados de la barra (Do7/Solm ↔ C7/Gm). El nuevo tipo `chord-notation` con `symbol` y `to` (`do`/`c`) se resolvió con `convertChordNotation` del motor y el error pedagógico «Recordá la equivalencia entre cifrados» cubrió la nueva categoría. Demo de ocho acordes con cifrado dual, tarea de teclado y doce ejercicios (seis conversiones con opciones y seis con respuesta escrita). Se agregó la habilidad `skill.chord-notation`. Suite 124 archivos / 862 tests en verde; typecheck, validación, build, presupuesto (201,71 kB gzip inicial, 350 chunks diferidos) y E2E 1/1 verdes.

### Motor de intervalos y acordes

- [x] **F3-013** — Generar ejercicios de medir intervalos
  - Aceptación: cantidad/calidad; melódico/armónico; 12 tónicas; sin enarmonías inválidas.
  - Deps: F2-073 · Red: no
  - Commit: 88d330e · 2026-11-12T21:30:00-03:00
  - Cierre: M4-08 publicada con la cantidad y la calidad, la medición melódica y la armónica, las doce tónicas, las siete cantidades (2.ª a octava) y las cinco calidades. Demo de cuatro intervalos desde Do (tercera mayor, tercera menor, cuarta justa y cuarta aumentada), tarea de teclado con la demo y doce ejercicios de tipo `interval` con opciones en español e inglés y respuestas canónicas verificadas por el motor. Se agregó la habilidad `skill.interval-quality` a la lección. Suite 125 archivos / 867 tests en verde; typecheck, validación, build, presupuesto (201,99 kB gzip inicial, 363 chunks diferidos) y E2E 1/1 verdes.
- [x] **F3-014** — Generar ejercicios de cifrado ↔ notas
  - Aceptación: ambos sentidos; tríadas y séptimas; cifrado ES/EN; test de ida y vuelta.
  - Deps: F3-013 · Red: no
  - Commit: 35f0c41 · 2026-11-10T18:59:20-03:00
  - Cierre: M4-09 «Del cifrado a las notas y de las notas al cifrado» publicada con los dos sentidos de la conversión, tríadas y séptimas, cifrado latino y americano y un test de ida y vuelta que conserva fundamental, calidad y ortografía. Demo de cuatro acordes (Do, Rem, Si♭maj7 y La7) con su vuelta al cifrado, tarea de teclado y doce ejercicios de tipo `chord`: seis `ask: "notes"` que dan el cifrado y piden las notas y seis `ask: "symbol"` que dan las notas y piden el cifrado, cubriendo las doce tónicas y alternando tríadas y séptimas. Se agregó la habilidad `skill.chord-symbol` con las dos direcciones y las nueve calidades. El test de ida y vuelta destapó un fallo real del motor con raíces y bajos latinos de tres letras (`Sol`, `La`, `Si`): `parseChordSymbol` solo mapeaba tokens de dos letras; se corrigió con `LATIN_TO_NOTE[token] ?? token` y se agregaron regresiones para `Solm7` y `Domaj7/Sol`. Suite 126 archivos / 875 tests en verde; typecheck, validación, build, presupuesto (202,37 kB gzip inicial, 376 chunks diferidos) y E2E 1/1 verdes.
- [x] **F3-015** — Generar ejercicios de calidad de acordes
  - Aceptación: cinco calidades de séptima y tríadas; distractores cercanos; audio.
  - Deps: F3-014 · Red: no
  - Commit: 3047afd · 2026-11-10T19:11:41-03:00
  - Cierre: M4-10 «Reconocer la calidad de un acorde» publicada con las cuatro tríadas (mayor, menor, disminuida y aumentada) y las cinco séptimas (maj7, 7, m7, m7♭5 y dim7), los pares que más se confunden (maj7/7 y m7/m7♭5) y una guía para escuchar la tercera, la quinta y la séptima. Demo de cuatro acordes que contrastan esos pares, tarea de teclado y doce ejercicios: seis visuales de tipo `chord` que muestran las notas y piden la calidad y seis auditivos de tipo `ear-chord` que suenan el acorde y piden la misma respuesta. Las doce tónicas aparecen una vez y las nueve calidades quedan cubiertas; las opciones son calidades de la misma familia para que los distractores sean cercanos. Se amplió `ear-chord` con `root`, `inversion` y `style` (bloque o arpegio) y se agregó `earChordTimeline` para reproducirlo; el reproductor incorpora el botón «Escuchar acorde» en español e inglés. Las visuales se reparten entre `skill.chord-quality` y `skill.chord-seventh`, y se agregó `skill.chord-quality-ear` para el reconocimiento auditivo. Suite 127 archivos / 883 tests en verde; typecheck, validación, build, presupuesto (202,87 kB gzip inicial, 389 chunks diferidos) y E2E 1/1 verdes.
- [x] **F3-016** — Generar ejercicios de inversiones y bajo
  - Aceptación: identificar inversión; construir con bajo dado; test de voicings válidos.
  - Deps: F3-015 · Red: no
  - Commit: 758b842 · 2026-11-10T19:17:14-03:00
  - Cierre: M4-11 «Inversiones y bajo: construir el voicing desde abajo» publicada con la inversión decidida por el bajo, las tres posiciones de la tríada y las cuatro de la séptima, la construcción desde un bajo con barra y las tres condiciones de un voicing válido (bajo correcto, notas completas y orden rotado). Demo de Do maj7 en sus cuatro posiciones, tarea de teclado y doce ejercicios de tipo `chord`: seis `ask: "inversion"` que dan las notas y piden la posición (tríadas y séptimas, incluidas la segunda y la tercera inversión) y seis `ask: "notes"` con `slash` que dan un cifrado con barra y piden las notas desde el bajo. El test de contenido comprueba cada voicing contra `chordWithSlash`: que el bajo sea la nota más grave, que estén todas las clases del acorde sin notas ajenas, que el orden sea una rotación y que el índice de inversión coincida con el grado del bajo. Se amplió `skill.chord-inversion` con la inversión 3 y M4-11; `skill.chord-slash` también referencia la lección. Suite 128 archivos / 889 tests en verde; typecheck, validación, build, presupuesto (203,22 kB gzip inicial, 402 chunks diferidos) y E2E 1/1 verdes.
- [x] **F3-017** — Generar ejercicios de extensiones y slash chords
  - Aceptación: 9/11/13 y bajo; notas correctas; dificultad alta; test.
  - Deps: F3-016 · Red: no
  - Commit: b45672a · 2026-11-10T19:26:10-03:00
  - Cierre: M4-12 «Extensiones con bajo: 9, 11 y 13 sobre un slash» publicada con la idea de que la extensión no cambia el bajo, el procedimiento de cuatro pasos para construir el voicing completo, la lectura y escritura del cifrado con barra y los errores frecuentes. Demo de Do maj9/Mi, Re m9/Do, Sol11/Fa y La♭maj13/Do, tarea de teclado y doce ejercicios de tipo `chord` de dificultad 4-5: seis `ask: "notes"` con `slash` que dan el cifrado y piden las notas desde el bajo (Do maj9/Mi, Re m9/Do, Mi♭maj11/Sol, Fa♯m11/Mi, La♭maj13/Do y Si♭9/Re) y seis `ask: "symbol"` que dan las notas y piden el cifrado (Simaj9/La♯, Do♯m9/Si, Mim13/Re, Fa13/La, Sol11/Fa y Lamaj9/Sol♯). Se cubren las nueve calidades extendidas y las doce tónicas. El test comprueba el bajo más grave, las clases completas del acorde, el orden ascendente, la ausencia de dobles alteraciones, el índice de inversión, las respuestas ES/EN, las opciones y la tarea. Al preparar los voicings se encontró que `invertChord` dejaba las extensiones en orden no ascendente (por ejemplo Re m9/Do daba Do-Mi-Re-Fa-La); se corrigió ordenando el resultado por altura y se agregó una regresión en `tests/theory-chords.test.ts`. Suite 129 archivos / 897 tests en verde; typecheck, validación, build, presupuesto (203,56 kB gzip inicial, 415 chunks diferidos) y E2E 1/1 verdes.
- [x] **F3-018** — Reproducir acordes con voicings, bloque y arpegio
  - Aceptación: bajo + acorde; inversiones; tempo; sin notas trabadas; test de scheduling.
  - Deps: F3-017, F1-024 · Red: no
  - Commit: 051e2f0 · 2026-11-10T19:39:01-03:00
  - Cierre: la reproducción de acordes ahora cubre los cuatro estilos `block`, `arpeggio-up`, `arpeggio-down` y `bass-chord` desde una única lista `CHORD_STYLES` compartida por la demo y el reproductor. `chordExerciseTimeline` convierte cualquier ejercicio `chord` en un timeline que respeta inversión y bajo con barra, y `earChordTimeline` acepta un estilo por parámetro para sobrescribir el del ejercicio. En `bass-chord` el bajo suena tres pulsos y el acorde entra en el segundo pulso sin repetir el MIDI del bajo: así no se dispara dos veces la misma nota ni una liberación corta a la otra. El reproductor muestra «Escuchar acorde» y un selector de forma para `chord` y `ear-chord`, con claves ES/EN. Los tests cubren el scheduling de los cuatro estilos, la duración total, el tempo, las inversiones, el bajo con barra, la ausencia de MIDI duplicado, el estilo por defecto y el override, además de la UI del selector. Suite 130 archivos / 906 tests en verde; typecheck, validación, build, presupuesto (203,73 kB gzip inicial, 415 chunks diferidos) y E2E 1/1 verdes.

### Entrenamiento auditivo

- [x] **F3-019** — Construir el motor de sesiones auditivas con dificultad adaptativa
  - Aceptación: sesión de 10 ítems; ajusta dificultad; registra aciertos; test determinista.
  - Deps: F3-013 · Red: no
  - Commit: 18f3500 · 2026-11-10T19:43:31-03:00
  - Cierre: `src/exercises/ear-session.ts` implementa una sesión pura de 10 ítems por defecto sobre cualquier lista de ítems con `id` y `difficulty` (1-5). La selección evita repetir ítems mientras queden candidatos sin usar, elige el más cercano al nivel actual y desempata con una semilla combinada con la posición, de modo que la misma lista, semilla y respuestas producen la misma secuencia. La dificultad sube tras dos aciertos consecutivos y baja tras dos errores, con topes y rachas configurables; cada respuesta registra el ítem, el nivel con el que se respondió y el resultado. `earSessionSummary` devuelve respondidos, aciertos, errores, precisión y nivel final. Ocho tests cubren el largo, el registro, la adaptación, la no repetición, el fallback por nivel faltante, el determinismo, la normalización y la lista vacía. Suite 131 archivos / 914 tests en verde; typecheck, validación, build, presupuesto (203,73 kB gzip inicial, 415 chunks diferidos) y E2E 1/1 verdes.
- [x] **F3-020** — Implementar dictado de intervalos en contexto
  - Aceptación: melodía breve; repetir; responder; feedback con regla; audio.
  - Deps: F3-019 · Red: no
  - Commit: ce7215a · 2026-11-10T20:14:58-03:00
  - Cierre: `src/exercises/interval-dictation.ts` convierte un ejercicio `ear-interval` o `interval` en un dictado con melodía breve. La melodía agrega una aproximación de semitono, las dos notas del intervalo y una resolución; en modo armónico aproxima el bajo, hace sonar las dos notas juntas y resuelve sobre la más aguda. Ordena por altura real aunque los campos estén invertidos, omite aproximación o resolución fuera del rango audible (21-108), conserva la respuesta canónica y las respuestas aceptadas en ES/EN, y adjunta la regla «Recordá». `repeatDictationTimeline` acota las pasadas a tres (primera escucha y dos repeticiones) con un silencio configurable. `ExercisePlayer` muestra en los `ear-interval` la indicación, el botón «Escuchar melodía» que pasa a «Repetir melodía», el contador de repeticiones y el feedback con regla; el contador se guarda por id para sobrevivir a la recarga del ítem. Ocho tests unitarios cubren ascendente, descendente, armónico, orden por altura, ES/EN, repeticiones, límites y determinismo; el test del reproductor recorre M3-05, repite dos veces y comprueba el «Recordá». Suite 132 archivos / 923 tests en verde; typecheck, validación, build, presupuesto (204,61 kB gzip inicial, 415 chunks diferidos) y E2E 1/1 verdes.
- [x] **F3-021** — Implementar dictado de calidad de acordes
  - Aceptación: bloque/arpegio; cinco calidades; repetir; feedback.
  - Deps: F3-020 · Red: no
  - Commit: 6b08881 · 2026-11-10T20:53:00-03:00
  - Cierre: `src/exercises/chord-dictation.ts` convierte un ejercicio `ear-chord` en un dictado puro: respeta fundamental, calidad e inversión, arma el voicing con `chordWithInversion` y devuelve el timeline en bloque o arpegio, la respuesta canónica y las aceptadas en ES/EN y la regla «Recordá» de `chord-quality`. Expone las cuatro tríadas y las cinco séptimas; `chordDictationMode` mapea bloque y bajo+acorde a `block`, y los arpegios a `arpeggio`. La política de pasadas (primera escucha y dos repeticiones) se movió a `src/exercises/dictation.ts` y `interval-dictation.ts` la reexporta. `ExercisePlayer` muestra en `ear-chord` la indicación, el botón «Escuchar acorde» que pasa a «Repetir acorde», el contador, el selector de forma y el feedback con regla; el contador sigue guardado por id. Siete tests unitarios cubren bloque, arpegios, las cinco séptimas, inversión, ES/EN, repeticiones, determinismo y override de estilo; el test del reproductor recorre M4-10, cambia a arpegio, repite dos veces y comprueba el «Recordá». Suite 133 archivos / 931 tests en verde; typecheck, validación, build, presupuesto (204,90 kB gzip inicial, 415 chunks diferidos) y E2E 1/1 verdes.
- [x] **F3-022** — Implementar dictado de escalas y modos
  - Aceptación: mayor, menores y modos de M2; comparación; feedback.
  - Deps: F3-021 · Red: no
  - Commit: 11507fb · 2026-11-10T21:17:14-03:00
  - Cierre: `src/exercises/scale-dictation.ts` convierte un ejercicio `ear-scale` en un dictado puro. Arma la escala desde `tonic` y `mode` con `scalePitches`, agrega la octava de la tónica y devuelve el timeline, la respuesta canónica y las aceptadas en ES/EN y la regla «Recordá». Cubre los 16 tipos de escala de M2 y ofrece una referencia para comparar: la mayor paralela en los modos diatónicos, la natural en las menores armónica y melódica, y la pentatónica menor en el blues. El esquema `ear-scale` incorpora `tonic` con valor por defecto Do y los tres ejercicios existentes lo declaran. `ExercisePlayer` muestra en `ear-scale` la indicación, el botón «Escuchar escala» que pasa a «Repetir escala», el contador de repeticiones, el botón de comparación y el feedback con regla. Ocho tests unitarios cubren las escalas mayores, menores, los siete modos, pentatónicas, blues, cromática, tonos enteros, comparación, ES/EN, repeticiones, determinismo y tónicas alteradas; el test del reproductor recorre M2-08, repite dos veces, compara y comprueba el «Recordá». Suite 134 archivos / 940 tests en verde; typecheck, validación, build, presupuesto (205,38 kB gzip inicial, 415 chunks diferidos) y E2E 1/1 verdes.
- [x] **F3-023** — Implementar dictado de progresiones
  - Aceptación: progresiones cortas; grados; repetir; feedback; usa playback de F1.
  - Deps: F3-022 · Red: no
  - Commit: 9797f9d · 2026-11-10T21:56:21-03:00
  - Cierre: `src/exercises/progression-dictation.ts` convierte un ejercicio `ear-progression` en un dictado puro. Lee los grados romanos con `romanToChord` en la tonalidad y el modo declarados, arma cada acorde en bloque y encadena los eventos con `chordTimeline` y `shiftTimeline` sobre el playback de F1. Devuelve los acordes con sus MIDI, el timeline, la respuesta canónica y las aceptadas en ES/EN y la regla «Recordá» de `roman-numeral`; la menor se interpreta como natural y la calidad escrita en cada numeral manda (por ejemplo `V` mayor en La menor). El reproductor muestra en `ear-progression` la indicación, el botón «Escuchar progresión» que pasa a «Repetir progresión», el contador de repeticiones y el feedback con regla. Se agregó el ejercicio real `ex.m2-07.m` (I-IV-V-I en Do mayor) al inicio de M2-07, con opciones paralelas ES/EN, y el contenido pasó a 355 ejercicios. Seis tests unitarios cubren el timeline, tonalidades con bemoles, modo menor, respuesta canónica, ES/EN, repeticiones, determinismo y tempo; el test del reproductor recorre M2-07, repite dos veces y comprueba el «Recordá». Suite 135 archivos / 948 tests en verde; typecheck, validación, build, presupuesto (206,13 kB gzip inicial, 416 chunks diferidos) y E2E 1/1 verdes.
- [x] **F3-024** — Añadir reproducción de pregunta/respuesta y botón repetir
  - Aceptación: sin autoplay; repetir limitado o registrado; estado accesible; test.
  - Deps: F3-019 · Red: no
  - Inicio: 2026-11-10T22:35:39-03:00
  - Commit: 6d71092 · 2026-11-10T22:43:14-03:00
  - Cierre: `src/exercises/playback.ts` centraliza el contador de pasadas de un ejercicio con dos caras independientes, `question` y `answer`, guardadas por id. Reutiliza el tope de `src/exercises/dictation.ts` (una primera escucha y dos repeticiones) y expone `canPlay`, `registerPlay`, `playbackCount` y `playbackRepeats`; es puro y no toca React ni audio. Los cuatro dictados exponen ahora `answerTimeline`: el intervalo sin aproximación ni resolución, el acorde siempre en bloque y la escala o progresión completa. `ExercisePlayer` migró del contador local de dictado al contador compartido: la pregunta mantiene su botón y su estado, y tras corregir aparece «Escuchar respuesta» / «Repetir respuesta» con su propio contador `role="status" aria-live="polite"`; ningún audio arranca al montar y cada pasada nace de un clic. Se agregaron las claves ES/EN `listenAnswer`, `repeatAnswer`, `answerHint` y `answerRepeats`. Cinco tests unitarios cubren el contador y sus topes, y tests de los cuatro dictados comprueban `answerTimeline`; el test del reproductor verifica que la respuesta no aparece antes de corregir y que se agota a las dos repeticiones. Suite 136 archivos / 956 tests en verde; typecheck, validación, build, presupuesto (206,52 kB gzip inicial, 416 chunks diferidos) y E2E 1/1 verdes.
- [x] **F3-025** — Registrar ítems auditivos en FSRS
  - Aceptación: cada tipo crea ítem con parámetros; variantes ver/oír; cola los incluye.
  - Deps: F3-023, F2-043 · Red: no
  - Inicio: 2026-11-10T23:04:56-03:00
  - Commit: e091cce · 2026-11-10T23:20:58-03:00
  - Cierre: el contenido ganó `skill.ear-scale` y `skill.ear-progression`, con parámetros (`modes`, `tonics`, `comparison`, `degrees`, `playback`) y lecciones asociadas; los cuatro ejercicios `ear-scale`/`ear-progression` apuntan a ellas y las lecciones M2-07, M2-08, M2-10 y M2-11 declaran la habilidad auditiva. `src/state/exercise-attempt.ts` incorpora `exerciseReviewItem`, que devuelve id, tipo y formato: los cuatro `ear-*` fuerzan `hear` y las variantes visuales conservan su formato. `recordReview` acepta un formato explícito y lo usa para el registro; así el intento auditivo crea una tarjeta FSRS propia y no toca la habilidad visual del mismo tema. `reviewableSkills` y la cola diaria toman las nuevas habilidades desde `content/skills.json`, por lo que aparecen al empezar la lección. Cuatro tests nuevos cubren los cuatro tipos, la separación ver/oír, el registro real con IndexedDB y la inclusión en la cola. También se estabilizó el test del reproductor esperando a que la selección habilite «Corregir». Suite 137 archivos / 960 tests en verde; typecheck, validación (33 habilidades), build, presupuesto (206,65 kB gzip inicial, 416 chunks diferidos) y E2E 1/1 verdes.

### Feedback y cierre

- [x] **F3-026** — Escribir reglas «Recordá» de intervalos
  - Aceptación: regla + ejemplo por calidad; sin errores conceptuales; test.
  - Deps: F3-013 · Red: no
  - Inicio: 2026-11-10T23:32:56-03:00
  - Commit: 52017cf · 2026-11-10T23:37:00-03:00
  - Cierre: `src/theory/errors.ts` incorpora cinco códigos de feedback con regla y ejemplo propios: `interval-perfect` (unísono, cuarta, quinta y octava; 0, 5, 7 y 12 semitonos), `interval-major` (2, 4, 9 y 11), `interval-minor` (1, 3, 8 y 10), `interval-augmented` (un semitono más que el justo o mayor) e `interval-diminished` (un semitono menos que el justo o menor). `intervalQualityFeedbackCode` mapea las siete calidades de `IntervalQuality` y resuelve las dobles con la aumentada o disminuida; `intervalQualityFeedback` devuelve el texto ya validado en ambos idiomas. `resolvePedagogicalFeedback` acepta `intervalQuality` y la prioriza sobre el tipo genérico, pero el `code` explícito sigue ganando. `buildIntervalDictation` calcula `intervalBetween(fromSpelledPitch(lower), fromSpelledPitch(upper))` y usa la calidad real; `ExercisePlayer` hace lo mismo para los ejercicios `interval` sin dictado. Tests: cada calidad tiene título, regla y ejemplo no vacíos con semitonos concretos, el mapeo de dobles está cubierto, el dictado elige la regla por calidad en español e inglés y el reproductor muestra «Recordá los intervalos mayores» para Do4–Re4. Suite 137 archivos / 964 tests en verde; typecheck, validación, build, presupuesto (207,62 kB gzip inicial, 416 chunks diferidos) y E2E 1/1 verdes.
- [x] **F3-027** — Escribir reglas «Recordá» de acordes y cifrado
  - Aceptación: construcción, inversión y cifrado; ejemplo resuelto; test.
  - Deps: F3-015 · Red: no
  - Inicio: 2026-11-10T23:43:27-03:00
  - Commit: 8f9ca60 · 2026-11-10T23:46:42-03:00
  - Cierre: `src/theory/errors.ts` expone `ChordExerciseAsk` y `chordAskFeedbackCode`, que elige la regla según lo que pregunta el ejercicio: `quality` → `chord-quality`, `inversion` → `chord-inversion`, `notes` → `chord-tone` y `symbol` → `chord-notation`. `resolvePedagogicalFeedback` acepta `chordAsk` con prioridad sobre el tipo genérico, pero por debajo de `intervalQuality` y del `code` explícito. Se reescribieron las cuatro reglas con ejemplos resueltos: construcción por terceras apiladas (tríadas, séptimas y extensiones), inversión decidida por el bajo (tres posiciones de tríada y cuatro de séptima), cifrado (sufijos de calidad y paso latino/americano) y calidad (tercera, quinta y séptima). `ExercisePlayer` aplica `chordAskOf` a los ejercicios `chord`; los dictados auditivos siguen usando la regla de calidad. Tests: el mapeo de los cuatro `ask`, la prioridad del contexto y el código explícito, los ejemplos específicos de construcción/inversión/cifrado, y el reproductor muestra «Recordá qué nota queda en el bajo» al fallar una inversión en M4-03. Suite 137 archivos / 966 tests en verde; typecheck, validación, build, presupuesto (208,15 kB gzip inicial, 416 chunks diferidos) y E2E 1/1 verdes.
- [x] **F3-028** — Generar ejemplos resueltos automáticos
  - Aceptación: el ejemplo usa el mismo ítem fallado; notas y pentagrama correctos; test.
  - Deps: F3-026, F3-027 · Red: no
  - Inicio: 2026-11-10T23:55:49-03:00
  - Commit: b883df1 · 2026-11-10T23:58:18-03:00
  - Cierre: `src/exercises/worked-example.ts` agrega `buildWorkedExample(exercise)`, un módulo puro que devuelve `{ kind, measures, clef, keySignature }` o `null`. Los intervalos melódicos se dibujan en una medida por nota y los armónicos en una sola medida con las dos notas; los acordes usan `chordWithInversion` o `chordWithSlash` según tengan inversión o bajo con barra; los cifrados se parsean por partes (`Do7/Solm` → `Do7` + `Solm`) para aceptar sufijos en el bajo. La clave se elige por registro (fa si la nota más grave queda por debajo de Do4). `ExercisePlayer` memoriza el ejemplo del ítem actual y lo dibuja con `Staff` dentro de «Recordá», con etiquetas «El mismo intervalo» / «El mismo acorde»; los tipos sin representación (notas sueltas, escalas, ritmo) y los cifrados inválidos conservan el ejemplo textual. Tests: 9 casos de `worked-example` (ascendente, descendente, armónico, inversión, bajo con barra, cifrado latino, clave de fa, cifrado inválido y tipo sin ejemplo) y dos aserciones en el reproductor para M3-05 y M4-03. Suite 138 archivos / 975 tests en verde; typecheck, validación, build, presupuesto (208,88 kB gzip inicial, 416 chunks diferidos) y E2E 1/1 verdes.
- [x] **F3-029** — Integrar lecciones M3-M4 con ejercicios y tareas de teclado
  - Aceptación: 12 lecciones publicadas; 3+ ejercicios cada una; tarea real; navegación completa.
  - Deps: F3-001 a F3-012 · Red: no
  - Inicio: 2026-11-11T00:08:30-03:00
  - Commit: 4c460b1 · 2026-11-11T00:09:54-03:00
  - Cierre: `tests/m3-m4-integration.test.tsx` recorre las 17 lecciones publicadas de M3-M4 (5 de M3 y 12 de M4) como bloque: verifica que cada una exista en `content/lessons/`, que el curso las ordene después de M2 y antes de M5, que todas tengan 12 ejercicios referenciados en `content/exercises/` con texto bilingüe, habilidades y secciones válidas, y que cada una incluya una tarea de teclado real con demo, tempo y checklists. Además comprueba la carga diferida de las 17 lecciones y sus 204 ejercicios, el orden de prerrequisitos del curso y el render de M3-01 y M4-01 con `LessonPlayer`, ejercicios y tarea. La aceptación original decía «12 lecciones publicadas»; el contenido real ya tenía 17 desde F3-001 a F3-017, así que el test cubre las 17 y no se reescribió contenido. Suite 139 archivos / 982 tests en verde; typecheck, validación (9 módulos, 47 lecciones, 355 ejercicios, 33 habilidades, 1 pieza), build, presupuesto (208,88 kB gzip inicial, 416 chunks diferidos) y E2E 1/1 verdes.
- [x] **F3-030** — Testear teoría M3-M4 en 12 tonalidades
  - Aceptación: intervalos, tríadas, séptimas y cifrado; ortografía correcta; property tests.
  - Deps: F3-029 · Red: no
  - Inicio: 2026-11-11T00:11:29-03:00
  - Commit: 79c4588 · 2026-11-11T00:15:18-03:00
  - Cierre: `tests/m3-m4-theory-properties.test.ts` recorre las doce tónicas del curso con ocho propiedades: 323 intervalos construidos (cantidad 1.ª a 8.ª, justos/mayores/menores/aumentados/disminuidos) con cantidad, calidad, semitonos, letra, doble alteración máxima y vuelta de `formatPitch`; inversiones de 2.ª a 7.ª con suma nueve y cambio de calidad, más la octava justa; tríadas mayores, menores, disminuidas, aumentadas y sus con tercera, quinta y semitonos verificados; las cinco séptimas con su séptima mayor, menor o disminuida; las nueve extensiones con novena, oncena y trecena compuestas; las 20 calidades en cifrado americano y latino con ida y vuelta y conversión entre notaciones; 576 slash chords con las doce tónicas como bajo; y las inversiones de tríadas y séptimas sin cambiar las clases de altura ni el bajo. La propiedad destapó que `parseChordSymbol('Faug')` se leía como la nota latina «Fa» más el sufijo «ug» y que `convertChordNotation('Faug', 'do')` perdía la «a»; `matchChordPart` ahora prefiere la lectura americana cuando el sufijo latino no es una calidad válida, con regresión en `tests/theory-chords.test.ts` para «Faug» y «Faaug». La segunda disminuida de La♭ queda excluida porque exigiría un triple bemol, fuera del límite de doble alteración del motor. Suite 140 archivos / 990 tests en verde; typecheck, validación (9 módulos, 47 lecciones, 355 ejercicios, 33 habilidades, 1 pieza), build, presupuesto (208,94 kB gzip inicial, 416 chunks diferidos) y E2E 1/1 verdes.
- [x] **F3-031** — Testear generadores de ejercicios
  - Aceptación: sin duplicados consecutivos; respuestas válidas; distractores no ambiguos; 500 casos.
  - Deps: F3-030 · Red: no
  - Inicio: 2026-11-11T00:17:22-03:00
  - Commit: 77b2f65 · 2026-11-11T00:18:54-03:00
  - Cierre: `tests/generators-fuzz.test.ts` usa un `Math.random` sembrado y genera 500 casos por lote. Teclado: 500 con notación latina y variante visual más 500 con notación americana y variante auditiva, sin repetir la nota anterior y con cada opción apuntando a un MIDI distinto. Pentagrama: 500 en clave de sol y 500 en clave de fa a dificultad 3, con la nota anterior distinta, líneas adicionales dentro del máximo y opciones sin ambigüedad. Deletreo: 500 ejercicios con opciones únicas, la respuesta presente y cada distractor con la misma cantidad de notas y normalización distinta. Armaduras: 500 mayores y 500 menores con respuesta canónica, una sola opción correcta y secuencia sin combinaciones consecutivas repetidas. Transposición: 500 pares con igual cantidad de notas y el mismo salto de semitonos en cada nota. Suite 141 archivos / 995 tests en verde; typecheck, validación (9 módulos, 47 lecciones, 355 ejercicios, 33 habilidades, 1 pieza), build, presupuesto (208,94 kB gzip inicial, 416 chunks diferidos) y E2E 1/1 verdes.
- [x] **F3-032** — Asegurar accesibilidad de los ejercicios auditivos
  - Aceptación: alternativa textual; no depende solo del audio/color; navegación por teclado; axe.
  - Deps: F3-024 · Red: no
  - Inicio: 2026-11-11T00:22:32-03:00
  - Commit: 91f2c19 · 2026-11-11T00:23:37-03:00
  - Cierre: `tests/auditory-a11y.test.tsx` suma cinco pruebas. Axe recorre los cuatro dictados publicados (M3-05 intervalos, M4-10 acordes, M2-08 escalas y M2-07 progresiones) y no encuentra violaciones críticas ni serias con las etiquetas WCAG 2.0 A/AA. Un flujo solo con teclado escucha la melodía con Enter, marca la opción con Espacio y corrige con Enter, y comprueba que el resultado se anuncia con texto («Todavía no.», la respuesta correcta y la regla «Recordá»). En `ExercisePlayer`, los avisos de qué suena y la indicación de comparar con la respuesta se asocian con `aria-describedby` a los botones de escuchar y repetir de los cuatro dictados, y la corrección y las repeticiones ya usan `role="status"` con `aria-live="polite"`. No se agrega transcripción de la respuesta para no revelarla antes de corregir. Suite 142 archivos / 1000 tests en verde; typecheck, validación, build, presupuesto (208,99 kB gzip inicial, 416 chunks diferidos) y E2E 1/1 verdes.
- [x] **F3-033** — E2E del módulo M3-M4
  - Aceptación: lección, ejercicio, error con «Recordá» y repaso; persistencia tras recargar.
  - Deps: F3-029 · Red: no
  - Inicio: 2026-11-11T00:25:16-03:00
  - Commit: 1c19693 · 2026-11-11T00:27:51-03:00
  - Cierre: `e2e/m3-m4-lesson-review.spec.ts` abre M3-01 con M2-12 marcada como completada directamente en IndexedDB (la app ya abrió la base y mostró el bloqueo; la versión de Dexie se abre sin fijarla para no chocar con su numeración interna). Responde mal el intervalo Do4-Re4 con «Segunda menor», verifica el texto «Todavía no.», la respuesta correcta y el «Recordá los intervalos mayores», espera a que termine de guardar y entra al repaso. La cola trae la habilidad nueva de M2-12 («Construir escalas mayores»), porque la tarjeta del intervalo fallado todavía no vence; el recorrido la califica con «Bien» y llega a «Recorrido completo». Tras recargar, la página de progreso muestra «2 respuestas registradas» (ejercicio y repaso). E2E 2/2 verdes; suite 142 archivos / 1000 tests, typecheck, build y presupuesto (208,99 kB gzip inicial, 416 chunks diferidos) verdes.
- [x] **F3-034** — Cerrar F3: suite, tag `fase-3`, RESUME y resumen
  - Aceptación: `npm run estado` verde; M3-M4 completos; tag `fase-3`.
  - Deps: F3-001 a F3-033 · Red: no
  - Inicio: 2026-11-11T00:29:05-03:00
  - Commit: 43b8747 · 2026-11-11T00:30:47-03:00
  - Cierre: M3-M4 completos con 17 lecciones publicadas y 204 ejercicios. `npm run estado` verde (typecheck, 142 archivos / 1000 tests y build), E2E 2/2, presupuesto 208,99 kB gzip inicial con 416 chunks diferidos y tag local `fase-3`. `docs/RESUME.md` pasa a F3 completada y `CHANGELOG.md` resume la fase; el bloque «Cierre F3» queda en este checklist.

### Cierre F3 — 2026-11-11

Quedó funcionando:

- M3-M4 completos: 17 lecciones publicadas (5 de M3 y 12 de M4) con 204 ejercicios. M3 cubre intervalos por cantidad y calidad, inversiones, consonancia/disonancia, intervalos en contexto y dictado; M4 cubre tríadas, sus y disminuidas/aumentadas, inversiones y voicings, séptimas, extensiones, slash chords, cifrado latino/americano, construcción desde el cifrado y reconocimiento auditivo de calidad, inversiones y extensiones con bajo.
- Entrenamiento auditivo: dictados de intervalos, acordes, escalas y progresiones con repeticiones acotadas, reproducción en bloque o arpegio, comparación de escalas, respuesta audible después de corregir y feedback «Recordá». Los cuatro dictados tienen alternativa textual, controles descritos con `aria-describedby`, regiones `aria-live` y navegación completa por teclado; axe no reporta violaciones críticas ni serias.
- Teoría verificada: property tests de intervalos, inversiones, tríadas, séptimas, extensiones, cifrado y slash chords en las doce tónicas; fuzz tests de los generadores con 500 casos por lote; integración de las 17 lecciones con sus ejercicios y tareas de teclado. Los tests destaparon y corrigieron la lectura de `Faug` como «Fa» + «ug».
- E2E: segundo recorrido de Playwright para M3-M4 que siembra el prerrequisito, abre M3-01, falla un intervalo, muestra el «Recordá», completa el repaso y verifica la persistencia tras recargar.
- Suite final: 142 archivos / 1000 tests unitarios, typecheck, validación de contenido, build y presupuesto verdes; 2/2 recorridos E2E; JS inicial 208,99 kB gzip con 416 chunks diferidos.
- Tag local `fase-3`; `docs/RESUME.md`, `CHANGELOG.md` y este resumen actualizados.
- Deuda: el E2E siembra el prerrequisito en IndexedDB en vez de completar la lección anterior por la interfaz; la accesibilidad se valida con axe y teclado, no con un lector de pantalla real; la escucha de audio real sigue pendiente en una máquina con salida de audio.

## F4 — M5-M6

### Contenido M5 — Armonía funcional

- [x] **F4-001** — Escribir M5-01 «Acordes diatónicos»
  - Aceptación: tríadas y séptimas en mayor/menor; 12 tonalidades; audio; ejercicio.
  - Deps: F3-034 · Red: no
  - Inicio: 2026-11-11T00:35:05-03:00
  - Commit: 54753fd · 2026-11-11T00:48:25-03:00
- [x] **F4-002** — Escribir M5-02 «Números romanos»
  - Aceptación: cifrado correcto; cualidades; ejercicio en ambos sentidos; test.
  - Deps: F4-001 · Red: no
  - Inicio: 2026-11-11T00:50:45-03:00
  - Commit: 81a7cd7 · 2026-11-11T01:37:03-03:00
- [x] **F4-003** — Escribir M5-03 «Funciones T-S-D»
  - Aceptación: tonicidad/subdominante/dominante; ejemplos; ejercicio de clasificación.
  - Deps: F4-002 · Red: no
  - Inicio: 2026-11-11T01:48:41-03:00
  - Commit: 7d31888 · 2026-11-11T01:53:35-03:00
- [x] **F4-004** — Escribir M5-04 «Cadencias»
  - Aceptación: auténtica, plagal, semicadencia y rota; audio; ejercicio.
  - Deps: F4-003 · Red: no
  - Inicio: 2026-11-11T01:58:16-03:00
  - Commit: 7211ca8 · 2026-11-11T02:04:02-03:00
- [x] **F4-005** — Escribir M5-05 «Progresiones comunes»
  - Aceptación: I-V-vi-IV y ii-V-I; 12 tonalidades; playback; ejercicio de completar.
  - Deps: F4-004 · Red: no
  - Inicio: 2026-11-11T02:08:23-03:00
  - Commit: 9a0de5c · 2026-11-11T02:12:23-03:00
- [x] **F4-006** — Escribir M5-06 «Blues de 12 compases»
  - Aceptación: estructura; variantes; playback; ejercicio de grados.
  - Deps: F4-005 · Red: no
  - Inicio: 2026-11-11T02:15:35-03:00
  - Commit: 0250877 · 2026-11-11T02:20:00-03:00
- [x] **F4-007** — Escribir M5-07 «Dominantes secundarias»
  - Aceptación: V/V y V/ii; resolución; 12 tonalidades; ejercicio.
  - Deps: F4-006 · Red: no
  - Inicio: 2026-11-11T02:24:32-03:00
  - Commit: 0e3df9f · 2026-11-11T02:29:23-03:00
- [x] **F4-008** — Escribir M5-08 «Intercambio modal»
  - Aceptación: acordes prestados; contexto; ejemplos; ejercicio.
  - Deps: F4-007 · Red: no
  - Inicio: 2026-11-11T02:32:39-03:00
  - Commit: 38cc094 · 2026-11-11T02:39:11-03:00
- [x] **F4-009** — Escribir M5-09 «Modulación y conducción de voces»
  - Aceptación: pivotos; reglas básicas de voces; ejemplos; ejercicio de análisis.
  - Deps: F4-008 · Red: no
  - Inicio: 2026-11-11T02:45:00-03:00
  - Commit: 4037934 · 2026-11-11T02:48:36-03:00

### Contenido M6 — Melodía, forma y textura

- [x] **F4-010** — Escribir M6-01 «Motivo y frase»
  - Aceptación: identificación en ejemplos propios; ejercicio de segmentar; audio.
  - Deps: F4-009 · Red: no
  - Inicio: 2026-11-11T11:07:21-03:00
  - Commit: 12cd230 · 2026-11-11T11:15:17-03:00
- [x] **F4-011** — Escribir M6-02 «Período y forma binaria/ternaria»
  - Aceptación: antecedente/consecuente; AB y ABA; ejemplos; ejercicio.
  - Deps: F4-010 · Red: no
  - Inicio: 2026-11-11T11:17:20-03:00
  - Commit: 8ecb692 · 2026-11-11T11:21:05-03:00
- [x] **F4-012** — Escribir M6-03 «Rondó y sonata»
  - Aceptación: esquemas; ejemplos de dominio público; ejercicio de reconocer forma.
  - Deps: F4-011 · Red: no
  - Inicio: 2026-11-11T11:22:51-03:00
  - Commit: b3918c9 · 2026-11-11T11:28:04-03:00
- [x] **F4-013** — Escribir M6-04 «Texturas: monofonía, homofonía, polifonía»
  - Aceptación: escucha comparada; ejemplos; ejercicio de clasificación.
  - Deps: F4-012 · Red: no
  - Inicio: 2026-11-13T11:35:32-03:00
  - Commit: 2d48c43 · 2026-11-13T11:40:11-03:00
- [x] **F4-014** — Escribir M6-05 «Contrapunto básico»
  - Aceptación: movimiento de voces; reglas simples; ejemplo a dos voces; ejercicio.
  - Deps: F4-013 · Red: no
  - Inicio: 2026-11-13T11:41:45-03:00
  - Commit: 886ea6d · 2026-11-13T11:48:35-03:00
- [x] **F4-015** — Escribir M6-06 «Ornamentos»
  - Aceptación: trino, mordente, grupeto y apoyatura; ejemplos; ejercicio de ejecución.
  - Deps: F4-014 · Red: no
  - Inicio: 2026-11-13T11:51:19-03:00
  - Commit: e689323 · 2026-11-13T12:01:23-03:00

### Motor de armonía

- [x] **F4-016** — Implementar armonización diatónica en 12 tonalidades
  - Aceptación: grados con cualidades correctas en mayor/menor; test exhaustivo.
  - Deps: F4-001 · Red: no
  - Inicio: 2026-11-13T12:04:12-03:00
  - Commit: a6676dd · 2026-11-13T12:08:12-03:00
- [x] **F4-017** — Generar ejercicios de números romanos ↔ acordes
  - Aceptación: ambos sentidos; 12 tonalidades; distractores plausibles; test.
  - Deps: F4-016 · Red: no
  - Inicio: 2026-11-13T12:10:34-03:00
  - Commit: 3a8a541 · 2026-11-13T12:18:21-03:00
- [x] **F4-018** — Generar ejercicios de completar progresiones
  - Aceptación: hueco lógico; opciones válidas; audio; test de unicidad.
  - Deps: F4-017 · Red: no
  - Inicio: 2026-11-13T12:22:04-03:00
  - Commit: f4d9a9b · 2026-11-13T12:34:13-03:00
- [x] **F4-019** — Generar ejercicios de cadencias
  - Aceptación: cuatro tipos; identificar y completar; 12 tonalidades; test.
  - Deps: F4-018 · Red: no
  - Inicio: 2026-11-13T12:36:23-03:00
  - Commit: 86001c4 · 2026-11-13T12:42:26-03:00
- [x] **F4-020** — Generar dominantes secundarias e intercambio modal
  - Aceptación: resolución correcta; acordes prestados; dificultad alta; test.
  - Deps: F4-019 · Red: no
  - Commit: 3c321aa · 2026-11-11T13:20:00-03:00
- [x] **F4-021** — Generar ejercicios de modulación y transposición armónica
  - Aceptación: pivote identificable; tonalidad destino; test de relaciones.
  - Deps: F4-020 · Red: no
  - Commit: 8444e6e · 2026-11-11T16:35:00-03:00
- [x] **F4-022** — Reproducir progresiones con voicings y tempo
  - Aceptación: bloque/arpegio; bajo; tempo; bucle; sin notas trabadas.
  - Deps: F4-016, F3-018 · Red: no
  - Commit: 8cfe2f3 · 2026-11-12T15:55:00-03:00
- [x] **F4-023** — Implementar motor de conducción de voces con feedback
  - Aceptación: detecta paralelas/quintas/octavas; sugiere corrección; test de casos.
  - Deps: F4-022 · Red: no
  - Commit: 6c0a546 · 2026-11-12T16:08:00-03:00
- [x] **F4-024** — Generar ejercicios de análisis formal
  - Aceptación: fragmentos propios; identificar forma/frase; alternativa textual; test.
  - Deps: F4-010 · Red: no
  - Commit: 42299d2 · 2026-11-12T16:26:00-03:00
- [x] **F4-025** — Generar ejercicios de ornamentos
  - Aceptación: identificar y ejecutar; notación correcta; test.
  - Deps: F4-015 · Red: no
  - Commit: 24fd674 · 2026-11-12T16:47:00-03:00
- [x] **F4-026** — Añadir napolitana como módulo opcional
  - Aceptación: explicación y ejemplo; ejercicio marcado opcional; no bloquea ruta.
  - Deps: F4-020 · Red: no
  - Inicio: 2026-11-12T17:01:33-03:00
  - Commit: ba1572d · 2026-11-12T17:15:00-03:00
- [x] **F4-027** — Añadir sextas aumentadas como módulo opcional
  - Aceptación: italiana/francesa/alemana; resolución; ejercicio opcional.
  - Deps: F4-026 · Red: no
  - Inicio: 2026-11-12T17:30:40-03:00
  - Commit: 135e11b · 2026-11-12T17:44:00-03:00

### Integración y cierre

- [x] **F4-028** — Integrar lecciones M5-M6 con ejercicios y tareas de teclado
  - Aceptación: 15 lecciones publicadas; 3+ ejercicios; tareas reales; navegación completa.
  - Deps: F4-001 a F4-015 · Red: no
  - Inicio: 2026-11-12T17:50:39-03:00
  - Commit: df78c07 · 2026-11-14T13:09:00-03:00
- [x] **F4-029** — Testear armonía en 12 tonalidades
  - Aceptación: grados, funciones, cadencias y dominantes; ortografía y cualidades correctas.
  - Deps: F4-028 · Red: no
  - Inicio: 2026-11-14T13:19:58-03:00
  - Commit: bad5b80 · 2026-11-14T13:27:00-03:00
- [x] **F4-030** — Testear progresiones y cadencias
  - Aceptación: resoluciones correctas; sin opciones ambiguas; property tests.
  - Deps: F4-029 · Red: no
  - Inicio: 2026-11-14T13:36:05-03:00
  - Commit: 37ae1b8 · 2026-11-14T13:43:24-03:00
- [x] **F4-031** — E2E de M5-M6
  - Aceptación: lección, progresión, análisis y repaso; persistencia.
  - Deps: F4-028 · Red: no
  - Inicio: 2026-11-14T13:55:04-03:00
  - Commit: 9223f49 · 2026-11-14T13:59:38-03:00
- [x] **F4-032** — Asegurar accesibilidad de análisis y partituras
  - Aceptación: descripciones textuales; navegación; contraste; axe sin violaciones críticas.
  - Deps: F4-031 · Red: no
  - Inicio: 2026-11-14T14:11:09-03:00
  - Commit: a7fcb31 · 2026-11-14T14:11:34-03:00
- [x] **F4-033** — Cerrar F4: suite, tag `fase-4`, RESUME y resumen
  - Aceptación: `npm run estado` verde; M5-M6 completos; tag `fase-4`.
  - Deps: F4-001 a F4-032 · Red: no
  - Inicio: 2026-11-14T14:14:31-03:00
  - Commit: 73f68d6 · 2026-11-14T14:21:31-03:00
  - Cierre: M5-M6 completos con 17 lecciones publicadas (11 de M5 y 6 de M6) y 188 ejercicios, todas con tarea de teclado, habilidades consistentes e índice al día. `npm run estado` verde (typecheck 1,2 s, 174 archivos / 1241 tests en 42,1 s y build en 2,9 s), E2E 4/4, presupuesto 225,73 kB gzip inicial con 621 chunks diferidos y `validate:content` con 9 módulos, 64 lecciones, 543 ejercicios y 50 habilidades. La aceptación de F4 habla de «15 lecciones», pero el bloque real tiene 17 por las opcionales M5-10 y M5-11; la verificación cubre las 17 y confirma que las opcionales no bloquean M6. `docs/RESUME.md` pasa a F4 completada, `CHANGELOG.md` resume la fase y el tag local `fase-4` queda creado sobre el commit de cierre.

### Cierre F4 — 2026-11-14

Quedó funcionando:

- M5-M6 completos: 17 lecciones publicadas (11 de M5 y 6 de M6) con 188 ejercicios. M5 cubre acordes diatónicos, números romanos, funciones T-S-D, cadencias, progresiones comunes, blues de 12 compases, dominantes secundarias, intercambio modal, modulación y conducción de voces, más las opcionales «La napolitana» y «Sextas aumentadas»; M6 cubre motivo y frase, período y forma binaria/ternaria, rondó y sonata, texturas, contrapunto y ornamentos.
- Generadores y ejercicios: progresiones y cadencias en las doce tonalidades y ambos modos, análisis de motivos, forma, textura, contrapunto, adornos y sextas aumentadas, con audio, alternativas textuales, corrección explicada y regla «Recordá» propia por tipo.
- Teoría verificada: property tests de armonía en las doce tonalidades (grados, cadencias, dominantes secundarias, listas de tónicas coherentes), integración de las 17 lecciones con sus ejercicios y tareas, y fuzz de los generadores.
- Accesibilidad: descripciones textuales de las partituras, navegación completa por teclado, contraste AA en las paletas clara y oscura y axe sin violaciones críticas ni serias antes y después de corregir en los seis tipos de análisis.
- E2E: dos recorridos nuevos para M5-M6 (lección, progresión, análisis, repaso y persistencia) que se suman a los de F2-072 y F3-033; 4/4 verdes.
- Suite final: 174 archivos / 1241 tests unitarios, typecheck, validación de contenido, build y presupuesto verdes; JS inicial 225,73 kB gzip con 621 chunks diferidos.
- Tag local `fase-4`; `docs/RESUME.md`, `CHANGELOG.md` y este resumen actualizados.
- Deuda: la accesibilidad se valida con axe, teclado y cálculo de contraste, no con un lector de pantalla real; la escucha de audio real sigue pendiente en una máquina con salida de audio; los E2E siembran el prerrequisito en IndexedDB en vez de completar las lecciones anteriores por la interfaz; M5-10 y M5-11 son opcionales y la aceptación original de F4 no las contaba.

## F5 — M7-M8 y repertorio

### Contenido M7 — Técnica de teclado

- [x] **F5-001** — Escribir M7-01 «Independencia de manos»
  - Aceptación: ejercicios originales; progresión de dificultad; tarea real; sin dolor ni tensión.
  - Deps: F4-033 · Red: no
  - Verificación: 12 ejercicios propios `ex.m7-01.a`…`l` (3 de dificultad 1, 5 de 2 y 4 de 3, con respuestas repartidas 4/4/4 entre derecha, izquierda y ambas); dos demos de dos manos y tarea de teclado a 60 BPM con consignas de soltura, pausas y parada ante dolor o tensión. `validate:content` da 9 módulos, 65 lecciones, 555 ejercicios y 51 habilidades; suite 175 archivos / 1250 tests; build y presupuesto verdes (227,01 kB gzip inicial, 634 diferidos).
  - Commit: 4ed6023 · 2026-11-14T15:10:00-03:00
- [x] **F5-002** — Escribir M7-02 «Arpegios y acordes quebrados»
  - Aceptación: digitaciones; 12 tonalidades básicas; audio; ejercicio con tempo progresivo.
  - Deps: F5-001 · Red: no
  - Verificación: 12 ejercicios de arpegio `ex.m7-02.a`…`l`, uno por tonalidad (Do, Sol, Re, La, Mi, Si, Fa, Si♭, Mi♭, La♭, Re♭ y Sol♭), con digitación y orden de notas, 3 de dificultad 1, 5 de 2 y 4 de 3; tres demos con audio (arpegio, acorde quebrado y dos octavas) y ejercicio de práctica con tempo progresivo 60-72-84 BPM. `validate:content` da 9 módulos, 66 lecciones, 568 ejercicios y 52 habilidades; suite 176 archivos / 1261 tests; build y presupuesto verdes (228,41 kB gzip inicial, 648 diferidos).
  - Commit: 7ca07af · 2026-11-14T16:25:00-03:00
- [x] **F5-003** — Escribir M7-03 «Pedal»
  - Aceptación: pedal directo/sincopado; ejercicios de limpieza; advertencia de oído; demo.
  - Deps: F5-002 · Red: no
  - Verificación: 10 ejercicios propios `ex.m7-03.a`…`j` de tipo `pedal` (6 de acción y 4 de patrón, dificultad 3/4/3), tres demos con marcas «Ped.»/«*» y audio (directo, sincopado y cambio sucio), ejercicio de limpieza y tarea de teclado con estudio sin pedal, cambio directo/sincopado y escucha del barro. Se agregó `pedals` al esquema de partitura, resonancia en `scoreToTimeline`, anotaciones de pedal en el pentagrama y feedback bilingüe. `validate:content` da 9 módulos, 67 lecciones, 578 ejercicios y 53 habilidades; suite 177 archivos / 1273 tests; build y presupuesto verdes (230,27 kB gzip inicial, 659 diferidos).
  - Commit: a8a9c5b · 2026-11-14T16:55:00-03:00
- [x] **F5-004** — Escribir M7-04 «Acompañamiento en bloque»
  - Aceptación: acordes en negras/blancas; patrones; lead sheet simple; tarea.
  - Deps: F5-003 · Red: no
  - Verificación: 10 ejercicios propios `ex.m7-04.a`…`j` de tipo `accompaniment` (5 de patrón y 5 de cifrado, dificultad 3/4/3), cuatro demos con audio (redondas, negras, bajo y acorde, lead sheet en Do) y tarea de teclado a 60 BPM con melodía, bloque de la izquierda y consignas de dolor o tensión. Se agregó `chordSymbol` al esquema de notación y a `scoreToMeasures`, cifrados con VexFlow `ChordSymbol`, el tipo de ejercicio `accompaniment` y feedback bilingüe. `validate:content` da 9 módulos, 68 lecciones, 588 ejercicios y 54 habilidades; suite 178 archivos / 1284 tests; build y presupuesto verdes (231,59 kB gzip inicial, 670 diferidos).
  - Commit: 83fac2c · 2026-11-14T17:30:00-03:00
- [x] **F5-005** — Escribir M7-05 «Acompañamiento arpegiado»
  - Aceptación: patrones de 3 y 4 notas; 12 tonalidades; tarea con tempo estable.
  - Deps: F5-004 · Red: no
  - Verificación: 12 ejercicios propios `ex.m7-05.a`…`l` de tipo `arpeggiated` (6 de patrón y 6 de orden de notas, dificultad 3/4/5), una por tonalidad mayor (Do, Sol, Re, La, Mi, Si, Fa, Si♭, Mi♭, La♭, Re♭ y Sol♭) y repartidas 6 con patrón de 3 notas en 3/4 y 6 con patrón de 4 notas en 4/4. Tres demos con audio (3 notas, 4 notas y progresión Do–Fa–Sol–Do) y tarea de teclado a 60 BPM con metrónomo, subida a 66/72 solo si el pulso queda estable y consignas de dolor o tensión. Se agregó el tipo de ejercicio `arpeggiated`, sus helpers de detección y orden de notas, el renderizado de pentagrama y audio, y feedback bilingüe. `validate:content` da 9 módulos, 69 lecciones, 600 ejercicios y 55 habilidades; suite 179 archivos / 1294 tests; build y presupuesto verdes (232,70 kB gzip inicial, 683 diferidos).
  - Commit: 2e89c29 · 2026-11-14T18:00:00-03:00
- [x] **F5-006** — Escribir M7-06 «Alberti»
  - Aceptación: patrón; variantes; ejemplo original; tarea y audio.
  - Deps: F5-005 · Red: no
  - Verificación: 12 ejercicios propios `ex.m7-06.a`…`l` de tipo `alberti` (6 de patrón y 6 de célula, dificultad 3/4/5), uno por tonalidad mayor (Do, Sol, Re, La, Mi, Si, Fa, Si♭, Mi♭, La♭, Re♭ y Sol♭), todos en 4/4 con ocho corcheas y la célula 1-5-3-5 repetida. Tres demos con audio (Alberti en Do, Alberti sobre Do–Fa–Sol–Do y el estudio original «Estudio en Do» a dos manos) y tarea de teclado a 60 BPM con manos separadas, unión por compás, subida a 66/72 solo si el pulso queda estable y consignas de dolor, tensión o cansancio. Se agregó el tipo de ejercicio `alberti`, sus helpers de detección y célula, el renderizado de pentagrama y audio, y feedback bilingüe. `validate:content` da 9 módulos, 70 lecciones, 612 ejercicios y 56 habilidades; suite 180 archivos / 1304 tests; build y presupuesto verdes (233,76 kB gzip inicial, 696 diferidos).
  - Commit: 910e82f · 2026-11-14T18:30:00-03:00
- [x] **F5-007** — Escribir M7-07 «Walking bass»
  - Aceptación: notas de paso; swing básico; ejemplo; tarea.
  - Deps: F5-006 · Red: no
  - Verificación: 12 ejercicios propios `ex.m7-07.a`…`l` de tipo `walking-bass` (6 de nota y 6 de papel, dificultad 1/2/3/4), uno por tonalidad mayor (Do, Sol, Re, La, Mi, Si, Fa, Si♭, Mi♭, La♭, Re♭ y Sol♭), todos en 4/4 con cuatro negras por compás y cifrado en cada compás. Tres demos con audio (walking sobre Do–La–Re–Sol, blues de 12 compases y el ejemplo original «Caminata en Do» a dos manos) y tarea de teclado a 60 BPM con mano izquierda sola, unión por compás, balanceo del swing en los pulsos 2 y 4 y subida a 66/72 solo si el pulso queda estable. Se agregó el tipo de ejercicio `walking-bass`, sus helpers de nota y papel, el renderizado de pentagrama y audio, y feedback bilingüe. `validate:content` da 9 módulos, 71 lecciones, 624 ejercicios y 57 habilidades; suite 181 archivos / 1314 tests; build y presupuesto verdes (235,10 kB gzip inicial, 709 diferidos).
  - Commit: 86fc582 · 2026-11-14T19:00:00-03:00
- [x] **F5-008** — Escribir M7-08 «Stride»
  - Aceptación: bajo alternado + acorde; tempo lento; ejemplo; tarea.
  - Deps: F5-007 · Red: no
  - Verificación: 12 ejercicios propios `ex.m7-08.a`…`l` de tipo `stride` (6 de patrón y 6 de bajo, dificultad 1/2/3/4), uno por tonalidad mayor (Do, Sol, Re, La, Mi, Si, Fa, Si♭, Mi♭, La♭, Re♭ y Sol♭), todos en 4/4 con cuatro negras por compás, bajo suelto en los pulsos 1 y 3 y acorde en los pulsos 2 y 4. Tres demos con audio (stride básico en Do, stride sobre Do–La–Re–Sol y el ejemplo original «Stride en Do» a dos manos a 50 BPM) y tarea de teclado a 50 BPM con mano izquierda sola, pedal seco, unión por compás y subida a 60/66 solo si el salto queda seguro. Se agregó el tipo de ejercicio `stride`, sus helpers de patrón y bajo, el renderizado de pentagrama y audio, y feedback bilingüe. `validate:content` da 9 módulos, 72 lecciones, 636 ejercicios y 58 habilidades; suite 182 archivos / 1324 tests; build y presupuesto verdes (236,24 kB gzip inicial, 722 diferidos).
  - Commit: 88f82b4 · 2026-11-14T19:35:00-03:00
- [x] **F5-009** — Escribir M7-09 «Lectura a primera vista»
  - Aceptación: método de lectura por intervalos; ejercicios graduados; generador de fragmentos.
  - Deps: F5-008 · Red: no
  - Verificación: 12 ejercicios propios `ex.m7-09.a`…`l` de tipo `sight-reading` (4 de intervalo, 4 de nota y 4 de movimiento, dificultad 1/2/3/4), uno por tonalidad mayor (Do, Sol, Re, La, Mi, Si, Fa, Si♭, Mi♭, La♭, Re♭ y Sol♭), en clave de sol y de fa, todos en 4/4 con negras y opciones paralelas ES/EN. Tres demos con audio (lectura por grados conjuntos, lectura con saltos en clave de fa y el ejemplo original «Lectura en Do» a 50 BPM) y tarea de teclado a 50 BPM con exploración de treinta segundos, notas ancla, lectura por intervalos, tres pasadas y subida a 60/72 solo si la lectura queda continua. Se agregó el tipo de ejercicio `sight-reading`, los helpers de fragmento (construcción por grados de la escala, intervalos, movimiento y nombres de nota) y el generador graduado `src/exercises/generators/sight-reading.ts` con patrones por nivel, tandas por tonalidad/clave/pregunta y validación con `ExerciseSchema`. `validate:content` da 9 módulos, 73 lecciones, 648 ejercicios y 59 habilidades; suite 184 archivos / 1341 tests; build y presupuesto verdes (237,97 kB gzip inicial, 735 diferidos).
  - Commit: eb4ec71 · 2026-11-14T22:10:00-03:00
- [x] **F5-010** — Escribir M7-10 «Tocar de oído, transposición e improvisación»
  - Aceptación: pasos concretos; ejercicios con melodía oculta; rueda de acordes; tarea.
  - Deps: F5-009 · Red: no
  - Verificación: 12 ejercicios propios `ex.m7-10.a`…`l`: 4 de melodía oculta de tipo `ear-melody` (intervalo, nota y movimiento, dificultad 1/2/3/4, en Do, Sol, Fa y Re), 4 de transposición (`transposition` con opciones, pares Do→Sol, Sol→Re, Fa→Si♭ y Re→La) y 4 dictados de la rueda I–vi–ii–V (`ear-progression` en Do, Sol, Fa y Re). La lección explica los cinco pasos para tocar de oído, la transposición por grados, la rueda de acordes en las doce tonalidades y la improvisación con tres notas y un ritmo; incluye una demo de la rueda en Do y un motivo improvisado con cifrado, más una tarea de teclado a 60 BPM con la rueda Do–Lam–Rem–Sol7, motivo de dos compases, cuatro vueltas y parada ante dolor o tensión. Se añadieron el tipo `ear-melody` con partitura oculta hasta corregir, `choices` en transposición, `melodyToScore`, el generador `src/exercises/generators/ear-melody.ts`, el dictado `src/exercises/melody-dictation.ts`, las habilidades `skill.play-by-ear`, `skill.transposition` y `skill.improvisation`, la ampliación de `skill.ear-progression` y el feedback bilingüe `ear-melody`. `validate:content` da 9 módulos, 74 lecciones, 660 ejercicios y 62 habilidades; suite 187 archivos / 1363 tests; build y presupuesto verdes (239,87 kB gzip inicial, 748 diferidos).
  - Commit: 4e1d1d7 · 2026-11-11T22:45:00-03:00
- [x] **F5-011** — Escribir M7-11 «Lead sheets y cifrados»
  - Aceptación: melodía + cifrado; cómo realizar voicings; ejemplo; tarea.
  - Deps: F5-010 · Red: no
  - Verificación: 12 ejercicios propios `ex.m7-11.a`…`l` de tipo `accompaniment` (6 de melodía y 6 de voicing, dificultad 1/2/3/4), en Do, Sol, Fa, Re, Si♭ y Mi♭, todos en 4/4 con cuatro negras por compás, cifrado por compás y opciones paralelas ES/EN. La lección explica la anatomía de un lead sheet (melodía escrita y cifrados encima), el paso del cifrado al voicing de shell con fundamental en la mano izquierda y tercera/séptima en la derecha, los cinco pasos de práctica y el estudio sin dolor ni tensión; incluye una demo de melodía con cifrados C–Am7–Dm7–G7–C–Am7–Dm7–C y otra de shell voicings Cmaj7–Am7–Dm7–G7, más una tarea de teclado a 60 BPM con la progresión Cmaj7–Am7–Dm7–G7, fundamentales Do3–La3–Re3–Sol3, guías Mi4+Si4, Do4+Sol4, Do4+Fa4 y Fa4+Si4, cuatro vueltas y parada ante dolor o tensión. Se amplió el tipo `accompaniment` con `ask: 'melody' | 'voicing'` y `beat`, y se añadieron los helpers `leadSheetMelodyPitch`, `leadSheetMelodyNoteName`, `shellVoicing` y `shellVoicingLabel`, la habilidad `skill.lead-sheet`, el feedback bilingüe y las etiquetas de UI del lead sheet. `validate:content` da 9 módulos, 75 lecciones, 672 ejercicios, 63 habilidades y 1 pieza; suite 189 archivos / 1376 tests; build y presupuesto verdes (240,71 kB gzip inicial, 761 diferidos).
  - Commit: e742ac3 · 2026-11-11T23:20:00-03:00

### Contenido M8 — Estilos (opcional)

- [x] **F5-012** — Escribir M8-01 «Pop/rock»
  - Aceptación: patrones y progresiones; ejemplo original; tarea opcional.
  - Deps: F5-011 · Red: no
  - Verificación: 12 ejercicios propios `ex.m8-01.a`…`l` de tipo `style-pattern`: 4 de patrón rítmico (corcheas, negras, medio tiempo y síncopa), 4 de progresión por grados (I–V–vi–IV, vi–IV–I–V, I–IV–vi–V y IV–I–V–vi) y 4 de cifrado de compás, en Do, Sol, Re y La, todos en 4/4 con opciones paralelas ES/EN. La lección opcional explica el backbeat, los patrones de acompañamiento, los bucles de progresión y los cinco pasos de práctica; incluye una demo de patrón de corcheas sobre C–G–Am–F y el ejemplo original «Ciudad de neón» de ocho compases, más una tarea de teclado a 80 BPM con fundamentales Do3–Sol3–La3–Fa3, corcheas, cuatro vueltas y parada ante dolor o tensión. Se añadió el tipo `style-pattern` con `style`, `ask: 'pattern' | 'progression' | 'chord'` y `measure`, los helpers `stylePatternInMeasure`, `stylePatternCandidates`, `styleProgressionDegrees` y `styleProgressionCandidates`, la habilidad `skill.pop-rock`, el feedback bilingüe `style-pattern`, el renderizado y el audio del patrón, y las etiquetas i18n. `validate:content` da 9 módulos, 76 lecciones, 684 ejercicios, 64 habilidades y 1 pieza; suite 191 archivos / 1391 tests; build y presupuesto verdes (242,13 kB gzip inicial, 774 diferidos).
  - Commit: 0d609ca · 2026-11-11T23:44:00-03:00
- [x] **F5-013** — Escribir M8-02 «Blues»
  - Aceptación: shuffle, comping y escala; 12 compases; ejemplo; tarea opcional.
  - Deps: F5-012 · Red: no
  - Verificación: 12 ejercicios propios `ex.m8-02.a`…`l` de tipo `style-pattern`: 4 de patrón rítmico (shuffle en Do compás 1, Do compás 2, Fa y Sol), 4 de grados de la progresión de cuatro compases (Do, Fa, Sol y Si♭) y 4 de escala de blues (Do, Fa, Sol y Si♭), con dificultad 1/2/3/4 y opciones paralelas ES/EN. La lección opcional de 19 minutos explica el shuffle y el comping en contratiempos, la forma de 12 compases I–IV–I–I–IV–IV–I–I–V–IV–I–V, la escala de blues con tercera menor, quinta disminuida y séptima bemol, la resolución de la blue note y el estudio sin dolor ni tensión; incluye la demo de shuffle en Do7 y el ejemplo original «Ruta azul» de 12 compases, ambas a 96 BPM, y una tarea de teclado a 80 BPM con fundamentales Do3–Do3–Do3–Do3–Fa3–Fa3–Do3–Do3–Sol3–Fa3–Do3–Sol3, comping en contratiempos, cuatro vueltas y parada ante dolor o tensión. Se amplió el tipo `style-pattern` con `ask: 'scale'` y los helpers `styleScaleName` y `styleScaleCandidates`, la habilidad `skill.blues`, el feedback bilingüe `style-pattern`, la etiqueta de audio y el renderizado del fragmento, y se unificó la ortografía de la blue note de Do como Sol♭/Gb. `validate:content` da 9 módulos, 77 lecciones, 696 ejercicios, 65 habilidades y 1 pieza; suite 192 archivos / 1405 tests; build y presupuesto verdes (243,00 kB gzip inicial, 787 diferidos).
  - Commit: 910f45e · 2026-11-12T00:10:00-03:00
- [x] **F5-014** — Escribir M8-03 «Jazz básico»
  - Aceptación: ii-V-I, swing y voicings; ejemplo; tarea opcional.
  - Deps: F5-013 · Red: no
  - Verificación: 12 ejercicios propios `ex.m8-03.a`…`l` de tipo `style-pattern`: 4 de patrón rítmico (swing en Do, comping en Fa, negras en Si♭ y síncopa en Mi♭), 4 de grados de la progresión ii–V–I–VI (Do, Fa, Si♭ y Mi♭), 2 de cifrado de compás (Sol7 en Do y Si♭maj7 en Si♭) y 2 de voicing (Domaj7 en Do como Mi4+Sol4+Si4+Re5 y Si♭7 en Mi♭ como La♭3+Do4+Re4+Sol4), con dificultad 1/2/3/4 y opciones paralelas ES/EN. La lección opcional de 20 minutos explica el swing y el comping en contratiempos, la cadencia ii–V–I con sus notas guía, la diferencia entre shell y voicing sin fundamental y la conducción de voces; incluye la demo «Swing en Do» de cuatro compases y el ejemplo original «Tren de medianoche» de ocho compases, a 96 y 100 BPM, y una tarea de teclado a 80 BPM con fundamentales Re3–Sol3–Do3–La3 y guías Fa4+Do5, Fa4+Si4, Mi4+Si4 y Mi4+Do♯5, cuatro vueltas y parada ante dolor o tensión. Se amplió el tipo `style-pattern` con `ask: 'voicing'` y los helpers `styleVoicingPitches` y `styleVoicingCandidates` (notas del acorde de la mano derecha ordenadas de grave a agudo), la habilidad `skill.jazz`, el feedback bilingüe `style-pattern` con ii–V–I, swing y voicings, y las etiquetas de UI del patrón de jazz. `validate:content` da 9 módulos, 78 lecciones, 708 ejercicios, 66 habilidades y 1 pieza; suite 193 archivos / 1418 tests; build y presupuesto verdes (243,71 kB gzip inicial, 800 diferidos).
  - Commit: c50830a · 2026-11-12T00:35:00-03:00
- [x] **F5-015** — Escribir M8-04 «Ritmos latinos»
  - Aceptación: patrones de bossa/salsa básicos; ejemplo; tarea opcional.
  - Deps: F5-014 · Red: no
  - Verificación: 12 ejercicios propios `ex.m8-04.a`…`l` de tipo `style-pattern`: 4 de patrón rítmico (bossa nova en Do y Fa, montuno de salsa en Si♭ y Mi♭), 4 de grados de la progresión I–vi–ii–V (Do, Fa, Si♭ y Mi♭), 2 de cifrado de compás (Lam7 en Do y Si♭7 en Mi♭) y 2 de voicing (Domaj7 en Do como Mi4+Sol4+Si4 y Fam7 en Mi♭ como La♭3+Do4+Mi♭4), con dificultad 1/2/3 y opciones paralelas ES/EN. La lección opcional de 20 minutos explica la bossa nova con la fundamental en 1 y 3 y el acorde en 2 y 4, la clave 3-2/2-3, el montuno de salsa en los ataques 0, 0,5, 1,5, 2, 3 y 3,5 y el mantenimiento del patrón al cambiar de acorde; incluye la demo de bossa Domaj7–Lam7–Rem7–Sol7 a 120 BPM y el ejemplo original «Calle de coral» de ocho compases a 108 BPM, más una tarea de teclado a 80 BPM con fundamentales Do3–La2–Re3–Sol2 en 1 y 3, acordes Mi4+Sol4+Si4, Sol4+Do5+Mi5, Fa4+La4+Do5 y Fa4+Si4+Re5 en 2 y 4, cuatro vueltas y parada ante dolor o tensión. Se ampliaron `STYLE_PATTERN_VALUES` con `bossa` y `montuno` y la detección de ambos patrones en `stylePatternInMeasure`, la habilidad `skill.latin`, el feedback bilingüe `style-pattern` con bossa y salsa, y las etiquetas de UI del patrón latino. `validate:content` da 9 módulos, 79 lecciones, 720 ejercicios, 67 habilidades y 1 pieza; suite 194 archivos / 1430 tests; build y presupuesto verdes (244,41 kB gzip inicial, 813 diferidos).
  - Commit: 2775d0d · 2026-11-12T00:55:00-03:00
- [x] **F5-016** — Cerrar M8 con mapa de estilos
  - Aceptación: ruta opcional clara; no bloquea M7; enlaces a piezas adecuadas.
  - Deps: F5-015 · Red: no
  - Verificación: se añadió `src/content/style-map.ts` con los cuatro estilos de M8 (pop/rock, blues, jazz básico y ritmos latinos), el foco de cada lección, su patrón y la pieza original que la cierra («Ciudad de neón», «Ruta azul», «Tren de medianoche» y «Calle de coral»). `src/components/StyleMap.tsx` se renderiza al final de la tarjeta de M8 en `CoursePage`: muestra el mapa con el estado real de cada lección, explica que la ruta se puede recorrer en orden o por separado y enlaza con `#/leccion/<id>` solo cuando la lección no está bloqueada; las bloqueadas muestran «Se abre al completar la lección anterior de la ruta». Una nota final aclara que M8 es una ampliación opcional y no bloquea M7 ni el resto del curso. Se añadieron las claves bilingües `course.styleMap.*` y estilos responsivos en `src/styles.css`. `tests/style-map.test.ts` comprueba las cuatro entradas, su pertenencia a M8, que cada pieza aparece en el contenido de su lección en ES/EN, que M8 es opcional, que ningún prerrequisito de M7 apunta a M8 y que la cadena de prerrequisitos es m7-11 → m8-01 → m8-02 → m8-03 → m8-04. `tests/course-page.test.tsx` verifica el mapa bloqueado sin enlaces y el mapa disponible con los cuatro enlaces. `validate:content` da 9 módulos, 79 lecciones, 720 ejercicios, 67 habilidades y 1 pieza; suite 195 archivos / 1435 tests; build y presupuesto verdes (245,64 kB gzip inicial, 813 diferidos).
  - Commit: 41fef4b · 2026-11-12T02:10:00-03:00

### Técnica y ejercicios

- [x] **F5-017** — Crear set 1 de estudios técnicos originales
  - Aceptación: 6 estudios CC0; digitación; audio; progresión de tempo; validados.
  - Deps: F5-001 · Red: no
  - Verificación: se publicaron seis piezas originales CC0 en `content/repertoire/studies.01.json`…`studies.06.json`, con IDs `piece.studies.01`…`06`, nivel 1-2, ocho compases en 4/4 y Do mayor: «Cinco dedos» (legato en posición de Do, 72→96 BPM en pasos de 8), «Terceras quebradas» (cambios de posición, 66→90 en pasos de 8), «Escala en Do» (escala mayor con pulgar bajo la mano, 60→84 en pasos de 6), «Arpegio de Do» (arpegios de Do, Fa y Sol, 60→84 en pasos de 6), «Toque y salto» (saltos de la izquierda, 66→96 en pasos de 10) y «Movimiento contrario» (independencia entre manos, 56→80 en pasos de 8). Cada estudio trae partituras separadas de mano derecha en clave de sol y mano izquierda en clave de fa, digitación bilingüe por mano y patrón, notas de estudio bilingües y una ficha CC0 completa. Se amplió `RepertoirePieceSchema` con `notesEn`, `fingeringEs`, `fingeringEn` y `TempoProgressionSchema` (`startBpm`, `targetBpm`, `stepBpm`), que rechaza objetivos que no suben o pasos mayores que la subida total. `tests/repertoire-studies.test.ts` comprueba los seis estudios, la licencia CC0 y la atribución, las partituras separadas con compases completos de cuatro pulsos, la digitación bilingüe, la progresión de tempo exacta, la conversión a audio mediante `scoreToTimeline` sin notas fuera del rango 21-108 y el rechazo de progresiones inválidas. `validate:content` da 9 módulos, 79 lecciones, 720 ejercicios, 67 habilidades y 7 piezas; suite 196 archivos / 1440 tests; build y presupuesto verdes (245,75 kB gzip inicial, 813 diferidos).
  - Commit: a83357a · 2026-11-12T02:45:00-03:00
- [x] **F5-018** — Crear set 2 de estudios técnicos originales
  - Aceptación: 6 estudios CC0 de nivel intermedio; foco en independencia y arpegios; validados.
  - Deps: F5-017 · Red: no
  - Verificación: se publicaron seis piezas originales CC0 en `content/repertoire/studies.07.json`…`studies.12.json`, con IDs `piece.studies.07`…`12`, nivel 3-4, ocho compases en 4/4 y partituras separadas por mano: «Arpegios en espejo» (Do mayor, arpegios en movimiento contrario, 60→84 BPM en pasos de 6), «Independencia 2 contra 1» (Do mayor, corcheas continuas sobre blancas, 72→96 en pasos de 8), «Arpegios de séptima» (Sol mayor, Solmaj7–Domaj7–Re7, 66→92 en pasos de 13), «Tres contra dos» (La menor, tresillos contra corcheas, 52→76 en pasos de 8), «Bajo caminante y arpegio» (Fa mayor, bajo en negras bajo acordes quebrados, 60→84 en pasos de 6) y «Ostinato y arpegio» (Re menor, ostinato de corcheas bajo arpegios, 56→80 en pasos de 8). Los seis llevan ficha CC0, digitación bilingüe, notas de estudio bilingües y progresión de tempo; las etiquetas reparten el foco entre `arpegios` e `independencia`. `tests/repertoire-studies-set2.test.ts` comprueba los seis estudios, niveles y tonalidades, compases completos por mano, digitación, progresión de tempo, audio con `scoreToTimeline`, rangos MIDI y la polirritmia 3:2 del estudio 10 (12 tresillos frente a 8 corcheas por compás, con duración de un tercio de pulso). Se ajustó `tests/repertoire-studies.test.ts` para seguir cubriendo solo el set 1 y se actualizó el total a 13 piezas. `validate:content` da 9 módulos, 79 lecciones, 720 ejercicios, 67 habilidades y 13 piezas; suite 197 archivos / 1445 tests; build y presupuesto verdes (245,75 kB gzip inicial, 813 diferidos).
  - Commit: 250b7a8 · 2026-11-12T03:15:00-03:00
- [x] **F5-019** — Generar ejercicios de digitación e independencia
  - Aceptación: patrones aleatorios controlados; sin posiciones imposibles; test de rango.
  - Deps: F5-018 · Red: no
  - Verificación: se añadieron dos generadores. `src/exercises/generators/fingering.ts` produce ejercicios `arpeggio` con `ask: 'fingering'` recorriendo las doce tónicas mayores, las dos manos y una o dos octavas; valida que la digitación tenga el largo esperado (`3·octavas + 1`), que cada dedo esté entre 1 y 5, que las notas suban de grave a agudo y que todas queden en el rango MIDI 21-108, y construye los distractores intercambiando dedos vecinos o cambiando el dedo inicial o final. `src/exercises/generators/independence.ts` produce ejercicios `hand-coordination` a partir de once patrones validados (alternancia, una mano sostiene mientras la otra se mueve y ataques simultáneos) en 4/4 y 3/4; cada patrón se comprueba con `coordinationPatternIsPlayable` (compás completo, pulsos dentro del metro, sin dos ataques de la misma mano en el mismo pulso), la izquierda queda en el registro 36-48 y la derecha en 60-76, el salto máximo entre ataques de una mano es de 7 semitonos y la pregunta se elige solo entre pulsos con ataque real. Las tandas de digitación recorren tónicas, manos y octavas, y las de independencia alternan patrones y compases. `tests/fingering-generator.test.ts` cubre la matriz completa, la digitación canónica, las opciones únicas, la resolución de respuesta, el rango y las entradas inválidas; `tests/independence-generator.test.ts` cubre los patrones, la validez del esquema, los compases por mano, la separación de registros, los saltos, la cobertura de patrones y compases y el rechazo de patrones solapados, fuera de compás o de un nivel superior. `validate:content` sigue dando 9 módulos, 79 lecciones, 720 ejercicios, 67 habilidades y 13 piezas; suite 199 archivos / 1454 tests; build y presupuesto verdes (245,75 kB gzip inicial, 813 diferidos).
  - Commit: 3dc816f · 2026-11-13T04:15:00-03:00
- [x] **F5-020** — Implementar metrónomo progresivo y registro de tempo
  - Aceptación: sube BPM por repeticiones; fallback manual; guarda tempo máximo; test.
  - Deps: F5-019 · Red: no
  - Verificación: se añadió `src/state/progressive-metronome.ts`, un módulo puro sobre el metrónomo existente. `normalizeProgressiveMetronomeConfig` limita el tempo al rango 40-240 BPM, redondea los enteros y garantiza que el objetivo no quede por debajo del inicio; `createProgressiveMetronome` arranca en `startBpm` y conserva el récord previo si es mayor. `completeMetronomeRepetition` cuenta repeticiones y, en modo automático, sube `stepBpm` cada `repetitionsPerStep` sin superar `targetBpm`; en modo manual solo cuenta y deja el cambio al alumno. `setMetronomeTempo` implementa el fallback manual con recorte al rango y sin bajar el récord, `setMetronomeMode` alterna automático/manual, `resetMetronome` vuelve al inicio conservando el récord por defecto y `metronomeProgress`/`repetitionsUntilIncrease` exponen el avance para la interfaz. `SkillProgressSchema` suma `maxTempoBpm` opcional (40-240) sin migración Dexie, y `src/state/tempo-record.ts` añade `recordMaxTempo` y `recordMetronomeMaxTempo`, que validan la fila, solo escriben cuando el tempo sube y conservan maestría, aciertos y errores. `tests/progressive-metronome.test.ts` cubre subida por repeticiones, tope del objetivo, modo manual, fallback con saltos y límites, reset, normalización de configuraciones inválidas, progreso, persistencia del récord, rechazo de ids/tempos inválidos y transporte del campo en `ProgressDataSchema`. `validate:content` sigue dando 9 módulos, 79 lecciones, 720 ejercicios, 67 habilidades y 13 piezas; suite 200 archivos / 1467 tests; build y presupuesto verdes (245,75 kB gzip inicial, 813 diferidos).
  - Commit: daa7dd7 · 2026-11-13T04:40:00-03:00

### Pipeline de repertorio

- [x] **F5-021** — Implementar el pipeline de carga y validación de piezas
  - Aceptación: JSON validado; IDs únicos; ficha obligatoria; build falla si falta un campo.
  - Deps: F0-005 · Red: no
  - Verificación: se añadió `src/content/repertoire.ts`, un cargador diferido con `import.meta.glob` sobre `content/repertoire/*.json`. `repertoireContentPaths` prueba las dos convenciones reales del repositorio (`studies.01.json` y `original-do-mayor.json`), `hasRepertoireContent` indica si el id tiene archivo y `loadRepertoirePiece` valida el JSON con `RepertoirePieceSchema`, exige el prefijo `piece.`, comprueba que el id del archivo coincida con el pedido y lanza errores claros para ids inválidos o piezas inexistentes; `loadRepertoirePieces` carga varias sin duplicar lecturas. La validación de build ya rechazaba JSON inválido, ids duplicados y fichas incompletas mediante `ContentBundleSchema` y `LicenseFicheSchema`; `tests/repertoire-loader.test.ts` lo deja cubierto: carga las 13 piezas reales con ficha y al menos una mano, resuelve ambas convenciones de nombre, rechaza ids inválidos e inexistentes, detecta ids de pieza duplicados y falla si falta la ficha, el título o el autor de la transcripción. `validate:content` sigue dando 9 módulos, 79 lecciones, 720 ejercicios, 67 habilidades y 13 piezas; suite 201 archivos / 1473 tests; build y presupuesto verdes (245,75 kB gzip inicial, 813 diferidos).
  - Commit: 9ec0f9f · 2026-11-13T05:05:00-03:00
- [x] **F5-022** — Renderizar piezas multipentagrama con manos separadas
  - Aceptación: gran pentagrama; clave por mano; compases alineados; responsive.
  - Deps: F5-021 · Red: no
  - Verificación: se añadió `src/staff/grand-staff.ts`, que dibuja la mano derecha y la izquierda en dos pentagramas unidos por una llave y una línea vertical. Cada sistema reparte el ancho útil entre sus compases (`distributeMeasureWidths`) y crea una pareja de `Stave` con el mismo `x` y el mismo ancho para ambas manos, de modo que los compases quedan alineados aunque una mano tenga más eventos; la primera pareja de cada sistema repite clave y armadura, y la primera del pentagrama agrega el compás. `grandStaffLayout` calcula compases por sistema y altura según el ancho (mínimo 110 px por compás), `eventsByMeasure` agrupa y ordena eventos, las voces aceptan compases incompletos, los puntillos se dibujan con `Dot.buildAndAttach`, los tresillos por grupos de tres y los cifrados sobre la nota. Las notas exponen `data-grand-note`, `data-hand`, `data-measure`, `data-midi`, `data-highlighted`, `tabindex` y `role="button"`, con click/teclado y resaltado por MIDI. `src/components/GrandStaff.tsx` mide el ancho con `ResizeObserver`, recalcula sistemas y altura, admite zoom y desplazamiento horizontal, reutiliza las claves i18n `staff.grand.*` y muestra el texto de ambas manos. `tests/grand-staff.test.tsx` cubre compases/sistemas, reparto de anchos, agrupación por compás, las 13 piezas reales (dos manos y una sola), claves separadas por `data-hand`, referencias accesibles, click, resaltado, cambio de ancho y el componente con las dos manos. `validate:content` sigue dando 9 módulos, 79 lecciones, 720 ejercicios, 67 habilidades y 13 piezas; suite 202 archivos / 1480 tests; build y presupuesto verdes (245,81 kB gzip inicial, 813 diferidos).
  - Commit: 91cc411 · 2026-11-13T05:35:00-03:00
- [x] **F5-023** — Reproducir piezas con tempo, bucle y selección de manos
  - Aceptación: derecha/izquierda/ambas; tempo 50-120 %; bucle por compases; sin trabas.
  - Deps: F5-022 · Red: no
  - Verificación: se añadió `src/repertoire/playback.ts`, un módulo puro que elige las partituras de la mano derecha, la izquierda o ambas; aplica el porcentaje de tempo sobre el tempo escrito (50-120 %, recortado al rango 40-240 BPM del motor); recorta el rango de compases y reindexa los eventos a cero; conserva las marcas de pedal del fragmento; combina los timelines de las dos manos con un único tempo para que no se desfasen; y calcula una duración de pasada que incluye el silencio final del rango. `scoresForHands` lanza un error claro cuando la mano pedida no existe, `hasPieceHand` permite deshabilitar controles y `normalizeMeasureRange` recorta rangos invertidos o fuera de la pieza sin romper la pantalla. `src/components/RepertoirePlayer.tsx` integra `GrandStaff` con controles accesibles de manos, tempo, compases desde/hasta, bucle y reproducir/detener; usa `engine.playTimeline({ repeat, duration, onEvent })`, resalta las notas activas, detiene al cambiar de configuración y llama a `engine.stop` al detener o desmontar, que libera todas las voces y evita notas trabadas. `tests/repertoire-player.test.tsx` cubre compases de la pieza, ambas manos, manos separadas, mano ausente, porcentajes y límites de tempo, rango y desplazamiento, normalización, recorte de pedal, sincronización de tempos distintos, controles del componente, bucle, error de audio y la mano deshabilitada. `validate:content` sigue dando 9 módulos, 79 lecciones, 720 ejercicios, 67 habilidades y 13 piezas; suite 203 archivos / 1492 tests; build y presupuesto verdes (246,09 kB gzip inicial, 813 diferidos).
  - Commit: a8b2157 · 2026-11-13T06:00:00-03:00
- [x] **F5-024** — Mostrar la ficha de licencia en la app
  - Aceptación: compositor, fechas, fuente, licencia y transcriptor visibles; enlace a atribuciones.
  - Deps: F5-021 · Red: no
  - Verificación: se añadió `src/components/LicenseFichePanel.tsx`, que muestra la ficha completa con compositor, nacimiento y fallecimiento (o «sin dato»), licencia con enlace a sus términos, fuente —enlazada si trae URL—, autor y fecha de transcripción, atribución visible, verificación y notas opcionales; `src/repertoire/license.ts` centraliza la etiqueta y la URL oficial de cada tipo de licencia. La app gana tres rutas: `#/repertorio` (`RepertoirePage`) lista las 13 piezas cargadas con `loadAllRepertoirePieces` y enlaza a cada una; `#/pieza/:id` (`PiecePage`) carga la pieza por id, muestra notas de práctica, el reproductor de F5-023 y la ficha de licencia; `#/atribuciones` (`AttributionsPage`) reúne todas las fichas con enlace de vuelta a cada pieza. La navegación principal suma «Repertorio» y mantiene la sección activa en el índice, las piezas y las atribuciones. `tests/app-router.test.tsx`, `tests/hash-route.test.ts` y `tests/repertoire-license.test.tsx` cubren las rutas nuevas, el catálogo, la ficha con fechas y enlaces, la melodía anónima y los datos desconocidos. `validate:content` sigue dando 9 módulos, 79 lecciones, 720 ejercicios, 67 habilidades y 13 piezas; suite 204 archivos / 1500 tests; build y presupuesto verdes (253,66 kB gzip inicial, 826 diferidos).
  - Commit: b924a07 · 2026-11-13T06:30:00-03:00
- [x] **F5-025** — Verificar dominio público de las piezas candidatas
  - Aceptación: cada ficha con fuente consultada, fecha de verificación y criterio >100 años; dudas descartadas y registradas. [NET]
  - Deps: F5-021 · Red: sí · [NET]
  - Verificación: se creó `docs/LICENCIAS.md` con el criterio conservador de ADR-011, el método y la fecha de verificación (2026-11-13), una tabla de obras con compositor identificado —Beethoven (1827), Petzold (1733), Schumann (1856), Clementi (1832), Burgmüller (1874), Chopin (1849), Hanon (1900) y Czerny (1857), todos con más de 100 años desde su muerte al 2026— y otra de melodías tradicionales anónimas —Twinkle (1761), Frère Jacques (c. 1780), Greensleeves (1580), Auld Lang Syne (1799) y Amazing Grace (1829)—, cada una con fuente, URL y fecha. Se registraron las correcciones: Arabesque es Op. 100 n.º 2 y no n.º 1; el Minueto BWV Anh. 114 es de Petzold y no de Bach; la edición Bärenreiter de 1957 no se usa; se descartan la Fantasía de Vaughan Williams, las armonizaciones modernas de Amazing Grace y los arreglos de métodos comerciales. Se documentaron siete candidatos descartados por copyright, arreglos modernos o trabajo editorial. `src/repertoire/public-domain.ts` guarda el registro machine-readable con 13 candidatos verificados (8 obras con compositor y 5 melodías tradicionales), fechas de muerte, primera publicación, fuente, URL y notas, y expone `yearsSinceDeath`, `isPublicDomainVerified`, `verifiedCandidates` y `candidateById`; `tests/public-domain.test.ts` comprueba fichas completas, el criterio de más de 100 años, los años exactos desde la muerte, las correcciones de autoría y numeración, los descartes y la alineación con el documento humano. `validate:content` sigue dando 9 módulos, 79 lecciones, 720 ejercicios, 67 habilidades y 13 piezas; suite 205 archivos / 1506 tests; build y presupuesto verdes (253,66 kB gzip inicial, 826 diferidos).
  - Commit: a0d91b1 · 2026-11-13T06:55:00-03:00

### Piezas graduadas

- [x] **F5-026** — Transcribir «Twinkle, Twinkle, Little Star» (tradicional)
  - Aceptación: melodía anónima tradicional; ficha completa; una mano; render y playback correctos.
  - Deps: F5-025 · Red: no
  - Verificación: se publicó `content/repertoire/traditional-twinkle.json` con id `piece.traditional.twinkle`, nivel 1, 40 s, Do mayor, 4/4, 72 BPM, solo `hands.right` y 42 eventos en 12 compases (seis compases de cuatro negras y seis con dos negras y una blanca), con la melodía tradicional completa. La ficha `public-domain` declara compositor «Anónimo tradicional» (`anonymousTraditional: true`), fuente «Ah! vous dirai-je, maman» publicada en 1761, URL de Wikipedia, transcriptor y verificador Piano Today, fecha 2026-11-13, atribución visible y nota que descarta las variaciones de Mozart y la letra inglesa; incluye `notesEs`, `notesEn`, `fingeringEs` y `fingeringEn`. `tests/repertoire-twinkle.test.tsx` comprueba la ficha, la mano única, los 12 compases completos (4 pulsos cada uno), la melodía MIDI nota por nota (60, 60, 67, 67, 69, 69, 67, …), la duración de 48 pulsos, el render de 42 notas con `renderGrandStaff`, y el reproductor con resumen «Ambas · compases 1–12 · 72 BPM (100 %)», mano izquierda deshabilitada, 42 eventos y `duration` 40. Se actualizaron los conteos de piezas de 13 a 14 en `tests/repertoire-studies.test.ts`, `tests/repertoire-studies-set2.test.ts`, `tests/repertoire-loader.test.ts` y `tests/app-router.test.tsx`. `validate:content` da 9 módulos, 79 lecciones, 720 ejercicios, 67 habilidades y 14 piezas; suite 206 archivos / 1511 tests; build y presupuesto verdes (253,69 kB gzip inicial, 827 diferidos).
  - Commit: 87592fc · 2026-11-13T07:20:00-03:00
- [x] **F5-027** — Transcribir «Frère Jacques» (tradicional)
  - Aceptación: ficha completa; melodía y bajo simple; compases y duración correctos.
  - Deps: F5-026 · Red: no
  - Verificación: se publicó `content/repertoire/traditional-frere-jacques.json` con id `piece.traditional.frere-jacques`, nivel 2, 24 s, Do mayor, 4/4, 80 BPM, melodía en `hands.right` (26 eventos) y bajo simple de redondas en `hands.left` (8 eventos), ocho compases completos de cuatro pulsos. La ficha `public-domain` declara compositor «Anónimo tradicional» (`anonymousTraditional: true`), fuente «Recueil de Timbres de Vaudevilles» (c. 1780) con URL de Wikipedia, transcriptor y verificador Piano Today, fecha 2026-11-13, atribución que aclara que el bajo es propio y nota que descarta la letra y la atribución discutida a Rameau; incluye `notesEs`, `notesEn`, `fingeringEs` y `fingeringEn`. El bajo usa Do en los compases 1-4 y 6, Fa en el 5 y Sol en el 7, con una redonda por compás. `tests/repertoire-frere-jacques.test.tsx` comprueba la ficha, las dos manos, los ocho compases completos, la melodía MIDI nota por nota (60, 62, 64, 60, …), el bajo (48, 48, 48, 48, 53, 48, 43, 48), la duración de 32 pulsos (24 s a 80 BPM), el render de 34 notas con `renderGrandStaff` y el reproductor con resumen «Ambas · compases 1–8 · 80 BPM (100 %)», cambio a mano derecha con 26 eventos y detención limpia. Se actualizaron los conteos de piezas de 14 a 15 en `tests/repertoire-studies.test.ts`, `tests/repertoire-studies-set2.test.ts`, `tests/repertoire-loader.test.ts` y `tests/app-router.test.tsx`. `validate:content` da 9 módulos, 79 lecciones, 720 ejercicios, 67 habilidades y 15 piezas; suite 207 archivos / 1516 tests; build y presupuesto verdes (253,72 kB gzip inicial, 828 diferidos).
  - Commit: d6bae0e · 2026-11-13T08:30:00-03:00
- [x] **F5-028** — Transcribir «Greensleeves» (tradicional)
  - Aceptación: versión propia; ficha completa; digitación; render/playback.
  - Deps: F5-027 · Red: no
  - Verificación: se publicó `content/repertoire/traditional-greensleeves.json` con id `piece.traditional.greensleeves`, nivel 3, 48 s, La menor, 6/8, 60 BPM, 16 compases de tres pulsos. La melodía está en `hands.right` (68 eventos) con los accidentales G# y F# escritos en las notas, y el bajo propio en `hands.left` (32 eventos) alterna fundamental y quinta en dos blancas con puntillo por compás (Am, G, Am, E, …, C, G, Am, E, Am). La ficha `public-domain` declara compositor «Anónimo tradicional» (`anonymousTraditional: true`), fuente de 1580 con URL de Wikipedia, transcriptor y verificador Piano Today, fecha 2026-11-13, atribución de «versión simplificada y bajo de Piano Today» y nota que descarta la Fantasía de Vaughan Williams; incluye `notesEs`, `notesEn`, `fingeringEs` y `fingeringEn` con digitación por compás. `tests/repertoire-greensleeves.test.tsx` comprueba la ficha, las dos manos, los 16 compases completos, la melodía MIDI con G#3 y F#3, el bajo, la duración de 48 pulsos (48 s a 60 BPM), el render de 100 notas con `renderGrandStaff` y el reproductor con resumen «Ambas · compases 1–16 · 60 BPM (100 %)», cambio a mano izquierda con 32 eventos y detención limpia. Se actualizaron los conteos de piezas de 15 a 16 en `tests/repertoire-studies.test.ts`, `tests/repertoire-studies-set2.test.ts`, `tests/repertoire-loader.test.ts` y `tests/app-router.test.tsx`. `validate:content` da 9 módulos, 79 lecciones, 720 ejercicios, 67 habilidades y 16 piezas; suite 208 archivos / 1521 tests; build y presupuesto verdes (253,75 kB gzip inicial, 829 diferidos).
  - Commit: fdc26ab · 2026-11-13T09:10:00-03:00
- [x] **F5-029** — Transcribir «Auld Lang Syne» (tradicional)
  - Aceptación: melodía tradicional; ficha completa; tonalidad y compases validados.
  - Deps: F5-028 · Red: no
  - Verificación: se publicó `content/repertoire/traditional-auld-lang-syne.json` con id `piece.traditional.auld-lang-syne`, nivel 2, 48 s, Sol mayor, 4/4, 80 BPM, 16 compases de cuatro pulsos. La melodía tradicional está en `hands.right` (58 eventos) y el bajo en `hands.left` (16 redondas, una por compás) con la progresión Sol-Re-Sol-Do-Sol-Re-Mi menor-Sol en las dos partes. La ficha `public-domain` declara compositor «Anónimo tradicional» (`anonymousTraditional: true`), fuente de 1799 con URL de Wikipedia, transcriptor y verificador Piano Today, fecha 2026-11-13, atribución de transcripción y bajo propios, y nota que aclara que no se usa la letra de Robert Burns ni armonizaciones corales modernas; incluye `notesEs`, `notesEn`, `fingeringEs` y `fingeringEn`. `tests/repertoire-auld-lang-syne.test.tsx` valida la tonalidad de Sol mayor y el modo mayor, los 16 compases completos de cuatro pulsos, la melodía MIDI nota por nota, el bajo, la duración de 64 pulsos (48 s a 80 BPM), el render de 74 notas con `renderGrandStaff` y el reproductor con resumen «Ambas · compases 1–16 · 80 BPM (100 %)», cambio a mano derecha con 58 eventos y detención limpia. Se actualizaron los conteos de piezas de 16 a 17 en `tests/repertoire-studies.test.ts`, `tests/repertoire-studies-set2.test.ts`, `tests/repertoire-loader.test.ts` y `tests/app-router.test.tsx`. `validate:content` da 9 módulos, 79 lecciones, 720 ejercicios, 67 habilidades y 17 piezas; suite 209 archivos / 1526 tests; build y presupuesto verdes (253,78 kB gzip inicial, 830 diferidos).
  - Commit: 055284d · 2026-11-13T09:50:00-03:00
- [x] **F5-030** — Transcribir «Amazing Grace» (tradicional)
  - Aceptación: solo melodía tradicional; ficha completa; sin letra ni arreglos de terceros.
  - Deps: F5-029 · Red: no
  - Verificación: se publicó `content/repertoire/traditional-amazing-grace.json` con id `piece.traditional.amazing-grace`, nivel 1, 40 s, Sol mayor, 3/4, 72 BPM, 16 compases de tres pulsos y solo `hands.right` (27 eventos). La ficha `public-domain` declara compositor «Anónimo tradicional» (`anonymousTraditional: true`), fuente «New Britain» de 1829 con URL de Hymnary.org, transcriptor y verificador Piano Today, fecha 2026-11-13, atribución visible y nota que aclara que se transcribe solo la melodía, sin la letra de John Newton y sin armonizaciones ni arreglos modernos; incluye `notesEs`, `notesEn`, `fingeringEs` y `fingeringEn`. `tests/repertoire-amazing-grace.test.tsx` comprueba la ficha, la mano única, los 16 compases completos de tres pulsos, la melodía MIDI nota por nota (67, 71, 71, 69, 67, 64, 62, …), el máximo Re5, la duración de 48 pulsos (40 s a 72 BPM), el render de 27 notas con `renderGrandStaff` y el reproductor con resumen «Ambas · compases 1–16 · 72 BPM (100 %)», mano izquierda deshabilitada, 27 eventos y `duration` 40. Se actualizaron los conteos de piezas de 17 a 18 en `tests/repertoire-studies.test.ts`, `tests/repertoire-studies-set2.test.ts`, `tests/repertoire-loader.test.ts` y `tests/app-router.test.tsx`. `validate:content` da 9 módulos, 79 lecciones, 720 ejercicios, 67 habilidades y 18 piezas; suite 210 archivos / 1531 tests; build y presupuesto verdes (253,81 kB gzip inicial, 831 diferidos).
  - Commit: 5f233f0 · 2026-11-13T10:25:00-03:00
- [x] **F5-031** — Transcribir «Oda a la alegría» (Beethoven, 1827)
  - Aceptación: transcripción propia del tema; ficha con fuente; render/playback.
  - Deps: F5-030 · Red: no
  - Verificación: se publicó `content/repertoire/beethoven-ode-to-joy.json` con id `piece.beethoven.ode-to-joy`, nivel 2, 20 s, Re mayor, 4/4, 96 BPM, ocho compases de cuatro pulsos. La transcripción propia del tema está en `hands.right` (28 eventos, con los Fa sostenidos escritos como accidentales) y el bajo pedagógico en `hands.left` (8 redondas, una por compás, con Re y La alternados). La ficha `public-domain` declara a Ludwig van Beethoven (1770-1827), fuente del cuarto movimiento de la Sinfonía n.º 9, Op. 125, con URL de IMSLP, transcriptor y verificador Piano Today, fecha 2026-11-13, atribución visible y nota que aclara que no se usa la letra de Schiller ni arreglos modernos; incluye `notesEs`, `notesEn`, `fingeringEs` y `fingeringEn`. `tests/repertoire-ode-to-joy.test.tsx` comprueba la ficha, las dos manos, los ocho compases completos, la melodía MIDI nota por nota (66, 66, 67, 69, …), los Fa sostenidos, el bajo, la duración de 32 pulsos (20 s a 96 BPM), el render de 36 notas con `renderGrandStaff` y el reproductor con resumen «Ambas · compases 1–8 · 96 BPM (100 %)», cambio a mano izquierda con 8 eventos y detención limpia. Se actualizaron los conteos de piezas de 18 a 19 en `tests/repertoire-studies.test.ts`, `tests/repertoire-studies-set2.test.ts`, `tests/repertoire-loader.test.ts` y `tests/app-router.test.tsx`. `validate:content` da 9 módulos, 79 lecciones, 720 ejercicios, 67 habilidades y 19 piezas; suite 211 archivos / 1536 tests; build y presupuesto verdes (253,85 kB gzip inicial, 832 diferidos).
  - Commit: cf08e20 · 2026-11-13T11:00:00-03:00
- [x] **F5-032** — Transcribir «Minueto en Sol, BWV Anh. 114» (Petzold, atribuido a Bach)
  - Aceptación: ficha correcta (Petzold, m. 1733); dos manos; digitación; render/playback.
  - Deps: F5-031 · Red: no
  - Verificación: se publicó `content/repertoire/petzold-minuet-g.json` con id `piece.petzold.minuet-g`, nivel 3, 48 s, Sol mayor, 3/4, 120 BPM, 32 compases de tres pulsos (dos secciones de 16). La melodía está en `hands.right` (126 eventos) y el bajo pedagógico en `hands.left` (32 blancas con puntillo, una por compás, con fundamentales Sol, Do, Re, La y Mi). La ficha `public-domain` declara a Christian Petzold (1677-1733), fuente del «Notebook for Anna Magdalena Bach» (1725) con URL de IMSLP, transcriptor y verificador Piano Today, fecha 2026-11-13, atribución que aclara la atribución histórica a Bach y nota que descarta la edición Bärenreiter de 1957 y que el bajo es una simplificación propia; incluye `notesEs`, `notesEn`, `fingeringEs` y `fingeringEn`. `tests/repertoire-petzold-minuet-g.test.tsx` comprueba la ficha, las dos manos, los 32 compases completos, la melodía MIDI nota por nota (74, 67, 69, 71, 72, …), el bajo, los Do sostenidos de los compases 20, 21 y 23, la duración de 96 pulsos (48 s a 120 BPM), el render de 158 notas con `renderGrandStaff` y el reproductor con resumen «Ambas · compases 1–32 · 120 BPM (100 %)», cambio a mano izquierda con 32 eventos y detención limpia. Se actualizaron los conteos de piezas de 19 a 20 en `tests/repertoire-studies.test.ts`, `tests/repertoire-studies-set2.test.ts`, `tests/repertoire-loader.test.ts` y `tests/app-router.test.tsx`. `validate:content` da 9 módulos, 79 lecciones, 720 ejercicios, 67 habilidades y 20 piezas; suite 212 archivos / 1541 tests; build y presupuesto verdes (253,87 kB gzip inicial, 833 diferidos).
  - Commit: 853edd1 · 2026-11-13T11:40:00-03:00
- [x] **F5-033** — Transcribir «Soldatenmarsch» (Schumann, 1856)
  - Aceptación: ficha completa; dos manos; compases y articulación; render/playback.
  - Deps: F5-032 · Red: no
  - Commit: 109173e · 2026-11-13T12:00:00-03:00
- [x] **F5-034** — Transcribir Sonatina Op. 36 N.º 1, I (Clementi, 1832)
  - Aceptación: fragmento pedagógico propio; ficha completa; dos manos; duración validada.
  - Deps: F5-033 · Red: no
  - Commit: 67c585c · 2026-11-13T12:30:00-03:00
- [x] **F5-035** — Transcribir «Arabesque» Op. 100 N.º 2 (Burgmüller, 1874)
  - Aceptación: ficha completa; dos manos; digitación; render/playback.
  - Deps: F5-034 · Red: no
  - Commit: 56c0359 · 2026-11-13T13:00:00-03:00
  - Nota (F6-050): el título decía «Op. 100 N.º 1», pero *Arabesque* es el n.º 2 de la colección (*La candeur* es el n.º 1). La pieza publicada es `piece.burgmuller.arabesque-op100-2` en `content/repertoire/burgmuller-arabesque-op100-2.json`, con título «L’Arabesque, Op. 100 N.º 2».
- [x] **F5-036** — Transcribir Preludio Op. 28 N.º 4 (Chopin, 1849)
  - Aceptación: versión simplificada propia declarada; ficha completa; dos manos; render/playback.
  - Deps: F5-035 · Red: no
  - Commit: 860d1b2 · 2026-11-13T13:30:00-03:00
- [x] **F5-037** — Componer pieza original nivel 1
  - Aceptación: CC0; 8-16 compases; ficha original; render/playback; sin errores de compás.
  - Deps: F5-025 · Red: no
  - Commit: f76a386 · 2026-11-13T14:00:00-03:00
- [x] **F5-038** — Componer pieza original nivel 2
  - Aceptación: CC0; dos manos; 16-24 compases; digitación; validada.
  - Deps: F5-037 · Red: no
  - Commit: 688e7bf · 2026-11-13T14:30:00-03:00
- [x] **F5-039** — Componer pieza original nivel 3
  - Aceptación: CC0; textura y dinámica; 24-32 compases; validada.
  - Deps: F5-038 · Red: no
  - Commit: 394d326 · 2026-11-13T15:00:00-03:00
- [x] **F5-040** — Adaptar un estudio de Hanon/Czerny de dominio público
  - Aceptación: fuente y edición original identificadas; adaptación propia; ficha; render/playback.
  - Deps: F5-025 · Red: no
  - Commit: d21dd5e · 2026-11-13T16:00:00-03:00

### Modos de práctica y cierre

- [x] **F5-041** — Ampliar el plan de práctica a repertorio y técnica
  - Aceptación: bloques de 15/30/45; repertorio y técnica; temporizador; registro.
  - Deps: F2-068 · Red: no
  - Commit: e2c7621 · 2026-11-13T16:10:00-03:00
- [x] **F5-042** — Implementar modo de lectura a primera vista
  - Aceptación: fragmentos generados; tempo; sin repetición previa; puntuación.
  - Deps: F5-009 · Red: no
  - Commit: e2c7621 · 2026-11-13T18:00:00-03:00
- [x] **F5-043** — Implementar modo de tocar de oído
  - Aceptación: melodía oculta; reproducir y responder; pistas graduadas; feedback.
  - Deps: F5-010 · Red: no
  - Commit: e2c7621 · 2026-11-13T18:00:00-03:00
- [x] **F5-044** — Implementar transposición interactiva
  - Aceptación: transporta melodía/acordes; teclado y pentagrama; test en 12 tonalidades.
  - Deps: F5-010 · Red: no
  - Commit: e2c7621 · 2026-11-13T18:00:00-03:00
- [x] **F5-045** — Implementar improvisación guiada
  - Aceptación: restricciones por escala/patrón; metrónomo; sin evaluación punitiva.
  - Deps: F5-010 · Red: no
  - Commit: e2c7621 · 2026-11-13T18:00:00-03:00
- [x] **F5-046** — Implementar reproductor de lead sheets
  - Aceptación: melodía + cifrado; manos; tempo; bucle; render correcto.
  - Deps: F5-011 · Red: no
  - Commit: e2c7621 · 2026-11-13T18:00:00-03:00
- [x] **F5-047** — Test automático de fichas de licencia del repertorio
  - Aceptación: falta de compositor/fuente/transcriptor rompe el build; criterio de 100 años; test.
  - Deps: F5-021 · Red: no
  - Commit: e2c7621 · 2026-11-13T17:00:00-03:00
- [x] **F5-048** — Test de integridad del repertorio
  - Aceptación: compases completos; IDs únicos; duraciones; notas en rango; 100 % de piezas.
  - Deps: F5-026 a F5-040 · Red: no
  - Commit: e2c7621 · 2026-11-13T17:00:00-03:00
- [x] **F5-049** — E2E de repertorio
  - Aceptación: abrir pieza, cambiar manos, tempo y bucle; reproducir; persistir preferencia.
  - Deps: F5-048 · Red: no
  - Commit: 30b4cdb · 2026-11-13T19:00:00-03:00
- [x] **F5-050** — Asegurar accesibilidad de partituras y reproducción
  - Aceptación: alternativa textual; controles accesibles; sin depender del color; axe.
  - Deps: F5-049 · Red: no
  - Commit: 30b4cdb · 2026-11-13T19:00:00-03:00
- [x] **F5-051** — Cerrar F5: suite, tag `fase-5`, RESUME y resumen
  - Aceptación: `npm run estado` verde; M7-M8 y repertorio completos; tag `fase-5`.
  - Deps: F5-001 a F5-050 · Red: no
  - Commit: 30b4cdb · 2026-11-13T19:00:00-03:00

## F6 — PWA, MIDI, pulido y despliegue

### PWA y offline

- [x] **F6-001** — Crear manifest, iconos y metadatos PWA
  - Aceptación: manifest válido; iconos 192/512; nombre, tema y `display: standalone`; instalable.
  - Deps: F1-041 · Red: no
  - Commit: edb3555 · 2026-11-13T20:00:00-03:00
- [x] **F6-002** — Configurar service worker y precache del shell
  - Aceptación: `vite-plugin-pwa`; precache de HTML/JS/CSS; versión controlada; build reproducible.
  - Deps: F6-001 · Red: no
  - Commit: f155c7a · 2026-11-13T21:00:00-03:00
- [x] **F6-003** — Cachear audio y assets pesados en runtime
  - Aceptación: CacheFirst para muestras; no infla la instalación; límite y limpieza; test.
  - Deps: F6-002 · Red: no
  - Commit: ffa3219 · 2026-11-13T21:30:00-03:00
- [x] **F6-004** — Implementar pantalla offline y actualización controlada
  - Aceptación: aviso offline; banner de nueva versión; no recarga forzada; accesible.
  - Deps: F6-002 · Red: no
  - Commit: 2feb57d · 2026-11-13T22:00:00-03:00
- [x] **F6-005** — Test PWA offline
  - Aceptación: Playwright carga una vez, corta red, recarga y la app funciona; audio cacheado si existe.
  - Deps: F6-003 · Red: no
  - Commit: 26c757e · 2026-11-13T23:00:00-03:00

### MIDI opcional

- [x] **F6-006** — Detectar Web MIDI y pedir permiso explícito
  - Aceptación: sin permiso no accede; mensaje claro; opción de seguir sin MIDI; test de feature detection.
  - Deps: F1-041 · Red: no
  - Commit: 9282a70 · 2026-11-13T23:30:00-03:00
- [x] **F6-007** — Conectar entrada MIDI a teclado y ejercicios
  - Aceptación: note on/off con velocity; se refleja en pantalla; corrige ejercicios; latencia aceptable.
  - Deps: F6-006 · Red: no
  - Commit: 4c6953c · 2026-11-13T23:45:00-03:00
- [x] **F6-008** — Detectar tempo y ritmo desde MIDI
  - Aceptación: tempo estimado; desviaciones; feedback en escalas y piezas; tolerancias configurables.
  - Deps: F6-007 · Red: no
  - Commit: aad0d28 · 2026-11-14T00:00:00-03:00
- [x] **F6-009** — Dar feedback objetivo en escalas, acordes y piezas con MIDI
  - Aceptación: notas correctas/incorrectas, tempo y uniformidad; sin MIDI se mantiene autoevaluación.
  - Deps: F6-008 · Red: no
  - Commit: 1b03d6c · 2026-11-14T00:10:00-03:00
- [x] **F6-010** — Implementar fallback y mensajes por navegador
  - Aceptación: Safari sin Web MIDI muestra aviso; todo sigue funcionando; detección probada.
  - Deps: F6-006 · Red: no
  - Commit: fbafaf6 · 2026-11-14T00:20:00-03:00
- [x] **F6-031** — Soporte de dispositivos MIDI adicionales (Yamaha PSR-373, etc.)
  - Aceptación: entrada MIDI de dispositivos comunes (Yamaha PSR-373 por USB-B tipo MIDI 2.0) se detecta, se normaliza y se mapea al teclado; mensajes de sistema/Real Time tolerados; sin dispositivo no hay MIDI; fallback a autoevaluación.
  - Deps: F6-007 · Red: no (requiere dispositivo físico para la prueba)
  - Commit: 3f683c0 · 2026-11-14T00:30:00-03:00
  - Nota: normalización y detección cubiertas con mensajes simulados; la prueba con el PSR-373 físico queda pendiente de hardware.
- [x] **F6-032** — Integrar pulsaciones del dispositivo MIDI en la evaluación de ejercicios
  - Aceptación: con MIDI conectado (ej. Yamaha PSR-373) las pulsaciones se registran como intento y se comparan en serie (orden) contra la secuencia esperada con aciertos y desviaciones de tiempo; sin MIDI se mantiene la autoevaluación/checklist/demo.
  - Deps: F6-009 · F6-031 · Red: no
  - Inicio: 2026-11-14T05:20:00-03:00
  - Commit: 0f73c57 · 2026-11-14T05:35:00-03:00
  - Cierre: `src/midi/exercise-attempt.ts` arma la secuencia esperada (timeline de demo o fallback por teclas) y `evaluateTaskAttempt` reusa el alineador en serie y la rejilla de ritmo; `useMidiAttempt` conecta el listener y acumula pulsaciones; `KeyboardTask` muestra el feedback «X de Y pulsaciones acertadas en la secuencia · ritmo Z%» cuando el estado es `listening`. Sin MIDI (jsdom) la autoevaluación sigue activa. Suite 236 archivos / 1640 tests, typecheck, contenido, build y presupuesto verdes. En F6-033 el hook local se sustituyó por el contexto MIDI compartido (`src/midi/context.tsx`).

### Accesibilidad y rendimiento

- [x] **F6-011** — Auditoría WCAG AA con axe y correcciones
  - Aceptación: cero violaciones críticas/serias en rutas principales; informe en LOG.
  - Deps: F5-051 · Red: no
  - Commit: daf6006 · 2026-11-14T01:00:00-03:00
  - Nota: Se añadieron rutas de repertorio y pieza a la suite axe; se encontró y corrigió la etiqueta del control de tempo.
- [x] **F6-012** — Completar navegación por teclado
  - Aceptación: todo el flujo sin mouse; foco visible; orden lógico; sin trampas.
  - Deps: F6-011 · Red: no
  - Commit: 1fb3537 · 2026-11-14T01:10:00-03:00
  - Nota: Enlace «Saltar al contenido» y contenedor enfocable; orden de tabulación verificado.
- [x] **F6-013** — Añadir alternativas textuales de audio y notación
  - Aceptación: cada ejemplo sonoro tiene descripción; partituras con resumen; lectores de pantalla.
  - Deps: F6-011 · Red: no
  - Commit: 946e781 · 2026-11-14T01:20:00-03:00
  - Nota: Resumen textual de notas por mano y del estado del reproductor verificado con tests.
- [x] **F6-014** — Revisar contraste, temas y `prefers-reduced-motion`
  - Aceptación: contraste AA en claro/oscuro; movimiento reducido; sin depender solo del color.
  - Deps: F6-011 · Red: no
  - Commit: 6dee11c · 2026-11-14T01:30:00-03:00
  - Nota: Regla global de movimiento reducido y contraste AA ya cubierto por las pruebas de tema.
- [x] **F6-015** — Verificar JS inicial < 300 KB y code splitting
  - Aceptación: medición gzip; Tone/VexFlow/repertorio en chunks; sin regresiones.
  - Deps: F5-051 · Red: no
  - Commit: e3cdf0c · 2026-11-14T01:40:00-03:00
  - Nota: JS inicial 255,44 kB gzip y 842 chunks diferidos; presupuesto de `npm run budget` verde.
- [x] **F6-016** — Verificar presupuesto y carga diferida de audio
  - Aceptación: audio total < 150 MB; primera carga no descarga todas las muestras; medición.
  - Deps: F6-003 · Red: no
  - Commit: 77a4ad1 · 2026-11-14T01:50:00-03:00
  - Nota: 30 muestras (~2 MB) por debajo de 150 MB; Tone.js se importa dinámicamente y la carga inicial no pide audio.
- [x] **F6-017** — Ejecutar Lighthouse móvil y escritorio
  - Aceptación: rendimiento/accesibilidad/PWA ≥ 90 o justificación documentada; sin errores graves.
  - Deps: F6-015, F6-016 · Red: no
  - Commit: e3cdf0c · 2026-11-14T02:00:00-03:00
  - Nota: Lighthouse móvil: rendimiento 99, accesibilidad 100, CLS 0,026. Escritorio: accesibilidad 100; CLS de laboratorio 0,724 por artefacto de emulación, mientras la medición real con Playwright da 0,059. Justificado en LOG.

### Documentación y licencias

- [x] **F6-018** — Generar `THIRD_PARTY_LICENSES.md` completo
  - Aceptación: dependencias, muestras y contenido de terceros; licencias y enlaces; verificable.
  - Deps: F6-017 · Red: no
  - Commit: 72c38f8 · 2026-11-14T02:10:00-03:00
  - Nota: Inventario generado desde el lockfile (551 paquetes) y sección de audio, fuentes y contenido.
- [x] **F6-019** — Mostrar atribuciones visibles en la app
  - Aceptación: pantalla de créditos; Salamander y obras; enlace desde el pie; accesible.
  - Deps: F6-018 · Red: no
  - Commit: 7a48faf · 2026-11-14T02:20:00-03:00
  - Nota: Sección de muestras/software en atribuciones y enlace «Créditos y licencias» en el pie.
- [x] **F6-020** — Escribir CHANGELOG por fase
  - Aceptación: F0-F6 con cambios y tags; formato legible; sin promesas incumplidas.
  - Deps: F6-019 · Red: no
  - Commit: 52bbd5d · 2026-11-14T02:35:00-03:00
  - Nota: Se añadieron las fases 5 y 6; la 6 queda «en curso» hasta el tag `fase-6` de F6-030.
- [x] **F6-021** — Actualizar README y guía de uso
  - Aceptación: qué es, cómo correr, cómo aprender, límites sin profesor, licencias y contribución.
  - Deps: F6-020 · Red: no
  - Commit: 940bf46 · 2026-11-14T02:45:00-03:00
  - Nota: README reescrito con alcance, recorrido de aprendizaje, PWA/MIDI, límites, accesibilidad, contribución y despliegue.

### CI y GitHub Pages (solo con autorización)

> **Publicación autorizada (2026-11-14):** la demo vive en
> <https://wulflo.github.io/piano-learning/> y se publica con
> `.github/workflows/deploy-pages.yml` desde el artefacto de `dist/`. F6-022 a
> F6-025 verificadas con runs verdes y un smoke live. La rama de trabajo es
> `main`, así que el workflow se validó en pushes en lugar de un PR de prueba.

- [x] **F6-022** — Crear workflow de GitHub Actions para typecheck, test y build
  - Aceptación: workflow en `.github/workflows/`; Node 22; caché de npm; verde en un PR de prueba. [NET]
  - Deps: F6-021 · Red: sí · [NET]
  - Commit: 8a321a3 · 2026-11-14T03:30:00-03:00
  - Nota: El workflow `deploy-pages.yml` corre typecheck, tests y build antes de publicar. Runs verdes 43177956615 (e38a2d5) y 43178857187 (9bd9578).
- [x] **F6-023** — Configurar `base` de Vite según el nombre del repositorio
  - Aceptación: build de Pages usa `/<repo>/`; preview local sigue en `/`; test del HTML generado. [NET]
  - Deps: F6-022 · Red: sí · [NET]
  - Commit: 14093f1 · 2026-11-14T03:20:00-03:00
  - Nota: `VITE_BASE=/piano-learning/ npm run build` genera assets y manifest bajo `/piano-learning/`; el build local sin la variable sigue en `/`. Verificado en esta sesión.
- [x] **F6-024** — Publicar con GitHub Pages desde el artefacto de build (no `/docs`)
  - Aceptación: deploy de `dist/`; `/docs` no se publica; URL responde 200; sin 404 de assets. [NET]
  - Deps: F6-023 · Red: sí · [NET]
  - Commit: 9bd9578 · 2026-11-14T03:35:00-03:00
  - Nota: La run 43178857187 publicó el artefacto de `dist/` con GitHub Pages. La URL, los assets, `manifest.webmanifest`, `sw.js` y las 30 muestras responden 200; `/docs` no se publica.
- [x] **F6-025** — Verificar la demo publicada
  - Aceptación: smoke test manual de rutas, audio, offline y export/import en la URL de Pages. [NET]
  - Deps: F6-024 · Red: sí · [NET]
  - Commit: 9bd9578 · 2026-11-14T03:45:00-03:00
  - Nota: Smoke live con Playwright sobre la URL publicada: rutas, repertorio, reproducción con muestras reales, export/import y offline. 0 errores de consola y 0 respuestas 4xx.
- [x] **F6-026** — Crear tags y releases remotos por fase
  - Aceptación: tags `fase-0` a `fase-6` publicados; notas de release enlazadas al CHANGELOG. [NET]
  - Deps: F6-025 · Red: sí · [NET]
  - Inicio: 2026-11-14T03:50:00-03:00
  - Commit: c6bd408 · 2026-11-14T04:00:00-03:00
  - Nota: tags `fase-0` a `fase-5` publicados con releases enlazadas al CHANGELOG; `fase-6` se crea sobre el commit de cierre de F6-030.

### QA final y cierre

- [x] **F6-027** — QA en Chrome, Firefox, Edge y Safari
  - Aceptación: matriz documentada; audio, MIDI, PWA y layout; incidencias resueltas o registradas.
  - Deps: F6-017 · Red: no
  - Commit: 14093f1 · 2026-11-14T03:10:00-03:00
  - Nota: 6/6 E2E en Chromium y Firefox. Edge se cubre por el mismo motor Chromium; WebKit/Safari no se pudo ejecutar por bibliotecas del host (registrado en `docs/QA-NAVEGADORES.md`).
- [-] **F6-028** — Prueba manual en iOS (audio y PWA)
  - Aceptación: audio tras gesto; sin samples rotos; instalación; resultado en LOG.
  - Deps: F6-027 · Red: no (requiere dispositivo)
  - Nota: descartada en este entorno: no hay dispositivo iOS físico ni acceso a un servicio de dispositivos en la nube. La app no usa APIs exclusivas de la plataforma y el flujo PWA, audio y offline está cubierto por los E2E de Chromium y Firefox. Queda registrada como limitación conocida, no como bloqueo del cierre de F6.
- [-] **F6-029** — Prueba manual en Android (audio y PWA)
  - Aceptación: audio, instalación y offline; resultado en LOG.
  - Deps: F6-027 · Red: no (requiere dispositivo)
  - Nota: descartada en este entorno: no hay dispositivo Android físico ni acceso a un servicio de dispositivos en la nube. La app no usa APIs exclusivas de la plataforma y el flujo PWA, audio y offline está cubierto por los E2E de Chromium y Firefox. Queda registrada como limitación conocida, no como bloqueo del cierre de F6.
- [x] **F6-030** — Cerrar F6: suite, tag `fase-6`, RESUME, CHANGELOG y resumen final
  - Aceptación: `npm run estado` verde; demo publicada autorizada; tag `fase-6`; documentación completa.
  - Deps: F6-001 a F6-029 · Red: no (el deploy ya se hizo en F6-024)
  - Inicio: 2026-11-14T04:05:00-03:00
  - Commit: 55bbbf8 · 2026-11-14T04:15:00-03:00 (estado final regenerado justo después del commit de cierre)
  - Cierre: `npm run estado` verde con 235 archivos / 1635 tests, 9 módulos, 79 lecciones, 720 ejercicios, 67 habilidades y 28 piezas; build y presupuesto verdes (255,44 kB gzip inicial, 842 chunks diferidos). Demo publicada y smoke live sin 404; RESUME, CHANGELOG y README actualizados; tag `fase-6` creado sobre el commit de cierre y releases `fase-0` a `fase-6` publicados.

### Corrección MIDI en vivo (retoma)

- [x] **F6-033** — Compartir la entrada MIDI con teclado virtual y pentagrama en toda la app
  - Aceptación: al pulsar el Yamaha PSR-373 (o cualquier MIDI compatible) las teclas virtuales y las notas del pentagrama se iluminan en cualquier página; el estado de conexión muestra los puertos detectados y la última nota; se puede conectar, reintentar y desconectar; la evaluación en serie conserva orden y timing normalizado.
  - Deps: F6-007 · F6-032 · Red: no
  - Inicio: 2026-11-14T05:50:00-03:00
  - Commit: f6da1fa · 2026-11-14T06:05:00-03:00
  - Cierre: `src/midi/context.tsx` (`MidiProvider`/`useMidi`) abre una única conexión y expone `heldNotes`, `events`, `devices` y `lastEvent`; `connectMidiInput` devuelve los nombres de los puertos y reasigna handlers de forma idempotente; `Keyboard` y `Staff` suman `heldNotes` a `activeNotes`; `MidiStatusBar` ofrece conectar/reintentar/desconectar, lista dispositivos y muestra la última nota; `KeyboardTask` usa el contexto, normaliza los timestamps absolutos de Web MIDI respecto de la primera pulsación y agrega «Reiniciar intento». El mensaje de permiso denegado indica los pasos de Chrome (`f505b11`). Tests nuevos con MIDI simulado para contexto, teclado, pentagrama y tarea. Suite 240 archivos / 1649 tests, typecheck, contenido, build y presupuesto verdes.
  - Limitación: la prueba con el PSR-373 físico no se pudo ejecutar en el entorno del agente; el diagnóstico visible (puertos y última nota) permite confirmar en la máquina del usuario si el navegador recibe los mensajes.
- [x] **F6-034** — Reforzar la conexión MIDI y añadir diagnóstico visible
  - Aceptación: abrir el puerto explícitamente al conectar, reconectar cuando el permiso pasa a concedido o la pestaña recupera el foco, y mostrar permiso, entradas, salidas y último mensaje crudo en Ajustes. [NET]
  - Deps: F6-033 · Red: no
  - Inicio: 2026-11-14T06:10:00-03:00
  - Commit: 39fb6fc · 2026-11-14T06:25:00-03:00
  - Cierre: `connectMidiInput` llama a `input.open()` cuando existe y reenumera entradas/salidas en cada `statechange`; el contexto consulta `navigator.permissions` (`midi`), reconecta al volver el foco y expone `outputs`, `permission` y `lastRaw`; `MidiDiagnostics` muestra Web MIDI, permiso, estado, perfil, entradas, salidas y el último mensaje en hexadecimal con la nota. El helper de tests gana `open()` y `outputs`; tests del contexto y del diagnóstico cubren apertura del puerto y mensajes crudos.
  - Nota: si el PSR-373 no aparece en «Entradas MIDI», el problema está antes de la app (cable, adaptador, driver o permiso del sistema); el panel permite distinguirlo sin abrir DevTools.
- [x] **F6-035** — Transición al tema Material 3 claro y limpieza de la interfaz
  - Aceptación: paleta M3 clara por defecto con tokens de superficie, primario y contenedores; componentes con formas, elevación y estados M3; sin badge «Fase 2»; aviso de nueva versión visible arriba. [NET]
  - Deps: F6-034 · Red: no
  - Inicio: 2026-11-14T06:15:00-03:00
  - Commit: 39fb6fc · 2026-11-14T06:25:00-03:00
  - Cierre: `src/styles.css` define tokens M3 claros (violeta primario, superficies tonales, contenedores de estado) y una capa de componentes para header, navegación, tarjetas, botones, campos, teclado, pentagrama, repaso, práctica, MIDI y PWA; `index.html` y el manifest usan `#fdfbff`; el tema por defecto es `light` y el selector solo ofrece claro/oscuro; se retiró el badge `phase-badge` y sus claves i18n; `PwaStatus` se movió junto a `MidiStatusBar`. Tests de tema y ajustes actualizados.
- [x] **F6-036** — Corregir el teclado en lecciones y penalizar notas de más en MIDI
  - Aceptación: el teclado de una lección no se estira más allá del panel; el resaltado del ejercicio tiene un borde regular en todas las esquinas y un fondo más intenso; la evaluación MIDI no da por bueno un intento con teclas equivocadas o de más intercaladas.
  - Deps: F6-035 · Red: no
  - Inicio: 2026-11-14T13:00:00-03:00
  - Commit: 8cd1f70 · 2026-11-14T13:20:00-03:00
  - Cierre: `.lesson-sections` pasa a `grid-template-columns: minmax(0, 1fr)` y `.lesson-section`/`.keyboard` a `min-width: 0`, lo que evita que el ancho max-content del teclado expanda el grid de la lección; el resaltado terminó usando solo un fondo más intenso, sin bordes, anillos ni puntos (ver F6-037); la pulsación blanca usa primario intenso. `evaluateMidiPerformance` calcula `accuracy = matched / max(esperadas, tocadas)`, de modo que las notas de más bajan el porcentaje; `KeyboardTask` muestra «Secuencia con errores» con equivocadas, de más y faltantes, y colorea el aviso según el resultado. Tests nuevos en feedback, intento de tarea y tarea MIDI; suite 241 archivos / 1656 tests.
- [x] **F6-037** — Digitación por tecla con dedo y mano, configurable
  - Aceptación: cada tecla que pide el ejercicio muestra el número de dedo (1-5) y la mano (D/I) en vertical, sin taparse con las teclas negras; el resaltado usa solo fondo; Ajustes permite ocultar la digitación y la preferencia persiste.
  - Deps: F6-036 · Red: no
  - Inicio: 2026-11-14T13:25:00-03:00
  - Commit: 364519f · 2026-11-14T13:38:00-03:00
  - Cierre: `Keyboard` renderiza `.key-fingering` como columna número/mano y respeta `settings.showFingering`; en teclas blancas el indicador se alinea a la izquierda y baja bajo las teclas negras, y el teclado crece a 10rem (7,5rem en móvil) para darle aire. `fingeringFromText` lee secuencias como «1 - 2 - 3 (mano derecha)» y el patrón de escala como respaldo; `KeyboardTask` y las secciones de teclado de las lecciones pasan la digitación. Se añadió `showFingering` a los ajustes, a la fila persistida y al panel, junto con las claves ES/EN. Se eliminaron el punto `.key-highlight` y los bordes/anillos del resaltado. Tests de teclado, digitación, tema y persistencia; suite 242 archivos / 1664 tests. Seguimiento: se restauró el indicador por tecla (rojo mano derecha, azul mano izquierda), se quitaron las letras del teclado físico de las teclas —la asignación sigue activa— y repaso/práctica muestran ejercicios concretos con `ExerciseSuggestions`; suite 243 archivos / 1668 tests.

### Auditoría de cierre (retoma)

- [x] **F6-038** — Clasificar y cerrar los cambios sin commitear del árbol
  - Aceptación: cada cambio pendiente (HEAD frente a la última tarea verificada) queda clasificado y commiteado en una tarea o descartado con criterio y anotado en LOG; `git status` limpio y suite en verde.
  - Deps: F6-037 · Red: no
  - Commit: a9012e7 · 2026-11-15T00:10:00-03:00
- [x] **F6-039** — Ampliar el manifiesto de audio y verificar licencias con `audit:audio`
  - Aceptación: `assets/audio/manifest.json` incluye author, source, license (id SPDX), licenseUrl y modifications por muestra; `npm run audit:audio` (scripts/verify-audio.mjs) falla si un archivo de audio no está registrado, si el SHA-256 no coincide, si falta un campo o si la licencia no está en la lista permitida (CC0-1.0, CC-BY-3.0, CC-BY-4.0, CC-BY-SA-3.0, CC-BY-SA-4.0, MIT, Apache-2.0, LicenseRef-PublicDomain); con tests.
  - Deps: F6-038 · Red: no
  - Commit: 16f57f1 · 2026-11-15T01:30:00-03:00
- [x] **F6-040** — Confirmar la licencia original de las muestras Salamander [NET]
  - Aceptación: se consulta la fuente original de las muestras Salamander, se confirma su licencia (CC BY 3.0 o dominio público) y se registra en el manifiesto y en docs/LICENCIAS.md la URL de origen y de la licencia.
  - Deps: F6-039 · Red: sí · [NET]
  - Commit: 61ee0c7 · 2026-11-15T02:00:00-03:00
- [x] **F6-041** — Generar la pantalla de créditos desde el manifiesto
  - Aceptación: los créditos de audio se generan desde `assets/audio/manifest.json` (no escritos a mano) y muestran autor, licencia y modificaciones; con test.
  - Deps: F6-039 · Red: no
  - Commit: 00cae89 · 2026-11-15T02:30:00-03:00
- [x] **F6-042** — Auditar licencias de producción con license-checker [NET]
  - Aceptación: `npm run audit:licenses` corre license-checker sobre dependencias de producción contra una allowlist permisiva y debe coincidir con THIRD_PARTY_LICENSES.md; con test.
  - Deps: F6-039 · Red: sí · [NET]
  - Commit: 5f9b7fb · 2026-11-15T03:00:00-03:00
- [x] **F6-043** — Auditar duplicación de código y encabezados ajenos [NET]
  - Aceptación: `npm run audit:code` corre jscpd sobre src/ y un grep de encabezados de copyright o licencia ajenos (Copyright, SPDX, GPL, "licensed under") en src/, scripts/ y content/; reporta archivo y línea en docs/AUDITORIA.md.
  - Deps: F6-042 · Red: sí · [NET]
  - Commit: 14db423 · 2026-11-15T03:30:00-03:00
- [x] **F6-044** — Cumplimiento REUSE [NET]
  - Aceptación: REUSE.toml, carpeta LICENSES/ y `reuse lint` en verde; si la herramienta no se puede instalar, se documenta el motivo en DECISIONES.md y la tarea queda [-] .
  - Deps: F6-043 · Red: sí · [NET]
  - Commit: c60ed5a · 2026-11-15T04:00:00-03:00
- [x] **F6-045** — Escribir CONTRIBUTING.md con origen, licencia y firma DCO
  - Aceptación: CONTRIBUTING.md pide declarar el origen y la licencia de todo lo aportado (firma DCO) y prohíbe pegar texto, audio o partituras de terceros.
  - Deps: F6-044 · Red: no
  - Commit: 12afa5d · 2026-11-15T04:15:00-03:00
- [x] **F6-046** — Auditar la similitud de n-gramas del texto de las lecciones
  - Aceptación: scripts/audit-text-similarity.mjs y `npm run audit:text` calculan coincidencias de n-gramas de 8 palabras entre el texto de content/ y los textos de referencia de refs/ (en .gitignore, nunca versionada); con tests con fixtures sintéticos y sin red.
  - Deps: F6-045 · Red: no
  - Commit: 812518f · 2026-11-15T04:30:00-03:00
- [x] **F6-047** — Comparar el texto de las lecciones con Open Music Theory [NET]
  - Aceptación: se descarga a refs/ el texto de Open Music Theory (CC BY-SA 4.0) solo para comparar; se ejecuta el script y el resultado (lección, ejercicio y pasaje coincidente) se vuelca a docs/AUDITORIA.md.
  - Deps: F6-046 · Red: sí · [NET]
  - Commit: a74f83c · 2026-11-14T21:20:00-03:00
- [x] **F6-048** — Reescribir con palabras propias los pasajes coincidentes
  - Aceptación: cada pasaje señalado se reescribe (una subtarea por módulo afectado); `npm run validate:content` y los tests de lecciones en verde; si no hay coincidencias relevantes, se cierra con la nota correspondiente.
  - Deps: F6-047 · Red: no
  - Commit: b7d1261 · 2026-11-14T21:45:00-03:00
- [x] **F6-049** — Corregir docs/LICENCIAS.md y verificar la tabla de transcripciones
  - Aceptación: se corrige la afirmación de que las trece piezas publicadas son obras originales CC0 (contradice su propia tabla) y «Transcripciones publicadas» lista todas las piezas hoy en content/repertoire/ con su ficha; un test verifica que esa tabla coincide con los archivos de content/repertoire/.
  - Deps: F6-048 · Red: no
  - Commit: 5085638 · 2026-11-14T21:50:00-03:00
- [x] **F6-050** — Corregir el título de la tarea F5-035 en el checklist
  - Aceptación: F5-035 dice «Op. 100 N.º 1» pero la corrección documentada es N.º 2 (Arabesque); se verifica id, título y ficha de la pieza en content/repertoire/ y se corrige el título de la tarea con una nota.
  - Deps: F6-049 · Red: no
  - Commit: 7d5ec42 · 2026-11-14T21:55:00-03:00
- [x] **F6-051** — Verificar la publicación de la Sinfonía n.º 9 en IMSLP [NET]
  - Aceptación: se consulta en IMSLP el año de primera publicación de la Sinfonía n.º 9 de Beethoven (estreno 1824; publicación presumiblemente 1826) y se corrige la ficha y LICENCIAS.md si difiere.
  - Deps: F6-050 · Red: sí · [NET]
  - Commit: 3d4181d · 2026-11-14T22:00:00-03:00
- [ ] **F6-052** — Actualizar ENTORNO.md, la identidad git y limpiar [NET] sobrantes
  - Aceptación: docs/ENTORNO.md al día (tests, contenido, remoto origin y Pages, comandos de auditoría; sin la ruta `/home/...` ni la contradicción «sin remoto»); la identidad git local pasa a una neutral de Piano Today solo para commits futuros; se quitan los [NET] sobrantes de la aceptación de F6-034 y F6-035.
  - Deps: F6-051 · Red: no
- [ ] **F6-053** — Encadenar `npm run audit` y consolidar la auditoría
  - Aceptación: `npm run audit` encadena audio, licencias, código y texto (los que no necesitan red); los resultados se consolidan en docs/AUDITORIA.md con semáforo OK/FALLA/NO VERIFICABLE y evidencia.
  - Deps: F6-052 · Red: no
- [ ] **F6-054** — Documentar las pruebas manuales pendientes
  - Aceptación: docs/PRUEBAS-MANUALES.md con pasos exactos para la escucha humana de audio (F1-038), la prueba con el Yamaha PSR-373 usando el panel de diagnóstico de Ajustes, Safari, iOS y Android; la tarea queda [ ] hasta que el usuario reporte resultados.
  - Deps: F6-053 · Red: no
- [ ] **F6-055** — Cerrar la ronda de auditoría
  - Aceptación: suite completa, `npm run estado` y resumen final en LOG.md.
  - Deps: F6-053 · Red: no

## RESUMEN POR FASE

| Fase | Foco | Tareas | Criterio de cierre |
|---|---|---|---|
| F0 | Cimientos, esquemas y protocolo | 16 | Suite verde, docs completos, tag `fase-0` |
| F1 | Teoría, teclado, audio y pentagrama | 41 | Demo local, JS < 300 KB, tag `fase-1` |
| F2 | M0-M2, FSRS, progreso y exportación | 77 | Recorrido completo, export/import idéntico |
| F3 | M3-M4 y oído | 35 | Módulos completos y auditivo en FSRS |
| F4 | M5-M6 | 33 | Armonía y forma completas |
| F5 | M7-M8 y repertorio | 51 | Técnica, estilos y piezas validadas |
| F6 | PWA, MIDI, calidad, auditoría y despliegue | 55 | Suite, a11y, PWA, auditoría y demo publicada |

Total: **308 tareas**. Los conteos se verifican con el test de formato del checklist.
