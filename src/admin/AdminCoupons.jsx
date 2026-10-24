import { useCallback, useEffect, useState } from 'react'
import Icon from '../components/ui/Icon'
import FormModal from './components/FormModal'
import { ConfirmDialog, EmptyState, ErrorState, LoadingState, PageHeader, Toast } from './components/Page'
import { adminCoupons } from '../lib/adminApi'
import { formatDateTime } from '../lib/format'

const EMPTY = {
  code: '', description: '', type: 'percent', value: 10,
  min_order: 0, max_discount: '', usage_limit: '',
  starts_at: '', expires_at: '', is_active: true,
}

function toDateInput(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function isActiveNow(row) {
  if (!row.is_active) return false
  const now = Date.now()
  if (row.starts_at && new Date(row.starts_at).getTime() > now) return false
  if (row.expires_at && new Date(row.expires_at).getTime() < now) return false
  if (row.usage_limit && Number(row.used_count) >= Number(row.usage_limit)) return false
  return true
}

/**
 * Discount codes.
 *
 * `isActiveNow` reproduces in the UI what `place_order` enforces in SQL — a
 * coupon can show as "active" in the row while its window has closed, so the
 * badge reflects the window, the flag, and the usage limit separately.
 */
export default function AdminCoupons() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [busy, setBusy] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const result = await adminCoupons.list()
    if (result.error) setError(result.error)
    else setRows(result.data)
    setLoading(false)
  }, [])

  useEffect(() => {
    document.title = 'Coupons — FootballTrix Admin'
    load()
  }, [load])

  function openCreate() {
    setEditing('new')
    setForm(EMPTY)
  }

  function openEdit(row) {
    setEditing(row)
    setForm({
      code: row.code ?? '',
      description: row.description ?? '',
      type: row.type ?? 'percent',
      value: row.value ?? 10,
      min_order: row.min_order ?? 0,
      max_discount: row.max_discount ?? '',
      usage_limit: row.usage_limit ?? '',
      starts_at: toDateInput(row.starts_at),
      expires_at: toDateInput(row.expires_at),
      is_active: row.is_active ?? true,
    })
  }

  async function submit() {
    const code = form.code.trim().toUpperCase()
    if (!code) {
      setToast({ tone: 'error', text: 'A coupon needs a code.' })
      return
    }
    if (!Number(form.value) || Number(form.value) <= 0) {
      setToast({ tone: 'error', text: 'The discount value must be greater than zero.' })
      return
    }

    setBusy(true)
    const payload = {
      code,
      description: form.description.trim() || null,
      type: form.type,
      value: Number(form.value),
      min_order: Number(form.min_order) || 0,
      max_discount: form.max_discount === '' ? null : Number(form.max_discount),
      usage_limit: form.usage_limit === '' ? null : Number(form.usage_limit),
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      is_active: form.is_active,
    }

    const result = editing === 'new'
      ? await adminCoupons.save(payload)
      : await adminCoupons.save({ id: editing.id, used_count: editing.used_count ?? 0, ...payload })

    setBusy(false)
    if (result.error) {
      setToast({
        tone: 'error',
        text: result.error.code === '23505'
          ? `The code ${payload.code} already exists.`
          : result.error.message,
      })
      return
    }

    setToast({ tone: 'ok', text: `Coupon ${payload.code} saved.` })
    setEditing(null)
    load()
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    setBusy(true)
    const result = await adminCoupons.remove(pendingDelete.id)
    setBusy(false)
    setPendingDelete(null)
    if (result.error) setToast({ tone: 'error', text: result.error.message })
    else {
      setToast({ tone: 'ok', text: `Coupon ${pendingDelete.code} deleted.` })
      load()
    }
  }

  function describe(row) {
    return row.type === 'percent'
      ? `${row.value}% off`
      : `৳${row.value} off`
  }

  return (
    <>
      <PageHeader
        title="Coupons"
        lede={`${rows.length} discount code${rows.length === 1 ? '' : 's'}.`}
        actions={
          <button type="button" onClick={openCreate} className="adm-btn-dark">
            <Icon name="plus" size={16} />
            New coupon
          </button>
        }
      />

      <Toast tone={toast?.tone} onDismiss={() => setToast(null)}>{toast?.text}</Toast>

      {loading ? (
        <LoadingState label="Loading coupons…" />
      ) : error ? (
        <ErrorState error={error} onRetry={load} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon="tag2"
          title="No coupons yet"
          hint="Discount codes are applied at checkout and validated against the usage limit and window."
          action={
            <button type="button" onClick={openCreate} className="adm-btn-dark">
              <Icon name="plus" size={16} />
              New coupon
            </button>
          }
        />
      ) : (
        <div className="adm-card overflow-hidden">
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th className="adm-th">Code</th>
                  <th className="adm-th">Discount</th>
                  <th className="adm-th">Conditions</th>
                  <th className="adm-th text-right">Used</th>
                  <th className="adm-th">Window</th>
                  <th className="adm-th">Status</th>
                  <th className="adm-th text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const active = isActiveNow(row)
                  return (
                    <tr key={row.id} className="adm-tr-hover">
                      <td className="adm-td">
                        <span className="font-mono font-bold text-ink-950 dark:text-white">{row.code}</span>
                        {row.description && (
                          <span className="block max-w-[14rem] truncate text-xs text-ink-500">{row.description}</span>
                        )}
                      </td>
                      <td className="adm-td font-semibold">{describe(row)}</td>
                      <td className="adm-td text-xs text-ink-600 dark:text-ink-400">
                        {Number(row.min_order) > 0 && <span className="block">Min order ৳{row.min_order}</span>}
                        {row.max_discount != null && <span className="block">Max discount ৳{row.max_discount}</span>}
                        {!Number(row.min_order) && row.max_discount == null && <span className="text-ink-500">None</span>}
                      </td>
                      <td className="adm-td text-right tabular-nums">
                        {row.used_count}
                        {row.usage_limit != null && <span className="text-ink-500"> / {row.usage_limit}</span>}
                      </td>
                      <td className="adm-td text-xs text-ink-600 dark:text-ink-400">
                        <span className="block">{row.starts_at ? formatDateTime(row.starts_at) : 'No start'}</span>
                        <span className="block">{row.expires_at ? `→ ${formatDateTime(row.expires_at)}` : 'No expiry'}</span>
                      </td>
                      <td className="adm-td">
                        <span className={`adm-badge ${active ? 'adm-badge-ok' : 'adm-badge-neutral'}`}>
                          {active ? 'Live' : row.is_active ? 'Outside window' : 'Disabled'}
                        </span>
                      </td>
                      <td className="adm-td">
                        <div className="flex items-center justify-end gap-1.5">
                          <button type="button" onClick={() => openEdit(row)} aria-label={`Edit ${row.code}`} className="adm-icon-btn">
                            <Icon name="edit" size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingDelete(row)}
                            aria-label={`Delete ${row.code}`}
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
        </div>
      )}

      <FormModal
        open={Boolean(editing)}
        // Evaluated even when `open` is false, so `editing` may still be null.
        title={editing === 'new' ? 'New coupon' : `Edit ${editing?.code ?? ''}`}
        subtitle="Codes are case-insensitive and stored uppercase."
        onClose={() => setEditing(null)}
        onSubmit={submit}
        busy={busy}
        submitLabel={editing === 'new' ? 'Create coupon' : 'Save changes'}
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="adm-label" htmlFor="cp-code">Code</label>
            <input
              id="cp-code"
              className="adm-input font-mono uppercase"
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              placeholder="WELCOME10"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="adm-label" htmlFor="cp-type">Type</label>
            <select
              id="cp-type"
              className="adm-select"
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            >
              <option value="percent">Percentage</option>
              <option value="fixed">Fixed amount</option>
            </select>
          </div>

          <div>
            <label className="adm-label" htmlFor="cp-value">
              Value {form.type === 'percent' ? '(%)' : '(৳)'}
            </label>
            <input
              id="cp-value"
              type="number"
              min="1"
              className="adm-input"
              value={form.value}
              onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="adm-label" htmlFor="cp-min">Minimum order (৳)</label>
            <input
              id="cp-min"
              type="number"
              min="0"
              className="adm-input"
              value={form.min_order}
              onChange={(e) => setForm((f) => ({ ...f, min_order: e.target.value }))}
            />
          </div>

          <div>
            <label className="adm-label" htmlFor="cp-max">Max discount (৳)</label>
            <input
              id="cp-max"
              type="number"
              min="0"
              className="adm-input"
              value={form.max_discount}
              onChange={(e) => setForm((f) => ({ ...f, max_discount: e.target.value }))}
              placeholder="No cap"
            />
          </div>

          <div>
            <label className="adm-label" htmlFor="cp-limit">Usage limit</label>
            <input
              id="cp-limit"
              type="number"
              min="1"
              className="adm-input"
              value={form.usage_limit}
              onChange={(e) => setForm((f) => ({ ...f, usage_limit: e.target.value }))}
              placeholder="Unlimited"
            />
          </div>

          <div>
            <label className="adm-label" htmlFor="cp-active">Status</label>
            <select
              id="cp-active"
              className="adm-select"
              value={form.is_active ? 'yes' : 'no'}
              onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.value === 'yes' }))}
            >
              <option value="yes">Enabled</option>
              <option value="no">Disabled</option>
            </select>
          </div>

          <div>
            <label className="adm-label" htmlFor="cp-start">Starts</label>
            <input
              id="cp-start"
              type="datetime-local"
              className="adm-input"
              value={form.starts_at}
              onChange={(e) => setForm((f) => ({ ...f, starts_at: e.target.value }))}
            />
          </div>

          <div>
            <label className="adm-label" htmlFor="cp-expires">Expires</label>
            <input
              id="cp-expires"
              type="datetime-local"
              className="adm-input"
              value={form.expires_at}
              onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))}
            />
          </div>

          <div className="col-span-2">
            <label className="adm-label" htmlFor="cp-desc">Description</label>
            <input
              id="cp-desc"
              className="adm-input"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Optional — shown to admins only"
            />
          </div>
        </div>
      </FormModal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this coupon?"
        body={`Code ${pendingDelete?.code ?? ''} will stop working immediately for anyone who has not yet checked out.`}
        confirmLabel="Delete coupon"
        busy={busy}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  )
}
