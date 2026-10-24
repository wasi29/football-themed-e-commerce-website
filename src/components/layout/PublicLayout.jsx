import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'

/**
 * Storefront chrome. Wraps every customer-facing route so the header, cart
 * drawer and footer exist exactly once for the whole shop — `Header` owns the
 * cart drawer itself, since it also owns the button that opens it.
 */
export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      <Header />

      <main id="main" className="flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  )
}

/**
 * Route-change behaviour: jump to the top on navigation, but leave the scroll
 * position alone when only the query string changes (filtering in the shop).
 */
export function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  return null
}