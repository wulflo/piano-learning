import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Keyboard } from '../src/components/Keyboard'
import { SettingsPanel } from '../src/components/SettingsPanel'
import { fingeringFor } from '../src/keyboard/fingering'
import {
  DEFAULT_SETTINGS,
  normalizeSettings,
  saveSettings,
  SettingsProvider,
  useSettings,
} from '../src/state/settings'

function MemoryStorage() {
  const map = new Map<string, string>()
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, value),
    removeItem: (key: string) => void map.delete(key),
    clear: () => map.clear(),
    key: () => null,
    get length() {
      return map.size
    },
  } as Storage
}

describe('componente de teclado', () => {
  it('renderiza tres octavas con nombres accesibles', () => {
    render(
      <SettingsProvider initialSettings={DEFAULT_SETTINGS}>
        <Keyboard />
      </SettingsProvider>,
    )
    const keys = screen.getAllByRole('button', { name: /tecla (blanca|negra)/i })
    expect(keys).toHaveLength(36)
    expect(screen.getByRole('button', { name: /C3, tecla blanca/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /C♯3, tecla negra/i })).toBeInTheDocument()
  })

  it('dispara note on/off con puntero y no deja notas trabadas', () => {
    const events: string[] = []
    render(
      <SettingsProvider initialSettings={DEFAULT_SETTINGS}>
        <Keyboard
          onNoteOn={(midi) => events.push(`on:${midi}`)}
          onNoteOff={(midi) => events.push(`off:${midi}`)}
        />
      </SettingsProvider>,
    )
    const c4 = screen.getByRole('button', { name: /C4, tecla blanca/i })

    act(() => {
      c4.dispatchEvent(
        new PointerEvent('pointerdown', { bubbles: true, pointerId: 1, pointerType: 'touch' }),
      )
    })
    expect(events).toEqual(['on:60'])
    expect(c4).toHaveAttribute('aria-pressed', 'true')

    act(() => {
      c4.dispatchEvent(
        new PointerEvent('pointerup', { bubbles: true, pointerId: 1, pointerType: 'touch' }),
      )
    })
    expect(events).toEqual(['on:60', 'off:60'])
    expect(c4).toHaveAttribute('aria-pressed', 'false')
  })

  it('soporta multitáctil y libera solo el puntero que termina', () => {
    const active = new Set<number>()
    render(
      <SettingsProvider initialSettings={DEFAULT_SETTINGS}>
        <Keyboard
          onNoteOn={(midi) => active.add(midi)}
          onNoteOff={(midi) => active.delete(midi)}
        />
      </SettingsProvider>,
    )
    const c4 = screen.getByRole('button', { name: /C4, tecla blanca/i })
    const d4 = screen.getByRole('button', { name: /D4, tecla blanca/i })

    act(() => {
      c4.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1 }))
      d4.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 2 }))
    })
    expect([...active].sort()).toEqual([60, 62])
    act(() => {
      c4.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 1 }))
    })
    expect([...active]).toEqual([62])
    expect(d4).toHaveAttribute('aria-pressed', 'true')
  })

  it('mapea el teclado de computadora y respeta el remapeo', () => {
    const events: number[] = []
    const remapped = {
      ...DEFAULT_SETTINGS,
      computerKeys: { q: 60 },
    }

    render(
      <SettingsProvider initialSettings={remapped}>
        <Keyboard onNoteOn={(midi) => events.push(midi)} />
      </SettingsProvider>,
    )

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'q', bubbles: true }))
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'q', bubbles: true }))
    })
    expect(events).toEqual([60])

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }))
    })
    expect(events).toEqual([60])
  })

  it('cambia las etiquetas con la notación global', () => {
    render(
      <SettingsProvider initialSettings={{ ...DEFAULT_SETTINGS, notation: 'do' }}>
        <Keyboard />
      </SettingsProvider>,
    )
    expect(screen.getByRole('button', { name: /Do3, tecla blanca/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Re3, tecla blanca/i })).toBeInTheDocument()
  })

  it('expone el resaltado en el atributo y en la etiqueta accesible', () => {
    render(
      <SettingsProvider initialSettings={DEFAULT_SETTINGS}>
        <Keyboard highlighted={[60]} />
      </SettingsProvider>,
    )
    const c4 = screen.getByRole('button', { name: /C4, tecla blanca, resaltada/i })
    expect(c4).toHaveAttribute('data-highlighted', 'true')
    expect(c4.querySelector('.key-highlight')).toBeNull()
  })

  it('navega con flechas entre teclas', () => {
    render(
      <SettingsProvider initialSettings={DEFAULT_SETTINGS}>
        <Keyboard />
      </SettingsProvider>,
    )
    const c3 = screen.getByRole('button', { name: /C3, tecla blanca/i })
    const cSharp3 = screen.getByRole('button', { name: /C♯3, tecla negra/i })
    act(() => c3.focus())
    act(() => {
      c3.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    })
    expect(cSharp3).toHaveFocus()
  })

  it('normaliza, limita y persiste ajustes', () => {
    expect(normalizeSettings({ notation: 'do', tempo: 999, volumeDb: -100 }).tempo).toBe(240)
    expect(normalizeSettings({ notation: 'do', tempo: 999, volumeDb: -100 }).volumeDb).toBe(-40)
    expect(normalizeSettings({ language: 'fr' }).language).toBe('es')
    expect(normalizeSettings(null).notation).toBe('c')
    expect(normalizeSettings({}).showFingering).toBe(true)
    expect(normalizeSettings({ showFingering: false }).showFingering).toBe(false)

    const storage = MemoryStorage()
    saveSettings({ ...DEFAULT_SETTINGS, notation: 'do', tempo: 120 }, storage)
    expect(JSON.parse(storage.getItem('pdc.settings.v1') ?? '{}')).toMatchObject({
      notation: 'do',
      tempo: 120,
    })
  })

  it('propaga cambios del contexto', () => {
    function Probe() {
      const { settings, updateSettings } = useSettings()
      return (
        <button type="button" onClick={() => updateSettings({ notation: 'do' })}>
          {settings.notation}
        </button>
      )
    }
    render(
      <SettingsProvider initialSettings={DEFAULT_SETTINGS}>
        <Probe />
      </SettingsProvider>,
    )
    const button = screen.getByRole('button', { name: 'c' })
    act(() => button.click())
    expect(screen.getByRole('button', { name: 'do' })).toBeInTheDocument()
  })

  it('remapea y persiste la tecla de una nota desde el panel', async () => {
    const user = userEvent.setup()
    const storage = MemoryStorage()
    render(
      <SettingsProvider initialSettings={DEFAULT_SETTINGS} storage={storage}>
        <SettingsPanel />
      </SettingsProvider>,
    )

    const input = screen.getByRole('textbox', { name: /Tecla para C4/i })
    await user.click(input)
    await user.keyboard('q')

    await waitFor(() => {
      const saved = JSON.parse(storage.getItem('pdc.settings.v1') ?? '{}')
      expect(saved.computerKeys.q).toBe(60)
      expect(saved.computerKeys.a).toBeUndefined()
    })
  })

  it('cambia la notación desde el panel y la refleja en el teclado', async () => {
    const user = userEvent.setup()
    render(
      <SettingsProvider initialSettings={DEFAULT_SETTINGS}>
        <SettingsPanel />
        <Keyboard />
      </SettingsProvider>,
    )
    await user.selectOptions(screen.getByLabelText('Notación'), 'do')
    expect(screen.getByRole('button', { name: /Do3, tecla blanca/i })).toBeInTheDocument()
  })

  it('muestra la digitacion con numero de dedo y mano D/I en las teclas', () => {
    render(
      <SettingsProvider initialSettings={DEFAULT_SETTINGS}>
        <Keyboard fingering={fingeringFor([60], { mode: 'note', hand: 'right' })} />
      </SettingsProvider>,
    )
    const c4 = screen.getByRole('button', { name: /C4, tecla blanca/i })
    expect(c4).toHaveAttribute('data-fingering', 'true')
    expect(c4.querySelector('.key-fingering')).not.toBeNull()
    expect(c4.querySelector('.key-fingering-finger')).toHaveTextContent('1')
    expect(c4.querySelector('.key-fingering-hand')).toHaveTextContent('D')
    expect(c4.querySelector('.key-fingering')).toHaveAttribute('data-hand', 'right')
    expect(c4.querySelector('.key-computer')).toBeNull()
    expect(screen.getByText(/dedos 1 a 5/i)).toBeInTheDocument()
  })

  it('usa la mano izquierda con el dedo y la abreviatura I', () => {
    render(
      <SettingsProvider initialSettings={DEFAULT_SETTINGS}>
        <Keyboard fingering={fingeringFor([60], { mode: 'note', hand: 'left' })} />
      </SettingsProvider>,
    )
    const c4 = screen.getByRole('button', { name: /C4, tecla blanca/i })
    expect(c4.querySelector('.key-fingering-finger')).toHaveTextContent('5')
    expect(c4.querySelector('.key-fingering-hand')).toHaveTextContent('I')
    expect(c4.querySelector('.key-fingering')).toHaveAttribute('data-hand', 'left')
  })

  it('oculta la digitación cuando el ajuste está desactivado', () => {
    render(
      <SettingsProvider
        initialSettings={{ ...DEFAULT_SETTINGS, showFingering: false }}
      >
        <Keyboard fingering={fingeringFor([60], { mode: 'note', hand: 'right' })} />
      </SettingsProvider>,
    )
    const c4 = screen.getByRole('button', { name: /C4, tecla blanca/i })
    expect(c4.querySelector('.key-fingering')).toBeNull()
    expect(c4).not.toHaveAttribute('data-fingering')
    expect(screen.queryByText(/dedos 1 a 5/i)).toBeNull()
  })

  it('permite activar y desactivar la digitación desde Ajustes', async () => {
    const user = userEvent.setup()
    render(
      <SettingsProvider initialSettings={DEFAULT_SETTINGS}>
        <SettingsPanel />
        <Keyboard fingering={fingeringFor([60], { mode: 'note', hand: 'right' })} />
      </SettingsProvider>,
    )
    expect(screen.getByText(/dedos 1 a 5/i)).toBeInTheDocument()
    await user.click(screen.getByLabelText('Mostrar digitación'))
    expect(screen.queryByText(/dedos 1 a 5/i)).toBeNull()
    await user.click(screen.getByLabelText('Mostrar digitación'))
    expect(screen.getByText(/dedos 1 a 5/i)).toBeInTheDocument()
  })
})
