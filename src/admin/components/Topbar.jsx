import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import { useAdminAuth } from '../AdminAuthContext'
import GlobalSearch from './GlobalSearch'
import NotificationsBell from './NotificationsBell'

function initials(name, email) {
  const source = (name || email || '?').trim()
  const parts = source.split(/[\s@._-]+/).filter(Boolean)
  return (parts[0]?.[0] ?? '?').toUpperCase() + (parts[1]?.[0] ?? '')
}

/**
 * Admin topbar: search, notifications, colour theme, account menu.
 *
 * The theme toggle writes only a UI preference. It is stored in localStorage
 * because nothing about authorisation depends on it — access is decided by
 * `AdminGuard` reading the database on every navigation.
 */
export default function Topbar({ onOpenDrawer, theme, onToggleTheme }) {
  const { profile, signOut } = useAdminAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return undefined
    const onPointer = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false)
    }
    const onKey = (event) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  async function handleSignOut() {
    setMenuOpen(false)
    await signOut()
    navigate('/admin/login', { replace: true })
  }

  return (
    <header className="sticky top-0 z-30 border-b border-ink-200 bg-white/85 backdrop-blur-md dark:border-ink-800 dark:bg-ink-950/85">
      <div className="container-x flex h-16 items-center gap-3">
        <button
          type="button"
          onClick={onOpenDrawer}
          aria-label="Open navigation"
          className="adm-icon-btn lg:hidden"
        >
          <Icon name="menu" size={19} />
        </button>

        <div className="hidden flex-1 sm:block">
          <GlobalSearch />
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="adm-icon-btn"
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
          </button>

          <NotificationsBell />

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              className="flex items-center gap-2 rounded-xl border border-ink-200 bg-white py-1.5 pl-1.5 pr-2.5 transition-colors hover:border-ink-950 focus-ring dark:border-ink-700 dark:bg-ink-800 dark:hover:border-ink-500"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-950 text-xs font-bold text-lime-accent dark:bg-lime-accent dark:text-ink-950">
                {initials(profile?.full_name, profile?.email)}
              </span>
              <span className="hidden text-left md:block">
                <span className="block max-w-[9rem] truncate text-xs font-bold text-ink-900 dark:text-white">
                  {profile?.full_name || profile?.email || 'Administrator'}
                </span>
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-ink-500 dark:text-ink-400">
                  Admin
                </span>
              </span>
              <Icon name="chevronDown" size={15} className="hidden text-ink-500 md:block" />
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-xl dark:border-ink-800 dark:bg-ink-900"
              >
                <div className="border-b border-ink-200 px-4 py-3 dark:border-ink-800">
                  <p className="truncate text-sm font-bold text-ink-950 dark:text-white">
                    {profile?.full_name || 'Administrator'}
                  </p>
                  <p className="truncate text-xs text-ink-600 dark:text-ink-400">
                    {profile?.email}
                  </p>
                </div>

                <div className="p-1.5">
                  <Link
                    to="/admin/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-800 transition-colors hover:bg-ink-50 dark:text-ink-200 dark:hover:bg-ink-800"
                  >
                    <Icon name="user" size={16} />
                    Admin Profile
                  </Link>
                  <Link
                    to="/"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-800 transition-colors hover:bg-ink-50 dark:text-ink-200 dark:hover:bg-ink-800"
                  >
                    <Icon name="globe" size={16} />
                    View storefront
                  </Link>
                </div>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-3 border-t border-ink-200 px-4 py-3 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50 dark:border-ink-800 dark:text-rose-400 dark:hover:bg-rose-500/10"
                >
                  <Icon name="logout" size={16} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search sits on its own row on small screens. */}
      <div className="container-x pb-3 sm:hidden">
        <GlobalSearch />
      </div>
    </header>
  )
}
