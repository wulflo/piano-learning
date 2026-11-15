#!/usr/bin/env node
/**
 * F6-046 — Auditoría de originalidad del texto de las lecciones.
 *
 * Compara el texto legible de `content/` con los textos de referencia de `refs/`
 * (que NO se versionan; están en `.gitignore`) buscando coincidencias de
 * n-gramas de 8 palabras. La coincidencia de una secuencia larga de palabras es
 * una señal fuerte de copia; `docs/AUDITORIA.md` guarda el resultado.
 *
 * Es offline: si `refs/` no existe o está vacío (un clon sin los textos de
 * referencia), informa NO VERIFICABLE y sale con 0, igual que `audit:audio`.
 *
 * Uso:
 *   node scripts/audit-text-similarity.mjs
 *   node scripts/audit-text-similarity.mjs --refs refs --content content
 *   node scripts/audit-text-similarity.mjs --size 8 --json
 *   node scripts/audit-text-similarity.mjs --write docs/AUDITORIA.md
 */
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, extname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/** Palabras que tiene cada n-grama por defecto. */
export const DEFAULT_NGRAM_SIZE = 8

/** Extensiones de contenido que se analizan (fichas JSON). */
const CONTENT_EXTENSIONS = new Set(['.json'])

/**
 * Extensiones de referencia que se consideran prosa. Deja fuera código
 * (`.ly`, `.js`, `.yml`) y binarios: comparar el texto de las lecciones contra
 * archivos de música produce falsos positivos como «c d e f g a b c».
 */
export const PROSE_EXTENSIONS = new Set([
  '.md',
  '.markdown',
  '.txt',
  '.text',
  '.html',
  '.htm',
  '.rst',
])

/** Archivos o carpetas que nunca se leen de `refs/`. */
const SKIP_DIRECTORIES = new Set(['.git', 'node_modules'])
const SKIP_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.pdf',
  '.zip',
  '.gz',
  '.mp3',
  '.mp4',
  '.woff',
  '.woff2',
  '.ttf',
])

/**
 * Normaliza un texto a una lista de palabras: sin mayúsculas, sin acentos y sin
 * puntuación. Así «La tecla blanca, justo a la izquierda» y «la tecla blanca
 * justo a la izquierda» producen los mismos n-gramas.
 */
export function tokenize(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter((token) => token.length > 0)
}

/** Devuelve todos los n-gramas de `size` palabras de una lista de tokens. */
export function ngrams(tokens, size = DEFAULT_NGRAM_SIZE) {
  const grams = []
  if (size <= 0 || tokens.length < size) return grams
  for (let i = 0; i + size <= tokens.length; i += 1) {
    grams.push(tokens.slice(i, i + size))
  }
  return grams
}

/**
 * Recorre un valor JSON y devuelve cada cadena de texto con su ruta de campo.
 * Incluye los campos `*Es` y `*En` (el texto de referencia suele estar en
 * inglés), por eso no filtra por idioma.
 *
 * @returns `Array<{ file, path, id, text }>`
 */
export function extractProse(value, file) {
  const id = value && typeof value === 'object' && typeof value.id === 'string'
    ? value.id
    : undefined
  const out = []

  function walk(node, path) {
    if (typeof node === 'string') {
      out.push({ file, path, id, text: node })
      return
    }
    if (Array.isArray(node)) {
      node.forEach((item, index) => walk(item, `${path}[${index}]`))
      return
    }
    if (node && typeof node === 'object') {
      for (const [key, child] of Object.entries(node)) {
        walk(child, path ? `${path}.${key}` : key)
      }
    }
  }

  walk(value, '')
  return out
}

function walkFiles(dir, root, extensions, out) {
  let items
  try {
    items = readdirSync(dir)
  } catch {
    return
  }
  for (const item of items.sort()) {
    if (item.startsWith('.')) continue
    const full = join(dir, item)
    const stats = statSync(full)
    if (stats.isDirectory()) {
      if (SKIP_DIRECTORIES.has(item)) continue
      walkFiles(full, root, extensions, out)
      continue
    }
    const extension = extname(item).toLowerCase()
    if (extensions && !extensions.has(extension)) continue
    if (SKIP_EXTENSIONS.has(extension)) continue
    out.push({
      file: relative(root, full).split(sep).join('/'),
      full,
    })
  }
}

/** Carga y aplana el texto legible de cada ficha JSON de `contentDir`. */
export function loadContentTexts(contentDir) {
  const files = []
  walkFiles(contentDir, contentDir, CONTENT_EXTENSIONS, files)
  const texts = []
  for (const file of files) {
    let parsed
    try {
      parsed = JSON.parse(readFileSync(file.full, 'utf8'))
    } catch (error) {
      throw new Error(`No se pudo leer ${file.full}: ${error.message}`)
    }
    texts.push(...extractProse(parsed, file.file))
  }
  return texts
}

/**
 * Carga los textos de referencia de `refsDir`. Por defecto solo lee prosa
 * (`PROSE_EXTENSIONS`) y omite los binarios (con byte nulo).
 */
export function loadReferenceTexts(refsDir, extensions = PROSE_EXTENSIONS) {
  const files = []
  walkFiles(refsDir, refsDir, extensions, files)
  const texts = []
  for (const file of files) {
    const buffer = readFileSync(file.full)
    if (buffer.includes(0)) continue
    texts.push({ file: file.file, text: buffer.toString('utf8') })
  }
  return texts
}

/** Indexa los n-gramas de los textos de referencia: grama → archivos. */
export function indexReferences(referenceTexts, size = DEFAULT_NGRAM_SIZE) {
  const index = new Map()
  for (const reference of referenceTexts) {
    for (const gram of ngrams(tokenize(reference.text), size)) {
      const key = gram.join(' ')
      let files = index.get(key)
      if (!files) {
        files = []
        index.set(key, files)
      }
      if (!files.includes(reference.file)) files.push(reference.file)
    }
  }
  return index
}

/**
 * Busca coincidencias entre el texto de contenido y el índice de referencias.
 * Los n-gramas consecutivos se fusionan en un solo pasaje para que el informe
 * muestre la secuencia copiada completa y no 8 palabras por vez.
 */
export function findMatches(contentTexts, referenceIndex, size = DEFAULT_NGRAM_SIZE) {
  const matches = []
  for (const source of contentTexts) {
    const tokens = tokenize(source.text)
    if (tokens.length < size) continue
    const grams = ngrams(tokens, size)

    let run = null
    const flush = () => {
      if (!run) return
      matches.push({
        file: source.file,
        path: source.path,
        id: source.id,
        words: run.end - run.start + size,
        passage: tokens.slice(run.start, run.end + size).join(' '),
        references: [...run.references].sort(),
      })
      run = null
    }

    for (let i = 0; i < grams.length; i += 1) {
      const files = referenceIndex.get(grams[i].join(' '))
      if (!files) {
        flush()
        continue
      }
      if (run && run.end === i - 1) {
        run.end = i
        for (const file of files) run.references.add(file)
      } else {
        flush()
        run = { start: i, end: i, references: new Set(files) }
      }
    }
    flush()
  }
  return matches.sort(
    (a, b) =>
      a.file.localeCompare(b.file, 'en') ||
      a.path.localeCompare(b.path, 'en') ||
      b.words - a.words,
  )
}

export const TEXT_AUDIT_START = '<!-- audit:text:start -->'
export const TEXT_AUDIT_END = '<!-- audit:text:end -->'

/** Encabezado del informe cuando todavía no existe (compartido con F6-043). */
export const AUDIT_DOCUMENT_HEADER = `# AUDITORÍA — Piano Today

> Informe de las auditorías de cierre. Cada sección la escribe su comando
> (\`npm run audit:code\`, \`npm run audit:text\` y \`npm run audit\`); no se edita a mano.
`

function escapeCell(text) {
  const single = text.replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim()
  return single.length > 160 ? `${single.slice(0, 157)}…` : single
}

/** Renderiza la sección de `docs/AUDITORIA.md` que corresponde a F6-046. */
export function renderTextAuditSection(result) {
  const lines = []
  lines.push('## Similitud de texto con obras de referencia')
  lines.push('')
  lines.push(
    `- Comando: \`npm run audit:text\` (n-gramas de ${result.size} palabras)`,
  )
  if (result.label) {
    lines.push(`- Fuente de las referencias: ${result.label}.`)
  }

  if (result.status === 'no-verificable') {
    lines.push(
      `- NO VERIFICABLE: no hay textos de referencia en \`${result.refsDir}/\` (no se versionan).`,
    )
    lines.push('')
    lines.push(
      'Descargá los textos de referencia (por ejemplo, Open Music Theory, CC BY-SA 4.0) a `refs/` y volvé a correr el comando.',
    )
    lines.push('')
    return lines.join('\n')
  }

  lines.push(
    `- Referencias: ${result.references.files} archivos, ${result.references.ngrams} n-gramas únicos.`,
  )
  lines.push(
    `- Texto de contenido: ${result.content.files} archivos, ${result.content.strings} cadenas.`,
  )
  lines.push(`- Coincidencias: ${result.matches.length}.`)
  lines.push('')

  if (result.matches.length === 0) {
    lines.push('Sin coincidencias de 8 palabras con los textos de referencia.')
    lines.push('')
    return lines.join('\n')
  }

  lines.push('| Archivo | Campo | Id | Palabras | Referencia(s) | Pasaje |')
  lines.push('|---|---|---|---:|---|---|')
  for (const match of result.matches) {
    lines.push(
      `| \`${match.file}\` | \`${match.path}\` | ${match.id ? `\`${match.id}\`` : '—'} | ${match.words} | ${match.references.map((file) => `\`${file}\``).join(', ')} | ${escapeCell(match.passage)} |`,
    )
  }
  lines.push('')
  return lines.join('\n')
}

/**
 * Reemplaza el bloque delimitado por `start` y `end`, o lo agrega al final si
 * todavía no existe. Mantiene el mismo formato que la sección de F6-043.
 */
export function upsertSection(document, start, end, body) {
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

/** Construye el resultado completo de la auditoría. */
export function auditTextSimilarity({
  contentDir,
  refsDir,
  size = DEFAULT_NGRAM_SIZE,
  label,
}) {
  const contentTexts = loadContentTexts(contentDir)
  const contentFiles = new Set(contentTexts.map((entry) => entry.file))

  const base = {
    size,
    label,
    refsDir: relative(ROOT, refsDir).split(sep).join('/') || '.',
    content: { files: contentFiles.size, strings: contentTexts.length },
    references: { files: 0, ngrams: 0 },
    matches: [],
  }

  if (!existsSync(refsDir)) return { ...base, status: 'no-verificable' }

  const referenceTexts = loadReferenceTexts(refsDir)
  if (referenceTexts.length === 0) return { ...base, status: 'no-verificable' }

  const index = indexReferences(referenceTexts, size)
  const matches = findMatches(contentTexts, index, size)

  return {
    ...base,
    status: 'ok',
    references: { files: referenceTexts.length, ngrams: index.size },
    matches,
  }
}

const args = process.argv.slice(2)

function flagValue(name) {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : undefined
}

function printHelp() {
  console.log(`Uso: node scripts/audit-text-similarity.mjs [opciones]

  --content <ruta>   Carpeta de contenido JSON (por defecto content).
  --refs <ruta>      Carpeta de textos de referencia (por defecto refs; no se versiona).
  --size <n>         Palabras por n-grama (por defecto ${DEFAULT_NGRAM_SIZE}).
  --label <texto>    Fuente y licencia de las referencias (se cita en el informe).
  --json             Imprime el resultado en JSON.
  --markdown         Imprime la sección de docs/AUDITORIA.md.
  --write <ruta>     Inserta la sección en el markdown indicado.
  --help             Muestra esta ayuda.`)
}

function main() {
  if (args.includes('--help') || args.includes('-h')) {
    printHelp()
    return
  }

  const contentDir = resolve(ROOT, flagValue('--content') ?? 'content')
  const refsDir = resolve(ROOT, flagValue('--refs') ?? 'refs')
  const size = Number(flagValue('--size') ?? DEFAULT_NGRAM_SIZE)

  if (!Number.isInteger(size) || size < 1) {
    console.error(`Tamaño de n-grama inválido: ${flagValue('--size')}`)
    process.exitCode = 1
    return
  }

  if (!existsSync(contentDir)) {
    console.error(`No existe la carpeta de contenido ${contentDir}`)
    process.exitCode = 1
    return
  }

  const result = auditTextSimilarity({
    contentDir,
    refsDir,
    size,
    label: flagValue('--label'),
  })
  const section = renderTextAuditSection(result)

  if (args.includes('--json')) {
    console.log(JSON.stringify(result, null, 2))
  } else if (args.includes('--markdown')) {
    console.log(section)
  } else {
    if (result.status === 'no-verificable') {
      console.log(
        `NO VERIFICABLE · no hay textos de referencia en ${refsDir} (no se versionan).`,
      )
      console.log(
        'Descargá los textos de referencia a refs/ (F6-047) y volvé a correr `npm run audit:text`.',
      )
    } else {
      console.log(
        `Referencias: ${result.references.files} archivos, ${result.references.ngrams} n-gramas únicos.`,
      )
      console.log(
        `Texto de contenido: ${result.content.files} archivos, ${result.content.strings} cadenas.`,
      )
      console.log(`Coincidencias de ${size} palabras: ${result.matches.length}.`)
      for (const match of result.matches) {
        console.log(
          `  - ${match.file} · ${match.path} · ${match.words} palabras · ${match.references.join(', ')}`,
        )
        console.log(`    «${match.passage}»`)
      }
    }
  }

  const writePath = flagValue('--write')
  if (writePath) {
    const target = resolve(ROOT, writePath)
    const document = existsSync(target)
      ? readFileSync(target, 'utf8')
      : AUDIT_DOCUMENT_HEADER
    writeFileSync(
      target,
      upsertSection(document, TEXT_AUDIT_START, TEXT_AUDIT_END, section),
    )
    console.log(`Sección actualizada en ${target}`)
  }
}

const invokedDirectly =
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (invokedDirectly) {
  try {
    main()
  } catch (error) {
    console.error('Error inesperado:', error)
    process.exitCode = 1
  }
}
