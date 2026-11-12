import { beforeAll, describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { validateContentBundle } from '../src/content/validate'
import {
  isExerciseAnswerCorrect,
  resolveExerciseAnswer,
} from '../src/exercises/answer'
import {
  CHORD_DEFINITIONS,
  CHORD_INVERSION_LABELS,
  chordPitches,
  chordWithInversion,
  chordWithSlash,
  formatPitch,
  formatPitchEs,
  fromSpelledPitch,
  midiOf,
} from '../src/theory'
import type { ContentBundle, Exercise, Lesson, Score } from '../src/schemas'

type ChordExercise = Extract<Exercise, { type: 'chord' }>

function lessonExercises(lesson: Lesson, bundle: ContentBundle): Exercise[] {
  return lesson.exerciseIds
    .map((id) => bundle.exercises.find((item) => item.id === id))
    .filter((exercise): exercise is Exercise => Boolean(exercise))
}

function chordExercises(lesson: Lesson, bundle: ContentBundle): ChordExercise[] {
  return lessonExercises(lesson, bundle).filter(
    (exercise): exercise is ChordExercise => exercise.type === 'chord',
  )
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

function pitchClass(pitch: { step: string; accidental: number }): string {
  return `${pitch.step}${pitch.accidental}`
}

function notesEs(exercise: ChordExercise): string {
  return (
    exercise.slash
      ? chordWithSlash(
          fromSpelledPitch(exercise.root),
          exercise.quality,
          fromSpelledPitch(exercise.slash),
        )
      : chordWithInversion(
          fromSpelledPitch(exercise.root),
          exercise.quality,
          exercise.inversion,
        )
  )
    .map((pitch) => formatPitchEs(pitch))
    .join(' ')
}

function notesEn(exercise: ChordExercise): string {
  return (
    exercise.slash
      ? chordWithSlash(
          fromSpelledPitch(exercise.root),
          exercise.quality,
          fromSpelledPitch(exercise.slash),
        )
      : chordWithInversion(
          fromSpelledPitch(exercise.root),
          exercise.quality,
          exercise.inversion,
        )
  )
    .map((pitch) => formatPitch(pitch).replace(/\d+$/, ''))
    .join(' ')
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
  const found = bundle.lessons.find((item) => item.id === 'lesson.m4-11')
  if (!found) throw new Error('Falta lesson.m4-11')
  lesson = found
})

describe('F3-016 — Inversiones y bajo', () => {
  it('publica M4-11 después de calidad de acordes', () => {
    expect(lesson.status).toBe('published')
    expect(lesson.moduleId).toBe('M4')
    expect(lesson.prerequisites).toContain('lesson.m4-10')
    expect(lesson.exerciseIds).toHaveLength(12)
    expect(lesson.skillIds).toEqual(
      expect.arrayContaining(['skill.chord-inversion', 'skill.chord-slash']),
    )
    expect(validateContentBundle(bundle).issues).toEqual([])
  })

  it('explica las posiciones y las condiciones de un voicing válido', () => {
    const text = lesson.sections
      .map((section) => `${section.bodyEs ?? ''} ${section.bodyEn ?? ''}`)
      .join(' ')
    for (const term of [
      'estado fundamental',
      'primera inversión',
      'segunda',
      'tercera',
      'bajo',
      'rotación',
      'híbrido',
    ]) {
      expect(text, term).toContain(term)
    }
  })

  it('muestra Do maj7 en sus cuatro posiciones', () => {
    const scores = scoreSections(lesson)
    expect(scores).toHaveLength(1)
    expect(eventMidis(scores[0]!)).toEqual([
      [60, 64, 67, 71],
      [64, 67, 71, 72],
      [67, 71, 72, 76],
      [71, 72, 76, 79],
    ])
  })

  it('identifica la inversión por el bajo en seis ejercicios', () => {
    const exercises = chordExercises(lesson, bundle).filter(
      (exercise) => exercise.ask === 'inversion',
    )
    expect(exercises).toHaveLength(6)

    for (const exercise of exercises) {
      const expectedNotes = chordWithInversion(
        fromSpelledPitch(exercise.root),
        exercise.quality,
        exercise.inversion,
      ).map((pitch) => formatPitchEs(pitch))
      for (const note of expectedNotes) {
        expect(exercise.promptEs, `${exercise.id}: ${note}`).toContain(note)
      }

      expect(
        resolveExerciseAnswer(exercise, 'es'),
        exercise.id,
      ).toMatchObject({
        mode: 'choice',
        answer: CHORD_INVERSION_LABELS.es[exercise.inversion],
      })
      expect(
        resolveExerciseAnswer(exercise, 'en'),
        exercise.id,
      ).toMatchObject({
        mode: 'choice',
        answer: CHORD_INVERSION_LABELS.en[exercise.inversion],
      })
      expect(
        isExerciseAnswerCorrect(
          exercise,
          CHORD_INVERSION_LABELS.es[exercise.inversion],
          'es',
        ),
        exercise.id,
      ).toBe(true)
      expect(
        isExerciseAnswerCorrect(
          exercise,
          CHORD_INVERSION_LABELS.en[exercise.inversion],
          'en',
        ),
        exercise.id,
      ).toBe(true)

      const positions = CHORD_DEFINITIONS[exercise.quality].intervals.length
      expect(exercise.choices, exercise.id).toHaveLength(positions)
      expect(exercise.choicesEn, exercise.id).toHaveLength(positions)
      expect(exercise.choices, exercise.id).toContain(
        CHORD_INVERSION_LABELS.es[exercise.inversion],
      )
      expect(exercise.choicesEn, exercise.id).toContain(
        CHORD_INVERSION_LABELS.en[exercise.inversion],
      )
    }
  })

  it('construye las notas desde un bajo dado y valida el voicing', () => {
    const exercises = chordExercises(lesson, bundle).filter(
      (exercise) => exercise.ask === 'notes',
    )
    expect(exercises).toHaveLength(6)

    for (const exercise of exercises) {
      expect(exercise.slash, exercise.id).toBeDefined()
      const root = fromSpelledPitch(exercise.root)
      const slash = fromSpelledPitch(exercise.slash!)
      const chord = chordPitches(root, exercise.quality)
      const voicing = chordWithSlash(root, exercise.quality, slash)

      // Bajo correcto: la nota de la barra es la más grave.
      expect(pitchClass(voicing[0]!), exercise.id).toBe(pitchClass(slash))
      expect(midiOf(voicing[0]!), exercise.id).toBe(
        Math.min(...voicing.map((pitch) => midiOf(pitch))),
      )

      // Notas completas: mismas clases que el acorde, sin notas ajenas.
      expect(new Set(voicing.map(pitchClass)), exercise.id).toEqual(
        new Set(chord.map(pitchClass)),
      )
      expect(voicing, exercise.id).toHaveLength(chord.length)

      // Orden rotado: desde el bajo suben los grados en el mismo orden.
      const bassIndex = chord.findIndex(
        (pitch) => pitchClass(pitch) === pitchClass(slash),
      )
      expect(bassIndex, exercise.id).toBeGreaterThanOrEqual(0)
      expect(exercise.inversion, exercise.id).toBe(bassIndex)
      for (const [index, pitch] of voicing.entries()) {
        const expected = chord[(bassIndex + index) % chord.length]!
        expect(pitchClass(pitch), `${exercise.id} nota ${index}`).toBe(
          pitchClass(expected),
        )
      }

      // Respuesta escrita en los dos idiomas.
      expect(resolveExerciseAnswer(exercise, 'es'), exercise.id).toMatchObject({
        mode: 'text',
        answer: notesEs(exercise),
      })
      // La respuesta canónica de las notas se muestra en español; el inglés
      // sigue siendo una respuesta aceptada.
      expect(resolveExerciseAnswer(exercise, 'en'), exercise.id).toMatchObject({
        mode: 'text',
        answer: notesEs(exercise),
      })
      expect(
        isExerciseAnswerCorrect(exercise, notesEs(exercise), 'es'),
        exercise.id,
      ).toBe(true)
      expect(
        isExerciseAnswerCorrect(exercise, notesEn(exercise), 'en'),
        exercise.id,
      ).toBe(true)
      expect(
        isExerciseAnswerCorrect(
          exercise,
          chord
            .map((pitch) => formatPitchEs(pitch))
            .join(' '),
          'es',
        ),
        exercise.id,
      ).toBe(false)
    }
  })

  it('mantiene la tarea de teclado sobre las cuatro posiciones', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.checklistEs).toHaveLength(3)
    expect(task?.checklistEn).toHaveLength(3)
    expect(eventMidis(task!.demoScore!)).toEqual([
      [60, 64, 67, 71],
      [64, 67, 71, 72],
      [67, 71, 72, 76],
      [71, 72, 76, 79],
    ])
  })
})
