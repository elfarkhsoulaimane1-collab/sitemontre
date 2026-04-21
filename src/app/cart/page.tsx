'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { useCart } from '@/context/CartContext'
import { imageUrl } from '@/sanity/lib/image'

export default function CartPage() {
  const { items, removeItem, updateQuantity, total, clearCart } = useCart()
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({})

  const SHIPPING_THRESHOLD = 500
  const shipping = total >= SHIPPING_THRESHOLD ? 0 : 50
  const orderTotal = total + shipping

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <div className="w-20 h-20 border-2 border-stone-200 rounded-full flex items-center justify-center mb-8">
          <svg
            className="w-8 h-8 text-stone-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z"
            />
          </svg>
        </div>
        <h1 className="font-serif text-3xl text-neutral-900 mb-3">Votre panier est vide</h1>
        <p className="text-neutral-500 text-sm mb-8">
          Découvrez notre collection et trouvez la montre qui vous correspond.
        </p>
        <Link href="/collection" className="btn-dark">
          Voir la collection
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-12 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="font-serif text-4xl text-neutral-900 font-bold">Votre Panier</h1>
          <p className="text-neutral-500 text-sm mt-2">
            {items.reduce((s, i) => s + i.quantity, 0)} article(s)
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const imgSrc = imageUrl(item.product.images[0], 224)
              const hasError = imgErrors[item.product.id]

              return (
                <div
                  key={item.product.id}
                  className="flex gap-5 p-5 bg-white border border-stone-200 shadow-luxury"
                >
                  {/* Image */}
                  <Link
                    href={`/product/${item.product.slug}`}
                    className="relative w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 bg-stone-100 overflow-hidden"
                  >
                    {!hasError && imgSrc ? (
                      <Image
                        src={imgSrc}
                        alt={item.product.name}
                        fill
                        unoptimized
                        className="object-cover"
                        sizes="112px"
                        onError={() =>
                          setImgErrors((prev) => ({ ...prev, [item.product.id]: true }))
                        }
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg
                          className="w-8 h-8 text-stone-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={1}
                        >
                          <circle cx="12" cy="12" r="7" />
                          <path d="M12 9v3l2 2" strokeLinecap="round" />
                        </svg>
                      </div>
                    )}
                  </Link>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-1">
                          {item.product.brand}
                        </p>
                        <Link
                          href={`/product/${item.product.slug}`}
                          className="font-serif text-lg text-neutral-900 hover:text-gold transition-colors duration-200"
                        >
                          {item.product.name}
                        </Link>
                      </div>
                      <button
                        onClick={() => removeItem(item.product.id)}
                        className="text-stone-300 hover:text-red-400 transition-colors duration-200 flex-shrink-0"
                        aria-label="Supprimer"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      {/* Quantity */}
                      <div className="flex items-center border border-stone-200">
                        <button
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity - 1)
                          }
                          className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-neutral-900 hover:bg-stone-50 transition-colors"
                        >
                          −
                        </button>
                        <span className="w-10 h-8 flex items-center justify-center text-sm text-neutral-900 border-x border-stone-200">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity + 1)
                          }
                          className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-neutral-900 hover:bg-stone-50 transition-colors"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right">
                        <p className="font-bold text-neutral-900">
                          {(item.product.price * item.quantity).toLocaleString('fr-MA')}{' '}
                          MAD
                        </p>
                        {item.quantity > 1 && (
                          <p className="text-neutral-400 text-xs">
                            {item.product.price.toLocaleString('fr-MA')} MAD / pièce
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={clearCart}
                className="text-neutral-400 text-xs uppercase tracking-widest hover:text-red-500 transition-colors duration-200"
              >
                Vider le panier
              </button>
              <Link
                href="/collection"
                className="text-neutral-500 text-xs uppercase tracking-widest hover:text-gold transition-colors duration-200"
              >
                ← Continuer mes achats
              </Link>
            </div>
          </div>

          {/* Order summary */}
          <div className="space-y-4">
            <div className="bg-white border border-stone-200 shadow-luxury p-6 space-y-5">
              <h2 className="font-serif text-xl text-neutral-900">Récapitulatif</h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Sous-total</span>
                  <span className="text-neutral-900">{total.toLocaleString('fr-MA')} MAD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Livraison</span>
                  <span className={shipping === 0 ? 'text-green-600 font-medium' : 'text-neutral-900'}>
                    {shipping === 0
                      ? 'Gratuite'
                      : `${shipping.toLocaleString('fr-MA')} MAD`}
                  </span>
                </div>

                {shipping > 0 && (
                  <div className="text-xs text-neutral-500 bg-stone-50 px-3 py-2 border border-stone-200">
                    Encore{' '}
                    <span className="text-gold font-medium">
                      {(SHIPPING_THRESHOLD - total).toLocaleString('fr-MA')} MAD
                    </span>{' '}
                    pour la livraison gratuite
                  </div>
                )}

                <div className="pt-3 border-t border-stone-200 flex justify-between items-baseline">
                  <span className="font-bold text-neutral-900">Total</span>
                  <span className="font-serif text-2xl text-neutral-900">
                    {orderTotal.toLocaleString('fr-MA')} MAD
                  </span>
                </div>
              </div>

              <Link href="/checkout" className="btn-dark w-full text-center">
                Commander — Paiement à la livraison
              </Link>

              {/* WhatsApp order */}
              <a
                href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '212600000000'}?text=${encodeURIComponent(
                  `Bonjour Maison du Prestige 👋\nJe souhaite commander :\n${items
                    .map(
                      (i) =>
                        `• ${i.product.name} ×${i.quantity} — ${(
                          i.product.price * i.quantity
                        ).toLocaleString('fr-MA')} MAD`
                    )
                    .join('\n')}\n\nTotal: ${orderTotal.toLocaleString('fr-MA')} MAD`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-green-700 text-white text-xs font-bold uppercase tracking-widest hover:bg-green-600 transition-colors duration-200"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Commander via WhatsApp
              </a>
            </div>

            {/* Trust */}
            <div className="bg-white border border-stone-200 shadow-luxury p-5 space-y-3">
              {[
                '🔒 Commande 100% sécurisée',
                '🚚 Livraison gratuite partout au Maroc',
                '💵 Payez uniquement à la réception',
                '↩ Retours acceptés sous 7 jours',
              ].map((t) => (
                <p key={t} className="text-neutral-500 text-xs flex items-start gap-2">
                  {t}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
