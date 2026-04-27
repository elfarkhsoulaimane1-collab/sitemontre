'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Product } from '@/types'
import { imageUrl } from '@/sanity/lib/image'
import ProductImageWatermark from '@/components/ProductImageWatermark'

export default function RelatedCard({ product }: { product: Product }) {
  const img      = imageUrl(product.images?.[0], 400)
  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null

  console.log('[RelatedCard] img:', imageUrl(product.images?.[0], 400))

  return (
    <Link href={`/product/${product.slug}`} className="group relative block aspect-[3/4] overflow-hidden bg-neutral-900">
      {img && (
        <Image src={img} alt={product.name ?? ''} fill
          className="object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/95 via-neutral-950/20 to-transparent group-hover:from-neutral-950/80 transition-all duration-700" />
      <ProductImageWatermark />

      {product.badge && (
        <span className="absolute top-3 left-3 text-[9px] font-bold uppercase tracking-widest bg-gold text-black px-2 py-0.5 z-10">
          {product.badge}
        </span>
      )}

      <div className="absolute bottom-0 inset-x-0 p-5 z-10">
        <div className="h-px bg-gold/60 w-0 group-hover:w-full transition-[width] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] mb-3" />
        <p className="text-[9px] uppercase tracking-[0.4em] text-gold/60 mb-1 group-hover:text-gold/90 transition-colors duration-500">{product.brand}</p>
        <h3 className="font-serif text-[1.05rem] text-white font-bold leading-tight mb-2">{product.name}</h3>
        <div className="flex items-center gap-2">
          <span className="text-white font-bold text-sm">{product.price.toLocaleString('fr-MA')} MAD</span>
          {discount && <span className="text-red-400 text-[10px] font-bold">−{discount}%</span>}
        </div>
      </div>
    </Link>
  )
}
