import { Component } from 'react'

/**
 * Admin error boundary.
 *
 * React only recovers from a render-phase throw at an error boundary, and
 * without one a single bad row (or a lazy chunk that failed to download) tears
 * the whole tree down and leaves a blank white page with nothing in the console
 * the user can act on. The panel is the one surface where a silent blank is not
 * acceptable: the operator needs to know *what* broke and how to get back.
 *
 * This sits above `AdminAuthProvider` in `AdminRoot`, so it catches errors from
 * the provider itself as well as from every screen rendered through the outlet
 * — including rejected `React.lazy` imports.
 */
export default class AdminErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // Surfaced for anyone debugging with devtools open; the rendered fallback
    // below is what the operator actually sees.
    console.error('[FootballTrix Admin] screen crashed', error, info)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleBack = () => {
    window.location.assign('/admin/dashboard')
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    const detail = String(error?.stack || error?.message || error || 'Unknown error')

    return (
      <div className="min-h-screen bg-ink-50 px-5 py-16 dark:bg-ink-950">
        <div className="mx-auto max-w-2xl rounded-2xl border border-rose-200 bg-white p-7 shadow-sm dark:border-rose-900/60 dark:bg-ink-900">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-rose-600 dark:text-rose-400">
            Admin panel error
          </p>
          <h1 className="mt-2 text-xl font-black text-ink-950 dark:text-white">
            This screen failed to render
          </h1>
          <p className="mt-2 text-sm text-ink-600 dark:text-ink-400">
            The rest of the panel is intact. Reload to retry, or return to the
            dashboard. If it keeps happening, copy the details below.
          </p>

          <pre
            role="alert"
            className="mt-5 max-h-64 overflow-auto rounded-xl bg-ink-950 p-4 text-[12px] leading-relaxed text-ink-200"
          >
            {detail.slice(0, 4000)}
          </pre>

          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={this.handleReload} className="adm-btn">
              Reload the page
            </button>
            <button type="button" onClick={this.handleBack} className="adm-btn-outline">
              Back to dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }
}
