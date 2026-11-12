import type { ModuleId } from '../schemas'

export interface DiagnosticOption {
  id: string
  labelEs: string
  points: number
}

export interface DiagnosticItem {
  id: string
  questionEs: string
  options: DiagnosticOption[]
}

export interface DiagnosticBand {
  min: number
  max: number
  moduleId: ModuleId
  labelEs: string
}

export interface DiagnosticResult {
  total: number
  max: number
  answered: number
  complete: boolean
  suggestedModuleId: ModuleId
  summaryEs: string
  /** El diagnóstico orienta, nunca bloquea el acceso al curso. */
  blocking: false
}

const OPTIONS: DiagnosticOption[] = [
  { id: 'no', labelEs: 'Todavía no', points: 0 },
  { id: 'with-help', labelEs: 'Con ayuda o dudas', points: 1 },
  { id: 'yes', labelEs: 'Sí, sin dudar', points: 2 },
]

export const DIAGNOSTIC_ITEMS: readonly DiagnosticItem[] = [
  {
    id: 'diag.keyboard-groups',
    questionEs: '¿Reconocés los grupos de dos y tres teclas negras y encontrás el Do?',
    options: OPTIONS,
  },
  {
    id: 'diag.note-octaves',
    questionEs: '¿Nombrás notas con su octava (Do4, C4, La3) sin dudar?',
    options: OPTIONS,
  },
  {
    id: 'diag.staff',
    questionEs: '¿Leés notas en clave de sol y de fa?',
    options: OPTIONS,
  },
  {
    id: 'diag.pulse',
    questionEs: '¿Mantenés un pulso estable con el metrónomo?',
    options: OPTIONS,
  },
  {
    id: 'diag.intervals',
    questionEs: '¿Reconocés intervalos por cantidad y calidad?',
    options: OPTIONS,
  },
  {
    id: 'diag.scales',
    questionEs: '¿Construís escalas mayores y menores en varias tonalidades?',
    options: OPTIONS,
  },
  {
    id: 'diag.chords',
    questionEs: '¿Identificás tríadas y séptimas básicas?',
    options: OPTIONS,
  },
  {
    id: 'diag.practice',
    questionEs: '¿Practicás con metas medibles y registrás lo que hacés?',
    options: OPTIONS,
  },
]

export const DIAGNOSTIC_MAX = DIAGNOSTIC_ITEMS.reduce(
  (total, item) => total + Math.max(...item.options.map((option) => option.points)),
  0,
)

export const DIAGNOSTIC_BANDS: readonly DiagnosticBand[] = [
  {
    min: 0,
    max: 4,
    moduleId: 'M0',
    labelEs: 'Empezá por M0 (Orientación) y seguí el recorrido completo.',
  },
  {
    min: 5,
    max: 8,
    moduleId: 'M1',
    labelEs: 'Podés empezar en M1 (Fundamentos); repasá M0 si algo no está firme.',
  },
  {
    min: 9,
    max: 12,
    moduleId: 'M2',
    labelEs: 'Probá M2 (Escalas y tonalidades) y usá M1 como referencia.',
  },
  {
    min: 13,
    max: DIAGNOSTIC_MAX,
    moduleId: 'M3',
    labelEs: 'Podés empezar en M3 (Intervalos) o M4 (Acordes); el mapa no bloquea.',
  },
]

function bandFor(total: number): DiagnosticBand {
  return (
    DIAGNOSTIC_BANDS.find((band) => total >= band.min && total <= band.max) ??
    DIAGNOSTIC_BANDS[DIAGNOSTIC_BANDS.length - 1]
  )
}

/**
 * Calcula el resultado del diagnóstico inicial. Acepta respuestas parciales:
 * las preguntas sin responder suman 0 y el resultado se marca como incompleto.
 * Una opción inválida sí es un error de programación y lanza.
 */
export function scoreDiagnostic(
  answers: Record<string, string | undefined>,
): DiagnosticResult {
  let total = 0
  let answered = 0

  for (const item of DIAGNOSTIC_ITEMS) {
    const optionId = answers[item.id]
    if (optionId === undefined || optionId === '') continue

    const option = item.options.find((candidate) => candidate.id === optionId)
    if (!option) {
      throw new Error(`Opción inválida para ${item.id}: ${optionId}`)
    }

    total += option.points
    answered += 1
  }

  const complete = answered === DIAGNOSTIC_ITEMS.length
  const band = bandFor(total)
  const partial = complete
    ? ''
    : ` Resultado parcial (${answered}/${DIAGNOSTIC_ITEMS.length}); respondé las 8 para orientarte mejor.`

  return {
    total,
    max: DIAGNOSTIC_MAX,
    answered,
    complete,
    suggestedModuleId: band.moduleId,
    summaryEs: `${band.labelEs}${partial}`,
    blocking: false,
  }
}
