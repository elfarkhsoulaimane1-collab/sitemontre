// Server component — no 'use client'. Renders as pure HTML/CSS with zero
// client-side JS. Only QuickAddButton (the hover CTA) is hydrated.
import Link from 'next/link'
import { Product } from '@/types'
import { imageUrl } from '@/sanity/lib/image'
import QuickAddButton from './QuickAddButton'
import ProductImageWatermark from './ProductImageWatermark'

interface Props {
  product:   Product
  sizes?:    string
  priority?: boolean
}

const BADGE_STYLES: Record<string, string> = {
  Bestseller: 'bg-gold text-black',
  New:        'bg-neutral-900 text-white',
  Sale:       'bg-red-600 text-white',
  Limited:    'bg-neutral-900 text-gold border border-gold',
}

export default function ProductCard({
  product,
  sizes    = '(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 25vw',
  priority = false,
}: Props) {
  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null

  const img = imageUrl(product.images?.[0], 600)

  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div className="relative overflow-hidden bg-stone-100 aspect-square">
        {img && (
          <img
            src={img}
            alt={product.name}
            {...(priority ? { fetchPriority: 'high' } : { loading: 'lazy' })}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        )}

        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {product.badge && (
          <span className={`absolute top-3 left-3 text-[10px] font-bold uppercase tracking-widest px-2 py-1 ${BADGE_STYLES[product.badge] ?? 'bg-neutral-900 text-white'}`}>
            {product.badge}
            {discount && product.badge === 'Sale' ? ` −${discount}%` : null}
          </span>
        )}

        <ProductImageWatermark />
        <QuickAddButton product={product} />
      </div>

      <div className="mt-4 space-y-1">
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-400">
            {product.brand}
          </p>
          <div className="flex items-center gap-1">
            <StarIcon />
            <span className="text-[10px] text-neutral-500">
              {product.rating} ({product.reviews})
            </span>
          </div>
        </div>

        <h3 className="font-serif text-lg text-neutral-900 group-hover:text-gold transition-colors duration-300">
          {product.name}
        </h3>

        <p className="text-xs text-neutral-500">{product.description}</p>

        <div className="flex items-center gap-3 pt-1">
          <span className="font-bold text-neutral-900 text-base">
            {product.price.toLocaleString('fr-MA')} MAD
          </span>
          {product.originalPrice && (
            <span className="text-sm text-neutral-400 line-through">
              {product.originalPrice.toLocaleString('fr-MA')} MAD
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

function StarIcon() {
  return (
    <svg className="w-3 h-3 text-gold" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  )
}
