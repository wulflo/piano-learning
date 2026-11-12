import { z } from 'zod'
import { IdSchema } from './primitives'

export const SKILL_KIND_VALUES = [
  'note-id',
  'scale',
  'interval',
  'chord',
  'key-signature',
  'roman-numeral',
  'transposition',
  'progression',
  'form',
  'texture',
  'counterpoint',
  'ornament',
  'rhythm',
  'ear-interval',
  'ear-chord',
  'ear-scale',
  'ear-progression',
  'ear-melody',
  'sound-parameter',
  'keyboard-task',
] as const
export const SkillKindSchema = z.enum(SKILL_KIND_VALUES)
export type SkillKind = z.infer<typeof SkillKindSchema>

export const SkillParamValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.string()),
])
export type SkillParamValue = z.infer<typeof SkillParamValueSchema>

export const SkillItemSchema = z.object({
  id: IdSchema,
  kind: SkillKindSchema,
  labelEs: z.string().min(1),
  labelEn: z.string().min(1),
  params: z.record(z.string(), SkillParamValueSchema).default({}),
  lessonIds: z.array(IdSchema).default([]),
})
export type SkillItem = z.infer<typeof SkillItemSchema>
