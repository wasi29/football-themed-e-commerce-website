import { Link } from 'react-router-dom'
import Icon from '../ui/Icon'
import Stars from '../ui/Stars'
import SectionHeading from './SectionHeading'
import { SITE } from '../../lib/config'
import { whatsappLink } from '../../lib/format'
import { useToast } from '../../contexts/ToastContext'

/* ========================================================================== */
/* why FootballTrix                                                           */
/* ========================================================================== */

const REASONS = [
  {
    icon: 'shield2',
    title: 'Print that survives the season',
    body: 'Full sublimation, not heat transfer. Our jerseys have been through a full Dhaka season and a hundred washes without cracking.',
  },
  {
    icon: 'truck',
    title: 'Delivery to all 64 districts',
    body: 'Inside Dhaka in 1–2 days, anywhere else in 2–4. Cash on delivery, and you pay the courier, not us.',
  },
  {
    icon: 'refresh',
    title: '7-day no-drama exchange',
    body: 'Wrong size or not the right fit? Exchange it within a week. You cover the return courier, we cover the rest.',
  },
  {
    icon: 'whatsapp',
    title: 'Support from actual people',
    body: 'Message us on WhatsApp and you get a reply from someone who can check your order, not a bot.',
  },
  {
    icon: 'paint',
    title: 'Custom and bulk orders',
    body: 'Team kits, tournament orders and corporate pitches from 10 pieces up, printed in Dhaka.',
  },
  {
    icon: 'tag',
    title: 'Honest, stable pricing',
    body: 'No inflated “original price” games. When something is on sale, the discount is real.',
  },
]

export function WhyFootballTrix() {
  return (
    <section className="section">
      <div className="container-x">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <span className="eyebrow-accent mb-4">
              <span className="h-px w-7 bg-lime-dark" />
              Why FootballTrix
            </span>
            <h2 className="heading-lg text-ink-950">
              Built by fans, <span className="text-lime-dark">for</span> fans
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink-600/95">
              We started because buying a decent jersey in Dhaka was a gamble — inconsistent
              print, vague sizing, and no way to return anything. We fixed all three.
            </p>

            <div className="mt-8 rounded-2xl border border-ink-200/80 bg-ink-50 p-6">
              <div className="flex items-center gap-4">
                <span className="font-display text-5xl font-extrabold leading-none text-ink-950">
                  4.8
                </span>
                <div>
                  <Stars value={4.8} size={16} />
                  <p className="mt-1 text-xs font-medium text-ink-600">
                    From 1,900+ verified reviews
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {REASONS.map((reason, i) => (
              <div
                key={reason.title}
                className="group relative overflow-hidden rounded-2xl border border-ink-200/70 p-6 transition-all duration-300 hover:border-ink-950 hover:shadow-lift"
              >
                <span className="absolute right-4 top-3 font-display text-5xl font-extrabold text-ink-100 transition-colors group-hover:text-lime-accent/30">
                  {String(i + 1).padStart(2, '0')}
                </span>

                <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-ink-950 text-lime-accent transition-transform duration-300 group-hover:scale-110">
                  <Icon name={reason.icon} size={22} />
                </span>

                <h3 className="heading-md text-lg text-ink-950">{reason.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-600/90">{reason.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ========================================================================== */
/* testimonials                                                               */
/* ========================================================================== */

export function Testimonials({ testimonials = [] }) {
  if (!testimonials.length) return null
  const lead = testimonials[0]
  const rest = testimonials.slice(1, 5)

  return (
    <section className="section bg-ink-50">
      <div className="container-x">
        <SectionHeading
          eyebrow="Customer reviews"
          title="What fans say"
          lede="Real orders from real people across Bangladesh. We do not edit or delete the critical ones."
          align="center"
        />

        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          {/* lead quote */}
          <figure className="flex flex-col justify-between rounded-3xl bg-ink-950 p-8 text-white sm:p-10">
            <div>
              <Icon name="star" size={34} filled className="text-lime-accent" strokeWidth={0} />
              <blockquote className="mt-5 font-display text-2xl font-bold leading-snug sm:text-3xl">
                “{lead.text}”
              </blockquote>
            </div>
            <figcaption className="mt-8 flex items-center gap-3.5 border-t border-white/10 pt-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-lime-accent font-display text-lg font-extrabold text-ink-950">
                {lead.name[0]}
              </span>
              <span>
                <span className="block text-sm font-semibold text-white">{lead.name}</span>
                <span className="block text-xs text-white/50">
                  {lead.city} · Verified purchase
                </span>
              </span>
            </figcaption>
          </figure>

          {/* supporting quotes */}
          <div className="grid gap-5 sm:grid-cols-2">
            {rest.map((t) => (
              <figure
                key={t.name}
                className="flex flex-col rounded-2xl border border-ink-200/80 bg-white p-6"
              >
                <Stars value={t.rating} size={14} />
                <blockquote className="mt-3.5 flex-1 text-sm leading-relaxed text-ink-800">
                  “{t.text}”
                </blockquote>
                <figcaption className="mt-5 border-t border-ink-200/60 pt-4">
                  <span className="block text-sm font-semibold text-ink-950">{t.name}</span>
                  <span className="block text-xs text-ink-600/80">{t.city}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ========================================================================== */
/* WhatsApp offer / promo                                                     */
/* ========================================================================== */

export function WhatsAppOffer({ banner }) {
  const toast = useToast()

  const orderViaWhatsApp = () => {
    const message =
      `Hi FootballTrix! 👋\n\nI'd like to place an order for a custom jersey.\n\n` +
      `• Quantity: \n` +
      `• Size(s): \n` +
      `• Name & number: \n` +
      `• Colour: \n` +
      `• Delivery district: \n\n` +
      `Please send me the total and confirm production time.`
    window.open(whatsappLink(SITE.contact.whatsapp, message), '_blank', 'noopener,noreferrer')
  }

  return (
    <section className="section">
      <div className="container-x">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#128C7E] via-[#0E7C4A] to-ink-950 p-8 text-white sm:p-12 lg:p-16">
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-lime-accent opacity-20 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative grid items-center gap-10 lg:grid-cols-[1.25fr_0.75fr]">
            <div>
              <span className="chip mb-5 border border-white/25 bg-white/10 text-white">
                <Icon name="whatsapp" size={13} />
                Order on WhatsApp
              </span>

              <h2 className="heading-lg text-balance text-white">
                Skip the form. Tell us what you need and we will sort it.
              </h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-white/75">
                Bulk orders, custom designs, or a question about sizing — message the team
                directly and get a real answer, usually within an hour during opening times.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={orderViaWhatsApp}
                  className="btn bg-white px-6 py-3 text-ink-950 hover:-translate-y-0.5 hover:bg-lime-accent"
                >
                  <Icon name="whatsapp" size={18} />
                  Message us on WhatsApp
                </button>
                <Link
                  to="/faq"
                  className="btn border-2 border-white/30 px-6 py-3 text-white hover:border-white"
                >
                  Read the FAQ
                </Link>
              </div>
            </div>

            {/* promo code card */}
            <div className="rounded-2xl border border-dashed border-white/30 bg-white/10 p-7 backdrop-blur-sm">
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/60">
                New customer code
              </p>
              <p className="mt-2 font-display text-5xl font-extrabold tracking-tight text-white">
                FTX10
              </p>
              <p className="mt-2.5 text-sm leading-relaxed text-white/70">
                10% off your first order over ৳1,500. Applies at checkout.
              </p>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText('FTX10')
                  toast.success('Code FTX10 copied')
                }}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-lime-accent py-3 text-sm font-bold text-ink-950 transition-colors hover:bg-lime-dark"
              >
                <Icon name="copy" size={16} />
                Copy code
              </button>
            </div>
          </div>

          {banner?.subtitle && (
            <p className="relative mt-8 border-t border-white/15 pt-6 text-xs text-white/55">
              {banner.title} — {banner.subtitle}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

/* ========================================================================== */
/* mid-page promo strip (driven by `midpage` banners)                          */
/* ========================================================================== */

export function PromoStrip({ banner }) {
  if (!banner) return null
  const accent = banner.accent_color ?? '#C8FF3D'

  return (
    <section className="pb-4">
      <div className="container-x">
        <Link
          to={banner.cta_link ?? '/shop'}
          className="group relative flex flex-col items-start gap-5 overflow-hidden rounded-3xl border border-ink-200/80 bg-white p-8 transition-transform duration-300 hover:-translate-y-1 hover:shadow-lift sm:flex-row sm:items-center sm:justify-between sm:p-10"
        >
          <div
            className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full opacity-15 blur-3xl"
            style={{ background: accent }}
            aria-hidden="true"
          />

          <div className="relative">
            {banner.eyebrow && (
              <span
                className="chip mb-3"
                style={{ background: `${accent}1F`, color: accent }}
              >
                {banner.eyebrow}
              </span>
            )}
            <h3 className="heading-md text-2xl sm:text-3xl text-ink-950">{banner.title}</h3>
            {banner.subtitle && (
              <p className="mt-2 max-w-lg text-sm text-ink-600/90">{banner.subtitle}</p>
            )}
          </div>

          <span className="btn-dark relative shrink-0">
            {banner.cta_label ?? 'Shop now'}
            <Icon
              name="arrowRight"
              size={17}
              className="transition-transform group-hover:translate-x-1"
            />
          </span>
        </Link>
      </div>
    </section>
  )
}
