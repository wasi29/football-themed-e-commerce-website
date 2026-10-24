import { SITE } from './config'

/** 2490 -> "৳2,490" */
export function formatPrice(amount) {
  if (amount == null) return `${SITE.currencySymbol}0`
  return `${SITE.currencySymbol}${Number(amount).toLocaleString('en-BD')}`
}

/** Compact display for dense card grids: 2490 -> "৳2.5k" */
export function formatCompactPrice(amount) {
  if (amount == null) return ''
  const n = Number(amount)
  if (n >= 1000) return `${SITE.currencySymbol}${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`
  return `${SITE.currencySymbol}${n}`
}

/** Discount off => 35, else null. */
export function discountPercent(basePrice, salePrice) {
  if (!salePrice || !basePrice || salePrice >= basePrice) return null
  return Math.round(((basePrice - salePrice) / basePrice) * 100)
}

/** Renders a rating as 4.5, tolerating null/0. */
export function formatRating(value) {
  const n = Number(value ?? 0)
  return n > 0 ? n.toFixed(1) : '0.0'
}

/** 0..1 float -> "68%" width string for the rating bar. */
export function percentOf(count, total) {
  if (!total) return '0%'
  return `${Math.round((count / total) * 100)}%`
}

/** "2026-09-14T10:22:00Z" -> "14 September 2026" */
export function formatDate(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

/** -> "14 Sep 2026, 4:22 pm" */
export function formatDateTime(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  })
}

/** Human "3 days ago" for review lists. */
export function timeAgo(value) {
  if (!value) return ''
  const then = new Date(value).getTime()
  if (Number.isNaN(then)) return ''
  const seconds = Math.floor((Date.now() - then) / 1000)
  const units = [
    ['year', 31536000], ['month', 2592000], ['week', 604800],
    ['day', 86400], ['hour', 3600], ['minute', 60],
  ]
  for (const [name, secs] of units) {
    const count = Math.floor(seconds / secs)
    if (count >= 1) return `${count} ${name}${count > 1 ? 's' : ''} ago`
  }
  return 'just now'
}

/** Trim + collapse whitespace. Truncates with an ellipsis past `max`. */
export function truncate(text, max = 160) {
  if (!text) return ''
  const clean = String(text).replace(/\s+/g, ' ').trim()
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean
}

/** Turn a title into a URL slug. */
export function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

/** Initials for the account avatar fallback. "Rakib Hasan" -> "RH" */
export function initials(name) {
  if (!name) return 'FT'
  return String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('') || 'FT'
}

/** Mask a phone number for order summaries: 01712345678 -> 0171******78 */
export function maskPhone(phone) {
  const digits = String(phone ?? '').replace(/\D/g, '')
  if (digits.length < 8) return phone ?? ''
  return `${digits.slice(0, 4)}******${digits.slice(-2)}`
}

/** Whitespace/case-insensitive contains, for client-side search. */
export function matchesText(haystack, needle) {
  if (!needle) return true
  return String(haystack ?? '').toLowerCase().includes(String(needle).toLowerCase().trim())
}

/** Build a wa.me deep link with a prefilled message. */
export function whatsappLink(number, message = '') {
  const digits = String(number ?? '').replace(/\D/g, '')
  const text = message ? `?text=${encodeURIComponent(message)}` : ''
  return `https://wa.me/${digits}${text}`
}
