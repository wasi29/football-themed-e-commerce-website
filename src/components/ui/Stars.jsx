import Icon from './Icon'

/**
 * Star rating. `size` in px, `showValue` appends the numeric score.
 * Half stars are rendered with a clipped overlay so 4.5 reads correctly.
 */
export default function Stars({ value = 0, count, size = 14, showValue = false, className = '' }) {
  const rating = Number(value) || 0
  const pct = Math.max(0, Math.min(100, (rating / 5) * 100))

  return (
    <div className={`flex items-center gap-1.5 ${className}`} aria-label={`Rated ${rating} out of 5`}>
      <div className="relative inline-flex" role="img">
        {/* empty track */}
        <div className="flex gap-0.5 text-ink-200">
          {[0, 1, 2, 3, 4].map((i) => (
            <Icon key={i} name="star" size={size} filled strokeWidth={0} />
          ))}
        </div>
        {/* filled overlay, clipped to the score */}
        <div
          className="absolute inset-0 flex gap-0.5 overflow-hidden text-amber-400"
          style={{ width: `${pct}%` }}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <Icon key={i} name="star" size={size} filled strokeWidth={0} className="shrink-0" />
          ))}
        </div>
      </div>

      {showValue && (
        <span className="text-xs font-semibold text-ink-700">
          {rating.toFixed(1)}
          {count != null && <span className="font-normal text-ink-600/70"> ({count})</span>}
        </span>
      )}
    </div>
  )
}

/**
 * Rating distribution histogram for the product page.
 * @param {{counts: Record<number, number>}} props
 */
export function RatingBars({ counts = {}, total = 0, className = '' }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {[5, 4, 3, 2, 1].map((star) => {
        const count = counts[star] ?? 0
        const pct = total ? Math.round((count / total) * 100) : 0
        return (
          <div key={star} className="flex items-center gap-2 text-xs">
            <span className="w-6 shrink-0 font-medium text-ink-700">{star}★</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-100">
              <div
                className="h-full rounded-full bg-amber-400 transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-8 shrink-0 text-right tabular-nums text-ink-600/80">{count}</span>
          </div>
        )
      })}
    </div>
  )
}
