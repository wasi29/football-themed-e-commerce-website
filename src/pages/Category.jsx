import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import JerseyGraphic from '../components/product/JerseyGraphic'
import { Breadcrumbs, TrustStrip } from '../components/ui/PageHeader'
import { ProductGrid } from '../components/product/ProductCard'
import { EmptyState, ProductGridSkeleton } from '../components/ui/Feedback'
import { categories as categoriesApi, products as productsApi } from '../lib/api'

const KIND_FILTERS = [
  { value: '', label: 'Everything' },
  { value: 'club', label: 'Club' },
  { value: 'international', label: 'International' },
  { value: 'national', label: 'National' },
  { value: 'training', label: 'Training' },
  { value: 'custom', label: 'Custom' },
]

/**
 * /category/:slug — a landing page, not just a filtered list.
 *
 * The header explains what the department actually is, sibling subcategories
 * are one tap away, and the product grid below does the rest.
 */
export default function Category() {
  const { slug } = useParams()
  const [category, setCategory] = useState(null)
  const [allCategories, setAllCategories] = useState([])
  const [items, setItems] = useState([])
  const [kind, setKind] = useState('')
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    setNotFound(false)
    setKind('')

    const load = async () => {
      const cat = await categoriesApi.bySlug(slug)
      if (!active) return
      setCategory(cat)
      if (!cat) { setNotFound(true); setLoading(false); return }

      const [list, all] = await Promise.all([
        productsApi.list({ category: slug, limit: 60, sort: 'newest' }),
        categoriesApi.all(),
      ])
      if (!active) return
      setItems(list.items)
      setAllCategories(all)
      setLoading(false)
    }

    load().catch(() => active && setLoading(false))
    return () => { active = false }
  }, [slug])

  const visible = kind ? items.filter((p) => p.kind === kind) : items
  const parent = category?.parent_id ? allCategories.find((c) => c.id === category.parent_id) : null
  const siblings = parent
    ? allCategories.filter((c) => c.parent_id === parent.id && c.id !== category.id)
    : []
  const children = allCategories.filter((c) => c.parent_id === category?.id)

  if (notFound) {
    return (
      <>
        <div className="container-x py-10">
          <Breadcrumbs items={[{ label: 'Shop', to: '/shop' }, { label: 'Not found' }]} />
        </div>
        <EmptyState
          icon="alert"
          title="That category does not exist"
          message="It may have been renamed or removed. Browse the full catalogue instead."
          action={<Link to="/shop" className="btn-dark">Go to shop</Link>}
        />
      </>
    )
  }

  return (
    <>
      {/* --- header -------------------------------------------------- */}
      <header className="relative overflow-hidden bg-ink-950 text-white">
        <div
          className="pointer-events-none absolute -right-24 -top-28 h-96 w-96 rounded-full opacity-25 blur-[110px]"
          style={{ background: category?.icon === 'trophy' ? '#C8FF3D' : '#1D4ED8' }}
          aria-hidden="true"
        />

        <div className="container-x relative py-12 sm:py-16">
          <Breadcrumbs
            light
            className="mb-6"
            items={[
              ...(parent ? [{ label: parent.name, to: `/category/${parent.slug}` }] : []),
              { label: category?.name ?? 'Category' },
            ]}
          />

          <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <span className="chip mb-5 border border-white/20 bg-white/5 text-lime-accent">
                <Icon name={category?.icon ?? 'jersey'} size={13} />
                {category?.name}
              </span>

              <h1 className="heading-lg text-balance text-white">
                {category?.name}
              </h1>

              {category?.description && (
                <p className="mt-4 max-w-xl text-base leading-relaxed text-white/65">
                  {category.description}
                </p>
              )}

              <div className="mt-7">
                <TrustStrip light />
              </div>
            </div>

            {/* category artwork */}
            <div className="pointer-events-none hidden justify-end lg:flex">
              <div className="relative h-52 w-52">
                <div className="absolute inset-0 rounded-full bg-white/5 blur-2xl" aria-hidden="true" />
                <JerseyGraphic
                  seed={category?.slug ?? slug}
                  primary={category?.icon === 'trophy' ? '#C8FF3D' : '#1D4ED8'}
                  secondary="#0B1220"
                  showNumber={false}
                  className="relative h-full w-full opacity-90"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* --- subcategory chips ---------------------------------------- */}
      {(children.length > 0 || siblings.length > 0) && (
        <div className="border-b border-ink-200/70 bg-white">
          <div className="container-x flex gap-2 overflow-x-auto py-4 no-scrollbar">
            <button
              type="button"
              onClick={() => setKind('')}
              aria-pressed={kind === ''}
              className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold transition-colors focus-ring ${
                kind === '' ? 'bg-ink-950 text-white' : 'border border-ink-200 text-ink-700 hover:border-ink-950'
              }`}
            >
              All {category?.name}
            </button>

            {(children.length ? children : siblings).map((cat) => (
              <Link
                key={cat.id}
                to={`/category/${cat.slug}`}
                className="shrink-0 rounded-full border border-ink-200 px-4 py-2 text-[13px] font-semibold text-ink-700 transition-colors hover:border-ink-950 hover:text-ink-950 focus-ring"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* --- grid ----------------------------------------------------- */}
      <div className="container-x py-10 sm:py-14">
        <div className="mb-7 flex items-center justify-between gap-4">
          <p className="text-sm text-ink-600">
            {loading ? 'Loading…' : (
              <>
                <span className="font-bold text-ink-950">{visible.length}</span>{' '}
                {visible.length === 1 ? 'product' : 'products'}
              </>
            )}
          </p>

          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {KIND_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setKind(f.value)}
                aria-pressed={kind === f.value}
                className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold transition-colors focus-ring ${
                  kind === f.value
                    ? 'bg-ink-950 text-white'
                    : 'border border-ink-200 bg-white text-ink-700 hover:border-ink-950'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <ProductGridSkeleton count={8} />
        ) : visible.length === 0 ? (
          <EmptyState
            icon="jersey"
            title="Nothing here just yet"
            message="We are printing more kits for this department. Check back soon, or browse the rest of the range."
            action={<Link to="/shop" className="btn-dark">Browse all products</Link>}
          />
        ) : (
          <ProductGrid products={visible} />
        )}
      </div>
    </>
  )
}
