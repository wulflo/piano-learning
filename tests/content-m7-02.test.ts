import { beforeAll, describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { exerciseChoices } from '../src/content/localize'
import { spelledPitchToMidi } from '../src/content/score'
import { validateContentBundle } from '../src/content/validate'
import { resolveExerciseAnswer } from '../src/exercises/answer'
import {
  ARPEGGIO_TONICS,
  arpeggioFingeringLabel,
  arpeggioNoteNames,
  arpeggioScore,
} from '../src/exercises/arpeggio'
import type { ContentBundle, Exercise, Lesson, Score } from '../src/schemas'

const EXPECTED_TONICS = ['C', 'G', 'D', 'A', 'E', 'B', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb']

function lessonExercises(lesson: Lesson, bundle: ContentBundle): Exercise[] {
  return lesson.exerciseIds
    .map((id) => bundle.exercises.find((item) => item.id === id))
    .filter((exercise): exercise is Exercise => Boolean(exercise))
}

function scoreSections(lesson: Lesson): Array<{ sectionId: string; score: Score }> {
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
  const found = bundle.lessons.find((item) => item.id === 'lesson.m7-02')
  if (!found) throw new Error('Falta la lección M7-02')
  lesson = found
})

describe('M7-02 — Arpegios y acordes quebrados', () => {
  it('está publicada, validada y sigue a M7-01', () => {
    expect(lesson.moduleId).toBe('M7')
    expect(lesson.slug).toBe('arpegios-y-acordes-quebrados')
    expect(lesson.status).toBe('published')
    expect(lesson.prerequisites).toContain('lesson.m7-01')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
    expect(lesson.objectivesEn).toHaveLength(lesson.objectivesEs.length)
    expect(lesson.skillIds).toEqual(['skill.arpeggio'])
    expect(lesson.exerciseIds).toHaveLength(13)
  })

  it('explica arpegio, acorde quebrado, digitación y tempo sin tensión', () => {
    const text = lesson.sections
      .map((section) => `${section.titleEs} ${section.bodyEs ?? ''}`)
      .join(' ')
      .toLowerCase()

    for (const term of [
      'arpegio',
      'acorde quebrado',
      'digitación',
      'tecla blanca',
      'tecla negra',
      'doce tonalidades',
      'octava',
      'pulso',
      'tempo',
      'tensión',
      'dolor',
    ]) {
      expect(text, `Falta el concepto: ${term}`).toContain(term)
    }

    const english = lesson.sections
      .map((section) => `${section.titleEn} ${section.bodyEn ?? ''}`)
      .join(' ')
      .toLowerCase()
    for (const term of [
      'arpeggio',
      'broken chord',
      'fingering',
      'white-key',
      'black-key',
      'twelve keys',
      'octave',
      'pulse',
      'tempo',
      'tension',
      'pain',
    ]) {
      expect(english, `Missing concept: ${term}`).toContain(term)
    }

    const tonicNames: Record<string, string> = {
      C: 'do',
      G: 'sol',
      D: 're',
      A: 'la',
      E: 'mi',
      B: 'si',
      F: 'fa',
      Bb: 'si bemol',
      Eb: 'mi bemol',
      Ab: 'la bemol',
      Db: 're bemol',
      Gb: 'sol bemol',
    }
    for (const tonic of EXPECTED_TONICS) {
      expect(text, `Falta la tonalidad ${tonic}`).toContain(
        tonicNames[tonic],
      )
    }
  })

  it('incluye demos de arpegio, acorde quebrado y dos octavas', () => {
    const demos = scoreSections(lesson)
    expect(demos).toHaveLength(3)

    const byId = new Map(demos.map((demo) => [demo.sectionId, demo.score]))

    const arpeggio = byId.get('sec.m7-02.demo-arpegio')
    expect(arpeggio).toBeDefined()
    if (arpeggio) {
      expect(arpeggio.events.map((event) => event.id)).toEqual([
        'sec.m7-02.demo-arpegio.1',
        'sec.m7-02.demo-arpegio.2',
        'sec.m7-02.demo-arpegio.3',
        'sec.m7-02.demo-arpegio.4',
      ])
      expect(arpeggio.events.map((event) => spelledPitchToMidi(event.pitches[0]))).toEqual([
        60, 64, 67, 72,
      ])
      expect(arpeggio.events.every((event) => event.hand === 'right')).toBe(true)
    }

    const broken = byId.get('sec.m7-02.demo-quebrado')
    expect(broken).toBeDefined()
    if (broken) {
      expect(broken.events.map((event) => spelledPitchToMidi(event.pitches[0]))).toEqual([
        60, 64, 67, 64, 60, 64, 67, 72,
      ])
    }

    const twoOctaves = byId.get('sec.m7-02.demo-dos-octavas')
    expect(twoOctaves).toBeDefined()
    if (twoOctaves) {
      expect(twoOctaves.events.map((event) => spelledPitchToMidi(event.pitches[0]))).toEqual([
        60, 64, 67, 72, 76, 79, 84,
      ])
    }

    for (const demo of demos) {
      expect(demo.score.key, demo.sectionId).toBe('C')
      expect(demo.score.mode, demo.sectionId).toBe('major')
      expect(demo.score.tempoBpm, demo.sectionId).toBe(72)
      expect(demo.score.events.every((event) => event.pitches.length === 1)).toBe(
        true,
      )
    }
  })

  it('recorre las doce tonalidades básicas una vez cada una', () => {
    const arpeggios = lessonExercises(lesson, bundle).filter(
      (exercise) => exercise.type === 'arpeggio',
    )
    expect(arpeggios).toHaveLength(12)
    const tonics = arpeggios.map((exercise) =>
      exercise.type === 'arpeggio' ? exercise.tonic : '',
    )
    expect([...tonics].sort()).toEqual([...EXPECTED_TONICS].sort())
    expect(new Set(ARPEGGIO_TONICS)).toEqual(new Set(EXPECTED_TONICS))
  })

  it('plantea dificultad creciente y combina digitación con orden de notas', () => {
    const arpeggios = lessonExercises(lesson, bundle).filter(
      (exercise) => exercise.type === 'arpeggio',
    )
    const difficulties = arpeggios.map((exercise) => exercise.difficulty)
    expect(difficulties.filter((value) => value === 1)).toHaveLength(3)
    expect(difficulties.filter((value) => value === 2)).toHaveLength(5)
    expect(difficulties.filter((value) => value === 3)).toHaveLength(4)

    const asks = arpeggios.map((exercise) =>
      exercise.type === 'arpeggio' ? exercise.ask : '',
    )
    expect(asks.filter((ask) => ask === 'fingering')).toHaveLength(8)
    expect(asks.filter((ask) => ask === 'notes')).toHaveLength(4)

    const octaves = arpeggios.map((exercise) =>
      exercise.type === 'arpeggio' ? exercise.octaves : 0,
    )
    expect(octaves.filter((value) => value === 1)).toHaveLength(8)
    expect(octaves.filter((value) => value === 2)).toHaveLength(4)
  })

  it('cada ejercicio tiene respuesta canónica y opciones paralelas ES/EN', () => {
    for (const exercise of lessonExercises(lesson, bundle)) {
      if (exercise.type !== 'arpeggio') continue
      expect(exercise.skillId, exercise.id).toBe('skill.arpeggio')
      expect(exercise.hand, exercise.id).toBe('right')

      const expected =
        exercise.ask === 'fingering'
          ? arpeggioFingeringLabel(exercise.tonic, exercise.hand, exercise.octaves)
          : arpeggioNoteNames(exercise.tonic, exercise.hand, exercise.octaves, 'es')

      const spanish = resolveExerciseAnswer(exercise, 'es')
      const english = resolveExerciseAnswer(exercise, 'en')
      expect(spanish.mode, `${exercise.id} modo ES`).toBe('choice')
      expect(english.mode, `${exercise.id} modo EN`).toBe('choice')
      if (spanish.mode !== 'choice' || english.mode !== 'choice') continue

      expect(spanish.answer, `${exercise.id} respuesta ES`).toBe(expected)

      const choicesEs = exerciseChoices(exercise, 'es') ?? []
      const choicesEn = exerciseChoices(exercise, 'en') ?? []
      expect(choicesEs, `${exercise.id} opciones ES`).toContain(spanish.answer)
      expect(choicesEn, `${exercise.id} opciones EN`).toContain(english.answer)
      expect(choicesEs, `${exercise.id} cantidad de opciones`).toHaveLength(3)
      expect(choicesEs.length, exercise.id).toBe(choicesEn.length)
      expect(
        choicesEs.indexOf(spanish.answer),
        `${exercise.id} índice paralelo`,
      ).toBe(choicesEn.indexOf(english.answer))
    }
  })

  it('mantiene cada arpegio dentro de dos octavas y sin acordes simultáneos', () => {
    for (const exercise of lessonExercises(lesson, bundle)) {
      if (exercise.type !== 'arpeggio') continue
      const score = arpeggioScore(
        exercise.tonic,
        exercise.hand,
        exercise.octaves,
      )
      expect(score.events, exercise.id).toHaveLength(
        exercise.octaves * 3 + 1,
      )
      const midis = score.events.map((event) =>
        spelledPitchToMidi(event.pitches[0]),
      )
      for (const [index, midi] of midis.entries()) {
        expect(midi, `${exercise.id} nota ${index}`).toBeGreaterThanOrEqual(48)
        expect(midi, `${exercise.id} nota ${index}`).toBeLessThanOrEqual(92)
        if (index > 0) {
          expect(
            Math.abs(midi - midis[index - 1]),
            `${exercise.id} salto ${index}`,
          ).toBeLessThanOrEqual(12)
        }
      }
      expect(midis.at(-1), exercise.id).toBe(
        midis[0]! + exercise.octaves * 12,
      )
      expect(
        score.events.every((event) => event.pitches.length === 1),
        exercise.id,
      ).toBe(true)
    }
  })

  it('incluye un ejercicio de práctica con tempo progresivo', () => {
    const exercise = lessonExercises(lesson, bundle).find(
      (item) => item.id === 'ex.m7-02.m',
    )
    expect(exercise).toBeDefined()
    if (!exercise) throw new Error('Falta el ejercicio de tempo progresivo')
    expect(exercise.type).toBe('tempo-stability')
    expect(exercise.skillId).toBe('skill.arpeggio')
    if (exercise.type !== 'tempo-stability') return
    expect(exercise.targetBpm).toBe(84)
    expect(exercise.beats).toBe(16)
    expect(exercise.toleranceBpm).toBe(4)
    expect(exercise.promptEs).toMatch(/60 BPM.*72.*84/s)
    expect(exercise.promptEn).toMatch(/60 BPM.*72.*84/s)
    expect(resolveExerciseAnswer(exercise).mode).toBe('practice')
  })

  it('incluye una tarea de teclado con progresión 60-72-84 y digitación', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.tempoBpm).toBe(60)
    expect(task?.keys).toHaveLength(4)
    expect(task?.checklistEs.length).toBeGreaterThanOrEqual(4)
    expect(task?.checklistEn).toHaveLength(task?.checklistEs.length ?? 0)
    expect(task?.instructionsEs).toMatch(/60 BPM/)
    expect(task?.instructionsEs).toMatch(/72/)
    expect(task?.instructionsEs).toMatch(/84/)
    expect(task?.instructionsEn).toMatch(/60 BPM/)
    expect(task?.instructionsEn).toMatch(/72/)
    expect(task?.instructionsEn).toMatch(/84/)
    expect(task?.instructionsEs).toMatch(/dolor, tensión o cansancio/)
    expect(task?.instructionsEn).toMatch(/pain, tension or fatigue/)
    expect(task?.fingeringEs).toMatch(/1-2-3-5/)
    expect(task?.fingeringEs).toMatch(/5-3-2-1/)
    expect(task?.fingeringEn).toMatch(/1-2-3-5/)
    expect(task?.fingeringEn).toMatch(/5-3-2-1/)

    const demo = task?.demoScore
    expect(demo).toBeDefined()
    if (!demo) throw new Error('Falta la demo de la tarea')
    expect(demo.key).toBe('C')
    expect(demo.mode).toBe('major')
    expect(demo.tempoBpm).toBe(60)
    expect(demo.events.map((event) => spelledPitchToMidi(event.pitches[0]))).toEqual([
      60, 64, 67, 72, 72, 67, 64, 60,
    ])
  })

  it('registra la habilidad con las doce tónicas y la lección', () => {
    const skill = bundle.skills.find((item) => item.id === 'skill.arpeggio')
    expect(skill).toBeDefined()
    expect(skill?.kind).toBe('keyboard-task')
    expect(skill?.lessonIds).toEqual(['lesson.m7-02'])
    const tonics = skill?.params.tonics
    expect(Array.isArray(tonics)).toBe(true)
    if (Array.isArray(tonics)) {
      expect([...tonics].sort()).toEqual([...EXPECTED_TONICS].sort())
    }
    expect(skill?.params.hands).toEqual(['right', 'left'])
    expect(skill?.params.octaves).toEqual(['1', '2'])
    expect(skill?.params.tempoBpm).toEqual(['60', '72', '84'])
  })
})
