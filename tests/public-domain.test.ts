import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { MIN_PUBLIC_DOMAIN_YEARS } from '../src/schemas'
import {
  DISCARDED_CANDIDATES,
  PUBLIC_DOMAIN_CANDIDATES,
  candidateById,
  isPublicDomainVerified,
  verifiedCandidates,
  yearsSinceDeath,
} from '../src/repertoire/public-domain'

const VERIFICATION_YEAR = 2026

function candidate(id: string) {
  const found = candidateById(id)
  if (found === undefined) throw new Error(`Falta el candidato ${id}`)
  return found
}

describe('F5-025 — Verificación de dominio público', () => {
  it('registra fichas completas y con fuente consultada', () => {
    expect(PUBLIC_DOMAIN_CANDIDATES).toHaveLength(13)
    const ids = PUBLIC_DOMAIN_CANDIDATES.map((item) => item.id)
    expect(new Set(ids).size).toBe(ids.length)

    for (const item of PUBLIC_DOMAIN_CANDIDATES) {
      expect(item.title.length).toBeGreaterThan(0)
      expect(item.work.length).toBeGreaterThan(0)
      expect(item.composer.length).toBeGreaterThan(0)
      expect(item.firstPublished.length).toBeGreaterThan(0)
      expect(item.source.length).toBeGreaterThan(0)
      expect(item.sourceUrl).toMatch(/^https:\/\//)
      expect(item.verifiedOn).toBe('2026-11-13')
      expect(item.notes.length).toBeGreaterThan(0)
      expect(item.status).toBe('verified')
    }
  })

  it('cumple el criterio conservador de más de 100 años', () => {
    const verified = verifiedCandidates()
    expect(verified).toHaveLength(13)

    for (const item of verified) {
      expect(isPublicDomainVerified(item, VERIFICATION_YEAR)).toBe(true)
      if (item.anonymousTraditional) {
        expect(item.deathYear).toBeNull()
        expect(yearsSinceDeath(item, VERIFICATION_YEAR)).toBeNull()
      } else {
        expect(item.deathYear).not.toBeNull()
        const years = yearsSinceDeath(item, VERIFICATION_YEAR)
        expect(years).not.toBeNull()
        expect(years ?? 0).toBeGreaterThan(MIN_PUBLIC_DOMAIN_YEARS)
      }
    }
  })

  it('calcula los años desde la muerte de cada compositor', () => {
    const expected: Record<string, number> = {
      'ode-to-joy': 199,
      'minuet-g': 293,
      soldatenmarsch: 170,
      'clementi-sonatina-1': 194,
      'burgmuller-arabesque': 152,
      'chopin-prelude-4': 177,
      'hanon-exercise-1': 126,
      'czerny-op599': 169,
    }

    for (const [id, years] of Object.entries(expected)) {
      expect(yearsSinceDeath(candidate(id), VERIFICATION_YEAR)).toBe(years)
    }
  })

  it('mantiene las correcciones de autoría y numeración', () => {
    const minuet = candidate('minuet-g')
    expect(minuet.composer).toBe('Christian Petzold')
    expect(minuet.deathYear).toBe(1733)
    expect(minuet.notes).toContain('Bärenreiter de 1957')
    expect(minuet.notes).toContain('J. S. Bach')

    const arabesque = candidate('burgmuller-arabesque')
    expect(arabesque.title).toContain('n.º 2')
    expect(arabesque.notes).toContain('n.º 2')
    expect(arabesque.notes).toContain('La candeur')

    expect(candidate('ode-to-joy').composer).toBe('Ludwig van Beethoven')
    expect(candidate('chopin-prelude-4').deathYear).toBe(1849)
    expect(candidate('hanon-exercise-1').deathYear).toBe(1900)
  })

  it('registra los candidatos descartados con motivo y fecha', () => {
    expect(DISCARDED_CANDIDATES.length).toBeGreaterThanOrEqual(5)
    const verifiedIds = new Set(
      PUBLIC_DOMAIN_CANDIDATES.map((item) => item.id),
    )
    const discardedIds = DISCARDED_CANDIDATES.map((item) => item.id)
    expect(new Set(discardedIds).size).toBe(discardedIds.length)

    for (const item of DISCARDED_CANDIDATES) {
      expect(verifiedIds.has(item.id)).toBe(false)
      expect(item.title.length).toBeGreaterThan(0)
      expect(item.reason.length).toBeGreaterThan(0)
      expect(item.verifiedOn).toBe('2026-11-13')
    }
  })

  it('deja el registro humano alineado con el registro machine-readable', () => {
    const doc = readFileSync(join(process.cwd(), 'docs', 'LICENCIAS.md'), 'utf8')

    expect(doc).toContain('2026-11-13')
    expect(doc).toContain('más de 100')
    for (const item of PUBLIC_DOMAIN_CANDIDATES) {
      expect(doc).toContain(item.title)
    }
    for (const item of DISCARDED_CANDIDATES) {
      expect(doc).toContain(item.title)
    }
  })
})
