import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import { adminSearch } from '../../lib/adminApi'

const SECTIONS = [
  { key: 'products', label: 'Products', icon: 'package', path: (row) => `/admin/products/${row.id}/edit` },
  { key: 'orders', label: 'Orders', icon: 'cart', path: (row) => `/admin/orders/${row.id}` },
  { key: 'customers', label: 'Customers', icon: 'users', path: (row) => `/admin/customers/${row.id}` },
  { key: 'reviews', label: 'Reviews', icon: 'star', path: () => '/admin/reviews' },
]

function title(row, key) {
  if (key === 'products') return row.name
  if (key === 'orders') return `${row.order_number} — ${row.customer_name}`
  if (key === 'customers') return row.full_name || row.email
  return `${row.rating}★ ${row.author_name}`
}

function subtitle(row, key) {
  if (key === 'products') return `৳${Number(row.sale_price ?? row.base_price ?? 0)}`
  if (key === 'orders') return row.status
  if (key === 'customers') return row.email
  return row.products?.name ?? 'Review'
}

/**
 * The topbar search box.
 *
 * Runs four independent lookups in parallel and renders whichever sections
 * came back non-empty. It is a navigation aid only — it never mutates data, so
 * a result can be opened safely from anywhere in the panel.
 */
export default function GlobalSearch() {
  const navigate = useNavigate()
  const [term, setTerm] = useState('')
  const [results, setResults] = useState(null)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    const trimmed = term.trim()
    if (trimmed.length < 2) {
      setResults(null)
      setBusy(false)
      return undefined
    }

    setBusy(true)
    const timer = setTimeout(async () => {
      const result = await adminSearch.all(trimmed)
      setResults(result.data)
      setBusy(false)
    }, 280)

    return () => clearTimeout(timer)
  }, [term])

  useEffect(() => {
    if (!open) return undefined
    const onPointer = (event) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) setOpen(false)
    }
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const isEmpty =
    results && SECTIONS.every((section) => (results[section.key]?.length ?? 0) === 0)

  function go(path) {
    setOpen(false)
    setTerm('')
    setResults(null)
    navigate(path)
  }

  return (
    <div className="relative w-full max-w-md" ref={wrapRef}>
      <div className="relative">
        <Icon
          name="search"
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-500 dark:text-ink-400"
        />
        <input
          type="search"
          value={term}
          onChange={(e) => { setTerm(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="Search products, orders, customers…"
          aria-label="Search the admin panel"
          className="w-full rounded-xl border border-ink-200 bg-white py-2.5 pl-9 pr-9 text-sm text-ink-900 placeholder:text-ink-600/50 transition-colors focus:border-ink-950 focus:outline-none focus:ring-2 focus:ring-ink-950/10 dark:border-ink-700 dark:bg-ink-800 dark:text-white dark:placeholder:text-ink-500 dark:focus:border-lime-accent dark:focus:ring-lime-accent/20"
        />
        {busy && (
          <Icon
            name="spinner"
            size={15}
            className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-ink-500"
          />
        )}
      </div>

      {open && term.trim().length >= 2 && results && (
        <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-xl dark:border-ink-800 dark:bg-ink-900">
          {isEmpty ? (
            <p className="px-4 py-6 text-center text-sm text-ink-600 dark:text-ink-400">
              Nothing matches “{term.trim()}”.
            </p>
          ) : (
            <div className="max-h-[24rem] overflow-y-auto py-1">
              {SECTIONS.map((section) => {
                const rows = results[section.key] ?? []
                if (!rows.length) return null
                return (
                  <div key={section.key}>
                    <p className="px-4 pb-1 pt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-ink-500 dark:text-ink-500">
                      {section.label}
                    </p>
                    <ul>
                      {rows.map((row) => (
                        <li key={`${section.key}-${row.id}`}>
                          <button
                            type="button"
                            onClick={() => go(section.path(row))}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-ink-50 dark:hover:bg-ink-800/60"
                          >
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300">
                              <Icon name={section.icon} size={15} />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold text-ink-900 dark:text-white">
                                {title(row, section.key)}
                              </span>
                              <span className="block truncate text-xs text-ink-600 dark:text-ink-400">
                                {subtitle(row, section.key)}
                              </span>
                            </span>
                            <Icon name="chevronRight" size={15} className="shrink-0 text-ink-500" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
