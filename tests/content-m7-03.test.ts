import { beforeAll, describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { exerciseChoices } from '../src/content/localize'
import {
  pedalWindows,
  scoreToMeasures,
  scoreToTimeline,
  spelledPitchToMidi,
} from '../src/content/score'
import { validateContentBundle } from '../src/content/validate'
import { resolveExerciseAnswer } from '../src/exercises/answer'
import {
  PEDAL_ACTION_LABELS,
  PEDAL_PATTERN_LABELS,
  pedalActionAt,
  pedalPatternInMeasure,
} from '../src/exercises/pedal'
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
  const found = bundle.lessons.find((item) => item.id === 'lesson.m7-03')
  if (!found) throw new Error('Falta la lección M7-03')
  lesson = found
})

describe('M7-03 — Pedal', () => {
  it('está publicada, validada y sigue a M7-02', () => {
    expect(lesson.moduleId).toBe('M7')
    expect(lesson.slug).toBe('pedal')
    expect(lesson.status).toBe('published')
    expect(lesson.prerequisites).toContain('lesson.m7-02')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
    expect(lesson.objectivesEn).toHaveLength(lesson.objectivesEs.length)
    expect(lesson.skillIds).toEqual(['skill.pedal'])
    expect(lesson.exerciseIds).toHaveLength(10)
  })

  it('explica pedal directo, sincopado, limpieza y advertencia de oído', () => {
    const text = lesson.sections
      .map((section) => `${section.titleEs} ${section.bodyEs ?? ''}`)
      .join(' ')
      .toLowerCase()

    for (const term of [
      'pedal de resonancia',
      'apagadores',
      'pedal directo',
      'sincopado',
      'ataque',
      'contratiempo',
      'cambio de armonía',
      'limpieza',
      'barro',
      'oído',
      'sin pedal',
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
      'sustain pedal',
      'dampers',
      'direct pedal',
      'syncopated',
      'attack',
      'off the beat',
      'harmony change',
      'clean',
      'mud',
      'ear',
      'without pedal',
      'pain',
      'tension',
    ]) {
      expect(english, `Missing concept: ${term}`).toContain(term)
    }
  })

  it('incluye demos de pedal directo, sincopado y cambio sucio', () => {
    const demos = scoreSections(lesson)
    expect(demos).toHaveLength(3)

    const byId = new Map(demos.map((demo) => [demo.sectionId, demo.score]))

    const direct = byId.get('sec.m7-03.demo-directo')
    expect(direct).toBeDefined()
    if (direct) {
      expect(pedalPatternInMeasure(direct, 1)).toBe('direct')
      expect(pedalActionAt(direct, 2, 1)).toBe('change')
      expect(direct.events.every((event) => event.pitches.length === 3)).toBe(
        true,
      )
      expect(direct.pedals.length).toBeGreaterThanOrEqual(8)
    }

    const syncopated = byId.get('sec.m7-03.demo-sincopado')
    expect(syncopated).toBeDefined()
    if (syncopated) {
      expect(pedalPatternInMeasure(syncopated, 1)).toBe('syncopated')
      expect(pedalActionAt(syncopated, 2, 1)).toBe('release')
      expect(syncopated.events.every((event) => event.pitches.length === 3)).toBe(
        true,
      )
    }

    const dirty = byId.get('sec.m7-03.demo-limpieza')
    expect(dirty).toBeDefined()
    if (dirty) {
      expect(pedalActionAt(dirty, 2, 2)).toBe('change')
      expect(pedalPatternInMeasure(dirty, 1)).toBe('direct')
    }

    for (const demo of demos) {
      expect(demo.score.key, demo.sectionId).toBe('C')
      expect(demo.score.mode, demo.sectionId).toBe('major')
      expect(demo.score.tempoBpm, demo.sectionId).toBe(72)
    }
  })

  it('sostiene el sonido hasta el cambio de pedal en el audio', () => {
    const demos = scoreSections(lesson)
    const direct = demos.find(
      (demo) => demo.sectionId === 'sec.m7-03.demo-directo',
    )
    const dirty = demos.find(
      (demo) => demo.sectionId === 'sec.m7-03.demo-limpieza',
    )
    if (!direct || !dirty) throw new Error('Faltan demos de pedal')

    const beat = 60 / direct.score.tempoBpm
    const directTimeline = scoreToTimeline(direct.score)
    const dirtyTimeline = scoreToTimeline(dirty.score)

    // El primer acorde dura un compás completo gracias al pedal.
    expect(directTimeline[0]?.duration).toBeCloseTo(4 * beat, 5)
    // El cambio sucio llega un pulso tarde: la resonancia se alarga.
    expect(dirtyTimeline[0]?.duration).toBeCloseTo(5 * beat, 5)
    expect(dirtyTimeline[0]?.duration).toBeGreaterThan(
      directTimeline[0]?.duration ?? 0,
    )

    const windows = pedalWindows(direct.score)
    expect(windows).toHaveLength(4)
    expect(windows[0]).toEqual({ pressBeat: 0, releaseBeat: 4 })
  })

  it('marca las pisadas y los levantamientos en el pentagrama', () => {
    const demos = scoreSections(lesson)
    const direct = demos.find(
      (demo) => demo.sectionId === 'sec.m7-03.demo-directo',
    )
    if (!direct) throw new Error('Falta la demo de pedal directo')
    const measures = scoreToMeasures(direct.score)
    expect(measures[0]?.pedalPress).toBe(true)
    expect(measures[0]?.pedalRelease).toBe(false)
    expect(measures[1]?.pedalPress).toBe(true)
    expect(measures[1]?.pedalRelease).toBe(true)
  })

  it('plantea ejercicios de acción y de patrón con opciones paralelas', () => {
    const exercises = lessonExercises(lesson, bundle)
    expect(
      exercises.every((exercise) => exercise.type === 'pedal'),
    ).toBe(true)

    const asks = exercises.map((exercise) =>
      exercise.type === 'pedal' ? exercise.ask : '',
    )
    expect(asks.filter((ask) => ask === 'action')).toHaveLength(6)
    expect(asks.filter((ask) => ask === 'pattern')).toHaveLength(4)

    const difficulties = exercises.map((exercise) => exercise.difficulty)
    expect(difficulties.filter((value) => value === 1)).toHaveLength(3)
    expect(difficulties.filter((value) => value === 2)).toHaveLength(4)
    expect(difficulties.filter((value) => value === 3)).toHaveLength(3)

    for (const exercise of exercises) {
      if (exercise.type !== 'pedal') continue
      expect(exercise.skillId, exercise.id).toBe('skill.pedal')
      expect(exercise.score.pedals.length, exercise.id).toBeGreaterThan(0)

      const spanish = resolveExerciseAnswer(exercise, 'es')
      const english = resolveExerciseAnswer(exercise, 'en')
      expect(spanish.mode, `${exercise.id} modo ES`).toBe('choice')
      expect(english.mode, `${exercise.id} modo EN`).toBe('choice')
      if (spanish.mode !== 'choice' || english.mode !== 'choice') continue

      const choicesEs = exerciseChoices(exercise, 'es') ?? []
      const choicesEn = exerciseChoices(exercise, 'en') ?? []
      expect(choicesEs, `${exercise.id} opciones ES`).toContain(spanish.answer)
      expect(choicesEn, `${exercise.id} opciones EN`).toContain(english.answer)
      expect(choicesEs, `${exercise.id}`).toHaveLength(3)
      expect(choicesEs.length, exercise.id).toBe(choicesEn.length)
      expect(
        choicesEs.indexOf(spanish.answer),
        `${exercise.id} índice paralelo`,
      ).toBe(choicesEn.indexOf(english.answer))
    }
  })

  it('resuelve las acciones y los patrones con sus etiquetas', () => {
    const byId = new Map(lessonExercises(lesson, bundle).map((e) => [e.id, e]))

    const press = byId.get('ex.m7-03.a')
    if (!press || press.type !== 'pedal') throw new Error('Falta ex.m7-03.a')
    const pressEs = resolveExerciseAnswer(press, 'es')
    const pressEn = resolveExerciseAnswer(press, 'en')
    expect(pressEs.mode).toBe('choice')
    expect(pressEn.mode).toBe('choice')
    if (pressEs.mode === 'practice' || pressEn.mode === 'practice') return
    expect(pressEs.answer).toBe(PEDAL_ACTION_LABELS.press.es)
    expect(pressEn.answer).toBe(PEDAL_ACTION_LABELS.press.en)

    const pattern = byId.get('ex.m7-03.f')
    if (!pattern || pattern.type !== 'pedal') throw new Error('Falta ex.m7-03.f')
    const patternEs = resolveExerciseAnswer(pattern, 'es')
    expect(patternEs.mode).toBe('choice')
    if (patternEs.mode !== 'practice') {
      expect(patternEs.answer).toBe(PEDAL_PATTERN_LABELS.syncopated.es)
    }

    const change = byId.get('ex.m7-03.b')
    if (!change || change.type !== 'pedal') throw new Error('Falta ex.m7-03.b')
    const changeEs = resolveExerciseAnswer(change, 'es')
    expect(changeEs.mode).toBe('choice')
    if (changeEs.mode !== 'practice') {
      expect(changeEs.answer).toBe(PEDAL_ACTION_LABELS.change.es)
    }
  })

  it('mantiene las partituras en Do mayor y dentro del pentagrama', () => {
    for (const exercise of lessonExercises(lesson, bundle)) {
      if (exercise.type !== 'pedal') continue
      expect(exercise.score.key, exercise.id).toBe('C')
      expect(exercise.score.mode, exercise.id).toBe('major')
      expect(exercise.score.clef, exercise.id).toBe('treble')
      for (const event of exercise.score.events) {
        expect(event.pitches.length, `${exercise.id} ${event.id}`).toBe(3)
        for (const pitch of event.pitches) {
          const midi = spelledPitchToMidi(pitch)
          expect(midi, `${exercise.id} ${event.id}`).toBeGreaterThanOrEqual(60)
          expect(midi, `${exercise.id} ${event.id}`).toBeLessThanOrEqual(74)
        }
      }
    }
  })

  it('incluye una tarea con estudio sin pedal y escucha del cambio', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.tempoBpm).toBe(60)
    expect(task?.keys).toHaveLength(4)
    expect(task?.checklistEs.length).toBeGreaterThanOrEqual(5)
    expect(task?.checklistEn).toHaveLength(task?.checklistEs.length ?? 0)
    expect(task?.instructionsEs).toMatch(/sin pedal/)
    expect(task?.instructionsEs).toMatch(/sincopado/)
    expect(task?.instructionsEs).toMatch(/barro/)
    expect(task?.instructionsEs).toMatch(/dolor o tensión/)
    expect(task?.instructionsEn).toMatch(/without pedal/)
    expect(task?.instructionsEn).toMatch(/syncopated/)
    expect(task?.instructionsEn).toMatch(/mud/)
    expect(task?.instructionsEn).toMatch(/pain or tension/)
    expect(task?.fingeringEs).toMatch(/1-3-5/)
    expect(task?.fingeringEn).toMatch(/1-3-5/)

    const demo = task?.demoScore
    expect(demo).toBeDefined()
    if (!demo) throw new Error('Falta la demo de la tarea')
    expect(demo.key).toBe('C')
    expect(demo.pedals.length).toBeGreaterThan(0)
    expect(demo.events.map((event) => spelledPitchToMidi(event.pitches[0]))).toEqual([
      60, 65, 67, 60,
    ])
  })

  it('registra la habilidad con patrones, tempo y lección', () => {
    const skill = bundle.skills.find((item) => item.id === 'skill.pedal')
    expect(skill).toBeDefined()
    expect(skill?.kind).toBe('keyboard-task')
    expect(skill?.lessonIds).toEqual(['lesson.m7-03'])
    expect(skill?.params.patterns).toEqual(['direct', 'syncopated'])
    expect(skill?.params.changes).toEqual(['harmony-change'])
    expect(skill?.params.tempoBpm).toEqual(['60', '72'])
    expect(skill?.params.listensFor).toEqual(['mud', 'cut'])
  })
})
