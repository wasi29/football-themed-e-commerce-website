import { Suspense, lazy, useEffect } from 'react'
import { Link, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import Icon from './components/ui/Icon'
import { Skeleton } from './components/ui/Feedback'

import PublicLayout, { ScrollToTop } from './components/layout/PublicLayout'

import Home from './pages/Home'
import Shop from './pages/Shop'
import Category from './pages/Category'
import Product from './pages/Product'
import About from './pages/About'
import Contact from './pages/Contact'
import Faq from './pages/Faq'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'

import { AdminAuthProvider } from './admin/AdminAuthContext'
import AdminErrorBoundary from './admin/AdminErrorBoundary'

const Cart = lazy(() => import('./pages/Cart'))
const Checkout = lazy(() => import('./pages/Checkout'))
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'))
const MyAccount = lazy(() => import('./pages/MyAccount'))
const Orders = lazy(() => import('./pages/Orders'))

/* ---- admin panel ---------------------------------------------------------
   A separate tree from the storefront's own pages: `src/admin/` is the real
   panel, gated by `AdminGuard` and backed by Supabase roles rather than the
   storefront's local demo session. Each screen is lazy so the dashboard bundle
   does not carry the product editor. */
const AdminLogin = lazy(() => import('./admin/AdminLogin'))
const AdminLayout = lazy(() => import('./admin/AdminLayout'))
const AdminGuard = lazy(() => import('./admin/AdminGuard'))

const AdminDashboard = lazy(() => import('./admin/AdminDashboard'))
const AdminProducts = lazy(() => import('./admin/AdminProducts'))
const AdminProductForm = lazy(() => import('./admin/AdminProductForm'))
const AdminCategories = lazy(() => import('./admin/AdminCategories'))
const AdminOrders = lazy(() => import('./admin/AdminOrders'))
const AdminOrderDetail = lazy(() => import('./admin/AdminOrderDetail'))
const AdminCustomers = lazy(() => import('./admin/AdminCustomers'))
const AdminCustomerDetail = lazy(() => import('./admin/AdminCustomerDetail'))
const AdminReviews = lazy(() => import('./admin/AdminReviews'))
const AdminHomepage = lazy(() => import('./admin/AdminHomepage'))
const AdminBanners = lazy(() => import('./admin/AdminBanners'))
const AdminInventory = lazy(() => import('./admin/AdminInventory'))
const AdminCoupons = lazy(() => import('./admin/AdminCoupons'))
const AdminSettings = lazy(() => import('./admin/AdminSettings'))
const AdminProfile = lazy(() => import('./admin/AdminProfile'))

/** Chunk-loading placeholder. Keeps layout shift to zero on slow connections. */
function Lazy({ children }) {
  return <Suspense fallback={<RouteFallback />}>{children}</Suspense>
}

/**
 * Layout route for `/admin/*`.
 *
 * The provider sits *outside* the guard so `/admin/login` can use it too — the
 * login screen needs `signIn` and must also be able to report "signed in but
 * not an admin". React Router reaches the child routes through this outlet.
 */
function AdminRoot() {
  return (
    <AdminErrorBoundary>
      <AdminAuthProvider>
        <Outlet />
      </AdminAuthProvider>
    </AdminErrorBoundary>
  )
}

function RouteFallback() {
  return (
    <div className="container-x py-16">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="mt-4 h-4 w-96 max-w-full" />
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-72 w-full" />)}
      </div>
    </div>
  )
}

/**
 * Route table.
 *
 * The storefront is wrapped in `PublicLayout` (announcement bar, header,
 * footer) while the admin sits in its own shell with a persistent sidebar —
 * the two must not share a chrome, so the routes are split deliberately.
 */
export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* ---- admin ----
             `/admin/login` sits outside the guard so an unauthenticated visitor
             can reach it; everything else is behind `AdminGuard`, which reads
             the Supabase session plus `profiles.role` on every navigation. */}
        <Route element={<AdminRoot />}>
          <Route
            path="/admin/login"
            element={<Lazy><AdminLogin /></Lazy>}
          />

          <Route
            path="/admin"
            element={<Lazy><AdminGuard><AdminLayout /></AdminGuard></Lazy>}
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<Lazy><AdminDashboard /></Lazy>} />

            <Route path="products" element={<Lazy><AdminProducts /></Lazy>} />
            <Route path="products/new" element={<Lazy><AdminProductForm /></Lazy>} />
            <Route path="products/:id/edit" element={<Lazy><AdminProductForm /></Lazy>} />

            <Route path="categories" element={<Lazy><AdminCategories /></Lazy>} />
            <Route path="inventory" element={<Lazy><AdminInventory /></Lazy>} />

            <Route path="orders" element={<Lazy><AdminOrders /></Lazy>} />
            <Route path="orders/:id" element={<Lazy><AdminOrderDetail /></Lazy>} />

            <Route path="customers" element={<Lazy><AdminCustomers /></Lazy>} />
            <Route path="customers/:id" element={<Lazy><AdminCustomerDetail /></Lazy>} />

            <Route path="reviews" element={<Lazy><AdminReviews /></Lazy>} />
            <Route path="coupons" element={<Lazy><AdminCoupons /></Lazy>} />

            <Route path="homepage" element={<Lazy><AdminHomepage /></Lazy>} />
            <Route path="banners" element={<Lazy><AdminBanners /></Lazy>} />
            <Route path="settings" element={<Lazy><AdminSettings /></Lazy>} />
            <Route path="profile" element={<Lazy><AdminProfile /></Lazy>} />

            {/* Any other /admin URL lands on the dashboard rather than the
                storefront's 404, so a stale bookmark stays inside the panel. */}
            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
          </Route>
        </Route>

        {/* ---- storefront ---- */}
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="shop" element={<Shop />} />
          <Route path="category/:slug" element={<Category />} />
          <Route path="product/:slug" element={<Product />} />
          {/* The tail of the purchase funnel and the account area are lazy:
              a visitor browsing the catalogue never downloads them. */}
          <Route path="cart" element={<Lazy><Cart /></Lazy>} />
          <Route path="checkout" element={<Lazy><Checkout /></Lazy>} />
          <Route path="order-success" element={<Lazy><OrderSuccess /></Lazy>} />
          <Route path="my-account" element={<Lazy><MyAccount /></Lazy>} />
          <Route path="orders" element={<Lazy><Orders /></Lazy>} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
          <Route path="faq" element={<Faq />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          {/* Password recovery: /forgot-password requests the Supabase email,
              /reset-password consumes the link it contains. */}
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password" element={<ResetPassword />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  )
}

/* -------------------------------------------------------------------------- */

const SUGGESTIONS = [
  ['/shop', 'Shop all jerseys', 'jersey'],
  ['/category/club-jerseys', 'Club jerseys', 'cap'],
  ['/category/international', 'International kits', 'globe'],
  ['/shop?sort=popular', 'Best sellers', 'trophy'],
  ['/faq', 'Delivery & sizing', 'truck'],
  ['/contact', 'Talk to us', 'whatsapp'],
]

function NotFound() {
  const { pathname } = useLocation()

  useEffect(() => {
    document.title = 'Page not found — FootballTrix'
  }, [])

  return (
    <div className="container-x flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <span className="mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-ink-950 font-display text-3xl font-extrabold text-lime-accent">
        404
      </span>

      <h1 className="heading-xl text-ink-950">We could not find that page</h1>
      <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-ink-600/95">
        Nothing lives at{' '}
        <code className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-sm text-ink-800">{pathname}</code>.
        It may have been renamed, or the link might be a typo.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link to="/" className="btn-dark">
          <Icon name="arrowLeft" size={17} />
          Back to home
        </Link>
        <Link to="/shop" className="btn-ghost">Browse the shop</Link>
      </div>

      <div className="mt-14 w-full max-w-2xl border-t border-ink-200 pt-8">
        <p className="text-[11px] font-bold uppercase tracking-wider text-ink-600/80">
          Popular destinations
        </p>
        <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
          {SUGGESTIONS.map(([to, label, icon]) => (
            <li key={to}>
              <Link
                to={to}
                className="flex items-center gap-3 rounded-xl border border-ink-200 px-4 py-3 text-sm font-semibold text-ink-800 transition-colors hover:border-ink-950 hover:bg-ink-50 focus-ring"
              >
                <Icon name={icon} size={17} className="shrink-0 text-ink-600" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}