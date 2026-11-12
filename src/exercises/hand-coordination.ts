import type { Hand } from '../schemas'

/**
 * Etiquetas de la mano que ataca un pulso.
 *
 * Los ejercicios de independencia preguntan qué mano empieza la nota en un
 * punto del compás. `both` cubre los ataques simultáneos, que son la meta de la
 * coordinación y no un caso aparte.
 */
export type AttackingHand = Hand | 'both'

export const HAND_LABELS: Record<
  AttackingHand,
  { es: string; en: string }
> = {
  right: { es: 'Mano derecha', en: 'Right hand' },
  left: { es: 'Mano izquierda', en: 'Left hand' },
  both: { es: 'Ambas manos', en: 'Both hands' },
}

/** Opciones canónicas de un ejercicio de coordinación, en español e inglés. */
export function attackingHandCandidates(hand: AttackingHand): string[] {
  return [HAND_LABELS[hand].es, HAND_LABELS[hand].en]
}
