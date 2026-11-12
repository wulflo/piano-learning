import { z } from 'zod'

export const STEP_VALUES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const
export const StepSchema = z.enum(STEP_VALUES)
export type Step = z.infer<typeof StepSchema>

export const ACCIDENTAL_VALUES = ['bb', 'b', '', '#', '##'] as const
export const AccidentalSchema = z.enum(ACCIDENTAL_VALUES)
export type Accidental = z.infer<typeof AccidentalSchema>

export const SpelledPitchSchema = z.object({
  step: StepSchema,
  accidental: AccidentalSchema.default(''),
  octave: z.number().int().min(-1).max(9),
})
export type SpelledPitch = z.infer<typeof SpelledPitchSchema>

export const KeySchema = z.string().regex(/^[A-G](?:#|b)?$/, {
  message: 'La tonalidad debe ser una letra A-G con sostenido o bemol opcional',
})
export type Key = z.infer<typeof KeySchema>

export const MODE_VALUES = [
  'major',
  'natural-minor',
  'harmonic-minor',
  'melodic-minor',
  'ionian',
  'dorian',
  'phrygian',
  'lydian',
  'mixolydian',
  'aeolian',
  'locrian',
  'major-pentatonic',
  'minor-pentatonic',
  'blues',
  'chromatic',
  'whole-tone',
] as const
export const ScaleModeSchema = z.enum(MODE_VALUES)
export type ScaleMode = z.infer<typeof ScaleModeSchema>

export const CHORD_QUALITY_VALUES = [
  'major',
  'minor',
  'diminished',
  'augmented',
  'sus2',
  'sus4',
  'major7',
  'dominant7',
  'minor7',
  'half-diminished7',
  'diminished7',
  'major9',
  'dominant9',
  'minor9',
  'major11',
  'dominant11',
  'minor11',
  'major13',
  'dominant13',
  'minor13',
] as const
export const ChordQualitySchema = z.enum(CHORD_QUALITY_VALUES)
export type ChordQuality = z.infer<typeof ChordQualitySchema>

export const DURATION_VALUES = [
  'whole',
  'half',
  'quarter',
  'eighth',
  'sixteenth',
  'thirty-second',
] as const
export const DurationSchema = z.enum(DURATION_VALUES)
export type DurationName = z.infer<typeof DurationSchema>

export const RhythmicValueSchema = z.object({
  duration: DurationSchema,
  dots: z.number().int().min(0).max(2).default(0),
  tuplet: z.enum(['none', 'triplet']).default('none'),
})
export type RhythmicValue = z.infer<typeof RhythmicValueSchema>

/** Celda rítmica de un ejercicio: la misma figura, o su silencio equivalente. */
export const RhythmCellSchema = RhythmicValueSchema.extend({
  rest: z.boolean().default(false),
})
export type RhythmCell = z.infer<typeof RhythmCellSchema>

export const TimeSignatureSchema = z.object({
  numerator: z.number().int().min(1).max(32),
  denominator: z.union([z.literal(2), z.literal(4), z.literal(8), z.literal(16)]),
})
export type TimeSignature = z.infer<typeof TimeSignatureSchema>

export const ClefSchema = z.enum(['treble', 'bass', 'grand'])
export type Clef = z.infer<typeof ClefSchema>

export const HandSchema = z.enum(['right', 'left'])
export type Hand = z.infer<typeof HandSchema>

export const NoteEventSchema = z.object({
  id: z.string().min(1),
  measure: z.number().int().min(1),
  beat: z.number().min(0),
  value: RhythmicValueSchema,
  pitches: z.array(SpelledPitchSchema).min(1).max(8),
  hand: HandSchema,
  /** Voz independiente dentro del compás; por defecto la primera. */
  voice: z.number().int().min(1).max(3).default(1),
  velocity: z.number().int().min(0).max(127).default(80),
  tieToNext: z.boolean().default(false),
  /** Cifrado que se dibuja encima de la nota, por ejemplo «C», «Am» o «G7». */
  chordSymbol: z.string().min(1).max(12).optional(),
})
export type NoteEvent = z.infer<typeof NoteEventSchema>

export const PEDAL_ACTIONS = ['press', 'release'] as const
export const PedalActionSchema = z.enum(PEDAL_ACTIONS)
export type PedalAction = z.infer<typeof PedalActionSchema>

/** Marca de pedal de resonancia en un punto de la partitura. */
export const PedalMarkSchema = z.object({
  measure: z.number().int().min(1),
  beat: z.number().min(0),
  action: PedalActionSchema,
  /**
   * `direct` pisa el pedal con el ataque; `syncopated` lo pisa justo después
   * del ataque, para cambiar en el momento del cambio de armonía sin cortar
   * la nota anterior.
   */
  kind: z.enum(['direct', 'syncopated']).default('direct'),
})
export type PedalMark = z.infer<typeof PedalMarkSchema>

export const ScoreSchema = z
  .object({
    clef: ClefSchema.default('treble'),
    key: KeySchema,
    mode: z.enum(['major', 'minor']).default('major'),
    timeSignature: TimeSignatureSchema,
    tempoBpm: z.number().int().min(20).max(300).default(80),
    events: z.array(NoteEventSchema).min(1),
    /** Marcas de pedal; vacío significa tocar sin pedal. */
    pedals: z.array(PedalMarkSchema).default([]),
  })
  .superRefine((score, ctx) => {
    const seen = new Set<string>()
    for (const [index, event] of score.events.entries()) {
      if (seen.has(event.id)) {
        ctx.addIssue({
          code: 'custom',
          message: `ID de evento duplicado: ${event.id}`,
          path: ['events', index, 'id'],
        })
      }
      seen.add(event.id)
    }
  })
export type Score = z.infer<typeof ScoreSchema>

export const NotationPreferenceSchema = z.enum(['do', 'c'])
export type NotationPreference = z.infer<typeof NotationPreferenceSchema>
