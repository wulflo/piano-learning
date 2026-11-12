import { describe, expect, it } from 'vitest'
import { COURSE_LESSONS } from '../src/content/course'
import {
  hasLessonContent,
  lessonContentPath,
  loadLesson,
} from '../src/content/lessons'
import {
  rhythmicValueBeats,
  scoreToMeasures,
  scoreToMidis,
  scoreToTimeline,
  spelledPitchToMidi,
} from '../src/content/score'
import { ScoreSchema } from '../src/schemas'

const SCORE = ScoreSchema.parse({
  clef: 'treble',
  key: 'C',
  mode: 'major',
  timeSignature: { numerator: 4, denominator: 4 },
  tempoBpm: 60,
  events: [
    {
      id: 'event.c4',
      measure: 1,
      beat: 0,
      value: { duration: 'quarter' },
      pitches: [{ step: 'C', octave: 4 }],
      hand: 'right',
    },
    {
      id: 'event.e4',
      measure: 1,
      beat: 1,
      value: { duration: 'half', dots: 1 },
      pitches: [{ step: 'E', octave: 4 }],
      hand: 'right',
    },
    {
      id: 'event.chord',
      measure: 2,
      beat: 0,
      value: { duration: 'eighth', tuplet: 'triplet' },
      pitches: [
        { step: 'C', octave: 4 },
        { step: 'E', octave: 4 },
        { step: 'G', octave: 4 },
      ],
      hand: 'right',
    },
  ],
})

describe('F2-060 — Contenido completo de la lección', () => {
  it('cada lección del índice tiene archivo y valida con LessonSchema', async () => {
    expect(COURSE_LESSONS.length).toBeGreaterThan(0)

    for (const lesson of COURSE_LESSONS) {
      expect(hasLessonContent(lesson.id)).toBe(true)

      const loaded = await loadLesson(lesson.id)
      expect(loaded.id).toBe(lesson.id)
      expect(loaded.moduleId).toBe(lesson.moduleId)
      expect(loaded.sections.length).toBeGreaterThan(0)
    }
  })

  it('deriva la ruta del archivo desde el id', () => {
    expect(lessonContentPath('lesson.m0-01')).toBe(
      '../../content/lessons/m0-01.json',
    )
    expect(lessonContentPath('lesson.m8-12')).toBe(
      '../../content/lessons/m8-12.json',
    )
  })

  it('rechaza ids inválidos o sin archivo', async () => {
    expect(lessonContentPath('m0-01')).toBeNull()
    expect(lessonContentPath('lesson.M0-01')).toBeNull()
    expect(hasLessonContent('lesson.m9-99')).toBe(false)

    await expect(loadLesson('lesson.m9-99')).rejects.toThrow(
      /no está en content\/lessons/,
    )
    await expect(loadLesson('lesson.m9-99')).rejects.not.toThrow(
      /ID de lección inválido/,
    )
    await expect(loadLesson('nope')).rejects.toThrow(/ID de lección inválido/)
  })
})

describe('F2-060 — Conversión de partituras', () => {
  it('convierte alturas escritas a MIDI', () => {
    expect(spelledPitchToMidi({ step: 'C', accidental: '', octave: 4 })).toBe(60)
    expect(spelledPitchToMidi({ step: 'B', accidental: 'b', octave: 3 })).toBe(58)
    expect(spelledPitchToMidi({ step: 'F', accidental: '#', octave: 5 })).toBe(78)
  })

  it('calcula pulsos con puntillos y tresillos', () => {
    expect(rhythmicValueBeats({ duration: 'quarter', dots: 0, tuplet: 'none' })).toBe(1)
    expect(rhythmicValueBeats({ duration: 'half', dots: 1, tuplet: 'none' })).toBe(3)
    expect(rhythmicValueBeats({ duration: 'half', dots: 2, tuplet: 'none' })).toBe(3.5)
    expect(rhythmicValueBeats({ duration: 'eighth', dots: 0, tuplet: 'triplet' })).toBeCloseTo(
      1 / 3,
      10,
    )
  })

  it('ordena los eventos y conserva figuras y acordes', () => {
    const measures = scoreToMeasures(SCORE)

    expect(measures.map((measure) => measure.id)).toEqual([
      'event.c4',
      'event.e4',
      'event.chord',
    ])
    expect(measures.map((measure) => measure.duration)).toEqual(['q', 'h', '8'])
    expect(measures[0]?.pitches).toEqual([
      { step: 'C', accidental: 0, octave: 4 },
    ])
    expect(measures[2]?.pitches).toHaveLength(3)
  })

  it('aplana las alturas en orden de partitura', () => {
    expect(scoreToMidis(SCORE)).toEqual([60, 64, 60, 64, 67])
  })

  it('construye el timeline con tiempos y duraciones', () => {
    const timeline = scoreToTimeline(SCORE)

    // Tempo 60: un pulso dura un segundo.
    expect(timeline.map((event) => event.time)).toEqual([0, 1, 4])
    expect(timeline[0]?.duration).toBe(1)
    expect(timeline[1]?.duration).toBe(3)
    expect(timeline[2]?.duration).toBeCloseTo(1 / 3, 10)
    expect(timeline[2]?.midis).toEqual([60, 64, 67])
  })

  it('respeta un tempo distinto al de la partitura', () => {
    const timeline = scoreToTimeline(SCORE, 120)
    expect(timeline[0]?.time).toBe(0)
    expect(timeline[1]?.time).toBe(0.5)
    expect(timeline[1]?.duration).toBe(1.5)
  })

  it('convierte la partitura real de la primera lección', async () => {
    const lesson = await loadLesson('lesson.m0-01')
    const section = lesson.sections.find((candidate) => candidate.score !== undefined)

    expect(section?.score).toBeDefined()
    const timeline = scoreToTimeline(section!.score!)
    expect(timeline).toHaveLength(3)
    expect(timeline.map((event) => event.midis[0])).toEqual([60, 62, 64])
    expect(timeline[0]?.time).toBe(0)
    expect(timeline[2]?.time).toBe(2)
  })
})
