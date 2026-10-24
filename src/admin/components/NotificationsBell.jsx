import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import { adminNotifications } from '../../lib/adminApi'

const TYPE_META = {
  new_order: { icon: 'cart', tone: 'text-lime-accent bg-lime-accent/12' },
  low_stock: { icon: 'alert', tone: 'text-amber-300 bg-amber-400/15' },
  out_of_stock: { icon: 'alert', tone: 'text-rose-300 bg-rose-400/15' },
  new_customer: { icon: 'users', tone: 'text-sky-300 bg-sky-400/15' },
  new_review: { icon: 'star', tone: 'text-emerald-300 bg-emerald-400/15' },
}

function relativeTime(iso) {
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

/**
 * The bell in the admin topbar.
 *
 * Alerts come from database triggers (an order, a registration, a review, a
 * variant dropping to low stock), so they arrive whether or not this panel was
 * open at the time — the subscription here only refreshes the list in place.
 */
export default function NotificationsBell() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [unread, setUnread] = useState(0)
  const wrapRef = useRef(null)

  const refresh = useCallback(async () => {
    const result = await adminNotifications.list({ limit: 30 })
    setItems(result.data ?? [])
    setUnread(result.unread ?? 0)
  }, [])

  useEffect(() => {
    refresh()
    return adminNotifications.subscribe(() => refresh())
  }, [refresh])

  // Close on outside click or Escape so the dropdown never traps the admin.
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

  async function handleOpenItem(item) {
    setOpen(false)
    if (!item.is_read) {
      await adminNotifications.markRead(item.id)
      refresh()
    }
    if (item.link) navigate(item.link)
  }

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={unread ? `${unread} unread notifications` : 'Notifications'}
        aria-expanded={open}
        className="adm-icon-btn relative"
      >
        <Icon name="bell" size={18} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-flame px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-xl dark:border-ink-800 dark:bg-ink-900"
        >
          <div className="flex items-center justify-between border-b border-ink-200 px-4 py-3 dark:border-ink-800">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-500 dark:text-ink-400">
              Notifications
            </p>
            {unread > 0 && (
              <button
                type="button"
                onClick={async () => {
                  await adminNotifications.markAllRead()
                  refresh()
                }}
                className="text-xs font-semibold text-ink-950 underline-offset-4 hover:underline dark:text-lime-accent"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[22rem] overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Icon name="bell" size={22} className="mx-auto text-ink-500" />
                <p className="mt-2 text-sm text-ink-600 dark:text-ink-400">
                  Nothing to review yet.
                </p>
                <p className="mt-1 text-xs text-ink-500 dark:text-ink-500">
                  Orders, new accounts and stock alerts land here.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-ink-100 dark:divide-ink-800">
                {items.map((item) => {
                  const meta = TYPE_META[item.type] ?? { icon: 'bell', tone: 'text-ink-500 bg-ink-100 dark:bg-ink-800' }
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => handleOpenItem(item)}
                        className={`flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-ink-50 dark:hover:bg-ink-800/60 ${
                          item.is_read ? 'opacity-60' : ''
                        }`}
                      >
                        <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${meta.tone}`}>
                          <Icon name={meta.icon} size={15} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-ink-900 dark:text-white">
                            {item.title}
                          </span>
                          {item.body && (
                            <span className="mt-0.5 block truncate text-xs text-ink-600 dark:text-ink-400">
                              {item.body}
                            </span>
                          )}
                          <span className="mt-1 block text-[11px] text-ink-500 dark:text-ink-500">
                            {relativeTime(item.created_at)}
                          </span>
                        </span>
                        {!item.is_read && (
                          <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-lime-accent" />
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {items.some((i) => i.is_read) && (
            <button
              type="button"
              onClick={async () => {
                await adminNotifications.clearRead()
                refresh()
              }}
              className="w-full border-t border-ink-200 px-4 py-2.5 text-xs font-semibold text-ink-600 transition-colors hover:bg-ink-50 dark:border-ink-800 dark:text-ink-400 dark:hover:bg-ink-800"
            >
              Clear read notifications
            </button>
          )}
        </div>
      )}
    </div>
  )
}
