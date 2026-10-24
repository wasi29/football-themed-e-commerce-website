import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import { EmptyState, ErrorState, LoadingState, PageHeader } from './components/Page'
import { adminCustomers } from '../lib/adminApi'
import { formatDateTime, formatPrice } from '../lib/format'

/**
 * Customer directory.
 *
 * Order counts and lifetime spend are summed from `orders` in the browser —
 * PostgREST cannot aggregate across a relation without a dedicated RPC, and
 * reading the two columns it needs keeps this on the same grants the rest of
 * the app uses.
 */
export default function AdminCustomers() {
  const [searchParams, setSearchParams] = useSearchParams()
  const urlSearch = searchParams.get('q') ?? ''

  const [term, setTerm] = useState(urlSearch)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const result = await adminCustomers.list({ search: urlSearch })
    if (result.error) setError(result.error)
    else setRows(result.data)
    setLoading(false)
  }, [urlSearch])

  useEffect(() => {
    document.title = 'Customers — FootballTrix Admin'
    load()
  }, [load])

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        if (term.trim()) next.set('q', term.trim())
        else next.delete('q')
        return next
      })
    }, 350)
    return () => clearTimeout(timer)
  }, [term]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <PageHeader
        title="Customers"
        lede={`${rows.length} account${rows.length === 1 ? '' : 's'} registered on the storefront.`}
      />

      <div className="adm-card mb-5 adm-card-pad">
        <div className="relative">
          <Icon name="search" size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
          <input
            type="search"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search by name, email or phone…"
            aria-label="Search customers"
            className="adm-input pl-9"
          />
        </div>
      </div>

      {loading ? (
        <LoadingState label="Loading customers…" />
      ) : error ? (
        <ErrorState error={error} onRetry={load} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon="users"
          title={urlSearch ? `No customers match “${urlSearch}”` : 'No accounts yet'}
          hint="Anyone who registers on the storefront appears here with their order history."
        />
      ) : (
        <div className="adm-card overflow-hidden">
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th className="adm-th">Customer</th>
                  <th className="adm-th">Phone</th>
                  <th className="adm-th">Role</th>
                  <th className="adm-th text-right">Orders</th>
                  <th className="adm-th text-right">Total spent</th>
                  <th className="adm-th">Joined</th>
                  <th className="adm-th text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="adm-tr-hover">
                    <td className="adm-td">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ink-950 text-xs font-bold text-lime-accent dark:bg-lime-accent dark:text-ink-950">
                          {(row.full_name || row.email || '?').slice(0, 2).toUpperCase()}
                        </span>
                        <span className="min-w-0">
                          <Link
                            to={`/admin/customers/${row.id}`}
                            className="block max-w-[14rem] truncate font-semibold text-ink-950 underline-offset-4 hover:underline dark:text-white"
                          >
                            {row.full_name || 'Unnamed'}
                          </Link>
                          <span className="block max-w-[14rem] truncate text-xs text-ink-500">
                            {row.email}
                          </span>
                        </span>
                      </div>
                    </td>
                    <td className="adm-td tabular-nums text-ink-600 dark:text-ink-400">
                      {row.phone ?? '—'}
                    </td>
                    <td className="adm-td">
                      <span className={`adm-badge ${row.role === 'admin' ? 'adm-badge-accent' : 'adm-badge-neutral'}`}>
                        {row.role}
                      </span>
                    </td>
                    <td className="adm-td text-right tabular-nums">{row.order_count}</td>
                    <td className="adm-td text-right font-semibold tabular-nums">
                      {formatPrice(row.total_spent)}
                    </td>
                    <td className="adm-td whitespace-nowrap text-ink-600 dark:text-ink-400">
                      {formatDateTime(row.created_at)}
                    </td>
                    <td className="adm-td">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/admin/customers/${row.id}`}
                          aria-label={`Open ${row.full_name || row.email}`}
                          className="adm-icon-btn"
                        >
                          <Icon name="chevronRight" size={16} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}
