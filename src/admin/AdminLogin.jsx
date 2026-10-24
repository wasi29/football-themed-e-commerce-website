import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import Logo from '../components/ui/Logo'
import { useAdminAuth } from './AdminAuthContext'

/**
 * `/admin/login`.
 *
 * A separate entry point from the storefront's `/login`: an admin should not
 * have to pass through the customer sign-in, and the storefront must never
 * imply that signing in there grants admin rights.
 *
 * All three states that land here from `AdminGuard` are explained rather than
 * swallowed -- unauthenticated, configured-but-not-admin, and not configured
 * at all -- because a silent redirect to a login form reads like "wrong
 * password" when the real answer is "your account has no admin role".
 */
export default function AdminLogin() {
  const { signIn, sendResetLink } = useAdminAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [resetEmail, setResetEmail] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)
  const [resetSent, setResetSent] = useState(false)

  const reason = location.state?.reason
  const denied = location.state?.denied
  const returnTo = location.state?.from || '/admin/dashboard'

  useEffect(() => {
    document.title = 'Admin sign in — FootballTrix'
  }, [])

  // Already signed in as an admin? The guard handles that on protected routes.
  // This page deliberately never auto-redirects away from itself: a denied
  // admin arriving here must be able to read why they were sent back.

  const banner = (() => {
    if (reason === 'not-configured') {
      return {
        tone: 'warn',
        text: 'Supabase is not connected. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local, then restart the dev server.',
      }
    }
    if (denied) {
      return {
        tone: 'warn',
        text: 'That account is signed in but does not have the admin role. Ask the store owner to promote it, then sign in again.',
      }
    }
    return null
  })()

  async function handleLogin(event) {
    event.preventDefault()
    setMessage(null)
    if (!email.trim() || !password) {
      setMessage({ tone: 'error', text: 'Enter your email and password.' })
      return
    }
    setBusy(true)
    const result = await signIn({ email: email.trim(), password })
    setBusy(false)

    if (!result.ok) {
      setMessage({
        tone: 'error',
        // Supabase's own copy for a bad password names the email, which is fine
        // here (unlike a public sign-up form) because this is a private door.
        text: result.error,
      })
      return
    }
    navigate(returnTo, { replace: true })
  }

  async function handleReset(event) {
    event.preventDefault()
    setMessage(null)
    if (!resetEmail.trim()) {
      setMessage({ tone: 'error', text: 'Enter your account email.' })
      return
    }
    setBusy(true)
    const result = await sendResetLink(resetEmail.trim())
    setBusy(false)

    if (!result.ok) {
      setMessage({ tone: 'error', text: result.error })
      return
    }
    setResetSent(true)
    setMessage({ tone: 'ok', text: 'Reset link sent. Check your inbox.' })
  }

  return (
    <div className="flex min-h-screen flex-col bg-white lg:flex-row">
      {/* ------------------------------------------------ brand panel (desktop) */}
      <aside className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-ink-950 p-10 lg:flex">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-lime-accent/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-pitch/20 blur-3xl"
        />

        <Logo />

        <div className="relative max-w-md">
          <p className="eyebrow-accent">FootballTrix admin</p>
          <h1 className="mt-4 font-display text-5xl font-extrabold leading-[0.95] text-white">
            Run the whole
            <br />
            <span className="text-lime-accent">store</span> from here.
          </h1>
          <p className="mt-5 text-base leading-relaxed text-ink-300">
            Orders, products, stock, banners, coupons and site settings — all
            reading from the same Supabase project your customers buy from.
          </p>
        </div>

        <ul className="relative space-y-3 text-sm text-ink-400">
          {[
            ['shield', 'Role checked against the database on every page load'],
            ['package', 'Stock and pricing enforced in SQL, not in the browser'],
            ['users', 'Customer data stays behind row level security'],
          ].map(([icon, text]) => (
            <li key={text} className="flex items-start gap-3">
              <Icon name={icon} size={17} className="mt-0.5 shrink-0 text-lime-accent" />
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </aside>

      {/* --------------------------------------------------------- form panel */}
      <main className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-[27rem]">
          <div className="lg:hidden">
            <Logo />
          </div>

          <p className="mt-8 text-[11px] font-bold uppercase tracking-wider text-ink-500 lg:mt-0">
            Admin area
          </p>
          <h2 className="mt-2 font-display text-3xl font-extrabold text-ink-950">
            {mode === 'login' ? 'Sign in to your account' : 'Reset your password'}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-600">
            {mode === 'login'
              ? 'Use the email and password for your administrator account.'
              : 'We will email you a link to set a new password.'}
          </p>

          {banner && (
            <div
              role="status"
              className={`mt-6 rounded-xl border px-4 py-3 text-sm leading-relaxed ${
                banner.tone === 'warn'
                  ? 'border-amber-200 bg-amber-50 text-amber-900'
                  : 'border-rose-200 bg-rose-50 text-rose-900'
              }`}
            >
              {banner.text}
            </div>
          )}

          {message && (
            <div
              role="alert"
              className={`mt-4 rounded-xl border px-4 py-3 text-sm leading-relaxed ${
                message.tone === 'ok'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                  : 'border-rose-200 bg-rose-50 text-rose-900'
              }`}
            >
              {message.text}
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="mt-7 space-y-5" noValidate>
              <div>
                <label className="label" htmlFor="admin-email">Email address</label>
                <input
                  id="admin-email"
                  type="email"
                  autoComplete="username"
                  className="field"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@store.com"
                  required
                />
              </div>

              <div>
                <label className="label" htmlFor="admin-password">Password</label>
                <div className="relative">
                  <input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className="field pr-12"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-900 focus-ring"
                  >
                    <Icon name={showPassword ? 'close' : 'eye'} size={18} />
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => { setMode('reset'); setMessage(null); setResetSent(false) }}
                className="-mt-2 block text-sm font-semibold text-ink-600 underline-offset-4 transition-colors hover:text-ink-950 hover:underline"
              >
                Forgot password?
              </button>

              <button
                type="submit"
                disabled={busy}
                className="btn-dark w-full justify-center disabled:opacity-60"
              >
                {busy ? 'Signing in…' : 'Login'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleReset} className="mt-7 space-y-5" noValidate>
              <div>
                <label className="label" htmlFor="reset-email">Email address</label>
                <input
                  id="reset-email"
                  type="email"
                  autoComplete="username"
                  className="field"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="you@store.com"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="btn-dark w-full justify-center disabled:opacity-60"
              >
                {busy ? 'Sending…' : 'Send reset link'}
              </button>

              <button
                type="button"
                onClick={() => { setMode('login'); setMessage(null); setResetSent(false) }}
                className="flex items-center gap-1.5 text-sm font-semibold text-ink-600 transition-colors hover:text-ink-950"
              >
                <Icon name="arrowLeft" size={15} />
                Back to sign in
              </button>

              {resetSent && (
                <p className="rounded-xl bg-ink-50 px-4 py-3 text-xs leading-relaxed text-ink-600">
                  If an account exists for that address, a reset link is on its
                  way. The link expires, and using it sets a new password for the
                  account.
                </p>
              )}
            </form>
          )}

          <p className="mt-8 border-t border-ink-200 pt-6 text-sm text-ink-600">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 font-semibold text-ink-950 underline-offset-4 hover:underline"
            >
              <Icon name="arrowLeft" size={15} />
              Back to the storefront
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
