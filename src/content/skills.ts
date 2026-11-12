import rawSkills from '../../content/skills.json'
import { z } from 'zod'
import { SkillItemSchema, type SkillItem } from '../schemas'

/**
 * Habilidades del contenido listas para la interfaz.
 *
 * `content/skills.json` es la fuente de verdad de las habilidades y sus
 * parámetros; se valida al importarlo para que un archivo corrupto falle al
 * arrancar en vez de mostrar etiquetas vacías. El índice del curso solo guarda
 * los ids de habilidad de cada lección.
 */
export const CONTENT_SKILLS: readonly SkillItem[] = z
  .array(SkillItemSchema)
  .parse(rawSkills)

const skillsById = new Map<string, SkillItem>(
  CONTENT_SKILLS.map((skill) => [skill.id, skill] as const),
)

/** Busca una habilidad del contenido. */
export function findContentSkill(skillId: string): SkillItem | undefined {
  return skillsById.get(skillId)
}
