import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import { EmptyState, ErrorState, LoadingState, PageHeader } from './components/Page'
import { adminOrders } from '../lib/adminApi'
import { formatDateTime, formatPrice } from '../lib/format'

const PAGE_SIZE = 20

export const ORDER_STATUSES = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

export const STATUS_TONE = {
  pending: 'adm-badge-warn',
  confirmed: 'adm-badge-info',
  processing: 'adm-badge-info',
  shipped: 'adm-badge-info',
  delivered: 'adm-badge-ok',
  cancelled: 'adm-badge-danger',
}

export function StatusBadge({ status }) {
  const label = ORDER_STATUSES.find((s) => s.value === status)?.label ?? status
  return <span className={`adm-badge ${STATUS_TONE[status] ?? 'adm-badge-neutral'}`}>{label}</span>
}

/**
 * Order inbox.
 *
 * The status filter and page live in the URL so an admin can send a colleague
 * a link straight to "page 3 of shipped orders" and it opens exactly there.
 */
export default function AdminOrders() {
  const [searchParams, setSearchParams] = useSearchParams()
  const status = searchParams.get('status') ?? 'all'
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const urlSearch = searchParams.get('q') ?? ''

  const [term, setTerm] = useState(urlSearch)
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const result = await adminOrders.list({ status, search: urlSearch, page, limit: PAGE_SIZE })
    if (result.error) setError(result.error)
    else {
      setRows(result.data)
      setTotal(result.total ?? 0)
    }
    setLoading(false)
  }, [status, urlSearch, page])

  useEffect(() => {
    document.title = 'Orders — FootballTrix Admin'
    load()
  }, [load])

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        if (term.trim()) next.set('q', term.trim())
        else next.delete('q')
        next.delete('page')
        return next
      })
    }, 350)
    return () => clearTimeout(timer)
    // Only re-run when the box changes, not when the URL does.
  }, [term]) // eslint-disable-line react-hooks/exhaustive-deps

  function setParam(key, value) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value && value !== 'all') next.set(key, value)
      else next.delete(key)
      if (key !== 'page') next.delete('page')
      return next
    })
  }

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <>
      <PageHeader
        title="Orders"
        lede={`${total} order${total === 1 ? '' : 's'} recorded. Open one to change its status, payment or courier details.`}
      />

      <div className="adm-card mb-5 p-3 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Icon name="search" size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
            <input
              type="search"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Order number, customer name or phone…"
              aria-label="Search orders"
              className="adm-input pl-9"
            />
          </div>

          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 lg:pb-0">
            {ORDER_STATUSES.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setParam('status', option.value)}
                className={`shrink-0 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
                  status === option.value
                    ? 'bg-ink-950 text-white dark:bg-lime-accent dark:text-ink-950'
                    : 'text-ink-600 hover:bg-ink-100 dark:text-ink-400 dark:hover:bg-ink-800'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingState label="Loading orders…" />
      ) : error ? (
        <ErrorState error={error} onRetry={load} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon="cart"
          title={urlSearch ? `No orders match “${urlSearch}”` : status !== 'all' ? `No ${status} orders` : 'No orders yet'}
          hint="Orders appear here the moment a customer completes checkout."
        />
      ) : (
        <div className="adm-card overflow-hidden">
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th className="adm-th">Order</th>
                  <th className="adm-th">Customer</th>
                  <th className="adm-th">Items</th>
                  <th className="adm-th">Payment</th>
                  <th className="adm-th">Status</th>
                  <th className="adm-th text-right">Total</th>
                  <th className="adm-th">Placed</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((order) => {
                  const itemCount = (order.order_items ?? []).reduce((sum, item) => sum + Number(item.quantity ?? 0), 0)
                  return (
                    <tr key={order.id} className="adm-tr-hover">
                      <td className="adm-td">
                        <Link
                          to={`/admin/orders/${order.id}`}
                          className="font-semibold text-ink-950 underline-offset-4 hover:underline dark:text-white"
                        >
                          {order.order_number}
                        </Link>
                      </td>
                      <td className="adm-td">
                        <span className="block font-medium">{order.customer_name}</span>
                        <span className="block text-xs text-ink-500">{order.customer_phone}</span>
                      </td>
                      <td className="adm-td tabular-nums">
                        {itemCount} item{itemCount === 1 ? '' : 's'}
                      </td>
                      <td className="adm-td">
                        <span className={`adm-badge ${order.payment_status === 'paid' ? 'adm-badge-ok' : 'adm-badge-neutral'}`}>
                          {order.payment_status ?? 'unpaid'}
                        </span>
                      </td>
                      <td className="adm-td"><StatusBadge status={order.status} /></td>
                      <td className="adm-td text-right font-semibold tabular-nums">
                        {formatPrice(order.total)}
                      </td>
                      <td className="adm-td whitespace-nowrap text-ink-600 dark:text-ink-400">
                        {formatDateTime(order.placed_at)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {pageCount > 1 && (
            <div className="flex items-center justify-between gap-3 border-t border-ink-200 px-4 py-3 dark:border-ink-800">
              <button
                type="button"
                onClick={() => setParam('page', String(page - 1))}
                disabled={page <= 1}
                className="adm-btn-outline disabled:pointer-events-none disabled:opacity-40"
              >
                <Icon name="chevronLeft" size={15} />
                Previous
              </button>
              <span className="text-xs font-semibold text-ink-600 dark:text-ink-400">
                Page {page} of {pageCount}
              </span>
              <button
                type="button"
                onClick={() => setParam('page', String(page + 1))}
                disabled={page >= pageCount}
                className="adm-btn-outline disabled:pointer-events-none disabled:opacity-40"
              >
                Next
                <Icon name="chevronRight" size={15} />
              </button>
            </div>
          )}
        </div>
      )}
    </>
  )
}
