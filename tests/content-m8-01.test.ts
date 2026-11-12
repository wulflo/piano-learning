import { beforeAll, describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { exerciseChoices } from '../src/content/localize'
import { validateContentBundle } from '../src/content/validate'
import { resolveExerciseAnswer } from '../src/exercises/answer'
import {
  stylePatternInMeasure,
  styleProgressionDegrees,
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

let bundle: ContentBundle
let lesson: Lesson

beforeAll(async () => {
  const result = validateContentBundle(await loadContentFromDisk())
  expect(result.ok).toBe(true)
  if (!result.bundle) throw new Error('El contenido del repositorio no es válido')
  bundle = result.bundle
  const found = bundle.lessons.find((item) => item.id === 'lesson.m8-01')
  if (!found) throw new Error('Falta la lección M8-01')
  lesson = found
})

describe('M8-01 — Pop/rock', () => {
  it('es una lección opcional que sigue a M7-11', () => {
    expect(lesson.moduleId).toBe('M8')
    expect(lesson.slug).toBe('pop-rock')
    expect(lesson.status).toBe('published')
    expect(lesson.optional).toBe(true)
    expect(lesson.prerequisites).toContain('lesson.m7-11')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
    expect(lesson.objectivesEn).toHaveLength(lesson.objectivesEs.length)
    expect(lesson.skillIds).toEqual(['skill.pop-rock'])
    expect(lesson.exerciseIds).toHaveLength(12)
    expect(lesson.minutes).toBeLessThanOrEqual(20)
  })

  it('explica el backbeat, los patrones y las progresiones del estilo', () => {
    const text = lesson.sections
      .map((section) => `${section.titleEs} ${section.bodyEs ?? ''}`)
      .join(' ')
      .toLowerCase()

    for (const term of [
      'backbeat',
      '4/4',
      'corcheas',
      'negras',
      'medio tiempo',
      'síncopa',
      'i–v–vi–iv',
      'vi–iv–i–v',
      'bucle',
      'fundamental',
      '80 bpm',
      'dolor',
      'tensión',
    ]) {
      expect(text, `Falta el concepto: ${term}`).toContain(term)
    }

    const english = lesson.sections
      .map((section) => `${section.titleEn} ${section.bodyEn ?? ''}`)
      .join(' ')
      .toLowerCase()
    for (const term of [
      'backbeat',
      'eighths',
      'quarters',
      'half-time',
      'syncopation',
      'i–v–vi–iv',
      'vi–iv–i–v',
      'loop',
      'root',
      '80 bpm',
    ]) {
      expect(english, `Missing concept: ${term}`).toContain(term)
    }
  })

  it('incluye una demo de patrón y el ejemplo original «Ciudad de neón»', () => {
    const demos = scoreSections(lesson)
    expect(demos).toHaveLength(2)

    const byId = new Map(demos.map((demo) => [demo.sectionId, demo.score]))

    const pattern = byId.get('sec.m8-01.demo-pattern')
    expect(pattern).toBeDefined()
    if (pattern) {
      expect(pattern.tempoBpm).toBe(96)
      expect(new Set(pattern.events.map((event) => event.measure))).toEqual(
        new Set([1, 2, 3, 4]),
      )
      expect(
        pattern.events
          .map((event) => event.chordSymbol)
          .filter((symbol): symbol is string => symbol !== undefined),
      ).toEqual(['C', 'G', 'Am', 'F'])
      expect(stylePatternInMeasure(pattern, 1)).toBe('eighths')
    }

    const song = byId.get('sec.m8-01.demo-song')
    expect(song).toBeDefined()
    if (song) {
      expect(song.tempoBpm).toBe(92)
      expect(new Set(song.events.map((event) => event.measure))).toEqual(
        new Set([1, 2, 3, 4, 5, 6, 7, 8]),
      )
      expect(
        song.events
          .map((event) => event.chordSymbol)
          .filter((symbol): symbol is string => symbol !== undefined),
      ).toEqual(['C', 'G', 'Am', 'F', 'C', 'G', 'Am', 'C'])
      const last = song.events.at(-1)
      expect(last?.value.duration).toBe('whole')
      expect(last?.pitches[0]?.step).toBe('C')
      expect(last?.pitches[0]?.octave).toBe(5)
    }
  })

  it('plantea cuatro patrones, cuatro progresiones y cuatro cifrados', () => {
    const exercises = lessonExercises(lesson, bundle)
    expect(exercises).toHaveLength(12)

    const byAsk = new Map<string, Exercise[]>()
    for (const exercise of exercises) {
      expect(exercise.type, exercise.id).toBe('style-pattern')
      if (exercise.type !== 'style-pattern') continue
      expect(exercise.style, exercise.id).toBe('pop-rock')
      expect(exercise.skillId, exercise.id).toBe('skill.pop-rock')
      const list = byAsk.get(exercise.ask) ?? []
      list.push(exercise)
      byAsk.set(exercise.ask, list)
    }

    expect(byAsk.get('pattern')).toHaveLength(4)
    expect(byAsk.get('progression')).toHaveLength(4)
    expect(byAsk.get('chord')).toHaveLength(4)

    for (const exercise of exercises) {
      expect(
        'choices' in exercise ? exercise.choices : undefined,
        exercise.id,
      ).toHaveLength(4)
      expect(exercise.choicesEn, exercise.id).toHaveLength(4)
    }
  })

  it('reconoce el patrón rítmico de cada compás', () => {
    const exercises = lessonExercises(lesson, bundle).filter(
      (exercise) => exercise.type === 'style-pattern' && exercise.ask === 'pattern',
    )
    expect(exercises).toHaveLength(4)

    const expected = ['eighths', 'quarters', 'half-time', 'syncopated']
    for (const [index, exercise] of exercises.entries()) {
      if (exercise.type !== 'style-pattern') continue
      expect(
        stylePatternInMeasure(exercise.score, exercise.measure),
        exercise.id,
      ).toBe(expected[index])
    }
  })

  it('resuelve los grados y los cifrados desde la partitura', () => {
    const exercises = lessonExercises(lesson, bundle)
    const progressions = exercises.filter(
      (exercise) =>
        exercise.type === 'style-pattern' && exercise.ask === 'progression',
    )
    expect(progressions).toHaveLength(4)
    const expectedProgressions = [
      'I–V–vi–IV',
      'vi–IV–I–V',
      'I–IV–vi–V',
      'IV–I–V–vi',
    ]
    for (const [index, exercise] of progressions.entries()) {
      if (exercise.type !== 'style-pattern') continue
      const degrees = styleProgressionDegrees(exercise.score)
      expect(degrees?.join('–'), exercise.id).toBe(expectedProgressions[index])
      const spanish = resolveExerciseAnswer(exercise, 'es')
      const english = resolveExerciseAnswer(exercise, 'en')
      expect(spanish.mode, `${exercise.id} ES`).toBe('choice')
      expect(english.mode, `${exercise.id} EN`).toBe('choice')
      if (spanish.mode !== 'choice' || english.mode !== 'choice') continue
      expect(spanish.answer).toBe(expectedProgressions[index])
      expect(english.answer).toBe(expectedProgressions[index])
    }

    const chords = exercises.filter(
      (exercise) =>
        exercise.type === 'style-pattern' && exercise.ask === 'chord',
    )
    expect(chords).toHaveLength(4)
    const expectedChords = ['G', 'Em', 'Bm', 'D']
    for (const [index, exercise] of chords.entries()) {
      if (exercise.type !== 'style-pattern') continue
      const spanish = resolveExerciseAnswer(exercise, 'es')
      const english = resolveExerciseAnswer(exercise, 'en')
      expect(spanish.mode, `${exercise.id} ES`).toBe('choice')
      expect(english.mode, `${exercise.id} EN`).toBe('choice')
      if (spanish.mode !== 'choice' || english.mode !== 'choice') continue
      expect(spanish.answer).toBe(expectedChords[index])
      expect(english.answer).toBe(expectedChords[index])
      const choicesEs = exerciseChoices(exercise, 'es') ?? []
      const choicesEn = exerciseChoices(exercise, 'en') ?? []
      expect(choicesEs.indexOf(spanish.answer), exercise.id).toBe(
        choicesEn.indexOf(english.answer),
      )
    }
  })

  it('incluye una tarea opcional de acompañamiento a 80 BPM', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.tempoBpm).toBe(80)
    expect(task?.keys.length).toBeGreaterThanOrEqual(10)
    expect(task?.checklistEs.length).toBeGreaterThanOrEqual(5)
    expect(task?.checklistEn).toHaveLength(task?.checklistEs.length ?? 0)
    expect(task?.instructionsEs).toMatch(/80 BPM/)
    expect(task?.instructionsEs).toMatch(/Do–Sol–Lam–Fa/)
    expect(task?.instructionsEs).toMatch(/Do3, Sol3, La3 y Fa3/)
    expect(task?.instructionsEs).toMatch(/corcheas/)
    expect(task?.instructionsEs).toMatch(/dolor, tensión o cansancio/)
    expect(task?.instructionsEn).toMatch(/80 BPM/)
    expect(task?.instructionsEn).toMatch(/C–G–Am–F/)
    expect(task?.instructionsEn).toMatch(/C3, G3, A3 and F3/)
    expect(task?.instructionsEn).toMatch(/eighths/)
    expect(task?.instructionsEn).toMatch(/pain, tension or fatigue/)
    expect(task?.demoScore).toBeDefined()
  })

  it('registra la habilidad de pop/rock', () => {
    const skill = bundle.skills.find((item) => item.id === 'skill.pop-rock')
    expect(skill?.kind).toBe('keyboard-task')
    expect(skill?.lessonIds).toEqual(['lesson.m8-01'])
    expect(skill?.params.progressions).toContain('I–V–vi–IV')
    expect(skill?.params.patterns).toEqual([
      'eighths',
      'quarters',
      'half-time',
      'syncopated',
    ])
    expect(skill?.params.keys).toEqual(['C', 'G', 'D', 'A'])
  })
})
