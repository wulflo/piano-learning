import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Staff } from '../src/components/Staff'
import { describeStaffNotes, renderStaff, type StaffMeasure } from '../src/staff/render'
import { pitchToVexKey } from '../src/staff/vex'
import { DEFAULT_SETTINGS, SettingsProvider, useSettings } from '../src/state/settings'
import { parsePitch } from '../src/theory/pitch'

function measure(name: string, duration: StaffMeasure['duration'] = 'q'): StaffMeasure {
  return { id: name, pitches: [parsePitch(name)], duration }
}

/** Secuencia densa que no cabe en el ancho pedido. */
function denseMeasures(count: number): StaffMeasure[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `dense.${index}`,
    pitches: [parsePitch('C4')],
    duration: '32' as const,
  }))
}

describe('conversión a VexFlow', () => {
  it('convierte notas y alteraciones a claves de VexFlow', () => {
    expect(pitchToVexKey(parsePitch('C4'))).toBe('c/4')
    expect(pitchToVexKey(parsePitch('F#4'))).toBe('f#/4')
    expect(pitchToVexKey(parsePitch('Eb4'))).toBe('eb/4')
    expect(pitchToVexKey(parsePitch('Bbb3'))).toBe('bbb/3')
    expect(pitchToVexKey(parsePitch('C##5'))).toBe('c##/5')
  })

  it('describe las notas en ambas notaciones', () => {
    const measures = [measure('C4'), measure('E4'), measure('G4')]
    expect(describeStaffNotes(measures, 'c')).toBe('C4 · E4 · G4')
    expect(describeStaffNotes(measures, 'do')).toBe('Do4 · Mi4 · Sol4')
  })
})

describe('renderStaff con VexFlow', () => {
  it('dibuja un pentagrama vacío sin errores', async () => {
    const container = document.createElement('div')
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const result = await renderStaff(container, { measures: [] })
    expect(container.querySelector('svg')).not.toBeNull()
    expect(result.notes).toEqual([])
    expect(errorSpy).not.toHaveBeenCalled()
    errorSpy.mockRestore()
  })

  it('dibuja notas, acordes y referencias accesibles', async () => {
    const container = document.createElement('div')
    const result = await renderStaff(container, {
      measures: [
        measure('C4'),
        { id: 'chord', pitches: ['E4', 'G4', 'C5'].map(parsePitch) },
      ],
      clef: 'treble',
      keySignature: 'C',
      timeSignature: '4/4',
    })
    expect(result.notes).toHaveLength(2)
    const notes = container.querySelectorAll('[data-staff-note]')
    expect(notes).toHaveLength(2)
    expect(notes[0].getAttribute('aria-label')).toBe('C4')
    expect(notes[1].getAttribute('data-midi')).toBe('64,67,72')
    expect(notes[0].getAttribute('tabindex')).toBe('0')
    expect(notes[0].getAttribute('role')).toBe('button')
    expect(container.querySelector('svg')).not.toBeNull()
  })

  it('dibuja marcas de pedal sin perder las referencias de las notas', async () => {
    const container = document.createElement('div')
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const result = await renderStaff(container, {
      measures: [
        { ...measure('C4'), pedalPress: true },
        { ...measure('F4'), pedalRelease: true, pedalPress: true },
        { ...measure('G4'), pedalRelease: true },
      ],
    })
    expect(result.notes).toHaveLength(3)
    expect(container.querySelectorAll('[data-staff-note]')).toHaveLength(3)
    const text = container.textContent ?? ''
    expect(text).toContain('Ped.')
    expect(text).toContain('*')
    expect(errorSpy).not.toHaveBeenCalled()
    errorSpy.mockRestore()
  })

  it('dibuja los cifrados encima de las notas sin perder las referencias', async () => {
    const container = document.createElement('div')
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const result = await renderStaff(container, {
      measures: [
        { ...measure('C4'), chordSymbol: 'C' },
        { ...measure('F4'), chordSymbol: 'F' },
        { ...measure('G4'), chordSymbol: 'G7' },
      ],
    })
    expect(result.notes).toHaveLength(3)
    expect(container.querySelectorAll('[data-staff-note]')).toHaveLength(3)
    const text = container.textContent ?? ''
    expect(text).toContain('C')
    expect(text).toContain('F')
    expect(text).toContain('G7')
    expect(errorSpy).not.toHaveBeenCalled()
    errorSpy.mockRestore()
  })

  it('emite click y teclado por nota', async () => {
    const container = document.createElement('div')
    const onNoteClick = vi.fn()
    await renderStaff(container, {
      measures: [measure('C4'), measure('D4')],
      onNoteClick,
    })
    const notes = container.querySelectorAll('[data-staff-note]')
    notes[0].dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(onNoteClick).toHaveBeenCalledWith({ index: 0, midis: [60], id: 'C4' })

    notes[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    expect(onNoteClick).toHaveBeenCalledWith({ index: 1, midis: [62], id: 'D4' })
  })

  it('resalta notas activas y respeta clave, armadura y compás', async () => {
    const container = document.createElement('div')
    const result = await renderStaff(container, {
      measures: [measure('C4'), measure('F#4')],
      clef: 'bass',
      keySignature: 'D',
      timeSignature: '3/4',
      activeNotes: [66],
    })
    expect(result.notes[0].highlighted).toBe(false)
    expect(result.notes[1].highlighted).toBe(true)
    const notes = container.querySelectorAll('[data-staff-note]')
    expect(notes[1].getAttribute('data-highlighted')).toBe('true')
    expect(container.querySelector('svg')).not.toBeNull()
  })

  it('no enciende todas las repeticiones cuando solo hay MIDI activo', async () => {
    const container = document.createElement('div')
    const result = await renderStaff(container, {
      measures: [
        { id: 'ev.1', pitches: [parsePitch('C4')] },
        { id: 'ev.2', pitches: [parsePitch('C4')] },
        { id: 'ev.3', pitches: [parsePitch('C4')] },
      ],
      activeNotes: [60],
    })
    expect(result.notes.map((note) => note.highlighted)).toEqual([
      true,
      false,
      false,
    ])
  })

  it('elige la ocurrencia repetida cuyo id está activo', async () => {
    const container = document.createElement('div')
    const result = await renderStaff(container, {
      measures: [
        { id: 'ev.1', pitches: [parsePitch('C4')] },
        { id: 'ev.2', pitches: [parsePitch('C4')] },
        { id: 'ev.3', pitches: [parsePitch('C4')] },
      ],
      activeNotes: [60],
      activeIds: ['ev.2'],
    })
    expect(result.notes.map((note) => note.highlighted)).toEqual([
      false,
      true,
      false,
    ])
  })

  it('renderiza las 15 armaduras sin lanzar', async () => {
    const containers: HTMLDivElement[] = []
    for (const key of [
      'Cb', 'Gb', 'Db', 'Ab', 'Eb', 'Bb', 'F', 'C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#',
    ]) {
      const container = document.createElement('div')
      containers.push(container)
      await expect(
        renderStaff(container, {
          measures: [measure('C4')],
          keySignature: key,
        }),
      ).resolves.toBeDefined()
    }
    expect(containers.every((container) => container.querySelector('svg'))).toBe(true)
  })

  it('dibuja Do central en clave de sol y de fa', async () => {
    for (const clef of ['treble', 'bass'] as const) {
      const container = document.createElement('div')
      await renderStaff(container, { measures: [measure('C4')], clef })
      expect(container.querySelector('[data-staff-note]')?.getAttribute('aria-label')).toBe(
        'C4',
      )
    }
  })

  it('posiciona cada nota según su clave', async () => {
    const maxPathY = (container: HTMLDivElement): number => {
      const note = container.querySelector('[data-staff-note]')
      const values = [...(note?.querySelectorAll('path') ?? [])].flatMap((path) =>
        [...(path.getAttribute('d') ?? '').matchAll(/[ML]\s*[\d.]+\s+([\d.]+)/g)].map(
          (match) => Number(match[1]),
        ),
      )
      return Math.max(...values)
    }

    // Con la clave correcta Do2 queda en la segunda línea adicional (y≈134).
    // Si el renderizador usara siempre clave de sol, bajaría hasta y≈194.
    const bass = document.createElement('div')
    const bassResult = await renderStaff(bass, {
      measures: [measure('C2')],
      clef: 'bass',
    })
    const treble = document.createElement('div')
    await renderStaff(treble, { measures: [measure('C2')], clef: 'treble' })

    expect(maxPathY(bass)).toBeLessThan(150)
    expect(maxPathY(treble)).toBeGreaterThan(180)
    expect(bassResult.height).toBe(180)
  })

  it('amplía la altura cuando una nota queda muy por debajo del pentagrama', async () => {
    const container = document.createElement('div')
    const result = await renderStaff(container, {
      measures: [measure('C1')],
      clef: 'bass',
    })
    const svg = container.querySelector('svg')
    expect(result.height).toBeGreaterThan(190)
    expect(Number(svg?.getAttribute('height'))).toBe(result.height)
    expect(svg?.getAttribute('viewBox')).toBe(`0 0 640 ${result.height}`)
  })

  it('respeta el ancho mínimo de 320 px', async () => {
    const container = document.createElement('div')
    await renderStaff(container, { measures: [measure('C4')], width: 320 })
    const svg = container.querySelector('svg')
    expect(svg).not.toBeNull()
    expect(Number(svg?.getAttribute('width'))).toBeGreaterThanOrEqual(320)
  })

  it('amplía el ancho cuando el contenido no entra y lo mantiene dentro', async () => {
    const container = document.createElement('div')
    const result = await renderStaff(container, {
      measures: denseMeasures(32),
      width: 400,
    })

    expect(result.width).toBeGreaterThan(400)
    const svg = container.querySelector('svg')
    expect(Number(svg?.getAttribute('width'))).toBe(result.width)

    const stave = container.querySelector('[data-staff-stave]')
    expect(stave).not.toBeNull()
    const staveX = Number(stave?.getAttribute('data-stave-x'))
    const staveWidth = Number(stave?.getAttribute('data-stave-width'))
    const notes = Array.from(container.querySelectorAll('[data-staff-note]'))
    expect(notes).toHaveLength(32)
    for (const note of notes) {
      const x = Number(note.getAttribute('data-box-x'))
      const width = Number(note.getAttribute('data-box-width'))
      expect(Number.isFinite(x) && Number.isFinite(width)).toBe(true)
      expect(x).toBeGreaterThanOrEqual(staveX - 0.5)
      expect(x + width).toBeLessThanOrEqual(staveX + staveWidth + 0.5)
    }
  })
})

describe('componente Staff', () => {
  it('cambia de C-D-E a Do-Re-Mi en caliente', async () => {
    const user = userEvent.setup()
    const measures = [measure('C4'), measure('E4'), measure('G4')]

    function Harness() {
      const { updateSettings } = useSettings()
      return (
        <>
          <button type="button" onClick={() => updateSettings({ notation: 'do' })}>
            cambiar
          </button>
          <Staff measures={measures} />
        </>
      )
    }

    render(
      <SettingsProvider initialSettings={DEFAULT_SETTINGS}>
        <Harness />
      </SettingsProvider>,
    )
    await waitFor(() => expect(screen.getByText(/C4 · E4 · G4/)).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: 'cambiar' }))
    await waitFor(() => expect(screen.getByText(/Do4 · Mi4 · Sol4/)).toBeInTheDocument())
  })

  it('usa Do-Re-Mi cuando el contexto lo indica', async () => {
    const measures = [measure('C4'), measure('E4')]
    render(
      <SettingsProvider initialSettings={{ ...DEFAULT_SETTINGS, notation: 'do' }}>
        <Staff measures={measures} label="Pentagrama de prueba" />
      </SettingsProvider>,
    )
    await waitFor(() =>
      expect(screen.getByText(/Do4 · Mi4/)).toBeInTheDocument(),
    )
    expect(screen.getByText(/clave de sol/i)).toBeInTheDocument()
  })

  it('no rompe la app si el render falla', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const bad = {
      id: 'bad',
      pitches: [parsePitch('C4')],
      duration: 'z' as never,
    }
    render(
      <SettingsProvider initialSettings={DEFAULT_SETTINGS}>
        <Staff measures={[bad]} />
      </SettingsProvider>,
    )
    await waitFor(() =>
      expect(screen.getByText(/No se pudo dibujar|no se pudo dibujar/i)).toBeInTheDocument(),
    )
    errorSpy.mockRestore()
  })

  it('aplica zoom 200 % con desplazamiento', async () => {
    const measures = [measure('C4')]
    const { container } = render(
      <SettingsProvider initialSettings={DEFAULT_SETTINGS}>
        <Staff measures={measures} zoom={2} />
      </SettingsProvider>,
    )
    await waitFor(() => expect(container.querySelector('.staff-canvas svg')).not.toBeNull())
    const zoom = container.querySelector('.staff-zoom') as HTMLElement
    expect(zoom.style.width).not.toBe('')
    expect(zoom.style.height).not.toBe('')
  })

  it('el componente reserva el ancho real de un pentagrama denso', async () => {
    const { container } = render(
      <SettingsProvider initialSettings={DEFAULT_SETTINGS}>
        <Staff measures={denseMeasures(48)} />
      </SettingsProvider>,
    )

    await waitFor(() => {
      const canvas = container.querySelector('.staff-canvas') as HTMLElement | null
      expect(canvas).not.toBeNull()
      expect(Number.parseFloat(canvas?.style.width ?? '0')).toBeGreaterThan(640)
    })
    const zoom = container.querySelector('.staff-zoom') as HTMLElement
    const canvas = container.querySelector('.staff-canvas') as HTMLElement
    expect(zoom.style.width).toBe(canvas.style.width)
  })

  it('cambia la armadura en caliente sin recargar', async () => {
    const measures = [measure('C4')]
    const { container, rerender } = render(
      <SettingsProvider initialSettings={DEFAULT_SETTINGS}>
        <Staff measures={measures} keySignature="C" />
      </SettingsProvider>,
    )
    await waitFor(() => expect(container.querySelector('.staff-canvas svg')).not.toBeNull())

    rerender(
      <SettingsProvider initialSettings={DEFAULT_SETTINGS}>
        <Staff measures={measures} keySignature="D" />
      </SettingsProvider>,
    )
    await waitFor(() => expect(container.querySelector('.staff-canvas svg')).not.toBeNull())

    rerender(
      <SettingsProvider initialSettings={DEFAULT_SETTINGS}>
        <Staff measures={measures} keySignature="Cb" />
      </SettingsProvider>,
    )
    await waitFor(() => expect(container.querySelector('.staff-canvas svg')).not.toBeNull())
  })
})
