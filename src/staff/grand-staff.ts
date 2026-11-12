import {
  scoreKeySignature,
  spelledPitchToPitch,
  staffDurationForValue,
} from '../content/score'
import { midiNameWithOctave, type Notation } from '../notation'
import type { Hand, NoteEvent, Score } from '../schemas'
import { midiOf } from '../theory/pitch'
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
 * VexFlow se importa de forma dinámica para mantenerlo en un chunk aparte. La
 * función no toca React: el componente `GrandStaff` le pasa el contenedor y el
 * ancho medido.
 */

export const GRAND_STAFF_MIN_MEASURE_WIDTH = 110
export const GRAND_STAFF_MARGIN = 12
export const GRAND_STAFF_SYSTEM_HEIGHT = 190
const TOP_STAVE_Y = 34
const BOTTOM_STAVE_Y = 132
const ACCENT = '#a33b2b'

type VexFlow = typeof import('vexflow')
type VexStaveNote = InstanceType<VexFlow['StaveNote']>

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
  onNoteClick?: (payload: GrandStaffNoteClick) => void
}

export interface GrandStaffRenderResult {
  notes: RenderedGrandStaffNote[]
  height: number
  systems: number
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

/** Reparte el ancho útil entre los compases de un sistema. */
export function distributeMeasureWidths(
  available: number,
  count: number,
): number[] {
  if (count <= 0) return []
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

function eventIsActive(
  event: NoteEvent,
  activeSet: ReadonlySet<number>,
): boolean {
  return event.pitches.some((pitch) =>
    activeSet.has(midiOf(spelledPitchToPitch(pitch))),
  )
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
  activeSet: ReadonlySet<number>,
  clef: 'treble' | 'bass',
): PendingNote {
  const pitches = event.pitches.map(spelledPitchToPitch)
  const note = new VF.StaveNote({
    keys: pitches.map(pitchToVexKey),
    duration: staffDurationForValue(event.value),
    clef,
  })
  note.setAttribute('id', `pdc-grand-note-${index}`)
  const highlighted = eventIsActive(event, activeSet)
  if (highlighted) {
    note.setStyle({ fillStyle: ACCENT, strokeStyle: ACCENT })
    note.setKeyStyle(0, { fillStyle: ACCENT, strokeStyle: ACCENT })
  }
  note.addClass('vf-grand-staff-note')
  if (event.value.dots > 0) VF.Dot.buildAndAttach([note], { all: true })
  if (event.chordSymbol !== undefined) {
    addChordSymbol(VF, note, event.chordSymbol)
  }
  return { event, note, highlighted, index }
}

function createRest(
  VF: VexFlow,
  hand: Hand,
  clef: 'treble' | 'bass',
): VexStaveNote {
  const rest = new VF.StaveNote({
    keys: [hand === 'right' ? 'b/4' : 'd/3'],
    duration: 'wr',
    clef,
  })
  rest.addClass('vf-grand-staff-rest')
  return rest
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

interface SystemLayout {
  startMeasure: number
  measures: number
  topY: number
  bottomY: number
  height: number
}

function tripletChunks(notes: VexStaveNote[]): VexStaveNote[][] {
  const chunks: VexStaveNote[][] = []
  for (let index = 0; index + 2 < notes.length; index += 3) {
    chunks.push(notes.slice(index, index + 3))
  }
  return chunks
}

interface MeasureRender {
  voice: InstanceType<VexFlow['Voice']>
  pending: PendingNote[]
  tuplets: VexStaveNote[][]
}

function buildMeasureRender(
  VF: VexFlow,
  hand: Hand,
  clef: 'treble' | 'bass',
  events: readonly NoteEvent[],
  firstIndex: number,
  activeSet: ReadonlySet<number>,
): MeasureRender {
  const pending = events.map((event, offset) =>
    createNote(VF, event, firstIndex + offset, activeSet, clef),
  )
  const notes = pending.map((item) => item.note)
  const tuplets: VexStaveNote[][] = []

  // Los tresillos se dibujan por grupos de tres notas consecutivas que
  // comparten la marca `tuplet`. Si una voz mezcla tresillos y figuras
  // normales, los grupos se arman solo con las notas marcadas.
  let run: VexStaveNote[] = []
  for (let index = 0; index < events.length; index += 1) {
    const event = events[index]
    const note = notes[index]
    if (event === undefined || note === undefined) continue
    if (event.value.tuplet === 'triplet') {
      run.push(note)
      continue
    }
    if (run.length > 0) {
      tuplets.push(...tripletChunks(run))
      run = []
    }
  }
  if (run.length > 0) tuplets.push(...tripletChunks(run))

  if (notes.length === 0) {
    notes.push(createRest(VF, hand, clef))
  }

  const voice = new VF.Voice('4/4').setStrict(false)
  voice.addTickables(notes)
  return { voice, pending, tuplets }
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
    onNoteClick,
  } = options

  const measureCount = Math.max(
    1,
    grandStaffMeasureCount(right, left),
  )
  const layout = grandStaffLayout(measureCount, width)
  const renderWidth = Math.max(280, Math.round(width))
  container.replaceChildren()

  const rightEvents = eventsByMeasure(right)
  const leftEvents = eventsByMeasure(left)
  const activeSet = new Set(activeNotes)
  const rightKey = right === undefined ? 'C' : scoreKeySignature(right)
  const leftKey = left === undefined ? 'C' : scoreKeySignature(left)
  const rightClef = right?.clef === 'bass' ? 'bass' : 'treble'
  const leftClef = left?.clef === 'treble' ? 'treble' : 'bass'
  const rightTime = right?.timeSignature ?? left?.timeSignature
  const timeSignature =
    rightTime === undefined
      ? '4/4'
      : `${rightTime.numerator}/${rightTime.denominator}`

  // Cada sistema reserva el alto que necesitan sus notas extremas. Así una
  // nota muy grave de la mano izquierda o muy aguda de la derecha no queda
  // fuera del `viewBox`.
  const systemLayouts: SystemLayout[] = []
  for (let system = 0; system < layout.systems; system += 1) {
    const startMeasure = system * layout.perSystem + 1
    const systemMeasures = Math.min(
      layout.perSystem,
      measureCount - (startMeasure - 1),
    )
    if (systemMeasures <= 0) continue

    const rightInputs: VerticalNoteInput[] = []
    const leftInputs: VerticalNoteInput[] = []
    for (let offset = 0; offset < systemMeasures; offset += 1) {
      const measure = startMeasure + offset
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
      startMeasure,
      measures: systemMeasures,
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
  let globalIndex = 0
  let yOffset = 0

  for (let system = 0; system < systemLayouts.length; system += 1) {
    const systemLayout = systemLayouts[system]
    if (systemLayout === undefined) continue
    const { startMeasure, measures: systemMeasures, topY, bottomY } =
      systemLayout

    const widths = distributeMeasureWidths(
      layout.available,
      systemMeasures,
    )
    const systemTopY = yOffset + topY
    const systemBottomY = yOffset + bottomY
    let x = GRAND_STAFF_MARGIN

    for (let offset = 0; offset < systemMeasures; offset += 1) {
      const measure = startMeasure + offset
      const measureWidth = widths[offset] ?? GRAND_STAFF_MIN_MEASURE_WIDTH
      const firstOfSystem = offset === 0
      const firstOfPiece = system === 0 && firstOfSystem

      const top = new VF.Stave(x, systemTopY, measureWidth)
      const bottom = new VF.Stave(x, systemBottomY, measureWidth)
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

      const rightMeasure = buildMeasureRender(
        VF,
        'right',
        rightClef,
        rightEvents.get(measure) ?? [],
        globalIndex,
        activeSet,
      )
      globalIndex += rightMeasure.pending.length
      const leftMeasure = buildMeasureRender(
        VF,
        'left',
        leftClef,
        leftEvents.get(measure) ?? [],
        globalIndex,
        activeSet,
      )
      globalIndex += leftMeasure.pending.length

      if (rightMeasure.pending.length > 0) {
        VF.Accidental.applyAccidentals([rightMeasure.voice], rightKey)
      }
      if (leftMeasure.pending.length > 0) {
        VF.Accidental.applyAccidentals([leftMeasure.voice], leftKey)
      }

      new VF.Formatter()
        .joinVoices([rightMeasure.voice])
        .formatToStave([rightMeasure.voice], top, { alignRests: false })
      new VF.Formatter()
        .joinVoices([leftMeasure.voice])
        .formatToStave([leftMeasure.voice], bottom, { alignRests: false })

      rightMeasure.voice.draw(context, top)
      leftMeasure.voice.draw(context, bottom)

      for (const tupletNotes of rightMeasure.tuplets) {
        new VF.Tuplet(tupletNotes, { numNotes: 3, notesOccupied: 2 })
          .setContext(context)
          .draw()
      }
      for (const tupletNotes of leftMeasure.tuplets) {
        new VF.Tuplet(tupletNotes, { numNotes: 3, notesOccupied: 2 })
          .setContext(context)
          .draw()
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
        pending: rightMeasure.pending,
        notation,
        onNoteClick,
        rendered,
      })
      collectMeasureNotes({
        container,
        hand: 'left',
        measure,
        pending: leftMeasure.pending,
        notation,
        onNoteClick,
        rendered,
      })

      x += measureWidth
    }

    yOffset += systemLayout.height
  }

  return { notes: rendered, height: yOffset, systems: layout.systems }
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
