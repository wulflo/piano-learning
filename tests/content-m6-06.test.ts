import { beforeAll, describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { exerciseChoices } from '../src/content/localize'
import { rhythmicValueBeats } from '../src/content/score'
import { validateContentBundle } from '../src/content/validate'
import { resolveExerciseAnswer } from '../src/exercises/answer'
import { fromSpelledPitch, midiOf } from '../src/theory'
import type { ContentBundle, Exercise, Lesson, Score } from '../src/schemas'

const LABELS = {
  trill: {
    es: 'Trino: alternar la nota principal con la superior',
    en: 'Trill: alternate the main note with the upper note',
  },
  mordent: {
    es: 'Mordente: bajar a la inferior y volver a la principal',
    en: 'Mordent: drop to the lower note and return to the main note',
  },
  turn: {
    es: 'Grupeto: superior, principal, inferior y principal',
    en: 'Turn: upper, main, lower, main',
  },
  appoggiatura: {
    es: 'Apoyatura: apoyarse en la vecina antes de la principal',
    en: 'Appoggiatura: lean on the neighbour before the main note',
  },
} as const

const EXPECTED: Record<string, keyof typeof LABELS> = {
  'ex.m6-06.a': 'trill',
  'ex.m6-06.b': 'trill',
  'ex.m6-06.c': 'trill',
  'ex.m6-06.d': 'mordent',
  'ex.m6-06.e': 'mordent',
  'ex.m6-06.f': 'mordent',
  'ex.m6-06.g': 'turn',
  'ex.m6-06.h': 'turn',
  'ex.m6-06.i': 'turn',
  'ex.m6-06.j': 'appoggiatura',
  'ex.m6-06.k': 'appoggiatura',
  'ex.m6-06.l': 'appoggiatura',
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

function measureBeats(score: Score, measure: number): number {
  return score.events
    .filter((event) => event.measure === measure)
    .reduce((total, event) => total + rhythmicValueBeats(event.value), 0)
}

function firstMeasureMidis(score: Score): number[] {
  return score.events
    .filter((event) => event.measure === 1)
    .flatMap((event) =>
      event.pitches.map((pitch) => midiOf(fromSpelledPitch(pitch))),
    )
}

/**
 * Reconoce el adorno a partir de su realización en el primer compás. Así el
 * test comprueba que lo declarado coincide con lo que realmente suena.
 */
function classifyOrnament(score: Score): keyof typeof LABELS {
  const midis = firstMeasureMidis(score)
  if (midis.length === 2) return 'appoggiatura'
  if (midis.length === 3) {
    const [first, second, third] = midis
    expect(second, 'El mordente baja una sola vez').toBeLessThan(first)
    expect(third, 'El mordente vuelve a la principal').toBe(first)
    return 'mordent'
  }
  if (midis.length === 4) {
    const [upper, main, lower, back] = midis
    expect(upper, 'El grupeto empieza en la superior').toBeGreaterThan(main)
    expect(lower, 'El grupeto baja a la inferior').toBeLessThan(main)
    expect(back, 'El grupeto vuelve a la principal').toBe(main)
    return 'turn'
  }
  const distinct = new Set(midis)
  expect(distinct.size, 'El trino alterna dos notas').toBe(2)
  const [first, second] = [...distinct]
  expect(Math.abs(first - second), 'El trino alterna con la superior').toBeGreaterThan(
    0,
  )
  expect(midis.length, 'El trino repite la alternancia').toBeGreaterThanOrEqual(6)
  return 'trill'
}

let bundle: ContentBundle
let lesson: Lesson

beforeAll(async () => {
  const result = validateContentBundle(await loadContentFromDisk())
  expect(result.ok).toBe(true)
  if (!result.bundle) throw new Error('El contenido del repositorio no es válido')
  bundle = result.bundle
  const found = bundle.lessons.find((item) => item.id === 'lesson.m6-06')
  if (!found) throw new Error('Falta la lección M6-06')
  lesson = found
})

describe('M6-06 — Ornamentos', () => {
  it('está publicada, validada y depende de M6-05', () => {
    expect(lesson.moduleId).toBe('M6')
    expect(lesson.slug).toBe('ornamentos')
    expect(lesson.status).toBe('published')
    expect(lesson.prerequisites).toContain('lesson.m6-05')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
    expect(lesson.objectivesEn).toHaveLength(lesson.objectivesEs.length)
    expect(lesson.skillIds).toEqual(['skill.ornament'])
    expect(lesson.exerciseIds).toHaveLength(12)
  })

  it('explica los cuatro adornos y su ejecución', () => {
    const text = lesson.sections
      .map((section) => `${section.titleEs} ${section.bodyEs ?? ''}`)
      .join(' ')
      .toLowerCase()

    for (const term of [
      'adornos',
      'trino',
      'mordente',
      'grupeto',
      'apoyatura',
      'nota principal',
      'superior',
      'inferior',
      'pulso',
      'barroco',
      'clasicismo',
      'bach',
      'mozart',
    ]) {
      expect(text, `Falta el concepto: ${term}`).toContain(term)
    }

    const english = lesson.sections
      .map((section) => `${section.titleEn} ${section.bodyEn ?? ''}`)
      .join(' ')
      .toLowerCase()
    for (const term of [
      'ornaments',
      'trill',
      'mordent',
      'turn',
      'appoggiatura',
      'main note',
      'upper',
      'lower',
      'pulse',
      'baroque',
      'classical',
      'bach',
      'mozart',
    ]) {
      expect(english, `Missing concept: ${term}`).toContain(term)
    }
  })

  it('incluye una demo escrita de cada adorno', () => {
    const demos = scoreSections(lesson)
    expect(demos).toHaveLength(4)

    const expected: Record<string, number[][]> = {
      'sec.m6-06.demo-trino': [[72, 74, 72, 74, 72, 74, 72, 74], [72]],
      'sec.m6-06.demo-mordente': [[72, 71, 72], [72]],
      'sec.m6-06.demo-grupeto': [[74, 72, 71, 72], [72]],
      'sec.m6-06.demo-apoyatura': [[74, 72], [72]],
    }

    for (const demo of demos) {
      expect(demo.score.key, demo.sectionId).toBe('C')
      expect(demo.score.mode, demo.sectionId).toBe('major')
      expect(eventMidis(demo.score), demo.sectionId).toEqual(
        expected[demo.sectionId],
      )
      const measures = new Set(
        demo.score.events.map((event) => event.measure),
      )
      for (const measure of measures) {
        expect(
          measureBeats(demo.score, measure),
          `${demo.sectionId} c.${measure}`,
        ).toBe(demo.score.timeSignature.numerator)
      }
    }

    const byId = new Map(demos.map((demo) => [demo.sectionId, demo.score]))
    expect(classifyOrnament(byId.get('sec.m6-06.demo-trino') as Score)).toBe(
      'trill',
    )
    expect(classifyOrnament(byId.get('sec.m6-06.demo-mordente') as Score)).toBe(
      'mordent',
    )
    expect(classifyOrnament(byId.get('sec.m6-06.demo-grupeto') as Score)).toBe(
      'turn',
    )
    expect(
      classifyOrnament(byId.get('sec.m6-06.demo-apoyatura') as Score),
    ).toBe('appoggiatura')
  })

  it('planta doce ejercicios de ejecución de adornos', () => {
    const exercises = lessonExercises(lesson, bundle)
    expect(exercises).toHaveLength(12)
    expect(
      exercises.every((exercise) => exercise.type === 'ornament-execution'),
    ).toBe(true)

    const byId = new Map(exercises.map((exercise) => [exercise.id, exercise]))
    for (const [id, ornament] of Object.entries(EXPECTED)) {
      const exercise = byId.get(id)
      expect(exercise, id).toBeDefined()
      if (!exercise || exercise.type !== 'ornament-execution') continue

      expect(exercise.ornament, id).toBe(ornament)
      expect(exercise.skillId, id).toBe('skill.ornament')

      const spanish = resolveExerciseAnswer(exercise, 'es')
      const english = resolveExerciseAnswer(exercise, 'en')
      expect(spanish.mode, `${id} modo ES`).toBe('choice')
      expect(english.mode, `${id} modo EN`).toBe('choice')
      if (spanish.mode !== 'choice' || english.mode !== 'choice') continue

      expect(spanish.answer, `${id} respuesta ES`).toBe(LABELS[ornament].es)
      expect(english.answer, `${id} respuesta EN`).toBe(LABELS[ornament].en)

      const choicesEs = exerciseChoices(exercise, 'es')
      const choicesEn = exerciseChoices(exercise, 'en')
      expect(choicesEs ?? [], `${id} opciones ES`).toContain(spanish.answer)
      expect(choicesEn ?? [], `${id} opciones EN`).toContain(english.answer)
      expect(choicesEs ?? [], `${id} cantidad de opciones`).toHaveLength(4)
      expect(
        (choicesEs ?? []).indexOf(spanish.answer),
        `${id} índice de la respuesta`,
      ).toBe((choicesEn ?? []).indexOf(english.answer))
    }
  })

  it('la realización escrita coincide con el adorno declarado', () => {
    const exercises = lessonExercises(lesson, bundle).filter(
      (exercise) => exercise.type === 'ornament-execution',
    )

    for (const exercise of exercises) {
      if (exercise.type !== 'ornament-execution') continue
      const measures = new Set(
        exercise.score.events.map((event) => event.measure),
      )
      for (const measure of measures) {
        expect(
          measureBeats(exercise.score, measure),
          `${exercise.id} c.${measure}`,
        ).toBe(exercise.score.timeSignature.numerator)
      }
      expect(
        classifyOrnament(exercise.score),
        `${exercise.id} adorno`,
      ).toBe(exercise.ornament)
    }
  })

  it('reparte los ejercicios entre los cuatro adornos', () => {
    const exercises = lessonExercises(lesson, bundle).filter(
      (exercise) => exercise.type === 'ornament-execution',
    )
    const ornaments = exercises.map((exercise) =>
      exercise.type === 'ornament-execution' ? exercise.ornament : null,
    )
    for (const ornament of ['trill', 'mordent', 'turn', 'appoggiatura']) {
      expect(
        ornaments.filter((value) => value === ornament),
        ornament,
      ).toHaveLength(3)
    }
  })

  it('incluye una tarea de teclado para ejecutar los adornos', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.tempoBpm).toBe(72)
    expect(task?.keys.length).toBeGreaterThanOrEqual(12)
    expect(task?.checklistEs.length).toBeGreaterThanOrEqual(3)
    expect(task?.checklistEn).toHaveLength(task?.checklistEs.length ?? 0)
    expect(task?.instructionsEs).toMatch(/trino, el mordente y la apoyatura/)
    expect(task?.instructionsEn).toMatch(/trill, the mordent and the appoggiatura/)

    const demo = task?.demoScore
    expect(demo).toBeDefined()
    if (!demo) throw new Error('Falta la demo de la tarea')
    expect(demo.key).toBe('C')
    expect(demo.mode).toBe('major')
    expect(classifyOrnament(demo)).toBe('turn')
    expect(eventMidis(demo)).toEqual([[74, 72, 71, 72], [72]])
  })

  it('registra la habilidad de ornamentos', () => {
    const skill = bundle.skills.find((item) => item.id === 'skill.ornament')
    expect(skill).toBeDefined()
    expect(skill?.kind).toBe('ornament')
    expect(skill?.lessonIds).toContain('lesson.m6-06')
    expect(skill?.labelEs.length).toBeGreaterThan(0)
    expect(skill?.labelEn.length).toBeGreaterThan(0)
    expect(skill?.params.topics).toEqual([
      'trill',
      'mordent',
      'turn',
      'appoggiatura',
    ])
  })
})
