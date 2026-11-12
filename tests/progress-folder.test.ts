import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ProgressDataSchema } from '../src/schemas'
import { createProgressExport } from '../src/state/progress-export'
import { ProgressImportError } from '../src/state/progress-import'
import {
  PROGRESS_FOLDER_PICKER_ID,
  ProgressFolderError,
  listProgressCopies,
  loadLatestProgressCopy,
  loadProgressFromFile,
  loadProgressFromFolder,
  pickProgressFolder,
  readProgressCopy,
  saveProgressCopy,
  saveProgressToFolder,
  supportsProgressFolder,
  type ProgressFolderFileHandle,
  type ProgressFolderHandle,
  type ProgressWritableFile,
} from '../src/state/progress-folder'

interface PickerOptions {
  id?: string
  mode?: 'read' | 'readwrite'
}

type Picker = (options?: PickerOptions) => Promise<ProgressFolderHandle>

class MemoryFile implements ProgressFolderFileHandle {
  readonly kind = 'file' as const

  constructor(
    private readonly folder: MemoryFolder,
    readonly name: string,
  ) {}

  async getFile(): Promise<File> {
    const text = this.folder.files.get(this.name)
    if (text === undefined) {
      throw new DOMException(`${this.name} no existe`, 'NotFoundError')
    }
    return new File([text], this.name, { type: 'text/plain' })
  }

  async createWritable(): Promise<ProgressWritableFile> {
    let buffer = ''
    const folder = this.folder
    const name = this.name
    return {
      async write(contents: string) {
        buffer += contents
      },
      async close() {
        folder.files.set(name, buffer)
        folder.writes.push(name)
      },
    }
  }
}

class MemoryFolder implements ProgressFolderHandle {
  readonly kind = 'directory' as const
  readonly files = new Map<string, string>()
  readonly writes: string[] = []

  constructor(
    readonly name: string,
    files: Record<string, string> = {},
  ) {
    for (const [file, text] of Object.entries(files)) {
      this.files.set(file, text)
    }
  }

  async getFileHandle(
    name: string,
    options?: { create?: boolean },
  ): Promise<ProgressFolderFileHandle> {
    if (!this.files.has(name) && options?.create !== true) {
      throw new DOMException(`${name} no existe`, 'NotFoundError')
    }
    return new MemoryFile(this, name)
  }

  async *entries(): AsyncIterableIterator<
    [string, ProgressFolderFileHandle | ProgressFolderHandle]
  > {
    for (const name of [...this.files.keys()].sort()) {
      yield [name, new MemoryFile(this, name)]
    }
  }
}

const FILE_NAME = 'pianodesdecero-progreso-2026-11-12.txt'

async function buildExport(exportedAt = '2026-11-12T01:00:00.000Z') {
  const data = ProgressDataSchema.parse({
    schemaVersion: 1,
    xp: 50,
    lessons: {
      'lesson.m0-01': {
        status: 'completed',
        completedAt: '2026-03-10T10:00:00.000Z',
        secondsSpent: 300,
      },
    },
  })
  return createProgressExport(data, {
    now: new Date(exportedAt),
    appVersion: '0.1.0',
  })
}

function setPicker(picker: Picker | undefined): void {
  const target = window as unknown as { showDirectoryPicker?: Picker }
  if (picker === undefined) {
    delete target.showDirectoryPicker
  } else {
    target.showDirectoryPicker = picker
  }
}

function corruptHash(text: string): string {
  return text.replace(/^SHA-256: .*$/m, `SHA-256: ${'0'.repeat(64)}`)
}

describe('F2-056a — Copia del progreso en una carpeta personal', () => {
  beforeEach(() => {
    setPicker(undefined)
    Object.defineProperty(globalThis, 'isSecureContext', {
      configurable: true,
      value: true,
    })
  })

  afterEach(() => {
    setPicker(undefined)
    vi.restoreAllMocks()
  })

  it('detecta el soporte según el selector y el contexto seguro', () => {
    expect(supportsProgressFolder()).toBe(false)

    setPicker(async () => new MemoryFolder('Progreso'))
    expect(supportsProgressFolder()).toBe(true)

    Object.defineProperty(globalThis, 'isSecureContext', {
      configurable: true,
      value: false,
    })
    expect(supportsProgressFolder()).toBe(false)
  })

  it('pide la carpeta con un selector explícito en modo lectura y escritura', async () => {
    const folder = new MemoryFolder('Progreso')
    const picker = vi.fn<Picker>(async () => folder)
    setPicker(picker)

    await expect(pickProgressFolder()).resolves.toBe(folder)
    expect(picker).toHaveBeenCalledWith({
      id: PROGRESS_FOLDER_PICKER_ID,
      mode: 'readwrite',
    })
  })

  it('traduce la cancelación del selector a un código estable', async () => {
    setPicker(async () => {
      throw new DOMException('cancelado', 'AbortError')
    })

    await expect(pickProgressFolder()).rejects.toMatchObject({
      name: 'ProgressFolderError',
      code: 'cancelled',
    })
  })

  it('envuelve otros fallos del selector', async () => {
    setPicker(async () => {
      throw new Error('sin permiso')
    })

    await expect(pickProgressFolder()).rejects.toMatchObject({
      code: 'picker-failed',
    })
  })

  it('falla con `unsupported` cuando no hay selector', async () => {
    await expect(pickProgressFolder()).rejects.toBeInstanceOf(
      ProgressFolderError,
    )
    await expect(pickProgressFolder()).rejects.toMatchObject({
      code: 'unsupported',
    })
  })

  it('escribe el archivo y lo sobrescribe en la misma carpeta', async () => {
    const folder = new MemoryFolder('Mi progreso')
    const first = await buildExport()

    const saved = await saveProgressToFolder(folder, first)

    expect(saved).toEqual({
      directoryName: 'Mi progreso',
      fileName: FILE_NAME,
      bytes: new TextEncoder().encode(first.text).length,
    })
    expect(folder.files.get(FILE_NAME)).toBe(first.text)

    const second = await buildExport('2026-11-12T02:00:00.000Z')
    await saveProgressToFolder(folder, second)
    expect(folder.writes).toEqual([FILE_NAME, FILE_NAME])
    expect(folder.files.get(FILE_NAME)).toBe(second.text)
    expect(folder.files.size).toBe(1)
  })

  it('envuelve los errores de escritura', async () => {
    const folder: ProgressFolderHandle = {
      name: 'Bloqueada',
      async getFileHandle() {
        throw new DOMException('sin permiso', 'NotAllowedError')
      },
    }

    await expect(
      saveProgressToFolder(folder, await buildExport()),
    ).rejects.toMatchObject({ code: 'write-failed' })
  })

  it('descarga el archivo cuando el navegador no soporta carpetas', async () => {
    const file = await buildExport()
    const download = vi.fn()

    const result = await saveProgressCopy(file, { download })

    expect(download).toHaveBeenCalledWith(file)
    expect(result).toEqual({ target: 'download', fileName: FILE_NAME })
  })

  it('usa la carpeta indicada aunque el navegador no soporte la API', async () => {
    const file = await buildExport()
    const folder = new MemoryFolder('Progreso')
    const download = vi.fn()
    const requestFolder = vi.fn()

    const result = await saveProgressCopy(file, {
      folder,
      download,
      requestFolder,
    })

    expect(requestFolder).not.toHaveBeenCalled()
    expect(download).not.toHaveBeenCalled()
    expect(result).toMatchObject({
      target: 'folder',
      directoryName: 'Progreso',
      fileName: FILE_NAME,
    })
    expect(folder.files.get(FILE_NAME)).toBe(file.text)
  })

  it('pide la carpeta y no descarga cuando la API está disponible', async () => {
    const file = await buildExport()
    const folder = new MemoryFolder('Progreso')
    const requestFolder = vi.fn(async () => folder)
    const download = vi.fn()

    const result = await saveProgressCopy(file, { requestFolder, download })

    expect(requestFolder).toHaveBeenCalledOnce()
    expect(download).not.toHaveBeenCalled()
    expect(result).toMatchObject({ target: 'folder', fileName: FILE_NAME })
  })

  it('no descarga si el usuario cancela el selector', async () => {
    const file = await buildExport()
    const download = vi.fn()

    await expect(
      saveProgressCopy(file, {
        requestFolder: async () => {
          throw new ProgressFolderError('cancelled', 'cancelado')
        },
        download,
      }),
    ).rejects.toMatchObject({ code: 'cancelled' })
    expect(download).not.toHaveBeenCalled()
  })

  it('lee y valida una copia guardada en la carpeta', async () => {
    const file = await buildExport()
    const folder = new MemoryFolder('Progreso', { [FILE_NAME]: file.text })

    const loaded = await loadProgressFromFolder(folder, FILE_NAME)

    expect(loaded.directoryName).toBe('Progreso')
    expect(loaded.fileName).toBe(FILE_NAME)
    expect(loaded.sha256).toBe(file.sha256)
    expect(loaded.data).toEqual(file.envelope.data)
  })

  it('rechaza una copia corrupta antes de importarla', async () => {
    const file = await buildExport()
    const folder = new MemoryFolder('Progreso', {
      [FILE_NAME]: corruptHash(file.text),
    })

    await expect(
      loadProgressFromFolder(folder, FILE_NAME),
    ).rejects.toBeInstanceOf(ProgressImportError)
    await expect(
      loadProgressFromFolder(folder, FILE_NAME),
    ).rejects.toMatchObject({ code: 'invalid-hash' })
  })

  it('envuelve los errores de lectura', async () => {
    const folder = new MemoryFolder('Progreso')

    await expect(
      readProgressCopy(folder, 'no-existe.txt'),
    ).rejects.toMatchObject({ code: 'read-failed' })
  })

  it('lista solo las copias de progreso, de la más reciente a la más antigua', async () => {
    const folder = new MemoryFolder('Progreso', {
      'pianodesdecero-progreso-2026-03-09.txt': 'vieja',
      'pianodesdecero-progreso-2026-11-12.txt': 'nueva',
      'pianodesdecero-progreso-2026-06-01.txt': 'media',
      'otro-archivo.txt': 'ajeno',
      'pianodesdecero-progreso-2026-11-12.json': 'ajeno',
    })

    await expect(listProgressCopies(folder)).resolves.toEqual([
      'pianodesdecero-progreso-2026-11-12.txt',
      'pianodesdecero-progreso-2026-06-01.txt',
      'pianodesdecero-progreso-2026-03-09.txt',
    ])
  })

  it('tolera carpetas sin iterador de entradas', async () => {
    const folder: ProgressFolderHandle = {
      name: 'Sin entradas',
      async getFileHandle() {
        throw new DOMException('no existe', 'NotFoundError')
      },
    }

    await expect(listProgressCopies(folder)).resolves.toEqual([])
  })

  it('carga la copia más reciente de la carpeta', async () => {
    const older = await buildExport('2026-03-09T01:00:00.000Z')
    const newer = await buildExport('2026-11-12T01:00:00.000Z')
    const folder = new MemoryFolder('Progreso', {
      'pianodesdecero-progreso-2026-03-09.txt': older.text,
      'pianodesdecero-progreso-2026-11-12.txt': newer.text,
    })

    const loaded = await loadLatestProgressCopy(folder)

    expect(loaded.fileName).toBe('pianodesdecero-progreso-2026-11-12.txt')
    expect(loaded.sha256).toBe(newer.sha256)
  })

  it('falla si la carpeta no tiene copias en vez de devolver datos vacíos', async () => {
    const folder = new MemoryFolder('Vacía', { 'notas.txt': 'nada' })

    await expect(loadLatestProgressCopy(folder)).rejects.toMatchObject({
      code: 'empty-folder',
    })
  })

  it('carga el archivo elegido con un input como alternativa universal', async () => {
    const file = await buildExport()
    const blob = new Blob([file.text], { type: 'text/plain' })

    const loaded = await loadProgressFromFile(blob)

    expect(loaded.sha256).toBe(file.sha256)
    expect(loaded.data).toEqual(file.envelope.data)
  })
})
