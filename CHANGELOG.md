# Changelog — PianoDesdeCero

Formato basado en Keep a Changelog. El proyecto usa tags anotados `fase-N`, publicados en el remoto con su release.

## [Fase 6] — 2026-11-14 (tag `fase-6`)

### Agregado

- PWA: manifest, iconos 192/512, metadatos de instalación, service worker con precache del shell, caché `CacheFirst` para muestras de audio y banner de actualización/offline sin recargas forzadas. E2E de funcionamiento sin conexión.
- MIDI: detección de Web MIDI y permiso explícito, entrada de note on/off con velocity, estimación de tempo y desviaciones rítmicas, feedback objetivo por nota (aciertos, errores, faltantes, sobrantes y uniformidad) y normalización de mensajes de dispositivos como Yamaha PSR-373, incluidos los mensajes de sistema y tiempo real.
- Accesibilidad: auditoría axe ampliada a repertorio y pieza, enlace «Saltar al contenido», orden de tabulación verificado, alternativas textuales de notación y audio, movimiento reducido global y corrección de la etiqueta del control de tempo.
- Rendimiento: reserva de espacio para evitar saltos de layout (CLS), verificación del presupuesto de JS inicial y del audio, e informes Lighthouse móvil y escritorio.
- Documentación: inventario completo de licencias generado desde el lockfile, sección de muestras y software en la pantalla de atribuciones y enlace «Créditos y licencias» desde el pie.

### Estado

- 235 archivos / 1635 tests unitarios y E2E de repertorio y PWA offline en verde; typecheck, contenido, build y presupuesto verdes.
- Lighthouse móvil: rendimiento 99, accesibilidad 100, CLS 0,026. Escritorio: accesibilidad 100; el CLS de laboratorio se documenta como artefacto de emulación (la medición real da 0,059).
- JS inicial 255,44 kB gzip; 30 muestras de audio (~2 MB) versionadas y cargadas solo al inicializar el motor.
- Demo publicada en <https://wulflo.github.io/piano-learning/> desde el artefacto de `dist/`; la URL, los assets, el manifest, el service worker y las 30 muestras responden 200.
- Smoke live con Playwright: rutas, repertorio, reproducción con muestras reales, export/import y offline, sin errores de consola ni respuestas 4xx.
- Tags y releases `fase-0` a `fase-6` publicados en GitHub.
- Limitación conocida: F6-028 (iOS) y F6-029 (Android) se descartan por falta de dispositivos físicos; la cobertura PWA/audio/offline se apoya en Chromium y Firefox.

## [Fase 5] — 2026-11-14

### Agregado

- Curso M7-M8 completo: 15 lecciones publicadas (11 de M7 y 4 de M8). M7 cubre independencia de manos, arpegios, pedal, acompañamiento, lectura a primera vista, lead sheets e improvisación; M8 cubre estilos, patrón de acompañamiento, walking bass y stride.
- Repertorio ampliado a 28 piezas: transcripciones y fragmentos de Beethoven, Burgmüller, Chopin, Clementi, Hanon, Petzold, Schumann y melodías tradicionales, además de 16 estudios y 4 melodías originales CC0.
- Reproductor de repertorio con selección de manos, rango de compases, tempo relativo, bucle, resumen textual y ficha de licencia por pieza.
- E2E de repertorio: abrir pieza, cambiar de mano, reproducir y detener; suite axe para repertorio y pieza.

### Corregido

- Etiqueta accesible del control de tempo del reproductor de repertorio.

### Estado

- 220 archivos / 1577 tests en verde al cerrar la fase; 9 módulos, 79 lecciones, 720 ejercicios, 67 habilidades y 28 piezas.
- Tag local `fase-5`.

## [Fase 4] — 2026-11-14

### Agregado

- Curso M5-M6 completo: 17 lecciones publicadas (11 de M5 y 6 de M6) y 188 ejercicios. M5 cubre acordes diatónicos, números romanos, funciones T-S-D, cadencias, progresiones comunes, blues de 12 compases, dominantes secundarias, intercambio modal, modulación y conducción de voces, más las opcionales «La napolitana» y «Sextas aumentadas»; M6 cubre motivo y frase, período y forma binaria/ternaria, rondó y sonata, texturas, contrapunto y ornamentos. Cada lección trae tarea de teclado y demo.
- Generadores de armonía y análisis: progresiones con hueco y cadencias en las doce tonalidades y ambos modos, identificación y resolución de dominantes secundarias, análisis de motivos y frases, forma, textura, contrapunto, adornos y sextas aumentadas, con audio, alternativas textuales y regla «Recordá» por tipo.
- Tests de teoría en las doce tónicas para grados, cadencias y dominantes secundarias; integración de las 17 lecciones con sus ejercicios, habilidades e índice; fuzz de los generadores; accesibilidad de los seis tipos de análisis con axe y navegación por teclado; dos recorridos E2E nuevos para M5-M6 con progresión, análisis, repaso y persistencia.

### Corregido

- `scoreKeySignature` traduce las armaduras menores al formato de VexFlow (`Am`, `Cm`) para que las partituras en menor se dibujen con la armadura correcta.
- La resolución de la sexta aumentada alemana pasa por un 6/4 cadencial en la demo para evitar quintas paralelas.

### Estado

- 174 archivos / 1241 tests unitarios y 4 recorridos E2E en verde; typecheck, contenido, build y presupuesto verdes.
- JS inicial 225,73 kB gzip con 621 chunks diferidos; Tone.js, VexFlow, FSRS y las muestras se cargan de forma diferida.
- Tag local `fase-4`.
- Deuda: la accesibilidad se valida con axe, teclado y cálculo de contraste, no con un lector de pantalla real; la escucha de audio real sigue pendiente en hardware; los E2E siembran el prerrequisito en IndexedDB; la aceptación original de F4 contaba 15 lecciones y el bloque real tiene 17 por las opcionales M5-10 y M5-11.

## [Fase 3] — 2026-11-11

### Agregado

- Curso M3-M4 completo: 17 lecciones publicadas (5 de M3 y 12 de M4) y 204 ejercicios. M3 cubre intervalos, inversiones, consonancia/disonancia, contexto y dictado; M4 cubre tríadas, sus, disminuidas y aumentadas, inversiones y voicings, séptimas, extensiones, slash chords, cifrado latino/americano, construcción desde el cifrado y reconocimiento auditivo de calidad, inversiones y extensiones con bajo.
- Entrenamiento auditivo con dictados de intervalos, acordes, escalas y progresiones: forma en bloque o arpegio, repeticiones acotadas, comparación de escalas, respuesta audible después de corregir y feedback pedagógico.
- Accesibilidad de los cuatro dictados: alternativa textual, controles descritos con `aria-describedby`, anuncios `aria-live`, corrección textual y navegación completa por teclado; axe sin violaciones críticas ni serias.
- Tests de teoría M3-M4 en las doce tónicas, fuzz tests de los generadores con 500 casos por lote, integración de las 17 lecciones y un segundo recorrido E2E que falla un intervalo, muestra el «Recordá», completa el repaso y comprueba la persistencia tras recargar.

### Corregido

- `parseChordSymbol('Faug')` se leía como la nota latina «Fa» más el sufijo «ug»; el parser ahora prefiere la lectura americana cuando el sufijo latino no es una calidad válida. Regresión cubierta para «Faug» y «Faaug».

### Estado

- 142 archivos / 1000 tests unitarios y 2 recorridos E2E en verde; typecheck, contenido, build y presupuesto verdes.
- JS inicial 208,99 kB gzip; Tone.js, VexFlow, FSRS y las muestras se cargan de forma diferida.
- Tag local `fase-3`.
- Deuda: el E2E siembra el prerrequisito en IndexedDB; la accesibilidad no se probó con un lector de pantalla real; la escucha de audio real sigue pendiente en hardware.

## [Fase 2] — 2026-11-10

### Agregado

- Curso M0-M2 completo: 30 lecciones publicadas (orientación, fundamentos y escalas/tonalidades), 150 ejercicios y 24 habilidades, con validación cruzada y gate de contenido en el build.
- Motor de ejercicios con generadores parametrizados (notas en teclado y pentagrama, deletreo de escalas, armaduras, transposición), variantes ver/oír/deletrear/tocar, distractores plausibles y feedback pedagógico «Recordá» con regla y ejemplo.
- Reproductor de ejercicios con corrección canónica, explicación, «Recordá», navegación y registro del intento como repaso FSRS.
- FSRS integrado con calificación automática, historial completo, cola diaria intercalada, previsión de carga y ajustes de retención, fuzz e intervalo máximo.
- Progreso en Dexie con migraciones, desbloqueo por prerrequisitos, XP, niveles, diez logros, racha con gracia semanal y plan de práctica diario de 15/30/45 minutos con temporizador.
- Exportación de progreso a `.txt` con JSON canónico y SHA-256, importación validada con reemplazo atómico, copia opcional en carpeta y reseteo con doble confirmación.
- Shell con hash router, mapa del curso, reproductor de lecciones, repaso de hoy, estadísticas, ajustes completos, tema claro/oscuro, i18n de interfaz ES/EN y aviso honesto sobre aprender sin profesor.
- E2E con Playwright del recorrido lección→ejercicio→repaso y persistencia tras recargar.
- Contenido bilingüe ES/EN de M0-M2: las 30 lecciones y los 150 ejercicios incluyen título, resumen, objetivos, secciones, tarea, glosario, enunciado, explicación y opciones en inglés. La UI del curso, la lección, la tarea, el reproductor y el feedback «Recordá» cambian de idioma en caliente, y tests de paridad comprueban contenido, índices de respuesta y feedback.

### Estado

- 112 archivos / 793 tests unitarios y 1 recorrido E2E en verde; typecheck, contenido, build y presupuesto verdes.
- JS inicial 195,76 kB gzip; Tone.js, VexFlow, FSRS y las muestras se cargan de forma diferida.
- Tag local `fase-2`.
- Deuda: los logros aún no se evalúan al guardar actividad; el E2E no corre en el workflow de Pages; M3-M8 aparecen como módulos vacíos.

## [Fase 1] — 2026-11-10

### Agregado

- Motor de teoría autoritativo: pitch/MIDI, ortografía por tonalidad, 15 armaduras, intervalos, escalas y modos, acordes con inversiones, números romanos, círculo de quintas y transposición.
- Teclado interactivo de tres octavas con pointer/touchmultitouch, mapeo de teclado de computadora remapeable y persistido, etiquetas Do-Re-Mi/C-D-E y navegación accesible.
- Motor de audio con inicialización tras gesto, timeline único para audio y UI, sampler Salamander con fallback a `PolySynth`, metrónomo, tempo, volumen y repetición.
- Pentagrama VexFlow con claves de sol/fa, armaduras, alteraciones, acordes, resaltado, zoom y alternativa textual bilingüe.
- Demo integrada con modos nota/escala/intervalo/acorde, controles, estado de audio, error boundary y reintento.
- i18n mínimo ES/EN con interpolación y contexto global de ajustes.
- 30 muestras Salamander (1.92 MB) con manifiesto, tamaños y SHA-256 verificados.
- Test de accesibilidad con axe y presupuesto de bundle (`npm run budget`).
- Guía `docs/GUIA-CAMBIOS.md` para trabajar con checklist primero ante interrupciones.

### Estado

- 23 archivos de test / 145 tests en verde; typecheck, build y budget verdes.
- JS inicial 107.60 kB gzip; Tone.js y VexFlow en chunks diferidos.
- Tag local `fase-1`. Sin remoto, sin GitHub Pages.
- La confirmación auditiva real de latencia y volumen queda pendiente (F1-038 documentada con esa limitación).

## [Fase 0] — 2026-11-09

### Agregado

- Scaffold Vite + React + TypeScript estricto con scripts de desarrollo, typecheck, test, build y estado.
- Esquemas Zod de notación, licencias, repertorio, habilidades, contenido, FSRS/progreso y audio.
- Validador de contenido con referencias cruzadas y gate de licencias en el build.
- Contenido semilla: 9 módulos, 1 lección de orientación, 1 ejercicio, 8 habilidades y 1 pieza original CC0.
- Protocolo de continuidad completo en `docs/`: CHECKLIST (278 tareas), RESUME, LOG, DECISIONES, ENTORNO y ESTADO generado.
- `scripts/estado.mjs` sin dependencias; test de formato del checklist con fixtures de error.
- Licencias MIT, CC BY-SA 4.0 y CC0; atribución de Salamander visible en la app.
- `scripts/fetch-samples.mjs` con dry-run sin red, reanudación por HTTP Range y verificación SHA-256.

### Estado

- 25 tests en verde; build inicial de 69.19 kB gzip.
- Tag local `fase-0`. Sin remoto, sin GitHub Pages y sin assets de audio descargados.
- Todavía no hay teclado interactivo, audio, pentagrama ni lecciones completas: eso comienza en F1.
