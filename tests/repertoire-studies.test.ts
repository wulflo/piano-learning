import { beforeAll, describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { rhythmicValueBeats, scoreToTimeline } from '../src/content/score'
import { validateContentBundle } from '../src/content/validate'
import {
  TempoProgressionSchema,
  type ContentBundle,
  type RepertoirePiece,
} from '../src/schemas'

let bundle: ContentBundle
let studies: RepertoirePiece[]

beforeAll(async () => {
  const result = validateContentBundle(await loadContentFromDisk())
  expect(result.ok).toBe(true)
  if (!result.bundle) throw new Error('El contenido del repositorio no es válido')
  bundle = result.bundle
  studies = bundle.repertoire
    .filter((piece) => /^piece\.studies\.0[1-6]$/.test(piece.id))
    .sort((a, b) => a.id.localeCompare(b.id))
})

function handScores(piece: RepertoirePiece) {
  const right = piece.hands.right
  const left = piece.hands.left
  if (!right || !left) {
    throw new Error(`${piece.id} no tiene partituras separadas de ambas manos`)
  }
  return { right, left }
}

describe('F5-017 — Set 1 de estudios técnicos originales', () => {
  it('publica seis estudios CC0 dentro del repertorio', () => {
    expect(studies).toHaveLength(6)
    expect(studies.map((piece) => piece.id)).toEqual([
      'piece.studies.01',
      'piece.studies.02',
      'piece.studies.03',
      'piece.studies.04',
      'piece.studies.05',
      'piece.studies.06',
    ])
    expect(bundle.repertoire).toHaveLength(28)

    for (const piece of studies) {
      expect(piece.composerDisplay, piece.id).toBe('Piano Today')
      expect(piece.license.license, piece.id).toBe('cc0-1.0')
      expect(piece.license.composer.name, piece.id).toBe('Piano Today')
      expect(piece.license.transcriptionAuthor, piece.id).toBe('Piano Today')
      expect(piece.license.attribution, piece.id).toContain('CC0 1.0')
      expect(piece.tags, piece.id).toContain('estudio')
      expect(piece.tags, piece.id).toContain('técnica')
      expect(piece.level, piece.id).toBeGreaterThanOrEqual(1)
      expect(piece.level, piece.id).toBeLessThanOrEqual(2)
      expect(piece.durationSeconds, piece.id).toBeGreaterThan(0)
    }
  })

  it('cada estudio tiene partituras separadas de ambas manos en 4/4 y Do mayor', () => {
    for (const piece of studies) {
      const { right, left } = handScores(piece)
      expect(piece.hands.both, piece.id).toBeUndefined()
      expect(right.clef, `${piece.id} derecha`).toBe('treble')
      expect(left.clef, `${piece.id} izquierda`).toBe('bass')
      expect(right.tempoBpm, piece.id).toBe(left.tempoBpm)

      for (const [hand, score] of [
        ['right', right],
        ['left', left],
      ] as const) {
        expect(score.key, `${piece.id} ${hand}`).toBe('C')
        expect(score.mode, `${piece.id} ${hand}`).toBe('major')
        expect(score.timeSignature, `${piece.id} ${hand}`).toEqual({
          numerator: 4,
          denominator: 4,
        })

        const measures = new Set(score.events.map((event) => event.measure))
        expect([...measures].sort((a, b) => a - b), `${piece.id} ${hand}`).toEqual(
          [1, 2, 3, 4, 5, 6, 7, 8],
        )

        expect(
          score.events.every((event) => event.hand === hand),
          `${piece.id} ${hand}`,
        ).toBe(true)

        const totals = new Map<number, number>()
        for (const event of score.events) {
          totals.set(
            event.measure,
            (totals.get(event.measure) ?? 0) + rhythmicValueBeats(event.value),
          )
        }
        for (const [measure, total] of totals) {
          expect(total, `${piece.id} ${hand} compás ${measure}`).toBeCloseTo(
            4,
            9,
          )
        }

        const ids = score.events.map((event) => event.id)
        expect(new Set(ids).size, `${piece.id} ${hand}`).toBe(ids.length)
      }
    }
  })

  it('incluye digitación bilingüe y una progresión de tempo coherente', () => {
    for (const piece of studies) {
      expect(piece.fingeringEs?.trim(), `${piece.id} fingeringEs`).toBeTruthy()
      expect(piece.fingeringEn?.trim(), `${piece.id} fingeringEn`).toBeTruthy()
      expect(piece.fingeringEs, piece.id).toMatch(/Derecha/)
      expect(piece.fingeringEs, piece.id).toMatch(/Izquierda/)
      expect(piece.fingeringEn, piece.id).toMatch(/Right hand/)
      expect(piece.fingeringEn, piece.id).toMatch(/Left hand/)
      expect(piece.fingeringEs, piece.id).toMatch(/\d-\d/)
      expect(piece.fingeringEn, piece.id).toMatch(/\d-\d/)

      const plan = piece.tempoProgression
      expect(plan, piece.id).toBeDefined()
      if (!plan) continue
      expect(plan.startBpm, piece.id).toBe(handScores(piece).right.tempoBpm)
      expect(plan.targetBpm, piece.id).toBeGreaterThan(plan.startBpm)
      expect(plan.stepBpm, piece.id).toBeGreaterThan(0)
      expect(plan.stepBpm, piece.id).toBeLessThanOrEqual(24)
      expect(
        (plan.targetBpm - plan.startBpm) % plan.stepBpm,
        `${piece.id} pasos exactos`,
      ).toBe(0)
      expect(plan.targetBpm, piece.id).toBeLessThanOrEqual(120)
    }
  })

  it('convierte cada estudio en audio reproducible sin notas fuera de rango', () => {
    for (const piece of studies) {
      const { right, left } = handScores(piece)
      for (const [hand, score] of [
        ['right', right],
        ['left', left],
      ] as const) {
        const timeline = scoreToTimeline(score)
        expect(timeline, `${piece.id} ${hand}`).toHaveLength(score.events.length)

        for (const [index, event] of timeline.entries()) {
          expect(
            event.duration,
            `${piece.id} ${hand} evento ${index}`,
          ).toBeGreaterThan(0)
          expect(event.midis.length, `${piece.id} ${hand} evento ${index}`).toBe(
            1,
          )
          for (const midi of event.midis) {
            expect(
              midi,
              `${piece.id} ${hand} evento ${index}`,
            ).toBeGreaterThanOrEqual(21)
            expect(
              midi,
              `${piece.id} ${hand} evento ${index}`,
            ).toBeLessThanOrEqual(108)
          }
        }

        const times = timeline.map((event) => event.time)
        expect(times[0], `${piece.id} ${hand}`).toBe(0)
        expect([...times].sort((a, b) => a - b), `${piece.id} ${hand}`).toEqual(
          times,
        )

        const beat = 60 / score.tempoBpm
        const last = timeline[timeline.length - 1]
        expect(last, `${piece.id} ${hand}`).toBeDefined()
        if (!last) continue
        expect(
          last.time + last.duration,
          `${piece.id} ${hand}`,
        ).toBeLessThanOrEqual(32 * beat)
      }
    }
  })

  it('rechaza una progresión de tempo sin subida o con pasos imposibles', () => {
    expect(
      TempoProgressionSchema.safeParse({
        startBpm: 72,
        targetBpm: 96,
        stepBpm: 8,
      }).success,
    ).toBe(true)

    expect(
      TempoProgressionSchema.safeParse({
        startBpm: 84,
        targetBpm: 72,
        stepBpm: 4,
      }).success,
    ).toBe(false)
    expect(
      TempoProgressionSchema.safeParse({
        startBpm: 72,
        targetBpm: 72,
        stepBpm: 2,
      }).success,
    ).toBe(false)
    expect(
      TempoProgressionSchema.safeParse({
        startBpm: 60,
        targetBpm: 72,
        stepBpm: 24,
      }).success,
    ).toBe(false)
  })
})
