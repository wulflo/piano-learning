import { beforeAll, describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { exerciseChoices } from '../src/content/localize'
import { validateContentBundle } from '../src/content/validate'
import { resolveExerciseAnswer } from '../src/exercises/answer'
import {
  ALBERTI_LABEL,
  albertiNoteNames,
  albertiPatternInMeasure,
} from '../src/exercises/alberti'
import type { ContentBundle, Exercise, Lesson, Score } from '../src/schemas'

const EXPECTED_KEYS = [
  'C',
  'G',
  'D',
  'A',
  'E',
  'B',
  'F',
  'Bb',
  'Eb',
  'Ab',
  'Db',
  'Gb',
]

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
  const found = bundle.lessons.find((item) => item.id === 'lesson.m7-06')
  if (!found) throw new Error('Falta la lección M7-06')
  lesson = found
})

describe('M7-06 — Alberti', () => {
  it('está publicada, validada y sigue a M7-05', () => {
    expect(lesson.moduleId).toBe('M7')
    expect(lesson.slug).toBe('alberti')
    expect(lesson.status).toBe('published')
    expect(lesson.prerequisites).toContain('lesson.m7-05')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
    expect(lesson.objectivesEn).toHaveLength(lesson.objectivesEs.length)
    expect(lesson.skillIds).toEqual(['skill.alberti'])
    expect(lesson.exerciseIds).toHaveLength(12)
  })

  it('explica el patrón clásico, las variantes y el estudio sin tensión', () => {
    const text = lesson.sections
      .map((section) => `${section.titleEs} ${section.bodyEs ?? ''}`)
      .join(' ')
      .toLowerCase()

    for (const term of [
      'bajo de alberti',
      '1-5-3-5',
      'corcheas',
      '4/4',
      'célula',
      'variantes',
      'invertida',
      'tres notas',
      'estudio en do',
      'melodía',
      'pulso',
      'metrónomo',
      'pulgar',
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
      'alberti bass',
      '1-5-3-5',
      'eighth notes',
      '4/4',
      'cell',
      'variants',
      'inverted',
      'three notes',
      'study in c',
      'melody',
      'pulse',
      'metronome',
      'thumb',
      'pain',
      'tension',
    ]) {
      expect(english, `Missing concept: ${term}`).toContain(term)
    }
  })

  it('incluye demos del Alberti, de la progresión y del estudio original', () => {
    const demos = scoreSections(lesson)
    expect(demos).toHaveLength(3)

    const byId = new Map(demos.map((demo) => [demo.sectionId, demo.score]))

    const alberti = byId.get('sec.m7-06.demo-alberti')
    expect(alberti).toBeDefined()
    if (alberti) {
      expect(alberti.clef).toBe('bass')
      expect(alberti.timeSignature).toEqual({
        numerator: 4,
        denominator: 4,
      })
      expect(alberti.events).toHaveLength(32)
      expect(alberti.events.every((event) => event.hand === 'left')).toBe(true)
      expect(
        alberti.events.every(
          (event) =>
            event.pitches.length === 1 &&
            event.value.duration === 'eighth',
        ),
      ).toBe(true)
      for (let measure = 1; measure <= 4; measure += 1) {
        expect(albertiPatternInMeasure(alberti, measure), `compás ${measure}`).toBe(
          true,
        )
      }
    }

    const progression = byId.get('sec.m7-06.demo-progresion')
    expect(progression).toBeDefined()
    if (progression) {
      expect(progression.events).toHaveLength(32)
      expect(
        progression.events
          .filter((event) => event.chordSymbol)
          .map((event) => event.chordSymbol),
      ).toEqual(['C', 'F', 'G', 'C'])
      for (let measure = 1; measure <= 4; measure += 1) {
        expect(
          albertiPatternInMeasure(progression, measure),
          `compás ${measure}`,
        ).toBe(true)
      }
    }

    const study = byId.get('sec.m7-06.demo-estudio')
    expect(study).toBeDefined()
    if (study) {
      expect(study.tempoBpm).toBe(60)
      expect(study.events).toHaveLength(39)
      expect(
        study.events.filter((event) => event.hand === 'left'),
      ).toHaveLength(32)
      const melody = study.events.filter((event) => event.hand === 'right')
      expect(melody).toHaveLength(7)
      expect(
        melody.map((event) => (event.pitches[0] as { octave: number }).octave),
      ).toEqual([4, 4, 4, 4, 4, 4, 5])
      expect(study.events.filter((event) => event.chordSymbol)).toHaveLength(4)
    }
  })

  it('reconoce solo la célula repetida en corcheas de 4/4', () => {
    const alberti = scoreSections(lesson).find(
      (demo) => demo.sectionId === 'sec.m7-06.demo-alberti',
    )
    if (!alberti) throw new Error('Falta la demo de Alberti')
    const first = alberti.score.events.filter((event) => event.measure === 1)
    expect(albertiNoteNames(alberti.score, 1, 'es')).toBe(
      'Do3 Sol3 Mi3 Sol3',
    )
    expect(albertiNoteNames(alberti.score, 1, 'en')).toBe('C3 G3 E3 G3')
    expect(albertiPatternInMeasure(alberti.score, 5)).toBe(false)

    const notRepeated: Score = {
      ...alberti.score,
      events: first.map((event, index) =>
        index === 7
          ? {
              ...event,
              pitches: [{ step: 'A', accidental: '', octave: 4 }],
            }
          : event,
      ),
    }
    expect(albertiPatternInMeasure(notRepeated, 1)).toBe(false)

    const quarters: Score = {
      ...alberti.score,
      events: (['C', 'G', 'E', 'G'] as const).map((step, index) => ({
        id: `quarter.${index + 1}`,
        measure: 1,
        beat: index,
        value: { duration: 'quarter', dots: 0, tuplet: 'none' },
        pitches: [
          {
            step,
            accidental: '',
            octave: 3,
          },
        ],
        hand: 'left',
        voice: 1,
        velocity: 72,
        tieToNext: false,
      })),
      pedals: [],
    }
    expect(albertiPatternInMeasure(quarters, 1)).toBe(false)
  })

  it('plantea ejercicios de patrón y de célula con opciones paralelas', () => {
    const exercises = lessonExercises(lesson, bundle)
    expect(exercises).toHaveLength(12)
    expect(exercises.every((exercise) => exercise.type === 'alberti')).toBe(true)

    const asks = exercises.map((exercise) =>
      exercise.type === 'alberti' ? exercise.ask : '',
    )
    expect(asks.filter((ask) => ask === 'pattern')).toHaveLength(6)
    expect(asks.filter((ask) => ask === 'notes')).toHaveLength(6)

    const difficulties = exercises.map((exercise) => exercise.difficulty)
    expect(difficulties.filter((value) => value === 1)).toHaveLength(3)
    expect(difficulties.filter((value) => value === 2)).toHaveLength(4)
    expect(difficulties.filter((value) => value === 3)).toHaveLength(5)

    for (const exercise of exercises) {
      if (exercise.type !== 'alberti') continue
      expect(exercise.skillId, exercise.id).toBe('skill.alberti')
      expect(exercise.measure, exercise.id).toBe(1)
      expect(exercise.score.clef, exercise.id).toBe('bass')
      expect(exercise.score.timeSignature, exercise.id).toEqual({
        numerator: 4,
        denominator: 4,
      })
      expect(exercise.score.events.length, exercise.id).toBe(32)
      expect(
        exercise.score.events.every(
          (event) =>
            event.hand === 'left' &&
            event.pitches.length === 1 &&
            event.value.duration === 'eighth',
        ),
        exercise.id,
      ).toBe(true)
      expect(albertiPatternInMeasure(exercise.score, 1), exercise.id).toBe(true)

      const spanish = resolveExerciseAnswer(exercise, 'es')
      const english = resolveExerciseAnswer(exercise, 'en')
      expect(spanish.mode, `${exercise.id} modo ES`).toBe('choice')
      expect(english.mode, `${exercise.id} modo EN`).toBe('choice')
      if (spanish.mode !== 'choice' || english.mode !== 'choice') continue

      const choicesEs = exerciseChoices(exercise, 'es') ?? []
      const choicesEn = exerciseChoices(exercise, 'en') ?? []
      expect(choicesEs, `${exercise.id} opciones ES`).toContain(spanish.answer)
      expect(choicesEn, `${exercise.id} opciones EN`).toContain(english.answer)
      expect(choicesEs.length, exercise.id).toBeGreaterThanOrEqual(3)
      expect(choicesEs.length, exercise.id).toBe(choicesEn.length)
      expect(
        choicesEs.indexOf(spanish.answer),
        `${exercise.id} índice paralelo`,
      ).toBe(choicesEn.indexOf(english.answer))
    }
  })

  it('cubre las doce tonalidades mayores con Alberti en 4/4', () => {
    const exercises = lessonExercises(lesson, bundle).filter(
      (exercise) => exercise.type === 'alberti',
    )
    const keys = new Set(exercises.map((exercise) => exercise.score.key))
    expect([...keys].sort()).toEqual([...EXPECTED_KEYS].sort())
    expect(
      exercises.every(
        (exercise) =>
          exercise.type === 'alberti' &&
          exercise.score.timeSignature.numerator === 4,
      ),
    ).toBe(true)
  })

  it('resuelve el patrón y la célula con sus etiquetas canónicas', () => {
    const byId = new Map(
      lessonExercises(lesson, bundle).map((exercise) => [exercise.id, exercise]),
    )

    const patternExercise = byId.get('ex.m7-06.a')
    if (!patternExercise || patternExercise.type !== 'alberti') {
      throw new Error('Falta ex.m7-06.a')
    }
    const patternEs = resolveExerciseAnswer(patternExercise, 'es')
    const patternEn = resolveExerciseAnswer(patternExercise, 'en')
    expect(patternEs.mode).toBe('choice')
    expect(patternEn.mode).toBe('choice')
    if (patternEs.mode !== 'practice' && patternEn.mode !== 'practice') {
      expect(patternEs.answer).toBe(ALBERTI_LABEL.es)
      expect(patternEn.answer).toBe(ALBERTI_LABEL.en)
    }

    const notesExercise = byId.get('ex.m7-06.b')
    if (!notesExercise || notesExercise.type !== 'alberti') {
      throw new Error('Falta ex.m7-06.b')
    }
    const notesEs = resolveExerciseAnswer(notesExercise, 'es')
    const notesEn = resolveExerciseAnswer(notesExercise, 'en')
    expect(notesEs.mode).toBe('choice')
    expect(notesEn.mode).toBe('choice')
    if (notesEs.mode !== 'practice' && notesEn.mode !== 'practice') {
      expect(notesEs.answer).toBe(
        albertiNoteNames(notesExercise.score, 1, 'es'),
      )
      expect(notesEn.answer).toBe(
        albertiNoteNames(notesExercise.score, 1, 'en'),
      )
    }
  })

  it('incluye la tarea del estudio con tempo estable y cuidado', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.tempoBpm).toBe(60)
    expect(task?.keys).toHaveLength(4)
    expect(task?.checklistEs.length).toBeGreaterThanOrEqual(5)
    expect(task?.checklistEn).toHaveLength(task?.checklistEs.length ?? 0)
    expect(task?.instructionsEs).toMatch(/metrónomo/)
    expect(task?.instructionsEs).toMatch(/60 BPM/)
    expect(task?.instructionsEs).toMatch(/mano izquierda/)
    expect(task?.instructionsEs).toMatch(/melodía/)
    expect(task?.instructionsEs).toMatch(/dolor, tensión o cansancio/)
    expect(task?.instructionsEn).toMatch(/metronome/)
    expect(task?.instructionsEn).toMatch(/60 BPM/)
    expect(task?.instructionsEn).toMatch(/left hand/)
    expect(task?.instructionsEn).toMatch(/melody/)
    expect(task?.instructionsEn).toMatch(/pain, tension or fatigue/)
    expect(task?.fingeringEs).toMatch(/5-1-3-1/)
    expect(task?.fingeringEn).toMatch(/5-1-3-1/)

    const demo = task?.demoScore
    expect(demo).toBeDefined()
    if (!demo) throw new Error('Falta la demo de la tarea')
    expect(demo.tempoBpm).toBe(60)
    expect(demo.events).toHaveLength(39)
    expect(demo.events.filter((event) => event.hand === 'right')).toHaveLength(7)
  })

  it('registra la habilidad con variantes, tonalidades y métricas', () => {
    const skill = bundle.skills.find((item) => item.id === 'skill.alberti')
    expect(skill).toBeDefined()
    expect(skill?.kind).toBe('keyboard-task')
    expect(skill?.lessonIds).toEqual(['lesson.m7-06'])
    expect(skill?.params.patterns).toEqual(['1-5-3-5'])
    expect(skill?.params.variants).toEqual([
      'classic',
      'inverted',
      'three-note',
    ])
    expect(skill?.params.keys).toEqual(EXPECTED_KEYS)
    expect(skill?.params.meters).toEqual(['4/4'])
    expect(skill?.params.formats).toEqual(['alberti'])
    expect(skill?.params.tempoBpm).toEqual(['60', '66', '72'])
  })
})
