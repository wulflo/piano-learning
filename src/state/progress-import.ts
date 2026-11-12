import {
  ProgressDataSchema,
  ProgressEnvelopeSchema,
  type ProgressData,
  type ProgressEnvelope,
} from '../schemas'
import {
  PROGRESS_FILE_FORMAT,
  PROGRESS_FILE_TITLE,
  PROGRESS_FILE_VERSION,
  canonicalJson,
  sha256Hex,
} from './progress-export'
import type { ProgressRepositories } from './repositories'

/**
 * Importación del archivo de progreso.
 *
 * El archivo se valida por completo antes de tocar la base: cabecera, formato,
 * versión, JSON, esquema de datos y SHA-256. Solo después, y con confirmación
 * explícita, se reemplaza todo el progreso en una única transacción.
 */

export type ProgressImportErrorCode =
  | 'invalid-format'
  | 'unsupported-version'
  | 'invalid-data'
  | 'invalid-hash'
  | 'confirmation-required'

export class ProgressImportError extends Error {
  readonly code: ProgressImportErrorCode

  constructor(
    code: ProgressImportErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options)
    this.name = 'ProgressImportError'
    this.code = code
  }
}

export interface ProgressFileHeader {
  format: string
  version: number
  exportedAt: string
  appVersion: string
  sha256: string
}

export interface ParsedProgressFile {
  header: ProgressFileHeader
  envelope: ProgressEnvelope
  data: ProgressData
  /** JSON canónico de `data`, el mismo que se hasheó al exportar. */
  json: string
  sha256: string
}

export interface ImportProgressCounts {
  lessons: number
  skills: number
  reviews: number
  sessions: number
  achievements: number
}

export interface ImportProgressOptions {
  /** Debe ser `true`: la importación reemplaza todo el progreso. */
  confirm?: boolean
  /** Reloj inyectable para la fecha de reemplazo. */
  now?: Date
}

export interface ImportProgressResult extends ParsedProgressFile {
  replacedAt: string
  counts: ImportProgressCounts
}

function invalidFormat(message: string, cause?: unknown): ProgressImportError {
  return new ProgressImportError('invalid-format', message, { cause })
}

function invalidHash(message: string): ProgressImportError {
  return new ProgressImportError('invalid-hash', message)
}

function readHeader(lines: readonly string[], prefix: string): string {
  const matches = lines.filter((line) => line.startsWith(prefix))
  if (matches.length !== 1) {
    throw invalidFormat(`La cabecera debe tener una sola línea «${prefix}»`)
  }
  const value = matches[0].slice(prefix.length).trim()
  if (value.length === 0) {
    throw invalidFormat(`La línea «${prefix}» está vacía`)
  }
  return value
}

/**
 * Lee y valida un archivo exportado. No escribe nada.
 *
 * Lanza `ProgressImportError` con un código estable para que la UI distinga un
 * archivo corrupto, una versión futura o un hash manipulado.
 */
export async function parseProgressFile(text: string): Promise<ParsedProgressFile> {
  const normalized = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')
  const separator = normalized.indexOf('\n\n')
  if (separator < 0) {
    throw invalidFormat('Falta la línea en blanco que separa la cabecera del JSON')
  }

  const headerText = normalized.slice(0, separator)
  const payload = normalized.slice(separator + 2).trim()
  if (payload.length === 0) {
    throw invalidFormat('El archivo no contiene datos de progreso')
  }

  const lines = headerText.split('\n')
  if (lines[0]?.trim() !== PROGRESS_FILE_TITLE) {
    throw invalidFormat('El archivo no es una exportación de PianoDesdeCero')
  }

  const formatValue = readHeader(lines, 'Formato:')
  const formatMatch = /^(\S+)\s+v(\d+)$/.exec(formatValue)
  if (!formatMatch) {
    throw invalidFormat('La línea de formato no tiene el aspecto esperado')
  }
  const format = formatMatch[1]
  const version = Number(formatMatch[2])
  if (format !== PROGRESS_FILE_FORMAT) {
    throw invalidFormat(`Formato desconocido: ${format}`)
  }
  if (version !== PROGRESS_FILE_VERSION) {
    throw new ProgressImportError(
      'unsupported-version',
      `La versión ${version} del archivo no es compatible; se espera la ${PROGRESS_FILE_VERSION}`,
    )
  }

  const headerSha = readHeader(lines, 'SHA-256:')
  if (!/^[0-9a-f]{64}$/.test(headerSha)) {
    throw invalidHash('El SHA-256 de la cabecera no tiene 64 caracteres hexadecimales')
  }

  let raw: unknown
  try {
    raw = JSON.parse(payload)
  } catch (error) {
    throw invalidFormat('El contenido no es JSON válido', error)
  }

  let data: ProgressData
  try {
    data = ProgressDataSchema.parse(raw)
  } catch (error) {
    throw new ProgressImportError(
      'invalid-data',
      'Los datos de progreso no son válidos',
      { cause: error },
    )
  }

  const json = canonicalJson(data)
  const sha256 = await sha256Hex(json)
  if (sha256 !== headerSha) {
    throw invalidHash(
      'El SHA-256 no coincide con los datos; el archivo está corrupto o fue modificado',
    )
  }

  const exportedAt = readHeader(lines, 'Exportado:')
  const appVersion = readHeader(lines, 'Aplicación:')

  let envelope: ProgressEnvelope
  try {
    envelope = ProgressEnvelopeSchema.parse({
      format,
      version,
      exportedAt,
      appVersion,
      sha256,
      data,
    })
  } catch (error) {
    throw invalidFormat('La cabecera no es válida', error)
  }

  return {
    header: { format, version, exportedAt, appVersion, sha256 },
    envelope,
    data,
    json,
    sha256,
  }
}

/**
 * Importa un archivo validado y reemplaza todo el progreso.
 *
 * Sin `confirm: true` no escribe nada. Si la validación falla, la base queda
 * intacta; el reemplazo se hace en una transacción para que un error de
 * escritura tampoco deje datos a medias.
 */
export async function importProgress(
  repositories: ProgressRepositories,
  text: string,
  options: ImportProgressOptions = {},
): Promise<ImportProgressResult> {
  const parsed = await parseProgressFile(text)
  if (options.confirm !== true) {
    throw new ProgressImportError(
      'confirmation-required',
      'La importación reemplaza todo el progreso; confirma explícitamente para continuar',
    )
  }

  await repositories.replaceAll(parsed.data)

  return {
    ...parsed,
    replacedAt: (options.now ?? new Date()).toISOString(),
    counts: {
      lessons: Object.keys(parsed.data.lessons).length,
      skills: Object.keys(parsed.data.skills).length,
      reviews: parsed.data.reviews.length,
      sessions: parsed.data.practiceSessions.length,
      achievements: parsed.data.achievements.length,
    },
  }
}
