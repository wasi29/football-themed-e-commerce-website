import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import Icon from '../ui/Icon'
import Logo from '../ui/Logo'
import SearchBox from '../ui/SearchBox'
import Drawer from '../ui/Drawer'
import JerseyGraphic from '../product/JerseyGraphic'
import { useCart } from '../../contexts/CartContext'
import { useAuth } from '../../contexts/AuthContext'
import { categories as categoriesApi } from '../../lib/api'
import { formatPrice } from '../../lib/format'

/* ========================================================================== */
/* announcement bar                                                           */
/* ========================================================================== */

function AnnouncementBar({ messages }) {
  if (!messages.length) return null
  // Duplicated so the marquee can loop seamlessly at -50% translate.
  const track = [...messages, ...messages]

  return (
    <div className="relative overflow-hidden bg-ink-950 text-white">
      <div className="flex w-max animate-marquee py-2">
        {track.map((text, i) => (
          <span key={i} className="flex items-center gap-2 px-6 text-[11px] font-semibold uppercase tracking-[0.14em]">
            <Icon name="ball" size={13} className="text-lime-accent" />
            {text}
            <Icon name="chevronRight" size={12} className="ml-4 text-lime-accent/50" />
          </span>
        ))}
      </div>
    </div>
  )
}

/* ========================================================================== */
/* categories mega-menu                                                       */
/* ========================================================================== */

function CategoryMenu({ categories, open, onClose }) {
  const navigate = useNavigate()

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 cursor-default bg-ink-950/20 animate-fade"
        onClick={onClose}
        aria-label="Close categories menu"
        tabIndex={-1}
      />
      <div className="absolute left-0 right-0 top-full z-50 border-b border-ink-200/80 bg-white shadow-lift animate-fade">
        <div className="container-x py-9">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((cat) => {
              const kids = (cat.subcategories ?? [])
                .map((slug) => categories.find((c) => c.slug === slug))
                .filter(Boolean)

              return (
                <div key={cat.id}>
                  <Link
                    to={`/category/${cat.slug}`}
                    onClick={onClose}
                    className="group mb-3 flex items-center gap-2.5 focus-ring rounded"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-950 text-lime-accent transition-transform group-hover:scale-105">
                      <Icon name={cat.icon ?? 'jersey'} size={17} />
                    </span>
                    <span className="font-display text-lg font-bold uppercase tracking-tight text-ink-950">
                      {cat.name}
                    </span>
                  </Link>

                  <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-ink-600/85">
                    {cat.description}
                  </p>

                  {kids.length > 0 && (
                    <ul className="space-y-1.5">
                      {kids.map((kid) => (
                        <li key={kid.id}>
                          <Link
                            to={`/category/${kid.slug}`}
                            onClick={onClose}
                            className="inline-flex items-center gap-1.5 text-sm text-ink-700 transition-colors hover:text-lime-dark focus-ring rounded"
                          >
                            <Icon name="chevronRight" size={13} className="opacity-50" />
                            {kid.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )
            })}
          </div>

          <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-2xl bg-ink-950 p-6 sm:flex-row sm:items-center">
            <div>
              <p className="font-display text-xl font-bold uppercase text-white">
                Need a bulk or team order?
              </p>
              <p className="mt-1 text-sm text-white/70">
                Custom jerseys printed in Dhaka from 10 pieces up. Custom colours, names and badges.
              </p>
            </div>
            <button
              type="button"
              onClick={() => { onClose(); navigate('/category/custom-jerseys') }}
              className="btn-primary shrink-0"
            >
              Get a quote
              <Icon name="arrowRight" size={16} />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

/* ========================================================================== */
/* account panel                                                              */
/* ========================================================================== */

function AccountPanel({ open, onClose }) {
  const { user, isAdmin, signOut } = useAuth()
  const navigate = useNavigate()

  if (!open) return null

  const link = (to) => { onClose(); navigate(to) }

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 cursor-default bg-ink-950/20 animate-fade"
        onClick={onClose}
        aria-label="Close account menu"
        tabIndex={-1}
      />
      <div className="absolute right-0 top-full z-50 w-72 rounded-2xl border border-ink-200/80 bg-white p-2 shadow-lift animate-fade">
        {user ? (
          <>
            <div className="px-3 pb-2 pt-2.5">
              <p className="truncate text-sm font-semibold text-ink-950">
                {user.user_metadata?.full_name ?? user.email}
              </p>
              <p className="truncate text-xs text-ink-600/80">{user.email}</p>
            </div>
            <div className="my-1 h-px bg-ink-200/70" />
            <MenuItem icon="user" label="My account" onClick={() => link('/my-account')} />
            <MenuItem icon="package" label="My orders" onClick={() => link('/orders')} />
            {isAdmin && <MenuItem icon="settings" label="Admin panel" onClick={() => link('/admin')} />}
            <div className="my-1 h-px bg-ink-200/70" />
            <MenuItem
              icon="logout"
              label="Sign out"
              onClick={() => { signOut(); onClose() }}
            />
          </>
        ) : (
          <>
            <div className="px-3 pb-2 pt-2.5">
              <p className="text-sm font-semibold text-ink-950">Welcome to FootballTrix</p>
              <p className="text-xs text-ink-600/80">Sign in to track orders and save jerseys.</p>
            </div>
            <div className="space-y-1.5 p-1">
              <button type="button" onClick={() => link('/login')} className="btn-primary w-full">
                Sign in
              </button>
              <button type="button" onClick={() => link('/register')} className="btn-ghost w-full">
                Create an account
              </button>
            </div>
            <div className="my-1 h-px bg-ink-200/70" />
            {isAdmin && <MenuItem icon="settings" label="Admin panel" onClick={() => link('/admin')} />}
            <MenuItem icon="package" label="Track an order" onClick={() => link('/orders')} />
          </>
        )}
      </div>
    </>
  )
}

function MenuItem({ icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-ink-800 transition-colors hover:bg-ink-50 focus-ring"
    >
      <Icon name={icon} size={17} className="text-ink-600" />
      {label}
    </button>
  )
}

/* ========================================================================== */
/* mobile cart drawer contents                                                */
/* ========================================================================== */

function CartDrawerContents({ onNavigate }) {
  const { items, count, subtotal, setQuantity, removeItem } = useCart()
  const navigate = useNavigate()

  const go = (to) => { onNavigate?.(); navigate(to) }

  if (items.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-ink-100 text-ink-600">
          <Icon name="cart" size={28} />
        </div>
        <div>
          <p className="heading-md text-lg">Your cart is empty</p>
          <p className="mt-1.5 text-sm text-ink-600/80">
            Browse the collections and find your team.
          </p>
        </div>
        <button type="button" onClick={() => go('/shop')} className="btn-primary">
          Start shopping
        </button>
      </div>
    )
  }

  return (
    <>
      <ul className="divide-y divide-ink-200/60">
        {items.map((item) => (
          <li key={item.key} className="flex gap-3.5 px-5 py-4">
            <Link
              to={`/product/${item.slug}`}
              onClick={onNavigate}
              className="h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-ink-50"
            >
              {item.image_url ? (
                <img src={item.image_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <JerseyGraphic
                  seed={item.slug}
                  primary={item.primary_color}
                  secondary={item.secondary_color}
                  showNumber={false}
                  className="h-full w-full"
                />
              )}
            </Link>

            <div className="min-w-0 flex-1">
              <Link
                to={`/product/${item.slug}`}
                onClick={onNavigate}
                className="line-clamp-2 text-sm font-semibold leading-snug text-ink-900 hover:text-lime-dark"
              >
                {item.name}
              </Link>
              <p className="mt-0.5 text-xs text-ink-600/80">{item.variantLabel}</p>

              <div className="mt-2 flex items-center justify-between gap-2">
                <div className="flex items-center rounded-full border border-ink-200">
                  <QtyBtn onClick={() => setQuantity(item.key, item.quantity - 1)} label="Decrease quantity">
                    <Icon name="minus" size={13} />
                  </QtyBtn>
                  <span className="w-7 text-center text-xs font-bold tabular-nums">{item.quantity}</span>
                  <QtyBtn onClick={() => setQuantity(item.key, item.quantity + 1)} label="Increase quantity">
                    <Icon name="plus" size={13} />
                  </QtyBtn>
                </div>
                <span className="text-sm font-bold text-ink-950">
                  {formatPrice(item.unitPrice * item.quantity)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => removeItem(item.key)}
              className="h-7 w-7 shrink-0 rounded-full text-ink-600/60 transition-colors hover:bg-flame/10 hover:text-flame focus-ring"
              aria-label={`Remove ${item.name} from cart`}
            >
              <Icon name="trash" size={15} />
            </button>
          </li>
        ))}
      </ul>

      <div className="space-y-2 p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink-600">Subtotal ({count} {count === 1 ? 'item' : 'items'})</span>
          <span className="text-base font-bold text-ink-950">{formatPrice(subtotal)}</span>
        </div>
        <p className="text-xs text-ink-600/80">
          Delivery charges and any promo discount are applied at checkout.
        </p>
        <button type="button" onClick={() => go('/checkout')} className="btn-primary w-full">
          Checkout
          <Icon name="arrowRight" size={16} />
        </button>
        <button type="button" onClick={() => go('/cart')} className="btn-ghost w-full">
          View full cart
        </button>
      </div>
    </>
  )
}

function QtyBtn({ onClick, label, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-7 w-7 items-center justify-center rounded-full text-ink-700 transition-colors hover:bg-ink-100 focus-ring"
    >
      {children}
    </button>
  )
}

/* ========================================================================== */
/* header                                                                     */
/* ========================================================================== */

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/shop', label: 'Shop' },
  { to: '/shop?isNew=true', label: 'New Arrivals', match: '/shop/new' },
  { to: '/shop?onSale=true', label: 'Sale', sale: true },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

export default function Header() {
  const [categories, setCategories] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [catOpen, setCatOpen] = useState(false)
  const [acctOpen, setAcctOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const { count } = useCart()
  const { user } = useAuth()
  const location = useLocation()

  const headerRef = useRef(null)

  useEffect(() => {
    categoriesApi.all().then(setCategories).catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    setAnnouncements([
      'Free delivery inside Dhaka over ৳5,000',
      'Cash on delivery available nationwide',
      'Custom jerseys printed in 3–5 days',
    ])
  }, [])

  // Solid background once the page scrolls past the hero edge.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close every transient panel on navigation.
  useEffect(() => {
    setMenuOpen(false)
    setSearchOpen(false)
    setCatOpen(false)
    setAcctOpen(false)
  }, [location.pathname, location.search])

  // A click outside the header dismisses the dropdown panels.
  useEffect(() => {
    const onDown = (e) => {
      if (headerRef.current && !headerRef.current.contains(e.target)) {
        setCatOpen(false)
        setAcctOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const closeAll = useCallback(() => {
    setMenuOpen(false)
    setSearchOpen(false)
    setCatOpen(false)
    setAcctOpen(false)
  }, [])

  const catsByParent = useCallback(
    (parentSlug) => categories.filter((c) => c.parent_id === parentSlug),
    [categories],
  )
  const rootCategories = useCallback(
    () => categories.filter((c) => !c.parent_id),
    [categories],
  )

  const linkClass = ({ isActive }) =>
    `relative py-2 text-[13px] font-semibold uppercase tracking-wider transition-colors focus-ring rounded ${
      isActive ? 'text-ink-950' : 'text-ink-700 hover:text-ink-950'
    }`

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-ink-950 focus:px-5 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>

      <header ref={headerRef} className="sticky top-0 z-50">
        <AnnouncementBar messages={announcements} />

        {/* --- desktop bar ------------------------------------------------ */}
        <div
          className={`hidden border-b border-ink-200/70 bg-white/95 backdrop-blur-md transition-shadow lg:block ${
            scrolled ? 'shadow-card' : ''
          }`}
        >
          <div className="container-x flex h-[68px] items-center gap-6">
            <Link to="/" className="shrink-0 focus-ring rounded" aria-label="FootballTrix home">
              <Logo />
            </Link>

            <nav className="flex items-center gap-5" aria-label="Main">
              <NavLink to="/" className={linkClass} end>Home</NavLink>
              <NavLink to="/shop" className={linkClass}>Shop</NavLink>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setCatOpen((v) => !v); setAcctOpen(false) }}
                  aria-expanded={catOpen}
                  aria-haspopup="true"
                  className="flex items-center gap-1 py-2 text-[13px] font-semibold uppercase tracking-wider text-ink-700 transition-colors hover:text-ink-950 focus-ring rounded"
                >
                  Categories
                  <Icon name={catOpen ? 'chevronUp' : 'chevronDown'} size={14} />
                </button>
              </div>

              <NavLink to="/shop?isNew=true" className={linkClass}>New Arrivals</NavLink>
              <NavLink
                to="/shop?onSale=true"
                className={({ isActive }) =>
                  `${isActive ? 'text-flame' : 'text-flame'} py-2 text-[13px] font-semibold uppercase tracking-wider transition-colors hover:opacity-75 focus-ring rounded`
                }
              >
                Sale
              </NavLink>
              <NavLink to="/about" className={linkClass}>About</NavLink>
              <NavLink to="/contact" className={linkClass}>Contact</NavLink>
            </nav>

            <div className="ml-auto flex items-center gap-2">
              <div className="w-64">
                <SearchBox onNavigate={closeAll} />
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setAcctOpen((v) => !v); setCatOpen(false) }}
                  aria-expanded={acctOpen}
                  aria-haspopup="true"
                  aria-label="Account"
                  className="flex h-10 w-10 items-center justify-center rounded-full text-ink-800 transition-colors hover:bg-ink-100 focus-ring"
                >
                  <Icon name="user" size={20} />
                </button>
                <AccountPanel open={acctOpen} onClose={() => setAcctOpen(false)} />
              </div>

              <button
                type="button"
                onClick={() => setCartOpen(true)}
                className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink-800 transition-colors hover:bg-ink-100 focus-ring"
                aria-label={`Cart, ${count} ${count === 1 ? 'item' : 'items'}`}
              >
                <Icon name="cart" size={20} />
                {count > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-[19px] min-w-[19px] items-center justify-center rounded-full bg-flame px-1 text-[10px] font-bold text-white ring-2 ring-white">
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </button>
            </div>
          </div>

          <CategoryMenu categories={categories} open={catOpen} onClose={() => setCatOpen(false)} />
        </div>

        {/* --- mobile bar ------------------------------------------------- */}
        <div className="border-b border-ink-200/70 bg-white/95 backdrop-blur-md lg:hidden">
          <div className="flex h-14 items-center gap-2 px-4">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-ink-900 transition-colors hover:bg-ink-100 focus-ring"
              aria-label="Open menu"
            >
              <Icon name="menu" size={22} />
            </button>

            <Link to="/" className="focus-ring rounded" aria-label="FootballTrix home">
              <Logo />
            </Link>

            <div className="ml-auto flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSearchOpen((v) => !v)}
                className="flex h-10 w-10 items-center justify-center rounded-full text-ink-900 transition-colors hover:bg-ink-100 focus-ring"
                aria-label="Search"
                aria-expanded={searchOpen}
              >
                <Icon name="search" size={20} />
              </button>
              <button
                type="button"
                onClick={() => setCartOpen(true)}
                className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink-900 transition-colors hover:bg-ink-100 focus-ring"
                aria-label={`Cart, ${count} ${count === 1 ? 'item' : 'items'}`}
              >
                <Icon name="cart" size={20} />
                {count > 0 && (
                  <span className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-flame px-1 text-[10px] font-bold text-white ring-2 ring-white">
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </button>
            </div>
          </div>

          {searchOpen && (
            <div className="border-t border-ink-200/70 px-4 py-3 animate-fade">
              <SearchBox autoFocus onNavigate={() => setSearchOpen(false)} onClose={() => setSearchOpen(false)} />
            </div>
          )}
        </div>

        {/* --- mobile navigation drawer ---------------------------------- */}
        <Drawer
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          side="left"
          title="Menu"
          label="Site navigation"
        >
          <nav className="p-3" aria-label="Mobile">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={closeAll}
                className={({ isActive }) =>
                  `flex items-center justify-between rounded-xl px-3.5 py-3 text-sm font-semibold uppercase tracking-wide transition-colors ${
                    isActive ? 'bg-ink-950 text-white' : 'text-ink-800 hover:bg-ink-50'
                  }`
                }
              >
                {link.label}
                <Icon name="chevronRight" size={16} className="opacity-40" />
              </NavLink>
            ))}

            <div className="my-3 h-px bg-ink-200/70" />

            <p className="px-3.5 pb-2 pt-1 text-[11px] font-bold uppercase tracking-widest text-ink-600/70">
              Categories
            </p>
            <ul className="space-y-0.5">
              {rootCategories().map((cat) => (
                <li key={cat.id}>
                  <Link
                    to={`/category/${cat.slug}`}
                    onClick={closeAll}
                    className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-ink-800 transition-colors hover:bg-ink-50 focus-ring"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-950 text-lime-accent">
                      <Icon name={cat.icon ?? 'jersey'} size={15} />
                    </span>
                    {cat.name}
                  </Link>

                  {catsByParent(cat.slug).map((kid) => (
                    <Link
                      key={kid.id}
                      to={`/category/${kid.slug}`}
                      onClick={closeAll}
                      className="ml-11 block rounded-lg py-1.5 pl-2 text-sm text-ink-600 transition-colors hover:text-ink-950 focus-ring"
                    >
                      {kid.name}
                    </Link>
                  ))}
                </li>
              ))}
            </ul>

            <div className="my-3 h-px bg-ink-200/70" />

            {user ? (
              <>
                <NavLink
                  to="/my-account"
                  onClick={closeAll}
                  className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold text-ink-800 transition-colors hover:bg-ink-50 focus-ring"
                >
                  <Icon name="user" size={17} className="text-ink-600" />
                  My account
                </NavLink>
                <NavLink
                  to="/orders"
                  onClick={closeAll}
                  className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold text-ink-800 transition-colors hover:bg-ink-50 focus-ring"
                >
                  <Icon name="package" size={17} className="text-ink-600" />
                  My orders
                </NavLink>
              </>
            ) : (
              <div className="space-y-2 p-1">
                <NavLink to="/login" onClick={closeAll} className="btn-primary w-full">
                  Sign in
                </NavLink>
                <NavLink to="/register" onClick={closeAll} className="btn-ghost w-full">
                  Create account
                </NavLink>
              </div>
            )}
          </nav>
        </Drawer>
      </header>

      {/* --- cart drawer --------------------------------------------------- */}
      <Drawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        title={`Your cart (${count})`}
        label="Shopping cart"
        footer={null}
      >
        <CartDrawerContents onNavigate={() => setCartOpen(false)} />
      </Drawer>
    </>
  )
}
