import { describe, expect, it } from 'vitest'
import { validateContentBundle } from '../src/content/validate'
import {
  AudioManifestSchema,
  ContentBundleSchema,
  ProgressDataSchema,
  ProgressEnvelopeSchema,
} from '../src/schemas'
import { loadContentFromDisk } from '../scripts/lib/load-content'

describe('esquema de contenido', () => {
  it('valida el contenido real del repositorio', async () => {
    const raw = await loadContentFromDisk()
    const result = validateContentBundle(raw)

    expect(result.ok).toBe(true)
    expect(result.stats.modules).toBe(9)
    expect(result.stats.lessons).toBeGreaterThan(0)
    expect(result.stats.exercises).toBeGreaterThan(0)
    expect(result.stats.skills).toBeGreaterThan(0)
    expect(result.bundle).toBeDefined()
  })

  it('rechaza una obra de dominio público con compositor fallecido hace menos de 100 años', async () => {
    const raw = await loadContentFromDisk()
    const base = validateContentBundle(raw).bundle
    if (!base) throw new Error('El contenido base debería ser válido')

    const fixture = structuredClone(base)
    const piece = fixture.repertoire[0]
    if (!piece) throw new Error('Falta la pieza semilla')

    piece.license.license = 'public-domain'
    piece.license.composer.deathYear = 1990

    const result = validateContentBundle(fixture)

    expect(result.ok).toBe(false)
    expect(
      result.issues.some((issue) => issue.message.includes('100 años')),
    ).toBe(true)
  })

  it('rechaza una ficha sin compositor', async () => {
    const raw = await loadContentFromDisk()
    const base = validateContentBundle(raw).bundle
    if (!base) throw new Error('El contenido base debería ser válido')

    const fixture = structuredClone(base)
    const piece = fixture.repertoire[0]
    if (!piece) throw new Error('Falta la pieza semilla')
    piece.license.composer.name = ''

    const result = validateContentBundle(fixture)

    expect(result.ok).toBe(false)
    expect(
      result.issues.some((issue) => issue.path.includes('composer.name')),
    ).toBe(true)
  })

  it('rechaza una ficha sin fuente', async () => {
    const raw = await loadContentFromDisk()
    const base = validateContentBundle(raw).bundle
    if (!base) throw new Error('El contenido base debería ser válido')

    const fixture = structuredClone(base)
    const piece = fixture.repertoire[0]
    if (!piece) throw new Error('Falta la pieza semilla')
    piece.license.source = ''

    const result = validateContentBundle(fixture)

    expect(result.ok).toBe(false)
    expect(result.issues.some((issue) => issue.path.includes('source'))).toBe(
      true,
    )
  })

  it('detecta referencias inexistentes entre lecciones y habilidades', async () => {
    const raw = await loadContentFromDisk()
    const base = validateContentBundle(raw).bundle
    if (!base) throw new Error('El contenido base debería ser válido')

    const fixture = structuredClone(base)
    const lesson = fixture.lessons[0]
    if (!lesson) throw new Error('Falta la lección semilla')
    lesson.prerequisites = ['lesson.inexistente']

    const result = validateContentBundle(fixture)

    expect(result.ok).toBe(false)
    expect(
      result.issues.some((issue) =>
        issue.message.includes('Prerrequisito inexistente'),
      ),
    ).toBe(true)
  })

  it('detecta IDs duplicados', async () => {
    const raw = await loadContentFromDisk()
    const base = validateContentBundle(raw).bundle
    if (!base) throw new Error('El contenido base debería ser válido')

    const fixture = structuredClone(base)
    const skill = fixture.skills[0]
    if (!skill) throw new Error('Falta la habilidad semilla')
    fixture.skills.push(structuredClone(skill))

    const result = validateContentBundle(fixture)

    expect(result.ok).toBe(false)
    expect(
      result.issues.some((issue) => issue.message.includes('ID duplicado')),
    ).toBe(true)
  })
})

describe('esquemas de progreso y audio', () => {
  it('aplica valores por defecto al progreso nuevo', () => {
    const data = ProgressDataSchema.parse({ schemaVersion: 1 })

    expect(data.settings.notation).toBe('do')
    expect(data.settings.desiredRetention).toBe(0.9)
    expect(data.xp).toBe(0)
    expect(data.reviews).toEqual([])
  })

  it('valida un sobre de exportación con SHA-256', () => {
    const envelope = {
      format: 'pianodesdecero.progress',
      version: 1,
      exportedAt: '2026-11-09T03:00:00.000Z',
      appVersion: '0.1.0',
      sha256: 'a'.repeat(64),
      data: { schemaVersion: 1 },
    }

    expect(ProgressEnvelopeSchema.safeParse(envelope).success).toBe(true)
    expect(
      ProgressEnvelopeSchema.safeParse({ ...envelope, sha256: 'abc' }).success,
    ).toBe(false)
  })

  it('valida el manifiesto de audio incompleto para el dry-run', () => {
    const manifest = {
      version: 1,
      instrument: 'salamander-grand-piano',
      attribution: 'Salamander Grand Piano by Alexander Holm, CC BY 3.0',
      license: 'CC-BY-3.0',
      sourceUrl: 'https://tonejs.github.io/audio/salamander/',
      originUrl: 'https://archive.org/details/SalamanderGrandPianoV3',
      expectedSamples: 30,
      samples: [],
    }

    expect(AudioManifestSchema.safeParse(manifest).success).toBe(true)
  })

  it('el bundle completo exige una versión 1', async () => {
    const raw = await loadContentFromDisk()
    expect(ContentBundleSchema.safeParse({ ...raw, version: 2 }).success).toBe(
      false,
    )
  })
})
