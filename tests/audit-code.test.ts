import { describe, expect, it } from 'vitest'
import {
  AUDIT_DOCUMENT_HEADER,
  CODE_AUDIT_END,
  CODE_AUDIT_START,
  collectSourceFiles,
  parseJscpdReport,
  renderCodeAuditSection,
  scanForeignHeaders,
  upsertSection,
} from '../scripts/lib/code-audit'

/**
 * F6-043 — Auditoría de duplicación de código y encabezados ajenos.
 *
 * `npm run audit:code` corre jscpd sobre `src/`, busca encabezados de copyright
 * o licencia ajenos en `src/`, `scripts/` y `content/`, y vuelca archivo y línea
 * a `docs/AUDITORIA.md`.
 */
describe('F6-043 — auditoría de código', () => {
  it('detecta encabezados de copyright y licencia ajenos', () => {
    const entries = [
      { path: 'src/a.ts', content: '// Copyright 2024 Acme Corp\nconst a = 1\n' },
      { path: 'src/b.ts', content: '// SPDX-License-Identifier: MIT\nexport {}\n' },
      { path: 'src/c.ts', content: '# GPL-3.0\n' },
      { path: 'src/d.ts', content: '// licensed under the Apache License\n' },
    ]
    const findings = scanForeignHeaders(entries)
    expect(findings.map((finding) => finding.path)).toEqual([
      'src/a.ts',
      'src/b.ts',
      'src/c.ts',
      'src/d.ts',
    ])
    expect(findings[0].line).toBe(1)
    expect(findings[0].pattern).toBe('Copyright')
  })

  it('no confunde menciones legítimas con encabezados', () => {
    const entries = [
      {
        path: 'src/a.ts',
        content: '// Identificador SPDX de la licencia\n// Obra bajo copyright, sin fecha\n',
      },
      { path: 'content/b.json', content: '{"nota": "el estado de copyright varía"}\n' },
    ]
    expect(scanForeignHeaders(entries)).toEqual([])
  })

  it('señala el número de línea correcto', () => {
    const entries = [{ path: 'src/a.ts', content: 'uno\ndos\n// Copyright (c) 2020\n' }]
    const [finding] = scanForeignHeaders(entries)
    expect(finding.line).toBe(3)
  })

  it('normaliza el informe JSON de jscpd', () => {
    const report = {
      duplicates: [
        {
          firstFile: { name: 'audio/engine.ts', startLoc: { line: 383 }, endLoc: { line: 397 } },
          secondFile: { name: 'audio/engine.ts', startLoc: { line: 413 }, endLoc: { line: 427 } },
          lines: 15,
          tokens: 94,
          kind: 'exact',
          format: 'typescript',
        },
      ],
      statistics: {
        total: {
          clones: 1,
          lines: 100,
          duplicatedLines: 15,
          duplicatedTokens: 94,
          percentage: 15,
          percentageTokens: 9.4,
          sources: 2,
        },
      },
    }

    const audit = parseJscpdReport(report)
    expect(audit.stats).toEqual({
      clones: 1,
      lines: 100,
      duplicatedLines: 15,
      duplicatedTokens: 94,
      percentage: 15,
      percentageTokens: 9.4,
      sources: 2,
    })
    expect(audit.clones).toHaveLength(1)
    expect(audit.clones[0].first).toEqual({
      file: 'audio/engine.ts',
      startLine: 383,
      endLine: 397,
    })
  })

  it('tolera un informe vacío o incompleto', () => {
    const audit = parseJscpdReport(undefined)
    expect(audit.clones).toEqual([])
    expect(audit.stats.clones).toBe(0)
    expect(audit.stats.percentage).toBe(0)
  })

  it('renderiza archivo y línea en la sección del informe', () => {
    const audit = parseJscpdReport({
      duplicates: [
        {
          firstFile: { name: 'a.ts', startLoc: { line: 1 }, endLoc: { line: 5 } },
          secondFile: { name: 'b.ts', startLoc: { line: 9 }, endLoc: { line: 13 } },
          lines: 5,
          tokens: 40,
          kind: 'exact',
          format: 'typescript',
        },
      ],
      statistics: { total: { clones: 1, percentage: 1.5, percentageTokens: 1.2, sources: 2 } },
    })
    const section = renderCodeAuditSection(audit, [], {
      version: '5.4.3',
      jscpdRoot: 'src',
      scanRoots: ['src', 'scripts', 'content'],
    })

    expect(section).toContain('`src/a.ts:1-5`')
    expect(section).toContain('`src/b.ts:9-13`')
    expect(section).toContain('Sin hallazgos')
  })

  it('lista los encabezados ajenos con archivo y línea', () => {
    const section = renderCodeAuditSection(parseJscpdReport(undefined), [
      { path: 'src/x.ts', line: 7, pattern: 'Copyright', text: '// Copyright 2024' },
    ], {
      version: '5.4.3',
      jscpdRoot: 'src',
      scanRoots: ['src'],
    })

    expect(section).toContain('| `src/x.ts` | 7 | Copyright |')
  })

  it('inserta y reemplaza su sección sin tocar el resto', () => {
    const body = '## Sección\n\ncontenido'
    const withSection = upsertSection(
      AUDIT_DOCUMENT_HEADER,
      CODE_AUDIT_START,
      CODE_AUDIT_END,
      body,
    )
    expect(withSection).toContain(`${CODE_AUDIT_START}\n${body}\n${CODE_AUDIT_END}`)

    const updated = upsertSection(withSection, CODE_AUDIT_START, CODE_AUDIT_END, 'nuevo')
    expect(updated).toContain(`${CODE_AUDIT_START}\nnuevo\n${CODE_AUDIT_END}`)
    expect(updated).not.toContain('contenido')
    expect(updated.match(/audit:code:start/g)).toHaveLength(1)
  })

  it('el repositorio no tiene encabezados de copyright o licencia ajenos', () => {
    const entries = collectSourceFiles(process.cwd(), ['src', 'scripts', 'content'])
    expect(entries.length).toBeGreaterThan(0)
    expect(scanForeignHeaders(entries)).toEqual([])
  })
})
