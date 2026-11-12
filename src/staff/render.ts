import type { Notation } from '../notation'
import { midiNameWithOctave } from '../notation'
import { midiOf, type Pitch } from '../theory/pitch'
import { createHighlightPlanner } from './highlight'
import { verticalExtent } from './layout'
import { pitchToVexKey, type StaffDuration } from './vex'

export interface StaffMeasure {
  /** Identificador estable para tests y eventos. */
  id?: string
  /** Una nota o varias para un acorde. */
  pitches: Pitch[]
  duration?: StaffDuration
  highlighted?: boolean
  /** Marca `Ped.` debajo de la nota cuando empieza una resonancia. */
  pedalPress?: boolean
  /** Marca `*` debajo de la nota cuando se levanta el pedal. */
  pedalRelease?: boolean
  /** Cifrado que se dibuja encima de la nota. */
  chordSymbol?: string
}

export interface RenderStaffOptions {
  measures: StaffMeasure[]
  clef?: 'treble' | 'bass'
  keySignature?: string
  timeSignature?: string
  width?: number
  height?: number
  notation?: Notation
  activeNotes?: ReadonlyArray<number>
  /**
   * Ids de los eventos que están sonando. Si se indican, solo se resaltan esas
   * ocurrencias aunque la altura se repita en la partitura.
   */
  activeIds?: ReadonlyArray<string>
  onNoteClick?: (payload: { index: number; midis: number[]; id?: string }) => void
}

export interface RenderedStaffNote {
  index: number
  id?: string
  midis: number[]
  highlighted: boolean
  element?: SVGElement
}

export interface RenderedStaff {
  notes: RenderedStaffNote[]
  /** Altura real usada; puede superar la pedida para que entren las notas extremas. */
  height: number
}

const NOTE_COLOR = '#1d1f23'
const STAVE_Y = 34
const EDGE_MARGIN = 8

/**
 * Dibuja un pentagrama en `container` y devuelve las referencias a las notas.
 * VexFlow se importa dinámicamente para que quede en un chunk separado.
 */
export async function renderStaff(
  container: HTMLDivElement,
  options: RenderStaffOptions,
): Promise<RenderedStaff> {
  const {
    measures,
    clef = 'treble',
    keySignature = 'C',
    timeSignature = '4/4',
    width = 640,
    height = 180,
    notation = 'c',
    activeNotes = [],
    activeIds = [],
    onNoteClick,
  } = options

  const VF = await import('vexflow')
  container.replaceChildren()

  const extent = verticalExtent(
    VF,
    measures.map((measure) => ({
      keys: measure.pitches.map(pitchToVexKey),
      duration: measure.duration ?? 'q',
      chordSymbol: measure.chordSymbol !== undefined,
      pedal: Boolean(measure.pedalPress || measure.pedalRelease),
    })),
    clef,
  )
  const minHeight = Math.max(150, Math.round(height))
  const staveY = STAVE_Y + Math.max(0, EDGE_MARGIN - (STAVE_Y + extent.top))
  const renderHeight = Math.max(minHeight, staveY + extent.bottom + EDGE_MARGIN)

  const renderer = new VF.Renderer(container, VF.Renderer.Backends.SVG)
  const renderWidth = Math.max(280, Math.round(width))
  renderer.resize(renderWidth, renderHeight)
  const context = renderer.getContext()

  const stave = new VF.Stave(10, staveY, renderWidth - 20)
  stave.addClef(clef)
  if (keySignature !== 'C') stave.addKeySignature(keySignature)
  stave.addTimeSignature(timeSignature)
  stave.setContext(context).draw()

  if (measures.length === 0) return { notes: [], height: renderHeight }

  const planner = createHighlightPlanner(
    measures.map((measure) => ({
      id: measure.id,
      midis: measure.pitches.map(midiOf),
    })),
    activeNotes,
    activeIds,
  )
  const highlightedFlags: boolean[] = []
  const vexNotes = measures.map((measure, index) => {
    const note = new VF.StaveNote({
      keys: measure.pitches.map(pitchToVexKey),
      duration: measure.duration ?? 'q',
      clef,
    })
    note.setAttribute('id', `pdc-note-${index}`)
    const midis = measure.pitches.map(midiOf)
    const active = planner.shouldHighlight({ id: measure.id, midis })
    const highlighted = Boolean(measure.highlighted) || active
    highlightedFlags.push(highlighted)
    note.addClass('vf-staff-note')
    if (measure.pedalPress) {
      const mark = new VF.Annotation('Ped.')
      mark.setVerticalJustification(VF.Annotation.VerticalJustify.BOTTOM)
      note.addModifier(mark)
    }
    if (measure.pedalRelease) {
      const mark = new VF.Annotation('*')
      mark.setVerticalJustification(VF.Annotation.VerticalJustify.BOTTOM)
      note.addModifier(mark)
    }
    if (measure.chordSymbol) {
      const symbol = new VF.ChordSymbol()
      symbol.addText(measure.chordSymbol)
      note.addModifier(symbol, 0)
    }
    return note
  })

  const voice = new VF.Voice(timeSignature).setStrict(false)
  voice.addTickables(vexNotes)
  VF.Accidental.applyAccidentals([voice], keySignature)
  new VF.Formatter().joinVoices([voice]).formatToStave([voice], stave, {
    alignRests: false,
  })
  voice.draw(context, stave)

  const references: RenderedStaffNote[] = []
  vexNotes.forEach((_note, index) => {
    const measure = measures[index]
    const element = container.querySelector(
      `#vf-pdc-note-${index}`,
    ) as SVGElement | null
    const midis = measure.pitches.map(midiOf)
    if (element) {
      element.setAttribute('data-staff-note', String(index))
      element.setAttribute('data-midi', midis.join(','))
      element.setAttribute('data-highlighted', String(highlightedFlags[index]))
      element.setAttribute('tabindex', '0')
      element.setAttribute('role', 'button')
      element.setAttribute(
        'aria-label',
        measure.pitches
          .map((pitch) => midiNameWithOctave(midiOf(pitch), notation))
          .join(', '),
      )
      const activate = () => onNoteClick?.({ index, midis, id: measure.id })
      element.addEventListener('click', activate)
      element.addEventListener('keydown', (event) => {
        const keyboardEvent = event as KeyboardEvent
        if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
          keyboardEvent.preventDefault()
          activate()
        }
      })
    }
    references.push({
      index,
      id: measure.id,
      midis,
      highlighted: highlightedFlags[index],
      element: element ?? undefined,
    })
  })

  return { notes: references, height: renderHeight }
}

export function describeStaffNotes(
  measures: StaffMeasure[],
  notation: Notation = 'c',
): string {
  return measures
    .map((measure) =>
      measure.pitches.map((pitch) => midiNameWithOctave(midiOf(pitch), notation)).join(' + '),
    )
    .join(' · ')
}

export const NOTE_COLOR_FALLBACK = NOTE_COLOR
