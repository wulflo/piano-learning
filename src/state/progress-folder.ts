import type { ProgressExport } from './progress-export'
import { downloadProgressFile } from './progress-export'
import { parseProgressFile, type ParsedProgressFile } from './progress-import'

/**
 * Copia del progreso en una carpeta personal con la File System Access API.
 *
 * La API solo existe en Chromium de escritorio, requiere un contexto seguro y
 * obliga a elegir la carpeta con un gesto del usuario. Por eso el módulo no
 * guarda nada por su cuenta: recibe (o pide) un manejador de carpeta y, si el
 * navegador no la soporta, delega en la descarga normal del archivo `.txt`.
 *
 * Los tipos son estructurales y mínimos para poder probar con manejadores
 * simulados sin depender de `@types/wicg-file-system-access`.
 */

/** Identificador estable del selector de carpeta, para que el navegador la recuerde. */
export const PROGRESS_FOLDER_PICKER_ID = 'pianodesdecero-progreso'
/** Prefijo de los archivos de progreso, igual que el nombre de descarga. */
export const PROGRESS_COPY_PREFIX = 'pianodesdecero-progreso-'
/** Extensión de las copias de progreso. */
export const PROGRESS_COPY_EXTENSION = '.txt'

export type ProgressFolderErrorCode =
  | 'unsupported'
  | 'cancelled'
  | 'picker-failed'
  | 'write-failed'
  | 'read-failed'
  | 'empty-folder'

export class ProgressFolderError extends Error {
  readonly code: ProgressFolderErrorCode

  constructor(
    code: ProgressFolderErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options)
    this.name = 'ProgressFolderError'
    this.code = code
  }
}

/** Parte escribible de un archivo, tal como la usa este módulo. */
export interface ProgressWritableFile {
  write(contents: string): Promise<void>
  close(): Promise<void>
}

/** Archivo dentro de la carpeta. */
export interface ProgressFolderFileHandle {
  readonly name: string
  /** Presente en los navegadores; ayuda a distinguir archivos de carpetas. */
  readonly kind?: 'file' | 'directory'
  getFile(): Promise<File>
  createWritable(): Promise<ProgressWritableFile>
}

/** Carpeta elegida por el usuario. */
export interface ProgressFolderHandle {
  readonly name: string
  readonly kind?: 'file' | 'directory'
  getFileHandle(
    name: string,
    options?: { create?: boolean },
  ): Promise<ProgressFolderFileHandle>
  /** Iterador de entradas; opcional para tolerar implementaciones parciales. */
  entries?(): AsyncIterableIterator<
    [string, ProgressFolderFileHandle | ProgressFolderHandle]
  >
}

interface DirectoryPickerWindow {
  showDirectoryPicker?: (options?: {
    id?: string
    mode?: 'read' | 'readwrite'
  }) => Promise<ProgressFolderHandle>
}

/** Copia guardada en la carpeta. */
export interface SavedProgressCopy {
  directoryName: string
  fileName: string
  /** Tamaño en bytes UTF-8 del texto escrito. */
  bytes: number
}

/** Copia leída y validada de la carpeta. */
export interface LoadedProgressCopy extends ParsedProgressFile {
  directoryName: string
  fileName: string
}

export type SaveProgressCopyResult =
  | ({ target: 'folder' } & SavedProgressCopy)
  | { target: 'download'; fileName: string }

export interface SaveProgressCopyOptions {
  /** Carpeta ya elegida; si falta, se pide al usuario. */
  folder?: ProgressFolderHandle | null
  /** Sustituto del selector para pruebas. */
  requestFolder?: () => Promise<ProgressFolderHandle>
  /** Sustituto de la descarga para pruebas. */
  download?: (file: Pick<ProgressExport, 'text' | 'fileName'>) => void
}

function getPicker():
  | NonNullable<DirectoryPickerWindow['showDirectoryPicker']>
  | undefined {
  if (typeof window === 'undefined') return undefined
  return (window as unknown as DirectoryPickerWindow).showDirectoryPicker
}

/**
 * Indica si el navegador puede guardar en una carpeta.
 *
 * Además de existir el selector, la API exige un contexto seguro. En un
 * contexto inseguro se responde `false` para no prometer una función que el
 * navegador va a rechazar.
 */
export function supportsProgressFolder(): boolean {
  if (getPicker() === undefined) return false
  return globalThis.isSecureContext !== false
}

/**
 * Pide al usuario una carpeta con un selector explícito.
 *
 * Debe llamarse desde un gesto (un clic): el navegador rechaza la petición si
 * se hace en otro momento. Cancelar el diálogo produce `cancelled`, que la UI
 * debe tratar como «no hacer nada», no como un error.
 */
export async function pickProgressFolder(): Promise<ProgressFolderHandle> {
  const picker = getPicker()
  if (picker === undefined) {
    throw new ProgressFolderError(
      'unsupported',
      'Este navegador no permite elegir una carpeta; usa la descarga del archivo',
    )
  }

  try {
    return await picker.call(window, {
      id: PROGRESS_FOLDER_PICKER_ID,
      mode: 'readwrite',
    })
  } catch (error) {
    if (
      typeof DOMException !== 'undefined' &&
      error instanceof DOMException &&
      error.name === 'AbortError'
    ) {
      throw new ProgressFolderError(
        'cancelled',
        'No se eligió ninguna carpeta',
        { cause: error },
      )
    }
    throw new ProgressFolderError(
      'picker-failed',
      'No se pudo abrir el selector de carpeta',
      { cause: error },
    )
  }
}

/** Escribe el archivo de progreso en la carpeta indicada. */
export async function saveProgressToFolder(
  folder: ProgressFolderHandle,
  file: Pick<ProgressExport, 'text' | 'fileName'>,
): Promise<SavedProgressCopy> {
  let writable: ProgressWritableFile | undefined
  try {
    const handle = await folder.getFileHandle(file.fileName, { create: true })
    writable = await handle.createWritable()
    await writable.write(file.text)
  } catch (error) {
    throw new ProgressFolderError(
      'write-failed',
      `No se pudo escribir ${file.fileName} en la carpeta`,
      { cause: error },
    )
  } finally {
    if (writable !== undefined) {
      try {
        await writable.close()
      } catch (error) {
        throw new ProgressFolderError(
          'write-failed',
          `No se pudo cerrar ${file.fileName} en la carpeta`,
          { cause: error },
        )
      }
    }
  }

  return {
    directoryName: folder.name,
    fileName: file.fileName,
    bytes: new TextEncoder().encode(file.text).length,
  }
}

/** Lee un archivo de texto de la carpeta sin validarlo. */
export async function readProgressCopy(
  folder: ProgressFolderHandle,
  fileName: string,
): Promise<string> {
  try {
    const handle = await folder.getFileHandle(fileName)
    const file = await handle.getFile()
    return await file.text()
  } catch (error) {
    throw new ProgressFolderError(
      'read-failed',
      `No se pudo leer ${fileName} de la carpeta`,
      { cause: error },
    )
  }
}

/**
 * Lee una copia de la carpeta y la valida con el mismo lector que la
 * importación. Un archivo corrupto, una versión futura o un hash manipulado
 * lanzan `ProgressImportError` antes de que la UI toque la base.
 */
export async function loadProgressFromFolder(
  folder: ProgressFolderHandle,
  fileName: string,
): Promise<LoadedProgressCopy> {
  const text = await readProgressCopy(folder, fileName)
  const parsed = await parseProgressFile(text)
  return { ...parsed, directoryName: folder.name, fileName }
}

/** Nombres de copias de progreso de la carpeta, de la más reciente a la más antigua. */
export async function listProgressCopies(
  folder: ProgressFolderHandle,
): Promise<string[]> {
  if (folder.entries === undefined) return []

  const names: string[] = []
  for await (const [name, handle] of folder.entries()) {
    if (handle.kind === 'directory') continue
    if (!name.startsWith(PROGRESS_COPY_PREFIX)) continue
    if (!name.endsWith(PROGRESS_COPY_EXTENSION)) continue
    names.push(name)
  }

  // El nombre incluye la fecha ISO, así que el orden alfabético es cronológico.
  return names.sort((a, b) => b.localeCompare(a))
}

/**
 * Carga la copia más reciente de la carpeta.
 *
 * Si no hay ninguna copia, falla con `empty-folder` en vez de devolver datos
 * vacíos: importar un progreso inexistente borraría el actual.
 */
export async function loadLatestProgressCopy(
  folder: ProgressFolderHandle,
): Promise<LoadedProgressCopy> {
  const [latest] = await listProgressCopies(folder)
  if (latest === undefined) {
    throw new ProgressFolderError(
      'empty-folder',
      'La carpeta no contiene ninguna copia de progreso de PianoDesdeCero',
    )
  }
  return loadProgressFromFolder(folder, latest)
}

/**
 * Guarda la copia en la carpeta elegida y, si el navegador no soporta la API,
 * descarga el archivo como hasta ahora.
 *
 * La carpeta se pide solo cuando hace falta y siempre desde el gesto del
 * usuario. Cancelar el selector no dispara la descarga: se propaga `cancelled`
 * para que la interfaz no haga nada sin permiso.
 */
export async function saveProgressCopy(
  file: Pick<ProgressExport, 'text' | 'fileName'>,
  options: SaveProgressCopyOptions = {},
): Promise<SaveProgressCopyResult> {
  const folder = options.folder ?? null
  // Un `requestFolder` inyectado ya resuelve el selector, así que no hace falta
  // que el navegador exponga la API (pruebas o integraciones propias).
  const canUseFolder =
    folder !== null ||
    options.requestFolder !== undefined ||
    supportsProgressFolder()

  if (!canUseFolder) {
    ;(options.download ?? downloadProgressFile)(file)
    return { target: 'download', fileName: file.fileName }
  }

  const target =
    folder ?? (await (options.requestFolder ?? pickProgressFolder)())
  const saved = await saveProgressToFolder(target, file)
  return { target: 'folder', ...saved }
}

/**
 * Lee y valida un archivo elegido con `<input type="file">`.
 *
 * Es el camino de carga para navegadores sin File System Access API: el
 * usuario elige el `.txt` que descargó antes y se valida igual que una copia
 * de carpeta.
 */
export async function loadProgressFromFile(
  file: Blob,
): Promise<ParsedProgressFile> {
  return parseProgressFile(await file.text())
}
