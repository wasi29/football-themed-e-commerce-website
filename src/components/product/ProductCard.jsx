import { Link } from 'react-router-dom'
import Icon from '../ui/Icon'
import Stars from '../ui/Stars'
import JerseyGraphic from './JerseyGraphic'
import { discountPercent, formatPrice } from '../../lib/format'
import { useCart } from '../../contexts/CartContext'
import { useWishlist } from '../../contexts/WishlistContext'
import { useToast } from '../../contexts/ToastContext'

/**
 * Product card.
 *
 * @param {object} product card shape from the data layer
 * @param {boolean} [compact] tighter layout for side rails
 * @param {boolean} [onDark] light text, for cards sitting on a dark section
 */
export default function ProductCard({ product, compact = false, onDark = false }) {
  // Hooks must run before any early return, or the hook order changes
  // whenever a list renders a null slot.
  const { addItem } = useCart()
  const wishlist = useWishlist()
  const toast = useToast()

  if (!product) return null

  const price = product.sale_price ?? product.base_price
  const off = discountPercent(product.base_price, product.sale_price)
  const stock = (product.variants ?? []).reduce((s, v) => s + (v.stock ?? 0), 0)
  const soldOut = stock === 0
  const lowStock = !soldOut && stock <= 10

  // Default variant: the first in-stock one, so quick-add never lands on zero.
  const defaultVariant = (product.variants ?? []).find((v) => (v.stock ?? 0) > 0)

  const wished = wishlist.has(product.id)

  const quickAdd = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (soldOut || !defaultVariant) return
    addItem(product, defaultVariant, 1)
    toast.success(`${product.name} added to cart`)
  }

  const toggleWish = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    const added = await wishlist.toggle(product.id)
    toast.info(added ? 'Saved to your wishlist' : 'Removed from wishlist')
  }

  return (
    <article className="group relative flex flex-col">
      <Link
        to={`/product/${product.slug}`}
        className="focus-ring relative block overflow-hidden rounded-2xl bg-ink-50"
        aria-label={product.name}
      >
        {/* Image area — 4:5 portrait matches how kits are shot */}
        <div className="relative aspect-[4/5] w-full overflow-hidden">
          {product.thumbnail_url ? (
            <img
              src={product.thumbnail_url}
              alt={product.name}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center p-5 transition-transform duration-500 group-hover:scale-[1.06]">
              <JerseyGraphic
                seed={product.slug}
                primary={product.primary_color}
                secondary={product.secondary_color}
                name={product.team_name}
                className="h-full w-auto"
              />
            </div>
          )}

          {/* Backdrop wash tinted by the shirt colour */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-multiply"
            style={{ background: `radial-gradient(circle at 50% 30%, ${product.primary_color}, transparent 70%)` }}
            aria-hidden="true"
          />
        </div>

        {/* Badges */}
        <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {off && (
            <span className="chip bg-flame text-white shadow-sm">{off}% OFF</span>
          )}
          {product.is_new_arrival && !off && (
            <span className="chip bg-ink-950 text-white">New</span>
          )}
          {product.is_best_seller && !off && !product.is_new_arrival && (
            <span className="chip bg-amber-400 text-ink-950">Bestseller</span>
          )}
        </div>

        {/* Wishlist */}
        <button
          type="button"
          onClick={toggleWish}
          aria-label={wished ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          aria-pressed={wished}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-ink-700 shadow-sm backdrop-blur transition-all hover:bg-white hover:text-flame focus-ring"
        >
          <Icon name="heart" size={17} filled={wished} className={wished ? 'text-flame' : ''} />
        </button>

        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
            <span className="chip bg-ink-950 px-4 py-2 text-white">Sold out</span>
          </div>
        )}

        {/* Quick add slides up on hover; always visible on touch devices */}
        {!soldOut && (
          <div
            className={`absolute inset-x-3 bottom-3 transition-all duration-300 ${
              compact
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0'
            } max-md:opacity-100 max-md:translate-y-0`}
          >
            <button
              type="button"
              onClick={quickAdd}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-ink-950/95 py-2.5 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-ink-800 focus-ring"
            >
              <Icon name="cart" size={16} />
              Quick add
            </button>
          </div>
        )}
      </Link>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-1.5 pt-3.5">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`truncate text-[11px] font-bold uppercase tracking-wider ${
              onDark ? 'text-white/55' : 'text-ink-600/80'
            }`}
          >
            {product.team_name || product.category_name}
          </span>
          {product.rating_count > 0 && (
            <Stars value={product.rating_avg} count={product.rating_count} size={12} showValue />
          )}
        </div>

        <h3
          className={`line-clamp-2 text-sm font-semibold leading-snug sm:text-[15px] ${
            onDark ? 'text-white' : 'text-ink-900'
          }`}
        >
          <Link
            to={`/product/${product.slug}`}
            className={`focus-ring rounded transition-colors ${
              onDark ? 'hover:text-lime-accent' : 'hover:text-lime-dark'
            }`}
          >
            {product.name}
          </Link>
        </h3>

        <div className="mt-auto flex flex-wrap items-baseline gap-x-2 gap-y-1 pt-1.5">
          <span
            className={`text-base font-bold ${
              off ? 'text-flame' : onDark ? 'text-white' : 'text-ink-950'
            }`}
          >
            {formatPrice(price)}
          </span>
          {off && (
            <span
              className={`text-xs line-through ${
                onDark ? 'text-white/50' : 'text-ink-600/70'
              }`}
            >
              {formatPrice(product.base_price)}
            </span>
          )}
        </div>

        {lowStock && (
          <p className="text-[11px] font-semibold text-flame">Only {stock} left</p>
        )}
      </div>
    </article>
  )
}

/** Responsive product grid. */
export function ProductGrid({ products, compact = false, onDark = false, className = '' }) {
  return (
    <div
      className={`grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-5 sm:gap-y-10 lg:grid-cols-3 xl:grid-cols-4 ${className}`}
    >
      {products.map((p) => (
        <ProductCard key={p.id ?? p.slug} product={p} compact={compact} onDark={onDark} />
      ))}
    </div>
  )
}

/** Horizontal scroll rail for homepage rows. */
export function ProductRail({ products, className = '' }) {
  return (
    <div className={`-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 no-scrollbar sm:mx-0 sm:px-0 ${className}`}>
      {products.map((p) => (
        <div key={p.id ?? p.slug} className="w-[46vw] shrink-0 snap-start sm:w-[220px] lg:w-[250px]">
          <ProductCard product={p} />
        </div>
      ))}
    </div>
  )
}
