import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  AUDIT_DOCUMENT_HEADER,
} from './lib/code-audit'
import {
  AUDIT_SUMMARY_END,
  AUDIT_SUMMARY_START,
  classifyAudit,
  extractEvidence,
  renderAuditSummarySection,
  STATUS_LABEL,
  upsertSummarySection,
  type AuditOutcome,
} from './lib/audit-summary'

/**
 * F6-053 — Encadena las auditorías offline y consolida el resultado.
 *
 *   npm run audit
 *
 * Corre, en orden, audio, licencias, código y texto (ninguna necesita red),
 * escribe el resumen con semáforo OK/FALLA/NO VERIFICABLE en
 * `docs/AUDITORIA.md` y sale con código 1 si alguna auditoría falla. La
 * auditoría REUSE (`npm run audit:reuse`) queda fuera porque la primera corrida
 * baja `reuse` con `uv` y necesita red.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const AUDIT_PATH = join(ROOT, 'docs', 'AUDITORIA.md')

/**
 * Fuente de los textos de referencia que `refs/` contiene en este clon (F6-047).
 * Se cita en el informe de similitud de texto.
 */
const REFERENCES_LABEL =
  'Open Music Theory v2 (CC BY-SA 4.0) — https://github.com/OpenMusicTheory/OpenMusicTheory'

interface AuditSpec {
  id: string
  label: string
  /** Ruta del script relativa a la raíz. */
  script: string
  args: string[]
}

const AUDITS: readonly AuditSpec[] = Object.freeze([
  {
    id: 'audio',
    label: 'Audio (manifiesto y muestras)',
    script: 'scripts/verify-audio.mjs',
    args: [],
  },
  {
    id: 'licenses',
    label: 'Licencias de producción',
    script: 'scripts/audit-licenses.ts',
    args: [],
  },
  {
    id: 'code',
    label: 'Código (duplicación y encabezados)',
    script: 'scripts/audit-code.ts',
    args: [],
  },
  {
    id: 'text',
    label: 'Texto (originalidad)',
    script: 'scripts/audit-text-similarity.mjs',
    args: ['--write', 'docs/AUDITORIA.md', '--label', REFERENCES_LABEL],
  },
])

/** Devuelve el comando para ejecutar un script: `tsx` para TypeScript, `node` para ESM. */
function commandFor(script: string): string[] {
  if (!script.endsWith('.ts')) return [process.execPath, script]
  const tsx = join(ROOT, 'node_modules', '.bin', 'tsx')
  return existsSync(tsx) ? [tsx, script] : ['npx', 'tsx', script]
}

function runAudit(spec: AuditSpec): AuditOutcome {
  const [bin, ...rest] = commandFor(spec.script)
  console.log(`\n▶ ${spec.label} (${spec.script})`)
  const result = spawnSync(bin, [...rest, ...spec.args], {
    cwd: ROOT,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  })

  if (result.stdout) process.stdout.write(result.stdout)
  if (result.stderr) process.stderr.write(result.stderr)

  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`
  return {
    id: spec.id,
    label: spec.label,
    command: `npm run audit:${spec.id}`,
    status: classifyAudit(result.status, output),
    evidence: extractEvidence(output),
  }
}

function main(): void {
  const outcomes = AUDITS.map(runAudit)

  const section = renderAuditSummarySection(outcomes)
  const document = existsSync(AUDIT_PATH)
    ? readFileSync(AUDIT_PATH, 'utf8')
    : AUDIT_DOCUMENT_HEADER
  writeFileSync(
    AUDIT_PATH,
    upsertSummarySection(document, AUDIT_SUMMARY_START, AUDIT_SUMMARY_END, section),
    'utf8',
  )

  console.log('\nResumen de auditorías')
  for (const outcome of outcomes) {
    console.log(
      `  ${STATUS_LABEL[outcome.status]} · ${outcome.label}: ${outcome.evidence}`,
    )
  }
  console.log('  Informe: docs/AUDITORIA.md')

  const failed = outcomes.filter((outcome) => outcome.status === 'falla')
  if (failed.length > 0) {
    console.error(`\nFalló con ${failed.length} auditoría(s).`)
    process.exitCode = 1
  }
}

try {
  main()
} catch (error) {
  console.error('Error inesperado:', error)
  process.exitCode = 1
}
