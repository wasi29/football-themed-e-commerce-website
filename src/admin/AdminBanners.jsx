import { useCallback, useEffect, useState } from 'react'
import Icon from '../components/ui/Icon'
import FormModal from './components/FormModal'
import ImagePicker from './components/ImagePicker'
import { ConfirmDialog, EmptyState, ErrorState, LoadingState, PageHeader, Toast } from './components/Page'
import { adminBanners } from '../lib/adminApi'
import { formatDateTime } from '../lib/format'

const PLACEMENTS = [
  { value: 'hero_desktop', label: 'Hero (desktop)' },
  { value: 'hero_mobile', label: 'Hero (mobile)' },
  { value: 'strip', label: 'Announcement strip' },
  { value: 'promo', label: 'Promo block' },
  { value: 'midpage', label: 'Mid-page banner' },
]

const EMPTY = {
  title: '', subtitle: '', eyebrow: '', placement: 'hero_desktop',
  image_url: '', mobile_image_url: '', cta_label: 'Shop Now', cta_link: '/shop',
  secondary_cta_label: '', secondary_cta_link: '', text_align: 'left',
  accent_color: '#C8FF3D', position: 0, is_active: true, starts_at: '', ends_at: '',
}

function toDateInput(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/**
 * Promotional banners.
 *
 * Desktop and mobile images are separate fields because the storefront crops
 * them differently; both are uploaded through `ImagePicker`, which stores only
 * the resulting URL. The date window is enforced in the UI as a convenience —
 * the storefront re-checks it when it renders, so an expired banner never leaks
 * onto the homepage even if this screen says otherwise.
 */
export default function AdminBanners() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [busy, setBusy] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const result = await adminBanners.list()
    if (result.error) setError(result.error)
    else setRows(result.data)
    setLoading(false)
  }, [])

  useEffect(() => {
    document.title = 'Banners — FootballTrix Admin'
    load()
  }, [load])

  function openCreate() {
    setEditing('new')
    setForm({ ...EMPTY, position: rows.length })
  }

  function openEdit(row) {
    setEditing(row)
    setForm({
      title: row.title ?? '',
      subtitle: row.subtitle ?? '',
      eyebrow: row.eyebrow ?? '',
      placement: row.placement ?? 'hero_desktop',
      image_url: row.image_url ?? '',
      mobile_image_url: row.mobile_image_url ?? '',
      cta_label: row.cta_label ?? 'Shop Now',
      cta_link: row.cta_link ?? '/shop',
      secondary_cta_label: row.secondary_cta_label ?? '',
      secondary_cta_link: row.secondary_cta_link ?? '',
      text_align: row.text_align ?? 'left',
      accent_color: row.accent_color ?? '#C8FF3D',
      position: row.position ?? 0,
      is_active: row.is_active ?? true,
      starts_at: toDateInput(row.starts_at),
      ends_at: toDateInput(row.ends_at),
    })
  }

  async function submit() {
    if (!form.title.trim()) {
      setToast({ tone: 'error', text: 'A banner needs a title.' })
      return
    }
    if (form.starts_at && form.ends_at && new Date(form.starts_at) >= new Date(form.ends_at)) {
      setToast({ tone: 'error', text: 'The end date must be after the start date.' })
      return
    }

    setBusy(true)
    const payload = {
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || null,
      eyebrow: form.eyebrow.trim() || null,
      placement: form.placement,
      image_url: form.image_url || null,
      mobile_image_url: form.mobile_image_url || null,
      cta_label: form.cta_label || null,
      cta_link: form.cta_link || null,
      secondary_cta_label: form.secondary_cta_label || null,
      secondary_cta_link: form.secondary_cta_link || null,
      text_align: form.text_align,
      accent_color: form.accent_color,
      position: Number(form.position) || 0,
      is_active: form.is_active,
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
      ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
    }

    const result = editing === 'new'
      ? await adminBanners.save(payload)
      : await adminBanners.save({ id: editing.id, ...payload })

    setBusy(false)
    if (result.error) {
      setToast({ tone: 'error', text: result.error.message })
      return
    }
    setToast({ tone: 'ok', text: `“${payload.title}” saved.` })
    setEditing(null)
    load()
  }

  async function toggle(row) {
    setBusyId(row.id)
    const result = await adminBanners.save({ id: row.id, is_active: !row.is_active })
    setBusyId(null)
    if (result.error) setToast({ tone: 'error', text: result.error.message })
    else {
      setToast({ tone: 'ok', text: `“${row.title}” ${!row.is_active ? 'activated' : 'deactivated'}.` })
      load()
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    setBusy(true)
    const result = await adminBanners.remove(pendingDelete.id)
    setBusy(false)
    setPendingDelete(null)
    if (result.error) setToast({ tone: 'error', text: result.error.message })
    else {
      setToast({ tone: 'ok', text: `“${pendingDelete.title}” deleted.` })
      load()
    }
  }

  const placementLabel = (value) => PLACEMENTS.find((p) => p.value === value)?.label ?? value

  return (
    <>
      <PageHeader
        title="Banners"
        lede={`${rows.length} banner${rows.length === 1 ? '' : 's'} configured.`}
        actions={
          <button type="button" onClick={openCreate} className="adm-btn-dark">
            <Icon name="plus" size={16} />
            New banner
          </button>
        }
      />

      <Toast tone={toast?.tone} onDismiss={() => setToast(null)}>{toast?.text}</Toast>

      {loading ? (
        <LoadingState label="Loading banners…" />
      ) : error ? (
        <ErrorState error={error} onRetry={load} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon="image"
          title="No banners yet"
          hint="Banners appear in the hero, announcement strip and promo slots on the storefront."
          action={
            <button type="button" onClick={openCreate} className="adm-btn-dark">
              <Icon name="plus" size={16} />
              New banner
            </button>
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((row) => (
            <article key={row.id} className="adm-card overflow-hidden">
              <div className="relative aspect-[16/9] bg-ink-100 dark:bg-ink-800">
                {(row.image_url || row.mobile_image_url) ? (
                  <img
                    src={row.image_url || row.mobile_image_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Icon name="image" size={26} className="text-ink-400" />
                  </div>
                )}
                <span className="absolute left-3 top-3 rounded-lg bg-ink-950/85 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur">
                  {placementLabel(row.placement)}
                </span>
                <span className={`absolute right-3 top-3 adm-badge ${row.is_active ? 'adm-badge-ok' : 'adm-badge-neutral'}`}>
                  {row.is_active ? 'Active' : 'Off'}
                </span>
              </div>

              <div className="p-4">
                <h2 className="truncate font-display text-lg font-extrabold uppercase text-ink-950 dark:text-white">
                  {row.title}
                </h2>
                {row.subtitle && (
                  <p className="mt-0.5 line-clamp-2 text-sm text-ink-600 dark:text-ink-400">{row.subtitle}</p>
                )}
                <p className="mt-2 text-[11px] text-ink-500">
                  Position {row.position}
                  {row.starts_at && <> · from {formatDateTime(row.starts_at)}</>}
                  {row.ends_at && <> · until {formatDateTime(row.ends_at)}</>}
                </p>

                <div className="mt-3 flex gap-1.5">
                  <button type="button" onClick={() => openEdit(row)} className="adm-btn-outline flex-1 !px-3 !py-2 !text-xs">
                    <Icon name="edit" size={14} />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => toggle(row)}
                    disabled={busyId === row.id}
                    className="adm-btn-outline flex-1 !px-3 !py-2 !text-xs"
                  >
                    {row.is_active ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDelete(row)}
                    aria-label={`Delete ${row.title}`}
                    className="adm-icon-btn text-rose-600 dark:text-rose-400"
                  >
                    <Icon name="trash" size={16} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <FormModal
        open={Boolean(editing)}
        title={editing === 'new' ? 'New banner' : 'Edit banner'}
        subtitle="The storefront picks the desktop or mobile image based on the visitor's screen."
        onClose={() => setEditing(null)}
        onSubmit={submit}
        busy={busy}
        submitLabel={editing === 'new' ? 'Create banner' : 'Save changes'}
      >
        <div>
          <label className="adm-label" htmlFor="bn-title">Title</label>
          <input
            id="bn-title"
            className="adm-input"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Season opener"
            required
            autoFocus
          />
        </div>

        <div>
          <label className="adm-label" htmlFor="bn-subtitle">Subtitle</label>
          <input
            id="bn-subtitle"
            className="adm-input"
            value={form.subtitle}
            onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
            placeholder="Optional supporting line"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="adm-label" htmlFor="bn-placement">Placement</label>
            <select
              id="bn-placement"
              className="adm-select"
              value={form.placement}
              onChange={(e) => setForm((f) => ({ ...f, placement: e.target.value }))}
            >
              {PLACEMENTS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <label className="adm-label" htmlFor="bn-align">Text align</label>
            <select
              id="bn-align"
              className="adm-select"
              value={form.text_align}
              onChange={(e) => setForm((f) => ({ ...f, text_align: e.target.value }))}
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>
        </div>

        <div className="adm-divider pt-1">
          <ImagePicker
            label="Desktop image"
            bucket="banner-images"
            value={form.image_url}
            onChange={(url) => setForm((f) => ({ ...f, image_url: url }))}
            help="Wide crop for large screens."
          />
        </div>

        <ImagePicker
          label="Mobile image"
          bucket="banner-images"
          value={form.mobile_image_url}
          onChange={(url) => setForm((f) => ({ ...f, mobile_image_url: url }))}
          help="Taller crop for phones. Falls back to the desktop image when empty."
          aspect="aspect-[4/5]"
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="adm-label" htmlFor="bn-cta">CTA label</label>
            <input
              id="bn-cta"
              className="adm-input"
              value={form.cta_label}
              onChange={(e) => setForm((f) => ({ ...f, cta_label: e.target.value }))}
            />
          </div>
          <div>
            <label className="adm-label" htmlFor="bn-cta-link">CTA link</label>
            <input
              id="bn-cta-link"
              className="adm-input"
              value={form.cta_link}
              onChange={(e) => setForm((f) => ({ ...f, cta_link: e.target.value }))}
              placeholder="/shop"
            />
          </div>
          <div>
            <label className="adm-label" htmlFor="bn-cta2">Second CTA label</label>
            <input
              id="bn-cta2"
              className="adm-input"
              value={form.secondary_cta_label}
              onChange={(e) => setForm((f) => ({ ...f, secondary_cta_label: e.target.value }))}
              placeholder="Optional"
            />
          </div>
          <div>
            <label className="adm-label" htmlFor="bn-cta2-link">Second CTA link</label>
            <input
              id="bn-cta2-link"
              className="adm-input"
              value={form.secondary_cta_link}
              onChange={(e) => setForm((f) => ({ ...f, secondary_cta_link: e.target.value }))}
              placeholder="Optional"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="adm-label" htmlFor="bn-position">Position</label>
            <input
              id="bn-position"
              type="number"
              min="0"
              className="adm-input"
              value={form.position}
              onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
            />
          </div>
          <div>
            <label className="adm-label" htmlFor="bn-accent">Accent</label>
            <input
              id="bn-accent"
              type="color"
              className="adm-input h-[2.625rem] cursor-pointer !p-1.5"
              value={form.accent_color}
              onChange={(e) => setForm((f) => ({ ...f, accent_color: e.target.value }))}
            />
          </div>
          <div>
            <label className="adm-label" htmlFor="bn-active">Status</label>
            <select
              id="bn-active"
              className="adm-select"
              value={form.is_active ? 'yes' : 'no'}
              onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.value === 'yes' }))}
            >
              <option value="yes">Active</option>
              <option value="no">Off</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="adm-label" htmlFor="bn-start">Starts</label>
            <input
              id="bn-start"
              type="datetime-local"
              className="adm-input"
              value={form.starts_at}
              onChange={(e) => setForm((f) => ({ ...f, starts_at: e.target.value }))}
            />
          </div>
          <div>
            <label className="adm-label" htmlFor="bn-end">Ends</label>
            <input
              id="bn-end"
              type="datetime-local"
              className="adm-input"
              value={form.ends_at}
              onChange={(e) => setForm((f) => ({ ...f, ends_at: e.target.value }))}
            />
          </div>
        </div>
      </FormModal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this banner?"
        body={`“${pendingDelete?.title ?? ''}” will stop rendering immediately.`}
        confirmLabel="Delete banner"
        busy={busy}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  )
}
