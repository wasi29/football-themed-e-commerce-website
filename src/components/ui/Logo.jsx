/**
 * FootballTrix wordmark.
 *
 * Original design: a shield holding a chevron, sitting beside the wordmark.
 * `tone="light"` renders for dark backgrounds. `compact` drops the wordmark and
 * keeps only the shield (used in tight mobile headers).
 */
export default function Logo({ tone = 'dark', compact = false, className = '' }) {
  const text = tone === 'light' ? 'text-white' : 'text-ink-950'
  const muted = tone === 'light' ? 'text-white/55' : 'text-ink-600'

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width="34"
        height="38"
        viewBox="0 0 34 38"
        fill="none"
        className="shrink-0"
        aria-hidden="true"
      >
        {/* Shield body */}
        <path
          d="M17 1.5L32 6v14.2c0 8.1-6 13.9-15 16.3C8 34.1 2 28.3 2 20.2V6L17 1.5z"
          className={tone === 'light' ? 'fill-lime-accent' : 'fill-ink-950'}
        />
        {/* Twin chevron — the "Trix" mark */}
        <path
          d="M9.5 13.5L17 20l7.5-6.5"
          stroke={tone === 'light' ? '#0B1220' : '#C8FF3D'}
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9.5 20L17 26.5 24.5 20"
          stroke={tone === 'light' ? '#0B1220' : '#C8FF3D'}
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.55"
        />
      </svg>

      {!compact && (
        <span className="flex flex-col leading-none">
          <span className={`font-display text-[22px] font-extrabold uppercase tracking-tight ${text}`}>
            Football<span className="text-lime-dark">Trix</span>
          </span>
          <span className={`mt-0.5 text-[8.5px] font-bold uppercase tracking-[0.28em] ${muted}`}>
            Wear Your Passion
          </span>
        </span>
      )}
    </span>
  )
}
