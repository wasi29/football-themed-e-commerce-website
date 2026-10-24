import { Link } from 'react-router-dom'
import Icon from '../ui/Icon'
import JerseyGraphic from '../product/JerseyGraphic'
import SectionHeading, { SeeAllLink } from './SectionHeading'

/**
 * Featured collections — editorial cards, not a plain product grid.
 * The first card spans two columns on desktop so the row has rhythm.
 */
export default function Collections({ collections = [], products = [] }) {
  if (!collections.length) return null

  return (
    <section className="section">
      <div className="container-x">
        <SectionHeading
          eyebrow="Curated for you"
          title="Featured collections"
          lede="Shop by the season, the tournament, or the way you actually wear your kit."
          action={<SeeAllLink to="/shop" label="Browse all" />}
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.slice(0, 4).map((collection, i) => {
            const related = products.filter((p) => p.collection_slug === collection.slug)
            const lead = related[0]
            const accent = collection.accent_color ?? '#C8FF3D'
            const isLead = i === 0

            return (
              <Link
                key={collection.id}
                to={`/shop?collection=${collection.slug}`}
                className={`group relative flex flex-col overflow-hidden rounded-3xl bg-ink-950 p-7 transition-transform duration-300 hover:-translate-y-1 ${
                  isLead ? 'lg:col-span-2 lg:row-span-2 lg:min-h-[34rem]' : 'min-h-[16rem]'
                }`}
              >
                {/* accent wash */}
                <div
                  className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-30 blur-3xl transition-opacity duration-500 group-hover:opacity-50"
                  style={{ background: accent }}
                  aria-hidden="true"
                />

                {/* product art */}
                {lead && (
                  <div
                    className={`pointer-events-none absolute ${
                      isLead
                        ? 'bottom-0 right-0 h-[70%] w-[55%] opacity-90'
                        : 'bottom-0 right-0 h-full w-[62%] opacity-40'
                    } transition-transform duration-500 group-hover:scale-105`}
                  >
                    <JerseyGraphic
                      seed={lead.slug}
                      primary={lead.primary_color}
                      secondary={lead.secondary_color}
                      showNumber={false}
                      className="h-full w-full"
                    />
                  </div>
                )}

                <div className="relative flex h-full flex-col">
                  <span
                    className="mb-4 w-fit rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest"
                    style={{ background: `${accent}22`, color: accent }}
                  >
                    {related.length} {related.length === 1 ? 'product' : 'products'}
                  </span>

                  <h3
                    className={`font-display font-extrabold uppercase leading-[0.95] tracking-tight text-white ${
                      isLead ? 'text-4xl sm:text-5xl' : 'text-2xl'
                    }`}
                  >
                    {collection.name}
                  </h3>

                  <p className={`mt-2.5 max-w-xs text-sm leading-relaxed text-white/60 ${isLead ? '' : 'line-clamp-2'}`}>
                    {collection.description}
                  </p>

                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-lime-accent lg:mt-auto">
                    Shop now
                    <Icon
                      name="arrowRight"
                      size={16}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
