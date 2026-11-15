/**
 * F6-053 — Consolidación de las auditorías de cierre.
 *
 * `npm run audit` encadena las auditorías que no necesitan red (audio,
 * licencias, código y texto) y escribe un resumen con semáforo en
 * `docs/AUDITORIA.md`. La lógica vive aquí para poder probarla sin ejecutar
 * jscpd, license-checker ni el escaneo de texto.
 */

/** Resultado posible de una auditoría. */
export type AuditStatus = 'ok' | 'falla' | 'no-verificable'

export const AUDIT_SUMMARY_START = '<!-- audit:summary:start -->'
export const AUDIT_SUMMARY_END = '<!-- audit:summary:end -->'

export interface AuditOutcome {
  /** Identificador corto (`audio`, `licenses`, `code`, `text`). */
  id: string
  /** Nombre legible de la auditoría. */
  label: string
  /** Comando npm que la ejecuta (`npm run audit:audio`). */
  command: string
  status: AuditStatus
  /** Línea de evidencia tomada de la salida del comando. */
  evidence: string
}

/** Semáforo en texto para el resumen. */
export const STATUS_LABEL: Record<AuditStatus, string> = {
  ok: '🟢 OK',
  falla: '🔴 FALLA',
  'no-verificable': '🟡 NO VERIFICABLE',
}

/**
 * Decide el semáforo a partir del código de salida y la salida combinada del
 * comando. Un código distinto de cero siempre es FALLA; si el comando salió
 * bien pero informó NO VERIFICABLE, no se puede comprobar.
 */
export function classifyAudit(
  exitCode: number | null,
  output: string,
): AuditStatus {
  if (exitCode !== 0) return 'falla'
  if (/NO VERIFICABLE/.test(output)) return 'no-verificable'
  return 'ok'
}

/**
 * Extrae una línea de evidencia de la salida del comando: prioriza el aviso de
 * NO VERIFICABLE, luego la línea OK, luego el fallo y, si no hay ninguna, la
 * última línea con texto.
 */
export function extractEvidence(output: string): string {
  const lines = output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  const pick = (pattern: RegExp): string | undefined =>
    lines.find((line) => pattern.test(line))

  return (
    pick(/NO VERIFICABLE/) ??
    pick(/^OK\b/) ??
    pick(/Falló/) ??
    lines[lines.length - 1] ??
    ''
  )
}

function escapeCell(text: string): string {
  const single = text.replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim()
  return single.length > 160 ? `${single.slice(0, 157)}…` : single
}

/** Renderiza la sección de resumen que encabeza `docs/AUDITORIA.md`. */
export function renderAuditSummarySection(
  outcomes: readonly AuditOutcome[],
): string {
  const lines: string[] = []
  lines.push('## Resumen de auditorías')
  lines.push('')
  lines.push(
    'Lo escribe `npm run audit` (auditorías offline: audio, licencias, código y texto). No se edita a mano.',
  )
  lines.push('')
  lines.push('| Semáforo | Auditoría | Comando | Evidencia |')
  lines.push('|---|---|---|---|')
  for (const outcome of outcomes) {
    lines.push(
      `| ${STATUS_LABEL[outcome.status]} | ${outcome.label} | \`${outcome.command}\` | ${escapeCell(outcome.evidence)} |`,
    )
  }
  lines.push('')

  const failed = outcomes.filter((outcome) => outcome.status === 'falla')
  const notVerifiable = outcomes.filter(
    (outcome) => outcome.status === 'no-verificable',
  )

  if (failed.length > 0) {
    lines.push(
      `FALLÓ: ${failed.map((outcome) => `\`${outcome.command}\``).join(', ')}. Revisá la sección correspondiente.`,
    )
  } else if (notVerifiable.length > 0) {
    lines.push(
      `Sin fallas. NO VERIFICABLE: ${notVerifiable
        .map((outcome) => `\`${outcome.command}\``)
        .join(', ')} (requiere datos locales que no se versionan).`,
    )
  } else {
    lines.push('Las cuatro auditorías offline pasaron sin hallazgos bloqueantes.')
  }
  lines.push('')
  return lines.join('\n')
}

/**
 * Reemplaza el bloque delimitado por `start` y `end`. Si no existe, lo inserta
 * antes de la primera sección de auditoría (o al final si todavía no hay
 * ninguna) para que el resumen quede arriba del documento.
 */
export function upsertSummarySection(
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

  const firstSection = document.search(/<!-- audit:/)
  if (firstSection >= 0) {
    const head = document.slice(0, firstSection).replace(/\s+$/, '')
    return `${head}\n\n${block}\n\n${document.slice(firstSection)}`
  }
  return `${document.replace(/\s+$/, '')}\n\n${block}\n`
}
