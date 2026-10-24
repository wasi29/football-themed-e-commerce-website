import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import { EmptyState, ErrorState, LoadingState, PageHeader, Stat } from './components/Page'
import { adminDashboard } from '../lib/adminApi'
import { formatDateTime, formatPrice } from '../lib/format'

const STATUS_TONE = {
  pending: 'adm-badge-warn',
  confirmed: 'adm-badge-info',
  processing: 'adm-badge-info',
  shipped: 'adm-badge-info',
  delivered: 'adm-badge-ok',
  cancelled: 'adm-badge-danger',
}

const STATUS_LABEL = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

/**
 * A dependency-free line chart for the sales overview.
 *
 * It draws straight from the 30 daily buckets the dashboard query returns, so
 * there is a point for every day even when the value is zero — a gap would
 * read as missing data rather than as no sales.
 */
function SalesChart({ points }) {
  if (!points?.length) return null

  const width = 720
  const height = 200
  const pad = { top: 16, right: 8, bottom: 26, left: 8 }
  const max = Math.max(1, ...points.map((p) => p.total))
  const innerW = width - pad.left - pad.right
  const innerH = height - pad.top - pad.bottom

  const coords = points.map((p, i) => ({
    x: pad.left + (i / Math.max(1, points.length - 1)) * innerW,
    y: pad.top + innerH - (p.total / max) * innerH,
    ...p,
  }))

  const line = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ')
  const area = `${line} L${coords[coords.length - 1].x.toFixed(1)},${(pad.top + innerH).toFixed(1)} L${coords[0].x.toFixed(1)},${(pad.top + innerH).toFixed(1)} Z`
  const peak = points.reduce((best, p) => (p.total > best.total ? p : best), points[0])

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-48 w-full sm:h-56"
        role="img"
        aria-label={`Sales over the last 30 days, peak ${formatPrice(peak.total)} on ${peak.date}`}
      >
        <defs>
          <linearGradient id="admSalesFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.28" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <line
            key={t}
            x1={pad.left}
            x2={width - pad.right}
            y1={pad.top + innerH * t}
            y2={pad.top + innerH * t}
            stroke="currentColor"
            strokeOpacity="0.1"
            strokeDasharray={t === 1 ? '' : '3 5'}
            className="text-ink-300 dark:text-ink-700"
          />
        ))}

        <path d={area} fill="url(#admSalesFill)" className="text-lime-accent" />
        <path d={line} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" className="text-lime-accent" />

        <circle cx={coords[coords.length - 1].x} cy={coords[coords.length - 1].y} r="4" className="fill-lime-accent" />
      </svg>

      <div className="mt-2 flex items-center justify-between text-[11px] text-ink-500 dark:text-ink-400">
        <span>{points[0].date.slice(5)}</span>
        <span className="font-semibold">
          Peak {formatPrice(peak.total)} · {peak.date.slice(5)}
        </span>
        <span>{points[points.length - 1].date.slice(5)}</span>
      </div>
    </div>
  )
}

/** Horizontal bars for the order-status split. */
function StatusBreakdown({ rows, total }) {
  const palette = {
    pending: 'bg-amber-400',
    confirmed: 'bg-sky-400',
    processing: 'bg-sky-500',
    shipped: 'bg-indigo-400',
    delivered: 'bg-emerald-400',
    cancelled: 'bg-rose-400',
  }

  if (!rows.length) {
    return <p className="py-6 text-sm text-ink-500 dark:text-ink-400">No orders yet.</p>
  }

  return (
    <ul className="space-y-3.5">
      {rows.map((row) => {
        const share = total ? (row.count / total) * 100 : 0
        return (
          <li key={row.status}>
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-semibold text-ink-800 dark:text-ink-200">
                {STATUS_LABEL[row.status] ?? row.status}
              </span>
              <span className="tabular-nums text-ink-600 dark:text-ink-400">
                {row.count} <span className="text-ink-500">· {share.toFixed(0)}%</span>
              </span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
              <div
                className={`h-full rounded-full ${palette[row.status] ?? 'bg-ink-400'}`}
                style={{ width: `${Math.max(share, 2)}%` }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const result = await adminDashboard.stats()
    if (result.error) setError(result.error)
    else setStats(result.data)
    setLoading(false)
  }, [])

  useEffect(() => {
    document.title = 'Dashboard — FootballTrix Admin'
    load()
  }, [load])

  if (loading) return <LoadingState label="Loading dashboard…" />
  if (error) return <ErrorState error={error} onRetry={load} />
  if (!stats) return null

  const cards = [
    { label: 'Total sales', value: formatPrice(stats.totalSales), hint: 'Cancelled orders excluded', icon: 'chart' },
    { label: 'Total orders', value: stats.orderCount, icon: 'cart' },
    { label: 'Pending orders', value: stats.pendingCount, tone: stats.pendingCount ? 'warn' : 'default', icon: 'clock' },
    { label: 'Completed orders', value: stats.completedCount, tone: 'ok', hint: 'Delivered', icon: 'check' },
    { label: 'Total customers', value: stats.customerCount, icon: 'users' },
    { label: 'Total products', value: stats.productCount, icon: 'package' },
    {
      label: 'Low stock',
      value: stats.lowStockCount,
      tone: stats.lowStockCount ? 'warn' : 'default',
      hint: 'At or below its threshold',
      icon: 'alert',
    },
    {
      label: 'Out of stock',
      value: stats.outOfStockCount,
      tone: stats.outOfStockCount ? 'danger' : 'default',
      icon: 'box',
    },
  ]

  return (
    <>
      <PageHeader
        title="Dashboard"
        lede="Store performance and anything that needs a decision today."
        actions={
          <>
            <Link to="/admin/orders" className="adm-btn-outline">
              <Icon name="cart" size={16} />
              View orders
            </Link>
            <Link to="/admin/products/new" className="adm-btn-dark">
              <Icon name="plus" size={16} />
              New product
            </Link>
          </>
        }
      />

      {/* ------------------------------------------------------ stat cards */}
      <div className="grid grid-cols-2 gap-3.5 sm:gap-4 lg:grid-cols-4">
        {cards.map((card) => (
          <Stat key={card.label} label={card.label} value={card.value} hint={card.hint} tone={card.tone} />
        ))}
      </div>

      {/* ----------------------------------------------------------- charts */}
      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <section className="adm-card adm-card-pad lg:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="adm-card-title">Sales overview</h2>
              <p className="mt-1 text-sm text-ink-600 dark:text-ink-400">
                Last 30 days, paid orders only
              </p>
            </div>
            <Icon name="chart" size={18} className="text-ink-500" />
          </div>
          <SalesChart points={stats.salesSeries} />
        </section>

        <section className="adm-card adm-card-pad">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="adm-card-title">Orders overview</h2>
            <Icon name="list" size={18} className="text-ink-500" />
          </div>
          <StatusBreakdown rows={stats.statusBreakdown} total={stats.orderCount} />
        </section>
      </div>

      {/* --------------------------------------------------------- two lists */}
      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <section className="adm-card adm-card-pad lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="adm-card-title">Recent orders</h2>
            <Link to="/admin/orders" className="text-xs font-semibold text-ink-950 underline-offset-4 hover:underline dark:text-lime-accent">
              All orders
            </Link>
          </div>

          {stats.recentOrders.length === 0 ? (
            <EmptyState
              icon="cart"
              title="No orders yet"
              hint="New orders appear here the moment a customer checks out."
            />
          ) : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th className="adm-th">Order</th>
                    <th className="adm-th">Customer</th>
                    <th className="adm-th">Status</th>
                    <th className="adm-th text-right">Total</th>
                    <th className="adm-th">Placed</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.map((order) => (
                    <tr key={order.id} className="adm-tr-hover">
                      <td className="adm-td">
                        <Link
                          to={`/admin/orders/${order.id}`}
                          className="font-semibold text-ink-950 underline-offset-4 hover:underline dark:text-white"
                        >
                          {order.order_number}
                        </Link>
                      </td>
                      <td className="adm-td">{order.customer_name}</td>
                      <td className="adm-td">
                        <span className={`adm-badge ${STATUS_TONE[order.status] ?? 'adm-badge-neutral'}`}>
                          {STATUS_LABEL[order.status] ?? order.status}
                        </span>
                      </td>
                      <td className="adm-td text-right font-semibold tabular-nums">
                        {formatPrice(order.total)}
                      </td>
                      <td className="adm-td whitespace-nowrap text-ink-600 dark:text-ink-400">
                        {formatDateTime(order.placed_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="adm-card adm-card-pad">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="adm-card-title">Top selling products</h2>
            <Icon name="trophy" size={17} className="text-ink-500" />
          </div>

          {stats.topProducts.length === 0 ? (
            <p className="py-6 text-sm text-ink-500 dark:text-ink-400">Nothing has sold yet.</p>
          ) : (
            <ol className="space-y-1">
              {stats.topProducts.map((product, index) => (
                <li key={product.id}>
                  <Link
                    to={`/admin/products/${product.id}/edit`}
                    className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-ink-50 dark:hover:bg-ink-800/60"
                  >
                    <span className="w-5 text-center font-display text-lg font-extrabold text-ink-400">
                      {index + 1}
                    </span>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-ink-100 dark:bg-ink-800">
                      {product.thumbnail_url
                        ? <img src={product.thumbnail_url} alt="" className="h-full w-full object-cover" />
                        : <Icon name="jersey" size={17} className="text-ink-500" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink-900 dark:text-white">
                        {product.name}
                      </span>
                      <span className="block text-xs text-ink-600 dark:text-ink-400">
                        {product.categories?.name ?? 'Uncategorised'}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-sm font-bold tabular-nums text-ink-950 dark:text-white">
                        {formatPrice(product.sale_price ?? product.base_price)}
                      </span>
                      <span className="block text-[11px] text-ink-500">
                        {product.sold_count ?? 0} sold
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      {/* ------------------------------------------- stock + new customers */}
      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <section className="adm-card adm-card-pad lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="adm-card-title">Stock needing attention</h2>
            <Link to="/admin/inventory" className="text-xs font-semibold text-ink-950 underline-offset-4 hover:underline dark:text-lime-accent">
              Open inventory
            </Link>
          </div>

          {stats.lowStock.length === 0 && stats.outOfStock.length === 0 ? (
            <EmptyState icon="box" title="Every variant is comfortably stocked" />
          ) : (
            <ul className="space-y-2">
              {[...stats.outOfStock.map((v) => ({ ...v, empty: true })), ...stats.lowStock.map((v) => ({ ...v, empty: false }))]
                .slice(0, 10)
                .map(({ variant, product, empty }) => (
                  <li
                    key={variant.id}
                    className="flex items-center gap-3 rounded-xl border border-ink-100 px-3 py-2.5 dark:border-ink-800"
                  >
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                      empty
                        ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300'
                        : 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300'
                    }`}>
                      <Icon name={empty ? 'alert' : 'box'} size={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink-900 dark:text-white">
                        {product?.name ?? 'Product'}
                      </span>
                      <span className="block text-xs text-ink-600 dark:text-ink-400">
                        {variant.size} / {variant.color_name}
                      </span>
                    </span>
                    <span className={`adm-badge shrink-0 ${empty ? 'adm-badge-danger' : 'adm-badge-warn'}`}>
                      {empty ? 'Out of stock' : `${variant.stock} left`}
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </section>

        <section className="adm-card adm-card-pad">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="adm-card-title">Newest customers</h2>
            <Link to="/admin/customers" className="text-xs font-semibold text-ink-950 underline-offset-4 hover:underline dark:text-lime-accent">
              All
            </Link>
          </div>

          {stats.recentCustomers.length === 0 ? (
            <p className="py-6 text-sm text-ink-500 dark:text-ink-400">
              No accounts have been created yet.
            </p>
          ) : (
            <ul className="space-y-1">
              {stats.recentCustomers.map((person) => (
                <li key={person.id}>
                  <Link
                    to={`/admin/customers/${person.id}`}
                    className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-ink-50 dark:hover:bg-ink-800/60"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink-950 text-xs font-bold text-lime-accent dark:bg-lime-accent dark:text-ink-950">
                      {(person.full_name || person.email || '?').slice(0, 2).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink-900 dark:text-white">
                        {person.full_name || 'Unnamed'}
                      </span>
                      <span className="block truncate text-xs text-ink-600 dark:text-ink-400">
                        {person.email}
                      </span>
                    </span>
                    <span className="shrink-0 text-[11px] text-ink-500">
                      {formatDateTime(person.created_at)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  )
}
