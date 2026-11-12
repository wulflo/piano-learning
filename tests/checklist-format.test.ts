import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const TASK_RE = /^- \[([ x~!-])\] \*\*(F\d+-\d{3}[a-z]?)\*\* — (.+)$/
const ANY_TASK_RE = /^- \[([^\]]*)\]\s+\*\*(F\d+-\d{3}[a-z]?)\*\*/
const COMMIT_RE = /^\s+- Commit: ([0-9a-f]{7,40})/
const META_RE = /^\s+- (Aceptación|Deps|Red):\s*(.+)$/
const VALID_STATES = new Set([' ', 'x', '~', '!', '-'])

interface ParsedTask {
  state: string
  id: string
  title: string
  line: number
  commit?: string
  net: boolean
  meta: Record<string, string>
}

interface Point {
  current?: string
  lastVerified?: string
}

function parsePoint(text: string): Point {
  const current = text.match(/^- \*\*Tarea actual:\*\*\s*(.+)$/m)?.[1]?.trim()
  const lastVerified = text.match(
    /^- \*\*Última verificada en verde:\*\*\s*(.+)$/m,
  )?.[1]?.trim()
  return { current, lastVerified }
}

function parseTasks(text: string): ParsedTask[] {
  const lines = text.split(/\r?\n/)
  const tasks: ParsedTask[] = []
  let current: ParsedTask | null = null

  lines.forEach((line, index) => {
    const match = line.match(TASK_RE)
    if (match) {
      current = {
        state: match[1],
        id: match[2],
        title: match[3].trim(),
        line: index + 1,
        net: false,
        meta: {},
      }
      tasks.push(current)
      return
    }

    if (/^- \[/.test(line)) {
      current = null
      return
    }

    if (!current) return

    if (line.includes('[NET]')) {
      current.net = true
    }

    const commit = line.match(COMMIT_RE)
    if (commit) {
      current.commit = commit[1]
      return
    }

    const meta = line.match(META_RE)
    if (meta) {
      current.meta[meta[1]] = meta[2]
      const red = meta[2].match(/Red:\s*(sí|si|no)/)
      if (red) current.meta.Red = red[1]
      return
    }

    if (/^##\s/.test(line)) {
      current = null
    }
  })

  return tasks
}

function validateChecklist(text: string): string[] {
  const errors: string[] = []
  const tasks = parseTasks(text)
  const ids = new Set<string>()

  for (const task of tasks) {
    if (ids.has(task.id)) {
      errors.push(`ID duplicado: ${task.id}`)
    }
    ids.add(task.id)

    if (!VALID_STATES.has(task.state)) {
      errors.push(`Estado inválido en ${task.id}: "${task.state}"`)
    }

    for (const field of ['Aceptación', 'Deps', 'Red']) {
      if (!task.meta[field]) {
        errors.push(`Falta "${field}" en ${task.id}`)
      }
    }

    if (task.meta.Red?.startsWith('sí') && !task.net) {
      errors.push(`Tarea ${task.id} requiere red pero no está marcada [NET]`)
    }

    if (task.state === 'x' && !task.commit) {
      errors.push(`[x] sin hash de commit: ${task.id}`)
    }
  }

  for (const line of text.split(/\r?\n/)) {
    const match = line.match(ANY_TASK_RE)
    if (match && !VALID_STATES.has(match[1])) {
      errors.push(`Estado inválido en ${match[2]}: "[${match[1]}]"`)
    }
  }

  const inProgress = tasks.filter((task) => task.state === '~')
  if (inProgress.length > 1) {
    errors.push(
      `Más de una tarea [~]: ${inProgress.map((task) => task.id).join(', ')}`,
    )
  }

  const point = parsePoint(text)
  if (!point.current) {
    errors.push('Falta el PUNTO DE REANUDACIÓN o "Tarea actual"')
  } else {
    const id = point.current.match(/F\d+-\d{3}[a-z]?/)?.[0]
    if (point.current !== '—' && (!id || !ids.has(id))) {
      errors.push(`El PUNTO apunta a una tarea inexistente: ${point.current}`)
    } else if (id) {
      const active =
        inProgress[0] ??
        tasks.find((task) => task.state === '!') ??
        tasks.find((task) => task.state === ' ')
      if (active && active.id !== id) {
        errors.push(
          `El PUNTO dice ${id} pero la tarea activa es ${active.id}`,
        )
      }
    }
  }

  const lastDone = [...tasks].reverse().find((task) => task.state === 'x')
  if (lastDone && point.lastVerified) {
    const id = point.lastVerified.match(/F\d+-\d{3}[a-z]?/)?.[0]
    if (id !== lastDone.id) {
      errors.push(
        `El PUNTO declara última verificada ${id ?? '—'} pero la última [x] es ${lastDone.id}`,
      )
    }
  }

  const phaseCounts = new Map<string, number>()
  for (const task of tasks) {
    const phase = task.id.split('-')[0]
    phaseCounts.set(phase, (phaseCounts.get(phase) ?? 0) + 1)
  }

  for (const [phase, count] of phaseCounts) {
    const row = text.match(new RegExp(`^\\|\\s*${phase}\\s*\\|[^|]*\\|\\s*(\\d+)\\s*\\|`, 'm'))
    if (!row) {
      errors.push(`Falta ${phase} en la tabla de resumen`)
    } else if (Number(row[1]) !== count) {
      errors.push(
        `La tabla declara ${row[1]} tareas en ${phase} pero hay ${count}`,
      )
    }
  }

  const total = text.match(/Total:\s*\*\*(\d+)\s+tareas\*\*/)
  if (!total) {
    errors.push('Falta el total de tareas en el resumen')
  } else if (Number(total[1]) !== tasks.length) {
    errors.push(
      `El resumen declara ${total[1]} tareas pero hay ${tasks.length}`,
    )
  }

  return errors
}

function fixture(name: string): string {
  return readFileSync(join(process.cwd(), 'tests', 'fixtures', name), 'utf8')
}

describe('formato de docs/CHECKLIST.md', () => {
  it('el checklist real cumple todas las reglas', () => {
    const text = readFileSync(
      join(process.cwd(), 'docs', 'CHECKLIST.md'),
      'utf8',
    )

    expect(validateChecklist(text)).toEqual([])
  })

  it('detecta IDs duplicados', () => {
    const errors = validateChecklist(fixture('checklist-duplicate.md'))
    expect(errors.some((error) => error.includes('ID duplicado'))).toBe(true)
  })

  it('detecta más de una tarea en curso', () => {
    const errors = validateChecklist(fixture('checklist-two-progress.md'))
    expect(errors.some((error) => error.includes('Más de una tarea'))).toBe(
      true,
    )
  })

  it('detecta una tarea [x] sin hash de commit', () => {
    const errors = validateChecklist(fixture('checklist-done-no-commit.md'))
    expect(errors.some((error) => error.includes('[x] sin hash'))).toBe(true)
  })

  it('detecta estados inválidos', () => {
    const errors = validateChecklist(fixture('checklist-bad-state.md'))
    expect(errors.some((error) => error.includes('Estado inválido'))).toBe(true)
  })

  it('detecta un PUNTO que no coincide con la tarea activa', () => {
    const errors = validateChecklist(fixture('checklist-wrong-point.md'))
    expect(errors.some((error) => error.includes('El PUNTO dice'))).toBe(true)
  })
})
