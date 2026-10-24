import { useCallback, useEffect, useState } from 'react'
import Icon from '../components/ui/Icon'
import FormModal from './components/FormModal'
import { ConfirmDialog, EmptyState, ErrorState, LoadingState, PageHeader, Toast } from './components/Page'
import { adminHomepage } from '../lib/adminApi'

/**
 * Homepage section order and visibility.
 *
 * Each row is a section the storefront asks for by `key` (hero, featured grid,
 * category strip…). Turning one off hides it without deleting its config, and
 * the arrows persist a new `position` sequence the homepage reads on its next
 * load.
 *
 * `config` is edited as JSON on purpose: it is a free-form object whose shape
 * belongs to each section, and a bespoke form for every key would be more
 * code than the values it protects.
 */
export default function AdminHomepage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [editing, setEditing] = useState(null)
  const [configText, setConfigText] = useState('{}')
  const [configError, setConfigError] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const result = await adminHomepage.list()
    if (result.error) setError(result.error)
    else setRows(result.data)
    setLoading(false)
  }, [])

  useEffect(() => {
    document.title = 'Homepage — FootballTrix Admin'
    load()
  }, [load])

  async function toggle(row) {
    setBusyId(row.id)
    const result = await adminHomepage.save({ id: row.id, is_enabled: !row.is_enabled })
    setBusyId(null)
    if (result.error) setToast({ tone: 'error', text: result.error.message })
    else {
      setToast({ tone: 'ok', text: `“${row.title || row.key}” ${!row.is_enabled ? 'enabled' : 'hidden'}.` })
      load()
    }
  }

  async function move(index, direction) {
    const next = [...rows]
    const target = index + direction
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]

    // Optimistic: swap locally so the row moves immediately, then persist.
    setRows(next)
    setBusyId(next[target].id)
    const result = await adminHomepage.reorder(next.map((row, i) => ({ id: row.id, position: i })))
    setBusyId(null)
    if (result.error) {
      setToast({ tone: 'error', text: result.error.message })
      load()
    }
  }

  function openEdit(row) {
    setEditing(row)
    setConfigText(JSON.stringify(row.config ?? {}, null, 2))
    setConfigError(null)
  }

  async function submitConfig() {
    let parsed
    try {
      parsed = JSON.parse(configText)
    } catch (err) {
      setConfigError(`That is not valid JSON: ${err.message}`)
      return
    }
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      setConfigError('The config must be a JSON object, like { "limit": 8 }.')
      return
    }

    setBusyId(editing.id)
    const result = await adminHomepage.save({ id: editing.id, config: parsed })
    setBusyId(null)
    if (result.error) {
      setToast({ tone: 'error', text: result.error.message })
      return
    }
    setToast({ tone: 'ok', text: `Configuration for “${editing.title || editing.key}” saved.` })
    setEditing(null)
    load()
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    setBusyId(pendingDelete.id)
    const result = await adminHomepage.remove(pendingDelete.id)
    setBusyId(null)
    setPendingDelete(null)
    if (result.error) setToast({ tone: 'error', text: result.error.message })
    else {
      setToast({ tone: 'ok', text: `“${pendingDelete.title || pendingDelete.key}” removed.` })
      load()
    }
  }

  return (
    <>
      <PageHeader
        title="Homepage"
        lede="Order and toggle the sections the storefront renders on its front page."
      />

      <Toast tone={toast?.tone} onDismiss={() => setToast(null)}>{toast?.text}</Toast>

      {loading ? (
        <LoadingState label="Loading homepage sections…" />
      ) : error ? (
        <ErrorState error={error} onRetry={load} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon="list"
          title="No homepage sections"
          hint="Run the seed in supabase/seed.sql to create the default section set."
        />
      ) : (
        <div className="adm-card overflow-hidden">
          <ul className="divide-y divide-ink-100 dark:divide-ink-800">
            {rows.map((row, index) => (
              <li key={row.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      aria-label={`Move ${row.title || row.key} up`}
                      disabled={index === 0 || busyId === row.id}
                      onClick={() => move(index, -1)}
                      className="adm-icon-btn !h-7 !w-7 disabled:opacity-30"
                    >
                      <Icon name="chevronUp" size={14} />
                    </button>
                    <button
                      type="button"
                      aria-label={`Move ${row.title || row.key} down`}
                      disabled={index === rows.length - 1 || busyId === row.id}
                      onClick={() => move(index, 1)}
                      className="adm-icon-btn !h-7 !w-7 disabled:opacity-30"
                    >
                      <Icon name="chevronDown" size={14} />
                    </button>
                  </div>
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-100 font-display text-lg font-extrabold text-ink-500 dark:bg-ink-800 dark:text-ink-300">
                    {index + 1}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-ink-950 dark:text-white">
                      {row.title || row.key}
                    </span>
                    <span className="adm-badge adm-badge-neutral font-mono">{row.key}</span>
                    <span className={`adm-badge ${row.is_enabled ? 'adm-badge-ok' : 'adm-badge-neutral'}`}>
                      {row.is_enabled ? 'Visible' : 'Hidden'}
                    </span>
                  </div>
                  {row.subtitle && (
                    <p className="mt-1 truncate text-sm text-ink-600 dark:text-ink-400">{row.subtitle}</p>
                  )}
                </div>

                <div className="flex shrink-0 flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEdit(row)}
                    className="adm-btn-outline !px-3 !py-2 !text-xs"
                  >
                    <Icon name="settings" size={14} />
                    Config
                  </button>
                  <button
                    type="button"
                    onClick={() => toggle(row)}
                    disabled={busyId === row.id}
                    className="adm-btn-outline !px-3 !py-2 !text-xs"
                  >
                    {row.is_enabled ? 'Hide' : 'Show'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDelete(row)}
                    className="adm-btn-danger !px-3 !py-2 !text-xs"
                  >
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <FormModal
        open={Boolean(editing)}
        title={editing ? (editing.title || editing.key) : ''}
        subtitle={`Configuration for the “${editing?.key ?? ''}” section`}
        onClose={() => setEditing(null)}
        onSubmit={submitConfig}
        busy={busyId === editing?.id}
        submitLabel="Save configuration"
      >
        <div>
          <label className="adm-label" htmlFor="hp-config">Config (JSON)</label>
          <textarea
            id="hp-config"
            className="adm-textarea min-h-56 font-mono text-xs"
            value={configText}
            onChange={(e) => { setConfigText(e.target.value); setConfigError(null) }}
            spellCheck={false}
          />
          {configError ? (
            <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
              {configError}
            </p>
          ) : (
            <p className="mt-2 text-xs text-ink-500 dark:text-ink-400">
              Must be a JSON object. The storefront reads these keys to decide how many items to
              show and which collections to pull from.
            </p>
          )}
        </div>
      </FormModal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Remove this section?"
        body={`“${pendingDelete?.title || pendingDelete?.key || ''}” will disappear from the homepage. You can re-run the seed to restore the defaults.`}
        confirmLabel="Remove section"
        busy={busyId === pendingDelete?.id}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  )
}
