import { Link } from 'react-router-dom'
import Icon from '../ui/Icon'

/** Breadcrumb trail. Pass `items` as [{label, to}] — the last one is current. */
export function Breadcrumbs({ items = [], light = false, className = '' }) {
  if (items.length === 0) return null

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className={`flex flex-wrap items-center gap-1.5 text-xs ${light ? 'text-white/60' : 'text-ink-600/85'}`}>
        <li>
          <Link
            to="/"
            className={`transition-colors ${light ? 'hover:text-lime-accent' : 'hover:text-ink-950'}`}
          >
            Home
          </Link>
        </li>
        {items.map((item, i) => {
          const isLast = i === items.length - 1
          return (
            <li key={`${item.label}-${i}`} className="flex items-center gap-1.5">
              <Icon name="chevronRight" size={12} className="opacity-40" />
              {item.to && !isLast ? (
                <Link
                  to={item.to}
                  className={`transition-colors ${light ? 'hover:text-lime-accent' : 'hover:text-ink-950'}`}
                >
                  {item.label}
                </Link>
              ) : (
                <span className={`font-semibold ${light ? 'text-white' : 'text-ink-950'}`} aria-current="page">
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

/** Standard page banner used by Shop, Category, About, Contact, FAQ. */
export function PageHeader({ eyebrow, title, lede, breadcrumbs, children, className = '' }) {
  return (
    <header className={`border-b border-ink-200/70 bg-ink-50 ${className}`}>
      <div className="container-x py-9 sm:py-12">
        {breadcrumbs && <Breadcrumbs items={breadcrumbs} className="mb-5" />}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            {eyebrow && (
              <span className="eyebrow mb-3">
                <span className="h-px w-7 bg-ink-950" />
                {eyebrow}
              </span>
            )}
            <h1 className="heading-lg text-ink-950">{title}</h1>
            {lede && <p className="mt-3.5 text-sm leading-relaxed text-ink-600/95 sm:text-base">{lede}</p>}
          </div>
          {children}
        </div>
      </div>
    </header>
  )
}

/** Small trust strip shown under page headers. */
export function TrustStrip({ items, light = false, className = '' }) {
  const defaults = [
    { icon: 'truck', text: 'Delivery in 64 districts' },
    { icon: 'shield2', text: 'Cash on delivery' },
    { icon: 'refresh', text: '7-day exchange' },
    { icon: 'whatsapp', text: 'WhatsApp support' },
  ]
  const list = items ?? defaults

  return (
    <div className={`flex flex-wrap items-center gap-x-6 gap-y-2.5 ${className}`}>
      {list.map((item) => (
        <span
          key={item.text}
          className={`flex items-center gap-2 text-xs font-semibold ${
            light ? 'text-white/70' : 'text-ink-700'
          }`}
        >
          <Icon name={item.icon} size={15} className={light ? 'text-lime-accent' : 'text-lime-dark'} />
          {item.text}
        </span>
      ))}
    </div>
  )
}
