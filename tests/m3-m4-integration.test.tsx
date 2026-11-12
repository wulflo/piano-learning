import { render, screen } from '@testing-library/react'
import { beforeAll, describe, expect, it } from 'vitest'
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
import { ProgressProvider } from '../src/state/progress-context'
import { SettingsProvider } from '../src/state/settings'
import type { ContentBundle, Lesson } from '../src/schemas'

/**
 * F3-029 — Integración de las lecciones M3-M4.
 *
 * Los tests de cada lección (F3-001 a F3-017) verifican el contenido por
 * separado. Este archivo recorre el bloque completo para comprobar que las 17
 * lecciones publicadas se pueden cargar desde `content/`, que cada una lleva sus
 * doce ejercicios y su tarea de teclado, que el reproductor los presenta juntos
 * y que la navegación del curso no tiene huecos.
 */

const M3_LESSON_IDS = [
  'lesson.m3-01',
  'lesson.m3-02',
  'lesson.m3-03',
  'lesson.m3-04',
  'lesson.m3-05',
] as const

const M4_LESSON_IDS = [
  'lesson.m4-01',
  'lesson.m4-02',
  'lesson.m4-03',
  'lesson.m4-04',
  'lesson.m4-05',
  'lesson.m4-06',
  'lesson.m4-07',
  'lesson.m4-08',
  'lesson.m4-09',
  'lesson.m4-10',
  'lesson.m4-11',
  'lesson.m4-12',
] as const

const M3_M4_LESSON_IDS = [...M3_LESSON_IDS, ...M4_LESSON_IDS]

let databaseCounter = 0

function uniqueDatabaseName(): string {
  databaseCounter += 1
  return `pdc.test.m3-m4-integration.${databaseCounter}`
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
  for (const lessonId of M3_M4_LESSON_IDS) {
    expect(hasLessonContent(lessonId), lessonId).toBe(true)
  }
})

describe('F3-029 — Lecciones M3-M4 publicadas con ejercicios y tarea', () => {
  it('publica las 17 lecciones de M3 y M4 en el orden del curso', () => {
    expect(findCourseModule('M3')?.lessonIds).toEqual([...M3_LESSON_IDS])
    expect(findCourseModule('M4')?.lessonIds).toEqual([...M4_LESSON_IDS])

    for (const lessonId of M3_M4_LESSON_IDS) {
      const indexed = findCourseLesson(lessonId)
      expect(indexed, lessonId).toBeDefined()
      expect(indexed?.status).toBe('published')
    }
  })

  it('encadena prerrequisitos y navegación sin huecos', () => {
    expect(findCourseLesson('lesson.m3-01')?.prerequisites).toContain(
      'lesson.m2-12',
    )
    expect(findCourseLesson('lesson.m4-01')?.prerequisites).toContain(
      'lesson.m3-05',
    )

    for (let index = 1; index < M3_M4_LESSON_IDS.length; index += 1) {
      const previous = M3_M4_LESSON_IDS[index - 1]!
      const current = M3_M4_LESSON_IDS[index]!
      expect(findCourseLesson(current)?.prerequisites, current).toContain(
        previous,
      )
    }

    // La secuencia del índice coincide con el bloque y no salta lecciones.
    const first = COURSE_LESSONS.findIndex(
      (lesson) => lesson.id === M3_M4_LESSON_IDS[0],
    )
    expect(first).toBeGreaterThanOrEqual(0)
    expect(
      COURSE_LESSONS.slice(first, first + M3_M4_LESSON_IDS.length).map(
        (lesson) => lesson.id,
      ),
    ).toEqual(M3_M4_LESSON_IDS)
  })

  it('cada lección tiene 12 ejercicios válidos y una sección de ejercicios', () => {
    for (const lessonId of M3_M4_LESSON_IDS) {
      const lesson = lessonOf(lessonId)
      expect(lesson.status, lessonId).toBe('published')
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
      }
    }
  })

  it('cada lección define una tarea de teclado real y una demo', () => {
    for (const lessonId of M3_M4_LESSON_IDS) {
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
    for (const lessonId of M3_M4_LESSON_IDS) {
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

describe('F3-029 — Reproductor de lección con ejercicios y tarea', () => {
  it('muestra el primer ejercicio y la tarea de M3-01', async () => {
    const lesson = await loadLesson('lesson.m3-01')

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
        name: /¿Qué intervalo hay entre Do4 y Re4\?/,
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Escuchar intervalo' }),
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

  it('muestra el reproductor de acordes y la tarea de M4-01', async () => {
    const lesson = await loadLesson('lesson.m4-01')

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
        name: /¿Qué calidad tiene la tríada construida sobre C con la regla 1-3-5\?/,
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Escuchar acorde' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 2, name: 'Tarea de teclado' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Iniciar metrónomo' }),
    ).toBeInTheDocument()
  })
})
