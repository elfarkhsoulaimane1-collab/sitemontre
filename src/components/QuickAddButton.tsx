'use client'

import { memo, useState } from 'react'
import { useCart } from '@/context/CartContext'
import { Product } from '@/types'

function QuickAddButton({ product }: { product: Product }) {
  const { addItem } = useCart()
  const [adding, setAdding] = useState(false)

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setAdding(true)
    addItem(product)
    setTimeout(() => setAdding(false), 1200)
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
      <button
        onClick={handleClick}
        className={`w-full py-3 text-xs font-bold uppercase tracking-widest transition-colors duration-200 ${
          adding ? 'bg-green-600 text-white' : 'bg-amber-500 text-black hover:bg-amber-400'
        }`}
      >
        {adding ? '✓ Ajouté' : 'Ajouter au panier'}
      </button>
    </div>
  )
}

// memo: only re-renders when the product prop changes — not on every cart update
export default memo(QuickAddButton)
