'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react'
import { CartContextType, CartItem, Product } from '@/types'

type CartAction =
  | { type: 'ADD_ITEM'; product: Product }
  | { type: 'REMOVE_ITEM'; productId: string }
  | { type: 'UPDATE_QUANTITY'; productId: string; quantity: number }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; items: CartItem[] }

function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.find((i) => i.product.id === action.product.id)
      if (existing) {
        return state.map((i) =>
          i.product.id === action.product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      }
      return [...state, { product: action.product, quantity: 1 }]
    }
    case 'REMOVE_ITEM':
      return state.filter((i) => i.product.id !== action.productId)
    case 'UPDATE_QUANTITY':
      if (action.quantity <= 0)
        return state.filter((i) => i.product.id !== action.productId)
      return state.map((i) =>
        i.product.id === action.productId ? { ...i, quantity: action.quantity } : i
      )
    case 'CLEAR_CART':
      return []
    case 'LOAD_CART':
      return action.items
    default:
      return state
  }
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, dispatch] = useReducer(cartReducer, [])

  useEffect(() => {
    try {
      const saved = localStorage.getItem('atlas-cart')
      if (saved) dispatch({ type: 'LOAD_CART', items: JSON.parse(saved) })
    } catch {}
  }, [])

  useEffect(() => {
    localStorage.setItem('atlas-cart', JSON.stringify(items))
  }, [items])

  // Stable refs — these never change between renders so consumers
  // wrapped in React.memo won't re-render just because the provider did.
  const addItem = useCallback(
    (product: Product) => dispatch({ type: 'ADD_ITEM', product }),
    []
  )
  const removeItem = useCallback(
    (productId: string) => dispatch({ type: 'REMOVE_ITEM', productId }),
    []
  )
  const updateQuantity = useCallback(
    (productId: string, quantity: number) =>
      dispatch({ type: 'UPDATE_QUANTITY', productId, quantity }),
    []
  )
  const clearCart = useCallback(() => dispatch({ type: 'CLEAR_CART' }), [])

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [items]
  )
  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  )

  // Context value only changes when items (or derived totals) change —
  // not on every CartProvider render.
  const value = useMemo<CartContextType>(
    () => ({ items, addItem, removeItem, updateQuantity, clearCart, total, itemCount }),
    [items, addItem, removeItem, updateQuantity, clearCart, total, itemCount]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextType {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
