import { describe, expect, it } from 'vitest'
import {
  CHORD_DEFINITIONS,
  CHORD_QUALITIES,
  chordBass,
  chordPitches,
  chordSymbol,
  chordWithInversion,
  convertChordNotation,
  parseChordSymbol,
  type ChordQuality,
} from '../src/theory/chords'
import {
  intervalBetween,
  intervalSemitones,
  invertInterval,
  transposeInterval,
  type IntervalQuality,
} from '../src/theory/intervals'
import {
  LETTERS,
  formatPitch,
  midiOf,
  mod12,
  parsePitch,
} from '../src/theory/pitch'

/**
 * F3-030 — Property tests de la teoría de M3-M4.
 *
 * Recorre las doce tónicas con las que trabaja el curso y comprueba que los
 * intervalos, las tríadas, las séptimas, las extensiones y el cifrado conservan
 * la cantidad, la calidad, la letra de cada grado y la ortografía. No depende de
 * contenido concreto: si el motor cambia, estas propiedades siguen siendo la
 * referencia.
 */

const TWELVE_TONICS = [
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

const TRIAD_QUALITIES: readonly ChordQuality[] = [
  'major',
  'minor',
  'diminished',
  'augmented',
  'sus2',
  'sus4',
]

const SEVENTH_QUALITIES: readonly ChordQuality[] = [
  'major7',
  'dominant7',
  'minor7',
  'half-diminished7',
  'diminished7',
]

const EXTENSION_QUALITIES: readonly ChordQuality[] = [
  'major9',
  'dominant9',
  'minor9',
  'major11',
  'dominant11',
  'minor11',
  'major13',
  'dominant13',
  'minor13',
]

const INTERVAL_QUALITIES: Record<number, readonly IntervalQuality[]> = {
  1: ['perfect', 'augmented'],
  2: ['major', 'minor', 'augmented', 'diminished'],
  3: ['major', 'minor', 'augmented', 'diminished'],
  4: ['perfect', 'augmented', 'diminished'],
  5: ['perfect', 'augmented', 'diminished'],
  6: ['major', 'minor', 'augmented', 'diminished'],
  7: ['major', 'minor', 'augmented', 'diminished'],
  8: ['perfect', 'augmented', 'diminished'],
}

/**
 * La segunda disminuida de La♭ exigiría un triple bemol (Si𝄫𝄫). El motor
 * rechaza grafías más allá de la doble alteración, así que la propiedad la
 * excluye y el resto de combinaciones debe funcionar.
 */
const UNSPELLABLE = new Set(['Ab|2|diminished'])

const INVERTED_QUALITY: Record<IntervalQuality, IntervalQuality> = {
  perfect: 'perfect',
  major: 'minor',
  minor: 'major',
  augmented: 'diminished',
  diminished: 'augmented',
  'doubly-augmented': 'doubly-diminished',
  'doubly-diminished': 'doubly-augmented',
}

/**
 * Calidad de cada voz del acorde medida desde la fundamental, en el orden de
 * `CHORD_DEFINITIONS`. La quinta de la disminuida es disminuida aunque suene a
 * tritono, y la séptima de la disminuida es disminuida aunque suene a sexta
 * mayor: la propiedad comprueba la grafía, no solo los semitonos.
 */
const VOICE_QUALITIES: Record<ChordQuality, readonly IntervalQuality[]> = {
  major: ['perfect', 'major', 'perfect'],
  minor: ['perfect', 'minor', 'perfect'],
  diminished: ['perfect', 'minor', 'diminished'],
  augmented: ['perfect', 'major', 'augmented'],
  sus2: ['perfect', 'major', 'perfect'],
  sus4: ['perfect', 'perfect', 'perfect'],
  major7: ['perfect', 'major', 'perfect', 'major'],
  dominant7: ['perfect', 'major', 'perfect', 'minor'],
  minor7: ['perfect', 'minor', 'perfect', 'minor'],
  'half-diminished7': ['perfect', 'minor', 'diminished', 'minor'],
  diminished7: ['perfect', 'minor', 'diminished', 'diminished'],
  major9: ['perfect', 'major', 'perfect', 'major', 'major'],
  dominant9: ['perfect', 'major', 'perfect', 'minor', 'major'],
  minor9: ['perfect', 'minor', 'perfect', 'minor', 'major'],
  major11: ['perfect', 'major', 'perfect', 'major', 'major', 'perfect'],
  dominant11: ['perfect', 'major', 'perfect', 'minor', 'major', 'perfect'],
  minor11: ['perfect', 'minor', 'perfect', 'minor', 'major', 'perfect'],
  major13: ['perfect', 'major', 'perfect', 'major', 'major', 'perfect', 'major'],
  dominant13: ['perfect', 'major', 'perfect', 'minor', 'major', 'perfect', 'major'],
  minor13: ['perfect', 'minor', 'perfect', 'minor', 'major', 'perfect', 'major'],
}

function rootOf(tonic: string) {
  return parsePitch(`${tonic}4`)
}

/** Letra que corresponde a un grado contado desde la tónica. */
function stepAt(tonic: string, degreeOffset: number) {
  const index = LETTERS.indexOf(rootOf(tonic).step)
  return LETTERS[(index + degreeOffset) % LETTERS.length]
}

/** Número completo del intervalo que forma una voz del acorde. */
function voiceNumber(quality: ChordQuality, index: number): number {
  const definition = CHORD_DEFINITIONS[quality]
  const simpleNumber = definition.degrees[index] + 1
  return simpleNumber + 7 * Math.floor(definition.intervals[index] / 12)
}

function sortedClasses(pitches: ReturnType<typeof chordPitches>): number[] {
  return pitches.map((pitch) => mod12(midiOf(pitch))).sort((a, b) => a - b)
}

function spelledRoundTrip(pitch: ReturnType<typeof parsePitch>): void {
  expect(parsePitch(formatPitch(pitch))).toEqual(pitch)
}

describe('F3-030 — Teoría de M3-M4 en 12 tonalidades', () => {
  it('construye los intervalos de M3 con cantidad, calidad y letra correctas', () => {
    let checked = 0

    for (const tonic of TWELVE_TONICS) {
      const lower = rootOf(tonic)

      for (const number of Object.keys(INTERVAL_QUALITIES).map(Number)) {
        for (const quality of INTERVAL_QUALITIES[number]) {
          if (UNSPELLABLE.has(`${tonic}|${number}|${quality}`)) continue

          const upper = transposeInterval(lower, number, quality)
          const interval = intervalBetween(lower, upper)

          // La segunda disminuida puede quedar a la misma altura que la
          // fundamental (Do–Re𝄫); ninguna grafía debe bajar la nota superior.
          expect(
            midiOf(upper),
            `${tonic} ${quality} ${number}`,
          ).toBeGreaterThanOrEqual(midiOf(lower))
          expect(interval.number, `${tonic} ${quality} ${number}`).toBe(number)
          expect(interval.quality, `${tonic} ${quality} ${number}`).toBe(quality)
          expect(interval.semitones, `${tonic} ${quality} ${number}`).toBe(
            intervalSemitones(number, quality),
          )
          expect(upper.step, `${tonic} ${quality} ${number}`).toBe(
            stepAt(tonic, number - 1),
          )
          expect(Math.abs(upper.accidental)).toBeLessThanOrEqual(2)
          spelledRoundTrip(upper)
          checked += 1
        }
      }
    }

    expect(checked).toBe(TWELVE_TONICS.length * 27 - UNSPELLABLE.size)
  })

  it('invierte los intervalos con suma nueve y el intercambio de calidades', () => {
    for (const tonic of TWELVE_TONICS) {
      const lower = rootOf(tonic)

      // La regla de suma nueve se aplica a los intervalos simples. La octava
      // justa se comprueba aparte; las octavas aumentadas o disminuidas no
      // tienen inversión estándar.
      for (let number = 2; number <= 7; number += 1) {
        for (const quality of INTERVAL_QUALITIES[number]) {
          if (UNSPELLABLE.has(`${tonic}|${number}|${quality}`)) continue

          const interval = intervalBetween(
            lower,
            transposeInterval(lower, number, quality),
          )
          const inverted = invertInterval(interval)

          expect(inverted.number, `${tonic} ${quality} ${number}`).toBe(
            9 - number,
          )
          expect(inverted.quality, `${tonic} ${quality} ${number}`).toBe(
            INVERTED_QUALITY[quality],
          )
          expect(inverted.semitones, `${tonic} ${quality} ${number}`).toBe(
            12 - interval.semitones,
          )
        }
      }

      const octave = invertInterval(
        intervalBetween(lower, transposeInterval(lower, 8, 'perfect')),
      )
      expect(octave.number, tonic).toBe(1)
      expect(octave.quality, tonic).toBe('perfect')
      expect(octave.semitones, tonic).toBe(0)
    }
  })

  it('construye las tríadas de M4 con la quinta y la tercera bien escritas', () => {
    for (const tonic of TWELVE_TONICS) {
      const root = rootOf(tonic)

      for (const quality of TRIAD_QUALITIES) {
        const definition = CHORD_DEFINITIONS[quality]
        const pitches = chordPitches(root, quality)
        expect(pitches, `${tonic} ${quality}`).toHaveLength(3)

        pitches.forEach((pitch, index) => {
          const interval = intervalBetween(root, pitch)
          expect(pitch.step, `${tonic} ${quality}`).toBe(
            stepAt(tonic, definition.degrees[index]),
          )
          expect(interval.number, `${tonic} ${quality}`).toBe(
            definition.degrees[index] + 1,
          )
          expect(interval.quality, `${tonic} ${quality}`).toBe(
            VOICE_QUALITIES[quality][index],
          )
          expect(interval.semitones, `${tonic} ${quality}`).toBe(
            definition.intervals[index],
          )
          expect(Math.abs(pitch.accidental)).toBeLessThanOrEqual(2)
          spelledRoundTrip(pitch)
        })

        for (let index = 1; index < pitches.length; index += 1) {
          expect(midiOf(pitches[index])).toBeGreaterThan(midiOf(pitches[index - 1]))
        }
      }
    }
  })

  it('construye las cinco séptimas con su séptima y su cifrado correctos', () => {
    for (const tonic of TWELVE_TONICS) {
      const root = rootOf(tonic)

      for (const quality of SEVENTH_QUALITIES) {
        const definition = CHORD_DEFINITIONS[quality]
        const pitches = chordPitches(root, quality)
        expect(pitches, `${tonic} ${quality}`).toHaveLength(4)

        pitches.forEach((pitch, index) => {
          const interval = intervalBetween(root, pitch)
          expect(interval.number, `${tonic} ${quality}`).toBe(
            voiceNumber(quality, index),
          )
          expect(interval.quality, `${tonic} ${quality}`).toBe(
            VOICE_QUALITIES[quality][index],
          )
          expect(interval.semitones, `${tonic} ${quality}`).toBe(
            definition.intervals[index],
          )
          expect(Math.abs(pitch.accidental)).toBeLessThanOrEqual(2)
          spelledRoundTrip(pitch)
        })

        const seventh = intervalBetween(root, pitches[3])
        expect(seventh.number, `${tonic} ${quality}`).toBe(7)
        if (quality === 'diminished7') {
          expect(seventh.quality).toBe('diminished')
          expect(seventh.semitones).toBe(9)
        } else if (quality === 'major7') {
          expect(seventh.quality).toBe('major')
          expect(seventh.semitones).toBe(11)
        } else {
          expect(seventh.quality).toBe('minor')
          expect(seventh.semitones).toBe(10)
        }
      }
    }
  })

  it('construye las extensiones 9, 11 y 13 con voces compuestas correctas', () => {
    for (const tonic of TWELVE_TONICS) {
      const root = rootOf(tonic)

      for (const quality of EXTENSION_QUALITIES) {
        const definition = CHORD_DEFINITIONS[quality]
        const pitches = chordPitches(root, quality)
        expect(pitches, `${tonic} ${quality}`).toHaveLength(
          definition.intervals.length,
        )

        pitches.forEach((pitch, index) => {
          const interval = intervalBetween(root, pitch)
          expect(interval.number, `${tonic} ${quality}`).toBe(
            voiceNumber(quality, index),
          )
          expect(interval.quality, `${tonic} ${quality}`).toBe(
            VOICE_QUALITIES[quality][index],
          )
          expect(Math.abs(pitch.accidental)).toBeLessThanOrEqual(2)
          spelledRoundTrip(pitch)
        })
      }
    }
  })

  it('el cifrado americano y latino de las 20 calidades vuelve al original', () => {
    for (const tonic of TWELVE_TONICS) {
      const root = rootOf(tonic)

      for (const quality of CHORD_QUALITIES) {
        const american = chordSymbol(root, quality)
        const latin = chordSymbol(root, quality, { notation: 'do' })
        const parsedAmerican = parseChordSymbol(american)
        const parsedLatin = parseChordSymbol(latin)

        for (const parsed of [parsedAmerican, parsedLatin]) {
          expect(parsed.root.step, `${tonic} ${quality}`).toBe(root.step)
          expect(parsed.root.accidental, `${tonic} ${quality}`).toBe(
            root.accidental,
          )
          expect(parsed.quality, `${tonic} ${quality}`).toBe(quality)
          expect(parsed.slash, `${tonic} ${quality}`).toBeUndefined()
        }

        expect(convertChordNotation(latin, 'c'), `${tonic} ${quality}`).toBe(
          american,
        )
        expect(convertChordNotation(american, 'do'), `${tonic} ${quality}`).toBe(
          latin,
        )
      }
    }
  })

  it('conserva el bajo con barra en las dos notaciones', () => {
    const qualities: readonly ChordQuality[] = [
      'major',
      'minor7',
      'major9',
      'dominant13',
    ]

    for (const tonic of TWELVE_TONICS) {
      const root = rootOf(tonic)

      for (const quality of qualities) {
        for (const bass of TWELVE_TONICS) {
          const bassPitch = rootOf(bass)
          const american = chordSymbol(root, quality, { slash: bassPitch })
          const latin = chordSymbol(root, quality, {
            notation: 'do',
            slash: bassPitch,
          })
          const parsed = parseChordSymbol(american)

          expect(parsed.quality, `${tonic} ${quality}/${bass}`).toBe(quality)
          expect(parsed.slash?.step, `${tonic} ${quality}/${bass}`).toBe(
            bassPitch.step,
          )
          expect(parsed.slash?.accidental, `${tonic} ${quality}/${bass}`).toBe(
            bassPitch.accidental,
          )
          expect(
            convertChordNotation(latin, 'c'),
            `${tonic} ${quality}/${bass}`,
          ).toBe(american)
          expect(
            convertChordNotation(american, 'do'),
            `${tonic} ${quality}/${bass}`,
          ).toBe(latin)
        }
      }
    }
  })

  it('invierte tríadas y séptimas sin cambiar sus notas ni su bajo', () => {
    for (const tonic of TWELVE_TONICS) {
      const root = rootOf(tonic)

      for (const quality of [...TRIAD_QUALITIES, ...SEVENTH_QUALITIES]) {
        const fundamental = chordPitches(root, quality)

        for (let inversion = 0; inversion < fundamental.length; inversion += 1) {
          const voicing = chordWithInversion(root, quality, inversion)
          const label = `${tonic} ${quality} inv ${inversion}`

          expect(voicing, label).toHaveLength(fundamental.length)
          expect(chordBass(voicing), label).toEqual(voicing[0])
          expect(sortedClasses(voicing), label).toEqual(
            sortedClasses(fundamental),
          )

          for (let index = 1; index < voicing.length; index += 1) {
            expect(midiOf(voicing[index]), label).toBeGreaterThan(
              midiOf(voicing[index - 1]),
            )
          }
          for (const pitch of voicing) spelledRoundTrip(pitch)
        }
      }
    }
  })
})
