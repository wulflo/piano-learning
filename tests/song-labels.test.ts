import { describe, expect, it } from 'vitest'
import {
  measureCountLabel,
  noteCountLabel,
  songCountLabel,
  type Translate,
} from '../src/songs/labels'

const translations: Record<string, string> = {
  'songs.measure.one': '1 compás',
  'songs.measure.other': '{count} compases',
  'songs.note.one': '1 nota',
  'songs.note.other': '{count} notas',
  'songs.song.count.one': '1 canción',
  'songs.song.count.other': '{count} canciones',
}

const t: Translate = (key, vars) =>
  (translations[key] ?? key).replace(/\{(\w+)\}/g, (_, name: string) =>
    String(vars?.[name] ?? ''),
  )

describe('etiquetas de canciones', () => {
  it('usa el singular para uno y el plural para el resto', () => {
    expect(measureCountLabel(t, 1)).toBe('1 compás')
    expect(measureCountLabel(t, 4)).toBe('4 compases')
    expect(noteCountLabel(t, 1)).toBe('1 nota')
    expect(noteCountLabel(t, 12)).toBe('12 notas')
    expect(songCountLabel(t, 1)).toBe('1 canción')
    expect(songCountLabel(t, 3)).toBe('3 canciones')
  })
})
