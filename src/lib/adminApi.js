/**
 * FootballTrix — admin data access.
 *
 * Separate from the storefront `api.js` because every call here assumes the
 * caller has already been through the admin role gate; the actual protection
 * is RLS in `supabase/schema.sql`, not this file.
 *
 * Without Supabase configured every method returns demo-shaped data so the
 * panel can be walked through end-to-end. Writes return a "demo mode" error
 * rather than silently pretending to persist.
 */

import { supabase, isSupabaseConfigured } from './supabase'
import { demoProducts, demoCategories, demoBanners, demoReviews, demoCoupons, demoOrders } from '../data/demoData'

const DEMO_WRITE_ERROR = {
  message: 'Demo mode: this change was not saved. Connect Supabase to manage live data.',
}

const demoMessage = (label, extra = {}) => ({ error: { message: `Demo mode: ${label} was not saved.` }, demo: true, ...extra })

/**
 * URL slug. Lowercase, ASCII-alphanumeric runs collapsed to single hyphens,
 * leading/trailing hyphens stripped — matches what `place_order` and the
 * storefront's product links expect to read back.
 */
function makeSlug(value) {
  return String(value ?? '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/* ========================================================================== */
/* dashboard                                                                  */
/* ========================================================================== */

export const adminDashboard = {
  async stats() {
    if (!isSupabaseConfigured) {
      const orders = demoOrders()
      const revenue = orders
        .filter((o) => o.status !== 'cancelled')
        .reduce((s, o) => s + Number(o.total ?? 0), 0)
      const byStatus = orders.reduce((acc, o) => {
        acc[o.status] = (acc[o.status] ?? 0) + 1
        return acc
      }, {})
      return {
        data: {
          totalSales: revenue,
          orderCount: orders.length,
          pendingCount: byStatus.pending ?? 0,
          completedCount: byStatus.delivered ?? 0,
          customerCount: 3,
          productCount: demoProducts.length,
          lowStockCount: demoProducts.filter((p) =>
            p.variants?.some((v) => Number(v.stock) <= 5)).length,
          outOfStockCount: demoProducts.filter((p) =>
            p.variants?.some((v) => Number(v.stock) === 0)).length,
          salesSeries: [],
          statusBreakdown: Object.entries(byStatus).map(([status, count]) => ({ status, count })),
          pendingReviewCount: 3,
          unreadMessageCount: 5,
          recentOrders: orders.slice(0, 6),
          recentCustomers: [],
          topProducts: demoProducts
            .slice()
            .sort((a, b) => b.sold_count - a.sold_count)
            .slice(0, 5),
          lowStock: demoProducts
            .flatMap((p) => p.variants
              .filter((v) => Number(v.stock) <= 5)
              .map((v) => ({ product: p, variant: v })))
            .slice(0, 6),
          outOfStock: demoProducts
            .flatMap((p) => p.variants
              .filter((v) => Number(v.stock) === 0)
              .map((v) => ({ product: p, variant: v })))
            .slice(0, 6),
        },
        error: null,
      }
    }

    const since = new Date()
    since.setDate(since.getDate() - 30)

    const [
      ordersRes, productsRes, variantsRes, reviewsRes, messagesRes,
      customersRes, seriesRes, recentCustomersRes,
    ] = await Promise.all([
      supabase.from('orders').select('id, total, status, placed_at'),
      supabase.from('products').select('id', { count: 'exact', head: true }),
      supabase.from('product_variants').select(
        'id, size, color_name, stock, product_id, products(id, name, slug, thumbnail_url, low_stock_threshold)',
      ),
      supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('is_approved', false),
      supabase.from('contact_messages').select('id', { count: 'exact', head: true }).eq('is_resolved', false),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('orders').select('placed_at, total, status').gte('placed_at', since.toISOString()),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(6),
    ])

    const orders = ordersRes.data ?? []
    const totalSales = orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((s, o) => s + Number(o.total ?? 0), 0)

    const statusBreakdown = Object.entries(
      orders.reduce((acc, o) => {
        acc[o.status] = (acc[o.status] ?? 0) + 1
        return acc
      }, {}),
    ).map(([status, count]) => ({ status, count }))

    const variants = variantsRes.data ?? []
    // Low stock is relative to each product's own threshold, not a magic 5.
    const lowStock = variants.filter((v) => {
      const limit = Number(v.products?.low_stock_threshold ?? 5)
      const stock = Number(v.stock)
      return stock > 0 && stock <= limit
    })
    const outOfStock = variants.filter((v) => Number(v.stock) === 0)

    const [recentRes, topRes] = await Promise.all([
      supabase.from('orders').select('*').order('placed_at', { ascending: false }).limit(6),
      supabase.from('products').select('id, name, slug, thumbnail_url, base_price, sale_price, sold_count, categories!products_category_id_fkey(name)')
        .order('sold_count', { ascending: false }).limit(5),
    ])

    return {
      data: {
        totalSales,
        orderCount: orders.length,
        pendingCount: statusBreakdown.find((s) => s.status === 'pending')?.count ?? 0,
        completedCount: statusBreakdown.find((s) => s.status === 'delivered')?.count ?? 0,
        customerCount: customersRes.count ?? 0,
        productCount: productsRes.count ?? 0,
        lowStockCount: lowStock.length,
        outOfStockCount: outOfStock.length,
        salesSeries: buildDailySeries(seriesRes.data ?? [], since),
        statusBreakdown,
        recentOrders: recentRes.data ?? [],
        recentCustomers: recentCustomersRes.data ?? [],
        topProducts: topRes.data ?? [],
        lowStock: lowStock.slice(0, 8),
        outOfStock: outOfStock.slice(0, 8),
        pendingReviewCount: reviewsRes.count ?? 0,
        unreadMessageCount: messagesRes.count ?? 0,
      },
      error: null,
    }
  },
}

/**
 * One bucket per day for the sales chart, so the x-axis keeps its shape even
 * on a day nobody ordered. Cancelled orders are dropped: the line shows money
 * actually taken, not money that was later refunded away.
 */
function buildDailySeries(rows, since) {
  const byDay = {}
  for (const row of rows) {
    if (row.status === 'cancelled') continue
    const key = new Date(row.placed_at).toISOString().slice(0, 10)
    byDay[key] = (byDay[key] ?? 0) + Number(row.total ?? 0)
  }

  const days = []
  const cursor = new Date(since)
  for (let i = 0; i < 30; i += 1) {
    const key = cursor.toISOString().slice(0, 10)
    days.push({ date: key, total: byDay[key] ?? 0 })
    cursor.setDate(cursor.getDate() + 1)
  }
  return days
}

/* ========================================================================== */
/* orders                                                                     */
/* ========================================================================== */

export const adminOrders = {
  async list({ status, search, page = 1, limit = 20 } = {}) {
    if (!isSupabaseConfigured) {
      let rows = demoOrders()
      if (status && status !== 'all') rows = rows.filter((o) => o.status === status)
      if (search) {
        const q = search.toLowerCase()
        rows = rows.filter((o) =>
          `${o.order_number} ${o.customer_name} ${o.customer_phone}`.toLowerCase().includes(q))
      }
      return { data: rows, error: null, total: rows.length }
    }

    let query = supabase
      .from('orders').select('*, order_items(*)', { count: 'exact' })
      .order('placed_at', { ascending: false })

    if (status && status !== 'all') query = query.eq('status', status)
    if (search) {
      const q = search.replace(/[%,()]/g, '')
      query = query.or(`order_number.ilike.%${q}%,customer_name.ilike.%${q}%,customer_phone.ilike.%${q}%`)
    }
    query = query.range((page - 1) * limit, page * limit - 1)

    const { data, error, count } = await query
    if (error) {
      console.warn('[FootballTrix] admin.orders.list failed:', error.message)
      return { data: [], error, total: 0 }
    }
    return { data: data ?? [], error: null, total: count ?? 0 }
  },

  async byId(id) {
    if (!isSupabaseConfigured) {
      const order = demoOrders().find((o) => String(o.id) === String(id))
      return { data: order ?? null, error: null }
    }
    const { data, error } = await supabase
      .from('orders').select('*, order_items(*)').eq('id', id).maybeSingle()
    return { data, error }
  },

  /** Status transition, plus the admin note shown on the order. */
  async setStatus(id, status, { note } = {}) {
    if (!isSupabaseConfigured) return demoMessage(`Status change to "${status}"`)

    const patch = { status }
    if (note) patch.admin_note = note
    if (status === 'delivered') patch.delivered_at = new Date().toISOString()
    if (status === 'cancelled') patch.cancelled_at = new Date().toISOString()

    const { data, error } = await supabase.from('orders').update(patch).eq('id', id).select().single()
    if (error) return { error }

    // Cancelling returns the reserved stock to the shelf.
    if (status === 'cancelled') {
      const { data: items } = await supabase.from('order_items').select('*').eq('order_id', id)
      for (const item of items ?? []) {
        if (item.variant_id) {
          await supabase.rpc('restore_stock', { p_variant_id: item.variant_id, p_qty: item.quantity })
        }
      }
    }
    return { data, error: null }
  },

  async setPaymentStatus(id, paymentStatus) {
    if (!isSupabaseConfigured) return demoMessage(`Payment status change to "${paymentStatus}"`)
    const { data, error } = await supabase
      .from('orders').update({ payment_status: paymentStatus }).eq('id', id).select().single()
    return { data, error }
  },

  async setCourier(id, { courierName, trackingNumber }) {
    if (!isSupabaseConfigured) return demoMessage('Courier update')
    const { data, error } = await supabase
      .from('orders')
      .update({ courier_name: courierName, tracking_number: trackingNumber })
      .eq('id', id).select().single()
    return { data, error }
  },

  async remove(id) {
    if (!isSupabaseConfigured) return demoMessage('Order delete')
    const { data: items } = await supabase.from('order_items').select('variant_id, quantity').eq('order_id', id)
    const { error, data } = await supabase.from('orders').delete().eq('id', id).select().single()
    if (error) return { error }
    for (const item of items ?? []) {
      if (item.variant_id) {
        await supabase.rpc('restore_stock', { p_variant_id: item.variant_id, p_qty: item.quantity })
      }
    }
    return { data, error: null }
  },
}

/* ========================================================================== */
/* products + stock                                                           */
/* ========================================================================== */

export const adminProducts = {
  async list({ search, page = 1, limit = 20 } = {}) {
    if (!isSupabaseConfigured) {
      let rows = demoProducts
      if (search) {
        const q = search.toLowerCase()
        rows = rows.filter((p) => `${p.name} ${p.team_name ?? ''}`.toLowerCase().includes(q))
      }
      return { data: rows, error: null, total: rows.length }
    }

    let query = supabase
      .from('products')
      .select('*, categories!products_category_id_fkey(name, slug), collections(name, slug), product_variants(*)', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (search) query = query.ilike('name', `%${search}%`)
    query = query.range((page - 1) * limit, page * limit - 1)

    const { data, error, count } = await query
    if (error) {
      console.warn('[FootballTrix] admin.products.list failed:', error.message)
      return { data: [], error, total: 0 }
    }
    return { data: data ?? [], error: null, total: count ?? 0 }
  },

  /** Single product with its variants, for the editor. */
  async byId(id) {
    if (!isSupabaseConfigured) {
      const product = demoProducts.find((p) => String(p.id) === String(id))
      return { data: product ?? null, error: null }
    }
    const { data, error } = await supabase
      .from('products')
      .select('*, categories!products_category_id_fkey(name, slug), collections(name, slug), product_variants(*)')
      .eq('id', id)
      .maybeSingle()
    return { data, error }
  },

  async save(payload) {
    if (!isSupabaseConfigured) return demoMessage(payload.id ? 'Product update' : 'Product creation')

    const body = { ...payload }
    if (!body.id) delete body.id

    if (payload.id) {
      // On edit the slug is intentionally left out of the patch: renaming a
      // product must not silently break every URL already shared or indexed.
      delete body.slug
    } else {
      // `products.slug` is NOT NULL with no default and no trigger, so an
      // insert that omits it fails outright. Derive it from the name.
      body.slug = makeSlug(payload.slug || payload.name)
      if (!body.slug) return { error: { message: 'A product needs a name to build its URL from.' } }
    }

    const { data, error } = body.id
      ? await supabase.from('products').update(body).eq('id', body.id).select().single()
      : await supabase.from('products').insert(body).select().single()
    return { data, error }
  },

  async setActive(id, isActive) {
    if (!isSupabaseConfigured) return demoMessage(`${isActive ? 'Publish' : 'Unpublish'} product`)
    const { data, error } = await supabase
      .from('products').update({ is_active: isActive }).eq('id', id).select().single()
    return { data, error }
  },

  async remove(id) {
    if (!isSupabaseConfigured) return demoMessage('Product delete')
    const { data, error } = await supabase.from('products').delete().eq('id', id).select().single()
    return { data, error }
  },

  /**
   * Copy a product with fresh variants, so an admin can spin up a new colourway
   * without re-typing the spec. The copy starts unpublished and with zero
   * stock: it must be reviewed before it can sell.
   */
  async duplicate(id) {
    if (!isSupabaseConfigured) return demoMessage('Product duplicate')
    const { data: source, error } = await supabase
      .from('products').select('*, product_variants(*)').eq('id', id).maybeSingle()
    if (error) return { error }
    if (!source) return { error: { message: 'Product not found.' } }

    const { product_variants: _variants, id: _id, created_at: _c, updated_at: _u, sold_count: _s, ...rest } = source

    const copyName = `${source.name} (copy)`
    const { data: product, error: saveError } = await supabase
      .from('products')
      .insert({
        ...rest,
        name: copyName,
        // Unique constraint: a plain "(copy)" suffix would collide the second
        // time the same product is duplicated, so a short random tail is added.
        slug: `${makeSlug(copyName)}-${Math.random().toString(36).slice(2, 7)}`,
        is_active: false,
        sold_count: 0,
      })
      .select()
      .single()
    if (saveError) return { error: saveError }

    const variants = (source.product_variants ?? []).map(({ id: _vid, created_at: _vc, ...variant }) => ({
      ...variant,
      product_id: product.id,
      stock: 0,
    }))
    if (variants.length) {
      const { error: variantError } = await supabase.from('product_variants').insert(variants)
      if (variantError) return { error: variantError }
    }

    return { data: product, error: null }
  },

  /**
   * Adjust one variant's stock and log the movement in `inventory_movements`.
   * `type` must be one of the `stock_movement` enum values in schema.sql.
   */
  async adjustStock(variantId, delta, type = 'adjustment') {
    if (!isSupabaseConfigured) return demoMessage('Stock adjustment')
    const { data: variant, error: readError } = await supabase
      .from('product_variants').select('id, stock, product_id').eq('id', variantId).maybeSingle()
    if (readError || !variant) return { error: readError ?? { message: 'Variant not found.' } }

    const next = Math.max(0, Number(variant.stock ?? 0) + Number(delta))
    const { data, error } = await supabase
      .from('product_variants').update({ stock: next }).eq('id', variantId).select().single()
    if (error) return { error }

    await supabase.from('inventory_movements').insert({
      variant_id: variantId,
      product_id: variant.product_id,
      type,
      quantity: Number(delta),
      balance_after: next,
      note: `Adjusted by admin to ${next}`,
    })
    return { data, error: null }
  },

  async saveVariant(variant) {
    if (!isSupabaseConfigured) return demoMessage('Variant save')
    const body = { ...variant }
    if (!body.id) delete body.id
    const { data, error } = body.id
      ? await supabase.from('product_variants').update(body).eq('id', body.id).select().single()
      : await supabase.from('product_variants').insert(body).select().single()
    return { data, error }
  },

  async removeVariant(id) {
    if (!isSupabaseConfigured) return demoMessage('Variant delete')
    const { data, error } = await supabase.from('product_variants').delete().eq('id', id).select().single()
    return { data, error }
  },
}

/* ========================================================================== */
/* taxonomy                                                                   */
/* ========================================================================== */

export const adminCategories = {
  async list() {
    if (!isSupabaseConfigured) return { data: demoCategories, error: null }
    const { data, error } = await supabase
      .from('categories').select('*').order('position')
    return { data: data ?? [], error }
  },

  async save(payload) {
    if (!isSupabaseConfigured) return demoMessage(payload.id ? 'Category update' : 'Category creation')
    const body = { ...payload }
    if (!body.id) delete body.id
    const { data, error } = body.id
      ? await supabase.from('categories').update(body).eq('id', body.id).select().single()
      : await supabase.from('categories').insert(body).select().single()
    return { data, error }
  },

  async remove(id) {
    if (!isSupabaseConfigured) return demoMessage('Category delete')
    const { data, error } = await supabase.from('categories').delete().eq('id', id).select().single()
    return { data, error }
  },
}

export const adminCollections = {
  async list() {
    if (!isSupabaseConfigured) return { data: [], error: null }
    const { data, error } = await supabase.from('collections').select('*').order('position')
    return { data: data ?? [], error }
  },

  async save(payload) {
    if (!isSupabaseConfigured) return demoMessage('Collection save')
    const body = { ...payload }
    if (!body.id) delete body.id
    const { data, error } = body.id
      ? await supabase.from('collections').update(body).eq('id', body.id).select().single()
      : await supabase.from('collections').insert(body).select().single()
    return { data, error }
  },

  async remove(id) {
    if (!isSupabaseConfigured) return demoMessage('Collection delete')
    const { data, error } = await supabase.from('collections').delete().eq('id', id).select().single()
    return { data, error }
  },
}

/* ========================================================================== */
/* reviews, messages, subscribers                                             */
/* ========================================================================== */

export const adminReviews = {
  async list({ pendingOnly = false } = {}) {
    if (!isSupabaseConfigured) {
      return {
        data: demoReviews.map((r, i) => ({
          ...r, id: `demo-rev-${i}`, is_approved: i > 1, is_read: true,
        })),
        error: null,
      }
    }
    let query = supabase
      .from('reviews').select('*, products(name, slug)').order('created_at', { ascending: false })
    if (pendingOnly) query = query.eq('is_approved', false)
    const { data, error } = await query
    return { data: data ?? [], error }
  },

  async setApproved(id, isApproved) {
    if (!isSupabaseConfigured) return demoMessage(isApproved ? 'Review approval' : 'Review rejection')
    const { data, error } = await supabase
      .from('reviews')
      .update({ is_approved: isApproved, rejected_at: isApproved ? null : new Date().toISOString() })
      .eq('id', id).select().single()
    return { data, error }
  },

  async remove(id) {
    if (!isSupabaseConfigured) return demoMessage('Review delete')
    const { data, error } = await supabase.from('reviews').delete().eq('id', id).select().single()
    return { data, error }
  },
}

export const adminMessages = {
  async list() {
    if (!isSupabaseConfigured) {
      return {
        data: [
          { id: 'm1', name: 'Sabbir Ahmed', email: 'sabbir@example.com', phone: '01712345678', subject: 'Order status', message: 'My order reached Rajshahi but the tracking has not moved for two days. Can you check?', is_read: false, created_at: new Date().toISOString() },
          { id: 'm2', name: 'Tanvir Islam', email: 'tanvir@example.com', phone: '01898765432', subject: 'Bulk order', message: 'We need 25 printed jerseys for a local tournament. What is the bulk price?', is_read: false, created_at: new Date(Date.now() - 3600e3).toISOString() },
          { id: 'm3', name: 'Nusrat Jahan', email: 'nusrat@example.com', phone: '01611223344', subject: 'Sizing or fit question', message: 'I normally wear XXL. Should I order XL or XXL for the fit you describe?', is_read: true, created_at: new Date(Date.now() - 86400e3).toISOString() },
        ],
        error: null,
      }
    }
    const { data, error } = await supabase
      .from('contact_messages').select('*').order('created_at', { ascending: false })
    return { data: data ?? [], error }
  },

  async setRead(id, isRead) {
    if (!isSupabaseConfigured) return demoMessage('Message read state')
    const { data, error } = await supabase
      .from('contact_messages').update({ is_resolved: isRead }).eq('id', id).select().single()
    return { data, error }
  },

  async remove(id) {
    if (!isSupabaseConfigured) return demoMessage('Message delete')
    const { data, error } = await supabase
      .from('contact_messages').delete().eq('id', id).select().single()
    return { data, error }
  },
}

export const adminSubscribers = {
  async list() {
    if (!isSupabaseConfigured) return { data: [], error: null }
    const { data, error } = await supabase
      .from('newsletter_subscribers').select('*').order('created_at', { ascending: false })
    return { data: data ?? [], error }
  },

  async remove(id) {
    if (!isSupabaseConfigured) return demoMessage('Subscriber removal')
    const { data, error } = await supabase
      .from('newsletter_subscribers').delete().eq('id', id).select().single()
    return { data, error }
  },
}

/* ========================================================================== */
/* marketing: banners + coupons + settings                                    */
/* ========================================================================== */

export const adminBanners = {
  async list() {
    if (!isSupabaseConfigured) return { data: demoBanners, error: null }
    const { data, error } = await supabase.from('banners').select('*').order('position')
    return { data: data ?? [], error }
  },

  async save(payload) {
    if (!isSupabaseConfigured) return demoMessage(payload.id ? 'Banner update' : 'Banner creation')
    const body = { ...payload }
    if (!body.id) delete body.id
    const { data, error } = body.id
      ? await supabase.from('banners').update(body).eq('id', body.id).select().single()
      : await supabase.from('banners').insert(body).select().single()
    return { data, error }
  },

  async remove(id) {
    if (!isSupabaseConfigured) return demoMessage('Banner delete')
    const { data, error } = await supabase.from('banners').delete().eq('id', id).select().single()
    return { data, error }
  },
}

export const adminCoupons = {
  async list() {
    if (!isSupabaseConfigured) return { data: demoCoupons, error: null }
    const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false })
    return { data: data ?? [], error }
  },

  async save(payload) {
    if (!isSupabaseConfigured) return demoMessage(payload.id ? 'Coupon update' : 'Coupon creation')
    const body = { ...payload }
    if (!body.id) delete body.id
    if (body.code) body.code = String(body.code).trim().toUpperCase()
    const { data, error } = body.id
      ? await supabase.from('coupons').update(body).eq('id', body.id).select().single()
      : await supabase.from('coupons').insert(body).select().single()
    return { data, error }
  },

  async remove(id) {
    if (!isSupabaseConfigured) return demoMessage('Coupon delete')
    const { data, error } = await supabase.from('coupons').delete().eq('id', id).select().single()
    return { data, error }
  },
}

export const adminSettings = {
  async list() {
    if (!isSupabaseConfigured) return { data: [], error: null }
    const { data, error } = await supabase.from('settings').select('*').order('key')
    return { data: data ?? [], error }
  },

  async save(key, value) {
    if (!isSupabaseConfigured) return demoMessage(`Setting "${key}"`)
    const { data, error } = await supabase
      .from('settings').upsert({ key, value }, { onConflict: 'key' }).select().single()
    return { data, error }
  },
}

/* ========================================================================== */
/* customers                                                                  */
/* ========================================================================== */

export const adminCustomers = {
  async list({ search } = {}) {
    if (!isSupabaseConfigured) {
      return {
        data: [
          { id: 'c1', full_name: 'Sabbir Ahmed', email: 'sabbir@example.com', phone: '01712345678', role: 'customer', created_at: new Date(Date.now() - 86400e3 * 90).toISOString(), order_count: 6, total_spent: 13400 },
          { id: 'c2', full_name: 'Tanvir Islam', email: 'tanvir@example.com', phone: '01898765432', role: 'customer', created_at: new Date(Date.now() - 86400e3 * 40).toISOString(), order_count: 2, total_spent: 4990 },
          { id: 'c3', full_name: 'Nusrat Jahan', email: 'nusrat@example.com', phone: '01611223344', role: 'customer', created_at: new Date(Date.now() - 86400e3 * 12).toISOString(), order_count: 1, total_spent: 2490 },
        ],
        error: null,
      }
    }
    let query = supabase.from('profiles').select('*').order('created_at', { ascending: false })
    if (search) {
      const clean = search.replace(/[%,()]/g, '')
      query = query.or(`full_name.ilike.%${clean}%,email.ilike.%${clean}%,phone.ilike.%${clean}%`)
    }
    const { data, error } = await query
    if (error) return { data: [], error }

    // Order stats are summed in the browser: PostgREST cannot group by an
    // arbitrary relation without an RPC, and the row counts here are small.
    const { data: orders } = await supabase
      .from('orders').select('user_id, total, status')

    const stats = {}
    for (const order of orders ?? []) {
      if (!order.user_id) continue
      const bucket = (stats[order.user_id] ??= { order_count: 0, total_spent: 0 })
      bucket.order_count += 1
      if (order.status !== 'cancelled') bucket.total_spent += Number(order.total ?? 0)
    }

    return {
      data: (data ?? []).map((p) => ({ ...p, order_count: 0, total_spent: 0, ...stats[p.id] })),
      error: null,
    }
  },

  async setRole(id, role) {
    if (!isSupabaseConfigured) return demoMessage(`Role change to "${role}"`)
    const { data, error } = await supabase
      .from('profiles').update({ role }).eq('id', id).select().single()
    return { data, error }
  },

  /**
   * One customer's profile together with their order history and spend.
   * Orders are read as a flat list and summed here rather than with an RPC,
   * so the panel keeps working with the same grants the storefront has.
   */
  async byId(id) {
    if (!isSupabaseConfigured) {
      const demo = [
        { id: 'c1', full_name: 'Sabbir Ahmed', email: 'sabbir@example.com', phone: '01712345678', role: 'customer', created_at: new Date(Date.now() - 86400e3 * 90).toISOString() },
      ][0]
      return { data: { profile: demo, orders: [], orderCount: 1, totalSpent: 13400 }, error: null }
    }

    const [profileRes, ordersRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', id).maybeSingle(),
      supabase.from('orders')
        .select('id, order_number, status, total, placed_at, payment_status')
        .eq('user_id', id)
        .order('placed_at', { ascending: false }),
    ])
    if (profileRes.error) return { data: null, error: profileRes.error }

    const orders = ordersRes.data ?? []
    const totalSpent = orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((s, o) => s + Number(o.total ?? 0), 0)

    return {
      data: {
        profile: profileRes.data,
        orders,
        orderCount: orders.length,
        totalSpent,
      },
      error: null,
    }
  },
}

/* ========================================================================== */
/* inventory                                                                  */
/* ========================================================================== */

export const adminInventory = {
  /**
   * Every variant joined to its product, so the stock table can show a size /
   * colour row without N+1 queries from the page.
   */
  async list({ search, filter = 'all' } = {}) {
    if (!isSupabaseConfigured) {
      const rows = demoProducts.flatMap((p) =>
        (p.variants ?? []).map((v) => ({ ...v, product: p })))
      return { data: rows, error: null }
    }

    const { data, error } = await supabase
      .from('product_variants')
      .select('*, product:products(id, name, slug, thumbnail_url, low_stock_threshold, base_price, sale_price)')
      .order('position')
      .order('size')

    if (error) return { data: [], error }

    let rows = data ?? []
    if (search) {
      const q = search.toLowerCase()
      rows = rows.filter((v) =>
        `${v.product?.name ?? ''} ${v.size} ${v.color_name} ${v.sku ?? ''}`.toLowerCase().includes(q))
    }
    if (filter === 'low') {
      rows = rows.filter((v) => Number(v.stock) > 0 && Number(v.stock) <= Number(v.product?.low_stock_threshold ?? 5))
    } else if (filter === 'out') {
      rows = rows.filter((v) => Number(v.stock) === 0)
    }

    return { data: rows, error: null }
  },

  /** Write a new absolute stock level and record the movement. */
  async setStock(variantId, stock) {
    if (!isSupabaseConfigured) return demoMessage('Stock update')
    const clamped = Math.max(0, Number(stock) || 0)

    const { data: variant, error: readError } = await supabase
      .from('product_variants').select('id, stock, product_id').eq('id', variantId).maybeSingle()
    if (readError || !variant) return { error: readError ?? { message: 'Variant not found.' } }

    const delta = clamped - Number(variant.stock ?? 0)
    if (delta === 0) return { data: variant, error: null }

    const { data, error } = await supabase
      .from('product_variants').update({ stock: clamped }).eq('id', variantId).select().single()
    if (error) return { error }

    await supabase.from('inventory_movements').insert({
      variant_id: variantId,
      product_id: variant.product_id,
      type: 'adjustment',
      quantity: delta,
      balance_after: clamped,
      note: `Set to ${clamped} from the inventory screen`,
    })

    return { data, error: null }
  },

  async movements({ limit = 50 } = {}) {
    if (!isSupabaseConfigured) return { data: [], error: null }
    const { data, error } = await supabase
      .from('inventory_movements')
      .select('*, product:products(name), variant:product_variants(size, color_name)')
      .order('created_at', { ascending: false })
      .limit(limit)
    return { data: data ?? [], error }
  },
}

/* ========================================================================== */
/* homepage sections                                                          */
/* ========================================================================== */

export const adminHomepage = {
  async list() {
    if (!isSupabaseConfigured) return { data: [], error: null }
    const { data, error } = await supabase
      .from('homepage_sections').select('*').order('position')
    return { data: data ?? [], error }
  },

  async save(payload) {
    if (!isSupabaseConfigured) return demoMessage(payload.id ? 'Section update' : 'Section creation')
    const body = { ...payload }
    if (!body.id) delete body.id
    const { data, error } = body.id
      ? await supabase.from('homepage_sections').update(body).eq('id', body.id).select().single()
      : await supabase.from('homepage_sections').insert(body).select().single()
    return { data, error }
  },

  async remove(id) {
    if (!isSupabaseConfigured) return demoMessage('Section delete')
    const { data, error } = await supabase.from('homepage_sections').delete().eq('id', id).select().single()
    return { data, error }
  },

  /**
   * Persist a new order for every section in the list. Written as a loop of
   * small updates rather than a single RPC so it works identically against the
   * demo fallback and against Supabase.
   */
  async reorder(items) {
    if (!isSupabaseConfigured) return demoMessage('Section reorder')
    for (const [index, item] of items.entries()) {
      const { error } = await supabase
        .from('homepage_sections').update({ position: index }).eq('id', item.id)
      if (error) return { error }
    }
    return { data: null, error: null }
  },
}

/* ========================================================================== */
/* notifications                                                              */
/* ========================================================================== */

export const adminNotifications = {
  async list({ limit = 30 } = {}) {
    if (!isSupabaseConfigured) {
      return {
        data: [
          { id: 'n1', type: 'new_order', title: 'New order FTX-2609-0001', body: 'Sabbir Ahmed · ৳3860', link: '/admin/orders', is_read: false, created_at: new Date().toISOString() },
          { id: 'n2', type: 'low_stock', title: 'Low stock: Home Kit 24/25', body: 'M / Sky Blue — 3 left', link: '/admin/inventory', is_read: false, created_at: new Date(Date.now() - 3600e3).toISOString() },
        ],
        error: null,
        unread: 2,
      }
    }
    const { data, error } = await supabase
      .from('notifications').select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) return { data: [], error, unread: 0 }

    const rows = data ?? []
    return { data: rows, error: null, unread: rows.filter((n) => !n.is_read).length }
  },

  async markRead(id) {
    if (!isSupabaseConfigured) return demoMessage('Notification read')
    const { data, error } = await supabase
      .from('notifications').update({ is_read: true }).eq('id', id).select().single()
    return { data, error }
  },

  async markAllRead() {
    if (!isSupabaseConfigured) return demoMessage('Mark all notifications read')
    const { error } = await supabase
      .from('notifications').update({ is_read: true }).eq('is_read', false)
    return { data: null, error }
  },

  async clearRead() {
    if (!isSupabaseConfigured) return demoMessage('Clear read notifications')
    const { error } = await supabase
      .from('notifications').delete().eq('is_read', true)
    return { data: null, error }
  },

  /** Live updates so a new order arrives without a refresh. */
  subscribe(onChange) {
    if (!isSupabaseConfigured) return () => {}
    const channel = supabase
      .channel('admin-notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, onChange)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  },
}

/* ========================================================================== */
/* storage uploads                                                            */
/* ========================================================================== */

export const adminStorage = {
  /**
   * Upload one image and return its public URL.
   *
   * Filenames are namespaced with a timestamp so re-uploading a file never
   * silently rewrites an image another product still points at. The bucket is
   * chosen by the caller so a product shot, a banner and a site asset cannot
   * overwrite each other even if the original names collide.
   */
  async uploadImage(bucket, file) {
    if (!isSupabaseConfigured) return { data: { url: URL.createObjectURL(file) }, error: null }

    const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: '31536000',
      upsert: false,
    })
    if (error) return { data: null, error }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return { data: { url: data.publicUrl, path }, error: null }
  },

  async remove(bucket, path) {
    if (!isSupabaseConfigured) return { data: null, error: null }
    const { error } = await supabase.storage.from(bucket).remove([path])
    return { data: null, error }
  },
}

/* ========================================================================== */
/* global search                                                              */
/* ========================================================================== */

export const adminSearch = {
  /**
   * One query box across the four things an admin actually looks up.
   * Each section is best-effort: a failed lookup leaves that section empty
   * instead of blanking the whole dropdown.
   */
  async all(term) {
    const q = String(term ?? '').trim()
    if (q.length < 2) return { data: { products: [], orders: [], customers: [], reviews: [] }, error: null }
    if (!isSupabaseConfigured) {
      const needle = q.toLowerCase()
      return {
        data: {
          products: demoProducts.filter((p) => p.name.toLowerCase().includes(needle)).slice(0, 5),
          orders: demoOrders().filter((o) =>
            `${o.order_number} ${o.customer_name}`.toLowerCase().includes(needle)).slice(0, 5),
          customers: [],
          reviews: [],
        },
        error: null,
      }
    }

    const clean = q.replace(/[%,()]/g, '')

    const [products, orders, customers, reviews] = await Promise.all([
      supabase.from('products').select('id, name, slug, thumbnail_url, base_price, sale_price')
        .ilike('name', `%${clean}%`).limit(5),
      supabase.from('orders').select('id, order_number, customer_name, status, total, placed_at')
        .or(`order_number.ilike.%${clean}%,customer_name.ilike.%${clean}%`).limit(5),
      supabase.from('profiles').select('id, full_name, email, phone, role')
        .or(`full_name.ilike.%${clean}%,email.ilike.%${clean}%,phone.ilike.%${clean}%`).limit(5),
      supabase.from('reviews').select('id, rating, body, author_name, is_approved, product_id, products(name)')
        .ilike('body', `%${clean}%`).limit(5),
    ])

    return {
      data: {
        products: products.data ?? [],
        orders: orders.data ?? [],
        customers: customers.data ?? [],
        reviews: reviews.data ?? [],
      },
      error: null,
    }
  },
}

export { DEMO_WRITE_ERROR }