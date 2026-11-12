import { beforeAll, describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { exerciseChoices } from '../src/content/localize'
import { scoreToMeasures } from '../src/content/score'
import { validateContentBundle } from '../src/content/validate'
import { resolveExerciseAnswer } from '../src/exercises/answer'
import {
  ARPEGGIATED_PATTERN_LABELS,
  arpeggiatedNoteNames,
  arpeggiatedPatternInMeasure,
} from '../src/exercises/arpeggiated'
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
  const found = bundle.lessons.find((item) => item.id === 'lesson.m7-05')
  if (!found) throw new Error('Falta la lección M7-05')
  lesson = found
})

describe('M7-05 — Acompañamiento arpegiado', () => {
  it('está publicada, validada y sigue a M7-04', () => {
    expect(lesson.moduleId).toBe('M7')
    expect(lesson.slug).toBe('acompanamiento-arpegiado')
    expect(lesson.status).toBe('published')
    expect(lesson.prerequisites).toContain('lesson.m7-04')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
    expect(lesson.objectivesEn).toHaveLength(lesson.objectivesEs.length)
    expect(lesson.skillIds).toEqual(['skill.arpeggiated-accompaniment'])
    expect(lesson.exerciseIds).toHaveLength(12)
  })

  it('explica patrones de 3 y 4 notas, tempo estable y cuidado de las manos', () => {
    const text = lesson.sections
      .map((section) => `${section.titleEs} ${section.bodyEs ?? ''}`)
      .join(' ')
      .toLowerCase()

    for (const term of [
      'acompañamiento arpegiado',
      'arpegiado',
      '3 notas',
      '4 notas',
      '1-5-3',
      '1-5-3-5',
      'fundamental',
      'quinta',
      'tercera',
      'doce tonalidades',
      'tempo',
      'metrónomo',
      'pulso',
      'notas comunes',
      'digitación',
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
      'arpeggiated accompaniment',
      '3-note pattern',
      '4-note pattern',
      '1-5-3',
      '1-5-3-5',
      'root',
      'fifth',
      'third',
      'twelve major keys',
      'tempo',
      'metronome',
      'pulse',
      'common tones',
      'fingering',
      'pain',
      'tension',
    ]) {
      expect(english, `Missing concept: ${term}`).toContain(term)
    }
  })

  it('incluye demos de 3 notas, 4 notas y progresión arpegiada', () => {
    const demos = scoreSections(lesson)
    expect(demos).toHaveLength(3)

    const byId = new Map(demos.map((demo) => [demo.sectionId, demo.score]))

    const three = byId.get('sec.m7-05.demo-tres-notas')
    expect(three).toBeDefined()
    if (three) {
      expect(arpeggiatedPatternInMeasure(three, 1)).toBe('three-note')
      expect(three.timeSignature).toEqual({ numerator: 3, denominator: 4 })
      expect(three.events).toHaveLength(12)
      expect(three.events.every((event) => event.hand === 'left')).toBe(true)
      expect(three.events.every((event) => event.pitches.length === 1)).toBe(true)
    }

    const four = byId.get('sec.m7-05.demo-cuatro-notas')
    expect(four).toBeDefined()
    if (four) {
      expect(arpeggiatedPatternInMeasure(four, 1)).toBe('four-note')
      expect(four.timeSignature).toEqual({ numerator: 4, denominator: 4 })
      expect(four.events).toHaveLength(16)
    }

    const progression = byId.get('sec.m7-05.demo-progresion')
    expect(progression).toBeDefined()
    if (progression) {
      expect(progression.events).toHaveLength(16)
      expect(
        progression.events
          .filter((event) => event.chordSymbol)
          .map((event) => event.chordSymbol),
      ).toEqual(['C', 'F', 'G', 'C'])
      for (let measure = 1; measure <= 4; measure += 1) {
        expect(
          arpeggiatedPatternInMeasure(progression, measure),
          `compás ${measure}`,
        ).toBe('four-note')
      }
    }

    for (const demo of demos) {
      expect(demo.score.clef, demo.sectionId).toBe('bass')
      expect(demo.score.key, demo.sectionId).toBe('C')
      expect(demo.score.mode, demo.sectionId).toBe('major')
      expect(demo.score.tempoBpm, demo.sectionId).toBe(72)
    }
  })

  it('deduce el patrón y el orden de notas desde la partitura', () => {
    const three = scoreSections(lesson).find(
      (demo) => demo.sectionId === 'sec.m7-05.demo-tres-notas',
    )
    if (!three) throw new Error('Falta la demo de 3 notas')
    expect(arpeggiatedNoteNames(three.score, 1, 'es')).toBe('Do3 Sol3 Mi3')
    expect(arpeggiatedNoteNames(three.score, 1, 'en')).toBe('C3 G3 E3')
    expect(arpeggiatedPatternInMeasure(three.score, 2)).toBe('three-note')
    expect(arpeggiatedPatternInMeasure(three.score, 5)).toBeNull()

    // Un compás con acordes en bloque no es un patrón arpegiado.
    const block: Score = {
      ...three.score,
      timeSignature: { numerator: 4, denominator: 4 },
      events: [
        {
          id: 'block.1',
          measure: 1,
          beat: 0,
          value: { duration: 'whole', dots: 0, tuplet: 'none' },
          pitches: [
            { step: 'C', accidental: '', octave: 3 },
            { step: 'E', accidental: '', octave: 3 },
            { step: 'G', accidental: '', octave: 3 },
          ],
          hand: 'left',
          voice: 1,
          velocity: 74,
          tieToNext: false,
        },
      ],
      pedals: [],
    }
    expect(arpeggiatedPatternInMeasure(block, 1)).toBeNull()
    expect(arpeggiatedNoteNames(block, 1, 'es')).toBe('Do3')
  })

  it('plantea ejercicios de patrón y de orden con opciones paralelas', () => {
    const exercises = lessonExercises(lesson, bundle)
    expect(exercises).toHaveLength(12)
    expect(exercises.every((exercise) => exercise.type === 'arpeggiated')).toBe(
      true,
    )

    const asks = exercises.map((exercise) =>
      exercise.type === 'arpeggiated' ? exercise.ask : '',
    )
    expect(asks.filter((ask) => ask === 'pattern')).toHaveLength(6)
    expect(asks.filter((ask) => ask === 'notes')).toHaveLength(6)

    const difficulties = exercises.map((exercise) => exercise.difficulty)
    expect(difficulties.filter((value) => value === 1)).toHaveLength(3)
    expect(difficulties.filter((value) => value === 2)).toHaveLength(4)
    expect(difficulties.filter((value) => value === 3)).toHaveLength(5)

    for (const exercise of exercises) {
      if (exercise.type !== 'arpeggiated') continue
      expect(exercise.skillId, exercise.id).toBe(
        'skill.arpeggiated-accompaniment',
      )
      expect(exercise.measure, exercise.id).toBe(1)
      expect(exercise.score.clef, exercise.id).toBe('bass')
      expect(exercise.score.events.length, exercise.id).toBeGreaterThan(0)
      expect(
        exercise.score.events.every(
          (event) =>
            event.hand === 'left' &&
            event.pitches.length === 1 &&
            event.value.duration === 'quarter',
        ),
        exercise.id,
      ).toBe(true)

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

  it('cubre las doce tonalidades con patrones de 3 y 4 notas', () => {
    const exercises = lessonExercises(lesson, bundle).filter(
      (exercise) => exercise.type === 'arpeggiated',
    )
    const keys = new Set(
      exercises.map((exercise) => exercise.score.key),
    )
    expect([...keys].sort()).toEqual([...EXPECTED_KEYS].sort())

    let three = 0
    let four = 0
    for (const exercise of exercises) {
      if (exercise.type !== 'arpeggiated') continue
      const pattern = arpeggiatedPatternInMeasure(exercise.score, 1)
      expect(pattern, exercise.id).not.toBeNull()
      if (pattern === 'three-note') {
        three += 1
        expect(exercise.score.timeSignature.numerator, exercise.id).toBe(3)
      } else if (pattern === 'four-note') {
        four += 1
        expect(exercise.score.timeSignature.numerator, exercise.id).toBe(4)
      }
    }
    expect(three).toBe(6)
    expect(four).toBe(6)
  })

  it('resuelve patrones y órdenes con sus etiquetas canónicas', () => {
    const exercises = lessonExercises(lesson, bundle)
    const byId = new Map(exercises.map((exercise) => [exercise.id, exercise]))

    const patternExercise = byId.get('ex.m7-05.a')
    if (
      !patternExercise ||
      patternExercise.type !== 'arpeggiated'
    ) {
      throw new Error('Falta ex.m7-05.a')
    }
    const patternEs = resolveExerciseAnswer(patternExercise, 'es')
    expect(patternEs.mode).toBe('choice')
    if (patternEs.mode !== 'practice') {
      expect(patternEs.answer).toBe(
        ARPEGGIATED_PATTERN_LABELS['three-note'].es,
      )
    }

    const fourExercise = byId.get('ex.m7-05.d')
    if (!fourExercise || fourExercise.type !== 'arpeggiated') {
      throw new Error('Falta ex.m7-05.d')
    }
    const fourEn = resolveExerciseAnswer(fourExercise, 'en')
    expect(fourEn.mode).toBe('choice')
    if (fourEn.mode !== 'practice') {
      expect(fourEn.answer).toBe(ARPEGGIATED_PATTERN_LABELS['four-note'].en)
    }

    const notesExercise = byId.get('ex.m7-05.b')
    if (!notesExercise || notesExercise.type !== 'arpeggiated') {
      throw new Error('Falta ex.m7-05.b')
    }
    const notesEs = resolveExerciseAnswer(notesExercise, 'es')
    const notesEn = resolveExerciseAnswer(notesExercise, 'en')
    expect(notesEs.mode).toBe('choice')
    expect(notesEn.mode).toBe('choice')
    if (notesEs.mode !== 'practice' && notesEn.mode !== 'practice') {
      expect(notesEs.answer).toBe(
        arpeggiatedNoteNames(notesExercise.score, 1, 'es'),
      )
      expect(notesEn.answer).toBe(
        arpeggiatedNoteNames(notesExercise.score, 1, 'en'),
      )
    }
  })

  it('incluye una tarea con tempo estable, metrónomo y cuidado', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.tempoBpm).toBe(60)
    expect(task?.keys).toHaveLength(4)
    expect(task?.checklistEs.length).toBeGreaterThanOrEqual(5)
    expect(task?.checklistEn).toHaveLength(task?.checklistEs.length ?? 0)
    expect(task?.instructionsEs).toMatch(/metrónomo/)
    expect(task?.instructionsEs).toMatch(/60 BPM/)
    expect(task?.instructionsEs).toMatch(/3 notas/)
    expect(task?.instructionsEs).toMatch(/4 notas/)
    expect(task?.instructionsEs).toMatch(/estabilidad/)
    expect(task?.instructionsEs).toMatch(/dolor o tensión/)
    expect(task?.instructionsEn).toMatch(/metronome/)
    expect(task?.instructionsEn).toMatch(/60 BPM/)
    expect(task?.instructionsEn).toMatch(/3-note/)
    expect(task?.instructionsEn).toMatch(/4-note/)
    expect(task?.instructionsEn).toMatch(/stability/)
    expect(task?.instructionsEn).toMatch(/pain or tension/)
    expect(task?.fingeringEs).toMatch(/5-2-1/)
    expect(task?.fingeringEn).toMatch(/5-2-1/)

    const demo = task?.demoScore
    expect(demo).toBeDefined()
    if (!demo) throw new Error('Falta la demo de la tarea')
    expect(demo.events.filter((event) => event.chordSymbol)).toHaveLength(4)
    expect(arpeggiatedPatternInMeasure(demo, 1)).toBe('four-note')
    expect(scoreToMeasures(demo)).toHaveLength(16)
  })

  it('registra la habilidad con patrones, tonalidades y métricas', () => {
    const skill = bundle.skills.find(
      (item) => item.id === 'skill.arpeggiated-accompaniment',
    )
    expect(skill).toBeDefined()
    expect(skill?.kind).toBe('keyboard-task')
    expect(skill?.lessonIds).toEqual(['lesson.m7-05'])
    expect(skill?.params.patterns).toEqual(['three-note', 'four-note'])
    expect(skill?.params.keys).toEqual(EXPECTED_KEYS)
    expect(skill?.params.meters).toEqual(['3/4', '4/4'])
    expect(skill?.params.formats).toEqual(['arpeggiated'])
    expect(skill?.params.tempoBpm).toEqual(['60', '66', '72'])
  })
})
