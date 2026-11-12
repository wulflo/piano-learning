import { describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { validateContentBundle } from '../src/content/validate'
import {
  isExerciseAnswerCorrect,
  normalizeExerciseText,
  resolveExerciseAnswer,
} from '../src/exercises/answer'
import { canonicalScaleSpelling } from '../src/exercises/generators/scale-spelling'
import { ExerciseSchema, type Exercise, type ExerciseType } from '../src/schemas'

async function realExercises(): Promise<Exercise[]> {
  const raw = await loadContentFromDisk()
  const result = validateContentBundle(raw)
  if (!result.bundle) throw new Error('El contenido real debería validar')
  return result.bundle.exercises
}

async function byType(): Promise<Map<ExerciseType, Exercise[]>> {
  const exercises = await realExercises()
  const groups = new Map<ExerciseType, Exercise[]>()
  for (const exercise of exercises) {
    const list = groups.get(exercise.type) ?? []
    list.push(exercise)
    groups.set(exercise.type, list)
  }
  return groups
}

describe('F2-072a — Resolución de respuestas', () => {
  it('resuelve todos los ejercicios del contenido', async () => {
    const exercises = await realExercises()
    expect(exercises.length).toBeGreaterThan(0)

    for (const exercise of exercises) {
      const resolved = resolveExerciseAnswer(exercise)
      if (exercise.type === 'tempo-stability') {
        expect(resolved.mode).toBe('practice')
        continue
      }

      expect(resolved.mode, exercise.id).not.toBe('practice')
      if (resolved.mode === 'practice') continue
      expect(
        isExerciseAnswerCorrect(exercise, resolved.answer),
        `${exercise.id}: ${resolved.answer}`,
      ).toBe(true)

      if (resolved.mode === 'choice') {
        expect(
          'choices' in exercise ? exercise.choices : undefined,
          exercise.id,
        ).toContain(resolved.answer)
      }

      const choices =
        'choices' in exercise && exercise.choices !== undefined
          ? exercise.choices
          : null
      if (choices !== null) {
        expect(resolved.mode, `${exercise.id} debería usar sus opciones`).toBe(
          'choice',
        )
      }
    }
  })

  it('coincide con el deletreo canónico de cada escala del contenido', async () => {
    const exercises = await realExercises()
    for (const exercise of exercises) {
      if (exercise.type !== 'scale-spelling') continue
      const canonical = canonicalScaleSpelling(exercise.tonic, exercise.mode)
      const resolved = resolveExerciseAnswer(exercise)
      expect(resolved.mode, exercise.id).not.toBe('practice')
      if (resolved.mode === 'practice') continue
      expect(normalizeExerciseText(resolved.answer), exercise.id).toBe(
        normalizeExerciseText(canonical),
      )
      expect(isExerciseAnswerCorrect(exercise, canonical), exercise.id).toBe(
        true,
      )
    }
  })

  it('cubre cada tipo de ejercicio escrito a mano', async () => {
    const groups = await byType()
    expect([...groups.keys()].sort()).toEqual(
      [
        'anacrusis-completion',
        'articulation',
        'augmented-sixth',
        'borrowed-chord',
        'cadence',
        'chord',
        'chord-notation',
        'dynamic-mark',
        'ear-chord',
        'ear-interval',
        'ear-melody',
        'ear-progression',
        'ear-scale',
        'form-analysis',
        'harmonic-function',
        'interval',
        'italian-term',
        'key-signature',
        'meter-accent',
        'note-keyboard',
        'note-staff',
        'phrase-analysis',
        'pivot-chord',
        'playback-order',
        'progression-completion',
        'rhythm-completion',
        'rhythm-dictation',
        'roman-numeral',
        'scale-spelling',
        'secondary-dominant',
        'sound-parameter',
        'tempo-stability',
        'tempo-term',
        'texture-analysis',
        'counterpoint-analysis',
        'ornament-execution',
        'hand-coordination',
        'arpeggio',
        'pedal',
        'alberti',
        'walking-bass',
        'stride',
        'sight-reading',
        'transposition',
        'arpeggiated',
        'accompaniment',
        'style-pattern',
      ].sort(),
    )

    for (const [type, exercises] of groups) {
      const exercise = exercises[0]
      if (exercise === undefined) throw new Error(`Sin ejercicios de ${type}`)
      const resolved = resolveExerciseAnswer(exercise)
      expect(resolved.mode, type).toBe(
        type === 'tempo-stability' ? 'practice' : resolved.mode,
      )
      if (type !== 'tempo-stability') {
        expect(resolved.mode, type).not.toBe('practice')
      }
    }
  })

  it('corrige muestras de varios tipos con sus respuestas canónicas', async () => {
    const exercises = await realExercises()
    const byId = new Map(exercises.map((exercise) => [exercise.id, exercise]))
    const expected: Record<string, string> = {
      'ex.m0-01.a': 'Do',
      'ex.m0-02.c': 'Sol4',
      'ex.m1-01.a': 'Altura (agudo/grave)',
      'ex.m1-03.a': 'Semitono',
      'ex.m1-04.a': 'Blanca',
      'ex.m1-04.i': 'Blanca, Corchea, Corchea, Negra',
      'ex.m1-05.g': '1 fuerte; 2 débil',
      'ex.m1-08.c': 'Negra',
      'ex.m1-09.a': 'Adagio',
      'ex.m1-10.a': 'pp',
      'ex.m1-10.d': 'Legato',
      'ex.m1-11.a': 'A A B',
      'ex.m1-12.a': 'Lento y tranquilo',
      'ex.m2-01.m': '1 sola nota con sostenido (F#)',
      'ex.m2-03.a': 'Menor',
      'ex.m2-07.a': 'V',
      'ex.m2-07.m': 'I IV V I',
      'ex.m2-08.a': 'Lídio',
      'ex.m2-10.a': 'C Eb F Gb G Bb C',
      'ex.m7-02.a': '1-2-3-5',
      'ex.m7-02.b': 'Sol4 Si4 Re5 Sol5',
      'ex.m7-02.i': '2-1-2-4-1-2-4',
      'ex.m7-03.a': 'Pisar el pedal',
      'ex.m7-03.b': 'Cambiar el pedal',
      'ex.m7-03.f': 'Pedal sincopado',
      'ex.m7-04.a': 'Acordes redondos',
      'ex.m7-04.e': 'Bajo y acorde',
      'ex.m7-04.g': 'F',
      'ex.m7-05.a': 'Patrón de 3 notas',
      'ex.m7-05.b': 'Sol3 Re4 Si3 Re4',
      'ex.m7-05.d': 'Patrón de 4 notas',
      'ex.m7-06.a': 'Alberti',
      'ex.m7-06.b': 'Sol3 Re4 Si3 Re4',
      'ex.m7-06.d': 'Alberti',
      'ex.m7-07.a': 'Sol♯3',
      'ex.m7-07.b': 'Nota del acorde',
      'ex.m7-07.h': 'Nota de paso',
      'ex.m7-08.a': 'Stride',
      'ex.m7-08.b': 'Re3',
      'ex.m7-08.d': 'Do♯3',
      'ex.m7-09.a': 'segunda mayor',
      'ex.m7-09.b': 'Baja por grado conjunto',
      'ex.m7-09.d': 'Do♯3',
    }

    for (const [id, answer] of Object.entries(expected)) {
      const exercise = byId.get(id)
      if (exercise === undefined) throw new Error(`Falta ${id}`)
      const resolved = resolveExerciseAnswer(exercise)
      expect(resolved.mode, id).not.toBe('practice')
      if (resolved.mode === 'practice') continue
      expect(normalizeExerciseText(resolved.answer), id).toBe(
        normalizeExerciseText(answer),
      )
      expect(isExerciseAnswerCorrect(exercise, answer), id).toBe(true)
    }
  })

  it('rechaza respuestas incorrectas y acepta la ortografía normalizada', async () => {
    const exercises = await realExercises()
    const scale = exercises.find((exercise) => exercise.id === 'ex.m2-08.b')
    if (scale === undefined) throw new Error('Falta ex.m2-08.b')

    expect(
      isExerciseAnswerCorrect(scale, 'c d eb f g a bb c'),
    ).toBe(true)
    expect(
      isExerciseAnswerCorrect(scale, 'C D E F G A B C'),
    ).toBe(false)
  })

  it('marca la estabilidad de tempo como práctica sin respuesta única', async () => {
    const exercises = await realExercises()
    const stability = exercises.filter(
      (exercise) => exercise.type === 'tempo-stability',
    )
    expect(stability).toHaveLength(3)

    for (const exercise of stability) {
      expect(resolveExerciseAnswer(exercise)).toEqual({ mode: 'practice' })
      expect(isExerciseAnswerCorrect(exercise, 'estable')).toBe(false)
    }
  })

  it('resuelve los tipos que todavía no tienen contenido escrito', () => {
    const base = {
      skillId: 'skill.test',
      promptEs: 'Pregunta de prueba',
      explanationEs: 'Explicación de prueba',
      difficulty: 1,
    }
    const c4 = { step: 'C', accidental: '', octave: 4 }
    const melodyScore = {
      clef: 'treble',
      key: 'C',
      mode: 'major',
      timeSignature: { numerator: 4, denominator: 4 },
      tempoBpm: 60,
      events: [
        {
          id: 'test.score.1',
          measure: 1,
          beat: 0,
          value: { duration: 'quarter' },
          pitches: [c4],
          hand: 'right',
        },
        {
          id: 'test.score.2',
          measure: 1,
          beat: 1,
          value: { duration: 'quarter' },
          pitches: [{ step: 'E', accidental: '', octave: 4 }],
          hand: 'right',
        },
        {
          id: 'test.score.3',
          measure: 1,
          beat: 2,
          value: { duration: 'quarter' },
          pitches: [{ step: 'G', accidental: '', octave: 4 }],
          hand: 'right',
        },
      ],
    }
    const fixtures: Array<{
      raw: unknown
      expected: string
      wrong: string
    }> = [
      {
        raw: {
          ...base,
          id: 'test.chord',
          type: 'chord',
          root: c4,
          quality: 'major',
          choices: ['Mayor', 'Menor'],
        },
        expected: 'Mayor',
        wrong: 'Menor',
      },
      {
        raw: {
          ...base,
          id: 'test.chord-inversion',
          type: 'chord',
          root: c4,
          quality: 'major',
          inversion: 1,
          ask: 'inversion',
          choices: ['estado fundamental', 'primera inversión', 'segunda inversión'],
        },
        expected: 'primera inversión',
        wrong: 'estado fundamental',
      },
      {
        raw: {
          ...base,
          id: 'test.chord-notes',
          type: 'chord',
          root: c4,
          quality: 'major7',
          ask: 'notes',
        },
        expected: 'Do Mi Sol Si',
        wrong: 'Do Mi Sol Si♭',
      },
      {
        raw: {
          ...base,
          id: 'test.chord-slash-notes',
          type: 'chord',
          root: c4,
          quality: 'major',
          slash: { step: 'D', accidental: '', octave: 4 },
          ask: 'notes',
        },
        expected: 'Re Do Mi Sol',
        wrong: 'Do Re Mi Sol',
      },
      {
        raw: {
          ...base,
          id: 'test.chord-slash-symbol',
          type: 'chord',
          root: c4,
          quality: 'major',
          slash: { step: 'E', accidental: '', octave: 4 },
          ask: 'symbol',
          choices: ['Do/Mi', 'Do/Sol', 'Do/Re'],
          choicesEn: ['C/E', 'C/G', 'C/D'],
        },
        expected: 'Do/Mi',
        wrong: 'Do/Sol',
      },
      {
        raw: {
          ...base,
          id: 'test.chord-notation-choice',
          type: 'chord-notation',
          symbol: 'Do7/Solm',
          to: 'c',
          choices: ['C7/Gm', 'Cm7/G', 'C7/Do'],
        },
        expected: 'C7/Gm',
        wrong: 'Cm7/G',
      },
      {
        raw: {
          ...base,
          id: 'test.chord-notation-text',
          type: 'chord-notation',
          symbol: 'C7/Gm',
          to: 'do',
        },
        expected: 'Do7/Solm',
        wrong: 'Do7/Gm',
      },
      {
        raw: {
          ...base,
          id: 'test.roman-numeral-case',
          type: 'roman-numeral',
          key: 'A',
          mode: 'minor',
          numeral: 'V',
          choices: ['v', 'V', 'VII'],
        },
        expected: 'V',
        wrong: 'v',
      },
      {
        raw: {
          ...base,
          id: 'test.harmonic-function',
          type: 'harmonic-function',
          key: 'C',
          mode: 'major',
          degree: 4,
          choices: [
            'Tónica (T)',
            'Subdominante (S)',
            'Dominante (D)',
          ],
        },
        expected: 'Subdominante (S)',
        wrong: 'Dominante (D)',
      },
      {
        raw: {
          ...base,
          id: 'test.cadence',
          type: 'cadence',
          key: 'C',
          mode: 'major',
          fromDegree: 5,
          toDegree: 6,
          choices: [
            'Auténtica (V-I)',
            'Plagal (IV-I)',
            'Semicadencia (…-V)',
            'Rota (V-vi)',
          ],
        },
        expected: 'Rota (V-vi)',
        wrong: 'Auténtica (V-I)',
      },
      {
        raw: {
          ...base,
          id: 'test.pivot-chord',
          type: 'pivot-chord',
          fromKey: 'C',
          toKey: 'G',
          degreeFrom: 6,
          degreeTo: 2,
          ask: 'target',
          choices: ['ii', 'vi', 'V', 'iii'],
        },
        expected: 'ii',
        wrong: 'vi',
      },
      {
        raw: {
          ...base,
          id: 'test.borrowed-chord',
          type: 'borrowed-chord',
          key: 'C',
          mode: 'major',
          numeral: 'bVI',
          choices: ['bVI', 'vi', 'IV', 'bIII'],
        },
        expected: 'bVI',
        wrong: 'vi',
      },
      {
        raw: {
          ...base,
          id: 'test.secondary-dominant',
          type: 'secondary-dominant',
          key: 'C',
          mode: 'major',
          target: 2,
          ask: 'numeral',
          choices: ['V/V', 'V/ii', 'V/vi', 'V/IV'],
        },
        expected: 'V/ii',
        wrong: 'V/V',
      },
      {
        raw: {
          ...base,
          id: 'test.transposition',
          type: 'transposition',
          fromKey: 'C',
          toKey: 'D',
          melody: [c4],
          answer: [{ step: 'D', accidental: '', octave: 4 }],
          choices: ['D4', 'C4', 'E4'],
        },
        expected: 'D4',
        wrong: 'C4',
      },
      {
        raw: {
          ...base,
          id: 'test.ear-melody',
          type: 'ear-melody',
          score: melodyScore,
          ask: 'note',
          from: 0,
          to: 2,
          choices: ['Sol4', 'Do4', 'Mi4'],
        },
        expected: 'Sol4',
        wrong: 'Do4',
      },
      {
        raw: {
          ...base,
          id: 'test.progression',
          type: 'progression-completion',
          key: 'C',
          mode: 'major',
          degrees: ['I', 'IV', 'V', 'I'],
          missingIndex: 2,
          choices: ['V', 'vi', 'IV'],
        },
        expected: 'V',
        wrong: 'vi',
      },
      {
        raw: {
          ...base,
          id: 'test.sound-parameter',
          type: 'sound-parameter',
          parameter: 'pitch',
          exampleA: { midi: 60, beats: 1, velocity: 80, timbre: 'piano' },
          exampleB: { midi: 61, beats: 1, velocity: 80, timbre: 'piano' },
          choices: [
            'La altura (un semitono)',
            'La duración (corto/largo)',
            'La intensidad (suave/fuerte)',
            'El timbre (color del sonido)',
          ],
        },
        expected: 'La altura (un semitono)',
        wrong: 'El timbre (color del sonido)',
      },
      {
        raw: {
          ...base,
          id: 'test.key-to-signature',
          type: 'key-signature',
          key: 'A',
          mode: 'major',
          direction: 'key-to-signature',
          choices: ['3 sostenidos', '2 sostenidos', 'Sin alteraciones'],
        },
        expected: '3 sostenidos',
        wrong: '2 sostenidos',
      },
      {
        raw: {
          ...base,
          id: 'test.signature-to-key',
          type: 'key-signature',
          key: 'D',
          mode: 'major',
          direction: 'signature-to-key',
          choices: ['Re mayor', 'Si menor', 'Sol mayor'],
        },
        expected: 'Re mayor',
        wrong: 'Sol mayor',
      },
      {
        raw: {
          ...base,
          id: 'test.ear-interval',
          type: 'ear-interval',
          lower: c4,
          upper: { step: 'E', accidental: '', octave: 4 },
          direction: 'ascending',
          choices: ['Tercera mayor', 'Quinta justa', 'Tercera menor'],
        },
        expected: 'Tercera mayor',
        wrong: 'Quinta justa',
      },
      {
        raw: {
          ...base,
          id: 'test.ear-chord',
          type: 'ear-chord',
          quality: 'minor',
          choices: ['Menor', 'Mayor'],
        },
        expected: 'Menor',
        wrong: 'Mayor',
      },
      {
        raw: {
          ...base,
          id: 'test.ear-progression',
          type: 'ear-progression',
          key: 'C',
          mode: 'major',
          degrees: ['I', 'IV', 'V', 'I'],
          choices: ['I IV V I', 'I V vi IV', 'I IV I V'],
        },
        expected: 'I IV V I',
        wrong: 'I V vi IV',
      },
    ]

    for (const { raw, expected, wrong } of fixtures) {
      const exercise = ExerciseSchema.parse(raw)
      const resolved = resolveExerciseAnswer(exercise)
      expect(resolved.mode, exercise.id).not.toBe('practice')
      if (resolved.mode === 'practice') continue
      expect(resolved.answer, exercise.id).toBe(expected)
      expect(isExerciseAnswerCorrect(exercise, expected), exercise.id).toBe(
        true,
      )
      expect(isExerciseAnswerCorrect(exercise, wrong), exercise.id).toBe(false)
    }
  })
})
