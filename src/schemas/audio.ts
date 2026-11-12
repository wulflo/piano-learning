import { z } from 'zod'

export const AudioSampleSchema = z.object({
  note: z.string().regex(/^[A-G](?:#|b)?[0-9]$/, {
    message: 'La muestra debe usar notación científica, por ejemplo C4 o Eb5',
  }),
  velocity: z.number().int().min(1).max(127),
  file: z.string().min(1),
  bytes: z.number().int().positive(),
  sha256: z.string().regex(/^[0-9a-f]{64}$/),
  sourceUrl: z.url(),
})
export type AudioSample = z.infer<typeof AudioSampleSchema>

export const AudioManifestSchema = z.object({
  version: z.literal(1),
  instrument: z.literal('salamander-grand-piano'),
  attribution: z.string().min(1),
  license: z.literal('CC-BY-3.0'),
  sourceUrl: z.url(),
  expectedSamples: z.number().int().nonnegative(),
  samples: z.array(AudioSampleSchema).default([]),
})
export type AudioManifest = z.infer<typeof AudioManifestSchema>
