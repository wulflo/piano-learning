import { beforeAll, describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { validateContentBundle } from '../src/content/validate'
import { beatDuration } from '../src/audio/notes'
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
  const found = bundle.lessons.find((item) => item.id === 'lesson.m1-04')
  if (!found) throw new Error('Falta la lección M1-04')
  lesson = found
})

describe('M1-04 — Figuras y silencios', () => {
  it('está publicada, validada y depende de M1-03', () => {
    expect(lesson.moduleId).toBe('M1')
    expect(lesson.status).toBe('published')
    expect(lesson.prerequisites).toContain('lesson.m1-03')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
  })

  it('explica las seis figuras y los silencios', () => {
    const text = lesson.sections
      .map((section) => section.bodyEs ?? '')
      .join(' ')
      .toLowerCase()

    for (const term of [
      'redonda',
      'blanca',
      'negra',
      'corchea',
      'semicorchea',
      'treintaidosavo',
      'fusa',
      'silencio',
    ]) {
      expect(text, `Falta el concepto: ${term}`).toContain(term)
    }
  })

  it('usa todas las duraciones en las demos de audio', () => {
    const task = lesson.keyboardTask
    if (!task?.demoScore) throw new Error('La tarea no tiene demoScore')

    const durations = new Set<DurationName>()
    for (const score of [...scoreSections(lesson), task.demoScore]) {
      for (const event of score.events) durations.add(event.value.duration)
    }

    expect([...durations].sort()).toEqual(
      ['whole', 'half', 'quarter', 'eighth', 'sixteenth', 'thirty-second'].sort(),
    )
  })

  it('calcula las duraciones de audio a partir del tempo', () => {
    const score = scoreSections(lesson).find((item) => item.tempoBpm === 50)
    if (!score) throw new Error('Falta la demo de figuras cortas')

    const beat = beatDuration(score.tempoBpm)
    const seconds = score.events.map((event) => cellBeats(event.value) * beat)

    for (const [index, expected] of [2.4, 1.2, 0.6, 0.3, 0.15, 0.15].entries()) {
      expect(seconds[index]).toBeCloseTo(expected)
    }
    expect(seconds[0]).toBeCloseTo(seconds[1] * 2)
    expect(seconds[1]).toBeCloseTo(seconds[2] * 2)
    expect(seconds[2]).toBeCloseTo(seconds[3] * 2)
    expect(seconds[3]).toBeCloseTo(seconds[4] * 2)
  })

  it('renderiza semicorcheas y treintaidosavos en el pentagrama', async () => {
    const score = scoreSections(lesson).find((item) => item.tempoBpm === 50)
    if (!score) throw new Error('Falta la demo de figuras cortas')
    if (score.clef === 'grand') throw new Error('M1-04 usa una sola clave')

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
    ).toEqual(['C5', 'G4', 'E4', 'D4', 'C4', 'D4'])
  })

  it('los compases de las demos están completos', () => {
    const task = lesson.keyboardTask
    if (!task?.demoScore) throw new Error('La tarea no tiene demoScore')

    for (const score of [...scoreSections(lesson), task.demoScore]) {
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

  it('los ejercicios de completar compases tienen una única figura faltante', () => {
    const completions = lesson.exerciseIds
      .map((id) => bundle.exercises.find((item) => item.id === id))
      .filter((exercise) => exercise?.type === 'rhythm-completion')

    expect(completions.length).toBeGreaterThanOrEqual(7)

    let restCount = 0
    let thirtySecondCount = 0

    for (const exercise of completions) {
      if (!exercise || exercise.type !== 'rhythm-completion') continue

      expect(exercise.missingIndex).toBeGreaterThanOrEqual(0)
      expect(exercise.missingIndex).toBeLessThan(exercise.pattern.length)

      const total = exercise.pattern.reduce((sum, cell) => sum + cellBeats(cell), 0)
      expect(total, `Compás incompleto en ${exercise.id}`).toBeCloseTo(
        capacity(exercise.timeSignature),
      )

      const missing = exercise.pattern[exercise.missingIndex]
      const answer = labelOf(missing)
      expect(exercise.choices, `Falta la respuesta en ${exercise.id}`).toContain(answer)
      expect(exercise.explanationEs.toLowerCase()).toContain(answer.toLowerCase())

      for (const cell of exercise.pattern) {
        if (cell.rest) restCount += 1
        if (cell.duration === 'thirty-second') thirtySecondCount += 1
      }
    }

    expect(restCount).toBeGreaterThanOrEqual(1)
    expect(thirtySecondCount).toBeGreaterThanOrEqual(1)
  })

  it('los ejercicios de dictado usan patrones completos y opciones válidas', () => {
    const dictations = lesson.exerciseIds
      .map((id) => bundle.exercises.find((item) => item.id === id))
      .filter((exercise) => exercise?.type === 'rhythm-dictation')

    expect(dictations.length).toBeGreaterThanOrEqual(2)

    for (const exercise of dictations) {
      if (!exercise || exercise.type !== 'rhythm-dictation') continue

      const total = exercise.pattern.reduce((sum, cell) => sum + cellBeats(cell), 0)
      expect(total, `Compás incompleto en ${exercise.id}`).toBeCloseTo(
        capacity(exercise.timeSignature),
      )

      const sequence = exercise.pattern.map(labelOf).join(', ')
      expect(exercise.choices, `Falta la secuencia en ${exercise.id}`).toContain(sequence)
      expect(exercise.explanationEs.toLowerCase()).toContain('tiempos')
    }
  })

  it('incluye una tarea de teclado con ritmo y checklist', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.keys.map((key) => `${key.step}${key.accidental}${key.octave}`)).toEqual([
      'C4',
    ])
    expect(task?.checklistEs.length).toBeGreaterThanOrEqual(3)
    expect(task?.demoScore).toBeDefined()
    expect(task?.instructionsEs.toLowerCase()).toContain('blanca')
    expect(task?.instructionsEs.toLowerCase()).toContain('corcheas')
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
    expect(lesson.skillIds).toContain('skill.note-durations')
  })
})
