import type { Ornament } from '../schemas/content'

/**
 * Etiquetas canónicas de los adornos. Las comparten el motor de respuestas y el
 * generador de ejercicios para que una realización siempre se resuelva con el
 * mismo texto en español y en inglés.
 */
export const ORNAMENT_LABELS: Record<Ornament, readonly [string, string]> = {
  trill: [
    'Trino: alternar la nota principal con la superior',
    'Trill: alternate the main note with the upper note',
  ],
  mordent: [
    'Mordente: bajar a la inferior y volver a la principal',
    'Mordent: drop to the lower note and return to the main note',
  ],
  turn: [
    'Grupeto: superior, principal, inferior y principal',
    'Turn: upper, main, lower, main',
  ],
  appoggiatura: [
    'Apoyatura: apoyarse en la vecina antes de la principal',
    'Appoggiatura: lean on the neighbour before the main note',
  ],
}
