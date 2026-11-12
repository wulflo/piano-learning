import { beforeAll, describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { validateContentBundle } from '../src/content/validate'
import { scaleTimeline } from '../src/audio/notes'
import {
  renderStaff,
  type StaffMeasure,
} from '../src/staff/render'
import type { StaffDuration } from '../src/staff/vex'
import { fromSpelledPitch, midiOf } from '../src/theory/pitch'
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
  if (!section?.score) throw new Error('M0-01 no tiene sección de pentagrama')
  return section.score
}

let bundle: ContentBundle
let lesson: Lesson

beforeAll(async () => {
  const result = validateContentBundle(await loadContentFromDisk())
  expect(result.ok).toBe(true)
  if (!result.bundle) throw new Error('El contenido del repositorio no es válido')
  bundle = result.bundle
  const found = bundle.lessons.find((item) => item.id === 'lesson.m0-01')
  if (!found) throw new Error('Falta la lección M0-01')
  lesson = found
})

describe('M0-01 — El teclado: grupos de dos y tres negras', () => {
  it('está publicada, validada y pertenece a M0', () => {
    expect(lesson.moduleId).toBe('M0')
    expect(lesson.status).toBe('published')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
    expect(lesson.minutes).toBeGreaterThanOrEqual(3)
    expect(lesson.minutes).toBeLessThanOrEqual(20)
  })

  it('incluye una tarea real con digitación, tempo y checklist', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.keys).toHaveLength(3)
    expect(task?.fingeringEs?.trim().length).toBeGreaterThan(0)
    expect(task?.tempoBpm).toBeGreaterThanOrEqual(30)
    expect(task?.tempoBpm).toBeLessThanOrEqual(240)
    expect(task?.checklistEs.length).toBeGreaterThanOrEqual(3)
    expect(task?.demoScore).toBeDefined()
  })

  it('tiene ejercicios de teclado con corrección y opciones plausibles', () => {
    expect(lesson.exerciseIds).toHaveLength(3)

    for (const exerciseId of lesson.exerciseIds) {
      const exercise = bundle.exercises.find((item) => item.id === exerciseId)
      expect(exercise, `Falta el ejercicio ${exerciseId}`).toBeDefined()
      if (!exercise) continue

      expect(exercise.type).toBe('note-keyboard')
      expect(exercise.explanationEs.trim().length).toBeGreaterThan(0)

      if (exercise.type === 'note-keyboard') {
        expect(exercise.target).toBeDefined()
        expect(midiOf(fromSpelledPitch(exercise.target))).toBeGreaterThan(0)
        expect(exercise.choices?.length ?? 0).toBeGreaterThanOrEqual(2)
        expect(new Set(exercise.choices).size).toBe(exercise.choices?.length)
      }
    }
  })

  it('la demo de pentagrama se renderiza y describe las notas', async () => {
    const score = scoreSection(lesson)
    const measures = measuresFromScore(score)
    expect(measures).toHaveLength(3)
    if (score.clef === 'grand') throw new Error('La demo de M0-01 usa una sola clave')

    const container = document.createElement('div')
    const rendered = await renderStaff(container, {
      measures,
      clef: score.clef,
      keySignature: score.key,
      timeSignature: `${score.timeSignature.numerator}/${score.timeSignature.denominator}`,
    })

    expect(rendered).toHaveLength(3)
    const notes = container.querySelectorAll('[data-staff-note]')
    expect([...notes].map((note) => note.getAttribute('aria-label'))).toEqual([
      'C4',
      'D4',
      'E4',
    ])
  })

  it('la demo de audio produce un timeline ordenado en el teclado', () => {
    const section = lesson.sections.find((item) => item.kind === 'keyboard')
    if (!section) throw new Error('M0-01 no tiene demo de teclado')

    const midis = section.keys.map((key) => midiOf(fromSpelledPitch(key)))
    const events = scaleTimeline(midis, { tempo: 60, noteBeats: 1 })

    expect(events.map((event) => event.midis[0])).toEqual(midis)
    expect(events.every((event) => event.duration > 0)).toBe(true)
    for (let index = 1; index < events.length; index += 1) {
      expect(events[index].time).toBeGreaterThan(events[index - 1].time)
    }
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
