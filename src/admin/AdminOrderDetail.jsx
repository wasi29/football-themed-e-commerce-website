import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import { ErrorState, LoadingState, PageHeader, Toast } from './components/Page'
import { adminOrders } from '../lib/adminApi'
import { formatDateTime, formatPrice } from '../lib/format'
import { ORDER_STATUSES, StatusBadge } from './AdminOrders'

const PAYMENT_STATUSES = ['due_on_delivery', 'paid', 'refunded', 'failed']

/** Readable label for snake_case enum values. */
function humanise(value) {
  return String(value ?? '').replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase())
}

/**
 * Single order.
 *
 * Every control here writes straight to the `orders` row through `adminApi`,
 * which also handles the two side effects the database cannot infer: stamping
 * the matching timestamp and returning reserved stock when an order is
 * cancelled.
 */
export default function AdminOrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState(null)

  const [courier, setCourier] = useState({ courierName: '', trackingNumber: '' })
  const [note, setNote] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const result = await adminOrders.byId(id)
    if (result.error) setError(result.error)
    else if (!result.data) setError({ message: 'That order does not exist — it may have been deleted.' })
    else {
      setOrder(result.data)
      setCourier({
        courierName: result.data.courier_name ?? '',
        trackingNumber: result.data.tracking_number ?? '',
      })
      setNote(result.data.admin_note ?? '')
    }
    setLoading(false)
  }, [id])

  useEffect(() => {
    document.title = `Order — FootballTrix Admin`
    load()
  }, [load])

  async function changeStatus(next) {
    if (next === order.status) return
    setBusy(true)
    const result = await adminOrders.setStatus(order.id, next)
    setBusy(false)
    if (result.error) setToast({ tone: 'error', text: result.error.message })
    else {
      setToast({
        tone: 'ok',
        text: next === 'cancelled'
          ? 'Order cancelled and the reserved stock put back on the shelf.'
          : `Order marked ${humanise(next).toLowerCase()}.`,
      })
      load()
    }
  }

  async function changePayment(next) {
    setBusy(true)
    const result = await adminOrders.setPaymentStatus(order.id, next)
    setBusy(false)
    if (result.error) setToast({ tone: 'error', text: result.error.message })
    else {
      setToast({ tone: 'ok', text: `Payment marked ${humanise(next).toLowerCase()}.` })
      load()
    }
  }

  async function saveCourier(event) {
    event.preventDefault()
    setBusy(true)
    const result = await adminOrders.setCourier(order.id, courier)
    setBusy(false)
    if (result.error) setToast({ tone: 'error', text: result.error.message })
    else setToast({ tone: 'ok', text: 'Courier details saved.' })
  }

  async function saveNote() {
    setBusy(true)
    const result = await adminOrders.setStatus(order.id, order.status, { note })
    setBusy(false)
    if (result.error) setToast({ tone: 'error', text: result.error.message })
    else setToast({ tone: 'ok', text: 'Note saved.' })
  }

  if (loading) return <LoadingState label="Loading order…" />
  if (error) return <ErrorState error={error} onRetry={load} />
  if (!order) return null

  const address = [
    order.address_line1,
    order.address_line2,
    order.area,
    order.city,
    order.district,
    order.postal_code,
  ].filter(Boolean)

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => navigate(-1)} className="adm-btn-outline">
          <Icon name="arrowLeft" size={16} />
          Back
        </button>
        <button type="button" onClick={() => window.print()} className="adm-btn-outline">
          <Icon name="printer" size={16} />
          Print
        </button>
      </div>

      <Toast tone={toast?.tone} onDismiss={() => setToast(null)}>{toast?.text}</Toast>

      <PageHeader
        title={order.order_number}
        lede={`Placed ${formatDateTime(order.placed_at)}`}
        actions={<StatusBadge status={order.status} />}
      />

      <div className="grid gap-5 lg:grid-cols-3">
        {/* ------------------------------------------------------ line items */}
        <section className="adm-card adm-card-pad lg:col-span-2">
          <h2 className="adm-card-title">Items</h2>

          <div className="adm-table-wrap mt-3">
            <table className="adm-table">
              <thead>
                <tr>
                  <th className="adm-th">Product</th>
                  <th className="adm-th">Variant</th>
                  <th className="adm-th text-right">Unit</th>
                  <th className="adm-th text-right">Qty</th>
                  <th className="adm-th text-right">Line total</th>
                </tr>
              </thead>
              <tbody>
                {(order.order_items ?? []).map((item) => (
                  <tr key={item.id} className="adm-tr-hover">
                    <td className="adm-td">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-ink-100 dark:bg-ink-800">
                          {item.image_url
                            ? <img src={item.image_url} alt="" className="h-full w-full object-cover" />
                            : <Icon name="jersey" size={16} className="text-ink-500" />}
                        </span>
                        <span className="min-w-0">
                          {item.product_slug ? (
                            <Link
                              to={`/admin/products/${item.product_id}/edit`}
                              className="block max-w-[15rem] truncate font-semibold text-ink-950 underline-offset-4 hover:underline dark:text-white"
                            >
                              {item.product_name}
                            </Link>
                          ) : (
                            <span className="block font-semibold text-ink-950 dark:text-white">
                              {item.product_name}
                            </span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="adm-td text-ink-600 dark:text-ink-400">
                      {item.variant_label ?? '—'}
                    </td>
                    <td className="adm-td text-right tabular-nums">{formatPrice(item.unit_price)}</td>
                    <td className="adm-td text-right tabular-nums">{item.quantity}</td>
                    <td className="adm-td text-right font-semibold tabular-nums">
                      {formatPrice(item.line_total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <dl className="mt-5 ml-auto w-full max-w-xs space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-600 dark:text-ink-400">Subtotal</dt>
              <dd className="font-semibold tabular-nums">{formatPrice(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-600 dark:text-ink-400">Delivery fee</dt>
              <dd className="font-semibold tabular-nums">{formatPrice(order.delivery_fee)}</dd>
            </div>
            {Number(order.discount) > 0 && (
              <div className="flex justify-between">
                <dt className="text-ink-600 dark:text-ink-400">
                  Discount {order.coupon_code && <span className="font-mono text-xs">({order.coupon_code})</span>}
                </dt>
                <dd className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                  −{formatPrice(order.discount)}
                </dd>
              </div>
            )}
            <div className="flex justify-between border-t border-ink-200 pt-2.5 dark:border-ink-800">
              <dt className="font-bold text-ink-950 dark:text-white">Total</dt>
              <dd className="font-display text-xl font-extrabold tabular-nums text-ink-950 dark:text-white">
                {formatPrice(order.total)}
              </dd>
            </div>
          </dl>
        </section>

        {/* -------------------------------------------------------- controls */}
        <div className="space-y-5">
          <section className="adm-card adm-card-pad">
            <h2 className="adm-card-title">Fulfilment</h2>

            <div className="mt-3">
              <label className="adm-label" htmlFor="order-status">Order status</label>
              <select
                id="order-status"
                className="adm-select"
                value={order.status}
                disabled={busy}
                onChange={(e) => changeStatus(e.target.value)}
              >
                {ORDER_STATUSES.filter((s) => s.value !== 'all').map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className="mt-4">
              <label className="adm-label" htmlFor="order-payment">Payment status</label>
              <select
                id="order-payment"
                className="adm-select"
                value={order.payment_status}
                disabled={busy}
                onChange={(e) => changePayment(e.target.value)}
              >
                {PAYMENT_STATUSES.map((value) => (
                  <option key={value} value={value}>{humanise(value)}</option>
                ))}
              </select>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-ink-500 dark:text-ink-400">
              Paid via <strong>{humanise(order.payment_method)}</strong>. Cancelling returns the
              reserved stock to inventory.
            </p>
          </section>

          <section className="adm-card adm-card-pad">
            <h2 className="adm-card-title">Courier</h2>
            <form onSubmit={saveCourier} className="mt-3 space-y-3">
              <div>
                <label className="adm-label" htmlFor="courier-name">Courier</label>
                <input
                  id="courier-name"
                  className="adm-input"
                  value={courier.courierName}
                  onChange={(e) => setCourier((c) => ({ ...c, courierName: e.target.value }))}
                  placeholder="Steadfast / RedX / Pathao"
                />
              </div>
              <div>
                <label className="adm-label" htmlFor="courier-tracking">Tracking number</label>
                <input
                  id="courier-tracking"
                  className="adm-input font-mono"
                  value={courier.trackingNumber}
                  onChange={(e) => setCourier((c) => ({ ...c, trackingNumber: e.target.value }))}
                  placeholder="Optional"
                />
              </div>
              <button type="submit" disabled={busy} className="adm-btn-outline w-full">
                Save courier details
              </button>
            </form>
          </section>

          <section className="adm-card adm-card-pad">
            <h2 className="adm-card-title">Internal note</h2>
            <textarea
              className="adm-textarea mt-3"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Visible to admins only — never shown to the customer."
            />
            <button type="button" onClick={saveNote} disabled={busy} className="adm-btn-outline mt-3 w-full">
              Save note
            </button>
          </section>
        </div>
      </div>

      {/* -------------------------------------------------------- customer */}
      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <section className="adm-card adm-card-pad">
          <h2 className="adm-card-title">Customer</h2>
          <div className="mt-3 space-y-2 text-sm">
            <p className="font-bold text-ink-950 dark:text-white">{order.customer_name}</p>
            <p className="flex items-center gap-2 text-ink-700 dark:text-ink-300">
              <Icon name="phone" size={15} className="text-ink-500" />
              <a href={`tel:${order.customer_phone}`} className="hover:underline">{order.customer_phone}</a>
            </p>
            {order.customer_email && (
              <p className="flex items-center gap-2 text-ink-700 dark:text-ink-300">
                <Icon name="mail" size={15} className="text-ink-500" />
                <a href={`mailto:${order.customer_email}`} className="hover:underline">{order.customer_email}</a>
              </p>
            )}
            {order.user_id && (
              <Link
                to={`/admin/customers/${order.user_id}`}
                className="inline-flex items-center gap-1.5 pt-1 text-xs font-semibold text-ink-950 underline-offset-4 hover:underline dark:text-lime-accent"
              >
                View customer record
                <Icon name="chevronRight" size={13} />
              </Link>
            )}
          </div>
        </section>

        <section className="adm-card adm-card-pad lg:col-span-2">
          <h2 className="adm-card-title">Delivery address</h2>
          <address className="mt-3 space-y-1 text-sm not-italic leading-relaxed text-ink-700 dark:text-ink-300">
            {address.map((line) => <p key={line}>{line}</p>)}
          </address>
          {order.delivery_note && (
            <p className="mt-3 rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm leading-relaxed text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
              <strong className="font-bold">Delivery note:</strong> {order.delivery_note}
            </p>
          )}
        </section>
      </div>
    </>
  )
}
