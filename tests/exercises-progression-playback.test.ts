import { describe, expect, it } from 'vitest'
import { beatDuration } from '../src/audio/notes'
import {
  BASS_CHORD_BEATS,
  PROGRESSION_CHORD_BEATS,
  PROGRESSION_LOOP_GAP_BEATS,
  buildProgressionPlayback,
  progressionVoicing,
} from '../src/exercises/progression-playback'
import { midiOf, romanToChord } from '../src/theory'
import type { Key } from '../src/schemas'

const TONICS: Key[] = [
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

/** Verifica que dos eventos que comparten un MIDI no se solapen. */
function expectNoStuckNotes(
  timeline: { time: number; duration: number; midis: number[] }[],
): void {
  const byMidi = new Map<number, { start: number; end: number }[]>()
  for (const event of timeline) {
    for (const midi of event.midis) {
      const spans = byMidi.get(midi) ?? []
      spans.push({ start: event.time, end: event.time + event.duration })
      byMidi.set(midi, spans)
    }
  }
  for (const [midi, spans] of byMidi) {
    spans.sort((first, second) => first.start - second.start)
    for (let index = 1; index < spans.length; index += 1) {
      expect(
        spans[index].start,
        `el MIDI ${midi} se solapa con el evento anterior`,
      ).toBeGreaterThanOrEqual(spans[index - 1].end)
    }
  }
}

describe('F4-022 — reproducción de progresiones con voicings y tempo', () => {
  it('en bloque cada acorde ocupa 1,5 pulsos y lleva su numeral', () => {
    const playback = buildProgressionPlayback(
      ['I', 'IV', 'V', 'I'],
      'C',
      'major',
      { tempo: 60, style: 'block' },
    )

    expect(playback.chordBeats).toBe(PROGRESSION_CHORD_BEATS)
    expect(playback.chordBeats).toBe(1.5)
    expect(playback.loopGapBeats).toBe(PROGRESSION_LOOP_GAP_BEATS)
    expect(playback.chords).toHaveLength(4)
    expect(playback.timeline).toHaveLength(4)

    const slot = 1.5 * beatDuration(60)
    playback.timeline.forEach((event, index) => {
      expect(event.time).toBeCloseTo(index * slot)
      expect(event.duration).toBeCloseTo(slot)
      expect(event.label).toBe(['I', 'IV', 'V', 'I'][index])
      expect(event.midis).toEqual(playback.chords[index].midis)
    })

    expect(playback.duration).toBeCloseTo(4 * slot + 0.5 * beatDuration(60))
    // La pausa final deja el último acorde liberado antes de repetir.
    const last = playback.timeline.at(-1)
    expect(last).toBeDefined()
    if (last) {
      expect(last.time + last.duration).toBeLessThan(playback.duration)
    }
    expectNoStuckNotes(playback.timeline)
  })

  it('arpegio ascendente y descendente reparten el hueco sin solaparse', () => {
    const up = buildProgressionPlayback(['I', 'V'], 'C', 'major', {
      tempo: 60,
      style: 'arpeggio-up',
    })
    const down = buildProgressionPlayback(['I', 'V'], 'C', 'major', {
      tempo: 60,
      style: 'arpeggio-down',
    })

    const chord = up.chords[0]
    expect(chord).toBeDefined()
    if (!chord) return
    const slot = PROGRESSION_CHORD_BEATS * beatDuration(60)
    const noteSlot = slot / chord.midis.length
    const upChord = up.timeline.filter((event) => event.label === 'I')
    const downChord = down.timeline.filter((event) => event.label === 'I')

    expect(upChord).toHaveLength(chord.midis.length)
    expect(upChord.map((event) => event.midis[0])).toEqual(chord.midis)
    expect(upChord.map((event) => event.time)).toEqual(
      chord.midis.map((_, index) => index * noteSlot),
    )
    expect(upChord.every((event) => event.duration === noteSlot)).toBe(true)

    expect(downChord.map((event) => event.midis[0])).toEqual(
      [...chord.midis].reverse(),
    )
    expectNoStuckNotes(up.timeline)
    expectNoStuckNotes(down.timeline)
  })

  it('bajo + acorde sostiene el bajo y no repite su MIDI', () => {
    const playback = buildProgressionPlayback(['I', 'IV'], 'C', 'major', {
      tempo: 60,
      style: 'bass-chord',
    })

    expect(playback.chordBeats).toBe(BASS_CHORD_BEATS)
    expect(playback.chordBeats).toBe(3)

    const slot = BASS_CHORD_BEATS * beatDuration(60)
    const first = playback.chords[0]
    expect(first).toBeDefined()
    if (!first) return
    const [bass, ...rest] = first.midis

    const firstEvents = playback.timeline.filter((event) => event.label === 'I')
    expect(firstEvents).toHaveLength(2)
    expect(firstEvents[0].midis).toEqual([bass])
    expect(firstEvents[0].time).toBe(0)
    expect(firstEvents[0].duration).toBeCloseTo(slot)
    expect(firstEvents[1].midis).toEqual(rest)
    expect(firstEvents[1].midis).not.toContain(bass)
    expect(firstEvents[1].time).toBeCloseTo(slot / 3)
    expect(firstEvents[1].time + firstEvents[1].duration).toBeCloseTo(slot)

    expectNoStuckNotes(playback.timeline)
    const last = playback.timeline.at(-1)
    if (last) {
      expect(last.time + last.duration).toBeLessThan(playback.duration)
    }
  })

  it('el tempo cambia la duración de los acordes y de la pasada', () => {
    const slow = buildProgressionPlayback(['I', 'V'], 'C', 'major', {
      tempo: 60,
      style: 'block',
    })
    const fast = buildProgressionPlayback(['I', 'V'], 'C', 'major', {
      tempo: 120,
      style: 'block',
    })

    expect(fast.tempo).toBe(120)
    const slowSlot = PROGRESSION_CHORD_BEATS * beatDuration(60)
    const fastSlot = PROGRESSION_CHORD_BEATS * beatDuration(120)
    expect(slowSlot).toBeCloseTo(1.5)
    expect(fastSlot).toBeCloseTo(0.75)
    expect(slow.timeline[1].time).toBeCloseTo(slowSlot)
    expect(fast.timeline[1].time).toBeCloseTo(fastSlot)
    expect(fast.duration).toBeCloseTo(slow.duration / 2)
  })

  it('el tempo fuera de rango se limita al mínimo y al máximo', () => {
    expect(
      buildProgressionPlayback(['I'], 'C', 'major', { tempo: 10 }).tempo,
    ).toBe(40)
    expect(
      buildProgressionPlayback(['I'], 'C', 'major', { tempo: 500 }).tempo,
    ).toBe(240)
  })

  it('cubre las doce tonalidades mayores y el modo menor', () => {
    for (const tonic of TONICS) {
      const playback = buildProgressionPlayback(
        ['I', 'IV', 'V', 'I'],
        tonic,
        'major',
        { tempo: 80, style: 'bass-chord' },
      )
      expect(playback.key, tonic).toBe(tonic)
      expect(playback.mode).toBe('major')
      expect(playback.chords).toHaveLength(4)

      for (const degree of [1, 4, 5] as const) {
        const numeral = ['I', 'IV', 'V'][[1, 4, 5].indexOf(degree)]
        const chord = romanToChord(tonic, 'major', numeral)
        const expected = chord.pitches.map((pitch) => midiOf(pitch))
        const actual = playback.chords.find(
          (entry) => entry.numeral === numeral,
        )
        expect(actual?.midis, `${tonic} ${numeral}`).toEqual(expected)
      }
      expectNoStuckNotes(playback.timeline)
    }

    const minor = buildProgressionPlayback(
      ['i', 'iv', 'v', 'i'],
      'A',
      'minor',
      { tempo: 80, style: 'block' },
    )
    expect(minor.mode).toBe('minor')
    const expected = romanToChord('A', 'natural-minor', 'i')
      .pitches.map((pitch) => midiOf(pitch))
    expect(minor.chords[0].midis).toEqual(expected)
    expect(minor.timeline.map((event) => event.label)).toEqual([
      'i',
      'iv',
      'v',
      'i',
    ])
  })

  it('reparte el acorde en un hueco fijo y respeta el hueco pedido', () => {
    const events = progressionVoicing([60, 64, 67], 'arpeggio-up', 60, 1.5)
    expect(events).toHaveLength(3)
    expect(events.map((event) => event.midis[0])).toEqual([60, 64, 67])
    expect(events.every((event) => event.duration === 0.5)).toBe(true)

    // Un acorde de una sola nota no se rompe en bajo + acorde.
    const single = progressionVoicing([60], 'bass-chord', 60, 3)
    expect(single).toEqual([{ time: 0, duration: 3, midis: [60] }])

    // Sin notas no hay eventos.
    expect(progressionVoicing([], 'block', 60, 1.5)).toEqual([])

    // El hueco se puede alargar sin cambiar el tempo.
    const long = progressionVoicing([60, 64], 'block', 60, 4)
    expect(long[0].duration).toBe(4)
  })
})
