/**
 * Rutas de la app en el hash de la URL.
 *
 * GitHub Pages sirve archivos estáticos y no puede reescribir rutas, así que el
 * hash es el único enrutado que funciona al recargar y al compartir un enlace.
 * Las rutas son nombres en español porque son visibles para el usuario; el
 * código y los tipos usan inglés.
 *
 * `parseHash` es pura y no toca `window`, de modo que se puede probar sin
 * navegador y reutilizar en el servidor.
 */

export const COURSE_HASH = '#/curso'
export const DEMO_HASH = '#/demo'
export const PRACTICE_HASH = '#/practica'
export const REVIEW_HASH = '#/repaso'
export const PROGRESS_HASH = '#/progreso'
export const SETTINGS_HASH = '#/ajustes'
export const REPERTOIRE_HASH = '#/repertorio'
export const ATTRIBUTIONS_HASH = '#/atribuciones'

/** Ruta del reproductor de una lección concreta. */
export function lessonHash(lessonId: string): string {
  return `#/leccion/${encodeURIComponent(lessonId)}`
}

/** Ruta de la página de una pieza de repertorio. */
export function pieceHash(pieceId: string): string {
  return `#/pieza/${encodeURIComponent(pieceId)}`
}

export type AppRoute =
  | { name: 'course' }
  | { name: 'demo' }
  | { name: 'lesson'; lessonId: string }
  | { name: 'repertoire' }
  | { name: 'piece'; pieceId: string }
  | { name: 'attributions' }
  | { name: 'practice' }
  | { name: 'review' }
  | { name: 'progress' }
  | { name: 'settings' }
  | { name: 'not-found'; path: string }

export const NAV_ITEMS = [
  { id: 'course', hash: COURSE_HASH, labelKey: 'nav.course' },
  { id: 'repertoire', hash: REPERTOIRE_HASH, labelKey: 'nav.repertoire' },
  { id: 'practice', hash: PRACTICE_HASH, labelKey: 'nav.practice' },
  { id: 'review', hash: REVIEW_HASH, labelKey: 'nav.review' },
  { id: 'progress', hash: PROGRESS_HASH, labelKey: 'nav.progress' },
  { id: 'settings', hash: SETTINGS_HASH, labelKey: 'nav.settings' },
] as const

export type NavItem = (typeof NAV_ITEMS)[number]

function decodeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment)
  } catch {
    return segment
  }
}

/** Convierte el hash actual (con o sin `#`) en una ruta tipada. */
export function parseHash(hash: string): AppRoute {
  const withoutHash = hash.startsWith('#') ? hash.slice(1) : hash
  const withoutQuery = withoutHash.split('?')[0] ?? ''
  const path = withoutQuery.replace(/^\/+/, '').replace(/\/+$/, '')

  if (path === '' || path === 'curso') {
    return { name: 'course' }
  }

  const segments = path.split('/')

  switch (segments[0]) {
    case 'demo':
      if (segments.length === 1) return { name: 'demo' }
      break
    case 'practica':
      if (segments.length === 1) return { name: 'practice' }
      break
    case 'repaso':
      if (segments.length === 1) return { name: 'review' }
      break
    case 'progreso':
      if (segments.length === 1) return { name: 'progress' }
      break
    case 'ajustes':
      if (segments.length === 1) return { name: 'settings' }
      break
    case 'repertorio':
      if (segments.length === 1) return { name: 'repertoire' }
      break
    case 'atribuciones':
      if (segments.length === 1) return { name: 'attributions' }
      break
    case 'leccion': {
      if (segments.length !== 2) break
      const lessonId = decodeSegment(segments[1] ?? '').trim()
      if (lessonId.length === 0) break
      return { name: 'lesson', lessonId }
    }
    case 'pieza': {
      if (segments.length !== 2) break
      const pieceId = decodeSegment(segments[1] ?? '').trim()
      if (pieceId.length === 0) break
      return { name: 'piece', pieceId }
    }
    default:
      break
  }

  return { name: 'not-found', path: `/${path}` }
}

/** Hash canónico de una ruta conocida. */
export function routeHash(route: AppRoute): string {
  switch (route.name) {
    case 'course':
      return COURSE_HASH
    case 'demo':
      return DEMO_HASH
    case 'lesson':
      return lessonHash(route.lessonId)
    case 'repertoire':
      return REPERTOIRE_HASH
    case 'piece':
      return pieceHash(route.pieceId)
    case 'attributions':
      return ATTRIBUTIONS_HASH
    case 'practice':
      return PRACTICE_HASH
    case 'review':
      return REVIEW_HASH
    case 'progress':
      return PROGRESS_HASH
    case 'settings':
      return SETTINGS_HASH
    case 'not-found':
      return `#${route.path.startsWith('/') ? route.path : `/${route.path}`}`
  }
}

/** Clave de traducción del título de la página. */
export function routeTitleKey(route: AppRoute): string {
  switch (route.name) {
    case 'course':
      return 'nav.course'
    case 'demo':
      return 'nav.demo'
    case 'lesson':
      return 'nav.lesson'
    case 'repertoire':
    case 'piece':
      return 'nav.repertoire'
    case 'attributions':
      return 'repertoire.attributions.title'
    case 'practice':
      return 'nav.practice'
    case 'review':
      return 'nav.review'
    case 'progress':
      return 'nav.progress'
    case 'settings':
      return 'nav.settings'
    case 'not-found':
      return 'notFound.title'
  }
}

/** Indica qué elemento de la navegación corresponde a la ruta actual. */
export function isNavActive(item: NavItem, route: AppRoute): boolean {
  if (item.id === 'course') {
    return route.name === 'course' || route.name === 'lesson'
  }
  if (item.id === 'repertoire') {
    return (
      route.name === 'repertoire' ||
      route.name === 'piece' ||
      route.name === 'attributions'
    )
  }
  return route.name === item.id
}
