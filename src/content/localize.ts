import type {
  Exercise,
  GlossaryEntry,
  KeyboardTask,
  Lesson,
  LessonSection,
} from '../schemas'

/**
 * Selección de campos bilingües del contenido.
 *
 * El contenido guarda el español como idioma principal y el inglés como campos
 * opcionales. Estas funciones concentran la caída al español para que la UI no
 * repita la misma condición en cada componente y para que un campo faltante
 * nunca deje un hueco visible.
 */

export type Locale = 'es' | 'en'

export function pickLocalized(
  locale: Locale,
  spanish: string,
  english: string | undefined,
): string {
  return locale === 'en' && english !== undefined && english.trim() !== ''
    ? english
    : spanish
}

export function pickLocalizedList(
  locale: Locale,
  spanish: readonly string[],
  english: readonly string[] | undefined,
): readonly string[] {
  return locale === 'en' && english !== undefined && english.length === spanish.length
    ? english
    : spanish
}

export function lessonTitle(lesson: Lesson, locale: Locale): string {
  return pickLocalized(locale, lesson.titleEs, lesson.titleEn)
}

export function lessonSummary(lesson: Lesson, locale: Locale): string {
  return pickLocalized(locale, lesson.summaryEs, lesson.summaryEn)
}

export function lessonObjectives(
  lesson: Lesson,
  locale: Locale,
): readonly string[] {
  return pickLocalizedList(locale, lesson.objectivesEs, lesson.objectivesEn)
}

export function sectionTitle(
  section: LessonSection,
  locale: Locale,
): string {
  return pickLocalized(locale, section.titleEs, section.titleEn)
}

export function sectionBody(
  section: LessonSection,
  locale: Locale,
): string | undefined {
  return locale === 'en' && section.bodyEn !== undefined
    ? section.bodyEn
    : section.bodyEs
}

export function taskTitle(task: KeyboardTask, locale: Locale): string {
  return pickLocalized(locale, task.titleEs, task.titleEn)
}

export function taskInstructions(
  task: KeyboardTask,
  locale: Locale,
): string {
  return pickLocalized(locale, task.instructionsEs, task.instructionsEn)
}

export function taskFingering(
  task: KeyboardTask,
  locale: Locale,
): string | undefined {
  return locale === 'en' && task.fingeringEn !== undefined
    ? task.fingeringEn
    : task.fingeringEs
}

export function taskChecklist(
  task: KeyboardTask,
  locale: Locale,
): readonly string[] {
  return pickLocalizedList(locale, task.checklistEs, task.checklistEn)
}

export function glossaryMeaning(
  entry: GlossaryEntry,
  locale: Locale,
): string {
  return pickLocalized(locale, entry.meaningEs, entry.meaningEn)
}

export function glossaryExample(
  entry: GlossaryEntry,
  locale: Locale,
): string {
  return pickLocalized(locale, entry.exampleEs, entry.exampleEn)
}

export function exercisePrompt(exercise: Exercise, locale: Locale): string {
  return pickLocalized(locale, exercise.promptEs, exercise.promptEn)
}

export function exerciseExplanation(
  exercise: Exercise,
  locale: Locale,
): string {
  return pickLocalized(locale, exercise.explanationEs, exercise.explanationEn)
}

/** Opciones visibles del ejercicio; si faltan en inglés, conserva el español. */
export function exerciseChoices(
  exercise: Exercise,
  locale: Locale,
): readonly string[] | undefined {
  if (!('choices' in exercise)) return undefined
  const { choices, choicesEn } = exercise
  if (choices === undefined) return undefined
  if (
    locale === 'en' &&
    choicesEn !== undefined &&
    choicesEn.length === choices.length
  ) {
    return choicesEn
  }
  return choices
}
