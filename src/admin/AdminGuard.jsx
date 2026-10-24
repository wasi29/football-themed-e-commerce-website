import { Navigate, useLocation } from 'react-router-dom'
import { useAdminAuth } from './AdminAuthContext'
import { Skeleton } from '../components/ui/Feedback'

/**
 * Route-level admin gate.
 *
 * Every screen under `/admin` except the login page is rendered behind this.
 * The decision comes from the Supabase session plus `profiles.role`, fetched on
 * every mount -- there is no stored "isAdmin" flag to forge, and a customer
 * who signs in legitimately still lands back on the login page with a reason.
 *
 * RLS in `supabase/schema.sql` is the real enforcement: even if a request
 * reached a query, `is_admin()` would deny it. This component only decides
 * what to *render*.
 */
export default function AdminGuard({ children }) {
  const { user, isAdmin, loading, isConfigured } = useAdminAuth()
  const location = useLocation()

  if (loading) {
    // No protected content while the session check is in flight.
    return (
      <div className="min-h-screen bg-white">
        <div className="container-x py-16">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="mt-6 h-64 w-full" />
        </div>
      </div>
    )
  }

  if (!isConfigured) {
    return (
      <Navigate to="/admin/login" replace state={{ reason: 'not-configured' }} />
    )
  }

  if (!user) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    )
  }

  if (!isAdmin) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{ denied: true, from: location.pathname }}
      />
    )
  }

  return children
}
