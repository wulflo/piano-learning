import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  AUDIT_DOCUMENT_HEADER,
  CODE_AUDIT_END,
  CODE_AUDIT_START,
  collectSourceFiles,
  parseJscpdReport,
  renderCodeAuditSection,
  scanForeignHeaders,
  upsertSection,
} from './lib/code-audit'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const AUDIT_PATH = join(ROOT, 'docs', 'AUDITORIA.md')
/** Raíces donde se buscan encabezados de copyright o licencia ajenos. */
const SCAN_ROOTS = ['src', 'scripts', 'content']
/** Raíz analizada por jscpd. */
const JSCPD_ROOT = 'src'

interface JscpdResult {
  status: number | null
  stderr: string
  error?: Error
}

function jscpdVersion(): string {
  const require = createRequire(import.meta.url)
  try {
    const pkg = require('jscpd/package.json') as { version?: string }
    return pkg.version ?? 'desconocida'
  } catch {
    return 'desconocida'
  }
}

/** Corre jscpd con el reporter JSON y devuelve el informe parseado. */
function runJscpd(): unknown {
  const require = createRequire(import.meta.url)
  const { runJscpd: run } = require('jscpd') as {
    runJscpd: (
      args: readonly string[],
      options: { encoding: 'utf8'; cwd: string },
    ) => JscpdResult
  }

  const outDir = mkdtempSync(join(tmpdir(), 'piano-jscpd-'))
  try {
    const result = run(
      [JSCPD_ROOT, '--reporters', 'json', '--output', outDir, '--no-colors'],
      { encoding: 'utf8', cwd: ROOT },
    )
    if (result.error) throw result.error
    if (result.status !== 0) {
      throw new Error(`jscpd salió con código ${result.status}: ${result.stderr}`)
    }
    return JSON.parse(readFileSync(join(outDir, 'jscpd-report.json'), 'utf8'))
  } finally {
    rmSync(outDir, { recursive: true, force: true })
  }
}

function main(): void {
  const entries = collectSourceFiles(ROOT, SCAN_ROOTS)
  const headers = scanForeignHeaders(entries)
  const audit = parseJscpdReport(runJscpd())

  const section = renderCodeAuditSection(audit, headers, {
    version: jscpdVersion(),
    jscpdRoot: JSCPD_ROOT,
    scanRoots: SCAN_ROOTS,
  })

  const document = existsSync(AUDIT_PATH)
    ? readFileSync(AUDIT_PATH, 'utf8')
    : AUDIT_DOCUMENT_HEADER
  writeFileSync(
    AUDIT_PATH,
    upsertSection(document, CODE_AUDIT_START, CODE_AUDIT_END, section),
    'utf8',
  )

  console.log('Auditoría de código')
  console.log(
    `  jscpd sobre ${JSCPD_ROOT}/: ${audit.stats.clones} clones, ${audit.stats.percentage.toFixed(2)} % de líneas duplicadas`,
  )
  console.log(
    `  Encabezados ajenos en ${SCAN_ROOTS.map((root) => `${root}/`).join(', ')}: ${headers.length}`,
  )
  console.log(`  Informe: docs/AUDITORIA.md`)

  if (headers.length > 0) {
    for (const finding of headers) {
      console.error(
        `  error · ${finding.path}:${finding.line} · ${finding.pattern} · ${finding.text}`,
      )
    }
    console.error(`\nFalló con ${headers.length} encabezado(s) ajeno(s).`)
    process.exitCode = 1
    return
  }

  console.log('  OK · sin encabezados ajenos.')
}

main()
