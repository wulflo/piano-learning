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
  const found = bundle.lessons.find((item) => item.id === 'lesson.m1-07')
  if (!found) throw new Error('Falta la lección M1-07')
  lesson = found
})

describe('M1-07 — Puntillo, ligadura y tresillo', () => {
  it('está publicada, validada y depende de M1-06', () => {
    expect(lesson.moduleId).toBe('M1')
    expect(lesson.status).toBe('published')
    expect(lesson.prerequisites).toContain('lesson.m1-06')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
    expect(lesson.skillIds).toContain('skill.rhythm-variants')
  })

  it('explica puntillo, ligadura y tresillo en compás simple y compuesto', () => {
    const text = lesson.sections
      .map((section) => section.bodyEs ?? '')
      .join(' ')
      .toLowerCase()

    for (const term of [
      'puntillo',
      'ligadura',
      'tresillo',
      '4/4',
      '6/8',
      'tiempo de dos',
      'subdivisión',
      'pulso',
    ]) {
      expect(text, `Falta el concepto: ${term}`).toContain(term)
    }
  })

  it('incluye demos en 4/4 y 6/8', () => {
    const signatures = scoreSections(lesson).map(
      (score) => `${score.timeSignature.numerator}/${score.timeSignature.denominator}`,
    )

    expect(new Set(signatures)).toEqual(new Set(['4/4', '6/8']))
    for (const score of scoreSections(lesson)) {
      expect(score.tempoBpm).toBe(80)
    }
  })

  it('los compases de las demos y de la tarea están completos', () => {
    const task = lesson.keyboardTask
    if (!task?.demoScore) throw new Error('La tarea no tiene demoScore')

    for (const score of [...scoreSections(lesson), task.demoScore]) {
      for (const total of measureTotals(score).values()) {
        expect(total).toBeCloseTo(capacity(score.timeSignature))
      }
    }
  })

  it('la demo de puntillo usa una blanca con puntillo de tres tiempos', () => {
    const dotted = scoreSections(lesson).find(
      (score) =>
        score.timeSignature.numerator === 4 &&
        score.events.some((event) => event.value.dots === 1),
    )
    if (!dotted) throw new Error('Falta la demo de puntillo')

    const [first, second] = [...dotted.events].sort((a, b) => a.beat - b.beat)
    expect(first.value).toMatchObject({ duration: 'half', dots: 1 })
    expect(cellBeats(first.value)).toBeCloseTo(3)
    expect(cellBeats(second.value)).toBeCloseTo(1)
  })

  it('la ligadura une dos Do4 a través de la barra y suma cuatro tiempos', () => {
    const tied = scoreSections(lesson).find((score) =>
      score.events.some((event) => event.tieToNext),
    )
    if (!tied) throw new Error('Falta la demo de ligadura')

    const source = tied.events.find((event) => event.tieToNext)
    if (!source) throw new Error('Falta la nota de origen de la ligadura')
    const pitch = source.pitches[0]
    const target = tied.events.find(
      (event) =>
        event !== source &&
        event.measure > source.measure &&
        event.pitches.some(
          (candidate) =>
            candidate.step === pitch.step &&
            candidate.accidental === pitch.accidental &&
            candidate.octave === pitch.octave,
        ),
    )
    if (!target) throw new Error('Falta la nota de destino de la ligadura')

    expect(source.measure).toBe(1)
    expect(source.beat).toBe(2)
    expect(target.measure).toBe(2)
    expect(target.beat).toBe(0)
    expect(cellBeats(source.value) + cellBeats(target.value)).toBeCloseTo(4)
  })

  it('el tresillo de 4/4 ocupa un pulso con tres corcheas', () => {
    const simple = scoreSections(lesson).find(
      (score) =>
        score.timeSignature.numerator === 4 &&
        score.events.some((event) => event.value.tuplet === 'triplet'),
    )
    if (!simple) throw new Error('Falta el tresillo de 4/4')

    const triplets = simple.events
      .filter((event) => event.value.tuplet === 'triplet')
      .sort((a, b) => a.beat - b.beat)

    expect(triplets).toHaveLength(3)
    for (const event of triplets) {
      expect(event.value.duration).toBe('eighth')
      expect(cellBeats(event.value)).toBeCloseTo(1 / 3)
    }
    expect(triplets[0].beat).toBeCloseTo(0)
    expect(triplets[1].beat).toBeCloseTo(1 / 3)
    expect(triplets[2].beat).toBeCloseTo(2 / 3)
    expect(triplets.reduce((sum, event) => sum + cellBeats(event.value), 0)).toBeCloseTo(1)
  })

  it('el tresillo de 6/8 usa negras en el tiempo de dos negras', () => {
    const compound = scoreSections(lesson).find(
      (score) =>
        score.timeSignature.numerator === 6 &&
        score.events.some((event) => event.value.tuplet === 'triplet'),
    )
    if (!compound) throw new Error('Falta el tresillo de 6/8')

    const triplets = compound.events
      .filter((event) => event.value.tuplet === 'triplet')
      .sort((a, b) => a.beat - b.beat)

    expect(triplets).toHaveLength(3)
    for (const event of triplets) {
      expect(event.value.duration).toBe('quarter')
      expect(cellBeats(event.value)).toBeCloseTo(2 / 3)
    }
    expect(triplets[0].beat).toBeCloseTo(0)
    expect(triplets[1].beat).toBeCloseTo(2 / 3)
    expect(triplets[2].beat).toBeCloseTo(4 / 3)
    expect(triplets.reduce((sum, event) => sum + cellBeats(event.value), 0)).toBeCloseTo(2)
  })

  it('calcula duraciones de audio exactas para puntillo, ligadura y tresillo', () => {
    const beat = beatDuration(80)

    const dotted = scoreSections(lesson).find((score) =>
      score.events.some((event) => event.value.dots === 1),
    )
    if (!dotted) throw new Error('Falta la demo de puntillo')
    expect(cellBeats(dotted.events[0].value) * beat).toBeCloseTo(2.25)

    const simple = scoreSections(lesson).find(
      (score) =>
        score.timeSignature.numerator === 4 &&
        score.events.some((event) => event.value.tuplet === 'triplet'),
    )
    if (!simple) throw new Error('Falta el tresillo de 4/4')
    const triplet = simple.events.find((event) => event.value.tuplet === 'triplet')
    if (!triplet) throw new Error('Falta una corchea de tresillo')
    expect(cellBeats(triplet.value) * beat).toBeCloseTo(0.25)

    const tied = scoreSections(lesson).find((score) =>
      score.events.some((event) => event.tieToNext),
    )
    if (!tied) throw new Error('Falta la demo de ligadura')
    const source = tied.events.find((event) => event.tieToNext)
    if (!source) throw new Error('Falta la nota de origen de la ligadura')
    const pitch = source.pitches[0]
    const target = tied.events.find(
      (event) =>
        event !== source &&
        event.measure > source.measure &&
        event.pitches.some(
          (candidate) =>
            candidate.step === pitch.step &&
            candidate.accidental === pitch.accidental &&
            candidate.octave === pitch.octave,
        ),
    )
    if (!target) throw new Error('Falta la nota de destino de la ligadura')
    expect((cellBeats(source.value) + cellBeats(target.value)) * beat).toBeCloseTo(3)
  })

  it('los ejercicios de completar cubren puntillo y tresillo en 4/4 y 6/8', () => {
    const completions = lesson.exerciseIds
      .map((id) => bundle.exercises.find((item) => item.id === id))
      .filter((exercise) => exercise?.type === 'rhythm-completion')

    expect(completions.length).toBeGreaterThanOrEqual(4)

    const signatures = new Set<string>()
    for (const exercise of completions) {
      if (!exercise || exercise.type !== 'rhythm-completion') continue

      signatures.add(
        `${exercise.timeSignature.numerator}/${exercise.timeSignature.denominator}`,
      )
      expect(exercise.missingIndex).toBeGreaterThanOrEqual(0)
      expect(exercise.missingIndex).toBeLessThan(exercise.pattern.length)

      const total = exercise.pattern.reduce((sum, cell) => sum + cellBeats(cell), 0)
      expect(total, `Compás incompleto en ${exercise.id}`).toBeCloseTo(
        capacity(exercise.timeSignature),
      )

      const answer = cellLabel(exercise.pattern[exercise.missingIndex])
      expect(exercise.choices, `Falta la respuesta en ${exercise.id}`).toContain(answer)
      expect(exercise.explanationEs.toLowerCase()).toContain(answer.toLowerCase())
    }

    expect(signatures).toEqual(new Set(['4/4', '6/8']))
  })

  it('los dictados rítmicos usan secuencias completas y opciones válidas', () => {
    const dictations = lesson.exerciseIds
      .map((id) => bundle.exercises.find((item) => item.id === id))
      .filter((exercise) => exercise?.type === 'rhythm-dictation')

    expect(dictations).toHaveLength(2)

    for (const exercise of dictations) {
      if (!exercise || exercise.type !== 'rhythm-dictation') continue

      const total = exercise.pattern.reduce((sum, cell) => sum + cellBeats(cell), 0)
      expect(total, `Compás incompleto en ${exercise.id}`).toBeCloseTo(
        capacity(exercise.timeSignature),
      )

      const sequence = exercise.pattern.map(cellLabel).join(', ')
      expect(exercise.choices, `Falta la secuencia en ${exercise.id}`).toContain(sequence)
      expect(exercise.explanationEs.toLowerCase()).toContain('tiempo')
    }
  })

  it('incluye una tarea con puntillo, tresillo y checklist', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.keys.map((key) => `${key.step}${key.accidental}${key.octave}`)).toEqual([
      'C4',
    ])
    expect(task?.tempoBpm).toBe(80)
    expect(task?.instructionsEs.toLowerCase()).toContain('puntillo')
    expect(task?.instructionsEs.toLowerCase()).toContain('tresillo')
    expect(task?.instructionsEs.toLowerCase()).toContain('4/4')
    expect(task?.checklistEs.length).toBeGreaterThanOrEqual(3)

    const demo = task?.demoScore
    if (!demo) throw new Error('La tarea no tiene demoScore')
    expect(demo.timeSignature).toEqual({ numerator: 4, denominator: 4 })
    expect(demo.events.some((event) => event.value.dots === 1)).toBe(true)
    expect(demo.events.some((event) => event.value.tuplet === 'triplet')).toBe(true)
    expect([...measureTotals(demo).values()]).toEqual([4, 4])
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
