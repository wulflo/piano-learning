import { describe, expect, it } from 'vitest'
import { ExerciseSchema } from '../src/schemas/content'
import {
  SIGHT_READING_MAX_STEP,
  SIGHT_READING_MOTION_LABELS,
  buildSightReadingFragment,
  sightReadingInterval,
  sightReadingIntervalName,
  sightReadingMotion,
  sightReadingMotionLabel,
  sightReadingNoteName,
  sightReadingNotes,
  sightReadingScaleIndex,
} from '../src/exercises/sight-reading'
import {
  SIGHT_READING_STEP_PATTERNS,
  generateSightReadingExercise,
  generateSightReadingExercises,
} from '../src/exercises/generators/sight-reading'
import { resolveExerciseAnswer } from '../src/exercises/answer'

const C4 = { step: 'C', accidental: 0, octave: 4 } as const

describe('lectura a primera vista — fragmentos por intervalos', () => {
  it('construye un fragmento de negras en 4/4 con las notas de la escala', () => {
    const score = buildSightReadingFragment({
      key: 'C',
      clef: 'treble',
      start: C4,
      steps: [1, 1, 2, -1],
      difficulty: 2,
      idPrefix: 'test.fragmento',
    })

    expect(score.key).toBe('C')
    expect(score.clef).toBe('treble')
    expect(score.timeSignature).toEqual({ numerator: 4, denominator: 4 })
    expect(score.events).toHaveLength(5)
    expect(
      score.events.every(
        (event) =>
          event.hand === 'right' &&
          event.value.duration === 'quarter' &&
          event.pitches.length === 1,
      ),
    ).toBe(true)
    expect(score.events.map((event) => event.measure)).toEqual([
      1, 1, 1, 1, 2,
    ])
    expect(score.events.map((event) => event.beat)).toEqual([0, 1, 2, 3, 0])

    const notes = sightReadingNotes(score)
    expect(
      notes.map((_, index) => sightReadingNoteName(score, index, 'es')),
    ).toEqual(['Do4', 'Re4', 'Mi4', 'Sol4', 'Fa4'])
  })

  it('usa la clave de fa y la mano izquierda en los fragmentos graves', () => {
    const score = buildSightReadingFragment({
      key: 'F',
      clef: 'bass',
      start: { step: 'F', accidental: 0, octave: 2 },
      steps: [1, -1],
      difficulty: 1,
      idPrefix: 'test.bajo',
    })
    expect(score.events.every((event) => event.hand === 'left')).toBe(true)
    expect(score.events.map((event) => event.pitches[0]?.octave)).toEqual([
      2, 2, 2,
    ])
  })

  it('rechaza notas fuera de la escala, saltos excesivos y dificultades inválidas', () => {
    expect(() =>
      buildSightReadingFragment({
        key: 'C',
        clef: 'treble',
        start: { step: 'C', accidental: 1, octave: 4 },
        steps: [1],
        difficulty: 1,
        idPrefix: 'test.malo',
      }),
    ).toThrow(/no pertenece/)

    expect(() =>
      buildSightReadingFragment({
        key: 'C',
        clef: 'treble',
        start: C4,
        steps: [2],
        difficulty: 1,
        idPrefix: 'test.malo',
      }),
    ).toThrow(/salto máximo/)

    expect(() =>
      buildSightReadingFragment({
        key: 'C',
        clef: 'treble',
        start: C4,
        steps: [1],
        difficulty: 9 as never,
        idPrefix: 'test.malo',
      }),
    ).toThrow(/Dificultad/)
  })

  it('mide intervalos, movimientos y notas con y sin octava', () => {
    const score = buildSightReadingFragment({
      key: 'C',
      clef: 'treble',
      start: C4,
      steps: [1, -1, 2, -1, 0],
      difficulty: 2,
      idPrefix: 'test.lectura',
    })

    expect(sightReadingScaleIndex('C', C4)).toBe(0)
    expect(sightReadingInterval(score, 0, 1)?.nameEs).toBe('segunda mayor')
    expect(sightReadingInterval(score, 0, 3)?.nameEs).toBe('tercera mayor')
    expect(sightReadingIntervalName(score, 0, 3, 'en')).toBe('major third')
    expect(sightReadingInterval(score, 9, 10)).toBeNull()

    expect(sightReadingMotion(score, 0, 1)).toBe('step-up')
    expect(sightReadingMotion(score, 1, 2)).toBe('step-down')
    expect(sightReadingMotion(score, 2, 3)).toBe('leap-up')
    expect(sightReadingMotion(score, 4, 5)).toBe('repeat')
    expect(sightReadingMotion(score, 9, 10)).toBeNull()

    expect(sightReadingNoteName(score, 0, 'es')).toBe('Do4')
    expect(sightReadingNoteName(score, 0, 'en')).toBe('C4')
    expect(sightReadingNoteName(score, 42, 'es')).toBeNull()
    expect(sightReadingMotionLabel(score, 0, 3, 'es')).toBe('Sube por salto')
    expect(sightReadingMotionLabel(score, 0, 3, 'en')).toBe('Moves up by leap')
  })

  it('genera las tres preguntas con opciones paralelas y respuesta canónica', () => {
    for (const ask of ['interval', 'note', 'motion'] as const) {
      const exercise = generateSightReadingExercise({
        id: `test.${ask}`,
        skillId: 'skill.sight-reading',
        ask,
        difficulty: 2,
        key: 'C',
        clef: 'treble',
        start: C4,
        steps: [1, 2, -1],
        from: 0,
        to: ask === 'interval' ? 1 : 3,
        tempoBpm: 60,
      })

      expect(exercise.type).toBe('sight-reading')
      expect(ExerciseSchema.safeParse(exercise).success).toBe(true)
      expect(exercise.choices.length).toBe(exercise.choicesEn.length)
      expect(exercise.choices.length).toBeGreaterThanOrEqual(3)

      const spanish = resolveExerciseAnswer(exercise, 'es')
      const english = resolveExerciseAnswer(exercise, 'en')
      expect(spanish.mode).toBe('choice')
      expect(english.mode).toBe('choice')
      if (spanish.mode === 'practice' || english.mode === 'practice') continue
      expect(exercise.choices).toContain(spanish.answer)
      expect(exercise.choicesEn).toContain(english.answer)
      expect(exercise.choices.indexOf(spanish.answer)).toBe(
        exercise.choicesEn.indexOf(english.answer),
      )
      expect(exercise.promptEs.length).toBeGreaterThan(20)
      expect(exercise.promptEn.length).toBeGreaterThan(20)
      expect(exercise.explanationEs.length).toBeGreaterThan(40)
      expect(exercise.explanationEn.length).toBeGreaterThan(40)
    }
  })

  it('rechaza índices fuera del fragmento y preguntas sin dos notas', () => {
    expect(() =>
      generateSightReadingExercise({
        id: 'test.fuera',
        skillId: 'skill.sight-reading',
        ask: 'interval',
        difficulty: 1,
        key: 'C',
        clef: 'treble',
        start: C4,
        steps: [1],
        from: 0,
        to: 9,
      }),
    ).toThrow(/índice|índices|inválido/i)

    expect(() =>
      generateSightReadingExercise({
        id: 'test.igual',
        skillId: 'skill.sight-reading',
        ask: 'interval',
        difficulty: 1,
        key: 'C',
        clef: 'treble',
        start: C4,
        steps: [1],
        from: 1,
        to: 1,
      }),
    ).toThrow(/inválido/i)
  })

  it('genera tandas graduadas alternando tonalidades, claves y preguntas', () => {
    const exercises = generateSightReadingExercises({
      skillId: 'skill.sight-reading',
      idPrefix: 'test.tanda',
      difficulty: 2,
      count: 12,
    })

    expect(exercises).toHaveLength(12)
    expect(new Set(exercises.map((exercise) => exercise.score.key)).size).toBe(
      12,
    )
    expect(new Set(exercises.map((exercise) => exercise.score.clef))).toEqual(
      new Set(['treble', 'bass']),
    )
    expect(new Set(exercises.map((exercise) => exercise.ask))).toEqual(
      new Set(['interval', 'note', 'motion']),
    )
    expect(
      exercises.every((exercise) =>
        ExerciseSchema.safeParse(exercise).success,
      ),
    ).toBe(true)
  })

  it('mantiene cada patrón dentro del salto máximo de su nivel', () => {
    for (const difficulty of [1, 2, 3, 4] as const) {
      const patterns = SIGHT_READING_STEP_PATTERNS[difficulty]
      expect(patterns.length).toBeGreaterThanOrEqual(3)
      for (const pattern of patterns) {
        expect(
          pattern.every(
            (step) => Math.abs(step) <= SIGHT_READING_MAX_STEP[difficulty],
          ),
          `nivel ${difficulty}: ${pattern.join(',')}`,
        ).toBe(true)
      }
    }
  })

  it('expone las cinco etiquetas de movimiento en los dos idiomas', () => {
    expect(Object.keys(SIGHT_READING_MOTION_LABELS)).toHaveLength(5)
    for (const label of Object.values(SIGHT_READING_MOTION_LABELS)) {
      expect(label.es.length).toBeGreaterThan(5)
      expect(label.en.length).toBeGreaterThan(5)
      expect(label.ruleEs.length).toBeGreaterThan(5)
      expect(label.ruleEn.length).toBeGreaterThan(5)
    }
  })
})
