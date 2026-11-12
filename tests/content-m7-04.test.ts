import { beforeAll, describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { exerciseChoices } from '../src/content/localize'
import { scoreToMeasures, spelledPitchToMidi } from '../src/content/score'
import { validateContentBundle } from '../src/content/validate'
import { resolveExerciseAnswer } from '../src/exercises/answer'
import {
  ACCOMPANIMENT_PATTERN_LABELS,
  accompanimentPatternInMeasure,
  chordSymbolInMeasure,
} from '../src/exercises/accompaniment'
import type { ContentBundle, Exercise, Lesson, Score } from '../src/schemas'

const EXPECTED_SYMBOLS = ['C', 'Am', 'F', 'G7', 'Dm']

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
  const found = bundle.lessons.find((item) => item.id === 'lesson.m7-04')
  if (!found) throw new Error('Falta la lección M7-04')
  lesson = found
})

describe('M7-04 — Acompañamiento en bloque', () => {
  it('está publicada, validada y sigue a M7-03', () => {
    expect(lesson.moduleId).toBe('M7')
    expect(lesson.slug).toBe('acompanamiento-en-bloque')
    expect(lesson.status).toBe('published')
    expect(lesson.prerequisites).toContain('lesson.m7-03')
    expect(lesson.objectivesEs.length).toBeGreaterThanOrEqual(3)
    expect(lesson.objectivesEn).toHaveLength(lesson.objectivesEs.length)
    expect(lesson.skillIds).toEqual(['skill.accompaniment'])
    expect(lesson.exerciseIds).toHaveLength(10)
  })

  it('explica figuras, patrones, lead sheet y cuidado de las manos', () => {
    const text = lesson.sections
      .map((section) => `${section.titleEs} ${section.bodyEs ?? ''}`)
      .join(' ')
      .toLowerCase()

    for (const term of [
      'acompañamiento en bloque',
      'acorde completo',
      'redondas',
      'blancas',
      'negras',
      'bajo y acorde',
      'lead sheet',
      'cifrado',
      'melodía',
      'mano izquierda',
      'pulso',
      'digitación',
      'dolor',
      'tensión',
    ]) {
      expect(text, `Falta el concepto: ${term}`).toContain(term)
    }

    const english = lesson.sections
      .map((section) => `${section.titleEn} ${section.bodyEn ?? ''}`)
      .join(' ')
      .toLowerCase()
    for (const term of [
      'block accompaniment',
      'full chord',
      'whole notes',
      'half notes',
      'quarter notes',
      'bass and chord',
      'lead sheet',
      'symbol',
      'melody',
      'left hand',
      'beat',
      'fingering',
      'pain',
      'tension',
    ]) {
      expect(english, `Missing concept: ${term}`).toContain(term)
    }
  })

  it('incluye demos de redondas, negras, bajo y acorde y lead sheet', () => {
    const demos = scoreSections(lesson)
    expect(demos).toHaveLength(4)

    const byId = new Map(demos.map((demo) => [demo.sectionId, demo.score]))

    const whole = byId.get('sec.m7-04.demo-redondas')
    expect(whole).toBeDefined()
    if (whole) {
      expect(accompanimentPatternInMeasure(whole, 1)).toBe('whole')
      expect(whole.events).toHaveLength(4)
      expect(whole.events.every((event) => event.pitches.length === 3)).toBe(
        true,
      )
    }

    const quarter = byId.get('sec.m7-04.demo-negras')
    expect(quarter).toBeDefined()
    if (quarter) {
      expect(accompanimentPatternInMeasure(quarter, 1)).toBe('quarter')
      expect(quarter.events).toHaveLength(16)
    }

    const bassChord = byId.get('sec.m7-04.demo-bajo-acorde')
    expect(bassChord).toBeDefined()
    if (bassChord) {
      expect(accompanimentPatternInMeasure(bassChord, 1)).toBe('bass-chord')
      expect(bassChord.events.filter((event) => event.pitches.length === 1)).toHaveLength(8)
    }

    const lead = byId.get('sec.m7-04.demo-lead-sheet')
    expect(lead).toBeDefined()
    if (lead) {
      expect(lead.events).toHaveLength(16)
      const symbols = new Set(
        lead.events
          .map((event) => event.chordSymbol)
          .filter((symbol): symbol is string => symbol !== undefined),
      )
      expect([...symbols].sort()).toEqual([...EXPECTED_SYMBOLS].sort())
      for (let measure = 1; measure <= 8; measure += 1) {
        expect(chordSymbolInMeasure(lead, measure), `compás ${measure}`).not.toBeNull()
      }
    }

    for (const demo of demos) {
      expect(demo.score.key, demo.sectionId).toBe('C')
      expect(demo.score.mode, demo.sectionId).toBe('major')
      expect(demo.score.tempoBpm, demo.sectionId).toBe(72)
    }
  })

  it('dibuja los cifrados del lead sheet sobre el primer tiempo de cada compás', () => {
    const lead = scoreSections(lesson).find(
      (demo) => demo.sectionId === 'sec.m7-04.demo-lead-sheet',
    )
    if (!lead) throw new Error('Falta la demo de lead sheet')
    const measures = scoreToMeasures(lead.score)
    const withSymbols = measures.filter((measure) => measure.chordSymbol)
    expect(withSymbols).toHaveLength(8)
    expect(withSymbols.map((measure) => measure.chordSymbol)).toEqual([
      'C',
      'Am',
      'F',
      'G7',
      'C',
      'Am',
      'Dm',
      'G7',
    ])
  })

  it('plantea ejercicios de patrón y de cifrado con opciones paralelas', () => {
    const exercises = lessonExercises(lesson, bundle)
    expect(
      exercises.every((exercise) => exercise.type === 'accompaniment'),
    ).toBe(true)

    const asks = exercises.map((exercise) =>
      exercise.type === 'accompaniment' ? exercise.ask : '',
    )
    expect(asks.filter((ask) => ask === 'pattern')).toHaveLength(5)
    expect(asks.filter((ask) => ask === 'symbol')).toHaveLength(5)

    const difficulties = exercises.map((exercise) => exercise.difficulty)
    expect(difficulties.filter((value) => value === 1)).toHaveLength(3)
    expect(difficulties.filter((value) => value === 2)).toHaveLength(4)
    expect(difficulties.filter((value) => value === 3)).toHaveLength(3)

    for (const exercise of exercises) {
      if (exercise.type !== 'accompaniment') continue
      expect(exercise.skillId, exercise.id).toBe('skill.accompaniment')

      const spanish = resolveExerciseAnswer(exercise, 'es')
      const english = resolveExerciseAnswer(exercise, 'en')
      expect(spanish.mode, `${exercise.id} modo ES`).toBe('choice')
      expect(english.mode, `${exercise.id} modo EN`).toBe('choice')
      if (spanish.mode !== 'choice' || english.mode !== 'choice') continue

      const choicesEs = exerciseChoices(exercise, 'es') ?? []
      const choicesEn = exerciseChoices(exercise, 'en') ?? []
      expect(choicesEs, `${exercise.id} opciones ES`).toContain(spanish.answer)
      expect(choicesEn, `${exercise.id} opciones EN`).toContain(english.answer)
      expect(choicesEs, `${exercise.id}`).toHaveLength(3)
      expect(choicesEs.length, exercise.id).toBe(choicesEn.length)
      expect(
        choicesEs.indexOf(spanish.answer),
        `${exercise.id} índice paralelo`,
      ).toBe(choicesEn.indexOf(english.answer))
    }
  })

  it('resuelve patrones y cifrados con sus etiquetas', () => {
    const byId = new Map(lessonExercises(lesson, bundle).map((e) => [e.id, e]))

    const whole = byId.get('ex.m7-04.a')
    if (!whole || whole.type !== 'accompaniment') throw new Error('Falta ex.m7-04.a')
    const wholeEs = resolveExerciseAnswer(whole, 'es')
    expect(wholeEs.mode).toBe('choice')
    if (wholeEs.mode !== 'practice') {
      expect(wholeEs.answer).toBe(ACCOMPANIMENT_PATTERN_LABELS.whole.es)
    }

    const bassChord = byId.get('ex.m7-04.e')
    if (!bassChord || bassChord.type !== 'accompaniment') {
      throw new Error('Falta ex.m7-04.e')
    }
    const bassEs = resolveExerciseAnswer(bassChord, 'es')
    expect(bassEs.mode).toBe('choice')
    if (bassEs.mode !== 'practice') {
      expect(bassEs.answer).toBe(ACCOMPANIMENT_PATTERN_LABELS['bass-chord'].es)
    }

    const symbol = byId.get('ex.m7-04.f')
    if (!symbol || symbol.type !== 'accompaniment') throw new Error('Falta ex.m7-04.f')
    const symbolEs = resolveExerciseAnswer(symbol, 'es')
    expect(symbolEs.mode).toBe('choice')
    if (symbolEs.mode !== 'practice') {
      expect(symbolEs.answer).toBe('Am')
    }
  })

  it('mantiene la melodía del lead sheet dentro del pentagrama', () => {
    const lead = scoreSections(lesson).find(
      (demo) => demo.sectionId === 'sec.m7-04.demo-lead-sheet',
    )
    if (!lead) throw new Error('Falta la demo de lead sheet')
    for (const event of lead.score.events) {
      expect(event.pitches, event.id).toHaveLength(1)
      expect(event.hand, event.id).toBe('right')
      const midi = spelledPitchToMidi(event.pitches[0])
      expect(midi, event.id).toBeGreaterThanOrEqual(60)
      expect(midi, event.id).toBeLessThanOrEqual(74)
    }
    for (const measure of scoreToMeasures(lead.score)) {
      expect(measure.pitches, measure.id).toHaveLength(1)
    }
    for (const exercise of lessonExercises(lesson, bundle)) {
      if (exercise.type !== 'accompaniment') continue
      expect(exercise.score.key, exercise.id).toBe('C')
      expect(exercise.score.mode, exercise.id).toBe('major')
    }
  })

  it('incluye una tarea con melodía, bloque y escucha del pulso', () => {
    const task = lesson.keyboardTask
    expect(task).toBeDefined()
    expect(task?.tempoBpm).toBe(60)
    expect(task?.keys).toHaveLength(4)
    expect(task?.checklistEs.length).toBeGreaterThanOrEqual(5)
    expect(task?.checklistEn).toHaveLength(task?.checklistEs.length ?? 0)
    expect(task?.instructionsEs).toMatch(/lead sheet/)
    expect(task?.instructionsEs).toMatch(/melodía/)
    expect(task?.instructionsEs).toMatch(/bloque/)
    expect(task?.instructionsEs).toMatch(/dolor o tensión/)
    expect(task?.instructionsEn).toMatch(/lead sheet/)
    expect(task?.instructionsEn).toMatch(/melody/)
    expect(task?.instructionsEn).toMatch(/block/)
    expect(task?.instructionsEn).toMatch(/pain or tension/)
    expect(task?.fingeringEs).toMatch(/5-3-1/)
    expect(task?.fingeringEn).toMatch(/5-3-1/)

    const demo = task?.demoScore
    expect(demo).toBeDefined()
    if (!demo) throw new Error('Falta la demo de la tarea')
    expect(demo.events.filter((event) => event.chordSymbol)).toHaveLength(8)
  })

  it('registra la habilidad con patrones, cifrados y lección', () => {
    const skill = bundle.skills.find((item) => item.id === 'skill.accompaniment')
    expect(skill).toBeDefined()
    expect(skill?.kind).toBe('keyboard-task')
    expect(skill?.lessonIds).toEqual(['lesson.m7-04'])
    expect(skill?.params.patterns).toEqual([
      'whole',
      'half',
      'quarter',
      'bass-chord',
    ])
    expect(skill?.params.formats).toEqual(['block', 'bass-chord'])
    expect(skill?.params.symbols).toEqual(['C', 'Am', 'F', 'G7', 'Dm'])
    expect(skill?.params.tempoBpm).toEqual(['60', '72'])
  })
})
