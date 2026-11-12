import { useEffect } from 'react'
import { Demo } from './components/Demo'
import { ErrorBoundary } from './components/ErrorBoundary'
import { MidiStatusBar } from './components/MidiStatusBar'
import { PwaStatus } from './components/PwaStatus'
import { AttributionsPage } from './pages/AttributionsPage'
import { CoursePage } from './pages/CoursePage'
import { LessonPage } from './pages/LessonPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { PiecePage } from './pages/PiecePage'
import { PracticePage } from './pages/PracticePage'
import { ProgressPage } from './pages/ProgressPage'
import { RepertoirePage } from './pages/RepertoirePage'
import { ReviewPage } from './pages/ReviewPage'
import { SettingsPage } from './pages/SettingsPage'
import { SongsPage } from './pages/SongsPage'
import {
  ATTRIBUTIONS_HASH,
  COURSE_HASH,
  NAV_ITEMS,
  isNavActive,
  routeTitleKey,
  type AppRoute,
} from './router/hash-route'
import { useHashRoute } from './router/useHashRoute'
import { MidiProvider } from './midi/context'
import { ProgressProvider } from './state/progress-context'
import { SettingsPersistence } from './state/settings-persistence'
import { SettingsProvider, useSettings } from './state/settings'

/** Elige la página que corresponde a la ruta actual. */
function RouteView({ route }: { route: AppRoute }) {
  switch (route.name) {
    case 'demo':
      return <Demo />
    case 'lesson':
      return <LessonPage lessonId={route.lessonId} />
    case 'repertoire':
      return <RepertoirePage />
    case 'songs':
      return <SongsPage />
    case 'piece':
      return <PiecePage pieceId={route.pieceId} />
    case 'attributions':
      return <AttributionsPage />
    case 'practice':
      return <PracticePage />
    case 'review':
      return <ReviewPage />
    case 'progress':
      return <ProgressPage />
    case 'settings':
      return <SettingsPage />
    case 'not-found':
      return <NotFoundPage path={route.path} />
    case 'course':
      return <CoursePage />
  }
}

function AppShell() {
  const { settings, t } = useSettings()
  const route = useHashRoute()

  useEffect(() => {
    document.documentElement.lang = settings.language
  }, [settings.language])

  useEffect(() => {
    const root = document.documentElement
    if (settings.theme === 'system') {
      root.removeAttribute('data-theme')
    } else {
      root.dataset.theme = settings.theme
    }
  }, [settings.theme])

  useEffect(() => {
    document.title = `${t(routeTitleKey(route))} · PianoDesdeCero`
  }, [route, t])

  const routeKey =
    route.name === 'lesson'
      ? `lesson:${route.lessonId}`
      : route.name === 'piece'
        ? `piece:${route.pieceId}`
        : route.name === 'not-found'
          ? `not-found:${route.path}`
          : route.name

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        {t('nav.skip')}
      </a>
      <header className="site-header">
        <div className="site-header-top">
          <p className="brand">
            <a href={COURSE_HASH}>
              Piano<span>DesdeCero</span>
            </a>
          </p>
        </div>

        <nav className="site-nav" aria-label={t('nav.primary')}>
          <ul>
            {NAV_ITEMS.map((item) => (
              <li key={item.id}>
                <a
                  href={item.hash}
                  aria-current={isNavActive(item, route) ? 'page' : undefined}
                >
                  {t(item.labelKey)}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <MidiStatusBar />
      <PwaStatus />

      <ErrorBoundary
        key={routeKey}
        title={t('error.title')}
        message={t('error.message')}
        retryLabel={t('error.retry')}
      >
        <div id="main-content" tabIndex={-1}>
          <RouteView route={route} />
        </div>
      </ErrorBoundary>

      <footer className="site-footer">
        <p>
          {t('app.footer')}{' '}
          <a href={ATTRIBUTIONS_HASH}>{t('app.credits')}</a>
        </p>
      </footer>
    </div>
  )
}

export interface AppProps {
  /** Nombre de la base de progreso; los tests usan uno aislado. */
  databaseName?: string
}

export function App({ databaseName }: AppProps = {}) {
  return (
    <SettingsProvider>
      <MidiProvider>
        <ProgressProvider databaseName={databaseName}>
          <SettingsPersistence />
          <AppShell />
        </ProgressProvider>
      </MidiProvider>
    </SettingsProvider>
  )
}
