/**
 * Decide qué ocurrencia de una nota se resalta durante la reproducción.
 *
 * Una partitura puede repetir la misma altura muchas veces. El motor de audio
 * solo conoce los MIDI que suenan, así que sin más información habría que
 * elegir una ocurrencia: la primera. Los timelines de las partituras incluyen
 * el id del evento (`label`), lo que permite resaltar exactamente la nota que
 * suena. Cuando no hay ids (por ejemplo, notas tocadas por MIDI), se recurre a
 * esa primera ocurrencia para no encender todas las repeticiones.
 */

export interface HighlightNote {
  id?: string
  midis: readonly number[]
}

export interface HighlightPlanner {
  /** Debe llamarse una vez por nota, en el mismo orden en que se dibujan. */
  shouldHighlight(note: HighlightNote): boolean
}

export function createHighlightPlanner(
  notes: readonly HighlightNote[],
  activeNotes: ReadonlyArray<number> = [],
  activeIds: ReadonlyArray<string> = [],
): HighlightPlanner {
  const activeSet = new Set(activeNotes)
  const idSet = new Set(
    activeIds.filter((id): id is string => typeof id === 'string' && id.length > 0),
  )
  const claimed = new Set<number>()

  // Las notas identificadas por id reclaman sus alturas de antemano. Así una
  // repetición anterior no se enciende por MIDI antes de llegar a la correcta.
  if (idSet.size > 0) {
    for (const note of notes) {
      if (note.id !== undefined && idSet.has(note.id)) {
        for (const midi of note.midis) claimed.add(midi)
      }
    }
  }

  return {
    shouldHighlight(note) {
      if (note.id !== undefined && idSet.has(note.id)) return true
      if (activeSet.size === 0) return false

      const matches = note.midis.some(
        (midi) => activeSet.has(midi) && !claimed.has(midi),
      )
      if (!matches) return false

      for (const midi of note.midis) claimed.add(midi)
      return true
    },
  }
}
