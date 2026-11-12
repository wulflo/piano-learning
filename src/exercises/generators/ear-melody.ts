import { ExerciseSchema } from '../../schemas/content'
import {
  generateSightReadingExercise,
  type SightReadingExerciseParams,
} from './sight-reading'

/**
 * Generador de melodías ocultas.
 *
 * Reutiliza la construcción de fragmentos de M7-09: la melodía se escribe por
 * grados de la escala y la pregunta puede ser un intervalo, una nota o el
 * movimiento. La diferencia está en la presentación: el ejercicio se escucha
 * sin ver la partitura y la explicación remite a la memoria melódica, no a la
 * lectura.
 */

export interface EarMelodyExercise {
  id: string
  skillId: string
  type: 'ear-melody'
  promptEs: string
  promptEn: string
  explanationEs: string
  explanationEn: string
  difficulty: number
  score: ReturnType<typeof generateSightReadingExercise>['score']
  ask: 'interval' | 'note' | 'motion'
  from: number
  to: number
  choices: string[]
  choicesEn: string[]
}

export type EarMelodyExerciseParams = SightReadingExerciseParams

/**
 * Genera una melodía oculta a partir del mismo material que un fragmento de
 * lectura. La respuesta se mantiene en las opciones y el ejercicio se valida
 * contra el esquema antes de devolverlo.
 */
export function generateEarMelodyExercise(
  params: EarMelodyExerciseParams,
): EarMelodyExercise {
  const base = generateSightReadingExercise(params)
  const target = base.choices[0]
  const targetEn = base.choicesEn[0]
  if (target === undefined || targetEn === undefined) {
    throw new Error('La melodía generada no tiene una respuesta')
  }

  const exercise: EarMelodyExercise = {
    id: params.id,
    skillId: params.skillId,
    type: 'ear-melody',
    promptEs: `Escuchá la melodía oculta. ${base.promptEs}`,
    promptEn: `Listen to the hidden melody. ${base.promptEn}`,
    explanationEs: `La respuesta correcta es «${target}». ${base.explanationEs} Para fijarla de oído, cantá la melodía antes de responder y volvé a escucharla después de ver la partitura revelada.`,
    explanationEn: `The correct answer is “${targetEn}”. ${base.explanationEn} To fix it by ear, sing the melody before answering and listen again after the revealed score appears.`,
    difficulty: base.difficulty,
    score: base.score,
    ask: base.ask,
    from: base.from,
    to: base.to,
    choices: [...base.choices],
    choicesEn: [...base.choicesEn],
  }

  const result = ExerciseSchema.safeParse(exercise)
  if (!result.success) {
    throw new Error(
      `La melodía oculta generada no es válida: ${result.error.message}`,
    )
  }
  return exercise
}
