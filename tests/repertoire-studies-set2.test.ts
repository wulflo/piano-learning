import { beforeAll, describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { rhythmicValueBeats, scoreToTimeline } from '../src/content/score'
import { validateContentBundle } from '../src/content/validate'
import type { ContentBundle, RepertoirePiece } from '../src/schemas'

const EXPECTED = [
  { id: 'piece.studies.07', key: 'C', mode: 'major', level: 3 },
  { id: 'piece.studies.08', key: 'C', mode: 'major', level: 3 },
  { id: 'piece.studies.09', key: 'G', mode: 'major', level: 3 },
  { id: 'piece.studies.10', key: 'A', mode: 'minor', level: 4 },
  { id: 'piece.studies.11', key: 'F', mode: 'major', level: 3 },
  { id: 'piece.studies.12', key: 'D', mode: 'minor', level: 4 },
] as const

let bundle: ContentBundle
let studies: RepertoirePiece[]

beforeAll(async () => {
  const result = validateContentBundle(await loadContentFromDisk())
  expect(result.ok).toBe(true)
  if (!result.bundle) throw new Error('El contenido del repositorio no es válido')
  bundle = result.bundle
  studies = bundle.repertoire
    .filter((piece) => /^piece\.studies\.(0[7-9]|1[0-2])$/.test(piece.id))
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

function measureSum(score: RepertoirePiece['hands']['right']): Map<number, number> {
  if (!score) return new Map()
  const totals = new Map<number, number>()
  for (const event of score.events) {
    totals.set(
      event.measure,
      (totals.get(event.measure) ?? 0) + rhythmicValueBeats(event.value),
    )
  }
  return totals
}

describe('F5-018 — Set 2 de estudios técnicos originales', () => {
  it('publica seis estudios intermedios CC0 con foco en independencia y arpegios', () => {
    expect(studies).toHaveLength(6)
    expect(studies.map((piece) => piece.id)).toEqual(
      EXPECTED.map((entry) => entry.id),
    )
    expect(bundle.repertoire).toHaveLength(28)

    const focus = new Set<string>()
    for (const [index, piece] of studies.entries()) {
      const expected = EXPECTED[index]
      expect(piece.level, piece.id).toBe(expected?.level)
      expect(piece.composerDisplay, piece.id).toBe('Piano Today')
      expect(piece.license.license, piece.id).toBe('cc0-1.0')
      expect(piece.license.attribution, piece.id).toContain('CC0 1.0')
      expect(piece.tags, piece.id).toContain('estudio')
      expect(piece.tags, piece.id).toContain('técnica')
      for (const tag of ['independencia', 'arpegios']) {
        if (piece.tags.includes(tag)) focus.add(tag)
      }
      expect(piece.durationSeconds, piece.id).toBeGreaterThan(0)
    }

    expect(focus).toEqual(new Set(['independencia', 'arpegios']))
  })

  it('separa las manos, completa ocho compases y respeta la tonalidad', () => {
    for (const [index, piece] of studies.entries()) {
      const expected = EXPECTED[index]
      const { right, left } = handScores(piece)
      expect(right.key, piece.id).toBe(expected?.key)
      expect(left.key, piece.id).toBe(expected?.key)
      expect(right.mode, piece.id).toBe(expected?.mode)
      expect(left.mode, piece.id).toBe(expected?.mode)
      expect(right.clef, `${piece.id} derecha`).toBe('treble')
      expect(left.clef, `${piece.id} izquierda`).toBe('bass')
      expect(right.tempoBpm, piece.id).toBe(left.tempoBpm)

      for (const [hand, score] of [
        ['right', right],
        ['left', left],
      ] as const) {
        expect(score.timeSignature, `${piece.id} ${hand}`).toEqual({
          numerator: 4,
          denominator: 4,
        })
        const sums = measureSum(score)
        expect([...sums.keys()].sort((a, b) => a - b), `${piece.id} ${hand}`).toEqual(
          [1, 2, 3, 4, 5, 6, 7, 8],
        )
        for (const [measure, total] of sums) {
          expect(total, `${piece.id} ${hand} compás ${measure}`).toBeCloseTo(
            4,
            9,
          )
        }
        expect(
          score.events.every((event) => event.hand === hand),
          `${piece.id} ${hand}`,
        ).toBe(true)
      }
    }
  })

  it('documenta digitación bilingüe y progresión de tempo exacta', () => {
    for (const piece of studies) {
      expect(piece.notesEs?.trim(), piece.id).toBeTruthy()
      expect(piece.notesEn?.trim(), piece.id).toBeTruthy()
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
      expect(plan.targetBpm, piece.id).toBeGreaterThanOrEqual(76)
      expect(plan.targetBpm, piece.id).toBeLessThanOrEqual(96)
      expect(
        (plan.targetBpm - plan.startBpm) % plan.stepBpm,
        `${piece.id} pasos exactos`,
      ).toBe(0)
    }
  })

  it('genera audio reproducible y conserva el tres contra dos del estudio 10', () => {
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
          for (const midi of event.midis) {
            expect(midi, `${piece.id} ${hand} evento ${index}`).toBeGreaterThanOrEqual(21)
            expect(midi, `${piece.id} ${hand} evento ${index}`).toBeLessThanOrEqual(108)
          }
        }
      }
    }

    const polyrhythm = studies.find((piece) => piece.id === 'piece.studies.10')
    expect(polyrhythm).toBeDefined()
    if (!polyrhythm) return
    const { right, left } = handScores(polyrhythm)
    for (const event of right.events) {
      expect(event.value.tuplet, event.id).toBe('triplet')
    }
    for (let measure = 1; measure <= 8; measure += 1) {
      expect(
        right.events.filter((event) => event.measure === measure),
        `derecha compás ${measure}`,
      ).toHaveLength(12)
      expect(
        left.events.filter((event) => event.measure === measure),
        `izquierda compás ${measure}`,
      ).toHaveLength(8)
    }

    const beat = 60 / right.tempoBpm
    const triplet = scoreToTimeline(right)[0]
    expect(triplet?.duration).toBeCloseTo(beat / 3, 9)
  })
})
