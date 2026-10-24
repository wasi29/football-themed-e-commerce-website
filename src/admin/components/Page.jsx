import Icon from '../../components/ui/Icon'

/**
 * Page furniture shared by every admin screen.
 *
 * Keeping the empty / loading / error states here means each page can render
 * a consistent shape without re-deciding what a failed read looks like — and
 * because `ErrorState` prints Supabase's own message, a permission failure
 * reads as a permission failure rather than as an empty list.
 */

export function PageHeader({ title, lede, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="adm-title">{title}</h1>
        {lede && <p className="adm-lede">{lede}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  )
}

export function LoadingState({ label = 'Loading…' }) {
  return (
    <div className="adm-card adm-card-pad flex items-center gap-3 text-sm text-ink-600 dark:text-ink-400">
      <Icon name="spinner" size={17} className="animate-spin" />
      {label}
    </div>
  )
}

export function ErrorState({ error, onRetry }) {
  const message =
    typeof error === 'string' ? error : error?.message || 'Something went wrong.'
  return (
    <div className="adm-card border-flame/30 adm-card-pad">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300">
          <Icon name="alert" size={17} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-ink-950 dark:text-white">Could not load this data</p>
          <p className="mt-1 break-words text-sm leading-relaxed text-ink-600 dark:text-ink-400">
            {message}
          </p>
        </div>
        {onRetry && (
          <button type="button" onClick={onRetry} className="adm-btn-outline shrink-0">
            <Icon name="refresh" size={15} />
            Retry
          </button>
        )}
      </div>
    </div>
  )
}

export function EmptyState({ icon = 'box', title, hint, action }) {
  return (
    <div className="adm-card adm-card-pad py-12 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-400">
        <Icon name={icon} size={22} />
      </span>
      <p className="mt-4 text-sm font-bold text-ink-950 dark:text-white">{title}</p>
      {hint && <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-ink-600 dark:text-ink-400">{hint}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  )
}

/** Small labelled figure used across the dashboard and detail pages. */
export function Stat({ label, value, hint, tone = 'default' }) {
  const tones = {
    default: 'text-ink-950 dark:text-white',
    ok: 'text-emerald-600 dark:text-emerald-300',
    warn: 'text-amber-600 dark:text-amber-300',
    danger: 'text-rose-600 dark:text-rose-300',
  }
  return (
    <div className="adm-card adm-card-pad">
      <p className="adm-card-title">{label}</p>
      <p className={`mt-2 font-display text-3xl font-extrabold leading-none ${tones[tone]}`}>
        {value}
      </p>
      {hint && <p className="mt-1.5 text-xs text-ink-500 dark:text-ink-400">{hint}</p>}
    </div>
  )
}

/**
 * Confirmation dialog for anything destructive.
 *
 * The cancel button is deliberately the default focus: an admin hammering
 * Enter should not delete a product.
 */
export function ConfirmDialog({ open, title, body, confirmLabel = 'Confirm', busy, onConfirm, onCancel }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cancel"
        onClick={onCancel}
        className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm"
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-sm rounded-2xl border border-ink-200 bg-white p-5 shadow-2xl dark:border-ink-800 dark:bg-ink-900"
      >
        <p className="font-display text-xl font-extrabold uppercase text-ink-950 dark:text-white">
          {title}
        </p>
        {body && (
          <p className="mt-2 text-sm leading-relaxed text-ink-600 dark:text-ink-400">{body}</p>
        )}
        <div className="mt-5 flex justify-end gap-2.5">
          <button type="button" onClick={onCancel} className="adm-btn-outline">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} disabled={busy} className="adm-btn-danger">
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

/** Success / failure banner used after a save. */
export function Toast({ tone = 'ok', children, onDismiss }) {
  if (!children) return null
  const tones = {
    ok: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200',
    error: 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200',
    info: 'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200',
  }
  return (
    <div role="status" className={`mb-5 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm leading-relaxed ${tones[tone]}`}>
      <Icon name={tone === 'ok' ? 'check' : 'info'} size={16} className="mt-0.5 shrink-0" />
      <div className="flex-1">{children}</div>
      {onDismiss && (
        <button type="button" onClick={onDismiss} aria-label="Dismiss" className="shrink-0 opacity-70 hover:opacity-100">
          <Icon name="close" size={15} />
        </button>
      )}
    </div>
  )
}
