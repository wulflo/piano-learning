import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  title: string
  message: string
  retryLabel: string
}

interface ErrorBoundaryState {
  error: Error | null
}

/** Evita que un fallo de audio, pentagrama o UI deje la app en blanco. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Error no controlado en la demo', error, info.componentStack)
  }

  private retry = () => {
    this.setState({ error: null })
  }

  render() {
    if (this.state.error) {
      return (
        <section className="panel error-panel" role="alert">
          <h2>{this.props.title}</h2>
          <p>{this.props.message}</p>
          <button type="button" className="button-primary" onClick={this.retry}>
            {this.props.retryLabel}
          </button>
        </section>
      )
    }
    return this.props.children
  }
}
