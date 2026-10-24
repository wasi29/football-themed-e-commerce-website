import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

/**
 * Wishlist. Persists to Supabase for signed-in users, localStorage otherwise,
 * so the heart button works on the product grid before anyone logs in.
 */

const WishlistContext = createContext(null)
const STORAGE_KEY = 'ftx.wishlist.v1'

export function WishlistProvider({ children }) {
  const [items, setItems] = useState([])
  const [userId, setUserId] = useState(null)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) setItems(JSON.parse(raw))
      } catch { /* storage unavailable */ }
      return
    }
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user?.id ?? null))
  }, [])

  // Signed-in users read their wishlist from the database.
  useEffect(() => {
    if (!isSupabaseConfigured || !userId) return
    supabase.from('wishlist_items').select('product_id').eq('user_id', userId)
      .then(({ data }) => setItems((data ?? []).map((r) => r.product_id)))
  }, [userId])

  useEffect(() => {
    if (!isSupabaseConfigured) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)) } catch { /* noop */ }
    }
  }, [items])

  const value = useMemo(() => {
    const toggle = async (productId) => {
      const has = items.includes(productId)
      setItems((prev) => (has ? prev.filter((i) => i !== productId) : [...prev, productId]))

      if (isSupabaseConfigured && userId) {
        if (has) {
          await supabase.from('wishlist_items')
            .delete().eq('user_id', userId).eq('product_id', productId)
        } else {
          await supabase.from('wishlist_items').insert({ user_id: userId, product_id: productId })
        }
      }
      return !has
    }

    return {
      items,
      count: items.length,
      has: (productId) => items.includes(productId),
      toggle,
      clear: () => setItems([]),
    }
  }, [items, userId])

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

export function useWishlist() {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist must be used inside <WishlistProvider>')
  return ctx
}
