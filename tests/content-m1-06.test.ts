import { beforeAll, describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { validateContentBundle } from '../src/content/validate'
import { renderStaff, type StaffMeasure } from '../src/staff/render'
import type { StaffDuration } from '../src/staff/vex'
import { fromSpelledPitch } from '../src/theory/pitch'
import type {
  ContentBundle,
  DurationName,
  Lesson,
  RhythmicValue,
  RhythmCell,
  Score,
  TimeSignature,
} from '../src/schemas'

const STAFF_DURATION: Record<DurationName, StaffDuration> = {
  whole: 'w',
  half: 'h',
  quarter: 'q',
  eighth: '8',
  sixteenth: '16',
  'thirty-second': '32',
}

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

const COMPOUND_ACCENTS: Record<number, number[]> = {
  6: [1, 4],
  9: [1, 4, 7],
  12: [1, 4, 7, 10],
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
  const suffix =
    cell.dots === 1 ? ' con puntillo' : cell.dots === 2 ? ' con doble puntillo' : ''
  return `${DURATION_LABEL[cell.duration]}${suffix}`
}

function meterLabel(timeSignature: TimeSignature): string {
  const accents = COMPOUND_ACCENTS[timeSignature.numerator]
  if (!accents) {
    throw new Error(`Compás sin acentos compuestos: ${timeSignature.numerator}`)
  }
  const list =
    accents.length === 1
      ? String(accents[0])
      : `${accents.slice(0, -1).join(', ')} y ${accents.at(-1)}`
  return `${list}: inicio de cada grupo de tres corcheas`
}

function measuresFromScore(score: Score): StaffMeasure[] {
  return [...score.events]
    .sort((a, b) => a.measure - b.measure || a.beat - b.beat)
    .map((event) => ({
      id: event.id,
      pitches: event.pitches.map(fromSpelledPitch),
      duration: STAFF_DURATION[event.value.duration],
    }))
}

function scoreSections(lesson: Lesson): Score[] {
  return lesson.sections
    .filter((section) => section.kind === 'score' && section.score)
    .map((section) => section.score as Score)
}

let bundle: ContentBundle
let lesson: Lesson

beforeAll(async () => {
  const result = validateContentBundle(await loadContentFromDisk())
  expect(result.ok).toBe(true)
  if (!result.bundle) throw new Error('El contenido del repositorio no es válido')
  bundle = result.bundle
  const found = bundle.lessons.find((item) => item.id === 'lesson.m1-06')
  if (!found) throw new Error('Falta la lección M1-06')
  lesson = found
})

describe('M1-06 — Compases compuestos', () => {
  it('está publicada, validada y depende de M1-05', () => {
    expect(lesson.moduleId).toBe('M1')
    expect(lesson.status).toBe('published')
    expect(lesson.prerequisites).toContain('lesson.m1-05')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
    expect(lesson.skillIds).toContain('skill.compound-meter')
  })

  it('explica 6/8, 9/8, 12/8, el pulso con puntillo y la subdivisión ternaria', () => {
    const text = lesson.sections
      .map((section) => section.bodyEs ?? '')
      .join(' ')
      .toLowerCase()

    for (const term of [
      '6/8',
      '9/8',
      '12/8',
      'negra con puntillo',
      'tres corcheas',
      'subdivisión ternaria',
      'compuesto',
      'acento',
      'grupo',
    ]) {
      expect(text, `Falta el concepto: ${term}`).toContain(term)
    }
  })

  it('incluye demos de 6/8, 9/8 y 12/8', () => {
    const signatures = scoreSections(lesson).map(
      (score) => `${score.timeSignature.numerator}/${score.timeSignature.denominator}`,
    )

    expect(new Set(signatures)).toEqual(new Set(['6/8', '9/8', '12/8']))
    for (const score of scoreSections(lesson)) {
      expect(score.tempoBpm).toBe(80)
    }
  })

  it('los compases de las demos y de la tarea están completos', () => {
    const task = lesson.keyboardTask
    if (!task?.demoScore) throw new Error('La tarea no tiene demoScore')

    for (const score of [...scoreSections(lesson), task.demoScore]) {
      const perMeasure = new Map<number, number>()
      for (const event of score.events) {
        perMeasure.set(
          event.measure,
          (perMeasure.get(event.measure) ?? 0) + cellBeats(event.value),
        )
      }
      for (const total of perMeasure.values()) {
        expect(total).toBeCloseTo(capacity(score.timeSignature))
      }
    }
  })

  it('acentúa la primera corchea de cada grupo de tres', () => {
    for (const score of scoreSections(lesson)) {
      const events = [...score.events].sort((a, b) => a.beat - b.beat)
      expect(events.length % 3, `Grupos incompletos en ${score.timeSignature.numerator}/8`).toBe(0)

      const groupStarts: number[] = []
      for (let index = 0; index < events.length; index += 3) {
        const [strong, weak1, weak2] = events.slice(index, index + 3)
        expect(strong.velocity).toBeGreaterThan(weak1.velocity)
        expect(strong.velocity).toBeGreaterThan(weak2.velocity)
        groupStarts.push(strong.velocity)
      }

      expect(groupStarts[0]).toBeGreaterThanOrEqual(Math.max(...groupStarts.slice(1)))
    }
  })

  it('renderiza la demo de 6/8 en el pentagrama', async () => {
    const score = scoreSections(lesson).find(
      (item) => item.timeSignature.numerator === 6,
    )
    if (!score) throw new Error('Falta la demo de 6/8')
    if (score.clef === 'grand') throw new Error('M1-06 usa una sola clave')

    const container = document.createElement('div')
    await renderStaff(container, {
      measures: measuresFromScore(score),
      clef: score.clef,
      keySignature: score.key,
      timeSignature: `${score.timeSignature.numerator}/${score.timeSignature.denominator}`,
    })

    expect(
      [...container.querySelectorAll('[data-staff-note]')].map(
        (note) => note.getAttribute('aria-label'),
      ),
    ).toEqual(['C4', 'E4', 'G4', 'C5', 'G4', 'E4'])
  })

  it('los ejercicios de completar compases cubren 6/8, 9/8 y 12/8', () => {
    const completions = lesson.exerciseIds
      .map((id) => bundle.exercises.find((item) => item.id === id))
      .filter((exercise) => exercise?.type === 'rhythm-completion')

    expect(completions.length).toBeGreaterThanOrEqual(5)

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

    expect(signatures).toEqual(new Set(['6/8', '9/8', '12/8']))
  })

  it('los ejercicios de acentos marcan el inicio de cada grupo ternario', () => {
    const accents = lesson.exerciseIds
      .map((id) => bundle.exercises.find((item) => item.id === id))
      .filter((exercise) => exercise?.type === 'meter-accent')

    expect(accents).toHaveLength(3)

    const signatures = new Set<string>()
    for (const exercise of accents) {
      if (!exercise || exercise.type !== 'meter-accent') continue

      const numerator = exercise.timeSignature.numerator
      signatures.add(`${numerator}/${exercise.timeSignature.denominator}`)
      expect(exercise.accentedBeats).toEqual(COMPOUND_ACCENTS[numerator])
      expect(exercise.choices?.at(0)).toBe(meterLabel(exercise.timeSignature))
    }

    expect(signatures).toEqual(new Set(['6/8', '9/8', '12/8']))
  })

  it('rechaza un acento fuera del compás', async () => {
    const raw = await loadContentFromDisk()
    const base = validateContentBundle(raw).bundle
    if (!base) throw new Error('El contenido base debería ser válido')

    const fixture = structuredClone(base)
    const exercise = fixture.exercises.find(
      (item) => item.type === 'meter-accent' && item.timeSignature.numerator === 12,
    )
    if (!exercise || exercise.type !== 'meter-accent') {
      throw new Error('Falta un ejercicio de acentos en 12/8')
    }
    exercise.accentedBeats = [13]

    const result = validateContentBundle(fixture)

    expect(result.ok).toBe(false)
    expect(
      result.issues.some((issue) => issue.message.includes('supera el numerador')),
    ).toBe(true)
  })

  it('incluye una tarea con subdivisión ternaria y checklist', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.keys.map((key) => `${key.step}${key.accidental}${key.octave}`)).toEqual([
      'C4',
    ])
    expect(task?.tempoBpm).toBe(80)
    expect(task?.instructionsEs.toLowerCase()).toContain('6/8')
    expect(task?.instructionsEs.toLowerCase()).toContain('tres corcheas')
    expect(task?.checklistEs.length).toBeGreaterThanOrEqual(3)

    const demo = task?.demoScore
    if (!demo) throw new Error('La tarea no tiene demoScore')
    expect(demo.timeSignature).toEqual({ numerator: 6, denominator: 8 })
    expect(demo.events.map((event) => event.beat)).toEqual([0, 0.5, 1, 1.5, 2, 2.5])
    expect(demo.events.map((event) => event.velocity)).toEqual([100, 60, 60, 95, 60, 60])
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
