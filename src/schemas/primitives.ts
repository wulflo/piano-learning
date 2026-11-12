import { z } from 'zod'

export const IdSchema = z
  .string()
  .min(3)
  .regex(/^[a-z0-9][a-z0-9._-]*$/, {
    message:
      'El ID debe usar minúsculas, números, punto, guion o guion bajo, y empezar alfanumérico',
  })
export type Id = z.infer<typeof IdSchema>

export const LocaleSchema = z.enum(['es', 'en'])
export type Locale = z.infer<typeof LocaleSchema>

export const ThemePreferenceSchema = z.enum(['light', 'dark', 'system'])
export type ThemePreference = z.infer<typeof ThemePreferenceSchema>
