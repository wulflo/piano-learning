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

function cellBeats(cell: RhythmicValue): number {
  const base = DURATION_BEATS[cell.duration]
  const dotted = base * (2 - Math.pow(2, -cell.dots))
  return cell.tuplet === 'triplet' ? dotted * (2 / 3) : dotted
}

function capacity(timeSignature: TimeSignature): number {
  return timeSignature.numerator * (4 / timeSignature.denominator)
}

function labelOf(cell: RhythmCell): string {
  return cell.rest ? REST_LABEL[cell.duration] : DURATION_LABEL[cell.duration]
}

function meterLabel(timeSignature: TimeSignature): string {
  if (timeSignature.numerator === 2) return '1 fuerte; 2 débil'
  if (timeSignature.numerator === 3) return '1 fuerte; 2 y 3 débiles'
  if (timeSignature.numerator === 4) {
    return '1 fuerte; 2 débil; 3 semifuerte; 4 débil'
  }
  throw new Error(`Compás sin etiqueta de acentos: ${timeSignature.numerator}`)
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
  const found = bundle.lessons.find((item) => item.id === 'lesson.m1-05')
  if (!found) throw new Error('Falta la lección M1-05')
  lesson = found
})

describe('M1-05 — Compases simples', () => {
  it('está publicada, validada y depende de M1-04', () => {
    expect(lesson.moduleId).toBe('M1')
    expect(lesson.status).toBe('published')
    expect(lesson.prerequisites).toContain('lesson.m1-04')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
  })

  it('explica 2/4, 3/4, 4/4, acentos y metrónomo', () => {
    const text = lesson.sections
      .map((section) => section.bodyEs ?? '')
      .join(' ')
      .toLowerCase()

    for (const term of [
      '2/4',
      '3/4',
      '4/4',
      'fuerte',
      'débil',
      'semifuerte',
      'acento',
      'metrónomo',
      'compás',
    ]) {
      expect(text, `Falta el concepto: ${term}`).toContain(term)
    }
  })

  it('incluye demos de 2/4, 3/4 y 4/4', () => {
    const signatures = scoreSections(lesson).map(
      (score) => `${score.timeSignature.numerator}/${score.timeSignature.denominator}`,
    )

    expect(new Set(signatures)).toEqual(new Set(['2/4', '3/4', '4/4']))
    for (const score of scoreSections(lesson)) {
      expect(score.tempoBpm).toBe(80)
    }
  })

  it('acentúa el primer pulso en cada demo y el tercero en 4/4', () => {
    for (const score of scoreSections(lesson)) {
      const measures = new Map<number, typeof score.events>()
      for (const event of score.events) {
        const events = measures.get(event.measure) ?? []
        events.push(event)
        measures.set(event.measure, events)
      }

      for (const events of measures.values()) {
        const first = events.find((event) => event.beat === 0)
        expect(first).toBeDefined()
        for (const event of events) {
          expect(first?.velocity ?? 0).toBeGreaterThanOrEqual(event.velocity)
        }

        if (score.timeSignature.numerator === 4) {
          const second = events.find((event) => event.beat === 1)
          const third = events.find((event) => event.beat === 2)
          const fourth = events.find((event) => event.beat === 3)
          expect(third?.velocity ?? 0).toBeGreaterThan(second?.velocity ?? 0)
          expect(third?.velocity ?? 0).toBeGreaterThan(fourth?.velocity ?? 0)
          expect(third?.velocity ?? 0).toBeLessThan(first?.velocity ?? 0)
        }
      }
    }
  })

  it('los compases de las demos están completos', () => {
    for (const score of scoreSections(lesson)) {
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

  it('renderiza la demo de 2/4 en el pentagrama', async () => {
    const score = scoreSections(lesson).find(
      (item) => item.timeSignature.numerator === 2,
    )
    if (!score) throw new Error('Falta la demo de 2/4')
    if (score.clef === 'grand') throw new Error('M1-05 usa una sola clave')

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
    ).toEqual(['C4', 'E4', 'G4', 'C5'])
  })

  it('los ejercicios de completar compases cubren 2/4, 3/4 y 4/4', () => {
    const completions = lesson.exerciseIds
      .map((id) => bundle.exercises.find((item) => item.id === id))
      .filter((exercise) => exercise?.type === 'rhythm-completion')

    expect(completions.length).toBeGreaterThanOrEqual(6)

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

      const answer = labelOf(exercise.pattern[exercise.missingIndex])
      expect(exercise.choices, `Falta la respuesta en ${exercise.id}`).toContain(answer)
      expect(exercise.explanationEs.toLowerCase()).toContain(answer.toLowerCase())
    }

    expect(signatures).toEqual(new Set(['2/4', '3/4', '4/4']))
  })

  it('los ejercicios de acentos cubren los tres compases', () => {
    const accents = lesson.exerciseIds
      .map((id) => bundle.exercises.find((item) => item.id === id))
      .filter((exercise) => exercise?.type === 'meter-accent')

    expect(accents).toHaveLength(3)

    const signatures = new Set<string>()
    for (const exercise of accents) {
      if (!exercise || exercise.type !== 'meter-accent') continue

      signatures.add(
        `${exercise.timeSignature.numerator}/${exercise.timeSignature.denominator}`,
      )
      expect(exercise.accentedBeats).toContain(1)
      for (const beat of exercise.accentedBeats) {
        expect(beat).toBeGreaterThanOrEqual(1)
        expect(beat).toBeLessThanOrEqual(exercise.timeSignature.numerator)
      }
      expect(exercise.choices).toContain(meterLabel(exercise.timeSignature))
    }

    expect(signatures).toEqual(new Set(['2/4', '3/4', '4/4']))
  })

  it('rechaza un acento fuera del compás', async () => {
    const raw = await loadContentFromDisk()
    const base = validateContentBundle(raw).bundle
    if (!base) throw new Error('El contenido base debería ser válido')

    const fixture = structuredClone(base)
    const exercise = fixture.exercises.find((item) => item.type === 'meter-accent')
    if (!exercise || exercise.type !== 'meter-accent') {
      throw new Error('Falta un ejercicio de acentos')
    }
    exercise.accentedBeats = [9]

    const result = validateContentBundle(fixture)

    expect(result.ok).toBe(false)
    expect(
      result.issues.some((issue) => issue.message.includes('supera el numerador')),
    ).toBe(true)
  })

  it('incluye una tarea con metrónomo y acentos en 4/4', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.keys.map((key) => `${key.step}${key.accidental}${key.octave}`)).toEqual([
      'C4',
    ])
    expect(task?.tempoBpm).toBe(80)
    expect(task?.instructionsEs.toLowerCase()).toContain('metrónomo')
    expect(task?.checklistEs.length).toBeGreaterThanOrEqual(3)

    const demo = task?.demoScore
    if (!demo) throw new Error('La tarea no tiene demoScore')
    expect(demo.timeSignature).toEqual({ numerator: 4, denominator: 4 })
    expect(demo.events.map((event) => event.velocity)).toEqual([100, 60, 85, 60])
    expect(demo.events.map((event) => event.beat)).toEqual([0, 1, 2, 3])
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
    expect(lesson.skillIds).toContain('skill.simple-meter')
  })
})
