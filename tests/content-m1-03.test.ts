import { beforeAll, describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { validateContentBundle } from '../src/content/validate'
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

let bundle: ContentBundle
let lesson: Lesson

beforeAll(async () => {
  const result = validateContentBundle(await loadContentFromDisk())
  expect(result.ok).toBe(true)
  if (!result.bundle) throw new Error('El contenido del repositorio no es válido')
  bundle = result.bundle
  const found = bundle.lessons.find((item) => item.id === 'lesson.m1-03')
  if (!found) throw new Error('Falta la lección M1-03')
  lesson = found
})

describe('M1-03 — Alteraciones, enarmonía, tonos y semitonos', () => {
  it('está publicada, validada y depende de M1-02', () => {
    expect(lesson.moduleId).toBe('M1')
    expect(lesson.status).toBe('published')
    expect(lesson.prerequisites).toContain('lesson.m1-02')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
  })

  it('explica sostenido, bemol, natural, enarmonía y semitonos', () => {
    const text = lesson.sections
      .map((section) => section.bodyEs ?? '')
      .join(' ')
      .toLowerCase()

    for (const term of ['sostenido', 'bemol', 'natural', 'enarmonía', 'semitono', 'tono']) {
      expect(text, `Falta el concepto: ${term}`).toContain(term)
    }
    expect(text).toContain('do♯')
    expect(text).toContain('re♭')
    expect(text).toContain('mi-fa')
    expect(text).toContain('si-do')
  })

  it('incluye una demo de teclado con alteraciones', () => {
    const demo = lesson.sections.find((section) => section.id === 'sec.m1-03.accidentals')
    expect(demo?.kind).toBe('keyboard')
    expect(demo?.keys.map((key) => `${key.step}${key.accidental}${key.octave}`)).toEqual([
      'C4',
      'C#4',
      'D4',
      'Eb4',
      'E4',
    ])
  })

  it('renderiza la demo de semitono y tono', async () => {
    const scores = scoreSections(lesson)
    expect(scores).toHaveLength(1)
    const score = scores[0]
    if (score.clef === 'grand') throw new Error('M1-03 usa una sola clave')

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
    ).toEqual(['C4', 'C♯4', 'D4'])
  })

  it('cubre las 12 tónicas con ejercicios de semitono o tono', () => {
    const intervalExercises = lesson.exerciseIds
      .map((id) => bundle.exercises.find((item) => item.id === id))
      .filter((exercise) => exercise?.type === 'interval')

    expect(intervalExercises).toHaveLength(12)

    const pitchClasses = new Set<number>()
    for (const exercise of intervalExercises) {
      if (!exercise || exercise.type !== 'interval') continue
      const lower = midiOf(fromSpelledPitch(exercise.lower))
      const upper = midiOf(fromSpelledPitch(exercise.upper))
      const distance = upper - lower

      expect([1, 2], `Distancia inesperada en ${exercise.id}`).toContain(distance)
      const expected = distance === 1 ? 'Semitono' : 'Tono'
      expect(exercise.choices, `Falta la respuesta en ${exercise.id}`).toContain(expected)
      expect(exercise.explanationEs.toLowerCase()).toContain(expected.toLowerCase())

      pitchClasses.add(((lower % 12) + 12) % 12)
    }

    expect(pitchClasses.size).toBe(12)
  })

  it('incluye dos ejercicios de enarmonía en el teclado', () => {
    const enharmonic = lesson.exerciseIds
      .map((id) => bundle.exercises.find((item) => item.id === id))
      .filter((exercise) => exercise?.type === 'note-keyboard')

    expect(enharmonic).toHaveLength(2)
    for (const exercise of enharmonic) {
      if (!exercise || exercise.type !== 'note-keyboard') continue
      expect(exercise.explanationEs.toLowerCase()).toContain('misma tecla')
      expect(exercise.choices).toBeDefined()
    }

    const targets = enharmonic.map((exercise) =>
      exercise && exercise.type === 'note-keyboard'
        ? `${exercise.target.step}${exercise.target.accidental}${exercise.target.octave}`
        : '',
    )
    expect(targets).toEqual(['C#4', 'F#4'])
  })

  it('incluye una tarea de teclado con semitono y tono', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.keys.map((key) => `${key.step}${key.accidental}${key.octave}`)).toEqual([
      'C4',
      'C#4',
      'D4',
    ])
    expect(task?.fingeringEs).toContain('1 - 2 - 3')
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
    expect(lesson.skillIds).toContain('skill.accidentals')
  })
})
