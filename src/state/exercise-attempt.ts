import { findContentSkill } from '../content/skills'
import type { Exercise, ExerciseType, SkillKind } from '../schemas'
import type { FsrsSchedulerParams } from './fsrs'
import {
  recordReview,
  reviewFormatForKind,
  type RecordReviewResult,
  type ReviewFormat,
} from './practice-log'
import { autoReviewRating } from './rating'
import type { ProgressRepositories } from './repositories'

/**
 * Registro de un intento de ejercicio.
 *
 * Cada respuesta se guarda como un repaso de la habilidad asociada al
 * ejercicio: la calificación FSRS sale de la corrección y del tiempo de
 * respuesta, y el historial queda disponible para la cola diaria y las
 * estadísticas. Así resolver un ejercicio desde una lección alimenta el mismo
 * progreso que la pantalla de repaso.
 */

const KIND_BY_EXERCISE_TYPE: Record<ExerciseType, SkillKind> = {
  'note-keyboard': 'note-id',
  'note-staff': 'note-id',
  'scale-spelling': 'scale',
  'key-signature': 'key-signature',
  interval: 'interval',
  chord: 'chord',
  'chord-notation': 'chord',
  'roman-numeral': 'roman-numeral',
  'harmonic-function': 'roman-numeral',
  cadence: 'progression',
  'secondary-dominant': 'roman-numeral',
  'borrowed-chord': 'roman-numeral',
  'augmented-sixth': 'roman-numeral',
  'pivot-chord': 'roman-numeral',
  'phrase-analysis': 'form',
  'form-analysis': 'form',
  'texture-analysis': 'texture',
  'counterpoint-analysis': 'counterpoint',
  'ornament-execution': 'ornament',
  transposition: 'transposition',
  'progression-completion': 'progression',
  'rhythm-dictation': 'rhythm',
  'rhythm-completion': 'rhythm',
  'anacrusis-completion': 'rhythm',
  'meter-accent': 'rhythm',
  'tempo-term': 'rhythm',
  'tempo-stability': 'rhythm',
  'sound-parameter': 'sound-parameter',
  'dynamic-mark': 'rhythm',
  articulation: 'rhythm',
  'playback-order': 'progression',
  'italian-term': 'roman-numeral',
  'ear-interval': 'ear-interval',
  'ear-chord': 'ear-chord',
  'ear-scale': 'ear-scale',
  'ear-progression': 'ear-progression',
  'ear-melody': 'ear-melody',
  'hand-coordination': 'keyboard-task',
  pedal: 'keyboard-task',
  alberti: 'keyboard-task',
  'walking-bass': 'keyboard-task',
  stride: 'keyboard-task',
  'sight-reading': 'keyboard-task',
  arpeggiated: 'keyboard-task',
  accompaniment: 'keyboard-task',
  'style-pattern': 'keyboard-task',
  arpeggio: 'keyboard-task',
}

export interface ExerciseAttemptInput {
  exercise: Exercise
  correct: boolean
  /** Milisegundos entre mostrar el enunciado y corregir. */
  durationMs: number
  fsrsParams?: FsrsSchedulerParams
  now?: Date
}

export interface ExerciseAttemptResult extends RecordReviewResult {
  rating: ReturnType<typeof autoReviewRating>
}

/** Resuelve el tipo de habilidad del ejercicio, priorizando el contenido. */
export function exerciseSkillKind(exercise: Exercise): SkillKind {
  return (
    findContentSkill(exercise.skillId)?.kind ??
    KIND_BY_EXERCISE_TYPE[exercise.type]
  )
}

/**
 * Formatos que el tipo de ejercicio fuerza aunque la habilidad comparta tema
 * con una variante visual. Los ejercicios auditivos siempre se registran como
 * `hear`; el resto conserva el formato derivado de su habilidad.
 */
const FORMAT_BY_EXERCISE_TYPE: Partial<Record<ExerciseType, ReviewFormat>> =
  Object.freeze({
    'ear-interval': 'hear',
    'ear-chord': 'hear',
    'ear-scale': 'hear',
    'ear-progression': 'hear',
  })

/** Ítem de FSRS que corresponde a un intento: id, habilidad y formato. */
export interface ExerciseReviewItem {
  itemId: string
  kind: SkillKind
  format: ReviewFormat
}

/**
 * Deriva el ítem de repaso de un ejercicio.
 *
 * Las variantes visual y auditiva de un mismo tema apuntan a habilidades
 * distintas (`skill.major-scale` y `skill.ear-scale`, por ejemplo), de modo que
 * FSRS guarda tarjetas separadas. El formato explícito mantiene el registro
 * como `hear` aunque el contenido cambie de etiqueta.
 */
export function exerciseReviewItem(exercise: Exercise): ExerciseReviewItem {
  const kind = exerciseSkillKind(exercise)
  return {
    itemId: exercise.skillId,
    kind,
    format: FORMAT_BY_EXERCISE_TYPE[exercise.type] ?? reviewFormatForKind(kind),
  }
}

/** Califica y persiste un intento de ejercicio en el progreso. */
export async function recordExerciseAttempt(
  repositories: ProgressRepositories,
  input: ExerciseAttemptInput,
): Promise<ExerciseAttemptResult> {
  const rating = autoReviewRating({
    correct: input.correct,
    durationMs: input.durationMs,
  })
  const item = exerciseReviewItem(input.exercise)
  const result = await recordReview(repositories, {
    itemId: item.itemId,
    kind: item.kind,
    format: item.format,
    rating,
    durationMs: input.durationMs,
    fsrsParams: input.fsrsParams,
    now: input.now,
  })
  return { ...result, rating }
}
