import { readdirSync, readFileSync, statSync } from 'node:fs'
import { extname, join, relative, sep } from 'node:path'

/**
 * F6-043 — Auditoría de duplicación de código y encabezados ajenos.
 *
 * La lógica vive aquí para poder probarla sin ejecutar el script. El script
 * `scripts/audit-code.ts` la usa, corre jscpd y decide el código de salida.
 */

/**
 * Patrones de encabezados de copyright o licencia ajenos. Son deliberadamente
 * precisos: no alcanza con que aparezca la palabra «SPDX» o «copyright» en un
 * comentario, sino que tiene que ser un encabezado real (`SPDX-License-Identifier:`,
 * `Copyright 2024`, `GPL`, `licensed under`).
 */
export interface ForeignHeaderPattern {
  id: string
  label: string
  regex: RegExp
}

export const FOREIGN_HEADER_PATTERNS: readonly ForeignHeaderPattern[] =
  Object.freeze([
    {
      id: 'copyright',
      label: 'Copyright',
      regex: /Copyright\s*(?:\(c\)|©|\d{4})/i,
    },
    {
      id: 'spdx',
      label: 'SPDX-License-Identifier',
      regex: /SPDX-License-Identifier\s*:/i,
    },
    {
      id: 'gpl',
      label: 'GPL',
      regex: /\b(?:A?L?GPL)\b/,
    },
    {
      id: 'licensed-under',
      label: 'licensed under',
      regex: /licen[cs]ed under/i,
    },
  ])

/**
 * Archivos que definen los patrones anteriores. Se excluyen de la búsqueda para
 * que el auditor no se autoinforme al contener los literales que busca.
 */
export const AUDIT_IMPLEMENTATION_PATHS: readonly string[] = Object.freeze([
  'scripts/audit-code.ts',
  'scripts/lib/code-audit.ts',
])

export interface SourceEntry {
  /** Ruta relativa a la raíz del proyecto, con `/` como separador. */
  path: string
  content: string
}

export interface HeaderFinding {
  path: string
  line: number
  pattern: string
  text: string
}

/** Extensiones que se consideran texto auditable. */
export const TEXT_EXTENSIONS: readonly string[] = Object.freeze([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.json',
  '.css',
  '.scss',
  '.html',
  '.md',
  '.txt',
  '.svg',
])

const SKIP_DIRECTORIES = new Set([
  'node_modules',
  '.git',
  'dist',
  'coverage',
  'test-results',
  'playwright-report',
])

/**
 * Recorre `dirs` (relativos a `root`) y devuelve los archivos de texto con su
 * contenido, ordenados por ruta. Omite carpetas de build y dependencias.
 */
export function collectSourceFiles(
  root: string,
  dirs: readonly string[],
): SourceEntry[] {
  const entries: SourceEntry[] = []
  for (const dir of dirs) {
    walk(join(root, dir), root, entries)
  }
  return entries.sort((a, b) => a.path.localeCompare(b.path, 'en'))
}

function walk(dir: string, root: string, out: SourceEntry[]): void {
  let items: string[]
  try {
    items = readdirSync(dir)
  } catch {
    return
  }

  for (const item of items) {
    if (SKIP_DIRECTORIES.has(item)) continue
    const full = join(dir, item)
    let info
    try {
      info = statSync(full)
    } catch {
      continue
    }
    if (info.isDirectory()) {
      walk(full, root, out)
      continue
    }
    if (!info.isFile()) continue
    if (!TEXT_EXTENSIONS.includes(extname(item))) continue
    out.push({
      path: relative(root, full).split(sep).join('/'),
      content: readFileSync(full, 'utf8'),
    })
  }
}

/**
 * Busca los patrones de encabezado ajeno en las entradas dadas y devuelve una
 * coincidencia por patrón y línea, con archivo y número de línea.
 */
export function scanForeignHeaders(
  entries: Iterable<SourceEntry>,
  patterns: readonly ForeignHeaderPattern[] = FOREIGN_HEADER_PATTERNS,
  exclude: ReadonlySet<string> = new Set(AUDIT_IMPLEMENTATION_PATHS),
): HeaderFinding[] {
  const findings: HeaderFinding[] = []
  for (const entry of entries) {
    if (exclude.has(entry.path)) continue
    const lines = entry.content.split(/\r?\n/)
    lines.forEach((text, index) => {
      for (const pattern of patterns) {
        if (pattern.regex.test(text)) {
          findings.push({
            path: entry.path,
            line: index + 1,
            pattern: pattern.label,
            text: text.trim(),
          })
        }
      }
    })
  }
  return findings
}

interface RawLocation {
  name?: unknown
  startLoc?: { line?: unknown }
  endLoc?: { line?: unknown }
}

export interface CloneLocation {
  file: string
  startLine: number
  endLine: number
}

export interface CodeClone {
  first: CloneLocation
  second: CloneLocation
  lines: number
  tokens: number
  kind: string
  format: string
}

export interface CodeDuplicationStats {
  clones: number
  lines: number
  duplicatedLines: number
  duplicatedTokens: number
  percentage: number
  percentageTokens: number
  sources: number
}

export interface CodeAudit {
  clones: CodeClone[]
  stats: CodeDuplicationStats
}

function toNumber(value: unknown): number {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function toLocation(raw: RawLocation | undefined): CloneLocation {
  return {
    file: typeof raw?.name === 'string' ? raw.name : '?',
    startLine: toNumber(raw?.startLoc?.line),
    endLine: toNumber(raw?.endLoc?.line),
  }
}

/** Normaliza el informe JSON de jscpd a una forma estable y tipada. */
export function parseJscpdReport(report: unknown): CodeAudit {
  const data = (report ?? {}) as {
    duplicates?: unknown
    statistics?: unknown
  }
  const rawDuplicates = Array.isArray(data.duplicates) ? data.duplicates : []

  const clones: CodeClone[] = rawDuplicates.map((entry) => {
    const duplicate = entry as {
      firstFile?: RawLocation
      secondFile?: RawLocation
      lines?: unknown
      tokens?: unknown
      kind?: unknown
      format?: unknown
    }
    return {
      first: toLocation(duplicate.firstFile),
      second: toLocation(duplicate.secondFile),
      lines: toNumber(duplicate.lines),
      tokens: toNumber(duplicate.tokens),
      kind: typeof duplicate.kind === 'string' ? duplicate.kind : 'exact',
      format: typeof duplicate.format === 'string' ? duplicate.format : '?',
    }
  })

  const statistics = (data.statistics ?? {}) as { total?: Record<string, unknown> }
  const total = statistics.total ?? {}
  return {
    clones,
    stats: {
      clones: toNumber(total.clones),
      lines: toNumber(total.lines),
      duplicatedLines: toNumber(total.duplicatedLines),
      duplicatedTokens: toNumber(total.duplicatedTokens),
      percentage: toNumber(total.percentage),
      percentageTokens: toNumber(total.percentageTokens),
      sources: toNumber(total.sources),
    },
  }
}

export const CODE_AUDIT_START = '<!-- audit:code:start -->'
export const CODE_AUDIT_END = '<!-- audit:code:end -->'

/** Encabezado del informe cuando todavía no existe. */
export const AUDIT_DOCUMENT_HEADER = `# AUDITORÍA — Piano Today

> Informe de las auditorías de cierre. Cada sección la escribe su comando
> (\`npm run audit:code\`, \`npm run audit:text\` y \`npm run audit\`); no se edita a mano.
`

export interface CodeAuditMeta {
  /** Versión de jscpd que produjo el informe. */
  version: string
  /** Raíz analizada por jscpd (por ejemplo, `src`). */
  jscpdRoot: string
  /** Raíces revisadas en busca de encabezados ajenos. */
  scanRoots: readonly string[]
}

function formatLocation(root: string, location: CloneLocation): string {
  const range =
    location.endLine > location.startLine
      ? `${location.startLine}-${location.endLine}`
      : `${location.startLine}`
  return `${root}/${location.file}:${range}`
}

function escapeCell(text: string): string {
  const single = text.replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim()
  return single.length > 120 ? `${single.slice(0, 117)}…` : single
}

/** Renderiza la sección de `docs/AUDITORIA.md` que corresponde a F6-043. */
export function renderCodeAuditSection(
  audit: CodeAudit,
  headers: readonly HeaderFinding[],
  meta: CodeAuditMeta,
): string {
  const { stats } = audit
  const lines: string[] = []
  lines.push('## Duplicación de código y encabezados ajenos')
  lines.push('')
  lines.push(`- Comando: \`npm run audit:code\` (jscpd ${meta.version})`)
  lines.push(
    `- jscpd sobre \`${meta.jscpdRoot}/\`: ${stats.sources} archivos, ${stats.clones} clones, ${stats.duplicatedLines} líneas duplicadas (${stats.percentage.toFixed(2)} %) y ${stats.duplicatedTokens} tokens duplicados (${stats.percentageTokens.toFixed(2)} %).`,
  )
  lines.push('')
  lines.push('### Clones detectados')
  lines.push('')

  if (audit.clones.length === 0) {
    lines.push('Sin clones por encima del umbral de jscpd.')
  } else {
    lines.push('| Ubicación A | Ubicación B | Líneas | Tokens | Tipo |')
    lines.push('|---|---|---:|---:|---|')
    for (const clone of audit.clones) {
      lines.push(
        `| \`${formatLocation(meta.jscpdRoot, clone.first)}\` | \`${formatLocation(meta.jscpdRoot, clone.second)}\` | ${clone.lines} | ${clone.tokens} | ${clone.kind} |`,
      )
    }
  }

  lines.push('')
  lines.push('### Encabezados de copyright o licencia ajenos')
  lines.push('')
  lines.push(
    `Se revisan ${meta.scanRoots.map((root) => `\`${root}/\``).join(', ')} buscando \`Copyright\`, \`SPDX-License-Identifier\`, \`GPL\` y \`licensed under\`.`,
  )
  lines.push('')

  if (headers.length === 0) {
    lines.push('Sin hallazgos.')
  } else {
    lines.push('| Archivo | Línea | Patrón | Texto |')
    lines.push('|---|---:|---|---|')
    for (const finding of headers) {
      lines.push(
        `| \`${finding.path}\` | ${finding.line} | ${finding.pattern} | \`${escapeCell(finding.text)}\` |`,
      )
    }
  }

  lines.push('')
  return lines.join('\n')
}

/**
 * Reemplaza el bloque delimitado por `start` y `end`, o lo agrega al final si
 * todavía no existe. Permite que varias tareas escriban secciones distintas en
 * el mismo `docs/AUDITORIA.md` sin pisarse.
 */
export function upsertSection(
  document: string,
  start: string,
  end: string,
  body: string,
): string {
  const block = `${start}\n${body.trim()}\n${end}`
  const startIndex = document.indexOf(start)
  const endIndex = document.indexOf(end)
  if (startIndex >= 0 && endIndex > startIndex) {
    return (
      document.slice(0, startIndex) + block + document.slice(endIndex + end.length)
    )
  }
  return `${document.replace(/\s+$/, '')}\n\n${block}\n`
}
