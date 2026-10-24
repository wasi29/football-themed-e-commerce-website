import Icon from './Icon'

/** Grey placeholder block with an optional shimmer animation. */
export function Skeleton({ className = '', shimmer = true }) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-ink-100 ${shimmer ? 'animate-shimmer' : ''} ${className}`}
    />
  )
}

/** Matches the ProductCard footprint so grids do not jump on load. */
export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="aspect-[4/5] w-full" />
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-5 w-28" />
    </div>
  )
}

export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-5 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }, (_, i) => <ProductCardSkeleton key={i} />)}
    </div>
  )
}

/** Full-width empty / error state. */
export function EmptyState({ icon = 'package', title, message, action, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center px-6 py-20 text-center ${className}`}>
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-ink-100 text-ink-600">
        <Icon name={icon} size={30} />
      </div>
      <h3 className="heading-md mb-2 text-ink-900">{title}</h3>
      {message && (
        <p className="mx-auto max-w-md text-sm leading-relaxed text-ink-600/90">{message}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

/** Simple numbered pagination. */
export function Pagination({ page, totalPages, onChange, className = '' }) {
  if (!totalPages || totalPages <= 1) return null

  // Window of pages around the current one, with first/last always visible.
  const pages = []
  const window = 1
  for (let i = 1; i <= totalPages; i += 1) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= window) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…')
    }
  }

  const btn =
    'flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-semibold transition-colors focus-ring'

  return (
    <nav className={`flex items-center justify-center gap-1.5 ${className}`} aria-label="Pagination">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className={`${btn} border border-ink-200 text-ink-900 hover:border-ink-950 disabled:opacity-40`}
        aria-label="Previous page"
      >
        <Icon name="chevronLeft" size={16} />
      </button>

      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`gap-${i}`} className="px-1 text-ink-600/60">…</span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-current={p === page ? 'page' : undefined}
            className={`${btn} ${
              p === page
                ? 'bg-ink-950 text-white'
                : 'border border-ink-200 text-ink-900 hover:border-ink-950'
            }`}
          >
            {p}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className={`${btn} border border-ink-200 text-ink-900 hover:border-ink-950 disabled:opacity-40`}
        aria-label="Next page"
      >
        <Icon name="chevronRight" size={16} />
      </button>
    </nav>
  )
}
