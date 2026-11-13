import {
  ProgressDataSchema,
  ProgressEnvelopeSchema,
  type LessonProgress,
  type ProgressData,
  type ProgressEnvelope,
  type SkillProgress,
} from '../schemas'
import type { ProgressRepositories } from './repositories'
import { APP_VERSION } from '../version'

/**
 * Exportación del progreso a un `.txt` legible.
 *
 * El archivo tiene una cabecera con el formato, la fecha, la versión de la app
 * y el hash SHA-256; debajo va el JSON canónico de los datos (claves ordenadas
 * y sin espacios) para que el hash sea estable entre exportaciones.
 *
 * El hash cubre solo `data`, no la cabecera: así dos exportaciones de los
 * mismos datos producen el mismo SHA-256 aunque cambie la fecha.
 */

export const PROGRESS_FILE_FORMAT = 'pianodesdecero.progress'
export const PROGRESS_FILE_VERSION = 1
export const PROGRESS_FILE_TITLE = 'Piano Today — Progreso'

export interface ProgressExportOptions {
  /** Reloj inyectable; por defecto, la fecha actual. */
  now?: Date
  /** Versión de la app; por defecto, la de `package.json`. */
  appVersion?: string
}

export interface ProgressExport {
  envelope: ProgressEnvelope
  /** Contenido completo del archivo `.txt`. */
  text: string
  /** Nombre sugerido, con la fecha de exportación. */
  fileName: string
  /** JSON canónico de `data`; es lo que se hashea. */
  json: string
  /** SHA-256 del JSON canónico, en hexadecimal minúsculas. */
  sha256: string
}

/** Convierte un valor a JSON canónico: claves ordenadas y sin espacios. */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalValue(value))
}

function canonicalValue(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString()
  }
  if (Array.isArray(value)) {
    return value.map(canonicalValue)
  }
  if (value !== null && typeof value === 'object') {
    const source = value as Record<string, unknown>
    const sorted: Record<string, unknown> = {}
    for (const key of Object.keys(source).sort()) {
      if (source[key] === undefined) continue
      sorted[key] = canonicalValue(source[key])
    }
    return sorted
  }
  return value
}

/** SHA-256 de un texto en UTF-8, en hexadecimal minúsculas. */
export async function sha256Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text)
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

/** Reúne todo el progreso persistido en el sobre exportable. */
export async function collectProgressData(
  repositories: ProgressRepositories,
): Promise<ProgressData> {
  const [lessonRecords, skillRecords, reviews, settings, profile, sessions] =
    await Promise.all([
      repositories.lessons.all(),
      repositories.skills.all(),
      repositories.reviews.all(),
      repositories.settings.get(),
      repositories.profile.get(),
      repositories.sessions.all(),
    ])

  const lessons: Record<string, LessonProgress> = {}
  for (const record of lessonRecords) {
    const { id, ...progress } = record
    lessons[id] = progress
  }

  const skills: Record<string, SkillProgress> = {}
  for (const record of skillRecords) {
    const { id, ...progress } = record
    skills[id] = progress
  }

  return ProgressDataSchema.parse({
    schemaVersion: 1,
    lessons,
    skills,
    reviews,
    settings,
    xp: profile.xp,
    level: profile.level,
    achievements: profile.achievements,
    streak: profile.streak,
    practiceSessions: sessions,
  })
}

/** Construye el sobre, el texto y el nombre del archivo de exportación. */
export async function createProgressExport(
  data: ProgressData,
  options: ProgressExportOptions = {},
): Promise<ProgressExport> {
  const parsed = ProgressDataSchema.parse(data)
  const json = canonicalJson(parsed)
  const sha256 = await sha256Hex(json)
  const exportedAt = (options.now ?? new Date()).toISOString()
  const appVersion = options.appVersion ?? APP_VERSION

  const envelope = ProgressEnvelopeSchema.parse({
    format: PROGRESS_FILE_FORMAT,
    version: PROGRESS_FILE_VERSION,
    exportedAt,
    appVersion,
    sha256,
    data: parsed,
  })

  const text = [
    PROGRESS_FILE_TITLE,
    `Formato: ${PROGRESS_FILE_FORMAT} v${PROGRESS_FILE_VERSION}`,
    `Exportado: ${exportedAt}`,
    `Aplicación: ${appVersion}`,
    `SHA-256: ${sha256}`,
    '',
    json,
    '',
  ].join('\n')

  return {
    envelope,
    text,
    fileName: `pianodesdecero-progreso-${exportedAt.slice(0, 10)}.txt`,
    json,
    sha256,
  }
}

/** Descarga el archivo exportado usando un enlace temporal. */
export function downloadProgressFile(file: Pick<ProgressExport, 'text' | 'fileName'>): void {
  if (typeof document === 'undefined' || typeof URL.createObjectURL !== 'function') {
    throw new Error('La descarga de archivos no está disponible en este entorno')
  }

  const blob = new Blob([file.text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = file.fileName
  link.rel = 'noopener'
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
