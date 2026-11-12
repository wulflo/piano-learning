import {
  SkillItemSchema,
  type SkillItem,
  type SkillKind,
  type SkillParamValue,
} from '../schemas'

export interface SkillRegistry {
  get(id: string): SkillItem | undefined
  has(id: string): boolean
  byKind(kind: SkillKind): SkillItem[]
  findByParams(params: Record<string, SkillParamValue>): SkillItem[]
}

export function createSkillRegistry(items: SkillItem[]): SkillRegistry {
  const registry = new Map<string, SkillItem>()

  for (const item of items) {
    const parsed = SkillItemSchema.parse(item)
    if (registry.has(parsed.id)) {
      throw new Error(`Habilidad duplicada en el registro: ${parsed.id}`)
    }
    registry.set(parsed.id, parsed)
  }

  return {
    get: (id: string) => registry.get(id),
    has: (id: string) => registry.has(id),
    byKind: (kind: SkillKind) =>
      Array.from(registry.values()).filter((item) => item.kind === kind),
    findByParams: (params: Record<string, SkillParamValue>) =>
      Array.from(registry.values()).filter((item) => {
        const itemParams = item.params ?? {}
        return Object.entries(params).every(([key, value]) => itemParams[key] === value)
      }),
  }
}
