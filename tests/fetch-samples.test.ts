import { spawnSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'

function run(args: string[]) {
  return spawnSync(
    process.execPath,
    ['scripts/fetch-samples.mjs', ...args],
    { cwd: process.cwd(), encoding: 'utf8' },
  )
}

describe('scripts/fetch-samples.mjs', () => {
  it('el dry-run valida el manifiesto sin red ni escritura', () => {
    const result = run([
      '--dry-run',
      '--manifest',
      'tests/fixtures/audio-manifest-empty.json',
    ])

    expect(result.status).toBe(0)
    expect(result.stdout).toContain('Dry-run')
    expect(result.stdout).toContain('no se usó red')
    expect(result.stdout).toContain('Faltan 30 entradas')
  })

  it('el manifiesto real está completo y se puede validar offline', () => {
    const result = run(['--dry-run'])

    expect(result.status).toBe(0)
    expect(result.stdout).toContain('Muestras declaradas: 30/30')
    expect(result.stdout).not.toContain('inválidas: 1')
  })

  it('rechaza un manifiesto inválido', () => {
    const result = run([
      '--dry-run',
      '--manifest',
      'tests/fixtures/audio-manifest-invalid.json',
    ])

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('Manifiesto inválido')
    expect(result.stderr).toContain('attribution')
  })

  it('el modo real se niega a descargar sin entradas declaradas', () => {
    const result = run([
      '--manifest',
      'tests/fixtures/audio-manifest-empty.json',
    ])

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('no declara muestras')
  })
})
