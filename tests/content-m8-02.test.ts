import { beforeAll, describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { exerciseChoices } from '../src/content/localize'
import { validateContentBundle } from '../src/content/validate'
import { resolveExerciseAnswer } from '../src/exercises/answer'
import {
  stylePatternInMeasure,
  styleProgressionDegrees,
  styleScaleCandidates,
  styleScaleName,
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

function spelledNotes(score: Score): string[] {
  return score.events.flatMap((event) =>
    event.pitches.map(
      (pitch) => `${pitch.step}${pitch.accidental}${pitch.octave}`,
    ),
  )
}

let bundle: ContentBundle
let lesson: Lesson

beforeAll(async () => {
  const result = validateContentBundle(await loadContentFromDisk())
  expect(result.ok).toBe(true)
  if (!result.bundle) throw new Error('El contenido del repositorio no es válido')
  bundle = result.bundle
  const found = bundle.lessons.find((item) => item.id === 'lesson.m8-02')
  if (!found) throw new Error('Falta la lección M8-02')
  lesson = found
})

describe('M8-02 — Blues', () => {
  it('es una lección opcional que sigue a M8-01', () => {
    expect(lesson.moduleId).toBe('M8')
    expect(lesson.slug).toBe('blues')
    expect(lesson.status).toBe('published')
    expect(lesson.optional).toBe(true)
    expect(lesson.prerequisites).toContain('lesson.m8-01')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
    expect(lesson.objectivesEn).toHaveLength(lesson.objectivesEs.length)
    expect(lesson.skillIds).toEqual(['skill.blues'])
    expect(lesson.exerciseIds).toHaveLength(12)
    expect(lesson.minutes).toBeLessThanOrEqual(20)
  })

  it('explica el shuffle, la forma de 12 compases y la escala de blues', () => {
    const text = lesson.sections
      .map((section) => `${section.titleEs} ${section.bodyEs ?? ''}`)
      .join(' ')
      .toLowerCase()

    for (const term of [
      'shuffle',
      'comping',
      'contratiempos',
      'backbeat',
      '12 compases',
      'i–iv–i–i–iv–iv–i–i–v–iv–i–v',
      'turnaround',
      'hexafonía',
      'mi♭',
      'sol♭',
      'si♭',
      'notas azules',
    ]) {
      expect(text, `Falta el concepto: ${term}`).toContain(term)
    }

    const english = lesson.sections
      .map((section) => `${section.titleEn} ${section.bodyEn ?? ''}`)
      .join(' ')
      .toLowerCase()
    for (const term of [
      'shuffle',
      'comping',
      'off-beats',
      'backbeat',
      '12 bars',
      'i–iv–i–i–iv–iv–i–i–v–iv–i–v',
      'turnaround',
      'hexaphonic',
      'blue notes',
    ]) {
      expect(english, `Missing concept: ${term}`).toContain(term)
    }
  })

  it('incluye una demo de shuffle y el ejemplo original «Ruta azul»', () => {
    const demos = scoreSections(lesson)
    expect(demos).toHaveLength(2)

    const byId = new Map(demos.map((demo) => [demo.sectionId, demo.score]))

    const shuffle = byId.get('sec.m8-02.demo-shuffle')
    expect(shuffle).toBeDefined()
    if (shuffle) {
      expect(shuffle.tempoBpm).toBe(96)
      expect(new Set(shuffle.events.map((event) => event.measure))).toEqual(
        new Set([1, 2, 3, 4]),
      )
      expect(shuffle.events.map((event) => event.chordSymbol)).toContain('C7')
      for (const measure of [1, 2, 3, 4]) {
        expect(stylePatternInMeasure(shuffle, measure), `compás ${measure}`).toBe(
          'shuffle',
        )
      }
    }

    const blues = byId.get('sec.m8-02.demo-blues')
    expect(blues).toBeDefined()
    if (blues) {
      expect(blues.tempoBpm).toBe(96)
      expect(new Set(blues.events.map((event) => event.measure))).toEqual(
        new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]),
      )
      const form = Array.from({ length: 12 }, (_, index) =>
        measureSymbols(blues, index + 1),
      )
      expect(form).toEqual([
        ['C7'],
        ['C7'],
        ['C7'],
        ['C7'],
        ['F7'],
        ['F7'],
        ['C7'],
        ['C7'],
        ['G7'],
        ['F7'],
        ['C7'],
        ['G7'],
      ])
    }
  })

  it('plantea cuatro patrones, cuatro progresiones y cuatro escalas', () => {
    const exercises = lessonExercises(lesson, bundle)
    expect(exercises).toHaveLength(12)

    const byAsk = new Map<string, Exercise[]>()
    for (const exercise of exercises) {
      expect(exercise.type, exercise.id).toBe('style-pattern')
      if (exercise.type !== 'style-pattern') continue
      expect(exercise.style, exercise.id).toBe('blues')
      expect(exercise.skillId, exercise.id).toBe('skill.blues')
      const list = byAsk.get(exercise.ask) ?? []
      list.push(exercise)
      byAsk.set(exercise.ask, list)
    }

    expect(byAsk.get('pattern')).toHaveLength(4)
    expect(byAsk.get('progression')).toHaveLength(4)
    expect(byAsk.get('scale')).toHaveLength(4)

    for (const exercise of exercises) {
      expect(
        'choices' in exercise ? exercise.choices : undefined,
        exercise.id,
      ).toHaveLength(4)
      expect(exercise.choicesEn, exercise.id).toHaveLength(4)
    }
  })

  it('reconoce el shuffle, el comping, las negras y el medio tiempo', () => {
    const exercises = lessonExercises(lesson, bundle).filter(
      (exercise) =>
        exercise.type === 'style-pattern' && exercise.ask === 'pattern',
    )
    expect(exercises).toHaveLength(4)

    const expected = [
      { pattern: 'shuffle', es: 'Shuffle', en: 'Shuffle' },
      { pattern: 'comping', es: 'Comping', en: 'Comping' },
      { pattern: 'quarters', es: 'Negras', en: 'Quarters' },
      { pattern: 'half-time', es: 'Medio tiempo', en: 'Half-time' },
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

  it('resuelve los grados I–IV–I–V de las cuatro tonalidades', () => {
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
    expect(keys).toEqual(['C', 'F', 'G', 'Bb'])

    for (const exercise of exercises) {
      if (exercise.type !== 'style-pattern') continue
      expect(styleProgressionDegrees(exercise.score), exercise.id).toEqual([
        'I',
        'IV',
        'I',
        'V',
      ])
      const spanish = resolveExerciseAnswer(exercise, 'es')
      const english = resolveExerciseAnswer(exercise, 'en')
      expect(spanish.mode, `${exercise.id} ES`).toBe('choice')
      expect(english.mode, `${exercise.id} EN`).toBe('choice')
      if (spanish.mode !== 'choice' || english.mode !== 'choice') continue
      expect(spanish.answer).toBe('I–IV–I–V')
      expect(english.answer).toBe('I–IV–I–V')
    }
  })

  it('reconoce la escala de blues en las cuatro tonalidades', () => {
    const exercises = lessonExercises(lesson, bundle).filter(
      (exercise) => exercise.type === 'style-pattern' && exercise.ask === 'scale',
    )
    expect(exercises).toHaveLength(4)

    const expectedNotes: Record<string, string[]> = {
      C: ['C4', 'Eb4', 'F4', 'Gb4', 'G4', 'Bb4', 'C5'],
      F: ['F4', 'Ab4', 'Bb4', 'B4', 'C5', 'Eb5', 'F5'],
      G: ['G4', 'Bb4', 'C5', 'Db5', 'D5', 'F5', 'G5'],
      Bb: ['Bb4', 'Db5', 'Eb5', 'E5', 'F5', 'Ab5', 'Bb5'],
    }

    for (const exercise of exercises) {
      if (exercise.type !== 'style-pattern') continue
      expect(styleScaleName(exercise.score), exercise.id).toBe('blues-scale')
      expect(spelledNotes(exercise.score), exercise.id).toEqual(
        expectedNotes[exercise.score.key],
      )
      expect(styleScaleCandidates('blues-scale', 'es')).toEqual([
        'Escala de blues',
      ])
      expect(styleScaleCandidates('blues-scale', 'en')).toEqual(['Blues scale'])

      const spanish = resolveExerciseAnswer(exercise, 'es')
      const english = resolveExerciseAnswer(exercise, 'en')
      expect(spanish.mode, `${exercise.id} ES`).toBe('choice')
      expect(english.mode, `${exercise.id} EN`).toBe('choice')
      if (spanish.mode !== 'choice' || english.mode !== 'choice') continue
      expect(spanish.answer).toBe('Escala de blues')
      expect(english.answer).toBe('Blues scale')
      const choicesEs = exerciseChoices(exercise, 'es') ?? []
      const choicesEn = exerciseChoices(exercise, 'en') ?? []
      expect(choicesEs.indexOf(spanish.answer), exercise.id).toBe(
        choicesEn.indexOf(english.answer),
      )
    }
  })

  it('incluye una tarea opcional de blues a 80 BPM', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.tempoBpm).toBe(80)
    expect(task?.keys.length).toBeGreaterThanOrEqual(10)
    expect(task?.checklistEs.length).toBeGreaterThanOrEqual(5)
    expect(task?.checklistEn).toHaveLength(task?.checklistEs.length ?? 0)
    expect(task?.instructionsEs).toMatch(/80 BPM/)
    expect(task?.instructionsEs).toMatch(/I–IV–I–I–IV–IV–I–I–V–IV–I–V/)
    expect(task?.instructionsEs).toMatch(/Do3, Do3, Do3, Do3, Fa3, Fa3/)
    expect(task?.instructionsEs).toMatch(/shuffle/)
    expect(task?.instructionsEs).toMatch(/Sol♭/)
    expect(task?.instructionsEs).toMatch(/dolor, tensión o cansancio/)
    expect(task?.instructionsEn).toMatch(/80 BPM/)
    expect(task?.instructionsEn).toMatch(/I–IV–I–I–IV–IV–I–I–V–IV–I–V/)
    expect(task?.instructionsEn).toMatch(/C3, C3, C3, C3, F3, F3/)
    expect(task?.instructionsEn).toMatch(/shuffle/)
    expect(task?.instructionsEn).toMatch(/Gb/)
    expect(task?.instructionsEn).toMatch(/pain, tension or fatigue/)
    expect(task?.demoScore).toBeDefined()
  })

  it('registra la habilidad de blues', () => {
    const skill = bundle.skills.find((item) => item.id === 'skill.blues')
    expect(skill?.kind).toBe('keyboard-task')
    expect(skill?.lessonIds).toEqual(['lesson.m8-02'])
    expect(skill?.params.form).toBe('I–IV–I–I–IV–IV–I–I–V–IV–I–V')
    expect(skill?.params.patterns).toEqual([
      'shuffle',
      'comping',
      'quarters',
      'half-time',
    ])
    expect(skill?.params.scale).toBe('blues')
    expect(skill?.params.keys).toEqual(['C', 'F', 'G', 'Bb'])
  })
})
