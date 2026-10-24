import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import { useAdminAuth } from './AdminAuthContext'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import { useTheme } from './useTheme'

/**
 * The `/admin/*` shell: fixed sidebar on desktop, slide-over drawer below
 * 1024px, topbar always.
 *
 * Everything inside is already behind `AdminGuard`, so this component never
 * decides access — it only decides layout. `useTheme` lives here so the toggle
 * in the topbar and the class on `<html>` share a single source of truth.
 */
export default function AdminLayout() {
  const { profile, signOut } = useAdminAuth()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [theme, toggleTheme] = useTheme()
  const location = useLocation()
  const navigate = useNavigate()

  // A drawer opened on one screen must not stay open when the user jumps to a
  // new page from a bookmark or the browser's back button.
  useEffect(() => {
    setDrawerOpen(false)
  }, [location.pathname])

  // Lock body scroll while the drawer is open so the page behind it does not
  // slide under the overlay on a touch screen.
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' in window ? 'instant' : 'auto' })
  }, [location.pathname])

  async function handleSignOut() {
    await signOut()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="adm-page">
      {/* ------------------------------------------------------------ desktop */}
      <aside
        className="fixed inset-y-0 left-0 z-40 hidden w-[16.5rem] border-r border-ink-800 lg:block"
      >
        <Sidebar profile={profile} onSignOut={handleSignOut} />
      </aside>

      {/* ------------------------------------------------------------- mobile */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm"
          />
          <div className="absolute inset-y-0 left-0 w-[16.5rem] max-w-[85vw] shadow-2xl">
            <Sidebar
              profile={profile}
              onSignOut={handleSignOut}
              onNavigate={() => setDrawerOpen(false)}
            />
            <button
              type="button"
              aria-label="Close navigation"
              onClick={() => setDrawerOpen(false)}
              className="absolute -right-11 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white text-ink-900 shadow-lg"
            >
              <Icon name="close" size={18} />
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- canvas */}
      <div className="lg:pl-[16.5rem]">
        <Topbar
          onOpenDrawer={() => setDrawerOpen(true)}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        <main className="container-x py-6 sm:py-8">
          <Outlet />
        </main>

        <footer className="container-x pb-8">
          <p className="adm-divider pt-5 text-xs text-ink-500 dark:text-ink-500">
            FootballTrix admin — data served by Supabase with row level security
            enabled on every table.
          </p>
        </footer>
      </div>
    </div>
  )
}
