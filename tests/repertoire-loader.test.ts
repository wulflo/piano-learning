import { describe, expect, it } from 'vitest'
import {
  hasRepertoireContent,
  loadAllRepertoirePieces,
  loadRepertoirePiece,
  loadRepertoirePieces,
  repertoireContentPaths,
} from '../src/content/repertoire'
import { validateContentBundle } from '../src/content/validate'
import { loadContentFromDisk } from '../scripts/lib/load-content'

async function realBundle() {
  const raw = await loadContentFromDisk()
  const result = validateContentBundle(raw)
  if (!result.ok || result.bundle === undefined) {
    throw new Error('El contenido real debería validar')
  }
  return result.bundle
}

describe('F5-021 — Carga y validación de piezas', () => {
  it('carga cada pieza del contenido con su ficha completa', async () => {
    const bundle = await realBundle()
    expect(bundle.repertoire.length).toBe(28)

    const loaded = await loadRepertoirePieces(
      bundle.repertoire.map((piece) => piece.id),
    )

    expect(loaded).toHaveLength(bundle.repertoire.length)
    expect(loaded.map((piece) => piece.id)).toEqual(
      bundle.repertoire.map((piece) => piece.id),
    )
    for (const piece of loaded) {
      expect(piece.license.transcriptionAuthor.length).toBeGreaterThan(0)
      expect(piece.license.source.length).toBeGreaterThan(0)
      expect(
        piece.hands.right !== undefined ||
          piece.hands.left !== undefined ||
          piece.hands.both !== undefined,
      ).toBe(true)
    }
  })

  it('resuelve las dos convenciones de nombre del repertorio', () => {
    expect(repertoireContentPaths('piece.studies.01')[0]).toBe(
      '../../content/repertoire/studies.01.json',
    )
    expect(repertoireContentPaths('piece.original.do-mayor')).toContain(
      '../../content/repertoire/original-do-mayor.json',
    )
    expect(hasRepertoireContent('piece.studies.01')).toBe(true)
    expect(hasRepertoireContent('piece.original.do-mayor')).toBe(true)
    expect(hasRepertoireContent('piece.no-existe')).toBe(false)
    expect(repertoireContentPaths('piece.')).toEqual([])
    expect(repertoireContentPaths('studies.01')).toEqual([])
    expect(repertoireContentPaths('piece.Studies 01')).toEqual([])
  })

  it('rechaza ids inválidos y piezas inexistentes', async () => {
    await expect(loadRepertoirePiece('piece.')).rejects.toThrow(
      /ID de pieza inválido/,
    )
    await expect(loadRepertoirePiece('studies.01')).rejects.toThrow(
      /ID de pieza inválido/,
    )
    await expect(
      loadRepertoirePiece('piece.no-existe'),
    ).rejects.toThrow(/no está en content\/repertoire/)
  })

  it('carga varias piezas sin duplicar lecturas', async () => {
    const pieces = await loadRepertoirePieces([
      'piece.studies.01',
      'piece.studies.01',
      'piece.studies.02',
    ])
    expect(pieces.map((piece) => piece.id)).toEqual([
      'piece.studies.01',
      'piece.studies.02',
    ])
  })

  it('carga el catálogo completo ordenado por nivel y título', async () => {
    const pieces = await loadAllRepertoirePieces()
    expect(pieces).toHaveLength(28)
    expect(new Set(pieces.map((piece) => piece.id)).size).toBe(28)
    for (let index = 1; index < pieces.length; index += 1) {
      const previous = pieces[index - 1]
      const current = pieces[index]
      if (previous === undefined || current === undefined) continue
      expect(
        previous.level < current.level ||
          (previous.level === current.level &&
            previous.title.localeCompare(current.title) <= 0),
      ).toBe(true)
    }
    for (const piece of pieces) {
      expect(piece.license.transcriptionAuthor.length).toBeGreaterThan(0)
    }
  })

  it('detecta IDs de pieza duplicados', async () => {
    const bundle = await realBundle()
    const fixture = structuredClone(bundle)
    const piece = fixture.repertoire[0]
    if (piece === undefined) throw new Error('Falta la pieza semilla')
    fixture.repertoire.push(structuredClone(piece))

    const result = validateContentBundle(fixture)

    expect(result.ok).toBe(false)
    expect(
      result.issues.some((issue) =>
        issue.message.includes('ID duplicado'),
      ),
    ).toBe(true)
  })

  it('falla si a una pieza le falta la ficha o un campo obligatorio', async () => {
    const bundle = await realBundle()

    const withoutLicense = structuredClone(bundle)
    const licensePiece = withoutLicense.repertoire[0]
    if (licensePiece === undefined) throw new Error('Falta la pieza semilla')
    delete (licensePiece as { license?: unknown }).license
    expect(validateContentBundle(withoutLicense).ok).toBe(false)

    const withoutTitle = structuredClone(bundle)
    const titlePiece = withoutTitle.repertoire[0]
    if (titlePiece === undefined) throw new Error('Falta la pieza semilla')
    titlePiece.title = ''
    expect(validateContentBundle(withoutTitle).ok).toBe(false)

    const withoutAuthor = structuredClone(bundle)
    const authorPiece = withoutAuthor.repertoire[0]
    if (authorPiece === undefined) throw new Error('Falta la pieza semilla')
    authorPiece.license.transcriptionAuthor = ''
    expect(validateContentBundle(withoutAuthor).ok).toBe(false)
  })
})
