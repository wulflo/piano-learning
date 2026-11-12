import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SETTINGS,
  dictionaryFor,
  normalizeSettings,
} from '../src/state/settings'

/**
 * F2-065 — i18n base ES/EN.
 *
 * La paridad de claves se garantiza en tiempo de compilación porque el
 * diccionario inglés se declara como `Record<keyof typeof ES_DICTIONARY, string>`.
 * Este test la vuelve a comprobar y además busca claves literales usadas en la
 * UI que no existan en ninguno de los dos idiomas.
 */

const root = process.cwd()
const es = dictionaryFor('es')
const en = dictionaryFor('en')

function sourceFiles(directory: string): string[] {
  const result: string[] = []
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) {
      result.push(...sourceFiles(path))
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
      result.push(path)
    }
  }
  return result
}

function placeholders(template: string): string[] {
  return [...template.matchAll(/\{(\w+)\}/g)]
    .map((match) => match[1])
    .sort()
}

function usedLiteralKeys(): Set<string> {
  const used = new Set<string>()
  for (const file of sourceFiles(join(root, 'src'))) {
    const source = readFileSync(file, 'utf8')
    for (const match of source.matchAll(/(?<![A-Za-z0-9_])t\('([^']+)'/g)) {
      used.add(match[1])
    }
  }
  return used
}

describe('F2-065 — i18n base ES/EN', () => {
  it('mantiene las mismas claves y marcadores en español e inglés', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(es).sort())

    for (const key of Object.keys(es)) {
      expect(es[key], key).not.toBe('')
      expect(en[key], key).not.toBe('')
      expect(placeholders(en[key]), key).toEqual(placeholders(es[key]))
    }
  })

  it('encuentra en el diccionario todas las claves literales de la UI', () => {
    const missing = [...usedLiteralKeys()].filter((key) => !(key in es))
    expect(missing).toEqual([])
  })

  it('cubre las claves dinámicas de estados y tipos', () => {
    const dynamic = [
      ...['locked', 'available', 'in-progress', 'completed', 'empty'].map(
        (status) => `course.module.status.${status}`,
      ),
      ...['locked', 'available', 'in-progress', 'completed'].map(
        (status) => `course.lesson.status.${status}`,
      ),
      ...['due', 'new'].map((status) => `review.queue.status.${status}`),
      ...['block', 'arpeggio-up', 'arpeggio-down', 'bass-chord'].map(
        (style) => `demo.chord.${style}`,
      ),
      ...['block', 'arpeggio-up', 'arpeggio-down', 'bass-chord'].map(
        (style) => `lesson.exercise.chordStyle.${style}`,
      ),
      ...['again', 'hard', 'good', 'easy'].map(
        (rating) => `review.rating.${rating}`,
      ),
      ...['warmup', 'technique', 'theory', 'repertoire', 'review'].map(
        (kind) => `practice.block.${kind}`,
      ),
      ...['done', 'active', 'pending'].map(
        (status) => `practice.block.status.${status}`,
      ),
    ]

    for (const key of dynamic) {
      expect(es[key], key).toBeDefined()
      expect(en[key], key).toBeDefined()
    }
  })

  it('usa español por defecto y rechaza idiomas desconocidos', () => {
    expect(DEFAULT_SETTINGS.language).toBe('es')
    expect(normalizeSettings({ language: 'en' }).language).toBe('en')
    expect(normalizeSettings({ language: 'fr' }).language).toBe('es')
    expect(normalizeSettings(undefined).language).toBe('es')
  })

  it('traduce el pie y los textos del pentagrama en ambos idiomas', () => {
    expect(es['app.footer']).toContain('Salamander')
    expect(en['app.footer']).toContain('Salamander')
    expect(es['staff.noNotes']).toBe('Sin notas')
    expect(en['staff.noNotes']).toBe('No notes')
    expect(es['staff.error']).toContain('{message}')
    expect(en['staff.error']).toContain('{message}')
  })
})
