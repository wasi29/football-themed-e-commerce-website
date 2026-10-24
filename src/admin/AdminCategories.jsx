import { useCallback, useEffect, useState } from 'react'
import Icon from '../components/ui/Icon'
import FormModal from './components/FormModal'
import { ConfirmDialog, EmptyState, ErrorState, LoadingState, PageHeader, Toast } from './components/Page'
import { adminCategories } from '../lib/adminApi'

const EMPTY = { name: '', slug: '', description: '', parent_id: '', position: 0, is_active: true }

/**
 * Categories and their subcategories.
 *
 * Both live in the same `categories` table (`parent_id` points at the parent),
 * so the list is rendered as a flat table with an indentation column rather
 * than as two separate screens — an admin can see the whole tree at once and
 * reparent an entry by editing it.
 */
export default function AdminCategories() {
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
    const result = await adminCategories.list()
    if (result.error) setError(result.error)
    else setRows(result.data)
    setLoading(false)
  }, [])

  useEffect(() => {
    document.title = 'Categories — FootballTrix Admin'
    load()
  }, [load])

  const parents = rows.filter((r) => !r.parent_id)
  const childrenOf = (id) => rows.filter((r) => r.parent_id === id)

  // Flatten the tree once so the table can render it as a single ordered list.
  // The second pass catches orphans whose parent row no longer exists.
  const ordered = (() => {
    const result = []
    const seen = new Set()
    const walk = (row, depth) => {
      if (seen.has(row.id)) return
      seen.add(row.id)
      result.push({ row, depth })
      childrenOf(row.id).forEach((child) => walk(child, depth + 1))
    }
    parents.forEach((row) => walk(row, 0))
    rows.forEach((row) => walk(row, 0))
    return result
  })()

  function openCreate() {
    setEditing('new')
    setForm({ ...EMPTY, position: rows.length })
  }

  function openEdit(row) {
    setEditing(row)
    setForm({
      name: row.name ?? '',
      slug: row.slug ?? '',
      description: row.description ?? '',
      parent_id: row.parent_id ?? '',
      position: row.position ?? 0,
      is_active: row.is_active ?? true,
    })
  }

  async function submit() {
    if (!form.name.trim()) {
      setToast({ tone: 'error', text: 'A category needs a name.' })
      return
    }
    setBusy(true)
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || form.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      description: form.description.trim() || null,
      parent_id: form.parent_id || null,
      position: Number(form.position) || 0,
      is_active: form.is_active,
    }

    const result = editing === 'new'
      ? await adminCategories.save(payload)
      : await adminCategories.save({ id: editing.id, ...payload })

    setBusy(false)
    if (result.error) {
      // `23505` is Postgres' unique_violation — the slug is taken.
      setToast({
        tone: 'error',
        text: result.error.code === '23505'
          ? 'That slug is already used by another category.'
          : result.error.message,
      })
      return
    }

    setToast({ tone: 'ok', text: `“${payload.name}” saved.` })
    setEditing(null)
    load()
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    setBusy(true)
    const result = await adminCategories.remove(pendingDelete.id)
    setBusy(false)
    setPendingDelete(null)
    if (result.error) setToast({ tone: 'error', text: result.error.message })
    else {
      setToast({ tone: 'ok', text: `“${pendingDelete.name}” deleted. Its products keep working under an uncategorised label.` })
      load()
    }
  }

  return (
    <>
      <PageHeader
        title="Categories"
        lede="The navigation tree customers browse. Subcategories sit under a parent."
        actions={
          <button type="button" onClick={openCreate} className="adm-btn-dark">
            <Icon name="plus" size={16} />
            New category
          </button>
        }
      />

      <Toast tone={toast?.tone} onDismiss={() => setToast(null)}>{toast?.text}</Toast>

      {loading ? (
        <LoadingState label="Loading categories…" />
      ) : error ? (
        <ErrorState error={error} onRetry={load} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon="grid"
          title="No categories yet"
          hint="Categories drive the storefront's navigation and the shop filters."
          action={
            <button type="button" onClick={openCreate} className="adm-btn-dark">
              <Icon name="plus" size={16} />
              New category
            </button>
          }
        />
      ) : (
        <div className="adm-card overflow-hidden">
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th className="adm-th">Name</th>
                  <th className="adm-th">Slug</th>
                  <th className="adm-th">Parent</th>
                  <th className="adm-th">Position</th>
                  <th className="adm-th">Status</th>
                  <th className="adm-th text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {ordered.map(({ row, depth }) => (
                  <tr key={row.id} className="adm-tr-hover">
                    <td className="adm-td">
                      <div style={{ paddingLeft: depth * 22 }} className="flex items-center gap-2.5">
                        {depth > 0 && <span className="text-ink-400">└</span>}
                        <span className="font-semibold text-ink-950 dark:text-white">{row.name}</span>
                        {depth > 0 && <span className="adm-badge adm-badge-neutral">Subcategory</span>}
                      </div>
                    </td>
                    <td className="adm-td font-mono text-xs text-ink-600 dark:text-ink-400">{row.slug}</td>
                    <td className="adm-td text-ink-600 dark:text-ink-400">
                      {row.parent_id ? rows.find((r) => r.id === row.parent_id)?.name ?? '—' : '—'}
                    </td>
                    <td className="adm-td tabular-nums">{row.position}</td>
                    <td className="adm-td">
                      <span className={`adm-badge ${row.is_active ? 'adm-badge-ok' : 'adm-badge-neutral'}`}>
                        {row.is_active ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td className="adm-td">
                      <div className="flex items-center justify-end gap-1.5">
                        <button type="button" onClick={() => openEdit(row)} aria-label={`Edit ${row.name}`} className="adm-icon-btn">
                          <Icon name="edit" size={16} />
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <FormModal
        open={Boolean(editing)}
        title={editing === 'new' ? 'New category' : 'Edit category'}
        subtitle="Slugs must be unique — they become the URL."
        onClose={() => setEditing(null)}
        onSubmit={submit}
        busy={busy}
        submitLabel={editing === 'new' ? 'Create category' : 'Save changes'}
      >
        <div>
          <label className="adm-label" htmlFor="cat-name">Name</label>
          <input
            id="cat-name"
            className="adm-input"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Club jerseys"
            required
            autoFocus
          />
        </div>

        <div>
          <label className="adm-label" htmlFor="cat-slug">Slug</label>
          <input
            id="cat-slug"
            className="adm-input font-mono"
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            placeholder="club-jerseys"
          />
          <p className="mt-1.5 text-xs text-ink-500 dark:text-ink-400">
            Leave blank to generate it from the name.
          </p>
        </div>

        <div>
          <label className="adm-label" htmlFor="cat-parent">Parent category</label>
          <select
            id="cat-parent"
            className="adm-select"
            value={form.parent_id}
            onChange={(e) => setForm((f) => ({ ...f, parent_id: e.target.value }))}
          >
            <option value="">None — this is a top-level category</option>
            {parents
              // `editing` is null while the modal is closed, but these children
              // are constructed on every render regardless of `open` — so the
              // self-exclusion has to tolerate a null target.
              .filter((row) => editing === 'new' || row.id !== editing?.id)
              .map((row) => (
                <option key={row.id} value={row.id}>{row.name}</option>
              ))}
          </select>
          <p className="mt-1.5 text-xs text-ink-500 dark:text-ink-400">
            Choosing a parent turns this into a subcategory.
          </p>
        </div>

        <div>
          <label className="adm-label" htmlFor="cat-desc">Description</label>
          <textarea
            id="cat-desc"
            className="adm-textarea"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Optional — shown on the category page."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="adm-label" htmlFor="cat-position">Position</label>
            <input
              id="cat-position"
              type="number"
              min="0"
              className="adm-input"
              value={form.position}
              onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
            />
          </div>
          <div>
            <label className="adm-label" htmlFor="cat-active">Visible</label>
            <select
              id="cat-active"
              className="adm-select"
              value={form.is_active ? 'yes' : 'no'}
              onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.value === 'yes' }))}
            >
              <option value="yes">Active</option>
              <option value="no">Hidden</option>
            </select>
          </div>
        </div>
      </FormModal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this category?"
        body={`“${pendingDelete?.name ?? ''}” will be removed. Products that used it become uncategorised — they are not deleted.`}
        confirmLabel="Delete category"
        busy={busy}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  )
}
