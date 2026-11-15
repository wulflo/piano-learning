import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  AUDIT_SUMMARY_END,
  AUDIT_SUMMARY_START,
  classifyAudit,
  extractEvidence,
  renderAuditSummarySection,
  STATUS_LABEL,
  upsertSummarySection,
  type AuditOutcome,
} from '../scripts/lib/audit-summary'

/**
 * F6-053 — Consolidación de las auditorías offline.
 *
 * `npm run audit` encadena audio, licencias, código y texto, y escribe un
 * resumen con semáforo OK/FALLA/NO VERIFICABLE en `docs/AUDITORIA.md`.
 */

const outcome = (
  id: string,
  status: AuditOutcome['status'],
  evidence = 'evidencia',
): AuditOutcome => ({
  id,
  label: id,
  command: `npm run audit:${id}`,
  status,
  evidence,
})

describe('F6-053 — resumen de auditorías', () => {
  it('clasifica por código de salida y aviso de NO VERIFICABLE', () => {
    expect(classifyAudit(0, 'todo bien')).toBe('ok')
    expect(classifyAudit(0, 'NO VERIFICABLE · faltan datos')).toBe(
      'no-verificable',
    )
    expect(classifyAudit(1, 'NO VERIFICABLE · faltan datos')).toBe('falla')
    expect(classifyAudit(null, '')).toBe('falla')
  })

  it('extrae la línea de evidencia por prioridad', () => {
    expect(
      extractEvidence('cabecera\nOK · todo bien\nsección escrita'),
    ).toBe('OK · todo bien')
    expect(
      extractEvidence('cabecera\nNO VERIFICABLE · sin refs\nOK · otra'),
    ).toBe('NO VERIFICABLE · sin refs')
    expect(extractEvidence('cabecera\nFalló con 2 error(es).')).toBe(
      'Falló con 2 error(es).',
    )
    expect(extractEvidence('solo una línea')).toBe('solo una línea')
    expect(extractEvidence('')).toBe('')
  })

  it('renderiza una fila por auditoría con su semáforo', () => {
    const section = renderAuditSummarySection([
      outcome('audio', 'ok', 'OK · 30 muestras'),
      outcome('licenses', 'ok'),
      outcome('code', 'ok'),
      outcome('text', 'no-verificable', 'NO VERIFICABLE · sin refs'),
    ])

    expect(section).toContain('## Resumen de auditorías')
    expect(section).toContain('| Semáforo | Auditoría | Comando | Evidencia |')
    expect(section).toContain(STATUS_LABEL.ok)
    expect(section).toContain(STATUS_LABEL['no-verificable'])
    expect(section).toContain('`npm run audit:audio`')
    expect(section).toContain('OK · 30 muestras')
    expect(section).toContain('Sin fallas. NO VERIFICABLE')
  })

  it('marca el resumen como fallido si alguna auditoría falla', () => {
    const section = renderAuditSummarySection([
      outcome('audio', 'ok'),
      outcome('licenses', 'falla', 'Falló con 1 error(es).'),
    ])
    expect(section).toContain(STATUS_LABEL.falla)
    expect(section).toContain('FALLÓ: `npm run audit:licenses`')
    expect(section).not.toContain('Sin fallas')
  })

  it('inserta el resumen arriba y lo reemplaza sin duplicarlo', () => {
    const doc = [
      '# AUDITORÍA — Piano Today',
      '',
      '> Nota.',
      '',
      '<!-- audit:code:start -->',
      'código',
      '<!-- audit:code:end -->',
      '',
    ].join('\n')

    const first = upsertSummarySection(
      doc,
      AUDIT_SUMMARY_START,
      AUDIT_SUMMARY_END,
      '## Resumen de auditorías\n\nprimero',
    )
    expect(first.indexOf(AUDIT_SUMMARY_START)).toBeLessThan(
      first.indexOf('<!-- audit:code:start -->'),
    )
    expect(first).toContain('primero')

    const second = upsertSummarySection(
      first,
      AUDIT_SUMMARY_START,
      AUDIT_SUMMARY_END,
      '## Resumen de auditorías\n\nsegundo',
    )
    expect(second.match(/audit:summary:start/g)).toHaveLength(1)
    expect(second).toContain('segundo')
    expect(second).not.toContain('primero')
  })

  it('agrega el resumen al final si el documento no tiene secciones', () => {
    const result = upsertSummarySection(
      '# AUDITORÍA\n',
      AUDIT_SUMMARY_START,
      AUDIT_SUMMARY_END,
      'resumen',
    )
    expect(result).toContain('# AUDITORÍA')
    expect(result).toContain(AUDIT_SUMMARY_START)
    expect(result).toContain('resumen')
  })

  it('declara el script `audit` que encadena las auditorías offline', () => {
    const pkg = JSON.parse(
      readFileSync(join(process.cwd(), 'package.json'), 'utf8'),
    ) as { scripts: Record<string, string> }
    expect(pkg.scripts.audit).toBe('tsx scripts/audit-all.ts')
    for (const id of ['audio', 'licenses', 'code', 'text']) {
      expect(pkg.scripts[`audit:${id}`]).toBeDefined()
    }
    expect(pkg.scripts.audit).not.toContain('audit:reuse')
  })
})
