import { beforeAll, describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { exerciseChoices } from '../src/content/localize'
import {
  attackingHandAt,
  rhythmicValueBeats,
  scoreForHand,
} from '../src/content/score'
import { validateContentBundle } from '../src/content/validate'
import { resolveExerciseAnswer } from '../src/exercises/answer'
import { HAND_LABELS, type AttackingHand } from '../src/exercises/hand-coordination'
import { fromSpelledPitch, midiOf } from '../src/theory'
import type { ContentBundle, Exercise, Lesson, Score } from '../src/schemas'

const EXPECTED_HANDS: Record<string, AttackingHand> = {
  'ex.m7-01.a': 'right',
  'ex.m7-01.b': 'left',
  'ex.m7-01.c': 'right',
  'ex.m7-01.d': 'left',
  'ex.m7-01.e': 'right',
  'ex.m7-01.f': 'left',
  'ex.m7-01.g': 'both',
  'ex.m7-01.h': 'left',
  'ex.m7-01.i': 'both',
  'ex.m7-01.j': 'both',
  'ex.m7-01.k': 'right',
  'ex.m7-01.l': 'both',
}

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

function handMidis(score: Score, hand: 'right' | 'left'): number[] {
  return scoreForHand(score, hand).events.flatMap((event) =>
    event.pitches.map((pitch) => midiOf(fromSpelledPitch(pitch))),
  )
}

function measureBeats(score: Score, hand: 'right' | 'left', measure: number): number {
  return scoreForHand(score, hand).events
    .filter((event) => event.measure === measure)
    .reduce((total, event) => total + rhythmicValueBeats(event.value), 0)
}

function allMeasures(score: Score): number[] {
  return [...new Set(score.events.map((event) => event.measure))].sort(
    (first, second) => first - second,
  )
}

let bundle: ContentBundle
let lesson: Lesson

beforeAll(async () => {
  const result = validateContentBundle(await loadContentFromDisk())
  expect(result.ok).toBe(true)
  if (!result.bundle) throw new Error('El contenido del repositorio no es válido')
  bundle = result.bundle
  const found = bundle.lessons.find((item) => item.id === 'lesson.m7-01')
  if (!found) throw new Error('Falta la lección M7-01')
  lesson = found
})

describe('M7-01 — Independencia de manos', () => {
  it('está publicada, validada y abre el módulo M7', () => {
    expect(lesson.moduleId).toBe('M7')
    expect(lesson.slug).toBe('independencia-de-manos')
    expect(lesson.status).toBe('published')
    expect(lesson.prerequisites).toContain('lesson.m6-06')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
    expect(lesson.objectivesEn).toHaveLength(lesson.objectivesEs.length)
    expect(lesson.skillIds).toEqual(['skill.hand-independence'])
    expect(lesson.exerciseIds).toHaveLength(12)
  })

  it('explica la independencia, el estudio lento y el cuidado de la tensión', () => {
    const text = lesson.sections
      .map((section) => `${section.titleEs} ${section.bodyEs ?? ''}`)
      .join(' ')
      .toLowerCase()

    for (const term of [
      'independencia',
      'mano derecha',
      'mano izquierda',
      'sostiene',
      'ataca',
      'pulso',
      'metrónomo',
      'tensión',
      'dolor',
      'hombros',
      'muñecas',
      'pausas',
    ]) {
      expect(text, `Falta el concepto: ${term}`).toContain(term)
    }

    const english = lesson.sections
      .map((section) => `${section.titleEn} ${section.bodyEn ?? ''}`)
      .join(' ')
      .toLowerCase()
    for (const term of [
      'hand independence',
      'right hand',
      'left hand',
      'holds',
      'attack',
      'beat',
      'metronome',
      'tension',
      'pain',
      'shoulders',
      'wrists',
      'breaks',
    ]) {
      expect(english, `Missing concept: ${term}`).toContain(term)
    }
  })

  it('incluye demos de sostener, alternar y atacar juntas', () => {
    const demos = scoreSections(lesson)
    expect(demos).toHaveLength(3)

    const byId = new Map(demos.map((demo) => [demo.sectionId, demo.score]))

    const hold = byId.get('sec.m7-01.demo-sostener')
    expect(hold).toBeDefined()
    if (hold) {
      expect(hold.events.filter((event) => event.hand === 'right')).toHaveLength(1)
      expect(hold.events.filter((event) => event.hand === 'left')).toHaveLength(4)
      expect(attackingHandAt(hold, 1, 1)).toBe('both')
      expect(attackingHandAt(hold, 1, 2)).toBe('left')
    }

    const alternate = byId.get('sec.m7-01.demo-alternar')
    expect(alternate).toBeDefined()
    if (alternate) {
      expect(alternate.events.map((event) => event.hand)).toEqual([
        'right',
        'left',
        'right',
        'left',
      ])
    }

    const together = byId.get('sec.m7-01.demo-juntas')
    expect(together).toBeDefined()
    if (together) {
      expect(attackingHandAt(together, 1, 1)).toBe('both')
      expect(attackingHandAt(together, 1, 2)).toBeNull()
      expect(attackingHandAt(together, 2, 1)).toBe('both')
    }

    for (const demo of demos) {
      expect(demo.score.clef, demo.sectionId).toBe('treble')
      expect(demo.score.key, demo.sectionId).toBe('C')
      expect(demo.score.mode, demo.sectionId).toBe('major')
      expect(handMidis(demo.score, 'right').length, demo.sectionId).toBeGreaterThan(0)
      expect(handMidis(demo.score, 'left').length, demo.sectionId).toBeGreaterThan(0)
      for (const measure of allMeasures(demo.score)) {
        const beats = demo.score.timeSignature.numerator
        for (const hand of ['right', 'left'] as const) {
          expect(
            measureBeats(demo.score, hand, measure),
            `${demo.sectionId} ${hand} c.${measure}`,
          ).toBeLessThanOrEqual(beats)
        }
      }
    }
  })

  it('planta doce ejercicios propios de coordinación con dificultad creciente', () => {
    const exercises = lessonExercises(lesson, bundle)
    expect(exercises).toHaveLength(12)
    expect(
      exercises.every((exercise) => exercise.type === 'hand-coordination'),
    ).toBe(true)

    const difficulties = exercises.map((exercise) => exercise.difficulty)
    expect(Math.min(...difficulties)).toBe(1)
    expect(Math.max(...difficulties)).toBe(3)
    expect(difficulties.filter((value) => value === 1)).toHaveLength(3)
    expect(difficulties.filter((value) => value === 2)).toHaveLength(5)
    expect(difficulties.filter((value) => value === 3)).toHaveLength(4)
  })

  it('cada ejercicio tiene un ataque real y una respuesta paralela ES/EN', () => {
    for (const exercise of lessonExercises(lesson, bundle)) {
      if (exercise.type !== 'hand-coordination') continue
      const expected = EXPECTED_HANDS[exercise.id]
      expect(expected, exercise.id).toBeDefined()
      if (expected === undefined) continue

      expect(exercise.skillId, exercise.id).toBe('skill.hand-independence')
      expect(exercise.measure, exercise.id).toBeGreaterThanOrEqual(1)
      expect(exercise.beat, exercise.id).toBeGreaterThanOrEqual(1)
      expect(exercise.beat, exercise.id).toBeLessThanOrEqual(
        exercise.score.timeSignature.numerator,
      )

      expect(
        attackingHandAt(exercise.score, exercise.measure, exercise.beat),
        exercise.id,
      ).toBe(expected)

      const spanish = resolveExerciseAnswer(exercise, 'es')
      const english = resolveExerciseAnswer(exercise, 'en')
      expect(spanish.mode, `${exercise.id} modo ES`).toBe('choice')
      expect(english.mode, `${exercise.id} modo EN`).toBe('choice')
      if (spanish.mode !== 'choice' || english.mode !== 'choice') continue

      expect(spanish.answer, `${exercise.id} respuesta ES`).toBe(
        HAND_LABELS[expected].es,
      )
      expect(english.answer, `${exercise.id} respuesta EN`).toBe(
        HAND_LABELS[expected].en,
      )
      const choicesEs = exerciseChoices(exercise, 'es') ?? []
      const choicesEn = exerciseChoices(exercise, 'en') ?? []
      expect(choicesEs, `${exercise.id} opciones ES`).toContain(spanish.answer)
      expect(choicesEn, `${exercise.id} opciones EN`).toContain(english.answer)
      expect(choicesEs, `${exercise.id} cantidad de opciones`).toHaveLength(3)
      expect(
        choicesEs.indexOf(spanish.answer),
        `${exercise.id} índice paralelo`,
      ).toBe(choicesEn.indexOf(english.answer))
    }
  })

  it('reparte las respuestas entre las dos manos y los ataques simultáneos', () => {
    const hands = lessonExercises(lesson, bundle).map((exercise) =>
      exercise.type === 'hand-coordination'
        ? attackingHandAt(exercise.score, exercise.measure, exercise.beat)
        : null,
    )
    expect(hands.filter((hand) => hand === 'right')).toHaveLength(4)
    expect(hands.filter((hand) => hand === 'left')).toHaveLength(4)
    expect(hands.filter((hand) => hand === 'both')).toHaveLength(4)
  })

  it('mantiene las dos manos en el registro cómodo y cada compás sin desborde', () => {
    for (const exercise of lessonExercises(lesson, bundle)) {
      if (exercise.type !== 'hand-coordination') continue
      const right = handMidis(exercise.score, 'right')
      const left = handMidis(exercise.score, 'left')
      expect(right.length, `${exercise.id} mano derecha`).toBeGreaterThan(0)
      expect(left.length, `${exercise.id} mano izquierda`).toBeGreaterThan(0)
      // Do4 = 60 y La5 = 81: dentro del pentagrama de clave de sol, sin
      // cruzar las manos ni pedir extensiones forzadas.
      for (const midi of [...right, ...left]) {
        expect(midi, exercise.id).toBeGreaterThanOrEqual(60)
        expect(midi, exercise.id).toBeLessThanOrEqual(81)
      }
      for (const measure of allMeasures(exercise.score)) {
        const beats = exercise.score.timeSignature.numerator
        for (const hand of ['right', 'left'] as const) {
          expect(
            measureBeats(exercise.score, hand, measure),
            `${exercise.id} ${hand} c.${measure}`,
          ).toBeLessThanOrEqual(beats)
        }
      }
    }
  })

  it('incluye una tarea de teclado real con cuidado de la tensión', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.tempoBpm).toBe(60)
    expect(task?.keys.length).toBeGreaterThanOrEqual(10)
    expect(task?.checklistEs.length).toBeGreaterThanOrEqual(3)
    expect(task?.checklistEn).toHaveLength(task?.checklistEs.length ?? 0)
    expect(task?.instructionsEs).toMatch(/dolor, tensión o cansancio/)
    expect(task?.instructionsEn).toMatch(/pain, tension or fatigue/)
    expect(task?.fingeringEs).toMatch(/hombros/)
    expect(task?.fingeringEn).toMatch(/shoulders/)

    const demo = task?.demoScore
    expect(demo).toBeDefined()
    if (!demo) throw new Error('Falta la demo de la tarea')
    expect(demo.key).toBe('C')
    expect(demo.mode).toBe('major')
    expect(attackingHandAt(demo, 1, 1)).toBe('both')
    expect(attackingHandAt(demo, 1, 2)).toBe('left')
    expect(attackingHandAt(demo, 2, 1)).toBe('both')
    expect(attackingHandAt(demo, 2, 2)).toBe('right')
  })

  it('registra la habilidad de coordinación como tarea de teclado', () => {
    const skill = bundle.skills.find(
      (item) => item.id === 'skill.hand-independence',
    )
    expect(skill).toBeDefined()
    expect(skill?.kind).toBe('keyboard-task')
    expect(skill?.lessonIds).toContain('lesson.m7-01')
    expect(skill?.labelEs.length).toBeGreaterThan(0)
    expect(skill?.labelEn.length).toBeGreaterThan(0)
    expect(skill?.params.patterns).toEqual([
      'alternating',
      'hold-and-move',
      'simultaneous',
    ])
  })
})
