import { Link } from 'react-router-dom'
import Icon from '../ui/Icon'
import Logo from '../ui/Logo'
import { isSupabaseConfigured } from '../../lib/supabase'

/**
 * Shared shell for /login and /register: form panel on the left, brand story
 * on the right. The demo-mode notice appears only when Supabase is absent.
 */
export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-[calc(100dvh-68px)] lg:grid-cols-2">
      <div className="flex items-center justify-center px-4 py-14 sm:px-8">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-10 inline-flex lg:hidden">
            <Logo />
          </Link>

          <h1 className="heading-lg text-3xl text-ink-950 sm:text-4xl">{title}</h1>
          {subtitle && <p className="mt-3 text-sm leading-relaxed text-ink-600/95">{subtitle}</p>}

          {!isSupabaseConfigured && (
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4">
              <Icon name="info" size={17} className="mt-0.5 shrink-0 text-amber-700" />
              <p className="text-xs leading-relaxed text-amber-900">
                <strong className="font-bold">Demo mode.</strong> No Supabase keys configured, so
                signing in uses a local demo session. Add your project URL and anon key to
                <code className="mx-1 rounded bg-amber-100 px-1 py-0.5">.env</code>
                to enable real accounts.
              </p>
            </div>
          )}

          <div className="mt-8">{children}</div>
          {footer && <div className="mt-8 text-center text-sm text-ink-600">{footer}</div>}
        </div>
      </div>

      <BrandPanel />
    </div>
  )
}

function BrandPanel() {
  return (
    <div className="relative hidden overflow-hidden bg-ink-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
      <div
        className="pointer-events-none absolute -right-32 -top-32 h-[32rem] w-[32rem] rounded-full bg-lime-accent opacity-20 blur-[120px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: 'repeating-linear-gradient(115deg, transparent 0 70px, #fff 70px 71px)',
        }}
        aria-hidden="true"
      />

      <Link to="/" className="relative">
        <Logo tone="light" />
      </Link>

      <div className="relative max-w-md">
        <p className="font-display text-3xl font-extrabold uppercase leading-tight">
          Your kits, your orders, <span className="text-lime-accent">all in one place.</span>
        </p>
        <ul className="mt-8 space-y-4">
          {[
            ['package', 'Track every order from dispatch to delivery'],
            ['refresh', 'Rebook your sizes without re-entering everything'],
            ['tag', 'Member-only codes applied at checkout'],
            ['heart', 'Wishlist synced across your devices'],
          ].map(([icon, text]) => (
            <li key={text} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-lime-accent text-ink-950">
                <Icon name={icon} size={13} />
              </span>
              <span className="text-sm text-white/75">{text}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative flex items-center gap-6 border-t border-white/10 pt-7">
        {[
          ['12,000+', 'Orders delivered'],
          ['4.8/5', 'Average rating'],
          ['64', 'Districts'],
        ].map(([value, label]) => (
          <div key={label}>
            <p className="font-display text-2xl font-extrabold text-lime-accent">{value}</p>
            <p className="text-[11px] uppercase tracking-wider text-white/45">{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
