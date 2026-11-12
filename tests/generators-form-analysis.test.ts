import { describe, expect, it } from 'vitest'
import { resolveExerciseAnswer } from '../src/exercises/answer'
import {
  FORM_ANALYSIS_FORMS,
  FORM_ANALYSIS_TONICS,
  FORM_LABELS,
  generateFormAnalysisExercise,
  generateFormAnalysisExercises,
  type FormAnalysisForm,
} from '../src/exercises/generators/form-analysis'
import { scoreToMeasures, spelledPitchToMidi } from '../src/content/score'
import { describeStaffNotes } from '../src/staff/render'
import { scalePitchClasses, scalePitches } from '../src/theory/scales'
import { midiOf, mod12 } from '../src/theory/pitch'
import type { Exercise, Key } from '../src/schemas'

type FormExercise = Extract<Exercise, { type: 'form-analysis' }>

const EXPECTED: Record<
  FormAnalysisForm,
  { labels: string[]; measures: number; notes: number }
> = {
  binary: { labels: ['A', 'B'], measures: 8, notes: 26 },
  ternary: { labels: ['A', 'B', 'A'], measures: 12, notes: 39 },
  period: { labels: ['A', 'B'], measures: 8, notes: 26 },
  rondo: { labels: ['A', 'B', 'A', 'C', 'A'], measures: 10, notes: 25 },
  sonata: { labels: ['A', 'B', 'A'], measures: 12, notes: 39 },
}

function generate(
  overrides: Partial<Parameters<typeof generateFormAnalysisExercise>[0]> = {},
): FormExercise {
  const exercise = generateFormAnalysisExercise({
    id: 'test.form',
    skillId: 'skill.musical-form',
    form: 'binary',
    key: 'C',
    ...overrides,
  })
  if (exercise.type !== 'form-analysis') {
    throw new Error('Se esperaba un ejercicio de análisis formal')
  }
  return exercise
}

function pitchesOf(exercise: FormExercise, from: number, to: number): string[] {
  return exercise.score.events
    .filter((event) => event.measure >= from && event.measure <= to)
    .map((event) =>
      event.pitches
        .map((pitch) => `${pitch.step}${pitch.accidental}/${pitch.octave}`)
        .join('+'),
    )
}

describe('F4-024 — generador de ejercicios de análisis formal', () => {
  it('genera las cinco formas en las doce tonalidades con fragmentos propios', () => {
    for (const tonic of FORM_ANALYSIS_TONICS) {
      const diatonic = new Set(scalePitchClasses(tonic, 'major'))
      const firstPitch = scalePitches(tonic, 'major')[0]
      for (const form of FORM_ANALYSIS_FORMS) {
        const exercise = generate({ form, key: tonic })
        const expected = EXPECTED[form]

        expect(exercise.form).toBe(form)
        expect(exercise.ask).toBe('form')
        expect(exercise.score.key).toBe(tonic)
        expect(exercise.score.mode).toBe('major')
        expect(exercise.score.clef).toBe('treble')
        expect(exercise.score.timeSignature).toEqual({
          numerator: 4,
          denominator: 4,
        })

        // Las secciones cubren la partitura sin solaparse.
        expect(exercise.sections.map((section) => section.label)).toEqual(
          expected.labels,
        )
        let previousEnd = 0
        for (const section of exercise.sections) {
          expect(section.startMeasure).toBe(previousEnd + 1)
          expect(section.endMeasure).toBeGreaterThanOrEqual(
            section.startMeasure,
          )
          previousEnd = section.endMeasure
        }
        const maxMeasure = exercise.score.events.reduce(
          (max, event) => Math.max(max, event.measure),
          0,
        )
        expect(maxMeasure).toBe(expected.measures)
        expect(previousEnd).toBe(expected.measures)
        expect(exercise.score.events).toHaveLength(expected.notes)

        // Todas las notas son diatónicas y están en un registro legible.
        for (const event of exercise.score.events) {
          expect(event.id.startsWith(`${exercise.id}.`)).toBe(true)
          for (const pitch of event.pitches) {
            expect(diatonic.has(mod12(spelledPitchToMidi(pitch)))).toBe(true)
            expect(spelledPitchToMidi(pitch)).toBeGreaterThanOrEqual(55)
            expect(spelledPitchToMidi(pitch)).toBeLessThanOrEqual(90)
          }
        }
        expect(spelledPitchToMidi(exercise.score.events[0].pitches[0])).toBe(
          midiOf(firstPitch),
        )

        // La etiqueta de la tonalidad aparece en el enunciado.
        expect(exercise.promptEs).toContain(
          `${
            { C: 'Do', D: 'Re', E: 'Mi', F: 'Fa', G: 'Sol', A: 'La', B: 'Si' }[
              tonic[0] as 'C'
            ]
          }${
            tonic.endsWith('#') ? '♯' : tonic.endsWith('b') ? '♭' : ''
          } mayor`,
        )
        expect(exercise.explanationEs).toContain('compases')

        const resolved = resolveExerciseAnswer(exercise, 'es')
        expect(resolved.mode).toBe('choice')
        if (resolved.mode === 'choice') {
          expect(resolved.answer).toBe(FORM_LABELS[form].es)
        }
        const resolvedEn = resolveExerciseAnswer(exercise, 'en')
        expect(resolvedEn.mode).toBe('choice')
        if (resolvedEn.mode === 'choice') {
          expect(resolvedEn.answer).toBe(FORM_LABELS[form].en)
        }
        expect(exercise.choices).toContain(FORM_LABELS[form].es)
        expect(exercise.choicesEn).toHaveLength(exercise.choices?.length ?? 0)
        const index = exercise.choices?.indexOf(FORM_LABELS[form].es) ?? -1
        expect(exercise.choicesEn?.[index]).toBe(FORM_LABELS[form].en)
      }
    }
  })

  it('ofrece alternativa textual de la partitura generada', () => {
    const exercise = generate({ form: 'binary', key: 'G' })
    const measures = scoreToMeasures(exercise.score)
    const text = describeStaffNotes(measures)
    const textDo = describeStaffNotes(measures, 'do')

    expect(text.length).toBeGreaterThan(0)
    expect(text).toContain('G4')
    expect(textDo).toContain('Sol4')
    expect(measures).toHaveLength(exercise.score.events.length)
  })

  it('hace volver el material A en ternaria, rondó y sonata', () => {
    const ternary = generate({ form: 'ternary', key: 'D' })
    const [a, , aReturn] = ternary.sections
    expect(pitchesOf(ternary, a.startMeasure, a.endMeasure)).toEqual(
      pitchesOf(ternary, aReturn.startMeasure, aReturn.endMeasure),
    )

    const rondo = generate({ form: 'rondo', key: 'D' })
    const rondoA = [rondo.sections[0], rondo.sections[2], rondo.sections[4]]
    const first = pitchesOf(rondo, rondoA[0].startMeasure, rondoA[0].endMeasure)
    for (const section of rondoA.slice(1)) {
      expect(pitchesOf(rondo, section.startMeasure, section.endMeasure)).toEqual(
        first,
      )
    }

    const sonata = generate({ form: 'sonata', key: 'D' })
    const exposition = pitchesOf(
      sonata,
      sonata.sections[0].startMeasure,
      sonata.sections[0].endMeasure,
    )
    const recapitulation = pitchesOf(
      sonata,
      sonata.sections[2].startMeasure,
      sonata.sections[2].endMeasure,
    )
    // La recapitulación retoma el tema y cambia solo la cadencia final.
    expect(recapitulation.slice(0, -1)).toEqual(exposition.slice(0, -1))
    expect(recapitulation.at(-1)).not.toBe(exposition.at(-1))
  })

  it('pregunta la función de las dos frases del período', () => {
    for (const part of [1, 2] as const) {
      const exercise = generate({
        form: 'period',
        ask: 'part',
        part,
        difficulty: 1,
      })
      expect(exercise.ask).toBe('part')
      expect(exercise.part).toBe(part)
      expect(exercise.choices).toHaveLength(2)
      expect(exercise.sections.map((section) => section.label)).toEqual([
        'A',
        'B',
      ])

      const resolved = resolveExerciseAnswer(exercise, 'es')
      expect(resolved.mode).toBe('choice')
      if (resolved.mode === 'choice') {
        expect(resolved.answer).toBe(
          part === 1 ? 'Antecedente' : 'Consecuente',
        )
      }
      const resolvedEn = resolveExerciseAnswer(exercise, 'en')
      expect(resolvedEn.mode).toBe('choice')
      if (resolvedEn.mode === 'choice') {
        expect(resolvedEn.answer).toBe(
          part === 1 ? 'Antecedent' : 'Consequent',
        )
      }
      expect(exercise.promptEs).toContain(`frase ${part}`)
      expect(exercise.explanationEs).toContain(
        part === 1 ? 'antecedente' : 'consecuente',
      )
    }
  })

  it('ajusta las opciones a la dificultad', () => {
    for (const difficulty of [1, 2, 3] as const) {
      const exercise = generate({ difficulty })
      expect(exercise.choices).toHaveLength(difficulty + 2)
      expect(new Set(exercise.choices).size).toBe(exercise.choices?.length)
      expect(exercise.choicesEn).toHaveLength(exercise.choices?.length ?? 0)
    }
  })

  it('genera la matriz completa con las preguntas de frase del período', () => {
    const all = generateFormAnalysisExercises({
      idPrefix: 'form-all',
      skillId: 'skill.musical-form',
    })
    expect(all).toHaveLength(
      FORM_ANALYSIS_TONICS.length * FORM_ANALYSIS_FORMS.length +
        FORM_ANALYSIS_TONICS.length * 2,
    )
    expect(all[0].id).toBe('form-all-001')
    expect(all.at(-1)?.id).toBe('form-all-084')
    expect(
      all.filter(
        (exercise) =>
          exercise.type === 'form-analysis' && exercise.ask === 'part',
      ),
    ).toHaveLength(24)

    const onlyBinary = generateFormAnalysisExercises({
      idPrefix: 'form-binary',
      skillId: 'skill.musical-form',
      forms: ['binary'],
      includeParts: false,
    })
    expect(onlyBinary).toHaveLength(FORM_ANALYSIS_TONICS.length)
    expect(
      onlyBinary.every(
        (exercise) =>
          exercise.type === 'form-analysis' && exercise.form === 'binary',
      ),
    ).toBe(true)

    const partial = generateFormAnalysisExercises({
      idPrefix: 'form-partial',
      skillId: 'skill.musical-form',
      tonics: ['C'],
      forms: ['rondo'],
      includeParts: false,
      count: 2,
    })
    expect(partial.map((exercise) => exercise.id)).toEqual([
      'form-partial-001',
      'form-partial-002',
    ])

    const empty = generateFormAnalysisExercises({
      idPrefix: 'form-empty',
      skillId: 'skill.musical-form',
      tonics: [],
    })
    expect(empty).toHaveLength(0)
  })

  it('es determinista y rechaza combinaciones inválidas', () => {
    const first = generate({ form: 'sonata', key: 'Bb', difficulty: 3 })
    const second = generate({ form: 'sonata', key: 'Bb', difficulty: 3 })
    expect(second).toEqual(first)

    expect(() => generate({ key: 'H' as Key })).toThrow()
    expect(() => generate({ form: 'march' as FormAnalysisForm })).toThrow()
    expect(() =>
      generate({ form: 'binary', ask: 'part', part: 1 }),
    ).toThrow()
    expect(() =>
      generate({ form: 'period', ask: 'part', part: 3 }),
    ).toThrow()
    expect(() =>
      generate({ form: 'period', ask: 'part', part: 0 }),
    ).toThrow()
  })
})
