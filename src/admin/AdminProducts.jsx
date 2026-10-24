import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import { ConfirmDialog, EmptyState, ErrorState, LoadingState, PageHeader, Toast } from './components/Page'
import { adminProducts } from '../lib/adminApi'
import { formatPrice } from '../lib/format'

const PAGE_SIZE = 20

/**
 * Product catalogue.
 *
 * Pagination lives in the URL (`?page=2`) so a refresh, a bookmark or the
 * browser's back button all return to the same slice of the list.
 */
export default function AdminProducts() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))

  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState(searchParams.get('q') ?? '')
  const [term, setTerm] = useState(searchParams.get('q') ?? '')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [toast, setToast] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const result = await adminProducts.list({ search, page, limit: PAGE_SIZE })
    if (result.error) setError(result.error)
    else {
      setRows(result.data)
      setTotal(result.total ?? 0)
    }
    setLoading(false)
  }, [search, page])

  useEffect(() => {
    document.title = 'Products — FootballTrix Admin'
    load()
  }, [load])

  // Debounce typing into the URL so each keystroke does not reset pagination.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch((current) => {
        if (current === term) return current
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev)
          if (term) next.set('q', term)
          else next.delete('q')
          next.delete('page')
          return next
        })
        return term
      })
    }, 300)
    return () => clearTimeout(timer)
  }, [term, setSearchParams])

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))

  async function toggleActive(row) {
    setBusyId(row.id)
    const next = !row.is_active
    const result = await adminProducts.setActive(row.id, next)
    setBusyId(null)
    if (result.error) setToast({ tone: 'error', text: result.error.message })
    else {
      setToast({ tone: 'ok', text: next ? `“${row.name}” is now visible in the shop.` : `“${row.name}” is hidden from the shop.` })
      load()
    }
  }

  async function duplicate(row) {
    setBusyId(row.id)
    const result = await adminProducts.duplicate(row.id)
    setBusyId(null)
    if (result.error) setToast({ tone: 'error', text: result.error.message })
    else {
      setToast({ tone: 'ok', text: `Created “${result.data.name}”. It starts unpublished with zero stock.` })
      load()
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    setBusyId(pendingDelete.id)
    const result = await adminProducts.remove(pendingDelete.id)
    setBusyId(null)
    setPendingDelete(null)
    if (result.error) setToast({ tone: 'error', text: result.error.message })
    else {
      setToast({ tone: 'ok', text: `“${pendingDelete.name}” was deleted.` })
      load()
    }
  }

  function goPage(next) {
    const params = new URLSearchParams(searchParams)
    if (next <= 1) params.delete('page')
    else params.set('page', String(next))
    setSearchParams(params)
  }

  return (
    <>
      <PageHeader
        title="Products"
        lede={`${total} product${total === 1 ? '' : 's'} in the catalogue.`}
        actions={
          <Link to="/admin/products/new" className="adm-btn-dark">
            <Icon name="plus" size={16} />
            New product
          </Link>
        }
      />

      <Toast tone={toast?.tone} onDismiss={() => setToast(null)}>{toast?.text}</Toast>

      <div className="adm-card mb-5 adm-card-pad">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Icon name="search" size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
            <input
              type="search"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search by product name…"
              aria-label="Search products"
              className="adm-input pl-9"
            />
          </div>
          <p className="shrink-0 text-xs text-ink-500 dark:text-ink-400">
            Showing {rows.length ? (page - 1) * PAGE_SIZE + 1 : 0}–{Math.min(page * PAGE_SIZE, total)} of {total}
          </p>
        </div>
      </div>

      {loading ? (
        <LoadingState label="Loading products…" />
      ) : error ? (
        <ErrorState error={error} onRetry={load} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon="package"
          title={search ? `No products match “${search}”` : 'No products yet'}
          hint={search
            ? 'Try a shorter search, or clear the box to see the whole catalogue.'
            : 'Add your first product to start selling it on the storefront.'}
          action={
            search ? (
              <button type="button" onClick={() => setTerm('')} className="adm-btn-outline">
                Clear search
              </button>
            ) : (
              <Link to="/admin/products/new" className="adm-btn-dark">
                <Icon name="plus" size={16} />
                New product
              </Link>
            )
          }
        />
      ) : (
        <div className="adm-card overflow-hidden">
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th className="adm-th">Product</th>
                  <th className="adm-th">Category</th>
                  <th className="adm-th text-right">Price</th>
                  <th className="adm-th text-right">Stock</th>
                  <th className="adm-th">Status</th>
                  <th className="adm-th text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const stock = (row.product_variants ?? []).reduce((sum, v) => sum + Number(v.stock ?? 0), 0)
                  return (
                    <tr key={row.id} className="adm-tr-hover">
                      <td className="adm-td">
                        <div className="flex items-center gap-3">
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-ink-100 dark:bg-ink-800">
                            {row.thumbnail_url
                              ? <img src={row.thumbnail_url} alt="" className="h-full w-full object-cover" />
                              : <Icon name="jersey" size={18} className="text-ink-500" />}
                          </span>
                          <span className="min-w-0">
                            <Link
                              to={`/admin/products/${row.id}/edit`}
                              className="block max-w-[16rem] truncate font-semibold text-ink-950 underline-offset-4 hover:underline dark:text-white"
                            >
                              {row.name}
                            </Link>
                            <span className="block text-xs text-ink-500">
                              {(row.product_variants ?? []).length} variant{(row.product_variants ?? []).length === 1 ? '' : 's'}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className="adm-td text-ink-600 dark:text-ink-400">
                        {row.categories?.name ?? <span className="text-ink-500">Uncategorised</span>}
                      </td>
                      <td className="adm-td text-right font-semibold tabular-nums">
                        {formatPrice(row.sale_price ?? row.base_price)}
                        {row.sale_price != null && Number(row.sale_price) < Number(row.base_price) && (
                          <span className="ml-1.5 text-[11px] font-normal text-ink-500 line-through">
                            {formatPrice(row.base_price)}
                          </span>
                        )}
                      </td>
                      <td className="adm-td text-right tabular-nums">
                        <span className={stock === 0 ? 'font-bold text-rose-600 dark:text-rose-400' : ''}>
                          {stock}
                        </span>
                      </td>
                      <td className="adm-td">
                        <span className={`adm-badge ${row.is_active ? 'adm-badge-ok' : 'adm-badge-neutral'}`}>
                          {row.is_active ? 'Active' : 'Draft'}
                        </span>
                      </td>
                      <td className="adm-td">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/admin/products/${row.id}/edit`}
                            aria-label={`Edit ${row.name}`}
                            className="adm-icon-btn"
                          >
                            <Icon name="edit" size={16} />
                          </Link>
                          <button
                            type="button"
                            onClick={() => toggleActive(row)}
                            disabled={busyId === row.id}
                            aria-label={row.is_active ? `Hide ${row.name}` : `Publish ${row.name}`}
                            className="adm-icon-btn"
                          >
                            <Icon name="eye" size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => duplicate(row)}
                            disabled={busyId === row.id}
                            aria-label={`Duplicate ${row.name}`}
                            className="adm-icon-btn"
                          >
                            <Icon name="copy" size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingDelete(row)}
                            aria-label={`Delete ${row.name}`}
                            className="adm-icon-btn text-rose-600 dark:text-rose-400"
                          >
                            <Icon name="trash" size={16} />
                          </button>
                        </div>
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
                onClick={() => goPage(page - 1)}
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
                onClick={() => goPage(page + 1)}
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

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this product?"
        body={`“${pendingDelete?.name ?? ''}” and its variants will be removed from the catalogue. Past orders keep their own copies of the line items.`}
        confirmLabel="Delete product"
        busy={Boolean(pendingDelete) && busyId === pendingDelete?.id}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  )
}
