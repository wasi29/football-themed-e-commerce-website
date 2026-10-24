import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import { ConfirmDialog, EmptyState, ErrorState, LoadingState, PageHeader, Toast } from './components/Page'
import { adminReviews } from '../lib/adminApi'
import { formatDateTime } from '../lib/format'

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
]

function Stars({ value, size = 14 }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Icon
          key={n}
          name="star"
          size={size}
          className={n <= value ? 'fill-lime-accent text-lime-accent' : 'text-ink-300 dark:text-ink-700'}
        />
      ))}
    </span>
  )
}

/**
 * Review moderation.
 *
 * Approval is a real gate: `is_approved = false` rows never reach the
 * storefront's product pages, so this screen is what makes a review public.
 */
export default function AdminReviews() {
  const [filter, setFilter] = useState('all')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [toast, setToast] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const result = await adminReviews.list({ pendingOnly: filter === 'pending' })
    if (result.error) setError(result.error)
    else {
      const all = result.data
      setRows(filter === 'approved' ? all.filter((r) => r.is_approved) : all)
    }
    setLoading(false)
  }, [filter])

  useEffect(() => {
    document.title = 'Reviews — FootballTrix Admin'
    load()
  }, [load])

  async function approve(row) {
    setBusyId(row.id)
    const result = await adminReviews.setApproved(row.id, true)
    setBusyId(null)
    if (result.error) setToast({ tone: 'error', text: result.error.message })
    else {
      setToast({ tone: 'ok', text: 'Review approved — it is now visible on the product page.' })
      load()
    }
  }

  async function reject(row) {
    setBusyId(row.id)
    const result = await adminReviews.setApproved(row.id, false)
    setBusyId(null)
    if (result.error) setToast({ tone: 'error', text: result.error.message })
    else {
      setToast({ tone: 'ok', text: 'Review rejected — it will not appear on the storefront.' })
      load()
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    setBusyId(pendingDelete.id)
    const result = await adminReviews.remove(pendingDelete.id)
    setBusyId(null)
    setPendingDelete(null)
    if (result.error) setToast({ tone: 'error', text: result.error.message })
    else {
      setToast({ tone: 'ok', text: 'Review deleted.' })
      load()
    }
  }

  const pendingCount = rows.filter((r) => !r.is_approved).length

  return (
    <>
      <PageHeader
        title="Reviews"
        lede={
          pendingCount
            ? `${pendingCount} review${pendingCount === 1 ? '' : 's'} waiting for a decision.`
            : 'Approve, reject or remove customer reviews.'
        }
      />

      <Toast tone={toast?.tone} onDismiss={() => setToast(null)}>{toast?.text}</Toast>

      <div className="adm-card mb-5 p-3 sm:p-4">
        <div className="flex gap-1.5 overflow-x-auto">
          {FILTERS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFilter(option.value)}
              className={`shrink-0 rounded-lg px-3.5 py-2 text-xs font-bold transition-colors ${
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

      {loading ? (
        <LoadingState label="Loading reviews…" />
      ) : error ? (
        <ErrorState error={error} onRetry={load} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon="star"
          title={filter === 'pending' ? 'No reviews awaiting approval' : 'No reviews yet'}
          hint="Customer reviews arrive here for approval before they appear on a product page."
        />
      ) : (
        <div className="space-y-4">
          {rows.map((row) => (
            <article key={row.id} className="adm-card adm-card-pad">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ink-950 text-xs font-bold text-lime-accent dark:bg-lime-accent dark:text-ink-950">
                  {(row.author_name || '?').slice(0, 2).toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <span className="font-bold text-ink-950 dark:text-white">{row.author_name}</span>
                    <Stars value={row.rating} />
                    <span className={`adm-badge ${row.is_approved ? 'adm-badge-ok' : 'adm-badge-warn'}`}>
                      {row.is_approved ? 'Approved' : 'Pending'}
                    </span>
                    {row.is_verified && <span className="adm-badge adm-badge-info">Verified purchase</span>}
                  </div>

                  <p className="mt-1.5 text-xs text-ink-500 dark:text-ink-400">
                    {formatDateTime(row.created_at)}
                    {row.products?.name && (
                      <>
                        {' · '}
                        <Link
                          to={`/admin/products/${row.product_id}/edit`}
                          className="font-semibold text-ink-950 underline-offset-4 hover:underline dark:text-lime-accent"
                        >
                          {row.products.name}
                        </Link>
                      </>
                    )}
                  </p>

                  {row.title && (
                    <p className="mt-3 font-semibold text-ink-950 dark:text-white">{row.title}</p>
                  )}
                  <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-ink-700 dark:text-ink-300">
                    {row.body}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col">
                  {!row.is_approved ? (
                    <button
                      type="button"
                      onClick={() => approve(row)}
                      disabled={busyId === row.id}
                      className="adm-btn-dark !px-3 !py-2 !text-xs"
                    >
                      <Icon name="check" size={15} />
                      Approve
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => reject(row)}
                      disabled={busyId === row.id}
                      className="adm-btn-outline !px-3 !py-2 !text-xs"
                    >
                      <Icon name="close" size={15} />
                      Unpublish
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setPendingDelete(row)}
                    disabled={busyId === row.id}
                    className="adm-btn-danger !px-3 !py-2 !text-xs"
                  >
                    <Icon name="trash" size={15} />
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this review?"
        body="The review will be removed permanently and the product's rating recalculated."
        confirmLabel="Delete review"
        busy={Boolean(pendingDelete) && busyId === pendingDelete?.id}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  )
}
