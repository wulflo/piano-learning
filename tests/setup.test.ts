import { describe, expect, it } from 'vitest'

function openDb(name: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, 1)
    request.onupgradeneeded = () => {
      request.result.createObjectStore('kv')
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

describe('entorno de tests', () => {
  it('provee una IndexedDB falsa y funcional', async () => {
    const db = await openDb('pdc-test')
    expect(db.name).toBe('pdc-test')
    expect(db.objectStoreNames.contains('kv')).toBe(true)
    db.close()
  })
})
