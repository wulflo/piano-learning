import { describe, expect, it } from 'vitest'
import {
  allPedagogicalFeedback,
  chordAskFeedbackCode,
  intervalQualityFeedback,
  intervalQualityFeedbackCode,
  pedagogicalFeedback,
  resolvePedagogicalFeedback,
  type TheoryErrorCode,
} from '../src/theory/errors'

const EXPECTED_CODES: TheoryErrorCode[] = [
  'note-name',
  'octave',
  'key-signature',
  'scale-degree',
  'scale-spelling',
  'interval-size',
  'interval-quality',
  'interval-perfect',
  'interval-major',
  'interval-minor',
  'interval-augmented',
  'interval-diminished',
  'chord-tone',
  'chord-quality',
  'chord-inversion',
  'chord-notation',
  'roman-numeral',
  'transposition',
  'rhythm-duration',
  'meter',
  'anacrusis',
  'sound-parameter',
  'dynamics',
  'articulation',
  'cadence',
  'borrowed-chord',
  'augmented-sixth',
  'pivot-chord',
  'motive-phrase',
  'form-period',
  'rondo-sonata',
  'texture',
  'counterpoint',
  'ornament',
  'secondary-dominant',
  'tempo',
  'form',
  'italian-terms',
  'hand-independence',
  'arpeggio-fingering',
  'pedal',
  'alberti',
  'walking-bass',
  'stride',
  'sight-reading',
  'ear-melody',
  'arpeggiated',
  'accompaniment',
  'style-pattern',
]

describe('errores pedagógicos «Recordá»', () => {
  it('cubre todos los códigos declarados', () => {
    expect(allPedagogicalFeedback().map((item) => item.code).sort()).toEqual(
      [...EXPECTED_CODES].sort(),
    )
    expect(allPedagogicalFeedback()).toHaveLength(EXPECTED_CODES.length)
  })

  it('cada error tiene regla y ejemplo no vacíos', () => {
    for (const code of EXPECTED_CODES) {
      const feedback = pedagogicalFeedback(code)
      expect(feedback.titleEs.trim().length).toBeGreaterThan(10)
      expect(feedback.ruleEs.trim().length).toBeGreaterThan(30)
      expect(feedback.exampleEs.trim().length).toBeGreaterThan(10)
      expect(feedback.titleEs.toLowerCase()).toContain('record')
    }
  })

  it('incluye contenido específico y no genérico', () => {
    expect(pedagogicalFeedback('key-signature').ruleEs).toContain('Fa, Do, Sol')
    expect(pedagogicalFeedback('interval-quality').ruleEs).toContain('justas')
    expect(pedagogicalFeedback('chord-tone').ruleEs).toContain('apilando terceras')
    expect(pedagogicalFeedback('chord-tone').exampleEs).toContain('Si♭ (7m)')
    expect(pedagogicalFeedback('chord-inversion').exampleEs).toContain(
      'Si, Do, Mi, Sol (tercera)',
    )
    expect(pedagogicalFeedback('chord-notation').exampleEs).toContain('Gm7/D')
    expect(pedagogicalFeedback('roman-numeral').exampleEs).toContain('Sol mayor')
    expect(pedagogicalFeedback('sound-parameter').ruleEs).toContain('timbre')
    expect(pedagogicalFeedback('dynamics').ruleEs).toContain('pianissimo')
    expect(pedagogicalFeedback('tempo').exampleEs).toContain('allegro')
    expect(pedagogicalFeedback('form').ruleEs).toContain('coda')
    expect(pedagogicalFeedback('ear-melody').ruleEs).toContain('cinco pasos')
    expect(pedagogicalFeedback('ear-melody').exampleEs).toContain('1-2-3-5')
    expect(pedagogicalFeedback('ear-melody').ruleEn).toContain('five steps')
  })

  it('resuelve el feedback de un error por tipo de ejercicio', () => {
    expect(resolvePedagogicalFeedback({ exerciseType: 'note-keyboard' }).titleEs).toContain(
      'Recordá',
    )
    expect(resolvePedagogicalFeedback({ exerciseType: 'scale-spelling' }).titleEs).toContain(
      'Recordá',
    )
    expect(resolvePedagogicalFeedback({ exerciseType: 'key-signature' }).titleEs).toContain(
      'Recordá',
    )
    expect(resolvePedagogicalFeedback({ exerciseType: 'transposition' }).titleEs).toContain(
      'Recordá',
    )
    expect(resolvePedagogicalFeedback({ exerciseType: 'sound-parameter' }).titleEs).toContain(
      'parámetros',
    )
    expect(resolvePedagogicalFeedback({ exerciseType: 'dynamic-mark' }).titleEs).toContain(
      'dinámicas',
    )
    expect(resolvePedagogicalFeedback({ exerciseType: 'playback-order' }).titleEs).toContain(
      'secciones',
    )
  })

  it('prefiere el código explícito sobre el derivado del tipo', () => {
    expect(resolvePedagogicalFeedback({ code: 'octave', exerciseType: 'chord' }).titleEs).toContain(
      'Recordá',
    )
    expect(resolvePedagogicalFeedback({ code: 'scale-spelling', exerciseType: 'note-keyboard' }).ruleEs).toContain(
      'siete letras',
    )
  })

  it('asigna una regla propia a cada calidad de intervalo', () => {
    expect(intervalQualityFeedbackCode('perfect')).toBe('interval-perfect')
    expect(intervalQualityFeedbackCode('major')).toBe('interval-major')
    expect(intervalQualityFeedbackCode('minor')).toBe('interval-minor')
    expect(intervalQualityFeedbackCode('augmented')).toBe('interval-augmented')
    expect(intervalQualityFeedbackCode('diminished')).toBe('interval-diminished')
    // Las calidades dobles se explican con el paso simple más cercano.
    expect(intervalQualityFeedbackCode('doubly-augmented')).toBe(
      'interval-augmented',
    )
    expect(intervalQualityFeedbackCode('doubly-diminished')).toBe(
      'interval-diminished',
    )
  })

  it('cada calidad tiene regla y ejemplo con semitonos concretos', () => {
    const perfect = intervalQualityFeedback('perfect')
    expect(perfect.titleEs).toBe('Recordá los intervalos justos')
    expect(perfect.ruleEs).toContain('cuarta justa 5')
    expect(perfect.exampleEs).toContain('Fa4')

    const major = intervalQualityFeedback('major')
    expect(major.titleEs).toBe('Recordá los intervalos mayores')
    expect(major.ruleEs).toContain('tercera mayor 4')
    expect(major.exampleEs).toContain('Re4')

    const minor = intervalQualityFeedback('minor')
    expect(minor.titleEs).toBe('Recordá los intervalos menores')
    expect(minor.ruleEs).toContain('tercera menor 3')
    expect(minor.exampleEs).toContain('Mi♭4')

    const augmented = intervalQualityFeedback('augmented')
    expect(augmented.titleEs).toBe('Recordá los intervalos aumentados')
    expect(augmented.ruleEs).toContain('semitono más ancho')
    expect(augmented.exampleEs).toContain('Fa♯4')

    const diminished = intervalQualityFeedback('diminished')
    expect(diminished.titleEs).toBe('Recordá los intervalos disminuidos')
    expect(diminished.ruleEs).toContain('semitono más angosto')
    expect(diminished.exampleEs).toContain('Sol♭4')
  })

  it('resuelve la calidad del intervalo antes que el tipo genérico', () => {
    expect(
      resolvePedagogicalFeedback({
        exerciseType: 'interval',
        intervalQuality: 'major',
      }).titleEs,
    ).toBe('Recordá los intervalos mayores')
    expect(
      resolvePedagogicalFeedback({
        exerciseType: 'interval',
        intervalQuality: 'diminished',
      }).titleEs,
    ).toBe('Recordá los intervalos disminuidos')
    expect(
      resolvePedagogicalFeedback({
        code: 'interval-size',
        exerciseType: 'interval',
        intervalQuality: 'perfect',
      }).titleEs,
    ).toBe('Recordá contar la cantidad del intervalo')
  })

  it('elige la regla del acorde según lo que pregunta el ejercicio', () => {
    expect(chordAskFeedbackCode('quality')).toBe('chord-quality')
    expect(chordAskFeedbackCode('inversion')).toBe('chord-inversion')
    expect(chordAskFeedbackCode('notes')).toBe('chord-tone')
    expect(chordAskFeedbackCode('symbol')).toBe('chord-notation')

    expect(
      resolvePedagogicalFeedback({
        exerciseType: 'chord',
        chordAsk: 'notes',
      }).titleEs,
    ).toBe('Recordá cómo se construye un acorde')
    expect(
      resolvePedagogicalFeedback({
        exerciseType: 'chord',
        chordAsk: 'inversion',
      }).titleEs,
    ).toBe('Recordá qué nota queda en el bajo')
    expect(
      resolvePedagogicalFeedback({
        exerciseType: 'chord',
        chordAsk: 'symbol',
      }).titleEs,
    ).toBe('Recordá leer y escribir cifrados')
    expect(
      resolvePedagogicalFeedback({
        exerciseType: 'chord',
        chordAsk: 'quality',
      }).titleEs,
    ).toBe('Recordá distinguir la calidad')
  })

  it('mantiene el código explícito por encima del acorde', () => {
    expect(
      resolvePedagogicalFeedback({
        code: 'chord-quality',
        exerciseType: 'chord',
        chordAsk: 'notes',
      }).titleEs,
    ).toBe('Recordá distinguir la calidad')
  })
})
