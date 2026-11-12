import { z } from 'zod'
import { IdSchema } from './primitives'
import {
  KeySchema,
  ScoreSchema,
  TimeSignatureSchema,
} from './notation'

/**
 * Canciones creadas por el usuario.
 *
 * Se guardan en una base Dexie aparte (`pianodesdecero.songs`) para no
 * mezclarlas con el progreso del curso ni con las piezas incluidas. Cada mano
 * reutiliza el mismo esquema `Score` que el repertorio, así el gran pentagrama,
 * el reproductor y los ejercicios pueden consumirlas sin conversiones.
 */

export const SONG_SOURCES = ['midi', 'manual'] as const
export const SongSourceSchema = z.enum(SONG_SOURCES)
export type SongSource = z.infer<typeof SongSourceSchema>

export const UserSongSchema = z.object({
  id: IdSchema,
  title: z.string().trim().min(1).max(120),
  composer: z.string().trim().max(120).default(''),
  /** ISO 8601; se usa también para ordenar la biblioteca. */
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  tempoBpm: z.number().int().min(20).max(300),
  timeSignature: TimeSignatureSchema,
  key: KeySchema,
  mode: z.enum(['major', 'minor']).default('major'),
  /** MIDI a partir del cual una nota se asigna a la mano derecha. */
  splitMidi: z.number().int().min(0).max(127).default(60),
  /** Compases totales; el mayor de las dos manos. */
  measures: z.number().int().min(1).max(512),
  source: SongSourceSchema.default('manual'),
  right: ScoreSchema.optional(),
  left: ScoreSchema.optional(),
})
export type UserSong = z.infer<typeof UserSongSchema>

/** Fila persistida: la canción ya incluye su id. */
export const SongRecordSchema = UserSongSchema
export type SongRecord = z.infer<typeof SongRecordSchema>

/**
 * Archivo de exportación. Admite una o varias canciones para poder compartir
 * una biblioteca completa sin renombrar archivos.
 */
export const SongBundleSchema = z.object({
  format: z.literal('pdc.songs'),
  version: z.literal(1),
  songs: z.array(UserSongSchema),
})
export type SongBundle = z.infer<typeof SongBundleSchema>

/** Acepta tanto una canción suelta como un archivo con varias. */
export const SongImportSchema = z.union([UserSongSchema, SongBundleSchema])
export type SongImport = z.infer<typeof SongImportSchema>
