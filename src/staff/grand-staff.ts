import {
  rhythmicValueBeats,
  scoreKeySignature,
  spelledPitchToPitch,
  staffDurationForValue,
} from '../content/score'
import { midiNameWithOctave, type Notation } from '../notation'
import type { Hand, NoteEvent, Score } from '../schemas'
import { midiOf } from '../theory/pitch'
import { createHighlightPlanner, type HighlightPlanner } from './highlight'
import { verticalExtent, type VerticalNoteInput } from './layout'
import { pitchToVexKey } from './vex'

/**
 * F5-022 — Gran pentagrama para piezas de repertorio.
 *
 * Las piezas guardan la mano derecha y la izquierda como partituras separadas.
 * Este renderizador las dibuja en dos pentagramas unidos por una llave, con la
 * clave y la armadura de cada mano. Los compases se reparten en sistemas que se
 * adaptan al ancho disponible: cada pareja de pentagramas comparte el mismo
 * `x` y el mismo ancho, de modo que los compases quedan alineados aunque una
 * mano tenga más o menos notas que la otra.
 *
 * Además de compartir compases, las dos voces se formatean juntas. VexFlow
 * asigna un contexto de pulso a cada posición rítmica y las notas de ambas
 * manos que caen en el mismo pulso reciben la misma `x`. Para que eso funcione
 * con compases incompletos o con silencios intermedios, la voz se rellena con
 * silencios o espaciadores invisibles hasta el siguiente ataque.
 *
 * VexFlow se importa de forma dinámica para mantenerlo en un chunk aparte. La
 * función no toca React: el componente `GrandStaff` le pasa el contenedor y el
 * ancho medido.
 */

export const GRAND_STAFF_MIN_MEASURE_WIDTH = 110
export const GRAND_STAFF_MARGIN = 12
export const GRAND_STAFF_SYSTEM_HEIGHT = 190
const TOP_STAVE_Y = 34
const BOTTOM_STAVE_Y = 132
/** Espacio extra para la clave, la armadura y el compás del primer compás. */
const FIRST_MEASURE_EXTRA = 48
/** Margen interno de cada compás para que las notas no toquen las barras. */
const MEASURE_PADDING = 12
const BEAT_EPSILON = 1e-6

type VexFlow = typeof import('vexflow')
type VexStaveNote = InstanceType<VexFlow['StaveNote']>
type VexVoice = InstanceType<VexFlow['Voice']>
type VexTuplet = InstanceType<VexFlow['Tuplet']>

export interface GrandStaffNoteClick {
  hand: Hand
  measure: number
  index: number
  id?: string
  midis: number[]
}

export interface RenderedGrandStaffNote extends GrandStaffNoteClick {
  highlighted: boolean
  element?: SVGElement
}

export interface GrandStaffOptions {
  right?: Score
  left?: Score
  width?: number
  notation?: Notation
  activeNotes?: ReadonlyArray<number>
  /** Ids de los eventos que suenan; evita encender repeticiones de la altura. */
  activeIds?: ReadonlyArray<string>
  onNoteClick?: (payload: GrandStaffNoteClick) => void
}

export interface GrandStaffRenderResult {
  notes: RenderedGrandStaffNote[]
  height: number
  systems: number
  /** Ancho real del SVG; puede superar el pedido si un compás muy denso no entra. */
  width: number
}

export interface GrandStaffLayout {
  /** Compases por sistema según el ancho disponible. */
  perSystem: number
  systems: number
  height: number
  /** Ancho útil después de los márgenes. */
  available: number
}

/** Número de compás más alto de una partitura (0 si está vacía). */
export function maxMeasureOf(score: Score | undefined): number {
  if (score === undefined) return 0
  let max = 0
  for (const event of score.events) {
    if (event.measure > max) max = event.measure
  }
  return max
}

/** Cantidad de compases que necesita el gran pentagrama. */
export function grandStaffMeasureCount(
  right: Score | undefined,
  left: Score | undefined,
): number {
  return Math.max(maxMeasureOf(right), maxMeasureOf(left))
}

/**
 * Calcula cuántos sistemas hacen falta y la altura total.
 *
 * Con un ancho de 640 px entran cinco compases por sistema; con pantallas
 * angostas se reduce la cantidad y el componente permite desplazamiento
 * horizontal si el ancho mínimo de un compás no alcanza.
 */
export function grandStaffLayout(
  measureCount: number,
  width: number,
): GrandStaffLayout {
  const safeWidth = Math.max(280, Math.round(width))
  const available = Math.max(
    GRAND_STAFF_MIN_MEASURE_WIDTH,
    safeWidth - GRAND_STAFF_MARGIN * 2,
  )
  const perSystem = Math.max(
    1,
    Math.floor(available / GRAND_STAFF_MIN_MEASURE_WIDTH),
  )
  const total = Math.max(1, measureCount)
  const systems = Math.max(1, Math.ceil(total / perSystem))
  return {
    perSystem,
    systems,
    height: systems * GRAND_STAFF_SYSTEM_HEIGHT + GRAND_STAFF_MARGIN,
    available,
  }
}

/**
 * Reparte el ancho útil entre los compases de un sistema.
 *
 * Sin `weights` reparte por igual, como antes. Con pesos, los compases con más
 * notas reciben más espacio y el resto se reparte proporcionalmente, sin que
 * ninguno baje de su ancho mínimo.
 */
export function distributeMeasureWidths(
  available: number,
  count: number,
  weights?: readonly number[],
): number[] {
  if (count <= 0) return []
  if (weights !== undefined && weights.length >= count) {
    const safe = weights.slice(0, count).map((weight) =>
      Number.isFinite(weight) && weight > 0 ? weight : 1,
    )
    const total = safe.reduce((sum, weight) => sum + weight, 0)
    const widths = safe.map((weight) =>
      Math.max(1, Math.floor((available * weight) / total)),
    )
    const remainder = available - widths.reduce((sum, value) => sum + value, 0)
    widths[count - 1] = (widths[count - 1] ?? 0) + remainder
    return widths
  }

  const base = Math.floor(available / count)
  const widths = new Array<number>(count).fill(base)
  widths[count - 1] = (widths[count - 1] ?? 0) + (available - base * count)
  return widths
}

/** Eventos de una partitura agrupados por compás y ordenados por pulso. */
export function eventsByMeasure(
  score: Score | undefined,
): Map<number, NoteEvent[]> {
  const grouped = new Map<number, NoteEvent[]>()
  if (score === undefined) return grouped
  for (const event of score.events) {
    const list = grouped.get(event.measure) ?? []
    list.push(event)
    grouped.set(event.measure, list)
  }
  for (const list of grouped.values()) {
    list.sort((a, b) => a.beat - b.beat || a.id.localeCompare(b.id))
  }
  return grouped
}

interface PendingNote {
  event: NoteEvent
  note: VexStaveNote
  highlighted: boolean
  index: number
}

interface HandVoice {
  voice: VexVoice
  pending: PendingNote[]
  tuplets: VexTuplet[]
}

interface MeasureBuild {
  right: HandVoice
  left: HandVoice
  /** Ancho mínimo estimado por VexFlow para las dos voces. */
  minWidth: number
}

interface SystemRange {
  startMeasure: number
  measures: number
  topY: number
  bottomY: number
  height: number
}

function eventIsActive(
  event: NoteEvent,
  planner: HighlightPlanner,
): boolean {
  return planner.shouldHighlight({
    id: event.id,
    midis: event.pitches.map((pitch) => midiOf(spelledPitchToPitch(pitch))),
  })
}

function addChordSymbol(VF: VexFlow, note: VexStaveNote, symbol: string): void {
  const chord = new VF.ChordSymbol()
  chord.addText(symbol)
  note.addModifier(chord, 0)
}

function createNote(
  VF: VexFlow,
  event: NoteEvent,
  index: number,
  planner: HighlightPlanner,
  clef: 'treble' | 'bass',
): PendingNote {
  const pitches = event.pitches.map(spelledPitchToPitch)
  const note = new VF.StaveNote({
    keys: pitches.map(pitchToVexKey),
    duration: staffDurationForValue(event.value),
    dots: event.value.dots,
    clef,
  })
  note.setAttribute('id', `pdc-grand-note-${index}`)
  const highlighted = eventIsActive(event, planner)
  note.addClass('vf-grand-staff-note')
  if (event.value.dots > 0) VF.Dot.buildAndAttach([note], { all: true })
  if (event.chordSymbol !== undefined) {
    addChordSymbol(VF, note, event.chordSymbol)
  }
  return { event, note, highlighted, index }
}

/** Altura donde se apoya un silencio para cada clave. */
function restKey(clef: 'treble' | 'bass'): string {
  return clef === 'treble' ? 'b/4' : 'd/3'
}

function createRest(
  VF: VexFlow,
  clef: 'treble' | 'bass',
  duration: string,
  dots = 0,
): VexStaveNote {
  const rest = new VF.StaveNote({
    keys: [restKey(clef)],
    duration: `${duration}r`,
    dots,
    clef,
  })
  rest.addClass('vf-grand-staff-rest')
  if (dots > 0) VF.Dot.buildAndAttach([rest], { all: true })
  return rest
}

/** Fracción reducida que representa `beats` con un denominador razonable. */
function rationalBeats(beats: number): { numerator: number; denominator: number } {
  const denominator = 96
  let numerator = Math.round(beats * denominator)
  let a = Math.abs(numerator)
  let b = denominator
  while (b !== 0) {
    const remainder = a % b
    a = b
    b = remainder
  }
  const divisor = a || 1
  numerator /= divisor
  return { numerator, denominator: denominator / divisor }
}

/**
 * Crea un espaciador invisible con una duración exacta en pulsos.
 *
 * VexFlow no puede representar una fracción arbitraria con una figura, pero sí
 * admite un multiplicador racional. Partimos de una figura redonda (4 pulsos) y
 * aplicamos `beats / 4`.
 */
function createSpacer(VF: VexFlow, beats: number): InstanceType<VexFlow['GhostNote']> {
  const ghost = new VF.GhostNote({ duration: 'w' })
  if (beats > 0) {
    const { numerator, denominator } = rationalBeats(beats)
    ghost.applyTickMultiplier(numerator, denominator * 4)
  }
  return ghost
}

const GAP_VALUES: ReadonlyArray<{ beats: number; duration: string; dots?: number }> = [
  { beats: 6, duration: 'w', dots: 1 },
  { beats: 4, duration: 'w' },
  { beats: 3, duration: 'h', dots: 1 },
  { beats: 2, duration: 'h' },
  { beats: 1.5, duration: 'q', dots: 1 },
  { beats: 1, duration: 'q' },
  { beats: 0.75, duration: '8', dots: 1 },
  { beats: 0.5, duration: '8' },
  { beats: 0.375, duration: '16', dots: 1 },
  { beats: 0.25, duration: '16' },
  { beats: 0.1875, duration: '32', dots: 1 },
  { beats: 0.125, duration: '32' },
]

/** Rellena un silencio visible y, si queda una fracción rara, la completa. */
function fillGap(
  VF: VexFlow,
  tickables: VexStaveNote[],
  beats: number,
  clef: 'treble' | 'bass',
): void {
  let remaining = beats
  for (const value of GAP_VALUES) {
    while (remaining + BEAT_EPSILON >= value.beats) {
      tickables.push(createRest(VF, clef, value.duration, value.dots ?? 0))
      remaining -= value.beats
    }
  }
  if (remaining > BEAT_EPSILON) {
    tickables.push(createSpacer(VF, remaining) as unknown as VexStaveNote)
  }
}

function eventInputs(events: readonly NoteEvent[]): VerticalNoteInput[] {
  return events.map((event) => ({
    keys: event.pitches.map((pitch) =>
      pitchToVexKey(spelledPitchToPitch(pitch)),
    ),
    duration: staffDurationForValue(event.value),
    chordSymbol: event.chordSymbol !== undefined,
  }))
}

function tripletChunks(notes: VexStaveNote[]): VexStaveNote[][] {
  const chunks: VexStaveNote[][] = []
  for (let index = 0; index + 2 < notes.length; index += 3) {
    chunks.push(notes.slice(index, index + 3))
  }
  return chunks
}

/**
 * Construye una voz de un compás respetando los pulsos del contenido.
 *
 * La voz incluye silencios (o espaciadores invisibles) para los huecos, de
 * modo que el pulso de cada nota coincida con el de la otra mano. Al final se
 * completa hasta `totalBeats` para que las dos voces tengan la misma duración
 * total y VexFlow pueda formatearlas juntas.
 */
function buildHandVoice(
  VF: VexFlow,
  clef: 'treble' | 'bass',
  events: readonly NoteEvent[],
  firstIndex: number,
  planner: HighlightPlanner,
  timeSignature: string,
  totalBeats: number,
): { build: HandVoice; nextIndex: number } {
  const pending: PendingNote[] = []
  const tickables: VexStaveNote[] = []
  const tuplets: VexTuplet[] = []
  let cursor = 0
  let index = firstIndex

  // Los tresillos se dibujan por grupos de tres notas consecutivas que
  // comparten la marca `tuplet`. La marca se crea antes de formatear para que
  // VexFlow aplique el multiplicador 3:2 a los pulsos de las notas.
  let run: VexStaveNote[] = []
  const flushRun = () => {
    for (const group of tripletChunks(run)) {
      tuplets.push(
        new VF.Tuplet(group, { numNotes: 3, notesOccupied: 2 }),
      )
    }
    run = []
  }

  for (const event of events) {
    const start = Math.max(0, event.beat)
    if (start > cursor + BEAT_EPSILON) {
      // Un silencio corta el grupo de tresillo: no debe arrastrar la marca
      // sobre notas separadas en el tiempo.
      flushRun()
      fillGap(VF, tickables, start - cursor, clef)
      cursor = start
    }

    const note = createNote(VF, event, index, planner, clef)
    tickables.push(note.note)
    pending.push(note)
    index += 1

    if (event.value.tuplet === 'triplet') {
      run.push(note.note)
    } else if (run.length > 0) {
      flushRun()
    }

    cursor = Math.max(cursor, start + rhythmicValueBeats(event.value))
  }
  if (run.length > 0) flushRun()

  // Completa el compás hasta la duración acordada con la otra mano.
  if (cursor < totalBeats - BEAT_EPSILON) {
    tickables.push(
      createSpacer(VF, totalBeats - cursor) as unknown as VexStaveNote,
    )
  }

  const voice = new VF.Voice(timeSignature).setStrict(false)
  voice.addTickables(tickables)
  return { build: { voice, pending, tuplets }, nextIndex: index }
}

/** Ancho mínimo que necesita un compás, calculado por VexFlow. */
function measureMinWidth(VF: VexFlow, build: MeasureBuild): number {
  const formatter = new VF.Formatter()
  formatter.joinVoices([build.right.voice, build.left.voice])
  const width = formatter.preCalculateMinTotalWidth([
    build.right.voice,
    build.left.voice,
  ])
  return Number.isFinite(width) && width > 0 ? width : GRAND_STAFF_MIN_MEASURE_WIDTH
}

/** Reparte los compases en sistemas sin superar el ancho útil. */
function systemRanges(
  measureCount: number,
  available: number,
  requiredWidths: readonly number[],
): Array<{ startMeasure: number; measures: number }> {
  const ranges: Array<{ startMeasure: number; measures: number }> = []
  let startMeasure = 1
  let measures = 0
  let used = 0

  for (let index = 0; index < measureCount; index += 1) {
    const requirement = Math.max(
      GRAND_STAFF_MIN_MEASURE_WIDTH,
      requiredWidths[index] ?? GRAND_STAFF_MIN_MEASURE_WIDTH,
    )
    const extra = measures === 0 ? FIRST_MEASURE_EXTRA : 0
    if (measures > 0 && used + requirement + extra > available) {
      ranges.push({ startMeasure, measures })
      startMeasure = index + 1
      measures = 0
      used = 0
    }
    used += requirement + (measures === 0 ? FIRST_MEASURE_EXTRA : 0)
    measures += 1
  }
  if (measures > 0) ranges.push({ startMeasure, measures })
  return ranges
}

/** Dibuja el gran pentagrama y devuelve las referencias de las notas. */
export async function renderGrandStaff(
  container: HTMLDivElement,
  options: GrandStaffOptions,
): Promise<GrandStaffRenderResult> {
  const VF = await import('vexflow')
  const {
    right,
    left,
    width = 640,
    notation = 'c',
    activeNotes = [],
    activeIds = [],
    onNoteClick,
  } = options

  const measureCount = Math.max(1, grandStaffMeasureCount(right, left))
  container.replaceChildren()

  const rightEvents = eventsByMeasure(right)
  const leftEvents = eventsByMeasure(left)
  const planner = createHighlightPlanner(
    [...(right?.events ?? []), ...(left?.events ?? [])].map((event) => ({
      id: event.id,
      midis: event.pitches.map((pitch) =>
        midiOf(spelledPitchToPitch(pitch)),
      ),
    })),
    activeNotes,
    activeIds,
  )
  const rightKey = right === undefined ? 'C' : scoreKeySignature(right)
  const leftKey = left === undefined ? 'C' : scoreKeySignature(left)
  const rightClef = right?.clef === 'bass' ? 'bass' : 'treble'
  const leftClef = left?.clef === 'treble' ? 'treble' : 'bass'
  const rightTime = right?.timeSignature ?? left?.timeSignature
  const timeSignature =
    rightTime === undefined
      ? '4/4'
      : `${rightTime.numerator}/${rightTime.denominator}`
  const measureBeats =
    rightTime === undefined
      ? 4
      : rightTime.numerator * (4 / rightTime.denominator)

  // Primera pasada: construye las dos voces de cada compás y mide su ancho
  // mínimo. Así los compases densos reciben más espacio y nunca se salen del
  // pentagrama.
  const builds: MeasureBuild[] = []
  const requiredWidths: number[] = []
  let globalIndex = 0

  for (let measure = 1; measure <= measureCount; measure += 1) {
    const rightMeasureEvents = rightEvents.get(measure) ?? []
    const leftMeasureEvents = leftEvents.get(measure) ?? []
    const lastEnd = (events: readonly NoteEvent[]) =>
      events.reduce(
        (end, event) =>
          Math.max(
            end,
            Math.max(0, event.beat) + rhythmicValueBeats(event.value),
          ),
        0,
      )
    const totalBeats = Math.max(
      measureBeats,
      lastEnd(rightMeasureEvents),
      lastEnd(leftMeasureEvents),
    )

    const rightBuild = buildHandVoice(
      VF,
      rightClef,
      rightMeasureEvents,
      globalIndex,
      planner,
      timeSignature,
      totalBeats,
    )
    globalIndex = rightBuild.nextIndex
    const leftBuild = buildHandVoice(
      VF,
      leftClef,
      leftMeasureEvents,
      globalIndex,
      planner,
      timeSignature,
      totalBeats,
    )
    globalIndex = leftBuild.nextIndex

    const build: MeasureBuild = {
      right: rightBuild.build,
      left: leftBuild.build,
      minWidth: 0,
    }
    // Las alteraciones forman parte del ancho de la nota, así que se aplican
    // antes de medir el compás.
    if (build.right.pending.length > 0) {
      VF.Accidental.applyAccidentals([build.right.voice], rightKey)
    }
    if (build.left.pending.length > 0) {
      VF.Accidental.applyAccidentals([build.left.voice], leftKey)
    }
    build.minWidth = measureMinWidth(VF, build)
    builds.push(build)
    requiredWidths.push(
      Math.max(GRAND_STAFF_MIN_MEASURE_WIDTH, build.minWidth + MEASURE_PADDING),
    )
  }

  // Si un solo compás denso no entra ni ocupando todo el ancho, se amplía el
  // SVG. El componente permite desplazamiento horizontal para verlo completo.
  const widestMeasure = Math.max(
    0,
    ...requiredWidths.map((required) => required + FIRST_MEASURE_EXTRA),
  )
  const renderWidth = Math.max(
    280,
    Math.round(width),
    widestMeasure + GRAND_STAFF_MARGIN * 2,
  )
  const available = Math.max(
    GRAND_STAFF_MIN_MEASURE_WIDTH,
    renderWidth - GRAND_STAFF_MARGIN * 2,
  )
  const ranges = systemRanges(measureCount, available, requiredWidths)

  // Cada sistema reserva el alto que necesitan sus notas extremas. Así una
  // nota muy grave de la mano izquierda o muy aguda de la derecha no queda
  // fuera del `viewBox`.
  const systemLayouts: SystemRange[] = []
  for (const range of ranges) {
    const rightInputs: VerticalNoteInput[] = []
    const leftInputs: VerticalNoteInput[] = []
    for (let offset = 0; offset < range.measures; offset += 1) {
      const measure = range.startMeasure + offset
      rightInputs.push(...eventInputs(rightEvents.get(measure) ?? []))
      leftInputs.push(...eventInputs(leftEvents.get(measure) ?? []))
    }
    const rightExtent = verticalExtent(VF, rightInputs, rightClef)
    const leftExtent = verticalExtent(VF, leftInputs, leftClef)
    const shift = Math.max(
      0,
      GRAND_STAFF_MARGIN - (TOP_STAVE_Y + rightExtent.top),
    )
    const topY = TOP_STAVE_Y + shift
    const bottomY = BOTTOM_STAVE_Y + shift
    systemLayouts.push({
      startMeasure: range.startMeasure,
      measures: range.measures,
      topY,
      bottomY,
      height: Math.max(
        GRAND_STAFF_SYSTEM_HEIGHT,
        bottomY + leftExtent.bottom + GRAND_STAFF_MARGIN,
      ),
    })
  }

  const totalHeight = systemLayouts.reduce(
    (total, system) => total + system.height,
    0,
  )
  const renderer = new VF.Renderer(container, VF.Renderer.Backends.SVG)
  renderer.resize(renderWidth, totalHeight)
  const context = renderer.getContext()

  const rendered: RenderedGrandStaffNote[] = []
  let yOffset = 0

  for (let system = 0; system < systemLayouts.length; system += 1) {
    const systemLayout = systemLayouts[system]
    if (systemLayout === undefined) continue
    const { startMeasure, measures: systemMeasures, topY, bottomY } =
      systemLayout

    // Los compases de un sistema comparten su ancho base; el primero reserva
    // espacio para la clave, la armadura y el compás.
    const weights = Array.from({ length: systemMeasures }, (_, offset) => {
      const requirement =
        requiredWidths[startMeasure - 1 + offset] ??
        GRAND_STAFF_MIN_MEASURE_WIDTH
      return offset === 0 ? requirement + FIRST_MEASURE_EXTRA : requirement
    })
    const widths = distributeMeasureWidths(available, systemMeasures, weights)
    const systemTopY = yOffset + topY
    const systemBottomY = yOffset + bottomY
    let x = GRAND_STAFF_MARGIN

    for (let offset = 0; offset < systemMeasures; offset += 1) {
      const measure = startMeasure + offset
      const measureWidth = widths[offset] ?? GRAND_STAFF_MIN_MEASURE_WIDTH
      const firstOfSystem = offset === 0
      const firstOfPiece = system === 0 && firstOfSystem
      const build = builds[measure - 1]
      if (build === undefined) continue

      const top = new VF.Stave(x, systemTopY, measureWidth)
      const bottom = new VF.Stave(x, systemBottomY, measureWidth)
      top.setAttribute('id', `pdc-top-stave-${measure}`)
      bottom.setAttribute('id', `pdc-bottom-stave-${measure}`)
      if (firstOfSystem) {
        top.addClef(rightClef)
        bottom.addClef(leftClef)
        if (rightKey !== 'C') top.addKeySignature(rightKey)
        if (leftKey !== 'C') bottom.addKeySignature(leftKey)
      }
      if (firstOfPiece) {
        top.addTimeSignature(timeSignature)
        bottom.addTimeSignature(timeSignature)
      }
      const lastOfPiece =
        system === systemLayouts.length - 1 &&
        offset === systemMeasures - 1
      if (lastOfPiece) {
        top.setEndBarType(VF.Barline.type.END)
        bottom.setEndBarType(VF.Barline.type.END)
      }
      top.setContext(context).draw()
      bottom.setContext(context).draw()

      // Las coordenadas del pentagrama quedan en el SVG para que las pruebas
      // puedan comprobar que ninguna nota se sale del compás.
      for (const [hand, suffix] of [
        ['right', 'top'],
        ['left', 'bottom'],
      ] as const) {
        const element = container.querySelector(
          `#vf-pdc-${suffix}-stave-${measure}`,
        )
        if (element === null) continue
        element.setAttribute('data-stave-hand', hand)
        element.setAttribute('data-stave-measure', String(measure))
        element.setAttribute('data-stave-x', String(x))
        element.setAttribute('data-stave-width', String(measureWidth))
      }

      // Ambas voces deben empezar en la misma x aunque una mano tenga una
      // armadura más ancha que la otra.
      const noteStartX = Math.max(top.getNoteStartX(), bottom.getNoteStartX())
      top.setNoteStartX(noteStartX)
      bottom.setNoteStartX(noteStartX)

      // Formatear las dos voces juntas hace que compartan contextos de pulso:
      // una nota de la mano izquierda en el pulso 2 queda exactamente debajo de
      // la nota de la mano derecha en ese mismo pulso.
      new VF.Formatter()
        .joinVoices([build.right.voice, build.left.voice])
        .formatToStave([build.right.voice, build.left.voice], top, {
          alignRests: false,
        })

      build.right.voice.draw(context, top)
      build.left.voice.draw(context, bottom)

      for (const tuplet of build.right.tuplets) {
        tuplet.setContext(context).draw()
      }
      for (const tuplet of build.left.tuplets) {
        tuplet.setContext(context).draw()
      }

      const singleRight = new VF.StaveConnector(top, bottom)
      singleRight.setType(VF.StaveConnector.type.SINGLE_RIGHT)
      singleRight.setContext(context).draw()

      if (firstOfSystem) {
        const brace = new VF.StaveConnector(top, bottom)
        brace.setType(VF.StaveConnector.type.BRACE)
        brace.setContext(context).draw()
        const line = new VF.StaveConnector(top, bottom)
        line.setType(VF.StaveConnector.type.SINGLE_LEFT)
        line.setContext(context).draw()
      }

      collectMeasureNotes({
        container,
        hand: 'right',
        measure,
        pending: build.right.pending,
        notation,
        onNoteClick,
        rendered,
      })
      collectMeasureNotes({
        container,
        hand: 'left',
        measure,
        pending: build.left.pending,
        notation,
        onNoteClick,
        rendered,
      })

      x += measureWidth
    }

    yOffset += systemLayout.height
  }

  return {
    notes: rendered,
    height: yOffset,
    systems: systemLayouts.length,
    width: renderWidth,
  }
}

interface CollectOptions {
  container: HTMLDivElement
  hand: Hand
  measure: number
  pending: PendingNote[]
  notation: Notation
  onNoteClick?: (payload: GrandStaffNoteClick) => void
  rendered: RenderedGrandStaffNote[]
}

function collectMeasureNotes(options: CollectOptions): void {
  for (const item of options.pending) {
    const element = options.container.querySelector(
      `#vf-pdc-grand-note-${item.index}`,
    ) as SVGElement | null
    const midis = item.event.pitches.map((pitch) =>
      midiOf(spelledPitchToPitch(pitch)),
    )
    if (element !== null) {
      element.setAttribute('data-grand-note', String(item.index))
      element.setAttribute('data-hand', options.hand)
      element.setAttribute('data-measure', String(options.measure))
      element.setAttribute('data-beat', String(item.event.beat))
      element.setAttribute(
        'data-x',
        item.note.getAbsoluteX().toFixed(2),
      )
      const box = item.note.getBoundingBox()
      if (box !== undefined) {
        element.setAttribute('data-box-x', box.getX().toFixed(2))
        element.setAttribute('data-box-width', box.getW().toFixed(2))
      }
      element.setAttribute('data-midi', midis.join(','))
      element.setAttribute('data-highlighted', String(item.highlighted))
      element.setAttribute('tabindex', '0')
      element.setAttribute('role', 'button')
      element.setAttribute(
        'aria-label',
        item.event.pitches
          .map((pitch, index) =>
            midiNameWithOctave(
              midis[index] ?? midiOf(spelledPitchToPitch(pitch)),
              options.notation,
            ),
          )
          .join(', '),
      )
      const activate = () =>
        options.onNoteClick?.({
          hand: options.hand,
          measure: options.measure,
          index: item.index,
          id: item.event.id,
          midis,
        })
      element.addEventListener('click', activate)
      element.addEventListener('keydown', (event) => {
        const keyboardEvent = event as KeyboardEvent
        if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
          keyboardEvent.preventDefault()
          activate()
        }
      })
    }
    options.rendered.push({
      hand: options.hand,
      measure: options.measure,
      index: item.index,
      id: item.event.id,
      midis,
      highlighted: item.highlighted,
      element: element ?? undefined,
    })
  }
}
