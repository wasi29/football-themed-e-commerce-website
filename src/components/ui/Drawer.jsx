import { useEffect } from 'react'
import Icon from '../ui/Icon'

/**
 * Bottom-sheet drawer. Used for the cart and the mobile navigation.
 *
 * Handles: Escape to close, body scroll lock, focus to the panel on open,
 * and restoring focus to the trigger on close.
 */
export default function Drawer({ open, onClose, title, children, footer, side = 'right', label }) {
  useEffect(() => {
    if (!open) return undefined

    const previouslyFocused = document.activeElement
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKeyDown)

    // Focus the panel so screen readers announce it and Tab stays inside.
    const timer = setTimeout(() => {
      document.querySelector(`[data-drawer-panel="${side}"]`)?.focus()
    }, 60)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = originalOverflow
      clearTimeout(timer)
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus()
    }
  }, [open, onClose, side])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-label={label ?? title}>
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-ink-950/45 backdrop-blur-[2px] animate-fade"
        aria-label="Close"
        tabIndex={-1}
      />

      <div
        data-drawer-panel={side}
        tabIndex={-1}
        className={`absolute inset-y-0 flex max-h-[100dvh] w-full flex-col bg-white shadow-2xl outline-none ${
          side === 'right'
            ? 'right-0 max-w-[26rem] animate-slide-in'
            : 'left-0 max-w-[21rem] animate-slide-in-left'
        }`}
      >
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-ink-200/70 px-5 py-4">
          <h2 className="heading-md text-lg">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink-700 transition-colors hover:bg-ink-100 focus-ring"
            aria-label="Close drawer"
          >
            <Icon name="close" size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>

        {footer && <div className="shrink-0 border-t border-ink-200/70 bg-white">{footer}</div>}
      </div>
    </div>
  )
}
