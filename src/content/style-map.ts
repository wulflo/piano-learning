/**
 * Mapa editorial de los cuatro estilos de M8.
 *
 * M8 es un módulo opcional: sus lecciones amplían la técnica de M7 y no
 * bloquean ninguna tarea obligatoria. Este mapa no sustituye al índice del
 * curso; añade el contexto que el índice no necesita (qué se practica en cada
 * estilo y qué pieza original cierra la lección) para que la ruta opcional se
 * pueda recorrer con enlaces reales.
 *
 * `tests/style-map.test.ts` comprueba que cada lección existe, pertenece a M8 y
 * contiene la pieza citada, de modo que el mapa no pueda quedar desfasado.
 */

export interface StyleMapEntry {
  /** Lección de M8 que contiene la explicación y la pieza. */
  lessonId: string
  styleEs: string
  styleEn: string
  focusEs: string
  focusEn: string
  /** Título de la pieza original que cierra la lección. */
  pieceEs: string
  pieceEn: string
  patternEs: string
  patternEn: string
}

export const STYLE_MAP: readonly StyleMapEntry[] = [
  {
    lessonId: 'lesson.m8-01',
    styleEs: 'Pop/rock',
    styleEn: 'Pop/rock',
    focusEs: 'Backbeat y acompañamiento en corcheas',
    focusEn: 'Backbeat and eighth-note accompaniment',
    pieceEs: 'Ciudad de neón',
    pieceEn: 'Neon City',
    patternEs: 'Bucle I–V–vi–IV',
    patternEn: 'I–V–vi–IV loop',
  },
  {
    lessonId: 'lesson.m8-02',
    styleEs: 'Blues',
    styleEn: 'Blues',
    focusEs: 'Shuffle, comping y forma de doce compases',
    focusEn: 'Shuffle, comping and the twelve-bar form',
    pieceEs: 'Ruta azul',
    pieceEn: 'Blue Route',
    patternEs: 'Escala de blues y turnaround',
    patternEn: 'Blues scale and turnaround',
  },
  {
    lessonId: 'lesson.m8-03',
    styleEs: 'Jazz básico',
    styleEn: 'Basic jazz',
    focusEs: 'Swing, cadencia ii–V–I y voicings',
    focusEn: 'Swing, ii–V–I cadence and voicings',
    pieceEs: 'Tren de medianoche',
    pieceEn: 'Midnight Train',
    patternEs: 'Notas guía y voicings sin fundamental',
    patternEn: 'Guide tones and rootless voicings',
  },
  {
    lessonId: 'lesson.m8-04',
    styleEs: 'Ritmos latinos',
    styleEn: 'Latin rhythms',
    focusEs: 'Bossa nova, clave y montuno de salsa',
    focusEn: 'Bossa nova, clave and salsa montuno',
    pieceEs: 'Calle de coral',
    pieceEn: 'Coral Street',
    patternEs: 'Bucle I–vi–ii–V',
    patternEn: 'I–vi–ii–V loop',
  },
]
