import { useCallback, useEffect, useState } from 'react'

/**
 * Admin colour theme.
 *
 * A UI preference only -- it decides nothing about access, which is why it is
 * safe to persist in localStorage. The class is applied to <html> so the
 * `dark` variant in index.css can reach every element, and `colorScheme` is
 * set alongside it so native controls (scrollbars, select popups) follow.
 */

const STORAGE_KEY = 'ftx.admin.theme'

function readInitial() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'dark' || stored === 'light') return stored
  } catch {
    /* storage blocked; fall through to the system preference */
  }
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'light'
}

export function useTheme() {
  const [theme, setTheme] = useState(readInitial)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    root.style.colorScheme = theme
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      /* preference simply will not survive a reload */
    }
  }, [theme])

  const toggle = useCallback(
    () => setTheme((current) => (current === 'dark' ? 'light' : 'dark')),
    [],
  )

  return [theme, toggle]
}
