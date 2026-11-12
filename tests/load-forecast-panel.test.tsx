import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LoadForecastPanel } from '../src/components/LoadForecastPanel'
import type { QueueCandidate } from '../src/state/daily-queue'
import { DEFAULT_SETTINGS, SettingsProvider } from '../src/state/settings'
import { FsrsCardSchema, type FsrsCard, type FsrsState } from '../src/schemas'

const NOW = new Date('2026-03-10T12:00:00.000Z')

function card(due: string, state: FsrsState = 'review'): FsrsCard {
  return FsrsCardSchema.parse({
    due,
    stability: 2,
    difficulty: 5,
    elapsedDays: 1,
    scheduledDays: 1,
    reps: 1,
    lapses: 0,
    state,
  })
}

function memoryStorage(): Storage {
  const values = new Map<string, string>()
  return {
    get length() {
      return values.size
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => Array.from(values.keys())[index] ?? null,
    removeItem: (key) => {
      values.delete(key)
    },
    setItem: (key, value) => {
      values.set(key, value)
    },
  }
}

const CARDS = [
  card('2026-03-10T08:00:00.000Z'),
  card('2026-03-11T08:00:00.000Z'),
  card('2026-03-09T08:00:00.000Z'),
  card('2026-03-10T08:00:00.000Z', 'new'),
]

const CANDIDATES: QueueCandidate[] = [
  { itemId: 'skill.due', kind: 'note-id', card: card('2026-03-09T08:00:00.000Z') },
  { itemId: 'skill.new.1', kind: 'scale' },
  { itemId: 'skill.new.2', kind: 'note-id' },
  { itemId: 'skill.new.3', kind: 'scale' },
  { itemId: 'skill.new.4', kind: 'note-id' },
  { itemId: 'skill.new.5', kind: 'scale' },
]

function renderPanel(options: {
  cards?: readonly FsrsCard[]
  candidates?: readonly QueueCandidate[]
  language?: 'es' | 'en'
} = {}) {
  render(
    <SettingsProvider
      initialSettings={{ ...DEFAULT_SETTINGS, language: options.language ?? 'es' }}
      storage={memoryStorage()}
    >
      <LoadForecastPanel
        cards={options.cards ?? CARDS}
        candidates={options.candidates ?? CANDIDATES}
        now={NOW}
      />
    </SettingsProvider>,
  )
  return screen.getByRole('region', { name: /Previsión de carga|Workload forecast/ })
}

describe('F2-044 — Panel de previsión de carga', () => {
  it('muestra los vencimientos de siete días y los totales', () => {
    const panel = renderPanel()

    const list = within(panel).getByRole('list', { name: 'Previsión de carga' })
    expect(within(list).getAllByRole('listitem')).toHaveLength(7)
    expect(within(panel).getByText('Hoy')).toBeInTheDocument()
    expect(within(panel).getByText('Mañana')).toBeInTheDocument()
    expect(within(panel).getByText('En 2 días')).toBeInTheDocument()
    expect(within(panel).getByRole('img', { name: '2026-03-10: 1 vencimientos' })).toBeInTheDocument()
    expect(within(panel).getByRole('img', { name: '2026-03-11: 1 vencimientos' })).toBeInTheDocument()
    expect(within(panel).getByText(/Atrasados: 1/)).toBeInTheDocument()
    expect(within(panel).getByText(/Programados: 2/)).toBeInTheDocument()
    expect(within(panel).getByText(/Total a repasar: 3/)).toBeInTheDocument()
  })

  it('refleja el tope diario editable en la cola de hoy', () => {
    const panel = renderPanel()
    const status = within(panel).getByText(/Cola de hoy:/)
    const cap = within(panel).getByLabelText(/Tope diario de ítems nuevos/)

    expect(cap).toHaveValue(20)
    expect(status).toHaveTextContent('Cola de hoy: 1 vencidos + 5 nuevos = 6')

    fireEvent.change(cap, { target: { value: '2' } })
    expect(cap).toHaveValue(2)
    expect(status).toHaveTextContent('Cola de hoy: 1 vencidos + 2 nuevos = 3')

    fireEvent.change(cap, { target: { value: '4' } })
    expect(status).toHaveTextContent('Cola de hoy: 1 vencidos + 4 nuevos = 5')

    fireEvent.change(cap, { target: { value: '999' } })
    expect(cap).toHaveValue(200)
    expect(status).toHaveTextContent('Cola de hoy: 1 vencidos + 5 nuevos = 6')
  })

  it('explica que todavía no hay repasos programados', () => {
    const panel = renderPanel({ cards: [], candidates: [] })

    expect(within(panel).getByText('Todavía no hay repasos programados.')).toBeInTheDocument()
    expect(within(panel).getByText(/Cola de hoy:/)).toHaveTextContent(
      'Cola de hoy: 0 vencidos + 0 nuevos = 0',
    )
  })

  it('traduce la previsión al inglés', () => {
    const panel = renderPanel({ language: 'en' })

    expect(within(panel).getByText('Workload forecast')).toBeInTheDocument()
    expect(within(panel).getByText('Today')).toBeInTheDocument()
    expect(within(panel).getByText('Tomorrow')).toBeInTheDocument()
    expect(within(panel).getByText(/Overdue: 1/)).toBeInTheDocument()
    expect(within(panel).getByText(/Today.s queue: 1 due \+ 5 new = 6/)).toBeInTheDocument()
  })
})
