import { z } from 'zod'

/**
 * Criterio conservador del proyecto: una obra se considera de dominio público
 * si el compositor murió hace más de 100 años, o si es una melodía tradicional
 * anónima antigua. Las transcripciones y arreglos son siempre propios.
 */
export const MIN_PUBLIC_DOMAIN_YEARS = 100

export const LicenseKindSchema = z.enum([
  'public-domain',
  'cc0-1.0',
  'cc-by-4.0',
  'cc-by-sa-4.0',
  'original',
])
export type LicenseKind = z.infer<typeof LicenseKindSchema>

export const ComposerSchema = z
  .object({
    name: z.string().min(1),
    birthYear: z.number().int().min(1000).max(2100).nullable(),
    deathYear: z.number().int().min(1000).max(2100).nullable(),
    anonymousTraditional: z.boolean().default(false),
  })
  .superRefine((composer, ctx) => {
    if (
      composer.birthYear !== null &&
      composer.deathYear !== null &&
      composer.deathYear < composer.birthYear
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'El año de muerte no puede ser anterior al de nacimiento',
        path: ['deathYear'],
      })
    }
  })
export type Composer = z.infer<typeof ComposerSchema>

export const LicenseFicheSchema = z
  .object({
    license: LicenseKindSchema,
    composer: ComposerSchema,
    source: z.string().min(1, {
      message: 'La fuente es obligatoria (edición, URL o referencia bibliográfica)',
    }),
    sourceUrl: z.url().optional(),
    transcriptionAuthor: z.string().min(1, {
      message: 'La transcripción debe tener autor',
    }),
    transcriptionDate: z.iso.date(),
    attribution: z.string().min(1, {
      message: 'La atribución visible es obligatoria',
    }),
    verifiedBy: z.string().min(1),
    verifiedOn: z.iso.date(),
    notes: z.string().optional(),
  })
  .superRefine((fiche, ctx) => {
    if (fiche.license !== 'public-domain') {
      return
    }

    if (fiche.composer.anonymousTraditional) {
      return
    }

    const currentYear = new Date().getUTCFullYear()
    const deathYear = fiche.composer.deathYear

    if (deathYear === null) {
      ctx.addIssue({
        code: 'custom',
        message:
          'Una obra de dominio público no anónima necesita el año de muerte del compositor',
        path: ['composer', 'deathYear'],
      })
      return
    }

    if (currentYear - deathYear <= MIN_PUBLIC_DOMAIN_YEARS) {
      ctx.addIssue({
        code: 'custom',
        message: `Criterio conservador: el compositor debe haber muerto hace más de ${MIN_PUBLIC_DOMAIN_YEARS} años (murió en ${deathYear})`,
        path: ['composer', 'deathYear'],
      })
    }
  })
export type LicenseFiche = z.infer<typeof LicenseFicheSchema>
