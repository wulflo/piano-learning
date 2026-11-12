import { describe, expect, it } from 'vitest'
import type { Exercise } from '../src/schemas'
import type { ScaleMode } from '../src/theory'
import {
  buildScaleDictation,
  SCALE_DICTATION_MODES,
  scaleComparisonMode,
} from '../src/exercises/scale-dictation'
import { repeatDictationTimeline } from '../src/exercises/dictation'

type EarScaleExercise = Extract<Exercise, { type: 'ear-scale' }>

const MODE_CHOICES_ES = ['Mayor', 'Menor natural', 'Lidio', 'Blues']
const MODE_CHOICES_EN = ['Major', 'Natural minor', 'Lydian', 'Blues']

function earScale(
  mode: ScaleMode = 'major',
  overrides: Partial<EarScaleExercise> = {},
): EarScaleExercise {
  return {
    id: `test.ear-scale.${mode}`,
    skillId: 'skill.major-scale',
    type: 'ear-scale',
    promptEs: '¿Qué escala suena?',
    promptEn: 'Which scale do you hear?',
    explanationEs: 'Explicación de prueba.',
    explanationEn: 'Test explanation.',
    difficulty: 2,
    tonic: 'C',
    mode,
    choices: MODE_CHOICES_ES,
    choicesEn: MODE_CHOICES_EN,
    ...overrides,
  }
}

function midisFor(mode: ScaleMode, tonic: EarScaleExercise['tonic'] = 'C') {
  return buildScaleDictation(earScale(mode, { tonic }), { tempo: 60 }).midis
}

describe('F3-022 — Dictado de escalas y modos', () => {
  it('arma la escala mayor desde la tónica y cierra en la octava', () => {
    expect(SCALE_DICTATION_MODES).toHaveLength(16)
    expect(SCALE_DICTATION_MODES).toContain('major')
    expect(SCALE_DICTATION_MODES).toContain('harmonic-minor')
    expect(SCALE_DICTATION_MODES).toContain('locrian')

    const dictation = buildScaleDictation(earScale('major'), { tempo: 60 })

    expect(dictation.tonic).toBe('C')
    expect(dictation.mode).toBe('major')
    expect(dictation.midis).toEqual([60, 62, 64, 65, 67, 69, 71, 72])
    expect(dictation.timeline).toHaveLength(8)
    expect(dictation.timeline[0]).toEqual({
      time: 0,
      duration: 0.5,
      midis: [60],
    })
    expect(dictation.timeline[7]).toEqual({
      time: 3.5,
      duration: 0.5,
      midis: [72],
    })
    // La respuesta correcta es la misma escala, sin pasadas extra.
    expect(dictation.answerTimeline).toEqual(dictation.timeline)
  })

  it('cubre las escalas menores de M2', () => {
    expect(midisFor('natural-minor', 'A')).toEqual([
      69, 71, 72, 74, 76, 77, 79, 81,
    ])
    expect(midisFor('harmonic-minor')).toEqual([
      60, 62, 63, 65, 67, 68, 71, 72,
    ])
    expect(midisFor('melodic-minor')).toEqual([
      60, 62, 63, 65, 67, 69, 71, 72,
    ])
  })

  it('cubre los siete modos diatónicos con la misma tónica', () => {
    const modes: ScaleMode[] = [
      'ionian',
      'dorian',
      'phrygian',
      'lydian',
      'mixolydian',
      'aeolian',
      'locrian',
    ]

    const shapes = modes.map((mode) => midisFor(mode).join(','))
    expect(new Set(shapes).size).toBe(modes.length)
    expect(midisFor('lydian')).toEqual([60, 62, 64, 66, 67, 69, 71, 72])
    expect(midisFor('locrian')).toEqual([60, 61, 63, 65, 66, 68, 70, 72])
  })

  it('cubre pentatónicas, blues, cromática y tonos enteros', () => {
    expect(midisFor('major-pentatonic')).toEqual([60, 62, 64, 67, 69, 72])
    expect(midisFor('minor-pentatonic')).toEqual([60, 63, 65, 67, 70, 72])
    expect(midisFor('blues')).toEqual([60, 63, 65, 66, 67, 70, 72])
    expect(midisFor('whole-tone')).toEqual([60, 62, 64, 66, 68, 70, 72])
    expect(midisFor('chromatic')).toHaveLength(13)
    expect(midisFor('chromatic')).toEqual([
      60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72,
    ])
  })

  it('ofrece una escala de referencia para comparar', () => {
    const lydian = buildScaleDictation(earScale('lydian'), { tempo: 60 })
    expect(lydian.reference.mode).toBe('major')
    expect(lydian.reference.labelEs).toBe('Mayor')
    expect(lydian.reference.labelEn).toBe('Major')
    expect(lydian.reference.midis).toEqual([60, 62, 64, 65, 67, 69, 71, 72])
    expect(lydian.reference.timeline).toHaveLength(8)

    expect(scaleComparisonMode('major')).toBe('natural-minor')
    expect(scaleComparisonMode('natural-minor')).toBe('major')
    expect(scaleComparisonMode('harmonic-minor')).toBe('natural-minor')
    expect(scaleComparisonMode('melodic-minor')).toBe('natural-minor')
    expect(scaleComparisonMode('blues')).toBe('minor-pentatonic')
    expect(scaleComparisonMode('dorian')).toBe('major')
  })

  it('resuelve la respuesta canónica en ambos idiomas', () => {
    const spanish = buildScaleDictation(earScale('lydian'), { tempo: 60 })
    expect(spanish.answer).toBe('Lidio')
    expect(spanish.accepted).toContain('Lidio')
    expect(spanish.feedback.titleEs).toBe('Recordá deletrear la escala')
    expect(spanish.feedback.ruleEs).not.toBe('')
    expect(spanish.feedback.exampleEs).not.toBe('')

    const english = buildScaleDictation(earScale('lydian'), {
      tempo: 60,
      locale: 'en',
    })
    expect(english.answer).toBe('Lydian')
    expect(english.accepted).toContain('Lydian')
    expect(english.feedback.titleEn).not.toBe('')
    expect(english.feedback.ruleEn).not.toBe('')
  })

  it('reutiliza la política de repeticiones de los dictados', () => {
    const { timeline } = buildScaleDictation(earScale('major'), { tempo: 60 })

    const twice = repeatDictationTimeline(timeline, {
      times: 2,
      gapBeats: 1,
      tempo: 60,
    })
    expect(twice).toHaveLength(16)
    expect(twice[8]?.time).toBeCloseTo(5)

    const capped = repeatDictationTimeline(timeline, {
      times: 99,
      tempo: 60,
    })
    expect(capped).toHaveLength(24)
  })

  it('es determinista y acepta tónicas alteradas', () => {
    const first = buildScaleDictation(earScale('major'), { tempo: 72 })
    const second = buildScaleDictation(earScale('major'), { tempo: 72 })
    expect(first).toEqual(second)

    const flat = buildScaleDictation(
      earScale('major', { tonic: 'Bb' }),
      { tempo: 72 },
    )
    expect(flat.midis).toEqual([70, 72, 74, 75, 77, 79, 81, 82])
    expect(flat.answer).toBe('Mayor')
  })
})
