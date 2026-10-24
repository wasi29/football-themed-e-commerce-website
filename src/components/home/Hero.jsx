import { Link } from 'react-router-dom'
import Icon from '../ui/Icon'
import JerseyGraphic from '../product/JerseyGraphic'
import { formatPrice } from '../../lib/format'

/**
 * Homepage hero.
 *
 * Desktop and mobile creatives are two DIFFERENT banner rows
 * (`hero_desktop` / `hero_mobile`) so each can be edited independently from
 * the admin panel. When no image is set on a banner, we fall back to a
 * generated hero built from the banner accent colour.
 */

const FALLBACKS = {
  hero_desktop: {
    title: 'WEAR YOUR PASSION',
    subtitle: 'Premium Football Jerseys for Every Fan.',
    eyebrow: 'New Season Collection',
    cta_label: 'Shop Now',
    cta_link: '/shop',
    secondary_cta_label: 'Explore Collections',
    secondary_cta_link: '/category/club-jerseys',
    accent_color: '#C8FF3D',
  },
  hero_mobile: null, // falls through to the desktop row, re-laid out
}

const PROOF = [
  { value: '12,000+', label: 'Orders delivered' },
  { value: '4.8/5', label: 'Average rating' },
  { value: '64', label: 'Districts covered' },
]

export default function Hero({ banners = [] }) {
  const desktop = banners.find((b) => b.placement === 'hero_desktop') ?? { ...FALLBACKS.hero_desktop }
  const mobile = banners.find((b) => b.placement === 'hero_mobile') ?? desktop

  return (
    <section className="relative overflow-hidden bg-ink-950 text-white">
      {/* ambient light */}
      <div
        className="pointer-events-none absolute -right-24 -top-32 h-[34rem] w-[34rem] rounded-full opacity-30 blur-[110px]"
        style={{ background: desktop.accent_color ?? '#C8FF3D' }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-40 -left-20 h-[26rem] w-[26rem] rounded-full bg-pitch/40 opacity-40 blur-[110px]"
        aria-hidden="true"
      />
      {/* stadium light streaks */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(115deg, transparent 0 60px, #fff 60px 61px)',
        }}
        aria-hidden="true"
      />

      {/* ------------------------------ desktop ------------------------------ */}
      <div className="relative hidden lg:block">
        {desktop.image_url ? (
          <img
            src={desktop.image_url}
            alt={desktop.title}
            className="h-[560px] w-full object-cover"
            fetchPriority="high"
          />
        ) : (
          <GeneratedHero banner={desktop} />
        )}
      </div>

      {/* ------------------------------ mobile ------------------------------- */}
      <div className="relative lg:hidden">
        {mobile.image_url ? (
          <img
            src={mobile.mobile_image_url || mobile.image_url}
            alt={mobile.title}
            className="h-[430px] w-full object-cover sm:h-[500px]"
            fetchPriority="high"
          />
        ) : (
          <GeneratedHero banner={mobile} stacked />
        )}
      </div>
    </section>
  )
}

/** CSS/SVG hero used until real banner photography is uploaded. */
function GeneratedHero({ banner, stacked = false }) {
  return (
    <div className="container-x grid items-center gap-10 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-6 lg:py-20">
      <div className={stacked ? '' : 'max-w-2xl'}>
        {banner.eyebrow && (
          <span className="chip mb-6 border border-white/20 bg-white/5 text-lime-accent">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-lime-accent" />
            {banner.eyebrow}
          </span>
        )}

        <h1 className="heading-xl text-balance text-white">
          {banner.title}
        </h1>

        {banner.subtitle && (
          <p className="mt-5 max-w-md text-base leading-relaxed text-white/70 sm:text-lg">
            {banner.subtitle}
          </p>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link to={banner.cta_link || '/shop'} className="btn-primary">
            {banner.cta_label || 'Shop Now'}
            <Icon name="arrowRight" size={17} />
          </Link>
          {banner.secondary_cta_link && (
            <Link
              to={banner.secondary_cta_link}
              className="btn border-2 border-white/25 text-white hover:border-lime-accent hover:bg-lime-accent hover:text-ink-950"
            >
              {banner.secondary_cta_label || 'Explore'}
            </Link>
          )}
        </div>

        <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-white/10 pt-7">
          {PROOF.map((item) => (
            <div key={item.label}>
              <dt className="font-display text-2xl font-extrabold text-lime-accent sm:text-3xl">
                {item.value}
              </dt>
              <dd className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-white/45">
                {item.label}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* floating product stack */}
      <div className={`relative ${stacked ? 'mt-2 hidden' : 'hidden lg:block'}`}>
        <div className="relative mx-auto aspect-square w-full max-w-[30rem]">
          <div
            className="absolute inset-8 rounded-full opacity-25 blur-3xl"
            style={{ background: banner.accent_color ?? '#C8FF3D' }}
            aria-hidden="true"
          />
          <HeroJersey
            seed={banner.slug ?? 'hero-a'}
            primary={banner.accent_color ?? '#C8FF3D'}
            className="absolute inset-0 h-full w-full drop-shadow-2xl"
          />
          <HeroJersey
            seed={`${banner.slug ?? 'hero'}-alt`}
            primary="#1D4ED8"
            className="absolute -left-4 bottom-2 h-1/2 w-1/2 -rotate-12 opacity-90 drop-shadow-2xl"
          />
          <HeroJersey
            seed={`${banner.slug ?? 'hero'}-alt2`}
            primary="#DC2626"
            className="absolute -right-3 top-6 h-1/2 w-1/2 rotate-12 opacity-90 drop-shadow-2xl"
          />
        </div>

        <FloatingChip
          className="left-0 top-6"
          icon="shield2"
          text="Official-quality print"
        />
        <FloatingChip
          className="bottom-10 right-0"
          icon="truck"
          text={`Free over ${formatPrice(5000)}`}
        />
      </div>
    </div>
  )
}

/** Wraps the shared jersey artwork with a subtle float animation. */
function HeroJersey({ seed, primary, className }) {
  return (
    <div className={`animate-[float_7s_ease-in-out_infinite] ${className}`}>
      <JerseyGraphic
        seed={seed}
        primary={primary}
        secondary="#0B1220"
        showNumber={false}
        className="h-full w-full"
      />
    </div>
  )
}

function FloatingChip({ icon, text, className = '' }) {
  return (
    <div
      className={`absolute flex items-center gap-2.5 rounded-full border border-white/15 bg-white/10 px-4 py-2.5 backdrop-blur-md ${className}`}
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-lime-accent text-ink-950">
        <Icon name={icon} size={14} />
      </span>
      <span className="text-xs font-semibold text-white">{text}</span>
    </div>
  )
}
