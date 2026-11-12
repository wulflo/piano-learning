import type { AugmentedSixthVariant } from '../schemas/content'

/**
 * Etiquetas canónicas de las sextas aumentadas. Las comparten el motor de
 * respuestas y el contenido generado o escrito a mano para que una variante
 * siempre se resuelva con el mismo texto en español y en inglés.
 */
export const AUGMENTED_SIXTH_LABELS: Record<
  AugmentedSixthVariant,
  readonly [string, string]
> = {
  italian: [
    'Sexta aumentada italiana',
    'Italian augmented sixth',
  ],
  french: [
    'Sexta aumentada francesa',
    'French augmented sixth',
  ],
  german: [
    'Sexta aumentada alemana',
    'German augmented sixth',
  ],
}

/** Grado al que resuelven las tres variantes: la dominante. */
export const AUGMENTED_SIXTH_RESOLUTION = ['V', 'dominante', 'dominant'] as const
