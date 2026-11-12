import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'

const root = process.cwd()
const tmp = mkdtempSync(join(tmpdir(), 'piano-audio-audit-'))

afterAll(() => {
  rmSync(tmp, { recursive: true, force: true })
})

function run(args: string[]) {
  return spawnSync(
    process.execPath,
    ['scripts/verify-audio.mjs', ...args],
    { cwd: root, encoding: 'utf8' },
  )
}

function sha256(content: string): string {
  return createHash('sha256').update(content).digest('hex')
}

type Sample = Record<string, unknown>

function sample(file: string, content: string): Sample {
  return {
    note: 'C4',
    velocity: 1,
    file,
    bytes: Buffer.byteLength(content),
    sha256: sha256(content),
    author: 'Alexander Holm',
    source: 'Salamander Grand Piano',
    license: 'CC-BY-3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/3.0/',
    modifications: 'Sin modificaciones.',
    sourceUrl: `https://example.com/${file}`,
  }
}

function manifest(samples: Sample[], expectedSamples = samples.length) {
  return {
    version: 1,
    instrument: 'salamander-grand-piano',
    attribution: 'Salamander Grand Piano by Alexander Holm, CC BY 3.0',
    license: 'CC-BY-3.0',
    sourceUrl: 'https://tonejs.github.io/audio/salamander/',
    originUrl: 'https://archive.org/details/SalamanderGrandPianoV3',
    expectedSamples,
    samples,
  }
}

interface Fixture {
  manifestPath: string
  samplesDir: string
}

function fixture(
  name: string,
  build: (dir: string, samplesDir: string) => void,
): Fixture {
  const dir = mkdtempSync(join(tmp, `${name}-`))
  const samplesDir = join(dir, 'samples')
  mkdirSync(samplesDir, { recursive: true })
  build(dir, samplesDir)
  return { manifestPath: join(dir, 'manifest.json'), samplesDir }
}

function writeManifest(dir: string, value: unknown) {
  writeFileSync(join(dir, 'manifest.json'), JSON.stringify(value, null, 2))
}

describe('scripts/verify-audio.mjs', () => {
  it('acepta un manifiesto completo con archivos correctos', () => {
    const content = 'fake-mp3-c4'
    const { manifestPath, samplesDir } = fixture('ok', (dir, samples) => {
      writeFileSync(join(samples, 'C4.mp3'), content)
      writeManifest(dir, manifest([sample('C4.mp3', content)]))
    })

    const result = run(['--manifest', manifestPath, '--samples', samplesDir])

    expect(result.status).toBe(0)
    expect(result.stdout).toContain('OK · 1 muestras')
  })

  it('falla si falta un campo obligatorio de la muestra', () => {
    const content = 'fake-mp3-c4'
    const { manifestPath, samplesDir } = fixture('missing', (dir, samples) => {
      const entry = sample('C4.mp3', content)
      delete entry.author
      writeFileSync(join(samples, 'C4.mp3'), content)
      writeManifest(dir, manifest([entry]))
    })

    const result = run(['--manifest', manifestPath, '--samples', samplesDir])

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('Manifiesto de audio inválido')
    expect(result.stderr).toContain('author')
  })

  it('falla si la licencia no está en la lista permitida', () => {
    const content = 'fake-mp3-c4'
    const { manifestPath, samplesDir } = fixture('license', (dir, samples) => {
      const entry = sample('C4.mp3', content)
      entry.license = 'GPL-3.0'
      writeFileSync(join(samples, 'C4.mp3'), content)
      writeManifest(dir, manifest([entry]))
    })

    const result = run(['--manifest', manifestPath, '--samples', samplesDir])

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('licencia no permitida')
  })

  it('falla si el SHA-256 no coincide', () => {
    const { manifestPath, samplesDir } = fixture('hash', (dir, samples) => {
      // Mismo tamaño que el contenido declarado, distinto contenido.
      writeFileSync(join(samples, 'C4.mp3'), 'AAAA')
      writeManifest(dir, manifest([sample('C4.mp3', 'BBBB')]))
    })

    const result = run(['--manifest', manifestPath, '--samples', samplesDir])

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('SHA-256 no coincide')
  })

  it('falla si hay un archivo de audio no registrado', () => {
    const content = 'fake-mp3-c4'
    const { manifestPath, samplesDir } = fixture('extra', (dir, samples) => {
      writeFileSync(join(samples, 'C4.mp3'), content)
      writeFileSync(join(samples, 'intruso.mp3'), 'otra-cosa')
      writeManifest(dir, manifest([sample('C4.mp3', content)]))
    })

    const result = run(['--manifest', manifestPath, '--samples', samplesDir])

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('Archivo no registrado')
    expect(result.stderr).toContain('intruso.mp3')
  })

  it('falla si expectedSamples no coincide con las entradas', () => {
    const content = 'fake-mp3-c4'
    const { manifestPath, samplesDir } = fixture('expected', (dir, samples) => {
      writeFileSync(join(samples, 'C4.mp3'), content)
      writeManifest(dir, manifest([sample('C4.mp3', content)], 2))
    })

    const result = run(['--manifest', manifestPath, '--samples', samplesDir])

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('declara 2 muestras')
  })

  it('informa NO VERIFICABLE si no existe la carpeta de muestras', () => {
    const content = 'fake-mp3-c4'
    const { manifestPath } = fixture('absent', (dir) => {
      writeManifest(dir, manifest([sample('C4.mp3', content)]))
    })

    const result = run([
      '--manifest',
      manifestPath,
      '--samples',
      join(tmp, 'no-existe'),
    ])

    expect(result.status).toBe(0)
    expect(result.stdout).toContain('NO VERIFICABLE')
  })

  it('el manifiesto real es válido y no falla sin las muestras', () => {
    const result = run(['--samples', join(tmp, 'no-existe')])

    expect(result.status).toBe(0)
    expect(result.stdout).toContain('Muestras declaradas: 30/30')
    expect(result.stdout).toContain('NO VERIFICABLE')
  })
})

describe('manifiesto de audio — trazabilidad de licencias', () => {
  const ALLOWED = [
    'CC0-1.0',
    'CC-BY-3.0',
    'CC-BY-4.0',
    'CC-BY-SA-3.0',
    'CC-BY-SA-4.0',
    'MIT',
    'Apache-2.0',
    'LicenseRef-PublicDomain',
  ]

  const real = JSON.parse(
    readFileSync(join(root, 'assets', 'audio', 'manifest.json'), 'utf8'),
  ) as {
    originUrl?: string
    samples: Array<Record<string, unknown>>
  }

  it('declara la fuente original y la URL de la licencia', () => {
    expect(real.originUrl).toBe('https://archive.org/details/SalamanderGrandPianoV3')
    for (const entry of real.samples) {
      expect(entry.licenseUrl).toBe('https://creativecommons.org/licenses/by/3.0/')
    }
  })

  it('cada muestra declara autor, origen, licencia, URL y modificaciones', () => {
    expect(real.samples.length).toBeGreaterThan(0)
    for (const entry of real.samples) {
      for (const field of [
        'author',
        'source',
        'license',
        'licenseUrl',
        'modifications',
      ]) {
        expect(entry[field], `${entry.file} sin ${field}`).toBeTruthy()
      }
      expect(ALLOWED).toContain(entry.license)
    }
  })
})
