import { beforeAll, describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { beatDuration } from '../src/audio/notes'
import { validateContentBundle } from '../src/content/validate'
import type {
  ContentBundle,
  DurationName,
  Lesson,
  RhythmicValue,
  RhythmCell,
  Score,
  TimeSignature,
} from '../src/schemas'

const DURATION_BEATS: Record<DurationName, number> = {
  whole: 4,
  half: 2,
  quarter: 1,
  eighth: 0.5,
  sixteenth: 0.25,
  'thirty-second': 0.125,
}

const DURATION_LABEL: Record<DurationName, string> = {
  whole: 'Redonda',
  half: 'Blanca',
  quarter: 'Negra',
  eighth: 'Corchea',
  sixteenth: 'Semicorchea',
  'thirty-second': 'Treintaidosavo (fusa)',
}

const REST_LABEL: Record<DurationName, string> = {
  whole: 'Silencio de redonda',
  half: 'Silencio de blanca',
  quarter: 'Silencio de negra',
  eighth: 'Silencio de corchea',
  sixteenth: 'Silencio de semicorchea',
  'thirty-second': 'Silencio de treintaidosavo',
}

function cellBeats(cell: RhythmicValue): number {
  const base = DURATION_BEATS[cell.duration]
  const dotted = base * (2 - Math.pow(2, -cell.dots))
  return cell.tuplet === 'triplet' ? dotted * (2 / 3) : dotted
}

function capacity(timeSignature: TimeSignature): number {
  return timeSignature.numerator * (4 / timeSignature.denominator)
}

function cellLabel(cell: RhythmCell): string {
  if (cell.rest) return REST_LABEL[cell.duration]
  const dots =
    cell.dots === 1 ? ' con puntillo' : cell.dots === 2 ? ' con doble puntillo' : ''
  const tuplet = cell.tuplet === 'triplet' ? ' de tresillo' : ''
  return `${DURATION_LABEL[cell.duration]}${dots}${tuplet}`
}

function sumCells(cells: RhythmCell[]): number {
  return cells.reduce((sum, cell) => sum + cellBeats(cell), 0)
}

function scoreSections(lesson: Lesson): Score[] {
  return lesson.sections
    .filter((section) => section.kind === 'score' && section.score)
    .map((section) => section.score as Score)
}

function measureTotals(score: Score): Map<number, number> {
  const totals = new Map<number, number>()
  for (const event of score.events) {
    totals.set(event.measure, (totals.get(event.measure) ?? 0) + cellBeats(event.value))
  }
  return totals
}

let bundle: ContentBundle
let lesson: Lesson

beforeAll(async () => {
  const result = validateContentBundle(await loadContentFromDisk())
  expect(result.ok).toBe(true)
  if (!result.bundle) throw new Error('El contenido del repositorio no es válido')
  bundle = result.bundle
  const found = bundle.lessons.find((item) => item.id === 'lesson.m1-08')
  if (!found) throw new Error('Falta la lección M1-08')
  lesson = found
})

describe('M1-08 — Síncopa y anacrusa', () => {
  it('está publicada, validada y depende de M1-07', () => {
    expect(lesson.moduleId).toBe('M1')
    expect(lesson.status).toBe('published')
    expect(lesson.prerequisites).toContain('lesson.m1-07')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
    expect(lesson.skillIds).toContain('skill.syncopation')
  })

  it('explica síncopa, anacrusa, contratiempo y metrónomo', () => {
    const text = lesson.sections
      .map((section) => section.bodyEs ?? '')
      .join(' ')
      .toLowerCase()

    for (const term of [
      'síncopa',
      'anacrusa',
      'contratiempo',
      '4/4',
      'pulso fuerte',
      'parte débil',
      'metrónomo',
      'compás 1',
    ]) {
      expect(text, `Falta el concepto: ${term}`).toContain(term)
    }
  })

  it('incluye demos en 4/4 a 80 BPM', () => {
    const scores = scoreSections(lesson)
    expect(scores.length).toBeGreaterThanOrEqual(2)
    for (const score of scores) {
      expect(score.timeSignature).toEqual({ numerator: 4, denominator: 4 })
      expect(score.tempoBpm).toBe(80)
    }
  })

  it('la demo de síncopa tiene notas que cruzan los pulsos fuertes', () => {
    const syncopated = scoreSections(lesson).find((score) =>
      score.events.some((event) => event.beat === 0.5 && cellBeats(event.value) === 1),
    )
    if (!syncopated) throw new Error('Falta la demo de síncopa')

    expect([...measureTotals(syncopated).values()]).toEqual([4])

    const offbeats = syncopated.events.filter(
      (event) => event.beat === 0.5 || event.beat === 1.5 || event.beat === 2.5,
    )
    expect(offbeats).toHaveLength(3)
    for (const event of offbeats) {
      expect(cellBeats(event.value)).toBeCloseTo(1)
      expect(event.beat + cellBeats(event.value)).toBeGreaterThan(
        Math.floor(event.beat) + 1,
      )
    }
  })

  it('la demo de anacrusa compensa el compás inicial con el final', () => {
    const anacrusis = scoreSections(lesson).find((score) =>
      score.events.some((event) => event.measure === 3),
    )
    if (!anacrusis) throw new Error('Falta la demo de anacrusa')

    const totals = measureTotals(anacrusis)
    const full = capacity(anacrusis.timeSignature)
    const pickup = totals.get(1) ?? 0
    const firstFull = totals.get(2) ?? 0
    const final = totals.get(3) ?? 0

    expect(pickup).toBeGreaterThan(0)
    expect(pickup).toBeLessThan(full)
    expect(firstFull).toBeCloseTo(full)
    expect(final).toBeCloseTo(full - pickup)
  })

  it('calcula duraciones de audio para la síncopa y la anacrusa', () => {
    const beat = beatDuration(80)

    const syncopated = scoreSections(lesson).find((score) =>
      score.events.some((event) => event.beat === 0.5),
    )
    if (!syncopated) throw new Error('Falta la demo de síncopa')
    const syncNote = syncopated.events.find((event) => event.beat === 0.5)
    if (!syncNote) throw new Error('Falta la nota sincopada')
    expect(cellBeats(syncNote.value) * beat).toBeCloseTo(0.75)

    const anacrusis = scoreSections(lesson).find((score) =>
      score.events.some((event) => event.measure === 3),
    )
    if (!anacrusis) throw new Error('Falta la demo de anacrusa')
    const pickup = anacrusis.events.find((event) => event.measure === 1)
    const final = anacrusis.events.find((event) => event.measure === 3)
    if (!pickup || !final) throw new Error('Falta la anacrusa o el compás final')
    expect(cellBeats(pickup.value) * beat).toBeCloseTo(0.75)
    expect(cellBeats(final.value) * beat).toBeCloseTo(2.25)
  })

  it('el dictado identifica una secuencia con síncopa', () => {
    const dictations = lesson.exerciseIds
      .map((id) => bundle.exercises.find((item) => item.id === id))
      .filter((exercise) => exercise?.type === 'rhythm-dictation')

    expect(dictations).toHaveLength(1)

    for (const exercise of dictations) {
      if (!exercise || exercise.type !== 'rhythm-dictation') continue

      expect(sumCells(exercise.pattern)).toBeCloseTo(capacity(exercise.timeSignature))
      const sequence = exercise.pattern.map(cellLabel).join(', ')
      expect(exercise.choices).toContain(sequence)
      expect(exercise.explanationEs.toLowerCase()).toContain('síncopa')
    }
  })

  it('los ejercicios de completar mantienen la síncopa y el compás completo', () => {
    const completions = lesson.exerciseIds
      .map((id) => bundle.exercises.find((item) => item.id === id))
      .filter((exercise) => exercise?.type === 'rhythm-completion')

    expect(completions).toHaveLength(1)

    for (const exercise of completions) {
      if (!exercise || exercise.type !== 'rhythm-completion') continue

      expect(sumCells(exercise.pattern)).toBeCloseTo(capacity(exercise.timeSignature))
      expect(exercise.missingIndex).toBeLessThan(exercise.pattern.length)
      const answer = cellLabel(exercise.pattern[exercise.missingIndex])
      expect(exercise.choices).toContain(answer)
      expect(exercise.explanationEs.toLowerCase()).toContain(answer.toLowerCase())
    }
  })

  it('los ejercicios de anacrusa compensan el compás final', () => {
    const anacrusis = lesson.exerciseIds
      .map((id) => bundle.exercises.find((item) => item.id === id))
      .filter((exercise) => exercise?.type === 'anacrusis-completion')

    expect(anacrusis).toHaveLength(3)

    for (const exercise of anacrusis) {
      if (!exercise || exercise.type !== 'anacrusis-completion') continue

      const full = capacity(exercise.timeSignature)
      const pickup = sumCells(exercise.pickup)
      expect(pickup).toBeGreaterThan(0)
      expect(pickup).toBeLessThan(full)
      expect(sumCells(exercise.pattern)).toBeCloseTo(full - pickup)

      expect(exercise.missingIndex).toBeGreaterThanOrEqual(0)
      expect(exercise.missingIndex).toBeLessThan(exercise.pattern.length)
      const answer = cellLabel(exercise.pattern[exercise.missingIndex])
      expect(exercise.choices).toContain(answer)
      expect(exercise.explanationEs.toLowerCase()).toContain(answer.toLowerCase())
    }
  })

  it('el ejercicio de metrónomo mantiene los acentos en 1 y 3', () => {
    const accents = lesson.exerciseIds
      .map((id) => bundle.exercises.find((item) => item.id === id))
      .filter((exercise) => exercise?.type === 'meter-accent')

    expect(accents).toHaveLength(1)

    for (const exercise of accents) {
      if (!exercise || exercise.type !== 'meter-accent') continue
      expect(exercise.accentedBeats).toEqual([1, 3])
      expect(exercise.choices?.at(0)).toBe('1 y 3')
    }
  })

  it('incluye una tarea con síncopa, anacrusa y checklist', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.keys.map((key) => `${key.step}${key.accidental}${key.octave}`)).toEqual([
      'C4',
    ])
    expect(task?.tempoBpm).toBe(80)
    for (const term of ['síncopa', 'anacrusa', 'metrónomo', '4/4']) {
      expect(
        task?.instructionsEs.toLowerCase(),
        `Falta el término en la tarea: ${term}`,
      ).toContain(term)
    }
    expect(task?.checklistEs.length).toBeGreaterThanOrEqual(3)

    const demo = task?.demoScore
    if (!demo) throw new Error('La tarea no tiene demoScore')
    expect(demo.timeSignature).toEqual({ numerator: 4, denominator: 4 })
    expect([...measureTotals(demo).values()]).toEqual([4])
    expect(demo.events.some((event) => event.beat === 0.5)).toBe(true)
    expect(demo.events.some((event) => event.beat === 1.5)).toBe(true)
    expect(demo.events.some((event) => event.beat === 2.5)).toBe(true)
  })

  it('rechaza un índice faltante fuera del patrón de anacrusa', async () => {
    const raw = await loadContentFromDisk()
    const base = validateContentBundle(raw).bundle
    if (!base) throw new Error('El contenido base debería ser válido')

    const fixture = structuredClone(base)
    const exercise = fixture.exercises.find(
      (item) => item.type === 'anacrusis-completion',
    )
    if (!exercise || exercise.type !== 'anacrusis-completion') {
      throw new Error('Falta un ejercicio de anacrusa')
    }
    exercise.missingIndex = 99

    const result = validateContentBundle(fixture)

    expect(result.ok).toBe(false)
    expect(
      result.issues.some((issue) => issue.message.includes('fuera del patrón')),
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
