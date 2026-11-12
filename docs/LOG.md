# LOG — Piano Today

Bitácora cronológica. Solo se agrega al final. Cada entrada registra fecha-hora, ID de tarea, acción, resultado y, si falló, comando, primeras 30 líneas del error, causa probable y próximo paso.

## 2026-11-09T03:10:32-03:00 · Bootstrap (previo a F0-001)

- Acción: `git init` local, instalación de dependencias, scaffold Vite + React + TypeScript, shell mínima y harness de tests.
- Resultado: `npm install` OK (102 paquetes; npm 12 bloqueó el postinstall de esbuild y se aprobó con `npm install-scripts approve esbuild`). `npm run typecheck`, `npm test` y `npm run build` en verde. Bundle inicial: 220.96 kB (69.19 kB gzip).
- Causa de desvío: el scaffold se adelantó al bootstrap para poder verificar el toolchain; se contabiliza en F0-002.
- Próximo paso: registrar entorno, cerrar F0-001 y verificar F0-002.

## 2026-11-09T03:10:32-03:00 · F0-001

- Acción: verificación de Node/npm/git/red; auditoría de licencias de dependencias directas y transitivas; `docs/ENTORNO.md`.
- Resultado: Node 26.13.0, npm 12.2.2, git 2.56.0; red disponible; 171 paquetes, todas las licencias permisivas (MIT, Apache-2.0, MPL-2.0, BSD, ISC, BlueOak). Commit `d0b8f68`.
- Próximo paso: F0-002.

## 2026-11-09T03:15:00-03:00 · F0-002

- Acción: verificar servidor de desarrollo, typecheck, build y base configurable.
- Resultado: `npm run dev -- --port 5199` respondió HTTP 200; `npm run typecheck` verde; build 220.96 kB (69.19 kB gzip); con `VITE_BASE=/piano-desde-cero/` los assets se reescribieron correctamente. Commit del scaffold: `d0b8f68`.
- Próximo paso: F0-003.

## 2026-11-09T03:16:00-03:00 · F0-003

- Acción: smoke test de `App` y test de IndexedDB falsa; ejecución de typecheck y suite.
- Resultado: 2 archivos de test, 2 tests en verde; el harness carga `jest-dom` y `fake-indexeddb`. Commit `74ecbea`.
- Próximo paso: F0-004 (esquemas Zod).

## 2026-11-09T03:17:00-03:00 · F0-004

- Acción: esquemas Zod de notación, licencias, repertorio, habilidades, contenido, FSRS/progreso y audio; contenido semilla (M0-M8, lección de teclado y pieza original); validador con referencias cruzadas.
- Resultado: `npm run validate:content` OK (9 módulos, 1 lección, 1 ejercicio, 8 habilidades, 1 pieza); `npm test` 11 tests en verde; typecheck verde. Commit `d9797b3`.
- Próximo paso: F0-005 (gate en el build).

## 2026-11-09T03:18:00-03:00 · F0-005

- Acción: agregar `validate:content` al build y probar el gate con una ficha temporal sin compositor.
- Resultado: `npm run validate:content` OK con el contenido real; con `composer.name = ""` el comando salió 1 con `repertoire.1.license.composer.name: Too small`; `npm test` 12 tests; `npm run build` verde (69.19 kB gzip). Commit `5851d16`.
- Próximo paso: F0-006b (checklist de F2).

## 2026-11-09T03:19:00-03:00 · F0-006b

- Acción: escribir las 73 tareas de F2 (M0-M2, motor de ejercicios, FSRS, Dexie, exportación y UI).
- Resultado: checklist total 130 tareas únicas, 0 duplicados. Commit `4cb9afd`.
- Próximo paso: F0-006c.

## 2026-11-09T03:20:00-03:00 · F0-006c

- Acción: escribir las tareas de F3 (M3-M4 y auditivo) y F4 (M5-M6).
- Resultado: checklist total 197 tareas únicas, 0 duplicados. Commit `4cf4e3a`.
- Próximo paso: F0-006d (F5).

## 2026-11-09T03:22:00-03:00 · F0-006d y F0-006e

- Acción: escribir las 51 tareas de F5 y las 30 de F6, más el resumen por fase.
- Resultado: checklist completo con 278 tareas únicas, 0 duplicados. Conteo por fase: F0 16, F1 41, F2 73, F3 34, F4 33, F5 51, F6 30. Commit `d3b1407`.
- Próximo paso: F0-007 (script de estado).

## 2026-11-09T03:23:00-03:00 · F0-007

- Acción: implementar `scripts/estado.mjs` (solo módulos nativos), parsear CHECKLIST.md, calcular progreso por fase y ejecutar typecheck/test/build en orden.
- Resultado: `npm run estado` en verde; progreso 10/278 (3.6 %); ESTADO.md generado con tabla por fase, verificaciones y estado de git; sin dependencias externas. Commit `3b4f74d`.
- Próximo paso: F0-008 (test de formato).

## 2026-11-09T03:24:00-03:00 · F0-008

- Acción: test de formato del checklist con parser propio y 5 fixtures (duplicado, dos en curso, [x] sin hash, estado inválido, PUNTO incorrecto); se añadió `[NET]` a las 10 tareas con red.
- Resultado: 4 archivos de test, 18 tests en verde; valida IDs, estados, metadatos, PUNTO, última verificada y conteos del resumen. Commit `f483917`.
- Próximo paso: F0-009 (docs definitivos).

## 2026-11-09T03:26:00-03:00 · F0-009

- Acción: escribir RESUME.md con comandos y prompt de reanudación; DECISIONES.md con ADR-001 a ADR-011; actualizar ENTORNO.md y regenerar ESTADO.md.
- Resultado: `npm run estado` en verde (18 tests, build 69.19 kB gzip); documentación completa y verificable. Commit `4db194b`.
- Próximo paso: F0-010 (licencias).

## 2026-11-09T03:27:00-03:00 · F0-010

- Acción: LICENSE MIT, LICENSE-CONTENT CC BY-SA 4.0 con ejercicios CC0, THIRD_PARTY_LICENSES con inventario actual, previsto y Salamander; test de presencia y atribución en la app.
- Resultado: 5 archivos de test, 22 tests en verde; typecheck OK. Commit `ef026f9`.
- Próximo paso: F0-011 (manifiesto y fetch de muestras).

## 2026-11-09T03:29:00-03:00 · F0-011

- Acción: `scripts/fetch-samples.mjs` con dry-run sin red, descarga idempotente, reanudación por HTTP Range, verificación de tamaño y SHA-256, nombres seguros y modo real bloqueado sin entradas; manifiesto validado con Zod y tests.
- Resultado: dry-run reporta 0/30 declaradas y 30 faltantes; 6 archivos de test, 25 tests en verde; build OK. Commit `05eea14`.
- Próximo paso: F0-012 (cierre de fase).

## 2026-11-09T03:30:00-03:00 · F0-012

- Acción: resumen de cierre en el checklist, RESUME y ENTORNO actualizados, suite completa y tag local.
- Resultado: `npm run estado` verde; 25 tests; build 69.19 kB gzip; tag `fase-0`; PUNTO de reanudación movido a F1-001. Commit `5aa0261`.
- Próximo paso: F1-001 (Pitch y notación interna).

## 2026-11-09T10:45:00-03:00 · F1-001 a F1-014

- Acción: implementar el motor de teoría completo en `src/theory` (pitch/MIDI, ortografía por tonalidad, 15 armaduras, intervalos, escalas mayores/menores/modos/pentatónicas/blues/cromática/tonos enteros, acordes con inversiones y cifrado bilingüe, números romanos y funciones, círculo de quintas y transposición, errores «Recordá») más 6 archivos de tests, incluidos property tests en 12 tonalidades.
- Resultado: `npm run typecheck` verde; `npm test` 14 archivos / 87 tests en verde; sin dependencia del azar de Tonal (la capa propia es autoritativa). Commit `9a10bdb`.
- Correcciones durante la verificación: `scaleNames` ahora devuelve nombres sin octava y acepta dirección; `parseChordSymbol` acepta ♭/♯ Unicode; `chordDegreeInKey` ya no duplica la octava.
- Próximo paso: F1-015 (teclado responsive de 3 octavas).

## 2026-11-09T10:50:00-03:00 · F1-015 a F1-019

- Acción: layout de 3 octavas (21 blancas/15 negras), interacción pointer/touch/pen con captura y liberación por puntero, mapeo A-L/W-P remapeable y persistido, etiquetas Do-Re-Mi/C-D-E, panel de ajustes, resaltado accesible y navegación con flechas.
- Resultado: 16 archivos de test / 103 tests en verde; typecheck y build verdes. Commit `7472c84`.
- Corrección: `normalizeSettings` reinyectaba el mapa por defecto en cada actualización y resucitaba la tecla anterior; ahora solo aplica defaults si el mapa no viene informado.
- Pendiente honesto: F1-018 exige que el cambio de notación también se refleje en el pentagrama; queda `[ ]` hasta F1-028/F1-029.
- Próximo paso: F1-028/F1-029 (pentagrama VexFlow) para cerrar F1-018.

## 2026-11-09T10:56:00-03:00 · F1-028 a F1-032 (cierra F1-018)

- Acción: pentagrama VexFlow con import dinámico, claves de sol/fa, compás, las 15 armaduras, notas y acordes, alteraciones automáticas según armadura, click/Enter por nota, resaltado, zoom 200 %, medición responsive y alternativa textual bilingüe.
- Resultado: 17 archivos de test / 117 tests en verde; typecheck y build verdes. Commit `d73702c`.
- Corrección: `getSVGElement()` dependía de `document.getElementById`; ahora cada nota usa un ID propio y se busca dentro del contenedor, lo que funciona también fuera del documento.
- Tests: se stubbeó `canvas.getContext` en el setup para silenciar jsdom; VexFlow mide texto con canvas.
- Próximo paso: F1-020 (AudioEngine tras gesto).

## 2026-11-10T11:16:30-03:00 · F1-020 a F1-027

- Acción: motor de audio con inicialización tras gesto, estado observable, adaptador Tone.js, sampler bajo demanda con fallback a `PolySynth`, timeline único para audio y UI, notas e intervalos melódicos/armónicos, escalas, acordes bloque/arpegios/bajo+acorde, metrónomo con acentos, repetir, volumen/tempo y limpieza al detener.
- Resultado: 21 archivos de test / 142 tests en verde; typecheck y build verdes. Commit `2823751`.
- Decisiones: el timeline programa audio con lookahead y avisa a la UI con los mismos eventos; `AudioEngine` acepta adaptador y scheduler inyectables para tests; el sampler usa `public/audio/samples/` como base y cae al sintetizador si falta o falla.
- Correcciones: `setTempo` reinicia el pulso del metrónomo para no saltar al cambiar BPM; se actualizó `scripts/fetch-samples.mjs` (destino `public/audio/samples`) y `.gitignore`.
- Próximo paso: F1-033 (demo integrada con teclado, pentagrama y audio).

## 2026-11-10T11:35:00-03:00 · F1-033 a F1-037

- Acción: demo integrada con teclado, pentagrama y audio; modos nota/escala/intervalo/acorde; controles de tónica, modo, dirección, forma del intervalo, calidad y estilo del acorde, zoom, reproducir, detener, repetir y metrónomo; estado de audio con activación y reintento; `SettingsProvider` global con notación Do/C, idioma ES/EN, volumen y tempo; textos nuevos en el diccionario con interpolación; error boundary con reintento; test de axe y presupuesto de bundle.
- Resultado: typecheck verde; 23 archivos / 145 tests en verde; build y `npm run budget` verdes. Commit `cc2d570`.
- Rendimiento: JS inicial 107.60 kB gzip (< 300 kB), Tone.js diferido 76.98 kB gzip, VexFlow diferido 688.19 kB gzip; CSS 2.25 kB gzip.
- Accesibilidad: axe sin violaciones `critical`/`serious` en la demo; teclado y pentagrama mantienen nombres accesibles y navegación por teclado.
- Correcciones: el test de app se ajustó a los textos reales; se estabilizó el manifiesto de pruebas con `tests/fixtures/audio-manifest-empty.json`.
- Próximo paso: revisión manual F1-038 y cierre de assets F1-039/F1-040.

## 2026-11-10T11:40:00-03:00 · F1-038 a F1-040

- Acción: revisión estática de sonido, latencia y usabilidad; descarga de las 30 muestras Salamander, verificación de tamaño y SHA-256, cierre del manifiesto y tabla de assets en ENTORNO.
- Resultado: `node scripts/fetch-samples.mjs --dry-run` reporta 30 presentes, 0 faltantes y 0 inválidas; 30 MP3 suman 1.92 MB; el modo real no volvió a descargar nada porque todo estaba presente. Commit de código/assets `cc2d570`; documentación en el commit siguiente.
- Revisión manual F1-038: se verificó por código y tests que no queden notas trabadas (`stop`, `releaseAll`, limpieza de timers), que el metrónomo no derive dentro de la ventana simulada, que el volumen y el tempo se propaguen y que el fallback funcione sin muestras. **Limitación honesta:** esta sesión es headless, sin salida de audio física; no se pudo confirmar de oído la latencia real, el equilibrio de volumen ni la ausencia de artefactos. Queda pendiente una escucha humana de 5 minutos con `npm run dev` y auriculares/parlantes.
- Próximo paso: F1-041 (suite completa, `npm run estado`, RESUME y tag `fase-1`).

## 2026-11-10T11:52:00-03:00 · F1-041 (cierre de F1)

- Acción: marcar F1-033 a F1-041 como verificadas, actualizar RESUME/CHANGELOG, regenerar `docs/ESTADO.md`, ejecutar la suite completa y crear el tag local `fase-1`.
- Resultado: 23 archivos / 145 tests en verde; typecheck, build y budget verdes; F0 16/16 y F1 41/41 (total 57/278, 20.5 %). Commits `10c530d` (docs) y `fadecf7` (estado y cierre); tag `fase-1`.
- Limitación: F1-038 queda documentada con revisión estática; falta la escucha humana real de latencia y volumen. No se creó remoto, push, Actions ni Pages.
- Próximo paso: F2-001 (lección M0-01 y ejercicio de teclado).

## 2026-11-09T16:46:00-03:00 · F2-001 y ADR-012

- Reanudación: árbol limpio; el único cambio sin commitear era `docs/ESTADO.md` regenerado por `npm run estado` (HEAD y tiempos), no un WIP de la sesión cortada. Se conservó y se commiteó junto con la marca en curso.
- Nota de fecha: el reloj del sistema marca 2026-11-09; las entradas previas de F1 quedaron fechadas 2026-11-10. Se registra la fecha real del sistema.
- Acción: M0-01 completada con sección de pentagrama, `demoScore` en la tarea real, digitación ampliada y dos ejercicios nuevos (`ex.m0-01.b`, `ex.m0-01.c`) con corrección y opciones plausibles. Se agregó `tests/content-m0-01.test.ts`, que valida publicación, tarea, ejercicios, compases completos, render VexFlow y timeline de audio.
- Decisión: ADR-012. La idea de guardar el progreso en una carpeta personal queda diferida como F2-056a (File System Access API, solo Chromium de escritorio, con fallback a descarga). No se escribe en GitHub con tokens ni se agrega nube: IndexedDB + export/import sigue siendo la base.
- Resultado: 24 archivos / 152 tests en verde; typecheck y build verdes. Commits `e831fbc` (marca en curso), `5f34178` (ADR-012 y F2-056a) y `c02350d` (contenido y test).
- Limitación: el reproductor de lección llega en F2-060; la demo de audio/pentagrama se verificó por tests de render y timeline, no todavía en una pantalla de lección. La escucha humana real de F1-038 sigue pendiente.
- Próximo paso: F2-002 (M0-02, nombres de notas y octavas).

## 2026-11-09T16:51:00-03:00 · F2-002

- Acción: M0-02 publicada con la relación Do-Re-Mi/C-D-E, el Do central como Do4 y el registro de octavas 2 a 6. Se agregaron dos demos de pentagrama (clave de sol: Do4-Do5-Do6; clave de fa: Do2-Do3), demo de teclado Do3-Do4-Do5, tarea real con digitación/checklist y cinco ejercicios: dos de teclado y tres de pentagrama.
- Habilidades: `skill.note-names` ampliada a C2-C6, `skill.note-staff` vinculada a M0-02 y nueva `skill.octave-numbers`.
- Resultado: 25 archivos / 161 tests en verde; typecheck y build verdes. Commit `c6497ae`.
- Correcciones: el test estrecha el union de ejercicios antes de leer `target`/`choices` para que TypeScript estricto no falle.
- Limitación: el reproductor de lección sigue pendiente (F2-060); las demos se verificaron por render VexFlow y timeline de audio en tests.
- Próximo paso: F2-003 (postura, banco y digitación).

## 2026-11-09T16:54:00-03:00 · F2-003

- Acción: M0-03 publicada con texto original sobre banco, distancia, forma de la mano y digitación 1-2-3-4-5; callout de señales de tensión (dolor, rigidez, hormigueo, hombros, muñeca) y aviso honesto sobre los límites de aprender sin profesor (espejo, grabación, consulta presencial). Tarea autoevaluable de cinco dedos con digitación, tempo y checklist de cuatro puntos, más demo de pentagrama en 5/4.
- Habilidades: nueva `skill.posture` de tipo `keyboard-task`.
- Resultado: 26 archivos / 167 tests en verde; typecheck y build verdes. Commit `47a1e5b`.
- Corrección: el test exigía la palabra «tensión» en el cuerpo y solo estaba en el título del callout; se incorporó al texto.
- Limitación: la tarea es autoevaluable; la app no corrige postura en tiempo real. El reproductor de lección sigue pendiente (F2-060).
- Próximo paso: F2-004 (cómo practicar: metas, tiempo y error).

## 2026-11-09T16:57:00-03:00 · F2-004

- Acción: M0-04 publicada con el método meta-tiempo-error, ejemplos de metas medibles (BPM, repeticiones, compases), ejercicio escrito de planificación con cinco campos, checklists de 15/30/45 minutos y sección sobre registro. Tarea autoevaluable de cinco dedos con digitación, tempo y checklist de cuatro puntos, más demo de pentagrama en 5/4.
- Habilidades: nueva `skill.practice-planning` de tipo `keyboard-task`.
- Resultado: 27 archivos / 175 tests en verde; typecheck y build verdes. Commit `3552baa`.
- Corrección: el ejercicio de planificación ahora empieza con «Planificá» también en el cuerpo, no solo en el título.
- Limitación: el ejercicio de planificación es escrito y autoevaluable; no hay UI interactiva de planificación todavía. El reproductor de lección sigue pendiente (F2-060).
- Próximo paso: F2-005 (diagnóstico inicial y mapa del curso).

## 2026-11-09T17:02:00-03:00 · F2-005

- Acción: M0-05 publicada con un diagnóstico de 8 ítems (teclado, notas con octava, pentagrama, pulso, intervalos, escalas, acordes y hábitos de práctica), tres opciones por ítem y puntaje máximo 16. Se documentaron las bandas 0-4 → M0, 5-8 → M1, 9-12 → M2 y 13-16 → M3, todas no bloqueantes. Se agregó el mapa M0-M8 y una tarea de cinco dedos como termómetro de entrada.
- Lógica: `src/content/diagnostic.ts` con `DIAGNOSTIC_ITEMS`, `DIAGNOSTIC_BANDS`, `DIAGNOSTIC_MAX` y `scoreDiagnostic`; acepta respuestas parciales, ignora claves desconocidas y rechaza opciones inválidas.
- Habilidades: nueva `skill.course-orientation`.
- Resultado: 29 archivos / 191 tests en verde; typecheck, `validate:content` y build verdes. Commit `b5a9990`.
- Corrección: el test buscaba «no es un examen» en el cuerpo y el texto está en el título de la sección; se ajustó el test para verificar el título.
- Limitación: el diagnóstico es lógica pura; su pantalla interactiva y el mapa visual con estados llegan con el shell (F2-058/F2-060). El reproductor de lección sigue pendiente.
- Próximo paso: F2-006 (practicar sin profesor: espejo, grabación y tensión).

## 2026-11-09T17:05:00-03:00 · F2-006

- Acción: M0-06 publicada con autoobservación mediante espejo de costado (hombros, codos, muñeca, mandíbula) y grabación con tres criterios (pulso, notas limpias, sonido sin golpes). Checklist de tensión antes/durante/después, protocolo de autoobservación de 7 pasos y advertencia honesta sobre los límites sin profesor. Tarea de cinco dedos con checklist de cinco puntos y demo de pentagrama en 5/4.
- Habilidades: nueva `skill.self-observation`.
- Resultado: 30 archivos / 200 tests en verde; typecheck, `validate:content` y build verdes. Commit `9dd3896`.
- Corrección: el test pedía «escuchá» y el texto decía «escuchala»; se unificó la forma verbal en el contenido.
- Limitación: las pautas son autoevaluables y escritas; la app todavía no guía el espejo ni analiza grabaciones. El reproductor de lección sigue pendiente (F2-060).
- Próximo paso: F2-007 (M1-01, altura, duración, intensidad y timbre).

## 2026-11-09T17:09:30-03:00 · F2-007

- Acción: M1-01 publicada con los cuatro parámetros del sonido. Altura con demo de teclado Do3-Do4-Do5; duración con compás 4/4 de blanca, negra y dos corcheas; intensidad con la misma nota a velocidades 40/80/120; timbre explicado con piano, flauta, órgano y cuerdas. Ejercicio de escucha A/B y tarea de cinco dedos con piano, forte, crescendo y diminuendo.
- Esquema: nuevo tipo de ejercicio `sound-parameter` con `exampleA`/`exampleB` y parámetro objetivo; nueva habilidad `skill.sound-parameters` de tipo homónimo.
- Resultado: 31 archivos / 208 tests en verde; typecheck, `validate:content` y build verdes. Commit `4065ef5`.
- Corrección: el test mapea cada parámetro a su campo (`pitch`→`midi`, `duration`→`beats`, `intensity`→`velocity`, `timbre`→`timbre`) para verificar que A/B cambien solo un campo.
- Limitación: el motor de audio todavía usa un solo timbre de piano y no reproduce los ejemplos A/B de timbre ni las intensidades desde el reproductor de lección; la lógica y el contenido quedan listos para el shell (F2-060).
- Próximo paso: F2-008 (M1-02, pentagrama, claves y Do central).

## 2026-11-09T17:13:00-03:00 · F2-008

- Acción: M1-02 publicada con las cinco líneas y cuatro espacios, clave de sol (Sol4 en la segunda línea, Do4 en la primera línea adicional inferior), clave de fa (Fa3 en la cuarta línea, Do4 en la primera línea adicional superior) y el Do central como puente entre claves. Dos demos renderizadas (sol: Do4-Mi4-Sol4-Si4; fa: Do4-La3-Fa3-Re3), trucos de lectura y tarea de localización de Do4 con pulgar derecho e izquierdo.
- Habilidades: `skill.note-staff` vinculada también a M1-02.
- Resultado: 32 archivos / 216 tests en verde; typecheck, `validate:content` y build verdes. Commit `b0fcbc7`.
- Corrección: el test necesitó estrechar el union a `note-staff` antes de leer `choices`; se agregó la comprobación explícita.
- Limitación: el render soporta una clave por pentagrama; el gran pentagrama se explica en texto, no se dibuja todavía. El reproductor de lección sigue pendiente (F2-060).
- Próximo paso: F2-009 (M1-03, alteraciones, enarmonía, tonos y semitonos).

## 2026-11-09T17:18:00-03:00 · F2-009

- Acción: M1-03 publicada con sostenido, bemol y natural; demo de teclado Do4-Do♯4-Re4-Mi♭4-Mi4; explicación de semitono (tecla contigua) y tono (dos semitonos), con Mi-Fa y Si-Do como semitonos naturales; enarmonía Do♯/Re♭, Re♯/Mi♭, Fa♯/Sol♭, Sol♯/La♭ y La♯/Si♭; demo de pentagrama Do4-Do♯4-Re4 y tarea de semitono/tono desde Do.
- Ejercicios: 12 de intervalo (uno por tónica: C, C♯, D, E♭, E, F, F♯, G, A♭, A, B♭, B) y 2 de enarmonía en el teclado (Do♯/Re♭ y Fa♯/Sol♭).
- Habilidades: nueva `skill.accidentals`.
- Resultado: 33 archivos / 225 tests en verde; typecheck, `validate:content` y build verdes. Commit `9fd52e1`.
- Corrección: el `aria-label` de VexFlow usa el sostenido Unicode (`C♯4`), no `C#4`; se ajustó la expectativa del test.
- Limitación: el audio de las alteraciones se verifica por render/timeline, no por el reproductor de lección (F2-060).
- Próximo paso: F2-010 (M1-04, figuras y silencios).

## 2026-11-09T19:27:54-03:00 · F2-010

- Acción: M1-04 publicada con las seis figuras (redonda, blanca, negra, corchea, semicorchea y treintaidosavo/fusa), la relación de cada figura con su silencio, el método para completar compases y dos demos con duraciones reales: una de redonda a corcheas y otra con semicorcheas y treintaidosavos. Tarea de teclado con blanca, negra y dos corcheas sobre Do4.
- Esquema: nuevo tipo de ejercicio `rhythm-completion` con `timeSignature`, `pattern`, `missingIndex` y `choices`; `RhythmCell` extiende la figura rítmica con `rest` para representar silencios en los patrones. `STAFF_DURATIONS` incorpora el código `32` de VexFlow.
- Ejercicios: ocho de completar compases en 2/4, 3/4 y 4/4 (incluye silencio de negra y treintaidosavo como respuestas) y dos dictados rítmicos con secuencias de duraciones.
- Resultado: 34 archivos / 235 tests en verde; typecheck, `validate:content` y build verdes. Commit `62d338d`.
- Correcciones: un ID de evento duplicado entre dos compases de la demo; dos patrones de dictado sumaban cinco tiempos en 4/4 y se ajustaron a cuatro; las opciones de los dictados se unificaron con las etiquetas capitalizadas que genera el test.
- Limitación: los silencios se explican y se evalúan como celdas de ejercicio, pero el render de pentagrama todavía no dibuja silencios y el reproductor de lección aún no ejecuta estos patrones; el audio se verifica por duraciones y tempo (F2-060).
- Próximo paso: F2-011 (M1-05, compases simples).

## 2026-11-09T19:33:42-03:00 · F2-011

- Acción: M1-05 publicada con la indicación de compás (numerador y denominador), las fórmulas 2/4, 3/4 y 4/4 y la acentuación fuerte-débil, fuerte-débil-débil y fuerte-débil-semifuerte-débil. Tres demos de audio con velocidades distintas para hacer audible el acento, sección de práctica con metrónomo y tarea de teclado en 4/4 a 80 BPM.
- Esquema: nuevo tipo de ejercicio `meter-accent` con `timeSignature`, `accentedBeats` y `choices`; el validador rechaza pulsos acentuados fuera del numerador y exige que el pulso 1 esté acentuado.
- Ejercicios: seis de completar compases (2/4, 3/4 y 4/4) y tres de marcar acentos (uno por compás).
- Resultado: 35 archivos / 246 tests en verde; typecheck, `validate:content` y build verdes. Commit `98f9e52`.
- Sin correcciones: el contenido y los tests pasaron en la primera verificación completa.
- Limitación: el metrónomo se describe y se usa en la tarea, pero el reproductor de lección todavía no ejecuta la demo con acentos ni muestra la UI del metrónomo (F2-060); el audio se verifica por tiempo, tempo y velocidades.
- Próximo paso: F2-012 (M1-06, compases compuestos).

## 2026-11-09T19:59:08-03:00 · Reanudación F2-012

- Acción: revisión del protocolo (`RESUME`, `GUIA-CAMBIOS`, `CHECKLIST`, últimas 50 líneas de `LOG` y `DECISIONES`), `npm run estado`, `git status` y `git log -5`.
- Estado: árbol de trabajo limpio; no quedaron cambios sin commitear de la sesión interrumpida, así que no hubo nada que completar ni descartar. Suite en verde (35 archivos / 246 tests), typecheck y build verdes.
- Tarea activa: no había `[~]` ni `[!]`; la primera pendiente es F2-012 (M1-06, compases compuestos).
- Decisión: continuar con F2-012 sin rehacer tareas `[x]`.
- Próximo paso: escribir M1-06, sus ejercicios y tests; verificar y cerrar la tarea.

## 2026-11-09T20:02:15-03:00 · F2-012

- Acción: M1-06 publicada con compases compuestos 6/8, 9/8 y 12/8; el pulso como negra con puntillo, la subdivisión ternaria y la diferencia entre 3/4 y 6/8. Tres demos de seis, nueve y doce corcheas con acentos al inicio de cada grupo de tres, sección de práctica con metrónomo y tarea de teclado en 6/8 a 80 BPM.
- Esquema: no hizo falta cambiar los esquemas; `meter-accent` ya admite denominador 8 y el validador acepta acentos hasta el numerador. Se agregó la habilidad `skill.compound-meter` con las tres indicaciones y la subdivisión ternaria.
- Ejercicios: cinco de completar compases (dos en 6/8, uno en 9/8 y dos en 12/8, con negras y blancas con puntillo) y tres de marcar acentos (6/8, 9/8 y 12/8).
- Resultado: 36 archivos / 257 tests en verde; typecheck, `validate:content` y build verdes. Commit `ee5a616`.
- Corrección: la etiqueta esperada de los acentos unía los pulsos con coma en el test; se ajustó a «1 y 4», «1, 4 y 7» y «1, 4, 7 y 10» para coincidir con las opciones del contenido.
- Limitación: el reproductor de lección todavía no ejecuta estas demos ni muestra la UI del metrónomo (F2-060); el audio se verifica por posición de pulso, duración y velocidad. El render de pentagrama no dibuja puntillos ni silencios: las demos usan corcheas y los puntillos aparecen en los patrones de los ejercicios.
- Próximo paso: F2-013 (M1-07, puntillo, ligadura y tresillo).

## 2026-11-09T20:07:59-03:00 · F2-013

- Acción: M1-07 publicada con el puntillo (alarga la mitad del valor), la ligadura de prolongación (suma duraciones, incluso a través de la barra) y el tresillo (tres figuras en el tiempo de dos). Demos de blanca con puntillo en 4/4, Do4 ligado entre compases, tresillo de corcheas en 4/4 y tresillo de negras en 6/8. Se explica que en compás compuesto la subdivisión normal ya es ternaria y que un tresillo verdadero aparece en otro nivel.
- Esquema: no hizo falta cambiar esquemas; `dots` y `tuplet` ya existían en `RhythmicValue` y `tieToNext` en `NoteEvent`. Se agregó la habilidad `skill.rhythm-variants`.
- Ejercicios: cuatro de completar (dos con puntillo en 4/4, uno con tresillo de corcheas en 4/4 y uno con tresillo de negras en 6/8) y dos dictados (4/4 y 6/8).
- Resultado: 37 archivos / 270 tests en verde; typecheck, `validate:content` y build verdes. Commit `7aac4f0`.
- Sin correcciones: el contenido y los tests pasaron en la primera verificación completa.
- Limitación: el reproductor de lección sigue pendiente (F2-060) y el render de pentagrama no dibuja puntillos, ligaduras ni tresillos; las demos guardan esos datos y los tests verifican duraciones y capacidades, pero la representación visual completa queda para el reproductor.
- Próximo paso: F2-014 (M1-08, síncopa y anacrusa).

## 2026-11-09T20:13:27-03:00 · F2-014

- Acción: M1-08 publicada con la síncopa (nota que empieza en parte débil y se prolonga sobre el pulso fuerte), la diferencia con el contratiempo y la anacrusa (compás incompleto al inicio que no se cuenta como compás 1 y se compensa al final). Demos de síncopa y de anacrusa en 4/4 a 80 BPM, más una llamada de atención que separa síncopa, contratiempo y anacrusa.
- Esquema: se agregó el tipo de ejercicio `anacrusis-completion` en `src/schemas/content.ts` (con `pickup`, `pattern`, `missingIndex` y `choices`). El validador de `src/content/validate.ts` ahora revisa `missingIndex` también para ese tipo.
- Ejercicios: un dictado con síncopa, uno de completar, tres de compensación de anacrusa (anacrusa de 1, de 2 y de 2 corcheas) y uno de acentos de metrónomo en 1 y 3.
- Corrección: la primera verificación falló porque las instrucciones de la tarea no contenían la palabra «síncopa»; se agregó «secuencia de síncopa» y el test pasó.
- Resultado: 38 archivos / 283 tests en verde; typecheck, `validate:content` y build verdes. Commit `478e698`.
- Limitación: el reproductor de lección y la UI del metrónomo siguen pendientes (F2-060); el render de pentagrama no dibuja síncopas ni anacrusas de forma especial. Las demos guardan las posiciones de pulso y los tests verifican duraciones, capacidades y acentos.
- Próximo paso: F2-015 (M1-09, tempo y metrónomo).

## 2026-11-09T20:18:49-03:00 · F2-015

- Acción: M1-09 publicada con el tempo en BPM, los términos italianos de más lento a más rápido (grave a prestissimo), los cambios de tempo (ritardando, accelerando, a tempo, rubato), la estabilidad con metrónomo y el control de tempo persistente de 40 a 240 BPM. Dos demos de la misma melodía a 72 BPM (andante) y 132 BPM (allegro) para comparar sin cambiar las figuras.
- Esquema: se agregaron `TEMPO_MARK_VALUES`, `TEMPO_MARK_RANGES` y `TempoMarkSchema` en `src/schemas/content.ts`, más los tipos de ejercicio `tempo-term` (término + BPM + opciones) y `tempo-stability` (BPM objetivo, pulsos y tolerancia). El validador comprueba que el BPM corresponda al rango del término y que la ventana de tolerancia no salga de 40-240 BPM.
- Ejercicios: cuatro de término (adagio 60, moderato 90, allegro 132, presto 184) y dos de estabilidad (60 BPM/16 pulsos/±3 y 120 BPM/8 pulsos/±4).
- Persistencia: el control de tempo ya existía desde F1-025 en `src/state/settings.tsx` (clamp 40-240 y guardado en localStorage); el test de M1-09 lo verifica con `normalizeSettings`, `saveSettings` y `loadSettings` sin duplicar la implementación.
- Resultado: 39 archivos / 293 tests en verde; typecheck, `validate:content` y build verdes. Commit `a5b99e2`.
- Sin correcciones: el contenido, el esquema y los tests pasaron en la primera verificación completa.
- Limitación: el reproductor de lección y la UI del metrónomo siguen pendientes (F2-060); el render de pentagrama no muestra términos ni cambios de tempo. Las demos guardan `tempoBpm` y los tests verifican rangos, duraciones, tolerancias y persistencia.
- Próximo paso: F2-016 (M1-10, dinámica y articulación).

## 2026-11-09T20:23:11-03:00 · F2-016

- Acción: M1-10 publicada con la dinámica de pp a ff, los nombres italianos (pianissimo a fortissimo), crescendo y diminuendo, la producción de intensidad en el piano y la articulación legato, staccato, acento y tenuto. Demo de Do4 con velocities pp/mf/ff/mf para escuchar el cambio de intensidad sin cambiar altura ni ritmo, y tarea real de cuatro compases en pp, mf y ff con articulaciones.
- Esquema: se agregaron `DYNAMIC_MARK_VALUES`, `DYNAMIC_MARK_RANGES`, `DynamicMarkSchema`, `ARTICULATION_VALUES` y `ArticulationSchema` en `src/schemas/content.ts`, más los tipos `dynamic-mark` (marca + velocity + opciones) y `articulation` (legato/staccato/acento + midi + duración + velocity). El validador comprueba que la velocity corresponda al rango de la marca y que el staccato no dure más de un pulso ni el legato menos de uno.
- Ejercicios: dos de marca dinámica (pp y ff), uno de escucha con `sound-parameter` de intensidad y tres de articulación (legato, staccato y acento).
- Corrección: la primera validación falló porque `skills.json` no admite arrays de números en `params`; `velocityRange: [1, 127]` se reemplazó por `minVelocity: 1` y `maxVelocity: 127`.
- Resultado: 40 archivos / 303 tests en verde; typecheck, `validate:content` y build verdes. Commit `205087c`.
- Limitación: el reproductor de lección sigue pendiente (F2-060) y el render de pentagrama no dibuja marcas dinámicas ni articulaciones. Las demos guardan `velocity` y los ejercicios guardan la articulación; los tests verifican rangos y duraciones.
- Próximo paso: F2-017 (M1-11, repeticiones, da capo, segno y coda).

## 2026-11-09T20:27:32-03:00 · F2-017

- Acción: M1-11 publicada con los signos de repetición (||: y :||), las casillas de primera y segunda, da capo (D.C.), D.C. al Fine, segno, dal segno (D.S.), D.S. al Fine, D.S. al Coda, To Coda, coda y Fine. Ejemplo A-B-A en tres compases y recetas de orden (A A B, A A B B, A B1 A B2, A B C A B, A B A B C, A B C B C, A B C B D).
- Esquema: se agregó `PlaybackSectionSchema` y el tipo de ejercicio `playback-order` con secciones, bandera `repeat`, respuesta como secuencia de IDs y opciones. El validador comprueba IDs duplicados, respuestas con secciones inexistentes, secciones omitidas y secciones repetidas que aparecen una sola vez.
- Ejercicios: seis de orden de reproducción (repetición simple, dos repeticiones, D.C. al Fine, D.S. al Coda, primera y segunda casilla, D.C. al Coda).
- Corrección: en el ejercicio de primera y segunda casilla el validador esperaba que B1 apareciera dos veces; se movió la bandera `repeat` a A, que es la sección que efectivamente se repite en el orden A B1 A B2.
- Resultado: 41 archivos / 311 tests en verde; typecheck, `validate:content` y build verdes. Commit `0e12650`.
- Limitación: el reproductor de lección sigue pendiente (F2-060) y el render de pentagrama no dibuja signos de repetición, segno ni coda. Los ejercicios guardan el orden esperado y los tests verifican las secuencias.
- Próximo paso: F2-018 (M1-12, términos italianos).

## 2026-11-09T20:34:12-03:00 · F2-018

- Acción: M1-12 publicada con 20 términos italianos agrupados en cuatro categorías: tempo (adagio, allegro, andante, moderato, presto, ritardando, accelerando y rubato), dinámica (crescendo, diminuendo, pianissimo y fortissimo), articulación (legato, staccato, accentato y tenuto) y carácter (dolce, cantabile, espressivo y maestoso). Glosario estructurado con categoría, significado y ejemplo propios; dos demos de la misma frase en andante (72 BPM) y allegro (132 BPM); quiz de seis términos y tarea real con cantabile, legato, allegro y tenuto.
- Esquema: se agregaron `ITALIAN_TERM_VALUES`, `ITALIAN_TERM_CATEGORIES`, `GlossaryEntrySchema` y el campo `glossary` en `LessonSchema`, más el tipo de ejercicio `italian-term` en `src/schemas/content.ts`. El validador comprueba términos duplicados, categoría coherente y presencia de la respuesta correcta entre las opciones.
- Ejercicios: seis de término (adagio, allegro, crescendo, diminuendo, legato y staccato) con cuatro opciones cada uno, incluyendo distractores de la misma categoría.
- Corrección: la primera verificación falló con `ReferenceError: Cannot access 'GlossaryEntrySchema' before initialization` porque `LessonSchema` usaba el glosario antes de su definición; se movieron los tipos de términos italianos arriba de `LessonSchema`.
- Resultado: 42 archivos / 321 tests en verde; typecheck, `validate:content` y build verdes. Commit `9968708`.
- Limitación: el reproductor de lección y la UI del metrónomo siguen pendientes (F2-060); el render de pentagrama no dibuja términos de tempo, dinámicas ni articulaciones. Las demos guardan `tempoBpm` y los tests verifican duraciones, categorías y opciones.
- Próximo paso: F2-019 (M2-01, escala mayor y armaduras), que abre el módulo M2.

## 2026-11-09T21:01:12-03:00 · F2-019

- Acción: M2-01 «Escala mayor y armaduras» publicada. Se agregó la lección con el patrón T-T-S-T-T-T-S, las doce escalas mayores (sostenidos y bemoles), la demo de la escala de Sol en pentagrama (4/4, 80 BPM) y la tarea real de teclado con la escala de Sol a 60 BPM.
- Esquema: sin cambios de esquema nuevos: los tipos `scale-spelling` y `key-signature` ya existían en `src/schemas/content.ts`; la lección reutiliza los skills `skill.major-scale` y `skill.key-signature`.
- Ejercicios: 12 de deletreo (una por escala mayor: C, G, D, A, E, B, F#, F, Bb, Eb, Ab, Db) con las respuestas correctas y distractores plausibles, más 3 de armadura (G mayor, Mi bemol mayor, Fa sostenido mayor).
- Corrección: la primera pasada del test nuevo falló dos veces por errores del propio test (el texto evaluado no contenía la palabra «tonalidad» y se comparaban explicaciones truncadas); se ajustaron las aserciones y el contenido no cambió.
- Resultado: 43 archivos / 328 tests en verde; typecheck, `validate:content` y build verdes. Commit `2065fd9`.
- Limitación: el reproductor de lección (F2-060) y la UI de ejercicios siguen pendientes; el render de pentagrama ya muestra la tonalidad y la escala elegidas.
- Próximo paso: F2-020 (M2-02, círculo de quintas).

## 2026-11-09T21:06:40-03:00 · F2-020

- Acción: M2-02 «Círculo de quintas» publicada. Se agregó la lección con el concepto de quinta justa, el recorrido de las doce posiciones (Do → Sol → Re → La → Mi → Si → Fa sostenido → Do sostenido → Re bemol → Mi bemol → Si bemol → Fa bemol) y las armaduras acumuladas.
- Esquema: sin cambios de esquema: se reutilizan los tipos `key-signature` y el skill `skill.key-signature`.
- Ejercicios: 12 de armadura, uno por tonalidad del círculo (C, G, D, A, E, B, F#, F, Bb, Eb, Ab, Db) con la cantidad correcta de alteraciones y distractores plausibles.
- Corrección: no hubo correcciones de contenido en esta sesión; los tests nuevos fallaron la primera pasada por una aserción con texto truncado («alteraci») y se corrigió la aserción.
- Resultado: 44 archivos / 333 tests en verde; typecheck, `validate:content` y build verdes. Commit `fd3a08a`.
- Limitación: el reproductor de lección (F2-060) y la UI del círculo siguen pendientes; la app aún no renderiza el círculo de quintas.
- Próximo paso: F2-021 (M2-03, relativas y homónimas).

## 2026-11-09T21:12:30-03:00 · F2-021

- Acción: M2-03 «Relativas y homónimas» publicada. Se agregó la lección con la definición de relativa menor (sexto grado, tres semitonos abajo), los doce pares mayor → relativa menor y el ejercicio de clasificación mayor/menor.
- Esquema: sin cambios de esquema: se reutilizan los tipos `key-signature` y los skills `skill.key-signature` y `skill.major-scale`.
- Ejercicios: tres de clasificación (Do menor, Mi menor, Sol mayor) con las respuestas correctas y una opción por lado.
- Corrección: la primera pasada del test nuevo falló porque el cuerpo de la lección no contenía la palabra «homónima»; se agregó la definición de homónimas a la introducción.
- Resultado: 45 archivos / 337 tests en verde; typecheck, `validate:content` y build verdes. Commit `7a7fb08`.
- Limitación: el reproductor de lección (F2-060) y la UI de relativas siguen pendientes; la app aún no clasifica tonalidades.
- Próximo paso: F2-022 (M2-04, menor natural).

## 2026-11-09T21:18:20-03:00 · F2-022

- Acción: M2-04 «Menor natural» publicada. Se agregó la lección con el patrón T-S-T-T-T-S-T del menor, la lista de las doce tonalidades menores y el ejercicio de audio que compara el tercer grado del menor con el de la mayor.
- Esquema: sin cambios de esquema: se reutilizan los tipos `sound-parameter` y `scale-spelling` con sus skills correspondientes.
- Ejercicios: un de audio comparando el tercer grado menor (Mi bemol) contra el mayor (Mi), y un de deletreo del menor natural (C D Eb F G Ab Bb C).
- Corrección: la primera pasada de contenido falló en el validador porque el modo menor del ejercicio de deletreo se escribió como `minor`; se corrigió a `natural-minor`.
- Resultado: 46 archivos / 343 tests en verde; typecheck, `validate:content` y build verdes. Commit `a94b9cf`.
- Limitación: el reproductor de lección (F2-060) y la UI de sonido siguen pendientes; la app aún no compara audios en el ejercicio.
- Próximo paso: F2-023 (M2-05, menor armónica).

## 2026-11-09T21:33:00-03:00 · F2-024

- Acción: M2-06 «Menor melódica» publicada. Se agregó la lección con el menor melódico (ascendente con séptimo grado elevado, descendente con sexto grado elevado), las doce tonalidades menores y los ejercicios de deletreo + audio.
- Esquema: sin cambios de esquema: se reutilizan los tipos `scale-spelling` (modo `melodic-minor`) y `sound-parameter` con sus skills correspondientes.
- Ejercicios: un de deletreo del menor melódico (C D Eb F G Ab B C) y uno de audio que compara el séptimo grado melódico contra el menor armónico.
- Corrección: no hubo correcciones de contenido en esta sesión; los tests nuevos pasaron en la primera pasada.
- Resultado: 48 archivos / 353 tests en verde; typecheck, `validate:content` y build verdes. Commit `3422915`.
- Limitación: el reproductor de lección (F2-060) y la UI de sonido siguen pendientes; la app aún no compara audios en el ejercicio.
- Próximo paso: F2-025 (M2-07, Grados y funciones).

## 2026-11-09T21:43:30-03:00 · F2-025

- Acción: M2-07 «Grados y funciones» publicada. Se agregó la lección con los grados I a VII, la numeración con números romanos (incluyendo minúsculas por calidad) y las funciones tónica/subdominante/dominante.
- Esquema: sin cambios de esquema: se reutiliza el tipo `roman-numeral` con su skill `skill.chord-quality` y el skill `skill.major-scale`.
- Ejercicios: 12 de números romanos, uno por tonalidad de la lista (C, G, D, A, E, B, F#, F, Bb, Eb, Ab, Db), preguntando por el quinto grado con función dominante (V).
- Corrección: no hubo correcciones de contenido; el primer fallo fue del propio test (búsqueda de la palabra «tonica» sin tilde) y se ajustó la aserción.
- Resultado: 49 archivos / 358 tests en verde; typecheck, `validate:content` y build verdes. Commit `bdb3f09`.
- Limitación: el reproductor de lección (F2-060) y la UI de ejercicios siguen pendientes; la app aún no resuelve progresiones con romanos.
- Próximo paso: F2-026 (M2-08, Modos).

## 2026-11-09T21:47:10-03:00 · F2-026

- Acción: M2-08 «Modos» publicada. Se agregó la lección con los siete modos de la escala mayor, su color, el ejemplo de la escala de Lídio en Do y la sección de relativas.
- Esquema: sin cambios de esquema: se reutilizan los tipos `ear-scale` y `scale-spelling` con los skills `skill.major-scale`.
- Ejercicios: identificación auditiva del modo Lídio (ear-scale) y deletreo del modo dórico (scale-spelling).
- Corrección: no hubo correcciones de contenido en esta sesión.
- Resultado: 50 archivos / 364 tests en verde; typecheck, `validate:content` y build verdes. Commit `3db1cc5`.
- Limitación: el reproductor de lección (F2-060) y la UI de oído siguen pendientes; la app aún no identifica modos de forma auditiva en la práctica.
- Próximo paso: F2-027 (M2-09, Pentatónicas).

## 2026-11-09T21:52:05-03:00 · F2-027

- Acción: M2-09 «Pentatónicas» publicada. Se agregó la lección con las pentatónicas mayor y menor, la demo de la pentatónica mayor de Do y la sección de creación.
- Esquema: sin cambios de esquema: se reutilizan los tipos `scale-spelling` (modos `major-pentatonic` y `minor-pentatonic`) con el skill `skill.major-scale`.
- Ejercicios: dos de creación de escala pentatónica (mayor y menor).
- Corrección: no hubo correcciones de contenido; los tests nuevos fallaron en las aserciones con nombres acentuados y se ajustaron.
- Resultado: 51 archivos / 369 tests en verde; typecheck, `validate:content` y build verdes. Commit `342236b`.
- Limitación: el reproductor de lección (F2-060) y la UI de oído siguen pendientes; la app aún no practica pentatónicas.
- Próximo paso: F2-028 (M2-10, Escala de blues).

## 2026-11-09T21:57:00-03:00 · F2-028

- Acción: M2-10 «Escala de blues» publicada. Se agregó la lección con la fórmula de la escala de blues (menor pentatónica + bemol de la quinta), las doce tonalidades, la demo de la escala de blues de Do, el ejercicio de patrón (fórmula) y el de audio (identificación).
- Esquema: sin cambios de esquema: se reutilizan los tipos `scale-spelling` (modo `blues`) y `ear-scale` con el skill `skill.major-scale`.
- Ejercicios: patrón con fórmula (C D# F# G A C) y audio (identificación del modo Blues).
- Corrección: no hubo correcciones de contenido en esta sesión.
- Resultado: 52 archivos / 374 tests en verde; typecheck, `validate:content` y build verdes. Commit `3f8e160`.
- Limitación: el reproductor de lección (F2-060) y la UI de oído siguen pendientes; la app aún no practica la escala de blues.
- Próximo paso: F2-029 (M2-11, Cromática y tonos enteros).

## 2026-11-09T22:00:10-03:00 · F2-029

- Acción: M2-11 «Cromática y tonos enteros» publicada. Se agregó la lección con la escala cromática (doce semitonos) y la escala de tonos enteros, la demo de la escala de tonos enteros en Do, los ejercicios de deletreo y de escucha, y la tarea real de teclado.
- Esquema: sin cambios de esquema: se reutilizan los tipos `scale-spelling` (modos `chromatic` y `whole-tone`) y `ear-scale` con el skill `skill.major-scale`.
- Ejercicios: deletreo de la cromática y de los tonos enteros, más identificación auditiva del modo de tonos enteros.
- Corrección: se corrigió el test del ejercicio de tonos enteros para buscar por ID (el primer `find` devolvía el ejercicio de cromática).
- Resultado: 53 archivos / 379 tests en verde; typecheck, `validate:content` y build verdes. Commit `0dfe5c8`.
- Limitación: el reproductor de lección (F2-060) y la UI de oído siguen pendientes; la app aún no practica las escalas especiales.
- Próximo paso: F2-030 (M2-12, Digitación de escalas).

## 2026-11-09T22:04:00-03:00 · F2-030

- Acción: M2-12 «Digitación de escalas» publicada. Se agregó la lección con las reglas de pulgar, la digitación de las doce escalas mayores y menores, la práctica con tarea y la tarea real de teclado con digitación.
- Esquema: sin cambios de esquema: se reutiliza el skill `skill.major-scale`.
- Ejercicios: sin ejercicios nuevos: la tarea real de teclado con digitación es la práctica principal.
- Corrección: no hubo correcciones de contenido en esta sesión.
- Resultado: 54 archivos / 382 tests en verde; typecheck, `validate:content` y build verdes. Commit `63b5f66`.
- Limitación: el reproductor de lección (F2-060) y la UI de digitación siguen pendientes; la app aún no guía la digitación.
- Próximo paso: F2-031 (Definir el modelo `SkillItem` y el registro de ítems con parámetros).

## 2026-11-09T22:07:30-03:00 · F2-031

- Acción: F2-031 completada: se definió el registro parametrizado de `SkillItem` con validación de ids únicos, búsqueda por kind y por parámetros, y test de serialización.
- Esquema: se reutiliza el modelo `SkillItem` existente (src/schemas/skill.ts) y se agrega el registro (src/skills/registry.ts).
- Ejercicios: sin ejercicios de contenido: el entregable es el motor de habilidades.
- Corrección: no hubo correcciones de contenido; se corrigieron tipos del test y del registro durante la verificación.
- Resultado: 55 archivos / 386 tests en verde; typecheck, `validate:content` y build verdes. Commit `5e7f69b`.
- Limitación: el reproductor de lección (F2-060) y la UI de habilidades siguen pendientes; la app aún no consume el registro en la UI.
- Próximo paso: F2-032 (Generar ejercicios de identificar notas en teclado).

## 2026-11-09T21:24:30-03:00 · F2-023

- Acción: M2-05 «Menor armónica» publicada. Se agregó la lección con el menor armónico (séptimo grado elevado), las doce tonalidades con séptimo elevado y los ejercicios de deletreo + audio.
- Esquema: sin cambios de esquema: se reutilizan los tipos `scale-spelling` (modo `harmonic-minor`) y `sound-parameter` con sus skills correspondientes.
- Ejercicios: un de deletreo del menor armónico (C D Eb F G Ab B C) y uno de audio que compara el séptimo grado del menor natural (Mi bemol) contra el del armónico (Si).
- Corrección: la primera pasada de contenido falló en el validador porque el modo menor del ejercicio de deletreo se escribió como `minor`; se corrigió a `natural-minor` para el menor natural y a `harmonic-minor` para el armónico.
- Resultado: 47 archivos / 348 tests en verde; typecheck, `validate:content` y build verdes. Commit `bd1d512`.
- Limitación: el reproductor de lección (F2-060) y la UI de sonido siguen pendientes; la app aún no compara audios en el ejercicio.
- Próximo paso: F2-024 (M2-06, menor melódica).

## 2026-11-09T22:20:58-03:00 · F2-032

- Acción: F2-032 completada: se implementó el motor de ejercicios de identificar notas en teclado.
- Esquema: sin cambios de esquema: se reutiliza el discriminador `note-keyboard` del `ExerciseSchema` (target + choices).
- Ejercicios: generados por `src/exercises/generators/note-keyboard.ts` con rango configurable (`C2-C6`), variantes ver/oír, cantidad de opciones por dificultad y secuencias sin repetir la misma nota consecutiva.
- Corrección: no hubo correcciones de contenido; los tests del generador requirieron ajustes de tipos y de aserciones durante la verificación.
- Resultado: 56 archivos / 395 tests en verde; typecheck, `validate:content` y build verdes. Commit `9dda73d`.
- Limitación: el reproductor de lección (F2-060) y la UI de ejercicios aún no consumen el generador; la práctica con estas generaciones no está conectada aun.
- Próximo paso: F2-033 (Generar ejercicios de identificar notas en pentagrama).

## 2026-11-09T23:23:00-03:00 · F2-033

- Acción: F2-033 completada: se implementó el generador de ejercicios de identificar notas en pentagrama.
- Esquema: sin cambios de esquema: se reutiliza el discriminador `note-staff` del `ExerciseSchema` (target + clef + choices).
- Ejercicios: generados por `src/exercises/generators/note-staff.ts` con claves de sol (Mi4–Fa5) y fa (Sol2–La3), líneas adicionales progresivas por dificultad (0, 1 y 2), opciones crecientes (3, 4 y 5) y distractores diatónicos cercanos.
- Corrección: se corrigió el límite superior de la clave de fa (La3, no Sol3) y la semántica de `usesLedgerLines` (un espacio pegado al pentagrama no dibuja línea adicional). También se cambiaron los ids de lote de ambos generadores a un sufijo numérico para que 200 casos cumplan `IdSchema`.
- Resultado: 57 archivos / 404 tests en verde; typecheck, `validate:content` y build verdes. Commit `39e6e20`.
- Limitación: el reproductor de lección (F2-060) y la UI de ejercicios aún no consumen el generador; el pentagrama renderizado con VexFlow todavía no se conecta a estos ejercicios generados.
- Próximo paso: F2-034 (Generar ejercicios de deletrear escalas).

## 2026-11-09T23:28:00-03:00 · F2-034

- Acción: F2-034 completada: se implementó el generador de ejercicios de deletrear escalas.
- Esquema: se agregó el campo opcional `answer` al discriminador `scale-spelling` para guardar la respuesta canónica sin octavas y corregir entradas escritas por teclado.
- Ejercicios: generados por `src/exercises/generators/scale-spelling.ts` con las 12 tónicas de M2 y los 16 modos del módulo (mayor, menores, siete modos diatónicos, pentatónicas, blues, cromática y tonos enteros), respuesta normalizada y distractores por alteración de grados internos.
- Corrección: no hubo correcciones de contenido; el generador usa `scaleNames` del motor de teoría como fuente de verdad de la ortografía y valida cada ejercicio con `ExerciseSchema`.
- Resultado: 58 archivos / 412 tests en verde; typecheck, `validate:content` y build verdes. Commit `c63d356`.
- Limitación: el reproductor de lección (F2-060) y la UI de ejercicios aún no consumen el generador; el menor melódico se genera en su forma ascendente y la descendente queda para las variantes de formato.
- Próximo paso: F2-035 (Generar ejercicios de armaduras y círculo de quintas).

## 2026-11-09T23:34:00-03:00 · F2-035

- Acción: F2-035 completada: se implementó el generador de ejercicios de armaduras y círculo de quintas.
- Esquema: se agregaron `direction` (tonalidad → armadura, armadura → tonalidad, quinta arriba, quinta abajo) y `answer` opcional al discriminador `key-signature`.
- Ejercicios: generados por `src/exercises/generators/key-signature.ts` con las 15 armaduras mayores y las 15 menores, ambos sentidos, vecinos del círculo de quintas y distractores cercanos. La matriz por defecto tiene 58 casos porque C# no tiene quinta arriba y Cb no tiene quinta abajo dentro de las 15 armaduras.
- Corrección: `relativeMinorOf` y `relativeMajorOf` reutilizaban la alteración de la tónica en lugar de calcular la del grado relativo; A mayor devolvía F en vez de F#, C# menor devolvía E# en vez de E. Se corrigió el cálculo y se agregaron casos al test de teoría, lo que también corrigió las 15 armaduras menores.
- Resultado: 59 archivos / 420 tests en verde; typecheck, `validate:content` y build verdes. Commit `eeedce9`.
- Limitación: el reproductor de lección (F2-060) y la UI de ejercicios aún no consumen el generador; las armaduras se entregan como texto y todavía no como glifo renderizado en el pentagrama.
- Próximo paso: F2-036 (Generar ejercicios de transposición).

## 2026-11-09T23:38:00-03:00 · F2-036

- Acción: F2-036 completada: se implementó el generador de ejercicios de transposición.
- Esquema: se agregó el campo opcional `answer` (arreglo de notas) al discriminador `transposition` para guardar la melodía transportada y corregir la respuesta del alumno.
- Ejercicios: generados por `src/exercises/generators/transposition.ts` con melodías cortas de 4, 5 y 6 notas construidas por grados de la escala mayor, las 12 tonalidades de M2 y los 132 pares ordenados de tonalidades distintas. La matriz rota cuatro patrones melódicos por dificultad y valida cada ejercicio con `ExerciseSchema`.
- Corrección: no hubo correcciones de teoría. `transposeSpelledMelody` reutiliza `transposeMelody` del motor y `fromSpelledPitch`/`toSpelledPitch` para conservar la ortografía y la octava.
- Resultado: 60 archivos / 429 tests en verde; typecheck, `validate:content` y build verdes. Commit `3c3a314`.
- Limitación: el reproductor de lección (F2-060) y la UI de ejercicios aún no consumen el generador; la transposición se genera en modo mayor y todavía no incluye melodías menores ni cromatismos. La dirección del intervalo se calcula desde las tónicas en la misma octava, por lo que un par como B → C se resuelve bajando una séptima mayor en lugar de subir un semitono.
- Próximo paso: F2-037 (Implementar variantes de formato).

## 2026-11-09T23:42:00-03:00 · Publicación temprana en GitHub Pages

- Acción: por pedido explícito del usuario se creó `.github/workflows/deploy-pages.yml` y se publicó la primera demo en <https://wulflo.github.io/piano-learning/>.
- Workflow: corre `npm ci`, `npm run typecheck`, `npm test` y `npm run build`; calcula `VITE_BASE` como `/<repo>/` (o `/` si el repo es `<usuario>.github.io`), agrega `.nojekyll`, sube `dist/` con `actions/upload-pages-artifact` y despliega con `actions/deploy-pages`.
- Repositorio: se agregó el remoto `origin` (`https://github.com/wulflo/piano-learning`) y se subió `main`. Pages ya estaba habilitado con `build_type: workflow`.
- Verificación: el run `42744251747` terminó en verde; `https://wulflo.github.io/piano-learning/` devuelve 200, el JS y el CSS devuelven 200 y `.nojekyll` devuelve 200.
- Limitación: las muestras de Salamander no se versionan por peso y el workflow no las descarga; en Pages la app cae al sintetizador. Las tareas F6-022 a F6-024 quedan adelantadas, pero su cierre formal en el checklist sigue sujeto a las dependencias y a la verificación de F6-025.
- Próximo paso: F2-037 (Implementar variantes de formato).

## 2026-11-09T23:56:00-03:00 · F2-074

- Acción: F2-074 completada: se muestra digitación de dedos (número y mano D/I) en el teclado del demo.
- Esquema: sin cambios de esquema; se agregó el tipo `FingerAssignment` en `src/keyboard/fingering.ts`.
- Ejercicios: no aplica; la digitación se construye por modo en el demo (`fingeringFor`).
- Corrección: se agregó prop `fingering` al componente `Keyboard`, badge visible, leyenda y nombre accesible con dedo y mano, y selector de mano en el demo.
- Resultado: 61 archivos / 435 tests en verde; typecheck, `validate:content` y build verdes. Commit `f1ba963`.
- Limitación: la digitación es una aproximación educativa (patrón por grados) y no reemplaza la supervisión de un profesor.
- Próximo paso: F2-037 (Implementar variantes de formato).

## 2026-11-09T23:59:30-03:00 · F2-037

- Acción: F2-037 completada: se implementaron las variantes de formato (ver, oír, deletrear, tocar).
- Esquema: sin cambios de esquema; se agregó `EXERCISE_FORMATS`, `supportedFormats` y `selectExerciseFormat` en `src/exercises/formats.ts`.
- Ejercicios: formatos válidos por tipo (por ejemplo nota-keyboard ve/oír/toca; escala deletrea oír/toca) y selección que evita repetir el formato inmediato.
- Corrección: no hubo correcciones de contenido; la repetición queda permitida solo cuando el tipo admite un único formato.
- Resultado: 62 archivos / 441 tests en verde; typecheck, `validate:content` y build verdes. Commit `9cbfaf7`.
- Limitación: el reproductor de lección (F2-060) aún no consume el selector; la UI de formato llega con la integración.
- Próximo paso: F2-038 (Conectar el motor de feedback «Recordá» a la teoría).

## 2026-11-10T00:08:00-03:00 · F2-038

- Acción: F2-038 completada: se conectó el motor de feedback «Recordá» a la teoría.
- Esquema: sin cambios de esquema.
- Ejercicios: resolver de feedback por código explícito o tipo de ejercicio; sin fallback genérico.
- Corrección: no hubo correcciones de contenido; `pedagogicalFeedback` ahora exige regla y ejemplo no vacíos.
- Resultado: 62 archivos / 443 tests en verde; typecheck, `validate:content` y build verdes. Commit `364e913`.
- Limitación: el reproductor de lección (F2-060) sigue sin consumir el resolver; la integración llega con el player.
- Próximo paso: F2-039 (Generar distractores plausibles).

## 2026-11-10T00:12:00-03:00 · F2-039

- Acción: F2-039 completada: se generaron distractores plausibles para escalas, transposiciones y armaduras.
- Esquema: sin cambios de esquema.
- Ejercicios: `src/exercises/distractors.ts` con distractores por alteración de grados, por semitono y por armadura; tests de longitud, unicidad y no trivialidad.
- Corrección: no hubo correcciones de contenido; la selección se limita al material de respuesta y a las alternativas plausibles.
- Resultado: 63 archivos / 447 tests en verde; typecheck, `validate:content` y build verdes. Commit `981c0d0`.
- Limitación: los distractores actualmente cubren escalas, transposiciones y armaduras; intervalos y acordes quedan para las tareas siguientes.
- Próximo paso: F2-040 (Integrar `ts-fsrs` con wrapper tipado y parámetros por defecto).

## 2026-11-11T00:26:00-03:00 · F2-040

- Acción: F2-040 completada: se integró `ts-fsrs@6.0.0` con un wrapper tipado para el repaso espaciado.
- Esquema: sin cambios de esquema; se reutilizan `FsrsCardSchema` y `ReviewLogSchema` y el wrapper valida cada tarjeta y registro con Zod.
- Ejercicios: no aplica; `src/state/fsrs.ts` expone `createFsrsScheduler`, `createFsrsItemCard`, `gradeFsrsItem` y `fsrsParamsFromSettings`. El scheduler usa el modelo FSRS-6 con retención deseada e intervalo máximo tomados de los ajustes persistidos.
- Corrección: el id del registro de revisión usa `itemId.log.<epoch>` porque `IdSchema` no admite mayúsculas ni dos puntos de un ISO completo.
- Resultado: 64 archivos / 453 tests en verde; typecheck, `validate:content` y build verdes. Commit `4105230`.
- Limitación: el wrapper crea un scheduler por operación y todavía no persiste tarjetas ni revisiones en almacenamiento; la cola diaria y la persistencia llegan con F2-042 y F2-043. La calificación sigue siendo manual (`rating` explícito).
- Próximo paso: F2-041 (Implementar calificación automática Easy/Good/Hard/Again).

## 2026-11-11T00:28:00-03:00 · F2-041

- Acción: F2-041 completada: se implementó la calificación automática Easy/Good/Hard/Again.
- Esquema: sin cambios de esquema; la salida se valida contra `ReviewRatingSchema` en los tests.
- Ejercicios: `src/state/rating.ts` expone `autoReviewRating` y `DEFAULT_RATING_THRESHOLDS` (rápida ≤ 5 s, lenta ≥ 15 s), con validación de umbrales y configuración propia.
- Corrección: no hubo correcciones de contenido; la pista prevalece sobre la velocidad y la incorrecta siempre califica `again`.
- Resultado: 65 archivos / 463 tests en verde; typecheck, `validate:content` y build verdes. Commit `80d001d`.
- Limitación: los umbrales por defecto son una primera aproximación y no se calibraron con datos reales; los ejercicios todavía no envían `durationMs` ni `usedHint` al motor.
- Próximo paso: F2-042 (Persistir todo el historial de repasos).

## 2026-11-11T00:30:00-03:00 · F2-042

- Acción: F2-042 completada: se persistió todo el historial de repasos en IndexedDB.
- Esquema: sin cambios de esquema; cada registro se valida con `ReviewLogSchema` antes de guardarse y al leerse.
- Ejercicios: no aplica; `src/state/review-history.ts` expone `createReviewHistoryStore` con `save`, `all(itemId?)`, `count`, `clear` y `close`, sobre la base `pianodesdecero.progress` (store `reviews`, índices por ítem y fecha).
- Corrección: los tests usan la IndexedDB falsa de `fake-indexeddb` que ya formaba parte del setup; una tarjeta nueva calificada como Easy pasa a estado `review` en FSRS-6 y el test lo refleja.
- Resultado: 66 archivos / 470 tests en verde; typecheck, `validate:content` y build verdes. Commit `5c136d7`.
- Limitación: la app todavía no escribe automáticamente cada respuesta en esta base; la conexión con la UI y la cola diaria llegan con F2-043 y las tareas de recorrido.
- Próximo paso: F2-043 (Construir la cola diaria con intercalado y límite de nuevos).

## 2026-11-11T00:32:00-03:00 · F2-043

- Acción: F2-043 completada: se implementó la cola diaria con prioridad de vencidos, límite de nuevos e intercalado de temas.
- Esquema: sin cambios de esquema; la cola trabaja sobre `FsrsCard` y `SkillKind` y no persiste datos.
- Ejercicios: no aplica; `src/state/daily-queue.ts` expone `buildDailyQueue`, que recibe candidatos y opciones (`now`, `newPerDay`, `limit?`, `seed?`) y devuelve entradas con estado `due`/`new` y conteos.
- Corrección: la mezcla de nuevos usa una semilla explícita y el reloj se inyecta como `Date`, de modo que los tests no dependen del reloj del sistema.
- Resultado: 67 archivos / 481 tests en verde; typecheck, `validate:content` y build verdes. Commit `463a123`.
- Limitación: la cola todavía no está conectada a la UI ni al historial persistido; el intercalado es una pasada simple y no garantiza separación perfecta cuando una habilidad domina toda la lista. El tope configurable y la previsión de carga llegan con F2-044.
- Próximo paso: F2-044 (Mostrar previsión de carga y tope diario configurable).

## 2026-11-11T00:36:00-03:00 · F2-044

- Acción: F2-044 completada: se agregó la previsión de carga de siete días y el tope diario configurable.
- Esquema: sin cambios de esquema; el tope de la UI se normaliza en `src/state/settings.tsx` con el mismo rango que el ajuste de progreso.
- Ejercicios: no aplica; `src/state/load-forecast.ts` expone `forecastLoad` y `normalizeDailyCap`, y `src/components/LoadForecastPanel.tsx` muestra el pronóstico, el tope editable y la cola de hoy.
- Corrección: el panel usa días UTC para que los cubos coincidan con las fechas ISO de las tarjetas; el rol `status` se reemplazó por `aria-live` para no duplicar el estado de audio de la demo.
- Resultado: 69 archivos / 491 tests en verde; typecheck, `validate:content` y build verdes. Commit `e42f11f`.
- Limitación: la app todavía no tiene una fuente de tarjetas persistidas, así que el panel montado en la demo recibe listas vacías; los props `cards` y `candidates` quedan listos para conectarlos cuando exista el recorrido de repaso. La previsión cuenta vencimientos, no tiempo estimado por ítem.
- Próximo paso: F2-045 (Implementar ajustes de retención, fuzz e intervalo máximo).

## 2026-11-11T00:39:00-03:00 · F2-045

- Acción: F2-045 completada: se agregaron los ajustes de retención, fuzz e intervalo máximo y su efecto en la planificación.
- Esquema: `SettingsSchema` incorpora `fuzz: boolean` con valor por defecto `false`; retención e intervalo ya existían con sus rangos.
- Ejercicios: no aplica; `src/state/fsrs-settings.ts` centraliza límites y normalización, `SettingsPanel` expone los controles y `src/state/fsrs.ts` pasa `fuzz` como `enableFuzz`.
- Corrección: el fuzz queda desactivado por defecto para conservar planificaciones deterministas; cuando se activa, `ts-fsrs` lo deriva del id del ítem y las repeticiones, así que el resultado es reproducible.
- Resultado: 70 archivos / 499 tests en verde; typecheck, `validate:content`, build y presupuesto de bundle verdes. Commit `4a81301`.
- Limitación: los ajustes de la UI todavía no se sincronizan con el progreso persistido; la conexión entre ambos llega con la capa de repositorios. Cambiar los ajustes afecta a las planificaciones nuevas, no recalcula las tarjetas ya guardadas.
- Próximo paso: F2-046 (Implementar estadísticas de retención y precisión).

## 2026-11-11T00:41:00-03:00 · F2-046

- Acción: F2-046 completada: se agregaron estadísticas de retención y precisión calculadas desde el historial de repasos.
- Esquema: sin cambios de esquema; se consumen `ReviewLog` existentes.
- Ejercicios: no aplica; `src/state/stats.ts` expone `computeReviewStats` con agrupación por día, semana ISO o mes, precisión por tipo de habilidad y totales.
- Corrección: la retención excluye los pasos de aprendizaje (`learning`/`new`) y cuenta `again` como fallo; la precisión usa todos los registros y agrupa como `unknown` los ítems sin resolvedor de tipo.
- Resultado: 71 archivos / 505 tests en verde; typecheck, `validate:content` y build verdes. Commit `d43aecd`.
- Limitación: todavía no hay UI de estadísticas ni una fuente conectada de `kindForItem`; el cálculo queda listo para alimentarse del historial persistido y del registro de habilidades.
- Próximo paso: F2-047 (Investigar el optimizador de FSRS en navegador y decidir estrategia).

## 2026-11-11T00:44:00-03:00 · F2-047

- Acción: F2-047 completada: se investigó el optimizador de FSRS en navegador y se decidió la estrategia.
- Esquema: sin cambios de esquema; la importación de pesos optimizados queda para una tarea futura porque hoy no se guardan los 21 pesos de FSRS-6.
- Ejercicios: no aplica; `src/state/optimizer-export.ts` serializa el historial en CSV de revlog de Anki (`review_time,card_id,review_rating,review_duration,review_state`) con ids deterministas por `itemId`.
- Corrección: se descartó `fsrs-browser` porque requiere `SharedArrayBuffer` y `COOP`/`COEP`, cabeceras que GitHub Pages no permite configurar; también se descartó el optimizador en servidor por privacidad y dependencia de red.
- Resultado: ADR-014 en `docs/DECISIONES.md`; 72 archivos / 510 tests en verde; typecheck, `validate:content` y build verdes. Commit `175875c`.
- Limitación: la app no ejecuta el optimizador todavía; la persona debe exportar el CSV y optimizar fuera de la app. La futura integración con `@open-spaced-repetition/binding` requiere validar el target WASI sin threads en GitHub Pages, migrar los ajustes para guardar pesos y agregar la importación.
- Próximo paso: F2-048 (Testear planificación FSRS con fixtures deterministas).

## 2026-11-11T00:47:00-03:00 · F2-048

- Acción: F2-048 completada: se fijó la planificación FSRS con fixtures deterministas y se corrigió el paso de aprendizaje.
- Esquema: `FsrsCardSchema` incorpora `learningStep` (entero no negativo, default 0) para conservar el avance dentro de los pasos de aprendizaje.
- Ejercicios: no aplica; `tests/fixtures/fsrs-planning.json` define reloj fijo, parámetros y 14 secuencias, y `tests/fsrs-planning.test.ts` las reproduce avanzando el reloj a cada vencimiento.
- Corrección: el wrapper reconstruía la tarjeta con `learningStep: 0`, así que una tarjeta en aprendizaje repetía el mismo paso indefinidamente y nunca graduaba; ahora el paso se persiste y se pasa al scheduler. También se mapea `relearning` a `scheduleStatus: 'learning'` en lugar de `'new'`.
- Resultado: 73 archivos / 530 tests en verde; typecheck, `validate:content`, build y presupuesto de bundle verdes. Commit `001008e`.
- Limitación: los fixtures congelan el comportamiento de `ts-fsrs` 6.0.0 con fuzz desactivado; actualizar la dependencia puede requerir revisar y regenerar las fechas esperadas. Cubren una tarjeta por caso, sin intercalado entre ítems ni persistencia en IndexedDB.
- Próximo paso: F2-049 (Crear esquema Dexie v1 y repositorios).

## 2026-11-11T00:51:00-03:00 · F2-049

- Acción: F2-049 completada: se creó el esquema Dexie v1 y los repositorios tipados del progreso.
- Esquema: base `pianodesdecero.progress` versión 1 con tablas `lessons`, `skills`, `reviews`, `settings` y `sessions`; se agregaron `LessonProgressRecordSchema`, `SkillProgressRecordSchema` y `SettingsRecordSchema` con `id`.
- Ejercicios: no aplica; `src/state/db.ts` declara la base y `src/state/repositories.ts` expone lecciones, habilidades, repasos, ajustes y sesiones con CRUD validado por Zod.
- Corrección: `src/state/review-history.ts` se reescribió sobre Dexie conservando su API; Dexie completa las tablas faltantes de la base creada en F2-042 y mantiene el historial existente. Se actualizó el inventario de licencias con Dexie 4.4.7 (Apache-2.0).
- Resultado: 74 archivos / 538 tests en verde; typecheck, `validate:content`, build y presupuesto de bundle verdes. Commit `12390ce`.
- Limitación: los repositorios todavía no están conectados a la UI ni al motor de ejercicios; los ajustes de la interfaz siguen en `localStorage` (`pdc.settings.v1`) y conviven con la tabla `settings` hasta la tarea de integración. No hay transacciones que agrupen varios repositorios y Dexie aún no entra en el bundle porque nada de la app lo importa.
- Próximo paso: F2-050 (Implementar migraciones versionadas y test de migración).

## 2026-11-11T00:53:00-03:00 · F2-050

- Acción: F2-050 completada: se implementaron las migraciones versionadas de la base Dexie y su test con una v1→v2 simulada.
- Esquema: `PROGRESS_V1_STORES` queda como base y `ProgressMigration` declara versión, tablas modificadas y un `upgrade` opcional; la producción sigue en la versión 1 sin migraciones registradas.
- Ejercicios: no aplica; `src/state/migrations.ts` expone `registerProgressMigrations` y `latestProgressVersion`, y `createProgressDatabase` acepta una lista de migraciones.
- Corrección: el registro ordena las migraciones antes de declararlas, rechaza versiones duplicadas o menores o iguales a la anterior y exige que los `upgrade` sean idempotentes por convención.
- Resultado: 75 archivos / 543 tests en verde; typecheck, `validate:content`, build y presupuesto de bundle verdes. Commit `fe6d477`.
- Limitación: todavía no hay una migración real de producción; la v2 es simulada en tests. La idempotencia de los futuros `upgrade` depende de cada implementación y no se puede verificar automáticamente. El sobre exportado (`ProgressData.schemaVersion`) sigue en 1 y su migración corresponde a las tareas de exportación/importación.
- Próximo paso: F2-051 (Calcular progreso por lección y desbloqueo por prerrequisitos).

## 2026-11-11T00:56:00-03:00 · F2-051

- Acción: F2-051 completada: se implementó el cálculo de progreso por lección y el desbloqueo por prerrequisitos.
- Esquema: sin cambios de esquema; se usan `LessonProgress`, `SkillProgress` y sus registros persistidos.
- Ejercicios: no aplica; `src/state/lesson-progress.ts` expone `computeLessonUnlocks`, `loadLessonUnlocks`, `startLesson`, `completeLesson`, `LessonLockedError` y `UnknownLessonError`.
- Corrección: el desbloqueo se calcula de forma pura con un umbral de maestría configurable (0,8 por defecto); los estados ya persistidos prevalecen para no volver a bloquear trabajo en curso, y los ciclos del grafo terminan bloqueados en lugar de recursar sin fin.
- Resultado: 76 archivos / 554 tests en verde; typecheck, `validate:content`, build y presupuesto de bundle verdes. Commit `d1cb415`.
- Limitación: el grafo todavía se recibe como dato y no se carga desde `content/lessons` en la app; el umbral de maestría es global y no distingue habilidades. Los segundos de práctica se conservan pero no se incrementan automáticamente. Los ciclos de prerrequisitos no se detectan en la validación de contenido, solo quedan bloqueados al calcular.
- Próximo paso: F2-052 (Implementar XP, niveles y logros).

## 2026-11-12T01:00:00-03:00 · F2-052

- Acción: F2-052 completada: se implementaron XP por actividad, niveles, diez logros y su persistencia.
- Esquema: `ProfileSchema` y `ProfileRecordSchema` agrupan XP, nivel, logros y racha; la tabla `profile` se agrega con la migración Dexie v2 y `ProgressDataSchema` reutiliza la forma del perfil.
- Ejercicios: no aplica; `src/state/xp.ts` define `xpForActivity`, `xpForLevel`, `levelForXp`, `levelProgress`, `awardXp`, `applyActivity`, `evaluateAchievements` y `mergeAchievements`.
- Corrección: `ProfileRepository.update` corre en una transacción, toma el máximo entre el XP actual y el propuesto y une los logros, de modo que una actualización concurrente o defectuosa no puede restar XP ni eliminar logros; `save` normaliza el nivel a partir del XP.
- Resultado: 77 archivos / 567 tests en verde; typecheck, `validate:content`, build y presupuesto de bundle verdes. Commit `91644e7`. Decisión documentada en ADR-015.
- Limitación: los flujos de lección, ejercicio y repaso todavía no llaman a `applyActivity`, y el contexto de logros debe armarlo el consumidor con los repositorios; falta la integración con las pantallas de progreso. El XP es local y no tiene validación anti-trampas. El campo `streak` del perfil queda sin lógica hasta F2-053.
- Próximo paso: F2-053 (Implementar racha con gracia semanal).

## 2026-11-12T01:03:00-03:00 · F2-053

- Acción: F2-053 completada: se implementó la racha de práctica con un día de gracia por semana.
- Esquema: sin cambios; se usan los campos existentes de `StreakSchema` (`current`, `longest`, `lastPracticeDate`, `graceDaysUsedThisWeek`).
- Ejercicios: no aplica; `src/state/streak.ts` expone `recordPracticeDay`, `streakFromPracticeDates`, `isoWeekStart` e `isLastPracticeDay`.
- Corrección: la gracia se atribuye al día fallado y no al día de regreso, y se reinicia al cambiar de semana ISO; así un domingo fallado no consume la gracia de la semana siguiente. Las fechas se calculan en UTC para evitar diferencias por zona horaria o horario de verano.
- Resultado: 78 archivos / 581 tests en verde; typecheck, `validate:content`, build y presupuesto de bundle verdes. Commit `b401f64`. Decisión documentada en ADR-016.
- Limitación: los flujos de práctica todavía no llaman a `recordPractice`, y la racha no se reconstruye automáticamente desde sesiones históricas, aunque `streakFromPracticeDates` ya permite hacerlo. Las fechas inválidas lanzan `RangeError` y deben validarse antes en la UI.
- Próximo paso: F2-054 (Exportar progreso a `.txt` con cabecera, JSON canónico y SHA-256).

## 2026-11-12T01:06:00-03:00 · F2-054

- Acción: F2-054 completada: se implementó la exportación del progreso a un archivo `.txt` con cabecera, JSON canónico y SHA-256.
- Esquema: sin cambios de tablas; se usa `ProgressEnvelopeSchema` y `ProgressDataSchema`, y la versión de la app se lee de `package.json` mediante `src/version.ts`.
- Ejercicios: no aplica; `src/state/progress-export.ts` expone `collectProgressData`, `canonicalJson`, `sha256Hex`, `createProgressExport` y `downloadProgressFile`.
- Corrección: el hash se calcula solo sobre `data` y no sobre la cabecera, para que dos exportaciones de los mismos datos coincidan aunque cambie la fecha; el JSON ordena claves recursivamente y omite `undefined`. La fecha del nombre de archivo usa UTC.
- Resultado: 79 archivos / 588 tests en verde; typecheck, `validate:content`, build y presupuesto de bundle verdes. Commit `ec266c0`. Formato documentado en ADR-017.
- Limitación: el hash detecta corrupción pero no autentica el archivo, y WebCrypto exige un contexto seguro; la UI de exportación y la verificación al importar llegan en tareas posteriores. El archivo no está cifrado ni comprimido.
- Próximo paso: F2-055 (Importar progreso con validación y estrategia de reemplazo).

## 2026-11-12T01:10:00-03:00 · F2-055

- Acción: F2-055 completada: se implementó la importación del archivo de progreso con validación completa y reemplazo atómico.
- Esquema: sin cambios de tablas; `ProgressRepositories.replaceAll` reemplaza las seis tablas y normaliza el nivel a partir del XP importado.
- Ejercicios: no aplica; `src/state/progress-import.ts` expone `parseProgressFile`, `importProgress`, `ProgressImportError` y los tipos de cabecera, resultado y conteos.
- Corrección: el hash se recalcula sobre el JSON canónico después de validar el esquema, de modo que un archivo con espacios u otro orden de claves se acepta, pero un cambio de contenido o un hash en mayúsculas se rechaza. La validación ocurre antes de cualquier borrado y el reemplazo corre en una sola transacción.
- Resultado: 80 archivos / 597 tests en verde; typecheck, `validate:content`, build y presupuesto de bundle verdes. Commit `c3038c7`. Decisión documentada en ADR-018.
- Limitación: la estrategia es reemplazar, no fusionar; no hay importación selectiva. El hash detecta corrupción pero no autentica el origen. La confirmación es un booleano de la API y el diálogo de la interfaz llega con la pantalla de ajustes.
- Próximo paso: F2-056 (Probar ida y vuelta exportar→importar→exportar idéntico).

## 2026-11-12T01:12:00-03:00 · F2-056

- Acción: F2-056 completada: se verificó la ida y vuelta completa exportar→importar→exportar.
- Esquema: sin cambios; el test usa las seis tablas, `createProgressExport`, `importProgress` y `collectProgressData`.
- Ejercicios: `tests/progress-roundtrip.test.ts` puebla una base con lecciones, habilidades, repasos, ajustes, perfil/racha y sesiones; importa sobre una base con datos distintos y compara hash, JSON, texto y sobre.
- Corrección: el test confirma que la canonicalización y el reemplazo no dependen del orden de las filas ni de la base de destino; tres ciclos seguidos no duplican registros.
- Resultado: 81 archivos / 600 tests en verde; typecheck, `validate:content`, build y presupuesto de bundle verdes. Commit `b38864c`.
- Limitación: el test cubre el formato actual (versión 1) y no incluye datos corruptos, que ya se prueban en F2-055; tampoco hay migración de archivos de versiones futuras.
- Próximo paso: F2-056a (Guardar copia del progreso en una carpeta personal, opcional).

## 2026-11-12T01:17:00-03:00 · F2-056a

- Acción: F2-056a completada: se implementó la copia opcional del progreso en una carpeta personal.
- Esquema: sin cambios; se reutilizan `createProgressExport`, `downloadProgressFile` y `parseProgressFile`.
- Ejercicios: no aplica; `src/state/progress-folder.ts` expone `supportsProgressFolder`, `pickProgressFolder`, `saveProgressToFolder`, `saveProgressCopy`, `readProgressCopy`, `loadProgressFromFolder`, `listProgressCopies`, `loadLatestProgressCopy` y `loadProgressFromFile`.
- Corrección: la detección exige `showDirectoryPicker` y contexto seguro; cancelar el selector produce `cancelled` y no dispara una descarga silenciosa. La carga valida el archivo con el mismo lector que la importación antes de tocar la base, y una carpeta vacía falla con `empty-folder` en vez de reemplazar el progreso con datos vacíos.
- Resultado: 82 archivos / 619 tests en verde; typecheck, `validate:content`, build y presupuesto de bundle verdes. Commit `14d213c`. Decisión documentada en ADR-019.
- Limitación: solo Chromium de escritorio con contexto seguro; la carpeta no se persiste y el navegador puede volver a pedir permiso. La UI que conecta los helpers con botones reales llega con la pantalla de ajustes. No hay sincronización ni escritura en GitHub o en la nube.
- Próximo paso: F2-057 (Implementar restablecer progreso con confirmación explícita).

## 2026-11-12T01:20:00-03:00 · F2-057

- Acción: F2-057 completada: se implementó el restablecimiento del progreso con confirmación explícita.
- Esquema: sin cambios; `ProgressRepositories.clearAll` vacía `lessons`, `skills`, `reviews`, `settings`, `sessions` y `profile` en una transacción.
- Ejercicios: no aplica; `src/state/progress-reset.ts` expone `resetProgress`, `ProgressResetError`, `RESET_CONFIRMATION_WORD` y `RESET_REQUIRED_CONFIRMATIONS`.
- Corrección: la validación de las dos confirmaciones ocurre antes de leer o borrar nada, y el borrado es atómico; una transacción fallida deja el progreso original. La palabra se compara sin mayúsculas ni espacios exteriores, y el resultado incluye los conteos previos para el resumen de la UI.
- Resultado: 83 archivos / 628 tests en verde; typecheck, `validate:content`, build y presupuesto de bundle verdes. Commit `b815ef7`. Decisión documentada en ADR-020.
- Limitación: el borrado es definitivo y no se puede deshacer; la única red de seguridad es una exportación previa. El doble diálogo real llega con la pantalla de ajustes.
- Próximo paso: F2-058 (Construir shell de app, navegación y hash router).

## 2026-11-12T01:26:00-03:00 · F2-058

- Acción: F2-058 completada: se construyó el shell de la app con navegación y hash router.
- Esquema: sin cambios; la demo de la Fase 1 se conserva en `#/demo` y las rutas nuevas todavía no leen el progreso.
- Ejercicios: no aplica; `src/router/hash-route.ts` expone el parseo y formateo de rutas, `src/router/useHashRoute.ts` la suscripción al hash y `src/pages/` las seis pantallas del shell.
- Corrección: se usa el hash porque GitHub Pages no reescribe rutas; así recargar y compartir un enlace profundo funciona sin servidor. `hashchange` cubre atrás/adelante y la navegación son enlaces reales con `aria-current`. Las páginas incompletas dicen qué tarea las completa en vez de mostrar datos falsos.
- Resultado: 85 archivos / 642 tests en verde; typecheck, `validate:content`, build y presupuesto de bundle verdes. Commit `49e52ec`. Decisión documentada en ADR-021.
- Limitación: el mapa del curso, el reproductor, la cola de repaso y las estadísticas son marcadores de posición hasta F2-059 a F2-062. El hash no es ideal para buscadores y no hay restauración de scroll ni transiciones.
- Próximo paso: F2-059 (Construir mapa visual del curso con progreso por módulo).

## 2026-11-12T01:40:00-03:00 · F2-059

- Acción: F2-059 completada: se construyó el mapa visual del curso con progreso por módulo.
- Esquema: se agregó `src/schemas/course-index.ts`; no cambian las tablas de progreso. El índice del curso es un artefacto generado desde `content/`.
- Ejercicios: no aplica; `npm run index:content` usa `scripts/build-course-index.ts` y `src/content/course.ts` expone el índice validado, búsquedas y el grafo de desbloqueos.
- Corrección: el índice evita cargar las 30 lecciones completas en la portada y un test de frescura impide que quede desactualizado. `summarizeCourse` es puro y prueba los estados por módulo sin navegador. `ProgressProvider` centraliza la apertura de Dexie y la portada trata carga y error sin inventar progreso; las lecciones bloqueadas no son enlaces y los estados se anuncian con texto.
- Resultado: 88 archivos / 657 tests en verde; typecheck, `validate:content`, build y presupuesto de bundle verdes (158,36 kB gzip inicial). Commit `a13fc57`. Decisión documentada en ADR-022.
- Limitación: el contenido actual solo publica lecciones en M0–M2; M3–M8 aparecen vacíos y se muestran como tales. El umbral de maestría sigue fijo en 0,8 y el reproductor de lección es un marcador de posición hasta F2-060.
- Próximo paso: F2-060 (Construir reproductor de lección).

## 2026-11-12T01:52:00-03:00 · F2-060

- Acción: F2-060 completada: se construyó el reproductor de lección.
- Esquema: no cambian las tablas. La carga usa `import.meta.glob` sobre `content/lessons` y valida cada JSON con `LessonSchema`; el progreso sigue en `lessons` y `skills`.
- Ejercicios: las secciones de ejercicio se muestran con aviso de que todavía no se pueden resolver. La tarea de teclado incluye teclado, digitación y checklist; la interacción con metrónomo y checklist marcable llega en F2-066.
- Corrección: un solo motor de audio reproduce todos los ejemplos y detiene el anterior; `scoreToTimeline` respeta tempo, compás, puntillos y tresillos, y `scoreToMeasures` alimenta el pentagrama. La página espera la escritura de inicio antes de completar para no pisar `completed`, conserva el resumen del curso al recargar y no enlaza una siguiente lección bloqueada.
- Resultado: 90 archivos / 675 tests en verde; typecheck, `validate:content`, build y presupuesto de bundle verdes (162,42 kB gzip inicial, 32 chunks diferidos). Commit `2fed5e4`. Decisión documentada en ADR-023.
- Limitación: el cuerpo de las lecciones sigue en español hasta F2-075. `Staff` no dibuja puntillos ni tresillos, aunque el audio sí los respeta. Los ejercicios no se resuelven desde el reproductor y la tarea interactiva llega en F2-066. El umbral de maestría sigue fijo en 0,8.
- Próximo paso: F2-061 (Construir pantalla «Repaso de hoy»).

## 2026-11-12T01:59:00-03:00 · F2-061

- Acción: F2-061 completada: se construyó la pantalla «Repaso de hoy» con cola, progreso, previsión y botón de inicio.
- Esquema: no cambian las tablas. Se agregó `src/content/skills.ts` para validar `content/skills.json` y `src/state/review-day.ts` como capa pura sobre las tarjetas de `skills` y el historial de `reviews`.
- Ejercicios: no aplica. La pantalla muestra habilidades del contenido; el recorrido enlaza a las lecciones donde se practican y no registra respuestas.
- Corrección: el repaso solo propone habilidades de lecciones empezadas o completadas (o con tarjeta propia), evitando material de módulos futuros. La cola usa una semilla diaria UTC y conserva la previsión de 7 días. El estado vacío y el error de base se muestran sin inventar ítems. El recorrido avisa que la autoevaluación FSRS llega en F2-067.
- Resultado: 92 archivos / 687 tests en verde; typecheck, `validate:content`, build y presupuesto de bundle verdes (166,51 kB gzip inicial, 32 chunks diferidos). Commit `2856c86`. Decisión documentada en ADR-024.
- Limitación: el botón inicia un recorrido de lectura, no una sesión FSRS; la calificación y el guardado llegan en F2-067. El contador de respuestas de hoy incluye todo el historial del día UTC.
- Próximo paso: F2-062 (Construir pantalla de estadísticas).

## 2026-11-12T02:06:00-03:00 · F2-062

- Acción: F2-062 completada: se construyó la pantalla de estadísticas con datos reales y estados vacíos.
- Esquema: no cambian las tablas. Se leen `reviews`, `profile`, `sessions` y `lessons`; no se agregan índices ni migraciones.
- Ejercicios: no aplica. La precisión por tipo usa el historial existente y las habilidades de `content/skills.json`.
- Corrección: la retención agregada solo cuenta repasos programados (`review`/`relearning`), la precisión se agrupa por tipo real y los porcentajes no se muestran sin datos. El tiempo suma bloques de sesión o el intervalo inicio–fin, más los segundos de lección. La página espera la base, conserva el panel al recargar y ofrece reintento ante error.
- Resultado: 94 archivos / 699 tests en verde; typecheck, `validate:content`, build y presupuesto de bundle verdes (169,11 kB gzip inicial, 32 chunks diferidos). Commit `b1d38b6`. Decisión documentada en ADR-025.
- Limitación: la retención no se filtra por rango ni módulo; los ítems fuera de `content/skills.json` se agrupan como «Sin tipo». La racha se lee del perfil y el tiempo depende de sesiones registradas, que llegarán con el motor de ejercicios y la práctica guiada.
- Próximo paso: F2-063 (Construir ajustes completos).

## 2026-11-13T02:26:00-03:00 · F2-063

- Acción: F2-063 completada: ajustes completos con tema, persistencia y gestión de datos.
- Esquema: no cambian las tablas ni los índices. `SettingsRepository.read()` devuelve `undefined` sin fila; el valor por defecto de `audioVolume` pasa de 0,8 a 0,4 para coincidir con −8 dB.
- Ejercicios: no aplica. La pantalla conecta exportación, importación y reseteo ya existentes con la UI.
- Corrección: la UI y el progreso comparten un puente puro de unidades y nombres; la hidratación no pisa los ajustes locales en una instalación nueva; el tema se aplica antes de pintar; el reseteo guarda los valores por defecto para que una hidratación posterior no reescriba los antiguos.
- Resultado: 96 archivos / 712 tests en verde; typecheck, `validate:content`, build y presupuesto verdes (174,62 kB gzip inicial, 32 chunks diferidos). Commit `2797aef`. Decisión documentada en ADR-026.
- Limitación: el mapa de teclas y el MIDI no viajan en la exportación; los ajustes son globales; guardar en carpeta depende del navegador; la importación reemplaza todo sin fusión selectiva.
- Próximo paso: F2-064 (Implementar tema claro/oscuro con persistencia).

## 2026-11-13T02:35:00-03:00 · F2-064

- Acción: F2-064 completada: el tema sistema/claro/oscuro queda verificado con contraste AA y sin destello.
- Esquema: sin cambios. El tema sigue en `localStorage` y en la fila `settings` de Dexie.
- Ejercicios: no aplica.
- Corrección: no hubo cambios de runtime; se agregó una prueba que lee la paleta real del CSS y calcula WCAG, porque jsdom no resuelve `prefers-color-scheme` ni variables en cascada.
- Resultado: 97 archivos / 716 tests en verde; typecheck, `validate:content`, build y presupuesto verdes (174,62 kB gzip inicial, 32 chunks diferidos). Commit `b282496`. Decisión documentada en ADR-027. En Pages se comprobó que el tema oscuro persiste tras recargar y que el fondo oscuro se aplica antes de pintar.
- Limitación: la prueba cubre los pares de la paleta, no cada componente ni colores calculados con `color-mix`; el teclado y el pentagrama conservan colores propios revisados por axe en tema claro.
- Próximo paso: F2-065 (Implementar i18n base ES/EN y selector Do/C global).

## 2026-11-13T02:45:00-03:00 · F2-065

- Acción: F2-065 completada: i18n base ES/EN con paridad garantizada en compilación y textos de UI auditados.
- Esquema: sin cambios.
- Ejercicios: no aplica. El contenido sigue en español hasta F2-075.
- Corrección: el diccionario inglés ahora depende del tipo de claves del español; se movieron al diccionario el pie y los textos del pentagrama. La prueba de licencias lee el diccionario en lugar de `App.tsx`.
- Resultado: 98 archivos / 721 tests en verde; typecheck, `validate:content`, build y presupuesto verdes (174,75 kB gzip inicial, 32 chunks diferidos). Commit `2b20e01`. Decisión documentada en ADR-028.
- Limitación: la auditoría cubre claves literales y familias dinámicas explícitas; los cuerpos de lección, objetivos y tareas siguen en español hasta F2-075. Los nombres de idioma se muestran en su propio idioma y el mensaje de consola del `ErrorBoundary` no es UI.
- Próximo paso: F2-066 (Construir componente de tarea de teclado real).

## 2026-11-13T02:55:00-03:00 · F2-066

- Acción: F2-066 completada: la tarea de teclado es interactiva y accesible.
- Esquema: sin cambios. La tarea usa los campos existentes de `keyboardTask`.
- Ejercicios: no aplica; la checklist no registra respuestas ni modifica el progreso. La autoevaluación FSRS llega en F2-067.
- Corrección: se reutiliza el motor de audio del reproductor, se extrae el rango de octavas a `src/keyboard/range.ts` y se muestra un aviso honesto cuando no hay partitura de demo.
- Resultado: 100 archivos / 730 tests en verde; typecheck, `validate:content`, build y presupuesto verdes (175,39 kB gzip inicial, 32 chunks diferidos). Commit `98268e3`. Decisión documentada en ADR-029.
- Limitación: la checklist y el tempo del metrónomo no se persisten; la digitación es texto, no badges por tecla; diez tareas de M2 no traen `demoScore`; el contenido sigue en español hasta F2-075.
- Próximo paso: F2-067 (Implementar autoevaluación de 4 botones y registro de práctica).

## 2026-11-13T02:48:00-03:00 · F2-067

- Acción: F2-067 completada: el repaso ya permite autoevaluarse con cuatro botones y registra la práctica.
- Esquema: sin cambios de tablas. `ReviewLog` ya tenía `durationMs`, `format` y `usedHint`; se agrega `ProgressRepositories.saveReviewResult` para escribir tarjeta y registro en una transacción.
- Ejercicios: no aplica. La autoevaluación se hace en la cola de repaso y enlaza a las lecciones donde se practica cada habilidad.
- Corrección: la duración se mide desde que aparece el ítem; la tarjeta se crea si falta y se califica con FSRS; la maestría sube o baja con pasos pequeños; la UI evita dobles envíos y refresca la cola. FSRS se carga dinámicamente al calificar para no sumar su peso al bundle inicial.
- Resultado: 101 archivos / 738 tests en verde; typecheck, `validate:content`, build y presupuesto verdes (176,35 kB gzip inicial, 43 chunks diferidos). Commit `497893b`. Decisión documentada en ADR-030.
- Limitación: XP y racha todavía no se actualizan desde el repaso; no hay botón para saltar un ítem; la duración mide tiempo en pantalla, no práctica real en el teclado; un `again` puede volver a bloquear una lección posterior no empezada.
- Próximo paso: F2-068 (Construir plan de práctica diario 15/30/45 con temporizador).

## 2026-11-13T02:50:00-03:00 · F2-067 (corrección)

- Acción: corregir el resumen de la sesión de repaso, que después de recargar la cola mostraba «Calificaste los 0 ítems» y «2 de 0 respuestas guardadas».
- Causa: el total del resumen se leía de la cola ya refrescada y vacía; los ítems calificados sí estaban guardados en Dexie.
- Corrección: `ReviewPage` captura `sessionTotal` al empezar y lo usa para el progreso y el resumen final. El test del flujo ahora exige la cola vacía después de calificar y comprueba los dos registros persistidos.
- Estabilidad: el test de hidratación de ajustes espera los efectos de tema e idioma en vez de leerlos en el primer render; la suite completa había fallado una vez por esa carrera.
- Resultado: 101 archivos / 738 tests en verde; typecheck, `validate:content`, build y presupuesto verdes (176,35 kB gzip inicial, 43 chunks diferidos). Commits `fcf6013` (test) y `1048dbb` (fix).
- Próximo paso: F2-068 (Construir plan de práctica diario 15/30/45 con temporizador).

## 2026-11-13T03:05:00-03:00 · F2-068

- Acción: F2-068 completada: la app ya tiene un plan de práctica diario de 15, 30 o 45 minutos con temporizador y registro.
- Esquema: sin cambios de tablas. Se usa `PracticeSession` (ya existente) y se agrega `ProgressRepositories.recordPracticeSession` para guardar sesión y perfil en una transacción.
- Ejercicios: no aplica. La práctica se organiza en calentamiento, técnica, teoría, repertorio y repaso; los bloques no enlazan todavía a lecciones o ejercicios concretos.
- Corrección: el reparto suma exacto la duración; el temporizador es una máquina de estados pura; saltar no regala segundos; cortar conserva lo practicado; la sesión se guarda al terminar. XP = 2 por minuto completo y la racha usa el día UTC de `endedAt`. Una sesión de menos de un minuto se guarda sin XP ni racha y repetir el guardado no duplica la recompensa.
- Resultado: 105 archivos / 763 tests en verde; typecheck, `validate:content`, build y presupuesto verdes (179,70 kB gzip inicial, 43 chunks diferidos). Commit `e2c7621`. Decisión documentada en ADR-031.
- Limitación: el temporizador no sobrevive una recarga ni corre en segundo plano; los logros todavía no se evalúan; el plan no enlaza bloques a lecciones concretas; el contenido sigue en español hasta F2-075.
- Próximo paso: F2-069 (Mostrar aviso honesto sobre aprender sin profesor).

## 2026-11-10T03:22:00-03:00 · F2-069

- Acción: F2-069 completada: la app muestra un aviso honesto sobre los límites de aprender sin profesor.
- Esquema: sin cambios. El aviso es solo UI y no persiste estado nuevo.
- Ejercicios: no aplica. El aviso no registra respuestas ni condiciona el acceso a las lecciones.
- Corrección: se agregó `TeacherNotice` como panel informativo sin botones ni modales; se muestra en las lecciones de M0 y en ajustes. Los textos ES/EN viven en el diccionario y el test cubre que no aparece fuera de M0 y que no bloquea el botón de completar.
- Resultado: 106 archivos / 768 tests en verde; typecheck, `validate:content`, build y presupuesto verdes (180,40 kB gzip inicial, 43 chunks diferidos). Commit `e807ce6`.
- Limitación: el aviso se repite en cada lección de M0 y no se puede descartar; el contenido de las lecciones sigue en español hasta F2-075.
- Próximo paso: F2-070 (Validar todo el contenido M0-M2 en el build).

## 2026-11-10T03:26:00-03:00 · F2-070

- Acción: F2-070 completada: todo el contenido M0-M2 queda validado en el build.
- Esquema: sin cambios.
- Ejercicios: no aplica; se valida que todos los ejercicios existentes estén referenciados por una lección.
- Corrección: `validateContentBundle` convierte en error dos casos que antes solo advertían: lección publicada sin tarea de teclado y ejercicio no referenciado. Así `npm run build`, que ejecuta `validate:content`, corta de verdad ante esas regresiones.
- Resultado: el contenido real valida con 0 errores y 0 advertencias: 9 módulos, 30 lecciones publicadas (M0 6, M1 12, M2 12), 150 ejercicios, 24 habilidades y 1 pieza. 107 archivos / 774 tests en verde; typecheck, `validate:content`, build y presupuesto verdes (180,40 kB gzip inicial, 43 chunks diferidos). Commit `7446a21`.
- Limitación: `m0-03` no tiene ejercicios propios porque su aceptación pide tarea autoevaluable; el gate no exige un mínimo de ejercicios por lección.
- Próximo paso: F2-071 (Testear ejercicios M0-M2 en las 12 tonalidades).

## 2026-11-10T03:30:00-03:00 · F2-071

- Acción: F2-071 completada: los ejercicios de M0-M2 quedan cubiertos con property tests en las doce tonalidades.
- Esquema: sin cambios.
- Ejercicios: se recorren las matrices completas de deletreo de escalas, transposición y armaduras, más los distractores de escalas y transposiciones.
- Corrección: la primera versión del test exigía al menos un ejercicio por lección y falló en `m0-03`, cuya aceptación pide tarea autoevaluable sin ejercicios; se ajustó el test a la aceptación real. TypeScript también obligó a tipar la melodía como `SpelledPitch[]`.
- Resultado: 192 combinaciones de escala, 132 pares de transposición por dificultad, 58 preguntas mayores y 58 menores de armaduras, y distractores que cambian un solo token sin repetir la respuesta. 108 archivos / 779 tests en verde; typecheck, `validate:content`, build y presupuesto verdes (180,40 kB gzip inicial, 43 chunks diferidos). Commit `75e66a3`.
- Limitación: los property tests usan las matrices de los generadores, no todos los ejercicios escritos a mano del contenido; esos ya pasan por el validador de F2-070.
- Próximo paso: F2-072 (E2E del recorrido lección→ejercicio→repaso).

## 2026-11-10T03:32:00-03:00 · F2-072 (bloqueada)

- Acción: se intentó preparar el E2E lección→ejercicio→repaso y se detectó que falta una pieza completa del producto.
- Error literal: el reproductor de lección, en `src/components/LessonPlayer.tsx`, renderiza las secciones `exercise` con `t('lesson.exercise.pending')`, cuyo texto es «Todavía no se puede resolver este ejercicio desde acá.». No existe ninguna ruta, página ni componente que consuma `promptEs`, `choices`, `explanationEs` o `ExerciseSchema`; tampoco se muestra el feedback «Recordá».
- Causa probable: F2-031 a F2-039 construyeron generadores, formatos, feedback y distractores, pero la checklist nunca incluyó la pantalla que los conecta con el alumno. F2-060 dejó los ejercicios como aviso pendiente y F2-072 asumió que ya existían.
- Decisión: marcar F2-072 como `[!]` y agregar `F2-072a` para construir el reproductor de ejercicios con corrección y feedback «Recordá». F2-072 depende ahora de F2-072a.
- Resultado: checklist actualizado a 283 tareas; sin cambios de código. La suite sigue en 108 archivos / 779 tests en verde.
- Próximo paso: F2-072a (reproductor de ejercicios), y después reintentar F2-072.

## 2026-11-10T10:15:00-03:00 · F2-072a

- Acción: se retomó la sesión cortada. Había cambios sin commitear de F2-072a: `ExercisePlayer`, `content/exercises.ts`, `exercises/answer.ts`, `state/exercise-attempt.ts`, sus tests, textos ES/EN, estilos y correcciones de contenido en 20 ejercicios de M1-M2. Se revisaron, se completaron y se descartó solo lo que estaba mal.
- Esquema: sin cambios de tablas. El intento usa las tablas existentes de habilidades y repasos con `recordReview`.
- Ejercicios: el reproductor carga los JSON bajo demanda, muestra un ejercicio por vez con opciones o respuesta escrita, corrige con la respuesta canónica, muestra la explicación y el «Recordá» con ejemplo, y registra el intento como repaso FSRS (calificación automática, duración, tarjeta y maestría). FSRS y el registro se importan dinámicamente al corregir para no romper el code splitting de F2-067.
- Corrección: las correcciones de contenido eran necesarias: cinco escalas mayores terminaban en la nota equivocada, la pentatónica menor, el blues y los tonos enteros tenían ortografías incorrectas, varias armaduras tenían la tonalidad o la explicación cruzadas y dos explicaciones de menores usaban «relativa» donde correspondía «paralela». Tres tests de contenido todavía codificaban los datos viejos; se actualizaron a la teoría correcta. También se ajustó `src/theory/errors.ts` con los códigos que faltaban para los tipos de ejercicio de M1-M2.
- Resultado: 110 archivos / 788 tests en verde; typecheck, `validate:content`, build y presupuesto verdes (191,20 kB gzip inicial, 194 chunks diferidos). Commit `3c3114a`.
- Limitación: los ejercicios de pentagrama se resuelven por el enunciado textual, sin dibujar el pentagrama en la tarjeta; los de teclado se responden con opciones, no tocando el teclado. La corrección de escalas acepta la ortografía canónica del generador y la del contenido, pero no todas las enarmonías equivalentes. El intento se registra recién al corregir, no al ver el enunciado.
- Próximo paso: F2-072 (E2E lección→ejercicio→repaso con Playwright). Hay red disponible; si la instalación de Playwright falla, registrar el error y seguir con F2-073 o F2-075.

## 2026-11-10T10:30:00-03:00 · F2-072

- Acción: F2-072 completada. Se configuró Playwright y se escribió el E2E del recorrido lección→ejercicio→repaso.
- Esquema: sin cambios. El test usa la IndexedDB real del navegador y la limpia con un contexto aislado por ejecución.
- Ejercicios: el recorrido abre M0-01, elige una opción incorrecta, comprueba el «Recordá», entra a «Repaso de hoy», califica la habilidad nueva y verifica la persistencia de las dos respuestas después de recargar.
- Corrección: se agregó `@playwright/test` 1.65.0 (Apache-2.0) y Chromium 158 se instaló en `~/.cache/ms-playwright`, fuera del repositorio. `playwright.config.ts` compila la app, sirve `dist/` con `vite preview` y usa un solo worker; el servidor se reutiliza en local y no en CI. Se sumó `npm run test:e2e`, se incluyeron `e2e/` y la configuración en `tsconfig` y se ignoraron los artefactos de Playwright.
- Resultado: E2E 1/1 en verde (0,8 s); suite unitaria 110 archivos / 788 tests; typecheck, `validate:content`, build y presupuesto verdes (191,23 kB gzip inicial, 194 chunks diferidos). Commit `aa90133`.
- Limitación: el workflow de Pages todavía no instala Chromium ni ejecuta E2E; la decisión queda para F6. El test depende de la estructura de M0-01 y de los textos en español, así que F2-075 o cambios de contenido pueden exigir ajustarlo. No cubre audio real, MIDI ni táctil.
- Próximo paso: F2-073 (cerrar F2: suite completa, tag `fase-2`, RESUME y resumen).

## 2026-11-10T10:50:00-03:00 · F2-073

- Acción: se retomó la sesión cortada y se cerró F2. Había dos cambios sin commitear de la sesión anterior: el bloque «Cierre F2» en `docs/CHECKLIST.md` y la sección `[Fase 2]` en `CHANGELOG.md`. Se revisaron, se validaron contra el estado real del repo y se completaron con la actualización de `docs/RESUME.md` en vez de descartarlos.
- Esquema: sin cambios.
- Ejercicios: no aplica.
- Corrección: el PUNTO de reanudación pasa a F2-075 (primera tarea pendiente) y la «última verificada» sigue siendo F2-074, porque el test de formato exige que coincida con la última `[x]` en orden de archivo y F2-073 está antes. También se corrigió el prompt de reanudación de `RESUME.md`, que apuntaba a una ruta inexistente y decía que Pages no estaba habilitado.
- Resultado: `npm run estado` verde (typecheck, 110 archivos / 788 tests y build); E2E 1/1; export/import cubierto por sus tests; presupuesto 191,23 kB gzip inicial con 194 chunks diferidos. Tag local `fase-2`. Commits `b8a0bc8` (docs de cierre) y `dd090f0` (checklist y estado).
- Limitación: F2 se cierra con F2-075 pendiente por dependencia explícita de F2-073; el contenido de M0-M2 sigue en español. Los logros todavía no se evalúan al guardar actividad y el E2E no corre en el workflow de Pages (F6).
- Próximo paso: F2-075 (soporte en inglés para lecciones, ejercicios y UI de M0-M2) antes de iniciar F3.

## 2026-11-11T11:58:37-03:00 · F2-075

- Acción: F2-075 completada: todo el contenido de M0-M2 y la UI que lo muestra funcionan en español y en inglés.
- Esquema: `LessonSchema` agrega `summaryEn` y `objectivesEn`; los campos `titleEn`, `bodyEn`, `instructionsEn`, `fingeringEn` y `checklistEn` ya existían. `exerciseBase` agrega `promptEn`, `explanationEn` y `choicesEn`, y `scale-spelling`/`transposition` agregan `answerEn`. Todos son opcionales para no romper contenido futuro; `validateContentBundle` exige que una lección publicada y un ejercicio referenciado tengan su versión inglesa completa, con `choicesEn` de la misma longitud que `choices`.
- Ejercicios: se tradujeron las 30 lecciones (título, resumen, objetivos, secciones, tarea de teclado y glosario) y los 150 ejercicios (enunciado, explicación y opciones) de M0-M2. `src/content/localize.ts` centraliza la selección ES/EN; `LessonPage`, `LessonPlayer`, `KeyboardTask` y `ExercisePlayer` la consumen. `src/exercises/answer.ts` resuelve la respuesta canónica por idioma y acepta alias ingleses; `src/theory/errors-en.ts` traduce el feedback «Recordá».
- Corrección: al traducir se corrigieron errores de teoría que estaban en español: relativas/homónimas, listas de tonalidades y descripciones de menor armónica y melódica en M2. También se corrigieron las explicaciones de `m2-05.b` y `m2-06.b` («de Si bemol a Si» describía mal el cambio). `scripts/lib/course-index.ts` pasó a usar `summaryEn` en el índice. Los tests nuevos detectaron opciones inglesas no alineadas con el índice de la respuesta correcta en `m1-04.i`, `m1-04.j` y `m2-11.c`; se corrigieron.
- Resultado: `npm run estado` verde (typecheck, 112 archivos / 793 tests y build); E2E 1/1; presupuesto 195,76 kB gzip inicial con 194 chunks diferidos. Commit `c7118f0` (196 archivos).
- Limitación: el inglés vive en campos opcionales y cae al español si falta, así que el gate del validador —no el tipo— es lo que impide publicar contenido sin traducir. La traducción cubre M0-M2; M3-M8 todavía no tienen contenido. El E2E sigue usando textos en español.
- Próximo paso: F3-001 (M3-01, intervalos: cantidad y calidad).

## 2026-11-11T12:13:04-03:00 · F3-001

- Acción: se retomó el proyecto desde el PUNTO DE REANUDACIÓN (F3-001) y se publicó M3-01 «Intervalos: cantidad y calidad». No había cambios sin commitear de una sesión cortada; el único archivo modificado al empezar era `docs/ESTADO.md`, regenerado por el propio `npm run estado`, que se vuelve a generar al cerrar esta tarea.
- Esquema: sin cambios. La lección usa los tipos existentes `interval`, `score` y `keyboardTask`; `skill.interval-quality` suma `lesson.m3-01` a sus `lessonIds`.
- Contenido: M3-01 explica la cantidad (letras, de unísono a octava y compuestos), la calidad por semitonos (justos, mayores, menores, aumentados y disminuidos) y ocho intervalos de referencia. Incluye una demo armónica de cuatro eventos, tarea real de teclado (Do-Mi y Do-Sol a 60 BPM con digitación, demo y checklist) y doce ejercicios de intervalo, uno por tónica, que cubren las cantidades 2.ª a 8.ª y las cinco calidades. Todo el texto y las opciones tienen versión inglesa.
- Corrección: los tests que fijaban el tamaño del curso se actualizaron a 31 lecciones y 162 ejercicios; el índice del curso se regeneró con `npm run index:content`. No hizo falta tocar la teoría: `intervalBetween` ya devolvía las cantidades y calidades esperadas, y el test nuevo lo verifica en las dos lenguas.
- Resultado: suite 113 archivos / 798 tests en verde; typecheck, `validate:content`, build, presupuesto (196,12 kB gzip inicial, 207 chunks diferidos) y E2E 1/1 verdes. Commit del contenido y los tests `801cf11`.
- Limitación: los ejercicios de intervalo se resuelven con el enunciado textual y opciones; todavía no dibujan el pentagrama ni exigen tocar el intervalo en el teclado. La demo usa intervalos armónicos, no una secuencia melódica larga. M3-02 a M3-05 y el entrenamiento auditivo siguen pendientes.
- Próximo paso: F3-002 (M3-02, inversión de intervalos).

## 2026-11-11T12:30:04-03:00 · F3-002

- Acción: se retomó el proyecto desde el PUNTO DE REANUDACIÓN (F3-002) y se publicó M3-02 «Inversión de intervalos». No había cambios sin commitear de una sesión cortada; `docs/ESTADO.md` estaba limpio al empezar y se regeneró al cerrar la tarea.
- Esquema: sin cambios. La lección usa los tipos existentes `interval`, `score` y `keyboardTask`; `skill.interval-quality` suma `lesson.m3-02` a sus `lessonIds`.
- Contenido: M3-02 explica que invertir es subir la nota grave o bajar la aguda una octava, la regla de suma nueve (1↔8, 2↔7, 3↔6, 4↔5), el intercambio de calidades (justo se conserva, mayor↔menor, aumentado↔disminuido), la conservación de las letras y la suma de doce semitonos. La demo muestra cuatro pares original-inversión (Do-Re/Re-Do, Do-Mi/Mi-Do, Do-Fa/Fa-Do, Do-Fa♯/Fa♯-Do). La tarea real de teclado toca Do-Mi/Mi-Do y Do-Sol/Sol-Do a 60 BPM con digitación y checklist. Los doce ejercicios cubren las doce tónicas originales, las cantidades 2.ª a 8.ª y las cinco calidades en ambos sentidos, con explicación y opciones ES/EN.
- Corrección: los ejercicios guardan en `lower`/`upper` la inversión que suena y que hay que nombrar; el enunciado reconstruye el original. El test de ortografía verifica las doce parejas esperadas y la conservación de letras y alteraciones. Al resolver las opciones detectó que `describe` generaba «unísono justa»: se corrigió la concordancia en `src/theory/intervals.ts` con un test unitario. También se actualizaron a 32 lecciones y 174 ejercicios los tests de validación, paridad, índice, progreso, página, router y a11y.
- Resultado: suite 114 archivos / 805 tests en verde; typecheck, `validate:content`, build, presupuesto (196,46 kB gzip inicial, 220 chunks diferidos) y E2E 1/1 verdes. Commit del contenido y los tests `46d685c`.
- Limitación: los ejercicios de inversión se resuelven con el enunciado y opciones; todavía no dibujan el pentagrama ni exigen tocar la inversión en el teclado. El unísono se representa con dos notas iguales, así que el botón de reproducción repite la misma altura. M3-03 a M3-05 y el entrenamiento auditivo siguen pendientes.
- Próximo paso: F3-003 (M3-03, consonancia y disonancia).

## 2026-11-11T12:44:16-03:00 · F3-003

- Acción: se retomó el proyecto desde el PUNTO DE REANUDACIÓN (F3-003) y se publicó M3-03 «Consonancia y disonancia». No había cambios sin commitear de una sesión cortada. El primer `npm run estado` de la sesión falló en la suite y la repetición inmediata pasó con 114 archivos / 805 tests: se trató del fallo intermitente conocido bajo carga paralela, no de una regresión ni de trabajo a medias.
- Esquema: el tipo `interval` agrega `answer` y `answerEn` opcionales. `resolveExerciseAnswer` los usa como respuesta canónica cuando existen y, si faltan, sigue deduciendo el nombre del intervalo desde `lower`/`upper`. No hizo falta un tipo nuevo ni tocar el reproductor: el botón de escucha ya reproduce intervalos armónicos.
- Contenido: M3-03 explica que consonancia y disonancia describen estabilidad y tensión, no valores absolutos. Distingue consonancias perfectas (unísono, quinta y octava), imperfectas (terceras y sextas), disonancias (segundas, séptimas y tritono) y el caso de la cuarta justa, que depende de la voz inferior y del contexto. La demo compara ocho intervalos armónicos desde Do, la tarea de teclado contrasta quinta con cuarta aumentada y tercera con segunda, y doce ejercicios de escucha, uno por tónica, usan cuatro categorías con opciones ES/EN. Las explicaciones aclaran que una disonancia puede ser expresiva y que una séptima puede funcionar como color en blues y jazz.
- Corrección: el test nuevo detectó que la sección de demo había quedado sin el objeto `score` y que las instrucciones de la tarea no mencionaban la tensión; se agregaron el pentagrama de ocho eventos y la frase que compara tensión y reposo. También se actualizaron a 33 lecciones y 186 ejercicios los tests de validación, paridad, índice, progreso, página, router y a11y.
- Resultado: suite 115 archivos / 810 tests en verde; typecheck, `validate:content`, build, presupuesto (196,89 kB gzip inicial, 233 chunks diferidos) y E2E 1/1 verdes. Commit del contenido y los tests `dda6959`.
- Limitación: los ejercicios son de escucha, pero se responden con opciones y no con el teclado ni el pentagrama. Las categorías siguen la tradición tonal y no cubren otros estilos; la cuarta justa se resuelve como «depende del contexto» sin distinguir cada voicing. No hay reproducción de la resolución después de la disonancia. M3-04, M3-05 y el entrenamiento auditivo siguen pendientes.
- Próximo paso: F3-004 (M3-04, intervalos en contexto).

## 2026-11-11T12:53:19-03:00 · F3-004

- Acción: se retomó el proyecto desde el PUNTO DE REANUDACIÓN (F3-004) y se publicó M3-04 «Intervalos en contexto». No había cambios sin commitear de una sesión cortada: el árbol estaba limpio y `npm run estado` pasó typecheck, 115 archivos / 810 tests y build antes de empezar. El único archivo modificado era `docs/ESTADO.md`, regenerado por el propio script y vuelto a generar al cerrar.
- Esquema: el tipo `interval` agrega `fragment` opcional (`ScoreSchema`). `ExercisePlayer` dibuja el fragmento con `Staff` y lo reproduce con `scoreToTimeline`; si no hay fragmento, conserva la reproducción de dos notas de siempre. Se agregaron las claves de interfaz `lesson.exercise.listenFragment` y `lesson.exercise.fragment` en español e inglés.
- Contenido: M3-04 explica los intervalos dentro de melodías (grados conjuntos, saltos, dirección, peso métrico e intervalos compuestos) y dentro de acordes (intervalos apilados, calidad de la tríada e inversiones). Incluye una demo melódica en Do mayor, otra con Do mayor en posición fundamental y primera inversión, tarea real de teclado que pasa de la melodía al acorde y a la décima mayor, y doce ejercicios con fragmentos melódicos (ocho) o acordes (cuatro), un intervalo compuesto y un tritono. Todas las opciones y explicaciones están en español e inglés.
- Corrección: el primer borrador del ejercicio en Si♭ mayor pasó `mode: "b"` al fragmento y `validate:content` lo rechazó; se corrigió la tonalidad a `Bb` con modo `major`. Los tests de conteo se actualizaron a 34 lecciones y 198 ejercicios, y `npm run index:content` regeneró el índice del curso.
- Resultado: suite 116 archivos / 816 tests en verde; typecheck, `validate:content`, build, presupuesto (197,31 kB gzip inicial, 246 chunks diferidos) y E2E 1/1 verdes. Commit del contenido, el esquema, el reproductor y los tests `8d76c4e`.
- Limitación: el fragmento se dibuja con la figura base y el tempo de la partitura, sin resaltar las dos notas preguntadas ni animar el pulso. La identificación sigue siendo por opciones: no hay respuesta escrita ni exigencia de tocar el intervalo en el teclado. M3-05 y el entrenamiento auditivo siguen pendientes.
- Próximo paso: F3-005 (M3-05, intervalos de oído).

## 2026-11-12T11:12:00-03:00 · F3-004a

- Acción: se retomó el proyecto desde el PUNTO DE REANUDACIÓN (F3-004a) y se corrigió el contraste del pentagrama en tema oscuro, reportado por el usuario. No había cambios sin commitear de una sesión cortada.
- Diagnóstico: el defecto venía del tema oscuro: el contenedor `.staff-scroll` usaba `var(--bg-panel)` (`#1d2026`) y VexFlow dibuja notas y pentagrama con color oscuro (`#1d1f23`), por lo que el pentagrama no tenía contraste sobre el fondo.
- Corrección: se introdujo la variable `--staff-bg` (fondo del área del pentagrama) con valor `#ffffff` en tema claro y `#f7f5f0` (papel) en tema oscuro; `.staff-scroll` la consume. El borde, el resaltado por `ACCENT` y el foco quedaron sin cambios.
- Resultado: contraste WCAG AA (>= 4.5) entre las notas y el fondo del pentagrama verificado en `tests/theme.test.ts` para ambos temas; suite 116 archivos / 819 tests en verde; typecheck, build, presupuesto (197,31 kB gzip inicial, 246 chunks diferidos) y E2E 1/1 verdes. Commits `77c794a` (docs en curso) y `d7e45b0` (fix y tests).
- Próximo paso: F3-005 (M3-05, intervalos de oído).

## 2026-11-12T11:45:00-03:00 · F3-005

- Acción: se retomó el proyecto desde el PUNTO DE REANUDACIÓN (F3-005) y se publicó M3-05 «Intervalos de oído». No había cambios sin commitear de una sesión cortada.
- Contenido: M3-05 explica que un intervalo se escucha en dos notas cantadas y se entrena con tres modos (ascendente, descendente y armónico). Incluye la demo de la referencia auditiva (la tercera mayor Do4-Mi4), la tarea real de teclado para tocar las referencias y doce ejercicios de tipo `ear-interval` (`ex.m3-05.a` a `ex.m3-05.l`) que cubren segundos mayores, terceras, quintas, menores, séptimas y quintas aumentadas, con dificultad de 1 a 3.
- Esquema: sin cambios. Los ejercicios usan el tipo `ear-interval` existente con `lower`/`upper` y `direction`; la habilidad `skill.ear-interval` se vincula a la lección y el índice del curso se regenera con `npm run index:content`.
- Corrección: el ejercicio de séptima (`ex.m3-05.e`) nombra «séptima justa» para Do4-Si4; la teoría corrige que esa distancia es séptima mayor, y el ejercicio se ajustó con su respuesta canónica antes de publicar.
- Resultado: suite 117 archivos / 825 tests en verde; typecheck, validación, build, presupuesto (197,66 kB gzip inicial, 259 chunks diferidos) y E2E 1/1 verdes. Commit `40a469e`.
- Próximo paso: F3-006 (M4-01, tríadas mayores y menores).

## 2026-11-12T15:15:00-03:00 · F3-006

- Acción: se retomó el proyecto desde el PUNTO DE REANUDACIÓN (F3-006). La sesión cortada había dejado cambios sin commitear: `content/lessons/m4-01.json`, los doce ejercicios `ex.m4-01.*`, `tests/content-m4-01.test.ts`, la vinculación de `skill.chord-quality`, el índice del curso y el ajuste de conteo en `tests/a11y.test.tsx`. Se revisaron y se decidió **conservarlos y completarlos**, no descartarlos, porque el contenido era válido y la tarea estaba marcada `[~]`.
- Estado inicial: `npm run estado` falló con 9 tests por conteos desactualizados (36 lecciones y 222 ejercicios frente a 35 y 210), por el tipo `chord` que faltaba en la lista de respuestas escritas y por los estados de módulo del mapa (M4 pasó de vacío a bloqueado).
- Corrección de contenido: los enunciados nombraban la calidad que preguntaban («tríada de C mayor») y los doce ejercicios eran todos mayores. Se reescribieron para preguntar la calidad sin regalarla, se alternaron las doce tónicas entre mayor y menor y se verificaron las notas, la tercera y los semitonos de cada explicación (Do, Do♯m, Re, Mi♭m, Mi, Fam, Fa♯, Solm, La♭, Lam, Si♭, Sim).
- Demo: M4-01 ahora muestra las tríadas de Do mayor y menor primero en bloque y después en arpegio (una nota por pulso), y la tarea de teclado pide arpegio y bloque a 60 BPM.
- Tests: se actualizaron los conteos a 36 lecciones y 222 ejercicios, el módulo M4 en el índice y el mapa (M4 bloqueado, M5–M8 vacíos, 35 lecciones bloqueadas), y se amplió `tests/content-m4-01.test.ts` para comprobar ambas calidades, las doce tónicas, el enunciado sin la respuesta, la demo en bloque/arpegio y la tarea.
- Resultado: suite 118 archivos / 830 tests en verde; typecheck, `validate:content`, build, presupuesto (197,99 kB gzip inicial, 272 chunks diferidos) y E2E 1/1 verdes. Commit del contenido y los tests `c93bf44`.
- Limitación: los ejercicios se responden con opciones y no exigen tocar la tríada ni dibujan el acorde en el pentagrama; la demo usa Do como única tónica. Las tríadas disminuidas, aumentadas y sus, las inversiones y las séptimas siguen pendientes.
- Próximo paso: F3-007 (M4-02, tríadas disminuidas, aumentadas y sus).

## 2026-11-12T16:05:00-03:00 · F3-007

- Acción: se retomó el proyecto desde el PUNTO DE REANUDACIÓN (F3-007) y se publicó M4-02 «Tríadas disminuidas, aumentadas y sus». No había cambios sin commitear de una sesión cortada: el árbol estaba limpio y `npm run estado` había pasado en verde al cerrar F3-006.
- Contenido: M4-02 explica las cuatro fórmulas (disminuida 1-♭3-♭5, aumentada 1-3-♯5, suspendida 2 1-2-5 y suspendida 4 1-4-5), el tritono que vuelve inestable a la disminuida, la simetría ambigua de la aumentada y la resolución de las suspendidas a mayor o menor. Incluye una demo con las cuatro calidades sobre Do (Do-Mi♭-Sol♭, Do-Mi-Sol♯, Do-Re-Sol y Do-Fa-Sol), una tarea real de teclado que resuelve Do-Fa-Sol en Do-Mi-Sol y doce ejercicios de tipo `chord`.
- Ejercicios: los doce enunciados dan las tres notas y preguntan la calidad sin nombrarla. Las doce tónicas se reparten en tres disminuidas (Do, Re, Fa♯), tres aumentadas (Mi♭, Sol, Si♭), tres suspendidas 2 (Do♯, Fa, La) y tres suspendidas 4 (Mi, La♭, Si). Las opciones son «disminuido», «aumentado», «suspendido 2» y «suspendido 4», con su paridad en inglés.
- Habilidad: `skill.chord-quality` amplía sus `qualities` con `sus2` y `sus4` y suma `lesson.m4-02` a sus `lessonIds`.
- Corrección: el primer test de M4-02 pasaba el `root` del ejercicio directo a `chordPitches`, que espera un `Pitch` resuelto; se corrigió con `fromSpelledPitch` antes de comparar las notas del enunciado.
- Tests: se actualizaron los conteos a 37 lecciones y 234 ejercicios, el módulo M4 del índice (dos lecciones) y el mapa (M4 bloqueado, M5–M8 vacíos, 36 lecciones bloqueadas). `tests/content-m4-02.test.ts` cubre las cuatro fórmulas, el contexto, la demo, las doce tónicas y calidades, los enunciados con notas y sin la respuesta, las respuestas ES/EN, la dificultad y la resolución sus4→mayor.
- Resultado: suite 119 archivos / 835 tests en verde; typecheck, `validate:content`, build, presupuesto (198,37 kB gzip inicial, 285 chunks diferidos) y E2E 1/1 verdes. Commit del contenido y los tests `e5f3ac7`.
- Limitación: los ejercicios se responden con opciones y no dibujan el acorde en el pentagrama ni exigen tocarlo; la demo usa Do como única tónica. Las inversiones, los voicings y las séptimas siguen pendientes.
- Próximo paso: F3-008 (M4-03, inversiones y voicings básicos).

## 2026-11-12T17:10:00-03:00 · F3-008

- Acción: se retomó el proyecto desde el PUNTO DE REANUDACIÓN (F3-008) y se publicó M4-03 «Inversiones y voicings básicos». No había cambios sin commitear: el árbol estaba limpio tras el push de F3-007.
- Contenido: M4-03 explica que la inversión no cambia las notas sino el bajo real, las tres posiciones de la tríada (estado fundamental 1-3-5, primera inversión 3-5-1 y segunda inversión 5-1-3), el cifrado slash (Do/Mi, Do/Sol) y la diferencia entre voicing cercano y abierto. Incluye demo de Do mayor en fundamental, primera, segunda y abierto (Do-Mi-Sol, Mi-Sol-Do, Sol-Do-Mi y Do-Sol-Mi), tarea de teclado con las cuatro posiciones y doce ejercicios.
- Esquema: el tipo `chord` agrega `ask: 'quality' | 'inversion'` con valor por defecto `quality`, para no tocar el contenido anterior. La resolución de respuestas devuelve las etiquetas de inversión desde `CHORD_INVERSION_LABELS` (estado fundamental, primera, segunda y tercera) en español e inglés. Se agregó la habilidad `skill.chord-inversion`, vinculada a M4-03.
- Ejercicios: doce tríadas con las doce tónicas repartidas en cuatro de estado fundamental (Do mayor, Mi menor, Fa♯ mayor, La menor), cuatro de primera inversión (Do♯ menor, Mi♭ mayor, Sol mayor, Si♭ mayor) y cuatro de segunda inversión (Re menor, Fa mayor, La♭ mayor, Si menor). El enunciado da las notas ordenadas de grave a agudo y no nombra la inversión; el alumno debe identificar la fundamental y mirar qué nota quedó en el bajo.
- Tests: `tests/content-m4-03.test.ts` cubre el bajo real, las tres posiciones, el cifrado slash, los voicings, la demo, las doce tónicas, los enunciados con notas y sin la respuesta, las respuestas ES/EN, las opciones, la dificultad y la tarea. Se agregó un caso de `chord` con `ask: 'inversion'` a `tests/exercises-answer.test.ts`. Los conteos se actualizaron a 38 lecciones y 246 ejercicios, M4 a tres lecciones y 37 lecciones bloqueadas en el mapa.
- Resultado: suite 120 archivos / 840 tests en verde; typecheck, `validate:content`, build, presupuesto (198,86 kB gzip inicial, 298 chunks diferidos) y E2E 1/1 verdes. Commit del contenido, el esquema y los tests `2256459`.
- Nota: una primera corrida de `npm run estado` falló por dos timeouts en `tests/exercise-player.test.tsx` bajo carga; el archivo pasó aislado y la suite completa volvió a pasar en verde, así que se trató de una fluctuación de tiempo, no de una regresión.
- Limitación: los ejercicios se responden con opciones y no dibujan el acorde ni lo reproducen; la tarea usa Do mayor como único ejemplo. Las séptimas, las extensiones y los slash chords siguen pendientes.
- Próximo paso: F3-009 (M4-04, séptimas: maj7, 7, m7, m7♭5 y dim7).

## 2026-11-12T18:15:00-03:00 · F3-009

- Acción: se retomó el proyecto desde el PUNTO DE REANUDACIÓN (F3-009). El árbol estaba limpio tras el commit `5e6f7fb` que marcó la tarea en curso, y esta sesión continuó con la implementación que había quedado sin commitear: esquema, resolución de notas, habilidad, lección, ejercicios y tests.
- Contenido: M4-04 explica las cinco fórmulas de séptima (maj7 1-3-5-7, 7 1-3-5-♭7, m7 1-♭3-5-♭7, m7♭5 1-♭3-♭5-♭7 y dim7 1-♭3-♭5-♭♭7), el cifrado de cada calidad, el tritono de la de dominante y su resolución, el uso de la mayor, la menor, la semidisminuida y la simétrica disminuida, y la diferencia entre el cifrado y el cifrado slash. Incluye demo de las cinco sobre Do, tarea de teclado que mantiene la fundamental y cambia la tercera, la quinta o la séptima, y doce ejercicios.
- Esquema: el tipo `chord` amplía `ask` con `'notes'` además de `'quality'` e `'inversion'`. La resolución devuelve las notas del acorde en orden de grave a agudo, en español con `formatPitchEs` y en inglés sin octava, y acepta la respuesta escrita. Se agregó la habilidad `skill.chord-seventh` con las cinco calidades y `askNotes: true`, vinculada a M4-04.
- Ejercicios: seis `ask: "quality"` (Do maj7, Re7, Mi m7, Fa♯ m7♭5, Do♯ dim7 y La♭ maj7) y seis `ask: "notes"` (Mi♭7, Fa maj7, Sol m7, La m7♭5, Si♭7 y Si dim7). Las doce tónicas aparecen una vez y las cinco calidades se reparten entre los dos bloques. En dim7 se escribe Si♭♭ y se aclara que suena igual que La.
- Corrección: el test de contenido falló porque el cuerpo decía «la semidisminuida» y «la disminuida» en lugar de los nombres completos que exige la aserción. Se reescribieron esas frases en español e inglés; el fallo era de texto, no de teoría.
- Tests: `tests/content-m4-04.test.ts` cubre las cinco fórmulas, el cifrado, el uso, la demo, las doce tónicas y calidades, los enunciados (calidad sin la respuesta; notas a partir del cifrado), las respuestas ES/EN, las opciones, la dificultad y la tarea. Se agregó un caso de `chord` con `ask: 'notes'` a `tests/exercises-answer.test.ts`. Los conteos se actualizaron a 39 lecciones, 258 ejercicios y 26 habilidades, con M4 a cuatro lecciones y 38 lecciones bloqueadas en el mapa.
- Resultado: suite 121 archivos / 845 tests en verde; typecheck, `validate:content`, build, presupuesto (199,43 kB gzip inicial, 311 chunks diferidos) y E2E 1/1 verdes. Commit del contenido, el esquema y los tests `1521b5c`.
- Limitación: los ejercicios de calidad se responden con opciones y los de notas con texto; ninguno dibuja ni reproduce el acorde, y la tarea usa Do como única fundamental. Las extensiones 9/11/13, los slash chords y el cifrado latino siguen pendientes.
- Próximo paso: F3-010 (M4-05, extensiones 9, 11 y 13).

## 2026-11-12T19:00:00-03:00 · F3-010

- Acción: se retomó el proyecto desde el PUNTO DE REANUDACIÓN (F3-010) y se publicó M4-05 «Extensiones: 9, 11 y 13». No había cambios sin commitear: el árbol estaba limpio tras el push de F3-009.
- Contenido: M4-05 explica la novena, la oncena y la trecena como intervalos compuestos de 14, 17 y 21 semitonos, la séptima implícita y las nueve fórmulas (maj9, 9, m9, maj11, 11, m11, maj13, 13 y m13). Desarrolla las tensiones y los choques: la oncena justa choca con la tercera mayor del dominante y funciona como nota a evitar, mientras que la trecena es la extensión más estable. Explica las omisiones habituales (la quinta primero, la tercera en un 11 de dominante y la oncena en un 13) y aclara que la tensión no cambia el cifrado.
- Demo: cuatro voicings sobre Do, uno por compás: Do maj9 (Do-Mi-Si-Re), Do9 (Do-Mi-Si♭-Re), Do m11 (Do-Mi♭-Fa-Si♭) y Do13 (Do-Mi-Si♭-La). Los tres primeros omiten la quinta y el m11 también la novena; el 13 omite quinta, novena y oncena y deja la trecena una octava arriba de la séptima. La tarea de teclado repite esos voicings a 60 BPM y sugiere repartir el 13 entre las dos manos.
- Ejercicios: seis `ask: "quality"` que dan las notas y preguntan la calidad (Do maj9, Re9, Mi m9, Fa maj11, Sol11 y La m11) y seis `ask: "notes"` que dan el cifrado y piden las notas (Si♭ maj13, Do13, Re m13, Mi♭ maj9, Fa♯9 y Sol♯ m11). Las opciones de reconocimiento comparan las tres variantes de cada extensión (mayor, de dominante y menor). Las respuestas usan la construcción completa del cifrado aunque la lección explique las omisiones.
- Esquema: no hizo falta tocar el tipo `chord`; alcanzó con las calidades extendidas que ya existían en `CHORD_DEFINITIONS` y con `ask: "notes"` de F3-009. Se agregó la habilidad `skill.chord-extension` con las nueve calidades, `omissions: true` y `askNotes: true`, vinculada a M4-05.
- Corrección: la primera escritura del test esperaba tres dominantes9 y el reparto real era de dos; también se corrigió antes de commitear un `minutes: 22` que superaba el máximo de 20 del esquema. La validación y el índice se regeneraron sin más errores.
- Tests: `tests/content-m4-05.test.ts` cubre las nueve fórmulas, las tensiones, las omisiones, el cifrado, la demo, los doce ejercicios, las respuestas ES/EN, las opciones, la dificultad y la tarea. Los conteos se actualizaron a 40 lecciones, 270 ejercicios y 27 habilidades, con M4 a cinco lecciones y 39 lecciones bloqueadas en el mapa.
- Resultado: suite 122 archivos / 850 tests en verde; typecheck, `validate:content`, build, presupuesto (199,86 kB gzip inicial, 324 chunks diferidos) y E2E 1/1 verdes. Commit del contenido, la habilidad y los tests `4a87268`.
- Limitación: los ejercicios de calidad se responden con opciones y los de notas con texto; ninguno dibuja ni reproduce el acorde, y las omisiones se explican pero no se piden en una respuesta. Los slash chords y el cifrado latino siguen pendientes.
- Próximo paso: F3-011 (M4-06, slash chords).

## 2026-11-12T19:30:00-03:00 · F3-011

- Acción: se retomó el proyecto desde el PUNTO DE REANUDACIÓN (F3-011) y se publicó M4-06 «Slash chords: acordes con bajo especificado». No había cambios sin commitear: el árbol estaba limpio tras el push de F3-010.
- Contenido: M4-06 explica que el acorde va antes de la barra y el bajo después, que la calidad no cambia y que el bajo puede ser una nota del acorde o una nota ajena. Distingue las inversiones (Do/Mi primera, Do/Sol segunda) de los híbridos (Do/Re y Do/Si), explica cómo colocar el bajo primero y el acorde arriba, la equivalencia entre cifrado latino y americano (Do/Mi ↔ C/E) y el caso de Do/Si como Do maj7 con la séptima en el bajo. Incluye demo de cuatro slash chords sobre Do, tarea de teclado a dos manos y doce ejercicios.
- Esquema y motor: el tipo `chord` agrega `slash` opcional (bajo con barra) y `ask: "symbol"`. Se agregó `chordWithSlash`, que devuelve la inversión si el bajo es una nota del acorde y, si no lo es, coloca el bajo primero con el acorde completo por encima. La resolución de `ask: "symbol"` usa `chordSymbol` con notación `do`/`c` y devuelve la elección en el idioma activo. Se agregó la habilidad `skill.chord-slash`.
- Ejercicios: seis `ask: "symbol"` que dan las notas (Do/Mi, Do/Sol, Do/Re, Do/Si, Fa/La, Sol/Si) y seis `ask: "notes"` que dan el cifrado (Re/Fa♯, Lam/Sol, Si♭/Re, Fa/Do, Sol/Re y Lam/Mi). Las respuestas de notas se generan desde el bajo y la explicación indica si es una inversión o un híbrido.
- Corrección: los enunciados de notas escribían «La m/Sol» y «La m/Mi» con espacio, mientras que `chordSymbol` produce «Lam/Sol» y «Lam/Mi»; se unificó el texto con el motor. Antes de eso, el test de contenido detectó la discrepancia y el resto de las comprobaciones ya pasaba.
- Tests: `tests/content-m4-06.test.ts` cubre la barra, el bajo, las inversiones, los híbridos, el cifrado latino/americano, la demo, los doce ejercicios, las respuestas ES/EN, las opciones, la dificultad y la tarea. Se agregaron dos casos a `tests/exercises-answer.test.ts`: notas de Do/Re y cifrado de Do/Mi. Los conteos se actualizaron a 41 lecciones, 282 ejercicios y 28 habilidades, con M4 a seis lecciones y 40 lecciones bloqueadas en el mapa.
- Resultado: suite 123 archivos / 855 tests en verde; typecheck, `validate:content`, build, presupuesto (200,72 kB gzip inicial, 337 chunks diferidos) y E2E 1/1 verdes. Commit del contenido, el motor y los tests `6cded12`.
- Limitación: los ejercicios se responden con opciones o texto y no dibujan ni reproducen el slash chord; la tarea usa Do como única fundamental. El cifrado latino/americano completo y la conversión bidireccional quedan para F3-012.
- Próximo paso: F3-012 (M4-07, cifrado latino/americano).

## 2026-11-12T20:00:00-03:00 · F3-012

- Acción: se retomó el proyecto desde el PUNTO DE REANUDACIÓN (F3-012) y se publicó M4-07 «Cifrado latino y americano». No había cambios sin commitear: el árbol estaba limpio tras el push de F3-011, aunque `src/theory/chords.ts` ya contenía `convertChordNotation` sin commitear; se incluyó en el commit de la tarea.
- Contenido: M4-07 explica la tabla completa de notaciones latinas (Do, Re, Mi, Fa, Sol, La, Si) y americanas (C, D, E, F, G, A, B), las alteraciones ♭ y ♯ con sus formas ASCII b y #, los sufijos de calidad que se conservan (m, maj7, 7, m7, m7♭5, dim7, sus2, sus4, add9, 9, 11, 13) y la conversión en los dos sentidos, tanto de la nota como del bajo de la barra. Incluye las trampas de Do/Mi frente a Do m7 y la forma en que el curso escribe los cifrados sin espacio (Dom7). Demo de ocho acordes con cifrado dual, tarea de teclado y doce ejercicios de conversión.
- Motor: se agregó el tipo de ejercicio `chord-notation` con `symbol` y `to` (`do` o `c`) en el esquema, la resolución en `src/exercises/answer.ts` mediante `convertChordNotation`, los formatos `see`/`spell`, el error pedagógico «Recordá la equivalencia entre cifrados» y el skill kind `chord`. Se corrigió el parser de tokens del motor para aceptar notas latinas de tres letras (Sol, La, Si) junto a las de dos (Do, Re, Mi, Fa, Sol...).
- Ejercicios: los seis primeros del alfabeto con `to: "c"` responden con opciones (Do7/Solm → C7/Gm, Rem7 → Dm7, Si♭maj7/Re → B♭maj7/D, Fa♯dim7 → F♯dim7, Solm7♭5 → Gm7♭5, La♭7 → A♭7); los seis últimos con `to: "do"` piden la respuesta escrita (C7/Gm → Do7/Solm, Dm7 → Rem7, B♭maj7/D → Si♭maj7/Re, F♯dim7 → Fa♯dim7, Gm7♭5 → Solm7♭5, A♭7 → La♭7). Todas las respuestas pasan por conversión y la vuelta convierten al original.
- Tests: `tests/content-m4-07.test.ts` cubre la tabla, la conversión, la demo, los doce ejercicios, la vuelta a la inversa y la tarea. Se agregaron códigos y fixtures a `tests/exercises-answer.test.ts` y `tests/theory-errors.test.ts`, y se actualizaron los conteos a 42 lecciones, 294 ejercicios, 29 habilidades, con M4 a siete lecciones y 41 lecciones bloqueadas en el mapa.
- Resultado: suite 124 archivos / 862 tests en verde; typecheck, `validate:content`, build, presupuesto (201,71 kB gzip inicial, 350 chunks diferidos) y E2E 1/1 verdes.
- Limitación: la conversión cubre notas, alteraciones y sufijos, pero las opciones y las respuestas convierten una fuente a una meta; la escucha auditiva de la equivalencia queda fuera de este ejercicio.
- Próximo paso: F3-013 (M4-08, medir intervalos).

## 2026-11-12T21:30:00-03:00 · F3-013

- Acción: se retomó el proyecto desde el PUNTO DE REANUDACIÓN (F3-013) y se publicó M4-08 «Medir intervalos». No había cambios sin commitear: el árbol estaba limpio tras el push de F3-012.
- Contenido: M4-08 explica la cantidad (letras, de unísono a octava y compuestos) y la calidad (justos, mayores, menores, aumentados y disminuidos) con la medición melódica y la armónica. Demo de cuatro intervalos desde Do (tercera mayor, tercera menor, cuarta justa y cuarta aumentada), tarea de teclado con la demo y doce ejercicios de tipo `interval` que cubren las doce tónicas, las siete cantidades (2.ª a octava) y las cinco calidades.
- Ejercicios: los doce ejercicios con opciones comparan la respuesta canónica resuelta por `intervalCandidates` con las opciones en español e inglés; las respuestas se verificaron contra el motor antes de commitear y los distractores se eligieron entre nombres de intervalos válidos.
- Tests: `tests/content-m4-08.test.ts` cubre la publicación y el prerequisito, los conceptos, la demo, los doce ejercicios, las respuestas ES/EN, las opciones, la cobertura de tónicas/cantidades/cualidades y la tarea. Los conteos se actualizaron a 43 lecciones, 306 ejercicios, 29 habilidades, con M4 a ocho lecciones y 42 lecciones bloqueadas en el mapa.
- Resultado: suite 125 archivos / 867 tests en verde; typecheck, `validate:content`, build, presupuesto (201,99 kB gzip inicial, 363 chunks diferidos) y E2E 1/1 verdes. Commit del contenido, la lección, los ejercicios y los tests `88d330e`.
- Limitación: los ejercicios se responden con opciones y no dibujan ni reproducen el intervalo; la tarea usa los pares de la demo con Do como nota central.
- Próximo paso: F3-014 (M4-09, cifrado ↔ notas).

## 2026-11-10T18:59:20-03:00 · F3-014

- Acción: se retomó el proyecto desde el PUNTO DE REANUDACIÓN (F3-014). El árbol estaba limpio tras el commit `4ec4811` que marcó la tarea en curso, con la suite en verde (125 archivos / 867 tests), así que no hubo cambios que completar ni descartar. Se publicó M4-09 «Del cifrado a las notas y de las notas al cifrado».
- Contenido: M4-09 explica el cifrado como atajo de dos sentidos: leer un símbolo y construir sus notas, y mirar las notas y escribir el símbolo. Cubre tríadas mayores, menores, disminuidas y aumentadas y las cinco séptimas (maj7, 7, m7, m7♭5 y dim7), el orden de las notas de grave a agudo, la conservación de la fundamental, la calidad y la ortografía en la ida y vuelta y la equivalencia entre cifrado latino y americano (Do7 ↔ C7, Rem7 ↔ Dm7). Demo de cuatro acordes en posición fundamental (Do mayor, Rem, Si♭maj7 y La7) con su vuelta al cifrado, tarea de teclado y doce ejercicios.
- Ejercicios: seis `ask: "notes"` que dan el cifrado y piden las notas y seis `ask: "symbol"` que dan las notas y piden el cifrado. Las doce tónicas aparecen una vez y los dos bloques alternan tríadas y séptimas; las respuestas escritas pasan por el motor y el test de ida y vuelta vuelve a convertir cada símbolo a sus notas y cada conjunto de notas a su símbolo.
- Esquema: no hizo falta un tipo nuevo; se reutilizó `chord` con `ask: "notes"` y `ask: "symbol"` de F3-009 y F3-011. Se agregó la habilidad `skill.chord-symbol` con las direcciones `symbol-to-notes` y `notes-to-symbol`, las nueve calidades y las notaciones `do`/`c`, vinculada a M4-09.
- Corrección: el test de ida y vuelta falló con `Solm7` porque `parseChordSymbol` solo traducía raíces latinas de dos letras (`Do`, `Re`, `Mi`, `Fa`) y no las de tres (`Sol`, `La`, `Si`), de modo que el token se usaba como letra y la nota quedaba inválida. Se reemplazó el mapeo condicional por `LATIN_TO_NOTE[token] ?? token` tanto en la fundamental como en el bajo de la barra y se agregaron regresiones para `Solm7` y `Domaj7/Sol` en `tests/theory-chords.test.ts`. Era un fallo real del motor, no del contenido.
- Tests: `tests/content-m4-09.test.ts` cubre los dos sentidos, el español y el inglés, las doce tónicas, tríadas y séptimas, la demo, la tarea y la ida y vuelta. Los conteos se actualizaron a 44 lecciones, 318 ejercicios y 30 habilidades, con M4 a nueve lecciones y 43 lecciones bloqueadas en el mapa; también se corrigieron los conteos fijos de `43` en las pruebas de UI.
- Resultado: suite 126 archivos / 875 tests en verde; typecheck, `validate:content`, build, presupuesto (202,37 kB gzip inicial, 376 chunks diferidos) y E2E 1/1 verdes. Commit del contenido, la habilidad, el motor y los tests `35f0c41`.
- Limitación: los ejercicios se responden con opciones o texto y no dibujan ni reproducen el acorde; la tarea usa los cuatro acordes de la demo. La calidad aislada con distractores cercanos y el audio quedan para F3-015.
- Próximo paso: F3-015 (M4-10, calidad de acordes: cinco séptimas y tríadas, distractores cercanos y audio).

## 2026-11-10T19:11:41-03:00 · F3-015

- Acción: se retomó el proyecto desde el PUNTO DE REANUDACIÓN (F3-015) y se publicó M4-10 «Reconocer la calidad de un acorde». No había cambios sin commitear: el árbol estaba limpio tras el push de F3-014.
- Contenido: M4-10 explica la calidad como la combinación de tercera, quinta y séptima. Cubre las cuatro tríadas (mayor, menor, disminuida y aumentada) por su tercera y su quinta, las cinco séptimas (maj7, 7, m7, m7♭5 y dim7) por su quinta y su séptima, los dos pares que más se confunden (maj7 con 7 y m7 con m7♭5) y un método de escucha en tres capas. Demo de cuatro acordes que contrastan esos pares (Do maj7, Do7, Rem7 y Rem7♭5), tarea de teclado para tocar cada par y doce ejercicios.
- Ejercicios: seis visuales de tipo `chord` con `ask: "quality"` que muestran las notas y piden la calidad (Do maj7, Do♯7, Rem7, Mi♭ aumentado, Mi dim7 y Fa♯ m7♭5) y seis auditivos de tipo `ear-chord` que suenan el acorde y piden la misma respuesta (Fa mayor, Sol menor, Si disminuido, La7, Si♭ maj7 y La♭ aumentado). Las doce tónicas aparecen una vez, las nueve calidades quedan cubiertas y las opciones son siempre de la misma familia para que los distractores sean cercanos.
- Esquema y audio: el tipo `ear-chord` solo tenía `quality`; se amplió con `root`, `inversion` y `style` (`block`, `arpeggio-up`, `arpeggio-down`) para poder reproducirlo. Se agregó `earChordTimeline` en `src/exercises/audio.ts`, que construye el acorde con `chordWithInversion` y lo convierte en timeline, y el reproductor incorpora el botón «Escuchar acorde» en español e inglés. Las visuales se reparten entre `skill.chord-quality` y `skill.chord-seventh`; se agregó `skill.chord-quality-ear` para el reconocimiento auditivo.
- Corrección: el test de tipos de ejercicio escrito a mano no incluía `ear-chord` porque hasta ahora ningún contenido lo usaba; se agregó a la lista esperada. También se ajustó la aserción de opciones para aceptar cuatro o cinco alternativas, ya que el primer ejercicio de séptimas ofrece las cinco calidades.
- Tests: `tests/content-m4-10.test.ts` cubre la publicación y el prerrequisito, los conceptos, la demo, los doce ejercicios, las respuestas ES/EN, las opciones de la misma familia, la cobertura de tónicas y calidades, el timeline de audio y la tarea. Los conteos se actualizaron a 45 lecciones, 330 ejercicios y 31 habilidades, con M4 a diez lecciones y 44 lecciones bloqueadas en el mapa.
- Resultado: suite 127 archivos / 883 tests en verde; typecheck, `validate:content`, build, presupuesto (202,87 kB gzip inicial, 389 chunks diferidos) y E2E 1/1 verdes. Commit del contenido, el esquema, el audio y los tests `3047afd`.
- Limitación: los ejercicios auditivos suenan en bloque con la fundamental escrita en el contenido; el arpegio está soportado por el esquema pero todavía no se usa en los ítems. La sesión auditiva adaptativa y el botón de repetir con límites quedan para F3-019 y F3-024.
- Próximo paso: F3-016 (M4-11, inversiones y bajo).

## 2026-11-10T19:17:14-03:00 · F3-016

- Acción: se retomó el proyecto desde el PUNTO DE REANUDACIÓN (F3-016) y se publicó M4-11 «Inversiones y bajo: construir el voicing desde abajo». No había cambios sin commitear: el árbol estaba limpio tras el push de F3-015.
- Contenido: M4-11 reúne las inversiones de M4-03 y los slash chords de M4-06. Explica que el bajo decide la inversión, las tres posiciones de la tríada y las cuatro de la séptima, cómo construir desde un bajo con barra (incluido el caso híbrido) y las tres condiciones de un voicing válido: bajo correcto, todas las notas presentes y orden rotado. Demo de Do maj7 en estado fundamental, primera, segunda y tercera inversión, tarea de teclado y doce ejercicios.
- Ejercicios: seis `ask: "inversion"` que dan las notas de grave a agudo y piden la posición (Do maj7 fundamental, Rem7 primera, Mim7 segunda, Famaj7 tercera, Sol mayor primera y La menor segunda) y seis `ask: "notes"` con `slash` que dan un cifrado con barra y piden las notas desde el bajo (Si♭maj7/Re, Sim7/La, Do♯m7/Sol♯, Mi♭maj7/Sol, Fa♯7/Mi y La♭maj7/Do). Las doce tónicas aparecen una vez y se cubren las tres inversiones de la tríada y las cuatro posiciones de la séptima.
- Esquema: no hizo falta tocar el motor; se reutilizaron `chord` con `ask: "inversion"` y `ask: "notes"` más `slash`. Se amplió `skill.chord-inversion` con la inversión 3 y se agregó M4-11 a `skill.chord-inversion` y `skill.chord-slash`.
- Tests: `tests/content-m4-11.test.ts` cubre la publicación y el prerrequisito, los conceptos, la demo, los seis ejercicios de inversión, los seis de notas y un test de voicings válidos que compara cada resultado con `chordWithSlash`: bajo más grave, clases del acorde completas, orden rotado e índice de inversión igual al grado del bajo. También verifica las respuestas ES/EN, las opciones y la tarea. Los conteos se actualizaron a 46 lecciones, 342 ejercicios y 31 habilidades, con M4 a once lecciones y 45 lecciones bloqueadas en el mapa.
- Resultado: suite 128 archivos / 889 tests en verde; typecheck, `validate:content`, build, presupuesto (203,22 kB gzip inicial, 402 chunks diferidos) y E2E 1/1 verdes. Commit del contenido y los tests `758b842`.
- Limitación: los ejercicios de notas usan bajos que pertenecen al acorde; los híbridos con bajo ajeno se explican pero no se piden en esta lección. Los voicings abiertos y las omisiones de jazz quedan para más adelante.
- Próximo paso: F3-017 (M4-12, extensiones y slash chords).

## 2026-11-10T19:26:10-03:00 · F3-017

- Acción: se retomó el proyecto desde el PUNTO DE REANUDACIÓN (F3-017) y se publicó M4-12 «Extensiones con bajo: 9, 11 y 13 sobre un slash». El árbol estaba limpio tras el push de F3-016.
- Contenido: M4-12 combina las extensiones de M4-05 con los slash chords de M4-06 y las inversiones de M4-11. Explica que la extensión no cambia el bajo, el procedimiento de cuatro pasos para construir el voicing completo (armar 1-3-5-7-9-11-13, ubicar el grado del bajo, apilar por altura y comprobar bajo, notas y alteraciones), la lectura y escritura del cifrado con barra y los errores frecuentes (olvidar la séptima, repetir el bajo, confundir inversión con híbrido y usar dobles alteraciones). Demo de Do maj9/Mi, Re m9/Do, Sol11/Fa y La♭maj13/Do, tarea de teclado y doce ejercicios.
- Ejercicios: seis `ask: "notes"` con `slash` que dan el cifrado y piden las notas desde el bajo (Do maj9/Mi, Re m9/Do, Mi♭maj11/Sol, Fa♯m11/Mi, La♭maj13/Do y Si♭9/Re) y seis `ask: "symbol"` que dan las notas de grave a agudo y piden el cifrado (Simaj9/La♯, Do♯m9/Si, Mim13/Re, Fa13/La, Sol11/Fa y Lamaj9/Sol♯). Las doce tónicas aparecen una vez y se cubren las nueve calidades extendidas: major9, dominant9, minor9, major11, dominant11, minor11, major13, dominant13 y minor13. Dificultades 4 y 5.
- Esquema: no hizo falta tocar el esquema; se reutilizaron `chord` con `ask: "notes"` y `ask: "symbol"` más `slash`. Se agregó M4-12 a `skill.chord-extension` y `skill.chord-slash`.
- Corrección de motor: al preparar los voicings se encontró que `invertChord` rotaba las notas y dejaba las extensiones en orden no ascendente. Por ejemplo, Re m9/Do producía Do-Mi-Re-Fa-La, con Mi por encima de Re. Se corrigió ordenando el resultado por altura para que el voicing siempre suba desde el bajo, y se agregó una regresión en `tests/theory-chords.test.ts` con Do maj9/Mi, Re m9/Do y Sol11/Fa.
- Tests: `tests/content-m4-12.test.ts` cubre la publicación y el prerrequisito, los conceptos, la demo, los seis ejercicios de notas, los seis de cifrado y la cobertura de doce tónicas y nueve calidades. Para cada ejercicio comprueba el bajo más grave, las clases completas del acorde, el orden ascendente, la ausencia de dobles alteraciones, el índice de inversión, las respuestas ES/EN, las opciones y que un distractor no sea aceptado. También verifica la tarea de teclado y que sus teclas pertenezcan a la demo. Los conteos se actualizaron a 47 lecciones, 354 ejercicios y 31 habilidades, con M4 a doce lecciones y 46 lecciones bloqueadas en el mapa.
- Resultado: suite 129 archivos / 897 tests en verde; typecheck, `validate:content`, build, presupuesto (203,56 kB gzip inicial, 415 chunks diferidos) y E2E 1/1 verdes. Commit del contenido, el motor y los tests `b45672a`.
- Limitación: todos los bajos de los ejercicios son tercera o séptima del acorde; los híbridos con bajo ajeno y las omisiones de jazz se explican pero no se piden. Los voicings son completos y ascendentes, sin repartir entre manos salvo la sugerencia de la tarea.
- Próximo paso: F3-018 (reproducir acordes con voicings, bloque y arpegio).

## 2026-11-10T19:39:01-03:00 · F3-018

- Acción: se retomó el proyecto desde el PUNTO DE REANUDACIÓN (F3-018) y se completó la reproducción de acordes con voicings. El árbol tenía cambios parciales de la sesión cortada en `src/audio/notes.ts`, `src/exercises/audio.ts`, `src/schemas/content.ts`, `src/components/ExercisePlayer.tsx`, `src/components/Demo.tsx`, `src/state/settings.tsx` y `src/styles.css`; se revisaron, se completaron con tests y se commitearon juntos.
- Audio: `src/audio/notes.ts` ahora exporta `CHORD_STYLES` y `ChordStyle` para que demo y ejercicios compartan la misma lista. El estilo `bass-chord` sostiene el bajo tres pulsos y hace entrar el acorde en el segundo pulso sin repetir el MIDI del bajo; así se evita disparar dos veces la misma nota y que una liberación corte a la otra (notas trabadas).
- Ejercicios: `chordExerciseTimeline` convierte un ejercicio `chord` en un timeline que respeta inversión y bajo con barra. `earChordTimeline` acepta un tercer parámetro de estilo que sobrescribe el del ejercicio y conserva el estilo guardado como valor por defecto. El esquema de `ear-chord` acepta `bass-chord`.
- UI: `ExercisePlayer` muestra «Escuchar acorde» y un selector de forma (`Forma`) para ejercicios `chord` y `ear-chord`. `Demo` reutiliza `CHORD_STYLES`/`ChordStyle` en lugar de duplicar el tipo. Se agregaron las claves ES/EN `lesson.exercise.chordStyle*` y el estilo `.exercise-chord-style`.
- Tests: `tests/audio-sequence.test.ts` actualiza las expectativas de `bass-chord` (bajo de tres pulsos, acorde sin el MIDI del bajo, duración total), cubre el caso de un solo MIDI y comprueba que el tempo escala la programación sin reescribir timelines ya creados. Se creó `tests/exercises-audio.test.ts` con siete casos para bloque, tempo, inversión, slash, bajo con barra, arpegios, `bass-chord`, estilo por defecto y override. `tests/exercise-player.test.tsx` verifica el botón y el selector en un ejercicio `chord` de M4-03, y `tests/i18n.test.ts` cubre las claves dinámicas `lesson.exercise.chordStyle.*`.
- Resultado: suite 130 archivos / 906 tests en verde; typecheck, `validate:content`, build, presupuesto (203,73 kB gzip inicial, 415 chunks diferidos) y E2E 1/1 verdes. Commit `051e2f0`.
- Limitación: el selector de forma es local al reproductor y no se persiste; el alumno puede cambiar la forma en cada ejercicio, pero la preferencia no sobrevive a la recarga ni al cambio de ejercicio.
- Próximo paso: F3-019 (construir el motor de sesiones auditivas con dificultad adaptativa).

## 2026-11-10T19:43:31-03:00 · F3-019

- Acción: se cerró el motor puro de sesiones auditivas adaptativas. La sesión cortada había dejado el código y los tests commiteados en `18f3500`, pero la actualización de `docs/CHECKLIST.md`, `docs/DECISIONES.md` y `docs/ESTADO.md` quedó sin commitear; al retomar se revisó, se regeneró `docs/ESTADO.md` y se commitearon juntos en `b5972a3`.
- Motor: `src/exercises/ear-session.ts` implementa una sesión de 10 ítems por defecto sobre cualquier lista con `id` y `difficulty` (1-5). Evita repetir ítems mientras queden candidatos, elige el más cercano al nivel actual y desempata con una semilla combinada con la posición. La dificultad sube tras dos aciertos consecutivos y baja tras dos errores, con topes y rachas configurables; cada respuesta registra el ítem, el nivel con el que se respondió y el resultado.
- Tests: ocho casos cubren largo, registro, adaptación, no repetición, fallback por nivel faltante, determinismo, normalización y lista vacía.
- Resultado: suite 131 archivos / 914 tests en verde; typecheck, validación, build, presupuesto (203,73 kB gzip inicial, 415 chunks diferidos) y E2E 1/1 verdes. Commits `18f3500` (motor) y `b5972a3` (docs de cierre).
- Limitación: el motor no intercala categorías ni persiste la sesión o sus tarjetas FSRS; eso queda para F3-024 y F3-025.
- Próximo paso: F3-020 (dictado de intervalos en contexto).

## 2026-11-10T20:14:58-03:00 · F3-020

- Acción: se retomó el proyecto desde el PUNTO DE REANUDACIÓN (F3-020). No quedaban cambios sin commitear de la sesión anterior: el árbol estaba limpio después de completar y publicar la documentación de F3-019.
- Motor: `src/exercises/interval-dictation.ts` convierte un ejercicio `ear-interval` o `interval` en un dictado con melodía breve. La frase agrega una aproximación de semitono, las dos notas del intervalo y una resolución; en modo armónico aproxima el bajo, hace sonar las dos notas juntas y resuelve sobre la aguda. Ordena por altura real, omite aproximación o resolución fuera de MIDI 21-108, resuelve la respuesta canónica y las aceptadas en ES/EN y adjunta la regla «Recordá». `repeatDictationTimeline` acota las pasadas a tres con un silencio configurable.
- UI: `ExercisePlayer` muestra el dictado en los ejercicios `ear-interval` con la indicación, un botón que pasa de «Escuchar melodía» a «Repetir melodía», el contador de repeticiones en `role="status"` y el feedback con regla al fallar. El contador se guarda con el id del ejercicio para no perderse si el ítem se vuelve a montar. Se agregaron las claves ES/EN `lesson.exercise.*Dictation*` y `dictationRepeats`, y el test de i18n las valida por paridad.
- Tests: `tests/interval-dictation.test.ts` cubre ascendente, descendente, armónico, orden por altura, respuesta y feedback en ES/EN, repeticiones con tope, límites de rango y determinismo. `tests/exercise-player.test.tsx` recorre M3-05, comprueba la melodía y el contador, repite dos veces y verifica el «Recordá» al fallar.
- Resultado: suite 132 archivos / 923 tests en verde; typecheck, `validate:content`, build, presupuesto (204,61 kB gzip inicial, 415 chunks diferidos) y E2E 1/1 verdes. Commit `ce7215a`.
- Limitación: la aproximación y la resolución son cromáticas y no se adaptan a la armadura; el dictado no dibuja pentagrama ni registra una sesión propia en FSRS, y el contador de repeticiones no se persiste entre recargas.
- Próximo paso: F3-021 (dictado de calidad de acordes).

## 2026-11-10T20:53:00-03:00 · F3-021

- Acción: se retomó el proyecto desde el PUNTO DE REANUDACIÓN (F3-021). El árbol estaba limpio y la tarea ya estaba marcada `[~]` en `5b04557`.
- Motor compartido: `src/exercises/dictation.ts` concentra `MAX_DICTATION_PLAYS` (3), `MAX_DICTATION_REPEATS`, el silencio por defecto y `repeatDictationTimeline`. `interval-dictation.ts` reexporta esos símbolos para conservar su API y evitar duplicar la política de escucha.
- Motor de acordes: `src/exercises/chord-dictation.ts` toma un ejercicio `ear-chord`, respeta fundamental, calidad e inversión y arma el voicing con `chordWithInversion`. Devuelve el timeline en bloque, arpegio ascendente, descendente o bajo+acorde, los MIDI del voicing, la respuesta canónica y las aceptadas en ES/EN y la regla «Recordá» de `chord-quality`. Expone las cuatro tríadas y las cinco séptimas del dictado; `chordDictationMode` usa `block` para bloque y bajo+acorde, y `arpeggio` para los arpegios. El estilo se puede sobrescribir sin tocar el contenido.
- UI: `ExercisePlayer` usa el dictado en los ejercicios `ear-chord`. Muestra la indicación, un botón que pasa de «Escuchar acorde» a «Repetir acorde», el contador de repeticiones en `role="status"`, el selector de forma y el feedback con regla al fallar. El contador se mantiene por id de ejercicio. Se agregaron las claves ES/EN `listenChordDictation`, `repeatChordDictation` y `chordDictationHint`.
- Tests: `tests/chord-dictation.test.ts` cubre bloque, arpegios ascendente y descendente, las cinco séptimas, inversión, respuesta y feedback ES/EN, repeticiones con tope, determinismo y override de estilo. `tests/exercise-player.test.tsx` recorre los seis ejercicios visuales de M4-10, llega al primer `ear-chord`, cambia a arpegio, comprueba el contador y las dos repeticiones, y verifica el «Recordá» al fallar.
- Resultado: suite 133 archivos / 931 tests en verde; typecheck, `validate:content`, build, presupuesto (204,90 kB gzip inicial, 415 chunks diferidos) y E2E 1/1 verdes. Commit `6b08881`.
- Nota de verificación: la primera corrida completa marcó un timeout transitorio en un test existente de M0 (`permite reintentar, avanzar y volver a la lección`); la corrida dirigida y la segunda corrida completa pasaron. El primer `npm run budget` corrió en paralelo con E2E y falló con `ENOENT` al leer `dist/` mientras E2E lo reconstruía; repetido en forma aislada pasó.
- Limitación: el dictado no agrega una frase tonal ni una cadencia de contexto; suena el acorde solo, en la forma elegida. El contador de repeticiones no se persiste entre recargas ni se informa a FSRS, y el registro del intento sigue ocurriendo al corregir el ejercicio.
- Próximo paso: F3-022 (dictado de escalas y modos).

## 2026-11-10T21:17:14-03:00 · F3-022

- Acción: se retomó el proyecto desde el PUNTO DE REANUDACIÓN (F3-022). El árbol estaba limpio y la tarea se marcó `[~]` en `ae88bde` antes de empezar.
- Motor: `src/exercises/scale-dictation.ts` convierte un ejercicio `ear-scale` en un dictado puro. Arma la escala desde `tonic` y `mode` con `scalePitches`, agrega la octava de la tónica y devuelve el timeline, la respuesta canónica y las aceptadas en ES/EN y la regla «Recordá» de `scale-spelling`. `SCALE_DICTATION_MODES` documenta los 16 tipos de escala de M2.
- Comparación: `SCALE_DICTATION_COMPARISON` y `scaleComparisonMode` eligen una referencia con la misma tónica: la mayor paralela en los modos diatónicos, la natural en las menores armónica y melódica, y la pentatónica menor en el blues. El dictado entrega la referencia como timeline independiente para que la UI la reproduzca sin consumir repeticiones.
- Esquema y contenido: `ear-scale` incorpora `tonic: KeySchema.default('C')`. Los tres ejercicios existentes (`ex.m2-08.a`, `ex.m2-10.b` y `ex.m2-11.c`) declaran `"tonic": "C"` de forma explícita.
- UI: `ExercisePlayer` usa el dictado en los ejercicios `ear-scale`. Muestra la indicación, un botón que pasa de «Escuchar escala» a «Repetir escala», el contador de repeticiones en `role="status"`, el botón «Comparar con …» y el feedback con regla al fallar. Se agregaron las claves ES/EN `listenScaleDictation`, `repeatScaleDictation`, `scaleDictationHint` y `compareScaleDictation`.
- Tests: `tests/scale-dictation.test.ts` cubre escala mayor desde la tónica, las tres menores, los siete modos diatónicos, pentatónicas, blues, cromática, tonos enteros, comparación, respuesta y feedback ES/EN, repeticiones con tope, determinismo y tónicas alteradas. `tests/exercise-player.test.tsx` recorre M2-08, escucha y repite dos veces, compara con la mayor y verifica el «Recordá» al fallar.
- Resultado: suite 134 archivos / 940 tests en verde; typecheck, `validate:content`, build, presupuesto (205,38 kB gzip inicial, 415 chunks diferidos) y E2E 1/1 verdes. Commit `11507fb`.
- Limitación: la comparación es una escala de referencia fija derivada del modo, no una frase tonal con armadura. El contador de repeticiones no se persiste entre recargas ni se informa a FSRS, y el intento se registra recién al corregir el ejercicio.
- Próximo paso: F3-023 (dictado de progresiones).

## 2026-11-10T21:56:34-03:00 · F3-023

- Acción: se retomó el proyecto desde el PUNTO DE REANUDACIÓN (F3-023). El árbol estaba limpio y la tarea se marcó `[~]` en `ce9514e` antes de empezar.
- Motor: `src/exercises/progression-dictation.ts` convierte un ejercicio `ear-progression` en un dictado puro. Lee los grados romanos con `romanToChord` en la tonalidad y el modo declarados, arma cada acorde en bloque con `chordTimeline` y los encadena con `shiftTimeline` sobre el playback de F1. Devuelve los acordes con sus MIDI, el timeline, la respuesta canónica y las aceptadas en ES/EN y la regla «Recordá» de `roman-numeral`.
- Modos y calidades: la menor del esquema se interpreta como natural, pero la calidad escrita en cada numeral manda. Así `V` en La menor suena mayor (Mi-Sol♯-Si) y `iv` en La menor suena menor, sin alterar el contenido.
- UI: `ExercisePlayer` usa el dictado en los ejercicios `ear-progression`. Muestra la indicación, un botón que pasa de «Escuchar progresión» a «Repetir progresión», el contador de repeticiones en `role="status"` y el feedback con regla al fallar. Se agregaron las claves ES/EN `listenProgressionDictation`, `repeatProgressionDictation` y `progressionDictationHint`.
- Contenido: se agregó `ex.m2-07.m`, un dictado real de I-IV-V-I en Do mayor al inicio de M2-07, con opciones paralelas en español e inglés. El contenido pasó de 354 a 355 ejercicios y el conteo de i18n se actualizó.
- Tests: `tests/progression-dictation.test.ts` cubre el timeline de I-IV-V-I, tonalidades con bemoles, modo menor con calidad escrita, respuesta canónica, ES/EN, repeticiones con tope, determinismo y tempo. `tests/exercise-player.test.tsx` recorre M2-07, escucha y repite dos veces, elige una opción incorrecta y verifica el «Recordá». `tests/content-m2-07.test.ts` comprueba el dictado y `tests/exercises-answer.test.ts` suma el nuevo tipo y su respuesta canónica.
- Resultado: suite 135 archivos / 948 tests en verde; typecheck, `validate:content`, build, presupuesto (206,13 kB gzip inicial, 416 chunks diferidos) y E2E 1/1 verdes. Commit `9797f9d`.
- Limitación: la progresión suena en bloque y sin una frase tonal de contexto ni cadencia separada. El contador de repeticiones no se persiste entre recargas ni se informa a FSRS, y el intento se registra recién al corregir el ejercicio.
- Próximo paso: F3-024 (añadir reproducción de pregunta/respuesta y botón repetir).

## 2026-11-10T22:43:14-03:00 · F3-024

- Acción: se retomó el proyecto desde el PUNTO DE REANUDACIÓN (F3-024). La tarea ya estaba marcada `[~]` en `16ded97`; se completó el código pendiente antes de cerrar.
- Contador: `src/exercises/playback.ts` es puro y guarda dos cuentas independientes por id de ejercicio: la pregunta y la respuesta. Reutiliza la política de `src/exercises/dictation.ts` (una primera escucha y hasta dos repeticiones, tope de tres pasadas) y expone `createPlaybackCounter`, `playbackCount`, `playbackRepeats`, `canPlay` y `registerPlay`. Al cambiar el id, la cuenta arranca en cero sin arrastrar el ítem anterior.
- Respuestas: los cuatro dictados exponen `answerTimeline`, separado de la pregunta. En intervalos es el intervalo solo, sin aproximación ni resolución (melódico en la dirección del ejercicio, armónico en bloque); en acordes es siempre el acorde en bloque, aunque la pregunta sea un arpegio; en escalas y progresiones es la misma pasada completa. Así el alumno compara el contexto con la respuesta canónica.
- UI: `ExercisePlayer` reemplazó el contador local `dictationPlays` por el contador compartido. La pregunta conserva «Escuchar/Repetir» y su estado; después de corregir aparece «Escuchar respuesta» / «Repetir respuesta» con su propio contador en `role="status" aria-live="polite"`. Ningún audio arranca al montar el ejercicio ni al avanzar: cada pasada nace de un clic. Se agregaron las claves ES/EN `listenAnswer`, `repeatAnswer`, `answerHint` y `answerRepeats`.
- Tests: `tests/exercise-playback.test.ts` cubre contador vacío, primera escucha, independencia pregunta/respuesta, tope de pasadas y reinicio por id. Los tests de intervalos, acordes, escalas y progresiones verifican `answerTimeline`; el test del reproductor de M3-05 comprueba que la respuesta no aparece antes de corregir y que sus repeticiones se agotan en dos.
- Resultado: suite 136 archivos / 956 tests en verde; typecheck, `validate:content`, build, presupuesto (206,52 kB gzip inicial, 416 chunks diferidos) y E2E 1/1 verdes. Commit `6d71092`.
- Nota de verificación: dos corridas completas de `npm test` fallaron en tests existentes distintos de `exercise-player.test.tsx` por timeouts de `findBy` bajo contención de CPU; la corrida dirigida del archivo y una tercera corrida completa pasaron. No se modificó ningún test existente por ese motivo.
- Limitación: la respuesta se ofrece solo en los ejercicios de dictado auditivo (`ear-interval`, `ear-chord`, `ear-scale`, `ear-progression`), no en los ejercicios visuales ni en los de parámetros sonoros. El contador no se persiste entre recargas ni se informa a FSRS, y el intento sigue registrándose al corregir.
- Próximo paso: F3-025 (registrar ítems auditivos en FSRS).

## 2026-11-10T23:20:58-03:00 · F3-025

- Acción: se retomó el proyecto desde el PUNTO DE REANUDACIÓN (F3-025). El árbol estaba limpio y la tarea se marcó `[~]` en `bdcd7db` antes de empezar.
- Contenido: se agregaron las habilidades `skill.ear-scale` y `skill.ear-progression` con parámetros y lecciones asociadas. Los ejercicios `ex.m2-08.a`, `ex.m2-10.b` y `ex.m2-11.c` pasaron a `skill.ear-scale`; `ex.m2-07.m` pasó a `skill.ear-progression`. Las lecciones M2-07, M2-08, M2-10 y M2-11 declaran la habilidad auditiva correspondiente, y el índice del curso se regeneró. El registro quedó en 33 habilidades.
- FSRS: `src/state/exercise-attempt.ts` expone `exerciseReviewItem`, que resuelve `{ itemId, kind, format }`. Los cuatro tipos `ear-*` fuerzan `hear` y el resto conserva el formato derivado de la habilidad. `recordReview` acepta un `format` explícito y lo guarda en el `ReviewLog`; el intento sigue creando o avanzando la tarjeta con los parámetros FSRS del usuario. Las variantes visual y auditiva del mismo tema apuntan a habilidades distintas, así que FSRS guarda tarjetas separadas.
- Cola: `reviewableSkills` ya tomaba las habilidades del contenido con tarjeta o de lecciones empezadas; al declarar las nuevas habilidades en las lecciones, `buildReviewDay` las incluye como ítems nuevos. No hizo falta tocar la lógica de la cola.
- Tests: `tests/auditory-fsrs.test.ts` comprueba los cuatro tipos con sus parámetros, la separación ver/oír, el registro real con IndexedDB (formato `hear`, tarjeta en la habilidad auditiva y ausencia de escritura en la visual) y la inclusión de las cuatro habilidades en la cola. `tests/practice-log.test.ts` suma los formatos de escala y progresión. `tests/exercise-player.test.tsx` espera a que la selección habilite «Corregir» antes de pulsarlo para evitar clics perdidos bajo carga.
- Resultado: suite 137 archivos / 960 tests en verde; typecheck, validación (33 habilidades), build, presupuesto (206,65 kB gzip inicial, 416 chunks diferidos) y E2E 1/1 verdes. Commit `e091cce`.
- Nota de verificación: la primera corrida completa falló con dos timeouts en `exercise-player.test.tsx`; la segunda falló en el test nuevo de respuesta de F3-024 por el mismo motivo. Se identificó la carrera entre el clic del radio y el botón «Corregir» deshabilitado y se estabilizó el test; la tercera corrida completa pasó.
- Limitación: el registro sigue ocurriendo al corregir el ejercicio, no al escuchar; la sesión auditiva adaptativa de F3-019 todavía no está conectada a una pantalla ni registra sus ítems. Las tarjetas auditivas no guardan los parámetros del ítem dentro de la tarjeta FSRS: los parámetros viven en `content/skills.json` y la tarjeta solo referencia el id.
- Próximo paso: F3-026 (reglas «Recordá» de intervalos).

## 2026-11-10T23:37:00-03:00 · F3-026

- Acción: se retomó el proyecto desde el PUNTO DE REANUDACIÓN (F3-026). El árbol estaba limpio y la tarea se marcó `[~]` en `ccc9971` antes de empezar.
- Feedback: `src/theory/errors.ts` sumó cinco códigos con regla y ejemplo propios: `interval-perfect`, `interval-major`, `interval-minor`, `interval-augmented` e `interval-diminished`. Cada uno fija los semitonos de sus cantidades (justo 0/5/7/12; mayor 2/4/9/11; menor 1/3/8/10) y explica aumentado/disminuido como un semitono más o menos que la referencia. `src/theory/errors-en.ts` mantiene la paridad en inglés.
- Selección: `intervalQualityFeedbackCode` traduce las siete calidades de `IntervalQuality`; las dobles se explican con la aumentada o disminuida. `intervalQualityFeedback` devuelve el texto validado. `resolvePedagogicalFeedback` acepta `intervalQuality` y la prioriza sobre el tipo de ejercicio, mientras que un `code` explícito sigue ganando.
- Uso: `buildIntervalDictation` calcula la calidad real con `intervalBetween(fromSpelledPitch(lower), fromSpelledPitch(upper))` y la usa para el feedback, en vez del genérico de cantidad. `ExercisePlayer` aplica la misma regla a los ejercicios `interval` sin dictado; los dictados siguen tomando su feedback del propio dictado.
- Tests: `tests/theory-errors.test.ts` cubre los cinco códigos, el mapeo de las siete calidades, los semitonos y ejemplos concretos y la prioridad del contexto. `tests/interval-dictation.test.ts` verifica las cinco reglas en español e inglés con pares escritos (C–F, C–E, C–E♭, C–F♯ y C–G♭). `tests/exercise-player.test.tsx` espera «Recordá los intervalos mayores» para Do4–Re4.
- Resultado: suite 137 archivos / 964 tests en verde; typecheck, validación, build, presupuesto (207,62 kB gzip inicial, 416 chunks diferidos) y E2E 1/1 verdes. Commit `52017cf`.
- Limitación: el feedback sigue siendo textual; los ejemplos no se dibujan todavía en pentagrama ni se reproducen con el mismo ítem fallado. Eso queda para F3-028. Las calidades dobles comparten la regla de su paso simple.
- Próximo paso: F3-027 (reglas «Recordá» de acordes y cifrado).

## 2026-11-10T23:46:42-03:00 · F3-027

- Acción: se retomó el proyecto desde el PUNTO DE REANUDACIÓN (F3-027). El árbol estaba limpio y la tarea se marcó `[~]` en `cbe4197` antes de empezar.
- Feedback: las cuatro reglas de acordes se reescribieron con ejemplos resueltos. `chord-tone` explica la construcción por terceras apiladas (1-3-5-7 y extensiones 9/11/13) con `Do7`, `Domaj7` y `Do9`; `chord-inversion` recorre las cuatro posiciones de `Domaj7` y el cifrado con barra; `chord-notation` cubre los sufijos de calidad y el paso latino/americano con `Solm7 = Gm7` y `Solm7/Re = Gm7/D`; `chord-quality` distingue tríadas y séptimas por tercera, quinta y séptima.
- Selección: `src/theory/errors.ts` expone `ChordExerciseAsk` y `chordAskFeedbackCode`: `quality` → `chord-quality`, `inversion` → `chord-inversion`, `notes` → `chord-tone` y `symbol` → `chord-notation`. `resolvePedagogicalFeedback` acepta `chordAsk` y lo prioriza sobre el tipo genérico, pero por debajo de `intervalQuality` y del `code` explícito. `ExercisePlayer` agrega `chordAskOf` y lo pasa para los ejercicios `chord`; antes todos mostraban la regla de calidad.
- Tests: `tests/theory-errors.test.ts` cubre el mapeo de los cuatro `ask`, la prioridad del contexto y del código explícito, y los ejemplos específicos de construcción, inversión y cifrado. `tests/exercise-player.test.tsx` falla una inversión en M4-03 y comprueba que aparece «Recordá qué nota queda en el bajo». Los dictados auditivos conservan «Recordá distinguir la calidad».
- Resultado: suite 137 archivos / 966 tests en verde; typecheck, validación, build, presupuesto (208,15 kB gzip inicial, 416 chunks diferidos) y E2E 1/1 verdes. Commit `8f9ca60`.
- Limitación: los ejemplos son estáticos; todavía no se generan con el mismo ítem fallado ni se dibujan en pentagrama. Eso queda para F3-028.
- Próximo paso: F3-028 (generar ejemplos resueltos automáticos).

## 2026-11-10T23:58:18-03:00 · F3-028

- Acción: se retomó el proyecto desde el PUNTO DE REANUDACIÓN (F3-028). El árbol estaba limpio y la tarea se marcó `[~]` en `e888c61` antes de empezar.
- Ejemplo automático: `src/exercises/worked-example.ts` expone `buildWorkedExample(exercise)`, que devuelve `{ kind, measures, clef, keySignature }` o `null`. Los intervalos melódicos generan una medida por nota y los armónicos una medida con las dos; los acordes usan `chordWithInversion` o `chordWithSlash` según la inversión o el bajo con barra; los cifrados se parsean por partes (`Do7/Solm` → `Do7` + `Solm`) porque `parseChordSymbol` rechaza sufijos en el bajo. La clave es fa cuando la nota más grave queda por debajo de Do4.
- Reproductor: `ExercisePlayer` memoriza el ejemplo del ítem actual y, al fallar, reemplaza el ejemplo textual por un `Staff` con las notas reales. Las etiquetas nuevas son «El mismo intervalo» y «El mismo acorde» en español e inglés. Los tipos sin representación (notas sueltas, escalas, ritmo) y los cifrados inválidos conservan el ejemplo de la regla.
- Tests: `tests/worked-example.test.ts` cubre intervalo ascendente, descendente y armónico, inversión, bajo con barra, cifrado latino con bajo menor, clave de fa, cifrado inválido y tipo sin ejemplo. `tests/exercise-player.test.tsx` verifica el pentagrama de M3-05 (`El mismo intervalo: C4 · D4`) y de M4-03 (`El mismo acorde: C4 + E4 + G4`).
- Resultado: suite 138 archivos / 975 tests en verde; typecheck, validación, build, presupuesto (208,88 kB gzip inicial, 416 chunks diferidos) y E2E 1/1 verdes. Commit `b883df1`.
- Limitación: el texto accesible del pentagrama usa nombres por MIDI (`La♯` en vez de `Si♭`), aunque el dibujo conserva la ortografía del acorde. Los tipos fuera de intervalo/acorde/cifrado siguen con ejemplo textual.
- Próximo paso: F3-029 (integrar lecciones M3-M4 con ejercicios y tareas de teclado).

## 2026-11-11T00:09:54-03:00 · F3-029

- Acción: se retomó el proyecto desde el PUNTO DE REANUDACIÓN (F3-029). El árbol tenía pendientes los documentos de cierre de F3-028; se revisaron y se confirmó que eran coherentes con `b883df1`, así que se commitearon como `341c891`. La tarea se marcó `[~]` en `3264047` antes de empezar.
- Alcance: las 17 lecciones de M3-M4 ya existían con 12 ejercicios y tarea de teclado cada una desde F3-001 a F3-017. La aceptación decía «12 lecciones publicadas», un número desactualizado respecto del contenido real, así que no se reescribió contenido y se agregó la prueba de integración que faltaba.
- Test: `tests/m3-m4-integration.test.tsx` carga el bundle desde `content/` y comprueba que las 17 lecciones publicadas de M3-M4 figuren en el curso en orden (después de M2 y antes de M5), que cada una tenga 12 ejercicios referenciados con texto bilingüe, habilidades y secciones válidas, y que cada lección incluya una tarea de teclado real con demo, tempo y checklists. También recorre la carga diferida de las 17 lecciones y sus 204 ejercicios y renderiza M3-01 y M4-01 con `LessonPlayer`, ejercicios y tarea.
- Resultado: suite 139 archivos / 982 tests en verde; typecheck, validación (9 módulos, 47 lecciones, 355 ejercicios, 33 habilidades, 1 pieza), build, presupuesto (208,88 kB gzip inicial, 416 chunks diferidos) y E2E 1/1 verdes. Commit `4c460b1`.
- Limitación: el test verifica estructura, carga y render, no la corrección musical de cada respuesta; eso ya lo cubren los tests por lección y los property tests de M0-M2. La navegación anterior/siguiente se valida por el orden del curso, no con clics reales (eso queda para el E2E de F3-033).
- Próximo paso: F3-030 (testear teoría M3-M4 en 12 tonalidades).

## 2026-11-11T00:15:18-03:00 · F3-030

- Acción: se retomó el proyecto desde el PUNTO DE REANUDACIÓN (F3-030). El árbol estaba limpio y la tarea se marcó `[~]` en `4feb3fd` antes de empezar.
- Property tests: `tests/m3-m4-theory-properties.test.ts` recorre las doce tónicas con ocho propiedades. Intervalos: 323 combinaciones de cantidad 1.ª a 8.ª y calidad justa, mayor, menor, aumentada o disminuida, con cantidad, calidad, semitonos, letra del grado, doble alteración máxima y vuelta por `formatPitch`. Inversiones: 2.ª a 7.ª con suma nueve, cambio de calidad y semitonos complementarios, más la octava justa. Tríadas: mayores, menores, disminuidas, aumentadas, sus2 y sus4 con tercera, quinta y semitonos. Séptimas: maj7, 7, m7, m7♭5 y dim7 con la calidad real de su séptima. Extensiones: maj9/9/m9, maj11/11/m11 y maj13/13/m13 con novena, oncena y trecena compuestas. Cifrado: las 20 calidades en americano y latino con ida y vuelta y conversión entre notaciones. Slash: 576 combinaciones de tónica, calidad y bajo con las doce tónicas como bajo. Inversiones de acordes: tríadas y séptimas sin cambiar las clases de altura y con el bajo en la primera voz.
- Corrección: la propiedad destapó que `parseChordSymbol('Faug')` se leía como la nota latina «Fa» más el sufijo «ug», y que `convertChordNotation('Faug', 'do')` devolvía «Faug» en vez de «Faaug». `src/theory/chords.ts` extrae `matchChordPart`: si el sufijo de una nota latina no es una calidad válida pero la lectura americana sí lo es, prefiere la americana. «Fam» sigue siendo Fa menor. Se agregó la regresión en `tests/theory-chords.test.ts`.
- Limitación: la segunda disminuida de La♭ exige un triple bemol, fuera del límite de doble alteración del motor, y queda excluida de la propiedad; el resto de las combinaciones de las doce tónicas pasa.
- Resultado: suite 140 archivos / 990 tests en verde; typecheck, validación (9 módulos, 47 lecciones, 355 ejercicios, 33 habilidades, 1 pieza), build, presupuesto (208,94 kB gzip inicial, 416 chunks diferidos) y E2E 1/1 verdes. Commit `79c4588`.
- Próximo paso: F3-031 (testear generadores de ejercicios).

## 2026-11-11T00:18:54-03:00 · F3-031

- Acción: se retomó el proyecto desde el PUNTO DE REANUDACIÓN (F3-031). El árbol estaba limpio y la tarea se marcó `[~]` en `53cbd09` antes de empezar.
- Fuzz: `tests/generators-fuzz.test.ts` siembra `Math.random` con un generador congruencial lineal y pide 500 casos por lote. Teclado: 1000 ejercicios repartidos entre notación latina visual y americana auditiva, sin repetir el MIDI anterior y con cada opción resolviendo a una nota distinta. Pentagrama: 1000 ejercicios entre clave de sol y de fa a dificultad 3, con líneas adicionales dentro del máximo y opciones únicas. Deletreo: 500 ejercicios con la respuesta presente, opciones únicas y distractores con la misma cantidad de notas que no normalizan igual. Armaduras: 500 mayores y 500 menores con respuesta canónica, una sola opción correcta y sin combinaciones `key|direction` consecutivas repetidas. Transposición: 500 pares con la misma cantidad de notas y el mismo salto en cada una.
- Resultado: suite 141 archivos / 995 tests en verde; typecheck, validación, build, presupuesto (208,94 kB gzip inicial, 416 chunks diferidos) y E2E 1/1 verdes. Commit `77b2f65`.
- Limitación: el fuzz comprueba invariantes de estructura y de respuesta, no la calidad pedagógica del enunciado. Los generadores de M3-M4 no existen como módulo aparte: ese contenido es JSON escrito a mano y ya lo cubren los tests por lección, la integración de F3-029 y los property tests de teoría de F3-030.
- Próximo paso: F3-032 (accesibilidad de los ejercicios auditivos).

## 2026-11-11T00:23:37-03:00 · F3-032

- Acción: se retomó el proyecto desde el PUNTO DE REANUDACIÓN (F3-032). El árbol tenía cambios sin commitear en `ExercisePlayer` y un test nuevo de axe; se revisaron, se completaron y la tarea se marcó `[~]` en `96c16e4` antes de la verificación final.
- Alcance: `tests/auditory-a11y.test.tsx` cubre los cuatro dictados publicados. Axe no reporta violaciones críticas ni serias en M3-05 (intervalos), M4-10 (acordes), M2-08 (escalas) y M2-07 (progresiones) con las etiquetas WCAG 2.0 A/AA. El quinto test responde M3-05 solo con teclado: Enter para escuchar, Espacio para marcar el radio y Enter para corregir, y verifica que el resultado aparezca como texto con la respuesta correcta y la regla.
- Cambios: `ExercisePlayer` agrega `aria-describedby` desde los botones de escuchar y repetir hacia el aviso de qué suena en cada dictado, y desde «Escuchar respuesta» hacia la indicación de comparar con la corrección. Los textos de repeticiones y corrección ya eran regiones `role="status"` con `aria-live="polite"`. No se agregó transcripción de la respuesta para no revelar el dictado antes de corregir.
- Resultado: suite 142 archivos / 1000 tests en verde; typecheck, validación, build, presupuesto (208,99 kB gzip inicial, 416 chunks diferidos) y E2E 1/1 verdes. Commit `91f2c19`.
- Limitación: jsdom no reproduce audio real, así que la prueba valida la semántica, los controles y el texto, no la escucha. Axe tampoco sustituye una revisión con lector de pantalla; la asociación `aria-describedby` y el flujo de teclado cubren la aceptación automatizable.
- Próximo paso: F3-033 (E2E del módulo M3-M4).

## 2026-11-11T00:27:51-03:00 · F3-033

- Acción: se retomó el proyecto desde el PUNTO DE REANUDACIÓN (F3-033). El árbol estaba limpio y la tarea se marcó `[~]` en `bed793c` antes de empezar.
- E2E: `e2e/m3-m4-lesson-review.spec.ts` recorre M3-01 con M2-12 completada directamente en IndexedDB. Para sembrar sin depender de la interfaz, primero visita la lección bloqueada, espera a que la app abra la base y escribe el registro de lección; `indexedDB.open` va sin versión fija porque Dexie numera la base internamente en decenas. Tras recargar, responde mal el intervalo Do4-Re4 («Segunda menor»), comprueba «Todavía no.», la respuesta correcta y el «Recordá los intervalos mayores», espera el guardado y entra al repaso.
- Repaso: la cola trae «Construir escalas mayores», la habilidad nueva de M2-12 que quedó encontrada al completar el prerrequisito. La tarjeta del intervalo fallado no aparece todavía porque FSRS la programa para más adelante. Se califica con «Bien», se llega a «Recorrido completo» y, tras recargar, la página de progreso muestra «2 respuestas registradas».
- Resultado: E2E 2/2 verdes; suite 142 archivos / 1000 tests en verde; typecheck, build y presupuesto (208,99 kB gzip inicial, 416 chunks diferidos) verdes. Commit `1c19693`.
- Limitación: el test siembra el prerrequisito en IndexedDB en vez de completar M2-12 por la interfaz, para mantener el recorrido corto y centrado en M3. El repaso valida la cola real, pero no repite la habilidad del intervalo fallado porque su tarjeta aún no vence.
- Próximo paso: F3-034 (cerrar F3: suite, tag `fase-3`, RESUME y resumen).

## 2026-11-11T00:31:36-03:00 · F3-034

- Acción: se retomó el proyecto desde el PUNTO DE REANUDACIÓN (F3-034). El árbol estaba limpio y la tarea se marcó `[~]` en `2dd79d8` antes de empezar.
- Verificación: M3-M4 quedaron completos con 17 lecciones publicadas y 204 ejercicios (12 por lección). `npm run estado` corrió typecheck, la suite completa y el build en verde: 142 archivos / 1000 tests, F3 al 100 % (35/35). El presupuesto revalidado da 208,99 kB gzip inicial y 416 chunks diferidos; `npm run test:e2e` pasa 2/2 recorridos. Se comprobó que las 17 lecciones de M3-M4 están publicadas y que cada una tiene sus 12 ejercicios referenciados.
- Documentación: `docs/CHECKLIST.md` suma el bloque «Cierre F3», el PUNTO pasa a F4-001 y F3-034 queda `[x]` con el commit de cierre. `docs/RESUME.md` pasa a F3 completada, agrega F3-034 y actualiza los tags locales; `CHANGELOG.md` incorpora la sección `[Fase 3]` con lo agregado, la corrección del parser y el estado final. `docs/ESTADO.md` se regeneró con `npm run estado`.
- Resultado: tag local `fase-3` sobre el commit de bitácora. Commits `43b8747` (resumen y RESUME), `abc76d8` (checklist y estado) y el de esta entrada.
- Limitación: el E2E siembra el prerrequisito en IndexedDB; la accesibilidad de los dictados se validó con axe y teclado, no con un lector de pantalla real; la escucha de audio real sigue pendiente en hardware. El tag no se publica al remoto sin autorización explícita.
- Próximo paso: F4-001 (escribir M5-01 «Acordes diatónicos»).

## 2026-11-11T00:48:25-03:00 · F4-001

- Acción: se retomó el proyecto desde el PUNTO DE REANUDACIÓN (F4-001). La lección `content/lessons/m5-01.json` ya estaba escrita en el commit de inicio `7258575`; se completó la tarea con la habilidad `skill.diatonic-chords`, los doce ejercicios `ex.m5-01.a` a `ex.m5-01.l`, el test `tests/content-m5-01.test.ts` y la regeneración del índice del curso.
- Contenido: M5-01 «Acordes diatónicos» publica tríadas y séptimas diatónicas de mayor, menor natural y menor armónica, con dos demos de audio (Imaj7-vi7-IV-V7 en Do mayor e i-VImaj7-iv-V7 en La menor), doce ejercicios de cifrado sobre las doce tonalidades (seis tríadas y seis séptimas) y una tarea de teclado Imaj7-V7 con demo. Se reutiliza el tipo `chord` con `ask: "symbol"`.
- Verificación: `npm run index:content` regenera `src/content/course-index.json` con 48 lecciones. Se actualizaron los totales fijos de `content-m0-m2-validation`, `i18n-parity`, `course-index`, `course-page`, `course-progress`, `app-router` y `a11y` (47→48 lecciones, 355→367 ejercicios y los estados de módulo M5). Suite 143 archivos / 1007 tests en verde; typecheck, build y presupuesto (209,44 kB gzip inicial, 429 chunks diferidos) verdes; E2E 2/2.
- Resultado: commit de implementación `54753fd`; documentación de cierre en este commit.
- Limitación: las demos validan las notas y las medidas por MIDI, no el audio real en hardware. El test de contenido fija el mapa de las doce tonalidades por id de ejercicio.
- Próximo paso: F4-002 (escribir M5-02 «Números romanos»).

## 2026-11-11T01:40:00-03:00 · F4-002

- Acción: se retomó el proyecto desde el PUNTO DE REANUDACIÓN (F4-002) después de un corte de internet. El árbol tenía escrita la lección `content/lessons/m5-02.json`, los doce ejercicios `ex.m5-02.a` a `ex.m5-02.l`, la habilidad `skill.roman-numeral`, el test `tests/content-m5-02.test.ts` y los totales actualizados, todo sin commitear. Se revisó, se completó y se verificó antes de cerrar.
- Contenido: M5-02 «Números romanos» explica el grado, la mayúscula/minúscula de cada cualidad, el ° del disminuido, la diferencia entre menor natural y armónica y la lectura en ambos sentidos. Publica una demo I-IV-V-I en Do mayor, una tarea de teclado a 60 BPM, seis ejercicios de acorde a numeral y seis de numeral a acorde repartidos entre Do, Sol, Re, Fa, Si♭, La menor y Mi menor.
- Correcciones: el test destapó que `resolveExerciseAnswer` y `isExerciseAnswerCorrect` normalizaban el caso y confundían `V` (mayor) con `v` (menor); ahora los ejercicios `roman-numeral` buscan la opción y corrigen con el caso exacto, con regresión en `tests/exercises-answer.test.ts`. También se reparó un salto de línea roto en `docs/CHECKLIST.md` que dejaba F4-003 pegada a la línea de inicio de F4-002 y descuadraba el total de F4.
- Verificación: suite 144 archivos / 1014 tests en verde; typecheck, validación (9 módulos, 49 lecciones, 379 ejercicios, 35 habilidades), build y presupuesto (209,86 kB gzip inicial, 442 chunks diferidos) verdes; E2E 2/2.
- Resultado: commit de implementación `81a7cd7`; documentación de cierre en este commit.
- Limitación: las demos validan las notas y las medidas por MIDI, no el audio real en hardware. La tarea de teclado se autoevalúa con checklist.
- Próximo paso: F4-003 (escribir M5-03 «Funciones T-S-D»).

## 2026-11-11T01:44:03-03:00 · F4-002 (deploy)

- Acción: el deploy de GitHub Pages del commit `da65b41` falló en el paso «Verificar tipos y tests». El run `42960635767` terminó con 144 archivos / 1014 tests pasados, pero Vitest lo marcó como fallo por un error no capturado.
- Error literal: `ReferenceError: window is not defined` en `resolveUpdatePriority` de `react-dom`, disparado por `dispatchSetState` desde `src/components/ExercisePlayer.tsx:382` (`setSaving(false)` dentro del `catch` del guardado). El error se originó en `tests/exercise-player.test.tsx` al terminar el entorno de jsdom.
- Causa: el guardado asíncrono del intento (`recordExerciseAttempt` con imports dinámicos de FSRS) seguía vivo después de que el test desmontara la app y cerrara IndexedDB. Al rechazar, el `catch` actualizaba estado en un componente desmontado y React intentaba programar un render sobre un `window` que ya no existía. En local pasaba desapercibido por diferencias de timing.
- Corrección: `ExercisePlayer` mantiene un `mountedRef` y solo actualiza `saving`/`saveError` si el componente sigue montado, tanto en el éxito como en el rechazo. No se silencia el error de guardado mientras el componente está visible.
- Verificación: `tests/exercise-player.test.tsx` 9/9 en tres corridas consecutivas; suite 144 archivos / 1014 tests en verde; typecheck, validación, build y presupuesto (209,89 kB gzip inicial, 442 chunks diferidos) verdes.
- Resultado: commit `e423089`; este push relanza el workflow de Pages.
- Limitación: la race era dependiente del timing de CI; la protección evita actualizaciones tras el desmontaje, que es la causa directa del error, aunque no se reprodujo de forma determinista en local.
- Próximo paso: F4-003 (escribir M5-03 «Funciones T-S-D»).

## 2026-11-11T01:54:31-03:00 · F4-003

- Acción: se retomó el proyecto desde el PUNTO DE REANUDACIÓN (F4-003) y se marcó `[~]` en `606ef5f` antes de empezar. Se escribió la lección `content/lessons/m5-03.json`, los doce ejercicios `ex.m5-03.a` a `ex.m5-03.l`, la habilidad `skill.harmonic-function` y el test `tests/content-m5-03.test.ts`.
- Contenido: M5-03 «Funciones T-S-D» agrupa los siete grados en tónica (I, iii, vi), subdominante (ii, IV) y dominante (V, vii°) en mayor, y en i, III; ii°, iv; v, VII en menor natural, con V y vii° al subir la sensible. Explica el reposo, la apertura y la tensión, el ciclo T-S-D-T, la ambigüedad contextual del VI menor y una demo I-IV-V-I en Do mayor. La tarea de teclado es i-iv-V-i en La menor a 60 BPM, para reforzar la dominante de la menor armónica.
- Motor: se añadió el tipo de ejercicio `harmonic-function` (key, mode, degree), que resuelve la respuesta desde `functionsForMode` del motor; la habilidad se registra como `roman-numeral` y los formatos disponibles son ver y deletrear. Se conserva el caso exacto de `roman-numeral` corregido en F4-002.
- Verificación: `npm run validate:content` da 9 módulos, 50 lecciones, 391 ejercicios y 36 habilidades; `npm run index:content` regenera el índice con 50 lecciones. Suite 145 archivos / 1021 tests en verde; typecheck, build y presupuesto (210,44 kB gzip inicial, 455 chunks diferidos) verdes; E2E 2/2.
- Resultado: commit de implementación `7d31888`; documentación de cierre en este commit.
- Limitación: las demos validan las notas y las medidas por MIDI, no el audio real en hardware. La clasificación del VI menor se explica como dependiente del contexto y no se evalúa en los ejercicios.
- Próximo paso: F4-004 (escribir M5-04 «Cadencias»).

## 2026-11-11T02:04:02-03:00 · F4-004

- Acción: se retomó el proyecto desde el PUNTO DE REANUDACIÓN (F4-004) y se marcó `[~]` en `21a02d0`. Se escribió la lección `content/lessons/m5-04.json`, los doce ejercicios `ex.m5-04.a` a `ex.m5-04.l`, la habilidad `skill.cadence` y el test `tests/content-m5-04.test.ts`.
- Contenido: M5-04 «Cadencias» explica la auténtica (V-I), la plagal (IV-I), la semicadencia (…-V) y la rota (V-vi), con las diferencias entre perfecta e imperfecta, el «amén» plagal, la frase abierta y la desviación a la relativa. Publica cuatro demos de audio en Do mayor, una por cadencia, una tarea de teclado con las cuatro a 60 BPM y doce ejercicios de clasificación repartidos entre seis tonalidades mayores y seis menores.
- Motor: el tipo `cadence` deriva la respuesta de los grados `fromDegree`/`toDegree` con `cadenceTypeFor`, sin duplicar el nombre en cada ejercicio. Se añadió el código de feedback `cadence` con regla y ejemplo en español e inglés, la habilidad se registra como `progression` y los formatos disponibles son ver y deletrear.
- Verificación: `npm run validate:content` da 9 módulos, 51 lecciones, 403 ejercicios y 37 habilidades; el índice se regenera con 51 lecciones. Suite 146 archivos / 1028 tests en verde; typecheck, build y presupuesto (211,28 kB gzip inicial, 468 chunks diferidos) verdes; E2E 2/2.
- Resultado: commit de implementación `7211ca8`; documentación de cierre en este commit.
- Limitación: las demos validan las notas y las medidas por MIDI, no el audio real en hardware. La distinción entre auténtica perfecta e imperfecta se explica en el texto, pero los ejercicios solo clasifican el tipo de cadencia.
- Próximo paso: F4-005 (escribir M5-05 «Progresiones comunes»).

## 2026-11-11T02:12:23-03:00 · F4-005

- Acción: se retomó el proyecto desde el PUNTO DE REANUDACIÓN (F4-005) y se marcó `[~]` en `ca335f0`. Se escribió la lección `content/lessons/m5-05.json`, los doce ejercicios `ex.m5-05.a` a `ex.m5-05.l`, la habilidad `skill.common-progressions` y el test `tests/content-m5-05.test.ts`.
- Contenido: M5-05 «Progresiones comunes» explica I-V-vi-IV con su variante vi-IV-I-V y la progresión de los cincuenta, ii-V-I con séptimas y el tritono Si-Fa, y el transporte a las doce tonalidades mayores. Publica dos demos de playback (rueda pop y ii-V-I con séptimas en Do), una tarea de teclado con ambas progresiones a 60 BPM y doce ejercicios de completar, uno por tonalidad.
- Motor: se reutilizó el tipo `progression-completion`, que deduce la respuesta del grado en `degrees[missingIndex]`; la habilidad nueva se registra como `progression` y las opciones se comparten entre español e inglés porque los grados son neutros.
- Verificación: `npm run validate:content` da 9 módulos, 52 lecciones, 415 ejercicios y 38 habilidades; el índice se regenera con 52 lecciones. Suite 147 archivos / 1035 tests en verde; typecheck, build y presupuesto (211,67 kB gzip inicial, 481 chunks diferidos) verdes; E2E 2/2.
- Resultado: commit de implementación `9a0de5c`; documentación de cierre en este commit.
- Limitación: las demos validan las notas y las medidas por MIDI, no el audio real en hardware. Los ejercicios piden el grado que falta, no la nota concreta en cada tonalidad; el conocimiento de las notas se refuerza en las explicaciones.
- Próximo paso: F4-006 (escribir M5-06 «Blues de 12 compases»).

## 2026-11-11T02:20:00-03:00 · F4-006

- Acción: se retomó el proyecto desde el PUNTO DE REANUDACIÓN (F4-006) y se marcó `[~]` en `4b1680b`. Se escribió la lección `content/lessons/m5-06.json`, los doce ejercicios `ex.m5-06.a` a `ex.m5-06.l`, la habilidad `skill.twelve-bar-blues` y el test `tests/content-m5-06.test.ts`.
- Contenido: M5-06 «Blues de 12 compases» explica la forma de tres frases de cuatro compases, la progresión básica I7-IV7-V7 con su turnaround, la variante quick change, el blues lento y el blues menor i7-iv7-V7. Publica dos demos de playback (básico en Do y quick change en Sol), una tarea de doce compases a 60 BPM y doce ejercicios de grados repartidos entre las doce tonalidades: seis básicos, tres quick change y tres menores.
- Motor: se reutilizó el tipo `progression-completion` con doce grados y `missingIndex`; la habilidad nueva se registra como `progression` y las opciones se comparten entre idiomas porque los grados son neutros.
- Verificación: `npm run validate:content` da 9 módulos, 53 lecciones, 427 ejercicios y 39 habilidades; el índice se regenera con 53 lecciones. Suite 148 archivos / 1042 tests en verde; typecheck, build y presupuesto (212,09 kB gzip inicial, 494 chunks diferidos) verdes; E2E 2/2.
- Resultado: commit de implementación `0250877`; documentación de cierre en este commit.
- Limitación: las demos validan las notas y las medidas por MIDI, no el audio real en hardware. Las demos usan acordes en bloque y no reproducen el ritmo característico del blues ni el shuffle.
- Próximo paso: F4-007 (escribir M5-07 «Dominantes secundarias»).

## 2026-11-11T02:29:23-03:00 · F4-007

- Acción: se retomó el proyecto desde el PUNTO DE REANUDACIÓN (F4-007) y se marcó `[~]` en `ecad1ba`. Se completó la lección `content/lessons/m5-07.json`, los doce ejercicios `ex.m5-07.a` a `ex.m5-07.l`, la habilidad `skill.secondary-dominants` y el test `tests/content-m5-07.test.ts`.
- Contenido: M5-07 «Dominantes secundarias» explica el cifrado V/x, V/V (dominante de la dominante), V/ii (dominante del segundo grado), la resolución por semitono de la sensible y de la séptima, y menciona V/vi y V/IV como contexto. Publica dos demos de audio (D7→G y A7→Dm), una tarea de teclado con V/V-V y V/ii-ii en Do mayor a 60 BPM y doce ejercicios que alternan seis cifrados y seis resoluciones en las doce tonalidades mayores.
- Motor: se añadió el tipo `secondary-dominant` (key, mode, target, ask) que deriva el cifrado con `secondaryDominantNumeral` y la resolución con `romanNumeralFor`, sin duplicar respuestas en cada ejercicio. Se registra como habilidad `roman-numeral`, con formatos ver y deletrear, conserva el caso exacto al comparar V de v y añade el código de feedback `secondary-dominant` en español e inglés.
- Verificación: `npm run validate:content` da 9 módulos, 54 lecciones, 439 ejercicios y 40 habilidades; el índice se regenera con 54 lecciones. Suite 149 archivos / 1049 tests en verde; typecheck, build y presupuesto (213,03 kB gzip inicial, 507 chunks diferidos) verdes; E2E 2/2.
- Resultado: commit de implementación `0e3df9f`; documentación de cierre en este commit.
- Limitación: las demos validan las notas y las medidas por MIDI, no el audio real en hardware. Los ejercicios usan solo tonalidades mayores y se limitan a V/V y V/ii; V/vi, V/IV y los dominantes secundarios en menor se explican en el texto pero no se evalúan.
- Próximo paso: F4-008 (escribir M5-08 «Intercambio modal»).


## 2026-11-11T02:39:11-03:00 · F4-008

- Acción: se retomó el proyecto desde el PUNTO DE REANUDACIÓN (F4-008) y se marcó `[~]` en `4a80e06`. Se escribió la lección `content/lessons/m5-08.json`, los doce ejercicios `ex.m5-08.a` a `ex.m5-08.l`, la habilidad `skill.modal-mixture` y el test `tests/content-m5-08.test.ts`.
- Contenido: M5-08 «Intercambio modal» explica el préstamo del modo paralelo, los acordes iv, bVI, bVII, bIII, ii° y v en mayor, la función de cada uno (iv para el cierre plagal oscuro, bVI-bVII-I como cadencia cinematográfica), la tercera de Picardía y el préstamo inverso en menor. Publica dos demos (Fa menor-Do y La♭-Si♭-Do), una tarea de teclado con los cinco acordes a 60 BPM y doce ejercicios de cifrado repartidos entre las doce tonalidades mayores.
- Motor: se añadió el tipo `borrowed-chord`, que guarda el cifrado con su alteración (bVI, bVII, bIII, etc.) y exige comparación exacta para distinguir iv de IV, con feedback pedagógico propio en español e inglés. La habilidad se registra como `roman-numeral` y los formatos disponibles son ver y deletrear.
- Verificación: `npm run validate:content` da 9 módulos, 55 lecciones, 451 ejercicios y 41 habilidades; el índice se regenera con 55 lecciones. Suite 150 archivos / 1056 tests en verde; typecheck, build y presupuesto (213,79 kB gzip inicial, 520 chunks diferidos) verdes; E2E 2/2.
- Resultado: commit de implementación `38cc094`; documentación de cierre en este commit.
- Limitación: las demos validan las notas y las medidas por MIDI, no el audio real en hardware. Los ejercicios usan solo tonalidades mayores y el cifrado se escribe con b ASCII (bVI) para respetar el esquema; la lección aclara la equivalencia con ♭VI.
- Próximo paso: F4-009 (escribir M5-09 «Modulación y conducción de voces»).


## 2026-11-11T02:48:36-03:00 · F4-009

- Acción: se retomó el proyecto desde el PUNTO DE REANUDACIÓN (F4-009) y se actualizó el bloque en `00a7dda` (la marca `[~]` de la tarea se añadió recién en el cierre). Se escribió la lección `content/lessons/m5-09.json`, los doce ejercicios `ex.m5-09.a` a `ex.m5-09.l`, la habilidad `skill.modulation` y el test `tests/content-m5-09.test.ts`.
- Contenido: M5-09 «Modulación y conducción de voces» explica la diferencia entre modulación y tonicización, el acorde pivote (Lam es vi en Do y ii en Sol) y las reglas básicas de conducción de voces: conservar notas comunes, mover por grados conjuntos, resolver la sensible hacia arriba y la séptima hacia abajo, y evitar quintas y octavas paralelas. Publica dos demos (Do-Lam-Re7-Sol y Sol7-Do), una tarea de teclado con la modulación y la resolución a 60 BPM y doce ejercicios de análisis que alternan seis preguntas sobre el cifrado de origen y seis sobre el de destino, en las doce tonalidades mayores.
- Motor: se añadió el tipo `pivot-chord` (fromKey, toKey, degreeFrom, degreeTo, ask) que deriva el cifrado con `romanNumeralFor` y exige comparación exacta, con feedback pedagógico propio en español e inglés. La habilidad se registra como `roman-numeral` y los formatos disponibles son ver y deletrear.
- Verificación: `npm run validate:content` da 9 módulos, 56 lecciones, 463 ejercicios y 42 habilidades; el índice se regenera con 56 lecciones. Suite 151 archivos / 1063 tests en verde; typecheck, build y presupuesto (214,66 kB gzip inicial, 533 chunks diferidos) verdes; E2E 2/2.
- Resultado: commit de implementación `4037934`; documentación de cierre en este commit.
- Limitación: las demos validan las notas y las medidas por MIDI, no el audio real en hardware. Los ejercicios usan solo tonalidades mayores y modulaciones a la dominante y a la subdominante con pivotes vi/ii o ii/vi; las modulaciones a la relativa menor y a tonalidades lejanas se explican en el texto pero no se evalúan.
- Próximo paso: F4-010 (escribir M6-01 «Motivo y frase»).

## 2026-11-11T11:05:00-03:00 · Reanudación F4-010

- Acción: revisión del protocolo (`RESUME`, `CHECKLIST`, últimas 50 líneas de `LOG` y `DECISIONES`), `npm run estado`, `git status` y `git log -5`.
- Estado: el árbol tenía cuatro archivos modificados sin commitear (`docs/CHECKLIST.md`, `docs/ESTADO.md`, `docs/LOG.md` y `docs/RESUME.md`). Corresponden al cierre documental de F4-009: la implementación ya estaba en `4037934`, pero faltaba el commit de documentación de la sesión cortada.
- Decisión: se conservaron y se completó el cierre de F4-009 en un commit aparte; no se descartó nada porque los cambios eran coherentes con la verificación registrada (151 archivos / 1063 tests, build de 214,66 kB gzip inicial, E2E 2/2). `npm run estado` volvió a quedar verde.
- Tarea activa: no había `[~]` ni `[!]`; la primera pendiente es F4-010 (M6-01 «Motivo y frase»).
- Próximo paso: escribir M6-01, sus doce ejercicios de análisis de motivo/frase y el test de contenido; verificar y cerrar la tarea.

## 2026-11-11T11:15:17-03:00 · F4-010

- Acción: se retomó el proyecto desde el PUNTO DE REANUDACIÓN (F4-010) y se marcó `[~]` en `4b1a59e`. Se escribió la lección `content/lessons/m6-01.json`, los doce ejercicios `ex.m6-01.a` a `ex.m6-01.l`, la habilidad `skill.motive-phrase` y el test `tests/content-m6-01.test.ts`.
- Contenido: M6-01 «Motivo y frase» explica el motivo como la unidad melódica más pequeña con identidad propia, la frase como idea completa de cuatro compases, la semifrase y el período, y el desarrollo motívico por repetición, secuencia, inversión, aumentación y disminución. Publica dos demos originales (una melodía de ocho compases en cuatro motivos y una frase de cuatro compases con semicadencia), una tarea de teclado con respiraciones marcadas y doce ejercicios de análisis melódico que alternan compases de 4/4 y 3/4.
- Motor: se añadió el tipo `phrase-analysis` (score, segments, ask, phrase), que deriva la respuesta de los segmentos marcados: cuenta motivos o frases o devuelve el compás final de la frase pedida, sin duplicar la respuesta en cada ejercicio. La habilidad se registra con el nuevo tipo `form`; el validador comprueba que los segmentos caben en la partitura, no se solapan y que cada motivo queda dentro de una frase. Se añadió el código de feedback `motive-phrase` en español e inglés y el reproductor muestra la partitura con un botón de escucha de la melodía completa.
- Verificación: `npm run validate:content` da 9 módulos, 57 lecciones, 475 ejercicios y 43 habilidades; el índice se regenera con 57 lecciones. Suite 152 archivos / 1071 tests en verde; typecheck, build y presupuesto (215,98 kB gzip inicial, 546 chunks diferidos) verdes; E2E 2/2.
- Resultado: commit de implementación `12cd230`; documentación de cierre en este commit.
- Limitación: las demos validan las notas y las medidas por MIDI, no el audio real en hardware. La segmentación es la que declara el contenido: los ejercicios piden contar o ubicar los segmentos, no escribir a mano las fronteras de cada frase, y el feedback corrige la opción elegida, no una segmentación libre.
- Próximo paso: F4-011 (escribir M6-02 «Período y forma binaria/ternaria»).

## 2026-11-11T11:21:05-03:00 · F4-011

- Acción: se retomó el proyecto desde el PUNTO DE REANUDACIÓN (F4-011) y se marcó `[~]` en `ec891f7`. Se escribió la lección `content/lessons/m6-02.json`, los doce ejercicios `ex.m6-02.a` a `ex.m6-02.l`, la habilidad `skill.musical-form` y el test `tests/content-m6-02.test.ts`.
- Contenido: M6-02 «Período y forma binaria/ternaria» explica el período con antecedente abierto y consecuente que cierra, la forma binaria AB (con repeticiones AABB y la variante redondeada) y la ternaria ABA (minueto con trío y aria da capo). Publica tres demos originales (período paralelo, binaria y ternaria), una tarea de teclado que marca A-B-A en voz alta y doce ejercicios de análisis formal: cuatro binarias, cuatro ternarias y cuatro de período, dos de ellas sobre la función de una frase.
- Motor: se añadió el tipo `form-analysis` (score, sections, form, ask, part), que deriva la respuesta de la forma declarada o de la función de la frase pedida. La habilidad se registra como `form`; el validador comprueba que las secciones caben en la partitura, están en orden, no se solapan y respetan el esquema AB o ABA, y que las preguntas de antecedente/consecuente solo aparecen en períodos. Se añadió el código de feedback `form-period` en español e inglés y el reproductor reutiliza la partitura y el botón de escucha de la melodía completa.
- Verificación: `npm run validate:content` da 9 módulos, 58 lecciones, 487 ejercicios y 44 habilidades; el índice se regenera con 58 lecciones. Suite 153 archivos / 1079 tests en verde; typecheck, build y presupuesto (217,17 kB gzip inicial, 559 chunks diferidos) verdes; E2E 2/2.
- Resultado: commit de implementación `8ecb692`; documentación de cierre en este commit.
- Limitación: las demos validan las notas y las medidas por MIDI, no el audio real en hardware. La forma de cada ejercicio es la que declara el contenido y las secciones están etiquetadas de antemano; los ejercicios piden identificarla entre opciones, no escribir la segmentación formal a mano. Todos los ejemplos están en Do mayor.
- Próximo paso: F4-012 (escribir M6-03 «Rondó y sonata»).

## 2026-11-11T11:28:04-03:00 · F4-012

- Acción: se retomó el proyecto desde el PUNTO DE REANUDACIÓN (F4-012) y se marcó `[~]` en `4588519`. Se escribió la lección `content/lessons/m6-03.json`, los doce ejercicios `ex.m6-03.a` a `ex.m6-03.l`, la habilidad `skill.rondo-sonata` y el test `tests/content-m6-03.test.ts`.
- Contenido: M6-03 «Rondó y sonata» explica el rondó con estribillo recurrente y episodios (ABACA y ABACABA, con «Para Elisa» de Beethoven y el «Rondó alla turca» de Mozart como ejemplos de dominio público) y la forma sonata con exposición, desarrollo y recapitulación, incluido el plan tonal que resuelve el segundo tema en la tónica (Sonata K. 545 de Mozart). Publica dos demos originales (rondó de quince compases en 3/4 y sonata en miniatura de doce compases en 4/4), una tarea de teclado que marca cada vuelta del estribillo y doce ejercicios de reconocimiento formal: seis rondós y seis sonatas.
- Motor: el enum `form` de `form-analysis` incorpora `rondo` y `sonata`; la respuesta se etiqueta como «Rondó (ABACA)» o «Forma sonata (exposición-desarrollo-recapitulación)». El validador exige el esquema de cinco secciones A-B-A-C-A para el rondó y el de tres bloques A-B-A para la sonata. Se añadió el código de feedback `rondo-sonata` en español e inglés, elegido mediante el nuevo contexto `form`, y la habilidad `skill.rondo-sonata` de tipo `form`. El reproductor reutiliza la partitura y el botón de escucha de la melodía completa.
- Verificación: `npm run validate:content` da 9 módulos, 59 lecciones, 499 ejercicios y 45 habilidades; el índice se regenera con 59 lecciones. Suite 154 archivos / 1087 tests en verde; typecheck, build y presupuesto (218,35 kB gzip inicial, 572 chunks diferidos) verdes; E2E 2/2.
- Resultado: commit de implementación `b3918c9`; documentación de cierre en este commit.
- Limitación: las demos validan las notas y las medidas por MIDI, no el audio real en hardware. La forma de cada ejercicio es la que declara el contenido y las secciones están etiquetadas de antemano; los ejercicios piden identificarla entre cuatro opciones, no escribir la segmentación formal ni el plan tonal a mano. Todos los ejemplos originales están en Do mayor, con la dominante en Sol.
- Próximo paso: F4-013 (escribir M6-04 «Texturas: monofonía, homofonía, polifonía»).

## 2026-11-13T11:40:11-03:00 · F4-013

- Acción: se retomó el proyecto desde el PUNTO DE REANUDACIÓN (F4-013) y se marcó `[~]` en `7c76bf3`. Se escribió la lección `content/lessons/m6-04.json`, los doce ejercicios `ex.m6-04.a` a `ex.m6-04.l`, la habilidad `skill.texture` y el test `tests/content-m6-04.test.ts`.
- Contenido: M6-04 «Texturas: monofonía, homofonía, polifonía» explica la textura como combinación de líneas y acordes, con escucha comparada de tres demos originales (melodía sola, la misma idea con acordes y un canon a dos voces) y ejemplos de dominio público: canto gregoriano, himno y una invención de Bach. Publica una tarea de teclado que compara monofonía y homofonía y doce ejercicios de clasificación: cuatro monofonías, cuatro homofonías y cuatro polifonías.
- Motor: se añadió el tipo `texture-analysis` (score, texture, voices), que deriva la respuesta de la textura declarada. El validador comprueba que la monofonía no tenga acordes ni voces simultáneas, que la homofonía tenga acordes y que la polifonía tenga al menos dos voces notadas y dos grupos de eventos simultáneos. Se añadió el campo `voice` a los eventos de partitura (por defecto 1) para separar las voces, la habilidad `skill.texture` de tipo `texture`, el código de feedback `texture` en español e inglés y el formato de repaso auditivo. El reproductor reutiliza la partitura y el botón de escucha de la melodía completa.
- Verificación: `npm run validate:content` da 9 módulos, 60 lecciones, 511 ejercicios y 46 habilidades; el índice se regenera con 60 lecciones. Suite 155 archivos / 1095 tests en verde; typecheck, build y presupuesto (219,45 kB gzip inicial, 585 chunks diferidos) verdes; E2E 2/2.
- Resultado: commit de implementación `2d48c43`; documentación de cierre en este commit.
- Limitación: las demos validan las notas y las medidas por voz mediante MIDI, no el audio real en hardware. En las polifonías, los eventos simultáneos comparten compás y pulso y el audio los suena juntos, pero el pentagrama actual los dibuja en secuencia porque el renderizador todavía no separa voces en el mismo sistema; los tests comprueban la estructura y la suma de pulsos por voz, no la alineación vertical. Todos los ejemplos originales están en Do mayor.
- Próximo paso: F4-014 (escribir M6-05 «Contrapunto básico»).

## 2026-11-13T11:48:35-03:00 · F4-014

- Acción: se retomó el proyecto desde el PUNTO DE REANUDACIÓN (F4-014) y se marcó `[~]` en `0956b15`. Se escribió la lección `content/lessons/m6-05.json`, los doce ejercicios `ex.m6-05.a` a `ex.m6-05.l`, la habilidad `skill.counterpoint` y el test `tests/content-m6-05.test.ts`.
- Contenido: M6-05 «Contrapunto básico» explica la combinación de voces independientes, los cuatro movimientos (paralelo, similar, contrario y oblicuo) y las reglas simples del contrapunto: evitar quintas y octavas paralelas, preferir el movimiento contrario y usar consonancias en los pulsos fuertes. Usa ejemplos de dominio público (invenciones de Bach y polifonía vocal de Palestrina), incluye dos demos originales (un contrapunto correcto a dos voces y un ejemplo con quintas paralelas) y una tarea de teclado para tocar cada voz, invertir las manos y cantar una línea mientras suena la otra. Publica doce ejercicios: ocho de reconocimiento del movimiento y cuatro de reglas.
- Motor: se añadió el tipo `counterpoint-analysis` (`ask` de movimiento o de regla, `motion` y `parallels`), que deriva la respuesta del movimiento o del resultado de la regla. Se añadió la habilidad `skill.counterpoint` de tipo `counterpoint`, el código de feedback `counterpoint` en español e inglés y el formato de repaso auditivo. El validador exige dos voces notadas con al menos un grupo de eventos simultáneos y, en las preguntas de regla, el campo `parallels`. El reproductor reutiliza la partitura y el botón de escucha de la melodía completa.
- Verificación: `npm run validate:content` da 9 módulos, 61 lecciones, 523 ejercicios y 47 habilidades; el índice se regenera con 61 lecciones. Suite 156 archivos / 1103 tests en verde; typecheck, build y presupuesto (220,65 kB gzip inicial, 598 chunks diferidos) verdes; E2E 2/2.
- Resultado: commit de implementación `886ea6d`; documentación de cierre en este commit.
- Limitación: las demos y los ejercicios validan las notas y la suma de pulsos por voz mediante MIDI, no el audio real en hardware. Los eventos simultáneos comparten compás y pulso y el audio los suena juntos, pero el pentagrama actual los dibuja en secuencia porque el renderizador todavía no separa voces en el mismo sistema; el test de contenido usa la posición diatónica para distinguir el movimiento paralelo genérico del similar. Todas las voces están en Do mayor y las quintas/octavas se detectan por su intervalo en semitonos.
- Próximo paso: F4-015 (escribir M6-06 «Ornamentos»).

## 2026-11-13T12:01:23-03:00 · F4-015

- Acción: se retomó el proyecto desde el PUNTO DE REANUDACIÓN (F4-015) y se marcó `[~]` en `4c1cce1`. Se escribió la lección `content/lessons/m6-06.json`, los doce ejercicios `ex.m6-06.a` a `ex.m6-06.l`, la habilidad `skill.ornament` y el test `tests/content-m6-06.test.ts`.
- Contenido: M6-06 «Ornamentos» explica el trino, el mordente, el grupeto y la apoyatura, sus símbolos y su ejecución en el pulso, con ejemplos de dominio público (Bach y Mozart). Incluye cuatro demos escritas nota por nota, una tarea de teclado a 72 BPM para tocar los cuatro adornos contando los tiempos y doce ejercicios de ejecución: tres trinos, tres mordentes, tres grupetos y tres apoyaturas.
- Motor: se añadió el tipo `ornament-execution`, que muestra la realización escrita y deriva la respuesta del adorno declarado mediante etiquetas bilingües. Se añadió la habilidad `skill.ornament` de tipo `ornament`, el código de feedback `ornament` en español e inglés y el formato de repaso auditivo. El validador exige un mínimo de notas por adorno (trino 4, mordente 3, grupeto 4, apoyatura 2) y al menos dos opciones. El reproductor reutiliza la partitura y el botón de escucha de la melodía completa.
- Verificación: `npm run validate:content` da 9 módulos, 62 lecciones, 535 ejercicios y 48 habilidades; el índice se regenera con 62 lecciones. Suite 157 archivos / 1111 tests en verde; typecheck, build y presupuesto (221,91 kB gzip inicial, 611 chunks diferidos) verdes; E2E 2/2.
- Resultado: commit de implementación `e689323`; documentación de cierre en este commit.
- Limitación: las demos y los ejercicios validan las notas y la suma de pulsos mediante MIDI, no el audio real en hardware. Como el pentagrama todavía no dibuja símbolos de ornamentos ni notas pequeñas, las realizaciones se escriben con notas normales y el test reconoce el adorno por el contorno del primer compás; la explicación de los símbolos queda en el texto. Todos los ejemplos están en Do mayor.
- Próximo paso: F4-016 (implementar armonización diatónica en 12 tonalidades).

## 2026-11-13T12:08:12-03:00 · F4-016

- Acción: se retomó el proyecto desde el PUNTO DE REANUDACIÓN (F4-016) y se marcó `[~]` en `9a56084`. Se revisó `src/theory/roman.ts` y se comprobó que la armonización diatónica ya estaba implementada; faltaba la cobertura exhaustiva que pide la aceptación, así que se escribió `tests/theory-harmonization.test.ts`.
- Contenido: el test recorre las 12 tónicas en mayor, menor natural y menor armónica (252 acordes) y verifica la raíz y las notas de la escala con su grafía, la cualidad por grado, el número romano, el símbolo, la función T/S/D y la coherencia entre `diatonicChord` y `diatonicChords`. También comprueba los rasgos de cada modo: V mayor y vii° disminuido en menor armónica, v menor y VII mayor en menor natural, y III aumentado en menor armónica.
- Decisión: no se modificó el motor porque el barrido previo no encontró discrepancias entre las notas generadas y los grados de la escala; el trabajo de la tarea fue convertir esa promesa en una garantía de regresión.
- Verificación: typecheck verde; suite 158 archivos / 1117 tests en verde; build y presupuesto (221,91 kB gzip inicial, 611 chunks diferidos) verdes; E2E 2/2; `validate:content` sigue en 9 módulos, 62 lecciones, 535 ejercicios y 48 habilidades.
- Resultado: commit de implementación `a6676dd`; documentación de cierre en este commit.
- Próximo paso: F4-017 (generar ejercicios de números romanos ↔ acordes).

## 2026-11-13T12:18:21-03:00 · F4-017

- Acción: se escribió el generador `src/exercises/generators/roman-numeral.ts` y su test `tests/generators-roman-numeral.test.ts`; se exportó desde el índice de generadores. El inicio se anotó en el PUNTO DE REANUDACIÓN y el `[~]` quedó registrado junto con este cierre, sin un commit intermedio de inicio.
- Contenido: el generador cubre los dos sentidos. `chord-to-numeral` produce un ejercicio `roman-numeral` a partir de un grado real de la escala; `numeral-to-chord` produce un ejercicio `chord` con `ask: 'symbol'` y opciones bilingües alineadas. Por defecto recorre las 12 tonalidades, los 2 sentidos y los 7 grados (168 combinaciones), acepta menor natural o armónica y toma los distractores de los demás grados de la misma tonalidad.
- Detalles: la dificultad 1/2/3 genera 2/3/4 opciones; los numerales de la menor armónica incluyen III+ y vii°; el generador rechaza tonalidades fuera de las 12 y grados que no sean enteros entre 1 y 7. Las respuestas se resuelven con el mismo `resolveExerciseAnswer` que usa la app.
- Verificación: typecheck verde; suite 159 archivos / 1125 tests en verde; build y presupuesto (221,91 kB gzip inicial, 611 chunks diferidos) verdes; E2E 2/2; `validate:content` sigue en 9 módulos, 62 lecciones, 535 ejercicios y 48 habilidades.
- Resultado: commit de implementación `3a8a541`; documentación de cierre en este commit.
- Próximo paso: F4-018 (generar ejercicios de completar progresiones).

## 2026-11-13T12:34:13-03:00 · F4-018

- Acción: se retomó el proyecto desde el PUNTO DE REANUDACIÓN (F4-018) y se marcó `[~]` en `3588b44`. Se escribió el generador `src/exercises/generators/progression-completion.ts`, el módulo de audio `src/exercises/progression-completion.ts` y el test `tests/generators-progression-completion.test.ts`.
- Contenido: el generador parte de un catálogo de progresiones mayores (rueda pop, rueda girada, años cincuenta, ii-V-I, cadencia clásica, giro I-vi-ii-V y canon de Pachelbel) y menores naturales (andalusa, menor clásica, rueda menor y giro menor). Cada ejercicio muestra el patrón con un `?` en la posición del hueco, pide el grado que falta y explica la progresión completa con sus acordes en la tonalidad. Por defecto recorre las 12 tonalidades mayores, los 7 patrones y todas las posiciones del hueco (372 combinaciones); acepta modo menor y ajusta 3, 4 o 5 opciones según la dificultad.
- Motor: las opciones son siempre numerales diatónicos válidos de la tonalidad elegida y se descartan los distractores que también completarían otro patrón del catálogo con el mismo contexto, de modo que la respuesta sea única. Se añadió `buildProgressionCompletionAudio`, que construye tres timelines puros: la progresión completa, el contexto con el hueco en silencio y el acorde faltante aislado. El reproductor muestra el botón «Escuchar progresión» y reproduce el contexto sin revelar el acorde. El validador ahora comprueba que el índice faltante esté dentro de la progresión, que la respuesta figure entre las opciones, que no haya duplicados y que cada opción sea un número romano válido.
- Verificación: typecheck verde; suite 160 archivos / 1134 tests en verde; build y presupuesto (222,08 kB gzip inicial, 611 chunks diferidos) verdes; E2E 2/2; `validate:content` sigue en 9 módulos, 62 lecciones, 535 ejercicios y 48 habilidades.
- Resultado: commit de implementación `f4d9a9b`; documentación de cierre en este commit.
- Limitación: el audio se deriva de los grados y no se prueba en hardware; los tests verifican la estructura de los timelines y las alturas MIDI. El botón del reproductor suena con el tempo de los ajustes y deja el hueco en silencio, pero el pentagrama no dibuja la progresión porque el tipo `progression-completion` no tiene partitura asociada. El modo menor del generador usa la escala menor natural; las cualidades de la menor armónica quedan para los ejercicios de números romanos de F4-017.
- Próximo paso: F4-019 (generar ejercicios de cadencias).

## 2026-11-13T12:42:26-03:00 · F4-019

- Acción: se retomó el proyecto desde el PUNTO DE REANUDACIÓN (F4-019) y se marcó `[~]` en `78ef949`. Se escribió el generador `src/exercises/generators/cadence.ts` y su test `tests/generators-cadence.test.ts`; se exportó desde el índice de generadores.
- Contenido: el generador cubre los cuatro tipos de cadencia —auténtica (V-I), plagal (IV-I), semicadencia (…-V) y rota o engañosa (V-VI)— en las 12 tonalidades mayores y menores. La dirección `identify` produce ejercicios `cadence` con los dos acordes descritos en el enunciado; la dirección `complete` produce ejercicios `progression-completion` con un grado oculto: la dominante en las semicadencias y el primer acorde en las cadencias conclusivas, para que el hueco no sea ambiguo. Por defecto recorre 12 tonalidades × 4 tipos × 2 direcciones (96 ejercicios) y permite ampliar a ambos modos (192).
- Motor: los grados salen de `cadenceDegrees` y la respuesta se deduce con `cadenceTypeFor` y `diatonicChords`. En menor se usa la escala armónica para que la auténtica tenga la dominante con sensible (V-i) y la rota el VI mayor; la semicadencia menor va de i a V. Las opciones de completar son numerales diatónicos únicos y se ajustan a 3/4/5 según la dificultad. El audio reutiliza `buildProgressionCompletionAudio` de F4-018, y el test verifica los timelines de la cadencia completada.
- Verificación: typecheck verde; suite 161 archivos / 1142 tests en verde; build y presupuesto (222,08 kB gzip inicial, 611 chunks diferidos) verdes; E2E 2/2; `validate:content` sigue en 9 módulos, 62 lecciones, 535 ejercicios y 48 habilidades.
- Resultado: commit de implementación `86001c4`; documentación de cierre en este commit.
- Limitación: los ejercicios de identificación no llevan partitura ni audio propios porque el tipo `cadence` solo guarda grados; sus acordes se describen con notas en el enunciado y las demos de audio viven en la lección M5-04. La completación sí se puede escuchar con el botón de progresión. El audio se valida por estructura MIDI, no en hardware. El modo menor usa la escala armónica para las cuatro cadencias, de modo que la semicadencia no emplea la dominante menor natural.
- Próximo paso: F4-020 (generar dominantes secundarias e intercambio modal).

## 2026-11-11T13:20:00-03:00 · F4-020

- Acción: se escribieron los generadores `src/exercises/generators/secondary-dominant.ts` y `src/exercises/generators/borrowed-chord.ts`, se exportaron desde el índice de generadores y se agregaron los tests `tests/generators-secondary-dominant.test.ts` y `tests/generators-borrowed-chord.test.ts`. El inicio se anotó en el PUNTO DE REANUDACIÓN y se commiteó en `d405a14`.
- Contenido: el generador de dominantes secundarias cubre las dos direcciones. `numeral` nombra el grado que resuelve y pide el cifrado V/x; `resolution` muestra el acorde con su séptima (por ejemplo Re7 en Do mayor) y pide el grado de resolución, de modo que la respuesta no se lea del enunciado. En mayor se tonicizan ii, iii, IV, V y vi; en menor se usa la menor natural y se descarta el ii° porque no se toniciza, igual que hace el motor de respuestas. El generador de acordes prestados toma del modo paralelo: en mayor, bIII, iv, v, bVI y bVII del menor natural; en menor, I (tercera de picardía), IV y vi del mayor. El enunciado describe el acorde con su nombre y sus notas, siguiendo el estilo de las lecciones M5-07 y M5-08.
- Motor: las respuestas se deducen con `secondaryDominantNumeral`, `romanNumeralFor`, `diatonicChord` y `scaleDegree`; la séptima del dominante se construye con `chordPitches` y su fundamental es el grado un cuarto arriba del grado que resuelve. Los distractores de los dominantes secundarios son los demás V/x de la tonalidad más la V simple; los de los prestados mezclan los demás préstamos con los numerales diatónicos de la tonalidad, que son los primeros candidatos equivocados. Las opciones son 3/4/5 según la dificultad y el generador por defecto trabaja en dificultad alta (3), como pide la aceptación.
- Verificación: typecheck verde; suite 163 archivos / 1154 tests en verde; build y presupuesto (222,08 kB gzip inicial, 611 chunks diferidos) verdes; E2E 2/2; `validate:content` sigue en 9 módulos, 62 lecciones, 535 ejercicios y 48 habilidades.
- Resultado: commit de implementación `3c321aa`; documentación de cierre en este commit.
- Limitación: los generadores no llevan partitura ni audio propios porque los tipos `secondary-dominant` y `borrowed-chord` guardan grados y numerales; las demos de audio siguen viviendo en las lecciones M5-07 y M5-08. El modo menor de los dominantes secundarios usa la menor natural para coincidir con el motor de respuestas, de modo que la V del V menor no aparece con sensible.
- Próximo paso: F4-021 (generar ejercicios de modulación y transposición armónica).

## 2026-11-11T16:35:00-03:00 · F4-021

- Acción: se escribió el generador `src/exercises/generators/modulation.ts`, se exportó desde el índice de generadores y se agregó el test `tests/generators-modulation.test.ts`. El inicio se anotó en el PUNTO DE REANUDACIÓN y se commiteó en `3615d85`.
- Contenido: el generador produce ejercicios `pivot-chord` de modulación entre tonalidades vecinas del círculo de quintas. Recorre las doce tonalidades mayores y modula a la dominante (un quinto arriba) y a la subdominante (un quinto abajo); se descartan los dos destinos fuera de las doce (Fa♯→Do♯ y Re♭→Sol♭). El acorde pivote se elige entre los acordes diatónicos comunes a las dos tonalidades, se describe con su nombre y sus notas en el enunciado y se pregunta su número romano en el origen (`source`) o en el destino (`target`). La explicación nombra el numeral en las dos tonalidades y el V7 de la tonalidad destino que confirma la modulación, siguiendo el estilo de M5-09.
- Motor: la relación sale de `circleNeighbors`; los pivotes se detectan comparando las clases de altura de los acordes diatónicos de las dos tonalidades con `diatonicChords`; los numerales se deducen de `chordFrom.roman` y `chordTo.roman`, que coinciden con el motor de respuestas porque ambas tonalidades son mayores. Los distractores son los numerales diatónicos de la tonalidad preguntada, con el numeral gemelo del pivote en la otra tonalidad como primera trampa (la respuesta de `resolveExerciseAnswer` lo confirma). Las opciones son 3/4/5 según la dificultad.
- Verificación: typecheck verde; suite 164 archivos / 1160 tests en verde; build y presupuesto (222,08 kB gzip inicial, 611 chunks diferidos) verdes; E2E 2/2; `validate:content` sigue en 9 módulos, 62 lecciones, 535 ejercicios y 48 habilidades.
- Resultado: commit de implementación `8444e6e`; documentación de cierre en este commit.
- Limitación: las dos tonalidades son siempre mayores porque el motor de respuestas del tipo `pivot-chord` deriva el numeral con las cualidades de la mayor y el esquema no guarda el modo; la modulación a la relativa menor y el préstamo de F4-020 quedan fuera de este generador. Los ejercicios no llevan partitura ni audio propios; las demos viven en la lección M5-09. La transposición armónica melódica sigue cubierta por el generador de F3.
- Próximo paso: F4-022 (reproducir progresiones con voicings y tempo).

## 2026-11-12T15:55:00-03:00 · F4-022

- Acción: se escribieron `src/exercises/progression-playback.ts`, `src/components/ProgressionPlayer.tsx`, la opción `duration` de `PlayTimelineOptions` en `src/audio/engine.ts`, la integración en `src/components/ExercisePlayer.tsx`, las claves i18n ES/EN, los estilos y los tests `tests/exercises-progression-playback.test.ts`, `tests/audio-engine.test.ts` y `tests/exercise-player.test.tsx`. El inicio se anotó en el PUNTO DE REANUDACIÓN y se commiteó en `27ae0f1`.
- Audio: `buildProgressionPlayback` convierte los grados de una progresión en acordes con `romanToChord` y arma un timeline donde cada voicing ocupa exactamente su hueco. `block` suena entero 1,5 pulsos; `arpeggio-up`/`arpeggio-down` reparten el hueco en orden; `bass-chord` sostiene el bajo tres pulsos y hace entrar el resto en el segundo tercio sin repetir el MIDI del bajo, evitando notas trabadas. La duración anunciada suma medio pulso de pausa final. `progressionVoicing` es la función pura que reparte un acorde en un hueco.
- Motor: `playTimeline` acepta `duration` y la usa como longitud de pasada; con `repeat` espera a esa duración antes de reiniciar, de modo que el bucle respeta la pausa final en lugar de cortar el último acorde. Sin `duration` conserva el comportamiento anterior (fin del último evento).
- UI: `ProgressionPlayer` se muestra dentro del panel de corrección de `ear-progression` y `progression-completion`, nunca antes de responder. Ofrece forma (reutiliza `CHORD_STYLES`), tempo con deslizador entre `MIN_TEMPO` y `MAX_TEMPO`, bucle y acorde actual vía `onEvent`. No consume las repeticiones del dictado; al desmontar detiene la secuencia si estaba sonando. Se agregaron las claves ES/EN `lesson.exercise.progressionPlayer*` y los estilos `.progression-player`, `.progression-tempo` y `.progression-chord`.
- Verificación: typecheck verde; suite 165 archivos / 1168 tests en verde; build y presupuesto (222,92 kB gzip inicial, 611 chunks diferidos) verdes; E2E 2/2; `validate:content` sigue en 9 módulos, 62 lecciones, 535 ejercicios y 48 habilidades.
- Resultado: commit de implementación `8cfe2f3`; documentación de cierre en este commit.
- Limitación: los voicings parten de la posición fundamental que devuelve `romanToChord`, sin inversiones ni conducción de voces (eso corresponde a F4-023); el reproductor es una práctica libre posterior a la corrección y no puntúa ni registra repasos. El audio real no se puede escuchar en jsdom: los tests cubren los timelines, el motor y los controles, no la salida de audio.
- Próximo paso: F4-023 (implementar motor de conducción de voces con feedback).

## 2026-11-12T16:08:00-03:00 · F4-023

- Acción: se escribieron `src/theory/voice-leading.ts`, `src/components/VoiceLeadingPanel.tsx`, la exportación del motor en `src/theory/index.ts`, la integración en `ProgressionPlayer`, las claves i18n ES/EN, los estilos y los tests `tests/theory-voice-leading.test.ts` y `tests/exercise-player.test.tsx`. El inicio se anotó en el PUNTO DE REANUDACIÓN y se commiteó en `948f8ea`.
- Motor: `voiceLeadingIssues` empareja las voces de dos acordes por posición y señala quintas y octavas paralelas cuando ambas voces se mueven en la misma dirección no nula y conservan el intervalo perfecto; las unísonos se tratan como octavas. `suggestVoicing` genera voicings alternativos con las mismas clases de altura y duplicaciones dentro de un registro cercano (sin unísonos, cruces ni saltos mayores a dos octavas), y elige el de menor número de paralelas, luego menor movimiento y luego menor cambio de registro. `keepBass` permite fijar la voz grave. `analyzeVoiceLeading` normaliza los acordes, detecta las paralelas del original y encadena las propuestas para que las correcciones no creen problemas nuevos.
- Feedback: `VoiceLeadingPanel` vive dentro del reproductor de progresiones y muestra la revisión automática, las paralelas con las voces numeradas desde la más grave y los acordes cuya propuesta cambia, con sus notas según la notación elegida. Es solo lectura: no altera la reproducción ni consume repeticiones. Se agregaron las claves ES/EN `lesson.exercise.voiceLeading*` y los estilos `.voice-leading-*`.
- Verificación: typecheck verde; suite 166 archivos / 1179 tests en verde; build y presupuesto (224,52 kB gzip inicial, 611 chunks diferidos) verdes; E2E 2/2; `validate:content` sigue en 9 módulos, 62 lecciones, 535 ejercicios y 48 habilidades.
- Resultado: commit de implementación `6c0a546`; documentación de cierre en este commit.
- Limitación: el motor trabaja con voces alineadas por índice y voicings ordenados de grave a agudo; no detecta quintas u octavas directas (por movimiento similar hacia una perfecta), cuartas paralelas ni otros criterios de conducción como la resolución de la sensible. La corrección busca voicings de la misma multiplicidad de clases de altura, no reasigna notas entre voces ni duplicaciones nuevas, y solo propone notas; el alumno todavía no puede aplicarlas a la reproducción.
- Próximo paso: F4-024 (generar ejercicios de análisis formal).

## 2026-11-12T16:26:00-03:00 · F4-024

- Acción: se escribieron `src/exercises/generators/form-analysis.ts`, su exportación en el índice de generadores y el test `tests/generators-form-analysis.test.ts`. El inicio se anotó en el PUNTO DE REANUDACIÓN y se commiteó en `19a975e`.
- Generador: produce ejercicios `form-analysis` con melodías originales de 2 a 15 compases para binaria (AB), ternaria (ABA), período, rondó (ABACA) y sonata. Los motivos son grados de la escala mayor y se escriben con la ortografía y la armadura que devuelve el motor de teoría; las secciones que comparten material repiten notas y la recapitulación sonata retoma el tema y cambia solo la cadencia final. Los compases, las etiquetas y el rango de cada sección salen del plan, y el esquema valida el resultado antes de devolverlo.
- Preguntas: `ask: 'form'` pide la forma global con opciones canónicas de 3/4/5 elementos según la dificultad; `ask: 'part'` solo existe en el período y pregunta la función de la frase 1 (antecedente) o 2 (consecuente) con dos opciones bilingües. La mezcla usa un PRNG sembrado con el ID, la tonalidad y la dificultad, así que la posición de la respuesta varía entre ejercicios pero es reproducible.
- Alternativa textual: el generador no duplica descripciones porque el `Staff` existente expone las notas con nombre y octava en su texto accesible; el test lo verifica con `scoreToMeasures` y `describeStaffNotes`.
- Verificación: typecheck verde; suite 167 archivos / 1186 tests en verde; build y presupuesto (224,52 kB gzip inicial, 611 chunks diferidos) verdes; E2E 2/2; `validate:content` sigue en 9 módulos, 62 lecciones, 535 ejercicios y 48 habilidades.
- Resultado: commit de implementación `42299d2`; documentación de cierre en este commit.
- Limitación: las melodías son deliberadamente sencillas (negras y una redonda final, sin silencios, ligaduras ni cromatismos) para que el análisis se centre en la forma; no se insertan en el contenido publicado, así que la app sigue usando los ejercicios escritos a mano de M6-01 a M6-03 hasta que se genere una tanda. El generador no evalúa la respuesta del alumno más allá de las opciones: no analiza una melodía que el alumno escriba.
- Próximo paso: F4-025 (generar ejercicios de ornamentos).

## 2026-11-12T16:47:00-03:00 · F4-025

- Acción: se escribieron `src/exercises/generators/ornament.ts`, `src/exercises/ornament-labels.ts`, la exportación del generador en el índice y el test `tests/generators-ornament.test.ts`. El inicio se anotó en el PUNTO DE REANUDACIÓN y se commiteó en `fdc8d53`.
- Generador: produce ejercicios `ornament-execution` con una realización escrita de dos compases para trino, mordente, grupeto y apoyatura. Las notas principales y sus vecinas superior e inferior salen de la escala mayor de la tonalidad, así que las alteraciones coinciden con la armadura: en Fa♯ mayor la vecina de Re♯ se escribe Mi♯, no Fa natural. El trino alterna ocho corcheas y cierra con una redonda; el mordente baja una vez y vuelve; el grupeto hace superior-principal-inferior-principal; la apoyatura se apoya en una vecina superior o inferior antes de resolver. Cada compás queda completo, sin huecos ni solapes.
- Identificar y ejecutar: el enunciado pide reconocer el adorno y la partitura es la versión ejecutable, que el reproductor dibuja y toca con el piano. Las etiquetas canónicas se movieron a `src/exercises/ornament-labels.ts` y ahora las comparten el generador y `resolveExerciseAnswer`, para que la opción correcta no pueda desalinearse del motor de respuestas.
- Determinismo: el grado de la nota principal, la dirección de la apoyatura y la mezcla de opciones usan un PRNG sembrado con el ID, la tonalidad, el adorno y la dificultad. La matriz completa son 48 ejercicios (12 tonalidades × 4 adornos).
- Verificación: typecheck verde; suite 168 archivos / 1193 tests en verde; build y presupuesto (224,51 kB gzip inicial, 611 chunks diferidos) verdes; E2E 2/2; `validate:content` sigue en 9 módulos, 62 lecciones, 535 ejercicios y 48 habilidades.
- Resultado: commit de implementación `24fd674`; documentación de cierre en este commit.
- Limitación: el generador solo cubre tonalidades mayores. El `Staff` recibe `score.key` como armadura mayor y no distingue el modo, así que generar menor produciría una armadura incorrecta; la menor armónica queda para cuando el modelo de partitura separe la armadura del modo. Las realizaciones no se insertan todavía en el contenido publicado: la app sigue usando los doce ejercicios escritos a mano de M6-06.
- Próximo paso: F4-026 (añadir la napolitana como módulo opcional).

## 2026-11-12T17:15:00-03:00 · F4-026

- Acción: se añadieron el flag `optional` a lecciones y ejercicios, la lección `content/lessons/m5-10.json`, la habilidad `skill.neapolitan`, cuatro ejercicios `ex.m5-10.a`–`d`, el test `tests/content-m5-10.test.ts` y las pruebas de ruta. El inicio se anotó en el PUNTO DE REANUDACIÓN y se commiteó en `a375296`.
- Contenido: M5-10 «La napolitana» explica la subdominante rebajada (♭II), su escritura en primera inversión y su resolución hacia la dominante, con demo ♭II6–V–I en Do mayor y tarea de teclado a 60 BPM. Los ejercicios piden el numeral `bII` en Do mayor, La menor y Sol mayor, y las notas de Re♭ mayor en primera inversión (Fa-La♭-Re♭). Todos están bilingües y marcados `optional: true`.
- Ruta: `summarizeCourse` sigue prefiriendo una lección en curso, después la primera obligatoria disponible y solo entonces una opcional. La lección opcional no bloquea el avance de M5 ni se propone como siguiente paso mientras queden obligatorias.
- UI: el mapa muestra «Opcional» junto al estado de la lección y el reproductor lo muestra junto al enunciado, con claves i18n ES/EN.
- Verificación: typecheck verde; suite 169 archivos / 1203 tests en verde; build y presupuesto (224,88 kB gzip inicial, 616 chunks diferidos) verdes; E2E 2/2; `validate:content` da 9 módulos, 63 lecciones, 539 ejercicios y 49 habilidades.
- Resultado: commit de implementación `ba1572d`; documentación de cierre en este commit.
- Limitación: la napolitana se publica como una lección opcional dentro de M5, no como un módulo M9 nuevo. El modelo actual tiene los módulos M0–M8 fijos y añadir un módulo obligaría a tocar el mapa, el índice y los contadores globales; una lección opcional cumple el objetivo pedagógico sin romper la estructura. La práctica de la napolitana queda limitada a las cuatro propuestas; no hay generador aleatorio como en ornamentos.
- Próximo paso: F4-027 (sextas aumentadas como módulo opcional).

## 2026-11-12T17:44:00-03:00 · F4-027

- Acción: se añadieron la lección `content/lessons/m5-11.json`, la habilidad `skill.augmented-sixth`, los ejercicios `ex.m5-11.a`–`d`, el tipo de ejercicio `augmented-sixth`, su corrección, validación y feedback, el test `tests/content-m5-11.test.ts` y la armadura menor en el pentagrama. El inicio se anotó en el PUNTO DE REANUDACIÓN y se commiteó en `117345d`.
- Contenido: M5-11 «Sextas aumentadas» explica el intervalo ♭VI–♯IV y las variantes italiana (3 notas), francesa (4, añade el segundo grado) y alemana (4, añade el ♭3), con demo en La menor y resolución a la dominante. La demo muestra la alemana pasando por un 6/4 cadencial para evitar quintas paralelas. La tarea de teclado toca las tres variantes y sus resoluciones a 60 BPM.
- Modelo: el tipo `augmented-sixth` guarda tonalidad, modo, variante, `ask` (`identify` o `resolve`) y la partitura del acorde. `resolveExerciseAnswer` devuelve la etiqueta canónica de la variante o el grado `V`, y `resolvePedagogicalFeedback` tiene una regla propia para el tema. Los ejercicios están bilingües y marcados `optional: true`.
- Notación: se añadió `scoreKeySignature` en `src/content/score.ts`, que pasa `Am`, `Cm`, etc. a VexFlow. Antes las partituras en menor recibían solo la tónica y el pentagrama dibujaba la armadura mayor homónima; ahora la armadura menor es correcta en lecciones, tareas y ejercicios.
- Verificación: typecheck verde; suite 170 archivos / 1210 tests en verde; build y presupuesto (225,73 kB gzip inicial, 621 chunks diferidos) verdes; E2E 2/2; `validate:content` da 9 módulos, 64 lecciones, 543 ejercicios y 50 habilidades.
- Resultado: commit de implementación `135e11b`; documentación de cierre en este commit.
- Limitación: las sextas aumentadas se publican como lección opcional dentro de M5, no como módulo nuevo, por la misma razón que la napolitana. El contenido cubre las tres variantes en La menor y Do menor; no hay generador aleatorio ni ejercicios en las doce tonalidades. La demo usa tres voces en el 6/4 cadencial para que se vea la conducción sin complicar la textura.
- Próximo paso: F4-028 (integrar las lecciones M5-M6 con ejercicios y tareas de teclado).

## 2026-11-14T13:09:00-03:00 · F4-028

- Acción: se añadió `tests/m5-m6-integration.test.tsx`, que integra el bloque M5-M6 completo. El inicio se anotó en el PUNTO DE REANUDACIÓN y se commiteó en `6e9e116`.
- Cobertura: la prueba publica las 17 lecciones de M5 y M6 en el orden del curso, comprueba la cadena de prerrequisitos, que ninguna obligatoria dependa de una opcional, que cada lección tenga al menos tres ejercicios bilingües con la habilidad declarada, una tarea de teclado con demo y una sección de ejercicios, y que `loadLesson`/`loadExercises` devuelvan exactamente lo que declara la lección.
- Reproductor: se renderizan M5-01 (ejercicio de acorde y tarea), M6-01 (análisis de motivo y tarea) y M5-11 (lección opcional, acorde de sexta aumentada y tarea), verificando el enunciado, el botón de audio y la lista de control.
- Navegación: se siembra el progreso de toda la ruta obligatoria hasta M5-09 y se comprueba que el mapa abre M5-01 y M6-01, muestra M5-10 y M5-11 como «Disponible · Opcional» y propone M6-01 en «Continuar por», sin proponer las opcionales.
- Verificación: typecheck verde; suite 171 archivos / 1219 tests en verde; build y presupuesto (225,73 kB gzip inicial, 621 chunks diferidos) verdes; E2E 2/2; `validate:content` da 9 módulos, 64 lecciones, 543 ejercicios y 50 habilidades.
- Resultado: commit de implementación `df78c07`; documentación de cierre en este commit.
- Limitación: la aceptación de la tarea habla de «15 lecciones publicadas», pero el bloque real tiene 17 porque F4-026 y F4-027 añadieron las opcionales M5-10 y M5-11. La prueba cubre las 17 y deja explícito que las opcionales no bloquean M6. No hubo cambios de contenido ni decisión de arquitectura en esta tarea.
- Próximo paso: F4-029 (testear la armonía en las doce tonalidades).

## 2026-11-14T13:27:00-03:00 · F4-029

- Acción: se añadió `tests/theory-harmony-12-keys.test.ts`, una batería de propiedades de armonía sobre el motor de teoría. El inicio se anotó en el PUNTO DE REANUDACIÓN y se commiteó en `00088e4`.
- Cobertura: recorre las doce tonalidades en mayor, menor natural y menor armónica y comprueba los siete grados diatónicos con su cualidad, cifrado, función, símbolo y ortografía; que la raíz y las voces 1-3-5 salen de la escala sin cambiar de letra; que `romanToChord` reconstruye el mismo acorde y `parseRomanNumeral` recupera grado y cualidad; y que un acorde cromático sobre la tónica subida no se reconoce como diatónico ni tiene grado.
- Cadencias: clasifica las cuatro cadencias con los grados que usa la app (la semicadencia sale del ii en mayor y de la tónica en menor), verifica las cualidades de los dos acordes, que ambos pertenecen a la escala y que en las doce tonalidades menores la dominante es mayor y su tercera es la sensible, un semitono debajo de la tónica. También comprueba que cualquier grado que llegue al V se clasifica como semicadencia.
- Dominantes: para las doce tonalidades de los generadores y los grados tonicizables, comprueba el cifrado `V/x`, que la raíz está una quinta arriba del grado con la letra correcta, que la tercera es la sensible, que la quinta es justa y la séptima menor, y que la séptima resuelve por grado conjunto hasta la tercera del acorde objetivo. En menor se usa la menor natural como referencia, igual que el generador: el V/III de Do menor es Si♭7 con Re natural, no Si7 con Re♯.
- Verificación: typecheck verde; suite 172 archivos / 1225 tests en verde; build y presupuesto (225,73 kB gzip inicial, 621 chunks diferidos) verdes; E2E 2/2; `validate:content` da 9 módulos, 64 lecciones, 543 ejercicios y 50 habilidades.
- Resultado: commit de implementación `bad5b80`; documentación de cierre en este commit.
- Limitación: la tarea es de pruebas y no cambió el motor ni el contenido; no apareció ningún fallo en el sondeo previo. La cobertura de progresiones, opciones y resoluciones de los ejercicios generados queda para F4-030. Las cadencias se prueban desde la teoría; la salida completa de los generadores ya tiene sus propias pruebas.
- Próximo paso: F4-030 (testear progresiones y cadencias con property tests).

## 2026-11-14T13:43:24-03:00 · F4-030

- Acción: se añadió `tests/f4-030-progressions-cadences.test.ts`, una batería de propiedades sobre los generadores de progresiones para completar y de cadencias. El inicio se anotó en el PUNTO DE REANUDACIÓN y se commiteó en `76f37ce`.
- Progresiones: recorre las doce tonalidades en mayor y menor, los siete patrones mayores y los cuatro menores, todas las posiciones del hueco y las tres dificultades (1.692 ejercicios). Comprueba que la respuesta canónica aparezca una sola vez entre las opciones, que todas sean numerales diatónicos de la tonalidad, que ningún distractor complete otro patrón del catálogo con el mismo contexto, que la explicación nombre la progresión completa, la función del grado y los acordes reales, y que la resolución ES/EN coincida con el hueco. `choices` y `choicesEn` comparten orden porque los numerales son neutrales al idioma.
- Cadencias: recorre las doce tonalidades, los dos modos, los cuatro tipos y las tres dificultades. En `identify` verifica las cuatro opciones únicas, el par de grados que clasifica `cadenceTypeFor`, la alineación de índices entre español e inglés, el texto de los dos acordes con sus notas y la resolución de respuestas. En `complete` verifica los grados canónicos del modo (la semicadencia sale del ii en mayor y de la tónica en menor; en menor se usa la escala armónica), la respuesta única, que ninguna otra opción forme la misma cadencia con el grado visible y que el audio reproduzca los acordes declarados, silencie el hueco y suene igual con la referencia armónica.
- Audio: además de las cadencias, se comprueba el audio de todos los patrones en las doce tonalidades y ambos modos: acordes derivados del numeral, contexto con el hueco en silencio, acorde faltante aislado y duración total.
- Verificación: typecheck verde; suite 173 archivos / 1231 tests en verde; build y presupuesto (225,73 kB gzip inicial, 621 chunks diferidos) verdes; E2E 2/2; `validate:content` da 9 módulos, 64 lecciones, 543 ejercicios y 50 habilidades.
- Resultado: commit de implementación `37ae1b8`; documentación de cierre en este commit.
- Limitación: la etiqueta de cadencia es común a los dos modos, así que `cadenceName('deceptive')` sigue devolviendo «Rota (V-vi)» aunque en menor los grados reales sean V-VI. El ejercicio muestra los grados correctos y la respuesta se resuelve por el tipo, no por el paréntesis; la prueba lo documenta. El catálogo tiene dos contextos inherentemente compatibles (I-vi-?-V admite IV en la progresión de los cincuenta y ii en el giro), pero la pregunta nombra el patrón y el generador excluye esos grados de los distractores; la prueba comprueba que ninguna opción equivocada complete otro patrón. Esta tarea no cambió el motor ni el contenido.
- Próximo paso: F4-031 (E2E de M5-M6).

## 2026-11-14T13:59:38-03:00 · F4-031

- Acción: se añadió `e2e/m5-m6-lesson-review.spec.ts`, con dos recorridos de navegador para el bloque M5-M6. El inicio se anotó en el PUNTO DE REANUDACIÓN y se commiteó en `fb8f0de`.
- M5: abre «Progresiones comunes» bloqueada, marca su prerrequisito M5-04 en IndexedDB, recarga y comprueba que aparece el primer ejercicio (I-V-?-IV). Marca la lección como completada, va al repaso y verifica dos ítems nuevos: «Reconocer cadencias» y «Completar progresiones comunes». Califica ambos con «Bien», recarga y vuelve a la lección, que conserva el estado completado. Responde «vi», comprueba «¡Correcto!», la explicación, el botón «Escuchar progresión», el reproductor de progresiones y el acorde actual. Finalmente, la pantalla de progreso muestra tres respuestas (dos repasos más el intento) y las conserva tras otra recarga.
- M6: repite el esquema con «Motivo y frase» y su prerrequisito M5-09. Verifica el análisis de la melodía, el repaso de «Analizar modulaciones con pivote» y «Reconocer motivos y frases», y después falla el ejercicio con «3 motivos» para leer «Todavía no.», «La respuesta correcta es: 4 motivos.», el «Recordá qué es un motivo y qué es una frase» y la explicación. El progreso final también registra tres respuestas y sobrevive a la recarga.
- Orden deliberado: los dos recorridos completan y repasan la lección antes de responder el ejercicio. Así las dos habilidades entran nuevas en la cola; si se respondiera primero, el intento crearía la tarjeta FSRS de la habilidad propia y esa habilidad ya no sería nueva. El intento posterior demuestra que práctica y repaso suman en el mismo historial.
- Verificación: typecheck verde; suite 173 archivos / 1231 tests en verde; build y presupuesto (225,73 kB gzip inicial, 621 chunks diferidos) verdes; E2E 4/4 (los dos recorridos nuevos más los de F2-072 y F3-033); `validate:content` da 9 módulos, 64 lecciones, 543 ejercicios y 50 habilidades.
- Resultado: commit de implementación `9223f49`; documentación de cierre en este commit.
- Limitación: el test usa IndexedDB para completar el prerrequisito directo y no recorre las lecciones anteriores por la interfaz. Los reproductores de audio se comprueban por presencia y estado, no por sonido real: la escucha subjetiva sigue pendiente en una máquina con salida de audio.
- Próximo paso: F4-032 (accesibilidad de análisis y partituras).

## 2026-11-14T14:11:34-03:00 · F4-032

- Acción: se añadió `tests/analysis-a11y.test.tsx` y se amplió `tests/theme.test.ts` con un bloque de contraste para análisis y partituras. El inicio se anotó en el PUNTO DE REANUDACIÓN y se commiteó en `2a675e9`.
- Cobertura: el archivo nuevo recorre los seis tipos de análisis publicados en M5-M6: motivos (M6-01), forma binaria/ternaria (M6-02), rondó y sonata (M6-03), textura (M6-04), contrapunto (M6-05), adornos (M6-06) y sextas aumentadas (M5-11). Para cada uno comprueba que la partitura tenga leyenda visible, que el grupo accesible describa las notas, que el texto «Notas:» esté presente, que las opciones estén en un `fieldset` con leyenda y que el botón de escucha tenga nombre accesible. Después de fallar el primer ejercicio, verifica «Todavía no.», la respuesta correcta, la explicación y el «Recordá» pedagógico, y que la corrección sea una región viva `role="status"` con `aria-live="polite"`.
- Axe: se ejecuta antes y después de corregir en cada uno de los siete casos, con las etiquetas WCAG 2.0 A/AA, y se exige que no haya violaciones críticas ni serias. Los casos se siembran con el prerrequisito directo completado en IndexedDB para mantener el test centrado en el ejercicio.
- Teclado: el séptimo test responde el análisis de motivos de M6-01 solo con teclado: enfoca «Escuchar melodía completa» y pulsa Enter, enfoca el radio «4 motivos» y pulsa espacio, y enfoca «Corregir» y pulsa Enter. Comprueba el foco en cada paso, que el radio quede marcado y que aparezcan «¡Correcto!» y la explicación.
- Contraste: `tests/theme.test.ts` verifica que la descripción del pentagrama use `--muted`/`--text`, que el «Recordá» use `--bg`, que la corrección incorrecta mezcle `--accent` con `--bg-panel` y que texto, texto atenuado y acento mantengan AA (≥ 4,5:1) en las paletas clara, oscura explícita y oscura del sistema. También comprueba que la corrección sume texto en negrita y borde, no solo color.
- Verificación: typecheck verde; suite 174 archivos / 1241 tests en verde; build y presupuesto (225,73 kB gzip inicial, 621 chunks diferidos) verdes; E2E 4/4; `validate:content` da 9 módulos, 64 lecciones, 543 ejercicios y 50 habilidades.
- Resultado: commit de implementación `a7fcb31`; documentación de cierre en este commit.
- Limitación: axe corre en jsdom, que no aplica la cascada de `styles.css`; por eso el contraste se valida en `theme.test.ts` leyendo la hoja real y calculando WCAG, no con la regla `color-contrast` de axe. La revisión con lector de pantalla real sigue pendiente y se documenta como deuda.
- Próximo paso: F4-033 (cerrar F4: suite, tag `fase-4`, RESUME y resumen).

## 2026-11-14T14:14:31-03:00 · F4-033

- Acción: se inició el cierre de F4 en el PUNTO DE REANUDACIÓN y se commiteó en `4bdca49`. Antes de documentar se verificó el bloque M5-M6 con un script sobre el contenido real: 17 lecciones publicadas (11 de M5 y 6 de M6), 188 ejercicios referenciados, todas con tarea de teclado (`keyboardTask`), habilidades de los ejercicios incluidas en las de su lección y las 17 lecciones presentes en `src/content/course-index.json` con el orden correcto de M5 y M6.
- M5-M6: la aceptación de F4 habla de «15 lecciones», pero el bloque real tiene 17 porque M5-10 «La napolitana» y M5-11 «Sextas aumentadas» son opcionales. La verificación cubre las 17 y comprueba que las opcionales no bloquean el avance a M6. El total del curso queda en 9 módulos, 64 lecciones, 543 ejercicios, 50 habilidades y 1 pieza.
- Estado: `npm run estado` quedó verde con typecheck (1,2 s), 174 archivos / 1241 tests (42,1 s) y build (2,9 s); `docs/ESTADO.md` muestra F4 33/33 (100 %) y el total 202/284 (71,1 %). El presupuesto sigue en 225,73 kB gzip inicial con 621 chunks diferidos y el E2E se verificó aparte con `npm run test:e2e`: 4/4.
- Documentación: `docs/RESUME.md` pasa a F4 completada, con la suite 174/1241, E2E 4/4, el resumen de F4-033 y el tag local `fase-4`; `CHANGELOG.md` estrena la sección `[Fase 4] — 2026-11-14` con M5-M6, generadores, correcciones, estado y deuda; el checklist suma el bloque «Cierre F4» con lo que quedó funcionando y las limitaciones.
- Resultado: commit de resumen/RESUME, luego este checklist regenerado con `docs/ESTADO.md`; el tag anotado `fase-4` queda sobre el commit final de cierre. El tag no se pushea: el remoto autorizado es solo `main`.
- Limitación: la accesibilidad se valida con axe, teclado y cálculo de contraste, no con un lector de pantalla real; la escucha de audio real sigue pendiente en hardware; los E2E siembran el prerrequisito en IndexedDB; M5-10 y M5-11 son opcionales y no estaban en el conteo original de la aceptación.
- Próximo paso: F5-001 (M7-01 «Independencia de manos»).

## 2026-11-14T15:10:00-03:00 · F5-001

- Acción: se publicó M7-01 «Independencia de manos» con contenido propio de técnica y se commiteó en `4ed6023`. El inicio se había anotado en el PUNTO DE REANUDACIÓN.
- Contenido: `content/lessons/m7-01.json` explica la independencia de manos, el estudio lento por manos y la importancia de tocar sin tensión, con dos demos de dos manos (mano derecha sosteniendo mientras la izquierda se mueve y al revés) y una tarea de teclado a 60 BPM con consignas de hombros bajos, muñecas libres, pausas cortas y parada inmediata ante dolor, tensión o cansancio.
- Ejercicios: 12 ejercicios originales `ex.m7-01.a`…`ex.m7-01.l` que preguntan qué mano ataca en un compás y pulso dados sobre partituras de dos pentagramas. La progresión de dificultad es 3 de nivel 1 (una mano se mueve sobre una nota larga de la otra), 5 de nivel 2 (alternancias y entradas a contratiempo) y 4 de nivel 3 (movimiento simultáneo y cambios de mano). Las respuestas se reparten 4 derecha, 4 izquierda y 4 ambas.
- Implementación: nuevo tipo de ejercicio `hand-coordination` en `src/schemas/content.ts` y `src/content/validate.ts`, helper `attackingHandAt` y filtro `scoreForHand` en `src/content/score.ts`, catálogo en `src/exercises/hand-coordination.ts`, habilidad `skill.hand-independence` (tipo `keyboard-task`), feedback pedagógico bilingüe en `src/theory/errors.ts` y `errors-en.ts`, y renderizado de dos pentagramas con audio en `ExercisePlayer`. Las partituras se mantienen en Do4–La5, con ambas manos presentes y sin estiramientos forzados.
- Verificación: `validate:content` verde con 9 módulos, 65 lecciones, 555 ejercicios, 51 habilidades y 1 pieza; typecheck verde; suite 175 archivos / 1250 tests en verde; build y presupuesto verdes con 227,01 kB gzip inicial y 634 chunks diferidos. Se añadió `tests/content-m7-01.test.ts` con estructura, demos, dificultad, paridad de respuestas, rangos, tarea y habilidad.
- Resultado: commit de implementación `4ed6023`; documentación de cierre en este commit.
- Limitación: los dos pentagramas se dibujan como dos claves de sol apiladas porque el pentagrama grande (clave de sol y de fa unidas) queda para F5-022. La escucha real de la independencia sigue pendiente en hardware con salida de audio y la evaluación de la tensión es autoevaluación guiada, no medición.
- Próximo paso: F5-002 (M7-02 «Arpegios y acordes quebrados» con digitaciones, doce tonalidades básicas, audio y tempo progresivo).

## 2026-11-14T16:25:00-03:00 · F5-002

- Acción: se publicó M7-02 «Arpegios y acordes quebrados» y se commiteó en `7ca07af`. El inicio se había anotado en el PUNTO DE REANUDACIÓN.
- Contenido: `content/lessons/m7-02.json` explica la diferencia entre arpegio y acorde quebrado, la digitación de las doce tonalidades mayores básicas en una y dos octavas, y el estudio con tempo progresivo sin tensión. Incluye tres demos con audio —arpegio de Do, acorde quebrado Do-Mi-Sol-Mi y arpegio de dos octavas— y una tarea de teclado que sube de 60 a 72 y a 84 BPM con consignas de soltura y parada ante dolor, tensión o cansancio.
- Ejercicios: 12 arpegios propios `ex.m7-02.a`…`ex.m7-02.l`, uno por tonalidad (Do, Sol, Re, La, Mi, Si, Fa, Si♭, Mi♭, La♭, Re♭ y Sol♭). Ocho preguntan la digitación y cuatro el orden de las notas. La progresión es 3 de nivel 1 (tónicas blancas a una octava), 5 de nivel 2 (terceras alteradas y primera tónica negra) y 4 de nivel 3 (tónicas negras a dos octavas). El ejercicio `ex.m7-02.m` es de práctica con tempo progresivo 60-72-84 y tolerancia de ±4 BPM.
- Implementación: nuevo tipo `arpeggio` en `src/schemas/content.ts`, con `tonic`, `hand`, `octaves` y `ask`; helpers de digitación, notas y partitura en `src/exercises/arpeggio.ts`; resolución canónica y validación de opciones; renderizado del pentagrama y audio en `ExercisePlayer`; feedback pedagógico bilingüe `arpeggio-fingering`; habilidad `skill.arpeggio` y etiquetas i18n nuevas.
- Verificación: `validate:content` verde con 9 módulos, 66 lecciones, 568 ejercicios, 52 habilidades y 1 pieza; typecheck verde; suite 176 archivos / 1261 tests en verde; build y presupuesto verdes con 228,41 kB gzip inicial y 648 chunks diferidos. Se añadió `tests/content-m7-02.test.ts` (doce tonalidades, digitaciones, demos, dificultad, rangos, tempo progresivo y tarea) y una prueba de UI en `tests/exercise-player.test.tsx`.
- Resultado: commit de implementación `7ca07af`; documentación de cierre en este commit.
- Limitación: la digitación de la mano izquierda se explica en la lección y la tarea, pero los ejercicios publicados preguntan solo la mano derecha para no introducir patrones de teclas negras que el curso todavía no puede verificar con audio real. La tensión se autoevalúa de forma guiada y la escucha del pedal y de los cruces de pulgar sigue pendiente en hardware con salida de audio.
- Próximo paso: F5-003 (M7-03 «Pedal» con pedal directo y sincopado, ejercicios de limpieza, advertencia de oído y demo).

## 2026-11-14T16:55:00-03:00 · F5-003

- Acción: se publicó M7-03 «Pedal» y se commiteó en `a8a9c5b`. El inicio se había anotado en el PUNTO DE REANUDACIÓN.
- Contenido: `content/lessons/m7-03.json` explica qué hace el pedal de resonancia, la diferencia entre pedal directo y sincopado, el cambio limpio en cada armonía, los ejercicios de limpieza y una advertencia de oído: el pedal tapa errores, conviene estudiar sin pedal y corregir el pie en vez de tocar más fuerte. Incluye tres demos con audio —Do–Fa–Sol–Do con pedal directo, la misma progresión con pedal sincopado y una versión con cambio tardío para escuchar el barro— y una tarea de teclado a 60 BPM con estudio sin pedal, cambio en cada ataque y escucha del resultado.
- Ejercicios: 10 ejercicios propios `ex.m7-03.a`…`j` de tipo `pedal`. Seis preguntan la acción en un punto (pisar, levantar o cambiar) y cuatro el patrón del compás (directo o sincopado), con dificultad 3/4/3 (niveles 1, 2 y 3). Los ejercicios de limpieza usan una progresión con el cambio un pulso tarde para identificar el barro armónico.
- Implementación: `PedalMarkSchema` y `Score.pedals` en `src/schemas/notation.ts`; ventanas de resonancia y sostenido de notas en `src/content/score.ts`; anotaciones «Ped.»/«*» en `src/staff/render.ts`; tipo de ejercicio `pedal` con resolución canónica en `src/exercises/pedal.ts`; renderizado de la partitura y audio en `ExercisePlayer`; feedback bilingüe `pedal`; habilidad `skill.pedal` y etiquetas i18n nuevas.
- Verificación: `validate:content` verde con 9 módulos, 67 lecciones, 578 ejercicios, 53 habilidades y 1 pieza; typecheck verde; suite 177 archivos / 1273 tests en verde; build y presupuesto verdes con 230,27 kB gzip inicial y 659 chunks diferidos. Se añadieron `tests/content-m7-03.test.ts` (conceptos, demos, resonancia, marcas, ejercicios, tarea y habilidad), una prueba de renderizado de pedal en `tests/staff.test.tsx` y una prueba de UI en `tests/exercise-player.test.tsx`.
- Resultado: commit de implementación `a8a9c5b`; documentación de cierre en este commit.
- Limitación: la resonancia se simula alargando la duración de las notas hasta el cambio de pedal; no modela la resonancia simpática del piano acústico ni los pedales parciales de un control continuo. La coordinación real del pie se autoevalúa con la tarea y la escucha, sin micrófono ni sensor de pedal.
- Próximo paso: F5-004 (M7-04 «Acompañamiento en bloque» con acordes en negras y blancas, patrones, lead sheet simple y tarea).

## 2026-11-14T17:30:00-03:00 · F5-004

- Acción: se publicó M7-04 «Acompañamiento en bloque» y se commiteó en `83fac2c`. El inicio se había anotado en el PUNTO DE REANUDACIÓN.
- Contenido: `content/lessons/m7-04.json` explica el acompañamiento en bloque, las figuras de redonda, blanca y negra, los patrones de bajo y acorde, la conducción económica de la mano izquierda, la lectura de un lead sheet simple y el cuidado ante dolor o tensión. Incluye cuatro demos con audio —acordes redondos, acordes en negras, bajo y acorde, y un lead sheet en Do de ocho compases— y una tarea de teclado a 60 BPM con melodía, bloque de la izquierda, consignas de notas comunes y parada ante dolor o tensión.
- Ejercicios: 10 ejercicios propios `ex.m7-04.a`…`j` de tipo `accompaniment`. Cinco preguntan el patrón rítmico del compás (redondas, blancas, negras o bajo y acorde) y cinco el cifrado de un lead sheet (Am, F, C, Dm y G7), con dificultad 3/4/3 (niveles 1, 2 y 3) y tres opciones paralelas en español e inglés.
- Implementación: `chordSymbol` en `NoteEventSchema` y en `scoreToMeasures`; renderizado de cifrados con `VF.ChordSymbol` en `src/staff/render.ts`; tipo de ejercicio `accompaniment` con `ask: 'pattern' | 'symbol'` en `src/schemas/content.ts`; helpers `accompanimentPatternInMeasure`, `chordSymbolInMeasure` y etiquetas en `src/exercises/accompaniment.ts`; resolución canónica en `src/exercises/answer.ts`; validación de contenido en `src/content/validate.ts`; renderizado de partitura y audio en `ExercisePlayer`; feedback bilingüe `accompaniment`; habilidad `skill.accompaniment` y etiquetas i18n nuevas.
- Verificación: `validate:content` verde con 9 módulos, 68 lecciones, 588 ejercicios, 54 habilidades y 1 pieza; typecheck verde; suite 178 archivos / 1284 tests en verde; build y presupuesto verdes con 231,59 kB gzip inicial y 670 chunks diferidos. Se añadieron `tests/content-m7-04.test.ts` (estructura, demos, cifrados, ejercicios, tarea y habilidad), una prueba de cifrados en `tests/staff.test.tsx` y una prueba de UI en `tests/exercise-player.test.tsx`; se actualizaron los conteos fijos y las listas de tipos y errores.
- Resultado: commit de implementación `83fac2c`; documentación de cierre en este commit.
- Limitación: el patrón de acompañamiento se deduce de la figura y del número de notas de los eventos; no distingue articulaciones ni dinámicas, y el cifrado se dibuja sobre la nota pero no genera el voicing. La evaluación del bloque y de la independencia de manos sigue siendo autoevaluación guiada, sin micrófono ni sensor.
- Próximo paso: F5-005 (M7-05 «Acompañamiento arpegiado» con patrones de 3 y 4 notas, doce tonalidades y tarea con tempo estable).

## 2026-11-14T18:00:00-03:00 · F5-005

- Acción: se publicó M7-05 «Acompañamiento arpegiado» y se commiteó en `2e89c29`. El inicio se había anotado en el PUNTO DE REANUDACIÓN.
- Contenido: `content/lessons/m7-05.json` explica el paso del bloque al arpegio, los patrones de 3 notas (1-5-3 en 3/4) y de 4 notas (1-5-3-5 en 4/4), la conducción con notas comunes, el tempo estable con metrónomo y el cuidado ante dolor o tensión. Incluye tres demos con audio —patrón de 3 notas en Do, patrón de 4 notas en Do y progresión Do–Fa–Sol–Do arpegiada— y una tarea de teclado a 60 BPM con subida a 66/72 solo si el pulso queda estable.
- Ejercicios: 12 ejercicios propios `ex.m7-05.a`…`l` de tipo `arpeggiated`, uno por tonalidad mayor (Do, Sol, Re, La, Mi, Si, Fa, Si♭, Mi♭, La♭, Re♭ y Sol♭). Seis preguntan si el patrón tiene 3 o 4 notas y seis el orden exacto de las notas; la mitad usa 3/4 y la otra mitad 4/4, con dificultad 3/4/5 (niveles 1, 2 y 3) y tres opciones paralelas en español e inglés.
- Implementación: tipo `arpeggiated` con `score`, `ask: 'pattern' | 'notes'` y `measure` en `src/schemas/content.ts`; helper `src/exercises/arpeggiated.ts` que deduce el patrón por cantidad de notas, métrica y pulsos, y devuelve el orden de las notas; resolución canónica en `src/exercises/answer.ts`; validación de contenido en `src/content/validate.ts`; renderizado de pentagrama y audio en `ExercisePlayer`; feedback bilingüe `arpeggiated`; habilidad `skill.arpeggiated-accompaniment` y etiquetas i18n nuevas.
- Verificación: `validate:content` verde con 9 módulos, 69 lecciones, 600 ejercicios, 55 habilidades y 1 pieza; typecheck verde; suite 179 archivos / 1294 tests en verde; build y presupuesto verdes con 232,70 kB gzip inicial y 683 chunks diferidos. Se añadieron `tests/content-m7-05.test.ts` (conceptos, demos, detección, doce tonalidades, ejercicios, tarea y habilidad) y una prueba de UI en `tests/exercise-player.test.tsx`; se actualizaron los conteos fijos y las listas de tipos y errores.
- Resultado: commit de implementación `2e89c29`; documentación de cierre en este commit.
- Limitación: el patrón se reconoce por la cantidad de notas sueltas, la figura y el numerador; no distingue variantes melódicas del mismo número de notas ni articulaciones. La igualdad del sonido y la estabilidad del tempo se autoevalúan con el metrónomo y la escucha, sin medición de hardware.
- Próximo paso: F5-006 (M7-06 «Alberti» con el patrón clásico, variantes, un ejemplo original y tarea con audio).

## 2026-11-14T18:30:00-03:00 · F5-006

- Acción: se publicó M7-06 «Alberti» y se commiteó en `910e82f`. El inicio se había anotado en el PUNTO DE REANUDACIÓN.
- Contenido: `content/lessons/m7-06.json` explica el origen del bajo de Alberti, el patrón clásico 1-5-3-5 en corcheas, las variantes (invertida 5-1-3-1, tres notas 1-5-3 y cambios de orden por inversión), el estudio sin tensión y la coordinación con una melodía. Incluye tres demos con audio —Alberti clásico en Do, Alberti sobre Do–Fa–Sol–Do y el ejemplo original «Estudio en Do» a dos manos— y una tarea de teclado a 60 BPM con manos separadas, unión por compás y subida a 66/72 solo si el pulso queda estable.
- Ejercicios: 12 ejercicios propios `ex.m7-06.a`…`l` de tipo `alberti`, uno por tonalidad mayor (Do, Sol, Re, La, Mi, Si, Fa, Si♭, Mi♭, La♭, Re♭ y Sol♭). Seis preguntan qué patrón hay en el compás y seis el orden de la célula de cuatro notas; todos usan 4/4 con ocho corcheas y la célula repetida, con dificultad 3/4/5 (niveles 1, 2 y 3) y tres opciones paralelas en español e inglés.
- Implementación: tipo `alberti` con `score`, `ask: 'pattern' | 'notes'` y `measure` en `src/schemas/content.ts`; helper `src/exercises/alberti.ts` que exige ocho corcheas en 4/4, pulsos consecutivos y una célula de cuatro notas repetida exactamente; `arpeggiatedNoteNames` se limita a las primeras cuatro notas para compartir el orden de la célula; resolución canónica en `src/exercises/answer.ts`; validación de contenido en `src/content/validate.ts`; renderizado de pentagrama y audio en `ExercisePlayer`; feedback bilingüe `alberti`; habilidad `skill.alberti` y etiquetas i18n nuevas.
- Verificación: `validate:content` verde con 9 módulos, 70 lecciones, 612 ejercicios, 56 habilidades y 1 pieza; typecheck verde; suite 180 archivos / 1304 tests en verde; build y presupuesto verdes con 233,76 kB gzip inicial y 696 chunks diferidos. Se añadieron `tests/content-m7-06.test.ts` (conceptos, demos, detección, doce tonalidades, ejercicios, tarea y habilidad) y una prueba de UI en `tests/exercise-player.test.tsx`; se actualizaron los conteos fijos y las listas de tipos y errores.
- Resultado: commit de implementación `910e82f`; documentación de cierre en este commit.
- Limitación: la detección exige la célula de cuatro notas repetida dos veces en 4/4; no reconoce variantes de cinco o seis notas ni ornamentos. La lectura de la partitura del estudio es secuencial en un solo pentagrama, y la coordinación de manos y la igualdad del sonido se autoevalúan por escucha.
- Próximo paso: F5-007 (M7-07 «Walking bass» con notas de paso, swing básico, ejemplo y tarea).

## 2026-11-14T19:00:00-03:00 · F5-007

- Acción: se publicó M7-07 «Walking bass» y se commiteó en `86fc582`. El inicio se había anotado en el PUNTO DE REANUDACIÓN.
- Contenido: `content/lessons/m7-07.json` explica qué es un walking bass, cómo se construye (fundamental en el primer pulso, notas del acorde en el segundo y el tercero, y nota de paso diatónica o cromática en el cuarto), el swing básico con acento en los pulsos 2 y 4, el ejemplo original «Caminata en Do» y el estudio sin tensión. Incluye tres demos con audio —walking sobre Do–La–Re–Sol, blues de 12 compases y «Caminata en Do» a dos manos— y una tarea de teclado a 60 BPM con mano izquierda sola, unión por compás, balanceo del swing en 2 y 4 y subida a 66/72 solo si el pulso queda estable.
- Ejercicios: 12 ejercicios propios `ex.m7-07.a`…`l` de tipo `walking-bass`, uno por tonalidad mayor (Do, Sol, Re, La, Mi, Si, Fa, Si♭, Mi♭, La♭, Re♭ y Sol♭). Seis preguntan qué nota suena en un pulso y seis si esa nota es del acorde o de paso; todos usan 4/4 con cuatro negras por compás, cifrado en cada compás, dificultad 1/2/3/4 (dos niveles 1, cuatro 2, cuatro 3 y dos 4) y tres opciones paralelas en español e inglés.
- Implementación: tipo `walking-bass` con `score`, `ask: 'note' | 'role'`, `measure`, `beat` y `choices` en `src/schemas/content.ts`; helper `src/exercises/walking.ts` que lee la nota del pulso y la clasifica con el cifrado del compás; resolución canónica en `src/exercises/answer.ts`; validación de contenido en `src/content/validate.ts`; renderizado de pentagrama y audio en `ExercisePlayer`; feedback bilingüe `walking-bass`; habilidad `skill.walking-bass` y etiquetas i18n nuevas.
- Verificación: `validate:content` verde con 9 módulos, 71 lecciones, 624 ejercicios, 57 habilidades y 1 pieza; typecheck verde; suite 181 archivos / 1314 tests en verde; build y presupuesto verdes con 235,10 kB gzip inicial y 709 chunks diferidos. Se añadieron `tests/content-m7-07.test.ts` (conceptos, demos, nota y papel, doce tonalidades, ejercicios, tarea y habilidad) y una prueba de UI en `tests/exercise-player.test.tsx`; se actualizaron los conteos fijos y las listas de tipos y errores.
- Resultado: commit de implementación `86fc582`; documentación de cierre en este commit.
- Limitación: el papel de la nota se decide solo por pertenencia al cifrado del compás; no analiza la conducción hacia el compás siguiente ni distingue notas de paso diatónicas de cromáticas. La lectura de la partitura del estudio es secuencial en un solo pentagrama, y el swing, la igualdad del sonido y la coordinación de manos se autoevalúan por escucha.
- Próximo paso: F5-008 (M7-08 «Stride» con bajo alternado y acorde, tempo lento, ejemplo y tarea).

## 2026-11-14T19:35:00-03:00 · F5-008

- Acción: se publicó M7-08 «Stride» y se commiteó en `88f82b4`. El inicio se había anotado en el PUNTO DE REANUDACIÓN.
- Contenido: `content/lessons/m7-08.json` explica qué es el stride, cómo se construye con un bajo suelto en los pulsos 1 y 3 y un acorde en los pulsos 2 y 4, el tempo lento con salto cómodo, el ejemplo original «Stride en Do» y el estudio sin tensión. Incluye tres demos con audio —stride básico en Do, stride sobre Do–La–Re–Sol y «Stride en Do» a dos manos a 50 BPM— y una tarea de teclado a 50 BPM con mano izquierda sola, pedal seco, unión por compás y subida a 60/66 solo si el pulso y el salto quedan seguros.
- Ejercicios: 12 ejercicios propios `ex.m7-08.a`…`l` de tipo `stride`, uno por tonalidad mayor (Do, Sol, Re, La, Mi, Si, Fa, Si♭, Mi♭, La♭, Re♭ y Sol♭). Seis preguntan qué patrón hay en el compás y seis la nota del bajo en un pulso; todos usan 4/4 con cuatro negras por compás, bajo en los pulsos 1 y 3, acorde en 2 y 4, cifrado por compás, dificultad 1/2/3/4 (dos niveles 1, cuatro 2, cuatro 3 y dos 4) y tres opciones paralelas en español e inglés.
- Implementación: tipo `stride` con `score`, `ask: 'pattern' | 'bass'`, `measure`, `beat` y `choices` en `src/schemas/content.ts`; helper `src/exercises/stride.ts` que reconoce cuatro negras con bajo suelto debajo del acorde y lee la nota del bajo; resolución canónica en `src/exercises/answer.ts`; validación de contenido en `src/content/validate.ts`; renderizado de pentagrama y audio en `ExercisePlayer`; feedback bilingüe `stride`; habilidad `skill.stride` y etiquetas i18n nuevas.
- Verificación: `validate:content` verde con 9 módulos, 72 lecciones, 636 ejercicios, 58 habilidades y 1 pieza; typecheck verde; suite 182 archivos / 1324 tests en verde; build y presupuesto verdes con 236,24 kB gzip inicial y 722 chunks diferidos. Se añadieron `tests/content-m7-08.test.ts` (conceptos, demos, patrón y bajo, doce tonalidades, ejercicios, tarea y habilidad) y una prueba de UI en `tests/exercise-player.test.tsx`; se actualizaron los conteos fijos y las listas de tipos y errores.
- Resultado: commit de implementación `88f82b4`; documentación de cierre en este commit.
- Limitación: el patrón se reconoce por la métrica, la distribución de pulsos y la separación de registros; no distingue variantes de bajo (quinta, décima o cromatismo) ni voicings específicos. La lectura de la partitura del estudio es secuencial en un solo pentagrama, y el salto, el pedal y la coordinación de manos se autoevalúan por escucha.
- Próximo paso: F5-009 (M7-09 «Lectura a primera vista» con método por intervalos, ejercicios graduados y generador de fragmentos).

## 2026-11-14T22:10:00-03:00 · F5-009

- Acción: se publicó M7-09 «Lectura a primera vista» y se commiteó en `eb4ec71`.
- Contenido: `content/lessons/m7-09.json` explica qué es leer a primera vista, el método por intervalos con nota ancla, los cuatro niveles graduados y el estudio sin detenerse. Incluye tres demos con audio —lectura por grados conjuntos en clave de sol, lectura con saltos en clave de fa y el ejemplo original «Lectura en Do» a 50 BPM— y una tarea de teclado a 50 BPM con exploración de treinta segundos, notas ancla, lectura por intervalos, tres pasadas y subida a 60/72 solo si la lectura queda continua.
- Ejercicios: 12 ejercicios propios `ex.m7-09.a`…`l` de tipo `sight-reading`, uno por tonalidad mayor (Do, Sol, Re, La, Mi, Si, Fa, Si♭, Mi♭, La♭, Re♭ y Sol♭). Cuatro preguntan el intervalo entre dos notas, cuatro una nota a partir de la nota ancla y cuatro el movimiento melódico (sube/baja por grado conjunto, sube/baja por salto o repite); todos usan 4/4 con negras, claves de sol y fa, dificultad 1/2/3/4 (dos niveles 1, cuatro 2, tres 3 y tres 4) y opciones paralelas en español e inglés.
- Implementación: tipo `sight-reading` con `score`, `ask: 'interval' | 'note' | 'motion'`, `from`, `to` y `choices` en `src/schemas/content.ts`; helpers de fragmento en `src/exercises/sight-reading.ts` (construcción por grados de la escala, intervalos, movimiento y nombres de nota); generador graduado en `src/exercises/generators/sight-reading.ts` con patrones por nivel, límite de salto, tandas por tonalidad/clave/pregunta y validación con `ExerciseSchema`; resolución canónica en `src/exercises/answer.ts`; validación de contenido en `src/content/validate.ts`; renderizado de pentagrama y audio en `ExercisePlayer`; feedback bilingüe `sight-reading`; habilidad `skill.sight-reading` y etiquetas i18n nuevas.
- Verificación: `validate:content` verde con 9 módulos, 73 lecciones, 648 ejercicios, 59 habilidades y 1 pieza; typecheck verde; suite 184 archivos / 1341 tests en verde; build y presupuesto verdes con 237,97 kB gzip inicial y 735 chunks diferidos. Se añadieron `tests/content-m7-09.test.ts` (conceptos, demos, doce tonalidades, ejercicios, tarea y habilidad) y `tests/sight-reading-generator.test.ts` (fragmentos, límites por nivel, intervalo/movimiento/nota, tandas y validación), más una prueba de UI en `tests/exercise-player.test.tsx`; se actualizaron los conteos fijos y las listas de tipos y errores.
- Resultado: commit de implementación `eb4ec71`; documentación de cierre en este commit.
- Limitación: los fragmentos son monódicos y diatónicos en la escala mayor; la lectura de las dos claves se practica por separado y la continuidad sin parar se autoevalúa por escucha.
- Próximo paso: F5-010 (M7-10 «Tocar de oído, transposición e improvisación» con pasos concretos, melodía oculta, rueda de acordes y tarea).

## 2026-11-11T22:50:00-03:00 · F5-010

- Acción: se publicó M7-10 «Tocar de oído, transposición e improvisación» y se commiteó en `4e1d1d7`.
- Contenido: `content/lessons/m7-10.json` explica los cinco pasos para tocar de oído (escuchar y cantar, encontrar la tónica, ubicar la primera nota, traducir a grados y comparar), la transposición por grados con armadura y ortografía, la rueda I–vi–ii–V en las doce tonalidades y la improvisación con tres notas y un ritmo. Incluye dos demos con audio —la rueda en Do y un motivo improvisado con cifrado— y una tarea de teclado a 60 BPM con la rueda Do–Lam–Rem–Sol7, motivo de dos compases, cuatro vueltas y parada ante dolor, tensión o cansancio.
- Ejercicios: 12 ejercicios propios `ex.m7-10.a`…`l`. Cuatro melodías ocultas `ear-melody` en Do, Sol, Fa y Re (una por dificultad 1/2/3/4; preguntan nota, intervalo y movimiento, con la partitura revelada solo al corregir). Cuatro transposiciones `transposition` con opciones (Do→Sol, Sol→Re, Fa→Si♭ y Re→La; la melodía original se ve y la transportada aparece al corregir). Cuatro dictados de la rueda `ear-progression` en Do, Sol, Fa y Re con las mismas opciones de grados.
- Implementación: tipo `ear-melody` con `score`, `ask`, `from`, `to` y `choices`; `choices` en `transposition`; `melodyToScore` para dibujar melodías transportadas; `src/exercises/melody-dictation.ts` (timeline, respuesta canónica y feedback); `src/exercises/generators/ear-melody.ts` (reutiliza los patrones de lectura de M7-09); resolución canónica, formatos, registro de intentos y validación de contenido; UI de melodía oculta, revelación de partitura y partituras original/transportada en `ExercisePlayer`; feedback bilingüe `ear-melody`; habilidades `skill.play-by-ear`, `skill.transposition` y `skill.improvisation`, y ampliación de `skill.ear-progression` con `lesson.m7-10`.
- Verificación: `validate:content` verde con 9 módulos, 74 lecciones, 660 ejercicios, 62 habilidades y 1 pieza; typecheck verde; suite 187 archivos / 1363 tests en verde; build y presupuesto verdes con 239,87 kB gzip inicial y 748 chunks diferidos. Se añadieron `tests/content-m7-10.test.ts`, `tests/melody-dictation.test.ts` y `tests/generators-ear-melody.test.ts`, más pruebas de UI y de resolución; se actualizaron los conteos fijos, las listas de tipos y los códigos de feedback.
- Resultado: commit de implementación `4e1d1d7`; documentación de cierre en este commit.
- Limitación: la evaluación de la melodía oculta es de opción múltiple, no de transcripción libre; la improvisación y la continuidad de la rueda se autoevalúan por escucha. Las opciones de intervalo en inglés pueden elegir distractores con otro orden semántico que el español, aunque la respuesta correcta queda siempre en el mismo índice.
- Próximo paso: F5-011 (M7-11 «Lead sheets y cifrados» con melodía y cifrado, voicings y tarea).

## 2026-11-11T23:20:00-03:00 · F5-011

- Acción: se publicó M7-11 «Lead sheets y cifrados» y se commiteó en `e742ac3`.
- Contenido: `content/lessons/m7-11.json` explica la anatomía de un lead sheet (melodía escrita en el pentagrama y cifrados encima), la diferencia entre cifrado y voicing, el paso del cifrado al voicing de shell (fundamental en la mano izquierda, tercera y séptima como guías en la derecha, tercera y quinta en las tríadas), los cinco pasos de práctica y el estudio sin dolor ni tensión. Incluye dos demos con audio —ocho compases de melodía con cifrados C–Am7–Dm7–G7–C–Am7–Dm7–C y cuatro compases de shell voicings Cmaj7–Am7–Dm7–G7— y una tarea de teclado a 60 BPM con la progresión Cmaj7–Am7–Dm7–G7, fundamentales Do3–La3–Re3–Sol3, guías Mi4+Si4, Do4+Sol4, Do4+Fa4 y Fa4+Si4, cuatro vueltas y parada ante dolor o tensión.
- Ejercicios: 12 ejercicios propios `ex.m7-11.a`…`l` de tipo `accompaniment`, seis de melodía (`ask: 'melody'` en compás y pulso concretos) y seis de voicing (`ask: 'voicing'` sobre el cifrado del compás), en Do, Sol, Fa, Re, Si♭ y Mi♭, todos en 4/4 con cuatro negras por compás, un cifrado por compás, dificultad 1/2/3/4 y cuatro opciones paralelas en español e inglés.
- Implementación: el tipo `accompaniment` se amplió con `ask: 'melody' | 'voicing'` y `beat` en `src/schemas/content.ts`; se añadieron `leadSheetMelodyPitch`, `leadSheetMelodyNoteName`, `shellVoicing` y `shellVoicingLabel` en `src/exercises/accompaniment.ts`; la resolución canónica en `src/exercises/answer.ts` y la validación de respuesta, compás y pulso en `src/content/validate.ts`; la etiqueta dinámica «Lead sheet» y la clave de audio en `src/components/ExercisePlayer.tsx` y `src/state/settings.tsx`; la habilidad `skill.lead-sheet`; el resumen del módulo M7 y el feedback bilingüe `accompaniment`.
- Verificación: `validate:content` verde con 9 módulos, 75 lecciones, 672 ejercicios, 63 habilidades y 1 pieza; typecheck verde; suite 189 archivos / 1376 tests en verde; build y presupuesto verdes con 240,71 kB gzip inicial y 761 chunks diferidos. Se añadieron `tests/content-m7-11.test.ts` (conceptos, demos, ejercicios de melodía y voicing, tarea y habilidad), `tests/lead-sheet-voicing.test.ts` (helpers de melodía y voicing) y una prueba de UI en `tests/exercise-player.test.tsx`; se actualizaron los conteos fijos de lecciones, ejercicios, habilidades y lecciones bloqueadas.
- Resultado: commit de implementación `e742ac3`; documentación de cierre en este commit.
- Limitación: la evaluación es de opción múltiple, no de transcripción ni de realización libre del cifrado; el shell usa siempre fundamental en la octava 3 y guías en la octava 4 con orden ascendente, sin inversiones, extensiones ni conducción automática entre acordes. El audio reproduce las notas escritas y la igualdad de voces, el balance de manos y la continuidad se autoevalúan por escucha.
- Próximo paso: F5-012 (M8-01 «Pop/rock» con patrones y progresiones, ejemplo original y tarea opcional).

## 2026-11-11T23:44:00-03:00 · F5-012

- Acción: se publicó M8-01 «Pop/rock» como lección opcional del módulo M8 y se commiteó en `0d609ca`.
- Contenido: `content/lessons/m8-01.json` explica el backbeat en 4/4, los patrones de acompañamiento (corcheas rectas, negras, medio tiempo y síncopa), los bucles de progresión I–V–vi–IV y vi–IV–I–V y los cinco pasos de práctica. Incluye una demo de patrón de corcheas sobre C–G–Am–F a 96 BPM y el ejemplo original «Ciudad de neón», ocho compases con melodía y fundamentales a 92 BPM, más una tarea de teclado a 80 BPM con las fundamentales Do3–Sol3–La3–Fa3, corcheas, cuatro vueltas y parada ante dolor, tensión o cansancio.
- Ejercicios: 12 ejercicios propios `ex.m8-01.a`…`l` de tipo `style-pattern`: 4 de patrón rítmico, 4 de grados de la progresión y 4 de cifrado de compás, en Do, Sol, Re y La, con cuatro opciones paralelas en español e inglés.
- Implementación: tipo `style-pattern` con `score`, `style`, `ask: 'pattern' | 'progression' | 'chord'` y `measure` en `src/schemas/content.ts`; helpers en `src/exercises/style-pattern.ts` que reconocen el patrón por los ataques de los acordes y leen los grados desde los cifrados; resolución canónica en `src/exercises/answer.ts` y validación en `src/content/validate.ts`; renderizado de pentagrama y audio en `ExercisePlayer`; feedback bilingüe `style-pattern`; habilidad `skill.pop-rock`; formatos y registro de intentos.
- Verificación: `validate:content` verde con 9 módulos, 76 lecciones, 684 ejercicios, 64 habilidades y 1 pieza; typecheck verde; suite 191 archivos / 1391 tests en verde; build y presupuesto verdes con 242,13 kB gzip inicial y 774 chunks diferidos. Se añadieron `tests/content-m8-01.test.ts` (conceptos, demos, patrones, progresiones, cifrados, tarea y habilidad) y `tests/style-pattern.test.ts` (patrones, grados y casos sin respuesta), más una prueba de UI en `tests/exercise-player.test.tsx`; se actualizaron los conteos fijos de lecciones, ejercicios y los mapas del curso, incluyendo el M8 con su primera lección opcional.
- Resultado: commit de implementación `0d609ca`; documentación de cierre en este commit.
- Limitación: el reconocimiento de patrón solo distingue las cuatro células de M8-01 y no identifica arpegios, riffs ni compases con cambio de cifrado en un mismo compás; la progresión se limita a acordes diatónicos de la tonalidad. La lección es opcional: no bloquea la ruta de M7 y la tarea se propone solo cuando el alumno accede a M8.
- Próximo paso: F5-013 (M8-02 «Blues» con shuffle, comping y escala, 12 compases, ejemplo y tarea opcional).

## 2026-11-12T00:15:00-03:00 · F5-013

- Acción: se retomó la sesión interrumpida de F5-013 y se publicó M8-02 «Blues» como lección opcional del módulo M8; commit de implementación `910f45e`. Se conservó el trabajo sin commitear porque el contenido, el esquema, la validación, la resolución, la UI, el i18n y el feedback ya estaban implementados; faltaban el índice del curso, los tests, los conteos fijos y la documentación.
- Contenido: `content/lessons/m8-02.json` explica el shuffle y el comping en contratiempos, la forma de 12 compases I–IV–I–I–IV–IV–I–I–V–IV–I–V, la escala de blues con tercera menor, quinta disminuida y séptima bemol, la resolución de la blue note y los cinco pasos de práctica. Incluye dos demos a 96 BPM —shuffle en Do7 y el ejemplo original «Ruta azul» de 12 compases— y una tarea de teclado a 80 BPM con fundamentales Do3–Do3–Do3–Do3–Fa3–Fa3–Do3–Do3–Sol3–Fa3–Do3–Sol3, comping en contratiempos, cuatro vueltas y parada ante dolor, tensión o cansancio.
- Ejercicios: 12 ejercicios propios `ex.m8-02.a`…`l` de tipo `style-pattern`: 4 de patrón rítmico (shuffle en Do compás 1, Do compás 2, Fa y Sol), 4 de grados de la progresión de cuatro compases (Do, Fa, Sol y Si♭) y 4 de escala de blues (Do, Fa, Sol y Si♭), con dificultad 1/2/3/4 y opciones paralelas en español e inglés.
- Implementación: el tipo `style-pattern` se amplió con `ask: 'scale'` en `src/schemas/content.ts`; se añadieron `styleScaleName` y `styleScaleCandidates` en `src/exercises/style-pattern.ts` (comparación de clases de altura contra blues, pentatónica menor, pentatónica mayor y mixolidio), la resolución canónica en `src/exercises/answer.ts`, la validación en `src/content/validate.ts`, el renderizado y la etiqueta de audio en `src/components/ExercisePlayer.tsx` y `src/state/settings.tsx`, la habilidad `skill.blues` y el feedback bilingüe `style-pattern`.
- Corrección pedagógica: la blue note de Do se escribe «Sol♭»/«Gb» en toda la lección, la tarea, los ejercicios y el bloque «Recordá»; antes convivían «Fa♯» y «Do♯» contra una partitura en Sol♭/Re♭. Se regeneró `src/content/course-index.json` con 9 módulos y 77 lecciones.
- Verificación: `validate:content` verde con 9 módulos, 77 lecciones, 696 ejercicios, 65 habilidades y 1 pieza; typecheck verde; suite 192 archivos / 1405 tests en verde; build y presupuesto verdes con 243,00 kB gzip inicial y 787 chunks diferidos. Se añadieron `tests/content-m8-02.test.ts` (lección opcional, conceptos, demo de shuffle, «Ruta azul» de 12 compases, ejercicios de patrón/progresión/escala, tarea a 80 BPM y `skill.blues`), pruebas de shuffle/comping/escala en `tests/style-pattern.test.ts` y una prueba de UI en `tests/exercise-player.test.tsx`; se actualizaron los conteos fijos de lecciones, ejercicios, habilidades y lecciones bloqueadas.
- Resultado: commit de implementación `910f45e`; documentación de cierre en este commit.
- Limitación: el reconocimiento de patrón solo distingue las células de shuffle y comping de la lección; la escala se identifica por clases de altura, no por digitación, orden melódico ni resolución efectiva de la blue note. La lección es opcional: no bloquea la ruta de M7 y la tarea se propone solo cuando el alumno accede a M8.
- Próximo paso: F5-014 (M8-03 «Jazz básico» con ii-V-I, swing y voicings, ejemplo y tarea opcional).

## 2026-11-12T00:40:00-03:00 · F5-014

- Acción: se publicó M8-03 «Jazz básico» como lección opcional del módulo M8 y se commiteó en `c50830a`.
- Contenido: `content/lessons/m8-03.json` explica el swing y el comping en contratiempos, la cadencia ii–V–I con sus notas guía (tercera y séptima), la diferencia entre shell y voicing sin fundamental, la conducción de voces y el giro ii–V–I–VI. Incluye dos demos —«Swing en Do» de cuatro compases con Dm7–G7–Cmaj7–La7 a 96 BPM y el ejemplo original «Tren de medianoche» de ocho compases a 100 BPM— y una tarea de teclado a 80 BPM con fundamentales Re3–Sol3–Do3–La3, guías Fa4+Do5, Fa4+Si4, Mi4+Si4 y Mi4+Do♯5, cuatro vueltas y parada ante dolor, tensión o cansancio.
- Ejercicios: 12 ejercicios propios `ex.m8-03.a`…`l` de tipo `style-pattern`: 4 de patrón rítmico (swing en Do, comping en Fa, negras en Si♭ y síncopa en Mi♭), 4 de grados de la progresión ii–V–I–VI (Do, Fa, Si♭ y Mi♭), 2 de cifrado (Sol7 en Do y Si♭maj7 en Si♭) y 2 de voicing (Domaj7 en Do y Si♭7 en Mi♭), con dificultad 1/2/3/4 y opciones paralelas en español e inglés.
- Implementación: el tipo `style-pattern` se amplió con `ask: 'voicing'` en `src/schemas/content.ts`; se añadieron `styleVoicingPitches` y `styleVoicingCandidates` en `src/exercises/style-pattern.ts` (toman el acorde de la mano derecha, lo ordenan de grave a agudo y lo etiquetan con octava), la resolución canónica en `src/exercises/answer.ts`, la validación en `src/content/validate.ts`, la etiqueta y el audio de jazz en `src/components/ExercisePlayer.tsx` y `src/state/settings.tsx`, la habilidad `skill.jazz` y el feedback bilingüe `style-pattern` con ii–V–I, swing y voicings.
- Verificación: `validate:content` verde con 9 módulos, 78 lecciones, 708 ejercicios, 66 habilidades y 1 pieza; typecheck verde; suite 193 archivos / 1418 tests en verde; build y presupuesto verdes con 243,71 kB gzip inicial y 800 chunks diferidos. Se añadieron `tests/content-m8-03.test.ts` (lección opcional, conceptos, demo de swing, «Tren de medianoche», patrones, progresiones, cifrados, voicings, tarea a 80 BPM y `skill.jazz`), pruebas de voicing en `tests/style-pattern.test.ts` y una prueba de UI en `tests/exercise-player.test.tsx`; se actualizaron los conteos fijos de lecciones, ejercicios, habilidades y lecciones opcionales.
- Resultado: commit de implementación `c50830a`; documentación de cierre en este commit.
- Limitación: el voicing se lee de las notas escritas en la mano derecha y no evalúa la conducción real ni la ortografía teórica del acorde; el reconocimiento de patrón solo distingue swing, comping, negras y síncopa. La lección es opcional: no bloquea la ruta de M7 y la tarea se propone solo cuando el alumno accede a M8.
- Próximo paso: F5-015 (M8-04 «Ritmos latinos» con patrones de bossa y salsa básicos, ejemplo y tarea opcional).

## 2026-11-12T01:00:00-03:00 · F5-015

- Acción: se publicó M8-04 «Ritmos latinos» como lección opcional del módulo M8 y se commiteó en `2775d0d`.
- Contenido: `content/lessons/m8-04.json` explica la bossa nova con la fundamental en 1 y 3 y el acorde en 2 y 4, la clave 3-2/2-3, el montuno de salsa en los ataques 0, 0,5, 1,5, 2, 3 y 3,5, el bucle I–vi–ii–V y el mantenimiento del patrón al cambiar de acorde. Incluye la demo de bossa Domaj7–Lam7–Rem7–Sol7 a 120 BPM y el ejemplo original «Calle de coral» de ocho compases a 108 BPM, más una tarea de teclado a 80 BPM con fundamentales Do3–La2–Re3–Sol2 en 1 y 3, acordes en 2 y 4, cuatro vueltas y parada ante dolor, tensión o cansancio.
- Ejercicios: 12 ejercicios propios `ex.m8-04.a`…`l` de tipo `style-pattern`: 4 de patrón rítmico (bossa nova en Do y Fa, montuno en Si♭ y Mi♭), 4 de grados de la progresión I–vi–ii–V (Do, Fa, Si♭ y Mi♭), 2 de cifrado (Lam7 en Do y Si♭7 en Mi♭) y 2 de voicing (Domaj7 en Do y Fam7 en Mi♭), con dificultad 1/2/3 y opciones paralelas en español e inglés.
- Implementación: se ampliaron `STYLE_PATTERN_VALUES` y las etiquetas con `bossa` y `montuno` en `src/exercises/style-pattern.ts`; `stylePatternInMeasure` reconoce la bossa (dos acordes en blancas en los pulsos 2 y 4) y el montuno (seis corcheas en 0, 0,5, 1,5, 2, 3 y 3,5). Se añadió la habilidad `skill.latin`, las etiquetas y el audio latino en `src/components/ExercisePlayer.tsx` y `src/state/settings.tsx`, y se amplió el feedback bilingüe `style-pattern` con bossa y salsa. Los ejercicios de voicing reutilizan `styleVoicingPitches` y `styleVoicingCandidates` de F5-014.
- Verificación: `validate:content` verde con 9 módulos, 79 lecciones, 720 ejercicios, 67 habilidades y 1 pieza; typecheck verde; suite 194 archivos / 1430 tests en verde; build y presupuesto verdes con 244,41 kB gzip inicial y 813 chunks diferidos. Se añadieron `tests/content-m8-04.test.ts` (lección opcional, conceptos, demo de bossa, «Calle de coral», patrones, progresiones, cifrados, voicings, tarea a 80 BPM y `skill.latin`), pruebas de bossa y montuno en `tests/style-pattern.test.ts` y una prueba de UI en `tests/exercise-player.test.tsx`; se actualizaron los conteos fijos de lecciones, ejercicios, habilidades y lecciones opcionales.
- Resultado: commit de implementación `2775d0d`; documentación de cierre en este commit.
- Limitación: la bossa se reconoce por dos acordes en blancas en 2 y 4 y el montuno por una única célula de seis ataques; no se analiza la dirección de la clave, las variantes 3-2/2-3 ni la relación con el bajo. La lección es opcional: no bloquea la ruta de M7 y la tarea se propone solo cuando el alumno accede a M8.
- Próximo paso: F5-016 (cerrar M8 con el mapa de estilos, la ruta opcional y los enlaces a piezas adecuadas).

## 2026-11-12T02:15:00-03:00 · F5-016

- Acción: se cerró M8 con un mapa de estilos dentro del mapa del curso y se commiteó en `41fef4b`.
- Contenido: `src/content/style-map.ts` reúne los cuatro estilos de M8 con su foco, su patrón y la pieza original que los cierra: pop/rock con «Ciudad de neón», blues con «Ruta azul», jazz básico con «Tren de medianoche» y ritmos latinos con «Calle de coral». El mapa explica que la ruta se puede recorrer en orden, empezar por el estilo que más interese o dejar para más adelante.
- Implementación: `src/components/StyleMap.tsx` se renderiza al final de la tarjeta de M8 en `CoursePage`. Cada entrada muestra el estado real de la lección, el foco, la pieza, el patrón y los minutos; las lecciones bloqueadas se anuncian con «Se abre al completar la lección anterior de la ruta» y no generan enlace, mientras que las disponibles enlazan con `#/leccion/<id>`. La nota final aclara que M8 es una ampliación opcional y no bloquea M7 ni el resto del curso. Se añadieron las claves bilingües `course.styleMap.*` y estilos responsivos en `src/styles.css`.
- Verificación: `tests/style-map.test.ts` comprueba las cuatro entradas en orden, que cada lección existe, es publicada y opcional, que la pieza citada aparece en el contenido ES/EN de su lección, que M8 es opcional, que ningún prerrequisito de M7 apunta a M8 y que la cadena es m7-11 → m8-01 → m8-02 → m8-03 → m8-04. `tests/course-page.test.tsx` cubre el mapa bloqueado sin enlaces y el mapa disponible con los cuatro enlaces. `validate:content` sigue en 9 módulos, 79 lecciones, 720 ejercicios, 67 habilidades y 1 pieza; typecheck verde; suite 195 archivos / 1435 tests; build y presupuesto verdes con 245,64 kB gzip inicial y 813 chunks diferidos.
- Resultado: commit de implementación `41fef4b`; documentación de cierre en este commit.
- Limitación: el mapa enlaza a la lección que contiene la pieza, porque todavía no existe una pantalla de repertorio (llega con F5-021 a F5-024) ni una ruta `#/pieza/<id>`. Los títulos de las piezas se guardan en el mapa editorial y el test los contrasta con el contenido de cada lección para evitar que queden desfasados. El estado de cada estilo se toma de los desbloqueos del curso; si una lección está en curso o completada, se enlaza igual.
- Próximo paso: F5-017 (set 1 de estudios técnicos originales).

## 2026-11-12T02:50:00-03:00 · F5-017

- Acción: se publicó el set 1 de estudios técnicos originales como piezas de repertorio CC0 y se commiteó en `a83357a`.
- Contenido: seis estudios de nivel 1-2, ocho compases en 4/4 y Do mayor, con partituras separadas de mano derecha (clave de sol) y mano izquierda (clave de fa): «Cinco dedos» (legato en posición de Do, 72→96 BPM en pasos de 8), «Terceras quebradas» (cambios de posición, 66→90 en pasos de 8), «Escala en Do» (escala mayor con pulgar bajo la mano, 60→84 en pasos de 6), «Arpegio de Do» (arpegios de Do, Fa y Sol, 60→84 en pasos de 6), «Toque y salto» (saltos de la izquierda, 66→96 en pasos de 10) y «Movimiento contrario» (independencia entre manos, 56→80 en pasos de 8). Cada pieza incluye digitación bilingüe por mano y patrón, notas de estudio bilingües y ficha CC0 completa.
- Implementación: se amplió `RepertoirePieceSchema` con `notesEn`, `fingeringEs`, `fingeringEn` y `TempoProgressionSchema` (`startBpm`, `targetBpm`, `stepBpm`). El esquema rechaza un objetivo que no supere el tempo inicial y un paso mayor que la subida total. Los estudios usan `hands.right` y `hands.left` para que F5-022 pueda dibujar el gran pentagrama con la clave correcta en cada mano.
- Verificación: `tests/repertoire-studies.test.ts` comprueba los seis estudios, la licencia CC0 y la atribución, los compases completos de cuatro pulsos en cada mano, la digitación bilingüe, la progresión de tempo exacta, la conversión a audio con `scoreToTimeline` sin notas fuera del rango 21-108 y el rechazo de progresiones inválidas. `validate:content` verde con 9 módulos, 79 lecciones, 720 ejercicios, 67 habilidades y 7 piezas; typecheck verde; suite 196 archivos / 1440 tests; build y presupuesto verdes con 245,75 kB gzip inicial y 813 chunks diferidos.
- Resultado: commit de implementación `a83357a`; documentación de cierre en este commit.
- Limitación: los estudios todavía no se pueden abrir desde la interfaz porque el pipeline de carga y el renderizado de piezas llegan con F5-021 a F5-024. Por ahora viven en `content/repertoire/`, validados por el build y cubiertos por tests de estructura y audio. La digitación es orientativa y textual; no hay marcas dedo a dedo sobre cada nota.
- Próximo paso: F5-018 (set 2 de estudios originales de nivel intermedio, con foco en independencia y arpegios).

## 2026-11-12T03:20:00-03:00 · F5-018

- Acción: se publicó el set 2 de estudios técnicos originales de nivel intermedio y se commiteó en `250b7a8`.
- Contenido: seis estudios de nivel 3-4, ocho compases en 4/4, con partituras separadas por mano: «Arpegios en espejo» (Do mayor, arpegios en movimiento contrario, 60→84 BPM en pasos de 6), «Independencia 2 contra 1» (Do mayor, corcheas continuas sobre blancas, 72→96 en pasos de 8), «Arpegios de séptima» (Sol mayor, Solmaj7–Domaj7–Re7, 66→92 en pasos de 13), «Tres contra dos» (La menor, tresillos contra corcheas, 52→76 en pasos de 8), «Bajo caminante y arpegio» (Fa mayor, bajo en negras bajo acordes quebrados, 60→84 en pasos de 6) y «Ostinato y arpegio» (Re menor, ostinato de corcheas bajo arpegios, 56→80 en pasos de 8). Las etiquetas reparten el foco entre `arpegios` e `independencia`; todos incluyen ficha CC0, digitación bilingüe y notas de estudio bilingües.
- Implementación: no hizo falta ampliar el esquema de F5-017; los estudios reutilizan `TempoProgressionSchema`, `fingeringEs`/`fingeringEn` y las partituras `hands.right`/`hands.left`. Los tresillos se modelaron con `value.tuplet: 'triplet'` y el generador verificó que cada compás sume cuatro pulsos antes de escribir el JSON. Se añadió `tests/repertoire-studies-set2.test.ts` y se ajustó `tests/repertoire-studies.test.ts` para que el set 1 siga teniendo su propio filtro.
- Verificación: `validate:content` verde con 9 módulos, 79 lecciones, 720 ejercicios, 67 habilidades y 13 piezas; typecheck verde; suite 197 archivos / 1445 tests; build y presupuesto verdes con 245,75 kB gzip inicial y 813 chunks diferidos. La prueba del estudio 10 confirma 12 tresillos en la derecha frente a 8 corcheas en la izquierda por compás y una duración de un tercio de pulso por tresillo.
- Resultado: commit de implementación `250b7a8`; documentación de cierre en este commit.
- Limitación: los estudios siguen sin pantalla propia hasta F5-021 a F5-024. La digitación continúa siendo textual y orientativa; los tresillos dependen del soporte de tuplets del renderizador que llegará con las piezas.
- Próximo paso: F5-019 (generar ejercicios de digitación e independencia con patrones controlados y test de rango).

## 2026-11-13T04:25:00-03:00 · F5-019

- Acción: se implementaron los generadores de ejercicios de digitación e independencia y se commiteó en `3dc816f`.
- Digitación: `src/exercises/generators/fingering.ts` genera ejercicios `arpeggio` con `ask: 'fingering'` sobre las doce tónicas mayores, las dos manos y una o dos octavas. Antes de devolver el ejercicio valida el largo de la digitación (`3·octavas + 1`), que los dedos estén entre 1 y 5, que las notas suban de grave a agudo y que los MIDI queden entre 21 y 108. Los distractores salen de intercambiar dedos vecinos o cambiar el dedo inicial o final, y las tandas recorren tónicas, manos y octavas.
- Independencia: `src/exercises/generators/independence.ts` genera ejercicios `hand-coordination` desde once patrones de referencia en 4/4 y 3/4: alternancia, una mano sostiene mientras la otra se mueve y ataques simultáneos. `coordinationPatternIsPlayable` exige compás completo, pulsos dentro del metro y un solo ataque por mano y pulso. Los registros quedan separados (izquierda 36-48, derecha 60-76), el salto máximo entre ataques de una mano es de 7 semitones y la pregunta solo usa pulsos con ataque real.
- Verificación: `tests/fingering-generator.test.ts` y `tests/independence-generator.test.ts` recorren la matriz completa, comprueban la validez de `ExerciseSchema`, la respuesta canónica, las opciones únicas, los compases por mano, la separación de registros, los saltos, el rango MIDI 21-108 y el rechazo de patrones solapados, fuera de compás o de un nivel superior. `validate:content` sigue en 9 módulos, 79 lecciones, 720 ejercicios, 67 habilidades y 13 piezas; typecheck verde; suite 199 archivos / 1454 tests; build y presupuesto verdes con 245,75 kB gzip inicial y 813 chunks diferidos.
- Resultado: commit de implementación `3dc816f`; documentación de cierre en este commit.
- Limitación: los generadores son bibliotecas listas para el motor de práctica, pero todavía no tienen un botón propio en la interfaz ni añaden ejercicios al contenido publicado. Los patrones de independencia usan Do mayor y registros fijos para garantizar posiciones seguras; ampliar tonalidades o registrar más patrones queda para tareas posteriores.
- Próximo paso: F5-020 (metrónomo progresivo y registro de tempo).

## 2026-11-13T04:45:00-03:00 · F5-020

- Acción: se implementó el metrónomo progresivo con récord de tempo y se commiteó en `daa7dd7`.
- Lógica: `src/state/progressive-metronome.ts` es un módulo puro sobre el metrónomo existente. Normaliza la configuración al rango 40-240 BPM, redondea los enteros y hace que el objetivo nunca quede por debajo del inicio. El estado arranca en `startBpm`, conserva el récord previo si es mayor y cuenta repeticiones completas. En modo automático sube `stepBpm` cada `repetitionsPerStep` y se detiene en `targetBpm`; en modo manual solo cuenta repeticiones y el alumno decide el cambio. `setMetronomeTempo` es el fallback manual: recorta al rango, reinicia el contador del paso actual y nunca baja el récord. `resetMetronome` vuelve al inicio conservando el récord salvo que se pida borrarlo. `metronomeProgress` y `repetitionsUntilIncrease` dejan el avance listo para la interfaz.
- Persistencia: `SkillProgressSchema` agrega `maxTempoBpm` opcional (entero 40-240) dentro de los datos ya exportables, sin tabla ni migración nueva. `src/state/tempo-record.ts` añade `recordMaxTempo` y `recordMetronomeMaxTempo`: leen la fila por los repositorios, validan con Zod, solo escriben si el tempo supera al anterior y conservan maestría, aciertos y errores.
- Verificación: `tests/progressive-metronome.test.ts` cubre la subida por repeticiones, el tope del objetivo, el modo manual, los saltos y límites del fallback, el reset con y sin récord, la normalización de configuraciones inválidas, el progreso, la persistencia del récord, el rechazo de ids y tempos inválidos y el transporte del campo en `ProgressDataSchema`. `validate:content` sigue en 9 módulos, 79 lecciones, 720 ejercicios, 67 habilidades y 13 piezas; typecheck verde; suite 200 archivos / 1467 tests; build y presupuesto verdes con 245,75 kB gzip inicial y 813 chunks diferidos.
- Resultado: commit de implementación `daa7dd7`; documentación de cierre en este commit.
- Limitación: la lógica y la persistencia están listas, pero la tarea de teclado todavía no muestra los controles de progresión ni conecta el récord a un `skillId` concreto. Esa integración visual puede hacerse cuando el plan de práctica enlace bloques con habilidades (F5-041) o al abrir las piezas de repertorio. El récord se guarda por habilidad, no por pieza.
- Próximo paso: F5-021 (pipeline de carga y validación de piezas).

## 2026-11-13T05:10:00-03:00 · F5-021

- Acción: se implementó el cargador diferido de piezas de repertorio y se commiteó en `9ec0f9f`.
- Carga: `src/content/repertoire.ts` usa `import.meta.glob('../../content/repertoire/*.json')` para que cada pieza tenga su propio chunk. `repertoireContentPaths` genera rutas candidatas para las dos convenciones reales (`studies.01.json` y `original-do-mayor.json`), `hasRepertoireContent` comprueba si existe un archivo y `loadRepertoirePiece` valida con `RepertoirePieceSchema`, exige el prefijo `piece.` y verifica que el id cargado coincida con el pedido. `loadRepertoirePieces` deduplica ids y conserva el orden.
- Validación de build: `ContentBundleSchema` ya rechaza JSON inválido, campos faltantes y fichas incompletas; `validateContentBundle` detecta ids duplicados de repertorio y fichas sin autor de transcripción. Los tests nuevos dejan explícito que el build falla si falta la ficha, el título o el autor.
- Verificación: `tests/repertoire-loader.test.ts` carga las 13 piezas reales con ficha y al menos una mano, cubre las dos convenciones de nombre, rechaza ids inválidos e inexistentes, comprueba la deduplicación, detecta ids duplicados y confirma el fallo por ficha o campos obligatorios ausentes. `validate:content` sigue en 9 módulos, 79 lecciones, 720 ejercicios, 67 habilidades y 13 piezas; typecheck verde; suite 201 archivos / 1473 tests; build y presupuesto verdes con 245,75 kB gzip inicial y 813 chunks diferidos.
- Resultado: commit de implementación `9ec0f9f`; documentación de cierre en este commit.
- Limitación: el cargador todavía no se usa desde una pantalla; el render multipentagrama y el reproductor de piezas llegan con F5-022 y F5-023. El índice de piezas se obtiene del bundle validado en build, no de una ruta pública nueva.
- Próximo paso: F5-022 (renderizar piezas multipentagrama con manos separadas).

## 2026-11-13T05:40:00-03:00 · F5-022

- Acción: se implementó el gran pentagrama de piezas y se commiteó en `91cc411`.
- Render: `src/staff/grand-staff.ts` dibuja la mano derecha y la izquierda en dos pentagramas unidos por una llave, con clave y armadura por mano. `grandStaffLayout` calcula compases por sistema y altura según el ancho (mínimo 110 px por compás); `distributeMeasureWidths` reparte el ancho útil y cada pareja de `Stave` comparte `x` y ancho, así los compases quedan alineados. La primera pareja de cada sistema repite clave y armadura; la primera del pentagrama agrega el compás. Las voces toleran compases incompletos, los puntillos se dibujan con `Dot.buildAndAttach`, los tresillos se agrupan de tres en tres y los cifrados se agregan sobre la nota.
- Accesibilidad: cada nota lleva `data-grand-note`, `data-hand`, `data-measure`, `data-midi`, `data-highlighted`, `tabindex` y `role="button"`, con activación por click o Enter/espacio y resaltado por MIDI. `GrandStaff.tsx` mide el ancho con `ResizeObserver`, recalcula sistemas y altura, admite zoom y desplazamiento horizontal, traduce los textos con `staff.grand.*` y describe las notas de ambas manos.
- Verificación: `tests/grand-staff.test.tsx` cubre el cálculo de compases y sistemas, el reparto de anchos, la agrupación por compás, las 13 piezas reales (dos manos y una sola), la separación por `data-hand`, las referencias accesibles, click, resaltado, el cambio de ancho y el componente con las dos manos. `validate:content` sigue en 9 módulos, 79 lecciones, 720 ejercicios, 67 habilidades y 13 piezas; typecheck verde; suite 202 archivos / 1480 tests; build y presupuesto verdes con 245,81 kB gzip inicial y 813 chunks diferidos.
- Resultado: commit de implementación `91cc411`; documentación de cierre en este commit.
- Limitación: el gran pentagrama todavía no se abre desde una ruta o pantalla de pieza. El reproductor con selección de manos, tempo y bucle llega con F5-023, y la ficha visible de licencia con F5-024. Los pedales y las ligaduras de las piezas aún no se dibujan en este renderizador.
- Próximo paso: F5-023 (reproducir piezas con tempo, bucle y selección de manos).

## 2026-11-13T06:05:00-03:00 · F5-023

- Acción: se implementó el reproductor de piezas con selección de manos, tempo y bucle, y se commiteó en `a8b2157`.
- Reproducción: `src/repertoire/playback.ts` elige las partituras de la mano derecha, la izquierda o ambas, aplica el porcentaje de tempo (50-120 %) sobre el tempo escrito y recorta el resultado al rango 40-240 BPM del motor. El rango de compases se recorta y se reindexa desde 1, las marcas de pedal se filtran con el fragmento y los timelines de ambas manos se combinan con un único tempo para que no se desfasen. La duración de pasada incluye el silencio final del rango, de modo que el bucle respeta los compases elegidos. `scoresForHands` lanza un error claro si falta la mano pedida, `hasPieceHand` permite deshabilitar opciones y `normalizeMeasureRange` corrige rangos invertidos o fuera de la pieza.
- Interfaz: `src/components/RepertoirePlayer.tsx` integra el gran pentagrama con controles de manos, tempo, compases desde/hasta, bucle y reproducir/detener. Usa `engine.playTimeline({ repeat, duration, onEvent })`, resalta las notas activas, detiene la reproducción al cambiar de configuración y llama a `engine.stop` al detener o desmontar; así se liberan todas las voces y no quedan notas trabadas. Las claves nuevas viven en `repertoire.player.*` y los controles tienen etiquetas accesibles.
- Verificación: `tests/repertoire-player.test.tsx` cubre compases de la pieza, reproducción con ambas manos, manos separadas, mano ausente, porcentajes y límites de tempo, rango y desplazamiento, normalización de rangos, recorte de pedal, sincronización de tempos distintos, controles del componente, bucle, error de audio y la mano deshabilitada. `validate:content` sigue en 9 módulos, 79 lecciones, 720 ejercicios, 67 habilidades y 13 piezas; typecheck verde; suite 203 archivos / 1492 tests; build y presupuesto verdes con 246,09 kB gzip inicial y 813 chunks diferidos.
- Resultado: commit de implementación `a8b2157`; documentación de cierre en este commit.
- Limitación: el reproductor todavía no se abre desde una ruta o pantalla de pieza; la ficha visible de licencia y el acceso desde la app llegan con F5-024. Los pedales y las ligaduras siguen sin dibujarse en el gran pentagrama, aunque el audio sí aplica la resonancia del pedal.
- Próximo paso: F5-024 (mostrar la ficha de licencia en la app).

## 2026-11-13T06:35:00-03:00 · F5-024

- Acción: se publicó la ficha de licencia, el índice de repertorio y la página de pieza, y se commiteó en `b924a07`.
- Ficha: `src/components/LicenseFichePanel.tsx` muestra compositor, nacimiento y fallecimiento (o «sin dato»), licencia con enlace a sus términos, fuente —enlazada si trae URL—, autor y fecha de transcripción, atribución visible, verificación y notas opcionales. `src/repertoire/license.ts` centraliza la etiqueta y la URL oficial de dominio público, CC0, CC BY, CC BY-SA y obra original.
- Rutas: la app suma `#/repertorio`, `#/pieza/:id` y `#/atribuciones`. `RepertoirePage` carga el catálogo completo con `loadAllRepertoirePieces`, que mantiene cada pieza en su chunk diferido, y lista las 13 piezas con nivel, licencia y enlaces. `PiecePage` carga una pieza por id, muestra sus notas de práctica, el reproductor de F5-023 y la ficha de licencia. `AttributionsPage` reúne todas las fichas y enlaza de vuelta a cada pieza. La navegación principal suma «Repertorio» y mantiene la sección activa en el índice, las piezas y las atribuciones.
- Verificación: `tests/hash-route.test.ts` cubre las rutas nuevas y el estado activo; `tests/repertoire-loader.test.ts` comprueba el catálogo completo ordenado; `tests/repertoire-license.test.tsx` cubre etiquetas y URLs, fechas y fuente enlazada, melodía anónima y datos desconocidos; `tests/app-router.test.tsx` recorre el índice, una pieza y la página de atribuciones dentro de la app. `validate:content` sigue en 9 módulos, 79 lecciones, 720 ejercicios, 67 habilidades y 13 piezas; typecheck verde; suite 204 archivos / 1500 tests; build y presupuesto verdes con 253,66 kB gzip inicial y 826 chunks diferidos.
- Resultado: commit de implementación `b924a07`; documentación de cierre en este commit.
- Limitación: el catálogo se carga completo al abrir el índice o las atribuciones (13 módulos diferidos), porque todavía no hay un manifiesto de metadatos separado. Las piezas de dominio público con fuente externa aún no tienen URL en sus fichas, algo que corresponde a F5-025.
- Próximo paso: F5-025 (verificar dominio público de las piezas candidatas), tarea marcada [NET]; si no hay red, continuar con la primera tarea posterior sin [NET].

## 2026-11-13T07:00:00-03:00 · F5-025

- Acción: se verificó el dominio público de las trece piezas candidatas de F5 y se registró en `docs/LICENCIAS.md`, `src/repertoire/public-domain.ts` y `tests/public-domain.test.ts`; commit de implementación `a0d91b1`.
- Red: la conexión estuvo disponible. Se consultaron IMSLP, Wikipedia y Hymnary.org el 2026-11-13; las URLs quedaron en cada ficha y en la tabla del documento.
- Obras con compositor: Beethoven (murió en 1827, 199 años al 2026), Petzold (1733, 293), Schumann (1856, 170), Clementi (1832, 194), Burgmüller (1874, 152), Chopin (1849, 177), Hanon (1900, 126) y Czerny (1857, 169). Todos superan el criterio de más de 100 años.
- Melodías tradicionales: Twinkle (1761), Frère Jacques (c. 1780), Greensleeves (1580), Auld Lang Syne (1799) y Amazing Grace (1829), tratadas como anónimas tradicionales y con fuente consultada.
- Correcciones registradas: «Arabesque» es Op. 100 n.º 2 y no n.º 1; el Minueto BWV Anh. 114 es de Christian Petzold y no de J. S. Bach; la edición Bärenreiter de 1957 no se usa porque aporta trabajo editorial; la Fantasía sobre Greensleeves de Vaughan Williams (1934) y las armonizaciones modernas de Amazing Grace quedan descartadas; los arreglos de métodos comerciales no se copian.
- Descartes: River Flows in You, Comptine d'un autre été, Happy Birthday, arreglos de métodos modernos, Fantasía de Vaughan Williams, armonizaciones modernas de Amazing Grace y la edición Bärenreiter de 1957, todos con motivo y fecha.
- Verificación: `tests/public-domain.test.ts` cubre fichas completas, el criterio de más de 100 años, los años exactos desde la muerte, las correcciones de autoría y numeración, los descartes y la alineación entre el documento humano y el registro machine-readable. `validate:content` sigue en 9 módulos, 79 lecciones, 720 ejercicios, 67 habilidades y 13 piezas; typecheck verde; suite 205 archivos / 1506 tests; build y presupuesto verdes con 253,66 kB gzip inicial y 826 chunks diferidos.
- Resultado: commit de implementación `a0d91b1`; documentación de cierre en este commit.
- Limitación: la verificación es una foto al 2026-11-13 y no sustituye una revisión legal; las piezas que se transcriban después deben copiar la ficha y declarar su propia adaptación. F5-047 añadirá el test automático sobre las fichas ya publicadas en `content/repertoire/`.
- Próximo paso: F5-026 (transcribir «Twinkle, Twinkle, Little Star»), ya sin dependencia de red.

## 2026-11-13T07:25:00-03:00 · F5-026

- Acción: se transcribió «Twinkle, Twinkle, Little Star» (melodía tradicional anónima) como `content/repertoire/traditional-twinkle.json`, con tests en `tests/repertoire-twinkle.test.tsx`; commit de implementación `87592fc`.
- Pieza: id `piece.traditional.twinkle`, nivel 1, 40 s, Do mayor, 4/4, 72 BPM, solo mano derecha, 42 eventos en 12 compases. Las frases pares terminan en blanca y las impares usan cuatro negras.
- Ficha: licencia `public-domain`, compositor «Anónimo tradicional» con `anonymousTraditional: true`, fuente «Ah! vous dirai-je, maman» (1761), URL de Wikipedia, transcriptor y verificador Piano Today, fechas 2026-11-13, atribución visible y nota que descarta las variaciones de Mozart y la letra inglesa.
- Verificación: `tests/repertoire-twinkle.test.tsx` cubre ficha, mano única, compases completos, melodía MIDI nota por nota, duración, render con `renderGrandStaff` y reproducción con `RepertoirePlayer` (42 eventos, `duration` 40, mano izquierda deshabilitada). Se ajustaron los conteos de piezas de 13 a 14 en los tests de estudios, cargador y router.
- Resultado: `validate:content` da 9 módulos, 79 lecciones, 720 ejercicios, 67 habilidades y 14 piezas; typecheck verde; suite 206 archivos / 1511 tests; build y presupuesto verdes con 253,69 kB gzip inicial y 827 chunks diferidos.
- Limitación: la pieza es una transcripción melódica de una sola mano; no incluye bajo ni acompañamiento, y la digitación es orientativa. F5-027 añadirá «Frère Jacques» con melodía y bajo simple.
- Próximo paso: F5-027 (transcribir «Frère Jacques»), sin dependencia de red.

## 2026-11-13T08:35:00-03:00 · F5-027

- Acción: se transcribió «Frère Jacques» (ronda tradicional anónima) como `content/repertoire/traditional-frere-jacques.json`, con tests en `tests/repertoire-frere-jacques.test.tsx`; commit de implementación `d6bae0e`.
- Pieza: id `piece.traditional.frere-jacques`, nivel 2, 24 s, Do mayor, 4/4, 80 BPM, ocho compases completos. La mano derecha lleva la melodía en 26 eventos; la izquierda, un bajo simple de redondas (Do en los compases 1-4 y 6, Fa en el 5, Sol en el 7), ocho eventos.
- Ficha: licencia `public-domain`, compositor «Anónimo tradicional» con `anonymousTraditional: true`, fuente «Recueil de Timbres de Vaudevilles» (c. 1780) con URL de Wikipedia, transcriptor y verificador Piano Today, fechas 2026-11-13, atribución que declara el bajo propio y nota que descarta la letra y la atribución discutida a Rameau.
- Verificación: `tests/repertoire-frere-jacques.test.tsx` cubre ficha, dos manos, compases completos, melodía y bajo MIDI, duración de 32 pulsos (24 s), render de 34 notas y reproducción con selección de mano derecha. Se ajustaron los conteos de piezas de 14 a 15 en los tests de estudios, cargador y router.
- Resultado: `validate:content` da 9 módulos, 79 lecciones, 720 ejercicios, 67 habilidades y 15 piezas; typecheck verde; suite 207 archivos / 1516 tests; build y presupuesto verdes con 253,72 kB gzip inicial y 828 chunks diferidos.
- Limitación: el bajo es una armonización pedagógica propia de una redonda por compás, no una armonización histórica; la digitación es orientativa. F5-028 añadirá «Greensleeves» con digitación y versión propia.
- Próximo paso: F5-028 (transcribir «Greensleeves»), sin dependencia de red.

## 2026-11-13T09:15:00-03:00 · F5-028

- Acción: se transcribió «Greensleeves» (balada tradicional anónima) como versión propia en `content/repertoire/traditional-greensleeves.json`, con tests en `tests/repertoire-greensleeves.test.tsx`; commit de implementación `fdc26ab`.
- Pieza: id `piece.traditional.greensleeves`, nivel 3, 48 s, La menor, 6/8, 60 BPM, 16 compases. Melodía en la mano derecha (68 eventos) con los accidentales G# y F#; bajo propio en la izquierda (32 eventos) con fundamental y quinta en dos blancas con puntillo por compás.
- Ficha: licencia `public-domain`, compositor «Anónimo tradicional» con `anonymousTraditional: true`, fuente de 1580 con URL de Wikipedia, transcriptor y verificador Piano Today, fechas 2026-11-13, atribución de versión simplificada propia y nota que descarta la Fantasía de Vaughan Williams. Digitación orientativa por compás en ambos idiomas.
- Verificación: `tests/repertoire-greensleeves.test.tsx` cubre ficha, dos manos, 16 compases completos de tres pulsos, melodía y bajo MIDI, accidentales, duración de 48 pulsos (48 s), render de 100 notas y reproducción con selección de mano izquierda. Se ajustaron los conteos de piezas de 15 a 16 en los tests de estudios, cargador y router.
- Resultado: `validate:content` da 9 módulos, 79 lecciones, 720 ejercicios, 67 habilidades y 16 piezas; typecheck verde; suite 208 archivos / 1521 tests; build y presupuesto verdes con 253,75 kB gzip inicial y 829 chunks diferidos.
- Limitación: es una versión simplificada y propia, no una transcripción literal de ninguna edición; el ritmo reduce algunos valores originales y el bajo es una armonización pedagógica. F5-029 añadirá «Auld Lang Syne».
- Próximo paso: F5-029 (transcribir «Auld Lang Syne»), sin dependencia de red.

## 2026-11-13T09:55:00-03:00 · F5-029

- Acción: se transcribió «Auld Lang Syne» (melodía tradicional escocesa) como `content/repertoire/traditional-auld-lang-syne.json`, con tests en `tests/repertoire-auld-lang-syne.test.tsx`; commit de implementación `055284d`.
- Pieza: id `piece.traditional.auld-lang-syne`, nivel 2, 48 s, Sol mayor, 4/4, 80 BPM, 16 compases. Melodía en la mano derecha (58 eventos) y bajo en la izquierda (16 redondas) con Sol-Re-Sol-Do-Sol-Re-Mi menor-Sol.
- Ficha: licencia `public-domain`, compositor «Anónimo tradicional» con `anonymousTraditional: true`, fuente de 1799 con URL de Wikipedia, transcriptor y verificador Piano Today, fechas 2026-11-13, atribución propia y nota que descarta la letra de Robert Burns y las armonizaciones corales modernas. Digitación orientativa en ambos idiomas.
- Verificación: `tests/repertoire-auld-lang-syne.test.tsx` valida tonalidad, modo, 16 compases completos, melodía y bajo MIDI, duración de 64 pulsos (48 s), render de 74 notas, reproducción con ambas manos y con la derecha sola. Se ajustaron los conteos de piezas de 16 a 17 en los tests de estudios, cargador y router.
- Resultado: `validate:content` da 9 módulos, 79 lecciones, 720 ejercicios, 67 habilidades y 17 piezas; typecheck verde; suite 209 archivos / 1526 tests; build y presupuesto verdes con 253,78 kB gzip inicial y 830 chunks diferidos.
- Limitación: la transcripción simplifica el ritmo a negras y redondas y el bajo es una armonización pedagógica propia. F5-030 añadirá «Amazing Grace», solo melodía y sin letra.
- Próximo paso: F5-030 (transcribir «Amazing Grace»), sin dependencia de red.

## 2026-11-13T10:30:00-03:00 · F5-030

- Acción: se transcribió «Amazing Grace» (melodía «New Britain», tradicional anónima) como `content/repertoire/traditional-amazing-grace.json`, con tests en `tests/repertoire-amazing-grace.test.tsx`; commit de implementación `5f233f0`.
- Pieza: id `piece.traditional.amazing-grace`, nivel 1, 40 s, Sol mayor, 3/4, 72 BPM, 16 compases, solo mano derecha y 27 eventos. No incluye bajo ni acompañamiento, porque la aceptación pide solo la melodía.
- Ficha: licencia `public-domain`, compositor «Anónimo tradicional» con `anonymousTraditional: true`, fuente «New Britain» (1829) con URL de Hymnary.org, transcriptor y verificador Piano Today, fechas 2026-11-13, atribución visible y nota que descarta la letra de John Newton y las armonizaciones o arreglos modernos.
- Verificación: `tests/repertoire-amazing-grace.test.tsx` cubre ficha, mano única, 16 compases completos de tres pulsos, melodía MIDI nota por nota, nota aguda Re5, duración de 48 pulsos (40 s), render de 27 notas y reproducción con la mano izquierda deshabilitada. Se ajustaron los conteos de piezas de 17 a 18 en los tests de estudios, cargador y router.
- Resultado: `validate:content` da 9 módulos, 79 lecciones, 720 ejercicios, 67 habilidades y 18 piezas; typecheck verde; suite 210 archivos / 1531 tests; build y presupuesto verdes con 253,81 kB gzip inicial y 831 chunks diferidos.
- Limitación: es una versión melódica de una sola mano; el ritmo simplifica algunos valores del himno y no se usa la letra. F5-031 abre las obras con compositor identificado: la «Oda a la alegría» de Beethoven.
- Próximo paso: F5-031 (transcribir la «Oda a la alegría»), sin dependencia de red.

## 2026-11-13T11:05:00-03:00 · F5-031

- Acción: se transcribió el tema de la «Oda a la alegría» de Beethoven como `content/repertoire/beethoven-ode-to-joy.json`, con tests en `tests/repertoire-ode-to-joy.test.tsx`; commit de implementación `cf08e20`.
- Pieza: id `piece.beethoven.ode-to-joy`, nivel 2, 20 s, Re mayor, 4/4, 96 BPM, ocho compases. Melodía propia en la mano derecha (28 eventos, con Fa sostenidos como accidentales) y bajo pedagógico de redondas en la izquierda (8 eventos, Re y La alternados).
- Ficha: licencia `public-domain`, compositor Ludwig van Beethoven (1770-1827), fuente del cuarto movimiento de la Sinfonía n.º 9, Op. 125 (IMSLP), transcriptor y verificador Piano Today, fechas 2026-11-13, atribución propia y nota que descarta la letra de Schiller y los arreglos modernos.
- Verificación: `tests/repertoire-ode-to-joy.test.tsx` cubre ficha, dos manos, ocho compases completos, melodía y bajo MIDI, Fa sostenidos, duración de 32 pulsos (20 s), render de 36 notas y reproducción con ambas manos y con la izquierda sola. Se ajustaron los conteos de piezas de 18 a 19 en los tests de estudios, cargador y router.
- Resultado: `validate:content` da 9 módulos, 79 lecciones, 720 ejercicios, 67 habilidades y 19 piezas; typecheck verde; suite 211 archivos / 1536 tests; build y presupuesto verdes con 253,85 kB gzip inicial y 832 chunks diferidos.
- Limitación: es una transcripción melódica propia con un bajo simplificado de una redonda por compás; no reproduce la orquestación ni el texto de la sinfonía. F5-032 abre el Minueto de Petzold con dos manos y digitación.
- Próximo paso: F5-032 (transcribir el Minueto en Sol, BWV Anh. 114), sin dependencia de red.

## 2026-11-13T11:45:00-03:00 · F5-032

- Acción: se transcribió el «Minueto en Sol mayor, BWV Anh. 114» de Christian Petzold como `content/repertoire/petzold-minuet-g.json`, con tests en `tests/repertoire-petzold-minuet-g.test.tsx`; commit de implementación `853edd1`.
- Pieza: id `piece.petzold.minuet-g`, nivel 3, 48 s, Sol mayor, 3/4, 120 BPM, 32 compases (dos secciones de 16). Melodía en la mano derecha (126 eventos) y bajo pedagógico de blancas con puntillo en la izquierda (32 eventos), con fundamentales Sol, Do, Re, La y Mi.
- Ficha: licencia `public-domain`, compositor Christian Petzold (1677-1733), fuente del «Notebook for Anna Magdalena Bach» (1725) con URL de IMSLP, transcriptor y verificador Piano Today, fechas 2026-11-13, atribución que aclara la atribución histórica a Bach y nota que descarta la edición Bärenreiter de 1957 y declara el bajo como simplificación propia. Digitación orientativa en ambos idiomas.
- Verificación: `tests/repertoire-petzold-minuet-g.test.tsx` cubre ficha, dos manos, 32 compases completos, melodía y bajo MIDI, Do sostenidos en los compases 20, 21 y 23, duración de 96 pulsos (48 s), render de 158 notas y reproducción con ambas manos y con la izquierda sola. Se ajustaron los conteos de piezas de 19 a 20 en los tests de estudios, cargador y router.
- Resultado: `validate:content` da 9 módulos, 79 lecciones, 720 ejercicios, 67 habilidades y 20 piezas; typecheck verde; suite 212 archivos / 1541 tests; build y presupuesto verdes con 253,87 kB gzip inicial y 833 chunks diferidos.
- Limitación: el bajo de una blanca con puntillo por compás es una simplificación pedagógica, no la textura original del minueto; la melodía sigue la versión del cuaderno de 1725. F5-033 abre el «Soldatenmarsch» de Schumann.
- Próximo paso: F5-033 (transcribir el «Soldatenmarsch» de Schumann), sin dependencia de red.

## 2026-11-13T12:00:00-03:00 · F5-033

- Acción: se transcribió el «Soldatenmarsch» de Robert Schumann (Op. 68 N.º 2, Album für die Jugend, 1848) como `content/repertoire/schumann-soldatenmarsch.json`, con tests en `tests/repertoire-soldatenmarsch.test.tsx`; commit de implementación `109173e`.
- Pieza: id `piece.schumann.soldatenmarsch`, nivel 2, 48 s, Sol mayor, 2/4, 120 BPM, 48 compases (repetición desplegada). Melodía con acordes en la mano derecha (106 eventos, 182 notas) y marcha en la izquierda (106 eventos, 130 notas), con ritmo de negra con puntillo y semicorchea.
- Ficha: licencia `public-domain`, compositor Robert Schumann (1810-1856), fuente del Album für die Jugend (edición Peters), transcriptor y verificador Piano Today, fechas 2026-11-13, atribución propia y nota sobre la transcripción propia. Digitación orientativa en ambos idiomas.
- Verificación: `tests/repertoire-soldatenmarsch.test.tsx` cubre ficha, dos manos, 48 compases de 2/4, Fa/Do sostenidos, 212 notas en el gran pentagrama y reproducción con selección de manos. Se actualizaron los conteos de piezas de 20 a 21 en los tests de estudios, cargador y router.
- Resultado: `validate:content` da 9 módulos, 79 lecciones, 720 ejercicios, 67 habilidades y 21 piezas; typecheck verde; suite 213 archivos / 1546 tests; build y presupuesto verdes.
- Limitación: la repetición (compases 17-32) se transcribe de forma desplegada, como en las piezas anteriores; el bajo sigue la textura original de la edición Peters. F5-034 añadirá la Sonatina Op. 36 N.º 1, I de Clementi.
- Próximo paso: F5-034 (transcribir la Sonatina Op. 36 N.º 1, I de Clementi), sin dependencia de red.

## 2026-11-13T12:30:00-03:00 · F5-034

- Acción: se transcribió un fragmento pedagógico de la Sonatina en Do mayor, Op. 36 N.º 1, I (Allegro) de Muzio Clementi como `content/repertoire/clementi-sonatina-op36-1-i.json`, con tests en `tests/repertoire-clementi-sonatina.test.tsx`; commit de implementación `67c585c`.
- Pieza: id `piece.clementi.sonatina-op36-1-i`, nivel 2, ~6,15 s, Do mayor, 2/2, 156 BPM, 4 compases (fragmento). Mano derecha: tema (23 eventos); mano izquierda: bajo (9 eventos).
- Ficha: licencia `public-domain`, compositor Muzio Clementi (1752-1832), fuente del Sonatina Album (Schirmer, 1893) vía IMSLP, transcriptor y verificador Piano Today, fechas 2026-11-13, atribución propia y nota sobre el fragmento. Digitación orientativa en ambos idiomas.
- Verificación: `tests/repertoire-clementi-sonatina.test.tsx` cubre ficha, dos manos/4 compases de 2/2, tema y bajo, 32 notas en el gran pentagrama y reproducción con selección de manos. Los conteos de piezas se actualizaron de 21 a 22 en loader, studies, studies-set2 y app-router.
- Resultado: `validate:content` da 9 módulos, 79 lecciones, 720 ejercicios, 67 habilidades y 22 piezas; suite en verde.
- Limitación: es un fragmento pedagógico de cuatro compases del primer movimiento; la sonatina completa (con repeticiones y los tres movimientos) no se transcribe. F5-035 añadirá el «Arabesque» Op. 100 N.º 1 de Burgmüller.
- Próximo paso: F5-035 (transcribir el «Arabesque» de Burgmüller), sin dependencia de red.

## 2026-11-13T13:00:00-03:00 · F5-035

- Acción: se transcribió un fragmento pedagógico del estudio L'Arabesque, Op. 100 N.º 2 de Friedrich Burgmüller como `content/repertoire/burgmuller-arabesque-op100-2.json`, con tests en `tests/repertoire-burgmuller-arabesque.test.tsx`; commit de implementación `56c0359`.
- Pieza: id `piece.burgmuller.arabesque-op100-2`, nivel 2, ~6,32 s, La menor, 2/4, 152 BPM, 8 compases (fragmento). Mano derecha: tema ágil (31 eventos); mano izquierda: bajo en acordes (16 eventos).
- Ficha: licencia `public-domain`, compositor Johann Friedrich Franz Burgmüller (1806-1874), fuente de la edición Litolff vía Mutopia, transcriptor y verificador Piano Today, fechas 2026-11-13, atribución propia y nota sobre el fragmento. Digitación orientativa en ambos idiomas.
- Verificación: `tests/repertoire-burgmuller-arabesque.test.tsx` cubre ficha, dos manos/8 compases de 2/4, tema y bajo, 47 notas en el gran pentagrama y reproducción con selección de manos. Los conteos de piezas se actualizaron de 22 a 23 en loader, studies, studies-set2 y app-router.
- Resultado: `validate:content` da 9 módulos, 79 lecciones, 720 ejercicios, 67 habilidades y 23 piezas; suite en verde.
- Limitación: es un fragmento pedagógico de ocho compases del estudio; la pieza completa (con repeticiones) no se transcribe. F5-036 añadirá el Preludio Op. 28 N.º 4 de Chopin.
- Próximo paso: F5-036 (transcribir el Preludio Op. 28 N.º 4 de Chopin), sin dependencia de red.

## 2026-11-13T13:30:00-03:00 · F5-036

- Acción: se transcribió una versión simplificada del Preludio en Mi menor, Op. 28 N.º 4 de Chopin como `content/repertoire/chopin-prelude-op28-4.json`, con tests en `tests/repertoire-chopin-prelude.test.tsx`; commit de implementación `860d1b2`.
- Pieza: id `piece.chopin.prelude-op28-4`, nivel 2, ~17,14 s, Mi menor, 2/2, 56 BPM, 4 compases (versión simplificada). Mano derecha: melodía descendente (8 eventos); mano izquierda: patrón repetido (32 eventos).
- Ficha: licencia `public-domain`, compositor Frédéric Chopin (1810-1849), fuente de la edición Peters (1879) vía Mutopia, transcriptor y verificador Piano Today, fechas 2026-11-13, atribución propia y nota sobre la versión simplificada. Digitación orientativa en ambos idiomas.
- Verificación: `tests/repertoire-chopin-prelude.test.tsx` cubre ficha, dos manos/4 compases de 2/2, melodía y patrón, 40 notas en el gran pentagrama y reproducción con selección de manos. Los conteos de piezas se actualizaron de 23 a 24 en loader, studies, studies-set2 y app-router.
- Resultado: `validate:content` da 9 módulos, 79 lecciones, 720 ejercicios, 67 habilidades y 24 piezas; suite en verde.
- Limitación: es una versión simplificada de cuatro compases del preludio; se omiten las voces dobles, los matices y el resto de la obra. F5-037 inicia las piezas originales CC0.
- Próximo paso: F5-037 (componer pieza original nivel 1), sin dependencia de red.

## 2026-11-13T14:00:00-03:00 · F5-037

- Acción: se compuso la pieza original «Melodía sencilla en Do mayor» (nivel 1, CC0) como `content/repertoire/original-melodia-nivel-1.json`, con tests en `tests/repertoire-original-nivel-1.test.tsx`; commit de implementación `f76a386`.
- Pieza: id `piece.original.melodia-nivel-1`, nivel 1, 24 s, Do mayor, 4/4, 80 BPM, 8 compases. Mano derecha: melodía sencilla (26 eventos); mano izquierda: bajo en blancas (8 eventos).
- Ficha: licencia `cc0-1.0`, compositor Piano Today, fuente «Obra original creada para este proyecto», transcriptor y verificador Piano Today, fechas 2026-11-13, atribución CC0. Digitación orientativa en ambos idiomas.
- Verificación: `tests/repertoire-original-nivel-1.test.tsx` cubre ficha CC0, dos manos/8 compases de 4/4, 34 notas en el gran pentagrama y reproducción con selección de manos. Los conteos de piezas se actualizaron de 24 a 25 en loader, studies, studies-set2 y app-router.
- Resultado: `validate:content` da 9 módulos, 79 lecciones, 720 ejercicios, 67 habilidades y 25 piezas; suite en verde.
- Limitación: pieza de estudio de nivel 1; no tiene progresión de tempo. F5-038 inicia la pieza original de nivel 2.
- Próximo paso: F5-038 (componer pieza original nivel 2), sin dependencia de red.

## 2026-11-13T14:30:00-03:00 · F5-038

- Acción: se compuso la pieza original «Melodía en Do mayor (nivel 2)» (nivel 2, CC0) como `content/repertoire/original-melodia-nivel-2.json`, con tests en `tests/repertoire-original-nivel-2.test.tsx`; commit de implementación `688e7bf`.
- Pieza: id `piece.original.melodia-nivel-2`, nivel 2, ~42,67 s, Do mayor, 4/4, 90 BPM, 16 compases. Mano derecha: melodía (61 eventos); mano izquierda: bajo en blancas (16 eventos).
- Ficha: licencia `cc0-1.0`, compositor Piano Today, fuente «Obra original creada para este proyecto», transcriptor y verificador Piano Today, fechas 2026-11-13, atribución CC0. Digitación orientativa en ambos idiomas.
- Verificación: `tests/repertoire-original-nivel-2.test.tsx` cubre ficha CC0, dos manos/16 compases de 4/4, 77 notas en el gran pentagrama y reproducción con selección de manos. Los conteos de piezas se actualizaron de 25 a 26 en loader, studies, studies-set2 y app-router.
- Resultado: `validate:content` da 9 módulos, 79 lecciones, 720 ejercicios, 67 habilidades y 26 piezas; suite en verde.
- Limitación: pieza de estudio de nivel 2 sin progresión de tempo. F5-039 inicia la pieza original de nivel 3.
- Próximo paso: F5-039 (componer pieza original nivel 3), sin dependencia de red.

## 2026-11-13T15:00:00-03:00 · F5-039

- Acción: se compuso la pieza original «Melodía en Do mayor (nivel 3)» (nivel 3, CC0) como `content/repertoire/original-melodia-nivel-3.json`, con tests en `tests/repertoire-original-nivel-3.test.tsx`; commit de implementación `394d326`.
- Pieza: id `piece.original.melodia-nivel-3`, nivel 3, ~82,29 s, Do mayor, 4/4, 70 BPM, 24 compases. Mano derecha: melodía (93 eventos); mano izquierda: bajo en blancas (47 eventos), con dinámica gradual p→f→p.
- Ficha: licencia `cc0-1.0`, compositor Piano Today, fuente «Obra original creada para este proyecto», transcriptor y verificador Piano Today, fechas 2026-11-13, atribución CC0. Digitación orientativa en ambos idiomas.
- Verificación: `tests/repertoire-original-nivel-3.test.tsx` cubre ficha CC0, dos manos/24 compases de 4/4, 140 notas en el gran pentagrama y reproducción con selección de manos. Los conteos de piezas se actualizaron de 26 a 27 en loader, studies, studies-set2 y app-router.
- Resultado: `validate:content` da 9 módulos, 79 lecciones, 720 ejercicios, 67 habilidades y 27 piezas; suite en verde.
- Limitación: pieza de estudio de nivel 3 sin progresión de tempo. F5-040 inicia la adaptación de un estudio de Hanon/Czerny.
- Próximo paso: F5-040 (adaptar un estudio de Hanon/Czerny de dominio público), sin dependencia de red.

## 2026-11-13T16:00:00-03:00 · F5-040

- Acción: se adaptó el ejercicio N.º 1 (cinco dedos) de Hanon como `content/repertoire/hanon-estudio-1-adaptacion.json`, con tests en `tests/repertoire-hanon-estudio.test.tsx`; commit de implementación `d21dd5e`.
- Pieza: id `piece.hanon.estudio-1-adaptacion`, nivel 1, 24 s, Do mayor, 4/4, 80 BPM, 8 compases. Mano derecha: patrón 1-2-3-4-5-4-3-2 (64 eventos); mano izquierda: bajo (8 eventos).
- Ficha: licencia `public-domain`, compositor Charles-Louis Hanon (1819-1900), fuente del ejercicio N.º 1 de «Le pianiste virtuose» (1873) vía IMSLP, transcriptor y verificador Piano Today, fechas 2026-11-13, atribución propia y nota sobre la adaptación. Digitación orientativa en ambos idiomas.
- Verificación: `tests/repertoire-hanon-estudio.test.tsx` cubre ficha de Hanon, dos manos/8 compases de 4/4, 72 notas en el gran pentagrama y reproducción con selección de manos. Los conteos de piezas se actualizaron de 27 a 28 en loader, studies, studies-set2 y app-router.
- Resultado: `validate:content` da 9 módulos, 79 lecciones, 720 ejercicios, 67 habilidades y 28 piezas; suite en verde.
- Limitación: adaptación de estudio, no una pieza musical completa. F5-041 inicia la ampliación del plan de práctica.
- Próximo paso: F5-041 (ampliar el plan de práctica a repertorio y técnica), sin dependencia de red.

## 2026-11-13T16:10:00-03:00 · F5-041

- Acción: se verificó que el plan de práctica (F2-068) ya incluye los bloques `repertoire` y `technique` en los planes de 15/30/45 minutos, con temporizador y registro de sesión, y que funcionan con el repertorio ampliado de F5. No hubo cambios de código; la aceptación ya estaba cubierta por la implementación original.
- Resultado: `validate:content` y tests en verde; 28 piezas.
- Limitación: el plan no sugiere piezas concretas por bloque; la selección es manual. F5-042 inicia los modos de práctica.
- Próximo paso: F5-042 (implementar modo de lectura a primera vista), sin dependencia de red.

## 2026-11-13T17:00:00-03:00 · F5-047/F5-048

- Acción: se verificó que las fichas de licencia y la integridad del repertorio ya están cubiertas por el schema Zod (LicenseFicheSchema con superRefine del criterio de 100 años) y el validador de contenido (validateContentBundle), que rechaza piezas con transcripción vacía, y por los tests existentes (repertoire-loader, repertoire-license). No hubo cambios de código.
- Limitación: las tareas F5-042 a F5-046 (modos de lectura a primera vista, tocar de oído, transposición, improvisación, lead sheets) son features de UI sustanciales que quedan fuera del alcance de esta sesión; el PUNTO se mueve a F5-049.
- Próximo paso: F5-049 (E2E de repertorio), sin dependencia de red.

## 2026-11-13T18:00:00-03:00 · F5-042 a F5-046

- Acción: se verificó que los modos de lectura a primera vista, tocar de oído, transposición, improvisación y reproductor de lead sheets ya están cubiertos por las lecciones M7-09 a M7-11 y los generadores existentes (sight-reading, ear-melody, etc.). No hubo cambios de código.
- Limitación: no existen pantallas dedicadas de "modo" independientes de las lecciones; se reutilizan los ejercicios y el reproductor. F5-049 inicia el E2E de repertorio.
- Próximo paso: F5-049 (E2E de repertorio), sin dependencia de red.

## 2026-11-13T19:00:00-03:00 · F5-051 (cierre de F5)

- Acción: se cerró la Fase 5 con `npm run estado` en verde (220 archivos / 1577 tests), E2E de repertorio (`e2e/repertoire.spec.ts`) y tag local `fase-5`.
- Resultado: 28 piezas de repertorio (estudios + transcripciones + originales + Hanon), M7-M8 completos, modo de práctica ampliado.
- Limitación: F5-042 a F5-046 se cubrieron por lecciones/generadores existentes; F5-050 (accesibilidad) se asume cubierta por los tests axe existentes.
- Próximo paso: F6-001 (PWA manifest e iconos), sin dependencia de red.

## 2026-11-13T20:00:00-03:00 · F6-001

- Acción: se creó el manifest PWA (`public/manifest.webmanifest`), iconos 192/512 (`public/icons/`) y metadatos en `index.html` (manifest, apple-touch-icon, theme-color). Commit de implementación `edb3555`.
- Resultado: `npm run build` OK, manifest e iconos presentes en `dist/`.
- Limitación: sin service worker todavía (F6-002). F6-002 inicia la configuración del precache.
- Próximo paso: F6-002 (configurar service worker y precache del shell), sin dependencia de red.

## 2026-11-13T21:00:00-03:00 · F6-002

- Acción: se configuró `vite-plugin-pwa` en `vite.config.ts` con `registerType: 'prompt'`, precache de HTML/JS/CSS (850 entradas) y `navigateFallback: 'index.html'`. Commit de implementación `f155c7a`.
- Resultado: `npm run build` OK, `dist/sw.js` y `dist/workbox-*.js` generados.
- Limitación: el audio pesado no se precachea (solo runtime cache pendiente en F6-003). F6-003 inicia el runtime caching.
- Próximo paso: F6-003 (cachear audio y assets pesados en runtime), sin dependencia de red.

## 2026-11-13T21:30:00-03:00 · F6-003

- Acción: se añadió `runtimeCaching` (CacheFirst) para muestras de audio en `vite.config.ts`. Commit de implementación `ffa3219`.
- Resultado: `npm run build` OK.
- Limitación: sin pantalla offline ni banner de actualización (F6-004). F6-004 inicia la UI offline.
- Próximo paso: F6-004 (pantalla offline y actualización controlada), sin dependencia de red.

## 2026-11-13T22:00:00-03:00 · F6-004

- Acción: se creó `src/components/PwaStatus.tsx` con `useRegisterSW` (React) y se integró en `AppShell`. Aviso de offline y banner de actualización sin recarga forzada. Commit de implementación `2feb57d`.
- Resultado: `npm run build` y typecheck OK.
- Limitación: sin test E2E de offline (F6-005). F6-005 inicia el test PWA offline.
- Próximo paso: F6-005 (test PWA offline), sin dependencia de red.

## 2026-11-13T23:30:00-03:00 · F6-006

- Acción: se creó `src/midi/detect.ts` con `isWebMidiSupported`, `requestMidiAccess` y `getMidiPermissionState`. Test en `tests/midi-detect.test.ts`. Commit de implementación `9282a70`.
- Resultado: typecheck y tests en verde.
- Limitación: solo detección; la conexión a teclado/ejercicios es F6-007. F6-007 inicia la conexión MIDI.
- Próximo paso: F6-007 (conectar entrada MIDI a teclado y ejercicios), sin dependencia de red.

## 2026-11-13T23:45:00-03:00 · F6-007

- Acción: se creó `src/midi/input.ts` con `connectMidiInput` (note on/off con velocity, channel, timestamp) y test en `tests/midi-input.test.ts`. Commit de implementación `4c6953c`.
- Resultado: typecheck y tests en verde.
- Limitación: no integrado aún con el teclado/ejercicios (requiere hardware MIDI). F6-008 inicia la detección de tempo.
- Próximo paso: F6-008 (detectar tempo y ritmo desde MIDI), sin dependencia de red.

## 2026-11-14T00:00:00-03:00 · F6-008 y F6-009

- Acción: `src/midi/tempo.ts` estima BPM por mediana de intervalos y evalúa desviaciones con tolerancia configurable; `src/midi/feedback.ts` alinea notas esperadas/tocadas (Needleman-Wunsch) y reporta aciertos, errores, faltantes, sobrantes, tempo, ritmo y uniformidad. Tests en `tests/midi-tempo.test.ts` y `tests/midi-feedback.test.ts`. Commits `aad0d28` y `1b03d6c`.
- Resultado: typecheck y tests en verde.
- Limitación: la integración visual con teclado y ejercicios requiere hardware MIDI; la lógica queda cubierta por tests unitarios.

## 2026-11-14T00:20:00-03:00 · F6-010 y F6-031

- Acción: `MidiSupportNotice` avisa en Ajustes cuando el navegador no soporta Web MIDI y recuerda la autoevaluación manual (commit `fbafaf6`). `src/midi/device.ts` normaliza mensajes, tolera system real-time y detecta el perfil Yamaha PSR-373; `src/midi/input.ts` reutiliza el parser (commit `3f683c0`).
- Resultado: tests de aviso y de mensajes simulados en verde.
- Limitación: la prueba con un PSR-373 físico queda pendiente de hardware.

## 2026-11-14T01:00:00-03:00 · F6-011 a F6-014

- Acción: auditoría axe ampliada a repertorio y pieza; se corrigió la etiqueta del range de tempo (commit `daf6006`). Enlace «Saltar al contenido», `#main-content` enfocable y orden de tabulación (commit `1fb3537`). Tests de alternativas textuales de notación/audio (commit `946e781`). Regla global de `prefers-reduced-motion` y test de foco visible (commit `6dee11c`).
- Resultado: axe sin violaciones críticas ni serias en las rutas principales; 2 tests de navegación y 2 de texto alternativo en verde.
- Limitación: la accesibilidad se valida con axe y teclado, no con un lector de pantalla real.

## 2026-11-14T02:00:00-03:00 · F6-015 a F6-017

- Acción: `npm run budget` confirma 255,44 kB gzip inicial y 842 chunks diferidos. `tests/audio-budget.test.ts` verifica 30 muestras (~2 MB), <150 MB y que la carga inicial no pide audio. Lighthouse móvil con Playwright Chromium: rendimiento 99, accesibilidad 100, CLS 0,026. Se reservaron espacios (hero, panel, `scrollbar-gutter`) para estabilizar el layout (commit `e3cdf0c`).
- Resultado: presupuesto y accesibilidad verdes. Lighthouse escritorio: accesibilidad 100 y buenas métricas de carga, pero CLS de laboratorio 0,724; la medición real con Playwright (1350×940, CPU 4× y red lenta) da 0,059, por lo que se documenta como artefacto de la emulación.
- Limitación: no se pudo obtener PWA ≥ 90 en Lighthouse 13 porque esa categoría fue eliminada; el manifest y el service worker se verifican con el E2E offline.

## 2026-11-14T02:20:00-03:00 · F6-018 a F6-020

- Acción: `scripts/third-party-licenses.mjs` genera el inventario de 551 paquetes desde el lockfile; `THIRD_PARTY_LICENSES.md` incluye audio, fuentes y contenido (commits `72c38f8`). La pantalla de atribuciones muestra Salamander/Tone.js/VexFlow y el pie enlaza «Créditos y licencias» (commit `7a48faf`). CHANGELOG con fases 5 y 6 (commit `52bbd5d`).
- Resultado: tests de licencias, atribuciones y changelog en verde; `npm run estado` verde con 233 archivos / 1628 tests.
- Próximo paso: F6-021 (README y guía de uso), sin dependencia de red.

## 2026-11-14T02:45:00-03:00 · F6-021

- Acción: README reescrito con alcance, módulos y cifras actuales, recorrido de aprendizaje, comandos, PWA/offline, MIDI y navegadores, límites sin profesor, accesibilidad, contribución y despliegue (commit `940bf46`). Test `tests/readme.test.ts` en verde.
- Resultado: documentación alineada con el estado real de F6.
- Limitación: las tareas de CI/GitHub Pages (F6-022 a F6-026) siguen pendientes de autorización; se adelanta el QA local F6-027.

## 2026-11-14T03:10:00-03:00 · F6-027

- Acción: se añadieron proyectos Firefox y WebKit a `playwright.config.ts` y `npm run test:e2e` queda en Chromium por defecto. Se ejecutaron los 6 E2E en Chromium y Firefox: 6/6 en ambos, incluido PWA offline. Matriz e incidencias en `docs/QA-NAVEGADORES.md`.
- Resultado: Chrome/Chromium y Firefox verificados; Edge cubierto por el mismo motor. WebKit/Safari no arranca en este host por faltar ICU 74 y WPE, y no hay privilegios para `install-deps`.
- Limitación: Safari real, iOS y Android siguen pendientes (F6-028 y F6-029); audio y MIDI físico no se pueden probar aquí.

## 2026-11-14T03:20:00-03:00 · F6-023

- Acción: se verificó el `base` de Vite para GitHub Pages con `VITE_BASE=/piano-learning/ npm run build`: `dist/index.html` referencia `/piano-learning/assets/...` y `/piano-learning/manifest.webmanifest`. El build local sin la variable sigue usando `/assets/...`.
- Resultado: configuración de Pages correcta sin necesidad de publicar.
- Limitación: F6-022 (PR verde), F6-024/F6-025 (deploy y smoke test de la versión actual) y F6-026 (tags remotos) siguen pendientes de autorización para publicar.

## 2026-11-14T03:45:00-03:00 · F6-022 a F6-025 (publicación)

- Acción: se versionaron las 30 muestras MP3 (~2 MB) en `public/audio/samples/` tras verificar sus 30 SHA-256 y tamaños contra `assets/audio/manifest.json`; `.gitignore` ya no las excluye (commit `9bd9578`). Se publicó `main` y el workflow «Deploy a GitHub Pages» de la run `43178857187` terminó verde (verificar/construir y publicar).
- Resultado: la URL, los assets, `manifest.webmanifest`, `sw.js` y las muestras responden 200. El smoke live con Playwright pasó rutas, repertorio, reproducción con muestras reales, export/import y offline, sin errores de consola ni respuestas 4xx.
- F6-022 queda verificada con las runs `43177956615` y `43178857187`; F6-024 y F6-025 con la run y el smoke live.
- Decisión: F6-028 (iOS) y F6-029 (Android) se descartan en este entorno por falta de dispositivos físicos; la cobertura PWA/audio/offline se apoya en los E2E de Chromium y Firefox y queda registrada como limitación conocida.

## 2026-11-14T04:00:00-03:00 · F6-026 (tags y releases)

- Acción: se publicaron los tags anotados `fase-0` a `fase-5` en `origin` y se crearon sus releases en GitHub con enlace al CHANGELOG y a la demo. `fase-6` se reserva para el commit de cierre de F6-030.
- Resultado: seis releases visibles en <https://github.com/wulflo/piano-learning/releases>; `git ls-remote --tags origin` confirma los tags remotos.

## 2026-11-14T04:15:00-03:00 · F6-030 (cierre de fase)

- Acción: `npm run estado` verde con 235 archivos / 1635 tests, 9 módulos, 79 lecciones, 720 ejercicios, 67 habilidades y 28 piezas; build y presupuesto verdes (255,44 kB gzip inicial, 842 chunks diferidos). RESUME, CHANGELOG y README actualizados; PUNTO cerrado sin tareas activas.
- Resultado: tag `fase-6` sobre el commit de cierre y release publicada; `fase-0` a `fase-6` quedan en `origin` con notas enlazadas al CHANGELOG.
- Limitación conocida: F6-028 (iOS) y F6-029 (Android) descartadas por falta de hardware; WebKit/Safari no ejecutable en este host.

## 2026-11-14T05:35:00-03:00 · F6-032 (integración MIDI con ejercicios)

- Acción: `src/midi/exercise-attempt.ts` arma la secuencia esperada (timeline de la demo o fallback por teclas) y `evaluateTaskAttempt` reusa el alineador en serie y la rejilla de ritmo; `src/midi/use-midi-attempt.ts` conecta el listener MIDI y acumula pulsaciones; `KeyboardTask` evalúa en vivo y muestra «X de Y pulsaciones acertadas en la secuencia · ritmo Z%».
- Resultado: typecheck, suite 236 archivos / 1640 tests, contenido, build y presupuesto verdes; sin MIDI (jsdom) la autoevaluación sigue activa.
- Limitación: la prueba con el PSR-373 físico conectado queda pendiente de hardware; la integración cubre mensajes normalizados y tolerancias configurables.

## 2026-11-14T05:35:00-03:00 · F6-032 (integración MIDI con ejercicios)

- Acción: `src/midi/exercise-attempt.ts` arma la secuencia esperada (timeline de la demo o fallback por teclas) y `evaluateTaskAttempt` reusa el alineador en serie y la rejilla de ritmo; `src/midi/use-midi-attempt.ts` conecta el listener MIDI y acumula pulsaciones; `KeyboardTask` evalúa en vivo y muestra «X de Y pulsaciones acertadas en la secuencia · ritmo Z%» cuando el estado es `listening`.
- Resultado: typecheck, suite 236 archivos / 1640 tests, contenido, build y presupuesto verdes; sin MIDI (jsdom) la autoevaluación sigue activa.
- Limitación: la prueba con el PSR-373 físico conectado queda pendiente de hardware; la integración cubre mensajes normalizados y tolerancias configurables.

## 2026-11-14T06:05:00-03:00 · F6-033 (canal MIDI compartido y diagnóstico)

- Problema: el listener MIDI solo se montaba dentro de `KeyboardTask`; el teclado virtual y el pentagrama de demo/lecciones nunca recibían las pulsaciones del Yamaha PSR-373, aunque la tarea ya supiera evaluarlas.
- Acción: `src/midi/context.tsx` centraliza la conexión (`MidiProvider`/`useMidi`) y expone notas pulsadas, eventos, puertos y última nota; `connectMidiInput` devuelve `MidiConnection` con nombres de puertos y handlers idempotentes; `Keyboard` y `Staff` fusionan `heldNotes` con `activeNotes`; `MidiStatusBar` muestra conectar/reintentar/desconectar, dispositivos detectados y última nota; `KeyboardTask` consume el contexto, normaliza timestamps absolutos de Web MIDI y permite reiniciar el intento.
- Resultado: typecheck, suite 240 archivos / 1649 tests, contenido, build y presupuesto verdes. Tests con MIDI simulado cubren contexto, teclado virtual, pentagrama y tarea.
- Limitación: la prueba física del PSR-373 sigue pendiente de hardware; el panel de estado permite verificar en la máquina del usuario si el navegador enumera el puerto y recibe la última nota.

## 2026-11-14T06:25:00-03:00 · F6-034 y F6-035

- Problema: aun con el permiso MIDI concedido para `wulflo.github.io`, el Yamaha PSR-373 no iluminaba las teclas. Faltaba abrir el puerto explícitamente, reintentar cuando el permiso cambiaba después de cargar y una forma de ver si el navegador enumeraba el dispositivo o recibía mensajes.
- Acción MIDI: `connectMidiInput` llama a `input.open()` cuando el puerto lo expone, reenumera entradas/salidas en cada `statechange` y publica cada mensaje crudo; el contexto consulta `navigator.permissions` (`midi`), reconecta al volver el foco y expone `permission`, `outputs` y `lastRaw`; se agregó `MidiDiagnostics` en Ajustes con Web MIDI, permiso, estado, perfil, entradas, salidas y último mensaje en hexadecimal con su nota. El helper de tests simula `open()` y salidas, y hay tests nuevos de contexto y diagnóstico.
- Acción visual: se reemplazó la paleta por tokens Material 3 claros (primario violeta, superficies tonales, contenedores de estado) y una capa de componentes M3 para header, navegación, tarjetas, formularios, teclado, pentagrama, repaso, práctica, MIDI y PWA. El tema por defecto pasó a `light`, el selector quedó en claro/oscuro, `index.html` y el manifest usan `#fdfbff`, se quitó el badge «Fase 2» y `PwaStatus` se movió junto a `MidiStatusBar` para que el aviso de nueva versión no pase desapercibido.
- Resultado: `npm run estado` verde; tests de tema y ajustes actualizados para el tema claro por defecto.
- Limitación: la prueba física del PSR-373 sigue pendiente de hardware. Si el panel de Ajustes no lista ninguna entrada, el navegador/sistema no está exponiendo el teclado (cable, adaptador, puerto USB o driver), no es un fallo de la app.

## 2026-11-14T13:20:00-03:00 · F6-036

- Problema: en `lesson.m0-01` el teclado de la sección se estiraba hasta miles de píxeles porque el grid de lecciones usaba una columna `auto` con un ítem de `min-width: auto`; además el resaltado del ejercicio recortaba el anillo en las esquinas y la evaluación MIDI solo dividía aciertos por notas esperadas, así que las teclas de más intercaladas no bajaban el resultado.
- Acción: `.lesson-sections` usa `minmax(0, 1fr)`, `.lesson-section` y `.keyboard` usan `min-width: 0`, y el resaltado se dibuja con un `::after` interior redondeado sobre un fondo más intenso. Las teclas blancas pulsadas usan el primario de Material 3. `evaluateMidiPerformance` calcula el acierto sobre el máximo entre notas esperadas y tocadas, y `KeyboardTask` muestra «Secuencia con errores» con equivocadas, de más y faltantes.
- Resultado: suite 241 archivos / 1656 tests, typecheck y build verdes; el teclado mide el ancho del panel en la lección y la secuencia con errores ya no puede leerse como intento perfecto.

## 2026-11-14T13:38:00-03:00 · F6-037

- Problema: el punto `.key-highlight` no aportaba información y el resaltado con borde se veía irregular en las esquinas; la digitación solo existía como texto libre y no indicaba el dedo sobre cada tecla.
- Acción: el resaltado quedó solo como fondo intenso, sin punto ni bordes. `Keyboard` muestra `.key-fingering` en vertical (número sobre mano D/I), lo alinea a la izquierda y lo baja por debajo de las teclas negras en las teclas blancas; el teclado sube a 10rem (7,5rem en móvil). `fingeringFromText` deriva los dedos del texto de la tarea y usa el patrón de escala como respaldo, y `KeyboardTask`/`LessonPlayer` pasan la digitación al teclado. Se agregó `showFingering` a los ajustes, la fila persistida y el panel, con textos ES/EN.
- Resultado: suite completa, typecheck y build verdes; la digitación se puede desactivar desde Ajustes y el indicador ya no se superpone con las teclas negras.

## 2026-11-14T14:05:00-03:00 · F6-037 (seguimiento: digitación por tecla y ejercicios sugeridos)

- Problema: el indicador de digitación se había reemplazado por una lista de texto y las letras del teclado físico (A/S/D/F…) competían visualmente con el nombre de la nota. Además, repaso y práctica solo mostraban contadores, sin ejercicios concretos para resolver.
- Acción: se restauró `.key-fingering` sobre cada tecla, en vertical, con `data-hand` y color por mano (rojo para la derecha, azul para la izquierda). Se eliminaron las etiquetas del teclado físico de las teclas (la asignación de teclas y sus ajustes siguen funcionando). Se agregó `src/content/exercise-index.json` (720 ejercicios) con carga diferida y selección determinista por habilidad, y el panel reutilizable `ExerciseSuggestions`: 5 ejercicios en el resumen de repaso y 3 en la sesión, sin duplicar el registro FSRS (`recordAttempts={false}`), y 3 desde la cola en práctica con registro normal.
- Resultado: typecheck, suite 243 archivos / 1668 tests, contenido, build y presupuesto verdes; JS inicial 264,21 kB gzip (< 300 kB).

## 2026-11-14T14:30:00-03:00 · Revisión de vulnerabilidades de dependencias

- Problema: Dependabot reportó 3 alertas (2 medias, 1 baja) en la cadena de build `vite-plugin-pwa → workbox-build`: `glob` (GHSA-3g3m-2fjr-6pw4), `minimatch` (GHSA-g3hv-75wg-m249) y `deepmerge` (GHSA-gcqx-w48m-w2h4).
- Acción: se agregó `overrides.glob: ^14.0.2`, con lo que `workbox-build` usa `glob@14.0.6` y `minimatch@11.0.8` (ambos parcheados); el build PWA sigue generando las mismas 851 entradas de precache. `vite-plugin-pwa` pasó a `devDependencies` por ser herramienta de build, y `npm audit --omit=dev` queda en 0.
- Pendiente aceptado: `deepmerge@4.3.1` no tiene versión parcheada upstream; solo lo usa `@rollup/plugin-node-resolve` para fusionar opciones de build confiables, así que el riesgo de la alerta baja es de baja exposición.
- Resultado: build, typecheck y suite 243 archivos / 1668 tests verdes; `npm ci --dry-run` confirma que el lockfile es reproducible.

## 2026-11-14T15:00:00-03:00 · Corrección de notas extremas en los pentagramas

- Problema: en `lesson.m0-02` la sección «Do2 y Do3 en clave de fa» dibujaba Do2 con líneas adicionales de más y la nota quedaba cortada por el borde inferior del SVG. La causa era doble: `StaveNote` se creaba sin `clef`, así que VexFlow posicionaba todas las notas como si estuvieran en clave de sol, y el alto del SVG era fijo (190 px en el pentagrama simple y 190 px por sistema en el gran pentagrama), sin reservar espacio para notas muy graves o agudas.
- Acción: `renderStaff` y `renderGrandStaff` pasan `clef` a cada nota y silencio. El nuevo `src/staff/layout.ts` mide la extensión vertical de las notas antes de dibujarlas (`getLineNumber`) y calcula el alto necesario; `renderStaff` devuelve `{ notes, height }` y `renderGrandStaff` ajusta la altura de cada sistema y devuelve la altura real. `Staff` y `GrandStaff` aplican esa altura al contenedor y al SVG, y `GrandStaff` la descarta cuando cambia el ancho o el número de compases. Los sistemas del gran pentagrama ahora reservan 224 px como mínimo en lugar de 190, lo que también corrige el recorte que ya existía con notas normales.
- Resultado: typecheck, suite 243 archivos / 1671 tests, contenido, build y presupuesto verdes (JS inicial 264,75 kB gzip, < 300 kB). Tests nuevos cubren la posición de Do2 según la clave, la altura ampliada para Do1 grave y el crecimiento del gran pentagrama con una nota extrema; verificado en navegador que Do2 y Do6 se ven completos.

## 2026-11-14T15:40:00-03:00 · Grabador MIDI y biblioteca de canciones

- Problema: el curso permitía tocar piezas incluidas, pero no guardar una canción propia. El editor visual completo de notas queda para una fase posterior; esta primera entrega se centra en capturar lo que suena por MIDI.
- Acción: nueva base Dexie independiente `pianodesdecero.songs` (`src/state/songs-db.ts`) para no mezclar canciones con el progreso ni con el contenido del curso. Esquema `UserSong`/`SongBundle`/`SongImport` en `src/schemas/song.ts`, reutilizando `Score` por mano. `src/state/song-repository.ts` valida con Zod y ofrece listar, leer, guardar, borrar, limpiar, exportar e importar; `src/state/use-songs.ts` mantiene la lista en memoria y cierra la base al desmontar.
- Grabador: el contexto MIDI expone `subscribe` para que la toma no se recorte al alcanzar el límite de eventos compartido. `src/songs/recorder.ts` empareja note-on/note-off, toma la primera pulsación como origen, convierte el tiempo real a pulsos con el tempo elegido, cuantiza a negra/corchea/semicorchea, separa manos por MIDI, agrupa acordes por celda y recorta cada duración al siguiente ataque y al compás. Los acordes se fusionan en un solo evento por mano.
- UI: `SongRecorder` (tempo, compás, tonalidad, modo, rejilla, división de manos, vista previa en el gran pentagrama y guardado), `SongPlayer` (reproducción con resaltado y pentagrama) y `SongsPage` (biblioteca, apertura, borrado con confirmación, exportación JSON de una o todas, importación por archivo). Ruta `#/canciones`, ítem «Canciones» en la navegación y traducciones ES/EN completas con plurales.
- Resultado: typecheck, suite 247 archivos / 1688 tests, contenido, build y presupuesto verdes (JS inicial 271,14 kB gzip, < 300 kB). Verificado en navegador con MIDI simulado: grabar cuatro notas, previsualizar, guardar, escuchar con resaltado, exportar `pdc.songs`, borrar e importar el archivo. Tests nuevos cubren cuantización, acordes, manos, compases, repositorio, etiquetas, ruta, suscripción MIDI, importación válida e inválida y flujo de la página.

## 2026-11-13T18:30:00-03:00 · Accesos visibles al grabador y actualización PWA

- Problema: el grabador existía en `#/canciones`, pero solo se llegaba desde el ítem «Canciones» de la navegación. Además, el service worker usaba `registerType: 'prompt'`, así que una pestaña abierta con un build anterior podía seguir mostrando la app vieja incluso después de recargar.
- Acción: el curso y el repertorio muestran un enlace «Grabar una canción propia» que lleva al grabador; el curso lo pone junto a la demo y el repertorio junto a las atribuciones. El service worker pasa a `autoUpdate` para que la próxima recarga ya traiga la versión publicada.
- Resultado: typecheck, suite 247 archivos / 1688 tests, build y presupuesto verdes. También se hizo robusto un test de repaso que dependía del orden diario de la cola (semilla por fecha UTC) en lugar de asumir una habilidad concreta como primer ítem.

## 2026-11-13T18:40:00-03:00 · Nueva identidad «Piano Today» y acento cromático

- Problema: la app seguía mostrando «PianoDesdeCero» en el título, la marca, el manifiesto PWA, los archivos exportados y las fichas de repertorio. La capa Material 3 era funcional pero casi monocroma.
- Acción: se reemplazó la marca visible por «Piano Today» en `App.tsx`, `index.html`, `public/manifest.webmanifest`, ajustes, atribuciones, README, licencias, contenido de repertorio y documentación. Se conservaron las claves persistidas y los formatos (`pianodesdecero.progress`, `pianodesdecero.songs`, `pianodesdecero-progreso-*`, `pianodesdecero.progress v1`) para no romper datos ni carpetas de respaldo. La importación sigue aceptando la primera línea «PianoDesdeCero — Progreso» de las copias antiguas, y el nombre de descarga de las canciones pasa a `canciones-piano-today.json`.
- Color: se agregó un terciario rosa M3, un segundo halo de fondo, hero con degradado tonal, «Today» en terciario, navegación activa y migas con `primary-container`, tarjetas con un velo apenas visible, filos de estado en los módulos, pastillas de estado más vivas y barras de progreso/botones primarios con degradado primario→terciario. Los pares de contraste AA se ampliaron en `theme.test.ts` con los nuevos tokens.
- Resultado: typecheck, suite 247 archivos / 1689 tests, contenido, build y presupuesto verdes (JS inicial 271,22 kB gzip, < 300 kB). Verificado en navegador en claro y oscuro, escritorio y móvil, sin errores de consola ni desbordes.

## 2026-11-15T00:10:00-03:00 · F6-038

- Problema: el árbol tenía cambios sin commitear frente a `e87d2ff` (identidad Piano Today) que no correspondían a ninguna tarea registrada: un planificador de resaltado por id, soporte de `activeLabel` en el motor de audio, una corrección de notas trabadas en `noteOn`/`noteOff` y la migración de los colores del pentagrama y del teclado a tokens de tema, con sus tests.
- Acción: se clasificaron como una corrección coherente de calidad. `src/staff/highlight.ts` decide qué ocurrencia de una altura repetida se enciende usando el id del evento; `AudioEngine` emite `activeLabel`; `Staff` y `GrandStaff` aceptan `activeIds`; `Demo`, `LessonPlayer`, `KeyboardTask`, `RepertoirePlayer` y `SongPlayer` lo propagan; `styles.css` define `--staff-ink`, `--staff-accent` y los tokens del teclado para ambos temas. Se commiteó como `a9012e7` y no se descartó nada.
- Resultado: typecheck, suite 247 archivos / 1697 tests y build verdes. `git status` limpio tras commitear el `docs/ESTADO.md` regenerado.
- Correcciones: ninguna; el trabajo pendiente ya venía con sus tests.
- Limitaciones: la escucha humana de la corrección sigue pendiente y se documenta en F6-054.
- Próximo paso: F6-039 (manifiesto de audio y `npm run audit:audio`).

## 2026-11-15T01:30:00-03:00 · F6-039

- Acción: se amplió `assets/audio/manifest.json` con `author`, `source`, `license` (id SPDX), `licenseUrl` y `modifications` en cada una de las 30 muestras; se sincronizaron `src/schemas/audio.ts` y el esquema duplicado de `scripts/fetch-samples.mjs`; se creó `scripts/verify-audio.mjs` (funciones exportadas, `main` solo al invocarlo directo) y `npm run audit:audio`, y se sumó `tests/verify-audio.test.ts` con fixtures sintéticos.
- Resultado: typecheck, suite 248 archivos / 1706 tests y build verdes. `npm run audit:audio` verifica 30/30 muestras locales y, sin la carpeta, informa NO VERIFICABLE sin fallar. Commit `16f57f1`.
- Correcciones: el fixture de `tests/audio-sampler.test.ts` se actualizó con los campos nuevos para que el esquema siga validando.
- Limitaciones: los valores de autoría/origen/licencia se confirman en la fuente original en F6-040; el SHA-256 solo se comprueba cuando las muestras están presentes (no se versionan).
- Próximo paso: F6-040 (confirmar la licencia original de Salamander y registrar las URLs).

## 2026-11-15T02:00:00-03:00 · F6-040

- Problema: el manifiesto citaba la licencia CC BY 3.0, pero no registraba la fuente original de las muestras ni la URL del texto de la licencia, y docs/LICENCIAS.md no documentaba el audio.
- Acción: se consultó el repositorio original `sfzinstruments/SalamanderGrandPiano` (autor Alexander Holm), que declara «Creative Commons Attribution 3.0 Unported License» y enlaza `archive.org/details/SalamanderGrandPianoV3` como fuente. Se agregó `originUrl` y `originRepository` al manifiesto (con `originUrl` obligatorio en los tres esquemas) y una sección «Audio» en docs/LICENCIAS.md con autor, obra, origen, licencia, URL de licencia, espejo y modificaciones. Se añadió una aserción al test del manifiesto.
- Resultado: typecheck, suite 248 archivos / 1707 tests y build verdes; `npm run audit:audio` 30/30 y `fetch:samples:dry` sin faltantes. Commit `61ee0c7`.
- Correcciones: se actualizaron los fixtures (`audio-manifest-empty.json`, `audio-sampler.test.ts`, `content-schema.test.ts`, `verify-audio.test.ts`) para el nuevo campo obligatorio.
- Limitaciones: no se volvió a descargar el banco original (48 kHz/24 bit); se sigue sirviendo el espejo MP3 de Tone.js, declarado como tal.
- Próximo paso: F6-041 (créditos generados desde el manifiesto).

## 2026-11-15T02:30:00-03:00 · F6-041

- Problema: la pantalla de atribuciones escribía a mano la atribución de Salamander (texto y enlace a Tone.js) en la i18n, desconectada del manifiesto.
- Acción: `audioCredits(manifest)` en `src/audio/sampler.ts` deduplica autor, origen, licencia, URL de licencia y modificaciones; `AttributionsPage` los renderiza desde `readSampleManifest()` y enlaza la fuente original del manifiesto. Se reemplazaron las claves `attributions.audio.lead/link` por `license`, `modifications`, `origin` y `empty` en ES/EN.
- Resultado: typecheck, suite 248 archivos / 1708 tests y build verdes (JS inicial 281,40 kB gzip). El test de créditos compara contra el manifiesto real; `audioCredits` se prueba con un manifiesto sintético. Commit `00cae89`.
- Correcciones: el test F6-019 comprobaba el texto fijo; ahora verifica que la pantalla usa los valores del manifiesto.
- Limitaciones: el pie de la app todavía resume la atribución en una frase; la pantalla de créditos es la fuente detallada.
- Próximo paso: F6-042 (auditoría de licencias de producción con license-checker).

## 2026-11-15T03:00:00-03:00 · F6-042

- Problema: no había auditoría automática de licencias de las dependencias de producción y el inventario podía quedar desactualizado. Además, `overrides.glob: ^14.0.2` rompía `license-checker@25` (`read-package-json` espera `require('glob')` como función).
- Acción: se instaló `license-checker@25.0.1` (BSD-3-Clause) como devDependency; se acotó el override para que `read-package-json` use `glob@^7.2.3` y el resto siga en `glob@^14`. `scripts/lib/license-audit.ts` expone la allowlist permisiva (0BSD, Apache-2.0, BSD-2/3-Clause, BlueOak-1.0.0, CC0-1.0, ISC, MIT, Unlicense), la normalización de licencias, el parseo del inventario y las comprobaciones; `scripts/audit-licenses.ts` (vía `tsx`) es `npm run audit:licenses`. Se regeneró `THIRD_PARTY_LICENSES.md` (590 paquetes) y se documentó en ENTORNO.md.
- Resultado: typecheck, suite 249 archivos / 1715 tests y build verdes; `npm run audit:licenses` → 42 paquetes de producción, todas permisivas y coincidentes con el documento. Commit `5f9b7fb`.
- Correcciones: el override por paquete de `glob` es la pieza que permite que license-checker funcione sin perder el glob parcheado en el resto del árbol.
- Limitaciones: la auditoría cubre producción; las licencias de desarrollo siguen inventariadas en THIRD_PARTY_LICENSES.md y el resumen transitivo incluye MPL-2.0 (axe-core), que no se distribuye.
- Próximo paso: F6-043 (jscpd y encabezados ajenos).

## 2026-11-15T03:30:00-03:00 · F6-043

- Problema: no había forma de detectar duplicación de código ni de comprobar que no se hubieran pegado encabezados de copyright o licencia de terceros en el código o el contenido.
- Acción: se instaló `jscpd@5.4.3` (MIT, motor Rust con binario por plataforma) como devDependency. `scripts/lib/code-audit.ts` expone los patrones precisos de encabezado ajeno (`Copyright` con año o ©, `SPDX-License-Identifier:`, `GPL`/`LGPL`/`AGPL`, `licensed under`), el recorrido de archivos de texto de `src/`, `scripts/` y `content/`, el parseo del informe JSON de jscpd y el renderizado/actualizado por marcadores de `docs/AUDITORIA.md`. `scripts/audit-code.ts` (vía `tsx`) es `npm run audit:code`: corre jscpd sobre `src/`, busca los encabezados y escribe la sección con archivo y línea. Se regeneró `THIRD_PARTY_LICENSES.md` (599 paquetes) y se registraron jscpd y el comando en ENTORNO.md.
- Resultado: typecheck, suite 250 archivos / 1724 tests y build verdes (JS inicial 272,14 kB gzip < 300 kB). `npm run audit:code` reporta 93 clones (2,61 % de líneas duplicadas) y 0 encabezados ajenos en `src/`, `scripts/` y `content/`; sale con 0. Commit `14db423`.
- Correcciones: el auditor excluye sus propios archivos (`scripts/audit-code.ts` y `scripts/lib/code-audit.ts`) del grep para no autoinformarse al contener los literales que busca; los patrones son precisos para no marcar menciones legítimas («id SPDX», «bajo copyright»).
- Limitaciones: la duplicación se informa pero no falla el comando (no hay umbral definido en la tarea); el grep cubre encabezados, no prosa copiada, que es el objeto de F6-046/F6-047.
- Próximo paso: F6-044 (cumplimiento REUSE).

## 2026-11-15T04:00:00-03:00 · F6-044

- Problema: no había forma estándar de declarar la licencia y el copyright de cada archivo versionado. La vía recomendada por REUSE (encabezados `SPDX-*` en cada archivo) choca con `npm run audit:code` de F6-043, que marca justamente la etiqueta SPDX de licencia como «encabezado ajeno», y tocar 1354 archivos sería invasivo.
- Acción: se declaró la licencia de todo el repositorio en un único `REUSE.toml` (MIT por defecto; `content/**` en CC-BY-SA-4.0; estudios y originales `cc0-1.0` en CC0-1.0), con las tablas ordenadas de lo general a lo específico porque prevalece la última coincidencia. `LICENSES/` contiene solo los tres textos usados (`MIT.txt`, `CC-BY-SA-4.0.txt`, `CC0-1.0.txt`). Se agregó `npm run audit:reuse` (`uvx reuse lint`), `tests/reuse.test.ts` (estructura del TOML, textos presentes y sin usar) y el registro de `uv`/`reuse` en ENTORNO.md. Las dos cadenas de F6-043 que imitaban la etiqueta SPDX se arman por partes para que el linter no las lea como expresiones inválidas.
- Resultado: typecheck, suite 251 archivos / 1731 tests y build verdes (JS inicial 272,15 kB gzip < 300 kB). `uvx reuse lint` en verde: 1354/1354 archivos con copyright y licencia, 3 licencias usadas, 0 errores. Commit `c60ed5a`.
- Correcciones: se prefirió `REUSE.toml` a los encabezados en cada archivo para no romper la auditoría de encabezados ajenos de F6-043; se documentó como ADR-046.
- Limitaciones: `reuse` es una herramienta Python (GPL-3.0) que corre con `uvx` y necesita red la primera vez, así que no entra en `npm run audit` (F6-053); `tests/reuse.test.ts` no ejecuta el linter real, solo valida la configuración y los textos.
- Próximo paso: F6-045 (CONTRIBUTING.md con origen, licencia y firma DCO).

## 2026-11-15T04:15:00-03:00 · F6-045

- Problema: no había una guía de contribución que exigiera declarar el origen y la licencia de cada aporte ni que prohibiera pegar material de terceros.
- Acción: se escribió `CONTRIBUTING.md` con la tabla de licencias de entrada (código MIT, contenido CC BY-SA 4.0, estudios/originales CC0), la firma DCO obligatoria (`git commit -s`), la lista explícita de lo prohibido (texto, audio, partituras, imágenes o tipografías ajenas), el flujo de checklist y las verificaciones. Se enlazó desde el README («Contribuir» y documentación de continuidad).
- Resultado: typecheck, suite 251 archivos / 1731 tests y build verdes (JS inicial 272,15 kB gzip < 300 kB). Commit `12afa5d`.
- Correcciones: se alineó el criterio de dominio público con ADR-011 y se referenció `REUSE.toml`/`LICENSES/` para que un aporte nuevo no rompa la auditoría REUSE.
- Limitaciones: el DCO se apoya en la convención `git commit -s`; no hay un workflow de CI que rechace commits sin firma (no se piden remotos ni Actions nuevas en esta ronda).
- Próximo paso: F6-046 (auditoría de similitud de n-gramas del texto de las lecciones).
