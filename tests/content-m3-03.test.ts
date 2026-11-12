import { beforeAll, describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { exerciseChoices } from '../src/content/localize'
import { validateContentBundle } from '../src/content/validate'
import { resolveExerciseAnswer } from '../src/exercises/answer'
import {
  formatPitch,
  fromSpelledPitch,
  intervalBetween,
  midiOf,
  type Interval,
} from '../src/theory'
import type { ContentBundle, Exercise, Lesson, Score, SpelledPitch } from '../src/schemas'

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

function intervalExercises(lesson: Lesson, bundle: ContentBundle) {
  return lessonExercises(lesson, bundle).filter(
    (exercise): exercise is Extract<Exercise, { type: 'interval' }> =>
      exercise.type === 'interval',
  )
}

function pitchClass(pitch: SpelledPitch): number {
  return ((midiOf(fromSpelledPitch(pitch)) % 12) + 12) % 12
}

function expectedCategory(interval: Interval): {
  es: string
  en: string
} {
  if (interval.simpleNumber === 4 && interval.quality === 'perfect') {
    return { es: 'Depende del contexto', en: 'Depends on context' }
  }
  if (interval.quality === 'perfect') {
    return { es: 'Consonancia perfecta', en: 'Perfect consonance' }
  }
  if (
    (interval.quality === 'major' || interval.quality === 'minor') &&
    (interval.simpleNumber === 3 || interval.simpleNumber === 6)
  ) {
    return { es: 'Consonancia imperfecta', en: 'Imperfect consonance' }
  }
  return { es: 'Disonancia', en: 'Dissonance' }
}

let bundle: ContentBundle
let lesson: Lesson

beforeAll(async () => {
  const result = validateContentBundle(await loadContentFromDisk())
  expect(result.ok).toBe(true)
  if (!result.bundle) throw new Error('El contenido del repositorio no es válido')
  bundle = result.bundle
  const found = bundle.lessons.find((item) => item.id === 'lesson.m3-03')
  if (!found) throw new Error('Falta la lección M3-03')
  lesson = found
})

describe('M3-03 — Consonancia y disonancia', () => {
  it('está publicada, validada y depende de M3-02', () => {
    expect(lesson.moduleId).toBe('M3')
    expect(lesson.status).toBe('published')
    expect(lesson.prerequisites).toContain('lesson.m3-02')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
    expect(lesson.skillIds).toContain('skill.interval-quality')
  })

  it('explica las familias y la dependencia del contexto sin simplismos', () => {
    const text = lesson.sections
      .map((section) => `${section.titleEs} ${section.bodyEs ?? ''}`)
      .join(' ')
      .toLowerCase()

    for (const term of [
      'consonancia',
      'disonancia',
      'perfecta',
      'imperfecta',
      'contexto',
      'tritono',
      'tensión',
      'resolución',
      'cuarta justa',
      'no son juicios de valor',
    ]) {
      expect(text, `Falta el concepto: ${term}`).toContain(term)
    }
  })

  it('incluye ocho ejemplos armónicos con reposo y tensión', () => {
    const scores = scoreSections(lesson)
    expect(scores).toHaveLength(1)

    const score = scores[0]
    expect(score.key).toBe('C')
    expect(score.mode).toBe('major')
    expect(score.timeSignature).toEqual({ numerator: 4, denominator: 4 })
    expect(score.tempoBpm).toBe(70)
    expect(score.events).toHaveLength(8)

    for (const event of score.events) {
      expect(event.pitches).toHaveLength(2)
    }

    const intervals = score.events.map((event) => {
      const [lower, upper] = event.pitches
      if (!lower || !upper) throw new Error(`Intervalo incompleto en ${event.id}`)
      return intervalBetween(fromSpelledPitch(lower), fromSpelledPitch(upper))
    })

    expect(intervals.map((interval) => interval.nameEs)).toEqual([
      'quinta justa',
      'tercera mayor',
      'sexta mayor',
      'cuarta justa',
      'segunda mayor',
      'séptima mayor',
      'séptima menor',
      'cuarta aumentada',
    ])
    expect(intervals.map((interval) => expectedCategory(interval).es)).toEqual([
      'Consonancia perfecta',
      'Consonancia imperfecta',
      'Consonancia imperfecta',
      'Depende del contexto',
      'Disonancia',
      'Disonancia',
      'Disonancia',
      'Disonancia',
    ])
  })

  it('incluye una tarea real de teclado que compara reposo y tensión', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.tempoBpm).toBe(60)
    expect(task?.keys).toHaveLength(8)
    expect(task?.checklistEs.length).toBeGreaterThanOrEqual(3)
    expect(task?.demoScore?.events).toHaveLength(4)

    const instructions = task?.instructionsEs.toLowerCase() ?? ''
    expect(instructions).toContain('quinta')
    expect(instructions).toContain('cuarta')
    expect(instructions).toContain('segunda')
    expect(instructions).toContain('tensión')
  })

  it('clasifica de oído las doce parejas con las cuatro categorías', () => {
    const exercises = intervalExercises(lesson, bundle)
    expect(exercises).toHaveLength(12)

    const pitchClasses = new Set<number>()
    const qualities = new Set<string>()
    const categories = new Set<string>()
    const spellings: string[] = []

    for (const exercise of exercises) {
      expect(exercise.direction, `${exercise.id} no es armónico`).toBe(
        'harmonic',
      )
      expect(exercise.answer, `${exercise.id} sin respuesta`).toBeDefined()
      expect(exercise.answerEn, `${exercise.id} sin respuesta EN`).toBeDefined()

      const interval = intervalBetween(
        fromSpelledPitch(exercise.lower),
        fromSpelledPitch(exercise.upper),
      )
      const expected = expectedCategory(interval)

      pitchClasses.add(pitchClass(exercise.lower))
      qualities.add(interval.quality)
      categories.add(expected.es)
      spellings.push(
        `${formatPitch(fromSpelledPitch(exercise.lower))}-${formatPitch(
          fromSpelledPitch(exercise.upper),
        )}`,
      )

      expect(exercise.answer, `${exercise.id} clasificación ES`).toBe(
        expected.es,
      )
      expect(exercise.answerEn, `${exercise.id} clasificación EN`).toBe(
        expected.en,
      )
      expect(exercise.promptEs.toLowerCase(), `${exercise.id} enunciado`).toContain(
        'armónico',
      )
      expect(
        exercise.promptEn?.toLowerCase() ?? '',
        `${exercise.id} enunciado EN`,
      ).toContain('harmonic')

      const choicesEs = exerciseChoices(exercise, 'es')
      const choicesEn = exerciseChoices(exercise, 'en')
      expect(choicesEs, `${exercise.id} sin opciones`).toBeDefined()
      expect(choicesEn, `${exercise.id} sin opciones EN`).toHaveLength(
        choicesEs?.length ?? 0,
      )

      const spanish = resolveExerciseAnswer(exercise, 'es')
      const english = resolveExerciseAnswer(exercise, 'en')
      expect(spanish.mode, `${exercise.id} modo ES`).toBe('choice')
      expect(english.mode, `${exercise.id} modo EN`).toBe('choice')
      if (spanish.mode === 'choice' && choicesEs !== undefined) {
        expect(spanish.answer).toBe(expected.es)
        expect(choicesEs).toContain(spanish.answer)
      }
      if (english.mode === 'choice' && choicesEn !== undefined) {
        expect(english.answer).toBe(expected.en)
        expect(choicesEn).toContain(english.answer)
      }
      if (
        spanish.mode === 'choice' &&
        english.mode === 'choice' &&
        choicesEs !== undefined &&
        choicesEn !== undefined
      ) {
        expect(choicesEs.indexOf(spanish.answer)).toBe(
          choicesEn.indexOf(english.answer),
        )
      }
    }

    expect(pitchClasses.size).toBe(12)
    expect([...qualities].sort()).toEqual([
      'diminished',
      'major',
      'minor',
      'perfect',
    ])
    expect([...categories].sort()).toEqual([
      'Consonancia imperfecta',
      'Consonancia perfecta',
      'Depende del contexto',
      'Disonancia',
    ])
    expect(spellings).toEqual([
      'C4-G4',
      'C#4-F#4',
      'D4-F4',
      'Eb4-G4',
      'E4-C5',
      'F4-D5',
      'F#4-C5',
      'G4-A4',
      'Ab4-G5',
      'A4-Bb4',
      'Bb4-Ab5',
      'B4-B5',
    ])
  })
})
