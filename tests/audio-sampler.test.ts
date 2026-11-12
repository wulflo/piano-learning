import { describe, expect, it } from 'vitest'
import {
  loadSampleConfig,
  readSampleManifest,
  sampleUrls,
} from '../src/audio/sampler'

const validManifest = {
  version: 1,
  instrument: 'salamander-grand-piano',
  attribution: 'Salamander Grand Piano by Alexander Holm, CC BY 3.0',
  license: 'CC-BY-3.0',
  sourceUrl: 'https://tonejs.github.io/audio/salamander/',
  expectedSamples: 2,
  samples: [
    {
      note: 'C4',
      velocity: 1,
      file: 'C4.mp3',
      bytes: 100,
      sha256: 'a'.repeat(64),
      sourceUrl: 'https://example.com/C4.mp3',
    },
    {
      note: 'D4',
      velocity: 1,
      file: 'D4.mp3',
      bytes: 100,
      sha256: 'b'.repeat(64),
      sourceUrl: 'https://example.com/D4.mp3',
    },
  ],
}

describe('manifiesto de muestras', () => {
  it('valida el manifiesto y descarta entradas inválidas', () => {
    expect(readSampleManifest(validManifest)?.samples).toHaveLength(2)
    expect(readSampleManifest({ ...validManifest, license: 'MIT' })).toBeNull()
    expect(readSampleManifest(null)).toBeNull()
  })

  it('resuelve URLs bajo la base de Vite', () => {
    const manifest = readSampleManifest(validManifest)
    expect(sampleUrls(manifest, '/piano/')).toEqual({
      C4: '/piano/audio/samples/C4.mp3',
      D4: '/piano/audio/samples/D4.mp3',
    })
    expect(sampleUrls(manifest, '/')).toEqual({
      C4: '/audio/samples/C4.mp3',
      D4: '/audio/samples/D4.mp3',
    })
  })

  it('respeta URLs absolutas y devuelve null sin muestras', () => {
    const manifest = readSampleManifest({
      ...validManifest,
      samples: [
        {
          ...validManifest.samples[0],
          file: 'https://cdn.example.com/C4.mp3',
        },
      ],
    })
    expect(sampleUrls(manifest, '/')).toEqual({
      C4: 'https://cdn.example.com/C4.mp3',
    })
    expect(loadSampleConfig({ ...validManifest, samples: [] })).toBeNull()
  })

  it('produce una configuración completa para Tone.Sampler', () => {
    const config = loadSampleConfig(validManifest, '/app/')
    expect(config).toMatchObject({
      urls: {
        C4: '/app/audio/samples/C4.mp3',
        D4: '/app/audio/samples/D4.mp3',
      },
      license: 'CC-BY-3.0',
      attribution: validManifest.attribution,
    })
  })
})
