import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import JerseyGraphic from '../components/product/JerseyGraphic'
import { PageHeader } from '../components/ui/PageHeader'
import { EmptyState } from '../components/ui/Feedback'
import { ProductRail } from '../components/product/ProductCard'
import { useCart } from '../contexts/CartContext'
import { useToast } from '../contexts/ToastContext'
import { coupons as couponsApi, products as productsApi } from '../lib/api'
import { SITE } from '../lib/config'
import { formatPrice, whatsappLink } from '../lib/format'

const PROMISED = [
  ['shield2', 'Cash on delivery'],
  ['truck', 'Free over ৳5,000'],
  ['refresh', '7-day exchange'],
]

export default function Cart() {
  const {
    items, count, subtotal, savings, coupon,
    setQuantity, removeItem, applyCoupon, clearCoupon, clear,
  } = useCart()

  const [code, setCode] = useState('')
  const [checking, setChecking] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const toast = useToast()

  const discount = coupon?.valid ? coupon.discount : 0
  const estimatedFee = subtotal >= 5000 ? 0 : 80
  const estimatedTotal = Math.max(0, subtotal + estimatedFee - discount)

  const applyCode = async (e) => {
    e?.preventDefault()
    if (!code.trim()) return
    setChecking(true)
    const result = await couponsApi.validate(code, subtotal)
    setChecking(false)

    if (!result.valid) { toast.error(result.reason); return }
    applyCoupon(result)
    toast.success(`Code applied — you saved ${formatPrice(result.discount)}`)
  }

  const orderOnWhatsApp = () => {
    const lines = items
      .map((i) => `• ${i.name} (${i.variantLabel}) × ${i.quantity} — ${formatPrice(i.unitPrice * i.quantity)}`)
      .join('\n')
    const message =
      `Hi FootballTrix! 👋\n\nI would like to order:\n\n${lines}\n\n` +
      `Subtotal: ${formatPrice(subtotal)}\n` +
      (coupon?.code ? `Promo: ${coupon.code} (-${formatPrice(discount)})\n` : '') +
      `\nPlease confirm availability and delivery time.`
    window.open(whatsappLink(SITE.contact.whatsapp, message), '_blank', 'noopener,noreferrer')
  }

  // Cross-sell: show a few best sellers when the cart is thin.
  if (items.length > 0 && count <= 3 && suggestions.length === 0) {
    productsApi.list({ limit: 6, bestSeller: true, sort: 'popular' })
      .then((r) => setSuggestions(r.items.filter((p) => !items.some((i) => i.slug === p.slug)).slice(0, 5)))
      .catch(() => {})
  }

  if (items.length === 0) {
    return (
      <>
        <PageHeader title="Your cart" breadcrumbs={[{ label: 'Cart' }]} />
        <EmptyState
          icon="cart"
          title="Your cart is empty"
          message="Nothing here yet. Browse the collections and find the kit you will actually wear."
          action={
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to="/shop" className="btn-primary">
                Start shopping
                <Icon name="arrowRight" size={17} />
              </Link>
              <Link to="/category/club-jerseys" className="btn-ghost">
                Club jerseys
              </Link>
            </div>
          }
        />
      </>
    )
  }

  return (
    <>
      <PageHeader
        eyebrow={`${count} ${count === 1 ? 'item' : 'items'} in your cart`}
        title="Your cart"
        breadcrumbs={[{ label: 'Cart' }]}
      />

      <div className="container-x py-10 sm:py-14">
        <div className="grid gap-10 lg:grid-cols-[1.6fr_0.9fr] lg:gap-12">
          {/* ---------------- lines ---------------- */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="heading-md text-xl">Order summary</h2>
              <button
                type="button"
                onClick={() => { clear(); toast.info('Cart cleared') }}
                className="text-xs font-semibold text-ink-600 underline underline-offset-2 transition-colors hover:text-flame focus-ring rounded"
              >
                Clear cart
              </button>
            </div>

            <ul className="divide-y divide-ink-200/70 border-y border-ink-200/70">
              {items.map((item) => {
                const lineOff = item.basePrice > item.unitPrice
                  ? Math.round(((item.basePrice - item.unitPrice) / item.basePrice) * 100)
                  : 0

                return (
                  <li key={item.key} className="flex gap-4 py-5 sm:gap-5">
                    <Link
                      to={`/product/${item.slug}`}
                      className="h-28 w-24 shrink-0 overflow-hidden rounded-xl bg-ink-50 sm:h-32 sm:w-28"
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

                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link
                            to={`/product/${item.slug}`}
                            className="line-clamp-2 text-sm font-semibold leading-snug text-ink-900 transition-colors hover:text-lime-dark focus-ring rounded sm:text-[15px]"
                          >
                            {item.name}
                          </Link>
                          <p className="mt-1 text-xs text-ink-600/80">
                            {item.variantLabel}
                            {item.sku && <span className="ml-2 text-ink-600/50">SKU {item.sku}</span>}
                          </p>
                          {lineOff > 0 && (
                            <span className="chip mt-2 bg-flame/10 text-flame">{lineOff}% off</span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(item.key)}
                          className="h-8 w-8 shrink-0 rounded-full text-ink-600/60 transition-colors hover:bg-flame/10 hover:text-flame focus-ring"
                          aria-label={`Remove ${item.name}`}
                        >
                          <Icon name="trash" size={16} />
                        </button>
                      </div>

                      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
                        <div className="flex h-11 items-center rounded-full border border-ink-200">
                          <button
                            type="button"
                            onClick={() => setQuantity(item.key, item.quantity - 1)}
                            className="flex h-10 w-10 items-center justify-center rounded-full text-ink-800 transition-colors hover:bg-ink-100 focus-ring"
                            aria-label="Decrease quantity"
                          >
                            <Icon name="minus" size={15} />
                          </button>
                          <span className="w-8 text-center text-sm font-bold tabular-nums">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => setQuantity(item.key, item.quantity + 1)}
                            disabled={item.quantity >= item.maxStock}
                            className="flex h-10 w-10 items-center justify-center rounded-full text-ink-800 transition-colors hover:bg-ink-100 disabled:opacity-30 focus-ring"
                            aria-label="Increase quantity"
                          >
                            <Icon name="plus" size={15} />
                          </button>
                        </div>

                        <div className="text-right">
                          <p className="text-base font-bold text-ink-950">
                            {formatPrice(item.unitPrice * item.quantity)}
                          </p>
                          {lineOff > 0 && (
                            <p className="text-xs text-ink-600/60 line-through">
                              {formatPrice(item.basePrice * item.quantity)}
                            </p>
                          )}
                        </div>
                      </div>

                      {item.maxStock <= 10 && (
                        <p className="mt-2 text-[11px] font-semibold text-flame">
                          Only {item.maxStock} left in stock
                        </p>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>

            <Link
              to="/shop"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-ink-950 underline decoration-lime-dark decoration-2 underline-offset-4 transition-colors hover:text-lime-dark focus-ring rounded"
            >
              <Icon name="arrowLeft" size={15} />
              Continue shopping
            </Link>

            {/* cross-sell */}
            {suggestions.length > 0 && (
              <section className="mt-14">
                <h2 className="heading-md mb-6 text-xl">Add to your order</h2>
                <ProductRail products={suggestions} />
              </section>
            )}
          </div>

          {/* ---------------- summary ---------------- */}
          <aside className="lg:sticky lg:top-32 lg:self-start">
            <div className="rounded-3xl border border-ink-200/80 bg-ink-50 p-6 sm:p-7">
              <h2 className="heading-md mb-5 text-xl">Summary</h2>

              {/* promo */}
              {coupon?.valid ? (
                <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-bold text-emerald-900">
                      <Icon name="tag" size={15} />
                      {coupon.code}
                    </p>
                    <p className="truncate text-xs text-emerald-800/80">{coupon.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={clearCoupon}
                    className="shrink-0 text-emerald-800/60 transition-colors hover:text-emerald-900 focus-ring rounded"
                    aria-label="Remove promo code"
                  >
                    <Icon name="close" size={16} />
                  </button>
                </div>
              ) : (
                <form onSubmit={applyCode} className="mb-5">
                  <label htmlFor="promo" className="label">Promo code</label>
                  <div className="flex gap-2">
                    <input
                      id="promo"
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="FTX10"
                      className="field flex-1 uppercase"
                    />
                    <button type="submit" disabled={checking || !code.trim()} className="btn-dark shrink-0 px-5">
                      {checking ? '…' : 'Apply'}
                    </button>
                  </div>
                  <p className="mt-2 text-[11px] text-ink-600/80">
                    New customers: use <button
                      type="button"
                      onClick={() => setCode('FTX10')}
                      className="font-bold text-ink-950 underline underline-offset-2 focus-ring rounded"
                    >FTX10</button> for 10% off.
                  </p>
                </form>
              )}

              <dl className="space-y-3 border-t border-ink-200/80 pt-5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink-600">
                    Subtotal ({count} {count === 1 ? 'item' : 'items'})
                  </dt>
                  <dd className="font-semibold text-ink-950">{formatPrice(subtotal)}</dd>
                </div>

                {savings > 0 && (
                  <div className="flex justify-between text-pitch">
                    <dt>Product savings</dt>
                    <dd className="font-semibold">−{formatPrice(savings)}</dd>
                  </div>
                )}

                {discount > 0 && (
                  <div className="flex justify-between text-pitch">
                    <dt>Promo discount</dt>
                    <dd className="font-semibold">−{formatPrice(discount)}</dd>
                  </div>
                )}

                <div className="flex justify-between">
                  <dt className="text-ink-600">Estimated delivery</dt>
                  <dd className="font-semibold text-ink-950">
                    {estimatedFee === 0 ? 'Free' : formatPrice(estimatedFee)}
                  </dd>
                </div>
              </dl>

              <div className="mt-5 flex items-baseline justify-between border-t border-ink-200/80 pt-5">
                <span className="heading-md text-lg">Total</span>
                <span className="font-display text-3xl font-extrabold text-ink-950">
                  {formatPrice(estimatedTotal)}
                </span>
              </div>

              <Link to="/checkout" className="btn-primary mt-6 w-full text-[15px]">
                Proceed to checkout
                <Icon name="arrowRight" size={18} />
              </Link>

              <button
                type="button"
                onClick={orderOnWhatsApp}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border-2 border-ink-200 py-3 text-sm font-semibold text-ink-900 transition-colors hover:border-ink-950 focus-ring"
              >
                <Icon name="whatsapp" size={17} className="text-pitch" />
                Order on WhatsApp instead
              </button>

              <ul className="mt-6 space-y-2.5 border-t border-ink-200/80 pt-5">
                {PROMISED.map(([icon, text]) => (
                  <li key={text} className="flex items-center gap-2.5 text-xs text-ink-700">
                    <Icon name={icon} size={15} className="text-lime-dark" />
                    {text}
                  </li>
                ))}
              </ul>
            </div>

            <p className="mt-4 text-center text-xs leading-relaxed text-ink-600/80">
              Delivery charges are confirmed at checkout based on your district.
            </p>
          </aside>
        </div>
      </div>
    </>
  )
}
