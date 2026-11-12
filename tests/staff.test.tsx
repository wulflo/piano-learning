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
    expect(result).toEqual([])
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
    expect(result).toHaveLength(2)
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
    expect(result).toHaveLength(3)
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
    expect(result).toHaveLength(3)
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
    expect(result[0].highlighted).toBe(false)
    expect(result[1].highlighted).toBe(true)
    const notes = container.querySelectorAll('[data-staff-note]')
    expect(notes[1].getAttribute('data-highlighted')).toBe('true')
    expect(container.querySelector('svg')).not.toBeNull()
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
      ).resolves.toHaveLength(1)
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

  it('respeta el ancho mínimo de 320 px', async () => {
    const container = document.createElement('div')
    await renderStaff(container, { measures: [measure('C4')], width: 320 })
    const svg = container.querySelector('svg')
    expect(svg).not.toBeNull()
    expect(Number(svg?.getAttribute('width'))).toBeGreaterThanOrEqual(320)
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
