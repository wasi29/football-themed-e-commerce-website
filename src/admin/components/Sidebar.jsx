import { NavLink } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import Logo from '../../components/ui/Logo'

/**
 * Admin navigation.
 *
 * The list is data rather than JSX so the same array drives the desktop
 * sidebar, the mobile drawer and the route index — an entry cannot drift out
 * of sync with the URL it points at.
 *
 * Paths are children of `/admin`, which `AdminGuard` protects: none of these
 * links is reachable without a real Supabase session carrying `role = admin`.
 */
export const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [{ to: '/admin/dashboard', label: 'Dashboard', icon: 'layout' }],
  },
  {
    label: 'Catalogue',
    items: [
      { to: '/admin/products', label: 'Products', icon: 'package' },
      { to: '/admin/categories', label: 'Categories', icon: 'grid' },
      { to: '/admin/inventory', label: 'Inventory', icon: 'box' },
    ],
  },
  {
    label: 'Selling',
    items: [
      { to: '/admin/orders', label: 'Orders', icon: 'cart' },
      { to: '/admin/customers', label: 'Customers', icon: 'users' },
      { to: '/admin/reviews', label: 'Reviews', icon: 'star' },
      { to: '/admin/coupons', label: 'Coupons', icon: 'tag2' },
    ],
  },
  {
    label: 'Storefront',
    items: [
      { to: '/admin/homepage', label: 'Homepage', icon: 'list' },
      { to: '/admin/banners', label: 'Banners', icon: 'image' },
      { to: '/admin/settings', label: 'Website Settings', icon: 'settings' },
    ],
  },
]

function NavItem({ item, onNavigate }) {
  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      className={({ isActive }) =>
        `adm-navlink ${isActive ? 'adm-navlink-active' : ''}`
      }
    >
      <Icon name={item.icon} size={17} className="shrink-0" />
      <span>{item.label}</span>
    </NavLink>
  )
}

function initials(name, email) {
  const source = (name || email || '?').trim()
  const parts = source.split(/[\s@._-]+/).filter(Boolean)
  return (parts[0]?.[0] ?? '?').toUpperCase() + (parts[1]?.[0] ?? '')
}

export default function Sidebar({ profile, onSignOut, onNavigate }) {
  return (
    <nav
      aria-label="Admin"
      className="flex h-full flex-col bg-ink-950 px-3.5 py-5 text-white"
    >
      <div className="flex items-center justify-between px-2">
        <Logo />
      </div>

      <div className="mt-3 rounded-xl bg-white/[0.06] px-3 py-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-500">
          Admin panel
        </p>
        <p className="mt-0.5 text-xs font-semibold text-ink-300">
          Same store, full control
        </p>
      </div>

      <div className="mt-5 flex-1 space-y-5 overflow-y-auto pb-4 pr-1">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-ink-500">
              {section.label}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavItem key={item.to} item={item} onNavigate={onNavigate} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Account controls live in the sidebar rather than only in the topbar,
          so they stay reachable on a phone where the topbar menu is cramped. */}
      <div className="space-y-1 border-t border-white/10 pt-4">
        <NavLink
          to="/admin/profile"
          onClick={onNavigate}
          className={({ isActive }) =>
            `adm-navlink ${isActive ? 'adm-navlink-active' : ''}`
          }
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-lime-accent text-[11px] font-bold text-ink-950">
            {initials(profile?.full_name, profile?.email)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-bold text-white">
              {profile?.full_name || profile?.email || 'Administrator'}
            </span>
            <span className="block text-[10px] uppercase tracking-wider text-ink-500">
              Admin
            </span>
          </span>
        </NavLink>

        <button type="button" onClick={onSignOut} className="adm-navlink w-full">
          <Icon name="logout" size={17} className="shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  )
}
