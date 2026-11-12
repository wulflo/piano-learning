import { beforeAll, describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { exerciseChoices } from '../src/content/localize'
import { validateContentBundle } from '../src/content/validate'
import { resolveExerciseAnswer } from '../src/exercises/answer'
import {
  stylePatternInMeasure,
  styleProgressionDegrees,
  styleVoicingCandidates,
} from '../src/exercises/style-pattern'
import type { ContentBundle, Exercise, Lesson, Score } from '../src/schemas'

function lessonExercises(lesson: Lesson, bundle: ContentBundle): Exercise[] {
  return lesson.exerciseIds
    .map((id) => bundle.exercises.find((item) => item.id === id))
    .filter((exercise): exercise is Exercise => Boolean(exercise))
}

function scoreSections(
  lesson: Lesson,
): Array<{ sectionId: string; score: Score }> {
  return lesson.sections.flatMap((section) =>
    section.kind === 'score' && section.score
      ? [{ sectionId: section.id, score: section.score }]
      : [],
  )
}

function measureSymbols(score: Score, measure: number): string[] {
  return score.events
    .filter((event) => event.measure === measure)
    .map((event) => event.chordSymbol)
    .filter((symbol): symbol is string => symbol !== undefined)
}

let bundle: ContentBundle
let lesson: Lesson

beforeAll(async () => {
  const result = validateContentBundle(await loadContentFromDisk())
  expect(result.ok).toBe(true)
  if (!result.bundle) throw new Error('El contenido del repositorio no es válido')
  bundle = result.bundle
  const found = bundle.lessons.find((item) => item.id === 'lesson.m8-04')
  if (!found) throw new Error('Falta la lección M8-04')
  lesson = found
})

describe('M8-04 — Ritmos latinos', () => {
  it('es una lección opcional que sigue a M8-03', () => {
    expect(lesson.moduleId).toBe('M8')
    expect(lesson.slug).toBe('ritmos-latinos')
    expect(lesson.status).toBe('published')
    expect(lesson.optional).toBe(true)
    expect(lesson.prerequisites).toContain('lesson.m8-03')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
    expect(lesson.objectivesEn).toHaveLength(lesson.objectivesEs.length)
    expect(lesson.skillIds).toEqual(['skill.latin'])
    expect(lesson.exerciseIds).toHaveLength(12)
    expect(lesson.minutes).toBeLessThanOrEqual(20)
  })

  it('explica la bossa nova, el montuno y el bucle I–vi–ii–V', () => {
    const text = lesson.sections
      .map((section) => `${section.titleEs} ${section.bodyEs ?? ''}`)
      .join(' ')
      .toLowerCase()

    for (const term of [
      'bossa nova',
      'montuno',
      'clave',
      'i–vi–ii–v',
      '2 y 4',
      '0,5',
      'calle de coral',
    ]) {
      expect(text, `Falta el concepto: ${term}`).toContain(term)
    }

    const english = lesson.sections
      .map((section) => `${section.titleEn} ${section.bodyEn ?? ''}`)
      .join(' ')
      .toLowerCase()
    for (const term of [
      'bossa nova',
      'montuno',
      'clave',
      'i–vi–ii–v',
      '2 and 4',
      '0.5',
      'coral street',
    ]) {
      expect(english, `Missing concept: ${term}`).toContain(term)
    }
  })

  it('incluye una demo de bossa y el ejemplo original «Calle de coral»', () => {
    const demos = scoreSections(lesson)
    expect(demos).toHaveLength(2)

    const byId = new Map(demos.map((demo) => [demo.sectionId, demo.score]))

    const bossa = byId.get('sec.m8-04.demo-bossa')
    expect(bossa).toBeDefined()
    if (bossa) {
      expect(bossa.tempoBpm).toBe(120)
      expect(new Set(bossa.events.map((event) => event.measure))).toEqual(
        new Set([1, 2, 3, 4]),
      )
      expect(
        Array.from({ length: 4 }, (_, index) =>
          measureSymbols(bossa, index + 1),
        ),
      ).toEqual([['Cmaj7'], ['Am7'], ['Dm7'], ['G7']])
      for (const measure of [1, 2, 3, 4]) {
        expect(stylePatternInMeasure(bossa, measure), `compás ${measure}`).toBe(
          'bossa',
        )
      }
    }

    const theme = byId.get('sec.m8-04.demo-tema')
    expect(theme).toBeDefined()
    if (theme) {
      expect(theme.tempoBpm).toBe(108)
      expect(new Set(theme.events.map((event) => event.measure))).toEqual(
        new Set([1, 2, 3, 4, 5, 6, 7, 8]),
      )
      expect(
        Array.from({ length: 8 }, (_, index) =>
          measureSymbols(theme, index + 1),
        ),
      ).toEqual([
        ['Cmaj7'],
        ['Am7'],
        ['Dm7'],
        ['G7'],
        ['Cmaj7'],
        ['Am7'],
        ['Dm7'],
        ['G7'],
      ])
      const melody = theme.events.filter(
        (event) =>
          event.hand === 'right' &&
          event.pitches.length === 1 &&
          event.chordSymbol === undefined,
      )
      expect(melody).toHaveLength(32)
    }
  })

  it('plantea cuatro patrones, cuatro progresiones, dos cifrados y dos voicings', () => {
    const exercises = lessonExercises(lesson, bundle)
    expect(exercises).toHaveLength(12)

    const byAsk = new Map<string, Exercise[]>()
    for (const exercise of exercises) {
      expect(exercise.type, exercise.id).toBe('style-pattern')
      if (exercise.type !== 'style-pattern') continue
      expect(exercise.style, exercise.id).toBe('latin')
      expect(exercise.skillId, exercise.id).toBe('skill.latin')
      const list = byAsk.get(exercise.ask) ?? []
      list.push(exercise)
      byAsk.set(exercise.ask, list)
    }

    expect(byAsk.get('pattern')).toHaveLength(4)
    expect(byAsk.get('progression')).toHaveLength(4)
    expect(byAsk.get('chord')).toHaveLength(2)
    expect(byAsk.get('voicing')).toHaveLength(2)

    for (const exercise of exercises) {
      expect(
        'choices' in exercise ? exercise.choices : undefined,
        exercise.id,
      ).toHaveLength(4)
      expect(exercise.choicesEn, exercise.id).toHaveLength(4)
      expect(exercise.difficulty, exercise.id).toBeGreaterThanOrEqual(1)
      expect(exercise.difficulty, exercise.id).toBeLessThanOrEqual(4)
    }
  })

  it('reconoce la bossa nova y el montuno en las cuatro tonalidades', () => {
    const exercises = lessonExercises(lesson, bundle).filter(
      (exercise) =>
        exercise.type === 'style-pattern' && exercise.ask === 'pattern',
    )
    expect(exercises).toHaveLength(4)

    const expected = [
      { key: 'C', pattern: 'bossa', es: 'Bossa nova', en: 'Bossa nova' },
      { key: 'F', pattern: 'bossa', es: 'Bossa nova', en: 'Bossa nova' },
      { key: 'Bb', pattern: 'montuno', es: 'Montuno', en: 'Montuno' },
      { key: 'Eb', pattern: 'montuno', es: 'Montuno', en: 'Montuno' },
    ]
    for (const [index, exercise] of exercises.entries()) {
      if (exercise.type !== 'style-pattern') continue
      expect(exercise.score.key, exercise.id).toBe(expected[index]?.key)
      expect(
        stylePatternInMeasure(exercise.score, exercise.measure),
        exercise.id,
      ).toBe(expected[index]?.pattern)
      const spanish = resolveExerciseAnswer(exercise, 'es')
      const english = resolveExerciseAnswer(exercise, 'en')
      expect(spanish.mode, `${exercise.id} ES`).toBe('choice')
      expect(english.mode, `${exercise.id} EN`).toBe('choice')
      if (spanish.mode !== 'choice' || english.mode !== 'choice') continue
      expect(spanish.answer).toBe(expected[index]?.es)
      expect(english.answer).toBe(expected[index]?.en)
    }
  })

  it('resuelve los grados I–vi–ii–V en las cuatro tonalidades', () => {
    const exercises = lessonExercises(lesson, bundle).filter(
      (exercise) =>
        exercise.type === 'style-pattern' && exercise.ask === 'progression',
    )
    expect(exercises).toHaveLength(4)

    const keys: string[] = []
    for (const exercise of exercises) {
      if (exercise.type !== 'style-pattern') continue
      keys.push(exercise.score.key)
    }
    expect(keys).toEqual(['C', 'F', 'Bb', 'Eb'])

    for (const exercise of exercises) {
      if (exercise.type !== 'style-pattern') continue
      expect(styleProgressionDegrees(exercise.score), exercise.id).toEqual([
        'I',
        'vi',
        'ii',
        'V',
      ])
      const spanish = resolveExerciseAnswer(exercise, 'es')
      const english = resolveExerciseAnswer(exercise, 'en')
      expect(spanish.mode, `${exercise.id} ES`).toBe('choice')
      expect(english.mode, `${exercise.id} EN`).toBe('choice')
      if (spanish.mode !== 'choice' || english.mode !== 'choice') continue
      expect(spanish.answer).toBe('I–vi–ii–V')
      expect(english.answer).toBe('I–vi–ii–V')
      expect(exerciseChoices(exercise, 'es')).toContain(spanish.answer)
      expect(exerciseChoices(exercise, 'en')).toContain(english.answer)
    }
  })

  it('pregunta el cifrado de dos compases', () => {
    const exercises = lessonExercises(lesson, bundle).filter(
      (exercise) =>
        exercise.type === 'style-pattern' && exercise.ask === 'chord',
    )
    expect(exercises).toHaveLength(2)

    const expected = [
      { key: 'C', measure: 2, symbol: 'Am7' },
      { key: 'Eb', measure: 4, symbol: 'Bb7' },
    ]
    for (const [index, exercise] of exercises.entries()) {
      if (exercise.type !== 'style-pattern') continue
      expect(exercise.score.key, exercise.id).toBe(expected[index]?.key)
      expect(exercise.measure, exercise.id).toBe(expected[index]?.measure)
      expect(measureSymbols(exercise.score, exercise.measure)).toEqual([
        expected[index]?.symbol,
      ])
      const spanish = resolveExerciseAnswer(exercise, 'es')
      const english = resolveExerciseAnswer(exercise, 'en')
      expect(spanish.mode, `${exercise.id} ES`).toBe('choice')
      expect(english.mode, `${exercise.id} EN`).toBe('choice')
      if (spanish.mode !== 'choice' || english.mode !== 'choice') continue
      expect(spanish.answer).toBe(expected[index]?.symbol)
      expect(english.answer).toBe(expected[index]?.symbol)
    }
  })

  it('pregunta las notas de dos acordes de tres voces', () => {
    const exercises = lessonExercises(lesson, bundle).filter(
      (exercise) =>
        exercise.type === 'style-pattern' && exercise.ask === 'voicing',
    )
    expect(exercises).toHaveLength(2)

    const expected = [
      { key: 'C', measure: 1, es: 'Mi4 + Sol4 + Si4', en: 'E4 + G4 + B4' },
      {
        key: 'Eb',
        measure: 3,
        es: 'La♭3 + Do4 + Mi♭4',
        en: 'Ab3 + C4 + Eb4',
      },
    ]
    for (const [index, exercise] of exercises.entries()) {
      if (exercise.type !== 'style-pattern') continue
      expect(exercise.score.key, exercise.id).toBe(expected[index]?.key)
      expect(exercise.measure, exercise.id).toBe(expected[index]?.measure)
      expect(
        styleVoicingCandidates(exercise.score, exercise.measure, 'es'),
        exercise.id,
      ).toEqual([expected[index]?.es])
      expect(
        styleVoicingCandidates(exercise.score, exercise.measure, 'en'),
        exercise.id,
      ).toEqual([expected[index]?.en])

      const spanish = resolveExerciseAnswer(exercise, 'es')
      const english = resolveExerciseAnswer(exercise, 'en')
      expect(spanish.mode, `${exercise.id} ES`).toBe('choice')
      expect(english.mode, `${exercise.id} EN`).toBe('choice')
      if (spanish.mode !== 'choice' || english.mode !== 'choice') continue
      expect(spanish.answer).toBe(expected[index]?.es)
      expect(english.answer).toBe(expected[index]?.en)
      expect(exerciseChoices(exercise, 'es')).toContain(spanish.answer)
      expect(exerciseChoices(exercise, 'en')).toContain(english.answer)
    }
  })

  it('incluye una tarea opcional de bossa a 80 BPM', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.tempoBpm).toBe(80)
    expect(task?.keys.length).toBeGreaterThanOrEqual(10)
    expect(task?.checklistEs.length).toBeGreaterThanOrEqual(5)
    expect(task?.checklistEn).toHaveLength(task?.checklistEs.length ?? 0)
    expect(task?.instructionsEs).toMatch(/80 BPM/)
    expect(task?.instructionsEs).toMatch(/Do3, La2, Re3 y Sol2/)
    expect(task?.instructionsEs).toMatch(/I–vi–ii–V/)
    expect(task?.instructionsEs).toMatch(/Mi4\+Sol4\+Si4/)
    expect(task?.instructionsEs).toMatch(/dolor, tensión o cansancio/)
    expect(task?.instructionsEn).toMatch(/80 BPM/)
    expect(task?.instructionsEn).toMatch(/C3, A2, D3 and G2/)
    expect(task?.instructionsEn).toMatch(/I–vi–ii–V/)
    expect(task?.instructionsEn).toMatch(/E4\+G4\+B4/)
    expect(task?.instructionsEn).toMatch(/pain, tension or fatigue/)
    expect(task?.demoScore).toBeDefined()
  })

  it('registra la habilidad de ritmos latinos', () => {
    const skill = bundle.skills.find((item) => item.id === 'skill.latin')
    expect(skill?.kind).toBe('keyboard-task')
    expect(skill?.lessonIds).toEqual(['lesson.m8-04'])
    expect(skill?.params.styles).toEqual(['bossa', 'montuno'])
    expect(skill?.params.progression).toBe('I–vi–ii–V')
    expect(skill?.params.keys).toEqual(['C', 'F', 'Bb', 'Eb'])
  })
})
