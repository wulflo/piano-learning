import { beforeAll, describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { exerciseChoices } from '../src/content/localize'
import { validateContentBundle } from '../src/content/validate'
import { resolveExerciseAnswer } from '../src/exercises/answer'
import { chordSymbol, fromSpelledPitch, midiOf } from '../src/theory'
import type { ContentBundle, Exercise, Lesson, Score } from '../src/schemas'

const KEY_ES: Record<string, string> = {
  C: 'Do',
  D: 'Re',
  E: 'Mi',
  F: 'Fa',
  G: 'Sol',
  A: 'La',
  Bb: 'Si♭',
}

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

function eventMidis(score: Score): number[][] {
  return score.events.map((event) =>
    event.pitches
      .map((pitch) => midiOf(fromSpelledPitch(pitch)))
      .sort((first, second) => first - second),
  )
}

const ROMAN = [
  { id: 'ex.m5-02.a', key: 'C', mode: 'major', numeral: 'IV', direction: 'chord-to-numeral' },
  { id: 'ex.m5-02.b', key: 'G', mode: 'major', numeral: 'V', direction: 'chord-to-numeral' },
  { id: 'ex.m5-02.c', key: 'A', mode: 'minor', numeral: 'V', direction: 'chord-to-numeral' },
  { id: 'ex.m5-02.d', key: 'D', mode: 'major', numeral: 'vi', direction: 'chord-to-numeral' },
  { id: 'ex.m5-02.e', key: 'F', mode: 'major', numeral: 'V', direction: 'chord-to-numeral' },
  { id: 'ex.m5-02.f', key: 'E', mode: 'minor', numeral: 'ii°', direction: 'chord-to-numeral' },
] as const

const CHORDS = [
  { id: 'ex.m5-02.g', key: 'C', root: 'F', quality: 'major', symbolEs: 'Fa', symbolEn: 'F' },
  { id: 'ex.m5-02.h', key: 'G', root: 'D', quality: 'major', symbolEs: 'Re', symbolEn: 'D' },
  { id: 'ex.m5-02.i', key: 'D', root: 'D', quality: 'minor', symbolEs: 'Rem', symbolEn: 'Dm' },
  { id: 'ex.m5-02.j', key: 'F', root: 'G', quality: 'minor', symbolEs: 'Solm', symbolEn: 'Gm' },
  { id: 'ex.m5-02.k', key: 'A', root: 'E', quality: 'major', symbolEs: 'Mi', symbolEn: 'E' },
  { id: 'ex.m5-02.l', key: 'Bb', root: 'A', quality: 'diminished', symbolEs: 'Ladim', symbolEn: 'Adim' },
] as const

let bundle: ContentBundle
let lesson: Lesson

beforeAll(async () => {
  const result = validateContentBundle(await loadContentFromDisk())
  expect(result.ok).toBe(true)
  if (!result.bundle) throw new Error('El contenido del repositorio no es válido')
  bundle = result.bundle
  const found = bundle.lessons.find((item) => item.id === 'lesson.m5-02')
  if (!found) throw new Error('Falta la lección M5-02')
  lesson = found
})

describe('M5-02 — Números romanos', () => {
  it('está publicada, validada y depende de M5-01', () => {
    expect(lesson.moduleId).toBe('M5')
    expect(lesson.slug).toBe('numeros-romanos')
    expect(lesson.status).toBe('published')
    expect(lesson.prerequisites).toContain('lesson.m5-01')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
    expect(lesson.objectivesEn).toHaveLength(lesson.objectivesEs.length)
    expect(lesson.skillIds).toEqual(['skill.roman-numeral'])
    expect(lesson.exerciseIds).toHaveLength(12)
  })

  it('explica el cifrado, las cualidades y ambos sentidos', () => {
    const text = lesson.sections
      .map((section) => `${section.titleEs} ${section.bodyEs ?? ''}`)
      .join(' ')
      .toLowerCase()

    for (const term of [
      'número romano',
      'grado',
      'mayúscula',
      'minúscula',
      'disminuido',
      'v7',
      'vii°',
      'armónica',
      'ambos sentidos',
    ]) {
      expect(text, `Falta el concepto: ${term}`).toContain(term)
    }

    const english = lesson.sections
      .map((section) => `${section.titleEn} ${section.bodyEn ?? ''}`)
      .join(' ')
      .toLowerCase()
    for (const term of [
      'roman numeral',
      'degree',
      'uppercase',
      'lowercase',
      'diminished',
      'v7',
      'vii°',
      'harmonic minor',
      'both directions',
    ]) {
      expect(english, `Missing concept: ${term}`).toContain(term)
    }
  })

  it('incluye una demo con la progresión I-IV-V-I', () => {
    const scores = scoreSections(lesson)
    expect(scores).toHaveLength(1)

    const demo = scores[0]
    if (!demo) throw new Error('Falta la demo de M5-02')

    expect(demo.key).toBe('C')
    expect(demo.mode).toBe('major')
    expect(demo.events).toHaveLength(4)
    expect(eventMidis(demo)).toEqual([
      [60, 64, 67],
      [53, 57, 60],
      [55, 59, 62],
      [60, 64, 67],
    ])
  })

  it('planta seis ejercicios de acorde a numeral', () => {
    const exercises = lessonExercises(lesson, bundle).filter(
      (exercise) => exercise.type === 'roman-numeral',
    )
    expect(exercises).toHaveLength(6)

    const byId = new Map(exercises.map((exercise) => [exercise.id, exercise]))
    for (const expected of ROMAN) {
      const exercise = byId.get(expected.id)
      expect(exercise, expected.id).toBeDefined()
      if (!exercise || exercise.type !== 'roman-numeral') continue

      expect(exercise.key, expected.id).toBe(expected.key)
      expect(exercise.mode, expected.id).toBe(expected.mode)
      expect(exercise.numeral, expected.id).toBe(expected.numeral)
      expect(exercise.skillId, expected.id).toBe('skill.roman-numeral')
      expect(exercise.promptEs, `${expected.id} tonalidad ES`).toContain(
        KEY_ES[expected.key],
      )
      expect(exercise.promptEs, `${expected.id} dirección`).toMatch(
        /acorde| Fa| Re| Mi| Si| Do| Sol/,
      )

      const spanish = resolveExerciseAnswer(exercise, 'es')
      const english = resolveExerciseAnswer(exercise, 'en')
      expect(spanish.mode, `${exercise.id} modo ES`).toBe('choice')
      expect(english.mode, `${exercise.id} modo EN`).toBe('choice')
      if (spanish.mode !== 'choice' || english.mode !== 'choice') continue

      expect(spanish.answer, `${exercise.id} respuesta ES`).toBe(expected.numeral)
      expect(english.answer, `${exercise.id} respuesta EN`).toBe(expected.numeral)

      const choicesEs = exerciseChoices(exercise, 'es')
      const choicesEn = exerciseChoices(exercise, 'en')
      expect(choicesEs ?? [], `${exercise.id} opciones ES`).toContain(
        expected.numeral,
      )
      expect(choicesEn ?? [], `${exercise.id} opciones EN`).toContain(
        expected.numeral,
      )
      expect(
        (choicesEs ?? []).indexOf(spanish.answer),
        `${exercise.id} índice de la respuesta`,
      ).toBe((choicesEn ?? []).indexOf(english.answer))
    }

    expect(new Set(ROMAN.map((item) => item.numeral))).toEqual(
      new Set(['IV', 'V', 'vi', 'ii°']),
    )
  })

  it('planta seis ejercicios de numeral a acorde con cualidades', () => {
    const exercises = lessonExercises(lesson, bundle).filter(
      (exercise): exercise is Extract<Exercise, { type: 'chord' }> =>
        exercise.type === 'chord',
    )
    expect(exercises).toHaveLength(6)

    const byId = new Map(exercises.map((exercise) => [exercise.id, exercise]))
    for (const expected of CHORDS) {
      const exercise = byId.get(expected.id)
      expect(exercise, expected.id).toBeDefined()
      if (!exercise) continue

      expect(exercise.ask, expected.id).toBe('symbol')
      expect(exercise.inversion, expected.id).toBe(0)
      expect(exercise.skillId, expected.id).toBe('skill.roman-numeral')
      expect(`${exercise.root.step}${exercise.root.accidental}`, expected.id).toBe(
        expected.root,
      )
      expect(exercise.quality, expected.id).toBe(expected.quality)
      expect(exercise.promptEs, `${expected.id} tonalidad ES`).toContain(
        KEY_ES[expected.key],
      )
      expect(exercise.promptEs, `${expected.id} numeral`).toMatch(/[IViv]+°?/)

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
      if (spanish.mode !== 'choice' || english.mode !== 'choice') continue

      expect(spanish.answer, `${exercise.id} respuesta ES`).toBe(expected.symbolEs)
      expect(english.answer, `${exercise.id} respuesta EN`).toBe(expected.symbolEn)

      const choicesEs = exerciseChoices(exercise, 'es')
      const choicesEn = exerciseChoices(exercise, 'en')
      expect(choicesEs ?? [], `${exercise.id} opciones ES`).toContain(
        expected.symbolEs,
      )
      expect(choicesEn ?? [], `${exercise.id} opciones EN`).toContain(
        expected.symbolEn,
      )
      expect(
        (choicesEs ?? []).indexOf(spanish.answer),
        `${exercise.id} índice de la respuesta`,
      ).toBe((choicesEn ?? []).indexOf(english.answer))
    }

    expect(new Set(CHORDS.map((item) => item.quality))).toEqual(
      new Set(['major', 'minor', 'diminished']),
    )
  })

  it('incluye una tarea de teclado con I-IV-V-I y demo', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.tempoBpm).toBe(60)
    expect(task?.keys.length).toBeGreaterThanOrEqual(9)
    expect(task?.checklistEs.length).toBeGreaterThanOrEqual(3)
    expect(task?.checklistEn).toHaveLength(task?.checklistEs.length ?? 0)
    expect(task?.instructionsEs).toMatch(/bloque/i)
    expect(task?.instructionsEs).toMatch(/arpegio/i)

    const demo = task?.demoScore
    expect(demo).toBeDefined()
    if (!demo) throw new Error('Falta la demo de la tarea')
    expect(eventMidis(demo)).toEqual([
      [60, 64, 67],
      [53, 57, 60],
      [55, 59, 62],
      [60, 64, 67],
    ])
  })

  it('registra la habilidad de números romanos', () => {
    const skill = bundle.skills.find((item) => item.id === 'skill.roman-numeral')
    expect(skill).toBeDefined()
    expect(skill?.kind).toBe('roman-numeral')
    expect(skill?.lessonIds).toContain('lesson.m5-02')
    expect(skill?.labelEs.length).toBeGreaterThan(0)
    expect(skill?.labelEn.length).toBeGreaterThan(0)
    expect(skill?.params.directions).toEqual([
      'numeral-to-chord',
      'chord-to-numeral',
    ])
  })
})
