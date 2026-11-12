import { describe, expect, it } from 'vitest'
import {
  analyzeVoiceLeading,
  normalizeVoicing,
  preservesPitchClasses,
  suggestVoicing,
  voiceIntervalClass,
  voiceLeadingIssues,
  type VoiceLeadingChord,
} from '../src/theory/voice-leading'
import { midiOf, romanToChord } from '../src/theory'
import type { Key } from '../src/schemas'

function chord(label: string, midis: number[]): VoiceLeadingChord {
  return { label, midis }
}

function progression(
  degrees: string[],
  key: Key,
  mode: 'major' | 'minor' = 'major',
): VoiceLeadingChord[] {
  return degrees.map((degree) => {
    const built = romanToChord(key, mode === 'minor' ? 'natural-minor' : 'major', degree)
    return {
      label: degree,
      midis: built.pitches.map((pitch) => midiOf(pitch)).sort((a, b) => a - b),
    }
  })
}

describe('F4-023 — motor de conducción de voces', () => {
  it('detecta quintas paralelas en movimiento directo', () => {
    const issues = voiceLeadingIssues(chord('I', [60, 67]), chord('V', [62, 69]))

    expect(issues).toHaveLength(1)
    expect(issues[0]).toMatchObject({
      kind: 'parallel-fifths',
      fromIndex: 0,
      toIndex: 1,
      fromLabel: 'I',
      toLabel: 'V',
      voices: [0, 1],
      fromMidis: [60, 67],
      toMidis: [62, 69],
    })
  })

  it('detecta octavas paralelas y trata la unísono como octava', () => {
    const octaves = voiceLeadingIssues(chord('I', [48, 60]), chord('V', [50, 62]))
    expect(octaves).toHaveLength(1)
    expect(octaves[0].kind).toBe('parallel-octaves')

    const unisons = voiceLeadingIssues(chord('I', [60, 60]), chord('V', [62, 62]))
    expect(unisons).toHaveLength(1)
    expect(unisons[0].kind).toBe('parallel-octaves')
    expect(voiceIntervalClass(60, 60)).toBe(0)
  })

  it('no marca terceras paralelas, movimiento contrario ni oblicuo', () => {
    // Terceras paralelas: permitidas.
    expect(
      voiceLeadingIssues(chord('I', [60, 64]), chord('V', [62, 66])),
    ).toHaveLength(0)

    // Quinta que se resuelve por movimiento contrario.
    expect(
      voiceLeadingIssues(chord('I', [60, 67]), chord('V', [62, 65])),
    ).toHaveLength(0)

    // Una voz se mueve y la otra se queda: movimiento oblicuo.
    expect(
      voiceLeadingIssues(chord('I', [60, 67]), chord('V', [60, 69])),
    ).toHaveLength(0)

    // Movimiento similar pero con intervalo distinto.
    expect(
      voiceLeadingIssues(chord('I', [60, 64]), chord('V', [62, 69])),
    ).toHaveLength(0)
  })

  it('revisa todas las parejas de voces de un acorde de cuatro voces', () => {
    // De Do mayor a Re mayor: la voz grave y la superior forman octavas y la
    // grave con la tercera forman quintas; ambas se mueven en paralelo.
    const issues = voiceLeadingIssues(
      chord('I', [60, 64, 67, 72]),
      chord('V', [62, 66, 69, 74]),
    )
    const kinds = issues.map((issue) => issue.kind).sort()
    expect(kinds).toEqual(['parallel-fifths', 'parallel-octaves'])
    expect(new Set(issues.map((issue) => issue.voices.join('-'))).size).toBe(2)
  })

  it('compara solo las voces comunes si los acordes tienen distinto tamaño', () => {
    const issues = voiceLeadingIssues(
      chord('I', [60, 67]),
      chord('V', [62, 69, 74]),
    )
    expect(issues).toHaveLength(1)
    expect(issues[0].kind).toBe('parallel-fifths')
  })

  it('propone un voicing sin paralelas y conserva las clases de altura', () => {
    const previous = chord('I', [60, 67])
    const next = chord('V', [62, 69])
    const suggested = suggestVoicing(previous, next)

    expect(suggested.label).toBe('V')
    expect(voiceLeadingIssues(previous, suggested)).toHaveLength(0)
    // Mismas notas (D y A) en otra octava u orden.
    expect(preservesPitchClasses(suggested.midis, next.midis)).toBe(true)
    // El voicing propuesto no se aleja más de una octava del original.
    expect(Math.max(...suggested.midis) - Math.min(...suggested.midis)).toBeLessThanOrEqual(12)
    for (let voice = 1; voice < suggested.midis.length; voice += 1) {
      expect(suggested.midis[voice]).toBeGreaterThan(suggested.midis[voice - 1])
    }
  })

  it('puede conservar el bajo al corregir', () => {
    const previous = chord('I', [60, 64, 67, 72])
    const next = chord('V', [62, 65, 69, 74])
    const suggested = suggestVoicing(previous, next, { keepBass: true })

    expect(suggested.midis[0]).toBe(62)
    expect(voiceLeadingIssues(previous, suggested)).toHaveLength(0)
    expect(preservesPitchClasses(suggested.midis, next.midis)).toBe(true)
  })

  it('analiza I-IV-V-I y corrige las quintas paralelas de la posición fundamental', () => {
    const chords = progression(['I', 'IV', 'V', 'I'], 'C')
    const analysis = analyzeVoiceLeading(chords)

    expect(analysis.chords).toHaveLength(4)
    expect(analysis.issues.length).toBeGreaterThan(0)
    expect(analysis.issues.every((issue) => issue.kind === 'parallel-fifths')).toBe(
      true,
    )
    expect(analysis.issues[0].fromLabel).toBe('I')
    expect(analysis.issues[0].toLabel).toBe('IV')

    // El primer acorde queda como ancla y la propuesta elimina las paralelas.
    expect(analysis.suggestions[0]).toEqual(analysis.chords[0])
    expect(analysis.changed.length).toBeGreaterThan(0)
    for (let index = 1; index < analysis.suggestions.length; index += 1) {
      expect(
        voiceLeadingIssues(
          analysis.suggestions[index - 1],
          analysis.suggestions[index],
        ),
        `par ${index - 1}→${index}`,
      ).toHaveLength(0)
      expect(
        preservesPitchClasses(
          analysis.suggestions[index].midis,
          analysis.chords[index].midis,
        ),
        `acorde ${index}`,
      ).toBe(true)
    }
  })

  it('no inventa problemas cuando la conducción ya es correcta', () => {
    // I en posición fundamental y V en primera inversión, con voces comunes.
    const analysis = analyzeVoiceLeading([
      chord('I', [60, 64, 67]),
      chord('V', [59, 62, 67]),
    ])
    expect(analysis.issues).toHaveLength(0)
    expect(analysis.changed).toHaveLength(0)
  })

  it('funciona en las doce tonalidades y en modo menor', () => {
    const tonics: Key[] = [
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
    ]
    for (const tonic of tonics) {
      const analysis = analyzeVoiceLeading(progression(['I', 'IV', 'V'], tonic))
      for (const suggestion of analysis.suggestions.slice(1)) {
        expect(suggestion.midis.length).toBe(3)
        for (let voice = 1; voice < suggestion.midis.length; voice += 1) {
          expect(suggestion.midis[voice]).toBeGreaterThan(
            suggestion.midis[voice - 1],
          )
        }
      }
      for (let index = 1; index < analysis.suggestions.length; index += 1) {
        expect(
          voiceLeadingIssues(
            analysis.suggestions[index - 1],
            analysis.suggestions[index],
          ),
          `${tonic} ${index}`,
        ).toHaveLength(0)
      }
    }

    const minor = analyzeVoiceLeading(
      progression(['i', 'iv', 'v'], 'A', 'minor'),
    )
    expect(minor.issues.length).toBeGreaterThan(0)
    for (let index = 1; index < minor.suggestions.length; index += 1) {
      expect(
        voiceLeadingIssues(
          minor.suggestions[index - 1],
          minor.suggestions[index],
        ),
      ).toHaveLength(0)
    }
  })

  it('normaliza los voicings y conserva la etiqueta', () => {
    expect(normalizeVoicing(chord('IV', [65, 60, 69]))).toEqual(
      chord('IV', [60, 65, 69]),
    )
    const analysis = analyzeVoiceLeading([chord('I', [67, 60, 64])])
    expect(analysis.chords[0].midis).toEqual([60, 64, 67])
    expect(analysis.issues).toHaveLength(0)
  })
})
