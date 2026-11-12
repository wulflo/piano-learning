import { RepertoirePieceSchema, type RepertoirePiece } from '../schemas'

/**
 * F5-021 — Carga diferida y validación de piezas de repertorio.
 *
 * Las piezas viven en `content/repertoire` y cada archivo se convierte en un
 * chunk propio. El índice del curso no las carga: F5-022 y F5-023 piden una
 * pieza concreta por id y reciben el JSON ya validado con Zod.
 *
 * La convención de nombres no es uniforme: `piece.studies.01` se guarda como
 * `studies.01.json`, pero `piece.original.do-mayor` usa
 * `original-do-mayor.json`. Por eso se prueban rutas candidatas y se comprueba
 * que el id del archivo coincida con el pedido, igual que hace el cargador de
 * ejercicios.
 */

const repertoireModules = import.meta.glob('../../content/repertoire/*.json')

const PIECE_PREFIX = 'piece.'

/** Rutas candidatas de una pieza, en orden de preferencia. */
export function repertoireContentPaths(pieceId: string): string[] {
  if (!/^[a-z0-9][a-z0-9._-]*$/.test(pieceId)) return []
  if (!pieceId.startsWith(PIECE_PREFIX)) return []

  const slug = pieceId.slice(PIECE_PREFIX.length)
  if (slug.length === 0) return []

  const paths: string[] = []
  const add = (name: string) => {
    const path = `../../content/repertoire/${name}.json`
    if (!paths.includes(path)) paths.push(path)
  }

  add(slug)
  add(slug.replace(/\./g, '-'))
  add(slug.replace(/^([^.]+)\./, '$1-'))
  return paths
}

/** Indica si una pieza tiene un archivo en `content/repertoire`. */
export function hasRepertoireContent(pieceId: string): boolean {
  return repertoireContentPaths(pieceId).some(
    (path) => repertoireModules[path] !== undefined,
  )
}

async function loadModule(path: string): Promise<unknown> {
  const loader = repertoireModules[path]
  if (loader === undefined) {
    throw new Error(`No hay archivo de repertorio en ${path}`)
  }
  const loaded: unknown = await loader()
  return typeof loaded === 'object' && loaded !== null && 'default' in loaded
    ? (loaded as { default: unknown }).default
    : loaded
}

/**
 * Carga y valida una pieza por id.
 *
 * Lanza un error claro si el id no tiene el prefijo `piece.`, si no hay archivo
 * o si el archivo contiene otra pieza. La validación con
 * `RepertoirePieceSchema` exige la ficha de licencia completa y al menos una
 * partitura de mano.
 */
export async function loadRepertoirePiece(
  pieceId: string,
): Promise<RepertoirePiece> {
  const paths = repertoireContentPaths(pieceId)
  if (paths.length === 0) {
    throw new Error(`ID de pieza inválido: ${pieceId}`)
  }

  for (const path of paths) {
    if (repertoireModules[path] === undefined) continue
    const piece = RepertoirePieceSchema.parse(await loadModule(path))
    if (piece.id !== pieceId) {
      throw new Error(
        `El archivo ${path} contiene ${piece.id}, no ${pieceId}`,
      )
    }
    return piece
  }

  throw new Error(`La pieza ${pieceId} no está en content/repertoire`)
}

/** Carga varias piezas en orden, sin repetir lecturas. */
export async function loadRepertoirePieces(
  pieceIds: readonly string[],
): Promise<RepertoirePiece[]> {
  const unique = [...new Set(pieceIds)]
  return Promise.all(unique.map((id) => loadRepertoirePiece(id)))
}

/**
 * Carga todas las piezas publicadas, ya validadas.
 *
 * La usan las páginas de repertorio y atribuciones, que necesitan el catálogo
 * completo. Cada archivo sigue siendo un módulo diferido: visitar el índice
 * descarga las piezas una vez y Vite conserva sus chunks separados.
 */
export async function loadAllRepertoirePieces(): Promise<RepertoirePiece[]> {
  const paths = Object.keys(repertoireModules)
  const pieces = await Promise.all(
    paths.map(async (path) =>
      RepertoirePieceSchema.parse(await loadModule(path)),
    ),
  )
  const unique = new Map<string, RepertoirePiece>()
  for (const piece of pieces) {
    unique.set(piece.id, piece)
  }
  return [...unique.values()].sort(
    (a, b) => a.level - b.level || a.title.localeCompare(b.title),
  )
}
