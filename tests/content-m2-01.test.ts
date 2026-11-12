import { beforeAll, describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { validateContentBundle } from '../src/content/validate'
import {
  type ContentBundle,
  type DurationName,
  type Exercise,
  type Lesson,
  type Score,
} from '../src/schemas'

const DURATION_BEATS: Record<DurationName, number> = {
  whole: 4,
  half: 2,
  quarter: 1,
  eighth: 0.5,
  sixteenth: 0.25,
  'thirty-second': 0.125,
}

interface ExpectedSpelling {
  tonic: string
  spelling: string
}

const EXPECTED_SCALE_SPELLINGS: ExpectedSpelling[] = [
  { tonic: 'C', spelling: 'C D E F G A B C' },
  { tonic: 'G', spelling: 'G A B C D E F# G' },
  { tonic: 'D', spelling: 'D E F# G A B C# D' },
  { tonic: 'A', spelling: 'A B C# D E F# G# A' },
  { tonic: 'E', spelling: 'E F# G# A B C# D# E' },
  { tonic: 'B', spelling: 'B C# D# E F# G# A# B' },
  { tonic: 'F#', spelling: 'F# G# A# B C# D# E# F#' },
  { tonic: 'F', spelling: 'F G A Bb C D E F' },
  { tonic: 'Bb', spelling: 'Bb C D Eb F G A Bb' },
  { tonic: 'Eb', spelling: 'Eb F G Ab Bb C D Eb' },
  { tonic: 'Ab', spelling: 'Ab Bb C Db Eb F G Ab' },
  { tonic: 'Db', spelling: 'Db Eb F Gb Ab Bb C Db' },
]

function measureTotals(score: Score): Map<number, number> {
  const totals = new Map<number, number>()
  for (const event of score.events) {
    const beats = DURATION_BEATS[event.value.duration]
    totals.set(event.measure, (totals.get(event.measure) ?? 0) + beats)
  }
  return totals
}

function scoreSections(lesson: Lesson): Score[] {
  return lesson.sections
    .filter((section) => section.kind === 'score' && section.score)
    .map((section) => section.score as Score)
}

function lessonExercises(lesson: Lesson, bundle: ContentBundle): Exercise[] {
  return lesson.exerciseIds
    .map((id) => bundle.exercises.find((item) => item.id === id))
    .filter((exercise): exercise is Exercise => Boolean(exercise))
}

let bundle: ContentBundle
let lesson: Lesson

beforeAll(async () => {
  const result = validateContentBundle(await loadContentFromDisk())
  expect(result.ok).toBe(true)
  if (!result.bundle) throw new Error('El contenido del repositorio no es válido')
  bundle = result.bundle
  const found = bundle.lessons.find((item) => item.id === 'lesson.m2-01')
  if (!found) throw new Error('Falta la lección M2-01')
  lesson = found
})

describe('M2-01 — Escala mayor y armaduras', () => {
  it('está publicada, validada y depende de M1-12', () => {
    expect(lesson.moduleId).toBe('M2')
    expect(lesson.status).toBe('published')
    expect(lesson.prerequisites).toContain('lesson.m1-12')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
    expect(lesson.skillIds).toContain('skill.major-scale')
    expect(lesson.skillIds).toContain('skill.key-signature')
  })

  it('explica el patrón T-T-S-T-T-T-S, las doce escalas y las armaduras', () => {
    const text = lesson.sections
      .map((section) => `${section.titleEs} ${section.bodyEs ?? ''}`)
      .join(' ')
      .toLowerCase()

    expect(text).toContain('t-t-s-t-t-t-s')
    expect(text).toContain('armadura')
    expect(text).toContain('patrón')
    expect(text).toContain('sostenido')
    expect(text).toContain('bemol')
  })

  it('incluye la escala de Sol mayor con demo en pentagrama en 4/4', () => {
    const scores = scoreSections(lesson)
    expect(scores).toHaveLength(1)

    const score = scores[0]
    expect(score.key).toBe('G')
    expect(score.mode).toBe('major')
    expect(score.timeSignature).toEqual({ numerator: 4, denominator: 4 })
    expect(score.tempoBpm).toBe(80)
    expect([...measureTotals(score).values()]).toEqual([4, 4])

    const pitches = [...score.events]
      .sort((a, b) => a.measure - b.measure || a.beat - b.beat)
      .map((event) => event.pitches[0])
    expect(pitches).toHaveLength(8)
    expect(pitches[0].step).toBe('G')
    expect(pitches[6].step).toBe('F')
    expect(pitches[6].accidental).toBe('#')
    expect(pitches[6].octave).toBe(5)
  })

  it('incluye una tarea real de teclado con patrón y demo', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.tempoBpm).toBe(60)
    expect(task?.keys.length).toBeGreaterThanOrEqual(5)
    expect(task?.checklistEs.length).toBeGreaterThanOrEqual(3)

    const instructions = task?.instructionsEs.toLowerCase() ?? ''
    expect(instructions).toContain('t-t-s-t-t-t-s')
    expect(task?.demoScore).toBeDefined()
  })

  it('tiene 12 ejercicios de deletreo, uno por escala mayor', () => {
    const scaleExercises = lessonExercises(lesson, bundle).filter(
      (exercise) => exercise.type === 'scale-spelling',
    )

    expect(scaleExercises).toHaveLength(12)

    const tonics = scaleExercises.map((exercise) => exercise.tonic).sort()
    const expectedTonics = EXPECTED_SCALE_SPELLINGS.map((item) => item.tonic).sort()
    expect(tonics).toEqual(expectedTonics)

    for (const exercise of scaleExercises) {
      if (exercise.type !== 'scale-spelling') continue
      const expected = EXPECTED_SCALE_SPELLINGS.find(
        (item) => item.tonic === exercise.tonic,
      )
      expect(expected, `Falta la escala esperada: ${exercise.tonic}`).toBeDefined()
      expect(exercise.mode).toBe('major')
      expect(exercise.choices).toHaveLength(3)
      expect(exercise.choices).toContain(expected!.spelling)
    }
  })

  it('tarea y ejercicios referencian habilidades existentes', () => {
    const skillIds = new Set(bundle.skills.map((skill) => skill.id))
    const exerciseIds = new Set(bundle.exercises.map((exercise) => exercise.id))

    for (const skillId of lesson.skillIds) {
      expect(skillIds.has(skillId), `Habilidad inexistente: ${skillId}`).toBe(true)
    }
    for (const exerciseId of lesson.exerciseIds) {
      expect(exerciseIds.has(exerciseId), `Ejercicio inexistente: ${exerciseId}`).toBe(true)
    }
  })
})

describe('M2-01 — Ejercicios de armadura', () => {
  it('tiene tres ejercicios de armadura con sus respuestas en las opciones', () => {
    const keyExercises = lessonExercises(lesson, bundle).filter(
      (exercise) => exercise.type === 'key-signature',
    )

    expect(keyExercises).toHaveLength(3)

    const expectedByKey: Record<
      string,
      { answer: string; phrase: string }
    > = {
      G: {
        answer: '1 sola nota con sostenido (F#)',
        phrase: 'La escala de Sol mayor pide un sostenido en Fa',
      },
      Eb: { answer: '3 bemoles', phrase: 'La escala de Mi bemol mayor altera tres notas con bemol' },
      'F#': { answer: '6 sostenidos', phrase: 'La escala de Fa sostenido mayor pide seis sostenidos' },
    }

    for (const exercise of keyExercises) {
      if (exercise.type !== 'key-signature') continue
      const expected = expectedByKey[exercise.key]
      expect(expected, `Falta la armadura esperada: ${exercise.key}`).toBeDefined()
      expect(exercise.mode).toBe('major')
      expect(exercise.choices).toContain(expected.answer)
      expect(exercise.promptEs.length).toBeGreaterThan(5)
      expect(exercise.explanationEs).toContain(expected.phrase)
    }
  })
})
