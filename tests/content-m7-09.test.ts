import { beforeAll, describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { exerciseChoices } from '../src/content/localize'
import { validateContentBundle } from '../src/content/validate'
import { resolveExerciseAnswer } from '../src/exercises/answer'
import {
  SIGHT_READING_MOTION_LABELS,
  sightReadingIntervalName,
  sightReadingNotes,
} from '../src/exercises/sight-reading'
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
  const found = bundle.lessons.find((item) => item.id === 'lesson.m7-09')
  if (!found) throw new Error('Falta la lección M7-09')
  lesson = found
})

describe('M7-09 — Lectura a primera vista', () => {
  it('está publicada, validada y sigue a M7-08', () => {
    expect(lesson.moduleId).toBe('M7')
    expect(lesson.slug).toBe('lectura-a-primera-vista')
    expect(lesson.status).toBe('published')
    expect(lesson.prerequisites).toContain('lesson.m7-08')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
    expect(lesson.objectivesEn).toHaveLength(lesson.objectivesEs.length)
    expect(lesson.skillIds).toEqual(['skill.sight-reading'])
    expect(lesson.exerciseIds).toHaveLength(12)
    expect(lesson.minutes).toBeLessThanOrEqual(20)
  })

  it('explica el método por intervalos y los cuatro niveles', () => {
    const text = lesson.sections
      .map((section) => `${section.titleEs} ${section.bodyEs ?? ''}`)
      .join(' ')
      .toLowerCase()

    for (const term of [
      'primera vista',
      'intervalos',
      'nota ancla',
      'segunda',
      'tercera',
      'sube',
      'baja',
      'repite',
      'nivel 1',
      'nivel 4',
      '50 bpm',
      'no parar',
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
      'sight-reading',
      'intervals',
      'anchor note',
      'second',
      'third',
      'up, down or repeat',
      'direction',
      'level 1',
      'level 4',
      '50 bpm',
      'without stopping',
      'pain',
      'tension',
    ]) {
      expect(english, `Missing concept: ${term}`).toContain(term)
    }
  })

  it('incluye demos por grados, con saltos y el estudio original', () => {
    const demos = scoreSections(lesson)
    expect(demos).toHaveLength(3)

    const byId = new Map(demos.map((demo) => [demo.sectionId, demo.score]))

    const steps = byId.get('sec.m7-09.demo-grados')
    expect(steps).toBeDefined()
    if (steps) {
      expect(steps.clef).toBe('treble')
      expect(steps.events).toHaveLength(8)
      expect(
        steps.events.every(
          (event) =>
            event.hand === 'right' &&
            event.value.duration === 'quarter' &&
            event.pitches.length === 1,
        ),
      ).toBe(true)
      const notes = sightReadingNotes(steps)
      for (let index = 1; index < notes.length; index += 1) {
        expect(
          Math.abs(
            (notes[index]?.octave ?? 0) * 7 +
              ['C', 'D', 'E', 'F', 'G', 'A', 'B'].indexOf(
                notes[index]?.step ?? 'C',
              ) -
              ((notes[index - 1]?.octave ?? 0) * 7 +
                ['C', 'D', 'E', 'F', 'G', 'A', 'B'].indexOf(
                  notes[index - 1]?.step ?? 'C',
                )),
          ),
          `paso ${index}`,
        ).toBe(1)
      }
      expect(sightReadingIntervalName(steps, 0, 1, 'es')).toBe('segunda mayor')
    }

    const leaps = byId.get('sec.m7-09.demo-saltos')
    expect(leaps).toBeDefined()
    if (leaps) {
      expect(leaps.clef).toBe('bass')
      expect(leaps.events).toHaveLength(8)
      expect(leaps.events.every((event) => event.hand === 'left')).toBe(true)
      expect(sightReadingIntervalName(leaps, 0, 1, 'es')).toBe('tercera menor')
      expect(sightReadingIntervalName(leaps, 1, 2, 'es')).toBe('segunda mayor')
    }

    const study = byId.get('sec.m7-09.demo-estudio')
    expect(study).toBeDefined()
    if (study) {
      expect(study.tempoBpm).toBe(50)
      expect(study.events).toHaveLength(16)
      expect(new Set(study.events.map((event) => event.measure))).toEqual(
        new Set([1, 2, 3, 4]),
      )
      expect(sightReadingNotes(study)).toHaveLength(16)
      expect(sightReadingIntervalName(study, 0, 1, 'es')).toBe('segunda mayor')
    }
  })

  it('plantea doce ejercicios graduados en las doce tonalidades mayores', () => {
    const exercises = lessonExercises(lesson, bundle)
    expect(exercises).toHaveLength(12)
    expect(exercises.every((exercise) => exercise.type === 'sight-reading')).toBe(
      true,
    )

    const keys = new Set(
      exercises.map((exercise) =>
        exercise.type === 'sight-reading' ? exercise.score.key : '',
      ),
    )
    expect([...keys].sort()).toEqual([...EXPECTED_KEYS].sort())

    const clefs = new Set(
      exercises.map((exercise) =>
        exercise.type === 'sight-reading' ? exercise.score.clef : '',
      ),
    )
    expect(clefs).toEqual(new Set(['treble', 'bass']))

    const asks = exercises.map((exercise) =>
      exercise.type === 'sight-reading' ? exercise.ask : '',
    )
    expect(new Set(asks)).toEqual(new Set(['interval', 'note', 'motion']))

    const difficulties = exercises.map((exercise) => exercise.difficulty)
    expect(difficulties.filter((value) => value === 1)).toHaveLength(2)
    expect(difficulties.filter((value) => value === 2)).toHaveLength(4)
    expect(difficulties.filter((value) => value === 3)).toHaveLength(3)
    expect(difficulties.filter((value) => value === 4)).toHaveLength(3)

    for (const exercise of exercises) {
      if (exercise.type !== 'sight-reading') continue
      expect(exercise.skillId, exercise.id).toBe('skill.sight-reading')
      expect(
        exercise.score.timeSignature,
        exercise.id,
      ).toEqual({ numerator: 4, denominator: 4 })
      expect(
        exercise.score.events.every(
          (event) =>
            event.value.duration === 'quarter' && event.pitches.length === 1,
        ),
        exercise.id,
      ).toBe(true)
      expect(
        sightReadingNotes(exercise.score).length,
        exercise.id,
      ).toBeGreaterThanOrEqual(4)
      expect(exercise.from, exercise.id).toBeGreaterThanOrEqual(0)
      expect(exercise.to, exercise.id).toBeGreaterThan(exercise.from)
      expect(exercise.promptEs, exercise.id).toMatch(/\?$/)
      expect(exercise.explanationEs.length, exercise.id).toBeGreaterThan(60)
      expect((exercise.explanationEn ?? '').length, exercise.id).toBeGreaterThan(
        60,
      )

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

  it('resuelve intervalos, notas y movimientos con etiquetas canónicas', () => {
    const byId = new Map(
      lessonExercises(lesson, bundle).map((exercise) => [exercise.id, exercise]),
    )

    const interval = byId.get('ex.m7-09.a')
    if (!interval || interval.type !== 'sight-reading') {
      throw new Error('Falta ex.m7-09.a')
    }
    const intervalEs = resolveExerciseAnswer(interval, 'es')
    expect(intervalEs.mode).toBe('choice')
    if (intervalEs.mode !== 'practice') {
      expect(intervalEs.answer).toBe('segunda mayor')
    }

    const note = byId.get('ex.m7-09.d')
    if (!note || note.type !== 'sight-reading') {
      throw new Error('Falta ex.m7-09.d')
    }
    const noteEs = resolveExerciseAnswer(note, 'es')
    const noteEn = resolveExerciseAnswer(note, 'en')
    expect(noteEs.mode).toBe('choice')
    expect(noteEn.mode).toBe('choice')
    if (noteEs.mode !== 'practice' && noteEn.mode !== 'practice') {
      expect(noteEs.answer).toBe('Do♯3')
      expect(noteEn.answer).toBe('C#3')
    }

    const motion = byId.get('ex.m7-09.b')
    if (!motion || motion.type !== 'sight-reading') {
      throw new Error('Falta ex.m7-09.b')
    }
    const motionEs = resolveExerciseAnswer(motion, 'es')
    expect(motionEs.mode).toBe('choice')
    if (motionEs.mode !== 'practice') {
      expect(motionEs.answer).toBe(
        SIGHT_READING_MOTION_LABELS['step-down'].es,
      )
    }
  })

  it('incluye una tarea de lectura en Do a 50 BPM sin detenerse', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.tempoBpm).toBe(50)
    expect(task?.keys.length).toBeGreaterThanOrEqual(4)
    expect(task?.checklistEs.length).toBeGreaterThanOrEqual(5)
    expect(task?.checklistEn).toHaveLength(task?.checklistEs.length ?? 0)
    expect(task?.instructionsEs).toMatch(/metrónomo/)
    expect(task?.instructionsEs).toMatch(/50 BPM/)
    expect(task?.instructionsEs).toMatch(/intervalos/)
    expect(task?.instructionsEs).toMatch(/sin detenerte/)
    expect(task?.instructionsEs).toMatch(/dolor, tensión o cansancio/)
    expect(task?.instructionsEn).toMatch(/metronome/)
    expect(task?.instructionsEn).toMatch(/50 BPM/)
    expect(task?.instructionsEn).toMatch(/intervals/)
    expect(task?.instructionsEn).toMatch(/without stopping/)
    expect(task?.instructionsEn).toMatch(/pain, tension or fatigue/)
    expect(task?.fingeringEs).toMatch(/1-2-3-5/)
    expect(task?.fingeringEn).toMatch(/1-2-3-5/)

    const demo = task?.demoScore
    expect(demo).toBeDefined()
    if (!demo) throw new Error('Falta la demo de la tarea')
    expect(demo.tempoBpm).toBe(50)
    expect(demo.events).toHaveLength(16)
    expect(demo.events.every((event) => event.hand === 'right')).toBe(true)
  })

  it('registra la habilidad con método, niveles, claves y preguntas', () => {
    const skill = bundle.skills.find((item) => item.id === 'skill.sight-reading')
    expect(skill).toBeDefined()
    expect(skill?.kind).toBe('keyboard-task')
    expect(skill?.lessonIds).toEqual(['lesson.m7-09'])
    expect(skill?.params.methods).toEqual(['interval'])
    expect(skill?.params.levels).toEqual(['1', '2', '3', '4'])
    expect(skill?.params.keys).toEqual(EXPECTED_KEYS)
    expect(skill?.params.clefs).toEqual(['treble', 'bass'])
    expect(skill?.params.meters).toEqual(['4/4'])
    expect(skill?.params.asks).toEqual(['interval', 'note', 'motion'])
    expect(skill?.params.tempoBpm).toEqual(['50', '60', '72'])
  })
})
