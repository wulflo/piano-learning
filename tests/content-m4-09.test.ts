import { beforeAll, describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { validateContentBundle } from '../src/content/validate'
import {
  isExerciseAnswerCorrect,
  resolveExerciseAnswer,
} from '../src/exercises/answer'
import {
  chordSymbol,
  chordWithInversion,
  convertChordNotation,
  formatPitch,
  formatPitchEs,
  fromSpelledPitch,
  midiOf,
  parseChordSymbol,
} from '../src/theory'
import type { ChordQuality } from '../src/theory'
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

function notesEs(exercise: ChordExercise): string {
  return chordWithInversion(
    fromSpelledPitch(exercise.root),
    exercise.quality,
    exercise.inversion,
  )
    .map((pitch) => formatPitchEs(pitch))
    .join(' ')
}

function notesEn(exercise: ChordExercise): string {
  return chordWithInversion(
    fromSpelledPitch(exercise.root),
    exercise.quality,
    exercise.inversion,
  )
    .map((pitch) => formatPitch(pitch).replace(/\d+$/, ''))
    .join(' ')
}

function symbolEs(exercise: ChordExercise): string {
  return chordSymbol(fromSpelledPitch(exercise.root), exercise.quality, {
    notation: 'do',
  })
}

function symbolEn(exercise: ChordExercise): string {
  return chordSymbol(fromSpelledPitch(exercise.root), exercise.quality, {
    notation: 'c',
  })
}

function eventMidis(score: Score): number[][] {
  return score.events.map((event) =>
    event.pitches.map((pitch) => midiOf(fromSpelledPitch(pitch))),
  )
}

let bundle: ContentBundle
let lesson: Lesson

beforeAll(async () => {
  const result = validateContentBundle(await loadContentFromDisk())
  expect(result.ok).toBe(true)
  if (!result.bundle) throw new Error('El contenido del repositorio no es válido')
  bundle = result.bundle
  const found = bundle.lessons.find((item) => item.id === 'lesson.m4-09')
  if (!found) throw new Error('Falta la lección M4-09')
  lesson = found
})

describe('M4-09 — Del cifrado a las notas y de las notas al cifrado', () => {
  it('está publicada, validada y depende de M4-08', () => {
    expect(lesson.moduleId).toBe('M4')
    expect(lesson.status).toBe('published')
    expect(lesson.prerequisites).toContain('lesson.m4-08')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
    expect(lesson.skillIds).toContain('skill.chord-symbol')
  })

  it('explica los dos sentidos, las tríadas y las séptimas', () => {
    const text = lesson.sections
      .map((section) => `${section.titleEs} ${section.bodyEs ?? ''}`)
      .join(' ')
      .toLowerCase()

    for (const term of [
      'cifrado',
      'fundamental',
      'sufijo',
      'tríada',
      'séptima',
      'ida y vuelta',
      'latino',
      'americano',
      'maj7',
      'm7♭5',
    ]) {
      expect(text, `Falta el concepto: ${term}`).toContain(term)
    }
  })

  it('incluye una demo de cuatro acordes que se pueden leer en los dos sentidos', () => {
    const scores = scoreSections(lesson)
    expect(scores).toHaveLength(1)

    const demo = scores[0]
    if (!demo) throw new Error('Falta la demo de M4-09')

    expect(demo.events).toHaveLength(4)
    expect(demo.events.map((event) => event.measure)).toEqual([1, 2, 3, 4])
    expect(eventMidis(demo)).toEqual([
      [60, 64, 67],
      [62, 65, 69],
      [58, 62, 65, 69],
      [57, 61, 64, 67],
    ])

    const qualities: ChordQuality[] = ['major', 'minor', 'major7', 'dominant7']
    const symbols = demo.events.map((event, index) => {
      const root = event.pitches[0]
      if (!root) throw new Error(`Acorde sin fundamental en ${event.id}`)
      const quality = qualities[index]
      if (!quality) throw new Error(`Falta la calidad del evento ${event.id}`)
      return chordSymbol(fromSpelledPitch(root), quality, { notation: 'c' })
    })

    expect(symbols).toEqual(['C', 'Dm', 'B♭maj7', 'A7'])
  })

  it('plantea doce ejercicios de ida y vuelta en los dos sentidos', () => {
    const exercises = chordExercises(lesson, bundle)

    expect(exercises).toHaveLength(12)
    expect(exercises.map((exercise) => exercise.id)).toEqual([
      'ex.m4-09.a',
      'ex.m4-09.b',
      'ex.m4-09.c',
      'ex.m4-09.d',
      'ex.m4-09.e',
      'ex.m4-09.f',
      'ex.m4-09.g',
      'ex.m4-09.h',
      'ex.m4-09.i',
      'ex.m4-09.j',
      'ex.m4-09.k',
      'ex.m4-09.l',
    ])

    const fromSymbol = exercises.filter((exercise) => exercise.ask === 'notes')
    const toSymbol = exercises.filter((exercise) => exercise.ask === 'symbol')

    expect(fromSymbol).toHaveLength(6)
    expect(toSymbol).toHaveLength(6)

    for (const exercise of toSymbol) {
      expect(exercise.choices, `${exercise.id} sin opciones`).toBeDefined()
      expect(exercise.choicesEn, `${exercise.id} sin opciones en inglés`).toHaveLength(
        exercise.choices?.length ?? 0,
      )
    }
  })

  it('resuelve el cifrado y las notas en español y en inglés', () => {
    for (const exercise of chordExercises(lesson, bundle)) {
      const spanish = resolveExerciseAnswer(exercise, 'es')
      const english = resolveExerciseAnswer(exercise, 'en')

      if (exercise.ask === 'notes') {
        expect(spanish.mode, exercise.id).toBe('text')
        expect(english.mode, exercise.id).toBe('text')
        if (spanish.mode === 'text') {
          expect(spanish.answer, `${exercise.id} notas en español`).toBe(
            notesEs(exercise),
          )
          expect(spanish.accepted, `${exercise.id} acepta inglés`).toContain(
            notesEn(exercise),
          )
        }
        expect(isExerciseAnswerCorrect(exercise, notesEs(exercise), 'es')).toBe(true)
        expect(isExerciseAnswerCorrect(exercise, notesEn(exercise), 'en')).toBe(true)
      } else {
        expect(spanish.mode, exercise.id).toBe('choice')
        expect(english.mode, exercise.id).toBe('choice')
        if (spanish.mode === 'choice') {
          expect(spanish.answer, `${exercise.id} cifrado latino`).toBe(
            symbolEs(exercise),
          )
        }
        if (english.mode === 'choice') {
          expect(english.answer, `${exercise.id} cifrado americano`).toBe(
            symbolEn(exercise),
          )
        }
        expect(isExerciseAnswerCorrect(exercise, symbolEs(exercise), 'es')).toBe(true)
        expect(isExerciseAnswerCorrect(exercise, symbolEn(exercise), 'en')).toBe(true)
      }
    }
  })

  it('hace ida y vuelta entre cifrado, notas y cifrado', () => {
    for (const exercise of chordExercises(lesson, bundle)) {
      const root = fromSpelledPitch(exercise.root)
      const notes = chordWithInversion(root, exercise.quality, exercise.inversion)
      const latin = symbolEs(exercise)
      const american = symbolEn(exercise)

      // Cifrado latino ↔ americano.
      expect(convertChordNotation(latin, 'c'), `${exercise.id} a americano`).toBe(
        american,
      )
      expect(convertChordNotation(american, 'do'), `${exercise.id} a latino`).toBe(
        latin,
      )

      // Cifrado → notas: el parser recupera la fundamental y la calidad.
      for (const symbol of [latin, american]) {
        const parsed = parseChordSymbol(symbol)
        expect(parsed.quality, `${exercise.id} calidad de ${symbol}`).toBe(
          exercise.quality,
        )
        expect(parsed.root.step, `${exercise.id} letra de ${symbol}`).toBe(
          root.step,
        )
        expect(parsed.root.accidental, `${exercise.id} alteración de ${symbol}`).toBe(
          root.accidental,
        )

        const rebuilt = chordWithInversion(parsed.root, parsed.quality, 0)
        expect(
          rebuilt.map((pitch) => midiOf(pitch)),
          `${exercise.id} notas de ${symbol}`,
        ).toEqual(notes.map((pitch) => midiOf(pitch)))
      }

      // Notas → cifrado → notas: el símbolo generado vuelve a las mismas notas.
      expect(notesEs(exercise), `${exercise.id} notas en español`).toBe(
        notes.map((pitch) => formatPitchEs(pitch)).join(' '),
      )
      expect(notesEn(exercise), `${exercise.id} notas en inglés`).toBe(
        notes.map((pitch) => formatPitch(pitch).replace(/\d+$/, '')).join(' '),
      )
    }

    // El motor acepta las dos grafías de la semidisminuida.
    expect(parseChordSymbol('Fa♯m7♭5').quality).toBe('half-diminished7')
    expect(parseChordSymbol('F♯m7b5').quality).toBe('half-diminished7')
  })

  it('cubre las doce tónicas con tríadas y séptimas', () => {
    const exercises = chordExercises(lesson, bundle)
    const pitchClasses = new Set<number>()
    const qualities = new Set<ChordQuality>()

    for (const exercise of exercises) {
      const root = fromSpelledPitch(exercise.root)
      pitchClasses.add(((midiOf(root) % 12) + 12) % 12)
      qualities.add(exercise.quality)
    }

    expect(pitchClasses.size).toBe(12)
    expect([...qualities].sort()).toEqual([
      'augmented',
      'diminished7',
      'dominant7',
      'half-diminished7',
      'major',
      'major7',
      'minor',
      'minor7',
    ])

    expect(exercises.some((exercise) => exercise.quality === 'major')).toBe(true)
    expect(
      exercises.some((exercise) => exercise.quality === 'major7'),
    ).toBe(true)
  })

  it('incluye una tarea de teclado con los acordes de la demo', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.tempoBpm).toBe(60)
    expect(task?.keys.length).toBeGreaterThanOrEqual(7)
    expect(task?.checklistEs.length).toBeGreaterThanOrEqual(3)
    expect(task?.checklistEn).toHaveLength(task?.checklistEs.length ?? 0)
    expect(task?.demoScore).toBeDefined()

    const instructions = task?.instructionsEs.toLowerCase() ?? ''
    expect(instructions).toContain('do = c')
    expect(instructions).toContain('rem = dm')
    expect(instructions).toContain('si♭maj7 = b♭maj7')

    const demo = task?.demoScore
    expect(demo?.events).toHaveLength(4)
    expect(eventMidis(demo as Score)).toEqual([
      [60, 64, 67],
      [62, 65, 69],
      [58, 62, 65, 69],
      [57, 61, 64, 67],
    ])
  })
})
