import { beforeAll, describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { exerciseChoices } from '../src/content/localize'
import { rhythmicValueBeats } from '../src/content/score'
import { validateContentBundle } from '../src/content/validate'
import { resolveExerciseAnswer } from '../src/exercises/answer'
import { fromSpelledPitch, midiOf } from '../src/theory'
import type {
  ContentBundle,
  Exercise,
  Lesson,
  Score,
  SpelledPitch,
} from '../src/schemas'

const MOTION_LABELS = {
  parallel: { es: 'Movimiento paralelo', en: 'Parallel motion' },
  similar: { es: 'Movimiento similar', en: 'Similar motion' },
  contrary: { es: 'Movimiento contrario', en: 'Contrary motion' },
  oblique: { es: 'Movimiento oblicuo', en: 'Oblique motion' },
}

const PARALLEL_LABELS = {
  none: {
    es: 'No hay quintas ni octavas paralelas',
    en: 'No parallel fifths or octaves',
  },
  fifths: { es: 'Hay quintas paralelas', en: 'There are parallel fifths' },
  octaves: { es: 'Hay octavas paralelas', en: 'There are parallel octaves' },
}

interface MotionExpectation {
  ask: 'motion'
  motion: 'parallel' | 'similar' | 'contrary' | 'oblique'
  es: string
  en: string
}

interface ParallelExpectation {
  ask: 'parallels'
  parallels: 'none' | 'fifths' | 'octaves'
  es: string
  en: string
}

type Expectation = MotionExpectation | ParallelExpectation

const EXPECTED: Record<string, Expectation> = {
  'ex.m6-05.a': { ask: 'motion', motion: 'parallel', ...MOTION_LABELS.parallel },
  'ex.m6-05.b': { ask: 'motion', motion: 'parallel', ...MOTION_LABELS.parallel },
  'ex.m6-05.c': { ask: 'motion', motion: 'similar', ...MOTION_LABELS.similar },
  'ex.m6-05.d': { ask: 'motion', motion: 'similar', ...MOTION_LABELS.similar },
  'ex.m6-05.e': { ask: 'motion', motion: 'contrary', ...MOTION_LABELS.contrary },
  'ex.m6-05.f': { ask: 'motion', motion: 'contrary', ...MOTION_LABELS.contrary },
  'ex.m6-05.g': { ask: 'motion', motion: 'oblique', ...MOTION_LABELS.oblique },
  'ex.m6-05.h': { ask: 'motion', motion: 'oblique', ...MOTION_LABELS.oblique },
  'ex.m6-05.i': {
    ask: 'parallels',
    parallels: 'fifths',
    ...PARALLEL_LABELS.fifths,
  },
  'ex.m6-05.j': {
    ask: 'parallels',
    parallels: 'octaves',
    ...PARALLEL_LABELS.octaves,
  },
  'ex.m6-05.k': { ask: 'parallels', parallels: 'none', ...PARALLEL_LABELS.none },
  'ex.m6-05.l': { ask: 'parallels', parallels: 'none', ...PARALLEL_LABELS.none },
}

function scoreSections(lesson: Lesson): Array<{ sectionId: string; score: Score }> {
  return lesson.sections.flatMap((section) =>
    section.kind === 'score' && section.score
      ? [{ sectionId: section.id, score: section.score }]
      : [],
  )
}

function lessonExercises(lesson: Lesson, bundle: ContentBundle): Exercise[] {
  return lesson.exerciseIds
    .map((id) => bundle.exercises.find((item) => item.id === id))
    .filter((exercise): exercise is Exercise => Boolean(exercise))
}

function eventMidis(score: Score): number[][] {
  const measures = new Map<number, number[]>()
  for (const event of score.events) {
    const midis = measures.get(event.measure) ?? []
    midis.push(...event.pitches.map((pitch) => midiOf(fromSpelledPitch(pitch))))
    measures.set(event.measure, midis)
  }
  return [...measures.entries()]
    .sort(([first], [second]) => first - second)
    .map(([, midis]) => midis)
}

function measureBeats(score: Score, measure: number, voice: number): number {
  return score.events
    .filter((event) => event.measure === measure && event.voice === voice)
    .reduce((total, event) => total + rhythmicValueBeats(event.value), 0)
}

const STEP_INDEX: Record<string, number> = {
  C: 0,
  D: 1,
  E: 2,
  F: 3,
  G: 4,
  A: 5,
  B: 6,
}

interface VoicePoint {
  midi: number
  /** Posición diatónica: permite comparar intervalos genéricos (terceras, quintas). */
  diatonic: number
}

function voicePoint(pitch: SpelledPitch): VoicePoint {
  return {
    midi: midiOf(fromSpelledPitch(pitch)),
    diatonic: pitch.octave * 7 + (STEP_INDEX[pitch.step] ?? 0),
  }
}

function measureVoices(
  score: Score,
): Array<{ v1: VoicePoint; v2: VoicePoint }> {
  const measures = new Map<number, { v1?: VoicePoint; v2?: VoicePoint }>()
  for (const event of score.events) {
    const entry = measures.get(event.measure) ?? {}
    if (event.voice === 1 && event.pitches.length === 1) {
      entry.v1 = voicePoint(event.pitches[0])
    }
    if (event.voice === 2 && event.pitches.length === 1) {
      entry.v2 = voicePoint(event.pitches[0])
    }
    measures.set(event.measure, entry)
  }
  return [...measures.entries()]
    .sort(([first], [second]) => first - second)
    .map(([, entry]) => {
      if (entry.v1 === undefined || entry.v2 === undefined) {
        throw new Error('Falta una de las dos voces en el compás')
      }
      return { v1: entry.v1, v2: entry.v2 }
    })
}

/**
 * Clasifica el movimiento con la definición musical: dos voces van en paralelo
 * cuando avanzan en la misma dirección conservando el intervalo genérico, no
 * necesariamente la misma cantidad de semitonos (una tercera mayor y una menor
 * siguen siendo terceras).
 */
function classifyMotion(score: Score): string {
  const pairs = measureVoices(score)
  const labels = new Set<string>()
  for (let index = 1; index < pairs.length; index += 1) {
    const previous = pairs[index - 1]
    const current = pairs[index]
    const first = current.v1.midi - previous.v1.midi
    const second = current.v2.midi - previous.v2.midi
    const firstGeneric = current.v1.diatonic - previous.v1.diatonic
    const secondGeneric = current.v2.diatonic - previous.v2.diatonic
    if (first === 0 && second === 0) continue
    if (first === 0 || second === 0) {
      labels.add('oblique')
    } else if (Math.sign(first) !== Math.sign(second)) {
      labels.add('contrary')
    } else if (firstGeneric === secondGeneric) {
      labels.add('parallel')
    } else {
      labels.add('similar')
    }
  }
  expect(labels.size, 'El ejemplo mezcla movimientos').toBe(1)
  return [...labels][0] ?? ''
}

function parallelPerfect(score: Score): 'none' | 'fifths' | 'octaves' {
  const pairs = measureVoices(score)
  let fifths = false
  let octaves = false
  for (let index = 1; index < pairs.length; index += 1) {
    const previous = pairs[index - 1]
    const current = pairs[index]
    const first = current.v1.midi - previous.v1.midi
    const second = current.v2.midi - previous.v2.midi
    if (first === 0 || second === 0) continue
    if (Math.sign(first) !== Math.sign(second)) continue
    const before = Math.abs(previous.v1.midi - previous.v2.midi) % 12
    const after = Math.abs(current.v1.midi - current.v2.midi) % 12
    if (before === after && before === 7) fifths = true
    if (before === after && before === 0) octaves = true
  }
  if (fifths) return 'fifths'
  if (octaves) return 'octaves'
  return 'none'
}

let bundle: ContentBundle
let lesson: Lesson

beforeAll(async () => {
  const result = validateContentBundle(await loadContentFromDisk())
  expect(result.ok).toBe(true)
  if (!result.bundle) throw new Error('El contenido del repositorio no es válido')
  bundle = result.bundle
  const found = bundle.lessons.find((item) => item.id === 'lesson.m6-05')
  if (!found) throw new Error('Falta la lección M6-05')
  lesson = found
})

describe('M6-05 — Contrapunto básico', () => {
  it('está publicada, validada y depende de M6-04', () => {
    expect(lesson.moduleId).toBe('M6')
    expect(lesson.slug).toBe('contrapunto-basico')
    expect(lesson.status).toBe('published')
    expect(lesson.prerequisites).toContain('lesson.m6-04')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
    expect(lesson.objectivesEn).toHaveLength(lesson.objectivesEs.length)
    expect(lesson.skillIds).toEqual(['skill.counterpoint'])
    expect(lesson.exerciseIds).toHaveLength(12)
  })

  it('explica el movimiento de voces y las reglas simples', () => {
    const text = lesson.sections
      .map((section) => `${section.titleEs} ${section.bodyEs ?? ''}`)
      .join(' ')
      .toLowerCase()

    for (const term of [
      'contrapunto',
      'voces independientes',
      'movimiento paralelo',
      'movimiento similar',
      'movimiento contrario',
      'movimiento oblicuo',
      'quintas',
      'octavas paralelas',
      'consonancias',
      'disonancias',
      'palestrina',
      'bach',
    ]) {
      expect(text, `Falta el concepto: ${term}`).toContain(term)
    }

    const english = lesson.sections
      .map((section) => `${section.titleEn} ${section.bodyEn ?? ''}`)
      .join(' ')
      .toLowerCase()
    for (const term of [
      'counterpoint',
      'independent',
      'parallel motion',
      'similar motion',
      'contrary motion',
      'oblique motion',
      'parallel fifths',
      'parallel octaves',
      'consonances',
      'dissonances',
      'palestrina',
      'bach',
    ]) {
      expect(english, `Missing concept: ${term}`).toContain(term)
    }
  })

  it('incluye un ejemplo a dos voces y otro con quintas paralelas', () => {
    const demos = scoreSections(lesson)
    expect(demos).toHaveLength(2)

    const expected: Record<string, number[][]> = {
      'sec.m6-05.demo-contrapunto': [
        [76, 72, 60, 64],
        [74, 71, 65, 67],
        [72, 69, 69, 65],
        [67, 69, 64, 62],
        [71, 67, 67, 65],
        [72, 60],
      ],
      'sec.m6-05.demo-quintas': [
        [60, 67],
        [62, 69],
        [64, 71],
        [65, 72],
      ],
    }

    for (const demo of demos) {
      expect(demo.score.key, demo.sectionId).toBe('C')
      expect(demo.score.mode, demo.sectionId).toBe('major')
      expect(eventMidis(demo.score), demo.sectionId).toEqual(
        expected[demo.sectionId],
      )
      const voices = new Set(demo.score.events.map((event) => event.voice))
      expect(voices.size, demo.sectionId).toBe(2)
      for (const voice of voices) {
        const measures = new Set(
          demo.score.events
            .filter((event) => event.voice === voice)
            .map((event) => event.measure),
        )
        for (const measure of measures) {
          expect(
            measureBeats(demo.score, measure, voice),
            `${demo.sectionId} v.${voice} c.${measure}`,
          ).toBe(demo.score.timeSignature.numerator)
        }
      }
    }

    const counterpoint = demos.find(
      (demo) => demo.sectionId === 'sec.m6-05.demo-contrapunto',
    )
    expect(counterpoint).toBeDefined()
    if (counterpoint) {
      expect(parallelPerfect(counterpoint.score)).toBe('none')
    }
    const fifths = demos.find(
      (demo) => demo.sectionId === 'sec.m6-05.demo-quintas',
    )
    expect(fifths).toBeDefined()
    if (fifths) {
      expect(parallelPerfect(fifths.score)).toBe('fifths')
    }
  })

  it('planta doce ejercicios de análisis de contrapunto', () => {
    const exercises = lessonExercises(lesson, bundle)
    expect(exercises).toHaveLength(12)
    expect(
      exercises.every(
        (exercise) => exercise.type === 'counterpoint-analysis',
      ),
    ).toBe(true)

    const byId = new Map(exercises.map((exercise) => [exercise.id, exercise]))
    for (const [id, expected] of Object.entries(EXPECTED)) {
      const exercise = byId.get(id)
      expect(exercise, id).toBeDefined()
      if (!exercise || exercise.type !== 'counterpoint-analysis') continue

      expect(exercise.ask, id).toBe(expected.ask)
      expect(exercise.skillId, id).toBe('skill.counterpoint')
      if (expected.ask === 'motion') {
        expect(exercise.motion, id).toBe(expected.motion)
      } else {
        expect(exercise.parallels, id).toBe(expected.parallels)
      }

      const spanish = resolveExerciseAnswer(exercise, 'es')
      const english = resolveExerciseAnswer(exercise, 'en')
      expect(spanish.mode, `${id} modo ES`).toBe('choice')
      expect(english.mode, `${id} modo EN`).toBe('choice')
      if (spanish.mode !== 'choice' || english.mode !== 'choice') continue

      expect(spanish.answer, `${id} respuesta ES`).toBe(expected.es)
      expect(english.answer, `${id} respuesta EN`).toBe(expected.en)

      const choicesEs = exerciseChoices(exercise, 'es')
      const choicesEn = exerciseChoices(exercise, 'en')
      expect(choicesEs ?? [], `${id} opciones ES`).toContain(spanish.answer)
      expect(choicesEn ?? [], `${id} opciones EN`).toContain(english.answer)
      expect(choicesEs ?? [], `${id} cantidad de opciones`).toHaveLength(
        expected.ask === 'motion' ? 4 : 3,
      )
      expect(
        (choicesEs ?? []).indexOf(spanish.answer),
        `${id} índice de la respuesta`,
      ).toBe((choicesEn ?? []).indexOf(english.answer))
    }
  })

  it('coincide con el movimiento y las paralelas que muestra la partitura', () => {
    const exercises = lessonExercises(lesson, bundle).filter(
      (exercise) => exercise.type === 'counterpoint-analysis',
    )

    for (const exercise of exercises) {
      if (exercise.type !== 'counterpoint-analysis') continue
      const voices = new Set(exercise.score.events.map((event) => event.voice))
      expect(voices.size, `${exercise.id} voces`).toBe(2)

      const measures = new Set(
        exercise.score.events.map((event) => event.measure),
      )
      for (const measure of measures) {
        expect(
          measureBeats(exercise.score, measure, 1),
          `${exercise.id} v.1 c.${measure}`,
        ).toBe(exercise.score.timeSignature.numerator)
        expect(
          measureBeats(exercise.score, measure, 2),
          `${exercise.id} v.2 c.${measure}`,
        ).toBe(exercise.score.timeSignature.numerator)
      }

      expect(classifyMotion(exercise.score), `${exercise.id} movimiento`).toBe(
        exercise.motion,
      )
      if (exercise.ask === 'parallels') {
        expect(
          parallelPerfect(exercise.score),
          `${exercise.id} quintas y octavas`,
        ).toBe(exercise.parallels ?? 'none')
      }
    }
  })

  it('reparte las preguntas entre movimientos y reglas', () => {
    const exercises = lessonExercises(lesson, bundle).filter(
      (exercise) => exercise.type === 'counterpoint-analysis',
    )
    const motions = exercises.filter(
      (exercise) =>
        exercise.type === 'counterpoint-analysis' && exercise.ask === 'motion',
    )
    const rules = exercises.filter(
      (exercise) =>
        exercise.type === 'counterpoint-analysis' &&
        exercise.ask === 'parallels',
    )
    expect(motions).toHaveLength(8)
    expect(rules).toHaveLength(4)
    expect(
      motions.map((exercise) =>
        exercise.type === 'counterpoint-analysis' ? exercise.motion : null,
      ),
    ).toEqual([
      'parallel',
      'parallel',
      'similar',
      'similar',
      'contrary',
      'contrary',
      'oblique',
      'oblique',
    ])
    expect(
      rules.map((exercise) =>
        exercise.type === 'counterpoint-analysis' ? exercise.parallels : null,
      ),
    ).toEqual(['fifths', 'octaves', 'none', 'none'])
  })

  it('incluye una tarea de teclado sobre las dos voces', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.tempoBpm).toBe(80)
    expect(task?.keys.length).toBeGreaterThanOrEqual(12)
    expect(task?.checklistEs.length).toBeGreaterThanOrEqual(3)
    expect(task?.checklistEn).toHaveLength(task?.checklistEs.length ?? 0)
    expect(task?.instructionsEs).toMatch(/cantá la voz inferior/)
    expect(task?.instructionsEn).toMatch(/sing the lower voice/)

    const demo = task?.demoScore
    expect(demo).toBeDefined()
    if (!demo) throw new Error('Falta la demo de la tarea')
    expect(demo.key).toBe('C')
    expect(demo.mode).toBe('major')
    expect(eventMidis(demo)).toEqual([
      [76, 72, 60, 64],
      [74, 71, 65, 67],
      [72, 69, 69, 65],
      [67, 69, 64, 62],
      [71, 67, 67, 65],
      [72, 60],
    ])
  })

  it('registra la habilidad de contrapunto', () => {
    const skill = bundle.skills.find((item) => item.id === 'skill.counterpoint')
    expect(skill).toBeDefined()
    expect(skill?.kind).toBe('counterpoint')
    expect(skill?.lessonIds).toContain('lesson.m6-05')
    expect(skill?.labelEs.length).toBeGreaterThan(0)
    expect(skill?.labelEn.length).toBeGreaterThan(0)
    expect(skill?.params.topics).toEqual([
      'voice-motion',
      'parallel-fifths',
      'parallel-octaves',
    ])
  })
})
