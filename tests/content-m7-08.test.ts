import { beforeAll, describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { exerciseChoices } from '../src/content/localize'
import { validateContentBundle } from '../src/content/validate'
import { resolveExerciseAnswer } from '../src/exercises/answer'
import {
  STRIDE_LABEL,
  strideBassNoteAt,
  stridePatternInMeasure,
} from '../src/exercises/stride'
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
  const found = bundle.lessons.find((item) => item.id === 'lesson.m7-08')
  if (!found) throw new Error('Falta la lección M7-08')
  lesson = found
})

describe('M7-08 — Stride', () => {
  it('está publicada, validada y sigue a M7-07', () => {
    expect(lesson.moduleId).toBe('M7')
    expect(lesson.slug).toBe('stride')
    expect(lesson.status).toBe('published')
    expect(lesson.prerequisites).toContain('lesson.m7-07')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
    expect(lesson.objectivesEn).toHaveLength(lesson.objectivesEs.length)
    expect(lesson.skillIds).toEqual(['skill.stride'])
    expect(lesson.exerciseIds).toHaveLength(12)
  })

  it('explica el bajo alternado, el acorde y el tempo lento', () => {
    const text = lesson.sections
      .map((section) => `${section.titleEs} ${section.bodyEs ?? ''}`)
      .join(' ')
      .toLowerCase()

    for (const term of [
      'stride',
      'bajo',
      'acorde',
      'pulsos 1 y 3',
      'pulsos 2 y 4',
      'fundamental',
      'quinta',
      'pedal seco',
      '50 bpm',
      'salto',
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
      'stride',
      'bass',
      'chord',
      'beats 1 and 3',
      'beats 2 and 4',
      'root',
      'fifth',
      'dry pedal',
      '50 bpm',
      'leap',
      'pain',
      'tension',
    ]) {
      expect(english, `Missing concept: ${term}`).toContain(term)
    }
  })

  it('incluye demos del stride básico, de la progresión y del estudio original', () => {
    const demos = scoreSections(lesson)
    expect(demos).toHaveLength(3)

    const byId = new Map(demos.map((demo) => [demo.sectionId, demo.score]))

    const basic = byId.get('sec.m7-08.demo-basico')
    expect(basic).toBeDefined()
    if (basic) {
      expect(basic.clef).toBe('bass')
      expect(basic.timeSignature).toEqual({
        numerator: 4,
        denominator: 4,
      })
      expect(basic.events).toHaveLength(16)
      expect(
        basic.events.every(
          (event) =>
            event.hand === 'left' &&
            event.value.duration === 'quarter',
        ),
      ).toBe(true)
      expect(
        basic.events
          .filter((event) => event.chordSymbol)
          .map((event) => event.chordSymbol),
      ).toEqual(['C', 'F', 'G', 'C'])
      for (let measure = 1; measure <= 4; measure += 1) {
        expect(
          stridePatternInMeasure(basic, measure),
          `compás ${measure}`,
        ).toBe(true)
      }
    }

    const progression = byId.get('sec.m7-08.demo-progresion')
    expect(progression).toBeDefined()
    if (progression) {
      expect(progression.events).toHaveLength(16)
      expect(
        progression.events
          .filter((event) => event.chordSymbol)
          .map((event) => event.chordSymbol),
      ).toEqual(['C', 'Am', 'Dm', 'G'])
      for (let measure = 1; measure <= 4; measure += 1) {
        expect(
          stridePatternInMeasure(progression, measure),
          `compás ${measure}`,
        ).toBe(true)
      }
    }

    const study = byId.get('sec.m7-08.demo-estudio')
    expect(study).toBeDefined()
    if (study) {
      expect(study.tempoBpm).toBe(50)
      expect(study.events).toHaveLength(40)
      expect(
        study.events.filter((event) => event.hand === 'left'),
      ).toHaveLength(32)
      const melody = study.events.filter((event) => event.hand === 'right')
      expect(melody).toHaveLength(8)
      expect(
        melody.map((event) => (event.pitches[0] as { step: string }).step),
      ).toEqual(['E', 'G', 'A', 'E', 'F', 'D', 'B', 'C'])
      expect(study.events.filter((event) => event.chordSymbol)).toHaveLength(8)
    }
  })

  it('reconoce el patrón y deduce la nota del bajo', () => {
    const basic = scoreSections(lesson).find(
      (demo) => demo.sectionId === 'sec.m7-08.demo-basico',
    )
    if (!basic) throw new Error('Falta la demo del stride básico')

    expect(stridePatternInMeasure(basic.score, 1)).toBe(true)
    expect(strideBassNoteAt(basic.score, 1, 0, 'es')).toBe('Do2')
    expect(strideBassNoteAt(basic.score, 1, 0, 'en')).toBe('C2')
    expect(strideBassNoteAt(basic.score, 1, 2, 'es')).toBe('Sol2')
    expect(strideBassNoteAt(basic.score, 1, 1, 'es')).toBeNull()
    expect(strideBassNoteAt(basic.score, 9, 0, 'es')).toBeNull()

    const notStride: Score = {
      ...basic.score,
      events: basic.score.events.filter(
        (event) => !(event.measure === 1 && event.beat === 1),
      ),
    }
    expect(stridePatternInMeasure(notStride, 1)).toBe(false)

    const threeFour: Score = {
      ...basic.score,
      timeSignature: { numerator: 3, denominator: 4 },
    }
    expect(stridePatternInMeasure(threeFour, 1)).toBe(false)

    const chordOnBeat: Score = {
      ...basic.score,
      events: basic.score.events.map((event) =>
        event.measure === 1 && event.beat === 0
          ? {
              ...event,
              pitches: [
                ...event.pitches,
                { step: 'E', accidental: '', octave: 4 },
              ],
            }
          : event,
      ),
    }
    expect(stridePatternInMeasure(chordOnBeat, 1)).toBe(false)
    expect(STRIDE_LABEL.es).toBe('Stride')
    expect(STRIDE_LABEL.en).toBe('Stride')
  })

  it('plantea ejercicios de patrón y de bajo con opciones paralelas', () => {
    const exercises = lessonExercises(lesson, bundle)
    expect(exercises).toHaveLength(12)
    expect(exercises.every((exercise) => exercise.type === 'stride')).toBe(true)

    const asks = exercises.map((exercise) =>
      exercise.type === 'stride' ? exercise.ask : '',
    )
    expect(asks.filter((ask) => ask === 'pattern')).toHaveLength(6)
    expect(asks.filter((ask) => ask === 'bass')).toHaveLength(6)

    const difficulties = exercises.map((exercise) => exercise.difficulty)
    expect(difficulties.filter((value) => value === 1)).toHaveLength(2)
    expect(difficulties.filter((value) => value === 2)).toHaveLength(4)
    expect(difficulties.filter((value) => value === 3)).toHaveLength(4)
    expect(difficulties.filter((value) => value === 4)).toHaveLength(2)

    for (const exercise of exercises) {
      if (exercise.type !== 'stride') continue
      expect(exercise.skillId, exercise.id).toBe('skill.stride')
      expect(exercise.score.clef, exercise.id).toBe('bass')
      expect(exercise.score.timeSignature, exercise.id).toEqual({
        numerator: 4,
        denominator: 4,
      })
      expect(exercise.score.events.length, exercise.id).toBe(16)
      expect(
        exercise.score.events.every(
          (event) =>
            event.hand === 'left' &&
            event.value.duration === 'quarter',
        ),
        exercise.id,
      ).toBe(true)
      expect(
        exercise.score.events.filter((event) => event.chordSymbol),
        exercise.id,
      ).toHaveLength(4)
      for (let measure = 1; measure <= 4; measure += 1) {
        expect(
          stridePatternInMeasure(exercise.score, measure),
          `${exercise.id} compás ${measure}`,
        ).toBe(true)
      }

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

  it('cubre las doce tonalidades mayores en 4/4', () => {
    const exercises = lessonExercises(lesson, bundle).filter(
      (exercise) => exercise.type === 'stride',
    )
    const keys = new Set(
      exercises.map((exercise) =>
        exercise.type === 'stride' ? exercise.score.key : '',
      ),
    )
    expect([...keys].sort()).toEqual([...EXPECTED_KEYS].sort())
    expect(
      exercises.every(
        (exercise) =>
          exercise.type === 'stride' &&
          exercise.score.timeSignature.numerator === 4,
      ),
    ).toBe(true)
  })

  it('resuelve el patrón y el bajo con sus etiquetas canónicas', () => {
    const byId = new Map(
      lessonExercises(lesson, bundle).map((exercise) => [exercise.id, exercise]),
    )

    const patternExercise = byId.get('ex.m7-08.a')
    if (!patternExercise || patternExercise.type !== 'stride') {
      throw new Error('Falta ex.m7-08.a')
    }
    const patternEs = resolveExerciseAnswer(patternExercise, 'es')
    const patternEn = resolveExerciseAnswer(patternExercise, 'en')
    expect(patternEs.mode).toBe('choice')
    expect(patternEn.mode).toBe('choice')
    if (patternEs.mode !== 'practice' && patternEn.mode !== 'practice') {
      expect(patternEs.answer).toBe(STRIDE_LABEL.es)
      expect(patternEn.answer).toBe(STRIDE_LABEL.en)
    }

    const bassExercise = byId.get('ex.m7-08.b')
    if (!bassExercise || bassExercise.type !== 'stride') {
      throw new Error('Falta ex.m7-08.b')
    }
    const bassEs = resolveExerciseAnswer(bassExercise, 'es')
    const bassEn = resolveExerciseAnswer(bassExercise, 'en')
    expect(bassEs.mode).toBe('choice')
    expect(bassEn.mode).toBe('choice')
    if (bassEs.mode !== 'practice' && bassEn.mode !== 'practice') {
      expect(bassEs.answer).toBe('Re3')
      expect(bassEn.answer).toBe('D3')
    }
  })

  it('incluye la tarea de Stride en Do con tempo lento y cuidado', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.tempoBpm).toBe(50)
    expect(task?.keys.length).toBeGreaterThanOrEqual(4)
    expect(task?.checklistEs.length).toBeGreaterThanOrEqual(5)
    expect(task?.checklistEn).toHaveLength(task?.checklistEs.length ?? 0)
    expect(task?.instructionsEs).toMatch(/metrónomo/)
    expect(task?.instructionsEs).toMatch(/50 BPM/)
    expect(task?.instructionsEs).toMatch(/mano izquierda/)
    expect(task?.instructionsEs).toMatch(/melodía/)
    expect(task?.instructionsEs).toMatch(/pedal seco/)
    expect(task?.instructionsEs).toMatch(/dolor, tensión o cansancio/)
    expect(task?.instructionsEn).toMatch(/metronome/)
    expect(task?.instructionsEn).toMatch(/50 BPM/)
    expect(task?.instructionsEn).toMatch(/left hand/)
    expect(task?.instructionsEn).toMatch(/melody/)
    expect(task?.instructionsEn).toMatch(/dry pedal/)
    expect(task?.instructionsEn).toMatch(/pain, tension or fatigue/)
    expect(task?.fingeringEs).toMatch(/1-3-5/)
    expect(task?.fingeringEn).toMatch(/1-3-5/)

    const demo = task?.demoScore
    expect(demo).toBeDefined()
    if (!demo) throw new Error('Falta la demo de la tarea')
    expect(demo.tempoBpm).toBe(50)
    expect(demo.events).toHaveLength(40)
    expect(demo.events.filter((event) => event.hand === 'right')).toHaveLength(
      8,
    )
  })

  it('registra la habilidad con patrones, tonalidades y métricas', () => {
    const skill = bundle.skills.find((item) => item.id === 'skill.stride')
    expect(skill).toBeDefined()
    expect(skill?.kind).toBe('keyboard-task')
    expect(skill?.lessonIds).toEqual(['lesson.m7-08'])
    expect(skill?.params.patterns).toEqual(['bass-chord', 'alternating-bass'])
    expect(skill?.params.keys).toEqual(EXPECTED_KEYS)
    expect(skill?.params.meters).toEqual(['4/4'])
    expect(skill?.params.formats).toEqual(['stride'])
    expect(skill?.params.tempoBpm).toEqual(['50', '60', '66'])
  })
})
