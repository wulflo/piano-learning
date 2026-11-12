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

function scoreSection(lesson: Lesson): Score {
  const section = lesson.sections.find((item) => item.kind === 'score')
  if (!section?.score) throw new Error('M0-03 no tiene sección de pentagrama')
  return section.score
}

let bundle: ContentBundle
let lesson: Lesson

beforeAll(async () => {
  const result = validateContentBundle(await loadContentFromDisk())
  expect(result.ok).toBe(true)
  if (!result.bundle) throw new Error('El contenido del repositorio no es válido')
  bundle = result.bundle
  const found = bundle.lessons.find((item) => item.id === 'lesson.m0-03')
  if (!found) throw new Error('Falta la lección M0-03')
  lesson = found
})

describe('M0-03 — Postura, banco y digitación', () => {
  it('está publicada, validada y depende de M0-02', () => {
    expect(lesson.moduleId).toBe('M0')
    expect(lesson.status).toBe('published')
    expect(lesson.prerequisites).toContain('lesson.m0-02')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
  })

  it('explica señales de tensión y límites de aprender sin profesor', () => {
    const text = lesson.sections
      .map((section) => section.bodyEs ?? '')
      .join(' ')
      .toLowerCase()

    for (const term of ['dolor', 'tensión', 'hombros', 'muñeca', 'profesor']) {
      expect(text, `Falta la señal o el aviso: ${term}`).toContain(term)
    }
    expect(text).toContain('espejo')
    expect(text).toContain('grabate')
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

  it('la demo de pentagrama muestra el patrón de cinco dedos', async () => {
    const score = scoreSection(lesson)
    const measures = measuresFromScore(score)
    expect(measures).toHaveLength(5)
    if (score.clef === 'grand') throw new Error('La demo de M0-03 usa una sola clave')

    const container = document.createElement('div')
    await renderStaff(container, {
      measures,
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

  it('los compases de las demos están completos', () => {
    const task = lesson.keyboardTask
    if (!task?.demoScore) throw new Error('La tarea no tiene demoScore')

    for (const score of [scoreSection(lesson), task.demoScore]) {
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
    }
  })

  it('referencia solo habilidades existentes', () => {
    const skillIds = new Set(bundle.skills.map((skill) => skill.id))

    for (const skillId of lesson.skillIds) {
      expect(skillIds.has(skillId), `Habilidad inexistente: ${skillId}`).toBe(true)
    }
    expect(lesson.skillIds).toContain('skill.posture')
  })
})
