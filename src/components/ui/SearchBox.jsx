import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from './Icon'
import Stars from './Stars'
import JerseyGraphic from '../product/JerseyGraphic'
import { discountPercent, formatPrice, truncate } from '../../lib/format'
import { products as productsApi } from '../../lib/api'

/**
 * Header search. Debounced live results in an overlay panel; Enter goes to the
 * full /shop page with the query so results stay linkable and shareable.
 */
export default function SearchBox({ onNavigate, autoFocus = false, onClose }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  // Debounce: typing should not fire a query per keystroke.
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setResults([])
      setLoading(false)
      return undefined
    }

    setLoading(true)
    const timer = setTimeout(async () => {
      const { items } = await productsApi.list({ search: q, limit: 6 })
      setResults(items)
      setLoading(false)
    }, 250)

    return () => clearTimeout(timer)
  }, [query])

  const submit = (e) => {
    e?.preventDefault()
    const q = query.trim()
    if (!q) return
    close()
    navigate(`/shop?q=${encodeURIComponent(q)}`)
  }

  const goToProduct = (slug) => {
    close()
    navigate(`/product/${slug}`)
  }

  const close = () => {
    setQuery('')
    setResults([])
    setActiveIndex(-1)
    onClose?.()
    onNavigate?.()
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Escape') {
      close()
    } else if (e.key === 'Enter' && activeIndex >= 0 && results[activeIndex]) {
      e.preventDefault()
      goToProduct(results[activeIndex].slug)
    }
  }

  const showPanel = query.trim().length >= 2

  return (
    <div className="relative w-full">
      <form onSubmit={submit} role="search">
        <label htmlFor="ftx-search" className="sr-only">Search jerseys</label>
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-600/70">
            <Icon name="search" size={18} />
          </span>
          <input
            id="ftx-search"
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIndex(-1) }}
            onKeyDown={onKeyDown}
            placeholder="Search for a club, country or kit…"
            autoComplete="off"
            className="field rounded-full pl-11 pr-11"
            role="combobox"
            aria-expanded={showPanel}
            aria-controls="ftx-search-results"
            aria-autocomplete="list"
          />
          {query && (
            <button
              type="button"
              onClick={close}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink-600 transition-colors hover:bg-ink-100 focus-ring"
              aria-label="Clear search"
            >
              <Icon name="close" size={15} />
            </button>
          )}
        </div>
      </form>

      {showPanel && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-10 cursor-default"
            onClick={close}
            aria-hidden="true"
            tabIndex={-1}
          />
          <div
            id="ftx-search-results"
            role="listbox"
            className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 overflow-hidden rounded-2xl border border-ink-200/80 bg-white shadow-lift animate-fade"
          >
            {loading && (
              <p className="px-4 py-5 text-center text-sm text-ink-600">Searching…</p>
            )}

            {!loading && results.length === 0 && (
              <div className="px-4 py-6 text-center">
                <p className="text-sm font-semibold text-ink-900">No jerseys for “{query}”</p>
                <p className="mt-1 text-xs text-ink-600/80">
                  Try a team, country, or “custom”.
                </p>
              </div>
            )}

            {!loading && results.length > 0 && (
              <>
                <ul className="max-h-[22rem] overflow-y-auto py-1.5">
                  {results.map((p, i) => {
                    const price = p.sale_price ?? p.base_price
                    const off = discountPercent(p.base_price, p.sale_price)
                    return (
                      <li key={p.id}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={i === activeIndex}
                          onMouseEnter={() => setActiveIndex(i)}
                          onClick={() => goToProduct(p.slug)}
                          className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                            i === activeIndex ? 'bg-ink-50' : ''
                          }`}
                        >
                          <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-ink-50">
                            {p.thumbnail_url ? (
                              <img src={p.thumbnail_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <JerseyGraphic
                                seed={p.slug}
                                primary={p.primary_color}
                                secondary={p.secondary_color}
                                showNumber={false}
                                className="h-11 w-auto"
                              />
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-ink-900">
                              {p.name}
                            </span>
                            <span className="block truncate text-xs text-ink-600/80">
                              {truncate(p.short_description, 46)}
                            </span>
                          </span>
                          <span className="shrink-0 text-right">
                            <span className={`block text-sm font-bold ${off ? 'text-flame' : 'text-ink-950'}`}>
                              {formatPrice(price)}
                            </span>
                            <Stars value={p.rating_avg} size={10} />
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>

                <button
                  type="button"
                  onClick={submit}
                  className="flex w-full items-center justify-center gap-2 border-t border-ink-200/70 py-3 text-sm font-semibold text-ink-900 transition-colors hover:bg-ink-50 focus-ring"
                >
                  See all results for “{query}”
                  <Icon name="arrowRight" size={15} />
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
