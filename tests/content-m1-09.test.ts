import { beforeAll, describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { validateContentBundle } from '../src/content/validate'
import {
  DEFAULT_SETTINGS,
  loadSettings,
  normalizeSettings,
  saveSettings,
} from '../src/state/settings'
import {
  TEMPO_MARK_RANGES,
  type ContentBundle,
  type DurationName,
  type Lesson,
  type Score,
  type TempoMark,
} from '../src/schemas'

const DURATION_BEATS: Record<DurationName, number> = {
  whole: 4,
  half: 2,
  quarter: 1,
  eighth: 0.5,
  sixteenth: 0.25,
  'thirty-second': 0.125,
}

const TERM_LABEL: Record<TempoMark, string> = {
  grave: 'Grave',
  largo: 'Largo',
  lento: 'Lento',
  adagio: 'Adagio',
  andante: 'Andante',
  moderato: 'Moderato',
  allegretto: 'Allegretto',
  allegro: 'Allegro',
  vivace: 'Vivace',
  presto: 'Presto',
  prestissimo: 'Prestissimo',
}

function measureTotals(score: Score): Map<number, number> {
  const totals = new Map<number, number>()
  for (const event of score.events) {
    const beats = DURATION_BEATS[event.value.duration]
    totals.set(event.measure, (totals.get(event.measure) ?? 0) + beats)
  }
  return totals
}

function scoreSections(lesson: Lesson): Score[] {
  return lesson.sections
    .filter((section) => section.kind === 'score' && section.score)
    .map((section) => section.score as Score)
}

function pitchSequence(score: Score): string[] {
  return [...score.events]
    .sort((a, b) => a.measure - b.measure || a.beat - b.beat)
    .map((event) => `${event.pitches[0].step}${event.pitches[0].octave}`)
}

function MemoryStorage() {
  const map = new Map<string, string>()
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, value),
  }
}

let bundle: ContentBundle
let lesson: Lesson

beforeAll(async () => {
  const result = validateContentBundle(await loadContentFromDisk())
  expect(result.ok).toBe(true)
  if (!result.bundle) throw new Error('El contenido del repositorio no es válido')
  bundle = result.bundle
  const found = bundle.lessons.find((item) => item.id === 'lesson.m1-09')
  if (!found) throw new Error('Falta la lección M1-09')
  lesson = found
})

describe('M1-09 — Tempo y metrónomo', () => {
  it('está publicada, validada y depende de M1-08', () => {
    expect(lesson.moduleId).toBe('M1')
    expect(lesson.status).toBe('published')
    expect(lesson.prerequisites).toContain('lesson.m1-08')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
    expect(lesson.skillIds).toContain('skill.tempo')
  })

  it('explica términos de tempo, cambios y el rango 40-240 BPM', () => {
    const text = lesson.sections
      .map((section) => `${section.titleEs} ${section.bodyEs ?? ''}`)
      .join(' ')
      .toLowerCase()

    for (const term of [
      'grave',
      'largo',
      'lento',
      'adagio',
      'andante',
      'moderato',
      'allegretto',
      'allegro',
      'vivace',
      'presto',
      'prestissimo',
      'ritardando',
      'accelerando',
      'a tempo',
      'rubato',
      'bpm',
      '40',
      '240',
      'metrónomo',
      'estabilidad',
      'persistente',
    ]) {
      expect(text, `Falta el concepto: ${term}`).toContain(term)
    }
  })

  it('compara la misma melodía en andante y allegro', () => {
    const scores = scoreSections(lesson)
    expect(scores).toHaveLength(2)

    const tempos = scores.map((score) => score.tempoBpm).sort((a, b) => a - b)
    expect(tempos).toEqual([72, 132])

    for (const score of scores) {
      expect(score.timeSignature).toEqual({ numerator: 4, denominator: 4 })
      for (const total of measureTotals(score).values()) {
        expect(total).toBeCloseTo(4)
      }
    }

    expect(pitchSequence(scores[0])).toEqual(pitchSequence(scores[1]))
    expect(pitchSequence(scores[0])).toHaveLength(8)
  })

  it('los ejercicios de término asocian BPM y término dentro del rango', () => {
    const terms = lesson.exerciseIds
      .map((id) => bundle.exercises.find((item) => item.id === id))
      .filter((exercise) => exercise?.type === 'tempo-term')

    expect(terms).toHaveLength(4)

    for (const exercise of terms) {
      if (!exercise || exercise.type !== 'tempo-term') continue

      const range = TEMPO_MARK_RANGES[exercise.term]
      expect(exercise.bpm).toBeGreaterThanOrEqual(40)
      expect(exercise.bpm).toBeLessThanOrEqual(240)
      expect(
        exercise.bpm,
        `${exercise.bpm} BPM fuera del rango de ${exercise.term}`,
      ).toBeGreaterThanOrEqual(range.min)
      expect(exercise.bpm).toBeLessThanOrEqual(range.max)

      const label = TERM_LABEL[exercise.term]
      expect(exercise.choices, `Falta ${label} en ${exercise.id}`).toContain(label)
      expect(exercise.explanationEs.toLowerCase()).toContain(exercise.term)
    }
  })

  it('incluye dos ejercicios de estabilidad con tolerancia válida', () => {
    const stability = lesson.exerciseIds
      .map((id) => bundle.exercises.find((item) => item.id === id))
      .filter((exercise) => exercise?.type === 'tempo-stability')

    expect(stability).toHaveLength(2)

    for (const exercise of stability) {
      if (!exercise || exercise.type !== 'tempo-stability') continue

      expect(exercise.targetBpm).toBeGreaterThanOrEqual(40)
      expect(exercise.targetBpm).toBeLessThanOrEqual(240)
      expect(exercise.beats).toBeGreaterThanOrEqual(4)
      expect(exercise.toleranceBpm).toBeGreaterThanOrEqual(1)
      expect(exercise.targetBpm - exercise.toleranceBpm).toBeGreaterThanOrEqual(40)
      expect(exercise.targetBpm + exercise.toleranceBpm).toBeLessThanOrEqual(240)
      expect(exercise.explanationEs.toLowerCase()).toContain('tolerancia')
      expect(exercise.explanationEs).toContain(String(exercise.toleranceBpm))
    }

    expect(
      stability.map((exercise) =>
        exercise?.type === 'tempo-stability' ? exercise.targetBpm : null,
      ),
    ).toEqual([60, 120])
  })

  it('el control de tempo persiste y respeta los límites 40-240', () => {
    expect(normalizeSettings({ tempo: 999 }).tempo).toBe(240)
    expect(normalizeSettings({ tempo: 1 }).tempo).toBe(40)
    expect(normalizeSettings({ tempo: 60.4 }).tempo).toBe(60)

    const storage = MemoryStorage()
    saveSettings({ ...DEFAULT_SETTINGS, tempo: 132 }, storage)
    expect(loadSettings(storage).tempo).toBe(132)

    saveSettings({ ...DEFAULT_SETTINGS, tempo: 0 }, storage)
    expect(loadSettings(storage).tempo).toBe(40)
  })

  it('incluye una tarea de 16 pulsos estables a 60 BPM', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.tempoBpm).toBe(60)
    expect(task?.keys.map((key) => `${key.step}${key.accidental}${key.octave}`)).toEqual([
      'C4',
    ])

    for (const term of ['metrónomo', '60', '16 pulsos', 'estabilidad', 'tempo']) {
      expect(
        task?.instructionsEs.toLowerCase(),
        `Falta el término en la tarea: ${term}`,
      ).toContain(term)
    }
    expect(task?.checklistEs.length).toBeGreaterThanOrEqual(3)

    const demo = task?.demoScore
    if (!demo) throw new Error('La tarea no tiene demoScore')
    expect(demo.timeSignature).toEqual({ numerator: 4, denominator: 4 })
    expect(demo.tempoBpm).toBe(60)
    expect(demo.events).toHaveLength(16)
    expect(new Set(demo.events.map((event) => event.value.duration))).toEqual(
      new Set(['quarter']),
    )
    expect([...measureTotals(demo).values()]).toEqual([4, 4, 4, 4])
  })

  it('rechaza un BPM que no corresponde al término de tempo', async () => {
    const raw = await loadContentFromDisk()
    const base = validateContentBundle(raw).bundle
    if (!base) throw new Error('El contenido base debería ser válido')

    const fixture = structuredClone(base)
    const exercise = fixture.exercises.find((item) => item.id === 'ex.m1-09.a')
    if (!exercise || exercise.type !== 'tempo-term') {
      throw new Error('Falta el ejercicio de tempo')
    }
    exercise.bpm = 200

    const result = validateContentBundle(fixture)

    expect(result.ok).toBe(false)
    expect(
      result.issues.some((issue) =>
        issue.message.includes('no corresponde al término adagio'),
      ),
    ).toBe(true)
  })

  it('rechaza una tolerancia que sale del rango 40-240', async () => {
    const raw = await loadContentFromDisk()
    const base = validateContentBundle(raw).bundle
    if (!base) throw new Error('El contenido base debería ser válido')

    const fixture = structuredClone(base)
    const exercise = fixture.exercises.find(
      (item) => item.type === 'tempo-stability',
    )
    if (!exercise || exercise.type !== 'tempo-stability') {
      throw new Error('Falta un ejercicio de estabilidad')
    }
    exercise.targetBpm = 42
    exercise.toleranceBpm = 5

    const result = validateContentBundle(fixture)

    expect(result.ok).toBe(false)
    expect(
      result.issues.some((issue) => issue.message.includes('por debajo de 40 BPM')),
    ).toBe(true)
  })

  it('referencia solo habilidades y ejercicios existentes', () => {
    const skillIds = new Set(bundle.skills.map((skill) => skill.id))
    const exerciseIds = new Set(bundle.exercises.map((exercise) => exercise.id))

    for (const skillId of lesson.skillIds) {
      expect(skillIds.has(skillId), `Habilidad inexistente: ${skillId}`).toBe(true)
    }
    for (const exerciseId of lesson.exerciseIds) {
      expect(exerciseIds.has(exerciseId), `Ejercicio inexistente: ${exerciseId}`).toBe(
        true,
      )
    }
  })
})
