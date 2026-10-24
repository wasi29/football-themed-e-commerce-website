import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../ui/Icon'
import Logo from '../ui/Logo'
import { categories as categoriesApi, collections as collectionsApi, newsletter } from '../../lib/api'
import { useEffect } from 'react'
import { SITE, DISTRICTS } from '../../lib/config'
import { whatsappLink } from '../../lib/format'
import { useToast } from '../../contexts/ToastContext'

const CURRENT_YEAR = new Date().getFullYear()

const HELP_LINKS = [
  { to: '/faq', label: 'Frequently Asked Questions' },
  { to: '/orders', label: 'Track your order' },
  { to: '/about#delivery', label: 'Delivery & returns' },
  { to: '/about#sizing', label: 'Size guide' },
  { to: '/contact', label: 'Contact us' },
]

const COMPANY_LINKS = [
  { to: '/about', label: 'About FootballTrix' },
  { to: '/contact', label: 'Contact' },
  { to: '/shop?onSale=true', label: 'Offers & sale' },
  { to: '/faq', label: 'FAQ' },
  { to: '/register', label: 'Create an account' },
]

export default function Footer() {
  const [categories, setCategories] = useState([])
  const [collections, setCollections] = useState([])
  const [email, setEmail] = useState('')
  const [subscribing, setSubscribing] = useState(false)
  const toast = useToast()

  useEffect(() => {
    categoriesApi.all().then((rows) => setCategories(rows.filter((c) => !c.parent_id))).catch(() => {})
    collectionsApi.all().then(setCollections).catch(() => {})
  }, [])

  const subscribe = async (e) => {
    e.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      toast.error('Please enter a valid email address.')
      return
    }
    setSubscribing(true)
    const { error } = await newsletter.subscribe(email)
    setSubscribing(false)
    if (error) {
      toast.error(error.message.includes('already') ? 'You are already on the list.' : 'Could not subscribe right now.')
      return
    }
    toast.success('You are on the list. Watch out for the next drop.')
    setEmail('')
  }

  // Evaluated once at module load: the copyright year is not reactive state,
  // and reading the clock during render is an impure call.
  const year = CURRENT_YEAR

  return (
    <footer className="mt-auto bg-ink-950 text-white">
      {/* --- newsletter band ------------------------------------------- */}
      <div className="border-b border-white/10">
        <div className="container-x grid gap-6 py-10 md:grid-cols-[1.1fr_1fr] md:items-center md:py-12">
          <div>
            <h2 className="heading-lg text-balance">
              Get the next drop <span className="text-lime-accent">before</span> everyone else
            </h2>
            <p className="mt-2.5 max-w-lg text-sm leading-relaxed text-white/65">
              New kits, restocks and member-only codes. One email a week, no spam — unsubscribe any time.
            </p>
          </div>

          <form onSubmit={subscribe} className="flex flex-col gap-2.5 sm:flex-row">
            <label htmlFor="footer-email" className="sr-only">Email address</label>
            <input
              id="footer-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="flex-1 rounded-full border border-white/20 bg-white/10 px-5 py-3.5 text-sm text-white placeholder:text-white/40 focus:border-lime-accent focus:outline-none focus:ring-2 focus:ring-lime-accent/25"
            />
            <button type="submit" disabled={subscribing} className="btn-primary shrink-0">
              {subscribing ? 'Joining…' : 'Subscribe'}
            </button>
          </form>
        </div>
      </div>

      {/* --- link columns ------------------------------------------------ */}
      <div className="container-x grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Logo tone="light" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">
            {SITE.tagline} Printed and delivered across Bangladesh, with cash on delivery everywhere.
          </p>

          <ul className="mt-5 space-y-2.5 text-sm">
            <li>
              <a
                href={whatsappLink(SITE.contact.whatsapp, 'Hi FootballTrix, I have a question about an order.')}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-white/70 transition-colors hover:text-lime-accent"
              >
                <Icon name="whatsapp" size={16} className="text-lime-accent" />
                +880 1700 000000
              </a>
            </li>
            <li>
              <a
                href={`mailto:${SITE.contact.email}`}
                className="flex items-center gap-2.5 text-white/70 transition-colors hover:text-lime-accent"
              >
                <Icon name="mail" size={16} className="text-white/40" />
                {SITE.contact.email}
              </a>
            </li>
            <li className="flex items-start gap-2.5 text-white/70">
              <Icon name="pin" size={16} className="mt-0.5 shrink-0 text-white/40" />
              {SITE.contact.address}
            </li>
            <li className="flex items-start gap-2.5 text-white/70">
              <Icon name="clock" size={16} className="mt-0.5 shrink-0 text-white/40" />
              {SITE.contact.hours}
            </li>
          </ul>

          <div className="mt-6 flex gap-2">
            {[
              ['facebook', SITE.social.facebook, 'f'],
              ['instagram', SITE.social.instagram, 'ig'],
              ['youtube', SITE.social.youtube, 'yt'],
              ['tiktok', SITE.social.tiktok, 'tt'],
            ].map(([key, url, short]) => (
              <a
                key={key}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`FootballTrix on ${key}`}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-[11px] font-bold uppercase text-white/70 transition-all hover:border-lime-accent hover:bg-lime-accent hover:text-ink-950"
              >
                {short}
              </a>
            ))}
          </div>
        </div>

        <FooterColumn title="Shop" links={categories.map((c) => ({ to: `/category/${c.slug}`, label: c.name }))} />
        <FooterColumn title="Collections" links={collections.map((c) => ({ to: `/shop?collection=${c.slug}`, label: c.name }))} />
        <div className="grid gap-10 sm:col-span-2 lg:grid-cols-2 lg:col-span-1">
          <FooterColumn title="Help" links={HELP_LINKS} />
          <FooterColumn title="Company" links={COMPANY_LINKS} />
        </div>
      </div>

      {/* --- service promises ------------------------------------------- */}
      <div className="border-t border-white/10">
        <div className="container-x grid gap-6 py-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['truck', 'Nationwide delivery', 'Inside Dhaka 1–2 days, outside 2–4 days.'],
            ['shield2', 'Cash on delivery', 'Pay when your kit arrives. No advance needed.'],
            ['refresh', '7-day exchange', 'Wrong size? Exchange it within a week.'],
            ['whatsapp', 'Real support', 'Message us and a human replies on WhatsApp.'],
          ].map(([icon, title, body]) => (
            <div key={title} className="flex gap-3.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-lime-accent">
                <Icon name={icon} size={19} />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-white/55">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- legal bar -------------------------------------------------- */}
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-3 py-5 text-center text-xs text-white/45 sm:flex-row sm:text-left">
          <p>© {year} FootballTrix. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5">
            <span>Made for football fans in Bangladesh</span>
            <Link to="/faq" className="transition-colors hover:text-lime-accent">Privacy</Link>
            <Link to="/faq" className="transition-colors hover:text-lime-accent">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({ title, links }) {
  if (!links.length) return null
  return (
    <div>
      <h3 className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-lime-accent">{title}</h3>
      <ul className="space-y-2.5 text-sm">
        {links.map((link) => (
          <li key={link.to + link.label}>
            <Link to={link.to} className="text-white/65 transition-colors hover:text-white focus-ring rounded">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Districts are exposed for the checkout select; re-exported for convenience. */
export { DISTRICTS }
