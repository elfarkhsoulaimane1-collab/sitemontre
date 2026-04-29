'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import ProductCard from '@/components/ProductCard'
import { Product, CollectionData } from '@/types'

interface Props {
  products:        Product[]
  collections:     CollectionData[]
  initialCategory: string
}

const DEFAULT_SORTS = [
  { value: 'default',    label: 'Recommandés'    },
  { value: 'price-asc',  label: 'Prix croissant'  },
  { value: 'price-desc', label: 'Prix décroissant' },
  { value: 'rating',     label: 'Mieux notés'      },
]

export default function CollectionClient({ products, collections, initialCategory }: Props) {
  const router = useRouter()
  const [activeCategory, setActiveCategory] = useState(initialCategory)
  const [sort, setSort] = useState('default')

  function setCategory(cat: string) {
    setActiveCategory(cat)
    if (cat === 'all') {
      router.push('/collection', { scroll: false })
    } else {
      router.push(`/collection?category=${cat}`, { scroll: false })
    }
  }

  const filtered = useMemo(() => {
    let list = [...products]
    if (activeCategory !== 'all') {
      list = list.filter((p) => (p.collectionSlug ?? p.category) === activeCategory)
    }
    switch (sort) {
      case 'price-asc':  list.sort((a, b) => a.price - b.price);  break
      case 'price-desc': list.sort((a, b) => b.price - a.price);  break
      case 'rating':     list.sort((a, b) => b.rating - a.rating); break
    }
    return list
  }, [products, activeCategory, sort])

  const categoryTabs = [
    { value: 'all', label: 'Tout' },
    ...Array.from(
      new Map(collections.map(({ value, label }) => [value, { value, label }])).values()
    ),
  ]

  const PAGE_TITLES: Record<string, string> = {
    'montres-femmes': 'Montres Femme au Maroc',
    'montres-hommes': 'Montres Homme au Maroc',
  }
  const pageTitle = PAGE_TITLES[activeCategory] ?? 'Notre Collection'

  const BOTTOM_DESCRIPTIONS: Record<string, string> = {
    'montres-femmes': 'Trouvez la montre femme idéale au Maroc parmi notre sélection premium. Paiement à la réception, livraison rapide dans tout le pays.',
    'montres-hommes': 'Commandez votre montre homme au Maroc en toute confiance — livraison gratuite, paiement à la livraison, retour sous 7 jours.',
  }
  const bottomDescription = BOTTOM_DESCRIPTIONS[activeCategory] ?? activeDescription

  const activeCollection = activeCategory !== 'all'
    ? collections.find(c => c.value === activeCategory || c.slug === activeCategory)
    : undefined
  const activeDescription = activeCollection?.description ?? undefined

  return (
    <>
      {/* Page header */}
      <div className="pt-12 pb-12 px-4 sm:px-6 lg:px-8 bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto">
          <p className="text-gold text-xs uppercase tracking-[0.4em] mb-3">Maison du Prestige</p>
          <h1 className="font-serif text-4xl sm:text-5xl text-neutral-900 font-bold">{pageTitle}</h1>
          <p className="text-neutral-500 mt-3 text-sm max-w-md">
            {filtered.length} montre{filtered.length !== 1 ? 's' : ''} —
            livraison gratuite, paiement à la livraison.
          </p>
        </div>
      </div>

      {activeDescription && (
        <section className="bg-white border-b border-stone-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
            <p className="text-stone-600 text-sm md:text-base leading-relaxed">
              {activeDescription}
            </p>
          </div>
        </section>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Filters + Sort */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer par catégorie">
            {categoryTabs.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setCategory(value)}
                aria-pressed={activeCategory === value}
                className={`text-xs uppercase tracking-widest px-4 py-2 border transition-all duration-200 ${
                  activeCategory === value
                    ? 'bg-neutral-900 border-neutral-900 text-white font-bold'
                    : 'border-stone-300 text-neutral-600 hover:border-neutral-900 hover:text-neutral-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <label className="sr-only" htmlFor="sort-select">Trier par</label>
          <select
            id="sort-select"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-white border border-stone-300 text-neutral-700 text-xs px-4 py-2 focus:outline-none focus:border-gold cursor-pointer"
          >
            {DEFAULT_SORTS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {/* Grid — pre-rendered with server-filtered products for Googlebot */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((product, i) => (
              <ProductCard
                key={product.id}
                product={product}
                sizes="(max-width: 767px) 50vw, (max-width: 1023px) 33vw, 25vw"
                priority={i < 4}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-24">
            <p className="text-neutral-400 text-sm">Aucune montre dans cette catégorie.</p>
            <button
              onClick={() => setCategory('all')}
              className="text-gold text-xs uppercase tracking-widest mt-4 hover:text-gold-dark transition-colors"
            >
              Voir toute la collection →
            </button>
          </div>
        )}
      </div>

      {bottomDescription && (
        <section className="bg-white border-t border-stone-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
            <p className="text-stone-500 text-xs md:text-sm leading-relaxed">
              {bottomDescription}
            </p>
          </div>
        </section>
      )}
    </>
  )
}
