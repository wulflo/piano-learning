import { beforeAll, describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { validateContentBundle } from '../src/content/validate'
import {
  isExerciseAnswerCorrect,
  resolveExerciseAnswer,
} from '../src/exercises/answer'
import { earChordTimeline } from '../src/exercises/audio'
import {
  CHORD_DEFINITIONS,
  chordWithInversion,
  formatPitch,
  formatPitchEs,
  fromSpelledPitch,
  midiOf,
} from '../src/theory'
import type { ChordQuality } from '../src/theory'
import type { ContentBundle, Exercise, Lesson, Score } from '../src/schemas'

type ChordExercise = Extract<Exercise, { type: 'chord' }>
type EarChordExercise = Extract<Exercise, { type: 'ear-chord' }>

const TRIAD_QUALITIES: ChordQuality[] = [
  'major',
  'minor',
  'diminished',
  'augmented',
]
const SEVENTH_QUALITIES: ChordQuality[] = [
  'major7',
  'dominant7',
  'minor7',
  'half-diminished7',
  'diminished7',
]
const ALL_QUALITIES = [...TRIAD_QUALITIES, ...SEVENTH_QUALITIES]
const CANONICAL_ROOTS = [
  'C',
  'C#',
  'D',
  'Eb',
  'E',
  'F',
  'F#',
  'G',
  'Ab',
  'A',
  'Bb',
  'B',
]

function lessonExercises(lesson: Lesson, bundle: ContentBundle): Exercise[] {
  return lesson.exerciseIds
    .map((id) => bundle.exercises.find((item) => item.id === id))
    .filter((exercise): exercise is Exercise => Boolean(exercise))
}

function rootName(exercise: ChordExercise | EarChordExercise): string {
  return `${exercise.root.step}${exercise.root.accidental}`
}

function scoreSections(lesson: Lesson): Score[] {
  return lesson.sections
    .filter((section) => section.kind === 'score' && section.score)
    .map((section) => section.score as Score)
}

function eventMidis(score: Score): number[][] {
  return score.events.map((event) =>
    event.pitches.map((pitch) => midiOf(fromSpelledPitch(pitch))),
  )
}

let bundle: ContentBundle
let lesson: Lesson

beforeAll(async () => {
  const result = validateContentBundle(await loadContentFromDisk(process.cwd()))
  expect(result.ok, result.issues.map((issue) => issue.message).join('\n')).toBe(
    true,
  )
  if (!result.bundle) throw new Error('El contenido del repositorio no es válido')
  bundle = result.bundle
  const found = bundle.lessons.find((item) => item.id === 'lesson.m4-10')
  if (!found) throw new Error('Falta lesson.m4-10')
  lesson = found
})

describe('F3-015 — Calidad de acordes', () => {
  it('publica M4-10 después de cifrado y notas', () => {
    expect(lesson.status).toBe('published')
    expect(lesson.moduleId).toBe('M4')
    expect(lesson.prerequisites).toContain('lesson.m4-09')
    expect(lesson.exerciseIds).toHaveLength(12)
    expect(lesson.skillIds).toEqual(
      expect.arrayContaining([
        'skill.chord-quality',
        'skill.chord-seventh',
        'skill.chord-quality-ear',
      ]),
    )
    expect(validateContentBundle(bundle).issues).toEqual([])
  })

  it('explica las cuatro tríadas y las cinco séptimas', () => {
    const text = lesson.sections
      .map((section) => `${section.bodyEs ?? ''} ${section.bodyEn ?? ''}`)
      .join(' ')
    for (const term of [
      'tercera mayor',
      'tercera menor',
      'quinta aumentada',
      'quinta disminuida',
      'maj7',
      'm7♭5',
      'dim7',
      'séptima disminuida',
      'semidisminuida',
    ]) {
      expect(text, term).toContain(term)
    }
  })

  it('usa cuatro acordes de demo que contrastan pares cercanos', () => {
    const scores = scoreSections(lesson)
    expect(scores).toHaveLength(1)
    const score = scores[0]!
    expect(eventMidis(score)).toEqual([
      [60, 64, 67, 71],
      [60, 64, 67, 70],
      [62, 65, 69, 72],
      [62, 65, 68, 72],
    ])
  })

  it('reparte las doce tónicas entre seis ejercicios visuales y seis auditivos', () => {
    const exercises = lessonExercises(lesson, bundle).filter(
      (exercise): exercise is ChordExercise | EarChordExercise =>
        exercise.type === 'chord' || exercise.type === 'ear-chord',
    )
    const chords = exercises.filter(
      (exercise): exercise is ChordExercise => exercise.type === 'chord',
    )
    const earChords = exercises.filter(
      (exercise): exercise is EarChordExercise => exercise.type === 'ear-chord',
    )

    expect(chords).toHaveLength(6)
    expect(earChords).toHaveLength(6)
    expect(new Set(exercises.map(rootName))).toEqual(new Set(CANONICAL_ROOTS))
    expect(new Set(exercises.map((exercise) => exercise.quality))).toEqual(
      new Set(ALL_QUALITIES),
    )
    expect(chords.every((exercise) => exercise.ask === 'quality')).toBe(true)
    expect(
      earChords.every(
        (exercise) =>
          exercise.inversion === 0 &&
          exercise.style === 'block' &&
          rootName(exercise) !== '',
      ),
    ).toBe(true)
  })

  it('resuelve las respuestas en español e inglés con opciones cercanas', () => {
    const exercises = lessonExercises(lesson, bundle).filter(
      (exercise): exercise is ChordExercise | EarChordExercise =>
        exercise.type === 'chord' || exercise.type === 'ear-chord',
    )

    for (const exercise of exercises) {
      const definition = CHORD_DEFINITIONS[exercise.quality]
      const family = SEVENTH_QUALITIES.includes(exercise.quality)
        ? SEVENTH_QUALITIES
        : TRIAD_QUALITIES
      const expectedFamily = new Set(
        family.map((quality) => CHORD_DEFINITIONS[quality].nameEs),
      )
      const expectedFamilyEn = new Set(
        family.map((quality) => CHORD_DEFINITIONS[quality].nameEn),
      )

      expect(resolveExerciseAnswer(exercise, 'es'), exercise.id).toMatchObject({
        mode: 'choice',
        answer: definition.nameEs,
      })
      expect(resolveExerciseAnswer(exercise, 'en'), exercise.id).toMatchObject({
        mode: 'choice',
        answer: definition.nameEn,
      })
      expect(
        isExerciseAnswerCorrect(exercise, definition.nameEs, 'es'),
        exercise.id,
      ).toBe(true)
      expect(
        isExerciseAnswerCorrect(exercise, definition.nameEn, 'en'),
        exercise.id,
      ).toBe(true)

      expect(exercise.choices, exercise.id).toBeDefined()
      expect(exercise.choicesEn, exercise.id).toBeDefined()
      expect(exercise.choices?.length, exercise.id).toBeGreaterThanOrEqual(4)
      expect(exercise.choicesEn?.length, exercise.id).toBe(
        exercise.choices?.length,
      )
      for (const choice of exercise.choices ?? []) {
        expect(expectedFamily.has(choice), `${exercise.id}: ${choice}`).toBe(
          true,
        )
      }
      for (const choice of exercise.choicesEn ?? []) {
        expect(expectedFamilyEn.has(choice), `${exercise.id}: ${choice}`).toBe(
          true,
        )
      }
    }
  })

  it('genera un timeline de audio con las notas del acorde', () => {
    const exercises = lessonExercises(lesson, bundle).filter(
      (exercise): exercise is EarChordExercise => exercise.type === 'ear-chord',
    )

    for (const exercise of exercises) {
      const timeline = earChordTimeline(exercise, 60)
      const pitches = chordWithInversion(
        fromSpelledPitch(exercise.root),
        exercise.quality,
        exercise.inversion,
      )
      expect(timeline, exercise.id).toHaveLength(1)
      expect(timeline[0]?.midis, exercise.id).toEqual(
        pitches.map((pitch) => midiOf(pitch)),
      )
      expect(timeline[0]?.duration, exercise.id).toBeGreaterThan(0)
    }

    const fMajor = exercises.find((exercise) => exercise.id === 'ex.m4-10.g')!
    expect(earChordTimeline(fMajor, 60)[0]?.midis).toEqual([65, 69, 72])
  })

  it('mantiene la tarea de teclado sobre los cuatro acordes de la demo', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.checklistEs).toHaveLength(3)
    expect(task?.checklistEn).toHaveLength(3)
    const demo = task?.demoScore
    expect(demo).toBeDefined()
    expect(eventMidis(demo!)).toEqual([
      [60, 64, 67, 71],
      [60, 64, 67, 70],
      [62, 65, 69, 72],
      [62, 65, 68, 72],
    ])
    const expectedKeys = new Set(
      demo!.events.flatMap((event) =>
        event.pitches.map((pitch) => formatPitch(fromSpelledPitch(pitch))),
      ),
    )
    const taskKeys = new Set(
      (task?.keys ?? []).map((pitch) => formatPitch(fromSpelledPitch(pitch))),
    )
    expect(taskKeys).toEqual(expectedKeys)
  })

  it('describe las notas de cada acorde visual sin errores de ortografía', () => {
    const chords = lessonExercises(lesson, bundle).filter(
      (exercise): exercise is ChordExercise => exercise.type === 'chord',
    )

    for (const exercise of chords) {
      const notesEs = chordWithInversion(
        fromSpelledPitch(exercise.root),
        exercise.quality,
        exercise.inversion,
      ).map((pitch) => formatPitchEs(pitch))
      for (const note of notesEs) {
        expect(exercise.promptEs, `${exercise.id}: ${note}`).toContain(note)
      }
    }
  })
})
