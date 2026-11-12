import { useMemo } from 'react'
import { midiNameWithOctave } from '../notation'
import { useSettings } from '../state/settings'
import {
  analyzeVoiceLeading,
  type VoiceLeadingChord,
  type VoiceLeadingIssueKind,
} from '../theory/voice-leading'

/**
 * Feedback de conducción de voces para el reproductor de progresiones.
 *
 * Muestra las quintas y octavas paralelas que detecta el motor entre acordes
 * consecutivos y una propuesta de voicing que las evita. Es solo lectura: no
 * altera la reproducción y no consume repeticiones.
 */

export interface VoiceLeadingPanelProps {
  chords: readonly VoiceLeadingChord[]
}

function notesOf(midis: readonly number[], notation: 'c' | 'do'): string {
  return midis.map((midi) => midiNameWithOctave(midi, notation)).join(' · ')
}

export function VoiceLeadingPanel({ chords }: VoiceLeadingPanelProps) {
  const { settings, t } = useSettings()
  const analysis = useMemo(() => analyzeVoiceLeading(chords), [chords])

  const issueLabel: Record<VoiceLeadingIssueKind, string> = {
    'parallel-fifths': 'lesson.exercise.voiceLeadingFifths',
    'parallel-octaves': 'lesson.exercise.voiceLeadingOctaves',
  }

  return (
    <section
      className="voice-leading-panel"
      aria-label={t('lesson.exercise.voiceLeading')}
    >
      <h4>{t('lesson.exercise.voiceLeading')}</h4>
      <p className="muted">{t('lesson.exercise.voiceLeadingHint')}</p>

      {analysis.issues.length === 0 ? (
        <p className="voice-leading-clean">
          {t('lesson.exercise.voiceLeadingClean')}
        </p>
      ) : (
        <>
          <p className="voice-leading-count">
            {t('lesson.exercise.voiceLeadingCount', {
              count: analysis.issues.length,
            })}
          </p>
          <ul className="voice-leading-issues">
            {analysis.issues.map((issue) => (
              <li
                key={`${issue.fromIndex}-${issue.toIndex}-${issue.voices.join('-')}`}
              >
                {t(issueLabel[issue.kind], {
                  from: issue.fromLabel,
                  to: issue.toLabel,
                  a: issue.voices[0] + 1,
                  b: issue.voices[1] + 1,
                })}
              </li>
            ))}
          </ul>

          {analysis.changed.length > 0 ? (
            <div className="voice-leading-suggestion">
              <p>{t('lesson.exercise.voiceLeadingSuggestion')}</p>
              <ul>
                {analysis.changed.map((index) => (
                  <li key={`${index}-${analysis.suggestions[index].label}`}>
                    <strong>{analysis.suggestions[index].label}</strong>{' '}
                    {notesOf(
                      analysis.suggestions[index].midis,
                      settings.notation,
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="muted">
              {t('lesson.exercise.voiceLeadingNoAlternative')}
            </p>
          )}
        </>
      )}
    </section>
  )
}
