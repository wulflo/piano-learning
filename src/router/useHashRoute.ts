import { useSyncExternalStore } from 'react'
import { parseHash, type AppRoute } from './hash-route'

/**
 * Suscripción al hash de la URL.
 *
 * `hashchange` se dispara también al usar atrás/adelante del navegador y al
 * editar la barra de direcciones, así que no hace falta un router externo.
 * El snapshot es el hash como cadena: `useSyncExternalStore` lo compara por
 * identidad y no provoca bucles de render.
 */

function subscribe(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined
  window.addEventListener('hashchange', onStoreChange)
  return () => window.removeEventListener('hashchange', onStoreChange)
}

function getSnapshot(): string {
  return typeof window === 'undefined' ? '' : window.location.hash
}

function getServerSnapshot(): string {
  return ''
}

/** Ruta actual, reactiva a cambios del hash. */
export function useHashRoute(): AppRoute {
  return parseHash(useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot))
}
