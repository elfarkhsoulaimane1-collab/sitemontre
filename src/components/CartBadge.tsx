'use client'

import { useCart } from '@/context/CartContext'

// Isolated client component — only this re-renders when cart count changes,
// not the entire Navbar tree.
export default function CartBadge() {
  const { itemCount } = useCart()
  if (!itemCount) return null
  return (
    <span className="absolute -top-2 -right-2 w-4 h-4 bg-amber-500 text-black text-[10px] font-bold rounded-full flex items-center justify-center">
      {itemCount > 9 ? '9+' : itemCount}
    </span>
  )
}
