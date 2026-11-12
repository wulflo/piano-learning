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

function scoreSections(lesson: Lesson): Score[] {
  return lesson.sections
    .filter((section) => section.kind === 'score' && section.score)
    .map((section) => section.score as Score)
}

function sectionBody(lesson: Lesson, id: string): string {
  const section = lesson.sections.find((item) => item.id === id)
  if (!section?.bodyEs) throw new Error(`Falta la sección ${id}`)
  return section.bodyEs
}

async function staffLabels(score: Score): Promise<string[]> {
  if (score.clef === 'grand') throw new Error('M1-02 usa una sola clave por demo')
  const container = document.createElement('div')
  await renderStaff(container, {
    measures: measuresFromScore(score),
    clef: score.clef,
    keySignature: score.key,
    timeSignature: `${score.timeSignature.numerator}/${score.timeSignature.denominator}`,
  })
  return [...container.querySelectorAll('[data-staff-note]')].map(
    (note) => note.getAttribute('aria-label') ?? '',
  )
}

let bundle: ContentBundle
let lesson: Lesson

beforeAll(async () => {
  const result = validateContentBundle(await loadContentFromDisk())
  expect(result.ok).toBe(true)
  if (!result.bundle) throw new Error('El contenido del repositorio no es válido')
  bundle = result.bundle
  const found = bundle.lessons.find((item) => item.id === 'lesson.m1-02')
  if (!found) throw new Error('Falta la lección M1-02')
  lesson = found
})

describe('M1-02 — Pentagrama, claves y Do central', () => {
  it('está publicada, validada y depende de M1-01', () => {
    expect(lesson.moduleId).toBe('M1')
    expect(lesson.status).toBe('published')
    expect(lesson.prerequisites).toContain('lesson.m1-01')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
  })

  it('explica el pentagrama y las dos claves', () => {
    const staff = sectionBody(lesson, 'sec.m1-02.staff').toLowerCase()
    const treble = sectionBody(lesson, 'sec.m1-02.treble').toLowerCase()
    const bass = sectionBody(lesson, 'sec.m1-02.bass').toLowerCase()

    for (const term of ['cinco líneas', 'cuatro espacios', 'líneas adicionales']) {
      expect(staff, `Falta el concepto: ${term}`).toContain(term)
    }
    expect(treble).toContain('clave de sol')
    expect(treble).toContain('sol4')
    expect(treble).toContain('do central')
    expect(bass).toContain('clave de fa')
    expect(bass).toContain('fa3')
    expect(bass).toContain('do central')
  })

  it('ubica el Do central en ambas claves', () => {
    const middle = sectionBody(lesson, 'sec.m1-02.middle-c').toLowerCase()

    expect(middle).toContain('do4')
    expect(middle).toContain('debajo del pentagrama de sol')
    expect(middle).toContain('encima del pentagrama de fa')
    expect(middle).toContain('gran pentagrama')
  })

  it('renderiza las demos de clave de sol y de fa con el Do central', async () => {
    const scores = scoreSections(lesson)
    expect(scores).toHaveLength(2)
    expect(scores[0].clef).toBe('treble')
    expect(scores[1].clef).toBe('bass')

    expect(await staffLabels(scores[0])).toEqual(['C4', 'E4', 'G4', 'B4'])
    expect(await staffLabels(scores[1])).toEqual(['C4', 'A3', 'F3', 'D3'])
  })

  it('tiene cuatro ejercicios de lectura en clave de sol y de fa', async () => {
    expect(lesson.exerciseIds).toHaveLength(4)

    const exercises = lesson.exerciseIds.map((id) => {
      const exercise = bundle.exercises.find((item) => item.id === id)
      expect(exercise, `Falta el ejercicio ${id}`).toBeDefined()
      if (!exercise) throw new Error(`Falta el ejercicio ${id}`)
      if (exercise.type !== 'note-staff') {
        throw new Error(`Tipo de ejercicio inesperado en M1-02: ${exercise.type}`)
      }
      expect(exercise.explanationEs.trim().length).toBeGreaterThan(0)
      expect(exercise.choices?.length ?? 0).toBeGreaterThanOrEqual(2)
      return exercise
    })

    const targets = exercises.map((exercise) =>
      exercise.type === 'note-staff' ? exercise.target : null,
    )
    expect(targets.map((target) => (target ? `${target.step}${target.octave}` : ''))).toEqual([
      'G4',
      'F3',
      'C4',
      'C4',
    ])

    const clefs = exercises.map((exercise) =>
      exercise.type === 'note-staff' ? exercise.clef : '',
    )
    expect(clefs).toEqual(['treble', 'bass', 'treble', 'bass'])

    for (const exercise of exercises) {
      if (exercise.type !== 'note-staff') continue
      const container = document.createElement('div')
      await renderStaff(container, {
        measures: [
          {
            id: exercise.id,
            pitches: [fromSpelledPitch(exercise.target)],
            duration: 'q',
          },
        ],
        clef: exercise.clef,
        keySignature: 'C',
        timeSignature: '4/4',
      })
      const label = container
        .querySelector('[data-staff-note]')
        ?.getAttribute('aria-label')
      expect(label).toBe(`${exercise.target.step}${exercise.target.octave}`)
    }
  })

  it('incluye una tarea real con checklist y demo', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.keys).toHaveLength(1)
    expect(task?.keys[0]).toMatchObject({ step: 'C', octave: 4 })
    expect(task?.fingeringEs).toContain('pulgar')
    expect(task?.checklistEs.length).toBeGreaterThanOrEqual(3)
    expect(task?.demoScore).toBeDefined()
  })

  it('los compases de las demos están completos', () => {
    const task = lesson.keyboardTask
    if (!task?.demoScore) throw new Error('La tarea no tiene demoScore')

    for (const score of [...scoreSections(lesson), task.demoScore]) {
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
    expect(lesson.skillIds).toContain('skill.note-staff')
  })
})
