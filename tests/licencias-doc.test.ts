import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * F6-049 — docs/LICENCIAS.md y la tabla de transcripciones.
 *
 * El documento afirmaba que «las trece piezas que ya están publicadas son obras
 * originales CC0», lo que contradecía su propia tabla: la mayoría son
 * transcripciones de dominio público. Además, «Transcripciones publicadas» solo
 * listaba 7 de las 28 piezas. Este test comprueba que la corrección se mantiene
 * y que la tabla coincide exactamente con `content/repertoire/`.
 */

const root = process.cwd()
const doc = readFileSync(join(root, 'docs/LICENCIAS.md'), 'utf8')
const repertoireDir = join(root, 'content', 'repertoire')

function repertoireFiles(): string[] {
  return readdirSync(repertoireDir)
    .filter((name) => name.endsWith('.json'))
    .sort()
}

function publishedSection(): string {
  const start = doc.indexOf('## Transcripciones publicadas')
  if (start < 0) throw new Error('Falta la sección «Transcripciones publicadas»')
  const rest = doc.slice(start)
  const next = rest.indexOf('\n## ', 1)
  return next < 0 ? rest : rest.slice(0, next)
}

interface PublishedRow {
  file: string
  license: string
  estado: string
}

function publishedRows(): PublishedRow[] {
  const rows: PublishedRow[] = []
  for (const line of publishedSection().split('\n')) {
    const trimmed = line.trim()
    if (!trimmed.startsWith('|')) continue
    const cells = trimmed
      .split('|')
      .slice(1, -1)
      .map((cell) => cell.trim())
    if (cells.length !== 5) continue
    if (cells[0] === 'Tarea') continue
    if (cells.every((cell) => /^-+$/.test(cell))) continue
    const match = cells[2].match(/`(content\/repertoire\/[^`]+\.json)`/)
    if (match === null) {
      throw new Error(`Fila sin archivo válido: ${line}`)
    }
    rows.push({
      file: match[1].replace('content/repertoire/', ''),
      license: cells[3],
      estado: cells[4],
    })
  }
  return rows
}

function realLicense(file: string): string {
  const piece = JSON.parse(
    readFileSync(join(repertoireDir, file), 'utf8'),
  ) as { license: { license: string } }
  return piece.license.license
}

describe('F6-049 — docs/LICENCIAS.md', () => {
  it('corrige la afirmación de que las piezas publicadas son todas CC0', () => {
    expect(doc).not.toContain('Las trece piezas')
    expect(doc).toContain('transcripciones de dominio público')
    expect(doc).toContain('obras originales CC0')
  })

  it('lista exactamente los archivos de content/repertoire/', () => {
    const files = repertoireFiles()
    const rows = publishedRows()
    expect(rows.length).toBe(files.length)
    expect([...rows.map((row) => row.file)].sort()).toEqual(files)
  })

  it('no repite archivos en la tabla', () => {
    const rows = publishedRows()
    const unique = new Set(rows.map((row) => row.file))
    expect(unique.size).toBe(rows.length)
  })

  it('declara la licencia real de cada ficha', () => {
    for (const row of publishedRows()) {
      const license = realLicense(row.file)
      expect(row.license, `Licencia de ${row.file}`).toContain(`\`${license}\``)
    }
  })

  it('marca todas las piezas como publicadas', () => {
    for (const row of publishedRows()) {
      expect(row.estado, `Estado de ${row.file}`).toBe('Publicada')
    }
  })
})
