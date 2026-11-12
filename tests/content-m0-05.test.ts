import { beforeAll, describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { validateContentBundle } from '../src/content/validate'
import { renderStaff, type StaffMeasure } from '../src/staff/render'
import type { StaffDuration } from '../src/staff/vex'
import { fromSpelledPitch } from '../src/theory/pitch'
import { DIAGNOSTIC_BANDS, DIAGNOSTIC_ITEMS, DIAGNOSTIC_MAX } from '../src/content/diagnostic'
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

let bundle: ContentBundle
let lesson: Lesson

beforeAll(async () => {
  const result = validateContentBundle(await loadContentFromDisk())
  expect(result.ok).toBe(true)
  if (!result.bundle) throw new Error('El contenido del repositorio no es válido')
  bundle = result.bundle
  const found = bundle.lessons.find((item) => item.id === 'lesson.m0-05')
  if (!found) throw new Error('Falta la lección M0-05')
  lesson = found
})

describe('M0-05 — Diagnóstico inicial y mapa del curso', () => {
  it('está publicada, validada y depende de M0-04', () => {
    expect(lesson.moduleId).toBe('M0')
    expect(lesson.status).toBe('published')
    expect(lesson.prerequisites).toContain('lesson.m0-04')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
  })

  it('presenta el diagnóstico como no bloqueante y con 8 ítems', () => {
    const intro = sectionBody(lesson, 'sec.m0-05.intro').toLowerCase()
    const introSection = lesson.sections.find((item) => item.id === 'sec.m0-05.intro')

    expect(introSection?.titleEs.toLowerCase()).toContain('no es un examen')
    expect(intro).toContain('8 preguntas')
    expect(intro).toContain('no hay respuestas que te hagan perder el acceso')
    expect(DIAGNOSTIC_ITEMS).toHaveLength(8)
  })

  it('el ejercicio enumera las 8 áreas del diagnóstico', () => {
    const exercise = lesson.sections.find((section) => section.kind === 'exercise')
    expect(exercise?.id).toBe('sec.m0-05.questions')

    const body = exercise?.bodyEs ?? ''
    for (const area of [
      'teclas negras',
      'nombres de notas con octava',
      'clave de sol y de fa',
      'pulso',
      'intervalos',
      'escalas',
      'tríadas y séptimas',
      'metas medibles',
    ]) {
      expect(body.toLowerCase(), `Falta el área: ${area}`).toContain(area)
    }
    expect(body.toLowerCase()).toContain('no bloquea')
  })

  it('las bandas del texto coinciden con la lógica del diagnóstico', () => {
    const body = sectionBody(lesson, 'sec.m0-05.bands')

    for (const band of DIAGNOSTIC_BANDS) {
      expect(body, `Falta la banda ${band.min}-${band.max}`).toContain(
        `${band.min}-${band.max}`,
      )
      expect(body).toContain(band.moduleId)
    }
    expect(DIAGNOSTIC_MAX).toBe(16)
  })

  it('el mapa cubre los módulos M0 a M8', () => {
    const map = sectionBody(lesson, 'sec.m0-05.map')

    for (let index = 0; index <= 8; index += 1) {
      expect(map, `Falta M${index} en el mapa`).toContain(`M${index}`)
    }
    expect(map).toContain('M8 Estilos')
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
    if (score.clef === 'grand') throw new Error('La demo de M0-05 usa una sola clave')

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
    expect(lesson.skillIds).toContain('skill.course-orientation')
    expect(lesson.exerciseIds).toHaveLength(0)
  })
})
