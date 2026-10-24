import { createContext, useContext, useEffect, useMemo, useReducer } from 'react'

/**
 * Cart state.
 *
 * Lines are keyed by `variantId` when the variant has a real Supabase UUID, so
 * two sizes of the same shirt are separate lines. Demo-mode ids are strings,
 * which works identically.
 */

const CartContext = createContext(null)

const STORAGE_KEY = 'ftx.cart.v1'

const INIT = {
  items: [],
  coupon: null,      // { code, discount, description }
  drawerOpen: false,
}

function lineKey(variantId, slug) {
  return variantId || `demo:${slug}`
}

function reducer(state, action) {
  switch (action.type) {
    case 'hydrate':
      return { ...state, items: action.items }

    case 'add': {
      const { product, variant, quantity = 1 } = action
      const key = lineKey(variant?.id, product.slug)
      const existing = state.items.find((i) => i.key === key)
      const max = variant?.stock ?? Infinity

      if (existing) {
        if (existing.quantity >= max) return state
        return {
          ...state,
          drawerOpen: true,
          items: state.items.map((i) =>
            i.key === key ? { ...i, quantity: Math.min(i.quantity + quantity, max) } : i,
          ),
        }
      }

      return {
        ...state,
        drawerOpen: true,
        items: [
          ...state.items,
          {
            key,
            productId: product.id,
            variantId: variant?.id ?? null,
            slug: product.slug,
            name: product.name,
            image_url: product.thumbnail_url,
            primary_color: product.primary_color,
            secondary_color: product.secondary_color,
            variantLabel: variant ? `Size ${variant.size} · ${variant.color_name}` : 'One size',
            sku: variant?.sku ?? product.sku,
            unitPrice: variant?.price_override ?? product.sale_price ?? product.base_price,
            basePrice: product.base_price,
            quantity: Math.min(quantity, max),
            maxStock: max === Infinity ? 99 : max,
          },
        ],
      }
    }

    case 'setQuantity': {
      const { key, quantity } = action
      return {
        ...state,
        items: state.items
          .map((i) => (i.key === key
            ? { ...i, quantity: Math.max(0, Math.min(quantity, i.maxStock ?? 99)) }
            : i))
          .filter((i) => i.quantity > 0),
      }
    }

    case 'remove':
      return { ...state, items: state.items.filter((i) => i.key !== action.key) }

    case 'applyCoupon':
      return { ...state, coupon: action.coupon }

    case 'clearCoupon':
      return { ...state, coupon: null }

    case 'clear':
      return { ...state, items: [], coupon: null }

    case 'openDrawer':
      return { ...state, drawerOpen: true }

    case 'closeDrawer':
      return { ...state, drawerOpen: false }

    default:
      return state
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, INIT)

  // Restore from localStorage on mount (cart contents only — the coupon is
  // re-validated server-side at checkout anyway).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed?.items)) {
          dispatch({ type: 'hydrate', items: parsed.items })
        }
      }
    } catch {
      // Corrupt or unavailable storage is not worth crashing the shop over.
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ items: state.items }))
    } catch {
      // Private browsing / quota exceeded — the cart still works in memory.
    }
  }, [state.items])

  const value = useMemo(() => {
    const subtotal = state.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
    const itemCount = state.items.reduce((s, i) => s + i.quantity, 0)
    const discount = state.coupon?.valid ? (state.coupon.discount ?? 0) : 0
    const savings = state.items.reduce(
      (s, i) => s + Math.max(0, i.basePrice - i.unitPrice) * i.quantity, 0,
    )

    return {
      items: state.items,
      coupon: state.coupon,
      isOpen: state.drawerOpen,
      count: itemCount,
      subtotal,
      discount,
      savings,
      addItem: (product, variant, quantity = 1) =>
        dispatch({ type: 'add', product, variant, quantity }),
      setQuantity: (key, quantity) => dispatch({ type: 'setQuantity', key, quantity }),
      removeItem: (key) => dispatch({ type: 'remove', key }),
      applyCoupon: (coupon) => dispatch({ type: 'applyCoupon', coupon }),
      clearCoupon: () => dispatch({ type: 'clearCoupon' }),
      clear: () => dispatch({ type: 'clear' }),
      open: () => dispatch({ type: 'openDrawer' }),
      close: () => dispatch({ type: 'closeDrawer' }),
    }
  }, [state])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>')
  return ctx
}
