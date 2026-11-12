import { describe, expect, it } from 'vitest'
import {
  ATTRIBUTIONS_HASH,
  COURSE_HASH,
  DEMO_HASH,
  NAV_ITEMS,
  PRACTICE_HASH,
  PROGRESS_HASH,
  REPERTOIRE_HASH,
  REVIEW_HASH,
  SETTINGS_HASH,
  SONGS_HASH,
  isNavActive,
  lessonHash,
  parseHash,
  pieceHash,
  routeHash,
  routeTitleKey,
  type AppRoute,
  type NavItem,
} from '../src/router/hash-route'

describe('F2-058 — Hash router', () => {
  it('resuelve las rutas del shell', () => {
    expect(parseHash('')).toEqual({ name: 'course' })
    expect(parseHash('#')).toEqual({ name: 'course' })
    expect(parseHash('#/')).toEqual({ name: 'course' })
    expect(parseHash('#/curso')).toEqual({ name: 'course' })
    expect(parseHash('#/curso/')).toEqual({ name: 'course' })
    expect(parseHash('#/demo')).toEqual({ name: 'demo' })
    expect(parseHash('#/practica')).toEqual({ name: 'practice' })
    expect(parseHash('#/repaso')).toEqual({ name: 'review' })
    expect(parseHash('#/progreso')).toEqual({ name: 'progress' })
    expect(parseHash('#/ajustes')).toEqual({ name: 'settings' })
    expect(parseHash('#/repertorio')).toEqual({ name: 'repertoire' })
    expect(parseHash('#/canciones')).toEqual({ name: 'songs' })
    expect(parseHash('#/atribuciones')).toEqual({ name: 'attributions' })
  })

  it('resuelve el enlace profundo de una pieza', () => {
    expect(parseHash('#/pieza/piece.studies.01')).toEqual({
      name: 'piece',
      pieceId: 'piece.studies.01',
    })
    expect(parseHash('#/pieza/piece.original.do-mayor')).toEqual({
      name: 'piece',
      pieceId: 'piece.original.do-mayor',
    })
    expect(parseHash('#/pieza/a%2Fb')).toEqual({
      name: 'piece',
      pieceId: 'a/b',
    })
  })

  it('resuelve el enlace profundo de una lección', () => {
    expect(parseHash('#/leccion/lesson.m0-01')).toEqual({
      name: 'lesson',
      lessonId: 'lesson.m0-01',
    })
    expect(parseHash('#/leccion/lesson%20con%20espacios')).toEqual({
      name: 'lesson',
      lessonId: 'lesson con espacios',
    })
    expect(parseHash('#/leccion/a%2Fb')).toEqual({
      name: 'lesson',
      lessonId: 'a/b',
    })
  })

  it('ignora la query y las barras sobrantes', () => {
    expect(parseHash('#/repaso?desde=hoy')).toEqual({ name: 'review' })
    expect(parseHash('//curso//')).toEqual({ name: 'course' })
  })

  it('devuelve una ruta desconocida para hashes inválidos', () => {
    expect(parseHash('#/otra')).toEqual({ name: 'not-found', path: '/otra' })
    expect(parseHash('#/leccion')).toEqual({
      name: 'not-found',
      path: '/leccion',
    })
    expect(parseHash('#/leccion/')).toEqual({
      name: 'not-found',
      path: '/leccion',
    })
    expect(parseHash('#/leccion/a/b')).toEqual({
      name: 'not-found',
      path: '/leccion/a/b',
    })
    expect(parseHash('#/demo/extra')).toEqual({
      name: 'not-found',
      path: '/demo/extra',
    })
    expect(parseHash('#/pieza')).toEqual({
      name: 'not-found',
      path: '/pieza',
    })
    expect(parseHash('#/pieza/')).toEqual({
      name: 'not-found',
      path: '/pieza',
    })
    expect(parseHash('#/pieza/a/b')).toEqual({
      name: 'not-found',
      path: '/pieza/a/b',
    })
  })

  it('genera hashes canónicos que vuelven a la misma ruta', () => {
    const routes: AppRoute[] = [
      { name: 'course' },
      { name: 'demo' },
      { name: 'lesson', lessonId: 'lesson.m0-01' },
      { name: 'repertoire' },
      { name: 'piece', pieceId: 'piece.studies.01' },
      { name: 'songs' },
      { name: 'attributions' },
      { name: 'practice' },
      { name: 'review' },
      { name: 'progress' },
      { name: 'settings' },
      { name: 'not-found', path: '/otra' },
    ]

    for (const route of routes) {
      expect(parseHash(routeHash(route))).toEqual(route)
    }

    expect(COURSE_HASH).toBe('#/curso')
    expect(DEMO_HASH).toBe('#/demo')
    expect(PRACTICE_HASH).toBe('#/practica')
    expect(REVIEW_HASH).toBe('#/repaso')
    expect(PROGRESS_HASH).toBe('#/progreso')
    expect(SETTINGS_HASH).toBe('#/ajustes')
    expect(REPERTOIRE_HASH).toBe('#/repertorio')
    expect(SONGS_HASH).toBe('#/canciones')
    expect(ATTRIBUTIONS_HASH).toBe('#/atribuciones')
    expect(lessonHash('lesson.m0-01')).toBe('#/leccion/lesson.m0-01')
    expect(lessonHash('a/b')).toBe('#/leccion/a%2Fb')
    expect(pieceHash('piece.studies.01')).toBe('#/pieza/piece.studies.01')
    expect(pieceHash('a/b')).toBe('#/pieza/a%2Fb')
  })

  it('marca el curso como activo también dentro de una lección', () => {
    const byId = (id: NavItem['id']) =>
      NAV_ITEMS.find((item) => item.id === id) as NavItem

    expect(isNavActive(byId('course'), { name: 'course' })).toBe(true)
    expect(
      isNavActive(byId('course'), { name: 'lesson', lessonId: 'lesson.m0-01' }),
    ).toBe(true)
    expect(isNavActive(byId('course'), { name: 'review' })).toBe(false)
    expect(isNavActive(byId('repertoire'), { name: 'repertoire' })).toBe(true)
    expect(
      isNavActive(byId('repertoire'), {
        name: 'piece',
        pieceId: 'piece.studies.01',
      }),
    ).toBe(true)
    expect(isNavActive(byId('repertoire'), { name: 'attributions' })).toBe(true)
    expect(isNavActive(byId('repertoire'), { name: 'course' })).toBe(false)
    expect(isNavActive(byId('songs'), { name: 'songs' })).toBe(true)
    expect(isNavActive(byId('songs'), { name: 'practice' })).toBe(false)
    expect(isNavActive(byId('practice'), { name: 'practice' })).toBe(true)
    expect(isNavActive(byId('practice'), { name: 'review' })).toBe(false)
    expect(isNavActive(byId('review'), { name: 'review' })).toBe(true)
    expect(isNavActive(byId('progress'), { name: 'progress' })).toBe(true)
    expect(isNavActive(byId('settings'), { name: 'settings' })).toBe(true)
    expect(isNavActive(byId('settings'), { name: 'demo' })).toBe(false)
  })

  it('asigna un título traducible a cada ruta', () => {
    expect(routeTitleKey({ name: 'course' })).toBe('nav.course')
    expect(routeTitleKey({ name: 'lesson', lessonId: 'x' })).toBe('nav.lesson')
    expect(routeTitleKey({ name: 'repertoire' })).toBe('nav.repertoire')
    expect(routeTitleKey({ name: 'piece', pieceId: 'x' })).toBe(
      'nav.repertoire',
    )
    expect(routeTitleKey({ name: 'attributions' })).toBe(
      'repertoire.attributions.title',
    )
    expect(routeTitleKey({ name: 'songs' })).toBe('nav.songs')
    expect(routeTitleKey({ name: 'practice' })).toBe('nav.practice')
    expect(routeTitleKey({ name: 'not-found', path: '/x' })).toBe(
      'notFound.title',
    )
  })
})
