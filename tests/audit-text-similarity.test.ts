import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'

const root = process.cwd()
const tmp = mkdtempSync(join(tmpdir(), 'piano-text-audit-'))

afterAll(() => {
  rmSync(tmp, { recursive: true, force: true })
})

function run(args: string[]) {
  return spawnSync(process.execPath, ['scripts/audit-text-similarity.mjs', ...args], {
    cwd: root,
    encoding: 'utf8',
  })
}

interface Fixture {
  contentDir: string
  refsDir: string
}

/**
 * Crea un árbol sintético con una carpeta `content/` (fichas JSON) y una
 * carpeta `refs/` (textos de referencia). Todo vive en /tmp: la auditoría no
 * toca la red ni el `refs/` real del repositorio.
 */
function fixture(
  name: string,
  build: (contentDir: string, refsDir: string) => void,
): Fixture {
  const dir = mkdtempSync(join(tmp, `${name}-`))
  const contentDir = join(dir, 'content')
  const refsDir = join(dir, 'refs')
  mkdirSync(contentDir, { recursive: true })
  mkdirSync(refsDir, { recursive: true })
  build(contentDir, refsDir)
  return { contentDir, refsDir }
}

function writeLesson(contentDir: string, name: string, lesson: unknown) {
  mkdirSync(join(contentDir, 'lessons'), { recursive: true })
  writeFileSync(join(contentDir, 'lessons', `${name}.json`), JSON.stringify(lesson, null, 2))
}

function parseJson(stdout: string) {
  return JSON.parse(stdout) as {
    status: string
    size: number
    content: { files: number; strings: number }
    references: { files: number; ngrams: number }
    matches: Array<{
      file: string
      path: string
      id?: string
      words: number
      passage: string
      references: string[]
    }>
  }
}

describe('F6-046 — auditoría de similitud de texto', () => {
  it('detecta una coincidencia de 8 palabras con archivo, campo e id', () => {
    const { contentDir, refsDir } = fixture('match', (content, refs) => {
      writeLesson(content, 'test', {
        id: 'lesson.test',
        sections: [
          {
            bodyEn:
              'The white key immediately to the left of the group of two black keys is C.',
          },
        ],
      })
      writeFileSync(
        join(refs, 'source.txt'),
        'Somewhere in a reference: the white key immediately to the left of the group of two black keys is C.',
      )
    })

    const result = run(['--content', contentDir, '--refs', refsDir, '--json'])

    expect(result.status).toBe(0)
    const data = parseJson(result.stdout)
    expect(data.status).toBe('ok')
    expect(data.matches).toHaveLength(1)
    expect(data.matches[0].file).toBe('lessons/test.json')
    expect(data.matches[0].path).toBe('sections[0].bodyEn')
    expect(data.matches[0].id).toBe('lesson.test')
    expect(data.matches[0].references).toEqual(['source.txt'])
  })

  it('no marca coincidencias de menos de 8 palabras', () => {
    const { contentDir, refsDir } = fixture('short', (content, refs) => {
      writeLesson(content, 'test', {
        id: 'lesson.test',
        bodyEs: 'alpha beta gamma delta epsilon zeta eta',
      })
      writeFileSync(
        join(refs, 'source.txt'),
        'alpha beta gamma delta epsilon zeta eta theta iota kappa',
      )
    })

    const result = run(['--content', contentDir, '--refs', refsDir, '--json'])

    expect(result.status).toBe(0)
    expect(parseJson(result.stdout).matches).toEqual([])
  })

  it('normaliza mayúsculas, acentos y puntuación', () => {
    const { contentDir, refsDir } = fixture('normalize', (content, refs) => {
      writeLesson(content, 'test', {
        id: 'lesson.test',
        bodyEs: 'La TECLA blanca, justo a la izquierda del grupo de dos negras.',
      })
      writeFileSync(
        join(refs, 'source.txt'),
        'la tecla blanca justo a la izquierda del grupo de dos negras es do',
      )
    })

    const result = run(['--content', contentDir, '--refs', refsDir, '--json'])

    expect(result.status).toBe(0)
    const [match] = parseJson(result.stdout).matches
    expect(match).toBeDefined()
    expect(match.passage).toBe(
      'la tecla blanca justo a la izquierda del grupo de dos negras',
    )
  })

  it('fusiona n-gramas consecutivos en un solo pasaje', () => {
    const sentence =
      'one two three four five six seven eight nine ten eleven twelve thirteen fourteen'
    const { contentDir, refsDir } = fixture('merge', (content, refs) => {
      writeLesson(content, 'test', { id: 'lesson.test', bodyEn: sentence })
      writeFileSync(join(refs, 'source.txt'), `prefix ${sentence} suffix`)
    })

    const result = run(['--content', contentDir, '--refs', refsDir, '--json'])

    expect(result.status).toBe(0)
    const [match] = parseJson(result.stdout).matches
    expect(match.words).toBe(14)
    expect(match.passage).toBe(sentence)
  })

  it('revisa todos los archivos JSON de content/ (varios campos y arrays)', () => {
    const { contentDir, refsDir } = fixture('fields', (content, refs) => {
      writeLesson(content, 'a', {
        id: 'lesson.a',
        objectivesEs: ['alpha beta gamma delta epsilon zeta eta theta'],
      })
      writeLesson(content, 'b', { id: 'lesson.b', summaryEn: 'nothing to see here' })
      writeFileSync(
        join(refs, 'source.txt'),
        'alpha beta gamma delta epsilon zeta eta theta iota',
      )
    })

    const result = run(['--content', contentDir, '--refs', refsDir, '--json'])

    const data = parseJson(result.stdout)
    expect(data.content.files).toBe(2)
    expect(data.matches).toHaveLength(1)
    expect(data.matches[0].path).toBe('objectivesEs[0]')
  })

  it('ignora archivos que no son prosa (por ejemplo, código LilyPond)', () => {
    const { contentDir, refsDir } = fixture('ly', (content, refs) => {
      writeLesson(content, 'test', {
        id: 'lesson.test',
        choices: ['c d e f g a b c d'],
      })
      writeFileSync(
        join(refs, 'defaultFigures.ly'),
        'c d e f g a b c d e f g a b c d',
      )
      writeFileSync(join(refs, 'notes.txt'), 'otra cosa distinta para comparar')
    })

    const result = run(['--content', contentDir, '--refs', refsDir, '--json'])

    expect(result.status).toBe(0)
    expect(parseJson(result.stdout).matches).toEqual([])
  })

  it('informa NO VERIFICABLE si no existe refs/', () => {
    const { contentDir } = fixture('absent', (content) => {
      writeLesson(content, 'test', { id: 'lesson.test', bodyEs: 'hola mundo' })
    })

    const result = run([
      '--content',
      contentDir,
      '--refs',
      join(tmp, 'no-existe'),
    ])

    expect(result.status).toBe(0)
    expect(result.stdout).toContain('NO VERIFICABLE')
  })

  it('informa NO VERIFICABLE si refs/ está vacío', () => {
    const { contentDir, refsDir } = fixture('empty', (content) => {
      writeLesson(content, 'test', { id: 'lesson.test', bodyEs: 'hola mundo' })
    })

    const result = run(['--content', contentDir, '--refs', refsDir])

    expect(result.status).toBe(0)
    expect(result.stdout).toContain('NO VERIFICABLE')
  })

  it('falla si no existe la carpeta de contenido', () => {
    const result = run(['--content', join(tmp, 'sin-contenido'), '--refs', tmp])

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('No existe la carpeta de contenido')
  })

  it('rechaza un tamaño de n-grama inválido', () => {
    const result = run(['--size', '0'])

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('Tamaño de n-grama inválido')
  })

  it('renderiza la sección de docs/AUDITORIA.md con tabla', () => {
    const { contentDir, refsDir } = fixture('markdown', (content, refs) => {
      writeLesson(content, 'test', {
        id: 'lesson.test',
        bodyEn: 'alpha beta gamma delta epsilon zeta eta theta',
      })
      writeFileSync(join(refs, 'source.txt'), 'alpha beta gamma delta epsilon zeta eta theta')
    })

    const result = run([
      '--content',
      contentDir,
      '--refs',
      refsDir,
      '--markdown',
      '--label',
      'Open Music Theory (CC BY-SA 4.0)',
    ])

    expect(result.status).toBe(0)
    expect(result.stdout).toContain('## Similitud de texto con obras de referencia')
    expect(result.stdout).toContain('Fuente de las referencias: Open Music Theory (CC BY-SA 4.0).')
    expect(result.stdout).toContain('| Archivo | Campo | Id | Palabras |')
    expect(result.stdout).toContain('`lessons/test.json`')
    expect(result.stdout).toContain('`lesson.test`')
  })

  it('inserta y reemplaza su sección sin tocar el resto del documento', () => {
    const { contentDir, refsDir } = fixture('write', (content, refs) => {
      writeLesson(content, 'test', {
        id: 'lesson.test',
        bodyEn: 'alpha beta gamma delta epsilon zeta eta theta',
      })
      writeFileSync(join(refs, 'source.txt'), 'alpha beta gamma delta epsilon zeta eta theta')
    })
    const doc = join(tmp, 'write-auditoria.md')
    writeFileSync(doc, '# AUDITORÍA\n\ncontenido previo\n')

    const first = run(['--content', contentDir, '--refs', refsDir, '--write', doc])
    expect(first.status).toBe(0)

    const once = readFileSync(doc, 'utf8')
    expect(once).toContain('contenido previo')
    expect(once).toContain('<!-- audit:text:start -->')
    expect(once).toContain('<!-- audit:text:end -->')

    const second = run(['--content', contentDir, '--refs', refsDir, '--write', doc])
    expect(second.status).toBe(0)
    const twice = readFileSync(doc, 'utf8')
    expect(twice.match(/audit:text:start/g)).toHaveLength(1)
    expect(twice).toBe(once)
  })

  it('el repositorio real informa NO VERIFICABLE sin refs/ (offline)', () => {
    const result = run(['--refs', join(tmp, 'no-existe')])

    expect(result.status).toBe(0)
    expect(result.stdout).toContain('NO VERIFICABLE')
  })
})

describe('F6-046 — refs/ nunca se versiona', () => {
  it('refs/ está en .gitignore', () => {
    const ignored = readFileSync(join(root, '.gitignore'), 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
    expect(ignored).toContain('refs/')
  })

  it('git ignora cualquier archivo dentro de refs/', () => {
    const result = spawnSync('git', ['check-ignore', 'refs/open-music-theory.txt'], {
      cwd: root,
      encoding: 'utf8',
    })
    expect(result.status).toBe(0)
    expect(result.stdout.trim()).toBe('refs/open-music-theory.txt')
  })

  it('refs/ no tiene archivos versionados', () => {
    const result = spawnSync('git', ['ls-files', 'refs'], { cwd: root, encoding: 'utf8' })
    expect(result.status).toBe(0)
    expect(result.stdout.trim()).toBe('')
  })
})
