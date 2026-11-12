import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()
interface Manifest {
  expectedSamples: number
  samples: Array<{ file: string; bytes: number }>
}

const manifest = JSON.parse(
  readFileSync(join(root, 'assets', 'audio', 'manifest.json'), 'utf8'),
) as Manifest

const adapter = readFileSync(join(root, 'src', 'audio', 'adapter.ts'), 'utf8')
const indexHtml = readFileSync(join(root, 'index.html'), 'utf8')

/**
 * F6-016 — Presupuesto y carga diferida de audio.
 *
 * Las muestras viven en `public/audio/samples` y se descargan recién cuando
 * el motor de audio se inicializa (import dinámico de Tone.js). La carga
 * inicial de la página no las pide.
 */
describe('F6-016 — Presupuesto de audio', () => {
  it('mantiene el total de muestras por debajo de 150 MB', () => {
    // `bytes` viene del manifiesto versionado; las muestras no se guardan en
    // git y se descargan con `npm run fetch:samples` antes de escuchar audio.
    const total = manifest.samples.reduce(
      (sum, sample) => sum + sample.bytes,
      0,
    )

    expect(total).toBeLessThan(150 * 1024 * 1024)
    expect(total).toBeGreaterThan(0)
    expect(manifest.samples).toHaveLength(manifest.expectedSamples)
  })

  it('no descarga muestras en la carga inicial del HTML', () => {
    expect(indexHtml).not.toMatch(/audio\/samples/)
    expect(indexHtml).not.toMatch(/\.mp3/)
  })

  it('carga Tone.js de forma dinámica', () => {
    expect(adapter).toMatch(/await import\(['"]tone['"]\)/)
  })
})
