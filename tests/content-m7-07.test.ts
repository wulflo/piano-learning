import { beforeAll, describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { exerciseChoices } from '../src/content/localize'
import { validateContentBundle } from '../src/content/validate'
import { resolveExerciseAnswer } from '../src/exercises/answer'
import {
  WALKING_ROLE_LABELS,
  walkingNoteAt,
  walkingRoleAt,
} from '../src/exercises/walking'
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
  const found = bundle.lessons.find((item) => item.id === 'lesson.m7-07')
  if (!found) throw new Error('Falta la lección M7-07')
  lesson = found
})

describe('M7-07 — Walking bass', () => {
  it('está publicada, validada y sigue a M7-06', () => {
    expect(lesson.moduleId).toBe('M7')
    expect(lesson.slug).toBe('walking-bass')
    expect(lesson.status).toBe('published')
    expect(lesson.prerequisites).toContain('lesson.m7-06')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
    expect(lesson.objectivesEn).toHaveLength(lesson.objectivesEs.length)
    expect(lesson.skillIds).toEqual(['skill.walking-bass'])
    expect(lesson.exerciseIds).toHaveLength(12)
  })

  it('explica las notas de paso, el swing y el estudio sin tensión', () => {
    const text = lesson.sections
      .map((section) => `${section.titleEs} ${section.bodyEs ?? ''}`)
      .join(' ')
      .toLowerCase()

    for (const term of [
      'walking bass',
      'negras',
      'fundamental',
      'tercera',
      'quinta',
      'séptima',
      'nota de paso',
      'diatónica',
      'cromática',
      'swing',
      'pulsos 2 y 4',
      '12 compases',
      'caminata en do',
      'metrónomo',
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
      'walking bass',
      'quarter notes',
      'root',
      'third',
      'fifth',
      'seventh',
      'passing tone',
      'diatonic',
      'chromatic',
      'swing',
      'beats 2 and 4',
      '12-bar',
      'walk in c',
      'metronome',
      'pain',
      'tension',
    ]) {
      expect(english, `Missing concept: ${term}`).toContain(term)
    }
  })

  it('incluye demos de la progresión, del blues y del estudio original', () => {
    const demos = scoreSections(lesson)
    expect(demos).toHaveLength(3)

    const byId = new Map(demos.map((demo) => [demo.sectionId, demo.score]))

    const progression = byId.get('sec.m7-07.demo-progresion')
    expect(progression).toBeDefined()
    if (progression) {
      expect(progression.clef).toBe('bass')
      expect(progression.timeSignature).toEqual({
        numerator: 4,
        denominator: 4,
      })
      expect(progression.events).toHaveLength(16)
      expect(
        progression.events.every(
          (event) =>
            event.hand === 'left' &&
            event.pitches.length === 1 &&
            event.value.duration === 'quarter',
        ),
      ).toBe(true)
      expect(
        progression.events
          .filter((event) => event.chordSymbol)
          .map((event) => event.chordSymbol),
      ).toEqual(['C', 'Am', 'Dm', 'G'])
    }

    const blues = byId.get('sec.m7-07.demo-blues')
    expect(blues).toBeDefined()
    if (blues) {
      expect(blues.events).toHaveLength(48)
      expect(
        blues.events.every(
          (event) =>
            event.hand === 'left' &&
            event.pitches.length === 1 &&
            event.value.duration === 'quarter',
        ),
      ).toBe(true)
      expect(
        blues.events
          .filter((event) => event.chordSymbol)
          .map((event) => event.chordSymbol),
      ).toEqual([
        'C7',
        'C7',
        'C7',
        'C7',
        'F7',
        'F7',
        'C7',
        'C7',
        'G7',
        'F7',
        'C7',
        'G7',
      ])
    }

    const study = byId.get('sec.m7-07.demo-estudio')
    expect(study).toBeDefined()
    if (study) {
      expect(study.tempoBpm).toBe(60)
      expect(study.events).toHaveLength(46)
      expect(
        study.events.filter((event) => event.hand === 'left'),
      ).toHaveLength(32)
      const melody = study.events.filter((event) => event.hand === 'right')
      expect(melody).toHaveLength(14)
      expect(
        melody.map((event) => (event.pitches[0] as { octave: number }).octave),
      ).toEqual([4, 4, 4, 4, 4, 4, 4, 4, 5, 4, 4, 4, 5, 5])
      expect(study.events.filter((event) => event.chordSymbol)).toHaveLength(8)
    }
  })

  it('deduce la nota del bajo y distingue notas del acorde y de paso', () => {
    const progression = scoreSections(lesson).find(
      (demo) => demo.sectionId === 'sec.m7-07.demo-progresion',
    )
    if (!progression) throw new Error('Falta la demo de la progresión')

    expect(walkingNoteAt(progression.score, 1, 0, 'es')).toBe('Do3')
    expect(walkingNoteAt(progression.score, 1, 0, 'en')).toBe('C3')
    expect(walkingNoteAt(progression.score, 1, 2, 'es')).toBe('Sol3')
    expect(walkingNoteAt(progression.score, 1, 3, 'en')).toBe('G#3')
    expect(walkingNoteAt(progression.score, 9, 0, 'es')).toBeNull()

    const noSingleNote: Score = {
      ...progression.score,
      events: progression.score.events.map((event) =>
        event.measure === 1 && event.beat === 1
          ? {
              ...event,
              pitches: [...event.pitches, ...event.pitches],
            }
          : event,
      ),
    }
    expect(walkingNoteAt(noSingleNote, 1, 1, 'es')).toBeNull()

    expect(walkingRoleAt(progression.score, 1, 1)).toBe('chord-tone')
    expect(walkingRoleAt(progression.score, 1, 3)).toBe('passing-tone')
    expect(walkingRoleAt(progression.score, 2, 1)).toBe('chord-tone')
    expect(walkingRoleAt(progression.score, 2, 3)).toBe('passing-tone')

    const withoutChords: Score = {
      ...progression.score,
      events: progression.score.events.map((event) => ({
        ...event,
        chordSymbol: undefined,
      })),
    }
    expect(walkingRoleAt(withoutChords, 1, 1)).toBeNull()
    expect(WALKING_ROLE_LABELS['chord-tone'].es).toBe('Nota del acorde')
    expect(WALKING_ROLE_LABELS['passing-tone'].en).toBe('Passing tone')
  })

  it('plantea ejercicios de nota y de papel con opciones paralelas', () => {
    const exercises = lessonExercises(lesson, bundle)
    expect(exercises).toHaveLength(12)
    expect(exercises.every((exercise) => exercise.type === 'walking-bass')).toBe(
      true,
    )

    const asks = exercises.map((exercise) =>
      exercise.type === 'walking-bass' ? exercise.ask : '',
    )
    expect(asks.filter((ask) => ask === 'note')).toHaveLength(6)
    expect(asks.filter((ask) => ask === 'role')).toHaveLength(6)

    const difficulties = exercises.map((exercise) => exercise.difficulty)
    expect(difficulties.filter((value) => value === 1)).toHaveLength(2)
    expect(difficulties.filter((value) => value === 2)).toHaveLength(4)
    expect(difficulties.filter((value) => value === 3)).toHaveLength(4)
    expect(difficulties.filter((value) => value === 4)).toHaveLength(2)

    for (const exercise of exercises) {
      if (exercise.type !== 'walking-bass') continue
      expect(exercise.skillId, exercise.id).toBe('skill.walking-bass')
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
            event.pitches.length === 1 &&
            event.value.duration === 'quarter',
        ),
        exercise.id,
      ).toBe(true)
      expect(
        exercise.score.events.filter((event) => event.chordSymbol),
        exercise.id,
      ).toHaveLength(4)

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
      (exercise) => exercise.type === 'walking-bass',
    )
    const keys = new Set(
      exercises.map((exercise) =>
        exercise.type === 'walking-bass' ? exercise.score.key : '',
      ),
    )
    expect([...keys].sort()).toEqual([...EXPECTED_KEYS].sort())
    expect(
      exercises.every(
        (exercise) =>
          exercise.type === 'walking-bass' &&
          exercise.score.timeSignature.numerator === 4,
      ),
    ).toBe(true)
  })

  it('resuelve la nota y el papel con sus etiquetas canónicas', () => {
    const byId = new Map(
      lessonExercises(lesson, bundle).map((exercise) => [exercise.id, exercise]),
    )

    const noteExercise = byId.get('ex.m7-07.a')
    if (!noteExercise || noteExercise.type !== 'walking-bass') {
      throw new Error('Falta ex.m7-07.a')
    }
    const noteEs = resolveExerciseAnswer(noteExercise, 'es')
    const noteEn = resolveExerciseAnswer(noteExercise, 'en')
    expect(noteEs.mode).toBe('choice')
    expect(noteEn.mode).toBe('choice')
    if (noteEs.mode !== 'practice' && noteEn.mode !== 'practice') {
      expect(noteEs.answer).toBe('Sol♯3')
      expect(noteEn.answer).toBe('G#3')
    }

    const chordTone = byId.get('ex.m7-07.b')
    if (!chordTone || chordTone.type !== 'walking-bass') {
      throw new Error('Falta ex.m7-07.b')
    }
    const chordEs = resolveExerciseAnswer(chordTone, 'es')
    const chordEn = resolveExerciseAnswer(chordTone, 'en')
    expect(chordEs.mode).toBe('choice')
    expect(chordEn.mode).toBe('choice')
    if (chordEs.mode !== 'practice' && chordEn.mode !== 'practice') {
      expect(chordEs.answer).toBe('Nota del acorde')
      expect(chordEn.answer).toBe('Chord tone')
    }

    const passingTone = byId.get('ex.m7-07.h')
    if (!passingTone || passingTone.type !== 'walking-bass') {
      throw new Error('Falta ex.m7-07.h')
    }
    const passingEs = resolveExerciseAnswer(passingTone, 'es')
    const passingEn = resolveExerciseAnswer(passingTone, 'en')
    expect(passingEs.mode).toBe('choice')
    expect(passingEn.mode).toBe('choice')
    if (passingEs.mode !== 'practice' && passingEn.mode !== 'practice') {
      expect(passingEs.answer).toBe('Nota de paso')
      expect(passingEn.answer).toBe('Passing tone')
    }
  })

  it('incluye la tarea de Caminata en Do con tempo estable y cuidado', () => {
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
    expect(task?.instructionsEs).toMatch(/swing/)
    expect(task?.instructionsEs).toMatch(/dolor, tensión o cansancio/)
    expect(task?.instructionsEn).toMatch(/metronome/)
    expect(task?.instructionsEn).toMatch(/60 BPM/)
    expect(task?.instructionsEn).toMatch(/left hand/)
    expect(task?.instructionsEn).toMatch(/melody/)
    expect(task?.instructionsEn).toMatch(/swing/)
    expect(task?.instructionsEn).toMatch(/pain, tension or fatigue/)
    expect(task?.fingeringEs).toMatch(/5-3-2-1/)
    expect(task?.fingeringEn).toMatch(/5-3-2-1/)

    const demo = task?.demoScore
    expect(demo).toBeDefined()
    if (!demo) throw new Error('Falta la demo de la tarea')
    expect(demo.tempoBpm).toBe(60)
    expect(demo.events).toHaveLength(46)
    expect(demo.events.filter((event) => event.hand === 'right')).toHaveLength(
      14,
    )
  })

  it('registra la habilidad con patrones, direcciones y métricas', () => {
    const skill = bundle.skills.find((item) => item.id === 'skill.walking-bass')
    expect(skill).toBeDefined()
    expect(skill?.kind).toBe('keyboard-task')
    expect(skill?.lessonIds).toEqual(['lesson.m7-07'])
    expect(skill?.params.patterns).toEqual(['chord-tones', 'passing-tones'])
    expect(skill?.params.directions).toEqual(['ascending', 'descending'])
    expect(skill?.params.keys).toEqual(EXPECTED_KEYS)
    expect(skill?.params.meters).toEqual(['4/4'])
    expect(skill?.params.formats).toEqual(['walking-bass'])
    expect(skill?.params.tempoBpm).toEqual(['60', '66', '72'])
  })
})
