import { createContext, useCallback, useContext, useMemo, useState } from 'react'

/** Lightweight toast queue. No dependency, no portal library needed. */

const ToastContext = createContext(null)

const DEFAULT_DURATION = 3500

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const push = useCallback((message, { type = 'success', duration = DEFAULT_DURATION, action } = {}) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    setToasts((prev) => [...prev.slice(-2), { id, message, type, action }])
    if (duration > 0) setTimeout(() => dismiss(id), duration)
    return id
  }, [dismiss])

  const value = useMemo(() => ({
    toasts,
    dismiss,
    success: (msg, opts) => push(msg, { ...opts, type: 'success' }),
    error: (msg, opts) => push(msg, { ...opts, type: 'error', duration: 5000 }),
    info: (msg, opts) => push(msg, { ...opts, type: 'info' }),
  }), [toasts, push, dismiss])

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
