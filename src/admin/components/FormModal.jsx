import { useEffect } from 'react'
import Icon from '../../components/ui/Icon'

/**
 * Modal used by the editors that do not need their own route (categories,
 * banners, coupons, homepage sections).
 *
 * Escape and the backdrop both cancel, and the form is a real `<form>` so
 * Enter submits — the same affordances the browser gives for free elsewhere.
 */
export default function FormModal({
  open,
  title,
  subtitle,
  onClose,
  onSubmit,
  submitLabel = 'Save',
  busy = false,
  danger = false,
  children,
}) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape' && !busy) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, busy, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={() => { if (!busy) onClose() }}
        className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex max-h-[92vh] w-full flex-col rounded-t-3xl border border-ink-200 bg-white shadow-2xl dark:border-ink-800 dark:bg-ink-900 sm:max-h-[88vh] sm:max-w-lg sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-ink-200 px-5 py-4 dark:border-ink-800">
          <div className="min-w-0">
            <h2 className="font-display text-xl font-extrabold uppercase leading-none text-ink-950 dark:text-white">
              {title}
            </h2>
            {subtitle && <p className="mt-1.5 text-xs text-ink-600 dark:text-ink-400">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className="adm-icon-btn shrink-0"
          >
            <Icon name="close" size={17} />
          </button>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault()
            onSubmit(event)
          }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
            {children}
          </div>

          <div className="flex justify-end gap-2.5 border-t border-ink-200 px-5 py-4 dark:border-ink-800">
            <button type="button" onClick={onClose} disabled={busy} className="adm-btn-outline">
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className={danger ? 'adm-btn-danger' : 'adm-btn-dark'}
            >
              {busy ? 'Saving…' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
