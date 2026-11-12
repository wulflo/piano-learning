import { beforeAll, describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { validateContentBundle } from '../src/content/validate'
import {
  isExerciseAnswerCorrect,
  resolveExerciseAnswer,
} from '../src/exercises/answer'
import {
  chordPitches,
  chordSymbol,
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
  return chordWithSlash(
    fromSpelledPitch(exercise.root),
    exercise.quality,
    fromSpelledPitch(exercise.slash!),
  )
    .map((pitch) => formatPitchEs(pitch))
    .join(' ')
}

function notesEn(exercise: ChordExercise): string {
  return chordWithSlash(
    fromSpelledPitch(exercise.root),
    exercise.quality,
    fromSpelledPitch(exercise.slash!),
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
  const found = bundle.lessons.find((item) => item.id === 'lesson.m4-12')
  if (!found) throw new Error('Falta lesson.m4-12')
  lesson = found
})

describe('F3-017 — Extensiones con bajo', () => {
  it('publica M4-12 después de inversiones y bajo', () => {
    expect(lesson.status).toBe('published')
    expect(lesson.moduleId).toBe('M4')
    expect(lesson.prerequisites).toContain('lesson.m4-11')
    expect(lesson.exerciseIds).toHaveLength(12)
    expect(lesson.skillIds).toEqual(
      expect.arrayContaining(['skill.chord-extension', 'skill.chord-slash']),
    )
    expect(validateContentBundle(bundle).issues).toEqual([])
  })

  it('explica cómo combinar la extensión con el bajo', () => {
    const text = lesson.sections
      .map((section) => `${section.bodyEs ?? ''} ${section.bodyEn ?? ''}`)
      .join(' ')
    for (const term of [
      'novena',
      'oncena',
      'trecena',
      'séptima',
      'bajo',
      'barra',
      'voicing',
      'dobles alteraciones',
    ]) {
      expect(text, term).toContain(term)
    }
  })

  it('muestra cuatro extensiones con bajo en la demo', () => {
    const scores = scoreSections(lesson)
    expect(scores).toHaveLength(1)
    expect(eventMidis(scores[0]!)).toEqual([
      [64, 67, 71, 72, 74],
      [72, 74, 76, 77, 81],
      [77, 79, 81, 83, 84, 86],
      [72, 75, 79, 80, 82, 85, 89],
    ])
  })

  it('construye las notas desde el cifrado con bajo', () => {
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

      // Voicing ascendente y sin dobles alteraciones.
      for (let index = 1; index < voicing.length; index += 1) {
        expect(midiOf(voicing[index]!), `${exercise.id} nota ${index}`).toBeGreaterThan(
          midiOf(voicing[index - 1]!),
        )
      }
      for (const pitch of voicing) {
        expect(Math.abs(pitch.accidental), exercise.id).toBeLessThanOrEqual(1)
      }

      // El índice de inversión coincide con el grado del bajo.
      const bassIndex = chord.findIndex(
        (pitch) => pitchClass(pitch) === pitchClass(slash),
      )
      expect(bassIndex, exercise.id).toBeGreaterThanOrEqual(0)
      expect(exercise.inversion, exercise.id).toBe(bassIndex)

      // Respuesta escrita: el español es la canónica y el inglés se acepta.
      expect(resolveExerciseAnswer(exercise, 'es'), exercise.id).toMatchObject({
        mode: 'text',
        answer: notesEs(exercise),
      })
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

      // El acorde en estado fundamental no es la respuesta pedida.
      expect(
        isExerciseAnswerCorrect(
          exercise,
          chord.map((pitch) => formatPitchEs(pitch)).join(' '),
          'es',
        ),
        exercise.id,
      ).toBe(false)
    }
  })

  it('pide el cifrado a partir de las notas del voicing', () => {
    const exercises = chordExercises(lesson, bundle).filter(
      (exercise) => exercise.ask === 'symbol',
    )
    expect(exercises).toHaveLength(6)

    for (const exercise of exercises) {
      expect(exercise.slash, exercise.id).toBeDefined()
      const root = fromSpelledPitch(exercise.root)
      const slash = fromSpelledPitch(exercise.slash!)
      const chord = chordPitches(root, exercise.quality)
      const voicing = chordWithSlash(root, exercise.quality, slash)
      const symbolEs = chordSymbol(root, exercise.quality, {
        notation: 'do',
        slash,
      })
      const symbolEn = chordSymbol(root, exercise.quality, {
        notation: 'c',
        slash,
      })

      // El enunciado da las notas de grave a agudo, no el cifrado.
      for (const name of voicing.map((pitch) => formatPitchEs(pitch))) {
        expect(exercise.promptEs, `${exercise.id} prompt ES`).toContain(name)
      }
      for (const name of voicing.map((pitch) =>
        formatPitch(pitch).replace(/\d+$/, ''),
      )) {
        expect(exercise.promptEn, `${exercise.id} prompt EN`).toContain(name)
      }
      expect(exercise.promptEs, exercise.id).not.toContain(symbolEs)
      expect(exercise.promptEn, exercise.id).not.toContain(symbolEn)

      // Voicing válido: bajo correcto, notas completas y orden ascendente.
      expect(pitchClass(voicing[0]!), exercise.id).toBe(pitchClass(slash))
      expect(new Set(voicing.map(pitchClass)), exercise.id).toEqual(
        new Set(chord.map(pitchClass)),
      )
      for (let index = 1; index < voicing.length; index += 1) {
        expect(midiOf(voicing[index]!), `${exercise.id} nota ${index}`).toBeGreaterThan(
          midiOf(voicing[index - 1]!),
        )
      }
      const bassIndex = chord.findIndex(
        (pitch) => pitchClass(pitch) === pitchClass(slash),
      )
      expect(exercise.inversion, exercise.id).toBe(bassIndex)

      // Opciones paralelas y respuesta correcta en los dos idiomas.
      expect(exercise.choices, exercise.id).toHaveLength(3)
      expect(exercise.choicesEn, exercise.id).toHaveLength(3)
      expect(exercise.choices, exercise.id).toContain(symbolEs)
      expect(exercise.choicesEn, exercise.id).toContain(symbolEn)
      expect(resolveExerciseAnswer(exercise, 'es'), exercise.id).toMatchObject({
        mode: 'choice',
        answer: symbolEs,
      })
      expect(resolveExerciseAnswer(exercise, 'en'), exercise.id).toMatchObject({
        mode: 'choice',
        answer: symbolEn,
      })
      expect(
        isExerciseAnswerCorrect(exercise, symbolEs, 'es'),
        exercise.id,
      ).toBe(true)
      expect(
        isExerciseAnswerCorrect(exercise, symbolEn, 'en'),
        exercise.id,
      ).toBe(true)

      // Un distractor cercano no debe darse por correcto.
      const distractor = exercise.choices!.find((choice) => choice !== symbolEs)
      expect(distractor, exercise.id).toBeDefined()
      expect(
        isExerciseAnswerCorrect(exercise, distractor!, 'es'),
        exercise.id,
      ).toBe(false)
    }
  })

  it('cubre las doce tónicas y las nueve calidades extendidas', () => {
    const exercises = chordExercises(lesson, bundle)
    expect(exercises).toHaveLength(12)

    const roots = new Set(
      exercises.map((exercise) => pitchClass(fromSpelledPitch(exercise.root))),
    )
    expect(roots.size).toBe(12)

    const qualities = new Set(exercises.map((exercise) => exercise.quality))
    expect([...qualities].sort()).toEqual(
      [
        'major9',
        'dominant9',
        'minor9',
        'major11',
        'dominant11',
        'minor11',
        'major13',
        'dominant13',
        'minor13',
      ].sort(),
    )

    const asks = exercises.reduce<Record<string, number>>((counts, exercise) => {
      counts[exercise.ask] = (counts[exercise.ask] ?? 0) + 1
      return counts
    }, {})
    expect(asks).toEqual({ notes: 6, symbol: 6 })

    const difficulties = exercises
      .map((exercise) => exercise.difficulty)
      .sort((first, second) => first - second)
    expect(difficulties[0]).toBeGreaterThanOrEqual(4)
    expect(difficulties.at(-1)).toBe(5)
  })

  it('mantiene la tarea de teclado sobre los cuatro acordes', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.checklistEs).toHaveLength(3)
    expect(task?.checklistEn).toHaveLength(3)
    expect(eventMidis(task!.demoScore!)).toEqual([
      [64, 67, 71, 72, 74],
      [72, 74, 76, 77, 81],
      [77, 79, 81, 83, 84, 86],
      [72, 75, 79, 80, 82, 85, 89],
    ])

    const demoKeys = new Set(
      task!.demoScore!.events.flatMap((event) =>
        event.pitches.map((pitch) => formatPitch(fromSpelledPitch(pitch))),
      ),
    )
    for (const key of task!.keys) {
      const label = formatPitch(fromSpelledPitch(key))
      expect(demoKeys.has(label), label).toBe(true)
    }
  })
})
