import type { ProgressRepositories } from './repositories'

/**
 * Restablecer el progreso con doble confirmación.
 *
 * Borrar el progreso es irreversible y no se puede deshacer con la exportación
 * automática, así que la API exige dos señales explícitas: un número de
 * confirmaciones y una palabra escrita por el usuario. La comprobación ocurre
 * antes de tocar la base y el borrado se hace en una sola transacción.
 *
 * La interfaz es la encargada de mostrar el diálogo y de pedir las dos
 * confirmaciones; este módulo solo impide que una llamada accidental borre los
 * datos.
 */

/** Palabra que el usuario debe escribir en la segunda confirmación. */
export const RESET_CONFIRMATION_WORD = 'BORRAR'
/** Confirmaciones mínimas: el diálogo y la palabra escrita. */
export const RESET_REQUIRED_CONFIRMATIONS = 2

export type ProgressResetErrorCode =
  | 'confirmation-required'
  | 'confirmation-mismatch'
  | 'reset-failed'

export class ProgressResetError extends Error {
  readonly code: ProgressResetErrorCode

  constructor(
    code: ProgressResetErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options)
    this.name = 'ProgressResetError'
    this.code = code
  }
}

export interface ResetProgressOptions {
  /** Confirmaciones explícitas recibidas por la interfaz; deben ser al menos 2. */
  confirmations?: number
  /** Palabra escrita por el usuario en la segunda confirmación. */
  confirmationWord?: string
  /** Palabra esperada; por defecto, `BORRAR`. */
  expectedWord?: string
  /** Reloj inyectable para la fecha del reseteo. */
  now?: Date
}

/** Datos que había antes de borrar, para mostrarlos en el resumen. */
export interface ResetProgressCounts {
  lessons: number
  skills: number
  reviews: number
  sessions: number
  achievements: number
  xp: number
}

export interface ResetProgressResult {
  resetAt: string
  /** Conteos previos al borrado. */
  cleared: ResetProgressCounts
}

function normalizeWord(value: string): string {
  return value.trim().toLocaleUpperCase('es')
}

async function countProgress(
  repositories: ProgressRepositories,
): Promise<ResetProgressCounts> {
  const [lessons, skills, reviews, sessions, profile] = await Promise.all([
    repositories.lessons.all(),
    repositories.skills.all(),
    repositories.reviews.all(),
    repositories.sessions.all(),
    repositories.profile.get(),
  ])

  return {
    lessons: lessons.length,
    skills: skills.length,
    reviews: reviews.length,
    sessions: sessions.length,
    achievements: profile.achievements.length,
    xp: profile.xp,
  }
}

/**
 * Borra todo el progreso y devuelve la fecha y un resumen de lo borrado.
 *
 * Exige `confirmations >= 2` y que la palabra escrita coincida con
 * `expectedWord` (por defecto `BORRAR`, sin distinguir mayúsculas ni espacios
 * exteriores). Cualquier comprobación fallida deja la base intacta.
 */
export async function resetProgress(
  repositories: ProgressRepositories,
  options: ResetProgressOptions = {},
): Promise<ResetProgressResult> {
  const confirmations = options.confirmations ?? 0
  if (!Number.isInteger(confirmations) || confirmations < RESET_REQUIRED_CONFIRMATIONS) {
    throw new ProgressResetError(
      'confirmation-required',
      `El reseteo exige ${RESET_REQUIRED_CONFIRMATIONS} confirmaciones explícitas`,
    )
  }

  const expectedWord = normalizeWord(
    options.expectedWord ?? RESET_CONFIRMATION_WORD,
  )
  const writtenWord = normalizeWord(options.confirmationWord ?? '')
  if (writtenWord !== expectedWord) {
    throw new ProgressResetError(
      'confirmation-mismatch',
      `Escribe «${options.expectedWord ?? RESET_CONFIRMATION_WORD}» para confirmar el borrado`,
    )
  }

  const cleared = await countProgress(repositories)

  try {
    await repositories.clearAll()
  } catch (error) {
    throw new ProgressResetError(
      'reset-failed',
      'No se pudo borrar el progreso; los datos no se modificaron',
      { cause: error },
    )
  }

  return {
    resetAt: (options.now ?? new Date()).toISOString(),
    cleared,
  }
}
