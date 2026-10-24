import { Link } from 'react-router-dom'
import Icon from '../ui/Icon'
import JerseyGraphic from '../product/JerseyGraphic'
import { ProductGrid, ProductRail } from '../product/ProductCard'
import SectionHeading, { SeeAllLink } from './SectionHeading'
import { formatPrice, discountPercent } from '../../lib/format'

/**
 * The homepage's product sections, each with its own layout so the page has
 * visual rhythm rather than eight identical grids.
 *
 *  - LatestGridSection  : standard 4-up grid, tight rhythm
 *  - CategoryShowcase   : one large lead product + a rail beside it
 *  - TournamentBanner   : full-bleed dark editorial with a horizontal rail
 *  - CustomStudio       : dark split section for made-to-order jerseys
 *  - CategoryTileGrid   : icon tile grid of all categories
 *  - BestSellersDark    : inverted grid on ink background
 */

export function LatestGridSection({ products, title = 'Latest arrivals', eyebrow = 'Just landed', lede }) {
  if (!products?.length) return null
  return (
    <section className="section-tight">
      <div className="container-x">
        <SectionHeading
          eyebrow={eyebrow}
          title={title}
          lede={lede}
          action={<SeeAllLink to="/shop?isNew=true" label="All new in" />}
        />
        <ProductGrid products={products.slice(0, 8)} />
      </div>
    </section>
  )
}

export function CategoryShowcase({
  eyebrow,
  title,
  lede,
  products = [],
  viewAll,
  background = 'white',
}) {
  if (!products.length) return null
  const lead = products[0]
  const rest = products.slice(1, 5)
  const dark = background === 'dark'

  return (
    <section className={`section ${dark ? 'bg-ink-950 text-white' : ''}`}>
      <div className="container-x">
        <SectionHeading
          eyebrow={eyebrow}
          title={title}
          lede={lede}
          light={dark}
          action={<SeeAllLink to={viewAll} label="View all" light={dark} />}
        />

        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          {/* lead product — large editorial card */}
          <Link
            to={`/product/${lead.slug}`}
            className={`group relative flex min-h-[26rem] flex-col overflow-hidden rounded-3xl border p-7 transition-transform duration-300 hover:-translate-y-1 ${
              dark ? 'border-white/10 bg-white/[0.04]' : 'border-ink-200/70 bg-ink-50'
            }`}
          >
            <div
              className="pointer-events-none absolute -right-10 -top-10 h-52 w-52 rounded-full opacity-20 blur-3xl transition-opacity group-hover:opacity-35"
              style={{ background: lead.primary_color }}
              aria-hidden="true"
            />

            <div className="pointer-events-none absolute bottom-2 right-2 h-[68%] w-[62%] transition-transform duration-500 group-hover:scale-105">
              <JerseyGraphic
                seed={lead.slug}
                primary={lead.primary_color}
                secondary={lead.secondary_color}
                className="h-full w-full"
              />
            </div>

            <div className="relative">
              {lead.is_new_arrival && (
                <span className="chip mb-4 bg-ink-950 text-white">New in</span>
              )}
              <h3 className={`heading-md max-w-[16ch] text-2xl ${dark ? 'text-white' : 'text-ink-950'}`}>
                {lead.name}
              </h3>
              <p className={`mt-2 max-w-xs text-sm leading-relaxed ${dark ? 'text-white/60' : 'text-ink-600/90'}`}>
                {lead.short_description}
              </p>
            </div>

            <div className="relative mt-auto flex items-end justify-between gap-3 pt-6">
              <div>
                <p className={`text-xl font-bold ${dark ? 'text-lime-accent' : 'text-ink-950'}`}>
                  {formatPrice(lead.sale_price ?? lead.base_price)}
                </p>
                {discountPercent(lead.base_price, lead.sale_price) && (
                  <p className={`text-xs ${dark ? 'text-white/45' : 'text-ink-600/70'}`}>
                    <span className="line-through">{formatPrice(lead.base_price)}</span>
                  </p>
                )}
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-lime-accent text-ink-950 transition-transform group-hover:translate-x-1">
                <Icon name="arrowRight" size={19} />
              </span>
            </div>
          </Link>

          {/* supporting rail */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:gap-x-5">
            {rest.map((p) => (
              <Link
                key={p.id}
                to={`/product/${p.slug}`}
                className="group flex flex-col focus-ring rounded"
              >
                <div
                  className={`aspect-square overflow-hidden rounded-2xl ${
                    dark ? 'bg-white/[0.04]' : 'bg-ink-50'
                  }`}
                >
                  {p.thumbnail_url ? (
                    <img
                      src={p.thumbnail_url}
                      alt={p.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center p-4 transition-transform duration-500 group-hover:scale-105">
                      <JerseyGraphic
                        seed={p.slug}
                        primary={p.primary_color}
                        secondary={p.secondary_color}
                        className="h-full w-auto"
                      />
                    </div>
                  )}
                </div>
                <h4
                  className={`mt-3 line-clamp-2 text-sm font-semibold leading-snug ${
                    dark ? 'text-white group-hover:text-lime-accent' : 'text-ink-900 group-hover:text-lime-dark'
                  }`}
                >
                  {p.name}
                </h4>
                <p className={`mt-1 text-sm font-bold ${dark ? 'text-white/80' : 'text-ink-950'}`}>
                  {formatPrice(p.sale_price ?? p.base_price)}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export function TournamentBanner({ banner, products = [], viewAll = '/category/world-cup' }) {
  if (!products.length && !banner) return null
  const accent = banner?.accent_color ?? '#C8FF3D'

  return (
    <section className="relative overflow-hidden bg-ink-950 py-16 text-white sm:py-24">
      <div
        className="pointer-events-none absolute -left-24 top-1/3 h-96 w-96 rounded-full opacity-25 blur-[120px]"
        style={{ background: accent }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '28px 28px' }}
        aria-hidden="true"
      />

      <div className="container-x relative">
        <div className="mx-auto max-w-2xl text-center">
          {banner?.eyebrow && (
            <span className="chip mb-5 border border-white/20 bg-white/5" style={{ color: accent }}>
              <Icon name="trophy" size={13} />
              {banner.eyebrow}
            </span>
          )}
          <h2 className="heading-lg text-balance text-white">
            {banner?.title ?? 'World Cup 2026'}
          </h2>
          {banner?.subtitle && (
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/65">
              {banner.subtitle}
            </p>
          )}
          <Link to={banner?.cta_link ?? viewAll} className="btn-primary mt-8">
            {banner?.cta_label ?? 'Shop the collection'}
            <Icon name="arrowRight" size={17} />
          </Link>
        </div>

        <div className="mt-12 sm:mt-16">
          <ProductRail products={products} />
        </div>
      </div>
    </section>
  )
}

export function CustomStudio({ products = [] }) {
  const lead = products[0]
  const benefits = [
    'Any name, any number, any badge',
    'Full sublimation — the print will not crack',
    'Team and bulk orders from 10 pieces',
    'Printed in Dhaka, ready in 3–5 days',
  ]

  return (
    <section className="section overflow-hidden">
      <div className="container-x">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {/* art */}
          <div className="relative order-2 lg:order-1">
            <div className="relative mx-auto aspect-[5/4] w-full max-w-lg rounded-3xl bg-gradient-to-br from-ink-900 via-ink-800 to-ink-950 p-8">
              <div
                className="pointer-events-none absolute inset-0 rounded-3xl opacity-40 blur-3xl"
                style={{ background: lead?.primary_color ?? '#C8FF3D' }}
                aria-hidden="true"
              />
              <div className="relative flex h-full items-center justify-center gap-4">
                <JerseyGraphic
                  seed="custom-studio-front"
                  primary="#0B1220"
                  secondary="#C8FF3D"
                  className="h-full w-1/2 opacity-95"
                />
                <JerseyGraphic
                  seed="custom-studio-back"
                  primary="#1F2937"
                  secondary="#FB923C"
                  showNumber={false}
                  className="h-3/4 w-1/2 opacity-80"
                />
              </div>
            </div>

            <div className="absolute -bottom-5 -right-3 rounded-2xl border border-ink-200 bg-white px-5 py-4 shadow-lift sm:right-8">
              <p className="font-display text-2xl font-extrabold text-ink-950">3–5 days</p>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-600">
                Made-to-order turnaround
              </p>
            </div>
          </div>

          {/* copy */}
          <div className="order-1 lg:order-2">
            <span className="eyebrow-accent mb-4">
              <span className="h-px w-7 bg-lime-dark" />
              Premium & custom
            </span>
            <h2 className="heading-lg text-ink-950">
              Built for <span className="text-lime-dark">you</span>, not off a shelf
            </h2>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-ink-600/95">
              Our print team in Dhaka builds your jersey to spec: your base colour, your crest,
              your name and number. Send the design, we message you on WhatsApp to confirm, and
              it arrives ready for matchday.
            </p>

            <ul className="mt-7 space-y-3">
              {benefits.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-lime-accent text-ink-950">
                    <Icon name="check" size={12} strokeWidth={3} />
                  </span>
                  <span className="text-sm font-medium text-ink-800">{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link to="/category/custom-jerseys" className="btn-dark">
                Start customising
                <Icon name="arrowRight" size={17} />
              </Link>
              <Link to="/contact" className="btn-outline">
                Request a bulk quote
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export function CategoryTileGrid({ categories = [] }) {
  if (!categories.length) return null

  return (
    <section className="section bg-ink-50">
      <div className="container-x">
        <SectionHeading
          eyebrow="Every department"
          title="Shop by category"
          lede="Six collections covering everything from the Bangladesh Premier League to the World Cup stage."
          align="center"
        />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/category/${cat.slug}`}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-ink-200/80 bg-white p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-ink-950 hover:shadow-lift"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-950 text-lime-accent transition-transform duration-300 group-hover:scale-110">
                <Icon name={cat.icon ?? 'jersey'} size={24} />
              </span>
              <span className="font-display text-base font-bold uppercase leading-tight tracking-tight text-ink-950">
                {cat.name}
              </span>
              <span className="line-clamp-2 text-[11px] leading-relaxed text-ink-600/80">
                {cat.description}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export function BestSellersDark({ products = [] }) {
  if (!products.length) return null

  return (
    <section className="section bg-ink-950 text-white">
      <div className="container-x">
        <SectionHeading
          eyebrow="Fan favourites"
          title="Best sellers"
          lede="The kits our customers reorder most. If you are unsure where to start, start here."
          light
          action={<SeeAllLink to="/shop?sort=popular" label="See what sells" light />}
        />
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
          <ProductGrid products={products.slice(0, 4)} onDark />
        </div>
      </div>
    </section>
  )
}
