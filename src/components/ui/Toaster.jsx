import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Icon from './Icon'
import { useToast } from '../../contexts/ToastContext'

/** Renders the toast queue. Mounted once in App. */
export default function Toaster() {
  const { toasts, dismiss } = useToast()
  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:bottom-6"
      role="status"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
      ))}
    </div>,
    document.body,
  )
}

const TONE = {
  success: { bg: 'bg-ink-950', text: 'text-white', icon: 'check', ring: 'text-lime-accent' },
  error:   { bg: 'bg-flame',    text: 'text-white', icon: 'alert', ring: 'text-white' },
  info:    { bg: 'bg-white',    text: 'text-ink-900', icon: 'info', ring: 'text-ink-600' },
}

function Toast({ toast, onDismiss }) {
  const tone = TONE[toast.type] ?? TONE.info
  const timerRef = useRef(null)

  useEffect(() => () => clearTimeout(timerRef.current), [])

  return (
    <div
      className={`pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl px-4 py-3.5 shadow-lift animate-rise ${tone.bg} ${tone.text}`}
      onMouseEnter={() => clearTimeout(timerRef.current)}
      onMouseLeave={onDismiss}
    >
      <Icon name={tone.icon} size={20} className={`mt-0.5 shrink-0 ${tone.ring}`} />
      <p className="flex-1 text-sm font-medium leading-snug">{toast.message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 opacity-60 transition-opacity hover:opacity-100 focus-ring rounded"
        aria-label="Dismiss notification"
      >
        <Icon name="close" size={16} />
      </button>
    </div>
  )
}
