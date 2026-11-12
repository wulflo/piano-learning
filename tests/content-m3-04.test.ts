import { beforeAll, describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { exerciseChoices } from '../src/content/localize'
import { validateContentBundle } from '../src/content/validate'
import { resolveExerciseAnswer } from '../src/exercises/answer'
import {
  fromSpelledPitch,
  intervalBetween,
  midiOf,
  type Interval,
} from '../src/theory'
import type {
  ContentBundle,
  Exercise,
  Lesson,
  Score,
  SpelledPitch,
} from '../src/schemas'

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

function midiSet(pitches: readonly SpelledPitch[]): Set<number> {
  return new Set(pitches.map((pitch) => midiOf(fromSpelledPitch(pitch))))
}

function fragmentMidis(score: Score): Set<number> {
  return midiSet(score.events.flatMap((event) => event.pitches))
}

function expectedName(interval: Interval): { es: string; en: string } {
  return {
    es: `${interval.nameEs.charAt(0).toUpperCase()}${interval.nameEs.slice(1)}`,
    en: `${interval.nameEn.charAt(0).toUpperCase()}${interval.nameEn.slice(1)}`,
  }
}

let bundle: ContentBundle
let lesson: Lesson

beforeAll(async () => {
  const result = validateContentBundle(await loadContentFromDisk())
  expect(result.ok).toBe(true)
  if (!result.bundle) throw new Error('El contenido del repositorio no es válido')
  bundle = result.bundle
  const found = bundle.lessons.find((item) => item.id === 'lesson.m3-04')
  if (!found) throw new Error('Falta la lección M3-04')
  lesson = found
})

describe('M3-04 — Intervalos en contexto', () => {
  it('está publicada, validada y depende de M3-03', () => {
    expect(lesson.moduleId).toBe('M3')
    expect(lesson.status).toBe('published')
    expect(lesson.prerequisites).toContain('lesson.m3-03')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
    expect(lesson.skillIds).toContain('skill.interval-quality')
  })

  it('explica los intervalos en melodías, en acordes y en distintos voicings', () => {
    const text = lesson.sections
      .map((section) => `${section.titleEs} ${section.bodyEs ?? ''}`)
      .join(' ')
      .toLowerCase()

    for (const term of [
      'melodía',
      'acorde',
      'grados conjuntos',
      'salto',
      'intervalo compuesto',
      'tercera mayor',
      'quinta justa',
      'inversión',
      'bajo',
      'contexto',
    ]) {
      expect(text, `Falta el concepto: ${term}`).toContain(term)
    }
  })

  it('incluye una demo melódica y otra de acordes con el mismo Do mayor en dos posiciones', () => {
    const scores = scoreSections(lesson)
    expect(scores).toHaveLength(2)

    const [melody, chords] = scores
    if (!melody || !chords) throw new Error('Faltan las demos de M3-04')

    expect(melody.events.length).toBeGreaterThanOrEqual(6)
    expect(melody.events.every((event) => event.pitches.length === 1)).toBe(true)

    const melodyIntervals = melody.events
      .slice(0, 4)
      .map((event) => event.pitches[0])
      .filter((pitch): pitch is SpelledPitch => Boolean(pitch))
      .map((pitch) => midiOf(fromSpelledPitch(pitch)))
    expect(melodyIntervals).toEqual([60, 62, 64, 67])

    expect(chords.events).toHaveLength(2)
    expect(chords.events.every((event) => event.pitches.length === 3)).toBe(true)

    const root = chords.events[0]
    const firstInversion = chords.events[1]
    if (!root || !firstInversion) throw new Error('Faltan los acordes')

    expect(midiSet(root.pitches)).toEqual(new Set([60, 64, 67]))
    expect(midiSet(firstInversion.pitches)).toEqual(new Set([64, 67, 72]))
  })

  it('incluye una tarea real de teclado que pasa de la melodía al acorde y al intervalo compuesto', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.tempoBpm).toBe(60)
    expect(task?.keys.length).toBeGreaterThanOrEqual(9)
    expect(task?.checklistEs.length).toBeGreaterThanOrEqual(3)
    expect(task?.demoScore?.events.length).toBeGreaterThanOrEqual(5)

    const instructions = task?.instructionsEs.toLowerCase() ?? ''
    expect(instructions).toContain('melodía')
    expect(instructions).toContain('acorde')
    expect(instructions).toContain('décima mayor')
  })

  it('plantea doce ejercicios con fragmentos melódicos y armónicos', () => {
    const exercises = intervalExercises(lesson, bundle)
    expect(exercises).toHaveLength(12)
    expect(new Set(exercises.map((exercise) => exercise.id)).size).toBe(12)

    let melodic = 0
    let harmonic = 0
    let compound = 0
    let tritone = 0

    for (const exercise of exercises) {
      expect(exercise.fragment, `${exercise.id} sin fragmento`).toBeDefined()
      const fragment = exercise.fragment
      if (!fragment) throw new Error(`Falta el fragmento de ${exercise.id}`)

      const midis = fragmentMidis(fragment)
      expect(midis.has(midiOf(fromSpelledPitch(exercise.lower))), `${exercise.id} lower`).toBe(true)
      expect(midis.has(midiOf(fromSpelledPitch(exercise.upper))), `${exercise.id} upper`).toBe(true)

      const interval = intervalBetween(
        fromSpelledPitch(exercise.lower),
        fromSpelledPitch(exercise.upper),
      )
      const expected = expectedName(interval)

      if (exercise.direction === 'harmonic') {
        harmonic += 1
        expect(
          fragment.events.some((event) => event.pitches.length > 1),
          `${exercise.id} sin acorde`,
        ).toBe(true)
      } else {
        melodic += 1
        expect(
          fragment.events.every((event) => event.pitches.length === 1),
          `${exercise.id} con acorde`,
        ).toBe(true)
      }

      if (interval.number > 8) compound += 1
      if (interval.semitones === 6) tritone += 1

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
        expect(spanish.answer, `${exercise.id} respuesta ES`).toBe(expected.es)
        expect(choicesEs).toContain(spanish.answer)
      }
      if (english.mode === 'choice' && choicesEn !== undefined) {
        expect(english.answer, `${exercise.id} respuesta EN`).toBe(expected.en)
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

      expect(exercise.promptEs.toLowerCase()).toContain(
        exercise.direction === 'harmonic' ? 'acorde' : 'fragmento',
      )
      expect(exercise.promptEn?.toLowerCase() ?? '').toContain(
        exercise.direction === 'harmonic' ? 'chord' : 'fragment',
      )
      expect(exercise.explanationEn?.trim()).toBeTruthy()
    }

    expect(melodic).toBe(8)
    expect(harmonic).toBe(4)
    expect(compound).toBe(1)
    expect(tritone).toBe(1)
  })
})
