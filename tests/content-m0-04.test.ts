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
  Score,
} from '../src/schemas'

const STAFF_DURATION: Record<DurationName, StaffDuration> = {
  whole: 'w',
  half: 'h',
  quarter: 'q',
  eighth: '8',
  sixteenth: '16',
  'thirty-second': '16',
}

const DURATION_BEATS: Record<DurationName, number> = {
  whole: 4,
  half: 2,
  quarter: 1,
  eighth: 0.5,
  sixteenth: 0.25,
  'thirty-second': 0.125,
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

let bundle: ContentBundle
let lesson: Lesson

beforeAll(async () => {
  const result = validateContentBundle(await loadContentFromDisk())
  expect(result.ok).toBe(true)
  if (!result.bundle) throw new Error('El contenido del repositorio no es válido')
  bundle = result.bundle
  const found = bundle.lessons.find((item) => item.id === 'lesson.m0-04')
  if (!found) throw new Error('Falta la lección M0-04')
  lesson = found
})

describe('M0-04 — Cómo practicar: metas, tiempo y error', () => {
  it('está publicada, validada y depende de M0-03', () => {
    expect(lesson.moduleId).toBe('M0')
    expect(lesson.status).toBe('published')
    expect(lesson.prerequisites).toContain('lesson.m0-03')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
  })

  it('explica el método con metas medibles, tiempo y error', () => {
    const text = lesson.sections
      .map((section) => section.bodyEs ?? '')
      .join(' ')
      .toLowerCase()

    for (const term of ['meta', 'medible', 'tiempo', 'error', 'registro']) {
      expect(text, `Falta el concepto: ${term}`).toContain(term)
    }
    expect(text).toContain('bpm')
    expect(text).toContain('repeticiones')
  })

  it('incluye un ejercicio de planificación con campos concretos', () => {
    const exercise = lesson.sections.find((section) => section.kind === 'exercise')
    expect(exercise).toBeDefined()
    const body = exercise?.bodyEs?.toLowerCase() ?? ''

    expect(body).toContain('planificá')
    for (const field of ['meta', 'tiempo', 'bloque', 'error', 'registro']) {
      expect(body, `Falta el campo de planificación: ${field}`).toContain(field)
    }
  })

  it('incluye checklists para 15, 30 y 45 minutos', () => {
    const checklists = lesson.sections.find(
      (section) => section.id === 'sec.m0-04.checklists',
    )
    const body = checklists?.bodyEs ?? ''

    for (const duration of ['15', '30', '45']) {
      expect(body, `Falta el bloque de ${duration} minutos`).toContain(duration)
    }
    expect(body.toLowerCase()).toContain('calentamiento')
    expect(body.toLowerCase()).toContain('cierre')
  })

  it('incluye una tarea real autoevaluable con digitación y checklist', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.keys).toHaveLength(5)
    expect(task?.keys.map((key) => key.step)).toEqual(['C', 'D', 'E', 'F', 'G'])
    expect(task?.fingeringEs).toContain('1 - 2 - 3 - 4 - 5')
    expect(task?.tempoBpm).toBeGreaterThanOrEqual(30)
    expect(task?.tempoBpm).toBeLessThanOrEqual(240)
    expect(task?.checklistEs.length).toBeGreaterThanOrEqual(4)
    expect(task?.demoScore).toBeDefined()
  })

  it('la demo de la tarea se renderiza con cinco notas', async () => {
    const score = lesson.keyboardTask?.demoScore
    if (!score) throw new Error('La tarea no tiene demoScore')
    if (score.clef === 'grand') throw new Error('La demo de M0-04 usa una sola clave')

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
    ).toEqual(['C4', 'D4', 'E4', 'F4', 'G4'])
  })

  it('el compás de la demo está completo', () => {
    const score = lesson.keyboardTask?.demoScore
    if (!score) throw new Error('La tarea no tiene demoScore')

    const expected =
      score.timeSignature.numerator * (4 / score.timeSignature.denominator)
    const perMeasure = new Map<number, number>()
    for (const event of score.events) {
      perMeasure.set(
        event.measure,
        (perMeasure.get(event.measure) ?? 0) + DURATION_BEATS[event.value.duration],
      )
    }
    expect([...perMeasure.values()]).toEqual([expected])
  })

  it('referencia solo habilidades existentes', () => {
    const skillIds = new Set(bundle.skills.map((skill) => skill.id))

    for (const skillId of lesson.skillIds) {
      expect(skillIds.has(skillId), `Habilidad inexistente: ${skillId}`).toBe(true)
    }
    expect(lesson.skillIds).toContain('skill.practice-planning')
  })
})
