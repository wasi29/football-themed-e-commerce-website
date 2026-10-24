/**
 * FootballTrix — data access layer.
 *
 * Every read goes through this module. When Supabase is configured it queries
 * Postgres; otherwise it serves the bundled demo dataset. Pages and components
 * never import `supabase` directly, so switching modes changes nothing above
 * this line.
 *
 * Writes in demo mode are simulated in memory and clearly flagged to the user,
 * because there is no server to persist them to.
 */

import { supabase, isSupabaseConfigured } from './supabase'
import {
  demoBanners, demoCategories, demoCollections, demoCoupons, demoOrders,
  demoProducts, demoReviews, demoSettings, demoTestimonials,
} from '../data/demoData'

/* ========================================================================== */
/* helpers                                                                    */
/* ========================================================================== */

const DEMO_LABEL = 'DEMO MODE'

/** Swallow a Supabase error and return `fallback` instead of throwing. */
async function safe(promise, fallback, context) {
  if (!isSupabaseConfigured) return fallback
  const { data, error } = await promise
  if (error) {
    console.warn(`[FootballTrix] ${context} failed:`, error.message)
    return fallback
  }
  return data ?? fallback
}

const num = (v, d = 0) => (v == null || v === '' ? d : Number(v))

/* -- demo order ledger ---------------------------------------------------- */

/**
 * Orders placed during this demo session.
 *
 * The confirmation page hands the customer an order number and tells them to
 * track it, so that number has to resolve. `demoOrders()` only covers the
 * pre-seeded samples, so locally placed orders are kept here and merged in.
 */
const DEMO_ORDERS_KEY = 'ftx.demo.orders.v1'

function readDemoOrders() {
  try {
    const raw = localStorage.getItem(DEMO_ORDERS_KEY)
    const rows = raw ? JSON.parse(raw) : []
    return Array.isArray(rows) ? rows : []
  } catch { return [] }
}

function writeDemoOrders(rows) {
  try { localStorage.setItem(DEMO_ORDERS_KEY, JSON.stringify(rows)) } catch { /* storage unavailable */ }
}

function allDemoOrders() {
  return [...readDemoOrders(), ...demoOrders()]
}

/** Normalise a `product_cards` view row / products row into card shape. */
function normaliseProduct(row) {
  if (!row) return null
  const rawVariants = row.variants ?? row.product_variants
  let variants = rawVariants
  if (typeof rawVariants === 'string') {
    try { variants = JSON.parse(rawVariants) } catch { variants = [] }
  }
  variants = Array.isArray(variants) ? variants : []

  return {
    ...row,
    id: row.id,
    base_price: num(row.base_price),
    sale_price: row.sale_price == null ? null : num(row.sale_price),
    rating_avg: num(row.rating_avg),
    rating_count: num(row.rating_count),
    sold_count: num(row.sold_count),
    images: Array.isArray(row.images) ? row.images : [],
    features: Array.isArray(row.features) ? row.features : [],
    tags: Array.isArray(row.tags) ? row.tags : [],
    is_on_sale: row.sale_price != null && num(row.sale_price) < num(row.base_price),
    variants: variants
      .map((v) => ({ ...v, stock: num(v.stock) }))
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
  }
}

/* ========================================================================== */
/* products                                                                   */
/* ========================================================================== */

const CARD_COLUMNS = '*, categories!products_category_id_fkey(name, slug), collections(name, slug), product_variants(id, size, color_name, color_hex, sku, price_override, stock, position, is_active)'

/** Flatten the nested {categories, collections} joins into flat card fields. */
function flattenJoined(row) {
  if (!row) return null
  const cat = Array.isArray(row.categories) ? row.categories[0] : row.categories
  const col = Array.isArray(row.collections) ? row.collections[0] : row.collections
  return {
    ...row,
    category_name: cat?.name ?? row.category_name ?? null,
    category_slug: cat?.slug ?? row.category_slug ?? null,
    collection_name: col?.name ?? row.collection_name ?? null,
    collection_slug: col?.slug ?? row.collection_slug ?? null,
  }
}

export const products = {
  /**
   * Paginated product list with filters. All filters are optional.
   * @param {object} opts
   * @param {number} [opts.page] 1-based
   * @param {number} [opts.limit]
   * @param {string} [opts.category]  category slug
   * @param {string} [opts.collection] collection slug
   * @param {string} [opts.kind] club | international | national | custom | training
   * @param {'newest'|'price-asc'|'price-desc'|'rating'|'popular'} [opts.sort]
   * @param {boolean} [opts.onSale]
   * @param {boolean} [opts.featured]
   * @param {boolean} [opts.bestSeller]
   * @param {string} [opts.search]
   */
  async list(opts = {}) {
    const {
      page = 1, limit = 12, category, collection, kind, sort = 'newest',
      onSale, featured, bestSeller, search, tag, isNew,
    } = opts

    if (!isSupabaseConfigured) {
      let rows = [...demoProducts]
      if (category) rows = rows.filter((p) => p.category_slug === category)
      if (collection) rows = rows.filter((p) => p.collection_slug === collection)
      if (kind) rows = rows.filter((p) => p.kind === kind)
      if (onSale) rows = rows.filter((p) => p.sale_price != null)
      if (isNew) rows = rows.filter((p) => p.is_new_arrival)
      if (featured) rows = rows.filter((p) => p.is_featured)
      if (bestSeller) rows = rows.filter((p) => p.is_best_seller)
      if (tag) rows = rows.filter((p) => p.tags.includes(tag))
      if (search) {
        const q = search.toLowerCase()
        rows = rows.filter((p) =>
          [p.name, p.team_name, p.short_description, p.category_name, ...p.tags]
            .filter(Boolean).join(' ').toLowerCase().includes(q))
      }

      const sorters = {
        'price-asc': (a, b) => (a.sale_price ?? a.base_price) - (b.sale_price ?? b.base_price),
        'price-desc': (a, b) => (b.sale_price ?? b.base_price) - (a.sale_price ?? a.base_price),
        rating: (a, b) => b.rating_avg - a.rating_avg,
        popular: (a, b) => b.sold_count - a.sold_count,
        newest: (a, b) => new Date(b.created_at) - new Date(a.created_at),
      }
      rows.sort(sorters[sort] ?? sorters.newest)

      const total = rows.length
      const start = (page - 1) * limit
      return {
        items: rows.slice(start, start + limit).map(normaliseProduct),
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      }
    }

    let query = supabase
      .from('products')
      .select(CARD_COLUMNS, { count: 'exact' })
      .eq('is_active', true)

    if (category) query = query.eq('categories.slug', category)
    if (collection) query = query.eq('collections.slug', collection)
    if (kind) query = query.eq('kind', kind)
    if (onSale) query = query.not('sale_price', 'is', null)
    if (isNew) query = query.eq('is_new_arrival', true)
    if (featured) query = query.eq('is_featured', true)
    if (bestSeller) query = query.eq('is_best_seller', true)
    if (tag) query = query.contains('tags', [tag])
    if (search) query = query.or(`name.ilike.%${search}%,team_name.ilike.%${search}%`)

    const orderMap = {
      newest: ['created_at', false],
      'price-asc': ['base_price', true],
      'price-desc': ['base_price', false],
      rating: ['rating_avg', false],
      popular: ['sold_count', false],
    }
    const [column, asc] = orderMap[sort] ?? orderMap.newest
    query = query.order(column, { ascending: asc, nullsFirst: false })
    query = query.range((page - 1) * limit, page * limit - 1)

    const { data, error, count } = await query
    if (error) {
      console.warn('[FootballTrix] products.list failed:', error.message)
      return { items: [], total: 0, page, limit, totalPages: 1 }
    }

    const items = (data ?? []).map((r) => normaliseProduct(flattenJoined(r)))
    const total = count ?? items.length
    return { items, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) }
  },

  /** Full product detail by slug, with reviews attached. */
  async bySlug(slug) {
    if (!isSupabaseConfigured) {
      const product = demoProducts.find((p) => p.slug === slug)
      if (!product) return null
      const normal = normaliseProduct(product)
      return {
        ...normal,
        reviews: demoReviews.filter((r) => r.product_slug === slug),
        related: demoProducts
          .filter((p) => p.slug !== slug && (p.category_slug === product.category_slug || p.kind === product.kind))
          .slice(0, 4)
          .map(normaliseProduct),
      }
    }

    const { data, error } = await supabase
      .from('products').select(CARD_COLUMNS).eq('slug', slug).maybeSingle()
    if (error || !data) return null

    const product = normaliseProduct(flattenJoined(data))

    const { data: reviews } = await supabase
      .from('reviews').select('*')
      .eq('product_id', product.id)
      .eq('is_approved', true)
      .order('created_at', { ascending: false })

    let related = []
    if (product.category_id) {
      const { data: rel } = await supabase
        .from('products').select(CARD_COLUMNS)
        .eq('category_id', product.category_id)
        .eq('is_active', true)
        .neq('id', product.id)
        .order('sold_count', { ascending: false })
        .limit(4)
      related = (rel ?? []).map((r) => normaliseProduct(flattenJoined(r)))
    }

    return { ...product, reviews: reviews ?? [], related }
  },

  /** By slug list, used to resolve cart/wishlist lines to fresh pricing. */
  async bySlugs(slugs) {
    if (!slugs.length) return []
    if (!isSupabaseConfigured) {
      return demoProducts.filter((p) => slugs.includes(p.slug)).map(normaliseProduct)
    }
    const { data } = await supabase
      .from('products').select(CARD_COLUMNS).in('slug', slugs)
    return (data ?? []).map((r) => normaliseProduct(flattenJoined(r)))
  },

  /** Total stock across all variants of a product. */
  stockOf(product) {
    if (!product?.variants?.length) return 0
    return product.variants.reduce((sum, v) => sum + num(v.stock), 0)
  },
}

/* ========================================================================== */
/* taxonomy                                                                   */
/* ========================================================================== */

export const categories = {
  async all() {
    if (!isSupabaseConfigured) return demoCategories
    const rows = await safe(
      supabase.from('categories').select('*').eq('is_active', true).order('position'),
      [],
      'categories.all',
    )
    // Attach child slugs to each parent so the nav can render a 2-level menu.
    const children = rows.filter((c) => c.parent_id)
    return rows.map((c) => ({
      ...c,
      subcategories: children.filter((k) => k.parent_id === c.id).map((k) => k.slug),
    }))
  },

  async bySlug(slug) {
    if (!isSupabaseConfigured) {
      const cat = demoCategories.find((c) => c.slug === slug)
      if (!cat) return null
      return { ...cat, subcategories: demoCategories.filter((c) => c.parent_id === cat.id).map((c) => c.slug) }
    }
    const row = await safe(
      supabase.from('categories').select('*').eq('slug', slug).maybeSingle(),
      null, 'categories.bySlug',
    )
    if (!row) return null
    const { data: kids } = await supabase
      .from('categories').select('slug').eq('parent_id', row.id).eq('is_active', true)
    return { ...row, subcategories: (kids ?? []).map((k) => k.slug) }
  },
}

export const collections = {
  async all() {
    if (!isSupabaseConfigured) return demoCollections
    return safe(
      supabase.from('collections').select('*').eq('is_active', true).order('position'),
      [], 'collections.all',
    )
  },
  async bySlug(slug) {
    if (!isSupabaseConfigured) return demoCollections.find((c) => c.slug === slug) ?? null
    return safe(
      supabase.from('collections').select('*').eq('slug', slug).maybeSingle(),
      null, 'collections.bySlug',
    )
  },
}

/* ========================================================================== */
/* banners, settings, coupons, reviews                                        */
/* ========================================================================== */

export const banners = {
  async active(placement) {
    if (!isSupabaseConfigured) {
      return demoBanners
        .filter((b) => !placement || b.placement === placement)
        .sort((a, b) => a.position - b.position)
    }
    const rows = await safe(
      supabase.from('banners').select('*')
        .eq('is_active', true)
        .eq('placement', placement)
        .order('position'),
      [], 'banners.active',
    )
    const now = Date.now()
    return rows.filter((b) => {
      if (b.starts_at && new Date(b.starts_at).getTime() > now) return false
      if (b.ends_at && new Date(b.ends_at).getTime() < now) return false
      return true
    })
  },
}

export const settings = {
  async all() {
    if (!isSupabaseConfigured) return demoSettings
    const rows = await safe(
      supabase.from('settings').select('key, value'), [], 'settings.all',
    )
    return Object.fromEntries(rows.map((r) => [r.key, r.value]))
  },
}

export const coupons = {
  async validate(code, subtotal) {
    const normalised = String(code ?? '').trim().toUpperCase()
    if (!normalised) return { valid: false, reason: 'Enter a promo code.' }

    const find = async () => {
      if (!isSupabaseConfigured) return demoCoupons.find((c) => c.code === normalised) ?? null
      return safe(
        supabase.from('coupons').select('*').eq('code', normalised).eq('is_active', true).maybeSingle(),
        null, 'coupons.validate',
      )
    }

    const coupon = await find()
    if (!coupon) return { valid: false, reason: 'That promo code is not valid.' }
    if (subtotal < coupon.min_order) {
      return { valid: false, reason: `Spend at least ৳${coupon.min_order.toLocaleString('en-BD')} to use this code.` }
    }
    if (coupon.expires_at && new Date(coupon.expires_at).getTime() < Date.now()) {
      return { valid: false, reason: 'This promo code has expired.' }
    }

    const raw = coupon.type === 'percent'
      ? Math.floor((subtotal * coupon.value) / 100)
      : coupon.value
    const discount = Math.min(raw, coupon.max_discount ?? Infinity, subtotal)

    return { valid: true, code: coupon.code, discount, description: coupon.description }
  },
}

export const reviews = {
  async forProduct(productId, productSlug) {
    if (!isSupabaseConfigured) {
      return demoReviews.filter((r) => r.product_slug === productSlug)
    }
    return safe(
      supabase.from('reviews').select('*')
        .eq('product_id', productId).eq('is_approved', true)
        .order('created_at', { ascending: false }),
      [], 'reviews.forProduct',
    )
  },

  async create({ productId, userId, authorName, rating, title, body }) {
    if (!isSupabaseConfigured) {
      console.info(`[${DEMO_LABEL}] Review "${title}" not saved — connect Supabase to persist reviews.`)
      return { error: { message: 'Demo mode: reviews are not saved. Connect Supabase to submit reviews.' } }
    }
    return supabase.from('reviews').insert({
      product_id: productId, user_id: userId, author_name: authorName,
      rating, title, body, is_approved: false,
    }).select().single()
  },

  async recent(limit = 6) {
    if (!isSupabaseConfigured) return demoReviews.slice(0, limit)
    return safe(
      supabase.from('reviews').select('*, products(name, slug)')
        .eq('is_approved', true).order('created_at', { ascending: false }).limit(limit),
      [], 'reviews.recent',
    )
  },
}

export const testimonials = {
  async homepage() {
    if (!isSupabaseConfigured) return demoTestimonials
    const configured = await settings.all()
    const value = configured.testimonials
    if (Array.isArray(value)) return value
    return demoTestimonials
  },
}

/* ========================================================================== */
/* orders                                                                     */
/* ========================================================================== */

export const orders = {
  /**
   * Place an order. Decrementing stock is a Postgres function so concurrent
   * checkouts cannot oversell the same variant.
   * @returns {{ok: true, orderNumber: string} | {ok: false, error: string}}
   */
  async place({ items, customer, couponCode }) {
    if (!items.length) return { ok: false, error: 'Your cart is empty.' }

    // Demo mode has to do the pricing in the browser because there is no
    // database to do it. Live mode skips all of this: place_order() reads the
    // same settings and coupon rows itself, so calculating them again here
    // would only risk the two disagreeing with each other.
    let subtotal = 0
    let deliveryFee = 0
    let discount = 0
    let appliedCode = null
    let total = 0

    if (!isSupabaseConfigured) {
      subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)

      const insideDhaka = 80
      const outsideDhaka = 130
      const freeThreshold = 5000

      const courier = customer.district === 'Dhaka' ? insideDhaka : outsideDhaka
      deliveryFee = subtotal >= freeThreshold ? 0 : courier

      if (couponCode) {
        const result = await coupons.validate(couponCode, subtotal)
        if (result.valid) { discount = result.discount; appliedCode = result.code }
      }

      total = Math.max(0, subtotal + deliveryFee - discount)
    }

    if (!isSupabaseConfigured) {
      // Recorded locally so the number on the confirmation page can actually be
      // looked up on /orders, which is what the page tells the customer to do.
      const existing = readDemoOrders()
      const orderNumber = (() => {
        const used = new Set(allDemoOrders().map((o) => o.order_number))
        for (let i = 0; i < 1000; i += 1) {
          const candidate = `FTX-DEMO-${String(1000 + Math.floor(Math.random() * 9000))}`
          if (!used.has(candidate)) return candidate
        }
        return `FTX-DEMO-${Date.now()}`
      })()

      writeDemoOrders([{
        id: `demo-placed-${orderNumber}`,
        order_number: orderNumber,
        status: 'pending',
        payment_status: 'due_on_delivery',
        payment_method: 'cod',
        customer_name: customer.name,
        customer_phone: customer.phone,
        customer_email: customer.email || null,
        address_line1: customer.address,
        address_line2: customer.landmark || null,
        area: customer.area || null,
        city: customer.city || null,
        district: customer.district,
        postal_code: customer.postalCode || null,
        delivery_note: customer.note || null,
        subtotal,
        delivery_fee: deliveryFee,
        discount,
        coupon_code: appliedCode,
        total,
        placed_at: new Date().toISOString(),
        demo: true,
        items: items.map((i) => ({
          id: `oi-${orderNumber}-${i.slug}-${i.variantLabel}`,
          product_id: i.productId,
          product_name: i.name,
          product_slug: i.slug,
          variant_id: i.variantId,
          variant_label: i.variantLabel,
          unit_price: i.unitPrice,
          quantity: i.quantity,
          line_total: i.unitPrice * i.quantity,
          primary_color: i.primaryColor ?? null,
          secondary_color: i.secondaryColor ?? null,
        })),
      }, ...existing])

      console.info(`[${DEMO_LABEL}] Order ${orderNumber} stored in localStorage only. Connect Supabase to keep real orders.`)
      return { ok: true, orderNumber, demo: true }
    }

    // Live mode sends *intent only* — which variant, how many, and who to ship
    // to. Prices, delivery fees, discounts and the total are recomputed by
    // public.place_order(); there is deliberately no client-side arithmetic
    // here to tamper with, and no client-side stock loop that could leave the
    // inventory half-decremented if a later line failed.
    const lineItems = items.map((item) => ({
      variant_id: item.variantId,
      quantity: item.quantity,
    }))

    if (lineItems.some((l) => !l.variant_id)) {
      return { ok: false, error: 'Your cart has an item with no selected size. Please pick a size.' }
    }

    const { data: placed, error: placeError } = await supabase.rpc('place_order', {
      p_customer: {
        name: customer.name,
        phone: customer.phone,
        email: customer.email || '',
        address: customer.address,
        landmark: customer.landmark || '',
        area: customer.area || '',
        city: customer.city || '',
        district: customer.district,
        postalCode: customer.postalCode || '',
        note: customer.note || '',
      },
      p_items: lineItems,
      p_coupon_code: couponCode || null,
    })

    // The function is one transaction, so a failure here means nothing at all
    // was written: no order, no line items, no stock movement.
    if (placeError) {
      return { ok: false, error: placeError.message || 'We could not place your order. Please try again.' }
    }

    return {
      ok: true,
      orderNumber: placed?.order_number,
      orderId: placed?.order_id,
      total: placed?.total,
    }
  },

  async forUser(userId) {
    if (!isSupabaseConfigured) return allDemoOrders()
    if (!userId) return []
    return safe(
      supabase.from('orders').select('*, order_items(*)')
        .eq('user_id', userId).order('placed_at', { ascending: false }),
      [], 'orders.forUser',
    )
  },

  async trackByNumber(orderNumber) {
    if (!isSupabaseConfigured) {
      const match = allDemoOrders().find((o) => o.order_number === orderNumber)
      return match ? { ...match, items: match.items } : null
    }
    return safe(
      supabase.from('orders').select('*, order_items(*)')
        .eq('order_number', orderNumber).maybeSingle(),
      null, 'orders.trackByNumber',
    )
  },
}

/* ========================================================================== */
/* contact / newsletter                                                        */
/* ========================================================================== */

export const messages = {
  async send(payload) {
    if (!isSupabaseConfigured) {
      console.info(`[${DEMO_LABEL}] Contact message from ${payload.name} not stored.`)
      return { error: { message: 'Demo mode: messages are not stored. Connect Supabase to receive them.' } }
    }
    return supabase.from('contact_messages').insert(payload).select().single()
  },
}

export const newsletter = {
  async subscribe(email) {
    if (!isSupabaseConfigured) {
      console.info(`[${DEMO_LABEL}] Newsletter signup for ${email} not stored.`)
      return { error: { message: 'Demo mode: subscriptions are not stored.' } }
    }
    return supabase.from('newsletter_subscribers').insert({ email: String(email).trim().toLowerCase() })
  },
}

export { isSupabaseConfigured }
