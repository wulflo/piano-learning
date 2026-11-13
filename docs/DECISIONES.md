# DECISIONES — Piano Today

Registro breve de decisiones de arquitectura (contexto, decisión, alternativas,
consecuencias).

## ADR-001 — Stack base

- **Contexto:** app estática para GitHub Pages, sin backend, con audio y notación.
- **Decisión:** Vite + React + TypeScript estricto; npm con lockfile commiteado.
- **Alternativas:** Next.js estático (más peso y complejidad), Svelte (ecosistema
  de notación/audio más chico).
- **Consecuencias:** build simple y reproducible; se vigila el presupuesto de JS
  (< 300 KB inicial) con code splitting.

## ADR-002 — Librería de pentagrama: VexFlow

- **Contexto:** se necesita resaltar notas y acordes individuales, sincronizar con
  audio y renderizar piezas multipentagrama.
- **Decisión:** VexFlow con un renderer propio encapsulado.
- **Alternativas:** abcjs (más rápido de integrar, menos control por nota),
  render propio en SVG (demasiado costo).
- **Consecuencias:** más código de integración, pero control fino de resaltado,
  claves y eventos; se carga en un chunk separado.

## ADR-003 — Teoría: Tonal + capa propia de ortografía

- **Contexto:** Tonal calcula bien, pero la grafía enharmónica no siempre coincide
  con la tonalidad (bemoles/sostenidos esperados).
- **Decisión:** usar Tonal para cálculos y una capa `src/theory` que impone la
  ortografía según tonalidad y modo.
- **Alternativas:** confiar en Tonal (errores pedagógicos), escribir toda la teoría
  desde cero (reinventar demasiado).
- **Consecuencias:** tests exhaustivos en 12 tonalidades antes de escribir
  lecciones; toda la app consume la capa propia, no Tonal directamente.

## ADR-004 — Audio: Tone.js Sampler + fallback

- **Contexto:** piano realista, offline, iOS, con presupuesto acotado.
- **Decisión:** Salamander reducido (una muestra cada tercera menor, 2 capas,
  MP3/M4A), carga diferida, `PolySynth` como fallback y metrónomo sintetizado.
- **Alternativas:** piano completo (demasiado peso), sintetizador puro (peor
  experiencia), Web Audio manual (más trabajo).
- **Consecuencias:** audio total < 150 MB (objetivo 10-20 MB); la app debe sonar
  aunque falten las muestras; inicialización solo tras gesto del usuario.

## ADR-005 — FSRS con `ts-fsrs`

- **Contexto:** repetición espaciada con 4 calificaciones y ajustes de retención.
- **Decisión:** `ts-fsrs` con parámetros por defecto, historial completo persistido
  y optimización diferida a un spike (F2-047).
- **Alternativas:** SM-2 casero (peor calidad), servicio externo (rompe local-first).
- **Consecuencias:** planificación testeada con fixtures deterministas; el
  historial permite optimizar más adelante sin migrar datos.

## ADR-006 — Persistencia: IndexedDB con Dexie

- **Contexto:** progreso local, migraciones y exportación portable.
- **Decisión:** Dexie 4 con esquema versionado y exportación `.txt` (cabecera,
  JSON canónico y SHA-256 vía WebCrypto).
- **Alternativas:** localStorage (límite y sin transacciones), SQLite WASM (más peso).
- **Consecuencias:** migraciones explícitas y test de ida y vuelta
  exportar→importar→exportar.

## ADR-007 — Contenido validado con Zod en el build

- **Contexto:** el contenido y las fichas de licencia son datos críticos.
- **Decisión:** esquemas Zod + validador con referencias cruzadas; `prebuild`
  falla si falta compositor, fuente, licencia o transcripción.
- **Alternativas:** validación en runtime solamente (errores tarde), TypeScript
  puro (no valida JSON).
- **Consecuencias:** el build es la puerta de calidad; los fixtures negativos son
  parte de la suite.

## ADR-008 — Router por hash y PWA

- **Contexto:** GitHub Pages sirve archivos estáticos y la app debe funcionar
  offline tras la primera carga.
- **Decisión:** hash router; `vite-plugin-pwa` con precache del shell y runtime
  cache para audio.
- **Alternativas:** BrowserRouter + `404.html` (frágil), sin PWA (rompe offline).
- **Consecuencias:** URLs con `#`; el audio no se precachea para no inflar la
  instalación.

## ADR-009 — i18n propio y notación bilingüe

- **Contexto:** presupuesto de JS y necesidad de Do-Re-Mi / C-D-E en toda la app.
- **Decisión:** diccionarios tipados propios, ES por defecto, EN preparado; selector
  global de notación persistido; cifrado de acordes bilingüe.
- **Alternativas:** `react-i18next` (peso y complejidad innecesarios al inicio).
- **Consecuencias:** hay que mantener paridad de claves con un test; el contenido
  de lecciones arranca en ES y el esquema deja lugar a EN.

## ADR-010 — Git local, GitHub solo con autorización

- **Contexto:** el protocolo exige hashes y tags, pero el usuario pidió no tocar
  GitHub todavía.
- **Decisión:** git local en `main`, sin remoto, sin push, sin Actions/Pages.
- **Alternativas:** trabajar sin git (rompe la trazabilidad del checklist).
- **Consecuencias:** los commits y tags `fase-N` son locales; la publicación se
  hará en F6 cuando el usuario lo autorice.

## ADR-011 — Criterio conservador de dominio público

- **Contexto:** el repertorio debe ser legalmente publicable.
- **Decisión:** obras de compositores fallecidos hace más de 100 años o melodías
  tradicionales anónimas; transcripciones y arreglos siempre propios; ficha
  obligatoria con fuente, fechas, licencia y transcriptor.
- **Alternativas:** confiar en “está en internet” (riesgo legal).
- **Consecuencias:** algunas piezas candidatas quedarán fuera; el build falla si
  falta un campo y cada ficha se verifica con fecha.

## ADR-012 — Guardado de progreso en carpeta personal

- **Contexto:** se propuso que la app publicada en GitHub Pages guarde el progreso
  en una carpeta personal. Pages solo sirve archivos estáticos: no existe una
  carpeta del servidor donde escribir, y el navegador no puede modificar el
  repositorio por su cuenta.
- **Decisión:** mantener IndexedDB como almacenamiento principal y la exportación
  `.txt` con JSON canónico y SHA-256 (F2-054 a F2-056). La escritura en una carpeta
  local del usuario queda como mejora opcional y diferida (F2-056a), usando la
  File System Access API con selección explícita de carpeta y fallback a descarga.
  No se escribe en GitHub con tokens ni se agrega sincronización en la nube.
- **Alternativas:** token de GitHub en el navegador (riesgo de seguridad y commits
  de progreso), backend o Drive/Dropbox (rompe local-first, añade cuentas y red),
  solo localStorage (límite de tamaño y sin transacciones).
- **Consecuencias:** el guardado en carpeta funciona solo en Chromium de escritorio,
  requiere un gesto y puede volver a pedir permiso; en el resto de navegadores se
  usa IndexedDB y la descarga normal. El principio local-first no cambia.

## ADR-013 — Publicación temprana en GitHub Pages (autorizada)

- **Contexto:** el usuario pidió una URL pública para ver el avance de la app
  antes de llegar a F6. El repositorio ya existía vacío y público en
  `wulflo/piano-learning`, con Pages habilitado para GitHub Actions.
- **Decisión:** agregar `origin`, publicar `main` y desplegar `dist/` con
  `.github/workflows/deploy-pages.yml` en cada push. El workflow corre typecheck,
  tests y build, calcula `VITE_BASE=/<repo>/` y usa el artefacto de Pages, no
  `/docs`.
- **Alternativas:** esperar a F6 (sin preview), publicar la carpeta `/docs`
  (mezcla fuente y build) o usar un servicio externo (sale de GitHub Pages).
- **Consecuencias:** la demo queda en <https://wulflo.github.io/piano-learning/>.
  Las tareas F6-022 a F6-024 se adelantaron; su cierre formal en el checklist
  queda sujeto a las dependencias y a la verificación de F6-025. Las muestras de
  audio no se versionan, así que Pages usa el sintetizador de respaldo.

## ADR-014 — Optimizador de FSRS: exportación manual primero, WASM después

- **Contexto:** F2-047 pide investigar cómo optimizar los parámetros de FSRS en
  el navegador. La app es local-first, se publica como sitio estático en GitHub
  Pages y ya persiste el historial completo de repasos. GitHub Pages no permite
  configurar cabeceras HTTP propias, así que las alternativas que exigen
  aislamiento de origen cruzado (`COOP`/`COEP`) no son viables en producción.
- **Opciones evaluadas (2026-11-11):**
  1. `@open-spaced-repetition/binding` 0.6.0 (MIT, beta pública): bindings de
     `fsrs-rs` compilados a WASI. Ofrece `convertCsvToFsrsItems`,
     `computeParameters`, progreso y soporte FSRS-6/7. Se puede cargar en un
     Worker dedicado con el target `wasm32-wasip1` (sin threads) o
     `wasm32-wasip1-threads`; el paquete principal pesa ~1,6 MB y la WASM
     ~1,5 MB. La documentación recomienda `COOP`/`COEP` para el despliegue en
     navegador y el paquete exige Node >= 24 para construir.
  2. `fsrs-browser` 6.6.0 (BSD-3): scheduler y optimizador de `fsrs-rs` en
     WASM, ~387 KB desempaquetado. Su API es de bajo nivel (typed arrays,
     `Fsrs.free()`) y usa `SharedArrayBuffer`/threads, por lo que requiere
     `COOP`/`COEP`.
  3. Optimizador en servidor o script externo (`py-fsrs`, `fsrs-optimizer`,
     `fsrs-rs-python`): es la implementación de referencia, pero exige red o un
     paso manual fuera de la app y rompe el principio local-first si se sube el
     historial.
  4. No optimizar: mantener los parámetros por defecto de FSRS-6. Es el estado
     actual, funciona sin red y ya está probado con fixtures deterministas.
- **Decisión:** no incorporar un optimizador WASM al bundle durante la Fase 2.
  Se mantienen los parámetros por defecto y se exporta el historial en CSV
  compatible con el revlog de Anki (`review_time,card_id,review_rating,
  review_duration,review_state`) mediante `src/state/optimizer-export.ts`; la
  persona puede optimizar fuera de la app y, cuando exista una tarea de
  importación, cargar los pesos resultantes. La ruta futura preferida es
  `@open-spaced-repetition/binding` con el target WASI sin threads en un Worker
  dedicado y carga diferida, precedida por un spike que verifique que funciona
  sin `COOP`/`COEP`. Si ese spike falla, se mantiene la exportación manual.
  `fsrs-browser` se descarta por su requisito de aislamiento y su API de bajo
  nivel; el optimizador en servidor se descarta por privacidad y por depender
  de red.
- **Consecuencias:** el bundle inicial no crece y la app sigue funcionando
  offline. El CSV no sale del dispositivo. La importación de pesos todavía no
  existe: el esquema de ajustes no guarda los 21 pesos de FSRS-6 y
  `createFsrsScheduler` aún no recibe `w`; agregarlos requiere una migración y
  una tarea posterior. Los ids de tarjeta del CSV se asignan por orden
  alfabético de `itemId` en cada exportación, así que sirven para agrupar el
  historial de un archivo pero no deben usarse como identificadores estables
  entre exportaciones. El optimizador de Anki usa como máximo un repaso por
  tarjeta y día; los pasos de aprendizaje del mismo día se pueden incluir en el
  CSV porque la herramienta los filtra. Se recomienda reoptimizar como mucho
  una vez al mes o tras 512, 1024, 2048… repasos.
- **Referencias:**
  - <https://github.com/open-spaced-repetition/ts-fsrs/tree/main/packages/binding>
  - <https://github.com/open-spaced-repetition/fsrs-browser>
  - <https://open-spaced-repetition.github.io/awesome-fsrs/>
  - <https://github.com/open-spaced-repetition/fsrs4anki/blob/main/docs/tutorial.md>
  - <https://registry.npmjs.org/@open-spaced-repetition%2Fbinding>
  - <https://registry.npmjs.org/fsrs-browser>

## ADR-015 — XP, niveles y logros: recompensa monotónica y perfil persistido

- **Contexto:** F2-052 pide XP por actividad, una curva de niveles, diez logros y
  la garantía de no perder XP. La app es local-first y el progreso ya vive en
  IndexedDB; los logros no pueden depender de un servicio externo ni borrarse al
  recalcular el estado.
- **Decisión:**
  - XP por actividad: lección completada 50, ejercicio correcto 10, minuto de
    práctica 2 y repaso según la calificación (otra vez 2, difícil 6, bien 10,
    fácil 12). Se premia el esfuerzo también en los fallos para no castigar el
    repaso.
  - Curva triangular: cada nivel cuesta 100 XP más que el anterior. Para llegar
    al nivel `n` hacen falta `100 · (n−1) · n / 2` XP acumulados; el nivel 2
    empieza a los 100 XP, el 3 a los 300 y el 4 a los 600.
  - El perfil (XP, nivel, logros y racha) se guarda en una fila `profile` de una
    tabla nueva `profile` en Dexie v2. La migración solo agrega la tabla y no
    toca los datos de la versión 1.
  - `ProfileRepository.update` ejecuta la transformación en una transacción y
    aplica `max(xp actual, xp propuesto)` y la unión de logros: una actualización
    nunca puede reducir el XP ni borrar un logro. `awardXp` ignora cantidades
    negativas o no finitas.
  - Los diez logros se evalúan con una función pura a partir de un contexto
    (nivel, lecciones, repasos, minutos, racha, habilidades dominadas y sesión
    más larga). Un logro conseguido conserva su fecha y no se vuelve a bloquear.
- **Alternativas:** curva lineal (progresión demasiado plana y sin sensación de
  hito), gamificación en servidor (rompe la privacidad y el modo offline), una
  tabla por logro (más migraciones y consultas para el mismo dato) y guardar el
  XP solo en `localStorage` (sin transacciones ni exportación portable).
- **Consecuencias:** la lógica de XP y logros es testeable sin UI ni reloj real;
  el perfil entra en la exportación de progreso existente. El nivel se deriva
  del XP y se normaliza al guardar y al actualizar, así que no puede quedar
  desincronizado. El campo `streak` queda reservado para F2-053.
- **Limitación:** las actividades todavía no llaman a `applyActivity` desde los
  flujos de lección, ejercicio o repaso, y el contexto de logros debe
  construirse a partir de los repositorios; ambas integraciones llegan con las
  pantallas de progreso. Al ser local-first no hay validación anti-trampas: el
  XP es una recompensa personal, no una clasificación.

## ADR-016 — Racha con un día de gracia por semana ISO

- **Contexto:** F2-053 pide una racha que no se rompa por un día fallado a la
  semana, que se reinicie con un criterio claro y que se pueda probar con un
  calendario determinista. La app no tiene servidor ni zona horaria fija.
- **Decisión:**
  - Las fechas de práctica son días ISO (`YYYY-MM-DD`) y todos los cálculos se
    hacen en UTC, de modo que el horario de verano no altere la cuenta.
  - La semana de gracia es la semana ISO de lunes a domingo. La gracia se
    atribuye al día fallado, no al día en que se vuelve a practicar.
  - Registrar el mismo día dos veces es idempotente. Un día consecutivo suma
    uno. Un solo día fallado suma uno y consume la gracia de esa semana si
    todavía está disponible. Dos días seguidos sin practicar, o un segundo día
    fallado en la misma semana, reinician la racha a 1.
  - La gracia se recupera al cambiar de semana. Si el día fallado pertenece a la
    semana anterior (por ejemplo, domingo), no consume la gracia de la semana
    nueva.
  - Al reiniciar se conserva la racha más larga. Las fechas anteriores a la
    última práctica se ignoran, así que la racha nunca retrocede.
  - `ProfileRepository.recordPractice` persiste el resultado dentro de la misma
    transacción que protege el XP y los logros.
- **Alternativas:** ventana móvil de siete días (más difícil de explicar y de
  probar), gracia ilimitada (una racha deja de significar constancia), contar en
  la zona horaria local (resultados distintos según el dispositivo y el horario
  de verano) y guardar la racha en `localStorage` (sin transacciones ni
  exportación portable).
- **Consecuencias:** `recordPracticeDay` y `streakFromPracticeDates` son puras y
  testeables sin UI ni reloj real; `isLastPracticeDay` permite evitar dobles
  registros en la interfaz. La racha entra en el perfil exportable.
- **Limitación:** los flujos de lección, ejercicio y repaso todavía no registran
  la práctica diaria; la integración llega con las pantallas de progreso. La
  racha no se reconstruye automáticamente desde las sesiones históricas, aunque
  `streakFromPracticeDates` deja preparado ese camino. Un día fallado antes de
  la primera práctica registrada no existe para el cálculo.

## ADR-017 — Formato del archivo de progreso: texto legible, JSON canónico y SHA-256

- **Contexto:** F2-054 pide exportar el progreso a un `.txt` legible, con hash
  estable y descarga fechada; F2-055 tendrá que validar ese archivo antes de
  reemplazar los datos. El formato debe ser portable, inspeccionable y estable
  entre exportaciones de los mismos datos.
- **Decisión:**
  - El archivo es texto UTF-8 con una cabecera de cinco líneas: título,
    `Formato: pianodesdecero.progress v1`, fecha de exportación en ISO 8601,
    versión de la app y `SHA-256: <64 hex>`. Debajo va una línea en blanco, el
    JSON canónico y un salto de línea final.
  - El JSON canónico ordena las claves de todos los objetos, conserva el orden
    de los arrays, elimina claves con `undefined` y no incluye espacios. Las
    fechas ya viajan como cadenas ISO; un `Date` suelto se serializa con
    `toISOString`.
  - El SHA-256 cubre solo el JSON de `data`, no la cabecera. Dos exportaciones
    de los mismos datos producen el mismo hash aunque cambie la fecha. Se usa
    `crypto.subtle.digest` de WebCrypto y se escribe en hexadecimal minúsculas.
  - El nombre sugerido es `pianodesdecero-progreso-YYYY-MM-DD.txt`, con la fecha
    UTC de exportación. La descarga crea un `Blob` de texto y un enlace temporal.
  - La versión de la app se lee de `package.json` (`src/version.ts`) para no
    duplicarla.
- **Alternativas:** hash sobre el archivo completo (la fecha cambiaría el hash en
  cada exportación), JSON con indentación (legible pero menos estable y más
  pesado), hash con una dependencia externa (más peso y otra licencia) y cifrado
  o firma (fuera de alcance: no hay cuentas ni claves).
- **Consecuencias:** el archivo se puede abrir y revisar a mano; el hash detecta
  corrupción y permite comparar exportaciones. La importación puede recalcular
  el hash y rechazar el archivo si no coincide.
- **Limitación:** el hash no autentica el archivo: alguien con acceso al texto
  puede recalcularlo. WebCrypto requiere un contexto seguro (HTTPS o
  `localhost`); en un contexto inseguro la exportación debe fallar con un error
  claro. El formato todavía no está cifrado ni comprimido.

## ADR-018 — Importación validada con reemplazo atómico

- **Contexto:** F2-055 pide importar el archivo de progreso rechazando archivos
  corruptos o con hash inválido, confirmar el reemplazo y dejar intactos los
  datos actuales si algo falla. La app es local-first y el archivo puede venir de
  otra instalación o de una copia de seguridad.
- **Decisión:**
  - `parseProgressFile` lee la cabecera, exige el título, el formato
    `pianodesdecero.progress`, la versión 1 y las líneas de fecha, app y hash.
    Los errores se clasifican con códigos estables: `invalid-format`,
    `unsupported-version`, `invalid-data`, `invalid-hash` y
    `confirmation-required`.
  - El JSON se parsea, se valida con `ProgressDataSchema` y se vuelve a
    canonicalizar; el SHA-256 se calcula sobre esos datos canónicos. Aceptar
    JSON con espacios o claves en otro orden no debilita la comprobación: el
    hash debe coincidir con el contenido normalizado.
  - La importación valida el archivo completo antes de escribir. Sin
    `confirm: true` no se toca la base, aunque el archivo sea válido.
  - `replaceAll` prepara todas las filas validadas y reemplaza las seis tablas
    (`lessons`, `skills`, `reviews`, `settings`, `sessions`, `profile`) dentro de
    una sola transacción de Dexie. Un error de escritura revierte el reemplazo
    completo; un archivo inválido falla antes de borrar nada.
  - La estrategia es reemplazar, no fusionar. Fusionar exigiría reglas por
    dominio (por ejemplo, conservar el repaso más reciente o sumar XP) y queda
    fuera del alcance de esta tarea.
- **Alternativas:** fusionar por id (ambigua y propensa a duplicar XP o
  repasos), escribir tabla por tabla (puede dejar el progreso a medias), confiar
  en el hash de la cabecera sin recalcularlo (un archivo editado a mano pasaría)
  y validar solo al final (podría borrar datos antes de detectar el error).
- **Consecuencias:** la UI puede mostrar un resumen y pedir confirmación usando
  `counts`; el resultado incluye la fecha de reemplazo y el hash validado. El
  mismo archivo se puede importar dos veces sin duplicar filas.
- **Limitación:** el hash detecta corrupción, no autentica el origen; un archivo
  manipulado con el hash recalculado se acepta. No hay fusión ni importación
  selectiva. La confirmación es un booleano de la API: el diálogo real y el
  manejo de errores en la interfaz llegan con la pantalla de ajustes.

## ADR-019 — Copia en carpeta con File System Access API y degradación a descarga

- **Contexto:** ADR-012 dejó como mejora opcional guardar el progreso en una
  carpeta personal. F2-056a lo retoma: el navegador publicado no puede escribir
  en el servidor, pero Chromium de escritorio puede escribir en una carpeta que
  el usuario elige explícitamente. En el resto de navegadores la app debe seguir
  funcionando igual.
- **Decisión:**
  - `src/state/progress-folder.ts` encapsula la File System Access API con tipos
    estructurales mínimos (`ProgressFolderHandle`, `ProgressFolderFileHandle`),
    de modo que el resto de la app y los tests no dependan de tipos externos.
  - La carpeta se pide con `showDirectoryPicker({ id, mode: 'readwrite' })` desde
    un gesto del usuario. Cancelar el diálogo se traduce a un
    `ProgressFolderError` con código `cancelled`; la interfaz no debe descargar
    nada en ese caso.
  - `saveProgressCopy` guarda `pianodesdecero-progreso-YYYY-MM-DD.txt` en la
    carpeta y devuelve `target: 'folder'`. Si el navegador no soporta la API ni
    se inyectó un selector, delega en `downloadProgressFile` y devuelve
    `target: 'download'`. La detección exige `showDirectoryPicker` y un contexto
    seguro.
  - La carga usa el mismo validador que la importación: `loadProgressFromFolder`
    lee el texto y llama a `parseProgressFile`, así que un archivo corrupto, una
    versión futura o un hash manipulado fallan antes de tocar la base.
    `loadLatestProgressCopy` elige la copia más reciente por nombre (la fecha ISO
    ordena alfabéticamente) y falla con `empty-folder` si no hay ninguna.
  - `loadProgressFromFile` acepta un `Blob` de un `<input type="file">` para que
    la carga también funcione fuera de Chromium.
  - La escritura y la lectura envuelven los fallos con `write-failed` y
    `read-failed` para que la interfaz distinga permisos, disco lleno o un
    archivo ausente.
- **Alternativas:** `showOpenFilePicker` para cargar (no reutiliza la carpeta y
  obliga a buscar el archivo cada vez), guardar sin validar (podría importar un
  archivo corrupto), pedir la carpeta al arrancar (el navegador exige un gesto y
  molestaría al usuario) y depender de una librería de sistema de archivos (peso
  y otra licencia para una API ya nativa).
- **Consecuencias:** la función es opcional y no bloquea el cierre de F2; el
  camino de descarga y el de `<input type="file">` siguen disponibles en todos
  los navegadores. Los tests usan manejadores en memoria y no necesitan permisos
  reales.
- **Limitación:** solo funciona en Chromium de escritorio con contexto seguro y
  puede volver a pedir permiso tras recargar. La carpeta elegida no se persiste
  en la base: el usuario debe volver a elegirla. No hay sincronización ni
  escritura en GitHub o en la nube. La UI que conecta estos helpers con botones
  reales llega con la pantalla de ajustes.

## ADR-020 — Restablecer el progreso con doble confirmación y borrado atómico

- **Contexto:** F2-057 pide borrar el progreso con confirmación explícita. El
  progreso vive solo en IndexedDB: un borrado accidental no tiene vuelta atrás
  salvo que el usuario tenga una exportación previa. La API debe impedir que un
  clic o una llamada defectuosa vacíe la base.
- **Decisión:**
  - `resetProgress` exige dos señales independientes: `confirmations >= 2` y una
    palabra escrita por el usuario (`BORRAR` por defecto). La comparación ignora
    mayúsculas y espacios exteriores, pero no acepta otra palabra. La interfaz
    decide cómo obtenerlas; el módulo solo valida.
  - Los fallos se clasifican con `ProgressResetError` y códigos estables:
    `confirmation-required`, `confirmation-mismatch` y `reset-failed`.
  - Antes de borrar se cuentan lecciones, habilidades, repasos, sesiones, logros
    y XP. El resultado incluye `resetAt` y ese resumen para que la UI pueda
    mostrar qué se borró.
  - El borrado llama a `ProgressRepositories.clearAll`, que vacía las seis tablas
    en una sola transacción de Dexie. Si la transacción falla, no queda un
    progreso a medias y los datos originales siguen ahí.
  - Después del reseteo los repositorios devuelven los valores iniciales
    (ajustes por defecto, perfil vacío, racha en cero), así que no hace falta
    escribir filas nuevas.
- **Alternativas:** una sola confirmación booleana (demasiado fácil de disparar),
  borrar tabla por tabla (puede dejar la base a medias), escribir filas iniciales
  en vez de vaciar (deja datos fantasma y complica la exportación) y borrar
  `indexedDB.deleteDatabase` (no permite rollback ni reutilizar la conexión
  abierta).
- **Consecuencias:** el reseteo es imposible de ejecutar por accidente desde la
  API y el resumen permite explicar la pérdida antes de confirmar. La UI de
  ajustes solo tiene que pedir los dos pasos y llamar a `resetProgress`.
- **Limitación:** el borrado es definitivo y no se puede deshacer; la única red
  de seguridad es una exportación previa. El módulo no conserva una copia
  automática ni pide exportar antes de borrar. La interfaz que muestra el doble
  diálogo llega con la pantalla de ajustes.

## ADR-021 — Shell con hash router, rutas en español y páginas honestas

- **Contexto:** F2-058 pide un shell con rutas de curso, lección, repaso,
  progreso y ajustes, navegación con atrás/adelante y enlaces profundos. La app
  se publica en GitHub Pages, que sirve archivos estáticos y no puede reescribir
  rutas del servidor: una URL como `/leccion/x` daría 404 al recargar.
- **Decisión:**
  - El enrutado vive en el hash (`#/curso`, `#/leccion/<id>`, `#/repaso`,
    `#/progreso`, `#/ajustes`). Es la única forma de que recargar y compartir un
    enlace funcionen sin configuración del servidor.
  - `src/router/hash-route.ts` es puro: `parseHash` convierte el hash en una
    unión discriminada de rutas, `routeHash` genera el hash canónico y
    `lessonHash` codifica el id. Acepta `#`, `#/`, `#/curso` y barras
    sobrantes; ignora la query y devuelve `not-found` con la ruta pedida.
  - `useHashRoute` se suscribe a `hashchange` con `useSyncExternalStore`. El
    evento también llega al usar atrás/adelante, así que el historial del
    navegador funciona sin una librería de enrutado.
  - La navegación principal es una lista de enlaces reales (`<a href>`), con
    `aria-current="page"` en la sección activa. Una lección mantiene «Curso»
    activo porque pertenece al curso. El título del documento y el `lang` del
    HTML siguen a la ruta y al idioma elegido.
  - La raíz y `#/curso` muestran la portada del curso. La demo de la Fase 1 se
    conserva en `#/demo` para no perder el trabajo anterior mientras llega el
    mapa del curso.
  - Las páginas de lección, repaso, progreso y ajustes son honestas sobre su
    estado: muestran la ruta resuelta, enlaces de navegación y qué tarea
    completará cada pantalla, en vez de simular datos que todavía no existen.
    Ajustes reutiliza el panel existente y su encabezado pasa a ser el `h1` de
    la página.
  - Una ruta desconocida muestra una página 404 con la ruta pedida y un enlace
    al curso, sin redirecciones silenciosas.
- **Alternativas:** History API con `pushState` (rompe la recarga en Pages),
  React Router (peso y una abstracción que no resuelve el problema del servidor
  estático), rutas en inglés (peor para un producto en español) y una sola
  página con pestañas (no permite enlaces profundos ni atrás/adelante).
- **Consecuencias:** los enlaces profundos son compartibles y sobreviven a la
  recarga; no se agrega ninguna dependencia. Las rutas y los textos quedan
  centralizados y testeados sin navegador real.
- **Limitación:** el hash no lo indexan igual los buscadores y ensucia la URL.
  Las páginas de curso, lección, repaso y progreso son marcadores de posición
  hasta F2-059 a F2-062; el contenido real y la carga de los JSON llegan con
  esas tareas. El router no conserva estado de scroll ni transiciones.

## ADR-022 — Índice compacto del curso y progreso por módulo

- **Contexto:** F2-059 pide un mapa con los nueve módulos y los estados
  bloqueado, disponible y completado, sin depender del color. La app ya tiene
  los 30 JSON completos de lecciones en `content/`, pero importarlos todos en la
  portada cargaría explicaciones, secciones y ejercicios que el mapa no usa. El
  progreso vive en Dexie y solo se puede leer después de abrir la base.
- **Decisión:**
  - `npm run index:content` genera `src/content/course-index.json` con los
    metadatos del mapa (módulo, orden, títulos, resumen, minutos,
    prerrequisitos, habilidades y estado). El archivo se commitea y
    `tests/course-index.test.ts` falla si queda desactualizado respecto de
    `content/`. El script reutiliza la validación de contenido antes de escribir.
  - `src/content/course.ts` valida el JSON con Zod al importarlo y expone
    módulos, lecciones, búsquedas y el grafo mínimo para
    `computeLessonUnlocks`. Un índice corrupto falla al arrancar en vez de
    mostrar un mapa incompleto.
  - `summarizeCourse` es puro: recibe el índice y los desbloqueos, agrupa por
    módulo y calcula el avance global. Un módulo es `completed` si todas sus
    lecciones lo están, `in-progress` si alguna empezó o terminó, `available`
    si al menos una está disponible, `locked` si todas están bloqueadas y
    `empty` si no tiene lecciones. `nextLessonId` prefiere una lección en curso
    y, si no hay, la primera disponible.
  - `ProgressProvider` abre Dexie una sola vez por árbol y expone
    `loading`/`ready`/`error`. `useCourseProgress` combina ese estado con los
    desbloqueos; la portada nunca inventa progreso y ofrece reintentar.
  - Los estados se muestran con texto (`Bloqueado`, `Disponible`, `En curso`,
    `Completado`, `Sin lecciones`) además de la barra `<progress>`, y las
    lecciones bloqueadas no son enlaces. Los módulos sin lecciones se muestran
    como tales en vez de fingir contenido.
- **Alternativas:** importar las 30 lecciones completas en la portada (peso
  innecesario), leer el índice en tiempo de ejecución con `fetch` (otro estado
  de carga y otro archivo que publicar), calcular el progreso en el componente
  (mezcla E/S con presentación y difícil de testear) y usar solo colores para
  los estados (inaccesible).
- **Consecuencias:** el mapa comparte la misma fuente de verdad que el validador
  y los tests de frescura impiden que el JSON quede viejo. La lógica de resumen
  se prueba sin navegador. El bundle inicial sube por Dexie y el índice, pero
  sigue por debajo del presupuesto (158 kB gzip de 300 kB).
- **Limitación:** el contenido actual publica lecciones solo en M0–M2; M3–M8
  aparecen como módulos vacíos y el mapa lo dice. El umbral de maestría sigue
  siendo el 0,8 por defecto: todavía no se configura desde la interfaz. Las
  lecciones completadas enlazan al reproductor, que es un marcador de posición
  hasta F2-060.

## ADR-023 — Reproductor de lección con carga diferida y audio compartido

- **Contexto:** F2-060 pide abrir una lección con sus secciones, ejemplos
  sonoros, pentagrama, navegación y marca de completada. El índice del curso
  solo guarda metadatos; los 30 JSON completos incluyen texto, partituras,
  ejercicios y tareas. Cargarlos todos en la portada castigaría el arranque, y
  el progreso ya se persiste en Dexie con `startLesson`/`completeLesson`.
- **Decisión:**
  - `src/content/lessons.ts` carga cada lección bajo demanda con
    `import.meta.glob('../../content/lessons/*.json')`. El id `lesson.mX-YY`
    corresponde a `content/lessons/mX-YY.json`; cada archivo se valida con
    `LessonSchema.parse` antes de usarse. `tests/lesson-content.test.ts`
    comprueba que las 30 lecciones del índice tienen archivo y validan.
  - `src/content/score.ts` convierte el modelo de partitura a las piezas que ya
    existen: `scoreToMeasures` para `Staff`, `scoreToTimeline` para el motor de
    audio y `rhythmicValueBeats` para duraciones con puntillos y tresillos. Son
    funciones puras, ordenan por compás, pulso e id, y comparten la misma fuente
    con la UI y los tests.
  - `LessonPlayer` renderiza las secciones según su tipo. Texto, llamados de
    atención, ejemplos de teclado, partituras y audio usan un único
    `AudioEngine` obtenido con `useAudioEngine`, así que reproducir un ejemplo
    detiene al anterior y no quedan notas trabadas. Las secciones de ejercicio
    avisan que todavía no se pueden resolver desde acá.
  - La tarea de teclado muestra instrucciones, digitación, checklist y, si
    existe, su partitura; el teclado responde al puntero y al teclado de la
    computadora. La versión interactiva con metrónomo y checklist marcable
    llega en F2-066.
  - `LessonPage` resuelve el acceso con el resumen de `useCourseProgress`. Una
    lección desconocida, bloqueada o sin archivo muestra un estado honesto y una
    salida al curso, sin inventar contenido. Una lección disponible se registra
    como `in-progress` una sola vez al abrirla; la marca de completada espera a
    que termine esa escritura para no pisar el estado `completed`. La navegación
    anterior/siguiente respeta el orden del índice y no enlaza una siguiente
    bloqueada.
  - `useCourseProgress` conserva el resumen anterior mientras recarga, para que
    marcar una lección no haga parpadear toda la pantalla. El primer cálculo sí
    muestra `loading`.
- **Alternativas:** importar las 30 lecciones de forma eager (bundle inicial
  enorme), usar `fetch` en tiempo de ejecución (otro estado de red y otro
  artefacto que publicar), crear un motor de audio por sección (notas trabadas y
  más recursos) o marcar la lección como completada sin persistir (progreso
  falso).
- **Consecuencias:** Vite genera un chunk diferido por lección (alrededor de
  1–2 kB gzip cada uno) y el bundle inicial queda en 162,42 kB gzip, todavía
  por debajo del presupuesto de 300 kB. La carga de contenido y la conversión de
  partituras se prueban sin navegador; el reproductor y el flujo de completado
  tienen tests de página con bases IndexedDB aisladas. La accesibilidad se
  verifica con axe sobre una lección real.
- **Limitación:** el cuerpo de las lecciones sigue en español hasta F2-075; la
  interfaz y los títulos del índice sí cambian de idioma. `Staff` dibuja la
  figura base: los puntillos y tresillos afectan la duración del audio pero
  todavía no se dibujan. Los ejercicios se listan pero no se resuelven hasta el
  motor de ejercicios, y la tarea de teclado interactiva llega en F2-066. El
  umbral de maestría sigue fijo en 0,8.

## ADR-024 — Repaso de hoy desde el progreso real

- **Contexto:** F2-061 pide la pantalla «Repaso de hoy» con cola intercalada,
  progreso, previsión y botón de inicio, incluso cuando no hay ítems. Ya existen
  `buildDailyQueue` (F2-043), `forecastLoad` (F2-044), las tarjetas FSRS en la
  tabla `skills` y el panel de previsión (F2-044). Faltaba unir esas piezas con
  el contenido y el progreso del curso sin inventar repasos.
- **Decisión:**
  - `src/content/skills.ts` importa y valida `content/skills.json` con
    `SkillItemSchema`. Las etiquetas y los tipos de habilidad salen del
    contenido; el índice del curso no necesita duplicarlos.
  - `reviewableSkills` incluye las habilidades de lecciones ya empezadas o
    completadas y, además, cualquier habilidad con tarjeta propia aunque su
    lección no figure en el progreso (por ejemplo, tras importar un respaldo).
    Así el repaso no propone habilidades de módulos que la persona todavía no
    empezó.
  - `buildReviewDay` es puro: recibe habilidades, progreso y historial, y
    devuelve la cola de `buildDailyQueue`, la previsión de 7 días, las tarjetas
    y las respuestas registradas hoy. La semilla de mezcla se deriva del día UTC
    (`dailyReviewSeed`), de modo que la cola cambia por día sin ser aleatoria.
  - `useReviewDay` espera a que `useCourseProgress` calcule el resumen, lee
    `skills` y `reviews` de Dexie y conserva el estado anterior mientras
    recarga. La pantalla trata carga, error con reintento y estado vacío.
  - `ReviewPage` muestra los contadores, la cola con etiquetas de estado
    (`Vencido`/`Nuevo`), la previsión reutilizando `LoadForecastPanel` y un
    botón de inicio. El recorrido muestra un ítem por vez, su progreso
    `<progress>` y enlaces a las lecciones donde se practica la habilidad.
  - El recorrido **no guarda respuestas ni marca ítems como repasados**. La
    autoevaluación de cuatro botones y el registro FSRS son F2-067, y la
    pantalla lo dice para no simular progreso.
- **Alternativas:** incluir todas las habilidades del contenido desde el primer
  día (propondría material de M3–M8 antes de tiempo), leer las tarjetas en cada
  componente (E/S duplicada y estados inconsistentes), marcar como repasado al
  avanzar (progreso falso en FSRS) o duplicar el panel de previsión dentro del
  repaso (dos implementaciones que se desincronizan).
- **Consecuencias:** la cola y la previsión comparten las mismas funciones puras
  que los tests de F2-043/F2-044, y la pantalla se prueba con IndexedDB aislada,
  incluido el caso sin ítems. El bundle inicial sube a 166,51 kB gzip, todavía
  por debajo del presupuesto de 300 kB. `content/skills.json` se valida al
  importarse, igual que el índice del curso.
- **Limitación:** el botón inicia un recorrido de lectura, no una sesión FSRS;
  la calificación y el guardado llegan en F2-067. Las respuestas registradas hoy
  cuentan todo el historial del día UTC, no solo los ítems de la cola actual.
  La pantalla aún no permite filtrar por tipo de habilidad ni reprogramar
  manualmente una tarjeta.

## ADR-025 — Estadísticas desde el progreso real

- **Contexto:** F2-062 pide una pantalla con retención, precisión, racha, XP y
  tiempo usando datos reales y estados vacíos honestos. Ya existen
  `computeReviewStats` (F2-046), `levelProgress` (F2-052), el perfil con racha,
  las sesiones de práctica y los segundos registrados por lección. Faltaba
  reunirlos sin duplicar cálculos ni mostrar métricas inventadas.
- **Decisión:**
  - `src/state/progress-dashboard.ts` es puro: recibe historial, perfil,
    sesiones y lecciones, y devuelve un `ProgressDashboard` con las estadísticas
    de repaso, el desglose de nivel, la racha, la retención agregada, los totales
    de respuestas y el tiempo. No lee la base ni depende del reloj.
  - La retención agregada suma los períodos de `computeReviewStats` y divide
    recordados entre programados. Los pasos de aprendizaje siguen excluidos,
    igual que en F2-046. La precisión conserva la agrupación por tipo de
    habilidad y la resolución `kindForItem`.
  - `practiceSessionSeconds` prioriza la suma de bloques; si una sesión no
    tiene bloques usa el intervalo inicio–fin cuando es válido, y si no cuenta
    0. El tiempo total suma sesiones y `secondsSpent` de las lecciones, sin
    mezclar minutos redondeados.
  - `useProgressDashboard` espera a `ProgressProvider`, lee en paralelo
    `reviews`, `profile`, `sessions` y `lessons`, y conserva el panel anterior
    mientras recarga. Expone carga, error con reintento y recarga.
  - `ProgressPage` muestra cuatro tarjetas de resumen (XP/nivel, racha, tiempo y
    respuestas), la retención con sus últimos siete períodos y la precisión por
    tipo. Cada bloque tiene su estado vacío y no se muestran porcentajes cuando
    no hay datos.
  - Las etiquetas usan las claves `progress.*` y `progress.kind.*` en español e
    inglés, de modo que la pantalla mantiene el soporte bilingüe existente.
- **Alternativas:** calcular las métricas dentro del componente (tests de UI
  frágiles y cálculos duplicados), usar solo `stats.totals` (mezcla pasos de
  aprendizaje con repasos programados), mostrar 0 % como si fuera una medición
  real (confunde ausencia de datos con mal rendimiento) o leer cada tabla en su
  propio hook (cuatro estados de carga inconsistentes).
- **Consecuencias:** el panel se prueba sin navegador con datos agregados,
  sesiones con y sin bloques, perfil, tipos de habilidad y entradas vacías. La
  página se prueba con IndexedDB aislada, incluido el error de apertura con
  reintento, y axe cubre la pantalla con datos. El bundle inicial queda en
  169,11 kB gzip, todavía por debajo del presupuesto de 300 kB.
- **Limitación:** la retención usa el historial completo y no se puede filtrar
  por rango de fechas ni por módulo. Las estadísticas de precisión dependen de
  que el ítem exista en `content/skills.json`; los ids desconocidos se agrupan
  como «Sin tipo». La racha se lee del perfil y no se recalcula desde las
  sesiones, y el tiempo de práctica depende de que las sesiones se registren
  (el motor de ejercicios y la práctica guiada llegan en tareas posteriores).

## ADR-026 — Ajustes completos unificados con el progreso

- **Contexto:** F2-063 pide notación, idioma, tema, retención, ítems nuevos por
  día, volumen, tempo, persistencia y restablecimiento. La interfaz ya tenía un
  `SettingsProvider` con `localStorage`, mientras que la exportación usa la
  tabla `settings` de Dexie con nombres y unidades distintos (`audioVolume`
  lineal, `locale`, `tempoBpm`). Importar o restablecer el progreso tiene que
  mover ambos mundos sin perder la configuración local.
- **Decisión:**
  - `src/state/settings.tsx` incorpora `theme` (`system`/`light`/`dark`) y
    conserva `midiEnabled` aunque la app todavía no lo use, para no perderlo al
    importar. El volumen de la UI queda en decibelios entre −40 y 0.
  - `src/state/settings-record.ts` es un puente puro: `dbToGain` y `gainToDb`
    convierten entre decibelios y ganancia lineal; `settingsFromRecord` y
    `settingsToRecord` traducen `language` ↔ `locale`, `tempo` ↔ `tempoBpm` y
    el resto de campos compartidos. El mapa de teclas sigue siendo una
    preferencia local de `localStorage`.
  - `SettingsRepository.read()` devuelve `undefined` cuando no hay fila, a
    diferencia de `get()`, que devuelve los valores por defecto. Así una
    instalación nueva puede migrar sus ajustes locales sin que la hidratación
    los pise con defaults.
  - `SettingsPersistence` se monta dentro de `ProgressProvider`. Cuando la base
    está lista lee la fila: si existe, reemplaza los ajustes en memoria; si no,
    guarda los locales. Desde entonces cada cambio se escribe en `localStorage`
    y en Dexie. Importar o restablecer entrega repositorios nuevos y fuerza una
    nueva hidratación.
  - El tema se aplica con `data-theme` en `<html>`; `system` quita el atributo y
    deja actuar a `prefers-color-scheme`. Un script inline en `index.html` lee
    el tema guardado antes de pintar para evitar el destello claro, y el CSS
    define variables para claro, oscuro y sistema.
  - `DataManagementPanel` conecta los módulos ya probados: exportación
    descargable o guardada en carpeta, importación validada con resumen y
    confirmación explícita, y reseteo con la palabra `BORRAR` más una casilla.
    El reseteo guarda después los ajustes por defecto para que la hidratación no
    reescriba los antiguos.
- **Alternativas:** persistir solo en `localStorage` (la exportación perdería
  los ajustes y el reseteo no los borraría), guardar el mapa de teclas en Dexie
  (mezcla preferencia local con datos exportables), mantener dos modelos sin
  puente (duplicación y unidades divergentes) o aplicar el tema solo en React
  (destello claro en la primera pintura).
- **Consecuencias:** los ajustes sobreviven a recargas, exportaciones e
  importaciones; el reseteo deja la app en valores por defecto y el tema no
  parpadea al cargar. Los tests cubren conversiones, ida y vuelta, hidratación
  bilingüe, persistencia en ambas capas, exportación, importación válida e
  inválida, reseteo con doble confirmación y axe en la pantalla de ajustes. El
  bundle inicial queda en 174,62 kB gzip, por debajo del presupuesto de 300 kB.
- **Limitación:** el mapa de teclas no viaja en el archivo de progreso y el MIDI
  se conserva pero no se expone porque aún no hay entrada MIDI. Los ajustes son
  globales, no por perfil. Guardar en carpeta depende de la API del navegador y
  el botón se oculta si no está disponible. La importación reemplaza todo el
  progreso, incluidos los ajustes, sin fusión selectiva.

## ADR-027 — Verificación automática del tema y su contraste

- **Contexto:** F2-064 pide tema sistema/claro/oscuro, persistencia, ausencia de
  destello y contraste AA. La implementación llegó con F2-063, pero faltaba una
  prueba que cubriera la paleta real y el arranque sin destello. jsdom no
  resuelve `prefers-color-scheme` ni aplica variables CSS en cascada, así que
  axe por sí solo no demuestra el contraste del tema oscuro.
- **Decisión:**
  - El tema sigue usando `data-theme` en `<html>`: `system` quita el atributo y
    deja actuar a `prefers-color-scheme`; `light` y `dark` fijan la paleta con
    variables CSS. El script inline de `index.html` lee
    `pdc.settings.v1` antes de pintar y aplica el tema guardado.
  - `tests/theme.test.ts` lee `src/styles.css`, extrae las variables de la
    paleta clara, la oscura explícita y la oscura del sistema, y calcula la
    razón de contraste WCAG sobre ocho pares texto/fondo (texto, texto atenuado,
    acento y foco sobre fondo y panel). Exige 4,5:1 o más en todos.
  - El mismo test comprueba que las dos definiciones oscuras son idénticas,
    que el script inline está en el `<head>` antes de pintar y que el tema por
    defecto es `system` y rechaza valores desconocidos.
- **Alternativas:** confiar solo en axe (no evalúa la paleta oscura sin emular
  medios), duplicar la paleta en TypeScript (se desincroniza del CSS real),
  dejar la comprobación como revisión visual manual (no protege regresiones) o
  usar un navegador real en la suite unitaria (más lento y frágil para este
  objetivo).
- **Consecuencias:** cualquier cambio de color que baje el contraste AA falla
  en la suite; el script sin destello y los tres estados del tema quedan
  cubiertos. El bundle no cambia porque la tarea solo agrega pruebas. Suite:
  97 archivos / 716 tests en verde; el bundle inicial sigue en 174,62 kB gzip.
- **Limitación:** la prueba cubre los pares declarados de la paleta, no cada
  componente, estado de foco o color calculado con `color-mix`. El teclado de
  piano y el pentagrama tienen colores propios que axe revisa en el tema claro;
  la emulación real de `prefers-color-scheme` en el navegador se verificó a
  mano al publicar.

## ADR-028 — Paridad de diccionarios y auditoría de textos de UI

- **Contexto:** F2-065 pide i18n base ES/EN, español por defecto, inglés sin
  claves faltantes y un test de paridad. La app ya tenía un diccionario en
  `src/state/settings.tsx`, el selector de idioma y el selector global Do/C, pero
  ambos idiomas se declaraban como `Record<string, string>`: una clave nueva en
  español podía faltar en inglés sin que TypeScript avisara. Además quedaban
  textos visibles fuera del diccionario en el pie de la app y en el pentagrama.
- **Decisión:**
  - El diccionario español se declara como un objeto literal inferido y el
    inglés como `Record<keyof typeof ES_DICTIONARY, string>`. Así una clave
    faltante o sobrante en inglés falla en `tsc`, antes de ejecutar la suite.
  - El pie de la aplicación y todos los textos del pentagrama (título, notas,
    claves, error y mensaje sin notas) pasan al diccionario con claves
    `app.footer` y `staff.*`. `Staff` usa `t` en lugar de condiciones
    `language === 'es'`.
  - `tests/i18n.test.ts` comprueba que ambos diccionarios tengan las mismas
    claves, valores no vacíos y los mismos marcadores `{...}`; recorre `src/`
    para verificar que toda clave literal `t('...')` exista; cubre las familias
    dinámicas de estados de módulo/lección, cola de repaso y estilos de acorde;
    y fija español por defecto más el rechazo de idiomas desconocidos.
  - El selector Do/C sigue siendo global: `settings.notation` alimenta teclado,
    pentagrama, demo y ejemplos de lección. El selector ES/EN sigue en ajustes y
    actualiza `document.documentElement.lang`.
- **Alternativas:** mantener `Record<string, string>` y confiar solo en un test
  de paridad (el error llega más tarde), generar los tipos desde los JSON de
  contenido (el contenido completo en inglés es F2-075), duplicar literales en
  cada componente (imposible de auditar) o traducir también los cuerpos de las
  lecciones ahora (fuera del alcance de F2-065).
- **Consecuencias:** las claves faltantes se detectan en compilación y en la
  suite; el pie y el pentagrama responden al idioma elegido. Los textos de
  contenido (títulos, objetivos, secciones y tareas) siguen saliendo de
  `titleEs`/`bodyEs` hasta F2-075, que agrega los campos en inglés. Suite: 98
  archivos / 721 tests en verde; bundle inicial 174,75 kB gzip.
- **Limitación:** la auditoría solo encuentra claves literales; las claves
  dinámicas se cubren con listas explícitas. Los nombres de los idiomas se
  muestran en su propio idioma (“Español”, “English”). El mensaje de consola del
  `ErrorBoundary` no es texto de interfaz y sigue en español. El contenido de
  las lecciones y sus tareas permanece en español hasta F2-075.

## ADR-029 — Tarea de teclado con interacción local

- **Contexto:** F2-066 pide un componente real con diagrama, digitación,
  metrónomo, demo y lista de control, responsive y accesible. El reproductor de
  lección ya mostraba el teclado resaltado, la partitura de demo y una lista
  estática, pero no permitía practicar con metrónomo ni marcar los puntos de
  control. El contenido define la tarea con `keys`, `tempoBpm`, `checklistEs`,
  `fingeringEs` y un `demoScore` opcional.
- **Decisión:**
  - `src/components/KeyboardTask.tsx` reúne la tarea completa. Usa el mismo
    `AudioEngine` del reproductor para que demo, notas y metrónomo compartan
    audio y no se solapen dos motores. El metrónomo toma `tempoBpm` y el
    numerador del compás de la partitura; el estado del pulso se anuncia con
    `role="status"` y `aria-live`.
  - La demo reproduce `scoreToTimeline(demoScore, tempoBpm)` y muestra la
    partitura con `Staff`; si la tarea no trae `demoScore` (varias lecciones de
    M2), el botón queda deshabilitado y se muestra un aviso honesto en vez de
    inventar una partitura.
  - La digitación se muestra como texto (`fingeringEs`) porque el esquema no
    tiene una asignación estructurada de dedos por nota. El diagrama usa las
    teclas reales de la tarea y resalta sus MIDI.
  - La lista de control usa un `<fieldset>` con `<legend>`, casillas nativas y
    un contador `aria-live`. El estado es local a la visita: marcar puntos no
    registra respuestas ni completa la lección. La autoevaluación FSRS llega en
    F2-067.
  - `src/keyboard/range.ts` extrae el cálculo de octavas visibles que estaba
    dentro de `LessonPlayer`, de modo que secciones y tarea comparten encuadre
    y se puede probar por separado.
- **Alternativas:** crear un segundo `useAudioEngine` dentro de la tarea
  (duplica contexto de audio y puede solapar reproducciones), guardar la
  checklist en Dexie ahora (mezcla práctica libre con evaluación FSRS), derivar
  los dedos automáticamente de las notas (el contenido a veces describe una
  digitación que no coincide con una escala o acorde estándar) o mantener el
  aviso de F2-066 en lugar de la interacción (no cumple la aceptación).
- **Consecuencias:** la tarea se puede practicar con metrónomo, escuchar la demo
  y marcar el checklist; el layout envuelve acciones en pantallas angostas y el
  teclado conserva su desplazamiento horizontal. Tests de render, checklist,
  metrónomo con tempo/compás, demo con MIDI real, ausencia de partitura, error
  de audio y rango de octavas. Suite: 100 archivos / 730 tests en verde; bundle
  inicial 175,39 kB gzip.
- **Limitación:** la checklist no se persiste ni se envía a FSRS; el metrónomo
  no cambia el tempo global ni se guarda. La digitación es texto, no badges por
  tecla, porque falta estructura en el contenido. Diez tareas de M2 no tienen
  `demoScore` y muestran el aviso correspondiente. El contenido sigue en español
  hasta F2-075.

## ADR-030 — Autoevaluación de cuatro botones y registro atómico del repaso

- **Contexto:** F2-067 pide cuatro calificaciones, guardar la duración y el
  resultado, integrarse con FSRS y cubrirlo con tests. La pantalla «Repaso de
  hoy» ya armaba la cola, pero el recorrido solo enlazaba a las lecciones y no
  guardaba ninguna respuesta. El wrapper de FSRS y los campos `durationMs`,
  `format` y `usedHint` del historial ya existían.
- **Decisión:**
  - `src/pages/ReviewPage.tsx` reemplaza el botón «Siguiente» por cuatro botones
    de autoevaluación —Otra vez, Difícil, Bien y Fácil— dentro de un
    `<fieldset>` con `<legend>`. La duración se mide con `performance.now()`
    desde que aparece el ítem hasta que se califica, con `Date.now()` como
    respaldo cuando el navegador no expone el reloj monotónico.
  - `src/state/practice-log.ts` concentra la lógica. `reviewFormatForKind`
    traduce el tipo de habilidad a `play`, `hear`, `see` o `spell`;
    `applyReviewToSkill` actualiza tarjeta, maestría y contadores con pasos de
    −0,10 / +0,05 / +0,10 / +0,15 limitados a 0–1; `recordReview` crea la
    tarjeta si el ítem todavía no tenía una, la califica con `gradeFsrsItem` y
    guarda el formato y la duración en el registro.
  - `ProgressRepositories.saveReviewResult` escribe la tarjeta de la habilidad y
    el registro de revisión en una sola transacción Dexie. Si falla una de las
    dos escrituras, no queda una tarjeta avanzada sin historial ni un historial
    sin tarjeta.
  - La pantalla deshabilita los botones mientras guarda, evita dobles envíos con
    una referencia, muestra el error honesto y refresca la cola al terminar o
    salir. El scheduler de FSRS se importa dinámicamente al pulsar el primer
    botón para no cargarlo en el bundle inicial.
  - El registro alimenta la retención, la precisión por tipo, el contador de
    respuestas del día y la previsión de carga. Las cuatro etiquetas viven en
    ambos diccionarios y el grupo de botones se revisa con axe.
- **Alternativas:** guardar solo la calificación en `localStorage` (fuera del
  historial exportable), crear una tarjeta nueva en cada visita (perdería el
  estado FSRS), mantener un botón «Siguiente» sin calificar (no cumple la
  aceptación), hacer dos escrituras sueltas para tarjeta e historial (puede
  dejar datos inconsistentes) o cargar FSRS en el bundle inicial (suma ~12 kB
  gzip a todas las rutas).
- **Consecuencias:** el repaso ya registra respuestas reales con duración y
  resultado, avanza el plan FSRS y actualiza la maestría de la habilidad. La
  tarjeta y el historial son atómicos. La sesión guarda el total con el que
  empezó y lo conserva aunque la cola se refresque, para que el resumen final
  no confunda «cola de ahora» con «lo que se calificó». Suite: 101 archivos /
  738 tests en verde; typecheck, `validate:content`, build y presupuesto verdes
  (176,35 kB gzip inicial, 43 chunks diferidos).
- **Limitación:** el XP y la racha todavía no se actualizan desde el repaso; el
  plan de práctica con temporizador de F2-068 conectará esas recompensas. No hay
  un botón para saltar un ítem: para no calificarlo hay que salir del recorrido.
  La duración mide el tiempo en pantalla, no el tiempo real de práctica en el
  teclado. Un `again` baja la maestría y puede volver a bloquear una lección
  posterior que todavía no se haya empezado.

## ADR-031 — Práctica diaria con bloques de 15/30/45 y temporizador

- **Contexto:** F2-068 pide un plan diario con bloques de calentamiento,
  técnica, teoría, repertorio y repaso, un temporizador y registro de la
  sesión. El esquema `PracticeSession` ya existía con `plannedMinutes`
  limitado a 15/30/45 y los cinco tipos de bloque; el repositorio de sesiones
  guardaba filas sueltas y XP/racha eran funciones puras sin uso en la UI.
- **Decisión:**
  - `src/state/practice-plan.ts` fija el reparto de cada duración. Los cinco
    bloques suman exactamente 15, 30 o 45 minutos y siempre aparecen en el
    mismo orden; una duración fuera de la lista falla en vez de inventar un
    plan aproximado.
  - `src/state/practice-timer.ts` es una máquina de estados pura con estados
    `idle`, `running`, `paused` y `done`. Cada bloque acumula segundos reales,
    el temporizador avanza de a un segundo y salta de bloque al agotarlo.
    Saltar un bloque no regala tiempo y cortar la sesión conserva solo lo
    practicado, de modo que el registro no infla minutos.
  - `src/pages/PracticePage.tsx` vive en `#/practica` y entra en la navegación
    principal. Ofrece elegir la duración con radios, ver el reparto, arrancar
    el temporizador, pausar, reanudar, saltar y terminar. La pantalla usa
    `setInterval` mientras la sesión está en marcha y guarda al llegar a
    `done`; el temporizador no se persiste entre recargas.
  - `ProgressRepositories.recordPracticeSession` escribe la sesión y actualiza
    el perfil en una sola transacción. El XP sale de los minutos completos
    (`applyActivity` con 2 XP por minuto) y la racha se registra con el día UTC
    de `endedAt`. Guardar dos veces la misma sesión no duplica la recompensa.
    Una sesión de menos de un minuto se guarda como evidencia, pero no suma XP
    ni racha.
  - Las etiquetas de bloques, estados y controles viven en los dos
    diccionarios. La pantalla se audita con axe en el plan y con el
    temporizador en marcha.
- **Alternativas:** derivar los bloques del reloj de pared (perdería pausas y
  contaría tiempo sin practicar), persistir un temporizador en curso para
  sobrevivir recargas (más estado y casos límite sin pedido explícito), dar XP
  por bloque empezado (premiaría saltar), guardar la sesión y actualizar el
  perfil en escrituras separadas (podría dejar sesiones sin recompensa) o
  dejar los planes en ajustes (los tres repartos fijos alcanzan para F2).
- **Consecuencias:** la práctica diaria ya tiene plan, temporizador y registro
  real. XP y racha se actualizan desde la sesión y el panel de progreso suma
  esos minutos. Suite: 105 archivos / 763 tests en verde; typecheck,
  `validate:content`, build y presupuesto verdes (179,70 kB gzip inicial, 43
  chunks diferidos).
- **Limitación:** el temporizador solo corre con la pestaña abierta y se pierde
  al recargar; los segundos se cuentan de a uno y no se recupera el tiempo en
  segundo plano. Los logros todavía no se evalúan al guardar una sesión. El
  plan no enlaza cada bloque con una lección o ejercicio concretos; F5-041
  amplía repertorio y técnica. La pantalla no impide elegir una duración y
  cortar a los pocos segundos: eso queda registrado como sesión corta.

## ADR-032 — Reproductor de ejercicios con respuesta canónica y registro FSRS

- **Contexto:** F2-072a detectó que faltaba la pieza que conecta los generadores,
  el contenido escrito a mano, el feedback «Recordá» y el progreso. Las
  lecciones listaban ejercicios pero no había ninguna pantalla que los
  mostrara, corrigiera ni registrara. El contenido tampoco guarda siempre un
  campo `answer`: muchas respuestas se deducen de los campos estructurados
  (nota objetivo, armadura, patrón rítmico, grados, intervalo).
- **Decisión:**
  - `src/exercises/answer.ts` centraliza la resolución de la respuesta correcta
    para los 18 tipos de ejercicio. Deduce candidatos desde los campos
    estructurados, los cruza con las opciones del contenido (comparación sin
    tildes, mayúsculas ni símbolos) y conserva una lista de respuestas aceptadas.
    Los ejercicios de práctica sin respuesta única (`tempo-stability`) se marcan
    como `practice` y no se finge corregirlos.
  - `src/content/exercises.ts` carga cada ejercicio bajo demanda con
    `import.meta.glob` y prueba rutas candidatas (`ex.m2-07.a.json`,
    `m2-07.a.json` y archivos compartidos). Valida el JSON con
    `ExerciseSchema` y exige que el id coincida, de modo que un archivo mal
    nombrado falla con un mensaje claro.
  - `src/components/ExercisePlayer.tsx` muestra un ejercicio por vez, con
    opciones o entrada escrita, botones de escucha para los tipos de audio y un
    contador de progreso. Al corregir muestra acierto o error, la respuesta
    correcta, la explicación del contenido y —si falla— el «Recordá» con regla
    y ejemplo. Permite reintentar, avanzar y volver a la lección.
  - Cada corrección se registra con `src/state/exercise-attempt.ts`: el tipo de
    ejercicio se traduce a un tipo de habilidad, la calificación automática sale
    de acierto y duración, y `recordReview` actualiza tarjeta FSRS, maestría y
    contadores en la misma transacción. El registro usa la misma cola, el mismo
    historial y las mismas estadísticas que la pantalla de repaso.
  - `LessonPlayer` monta el reproductor dentro de la sección `exercise` (o en un
    bloque propio si la lección no tiene esa sección) y comparte el `AudioEngine`
    del resto de la lección.
  - FSRS y el registro de repasos se importan dinámicamente al corregir. Si se
    importaran de forma estática, `LessonPage` —que está en el bundle
    inicial— arrastraría el motor FSRS y rompería el code splitting de F2-067.
- **Alternativas:** guardar `answer` en todos los JSON (duplica la fuente de
  verdad y se desincroniza de los campos estructurados), corregir con una regla
  distinta por tipo dentro del componente (tests frágiles y UI acoplada a la
  teoría), no registrar el intento (el E2E de F2-072 no podría comprobar la
  persistencia) o registrar solo aciertos (la cola FSRS perdería los fallos, que
  son los que más importan).
- **Consecuencias:** los tests de respuesta canónica recorren todos los
  ejercicios reales y detectaron errores de contenido que estaban ocultos: cinco
  escalas mayores terminaban en la nota equivocada, la pentatónica menor, el
  blues y los tonos enteros tenían ortografías incorrectas, varias armaduras
  tenían tonalidad y explicación cruzadas y dos explicaciones de menores decían
  «relativa» donde correspondía «paralela». Se corrigieron 20 ejercicios y sus
  tests. Suite: 110 archivos / 788 tests en verde; bundle inicial 191,20 kB gzip
  con 194 chunks diferidos.
- **Limitación:** la tarjeta de ejercicio no dibuja el pentagrama ni permite
  responder tocando el teclado; los enunciados de pentagrama se resuelven por su
  texto. La comparación de escalas acepta la ortografía canónica y la del
  contenido, pero no cualquier enarmonía equivalente. El intento se guarda al
  corregir, no al ver el enunciado, y no hay XP directo por ejercicio: la
  recompensa llega por el repaso FSRS. El feedback pedagógico sigue en español
  hasta F2-075.

## ADR-033 — E2E con Playwright sobre el artefacto compilado

- **Contexto:** F2-072 pide un recorrido real lección→ejercicio→repaso que
  compruebe el «Recordá» y la persistencia tras recargar. Los tests de jsdom ya
  cubren componentes y páginas, pero no demuestran que el progreso sobreviva a
  una recarga completa ni que el bundle publicado funcione en un navegador real.
- **Decisión:**
  - Se usa `@playwright/test` con un único proyecto Chromium y un solo worker.
    Cada test recibe un contexto aislado con IndexedDB limpia.
  - `playwright.config.ts` ejecuta `npm run build` y sirve `dist/` con
    `vite preview` en `127.0.0.1:4173`. Así el E2E valida el artefacto de
    producción, no el servidor de desarrollo ni sus transformaciones.
  - El recorrido de `e2e/lesson-exercise-review.spec.ts` abre M0-01, falla el
    primer ejercicio, verifica el «Recordá» y la respuesta correcta, entra a
    «Repaso de hoy», califica la habilidad nueva y, tras recargar, comprueba en
    «Progreso» que quedaron las dos respuestas.
  - El servidor de prueba se reutiliza en local (`reuseExistingServer`) pero no
    en CI; los artefactos de Playwright quedan ignorados por git.
- **Alternativas:** confiar solo en Testing Library (no simula recarga ni
  IndexedDB real), usar Cypress (otra pila y más peso para el mismo objetivo),
  apuntar al servidor de desarrollo (no valida el build ni el code splitting) o
  activar E2E en el workflow de Pages ahora (suma la descarga de Chromium y
  alarga cada despliegue sin una decisión de F6).
- **Consecuencias:** `npm run test:e2e` es la puerta local para regresiones del
  recorrido completo. El test depende de la estructura de M0-01 (dos
  habilidades, ejercicios de `keyboard-groups`) y de los textos en español;
  cambios de contenido o de idioma pueden exigir ajustarlo. El Chromium se
  instala aparte con `npx playwright install chromium` y no se versiona.
- **Limitación:** el E2E todavía no corre en GitHub Actions ni bloquea el
  despliegue; la decisión de agregarlo queda para el cierre de F6. No cubre
  audio real, MIDI ni navegación táctil, y el recorrido no verifica el estado
  visual del teclado o del pentagrama.

## ADR-034 — Motor de sesiones auditivas puro y determinista

- **Contexto:** F3-019 necesita una sesión de 10 ítems que ajuste la dificultad
  según los aciertos y registre cada respuesta. Las tareas siguientes (dictado
  de intervalos, acordes, escalas y progresiones) van a reutilizar ese motor, y
  los tests deben poder reproducir una sesión sin depender del reloj ni de
  `Math.random`.
- **Decisión:**
  - El motor vive en `src/exercises/ear-session.ts` y es puro: recibe la lista
    de ítems y opciones, y cada respuesta devuelve un estado nuevo sin mutar el
    anterior. No toca React, audio ni IndexedDB.
  - Un ítem solo necesita `id`, `difficulty` (1-5) y, opcionalmente, `kind`.
    La sesión elige el candidato sin usar más cercano al nivel actual y usa una
    semilla combinada con la posición para desempatar. La misma semilla, la
    misma lista y las mismas respuestas producen la misma secuencia.
  - La dificultad sube tras `promoteAfter` aciertos consecutivos y baja tras
    `demoteAfter` errores consecutivos, con topes configurables. Cada respuesta
    guarda el nivel con el que se respondió, no el nivel nuevo.
  - `earSessionSummary` expone respondidos, aciertos, errores, precisión y nivel
    final para que la UI y FSRS puedan consumirlos más adelante.
- **Alternativas:** usar `Math.random` (no reproducible en tests), guardar el
  estado dentro de un componente React (mezcla motor y presentación) o generar
  los ítems dentro del motor (acopla el dictado a cada tipo de contenido).
- **Consecuencias:** F3-020 a F3-025 pueden construir sus propios ítems y
  reutilizar la sesión sin duplicar la lógica adaptativa. La selección es
  determinista solo si se respeta la misma lista y secuencia de respuestas; un
  cambio en el orden de los ítems cambia la sesión, lo cual es deseable para
  tests pero exige pasar listas estables desde el contenido.
- **Limitación:** el motor no intercala `kind` ni evita repeticiones de categoría
  consecutivas; eso queda para las tareas de dictado que tengan varias
  categorías. Tampoco persiste la sesión ni crea tarjetas FSRS: F3-025 se
  encarga de ese registro.

## ADR-035 — Dictado de intervalos dentro de una melodía breve

- **Contexto:** F3-020 pide un dictado de intervalos en contexto, con melodía
  breve, repetición, respuesta y feedback con regla. Los ejercicios `ear-interval`
  de M3-05 solo describen el par de notas y la dirección; hasta ahora el
  reproductor no ofrecía escucharlos. Un intervalo aislado se reconoce por su
  distancia, pero en música aparece dentro de una frase, y F3-021 a F3-023 van a
  necesitar el mismo patrón para acordes, escalas y progresiones.
- **Decisión:**
  - `src/exercises/interval-dictation.ts` es puro: recibe un ejercicio
    `ear-interval` o `interval`, el tempo y el idioma, y devuelve las notas de
    la melodía, el timeline de una pasada, la respuesta canónica, las respuestas
    aceptadas y la regla pedagógica. No toca React, audio ni IndexedDB.
  - La melodía agrega una aproximación de semitono antes del primer sonido y una
    resolución de semitono después del último. En modo armónico aproxima el bajo,
    hace sonar las dos notas juntas en un solo evento y resuelve sobre la nota
    aguda. Si la aproximación o la resolución caen fuera del rango audible
    (MIDI 21-108), se omiten en vez de recortarse.
  - La dirección se deduce del ejercicio y se normaliza por altura real: un
    contenido con los campos `lower`/`upper` invertidos sigue sonando en el
    orden correcto. `ascending` y `descending` ordenan las dos notas; `harmonic`
    las superpone.
  - `repeatDictationTimeline` permite hasta tres pasadas (la primera escucha y
    dos repeticiones) con un silencio configurable entre ellas. El tope es una
    decisión pedagógica: un dictado no debería convertirse en una escucha
    ilimitada. La interfaz usa una pasada por pulsación y muestra el contador de
    repeticiones en un `role="status"`.
  - El reproductor de ejercicios muestra el dictado solo para `ear-interval`.
    El contador se guarda con el id del ejercicio, de modo que una recarga del
    mismo ítem no borra la cuenta ni la mezcla con el ejercicio siguiente. Al
    fallar, el feedback sale del propio dictado y reutiliza la regla «Recordá»
    de intervalos.
- **Alternativas:** generar frases tonales con la armadura de una lección
  (requiere más datos y puede contradecir la ortografía del ejercicio), mostrar
  el pentagrama y esconderlo después (revela la respuesta), usar solo la pareja
  aislada (no es «en contexto») o dejar la repetición sin tope (convierte el
  dictado en prueba y error).
- **Consecuencias:** el dictado se prueba sin reproducir sonido y funciona con
  cualquier ejercicio de intervalos, incluidas las doce tónicas de M3-05. La
  repetición y el feedback quedan centralizados para que F3-024 amplíe el botón
  a otros tipos de dictado y F3-025 registre los ítems en FSRS.
- **Limitación:** la aproximación y la resolución son cromáticas, no se
  adaptan a la armadura; suenan como bordadura y no como una frase tonal
  completa. El dictado no dibuja el pentagrama (es una prueba de oído) y no
  registra el intento en FSRS por sí solo: eso sigue ocurriendo al corregir el
  ejercicio con el reproductor existente. El contador de repeticiones no se
  persiste entre recargas ni se informa a FSRS.

## ADR-036 — Dictado de calidad de acordes con repeticiones compartidas

- **Contexto:** F3-021 pide dictar la calidad de un acorde en bloque o arpegio, cubrir las cuatro tríadas y las cinco séptimas de M4-10, permitir repeticiones acotadas y mostrar feedback con regla. F3-020 había dejado la política de repeticiones y el tope de pasadas dentro de `interval-dictation.ts`; copiarla en cada dictado nuevo habría duplicado la regla y permitido que los tipos se comportaran distinto.
- **Decisión:**
  - `src/exercises/dictation.ts` concentra la política común: `MAX_DICTATION_PLAYS` (3), `MAX_DICTATION_REPEATS`, el silencio por defecto y `repeatDictationTimeline`. `interval-dictation.ts` reexporta esos símbolos para no romper su API ni los tests existentes.
  - `src/exercises/chord-dictation.ts` es puro: recibe un ejercicio `ear-chord`, el tempo, el idioma y un estilo opcional; devuelve los MIDI del voicing, el timeline, la respuesta canónica, las respuestas aceptadas y la regla pedagógica. No toca React, audio ni IndexedDB.
  - El voicing sale de `chordWithInversion` con la fundamental, la calidad y la inversión del ejercicio, de modo que el dictado escucha exactamente lo que declara el contenido. La opción `style` permite alternar bloque y arpegio desde el reproductor sin reescribir el ejercicio.
  - `chordDictationMode` reduce los cuatro estilos de audio a dos familias evaluables: `block` para bloque y bajo+acorde, y `arpeggio` para los arpegios ascendente y descendente. Las listas `CHORD_DICTATION_TRIAD_QUALITIES` y `CHORD_DICTATION_SEVENTH_QUALITIES` documentan el repertorio esperado y dejan preparada la comparación de F3-022.
  - El reproductor usa el mismo patrón que F3-020: una pasada por pulsación, contador con tope de dos repeticiones, estado accesible y feedback del propio dictado al fallar. El contador se guarda con el id del ejercicio para sobrevivir a una recarga del ítem.
- **Alternativas:** generar una cadencia o una frase tonal alrededor del acorde (más contexto, pero exigiría datos de tonalidad que el ejercicio no declara), usar solo la fundamental y la calidad ignorando la inversión (el alumno oiría un voicing distinto del contenido) o mantener una copia de la política de repeticiones en cada dictado (duplicación y deriva entre tipos).
- **Consecuencias:** el dictado de acordes se prueba sin reproducir sonido y cubre cualquier `ear-chord` con las calidades soportadas por el esquema. La política de repeticiones queda lista para F3-022 y F3-023, y el feedback sigue centralizado en `src/theory/errors.ts`. El contenido de M4-10 no necesitó cambios.
- **Limitación:** el dictado no agrega una frase tonal ni una cadencia; el acorde suena aislado en la forma elegida. El contador de repeticiones no se persiste entre recargas ni se informa a FSRS, y el intento se registra recién al corregir el ejercicio con el reproductor existente.

## ADR-037 — Dictado de escalas y modos con comparación

- **Contexto:** F3-022 pide dictar escalas y modos, cubrir la mayor, las menores y todos los modos de M2, ofrecer una comparación auditiva y mostrar feedback con regla. Los ejercicios `ear-scale` existentes solo declaraban el modo y las opciones: no había tónica ni material reproducible, así que el reproductor no podía hacer sonar la escala.
- **Decisión:**
  - `src/exercises/scale-dictation.ts` es puro: recibe un ejercicio `ear-scale`, el tempo y el idioma; devuelve los MIDI de la escala, el timeline, la respuesta canónica, las aceptadas y la regla pedagógica. No toca React, audio ni IndexedDB.
  - La escala sale de `scalePitches(tonic, mode)` y agrega la octava de la tónica como cierre. `tonic` se incorpora al esquema `ear-scale` con valor por defecto Do para no romper el contenido existente; los tres ejercicios de M2 lo declaran explícitamente.
  - `SCALE_DICTATION_MODES` documenta los 16 tipos de escala soportados y `SCALE_DICTATION_COMPARISON` fija una referencia con la misma tónica. La comparación usa la mayor paralela en los modos diatónicos, la natural en las menores armónica y melódica, y la pentatónica menor en el blues. Así el alumno escucha qué grados cambian sin perder la tónica.
  - La referencia se entrega como timeline independiente. El reproductor la reproduce con un botón propio y no descuenta repeticiones, porque no es una repetición del ítem sino material de apoyo.
  - El reproductor reutiliza la política compartida de `src/exercises/dictation.ts`: primera escucha y hasta dos repeticiones, contador por id y estado accesible. El feedback sigue centralizado en `src/theory/errors.ts`.
- **Alternativas:** comparar con la relativa mayor (comparte las mismas notas y no ayuda a distinguir el modo por oído), generar una cadencia tonal (exigiría datos de tonalidad que el ejercicio no declara) o deducir la tónica del texto del enunciado (frágil y dependiente del idioma).
- **Consecuencias:** el dictado de escalas se prueba sin reproducir sonido y cubre cualquier `ear-scale` con los modos del esquema. La comparación queda disponible para F3-023 y F3-024 sin duplicar la lógica de audio, y el contenido de M2 solo necesitó declarar la tónica.
- **Limitación:** la comparación es una escala de referencia fija derivada del modo, no una frase tonal con armadura. El contador de repeticiones no se persiste entre recargas ni se informa a FSRS, y el intento se registra recién al corregir el ejercicio con el reproductor existente.

## ADR-038 — Dictado de progresiones sobre el playback de F1

- **Contexto:** F3-023 pide dictar progresiones cortas por sus grados, permitir repeticiones y mostrar feedback, reutilizando el playback construido en F1. El tipo `ear-progression` existía en el esquema y en la resolución de respuestas, pero no tenía módulo de audio ni contenido real; el reproductor nunca mostraba controles para ese tipo.
- **Decisión:**
  - `src/exercises/progression-dictation.ts` es puro: recibe un ejercicio `ear-progression`, el tempo y el idioma; devuelve los acordes con sus MIDI, el timeline, la respuesta canónica, las aceptadas y la regla pedagógica. No toca React, audio ni IndexedDB.
  - Cada grado se lee con `romanToChord(key, mode, numeral)`. El modo `minor` del esquema se traduce a `natural-minor`, pero la calidad del numeral manda: `V` produce un acorde mayor y `iv` uno menor. Así el contenido puede escribir dominantes secundarias o alteraciones sin cambiar de tipo.
  - Los acordes se arman en bloque con `chordTimeline` y se posicionan con `shiftTimeline`, reutilizando el scheduling y el tempo del playback de F1. Cada acorde dura `PROGRESSION_CHORD_BEATS` (1,5 pulsos), una duración corta que deja oír el cambio armónico sin volver el dictado una pieza larga.
  - La política de repeticiones sigue centralizada en `src/exercises/dictation.ts`: primera escucha y hasta dos repeticiones, contador por id y estado accesible. El feedback sale de `roman-numeral` en `src/theory/errors.ts`.
  - Se agregó el ejercicio real `ex.m2-07.m` (I-IV-V-I en Do mayor) al inicio de M2-07. Tener contenido real permite probar el recorrido completo del reproductor y deja el dictado disponible para el alumno; el contenido pasa a 355 ejercicios.
- **Alternativas:** inventar una progresión en el reproductor cuando el contenido no la declara (oculta el ejercicio real y no cubre el tipo), tocar solo la fundamental de cada grado (pierde la calidad del acorde), agregar una cadencia tonal de contexto (más material, pero exige datos que el ejercicio no declara) o generar una frase con armadura y figuras (fuera del alcance del dictado por grados).
- **Consecuencias:** el dictado se prueba sin reproducir sonido y cubre cualquier `ear-progression` con numerales válidos del motor. La UI reutiliza el patrón de los dictados anteriores y el playback de F1; F3-024 puede ampliar el botón de repetición sin duplicar lógica. El contenido de M2 gana un ejercicio auditivo sin cambiar lecciones ni habilidades.
- **Limitación:** la progresión suena en bloque y sin una frase tonal de contexto ni una cadencia separada. El contador de repeticiones no se persiste entre recargas ni se informa a FSRS, y el intento se registra recién al corregir el ejercicio con el reproductor existente.

## ADR-039 — Reproducción de pregunta y respuesta con contador compartido

- **Contexto:** F3-024 pide reproducir la pregunta y la respuesta de un ejercicio, con un botón de repetir limitado o registrado y un estado accesible, sin autoplay. Los dictados de F3-020 a F3-023 ya tenían un botón de escucha y un contador local en `ExercisePlayer` que solo medía la pregunta; no existía una forma de escuchar la respuesta canónica ni un contador reutilizable para ambas caras.
- **Decisión:**
  - `src/exercises/playback.ts` es puro y modela las dos caras de la escucha, `question` y `answer`, en un `PlaybackCounter` con el id del ejercicio. `playbackCount`, `canPlay` y `registerPlay` reinician la cuenta cuando cambia el id y cortan en el tope sin incrementar de más. `playbackRepeats` expone las repeticiones consumidas (todas las pasadas menos la primera).
  - El tope sigue siendo el de `src/exercises/dictation.ts`: tres pasadas por cara (una primera escucha y dos repeticiones). Pregunta y respuesta llevan cuentas separadas para que escuchar la respuesta no consuma la escucha previa a responder.
  - Los cuatro dictados exponen `answerTimeline` además de `timeline`: el intervalo solo (sin aproximación ni resolución), el acorde siempre en bloque y la escala o progresión completa. Se mantiene así la comparación entre la pregunta con contexto y la respuesta canónica.
  - `ExercisePlayer` reemplaza su contador local por el compartido. La respuesta se renderiza únicamente después de corregir y no en ejercicios de práctica; su botón alterna «Escuchar respuesta» / «Repetir respuesta» y su contador vive en `role="status" aria-live="polite"`. Ningún audio arranca al montar ni al avanzar: toda pasada nace de un clic.
- **Alternativas:** duplicar el contador dentro del reproductor (mezcla estado de UI con política de repeticiones y no se puede probar sin React), usar un contador único para pregunta y respuesta (la respuesta consumiría la escucha previa) o reproducir la respuesta automáticamente al corregir (viola la aceptación de «sin autoplay» y sorprende al alumno).
- **Consecuencias:** la política de pasadas queda en un módulo puro con tests propios y el reproductor solo decide qué timeline reproducir. El patrón sirve para futuros tipos auditivos con una respuesta sonora distinta de la pregunta, sin tocar FSRS. Los dictados ganan una API uniforme con `answerTimeline`.
- **Limitación:** la respuesta solo está disponible en los dictados auditivos; los ejercicios visuales y los de parámetros sonoros conservan sus botones sin contador. El contador no se persiste entre recargas ni se informa a FSRS, y el intento se registra al corregir como antes.

## ADR-040 — Ítems auditivos propios en FSRS y separación ver/oír

- **Contexto:** F3-025 pide registrar los ítems auditivos en FSRS, con un ítem por tipo y parámetros, variantes ver/oír y presencia en la cola diaria. Los ejercicios `ear-interval` y `ear-chord` ya apuntaban a habilidades auditivas, pero las escalas y progresiones auditivas reutilizaban `skill.major-scale` y `skill.chord-quality`, así que sus intentos se guardaban como variantes escritas y no aparecían como ítems auditivos en la cola. Además, el formato del registro se derivaba solo del tipo de habilidad, sin una regla explícita para el ejercicio.
- **Decisión:**
  - El contenido incorpora `skill.ear-scale` y `skill.ear-progression` con parámetros (modos, tónicas, comparación, grados y playback) y lecciones asociadas. Los ejercicios `ear-scale` y `ear-progression` apuntan a esas habilidades y las lecciones M2-07, M2-08, M2-10 y M2-11 las declaran, de modo que `reviewableSkills` y `buildReviewDay` las incluyen al empezar la lección.
  - `src/state/exercise-attempt.ts` expone `exerciseReviewItem(exercise)`, que devuelve `{ itemId, kind, format }`. Los cuatro tipos `ear-*` fuerzan `hear`; el resto conserva el formato derivado de la habilidad. `recordReview` acepta un formato explícito para que la intención del ejercicio no dependa de cómo se etiquete la habilidad.
  - Cada variante (ver y oír) apunta a una habilidad distinta y, por lo tanto, a una tarjeta FSRS distinta. La tarjeta sigue guardando el estado de repaso; los parámetros pedagógicos viven en `content/skills.json` y se referencian por id.
- **Alternativas:** registrar todo bajo la habilidad visual del tema (mezcla dos memorias distintas y pierde el formato auditivo), derivar el formato solo del `kind` de la habilidad (frágil si el contenido cambia de etiqueta) o inventar ids sintéticos por formato dentro del registro (duplica la fuente de verdad y deja ids fuera de `content/skills.json`).
- **Consecuencias:** los cuatro tipos auditivos crean ítems propios, la cola diaria los muestra cuando la lección se empezó y las estadísticas pueden separar el rendimiento visual del auditivo. El contenido declara explícitamente qué habilidad entrena cada variante. El test del reproductor se estabilizó esperando a que la selección habilite «Corregir».
- **Limitación:** el intento se registra al corregir, no al escuchar; la sesión auditiva adaptativa de F3-019 todavía no tiene pantalla ni registra sus ítems. Los parámetros del ítem no se copian dentro de la tarjeta FSRS.

## ADR-041 — Reglas «Recordá» por calidad de intervalo

- **Contexto:** F3-026 pide regla y ejemplo por calidad de intervalo, sin errores conceptuales y con test. Hasta ahora todos los ejercicios de intervalo mostraban el mismo consejo de cantidad (`interval-size`), que no explica por qué una tercera es mayor, menor, aumentada o disminuida. El dictado y el ejercicio escrito comparten corrección, pero no la elección del texto pedagógico.
- **Decisión:**
  - Se agregan cinco códigos específicos en `src/theory/errors.ts`: `interval-perfect`, `interval-major`, `interval-minor`, `interval-augmented` e `interval-diminished`, con regla y ejemplo en español e inglés. Cada regla fija los semitonos de sus cantidades para que el ejemplo sea verificable.
  - `intervalQualityFeedbackCode` mapea las siete calidades de `IntervalQuality`. Las calidades dobles (`doubly-augmented` y `doubly-diminished`) usan la regla aumentada o disminuida: no tienen texto propio porque son un paso más del mismo principio.
  - `resolvePedagogicalFeedback` acepta `intervalQuality`. El orden de prioridad es `code` explícito, luego `intervalQuality` y por último el tipo de ejercicio. Así el contenido puede forzar un texto concreto sin perder la selección automática.
  - `buildIntervalDictation` calcula la calidad real con `intervalBetween(fromSpelledPitch(lower), fromSpelledPitch(upper))`; `ExercisePlayer` hace lo mismo para los ejercicios `interval` sin dictado. La regla depende del par escrito, no de la etiqueta del ejercicio.
- **Alternativas:** mantener solo `interval-quality` (mezcla cinco conceptos en un párrafo y no da ejemplos por calidad), derivar la regla del texto de la respuesta (frágil ante traducciones y opciones) o escribir un texto por cada intervalo concreto (duplica reglas y envejece con el contenido).
- **Consecuencias:** el alumno recibe el consejo de la calidad que falló, con semitonos y ejemplo; el mismo mecanismo sirve para dictados y ejercicios escritos; agregar una calidad nueva obliga a decidir su mapeo en un único lugar. El bundle inicial creció ~1 kB gzip por los textos.
- **Limitación:** el feedback es textual; F3-028 se encargará de generar el ejemplo resuelto con el mismo ítem fallado. Las calidades dobles comparten la regla de su paso simple.

## ADR-042 — Reglas «Recordá» de acordes según lo que pregunta el ejercicio

- **Contexto:** F3-027 pide reglas de construcción, inversión y cifrado de acordes, con ejemplo resuelto y test. Los ejercicios `chord` comparten tipo pero preguntan cosas distintas mediante `ask` (`quality`, `inversion`, `notes` o `symbol`). El reproductor mostraba siempre la regla de calidad, así que una inversión o una construcción recibían el consejo equivocado. Los códigos `chord-tone` y `chord-inversion` existían pero no eran alcanzables desde el contenido.
- **Decisión:**
  - `src/theory/errors.ts` expone `ChordExerciseAsk` y `chordAskFeedbackCode`, que traduce `quality` → `chord-quality`, `inversion` → `chord-inversion`, `notes` → `chord-tone` y `symbol` → `chord-notation`.
  - `resolvePedagogicalFeedback` acepta `chordAsk`. El orden de prioridad queda: `code` explícito, `intervalQuality`, `chordAsk` y, por último, el tipo de ejercicio.
  - Se reescriben las cuatro reglas con ejemplos resueltos: construcción por terceras apiladas (tríadas, séptimas y extensiones), inversión decidida por el bajo (tres posiciones de tríada y cuatro de séptima), cifrado (sufijos de calidad y traducción latino/americano) y calidad (tercera, quinta y séptima).
  - `ExercisePlayer` calcula `chordAskOf(exercise)` y lo pasa al resolver; los dictados `ear-chord` siguen usando la regla de calidad porque escuchan el acorde completo.
- **Alternativas:** mapear por `skillId` (acopla la teoría al catálogo de habilidades y falla si el contenido reutiliza una habilidad), derivar la regla del texto de la respuesta (frágil ante traducciones) o dejar un único texto de calidad (no cubre construcción, inversión ni cifrado).
- **Consecuencias:** cada ejercicio de acorde muestra la regla del aspecto que evalúa; los códigos de construcción e inversión dejan de ser letra muerta; agregar un `ask` nuevo obliga a decidir su mapeo en un único lugar. El bundle inicial creció ~0,5 kB gzip por los textos ampliados.
- **Limitación:** los ejemplos son estáticos. F3-028 se encargará de generarlos con el mismo ítem fallado y de dibujarlos en pentagrama.

## ADR-043 — Ejemplos resueltos generados con el ítem fallado

- **Contexto:** F3-028 pide que el ejemplo de las reglas «Recordá» use el mismo ítem que falló, con notas y pentagrama correctos y test. Hasta F3-027 las reglas mostraban un ejemplo fijo, útil para explicar el concepto pero ajeno al ejercicio concreto. El reproductor ya tenía `Staff` y los ejercicios guardan la información necesaria: `lower`/`upper` y `direction` en intervalos, `root`/`quality`/`inversion`/`slash` en acordes, y `symbol` en cifrados.
- **Decisión:**
  - `src/exercises/worked-example.ts` agrega `buildWorkedExample(exercise)`, un módulo puro que devuelve `{ kind, measures, clef, keySignature }` o `null`.
  - Los intervalos melódicos generan una medida por nota, en el orden del ítem; los armónicos, una sola medida con las dos notas.
  - Los acordes usan `chordWithInversion` o `chordWithSlash` según tengan inversión o bajo con barra. Los cifrados se parsean por partes (`Do7/Solm` → `Do7` + `Solm`) porque `parseChordSymbol` rechaza sufijos en el bajo.
  - La clave se elige por registro: fa si la nota más grave queda por debajo de Do4 (MIDI 60), treble en el resto.
  - `ExercisePlayer` memoriza el ejemplo del ítem actual y reemplaza el texto del ejemplo por un `Staff`; las etiquetas «El mismo intervalo» / «El mismo acorde» están en español e inglés.
  - Los tipos sin representación resuelta (notas sueltas, escalas, ritmo, etc.) y los cifrados inválidos devuelven `null` y conservan el ejemplo textual de la regla.
- **Alternativas:** dibujar siempre el ejemplo genérico de la regla (no responde al ítem fallado), generar el pentagrama desde el texto de la respuesta (frágil ante traducciones) o ampliar `Staff` con una API específica por tipo de ejercicio (duplica la lógica de construcción de acordes que ya vive en `src/theory/chords.ts`).
- **Consecuencias:** el alumno ve exactamente las notas que acaba de fallar, con la inversión y el bajo del ejercicio; el ejemplo sigue la notación configurada porque `Staff` ya la respeta; los tipos nuevos solo necesitan una rama en `buildWorkedExample` para tener ejemplo dibujado. El bundle inicial creció ~0,7 kB gzip.
- **Limitación:** el texto accesible del pentagrama usa nombres por MIDI (`La♯` en vez de `Si♭`), aunque el dibujo conserva la ortografía del acorde. Los tipos fuera de intervalo, acorde y cifrado siguen con ejemplo textual.

## ADR-044 — Lecciones opcionales sin crear un módulo nuevo

- **Contexto:** F4-026 y F4-027 piden añadir temas de armonía avanzada (la napolitana y las sextas aumentadas) como «módulo opcional». El curso tiene los módulos M0–M8 fijos y el mapa, los contadores y el índice dependen de esa lista. Además, la ruta proponía siempre la primera lección disponible, sin distinguir ampliaciones de contenido obligatorio.
- **Decisión:**
  - Se agrega `optional` como booleano opcional en `LessonSchema`, en `exerciseBase` y en `CourseIndexLessonSchema`. La ausencia equivale a `false`, así que el contenido existente no cambia.
  - `scripts/lib/course-index.ts` propaga el flag al índice y `summarizeCourse` lo usa para elegir el siguiente paso: primero una lección en curso, después la primera obligatoria disponible y solo si no queda ninguna, una opcional disponible.
  - El mapa y el reproductor muestran «Opcional» junto al estado o al enunciado, con claves i18n en español e inglés.
  - La napolitana se publica como `lesson.m5-10` dentro de M5, con prerrequisito M5-08 y cuatro ejercicios `optional: true`. Las sextas aumentadas seguirán el mismo patrón como M5-11.
- **Alternativas:** crear un módulo M9 «Ampliaciones» (obliga a cambiar la lista de módulos, los contadores, el orden y las expectativas de los tests), marcar la lección como borrador (la oculta y no permite practicarla) o dejarla obligatoria al final de M5 (alarga la ruta y desmiente el carácter de ampliación).
- **Consecuencias:** el alumno puede hacer las ampliaciones cuando quiera sin que bloqueen el avance; el contenido obligatorio mantiene su ruta; el flag sirve para lecciones y ejercicios; los tests cubren que una opcional no se propone si hay una obligatoria. El índice crece de forma mínima.
- **Limitación:** una lección opcional no puede tener un módulo propio en el mapa; si en el futuro se quieren varias ampliaciones agrupadas, habrá que valorar un módulo M9 y actualizar los contadores.

## ADR-045 — Tipo propio para las sextas aumentadas y armadura menor correcta

- **Contexto:** F4-027 pide explicar y evaluar las sextas aumentadas italiana, francesa y alemana, incluida su resolución. Los tipos existentes no alcanzan: `roman-numeral` solo acepta un numeral romano, `borrowed-chord` describe préstamos del modo paralelo y `chord` evalúa la calidad o las notas de un acorde, pero ninguno distingue las tres variantes ni pregunta por su grado de resolución. Además, el pentagrama recibía `score.key` sin el modo, así que una partitura en La menor se dibujaba con la armadura de La mayor (tres sostenidos).
- **Decisión:**
  - Se agrega el tipo `augmented-sixth` con `key`, `mode`, `variant`, `ask` (`identify` o `resolve`) y `score`. La partitura permite dibujar y escuchar el acorde; `ask` separa el reconocimiento de la variante de la pregunta por la resolución.
  - Las etiquetas canónicas viven en `src/exercises/augmented-sixth.ts` y las comparten el contenido y `resolveExerciseAnswer`. La resolución se responde con `V`, con sinónimos «dominante» y «dominant» aceptados en texto.
  - `resolvePedagogicalFeedback` estrena el código `augmented-sixth`, con regla y ejemplo en español e inglés.
  - `src/content/score.ts` expone `scoreKeySignature(score)`, que devuelve `Am`, `Cm`, etc. para el modo menor. `LessonPlayer`, `KeyboardTask` y `ExercisePlayer` lo usan al pasar la armadura a `Staff`, que la entrega a VexFlow.
- **Alternativas:** reutilizar `roman-numeral` con respuestas `It+6`/`Fr+6`/`Ger+6` (el esquema y la corrección no distinguen bien la variante y la resolución), usar `chord` ask `notes` (solo evalúa la escritura, no el reconocimiento), o dejar el flag de la armadura como estaba (mantiene partituras en menor mal dibujadas).
- **Consecuencias:** el alumno reconoce las tres variantes y su resolución con feedback propio; el pentagrama dibuja correctamente cualquier partitura en menor, incluidas las lecciones ya publicadas; el tipo nuevo queda disponible para futuros ejercicios de armonía cromática. Los contadores suben a 64 lecciones, 543 ejercicios y 50 habilidades.
- **Limitación:** el contenido cubre La menor y Do menor; no hay generador de las doce tonalidades. La corrección de `identify` depende de las etiquetas canónicas, así que el contenido debe reutilizarlas. La demo del 6/4 cadencial usa tres voces para mostrar la conducción sin introducir una textura a cuatro voces.
