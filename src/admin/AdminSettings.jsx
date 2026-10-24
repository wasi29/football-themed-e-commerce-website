import { useCallback, useEffect, useMemo, useState } from 'react'
import Icon from '../components/ui/Icon'
import { ErrorState, LoadingState, PageHeader, Toast } from './components/Page'
import { adminSettings } from '../lib/adminApi'

/** Group labels ordered the way an admin thinks about them. */
const GROUP_ORDER = ['general', 'branding', 'contact', 'delivery', 'payment', 'social', 'seo', 'policy']
const GROUP_LABEL = {
  general: 'General',
  branding: 'Brand',
  contact: 'Contact',
  delivery: 'Delivery',
  payment: 'Payment',
  social: 'Social links',
  seo: 'SEO',
  policy: 'Policies',
  notifications: 'Notifications',
}

function humanise(key) {
  return key.replace(/[._]/g, ' ').replace(/^./, (c) => c.toUpperCase())
}

/**
 * Website settings.
 *
 * Values are stored as JSON in one `settings` table rather than as columns, so
 * adding a setting never needs a migration. The editor picks a control from
 * the value's type: a string is a text field, a number is a number field, a
 * boolean is a switch and anything else is JSON the admin edits directly.
 */
export default function AdminSettings() {
  const [rows, setRows] = useState([])
  const [drafts, setDrafts] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busyKey, setBusyKey] = useState(null)
  const [toast, setToast] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const result = await adminSettings.list()
    if (result.error) setError(result.error)
    else {
      setRows(result.data)
      setDrafts(Object.fromEntries(result.data.map((r) => [r.key, r.value])))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    document.title = 'Website settings — FootballTrix Admin'
    load()
  }, [load])

  const groups = useMemo(() => {
    const buckets = new Map()
    for (const row of rows) {
      const group = row.group_name || 'general'
      if (!buckets.has(group)) buckets.set(group, [])
      buckets.get(group).push(row)
    }
    const ordered = [...buckets.entries()].sort(([a], [b]) => {
      const ia = GROUP_ORDER.indexOf(a)
      const ib = GROUP_ORDER.indexOf(b)
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
    })
    return ordered
  }, [rows])

  function isDirty(row) {
    return JSON.stringify(drafts[row.key]) !== JSON.stringify(row.value)
  }

  async function save(row) {
    const value = drafts[row.key]
    setBusyKey(row.key)
    const result = await adminSettings.save(row.key, value)
    setBusyKey(null)
    if (result.error) {
      setToast({ tone: 'error', text: `${row.label ?? row.key}: ${result.error.message}` })
      return
    }
    setToast({ tone: 'ok', text: `${row.label ?? humanise(row.key)} saved.` })
    load()
  }

  function renderControl(row) {
    const value = drafts[row.key]
    const setValue = (next) => setDrafts((d) => ({ ...d, [row.key]: next }))
    const id = `setting-${row.key.replace(/[^a-z0-9]+/gi, '-')}`

    if (typeof value === 'boolean') {
      return (
        <select
          id={id}
          className="adm-select max-w-[12rem]"
          value={value ? 'yes' : 'no'}
          onChange={(e) => setValue(e.target.value === 'yes')}
        >
          <option value="yes">Enabled</option>
          <option value="no">Disabled</option>
        </select>
      )
    }

    if (typeof value === 'number') {
      return (
        <input
          id={id}
          type="number"
          className="adm-input max-w-[12rem] tabular-nums"
          value={Number.isFinite(value) ? value : ''}
          onChange={(e) => setValue(e.target.value === '' ? '' : Number(e.target.value))}
        />
      )
    }

    if (typeof value === 'string') {
      const looksLong = value.length > 60 || row.key.includes('description') || row.key.includes('body')
      if (looksLong) {
        return (
          <textarea
            id={id}
            className="adm-textarea"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        )
      }
      return (
        <input
          id={id}
          type={row.key.includes('email') ? 'email' : row.key.includes('phone') ? 'tel' : 'text'}
          className="adm-input max-w-md"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      )
    }

    // Objects and arrays (SEO blocks, JSON policy documents, colour maps).
    return (
      <textarea
        id={id}
        className="adm-textarea font-mono text-xs"
        value={JSON.stringify(value ?? {}, null, 2)}
        onChange={(e) => {
          try {
            setValue(JSON.parse(e.target.value))
          } catch {
            // Keep the raw text out of state so invalid JSON cannot be saved;
            // the error appears only when Save is pressed.
            setValue(e.target.value)
          }
        }}
        spellCheck={false}
      />
    )
  }

  if (loading) return <LoadingState label="Loading settings…" />
  if (error) return <ErrorState error={error} onRetry={load} />

  return (
    <>
      <PageHeader
        title="Website settings"
        lede="Store identity, delivery fees, contact details, social links and SEO. Changes apply to the storefront immediately."
      />

      <Toast tone={toast?.tone} onDismiss={() => setToast(null)}>{toast?.text}</Toast>

      {rows.length === 0 ? (
        <div className="adm-card adm-card-pad py-12 text-center">
          <Icon name="settings" size={24} className="mx-auto text-ink-500" />
          <p className="mt-3 text-sm font-bold text-ink-950 dark:text-white">No settings found</p>
          <p className="mt-1.5 text-sm text-ink-600 dark:text-ink-400">
            Run <code className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-xs dark:bg-ink-800">seed.sql</code> against
            the Supabase project to create the defaults.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(([group, items]) => (
            <section key={group} className="adm-card overflow-hidden">
              <div className="border-b border-ink-200 bg-ink-50/70 px-5 py-3.5 dark:border-ink-800 dark:bg-ink-800/50">
                <h2 className="adm-card-title">{GROUP_LABEL[group] ?? humanise(group)}</h2>
              </div>

              <div className="divide-y divide-ink-100 dark:divide-ink-800">
                {items.map((row) => {
                  const dirty = isDirty(row)
                  const invalid = typeof drafts[row.key] === 'string' && drafts[row.key].trim().startsWith('{')
                  return (
                    <div key={row.key} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="sm:max-w-[16rem]">
                        <label
                          htmlFor={`setting-${row.key.replace(/[^a-z0-9]+/gi, '-')}`}
                          className="text-sm font-bold text-ink-950 dark:text-white"
                        >
                          {row.label ?? humanise(row.key)}
                        </label>
                        <p className="mt-0.5 font-mono text-[11px] text-ink-500">{row.key}</p>
                      </div>

                      <div className="flex flex-1 flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
                        <div className="w-full sm:max-w-md">{renderControl(row)}</div>
                        <button
                          type="button"
                          onClick={() => save(row)}
                          disabled={busyKey === row.key || !dirty || invalid}
                          className={`adm-btn shrink-0 !px-3.5 !py-2 !text-xs ${
                            dirty && !invalid
                              ? 'bg-ink-950 text-white hover:bg-ink-800 dark:bg-lime-accent dark:text-ink-950'
                              : 'bg-ink-100 text-ink-400 dark:bg-ink-800'
                          }`}
                        >
                          {busyKey === row.key ? 'Saving…' : dirty ? 'Save' : 'Saved'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  )
}
