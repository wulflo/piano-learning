import { describe, expect, it } from 'vitest'
import {
  rhythmicValueBeats,
  scoreToMeasures,
  scoreToTimeline,
  spelledPitchToMidi,
} from '../src/content/score'
import { resolveExerciseAnswer } from '../src/exercises/answer'
import {
  generateOrnamentExercise,
  generateOrnamentExercises,
  ORNAMENT_DIFFICULTIES,
  ORNAMENT_TONICS,
  type OrnamentDifficulty,
} from '../src/exercises/generators/ornament'
import { ORNAMENT_LABELS } from '../src/exercises/ornament-labels'
import { midiOf, toSpelledPitch } from '../src/theory/pitch'
import { scalePitches } from '../src/theory/scales'
import {
  ORNAMENT_VALUES,
  type Exercise,
  type Key,
  type Ornament,
} from '../src/schemas'

type OrnamentExercise = Extract<Exercise, { type: 'ornament-execution' }>
type SpelledPitch = OrnamentExercise['score']['events'][number]['pitches'][number]

const EXPECTED_EVENTS: Record<Ornament, number> = {
  trill: 9,
  mordent: 4,
  turn: 5,
  appoggiatura: 3,
}

const KEYWORDS: Record<Ornament, { es: string; en: string }> = {
  trill: { es: 'trino', en: 'trill' },
  mordent: { es: 'mordente', en: 'mordent' },
  turn: { es: 'grupeto', en: 'gruppetto' },
  appoggiatura: { es: 'apoyatura', en: 'appoggiatura' },
}

function generate(
  overrides: Partial<Parameters<typeof generateOrnamentExercise>[0]> = {},
): OrnamentExercise {
  const exercise = generateOrnamentExercise({
    id: 'test.ornament',
    skillId: 'skill.ornament',
    tonic: 'C',
    ornament: 'trill',
    ...overrides,
  })
  if (exercise.type !== 'ornament-execution') {
    throw new Error('Se esperaba un ejercicio de ornamentos')
  }
  return exercise
}

function pitchKey(pitch: SpelledPitch): string {
  return `${pitch.step}${pitch.accidental}${pitch.octave}`
}

function scaleFor(tonic: Key) {
  return scalePitches(tonic, 'major', { octave: 4 })
}

function expectedRealization(
  exercise: OrnamentExercise,
  scale: ReturnType<typeof scaleFor>,
): SpelledPitch[] {
  const events = exercise.score.events
  const first = events[0].pitches[0]
  const firstMidi = spelledPitchToMidi(first)

  const mainMidi =
    exercise.ornament === 'trill' || exercise.ornament === 'mordent'
      ? firstMidi
      : spelledPitchToMidi(events[1].pitches[0])

  const index = scale.findIndex((pitch) => midiOf(pitch) === mainMidi)
  expect(index).toBeGreaterThanOrEqual(1)
  expect(index).toBeLessThanOrEqual(5)

  const main = toSpelledPitch(scale[index])
  const upper = toSpelledPitch(scale[index + 1])
  const lower = toSpelledPitch(scale[index - 1])

  switch (exercise.ornament) {
    case 'trill':
      return [main, upper, main, upper, main, upper, main, upper, main]
    case 'mordent':
      return [main, lower, main, main]
    case 'turn':
      return [upper, main, lower, main, main]
    case 'appoggiatura': {
      const upperMidi = midiOf(scale[index + 1])
      const lowerMidi = midiOf(scale[index - 1])
      if (firstMidi === upperMidi) return [upper, main, main]
      if (firstMidi === lowerMidi) return [lower, main, main]
      throw new Error('La apoyatura no usa una vecina diatónica')
    }
  }
}

describe('F4-025 — generador de ejercicios de ornamentos', () => {
  it('genera los cuatro adornos en las doce tonalidades con notación correcta', () => {
    for (const tonic of ORNAMENT_TONICS) {
      const scale = scaleFor(tonic)
      const byMidi = new Map(
        scale.map((pitch) => [midiOf(pitch), toSpelledPitch(pitch)]),
      )

      for (const ornament of ORNAMENT_VALUES) {
        const exercise = generate({ tonic, ornament })

        expect(exercise.ornament).toBe(ornament)
        expect(exercise.score.key).toBe(tonic)
        expect(exercise.score.mode).toBe('major')
        expect(exercise.score.clef).toBe('treble')
        expect(exercise.score.timeSignature).toEqual({
          numerator: 4,
          denominator: 4,
        })
        expect(exercise.score.tempoBpm).toBe(76)
        expect(exercise.score.events).toHaveLength(EXPECTED_EVENTS[ornament])

        // Todas las alturas son diatónicas y usan la ortografía de la escala.
        for (const event of exercise.score.events) {
          const pitch = event.pitches[0]
          const expected = byMidi.get(spelledPitchToMidi(pitch))
          expect(expected).toBeDefined()
          expect(pitchKey(pitch)).toBe(pitchKey(expected!))
        }

        // La secuencia de notas realiza exactamente el adorno.
        expect(exercise.score.events.map((event) => pitchKey(event.pitches[0]))).toEqual(
          expectedRealization(exercise, scale).map(pitchKey),
        )

        // Cada compás queda completo, sin huecos ni solapes.
        for (const measure of [1, 2]) {
          const events = exercise.score.events
            .filter((event) => event.measure === measure)
            .sort((a, b) => a.beat - b.beat)
          let cursor = 0
          for (const event of events) {
            expect(event.beat).toBeCloseTo(cursor)
            cursor += rhythmicValueBeats(event.value)
          }
          expect(cursor).toBeCloseTo(4)
        }

        // La respuesta es la etiqueta canónica en los dos idiomas.
        const resolvedEs = resolveExerciseAnswer(exercise, 'es')
        const resolvedEn = resolveExerciseAnswer(exercise, 'en')
        expect(resolvedEs.mode).toBe('choice')
        expect(resolvedEn.mode).toBe('choice')
        if (resolvedEs.mode === 'choice') {
          expect(resolvedEs.answer).toBe(ORNAMENT_LABELS[ornament][0])
        }
        if (resolvedEn.mode === 'choice') {
          expect(resolvedEn.answer).toBe(ORNAMENT_LABELS[ornament][1])
        }

        expect(exercise.choices).toHaveLength(4)
        expect(exercise.choices).toContain(ORNAMENT_LABELS[ornament][0])
        expect(exercise.choicesEn).toHaveLength(4)
        expect(exercise.choicesEn).toContain(ORNAMENT_LABELS[ornament][1])
        expect(exercise.explanationEs.toLowerCase()).toContain(
          KEYWORDS[ornament].es,
        )
        expect((exercise.explanationEn ?? '').toLowerCase()).toContain(
          KEYWORDS[ornament].en,
        )
        expect(exercise.promptEs).toContain('mayor')
        expect(exercise.promptEn).toContain('major')
      }
    }
  })

  it('respeta la ortografía de las tonalidades con sostenidos y bemoles', () => {
    const fSharp = generate({ tonic: 'F#', ornament: 'trill' })
    const fSharpScale = scaleFor('F#')
    const fSharpByMidi = new Map(
      fSharpScale.map((pitch) => [midiOf(pitch), toSpelledPitch(pitch)]),
    )
    for (const event of fSharp.score.events) {
      const pitch = event.pitches[0]
      expect(pitchKey(pitch)).toBe(pitchKey(fSharpByMidi.get(spelledPitchToMidi(pitch))!))
    }
    expect(
      fSharp.score.events.some((event) => event.pitches[0].accidental === '#'),
    ).toBe(true)

    const flat = generate({ tonic: 'Bb', ornament: 'turn' })
    const flatScale = scaleFor('Bb')
    const flatByMidi = new Map(
      flatScale.map((pitch) => [midiOf(pitch), toSpelledPitch(pitch)]),
    )
    for (const event of flat.score.events) {
      const pitch = event.pitches[0]
      expect(pitchKey(pitch)).toBe(pitchKey(flatByMidi.get(spelledPitchToMidi(pitch))!))
    }
    expect(
      flat.score.events.some((event) => event.pitches[0].accidental === 'b'),
    ).toBe(true)
  })

  it('alterna la vecina superior e inferior en la apoyatura', () => {
    const directions = new Set<string>()
    for (let index = 0; index < 20; index += 1) {
      const exercise = generate({
        id: `appoggiatura-${index}`,
        ornament: 'appoggiatura',
      })
      const scale = scaleFor(exercise.score.key)
      const main = exercise.score.events[1].pitches[0]
      const mainIndex = scale.findIndex(
        (pitch) => midiOf(pitch) === spelledPitchToMidi(main),
      )
      const first = spelledPitchToMidi(exercise.score.events[0].pitches[0])
      const upper = midiOf(scale[mainIndex + 1])
      const lower = midiOf(scale[mainIndex - 1])

      if (first === upper) {
        directions.add('upper')
        expect(exercise.explanationEs).toContain('superior')
      } else if (first === lower) {
        directions.add('lower')
        expect(exercise.explanationEs).toContain('inferior')
      } else {
        throw new Error('La apoyatura no usa una vecina diatónica')
      }
    }
    expect(directions).toEqual(new Set(['upper', 'lower']))
  })

  it('ajusta el número de opciones a la dificultad sin duplicarlas', () => {
    for (const difficulty of ORNAMENT_DIFFICULTIES) {
      const exercise = generate({ difficulty })
      const expected = difficulty === 1 ? 3 : 4
      expect(exercise.choices).toHaveLength(expected)
      expect(exercise.choicesEn).toHaveLength(expected)
      expect(new Set(exercise.choices).size).toBe(expected)
      expect(new Set(exercise.choicesEn).size).toBe(expected)
      expect(exercise.choices).toContain(ORNAMENT_LABELS.trill[0])

      const index = exercise.choices?.indexOf(ORNAMENT_LABELS.trill[0]) ?? -1
      expect(exercise.choicesEn?.[index]).toBe(ORNAMENT_LABELS.trill[1])
    }
  })

  it('es determinista y rechaza entradas inválidas', () => {
    const first = generate({ tonic: 'Eb', ornament: 'turn', difficulty: 3 })
    const second = generate({ tonic: 'Eb', ornament: 'turn', difficulty: 3 })
    expect(second).toEqual(first)

    expect(() => generate({ tonic: 'H' as Key })).toThrow()
    expect(() => generate({ ornament: 'grace' as Ornament })).toThrow()
    expect(() =>
      generate({ difficulty: 0 as OrnamentDifficulty }),
    ).toThrow()
    expect(() =>
      generate({ difficulty: 4 as OrnamentDifficulty }),
    ).toThrow()
  })

  it('genera la matriz de 48 ejercicios y permite filtrar y recortar', () => {
    const all = generateOrnamentExercises({
      idPrefix: 'orn-all',
      skillId: 'skill.ornament',
    })
    expect(all).toHaveLength(ORNAMENT_TONICS.length * ORNAMENT_VALUES.length)
    expect(all).toHaveLength(48)
    expect(all[0].id).toBe('orn-all-001')
    expect(all.at(-1)?.id).toBe('orn-all-048')
    expect(all.every((exercise) => exercise.skillId === 'skill.ornament')).toBe(
      true,
    )
    for (const ornament of ORNAMENT_VALUES) {
      expect(
        all.filter(
          (exercise) =>
            exercise.type === 'ornament-execution' &&
            exercise.ornament === ornament,
        ),
      ).toHaveLength(ORNAMENT_TONICS.length)
    }

    const partial = generateOrnamentExercises({
      idPrefix: 'orn-partial',
      skillId: 'skill.ornament',
      tonics: ['C'],
      ornaments: ['mordent'],
      count: 2,
    })
    expect(partial.map((exercise) => exercise.id)).toEqual([
      'orn-partial-001',
      'orn-partial-002',
    ])
    expect(
      partial.every(
        (exercise) =>
          exercise.type === 'ornament-execution' &&
          exercise.ornament === 'mordent' &&
          exercise.score.key === 'C',
      ),
    ).toBe(true)

    const empty = generateOrnamentExercises({
      idPrefix: 'orn-empty',
      skillId: 'skill.ornament',
      tonics: [],
    })
    expect(empty).toHaveLength(0)
  })

  it('deja la realización lista para dibujar y tocar', () => {
    const exercise = generate({ tonic: 'D', ornament: 'turn' })
    const measures = scoreToMeasures(exercise.score)
    expect(measures).toHaveLength(exercise.score.events.length)

    const timeline = scoreToTimeline(exercise.score)
    expect(timeline).toHaveLength(exercise.score.events.length)
    expect(timeline[0].time).toBe(0)
    expect(timeline.at(-1)?.time).toBeGreaterThan(0)
    for (const [index, event] of timeline.entries()) {
      expect(event.duration).toBeGreaterThan(0)
      if (index > 0) {
        expect(event.time).toBeGreaterThanOrEqual(timeline[index - 1].time)
      }
    }
  })
})
