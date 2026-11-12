import { beforeAll, describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { validateContentBundle } from '../src/content/validate'
import { resolveExerciseAnswer } from '../src/exercises/answer'
import { intervalBetween, fromSpelledPitch, midiOf } from '../src/theory'
import type { ContentBundle, Exercise, Lesson, Score } from '../src/schemas'

function scoreSections(lesson: Lesson): Score[] {
  return lesson.sections
    .filter((section) => section.kind === 'score' && section.score)
    .map((section) => section.score as Score)
}

function lessonExercises(lesson: Lesson, bundle: ContentBundle): Exercise[] {
  return lesson.exerciseIds
    .map((id) => bundle.exercises.find((item) => item.id === id))
    .filter((exercise): exercise is Exercise => Boolean(exercise))
}

function capitalize(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`
}

let bundle: ContentBundle
let lesson: Lesson

beforeAll(async () => {
  const result = validateContentBundle(await loadContentFromDisk())
  expect(result.ok).toBe(true)
  if (!result.bundle) throw new Error('El contenido del repositorio no es válido')
  bundle = result.bundle
  const found = bundle.lessons.find((item) => item.id === 'lesson.m3-01')
  if (!found) throw new Error('Falta la lección M3-01')
  lesson = found
})

describe('M3-01 — Intervalos: cantidad y calidad', () => {
  it('está publicada, validada y depende de M2-12', () => {
    expect(lesson.moduleId).toBe('M3')
    expect(lesson.status).toBe('published')
    expect(lesson.prerequisites).toContain('lesson.m2-12')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
    expect(lesson.skillIds).toContain('skill.interval-quality')
  })

  it('explica cantidad, calidad y las cinco calidades', () => {
    const text = lesson.sections
      .map((section) => `${section.titleEs} ${section.bodyEs ?? ''}`)
      .join(' ')
      .toLowerCase()

    for (const term of [
      'cantidad',
      'calidad',
      'semitonos',
      'justa',
      'mayor',
      'menor',
      'aumentada',
      'disminuida',
      'octava',
    ]) {
      expect(text, `Falta el concepto: ${term}`).toContain(term)
    }
  })

  it('incluye una demo que compara terceras y cuartas', () => {
    const scores = scoreSections(lesson)
    expect(scores).toHaveLength(1)

    const score = scores[0]
    expect(score.key).toBe('C')
    expect(score.mode).toBe('major')
    expect(score.timeSignature).toEqual({ numerator: 4, denominator: 4 })
    expect(score.tempoBpm).toBe(70)
    expect(score.events).toHaveLength(4)

    for (const event of score.events) {
      expect(event.pitches).toHaveLength(2)
    }

    const intervals = score.events.map((event) => {
      const [lower, upper] = event.pitches
      if (!lower || !upper) throw new Error(`Intervalo incompleto en ${event.id}`)
      return intervalBetween(
        fromSpelledPitch(lower),
        fromSpelledPitch(upper),
      ).nameEs
    })

    expect(intervals).toEqual([
      'tercera mayor',
      'tercera menor',
      'cuarta justa',
      'cuarta aumentada',
    ])
  })

  it('incluye una tarea real de teclado con tercera y quinta', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.tempoBpm).toBe(60)
    expect(task?.keys.length).toBeGreaterThanOrEqual(4)
    expect(task?.checklistEs.length).toBeGreaterThanOrEqual(3)
    expect(task?.demoScore).toBeDefined()

    const instructions = task?.instructionsEs.toLowerCase() ?? ''
    expect(instructions).toContain('tercera')
    expect(instructions).toContain('quinta')
  })

  it('cubre las doce tónicas con las siete cantidades y las cinco calidades', () => {
    const intervalExercises = lessonExercises(lesson, bundle).filter(
      (exercise) => exercise.type === 'interval',
    )

    expect(intervalExercises).toHaveLength(12)

    const pitchClasses = new Set<number>()
    const sizes = new Set<number>()
    const qualities = new Set<string>()

    for (const exercise of intervalExercises) {
      if (exercise.type !== 'interval') continue

      const lower = fromSpelledPitch(exercise.lower)
      const upper = fromSpelledPitch(exercise.upper)
      const interval = intervalBetween(lower, upper)

      pitchClasses.add(((midiOf(lower) % 12) + 12) % 12)
      sizes.add(interval.number)
      qualities.add(interval.quality)

      expect(exercise.choices, `${exercise.id} sin opciones`).toBeDefined()
      expect(exercise.choicesEn, `${exercise.id} sin opciones en inglés`).toHaveLength(
        exercise.choices?.length ?? 0,
      )

      const spanish = resolveExerciseAnswer(exercise, 'es')
      const english = resolveExerciseAnswer(exercise, 'en')
      expect(spanish.mode).toBe('choice')
      expect(english.mode).toBe('choice')
      if (spanish.mode === 'choice') {
        expect(spanish.answer).toBe(capitalize(interval.nameEs))
      }
      if (english.mode === 'choice') {
        expect(english.answer).toBe(capitalize(interval.nameEn))
      }
    }

    expect(pitchClasses.size).toBe(12)
    expect([...sizes].sort((a, b) => a - b)).toEqual([2, 3, 4, 5, 6, 7, 8])
    expect([...qualities].sort()).toEqual([
      'augmented',
      'diminished',
      'major',
      'minor',
      'perfect',
    ])
  })
})
