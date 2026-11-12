import { beforeAll, describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { validateContentBundle } from '../src/content/validate'
import { scaleTimeline } from '../src/audio/notes'
import { renderStaff, type StaffMeasure } from '../src/staff/render'
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

function scoreSections(lesson: Lesson): Score[] {
  return lesson.sections
    .filter((section) => section.kind === 'score' && section.score)
    .map((section) => section.score as Score)
}

function renderableClef(score: Score): 'treble' | 'bass' {
  if (score.clef === 'grand') throw new Error('La demo usa una sola clave')
  return score.clef
}

let bundle: ContentBundle
let lesson: Lesson

beforeAll(async () => {
  const result = validateContentBundle(await loadContentFromDisk())
  expect(result.ok).toBe(true)
  if (!result.bundle) throw new Error('El contenido del repositorio no es válido')
  bundle = result.bundle
  const found = bundle.lessons.find((item) => item.id === 'lesson.m0-02')
  if (!found) throw new Error('Falta la lección M0-02')
  lesson = found
})

describe('M0-02 — Nombres de notas y octavas', () => {
  it('está publicada, validada y depende de M0-01', () => {
    expect(lesson.moduleId).toBe('M0')
    expect(lesson.status).toBe('published')
    expect(lesson.prerequisites).toContain('lesson.m0-01')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
  })

  it('enseña Do-Re-Mi y C-D-E y cubre las octavas 2 a 6', () => {
    const text = lesson.sections
      .map((section) => section.bodyEs ?? '')
      .join(' ')

    expect(text).toContain('Do-Re-Mi')
    expect(text).toContain('C-D-E')
    expect(text).toMatch(/octavas 2 a 6/i)
    expect(text).toContain('Do central es Do4')
  })

  it('incluye una tarea real con digitación, tempo y checklist', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.keys).toHaveLength(3)
    expect(task?.keys.map((key) => key.octave)).toEqual([4, 5, 6])
    expect(task?.fingeringEs?.trim().length).toBeGreaterThan(0)
    expect(task?.tempoBpm).toBeGreaterThanOrEqual(30)
    expect(task?.tempoBpm).toBeLessThanOrEqual(240)
    expect(task?.checklistEs.length).toBeGreaterThanOrEqual(3)
    expect(task?.demoScore).toBeDefined()
  })

  it('tiene ejercicios de teclado y de pentagrama con corrección', () => {
    expect(lesson.exerciseIds).toHaveLength(5)

    const exercises = lesson.exerciseIds.map((id) => {
      const exercise = bundle.exercises.find((item) => item.id === id)
      expect(exercise, `Falta el ejercicio ${id}`).toBeDefined()
      if (!exercise) throw new Error(`Falta el ejercicio ${id}`)
      if (exercise.type !== 'note-keyboard' && exercise.type !== 'note-staff') {
        throw new Error(`Tipo de ejercicio inesperado en M0-02: ${exercise.type}`)
      }
      expect(exercise.explanationEs.trim().length).toBeGreaterThan(0)
      expect(exercise.choices?.length ?? 0).toBeGreaterThanOrEqual(2)
      return exercise
    })

    const keyboard = exercises.filter((item) => item.type === 'note-keyboard')
    const staff = exercises.filter((item) => item.type === 'note-staff')
    expect(keyboard).toHaveLength(2)
    expect(staff).toHaveLength(3)

    const octaves = [...new Set(exercises.map((item) => item.target.octave))].sort(
      (a, b) => a - b,
    )
    expect(octaves).toEqual([2, 3, 4, 5, 6])

    const clefs = new Set(
      staff.map((item) => (item.type === 'note-staff' ? item.clef : '')),
    )
    expect(clefs).toEqual(new Set(['treble', 'bass']))
  })

  it('renderiza cada ejercicio de pentagrama con su nota correcta', async () => {
    for (const exercise of bundle.exercises) {
      if (!lesson.exerciseIds.includes(exercise.id)) continue
      if (exercise.type !== 'note-staff') continue

      const container = document.createElement('div')
      const rendered = await renderStaff(container, {
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

      expect(rendered.notes).toHaveLength(1)
      const label = container
        .querySelector('[data-staff-note]')
        ?.getAttribute('aria-label')
      expect(label).toBe(`${exercise.target.step}${exercise.target.octave}`)
    }
  })

  it('renderiza las demos de pentagrama en clave de sol y de fa', async () => {
    const scores = scoreSections(lesson)
    expect(scores).toHaveLength(2)

    const labels: string[][] = []
    for (const score of scores) {
      const container = document.createElement('div')
      await renderStaff(container, {
        measures: measuresFromScore(score),
        clef: renderableClef(score),
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
      ['C4', 'C5', 'C6'],
      ['C2', 'C3'],
    ])
  })

  it('la demo de audio produce un timeline ordenado', () => {
    const section = lesson.sections.find((item) => item.kind === 'keyboard')
    if (!section) throw new Error('M0-02 no tiene demo de teclado')

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
  })
})
