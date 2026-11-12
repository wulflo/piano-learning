import { beforeAll, describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { exerciseChoices } from '../src/content/localize'
import { validateContentBundle } from '../src/content/validate'
import { resolveExerciseAnswer } from '../src/exercises/answer'
import { formatMelody } from '../src/exercises/generators/transposition'
import { sightReadingNotes } from '../src/exercises/sight-reading'
import type { ContentBundle, Exercise, Lesson, Score } from '../src/schemas'

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
  const found = bundle.lessons.find((item) => item.id === 'lesson.m7-10')
  if (!found) throw new Error('Falta la lección M7-10')
  lesson = found
})

describe('M7-10 — Tocar de oído, transposición e improvisación', () => {
  it('está publicada, validada y sigue a M7-09', () => {
    expect(lesson.moduleId).toBe('M7')
    expect(lesson.slug).toBe('tocar-de-oido-transposicion-improvisacion')
    expect(lesson.status).toBe('published')
    expect(lesson.prerequisites).toContain('lesson.m7-09')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
    expect(lesson.objectivesEn).toHaveLength(lesson.objectivesEs.length)
    expect(lesson.skillIds).toEqual([
      'skill.play-by-ear',
      'skill.transposition',
      'skill.ear-progression',
      'skill.improvisation',
    ])
    expect(lesson.exerciseIds).toHaveLength(12)
    expect(lesson.minutes).toBeLessThanOrEqual(20)
  })

  it('explica los pasos concretos para tocar de oído, transportar e improvisar', () => {
    const text = lesson.sections
      .map((section) => `${section.titleEs} ${section.bodyEs ?? ''}`)
      .join(' ')
      .toLowerCase()

    for (const term of [
      'cinco pasos',
      'cantala',
      'tónica',
      'primera nota',
      'grados',
      'compará',
      'transponer',
      'misma distancia',
      'armadura',
      'rueda de acordes',
      'i–vi–ii–v',
      'improvisar',
      'tres notas',
      'dejá espacios',
    ]) {
      expect(text, `Falta el concepto: ${term}`).toContain(term)
    }

    const english = lesson.sections
      .map((section) => `${section.titleEn} ${section.bodyEn ?? ''}`)
      .join(' ')
      .toLowerCase()
    for (const term of [
      'five steps',
      'sing',
      'tonic',
      'first note',
      'degrees',
      'compare',
      'transposing',
      'same distance',
      'key signature',
      'chord wheel',
      'i–vi–ii–v',
      'improvise',
      'three notes',
      'leave space',
    ]) {
      expect(english, `Missing concept: ${term}`).toContain(term)
    }
  })

  it('incluye la rueda en Do y un motivo improvisado con cifrado', () => {
    const demos = scoreSections(lesson)
    expect(demos).toHaveLength(2)

    const byId = new Map(demos.map((demo) => [demo.sectionId, demo.score]))

    const wheel = byId.get('sec.m7-10.demo-rueda')
    expect(wheel).toBeDefined()
    if (wheel) {
      expect(wheel.tempoBpm).toBe(60)
      expect(wheel.events).toHaveLength(4)
      expect(wheel.events.every((event) => event.value.duration === 'whole')).toBe(
        true,
      )
      expect(wheel.events.map((event) => event.chordSymbol)).toEqual([
        'C',
        'Am',
        'Dm',
        'G',
      ])
      for (const [index, steps] of [
        ['C', 'E', 'G'],
        ['A', 'C', 'E'],
        ['D', 'F', 'A'],
        ['G', 'B', 'D'],
      ].entries()) {
        const event = wheel.events[index]
        expect(event?.pitches.map((pitch) => pitch.step)).toEqual(steps)
      }
    }

    const motif = byId.get('sec.m7-10.demo-motivo')
    expect(motif).toBeDefined()
    if (motif) {
      expect(motif.tempoBpm).toBe(60)
      expect(motif.events).toHaveLength(17)
      expect(new Set(motif.events.map((event) => event.measure))).toEqual(
        new Set([1, 2, 3, 4, 5]),
      )
      expect(motif.events.map((event) => event.chordSymbol).filter(Boolean)).toEqual(
        ['C', 'Am', 'Dm', 'G7', 'C'],
      )
      const last = motif.events.at(-1)
      expect(last?.value.duration).toBe('whole')
      expect(last?.pitches[0]?.step).toBe('C')
    }
  })

  it('plantea cuatro melodías ocultas, cuatro transposiciones y cuatro ruedas', () => {
    const exercises = lessonExercises(lesson, bundle)
    expect(exercises).toHaveLength(12)

    const byType = new Map<string, Exercise[]>()
    for (const exercise of exercises) {
      byType.set(exercise.type, [...(byType.get(exercise.type) ?? []), exercise])
    }
    expect(byType.get('ear-melody')).toHaveLength(4)
    expect(byType.get('transposition')).toHaveLength(4)
    expect(byType.get('ear-progression')).toHaveLength(4)

    const earMelodies = byType.get('ear-melody') ?? []
    expect(new Set(earMelodies.map((exercise) => exercise.difficulty))).toEqual(
      new Set([1, 2, 3, 4]),
    )
    expect(
      new Set(
        earMelodies.map((exercise) =>
          exercise.type === 'ear-melody' ? exercise.ask : '',
        ),
      ),
    ).toEqual(new Set(['interval', 'note', 'motion']))
    expect(
      new Set(
        earMelodies.map((exercise) =>
          exercise.type === 'ear-melody' ? exercise.score.key : '',
        ),
      ),
    ).toEqual(new Set(['C', 'G', 'F', 'D']))
  })

  it('cada melodía oculta se resuelve desde la partitura revelada', () => {
    const exercises = lessonExercises(lesson, bundle).filter(
      (exercise) => exercise.type === 'ear-melody',
    )
    expect(exercises).toHaveLength(4)

    for (const exercise of exercises) {
      if (exercise.type !== 'ear-melody') continue
      expect(exercise.skillId, exercise.id).toBe('skill.play-by-ear')
      expect(exercise.score.events.length, exercise.id).toBeGreaterThanOrEqual(4)
      expect(exercise.promptEs, exercise.id).toContain('melodía oculta')
      expect(exercise.promptEn, exercise.id).toContain('hidden melody')
      expect(exercise.from, exercise.id).toBeGreaterThanOrEqual(0)
      const to = exercise.to ?? exercise.from + 1
      expect(to, exercise.id).toBeGreaterThan(exercise.from)
      expect(sightReadingNotes(exercise.score).length, exercise.id).toBeGreaterThan(
        to,
      )

      const spanish = resolveExerciseAnswer(exercise, 'es')
      const english = resolveExerciseAnswer(exercise, 'en')
      expect(spanish.mode, `${exercise.id} modo ES`).toBe('choice')
      expect(english.mode, `${exercise.id} modo EN`).toBe('choice')
      if (spanish.mode !== 'choice' || english.mode !== 'choice') continue

      const choicesEs = exerciseChoices(exercise, 'es') ?? []
      const choicesEn = exerciseChoices(exercise, 'en') ?? []
      expect(choicesEs, exercise.id).toContain(spanish.answer)
      expect(choicesEn, exercise.id).toContain(english.answer)
      expect(choicesEs.length, exercise.id).toBe(choicesEn.length)
      expect(
        choicesEs.indexOf(spanish.answer),
        `${exercise.id} índice paralelo`,
      ).toBe(choicesEn.indexOf(english.answer))
    }
  })

  it('transporta melodías conservando la forma y ofrece la respuesta', () => {
    const exercises = lessonExercises(lesson, bundle).filter(
      (exercise) => exercise.type === 'transposition',
    )
    expect(exercises).toHaveLength(4)

    for (const exercise of exercises) {
      if (exercise.type !== 'transposition') continue
      expect(exercise.skillId, exercise.id).toBe('skill.transposition')
      expect(exercise.melody.length, exercise.id).toBeGreaterThanOrEqual(4)
      expect(exercise.answer, exercise.id).toBeDefined()
      expect(exercise.choices, exercise.id).toBeDefined()

      const canonical = formatMelody(exercise.answer ?? [])
      const spanish = resolveExerciseAnswer(exercise, 'es')
      const english = resolveExerciseAnswer(exercise, 'en')
      expect(spanish.mode, `${exercise.id} modo ES`).toBe('choice')
      expect(english.mode, `${exercise.id} modo EN`).toBe('choice')
      if (spanish.mode === 'choice') {
        expect(spanish.answer, exercise.id).toBe(canonical)
      }
      if (english.mode === 'choice') {
        expect(english.answer, exercise.id).toBe(canonical)
      }
      expect(exercise.choices, exercise.id).toContain(canonical)
      expect(exercise.choicesEn, exercise.id).toContain(canonical)
    }

    const keys = exercises.map((exercise) =>
      exercise.type === 'transposition'
        ? `${exercise.fromKey}->${exercise.toKey}`
        : '',
    )
    expect(keys).toEqual(['C->G', 'G->D', 'F->Bb', 'D->A'])
  })

  it('reconoce la rueda I–vi–ii–V en cuatro tonalidades', () => {
    const exercises = lessonExercises(lesson, bundle).filter(
      (exercise) => exercise.type === 'ear-progression',
    )
    expect(exercises).toHaveLength(4)
    expect(
      exercises.map((exercise) =>
        exercise.type === 'ear-progression' ? exercise.key : '',
      ),
    ).toEqual(['C', 'G', 'F', 'D'])

    for (const exercise of exercises) {
      if (exercise.type !== 'ear-progression') continue
      expect(exercise.skillId, exercise.id).toBe('skill.ear-progression')
      expect(exercise.degrees, exercise.id).toEqual(['I', 'vi', 'ii', 'V'])
      expect(exercise.choices, exercise.id).toContain('I vi ii V')
      const spanish = resolveExerciseAnswer(exercise, 'es')
      expect(spanish.mode, exercise.id).toBe('choice')
      if (spanish.mode === 'choice') {
        expect(spanish.answer, exercise.id).toBe('I vi ii V')
      }
    }
  })

  it('incluye una tarea de improvisación sobre la rueda a 60 BPM', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.tempoBpm).toBe(60)
    expect(task?.keys.length).toBeGreaterThanOrEqual(7)
    expect(task?.checklistEs.length).toBeGreaterThanOrEqual(5)
    expect(task?.checklistEn).toHaveLength(task?.checklistEs.length ?? 0)
    expect(task?.instructionsEs).toMatch(/metrónomo/)
    expect(task?.instructionsEs).toMatch(/60 BPM/)
    expect(task?.instructionsEs).toMatch(/Do, Lam, Rem y Sol7/)
    expect(task?.instructionsEs).toMatch(/tres notas/)
    expect(task?.instructionsEs).toMatch(/dos compases/)
    expect(task?.instructionsEs).toMatch(/dolor, tensión o cansancio/)
    expect(task?.instructionsEn).toMatch(/metronome/)
    expect(task?.instructionsEn).toMatch(/60 BPM/)
    expect(task?.instructionsEn).toMatch(/C, Am, Dm and G7/)
    expect(task?.instructionsEn).toMatch(/three chord tones/)
    expect(task?.instructionsEn).toMatch(/two-bar motif/)
    expect(task?.instructionsEn).toMatch(/pain, tension or fatigue/)

    const demo = task?.demoScore
    expect(demo).toBeDefined()
    if (!demo) throw new Error('Falta la demo de la tarea')
    expect(demo.events).toHaveLength(17)
    expect(demo.events.every((event) => event.hand === 'right')).toBe(true)
  })

  it('registra las tres habilidades nuevas y amplía la de progresiones', () => {
    const playByEar = bundle.skills.find(
      (item) => item.id === 'skill.play-by-ear',
    )
    expect(playByEar?.kind).toBe('ear-melody')
    expect(playByEar?.lessonIds).toEqual(['lesson.m7-10'])
    expect(playByEar?.params.asks).toEqual(['interval', 'note', 'motion'])

    const transposition = bundle.skills.find(
      (item) => item.id === 'skill.transposition',
    )
    expect(transposition?.kind).toBe('transposition')
    expect(transposition?.lessonIds).toEqual(['lesson.m7-10'])
    expect(transposition?.params.fromKeys).toEqual(['C', 'G', 'F', 'D'])

    const improvisation = bundle.skills.find(
      (item) => item.id === 'skill.improvisation',
    )
    expect(improvisation?.kind).toBe('keyboard-task')
    expect(improvisation?.lessonIds).toEqual(['lesson.m7-10'])
    expect(improvisation?.params.wheel).toEqual(['I', 'vi', 'ii', 'V'])

    const progression = bundle.skills.find(
      (item) => item.id === 'skill.ear-progression',
    )
    expect(progression?.lessonIds).toContain('lesson.m2-07')
    expect(progression?.lessonIds).toContain('lesson.m7-10')
  })
})
