#!/usr/bin/env node
/**
 * Genera el estado del proyecto y ejecuta las verificaciones.
 * Sin dependencias externas: solo módulos nativos de Node.
 */
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const CHECKLIST_PATH = join(ROOT, 'docs', 'CHECKLIST.md')
const ESTADO_PATH = join(ROOT, 'docs', 'ESTADO.md')

const TASK_RE = /^- \[([ x~!-])\] \*\*(F\d+-\d{3}[a-z]?)\*\* — (.+)$/
const COMMIT_RE = /^\s+- Commit: ([0-9a-f]{7,40})/
const VALID_STATES = new Set([' ', 'x', '~', '!', '-'])

function readChecklist() {
  if (!existsSync(CHECKLIST_PATH)) {
    throw new Error('No existe docs/CHECKLIST.md')
  }

  const text = readFileSync(CHECKLIST_PATH, 'utf8')
  const lines = text.split(/\r?\n/)
  const tasks = []
  let current = null

  for (const line of lines) {
    const taskMatch = line.match(TASK_RE)
    if (taskMatch) {
      current = {
        state: taskMatch[1],
        id: taskMatch[2],
        title: taskMatch[3].trim(),
        phase: taskMatch[2].split('-')[0],
        commit: null,
      }
      tasks.push(current)
      continue
    }

    if (current && COMMIT_RE.test(line)) {
      current.commit = line.match(COMMIT_RE)[1]
      continue
    }

    if (/^##\s/.test(line)) {
      current = null
    }
  }

  const findPoint = (label) => {
    const match = text.match(new RegExp(`^- \\*\\*${label}:\\*\\*\\s*(.+)$`, 'm'))
    return match ? match[1].trim() : null
  }

  const currentTask =
    tasks.find((task) => task.state === '~') ??
    tasks.find((task) => task.state === '!') ??
    tasks.find((task) => task.state === ' ') ??
    null

  const lastVerified = [...tasks].reverse().find((task) => task.state === 'x')

  return {
    tasks,
    currentTask,
    lastVerified,
    point: {
      current: findPoint('Tarea actual'),
      lastVerified: findPoint('Última verificada en verde'),
      updated: findPoint('Actualizado'),
      phase: findPoint('Fase'),
      note: findPoint('Nota'),
    },
    counts: countByState(tasks),
  }
}

function countByState(tasks) {
  const counts = { total: tasks.length, pending: 0, inProgress: 0, done: 0, broken: 0, discarded: 0 }
  for (const task of tasks) {
    if (!VALID_STATES.has(task.state)) continue
    if (task.state === ' ') counts.pending += 1
    if (task.state === '~') counts.inProgress += 1
    if (task.state === 'x') counts.done += 1
    if (task.state === '!') counts.broken += 1
    if (task.state === '-') counts.discarded += 1
  }
  return counts
}

function phaseProgress(tasks) {
  const phases = new Map()
  for (const task of tasks) {
    if (!phases.has(task.phase)) {
      phases.set(task.phase, { total: 0, done: 0 })
    }
    const entry = phases.get(task.phase)
    entry.total += 1
    if (task.state === 'x') entry.done += 1
  }
  return [...phases.entries()].map(([phase, value]) => ({ phase, ...value }))
}

function pct(done, total) {
  if (total === 0) return '0.0'
  return ((done / total) * 100).toFixed(1)
}

function bar(done, total, width = 12) {
  if (total === 0) return '[' + '-'.repeat(width) + ']'
  const filled = Math.round((done / total) * width)
  return '[' + '#'.repeat(filled) + '-'.repeat(width - filled) + ']'
}

function gitInfo() {
  const run = (args) => {
    try {
      return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim()
    } catch {
      return null
    }
  }
  return {
    branch: run(['rev-parse', '--abbrev-ref', 'HEAD']),
    head: run(['rev-parse', '--short', 'HEAD']),
    status: run(['status', '--porcelain']),
    tags: run(['tag', '--list']),
  }
}

function runCheck(label, script) {
  const started = Date.now()
  console.log(`\n▶ ${label} (npm run ${script})`)
  const result = spawnSync('npm', ['run', script], {
    cwd: ROOT,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
  const seconds = ((Date.now() - started) / 1000).toFixed(1)
  const ok = result.status === 0
  console.log(`${ok ? '✓' : '✗'} ${label}: ${ok ? 'OK' : 'FALLÓ'} en ${seconds}s`)
  return { label, script, ok, seconds, exitCode: result.status ?? 1 }
}

function writeEstado({ checklist, phases, checks, git, startedAt }) {
  const { counts, currentTask, lastVerified, point } = checklist
  const lines = []
  lines.push('# ESTADO — PianoDesdeCero')
  lines.push('')
  lines.push('> Generado automáticamente por `npm run estado`. No editar a mano.')
  lines.push('')
  lines.push(`- **Generado:** ${startedAt}`)
  lines.push(`- **Rama:** ${git.branch ?? 'sin git'}`)
  lines.push(`- **HEAD:** ${git.head ?? 'sin commits'}`)
  lines.push(`- **Cambios sin commitear:** ${git.status ? 'sí' : 'no'}`)
  lines.push('')
  lines.push('## Punto de reanudación')
  lines.push('')
  lines.push(`- **Tarea actual:** ${currentTask ? `\`${currentTask.id}\` — ${currentTask.title}` : point.current ?? '—'}`)
  lines.push(
    `- **Última verificada:** ${
      lastVerified
        ? `\`${lastVerified.id}\`${lastVerified.commit ? ` (\`${lastVerified.commit}\`)` : ''}`
        : point.lastVerified ?? '—'
    }`,
  )
  lines.push(`- **Nota:** ${point.note ?? '—'}`)
  lines.push('')
  lines.push('## Progreso')
  lines.push('')
  lines.push('| Fase | Hechas | Total | % | Barra |')
  lines.push('|---|---:|---:|---:|---|')
  for (const phase of phases) {
    lines.push(
      `| ${phase.phase} | ${phase.done} | ${phase.total} | ${pct(phase.done, phase.total)} % | \`${bar(phase.done, phase.total)}\` |`,
    )
  }
  lines.push(
    `| **Total** | **${counts.done}** | **${counts.total}** | **${pct(counts.done, counts.total)} %** | \`${bar(counts.done, counts.total)}\` |`,
  )
  lines.push('')
  lines.push('## Verificaciones')
  lines.push('')
  lines.push('| Paso | Resultado | Tiempo |')
  lines.push('|---|---|---:|')
  for (const check of checks) {
    lines.push(`| \`${check.script}\` | ${check.ok ? 'OK' : `FALLÓ (salida ${check.exitCode})`} | ${check.seconds}s |`)
  }
  lines.push('')
  lines.push('## Tareas')
  lines.push('')
  lines.push(`- Pendientes: ${counts.pending}`)
  lines.push(`- En curso: ${counts.inProgress}`)
  lines.push(`- Hechas: ${counts.done}`)
  lines.push(`- Rotas/bloqueadas: ${counts.broken}`)
  lines.push(`- Descartadas: ${counts.discarded}`)
  lines.push('')

  writeFileSync(ESTADO_PATH, lines.join('\n'), 'utf8')
}

function main() {
  const startedAt = new Date().toISOString()
  const checklist = readChecklist()
  const phases = phaseProgress(checklist.tasks)
  const git = gitInfo()

  console.log('PianoDesdeCero · estado')
  console.log(`Tarea actual: ${checklist.currentTask ? `${checklist.currentTask.id} — ${checklist.currentTask.title}` : '—'}`)
  console.log(
    `Última verificada: ${checklist.lastVerified ? `${checklist.lastVerified.id}${checklist.lastVerified.commit ? ` (${checklist.lastVerified.commit})` : ''}` : '—'}`,
  )
  console.log('')
  for (const phase of phases) {
    console.log(
      `${phase.phase} ${bar(phase.done, phase.total)} ${phase.done}/${phase.total} (${pct(phase.done, phase.total)}%)`,
    )
  }
  console.log(
    `Total ${bar(checklist.counts.done, checklist.counts.total)} ${checklist.counts.done}/${checklist.counts.total} (${pct(checklist.counts.done, checklist.counts.total)}%)`,
  )

  const checks = []
  for (const [label, script] of [
    ['Typecheck', 'typecheck'],
    ['Tests', 'test'],
    ['Build', 'build'],
  ]) {
    const result = runCheck(label, script)
    checks.push(result)
    if (!result.ok) {
      console.error(`\nPrimer fallo: ${label}. Se detiene la verificación.`)
      writeEstado({ checklist, phases, checks, git, startedAt })
      process.exitCode = 1
      return
    }
  }

  writeEstado({ checklist, phases, checks, git, startedAt })
  console.log(`\nEstado escrito en docs/ESTADO.md`)
}

try {
  main()
} catch (error) {
  console.error('Error generando el estado:', error)
  process.exitCode = 1
}
