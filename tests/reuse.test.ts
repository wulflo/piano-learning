import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()
const toml = readFileSync(join(root, 'REUSE.toml'), 'utf8')

interface Annotation {
  path: string[]
  precedence: string
  copyright: string
  license: string
}

/**
 * Parser mínimo de `REUSE.toml`. No se agrega una dependencia TOML: el archivo
 * solo tiene `version` y una lista de `[[annotations]]` con claves simples.
 */
function parseReuseToml(text: string): { version: number; annotations: Annotation[] } {
  const blocks: Array<Record<string, unknown>> = []
  let version = 0
  let current: Record<string, unknown> | null = null

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (line === '' || line.startsWith('#')) continue
    if (line === '[[annotations]]') {
      current = {}
      blocks.push(current)
      continue
    }
    const match = /^([A-Za-z0-9_-]+)\s*=\s*(.+)$/.exec(line)
    if (!match) continue
    const [, key, rawValue] = match
    const value = parseValue(rawValue.trim())
    if (current) current[key] = value
    else if (key === 'version') version = Number(value)
  }

  return {
    version,
    annotations: blocks.map((block) => ({
      path: block.path as string[],
      precedence: block.precedence as string,
      copyright: block['SPDX-FileCopyrightText'] as string,
      license: block['SPDX-License-Identifier'] as string,
    })),
  }
}

function parseValue(raw: string): string | string[] {
  if (raw.startsWith('[') && raw.endsWith(']')) {
    return raw
      .slice(1, -1)
      .split(',')
      .map((item) => item.trim().replace(/^"(.*)"$/, '$1'))
      .filter((item) => item !== '')
  }
  return raw.replace(/^"(.*)"$/, '$1')
}

const { version, annotations } = parseReuseToml(toml)
const usedIds = [...new Set(annotations.map((annotation) => annotation.license))].sort()

/**
 * F6-044 — Cumplimiento REUSE.
 *
 * La licencia de cada archivo versionado se declara en `REUSE.toml` (sin
 * encabezados SPDX dentro de los archivos, para no chocar con `audit:code`).
 * Este test comprueba la estructura de la configuración y que exista el texto
 * de cada licencia usada; el linter real corre aparte con `npm run audit:reuse`
 * porque necesita `uv` y red la primera vez.
 */
describe('F6-044 — cumplimiento REUSE', () => {
  it('declara la versión 1 de la especificación', () => {
    expect(version).toBe(1)
  })

  it('cada anotación tiene ruta, precedencia, copyright y licencia', () => {
    expect(annotations.length).toBeGreaterThan(0)
    for (const annotation of annotations) {
      expect(Array.isArray(annotation.path)).toBe(true)
      expect(annotation.path.length).toBeGreaterThan(0)
      expect(['aggregate', 'override']).toContain(annotation.precedence)
      expect(annotation.copyright).toBeTruthy()
      expect(annotation.license).toBeTruthy()
    }
  })

  it('cubre todo el repositorio con una anotación amplia primero', () => {
    expect(annotations[0].path).toContain('**')
    expect(annotations[0].license).toBe('MIT')
  })

  it('mapea el contenido a CC BY-SA 4.0 y los estudios u originales a CC0 1.0', () => {
    const content = annotations.find((annotation) => annotation.path.includes('content/**'))
    expect(content?.license).toBe('CC-BY-SA-4.0')

    const cc0 = annotations.find((annotation) =>
      annotation.path.includes('content/repertoire/studies.*.json'),
    )
    expect(cc0?.license).toBe('CC0-1.0')
    expect(cc0?.path).toContain('content/repertoire/original-*.json')

    // En un mismo REUSE.toml prevalece la última coincidencia: lo específico
    // tiene que ir después de lo general.
    expect(annotations.indexOf(content!)).toBeLessThan(annotations.indexOf(cc0!))
  })

  it('existe el texto de cada licencia usada en LICENSES/', () => {
    expect(usedIds.length).toBeGreaterThan(0)
    for (const id of usedIds) {
      const file = join(root, 'LICENSES', `${id}.txt`)
      expect(existsSync(file), `Falta LICENSES/${id}.txt`).toBe(true)
      expect(readFileSync(file, 'utf8').trim().length).toBeGreaterThan(0)
    }
  })

  it('no deja textos de licencia sin usar en LICENSES/', () => {
    const files = readdirSync(join(root, 'LICENSES'))
      .filter((file) => file.endsWith('.txt'))
      .map((file) => file.replace(/\.txt$/, ''))
    expect(files.sort()).toEqual(usedIds)
  })

  it('conserva las licencias raíz del proyecto y del contenido', () => {
    expect(existsSync(join(root, 'LICENSE'))).toBe(true)
    expect(existsSync(join(root, 'LICENSE-CONTENT'))).toBe(true)
  })
})
