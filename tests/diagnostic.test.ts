import { describe, expect, it } from 'vitest'
import { MODULE_IDS } from '../src/schemas'
import {
  DIAGNOSTIC_BANDS,
  DIAGNOSTIC_ITEMS,
  DIAGNOSTIC_MAX,
  scoreDiagnostic,
} from '../src/content/diagnostic'

function answersFor(optionId: string): Record<string, string> {
  return Object.fromEntries(DIAGNOSTIC_ITEMS.map((item) => [item.id, optionId]))
}

describe('diagnóstico inicial', () => {
  it('tiene 8 ítems únicos con tres opciones y un máximo de 16 puntos', () => {
    expect(DIAGNOSTIC_ITEMS).toHaveLength(8)
    expect(new Set(DIAGNOSTIC_ITEMS.map((item) => item.id)).size).toBe(8)
    expect(DIAGNOSTIC_MAX).toBe(16)

    for (const item of DIAGNOSTIC_ITEMS) {
      expect(item.questionEs.trim().length).toBeGreaterThan(0)
      expect(item.options).toHaveLength(3)
      expect(new Set(item.options.map((option) => option.id)).size).toBe(3)
      expect(item.options.map((option) => option.points).sort()).toEqual([0, 1, 2])
    }
  })

  it('todas las respuestas correctas sugieren M3 sin bloquear', () => {
    const result = scoreDiagnostic(answersFor('yes'))

    expect(result.total).toBe(16)
    expect(result.max).toBe(16)
    expect(result.answered).toBe(8)
    expect(result.complete).toBe(true)
    expect(result.suggestedModuleId).toBe('M3')
    expect(result.blocking).toBe(false)
  })

  it('un resultado bajo sugiere empezar por M0', () => {
    const result = scoreDiagnostic(answersFor('no'))

    expect(result.total).toBe(0)
    expect(result.complete).toBe(true)
    expect(result.suggestedModuleId).toBe('M0')
  })

  it('las bandas intermedias sugieren M1 y M2', () => {
    expect(scoreDiagnostic(answersFor('with-help')).suggestedModuleId).toBe('M1')

    const mixed: Record<string, string> = {}
    for (const [index, item] of DIAGNOSTIC_ITEMS.entries()) {
      mixed[item.id] = index < 6 ? 'yes' : 'no'
    }
    const result = scoreDiagnostic(mixed)
    expect(result.total).toBe(12)
    expect(result.suggestedModuleId).toBe('M2')
  })

  it('acepta respuestas parciales sin bloquear', () => {
    const result = scoreDiagnostic({ [DIAGNOSTIC_ITEMS[0].id]: 'yes' })

    expect(result.answered).toBe(1)
    expect(result.complete).toBe(false)
    expect(result.total).toBe(2)
    expect(result.blocking).toBe(false)
    expect(result.summaryEs).toContain('Resultado parcial')
  })

  it('ignora claves desconocidas y rechaza opciones inválidas', () => {
    expect(() =>
      scoreDiagnostic({ ...answersFor('yes'), 'diag.inexistente': 'yes' }),
    ).not.toThrow()

    expect(() =>
      scoreDiagnostic({ [DIAGNOSTIC_ITEMS[0].id]: 'maybe' }),
    ).toThrow(/Opción inválida/)
  })

  it('las bandas cubren todo el rango y apuntan a módulos existentes', () => {
    const covered = new Set<number>()
    for (const band of DIAGNOSTIC_BANDS) {
      expect(MODULE_IDS).toContain(band.moduleId)
      for (let score = band.min; score <= band.max; score += 1) {
        covered.add(score)
      }
    }

    for (let score = 0; score <= DIAGNOSTIC_MAX; score += 1) {
      expect(covered.has(score), `Puntaje sin banda: ${score}`).toBe(true)
    }
  })
})
