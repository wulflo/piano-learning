import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { App } from '../src/App'
import { LessonPlayer } from '../src/components/LessonPlayer'
import {
  COURSE_LESSONS,
  findCourseLesson,
  findCourseModule,
} from '../src/content/course'
import {
  hasExerciseContent,
  loadExercises,
} from '../src/content/exercises'
import { hasLessonContent, loadLesson } from '../src/content/lessons'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { validateContentBundle } from '../src/content/validate'
import { lessonHash } from '../src/router/hash-route'
import { ProgressProvider } from '../src/state/progress-context'
import { SettingsProvider } from '../src/state/settings'
import { createProgressDatabase } from '../src/state/db'
import { createProgressRepositories } from '../src/state/repositories'
import type { ContentBundle, Lesson, LessonProgress } from '../src/schemas'

/**
 * F4-028 — Integración de las lecciones M5-M6.
 *
 * Los tests de cada lección (F4-001 a F4-015 y las ampliaciones opcionales)
 * verifican el contenido por separado. Este archivo recorre el bloque completo
 * para comprobar que las 17 lecciones publicadas se cargan desde `content/`,
 * que cada una lleva al menos tres ejercicios y su tarea de teclado, que el
 * reproductor los presenta juntos y que la navegación del curso no tiene
 * huecos, incluidas las dos lecciones opcionales.
 */

const M5_REQUIRED_LESSON_IDS = [
  'lesson.m5-01',
  'lesson.m5-02',
  'lesson.m5-03',
  'lesson.m5-04',
  'lesson.m5-05',
  'lesson.m5-06',
  'lesson.m5-07',
  'lesson.m5-08',
  'lesson.m5-09',
] as const

const M5_OPTIONAL_LESSON_IDS = ['lesson.m5-10', 'lesson.m5-11'] as const

const M6_LESSON_IDS = [
  'lesson.m6-01',
  'lesson.m6-02',
  'lesson.m6-03',
  'lesson.m6-04',
  'lesson.m6-05',
  'lesson.m6-06',
] as const

const M5_LESSON_IDS = [
  ...M5_REQUIRED_LESSON_IDS,
  ...M5_OPTIONAL_LESSON_IDS,
]

const M5_M6_LESSON_IDS = [...M5_LESSON_IDS, ...M6_LESSON_IDS]

let databaseCounter = 0

function uniqueDatabaseName(): string {
  databaseCounter += 1
  return `pdc.test.m5-m6-integration.${databaseCounter}`
}

async function seedLessons(
  name: string,
  lessons: Record<string, LessonProgress>,
): Promise<void> {
  const repositories = createProgressRepositories(
    createProgressDatabase({ name }),
  )
  for (const [lessonId, progress] of Object.entries(lessons)) {
    await repositories.lessons.put(lessonId, progress)
  }
  repositories.close()
}

let bundle: ContentBundle

function lessonOf(id: string): Lesson {
  const lesson = bundle.lessons.find((candidate) => candidate.id === id)
  if (lesson === undefined) throw new Error(`Falta ${id}`)
  return lesson
}

beforeAll(async () => {
  const result = validateContentBundle(await loadContentFromDisk(process.cwd()))
  expect(result.ok, result.issues.map((issue) => issue.message).join('\n')).toBe(
    true,
  )
  if (!result.bundle) throw new Error('El contenido del repositorio no es válido')
  bundle = result.bundle

  // Carga diferida: cada archivo de lección y de ejercicio debe existir.
  for (const lessonId of M5_M6_LESSON_IDS) {
    expect(hasLessonContent(lessonId), lessonId).toBe(true)
  }
})

afterEach(() => {
  window.location.hash = ''
})

describe('F4-028 — Lecciones M5-M6 publicadas con ejercicios y tarea', () => {
  it('publica las 17 lecciones de M5 y M6 en el orden del curso', () => {
    expect(findCourseModule('M5')?.lessonIds).toEqual([...M5_LESSON_IDS])
    expect(findCourseModule('M6')?.lessonIds).toEqual([...M6_LESSON_IDS])

    for (const lessonId of M5_M6_LESSON_IDS) {
      const indexed = findCourseLesson(lessonId)
      expect(indexed, lessonId).toBeDefined()
      expect(indexed?.status, lessonId).toBe('published')
      expect(indexed?.optional ?? false, lessonId).toBe(
        (M5_OPTIONAL_LESSON_IDS as readonly string[]).includes(lessonId),
      )
    }

    // La secuencia del índice coincide con el bloque y no salta lecciones.
    const first = COURSE_LESSONS.findIndex(
      (lesson) => lesson.id === M5_M6_LESSON_IDS[0],
    )
    expect(first).toBeGreaterThanOrEqual(0)
    expect(
      COURSE_LESSONS.slice(first, first + M5_M6_LESSON_IDS.length).map(
        (lesson) => lesson.id,
      ),
    ).toEqual(M5_M6_LESSON_IDS)
  })

  it('encadena prerrequisitos y deja las opcionales fuera de la ruta obligatoria', () => {
    expect(findCourseLesson('lesson.m5-01')?.prerequisites).toContain(
      'lesson.m4-12',
    )

    for (let index = 1; index < M5_REQUIRED_LESSON_IDS.length; index += 1) {
      const previous = M5_REQUIRED_LESSON_IDS[index - 1]!
      const current = M5_REQUIRED_LESSON_IDS[index]!
      expect(findCourseLesson(current)?.prerequisites, current).toContain(
        previous,
      )
    }

    for (const optionalId of M5_OPTIONAL_LESSON_IDS) {
      expect(findCourseLesson(optionalId)?.prerequisites, optionalId).toContain(
        'lesson.m5-08',
      )
    }

    // M6 arranca al terminar la cadena obligatoria de M5, no las opcionales.
    expect(findCourseLesson('lesson.m6-01')?.prerequisites).toContain(
      'lesson.m5-09',
    )
    for (let index = 1; index < M6_LESSON_IDS.length; index += 1) {
      const previous = M6_LESSON_IDS[index - 1]!
      const current = M6_LESSON_IDS[index]!
      expect(findCourseLesson(current)?.prerequisites, current).toContain(
        previous,
      )
    }

    // Ninguna lección obligatoria depende de una opcional.
    const optionalIds = new Set<string>(M5_OPTIONAL_LESSON_IDS)
    for (const lessonId of M5_M6_LESSON_IDS) {
      if (optionalIds.has(lessonId)) continue
      const prerequisites = findCourseLesson(lessonId)?.prerequisites ?? []
      for (const optionalId of optionalIds) {
        expect(prerequisites, lessonId).not.toContain(optionalId)
      }
    }
  })

  it('cada lección tiene al menos tres ejercicios válidos y bilingües', () => {
    for (const lessonId of M5_M6_LESSON_IDS) {
      const lesson = lessonOf(lessonId)
      const optional = optionalLesson(lessonId)

      expect(lesson.status, lessonId).toBe('published')
      expect(lesson.optional ?? false, lessonId).toBe(optional)
      expect(lesson.exerciseIds.length, lessonId).toBeGreaterThanOrEqual(3)
      expect(new Set(lesson.exerciseIds).size, lessonId).toBe(
        lesson.exerciseIds.length,
      )
      expect(
        lesson.sections.some((section) => section.kind === 'exercise'),
        lessonId,
      ).toBe(true)

      for (const exerciseId of lesson.exerciseIds) {
        expect(hasExerciseContent(exerciseId), exerciseId).toBe(true)
        const exercise = bundle.exercises.find(
          (candidate) => candidate.id === exerciseId,
        )
        expect(exercise, exerciseId).toBeDefined()
        expect(exercise?.skillId, exerciseId).toBeDefined()
        expect(lesson.skillIds, exerciseId).toContain(exercise?.skillId)
        expect(exercise?.promptEs, exerciseId).not.toBe('')
        expect(exercise?.promptEn, exerciseId).not.toBe('')
        expect(exercise?.explanationEs, exerciseId).not.toBe('')
        expect(exercise?.explanationEn, exerciseId).not.toBe('')
        expect(exercise?.optional ?? false, exerciseId).toBe(optional)
      }
    }
  })

  it('cada lección define una tarea de teclado real y una demo', () => {
    for (const lessonId of M5_M6_LESSON_IDS) {
      const lesson = lessonOf(lessonId)
      const task = lesson.keyboardTask
      expect(task, lessonId).toBeDefined()
      if (task === undefined) continue

      expect(task.titleEs, lessonId).not.toBe('')
      expect(task.titleEn, lessonId).toBeTruthy()
      expect(task.instructionsEs, lessonId).not.toBe('')
      expect(task.instructionsEn, lessonId).toBeTruthy()
      expect(task.keys.length, lessonId).toBeGreaterThan(0)
      expect(task.tempoBpm, lessonId).toBeGreaterThanOrEqual(40)
      expect(task.tempoBpm, lessonId).toBeLessThanOrEqual(240)
      expect(task.checklistEs.length, lessonId).toBeGreaterThanOrEqual(3)
      expect(task.checklistEn?.length, lessonId).toBe(task.checklistEs.length)
      expect(task.demoScore, lessonId).toBeDefined()
      expect(task.demoScore?.events.length, lessonId).toBeGreaterThan(0)
    }
  })

  it('carga las lecciones y sus ejercicios con el cargador de la app', async () => {
    for (const lessonId of M5_M6_LESSON_IDS) {
      const lesson = await loadLesson(lessonId)
      expect(lesson.id).toBe(lessonId)
      expect(lesson.sections.length).toBeGreaterThan(0)

      const exercises = await loadExercises(lesson.exerciseIds)
      expect(exercises.map((exercise) => exercise.id)).toEqual(
        lesson.exerciseIds,
      )
    }
  })
})

function optionalLesson(lessonId: string): boolean {
  return (M5_OPTIONAL_LESSON_IDS as readonly string[]).includes(lessonId)
}

describe('F4-028 — Reproductor de lección con ejercicios y tarea', () => {
  it('muestra el reproductor de acordes y la tarea de M5-01', async () => {
    const lesson = await loadLesson('lesson.m5-01')

    render(
      <SettingsProvider>
        <ProgressProvider databaseName={uniqueDatabaseName()}>
          <LessonPlayer lesson={lesson} />
        </ProgressProvider>
      </SettingsProvider>,
    )

    expect(
      await screen.findByText('Ejercicio 1 de 12'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        level: 3,
        name: 'En Do mayor, ¿qué cifrado tiene la tríada diatónica del grado IV?',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Escuchar acorde' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 2, name: 'Tarea de teclado' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('group', { name: 'Lista de control' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Escuchar demo' }),
    ).toBeInTheDocument()
  })

  it('muestra el análisis de frase y la tarea de M6-01', async () => {
    const lesson = await loadLesson('lesson.m6-01')

    render(
      <SettingsProvider>
        <ProgressProvider databaseName={uniqueDatabaseName()}>
          <LessonPlayer lesson={lesson} />
        </ProgressProvider>
      </SettingsProvider>,
    )

    expect(
      await screen.findByText('Ejercicio 1 de 12'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        level: 3,
        name: '¿Cuántos motivos distintos tiene esta melodía?',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Escuchar melodía completa' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 2, name: 'Tarea de teclado' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Escuchar demo' }),
    ).toBeInTheDocument()
  })

  it('marca como opcional la lección M5-11 y dibuja su acorde', async () => {
    const lesson = await loadLesson('lesson.m5-11')

    render(
      <SettingsProvider>
        <ProgressProvider databaseName={uniqueDatabaseName()}>
          <LessonPlayer lesson={lesson} />
        </ProgressProvider>
      </SettingsProvider>,
    )

    expect(
      await screen.findByText('Ejercicio 1 de 4'),
    ).toBeInTheDocument()
    expect(screen.getByText('Ejercicio · Opcional')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        level: 3,
        name: 'En La menor, este acorde aparece antes de la dominante. ¿Qué variante de sexta aumentada es?',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Escuchar acorde' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 2, name: 'Tarea de teclado' }),
    ).toBeInTheDocument()
  })
})

describe('F4-028 — Navegación completa de M5-M6', () => {
  it('abre M5-01 y M6-01 sin exigir las lecciones opcionales', async () => {
    window.location.hash = ''
    const name = uniqueDatabaseName()

    // Se completa toda la ruta obligatoria hasta M5-09, sin tocar M5-10 ni
    // M5-11: así M6-01 debe quedar disponible y la ruta debe proponerla.
    const routeThroughM5 = COURSE_LESSONS.slice(
      0,
      COURSE_LESSONS.findIndex((lesson) => lesson.id === 'lesson.m5-09') + 1,
    )
    const seeded: Record<string, LessonProgress> = {}
    for (const [index, lesson] of routeThroughM5.entries()) {
      seeded[lesson.id] = {
        status: 'completed',
        completedAt: new Date(
          Date.UTC(2026, 10, 1, 10, 0, index),
        ).toISOString(),
        secondsSpent: 300,
      }
    }
    await seedLessons(name, seeded)

    const { unmount } = render(<App databaseName={name} />)

    await waitFor(() =>
      expect(
        screen.getByText(
          new RegExp(`${routeThroughM5.length} de 79 lecciones`),
        ),
      ).toBeInTheDocument(),
    )

    const m5First = findCourseLesson('lesson.m5-01')!
    expect(
      screen.getByRole('link', { name: m5First.titleEs }),
    ).toHaveAttribute('href', lessonHash('lesson.m5-01'))

    const m6First = findCourseLesson('lesson.m6-01')!
    expect(
      screen.getByRole('link', { name: m6First.titleEs }),
    ).toHaveAttribute('href', lessonHash('lesson.m6-01'))

    // Las opcionales están disponibles, pero M6 no depende de ellas.
    for (const optionalId of M5_OPTIONAL_LESSON_IDS) {
      const optional = findCourseLesson(optionalId)!
      expect(
        screen.getByRole('link', { name: optional.titleEs }),
        optionalId,
      ).toHaveAttribute('href', lessonHash(optionalId))
    }
    expect(screen.getAllByText('Disponible · Opcional')).toHaveLength(2)

    // La ruta propone M6-01, la siguiente obligatoria, y no una opcional.
    expect(
      screen.getByRole('link', { name: /Continuar por «Motivo y frase/ }),
    ).toHaveAttribute('href', lessonHash('lesson.m6-01'))
    expect(
      screen.queryByRole('link', { name: /Continuar por «La napolitana/ }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: /Continuar por «Sextas aumentadas/ }),
    ).not.toBeInTheDocument()

    unmount()
  })
})
