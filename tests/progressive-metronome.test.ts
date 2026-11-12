import { describe, expect, it } from 'vitest'
import { ProgressDataSchema, SkillProgressSchema } from '../src/schemas'
import { createProgressDatabase } from '../src/state/db'
import {
  completeMetronomeRepetition,
  createProgressiveMetronome,
  DEFAULT_PROGRESSIVE_METRONOME,
  MAX_PROGRESSIVE_BPM,
  metronomeModeLabel,
  metronomeProgress,
  MIN_PROGRESSIVE_BPM,
  normalizeProgressiveMetronomeConfig,
  repetitionsUntilIncrease,
  resetMetronome,
  setMetronomeMode,
  setMetronomeTempo,
} from '../src/state/progressive-metronome'
import { createProgressRepositories } from '../src/state/repositories'
import {
  maxTempoOf,
  recordMaxTempo,
  recordMetronomeMaxTempo,
} from '../src/state/tempo-record'

let databaseCounter = 0

function uniqueDatabaseName(): string {
  databaseCounter += 1
  return `pdc.test.progressive-metronome.${databaseCounter}`
}

function stateAt(startBpm: number, targetBpm: number) {
  return createProgressiveMetronome({
    startBpm,
    targetBpm,
    stepBpm: 6,
    repetitionsPerStep: 2,
  })
}

describe('F5-020 — Metrónomo progresivo', () => {
  it('parte del tempo inicial y conserva el récord guardado', () => {
    const state = createProgressiveMetronome(
      {
        startBpm: 60,
        targetBpm: 120,
        stepBpm: 5,
        repetitionsPerStep: 3,
      },
      { maxBpm: 96 },
    )

    expect(state.bpm).toBe(60)
    expect(state.repetitions).toBe(0)
    expect(state.maxBpm).toBe(96)
    expect(state.targetReached).toBe(false)
    expect(state.config).toEqual({
      startBpm: 60,
      targetBpm: 120,
      stepBpm: 5,
      repetitionsPerStep: 3,
    })
  })

  it('sube un paso cada N repeticiones hasta el objetivo', () => {
    let state = stateAt(60, 72)

    state = completeMetronomeRepetition(state)
    expect(state.bpm).toBe(60)
    expect(state.repetitions).toBe(1)

    state = completeMetronomeRepetition(state)
    expect(state.bpm).toBe(66)
    expect(state.repetitions).toBe(0)
    expect(state.maxBpm).toBe(66)

    state = completeMetronomeRepetition(state)
    expect(state.bpm).toBe(66)
    state = completeMetronomeRepetition(state)
    expect(state.bpm).toBe(72)
    expect(state.targetReached).toBe(true)

    state = completeMetronomeRepetition(state)
    expect(state.bpm).toBe(72)
    expect(state.repetitions).toBe(0)
    expect(state.targetReached).toBe(true)
    expect(state.maxBpm).toBe(72)
  })

  it('nunca supera el objetivo aunque el paso sea mayor que la subida total', () => {
    const state = createProgressiveMetronome({
      startBpm: 100,
      targetBpm: 110,
      stepBpm: 40,
      repetitionsPerStep: 1,
    })

    const next = completeMetronomeRepetition(state)
    expect(next.bpm).toBe(110)
    expect(next.targetReached).toBe(true)
    expect(next.maxBpm).toBe(110)
  })

  it('en modo manual cuenta repeticiones pero no cambia el tempo solo', () => {
    let state = createProgressiveMetronome(
      { startBpm: 60, targetBpm: 120, stepBpm: 6, repetitionsPerStep: 1 },
      { mode: 'manual' },
    )

    for (let index = 0; index < 5; index += 1) {
      state = completeMetronomeRepetition(state)
    }

    expect(state.bpm).toBe(60)
    expect(state.repetitions).toBe(5)
    expect(state.maxBpm).toBe(60)
    expect(state.targetReached).toBe(false)
    expect(repetitionsUntilIncrease(state)).toBe(
      state.config.repetitionsPerStep,
    )

    state = setMetronomeTempo(state, 90)
    expect(state.bpm).toBe(90)
    expect(state.mode).toBe('manual')
    expect(state.repetitions).toBe(0)
    expect(state.maxBpm).toBe(90)
  })

  it('el fallback manual acepta saltos y limita el tempo al rango del motor', () => {
    const state = stateAt(60, 120)

    const high = setMetronomeTempo(state, 300)
    expect(high.bpm).toBe(MAX_PROGRESSIVE_BPM)
    expect(high.maxBpm).toBe(MAX_PROGRESSIVE_BPM)

    const low = setMetronomeTempo(high, 10)
    expect(low.bpm).toBe(MIN_PROGRESSIVE_BPM)
    expect(low.maxBpm).toBe(MAX_PROGRESSIVE_BPM)

    const unchanged = setMetronomeTempo(low, Number.NaN)
    expect(unchanged.bpm).toBe(low.bpm)

    const manual = setMetronomeMode(state, 'manual')
    expect(manual.mode).toBe('manual')
    expect(manual.bpm).toBe(state.bpm)
    expect(setMetronomeMode(manual, 'automatic').mode).toBe('automatic')
  })

  it('reset vuelve al inicio y conserva el récord salvo que se pida borrarlo', () => {
    let state = stateAt(60, 120)
    state = completeMetronomeRepetition(state)
    state = completeMetronomeRepetition(state)
    expect(state.maxBpm).toBe(66)

    const reset = resetMetronome(state)
    expect(reset.bpm).toBe(60)
    expect(reset.repetitions).toBe(0)
    expect(reset.maxBpm).toBe(66)
    expect(reset.targetReached).toBe(false)

    const cleared = resetMetronome(state, { keepMaxBpm: false })
    expect(cleared.maxBpm).toBe(60)
  })

  it('normaliza configuraciones inválidas sin lanzar', () => {
    const config = normalizeProgressiveMetronomeConfig({
      startBpm: 200,
      targetBpm: 80,
      stepBpm: 0,
      repetitionsPerStep: 0,
    })
    expect(config.startBpm).toBe(200)
    expect(config.targetBpm).toBe(200)
    expect(config.stepBpm).toBe(1)
    expect(config.repetitionsPerStep).toBe(1)

    const extreme = normalizeProgressiveMetronomeConfig({
      startBpm: 10,
      targetBpm: 900,
      stepBpm: 999,
      repetitionsPerStep: 999,
    })
    expect(extreme.startBpm).toBe(MIN_PROGRESSIVE_BPM)
    expect(extreme.targetBpm).toBe(MAX_PROGRESSIVE_BPM)
    expect(extreme.stepBpm).toBe(MAX_PROGRESSIVE_BPM - MIN_PROGRESSIVE_BPM)
    expect(extreme.repetitionsPerStep).toBe(20)

    expect(normalizeProgressiveMetronomeConfig({})).toEqual(
      DEFAULT_PROGRESSIVE_METRONOME,
    )

    const sameStartAndTarget = createProgressiveMetronome({
      startBpm: 80,
      targetBpm: 80,
    })
    expect(sameStartAndTarget.targetReached).toBe(true)
    expect(metronomeProgress(sameStartAndTarget)).toBe(1)
    expect(repetitionsUntilIncrease(sameStartAndTarget)).toBe(0)
  })

  it('calcula el progreso hacia el objetivo y la etiqueta del modo', () => {
    const state = stateAt(60, 120)
    expect(metronomeProgress(state)).toBe(0)
    expect(
      metronomeProgress(setMetronomeTempo(state, 90)),
    ).toBeCloseTo(0.5, 9)
    expect(metronomeProgress(setMetronomeTempo(state, 130))).toBe(1)

    expect(metronomeModeLabel('automatic')).toBe('Automático')
    expect(metronomeModeLabel('manual', 'en')).toBe('Manual')
  })
})

describe('F5-020 — Registro del tempo máximo', () => {
  it('crea la fila de la habilidad y guarda el récord', async () => {
    const repositories = createProgressRepositories(
      createProgressDatabase({ name: uniqueDatabaseName() }),
    )

    try {
      const result = await recordMaxTempo(repositories, 'skill.arpeggio', 96)

      expect(result.improved).toBe(true)
      expect(result.maxTempoBpm).toBe(96)
      expect(result.progress.maxTempoBpm).toBe(96)
      expect(result.progress.mastery).toBe(0)
      expect(await repositories.skills.get('skill.arpeggio')).toMatchObject({
        maxTempoBpm: 96,
      })
    } finally {
      repositories.close()
    }
  })

  it('nunca baja el récord y conserva la maestría y los aciertos', async () => {
    const repositories = createProgressRepositories(
      createProgressDatabase({ name: uniqueDatabaseName() }),
    )

    try {
      await repositories.skills.put('skill.arpeggio', {
        mastery: 0.6,
        correct: 12,
        incorrect: 2,
        maxTempoBpm: 96,
      })

      const lower = await recordMaxTempo(repositories, 'skill.arpeggio', 80)
      expect(lower.improved).toBe(false)
      expect(lower.maxTempoBpm).toBe(96)
      expect(lower.progress.mastery).toBe(0.6)

      const same = await recordMaxTempo(repositories, 'skill.arpeggio', 96)
      expect(same.improved).toBe(false)

      const higher = await recordMaxTempo(repositories, 'skill.arpeggio', 120)
      expect(higher.improved).toBe(true)
      expect(higher.maxTempoBpm).toBe(120)
      expect(higher.progress).toMatchObject({
        mastery: 0.6,
        correct: 12,
        incorrect: 2,
        maxTempoBpm: 120,
      })
      expect(maxTempoOf(await repositories.skills.get('skill.arpeggio'))).toBe(
        120,
      )
    } finally {
      repositories.close()
    }
  })

  it('guarda el récord de una sesión del metrónomo progresivo', async () => {
    const repositories = createProgressRepositories(
      createProgressDatabase({ name: uniqueDatabaseName() }),
    )

    try {
      let state = stateAt(60, 120)
      state = setMetronomeTempo(state, 108)
      const result = await recordMetronomeMaxTempo(
        repositories,
        'skill.arpeggio',
        state,
      )

      expect(result.improved).toBe(true)
      expect(result.maxTempoBpm).toBe(108)
      expect(maxTempoOf(await repositories.skills.get('skill.arpeggio'))).toBe(
        108,
      )
    } finally {
      repositories.close()
    }
  })

  it('rechaza ids inválidos y tempos no finitos sin escribir nada', async () => {
    const repositories = createProgressRepositories(
      createProgressDatabase({ name: uniqueDatabaseName() }),
    )

    try {
      await expect(
        recordMaxTempo(repositories, 'id con espacios', 96),
      ).rejects.toThrow()
      await expect(
        recordMaxTempo(repositories, 'skill.arpeggio', Number.NaN),
      ).rejects.toThrow(/Tempo inválido/)
      expect(await repositories.skills.all()).toEqual([])
    } finally {
      repositories.close()
    }
  })

  it('el récord viaja en los datos exportables', () => {
    const data = ProgressDataSchema.parse({
      schemaVersion: 1,
      skills: {
        'skill.arpeggio': {
          mastery: 0.4,
          correct: 5,
          incorrect: 1,
          maxTempoBpm: 112,
        },
      },
    })

    expect(data.skills['skill.arpeggio']?.maxTempoBpm).toBe(112)
    expect(
      SkillProgressSchema.parse({ maxTempoBpm: 112 }).maxTempoBpm,
    ).toBe(112)
  })
})
