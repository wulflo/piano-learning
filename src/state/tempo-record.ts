import { clampTempo } from '../audio/notes'
import { SkillProgressSchema, type SkillProgress } from '../schemas'
import type {
  ProgressiveMetronomeState,
} from './progressive-metronome'
import type { ProgressRepositories } from './repositories'

/**
 * F5-020 — Registro del tempo máximo por habilidad.
 *
 * El metrónomo progresivo puede subir el BPM durante una sesión, pero al
 * recargar la página ese avance se pierde. El récord se guarda en
 * `SkillProgress.maxTempoBpm`, que ya forma parte de los datos exportables y no
 * necesita una tabla ni una migración nueva.
 *
 * El registro nunca baja: practicar más lento para corregir no borra el tempo
 * más alto alcanzado. La escritura pasa por los repositorios para validar el id
 * y la fila con Zod antes de tocar Dexie.
 */

export type SkillRepositoryLike = Pick<ProgressRepositories, 'skills'>

export interface TempoRecordResult {
  /** Progreso de la habilidad después de la operación. */
  progress: SkillProgress
  /** Tempo máximo registrado. */
  maxTempoBpm: number
  /** `true` solo si esta llamada subió el récord. */
  improved: boolean
}

/** Récord guardado de una habilidad, si existe. */
export function maxTempoOf(
  progress: SkillProgress | undefined,
): number | undefined {
  return progress?.maxTempoBpm
}

function normalizeRecordTempo(bpm: number): number {
  if (!Number.isFinite(bpm)) {
    throw new Error(`Tempo inválido para el récord: ${bpm}`)
  }
  return clampTempo(bpm)
}

/**
 * Guarda el tempo máximo de una habilidad si supera al anterior.
 *
 * Devuelve el progreso aunque no haya cambios, de modo que la UI pueda mostrar
 * el récord vigente sin volver a leer la base. Si la habilidad no tenía fila,
 * se crea con los valores por defecto y el nuevo récord.
 */
export async function recordMaxTempo(
  repositories: SkillRepositoryLike,
  skillId: string,
  bpm: number,
): Promise<TempoRecordResult> {
  const value = normalizeRecordTempo(bpm)
  const stored = await repositories.skills.get(skillId)
  const current =
    stored === undefined ? SkillProgressSchema.parse({}) : stored
  const previous = current.maxTempoBpm ?? 0
  if (value <= previous) {
    return { progress: current, maxTempoBpm: previous, improved: false }
  }

  const next = SkillProgressSchema.parse({
    ...current,
    maxTempoBpm: value,
  })
  await repositories.skills.put(skillId, next)
  return { progress: next, maxTempoBpm: value, improved: true }
}

/**
 * Atajo para guardar el récord de una sesión completa de metrónomo progresivo.
 * Solo escribe si el estado alcanzó un tempo mayor que el guardado.
 */
export async function recordMetronomeMaxTempo(
  repositories: SkillRepositoryLike,
  skillId: string,
  state: ProgressiveMetronomeState,
): Promise<TempoRecordResult> {
  return recordMaxTempo(repositories, skillId, state.maxBpm)
}
