import { describe, expect, it } from 'vitest'
import {
  LETTERS,
  cadenceName,
  cadenceTypeFor,
  chordDegreeInKey,
  chordPitches,
  diatonicChord,
  diatonicChords,
  functionsForMode,
  harmonicFunctionName,
  intervalBetween,
  isDiatonicChord,
  parseRomanNumeral,
  parsePitch,
  qualitiesForMode,
  romanChordSymbol,
  romanNumeralFor,
  romanToChord,
  scaleDegree,
  scaleNotes,
  secondaryDominantNumeral,
  type CadenceType,
  type ChordQuality,
  type DiatonicMode,
  type HarmonicFunction,
  type Pitch,
} from '../src/theory'
import { midiOf, mod12 } from '../src/theory/pitch'

/**
 * F4-029 — Armonía en las doce tonalidades.
 *
 * Recorre las doce tónicas con las que trabaja el curso y comprueba, desde el
 * motor de teoría y no desde el contenido, que los grados diatónicos tienen la
 * cualidad, el cifrado, la función y la ortografía correctas en mayor, menor
 * natural y menor armónica; que las cuatro cadencias se clasifican bien y usan
 * la sensible de la dominante en menor; y que los dominantes secundarios se
 * construyen una quinta arriba del grado que tonicizan, con su tercera como
 * sensible y su séptima resolviendo por semitono.
 *
 * Las cadencias y los dominantes secundarios usan las doce tonalidades de los
 * generadores armónicos, que escriben Re♭ en lugar de Do♯. Los grados
 * diatónicos usan la lista canónica de la teoría, con Do♯. Ambas listas cubren
 * las doce clases de altura.
 */

const THEORY_TONICS = [
  'C',
  'G',
  'D',
  'A',
  'E',
  'B',
  'F#',
  'C#',
  'F',
  'Bb',
  'Eb',
  'Ab',
] as const

/** Las doce tonalidades que usan los generadores de cadencias y dominantes. */
const GENERATOR_TONICS = [
  'C',
  'G',
  'D',
  'A',
  'E',
  'B',
  'F#',
  'F',
  'Bb',
  'Eb',
  'Ab',
  'Db',
] as const

const MODES: DiatonicMode[] = ['major', 'natural-minor', 'harmonic-minor']

const EXPECTED_QUALITIES: Record<DiatonicMode, ChordQuality[]> = {
  major: ['major', 'minor', 'minor', 'major', 'major', 'minor', 'diminished'],
  'natural-minor': [
    'minor',
    'diminished',
    'major',
    'minor',
    'minor',
    'major',
    'major',
  ],
  'harmonic-minor': [
    'minor',
    'diminished',
    'augmented',
    'minor',
    'major',
    'major',
    'diminished',
  ],
}

const EXPECTED_ROMANS: Record<DiatonicMode, string[]> = {
  major: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'],
  'natural-minor': ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'],
  'harmonic-minor': ['i', 'ii°', 'III+', 'iv', 'V', 'VI', 'vii°'],
}

const EXPECTED_FUNCTIONS: Record<DiatonicMode, HarmonicFunction[]> = {
  major: [
    'tonic',
    'subdominant',
    'tonic',
    'subdominant',
    'dominant',
    'tonic',
    'dominant',
  ],
  'natural-minor': [
    'tonic',
    'subdominant',
    'tonic',
    'subdominant',
    'dominant',
    'subdominant',
    'dominant',
  ],
  'harmonic-minor': [
    'tonic',
    'subdominant',
    'tonic',
    'subdominant',
    'dominant',
    'subdominant',
    'dominant',
  ],
}

const CADENCE_TYPES: CadenceType[] = [
  'authentic',
  'plagal',
  'half',
  'deceptive',
]

/**
 * Grados de cada cadencia tal como los genera la app: la semicadencia sale del
 * ii en mayor y de la tónica en menor. Las cadencias menores usan la escala
 * armónica para que la dominante tenga sensible.
 */
const CADENCE_DEGREES: Record<
  'major' | 'harmonic-minor',
  Record<CadenceType, { from: number; to: number }>
> = {
  major: {
    authentic: { from: 5, to: 1 },
    plagal: { from: 4, to: 1 },
    half: { from: 2, to: 5 },
    deceptive: { from: 5, to: 6 },
  },
  'harmonic-minor': {
    authentic: { from: 5, to: 1 },
    plagal: { from: 4, to: 1 },
    half: { from: 1, to: 5 },
    deceptive: { from: 5, to: 6 },
  },
}

const CADENCE_QUALITIES: Record<
  'major' | 'harmonic-minor',
  Record<CadenceType, readonly [ChordQuality, ChordQuality]>
> = {
  major: {
    authentic: ['major', 'major'],
    plagal: ['major', 'major'],
    half: ['minor', 'major'],
    deceptive: ['major', 'minor'],
  },
  'harmonic-minor': {
    authentic: ['major', 'minor'],
    plagal: ['minor', 'minor'],
    half: ['minor', 'major'],
    deceptive: ['major', 'major'],
  },
}

/** Nombre con alteraciones y sin octava: la enarmonía sí importa. */
function spelling(pitch: Pitch): string {
  const accidental =
    pitch.accidental === 0
      ? ''
      : pitch.accidental === 1
        ? '#'
        : pitch.accidental === -1
          ? 'b'
          : pitch.accidental === 2
            ? '##'
            : 'bb'
  return `${pitch.step}${accidental}`
}

function letterIndex(step: string): number {
  return LETTERS.indexOf(step as (typeof LETTERS)[number])
}

function tonicPitch(tonic: string): string {
  return `${tonic}4`
}

describe('F4-029 — Armonía en 12 tonalidades', () => {
  it('cubre las doce clases de altura con las dos grafías', () => {
    const classes = (tonics: readonly string[]): number[] =>
      [...new Set(tonics.map((tonic) => mod12(midiOf(parsePitch(`${tonic}4`)))))].sort(
        (first, second) => first - second,
      )

    expect(classes(THEORY_TONICS)).toHaveLength(12)
    expect(classes(GENERATOR_TONICS)).toHaveLength(12)
    expect(classes(THEORY_TONICS)).toEqual(classes(GENERATOR_TONICS))
  })

  it('arma los siete grados con cualidad, cifrado y función correctos', () => {
    for (const mode of MODES) {
      expect(qualitiesForMode(mode), mode).toEqual(EXPECTED_QUALITIES[mode])
      expect(functionsForMode(mode), mode).toEqual(EXPECTED_FUNCTIONS[mode])

      for (const tonic of THEORY_TONICS) {
        const scale = scaleNotes(tonicPitch(tonic), mode)
        const chords = diatonicChords(tonicPitch(tonic), mode)
        expect(chords, `${tonic} ${mode}`).toHaveLength(7)

        for (const [index, chord] of chords.entries()) {
          const degree = index + 1
          const label = `${tonic} ${mode} grado ${degree}`

          expect(chord.degree, label).toBe(degree)
          expect(chord.quality, label).toBe(EXPECTED_QUALITIES[mode][index])
          expect(chord.roman, label).toBe(EXPECTED_ROMANS[mode][index])
          expect(chord.roman, label).toBe(
            romanNumeralFor(degree, chord.quality),
          )
          expect(chord.func, label).toBe(EXPECTED_FUNCTIONS[mode][index])
          expect(chord.root, label).toEqual(scale[index]!.pitch)

          // El cifrado y el símbolo se derivan del mismo grado y coinciden.
          expect(chord.symbol, label).toBe(
            romanChordSymbol(chord.roman, tonicPitch(tonic), mode),
          )
          expect(chord.symbol.startsWith(chord.root.step), label).toBe(true)

          // La tríada se arma con los grados 1, 3 y 5 de la escala, sin
          // cambiar la letra de cada voz.
          const expectedPitches = [0, 2, 4].map(
            (offset) => scale[(index + offset) % 7]!.pitch,
          )
          expect(chord.pitches.map(spelling), label).toEqual(
            expectedPitches.map(spelling),
          )
          expect(chord.pitches.map((pitch) => mod12(midiOf(pitch))), label).toEqual(
            expectedPitches.map((pitch) => mod12(midiOf(pitch))),
          )
        }
      }
    }
  })

  it('reconoce cada grado y rechaza los acordes cromáticos', () => {
    for (const mode of MODES) {
      for (const tonic of THEORY_TONICS) {
        const chords = diatonicChords(tonicPitch(tonic), mode)
        const label = `${tonic} ${mode}`

        for (const chord of chords) {
          expect(
            isDiatonicChord(tonicPitch(tonic), mode, chord.root, chord.quality),
            `${label} grado ${chord.degree}`,
          ).toBe(true)
          expect(
            chordDegreeInKey(tonicPitch(tonic), mode, chord.root),
            `${label} grado ${chord.degree}`,
          ).toBe(chord.degree)

          // Volver del numeral al acorde conserva letras y clases de altura.
          const fromRoman = romanToChord(tonicPitch(tonic), mode, chord.roman)
          expect(
            fromRoman.pitches.map(spelling),
            `${label} ${chord.roman}`,
          ).toEqual(chord.pitches.map(spelling))
          expect(
            fromRoman.pitches.map((pitch) => mod12(midiOf(pitch))),
            `${label} ${chord.roman}`,
          ).toEqual(chord.pitches.map((pitch) => mod12(midiOf(pitch))))
          expect(
            parseRomanNumeral(chord.roman),
            `${label} ${chord.roman}`,
          ).toMatchObject({
            degree: chord.degree,
            quality: chord.quality,
          })
        }

        // La tónica subida un semitono y su tríada mayor no pertenecen a la
        // escala. La alteración se escribe sobre la misma letra para no
        // depender de la enarmonía que elija `transposePitch`.
        const root = scaleDegree(tonicPitch(tonic), mode, 1)
        const raised: Pitch = { ...root, accidental: root.accidental + 1 }
        expect(
          isDiatonicChord(tonicPitch(tonic), mode, raised, 'major'),
          `${label} cromatismo`,
        ).toBe(false)
        expect(
          chordDegreeInKey(tonicPitch(tonic), mode, raised),
          `${label} cromatismo`,
        ).toBeNull()
      }
    }

    expect(() => diatonicChord('C4', 'major', 0)).toThrow()
    expect(() => diatonicChord('C4', 'major', 8)).toThrow()
    expect(() => romanNumeralFor(0, 'major')).toThrow()
    expect(() => romanNumeralFor(8, 'major')).toThrow()
  })

  it('nombra las funciones armónicas y sus tres ámbitos', () => {
    const functions: HarmonicFunction[] = ['tonic', 'subdominant', 'dominant']
    for (const func of functions) {
      expect(harmonicFunctionName(func, 'es'), func).toMatch(/\((T|S|D)\)$/)
      expect(harmonicFunctionName(func, 'en'), func).toMatch(/\((T|S|D)\)$/)
    }

    expect(harmonicFunctionName('tonic', 'es')).toContain('Tónica')
    expect(harmonicFunctionName('subdominant', 'es')).toContain('Subdominante')
    expect(harmonicFunctionName('dominant', 'es')).toContain('Dominante')
    expect(harmonicFunctionName('tonic', 'en')).toContain('Tonic')
    expect(harmonicFunctionName('subdominant', 'en')).toContain('Subdominant')
    expect(harmonicFunctionName('dominant', 'en')).toContain('Dominant')
  })

  it('clasifica las cuatro cadencias y usa la sensible en menor', () => {
    const cadenceNamesEs: Record<CadenceType, string> = {
      authentic: 'Auténtica',
      plagal: 'Plagal',
      half: 'Semicadencia',
      deceptive: 'Rota',
    }
    const cadenceNamesEn: Record<CadenceType, string> = {
      authentic: 'Authentic',
      plagal: 'Plagal',
      half: 'Half',
      deceptive: 'Deceptive',
    }

    for (const mode of ['major', 'harmonic-minor'] as const) {
      for (const tonic of GENERATOR_TONICS) {
        const chords = diatonicChords(tonicPitch(tonic), mode)
        const label = `${tonic} ${mode}`

        for (const type of CADENCE_TYPES) {
          const degrees = CADENCE_DEGREES[mode][type]
          const caseLabel = `${label} ${type}`
          expect(
            cadenceTypeFor(degrees.from, degrees.to),
            caseLabel,
          ).toBe(type)

          const from = chords[degrees.from - 1]!
          const to = chords[degrees.to - 1]!
          expect(from.root, caseLabel).toEqual(
            scaleDegree(tonicPitch(tonic), mode, degrees.from),
          )
          expect(to.root, caseLabel).toEqual(
            scaleDegree(tonicPitch(tonic), mode, degrees.to),
          )
          expect(from.quality, caseLabel).toBe(
            CADENCE_QUALITIES[mode][type][0],
          )
          expect(to.quality, caseLabel).toBe(CADENCE_QUALITIES[mode][type][1])
          expect(
            isDiatonicChord(
              tonicPitch(tonic),
              mode,
              from.root,
              from.quality,
            ),
            caseLabel,
          ).toBe(true)
          expect(
            isDiatonicChord(tonicPitch(tonic), mode, to.root, to.quality),
            caseLabel,
          ).toBe(true)
          expect(cadenceName(type, 'es'), caseLabel).toContain(
            cadenceNamesEs[type],
          )
          expect(cadenceName(type, 'en'), caseLabel).toContain(
            cadenceNamesEn[type],
          )
        }

        // La auténtica y la semicadencia llegan a la dominante; en menor la
        // dominante es mayor por la sensible de la escala armónica.
        const dominant = chords[4]!
        expect(dominant.quality, `${label} V`).toBe('major')
        if (mode === 'harmonic-minor') {
          const leadingTone = dominant.pitches[1]!
          expect(mod12(midiOf(leadingTone)), `${label} sensible`).toBe(
            mod12(midiOf(chords[0]!.root) - 1),
          )
          expect(letterIndex(leadingTone.step), `${label} sensible`).toBe(
            (letterIndex(chords[0]!.root.step) + LETTERS.length - 1) %
              LETTERS.length,
          )
        }
        for (const fromDegree of [1, 2, 3, 4, 6, 7]) {
          expect(
            cadenceTypeFor(fromDegree, 5),
            `${label} semicadencia ${fromDegree}-5`,
          ).toBe('half')
        }
      }
    }

    expect(() => cadenceTypeFor(1, 6)).toThrow()
    expect(() => cadenceTypeFor(5, 2)).toThrow()
  })

  it('construye los dominantes secundarios con sensible y resolución', () => {
    const majorTargets = [2, 3, 4, 5, 6] as const
    const minorTargets = [3, 4, 5, 6] as const

    for (const tonic of GENERATOR_TONICS) {
      for (const mode of ['major', 'minor'] as const) {
        const reference: DiatonicMode =
          mode === 'major' ? 'major' : 'natural-minor'
        const chords = diatonicChords(tonicPitch(tonic), reference)
        const targets = mode === 'major' ? majorTargets : minorTargets

        for (const target of targets) {
          const label = `${tonic} ${mode} V/${target}`
          const targetChord = chords[target - 1]!
          const expectedNumeral = `V/${targetChord.roman}`

          expect(secondaryDominantNumeral(target, reference), label).toBe(
            expectedNumeral,
          )

          // El dominante toma su raíz un cuarto grado arriba del objetivo.
          const dominantDegree = ((target - 1 + 4) % 7) + 1
          const dominantRoot = scaleDegree(
            tonicPitch(tonic),
            reference,
            dominantDegree,
          )
          const dominant = chordPitches(dominantRoot, 'dominant7')
          expect(dominant, label).toHaveLength(4)

          // Raíz: una quinta arriba del objetivo y con la letra correcta.
          expect(mod12(midiOf(dominant[0]!)), label).toBe(
            mod12(midiOf(targetChord.root) + 7),
          )
          expect(letterIndex(dominant[0]!.step), `${label} raíz`).toBe(
            (letterIndex(targetChord.root.step) + 4) % LETTERS.length,
          )

          // Tercera: la sensible del grado, un semitono debajo de su raíz.
          const third = dominant[1]!
          expect(mod12(midiOf(third)), `${label} tercera`).toBe(
            mod12(midiOf(targetChord.root) - 1),
          )
          expect(letterIndex(third.step), `${label} tercera`).toBe(
            (letterIndex(targetChord.root.step) + LETTERS.length - 1) %
              LETTERS.length,
          )
          expect(intervalBetween(dominant[0]!, third).quality, label).toBe(
            'major',
          )

          // Quinta justa y séptima menor: las cualidades del acorde de
          // séptima de dominante, no solo sus clases de altura.
          expect(
            intervalBetween(dominant[0]!, dominant[2]!).quality,
            label,
          ).toBe('perfect')
          expect(
            intervalBetween(dominant[0]!, dominant[3]!).quality,
            label,
          ).toBe('minor')

          // Séptima: baja por grado conjunto hasta la tercera del acorde
          // objetivo. La distancia es de un semitono con objetivos mayores y
          // de dos semitonos con objetivos menores.
          const targetThird = targetChord.pitches[1]!
          const seventhFall = targetChord.quality === 'major' ? 1 : 2
          expect(
            mod12(midiOf(dominant[3]!) - midiOf(targetThird)),
            `${label} séptima`,
          ).toBe(seventhFall)
          expect(letterIndex(dominant[3]!.step), `${label} séptima`).toBe(
            (letterIndex(targetThird.step) + 1) % LETTERS.length,
          )
        }
      }
    }

    // En menor la referencia es la menor natural: el V/III de Do menor es
    // Si♭7 (con Re natural), no Si7 (con Re♯).
    const cMinorSeventh = scaleDegree('C4', 'natural-minor', 7)
    expect(spelling(cMinorSeventh)).toBe('Bb')
    const dominantOfIII = chordPitches(cMinorSeventh, 'dominant7')
    expect(spelling(dominantOfIII[1]!)).toBe('D')
    expect(spelling(dominantOfIII[3]!)).toBe('Ab')

    expect(() => secondaryDominantNumeral(0, 'major')).toThrow()
    expect(() => secondaryDominantNumeral(8, 'major')).toThrow()
  })
})
