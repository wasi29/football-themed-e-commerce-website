import { Link } from 'react-router-dom'
import Icon from '../ui/Icon'

/**
 * Section heading with an eyebrow, title, optional lede and link.
 * `align` controls horizontal placement; `light` is for dark sections.
 */
export default function SectionHeading({
  eyebrow,
  title,
  lede,
  action,
  align = 'left',
  light = false,
  className = '',
}) {
  const alignment =
    align === 'center' ? 'items-center text-center mx-auto' : 'items-start text-left'

  return (
    <div
      className={`mb-9 flex flex-col gap-5 sm:mb-12 ${
        align === 'center' ? 'sm:flex-row sm:justify-center' : ''
      } ${className}`}
    >
      <div className={`flex max-w-2xl flex-col ${alignment}`}>
        {eyebrow && (
          <span className={`eyebrow mb-3 ${light ? 'text-lime-accent' : ''}`}>
            <span className={`h-px w-7 ${light ? 'bg-lime-accent' : 'bg-ink-950'}`} />
            {eyebrow}
          </span>
        )}

        <h2 className={`heading-lg ${light ? 'text-white' : 'text-ink-950'}`}>{title}</h2>

        {lede && (
          <p className={`mt-3.5 text-sm leading-relaxed sm:text-base ${light ? 'text-white/65' : 'text-ink-600/95'}`}>
            {lede}
          </p>
        )}
      </div>

      {action && (
        <div className={`shrink-0 ${align === 'center' ? 'sm:ml-auto' : 'sm:ml-auto'}`}>{action}</div>
      )}
    </div>
  )
}

/** "See all" pill used in most section footers. */
export function SeeAllLink({ to, label = 'See all', light = false }) {
  return (
    <Link
      to={to}
      className={`group inline-flex items-center gap-2 rounded-full border-2 px-5 py-2.5 text-sm font-semibold transition-all ${
        light
          ? 'border-white/25 text-white hover:border-lime-accent hover:bg-lime-accent hover:text-ink-950'
          : 'border-ink-200 text-ink-900 hover:border-ink-950'
      }`}
    >
      {label}
      <Icon
        name="arrowRight"
        size={16}
        className="transition-transform group-hover:translate-x-0.5"
      />
    </Link>
  )
}

/** Small pill filter row used above product grids. */
export function FilterPills({ options, value, onChange, className = '' }) {
  return (
    <div className={`-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar sm:mx-0 sm:flex-wrap sm:px-0 ${className}`}>
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold transition-colors focus-ring ${
              active
                ? 'bg-ink-950 text-white'
                : 'border border-ink-200 bg-white text-ink-700 hover:border-ink-950'
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
