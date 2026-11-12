import { beforeAll, describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { exerciseChoices } from '../src/content/localize'
import { validateContentBundle } from '../src/content/validate'
import { resolveExerciseAnswer } from '../src/exercises/answer'
import { chordSymbol, fromSpelledPitch, midiOf } from '../src/theory'
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

function chordExercises(
  lesson: Lesson,
  bundle: ContentBundle,
): Extract<Exercise, { type: 'chord' }>[] {
  return lessonExercises(lesson, bundle).filter(
    (exercise): exercise is Extract<Exercise, { type: 'chord' }> =>
      exercise.type === 'chord',
  )
}

function rootSymbol(exercise: Extract<Exercise, { type: 'chord' }>): string {
  return `${exercise.root.step}${exercise.root.accidental}`
}

function eventMidis(score: Score): number[][] {
  return score.events.map((event) =>
    event.pitches
      .map((pitch) => midiOf(fromSpelledPitch(pitch)))
      .sort((first, second) => first - second),
  )
}

const KEY_ES: Record<string, string> = {
  C: 'Do',
  D: 'Re',
  E: 'Mi',
  'F#': 'Fa♯',
  Ab: 'La♭',
  Bb: 'Si♭',
  'C#': 'Do♯',
  Eb: 'Mi♭',
  F: 'Fa',
  G: 'Sol',
  A: 'La',
  B: 'Si',
}

const EXPECTED = [
  {
    id: 'ex.m5-01.a',
    key: 'C',
    mode: 'major',
    degree: 'IV',
    root: 'F',
    quality: 'major',
    symbolEs: 'Fa',
    symbolEn: 'F',
    seventh: false,
  },
  {
    id: 'ex.m5-01.b',
    key: 'D',
    mode: 'major',
    degree: 'ii',
    root: 'E',
    quality: 'minor',
    symbolEs: 'Mim',
    symbolEn: 'Em',
    seventh: false,
  },
  {
    id: 'ex.m5-01.c',
    key: 'E',
    mode: 'major',
    degree: 'V',
    root: 'B',
    quality: 'major',
    symbolEs: 'Si',
    symbolEn: 'B',
    seventh: false,
  },
  {
    id: 'ex.m5-01.d',
    key: 'F#',
    mode: 'major',
    degree: 'vii',
    root: 'E#',
    quality: 'half-diminished7',
    symbolEs: 'Mi♯m7b5',
    symbolEn: 'E♯m7b5',
    seventh: true,
  },
  {
    id: 'ex.m5-01.e',
    key: 'Ab',
    mode: 'major',
    degree: 'I',
    root: 'Ab',
    quality: 'major7',
    symbolEs: 'La♭maj7',
    symbolEn: 'A♭maj7',
    seventh: true,
  },
  {
    id: 'ex.m5-01.f',
    key: 'Bb',
    mode: 'major',
    degree: 'V',
    root: 'F',
    quality: 'dominant7',
    symbolEs: 'Fa7',
    symbolEn: 'F7',
    seventh: true,
  },
  {
    id: 'ex.m5-01.g',
    key: 'C#',
    mode: 'natural-minor',
    degree: 'iv',
    root: 'F#',
    quality: 'minor',
    symbolEs: 'Fa♯m',
    symbolEn: 'F♯m',
    seventh: false,
  },
  {
    id: 'ex.m5-01.h',
    key: 'Eb',
    mode: 'natural-minor',
    degree: 'III',
    root: 'Gb',
    quality: 'major',
    symbolEs: 'Sol♭',
    symbolEn: 'G♭',
    seventh: false,
  },
  {
    id: 'ex.m5-01.i',
    key: 'F',
    mode: 'natural-minor',
    degree: 'v',
    root: 'C',
    quality: 'minor',
    symbolEs: 'Dom',
    symbolEn: 'Cm',
    seventh: false,
  },
  {
    id: 'ex.m5-01.j',
    key: 'G',
    mode: 'natural-minor',
    degree: 'i',
    root: 'G',
    quality: 'minor7',
    symbolEs: 'Solm7',
    symbolEn: 'Gm7',
    seventh: true,
  },
  {
    id: 'ex.m5-01.k',
    key: 'A',
    mode: 'harmonic-minor',
    degree: 'V',
    root: 'E',
    quality: 'dominant7',
    symbolEs: 'Mi7',
    symbolEn: 'E7',
    seventh: true,
  },
  {
    id: 'ex.m5-01.l',
    key: 'B',
    mode: 'natural-minor',
    degree: 'ii',
    root: 'C#',
    quality: 'half-diminished7',
    symbolEs: 'Do♯m7b5',
    symbolEn: 'C♯m7b5',
    seventh: true,
  },
] as const

let bundle: ContentBundle
let lesson: Lesson

beforeAll(async () => {
  const result = validateContentBundle(await loadContentFromDisk())
  expect(result.ok).toBe(true)
  if (!result.bundle) throw new Error('El contenido del repositorio no es válido')
  bundle = result.bundle
  const found = bundle.lessons.find((item) => item.id === 'lesson.m5-01')
  if (!found) throw new Error('Falta la lección M5-01')
  lesson = found
})

describe('M5-01 — Acordes diatónicos', () => {
  it('está publicada, validada y depende de M4-12', () => {
    expect(lesson.moduleId).toBe('M5')
    expect(lesson.slug).toBe('acordes-diatonicos')
    expect(lesson.status).toBe('published')
    expect(lesson.prerequisites).toContain('lesson.m4-12')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
    expect(lesson.objectivesEn).toHaveLength(lesson.objectivesEs.length)
    expect(lesson.skillIds).toEqual(['skill.diatonic-chords'])
    expect(lesson.exerciseIds).toHaveLength(12)
  })

  it('explica tríadas, séptimas y las cualidades en mayor y menor', () => {
    const text = lesson.sections
      .map((section) => `${section.titleEs} ${section.bodyEs ?? ''}`)
      .join(' ')
      .toLowerCase()

    for (const term of [
      'diatónico',
      'tríada',
      'séptima',
      'terceras',
      'mayor',
      'menor natural',
      'menor armónica',
      'dominante',
      'semidisminuida',
      'doce tonalidades',
    ]) {
      expect(text, `Falta el concepto: ${term}`).toContain(term)
    }

    const english = lesson.sections
      .map((section) => `${section.titleEn} ${section.bodyEn ?? ''}`)
      .join(' ')
      .toLowerCase()
    for (const term of [
      'diatonic',
      'triad',
      'seventh',
      'natural minor',
      'harmonic minor',
      'dominant',
      'half-diminished',
      'twelve keys',
    ]) {
      expect(english, `Missing concept: ${term}`).toContain(term)
    }
  })

  it('incluye dos demos con cuatro acordes cada una', () => {
    const scores = scoreSections(lesson)
    expect(scores).toHaveLength(2)

    const [major, minor] = scores
    if (!major || !minor) throw new Error('Faltan las demos de M5-01')

    expect(major.key).toBe('C')
    expect(major.mode).toBe('major')
    expect(eventMidis(major)).toEqual([
      [60, 64, 67, 71],
      [57, 60, 64, 67],
      [53, 57, 60],
      [55, 59, 62, 65],
    ])

    expect(minor.key).toBe('A')
    expect(minor.mode).toBe('minor')
    expect(eventMidis(minor)).toEqual([
      [57, 60, 64],
      [53, 57, 60, 64],
      [62, 65, 69],
      [52, 56, 59, 62],
    ])

    expect(major.events.map((event) => event.measure)).toEqual([1, 2, 3, 4])
    expect(minor.events.map((event) => event.measure)).toEqual([1, 2, 3, 4])
  })

  it('plantea doce ejercicios con las doce tonalidades', () => {
    const exercises = chordExercises(lesson, bundle)
    expect(exercises).toHaveLength(12)
    expect(new Set(exercises.map((exercise) => exercise.id)).size).toBe(12)
    expect(new Set(EXPECTED.map((item) => item.key)).size).toBe(12)

    expect(exercises.map((exercise) => exercise.id)).toEqual(
      EXPECTED.map((item) => item.id),
    )

    const byId = new Map(exercises.map((exercise) => [exercise.id, exercise]))
    for (const expected of EXPECTED) {
      const exercise = byId.get(expected.id)
      expect(exercise, expected.id).toBeDefined()
      if (!exercise) continue

      expect(rootSymbol(exercise), expected.id).toBe(expected.root)
      expect(exercise.quality, expected.id).toBe(expected.quality)
      expect(exercise.ask, expected.id).toBe('symbol')
      expect(exercise.inversion, expected.id).toBe(0)
      expect(exercise.skillId, expected.id).toBe('skill.diatonic-chords')
      expect(exercise.promptEs, `${expected.id} tonalidad ES`).toContain(
        KEY_ES[expected.key],
      )
    }

    const triads = EXPECTED.filter((item) => !item.seventh)
    const sevenths = EXPECTED.filter((item) => item.seventh)
    expect(triads).toHaveLength(6)
    expect(sevenths).toHaveLength(6)

    expect(new Set(EXPECTED.map((item) => item.mode))).toEqual(
      new Set(['major', 'natural-minor', 'harmonic-minor']),
    )
  })

  it('resuelve el cifrado correcto en español e inglés', () => {
    for (const exercise of chordExercises(lesson, bundle)) {
      const expected = EXPECTED.find((item) => item.id === exercise.id)
      if (!expected) throw new Error(`Ejercicio inesperado: ${exercise.id}`)

      const symbolEs = chordSymbol(
        fromSpelledPitch(exercise.root),
        exercise.quality,
        { notation: 'do' },
      )
      const symbolEn = chordSymbol(
        fromSpelledPitch(exercise.root),
        exercise.quality,
        { notation: 'c' },
      )
      expect(symbolEs, `${exercise.id} cifrado ES`).toBe(expected.symbolEs)
      expect(symbolEn, `${exercise.id} cifrado EN`).toBe(expected.symbolEn)

      const spanish = resolveExerciseAnswer(exercise, 'es')
      const english = resolveExerciseAnswer(exercise, 'en')
      expect(spanish.mode, `${exercise.id} modo ES`).toBe('choice')
      expect(english.mode, `${exercise.id} modo EN`).toBe('choice')
      if (spanish.mode !== 'choice' || english.mode !== 'choice') {
        throw new Error(`${exercise.id} debería responder con opciones`)
      }
      expect(spanish.answer, `${exercise.id} respuesta ES`).toBe(
        expected.symbolEs,
      )
      expect(english.answer, `${exercise.id} respuesta EN`).toBe(
        expected.symbolEn,
      )

      const choicesEs = exerciseChoices(exercise, 'es')
      const choicesEn = exerciseChoices(exercise, 'en')
      expect(choicesEs, `${exercise.id} sin opciones`).toBeDefined()
      expect(choicesEn, `${exercise.id} sin opciones EN`).toBeDefined()
      expect(choicesEs ?? []).toHaveLength(4)
      expect(choicesEn ?? []).toHaveLength(4)
      expect(new Set(choicesEs ?? []).size).toBe(4)
      expect(new Set(choicesEn ?? []).size).toBe(4)
      expect(choicesEs ?? [], `${exercise.id} opciones ES`).toContain(
        spanish.answer,
      )
      expect(choicesEn ?? [], `${exercise.id} opciones EN`).toContain(
        english.answer,
      )
      expect(
        (choicesEs ?? []).indexOf(spanish.answer),
        `${exercise.id} índice de la respuesta`,
      ).toBe((choicesEn ?? []).indexOf(english.answer))
    }
  })

  it('incluye una tarea de teclado con Imaj7-V7 y demo', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.tempoBpm).toBe(60)
    expect(task?.keys).toHaveLength(8)
    expect(task?.checklistEs.length).toBeGreaterThanOrEqual(3)
    expect(task?.checklistEn).toHaveLength(task?.checklistEs.length ?? 0)
    expect(task?.instructionsEs).toMatch(/bloque/i)
    expect(task?.instructionsEs).toMatch(/arpegio/i)
    expect(task?.instructionsEs).toMatch(/Domaj7/)
    expect(task?.instructionsEs).toMatch(/Sol7/)

    const demo = task?.demoScore
    expect(demo).toBeDefined()
    if (!demo) throw new Error('Falta la demo de la tarea')
    expect(eventMidis(demo)).toEqual([
      [60, 64, 67, 71],
      [55, 59, 62, 65],
    ])
  })

  it('registra la habilidad de acordes diatónicos', () => {
    const skill = bundle.skills.find(
      (item) => item.id === 'skill.diatonic-chords',
    )
    expect(skill).toBeDefined()
    expect(skill?.kind).toBe('chord')
    expect(skill?.lessonIds).toContain('lesson.m5-01')
    expect(skill?.labelEs.length).toBeGreaterThan(0)
    expect(skill?.labelEn.length).toBeGreaterThan(0)
    expect(skill?.params.keys).toHaveLength(12)
  })
})
