/** Etiquetas con plural simple para la biblioteca de canciones. */

export type Translate = (
  key: string,
  vars?: Record<string, string | number>,
) => string

export function measureCountLabel(t: Translate, count: number): string {
  return count === 1
    ? t('songs.measure.one')
    : t('songs.measure.other', { count })
}

export function noteCountLabel(t: Translate, count: number): string {
  return count === 1
    ? t('songs.note.one')
    : t('songs.note.other', { count })
}

export function songCountLabel(t: Translate, count: number): string {
  return count === 1
    ? t('songs.song.count.one')
    : t('songs.song.count.other', { count })
}
