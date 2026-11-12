import { beforeAll, describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { validateContentBundle } from '../src/content/validate'
import { resolveExerciseAnswer } from '../src/exercises/answer'
import { exerciseChoices } from '../src/content/localize'
import {
  formatPitch,
  fromSpelledPitch,
  intervalBetween,
  invertInterval,
  midiOf,
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

/**
 * Los ejercicios guardan en `lower`/`upper` la inversión que suena y que hay
 * que nombrar. El intervalo original se reconstruye bajando una octava la nota
 * superior, que es justamente la nota grave del original.
 */
function originalPair(
  exercise: Extract<Exercise, { type: 'interval' }>,
): { lower: SpelledPitch; upper: SpelledPitch } {
  return {
    lower: { ...exercise.upper, octave: exercise.upper.octave - 1 },
    upper: exercise.lower,
  }
}

function pitchClass(pitch: SpelledPitch): number {
  return ((midiOf(fromSpelledPitch(pitch)) % 12) + 12) % 12
}

let bundle: ContentBundle
let lesson: Lesson

beforeAll(async () => {
  const result = validateContentBundle(await loadContentFromDisk())
  expect(result.ok).toBe(true)
  if (!result.bundle) throw new Error('El contenido del repositorio no es válido')
  bundle = result.bundle
  const found = bundle.lessons.find((item) => item.id === 'lesson.m3-02')
  if (!found) throw new Error('Falta la lección M3-02')
  lesson = found
})

describe('M3-02 — Inversión de intervalos', () => {
  it('está publicada, validada y depende de M3-01', () => {
    expect(lesson.moduleId).toBe('M3')
    expect(lesson.status).toBe('published')
    expect(lesson.prerequisites).toContain('lesson.m3-01')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
    expect(lesson.skillIds).toContain('skill.interval-quality')
  })

  it('explica la regla de nueve, el intercambio de calidades y la ortografía', () => {
    const text = lesson.sections
      .map((section) => `${section.titleEs} ${section.bodyEs ?? ''}`)
      .join(' ')
      .toLowerCase()

    for (const term of [
      'inversión',
      'octava',
      'nueve',
      'mayor',
      'menor',
      'just',
      'aumentad',
      'disminuid',
      'semitonos',
      'letras',
      'ortografía',
    ]) {
      expect(text, `Falta el concepto: ${term}`).toContain(term)
    }
  })

  it('muestra cuatro pares de original e inversión que suman nueve', () => {
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
      'segunda mayor',
      'séptima menor',
      'tercera mayor',
      'sexta menor',
      'cuarta justa',
      'quinta justa',
      'cuarta aumentada',
      'quinta disminuida',
    ])

    for (let index = 0; index < intervals.length; index += 2) {
      const original = intervals[index]
      const inverted = intervals[index + 1]
      if (!original || !inverted) throw new Error('Falta un par de la demo')
      expect(original.number + inverted.number).toBe(9)
      expect(original.semitones + inverted.semitones).toBe(12)
      expect(invertInterval(original).symbol).toBe(inverted.symbol)
    }
  })

  it('incluye una tarea real de teclado que toca cada intervalo y su inversión', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.tempoBpm).toBe(60)
    expect(task?.keys).toHaveLength(8)
    expect(task?.checklistEs.length).toBeGreaterThanOrEqual(3)
    expect(task?.demoScore?.events).toHaveLength(4)

    const instructions = task?.instructionsEs.toLowerCase() ?? ''
    expect(instructions).toContain('tercera')
    expect(instructions).toContain('sexta')
    expect(instructions).toContain('inversión')
  })

  it('cubre las doce tónicas con la regla de nueve en ambos sentidos', () => {
    const exercises = intervalExercises(lesson, bundle)
    expect(exercises).toHaveLength(12)

    const pitchClasses = new Set<number>()
    const originalSizes = new Set<number>()
    const invertedSizes = new Set<number>()
    const originalQualities = new Set<string>()
    const invertedQualities = new Set<string>()
    const originalSymbols: string[] = []
    const invertedSymbols: string[] = []

    for (const exercise of exercises) {
      const original = originalPair(exercise)
      const originalInterval = intervalBetween(
        fromSpelledPitch(original.lower),
        fromSpelledPitch(original.upper),
      )
      const invertedInterval = intervalBetween(
        fromSpelledPitch(exercise.lower),
        fromSpelledPitch(exercise.upper),
      )
      const result = invertInterval(originalInterval)

      pitchClasses.add(pitchClass(original.lower))
      originalSizes.add(originalInterval.number)
      invertedSizes.add(invertedInterval.number)
      originalQualities.add(originalInterval.quality)
      invertedQualities.add(invertedInterval.quality)
      originalSymbols.push(originalInterval.symbol)
      invertedSymbols.push(invertedInterval.symbol)

      expect(
        originalInterval.number + invertedInterval.number,
        `${exercise.id} cantidad`,
      ).toBe(9)
      expect(
        originalInterval.semitones + invertedInterval.semitones,
        `${exercise.id} semitonos`,
      ).toBe(12)
      expect(result.number, `${exercise.id} número invertido`).toBe(
        invertedInterval.number,
      )
      expect(result.quality, `${exercise.id} calidad invertida`).toBe(
        invertedInterval.quality,
      )
      expect(result.semitones, `${exercise.id} semitonos invertidos`).toBe(
        invertedInterval.semitones,
      )
      expect(result.nameEs, `${exercise.id} nombre ES invertido`).toBe(
        invertedInterval.nameEs,
      )
      expect(result.nameEn, `${exercise.id} nombre EN invertido`).toBe(
        invertedInterval.nameEn,
      )

      expect(exercise.choices, `${exercise.id} sin opciones`).toBeDefined()
      expect(exercise.choicesEn, `${exercise.id} sin opciones en inglés`).toHaveLength(
        exercise.choices?.length ?? 0,
      )

      const spanish = resolveExerciseAnswer(exercise, 'es')
      const english = resolveExerciseAnswer(exercise, 'en')
      const choicesEs = exerciseChoices(exercise, 'es')
      const choicesEn = exerciseChoices(exercise, 'en')
      expect(spanish.mode).toBe('choice')
      expect(english.mode).toBe('choice')
      if (spanish.mode === 'choice' && choicesEs !== undefined) {
        expect(choicesEs).toContain(spanish.answer)
      }
      if (english.mode === 'choice' && choicesEn !== undefined) {
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
    expect([...originalSizes].sort((a, b) => a - b)).toEqual([2, 3, 4, 5, 6, 7, 8])
    expect([...invertedSizes].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7])
    expect([...originalQualities].sort()).toEqual([
      'augmented',
      'diminished',
      'major',
      'minor',
      'perfect',
    ])
    expect([...invertedQualities].sort()).toEqual([
      'augmented',
      'diminished',
      'major',
      'minor',
      'perfect',
    ])
    expect(originalSymbols).toEqual([
      'M2',
      'm7',
      'm2',
      'M3',
      'm3',
      'P4',
      'd5',
      'A4',
      'M6',
      'A5',
      'P5',
      'P8',
    ])
    expect(invertedSymbols).toEqual([
      'm7',
      'M2',
      'M7',
      'm6',
      'M6',
      'P5',
      'A4',
      'd5',
      'm3',
      'd4',
      'P4',
      'P1',
    ])
  })

  it('conserva la ortografía de las dos notas al invertir', () => {
    const exercises = intervalExercises(lesson, bundle)
    const spellings = exercises.map(
      (exercise) =>
        `${formatPitch(fromSpelledPitch(exercise.lower))}-${formatPitch(
          fromSpelledPitch(exercise.upper),
        )}`,
    )

    expect(spellings).toEqual([
      'D4-C5',
      'B4-C#5',
      'Eb4-D5',
      'G4-Eb5',
      'G4-E5',
      'Bb4-F5',
      'C5-F#5',
      'C#5-G5',
      'F5-Ab5',
      'E#5-A5',
      'F5-Bb5',
      'B5-B5',
    ])

    for (const exercise of exercises) {
      const original = originalPair(exercise)
      expect(original.lower.step, `${exercise.id} letra grave`).toBe(
        exercise.upper.step,
      )
      expect(original.lower.accidental, `${exercise.id} alteración grave`).toBe(
        exercise.upper.accidental,
      )
      expect(original.upper.step, `${exercise.id} letra aguda`).toBe(
        exercise.lower.step,
      )
      expect(original.upper.accidental, `${exercise.id} alteración aguda`).toBe(
        exercise.lower.accidental,
      )
    }
  })
})
