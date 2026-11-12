import { z } from 'zod'
import { LicenseFicheSchema } from './license'
import { IdSchema } from './primitives'
import { ScoreSchema } from './notation'

/**
 * Plan de tempo de un estudio técnico: se empieza en `startBpm`, se sube en
 * pasos de `stepBpm` y se cierra al llegar a `targetBpm` o superarlo.
 */
export const TempoProgressionSchema = z
  .object({
    startBpm: z.number().int().min(30).max(240),
    targetBpm: z.number().int().min(30).max(240),
    stepBpm: z.number().int().min(1).max(24),
  })
  .superRefine((plan, ctx) => {
    if (plan.targetBpm <= plan.startBpm) {
      ctx.addIssue({
        code: 'custom',
        message: 'El tempo objetivo debe ser mayor que el inicial',
        path: ['targetBpm'],
      })
    }
    if (plan.stepBpm > plan.targetBpm - plan.startBpm) {
      ctx.addIssue({
        code: 'custom',
        message: 'El paso de tempo no puede superar la subida total',
        path: ['stepBpm'],
      })
    }
  })
export type TempoProgression = z.infer<typeof TempoProgressionSchema>

export const RepertoirePieceSchema = z
  .object({
    id: IdSchema,
    title: z.string().min(1),
    composerDisplay: z.string().min(1),
    level: z.number().int().min(1).max(10),
    durationSeconds: z.number().positive().optional(),
    tags: z.array(z.string().min(1)).default([]),
    license: LicenseFicheSchema,
    hands: z.object({
      right: ScoreSchema.optional(),
      left: ScoreSchema.optional(),
      both: ScoreSchema.optional(),
    }),
    notesEs: z.string().optional(),
    notesEn: z.string().optional(),
    /** Digitación orientativa del estudio, por mano y por patrón. */
    fingeringEs: z.string().min(1).optional(),
    fingeringEn: z.string().min(1).optional(),
    /** Progresión de tempo recomendada para practicar el estudio. */
    tempoProgression: TempoProgressionSchema.optional(),
  })
  .superRefine((piece, ctx) => {
    if (!piece.hands.right && !piece.hands.left && !piece.hands.both) {
      ctx.addIssue({
        code: 'custom',
        message: 'La pieza necesita al menos una partitura (right, left o both)',
        path: ['hands'],
      })
    }
  })
export type RepertoirePiece = z.infer<typeof RepertoirePieceSchema>
