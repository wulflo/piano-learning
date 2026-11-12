# RESUME — PianoDesdeCero

Instrucciones para retomar el proyecto desde una sesión nueva, sin contexto previo.

## Qué es

App web estática para aprender teoría musical y piano/teclado desde cero, sin
profesor. El alumno estudia microlecciones en la app y practica en su teclado
real. Sin backend, sin cuentas y sin analytics: el progreso vive en IndexedDB.

- Código: MIT. Contenido propio: CC BY-SA 4.0 (ejercicios CC0).
- Sonido: Salamander Grand Piano (Alexander Holm, CC BY 3.0) con fallback
  sintetizado; el MIDI es opcional.
- Demo publicada: <https://wulflo.github.io/piano-learning/>. GitHub Pages
  despliega el artefacto de `dist/` con `.github/workflows/deploy-pages.yml` en
  cada push a `main`. El remoto es `origin`
  (<https://github.com/wulflo/piano-learning>). Las muestras de audio pesadas no
  se versionan: en Pages la app usa el sintetizador de respaldo.

## Estado actual

- Fase: **F5 en curso** — M7-01 «Independencia de manos», M7-02 «Arpegios y
  acordes quebrados», M7-03 «Pedal», M7-04 «Acompañamiento en bloque», M7-05
  «Acompañamiento arpegiado», M7-06 «Alberti», M7-07 «Walking bass», M7-08
  «Stride», M7-09 «Lectura a primera vista», M7-10 «Tocar de oído,
  transposición e improvisación» y M7-11 «Lead sheets y cifrados» publicadas.
  M8-01 «Pop/rock», M8-02 «Blues», M8-03 «Jazz básico» y M8-04 «Ritmos
  latinos» publicadas como lecciones opcionales. M5-01
  «Acordes diatónicos», M5-02 «Números romanos», M5-03 «Funciones T-S-D»,
  M5-04 «Cadencias», M5-05 «Progresiones comunes», M5-06 «Blues de 12
  compases», M5-07 «Dominantes secundarias», M5-08 «Intercambio modal», M5-09
  «Modulación y conducción de voces», M6-01 «Motivo y frase», M6-02 «Período y
  forma binaria/ternaria», M6-03 «Rondó y sonata», M6-04 «Texturas: monofonía,
  homofonía, polifonía», M6-05 «Contrapunto básico», M6-06 «Ornamentos», M5-10
  «La napolitana» (opcional) y M5-11 «Sextas aumentadas» (opcional) publicadas.
  F0, F1, F2, F3 y F4 completadas (M3-M4, entrenamiento auditivo, M5-M6 y
  armonía funcional); M3-01 a M3-05, M4-01 a M4-12, M5-01 a M5-11, M6-01 a
  M6-06, M7-01 a M7-11 y M8-01 a M8-04 publicadas. M8 queda cerrado con un
  mapa de estilos en el curso que enlaza cada lección con su pieza original.
  El set 1 de estudios técnicos (seis piezas CC0 con digitación y progresión de
  tempo) y el set 2 de nivel intermedio (independencia y arpegios) están
  publicados. Los generadores de digitación e independencia, el metrónomo
  progresivo con récord de tempo, el cargador diferido de piezas, el gran
  pentagrama con manos separadas, el reproductor con tempo, bucle y selección
  de manos, el índice de repertorio con ficha de licencia y página de
  atribuciones, la verificación de dominio público de las trece piezas
  candidatas y las transcripciones de «Twinkle, Twinkle, Little Star»,
  «Frère Jacques», «Greensleeves», «Auld Lang Syne», «Amazing Grace», la
  «Oda a la alegría» y el Minueto en Sol de Petzold ya están implementadas; la
  próxima tarea es F5-033 (transcribir el «Soldatenmarsch» de Schumann).
- Punto de reanudación: ver el bloque `PUNTO DE REANUDACIÓN` de
  `docs/CHECKLIST.md` (fuente única de verdad).
- Suite: 212 archivos de test, 1541 tests en verde, más 4 recorridos E2E de
  Playwright; typecheck, build y presupuesto de 253,87 kB gzip inicial verdes.
- M0-01 completa: lección publicada, tres ejercicios con corrección, demo de
  pentagrama/audio y tarea real con digitación.
- M0-02 completa: Do-Re-Mi/C-D-E, octavas 2-6, cinco ejercicios de teclado y
  pentagrama, demos en clave de sol y de fa.
- M0-03 completa: postura, banco, forma de la mano, señales de tensión, tarea
  autoevaluable y aviso honesto sobre aprender sin profesor.
- M0-04 completa: método de práctica con metas medibles, ejercicio de
  planificación, checklists de 15/30/45 y tarea autoevaluable.
- M0-05 completa: diagnóstico de 8 ítems no bloqueante, lógica de puntaje por
  bandas (M0-M3) y mapa del curso M0-M8; pantalla interactiva diferida al shell.
- M0-06 completa: autoobservación con espejo y grabación, checklist de tensión
  y advertencia honesta sobre los límites de aprender sin profesor. M0 cerrado.
- M1-01 completa: altura, duración, intensidad y timbre con demos sonoras,
  ejercicios A/B de escucha y tarea de dinámica. Nuevo tipo `sound-parameter`.
- M1-02 completa: pentagrama, claves de sol y fa, Do central en ambas claves,
  demos renderizadas y cuatro ejercicios de lectura.
- M1-03 completa: alteraciones, enarmonía, tonos y semitonos con 12 ejercicios
  de tónica y 2 de enarmonía.
- M1-04 completa: figuras de redonda a treintaidosavo, silencios, ocho
  ejercicios de completar compases y dos dictados rítmicos.
- M1-05 completa: compases simples 2/4, 3/4 y 4/4, acentos fuerte/débil,
  ejercicios de completar y marcar, y práctica con metrónomo.
- M1-06 completa: compases compuestos 6/8, 9/8 y 12/8, pulso de negra con
  puntillo, subdivisión ternaria, ejercicios de completar y acentos.
- M1-07 completa: puntillo, ligadura de prolongación y tresillo en compás
  simple y compuesto, con dictados rítmicos y tarea de teclado.
- M1-08 completa: síncopa, contratiempo y anacrusa, con dictado, ejercicios
  de compensación de anacrusa y tarea con metrónomo acentuado.
- M1-09 completa: términos de tempo, comparación andante/allegro, estabilidad
  con metrónomo y control de tempo persistente de 40 a 240 BPM.
- M1-10 completa: dinámicas pp–ff, crescendo/diminuendo y articulación
  legato, staccato y acento, con escucha y tarea de teclado.
- M1-11 completa: repeticiones, casillas de primera y segunda, da capo,
  dal segno, Fine y coda, con ejercicios de orden de reproducción.
- M1-12 completa: 20 términos italianos de tempo, dinámica, articulación y
  carácter, con glosario estructurado, ejemplos propios, demos comparativas y
  quiz. M1 cerrado.
- M3-01 completa: intervalos por cantidad y calidad (segundas a octavas,
  justos, mayores, menores, aumentados y disminuidos), demo armónica, tarea de
  teclado con tercera mayor y quinta justa y doce ejercicios, uno por tónica.
- M3-02 completa: inversión de intervalos con la regla de suma nueve, el
  intercambio de calidades, la conservación de la ortografía, demo de cuatro
  pares original-inversión, tarea de teclado y doce ejercicios, uno por tónica.
- M3-03 completa: consonancias perfectas e imperfectas, disonancias y la cuarta
  justa como caso contextual, demo de ocho intervalos armónicos, tarea de
  teclado que compara reposo y tensión y doce ejercicios de escucha, uno por
  tónica. El tipo `interval` admite una respuesta de clasificación opcional.
- M3-04 completa: intervalos dentro de melodías y acordes, grados conjuntos,
  saltos, dirección, peso métrico e intervalos compuestos; demo de una frase y
  de Do mayor en posición fundamental y primera inversión. El tipo `interval`
  admite un fragmento visible y reproducible, y doce ejercicios piden identificar
  intervalos dentro de melodías o acordes.
- F3-004a completa: contraste del pentagrama en tema oscuro corregido; el área
  del pentagrama (`--staff-bg`) pasa a fondo claro tipo papel (`#f7f5f0`) en tema
  oscuro y las notas (`#1d1f23`) mantienen contraste WCAG AA sobre él.
- F3-005 completa: M3-05 «Intervalos de oído» publicada con referencia auditiva
  (demo de la tercera mayor), entrenamiento ascendente/descendente/armónico y doce
  ejercicios de tipo `ear-interval` con dificultad progresiva.
- F3-006 completa: M4-01 «Tríadas mayores y menores» publicada con la
  construcción 1-3-5, demo en bloque y arpegio, tarea real de teclado y doce
  ejercicios de tipo `chord` que cubren las doce tónicas alternando calidad mayor
  y menor.
- F3-007 completa: M4-02 «Tríadas disminuidas, aumentadas y sus» publicada con
  las fórmulas 1-♭3-♭5, 1-3-♯5, 1-2-5 y 1-4-5, el tritono de la disminuida, la
  simetría de la aumentada y la resolución de las suspendidas; demo de las cuatro
  calidades sobre Do, tarea de teclado que resuelve Do-Fa-Sol en Do-Mi-Sol y doce
  ejercicios de tipo `chord` con las doce tónicas repartidas entre las cuatro
  calidades. La habilidad `skill.chord-quality` incorpora `sus2` y `sus4`.
- F3-008 completa: M4-03 «Inversiones y voicings básicos» publicada con el bajo
  real como criterio, las tres posiciones de la tríada (1-3-5, 3-5-1, 5-1-3), el
  cifrado slash y la diferencia entre voicing cercano y abierto; demo de Do mayor
  en fundamental, primera, segunda y abierto, tarea de teclado y doce ejercicios
  que identifican la inversión a partir de las notas ordenadas desde el bajo. El
  tipo `chord` admite `ask: "inversion"` y se agregó la habilidad
  `skill.chord-inversion`.
- F3-009 completa: M4-04 «Séptimas: maj7, 7, m7, m7♭5 y dim7» publicada con las
  cinco fórmulas (1-3-5-7, 1-3-5-♭7, 1-♭3-5-♭7, 1-♭3-♭5-♭7 y 1-♭3-♭5-♭♭7),
  el cifrado de cada calidad, el tritono y la resolución de la de dominante, el
  uso de cada séptima y la diferencia con el cifrado slash; demo de las cinco
  sobre Do, tarea de teclado y doce ejercicios que alternan identificar la
  calidad a partir de las notas y escribir las notas a partir del cifrado. El
  tipo `chord` admite `ask: "notes"` y se agregó la habilidad
  `skill.chord-seventh`.
- F3-010 completa: M4-05 «Extensiones: 9, 11 y 13» publicada con la novena, la
  oncena y la trecena como intervalos compuestos de 14, 17 y 21 semitonos, la
  séptima implícita y las nueve fórmulas maj9/9/m9, maj11/11/m11 y
  maj13/13/m13; explica las tensiones y choques (la oncena como nota a evitar
  sobre el dominante) y las omisiones habituales de los voicings. Demo de cuatro
  voicings sobre Do, tarea de teclado y doce ejercicios que alternan reconocer la
  calidad extendida y escribir las notas desde el cifrado. Se agregó la habilidad
  `skill.chord-extension`.
- F3-011 completa: M4-06 «Slash chords» publicada con la barra como indicador del
  bajo, la diferencia entre inversión (Do/Mi, Do/Sol) y acorde híbrido con un bajo
  ajeno a la tríada (Do/Re, Do/Si), la colocación del bajo y el acorde y la
  equivalencia entre cifrado latino y americano. Demo de cuatro slash chords sobre
  Do, tarea de teclado a dos manos y doce ejercicios que alternan leer el cifrado
  y escribir las notas. El tipo `chord` admite `slash` y `ask: "symbol"`, el motor
  incorpora `chordWithSlash` y se agregó la habilidad `skill.chord-slash`.
- F3-012 completa: M4-07 «Cifrado latino y americano» publicada con la tabla
  completa de notas latinas (Do, Re, Mi, Fa, Sol, La, Si) y americanas (C, D, E, F,
  G, A, B), las alteraciones ♭/♯ con sus formas ASCII b/#, los sufijos de calidad que
  se conservan y la conversión de ambos lados de la barra (Do7/Solm ↔ C7/Gm). El nuevo
  tipo `chord-notation` con `symbol` y `to` (`do`/`c`) se resolvió con
  `convertChordNotation` del motor y el error pedagógico «Recordá la equivalencia
  entre cifrados» cubrió la nueva categoría. Demo de ocho acordes con cifrado dual,
  tarea de teclado y doce ejercicios de conversión (seis con opciones y seis con
  respuesta escrita). Se agregó la habilidad `skill.chord-notation`.
- F3-013 completa: M4-08 «Medir intervalos» publicada con la cantidad y la calidad,
  la medición melódica y la armónica, las doce tónicas, las siete cantidades (2.ª a
  octava) y las cinco calidades. Demo de cuatro intervalos desde Do (tercera mayor,
  tercera menor, cuarta justa y cuarta aumentada), tarea de teclado con la demo y doce
  ejercicios de tipo `interval` con opciones en español e inglés y respuestas
  canónicas verificadas por el motor. Se agregó la habilidad `skill.interval-quality`
  a la lección.
- F3-014 completa: M4-09 «Cifrado ↔ notas» publicada con los dos sentidos de la
  conversión (cifrado → notas y notas → cifrado), tríadas y séptimas, cifrado latino
  y americano y un test de ida y vuelta. Demo de cuatro acordes, tarea de teclado y
  doce ejercicios de tipo `chord` (seis `ask: "notes"` y seis `ask: "symbol"`). Se
  agregó la habilidad `skill.chord-symbol`. El test de ida y vuelta detectó y corrigió
  un fallo del motor con raíces latinas de tres letras (`Sol`, `La`, `Si`) en
  `parseChordSymbol`.
- F3-015 completa: M4-10 «Reconocer la calidad de un acorde» publicada con las
  cuatro tríadas y las cinco séptimas, los pares que más se confunden (maj7/7 y
  m7/m7♭5) y doce ejercicios: seis visuales de tipo `chord` con las notas y seis
  auditivos de tipo `ear-chord`. Se amplió `ear-chord` con `root`, `inversion` y
  `style` y se agregó `earChordTimeline` para que el reproductor suene el acorde
  con un botón «Escuchar acorde». La habilidad `skill.chord-quality-ear` cubre el
  reconocimiento auditivo y las visuales se reparten entre `skill.chord-quality`
  y `skill.chord-seventh`.
- F3-016 completa: M4-11 «Inversiones y bajo» publicada con la inversión
  decidida por el bajo, las tres posiciones de la tríada y las cuatro de la
  séptima, la construcción desde un bajo con barra y las tres condiciones de un
  voicing válido. Demo de Do maj7 en sus cuatro posiciones, tarea de teclado y
  doce ejercicios `chord`: seis de identificar la inversión y seis de escribir
  las notas desde un `slash`. El test de voicings compara cada resultado con
  `chordWithSlash` y comprueba bajo más grave, notas completas, orden rotado e
  índice de inversión. Se amplió `skill.chord-inversion` con la inversión 3.
- F3-017 completa: M4-12 «Extensiones con bajo» publicada con la idea de que la
  extensión no cambia el bajo, el procedimiento para construir el voicing
  completo, la lectura y escritura del cifrado con barra y los errores
  frecuentes. Demo de Do maj9/Mi, Re m9/Do, Sol11/Fa y La♭maj13/Do, tarea de
  teclado y doce ejercicios `chord` de dificultad alta: seis de escribir las
  notas desde el cifrado y seis de escribir el cifrado desde las notas. Cubre
  las nueve calidades extendidas y las doce tónicas. Se corrigió `invertChord`
  para que los voicings extendidos queden ascendentes desde el bajo, con
  regresión en `tests/theory-chords.test.ts`.
- F3-018 completa: reproducción de acordes con voicings en cuatro formas
  (`block`, `arpeggio-up`, `arpeggio-down` y `bass-chord`) desde una lista
  compartida `CHORD_STYLES`. `chordExerciseTimeline` respeta inversión y bajo
  con barra, y `earChordTimeline` acepta un estilo que sobrescribe el del
  ejercicio. En `bass-chord` el bajo se sostiene tres pulsos y el acorde entra
  sin repetir su MIDI para evitar notas trabadas. El reproductor muestra
  «Escuchar acorde» y un selector de forma para `chord` y `ear-chord`.
- F3-019 completa: motor puro de sesiones auditivas adaptativas con 10 ítems
  por defecto, selección determinista por semilla, dificultad de 1 a 5 con
  rachas configurables y registro de cada respuesta con su nivel.
- F3-020 completa: dictado de intervalos en contexto. Envuelve el par del
  ejercicio en una melodía breve (aproximación, notas del intervalo y
  resolución), respeta la dirección y el modo armónico, permite hasta dos
  repeticiones y devuelve respuesta canónica y regla «Recordá». El reproductor
  lo usa en los ejercicios `ear-interval`.
- F3-021 completa: dictado de calidad de acordes. `buildChordDictation` arma el
  voicing del ejercicio y lo entrega en bloque o arpegio, con las cuatro tríadas
  y las cinco séptimas, respuesta canónica en ES/EN y regla «Recordá». La
  política de repeticiones se extrajo a `src/exercises/dictation.ts` y la
  comparten los dictados de intervalos y acordes. El reproductor lo usa en
  `ear-chord` con selector de forma, dos repeticiones y feedback.
- F3-022 completa: dictado de escalas y modos. `buildScaleDictation` arma la
  escala desde la tónica y el modo, cierra en la octava, cubre los 16 tipos de
  escala de M2 y devuelve respuesta canónica en ES/EN y regla «Recordá». Ofrece
  una referencia con la misma tónica para comparar (mayor paralela, natural en
  las menores alteradas y pentatónica en el blues). El esquema `ear-scale`
  incorpora `tonic`; el reproductor muestra escuchar/repetir, comparación,
  contador y feedback.
- F3-023 completa: dictado de progresiones. `buildProgressionDictation` lee los
  grados romanos con `romanToChord`, arma cada acorde en bloque y los encadena
  con el playback de F1. Devuelve el timeline, la respuesta canónica en ES/EN y
  la regla «Recordá»; la menor se interpreta como natural y la calidad escrita
  en cada numeral manda. El reproductor muestra escuchar/repetir progresión,
  contador y feedback. Se agregó `ex.m2-07.m` (I-IV-V-I en Do mayor) y el
  contenido pasó a 355 ejercicios.
- F3-024 completa: reproducción de pregunta y respuesta. `src/exercises/playback.ts`
  cuenta por separado las pasadas de la pregunta y de la respuesta con el tope
  compartido de una escucha y dos repeticiones, guardado por id de ejercicio.
  Los cuatro dictados exponen `answerTimeline` (intervalo solo, acorde en bloque,
  escala o progresión completa). El reproductor nunca arranca audio al montar y,
  tras corregir, ofrece «Escuchar respuesta» / «Repetir respuesta» con contador
  accesible.
- F3-025 completa: registro de ítems auditivos en FSRS. `skill.ear-scale` y
  `skill.ear-progression` se suman a las habilidades auditivas de intervalos y
  acordes, con parámetros y lecciones; los ejercicios `ear-*` fuerzan el formato
  `hear` y las variantes ver/oír usan tarjetas FSRS separadas. La cola diaria
  incluye las cuatro habilidades auditivas al empezar la lección.
- F3-026 completa: reglas «Recordá» por calidad de intervalo. Los códigos
  `interval-perfect`, `interval-major`, `interval-minor`, `interval-augmented`
  e `interval-diminished` tienen regla y ejemplo en español e inglés; las
  calidades dobles usan la regla aumentada o disminuida. El dictado y el
  ejercicio escrito eligen el texto según la calidad real del par de notas.
- F3-027 completa: reglas «Recordá» de acordes y cifrado. `chordAskFeedbackCode`
  elige construcción, inversión, calidad o cifrado según `ask`; las cuatro
  reglas incluyen ejemplos resueltos de tríadas, séptimas, extensiones y
  cifrados latinos y americanos.
- F3-028 completa: ejemplos resueltos automáticos. `buildWorkedExample` dibuja
  en pentagrama el mismo intervalo o acorde que falló, con su inversión o bajo
  con barra y la clave adecuada al registro; los demás tipos conservan el
  ejemplo textual de la regla.
- F3-029 completa: integración de las 17 lecciones de M3-M4. Una prueba
  recorre contenido, prerrequisitos y orden del curso, los 12 ejercicios y la
  tarea de teclado de cada lección, la carga diferida de lecciones y ejercicios,
  y el render de M3-01 y M4-01 con el reproductor. No hubo cambios de contenido:
  la aceptación hablaba de 12 lecciones y el bloque real ya tenía 17.
- F3-030 completa: property tests de la teoría de M3-M4 en las doce tónicas.
  Cubren intervalos con su ortografía, inversiones, tríadas, séptimas,
  extensiones, cifrado americano/latino, slash chords e inversiones de acordes.
  La propiedad encontró que «Faug» se leía como la nota latina «Fa» más «ug»;
  el parser ahora prefiere la lectura americana cuando el sufijo latino no es
  válido.
- F3-031 completa: fuzz tests de los generadores con 500 casos por lote y
  `Math.random` sembrado. Cubren teclado, pentagrama, deletreo, armaduras y
  transposición, sin notas consecutivas repetidas y con respuestas y opciones
  sin ambigüedad.
- F3-032 completa: accesibilidad de los cuatro dictados (intervalos, acordes,
  escalas y progresiones). Axe no encuentra violaciones críticas ni serias, los
  avisos de qué suena y de comparar con la respuesta se asocian con
  `aria-describedby`, y un flujo solo con teclado escucha, elige, corrige y lee
  el resultado textual sin depender del audio ni del color.
- F3-033 completa: E2E de M3-M4. Siembra M2-12 en IndexedDB para abrir M3-01,
  falla un intervalo, comprueba el «Recordá», recorre el repaso disponible y
  verifica en progreso que las respuestas persisten tras recargar.
- F3-034 completa: cierre de F3. `npm run estado` queda verde con 142 archivos /
  1000 tests, build y contenido validados; E2E 2/2 y presupuesto de 208,99 kB
  gzip inicial. Tag local `fase-3` y resumen de la fase en CHECKLIST y CHANGELOG.
  Deuda: el E2E siembra el prerrequisito en IndexedDB, la accesibilidad no se
  probó con un lector de pantalla real y falta la escucha de audio en hardware.
- F4-001 completa: M5-01 «Acordes diatónicos» con tríadas y séptimas en mayor,
  menor natural y menor armónica; 12 ejercicios de cifrado sobre las doce
  tonalidades, dos demos de audio, tarea de teclado Imaj7-V7 y test de
  contenido. Suite 143 archivos / 1007 tests, build 209,44 kB gzip inicial y
  E2E 2/2 en verde.
- F4-002 completa: M5-02 «Números romanos» con la lectura del grado, la
  mayúscula/minúscula de cada cualidad y el ° del disminuido; menor natural y
  armónica; demo I-IV-V-I; tarea de teclado; seis ejercicios de acorde a numeral
  y seis de numeral a acorde con doce tonalidades. El motor de respuestas ahora
  distingue `V` de `v` (la normalización anterior los hacía equivalentes) y se
  corrigió un salto de línea que absorbía F4-003 en el checklist. Tras el
  primer deploy fallido se evitó actualizar estado en `ExercisePlayer` cuando el
  guardado termina después de desmontar el componente (causaba un
  `window is not defined` en CI). Suite 144 archivos / 1014 tests en verde y
  presupuesto de 209,89 kB gzip inicial.
- F4-003 completa: M5-03 «Funciones T-S-D» agrupa los grados en tónica (T),
  subdominante (S) y dominante (D), explica el reposo, la apertura y la tensión
  en mayor y menor, y publica una demo I-IV-V-I, una tarea i-iv-V-i en La menor
  y doce ejercicios de clasificación. Se añadió el tipo `harmonic-function`, que
  deriva la respuesta de `functionsForMode` del motor en lugar de duplicarla en
  cada ejercicio. Suite 145 archivos / 1021 tests en verde, build y presupuesto
  de 210,44 kB gzip inicial; E2E 2/2.
- F4-004 completa: M5-04 «Cadencias» con la auténtica (V-I), la plagal (IV-I),
  la semicadencia (…-V) y la rota (V-vi), cuatro demos de audio en Do mayor,
  tarea con las cuatro cadencias y doce ejercicios de clasificación. Se añadió
  el tipo `cadence`, que deriva el tipo de cadencia de los dos grados, y el
  feedback pedagógico propio. Suite 146 archivos / 1028 tests en verde, build y
  presupuesto de 211,28 kB gzip inicial; E2E 2/2.
- F4-005 completa: M5-05 «Progresiones comunes» con I-V-vi-IV y ii-V-I, sus
  funciones, la variante vi-IV-I-V y las doce tonalidades mayores; dos demos de
  playback (pop en Do y ii-V-I con séptimas), tarea de teclado con las dos
  progresiones y doce ejercicios de completar uno por tonalidad. Se reutilizó
  el tipo `progression-completion` y la habilidad nueva se registra como
  `progression`. Suite 147 archivos / 1035 tests en verde, build y presupuesto
  de 211,67 kB gzip inicial; E2E 2/2.
- F4-006 completa: M5-06 «Blues de 12 compases» con la estructura de tres
  frases de cuatro, I7-IV7-V7, el turnaround, la variante quick change, el
  blues lento y el blues menor; dos demos de playback (básico en Do y quick
  change en Sol), tarea de doce compases y doce ejercicios de grados repartidos
  entre las doce tonalidades. Se reutilizó `progression-completion` con doce
  grados y la habilidad nueva se registra como `progression`. Suite 148
  archivos / 1042 tests en verde, build y presupuesto de 212,09 kB gzip
  inicial; E2E 2/2.
- F4-007 completa: M5-07 «Dominantes secundarias» explica el cifrado V/x, V/V
  y V/ii, la resolución por semitono de la sensible y la séptima, y menciona
  V/vi y V/IV como contexto. Se añadió el tipo `secondary-dominant`, que deriva
  el cifrado de `secondaryDominantNumeral` y la resolución de
  `romanNumeralFor`, con feedback pedagógico propio. Publica dos demos
  (D7→G y A7→Dm), tarea de teclado con los dos pares y doce ejercicios de
  cifrado y resolución uno por tonalidad. Suite 149 archivos / 1049 tests en
  verde, build y presupuesto de 213,03 kB gzip inicial; E2E 2/2.
- F4-008 completa: M5-08 «Intercambio modal» explica el préstamo del modo
  paralelo, los acordes iv, ♭VI, ♭VII, ♭III, ii° y v en mayor, la tercera de
  Picardía y el préstamo inverso en menor. Se añadió el tipo `borrowed-chord`,
  que conserva el cifrado con su alteración y el caso exacto, con feedback
  pedagógico propio. Publica dos demos (iv-I y ♭VI-♭VII-I en Do), tarea de
  teclado con los cinco acordes y doce ejercicios de cifrado en las doce
  tonalidades. Suite 150 archivos / 1056 tests en verde, build y presupuesto de
  213,79 kB gzip inicial; E2E 2/2.
- F4-009 completa: M5-09 «Modulación y conducción de voces» explica la
  diferencia entre modulación y tonicización, el acorde pivote entre
  tonalidades vecinas y las reglas básicas de conducción de voces (notas
  comunes, grados conjuntos, resolución de la sensible y de la séptima, y
  prohibición de quintas y octavas paralelas). Se añadió el tipo `pivot-chord`,
  que deriva el cifrado con `romanNumeralFor` y compara el caso exacto, con
  feedback pedagógico propio. Publica dos demos (Do-Lam-Re7-Sol y Sol7-Do),
  tarea de teclado con la modulación y la resolución y doce ejercicios de
  análisis en las doce tonalidades. Suite 151 archivos / 1063 tests en verde,
  build y presupuesto de 214,66 kB gzip inicial; E2E 2/2.
- F4-010 completa: M6-01 «Motivo y frase» explica el motivo como unidad
  melódica mínima, la frase como idea completa de cuatro compases, la
  semifrase y el desarrollo motívico (repetición, secuencia, inversión,
  aumentación y disminución). Se añadió el tipo `phrase-analysis`, que muestra
  una partitura y deriva la respuesta de los segmentos marcados (motivos y
  frases), con audio de la melodía completa y feedback pedagógico propio. La
  habilidad `skill.motive-phrase` estrena el tipo `form`. Publica dos demos
  originales, tarea de teclado y doce ejercicios de análisis melódico. Suite
  152 archivos / 1071 tests en verde, build y presupuesto de 215,98 kB gzip
  inicial; E2E 2/2.
- F4-011 completa: M6-02 «Período y forma binaria/ternaria» explica el período
  con antecedente abierto y consecuente que cierra, la forma binaria AB (con
  sus repeticiones AABB y la variante redondeada) y la ternaria ABA (minueto
  con trío y aria da capo). Se añadió el tipo `form-analysis`, que muestra la
  partitura con secciones etiquetadas y deriva la respuesta de la forma
  declarada o de la función de una frase del período; el validador comprueba
  que las secciones caben, están en orden y respetan el esquema AB o ABA.
  Publica tres demos originales (período, binaria y ternaria), tarea de teclado
  y doce ejercicios de análisis formal con audio. Suite 153 archivos / 1079
  tests en verde, build y presupuesto de 217,17 kB gzip inicial; E2E 2/2.
- F4-012 completa: M6-03 «Rondó y sonata» explica el rondó con su estribillo
  recurrente y sus episodios (esquemas ABACA y ABACABA, con «Para Elisa» y el
  «Rondó alla turca» como ejemplos de dominio público) y la forma sonata con
  exposición, desarrollo y recapitulación, incluido el plan tonal que resuelve
  el segundo tema en la tónica (Sonata K. 545 de Mozart). El tipo
  `form-analysis` amplía su enum de formas con `rondo` y `sonata`, y el
  validador comprueba los esquemas de cinco secciones ABACA y de tres bloques
  con función tonal. Se añadió la habilidad `skill.rondo-sonata` y el feedback
  `rondo-sonata` en español e inglés. Publica dos demos originales (rondó de
  quince compases y sonata en miniatura), tarea de teclado y doce ejercicios de
  reconocimiento formal. Suite 154 archivos / 1087 tests en verde, build y
  presupuesto de 218,35 kB gzip inicial; E2E 2/2.
- F4-013 completa: M6-04 «Texturas: monofonía, homofonía, polifonía» explica la
  textura como combinación de líneas y acordes, con escucha comparada de tres
  demos originales: una melodía sola, la misma idea con acordes y un canon a
  dos voces. Usa ejemplos de dominio público (canto gregoriano, himno y una
  invención de Bach). Se añadió el tipo `texture-analysis`, que muestra la
  partitura y deriva la respuesta de la textura declarada; el validador
  comprueba que la monofonía no tenga acordes ni voces simultáneas, que la
  homofonía tenga acordes y que la polifonía tenga al menos dos voces notadas
  que suenen a la vez. Se añadió la habilidad `skill.texture` (tipo `texture`),
  el feedback `texture` en español e inglés y el campo `voice` en los eventos
  para separar voces. Publica tarea de teclado y doce ejercicios de
  clasificación, cuatro por textura. Suite 155 archivos / 1095 tests en verde,
  build y presupuesto de 219,45 kB gzip inicial; E2E 2/2.
- F4-014 completa: M6-05 «Contrapunto básico» explica la combinación de voces
  independientes, los cuatro movimientos (paralelo, similar, contrario y
  oblicuo) y las reglas simples que evitan las quintas y octavas paralelas y
  prefieren el movimiento contrario. Incluye dos demos originales —un
  contrapunto correcto a dos voces y un ejemplo con quintas paralelas— y una
  tarea de teclado para tocar y cantar cada voz. Se añadió el tipo
  `counterpoint-analysis` (`ask` de movimiento o de regla), la habilidad
  `skill.counterpoint` (tipo `counterpoint`) y el feedback `counterpoint` en
  español e inglés. El validador exige dos voces notadas con eventos
  simultáneos y, en las preguntas de regla, el campo `parallels`. Publica doce
  ejercicios: ocho de movimiento y cuatro de reglas. Suite 156 archivos / 1103
  tests en verde, build y presupuesto de 220,65 kB gzip inicial; E2E 2/2.
- F4-015 completa: M6-06 «Ornamentos» explica y ejemplifica el trino, el
  mordente, el grupeto y la apoyatura con cuatro demos escritas nota por nota,
  además de su símbolo y su ejecución en el pulso. Usa ejemplos de dominio
  público (Bach y Mozart) y añade una tarea de teclado para tocar los cuatro
  adornos con metrónomo. Se añadió el tipo `ornament-execution`, que muestra la
  realización escrita y deriva la respuesta del adorno declarado, la habilidad
  `skill.ornament` (tipo `ornament`) y el feedback `ornament` en español e
  inglés. El validador exige un mínimo de notas por adorno y dos opciones.
  Publica doce ejercicios de ejecución, tres por adorno. Suite 157 archivos /
  1111 tests en verde, build y presupuesto de 221,91 kB gzip inicial; E2E 2/2.
- F4-016 completa: la armonización diatónica ya disponible en `src/theory/roman`
  queda verificada por `tests/theory-harmonization.test.ts`, que recorre las 12
  tónicas en mayor, menor natural y menor armónica. Comprueba que cada grado
  tenga la raíz y las notas de la escala con su grafía correcta, la cualidad
  esperada, el número romano con mayúscula/minúscula y símbolo, la función
  T/S/D y la coherencia entre `diatonicChord` y `diatonicChords`. Cubre 252
  acordes y los casos propios de cada modo (V mayor y vii° en menor armónica,
  v menor y VII mayor en menor natural). Suite 158 archivos / 1117 tests en
  verde, build y presupuesto de 221,91 kB gzip inicial; E2E 2/2.
- F4-017 completa: se añadió `src/exercises/generators/roman-numeral.ts`, que
  genera los dos sentidos del cifrado. En `chord-to-numeral` produce un
  ejercicio `roman-numeral` a partir de un grado real de la escala; en
  `numeral-to-chord` produce un ejercicio `chord` con `ask: 'symbol'` y las
  opciones en notación latina y americana alineadas. Recorre por defecto las 12
  tonalidades, los 2 sentidos y los 7 grados (168 combinaciones), acepta menor
  natural o armónica y toma los distractores de los demás grados de la misma
  tonalidad. El test comprueba las 12 tonalidades en ambos sentidos, las
  cualidades de la menor armónica, la cantidad de opciones según dificultad y
  el rechazo de tonalidades o grados inválidos. Suite 159 archivos / 1125 tests
  en verde, build y presupuesto de 221,91 kB gzip inicial; E2E 2/2.
- F4-018 completa: se añadió `src/exercises/generators/progression-completion.ts`,
  que genera ejercicios de completar progresiones a partir de un catálogo de
  patrones mayores (pop, cincuenta, jazz, cadencia clásica, giro y canon de
  Pachelbel) y menores naturales (andalusa, menor clásica, rueda menor y giro).
  El hueco se elige por posición y el prompt nombra el patrón y muestra `?`;
  las opciones son numerales diatónicos de la tonalidad y el generador descarta
  los que también completarían otro patrón con el mismo contexto. Recorre por
  defecto las 12 tonalidades mayores, los 7 patrones y todas las posiciones
  (372 combinaciones), acepta modo menor y ajusta 3/4/5 opciones según la
  dificultad. El audio vive en `src/exercises/progression-completion.ts`:
  reproduce la progresión completa, el contexto con el hueco en silencio y el
  acorde faltante aislado, y el reproductor añade el botón «Escuchar
  progresión». El validador exige que el hueco esté dentro de la progresión,
  que la respuesta esté entre las opciones y que las opciones sean distintas y
  numerales válidos. Suite 160 archivos / 1134 tests en verde, build y
  presupuesto de 222,08 kB gzip inicial; E2E 2/2.
- F4-019 completa: se añadió `src/exercises/generators/cadence.ts`, que genera
  los cuatro tipos de cadencia (auténtica V-I, plagal IV-I, semicadencia …-V y
  rota V-VI) en las 12 tonalidades mayores y menores. La dirección `identify`
  produce ejercicios `cadence` con los dos acordes descritos; la dirección
  `complete` produce ejercicios `progression-completion` con un grado oculto
  (la dominante en las semicadencias y el primer acorde en las conclusivas),
  opciones diatónicas y audio reutilizando el módulo de F4-018. En menor usa la
  escala armónica para que la auténtica tenga la dominante con sensible y la
  rota el VI mayor. Por defecto recorre 12 tonalidades × 4 tipos × 2 direcciones
  (96 ejercicios) y permite ampliar a ambos modos (192). El test comprueba las
  dos direcciones en todos los tipos y tonalidades, las cualidades armónicas de
  la menor, la alineación bilingüe de las opciones, el audio, la matriz y el
  rechazo de entradas inválidas. Suite 161 archivos / 1142 tests en verde,
  build y presupuesto de 222,08 kB gzip inicial; E2E 2/2.
- F4-020 completa: se añadieron `src/exercises/generators/secondary-dominant.ts`
  y `src/exercises/generators/borrowed-chord.ts`. El primero genera dominantes
  secundarios en las dos direcciones: `numeral` pide el cifrado V/x del grado
  que resuelve y `resolution` muestra el acorde con séptima y pide el grado de
  resolución. Cubre ii, iii, IV, V y vi en mayor y III, iv, v y VI en menor
  natural. El segundo toma del modo paralelo: bIII, iv, v, bVI y bVII en mayor
  y I, IV y vi en menor. Ambos trabajan en dificultad alta (5 opciones) y sus
  tests comprueban las 12 tonalidades, ambas direcciones, las respuestas
  canónicas y el rechazo de entradas inválidas. Suite 163 archivos / 1154 tests
  en verde, build y presupuesto de 222,08 kB gzip inicial; E2E 2/2.
- F4-021 completa: se añadió `src/exercises/generators/modulation.ts`, que
  genera ejercicios `pivot-chord` de modulación entre tonalidades vecinas del
  círculo de quintas (dominante y subdominante) en las doce tonalidades
  mayores. Elige al azar un acorde diatónico común como pivote, lo describe
  con nombre y notas, y pregunta su numeral en el origen o en el destino; la
  explicación nombra el numeral en las dos tonalidades y el V7 que confirma la
  modulación. Su test comprueba las dos relaciones en las 12 tonalidades, que
  el pivote conserve las notas, las respuestas canónicas, la matriz y el
  rechazo de entradas inválidas. Suite 164 archivos / 1160 tests en verde,
  build y presupuesto de 222,08 kB gzip inicial; E2E 2/2.
- F4-022 completa: se añadió `src/exercises/progression-playback.ts`, que encadena
  los grados de una progresión en un timeline donde cada voicing ocupa
  exactamente su hueco. En bloque el acorde suena entero 1,5 pulsos; los
  arpegios reparten ese hueco entre las notas en orden ascendente o
  descendente; en bajo + acorde el bajo se sostiene tres pulsos y el resto
  entra después sin repetir su MIDI, de modo que ninguna liberación corta a otra
  nota. La duración de la pasada incluye una pausa final de medio pulso y el
  motor la respeta al repetir (`PlayTimelineOptions.duration`), así el bucle no
  corta el último acorde. `ProgressionPlayer` aparece tras corregir los
  ejercicios `ear-progression` y `progression-completion`, con forma, tempo
  ajustable entre 40 y 240 BPM, bucle y acorde actual; no consume las
  repeticiones del dictado y se detiene al salir. Su test comprueba los cuatro
  voicings, el tempo, las doce tonalidades, el modo menor, la ausencia de MIDIs
  solapados y la pausa de bucle; el test del motor verifica la duración de
  pasada y el de UI los controles. Suite 165 archivos / 1168 tests en verde,
  build y presupuesto de 222,92 kB gzip inicial; E2E 2/2.
- F4-023 completa: se añadió `src/theory/voice-leading.ts`, un motor puro que
  empareja las voces de acordes consecutivos por posición (de grave a agudo) y
  detecta quintas y octavas paralelas cuando dos voces se mueven en la misma
  dirección y conservan un intervalo perfecto; las unísonos cuentan como
  octavas. `suggestVoicing` busca voicings alternativos de las mismas clases de
  altura dentro de un registro cercano, descarta unísonos y cruces, y elige el
  de menor movimiento que elimina las paralelas (puede fijar el bajo con
  `keepBass`). `analyzeVoiceLeading` encadena las correcciones de una
  progresión y devuelve los acordes modificados. El panel `VoiceLeadingPanel`
  muestra en el reproductor de progresiones las paralelas detectadas, con las
  voces numeradas desde la más grave, y la propuesta de corrección con notas.
  Su test cubre quintas, octavas y unísonos, movimiento contrario, oblicuo y
  similar permitido, cuatro voces, distinto número de voces, la corrección sin
  paralelas, el bajo fijado, las doce tonalidades y el modo menor. Suite 166
  archivos / 1179 tests en verde, build y presupuesto de 224,52 kB gzip inicial;
  E2E 2/2.
- F4-024 completa: se añadió `src/exercises/generators/form-analysis.ts`, que
  arma melodías originales de dos a quince compases para las cinco formas
  (binaria AB, ternaria ABA, período, rondó ABACA y sonata). Los motivos se
  escriben como grados de la escala mayor y se transponen a las doce
  tonalidades; las secciones que comparten material repiten sus notas y la
  recapitulación de la sonata retoma el tema y cierra en la tónica. El
  ejercicio pregunta la forma global o, en el período, la función de la frase
  1 (antecedente) o 2 (consecuente); las opciones usan las etiquetas canónicas
  del motor de respuestas y se mezclan de forma determinista según el ID, la
  tonalidad y la dificultad. La alternativa textual de la partitura la aporta
  el pentagrama accesible existente. El test comprueba las cinco formas en las
  doce tonalidades, la cobertura y el orden de las secciones, las notas
  diatónicas, las respuestas canónicas en español e inglés, el retorno del
  material A, las dos frases del período, la dificultad, la matriz de 84
  ejercicios, el determinismo y el rechazo de entradas inválidas. Suite 167
  archivos / 1186 tests en verde, build y presupuesto de 224,52 kB gzip inicial;
  E2E 2/2.
- F4-025 completa: se añadió `src/exercises/generators/ornament.ts`, que genera
  la realización escrita del trino, el mordente, el grupeto y la apoyatura en
  las doce tonalidades mayores. La nota principal y la vecina superior e
  inferior salen de la escala mayor, así que la armadura y las alteraciones
  quedan bien escritas (en Fa♯ mayor la vecina de Re♯ es Mi♯). La partitura de
  dos compases es ejecutable: el reproductor la dibuja y la toca, de modo que el
  alumno identifica el adorno y escucha su realización. Las etiquetas canónicas
  viven en `src/exercises/ornament-labels.ts` y las comparten el generador y
  `resolveExerciseAnswer`, para que la respuesta nunca se desalinee. El grado,
  la dirección de la apoyatura y el orden de las opciones se siembran de forma
  determinista con el ID, la tonalidad, el adorno y la dificultad. El test cubre
  las cuatro realizaciones en las doce tonalidades, la ortografía diatónica, el
  relleno exacto de los compases, las respuestas en español e inglés, las dos
  direcciones de la apoyatura, la dificultad, la matriz de 48 ejercicios, el
  determinismo, la reproducción y el rechazo de entradas inválidas. Suite 168
  archivos / 1193 tests en verde, build y presupuesto de 224,51 kB gzip inicial;
  E2E 2/2.
- F4-026 completa: se añadió la lección opcional `lesson.m5-10` «La napolitana»,
  con explicación de la subdominante rebajada, demo ♭II6–V–I en Do mayor, tarea
  de teclado y cuatro ejercicios opcionales. El modelo de contenido ganó el flag
  `optional` en lecciones y ejercicios, que se propaga al índice del curso. El
  mapa marca la lección como «Opcional» y el reproductor marca cada ejercicio,
  pero la ruta no la propone mientras quede una lección obligatoria disponible:
  `summarizeCourse` solo recurre a una opcional cuando el alumno ya la empezó o
  cuando no queda ninguna obligatoria. La napolitana se justifica con `bII` en
  Do mayor, La menor y Sol mayor, y el cuarto ejercicio pide las notas de Re♭
  mayor en primera inversión (Fa-La♭-Re♭). Suite 169 archivos / 1203 tests en
  verde, build y presupuesto de 224,88 kB gzip inicial; E2E 2/2.
- F4-027 completa: se añadió la lección opcional `lesson.m5-11` «Sextas
  aumentadas», con explicación del intervalo ♭VI–♯IV, las variantes italiana,
  francesa y alemana, demo en La menor y tarea de teclado. El nuevo tipo de
  ejercicio `augmented-sixth` guarda la variante, el modo de la pregunta
  (`identify` o `resolve`) y la partitura del acorde; el motor de respuestas usa
  etiquetas canónicas de `src/exercises/augmented-sixth.ts`. La corrección
  pedagógica tiene su propia regla «Recordá». Además, `scoreKeySignature` pasa
  la armadura en formato VexFlow (`Am`, `Cm`), de modo que las partituras en
  menor se dibujan con la armadura correcta; la demo muestra la alemana pasando
  por un 6/4 cadencial para evitar quintas paralelas. Suite 170 archivos / 1210
  tests en verde, build y presupuesto de 225,73 kB gzip inicial; E2E 2/2.
- F4-028 completa: se añadió `tests/m5-m6-integration.test.tsx`, que recorre las
  17 lecciones publicadas de M5-M6 —nueve obligatorias de M5, las dos opcionales
  M5-10 y M5-11 y las seis de M6— y verifica el orden del índice, la cadena de
  prerrequisitos, tres o más ejercicios bilingües por lección con su habilidad,
  una tarea de teclado con demo, la carga con `loadLesson`/`loadExercises` y el
  render de M5-01, M6-01 y M5-11. La prueba de navegación completa la ruta hasta
  M5-09 y comprueba que el mapa abre M5-01 y M6-01, marca las opcionales como
  «Disponible · Opcional» y propone M6-01 como siguiente paso sin exigirlas.
  Suite 171 archivos / 1219 tests en verde, build y presupuesto de 225,73 kB gzip
  inicial; E2E 2/2.
- F4-029 completa: se añadió `tests/theory-harmony-12-keys.test.ts`, que recorre
  las doce tonalidades con las que trabaja el curso y comprueba, desde el motor
  de teoría, los siete grados diatónicos en mayor, menor natural y menor
  armónica (cualidad, cifrado, función, símbolo y ortografía), la vuelta del
  numeral al acorde y el rechazo de los acordes cromáticos. Verifica además las
  cuatro cadencias con sus grados y cualidades —la semicadencia sale del ii en
  mayor y de la tónica en menor—, la sensible de la dominante en las doce
  tonalidades menores y los dominantes secundarios: raíz una quinta arriba del
  grado tonicizado, tercera como sensible y séptima que resuelve por grado
  conjunto. Las listas de doce tónicas de la teoría (con Do♯) y de los
  generadores (con Re♭) cubren las mismas doce clases de altura. Suite 172
  archivos / 1225 tests en verde, build y presupuesto de 225,73 kB gzip inicial;
  E2E 2/2.
- F4-030 completa: se añadió `tests/f4-030-progressions-cadences.test.ts`, que
  recorre las doce tonalidades en mayor y menor, todos los patrones del
  catálogo, todas las posiciones del hueco y las tres dificultades. Comprueba
  que la respuesta sea única entre las opciones, que todas sean numerales
  diatónicos, que ningún distractor complete otro patrón con el mismo contexto
  y que la resolución ES/EN coincida con el hueco. Para las cadencias verifica
  las cuatro opciones de identificación, la alineación bilingüe, la respuesta
  única al completar y que ningún otro numeral forme la misma cadencia; también
  que el audio reproduzca los acordes declarados y silencie el hueco. Documenta
  que la etiqueta común «Rota (V-vi)» se mantiene en menor aunque los grados
  reales sean V-VI, con los ejercicios mostrando esos grados correctos. Suite
  173 archivos / 1231 tests en verde, build y presupuesto de 225,73 kB gzip
  inicial; E2E 2/2.
- F4-031 completa: se añadió `e2e/m5-m6-lesson-review.spec.ts`, con dos
  recorridos de navegador. El de M5 desbloquea «Progresiones comunes» marcando
  su prerrequisito en IndexedDB, completa la lección, verifica que las dos
  habilidades nuevas entran en la cola del repaso, las califica y, tras
  recargar, responde la progresión I-V-?-IV: comprueba «¡Correcto!», la
  explicación, el botón de audio y el reproductor de progresiones. El de M6
  hace lo mismo con «Motivo y frase» y «Modulación y conducción de voces», y
  falla el análisis de motivos para leer «Todavía no.», la respuesta correcta,
  el «Recordá qué es un motivo y qué es una frase» y la explicación. En ambos,
  la pantalla de progreso muestra tres respuestas registradas (dos repasos más
  el intento del ejercicio) y conserva el dato tras una recarga. Suite 173
  archivos / 1231 tests en verde, build y presupuesto de 225,73 kB gzip
  inicial; E2E 4/4.
- F4-032 completa: se añadieron `tests/analysis-a11y.test.tsx` y dos bloques en
  `tests/theme.test.ts`. El primer archivo recorre los seis tipos de análisis
  publicados —motivos, forma, textura, contrapunto, adornos y sextas
  aumentadas— y comprueba que la partitura tenga leyenda visible y descripción
  accesible de sus notas, que el grupo de opciones y el botón de escucha tengan
  nombre, que la corrección aparezca como texto en una región viva con la
  respuesta correcta, la explicación y el «Recordá», y que axe no reporte
  violaciones críticas o serias antes ni después de corregir. El séptimo test
  responde un análisis de motivos solo con el teclado: foco, Enter para
  escuchar, espacio para marcar el radio y Enter para corregir. Los bloques de
  tema comprueban que la descripción del pentagrama y el «Recordá» usan la
  paleta AA y que la corrección no depende solo del color. Suite 174 archivos
  / 1241 tests en verde, build y presupuesto de 225,73 kB gzip inicial;
  E2E 4/4.
- F4-033 completa: cierre de la fase. Se verificó que M5-M6 publican 17
  lecciones (11 de M5 y 6 de M6) y 188 ejercicios, todas con tarea de teclado,
  habilidades consistentes e índice al día, y que las opcionales M5-10 y M5-11
  no bloquean M6. `npm run estado` quedó verde (typecheck 1,2 s, 174 archivos /
  1241 tests en 42,1 s y build en 2,9 s), E2E 4/4, presupuesto de 225,73 kB
  gzip inicial con 621 chunks diferidos y `validate:content` con 9 módulos, 64
  lecciones, 543 ejercicios y 50 habilidades. La aceptación de F4 decía «15
  lecciones»; el bloque real tiene 17 por las opcionales y la prueba cubre las
  17. Se añadió el resumen de la fase a `CHANGELOG.md` y el tag local `fase-4`.
- F5-001 completa: M7-01 «Independencia de manos» publicada con dos demos de
  dos manos, tarea de teclado a 60 BPM con consignas de soltura y parada ante
  dolor o tensión, y 12 ejercicios originales de tipo `hand-coordination`
  (progresión 3× dificultad 1, 5× dificultad 2 y 4× dificultad 3; respuestas
  repartidas 4 derecha / 4 izquierda / 4 ambas). Se añadieron
  `attackingHandAt` y `scoreForHand` en `src/content/score.ts`, la habilidad
  `skill.hand-independence`, feedback bilingüe y renderizado de dos pentagramas
  con audio. Las partituras quedan en Do4–La5, con ambas manos presentes y sin
  estiramientos. Suite 175 archivos / 1250 tests en verde, build y presupuesto
  de 227,01 kB gzip inicial con 634 chunks diferidos; `validate:content` da 9
  módulos, 65 lecciones, 555 ejercicios y 51 habilidades. Limitación: los dos
  pentagramas son dos claves de sol apiladas hasta el pentagrama grande de
  F5-022; la tensión se autoevalúa de forma guiada.
- F5-002 completa: M7-02 «Arpegios y acordes quebrados» publicada con tres
  demos con audio (arpegio de Do, acorde quebrado Do-Mi-Sol-Mi y arpegio de dos
  octavas), tarea de teclado con tempo progresivo 60-72-84 BPM y 12 ejercicios
  de tipo `arpeggio`, uno por tonalidad mayor básica (Do, Sol, Re, La, Mi, Si,
  Fa, Si♭, Mi♭, La♭, Re♭ y Sol♭). Ocho preguntan la digitación y cuatro el orden
  de las notas, con progresión 3× dificultad 1, 5× dificultad 2 y 4× dificultad
  3; el ejercicio `ex.m7-02.m` practica la estabilidad de tempo. Se añadieron
  `src/exercises/arpeggio.ts` (digitación 1-2-3-5 / 2-1-2-4, espejo de la
  izquierda, partitura y nombres de notas), feedback bilingüe
  `arpeggio-fingering`, la habilidad `skill.arpeggio` y el renderizado del
  pentagrama con audio en `ExercisePlayer`. Suite 176 archivos / 1261 tests en
  verde, build y presupuesto de 228,41 kB gzip inicial con 648 chunks
  diferidos; `validate:content` da 9 módulos, 66 lecciones, 568 ejercicios y 52
  habilidades. Limitación: los ejercicios publicados usan solo la mano derecha;
  la izquierda se explica en el texto y la tarea, y la escucha de los cruces de
  pulgar sigue pendiente en hardware con salida de audio.
- F5-003 completa: M7-03 «Pedal» publicada con tres demos con audio (pedal
  directo en Do–Fa–Sol–Do, pedal sincopado y cambio tardío para escuchar el
  barro), tarea de teclado a 60 BPM y 10 ejercicios de tipo `pedal`: 6 de acción
  (pisar, levantar o cambiar) y 4 de patrón (directo o sincopado), con
  progresión 3× dificultad 1, 4× dificultad 2 y 3× dificultad 3. Se añadieron
  `PedalMarkSchema` y `Score.pedals`, la resonancia de las notas en
  `scoreToTimeline`, las anotaciones «Ped.»/«*» del pentagrama, el resolver
  `src/exercises/pedal.ts`, el feedback bilingüe `pedal` y la habilidad
  `skill.pedal`. La lección incluye ejercicios de limpieza y una advertencia de
  oído: estudiar sin pedal, corregir el pie y no tocar más fuerte para tapar el
  barro. Suite 177 archivos / 1273 tests en verde, build y presupuesto de 230,27
  kB gzip inicial con 659 chunks diferidos; `validate:content` da 9 módulos, 67
  lecciones, 578 ejercicios y 53 habilidades. Limitación: la resonancia se
  simula alargando las notas hasta el cambio de pedal y no modela la resonancia
  simpática del piano acústico ni los pedales parciales.
- F5-004 completa: M7-04 «Acompañamiento en bloque» publicada con cuatro demos
  con audio (acordes redondos, acordes en negras, bajo y acorde, y un lead sheet
  en Do de ocho compases), tarea de teclado a 60 BPM y 10 ejercicios de tipo
  `accompaniment`: 5 de patrón (redondas, blancas, negras o bajo y acorde) y 5 de
  cifrado (Am, F, C, Dm y G7), con progresión 3× dificultad 1, 4× dificultad 2 y
  3× dificultad 3 y tres opciones paralelas en español e inglés. Se añadieron
  `chordSymbol` al esquema de notación y a `scoreToMeasures`, el renderizado de
  cifrados con `VF.ChordSymbol`, el resolver `src/exercises/accompaniment.ts`, el
  feedback bilingüe `accompaniment` y la habilidad `skill.accompaniment`. La
  lección explica las figuras, los patrones, la conducción de la mano izquierda,
  la lectura del lead sheet y el cuidado ante dolor o tensión. Suite 178 archivos
  / 1284 tests en verde, build y presupuesto de 231,59 kB gzip inicial con 670
  chunks diferidos; `validate:content` da 9 módulos, 68 lecciones, 588
  ejercicios y 54 habilidades. Limitación: el patrón se deduce de la figura y
  del número de notas, el cifrado no genera el voicing y la evaluación del bloque
  sigue siendo autoevaluación guiada.
- F5-005 completa: M7-05 «Acompañamiento arpegiado» publicada con tres demos
  con audio (patrón de 3 notas en Do, patrón de 4 notas en Do y progresión
  Do–Fa–Sol–Do arpegiada), tarea de teclado a 60 BPM con metrónomo y subida a
  66/72 solo si el pulso queda estable, y 12 ejercicios de tipo `arpeggiated`,
  uno por tonalidad mayor: 6 preguntan si el patrón tiene 3 o 4 notas y 6 el
  orden exacto de las notas, con 6 patrones de 3 notas en 3/4, 6 de 4 notas en
  4/4 y dificultad 3/4/5. Se añadieron `src/exercises/arpeggiated.ts` (detección
  del patrón por figura, pulsos y numerador, y nombres de las notas), el
  feedback bilingüe `arpeggiated`, la habilidad
  `skill.arpeggiated-accompaniment` y el renderizado de pentagrama con audio en
  `ExercisePlayer`. Suite 179 archivos / 1294 tests en verde, build y
  presupuesto de 232,70 kB gzip inicial con 683 chunks diferidos;
  `validate:content` da 9 módulos, 69 lecciones, 600 ejercicios y 55
  habilidades. Limitación: el patrón se reconoce por cantidad de notas sueltas
  y métrica, no por la variante melódica; la igualdad y el tempo se autoevalúan
  con metrónomo y escucha.
- F5-006 completa: M7-06 «Alberti» publicada con tres demos con audio (Alberti
  clásico en Do, Alberti sobre Do–Fa–Sol–Do y el ejemplo original «Estudio en
  Do» a dos manos) y 12 ejercicios de tipo `alberti`, uno por tonalidad mayor:
  6 preguntan qué patrón hay en el compás y 6 el orden de la célula de cuatro
  notas, todos en 4/4 con ocho corcheas y dificultad 3/4/5. Se añadieron
  `src/exercises/alberti.ts` (detección de ocho corcheas en 4/4, pulsos
  consecutivos y célula 1-5-3-5 repetida exactamente), el feedback bilingüe
  `alberti`, la habilidad `skill.alberti`, el renderizado de pentagrama con
  audio en `ExercisePlayer` y el límite de cuatro notas en
  `arpeggiatedNoteNames`. La tarea pide 60 BPM con manos separadas, unión por
  compás y subida a 66/72 solo si el pulso queda estable, con parada ante dolor,
  tensión o cansancio. Suite 180 archivos / 1304 tests en verde, build y
  presupuesto de 233,76 kB gzip inicial con 696 chunks diferidos;
  `validate:content` da 9 módulos, 70 lecciones, 612 ejercicios y 56
  habilidades. Limitación: la detección exige la célula de cuatro notas repetida
  dos veces en 4/4 y no reconoce variantes de cinco o seis notas; la lectura del
  estudio es secuencial en un pentagrama y la coordinación se autoevalúa.
- F5-007 completa: M7-07 «Walking bass» publicada con tres demos con audio
  (walking sobre Do–La–Re–Sol, blues de 12 compases y el ejemplo original
  «Caminata en Do» a dos manos) y 12 ejercicios de tipo `walking-bass`, uno por
  tonalidad mayor: 6 preguntan qué nota suena en un pulso y 6 si esa nota es
  del acorde o de paso, todos en 4/4 con cuatro negras por compás y dificultad
  1/2/3/4. Se añadieron `src/exercises/walking.ts` (lectura de la nota del pulso
  y clasificación con el cifrado del compás), el feedback bilingüe
  `walking-bass`, la habilidad `skill.walking-bass` y el renderizado de
  pentagrama con audio en `ExercisePlayer`. La tarea pide 60 BPM con mano
  izquierda sola, unión por compás, balanceo del swing en 2 y 4 y subida a
  66/72 solo si el pulso queda estable, con parada ante dolor, tensión o
  cansancio. Suite 181 archivos / 1314 tests en verde, build y presupuesto de
  235,10 kB gzip inicial con 709 chunks diferidos; `validate:content` da 9
  módulos, 71 lecciones, 624 ejercicios y 57 habilidades. Limitación: el papel
  de la nota se decide solo por pertenencia al cifrado del compás, sin analizar
  la conducción al compás siguiente ni distinguir notas de paso diatónicas de
  cromáticas; la lectura del estudio es secuencial y el swing se autoevalúa.
- F5-008 completa: M7-08 «Stride» publicada con tres demos con audio (stride
  básico en Do, stride sobre Do–La–Re–Sol y el ejemplo original «Stride en Do»
  a dos manos a 50 BPM) y 12 ejercicios de tipo `stride`, uno por tonalidad
  mayor: 6 preguntan qué patrón hay en el compás y 6 la nota del bajo en un
  pulso, todos en 4/4 con bajo en los pulsos 1 y 3, acorde en 2 y 4 y
  dificultad 1/2/3/4. Se añadieron `src/exercises/stride.ts` (detección de
  cuatro negras con bajo suelto debajo del acorde y lectura de la nota del
  bajo), el feedback bilingüe `stride`, la habilidad `skill.stride` y el
  renderizado de pentagrama con audio en `ExercisePlayer`. La tarea pide 50 BPM
  con mano izquierda sola, pedal seco, unión por compás y subida a 60/66 solo si
  el salto queda seguro, con parada ante dolor, tensión o cansancio. Suite 182
  archivos / 1324 tests en verde, build y presupuesto de 236,24 kB gzip inicial
  con 722 chunks diferidos; `validate:content` da 9 módulos, 72 lecciones, 636
  ejercicios y 58 habilidades. Limitación: el patrón se reconoce por métrica,
  pulsos y separación de registros, sin distinguir variantes de bajo ni
  voicings; la lectura del estudio es secuencial y el salto se autoevalúa.
- F5-009 completa: M7-09 «Lectura a primera vista» publicada con tres demos con
  audio (lectura por grados conjuntos, lectura con saltos en clave de fa y el
  ejemplo original «Lectura en Do» a 50 BPM) y 12 ejercicios de tipo
  `sight-reading`, uno por tonalidad mayor: 4 preguntan el intervalo entre dos
  notas, 4 una nota a partir de la nota ancla y 4 el movimiento melódico, en
  clave de sol y de fa, con dificultad 1/2/3/4 y opciones paralelas ES/EN. Se
  añadieron `src/exercises/sight-reading.ts` (construcción de fragmentos por
  grados de la escala, lectura de intervalos, movimiento y nombres de nota) y
  `src/exercises/generators/sight-reading.ts` (patrones graduados, límites de
  salto por nivel, generación de tandas por tonalidad/clave/pregunta y
  validación con `ExerciseSchema`), además del feedback bilingüe
  `sight-reading`, la habilidad `skill.sight-reading` y el renderizado de
  pentagrama con audio en `ExercisePlayer`. La tarea pide 50 BPM con
  exploración de treinta segundos, notas ancla, lectura por intervalos, tres
  pasadas y subida a 60/72 solo si la lectura queda continua, con parada ante
  dolor, tensión o cansancio. Suite 184 archivos / 1341 tests en verde, build y
  presupuesto de 237,97 kB gzip inicial con 735 chunks diferidos;
  `validate:content` da 9 módulos, 73 lecciones, 648 ejercicios y 59
  habilidades. Limitación: los fragmentos son monódicos y diatónicos en la
  escala mayor; la lectura de las dos claves se practica por separado y la
  continuidad sin parar se autoevalúa.
- F6 completa: PWA instalable (manifest, iconos, service worker con precache
  del shell, caché de muestras y banner de actualización/offline), MIDI opcional
  (detección de Web MIDI, entrada note on/off, tempo y ritmo, feedback objetivo
  por nota y normalización de dispositivos como Yamaha PSR-373), accesibilidad
  (axe en rutas principales, repertorio y pieza; enlace de salto; alternativas
  textuales; movimiento reducido), rendimiento (JS inicial 255,44 kB gzip, CLS
  0,026 en móvil, Lighthouse 99/100) y licencias (inventario de 551 paquetes,
  atribuciones visibles de Salamander, Tone.js y VexFlow).
- F6 publicada: las 30 muestras MP3 (~2 MB) se versionan en
  `public/audio/samples/` con SHA-256 verificado; la demo
  <https://wulflo.github.io/piano-learning/> responde 200 y su smoke live cubre
  rutas, repertorio, audio real, export/import y offline sin errores de consola
  ni respuestas 4xx. Tags y releases `fase-0` a `fase-6` publicados.
- Cierre de F6: `npm run estado` verde con 235 archivos / 1635 tests; tag
  `fase-6` sobre el commit de cierre. F6-028 (iOS) y F6-029 (Android) quedan
  descartadas por falta de dispositivos físicos y registradas como limitación
  conocida; el QA de navegadores cubre Chromium y Firefox, y WebKit/Safari no
  arranca en este host por bibliotecas faltantes (`docs/QA-NAVEGADORES.md`).
- Tags: `fase-0` a `fase-6`, anotados y publicados en `origin` con releases enlazadas al CHANGELOG.
- Resumen generado: `docs/ESTADO.md` (no editar a mano).
- Lo que funciona: motor de teoría completo, teclado interactivo de 3 octavas,
  audio con muestras Salamander y fallback sintetizado, metrónomo, pentagrama
  VexFlow accesible, demo integrada bilingüe y error boundary.
- Aviso de aprender sin profesor: visible en todas las lecciones de M0 y en
  ajustes, con consejos de espejo y grabación; no abre modales ni bloquea el
  flujo.
- Limitación conocida: F1-038 se revisó por código y tests, pero la escucha real
  de latencia/volumen queda pendiente en una máquina con salida de audio.
- Validación del contenido: el build falla si una lección publicada no tiene
  tarea de teclado o si un ejercicio no lo referencia ninguna lección; las 47
  lecciones publicadas de M0-M4 están cubiertas por tests.
- Ejercicios M0-M2: property tests sobre las 12 tónicas, 16 modos, 132 pares
  de transposición y las 15 armaduras mayores y menores, con ortografía,
  respuestas y distractores verificados.
- F2-072a completa: reproductor de ejercicios con opciones o respuesta escrita,
  corrección canónica, explicación, regla «Recordá» al fallar, registro del
  intento como repaso FSRS y navegación siguiente/volver. Los errores de
  ortografía y explicación de 20 ejercicios de M1-M2 que detectaron los tests
  de respuesta canónica quedaron corregidos. FSRS se carga de forma diferida.
- F2-072 completa: E2E con Playwright (`npm run test:e2e`) que recorre
  lección→ejercicio→repaso y verifica la persistencia tras recargar.
- F2-073 completa: fase cerrada con `npm run estado` verde (typecheck, 110
  archivos / 788 tests y build), export/import ya probado por sus tests, tag
  local `fase-2`, RESUME y `CHANGELOG.md` actualizados.
- F2-075 completa: las 30 lecciones y 150 ejercicios de M0-M2 tienen campos en
  inglés (`titleEn`, `summaryEn`, `objectivesEn`, cuerpos, tareas, glosarios,
  `promptEn`, `explanationEn`, `choicesEn`), la UI del curso, la lección, la
  tarea y el reproductor de ejercicios cambian de idioma en caliente, y el
  feedback «Recordá» tiene versión inglesa. `validate:content` exige el inglés
  de todo contenido publicado o referenciado; tests de paridad y de cambio de
  idioma cubren el contenido real.
- Lo que todavía no existe: evaluación de logros al guardar actividad y PWA
  (F6). La persistencia, FSRS, el plan de práctica diario, el reproductor de
  ejercicios, el E2E, el cierre de F2 y el contenido bilingüe ya existen.
- Pentagramas sin recortes: `renderStaff` y `renderGrandStaff` pasan la clave a
  cada `StaveNote` y calculan la altura necesaria midiendo la extensión vertical
  (`src/staff/layout.ts`); las notas muy graves o agudas ya no se cortan y el
  gran pentagrama reserva 224 px por sistema como mínimo.
- Canciones propias (`#/canciones`): grabador MIDI con cuantización por rejilla,
  separación de manos y acordes, biblioteca en la base Dexie independiente
  `pianodesdecero.songs`, reproductor con gran pentagrama y exportación e
  importación JSON (`pdc.songs`). El editor visual completo de notas queda para
  una fase posterior.

## Primer paso de cualquier sesión

1. Leer `docs/RESUME.md`, `docs/GUIA-CAMBIOS.md`, `docs/CHECKLIST.md`, las
   últimas 50 líneas de `docs/LOG.md` y `docs/DECISIONES.md`.
2. Ejecutar `npm run estado`.
3. Revisar `git status` y `git log -5`.
4. Si hay cambios sin commitear de una sesión cortada, revisarlos, completarlos
   o descartarlos con criterio, y anotarlo en `docs/LOG.md`.
5. Reanudar desde el `PUNTO DE REANUDACIÓN`.

## Comandos exactos

```bash
npm ci                              # instalación reproducible
npm run dev                         # servidor de desarrollo
npm run typecheck                   # TypeScript estricto
npm test                            # Vitest
npm run test:e2e                    # Playwright (compila y sirve dist/)
npm run validate:content            # esquemas + licencias
npm run build                       # valida, typechequea y compila
npm run budget                      # build + presupuesto de bundle
npm run preview                     # sirve dist/
npm run estado                      # estado + verificaciones + docs/ESTADO.md
node scripts/fetch-samples.mjs --dry-run   # valida manifiesto sin red
node scripts/fetch-samples.mjs             # descarga/reanuda muestras (idempotente)
```

En esta máquina: Node 26.13.0, npm 12.2.2, git 2.56.0. El proyecto declara
`engines.node >= 22.12.0`.

### Si npm bloquea scripts de instalación

```bash
npm install-scripts approve esbuild
npm rebuild esbuild
```

## Cómo leer el checklist

- `[ ]` pendiente, `[~]` en curso, `[x]` hecha, `[!]` rota/bloqueada,
  `[-]` descartada.
- Cada tarea tiene ID estable (`F2-014`), criterio de aceptación, dependencias y
  marca `[NET]` si necesita internet.
- Toda `[x]` incluye `Commit: <hash>`.
- El `PUNTO DE REANUDACIÓN` indica la tarea actual y la última verificada; el
  test `tests/checklist-format.test.ts` lo valida.
- `docs/ESTADO.md` se regenera con `npm run estado`.

## Reglas de trabajo (resumen)

1. Antes de empezar: marcar `[~]` con fecha/hora, actualizar el PUNTO y commitear.
2. Escribir archivos completos; el repositorio debe compilar entre commits.
3. Al terminar: typecheck + tests + build. Solo si pasa, marcar `[x]` con el hash.
4. Un commit atómico por tarea, mensaje con el ID.
5. Si falla dos veces: `[!]`, error literal en `docs/LOG.md`, hipótesis, próximo
   paso, commit y pasar a otra tarea o detenerse.
6. Sin red: continuar con tareas sin `[NET]`; nunca depender de red en runtime.
7. Al cerrar fase: suite completa, tag `fase-N`, RESUME actualizado, resumen.
8. Remoto `origin` y push a `main`: **autorizados** (la demo de Pages se
   actualiza sola). Los tags y releases remotos se autorizaron para el cierre de
   F6; en fases futuras requieren una nueva autorización explícita.

## Mapa de archivos

```text
docs/GUIA-CAMBIOS.md   ciclo obligatorio para cualquier cambio
docs/CHECKLIST.md      fuente de verdad (284 tareas)
docs/RESUME.md         este archivo
docs/LOG.md            bitácora (solo agregar al final)
docs/DECISIONES.md     ADRs
docs/ENTORNO.md        versiones, licencias, red y assets
docs/ESTADO.md         generado por el script
src/theory/            motor de teoría autoritativo (pitch, escalas, acordes...)
src/keyboard/          layout de 3 octavas, mapeo de teclado y notación
src/audio/             AudioEngine, adaptador Tone, sampler y timelines
src/staff/             VexFlow, render y alternativa textual
src/components/        Demo, Keyboard, Staff, Settings y ErrorBoundary
src/state/             ajustes globales, i18n y persistencia local
src/schemas/           esquemas Zod de contenido, licencias, progreso y audio
src/content/validate.ts  validación cruzada del contenido
content/               módulos, lecciones, ejercicios, habilidades y repertorio
scripts/estado.mjs     estado sin dependencias
scripts/validate-content.ts  gate de contenido
scripts/lib/load-content.ts  carga desde disco
tests/                 unitarios, formato del checklist y fixtures
assets/audio/manifest.json   manifiesto de 30 muestras con bytes y SHA-256
public/audio/samples/        muestras versionadas (30 MP3, ~2 MB)
scripts/check-bundle.mjs     presupuesto de JS inicial y code splitting
```

## Trampas conocidas

- `npm run build` incluye `validate:content`; un contenido inválido rompe el build
  a propósito.
- npm 12 bloquea el `postinstall` de esbuild; ver comandos arriba.
- En tests, `import.meta.url` no es una URL de archivo confiable bajo jsdom: usar
  `process.cwd()` para leer fixtures.
- `VITE_BASE` define el base de Vite; en Pages será `/<nombre-del-repo>/`.
- No copiar texto de libros con licencias incompatibles; las lecciones son
  originales y las piezas se transcriben a datos propios.
- VexFlow mide texto con canvas: `tests/setup.ts` stubbea `getContext` para jsdom.
- Tone.js y VexFlow son imports dinámicos; no los importes estáticamente desde
  `App` o se rompe el presupuesto de bundle.
- El sampler solo se usa si el manifiesto tiene muestras; sin red o sin archivos
  cae a `PolySynth` y la UI debe informarlo.

## Prompt de reanudación listo para pegar

```text
Continuás el proyecto PianoDesdeCero en /home/alonso/Documentos/Repositorios/piano-learning.
Es una app web estática (Vite + React + TypeScript) para aprender teoría musical y
piano desde cero, local-first, sin backend ni cuentas, con demo publicada en GitHub
Pages.

Antes de tocar código:
1. Leé docs/RESUME.md, docs/GUIA-CAMBIOS.md, docs/CHECKLIST.md, las últimas 50
   líneas de docs/LOG.md y docs/DECISIONES.md.
2. Corré `npm run estado`, `git status` y `git log -5`.
3. Revisá el PUNTO DE REANUDACIÓN y docs/ESTADO.md.
4. Si hay cambios sin commitear, revisalos, completalos o descartalos con criterio y
   anotá la decisión en docs/LOG.md.

Después continuá desde la tarea actual del checklist, respetando el protocolo:
- git con remoto `origin`; push a `main` autorizado y Pages activo. Los tags y
  releases remotos del cierre de F6 están autorizados; para fases futuras pedí
  autorización explícita.
- El workflow `.github/workflows/deploy-pages.yml` corre typecheck + tests + build
  y publica `dist/` con `VITE_BASE=/<repo>/`.
- Un commit atómico por tarea con el ID en el mensaje.
- Marcá [~] antes de empezar y [x] con el hash cuando typecheck + tests + build pasen.
- No dependas de la red en runtime. Las tareas [NET] se identifican en el checklist.
- Documentación en español; código y nombres técnicos en inglés cuando sea natural.
- Si algo falla dos veces, marcalo [!], registrá el error literal en docs/LOG.md y seguí
  con una tarea independiente o detenete explicando qué falta.

Empezá leyendo los archivos y mostrando el estado antes de escribir código.
```
