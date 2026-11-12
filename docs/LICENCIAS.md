# LICENCIAS — Verificación de dominio público del repertorio

Este documento registra la verificación de las piezas candidatas de F5 (tareas
F5-026 a F5-036 y F5-040). Las trece piezas que ya están publicadas son obras
originales CC0 de Piano Today y tienen su ficha en `content/repertoire/`.

## Criterio

Se aplica el criterio conservador de **ADR-011**:

- La obra es de **dominio público** si el compositor murió hace **más de 100
  años** (no 100 exactos), o si es una **melodía tradicional anónima** antigua.
- La **transcripción, el arreglo y la digitación** son siempre propios. No se
  copian ediciones modernas, métodos comerciales ni arreglos de terceros.
- Cada ficha debe incluir **compositor, fechas, fuente consultada, fecha de
  verificación, licencia, transcriptor y atribución visible**.

Para 2026, el límite conservador deja fuera a compositores fallecidos después
de 1925. Todas las obras verificadas aquí quedan muy por debajo de ese límite.

## Método y fecha

- **Fecha de verificación:** 2026-11-13.
- **Fuentes principales:** IMSLP (partituras y datos de publicación),
  Wikipedia (historia y atribución), Hymnary.org (melodía «New Britain»).
- **Qué se comprobó:** existencia de la obra, compositor y fechas, primera
  publicación conocida, estatus de dominio público y ausencia de arreglos
  modernos en la fuente elegida.
- **Registro machine-readable:** `src/repertoire/public-domain.ts`.
- **Prueba automática:** `tests/public-domain.test.ts`.

## Obras con compositor identificado

| Tarea | Obra | Compositor | Nacimiento | Muerte | Años al 2026 | Primera publicación | Fuente consultada |
|---|---|---|---|---|---|---|---|
| F5-031 | Oda a la alegría (tema de la Sinfonía n.º 9) | Ludwig van Beethoven | 1770 | 1827 | 199 | 1824 | [IMSLP: Symphony No.9, Op.125](https://imslp.org/wiki/Symphony_No.9%2C_Op.125_(Beethoven%2C_Ludwig_van)) |
| F5-032 | Minueto en Sol mayor, BWV Anh. 114 | Christian Petzold | 1677 | 1733 | 293 | 1725 | [IMSLP: Minuet in G major, BWV Anh.114](https://imslp.org/wiki/Minuet_in_G_major%2C_BWV_Anh.114_(Petzold%2C_Christian)) |
| F5-033 | Soldatenmarsch (Marcha de los soldados) | Robert Schumann | 1810 | 1856 | 170 | 1848 | [IMSLP: Album für die Jugend, Op.68](https://imslp.org/wiki/Album_f%C3%BCr_die_Jugend%2C_Op.68_(Schumann%2C_Robert)) |
| F5-034 | Sonatina Op. 36 n.º 1, primer movimiento (fragmento) | Muzio Clementi | 1752 | 1832 | 194 | 1797 | [IMSLP: 6 Piano Sonatinas, Op.36](https://imslp.org/wiki/6_Piano_Sonatinas%2C_Op.36_(Clementi%2C_Muzio)) |
| F5-035 | Arabesque, Op. 100 n.º 2 | Friedrich Burgmüller | 1806 | 1874 | 152 | 1852 | [IMSLP: 25 Études faciles et progressives, Op.100](https://imslp.org/wiki/25_%C3%89tudes_faciles_et_progressives%2C_Op.100_(Burgm%C3%BCller%2C_Friedrich)) |
| F5-036 | Preludio Op. 28 n.º 4 (versión simplificada propia) | Frédéric Chopin | 1810 | 1849 | 177 | 1839 | [IMSLP: Preludes, Op.28](https://imslp.org/wiki/Preludes%2C_Op.28_(Chopin%2C_Fr%C3%A9d%C3%A9ric)) |
| F5-040 | Ejercicio 1 de El pianista virtuoso | Charles-Louis Hanon | 1819 | 1900 | 126 | 1873 | [IMSLP: The Virtuoso Pianist](https://imslp.org/wiki/The_Virtuoso_Pianist_(Hanon%2C_Charles-Louis)) |
| F5-040 | Ejercicio de Erster Wiener Lehrmeister, Op. 599 | Carl Czerny | 1791 | 1857 | 169 | 1840 | [IMSLP: Erster Wiener Lehrmeister, Op.599](https://imslp.org/wiki/Erster_Wiener_Lehrmeister_im_Pianoforte-Spiel%2C_Op.599_(Czerny%2C_Carl)) |

## Melodías tradicionales anónimas

| Tarea | Obra | Origen | Primera publicación | Fuente consultada |
|---|---|---|---|---|
| F5-026 | Twinkle, Twinkle, Little Star | Melodía francesa «Ah! vous dirai-je, maman» | 1761 | [Wikipedia: Ah! vous dirai-je, maman](https://en.wikipedia.org/wiki/Ah!_vous_dirai-je,_maman); [IMSLP: variaciones de Mozart K.265](https://imslp.org/wiki/12_Variations_on_%27Ah%2C_vous_dirai-je_maman%27%2C_K.265%2F300e_(Mozart%2C_Wolfgang_Amadeus)) |
| F5-027 | Frère Jacques | Ronda infantil francesa | c. 1780 | [Wikipedia: Frère Jacques](https://en.wikipedia.org/wiki/Fr%C3%A8re_Jacques); [IMSLP: Frère Jacques, Op.389 (Battmann)](https://imslp.org/wiki/Fr%C3%A8re_Jacques%2C_Op.389_(Battmann%2C_Jacques-Louis)) |
| F5-028 | Greensleeves | Balada inglesa | 1580 | [Wikipedia: Greensleeves](https://en.wikipedia.org/wiki/Greensleeves); [IMSLP: Greensleeves to a Ground](https://imslp.org/wiki/Greensleeves_to_a_Ground_(Anonymous)) |
| F5-029 | Auld Lang Syne | Canción escocesa | 1799 | [Wikipedia: Auld Lang Syne](https://en.wikipedia.org/wiki/Auld_Lang_Syne); [IMSLP: Auld lang syne (Folk Songs, Scottish)](https://imslp.org/wiki/Auld_lang_syne_(Folk_Songs%2C_Scottish)) |
| F5-030 | Amazing Grace | Himno «New Britain» (tradición estadounidense) | 1829 | [Hymnary.org: NEW BRITAIN](https://hymnary.org/tune/new_britain); [Wikipedia: Amazing Grace](https://en.wikipedia.org/wiki/Amazing_Grace) |

En las cinco melodías se usa **solo la melodía**, sin letra. La letra de
«Auld Lang Syne» es de Robert Burns (1759-1796) y la de «Amazing Grace» de John
Newton (1725-1807); ambas también son de dominio público, pero no forman parte
de la transcripción.

## Correcciones y dudas registradas

1. **«Arabesque» es Op. 100 n.º 2, no n.º 1.** La tarea F5-035 dice «Op. 100
   N.º 1», pero el n.º 1 de la colección es *La candeur* y *Arabesque* es el
   n.º 2. Se transcribirá el n.º 2, que es la pieza conocida con ese nombre.
2. **El Minueto BWV Anh. 114 es de Christian Petzold, no de Bach.** Se usó
   durante décadas la atribución a J. S. Bach; la ficha y la app deben decir
   «Petzold (atribuido a Bach)». La fuente es el cuaderno de Anna Magdalena
   Bach de 1725, no una edición moderna.
3. **La edición Bärenreiter de 1957 no se usa.** Aunque la obra es de dominio
   público, esa edición concreta incorpora trabajo editorial. La transcripción
   parte del cuaderno de 1725.
4. **«Greensleeves»: se descarta la Fantasía de Vaughan Williams (1934).** Es
   una obra del siglo XX con derechos. Solo se usa la melodía tradicional
   inglesa.
5. **«Amazing Grace»: se descartan las armonizaciones modernas.** Se usa la
   melodía «New Britain» de 1829, sin letra ni arreglos recientes.
6. **«Twinkle, Twinkle, Little Star»: no se usan las variaciones de Mozart.**
   La melodía tradicional se publicó en 1761; las variaciones K.265 son de
   Mozart y también son de dominio público, pero no son la fuente de la
   transcripción.
7. **«Frère Jacques»: la atribución a Rameau es discutida.** Se trata como
   melodía tradicional anónima; no se atribuye a Rameau en la ficha.
8. **«Auld Lang Syne»: la melodía es tradicional; la letra es de Burns.** Se
   usa solo la melodía y no se copia ninguna armonización coral moderna.
9. **Hanon y Czerny: se usan ediciones originales de dominio público.** Las
   revisiones modernas con digitaciones, comentarios o grabaciones tienen
   derechos propios y no se copian.
10. **Chopin y Clementi: la adaptación es propia.** En el Preludio Op. 28 n.º 4
    se declara una «versión simplificada propia»; en la Sonatina Op. 36 n.º 1
    se usa un fragmento pedagógico propio. No se copia ninguna edición moderna.

## Candidatos descartados

| Candidato | Motivo |
|---|---|
| River Flows in You (Yiruma) | Compositor vivo; obra bajo copyright. |
| Comptine d'un autre été (Yann Tiersen) | Obra del siglo XXI bajo copyright. |
| Happy Birthday to You | Estado de copyright variable por país y antecedentes de marca; innecesaria para el curso. |
| Arreglos de métodos modernos (Alfred, Bastien, Suzuki y similares) | Arreglos y digitaciones protegidos; se transcribe desde la fuente original o se compone material propio. |
| Fantasia on Greensleeves (Vaughan Williams, 1934) | Obra del siglo XX con derechos; solo se usa la melodía tradicional. |
| Armonizaciones modernas de Amazing Grace | Arreglos recientes protegidos; solo se usa la melodía «New Britain». |
| Notebook for Anna Magdalena Bach, edición Bärenreiter 1957 | Trabajo editorial protegido; se usa el cuaderno de 1725. |

## Procedimiento para las tareas de transcripción

Antes de crear cada pieza:

1. Copiar de `src/repertoire/public-domain.ts` los datos del candidato:
   compositor, fechas, fuente, URL y fecha de verificación.
2. Confirmar que la ficha que se escribirá en `content/repertoire/` incluye
   `license: 'public-domain'` (o `original`/`cc0-1.0` si la pieza es propia),
   `composer`, `source`, `sourceUrl`, `transcriptionAuthor`,
   `transcriptionDate`, `attribution`, `verifiedBy` y `verifiedOn`.
3. Transcribir desde la fuente original o desde la partitura de dominio público;
   no copiar ediciones modernas.
4. Si la pieza es una adaptación (por ejemplo, el Preludio simplificado), decirlo
   en `notes` y en la atribución visible.
5. Ejecutar `npm run validate:content`; el esquema rechaza fichas incompletas y
   compositores de dominio público fallecidos hace 100 años o menos.

## Resultado

- **13 candidatos verificados:** 8 obras con compositor y 5 melodías
  tradicionales.
- **Ningún candidato quedó bloqueado por falta de fuente o por dudas de
  autoría.**
- **7 candidatos descartados** por copyright, arreglos modernos o ediciones con
  trabajo editorial.
- Las tareas F5-026 a F5-036 y F5-040 pueden continuar sin conexión: la
  verificación ya está registrada y no necesitan volver a consultar la red.

## Transcripciones publicadas

| Tarea | Pieza | Archivo | Ficha | Estado |
|---|---|---|---|---|
| F5-026 | Twinkle, Twinkle, Little Star | `content/repertoire/traditional-twinkle.json` | `public-domain`; anónimo tradicional; fuente «Ah! vous dirai-je, maman» (1761); verificación 2026-11-13 | Publicada (commit `87592fc`) |
| F5-027 | Frère Jacques | `content/repertoire/traditional-frere-jacques.json` | `public-domain`; anónimo tradicional; fuente «Recueil de Timbres de Vaudevilles» (c. 1780); verificación 2026-11-13 | Publicada (commit `d6bae0e`) |
| F5-028 | Greensleeves | `content/repertoire/traditional-greensleeves.json` | `public-domain`; anónimo tradicional; fuente Stationers' Company (1580); verificación 2026-11-13 | Publicada (commit `fdc26ab`) |
| F5-029 | Auld Lang Syne | `content/repertoire/traditional-auld-lang-syne.json` | `public-domain`; anónimo tradicional; fuente A Select Collection (1799); verificación 2026-11-13 | Publicada (commit `055284d`) |
| F5-030 | Amazing Grace | `content/repertoire/traditional-amazing-grace.json` | `public-domain`; anónimo tradicional; fuente «New Britain» (1829); verificación 2026-11-13 | Publicada (commit `5f233f0`) |
| F5-031 | Oda a la alegría | `content/repertoire/beethoven-ode-to-joy.json` | `public-domain`; Beethoven (1770-1827); Sinfonía n.º 9, Op. 125; verificación 2026-11-13 | Publicada (commit `cf08e20`) |
| F5-032 | Minueto en Sol, BWV Anh. 114 | `content/repertoire/petzold-minuet-g.json` | `public-domain`; Petzold (1677-1733); «Notebook for Anna Magdalena Bach» (1725); verificación 2026-11-13 | Publicada (commit `853edd1`) |

La ficha de la pieza repite la fuente, la fecha de verificación y la
atribución visible para que la app pueda mostrarla sin depender de este
documento. Las siguientes transcripciones seguirán el mismo procedimiento.

## Audio

Las 30 muestras de piano que usa la app provienen del **Salamander Grand Piano
v3** de **Alexander Holm**. La licencia se confirmó en la fuente original el
2026-11-15 (F6-040).

| Campo | Valor |
|---|---|
| Autor | Alexander Holm |
| Obra | Salamander Grand Piano v3 (48 kHz / 24 bit) |
| Fuente original | [archive.org/details/SalamanderGrandPianoV3](https://archive.org/details/SalamanderGrandPianoV3) |
| Repositorio del autor | [github.com/sfzinstruments/SalamanderGrandPiano](https://github.com/sfzinstruments/SalamanderGrandPiano) |
| Licencia | CC BY 3.0 Unported (`CC-BY-3.0`) |
| URL de la licencia | [creativecommons.org/licenses/by/3.0/](https://creativecommons.org/licenses/by/3.0/) |
| Espejo de descarga | [tonejs.github.io/audio/salamander](https://tonejs.github.io/audio/salamander/) |
| Modificaciones | Ninguna propia; se usa la copia MP3 publicada por Tone.js. |

- El repositorio `sfzinstruments/SalamanderGrandPiano` declara: «This work is
  licensed under a Creative Commons Attribution 3.0 Unported License» y enlaza
  `archive.org/details/SalamanderGrandPianoV3` como fuente.
- El manifiesto `assets/audio/manifest.json` repite autor, origen, licencia, URL
  de licencia y modificaciones por muestra; `npm run audit:audio` lo verifica.
- La atribución visible aparece en la pantalla de créditos (`#/atribuciones`).
