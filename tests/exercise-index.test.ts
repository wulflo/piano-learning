import { describe, expect, it } from 'vitest'
import rawIndex from '../src/content/exercise-index.json'
import { pickExerciseIdsForSkills } from '../src/content/exercise-catalog'
import { ExerciseIndexSchema } from '../src/schemas'
import { validateContentBundle } from '../src/content/validate'
import { buildExerciseIndex } from '../scripts/lib/exercise-index'
import { loadContentFromDisk } from '../scripts/lib/load-content'

describe('índice liviano de ejercicios', () => {
  it('el JSON commiteado coincide con el contenido actual', async () => {
    const raw = await loadContentFromDisk()
    const result = validateContentBundle(raw)
    expect(result.ok).toBe(true)
    expect(result.bundle).toBeDefined()

    const expected = buildExerciseIndex(result.bundle!)
    expect(rawIndex).toEqual(expected)
    expect(ExerciseIndexSchema.parse(rawIndex)).toEqual(expected)
  })

  it('todos los ejercicios y habilidades del índice existen y son únicos', async () => {
    const raw = await loadContentFromDisk()
    const result = validateContentBundle(raw)
    const bundle = result.bundle!
    const index = ExerciseIndexSchema.parse(rawIndex)

    expect(index.exercises).toHaveLength(bundle.exercises.length)
    expect(new Set(index.exercises.map((entry) => entry.id)).size).toBe(
      index.exercises.length,
    )

    const skillIds = new Set(bundle.skills.map((skill) => skill.id))
    for (const entry of index.exercises) {
      expect(skillIds.has(entry.skillId)).toBe(true)
      expect(entry.difficulty).toBeGreaterThanOrEqual(1)
      expect(entry.difficulty).toBeLessThanOrEqual(5)
    }
  })

  it('elige como máximo tres ejercicios por habilidad y reparte dificultades', () => {
    const index = ExerciseIndexSchema.parse({
      schemaVersion: 1,
      exercises: [
        { id: 'ex.a', skillId: 'skill.one', difficulty: 1 },
        { id: 'ex.b', skillId: 'skill.one', difficulty: 2 },
        { id: 'ex.c', skillId: 'skill.one', difficulty: 3 },
        { id: 'ex.d', skillId: 'skill.one', difficulty: 4 },
        { id: 'ex.e', skillId: 'skill.one', difficulty: 5 },
        { id: 'ex.f', skillId: 'skill.two', difficulty: 2 },
      ],
    })

    expect(
      pickExerciseIdsForSkills(index, ['skill.one'], { perSkill: 3 }),
    ).toHaveLength(3)
    expect(
      pickExerciseIdsForSkills(index, ['skill.one'], {
        perSkill: 3,
        maxTotal: 2,
      }),
    ).toHaveLength(2)
    expect(
      pickExerciseIdsForSkills(index, ['skill.one', 'skill.two'], {
        perSkill: 1,
        maxTotal: 3,
      }),
    ).toEqual(['ex.c', 'ex.f'])
  })

  it('omite habilidades sin ejercicios sin romper la selección', () => {
    const index = ExerciseIndexSchema.parse({
      schemaVersion: 1,
      exercises: [{ id: 'ex.a', skillId: 'skill.one', difficulty: 1 }],
    })

    expect(
      pickExerciseIdsForSkills(index, ['skill.empty', 'skill.one']),
    ).toEqual(['ex.a'])
    expect(pickExerciseIdsForSkills(index, [])).toEqual([])
  })
})
