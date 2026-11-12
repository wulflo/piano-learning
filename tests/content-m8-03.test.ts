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
  const found = bundle.lessons.find((item) => item.id === 'lesson.m8-03')
  if (!found) throw new Error('Falta la lección M8-03')
  lesson = found
})

describe('M8-03 — Jazz básico', () => {
  it('es una lección opcional que sigue a M8-02', () => {
    expect(lesson.moduleId).toBe('M8')
    expect(lesson.slug).toBe('jazz-basico')
    expect(lesson.status).toBe('published')
    expect(lesson.optional).toBe(true)
    expect(lesson.prerequisites).toContain('lesson.m8-02')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
    expect(lesson.objectivesEn).toHaveLength(lesson.objectivesEs.length)
    expect(lesson.skillIds).toEqual(['skill.jazz'])
    expect(lesson.exerciseIds).toHaveLength(12)
    expect(lesson.minutes).toBeLessThanOrEqual(20)
  })

  it('explica el swing, la cadencia ii–V–I y los voicings', () => {
    const text = lesson.sections
      .map((section) => `${section.titleEs} ${section.bodyEs ?? ''}`)
      .join(' ')
      .toLowerCase()

    for (const term of [
      'swing',
      'comping',
      'contratiempos',
      'ii–v–i',
      'notas guía',
      'voicing',
      'sin fundamental',
      '3-5-7-9',
      'tren de medianoche',
      '2 y 4',
    ]) {
      expect(text, `Falta el concepto: ${term}`).toContain(term)
    }

    const english = lesson.sections
      .map((section) => `${section.titleEn} ${section.bodyEn ?? ''}`)
      .join(' ')
      .toLowerCase()
    for (const term of [
      'swing',
      'comping',
      'off-beats',
      'ii–v–i',
      'guide tones',
      'voicing',
      'rootless',
      'midnight train',
      '2 and 4',
    ]) {
      expect(english, `Missing concept: ${term}`).toContain(term)
    }
  })

  it('incluye una demo de swing y el ejemplo original «Tren de medianoche»', () => {
    const demos = scoreSections(lesson)
    expect(demos).toHaveLength(2)

    const byId = new Map(demos.map((demo) => [demo.sectionId, demo.score]))

    const swing = byId.get('sec.m8-03.demo-swing')
    expect(swing).toBeDefined()
    if (swing) {
      expect(swing.tempoBpm).toBe(96)
      expect(new Set(swing.events.map((event) => event.measure))).toEqual(
        new Set([1, 2, 3, 4]),
      )
      expect(
        Array.from({ length: 4 }, (_, index) =>
          measureSymbols(swing, index + 1),
        ),
      ).toEqual([['Dm7'], ['G7'], ['Cmaj7'], ['A7']])
      for (const measure of [1, 2, 3, 4]) {
        expect(stylePatternInMeasure(swing, measure), `compás ${measure}`).toBe(
          'shuffle',
        )
      }
    }

    const theme = byId.get('sec.m8-03.demo-tema')
    expect(theme).toBeDefined()
    if (theme) {
      expect(theme.tempoBpm).toBe(100)
      expect(new Set(theme.events.map((event) => event.measure))).toEqual(
        new Set([1, 2, 3, 4, 5, 6, 7, 8]),
      )
      expect(
        Array.from({ length: 8 }, (_, index) =>
          measureSymbols(theme, index + 1),
        ),
      ).toEqual([
        ['Dm7'],
        ['G7'],
        ['Cmaj7'],
        ['A7'],
        ['Dm7'],
        ['G7'],
        ['Cmaj7'],
        ['Cmaj7'],
      ])
      const melody = theme.events.filter(
        (event) =>
          event.hand === 'right' &&
          event.pitches.length === 1 &&
          event.chordSymbol === undefined,
      )
      expect(melody.length).toBeGreaterThanOrEqual(20)
    }
  })

  it('plantea cuatro patrones, cuatro progresiones, dos cifrados y dos voicings', () => {
    const exercises = lessonExercises(lesson, bundle)
    expect(exercises).toHaveLength(12)

    const byAsk = new Map<string, Exercise[]>()
    for (const exercise of exercises) {
      expect(exercise.type, exercise.id).toBe('style-pattern')
      if (exercise.type !== 'style-pattern') continue
      expect(exercise.style, exercise.id).toBe('jazz')
      expect(exercise.skillId, exercise.id).toBe('skill.jazz')
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

  it('reconoce el swing, el comping, las negras y la síncopa', () => {
    const exercises = lessonExercises(lesson, bundle).filter(
      (exercise) =>
        exercise.type === 'style-pattern' && exercise.ask === 'pattern',
    )
    expect(exercises).toHaveLength(4)

    const expected = [
      { pattern: 'shuffle', es: 'Shuffle', en: 'Shuffle' },
      { pattern: 'comping', es: 'Comping', en: 'Comping' },
      { pattern: 'quarters', es: 'Negras', en: 'Quarters' },
      { pattern: 'syncopated', es: 'Síncopa', en: 'Syncopation' },
    ]
    for (const [index, exercise] of exercises.entries()) {
      if (exercise.type !== 'style-pattern') continue
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

  it('resuelve los grados ii–V–I–VI en las cuatro tonalidades', () => {
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
        'ii',
        'V',
        'I',
        'VI',
      ])
      const spanish = resolveExerciseAnswer(exercise, 'es')
      const english = resolveExerciseAnswer(exercise, 'en')
      expect(spanish.mode, `${exercise.id} ES`).toBe('choice')
      expect(english.mode, `${exercise.id} EN`).toBe('choice')
      if (spanish.mode !== 'choice' || english.mode !== 'choice') continue
      expect(spanish.answer).toBe('ii–V–I–VI')
      expect(english.answer).toBe('ii–V–I–VI')
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
      { key: 'C', measure: 2, symbol: 'G7' },
      { key: 'Bb', measure: 3, symbol: 'Bbmaj7' },
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

  it('pregunta las notas de dos voicings sin fundamental', () => {
    const exercises = lessonExercises(lesson, bundle).filter(
      (exercise) =>
        exercise.type === 'style-pattern' && exercise.ask === 'voicing',
    )
    expect(exercises).toHaveLength(2)

    const expected = [
      { key: 'C', measure: 3, es: 'Mi4 + Sol4 + Si4 + Re5', en: 'E4 + G4 + B4 + D5' },
      {
        key: 'Eb',
        measure: 2,
        es: 'La♭3 + Do4 + Re4 + Sol4',
        en: 'Ab3 + C4 + D4 + G4',
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

  it('incluye una tarea opcional de ii–V–I a 80 BPM', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.tempoBpm).toBe(80)
    expect(task?.keys.length).toBeGreaterThanOrEqual(9)
    expect(task?.checklistEs.length).toBeGreaterThanOrEqual(5)
    expect(task?.checklistEn).toHaveLength(task?.checklistEs.length ?? 0)
    expect(task?.instructionsEs).toMatch(/80 BPM/)
    expect(task?.instructionsEs).toMatch(/Re3, Sol3, Do3 y La3/)
    expect(task?.instructionsEs).toMatch(/ii–V–I–VI/)
    expect(task?.instructionsEs).toMatch(/Fa4\+Do5/)
    expect(task?.instructionsEs).toMatch(/dolor, tensión o cansancio/)
    expect(task?.instructionsEn).toMatch(/80 BPM/)
    expect(task?.instructionsEn).toMatch(/D3, G3, C3 and A3/)
    expect(task?.instructionsEn).toMatch(/ii–V–I–VI/)
    expect(task?.instructionsEn).toMatch(/F4\+C5/)
    expect(task?.instructionsEn).toMatch(/pain, tension or fatigue/)
    expect(task?.demoScore).toBeDefined()
  })

  it('registra la habilidad de jazz', () => {
    const skill = bundle.skills.find((item) => item.id === 'skill.jazz')
    expect(skill?.kind).toBe('keyboard-task')
    expect(skill?.lessonIds).toEqual(['lesson.m8-03'])
    expect(skill?.params.progressions).toEqual(['ii–V–I', 'ii–V–I–VI'])
    expect(skill?.params.patterns).toEqual([
      'swing',
      'comping',
      'quarters',
      'syncopated',
    ])
    expect(skill?.params.voicings).toEqual(['shell', 'rootless'])
    expect(skill?.params.keys).toEqual(['C', 'F', 'Bb', 'Eb'])
  })
})
