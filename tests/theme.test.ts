import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { NOTE_COLOR_FALLBACK } from '../src/staff/render'
import { DEFAULT_SETTINGS, normalizeSettings } from '../src/state/settings'

/**
 * F2-064 — Tema claro/oscuro.
 *
 * Comprueba la paleta real de `src/styles.css` y el script que aplica el tema
 * antes de pintar. No usa jsdom para el contraste: calcula la razón WCAG sobre
 * los colores declarados, porque jsdom no resuelve `prefers-color-scheme` ni
 * variables CSS en cascada.
 */

const root = process.cwd()
const css = readFileSync(join(root, 'src', 'styles.css'), 'utf8')
const html = readFileSync(join(root, 'index.html'), 'utf8')

function block(selector: string): string {
  const start = css.indexOf(selector)
  if (start === -1) throw new Error(`No se encontró el selector ${selector}`)
  const open = css.indexOf('{', start)
  let depth = 1
  let index = open + 1
  while (depth > 0 && index < css.length) {
    if (css[index] === '{') depth += 1
    if (css[index] === '}') depth -= 1
    index += 1
  }
  return css.slice(open + 1, index - 1)
}

function variables(source: string): Record<string, string> {
  const result: Record<string, string> = {}
  for (const match of source.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) {
    result[match[1]] = match[2].toLowerCase()
  }
  return result
}

function luminance(hex: string): number {
  const value = hex.replace('#', '')
  const channels = [0, 2, 4].map((offset) => {
    const channel = Number.parseInt(value.slice(offset, offset + 2), 16) / 255
    return channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

function contrast(foreground: string, background: string): number {
  const first = luminance(foreground)
  const second = luminance(background)
  const [light, dark] = first >= second ? [first, second] : [second, first]
  return (light + 0.05) / (dark + 0.05)
}

const light = variables(block(':root {'))
const dark = variables(block(":root[data-theme='dark']"))
const darkSystem = variables(block(":root:not([data-theme='light'])"))
const staffBgLight = light['staff-bg']
const staffBgDark = dark['staff-bg']

const pairs = [
  ['text', 'bg'],
  ['text', 'bg-panel'],
  ['muted', 'bg'],
  ['muted', 'bg-panel'],
  ['accent', 'bg'],
  ['accent', 'bg-panel'],
  ['focus', 'bg'],
  ['focus', 'bg-panel'],
] as const

describe('F2-064 — Tema claro/oscuro con persistencia', () => {
  it('mantiene contraste AA en la paleta clara', () => {
    for (const [foreground, background] of pairs) {
      expect(contrast(light[foreground], light[background])).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('mantiene contraste AA en la paleta oscura explícita y la del sistema', () => {
    for (const palette of [dark, darkSystem]) {
      for (const [foreground, background] of pairs) {
        expect(
          contrast(palette[foreground], palette[background]),
        ).toBeGreaterThanOrEqual(4.5)
      }
    }
    expect(dark).toEqual(darkSystem)
  })

  it('aplica el tema antes de pintar para evitar el destello', () => {
    const script = html.indexOf("localStorage.getItem('pdc.settings.v1')")
    const head = html.indexOf('</head>')
    expect(script).toBeGreaterThan(-1)
    expect(script).toBeLessThan(head)
    expect(html).toMatch(/document\.documentElement\.dataset\.theme =/)
    expect(html).toMatch(/theme === 'dark' \? 'dark' : 'light'/)
  })

  it('usa el tema claro por defecto y rechaza valores desconocidos', () => {
    expect(DEFAULT_SETTINGS.theme).toBe('light')
    expect(normalizeSettings({ theme: 'light' }).theme).toBe('light')
    expect(normalizeSettings({ theme: 'dark' }).theme).toBe('dark')
    expect(normalizeSettings({ theme: 'system' }).theme).toBe('light')
    expect(normalizeSettings({ theme: 'sepia' }).theme).toBe('light')
  })
})

describe('F3-004a — Fondo claro del pentagrama en tema oscuro', () => {
  it('pinta el área del pentagrama con fondo claro tipo papel en los dos temas', () => {
    expect(staffBgLight).toBe('#ffffff')
    expect(staffBgDark).toBe('#f7f5f0')
  })

  it('usa el fondo de pentagrama en el contenedor scrolleable', () => {
    expect(block('.staff-scroll {')).toContain('background: var(--staff-bg)')
  })

  it('mantiene contraste AA entre las notas y el fondo del pentagrama', () => {
    for (const background of [staffBgLight, staffBgDark]) {
      expect(contrast(NOTE_COLOR_FALLBACK, background)).toBeGreaterThanOrEqual(4.5)
    }
  })
})

describe('F4-032 — Contraste de análisis y partituras', () => {
  it('usa la paleta AA en la descripción del pentagrama y en el Recordá', () => {
    expect(block('.staff-text {')).toContain('color: var(--muted)')
    expect(block('.staff-text-label {')).toContain('color: var(--text)')
    expect(block('.exercise-remember {')).toContain('background: var(--bg)')
    expect(block('.exercise-feedback.is-incorrect {')).toContain(
      'background: color-mix(in srgb, var(--accent) 7%, var(--bg-panel))',
    )

    for (const palette of [light, dark, darkSystem]) {
      for (const [foreground, background] of [
        ['text', 'bg'],
        ['muted', 'bg'],
        ['text', 'bg-panel'],
        ['accent', 'bg'],
      ] as const) {
        expect(
          contrast(palette[foreground], palette[background]),
        ).toBeGreaterThanOrEqual(4.5)
      }
    }
  })

  it('distingue la corrección con texto y no solo con color', () => {
    expect(block('.exercise-result {')).toContain('font-weight: 700')
    expect(block('.exercise-feedback {')).toContain(
      'border: 1px solid var(--border)',
    )
  })
})

describe('F6-036 — Teclado estable y resaltado legible', () => {
  it('impide que el teclado expanda el grid de la lección', () => {
    expect(css).toMatch(/\.lesson-sections\s*\{\s*grid-template-columns:\s*minmax\(0,\s*1fr\)/)
    expect(css).toMatch(/\.lesson-section\s*\{\s*min-width:\s*0/)
  })

  it('resalta solo con fondo y conserva la silueta de la tecla', () => {
    expect(css).not.toMatch(/\.piano-key\[data-highlighted='true'\]::after/)
    expect(css).not.toMatch(/\.key-highlight\b/)
    expect(css).not.toContain('inset 0 0 0 3px')
    expect(css).toMatch(
      /\.piano-key-white\[data-highlighted='true'\]:not\(\.is-pressed\)\s*\{[^}]*background/,
    )
    expect(css).toMatch(
      /\.piano-key-white \.key-fingering\s*\{[^}]*top:\s*auto[^}]*bottom:\s*1\.35rem[^}]*left:\s*0\.3rem/,
    )
    expect(css).toMatch(/\.key-fingering\s*\{[^}]*flex-direction:\s*column/)
    expect(css).toMatch(/\.keyboard-keys\s*\{[^}]*height:\s*10rem/)
    expect(css).toMatch(/\.keyboard-keys\s*\{\s*height:\s*7\.5rem/)
  })
})

describe('F6-036 — El tema claro no hereda piezas del sistema oscuro', () => {
  it('limita el teclado y los errores oscuros al tema oscuro', () => {
    expect(css).toContain(":root:not([data-theme='light']) .piano-key-white")
    expect(css).toContain(":root:not([data-theme='light']) .staff-error")
    expect(css).toContain(":root:not([data-theme='light']) .audio-error")
  })
})
