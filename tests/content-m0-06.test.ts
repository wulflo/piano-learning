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

function sectionBody(lesson: Lesson, id: string): string {
  const section = lesson.sections.find((item) => item.id === id)
  if (!section?.bodyEs) throw new Error(`Falta la sección ${id}`)
  return section.bodyEs
}

function section(lesson: Lesson, id: string) {
  const found = lesson.sections.find((item) => item.id === id)
  if (!found) throw new Error(`Falta la sección ${id}`)
  return found
}

let bundle: ContentBundle
let lesson: Lesson

beforeAll(async () => {
  const result = validateContentBundle(await loadContentFromDisk())
  expect(result.ok).toBe(true)
  if (!result.bundle) throw new Error('El contenido del repositorio no es válido')
  bundle = result.bundle
  const found = bundle.lessons.find((item) => item.id === 'lesson.m0-06')
  if (!found) throw new Error('Falta la lección M0-06')
  lesson = found
})

describe('M0-06 — Practicar sin profesor: espejo, grabación y tensión', () => {
  it('está publicada, validada y depende de M0-05', () => {
    expect(lesson.moduleId).toBe('M0')
    expect(lesson.status).toBe('published')
    expect(lesson.prerequisites).toContain('lesson.m0-05')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
  })

  it('enseña autoobservación con espejo y grabación', () => {
    const mirror = sectionBody(lesson, 'sec.m0-06.mirror').toLowerCase()
    const recording = sectionBody(lesson, 'sec.m0-06.recording').toLowerCase()

    for (const term of ['espejo', 'hombros', 'codos', 'muñeca', 'mandíbula']) {
      expect(mirror, `Falta el punto de espejo: ${term}`).toContain(term)
    }
    for (const term of ['grabá', 'escuchá', 'pulso', 'notas limpias']) {
      expect(recording, `Falta el criterio de grabación: ${term}`).toContain(term)
    }
    expect(recording).toContain('un solo problema')
  })

  it('incluye una checklist de tensión antes, durante y después', () => {
    const tension = section(lesson, 'sec.m0-06.tension')
    expect(tension.kind).toBe('callout')
    expect(tension.titleEs.toLowerCase()).toContain('checklist de tensión')

    const body = (tension.bodyEs ?? '').toLowerCase()
    for (const moment of ['antes de tocar', 'durante', 'después']) {
      expect(body, `Falta el momento: ${moment}`).toContain(moment)
    }
    for (const term of ['hombros', 'mandíbula', 'muñeca', 'dolor', 'hormigueo']) {
      expect(body, `Falta la señal: ${term}`).toContain(term)
    }
  })

  it('muestra una advertencia honesta sobre los límites sin profesor', () => {
    const limits = section(lesson, 'sec.m0-06.limits')
    expect(limits.kind).toBe('callout')
    expect(limits.titleEs.toLowerCase()).toContain('advertencia honesta')

    const body = (limits.bodyEs ?? '').toLowerCase()
    expect(body).toContain('no reemplazan')
    expect(body).toContain('profesor')
    expect(body).toContain('profesional de la salud')
    expect(body).toContain('presencial')
  })

  it('propone un protocolo de autoobservación con pasos concretos', () => {
    const protocol = section(lesson, 'sec.m0-06.protocol')
    expect(protocol.kind).toBe('exercise')

    const body = (protocol.bodyEs ?? '').toLowerCase()
    for (const step of ['espejo', 'grabá', 'escuchá', 'un solo problema', 'checklist de tensión']) {
      expect(body, `Falta el paso: ${step}`).toContain(step)
    }
    for (let index = 1; index <= 7; index += 1) {
      expect(body, `Falta el paso numerado ${index}`).toContain(`${index})`)
    }
  })

  it('incluye una tarea real autoevaluable con digitación y checklist', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.keys).toHaveLength(5)
    expect(task?.keys.map((key) => key.step)).toEqual(['C', 'D', 'E', 'F', 'G'])
    expect(task?.fingeringEs).toContain('1 - 2 - 3 - 4 - 5')
    expect(task?.tempoBpm).toBeGreaterThanOrEqual(30)
    expect(task?.tempoBpm).toBeLessThanOrEqual(240)
    expect(task?.checklistEs.length).toBeGreaterThanOrEqual(5)
    expect(task?.checklistEs.join(' ').toLowerCase()).toContain('tensión')
    expect(task?.demoScore).toBeDefined()
  })

  it('la demo de la tarea se renderiza con cinco notas', async () => {
    const score = lesson.keyboardTask?.demoScore
    if (!score) throw new Error('La tarea no tiene demoScore')
    if (score.clef === 'grand') throw new Error('La demo de M0-06 usa una sola clave')

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
    expect(lesson.skillIds).toContain('skill.self-observation')
    expect(lesson.exerciseIds).toHaveLength(0)
  })
})
