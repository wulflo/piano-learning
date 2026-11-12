import {
  ContentBundleSchema,
  DYNAMIC_MARK_RANGES,
  ITALIAN_TERM_CATEGORIES,
  TEMPO_MARK_RANGES,
  type ContentBundle,
} from '../schemas'
import { HAND_LABELS } from '../exercises/hand-coordination'
import {
  arpeggioFingeringLabel,
  arpeggioNoteNames,
} from '../exercises/arpeggio'
import {
  accompanimentPatternCandidates,
  accompanimentPatternInMeasure,
  chordSymbolInMeasure,
  leadSheetMelodyNoteName,
  shellVoicingLabel,
} from '../exercises/accompaniment'
import {
  stylePatternCandidates,
  stylePatternInMeasure,
  styleProgressionCandidates,
  styleProgressionDegrees,
  styleScaleCandidates,
  styleScaleName,
  styleVoicingCandidates,
} from '../exercises/style-pattern'
import {
  arpeggiatedNoteNames,
  arpeggiatedPatternCandidates,
  arpeggiatedPatternInMeasure,
} from '../exercises/arpeggiated'
import {
  albertiNoteNames,
  albertiPatternCandidates,
  albertiPatternInMeasure,
} from '../exercises/alberti'
import {
  walkingNoteAt,
  walkingRoleAt,
  walkingRoleCandidates,
} from '../exercises/walking'
import {
  strideBassNoteAt,
  stridePatternCandidates,
  stridePatternInMeasure,
} from '../exercises/stride'
import {
  sightReadingIntervalName,
  sightReadingMotionLabel,
  sightReadingNoteName,
  sightReadingNotes,
} from '../exercises/sight-reading'
import {
  pedalActionAt,
  pedalActionCandidates,
  pedalPatternCandidates,
  pedalPatternInMeasure,
} from '../exercises/pedal'
import { formatPitch, fromSpelledPitch, parseRomanNumeral } from '../theory'
import { attackingHandAt } from './score'

export interface ContentValidationIssue {
  path: string
  message: string
}

export interface ContentValidationResult {
  ok: boolean
  issues: ContentValidationIssue[]
  warnings: ContentValidationIssue[]
  bundle?: ContentBundle
  stats: {
    modules: number
    lessons: number
    exercises: number
    skills: number
    repertoire: number
  }
}

function formatPath(path: readonly PropertyKey[]): string {
  return path.length > 0 ? path.map(String).join('.') : '(raíz)'
}

function duplicateIssues(
  kind: string,
  ids: readonly string[],
): ContentValidationIssue[] {
  const seen = new Set<string>()
  const dupes = new Set<string>()
  for (const id of ids) {
    if (seen.has(id)) {
      dupes.add(id)
    }
    seen.add(id)
  }
  return [...dupes].map((id) => ({
    path: kind,
    message: `ID duplicado en ${kind}: ${id}`,
  }))
}

export function validateContentBundle(raw: unknown): ContentValidationResult {
  const parsed = ContentBundleSchema.safeParse(raw)

  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.issues.map((issue) => ({
        path: formatPath(issue.path),
        message: issue.message,
      })),
      warnings: [],
      stats: { modules: 0, lessons: 0, exercises: 0, skills: 0, repertoire: 0 },
    }
  }

  const bundle = parsed.data
  const issues: ContentValidationIssue[] = []
  const warnings: ContentValidationIssue[] = []

  issues.push(
    ...duplicateIssues('modules', bundle.modules.map((item) => item.id)),
    ...duplicateIssues('lessons', bundle.lessons.map((item) => item.id)),
    ...duplicateIssues('exercises', bundle.exercises.map((item) => item.id)),
    ...duplicateIssues('skills', bundle.skills.map((item) => item.id)),
    ...duplicateIssues('repertoire', bundle.repertoire.map((item) => item.id)),
  )

  const moduleIds = new Set(bundle.modules.map((item) => item.id))
  const lessonIds = new Set(bundle.lessons.map((item) => item.id))
  const exerciseIds = new Set(bundle.exercises.map((item) => item.id))
  const skillIds = new Set(bundle.skills.map((item) => item.id))

  const orders = new Set<number>()
  for (const module of bundle.modules) {
    if (orders.has(module.order)) {
      issues.push({
        path: `modules.${module.id}.order`,
        message: `Orden de módulo duplicado: ${module.order}`,
      })
    }
    orders.add(module.order)
  }

  const referencedExercises = new Set<string>()

  for (const lesson of bundle.lessons) {
    if (!moduleIds.has(lesson.moduleId)) {
      issues.push({
        path: `lessons.${lesson.id}.moduleId`,
        message: `El módulo ${lesson.moduleId} no existe`,
      })
    }

    for (const prerequisite of lesson.prerequisites) {
      if (!lessonIds.has(prerequisite)) {
        issues.push({
          path: `lessons.${lesson.id}.prerequisites`,
          message: `Prerrequisito inexistente: ${prerequisite}`,
        })
      }
    }

    for (const skillId of lesson.skillIds) {
      if (!skillIds.has(skillId)) {
        issues.push({
          path: `lessons.${lesson.id}.skillIds`,
          message: `Habilidad inexistente: ${skillId}`,
        })
      }
    }

    for (const exerciseId of lesson.exerciseIds) {
      referencedExercises.add(exerciseId)
      if (!exerciseIds.has(exerciseId)) {
        issues.push({
          path: `lessons.${lesson.id}.exerciseIds`,
          message: `Ejercicio inexistente: ${exerciseId}`,
        })
      }
    }

    if (lesson.status === 'published' && !lesson.keyboardTask) {
      issues.push({
        path: `lessons.${lesson.id}`,
        message: 'Lección publicada sin tarea de teclado real',
      })
    }

    if (lesson.status === 'published') {
      const missing: string[] = []
      if (!lesson.titleEn) missing.push('titleEn')
      if (!lesson.summaryEn) missing.push('summaryEn')
      if (
        !lesson.objectivesEn ||
        lesson.objectivesEn.length !== lesson.objectivesEs.length
      ) {
        missing.push('objectivesEn')
      }
      lesson.sections.forEach((section, index) => {
        if (!section.titleEn) missing.push(`sections.${index}.titleEn`)
        if (section.bodyEs !== undefined && !section.bodyEn) {
          missing.push(`sections.${index}.bodyEn`)
        }
      })
      if (lesson.keyboardTask !== undefined) {
        const task = lesson.keyboardTask
        if (!task.titleEn) missing.push('keyboardTask.titleEn')
        if (!task.instructionsEn) missing.push('keyboardTask.instructionsEn')
        if (task.fingeringEs !== undefined && !task.fingeringEn) {
          missing.push('keyboardTask.fingeringEn')
        }
        if (
          !task.checklistEn ||
          task.checklistEn.length !== task.checklistEs.length
        ) {
          missing.push('keyboardTask.checklistEn')
        }
      }
      lesson.glossary.forEach((entry, index) => {
        if (!entry.meaningEn) missing.push(`glossary.${index}.meaningEn`)
        if (!entry.exampleEn) missing.push(`glossary.${index}.exampleEn`)
      })
      if (missing.length > 0) {
        issues.push({
          path: `lessons.${lesson.id}`,
          message: `Lección publicada sin contenido en inglés: ${missing.join(', ')}`,
        })
      }
    }

    const glossaryTerms = new Set<string>()
    for (const entry of lesson.glossary) {
      if (glossaryTerms.has(entry.term)) {
        issues.push({
          path: `lessons.${lesson.id}.glossary`,
          message: `Término duplicado en el glosario: ${entry.term}`,
        })
      }
      glossaryTerms.add(entry.term)
      if (ITALIAN_TERM_CATEGORIES[entry.term] !== entry.category) {
        issues.push({
          path: `lessons.${lesson.id}.glossary.${entry.term}`,
          message: `La categoría ${entry.category} no corresponde a ${entry.term}`,
        })
      }
    }
  }

  for (const exercise of bundle.exercises) {
    if (!skillIds.has(exercise.skillId)) {
      issues.push({
        path: `exercises.${exercise.id}.skillId`,
        message: `Habilidad inexistente: ${exercise.skillId}`,
      })
    }

    if (referencedExercises.has(exercise.id)) {
      const missing: string[] = []
      if (!exercise.promptEn) missing.push('promptEn')
      if (!exercise.explanationEn) missing.push('explanationEn')
      if (
        'choices' in exercise &&
        exercise.choices !== undefined &&
        (exercise.choicesEn === undefined ||
          exercise.choicesEn.length !== exercise.choices.length)
      ) {
        missing.push('choicesEn')
      }
      if (exercise.type === 'italian-term') {
        if (!exercise.meaningEn) missing.push('meaningEn')
        if (!exercise.exampleEn) missing.push('exampleEn')
      }
      if (missing.length > 0) {
        issues.push({
          path: `exercises.${exercise.id}`,
          message: `Ejercicio sin contenido en inglés: ${missing.join(', ')}`,
        })
      }
    }
    if (
      (exercise.type === 'rhythm-completion' ||
        exercise.type === 'anacrusis-completion') &&
      exercise.missingIndex >= exercise.pattern.length
    ) {
      issues.push({
        path: `exercises.${exercise.id}.missingIndex`,
        message: `El índice faltante ${exercise.missingIndex} está fuera del patrón`,
      })
    }
    if (exercise.type === 'progression-completion') {
      if (exercise.missingIndex >= exercise.degrees.length) {
        issues.push({
          path: `exercises.${exercise.id}.missingIndex`,
          message: `El índice faltante ${exercise.missingIndex} está fuera de la progresión`,
        })
      }
      const answer = exercise.degrees[exercise.missingIndex]
      if (answer !== undefined && exercise.choices !== undefined) {
        if (!exercise.choices.includes(answer)) {
          issues.push({
            path: `exercises.${exercise.id}.choices`,
            message: `Las opciones no incluyen la respuesta ${answer}`,
          })
        }
        if (new Set(exercise.choices).size !== exercise.choices.length) {
          issues.push({
            path: `exercises.${exercise.id}.choices`,
            message: 'Las opciones de la progresión deben ser distintas',
          })
        }
        for (const choice of exercise.choices) {
          try {
            parseRomanNumeral(choice)
          } catch {
            issues.push({
              path: `exercises.${exercise.id}.choices`,
              message: `La opción "${choice}" no es un número romano válido`,
            })
          }
        }
      }
    }
    if (exercise.type === 'meter-accent') {
      for (const beat of exercise.accentedBeats) {
        if (beat > exercise.timeSignature.numerator) {
          issues.push({
            path: `exercises.${exercise.id}.accentedBeats`,
            message: `El pulso acentuado ${beat} supera el numerador ${exercise.timeSignature.numerator}`,
          })
        }
      }
      if (!exercise.accentedBeats.includes(1)) {
        issues.push({
          path: `exercises.${exercise.id}.accentedBeats`,
          message: 'El primer pulso debe estar acentuado',
        })
      }
    }
    if (exercise.type === 'tempo-term') {
      const range = TEMPO_MARK_RANGES[exercise.term]
      if (exercise.bpm < range.min || exercise.bpm > range.max) {
        issues.push({
          path: `exercises.${exercise.id}.bpm`,
          message: `${exercise.bpm} BPM no corresponde al término ${exercise.term} (${range.min}-${range.max})`,
        })
      }
      if (!exercise.choices || exercise.choices.length < 2) {
        issues.push({
          path: `exercises.${exercise.id}.choices`,
          message: 'El ejercicio de tempo necesita al menos dos opciones',
        })
      }
    }
    if (exercise.type === 'tempo-stability') {
      if (exercise.targetBpm - exercise.toleranceBpm < 40) {
        issues.push({
          path: `exercises.${exercise.id}.toleranceBpm`,
          message: 'La tolerancia baja por debajo de 40 BPM',
        })
      }
      if (exercise.targetBpm + exercise.toleranceBpm > 240) {
        issues.push({
          path: `exercises.${exercise.id}.toleranceBpm`,
          message: 'La tolerancia supera los 240 BPM',
        })
      }
    }
    if (exercise.type === 'dynamic-mark') {
      const range = DYNAMIC_MARK_RANGES[exercise.marking]
      if (exercise.velocity < range.min || exercise.velocity > range.max) {
        issues.push({
          path: `exercises.${exercise.id}.velocity`,
          message: `La velocity ${exercise.velocity} no corresponde a ${exercise.marking} (${range.min}-${range.max})`,
        })
      }
      if (!exercise.choices || exercise.choices.length < 2) {
        issues.push({
          path: `exercises.${exercise.id}.choices`,
          message: 'El ejercicio de dinámica necesita al menos dos opciones',
        })
      }
    }
    if (exercise.type === 'articulation') {
      if (!exercise.choices || exercise.choices.length < 2) {
        issues.push({
          path: `exercises.${exercise.id}.choices`,
          message: 'El ejercicio de articulación necesita al menos dos opciones',
        })
      }
      if (exercise.articulation === 'staccato' && exercise.beats > 1) {
        issues.push({
          path: `exercises.${exercise.id}.beats`,
          message: 'El staccato debería durar como máximo un pulso',
        })
      }
      if (exercise.articulation === 'legato' && exercise.beats < 1) {
        issues.push({
          path: `exercises.${exercise.id}.beats`,
          message: 'El legato debería durar al menos un pulso',
        })
      }
    }
    if (exercise.type === 'playback-order') {
      const sectionIds = new Set(exercise.sections.map((section) => section.id))
      if (sectionIds.size !== exercise.sections.length) {
        issues.push({
          path: `exercises.${exercise.id}.sections`,
          message: 'Hay secciones con ID duplicado',
        })
      }
      for (const id of exercise.answer) {
        if (!sectionIds.has(id)) {
          issues.push({
            path: `exercises.${exercise.id}.answer`,
            message: `El orden incluye una sección inexistente: ${id}`,
          })
        }
      }
      for (const section of exercise.sections) {
        const count = exercise.answer.filter((id) => id === section.id).length
        if (count === 0) {
          issues.push({
            path: `exercises.${exercise.id}.answer`,
            message: `La sección ${section.id} no aparece en el orden`,
          })
        }
        if (section.repeat && count < 2) {
          issues.push({
            path: `exercises.${exercise.id}.answer`,
            message: `La sección ${section.id} se repite y debe aparecer al menos dos veces`,
          })
        }
      }
      if (!exercise.choices || exercise.choices.length < 2) {
        issues.push({
          path: `exercises.${exercise.id}.choices`,
          message: 'El ejercicio de orden necesita al menos dos opciones',
        })
      }
    }
    if (exercise.type === 'phrase-analysis') {
      const maxMeasure = exercise.score.events.reduce(
        (max, event) => Math.max(max, event.measure),
        0,
      )
      const phrases = exercise.segments
        .filter((segment) => segment.kind === 'phrase')
        .sort((first, second) => first.startMeasure - second.startMeasure)
      const motives = exercise.segments
        .filter((segment) => segment.kind === 'motive')
        .sort((first, second) => first.startMeasure - second.startMeasure)

      if (phrases.length === 0) {
        issues.push({
          path: `exercises.${exercise.id}.segments`,
          message: 'El análisis melódico necesita al menos una frase',
        })
      }
      for (const [kind, segments] of [
        ['motive', motives],
        ['phrase', phrases],
      ] as const) {
        let previousEnd = 0
        for (const segment of segments) {
          if (
            segment.startMeasure < 1 ||
            segment.endMeasure > maxMeasure ||
            segment.startMeasure > segment.endMeasure
          ) {
            issues.push({
              path: `exercises.${exercise.id}.segments.${segment.id}`,
              message: `El segmento ${kind} sale de los compases de la partitura`,
            })
          }
          if (segment.startMeasure <= previousEnd) {
            issues.push({
              path: `exercises.${exercise.id}.segments.${segment.id}`,
              message: `Los segmentos de tipo ${kind} se solapan`,
            })
          }
          previousEnd = segment.endMeasure
        }
      }
      for (const motive of motives) {
        const containing = phrases.some(
          (phrase) =>
            motive.startMeasure >= phrase.startMeasure &&
            motive.endMeasure <= phrase.endMeasure,
        )
        if (!containing) {
          issues.push({
            path: `exercises.${exercise.id}.segments.${motive.id}`,
            message: 'Cada motivo debe quedar dentro de una frase',
          })
        }
      }
      if (exercise.ask === 'phrase-end') {
        const index = exercise.phrase ?? 1
        if (index > phrases.length) {
          issues.push({
            path: `exercises.${exercise.id}.phrase`,
            message: `La frase ${index} no existe en la segmentación`,
          })
        }
      }
      if (!exercise.choices || exercise.choices.length < 2) {
        issues.push({
          path: `exercises.${exercise.id}.choices`,
          message: 'El ejercicio de análisis melódico necesita al menos dos opciones',
        })
      }
    }
    if (exercise.type === 'form-analysis') {
      const maxMeasure = exercise.score.events.reduce(
        (max, event) => Math.max(max, event.measure),
        0,
      )
      let previousEnd = 0
      for (const section of exercise.sections) {
        if (
          section.startMeasure < 1 ||
          section.endMeasure > maxMeasure ||
          section.startMeasure > section.endMeasure
        ) {
          issues.push({
            path: `exercises.${exercise.id}.sections.${section.id}`,
            message: 'La sección formal sale de los compases de la partitura',
          })
        }
        if (section.startMeasure <= previousEnd) {
          issues.push({
            path: `exercises.${exercise.id}.sections.${section.id}`,
            message: 'Las secciones formales se solapan o no están en orden',
          })
        }
        previousEnd = section.endMeasure
      }

      const labels = exercise.sections.map((section) => section.label)
      const expected: Record<typeof exercise.form, string[]> = {
        binary: ['A', 'B'],
        ternary: ['A', 'B', 'A'],
        period: ['A', 'B'],
        rondo: ['A', 'B', 'A', 'C', 'A'],
        sonata: ['A', 'B', 'A'],
      }
      const wanted = expected[exercise.form]
      if (labels.length !== wanted.length) {
        issues.push({
          path: `exercises.${exercise.id}.sections`,
          message: `La forma ${exercise.form} necesita ${wanted.length} secciones`,
        })
      } else {
        labels.forEach((label, index) => {
          const target = wanted[index]
          const matches =
            target === 'A' ? label.startsWith('A') : label === target
          if (!matches) {
            issues.push({
              path: `exercises.${exercise.id}.sections`,
              message: `La sección ${index + 1} se llama ${label} y debería ser ${target}`,
            })
          }
        })
      }

      if (exercise.ask === 'part') {
        if (exercise.form !== 'period') {
          issues.push({
            path: `exercises.${exercise.id}.ask`,
            message: 'Solo un período tiene antecedente y consecuente',
          })
        }
        if (exercise.part === undefined) {
          issues.push({
            path: `exercises.${exercise.id}.part`,
            message: 'Falta indicar qué frase del período se pregunta',
          })
        }
      }
      if (!exercise.choices || exercise.choices.length < 2) {
        issues.push({
          path: `exercises.${exercise.id}.choices`,
          message: 'El ejercicio de forma necesita al menos dos opciones',
        })
      }
    }
    if (exercise.type === 'texture-analysis') {
      const simultaneous = new Map<string, number>()
      for (const event of exercise.score.events) {
        const key = `${event.measure}:${event.beat}`
        simultaneous.set(key, (simultaneous.get(key) ?? 0) + 1)
      }
      const overlaps = [...simultaneous.values()].filter((count) => count > 1)
      const chordal = exercise.score.events.some(
        (event) => event.pitches.length > 1,
      )

      if (exercise.texture === 'monophony') {
        if (exercise.voices !== 1) {
          issues.push({
            path: `exercises.${exercise.id}.voices`,
            message: 'La monofonía tiene una sola voz',
          })
        }
        if (chordal || overlaps.length > 0) {
          issues.push({
            path: `exercises.${exercise.id}.score`,
            message: 'La monofonía no puede tener acordes ni voces simultáneas',
          })
        }
      }
      if (exercise.texture === 'homophony') {
        if (exercise.voices !== 1) {
          issues.push({
            path: `exercises.${exercise.id}.voices`,
            message: 'La homofonía se escribe como melodía con acordes en una voz',
          })
        }
        if (!chordal) {
          issues.push({
            path: `exercises.${exercise.id}.score`,
            message: 'La homofonía necesita acordes que acompañen la melodía',
          })
        }
      }
      if (exercise.texture === 'polyphony') {
        if (exercise.voices < 2) {
          issues.push({
            path: `exercises.${exercise.id}.voices`,
            message: 'La polifonía necesita al menos dos voces',
          })
        }
        const notatedVoices = new Set(
          exercise.score.events.map((event) => event.voice),
        )
        if (notatedVoices.size < 2) {
          issues.push({
            path: `exercises.${exercise.id}.score`,
            message: 'La partitura polifónica necesita eventos en dos voces',
          })
        }
        if (overlaps.length < 2) {
          issues.push({
            path: `exercises.${exercise.id}.score`,
            message: 'La polifonía necesita voces que suenen a la vez',
          })
        }
      }
      if (!exercise.choices || exercise.choices.length < 2) {
        issues.push({
          path: `exercises.${exercise.id}.choices`,
          message: 'El ejercicio de textura necesita al menos dos opciones',
        })
      }
    }
    if (exercise.type === 'counterpoint-analysis') {
      const voices = new Set(
        exercise.score.events.map((event) => event.voice),
      )
      if (voices.size < 2) {
        issues.push({
          path: `exercises.${exercise.id}.score`,
          message: 'El contrapunto necesita al menos dos voces notadas',
        })
      }
      const groups = new Map<string, number>()
      for (const event of exercise.score.events) {
        const key = `${event.measure}:${event.beat}`
        groups.set(key, (groups.get(key) ?? 0) + 1)
      }
      const overlaps = [...groups.values()].filter((count) => count > 1)
      if (overlaps.length < 1) {
        issues.push({
          path: `exercises.${exercise.id}.score`,
          message: 'El contrapunto necesita eventos simultáneos de las dos voces',
        })
      }
      if (exercise.ask === 'parallels' && exercise.parallels === undefined) {
        issues.push({
          path: `exercises.${exercise.id}.parallels`,
          message: 'Falta indicar si hay quintas u octavas paralelas',
        })
      }
      if (!exercise.choices || exercise.choices.length < 2) {
        issues.push({
          path: `exercises.${exercise.id}.choices`,
          message: 'El ejercicio de contrapunto necesita al menos dos opciones',
        })
      }
    }
    if (exercise.type === 'ornament-execution') {
      const minimum: Record<typeof exercise.ornament, number> = {
        trill: 4,
        mordent: 3,
        turn: 4,
        appoggiatura: 2,
      }
      if (exercise.score.events.length < minimum[exercise.ornament]) {
        issues.push({
          path: `exercises.${exercise.id}.score`,
          message: `La realización del ${exercise.ornament} necesita al menos ${minimum[exercise.ornament]} notas`,
        })
      }
      if (!exercise.choices || exercise.choices.length < 2) {
        issues.push({
          path: `exercises.${exercise.id}.choices`,
          message: 'El ejercicio de ornamentos necesita al menos dos opciones',
        })
      }
    }
    if (exercise.type === 'augmented-sixth') {
      const notes = exercise.score.events.flatMap((event) => event.pitches)
      const minimum = exercise.variant === 'italian' ? 3 : 4
      if (notes.length < minimum) {
        issues.push({
          path: `exercises.${exercise.id}.score`,
          message: `La sexta aumentada ${exercise.variant} necesita al menos ${minimum} notas`,
        })
      }
      if (
        exercise.score.key !== exercise.key ||
        exercise.score.mode !== exercise.mode
      ) {
        issues.push({
          path: `exercises.${exercise.id}.score`,
          message: 'La partitura debe usar la tonalidad y el modo del ejercicio',
        })
      }
      if (!exercise.choices || exercise.choices.length < 2) {
        issues.push({
          path: `exercises.${exercise.id}.choices`,
          message: 'El ejercicio de sextas aumentadas necesita al menos dos opciones',
        })
      }
    }
    if (exercise.type === 'arpeggio') {
      if (!exercise.choices || exercise.choices.length < 2) {
        issues.push({
          path: `exercises.${exercise.id}.choices`,
          message: 'El ejercicio de arpegio necesita al menos dos opciones',
        })
      } else {
        const answer =
          exercise.ask === 'fingering'
            ? arpeggioFingeringLabel(
                exercise.tonic,
                exercise.hand,
                exercise.octaves,
              )
            : arpeggioNoteNames(
                exercise.tonic,
                exercise.hand,
                exercise.octaves,
                'es',
              )
        if (!exercise.choices.includes(answer)) {
          issues.push({
            path: `exercises.${exercise.id}.choices`,
            message: `Las opciones no incluyen la respuesta del arpegio: ${answer}`,
          })
        }
      }
    }
    if (exercise.type === 'walking-bass') {
      const answer =
        exercise.ask === 'role'
          ? (() => {
              const role = walkingRoleAt(
                exercise.score,
                exercise.measure,
                exercise.beat,
              )
              return role === null
                ? null
                : walkingRoleCandidates(role, 'es')[0]
            })()
          : walkingNoteAt(
              exercise.score,
              exercise.measure,
              exercise.beat,
              'es',
            )
      if (answer === null || answer === '') {
        issues.push({
          path: `exercises.${exercise.id}`,
          message:
            exercise.ask === 'role'
              ? `No se puede clasificar la nota del compás ${exercise.measure}, pulso ${exercise.beat + 1}`
              : `No hay una nota en el compás ${exercise.measure}, pulso ${exercise.beat + 1}`,
        })
      } else if (!exercise.choices || !exercise.choices.includes(answer)) {
        issues.push({
          path: `exercises.${exercise.id}.choices`,
          message: `Las opciones no incluyen la respuesta del walking bass: ${answer}`,
        })
      }
    }
    if (exercise.type === 'stride') {
      const answer =
        exercise.ask === 'bass'
          ? strideBassNoteAt(
              exercise.score,
              exercise.measure,
              exercise.beat,
              'es',
            )
          : stridePatternInMeasure(exercise.score, exercise.measure)
            ? stridePatternCandidates('es')[0]
            : null
      if (answer === null || answer === '') {
        issues.push({
          path: `exercises.${exercise.id}`,
          message:
            exercise.ask === 'bass'
              ? `No hay una nota de bajo en el compás ${exercise.measure}, pulso ${exercise.beat + 1}`
              : `No se reconoce un patrón de stride en el compás ${exercise.measure}`,
        })
      } else if (!exercise.choices || !exercise.choices.includes(answer)) {
        issues.push({
          path: `exercises.${exercise.id}.choices`,
          message: `Las opciones no incluyen la respuesta del stride: ${answer}`,
        })
      }
    }
    if (exercise.type === 'sight-reading') {
      const total = sightReadingNotes(exercise.score).length
      const to = exercise.to ?? exercise.from + 1
      const answer =
        exercise.ask === 'interval'
          ? sightReadingIntervalName(exercise.score, exercise.from, to, 'es')
          : exercise.ask === 'note'
            ? sightReadingNoteName(exercise.score, to, 'es')
            : sightReadingMotionLabel(exercise.score, exercise.from, to, 'es')
      if (total === 0) {
        issues.push({
          path: `exercises.${exercise.id}.score`,
          message: 'El fragmento de lectura no tiene notas',
        })
      } else if (
        exercise.from < 0 ||
        exercise.from >= total ||
        to < 0 ||
        to >= total ||
        to === exercise.from
      ) {
        issues.push({
          path: `exercises.${exercise.id}.from`,
          message: `Índices de lectura fuera del fragmento: ${exercise.from} → ${to}`,
        })
      } else if (answer === null || answer === '') {
        issues.push({
          path: `exercises.${exercise.id}`,
          message: `No se pudo resolver la lectura entre las notas ${exercise.from + 1} y ${to + 1}`,
        })
      } else if (!exercise.choices || !exercise.choices.includes(answer)) {
        issues.push({
          path: `exercises.${exercise.id}.choices`,
          message: `Las opciones no incluyen la respuesta de lectura: ${answer}`,
        })
      }
    }
    if (exercise.type === 'ear-melody') {
      const total = sightReadingNotes(exercise.score).length
      const to = exercise.to ?? exercise.from + 1
      const answer =
        exercise.ask === 'interval'
          ? sightReadingIntervalName(exercise.score, exercise.from, to, 'es')
          : exercise.ask === 'note'
            ? sightReadingNoteName(exercise.score, to, 'es')
            : sightReadingMotionLabel(exercise.score, exercise.from, to, 'es')
      if (total === 0) {
        issues.push({
          path: `exercises.${exercise.id}.score`,
          message: 'La melodía oculta no tiene notas',
        })
      } else if (
        exercise.from < 0 ||
        exercise.from >= total ||
        to < 0 ||
        to >= total ||
        to === exercise.from
      ) {
        issues.push({
          path: `exercises.${exercise.id}.from`,
          message: `Índices de escucha fuera de la melodía: ${exercise.from} → ${to}`,
        })
      } else if (answer === null || answer === '') {
        issues.push({
          path: `exercises.${exercise.id}`,
          message: `No se pudo resolver la escucha entre las notas ${exercise.from + 1} y ${to + 1}`,
        })
      } else if (!exercise.choices || !exercise.choices.includes(answer)) {
        issues.push({
          path: `exercises.${exercise.id}.choices`,
          message: `Las opciones no incluyen la respuesta de la melodía: ${answer}`,
        })
      }
    }
    if (exercise.type === 'transposition' && exercise.answer !== undefined) {
      const answer = exercise.answer
        .map((pitch) => formatPitch(fromSpelledPitch(pitch)))
        .join(' ')
      if (exercise.choices !== undefined && !exercise.choices.includes(answer)) {
        issues.push({
          path: `exercises.${exercise.id}.choices`,
          message: `Las opciones no incluyen la melodía transportada: ${answer}`,
        })
      }
    }
    if (exercise.type === 'alberti') {
      const answer =
        exercise.ask === 'notes'
          ? albertiNoteNames(exercise.score, exercise.measure, 'es')
          : albertiPatternInMeasure(exercise.score, exercise.measure)
            ? albertiPatternCandidates('es')[0]
            : null
      if (answer === null || answer === '') {
        issues.push({
          path: `exercises.${exercise.id}`,
          message:
            exercise.ask === 'notes'
              ? `El compás ${exercise.measure} no tiene la célula de Alberti`
              : `No se reconoce un bajo de Alberti en el compás ${exercise.measure}`,
        })
      } else if (!exercise.choices || !exercise.choices.includes(answer)) {
        issues.push({
          path: `exercises.${exercise.id}.choices`,
          message: `Las opciones no incluyen la respuesta de Alberti: ${answer}`,
        })
      }
    }
    if (exercise.type === 'arpeggiated') {
      const answer =
        exercise.ask === 'notes'
          ? arpeggiatedNoteNames(exercise.score, exercise.measure, 'es')
          : (() => {
              const pattern = arpeggiatedPatternInMeasure(
                exercise.score,
                exercise.measure,
              )
              return pattern === null
                ? null
                : arpeggiatedPatternCandidates(pattern, 'es')[0]
            })()
      if (answer === null || answer === '') {
        issues.push({
          path: `exercises.${exercise.id}`,
          message:
            exercise.ask === 'notes'
              ? `El compás ${exercise.measure} no tiene notas de acompañamiento`
              : `No se reconoce un patrón arpegiado en el compás ${exercise.measure}`,
        })
      } else if (!exercise.choices || !exercise.choices.includes(answer)) {
        issues.push({
          path: `exercises.${exercise.id}.choices`,
          message: `Las opciones no incluyen la respuesta arpegiada: ${answer}`,
        })
      }
    }
    if (exercise.type === 'accompaniment') {
      if (
        exercise.ask === 'melody' &&
        exercise.beat >= exercise.score.timeSignature.numerator
      ) {
        issues.push({
          path: `exercises.${exercise.id}.beat`,
          message: `El pulso ${exercise.beat + 1} supera el compás ${exercise.score.timeSignature.numerator}/${exercise.score.timeSignature.denominator}`,
        })
      }

      let answer: string | null
      let missingMessage: string
      if (exercise.ask === 'melody') {
        answer = leadSheetMelodyNoteName(
          exercise.score,
          exercise.measure,
          exercise.beat,
          'es',
        )
        missingMessage = `No hay una nota de melodía en el compás ${exercise.measure}, pulso ${exercise.beat + 1}`
      } else if (exercise.ask === 'voicing') {
        const symbol = chordSymbolInMeasure(exercise.score, exercise.measure)
        if (symbol === null) {
          answer = null
          missingMessage = `No hay un cifrado único en el compás ${exercise.measure}`
        } else {
          try {
            answer = shellVoicingLabel(symbol, 'es')
          } catch {
            answer = null
          }
          missingMessage = `No se pudo construir el shell voicing de ${symbol}`
        }
      } else if (exercise.ask === 'symbol') {
        answer = chordSymbolInMeasure(exercise.score, exercise.measure)
        missingMessage = `No hay un cifrado único en el compás ${exercise.measure}`
      } else {
        const pattern = accompanimentPatternInMeasure(
          exercise.score,
          exercise.measure,
        )
        answer =
          pattern === null
            ? null
            : accompanimentPatternCandidates(pattern, 'es')[0]
        missingMessage = `No se reconoce un patrón de acompañamiento en el compás ${exercise.measure}`
      }

      if (answer === null) {
        issues.push({
          path: `exercises.${exercise.id}`,
          message: missingMessage,
        })
      } else if (!exercise.choices || !exercise.choices.includes(answer)) {
        issues.push({
          path: `exercises.${exercise.id}.choices`,
          message: `Las opciones no incluyen la respuesta de acompañamiento: ${answer}`,
        })
      }
    }
    if (exercise.type === 'style-pattern') {
      let answer: string | null
      let missingMessage: string
      if (exercise.ask === 'chord') {
        answer = chordSymbolInMeasure(exercise.score, exercise.measure)
        missingMessage = `No hay un cifrado único en el compás ${exercise.measure}`
      } else if (exercise.ask === 'scale') {
        const scale = styleScaleName(exercise.score)
        answer =
          scale === null
            ? null
            : styleScaleCandidates(scale, 'es')[0] ?? null
        missingMessage = 'No se reconoce la escala del fragmento'
      } else if (exercise.ask === 'progression') {
        const degrees = styleProgressionDegrees(exercise.score)
        answer =
          degrees === null ? null : styleProgressionCandidates(degrees)[0] ?? null
        missingMessage = 'No se pueden leer los grados de la progresión'
      } else if (exercise.ask === 'voicing') {
        answer =
          styleVoicingCandidates(exercise.score, exercise.measure, 'es')?.[0] ??
          null
        missingMessage = `No hay un voicing reconocible en el compás ${exercise.measure}`
      } else {
        const pattern = stylePatternInMeasure(exercise.score, exercise.measure)
        answer =
          pattern === null ? null : stylePatternCandidates(pattern, 'es')[0] ?? null
        missingMessage = `No se reconoce un patrón de estilo en el compás ${exercise.measure}`
      }
      if (answer === null) {
        issues.push({
          path: `exercises.${exercise.id}`,
          message: missingMessage,
        })
      } else if (!exercise.choices || !exercise.choices.includes(answer)) {
        issues.push({
          path: `exercises.${exercise.id}.choices`,
          message: `Las opciones no incluyen la respuesta del estilo: ${answer}`,
        })
      }
    }
    if (exercise.type === 'pedal') {
      if (exercise.score.pedals.length === 0) {
        issues.push({
          path: `exercises.${exercise.id}.score.pedals`,
          message: 'El ejercicio de pedal necesita al menos una marca de pedal',
        })
      }
      const answer =
        exercise.ask === 'pattern'
          ? (() => {
              const pattern = pedalPatternInMeasure(
                exercise.score,
                exercise.measure,
              )
              return pattern === null
                ? null
                : pedalPatternCandidates(pattern, 'es')[0]
            })()
          : (() => {
              const action = pedalActionAt(
                exercise.score,
                exercise.measure,
                exercise.beat,
              )
              return action === null
                ? null
                : pedalActionCandidates(action, 'es')[0]
            })()
      if (answer === null) {
        issues.push({
          path: `exercises.${exercise.id}`,
          message:
            exercise.ask === 'pattern'
              ? `No hay una pisada de pedal en el compás ${exercise.measure}`
              : `No hay marca de pedal en el compás ${exercise.measure}, pulso ${exercise.beat}`,
        })
      } else if (!exercise.choices || !exercise.choices.includes(answer)) {
        issues.push({
          path: `exercises.${exercise.id}.choices`,
          message: `Las opciones no incluyen la respuesta del pedal: ${answer}`,
        })
      }
    }
    if (exercise.type === 'hand-coordination') {
      if (exercise.beat > exercise.score.timeSignature.numerator) {
        issues.push({
          path: `exercises.${exercise.id}.beat`,
          message: `El pulso ${exercise.beat} supera el compás ${exercise.score.timeSignature.numerator}/${exercise.score.timeSignature.denominator}`,
        })
      }
      const hand = attackingHandAt(
        exercise.score,
        exercise.measure,
        exercise.beat,
      )
      if (hand === null) {
        issues.push({
          path: `exercises.${exercise.id}.measure`,
          message: `No hay ataque en el compás ${exercise.measure}, pulso ${exercise.beat}`,
        })
      } else if (exercise.choices !== undefined) {
        const label = HAND_LABELS[hand].es
        if (!exercise.choices.includes(label)) {
          issues.push({
            path: `exercises.${exercise.id}.choices`,
            message: `Las opciones no incluyen la mano correcta: ${label}`,
          })
        }
      }
      if (!exercise.choices || exercise.choices.length < 2) {
        issues.push({
          path: `exercises.${exercise.id}.choices`,
          message: 'El ejercicio de coordinación necesita al menos dos opciones',
        })
      }
    }
    if (exercise.type === 'italian-term') {
      if (ITALIAN_TERM_CATEGORIES[exercise.term] !== exercise.category) {
        issues.push({
          path: `exercises.${exercise.id}.category`,
          message: `La categoría ${exercise.category} no corresponde a ${exercise.term}`,
        })
      }
      if (!exercise.choices || exercise.choices.length < 2) {
        issues.push({
          path: `exercises.${exercise.id}.choices`,
          message: 'El ejercicio de términos necesita al menos dos opciones',
        })
      } else if (!exercise.choices.includes(exercise.meaningEs)) {
        issues.push({
          path: `exercises.${exercise.id}.choices`,
          message: `Falta la respuesta correcta en las opciones: ${exercise.meaningEs}`,
        })
      }
    }
  }

  for (const skill of bundle.skills) {
    for (const lessonId of skill.lessonIds) {
      if (!lessonIds.has(lessonId)) {
        issues.push({
          path: `skills.${skill.id}.lessonIds`,
          message: `Lección inexistente: ${lessonId}`,
        })
      }
    }
  }

  for (const exerciseId of exerciseIds) {
    if (!referencedExercises.has(exerciseId)) {
      issues.push({
        path: `exercises.${exerciseId}`,
        message: 'Ejercicio no referenciado por ninguna lección',
      })
    }
  }

  for (const piece of bundle.repertoire) {
    if (piece.license.transcriptionAuthor.trim().length === 0) {
      issues.push({
        path: `repertoire.${piece.id}.license.transcriptionAuthor`,
        message: 'Falta el autor de la transcripción',
      })
    }
  }

  return {
    ok: issues.length === 0,
    issues,
    warnings,
    bundle,
    stats: {
      modules: bundle.modules.length,
      lessons: bundle.lessons.length,
      exercises: bundle.exercises.length,
      skills: bundle.skills.length,
      repertoire: bundle.repertoire.length,
    },
  }
}
