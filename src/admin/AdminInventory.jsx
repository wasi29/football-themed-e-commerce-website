import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import { EmptyState, ErrorState, LoadingState, PageHeader, Toast } from './components/Page'
import { adminInventory } from '../lib/adminApi'
import { formatDateTime } from '../lib/format'

const FILTERS = [
  { value: 'all', label: 'All variants' },
  { value: 'low', label: 'Low stock' },
  { value: 'out', label: 'Out of stock' },
]

function stockState(variant) {
  const stock = Number(variant.stock ?? 0)
  if (stock === 0) return { tone: 'adm-badge-danger', label: 'Out of stock', className: 'text-rose-600 dark:text-rose-400' }
  if (stock <= Number(variant.product?.low_stock_threshold ?? 5)) {
    return { tone: 'adm-badge-warn', label: 'Low', className: 'text-amber-600 dark:text-amber-400' }
  }
  return { tone: 'adm-badge-ok', label: 'In stock', className: '' }
}

/**
 * Stock control.
 *
 * Stock is changed by writing an absolute level rather than a delta: two admins
 * adjusting from a stale number is how inventory drifts. Every write is
 * mirrored into `inventory_movements`, so the recent-activity list below is a
 * real audit trail and not a UI-only history.
 */
export default function AdminInventory() {
  const [filter, setFilter] = useState('all')
  const [term, setTerm] = useState('')
  const [rows, setRows] = useState([])
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [toast, setToast] = useState(null)
  const [drafts, setDrafts] = useState({})

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const [list, log] = await Promise.all([
      adminInventory.list({ search: term, filter }),
      adminInventory.movements({ limit: 30 }),
    ])
    if (list.error) setError(list.error)
    else {
      setRows(list.data)
      setMovements(log.data ?? [])
    }
    setLoading(false)
  }, [term, filter])

  useEffect(() => {
    document.title = 'Inventory — FootballTrix Admin'
    const timer = setTimeout(load, term ? 300 : 0)
    return () => clearTimeout(timer)
  }, [load, term])

  function draftFor(row) {
    return drafts[row.id] ?? String(row.stock ?? 0)
  }

  async function commit(row, value) {
    setBusyId(row.id)
    const result = await adminInventory.setStock(row.id, Number(value))
    setBusyId(null)
    if (result.error) {
      setToast({ tone: 'error', text: result.error.message })
      return
    }
    setToast({ tone: 'ok', text: `${row.product?.name ?? 'Variant'} — ${row.size} / ${row.color_name} set to ${Number(value)}.` })
    setDrafts((d) => {
      const next = { ...d }
      delete next[row.id]
      return next
    })
    load()
  }

  const outCount = rows.filter((r) => Number(r.stock) === 0).length

  return (
    <>
      <PageHeader
        title="Inventory"
        lede={`${rows.length} variant${rows.length === 1 ? '' : 's'} shown${outCount ? `, ${outCount} of them out of stock` : ''}.`}
        actions={
          <Link to="/admin/products" className="adm-btn-outline">
            <Icon name="package" size={16} />
            Manage products
          </Link>
        }
      />

      <Toast tone={toast?.tone} onDismiss={() => setToast(null)}>{toast?.text}</Toast>

      <div className="adm-card mb-5 p-3 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Icon name="search" size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
            <input
              type="search"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search product, size, colour or SKU…"
              aria-label="Search inventory"
              className="adm-input pl-9"
            />
          </div>
          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1">
            {FILTERS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFilter(option.value)}
                className={`shrink-0 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
                  filter === option.value
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

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {loading ? (
            <LoadingState label="Loading inventory…" />
          ) : error ? (
            <ErrorState error={error} onRetry={load} />
          ) : rows.length === 0 ? (
            <EmptyState
              icon="box"
              title={filter === 'all' ? 'No variants yet' : 'Nothing matches this filter'}
              hint={filter === 'all'
                ? 'Variants are created on the product editor — one per size and colour.'
                : 'Try another filter, or clear the search box.'}
            />
          ) : (
            <div className="adm-card overflow-hidden">
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th className="adm-th">Product</th>
                      <th className="adm-th">Variant</th>
                      <th className="adm-th">State</th>
                      <th className="adm-th">Threshold</th>
                      <th className="adm-th text-right">Set stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => {
                      const state = stockState(row)
                      const value = draftFor(row)
                      const changed = Number(value) !== Number(row.stock ?? 0)
                      return (
                        <tr key={row.id} className="adm-tr-hover">
                          <td className="adm-td">
                            <div className="flex items-center gap-3">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-ink-100 dark:bg-ink-800">
                                {row.product?.thumbnail_url
                                  ? <img src={row.product.thumbnail_url} alt="" className="h-full w-full object-cover" />
                                  : <Icon name="jersey" size={15} className="text-ink-500" />}
                              </span>
                              <Link
                                to={`/admin/products/${row.product_id}/edit`}
                                className="block max-w-[13rem] truncate font-semibold text-ink-950 underline-offset-4 hover:underline dark:text-white"
                              >
                                {row.product?.name ?? 'Product'}
                              </Link>
                            </div>
                          </td>
                          <td className="adm-td">
                            <span className="font-medium">{row.size}</span>
                            <span className="text-ink-500"> / {row.color_name}</span>
                            {row.sku && <span className="block font-mono text-[11px] text-ink-500">{row.sku}</span>}
                          </td>
                          <td className="adm-td">
                            <span className={`adm-badge ${state.tone}`}>{state.label}</span>
                          </td>
                          <td className="adm-td tabular-nums text-ink-600 dark:text-ink-400">
                            ≤ {row.product?.low_stock_threshold ?? 5}
                          </td>
                          <td className="adm-td">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                aria-label="Decrease"
                                disabled={busyId === row.id || Number(value) <= 0}
                                onClick={() => setDrafts((d) => ({ ...d, [row.id]: String(Math.max(0, Number(value) - 1)) }))}
                                className="adm-icon-btn !h-8 !w-8"
                              >
                                <Icon name="minus" size={14} />
                              </button>
                              <input
                                type="number"
                                min="0"
                                aria-label={`Stock for ${row.product?.name} ${row.size} ${row.color_name}`}
                                value={value}
                                disabled={busyId === row.id}
                                onChange={(e) => setDrafts((d) => ({ ...d, [row.id]: e.target.value }))}
                                onKeyDown={(e) => { if (e.key === 'Enter') commit(row, value) }}
                                className="adm-input w-20 text-center !py-1.5 tabular-nums"
                              />
                              <button
                                type="button"
                                aria-label="Increase"
                                disabled={busyId === row.id}
                                onClick={() => setDrafts((d) => ({ ...d, [row.id]: String(Number(value) + 1) }))}
                                className="adm-icon-btn !h-8 !w-8"
                              >
                                <Icon name="plus" size={14} />
                              </button>
                              <button
                                type="button"
                                disabled={busyId === row.id || !changed}
                                onClick={() => commit(row, value)}
                                className={`adm-btn !px-3 !py-1.5 !text-xs ${
                                  changed
                                    ? 'bg-ink-950 text-white hover:bg-ink-800 dark:bg-lime-accent dark:text-ink-950'
                                    : 'bg-ink-100 text-ink-400 dark:bg-ink-800'
                                }`}
                              >
                                {busyId === row.id ? 'Saving…' : 'Save'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* ------------------------------------------------------ audit log */}
        <section className="adm-card adm-card-pad self-start">
          <h2 className="adm-card-title">Recent stock movements</h2>

          {movements.length === 0 ? (
            <p className="mt-4 text-sm text-ink-500 dark:text-ink-400">
              No adjustments have been recorded yet.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {movements.map((row) => (
                <li key={row.id} className="flex items-start gap-3 border-b border-ink-100 pb-3 last:border-0 last:pb-0 dark:border-ink-800">
                  <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                    Number(row.quantity) >= 0
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300'
                      : 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300'
                  }`}>
                    <Icon name={Number(row.quantity) >= 0 ? 'plus' : 'minus'} size={13} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink-900 dark:text-white">
                      {row.product?.name ?? 'Product'}
                    </p>
                    <p className="text-xs text-ink-600 dark:text-ink-400">
                      {row.variant ? `${row.variant.size} / ${row.variant.color_name} · ` : ''}
                      <span className="font-semibold tabular-nums">
                        {Number(row.quantity) >= 0 ? '+' : ''}{row.quantity}
                      </span>
                      {' → balance '}
                      <span className="font-semibold tabular-nums">{row.balance_after}</span>
                    </p>
                    <p className="mt-0.5 text-[11px] text-ink-500">{formatDateTime(row.created_at)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  )
}
