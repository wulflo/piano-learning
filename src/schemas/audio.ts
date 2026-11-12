import { z } from 'zod'

export const AudioSampleSchema = z.object({
  note: z.string().regex(/^[A-G](?:#|b)?[0-9]$/, {
    message: 'La muestra debe usar notación científica, por ejemplo C4 o Eb5',
  }),
  velocity: z.number().int().min(1).max(127),
  file: z.string().min(1),
  bytes: z.number().int().positive(),
  sha256: z.string().regex(/^[0-9a-f]{64}$/),
  /** Autoría de la muestra, tal como exige la atribución de su licencia. */
  author: z.string().min(1),
  /** Origen legible de la muestra (biblioteca, espejo o grabación). */
  source: z.string().min(1),
  /** Identificador SPDX de la licencia de la muestra. */
  license: z.string().min(1),
  /** URL del texto de la licencia. */
  licenseUrl: z.url(),
  /** Qué cambió respecto del origen (o «sin modificaciones»). */
  modifications: z.string().min(1),
  sourceUrl: z.url(),
})
export type AudioSample = z.infer<typeof AudioSampleSchema>

export const AudioManifestSchema = z.object({
  version: z.literal(1),
  instrument: z.literal('salamander-grand-piano'),
  attribution: z.string().min(1),
  license: z.literal('CC-BY-3.0'),
  sourceUrl: z.url(),
  /** Fuente original de las muestras (antes del espejo de descarga). */
  originUrl: z.url(),
  originRepository: z.url().optional(),
  expectedSamples: z.number().int().nonnegative(),
  samples: z.array(AudioSampleSchema).default([]),
})
export type AudioManifest = z.infer<typeof AudioManifestSchema>
