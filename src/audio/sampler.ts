import manifestJson from '../../assets/audio/manifest.json'
import { AudioManifestSchema, type AudioManifest } from '../schemas/audio'

export interface SampleConfig {
  /** Mapa nota → URL que acepta `Tone.Sampler`. */
  urls: Record<string, string>
  attribution: string
  sourceUrl: string
  license: string
}

function withTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`
}

/** Base pública de Vite (`/` en local, `/repo/` en GitHub Pages). */
export function defaultBaseUrl(): string {
  const base = import.meta.env?.BASE_URL
  return withTrailingSlash(typeof base === 'string' && base ? base : '/')
}

/**
 * Valida el manifiesto. Si está roto devuelve `null` para que el motor caiga
 * al sintetizador en vez de romper la app.
 */
export function readSampleManifest(input: unknown = manifestJson): AudioManifest | null {
  const parsed = AudioManifestSchema.safeParse(input)
  return parsed.success ? parsed.data : null
}

export function sampleUrls(
  manifest: AudioManifest | null,
  baseUrl: string = defaultBaseUrl(),
): Record<string, string> {
  if (!manifest || manifest.samples.length === 0) return {}
  const prefix = withTrailingSlash(baseUrl)
  const urls: Record<string, string> = {}
  for (const sample of manifest.samples) {
    if (urls[sample.note]) continue
    const file = sample.file.trim()
    urls[sample.note] = /^https?:\/\//.test(file)
      ? file
      : `${prefix}audio/samples/${file.replace(/^\/+/, '')}`
  }
  return urls
}

/**
 * Configuración lista para `Tone.Sampler`. Devuelve `null` cuando no hay
 * muestras locales: en ese caso el motor usa `PolySynth`.
 */
export function loadSampleConfig(
  input: unknown = manifestJson,
  baseUrl: string = defaultBaseUrl(),
): SampleConfig | null {
  const manifest = readSampleManifest(input)
  if (!manifest) return null
  const urls = sampleUrls(manifest, baseUrl)
  if (Object.keys(urls).length === 0) return null
  return {
    urls,
    attribution: manifest.attribution,
    sourceUrl: manifest.sourceUrl,
    license: manifest.license,
  }
}
