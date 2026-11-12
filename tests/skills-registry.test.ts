import { describe, expect, it } from 'vitest'
import { SkillItemSchema, type SkillItem } from '../src/schemas/skill'
import { createSkillRegistry } from '../src/skills/registry'

const BASE_ITEM: SkillItem = {
  id: 'skill.scale',
  kind: 'scale',
  labelEs: 'Construir escalas',
  labelEn: 'Build scales',
  params: { mode: 'major' },
  lessonIds: ['lesson.m2-01'],
}

const SECOND_ITEM: SkillItem = {
  id: 'skill.ear-scale',
  kind: 'ear-scale',
  labelEs: 'Reconocer escalas de oído',
  labelEn: 'Recognize scales by ear',
  params: { mode: 'minor' },
  lessonIds: [],
}

describe('F2-031 — Modelo y registro de SkillItem', () => {
  it('serializa un ítem parametrizado de forma idéntica', () => {
    const parsed = SkillItemSchema.parse(BASE_ITEM)
    expect(parsed.kind).toBe('scale')
    expect(parsed.params).toEqual({ mode: 'major' })

    const again = SkillItemSchema.parse(parsed)
    expect(again).toEqual(parsed)
  })

  it('rechaza un ítem con kind inválido', () => {
    const result = SkillItemSchema.safeParse({ ...BASE_ITEM, kind: 'invalid-kind' })
    expect(result.success).toBe(false)
  })

  it('crea un registro con ítems únicos y busca por kind y parámetros', () => {
    const registry = createSkillRegistry([BASE_ITEM, SECOND_ITEM])

    expect(registry.has('skill.scale')).toBe(true)
    expect(registry.get('skill.scale')?.params).toEqual({ mode: 'major' })
    expect(registry.byKind('ear-scale')).toHaveLength(1)
    expect(registry.findByParams({ mode: 'minor' })).toHaveLength(1)
  })

  it('rechaza un registro con ids duplicados', () => {
    expect(() => createSkillRegistry([BASE_ITEM, { ...BASE_ITEM, lessonIds: [] }])).toThrow(
      'Habilidad duplicada en el registro',
    )
  })
})
