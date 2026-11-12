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
  SoundExample,
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

const EXAMPLE_FIELDS: (keyof SoundExample)[] = [
  'midi',
  'beats',
  'velocity',
  'timbre',
]

const PARAMETER_FIELD: Record<string, keyof SoundExample> = {
  pitch: 'midi',
  duration: 'beats',
  intensity: 'velocity',
  timbre: 'timbre',
}

let bundle: ContentBundle
let lesson: Lesson

beforeAll(async () => {
  const result = validateContentBundle(await loadContentFromDisk())
  expect(result.ok).toBe(true)
  if (!result.bundle) throw new Error('El contenido del repositorio no es válido')
  bundle = result.bundle
  const found = bundle.lessons.find((item) => item.id === 'lesson.m1-01')
  if (!found) throw new Error('Falta la lección M1-01')
  lesson = found
})

describe('M1-01 — Altura, duración, intensidad y timbre', () => {
  it('está publicada, validada y depende de M0-06', () => {
    expect(lesson.moduleId).toBe('M1')
    expect(lesson.status).toBe('published')
    expect(lesson.prerequisites).toContain('lesson.m0-06')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
  })

  it('explica los cuatro parámetros del sonido', () => {
    const text = lesson.sections
      .map((section) => section.bodyEs ?? '')
      .join(' ')
      .toLowerCase()

    for (const term of ['altura', 'duración', 'intensidad', 'timbre']) {
      expect(text, `Falta el parámetro: ${term}`).toContain(term)
    }
    expect(text).toContain('agudo')
    expect(text).toContain('grave')
    expect(text).toContain('suave')
    expect(text).toContain('fuerte')
    expect(text).toContain('color')
  })

  it('incluye ejemplos sonoros de altura, duración e intensidad', async () => {
    const pitch = lesson.sections.find((section) => section.id === 'sec.m1-01.pitch')
    expect(pitch?.kind).toBe('keyboard')
    expect(pitch?.keys.map((key) => key.octave)).toEqual([3, 4, 5])

    const scores = scoreSections(lesson)
    expect(scores).toHaveLength(2)

    const duration = scores[0]
    expect(duration.events.map((event) => event.value.duration)).toEqual([
      'half',
      'quarter',
      'eighth',
      'eighth',
    ])

    const intensity = scores[1]
    expect(intensity.events.map((event) => event.velocity)).toEqual([40, 80, 120])

    const labels: string[][] = []
    for (const score of scores) {
      if (score.clef === 'grand') throw new Error('M1-01 usa una sola clave')
      const container = document.createElement('div')
      await renderStaff(container, {
        measures: measuresFromScore(score),
        clef: score.clef,
        keySignature: score.key,
        timeSignature: `${score.timeSignature.numerator}/${score.timeSignature.denominator}`,
      })
      labels.push(
        [...container.querySelectorAll('[data-staff-note]')].map(
          (note) => note.getAttribute('aria-label') ?? '',
        ),
      )
    }

    expect(labels).toEqual([
      ['C4', 'D4', 'E4', 'F4'],
      ['C4', 'C4', 'C4'],
    ])
  })

  it('incluye un ejercicio de escucha con cuatro pares A/B', () => {
    expect(lesson.exerciseIds).toHaveLength(4)

    const exercises = lesson.exerciseIds.map((id) => {
      const exercise = bundle.exercises.find((item) => item.id === id)
      expect(exercise, `Falta el ejercicio ${id}`).toBeDefined()
      if (!exercise) throw new Error(`Falta el ejercicio ${id}`)
      expect(exercise.type).toBe('sound-parameter')
      expect(exercise.explanationEs.trim().length).toBeGreaterThan(0)
      return exercise
    })

    const parameters = exercises.map((exercise) =>
      exercise.type === 'sound-parameter' ? exercise.parameter : '',
    )
    expect(parameters).toEqual(['pitch', 'duration', 'intensity', 'timbre'])

    for (const exercise of exercises) {
      if (exercise.type !== 'sound-parameter') continue
      expect(exercise.choices).toHaveLength(4)

      const changed = EXAMPLE_FIELDS.filter(
        (field) => exercise.exampleA[field] !== exercise.exampleB[field],
      )
      expect(changed, `El par ${exercise.id} debe cambiar un solo parámetro`).toEqual([
        PARAMETER_FIELD[exercise.parameter],
      ])
    }
  })

  it('el ejercicio de escucha explica cómo comparar A y B', () => {
    const listen = sectionBody(lesson, 'sec.m1-01.listen').toLowerCase()

    expect(listen).toContain('a/b')
    for (const term of ['altura', 'duración', 'intensidad', 'timbre']) {
      expect(listen, `Falta la pista de escucha: ${term}`).toContain(term)
    }
  })

  it('incluye una tarea de teclado con dinámica', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.keys.map((key) => key.step)).toEqual(['C', 'D', 'E', 'F', 'G'])
    expect(task?.fingeringEs).toContain('1 - 2 - 3 - 4 - 5')
    expect(task?.checklistEs.join(' ').toLowerCase()).toContain('suave')
    expect(task?.checklistEs.join(' ').toLowerCase()).toContain('fuerte')

    const velocities = task?.demoScore?.events.map((event) => event.velocity) ?? []
    expect(velocities).toEqual([50, 70, 90, 70, 50])
    expect(Math.max(...velocities)).toBeGreaterThan(Math.min(...velocities))
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
    expect(lesson.skillIds).toContain('skill.sound-parameters')
  })
})
