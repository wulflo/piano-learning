import { z } from 'zod'
import {
  ChordQualitySchema,
  ClefSchema,
  KeySchema,
  RhythmCellSchema,
  ScaleModeSchema,
  ScoreSchema,
  SpelledPitchSchema,
  TimeSignatureSchema,
} from './notation'
import { IdSchema } from './primitives'
import { RepertoirePieceSchema } from './repertoire'
import { SkillItemSchema } from './skill'

export const MODULE_IDS = [
  'M0',
  'M1',
  'M2',
  'M3',
  'M4',
  'M5',
  'M6',
  'M7',
  'M8',
] as const
export const ModuleIdSchema = z.enum(MODULE_IDS)
export type ModuleId = z.infer<typeof ModuleIdSchema>

export const ModuleSchema = z.object({
  id: ModuleIdSchema,
  order: z.number().int().min(0).max(8),
  titleEs: z.string().min(1),
  titleEn: z.string().min(1),
  summaryEs: z.string().min(1),
  summaryEn: z.string().min(1),
  optional: z.boolean().default(false),
})
export type ContentModule = z.infer<typeof ModuleSchema>

export const LessonSectionSchema = z
  .object({
    id: IdSchema,
    kind: z.enum(['text', 'keyboard', 'score', 'audio', 'callout', 'exercise']),
    titleEs: z.string().min(1),
    titleEn: z.string().min(1).optional(),
    bodyEs: z.string().min(1).optional(),
    bodyEn: z.string().min(1).optional(),
    score: ScoreSchema.optional(),
    keys: z.array(SpelledPitchSchema).default([]),
  })
  .superRefine((section, ctx) => {
    if (!section.bodyEs && !section.score && section.keys.length === 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'La sección necesita bodyEs, score o keys',
        path: ['bodyEs'],
      })
    }
  })
export type LessonSection = z.infer<typeof LessonSectionSchema>

export const KeyboardTaskSchema = z.object({
  titleEs: z.string().min(1),
  titleEn: z.string().min(1).optional(),
  instructionsEs: z.string().min(1),
  instructionsEn: z.string().min(1).optional(),
  keys: z.array(SpelledPitchSchema).min(1),
  fingeringEs: z.string().optional(),
  fingeringEn: z.string().optional(),
  tempoBpm: z.number().int().min(30).max(240).default(60),
  checklistEs: z.array(z.string().min(1)).min(3),
  checklistEn: z.array(z.string().min(1)).min(3).optional(),
  demoScore: ScoreSchema.optional(),
})
export type KeyboardTask = z.infer<typeof KeyboardTaskSchema>

export const ITALIAN_TERM_VALUES = [
  'adagio',
  'allegro',
  'andante',
  'moderato',
  'presto',
  'ritardando',
  'accelerando',
  'rubato',
  'crescendo',
  'diminuendo',
  'pianissimo',
  'fortissimo',
  'legato',
  'staccato',
  'accentato',
  'tenuto',
  'dolce',
  'cantabile',
  'espressivo',
  'maestoso',
] as const
export const ItalianTermSchema = z.enum(ITALIAN_TERM_VALUES)
export type ItalianTerm = z.infer<typeof ItalianTermSchema>

export const TERM_CATEGORY_VALUES = [
  'tempo',
  'dynamics',
  'articulation',
  'character',
] as const
export const TermCategorySchema = z.enum(TERM_CATEGORY_VALUES)
export type TermCategory = z.infer<typeof TermCategorySchema>

export const ORNAMENT_VALUES = ['trill', 'mordent', 'turn', 'appoggiatura'] as const
export const OrnamentSchema = z.enum(ORNAMENT_VALUES)
export type Ornament = z.infer<typeof OrnamentSchema>

export const AUGMENTED_SIXTH_VARIANTS = [
  'italian',
  'french',
  'german',
] as const
export const AugmentedSixthVariantSchema = z.enum(AUGMENTED_SIXTH_VARIANTS)
export type AugmentedSixthVariant = z.infer<typeof AugmentedSixthVariantSchema>

export const ITALIAN_TERM_CATEGORIES: Record<ItalianTerm, TermCategory> = {
  adagio: 'tempo',
  allegro: 'tempo',
  andante: 'tempo',
  moderato: 'tempo',
  presto: 'tempo',
  ritardando: 'tempo',
  accelerando: 'tempo',
  rubato: 'tempo',
  crescendo: 'dynamics',
  diminuendo: 'dynamics',
  pianissimo: 'dynamics',
  fortissimo: 'dynamics',
  legato: 'articulation',
  staccato: 'articulation',
  accentato: 'articulation',
  tenuto: 'articulation',
  dolce: 'character',
  cantabile: 'character',
  espressivo: 'character',
  maestoso: 'character',
}

export const GlossaryEntrySchema = z.object({
  term: ItalianTermSchema,
  category: TermCategorySchema,
  meaningEs: z.string().min(1),
  meaningEn: z.string().min(1).optional(),
  exampleEs: z.string().min(1),
  exampleEn: z.string().min(1).optional(),
})
export type GlossaryEntry = z.infer<typeof GlossaryEntrySchema>

export const LessonSchema = z.object({
  id: IdSchema,
  moduleId: ModuleIdSchema,
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'El slug debe usar minúsculas y guiones',
  }),
  titleEs: z.string().min(1),
  titleEn: z.string().min(1).optional(),
  summaryEs: z.string().min(1),
  summaryEn: z.string().min(1).optional(),
  objectivesEs: z.array(z.string().min(1)).min(1),
  objectivesEn: z.array(z.string().min(1)).min(1).optional(),
  minutes: z.number().int().min(3).max(20),
  /** Lección de ampliación: se puede hacer, pero no bloquea la ruta. */
  optional: z.boolean().optional(),
  prerequisites: z.array(IdSchema).default([]),
  skillIds: z.array(IdSchema).default([]),
  exerciseIds: z.array(IdSchema).default([]),
  sections: z.array(LessonSectionSchema).min(1),
  glossary: z.array(GlossaryEntrySchema).default([]),
  keyboardTask: KeyboardTaskSchema.optional(),
  contentLicense: z.enum(['cc-by-sa-4.0', 'cc0-1.0']).default('cc-by-sa-4.0'),
  status: z.enum(['draft', 'published']).default('draft'),
})
export type Lesson = z.infer<typeof LessonSchema>

/** Porción de una melodía que el ejercicio etiqueta como motivo o frase. */
export const PHRASE_SEGMENT_KINDS = ['motive', 'phrase'] as const
export const PhraseSegmentSchema = z.object({
  id: IdSchema,
  kind: z.enum(PHRASE_SEGMENT_KINDS),
  /** Compás donde empieza el segmento (inclusive). */
  startMeasure: z.number().int().min(1),
  /** Compás donde termina el segmento (inclusive). */
  endMeasure: z.number().int().min(1),
})
export type PhraseSegment = z.infer<typeof PhraseSegmentSchema>

/** Sección formal (A, B, A') con sus compases. */
export const FormSectionSchema = z.object({
  id: IdSchema,
  /** Etiqueta de la sección: A, B, A', etc. */
  label: z.string().min(1).max(4),
  startMeasure: z.number().int().min(1),
  endMeasure: z.number().int().min(1),
})
export type FormSection = z.infer<typeof FormSectionSchema>

const exerciseBase = {
  id: IdSchema,
  skillId: IdSchema,
  promptEs: z.string().min(1),
  promptEn: z.string().min(1).optional(),
  explanationEs: z.string().min(1),
  explanationEn: z.string().min(1).optional(),
  difficulty: z.number().int().min(1).max(5),
  /** Ejercicio de ampliación: no es obligatorio para completar la lección. */
  optional: z.boolean().optional(),
  choicesEn: z.array(z.string().min(1)).min(2).max(8).optional(),
}

const choiceOptionsSchema = z
  .array(z.string().min(1))
  .min(2)
  .max(8)
  .optional()

export const TIMBRE_VALUES = ['piano', 'flute', 'organ', 'strings'] as const
export const TimbreSchema = z.enum(TIMBRE_VALUES)
export type Timbre = z.infer<typeof TimbreSchema>

export const DYNAMIC_MARK_VALUES = ['pp', 'p', 'mp', 'mf', 'f', 'ff'] as const
export const DynamicMarkSchema = z.enum(DYNAMIC_MARK_VALUES)
export type DynamicMark = z.infer<typeof DynamicMarkSchema>

/** Rangos de velocity orientativos para cada marca dinámica. */
export const DYNAMIC_MARK_RANGES: Record<DynamicMark, { min: number; max: number }> = {
  pp: { min: 1, max: 39 },
  p: { min: 40, max: 54 },
  mp: { min: 55, max: 69 },
  mf: { min: 70, max: 84 },
  f: { min: 85, max: 104 },
  ff: { min: 105, max: 127 },
}

export const ARTICULATION_VALUES = ['legato', 'staccato', 'accent'] as const
export const ArticulationSchema = z.enum(ARTICULATION_VALUES)
export type Articulation = z.infer<typeof ArticulationSchema>

export const PlaybackSectionSchema = z.object({
  id: IdSchema,
  label: z.string().min(1),
  repeat: z.boolean().default(false),
})
export type PlaybackSection = z.infer<typeof PlaybackSectionSchema>

export const TEMPO_MARK_VALUES = [
  'grave',
  'largo',
  'lento',
  'adagio',
  'andante',
  'moderato',
  'allegretto',
  'allegro',
  'vivace',
  'presto',
  'prestissimo',
] as const
export const TempoMarkSchema = z.enum(TEMPO_MARK_VALUES)
export type TempoMark = z.infer<typeof TempoMarkSchema>

/** Rangos convencionales de BPM para cada término de tempo. */
export const TEMPO_MARK_RANGES: Record<TempoMark, { min: number; max: number }> = {
  grave: { min: 40, max: 44 },
  largo: { min: 45, max: 50 },
  lento: { min: 51, max: 55 },
  adagio: { min: 56, max: 65 },
  andante: { min: 66, max: 75 },
  moderato: { min: 76, max: 107 },
  allegretto: { min: 108, max: 119 },
  allegro: { min: 120, max: 155 },
  vivace: { min: 156, max: 175 },
  presto: { min: 176, max: 199 },
  prestissimo: { min: 200, max: 240 },
}

/** Ejemplo sonoro mínimo para comparar dos versiones de un mismo material. */
export const SoundExampleSchema = z.object({
  midi: z.number().int().min(21).max(108),
  beats: z.number().positive().max(8).default(1),
  velocity: z.number().int().min(1).max(127).default(80),
  timbre: TimbreSchema.default('piano'),
})
export type SoundExample = z.infer<typeof SoundExampleSchema>

export const ExerciseSchema = z.discriminatedUnion('type', [
  z.object({
    ...exerciseBase,
    type: z.literal('note-keyboard'),
    target: SpelledPitchSchema,
    choices: choiceOptionsSchema,
  }),
  z.object({
    ...exerciseBase,
    type: z.literal('note-staff'),
    target: SpelledPitchSchema,
    clef: z.enum(['treble', 'bass']).default('treble'),
    choices: choiceOptionsSchema,
  }),
  z.object({
    ...exerciseBase,
    type: z.literal('scale-spelling'),
    tonic: KeySchema,
    mode: ScaleModeSchema,
    /** Respuesta canónica sin octavas, por ejemplo «C D E F G A B C». */
    answer: z.string().min(1).optional(),
    answerEn: z.string().min(1).optional(),
    choices: choiceOptionsSchema,
  }),
  z.object({
    ...exerciseBase,
    type: z.literal('key-signature'),
    key: KeySchema,
    mode: z.enum(['major', 'minor']).default('major'),
    /** Sentido de la pregunta: tonalidad → armadura, armadura → tonalidad o vecinos del círculo. */
    direction: z
      .enum(['key-to-signature', 'signature-to-key', 'fifth-up', 'fifth-down'])
      .default('key-to-signature'),
    /** Respuesta canónica, por ejemplo «3 sostenidos (F# C# G#)» o «Re mayor». */
    answer: z.string().min(1).optional(),
    answerEn: z.string().min(1).optional(),
    choices: choiceOptionsSchema,
  }),
  z.object({
    ...exerciseBase,
    type: z.literal('interval'),
    lower: SpelledPitchSchema,
    upper: SpelledPitchSchema,
    direction: z.enum(['melodic', 'harmonic']).default('melodic'),
    /** Fragmento melódico o acorde donde viven las dos notas del intervalo. */
    fragment: ScoreSchema.optional(),
    /** Respuesta canónica alternativa, por ejemplo una clasificación de consonancia. */
    answer: z.string().min(1).optional(),
    answerEn: z.string().min(1).optional(),
    choices: choiceOptionsSchema,
  }),
  z.object({
    ...exerciseBase,
    type: z.literal('chord'),
    root: SpelledPitchSchema,
    quality: ChordQualitySchema,
    inversion: z.number().int().min(0).max(3).default(0),
    /** Bajo indicado con barra, por ejemplo Mi en Do/Mi. */
    slash: SpelledPitchSchema.optional(),
    /** Qué aspecto del acorde se pregunta: su calidad, su inversión, sus notas o su cifrado. */
    ask: z.enum(['quality', 'inversion', 'notes', 'symbol']).default('quality'),
    choices: choiceOptionsSchema,
  }),
  z.object({
    ...exerciseBase,
    type: z.literal('chord-notation'),
    /** Cifrado original, por ejemplo «Do7/Solm» o «C7/Gm». */
    symbol: z.string().min(1),
    /** Notación a la que hay que traducir el cifrado. */
    to: z.enum(['do', 'c']),
    choices: choiceOptionsSchema,
  }),
  z.object({
    ...exerciseBase,
    type: z.literal('roman-numeral'),
    key: KeySchema,
    mode: z.enum(['major', 'minor']).default('major'),
    numeral: z
      .string()
      .regex(/^[b#]?[ivIV]+(?:°|o|\+)?$/, {
        message: 'Número romano inválido',
      }),
    choices: choiceOptionsSchema,
  }),
  z.object({
    ...exerciseBase,
    type: z.literal('harmonic-function'),
    key: KeySchema,
    mode: z.enum(['major', 'minor']).default('major'),
    /** Grado del acorde dentro de la tonalidad. */
    degree: z.number().int().min(1).max(7),
    choices: choiceOptionsSchema,
  }),
  z.object({
    ...exerciseBase,
    type: z.literal('secondary-dominant'),
    key: KeySchema,
    mode: z.enum(['major', 'minor']).default('major'),
    /** Grado que toniciza el dominante secundario, por ejemplo V o ii. */
    target: z.number().int().min(1).max(7),
    /** Si se pregunta el cifrado V/x o el grado al que resuelve. */
    ask: z.enum(['numeral', 'resolution']).default('numeral'),
    choices: choiceOptionsSchema,
  }),
  z.object({
    ...exerciseBase,
    type: z.literal('pivot-chord'),
    fromKey: KeySchema,
    toKey: KeySchema,
    /** Grado que ocupa el acorde pivote en la tonalidad de origen. */
    degreeFrom: z.number().int().min(1).max(7),
    /** Grado que ocupa el mismo acorde en la tonalidad de destino. */
    degreeTo: z.number().int().min(1).max(7),
    /** Si se pregunta el cifrado en la tonalidad de origen o en la de destino. */
    ask: z.enum(['source', 'target']).default('source'),
    choices: choiceOptionsSchema,
  }),
  z.object({
    ...exerciseBase,
    type: z.literal('phrase-analysis'),
    score: ScoreSchema,
    /** Motivos y frases que segmentan la melodía. */
    segments: z.array(PhraseSegmentSchema).min(2),
    ask: z
      .enum(['motive-count', 'phrase-count', 'phrase-end'])
      .default('motive-count'),
    /** Frase (1-based) cuyo final se pregunta en `phrase-end`. */
    phrase: z.number().int().min(1).max(8).optional(),
    choices: choiceOptionsSchema,
  }),
  z.object({
    ...exerciseBase,
    type: z.literal('form-analysis'),
    score: ScoreSchema,
    /** Secciones formales con sus compases, en orden. */
    sections: z.array(FormSectionSchema).min(2),
    /** Forma global que organiza la melodía. */
    form: z.enum(['binary', 'ternary', 'period', 'rondo', 'sonata']),
    /** Si se pregunta la forma global o la función de una frase del período. */
    ask: z.enum(['form', 'part']).default('form'),
    /** Frase (1-based) cuya función se pregunta en `part`. */
    part: z.number().int().min(1).max(2).optional(),
    choices: choiceOptionsSchema,
  }),
  z.object({
    ...exerciseBase,
    type: z.literal('texture-analysis'),
    score: ScoreSchema,
    /** Textura de la partitura: una línea, acordes o voces independientes. */
    texture: z.enum(['monophony', 'homophony', 'polyphony']),
    /** Cantidad de voces simultáneas que declara el ejercicio. */
    voices: z.number().int().min(1).max(3).default(1),
    choices: choiceOptionsSchema,
  }),
  z.object({
    ...exerciseBase,
    type: z.literal('counterpoint-analysis'),
    score: ScoreSchema,
    /** Si se pregunta el movimiento de las voces o una regla de contrapunto. */
    ask: z.enum(['motion', 'parallels']).default('motion'),
    /** Movimiento entre las dos voces. */
    motion: z.enum(['parallel', 'similar', 'contrary', 'oblique']),
    /** Resultado de la regla de quintas y octavas paralelas. */
    parallels: z.enum(['none', 'fifths', 'octaves']).optional(),
    choices: choiceOptionsSchema,
  }),
  z.object({
    ...exerciseBase,
    type: z.literal('ornament-execution'),
    /** Realización escrita del adorno, nota por nota. */
    score: ScoreSchema,
    /** Adorno que corresponde a esa realización. */
    ornament: OrnamentSchema,
    choices: choiceOptionsSchema,
  }),
  z.object({
    ...exerciseBase,
    type: z.literal('borrowed-chord'),
    key: KeySchema,
    mode: z.enum(['major', 'minor']).default('major'),
    /** Número romano del acorde prestado del modo paralelo. */
    numeral: z
      .string()
      .regex(/^[b#]?[ivIV]+(?:°|o|\+)?$/, {
        message: 'Número romano inválido',
      }),
    choices: choiceOptionsSchema,
  }),
  z.object({
    ...exerciseBase,
    type: z.literal('augmented-sixth'),
    key: KeySchema,
    mode: z.enum(['major', 'minor']).default('minor'),
    /** Variante del acorde de sexta aumentada. */
    variant: AugmentedSixthVariantSchema,
    /** Reconocer la variante o su grado de resolución. */
    ask: z.enum(['identify', 'resolve']).default('identify'),
    /** Acorde escrito para dibujar y escuchar. */
    score: ScoreSchema,
    choices: choiceOptionsSchema,
  }),
  z.object({
    ...exerciseBase,
    type: z.literal('cadence'),
    key: KeySchema,
    mode: z.enum(['major', 'minor']).default('major'),
    /** Grados de los dos acordes que forman la cadencia. */
    fromDegree: z.number().int().min(1).max(7),
    toDegree: z.number().int().min(1).max(7),
    choices: choiceOptionsSchema,
  }),
  z.object({
    ...exerciseBase,
    type: z.literal('transposition'),
    fromKey: KeySchema,
    toKey: KeySchema,
    melody: z.array(SpelledPitchSchema).min(1),
    /** Melodía transportada a `toKey`, para corregir la respuesta del alumno. */
    answer: z.array(SpelledPitchSchema).min(1).optional(),
    choices: choiceOptionsSchema,
  }),
  z.object({
    ...exerciseBase,
    type: z.literal('progression-completion'),
    key: KeySchema,
    mode: z.enum(['major', 'minor']).default('major'),
    degrees: z.array(z.string().min(1)).min(2),
    missingIndex: z.number().int().min(0),
    choices: choiceOptionsSchema,
  }),
  z.object({
    ...exerciseBase,
    type: z.literal('rhythm-dictation'),
    timeSignature: TimeSignatureSchema,
    pattern: z.array(RhythmCellSchema).min(1),
    choices: choiceOptionsSchema,
  }),
  z.object({
    ...exerciseBase,
    type: z.literal('rhythm-completion'),
    timeSignature: TimeSignatureSchema,
    pattern: z.array(RhythmCellSchema).min(1),
    missingIndex: z.number().int().min(0),
    choices: choiceOptionsSchema,
  }),
  z.object({
    ...exerciseBase,
    type: z.literal('anacrusis-completion'),
    timeSignature: TimeSignatureSchema,
    pickup: z.array(RhythmCellSchema).min(1),
    pattern: z.array(RhythmCellSchema).min(1),
    missingIndex: z.number().int().min(0),
    choices: choiceOptionsSchema,
  }),
  z.object({
    ...exerciseBase,
    type: z.literal('meter-accent'),
    timeSignature: TimeSignatureSchema,
    accentedBeats: z.array(z.number().int().min(1)).min(1),
    choices: choiceOptionsSchema,
  }),
  z.object({
    ...exerciseBase,
    type: z.literal('tempo-term'),
    term: TempoMarkSchema,
    bpm: z.number().int().min(40).max(240),
    choices: choiceOptionsSchema,
  }),
  z.object({
    ...exerciseBase,
    type: z.literal('tempo-stability'),
    targetBpm: z.number().int().min(40).max(240),
    beats: z.number().int().min(4).max(64),
    toleranceBpm: z.number().int().min(1).max(20),
  }),
  z.object({
    ...exerciseBase,
    type: z.literal('sound-parameter'),
    parameter: z.enum(['pitch', 'duration', 'intensity', 'timbre']),
    exampleA: SoundExampleSchema,
    exampleB: SoundExampleSchema,
    choices: choiceOptionsSchema,
  }),
  z.object({
    ...exerciseBase,
    type: z.literal('dynamic-mark'),
    marking: DynamicMarkSchema,
    velocity: z.number().int().min(1).max(127),
    choices: choiceOptionsSchema,
  }),
  z.object({
    ...exerciseBase,
    type: z.literal('articulation'),
    articulation: ArticulationSchema,
    midi: z.number().int().min(21).max(108),
    beats: z.number().positive().max(8).default(1),
    velocity: z.number().int().min(1).max(127).default(80),
    choices: choiceOptionsSchema,
  }),
  z.object({
    ...exerciseBase,
    type: z.literal('playback-order'),
    sections: z.array(PlaybackSectionSchema).min(2),
    answer: z.array(IdSchema).min(2),
    choices: choiceOptionsSchema,
  }),
  z.object({
    ...exerciseBase,
    type: z.literal('italian-term'),
    term: ItalianTermSchema,
    category: TermCategorySchema,
    meaningEs: z.string().min(1),
    meaningEn: z.string().min(1).optional(),
    exampleEs: z.string().min(1),
    exampleEn: z.string().min(1).optional(),
    choices: choiceOptionsSchema,
  }),
  z.object({
    ...exerciseBase,
    type: z.literal('ear-interval'),
    lower: SpelledPitchSchema,
    upper: SpelledPitchSchema,
    direction: z.enum(['ascending', 'descending', 'harmonic']),
    choices: choiceOptionsSchema,
  }),
  z.object({
    ...exerciseBase,
    type: z.literal('ear-chord'),
    quality: ChordQualitySchema,
    /** Fundamental con la que suena el acorde en el reproductor. */
    root: SpelledPitchSchema.default({ step: 'C', accidental: '', octave: 4 }),
    inversion: z.number().int().min(0).max(3).default(0),
    style: z
      .enum(['block', 'arpeggio-up', 'arpeggio-down', 'bass-chord'])
      .default('block'),
    choices: choiceOptionsSchema,
  }),
  z.object({
    ...exerciseBase,
    type: z.literal('ear-scale'),
    /** Tónica con la que suena la escala en el reproductor. */
    tonic: KeySchema.default('C'),
    mode: ScaleModeSchema,
    choices: choiceOptionsSchema,
  }),
  z.object({
    ...exerciseBase,
    type: z.literal('ear-progression'),
    key: KeySchema,
    mode: z.enum(['major', 'minor']).default('major'),
    degrees: z.array(z.string().min(1)).min(2),
    choices: choiceOptionsSchema,
  }),
  z.object({
    ...exerciseBase,
    type: z.literal('ear-melody'),
    /** Melodía que suena sin mostrar la partitura hasta después de responder. */
    score: ScoreSchema,
    /** Pregunta por un intervalo, por una nota o por el movimiento melódico. */
    ask: z.enum(['interval', 'note', 'motion']).default('interval'),
    /** Índice de la nota de partida en orden de lectura, empezando en 0. */
    from: z.number().int().min(0),
    /** Índice de la nota de llegada; si falta, la siguiente a `from`. */
    to: z.number().int().min(0).optional(),
    choices: choiceOptionsSchema,
  }),
  z.object({
    ...exerciseBase,
    type: z.literal('arpeggio'),
    /** Tónica de un arpegio mayor de una o dos octavas. */
    tonic: KeySchema,
    hand: z.enum(['right', 'left']).default('right'),
    octaves: z.number().int().min(1).max(2).default(1),
    /** Si se pregunta la digitación o el orden de las notas. */
    ask: z.enum(['fingering', 'notes']).default('fingering'),
    choices: choiceOptionsSchema,
  }),
  z.object({
    ...exerciseBase,
    type: z.literal('arpeggiated'),
    /** Partitura de acompañamiento arpegiado con notas sueltas. */
    score: ScoreSchema,
    /** Pregunta por el patrón de 3/4 notas o por el orden de las notas. */
    ask: z.enum(['pattern', 'notes']).default('pattern'),
    measure: z.number().int().min(1),
    choices: choiceOptionsSchema,
  }),
  z.object({
    ...exerciseBase,
    type: z.literal('alberti'),
    /** Partitura con el bajo de Alberti en corcheas. */
    score: ScoreSchema,
    /** Pregunta por el patrón o por el orden de la célula de cuatro notas. */
    ask: z.enum(['pattern', 'notes']).default('pattern'),
    measure: z.number().int().min(1),
    choices: choiceOptionsSchema,
  }),
  z.object({
    ...exerciseBase,
    type: z.literal('walking-bass'),
    /** Partitura con un walking bass en negras y cifrados por compás. */
    score: ScoreSchema,
    /** Pregunta por la nota del pulso o por su papel en el acorde. */
    ask: z.enum(['note', 'role']).default('note'),
    measure: z.number().int().min(1),
    /** Pulso del compás, empezando en 0. */
    beat: z.number().int().min(0),
    choices: choiceOptionsSchema,
  }),
  z.object({
    ...exerciseBase,
    type: z.literal('stride'),
    /** Partitura con bajo alternado y acorde en negras. */
    score: ScoreSchema,
    /** Pregunta por el patrón del compás o por la nota del bajo. */
    ask: z.enum(['pattern', 'bass']).default('pattern'),
    measure: z.number().int().min(1),
    /** Pulso del compás, empezando en 0, para `ask: 'bass'`. */
    beat: z.number().int().min(0).default(0),
    choices: choiceOptionsSchema,
  }),
  z.object({
    ...exerciseBase,
    type: z.literal('sight-reading'),
    /** Fragmento corto que se lee de un vistazo, en negras. */
    score: ScoreSchema,
    /** Pregunta por un intervalo, por una nota o por el movimiento melódico. */
    ask: z.enum(['interval', 'note', 'motion']).default('interval'),
    /** Índice de la nota de partida en orden de lectura, empezando en 0. */
    from: z.number().int().min(0),
    /** Índice de la nota de llegada; si falta, la siguiente a `from`. */
    to: z.number().int().min(0).optional(),
    choices: choiceOptionsSchema,
  }),
  z.object({
    ...exerciseBase,
    type: z.literal('accompaniment'),
    /** Partitura de acompañamiento o lead sheet con cifrados. */
    score: ScoreSchema,
    /**
     * Pregunta por el patrón rítmico, por el cifrado del compás, por una nota
     * de la melodía o por el shell voicing que realiza el cifrado.
     */
    ask: z.enum(['pattern', 'symbol', 'melody', 'voicing']).default('pattern'),
    measure: z.number().int().min(1),
    /** Pulso (1-based) usado por `ask: 'melody'`; 0 es el primer pulso. */
    beat: z.number().min(0).default(0),
    choices: choiceOptionsSchema,
  }),
  z.object({
    ...exerciseBase,
    type: z.literal('style-pattern'),
    /** Partitura de acompañamiento con un cifrado por compás. */
    score: ScoreSchema,
    /** Estilo popular al que pertenece el patrón. */
    style: z.enum(['pop-rock', 'blues', 'jazz', 'latin']).default('pop-rock'),
    /** Pregunta por el patrón, la progresión, el cifrado, la escala o el voicing. */
    ask: z
      .enum(['pattern', 'progression', 'chord', 'scale', 'voicing'])
      .default('pattern'),
    /** Compás (1-based) para `ask: 'pattern'`, `ask: 'chord'` y `ask: 'voicing'`. */
    measure: z.number().int().min(1).default(1),
    choices: choiceOptionsSchema,
  }),
  z.object({
    ...exerciseBase,
    type: z.literal('pedal'),
    /** Partitura con marcas de pedal que se analiza. */
    score: ScoreSchema,
    /** Pregunta por la acción en un punto o por el patrón del compás. */
    ask: z.enum(['action', 'pattern']).default('action'),
    /** Compás (1-based) que se pregunta. */
    measure: z.number().int().min(1),
    /** Pulso (1-based) dentro del compás para `ask: 'action'`. */
    beat: z.number().min(0).default(1),
    choices: choiceOptionsSchema,
  }),
  z.object({
    ...exerciseBase,
    type: z.literal('hand-coordination'),
    /** Partitura de dos manos escrita en un solo pentagrama. */
    score: ScoreSchema,
    /** Compás (1-based) del ataque que se pregunta. */
    measure: z.number().int().min(1),
    /** Pulso (1-based) dentro del compás. */
    beat: z.number().int().min(1),
    choices: choiceOptionsSchema,
  }),
])
export type Exercise = z.infer<typeof ExerciseSchema>
export type ExerciseType = Exercise['type']

export const ContentBundleSchema = z.object({
  version: z.literal(1),
  modules: z.array(ModuleSchema).min(1),
  lessons: z.array(LessonSchema).min(1),
  exercises: z.array(ExerciseSchema).min(1),
  skills: z.array(SkillItemSchema).min(1),
  repertoire: z.array(RepertoirePieceSchema).default([]),
})
export type ContentBundle = z.infer<typeof ContentBundleSchema>

export const ClefPreferenceSchema = ClefSchema
