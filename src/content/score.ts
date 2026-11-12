import { beatDuration, type TimelineEvent } from '../audio/notes'
import type {
  Hand,
  NoteEvent,
  RhythmicValue,
  Score,
  SpelledPitch,
} from '../schemas'
import type { StaffMeasure } from '../staff/render'
import type { StaffDuration } from '../staff/vex'
import { midiOf, parsePitch, type Pitch } from '../theory/pitch'

/**
 * Conversión del modelo de partitura a las piezas que usan el pentagrama y el
 * audio del reproductor de lecciones.
 *
 * El esquema guarda eventos con compás, pulso y figura; `Staff` espera una
 * lista de acordes y el motor de audio un `TimelineEvent[]` con tiempos en
 * segundos. Estas funciones son puras y compartidas por la UI y los tests.
 *
 * Limitación conocida: la figura se dibuja por su valor base. Los puntillos y
 * los tresillos afectan a la duración del audio, pero `Staff` todavía no los
 * dibuja: llegarán con la mejora del renderizador.
 */

const DURATION_TO_STAFF: Record<RhythmicValue['duration'], StaffDuration> = {
  whole: 'w',
  half: 'h',
  quarter: 'q',
  eighth: '8',
  sixteenth: '16',
  'thirty-second': '32',
}

const DURATION_TO_BEATS: Record<RhythmicValue['duration'], number> = {
  whole: 4,
  half: 2,
  quarter: 1,
  eighth: 0.5,
  sixteenth: 0.25,
  'thirty-second': 0.125,
}

/** Convierte una altura escrita en el contenido a la altura interna. */
export function spelledPitchToPitch(pitch: SpelledPitch): Pitch {
  return parsePitch(`${pitch.step}${pitch.accidental}${pitch.octave}`)
}

/** Figura base de VexFlow para un valor rítmico del contenido. */
export function staffDurationForValue(value: RhythmicValue): StaffDuration {
  return DURATION_TO_STAFF[value.duration]
}

/** MIDI de una altura del contenido. */
export function spelledPitchToMidi(pitch: SpelledPitch): number {
  return midiOf(spelledPitchToPitch(pitch))
}

/**
 * Nombre de armadura que entiende VexFlow: `C` para Do mayor, `Am` para La
 * menor. Sin la `m` el renderizador dibujaría la armadura mayor homónima y las
 * alteraciones de una tonalidad menor quedarían mal.
 */
export function scoreKeySignature(
  score: Pick<Score, 'key' | 'mode'>,
): string {
  return score.mode === 'minor' ? `${score.key}m` : score.key
}

/** Duración en pulsos de negra, con puntillos y tresillo aplicados. */
export function rhythmicValueBeats(value: RhythmicValue): number {
  const base = DURATION_TO_BEATS[value.duration]
  const dots = value.dots === 1 ? 1.5 : value.dots === 2 ? 1.75 : 1
  const tuplet = value.tuplet === 'triplet' ? 2 / 3 : 1
  return base * dots * tuplet
}

function sortEvents(events: readonly NoteEvent[]): NoteEvent[] {
  return [...events].sort(
    (a, b) =>
      a.measure - b.measure ||
      a.beat - b.beat ||
      a.id.localeCompare(b.id),
  )
}

/** Medidas que espera `Staff`, en orden de compás y pulso. */
export function scoreToMeasures(score: Score): StaffMeasure[] {
  const sorted = sortEvents(score.events)
  const beatsPerMeasure =
    score.timeSignature.numerator * (4 / score.timeSignature.denominator)
  const marks = score.pedals.map((mark) => ({
    ...mark,
    absolute:
      (mark.measure - 1) * beatsPerMeasure + mark.beat,
  }))
  return sorted.map((event) => {
    const absolute =
      (event.measure - 1) * beatsPerMeasure + event.beat
    // Una marca que cae después del ataque se dibuja sobre la nota que la
    // precede: sirve para el pedal sincopado (medio pulso después) y para el
    // cambio tardío de los ejercicios de limpieza (un pulso después).
    const touches = (mark: (typeof marks)[number]) =>
      Math.abs(mark.absolute - absolute) < 1e-6 ||
      (Math.abs(mark.absolute - absolute) <= 1 &&
        mark.absolute > absolute)
    return {
      id: event.id,
      pitches: event.pitches.map(spelledPitchToPitch),
      duration: DURATION_TO_STAFF[event.value.duration],
      pedalPress: marks.some(
        (mark) => mark.action === 'press' && touches(mark),
      ),
      pedalRelease: marks.some(
        (mark) => mark.action === 'release' && touches(mark),
      ),
      chordSymbol: event.chordSymbol,
    }
  })
}

/**
 * Mano que ataca en un compás y un pulso concretos.
 *
 * `measure` y `beat` son 1-based, como se leen en la partitura: el pulso 1 es
 * el comienzo del compás. Devuelve `both` cuando las dos manos atacan a la vez
 * y `null` cuando en ese punto no empieza ninguna nota (por ejemplo, porque una
 * mano mantiene una nota larga y la otra guarda silencio).
 */
export function attackingHandAt(
  score: Score,
  measure: number,
  beat: number,
): Hand | 'both' | null {
  const target = beat - 1
  const hands = new Set<Hand>()
  for (const event of score.events) {
    if (event.measure !== measure) continue
    if (Math.abs(event.beat - target) > 1e-6) continue
    hands.add(event.hand)
  }
  if (hands.size === 0) return null
  if (hands.size > 1) return 'both'
  return hands.values().next().value ?? null
}

/** Copia de la partitura con los eventos de una sola mano. */
export function scoreForHand(score: Score, hand: Hand): Score {
  return {
    ...score,
    events: score.events.filter((event) => event.hand === hand),
  }
}

/** MIDI de todos los eventos en el orden de la partitura. */
export function scoreToMidis(score: Score): number[] {
  return sortEvents(score.events).flatMap((event) =>
    event.pitches.map(spelledPitchToMidi),
  )
}

/**
 * Ventanas de resonancia del pedal, en pulsos absolutos desde el inicio.
 *
 * Cada `press` abre una ventana y cada `release` la cierra. Un cambio de
 * pedal se escribe como un `release` y un `press` en el mismo pulso; el
 * desempate del orden deja primero la liberación para que la ventana anterior
 * no se trague el ataque siguiente.
 */
export function pedalWindows(score: Score): Array<{
  pressBeat: number
  releaseBeat: number
}> {
  const beatsPerMeasure =
    score.timeSignature.numerator * (4 / score.timeSignature.denominator)
  const marks = score.pedals
    .map((mark, index) => ({
      index,
      action: mark.action,
      beat: (mark.measure - 1) * beatsPerMeasure + mark.beat,
    }))
    .sort(
      (a, b) =>
        a.beat - b.beat ||
        (a.action === 'release' ? -1 : 1) -
          (b.action === 'release' ? -1 : 1) ||
        a.index - b.index,
    )

  const lastBeat = sortEvents(score.events).reduce((total, event) => {
    const start = (event.measure - 1) * beatsPerMeasure + event.beat
    return Math.max(total, start + rhythmicValueBeats(event.value))
  }, 0)

  const windows: Array<{ pressBeat: number; releaseBeat: number }> = []
  let press: number | null = null
  for (const mark of marks) {
    if (mark.action === 'press') {
      press = mark.beat
    } else if (mark.action === 'release' && press !== null) {
      windows.push({ pressBeat: press, releaseBeat: mark.beat })
      press = null
    }
  }
  if (press !== null) {
    windows.push({ pressBeat: press, releaseBeat: lastBeat + 1 })
  }
  return windows
}

/**
 * Fin de la resonancia que alcanza a una nota, o `null` si no hay pedal.
 *
 * La tolerancia de 0,75 pulsos permite que el pedal sincopado, pisado justo
 * después del ataque, sostenga la nota recién tocada.
 */
export function pedalSustainEnd(
  score: Score,
  startBeat: number,
): number | null {
  let end: number | null = null
  for (const window of pedalWindows(score)) {
    if (
      window.pressBeat <= startBeat + 0.75 &&
      startBeat < window.releaseBeat
    ) {
      end = window.releaseBeat
    }
  }
  return end
}

/**
 * Timeline de audio de una partitura.
 *
 * El tempo total de la lección no cambia: cada evento se coloca en el pulso
 * indicado por su compás y su `beat`. Los acordes suenan juntos porque un
 * evento agrupa sus alturas en `midis`. Si la partitura trae marcas de pedal,
 * cada nota se sostiene hasta el próximo cambio, que es lo que hace audible
 * la diferencia entre tocar con y sin pedal.
 */
export function scoreToTimeline(
  score: Score,
  tempo: number = score.tempoBpm,
): TimelineEvent[] {
  const beat = beatDuration(tempo)
  const beatsPerMeasure =
    score.timeSignature.numerator * (4 / score.timeSignature.denominator)

  return sortEvents(score.events).map((event) => {
    const startBeat =
      (event.measure - 1) * beatsPerMeasure + event.beat
    const naturalBeats = rhythmicValueBeats(event.value)
    const sustainEnd = pedalSustainEnd(score, startBeat)
    const heldBeats =
      sustainEnd === null
        ? naturalBeats
        : Math.max(naturalBeats, sustainEnd - startBeat)
    return {
      time: startBeat * beat,
      duration: Math.max(0.05, heldBeats * beat),
      midis: event.pitches.map(spelledPitchToMidi),
      label: event.id,
    }
  })
}
