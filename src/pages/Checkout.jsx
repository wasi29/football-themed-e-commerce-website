import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import JerseyGraphic from '../components/product/JerseyGraphic'
import { PageHeader } from '../components/ui/PageHeader'
import { EmptyState } from '../components/ui/Feedback'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { coupons as couponsApi, orders as ordersApi } from '../lib/api'
import { DISTRICTS, SITE } from '../lib/config'
import { formatPrice, whatsappLink } from '../lib/format'

/* Bangladeshi mobile numbers: 11 digits starting 013–019, or +88 prefixed. */
const PHONE_RE = /^(?:\+?88)?(01[3-9]\d{8})$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const EMPTY = {
  name: '', phone: '', email: '',
  address: '', area: '', city: '', district: '', postalCode: '', note: '',
}

export default function Checkout() {
  const { items, count, subtotal, coupon, applyCoupon, clearCoupon, clear } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [code, setCode] = useState('')
  const [checkingCode, setCheckingCode] = useState(false)
  const [placing, setPlacing] = useState(false)

  // Prefill from the signed-in profile.
  useEffect(() => {
    if (!user) return
    setForm((prev) => ({
      ...prev,
      name: prev.name || user.user_metadata?.full_name || '',
      email: prev.email || user.email || '',
      phone: prev.phone || user.user_metadata?.phone || '',
    }))
  }, [user])

  // Never leave the cart page with an empty cart after navigating back.
  useEffect(() => {
    if (items.length === 0 && !placing) {
      navigate('/cart', { replace: true })
    }
  }, [items.length, placing, navigate])

  const promoDiscount = coupon?.valid ? coupon.discount : 0

  const delivery = useMemo(() => {
    if (subtotal >= SITE.delivery.freeThreshold) return 0
    return form.district === 'Dhaka' ? SITE.delivery.insideDhaka : SITE.delivery.outsideDhaka
  }, [subtotal, form.district])

  const total = Math.max(0, subtotal + delivery - promoDiscount)

  const set = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const validate = () => {
    const next = {}

    if (form.name.trim().length < 2) next.name = 'Please enter your full name.'
    if (!PHONE_RE.test(form.phone.replace(/[\s-]/g, ''))) {
      next.phone = 'Enter a valid Bangladeshi mobile number, e.g. 01712345678.'
    }
    if (form.email && !EMAIL_RE.test(form.email)) next.email = 'That email address looks invalid.'
    if (form.address.trim().length < 6) next.address = 'Please enter your full street address.'
    if (!form.district) next.district = 'Please choose your district.'

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const applyCode = async (e) => {
    e.preventDefault()
    if (!code.trim()) return
    setCheckingCode(true)
    const result = await couponsApi.validate(code, subtotal)
    setCheckingCode(false)
    if (!result.valid) { toast.error(result.reason); return }
    applyCoupon(result)
    toast.success(`Code applied — you saved ${formatPrice(result.discount)}`)
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!validate()) {
      toast.error('Please fix the highlighted fields.')
      document.querySelector('[data-invalid="true"]')?.focus()
      return
    }

    setPlacing(true)
    const result = await ordersApi.place({
      items: items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        slug: i.slug,
        name: i.name,
        variantLabel: i.variantLabel,
        unitPrice: i.unitPrice,
        quantity: i.quantity,
        primaryColor: i.primary_color,
        secondaryColor: i.secondary_color,
      })),
      customer: { ...form, userId: user?.id ?? null },
      couponCode: coupon?.code,
    })

    if (!result.ok) {
      setPlacing(false)
      toast.error(result.error)
      return
    }

    // Keep a local copy so /order-success can render without a round trip.
    sessionStorage.setItem(
      'ftx.lastOrder',
      JSON.stringify({
        orderNumber: result.orderNumber,
        name: form.name,
        phone: form.phone,
        district: form.district,
        address: form.address,
        total,
        delivery,
        subtotal,
        discount: promoDiscount,
        count,
        items: items.map((i) => ({
          slug: i.slug, name: i.name, variantLabel: i.variantLabel,
          quantity: i.quantity, unitPrice: i.unitPrice,
          primary_color: i.primary_color, secondary_color: i.secondary_color,
        })),
      }),
    )

    clear()
    navigate('/order-success', { state: { orderNumber: result.orderNumber } })
  }

  if (items.length === 0) {
    return (
      <>
        <PageHeader title="Checkout" breadcrumbs={[{ label: 'Cart', to: '/cart' }, { label: 'Checkout' }]} />
        <EmptyState
          icon="cart"
          title="Nothing to check out"
          message="Your cart is empty, so there is nothing to pay for yet."
          action={<Link to="/shop" className="btn-primary">Browse jerseys</Link>}
        />
      </>
    )
  }

  return (
    <>
      <PageHeader
        eyebrow="Cash on delivery"
        title="Checkout"
        lede="Pay the courier when your kit arrives. No advance payment, no card details needed."
        breadcrumbs={[{ label: 'Cart', to: '/cart' }, { label: 'Checkout' }]}
      />

      <div className="container-x py-10 sm:py-14">
        <form
          onSubmit={submit}
          noValidate
          className="grid gap-10 lg:grid-cols-[1.35fr_0.85fr] lg:gap-12"
        >
          {/* ----------------- form ----------------- */}
          <div className="space-y-10">
            <FormSection step="1" title="Contact information" icon="user">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  id="name"
                  label="Full name"
                  value={form.name}
                  onChange={set('name')}
                  error={errors.name}
                  autoComplete="name"
                  placeholder="Rakib Hasan"
                  required
                />
                <Field
                  id="phone"
                  label="Mobile number"
                  value={form.phone}
                  onChange={set('phone')}
                  error={errors.phone}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="01712345678"
                  hint="The courier will call this number before delivery."
                  required
                />
                <div className="sm:col-span-2">
                  <Field
                    id="email"
                    label="Email address (optional)"
                    value={form.email}
                    onChange={set('email')}
                    error={errors.email}
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    hint="We only use this for your order confirmation and delivery updates."
                  />
                </div>
              </div>
            </FormSection>

            <FormSection step="2" title="Delivery address" icon="pin">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field
                    id="address"
                    label="House, road, block"
                    value={form.address}
                    onChange={set('address')}
                    error={errors.address}
                    autoComplete="address-line1"
                    placeholder="House 12, Road 5, Block C"
                    required
                  />
                </div>

                <Field
                  id="area"
                  label="Area / neighbourhood"
                  value={form.area}
                  onChange={set('area')}
                  autoComplete="address-level2"
                  placeholder="Dhanmondi"
                />
                <Field
                  id="city"
                  label="City"
                  value={form.city}
                  onChange={set('city')}
                  autoComplete="address-level1"
                  placeholder="Dhaka"
                />

                <div>
                  <label htmlFor="district" className="label">
                    District <span className="text-flame">*</span>
                  </label>
                  <select
                    id="district"
                    value={form.district}
                    onChange={set('district')}
                    autoComplete="address-level1"
                    className={`field ${errors.district ? 'field-error' : ''}`}
                    data-invalid={Boolean(errors.district)}
                    aria-invalid={Boolean(errors.district)}
                  >
                    <option value="">Select your district</option>
                    {DISTRICTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  {errors.district && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-flame">
                      <Icon name="alert" size={13} />
                      {errors.district}
                    </p>
                  )}
                </div>

                <Field
                  id="postalCode"
                  label="Postal code (optional)"
                  value={form.postalCode}
                  onChange={set('postalCode')}
                  inputMode="numeric"
                  autoComplete="postal-code"
                  placeholder="1209"
                />

                <div className="sm:col-span-2">
                  <Field
                    id="note"
                    label="Delivery notes (optional)"
                    value={form.note}
                    onChange={set('note')}
                    placeholder="Call before arriving. Near the mosque, second building on the left."
                    hint={
                      form.district
                        ? `Estimated delivery: ${form.district === 'Dhaka' ? SITE.delivery.etaDhaka : SITE.delivery.etaOutside}.`
                        : 'Choose a district to see your estimated delivery time.'
                    }
                  />
                </div>
              </div>
            </FormSection>

            <FormSection step="3" title="Payment" icon="shield2">
              <div className="rounded-2xl border-2 border-ink-950 bg-white p-5">
                <div className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-lime-accent text-ink-950">
                    <Icon name="truck" size={20} />
                  </span>
                  <div className="flex-1">
                    <p className="flex items-center justify-between gap-3 text-sm font-bold text-ink-950">
                      Cash on delivery
                      <span className="chip bg-ink-950 text-white">Only option</span>
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-600/90">
                      Hand the cash to the delivery agent when your parcel arrives. We never
                      ask for advance payment and we never ask for your card or PIN.
                    </p>
                  </div>
                </div>
              </div>
            </FormSection>
          </div>

          {/* ----------------- summary ----------------- */}
          <aside className="lg:sticky lg:top-32 lg:self-start">
            <div className="rounded-3xl border border-ink-200/80 bg-ink-50 p-6">
              <h2 className="heading-md mb-5 text-xl">
                Your order ({count} {count === 1 ? 'item' : 'items'})
              </h2>

              <ul className="max-h-72 space-y-3.5 overflow-y-auto pr-1">
                {items.map((item) => (
                  <li key={item.key} className="flex gap-3.5">
                    <span className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-white">
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
                      <span className="absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-bl-lg bg-ink-950 px-1 text-[10px] font-bold text-white">
                        {item.quantity}
                      </span>
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold text-ink-900">{item.name}</span>
                      <span className="block text-[11px] text-ink-600/80">{item.variantLabel}</span>
                    </span>

                    <span className="shrink-0 text-xs font-bold text-ink-950">
                      {formatPrice(item.unitPrice * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>

              {/* promo */}
              <div className="mt-5 border-t border-ink-200/80 pt-5">
                {coupon?.valid ? (
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3">
                    <p className="flex items-center gap-2 text-sm font-bold text-emerald-900">
                      <Icon name="tag" size={15} />
                      {coupon.code}
                      <span className="font-normal text-emerald-800/80">−{formatPrice(promoDiscount)}</span>
                    </p>
                    <button
                      type="button"
                      onClick={clearCoupon}
                      className="text-emerald-800/60 transition-colors hover:text-emerald-900 focus-ring rounded"
                      aria-label="Remove promo code"
                    >
                      <Icon name="close" size={16} />
                    </button>
                  </div>
                ) : (
                  // Not a <form>: this sits inside the checkout <form>, and
                  // nested forms are invalid HTML — the browser drops the inner
                  // one, so its submit handler would never run. Enter is handled
                  // on the input instead.
                  <div>
                    <label htmlFor="promo-checkout" className="label">Promo code</label>
                    <div className="flex gap-2">
                      <input
                        id="promo-checkout"
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            applyCode(e)
                          }
                        }}
                        placeholder="FTX10"
                        className="field flex-1 uppercase"
                      />
                      <button
                        type="button"
                        onClick={applyCode}
                        disabled={checkingCode || !code.trim()}
                        className="btn-dark shrink-0 px-5"
                      >
                        {checkingCode ? '…' : 'Apply'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* totals */}
              <dl className="mt-5 space-y-3 border-t border-ink-200/80 pt-5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink-600">Subtotal</dt>
                  <dd className="font-semibold text-ink-950">{formatPrice(subtotal)}</dd>
                </div>

                {promoDiscount > 0 && (
                  <div className="flex justify-between text-pitch">
                    <dt>Promo ({coupon.code})</dt>
                    <dd className="font-semibold">−{formatPrice(promoDiscount)}</dd>
                  </div>
                )}

                <div className="flex justify-between">
                  <dt className="text-ink-600">
                    Delivery
                    {form.district && (
                      <span className="ml-1 text-xs text-ink-600/60">({form.district})</span>
                    )}
                  </dt>
                  <dd className="font-semibold text-ink-950">
                    {delivery === 0 ? 'Free' : formatPrice(delivery)}
                  </dd>
                </div>
              </dl>

              <div className="mt-5 flex items-baseline justify-between border-t border-ink-200/80 pt-5">
                <span className="heading-md text-lg">Total to pay</span>
                <span className="font-display text-3xl font-extrabold text-ink-950">
                  {formatPrice(total)}
                </span>
              </div>

              <button
                type="submit"
                disabled={placing}
                className="btn-primary mt-6 w-full text-[15px]"
              >
                {placing ? 'Placing your order…' : 'Place order'}
                {!placing && <Icon name="check" size={18} strokeWidth={2.5} />}
              </button>

              <p className="mt-3.5 text-center text-[11px] leading-relaxed text-ink-600/80">
                By placing this order you agree to our{' '}
                <Link to="/faq" className="underline underline-offset-2 hover:text-ink-950">terms</Link>{' '}
                and{' '}
                <Link to="/faq" className="underline underline-offset-2 hover:text-ink-950">exchange policy</Link>.
              </p>

              <a
                href={whatsappLink(SITE.contact.whatsapp, 'Hi, I need help completing checkout.')}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold text-ink-700 transition-colors hover:text-pitch focus-ring rounded"
              >
                <Icon name="whatsapp" size={15} className="text-pitch" />
                Need help? Message us
              </a>
            </div>
          </aside>
        </form>
      </div>
    </>
  )
}

/* -------------------------------------------------------------------------- */

function FormSection({ step, title, icon, children }) {
  return (
    <section>
      <div className="mb-5 flex items-center gap-3.5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-950 text-lime-accent">
          <Icon name={icon} size={18} />
        </span>
        <h2 className="heading-md text-xl">
          <span className="mr-1.5 text-ink-600/50">{step}.</span>
          {title}
        </h2>
      </div>
      {children}
    </section>
  )
}

function Field({
  id, label, value, onChange, error, hint, required, ...rest
}) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label} {required && <span className="text-flame">*</span>}
      </label>
      <input
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        className={`field ${error ? 'field-error' : ''}`}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        data-invalid={Boolean(error)}
        required={required}
        {...rest}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-flame">
          <Icon name="alert" size={13} />
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-ink-600/80">{hint}</p>
      ) : null}
    </div>
  )
}
