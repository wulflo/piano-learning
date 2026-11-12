import { beforeAll, describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { exerciseChoices } from '../src/content/localize'
import { validateContentBundle } from '../src/content/validate'
import { resolveExerciseAnswer } from '../src/exercises/answer'
import {
  leadSheetMelodyNoteName,
  shellVoicingLabel,
} from '../src/exercises/accompaniment'
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
  const found = bundle.lessons.find((item) => item.id === 'lesson.m7-11')
  if (!found) throw new Error('Falta la lección M7-11')
  lesson = found
})

describe('M7-11 — Lead sheets y cifrados', () => {
  it('está publicada, validada y sigue a M7-10', () => {
    expect(lesson.moduleId).toBe('M7')
    expect(lesson.slug).toBe('lead-sheets-y-cifrados')
    expect(lesson.status).toBe('published')
    expect(lesson.prerequisites).toContain('lesson.m7-10')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
    expect(lesson.objectivesEn).toHaveLength(lesson.objectivesEs.length)
    expect(lesson.skillIds).toEqual(['skill.lead-sheet'])
    expect(lesson.exerciseIds).toHaveLength(12)
    expect(lesson.minutes).toBeLessThanOrEqual(20)
  })

  it('explica el lead sheet, el shell voicing y los cinco pasos de práctica', () => {
    const text = lesson.sections
      .map((section) => `${section.titleEs} ${section.bodyEs ?? ''}`)
      .join(' ')
      .toLowerCase()

    for (const term of [
      'lead sheet',
      'melodía',
      'cifrado',
      'fundamental',
      'tercera',
      'séptima',
      'shell',
      'voicing',
      'conducción de voces',
      'notas comunes',
      'cinco pasos',
      '60 bpm',
      'sin dolor',
      'tensión',
    ]) {
      expect(text, `Falta el concepto: ${term}`).toContain(term)
    }

    const english = lesson.sections
      .map((section) => `${section.titleEn} ${section.bodyEn ?? ''}`)
      .join(' ')
      .toLowerCase()
    for (const term of [
      'lead sheet',
      'melody',
      'chord symbol',
      'root',
      'third',
      'seventh',
      'shell',
      'voicing',
      'voice leading',
      'common tones',
      'five steps',
      '60 bpm',
    ]) {
      expect(english, `Missing concept: ${term}`).toContain(term)
    }
  })

  it('incluye una demo de melodía con cifrados y otra de shell voicings', () => {
    const demos = scoreSections(lesson)
    expect(demos).toHaveLength(2)

    const byId = new Map(demos.map((demo) => [demo.sectionId, demo.score]))

    const lead = byId.get('sec.m7-11.demo-lead')
    expect(lead).toBeDefined()
    if (lead) {
      expect(lead.tempoBpm).toBe(60)
      expect(new Set(lead.events.map((event) => event.measure))).toEqual(
        new Set([1, 2, 3, 4, 5, 6, 7, 8]),
      )
      expect(
        lead.events
          .map((event) => event.chordSymbol)
          .filter((symbol): symbol is string => symbol !== undefined),
      ).toEqual(['C', 'Am7', 'Dm7', 'G7', 'C', 'Am7', 'Dm7', 'C'])
      const last = lead.events.at(-1)
      expect(last?.value.duration).toBe('whole')
      expect(last?.pitches[0]?.step).toBe('C')
      expect(last?.pitches[0]?.octave).toBe(5)
    }

    const voicings = byId.get('sec.m7-11.demo-voicing')
    expect(voicings).toBeDefined()
    if (voicings) {
      expect(voicings.events).toHaveLength(4)
      expect(
        voicings.events.every((event) => event.value.duration === 'whole'),
      ).toBe(true)
      expect(voicings.events.map((event) => event.chordSymbol)).toEqual([
        'Cmaj7',
        'Am7',
        'Dm7',
        'G7',
      ])
      for (const [index, symbol] of ['Cmaj7', 'Am7', 'Dm7', 'G7'].entries()) {
        const event = voicings.events[index]
        if (!event) throw new Error(`Falta el acorde ${index + 1}`)
        const label = event.pitches
          .map((pitch) => `${pitch.step}${pitch.accidental}${pitch.octave}`)
          .join(' + ')
        const expected = shellVoicingLabel(symbol, 'en').replaceAll('#', '')
        expect(label.replaceAll('#', '')).toBe(expected)
      }
    }
  })

  it('plantea seis preguntas de melodía y seis de voicing', () => {
    const exercises = lessonExercises(lesson, bundle)
    expect(exercises).toHaveLength(12)

    const melody = exercises.filter(
      (exercise) => exercise.type === 'accompaniment' && exercise.ask === 'melody',
    )
    const voicing = exercises.filter(
      (exercise) => exercise.type === 'accompaniment' && exercise.ask === 'voicing',
    )
    expect(melody).toHaveLength(6)
    expect(voicing).toHaveLength(6)

    expect(
      melody.map((exercise) =>
        exercise.type === 'accompaniment' ? exercise.score.key : '',
      ),
    ).toEqual(['C', 'G', 'F', 'D', 'Bb', 'Eb'])
    expect(
      voicing.map((exercise) =>
        exercise.type === 'accompaniment' ? exercise.score.key : '',
      ),
    ).toEqual(['C', 'G', 'F', 'D', 'Bb', 'Eb'])

    for (const exercise of exercises) {
      expect(exercise.type, exercise.id).toBe('accompaniment')
      expect(exercise.skillId, exercise.id).toBe('skill.lead-sheet')
      if (exercise.type !== 'accompaniment') continue
      expect(exercise.score.events.length, exercise.id).toBe(16)
      expect(
        exercise.score.events.filter((event) => event.chordSymbol !== undefined),
        exercise.id,
      ).toHaveLength(4)
      expect(exercise.choices, exercise.id).toHaveLength(4)
      expect(exercise.choicesEn, exercise.id).toHaveLength(4)
    }
  })

  it('resuelve cada nota de la melodía desde el compás y el pulso', () => {
    const exercises = lessonExercises(lesson, bundle).filter(
      (exercise) => exercise.type === 'accompaniment' && exercise.ask === 'melody',
    )
    expect(exercises).toHaveLength(6)

    const expected = [
      'La5',
      'Sol5',
      'Sol5',
      'Fa♯4',
      'Sol4',
      'La♭4',
    ]

    for (const [index, exercise] of exercises.entries()) {
      if (exercise.type !== 'accompaniment') continue
      const name = leadSheetMelodyNoteName(
        exercise.score,
        exercise.measure,
        exercise.beat,
        'es',
      )
      expect(name, exercise.id).toBe(expected[index])

      const spanish = resolveExerciseAnswer(exercise, 'es')
      const english = resolveExerciseAnswer(exercise, 'en')
      expect(spanish.mode, `${exercise.id} modo ES`).toBe('choice')
      expect(english.mode, `${exercise.id} modo EN`).toBe('choice')
      if (spanish.mode !== 'choice' || english.mode !== 'choice') continue

      const choicesEs = exerciseChoices(exercise, 'es') ?? []
      const choicesEn = exerciseChoices(exercise, 'en') ?? []
      expect(choicesEs, exercise.id).toContain(spanish.answer)
      expect(choicesEn, exercise.id).toContain(english.answer)
      expect(choicesEs.indexOf(spanish.answer), exercise.id).toBe(
        choicesEn.indexOf(english.answer),
      )
    }
  })

  it('resuelve cada voicing de shell desde el cifrado del compás', () => {
    const exercises = lessonExercises(lesson, bundle).filter(
      (exercise) => exercise.type === 'accompaniment' && exercise.ask === 'voicing',
    )
    expect(exercises).toHaveLength(6)

    const expected = [
      ['Am7', 'La3 + Do4 + Sol4', 'A3 + C4 + G4'],
      ['D7', 'Re3 + Do4 + Fa♯4', 'D3 + C4 + F#4'],
      ['Dm7', 'Re3 + Do4 + Fa4', 'D3 + C4 + F4'],
      ['A7', 'La3 + Do♯4 + Sol4', 'A3 + C#4 + G4'],
      ['F7', 'Fa3 + Mi♭4 + La4', 'F3 + Eb4 + A4'],
      ['Bb7', 'Si♭3 + Re4 + La♭4', 'Bb3 + D4 + Ab4'],
    ]

    for (const [index, exercise] of exercises.entries()) {
      if (exercise.type !== 'accompaniment') continue
      const [symbol, expectedEs, expectedEn] = expected[index] ?? []
      expect(symbol, exercise.id).toBeDefined()
      if (!symbol) continue

      const symbolAtMeasure = exercise.score.events.find(
        (event) => event.measure === exercise.measure && event.chordSymbol,
      )?.chordSymbol
      expect(symbolAtMeasure, exercise.id).toBe(symbol)
      expect(shellVoicingLabel(symbol, 'es'), exercise.id).toBe(expectedEs)
      expect(shellVoicingLabel(symbol, 'en'), exercise.id).toBe(expectedEn)

      const spanish = resolveExerciseAnswer(exercise, 'es')
      const english = resolveExerciseAnswer(exercise, 'en')
      expect(spanish.mode, `${exercise.id} modo ES`).toBe('choice')
      expect(english.mode, `${exercise.id} modo EN`).toBe('choice')
      if (spanish.mode !== 'choice' || english.mode !== 'choice') continue

      expect(spanish.answer, exercise.id).toBe(expectedEs)
      expect(english.answer, exercise.id).toBe(expectedEn)
      const choicesEs = exerciseChoices(exercise, 'es') ?? []
      const choicesEn = exerciseChoices(exercise, 'en') ?? []
      expect(choicesEs, exercise.id).toContain(spanish.answer)
      expect(choicesEn, exercise.id).toContain(english.answer)
      expect(choicesEs.indexOf(spanish.answer), exercise.id).toBe(
        choicesEn.indexOf(english.answer),
      )
    }
  })

  it('incluye una tarea de acompañamiento con shell voicings a 60 BPM', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.tempoBpm).toBe(60)
    expect(task?.keys.length).toBeGreaterThanOrEqual(10)
    expect(task?.checklistEs.length).toBeGreaterThanOrEqual(5)
    expect(task?.checklistEn).toHaveLength(task?.checklistEs.length ?? 0)
    expect(task?.instructionsEs).toMatch(/metrónomo/)
    expect(task?.instructionsEs).toMatch(/60 BPM/)
    expect(task?.instructionsEs).toMatch(/Cmaj7–Am7–Dm7–G7/)
    expect(task?.instructionsEs).toMatch(/Do3, La3, Re3 y Sol3/)
    expect(task?.instructionsEs).toMatch(/tercera y la séptima/)
    expect(task?.instructionsEs).toMatch(/dolor, tensión o cansancio/)
    expect(task?.instructionsEn).toMatch(/metronome/)
    expect(task?.instructionsEn).toMatch(/60 BPM/)
    expect(task?.instructionsEn).toMatch(/Cmaj7–Am7–Dm7–G7/)
    expect(task?.instructionsEn).toMatch(/C3, A3, D3 and G3/)
    expect(task?.instructionsEn).toMatch(/third and seventh/)
    expect(task?.instructionsEn).toMatch(/pain, tension or fatigue/)
  })

  it('registra la habilidad de lead sheets y voicings', () => {
    const skill = bundle.skills.find((item) => item.id === 'skill.lead-sheet')
    expect(skill?.kind).toBe('keyboard-task')
    expect(skill?.lessonIds).toEqual(['lesson.m7-11'])
    expect(skill?.params.symbols).toContain('Am7')
    expect(skill?.params.voicings).toContain('shell')
    expect(skill?.params.keys).toEqual(['C', 'G', 'F', 'D', 'Bb', 'Eb'])
  })
})
