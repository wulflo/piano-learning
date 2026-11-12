import { beforeAll, describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/lib/load-content'
import { exerciseChoices } from '../src/content/localize'
import { validateContentBundle } from '../src/content/validate'
import { resolveExerciseAnswer } from '../src/exercises/answer'
import type { ContentBundle, Exercise, Lesson } from '../src/schemas'
import { allPedagogicalFeedback } from '../src/theory/errors'

/**
 * F2-075 — Paridad ES/EN del contenido y del feedback.
 *
 * El español sigue siendo el idioma fuente y el inglés vive en campos
 * opcionales. Estos tests recorren el contenido real de M0-M3 para comprobar
 * que la traducción está completa, que las listas conservan el mismo orden y
 * que la respuesta correcta apunta a la misma opción en ambos idiomas.
 */

let bundle: ContentBundle
let lessons: Lesson[]
let exercises: Exercise[]

function publishedLessons(all: Lesson[]): Lesson[] {
  return all.filter((lesson) => lesson.status === 'published')
}

function referencedExercises(allLessons: Lesson[], all: Exercise[]): Exercise[] {
  const ids = new Set(allLessons.flatMap((lesson) => lesson.exerciseIds))
  return all.filter((exercise) => ids.has(exercise.id))
}

beforeAll(async () => {
  const result = validateContentBundle(await loadContentFromDisk())
  expect(result.ok).toBe(true)
  if (!result.bundle) throw new Error('El contenido del repositorio no es válido')
  bundle = result.bundle
  lessons = publishedLessons(bundle.lessons)
  exercises = referencedExercises(lessons, bundle.exercises)
})

describe('F2-075 — Paridad ES/EN del contenido', () => {
  it('traduce las 79 lecciones publicadas de M0 a M8', () => {
    expect(lessons).toHaveLength(79)

    for (const lesson of lessons) {
      expect(lesson.titleEn?.trim(), `${lesson.id} titleEn`).toBeTruthy()
      expect(lesson.summaryEn?.trim(), `${lesson.id} summaryEn`).toBeTruthy()
      expect(lesson.objectivesEn, `${lesson.id} objectivesEn`).toHaveLength(
        lesson.objectivesEs.length,
      )
      for (const [index, objective] of (lesson.objectivesEn ?? []).entries()) {
        expect(objective.trim(), `${lesson.id} objective ${index}`).toBeTruthy()
      }

      expect(lesson.sections.length).toBeGreaterThan(0)
      for (const [index, section] of lesson.sections.entries()) {
        expect(section.titleEn?.trim(), `${lesson.id} section ${index} titleEn`).toBeTruthy()
        if (section.bodyEs !== undefined) {
          expect(section.bodyEn?.trim(), `${lesson.id} section ${index} bodyEn`).toBeTruthy()
        }
      }

      const task = lesson.keyboardTask
      if (task !== undefined) {
        expect(task.titleEn?.trim(), `${lesson.id} task titleEn`).toBeTruthy()
        expect(task.instructionsEn?.trim(), `${lesson.id} task instructionsEn`).toBeTruthy()
        if (task.fingeringEs !== undefined) {
          expect(task.fingeringEn?.trim(), `${lesson.id} task fingeringEn`).toBeTruthy()
        }
        expect(task.checklistEn, `${lesson.id} task checklistEn`).toHaveLength(
          task.checklistEs.length,
        )
        for (const [index, item] of (task.checklistEn ?? []).entries()) {
          expect(item.trim(), `${lesson.id} checklist ${index}`).toBeTruthy()
        }
      }

      for (const [index, entry] of (lesson.glossary ?? []).entries()) {
        expect(entry.meaningEn?.trim(), `${lesson.id} glossary ${index} meaningEn`).toBeTruthy()
        expect(entry.exampleEn?.trim(), `${lesson.id} glossary ${index} exampleEn`).toBeTruthy()
      }
    }
  })

  it('traduce los 720 ejercicios referenciados con opciones paralelas', () => {
    expect(exercises).toHaveLength(720)

    for (const exercise of exercises) {
      expect(exercise.promptEn?.trim(), `${exercise.id} promptEn`).toBeTruthy()
      expect(exercise.explanationEn?.trim(), `${exercise.id} explanationEn`).toBeTruthy()

      if ('choices' in exercise && exercise.choices !== undefined) {
        expect(exercise.choicesEn, `${exercise.id} choicesEn`).toHaveLength(
          exercise.choices.length,
        )
        for (const [index, choice] of (exercise.choicesEn ?? []).entries()) {
          expect(choice.trim(), `${exercise.id} choice ${index}`).toBeTruthy()
        }
      }

      if (exercise.type === 'italian-term') {
        expect(exercise.meaningEn?.trim(), `${exercise.id} meaningEn`).toBeTruthy()
        expect(exercise.exampleEn?.trim(), `${exercise.id} exampleEn`).toBeTruthy()
      }
    }
  })

  it('resuelve la misma opción correcta en español y en inglés', () => {
    let choiceExercises = 0

    for (const exercise of exercises) {
      const spanish = resolveExerciseAnswer(exercise, 'es')
      const english = resolveExerciseAnswer(exercise, 'en')
      const choicesEs = exerciseChoices(exercise, 'es')
      const choicesEn = exerciseChoices(exercise, 'en')

      if (spanish.mode === 'practice') {
        expect(english.mode, `${exercise.id} practice`).toBe('practice')
        continue
      }

      expect(spanish.mode, `${exercise.id} modo ES`).toBe(english.mode)

      if (choicesEs === undefined || choicesEn === undefined) continue
      if (spanish.mode !== 'choice' || english.mode !== 'choice') continue

      choiceExercises += 1
      expect(choicesEs, `${exercise.id} opciones ES`).toContain(spanish.answer)
      expect(choicesEn, `${exercise.id} opciones EN`).toContain(english.answer)
      expect(
        choicesEs.indexOf(spanish.answer),
        `${exercise.id} índice de la respuesta`,
      ).toBe(choicesEn.indexOf(english.answer))
    }

    expect(choiceExercises).toBeGreaterThan(100)
  })

  it('mantiene paridad en el feedback pedagógico «Recordá»', () => {
    const feedback = allPedagogicalFeedback()
    expect(feedback.length).toBeGreaterThanOrEqual(20)

    for (const { code, feedback: entry } of feedback) {
      for (const field of ['titleEs', 'ruleEs', 'exampleEs', 'titleEn', 'ruleEn', 'exampleEn'] as const) {
        expect(entry[field].trim(), `${code} ${field}`).not.toBe('')
      }
      expect(entry.titleEn, `${code} title`).not.toBe(entry.titleEs)
    }
  })
})
